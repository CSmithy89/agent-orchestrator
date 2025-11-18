/**
 * LLM Module - Entry point for LLM Factory and providers
 */

export { LLMFactory } from './LLMFactory.js';
export type { LLMClient } from './LLMClient.interface.js';
export type { LLMProvider } from './LLMProvider.interface.js';
export { AnthropicProvider } from './providers/AnthropicProvider.js';
export { OpenAIProvider } from './providers/OpenAIProvider.js';
export { ZhipuProvider } from './providers/ZhipuProvider.js';
export { ClaudeCodeProvider } from './providers/ClaudeCodeProvider.js';
export { RetryHandler } from './utils/RetryHandler.js';
export { LLMLogger } from './utils/LLMLogger.js';

export type {
  LLMConfig,
  InvokeOptions,
  StreamOptions,
  TokenUsage,
  LLMRequestLog,
  LLMResponseLog
} from '../types/llm.types.js';

export { LLMError, LLMErrorType } from '../types/llm.types.js';

import { LLMFactory } from './LLMFactory.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { ZhipuProvider } from './providers/ZhipuProvider.js';
import { ClaudeCodeProvider } from './providers/ClaudeCodeProvider.js';

/**
 * Create a fully configured LLM Factory with all providers registered
 * @param logDir Optional log directory path (defaults to 'logs')
 * @returns Configured LLMFactory instance
 */
export function createLLMFactory(logDir?: string): LLMFactory {
  const factory = new LLMFactory(logDir);

  // Register all providers
  factory.registerProvider('anthropic', new AnthropicProvider());
  factory.registerProvider('openai', new OpenAIProvider());
  factory.registerProvider('zhipu', new ZhipuProvider());
  factory.registerProvider('claude-code', new ClaudeCodeProvider());

  return factory;
}
