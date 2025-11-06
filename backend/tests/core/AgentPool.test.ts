/**
 * AgentPool Unit Tests
 * Tests agent creation, invocation, destruction, queueing, and cost tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentPool } from '../../src/core/AgentPool.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { ProjectConfig } from '../../src/config/ProjectConfig.js';
import {
  Agent,
  AgentContext,
  AgentPoolError,
  AgentLifecycleEvent
} from '../../src/types/agent.js';
import { LLMClient } from '../../src/llm/LLMClient.interface.js';
import { AgentLLMConfig } from '../../src/types/ProjectConfig.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('AgentPool', () => {
  let agentPool: AgentPool;
  let mockLLMFactory: LLMFactory;
  let mockProjectConfig: ProjectConfig;
  let mockLLMClient: LLMClient;
  let mockContext: AgentContext;

  beforeEach(async () => {
    // Create mock LLM client
    mockLLMClient = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      invoke: vi.fn().mockResolvedValue('Mock response'),
      stream: vi.fn(),
      estimateCost: vi.fn().mockReturnValue(0.0015),
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
    } as any;

    // Create mock agent config
    const mockAgentConfig: AgentLLMConfig = {
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
      reasoning: 'Test agent'
    };

    // Create mock project config
    mockProjectConfig = {
      getAgentConfig: vi.fn().mockReturnValue(mockAgentConfig),
      getCostManagement: vi.fn().mockReturnValue({
        max_monthly_budget: 1000,
        alert_threshold: 0.8,
        fallback_model: 'claude-haiku'
      }),
      getOnboardingDocs: vi.fn().mockReturnValue({
        tech_stack: [],
        coding_standards: 'standards.md',
        architecture_patterns: 'patterns.md'
      }),
      getProjectMetadata: vi.fn().mockReturnValue({
        name: 'Test Project',
        description: 'Test',
        repository: 'test'
      })
    } as any;

    // Create mock agent context
    mockContext = {
      onboardingDocs: ['doc1.md', 'doc2.md'],
      workflowState: { step: 1 },
      taskDescription: 'Test task'
    };

    // Create mock persona file
    const personaPath = path.join(process.cwd(), 'bmad', 'bmm', 'agents', 'test-agent.md');
    await fs.mkdir(path.dirname(personaPath), { recursive: true });
    await fs.writeFile(personaPath, '# Test Agent Persona\nThis is a test agent.');

    // Create AgentPool instance
    agentPool = new AgentPool(mockLLMFactory, mockProjectConfig, {
      maxConcurrentAgents: 2,
      healthCheckInterval: 60000,
      maxAgentExecutionTime: 3600000,
      autoCleanupHungAgents: false // Disable for testing
    });
  });

  afterEach(async () => {
    // Cleanup
    await agentPool.shutdown();

    // Clean up persona file
    try {
      await fs.rm(path.join(process.cwd(), 'bmad'), { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Agent Creation', () => {
    it('should create agent with valid config', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);

      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('test-agent');
      expect(agent.persona).toContain('Test Agent Persona');
      expect(agent.llmClient).toBe(mockLLMClient);
      expect(agent.context).toBe(mockContext);
      expect(agent.startTime).toBeInstanceOf(Date);
      expect(agent.estimatedCost).toBe(0);
    });

    it('should throw error for missing agent config', async () => {
      (mockProjectConfig.getAgentConfig as any).mockReturnValue(undefined);

      await expect(agentPool.createAgent('nonexistent', mockContext))
        .rejects.toThrow(AgentPoolError);

      await expect(agentPool.createAgent('nonexistent', mockContext))
        .rejects.toThrow('not found in project configuration');
    });

    it('should throw error for missing persona file', async () => {
      await expect(agentPool.createAgent('missing-persona', mockContext))
        .rejects.toThrow(AgentPoolError);

      await expect(agentPool.createAgent('missing-persona', mockContext))
        .rejects.toThrow('Failed to load persona');
    });

    it('should throw error when LLM client creation fails', async () => {
      (mockLLMFactory.createClient as any).mockRejectedValue(new Error('LLM error'));

      await expect(agentPool.createAgent('test-agent', mockContext))
        .rejects.toThrow(AgentPoolError);

      await expect(agentPool.createAgent('test-agent', mockContext))
        .rejects.toThrow('Failed to create LLM client');
    });

    it('should emit agent.started event on creation', async () => {
      const eventListener = vi.fn();
      agentPool.on(AgentLifecycleEvent.STARTED, eventListener);

      const agent = await agentPool.createAgent('test-agent', mockContext);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: agent.id,
          agentName: 'test-agent',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('Agent Queueing', () => {
    it('should queue agent when pool at capacity', async () => {
      // Create 2 agents to reach capacity
      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('test-agent', mockContext);

      // Third agent should be queued
      const agent3Promise = agentPool.createAgent('test-agent', mockContext);

      // Check queue
      const queuedTasks = agentPool.getQueuedTasks();
      expect(queuedTasks).toHaveLength(1);
      expect(queuedTasks[0].agentName).toBe('test-agent');

      // Destroy one agent to trigger queue processing
      await agentPool.destroyAgent(agent1.id);

      // Wait for queue to process
      const agent3 = await agent3Promise;
      expect(agent3).toBeDefined();
      expect(agent3.id).toBeDefined();
    });

    it('should process queue in FIFO order', async () => {
      // Fill pool
      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('test-agent', mockContext);

      // Queue multiple agents
      const agent3Promise = agentPool.createAgent('test-agent', mockContext);
      const agent4Promise = agentPool.createAgent('test-agent', mockContext);

      // Verify queue size
      expect(agentPool.getQueuedTasks()).toHaveLength(2);

      // Destroy agents to process queue
      await agentPool.destroyAgent(agent1.id);
      await agent3Promise;

      await agentPool.destroyAgent(agent2.id);
      await agent4Promise;

      expect(agentPool.getQueuedTasks()).toHaveLength(0);
    });
  });

  describe('Agent Invocation', () => {
    it('should invoke agent with prompt and return response', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);
      const response = await agentPool.invokeAgent(agent.id, 'Test prompt');

      expect(response).toBe('Mock response');
      expect(mockLLMClient.invoke).toHaveBeenCalledWith('Test prompt');
    });

    it('should throw error for invalid agent ID', async () => {
      await expect(agentPool.invokeAgent('invalid-id', 'Test prompt'))
        .rejects.toThrow(AgentPoolError);

      await expect(agentPool.invokeAgent('invalid-id', 'Test prompt'))
        .rejects.toThrow('not found');
    });

    it('should track cost after invocation', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);
      await agentPool.invokeAgent(agent.id, 'Test prompt');

      expect(agent.estimatedCost).toBeGreaterThan(0);

      const costMetrics = agentPool.getCostMetrics();
      expect(costMetrics.total).toBeGreaterThan(0);
      expect(costMetrics.byAgent['test-agent']).toBeGreaterThan(0);
    });

    it('should emit agent.invoked event', async () => {
      const eventListener = vi.fn();
      agentPool.on(AgentLifecycleEvent.INVOKED, eventListener);

      const agent = await agentPool.createAgent('test-agent', mockContext);
      await agentPool.invokeAgent(agent.id, 'Test prompt');

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: agent.id,
          agentName: 'test-agent',
          data: expect.objectContaining({
            latencyMs: expect.any(Number),
            cost: expect.any(Number)
          })
        })
      );
    });

    it('should emit agent.error event on invocation failure', async () => {
      const eventListener = vi.fn();
      agentPool.on(AgentLifecycleEvent.ERROR, eventListener);

      (mockLLMClient.invoke as any).mockRejectedValue(new Error('Invocation failed'));

      const agent = await agentPool.createAgent('test-agent', mockContext);

      await expect(agentPool.invokeAgent(agent.id, 'Test prompt'))
        .rejects.toThrow();

      expect(eventListener).toHaveBeenCalled();
    });
  });

  describe('Agent Destruction', () => {
    it('should destroy agent and clean up resources', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);

      expect(agentPool.getActiveAgents()).toHaveLength(1);

      await agentPool.destroyAgent(agent.id);

      expect(agentPool.getActiveAgents()).toHaveLength(0);
    });

    it('should throw error for invalid agent ID', async () => {
      await expect(agentPool.destroyAgent('invalid-id'))
        .rejects.toThrow(AgentPoolError);

      await expect(agentPool.destroyAgent('invalid-id'))
        .rejects.toThrow('not found');
    });

    it('should emit agent.completed event', async () => {
      const eventListener = vi.fn();
      agentPool.on(AgentLifecycleEvent.COMPLETED, eventListener);

      const agent = await agentPool.createAgent('test-agent', mockContext);
      await agentPool.destroyAgent(agent.id);

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: agent.id,
          agentName: 'test-agent',
          data: expect.objectContaining({
            executionTimeMs: expect.any(Number),
            totalCost: expect.any(Number)
          })
        })
      );
    });

    it('should process queued tasks after destruction', async () => {
      // Fill pool
      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('test-agent', mockContext);

      // Queue an agent
      const agent3Promise = agentPool.createAgent('test-agent', mockContext);

      expect(agentPool.getQueuedTasks()).toHaveLength(1);

      // Destroy agent to trigger queue processing
      await agentPool.destroyAgent(agent1.id);

      // Wait for queue processing
      await agent3Promise;

      expect(agentPool.getQueuedTasks()).toHaveLength(0);
    });
  });

  describe('Query Methods', () => {
    it('should return all active agents', async () => {
      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('test-agent', mockContext);

      const agents = agentPool.getActiveAgents();
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.id)).toContain(agent1.id);
      expect(agents.map(a => a.id)).toContain(agent2.id);
    });

    it('should filter agents by name', async () => {
      // Create persona for second agent
      const persona2Path = path.join(process.cwd(), 'bmad', 'bmm', 'agents', 'other-agent.md');
      await fs.writeFile(persona2Path, '# Other Agent');

      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('other-agent', mockContext);

      const filtered = agentPool.getActiveAgents({ name: 'test-agent' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(agent1.id);
    });

    it('should filter agents by start time', async () => {
      const now = new Date();
      const agent = await agentPool.createAgent('test-agent', mockContext);

      const filtered = agentPool.getActiveAgents({ startedAfter: new Date(now.getTime() - 1000) });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(agent.id);

      const filtered2 = agentPool.getActiveAgents({ startedAfter: new Date(now.getTime() + 1000) });
      expect(filtered2).toHaveLength(0);
    });

    it('should get agent by ID', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);
      const found = agentPool.getAgentById(agent.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(agent.id);
    });

    it('should return undefined for invalid agent ID', () => {
      const found = agentPool.getAgentById('invalid-id');
      expect(found).toBeUndefined();
    });

    it('should return queue stats', async () => {
      // Fill pool
      await agentPool.createAgent('test-agent', mockContext);
      await agentPool.createAgent('test-agent', mockContext);

      // Queue agents
      agentPool.createAgent('test-agent', mockContext);
      agentPool.createAgent('test-agent', mockContext);

      const tasks = agentPool.getQueuedTasks();
      expect(tasks).toHaveLength(2);
    });
  });

  describe('Cost Tracking', () => {
    it('should track costs by agent', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);
      await agentPool.invokeAgent(agent.id, 'Test prompt 1');
      await agentPool.invokeAgent(agent.id, 'Test prompt 2');

      const costMetrics = agentPool.getCostMetrics();
      expect(costMetrics.byAgent['test-agent']).toBeGreaterThan(0);
    });

    it('should track total cost', async () => {
      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      await agentPool.invokeAgent(agent1.id, 'Test prompt');

      const costMetrics = agentPool.getCostMetrics();
      expect(costMetrics.total).toBeGreaterThan(0);
    });

    it('should aggregate costs across multiple agents', async () => {
      // Create persona for second agent
      const persona2Path = path.join(process.cwd(), 'bmad', 'bmm', 'agents', 'other-agent.md');
      await fs.writeFile(persona2Path, '# Other Agent');

      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('other-agent', mockContext);

      await agentPool.invokeAgent(agent1.id, 'Test prompt 1');
      await agentPool.invokeAgent(agent2.id, 'Test prompt 2');

      const costMetrics = agentPool.getCostMetrics();
      expect(costMetrics.byAgent['test-agent']).toBeGreaterThan(0);
      expect(costMetrics.byAgent['other-agent']).toBeGreaterThan(0);
      expect(costMetrics.total).toBeGreaterThan(0);
    });
  });

  describe('Pool Statistics', () => {
    it('should return accurate pool stats', async () => {
      const agent = await agentPool.createAgent('test-agent', mockContext);

      const stats = agentPool.getStats();
      expect(stats.activeAgents).toBe(1);
      expect(stats.maxConcurrentAgents).toBe(2);
      expect(stats.queuedTasks).toBe(0);
      expect(stats.totalAgentsCreated).toBe(1);
    });

    it('should update stats after agent operations', async () => {
      const agent1 = await agentPool.createAgent('test-agent', mockContext);
      const agent2 = await agentPool.createAgent('test-agent', mockContext);

      let stats = agentPool.getStats();
      expect(stats.activeAgents).toBe(2);
      expect(stats.totalAgentsCreated).toBe(2);

      await agentPool.destroyAgent(agent1.id);

      stats = agentPool.getStats();
      expect(stats.activeAgents).toBe(1);
      expect(stats.totalAgentsCreated).toBe(2); // Should not decrease
    });
  });

  describe('Shutdown', () => {
    it('should destroy all active agents on shutdown', async () => {
      await agentPool.createAgent('test-agent', mockContext);
      await agentPool.createAgent('test-agent', mockContext);

      expect(agentPool.getActiveAgents()).toHaveLength(2);

      await agentPool.shutdown();

      expect(agentPool.getActiveAgents()).toHaveLength(0);
    });
  });
});
