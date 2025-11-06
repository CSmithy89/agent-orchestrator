/**
 * Template Processing Types
 *
 * Type definitions for the TemplateProcessor system that handles
 * markdown template processing with variable substitution, conditionals,
 * and loops for document generation.
 */

/**
 * Configuration options for the TemplateProcessor
 */
export interface TemplateOptions {
  /**
   * Custom helper functions to register with the template engine
   * Key is the helper name, value is the helper function
   */
  helpers?: Record<string, (...args: any[]) => any>;

  /**
   * When true, throws error on undefined variables
   * When false, replaces undefined variables with empty string
   * @default true
   */
  strictMode?: boolean;

  /**
   * Preserve whitespace in templates during processing
   * @default true
   */
  preserveWhitespace?: boolean;

  /**
   * Base path for resolving relative template paths
   * @default process.cwd()
   */
  basePath?: string;
}

/**
 * Context provided when rendering a template
 */
export interface TemplateContext {
  /**
   * Variables to substitute in the template
   */
  variables: Record<string, any>;

  /**
   * Helper functions available during rendering
   */
  helpers: Record<string, (...args: any[]) => any>;

  /**
   * Path to the template file being processed (optional)
   */
  templatePath?: string;

  /**
   * Metadata about the rendering context
   */
  metadata?: {
    /**
     * Timestamp when rendering started
     */
    renderStartTime?: Date;

    /**
     * Source workflow that triggered rendering
     */
    workflowId?: string;

    /**
     * Additional context data
     */
    [key: string]: any;
  };
}

/**
 * Result of processing a template
 */
export interface ProcessedTemplate {
  /**
   * The rendered content
   */
  content: string;

  /**
   * Variables that were used during rendering
   */
  usedVariables: string[];

  /**
   * Variables that were referenced but undefined
   */
  undefinedVariables: string[];

  /**
   * Metadata about the processing
   */
  metadata: {
    /**
     * Time taken to process (ms)
     */
    processingTime: number;

    /**
     * Template path that was processed
     */
    templatePath?: string;

    /**
     * Whether template was loaded from cache
     */
    fromCache?: boolean;
  };
}

/**
 * Base error for template processing
 */
export class TemplateError extends Error {
  constructor(
    message: string,
    public templatePath?: string,
    public line?: number,
    public context?: string
  ) {
    super(message);
    this.name = 'TemplateError';
    Object.setPrototypeOf(this, TemplateError.prototype);
  }
}

/**
 * Error thrown when template file is not found
 */
export class TemplateNotFoundError extends TemplateError {
  constructor(
    templatePath: string,
    public searchedPaths: string[]
  ) {
    super(
      `Template not found: ${templatePath}\n\nSearched paths:\n${searchedPaths.map(p => `  - ${p}`).join('\n')}`,
      templatePath
    );
    this.name = 'TemplateNotFoundError';
    Object.setPrototypeOf(this, TemplateNotFoundError.prototype);
  }
}

/**
 * Error thrown when template has invalid syntax
 */
export class TemplateSyntaxError extends TemplateError {
  constructor(
    message: string,
    templatePath: string,
    line?: number,
    context?: string
  ) {
    super(
      `Template syntax error in ${templatePath}${line ? ` at line ${line}` : ''}\n\n${message}${context ? `\n\nContext:\n${context}` : ''}`,
      templatePath,
      line,
      context
    );
    this.name = 'TemplateSyntaxError';
    Object.setPrototypeOf(this, TemplateSyntaxError.prototype);
  }
}

/**
 * Error thrown when required variable is undefined
 */
export class VariableUndefinedError extends TemplateError {
  constructor(
    variableName: string,
    templatePath: string,
    availableVariables: string[],
    line?: number,
    context?: string
  ) {
    const suggestions = VariableUndefinedError.generateSuggestions(variableName, availableVariables);

    super(
      `Variable '${variableName}' is undefined in ${templatePath}${line ? ` at line ${line}` : ''}\n\n` +
      `Available variables:\n${availableVariables.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Resolution options:\n` +
      `1. Add '${variableName}' to workflow variables in workflow.yaml\n` +
      `2. Use default value: {{${variableName}|'default_value'}}\n` +
      `3. Make this section conditional: {{#if ${variableName}}}...{{/if}}\n` +
      (suggestions.length > 0 ? `\nDid you mean: ${suggestions.join(', ')}?` : ''),
      templatePath,
      line,
      context
    );
    this.name = 'VariableUndefinedError';
    Object.setPrototypeOf(this, VariableUndefinedError.prototype);
  }

  private static generateSuggestions(variableName: string, availableVariables: string[]): string[] {
    // Simple Levenshtein distance-based suggestions
    const suggestions: string[] = [];
    const maxDistance = 3;

    for (const available of availableVariables) {
      const distance = this.levenshteinDistance(variableName.toLowerCase(), available.toLowerCase());
      if (distance <= maxDistance) {
        suggestions.push(available);
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}

/**
 * Error thrown when template rendering fails
 */
export class TemplateRenderError extends TemplateError {
  constructor(
    message: string,
    templatePath: string,
    public partialOutput?: string,
    line?: number,
    context?: string
  ) {
    super(
      `Template rendering failed in ${templatePath}${line ? ` at line ${line}` : ''}\n\n${message}${context ? `\n\nContext:\n${context}` : ''}${partialOutput ? `\n\nPartial output:\n${partialOutput}` : ''}`,
      templatePath,
      line,
      context
    );
    this.name = 'TemplateRenderError';
    Object.setPrototypeOf(this, TemplateRenderError.prototype);
  }
}

/**
 * Error thrown when file write operation fails
 */
export class FileWriteError extends TemplateError {
  constructor(
    filePath: string,
    public originalError: Error
  ) {
    super(
      `Failed to write file: ${filePath}\n\n${originalError.message}\n\n` +
      `Possible causes:\n` +
      `- Insufficient permissions\n` +
      `- Disk full\n` +
      `- Path doesn't exist\n` +
      `- File is locked by another process`,
      filePath
    );
    this.name = 'FileWriteError';
    Object.setPrototypeOf(this, FileWriteError.prototype);
  }
}

/**
 * Cache entry for parsed templates
 */
export interface TemplateCacheEntry {
  /**
   * Compiled template function
   */
  template: HandlebarsTemplateDelegate;

  /**
   * Path to the template file
   */
  path: string;

  /**
   * File modification time when template was cached
   */
  mtime: Date;

  /**
   * Last access time
   */
  lastAccess: Date;

  /**
   * Access count
   */
  accessCount: number;
}

/**
 * Handlebars template delegate type
 */
export type HandlebarsTemplateDelegate = (context: any, options?: any) => string;
