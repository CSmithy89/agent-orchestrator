/**
 * WebSocket Tests
 * Integration tests for WebSocket real-time updates
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import WebSocket from 'ws';
import { FastifyInstance } from 'fastify';
import { startServer } from '../../src/api/server.js';
import { getWebSocketHandler } from '../../src/api/server.js';
import { eventService } from '../../src/api/services/event.service.js';
import { Event } from '../../src/api/types/events.types.js';

describe('WebSocket Handler', () => {
  let server: FastifyInstance;
  let jwtToken: string;
  let baseUrl: string;

  beforeEach(async () => {
    // Clear event service
    eventService.clearAll();

    // Start server with random port
    const port = 3000 + Math.floor(Math.random() * 1000);
    server = await startServer({
      port,
      host: 'localhost',
      jwtSecret: 'test-secret'
    });

    jwtToken = server.jwt.sign({ userId: 'test-user' });
    baseUrl = `ws://localhost:${port}`;
  });

  afterEach(async () => {
    const wsHandler = getWebSocketHandler();
    if (wsHandler) {
      await wsHandler.close();
    }
    await server.close();
  });

  describe('Connection', () => {
    it('should reject connection without authentication', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.error).toBe('Authentication failed');
      });

      ws.on('close', (code) => {
        expect(code).toBe(1008);
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: 'Bearer invalid-token'
        }
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.error).toBe('Authentication failed');
      });

      ws.on('close', (code) => {
        expect(code).toBe(1008);
        done();
      });
    });

    it('should accept connection with valid JWT token', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connected') {
          expect(message.clientId).toBeDefined();
          expect(message.timestamp).toBeDefined();
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should track connected clients', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      ws.on('open', () => {
        setTimeout(() => {
          const wsHandler = getWebSocketHandler();
          expect(wsHandler?.getClientCount()).toBe(1);
          ws.close();
          done();
        }, 100);
      });
    });
  });

  describe('Subscription', () => {
    it('should handle project subscription', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      let receivedConnected = false;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          receivedConnected = true;
          // Send subscription message
          ws.send(JSON.stringify({
            action: 'subscribe',
            projectId: 'test-project-123'
          }));
        } else if (message.type === 'subscribed') {
          expect(receivedConnected).toBe(true);
          expect(message.projectId).toBe('test-project-123');
          expect(message.timestamp).toBeDefined();
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle project unsubscription', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      let subscribed = false;

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({
            action: 'subscribe',
            projectId: 'test-project-123'
          }));
        } else if (message.type === 'subscribed') {
          subscribed = true;
          ws.send(JSON.stringify({
            action: 'unsubscribe',
            projectId: 'test-project-123'
          }));
        } else if (message.type === 'unsubscribed') {
          expect(subscribed).toBe(true);
          expect(message.projectId).toBe('test-project-123');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should reject invalid action', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({
            action: 'invalid-action',
            projectId: 'test-project-123'
          }));
        } else if (message.error === 'Invalid action') {
          expect(message.message).toBe('Action must be "subscribe" or "unsubscribe"');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should reject invalid JSON message', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send('invalid-json');
        } else if (message.error === 'Invalid message') {
          expect(message.message).toBe('Failed to parse message as JSON');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Event Broadcasting', () => {
    it('should receive events for subscribed project', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      const projectId = 'test-project-123';

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({
            action: 'subscribe',
            projectId
          }));
        } else if (message.type === 'subscribed') {
          // Emit test event
          eventService.emitEvent(projectId, 'project.created', {
            id: projectId,
            name: 'Test Project'
          });
        } else if (message.eventType === 'project.created') {
          expect(message.projectId).toBe(projectId);
          expect(message.data).toEqual({
            id: projectId,
            name: 'Test Project'
          });
          expect(message.timestamp).toBeDefined();
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should not receive events for unsubscribed project', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      const subscribedProjectId = 'project-1';
      const otherProjectId = 'project-2';

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({
            action: 'subscribe',
            projectId: subscribedProjectId
          }));
        } else if (message.type === 'subscribed') {
          // Emit event for different project
          eventService.emitEvent(otherProjectId, 'project.created', {
            id: otherProjectId,
            name: 'Other Project'
          });

          // Wait a bit to ensure no event is received
          setTimeout(() => {
            ws.close();
            done();
          }, 100);
        } else if (message.eventType) {
          // Should not receive events for unsubscribed project
          done(new Error('Received event for unsubscribed project'));
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should receive multiple event types', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      const projectId = 'test-project-123';
      const receivedEvents: string[] = [];

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({
            action: 'subscribe',
            projectId
          }));
        } else if (message.type === 'subscribed') {
          // Emit multiple event types
          eventService.emitEvent(projectId, 'project.created', { id: projectId });
          eventService.emitEvent(projectId, 'project.phase.changed', { oldPhase: 'analysis', newPhase: 'planning' });
          eventService.emitEvent(projectId, 'story.status.changed', { storyId: 'story-1' });
        } else if (message.eventType) {
          receivedEvents.push(message.eventType);

          if (receivedEvents.length === 3) {
            expect(receivedEvents).toContain('project.created');
            expect(receivedEvents).toContain('project.phase.changed');
            expect(receivedEvents).toContain('story.status.changed');
            ws.close();
            done();
          }
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle multiple subscriptions from same client', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      const project1 = 'project-1';
      const project2 = 'project-2';
      const subscriptions: string[] = [];
      const receivedEvents: string[] = [];

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({ action: 'subscribe', projectId: project1 }));
        } else if (message.type === 'subscribed') {
          subscriptions.push(message.projectId);

          if (subscriptions.length === 1) {
            ws.send(JSON.stringify({ action: 'subscribe', projectId: project2 }));
          } else if (subscriptions.length === 2) {
            // Emit events for both projects
            eventService.emitEvent(project1, 'project.created', { id: project1 });
            eventService.emitEvent(project2, 'project.created', { id: project2 });
          }
        } else if (message.eventType === 'project.created') {
          receivedEvents.push(message.projectId);

          if (receivedEvents.length === 2) {
            expect(receivedEvents).toContain(project1);
            expect(receivedEvents).toContain(project2);
            ws.close();
            done();
          }
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Heartbeat', () => {
    it('should respond to ping with pong', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      ws.on('open', () => {
        ws.ping();
      });

      ws.on('pong', () => {
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Connection Cleanup', () => {
    it('should clean up subscriptions on disconnect', (done) => {
      const ws = new WebSocket(`${baseUrl}/ws/status-updates`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`
        }
      });

      const projectId = 'test-project-123';

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'connected') {
          ws.send(JSON.stringify({
            action: 'subscribe',
            projectId
          }));
        } else if (message.type === 'subscribed') {
          const wsHandler = getWebSocketHandler();
          expect(wsHandler?.getSubscriptionCount(projectId)).toBe(1);

          // Close connection
          ws.close();
        }
      });

      ws.on('close', () => {
        // Wait for cleanup
        setTimeout(() => {
          const wsHandler = getWebSocketHandler();
          expect(wsHandler?.getSubscriptionCount(projectId)).toBe(0);
          expect(wsHandler?.getClientCount()).toBe(0);
          done();
        }, 100);
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });
});
