/**
 * ProjectService Tests
 * Unit tests for project CRUD operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectService } from '../../src/api/services/project.service.js';
import { eventService } from '../../src/api/services/event.service.js';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'test-projects-' + Date.now());
    projectService = new ProjectService(testDir);

    // Clear event service
    eventService.clearAll();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('createProject', () => {
    it('should create a new project with valid input', async () => {
      const input = {
        name: 'Test Project',
        config: { key: 'value' }
      };

      const project = await projectService.createProject(input);

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.status).toBe('active');
      expect(project.phase).toBe('analysis');
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should emit project.created event', async () => {
      const eventHandler = vi.fn();
      eventService.subscribeGlobal(eventHandler);

      const input = { name: 'Test Project' };
      const project = await projectService.createProject(input);

      expect(eventHandler).toHaveBeenCalledTimes(1);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: project.id,
          eventType: 'project.created',
          data: expect.objectContaining({
            id: project.id,
            name: 'Test Project'
          })
        })
      );
    });

    it('should reject empty name', async () => {
      await expect(
        projectService.createProject({ name: '' })
      ).rejects.toThrow('Project name is required');
    });

    it('should reject name with only whitespace', async () => {
      await expect(
        projectService.createProject({ name: '   ' })
      ).rejects.toThrow('Project name is required');
    });

    it('should reject name exceeding 255 characters', async () => {
      const longName = 'a'.repeat(256);
      await expect(
        projectService.createProject({ name: longName })
      ).rejects.toThrow('Project name must be less than 255 characters');
    });

    it('should trim whitespace from name', async () => {
      const project = await projectService.createProject({ name: '  Test Project  ' });
      expect(project.name).toBe('Test Project');
    });
  });

  describe('getProject', () => {
    it('should retrieve an existing project', async () => {
      const created = await projectService.createProject({ name: 'Test Project' });
      const retrieved = await projectService.getProject(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Project');
    });

    it('should return null for non-existent project', async () => {
      const result = await projectService.getProject('00000000-0000-0000-0000-000000000000');
      expect(result).toBeNull();
    });

    it('should use cache on subsequent reads', async () => {
      const created = await projectService.createProject({ name: 'Test Project' });

      // First read
      await projectService.getProject(created.id);

      // Second read (should use cache)
      const retrieved = await projectService.getProject(created.id);

      expect(retrieved?.id).toBe(created.id);
    });
  });

  describe('listProjects', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await projectService.listProjects({ limit: 20, offset: 0 });
      expect(projects).toEqual([]);
    });

    it('should list all projects with default pagination', async () => {
      await projectService.createProject({ name: 'Project 1' });
      await projectService.createProject({ name: 'Project 2' });
      await projectService.createProject({ name: 'Project 3' });

      const projects = await projectService.listProjects({ limit: 20, offset: 0 });

      expect(projects).toHaveLength(3);
      expect(projects.map(p => p.name)).toContain('Project 1');
      expect(projects.map(p => p.name)).toContain('Project 2');
      expect(projects.map(p => p.name)).toContain('Project 3');
    });

    it('should sort projects by updatedAt descending', async () => {
      const p1 = await projectService.createProject({ name: 'Project 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const p2 = await projectService.createProject({ name: 'Project 2' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const p3 = await projectService.createProject({ name: 'Project 3' });

      const projects = await projectService.listProjects({ limit: 20, offset: 0 });

      expect(projects[0].id).toBe(p3.id);
      expect(projects[1].id).toBe(p2.id);
      expect(projects[2].id).toBe(p1.id);
    });

    it('should apply limit', async () => {
      await projectService.createProject({ name: 'Project 1' });
      await projectService.createProject({ name: 'Project 2' });
      await projectService.createProject({ name: 'Project 3' });

      const projects = await projectService.listProjects({ limit: 2, offset: 0 });

      expect(projects).toHaveLength(2);
    });

    it('should apply offset', async () => {
      const p1 = await projectService.createProject({ name: 'Project 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      const p2 = await projectService.createProject({ name: 'Project 2' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await projectService.createProject({ name: 'Project 3' });

      const projects = await projectService.listProjects({ limit: 20, offset: 1 });

      expect(projects).toHaveLength(2);
      expect(projects[0].id).toBe(p2.id);
      expect(projects[1].id).toBe(p1.id);
    });

    it('should apply both limit and offset', async () => {
      const p1 = await projectService.createProject({ name: 'Project 1' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await projectService.createProject({ name: 'Project 2' });
      await new Promise(resolve => setTimeout(resolve, 10));
      await projectService.createProject({ name: 'Project 3' });

      const projects = await projectService.listProjects({ limit: 1, offset: 2 });

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(p1.id);
    });
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      const project = await projectService.createProject({ name: 'Original Name' });
      const updated = await projectService.updateProject(project.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(project.id);
      expect(updated.status).toBe(project.status);
    });

    it('should update project status', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      const updated = await projectService.updateProject(project.id, { status: 'paused' });

      expect(updated.status).toBe('paused');
    });

    it('should update project phase', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      const updated = await projectService.updateProject(project.id, { phase: 'planning' });

      expect(updated.phase).toBe('planning');
    });

    it('should update multiple fields at once', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      const updated = await projectService.updateProject(project.id, {
        name: 'Updated Name',
        status: 'completed',
        phase: 'review'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe('completed');
      expect(updated.phase).toBe('review');
    });

    it('should emit project.updated event', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const eventHandler = vi.fn();
      eventService.subscribeGlobal(eventHandler);

      await projectService.updateProject(project.id, { name: 'Updated Name' });

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: project.id,
          eventType: 'project.updated'
        })
      );
    });

    it('should emit project.phase.changed event when phase changes', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const eventHandler = vi.fn();
      eventService.subscribeGlobal(eventHandler);

      await projectService.updateProject(project.id, { phase: 'planning' });

      const phaseChangedEvent = eventHandler.mock.calls.find(
        call => call[0].eventType === 'project.phase.changed'
      );

      expect(phaseChangedEvent).toBeDefined();
      expect(phaseChangedEvent[0].data).toEqual({
        id: project.id,
        oldPhase: 'analysis',
        newPhase: 'planning'
      });
    });

    it('should not emit phase.changed event when phase does not change', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const eventHandler = vi.fn();
      eventService.subscribeGlobal(eventHandler);

      await projectService.updateProject(project.id, { name: 'Updated Name' });

      const phaseChangedEvent = eventHandler.mock.calls.find(
        call => call[0].eventType === 'project.phase.changed'
      );

      expect(phaseChangedEvent).toBeUndefined();
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        projectService.updateProject('00000000-0000-0000-0000-000000000000', { name: 'Updated' })
      ).rejects.toThrow('Project not found');
    });

    it('should reject empty name', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      await expect(
        projectService.updateProject(project.id, { name: '' })
      ).rejects.toThrow('Project name cannot be empty');
    });

    it('should reject name exceeding 255 characters', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      const longName = 'a'.repeat(256);
      await expect(
        projectService.updateProject(project.id, { name: longName })
      ).rejects.toThrow('Project name must be less than 255 characters');
    });
  });

  describe('deleteProject', () => {
    it('should delete an existing project', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      await projectService.deleteProject(project.id);

      const retrieved = await projectService.getProject(project.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        projectService.deleteProject('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Project not found');
    });

    it('should remove project from cache', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      await projectService.getProject(project.id); // Load into cache

      await projectService.deleteProject(project.id);

      const retrieved = await projectService.getProject(project.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear the project cache', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });
      await projectService.getProject(project.id); // Load into cache

      projectService.clearCache();

      // Should still be able to retrieve from disk
      const retrieved = await projectService.getProject(project.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(project.id);
    });
  });
});
