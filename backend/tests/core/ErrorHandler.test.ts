/**
 * Unit tests for ErrorHandler
 *
 * Timer Management Strategy:
 * - Uses Vitest fake timers to control async operations and prevent test timeouts
 * - Mocks ErrorHandler.sleep() to avoid real delays during retry/recovery flows
 * - Calls vi.runAllTimersAsync() before awaiting promises to flush all pending timers
 *
 * Pattern for async tests:
 * 1. Start operation (returns promise)
 * 2. Flush timers with vi.runAllTimersAsync()
 * 3. Await promise or expect rejection
 *
 * This ensures that all timer-based operations (retries, delays) complete synchronously
 * in tests, preventing race conditions and orphaned timers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler, EscalationLevel } from '../../src/core/ErrorHandler.js';
import {
  RetryableError,
  FatalError,
  LLMAPIError,
  ResourceExhaustedError
} from '../../src/types/errors.types.js';
import { logger } from '../../src/utils/logger.js';

describe('ErrorHandler', () => {
  let unhandledRejectionHandler: (reason: any) => void;

  beforeEach(() => {
    vi.useFakeTimers();

    // Mock the sleep method to prevent orphaned async timers during recovery
    // This allows tests to run synchronously with vi.runAllTimersAsync()
    // @ts-expect-error - accessing protected method for testing
    vi.spyOn(ErrorHandler.prototype, 'sleep').mockResolvedValue(undefined);
    // Mock logger to suppress output and prevent unhandled rejection warnings
    vi.spyOn(logger, 'error').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});

    // Add unhandled rejection handler for expected test errors
    // This handler tracks and suppresses expected errors from ErrorHandler tests
    // while logging unexpected errors to prevent silent failures
    unhandledRejectionHandler = (reason: any) => {
      // Only suppress errors from our ErrorHandler test cases
      const isExpectedError =
        reason instanceof RetryableError ||
        reason instanceof FatalError ||
        reason instanceof LLMAPIError ||
        reason instanceof ResourceExhaustedError;

      if (!isExpectedError) {
        // Log unexpected errors so they're not silently swallowed
        console.error('Unexpected unhandled rejection in test:', reason);
      }
    };
    process.on('unhandledRejection', unhandledRejectionHandler);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // Remove only our specific handler
    process.removeListener('unhandledRejection', unhandledRejectionHandler);
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

      // Start operation, flush timers, then await result
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

      // Start operation, flush timers (including retry delay), then await result
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

      // Start operation, flush timers, then verify rejection without retry
      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
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

      // Start operation, flush all retry timers, then verify escalation occurred
      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      expect(onEscalation).toHaveBeenCalled();
    });

    it('should track error metrics', async () => {
      const handler = new ErrorHandler();
      const error = new RetryableError('Test error', 'TEST_ERROR');
      const operation = vi.fn().mockRejectedValue(error);

      // Start operation, flush timers, then verify metrics were updated
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

      // Start operation, flush timers, then verify rejection
      const promise = handler.handleOperation(operation);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });

    it('should convert network errors to RetryableError', async () => {
      const handler = new ErrorHandler({ enableEscalation: false });
      const error = new Error('ECONNRESET: Connection reset');
      const operation = vi.fn().mockRejectedValue(error);

      // Start operation, flush timers, then verify rejection
      const promise = handler.handleOperation(operation);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow(RetryableError);
    });

    it('should convert permission errors to FatalError', async () => {
      const handler = new ErrorHandler();
      const error = new Error('EACCES: Permission denied');
      const operation = vi.fn().mockRejectedValue(error);

      // Start operation, flush timers, then verify rejection
      const promise = handler.handleOperation(operation);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow(FatalError);
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

      // Start operation, flush timers, verify rejection and escalation
      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      expect(onEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          level: EscalationLevel.CRITICAL
        })
      );
    });

    it('should escalate auth errors as CRITICAL', async () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        // Disable retry to preserve original error type and avoid retryCount affecting escalation level
        enableRetry: false,
        enableEscalation: true,
        onEscalation
      });

      const error = new LLMAPIError(
        'Auth failed',
        'AUTH_ERROR',
        'anthropic'
      );
      const operation = vi.fn().mockRejectedValue(error);

      // Start operation, flush timers, verify CRITICAL escalation for auth errors
      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      expect(onEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          level: EscalationLevel.CRITICAL
        })
      );
    });

    it('should provide suggested actions', async () => {
      const onEscalation = vi.fn();
      const handler = new ErrorHandler({
        // Disable retry to preserve original error type and test suggested actions for LLMAPIError
        enableRetry: false,
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

      // Start operation, flush timers, verify suggested actions are provided
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

      // Start operation, flush timers to allow recovery attempt, verify rejection
      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();

      // Recovery attempted but failed (no fallback provider)
      expect(operation).toHaveBeenCalledTimes(1);
      // Note: sleep may or may not be called depending on recovery strategy
      // The mock ensures any sleep calls don't create orphaned timers
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

      // Start operation, flush timers to allow recovery attempt, verify rejection
      const promise = handler.handleOperation(operation, 'test');
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      // Note: sleep mock ensures any recovery delays don't create orphaned timers
    });
  });

  describe('error metrics', () => {
    it('should track error counts by type', async () => {
      const handler = new ErrorHandler();

      const error1 = new RetryableError('Error 1', 'TEST');
      const error2 = new FatalError('Error 2', 'FATAL');

      const op1 = vi.fn().mockRejectedValue(error1);
      const op2 = vi.fn().mockRejectedValue(error2);

      // Execute first operation, flush timers, verify rejection
      const promise1 = handler.handleOperation(op1);
      await vi.runAllTimersAsync();
      await expect(promise1).rejects.toThrow();

      // Execute second operation, flush timers, verify rejection
      const promise2 = handler.handleOperation(op2);
      await vi.runAllTimersAsync();
      await expect(promise2).rejects.toThrow();

      // Verify both error types were tracked
      const metrics = handler.getErrorMetrics();

      expect(metrics.has('RetryableError')).toBe(true);
      expect(metrics.has('FatalError')).toBe(true);
    });

    it('should reset error metrics', async () => {
      const handler = new ErrorHandler();

      const error = new RetryableError('Error', 'TEST');
      const operation = vi.fn().mockRejectedValue(error);

      // Execute operation and track error, then verify reset
      const promise = handler.handleOperation(operation);
      await vi.runAllTimersAsync();
      await expect(promise).rejects.toThrow();

      expect(handler.getErrorMetrics().size).toBeGreaterThan(0);

      handler.resetErrorMetrics();
      expect(handler.getErrorMetrics().size).toBe(0);
    });
  });
});
