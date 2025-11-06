/**
 * ErrorHandler - Comprehensive error handling with recovery strategies and escalation
 * Coordinates error classification, retry logic, recovery strategies, and escalation
 */

import {
  BaseOrchestratorError,
  RetryableError,
  FatalError,
  LLMAPIError,
  GitOperationError,
  WorkflowParseError,
  StateCorruptionError,
  ResourceExhaustedError,
  isFatalError
} from '../types/errors.types.js';
import { RetryHandler } from './RetryHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Escalation level for errors
 */
export enum EscalationLevel {
  /** Log warning and continue */
  WARNING = 'warning',
  /** Pause workflow and notify user */
  ESCALATION = 'escalation',
  /** Stop orchestrator, require manual intervention */
  CRITICAL = 'critical'
}

/**
 * Escalation event
 */
export interface EscalationEvent {
  level: EscalationLevel;
  error: BaseOrchestratorError;
  errorType: string;
  attempts: number;
  timestamp: Date;
  suggestedActions: string[];
  context?: Record<string, any>;
}

/**
 * Recovery strategy result
 */
export interface RecoveryResult {
  success: boolean;
  message: string;
  recoveredValue?: any;
}

/**
 * ErrorHandler configuration
 */
export interface ErrorHandlerConfig {
  /** Enable automatic retry (default: true) */
  enableRetry?: boolean;

  /** Enable recovery strategies (default: true) */
  enableRecovery?: boolean;

  /** Enable escalation (default: true) */
  enableEscalation?: boolean;

  /** Callback for escalation events */
  onEscalation?: (event: EscalationEvent) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ErrorHandlerConfig> = {
  enableRetry: true,
  enableRecovery: true,
  enableEscalation: true,
  onEscalation: (event) => {
    logger.error(
      `Escalation [${event.level}]: ${event.error.message}`,
      event.error,
      { attempts: event.attempts, suggestedActions: event.suggestedActions }
    );
  }
};

/**
 * ErrorHandler class
 * Provides comprehensive error handling, recovery, and escalation
 */
export class ErrorHandler {
  private config: Required<ErrorHandlerConfig>;
  private retryHandler: RetryHandler;
  private errorMetrics: Map<string, ErrorMetrics> = new Map();

  constructor(config?: ErrorHandlerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      onRetry: (error, attempt, delay) => {
        logger.warn(
          `Retry attempt ${attempt}/3 after ${delay}ms: ${error.message}`,
          { attempt, delay }
        );
      }
    });
  }

  /**
   * Handle an error with automatic retry, recovery, and escalation
   * @param operation Function that might throw an error
   * @param context Description of operation
   * @returns Result of operation or recovery
   * @throws Error if all recovery attempts fail
   */
  async handleOperation<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      // Try with retry if enabled
      if (this.config.enableRetry) {
        return await this.retryHandler.executeWithRetry(operation, context);
      } else {
        return await operation();
      }
    } catch (error) {
      const orchestratorError = this.normalizeError(error as Error);

      // Track error metrics
      this.trackError(orchestratorError);

      // Try recovery strategies if enabled
      if (this.config.enableRecovery) {
        const recovery = await this.attemptRecovery(orchestratorError, context);
        if (recovery.success && recovery.recoveredValue !== undefined) {
          logger.info(`Recovered from error: ${recovery.message}`, {
            originalError: orchestratorError.message
          });
          return recovery.recoveredValue;
        }
      }

      // Escalate if enabled
      if (this.config.enableEscalation) {
        this.escalate(orchestratorError, context);
      }

      // Re-throw error
      throw orchestratorError;
    }
  }

  /**
   * Normalize error to BaseOrchestratorError
   */
  private normalizeError(error: Error): BaseOrchestratorError {
    if (error instanceof BaseOrchestratorError) {
      return error;
    }

    // Try to classify unknown errors
    const message = error.message.toLowerCase();

    // Check for network/timeout errors
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset')
    ) {
      return new RetryableError(
        error.message,
        'NETWORK_ERROR',
        {},
        0,
        error
      );
    }

    // Check for permission errors
    if (message.includes('permission') || message.includes('eacces')) {
      return new FatalError(
        error.message,
        'PERMISSION_ERROR',
        {},
        0,
        error
      );
    }

    // Default to retryable error
    return new RetryableError(
      error.message,
      'UNKNOWN_ERROR',
      {},
      0,
      error
    );
  }

  /**
   * Attempt recovery strategies based on error type
   */
  private async attemptRecovery(
    error: BaseOrchestratorError,
    context?: string
  ): Promise<RecoveryResult> {
    logger.info(`Attempting recovery for ${error.constructor.name}`, {
      errorCode: error.code,
      context
    });

    // LLM API error recovery
    if (error instanceof LLMAPIError) {
      return this.recoverFromLLMError(error);
    }

    // Git error recovery
    if (error instanceof GitOperationError) {
      return this.recoverFromGitError(error);
    }

    // State corruption recovery
    if (error instanceof StateCorruptionError) {
      return this.recoverFromStateCorruption(error);
    }

    // Resource exhaustion recovery
    if (error instanceof ResourceExhaustedError) {
      return this.recoverFromResourceExhaustion(error);
    }

    // No recovery strategy available
    return {
      success: false,
      message: 'No recovery strategy available'
    };
  }

  /**
   * Recover from LLM API errors
   */
  private async recoverFromLLMError(error: LLMAPIError): Promise<RecoveryResult> {
    // For rate limits, suggest waiting
    if (error.code === 'RATE_LIMIT') {
      return {
        success: false,
        message: 'Rate limit exceeded - retry with backoff'
      };
    }

    // For auth errors, suggest checking credentials
    if (error.code === 'AUTH_ERROR') {
      return {
        success: false,
        message: 'Authentication failed - check API credentials'
      };
    }

    // Could implement provider fallback here
    return {
      success: false,
      message: 'LLM API error - no fallback available'
    };
  }

  /**
   * Recover from git operation errors
   */
  private async recoverFromGitError(error: GitOperationError): Promise<RecoveryResult> {
    logger.warn('Git error recovery not implemented - manual intervention required', {
      command: error.command,
      stderr: error.stderr
    });

    return {
      success: false,
      message: 'Git error requires manual intervention'
    };
  }

  /**
   * Recover from state corruption
   */
  private async recoverFromStateCorruption(
    error: StateCorruptionError
  ): Promise<RecoveryResult> {
    logger.warn('State corruption detected', {
      filePath: error.stateFilePath,
      type: error.corruptionType
    });

    // Could implement state recovery from git history here
    return {
      success: false,
      message: 'State corruption - restore from git history recommended'
    };
  }

  /**
   * Recover from resource exhaustion
   */
  private async recoverFromResourceExhaustion(
    error: ResourceExhaustedError
  ): Promise<RecoveryResult> {
    logger.warn('Resource exhaustion detected', {
      resourceType: error.resourceType,
      currentUsage: error.currentUsage,
      limit: error.limit
    });

    // Wait for resources to become available
    if (error.resourceType === 'memory' || error.resourceType === 'cpu') {
      await this.sleep(5000); // Wait 5 seconds

      return {
        success: false,
        message: 'Waited for resources - retry operation'
      };
    }

    return {
      success: false,
      message: 'Resource exhaustion - manual intervention required'
    };
  }

  /**
   * Escalate error to appropriate level
   */
  private escalate(error: BaseOrchestratorError, context?: string): void {
    const level = this.determineEscalationLevel(error);
    const suggestedActions = this.getSuggestedActions(error);

    const event: EscalationEvent = {
      level,
      error,
      errorType: error.constructor.name,
      attempts: error.retryCount,
      timestamp: new Date(),
      suggestedActions,
      context: context ? { operation: context } : undefined
    };

    // Call escalation callback
    if (this.config.onEscalation) {
      this.config.onEscalation(event);
    }

    // Log escalation
    logger.error(
      `Escalation [${level}]: ${error.message}`,
      error,
      {
        level,
        attempts: error.retryCount,
        suggestedActions
      }
    );
  }

  /**
   * Determine escalation level based on error type
   */
  private determineEscalationLevel(error: BaseOrchestratorError): EscalationLevel {
    // Fatal errors are critical
    if (isFatalError(error)) {
      return EscalationLevel.CRITICAL;
    }

    // Max retries exceeded is escalation
    if (error.retryCount >= 3) {
      return EscalationLevel.ESCALATION;
    }

    // Security errors are critical
    if (
      error.code === 'AUTH_ERROR' ||
      error.code === 'PERMISSION_ERROR'
    ) {
      return EscalationLevel.CRITICAL;
    }

    // Default to warning
    return EscalationLevel.WARNING;
  }

  /**
   * Get suggested actions for error
   */
  private getSuggestedActions(error: BaseOrchestratorError): string[] {
    const actions: string[] = [];

    if (error instanceof LLMAPIError) {
      actions.push('Check API credentials and quota');
      actions.push('Verify network connectivity');
      if (error.statusCode === 429) {
        actions.push('Wait for rate limit to reset');
      }
    } else if (error instanceof GitOperationError) {
      actions.push('Check git credentials');
      actions.push('Verify repository permissions');
      actions.push('Ensure network connectivity to remote');
    } else if (error instanceof WorkflowParseError) {
      actions.push('Fix workflow YAML syntax');
      actions.push('Validate against workflow schema');
      if (error.lineNumber) {
        actions.push(`Check line ${error.lineNumber} in ${error.filePath}`);
      }
    } else if (error instanceof StateCorruptionError) {
      actions.push('Restore state from git history');
      actions.push('Delete corrupted state file and restart');
    } else if (error instanceof ResourceExhaustedError) {
      actions.push(`Free up ${error.resourceType} resources`);
      actions.push('Scale up infrastructure if needed');
    }

    // Add generic actions
    actions.push('Check logs for detailed error information');
    actions.push('Contact support if issue persists');

    return actions;
  }

  /**
   * Track error metrics
   */
  private trackError(error: BaseOrchestratorError): void {
    const errorType = error.constructor.name;

    if (!this.errorMetrics.has(errorType)) {
      this.errorMetrics.set(errorType, {
        count: 0,
        lastOccurrence: new Date(),
        retrySuccessCount: 0,
        recoverySuccessCount: 0
      });
    }

    const metrics = this.errorMetrics.get(errorType)!;
    metrics.count++;
    metrics.lastOccurrence = new Date();
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics(): Map<string, ErrorMetrics> {
    return new Map(this.errorMetrics);
  }

  /**
   * Reset error metrics
   */
  resetErrorMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error metrics for monitoring
 */
export interface ErrorMetrics {
  count: number;
  lastOccurrence: Date;
  retrySuccessCount: number;
  recoverySuccessCount: number;
}

/**
 * Global error handler instance
 */
let globalErrorHandler: ErrorHandler | undefined;

/**
 * Get or create global error handler
 */
export function getErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Set custom global error handler
 */
export function setErrorHandler(handler: ErrorHandler): void {
  globalErrorHandler = handler;
}
