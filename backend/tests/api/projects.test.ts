/**
 * Project Routes Tests
 * Integration tests for project CRUD endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/api/server.js';
import { projectService } from '../../src/api/services/project.service.js';
import { eventService } from '../../src/api/services/event.service.js';

describe('Project Routes', () => {
  let server: FastifyInstance;
  let jwtToken: string;

  beforeEach(async () => {
    // Clear event service
    eventService.clearAll();

    // Create server with test config
    server = await createServer({
      jwtSecret: 'test-secret'
    });

    // Generate test JWT token
    jwtToken = server.jwt.sign({ userId: 'test-user' });

    // Clear project service cache AFTER server creation
    // to ensure the service is properly initialized
    projectService.clearCache();
  });

  afterEach(async () => {
    await server.close();

    // Clean up test projects
    try {
      const bmadDir = path.join(process.cwd(), 'bmad');
      const entries = await fs.readdir(bmadDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await fs.rm(path.join(bmadDir, entry.name), { recursive: true, force: true });
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/projects', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects'
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return empty array when no projects exist', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('should list all projects', async () => {
      // Create test projects directly
      await projectService.createProject({ name: 'Project 1' });
      await projectService.createProject({ name: 'Project 2' });

      const response = await server.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.timestamp).toBeDefined();
    });

    it('should apply limit query parameter', async () => {
      await projectService.createProject({ name: 'Project 1' });
      await projectService.createProject({ name: 'Project 2' });
      await projectService.createProject({ name: 'Project 3' });

      const response = await server.inject({
        method: 'GET',
        url: '/api/projects?limit=2',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
    });

    it('should apply offset query parameter', async () => {
      // Create projects in sequence
      const proj1 = await projectService.createProject({ name: 'Project 1' });
      const proj2 = await projectService.createProject({ name: 'Project 2' });
      const proj3 = await projectService.createProject({ name: 'Project 3' });

      const response = await server.inject({
        method: 'GET',
        url: '/api/projects?offset=1',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects?limit=200',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should use default limit of 20', async () => {
      // Create 25 projects
      for (let i = 0; i < 25; i++) {
        await projectService.createProject({ name: `Project ${i}` });
      }

      const response = await server.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(20);
    });
  });

  describe('POST /api/projects', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/projects',
        payload: {
          name: 'Test Project'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should create a new project', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: 'Test Project',
          config: { key: 'value' }
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Test Project');
      expect(body.data.id).toBeDefined();
      expect(body.data.status).toBe('active');
      expect(body.data.phase).toBe('analysis');
    });

    it('should reject empty name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: ''
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
    });

    it('should reject missing name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject name exceeding 255 characters', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: 'a'.repeat(256)
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects/123e4567-e89b-12d3-a456-426614174000'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return project details', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(project.id);
      expect(body.data.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects/invalid-uuid',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: '/api/projects/123e4567-e89b-12d3-a456-426614174000',
        payload: { name: 'Updated' }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should update project name', async () => {
      const project = await projectService.createProject({ name: 'Original Name' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: 'Updated Name'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Updated Name');
    });

    it('should update project status', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          status: 'paused'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.status).toBe('paused');
    });

    it('should update project phase', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          phase: 'planning'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.phase).toBe('planning');
    });

    it('should update multiple fields', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: 'Updated Name',
          status: 'completed',
          phase: 'review'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toBe('Updated Name');
      expect(body.data.status).toBe('completed');
      expect(body.data.phase).toBe('review');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await server.inject({
        method: 'PATCH',
        url: '/api/projects/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: 'Updated'
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject invalid status', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          status: 'invalid-status'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid phase', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          phase: 'invalid-phase'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/projects/123e4567-e89b-12d3-a456-426614174000'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should delete an existing project', async () => {
      const project = await projectService.createProject({ name: 'Test Project' });

      const response = await server.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify project is deleted
      const getResponse = await server.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/projects/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/projects/invalid-uuid',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
