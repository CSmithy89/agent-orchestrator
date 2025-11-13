/**
 * SolutioningWorkflowEngine - Workflow engine for solutioning phase automation
 *
 * Extends base WorkflowEngine with solutioning-specific features:
 * - Worktree management for isolated epic/story development
 * - PRD and architecture loading as workflow inputs
 * - State machine transitions for solutioning phases
 * - Step execution hooks for pre/post processing
 * - Error handling with rollback and retry capabilities
 * - Progress tracking and state persistence
 *
 * This is INFRASTRUCTURE ONLY - no LLM calls or content generation.
 * Actual epic/story generation is deferred to Stories 4.4 and 4.5.
 *
 * @module solutioning/workflow-engine
 * @see docs/epics/epic-4-tech-spec.md - Lines 70-84, 617-630
 * @see docs/stories/4-3-solutioning-workflow-engine-foundation.md
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { WorkflowEngine } from '../core/WorkflowEngine.js';
import { WorktreeManager } from '../core/WorktreeManager.js';
import {
  WorkflowConfig,
  Step,
  EngineOptions
} from '../types/workflow.types.js';
import { WorkflowExecutionError } from '../types/errors.types.js';
import { logger } from '../utils/logger.js';

/**
 * Solutioning workflow state types
 * Represents the current phase of the solutioning workflow
 */
export type SolutioningWorkflowState =
  | 'not_started'
  | 'in_progress'
  | 'review'
  | 'complete';

/**
 * Persisted workflow state structure
 * Used for state persistence to workflow-status.yaml
 */
export interface PersistedWorkflowState {
  workflow: {
    name: string;
    current_step: string;
    status: SolutioningWorkflowState;
    progress_percentage: number;
    started_at?: string;
    completed_at?: string;
  };
}

/**
 * Step execution context
 * Provides context information to step execution hooks
 */
export interface StepContext {
  /** Current step being executed */
  step: Step;
  /** Step number */
  stepNumber: number;
  /** Total number of steps */
  totalSteps: number;
  /** PRD content */
  prdContent?: string;
  /** Architecture content */
  architectureContent?: string;
  /** Custom variables */
  variables: Record<string, any>;
}

/**
 * Step hook function type
 * Hooks can be registered for pre/post step execution
 */
export type StepHook = (context: StepContext) => Promise<void>;

/**
 * Workflow checkpoint for rollback capability
 * Captures workflow state at a specific point in time
 */
export interface WorkflowCheckpoint {
  /** Checkpoint identifier */
  id: string;
  /** Step number when checkpoint was created */
  stepNumber: number;
  /** Workflow state when checkpoint was created */
  state: SolutioningWorkflowState;
  /** Timestamp when checkpoint was created */
  timestamp: Date;
  /** Variables at checkpoint */
  variables: Record<string, any>;
}

/**
 * Workflow execution plan
 * Describes the order and dependencies of workflow steps
 */
export interface ExecutionPlan {
  /** Steps in execution order */
  steps: Step[];
  /** Parallel execution groups (steps that can run concurrently) */
  parallelGroups: Step[][];
  /** Sequential steps (must run one after another) */
  sequentialSteps: Step[];
}

/**
 * Workflow progress information
 * Tracks current progress through the workflow
 */
export interface WorkflowProgress {
  /** Workflow name */
  workflowName: string;
  /** Current step name/description */
  currentStep: string;
  /** Progress percentage (0-100) */
  progressPercentage: number;
  /** Workflow start time */
  startedAt?: Date;
  /** Workflow completion time */
  completedAt?: Date;
}

/**
 * SolutioningWorkflowEngine configuration options
 */
export interface SolutioningEngineOptions extends EngineOptions {
  /** Path to PRD file (default: docs/PRD.md) */
  prdPath?: string;
  /** Path to architecture file (default: docs/architecture.md) */
  architecturePath?: string;
  /** Worktree manager instance */
  worktreeManager?: WorktreeManager;
  /** Maximum retry attempts for transient failures */
  maxRetries?: number;
  /** Enable automatic checkpointing */
  autoCheckpoint?: boolean;
}

/**
 * SolutioningWorkflowEngine class
 *
 * Extends WorkflowEngine with solutioning-specific capabilities:
 * - Worktree management for isolated development
 * - PRD/architecture loading as inputs
 * - State machine with transitions
 * - Pre/post step execution hooks
 * - Error handling with rollback
 * - Progress tracking and persistence
 *
 * @example
 * ```typescript
 * const engine = new SolutioningWorkflowEngine(
 *   'bmad/bmm/workflows/create-epics-and-stories/workflow.yaml',
 *   { projectRoot: '/path/to/project' }
 * );
 *
 * // Register hooks
 * engine.registerPreStepHook('step-1', async (ctx) => {
 *   console.log(`Starting step ${ctx.stepNumber}`);
 * });
 *
 * // Execute workflow
 * await engine.execute();
 * ```
 */
export class SolutioningWorkflowEngine extends WorkflowEngine {
  // Solutioning-specific properties
  private currentState: SolutioningWorkflowState = 'not_started';
  private currentStepName: string | null = null;
  private progressPercentage: number = 0;
  private timestamps: {
    started_at?: Date;
    completed_at?: Date;
  } = {};

  // Input content
  private prdContent: string | null = null;
  private architectureContent: string | null = null;

  // Worktree management
  private worktreeManager: WorktreeManager;
  private worktreePath: string | null = null;
  private worktreeBranch: string | null = null;

  // Step execution hooks
  private preStepHooks: Map<string, StepHook[]> = new Map();
  private postStepHooks: Map<string, StepHook[]> = new Map();

  // Error handling and rollback
  private checkpoints: WorkflowCheckpoint[] = [];
  private autoCheckpoint: boolean = true;
  private workflowVariables: Record<string, any> = {};

  // Configuration paths
  private prdPath: string;
  private architecturePath: string;
  private workflowStatusPath: string;

  /**
   * Create a new SolutioningWorkflowEngine instance
   * @param workflowPath Path to workflow.yaml file
   * @param options Engine configuration options
   */
  constructor(workflowPath: string, options: SolutioningEngineOptions = {}) {
    // Call parent constructor
    super(workflowPath, options);

    // Initialize solutioning-specific properties
    const projectRoot = options.projectRoot || process.cwd();
    this.prdPath = options.prdPath || path.join(projectRoot, 'docs', 'PRD.md');
    this.architecturePath = options.architecturePath || path.join(projectRoot, 'docs', 'architecture.md');
    this.workflowStatusPath = path.join(projectRoot, 'bmad', 'workflow-status.yaml');

    this.worktreeManager = options.worktreeManager || new WorktreeManager(projectRoot);
    this.autoCheckpoint = options.autoCheckpoint ?? true;
  }

  /**
   * Execute workflow with solutioning-specific features
   * Overrides base execute() to add solutioning functionality
   */
  override async execute(): Promise<void> {
    try {
      logger.info('Starting solutioning workflow execution', {
        workflowName: 'solutioning'
      });

      // Transition to in_progress state
      await this.transitionState('in_progress');

      // Load PRD and architecture inputs
      await this.loadInputs();

      // Setup worktree for isolated development
      await this.setupWorktree();

      // Create initial checkpoint
      if (this.autoCheckpoint) {
        this.createCheckpoint();
      }

      // Execute base workflow logic
      // TODO: Story 4.4 will implement actual workflow step execution
      // For now, we just execute the base workflow which is a stub
      await super.execute();

      // Transition to complete state
      await this.transitionState('complete');

      logger.info('Workflow completed successfully', {
        workflowName: 'solutioning'
      });
    } catch (error) {
      logger.error('Workflow execution failed', error as Error, {
        workflowName: 'solutioning'
      });

      // Handle error with rollback
      await this.handleWorkflowError(error as Error);

      throw error;
    } finally {
      // Always cleanup worktree
      await this.cleanupWorktree();
    }
  }

  /**
   * Load workflow configuration from YAML file
   * @param configPath Path to workflow.yaml file
   * @returns Parsed workflow configuration
   */
  async loadWorkflowConfig(configPath: string): Promise<WorkflowConfig> {
    try {
      logger.debug('Loading workflow config', { configPath });

      // Read YAML file
      const fileContents = await fs.readFile(configPath, 'utf-8');

      // Parse YAML
      const config = yaml.load(fileContents) as WorkflowConfig;

      // Validate required fields
      if (!config || !config.name) {
        throw new WorkflowExecutionError(
          'Invalid workflow configuration: missing required field "name"',
          undefined,
          undefined,
          { configPath }
        );
      }

      if (!config.instructions) {
        throw new WorkflowExecutionError(
          'Invalid workflow configuration: missing required field "instructions"',
          undefined,
          undefined,
          { configPath }
        );
      }

      logger.info('Loaded workflow', { workflowName: config.name, configPath });
      return config;
    } catch (error) {
      // Handle file not found
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowExecutionError(
          `Workflow configuration file not found: ${configPath}`,
          undefined,
          error as Error,
          { configPath }
        );
      }

      // Handle YAML parse errors
      if (error instanceof yaml.YAMLException) {
        throw new WorkflowExecutionError(
          `Failed to parse workflow YAML: ${error.message}`,
          undefined,
          error,
          { configPath }
        );
      }

      // Re-throw WorkflowExecutionError as-is
      if (error instanceof WorkflowExecutionError) {
        throw error;
      }

      throw new WorkflowExecutionError(
        `Failed to load workflow configuration: ${(error as Error).message}`,
        undefined,
        error as Error,
        { configPath }
      );
    }
  }

  /**
   * Parse workflow steps from configuration
   * @param config Workflow configuration
   * @returns Array of workflow steps
   */
  parseWorkflowSteps(_config: WorkflowConfig): Step[] {
    // Steps are parsed by the base WorkflowEngine from instructions markdown
    // This method is a placeholder for the execution plan building logic
    // The actual step parsing happens in parseInstructions() inherited from base class

    logger.debug('Parsing workflow steps');

    // TODO: Story 4.4 will implement detailed step parsing and dependency analysis
    // For now, return empty array as steps are parsed by base class
    return [];
  }

  /**
   * Build execution plan from workflow steps
   * Analyzes step dependencies and determines execution order
   * @param steps Array of workflow steps
   * @returns Execution plan with parallel and sequential steps
   */
  buildExecutionPlan(steps: Step[]): ExecutionPlan {
    logger.debug('Building execution plan', { stepCount: steps.length });

    // Detect circular dependencies
    this.detectCircularDependencies(steps);

    // TODO: Story 4.4 will implement sophisticated dependency analysis
    // For now, assume all steps are sequential
    return {
      steps,
      parallelGroups: [],
      sequentialSteps: steps
    };
  }

  /**
   * Detect circular dependencies in workflow steps
   * @param steps Array of workflow steps
   * @throws WorkflowExecutionError if circular dependency detected
   */
  private detectCircularDependencies(steps: Step[]): void {
    // Simple check: if step N depends on step M where M > N, there might be a cycle
    // TODO: Story 4.5 will implement proper cycle detection algorithm

    // For now, just validate step numbers are sequential
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step && step.number !== i + 1) {
        logger.warn('Step numbers not sequential', {
          expected: i + 1,
          found: step.number
        });
      }
    }
  }

  /**
   * Transition workflow state
   * Validates state transitions and emits events
   * @param newState New workflow state
   */
  async transitionState(newState: SolutioningWorkflowState): Promise<void> {
    const validTransitions: Record<SolutioningWorkflowState, SolutioningWorkflowState[]> = {
      'not_started': ['in_progress'],
      'in_progress': ['review', 'complete'],
      'review': ['complete', 'in_progress'], // Can go back to in_progress if issues found
      'complete': [] // Terminal state
    };

    const allowedStates = validTransitions[this.currentState];
    if (!allowedStates.includes(newState)) {
      throw new WorkflowExecutionError(
        `Invalid state transition: ${this.currentState} -> ${newState}`,
        undefined,
        undefined,
        { currentState: this.currentState, newState, allowedStates }
      );
    }

    logger.info('State transition', {
      oldState: this.currentState,
      newState
    });

    const oldState = this.currentState;
    this.currentState = newState;

    // Update timestamps
    if (newState === 'in_progress' && !this.timestamps.started_at) {
      this.timestamps.started_at = new Date();
    }

    if (newState === 'complete') {
      this.timestamps.completed_at = new Date();
    }

    // Persist state after transition
    await this.persistState();

    // Emit event for observability
    // TODO: Story 4.6+ will implement proper event system
    logger.debug('Event emitted: workflow.state.changed', {
      oldState,
      newState
    });
  }

  /**
   * Setup worktree for solutioning phase
   * Creates isolated worktree at wt/solutioning with branch solutioning/epics-stories
   */
  async setupWorktree(): Promise<void> {
    try {
      logger.info('Setting up worktree for solutioning');

      // Initialize worktree manager
      await this.worktreeManager.initialize();

      // Create worktree with unique story ID for solutioning phase
      const worktree = await this.worktreeManager.createWorktree(
        'solutioning',
        'main' // Base branch
      );

      this.worktreePath = worktree.path;
      this.worktreeBranch = worktree.branch;

      logger.info('Worktree created', {
        path: this.worktreePath,
        branch: this.worktreeBranch
      });
    } catch (error) {
      throw new WorkflowExecutionError(
        `Failed to setup worktree: ${(error as Error).message}`,
        undefined,
        error as Error
      );
    }
  }

  /**
   * Cleanup worktree after workflow completion or failure
   */
  async cleanupWorktree(): Promise<void> {
    if (!this.worktreePath) {
      return; // No worktree to cleanup
    }

    try {
      logger.info('Cleaning up worktree');

      await this.worktreeManager.destroyWorktree('solutioning');

      this.worktreePath = null;
      this.worktreeBranch = null;

      logger.info('Worktree cleaned up successfully');
    } catch (error) {
      // Log warning but don't throw - cleanup is best-effort
      logger.warn('Worktree cleanup warning', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Persist workflow state to bmad/workflow-status.yaml
   * Uses atomic write pattern to prevent corruption
   */
  async persistState(): Promise<void> {
    try {
      const state: PersistedWorkflowState = {
        workflow: {
          name: 'solutioning',
          current_step: this.currentStepName || 'initialization',
          status: this.currentState,
          progress_percentage: this.progressPercentage,
          started_at: this.timestamps.started_at?.toISOString(),
          completed_at: this.timestamps.completed_at?.toISOString()
        }
      };

      // Generate YAML with comments
      const yamlContent = `# Workflow Status - Auto-generated
# Do not edit manually
# Last updated: ${new Date().toISOString()}

${yaml.dump(state, {
  indent: 2,
  lineWidth: 120,
  noRefs: true
})}`;

      // Atomic write: temp file + rename
      const tempPath = `${this.workflowStatusPath}.tmp`;
      const dir = path.dirname(this.workflowStatusPath);

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write to temp file
      await fs.writeFile(tempPath, yamlContent, 'utf-8');

      // Atomic rename
      await fs.rename(tempPath, this.workflowStatusPath);

      logger.debug('State persisted', { path: this.workflowStatusPath });
    } catch (error) {
      // Log warning but don't throw - state persistence failure shouldn't stop workflow
      logger.warn('Failed to persist state', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Load state from bmad/workflow-status.yaml
   * Enables workflow recovery after interruption
   * @returns Loaded state or null if not found
   */
  async loadState(): Promise<PersistedWorkflowState | null> {
    try {
      const fileContents = await fs.readFile(this.workflowStatusPath, 'utf-8');
      const state = yaml.load(fileContents) as PersistedWorkflowState;

      logger.debug('State loaded from file');
      return state;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug('No existing state file found');
        return null;
      }

      // Handle corrupted YAML
      if (error instanceof yaml.YAMLException) {
        logger.warn('Corrupted state file', {
          error: error.message
        });
        return null;
      }

      logger.warn('Failed to load state', {
        error: (error as Error).message
      });
      return null;
    }
  }

  /**
   * Register pre-step hook
   * Hook will be executed before the specified step
   * @param stepName Step name or identifier
   * @param hook Hook function to execute
   */
  registerPreStepHook(stepName: string, hook: StepHook): void {
    if (!this.preStepHooks.has(stepName)) {
      this.preStepHooks.set(stepName, []);
    }
    this.preStepHooks.get(stepName)!.push(hook);

    logger.debug('Pre-step hook registered', { stepName });
  }

  /**
   * Register post-step hook
   * Hook will be executed after the specified step
   * @param stepName Step name or identifier
   * @param hook Hook function to execute
   */
  registerPostStepHook(stepName: string, hook: StepHook): void {
    if (!this.postStepHooks.has(stepName)) {
      this.postStepHooks.set(stepName, []);
    }
    this.postStepHooks.get(stepName)!.push(hook);

    logger.debug('Post-step hook registered', { stepName });
  }

  /**
   * Execute pre-step hooks for a given step
   * @param stepName Step name
   * @param context Step execution context
   */
  async executePreStepHooks(stepName: string, context: StepContext): Promise<void> {
    const hooks = this.preStepHooks.get(stepName);
    if (!hooks || hooks.length === 0) {
      return;
    }

    logger.debug('Executing pre-step hooks', {
      stepName,
      hookCount: hooks.length
    });

    for (const hook of hooks) {
      try {
        await hook(context);
      } catch (error) {
        logger.error('Pre-step hook error', error as Error, {
          stepName
        });
        // Continue with other hooks - hook errors are non-blocking
      }
    }
  }

  /**
   * Execute post-step hooks for a given step
   * @param stepName Step name
   * @param context Step execution context
   */
  async executePostStepHooks(stepName: string, context: StepContext): Promise<void> {
    const hooks = this.postStepHooks.get(stepName);
    if (!hooks || hooks.length === 0) {
      return;
    }

    logger.debug('Executing post-step hooks', {
      stepName,
      hookCount: hooks.length
    });

    for (const hook of hooks) {
      try {
        await hook(context);
      } catch (error) {
        logger.error('Post-step hook error', error as Error, {
          stepName
        });
        // Continue with other hooks - hook errors are non-blocking
      }
    }
  }

  /**
   * Create checkpoint of current workflow state
   * Enables rollback to this point if needed
   * @returns Created checkpoint
   */
  createCheckpoint(): WorkflowCheckpoint {
    const checkpoint: WorkflowCheckpoint = {
      id: `checkpoint-${Date.now()}`,
      stepNumber: 0, // TODO: Track actual step number
      state: this.currentState,
      timestamp: new Date(),
      variables: { ...this.workflowVariables }
    };

    this.checkpoints.push(checkpoint);

    logger.debug('Checkpoint created', { checkpointId: checkpoint.id });

    return checkpoint;
  }

  /**
   * Rollback to a previous checkpoint
   * Restores workflow state and cleans up any partial work
   * @param checkpoint Checkpoint to rollback to
   */
  async rollbackToCheckpoint(checkpoint: WorkflowCheckpoint): Promise<void> {
    logger.info('Rolling back to checkpoint', { checkpointId: checkpoint.id });

    // Restore state
    this.currentState = checkpoint.state;
    this.workflowVariables = { ...checkpoint.variables };

    // Cleanup partial work (destroy worktree)
    await this.cleanupWorktree();

    // Persist rolled-back state
    await this.persistState();

    logger.info('Rollback complete', { checkpointId: checkpoint.id });
  }

  /**
   * Handle workflow execution error
   * Implements retry logic and rollback capability
   * @param error Error that occurred
   */
  private async handleWorkflowError(error: Error): Promise<void> {
    logger.error('Handling workflow error', error, {
      state: this.currentState,
      currentStep: this.currentStepName,
      progress: this.progressPercentage
    });

    // TODO: Story 4.4 will implement sophisticated retry logic
    // For now, just cleanup and log

    // Cleanup worktree on error
    await this.cleanupWorktree();
  }

  /**
   * Load inputs from Epic 2 (PRD) and Epic 3 (architecture)
   * Makes inputs available to workflow steps
   */
  async loadInputs(): Promise<void> {
    try {
      logger.info('Loading workflow inputs');

      // Load PRD
      try {
        this.prdContent = await fs.readFile(this.prdPath, 'utf-8');

        if (!this.prdContent || this.prdContent.trim().length === 0) {
          throw new Error('PRD file is empty');
        }

        logger.info('PRD loaded', {
          path: this.prdPath,
          size: this.prdContent.length
        });
      } catch (error) {
        throw new WorkflowExecutionError(
          `Failed to load PRD: ${(error as Error).message}`,
          undefined,
          error as Error,
          { prdPath: this.prdPath }
        );
      }

      // Load architecture
      try {
        this.architectureContent = await fs.readFile(this.architecturePath, 'utf-8');

        if (!this.architectureContent || this.architectureContent.trim().length === 0) {
          throw new Error('Architecture file is empty');
        }

        logger.info('Architecture loaded', {
          path: this.architecturePath,
          size: this.architectureContent.length
        });
      } catch (error) {
        throw new WorkflowExecutionError(
          `Failed to load architecture: ${(error as Error).message}`,
          undefined,
          error as Error,
          { architecturePath: this.architecturePath }
        );
      }
    } catch (error) {
      if (error instanceof WorkflowExecutionError) {
        throw error;
      }

      throw new WorkflowExecutionError(
        `Failed to load workflow inputs: ${(error as Error).message}`,
        undefined,
        error as Error
      );
    }
  }

  /**
   * Get step execution context
   * Provides context information to hooks and step executors
   * @param step Current step
   * @returns Step execution context
   */
  getStepContext(step: Step): StepContext {
    return {
      step,
      stepNumber: step.number,
      totalSteps: 0, // TODO: Track total steps
      prdContent: this.prdContent || undefined,
      architectureContent: this.architectureContent || undefined,
      variables: { ...this.workflowVariables }
    };
  }

  /**
   * Update workflow progress
   * Calculates progress percentage and persists state
   */
  updateProgress(): void {
    // TODO: Story 4.4 will implement proper progress calculation
    // For now, just persist current state

    logger.debug('Progress update', {
      progressPercentage: this.progressPercentage
    });

    // Persist state asynchronously (non-blocking)
    this.persistState().catch(error => {
      logger.warn('Failed to persist progress', {
        error: error.message
      });
    });
  }

  /**
   * Get current workflow progress
   * @returns Workflow progress information
   */
  getCurrentProgress(): WorkflowProgress {
    return {
      workflowName: 'solutioning',
      currentStep: this.currentStepName || 'initialization',
      progressPercentage: this.progressPercentage,
      startedAt: this.timestamps.started_at,
      completedAt: this.timestamps.completed_at
    };
  }
}
