/**
 * ProjectConfig Type Definitions
 * Defines the schema for .bmad/project-config.yaml
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 'anthropic' | 'openai' | 'zhipu' | 'google' | 'claude-code';

/**
 * Per-agent LLM configuration
 * Enables cost/quality optimization by assigning optimal models to each agent
 */
export interface AgentLLMConfig {
  /** Model identifier (e.g., "claude-sonnet-4-5", "gpt-4o", "glm-4-plus") */
  model: string;

  /** LLM provider */
  provider: LLMProvider;

  /** Optional base URL for API wrappers like z.ai */
  base_url?: string;

  /** Optional API key override (defaults to env var) */
  api_key?: string;

  /** Reasoning for this model/agent pairing */
  reasoning: string;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  /** Project name */
  name: string;

  /** Project description */
  description: string;

  /** Repository URL or path */
  repository: string;
}

/**
 * Onboarding documentation paths
 */
export interface OnboardingPaths {
  /** Technology stack documentation paths */
  tech_stack: string[];

  /** Coding standards document path */
  coding_standards: string;

  /** Architecture patterns document path */
  architecture_patterns: string;
}

/**
 * Budget alert configuration
 */
export interface BudgetAlertConfig {
  /** Alert threshold (0-1) */
  threshold: number;

  /** Action to take at threshold */
  action: 'warn' | 'downgrade' | 'block';

  /** Optional notification channel */
  notification?: 'console' | 'email' | 'webhook';
}

/**
 * Cost management configuration
 */
export interface CostManagementConfig {
  /** Maximum monthly budget in USD */
  max_monthly_budget: number;

  /** Alert threshold (0-1) for budget warnings (deprecated - use budget.alerts) */
  alert_threshold?: number;

  /** Fallback model when budget exceeded */
  fallback_model: string;

  /** Enhanced budget configuration (optional) */
  budget?: {
    /** Daily budget limit in USD */
    daily?: number;

    /** Weekly budget limit in USD */
    weekly?: number;

    /** Monthly budget limit in USD */
    monthly?: number;

    /** Budget alert thresholds */
    alerts?: BudgetAlertConfig[];
  };
}

/**
 * Complete project configuration schema
 */
export interface ProjectConfigSchema {
  /** Project metadata */
  project: ProjectMetadata;

  /** Onboarding documentation paths */
  onboarding: OnboardingPaths;

  /** Per-agent LLM assignments */
  agent_assignments: Record<string, AgentLLMConfig>;

  /** Cost management settings */
  cost_management: CostManagementConfig;
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public expected?: string
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}
