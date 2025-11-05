/**
 * LLMFactory - Factory for creating LLM clients
 * Supports multiple providers: Anthropic, OpenAI, Zhipu, Google
 */

import { LLMProvider } from './LLMProvider.interface.js';
import { LLMClient } from './LLMClient.interface.js';
import { LLMConfig, LLMError, LLMErrorType } from '../types/llm.types.js';
import { LLMLogger } from './utils/LLMLogger.js';

/**
 * LLMFactory - Creates LLM clients for different providers
 */
export class LLMFactory {
  private providers: Map<string, LLMProvider> = new Map();
  private logger: LLMLogger;

  constructor(logDir?: string) {
    this.logger = new LLMLogger(logDir);
    this.initLogger();
  }

  /**
   * Initialize logger asynchronously
   */
  private async initLogger(): Promise<void> {
    await this.logger.init();
  }

  /**
   * Register a provider with the factory
   * @param name Provider name (e.g., "anthropic", "openai")
   * @param provider Provider implementation
   */
  registerProvider(name: string, provider: LLMProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  /**
   * Create an LLM client with the given configuration
   * @param config LLM configuration
   * @returns LLM client instance
   */
  async createClient(config: LLMConfig): Promise<LLMClient> {
    const providerName = config.provider.toLowerCase();

    // Check if provider is registered
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new LLMError(
        `Unknown provider "${config.provider}". Available providers: ${this.getAvailableProviders().join(', ')}`,
        LLMErrorType.CONFIG,
        config.provider,
        config.model
      );
    }

    // Validate model for the provider
    if (!provider.validateModel(config.model)) {
      throw new LLMError(
        this.buildModelValidationError(config.provider, config.model, provider.supportedModels),
        LLMErrorType.CONFIG,
        config.provider,
        config.model
      );
    }

    // Create the client
    try {
      return await provider.createClient(config);
    } catch (error) {
      // Preserve existing LLMError types (AUTH, TRANSIENT, etc.)
      if (error instanceof LLMError) {
        throw error;
      }
      // Only wrap unexpected errors as CONFIG
      throw new LLMError(
        `Failed to create LLM client for provider "${config.provider}": ${(error as Error).message}`,
        LLMErrorType.CONFIG,
        config.provider,
        config.model,
        error as Error
      );
    }
  }

  /**
   * Validate if a model is supported by a provider
   * @param model Model name
   * @param providerName Provider name
   * @returns True if valid, false otherwise
   */
  validateModel(model: string, providerName: string): boolean {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      return false;
    }
    return provider.validateModel(model);
  }

  /**
   * Get list of available providers
   * @returns Array of provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get supported models for a provider
   * @param providerName Provider name
   * @returns Array of supported model names, or undefined if provider not found
   */
  getSupportedModels(providerName: string): string[] | undefined {
    const provider = this.providers.get(providerName.toLowerCase());
    return provider?.supportedModels;
  }

  /**
   * Get the logger instance
   * @returns LLMLogger instance
   */
  getLogger(): LLMLogger {
    return this.logger;
  }

  /**
   * Build a helpful error message for invalid models
   */
  private buildModelValidationError(
    providerName: string,
    model: string,
    supportedModels: string[]
  ): string {
    return [
      `Invalid model "${model}" for provider "${providerName}"`,
      '',
      `Valid models for ${providerName}:`,
      ...supportedModels.map(m => `  - ${m}`),
      '',
      'Please update your configuration in .bmad/project-config.yaml'
    ].join('\n');
  }
}
