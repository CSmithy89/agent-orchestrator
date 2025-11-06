/**
 * RetryHandler - General-purpose retry logic with exponential backoff
 * Provides comprehensive retry functionality for any async operation
 */

import { isRetryableError, isFatalError } from '../types/errors.types.js';

/**
 * Retry configuration options
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Initial delay in milliseconds before first retry (default: 1000ms) */
  initialDelay?: number;

  /** Maximum delay between retries in milliseconds (default: 32000ms) */
  maxDelay?: number;

  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;

  /** Enable jitter to prevent thundering herd (default: true) */
  enableJitter?: boolean;

  /** Jitter percentage (default: 0.2 = ±20%) */
  jitterPercent?: number;

  /** Custom function to determine if error should be retried */
  shouldRetry?: (error: Error, attempt: number) => boolean;

  /** Callback for each retry attempt */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<Omit<RetryConfig, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 32000, // 32 seconds
  backoffMultiplier: 2,
  enableJitter: true,
  jitterPercent: 0.2 // ±20%
};

/**
 * RetryHandler class
 * Implements exponential backoff with jitter for retry logic
 */
export class RetryHandler {
  private config: Required<Omit<RetryConfig, 'shouldRetry' | 'onRetry'>>;
  private shouldRetry: (error: Error, attempt: number) => boolean;
  private onRetry?: (error: Error, attempt: number, delay: number) => void;

  constructor(config?: RetryConfig) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.shouldRetry = config?.shouldRetry || this.defaultShouldRetry;
    this.onRetry = config?.onRetry;
  }

  /**
   * Execute an async operation with retry logic
   * @param operation Function to execute
   * @param context Description of operation for logging
   * @returns Result of successful operation
   * @throws Error after max retries exceeded
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        // Execute operation
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if this is a fatal error (don't retry)
        if (isFatalError(lastError)) {
          throw lastError;
        }

        // Check if we should retry this error
        if (!this.shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        // Check if we've exhausted retries
        if (attempt >= this.config.maxRetries) {
          throw new Error(
            `Operation failed after ${this.config.maxRetries} retries${context ? ` (${context})` : ''}: ${lastError.message}`,
            { cause: lastError }
          );
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        // Call retry callback if provided
        if (this.onRetry) {
          this.onRetry(lastError, attempt + 1, delay);
        }

        // Wait before retrying
        await this.sleep(delay);

        // Increment attempt counter
        attempt++;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Calculate delay for retry attempt with exponential backoff and jitter
   * @param attempt Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  private calculateDelay(attempt: number): number {
    // Calculate base delay with exponential backoff
    const baseDelay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt),
      this.config.maxDelay
    );

    // Add jitter if enabled
    if (this.config.enableJitter) {
      // Generate random jitter: ±jitterPercent of baseDelay
      const jitterRange = baseDelay * this.config.jitterPercent;
      const jitter = (Math.random() * 2 - 1) * jitterRange; // Random value in [-jitterRange, +jitterRange]
      const delayWithJitter = baseDelay + jitter;

      // Ensure delay is positive
      return Math.max(0, Math.floor(delayWithJitter));
    }

    return Math.floor(baseDelay);
  }

  /**
   * Default retry condition
   * Retries all retryable errors
   */
  private defaultShouldRetry(error: Error, _attempt: number): boolean {
    // Don't retry fatal errors
    if (isFatalError(error)) {
      return false;
    }

    // Retry all retryable errors
    if (isRetryableError(error)) {
      return true;
    }

    // For unknown errors, retry (conservative approach)
    return true;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate expected retry sequence for given configuration
   * Useful for testing and documentation
   * @returns Array of delay values in milliseconds
   */
  getRetrySequence(): number[] {
    const sequence: number[] = [];
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      const baseDelay = Math.min(
        this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt),
        this.config.maxDelay
      );
      sequence.push(baseDelay);
    }
    return sequence;
  }
}

/**
 * Utility function for quick retry without creating a RetryHandler instance
 * @param operation Async operation to retry
 * @param config Optional retry configuration
 * @returns Result of operation
 */
export async function retry<T>(
  operation: () => Promise<T>,
  config?: RetryConfig
): Promise<T> {
  const handler = new RetryHandler(config);
  return handler.executeWithRetry(operation);
}

/**
 * Create a retry handler with specific configuration for LLM operations
 * Uses the Retry-After header if available
 */
export function createLLMRetryHandler(logger?: (msg: string) => void): RetryHandler {
  return new RetryHandler({
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 32000,
    backoffMultiplier: 2,
    enableJitter: true,
    onRetry: (error, attempt, delay) => {
      if (logger) {
        logger(
          `LLM API retry ${attempt}/${3}, waiting ${delay}ms: ${error.message}`
        );
      }
    }
  });
}

/**
 * Create a retry handler for git operations
 * Git operations typically shouldn't be retried, but this can be used for network-related git operations
 */
export function createGitRetryHandler(logger?: (msg: string) => void): RetryHandler {
  return new RetryHandler({
    maxRetries: 2, // Only 2 retries for git operations
    initialDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    enableJitter: false, // No jitter for git operations
    shouldRetry: (error) => {
      // Only retry network-related errors
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('econnrefused')
      );
    },
    onRetry: (error, attempt, delay) => {
      if (logger) {
        logger(
          `Git operation retry ${attempt}/2, waiting ${delay}ms: ${error.message}`
        );
      }
    }
  });
}
