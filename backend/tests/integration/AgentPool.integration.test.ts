/**
 * AgentPool Integration Tests
 * Tests end-to-end agent lifecycle with real LLMFactory but mocked API calls
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentPool } from '../../src/core/AgentPool.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { ProjectConfig } from '../../src/config/ProjectConfig.js';
import { AgentContext, AgentLifecycleEvent } from '../../src/types/agent.js';
import { AnthropicProvider } from '../../src/llm/providers/AnthropicProvider.js';
import { OpenAIProvider } from '../../src/llm/providers/OpenAIProvider.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('AgentPool Integration Tests', () => {
  let agentPool: AgentPool;
  let llmFactory: LLMFactory;
  let projectConfig: ProjectConfig;
  let testDir: string;
  let configPath: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentpool-test-'));

    // Create test config file
    configPath = path.join(testDir, '.bmad', 'project-config.yaml');
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    const configContent = `
project:
  name: Test Project
  description: Integration test project
  repository: test

onboarding:
  tech_stack:
    - docs/tech-stack.md
  coding_standards: docs/standards.md
  architecture_patterns: docs/patterns.md

agent_assignments:
  mary:
    model: claude-sonnet-4-5
    provider: anthropic
    reasoning: Business analyst agent
  john:
    model: gpt-4o
    provider: openai
    reasoning: Product manager agent

cost_management:
  max_monthly_budget: 1000
  alert_threshold: 0.8
  fallback_model: claude-haiku
`;

    await fs.writeFile(configPath, configContent);

    // Create agent personas
    const agentsDir = path.join(testDir, 'bmad', 'bmm', 'agents');
    await fs.mkdir(agentsDir, { recursive: true });

    await fs.writeFile(
      path.join(agentsDir, 'mary.md'),
      '# Mary - Business Analyst\nExpert in requirements gathering.'
    );

    await fs.writeFile(
      path.join(agentsDir, 'john.md'),
      '# John - Product Manager\nExpert in product strategy.'
    );

    // Change working directory to test directory
    process.chdir(testDir);

    // Load project config
    projectConfig = await ProjectConfig.loadConfig(configPath);

    // Create LLM factory with mocked providers
    llmFactory = new LLMFactory(path.join(testDir, 'logs'));

    // Mock Anthropic provider
    const mockAnthropicProvider = new AnthropicProvider();
    // Mock the createClient method to return a mock client
    vi.spyOn(mockAnthropicProvider, 'createClient').mockResolvedValue({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      invoke: vi.fn().mockResolvedValue('Anthropic mock response'),
      stream: vi.fn(),
      estimateCost: vi.fn().mockReturnValue(0.002),
      getTokenUsage: vi.fn().mockReturnValue({
        input_tokens: 120,
        output_tokens: 80,
        total_tokens: 200
      })
    } as any);

    // Mock OpenAI provider
    const mockOpenAIProvider = new OpenAIProvider();
    vi.spyOn(mockOpenAIProvider, 'createClient').mockResolvedValue({
      provider: 'openai',
      model: 'gpt-4o',
      invoke: vi.fn().mockResolvedValue('OpenAI mock response'),
      stream: vi.fn(),
      estimateCost: vi.fn().mockReturnValue(0.0015),
      getTokenUsage: vi.fn().mockReturnValue({
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150
      })
    } as any);

    llmFactory.registerProvider('anthropic', mockAnthropicProvider);
    llmFactory.registerProvider('openai', mockOpenAIProvider);

    // Create AgentPool
    agentPool = new AgentPool(llmFactory, projectConfig, {
      maxConcurrentAgents: 2,
      autoCleanupHungAgents: false
    });
  });

  afterEach(async () => {
    await agentPool.shutdown();

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('End-to-End Agent Lifecycle', () => {
    it('should create, invoke, and destroy agent', async () => {
      const context: AgentContext = {
        onboardingDocs: ['doc1.md'],
        workflowState: { step: 1 },
        taskDescription: 'Test task'
      };

      // Create agent
      const agent = await agentPool.createAgent('mary', context);
      expect(agent).toBeDefined();
      expect(agent.name).toBe('mary');
      expect(agent.persona).toContain('Business Analyst');

      // Invoke agent
      const response = await agentPool.invokeAgent(agent.id, 'Test prompt');
      expect(response).toBe('Anthropic mock response');
      expect(agent.estimatedCost).toBeGreaterThan(0);

      // Destroy agent
      await agentPool.destroyAgent(agent.id);
      expect(agentPool.getActiveAgents()).toHaveLength(0);
    });

    it('should handle multiple agents in parallel', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Parallel test'
      };

      // Create two agents
      const mary = await agentPool.createAgent('mary', context);
      const john = await agentPool.createAgent('john', context);

      expect(agentPool.getActiveAgents()).toHaveLength(2);

      // Invoke both agents
      const [response1, response2] = await Promise.all([
        agentPool.invokeAgent(mary.id, 'Mary task'),
        agentPool.invokeAgent(john.id, 'John task')
      ]);

      expect(response1).toBe('Anthropic mock response');
      expect(response2).toBe('OpenAI mock response');

      // Check cost tracking
      const costMetrics = agentPool.getCostMetrics();
      expect(costMetrics.byAgent['mary']).toBeGreaterThan(0);
      expect(costMetrics.byAgent['john']).toBeGreaterThan(0);
      expect(costMetrics.total).toBeGreaterThan(0);

      // Destroy agents
      await Promise.all([
        agentPool.destroyAgent(mary.id),
        agentPool.destroyAgent(john.id)
      ]);

      expect(agentPool.getActiveAgents()).toHaveLength(0);
    });

    it('should process queue when agent destroyed', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Queue test'
      };

      // Fill pool (max 2 agents)
      const agent1 = await agentPool.createAgent('mary', context);
      const agent2 = await agentPool.createAgent('john', context);

      // Third agent should queue
      const agent3Promise = agentPool.createAgent('mary', context);

      // Verify queue
      expect(agentPool.getQueuedTasks()).toHaveLength(1);

      // Destroy first agent to trigger queue processing
      await agentPool.destroyAgent(agent1.id);

      // Wait for queued agent to be created
      const agent3 = await agent3Promise;
      expect(agent3).toBeDefined();
      expect(agentPool.getQueuedTasks()).toHaveLength(0);

      // Cleanup
      await agentPool.destroyAgent(agent2.id);
      await agentPool.destroyAgent(agent3.id);
    });
  });

  describe('Event Emission', () => {
    it('should emit all lifecycle events in order', async () => {
      const events: AgentLifecycleEvent[] = [];

      agentPool.on(AgentLifecycleEvent.STARTED, () => {
        events.push(AgentLifecycleEvent.STARTED);
      });

      agentPool.on(AgentLifecycleEvent.INVOKED, () => {
        events.push(AgentLifecycleEvent.INVOKED);
      });

      agentPool.on(AgentLifecycleEvent.COMPLETED, () => {
        events.push(AgentLifecycleEvent.COMPLETED);
      });

      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Event test'
      };

      // Create, invoke, destroy
      const agent = await agentPool.createAgent('mary', context);
      await agentPool.invokeAgent(agent.id, 'Test prompt');
      await agentPool.destroyAgent(agent.id);

      expect(events).toEqual([
        AgentLifecycleEvent.STARTED,
        AgentLifecycleEvent.INVOKED,
        AgentLifecycleEvent.COMPLETED
      ]);
    });
  });

  describe('Error Recovery', () => {
    it('should handle LLM invocation errors gracefully', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Error test'
      };

      const agent = await agentPool.createAgent('mary', context);

      // Mock invocation failure
      const mockInvoke = agent.llmClient.invoke as any;
      mockInvoke.mockRejectedValueOnce(new Error('LLM API error'));

      await expect(agentPool.invokeAgent(agent.id, 'Test prompt'))
        .rejects.toThrow();

      // Agent should still be active
      expect(agentPool.getAgentById(agent.id)).toBeDefined();

      // Should be able to invoke again after error
      mockInvoke.mockResolvedValueOnce('Success after error');
      const response = await agentPool.invokeAgent(agent.id, 'Retry prompt');
      expect(response).toBe('Success after error');

      // Cleanup
      await agentPool.destroyAgent(agent.id);
    });
  });

  describe('Multiple Invocations', () => {
    it('should accumulate cost across multiple invocations', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Multi-invoke test'
      };

      const agent = await agentPool.createAgent('mary', context);

      // Multiple invocations
      await agentPool.invokeAgent(agent.id, 'Prompt 1');
      await agentPool.invokeAgent(agent.id, 'Prompt 2');
      await agentPool.invokeAgent(agent.id, 'Prompt 3');

      // Cost should accumulate
      expect(agent.estimatedCost).toBeGreaterThan(0.004); // 3 x 0.002

      const costMetrics = agentPool.getCostMetrics();
      expect(costMetrics.byAgent['mary']).toBeGreaterThan(0.004);

      // Cleanup
      await agentPool.destroyAgent(agent.id);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent agent creation and destruction', async () => {
      const context: AgentContext = {
        onboardingDocs: [],
        workflowState: {},
        taskDescription: 'Concurrent test'
      };

      // Create multiple agents concurrently
      const createPromises = [
        agentPool.createAgent('mary', context),
        agentPool.createAgent('john', context),
        agentPool.createAgent('mary', context) // Should queue
      ];

      const agents = await Promise.all(createPromises);

      // At least 2 should be active (third might be queued or processed)
      expect(agents).toHaveLength(3);

      // Destroy all agents
      await Promise.all(agents.map(agent => agentPool.destroyAgent(agent.id)));

      expect(agentPool.getActiveAgents()).toHaveLength(0);
    });
  });
});
