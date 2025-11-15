/**
 * OpenAPI Schema Validation Tests
 * Validates that all API responses match their OpenAPI schema definitions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/api/server.js';
import { projectService } from '../../src/api/services/project.service.js';
import { eventService } from '../../src/api/services/event.service.js';

describe('OpenAPI Schema Validation', () => {
  let server: FastifyInstance;
  let jwtToken: string;

  beforeEach(async () => {
    // Clear services
    projectService.clearCache();
    eventService.clearAll();

    // Create server with test config
    server = await createServer({
      jwtSecret: 'test-secret'
    });

    // Generate test JWT token
    jwtToken = server.jwt.sign({ userId: 'test-user' });
  });

  afterEach(async () => {
    await server.close();
  });

  describe('Project Endpoints Schema', () => {
    it('GET /api/projects should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate response structure
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.success).toBe('boolean');
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.timestamp).toBe('string');

      // Validate timestamp is ISO 8601 format
      expect(() => new Date(body.timestamp)).not.toThrow();
    });

    it('POST /api/projects response should match schema', async () => {
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

      // Validate APIResponse structure
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('timestamp');

      // Validate Project object
      const project = body.data;
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('status');
      expect(project).toHaveProperty('phase');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');

      // Validate types
      expect(typeof project.id).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.status).toBe('string');
      expect(typeof project.phase).toBe('string');
      expect(typeof project.createdAt).toBe('string');
      expect(typeof project.updatedAt).toBe('string');

      // Validate enums
      expect(['active', 'paused', 'completed', 'archived']).toContain(project.status);
      expect(['analysis', 'planning', 'solutioning', 'implementation', 'review', 'completed']).toContain(project.phase);
    });

    it('GET /api/projects/:id should match schema', async () => {
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

      // Validate Project object structure
      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('name');
      expect(body.data).toHaveProperty('status');
      expect(body.data).toHaveProperty('phase');
      expect(body.data).toHaveProperty('createdAt');
      expect(body.data).toHaveProperty('updatedAt');
    });
  });

  describe('Orchestrator Endpoints Schema', () => {
    const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

    it('GET /api/orchestrators/:projectId/status should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/orchestrators/${testProjectId}/status`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate OrchestratorStatus structure
      expect(body.data).toHaveProperty('projectId');
      expect(body.data).toHaveProperty('status');
      expect(typeof body.data.projectId).toBe('string');
      expect(typeof body.data.status).toBe('string');
      expect(['idle', 'running', 'paused', 'completed', 'error']).toContain(body.data.status);
    });
  });

  describe('State Query Endpoints Schema', () => {
    const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

    it('GET /api/projects/:id/workflow-status should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/workflow-status`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate WorkflowStatus structure
      expect(body.data).toHaveProperty('projectId');
      expect(body.data).toHaveProperty('currentPhase');
      expect(body.data).toHaveProperty('phases');
      expect(body.data).toHaveProperty('status');

      expect(typeof body.data.projectId).toBe('string');
      expect(typeof body.data.currentPhase).toBe('string');
      expect(Array.isArray(body.data.phases)).toBe(true);
      expect(typeof body.data.status).toBe('string');
    });

    it('GET /api/projects/:id/sprint-status should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/sprint-status`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate SprintStatus structure
      expect(body.data).toHaveProperty('projectId');
      expect(body.data).toHaveProperty('project');
      expect(body.data).toHaveProperty('generatedAt');
      expect(body.data).toHaveProperty('epics');
      expect(body.data).toHaveProperty('stories');

      expect(typeof body.data.projectId).toBe('string');
      expect(typeof body.data.project).toBe('string');
      expect(typeof body.data.generatedAt).toBe('string');
      expect(Array.isArray(body.data.epics)).toBe(true);
      expect(Array.isArray(body.data.stories)).toBe(true);

      // Validate Epic structure (if any epics exist)
      if (body.data.epics.length > 0) {
        const epic = body.data.epics[0];
        expect(epic).toHaveProperty('id');
        expect(epic).toHaveProperty('title');
        expect(epic).toHaveProperty('status');
        expect(epic).toHaveProperty('stories');
      }

      // Validate Story structure (if any stories exist)
      if (body.data.stories.length > 0) {
        const story = body.data.stories[0];
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('epicId');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('status');
      }
    });

    it('GET /api/projects/:id/stories should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(Array.isArray(body.data)).toBe(true);

      // Validate Story structure (if any stories exist)
      if (body.data.length > 0) {
        const story = body.data[0];
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('epicId');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('status');
        expect(['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']).toContain(story.status);
      }
    });

    it('GET /api/projects/:id/dependency-graph should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/dependency-graph`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Validate DependencyGraph structure
      expect(body.data).toHaveProperty('nodes');
      expect(body.data).toHaveProperty('edges');
      expect(body.data).toHaveProperty('criticalPath');

      expect(Array.isArray(body.data.nodes)).toBe(true);
      expect(Array.isArray(body.data.edges)).toBe(true);
      expect(Array.isArray(body.data.criticalPath)).toBe(true);

      // Validate Node structure (if any nodes exist)
      if (body.data.nodes.length > 0) {
        const node = body.data.nodes[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('storyId');
        expect(node).toHaveProperty('epicNumber');
        expect(node).toHaveProperty('storyNumber');
        expect(node).toHaveProperty('title');
        expect(node).toHaveProperty('status');
        expect(node).toHaveProperty('complexity');
        expect(node).toHaveProperty('hasWorktree');

        expect(typeof node.id).toBe('string');
        expect(typeof node.storyId).toBe('string');
        expect(typeof node.epicNumber).toBe('number');
        expect(typeof node.storyNumber).toBe('number');
        expect(typeof node.title).toBe('string');
        expect(['pending', 'in-progress', 'review', 'merged', 'blocked']).toContain(node.status);
        expect(['small', 'medium', 'large']).toContain(node.complexity);
        expect(typeof node.hasWorktree).toBe('boolean');
      }

      // Validate Edge structure (if any edges exist)
      if (body.data.edges.length > 0) {
        const edge = body.data.edges[0];
        expect(edge).toHaveProperty('source');
        expect(edge).toHaveProperty('target');
        expect(edge).toHaveProperty('type');
        expect(edge).toHaveProperty('isBlocking');

        expect(typeof edge.source).toBe('string');
        expect(typeof edge.target).toBe('string');
        expect(['hard', 'soft']).toContain(edge.type);
        expect(typeof edge.isBlocking).toBe('boolean');
      }
    });
  });

  describe('Escalation Endpoints Schema', () => {
    it('GET /api/escalations should match schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/escalations',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('Error Response Schema', () => {
    it('404 error should match APIError schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);

      // Validate APIError structure
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('requestId');

      expect(typeof body.error).toBe('string');
      expect(typeof body.message).toBe('string');
      expect(typeof body.requestId).toBe('string');
    });

    it('400 error should match APIError schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects/invalid-uuid',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('requestId');
    });

    it('401 error should match APIError schema', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects'
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('requestId');
    });
  });

  describe('Pagination Schema', () => {
    it('should support pagination query parameters', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects?limit=10&offset=0',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeLessThanOrEqual(10);
    });
  });
});
