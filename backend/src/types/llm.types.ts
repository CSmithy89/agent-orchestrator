/**
 * LLM Type Definitions
 * Defines types for LLM client configuration, options, and provider interfaces
 */

/**
 * LLM configuration for creating a client
 */
export interface LLMConfig {
  /** Model identifier (e.g., "claude-sonnet-4-5", "gpt-4-turbo") */
  model: string;

  /** Provider name */
  provider: string;

  /** Optional base URL for API wrappers (e.g., z.ai) */
  base_url?: string;

  /** Optional API key override (defaults to env var) */
  api_key?: string;

  /** Reasoning for this model selection */
  reasoning?: string;
}

/**
 * Options for synchronous LLM invocation
 */
export interface InvokeOptions {
  /** Temperature for sampling (0-1, default 0.7) */
  temperature?: number;

  /** Maximum response tokens */
  max_tokens?: number;

  /** System message for context */
  system_prompt?: string;

  /** Stop generation at these strings */
  stop_sequences?: string[];
}

/**
 * Options for streaming LLM invocation
 */
export interface StreamOptions {
  /** Temperature for sampling (0-1, default 0.7) */
  temperature?: number;

  /** Maximum response tokens */
  max_tokens?: number;

  /** System message for context */
  system_prompt?: string;
}

/**
 * Error types for LLM operations
 */
export enum LLMErrorType {
  /** Transient errors that can be retried (rate limits, timeouts) */
  TRANSIENT = 'TRANSIENT',

  /** Authentication errors (invalid API key) */
  AUTH = 'AUTH',

  /** Permanent errors (invalid request) */
  PERMANENT = 'PERMANENT',

  /** Configuration errors (invalid model, provider) */
  CONFIG = 'CONFIG'
}

/**
 * Custom error class for LLM operations
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public errorType: LLMErrorType,
    public provider?: string,
    public model?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /** Number of input tokens */
  input_tokens: number;

  /** Number of output tokens */
  output_tokens: number;

  /** Total tokens */
  total_tokens: number;
}

/**
 * LLM request log entry
 */
export interface LLMRequestLog {
  /** Correlation ID for request tracing */
  correlation_id: string;

  /** Request timestamp */
  timestamp: string;

  /** Provider name */
  provider: string;

  /** Model name */
  model: string;

  /** Prompt text (truncated to 500 chars) */
  prompt: string;

  /** Request options */
  options?: InvokeOptions | StreamOptions;
}

/**
 * LLM response log entry
 */
export interface LLMResponseLog {
  /** Correlation ID for request tracing */
  correlation_id: string;

  /** Response timestamp */
  timestamp: string;

  /** Response text (truncated to 500 chars) */
  response: string;

  /** Token usage statistics */
  token_usage?: TokenUsage;

  /** Estimated cost in USD */
  estimated_cost: number;

  /** Request latency in milliseconds */
  latency_ms: number;

  /** Error message if request failed */
  error?: string;
}
