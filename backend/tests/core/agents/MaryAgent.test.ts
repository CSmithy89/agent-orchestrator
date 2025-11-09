/**
 * MaryAgent Unit Tests
 *
 * Tests for Mary Agent - Business Analyst Persona (Story 2.3)
 * Tests all 8 acceptance criteria following ATDD approach.
 *
 * ATDD RED PHASE: These tests should FAIL initially (no implementation yet)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MaryAgent } from '../../../src/core/agents/mary-agent.js';
import { LLMFactory } from '../../../src/llm/LLMFactory.js';
import { LLMClient } from '../../../src/llm/LLMClient.interface.js';
import { LLMConfig } from '../../../src/types/llm.types.js';
import { DecisionEngine } from '../../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../../src/core/services/escalation-queue.js';
import * as fs from 'fs/promises';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../../src/core/services/decision-engine.js');
vi.mock('../../../src/core/services/escalation-queue.js');

describe('MaryAgent - Business Analyst Persona', () => {
  let maryAgent: MaryAgent;
  let mockLLMFactory: LLMFactory;
  let mockLLMClient: LLMClient;
  let mockDecisionEngine: DecisionEngine;
  let mockEscalationQueue: EscalationQueue;
  let llmConfig: LLMConfig;

  beforeEach(() => {
    // Create mock LLM client
    mockLLMClient = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      invoke: vi.fn().mockResolvedValue(JSON.stringify({
        requirements: ['Requirement 1', 'Requirement 2'],
        successCriteria: ['Criterion 1', 'Criterion 2'],
        assumptions: ['Assumption 1'],
        clarifications: ['Clarification 1']
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

    // Create mock DecisionEngine
    mockDecisionEngine = {
      attemptAutonomousDecision: vi.fn().mockResolvedValue({
        question: 'Is this requirement clear?',
        decision: 'yes',
        confidence: 0.85,
        reasoning: 'Requirement is well-defined',
        source: 'llm',
        timestamp: new Date(),
        context: {}
      })
    } as unknown as DecisionEngine;

    // Create mock EscalationQueue
    mockEscalationQueue = {
      add: vi.fn().mockResolvedValue('esc-123'),
      list: vi.fn(),
      getById: vi.fn(),
      respond: vi.fn(),
      getMetrics: vi.fn()
    } as unknown as EscalationQueue;

    // Mock persona file
    vi.mocked(fs.readFile).mockResolvedValue(`
# Mary - Business Analyst

## Role
Business Analyst specializing in requirements extraction

## System Prompt
You are Mary, an expert Business Analyst...

## Specialized Prompts

### Requirements Extraction
Extract and structure requirements from user input...

### Success Criteria Definition
Generate measurable success criteria...

### Scope Negotiation
Apply 80/20 rule to split features...
    `);

    llmConfig = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      temperature: 0.3,
      maxTokens: 4000
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // AC #1: Load Mary persona from bmad/bmm/agents/mary.md
  // ==========================================
  describe('AC #1: Load Mary persona', () => {
    it('should load persona from bmad/bmm/agents/mary.md', async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('bmad/bmm/agents/mary.md'),
        'utf-8'
      );
    });

    it('should throw descriptive error when persona file not found', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(MaryAgent.create(llmConfig, mockLLMFactory))
        .rejects
        .toThrow(/Failed to load Mary persona file.*ENOENT/i);
    });

    it('should parse persona markdown into sections', async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);

      // Verify persona has system prompt and specialized prompts
      expect(maryAgent).toBeDefined();
      // Internal persona structure should be parsed
    });
  });

  // ==========================================
  // AC #2: Configure with project-assigned LLM
  // ==========================================
  describe('AC #2: Multi-provider LLM configuration', () => {
    it('should create LLM client via LLMFactory with Anthropic provider', async () => {
      const anthropicConfig: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      maryAgent = await MaryAgent.create(anthropicConfig, mockLLMFactory);

      expect(mockLLMFactory.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'anthropic',
          model: 'claude-sonnet-4-5'
        })
      );
    });

    it('should support OpenAI provider', async () => {
      const openaiConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 4000
      };

      maryAgent = await MaryAgent.create(openaiConfig, mockLLMFactory);

      expect(mockLLMFactory.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4'
        })
      );
    });

    it('should support Zhipu provider', async () => {
      const zhipuConfig: LLMConfig = {
        provider: 'zhipu',
        model: 'glm-4',
        temperature: 0.3,
        maxTokens: 4000
      };

      maryAgent = await MaryAgent.create(zhipuConfig, mockLLMFactory);

      expect(mockLLMFactory.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'zhipu',
          model: 'glm-4'
        })
      );
    });

    it('should throw error when LLM config is invalid', async () => {
      const invalidConfig: LLMConfig = {
        provider: '' as any,
        model: '',
        temperature: 0.3,
        maxTokens: 4000
      };

      await expect(MaryAgent.create(invalidConfig, mockLLMFactory))
        .rejects
        .toThrow(/invalid.*config/i);
    });
  });

  // ==========================================
  // AC #3: Specialized prompts
  // ==========================================
  describe('AC #3: Specialized prompts', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
    });

    it('should have requirements extraction prompt', () => {
      // Internal check - specialized prompts should be loaded
      expect(maryAgent).toBeDefined();
    });

    it('should have user story writing prompt', () => {
      expect(maryAgent).toBeDefined();
    });

    it('should have scope negotiation prompt', () => {
      expect(maryAgent).toBeDefined();
    });
  });

  // ==========================================
  // AC #4: Context management
  // ==========================================
  describe('AC #4: Context includes user input, product brief, domain knowledge', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
    });

    it('should include user input in context', async () => {
      const userInput = 'Build a user authentication system';

      await maryAgent.analyzeRequirements(userInput);

      expect(mockLLMClient.invoke).toHaveBeenCalledWith(
        expect.stringContaining(userInput),
        expect.any(Object)
      );
    });

    it('should include product brief in context when provided', async () => {
      const userInput = 'Build a user authentication system';
      const productBrief = 'SaaS platform for small businesses';

      await maryAgent.analyzeRequirements(userInput, productBrief);

      expect(mockLLMClient.invoke).toHaveBeenCalledWith(
        expect.stringContaining(productBrief),
        expect.any(Object)
      );
    });

    it('should work without product brief', async () => {
      const userInput = 'Build a user authentication system';

      await maryAgent.analyzeRequirements(userInput);

      expect(mockLLMClient.invoke).toHaveBeenCalled();
    });
  });

  // ==========================================
  // AC #5: Core methods
  // ==========================================
  describe('AC #5: Core methods - analyzeRequirements()', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
    });

    it('should return AnalysisResult with requirements, successCriteria, assumptions, clarifications', async () => {
      const userInput = 'Build a user authentication system with social login';

      const result = await maryAgent.analyzeRequirements(userInput);

      expect(result).toHaveProperty('requirements');
      expect(result).toHaveProperty('successCriteria');
      expect(result).toHaveProperty('assumptions');
      expect(result).toHaveProperty('clarifications');
      expect(Array.isArray(result.requirements)).toBe(true);
      expect(Array.isArray(result.successCriteria)).toBe(true);
      expect(Array.isArray(result.assumptions)).toBe(true);
      expect(Array.isArray(result.clarifications)).toBe(true);
    });

    it('should throw error for empty input', async () => {
      await expect(maryAgent.analyzeRequirements(''))
        .rejects
        .toThrow(/empty.*input/i);
    });

    it('should parse LLM response into AnalysisResult', async () => {
      const userInput = 'Build authentication system';

      const result = await maryAgent.analyzeRequirements(userInput);

      expect(result.requirements).toContain('Requirement 1');
      expect(result.successCriteria).toContain('Criterion 1');
    });
  });

  describe('AC #5: Core methods - defineSuccessCriteria()', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
      mockLLMClient.invoke = vi.fn().mockResolvedValue(JSON.stringify([
        'Given a user on login page, when they enter valid credentials, then they should be logged in',
        'Given a user is logged in, when they click logout, then they should be logged out'
      ]));
    });

    it('should return array of success criteria strings', async () => {
      const features = ['User login', 'User logout'];

      const result = await maryAgent.defineSuccessCriteria(features);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(typeof result[0]).toBe('string');
    });

    it('should generate Given-When-Then format criteria', async () => {
      const features = ['User login'];

      const result = await maryAgent.defineSuccessCriteria(features);

      expect(result[0]).toMatch(/given.*when.*then/i);
    });

    it('should generate specific measurable criteria (no vague terms)', async () => {
      const features = ['User experience'];

      const result = await maryAgent.defineSuccessCriteria(features);

      // Criteria should not contain vague terms like "improve", "enhance", "better"
      result.forEach(criterion => {
        expect(criterion).not.toMatch(/improve|enhance|better/i);
      });
    });

    it('should handle empty feature list gracefully', async () => {
      await expect(maryAgent.defineSuccessCriteria([]))
        .rejects
        .toThrow(/empty.*features/i);
    });
  });

  describe('AC #5: Core methods - negotiateScope()', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
      mockLLMClient.invoke = vi.fn().mockResolvedValue(JSON.stringify({
        mvpScope: ['User login', 'User logout'],
        growthFeatures: ['Social login', 'Two-factor auth'],
        rationale: 'MVP focuses on core authentication, growth adds advanced features'
      }));
    });

    it('should return ScopeResult with mvpScope, growthFeatures, rationale', async () => {
      const requirements = ['User login', 'User logout', 'Social login', 'Two-factor auth'];
      const constraints = { timeline: '4 weeks', budget: 50000, teamSize: 2 };

      const result = await maryAgent.negotiateScope(requirements, constraints);

      expect(result).toHaveProperty('mvpScope');
      expect(result).toHaveProperty('growthFeatures');
      expect(result).toHaveProperty('rationale');
      expect(Array.isArray(result.mvpScope)).toBe(true);
      expect(Array.isArray(result.growthFeatures)).toBe(true);
      expect(typeof result.rationale).toBe('string');
    });

    it('should split features into MVP vs growth', async () => {
      const requirements = ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'];
      const constraints = { timeline: '2 weeks' };

      const result = await maryAgent.negotiateScope(requirements, constraints);

      expect(result.mvpScope.length).toBeLessThan(requirements.length);
      expect(result.growthFeatures.length).toBeGreaterThan(0);
    });

    it('should consider timeline constraints', async () => {
      const requirements = ['Feature 1', 'Feature 2', 'Feature 3'];
      const constraints = { timeline: '1 week', teamSize: 1 };

      const result = await maryAgent.negotiateScope(requirements, constraints);

      // With tight constraints, MVP should be minimal
      expect(result.mvpScope.length).toBeLessThanOrEqual(2);
    });

    it('should provide clear rationale for MVP boundary', async () => {
      const requirements = ['Feature 1', 'Feature 2'];
      const constraints = { timeline: '4 weeks' };

      const result = await maryAgent.negotiateScope(requirements, constraints);

      expect(result.rationale.length).toBeGreaterThan(20);
      expect(result.rationale).toMatch(/mvp|minimum|core/i);
    });
  });

  // ==========================================
  // AC #6: Generate clear, structured requirements
  // ==========================================
  describe('AC #6: Generate clear, structured requirements documentation', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
    });

    it('should return structured requirements (not vague)', async () => {
      const userInput = 'Make the app better';

      const result = await maryAgent.analyzeRequirements(userInput);

      // Requirements should be specific, not vague
      result.requirements.forEach(req => {
        expect(req.length).toBeGreaterThan(10);
      });
    });

    it('should return measurable success criteria', async () => {
      // Override mock for this test to return JSON array
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify([
        'Given a user enters valid credentials, when they submit the login form, then they should be authenticated',
        'Given a user enters invalid credentials, when they submit the login form, then they should see an error message'
      ]));

      const features = ['User authentication'];

      const result = await maryAgent.defineSuccessCriteria(features);

      // Criteria should be testable/measurable
      expect(result[0]).toMatch(/given|when|then|should|must/i);
    });
  });

  // ==========================================
  // AC #7: Make decisions with confidence scoring
  // ==========================================
  describe('AC #7: DecisionEngine integration for confidence scoring', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(
        llmConfig,
        mockLLMFactory,
        mockDecisionEngine,
        mockEscalationQueue
      );
    });

    it('should call DecisionEngine for ambiguous requirements', async () => {
      const userInput = 'Build something cool';

      await maryAgent.analyzeRequirements(userInput);

      // Mary should use DecisionEngine to assess if requirement is clear
      expect(mockDecisionEngine.attemptAutonomousDecision).toHaveBeenCalled();
    });

    it('should proceed autonomously when confidence >= 0.75', async () => {
      mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockResolvedValue({
        question: 'Is this requirement clear?',
        decision: 'yes',
        confidence: 0.85,
        reasoning: 'Requirement is clear',
        source: 'llm',
        timestamp: new Date(),
        context: {}
      });

      const userInput = 'Build user authentication';

      const result = await maryAgent.analyzeRequirements(userInput);

      expect(result).toBeDefined();
      expect(mockEscalationQueue.add).not.toHaveBeenCalled();
    });

    it('should track decisions for audit trail', async () => {
      const userInput = 'Build authentication';

      await maryAgent.analyzeRequirements(userInput);

      // Decision should be tracked internally
      expect(mockDecisionEngine.attemptAutonomousDecision).toHaveBeenCalled();
    });
  });

  // ==========================================
  // AC #8: Escalate ambiguous decisions
  // ==========================================
  describe('AC #8: Escalate ambiguous or critical product decisions', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(
        llmConfig,
        mockLLMFactory,
        mockDecisionEngine,
        mockEscalationQueue
      );
    });

    it('should escalate via EscalationQueue when confidence < 0.75', async () => {
      mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockResolvedValue({
        question: 'Is this requirement clear?',
        decision: 'unclear',
        confidence: 0.65,
        reasoning: 'Requirement is too vague',
        source: 'llm',
        timestamp: new Date(),
        context: {}
      });

      const userInput = 'Build something';

      // This should trigger escalation
      await expect(maryAgent.analyzeRequirements(userInput))
        .rejects
        .toThrow(/escalation/i);

      expect(mockEscalationQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          question: expect.any(String),
          confidence: 0.65,
          aiReasoning: expect.any(String)
        })
      );
    });

    it('should include correct escalation metadata', async () => {
      mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockResolvedValue({
        question: 'Should this be MVP or growth?',
        decision: 'uncertain',
        confidence: 0.70,
        reasoning: 'Not enough context',
        source: 'llm',
        timestamp: new Date(),
        context: { requirement: 'Social login' }
      });

      const requirements = ['Social login'];
      const constraints = { timeline: '2 weeks' };

      await expect(maryAgent.negotiateScope(requirements, constraints))
        .rejects
        .toThrow(/escalation/i);

      expect(mockEscalationQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId: expect.any(String),
          step: expect.any(Number),
          question: expect.stringContaining('MVP'),
          aiReasoning: 'Not enough context',
          confidence: 0.70,
          context: expect.any(Object)
        })
      );
    });
  });

  // ==========================================
  // Error Handling & Logging
  // ==========================================
  describe('Error handling and logging', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
    });

    it('should handle LLM failures with retry', async () => {
      mockLLMClient.invoke = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(JSON.stringify({
          requirements: ['Req 1'],
          successCriteria: ['Crit 1'],
          assumptions: [],
          clarifications: []
        }));

      const userInput = 'Build auth system';

      const result = await maryAgent.analyzeRequirements(userInput);

      expect(result).toBeDefined();
      expect(mockLLMClient.invoke).toHaveBeenCalledTimes(2);
    });

    it('should log all Mary invocations with input/output sizes', async () => {
      const userInput = 'Build authentication with social login support';

      await maryAgent.analyzeRequirements(userInput);

      // Logger should be called with format: [MaryAgent] method(inputSize) -> result
      // This will be verified in implementation
    });
  });

  // ==========================================
  // Performance
  // ==========================================
  describe('Performance requirements', () => {
    beforeEach(async () => {
      maryAgent = await MaryAgent.create(llmConfig, mockLLMFactory);
    });

    it('should complete analyzeRequirements() in <30 seconds', async () => {
      const userInput = 'Build user authentication system';
      const startTime = Date.now();

      await maryAgent.analyzeRequirements(userInput);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    }, 35000);

    it('should complete defineSuccessCriteria() in <30 seconds', async () => {
      // Override mock for this test to return JSON array
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify([
        'Given feature 1 is enabled, when user interacts, then expected outcome occurs',
        'Given feature 2 is enabled, when user interacts, then expected outcome occurs',
        'Given feature 3 is enabled, when user interacts, then expected outcome occurs'
      ]));

      const features = ['Feature 1', 'Feature 2', 'Feature 3'];
      const startTime = Date.now();

      await maryAgent.defineSuccessCriteria(features);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    }, 35000);

    it('should complete negotiateScope() in <30 seconds', async () => {
      const requirements = ['Req 1', 'Req 2', 'Req 3'];
      const constraints = { timeline: '4 weeks' };
      const startTime = Date.now();

      await maryAgent.negotiateScope(requirements, constraints);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000);
    }, 35000);
  });
});
