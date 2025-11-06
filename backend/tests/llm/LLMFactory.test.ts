/**
 * LLMFactory Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LLMFactory, createLLMFactory } from '../../src/llm/index.js';
import { AnthropicProvider } from '../../src/llm/providers/AnthropicProvider.js';
import { OpenAIProvider } from '../../src/llm/providers/OpenAIProvider.js';
import { ZhipuProvider } from '../../src/llm/providers/ZhipuProvider.js';
import { LLMErrorType } from '../../src/types/llm.types.js';

describe('LLMFactory', () => {
  let factory: LLMFactory;

  beforeEach(() => {
    factory = new LLMFactory();
  });

  describe('Provider Registration', () => {
    it('should register providers successfully', () => {
      const anthropicProvider = new AnthropicProvider();
      factory.registerProvider('anthropic', anthropicProvider);

      const providers = factory.getAvailableProviders();
      expect(providers).toContain('anthropic');
    });

    it('should register multiple providers', () => {
      factory.registerProvider('anthropic', new AnthropicProvider());
      factory.registerProvider('openai', new OpenAIProvider());
      factory.registerProvider('zhipu', new ZhipuProvider());

      const providers = factory.getAvailableProviders();
      expect(providers).toContain('anthropic');
      expect(providers).toContain('openai');
      expect(providers).toContain('zhipu');
      expect(providers).toHaveLength(3);
    });

    it('should handle case-insensitive provider names', () => {
      factory.registerProvider('Anthropic', new AnthropicProvider());

      const providers = factory.getAvailableProviders();
      expect(providers).toContain('anthropic');
    });
  });

  describe('Model Validation', () => {
    beforeEach(() => {
      factory.registerProvider('anthropic', new AnthropicProvider());
      factory.registerProvider('openai', new OpenAIProvider());
      factory.registerProvider('zhipu', new ZhipuProvider());
    });

    it('should validate Anthropic models correctly', () => {
      expect(factory.validateModel('claude-sonnet-4-5', 'anthropic')).toBe(true);
      expect(factory.validateModel('claude-haiku', 'anthropic')).toBe(true);
      expect(factory.validateModel('invalid-model', 'anthropic')).toBe(false);
    });

    it('should validate OpenAI models correctly', () => {
      expect(factory.validateModel('gpt-4-turbo', 'openai')).toBe(true);
      expect(factory.validateModel('gpt-4', 'openai')).toBe(true);
      expect(factory.validateModel('gpt-3.5-turbo-instruct', 'openai')).toBe(true);
      expect(factory.validateModel('invalid-model', 'openai')).toBe(false);
    });

    it('should validate Zhipu models correctly', () => {
      expect(factory.validateModel('GLM-4', 'zhipu')).toBe(true);
      expect(factory.validateModel('GLM-4.6', 'zhipu')).toBe(true);
      expect(factory.validateModel('invalid-model', 'zhipu')).toBe(false);
    });

    it('should return false for unregistered provider', () => {
      expect(factory.validateModel('some-model', 'unknown-provider')).toBe(false);
    });
  });

  describe('Get Supported Models', () => {
    beforeEach(() => {
      factory.registerProvider('anthropic', new AnthropicProvider());
      factory.registerProvider('openai', new OpenAIProvider());
    });

    it('should return supported models for Anthropic', () => {
      const models = factory.getSupportedModels('anthropic');
      expect(models).toBeDefined();
      expect(models).toContain('claude-sonnet-4-5');
      expect(models).toContain('claude-haiku');
    });

    it('should return supported models for OpenAI', () => {
      const models = factory.getSupportedModels('openai');
      expect(models).toBeDefined();
      expect(models).toContain('gpt-4-turbo');
      expect(models).toContain('gpt-4');
    });

    it('should return undefined for unregistered provider', () => {
      const models = factory.getSupportedModels('unknown-provider');
      expect(models).toBeUndefined();
    });
  });

  describe('Create Client Validation', () => {
    beforeEach(() => {
      factory.registerProvider('anthropic', new AnthropicProvider());
      factory.registerProvider('openai', new OpenAIProvider());
    });

    it('should throw error for unknown provider', async () => {
      await expect(
        factory.createClient({
          model: 'some-model',
          provider: 'unknown-provider'
        })
      ).rejects.toThrow(/Unknown provider/);
    });

    it('should throw error for invalid model', async () => {
      await expect(
        factory.createClient({
          model: 'invalid-model',
          provider: 'anthropic'
        })
      ).rejects.toThrow(/Invalid model/);
    });

    it('should provide helpful error message with valid models', async () => {
      try {
        await factory.createClient({
          model: 'invalid-model',
          provider: 'anthropic'
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Invalid model');
        expect(error.message).toContain('claude-sonnet-4-5');
        expect(error.message).toContain('claude-haiku');
        expect(error.errorType).toBe(LLMErrorType.CONFIG);
      }
    });
  });

  describe('createLLMFactory helper', () => {
    it('should create factory with all providers registered', () => {
      const factory = createLLMFactory();

      const providers = factory.getAvailableProviders();
      expect(providers).toContain('anthropic');
      expect(providers).toContain('openai');
      expect(providers).toContain('zhipu');
      expect(providers).toHaveLength(3);
    });

    it('should validate models for all registered providers', () => {
      const factory = createLLMFactory();

      expect(factory.validateModel('claude-sonnet-4-5', 'anthropic')).toBe(true);
      expect(factory.validateModel('gpt-4-turbo', 'openai')).toBe(true);
      expect(factory.validateModel('GLM-4', 'zhipu')).toBe(true);
    });
  });

  describe('Logger Access', () => {
    it('should provide access to logger instance', () => {
      const logger = factory.getLogger();
      expect(logger).toBeDefined();
      expect(logger.generateCorrelationId).toBeDefined();
    });
  });
});
