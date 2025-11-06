/**
 * Error type hierarchy for the orchestrator
 * Provides comprehensive error classification and context
 */

/**
 * Base error class for all orchestrator errors
 * All custom errors should extend this class
 */
export class BaseOrchestratorError extends Error {
  /** Error code for programmatic error handling */
  readonly code: string;

  /** Contextual information about the error */
  readonly context: Record<string, any>;

  /** Timestamp when error occurred */
  readonly timestamp: Date;

  /** Number of retry attempts made before this error */
  readonly retryCount: number;

  /** Original error that caused this error (if any) */
  readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    this.code = code;
    this.context = context || {};
    this.timestamp = new Date();
    this.retryCount = retryCount;
    this.cause = cause;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      retryCount: this.retryCount,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }
}

/**
 * Recoverable errors - can be automatically recovered without user intervention
 * Examples: Temporary network glitches, transient API errors
 */
export class RecoverableError extends BaseOrchestratorError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, context, retryCount, cause);
  }
}

/**
 * Retryable errors - should be retried with exponential backoff
 * After max retries, escalate to user
 * Examples: LLM API rate limits, timeouts, server errors
 */
export class RetryableError extends BaseOrchestratorError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, context, retryCount, cause);
  }
}

/**
 * Fatal errors - cannot be recovered, require immediate escalation
 * Examples: Invalid configuration, missing credentials, permissions errors
 */
export class FatalError extends BaseOrchestratorError {
  constructor(
    message: string,
    code: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, context, retryCount, cause);
  }
}

// ============================================================================
// Specific Error Types
// ============================================================================

/**
 * LLM API errors - errors from LLM provider APIs
 */
export class LLMAPIError extends RetryableError {
  readonly provider: string;
  readonly model?: string;
  readonly statusCode?: number;

  constructor(
    message: string,
    code: string,
    provider: string,
    model?: string,
    statusCode?: number,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, { ...context, provider, model, statusCode }, retryCount, cause);
    this.provider = provider;
    this.model = model;
    this.statusCode = statusCode;
  }
}

/**
 * Git operation errors - errors from git commands
 */
export class GitOperationError extends FatalError {
  readonly command: string;
  readonly exitCode?: number;
  readonly stderr?: string;

  constructor(
    message: string,
    code: string,
    command: string,
    exitCode?: number,
    stderr?: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, code, { ...context, command, exitCode, stderr }, 0, cause);
    this.command = command;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

/**
 * Workflow parse errors - errors parsing workflow YAML files
 */
export class WorkflowParseError extends FatalError {
  readonly filePath: string;
  readonly lineNumber?: number;
  readonly field?: string;

  constructor(
    message: string,
    code: string,
    filePath: string,
    lineNumber?: number,
    field?: string,
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, code, { ...context, filePath, lineNumber, field }, 0, cause);
    this.filePath = filePath;
    this.lineNumber = lineNumber;
    this.field = field;
  }

  /**
   * Format error message with line number and resolution steps
   */
  formatDetailedMessage(): string {
    const parts = [
      `WorkflowParseError: ${this.message}`,
      '',
      `File: ${this.filePath}`
    ];

    if (this.lineNumber !== undefined) {
      parts.push(`Line: ${this.lineNumber}`);
    }

    if (this.field) {
      parts.push('', `Field: ${this.field}`);
    }

    parts.push(
      '',
      'Resolution:',
      '1. Check the workflow YAML syntax',
      '2. Ensure all required fields are present',
      '3. Validate against the workflow schema',
      '4. Review the documentation for correct format'
    );

    return parts.join('\n');
  }
}

/**
 * Workflow execution errors - errors during workflow execution
 */
export class WorkflowExecutionError extends RetryableError {
  readonly workflowName: string;
  readonly stepNumber?: number;
  readonly stepName?: string;

  constructor(
    message: string,
    code: string,
    workflowName: string,
    stepNumber?: number,
    stepName?: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, { ...context, workflowName, stepNumber, stepName }, retryCount, cause);
    this.workflowName = workflowName;
    this.stepNumber = stepNumber;
    this.stepName = stepName;
  }
}

/**
 * State corruption errors - errors with state file integrity
 */
export class StateCorruptionError extends FatalError {
  readonly stateFilePath: string;
  readonly corruptionType?: 'syntax' | 'schema' | 'integrity';

  constructor(
    message: string,
    code: string,
    stateFilePath: string,
    corruptionType?: 'syntax' | 'schema' | 'integrity',
    context?: Record<string, any>,
    cause?: Error
  ) {
    super(message, code, { ...context, stateFilePath, corruptionType }, 0, cause);
    this.stateFilePath = stateFilePath;
    this.corruptionType = corruptionType;
  }
}

/**
 * Resource exhaustion errors - system resources depleted
 */
export class ResourceExhaustedError extends RetryableError {
  readonly resourceType: 'memory' | 'disk' | 'cpu' | 'network';
  readonly currentUsage?: number;
  readonly limit?: number;

  constructor(
    message: string,
    code: string,
    resourceType: 'memory' | 'disk' | 'cpu' | 'network',
    currentUsage?: number,
    limit?: number,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, { ...context, resourceType, currentUsage, limit }, retryCount, cause);
    this.resourceType = resourceType;
    this.currentUsage = currentUsage;
    this.limit = limit;
  }
}

/**
 * Agent execution errors - errors from agent invocations
 */
export class AgentExecutionError extends RetryableError {
  readonly agentId: string;
  readonly projectId?: string;

  constructor(
    message: string,
    code: string,
    agentId: string,
    projectId?: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, { ...context, agentId, projectId }, retryCount, cause);
    this.agentId = agentId;
    this.projectId = projectId;
  }
}

/**
 * Project execution errors - errors at project level
 */
export class ProjectExecutionError extends RetryableError {
  readonly projectId: string;

  constructor(
    message: string,
    code: string,
    projectId: string,
    context?: Record<string, any>,
    retryCount: number = 0,
    cause?: Error
  ) {
    super(message, code, { ...context, projectId }, retryCount, cause);
    this.projectId = projectId;
  }
}

// ============================================================================
// Error Classification Utilities
// ============================================================================

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  return error instanceof RetryableError || error instanceof RecoverableError;
}

/**
 * Check if error is fatal (not retryable)
 */
export function isFatalError(error: Error): boolean {
  return error instanceof FatalError;
}

/**
 * Extract error code from error
 */
export function getErrorCode(error: Error): string {
  if (error instanceof BaseOrchestratorError) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Extract context from error
 */
export function getErrorContext(error: Error): Record<string, any> {
  if (error instanceof BaseOrchestratorError) {
    return error.context;
  }
  return {};
}
