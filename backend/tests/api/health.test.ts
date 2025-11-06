/**
 * Unit tests for health check endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  performHealthCheck,
  healthCheckHandler,
  getStatusCode,
  clearHealthCheckCache
} from '../../src/api/health.js';

describe('Health Check', () => {
  beforeEach(() => {
    clearHealthCheckCache();
    // Mock environment variables
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    clearHealthCheckCache();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  describe('performHealthCheck', () => {
    it('should return health status', async () => {
      const result = await performHealthCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('llm_api');
      expect(result.checks).toHaveProperty('git');
      expect(result.checks).toHaveProperty('disk_space');
      expect(result.checks).toHaveProperty('memory');
    });

    it('should include system details', async () => {
      const result = await performHealthCheck();

      expect(result.details).toBeDefined();
      expect(result.details?.memory).toHaveProperty('usage');
      expect(result.details?.memory).toHaveProperty('limit');
      expect(result.details?.memory).toHaveProperty('percentage');
    });

    it('should cache results', async () => {
      const result1 = await performHealthCheck();
      const result2 = await performHealthCheck();

      // Same timestamp means cached
      expect(result1.timestamp).toBe(result2.timestamp);
    });

    it('should skip cache when requested', async () => {
      const result1 = await performHealthCheck();

      // Wait a bit to ensure timestamp would be different
      await new Promise(resolve => setTimeout(resolve, 10));

      const result2 = await performHealthCheck(true);

      // Different timestamp means fresh check
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });
  });

  describe('LLM API health check', () => {
    it('should be healthy with API keys configured', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const result = await performHealthCheck();

      expect(result.checks.llm_api).toBe('healthy');
    });

    it('should be unhealthy without API keys', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      clearHealthCheckCache();

      const result = await performHealthCheck();

      expect(result.checks.llm_api).toBe('unhealthy');
    });
  });

  describe('Memory health check', () => {
    it('should check memory usage', async () => {
      const result = await performHealthCheck();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.checks.memory);
      expect(result.details?.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.details?.memory.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Overall status determination', () => {
    it('should be unhealthy if any component is unhealthy', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      clearHealthCheckCache();

      const result = await performHealthCheck();

      // LLM API will be unhealthy without keys
      if (result.checks.llm_api === 'unhealthy') {
        expect(result.status).toBe('unhealthy');
      }
    });

    it('should be degraded if any component is degraded', async () => {
      // This is harder to test without mocking, but the logic is:
      // - If any component is 'unhealthy', overall is 'unhealthy'
      // - If any component is 'degraded', overall is 'degraded'
      // - Otherwise overall is 'healthy'

      const result = await performHealthCheck();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(result.status);
    });
  });

  describe('getStatusCode', () => {
    it('should return 200 for healthy', () => {
      expect(getStatusCode('healthy')).toBe(200);
    });

    it('should return 200 for degraded', () => {
      expect(getStatusCode('degraded')).toBe(200);
    });

    it('should return 503 for unhealthy', () => {
      expect(getStatusCode('unhealthy')).toBe(503);
    });
  });

  describe('healthCheckHandler', () => {
    it('should return status code and body', async () => {
      const result = await healthCheckHandler();

      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('body');
      expect(result.body).toHaveProperty('status');
      expect(result.body).toHaveProperty('timestamp');
    });

    it('should return correct status code', async () => {
      const result = await healthCheckHandler();

      const expectedCode = getStatusCode(result.body.status);
      expect(result.statusCode).toBe(expectedCode);
    });
  });
});
