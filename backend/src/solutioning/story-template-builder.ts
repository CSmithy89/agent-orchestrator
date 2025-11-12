/**
 * Story Template Builder
 *
 * Provides functionality to build story markdown files from Story objects
 * using a standard template with variable substitution.
 *
 * @module solutioning/story-template-builder
 */

import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { validateStory } from './schemas.js';
import type { Story, ValidationResult as SolutioningValidationResult } from './types.js';

/**
 * Story object with parsed content sections.
 * Extends Story interface with additional fields for template generation.
 */
export interface StoryObject extends Story {
  /** Parsed role from user story (As a...) */
  role?: string;

  /** Parsed action from user story (I want...) */
  action?: string;

  /** Parsed benefit from user story (So that...) */
  benefit?: string;

  /** Tasks and subtasks in markdown checkbox format */
  tasks_subtasks?: string;

  /** Blocking dependencies description */
  blocking_dependencies?: string;

  /** Stories this story enables */
  enables?: string;

  /** Soft dependencies description */
  soft_dependencies?: string;

  /** Architecture context notes */
  architecture_context?: string;

  /** Project structure notes */
  project_structure_notes?: string;

  /** Testing strategy description */
  testing_strategy?: string;

  /** References to related documentation */
  references?: string;
}

/**
 * StoryTemplateBuilder class provides methods to generate story markdown files
 * from Story objects using a standard template.
 *
 * @example
 * ```typescript
 * const builder = new StoryTemplateBuilder();
 * const story = await builder.buildFromTemplate(storyData);
 * const markdown = builder.toMarkdown(story);
 * await fs.writeFile('story.md', markdown);
 * ```
 */
export class StoryTemplateBuilder {
  private templatePath: string;
  private templateContent: string | null = null;

  /**
   * Create a new StoryTemplateBuilder.
   *
   * @param templatePath - Path to the story template file
   *   Defaults to docs/templates/story-template.md relative to project root
   */
  constructor(templatePath?: string) {
    this.templatePath =
      templatePath || `${process.cwd()}/docs/templates/story-template.md`;
  }

  /**
   * Load the template file if not already loaded.
   * Caches the template content for reuse.
   *
   * @throws Error if template file cannot be read
   */
  private async loadTemplate(): Promise<void> {
    if (this.templateContent === null) {
      try {
        this.templateContent = await fs.readFile(this.templatePath, 'utf-8');
      } catch (error) {
        throw new Error(
          `Failed to load story template from ${this.templatePath}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  /**
   * Parse user story description to extract role, action, and benefit.
   *
   * @param description - User story description in "As a..., I want..., So that..." format
   * @returns Parsed role, action, and benefit, or undefined if parsing fails
   */
  private parseUserStory(description: string): {
    role?: string;
    action?: string;
    benefit?: string;
  } {
    const asAMatch = description.match(/As (?:a|an) ([^,]+),/i);
    const iWantMatch = description.match(/I want ([^,]+),/i);
    const soThatMatch = description.match(/So that ([^.]+)/i);

    return {
      role: asAMatch?.[1]?.trim(),
      action: iWantMatch?.[1]?.trim(),
      benefit: soThatMatch?.[1]?.trim(),
    };
  }

  /**
   * Build a StoryObject from a Story data object.
   * Loads the template and populates it with story data.
   *
   * @param storyData - Story object with data to populate template
   * @returns StoryObject with template fields populated
   *
   * @throws Error if template loading fails or story data is invalid
   *
   * @example
   * ```typescript
   * const builder = new StoryTemplateBuilder();
   * const story = await builder.buildFromTemplate({
   *   id: '4-1',
   *   epic: 'epic-4',
   *   title: 'Data Models',
   *   description: 'As a developer, I want data models, So that I can build features.',
   *   acceptance_criteria: ['Interfaces defined', 'Tests passing'],
   *   dependencies: [],
   *   status: 'drafted',
   *   technical_notes: {
   *     affected_files: ['types.ts'],
   *     endpoints: [],
   *     data_structures: ['Epic', 'Story'],
   *     test_requirements: 'Unit tests with 80%+ coverage'
   *   },
   *   estimated_hours: 8,
   *   complexity: 'medium'
   * });
   * ```
   */
  async buildFromTemplate(storyData: Story): Promise<StoryObject> {
    await this.loadTemplate();

    // Parse user story description
    const parsed = this.parseUserStory(storyData.description);

    // Create StoryObject with all fields
    const storyObject: StoryObject = {
      ...storyData,
      role: parsed.role || 'user',
      action: parsed.action || storyData.title,
      benefit: parsed.benefit || 'achieve business value',
      tasks_subtasks: '<!-- To be filled during story creation -->',
      blocking_dependencies: storyData.dependencies.length > 0
        ? storyData.dependencies.map((dep) => `- ${dep}`).join('\n')
        : 'None',
      enables: '<!-- To be determined based on dependency graph -->',
      soft_dependencies: 'None',
      architecture_context: '<!-- To be filled during story creation -->',
      project_structure_notes: '<!-- To be filled during story creation -->',
      testing_strategy: storyData.technical_notes.test_requirements,
      references: '<!-- To be filled during story creation -->',
    };

    return storyObject;
  }

  /**
   * Validate that a story object has all required sections and fields.
   * Checks completeness against the Story schema.
   *
   * @param story - StoryObject to validate
   * @returns ValidationResult with detailed check results
   *
   * @example
   * ```typescript
   * const builder = new StoryTemplateBuilder();
   * const result = builder.validateStoryFormat(story);
   * if (!result.pass) {
   *   console.error('Story validation failed:', result.blockers);
   * }
   * ```
   */
  validateStoryFormat(story: StoryObject): SolutioningValidationResult {
    // First validate against Story schema
    const schemaValidation = validateStory(story);

    // Additional format checks
    const checks: SolutioningValidationResult['checks'] = [...schemaValidation.checks];
    const blockers: string[] = [...schemaValidation.blockers];
    const warnings: string[] = [...schemaValidation.warnings];

    // Check for required sections in StoryObject
    if (!story.role || story.role.length === 0) {
      checks.push({
        category: 'completeness',
        name: 'User Story Role',
        pass: false,
        details: 'Story must have a role defined (As a...)',
      });
      warnings.push('Story role is missing or empty');
    } else {
      checks.push({
        category: 'completeness',
        name: 'User Story Role',
        pass: true,
        details: `Role: ${story.role}`,
      });
    }

    if (!story.action || story.action.length === 0) {
      checks.push({
        category: 'completeness',
        name: 'User Story Action',
        pass: false,
        details: 'Story must have an action defined (I want...)',
      });
      warnings.push('Story action is missing or empty');
    } else {
      checks.push({
        category: 'completeness',
        name: 'User Story Action',
        pass: true,
        details: `Action: ${story.action}`,
      });
    }

    if (!story.benefit || story.benefit.length === 0) {
      checks.push({
        category: 'completeness',
        name: 'User Story Benefit',
        pass: false,
        details: 'Story must have a benefit defined (So that...)',
      });
      warnings.push('Story benefit is missing or empty');
    } else {
      checks.push({
        category: 'completeness',
        name: 'User Story Benefit',
        pass: true,
        details: `Benefit: ${story.benefit}`,
      });
    }

    // Calculate overall score
    const passedChecks = checks.filter((check) => check.pass).length;
    const totalChecks = checks.length;
    const score = totalChecks > 0 ? passedChecks / totalChecks : 0;

    // Overall pass if no blockers
    const pass = blockers.length === 0;

    return {
      pass,
      score,
      checks,
      blockers,
      warnings,
    };
  }

  /**
   * Convert a StoryObject to markdown format.
   * Includes YAML frontmatter and all story sections.
   *
   * @param story - StoryObject to convert
   * @returns Markdown string with YAML frontmatter
   *
   * @example
   * ```typescript
   * const builder = new StoryTemplateBuilder();
   * const markdown = builder.toMarkdown(story);
   * console.log(markdown);
   * ```
   */
  toMarkdown(story: StoryObject): string {
    const epicNum = story.epic.replace('epic-', '');
    const [storyEpicNum, storyNum] = story.id.split('-');
    const storyKey = `${storyEpicNum}-${storyNum}-${this.titleToKebabCase(story.title)}`;

    // Generate acceptance criteria list
    const acceptanceCriteria = story.acceptance_criteria
      .map((ac, index) => `${index + 1}. ${ac}`)
      .join('\n');

    // Build markdown content
    const markdown = `# Story ${epicNum}.${storyNum}: ${story.title}

Status: ${story.status}

## Story

As a ${story.role || 'user'},
I want ${story.action || story.title},
So that ${story.benefit || 'I can achieve business value'}.

## Acceptance Criteria

${acceptanceCriteria}

## Tasks / Subtasks

${story.tasks_subtasks || '<!-- To be filled during story creation -->'}

## Dependencies

**Blocking Dependencies:**
${story.blocking_dependencies || 'None'}

**Enables:**
${story.enables || '<!-- To be determined based on dependency graph -->'}

**Soft Dependencies:**
${story.soft_dependencies || 'None'}

## Dev Notes

### Architecture Context

${story.architecture_context || '<!-- To be filled during story creation -->'}

### Project Structure Notes

${story.project_structure_notes || '<!-- To be filled during story creation -->'}

### Testing Strategy

${story.testing_strategy || story.technical_notes.test_requirements}

### References

${story.references || '<!-- To be filled during story creation -->'}

## Change Log

- **${new Date().toISOString().split('T')[0]}**: Story created (drafted) from Epic ${epicNum} tech spec

## Dev Agent Record

### Context Reference

- \`docs/stories/${storyKey}.context.xml\` (Generated: ${new Date().toISOString().split('T')[0]})

### Agent Model Used

<!-- Will be filled by dev agent during implementation -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent during implementation -->

### File List

<!-- Will be filled by dev agent during implementation -->
`;

    return markdown;
  }

  /**
   * Generate YAML frontmatter for a story.
   * Includes story metadata for parsing and indexing.
   *
   * @param story - StoryObject to generate frontmatter for
   * @returns YAML frontmatter string
   *
   * @example
   * ```typescript
   * const builder = new StoryTemplateBuilder();
   * const frontmatter = builder.toYAMLFrontmatter(story);
   * console.log(frontmatter);
   * // ---
   * // id: 4-1
   * // epic: epic-4
   * // title: Data Models
   * // status: drafted
   * // dependencies: []
   * // acceptance_criteria_count: 10
   * // ---
   * ```
   */
  toYAMLFrontmatter(story: StoryObject): string {
    const frontmatter = {
      id: story.id,
      epic: story.epic,
      title: story.title,
      status: story.status,
      dependencies: story.dependencies,
      acceptance_criteria_count: story.acceptance_criteria.length,
      estimated_hours: story.estimated_hours,
      complexity: story.complexity,
    };

    const yamlString = yaml.dump(frontmatter);
    return `---\n${yamlString}---\n\n`;
  }

  /**
   * Convert a title to kebab-case for file naming.
   *
   * @param title - Story title to convert
   * @returns Kebab-case string
   *
   * @example
   * ```typescript
   * titleToKebabCase('User Authentication Flow')
   * // Returns: 'user-authentication-flow'
   * ```
   */
  private titleToKebabCase(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .replace(/-+/g, '-')          // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
  }
}
