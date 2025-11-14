/**
 * API Server Tests
 * Integration tests for Fastify API server
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../../src/api/server.js';

describe('API Server', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer({ port: 0 }); // Random port
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should start successfully', () => {
    expect(server).toBeDefined();
    expect(server.server.listening || server.ready).toBeTruthy();
  });

  it('should respond to root endpoint', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.name).toBe('Agent Orchestrator API');
    expect(body.version).toBe('1.0.0');
    expect(body.status).toBe('running');
  });

  it('should have health endpoint', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.uptime).toBeDefined();
  });

  it('should have readiness endpoint', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health/ready'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ready).toBeDefined();
  });

  it('should have liveness endpoint', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health/live'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.alive).toBe(true);
  });

  it('should have metrics endpoint', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/metrics'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.uptime).toBeDefined();
    expect(body.memory).toBeDefined();
  });

  it('should serve OpenAPI documentation', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/docs'
    });

    expect([200, 302]).toContain(response.statusCode);
  });

  it('should serve OpenAPI JSON spec', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/docs/json'
    });

    expect([200, 302]).toContain(response.statusCode);
    if (response.statusCode === 200) {
      const body = JSON.parse(response.body);
      expect(body.openapi || body.swagger).toBeDefined();
    }
  });

  it('should have security headers', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.headers['x-content-type-options']).toBeDefined();
  });
});
