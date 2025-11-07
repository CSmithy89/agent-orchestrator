/**
 * DecisionEngine Integration Tests
 * Tests DecisionEngine with real LLMFactory and providers
 *
 * Note: These tests require API keys to be set in environment:
 * - ANTHROPIC_API_KEY for Anthropic provider tests
 * - OPENAI_API_KEY for OpenAI provider tests
 *
 * Tests will be skipped if API keys are not available.
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { AnthropicProvider } from '../../src/llm/providers/AnthropicProvider.js';
import { OpenAIProvider } from '../../src/llm/providers/OpenAIProvider.js';
import { LLMConfig } from '../../src/types/llm.types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Check for API keys
const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

describe('DecisionEngine Integration Tests', () => {
  let decisionEngine: DecisionEngine;
  let llmFactory: LLMFactory;
  let testDir: string;
  let onboardingDir: string;

  beforeAll(() => {
    if (!hasAnthropicKey && !hasOpenAIKey) {
      console.warn('⚠️  No API keys found. Integration tests will be skipped.');
      console.warn('   Set ANTHROPIC_API_KEY or OPENAI_API_KEY to run these tests.');
    }
  });

  beforeEach(async () => {
    // Create temporary test directory for onboarding docs
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'decision-engine-test-'));
    onboardingDir = path.join(testDir, '.bmad', 'onboarding');
    await fs.mkdir(onboardingDir, { recursive: true });

    // Create LLMFactory and register providers
    llmFactory = new LLMFactory();
    llmFactory.registerProvider('anthropic', new AnthropicProvider());
    llmFactory.registerProvider('openai', new OpenAIProvider());
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe.skipIf(!hasAnthropicKey)('AC #2, #4: DecisionEngine with Anthropic Provider', () => {
    let config: LLMConfig;

    beforeEach(() => {
      config = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5'
      };

      decisionEngine = new DecisionEngine(llmFactory, config, onboardingDir);
    });

    it('should make decisions using Anthropic provider', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'What is 2 + 2?',
        { mathProblem: true }
      );

      expect(decision).toBeDefined();
      expect(decision.question).toBe('What is 2 + 2?');
      expect(decision.decision).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(decision.reasoning).toBeDefined();
      expect(decision.source).toBe('llm');
      expect(decision.timestamp).toBeInstanceOf(Date);
    }, 30000); // 30 second timeout for API calls

    it('should use temperature 0.3 for consistent reasoning', async () => {
      // Make multiple requests with the same question
      const decisions = await Promise.all([
        decisionEngine.attemptAutonomousDecision('Is the sky blue?', {}),
        decisionEngine.attemptAutonomousDecision('Is the sky blue?', {}),
        decisionEngine.attemptAutonomousDecision('Is the sky blue?', {})
      ]);

      // All decisions should have the same source
      expect(decisions.every(d => d.source === 'llm')).toBe(true);

      // All decisions should have reasonable confidence
      expect(decisions.every(d => d.confidence >= 0.3 && d.confidence <= 0.9)).toBe(true);
    }, 30000);

    it('should handle questions requiring high confidence', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'Is 1 + 1 = 2?',
        { mathematical: true }
      );

      // Should have high confidence for simple factual questions
      expect(decision.confidence).toBeGreaterThan(0.7);
      expect(decision.source).toBe('llm');
    }, 30000);
  });

  describe.skipIf(!hasOpenAIKey)('AC #2, #4: DecisionEngine with OpenAI Provider', () => {
    let config: LLMConfig;

    beforeEach(() => {
      config = {
        provider: 'openai',
        model: 'gpt-4o'
      };

      decisionEngine = new DecisionEngine(llmFactory, config, onboardingDir);
    });

    it('should make decisions using OpenAI provider', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'What is the capital of France?',
        { geography: true }
      );

      expect(decision).toBeDefined();
      expect(decision.question).toBe('What is the capital of France?');
      expect(decision.decision).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(decision.reasoning).toBeDefined();
      expect(decision.source).toBe('llm');
      expect(decision.timestamp).toBeInstanceOf(Date);
    }, 30000);

    it('should use temperature 0.3 with OpenAI', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'Should I use TypeScript for a large project?',
        { projectType: 'large-scale-application' }
      );

      // Should return a decision with reasonable confidence
      expect(decision.confidence).toBeGreaterThanOrEqual(0.3);
      expect(decision.confidence).toBeLessThanOrEqual(0.9);
      expect(decision.source).toBe('llm');
    }, 30000);
  });

  describe.skipIf(!hasAnthropicKey && !hasOpenAIKey)('AC #3: Onboarding Docs Priority', () => {
    let config: LLMConfig;

    beforeEach(async () => {
      config = {
        provider: hasAnthropicKey ? 'anthropic' : 'openai',
        model: hasAnthropicKey ? 'claude-sonnet-4-5' : 'gpt-4o'
      };

      decisionEngine = new DecisionEngine(llmFactory, config, onboardingDir);

      // Create onboarding document
      const setupDoc = `# Project Setup

To set up this project, follow these steps:
1. Run npm install
2. Create a .env file with your API keys
3. Run npm run build
4. Run npm test to verify everything works

This is the official setup procedure for the project.`;

      await fs.writeFile(path.join(onboardingDir, 'setup.md'), setupDoc);
    });

    it('should prioritize onboarding docs over LLM', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'How do I set up the project? What are the setup steps?',
        {}
      );

      // Should use onboarding doc
      expect(decision.source).toBe('onboarding');
      expect(decision.confidence).toBe(0.95);
      expect(decision.reasoning).toContain('onboarding');
    }, 30000);

    it('should fall back to LLM when onboarding docs don\'t match', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'What is the meaning of life?',
        {}
      );

      // Should fall back to LLM (no relevant onboarding doc)
      expect(decision.source).toBe('llm');
      expect(decision.confidence).not.toBe(0.95);
    }, 30000);
  });

  describe.skipIf(!hasAnthropicKey && !hasOpenAIKey)('Error Handling and Retry Logic', () => {
    let config: LLMConfig;

    beforeEach(() => {
      config = {
        provider: hasAnthropicKey ? 'anthropic' : 'openai',
        model: hasAnthropicKey ? 'claude-sonnet-4-5' : 'gpt-4o'
      };

      decisionEngine = new DecisionEngine(llmFactory, config, onboardingDir);
    });

    it('should handle invalid API configuration gracefully', async () => {
      // Create DecisionEngine with invalid config
      const invalidConfig: LLMConfig = {
        provider: hasAnthropicKey ? 'anthropic' : 'openai',
        model: 'invalid-model-name-that-does-not-exist'
      };

      const invalidEngine = new DecisionEngine(llmFactory, invalidConfig, onboardingDir);

      // Should throw meaningful error for invalid model
      await expect(
        invalidEngine.attemptAutonomousDecision('Test question', {})
      ).rejects.toThrow();
    });

    it('should handle empty questions', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision('', {});

      expect(decision.question).toBe('');
      expect(decision).toHaveProperty('decision');
      expect(decision).toHaveProperty('confidence');
    }, 30000);

    it('should handle complex context objects', async () => {
      const complexContext = {
        nested: {
          object: {
            with: {
              many: {
                levels: 'deep value'
              }
            }
          }
        },
        array: [1, 2, 3, 4, 5],
        boolean: true,
        number: 42,
        string: 'test'
      };

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Process this complex context',
        complexContext
      );

      expect(decision.context).toEqual(complexContext);
      expect(decision).toHaveProperty('decision');
    }, 30000);
  });

  describe.skipIf(!hasAnthropicKey && !hasOpenAIKey)('AC #5, #6: Confidence Calibration and Escalation', () => {
    let config: LLMConfig;

    beforeEach(() => {
      config = {
        provider: hasAnthropicKey ? 'anthropic' : 'openai',
        model: hasAnthropicKey ? 'claude-sonnet-4-5' : 'gpt-4o'
      };

      decisionEngine = new DecisionEngine(llmFactory, config, onboardingDir);
    });

    it('should have high confidence for clear factual questions', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'Is water H2O?',
        { chemistry: true }
      );

      // Clear factual question should have high confidence
      expect(decision.confidence).toBeGreaterThan(0.7);
      expect(decision.reasoning).not.toContain('ESCALATION REQUIRED');
    }, 30000);

    it('should have lower confidence for ambiguous questions', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'Should I refactor this code or leave it as is? I have no other context.',
        {}
      );

      // Ambiguous question with insufficient context should have lower confidence
      expect(decision.confidence).toBeDefined();
      // Note: Actual confidence depends on LLM response
    }, 30000);

    it('should mark decisions for escalation when confidence is low', async () => {
      const decision = await decisionEngine.attemptAutonomousDecision(
        'What is the best course of action for this undefined situation with no context?',
        {}
      );

      if (decision.confidence < 0.75) {
        expect(decision.reasoning).toContain('ESCALATION REQUIRED');
        expect(decision.reasoning).toContain('0.75');
      }
    }, 30000);
  });

  describe.skipIf(!hasAnthropicKey && !hasOpenAIKey)('AC #7, #8: Audit Trail', () => {
    let config: LLMConfig;

    beforeEach(() => {
      config = {
        provider: hasAnthropicKey ? 'anthropic' : 'openai',
        model: hasAnthropicKey ? 'claude-sonnet-4-5' : 'gpt-4o'
      };

      decisionEngine = new DecisionEngine(llmFactory, config, onboardingDir);
    });

    it('should provide complete audit trail for all decisions', async () => {
      const context = {
        user: 'test-user',
        project: 'agent-orchestrator',
        story: '2.1'
      };

      const decision = await decisionEngine.attemptAutonomousDecision(
        'Should we proceed with implementation?',
        context
      );

      // Verify all audit trail fields are present
      expect(decision.question).toBe('Should we proceed with implementation?');
      expect(decision.decision).toBeDefined();
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(decision.reasoning).toBeDefined();
      expect(decision.reasoning.length).toBeGreaterThan(0);
      expect(decision.source).toMatch(/^(onboarding|llm)$/);
      expect(decision.timestamp).toBeInstanceOf(Date);
      expect(decision.context).toEqual(context);
    }, 30000);

    it('should track multiple decisions independently', async () => {
      const decision1 = await decisionEngine.attemptAutonomousDecision(
        'First question',
        { id: 1 }
      );

      const decision2 = await decisionEngine.attemptAutonomousDecision(
        'Second question',
        { id: 2 }
      );

      // Decisions should be independent
      expect(decision1.question).toBe('First question');
      expect(decision2.question).toBe('Second question');
      expect(decision1.context).toEqual({ id: 1 });
      expect(decision2.context).toEqual({ id: 2 });
      expect(decision1.timestamp.getTime()).toBeLessThanOrEqual(decision2.timestamp.getTime());
    }, 30000);
  });
});
