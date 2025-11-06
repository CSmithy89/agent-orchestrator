/**
 * StateManager - Workflow state persistence and recovery
 * Manages dual-format state files (YAML + Markdown) with atomic writes
 * Enables crash recovery and provides state queries for dashboard
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  WorkflowState,
  StoryStatus,
  StateManagerError
} from '../types/workflow.types.js';

/**
 * StateManager class - Singleton state manager
 */
export class StateManager {
  private stateCache: Map<string, WorkflowState> = new Map();
  private readonly stateDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.stateDir = path.join(baseDir, 'bmad');
  }

  /**
   * Get the path to the YAML state file for a specific project
   * @param projectId Project identifier
   */
  private getYamlPath(projectId: string): string {
    return path.join(this.stateDir, projectId, 'sprint-status.yaml');
  }

  /**
   * Get the path to the Markdown state file for a specific project
   * @param projectId Project identifier
   */
  private getMarkdownPath(projectId: string): string {
    return path.join(this.stateDir, projectId, 'workflow-status.md');
  }

  /**
   * Atomic write to prevent corruption during crashes
   * @param filePath Target file path
   * @param content Content to write
   */
  private async atomicWrite(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write to temp file
      await fs.writeFile(tempPath, content, 'utf-8');

      // Verify write succeeded
      const stats = await fs.stat(tempPath);
      if (stats.size === 0 && content.length > 0) {
        throw new StateManagerError(
          'Atomic write verification failed: temp file is empty',
          'atomicWrite',
          tempPath
        );
      }

      // Atomic rename (OS-level operation)
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      if (error instanceof StateManagerError) {
        throw error;
      }

      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOSPC') {
        throw new StateManagerError(
          `No space left on device when writing to ${filePath}\n\nPlease free up disk space and retry.`,
          'atomicWrite',
          filePath
        );
      }

      if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
        throw new StateManagerError(
          `Permission denied when writing to ${filePath}\n\nPlease check file permissions.`,
          'atomicWrite',
          filePath
        );
      }

      throw new StateManagerError(
        `Failed to write state file: ${(error as Error).message}`,
        'atomicWrite',
        filePath
      );
    }
  }

  /**
   * Generate YAML format for state
   */
  private generateYAMLFormat(state: WorkflowState): string {
    // Convert Date objects to ISO strings for YAML
    const yamlData = {
      project: state.project,
      currentWorkflow: state.currentWorkflow,
      currentStep: state.currentStep,
      status: state.status,
      variables: state.variables,
      agentActivity: state.agentActivity.map(activity => ({
        agentId: activity.agentId,
        agentName: activity.agentName,
        action: activity.action,
        timestamp: activity.timestamp.toISOString(),
        duration: activity.duration,
        status: activity.status,
        output: activity.output
      })),
      startTime: state.startTime.toISOString(),
      lastUpdate: state.lastUpdate.toISOString()
    };

    return yaml.dump(yamlData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Generate Markdown format for state
   */
  private generateMarkdownFormat(state: WorkflowState): string {
    const lines: string[] = [];

    // Header
    lines.push(`# ${state.project.name} - Workflow Status`);
    lines.push('');
    lines.push(`**Project:** ${state.project.name} (Level ${state.project.level})`);

    // Determine phase from workflow path
    const phase = this.determinePhaseFromWorkflow(state.currentWorkflow);
    lines.push(`**Phase:** ${phase}`);
    lines.push(`**Status:** ${state.status.charAt(0).toUpperCase() + state.status.slice(1)}`);
    lines.push(`**Last Updated:** ${state.lastUpdate.toLocaleString()}`);
    lines.push('');

    // Current Workflow
    lines.push('## Current Workflow');
    lines.push('');
    lines.push(`- **Workflow:** ${state.currentWorkflow}`);
    lines.push(`- **Step:** ${state.currentStep}`);
    lines.push('');

    // Agent Activity
    lines.push('## Agent Activity');
    lines.push('');
    if (state.agentActivity.length > 0) {
      lines.push('| Agent | Action | Status | Time |');
      lines.push('|-------|--------|--------|------|');

      // Show most recent activities first (last 10)
      const recentActivities = state.agentActivity.slice(-10).reverse();
      for (const activity of recentActivities) {
        const time = new Date(activity.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        const statusIcon = activity.status === 'completed' ? '✅' :
                          activity.status === 'failed' ? '❌' : '⏳';
        lines.push(`| ${activity.agentName} | ${activity.action} | ${statusIcon} ${activity.status} | ${time} |`);
      }
    } else {
      lines.push('No agent activity recorded yet.');
    }
    lines.push('');

    // Variables
    lines.push('## Variables');
    lines.push('');
    const varKeys = Object.keys(state.variables);
    if (varKeys.length > 0) {
      lines.push('| Key | Value |');
      lines.push('|-----|-------|');
      for (const key of varKeys) {
        const value = typeof state.variables[key] === 'object'
          ? JSON.stringify(state.variables[key])
          : String(state.variables[key]);
        lines.push(`| ${key} | ${value} |`);
      }
    } else {
      lines.push('No variables set.');
    }
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Determine project phase from workflow path
   */
  private determinePhaseFromWorkflow(workflowPath: string): string {
    const lowerPath = workflowPath.toLowerCase();

    if (lowerPath.includes('product-brief') || lowerPath.includes('research')) {
      return 'Phase 1: Analysis';
    }
    if (lowerPath.includes('prd') || lowerPath.includes('epic')) {
      return 'Phase 2: Planning';
    }
    if (lowerPath.includes('architecture') || lowerPath.includes('tech-spec')) {
      return 'Phase 3: Solutioning';
    }
    if (lowerPath.includes('dev-story') || lowerPath.includes('implementation')) {
      return 'Phase 4: Implementation';
    }

    return 'Unknown Phase';
  }

  /**
   * Validate state structure before persisting
   */
  private validateState(state: WorkflowState): void {
    if (!state.project || !state.project.id || !state.project.name) {
      throw new StateManagerError(
        'Invalid state: project information is missing or incomplete',
        'validateState'
      );
    }

    if (!state.currentWorkflow) {
      throw new StateManagerError(
        'Invalid state: currentWorkflow is required',
        'validateState'
      );
    }

    if (typeof state.currentStep !== 'number' || state.currentStep < 0) {
      throw new StateManagerError(
        'Invalid state: currentStep must be a non-negative number',
        'validateState'
      );
    }

    const validStatuses = ['running', 'paused', 'completed', 'error'];
    if (!validStatuses.includes(state.status)) {
      throw new StateManagerError(
        `Invalid state: status must be one of ${validStatuses.join(', ')}`,
        'validateState'
      );
    }
  }

  /**
   * Save workflow state to dual-format files
   * @param state Current workflow state
   */
  async saveState(state: WorkflowState): Promise<void> {
    // Validate state structure
    this.validateState(state);

    // Generate both formats
    const yamlContent = this.generateYAMLFormat(state);
    const markdownContent = this.generateMarkdownFormat(state);

    // Write both files atomically in parallel
    const projectId = state.project.id;
    await Promise.all([
      this.atomicWrite(this.getYamlPath(projectId), yamlContent),
      this.atomicWrite(this.getMarkdownPath(projectId), markdownContent)
    ]);

    // Update cache
    this.stateCache.set(projectId, state);

    // Auto-commit state changes (non-blocking)
    const commitMessage = this.generateCommitMessage(state);
    this.commitStateChange(projectId, commitMessage).catch(error => {
      console.warn(`Failed to auto-commit state changes: ${error.message}`);
    });
  }

  /**
   * Load workflow state from file
   * @param projectId Project identifier
   * @returns Workflow state or null if not found
   */
  async loadState(projectId: string): Promise<WorkflowState | null> {
    // Check cache first
    const cached = this.stateCache.get(projectId);
    if (cached) {
      return cached;
    }

    const yamlPath = this.getYamlPath(projectId);

    try {
      // Read YAML file
      const fileContents = await fs.readFile(yamlPath, 'utf-8');

      // Parse YAML
      const rawState = yaml.load(fileContents) as any;

      // Convert ISO strings back to Date objects
      const state: WorkflowState = {
        project: rawState.project,
        currentWorkflow: rawState.currentWorkflow,
        currentStep: rawState.currentStep,
        status: rawState.status,
        variables: rawState.variables || {},
        agentActivity: (rawState.agentActivity || []).map((activity: any) => ({
          agentId: activity.agentId,
          agentName: activity.agentName,
          action: activity.action,
          timestamp: new Date(activity.timestamp),
          duration: activity.duration,
          status: activity.status,
          output: activity.output
        })),
        startTime: new Date(rawState.startTime),
        lastUpdate: new Date(rawState.lastUpdate)
      };

      // Validate loaded state
      this.validateState(state);

      // Cache the loaded state
      this.stateCache.set(projectId, state);

      return state;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      // Return null for missing file (new project)
      if (nodeError.code === 'ENOENT') {
        return null;
      }

      // Handle corrupted YAML
      if (error instanceof yaml.YAMLException) {
        console.error(`Corrupted state file at ${yamlPath}: ${error.message}`);
        console.error('Attempting to continue without state recovery...');
        return null;
      }

      // Re-throw validation errors
      if (error instanceof StateManagerError) {
        throw error;
      }

      throw new StateManagerError(
        `Failed to load state: ${(error as Error).message}`,
        'loadState',
        yamlPath
      );
    }
  }

  /**
   * Get project phase from workflow state
   * @param projectId Project identifier
   * @returns Phase name or 'Unknown' if not found
   */
  async getProjectPhase(projectId: string): Promise<string> {
    const state = await this.loadState(projectId);

    if (!state) {
      return 'Unknown';
    }

    return this.determinePhaseFromWorkflow(state.currentWorkflow);
  }

  /**
   * Get story status from workflow state
   * Note: This is a placeholder implementation. Full story tracking
   * will be implemented when sprint-status.yaml format is extended.
   *
   * @param projectId Project identifier
   * @param storyId Story identifier (e.g., "1.5")
   * @returns Story status or null if not found
   */
  async getStoryStatus(projectId: string, storyId: string): Promise<StoryStatus | null> {
    const state = await this.loadState(projectId);

    if (!state) {
      return null;
    }

    // TODO: Extract story status from extended state format
    // For now, return a basic status based on workflow variables
    const storyVar = state.variables[`story_${storyId.replace('.', '_')}`];

    if (storyVar) {
      return {
        storyId,
        title: storyVar.title || `Story ${storyId}`,
        status: storyVar.status || 'backlog',
        assignedAgent: storyVar.assignedAgent,
        startTime: storyVar.startTime ? new Date(storyVar.startTime) : undefined,
        endTime: storyVar.endTime ? new Date(storyVar.endTime) : undefined,
        progressPercent: storyVar.progressPercent || 0
      };
    }

    return null;
  }

  /**
   * Generate commit message based on state changes
   */
  private generateCommitMessage(state: WorkflowState): string {
    const phase = this.determinePhaseFromWorkflow(state.currentWorkflow);
    const workflowName = path.basename(path.dirname(state.currentWorkflow));

    switch (state.status) {
      case 'running':
        return `${phase} - ${workflowName} workflow step ${state.currentStep}`;
      case 'completed':
        return `${phase} - ${workflowName} workflow completed`;
      case 'error':
        return `${phase} - ${workflowName} workflow paused (error at step ${state.currentStep})`;
      case 'paused':
        return `${phase} - ${workflowName} workflow paused at step ${state.currentStep}`;
      default:
        return `Workflow state updated - ${workflowName}`;
    }
  }

  /**
   * Auto-commit state changes to git
   * @param projectId Project identifier
   * @param message Commit message
   */
  private async commitStateChange(projectId: string, message: string): Promise<void> {
    try {
      // Dynamic import of simple-git
      const { simpleGit } = await import('simple-git');
      const git = simpleGit();

      // Check if git is available
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        console.warn('Not a git repository - skipping auto-commit');
        return;
      }

      // Stage state files
      await git.add([
        this.getYamlPath(projectId),
        this.getMarkdownPath(projectId)
      ]);

      // Commit with descriptive message
      await git.commit(message);
    } catch (error) {
      // Git errors are non-blocking, just log warning
      console.warn(`Git auto-commit failed: ${(error as Error).message}`);
    }
  }

  /**
   * Clear the state cache
   * Useful for testing or when state is modified externally
   */
  clearCache(): void {
    this.stateCache.clear();
  }
}
