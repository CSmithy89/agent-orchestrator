/**
 * Integration Tests for Agent Pool with Amelia and Alex
 *
 * Tests complete agent creation workflow:
 * - AgentPool → LLMFactory → Agent instance
 * - Amelia and Alex with different LLMs
 * - Cost tracking integration
 * - Event emission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentPool } from '../../../src/core/AgentPool.js';
import { LLMFactory } from '../../../src/llm/LLMFactory.js';
import { ProjectConfig } from '../../../src/config/ProjectConfig.js';
import { AmeliaAgentInfrastructure } from '../../../src/implementation/agents/amelia.js';
import { AlexAgentInfrastructure } from '../../../src/implementation/agents/alex.js';
import type { AgentContext } from '../../../src/types/agent.js';

describe('Agent Pool Integration', () => {
  let agentPool: AgentPool;
  let llmFactory: LLMFactory;
  let projectConfig: ProjectConfig;

  beforeEach(() => {
    // Create mock LLM Factory
    llmFactory = {
      createClient: vi.fn().mockResolvedValue({
        provider: 'test',
        model: 'test-model',
        invoke: vi.fn().mockResolvedValue('{}'),
        stream: vi.fn(),
        estimateCost: vi.fn().mockReturnValue(0.01),
        getTokenUsage: vi.fn().mockReturnValue({
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150
        })
      }),
      registerProvider: vi.fn(),
      validateModel: vi.fn().mockReturnValue(true),
      getAvailableProviders: vi.fn().mockReturnValue(['test']),
      getSupportedModels: vi.fn().mockReturnValue(['test-model']),
      getLogger: vi.fn()
    } as unknown as LLMFactory;

    // Create mock Project Config
    projectConfig = {
      getAgentConfig: vi.fn((name: string) => {
        if (name === 'amelia') {
          return {
            provider: 'openai',
            model: 'gpt-4o',
            temperature: 0.4,
            reasoning: 'GPT-4o for code generation'
          };
        } else if (name === 'alex') {
          return {
            provider: 'anthropic',
            model: 'claude-sonnet-4-5',
            temperature: 0.3,
            reasoning: 'Claude Sonnet for code review'
          };
        }
        return null;
      })
    } as unknown as ProjectConfig;

    // Create Agent Pool
    agentPool = new AgentPool(llmFactory, projectConfig);
  });

  describe('AgentPool creation', () => {
    it('should create Amelia agent via AgentPool', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Test Amelia creation'
      };

      // Mock persona file read
      vi.mock('fs/promises', () => ({
        readFile: vi.fn().mockResolvedValue('# Amelia Persona')
      }));

      const agent = await agentPool.createAgent('amelia', context);

      expect(agent.name).toBe('amelia');
      expect(projectConfig.getAgentConfig).toHaveBeenCalledWith('amelia');
    });

    it('should create Alex agent via AgentPool', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Test Alex creation'
      };

      const agent = await agentPool.createAgent('alex', context);

      expect(agent.name).toBe('alex');
      expect(projectConfig.getAgentConfig).toHaveBeenCalledWith('alex');
    });

    it('should verify Amelia and Alex use different LLMs', () => {
      const ameliaConfig = projectConfig.getAgentConfig('amelia');
      const alexConfig = projectConfig.getAgentConfig('alex');

      expect(ameliaConfig).not.toBeNull();
      expect(alexConfig).not.toBeNull();

      // Verify different models
      expect(ameliaConfig?.model).toBe('gpt-4o');
      expect(alexConfig?.model).toBe('claude-sonnet-4-5');

      // Verify different providers
      expect(ameliaConfig?.provider).toBe('openai');
      expect(alexConfig?.provider).toBe('anthropic');
    });
  });

  describe('AmeliaAgentInfrastructure integration', () => {
    it('should create Amelia infrastructure and integrate with AgentPool', async () => {
      const amelia = await AmeliaAgentInfrastructure.create(
        agentPool,
        projectConfig
      );

      expect(amelia).toBeInstanceOf(AmeliaAgentInfrastructure);
    });
  });

  describe('AlexAgentInfrastructure integration', () => {
    it('should create Alex infrastructure and integrate with AgentPool', async () => {
      const alex = await AlexAgentInfrastructure.create(
        agentPool,
        projectConfig
      );

      expect(alex).toBeInstanceOf(AlexAgentInfrastructure);
    });
  });

  describe('Cost tracking', () => {
    it('should track agent invocation costs', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Cost tracking test'
      };

      const agent = await agentPool.createAgent('amelia', context);

      // Invoke agent
      await agentPool.invokeAgent(agent.id, 'test prompt');

      // Check cost metrics
      const metrics = agentPool.getCostMetrics();
      expect(metrics.total).toBeGreaterThan(0);
      expect(metrics.byAgent['amelia']).toBeGreaterThan(0);

      await agentPool.destroyAgent(agent.id);
    });
  });

  describe('Event emission', () => {
    it('should emit agent lifecycle events', async () => {
      const events: string[] = [];

      // Listen to events
      agentPool.on('agent.started' as any, () => {
        events.push('started');
      });
      agentPool.on('agent.invoked' as any, () => {
        events.push('invoked');
      });
      agentPool.on('agent.completed' as any, () => {
        events.push('completed');
      });

      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Event test'
      };

      // Create agent
      const agent = await agentPool.createAgent('amelia', context);
      expect(events).toContain('started');

      // Invoke agent
      await agentPool.invokeAgent(agent.id, 'test prompt');
      expect(events).toContain('invoked');

      // Destroy agent
      await agentPool.destroyAgent(agent.id);
      expect(events).toContain('completed');
    });
  });
});
