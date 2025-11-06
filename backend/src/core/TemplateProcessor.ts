/**
 * TemplateProcessor - Markdown Template Processing System
 *
 * Processes markdown templates with variable substitution, conditionals, and loops
 * using Handlebars templating engine for document generation in workflows.
 *
 * Features:
 * - Variable substitution: {{variable}}, {{nested.var}}, {{var|default}}
 * - Conditional blocks: {{#if condition}}...{{/if}}, {{#unless}}...{{/unless}}
 * - Loops: {{#each collection}}...{{/each}} with metadata access
 * - Custom helpers: uppercase, lowercase, capitalize, date, join, default
 * - File operations: Create new (Write) and update existing (Edit)
 * - Section updates: Update specific sections in existing documents
 * - Template caching: LRU cache with 100 template limit
 * - Error handling: Descriptive errors with resolution guidance
 *
 * @see docs/tech-spec-epic-1.md#TemplateProcessor
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import {
  TemplateOptions,
  TemplateError,
  TemplateNotFoundError,
  TemplateSyntaxError,
  VariableUndefinedError,
  TemplateRenderError,
  FileWriteError,
  TemplateCacheEntry,
  HandlebarsTemplateDelegate,
} from '../types/template.types.js';

/**
 * Default options for TemplateProcessor
 */
const DEFAULT_OPTIONS: Required<TemplateOptions> = {
  helpers: {},
  strictMode: true,
  preserveWhitespace: true,
  basePath: process.cwd(),
};

/**
 * TemplateProcessor class - Main template processing engine
 */
export class TemplateProcessor {
  private options: Required<TemplateOptions>;
  private handlebars: typeof Handlebars;
  private templateCache: Map<string, TemplateCacheEntry>;
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Create a new TemplateProcessor instance
   *
   * @param options - Configuration options for template processing
   *
   * @example
   * ```typescript
   * const processor = new TemplateProcessor({
   *   strictMode: true,
   *   basePath: '/project/templates'
   * });
   * ```
   */
  constructor(options?: TemplateOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.handlebars = Handlebars.create();
    this.templateCache = new Map();

    // Register built-in helpers
    this.registerBuiltInHelpers();

    // Register custom helpers if provided
    if (options?.helpers) {
      Object.entries(options.helpers).forEach(([name, fn]) => {
        this.registerHelper(name, fn);
      });
    }
  }

  /**
   * Load template file from filesystem
   *
   * Reads template file, validates it exists, and caches parsed template
   * for performance. Supports relative and absolute paths.
   *
   * @param templatePath - Path to template file (relative or absolute)
   * @returns Promise resolving to template content
   * @throws {TemplateNotFoundError} If template file doesn't exist
   *
   * @example
   * ```typescript
   * const template = await processor.loadTemplate('templates/prd.md');
   * ```
   */
  async loadTemplate(templatePath: string): Promise<string> {
    const resolvedPath = this.resolveTemplatePath(templatePath);

    // Check if file exists
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      // Try alternative paths
      const searchedPaths = [
        resolvedPath,
        path.join(this.options.basePath, templatePath),
        path.join(process.cwd(), templatePath),
      ];

      throw new TemplateNotFoundError(templatePath, searchedPaths);
    }

    // Read template file
    try {
      const content = await fs.readFile(resolvedPath, 'utf8');

      // Validate template syntax
      this.validateTemplate(content);

      // Cache the template
      await this.cacheTemplate(resolvedPath, content);

      return content;
    } catch (error) {
      if (error instanceof TemplateError) {
        throw error;
      }
      throw new TemplateError(
        `Failed to read template: ${(error as Error).message}`,
        resolvedPath
      );
    }
  }

  /**
   * Process template with variables
   *
   * Replaces {{variables}}, evaluates conditionals, and processes loops.
   * Returns processed content with metadata about rendering.
   *
   * @param template - Template content with {{placeholders}}
   * @param vars - Variables to substitute in template
   * @returns Processed content as string
   * @throws {TemplateRenderError} If rendering fails
   * @throws {VariableUndefinedError} If required variable is undefined (strict mode)
   *
   * @example
   * ```typescript
   * const result = processor.processTemplate(
   *   '# {{title}}\n\n{{#each items}}* {{this}}\n{{/each}}',
   *   { title: 'My Doc', items: ['a', 'b'] }
   * );
   * ```
   */
  processTemplate(template: string, vars: Record<string, any>): string {
    try {
      // First, validate template syntax
      this.validateTemplate(template);

      // Track used and undefined variables
      const usedVariables = new Set<string>();
      const undefinedVariables = new Set<string>();

      // Create a proxy to track variable access
      const trackedVars = this.createVariableTracker(vars, usedVariables, undefinedVariables);

      // Compile template (or use cached)
      const compiledTemplate = this.handlebars.compile(template, {
        noEscape: true, // Don't HTML-escape (we're generating markdown)
        strict: this.options.strictMode,
      });

      // Render template
      const content = compiledTemplate(trackedVars);

      // Check for undefined variables in strict mode
      if (this.options.strictMode && undefinedVariables.size > 0) {
        const firstUndefined = Array.from(undefinedVariables)[0];
        throw new VariableUndefinedError(
          firstUndefined,
          'template',
          Object.keys(vars),
          undefined,
          this.extractContextAroundVariable(template, firstUndefined)
        );
      }

      return content;
    } catch (error) {
      if (error instanceof TemplateError) {
        throw error;
      }

      // Check if it's a Handlebars parse/syntax error
      const errorMessage = (error as Error).message;

      // Check for undefined variable errors
      if (errorMessage.includes('not defined') || errorMessage.includes('is undefined')) {
        const variableMatch = errorMessage.match(/"([^"]+)"/);
        const variableName = (variableMatch && variableMatch[1]) ? variableMatch[1] : 'unknown';

        throw new VariableUndefinedError(
          variableName,
          'template',
          Object.keys(vars),
          undefined,
          this.extractContextAroundVariable(template, variableName)
        );
      }

      // Check for syntax errors
      if (errorMessage.includes('Parse error') || errorMessage.includes('Expecting')) {
        const lineMatch = errorMessage.match(/line (\d+)/);
        const line = (lineMatch && lineMatch[1]) ? parseInt(lineMatch[1], 10) : undefined;

        throw new TemplateSyntaxError(
          errorMessage,
          'template',
          line
        );
      }

      // Generic render error
      const lineMatch = errorMessage.match(/line (\d+)/);
      const line = (lineMatch && lineMatch[1]) ? parseInt(lineMatch[1], 10) : undefined;

      throw new TemplateRenderError(
        `Template rendering failed: ${errorMessage}`,
        'template',
        undefined,
        line
      );
    }
  }

  /**
   * Render template from file
   *
   * Convenience method that loads template and processes it in one call.
   * Uses template caching for performance.
   *
   * @param templatePath - Path to template file
   * @param vars - Variables to substitute in template
   * @returns Promise resolving to processed content
   *
   * @example
   * ```typescript
   * const result = await processor.renderTemplate(
   *   'templates/prd.md',
   *   { project_name: 'MyApp', author: 'John' }
   * );
   * ```
   */
  async renderTemplate(
    templatePath: string,
    vars: Record<string, any>
  ): Promise<string> {
    const resolvedPath = this.resolveTemplatePath(templatePath);

    // Check cache
    const cached = await this.getFromCache(resolvedPath);
    if (cached) {
      // Use cached compiled template
      try {
        return cached.template(vars);
      } catch (error) {
        throw new TemplateRenderError(
          `Rendering failed: ${(error as Error).message}`,
          resolvedPath
        );
      }
    }

    // Load and process template
    const template = await this.loadTemplate(resolvedPath);
    const result = this.processTemplate(template, vars);

    // Cache compiled template
    await this.cacheTemplate(resolvedPath, template);

    return result;
  }

  /**
   * Write output to file
   *
   * Creates new file or updates existing file with direct write operation.
   * Creates parent directories if they don't exist.
   *
   * @param content - Content to write to file
   * @param outputPath - Path to output file
   * @throws {FileWriteError} If write operation fails
   *
   * @example
   * ```typescript
   * await processor.writeOutput(renderedContent, 'docs/prd.md');
   * ```
   */
  async writeOutput(content: string, outputPath: string): Promise<void> {
    const resolvedPath = path.resolve(outputPath);

    try {
      // Check if file exists
      const fileExists = await fs.access(resolvedPath)
        .then(() => true)
        .catch(() => false);

      if (!fileExists) {
        // Create parent directories if needed
        const dir = path.dirname(resolvedPath);
        await fs.mkdir(dir, { recursive: true });

        // First time: Use Write to create file
        await fs.writeFile(resolvedPath, content, 'utf8');
        console.log(`✅ Created: ${outputPath}`);
      } else {
        // Subsequent: Update existing file
        // For now, replace entire content - updateSection() for targeted updates
        await fs.writeFile(resolvedPath, content, 'utf8');
        console.log(`✅ Updated: ${outputPath}`);
      }
    } catch (error) {
      throw new FileWriteError(resolvedPath, error as Error);
    }
  }

  /**
   * Update specific section in existing file
   *
   * Replaces content of a specific section identified by markdown heading.
   * Preserves all other content in the file.
   *
   * @param filePath - Path to file to update
   * @param sectionName - Name of section to update (without ## prefix)
   * @param newContent - New content for the section
   * @throws {TemplateError} If section not found
   * @throws {FileWriteError} If file operation fails
   *
   * @example
   * ```typescript
   * await processor.updateSection(
   *   'docs/prd.md',
   *   'Requirements',
   *   '1. User authentication\n2. Data export'
   * );
   * ```
   */
  async updateSection(
    filePath: string,
    sectionName: string,
    newContent: string
  ): Promise<void> {
    const resolvedPath = path.resolve(filePath);

    try {
      // Read existing file
      const existingContent = await fs.readFile(resolvedPath, 'utf8');

      // Find section boundaries (## Section ... next ## or end of file)
      const sectionRegex = new RegExp(
        `(##\\s+${this.escapeRegex(sectionName)}\\s*\\n)([\\s\\S]*?)(?=\\n##\\s+|$)`,
        'i'
      );

      const match = existingContent.match(sectionRegex);

      if (!match || !match[0]) {
        throw new TemplateError(
          `Section "${sectionName}" not found in ${filePath}\n\n` +
          `Available sections:\n${this.extractSectionNames(existingContent).map(s => `  - ${s}`).join('\n')}`,
          resolvedPath
        );
      }

      // Replace section content
      const oldSection = match[0];
      const newSection = `## ${sectionName}\n\n${newContent}\n`;

      const updatedContent = existingContent.replace(oldSection, newSection);

      // Write updated content
      await fs.writeFile(resolvedPath, updatedContent, 'utf8');
      console.log(`✅ Updated section "${sectionName}" in: ${filePath}`);
    } catch (error) {
      if (error instanceof TemplateError) {
        throw error;
      }
      throw new FileWriteError(resolvedPath, error as Error);
    }
  }

  /**
   * Register custom helper function
   *
   * Adds a custom helper that can be used in templates.
   * Helpers are functions that transform or generate content.
   *
   * @param name - Name of helper (used in templates as {{name}})
   * @param fn - Helper function
   *
   * @example
   * ```typescript
   * processor.registerHelper('formatCurrency', (amount: number) => {
   *   return `$${amount.toFixed(2)}`;
   * });
   *
   * // In template: {{formatCurrency price}}
   * ```
   */
  registerHelper(name: string, fn: (...args: any[]) => any): void {
    this.handlebars.registerHelper(name, fn as any);
  }

  /**
   * Validate template syntax
   *
   * Checks for common template syntax errors before processing.
   * Throws descriptive errors with line numbers and context.
   *
   * @param template - Template content to validate
   * @throws {TemplateSyntaxError} If syntax is invalid
   */
  private validateTemplate(template: string): void {
    // Check for unclosed tags
    const openIf = (template.match(/{{#if/g) || []).length;
    const closeIf = (template.match(/{{\/if}}/g) || []).length;
    if (openIf !== closeIf) {
      throw new TemplateSyntaxError(
        `Unclosed {{#if}} tag (found ${openIf} opening, ${closeIf} closing)`,
        'template'
      );
    }

    const openEach = (template.match(/{{#each/g) || []).length;
    const closeEach = (template.match(/{{\/each}}/g) || []).length;
    if (openEach !== closeEach) {
      throw new TemplateSyntaxError(
        `Unclosed {{#each}} tag (found ${openEach} opening, ${closeEach} closing)`,
        'template'
      );
    }

    // Check for malformed variable syntax
    const malformedVars = template.match(/{{[^}]*$/gm);
    if (malformedVars) {
      throw new TemplateSyntaxError(
        `Malformed variable syntax: missing closing }}`,
        'template'
      );
    }

    // Check for empty conditions
    const emptyIf = template.match(/{{#if\s*}}/);
    if (emptyIf) {
      throw new TemplateSyntaxError(
        `Empty {{#if}} condition - must provide a variable or expression`,
        'template'
      );
    }

    const emptyEach = template.match(/{{#each\s*}}/);
    if (emptyEach) {
      throw new TemplateSyntaxError(
        `Empty {{#each}} - must provide a collection to iterate`,
        'template'
      );
    }

    // Try to compile template to catch Handlebars errors
    try {
      this.handlebars.compile(template);
    } catch (error) {
      throw new TemplateSyntaxError(
        (error as Error).message,
        'template'
      );
    }
  }

  /**
   * Resolve template path
   *
   * Converts relative paths to absolute paths using basePath option.
   *
   * @param templatePath - Template path (relative or absolute)
   * @returns Absolute path to template
   */
  private resolveTemplatePath(templatePath: string): string {
    if (path.isAbsolute(templatePath)) {
      return templatePath;
    }

    return path.resolve(this.options.basePath, templatePath);
  }

  /**
   * Register built-in helper functions
   *
   * Registers standard helpers for string manipulation, date formatting,
   * array operations, and comparisons.
   */
  private registerBuiltInHelpers(): void {
    // String transformations
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    });

    // Date formatting
    this.handlebars.registerHelper('date', function(this: any, format?: any) {
      const now = new Date();

      // If format is Handlebars options object, no format was provided
      if (typeof format === 'object' && format.hash !== undefined) {
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
      }

      // If format is a string, use it
      if (typeof format === 'string') {
        return format
          .replace('YYYY', now.getFullYear().toString())
          .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
          .replace('DD', String(now.getDate()).padStart(2, '0'))
          .replace('HH', String(now.getHours()).padStart(2, '0'))
          .replace('mm', String(now.getMinutes()).padStart(2, '0'))
          .replace('ss', String(now.getSeconds()).padStart(2, '0'));
      }

      // Default format
      return now.toISOString().split('T')[0];
    });

    // Array operations
    this.handlebars.registerHelper('join', (arr: any[], separator: string = ', ') => {
      return Array.isArray(arr) ? arr.join(separator) : '';
    });

    // Default value helper
    this.handlebars.registerHelper('default', function(this: any, value: any, defaultValue: any) {
      return value != null ? value : defaultValue;
    });

    // Comparison helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    this.handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    this.handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    this.handlebars.registerHelper('gte', (a: any, b: any) => a >= b);

    // Logical helpers
    this.handlebars.registerHelper('and', (...args: any[]) => {
      // Last argument is Handlebars options object, exclude it
      const values = args.slice(0, -1);
      return values.every(Boolean);
    });

    this.handlebars.registerHelper('or', (...args: any[]) => {
      const values = args.slice(0, -1);
      return values.some(Boolean);
    });

    this.handlebars.registerHelper('not', (value: any) => !value);
  }

  /**
   * Create variable access tracker
   *
   * Wraps variables object in Proxy to track which variables are accessed
   * and which are undefined during rendering.
   */
  private createVariableTracker(
    vars: Record<string, any>,
    usedVariables: Set<string>,
    undefinedVariables: Set<string>
  ): Record<string, any> {
    return new Proxy(vars, {
      get(target, prop: string) {
        if (typeof prop === 'string' && !prop.startsWith('_')) {
          usedVariables.add(prop);

          if (!(prop in target)) {
            undefinedVariables.add(prop);
          }
        }
        return target[prop];
      },
    });
  }

  /**
   * Extract context around variable reference
   *
   * Returns 3 lines of context around variable for error messages.
   */
  private extractContextAroundVariable(template: string, variableName: string): string {
    const lines = template.split('\n');
    const variablePattern = new RegExp(`{{.*${this.escapeRegex(variableName)}.*}}`);

    for (let i = 0; i < lines.length; i++) {
      if (variablePattern.test(lines[i])) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 2);
        const context = lines.slice(start, end);

        return context
          .map((line, idx) => `${start + idx + 1}: ${line}`)
          .join('\n');
      }
    }

    return '';
  }

  /**
   * Extract section names from markdown content
   */
  private extractSectionNames(content: string): string[] {
    const sectionRegex = /^##\s+(.+)$/gm;
    const sections: string[] = [];
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      if (match[1]) {
        sections.push(match[1].trim());
      }
    }

    return sections;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get template from cache
   *
   * Checks if cached template is still valid (file not modified).
   * Updates access time and count for LRU eviction.
   */
  private async getFromCache(templatePath: string): Promise<TemplateCacheEntry | null> {
    const cached = this.templateCache.get(templatePath);
    if (!cached) {
      return null;
    }

    // Check if file has been modified since caching
    try {
      const stats = await fs.stat(templatePath);
      if (stats.mtime.getTime() !== cached.mtime.getTime()) {
        // File modified, invalidate cache
        this.templateCache.delete(templatePath);
        return null;
      }

      // Update access metadata
      cached.lastAccess = new Date();
      cached.accessCount++;

      return cached;
    } catch (error) {
      // File doesn't exist, remove from cache
      this.templateCache.delete(templatePath);
      return null;
    }
  }

  /**
   * Cache compiled template
   *
   * Implements LRU cache with MAX_CACHE_SIZE limit.
   * Evicts least recently used template when cache is full.
   */
  private async cacheTemplate(templatePath: string, templateContent: string): Promise<void> {
    // Compile template
    const compiled = this.handlebars.compile(templateContent, {
      noEscape: true,
      strict: this.options.strictMode,
    });

    // Get file stats for modification time
    const stats = await fs.stat(templatePath);

    // Create cache entry
    const entry: TemplateCacheEntry = {
      template: compiled as HandlebarsTemplateDelegate,
      path: templatePath,
      mtime: stats.mtime,
      lastAccess: new Date(),
      accessCount: 1,
    };

    // Evict LRU if cache is full
    if (this.templateCache.size >= this.MAX_CACHE_SIZE) {
      this.evictLRU();
    }

    this.templateCache.set(templatePath, entry);
  }

  /**
   * Evict least recently used template from cache
   */
  private evictLRU(): void {
    let oldestPath: string | null = null;
    let oldestTime: Date | null = null;

    for (const [path, entry] of this.templateCache.entries()) {
      if (!oldestTime || entry.lastAccess < oldestTime) {
        oldestPath = path;
        oldestTime = entry.lastAccess;
      }
    }

    if (oldestPath) {
      this.templateCache.delete(oldestPath);
    }
  }

  /**
   * Clear template cache
   *
   * Removes all cached templates. Useful for testing or when
   * templates have been modified externally.
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get cache statistics
   *
   * Returns information about cache state for monitoring/debugging.
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{
      path: string;
      lastAccess: Date;
      accessCount: number;
    }>;
  } {
    return {
      size: this.templateCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.templateCache.entries()).map(([path, entry]) => ({
        path,
        lastAccess: entry.lastAccess,
        accessCount: entry.accessCount,
      })),
    };
  }
}

// Export all types for external use
export * from '../types/template.types.js';
