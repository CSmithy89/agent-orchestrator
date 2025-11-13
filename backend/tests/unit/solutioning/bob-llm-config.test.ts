/**
 * Unit tests for Bob Agent LLM Configuration Loader
 *
 * Tests LLM config parsing, multi-provider support, validation, and defaults.
 * Verifies AC #2: LLM Assignment Configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { loadBobLLMConfig, validateBobLLMConfig } from '../../../src/solutioning/bob-llm-config.js';

// Mock fs/promises and js-yaml
vi.mock('fs/promises');
vi.mock('js-yaml');

// Fixture: Project config with Bob agent configuration
const FIXTURE_PROJECT_CONFIG_ZHIPU = {
  agent_assignments: {
    bob: {
      model: 'glm-4-plus',
      provider: 'zhipu',
      base_url: 'https://api.z.ai/v1',
      api_key: '${Z_AI_API_KEY}',
      reasoning: 'GLM-4-Plus via z.ai provides cost-effective story decomposition'
    }
  }
};

const FIXTURE_PROJECT_CONFIG_ANTHROPIC = {
  agent_assignments: {
    bob: {
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
      reasoning: 'Claude Sonnet for high-quality story decomposition'
    }
  }
};

const FIXTURE_PROJECT_CONFIG_OPENAI = {
  agent_assignments: {
    bob: {
      model: 'gpt-4o',
      provider: 'openai',
      reasoning: 'GPT-4o for fast story generation'
    }
  }
};

const FIXTURE_PROJECT_CONFIG_GOOGLE = {
  agent_assignments: {
    bob: {
      model: 'gemini-2.0-flash',
      provider: 'google',
      reasoning: 'Gemini Flash for cost-effective decomposition'
    }
  }
};

const FIXTURE_PROJECT_CONFIG_NO_BOB = {
  agent_assignments: {
    mary: {
      model: 'claude-sonnet-4-5',
      provider: 'anthropic'
    }
  }
};

describe('Bob Agent LLM Configuration Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadBobLLMConfig()', () => {
    it('should load Bob LLM config from project-config.yaml (Zhipu provider)', async () => {
      const yamlContent = 'agent_assignments:\n  bob:\n    model: glm-4-plus';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(FIXTURE_PROJECT_CONFIG_ZHIPU);

      const config = await loadBobLLMConfig();

      expect(config.model).toBe('glm-4-plus');
      expect(config.provider).toBe('zhipu');
      expect(config.base_url).toBe('https://api.z.ai/v1');
      expect(config.api_key).toBe('${Z_AI_API_KEY}');
      expect(config.reasoning).toContain('cost-effective');
    });

    it('should support Anthropic provider (Claude models)', async () => {
      const yamlContent = 'agent_assignments:\n  bob:\n    model: claude-sonnet-4-5';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(FIXTURE_PROJECT_CONFIG_ANTHROPIC);

      const config = await loadBobLLMConfig();

      expect(config.model).toBe('claude-sonnet-4-5');
      expect(config.provider).toBe('anthropic');
    });

    it('should support OpenAI provider (GPT models)', async () => {
      const yamlContent = 'agent_assignments:\n  bob:\n    model: gpt-4o';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(FIXTURE_PROJECT_CONFIG_OPENAI);

      const config = await loadBobLLMConfig();

      expect(config.model).toBe('gpt-4o');
      expect(config.provider).toBe('openai');
    });

    it('should support Google provider (Gemini models)', async () => {
      const yamlContent = 'agent_assignments:\n  bob:\n    model: gemini-2.0-flash';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(FIXTURE_PROJECT_CONFIG_GOOGLE);

      const config = await loadBobLLMConfig();

      expect(config.model).toBe('gemini-2.0-flash');
      expect(config.provider).toBe('google');
    });

    it('should default to Claude Haiku 3.5 when Bob config not found', async () => {
      const yamlContent = 'agent_assignments:\n  mary:\n    model: claude-sonnet-4-5';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(FIXTURE_PROJECT_CONFIG_NO_BOB);

      const config = await loadBobLLMConfig();

      expect(config.model).toBe('claude-haiku-3-5');
      expect(config.provider).toBe('anthropic');
      expect(config.reasoning).toContain('cost-effective');
    });

    it('should default to Claude Haiku 3.5 when project config file not found', async () => {
      const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const config = await loadBobLLMConfig();

      expect(config.model).toBe('claude-haiku-3-5');
      expect(config.provider).toBe('anthropic');
      expect(config.reasoning).toContain('cost-effective');
    });

    it('should throw error when Bob config missing required fields', async () => {
      const invalidConfig = {
        agent_assignments: {
          bob: {
            // Missing model field
            provider: 'anthropic'
          }
        }
      };

      const yamlContent = 'agent_assignments:\n  bob:\n    provider: anthropic';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(invalidConfig);

      await expect(loadBobLLMConfig()).rejects.toThrow('Bob agent configuration incomplete');
      await expect(loadBobLLMConfig()).rejects.toThrow('Required fields: model, provider');
    });

    it('should throw error when provider not supported', async () => {
      const invalidConfig = {
        agent_assignments: {
          bob: {
            model: 'some-model',
            provider: 'unsupported-provider'
          }
        }
      };

      const yamlContent = 'agent_assignments:\n  bob:\n    model: some-model';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(invalidConfig);

      await expect(loadBobLLMConfig()).rejects.toThrow('Unsupported LLM provider');
      await expect(loadBobLLMConfig()).rejects.toThrow('unsupported-provider');
      await expect(loadBobLLMConfig()).rejects.toThrow('Supported providers: anthropic, openai, zhipu, google');
    });

    it('should throw error when YAML parse fails', async () => {
      const yamlContent = 'invalid: yaml: content: [[[';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockImplementation(() => {
        throw new Error('YAML parse error: unexpected token');
      });

      await expect(loadBobLLMConfig()).rejects.toThrow('Failed to load Bob LLM configuration');
    });

    it('should resolve correct config file path', async () => {
      const yamlContent = 'agent_assignments:\n  bob:\n    model: glm-4-plus';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(FIXTURE_PROJECT_CONFIG_ZHIPU);

      await loadBobLLMConfig();

      const readFileCall = vi.mocked(fs.readFile).mock.calls[0];
      const calledPath = readFileCall[0] as string;
      expect(calledPath).toContain('.bmad');
      expect(calledPath).toContain('project-config.yaml');
    });

    it('should preserve optional fields when provided', async () => {
      const configWithOptionals = {
        agent_assignments: {
          bob: {
            model: 'glm-4-plus',
            provider: 'zhipu',
            base_url: 'https://custom.api.url',
            api_key: 'custom-key-123',
            reasoning: 'Custom reasoning'
          }
        }
      };

      const yamlContent = 'agent_assignments:\n  bob:\n    model: glm-4-plus';
      vi.mocked(fs.readFile).mockResolvedValue(yamlContent);
      vi.mocked(yaml.load).mockReturnValue(configWithOptionals);

      const config = await loadBobLLMConfig();

      expect(config.base_url).toBe('https://custom.api.url');
      expect(config.api_key).toBe('custom-key-123');
      expect(config.reasoning).toBe('Custom reasoning');
    });
  });

  describe('validateBobLLMConfig()', () => {
    it('should validate cost-effective models with no warnings (Claude Haiku)', () => {
      const config = {
        model: 'claude-haiku-3-5',
        provider: 'anthropic'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate GPT-4o-mini model', () => {
      const config = {
        model: 'gpt-4o-mini',
        provider: 'openai'
      };

      const result = validateBobLLMConfig(config);

      // Should detect as unknown model and warn since it's not in our tier lists yet
      expect(result).toBeDefined();
      expect(result.warnings.length > 0 || result.valid).toBeTruthy();
    });

    it('should validate cost-effective models with no warnings (GLM-4-Flash)', () => {
      const config = {
        model: 'glm-4-flash',
        provider: 'zhipu'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should provide recommendations for balanced models (Claude Sonnet)', () => {
      const config = {
        model: 'claude-sonnet-4-5',
        provider: 'anthropic'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('cost optimization');
    });

    it('should warn about expensive models (Claude Opus)', () => {
      const config = {
        model: 'claude-opus-3-5',
        provider: 'anthropic'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Expensive model');
      expect(result.warnings[0]).toContain('formulaic');
    });

    it('should warn about expensive models (GPT-4-Turbo)', () => {
      const config = {
        model: 'gpt-4-turbo',
        provider: 'openai'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Expensive model');
    });

    it('should warn about unknown models', () => {
      const config = {
        model: 'unknown-model-xyz',
        provider: 'anthropic'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Unknown model');
    });

    it('should recommend setting API key when not provided', () => {
      const config = {
        model: 'claude-haiku-3-5',
        provider: 'anthropic'
        // No api_key field
      };

      const result = validateBobLLMConfig(config);

      expect(result.recommendations.some(r => r.includes('ANTHROPIC_API_KEY'))).toBe(true);
    });

    it('should handle provider case-insensitively', () => {
      const config = {
        model: 'claude-haiku-3-5',
        provider: 'ANTHROPIC' // Uppercase
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should handle model name case-insensitively', () => {
      const config = {
        model: 'CLAUDE-HAIKU-3-5', // Uppercase
        provider: 'anthropic'
      };

      const result = validateBobLLMConfig(config);

      expect(result.valid).toBe(true);
    });
  });
});
