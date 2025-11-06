/**
 * Agent Type Definitions
 * Defines types for agent instances, context, and pool management
 */

import { LLMClient } from '../llm/LLMClient.interface.js';

/**
 * Agent context containing all information needed for agent execution
 */
export interface AgentContext {
  /** Onboarding documentation content */
  onboardingDocs: string[];

  /** Current workflow state and phase information */
  workflowState: Record<string, unknown>;

  /** Current task description */
  taskDescription: string;

  /** Optional previous phase outputs for context */
  previousPhaseOutputs?: Record<string, unknown>;
}

/**
 * Agent instance representing an active AI agent
 */
export interface Agent {
  /** Unique agent identifier (UUID) */
  id: string;

  /** Agent name (e.g., "mary", "winston", "amelia") */
  name: string;

  /** Agent persona loaded from bmad/bmm/agents/{name}.md */
  persona: string;

  /** LLM client for this agent */
  llmClient: LLMClient;

  /** Agent execution context */
  context: AgentContext;

  /** Agent creation timestamp */
  startTime: Date;

  /** Estimated cost in USD for agent execution */
  estimatedCost: number;
}

/**
 * Task queued for execution when agent pool at capacity
 */
export interface AgentTask {
  /** Unique task identifier */
  id: string;

  /** Agent name to create */
  agentName: string;

  /** Agent context */
  context: AgentContext;

  /** Task priority (higher = more urgent) */
  priority: number;

  /** Timestamp when task was queued */
  queuedAt: Date;

  /** Promise resolver function called when agent created */
  resolve: (agent: Agent) => void;

  /** Promise rejector function called on error */
  reject: (error: Error) => void;
}

/**
 * Agent pool statistics
 */
export interface AgentPoolStats {
  /** Current number of active agents */
  activeAgents: number;

  /** Maximum concurrent agents allowed */
  maxConcurrentAgents: number;

  /** Number of queued tasks */
  queuedTasks: number;

  /** Total agents created in pool lifetime */
  totalAgentsCreated: number;

  /** Total cost incurred by all agents */
  totalCost: number;
}

/**
 * Cost breakdown by dimension
 */
export interface CostMetrics {
  /** Cost aggregated by agent name */
  byAgent: Record<string, number>;

  /** Cost aggregated by workflow */
  byWorkflow: Record<string, number>;

  /** Cost aggregated by project */
  byProject: Record<string, number>;

  /** Total cost across all dimensions */
  total: number;
}

/**
 * Agent lifecycle events
 */
export enum AgentLifecycleEvent {
  /** Emitted when agent is created */
  STARTED = 'agent.started',

  /** Emitted when agent completes and is destroyed */
  COMPLETED = 'agent.completed',

  /** Emitted when agent invocation occurs */
  INVOKED = 'agent.invoked',

  /** Emitted when agent encounters an error */
  ERROR = 'agent.error'
}

/**
 * Agent event payload
 */
export interface AgentEventPayload {
  /** Agent ID */
  agentId: string;

  /** Agent name */
  agentName: string;

  /** Event-specific data */
  data?: Record<string, unknown>;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Agent pool configuration
 */
export interface AgentPoolConfig {
  /** Maximum concurrent agents (default: 3) */
  maxConcurrentAgents: number;

  /** Agent health check interval in milliseconds (default: 60000) */
  healthCheckInterval: number;

  /** Maximum agent execution time before considering hung (default: 3600000 = 1 hour) */
  maxAgentExecutionTime: number;

  /** Enable automatic cleanup of hung agents (default: true) */
  autoCleanupHungAgents: boolean;
}

/**
 * Error thrown when agent pool operations fail
 */
export class AgentPoolError extends Error {
  constructor(
    message: string,
    public code: string,
    public agentId?: string
  ) {
    super(message);
    this.name = 'AgentPoolError';
  }
}
