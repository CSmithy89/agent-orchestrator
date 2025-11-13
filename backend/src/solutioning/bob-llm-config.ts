/**
 * Bob Agent LLM Configuration Loader
 *
 * Reads Bob agent LLM configuration from project config with multi-provider support.
 * Defaults to Claude Haiku 3.5 for cost-effective story decomposition.
 *
 * @module solutioning/bob-llm-config
 * @see .bmad/project-config.yaml - Agent LLM assignments
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { LLMConfig } from '../types/llm.types.js';

/**
 * Project config structure for agent assignments
 */
interface ProjectConfig {
  agent_assignments?: {
    [agentName: string]: {
      model: string;
      provider: string;
      base_url?: string;
      api_key?: string;
      reasoning?: string;
    };
  };
}

/**
 * Default LLM configuration for Bob agent
 *
 * Claude Haiku 3.5 recommended for cost-effective formulaic story decomposition:
 * - Fast response times (<1s for story generation)
 * - Low cost per token (~$0.25/MTok input, ~$1.25/MTok output)
 * - Strong structured output capabilities
 * - Reliable JSON schema adherence
 */
const DEFAULT_BOB_CONFIG: LLMConfig = {
  model: 'claude-haiku-3-5',
  provider: 'anthropic',
  reasoning: 'Claude Haiku 3.5 - cost-effective, fast, reliable for formulaic story decomposition'
};

/**
 * Load Bob agent LLM configuration from project config
 *
 * Reads .bmad/project-config.yaml and extracts agents.bob configuration.
 * Supports multi-provider setup: Anthropic, OpenAI, Zhipu, Google.
 * Falls back to Claude Haiku 3.5 if no configuration found.
 *
 * @returns Promise resolving to LLMConfig for Bob agent
 * @throws Error if project config malformed or YAML parse fails
 *
 * @example
 * ```typescript
 * const config = await loadBobLLMConfig();
 * console.log(config.provider); // "zhipu"
 * console.log(config.model);    // "glm-4-plus"
 * ```
 */
export async function loadBobLLMConfig(): Promise<LLMConfig> {
  // Resolve project config path
  const configPath = path.join(process.cwd(), '.bmad', 'project-config.yaml');

  try {
    // Read and parse YAML config
    const configContent = await fs.readFile(configPath, 'utf-8');
    const projectConfig = yaml.load(configContent) as ProjectConfig;

    // Extract Bob agent configuration
    const bobConfig = projectConfig?.agent_assignments?.bob;

    if (!bobConfig) {
      // No Bob config found - use default
      return DEFAULT_BOB_CONFIG;
    }

    // Validate required fields
    if (!bobConfig.model || !bobConfig.provider) {
      throw new Error(
        `Bob agent configuration incomplete in ${configPath}. ` +
        `Required fields: model, provider. Found: ${JSON.stringify(bobConfig)}`
      );
    }

    // Validate provider is supported
    const supportedProviders = ['anthropic', 'openai', 'zhipu', 'google'];
    if (!supportedProviders.includes(bobConfig.provider.toLowerCase())) {
      throw new Error(
        `Unsupported LLM provider "${bobConfig.provider}" for Bob agent. ` +
        `Supported providers: ${supportedProviders.join(', ')}`
      );
    }

    // Return parsed configuration
    return {
      model: bobConfig.model,
      provider: bobConfig.provider,
      base_url: bobConfig.base_url,
      api_key: bobConfig.api_key,
      reasoning: bobConfig.reasoning
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Project config not found - use default
      return DEFAULT_BOB_CONFIG;
    }

    // YAML parse error or validation error
    if ((error as Error).message.includes('Bob agent configuration')) {
      throw error; // Re-throw validation errors as-is
    }

    throw new Error(`Failed to load Bob LLM configuration: ${(error as Error).message}`);
  }
}

/**
 * Validate LLM model configuration for Bob agent
 *
 * Checks if model is appropriate for story decomposition:
 * - Cost-effective models preferred (Haiku, GPT-4o-mini, GLM-4-Flash)
 * - Balanced models acceptable (Sonnet, GPT-4o, GLM-4-Plus)
 * - Expensive models discouraged (Opus, GPT-4-Turbo) unless explicitly justified
 *
 * @param config LLM configuration to validate
 * @returns Validation result with warnings/recommendations
 *
 * @example
 * ```typescript
 * const result = validateBobLLMConfig({ model: 'gpt-4-turbo', provider: 'openai' });
 * if (result.warnings.length > 0) {
 *   console.warn('Configuration warnings:', result.warnings);
 * }
 * ```
 */
export function validateBobLLMConfig(config: LLMConfig): {
  valid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Define model tiers by provider
  const costEffective: Record<string, string[]> = {
    anthropic: ['claude-haiku-3-5', 'claude-haiku-3'],
    openai: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    zhipu: ['glm-4-flash', 'glm-4-air'],
    google: ['gemini-2.0-flash', 'gemini-1.5-flash']
  };

  const balanced: Record<string, string[]> = {
    anthropic: ['claude-sonnet-4-5', 'claude-sonnet-3-5'],
    openai: ['gpt-4o'],
    zhipu: ['glm-4-plus'],
    google: ['gemini-2.0-pro']
  };

  const expensive: Record<string, string[]> = {
    anthropic: ['claude-opus-3-5', 'claude-opus-3'],
    openai: ['gpt-4-turbo', 'gpt-4'],
    zhipu: [],
    google: []
  };

  const providerModels = {
    cost_effective: costEffective[config.provider.toLowerCase()] || [],
    balanced: balanced[config.provider.toLowerCase()] || [],
    expensive: expensive[config.provider.toLowerCase()] || []
  };

  // Check model tier
  const modelLower = config.model.toLowerCase();

  if (providerModels.expensive.some(m => modelLower.includes(m.toLowerCase()))) {
    warnings.push(
      `Expensive model "${config.model}" selected for Bob agent. ` +
      `Story decomposition is formulaic and doesn't require premium models. ` +
      `Consider cost-effective alternatives: ${providerModels.cost_effective.join(', ')}`
    );
    recommendations.push(
      `Switch to cost-effective model for 10x cost reduction with similar quality`
    );
  } else if (providerModels.balanced.some(m => modelLower.includes(m.toLowerCase()))) {
    recommendations.push(
      `Balanced model "${config.model}" works well. ` +
      `For further cost optimization, consider: ${providerModels.cost_effective.join(', ')}`
    );
  } else if (providerModels.cost_effective.some(m => modelLower.includes(m.toLowerCase()))) {
    // Optimal configuration - no warnings
  } else {
    warnings.push(
      `Unknown model "${config.model}" for provider "${config.provider}". ` +
      `Verify model is valid and supported by provider.`
    );
  }

  // Check for missing API key (relies on env vars)
  if (!config.api_key) {
    const envVars: Record<string, string> = {
      anthropic: 'ANTHROPIC_API_KEY',
      openai: 'OPENAI_API_KEY',
      zhipu: 'ZHIPU_API_KEY',
      google: 'GOOGLE_API_KEY'
    };
    const expectedEnvVar = envVars[config.provider.toLowerCase()];
    if (expectedEnvVar) {
      recommendations.push(
        `No API key specified - ensure ${expectedEnvVar} environment variable is set`
      );
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
    recommendations
  };
}
