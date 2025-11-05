/**
 * ZhipuProvider - Zhipu GLM LLM provider
 * Native Zhipu API integration for GLM-4 and GLM-4.6 models
 */

import { LLMProvider } from '../LLMProvider.interface.js';
import { LLMClient } from '../LLMClient.interface.js';
import { LLMConfig, LLMError, LLMErrorType, InvokeOptions, StreamOptions, TokenUsage } from '../../types/llm.types.js';
import { RetryHandler } from '../utils/RetryHandler.js';

/**
 * Zhipu Provider implementation
 */
export class ZhipuProvider implements LLMProvider {
  readonly name = 'zhipu';
  readonly supportedModels = [
    'GLM-4',
    'GLM-4.6',
    'glm-4',
    'glm-4-plus',
    'glm-4-flash'
  ];

  /**
   * Create a Zhipu LLM client
   */
  async createClient(config: LLMConfig): Promise<LLMClient> {
    const apiKey = this.getApiKey(config);

    return new ZhipuClient(apiKey, config, new RetryHandler());
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

    const apiKey = process.env.ZHIPU_API_KEY;
    if (apiKey) {
      return apiKey;
    }

    throw new LLMError(
      'Zhipu API key not found. Set ZHIPU_API_KEY environment variable.',
      LLMErrorType.AUTH,
      'zhipu'
    );
  }
}

/**
 * Zhipu API response types
 */
interface ZhipuMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ZhipuResponse {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ZhipuMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ZhipuStreamChunk {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * Zhipu LLM Client implementation
 */
class ZhipuClient implements LLMClient {
  readonly provider = 'zhipu';
  private lastTokenUsage?: TokenUsage;
  private baseUrl: string;

  constructor(
    private apiKey: string,
    private config: LLMConfig,
    private retryHandler: RetryHandler
  ) {
    this.baseUrl = config.base_url || 'https://open.bigmodel.cn/api/paas/v4';
  }

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
          const messages: ZhipuMessage[] = [];

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

          const requestBody = {
            model: this.mapModel(this.config.model),
            messages,
            max_tokens: options?.max_tokens,
            temperature: options?.temperature ?? 0.7,
            stop: options?.stop_sequences
          };

          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw await this.handleHttpError(response);
          }

          const data = await response.json() as ZhipuResponse;

          // Store token usage
          if (data.usage) {
            this.lastTokenUsage = {
              input_tokens: data.usage.prompt_tokens,
              output_tokens: data.usage.completion_tokens,
              total_tokens: data.usage.total_tokens
            };
          }

          const content = data.choices[0]?.message?.content;
          if (!content) {
            throw new LLMError(
              'No content in Zhipu response',
              LLMErrorType.PERMANENT,
              this.provider,
              this.config.model
            );
          }

          return content;
        } catch (error: any) {
          if (error instanceof LLMError) {
            throw error;
          }
          throw this.handleError(error);
        }
      },
      `Zhipu API call (${this.config.model})`
    );
  }

  /**
   * Streaming invocation
   */
  async *stream(prompt: string, options?: StreamOptions): AsyncIterableIterator<string> {
    try {
      const messages: ZhipuMessage[] = [];

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

      const requestBody = {
        model: this.mapModel(this.config.model),
        messages,
        max_tokens: options?.max_tokens,
        temperature: options?.temperature ?? 0.7,
        stream: true
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw await this.handleHttpError(response);
      }

      if (!response.body) {
        throw new LLMError(
          'No response body from Zhipu stream',
          LLMErrorType.PERMANENT,
          this.provider,
          this.config.model
        );
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalOutputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const chunk: ZhipuStreamChunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                yield content;
                totalOutputTokens += Math.ceil(content.length / 4);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      // Store estimated token usage
      const inputTokens = Math.ceil(prompt.length / 4);
      this.lastTokenUsage = {
        input_tokens: inputTokens,
        output_tokens: totalOutputTokens,
        total_tokens: inputTokens + totalOutputTokens
      };
    } catch (error: any) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Estimate cost based on token usage
   * Pricing (estimated - consult Zhipu for accurate pricing):
   * - GLM-4: ~$1/M tokens (combined)
   * - GLM-4.6: ~$2/M tokens (combined)
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
   * Map model names to Zhipu API model identifiers
   */
  private mapModel(model: string): string {
    const modelMap: Record<string, string> = {
      'GLM-4': 'glm-4',
      'GLM-4.6': 'glm-4-plus'
    };

    return modelMap[model] || model.toLowerCase();
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    const model = this.config.model.toUpperCase();

    let costPerM: number;

    if (model.includes('GLM-4.6') || model.includes('PLUS')) {
      costPerM = 2;
    } else {
      // GLM-4 base pricing
      costPerM = 1;
    }

    const totalTokens = inputTokens + outputTokens;
    return (totalTokens / 1_000_000) * costPerM;
  }

  /**
   * Handle HTTP errors from fetch
   */
  private async handleHttpError(response: Response): Promise<LLMError> {
    let errorMessage: string;

    try {
      const errorData = await response.json() as any;
      errorMessage = errorData.error?.message || errorData.message || response.statusText;
    } catch {
      errorMessage = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      return new LLMError(
        `Zhipu authentication failed: ${errorMessage}`,
        LLMErrorType.AUTH,
        this.provider,
        this.config.model
      );
    }

    if (response.status === 429) {
      return new LLMError(
        `Zhipu rate limit exceeded: ${errorMessage}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model
      );
    }

    if (response.status >= 500) {
      return new LLMError(
        `Zhipu server error: ${errorMessage}`,
        LLMErrorType.TRANSIENT,
        this.provider,
        this.config.model
      );
    }

    return new LLMError(
      `Zhipu API error: ${errorMessage}`,
      LLMErrorType.PERMANENT,
      this.provider,
      this.config.model
    );
  }

  /**
   * Handle and classify errors
   */
  private handleError(error: any): LLMError {
    const message = error?.message || 'Unknown error';
    const lower = message.toLowerCase();

    // Check for network/timeout errors that should be retried
    const isTransient =
      lower.includes('timeout') ||
      lower.includes('network') ||
      lower.includes('econnreset') ||
      lower.includes('econnrefused') ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNRESET' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ENOTFOUND';

    return new LLMError(
      `Zhipu API error: ${message}`,
      isTransient ? LLMErrorType.TRANSIENT : LLMErrorType.PERMANENT,
      this.provider,
      this.config.model,
      error
    );
  }
}
