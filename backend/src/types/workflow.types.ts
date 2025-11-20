/**
 * Workflow Type Definitions
 * Defines the schema for workflow.yaml, workflow state persistence, and related structures
 */

import { EventType } from '../api/types/events.types.js';
/**
 * Workflow configuration schema
 * Parsed from workflow.yaml files
 */
export interface WorkflowConfig {
  /** Workflow name */
  name: string;

  /** Workflow description */
  description: string;

  /** Workflow author */
  author: string;

  /** Path to config source file (e.g., bmad/bmm/config.yaml) */
  config_source: string;

  /** Resolved output folder path */
  output_folder: string;

  /** User name from config */
  user_name: string;

  /** Communication language from config */
  communication_language: string;

  /** System-generated date (ISO format: YYYY-MM-DD) */
  date: string;

  /** Workflow installation path */
  installed_path: string;

  /** Optional template file path */
  template?: string;

  /** Instructions file path (markdown with XML tags) */
  instructions: string;

  /** Optional validation checklist path */
  validation?: string;

  /** Optional default output file path */
  default_output_file?: string;

  /** Custom workflow variables */
  variables?: Record<string, any>;

  /** Whether workflow is standalone */
  standalone: boolean;
}

/**
 * Workflow step structure
 * Parsed from instructions markdown file
 */
export interface Step {
  /** Step number */
  number: number;

  /** Step goal/description */
  goal: string;

  /** Raw markdown/XML content */
  content: string;

  /** Whether step is optional (from optional="true" attribute) */
  optional?: boolean;

  /** Conditional expression (from if="condition" attribute) */
  condition?: string;

  /** Parsed actions within this step */
  actions?: Action[];

  /** Parsed conditional checks within this step */
  checks?: Check[];
}

/**
 * Validation result structure
 * Returned by validateWorkflow method
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Array of error messages (blocking issues) */
  errors: string[];

  /** Array of warning messages (non-blocking issues) */
  warnings: string[];
}

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

// Error classes have been moved to errors.types.ts to avoid duplication
// Import them from there when needed:
// import { WorkflowParseError, StateManagerError, WorkflowExecutionError } from './errors.types.js';

/**
 * Action types in workflow steps
 */
export type ActionType =
  | 'action'
  | 'ask'
  | 'output'
  | 'template-output'
  | 'elicit-required'
  | 'goto'
  | 'invoke-workflow'
  | 'invoke-task';

/**
 * Action definition within a step
 */
export interface Action {
  /** Type of action */
  type: ActionType;

  /** Action content/description */
  content: string;

  /** Optional condition for conditional execution */
  condition?: string;

  /** Optional attributes (e.g., file path for template-output) */
  attributes?: Record<string, string>;
}

/**
 * Conditional check block
 */
export interface Check {
  /** Condition expression to evaluate */
  condition: string;

  /** Actions to execute if condition is true */
  actions: Action[];
}

/**
 * WorkflowEngine options
 */
export interface EngineOptions {
  /** Enable YOLO mode (skip optional steps and prompts) */
  yoloMode?: boolean;

  /** Custom StateManager instance */
  stateManager?: any; // Using 'any' to avoid circular dependency

  /** Custom WorkflowParser instance */
  workflowParser?: any; // Using 'any' to avoid circular dependency

  /** Project root directory (defaults to process.cwd()) */
  projectRoot?: string;

  /** Callback for emitting events */
  onEvent?: (eventType: EventType, payload: any) => void;
}
