/**
 * AgentPool - Manages AI agent lifecycle and resource limits
 * Handles agent creation, invocation, destruction, and queueing
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { LLMFactory } from '../llm/LLMFactory.js';
import { LLMClient } from '../llm/LLMClient.interface.js';
import { LLMConfig } from '../types/llm.types.js';
import { ProjectConfig } from '../config/ProjectConfig.js';
import {
  Agent,
  AgentContext,
  AgentTask,
  AgentPoolStats,
  CostMetrics,
  AgentLifecycleEvent,
  AgentEventPayload,
  AgentPoolConfig,
  AgentPoolError
} from '../types/agent.js';

/**
 * AgentPool class - Manages agent lifecycle and resource limits
 */
export class AgentPool {
  /** Active agents map: agentId -> Agent */
  private activeAgents: Map<string, Agent> = new Map();

  /** Queue of tasks waiting for available agent slots */
  private agentQueue: AgentTask[] = [];

  /** Maximum concurrent agents allowed */
  private maxConcurrentAgents: number;

  /** Configuration for agent pool behavior */
  private config: AgentPoolConfig;

  /** Total agents created in pool lifetime */
  private totalAgentsCreated: number = 0;

  /** Total cost incurred by all agents */
  private totalCost: number = 0;

  /** Cost breakdown by agent name */
  private costByAgent: Record<string, number> = {};

  /** Cost breakdown by workflow */
  private costByWorkflow: Record<string, number> = {};

  /** Cost breakdown by project */
  private costByProject: Record<string, number> = {};

  /** Health check interval handle */
  private healthCheckInterval?: NodeJS.Timeout;

  /** Event listeners */
  private eventListeners: Map<AgentLifecycleEvent, Array<(payload: AgentEventPayload) => void>> = new Map();

  /**
   * Create AgentPool with dependency injection
   * @param llmFactory LLM factory for creating LLM clients
   * @param projectConfig Project configuration
   * @param config Optional pool configuration overrides
   */
  constructor(
    private llmFactory: LLMFactory,
    private projectConfig: ProjectConfig,
    config?: Partial<AgentPoolConfig>
  ) {
    // Set default configuration
    this.config = {
      maxConcurrentAgents: config?.maxConcurrentAgents ?? 3,
      healthCheckInterval: config?.healthCheckInterval ?? 60000, // 1 minute
      maxAgentExecutionTime: config?.maxAgentExecutionTime ?? 3600000, // 1 hour
      autoCleanupHungAgents: config?.autoCleanupHungAgents ?? true
    };

    this.maxConcurrentAgents = this.config.maxConcurrentAgents;

    // Log pool initialization
    this.log(`AgentPool initialized with max ${this.maxConcurrentAgents} concurrent agents`);

    // Start health check if enabled
    if (this.config.autoCleanupHungAgents) {
      this.startHealthCheck();
    }
  }

  /**
   * Create an agent with specified configuration
   * @param name Agent name (e.g., "mary", "winston")
   * @param context Agent context
   * @returns Promise resolving to created Agent
   */
  async createAgent(name: string, context: AgentContext): Promise<Agent> {
    // Validate agent name (alphanumeric, hyphens, underscores only)
    if (!/^[a-z0-9-_]+$/i.test(name)) {
      throw new AgentPoolError(
        `Invalid agent name "${name}". Agent names must contain only alphanumeric characters, hyphens, and underscores.`,
        'INVALID_AGENT_NAME',
        name
      );
    }

    this.log(`Creating agent "${name}"...`);

    // Check if pool is at capacity - queue the task if so
    if (this.activeAgents.size >= this.maxConcurrentAgents) {
      this.log(`Agent pool at capacity (${this.activeAgents.size}/${this.maxConcurrentAgents}). Queueing agent "${name}"...`);

      // Create a promise that will be resolved when the agent is created
      return new Promise((resolve, reject) => {
        const task: AgentTask = {
          id: randomUUID(),
          agentName: name,
          llmConfig: null, // Will be loaded when processing queue
          context,
          priority: 0, // Default FIFO priority
          queuedAt: new Date(),
          resolve,
          reject
        };

        // Add to queue
        this.agentQueue.push(task);
        this.log(`Agent "${name}" queued (position: ${this.agentQueue.length})`);
      });
    }

    // Load agent LLM configuration from project config
    const agentConfig = this.projectConfig.getAgentConfig(name);
    if (!agentConfig) {
      throw new AgentPoolError(
        `Agent "${name}" not found in project configuration. Please add to agent_assignments in .bmad/project-config.yaml`,
        'AGENT_NOT_CONFIGURED',
        name
      );
    }

    // Validate provider and model
    this.log(`Agent "${name}" configured with provider: ${agentConfig.provider}, model: ${agentConfig.model}`);

    // Create LLM config from agent config
    const llmConfig: LLMConfig = {
      model: agentConfig.model,
      provider: agentConfig.provider,
      base_url: agentConfig.base_url,
      api_key: agentConfig.api_key,
      reasoning: agentConfig.reasoning
    };

    // Create LLM client via factory
    let llmClient: LLMClient;
    try {
      llmClient = await this.llmFactory.createClient(llmConfig);
      this.log(`LLM client created for agent "${name}" (${agentConfig.provider}/${agentConfig.model})`);
    } catch (error) {
      throw new AgentPoolError(
        `Failed to create LLM client for agent "${name}": ${(error as Error).message}`,
        'LLM_CLIENT_CREATION_FAILED',
        name
      );
    }

    // Load agent persona from markdown file
    let persona: string;
    try {
      const personaPath = path.join(process.cwd(), 'bmad', 'bmm', 'agents', `${name}.md`);
      this.log(`Loading persona from: ${personaPath}`);
      persona = await fs.readFile(personaPath, 'utf-8');
    } catch (error) {
      throw new AgentPoolError(
        `Failed to load persona for agent "${name}" from bmad/bmm/agents/${name}.md: ${(error as Error).message}`,
        'PERSONA_LOAD_FAILED',
        name
      );
    }

    // Generate unique agent ID
    const agentId = randomUUID();

    // Create agent object
    const agent: Agent = {
      id: agentId,
      name,
      persona,
      llmClient,
      context,
      startTime: new Date(),
      estimatedCost: 0
    };

    // Add to active agents map
    this.activeAgents.set(agentId, agent);

    // Update counters
    this.totalAgentsCreated++;

    // Initialize cost tracking for this agent
    if (!this.costByAgent[name]) {
      this.costByAgent[name] = 0;
    }

    // Emit agent.started event
    this.emit(AgentLifecycleEvent.STARTED, {
      agentId,
      agentName: name,
      data: {
        provider: agentConfig.provider,
        model: agentConfig.model
      },
      timestamp: new Date()
    });

    this.log(`Agent "${name}" (${agentId}) created successfully. Active agents: ${this.activeAgents.size}/${this.maxConcurrentAgents}`);

    return agent;
  }

  /** Queue processing lock to prevent concurrent queue processing */
  private isProcessingQueue: boolean = false;

  /**
   * Process next queued task if available
   * Called after agent destruction to create waiting agents
   */
  private async processQueue(): Promise<void> {
    // Prevent concurrent queue processing
    if (this.isProcessingQueue) {
      return;
    }

    // Check if queue is empty
    if (this.agentQueue.length === 0) {
      return;
    }

    // Check if pool has capacity
    if (this.activeAgents.size >= this.maxConcurrentAgents) {
      return;
    }

    // Set processing lock
    this.isProcessingQueue = true;

    try {
      // Sort queue by priority (higher priority first), then by queued time (FIFO)
      this.agentQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.queuedAt.getTime() - b.queuedAt.getTime(); // Earlier queued first
      });

      // Get next task from queue
      const task = this.agentQueue.shift();
      if (!task) {
        return;
      }

      this.log(`Processing queued task for agent "${task.agentName}" (queued ${Date.now() - task.queuedAt.getTime()}ms ago)`);

      // Create the agent
      try {
        const agent = await this.createAgent(task.agentName, task.context);
        task.resolve(agent);
      } catch (error) {
        task.reject(error as Error);
      }
    } finally {
      // Always release the lock
      this.isProcessingQueue = false;
    }
  }

  /**
   * Invoke an agent with a prompt
   * @param agentId Agent identifier
   * @param prompt Prompt to send to agent
   * @returns Promise resolving to agent response
   */
  async invokeAgent(agentId: string, prompt: string): Promise<string> {
    // Retrieve agent from map
    const agent = this.activeAgents.get(agentId);

    // Validate agent exists
    if (!agent) {
      throw new AgentPoolError(
        `Agent with ID "${agentId}" not found. Agent may have been destroyed or never existed.`,
        'AGENT_NOT_FOUND',
        agentId
      );
    }

    this.log(`Invoking agent "${agent.name}" (${agentId}) with prompt (${prompt.length} chars)`);

    // Track request start time
    const startTime = Date.now();

    // Call LLM client to invoke
    let response: string;
    try {
      response = await agent.llmClient.invoke(prompt);
      this.log(`Agent "${agent.name}" (${agentId}) responded (${response.length} chars)`);
    } catch (error) {
      this.log(`Agent "${agent.name}" (${agentId}) invocation failed: ${(error as Error).message}`);

      // Emit error event
      this.emit(AgentLifecycleEvent.ERROR, {
        agentId,
        agentName: agent.name,
        data: {
          error: (error as Error).message,
          prompt: prompt.substring(0, 100) + '...' // Truncate for logging
        },
        timestamp: new Date()
      });

      throw new AgentPoolError(
        `Failed to invoke agent "${agent.name}" (${agentId}): ${(error as Error).message}`,
        'INVOCATION_FAILED',
        agentId
      );
    }

    // Track request end time and calculate latency
    const latencyMs = Date.now() - startTime;

    // Get token usage from LLM client
    const tokenUsage = agent.llmClient.getTokenUsage();

    // Estimate cost for this invocation
    const invocationCost = agent.llmClient.estimateCost(prompt, response);

    // Update agent's estimated cost
    agent.estimatedCost += invocationCost;

    // Update global cost tracking
    this.totalCost += invocationCost;
    this.costByAgent[agent.name] = (this.costByAgent[agent.name] || 0) + invocationCost;

    // Log invocation details (sanitized)
    this.log(
      `Agent "${agent.name}" (${agentId}) invocation complete: ` +
      `latency=${latencyMs}ms, cost=$${invocationCost.toFixed(6)}, ` +
      `tokens=${tokenUsage?.total_tokens || 'unknown'}`
    );

    // Emit invocation event
    this.emit(AgentLifecycleEvent.INVOKED, {
      agentId,
      agentName: agent.name,
      data: {
        latencyMs,
        cost: invocationCost,
        tokenUsage
      },
      timestamp: new Date()
    });

    return response;
  }

  /**
   * Destroy an agent and clean up resources
   * @param agentId Agent identifier
   */
  async destroyAgent(agentId: string): Promise<void> {
    // Retrieve agent from map
    const agent = this.activeAgents.get(agentId);

    // Validate agent exists
    if (!agent) {
      throw new AgentPoolError(
        `Cannot destroy agent "${agentId}": Agent not found`,
        'AGENT_NOT_FOUND',
        agentId
      );
    }

    this.log(`Destroying agent "${agent.name}" (${agentId})...`);

    // Set timeout to ensure cleanup completes within 30 seconds
    const cleanupTimeout = setTimeout(() => {
      this.log(`WARNING: Agent cleanup for "${agent.name}" (${agentId}) exceeded 30 second timeout`);
    }, 30000);

    try {
      // Calculate final execution time
      const endTime = new Date();
      const executionTimeMs = endTime.getTime() - agent.startTime.getTime();
      this.log(`Agent "${agent.name}" (${agentId}) execution time: ${executionTimeMs}ms, cost: $${agent.estimatedCost.toFixed(6)}`);

      // Save execution logs (simple logging for now - could be enhanced with file/db storage)
      this.log(`Agent "${agent.name}" (${agentId}) execution summary:
  - Start: ${agent.startTime.toISOString()}
  - End: ${endTime.toISOString()}
  - Duration: ${executionTimeMs}ms
  - Cost: $${agent.estimatedCost.toFixed(6)}
  - Provider: ${agent.llmClient.provider}
  - Model: ${agent.llmClient.model}`);

      // Release LLM client connection (graceful cleanup)
      // Note: LLMClient interface doesn't define cleanup method, but we'll add logging
      this.log(`Releasing LLM client for agent "${agent.name}" (${agentId})`);

      // Remove agent from activeAgents map
      this.activeAgents.delete(agentId);
      this.log(`Agent "${agent.name}" (${agentId}) removed from active pool. Active agents: ${this.activeAgents.size}/${this.maxConcurrentAgents}`);

      // Emit agent.completed event
      this.emit(AgentLifecycleEvent.COMPLETED, {
        agentId,
        agentName: agent.name,
        data: {
          executionTimeMs,
          totalCost: agent.estimatedCost,
          provider: agent.llmClient.provider,
          model: agent.llmClient.model
        },
        timestamp: endTime
      });

      // Process next queued task if any
      if (this.agentQueue.length > 0) {
        this.log(`Processing next queued task (${this.agentQueue.length} tasks in queue)`);
        // Process queue asynchronously (don't block destruction)
        this.processQueue().catch(error => {
          this.log(`Error processing queue after agent destruction: ${error.message}`);
        });
      }

      this.log(`Agent "${agent.name}" (${agentId}) destroyed successfully`);
    } finally {
      // Clear the timeout
      clearTimeout(cleanupTimeout);
    }
  }

  /**
   * Get list of active agents
   * @param filters Optional filters for agents
   * @returns Array of active agents
   */
  getActiveAgents(filters?: { name?: string; startedAfter?: Date; startedBefore?: Date }): Agent[] {
    let agents = Array.from(this.activeAgents.values());

    // Apply filters if provided
    if (filters) {
      if (filters.name) {
        agents = agents.filter(agent => agent.name === filters.name);
      }

      if (filters.startedAfter) {
        agents = agents.filter(agent => agent.startTime >= filters.startedAfter!);
      }

      if (filters.startedBefore) {
        agents = agents.filter(agent => agent.startTime <= filters.startedBefore!);
      }
    }

    return agents;
  }

  /**
   * Get agent by ID
   * @param agentId Agent identifier
   * @returns Agent or undefined if not found
   */
  getAgentById(agentId: string): Agent | undefined {
    return this.activeAgents.get(agentId);
  }

  /**
   * Get queued tasks
   * @returns Array of queued tasks
   */
  getQueuedTasks(): AgentTask[] {
    return [...this.agentQueue];
  }

  /**
   * Get agent pool statistics
   * @returns Pool statistics
   */
  getStats(): AgentPoolStats {
    return {
      activeAgents: this.activeAgents.size,
      maxConcurrentAgents: this.maxConcurrentAgents,
      queuedTasks: this.agentQueue.length,
      totalAgentsCreated: this.totalAgentsCreated,
      totalCost: this.totalCost
    };
  }

  /**
   * Get cost metrics
   * @returns Cost breakdown by various dimensions
   */
  getCostMetrics(): CostMetrics {
    return {
      byAgent: { ...this.costByAgent },
      byWorkflow: { ...this.costByWorkflow },
      byProject: { ...this.costByProject },
      total: this.totalCost
    };
  }

  /**
   * Register event listener
   * @param event Event type
   * @param listener Listener function
   */
  on(event: AgentLifecycleEvent, listener: (payload: AgentEventPayload) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Emit event to listeners
   * @param event Event type
   * @param payload Event payload
   */
  private emit(event: AgentLifecycleEvent, payload: AgentEventPayload): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(payload);
        } catch (error) {
          this.log(`Error in event listener for ${event}: ${(error as Error).message}`);
        }
      }
    }
  }

  /**
   * Start health check interval
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkAgentHealth();
    }, this.config.healthCheckInterval);
  }

  /**
   * Check health of active agents and cleanup hung agents
   */
  private async checkAgentHealth(): Promise<void> {
    const now = new Date();
    const maxExecutionTime = this.config.maxAgentExecutionTime;

    for (const [agentId, agent] of this.activeAgents.entries()) {
      const executionTime = now.getTime() - agent.startTime.getTime();

      if (executionTime > maxExecutionTime) {
        this.log(`Agent ${agentId} (${agent.name}) has exceeded max execution time (${executionTime}ms > ${maxExecutionTime}ms). Cleaning up...`);

        try {
          await this.destroyAgent(agentId);
        } catch (error) {
          this.log(`Failed to cleanup hung agent ${agentId}: ${(error as Error).message}`);
        }
      }
    }
  }

  /**
   * Stop health check interval
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Shutdown the agent pool
   * Destroys all active agents and stops health checks
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down AgentPool...');

    // Stop health check
    this.stopHealthCheck();

    // Destroy all active agents
    const destroyPromises = Array.from(this.activeAgents.keys()).map(agentId =>
      this.destroyAgent(agentId).catch(error => {
        this.log(`Failed to destroy agent ${agentId} during shutdown: ${(error as Error).message}`);
      })
    );

    await Promise.all(destroyPromises);

    this.log('AgentPool shutdown complete');
  }

  /**
   * Log message (simple console logging for now)
   * @param message Log message
   */
  private log(message: string): void {
    console.log(`[AgentPool] ${message}`);
  }
}
