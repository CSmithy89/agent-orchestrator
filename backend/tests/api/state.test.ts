/**
 * State Routes Tests
 * Integration tests for state query endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/api/server.js';
import { eventService } from '../../src/api/services/event.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the state service module to return our test instance
vi.mock('../../src/api/services/state.service.js', async () => {
  const StateServiceModule = await vi.importActual('../../src/api/services/state.service.js') as any;
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const fixturesDir = path.join(currentDir, '..', 'fixtures');

  const testStateService = new StateServiceModule.StateService(fixturesDir);

  return {
    StateService: StateServiceModule.StateService,
    stateService: testStateService
  };
});

describe('State Routes', () => {
  let server: FastifyInstance;
  let jwtToken: string;
  const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    // Clear state service cache
    const { stateService } = await import('../../src/api/services/state.service.js');
    stateService.clearCache();

    // Clear event service
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

  describe('GET /api/projects/:id/workflow-status', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/workflow-status`
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return workflow status for valid project', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/workflow-status`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('projectId');
      expect(body.data).toHaveProperty('currentPhase');
      expect(body.data).toHaveProperty('status');
    });

    it('should reject invalid project ID format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/projects/invalid-id/workflow-status',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/projects/:id/sprint-status', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/sprint-status`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return sprint status with epics and stories', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/sprint-status`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('epics');
      expect(body.data).toHaveProperty('stories');
      expect(Array.isArray(body.data.epics)).toBe(true);
      expect(Array.isArray(body.data.stories)).toBe(true);
    });
  });

  describe('GET /api/projects/:id/stories', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return story list', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should filter stories by status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories?status=done`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should reject invalid status filter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories?status=invalid`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/projects/:id/stories/:storyId', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories/1-1-test-story`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent story', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/projects/${testProjectId}/stories/99-99-nonexistent`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
