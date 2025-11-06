/**
 * Unit tests for RetryHandler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RetryHandler, retry } from '../../src/core/RetryHandler.js';
import { RetryableError, FatalError } from '../../src/types/errors.types.js';

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should use default configuration', () => {
      const handler = new RetryHandler();
      expect(handler).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const handler = new RetryHandler({
        maxRetries: 5,
        initialDelay: 500,
        maxDelay: 10000
      });
      expect(handler).toBeDefined();
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const handler = new RetryHandler();
      const operation = vi.fn().mockResolvedValue('success');

      const promise = handler.executeWithRetry(operation, 'test operation');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      const handler = new RetryHandler({
        maxRetries: 3,
        initialDelay: 1000
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new RetryableError('Error 1', 'TEST_ERROR'))
        .mockRejectedValueOnce(new RetryableError('Error 2', 'TEST_ERROR'))
        .mockResolvedValue('success');

      const promise = handler.executeWithRetry(operation, 'test operation');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry fatal errors', async () => {
      const handler = new RetryHandler();
      const fatalError = new FatalError('Fatal error', 'FATAL_ERROR');
      const operation = vi.fn().mockRejectedValue(fatalError);

      await expect(
        handler.executeWithRetry(operation, 'test operation')
      ).rejects.toThrow(fatalError);

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries exceeded', async () => {
      const handler = new RetryHandler({
        maxRetries: 2,
        initialDelay: 100
      });

      const error = new RetryableError('Persistent error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.executeWithRetry(operation, 'test operation');

      // Advance timers and catch the rejection properly
      await Promise.all([
        vi.runAllTimersAsync(),
        expect(promise).rejects.toThrow('Operation failed after 2 retries')
      ]);

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const handler = new RetryHandler({
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        enableJitter: false // Disable jitter for predictable testing
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new RetryableError('Error', 'TEST'))
        .mockRejectedValueOnce(new RetryableError('Error', 'TEST'))
        .mockResolvedValue('success');

      const promise = handler.executeWithRetry(operation);

      // First attempt fails
      await vi.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(operation).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should respect custom shouldRetry condition', async () => {
      const handler = new RetryHandler({
        shouldRetry: (error) => error.message === 'Retry me'
      });

      const operation1 = vi.fn().mockRejectedValue(new Error('Retry me'));
      const operation2 = vi.fn().mockRejectedValue(new Error('Do not retry'));

      // Should retry this error
      const promise1 = handler.executeWithRetry(operation1);

      // Advance timers and catch the rejection properly
      await Promise.all([
        vi.runAllTimersAsync(),
        expect(promise1).rejects.toThrow()
      ]);

      expect(operation1).toHaveBeenCalledTimes(4); // Initial + 3 retries

      // Should not retry this error
      await expect(
        handler.executeWithRetry(operation2)
      ).rejects.toThrow('Do not retry');
      expect(operation2).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const handler = new RetryHandler({
        maxRetries: 2,
        onRetry
      });

      const operation = vi.fn()
        .mockRejectedValueOnce(new RetryableError('Error', 'TEST'))
        .mockResolvedValue('success');

      const promise = handler.executeWithRetry(operation);
      await vi.runAllTimersAsync();
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(RetryableError),
        1, // Attempt number
        expect.any(Number) // Delay
      );
    });
  });

  describe('calculateDelay with jitter', () => {
    it('should add jitter to delay', async () => {
      const handler = new RetryHandler({
        maxRetries: 1,
        initialDelay: 1000,
        enableJitter: true,
        jitterPercent: 0.2
      });

      const delays: number[] = [];
      const onRetry = vi.fn((_error, _attempt, delay) => {
        delays.push(delay);
      });

      handler['onRetry'] = onRetry;

      const operation = vi.fn().mockRejectedValue(new RetryableError('Error', 'TEST'));

      const promise = handler.executeWithRetry(operation);

      // Advance timers and catch the rejection properly
      await Promise.all([
        vi.runAllTimersAsync(),
        expect(promise).rejects.toThrow()
      ]);

      expect(delays.length).toBe(1);
      // Delay should be within ±20% of 1000ms
      expect(delays[0]).toBeGreaterThanOrEqual(800);
      expect(delays[0]).toBeLessThanOrEqual(1200);
    });
  });

  describe('getRetrySequence', () => {
    it('should return correct retry sequence', () => {
      const handler = new RetryHandler({
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      });

      const sequence = handler.getRetrySequence();

      expect(sequence).toEqual([1000, 2000, 4000]);
    });

    it('should respect maxDelay', () => {
      const handler = new RetryHandler({
        maxRetries: 5,
        initialDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      });

      const sequence = handler.getRetrySequence();

      expect(sequence).toEqual([1000, 2000, 4000, 5000, 5000]);
    });
  });

  describe('retry utility function', () => {
    it('should retry operation with default config', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new RetryableError('Error', 'TEST'))
        .mockResolvedValue('success');

      const promise = retry(operation);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should accept custom config', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new RetryableError('Error', 'TEST'))
        .mockResolvedValue('success');

      const promise = retry(operation, { maxRetries: 1 });
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
    });
  });
});
