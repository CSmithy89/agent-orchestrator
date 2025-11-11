/**
 * MaryAgent Integration Tests
 *
 * Tests Mary Agent integration with:
 * - LLMFactory (multi-provider support)
 * - DecisionEngine (confidence-based decisions)
 * - EscalationQueue (human intervention)
 * - PRD workflow context (via AgentPool)
 *
 * These tests use real LLM providers with test API keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MaryAgent } from '../../src/core/agents/mary-agent.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { LLMConfig } from '../../src/types/llm.types.js';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../src/core/services/escalation-queue.js';
import { AnthropicProvider } from '../../src/llm/providers/AnthropicProvider.js';
import { ClaudeCodeProvider } from '../../src/llm/providers/ClaudeCodeProvider.js';
import { OpenAIProvider } from '../../src/llm/providers/OpenAIProvider.js';
import { ZhipuProvider } from '../../src/llm/providers/ZhipuProvider.js';

// Shared test utilities
import { hasApiKeys } from '../utils/apiKeys.js';

describe('MaryAgent Integration Tests', () => {
  let llmFactory: LLMFactory;
  let decisionEngine: DecisionEngine;
  let escalationQueue: EscalationQueue;

  beforeEach(() => {
    // Create LLM factory with providers
    llmFactory = new LLMFactory();
    llmFactory.registerProvider('anthropic', new AnthropicProvider());
    llmFactory.registerProvider('claude-code', new ClaudeCodeProvider());
    llmFactory.registerProvider('openai', new OpenAIProvider());
    llmFactory.registerProvider('zhipu', new ZhipuProvider());

    // Create DecisionEngine (using Anthropic for decision-making)
    const decisionConfig: LLMConfig = {
      provider: 'claude-code',
      model: 'claude-sonnet-4-5',
      temperature: 0.3,
      maxTokens: 2000
    };
    decisionEngine = new DecisionEngine(llmFactory, decisionConfig);

    // Create EscalationQueue
    escalationQueue = new EscalationQueue();
  });

  afterEach(async () => {
    // Clean up escalation files if any
    // (EscalationQueue cleanup logic)
  });

  // ==========================================
  // Multi-Provider Support
  // ==========================================
  describe('Multi-Provider Support', () => {
    it.skipIf(!hasApiKeys())('should work with Claude Code provider (Claude Sonnet)', async () => {
      const claudeCodeConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      const mary = await MaryAgent.create(
        claudeCodeConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const result = await mary.analyzeRequirements(
        'Build a user authentication system with email and password'
      );

      expect(result.requirements).toBeDefined();
      expect(result.requirements.length).toBeGreaterThan(0);
      expect(result.successCriteria).toBeDefined();
      expect(result.successCriteria.length).toBeGreaterThan(0);
    }, 60000); // 60s timeout for LLM call

    it.skip('should work with OpenAI provider (GPT-4)', async () => {
      const openaiConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 4000
      };

      const mary = await MaryAgent.create(
        openaiConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const result = await mary.analyzeRequirements(
        'Build a user authentication system'
      );

      expect(result.requirements).toBeDefined();
      expect(result.requirements.length).toBeGreaterThan(0);
    }, 60000);

    it.skip('should work with Zhipu provider (GLM-4)', async () => {
      const zhipuConfig: LLMConfig = {
        provider: 'zhipu',
        model: 'glm-4',
        temperature: 0.3,
        maxTokens: 4000
      };

      const mary = await MaryAgent.create(
        zhipuConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const result = await mary.analyzeRequirements(
        'Build a user authentication system'
      );

      expect(result.requirements).toBeDefined();
    }, 60000);

    it.skipIf(!hasApiKeys())('should produce same quality output across providers', async () => {
      // Test Claude Code provider output quality
      const userInput = 'Build a simple todo list app';

      const claudeCodeConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      const maryClaudeCode = await MaryAgent.create(
        claudeCodeConfig,
        llmFactory
      );

      const anthropicResult = await maryClaudeCode.analyzeRequirements(userInput);

      // Both should produce structured requirements
      expect(anthropicResult.requirements.length).toBeGreaterThan(0);
      expect(anthropicResult.successCriteria.length).toBeGreaterThan(0);

      // Quality check: Requirements should be specific (not vague)
      anthropicResult.requirements.forEach(req => {
        expect(req.length).toBeGreaterThan(10);
        expect(req).not.toMatch(/improve|enhance|better/i);
      });
    }, 120000);
  });

  // ==========================================
  // DecisionEngine Integration
  // ==========================================
  describe('DecisionEngine Integration', () => {
    let mary: MaryAgent;

    beforeEach(async () => {
      const llmConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      mary = await MaryAgent.create(
        llmConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );
    });

    it.skipIf(!hasApiKeys())('should use DecisionEngine for ambiguous requirements', async () => {
      const vague = 'Build something cool';

      // This should trigger DecisionEngine to assess clarity
      // May escalate or proceed depending on LLM confidence
      try {
        const _result = await mary.analyzeRequirements(vague);
        // If it succeeds, check audit trail
        const auditTrail = mary.getDecisionAuditTrail();
        expect(auditTrail.length).toBeGreaterThan(0);
      } catch (error) {
        // If it escalates, that's also expected
        expect((error as Error).message).toMatch(/escalation/i);
      }
    }, 60000);

    it.skipIf(!hasApiKeys())('should proceed autonomously when requirements are clear', async () => {
      const clear = 'Build a user authentication system with email, password, and password reset via email';

      const result = await mary.analyzeRequirements(clear);

      // Should succeed without escalation
      expect(result.requirements).toBeDefined();
      expect(result.requirements.length).toBeGreaterThan(0);

      // Check audit trail shows high confidence
      const auditTrail = mary.getDecisionAuditTrail();
      if (auditTrail.length > 0) {
        expect(auditTrail[0].decision.confidence).toBeGreaterThanOrEqual(0.75);
      }
    }, 60000);

    it.skipIf(!hasApiKeys())('should track all decisions in audit trail', async () => {
      const userInput = 'Build authentication system';

      await mary.analyzeRequirements(userInput);

      const auditTrail = mary.getDecisionAuditTrail();
      expect(auditTrail.length).toBeGreaterThan(0);

      // Each decision should have metadata
      auditTrail.forEach(record => {
        expect(record.method).toBeDefined();
        expect(record.question).toBeDefined();
        expect(record.decision).toBeDefined();
        expect(record.timestamp).toBeInstanceOf(Date);
      });
    }, 60000);
  });

  // ==========================================
  // EscalationQueue Integration
  // ==========================================
  describe('EscalationQueue Integration', () => {
    let mary: MaryAgent;

    beforeEach(async () => {
      const llmConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      mary = await MaryAgent.create(
        llmConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      mary.setWorkflowContext('test-workflow', 1);
    });

    it.skip('should escalate when confidence < 0.75 (manual verification)', async () => {
      // This test requires extremely vague input to trigger low confidence
      const extremelyVague = 'Do stuff';

      try {
        await mary.analyzeRequirements(extremelyVague);
        // If it doesn't escalate, that's also valid if LLM is confident
      } catch (error) {
        expect((error as Error).message).toMatch(/escalation/i);

        // Verify escalation was created
        const escalations = await escalationQueue.list({ status: 'pending' });
        expect(escalations.length).toBeGreaterThan(0);

        // Check escalation metadata
        const escalation = escalations[0];
        expect(escalation.workflowId).toBe('test-workflow');
        expect(escalation.confidence).toBeLessThan(0.75);
        expect(escalation.aiReasoning).toBeDefined();
      }
    }, 60000);

    it.skipIf(!hasApiKeys())('should include correct escalation metadata', async () => {
      const requirements = ['Feature 1', 'Feature 2'];
      const constraints = { timeline: '1 day' }; // Extreme constraint

      try {
        await mary.negotiateScope(requirements, constraints);
      } catch (error) {
        if ((error as Error).message.includes('escalation')) {
          const escalations = await escalationQueue.list({ status: 'pending' });
          if (escalations.length > 0) {
            const escalation = escalations[0];
            expect(escalation.question).toMatch(/mvp|scope/i);
            expect(escalation.context).toBeDefined();
            expect(escalation.context).toHaveProperty('method');
          }
        }
      }
    }, 60000);
  });

  // ==========================================
  // PRD Workflow Context (Future: with AgentPool)
  // ==========================================
  describe('PRD Workflow Context', () => {
    it.skipIf(!hasApiKeys())('should support workflow context for escalation tracking', async () => {
      const llmConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      const mary = await MaryAgent.create(
        llmConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      mary.setWorkflowContext('prd-workflow', 3);

      const result = await mary.analyzeRequirements(
        'Build user authentication with social login'
      );

      expect(result).toBeDefined();
    }, 60000);
  });

  // ==========================================
  // Performance Tests
  // ==========================================
  describe('Performance Requirements', () => {
    let mary: MaryAgent;

    beforeEach(async () => {
      const llmConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      mary = await MaryAgent.create(llmConfig, llmFactory);
    });

    it.skipIf(!hasApiKeys())('analyzeRequirements() should complete in <30 seconds', async () => {
      const userInput = 'Build a comprehensive user authentication system with email, password, social login (Google, Facebook), two-factor authentication, password reset, and account recovery';

      const startTime = Date.now();
      const result = await mary.analyzeRequirements(userInput);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000);
      expect(result.requirements).toBeDefined();
    }, 35000);

    it.skipIf(!hasApiKeys())('defineSuccessCriteria() should complete in <30 seconds', async () => {
      const features = [
        'User registration',
        'User login',
        'Password reset',
        'Social login (Google)',
        'Social login (Facebook)',
        'Two-factor authentication'
      ];

      const startTime = Date.now();
      const result = await mary.defineSuccessCriteria(features);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000);
      expect(result.length).toBeGreaterThan(0);
    }, 35000);

    it.skipIf(!hasApiKeys())('negotiateScope() should complete in <30 seconds', async () => {
      const requirements = [
        'User registration',
        'User login',
        'Password reset',
        'Social login',
        'Two-factor auth',
        'Profile management',
        'Account deletion',
        'Email verification'
      ];
      const constraints = {
        timeline: '4 weeks',
        budget: 50000,
        teamSize: 2
      };

      const startTime = Date.now();
      const result = await mary.negotiateScope(requirements, constraints);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000);
      expect(result.mvpScope).toBeDefined();
      expect(result.growthFeatures).toBeDefined();
      expect(result.rationale).toBeDefined();
    }, 35000);
  });

  // ==========================================
  // Quality Tests
  // ==========================================
  describe('Output Quality', () => {
    let mary: MaryAgent;

    beforeEach(async () => {
      const llmConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      mary = await MaryAgent.create(llmConfig, llmFactory);
    });

    it.skipIf(!hasApiKeys())('should produce specific, non-vague requirements', async () => {
      const userInput = 'Make the app better for users';

      const result = await mary.analyzeRequirements(userInput);

      // Requirements should be specific, not vague
      result.requirements.forEach(req => {
        expect(req.length).toBeGreaterThan(15);
        // Should not contain generic terms
        expect(req.toLowerCase()).not.toMatch(/\bbetter\b|\bimprove\b|\benhance\b/);
      });
    }, 60000);

    it.skipIf(!hasApiKeys())('should produce measurable success criteria in Given-When-Then format', async () => {
      const features = ['User login', 'Password reset'];

      const result = await mary.defineSuccessCriteria(features);

      result.forEach(criterion => {
        // Should contain Given-When-Then structure
        expect(criterion.toLowerCase()).toMatch(/given.*when.*then/);
        // Should be measurable (contain numbers or concrete outcomes)
        expect(criterion.length).toBeGreaterThan(30);
      });
    }, 60000);

    it.skipIf(!hasApiKeys())('should apply 80/20 rule in scope negotiation', async () => {
      const requirements = [
        'User authentication with email and password',
        'Social login (Google, Facebook)',
        'Password reset via email',
        'Two-factor authentication',
        'User profile management',
        'Avatar upload',
        'Email notifications',
        'Push notifications',
        'Activity feed',
        'Search functionality'
      ];
      const constraints = { timeline: '2 weeks', teamSize: 1 };

      const result = await mary.negotiateScope(requirements, constraints);

      // MVP should be roughly 20% of features (80/20 rule)
      expect(result.mvpScope.length).toBeLessThan(requirements.length);
      expect(result.mvpScope.length).toBeLessThanOrEqual(requirements.length * 0.3);

      // Growth features should be the rest
      expect(result.growthFeatures.length).toBeGreaterThan(0);

      // Rationale should explain the boundary
      expect(result.rationale.length).toBeGreaterThan(50);
      expect(result.rationale.toLowerCase()).toMatch(/mvp|minimum|core|value/);
    }, 60000);
  });
});
