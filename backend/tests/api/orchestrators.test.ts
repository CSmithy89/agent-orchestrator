/**
 * Orchestrator Routes Tests
 * Integration tests for orchestrator control endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/api/server.js';
import { orchestratorService } from '../../src/api/services/orchestrator.service.js';
import { eventService } from '../../src/api/services/event.service.js';

describe('Orchestrator Routes', () => {
  let server: FastifyInstance;
  let jwtToken: string;
  const testProjectId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    // Clear orchestrator service
    orchestratorService.clearEngines();

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

  describe('GET /api/orchestrators/:projectId/status', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/orchestrators/${testProjectId}/status`
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return idle status for project with no workflow', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/orchestrators/${testProjectId}/status`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.projectId).toBe(testProjectId);
      expect(body.data.status).toBe('idle');
    });

    it('should reject invalid project ID format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/orchestrators/invalid-id/status',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/orchestrators/:projectId/start', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/start`,
        payload: {
          workflowPath: 'test-workflow.yaml'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject request without workflowPath', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/start`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject empty workflowPath', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/start`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          workflowPath: ''
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/orchestrators/:projectId/pause', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/pause`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail when no workflow is running', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/pause`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('No workflow is currently running');
    });
  });

  describe('POST /api/orchestrators/:projectId/resume', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/resume`
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail when no paused workflow exists', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/orchestrators/${testProjectId}/resume`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toContain('No workflow state found');
    });
  });
});
