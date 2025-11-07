/**
 * DecisionEngine Unit Tests
 *
 * Tests for autonomous decision making with confidence-based escalation.
 * Tests all 8 acceptance criteria for Story 2.1.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { LLMClient } from '../../src/llm/LLMClient.interface.js';
import { LLMConfig, InvokeOptions } from '../../src/types/llm.types.js';
import * as fs from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises');

describe('DecisionEngine', () => {
  let decisionEngine: DecisionEngine;
  let mockLLMFactory: LLMFactory;
  let mockLLMClient: LLMClient;
  let llmConfig: LLMConfig;

  beforeEach(() => {
    // Create mock LLM client with default response
    mockLLMClient = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      invoke: vi.fn().mockResolvedValue(JSON.stringify({
        decision: 'default answer',
        confidence: 0.7,
        reasoning: 'default reasoning'
      })),
      stream: vi.fn(),
      estimateCost: vi.fn().mockReturnValue(0.01),
      getTokenUsage: vi.fn().mockReturnValue({
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
      })
    };

    // Create mock LLM factory
    mockLLMFactory = {
      createClient: vi.fn().mockResolvedValue(mockLLMClient),
      registerProvider: vi.fn(),
      validateModel: vi.fn().mockReturnValue(true),
      getAvailableProviders: vi.fn().mockReturnValue(['anthropic', 'openai']),
      getSupportedModels: vi.fn().mockReturnValue(['claude-sonnet-4-5']),
      getLogger: vi.fn()
    } as unknown as LLMFactory;

    // LLM config
    llmConfig = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5'
    };

    // Create DecisionEngine instance
    decisionEngine = new DecisionEngine(
      mockLLMFactory,
      llmConfig,
      '.bmad/onboarding-test'
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('AC #1: DecisionEngine class with confidence scoring', () => {
    it('should create DecisionEngine instance successfully', () => {
      expect(decisionEngine).toBeInstanceOf(DecisionEngine);
    });

    it('should have ESCALATION_THRESHOLD set to 0.75', () => {
      expect(DecisionEngine.getEscalationThreshold()).toBe(0.75);
    });

    it('should accept LLMFactory and LLMConfig in constructor', () => {
      const engine = new DecisionEngine(mockLLMFactory, llmConfig);
      expect(engine).toBeInstanceOf(DecisionEngine);
    });

    it('should accept custom onboarding path', () => {
      const engine = new DecisionEngine(mockLLMFactory, llmConfig, '/custom/path');
      expect(engine).toBeInstanceOf(DecisionEngine);
    });
  });

  describe('AC #2: attemptAutonomousDecision returns Decision with confidence', () => {
    it('should return Decision object with all required fields', async () => {
      // Mock LLM response
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'yes',
        confidence: 0.8,
        reasoning: 'Clear answer based on context'
      }));

      // Mock no onboarding docs
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Should we proceed?',
        { project: 'agent-orchestrator' }
      );

      expect(decision).toHaveProperty('question');
      expect(decision).toHaveProperty('decision');
      expect(decision).toHaveProperty('confidence');
      expect(decision).toHaveProperty('reasoning');
      expect(decision).toHaveProperty('source');
      expect(decision).toHaveProperty('timestamp');
      expect(decision).toHaveProperty('context');
    });

    it('should return confidence as number between 0 and 1', async () => {
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'yes',
        confidence: 0.85,
        reasoning: 'High confidence answer'
      }));

      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Is this correct?',
        {}
      );

      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(typeof decision.confidence).toBe('number');
    });

    it('should populate question field correctly', async () => {
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.7,
        reasoning: 'reasoning'
      }));

      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      const question = 'What is the best approach?';
      const decision = await decisionEngine.attemptAutonomousDecision(question, {});

      expect(decision.question).toBe(question);
    });
  });

  describe('AC #3: Check onboarding docs first (confidence 0.95)', () => {
    it('should return confidence 0.95 when onboarding doc answer found', async () => {
      // Mock onboarding directory exists
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);

      // Mock onboarding file exists
      vi.mocked(fs.readdir).mockResolvedValue(['setup.md'] as any);
      vi.mocked(fs.readFile).mockResolvedValue('How to set up the project: Run npm install');

      const decision = await decisionEngine.attemptAutonomousDecision(
        'How do I set up the project?',
        {}
      );

      expect(decision.source).toBe('onboarding');
      expect(decision.confidence).toBe(0.95);
    });

    it('should return null when no onboarding docs found', async () => {
      // Mock onboarding directory doesn't exist
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      // Should fall back to LLM
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'fallback answer',
        confidence: 0.6,
        reasoning: 'No onboarding docs available'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Some question',
        {}
      );

      expect(decision.source).toBe('llm');
      expect(decision.confidence).not.toBe(0.95);
    });

    it('should handle missing onboarding directory gracefully', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.7,
        reasoning: 'reasoning'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Test question',
        {}
      );

      expect(decision.source).toBe('llm');
      // Should not throw error, should fall back to LLM
    });

    it('should only process markdown files from onboarding directory', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);

      vi.mocked(fs.readdir).mockResolvedValue(['doc.md', 'image.png', 'script.sh'] as any);
      vi.mocked(fs.readFile).mockResolvedValue('Onboarding content with relevant keywords question');

      // readFile should only be called for .md files
      await decisionEngine.attemptAutonomousDecision('relevant keywords question', {});

      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC #4: Use LLM reasoning with temperature 0.3', () => {
    it('should create LLM client with temperature 0.3', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.7,
        reasoning: 'reasoning'
      }));

      await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Verify invoke was called with temperature 0.3
      expect(mockLLMClient.invoke).toHaveBeenCalled();
      const invokeCall = vi.mocked(mockLLMClient.invoke).mock.calls[0];
      const options = invokeCall[1] as InvokeOptions;

      expect(options).toBeDefined();
      expect(options.temperature).toBe(0.3);
    });

    it('should use LLM for decision when onboarding docs not found', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'llm decision',
        confidence: 0.8,
        reasoning: 'llm reasoning'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Question without onboarding docs?',
        { key: 'value' }
      );

      expect(mockLLMClient.invoke).toHaveBeenCalled();
      expect(decision.source).toBe('llm');
    });

    it('should call createClient on LLMFactory', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.7,
        reasoning: 'reasoning'
      }));

      await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(mockLLMFactory.createClient).toHaveBeenCalledWith(llmConfig);
    });
  });

  describe('AC #5: Assess confidence based on answer clarity and context sufficiency', () => {
    it('should increase confidence for high certainty indicators', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'definitely yes',
        confidence: 0.6,
        reasoning: 'I am clearly certain about this answer'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Confidence should be adjusted upward for certainty indicators
      expect(decision.confidence).toBeGreaterThan(0.6);
    });

    it('should decrease confidence for low certainty indicators', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'maybe',
        confidence: 0.7,
        reasoning: 'I am unsure and might need more information'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Confidence should be adjusted downward for uncertainty indicators
      expect(decision.confidence).toBeLessThan(0.7);
    });

    it('should decrease confidence when context is insufficient', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.8,
        reasoning: 'I need more context and missing information to decide'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Confidence should be decreased when missing context is mentioned
      expect(decision.confidence).toBeLessThan(0.8);
    });

    it('should handle unparseable LLM response', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue('This is definitely a clear answer');

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Should fall back to text analysis
      expect(decision.confidence).toBeGreaterThanOrEqual(0.3);
      expect(decision.confidence).toBeLessThanOrEqual(0.9);
    });

    it('should constrain confidence to 0.3-0.9 range for LLM decisions', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));

      // Test with very high confidence
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 1.5,  // Invalid high value
        reasoning: 'reasoning'
      }));

      let decision = await decisionEngine.attemptAutonomousDecision('Question?', {});
      expect(decision.confidence).toBeLessThanOrEqual(0.9);

      // Test with very low confidence
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: -0.5,  // Invalid low value
        reasoning: 'reasoning'
      }));

      decision = await decisionEngine.attemptAutonomousDecision('Question?', {});
      expect(decision.confidence).toBeGreaterThanOrEqual(0.3);
    });
  });

  describe('AC #6: Escalate if confidence < 0.75', () => {
    it('should mark for escalation when confidence < 0.75', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'uncertain answer',
        confidence: 0.6,
        reasoning: 'Not enough information'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.confidence).toBeLessThan(0.75);
      expect(decision.reasoning).toContain('ESCALATION REQUIRED');
    });

    it('should not escalate when confidence >= 0.75', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'confident answer',
        confidence: 0.85,
        reasoning: 'Clear reasoning'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.confidence).toBeGreaterThanOrEqual(0.75);
      expect(decision.reasoning).not.toContain('ESCALATION REQUIRED');
    });

    it('should not escalate for onboarding doc answers (confidence 0.95)', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);
      vi.mocked(fs.readdir).mockResolvedValue(['doc.md'] as any);
      vi.mocked(fs.readFile).mockResolvedValue('Answer to the keywords question here');

      const decision = await decisionEngine.attemptAutonomousDecision(
        'keywords question here answer',
        {}
      );

      expect(decision.confidence).toBe(0.95);
      expect(decision.reasoning).not.toContain('ESCALATION REQUIRED');
    });

    it('should include confidence threshold in escalation message', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'low confidence',
        confidence: 0.5,
        reasoning: 'Uncertain'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.reasoning).toContain('0.75');
      expect(decision.reasoning).toMatch(/confidence.*0\.\d+.*threshold/i);
    });
  });

  describe('AC #7: Return decision value and reasoning for audit trail', () => {
    it('should include reasoning in Decision object', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      const expectedReasoning = 'This is the detailed reasoning for the decision';

      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'yes',
        confidence: 0.8,
        reasoning: expectedReasoning
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.reasoning).toContain(expectedReasoning);
      expect(decision.reasoning.length).toBeGreaterThan(0);
    });

    it('should include decision value', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      const expectedDecision = 'proceed with implementation';

      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: expectedDecision,
        confidence: 0.8,
        reasoning: 'reasoning'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.decision).toBe(expectedDecision);
    });

    it('should provide reasoning for onboarding doc decisions', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);
      vi.mocked(fs.readdir).mockResolvedValue(['setup.md'] as any);
      vi.mocked(fs.readFile).mockResolvedValue('Setup instructions for question');

      const decision = await decisionEngine.attemptAutonomousDecision(
        'setup instructions question',
        {}
      );

      expect(decision.reasoning).toContain('onboarding documentation');
      expect(decision.reasoning).toContain('setup.md');
    });
  });

  describe('AC #8: Track question, decision, confidence, reasoning, outcome', () => {
    it('should populate all Decision fields', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'test decision',
        confidence: 0.8,
        reasoning: 'test reasoning'
      }));

      const question = 'Test question?';
      const context = { key1: 'value1', key2: 42 };

      const decision = await decisionEngine.attemptAutonomousDecision(question, context);

      // Question
      expect(decision.question).toBe(question);

      // Decision
      expect(decision.decision).toBeDefined();
      expect(decision.decision).toBe('test decision');

      // Confidence
      expect(decision.confidence).toBeDefined();
      expect(typeof decision.confidence).toBe('number');

      // Reasoning
      expect(decision.reasoning).toBeDefined();
      expect(decision.reasoning.length).toBeGreaterThan(0);

      // Source (outcome indicator)
      expect(decision.source).toBeDefined();
      expect(['onboarding', 'llm']).toContain(decision.source);

      // Timestamp
      expect(decision.timestamp).toBeDefined();
      expect(decision.timestamp).toBeInstanceOf(Date);

      // Context
      expect(decision.context).toBeDefined();
      expect(decision.context).toEqual(context);
    });

    it('should set timestamp to current time', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.8,
        reasoning: 'reasoning'
      }));

      const beforeTime = new Date();
      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});
      const afterTime = new Date();

      expect(decision.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(decision.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should preserve context in Decision object', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.8,
        reasoning: 'reasoning'
      }));

      const context = {
        projectName: 'agent-orchestrator',
        story: '2.1',
        user: 'developer'
      };

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', context);

      expect(decision.context).toEqual(context);
      expect(decision.context.projectName).toBe('agent-orchestrator');
    });

    it('should set source to "onboarding" for onboarding doc decisions', async () => {
      vi.mocked(fs.stat).mockResolvedValue({
        isDirectory: () => true
      } as any);
      vi.mocked(fs.readdir).mockResolvedValue(['doc.md'] as any);
      vi.mocked(fs.readFile).mockResolvedValue('Documentation content for question');

      const decision = await decisionEngine.attemptAutonomousDecision(
        'documentation content question',
        {}
      );

      expect(decision.source).toBe('onboarding');
    });

    it('should set source to "llm" for LLM-based decisions', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.8,
        reasoning: 'reasoning'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.source).toBe('llm');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty question', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'no question',
        confidence: 0.5,
        reasoning: 'Empty question provided'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('', {});

      expect(decision.question).toBe('');
      expect(decision).toHaveProperty('decision');
    });

    it('should handle empty context', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 0.7,
        reasoning: 'No context provided'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      expect(decision.context).toEqual({});
    });

    it('should handle malformed JSON in LLM response', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue('This is not JSON{incomplete');

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Should fall back to text analysis
      expect(decision.decision).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0.3);
    });

    it('should handle confidence value out of range', async () => {
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(mockLLMClient.invoke).mockResolvedValue(JSON.stringify({
        decision: 'answer',
        confidence: 5.0,  // Way out of range
        reasoning: 'reasoning'
      }));

      const decision = await decisionEngine.attemptAutonomousDecision('Question?', {});

      // Should be constrained to valid range
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });
  });
});
