/**
 * OpenAIProvider - OpenAI GPT LLM provider
 * Supports GPT-4, GPT-4 Turbo, and GPT-3.5 models
 */

import OpenAI from 'openai';
import { LLMProvider } from '../LLMProvider.interface.js';
import { LLMClient } from '../LLMClient.interface.js';
import { LLMConfig, LLMError, LLMErrorType, InvokeOptions, StreamOptions, TokenUsage } from '../../types/llm.types.js';
import { RetryHandler } from '../utils/RetryHandler.js';

/**
 * OpenAI Provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  readonly supportedModels = [
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo-instruct',
    'gpt-3.5-turbo',
    'gpt-4o',
    'gpt-4o-mini'
  ];

  /**
   * Create an OpenAI LLM client
   */
  async createClient(config: LLMConfig): Promise<LLMClient> {
    const apiKey = this.getApiKey(config);

    const openai = new OpenAI({
      apiKey,
      baseURL: config.base_url
    });

    return new OpenAIClient(openai, config, new RetryHandler());
  }

  /**
   * Validate if model is supported
   */
  validateModel(model: string): boolean {
    return this.supportedModels.includes(model);
  }

  /**
   * Get API key from config or environment
   */
  private getApiKey(config: LLMConfig): string {
    if (config.api_key) {
      return config.api_key;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      return apiKey;
    }

    throw new LLMError(
      'OpenAI API key not found. Set OPENAI_API_KEY environment variable.',
      LLMErrorType.AUTH,
      'openai'
    );
  }
}

/**
 * OpenAI LLM Client implementation
 */
class OpenAIClient implements LLMClient {
  readonly provider = 'openai';
  private lastTokenUsage?: TokenUsage;

  constructor(
    private openai: OpenAI,
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
          // gpt-3.5-turbo-instruct uses the completions endpoint, not chat
          const isInstruct = this.config.model.includes('instruct');

          if (isInstruct) {
            // Use completions endpoint for instruct models
            const instructPrompt = options?.system_prompt
              ? `${options.system_prompt}\n\n${prompt}`
              : prompt;

            const response = await this.openai.completions.create({
              model: this.config.model,
              prompt: instructPrompt,
              max_tokens: options?.max_tokens,
              temperature: options?.temperature ?? 0.7,
              stop: options?.stop_sequences
            });

            // Store token usage
            if (response.usage) {
              this.lastTokenUsage = {
                input_tokens: response.usage.prompt_tokens,
                output_tokens: response.usage.completion_tokens,
                total_tokens: response.usage.total_tokens
              };
            }

            const content = response.choices[0]?.text;
            if (!content) {
              throw new LLMError(
                'No content in OpenAI response',
                LLMErrorType.PERMANENT,
                this.provider,
                this.config.model
              );
            }

            return content;
          } else {
            // Use chat completions endpoint for chat models
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

            if (options?.system_prompt) {
              messages.push({
                role: 'system',
                content: options.system_prompt
              });
            }

            messages.push({
              role: 'user',
              content: prompt
            });

            const response = await this.openai.chat.completions.create({
              model: this.config.model,
              messages,
              max_tokens: options?.max_tokens,
              temperature: options?.temperature ?? 0.7,
              stop: options?.stop_sequences
            });

            // Store token usage
            if (response.usage) {
              this.lastTokenUsage = {
                input_tokens: response.usage.prompt_tokens,
                output_tokens: response.usage.completion_tokens,
                total_tokens: response.usage.total_tokens
              };
            }

            const content = response.choices[0]?.message?.content;
            if (!content) {
              throw new LLMError(
                'No content in OpenAI response',
                LLMErrorType.PERMANENT,
                this.provider,
                this.config.model
              );
            }

            return content;
          }
        } catch (error: any) {
          throw this.handleError(error);
        }
      },
      `OpenAI API call (${this.config.model})`
    );
  }

  /**
   * Streaming invocation
   */
  async *stream(prompt: string, options?: StreamOptions): AsyncIterableIterator<string> {
    try {
      // gpt-3.5-turbo-instruct uses the completions endpoint, not chat
      const isInstruct = this.config.model.includes('instruct');

      let totalTokens = 0;
      const inputTokens = Math.ceil(prompt.length / 4);

      if (isInstruct) {
        // Use completions endpoint for instruct models
        const instructPrompt = options?.system_prompt
          ? `${options.system_prompt}\n\n${prompt}`
          : prompt;

        const stream = await this.openai.completions.create({
          model: this.config.model,
          prompt: instructPrompt,
          max_tokens: options?.max_tokens,
          temperature: options?.temperature ?? 0.7,
          stream: true
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.text;
          if (content) {
            yield content;
            totalTokens += Math.ceil(content.length / 4);
          }
        }
      } else {
        // Use chat completions endpoint for chat models
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

        if (options?.system_prompt) {
          messages.push({
            role: 'system',
            content: options.system_prompt
          });
        }

        messages.push({
          role: 'user',
          content: prompt
        });

        const stream = await this.openai.chat.completions.create({
          model: this.config.model,
          messages,
          max_tokens: options?.max_tokens,
          temperature: options?.temperature ?? 0.7,
          stream: true
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
            totalTokens += Math.ceil(content.length / 4);
          }
        }
      }

      // Store estimated token usage
      this.lastTokenUsage = {
        input_tokens: inputTokens,
        output_tokens: totalTokens,
        total_tokens: inputTokens + totalTokens
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Estimate cost based on token usage
   * Pricing (as of 2025):
   * - GPT-4 Turbo: $10/M input, $30/M output
   * - GPT-4o: $5/M input, $20/M output
   * - GPT-4o Mini: $0.15/M input, $0.60/M output
   * - GPT-4: $30/M input, $60/M output
   * - GPT-3.5 Turbo: $0.50/M input, $1.50/M output
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
   * Calculate cost based on token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const model = this.config.model.toLowerCase();

    let inputCostPerM: number;
    let outputCostPerM: number;

    // Check specific models first (most specific to least specific)
    if (model.includes('gpt-4o-mini')) {
      inputCostPerM = 0.15;
      outputCostPerM = 0.60;
    } else if (model.includes('gpt-4-turbo')) {
      inputCostPerM = 10;
      outputCostPerM = 30;
    } else if (model.includes('gpt-4o')) {
      inputCostPerM = 5;
      outputCostPerM = 20;
    } else if (model.includes('gpt-4')) {
      inputCostPerM = 30;
      outputCostPerM = 60;
    } else if (model.includes('gpt-3.5')) {
      inputCostPerM = 0.5;
      outputCostPerM = 1.5;
    } else {
      // Default to GPT-4 Turbo pricing
      inputCostPerM = 10;
      outputCostPerM = 30;
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
        `OpenAI authentication failed: ${error.message}`,
        LLMErrorType.AUTH,
        this.provider,
        this.config.model,
        error
      );
    }

    if (statusCode === 429) {
      return new LLMError(
        `OpenAI rate limit exceeded: ${error.message}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model,
        error
      );
    }

    if (statusCode >= 500) {
      return new LLMError(
        `OpenAI server error: ${error.message}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model,
        error
      );
    }

    // Check for network/timeout errors that should be retried
    const message = (error.message || '').toLowerCase();
    if (
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    ) {
      return new LLMError(
        `OpenAI transient network error: ${error.message}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model,
        error
      );
    }

    return new LLMError(
      `OpenAI API error: ${error.message}`,
      LLMErrorType.PERMANENT,
      this.provider,
      this.config.model,
      error
    );
  }
}
