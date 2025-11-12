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
        if (!firstUndefined) {
          throw new TemplateError('Undefined variable detected but could not identify variable name');
        }
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
        const line = this.extractLineNumber(errorMessage);

        throw new TemplateSyntaxError(
          errorMessage,
          'template',
          line
        );
      }

      // Generic render error
      const line = this.extractLineNumber(errorMessage);

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
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, fn);
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
   * Extract line number from error message
   *
   * Helper method to extract line numbers from error messages.
   */
  private extractLineNumber(errorMessage: string): number | undefined {
    const lineMatch = errorMessage.match(/line (\d+)/);
    return (lineMatch && lineMatch[1]) ? parseInt(lineMatch[1], 10) : undefined;
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
      const line = lines[i];
      if (line && variablePattern.test(line)) {
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

  /**
   * Replace section content using XML comment markers
   *
   * Replaces content between <!-- SECTION: name --> and <!-- END SECTION: name -->
   * markers while preserving the markers themselves for future updates.
   *
   * @param content - Document content with section markers
   * @param sectionName - Name of section to replace (e.g., 'system-overview')
   * @param newContent - New content for the section
   * @returns Updated content with replaced section
   * @throws {TemplateError} If section markers not found or malformed
   *
   * @example
   * ```typescript
   * const updated = processor.replaceSectionWithMarkers(
   *   archDoc,
   *   'system-overview',
   *   'New system overview content'
   * );
   * ```
   */
  replaceSectionWithMarkers(
    content: string,
    sectionName: string,
    newContent: string
  ): string {
    // Pattern: <!-- SECTION: name -->...<!-- END SECTION: name -->
    const startMarker = `<!-- SECTION: ${sectionName} -->`;
    const endMarker = `<!-- END SECTION: ${sectionName} -->`;

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1) {
      throw new TemplateError(
        `Section start marker not found: ${startMarker}\n\n` +
        `Available sections:\n${this.extractMarkerSectionNames(content).map(s => `  - ${s}`).join('\n')}`,
        'content'
      );
    }

    if (endIndex === -1) {
      throw new TemplateError(
        `Section end marker not found: ${endMarker}`,
        'content'
      );
    }

    if (endIndex < startIndex) {
      throw new TemplateError(
        `Section markers out of order: end marker appears before start marker for section "${sectionName}"`,
        'content'
      );
    }

    // Compute position immediately after the start marker, then skip a single optional newline
    let contentStart = startIndex + startMarker.length;
    if (content[contentStart] === '\r' && content[contentStart + 1] === '\n') {
      contentStart += 2;
    } else if (content[contentStart] === '\n') {
      contentStart += 1;
    }

    // Build the updated content
    const before = content.substring(0, contentStart);
    const after = content.substring(endIndex);

    // Ensure newContent has proper spacing
    const trimmedContent = newContent.trim();
    const formattedContent = trimmedContent ? `${trimmedContent}\n` : '';

    return `${before}${formattedContent}${after}`;
  }

  /**
   * Resolve architecture-specific variables from multiple sources
   *
   * Resolves variables from multiple sources in priority order:
   * 1. Explicit context variables (highest priority)
   * 2. Workflow state
   * 3. Project configuration
   * 4. Git configuration
   * 5. System defaults (date, timestamp)
   *
   * @param context - Optional context with explicit variables and configuration paths
   * @returns Record of resolved variables
   *
   * @example
   * ```typescript
   * const vars = await processor.resolveArchitectureVariables({
   *   project_name: 'MyApp',
   *   prdPath: 'docs/prd.md',
   *   projectConfigPath: '.bmad/project-config.yaml'
   * });
   * ```
   */
  async resolveArchitectureVariables(context?: {
    [key: string]: any;
    prdPath?: string;
    projectConfigPath?: string;
    workflowState?: Record<string, any>;
  }): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};

    // 5. System defaults (lowest priority)
    const now = new Date();
    variables.date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    variables.timestamp = now.toISOString();
    variables.year = now.getFullYear().toString();

    // 4. Git configuration
    try {
      const gitConfig = await this.getGitConfig();
      if (gitConfig.user_name) variables.user_name = gitConfig.user_name;
      if (gitConfig.user_email) variables.user_email = gitConfig.user_email;
      if (gitConfig.author) variables.author = gitConfig.author;
    } catch (error) {
      // Git config not available, skip
    }

    // 3. Project configuration
    if (context?.projectConfigPath) {
      try {
        const projectConfig = await this.loadProjectConfig(context.projectConfigPath);
        Object.assign(variables, projectConfig);
      } catch (error) {
        // Project config not available, skip
      }
    }

    // 2. Workflow state
    if (context?.workflowState) {
      Object.assign(variables, context.workflowState);
    }

    // 1. Explicit context variables (highest priority)
    if (context) {
      const explicitVars = { ...context };
      delete explicitVars.prdPath;
      delete explicitVars.projectConfigPath;
      delete explicitVars.workflowState;
      Object.assign(variables, explicitVars);
    }

    return variables;
  }

  /**
   * Validate architecture template structure
   *
   * Checks that the template contains all required sections with proper markers
   * and validates variable placeholders and markdown syntax.
   *
   * @param template - Template content to validate
   * @returns Validation result with success flag and error messages
   *
   * @example
   * ```typescript
   * const result = processor.validateArchitectureTemplate(templateContent);
   * if (!result.valid) {
   *   console.error('Validation errors:', result.errors);
   * }
   * ```
   */
  validateArchitectureTemplate(template: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required sections for architecture template
    const requiredSections = [
      'system-overview',
      'component-architecture',
      'data-models',
      'api-specifications',
      'non-functional-requirements',
      'test-strategy',
      'technical-decisions'
    ];

    // Check for frontmatter
    if (!template.startsWith('---')) {
      errors.push('Template must start with YAML frontmatter (---)');
    }

    // Check for required sections
    const foundSections = this.extractMarkerSectionNames(template);
    const missingSections = requiredSections.filter(
      section => !foundSections.includes(section)
    );

    if (missingSections.length > 0) {
      errors.push(
        `Missing required sections: ${missingSections.join(', ')}\n` +
        `Found sections: ${foundSections.join(', ')}`
      );
    }

    // Check for malformed section markers
    const sectionMarkers = template.match(/<!-- SECTION: ([a-z-]+) -->/g) || [];
    const endMarkers = template.match(/<!-- END SECTION: ([a-z-]+) -->/g) || [];

    if (sectionMarkers.length !== endMarkers.length) {
      errors.push(
        `Mismatched section markers: ${sectionMarkers.length} start markers, ` +
        `${endMarkers.length} end markers`
      );
    }

    // Check each section has matching start/end markers
    foundSections.forEach(section => {
      const startMarker = `<!-- SECTION: ${section} -->`;
      const endMarker = `<!-- END SECTION: ${section} -->`;

      const startCount = (template.match(new RegExp(this.escapeRegex(startMarker), 'g')) || []).length;
      const endCount = (template.match(new RegExp(this.escapeRegex(endMarker), 'g')) || []).length;

      if (startCount !== 1 || endCount !== 1) {
        errors.push(
          `Section "${section}" has incorrect markers: ` +
          `${startCount} start, ${endCount} end (expected 1 each)`
        );
      }
    });

    // Check for required variables in frontmatter
    const requiredVars = ['project_name', 'date', 'user_name', 'epic_id'];
    const frontmatterMatch = template.match(/^---\n([\s\S]*?)\n---/);

    if (frontmatterMatch && frontmatterMatch[1]) {
      const frontmatter = frontmatterMatch[1];
      const missingVars = requiredVars.filter(
        varName => !frontmatter.includes(`{{${varName}}}`)
      );

      if (missingVars.length > 0) {
        warnings.push(
          `Frontmatter missing recommended variables: ${missingVars.join(', ')}`
        );
      }
    }

    // Validate basic Handlebars syntax
    try {
      this.validateTemplate(template);
    } catch (error) {
      if (error instanceof TemplateError) {
        errors.push(`Template syntax error: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load template with project-specific override support
   *
   * Attempts to load template from project override location first,
   * falls back to default template if override doesn't exist.
   * Logs which template source is used for audit trail.
   *
   * @param defaultPath - Path to default template
   * @param projectOverridePath - Optional path to project-specific override
   * @returns Promise resolving to template content and metadata
   *
   * @example
   * ```typescript
   * const { content, source } = await processor.loadTemplateWithOverride(
   *   'bmad/bmm/workflows/architecture/template.md',
   *   '.bmad/workflows/architecture/template.md'
   * );
   * console.log(`Using ${source} template`);
   * ```
   */
  async loadTemplateWithOverride(
    defaultPath: string,
    projectOverridePath?: string
  ): Promise<{
    content: string;
    source: 'custom' | 'default';
    path: string;
  }> {
    // Try project override first
    if (projectOverridePath) {
      const overridePath = path.resolve(projectOverridePath);

      try {
        await fs.access(overridePath);
        const content = await this.loadTemplate(overridePath);

        // Validate custom template
        const validation = this.validateArchitectureTemplate(content);
        if (!validation.valid) {
          console.warn(
            `Custom template at ${projectOverridePath} has validation errors:\n` +
            validation.errors.map(e => `  - ${e}`).join('\n') +
            '\nFalling back to default template.'
          );

          // Fall through to load default template
        } else {
          if (validation.warnings.length > 0) {
            console.warn(
              `Custom template warnings:\n` +
              validation.warnings.map(w => `  - ${w}`).join('\n')
            );
          }

          console.log(`Using custom template from: ${projectOverridePath}`);
          return {
            content,
            source: 'custom',
            path: overridePath
          };
        }
      } catch (error) {
        // Override doesn't exist or can't be read, fall back to default
      }
    }

    // Load default template
    const resolvedDefaultPath = path.resolve(defaultPath);
    const content = await this.loadTemplate(resolvedDefaultPath);

    console.log(`Using default template from: ${defaultPath}`);
    return {
      content,
      source: 'default',
      path: resolvedDefaultPath
    };
  }

  /**
   * Extract section names from XML comment markers
   *
   * Parses content to find all <!-- SECTION: name --> markers and
   * returns the section names.
   *
   * @param content - Content to parse
   * @returns Array of section names
   */
  private extractMarkerSectionNames(content: string): string[] {
    const markerRegex = /<!-- SECTION: ([a-z-]+) -->/g;
    const sections: string[] = [];
    let match;

    while ((match = markerRegex.exec(content)) !== null) {
      if (match[1]) {
        sections.push(match[1]);
      }
    }

    return sections;
  }

  /**
   * Get git configuration
   *
   * Reads git user.name and user.email from git config.
   *
   * @returns Promise resolving to git config object
   */
  private async getGitConfig(): Promise<{
    user_name?: string;
    user_email?: string;
    author?: string;
  }> {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const config: {
      user_name?: string;
      user_email?: string;
      author?: string;
    } = {};

    try {
      const { stdout: name } = await execFileAsync('git', ['config', 'user.name']);
      config.user_name = name.trim();
      config.author = name.trim();
    } catch (error) {
      // user.name not configured
    }

    try {
      const { stdout: email } = await execFileAsync('git', ['config', 'user.email']);
      config.user_email = email.trim();
    } catch (error) {
      // user.email not configured
    }

    return config;
  }

  /**
   * Load project configuration from YAML file
   *
   * Reads project configuration file and parses YAML content.
   *
   * @param configPath - Path to project config file
   * @returns Promise resolving to configuration object
   */
  private async loadProjectConfig(configPath: string): Promise<Record<string, any>> {
    try {
      const resolvedPath = path.resolve(configPath);
      const content = await fs.readFile(resolvedPath, 'utf8');

      // Simple YAML parsing for basic key-value pairs
      // For production, consider using a proper YAML library
      const config: Record<string, any> = {};
      const lines = content.split('\n');

      for (const line of lines) {
        const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
        if (match && match[1] && match[2]) {
          const key = match[1];
          let value: any = match[2].trim();

          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          config[key] = value;
        }
      }

      return config;
    } catch (error) {
      throw new TemplateError(
        `Failed to load project config: ${(error as Error).message}`,
        configPath
      );
    }
  }
}

// Export all types for external use
export * from '../types/template.types.js';
