/**
 * ProjectService - Project CRUD operations with StateManager integration
 * Handles project management with state persistence and event emission
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Project, ProjectStatus, ProjectPhase } from '../types/api.types.js';
import { eventService } from './event.service.js';
import { orchestratorService } from './orchestrator.service.js';

/**
 * Project creation input
 */
export interface CreateProjectInput {
  name: string;
  config?: Record<string, unknown>;
}

/**
 * Project update input
 */
export interface UpdateProjectInput {
  name?: string;
  status?: ProjectStatus;
  phase?: ProjectPhase;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit: number;
  offset: number;
}

/**
 * ProjectService class - Manages project lifecycle
 */
export class ProjectService {
  private projectsDir: string;
  private projectsCache: Map<string, Project>;

  constructor(baseDir: string = process.cwd()) {
    this.projectsDir = path.join(baseDir, 'bmad');
    this.projectsCache = new Map();
  }

  /**
   * Validate projectId to prevent path traversal attacks
   */
  private validateProjectId(projectId: string): void {
    // Match UUID format: 8-4-4-4-12 hex digits
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
      throw new Error('Invalid project id');
    }
  }

  /**
   * Get project file path
   */
  private getProjectPath(projectId: string): string {
    this.validateProjectId(projectId);
    return path.join(this.projectsDir, projectId, 'project.json');
  }

  /**
   * Ensure project directory exists
   */
  private async ensureProjectDir(projectId: string): Promise<void> {
    this.validateProjectId(projectId);
    const dir = path.join(this.projectsDir, projectId);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Save project to disk
   */
  private async saveProject(project: Project): Promise<void> {
    await this.ensureProjectDir(project.id);
    const projectPath = this.getProjectPath(project.id);
    await fs.writeFile(projectPath, JSON.stringify(project, null, 2), 'utf-8');
    this.projectsCache.set(project.id, project);
  }

  /**
   * Load project from disk
   */
  private async loadProject(projectId: string): Promise<Project | null> {
    // Check cache first
    const cached = this.projectsCache.get(projectId);
    if (cached) {
      return cached;
    }

    try {
      const projectPath = this.getProjectPath(projectId);
      const contents = await fs.readFile(projectPath, 'utf-8');
      const project = JSON.parse(contents) as Project;
      this.projectsCache.set(projectId, project);
      return project;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all projects with pagination
   * @param options Pagination options
   * @returns Array of projects
   */
  async listProjects(options: PaginationOptions): Promise<Project[]> {
    const { limit = 20, offset = 0 } = options;

    try {
      // Read all project directories
      await fs.mkdir(this.projectsDir, { recursive: true });
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const projectDirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

      // Load projects
      const projects: Project[] = [];
      for (const projectId of projectDirs) {
        const project = await this.loadProject(projectId);
        if (project) {
          projects.push(project);
        }
      }

      // Sort by updatedAt (most recent first)
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Apply pagination
      return projects.slice(offset, offset + limit);
    } catch (error) {
      throw new Error(`Failed to list projects: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new project
   * @param input Project creation input
   * @returns Created project
   */
  async createProject(input: CreateProjectInput): Promise<Project> {
    // Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Project name is required');
    }

    if (input.name.length > 255) {
      throw new Error('Project name must be less than 255 characters');
    }

    // Create project
    const now = new Date().toISOString();
    const project: Project = {
      id: uuidv4(),
      name: input.name.trim(),
      status: 'active',
      phase: 'analysis',
      createdAt: now,
      updatedAt: now
    };

    // Save to disk
    await this.saveProject(project);

    // Emit event
    eventService.emitEvent(project.id, 'project.created', {
      id: project.id,
      name: project.name,
      status: project.status,
      phase: project.phase
    });

    // Auto-start the default workflow (product-brief)
    // Note: This is fire-and-forget - workflow start failures won't fail project creation
    try {
      const defaultWorkflowPath = 'bmad/bmm/workflows/1-analysis/product-brief/workflow.yaml';

      // Start workflow asynchronously (don't await)
      orchestratorService.start(project.id, {
        workflowPath: defaultWorkflowPath,
        yoloMode: false
      }).then(() => {
        console.log(`[ProjectService] Auto-started workflow for project ${project.id}`);
      }).catch((error) => {
        console.error(`[ProjectService] Failed to auto-start workflow for project ${project.id}:`, error);
        // Emit error event but don't fail project creation
        eventService.emitEvent(project.id, 'workflow.start.failed', {
          error: (error as Error).message,
          workflowPath: defaultWorkflowPath
        });
      });
    } catch (error) {
      // Log error but don't fail project creation
      console.error(`[ProjectService] Error initiating workflow start:`, error);
    }

    return project;
  }

  /**
   * Get project by ID
   * @param id Project identifier
   * @returns Project or null if not found
   */
  async getProject(id: string): Promise<Project | null> {
    return this.loadProject(id);
  }

  /**
   * Update project
   * @param id Project identifier
   * @param input Update input
   * @returns Updated project
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    // Load existing project
    const project = await this.loadProject(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Track changes for event
    const updatedFields: string[] = [];
    const oldPhase = project.phase;

    // Apply updates
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new Error('Project name cannot be empty');
      }
      if (input.name.length > 255) {
        throw new Error('Project name must be less than 255 characters');
      }
      project.name = input.name.trim();
      updatedFields.push('name');
    }

    if (input.status !== undefined) {
      project.status = input.status;
      updatedFields.push('status');
    }

    if (input.phase !== undefined) {
      project.phase = input.phase;
      updatedFields.push('phase');
    }

    project.updatedAt = new Date().toISOString();

    // Save to disk
    await this.saveProject(project);

    // Emit events
    eventService.emitEvent(project.id, 'project.updated', {
      id: project.id,
      name: input.name,
      status: input.status,
      phase: input.phase,
      updatedFields
    });

    // Emit phase change event if phase changed
    if (input.phase !== undefined && oldPhase !== input.phase) {
      eventService.emitEvent(project.id, 'project.phase.changed', {
        id: project.id,
        oldPhase,
        newPhase: input.phase
      });
    }

    return project;
  }

  /**
   * Delete project
   * @param id Project identifier
   */
  async deleteProject(id: string): Promise<void> {
    // Validate projectId first
    this.validateProjectId(id);

    // Load existing project to verify it exists
    const project = await this.loadProject(id);
    if (!project) {
      throw new Error('Project not found');
    }

    // Delete project directory
    const projectDir = path.join(this.projectsDir, id);
    await fs.rm(projectDir, { recursive: true, force: true });

    // Remove from cache
    this.projectsCache.delete(id);
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.projectsCache.clear();
  }
}

// Export singleton instance
export const projectService = new ProjectService();
