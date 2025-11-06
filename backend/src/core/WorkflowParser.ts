/**
 * WorkflowParser - Parse and validate workflow.yaml files
 * Resolves variables, loads config sources, and validates workflow structure
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  WorkflowConfig,
  Step,
  ValidationResult,
  WorkflowParseError
} from '../types/workflow.types.js';
import { ProjectConfig } from '../config/ProjectConfig.js';

/**
 * WorkflowParser class
 * Handles parsing, validation, and variable resolution for BMAD workflows
 */
export class WorkflowParser {
  private projectRoot: string;
  private configCache: Map<string, any> = new Map();

  /**
   * Create a new WorkflowParser instance
   * @param projectRoot Absolute path to project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Parse workflow.yaml file and return structured WorkflowConfig
   * @param filePath Path to workflow.yaml file
   * @returns Parsed WorkflowConfig object (variables not yet resolved)
   */
  async parseYAML(filePath: string): Promise<WorkflowConfig> {
    try {
      // Read the workflow file
      const fileContents = await fs.readFile(filePath, 'utf-8');

      // Parse YAML
      const rawConfig = yaml.load(fileContents) as any;

      // Validate required fields
      this.validateRequiredFields(rawConfig, filePath);

      // Return structured WorkflowConfig
      return rawConfig as WorkflowConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowParseError(
          `Workflow file not found at ${filePath}`,
          'workflow_file',
          undefined,
          filePath
        );
      }
      if (error instanceof WorkflowParseError) {
        throw error;
      }
      if (error instanceof yaml.YAMLException) {
        throw new WorkflowParseError(
          `YAML parse error: ${error.message}`,
          'yaml_syntax',
          undefined,
          filePath
        );
      }
      throw error;
    }
  }

  /**
   * Validate required fields in workflow config
   * @param config Raw workflow config object
   * @param filePath Path to workflow file (for error messages)
   */
  private validateRequiredFields(config: any, filePath: string): void {
    const requiredFields = ['name', 'instructions', 'config_source'];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!config[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const fieldList = missingFields.map(f => `  - ${f}`).join('\n');
      throw new WorkflowParseError(
        `Required fields missing in ${filePath}:\n${fieldList}\n\nRequired fields: name, instructions, config_source`,
        missingFields[0],
        'string',
        filePath
      );
    }
  }

  /**
   * Resolve all variables in workflow config
   * Supports: {project-root}, {installed_path}, {config_source}:key, date:system-generated
   * @param config Parsed workflow config
   * @param projectConfig ProjectConfig instance for config_source resolution
   * @returns WorkflowConfig with all variables resolved
   */
  async resolveVariables(
    config: WorkflowConfig,
    projectConfig: ProjectConfig
  ): Promise<WorkflowConfig> {
    // First, resolve {project-root} and {installed_path}
    let resolved = this.resolvePathVariables(config);

    // Load and cache config_source file
    if (!this.configCache.has(resolved.config_source)) {
      const configData = await this.loadConfigSource(resolved.config_source);
      this.configCache.set(resolved.config_source, configData);
    }

    const configData = this.configCache.get(resolved.config_source);

    // Resolve {config_source}:key references
    resolved = this.resolveConfigReferences(resolved, configData);

    // Resolve system-generated variables
    resolved = this.resolveSystemVariables(resolved);

    return resolved;
  }

  /**
   * Resolve path variables: {project-root} and {installed_path}
   * @param config Workflow config
   * @returns Config with path variables resolved
   */
  private resolvePathVariables(config: WorkflowConfig): WorkflowConfig {
    // First expand {project-root} in the instructions path
    const rawInstructions = typeof config.instructions === 'string' ? config.instructions : '';
    const expandedInstructions = rawInstructions.includes('{project-root}')
      ? rawInstructions.split('{project-root}').join(this.projectRoot)
      : rawInstructions;

    // Make the expanded path absolute if needed
    const absoluteInstructions = expandedInstructions
      ? path.isAbsolute(expandedInstructions)
        ? expandedInstructions
        : path.join(this.projectRoot, expandedInstructions)
      : '';

    // Now calculate installed_path from the resolved instructions path
    const installedPath = absoluteInstructions
      ? path.dirname(absoluteInstructions)
      : this.projectRoot;

    return this.replaceVariables(config, {
      '{project-root}': this.projectRoot,
      '{installed_path}': installedPath
    });
  }

  /**
   * Resolve config source references: {config_source}:key
   * @param config Workflow config
   * @param configData Loaded config data
   * @returns Config with config references resolved
   */
  private resolveConfigReferences(
    config: WorkflowConfig,
    configData: any
  ): WorkflowConfig {
    const configSourcePattern = /\{config_source\}:([a-zA-Z0-9_\.]+)/g;

    return this.replaceVariablesWithRegex(config, configSourcePattern, (match, key) => {
      const value = this.getNestedValue(configData, key);
      if (value === undefined) {
        throw new WorkflowParseError(
          `Config reference '{config_source}:${key}' not found in config file`,
          key,
          'defined config key'
        );
      }
      return value;
    });
  }

  /**
   * Resolve system-generated variables: date:system-generated
   * @param config Workflow config
   * @returns Config with system variables resolved
   */
  private resolveSystemVariables(config: WorkflowConfig): WorkflowConfig {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return this.replaceVariables(config, {
      'date:system-generated': today
    });
  }

  /**
   * Load config source file
   * @param configPath Path to config file
   * @returns Parsed config data
   */
  private async loadConfigSource(configPath: string): Promise<any> {
    try {
      const fileContents = await fs.readFile(configPath, 'utf-8');
      return yaml.load(fileContents) as any;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowParseError(
          `Config source file not found at ${configPath}`,
          'config_source',
          'valid file path',
          configPath
        );
      }
      throw error;
    }
  }

  /**
   * Helper method to recursively walk config structure and apply string transformations
   * Preserves non-string types (booleans, numbers, objects) during variable resolution
   * @param value Value to transform (can be any type)
   * @param mapper Function to apply to string values
   * @returns Transformed value with original type preserved
   */
  private mapStringValues(value: unknown, mapper: (input: string) => unknown): unknown {
    if (typeof value === 'string') {
      return mapper(value);
    }
    if (Array.isArray(value)) {
      return value.map(item => this.mapStringValues(item, mapper));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, val]) => [
          key,
          this.mapStringValues(val, mapper)
        ])
      );
    }
    return value;
  }

  /**
   * Replace variables in config using simple string replacements
   * Preserves type information for non-string values
   * @param config Workflow config
   * @param replacements Variable replacement map
   * @returns Config with variables replaced
   */
  private replaceVariables(
    config: WorkflowConfig,
    replacements: Record<string, string>
  ): WorkflowConfig {
    const updated = this.mapStringValues(config, value =>
      Object.entries(replacements).reduce(
        (acc, [search, replaceValue]) => acc.split(search).join(replaceValue),
        value
      )
    );
    return updated as WorkflowConfig;
  }

  /**
   * Replace variables in config using regex pattern
   * Preserves type information when entire value is a placeholder
   * @param config Workflow config
   * @param pattern Regex pattern to match
   * @param replacer Replacement function
   * @returns Config with variables replaced
   */
  private replaceVariablesWithRegex(
    config: WorkflowConfig,
    pattern: RegExp,
    replacer: (match: string, ...args: any[]) => string | number | boolean | object
  ): WorkflowConfig {
    const updated = this.mapStringValues(config, value => {
      const matches = [...value.matchAll(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g'))];
      if (matches.length === 0) {
        return value;
      }
      // If the entire string is a single placeholder, preserve the resolved type
      if (matches.length === 1 && matches[0][0] === value) {
        return replacer(matches[0][0], ...matches[0].slice(1));
      }
      // Otherwise, replace within the string and coerce to string
      let result = value;
      for (const match of matches) {
        const resolved = replacer(match[0], ...match.slice(1));
        result = result.replace(match[0], String(resolved));
      }
      return result;
    });
    return updated as WorkflowConfig;
  }

  /**
   * Get nested value from object using dot notation
   * @param obj Object to traverse
   * @param key Dot-notated key (e.g., "project.metadata.owner")
   * @returns Value or undefined if not found
   */
  private getNestedValue(obj: any, key: string): any {
    const keys = key.split('.');
    let current = obj;

    for (const k of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[k];
    }

    return current;
  }

  /**
   * Validate workflow configuration
   * Checks required fields, file paths, and variable resolution
   * @param config Workflow config to validate
   * @returns ValidationResult with errors and warnings
   */
  async validateWorkflow(config: WorkflowConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields are non-empty
    const requiredFields: (keyof WorkflowConfig)[] = [
      'name',
      'description',
      'instructions',
      'config_source'
    ];

    for (const field of requiredFields) {
      if (!config[field]) {
        errors.push(`Required field '${field}' is missing or empty`);
      }
    }

    // Validate file paths exist
    try {
      await fs.access(config.instructions);
    } catch {
      errors.push(`Instructions file not found: ${config.instructions}`);
    }

    if (config.template) {
      try {
        await fs.access(config.template);
      } catch {
        warnings.push(`Template file not found: ${config.template}`);
      }
    }

    if (config.validation) {
      try {
        await fs.access(config.validation);
      } catch {
        warnings.push(`Validation file not found: ${config.validation}`);
      }
    }

    // Check for unresolved variables (look for variable patterns, not JSON braces)
    const configStr = JSON.stringify(config);
    // Match patterns like {project-root}, {installed_path}, {config_source}:key
    const unresolvedVars = configStr.match(/\{(project-root|installed_path|config_source)[^}]*\}/g);
    if (unresolvedVars && unresolvedVars.length > 0) {
      const uniqueVars = [...new Set(unresolvedVars)];
      errors.push(`Unresolved variables found: ${uniqueVars.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Parse instructions markdown file into Step objects
   * Basic implementation - full XML tag parsing enhanced in Story 1.7
   * @param markdownFile Path to instructions markdown file
   * @returns Array of Step objects
   */
  async parseInstructions(markdownFile: string): Promise<Step[]> {
    try {
      const fileContents = await fs.readFile(markdownFile, 'utf-8');
      const steps: Step[] = [];

      // Regex to match <step n="X" goal="..."> tags
      const stepRegex = /<step\s+n="(\d+)"\s+goal="([^"]+)"(?:\s+optional="(true|false)")?(?:\s+if="([^"]+)")?>/g;

      let match: RegExpExecArray | null;
      const matches: Array<{ index: number; match: RegExpExecArray }> = [];

      while ((match = stepRegex.exec(fileContents)) !== null) {
        matches.push({ index: match.index, match });
      }

      // Extract content for each step
      for (let i = 0; i < matches.length; i++) {
        const { index, match } = matches[i];
        const [fullMatch, numberStr, goal, optional, condition] = match;

        // Find content between this step and the next
        const contentStart = index + fullMatch.length;
        const contentEnd = i < matches.length - 1
          ? matches[i + 1].index
          : fileContents.length;

        const content = fileContents.slice(contentStart, contentEnd).trim();

        steps.push({
          number: parseInt(numberStr, 10),
          goal,
          content,
          optional: optional === 'true',
          condition: condition || undefined
        });
      }

      return steps;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowParseError(
          `Instructions file not found at ${markdownFile}`,
          'instructions',
          'valid file path',
          markdownFile
        );
      }
      throw error;
    }
  }
}
