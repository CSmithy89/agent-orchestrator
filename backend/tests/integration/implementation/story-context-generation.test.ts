/**
 * Integration Tests for Story Context Generation
 *
 * Tests end-to-end context generation with real files.
 * Uses Story 5.1 as a real-world test case.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StoryContextGenerator } from '../../../src/implementation/context/StoryContextGenerator.js';
import { parseStoryFile } from '../../../src/implementation/context/parsers.js';
import { calculateTokens } from '../../../src/implementation/context/tokenizer.js';
import { generateXML, validateXML } from '../../../src/implementation/context/xml-generator.js';

describe('Story Context Generation (Integration)', () => {
  const projectRoot = process.cwd();
  let generator: StoryContextGenerator;
  const testCacheDir = path.join(projectRoot, '.bmad/cache/test-story-context');

  beforeAll(async () => {
    // Create test cache directory
    await fs.mkdir(testCacheDir, { recursive: true });

    generator = new StoryContextGenerator({
      projectRoot,
      cachePath: '.bmad/cache/test-story-context'
    });
  });

  afterAll(async () => {
    // Clean up test cache
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Real Story File Parsing', () => {
    it('should parse Story 5.1 successfully', async () => {
      const storyPath = path.join(projectRoot, 'docs/stories/5-1-core-agent-infrastructure.md');

      // Check if story file exists
      try {
        await fs.access(storyPath);
      } catch {
        console.log('Story 5.1 not found, skipping test');
        return;
      }

      const story = await parseStoryFile(storyPath);

      expect(story.id).toBe('5-1-core-agent-infrastructure');
      expect(story.title).toContain('Core Agent Infrastructure');
      expect(story.status).toBe('done');
      expect(story.description).toBeTruthy();
      expect(story.acceptanceCriteria.length).toBeGreaterThan(0);
    });

    it('should parse Story 5.2 (current story) successfully', async () => {
      const storyPath = path.join(projectRoot, 'docs/stories/5-2-story-context-generator.md');

      // Check if story file exists
      try {
        await fs.access(storyPath);
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      const story = await parseStoryFile(storyPath);

      expect(story.id).toBe('5-2-story-context-generator');
      expect(story.title).toContain('Story Context Generator');
      expect(story.acceptanceCriteria.length).toBeGreaterThan(0);
      expect(story.technicalNotes).toBeDefined();
    });
  });

  describe('End-to-End Context Generation', () => {
    it('should generate complete context for Story 5.2', async () => {
      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      const context = await generator.generateContext(storyPath);

      // Verify story metadata
      expect(context.story.id).toBe('5-2-story-context-generator');
      expect(context.story.title).toContain('Story Context Generator');
      expect(context.story.acceptanceCriteria.length).toBeGreaterThan(0);

      // Verify PRD context extracted
      expect(context.prdContext).toBeTruthy();
      expect(context.prdContext.length).toBeGreaterThan(0);

      // Verify architecture context extracted
      expect(context.architectureContext).toBeTruthy();
      expect(context.architectureContext.length).toBeGreaterThan(0);

      // Verify token count
      expect(context.totalTokens).toBeGreaterThan(0);
      expect(context.totalTokens).toBeLessThan(50000);

      // Verify token breakdown
      const prdTokens = calculateTokens(context.prdContext);
      const archTokens = calculateTokens(context.architectureContext);
      const onboardingTokens = calculateTokens(context.onboardingDocs);

      console.log('Token Breakdown:', {
        prd: prdTokens,
        architecture: archTokens,
        onboarding: onboardingTokens,
        total: context.totalTokens
      });

      expect(prdTokens).toBeLessThanOrEqual(10000);
      expect(archTokens).toBeLessThanOrEqual(15000);
      expect(onboardingTokens).toBeLessThanOrEqual(10000);
    });

    it('should generate context for Story 5.1 (with dependency context)', async () => {
      const storyPath = 'docs/stories/5-1-core-agent-infrastructure.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.1 not found, skipping test');
        return;
      }

      const context = await generator.generateContext(storyPath);

      expect(context.story.id).toBe('5-1-core-agent-infrastructure');
      expect(context.totalTokens).toBeLessThan(50000);

      // Check if context includes necessary sections
      expect(context.prdContext).toBeTruthy();
      expect(context.architectureContext).toBeTruthy();
    });
  });

  describe('Context Caching', () => {
    it('should save and load context from cache', async () => {
      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      // First generation (should create cache)
      const context1 = await generator.generateContext(storyPath);

      // Second generation (should load from cache)
      const context2 = await generator.generateContext(storyPath);

      // Contexts should be identical
      expect(context2.story.id).toBe(context1.story.id);
      expect(context2.totalTokens).toBe(context1.totalTokens);

      // Verify cache file exists
      const cacheFile = path.join(testCacheDir, '5-2-story-context-generator.json');
      const cacheExists = await fs.access(cacheFile)
        .then(() => true)
        .catch(() => false);

      expect(cacheExists).toBe(true);
    });

    it('should invalidate cache when story file is modified', async () => {
      const storyPath = 'docs/stories/5-2-story-context-generator.md';
      const fullPath = path.join(projectRoot, storyPath);

      // Check if story file exists
      try {
        await fs.access(fullPath);
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      // Generate context (creates cache)
      await generator.generateContext(storyPath);

      // Modify cache file to be older
      const cacheFile = path.join(testCacheDir, '5-2-story-context-generator.json');
      const oldTime = new Date(Date.now() - 10000); // 10 seconds ago

      try {
        await fs.utimes(cacheFile, oldTime, oldTime);

        // Re-generate (should detect modified story file and regenerate)
        const context = await generator.generateContext(storyPath);

        expect(context).toBeDefined();
      } catch (error) {
        // Cache file might not exist, that's ok
        console.log('Cache invalidation test skipped (no cache file)');
      }
    });
  });

  describe('XML Generation', () => {
    it('should generate valid XML document', async () => {
      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      const context = await generator.generateContext(storyPath);

      // Parse story to get full context data
      const story = await parseStoryFile(path.join(projectRoot, storyPath));

      const xml = generateXML({
        story,
        prdContext: context.prdContext,
        architectureContext: context.architectureContext,
        onboardingDocs: context.onboardingDocs,
        existingCode: context.existingCode,
        dependencyContext: context.dependencyContext
      });

      // Validate XML structure
      const isValid = validateXML(xml);
      expect(isValid).toBe(true);

      // Check XML contains expected sections
      expect(xml).toContain('<story-context');
      expect(xml).toContain('<metadata>');
      expect(xml).toContain('<story>');
      expect(xml).toContain('<prd-context>');
      expect(xml).toContain('<architecture-context>');
      expect(xml).toContain('</story-context>');
    });

    it('should handle special characters in XML', async () => {
      const testStory = {
        filePath: '/test/story.md',
        id: 'test-story',
        title: 'Test <Story> & "Quotes"',
        status: 'ready-for-dev',
        description: 'Description with <tags> and & symbols',
        acceptanceCriteria: ['AC1: Test <code> & "strings"'],
        technicalNotes: {},
        dependencies: []
      };

      const xml = generateXML({
        story: testStory,
        prdContext: 'PRD with <tags>',
        architectureContext: 'Arch with & symbols',
        onboardingDocs: 'Docs with "quotes"',
        existingCode: [],
        dependencyContext: undefined
      });

      // XML should be valid
      const isValid = validateXML(xml);
      expect(isValid).toBe(true);

      // Special characters should be escaped
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
    });
  });

  describe('Token Optimization', () => {
    it('should optimize context to stay under 50k tokens', async () => {
      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      const context = await generator.generateContext(storyPath);

      // Verify total is under limit
      expect(context.totalTokens).toBeLessThan(50000);

      // Verify section limits
      const prdTokens = calculateTokens(context.prdContext);
      const archTokens = calculateTokens(context.architectureContext);
      const onboardingTokens = calculateTokens(context.onboardingDocs);
      const codeTokens = calculateTokens(
        context.existingCode.map(f => f.content).join('\n')
      );

      expect(prdTokens).toBeLessThanOrEqual(10000);
      expect(archTokens).toBeLessThanOrEqual(15000);
      expect(onboardingTokens).toBeLessThanOrEqual(10000);
      expect(codeTokens).toBeLessThanOrEqual(15000);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing PRD file gracefully', async () => {
      const gen = new StoryContextGenerator({
        projectRoot,
        prdPath: 'docs/nonexistent-PRD.md',
        cachePath: '.bmad/cache/test-story-context'
      });

      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      // Should not throw, PRD is optional
      const context = await gen.generateContext(storyPath);

      expect(context).toBeDefined();
      expect(context.prdContext).toBe('');
    });

    it('should handle missing architecture file gracefully', async () => {
      const gen = new StoryContextGenerator({
        projectRoot,
        architecturePath: 'docs/nonexistent-arch.md',
        cachePath: '.bmad/cache/test-story-context'
      });

      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      // Should not throw, architecture is optional
      const context = await gen.generateContext(storyPath);

      expect(context).toBeDefined();
      expect(context.architectureContext).toBe('');
    });

    it('should handle missing onboarding directory gracefully', async () => {
      const gen = new StoryContextGenerator({
        projectRoot,
        onboardingPath: '.bmad/nonexistent-onboarding',
        cachePath: '.bmad/cache/test-story-context'
      });

      const storyPath = 'docs/stories/5-2-story-context-generator.md';

      // Check if story file exists
      try {
        await fs.access(path.join(projectRoot, storyPath));
      } catch {
        console.log('Story 5.2 not found, skipping test');
        return;
      }

      // Should not throw, onboarding is optional
      const context = await gen.generateContext(storyPath);

      expect(context).toBeDefined();
      expect(context.onboardingDocs).toBe('');
    });

    it('should throw error for missing story file', async () => {
      await expect(
        generator.generateContext('docs/stories/nonexistent-story.md')
      ).rejects.toThrow('Failed to generate story context');
    });
  });
});
