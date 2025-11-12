/**
 * Unit tests for StoryTemplateBuilder
 *
 * Tests story template loading, validation, markdown generation,
 * and YAML frontmatter generation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoryTemplateBuilder } from '../../../src/solutioning/story-template-builder.js';
import type { Story, StoryObject } from '../../../src/solutioning/index.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('StoryTemplateBuilder', () => {
  const mockStory: Story = {
    id: '4-1',
    epic: 'epic-4',
    title: 'Solutioning Data Models',
    description: 'As a solutioning system developer, I want foundational data models and schemas, So that all solutioning stories can build on consistent types.',
    acceptance_criteria: [
      'TypeScript interfaces defined in types.ts',
      'JSON schema validation implemented',
      'All tests passing with 80%+ coverage',
    ],
    dependencies: ['3-8'],
    status: 'in-progress',
    technical_notes: {
      affected_files: ['backend/src/solutioning/types.ts'],
      endpoints: [],
      data_structures: ['Epic', 'Story', 'DependencyGraph'],
      test_requirements: 'Unit tests with 80%+ coverage using Vitest',
    },
    estimated_hours: 8,
    complexity: 'medium',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildFromTemplate', () => {
    it('should build a story object from template with valid story data', async () => {
      const builder = new StoryTemplateBuilder();

      // Mock template file read
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyObject = await builder.buildFromTemplate(mockStory);

      expect(storyObject.id).toBe('4-1');
      expect(storyObject.epic).toBe('epic-4');
      expect(storyObject.title).toBe('Solutioning Data Models');
      expect(storyObject.role).toBe('solutioning system developer');
      expect(storyObject.action).toBe('foundational data models and schemas');
      expect(storyObject.benefit).toBe('all solutioning stories can build on consistent types');
    });

    it('should parse user story description correctly', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyObject = await builder.buildFromTemplate(mockStory);

      expect(storyObject.role).toBeDefined();
      expect(storyObject.action).toBeDefined();
      expect(storyObject.benefit).toBeDefined();
    });

    it('should handle story with dependencies', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyObject = await builder.buildFromTemplate(mockStory);

      expect(storyObject.blocking_dependencies).toContain('3-8');
    });

    it('should handle story with no dependencies', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyWithNoDeps = { ...mockStory, dependencies: [] };
      const storyObject = await builder.buildFromTemplate(storyWithNoDeps);

      expect(storyObject.blocking_dependencies).toBe('None');
    });

    it('should throw error if template file cannot be read', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(builder.buildFromTemplate(mockStory)).rejects.toThrow('Failed to load story template');
    });

    it('should cache template content after first load', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      await builder.buildFromTemplate(mockStory);
      await builder.buildFromTemplate(mockStory);

      // Should only read file once
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle malformed user story description gracefully', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const malformedStory = {
        ...mockStory,
        description: 'This is not a proper user story format',
      };
      const storyObject = await builder.buildFromTemplate(malformedStory);

      expect(storyObject.role).toBe('user');
      expect(storyObject.action).toBe(mockStory.title);
      expect(storyObject.benefit).toBe('achieve business value');
    });
  });

  describe('validateStoryFormat', () => {
    let builder: StoryTemplateBuilder;
    let storyObject: StoryObject;

    beforeEach(async () => {
      builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');
      storyObject = await builder.buildFromTemplate(mockStory);
    });

    it('should validate a complete story object', () => {
      const result = builder.validateStoryFormat(storyObject);

      expect(result.pass).toBe(true);
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.blockers).toHaveLength(0);
    });

    it('should detect missing role', () => {
      const incompleteStory = { ...storyObject, role: undefined };
      const result = builder.validateStoryFormat(incompleteStory);

      expect(result.warnings.some((w) => w.includes('role'))).toBe(true);
    });

    it('should detect missing action', () => {
      const incompleteStory = { ...storyObject, action: undefined };
      const result = builder.validateStoryFormat(incompleteStory);

      expect(result.warnings.some((w) => w.includes('action'))).toBe(true);
    });

    it('should detect missing benefit', () => {
      const incompleteStory = { ...storyObject, benefit: undefined };
      const result = builder.validateStoryFormat(incompleteStory);

      expect(result.warnings.some((w) => w.includes('benefit'))).toBe(true);
    });

    it('should validate story with all required sections', () => {
      const completeStory: StoryObject = {
        ...storyObject,
        role: 'developer',
        action: 'implement features',
        benefit: 'deliver value',
      };
      const result = builder.validateStoryFormat(completeStory);

      expect(result.pass).toBe(true);
      expect(result.checks.filter((c) => c.pass).length).toBeGreaterThan(0);
    });

    it('should calculate score based on passed checks', () => {
      const result = builder.validateStoryFormat(storyObject);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  describe('toMarkdown', () => {
    let builder: StoryTemplateBuilder;
    let storyObject: StoryObject;

    beforeEach(async () => {
      builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');
      storyObject = await builder.buildFromTemplate(mockStory);
    });

    it('should generate markdown with story header', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('# Story 4.1: Solutioning Data Models');
      expect(markdown).toContain('Status: in-progress');
    });

    it('should include user story format', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('As a');
      expect(markdown).toContain('I want');
      expect(markdown).toContain('So that');
    });

    it('should include acceptance criteria', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('## Acceptance Criteria');
      expect(markdown).toContain('TypeScript interfaces defined');
      expect(markdown).toContain('JSON schema validation implemented');
    });

    it('should number acceptance criteria correctly', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('1. TypeScript interfaces defined');
      expect(markdown).toContain('2. JSON schema validation implemented');
      expect(markdown).toContain('3. All tests passing with 80%+ coverage');
    });

    it('should include dependencies section', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('## Dependencies');
      expect(markdown).toContain('**Blocking Dependencies:**');
    });

    it('should include dev notes section', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('## Dev Notes');
      expect(markdown).toContain('### Architecture Context');
      expect(markdown).toContain('### Testing Strategy');
    });

    it('should include dev agent record section', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('## Dev Agent Record');
      expect(markdown).toContain('### Context Reference');
      expect(markdown).toContain('### Agent Model Used');
    });

    it('should include change log with current date', () => {
      const markdown = builder.toMarkdown(storyObject);
      const today = new Date().toISOString().split('T')[0];

      expect(markdown).toContain('## Change Log');
      expect(markdown).toContain(today);
    });

    it('should generate kebab-case story key in context reference', () => {
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('4-1-solutioning-data-models.context.xml');
    });

    it('should handle stories with no dependencies', () => {
      const storyWithNoDeps = { ...storyObject, dependencies: [], blocking_dependencies: 'None' };
      const markdown = builder.toMarkdown(storyWithNoDeps);

      expect(markdown).toContain('**Blocking Dependencies:**\nNone');
    });
  });

  describe('toYAMLFrontmatter', () => {
    let builder: StoryTemplateBuilder;
    let storyObject: StoryObject;

    beforeEach(async () => {
      builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');
      storyObject = await builder.buildFromTemplate(mockStory);
    });

    it('should generate YAML frontmatter with story metadata', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      expect(frontmatter).toContain('---');
      expect(frontmatter).toContain('id: 4-1');
      expect(frontmatter).toContain('epic: epic-4');
      expect(frontmatter).toContain('title: Solutioning Data Models');
      expect(frontmatter).toContain('status: in-progress');
    });

    it('should include acceptance criteria count', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      expect(frontmatter).toContain('acceptance_criteria_count: 3');
    });

    it('should include estimated hours', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      expect(frontmatter).toContain('estimated_hours: 8');
    });

    it('should include complexity', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      expect(frontmatter).toContain('complexity: medium');
    });

    it('should include dependencies array', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      expect(frontmatter).toContain('dependencies:');
    });

    it('should start and end with YAML delimiters', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      expect(frontmatter.startsWith('---\n')).toBe(true);
      expect(frontmatter).toContain('---\n\n');
    });

    it('should generate valid YAML format', () => {
      const frontmatter = builder.toYAMLFrontmatter(storyObject);

      // Should not contain syntax errors
      expect(frontmatter).not.toContain('undefined');
      expect(frontmatter).not.toContain('null');
    });
  });

  describe('Custom template path', () => {
    it('should use custom template path when provided', async () => {
      const customPath = '/custom/path/template.md';
      const builder = new StoryTemplateBuilder(customPath);

      vi.mocked(fs.readFile).mockResolvedValue('# Custom Template');

      await builder.buildFromTemplate(mockStory);

      expect(fs.readFile).toHaveBeenCalledWith(customPath, 'utf-8');
    });

    it('should use default template path when not provided', async () => {
      const builder = new StoryTemplateBuilder();

      vi.mocked(fs.readFile).mockResolvedValue('# Default Template');

      await builder.buildFromTemplate(mockStory);

      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('docs/templates/story-template.md'),
        'utf-8'
      );
    });
  });

  describe('Title to kebab-case conversion', () => {
    it('should convert title to kebab-case in markdown', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyObject = await builder.buildFromTemplate(mockStory);
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('solutioning-data-models');
    });

    it('should handle special characters in title', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyWithSpecialChars = {
        ...mockStory,
        title: 'User Auth & Login!',
      };
      const storyObject = await builder.buildFromTemplate(storyWithSpecialChars);
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('user-auth-login');
    });

    it('should handle multiple spaces in title', async () => {
      const builder = new StoryTemplateBuilder();
      vi.mocked(fs.readFile).mockResolvedValue('# Story Template');

      const storyWithSpaces = {
        ...mockStory,
        title: 'Data    Models   Schema',
      };
      const storyObject = await builder.buildFromTemplate(storyWithSpaces);
      const markdown = builder.toMarkdown(storyObject);

      expect(markdown).toContain('data-models-schema');
    });
  });
});
