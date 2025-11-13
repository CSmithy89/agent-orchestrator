/**
 * Epic 5: Story Implementation Automation - Workflow Orchestration Types
 *
 * Type definitions for workflow orchestration, state management, and PR creation.
 * These types extend Epic 1 core types with Story 5.3 specific requirements.
 */

/**
 * Story Workflow State
 *
 * Extends Epic 1 WorkflowState with story-specific orchestration data.
 * Persisted to `.bmad/state/story-workflow-{storyId}.json` for resume capability.
 */
export interface StoryWorkflowState {
  /** Project information (from WorkflowState) */
  project: {
    id: string;
    name: string;
    level: number;
  };

  /** Currently executing workflow path (from WorkflowState) */
  currentWorkflow: string;

  /** Workflow execution status (from WorkflowState) */
  status: 'running' | 'paused' | 'completed' | 'error';

  /** Workflow variables (from WorkflowState) */
  variables: Record<string, any>;

  /** When workflow execution started (from WorkflowState) */
  startTime: Date;

  /** Last time state was updated (from WorkflowState) */
  lastUpdate: Date;

  /** Workflow type identifier */
  workflow: 'dev-story';

  /** Story identifier (e.g., "5-3-workflow-orchestration-state-management") */
  storyId: string;

  /**
   * Current workflow step (1-14)
   * 1: Generate context
   * 2: Create worktree
   * 3: Implement story (Amelia)
   * 4: Apply code changes
   * 5: Generate tests (Amelia)
   * 6: Apply test changes
   * 7: Run tests
   * 8: Fix failing tests (if needed)
   * 9: Self-review (Amelia)
   * 10: Independent review (Alex)
   * 11: Review decision
   * 12: Create PR
   * 13: Monitor CI and auto-merge
   * 14: Cleanup
   */
  currentStep: number;

  /** Worktree absolute path (e.g., "/path/to/wt/story-5-3") */
  worktreePath?: string;

  /** Git branch name (e.g., "story/5-3-workflow-orchestration") */
  branchName?: string;

  /** Agent activity tracking for Amelia and Alex */
  agentActivity: {
    /** Amelia (Developer) agent activity */
    amelia: AgentActivity;
    /** Alex (Code Reviewer) agent activity */
    alex: AgentActivity;
  };

  /** Dual-agent review status */
  reviewStatus: ReviewStatus;

  /** Pull request URL (e.g., "https://github.com/org/repo/pull/123") */
  prUrl?: string;

  /** CI status for PR */
  ciStatus?: 'pending' | 'running' | 'passed' | 'failed';

  /** Performance metrics for workflow execution */
  performance: PerformanceMetrics;
}

/**
 * Agent Activity Tracking
 *
 * Tracks an agent's lifecycle during story workflow execution.
 */
export interface AgentActivity {
  /** Current agent status */
  status: 'idle' | 'implementing' | 'testing' | 'reviewing' | 'completed' | 'failed';

  /** Agent start time */
  startTime?: Date;

  /** Agent end time */
  endTime?: Date;

  /** Agent ID from AgentPool (for cleanup) */
  agentId?: string;

  /** Error message if agent failed */
  error?: string;
}

/**
 * Review Status
 *
 * Aggregates both Amelia self-review and Alex independent review results.
 */
export interface ReviewStatus {
  /** Amelia self-review passed (no critical issues) */
  selfReviewPassed: boolean;

  /** Alex independent review passed */
  independentReviewPassed: boolean;

  /** Combined confidence score (0.0-1.0) */
  confidence: number;

  /** Critical issues requiring fix */
  criticalIssues?: string[];

  /** Fixable issues identified */
  fixableIssues?: string[];
}

/**
 * Performance Metrics
 *
 * Tracks duration for each major workflow phase.
 * Target: Complete workflow <2 hours.
 */
export interface PerformanceMetrics {
  /** Context generation duration (ms) */
  contextGeneration?: number;

  /** Worktree creation duration (ms) */
  worktreeCreation?: number;

  /** Implementation duration (ms) */
  implementation?: number;

  /** Test generation duration (ms) */
  testGeneration?: number;

  /** Test execution duration (ms) */
  testExecution?: number;

  /** Self-review duration (ms) */
  selfReview?: number;

  /** Independent review duration (ms) */
  independentReview?: number;

  /** PR creation duration (ms) */
  prCreation?: number;

  /** CI monitoring duration (ms) */
  ciMonitoring?: number;

  /** Total workflow duration (ms) */
  totalDuration?: number;
}

/**
 * PR Creation Result
 *
 * Result of successful PR creation via PRCreationAutomator.
 */
export interface PRResult {
  /** Pull request URL */
  url: string;

  /** Pull request number */
  number: number;

  /** PR title */
  title: string;

  /** PR body/description */
  body: string;

  /** Base branch (e.g., "main") */
  baseBranch: string;

  /** Head branch (e.g., "story/5-3-workflow-orchestration") */
  headBranch: string;

  /** PR state */
  state: 'open' | 'merged' | 'closed';

  /** Whether auto-merge is enabled */
  autoMergeEnabled: boolean;
}

/**
 * Workflow Configuration
 *
 * Configuration for WorkflowOrchestrator behavior.
 */
export interface WorkflowOrchestratorConfig {
  /** Project root directory */
  projectRoot: string;

  /** Path to sprint-status.yaml */
  sprintStatusPath?: string;

  /** Path to workflow state directory */
  statePath?: string;

  /** Enable auto-merge after CI passes (default: false) */
  autoMerge?: boolean;

  /** Max test fix attempts (default: 3) */
  maxTestFixAttempts?: number;

  /** Max retry attempts for LLM failures (default: 3) */
  maxRetryAttempts?: number;

  /** Base delay for exponential backoff (ms, default: 1000) */
  baseRetryDelay?: number;

  /** Enable graceful degradation (Alex unavailable -> Amelia only) */
  enableGracefulDegradation?: boolean;

  /** Minimum confidence threshold for PR creation (default: 0.85) */
  minConfidenceThreshold?: number;
}

/**
 * Escalation Context
 *
 * Context for escalating story to human review.
 */
export interface EscalationContext {
  /** Story ID */
  storyId: string;

  /** Reason for escalation */
  reason: 'low-confidence' | 'critical-issues' | 'test-failures' | 'ci-failures' | 'persistent-failures';

  /** Workflow step where escalation occurred */
  step: number;

  /** Detailed error message */
  errorMessage: string;

  /** Self-review report (if available) */
  selfReview?: unknown;

  /** Independent review report (if available) */
  independentReview?: unknown;

  /** Workflow state at escalation */
  state: StoryWorkflowState;

  /** Timestamp of escalation */
  timestamp: Date;
}

/**
 * Step Execution Result
 *
 * Result of executing a single workflow step.
 */
export interface StepExecutionResult {
  /** Step number */
  step: number;

  /** Step name/description */
  name: string;

  /** Whether step succeeded */
  success: boolean;

  /** Duration in milliseconds */
  duration: number;

  /** Error if step failed */
  error?: Error;

  /** Step output data */
  data?: unknown;
}
