/**
 * ProjectConfig - Configuration management for the orchestrator
 * Loads and validates .bmad/project-config.yaml
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as dotenv from 'dotenv';
import {
  ProjectConfigSchema,
  AgentLLMConfig,
  OnboardingPaths,
  CostManagementConfig,
  ProjectMetadata,
  ConfigValidationError,
  LLMProvider
} from '../types/ProjectConfig.js';

// Load environment variables
dotenv.config();

/**
 * ProjectConfig class - Singleton configuration manager
 */
export class ProjectConfig {
  private constructor(private config: ProjectConfigSchema) {}

  /**
   * Load configuration from YAML file
   * @param configPath Path to project-config.yaml (defaults to .bmad/project-config.yaml)
   * @returns ProjectConfig instance
   */
  static async loadConfig(configPath?: string): Promise<ProjectConfig> {
    const resolvedPath = configPath || path.join(process.cwd(), '.bmad', 'project-config.yaml');

    try {
      // Read the config file
      const fileContents = await fs.readFile(resolvedPath, 'utf-8');

      // Parse YAML
      const rawConfig = yaml.load(fileContents) as any;

      // Expand environment variables
      const expandedConfig = this.expandEnvironmentVariables(rawConfig);

      // Validate configuration
      this.validateConfig(expandedConfig);

      return new ProjectConfig(expandedConfig as ProjectConfigSchema);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ConfigValidationError(
          `Configuration file not found at ${resolvedPath}`,
          'config_file'
        );
      }
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      if (error instanceof yaml.YAMLException) {
        throw new ConfigValidationError(
          `YAML parse error: ${error.message}`,
          'yaml_syntax'
        );
      }
      throw error;
    }
  }

  /**
   * Expand environment variables in configuration
   * Supports ${ENV_VAR} syntax
   */
  private static expandEnvironmentVariables(obj: any): any {
    if (typeof obj === 'string') {
      // Replace ${VAR} with environment variable value
      const envVarRegex = /\$\{([^}]+)\}/g;
      return obj.replace(envVarRegex, (_: string, varName: string) => {
        return process.env[varName] || '';
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.expandEnvironmentVariables(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const expanded: any = {};
      for (const key in obj) {
        expanded[key] = this.expandEnvironmentVariables(obj[key]);
      }
      return expanded;
    }

    return obj;
  }

  /**
   * Validate configuration schema
   * Throws ConfigValidationError with descriptive messages
   */
  private static validateConfig(config: any): void {
    // Validate required top-level fields
    if (!config.project) {
      throw new ConfigValidationError(
        "Required field 'project' is missing",
        'project'
      );
    }

    if (!config.onboarding) {
      throw new ConfigValidationError(
        "Required field 'onboarding' is missing",
        'onboarding'
      );
    }

    if (!config.agent_assignments) {
      throw new ConfigValidationError(
        "Required field 'agent_assignments' is missing",
        'agent_assignments'
      );
    }

    if (!config.cost_management) {
      throw new ConfigValidationError(
        "Required field 'cost_management' is missing",
        'cost_management'
      );
    }

    // Validate project metadata
    this.validateProjectMetadata(config.project);

    // Validate onboarding paths
    this.validateOnboardingPaths(config.onboarding);

    // Validate agent assignments
    this.validateAgentAssignments(config.agent_assignments);

    // Validate cost management
    this.validateCostManagement(config.cost_management);
  }

  /**
   * Validate project metadata section
   */
  private static validateProjectMetadata(project: any): void {
    const requiredFields = ['name', 'description', 'repository'];

    for (const field of requiredFields) {
      if (!project[field]) {
        throw new ConfigValidationError(
          `Required field 'project.${field}' is missing`,
          `project.${field}`
        );
      }
    }
  }

  /**
   * Validate onboarding paths section
   */
  private static validateOnboardingPaths(onboarding: any): void {
    if (!onboarding.tech_stack || !Array.isArray(onboarding.tech_stack)) {
      throw new ConfigValidationError(
        "Required field 'onboarding.tech_stack' must be an array",
        'onboarding.tech_stack',
        'string[]'
      );
    }

    if (!onboarding.coding_standards) {
      throw new ConfigValidationError(
        "Required field 'onboarding.coding_standards' is missing",
        'onboarding.coding_standards'
      );
    }

    if (!onboarding.architecture_patterns) {
      throw new ConfigValidationError(
        "Required field 'onboarding.architecture_patterns' is missing",
        'onboarding.architecture_patterns'
      );
    }
  }

  /**
   * Validate agent assignments section
   */
  private static validateAgentAssignments(assignments: any): void {
    const validProviders: LLMProvider[] = ['anthropic', 'openai', 'zhipu', 'google'];

    for (const agentName in assignments) {
      const agent = assignments[agentName];

      if (!agent.model) {
        throw new ConfigValidationError(
          `Required field 'agent_assignments.${agentName}.model' is missing`,
          `agent_assignments.${agentName}.model`
        );
      }

      if (!agent.provider) {
        throw new ConfigValidationError(
          `Required field 'agent_assignments.${agentName}.provider' is missing`,
          `agent_assignments.${agentName}.provider`
        );
      }

      if (!validProviders.includes(agent.provider)) {
        throw new ConfigValidationError(
          `Invalid agent_assignments.${agentName}.provider: expected one of [anthropic, openai, zhipu, google], got '${agent.provider}'`,
          `agent_assignments.${agentName}.provider`,
          'anthropic, openai, zhipu, google'
        );
      }

      if (!agent.reasoning) {
        throw new ConfigValidationError(
          `Required field 'agent_assignments.${agentName}.reasoning' is missing`,
          `agent_assignments.${agentName}.reasoning`
        );
      }
    }
  }

  /**
   * Validate cost management section
   */
  private static validateCostManagement(costMgmt: any): void {
    if (typeof costMgmt.max_monthly_budget !== 'number') {
      throw new ConfigValidationError(
        "Required field 'cost_management.max_monthly_budget' must be a number",
        'cost_management.max_monthly_budget',
        'number'
      );
    }

    if (typeof costMgmt.alert_threshold !== 'number' ||
        costMgmt.alert_threshold < 0 ||
        costMgmt.alert_threshold > 1) {
      throw new ConfigValidationError(
        "Required field 'cost_management.alert_threshold' must be a number between 0 and 1",
        'cost_management.alert_threshold',
        '0-1'
      );
    }

    if (!costMgmt.fallback_model) {
      throw new ConfigValidationError(
        "Required field 'cost_management.fallback_model' is missing",
        'cost_management.fallback_model'
      );
    }
  }

  /**
   * Get LLM configuration for a specific agent
   * @param agentName Agent name (e.g., "mary", "winston", "amelia")
   * @returns Agent LLM configuration or undefined if not found
   */
  getAgentConfig(agentName: string): AgentLLMConfig | undefined {
    return this.config.agent_assignments[agentName];
  }

  /**
   * Get onboarding documentation paths
   * @returns Onboarding paths configuration
   */
  getOnboardingDocs(): OnboardingPaths {
    return this.config.onboarding;
  }

  /**
   * Get cost management configuration
   * @returns Cost management configuration
   */
  getCostManagement(): CostManagementConfig {
    return this.config.cost_management;
  }

  /**
   * Get budget configuration for CostQualityOptimizer
   * Converts ProjectConfig budget format to optimizer format
   * @returns Budget configuration
   */
  getBudgetConfig(): {
    monthly: number;
    daily?: number;
    weekly?: number;
    alerts?: Array<{ threshold: number; action: 'warn' | 'downgrade' | 'block'; notification?: string }>;
  } {
    const costMgmt = this.config.cost_management;

    // Use enhanced budget config if available, otherwise fall back to legacy format
    if (costMgmt.budget) {
      return {
        monthly: costMgmt.budget.monthly || costMgmt.max_monthly_budget,
        daily: costMgmt.budget.daily,
        weekly: costMgmt.budget.weekly,
        alerts: costMgmt.budget.alerts
      };
    }

    // Legacy format: use max_monthly_budget and alert_threshold
    return {
      monthly: costMgmt.max_monthly_budget,
      alerts: costMgmt.alert_threshold ? [
        { threshold: costMgmt.alert_threshold, action: 'warn' }
      ] : undefined
    };
  }

  /**
   * Get project metadata
   * @returns Project metadata
   */
  getProjectMetadata(): ProjectMetadata {
    return this.config.project;
  }

  /**
   * Get full configuration (for debugging/testing)
   */
  getRawConfig(): ProjectConfigSchema {
    return { ...this.config };
  }
}
