/**
 * Unit tests for ErrorHandler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler, EscalationLevel } from '../../src/core/ErrorHandler.js';
import {
  RetryableError,
  FatalError,
  LLMAPIError,
  GitOperationError,
  StateCorruptionError,
  ResourceExhaustedError
} from '../../src/types/errors.types.js';

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('constructor', () => {
    it('should create error handler with default config', () => {
      const handler = new ErrorHandler();
      expect(handler).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        onEscalation,
        enableRetry: false
      });
      expect(handler).toBeDefined();
    });
  });

  describe('handleOperation', () => {
    it('should execute operation successfully', async () => {
      const handler = new ErrorHandler();
      const operation = vi.fn().mockResolvedValue('success');

      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry retryable errors', async () => {
      const handler = new ErrorHandler({ enableRetry: true });
      const operation = vi.fn()
        .mockRejectedValueOnce(new RetryableError('Transient error', 'TEST_ERROR'))
        .mockResolvedValue('success');

      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry when retry is disabled', async () => {
      const handler = new ErrorHandler({ enableRetry: false });
      const error = new RetryableError('Error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleOperation(operation, 'test')
      ).rejects.toThrow(error);

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should escalate after max retries', async () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        enableRetry: true,
        enableEscalation: true,
        onEscalation
      });

      const error = new RetryableError('Persistent error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      expect(onEscalation).toHaveBeenCalled();
    });

    it('should track error metrics', async () => {
      const handler = new ErrorHandler();
      const error = new RetryableError('Test error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      const metrics = handler.getErrorMetrics();
      expect(metrics.has('RetryableError')).toBe(true);
      expect(metrics.get('RetryableError')?.count).toBeGreaterThan(0);
    });
  });

  describe('normalizeError', () => {
    it('should preserve orchestrator errors', async () => {
      const handler = new ErrorHandler();
      const error = new FatalError('Fatal error', 'FATAL');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleOperation(operation)
      ).rejects.toThrow(error);
    });

    it('should convert network errors to RetryableError', async () => {
      const handler = new ErrorHandler({ enableEscalation: false });
      const error = new Error('ECONNRESET: Connection reset');
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.handleOperation(operation);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow(RetryableError);
    });

    it('should convert permission errors to FatalError', async () => {
      const handler = new ErrorHandler();
      const error = new Error('EACCES: Permission denied');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleOperation(operation)
      ).rejects.toThrow(FatalError);
    });
  });

  describe('escalation', () => {
    it('should escalate fatal errors as CRITICAL', async () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        enableEscalation: true,
        onEscalation
      });

      const error = new FatalError('Fatal error', 'FATAL');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleOperation(operation, 'test')
      ).rejects.toThrow();

      expect(onEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          level: EscalationLevel.CRITICAL
        })
      );
    });

    it('should escalate auth errors as CRITICAL', async () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        enableEscalation: true,
        onEscalation
      });

      const error = new LLMAPIError(
        'Auth failed',
        'AUTH_ERROR',
        'anthropic'
      );
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleOperation(operation, 'test')
      ).rejects.toThrow();

      expect(onEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          level: EscalationLevel.CRITICAL
        })
      );
    });

    it('should provide suggested actions', async () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        enableEscalation: true,
        onEscalation
      });

      const error = new LLMAPIError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        'anthropic',
        'claude-3',
        429
      );
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      expect(onEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestedActions: expect.arrayContaining([
            expect.stringContaining('rate limit')
          ])
        })
      );
    });
  });

  describe('recovery strategies', () => {
    it('should attempt recovery for LLM errors', async () => {
      const handler = new ErrorHandler({
        enableRecovery: true,
        enableRetry: false
      });

      const error = new LLMAPIError(
        'Rate limit',
        'RATE_LIMIT',
        'anthropic'
      );
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        handler.handleOperation(operation, 'test')
      ).rejects.toThrow();

      // Recovery attempted but failed (no fallback provider)
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should attempt recovery for resource exhaustion', async () => {
      const handler = new ErrorHandler({
        enableRecovery: true,
        enableRetry: false
      });

      const error = new ResourceExhaustedError(
        'Memory exhausted',
        'MEMORY_EXHAUSTED',
        'memory',
        1024,
        900
      );
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });
  });

  describe('error metrics', () => {
    it('should track error counts by type', async () => {
      const handler = new ErrorHandler();

      const error1 = new RetryableError('Error 1', 'TEST');
      const error2 = new FatalError('Error 2', 'FATAL');

      const op1 = vi.fn().mockRejectedValue(error1);
      const op2 = vi.fn().mockRejectedValue(error2);

      const promise1 = handler.handleOperation(op1);
      await vi.runAllTimersAsync();
      await expect(promise1).rejects.toThrow();

      await expect(handler.handleOperation(op2)).rejects.toThrow();

      const metrics = handler.getErrorMetrics();

      expect(metrics.has('RetryableError')).toBe(true);
      expect(metrics.has('FatalError')).toBe(true);
    });

    it('should reset error metrics', async () => {
      const handler = new ErrorHandler();

      const error = new RetryableError('Error', 'TEST');
      const operation = vi.fn().mockRejectedValue(error);

      const promise = handler.handleOperation(operation);
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow();

      expect(handler.getErrorMetrics().size).toBeGreaterThan(0);

      handler.resetErrorMetrics();
      expect(handler.getErrorMetrics().size).toBe(0);
    });
  });
});
