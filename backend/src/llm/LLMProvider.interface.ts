/**
 * LLMProvider Interface
 * Defines the contract for LLM provider implementations
 */

import { LLMClient } from './LLMClient.interface.js';
import { LLMConfig } from '../types/llm.types.js';

/**
 * LLM Provider interface
 * Factory uses this to create clients for different providers
 */
export interface LLMProvider {
  /** Provider name */
  readonly name: string;

  /** Supported models for this provider */
  readonly supportedModels: string[];

  /**
   * Create an LLM client with the given configuration
   * @param config LLM configuration
   * @returns LLM client instance
   */
  createClient(config: LLMConfig): Promise<LLMClient>;

  /**
   * Validate if a model is supported by this provider
   * @param model Model identifier
   * @returns True if supported, false otherwise
   */
  validateModel(model: string): boolean;
}
