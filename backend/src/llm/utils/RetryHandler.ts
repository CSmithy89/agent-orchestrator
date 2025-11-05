/**
 * RetryHandler - Exponential backoff retry logic for LLM API calls
 */

import { LLMError, LLMErrorType } from '../../types/llm.types.js';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Initial backoff delay in milliseconds (default: 1000) */
  initialDelay?: number;

  /** Backoff multiplier (default: 2 for exponential) */
  backoffMultiplier?: number;

  /** Logger function for retry attempts */
  logger?: (message: string) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  logger: console.log
};

/**
 * RetryHandler - Implements exponential backoff with error classification
 */
export class RetryHandler {
  private config: Required<RetryConfig>;

  constructor(config?: RetryConfig) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param context Context description for logging
   * @returns Result of the function
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const errorType = this.classifyError(error);

        // Don't retry auth, permanent, or config errors
        if (
          errorType === LLMErrorType.AUTH ||
          errorType === LLMErrorType.PERMANENT ||
          errorType === LLMErrorType.CONFIG
        ) {
          throw this.wrapError(error, errorType);
        }

        // Check if we've exhausted retries
        if (attempt >= this.config.maxRetries) {
          throw new LLMError(
            `Max retries (${this.config.maxRetries}) exceeded for ${context}. Last error: ${lastError.message}`,
            LLMErrorType.TRANSIENT,
            undefined,
            undefined,
            lastError
          );
        }

        // Calculate backoff delay
        const delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);

        this.config.logger(
          `Retry ${attempt + 1}/${this.config.maxRetries} for ${context}, ` +
          `waiting ${delay}ms, error: ${lastError.message}`
        );

        // Wait before retrying
        await this.sleep(delay);
        attempt++;
      }
    }

    // This should never be reached due to the throw above, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Classify error type for retry decision
   * @param error Error to classify
   * @returns Error type
   */
  private classifyError(error: any): LLMErrorType {
    // Already classified LLM errors
    if (error instanceof LLMError) {
      return error.errorType;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.status || error.statusCode || error.response?.status;

    // Auth errors (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      return LLMErrorType.AUTH;
    }

    // Transient errors (429, 503, timeouts, connection errors)
    if (
      statusCode === 429 ||  // Rate limit
      statusCode === 503 ||  // Service unavailable
      errorMessage.includes('timeout') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('network') ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED'
    ) {
      return LLMErrorType.TRANSIENT;
    }

    // Permanent errors (400, 404, validation errors)
    if (
      statusCode === 400 ||
      statusCode === 404 ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('not found')
    ) {
      return LLMErrorType.PERMANENT;
    }

    // Default to transient for unknown errors
    return LLMErrorType.TRANSIENT;
  }

  /**
   * Wrap error in LLMError if not already
   */
  private wrapError(error: any, errorType: LLMErrorType): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    return new LLMError(
      error.message || 'Unknown error',
      errorType,
      undefined,
      undefined,
      error
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
