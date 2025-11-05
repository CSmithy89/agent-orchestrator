/**
 * RetryHandler Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryHandler } from '../../src/llm/utils/RetryHandler.js';
import { LLMError, LLMErrorType } from '../../src/types/llm.types.js';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = vi.fn();
    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 100, // Shorter delays for tests
      backoffMultiplier: 2,
      logger: mockLogger
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Execution', () => {
    it('should execute function successfully on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'test operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockLogger).not.toHaveBeenCalled();
    });

    it('should execute function successfully after retries', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockRejectedValueOnce(new Error('Another transient error'))
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'test operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Classification - Auth Errors', () => {
    it('should not retry 401 errors', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'auth operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockLogger).not.toHaveBeenCalled();
    });

    it('should not retry 403 errors', async () => {
      const error = new Error('Forbidden');
      (error as any).status = 403;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'auth operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry LLMError with AUTH type', async () => {
      const error = new LLMError('Auth failed', LLMErrorType.AUTH);

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'auth operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Classification - Permanent Errors', () => {
    it('should not retry 400 errors', async () => {
      const error = new Error('Bad Request');
      (error as any).status = 400;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'validation operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry 404 errors', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'fetch operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not retry LLMError with PERMANENT type', async () => {
      const error = new LLMError('Invalid request', LLMErrorType.PERMANENT);

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Classification - Config Errors', () => {
    it('should not retry CONFIG errors', async () => {
      const error = new LLMError('Invalid model configuration', LLMErrorType.CONFIG);

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'config operation')
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should preserve CONFIG error type (not convert to TRANSIENT)', async () => {
      const error = new LLMError('Unknown provider', LLMErrorType.CONFIG, 'test', 'model');

      const fn = vi.fn().mockRejectedValue(error);

      try {
        await retryHandler.executeWithRetry(fn, 'config operation');
        expect.fail('Should have thrown an error');
      } catch (err: any) {
        expect(err.errorType).toBe(LLMErrorType.CONFIG);
        expect(err.message).toContain('Unknown provider');
      }

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Classification - Transient Errors', () => {
    it('should retry 429 rate limit errors', async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'rate limited operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should retry 503 service unavailable errors', async () => {
      const error = new Error('Service Unavailable');
      (error as any).status = 503;

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'service error operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry timeout errors', async () => {
      const error = new Error('Request timeout');

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'timeout operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry ECONNRESET errors', async () => {
      const error = new Error('Connection reset');
      (error as any).code = 'ECONNRESET';

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'connection error operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry ETIMEDOUT errors', async () => {
      const error = new Error('Connection timeout');
      (error as any).code = 'ETIMEDOUT';

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'timeout operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry ECONNREFUSED errors', async () => {
      const error = new Error('Connection refused');
      (error as any).code = 'ECONNREFUSED';

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'connection refused operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry ENOTFOUND errors', async () => {
      const error = new Error('DNS lookup failed');
      (error as any).code = 'ENOTFOUND';

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const result = await retryHandler.executeWithRetry(fn, 'DNS error operation');

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Exhaustion', () => {
    it('should throw after max retries exceeded', async () => {
      const error = new Error('Persistent transient error');
      (error as any).status = 503;

      const fn = vi.fn().mockRejectedValue(error);

      await expect(
        retryHandler.executeWithRetry(fn, 'failing operation')
      ).rejects.toThrow(/Max retries.*exceeded/);

      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(mockLogger).toHaveBeenCalledTimes(3);
    });

    it('should include context in retry exhaustion error', async () => {
      const error = new Error('Persistent error');
      (error as any).status = 503;

      const fn = vi.fn().mockRejectedValue(error);

      try {
        await retryHandler.executeWithRetry(fn, 'test context operation');
        expect.fail('Should have thrown an error');
      } catch (err: any) {
        expect(err.message).toContain('test context operation');
        expect(err.message).toContain('Max retries');
        expect(err.errorType).toBe(LLMErrorType.TRANSIENT);
      }
    });
  });

  describe('Exponential Backoff', () => {
    it('should apply exponential backoff delays', async () => {
      const error = new Error('Transient error');
      (error as any).status = 503;

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const startTime = Date.now();
      await retryHandler.executeWithRetry(fn, 'backoff operation');
      const endTime = Date.now();

      // Total expected delay: 100ms + 200ms + 400ms = 700ms
      // Allow some tolerance for execution time
      expect(endTime - startTime).toBeGreaterThanOrEqual(700);
      expect(endTime - startTime).toBeLessThan(1000);

      expect(mockLogger).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('waiting 100ms')
      );
      expect(mockLogger).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('waiting 200ms')
      );
      expect(mockLogger).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('waiting 400ms')
      );
    });
  });

  describe('Logging', () => {
    it('should log retry attempts with context', async () => {
      const error = new Error('Transient error');
      (error as any).status = 503;

      const fn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      await retryHandler.executeWithRetry(fn, 'logged operation');

      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Retry 1/3 for logged operation')
      );
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('waiting 100ms')
      );
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Transient error')
      );
    });
  });
});
