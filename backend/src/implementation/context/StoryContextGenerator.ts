/**
 * Story Context Generator - Assembles comprehensive context for story implementation
 *
 * This generator orchestrates the collection and optimization of all context needed
 * for Amelia (Developer) agent to autonomously implement stories with high-quality code.
 *
 * Features:
 * - Story file parsing (YAML frontmatter + markdown)
 * - PRD section extraction with keyword matching (<10k tokens)
 * - Architecture section extraction with component mapping (<15k tokens)
 * - Onboarding docs loading (<10k tokens)
 * - Existing code file loading (<15k tokens)
 * - Dependency context from prerequisite stories
 * - Token optimization to stay under 50k tokens
 * - Context caching for performance
 * - XML document generation for LLM consumption
 *
 * @example
 * ```typescript
 * const generator = new StoryContextGenerator(projectRoot);
 * const context = await generator.generateContext('docs/stories/5-2-story-context-generator.md');
 * console.log(context.totalTokens); // Should be <50k
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import { StoryContext, ExistingCodeFile } from '../types.js';
import { parseStoryFile, ParsedStory } from './parsers.js';
import {
  extractRelevantPRDSections,
  extractRelevantArchSections,
  loadOnboardingDocs,
  loadRelevantCode,
  loadDependencyContext
} from './extractors.js';
import { calculateTokens, optimizeContext, ContextData } from './tokenizer.js';

/**
 * Configuration for StoryContextGenerator
 */
export interface StoryContextConfig {
  /** Project root directory */
  projectRoot: string;

  /** Path to PRD file or directory */
  prdPath?: string;

  /** Path to architecture file or directory */
  architecturePath?: string;

  /** Path to onboarding docs directory */
  onboardingPath?: string;

  /** Path to cache directory */
  cachePath?: string;

  /** Enable caching (default: true) */
  enableCache?: boolean;

  /** Token limits for each section */
  tokenLimits?: {
    prd: number;
    architecture: number;
    onboarding: number;
    code: number;
    total: number;
  };
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<StoryContextConfig, 'projectRoot'>> = {
  prdPath: 'docs/PRD.md',
  architecturePath: 'docs/architecture.md',
  onboardingPath: '.bmad/onboarding',
  cachePath: '.bmad/cache/story-context',
  enableCache: true,
  tokenLimits: {
    prd: 10000,
    architecture: 15000,
    onboarding: 10000,
    code: 15000,
    total: 50000
  }
};

/**
 * Story Context Generator
 *
 * Orchestrates all context assembly operations for story implementation.
 */
export class StoryContextGenerator {
  private config: Required<StoryContextConfig>;

  /**
   * Create a new Story Context Generator
   *
   * @param config Generator configuration
   */
  constructor(config: StoryContextConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      tokenLimits: {
        ...DEFAULT_CONFIG.tokenLimits,
        ...(config.tokenLimits || {})
      }
    };
  }

  /**
   * Generate complete story context from story file
   *
   * This is the main entry point for context generation. It orchestrates all steps:
   * 1. Check cache for existing valid context
   * 2. Parse story file
   * 3. Extract PRD sections
   * 4. Extract architecture sections
   * 5. Load onboarding docs
   * 6. Load existing code files
   * 7. Load dependency context
   * 8. Calculate tokens and optimize if needed
   * 9. Generate XML document
   * 10. Save to cache
   *
   * @param storyFilePath Absolute or relative path to story file
   * @returns Complete story context ready for Amelia agent
   * @throws Error if story file not found or context cannot be generated
   */
  async generateContext(storyFilePath: string): Promise<StoryContext> {
    const absolutePath = path.isAbsolute(storyFilePath)
      ? storyFilePath
      : path.join(this.config.projectRoot, storyFilePath);

    logger.info('Starting story context generation', {
      storyFile: absolutePath
    });

    try {
      // Step 1: Check cache
      const cached = await this.loadFromCache(absolutePath);
      if (cached) {
        logger.info('Context loaded from cache', {
          storyFile: absolutePath,
          tokens: cached.totalTokens
        });
        return cached;
      }

      // Step 2: Parse story file
      logger.info('Parsing story file');
      const story = await parseStoryFile(absolutePath);

      // Step 3: Extract PRD sections
      logger.info('Extracting PRD context');
      const prdContext = await this.extractPRDContext(story);

      // Step 4: Extract architecture sections
      logger.info('Extracting architecture context');
      const architectureContext = await this.extractArchContext(story);

      // Step 5: Load onboarding docs
      logger.info('Loading onboarding docs');
      const onboardingDocs = await this.loadOnboarding();

      // Step 6: Load existing code files
      logger.info('Loading existing code files');
      const existingCode = await this.loadCode(story);

      // Step 7: Load dependency context
      logger.info('Loading dependency context');
      const dependencyContext = await this.loadDependencies(story);

      // Step 8: Calculate tokens and optimize
      logger.info('Calculating tokens and optimizing context');
      const contextData: ContextData = {
        story,
        prdContext,
        architectureContext,
        onboardingDocs,
        existingCode,
        dependencyContext
      };

      const optimized = await optimizeContext(
        contextData,
        this.config.tokenLimits
      );

      // Step 9: Build final StoryContext
      const context: StoryContext = {
        story: {
          id: story.id,
          title: story.title,
          description: story.description,
          acceptanceCriteria: story.acceptanceCriteria,
          technicalNotes: story.technicalNotes || {},
          dependencies: story.dependencies || []
        },
        prdContext: optimized.prdContext,
        architectureContext: optimized.architectureContext,
        onboardingDocs: optimized.onboardingDocs,
        existingCode: optimized.existingCode,
        dependencyContext: optimized.dependencyContext,
        totalTokens: optimized.totalTokens
      };

      // Log token breakdown
      logger.info('Context generation complete', {
        storyId: story.id,
        totalTokens: context.totalTokens,
        prdTokens: calculateTokens(context.prdContext),
        archTokens: calculateTokens(context.architectureContext),
        onboardingTokens: calculateTokens(context.onboardingDocs),
        codeTokens: calculateTokens(
          context.existingCode.map(f => f.content).join('\n')
        ),
        depTokens: calculateTokens(context.dependencyContext || '')
      });

      // Step 10: Save to cache
      if (this.config.enableCache) {
        await this.saveToCache(story.id, context, absolutePath);
      }

      return context;
    } catch (error) {
      logger.error(
        'Story context generation failed',
        error as Error,
        { storyFile: absolutePath }
      );
      throw new Error(
        `Failed to generate story context: ${(error as Error).message}`
      );
    }
  }

  /**
   * Extract relevant PRD sections based on story keywords
   */
  private async extractPRDContext(story: ParsedStory): Promise<string> {
    const prdPath = path.join(this.config.projectRoot, this.config.prdPath);
    return extractRelevantPRDSections(
      prdPath,
      story,
      this.config.tokenLimits.prd
    );
  }

  /**
   * Extract relevant architecture sections based on story affected files
   */
  private async extractArchContext(story: ParsedStory): Promise<string> {
    const archPath = path.join(
      this.config.projectRoot,
      this.config.architecturePath
    );
    return extractRelevantArchSections(
      archPath,
      story,
      this.config.tokenLimits.architecture
    );
  }

  /**
   * Load onboarding documentation
   */
  private async loadOnboarding(): Promise<string> {
    const onboardingPath = path.join(
      this.config.projectRoot,
      this.config.onboardingPath
    );
    return loadOnboardingDocs(
      onboardingPath,
      this.config.tokenLimits.onboarding
    );
  }

  /**
   * Load existing code files mentioned in story
   */
  private async loadCode(story: ParsedStory): Promise<ExistingCodeFile[]> {
    const affectedFiles = story.technicalNotes?.affectedFiles || [];
    return loadRelevantCode(
      this.config.projectRoot,
      affectedFiles,
      this.config.tokenLimits.code
    );
  }

  /**
   * Load context from prerequisite stories
   */
  private async loadDependencies(story: ParsedStory): Promise<string | undefined> {
    if (!story.dependencies || story.dependencies.length === 0) {
      return undefined;
    }

    const storiesPath = path.dirname(story.filePath);
    return loadDependencyContext(storiesPath, story.dependencies);
  }

  /**
   * Load context from cache if valid
   *
   * @param storyFilePath Absolute path to story file
   * @returns Cached context or null if not found/invalid
   */
  private async loadFromCache(storyFilePath: string): Promise<StoryContext | null> {
    if (!this.config.enableCache) {
      return null;
    }

    try {
      // Get story file modification time
      const storyStats = await fs.stat(storyFilePath);
      const storyMtime = storyStats.mtime;

      // Get story ID from filename
      const filename = path.basename(storyFilePath, '.md');
      const cacheFilePath = path.join(
        this.config.projectRoot,
        this.config.cachePath,
        `${filename}.json`
      );

      // Check if cache file exists
      const cacheStats = await fs.stat(cacheFilePath);

      // Validate cache is newer than story file
      if (cacheStats.mtime < storyMtime) {
        logger.info('Cache invalid: story file modified after cache', {
          storyMtime: storyMtime.toISOString(),
          cacheMtime: cacheStats.mtime.toISOString()
        });
        return null;
      }

      // Load cached context
      const cacheContent = await fs.readFile(cacheFilePath, 'utf-8');
      const cached = JSON.parse(cacheContent) as StoryContext;

      logger.info('Cache hit', { storyId: cached.story.id });
      return cached;
    } catch (error) {
      // Cache miss or error - not critical
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Cache load error (ignoring)', {
          error: (error as Error).message
        });
      }
      return null;
    }
  }

  /**
   * Save context to cache
   *
   * @param storyId Story identifier
   * @param context Story context to cache
   * @param storyFilePath Absolute path to story file
   */
  private async saveToCache(
    storyId: string,
    context: StoryContext,
    storyFilePath: string
  ): Promise<void> {
    try {
      const filename = path.basename(storyFilePath, '.md');
      const cacheDirPath = path.join(
        this.config.projectRoot,
        this.config.cachePath
      );
      const cacheFilePath = path.join(cacheDirPath, `${filename}.json`);

      // Create cache directory if needed
      await fs.mkdir(cacheDirPath, { recursive: true });

      // Write cache file
      await fs.writeFile(
        cacheFilePath,
        JSON.stringify(context, null, 2),
        'utf-8'
      );

      logger.info('Context saved to cache', {
        storyId,
        cacheFile: cacheFilePath
      });
    } catch (error) {
      // Cache save failure is not critical
      logger.warn('Failed to save cache (ignoring)', {
        storyId,
        error: (error as Error).message
      });
    }
  }
}
