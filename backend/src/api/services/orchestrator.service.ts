/**
 * OrchestratorService - Workflow orchestration control and status
 * Handles workflow start, pause, resume operations with concurrency control
 */

import * as path from 'path';
import { WorkflowEngine } from '../../core/WorkflowEngine.js';
import { StateManager } from '../../core/StateManager.js';
import { AgentPool } from '../../core/AgentPool.js';
import { eventService } from './event.service.js';
import {
  ProjectOrchestratorStatus,
  StartWorkflowRequest,
  WorkflowControlResponse,
  AgentActivity
} from '../types/orchestrator.types.js';

/**
 * Simple mutex implementation for concurrency control
 */
class Mutex {
  private locks: Map<string, Promise<void>> = new Map();

  async runExclusive<T>(key: string, callback: () => Promise<T>): Promise<T> {
    // Wait for existing lock to release
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Create new lock
    let release: () => void;
    const lockPromise = new Promise<void>(resolve => {
      release = resolve;
    });
    this.locks.set(key, lockPromise);

    try {
      // Execute callback
      return await callback();
    } finally {
      // Release lock
      this.locks.delete(key);
      release!();
    }
  }
}

/**
 * OrchestratorService class - Manages workflow orchestration
 */
export class OrchestratorService {
  private workflowEngines: Map<string, WorkflowEngine>;
  private stateManager: StateManager;
  private agentPool?: AgentPool;
  private projectRoot: string;
  private mutex: Mutex;

  constructor(baseDir: string = process.cwd(), agentPool?: AgentPool) {
    this.projectRoot = baseDir;
    this.workflowEngines = new Map();
    this.stateManager = new StateManager(baseDir);
    this.agentPool = agentPool;
    this.mutex = new Mutex();
  }

  /**
   * Get current orchestrator status for a project
   * @param projectId Project identifier
   * @returns Orchestrator status with workflow state and agent activity
   */
  async getStatus(projectId: string): Promise<ProjectOrchestratorStatus> {
    return this.mutex.runExclusive(projectId, async () => {
      try {
        // Load workflow state from StateManager
        const state = await this.stateManager.loadState(projectId);

        if (!state) {
          // No workflow state found - return idle status
          return {
            projectId,
            workflowName: 'none',
            currentStep: 'none',
            status: 'idle',
            agentActivity: [],
            progress: 0
          };
        }

        // Calculate progress percentage
        const progress = this.calculateProgress(state.currentStep, state.currentWorkflow);

        // Get agent activity
        const agentActivity: AgentActivity[] = state.agentActivity.map(activity => ({
          agentId: activity.agentId,
          agentName: activity.agentName,
          action: activity.action,
          status: activity.status,
          startedAt: activity.timestamp,
          duration: activity.duration
        }));

        // Build orchestrator status
        const status: ProjectOrchestratorStatus = {
          projectId,
          workflowName: path.basename(state.currentWorkflow, '.yaml'),
          currentStep: `Step ${state.currentStep}`,
          status: state.status === 'running' ? 'running' :
                  state.status === 'paused' ? 'paused' :
                  state.status === 'completed' ? 'completed' : 'error',
          agentActivity,
          progress,
          startedAt: state.startTime.toISOString()
        };

        if (state.status === 'paused') {
          status.pausedAt = state.lastUpdate.toISOString();
        }

        if (state.status === 'completed') {
          status.completedAt = state.lastUpdate.toISOString();
        }

        return status;
      } catch (error) {
        throw new Error(`Failed to get orchestrator status: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Start workflow execution for a project
   * @param projectId Project identifier
   * @param request Workflow start request
   * @returns Control response
   */
  async start(projectId: string, request: StartWorkflowRequest): Promise<WorkflowControlResponse> {
    return this.mutex.runExclusive(projectId, async () => {
      try {
        // Check if workflow is already running
        const existingEngine = this.workflowEngines.get(projectId);
        if (existingEngine) {
          throw new Error('Workflow is already running for this project');
        }

        // Validate workflow path
        const workflowPath = path.resolve(this.projectRoot, request.workflowPath);

        // Create workflow engine
        const engine = new WorkflowEngine(workflowPath, {
          projectRoot: this.projectRoot,
          yoloMode: request.yoloMode || false
        });

        // Store engine reference
        this.workflowEngines.set(projectId, engine);

        // Emit start event
        eventService.emitEvent(projectId, 'orchestrator.started', {
          workflowName: path.basename(request.workflowPath, '.yaml'),
          workflowPath: request.workflowPath
        });

        // Start execution asynchronously (don't await)
        engine.execute().then(() => {
          // Cleanup on completion
          this.workflowEngines.delete(projectId);
        }).catch((error) => {
          // Cleanup on error
          this.workflowEngines.delete(projectId);
          console.error(`Workflow execution failed for project ${projectId}:`, error);
        });

        return {
          message: 'Workflow started successfully',
          status: 'running'
        };
      } catch (error) {
        throw new Error(`Failed to start workflow: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Pause workflow execution for a project
   * Note: Current implementation marks workflow as paused in state.
   * Full pause/resume requires workflow engine modifications.
   * @param projectId Project identifier
   * @returns Control response
   */
  async pause(projectId: string): Promise<WorkflowControlResponse> {
    return this.mutex.runExclusive(projectId, async () => {
      try {
        // Check if workflow is running
        const engine = this.workflowEngines.get(projectId);
        if (!engine) {
          throw new Error('No workflow is currently running for this project');
        }

        // Load current state
        const state = await this.stateManager.loadState(projectId);
        if (!state) {
          throw new Error('No workflow state found');
        }

        // Update state to paused
        state.status = 'paused';
        state.lastUpdate = new Date();
        await this.stateManager.saveState(projectId, state);

        // Emit pause event
        eventService.emitEvent(projectId, 'orchestrator.paused', {
          workflowName: path.basename(state.currentWorkflow, '.yaml'),
          currentStep: `Step ${state.currentStep}`
        });

        return {
          message: 'Workflow paused (will complete current step)',
          status: 'paused'
        };
      } catch (error) {
        throw new Error(`Failed to pause workflow: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Resume paused workflow execution for a project
   * @param projectId Project identifier
   * @returns Control response
   */
  async resume(projectId: string): Promise<WorkflowControlResponse> {
    return this.mutex.runExclusive(projectId, async () => {
      try {
        // Check if workflow is already running
        const existingEngine = this.workflowEngines.get(projectId);
        if (existingEngine) {
          throw new Error('Workflow is already running for this project');
        }

        // Load paused state
        const state = await this.stateManager.loadState(projectId);
        if (!state) {
          throw new Error('No workflow state found to resume');
        }

        if (state.status !== 'paused') {
          throw new Error(`Cannot resume workflow with status: ${state.status}`);
        }

        // Create workflow engine
        const engine = new WorkflowEngine(state.currentWorkflow, {
          projectRoot: this.projectRoot,
          yoloMode: false
        });

        // Store engine reference
        this.workflowEngines.set(projectId, engine);

        // Emit resume event
        eventService.emitEvent(projectId, 'orchestrator.resumed', {
          workflowName: path.basename(state.currentWorkflow, '.yaml'),
          currentStep: `Step ${state.currentStep}`
        });

        // Resume execution from state asynchronously
        engine.resumeFromState(state).then(() => {
          // Cleanup on completion
          this.workflowEngines.delete(projectId);
        }).catch((error) => {
          // Cleanup on error
          this.workflowEngines.delete(projectId);
          console.error(`Workflow resumption failed for project ${projectId}:`, error);
        });

        return {
          message: 'Workflow resumed successfully',
          status: 'running'
        };
      } catch (error) {
        throw new Error(`Failed to resume workflow: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Calculate workflow progress percentage
   * @param currentStep Current step number
   * @param workflowPath Workflow file path
   * @returns Progress percentage (0-100)
   */
  private calculateProgress(currentStep: number, _workflowPath: string): number {
    // Simple progress calculation based on step number
    // In a real implementation, this would parse the workflow to get total steps
    // For now, estimate based on typical workflow size
    const estimatedTotalSteps = 10;
    return Math.min(100, Math.round((currentStep / estimatedTotalSteps) * 100));
  }

  /**
   * Clear all workflow engines (for testing)
   */
  clearEngines(): void {
    this.workflowEngines.clear();
  }

  /**
   * Get state manager (for testing)
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }
}

// Export singleton instance
export const orchestratorService = new OrchestratorService();
