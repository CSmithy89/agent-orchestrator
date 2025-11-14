/**
 * Escalation Routes Tests
 * Integration tests for escalation management endpoints
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/api/server.js';
import { escalationService } from '../../src/api/services/escalation.service.js';
import { eventService } from '../../src/api/services/event.service.js';

describe('Escalation Routes', () => {
  let server: FastifyInstance;
  let jwtToken: string;

  beforeEach(async () => {
    // Clear event service
    eventService.clearAll();

    // Clean up test escalations
    try {
      await fs.rm('.bmad-escalations', { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Create server with test config
    server = await createServer({
      jwtSecret: 'test-secret'
    });

    // Generate test JWT token
    jwtToken = server.jwt.sign({ userId: 'test-user' });
  });

  afterEach(async () => {
    await server.close();

    // Clean up test escalations
    try {
      await fs.rm('.bmad-escalations', { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/escalations', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/escalations'
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return empty array when no escalations exist', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/escalations',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(0);
    });

    it('should filter escalations by status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/escalations?status=pending',
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
        url: '/api/escalations?status=invalid',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should filter escalations by projectId', async () => {
      const testProjectId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await server.inject({
        method: 'GET',
        url: `/api/escalations?projectId=${testProjectId}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('GET /api/escalations/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/escalations/esc-test-id'
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent escalation', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/escalations/esc-nonexistent',
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/escalations/:id/respond', () => {
    it('should return 401 without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/escalations/esc-test-id/respond',
        payload: {
          response: 'Test response'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject empty response', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/escalations/esc-test-id/respond',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          response: ''
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject missing response', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/escalations/esc-test-id/respond',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent escalation', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/escalations/esc-nonexistent/respond',
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          response: 'Test response'
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
