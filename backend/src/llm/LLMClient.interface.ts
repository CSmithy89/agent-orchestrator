/**
 * LLMClient Interface
 * Defines the contract for all LLM provider clients
 */

import { InvokeOptions, StreamOptions, TokenUsage } from '../types/llm.types.js';

/**
 * LLM Client interface
 * All provider implementations must implement this interface
 */
export interface LLMClient {
  /** Provider name (e.g., "anthropic", "openai", "zhipu") */
  readonly provider: string;

  /** Model identifier */
  readonly model: string;

  /**
   * Synchronous invocation - returns complete response
   * @param prompt The prompt to send to the LLM
   * @param options Optional invocation parameters
   * @returns The complete response text
   */
  invoke(prompt: string, options?: InvokeOptions): Promise<string>;

  /**
   * Streaming invocation - returns async iterator of response chunks
   * @param prompt The prompt to send to the LLM
   * @param options Optional streaming parameters
   * @returns Async iterator yielding response chunks
   */
  stream(prompt: string, options?: StreamOptions): AsyncIterableIterator<string>;

  /**
   * Estimate cost for a request/response pair
   * @param prompt The input prompt
   * @param response The LLM response
   * @returns Estimated cost in USD
   */
  estimateCost(prompt: string, response: string): number;

  /**
   * Get token usage for the last request
   * @returns Token usage statistics or undefined if not available
   */
  getTokenUsage(): TokenUsage | undefined;
}
