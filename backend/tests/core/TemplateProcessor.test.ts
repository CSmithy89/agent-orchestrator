/**
 * TemplateProcessor Unit Tests
 *
 * Comprehensive test suite covering all template processing functionality:
 * - Template loading and caching
 * - Variable substitution (simple, nested, defaults)
 * - Conditional blocks (if, unless, else)
 * - Loops (arrays, objects, metadata)
 * - File operations (create, update, sections)
 * - Custom helpers
 * - Error handling
 * - Markdown preservation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateProcessor } from '../../src/core/TemplateProcessor.js';
import {
  TemplateNotFoundError,
  TemplateSyntaxError,
  VariableUndefinedError,
  FileWriteError,
} from '../../src/types/template.types.js';

describe('TemplateProcessor', () => {
  let processor: TemplateProcessor;
  let testDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(process.cwd(), 'test-tmp-' + Date.now());
    await fs.mkdir(testDir, { recursive: true });

    // Create TemplateProcessor with test directory as base path
    processor = new TemplateProcessor({
      basePath: testDir,
      strictMode: true,
      preserveWhitespace: true,
    });
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Template Loading (AC #1, #7)', () => {
    it('should load template file successfully', async () => {
      const templatePath = path.join(testDir, 'template.md');
      const templateContent = '# {{title}}\n\nHello {{name}}!';

      await fs.writeFile(templatePath, templateContent, 'utf8');

      const loaded = await processor.loadTemplate(templatePath);
      expect(loaded).toBe(templateContent);
    });

    it('should throw TemplateNotFoundError for missing file', async () => {
      await expect(
        processor.loadTemplate('nonexistent.md')
      ).rejects.toThrow(TemplateNotFoundError);
    });

    it('should cache loaded templates', async () => {
      const templatePath = path.join(testDir, 'cached-template.md');
      const templateContent = '# Cached Template';

      await fs.writeFile(templatePath, templateContent, 'utf8');

      // Load twice
      await processor.loadTemplate(templatePath);
      await processor.loadTemplate(templatePath);

      const stats = processor.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should preserve markdown formatting', async () => {
      const template = `## Section Title

- Item 1
- Item 2

**Bold text** and *italic text*

\`\`\`typescript
const code = "preserved";
\`\`\`
`;

      const result = processor.processTemplate(template, {});
      expect(result).toBe(template);
    });

    it('should preserve whitespace', async () => {
      const template = 'Line 1\n\nLine 2\n   Indented\n\tTabbed';
      const result = processor.processTemplate(template, {});
      expect(result).toBe(template);
    });
  });

  describe('Variable Substitution (AC #2, #8)', () => {
    it('should substitute simple variables', () => {
      const template = 'Hello {{name}}!';
      const result = processor.processTemplate(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should substitute multiple variables', () => {
      const template = '# {{project}} by {{author}} on {{created_date}}';
      const result = processor.processTemplate(template, {
        project: 'MyApp',
        author: 'John',
        created_date: '2025-01-01',
      });
      expect(result).toBe('# MyApp by John on 2025-01-01');
    });

    it('should substitute nested variables', () => {
      const template = 'Contact: {{user.email}}';
      const result = processor.processTemplate(template, {
        user: { email: 'john@example.com' },
      });
      expect(result).toBe('Contact: john@example.com');
    });

    it('should handle special characters in values', () => {
      const template = 'Text: {{content}}';
      const result = processor.processTemplate(template, {
        content: 'Hello <world> & "friends"',
      });
      expect(result).toBe('Text: Hello <world> & "friends"');
    });

    it('should throw error for undefined variables in strict mode', () => {
      const template = 'Hello {{name}}!';
      expect(() => {
        processor.processTemplate(template, {});
      }).toThrow(VariableUndefinedError);
    });

    it('should handle undefined variables in non-strict mode', () => {
      const nonStrictProcessor = new TemplateProcessor({
        strictMode: false,
      });
      const template = 'Hello {{name}}!';
      const result = nonStrictProcessor.processTemplate(template, {});
      expect(result).toBe('Hello !');
    });

    it('should handle empty string values', () => {
      const template = 'Value: {{value}}';
      const result = processor.processTemplate(template, { value: '' });
      expect(result).toBe('Value: ');
    });
  });

  describe('Conditional Blocks (AC #3)', () => {
    it('should process #if blocks when condition is true', () => {
      const template = '{{#if show}}Visible{{/if}}';
      const result = processor.processTemplate(template, { show: true });
      expect(result).toBe('Visible');
    });

    it('should remove #if blocks when condition is false', () => {
      const template = 'Start {{#if show}}Hidden{{/if}} End';
      const result = processor.processTemplate(template, { show: false });
      expect(result).toBe('Start  End');
    });

    it('should support #unless (negation)', () => {
      const template = '{{#unless hide}}Visible{{/unless}}';
      const result = processor.processTemplate(template, { hide: false });
      expect(result).toBe('Visible');
    });

    it('should support else blocks', () => {
      const template = '{{#if isPremium}}Premium{{else}}Free{{/if}}';
      const resultTrue = processor.processTemplate(template, { isPremium: true });
      const resultFalse = processor.processTemplate(template, { isPremium: false });
      expect(resultTrue).toBe('Premium');
      expect(resultFalse).toBe('Free');
    });

    it('should support nested conditionals', () => {
      const template = '{{#if outer}}{{#if inner}}Both true{{/if}}{{/if}}';
      const result = processor.processTemplate(template, { outer: true, inner: true });
      expect(result).toBe('Both true');
    });

    it('should support comparison conditions with helpers', () => {
      const template = '{{#if (gt count 5)}}Greater{{else}}Less or equal{{/if}}';
      const resultGt = processor.processTemplate(template, { count: 10 });
      const resultLte = processor.processTemplate(template, { count: 3 });
      expect(resultGt).toBe('Greater');
      expect(resultLte).toBe('Less or equal');
    });
  });

  describe('Loop Support (AC #4)', () => {
    it('should iterate over arrays', () => {
      const template = '{{#each items}}* {{this}}\n{{/each}}';
      const result = processor.processTemplate(template, {
        items: ['Apple', 'Banana', 'Cherry'],
      });
      expect(result).toBe('* Apple\n* Banana\n* Cherry\n');
    });

    it('should access object properties in loops', () => {
      const template = '{{#each users}}Name: {{this.name}}\n{{/each}}';
      const result = processor.processTemplate(template, {
        users: [
          { name: 'Alice' },
          { name: 'Bob' },
        ],
      });
      expect(result).toBe('Name: Alice\nName: Bob\n');
    });

    it('should provide loop index with @index', () => {
      const template = '{{#each items}}{{@index}}. {{this}}\n{{/each}}';
      const result = processor.processTemplate(template, {
        items: ['First', 'Second', 'Third'],
      });
      expect(result).toBe('0. First\n1. Second\n2. Third\n');
    });

    it('should provide @first and @last metadata', () => {
      const template = '{{#each items}}{{#if @first}}START {{/if}}{{this}}{{#if @last}} END{{/if}}{{/each}}';
      const result = processor.processTemplate(template, {
        items: ['A', 'B', 'C'],
      });
      expect(result).toBe('START ABC END');
    });

    it('should support nested loops', () => {
      const template = '{{#each groups}}Group:\n{{#each this.items}}  - {{this}}\n{{/each}}{{/each}}';
      const result = processor.processTemplate(template, {
        groups: [
          { items: ['A', 'B'] },
          { items: ['C', 'D'] },
        ],
      });
      expect(result).toBe('Group:\n  - A\n  - B\nGroup:\n  - C\n  - D\n');
    });

    it('should handle empty collections gracefully', () => {
      const template = 'Before{{#each items}} Item{{/each}}After';
      const result = processor.processTemplate(template, { items: [] });
      expect(result).toBe('BeforeAfter');
    });

    it('should iterate over object keys', () => {
      const template = '{{#each config}}{{@key}}: {{this}}\n{{/each}}';
      const result = processor.processTemplate(template, {
        config: { host: 'localhost', port: 3000 },
      });
      expect(result).toContain('host: localhost');
      expect(result).toContain('port: 3000');
    });
  });

  describe('File Output Operations (AC #5, #6)', () => {
    it('should create new file with Write', async () => {
      const outputPath = path.join(testDir, 'new-file.md');
      const content = '# New Document\n\nContent here.';

      await processor.writeOutput(content, outputPath);

      const written = await fs.readFile(outputPath, 'utf8');
      expect(written).toBe(content);
    });

    it('should update existing file', async () => {
      const outputPath = path.join(testDir, 'existing-file.md');
      const originalContent = '# Original';
      const updatedContent = '# Updated';

      // Create file first
      await fs.writeFile(outputPath, originalContent, 'utf8');

      // Update it
      await processor.writeOutput(updatedContent, outputPath);

      const written = await fs.readFile(outputPath, 'utf8');
      expect(written).toBe(updatedContent);
    });

    it('should create parent directories if needed', async () => {
      const outputPath = path.join(testDir, 'nested', 'deep', 'file.md');
      const content = '# Nested File';

      await processor.writeOutput(content, outputPath);

      const written = await fs.readFile(outputPath, 'utf8');
      expect(written).toBe(content);
    });

    it('should throw FileWriteError for write failures', async () => {
      // Create a file, then try to write to it as if it were a directory
      // This will cause ENOTDIR error
      const blockingFile = path.join(testDir, 'blocking-file.txt');
      await fs.writeFile(blockingFile, 'content');

      // Try to write to a path that has a file in the middle (not a directory)
      await expect(
        processor.writeOutput('content', path.join(blockingFile, 'nested', 'file.md'))
      ).rejects.toThrow(FileWriteError);
    });
  });

  describe('Incremental Section Updates (AC #6)', () => {
    it('should update specific section in document', async () => {
      const filePath = path.join(testDir, 'document.md');
      const originalContent = `# Document

## Introduction

Old intro text

## Requirements

Old requirements

## Conclusion

Old conclusion
`;

      await fs.writeFile(filePath, originalContent, 'utf8');

      // Update Requirements section
      await processor.updateSection(filePath, 'Requirements', 'New requirements\n- Req 1\n- Req 2');

      const updated = await fs.readFile(filePath, 'utf8');
      expect(updated).toContain('New requirements');
      expect(updated).toContain('- Req 1');
      expect(updated).toContain('Old intro text'); // Other sections preserved
      expect(updated).toContain('Old conclusion');
    });

    it('should preserve surrounding content when updating section', async () => {
      const filePath = path.join(testDir, 'doc2.md');
      const originalContent = `# Title

## Section A

Content A

## Section B

Content B

## Section C

Content C
`;

      await fs.writeFile(filePath, originalContent, 'utf8');

      await processor.updateSection(filePath, 'Section B', 'New B content');

      const updated = await fs.readFile(filePath, 'utf8');
      expect(updated).toContain('Content A');
      expect(updated).toContain('New B content');
      expect(updated).toContain('Content C');
    });

    it('should throw error for non-existent section', async () => {
      const filePath = path.join(testDir, 'doc3.md');
      await fs.writeFile(filePath, '# Doc\n\n## Section A\n\nContent', 'utf8');

      await expect(
        processor.updateSection(filePath, 'NonExistent', 'content')
      ).rejects.toThrow(/Section "NonExistent" not found/);
    });

    it('should handle multiple section updates', async () => {
      const filePath = path.join(testDir, 'doc4.md');
      const original = `# Doc

## Sec1

A

## Sec2

B

## Sec3

C
`;
      await fs.writeFile(filePath, original, 'utf8');

      await processor.updateSection(filePath, 'Sec1', 'New A');
      await processor.updateSection(filePath, 'Sec3', 'New C');

      const updated = await fs.readFile(filePath, 'utf8');
      expect(updated).toContain('New A');
      expect(updated).toContain('B'); // Sec2 unchanged
      expect(updated).toContain('New C');
    });
  });

  describe('Custom Helpers (AC #2)', () => {
    it('should support uppercase helper', () => {
      const template = '{{uppercase text}}';
      const result = processor.processTemplate(template, { text: 'hello' });
      expect(result).toBe('HELLO');
    });

    it('should support lowercase helper', () => {
      const template = '{{lowercase text}}';
      const result = processor.processTemplate(template, { text: 'WORLD' });
      expect(result).toBe('world');
    });

    it('should support capitalize helper', () => {
      const template = '{{capitalize text}}';
      const result = processor.processTemplate(template, { text: 'hello' });
      expect(result).toBe('Hello');
    });

    it('should support date helper', () => {
      const template = '{{date}}';
      const result = processor.processTemplate(template, {});
      // Should return YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should support join helper for arrays', () => {
      const template = '{{join items ", "}}';
      const result = processor.processTemplate(template, {
        items: ['apple', 'banana', 'cherry'],
      });
      expect(result).toBe('apple, banana, cherry');
    });

    it('should support comparison helpers', () => {
      const template = '{{#if (eq a b)}}Equal{{/if}}';
      const result = processor.processTemplate(template, { a: 5, b: 5 });
      expect(result).toBe('Equal');
    });

    it('should register custom helper', () => {
      processor.registerHelper('double', (num: number) => num * 2);

      const template = '{{double value}}';
      const result = processor.processTemplate(template, { value: 21 });
      expect(result).toBe('42');
    });
  });

  describe('Error Handling (AC #8)', () => {
    it('should throw TemplateSyntaxError for unclosed if tag', () => {
      const template = '{{#if condition}}unclosed';
      expect(() => {
        processor.processTemplate(template, { condition: true });
      }).toThrow(TemplateSyntaxError);
    });

    it('should throw TemplateSyntaxError for unclosed each tag', () => {
      const template = '{{#each items}}unclosed';
      expect(() => {
        processor.processTemplate(template, { items: [] });
      }).toThrow(TemplateSyntaxError);
    });

    it('should throw VariableUndefinedError with available variables list', () => {
      const template = '{{missing}}';
      try {
        processor.processTemplate(template, { name: 'John', age: 30 });
        expect.fail('Should have thrown VariableUndefinedError');
      } catch (error: any) {
        expect(error).toBeInstanceOf(VariableUndefinedError);
        expect(error.message).toContain('name');
        expect(error.message).toContain('age');
      }
    });

    it('should throw error with resolution suggestions', () => {
      const template = '{{user_email}}';
      try {
        processor.processTemplate(template, { user_name: 'John' });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Resolution');
        expect(error.message).toContain('Add \'user_email\'');
      }
    });

    it('should validate template before processing', async () => {
      const templatePath = path.join(testDir, 'invalid.md');
      const invalidTemplate = '{{#if}}{{/if}}'; // Missing condition

      await fs.writeFile(templatePath, invalidTemplate, 'utf8');

      await expect(
        processor.loadTemplate(templatePath)
      ).rejects.toThrow(TemplateSyntaxError);
    });
  });

  describe('Integration Tests', () => {
    it('should generate complete document from template', async () => {
      const templatePath = path.join(testDir, 'prd-template.md');
      const templateContent = `# {{project_name}} - PRD

**Author:** {{author}}
**Date:** {{date}}

## Vision

{{vision}}

{{#if has_mobile}}
## Mobile Requirements

{{mobile_requirements}}
{{/if}}

## Features

{{#each features}}
### {{this.name}}

{{this.description}}

**Acceptance Criteria:**
{{#each this.acceptance_criteria}}
- {{this}}
{{/each}}

{{/each}}

## Conclusion

End of document.
`;

      await fs.writeFile(templatePath, templateContent, 'utf8');

      const outputPath = path.join(testDir, 'prd-output.md');
      const template = await processor.loadTemplate(templatePath);
      const rendered = processor.processTemplate(template, {
        project_name: 'MyApp',
        author: 'John Doe',
        date: '2025-01-01',
        vision: 'Build the best app ever',
        has_mobile: true,
        mobile_requirements: 'iOS and Android support',
        features: [
          {
            name: 'Authentication',
            description: 'User login and registration',
            acceptance_criteria: ['Users can sign up', 'Users can log in'],
          },
          {
            name: 'Dashboard',
            description: 'Main user dashboard',
            acceptance_criteria: ['Show user stats', 'Display recent activity'],
          },
        ],
      });

      await processor.writeOutput(rendered, outputPath);

      const output = await fs.readFile(outputPath, 'utf8');
      expect(output).toContain('# MyApp - PRD');
      expect(output).toContain('**Author:** John Doe');
      expect(output).toContain('## Mobile Requirements');
      expect(output).toContain('### Authentication');
      expect(output).toContain('- Users can sign up');
      expect(output).toContain('### Dashboard');
      expect(output).toContain('## Conclusion');
    });

    it('should handle template with all features combined', () => {
      const template = `# {{uppercase project}}

{{#if show_author}}
Author: {{capitalize author.name}} ({{lowercase author.email}})
{{/if}}

## Items

{{#each items}}
{{@index}}. {{this.name}}{{#if @last}} (last){{/if}}
{{/each}}

{{#unless is_draft}}
## Published on {{date}}
{{/unless}}
`;

      const result = processor.processTemplate(template, {
        project: 'myapp',
        show_author: true,
        author: { name: 'john', email: 'JOHN@EXAMPLE.COM' },
        items: [
          { name: 'Item A' },
          { name: 'Item B' },
          { name: 'Item C' },
        ],
        is_draft: false,
      });

      expect(result).toContain('# MYAPP');
      expect(result).toContain('Author: John');
      expect(result).toContain('john@example.com');
      expect(result).toContain('0. Item A');
      expect(result).toContain('2. Item C (last)');
      expect(result).toMatch(/## Published on \d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Template Caching', () => {
    it('should cache templates for performance', async () => {
      const templatePath = path.join(testDir, 'cached.md');
      await fs.writeFile(templatePath, '# {{title}}', 'utf8');

      // First render
      await processor.renderTemplate(templatePath, { title: 'First' });

      // Check cache
      const statsAfterFirst = processor.getCacheStats();
      expect(statsAfterFirst.size).toBeGreaterThan(0);

      // Second render (should use cache)
      await processor.renderTemplate(templatePath, { title: 'Second' });

      const statsAfterSecond = processor.getCacheStats();
      expect(statsAfterSecond.size).toBe(statsAfterFirst.size);

      // Find entry for our template
      const entry = statsAfterSecond.entries.find(e => e.path === templatePath);
      expect(entry).toBeDefined();
      expect(entry!.accessCount).toBe(2);
    });

    it('should invalidate cache when file is modified', async () => {
      const templatePath = path.join(testDir, 'modified.md');
      await fs.writeFile(templatePath, '# Original', 'utf8');

      // Load first version
      const first = await processor.loadTemplate(templatePath);
      expect(first).toBe('# Original');

      // Wait a bit to ensure mtime changes
      await new Promise(resolve => setTimeout(resolve, 10));

      // Modify file
      await fs.writeFile(templatePath, '# Modified', 'utf8');

      // Load again (should reload from disk)
      const second = await processor.loadTemplate(templatePath);
      expect(second).toBe('# Modified');
    });

    it('should clear cache', async () => {
      const templatePath = path.join(testDir, 'clear-test.md');
      await fs.writeFile(templatePath, '# Test', 'utf8');

      await processor.loadTemplate(templatePath);
      expect(processor.getCacheStats().size).toBeGreaterThan(0);

      processor.clearCache();
      expect(processor.getCacheStats().size).toBe(0);
    });
  });
});
