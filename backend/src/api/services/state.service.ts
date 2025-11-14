/**
 * StateService - Query workflow and sprint state
 * Handles state queries with caching for performance optimization
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { StateManager } from '../../core/StateManager.js';
import {
  WorkflowStatusDetail,
  SprintStatus,
  Story,
  StoryDetail,
  StoryListFilters,
  Epic
} from '../types/state.types.js';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  filePath: string;
}

/**
 * Sprint status YAML structure (as stored in file)
 */
interface SprintStatusYAML {
  generated?: string;
  project?: string;
  project_key?: string;
  tracking_system?: string;
  story_location?: string;
  development_status: Record<string, string>;
}

/**
 * StateService class - Manages state queries with caching
 */
export class StateService {
  private stateManager: StateManager;
  private projectRoot: string;
  private sprintStatusCache: Map<string, CacheEntry<SprintStatus>>;
  private workflowStatusCache: Map<string, CacheEntry<WorkflowStatusDetail>>;
  private cacheTimeout: number = 60000; // 1 minute cache

  constructor(baseDir: string = process.cwd()) {
    this.projectRoot = baseDir;
    this.stateManager = new StateManager(baseDir);
    this.sprintStatusCache = new Map();
    this.workflowStatusCache = new Map();
  }

  /**
   * Get workflow status for a project
   * @param projectId Project identifier
   * @returns Workflow status with current phase and steps
   */
  async getWorkflowStatus(projectId: string): Promise<WorkflowStatusDetail> {
    // Check cache first
    const cached = this.workflowStatusCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      // Load workflow state from StateManager
      const state = await this.stateManager.loadState(projectId);

      if (!state) {
        // No workflow state - return idle
        const status: WorkflowStatusDetail = {
          projectId,
          currentPhase: 'none',
          phases: [],
          status: 'idle'
        };
        return status;
      }

      // Build workflow status from state
      const status: WorkflowStatusDetail = {
        projectId,
        currentPhase: this.inferPhaseFromWorkflow(state.currentWorkflow),
        phases: [], // Would need to parse workflow to get all phases
        status: state.status === 'running' ? 'running' :
                state.status === 'paused' ? 'paused' :
                state.status === 'completed' ? 'completed' : 'error'
      };

      // Cache the result
      this.workflowStatusCache.set(projectId, {
        data: status,
        timestamp: Date.now(),
        filePath: ''
      });

      return status;
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${(error as Error).message}`);
    }
  }

  /**
   * Get sprint status for a project
   * @param projectId Project identifier
   * @returns Sprint status with epics and stories
   */
  async getSprintStatus(projectId: string): Promise<SprintStatus> {
    const sprintFilePath = path.join(this.projectRoot, 'docs', 'sprint-status.yaml');

    // Check cache first
    const cached = this.sprintStatusCache.get(projectId);
    if (cached && cached.filePath === sprintFilePath) {
      try {
        const stats = await fs.stat(sprintFilePath);
        const fileModTime = stats.mtimeMs;

        // Return cached if file hasn't changed
        if (fileModTime <= cached.timestamp) {
          return cached.data;
        }
      } catch (error) {
        // File might not exist, continue to try loading
      }
    }

    try {
      // Read and parse sprint-status.yaml
      const contents = await fs.readFile(sprintFilePath, 'utf-8');
      const parsed = yaml.load(contents) as SprintStatusYAML;

      // Extract epics and stories from development_status
      const epics: Epic[] = [];
      const stories: Story[] = [];
      const epicStories: Map<string, string[]> = new Map();

      for (const [key, status] of Object.entries(parsed.development_status)) {
        // Epic keys: epic-X or epic-X-retrospective
        if (key.startsWith('epic-')) {
          if (key.endsWith('-retrospective')) {
            continue; // Skip retrospective entries
          }

          const epicId = key;
          const epicNum = key.split('-')[1];
          epics.push({
            id: epicId,
            title: `Epic ${epicNum}`,
            status: status === 'backlog' ? 'backlog' :
                    status === 'contexted' ? 'contexted' :
                    status === 'in-progress' ? 'in-progress' : 'completed',
            stories: []
          });
          epicStories.set(epicId, []);
        }
        // Story keys: X-Y-title format
        else if (key.match(/^\d+-\d+-.+$/)) {
          const storyId = key;
          const parts = key.split('-');
          const epicNum = parts[0];
          const epicId = `epic-${epicNum}`;
          const title = parts.slice(2).join(' ').replace(/-/g, ' ');

          stories.push({
            id: storyId,
            epicId,
            title: this.capitalizeTitle(title),
            status: this.normalizeStoryStatus(status)
          });

          // Add story to epic's story list
          if (!epicStories.has(epicId)) {
            epicStories.set(epicId, []);
          }
          epicStories.get(epicId)!.push(storyId);
        }
      }

      // Assign stories to epics
      epics.forEach(epic => {
        epic.stories = epicStories.get(epic.id) || [];
      });

      const sprintStatus: SprintStatus = {
        projectId,
        project: parsed.project || 'Unknown Project',
        generatedAt: parsed.generated || new Date().toISOString(),
        epics,
        stories
      };

      // Cache the result with file modification time
      const stats = await fs.stat(sprintFilePath);
      this.sprintStatusCache.set(projectId, {
        data: sprintStatus,
        timestamp: stats.mtimeMs,
        filePath: sprintFilePath
      });

      return sprintStatus;
    } catch (error) {
      throw new Error(`Failed to get sprint status: ${(error as Error).message}`);
    }
  }

  /**
   * List stories with optional filters
   * @param projectId Project identifier
   * @param filters Optional filters (status, epic)
   * @returns Filtered story list
   */
  async listStories(projectId: string, filters?: StoryListFilters): Promise<Story[]> {
    // Get sprint status (uses cache)
    const sprintStatus = await this.getSprintStatus(projectId);

    let stories = sprintStatus.stories;

    // Apply filters
    if (filters?.status) {
      stories = stories.filter(story => story.status === filters.status);
    }

    if (filters?.epic) {
      stories = stories.filter(story => story.epicId === filters.epic);
    }

    return stories;
  }

  /**
   * Get detailed story information
   * @param projectId Project identifier
   * @param storyId Story identifier
   * @returns Detailed story information
   */
  async getStoryDetail(projectId: string, storyId: string): Promise<StoryDetail> {
    try {
      // Get basic story info from sprint status
      const stories = await this.listStories(projectId);
      const story = stories.find(s => s.id === storyId);

      if (!story) {
        throw new Error(`Story ${storyId} not found`);
      }

      // Read story markdown file
      const storyFilePath = path.join(this.projectRoot, 'docs', 'stories', `${storyId}.md`);
      const storyContent = await fs.readFile(storyFilePath, 'utf-8');

      // Parse story content for details
      const acceptanceCriteria = this.extractAcceptanceCriteria(storyContent);
      const tasks = this.extractTasks(storyContent);
      const description = this.extractDescription(storyContent);
      const dependencies = this.extractDependencies(storyContent);

      const storyDetail: StoryDetail = {
        ...story,
        description,
        acceptanceCriteria,
        tasks,
        dependencies
      };

      return storyDetail;
    } catch (error) {
      throw new Error(`Failed to get story detail: ${(error as Error).message}`);
    }
  }

  /**
   * Infer phase from workflow path
   */
  private inferPhaseFromWorkflow(workflowPath: string): string {
    if (workflowPath.includes('analysis')) return 'analysis';
    if (workflowPath.includes('planning')) return 'planning';
    if (workflowPath.includes('solutioning')) return 'solutioning';
    if (workflowPath.includes('implementation')) return 'implementation';
    if (workflowPath.includes('review')) return 'review';
    return 'unknown';
  }

  /**
   * Normalize story status from sprint-status.yaml
   */
  private normalizeStoryStatus(status: string): Story['status'] {
    const normalized = status.toLowerCase();
    if (['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done'].includes(normalized)) {
      return normalized as Story['status'];
    }
    return 'backlog';
  }

  /**
   * Capitalize story title
   */
  private capitalizeTitle(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract acceptance criteria from story markdown
   */
  private extractAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];
    const acSection = content.match(/## Acceptance Criteria([\s\S]*?)(?=##|$)/);

    if (acSection) {
      const lines = acSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^\d+\.\s+\[\s*[x ]?\s*\]\s+(.+)$/);
        if (match) {
          criteria.push(match[1].trim());
        }
      }
    }

    return criteria;
  }

  /**
   * Extract tasks from story markdown
   */
  private extractTasks(content: string): string[] {
    const tasks: string[] = [];
    const tasksSection = content.match(/## Tasks \/ Subtasks([\s\S]*?)(?=##|$)/);

    if (tasksSection) {
      const lines = tasksSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^-\s+\[\s*[x ]?\s*\]\s+(.+)$/);
        if (match) {
          tasks.push(match[1].trim());
        }
      }
    }

    return tasks;
  }

  /**
   * Extract description from story markdown
   */
  private extractDescription(content: string): string {
    const userStorySection = content.match(/## User Story([\s\S]*?)(?=##|$)/);

    if (userStorySection) {
      return userStorySection[1].trim();
    }

    return '';
  }

  /**
   * Extract dependencies from story markdown
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const depsSection = content.match(/## Dependencies([\s\S]*?)(?=##|$)/);

    if (depsSection) {
      const lines = depsSection[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^-\s+\*\*Requires:\*\*\s+(.+)$/);
        if (match) {
          dependencies.push(match[1].trim());
        }
      }
    }

    return dependencies;
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.sprintStatusCache.clear();
    this.workflowStatusCache.clear();
  }
}

// Export singleton instance
export const stateService = new StateService();
