/**
 * Workflow Type Definitions
 * Defines the schema for workflow state persistence
 */

/**
 * Project metadata in workflow state
 */
export interface ProjectInfo {
  /** Unique project identifier */
  id: string;

  /** Human-readable project name */
  name: string;

  /** Project level (0-4) indicating complexity */
  level: number;
}

/**
 * Agent activity tracking for workflow execution
 */
export interface AgentActivity {
  /** Unique agent identifier */
  agentId: string;

  /** Human-readable agent name */
  agentName: string;

  /** Action performed by the agent */
  action: string;

  /** Timestamp when action started */
  timestamp: Date;

  /** Duration in milliseconds (optional, set when completed) */
  duration?: number;

  /** Status of the agent action */
  status: 'started' | 'completed' | 'failed';

  /** Output or result from the agent (optional) */
  output?: string;
}

/**
 * Story status tracking for project management
 */
export interface StoryStatus {
  /** Story identifier (e.g., "1.5") */
  storyId: string;

  /** Story title */
  title: string;

  /** Current status of the story */
  status: 'backlog' | 'drafted' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';

  /** Agent assigned to the story (optional) */
  assignedAgent?: string;

  /** When work on the story started (optional) */
  startTime?: Date;

  /** When work on the story completed (optional) */
  endTime?: Date;

  /** Progress percentage (0-100) */
  progressPercent: number;
}

/**
 * Complete workflow state
 * Persisted to bmad/sprint-status.yaml and bmad/workflow-status.md
 */
export interface WorkflowState {
  /** Project information */
  project: ProjectInfo;

  /** Currently executing workflow path */
  currentWorkflow: string;

  /** Current step number in the workflow */
  currentStep: number;

  /** Workflow execution status */
  status: 'running' | 'paused' | 'completed' | 'error';

  /** Workflow variables (key-value pairs) */
  variables: Record<string, any>;

  /** Activity log of agent executions */
  agentActivity: AgentActivity[];

  /** When workflow execution started */
  startTime: Date;

  /** Last time state was updated */
  lastUpdate: Date;
}

/**
 * State management error
 */
export class StateManagerError extends Error {
  constructor(
    message: string,
    public operation?: string,
    public filePath?: string
  ) {
    super(message);
    this.name = 'StateManagerError';
  }
}
