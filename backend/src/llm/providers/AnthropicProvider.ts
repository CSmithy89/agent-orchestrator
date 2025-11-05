/**
 * AnthropicProvider - Anthropic Claude LLM provider
 * Supports Claude Sonnet and Haiku models with OAuth token priority
 */

import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from '../LLMProvider.interface.js';
import { LLMClient } from '../LLMClient.interface.js';
import { LLMConfig, LLMError, LLMErrorType, InvokeOptions, StreamOptions, TokenUsage } from '../../types/llm.types.js';
import { RetryHandler } from '../utils/RetryHandler.js';

/**
 * Anthropic Provider implementation
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  readonly supportedModels = [
    'claude-sonnet-4-5',
    'claude-sonnet-3-5',
    'claude-haiku',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307',
    'GLM-4.6'  // Via z.ai wrapper
  ];

  /**
   * Create an Anthropic LLM client
   */
  async createClient(config: LLMConfig): Promise<LLMClient> {
    // Determine API key with OAuth token priority
    const apiKey = this.getApiKey(config);

    // Create Anthropic SDK client
    const anthropic = new Anthropic({
      apiKey,
      baseURL: config.base_url  // Support for wrappers like z.ai
    });

    return new AnthropicClient(anthropic, config, new RetryHandler());
  }

  /**
   * Validate if model is supported
   */
  validateModel(model: string): boolean {
    return this.supportedModels.includes(model);
  }

  /**
   * Get API key with OAuth token priority
   * Priority: 1) config.api_key, 2) CLAUDE_CODE_OAUTH_TOKEN, 3) ANTHROPIC_API_KEY
   */
  private getApiKey(config: LLMConfig): string {
    // 1. Check config override
    if (config.api_key) {
      return config.api_key;
    }

    // 2. Check OAuth token (subscription auth - preferred)
    const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    if (oauthToken) {
      return oauthToken;
    }

    // 3. Fallback to API key (pay-per-use)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      return apiKey;
    }

    throw new LLMError(
      'Anthropic API key not found. Set CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY environment variable.',
      LLMErrorType.AUTH,
      'anthropic'
    );
  }
}

/**
 * Anthropic LLM Client implementation
 */
class AnthropicClient implements LLMClient {
  readonly provider = 'anthropic';
  private lastTokenUsage?: TokenUsage;

  constructor(
    private anthropic: Anthropic,
    private config: LLMConfig,
    private retryHandler: RetryHandler
  ) {}

  get model(): string {
    return this.config.model;
  }

  /**
   * Synchronous invocation
   */
  async invoke(prompt: string, options?: InvokeOptions): Promise<string> {
    return this.retryHandler.executeWithRetry(
      async () => {
        try {
          const response = await this.anthropic.messages.create({
            model: this.mapModel(this.config.model),
            max_tokens: options?.max_tokens || 4096,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            system: options?.system_prompt,
            temperature: options?.temperature ?? 0.7,
            stop_sequences: options?.stop_sequences
          });

          // Store token usage
          this.lastTokenUsage = {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
            total_tokens: response.usage.input_tokens + response.usage.output_tokens
          };

          // Extract text from response
          const textContent = response.content.find(c => c.type === 'text');
          if (!textContent || textContent.type !== 'text') {
            throw new LLMError(
              'No text content in Anthropic response',
              LLMErrorType.PERMANENT,
              this.provider,
              this.config.model
            );
          }

          return textContent.text;
        } catch (error: any) {
          throw this.handleError(error);
        }
      },
      `Anthropic API call (${this.config.model})`
    );
  }

  /**
   * Streaming invocation
   */
  async *stream(prompt: string, options?: StreamOptions): AsyncIterableIterator<string> {
    try {
      const stream = await this.anthropic.messages.stream({
        model: this.mapModel(this.config.model),
        max_tokens: options?.max_tokens || 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        system: options?.system_prompt,
        temperature: options?.temperature ?? 0.7
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }

        // Capture usage from message_start event
        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        }

        // Capture final usage from message_delta event
        if (event.type === 'message_delta' && event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      }

      // Store token usage
      this.lastTokenUsage = {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Estimate cost based on token usage
   * Pricing (as of 2024):
   * - Claude Sonnet: $3/M input, $15/M output
   * - Claude Haiku: $0.25/M input, $1.25/M output
   */
  estimateCost(prompt: string, response: string): number {
    if (!this.lastTokenUsage) {
      // Rough estimation: ~4 chars per token
      const estimatedInputTokens = Math.ceil(prompt.length / 4);
      const estimatedOutputTokens = Math.ceil(response.length / 4);

      return this.calculateCost(estimatedInputTokens, estimatedOutputTokens);
    }

    return this.calculateCost(
      this.lastTokenUsage.input_tokens,
      this.lastTokenUsage.output_tokens
    );
  }

  /**
   * Get token usage from last request
   */
  getTokenUsage(): TokenUsage | undefined {
    return this.lastTokenUsage;
  }

  /**
   * Map model names to Anthropic API model identifiers
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'claude-sonnet-4-5': 'claude-sonnet-4-20250514',
      'claude-sonnet-3-5': 'claude-3-5-sonnet-20241022',
      'claude-haiku': 'claude-3-haiku-20240307',
      'GLM-4.6': 'claude-3-5-sonnet-20241022'  // z.ai wrapper uses Anthropic format
    };

    return modelMap[model] || model;
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const model = this.config.model.toLowerCase();

    // Pricing per million tokens
    let inputCostPerM: number;
    let outputCostPerM: number;

    if (model.includes('haiku')) {
      inputCostPerM = 0.25;
      outputCostPerM = 1.25;
    } else {
      // Sonnet pricing (default)
      inputCostPerM = 3;
      outputCostPerM = 15;
    }

    const inputCost = (inputTokens / 1_000_000) * inputCostPerM;
    const outputCost = (outputTokens / 1_000_000) * outputCostPerM;

    return inputCost + outputCost;
  }

  /**
   * Handle and classify errors
   */
  private handleError(error: any): LLMError {
    const statusCode = error.status || error.statusCode;

    if (statusCode === 401 || statusCode === 403) {
      return new LLMError(
        `Anthropic authentication failed: ${error.message}`,
        LLMErrorType.AUTH,
        this.provider,
        this.config.model,
        error
      );
    }

    if (statusCode === 429) {
      return new LLMError(
        `Anthropic rate limit exceeded: ${error.message}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model,
        error
      );
    }

    if (statusCode >= 500) {
      return new LLMError(
        `Anthropic server error: ${error.message}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model,
        error
      );
    }

    return new LLMError(
      `Anthropic API error: ${error.message}`,
      LLMErrorType.PERMANENT,
      this.provider,
      this.config.model,
      error
    );
  }
}
