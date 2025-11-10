/**
 * ClaudeCodeProvider - Claude Code CLI provider with OAuth token support
 * Uses Claude Agent SDK which wraps Claude Code CLI for subscription authentication
 */

import { query, SDKMessage } from '@anthropic-ai/claude-agent-sdk';
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
  async invoke(prompt: string, options?: InvokeOptions): Promise<string> {
    try {
      const messages: any[] = [];

      // Call Claude Agent SDK
      const result = query({
        prompt,
        options: {
          model: this.config.model,
          maxTokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.7,
          // Bypass permissions for programmatic use
          permissionMode: 'bypassPermissions'
        }
      });

      // Collect all messages from async generator
      for await (const message of result) {
        messages.push(message);
      }

      // Extract text content from messages
      const textContent = messages
        .filter(msg => msg.role === 'assistant')
        .map(msg => {
          if (typeof msg.text === 'string') {
            return msg.text;
          }
          return '';
        })
        .join('\n');

      // Update token usage if available from last message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.usage) {
        this.lastTokenUsage = {
          input_tokens: lastMessage.usage.input_tokens || 0,
          output_tokens: lastMessage.usage.output_tokens || 0
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
  async *invokeStream(prompt: string, options?: StreamOptions): AsyncGenerator<string> {
    try {
      const result = query({
        prompt,
        options: {
          model: this.config.model,
          maxTokens: this.config.maxTokens || 4000,
          temperature: this.config.temperature || 0.7,
          permissionMode: 'bypassPermissions'
        }
      });

      for await (const message of result as any) {
        // Yield text content from assistant messages
        if (message.role === 'assistant' && typeof message.text === 'string') {
          yield message.text;
        }

        // Update token usage if available
        if (message.usage) {
          this.lastTokenUsage = {
            input_tokens: message.usage.input_tokens || 0,
            output_tokens: message.usage.output_tokens || 0
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
