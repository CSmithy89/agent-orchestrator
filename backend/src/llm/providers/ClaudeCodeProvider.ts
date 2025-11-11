/**
 * ClaudeCodeProvider - Claude Code CLI provider with OAuth token support
 * Uses Claude Agent SDK which wraps Claude Code CLI for subscription authentication
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { LLMProvider } from '../LLMProvider.interface.js';
import { LLMClient } from '../LLMClient.interface.js';
import { LLMConfig, LLMError, LLMErrorType, InvokeOptions, StreamOptions, TokenUsage } from '../../types/llm.types.js';

/**
 * Claude Code Provider implementation using Claude Agent SDK
 * Supports CLAUDE_CODE_OAUTH_TOKEN for subscription-based authentication
 */
export class ClaudeCodeProvider implements LLMProvider {
  readonly name = 'claude-code';
  readonly supportedModels = [
    'claude-sonnet-4-5',
    'claude-sonnet-3-5',
    'claude-haiku',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307'
  ];

  /**
   * Create a Claude Code LLM client
   */
  async createClient(config: LLMConfig): Promise<LLMClient> {
    // Check for OAuth token or API key
    const hasAuth = this.checkAuthentication();
    if (!hasAuth) {
      throw new LLMError(
        'Claude Code authentication not found. Set CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY environment variable.',
        LLMErrorType.AUTH,
        'claude-code'
      );
    }

    return new ClaudeCodeClient(config);
  }

  /**
   * Validate if model is supported
   */
  validateModel(model: string): boolean {
    return this.supportedModels.includes(model);
  }

  /**
   * Check if authentication is available
   */
  private checkAuthentication(): boolean {
    return !!(process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY);
  }
}

/**
 * Claude Code LLM Client implementation
 * Wraps Claude Agent SDK to provide LLMClient interface
 */
class ClaudeCodeClient implements LLMClient {
  readonly provider = 'claude-code';
  private lastTokenUsage?: TokenUsage;

  constructor(private config: LLMConfig) {}

  get model(): string {
    return this.config.model;
  }

  /**
   * Synchronous invocation
   * Wraps Claude Agent SDK's async generator to match LLMClient interface
   */
  async invoke(prompt: string, _options?: InvokeOptions): Promise<string> {
    try {
      const messages: any[] = [];

      // Call Claude Agent SDK
      const result = query({
        prompt,
        options: {
          model: this.config.model,
          // Bypass permissions for programmatic use
          permissionMode: 'bypassPermissions'
          // Note: Claude Agent SDK doesn't support temperature or max_tokens directly
          // These are controlled by Claude Code's configuration
        }
      });

      // Collect all messages from async generator
      for await (const message of result) {
        messages.push(message);
      }

      // Extract text content from assistant messages
      // Claude Agent SDK structure: message.type === 'assistant' → message.message.content[].text
      const textContent = messages
        .filter(msg => msg.type === 'assistant')
        .map(msg => {
          // Extract text from nested message structure
          if (msg.message?.content && Array.isArray(msg.message.content)) {
            return msg.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text || '')
              .join('\n');
          }
          return '';
        })
        .filter(text => text.length > 0)
        .join('\n');

      // Update token usage from the result message
      const resultMessage = messages.find(msg => msg.type === 'result');
      if (resultMessage?.usage) {
        const inputTokens = resultMessage.usage.input_tokens || 0;
        const outputTokens = resultMessage.usage.output_tokens || 0;
        this.lastTokenUsage = {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens
        };
      }

      return textContent;

    } catch (error: any) {
      throw new LLMError(
        `Claude Code invocation failed: ${error.message}`,
        this.mapErrorType(error),
        'claude-code',
        error
      );
    }
  }

  /**
   * Streaming invocation
   * Passes through Claude Agent SDK's streaming messages
   */
  async *stream(prompt: string, _options?: StreamOptions): AsyncIterableIterator<string> {
    try {
      const result = query({
        prompt,
        options: {
          model: this.config.model,
          permissionMode: 'bypassPermissions'
          // Note: Claude Agent SDK doesn't support temperature or max_tokens directly
          // These are controlled by Claude Code's configuration
        }
      });

      for await (const message of result as any) {
        // Extract text from assistant messages
        // Claude Agent SDK structure: message.type === 'assistant' → message.message.content[].text
        if (message.type === 'assistant' && message.message?.content) {
          const textChunks = message.message.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text || '');

          for (const chunk of textChunks) {
            if (chunk) {
              yield chunk;
            }
          }
        }

        // Update token usage from result message
        if (message.type === 'result' && message.usage) {
          const inputTokens = message.usage.input_tokens || 0;
          const outputTokens = message.usage.output_tokens || 0;
          this.lastTokenUsage = {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens
          };
        }
      }

    } catch (error: any) {
      throw new LLMError(
        `Claude Code stream failed: ${error.message}`,
        this.mapErrorType(error),
        'claude-code',
        error
      );
    }
  }

  /**
   * Get token usage from last request
   */
  getTokenUsage(): TokenUsage | undefined {
    return this.lastTokenUsage;
  }

  /**
   * Estimate cost for a request/response pair
   * Claude Sonnet pricing (approximate)
   */
  estimateCost(prompt: string, response: string): number {
    // Rough estimate: ~4 chars per token
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);

    // Claude Sonnet 3.5 pricing (as of 2024): $3/M input, $15/M output
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;

    return inputCost + outputCost;
  }

  /**
   * Map errors to LLM error types
   */
  private mapErrorType(error: any): LLMErrorType {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('auth') || message.includes('api key')) {
      return LLMErrorType.AUTH;
    }
    if (message.includes('rate limit') || message.includes('timeout')) {
      return LLMErrorType.TRANSIENT;
    }
    if (message.includes('invalid') || message.includes('validation')) {
      return LLMErrorType.PERMANENT;
    }

    return LLMErrorType.TRANSIENT; // Default to transient for retry
  }
}
