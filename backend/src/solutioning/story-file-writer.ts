/**
 * Story File Writer
 *
 * Writes individual story markdown files and consolidated epics.md document.
 * Provides complete documentation output for the solutioning workflow.
 *
 * @module solutioning/story-file-writer
 * @see docs/stories/4-8-story-file-writer-epics-document-generator.md
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { StoryTemplateBuilder } from './story-template-builder.js';
import type { Story, Epic } from './types.js';

/**
 * Summary of file writing operations
 */
export interface WriteSummary {
  /** Number of story files successfully written */
  storiesWritten: number;

  /** Whether epics document was successfully written */
  epicsDocumentWritten: boolean;

  /** Paths to all written story files */
  storyFilePaths: string[];

  /** Path to epics document (null if write failed) */
  epicsDocumentPath: string | null;

  /** Number of failed story writes */
  storiesFailed: number;

  /** Error messages for failed writes */
  errors: string[];
}

/**
 * Result of solutioning workflow with epics, stories, and dependency graph
 * (Minimal interface for file writing - full definition in solutioning-orchestrator.ts)
 */
export interface SolutioningResult {
  epics: Epic[];
  stories: Story[];
  dependencyGraph?: unknown;
  metrics?: unknown;
}

/**
 * StoryFileWriter service
 *
 * Generates and writes story markdown files and epics document.
 * Uses StoryTemplateBuilder for consistent markdown formatting.
 *
 * @example
 * ```typescript
 * const writer = new StoryFileWriter();
 * const summary = await writer.writeAllStoryFiles(solutioningResult);
 * console.log(`Wrote ${summary.storiesWritten} story files`);
 * ```
 */
export class StoryFileWriter {
  private templateBuilder: StoryTemplateBuilder;
  private storiesDir: string;
  private epicsFilePath: string;

  /**
   * Create a new StoryFileWriter
   *
   * @param storiesDir - Directory for story files (default: docs/stories)
   * @param epicsFilePath - Path to epics document (default: docs/epics.md)
   */
  constructor(
    storiesDir: string = 'docs/stories',
    epicsFilePath: string = 'docs/epics.md'
  ) {
    this.templateBuilder = new StoryTemplateBuilder();
    this.storiesDir = storiesDir;
    this.epicsFilePath = epicsFilePath;
  }

  /**
   * Write a single story markdown file
   *
   * @param story - Story to write
   * @param _epic - Parent epic for context (currently unused, kept for API consistency)
   * @returns Promise resolving to file path
   * @throws Error if file write fails
   *
   * @example
   * ```typescript
   * const writer = new StoryFileWriter();
   * const filePath = await writer.writeStoryFile(story, epic);
   * console.log(`Story written to ${filePath}`);
   * ```
   */
  async writeStoryFile(story: Story, _epic: Epic): Promise<string> {
    try {
      // Build StoryObject using template builder
      const storyObject = await this.templateBuilder.buildFromTemplate(story);

      // Generate markdown content
      const markdown = this.templateBuilder.toMarkdown(storyObject);

      // Generate file name with kebab-case title
      const [storyEpicNum, storyNum] = story.id.split('-');
      const kebabTitle = this.titleToKebabCase(story.title);

      // Truncate long titles to avoid file system issues
      const truncatedTitle = kebabTitle.length > 50
        ? kebabTitle.substring(0, 50)
        : kebabTitle;

      const fileName = `${storyEpicNum}-${storyNum}-${truncatedTitle}.md`;
      const filePath = path.join(this.storiesDir, fileName);

      // Ensure directory exists
      await this.ensureDirectory(this.storiesDir);

      // Write file with UTF-8 encoding
      await fs.writeFile(filePath, markdown, 'utf-8');

      console.log(`[StoryFileWriter] Story written: ${filePath}`);
      return filePath;
    } catch (error) {
      const errorMsg = `Failed to write story file for ${story.id}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      console.error(`[StoryFileWriter] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Write consolidated epics.md document
   *
   * @param epics - Array of epics to document
   * @returns Promise resolving to file path (or null if write fails)
   *
   * @example
   * ```typescript
   * const writer = new StoryFileWriter();
   * const filePath = await writer.writeEpicsDocument(epics);
   * console.log(`Epics document written to ${filePath}`);
   * ```
   */
  async writeEpicsDocument(epics: Epic[]): Promise<string | null> {
    try {
      // Calculate aggregate metrics
      const totalStories = epics.reduce(
        (sum, epic) => sum + epic.stories.length,
        0
      );
      const currentDate = new Date().toISOString().split('T')[0];

      // Generate header
      let markdown = `# Epics Overview

Generated: ${currentDate}
Total Epics: ${epics.length}
Total Stories: ${totalStories}

`;

      // Generate section for each epic
      for (let i = 0; i < epics.length; i++) {
        const epic = epics[i];
        if (!epic) continue;

        const epicNum = epic.id.replace('epic-', '');

        markdown += `## Epic ${epicNum}: ${epic.title}

**Goal**: ${epic.goal}
**Value Proposition**: ${epic.value_proposition}
**Business Value**: ${epic.business_value}
**Estimated Duration**: ${epic.estimated_duration}
**Stories**: ${epic.stories.length} stories

### Stories:
`;

        // List stories with details
        epic.stories.forEach((story, storyIndex) => {
          const [epicPart, storyPart] = story.id.split('-');
          markdown += `${storyIndex + 1}. Story ${epicPart}.${storyPart}: ${story.title} (${story.estimated_hours} hours, ${story.complexity})\n`;
        });

        // Add separator between epics (but not after last epic)
        if (i < epics.length - 1) {
          markdown += '\n---\n\n';
        }
      }

      // Ensure parent directory exists
      const epicsDir = path.dirname(this.epicsFilePath);
      await this.ensureDirectory(epicsDir);

      // Write file
      await fs.writeFile(this.epicsFilePath, markdown, 'utf-8');

      console.log(`[StoryFileWriter] Epics document written: ${this.epicsFilePath}`);
      return this.epicsFilePath;
    } catch (error) {
      const errorMsg = `Failed to write epics document: ${
        error instanceof Error ? error.message : String(error)
      }`;
      console.error(`[StoryFileWriter] ${errorMsg}`);
      return null;
    }
  }

  /**
   * Write all story files and epics document
   *
   * Batch operation that writes all documentation files for a solutioning result.
   * Handles partial failures gracefully.
   *
   * @param result - Solutioning result with epics and stories
   * @returns Promise resolving to WriteSummary with counts and paths
   *
   * @example
   * ```typescript
   * const writer = new StoryFileWriter();
   * const summary = await writer.writeAllStoryFiles(result);
   * console.log(`Wrote ${summary.storiesWritten} stories, epics doc: ${summary.epicsDocumentWritten}`);
   * ```
   */
  async writeAllStoryFiles(result: SolutioningResult): Promise<WriteSummary> {
    const summary: WriteSummary = {
      storiesWritten: 0,
      epicsDocumentWritten: false,
      storyFilePaths: [],
      epicsDocumentPath: null,
      storiesFailed: 0,
      errors: [],
    };

    console.log('[StoryFileWriter] Writing all story files...');

    // Write story files sequentially (not parallel to avoid race conditions)
    for (const epic of result.epics) {
      for (const story of epic.stories) {
        try {
          const filePath = await this.writeStoryFile(story, epic);
          summary.storyFilePaths.push(filePath);
          summary.storiesWritten++;
        } catch (error) {
          summary.storiesFailed++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          summary.errors.push(`Story ${story.id}: ${errorMsg}`);
          console.warn(
            `[StoryFileWriter] Failed to write story ${story.id}, continuing...`
          );
        }
      }
    }

    // Write epics document
    const epicsPath = await this.writeEpicsDocument(result.epics);
    if (epicsPath) {
      summary.epicsDocumentWritten = true;
      summary.epicsDocumentPath = epicsPath;
    } else {
      summary.errors.push('Failed to write epics document');
    }

    // Log summary
    console.log(
      `[StoryFileWriter] Write complete: ${summary.storiesWritten} stories, ` +
      `${summary.storiesFailed} failed, epics doc: ${summary.epicsDocumentWritten}`
    );

    return summary;
  }

  /**
   * Ensure directory exists, create if needed
   *
   * @param dirPath - Directory path to ensure
   * @throws Error if directory creation fails
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore error if directory already exists
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Convert title to kebab-case for file naming
   *
   * @param title - Story title to convert
   * @returns Kebab-case string
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
