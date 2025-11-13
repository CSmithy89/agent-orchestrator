/**
 * Unit Tests for StoryContextGenerator
 *
 * Tests the main context generator class including:
 * - Context generation orchestration
 * - Caching behavior
 * - Token optimization
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StoryContextGenerator } from '../../../../src/implementation/context/StoryContextGenerator.js';
import type { StoryContext } from '../../../../src/implementation/types.js';

// Mock fs module
vi.mock('fs/promises');

describe('StoryContextGenerator', () => {
  let generator: StoryContextGenerator;
  const projectRoot = '/test/project';

  beforeEach(() => {
    generator = new StoryContextGenerator({
      projectRoot
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create generator with default config', () => {
      const gen = new StoryContextGenerator({ projectRoot });
      expect(gen).toBeInstanceOf(StoryContextGenerator);
    });

    it('should create generator with custom config', () => {
      const gen = new StoryContextGenerator({
        projectRoot,
        prdPath: 'custom/PRD.md',
        enableCache: false
      });
      expect(gen).toBeInstanceOf(StoryContextGenerator);
    });
  });

  describe('generateContext', () => {
    it('should generate complete context for story', async () => {
      // Mock story file
      const storyContent = `# Story 5.2: Test Story

Status: ready-for-dev

## Story

As a **developer**,
I want **to test context generation**,
so that **I can verify it works**.

## Acceptance Criteria

### AC1: Context Generated
- [ ] Context includes all sections
- [ ] Token count under limit

## Dev Notes

### Architecture Alignment
Tests the context generation system.

### File Structure:
- backend/src/test.ts
`;

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('5-2-test-story.md')) {
          return storyContent;
        }
        if (filePath.includes('PRD.md')) {
          return '# PRD\n\nTest PRD content';
        }
        if (filePath.includes('architecture.md')) {
          return '# Architecture\n\nTest architecture';
        }
        throw new Error(`File not found: ${filePath}`);
      });

      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          // Cache doesn't exist
          throw { code: 'ENOENT' };
        }
        return {
          mtime: new Date(),
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      const context = await generator.generateContext('docs/stories/5-2-test-story.md');

      expect(context).toBeDefined();
      expect(context.story.id).toBe('5-2-test-story');
      expect(context.story.title).toContain('Test Story');
      expect(context.story.acceptanceCriteria).toHaveLength(1);
      expect(context.totalTokens).toBeGreaterThan(0);
      expect(context.totalTokens).toBeLessThan(50000);
    });

    it('should load context from cache if valid', async () => {
      const cachedContext: StoryContext = {
        story: {
          id: '5-2-test-story',
          title: 'Cached Story',
          description: 'Cached description',
          acceptanceCriteria: ['AC1: Cached'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: 'Cached PRD',
        architectureContext: 'Cached Arch',
        onboardingDocs: 'Cached Onboarding',
        existingCode: [],
        totalTokens: 1000
      };

      // Mock cache file newer than story file
      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          return {
            mtime: new Date(Date.now() + 1000), // Cache is newer
            isDirectory: () => false
          } as any;
        }
        return {
          mtime: new Date(),
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          return JSON.stringify(cachedContext);
        }
        throw new Error('Should not read story file if cache is valid');
      });

      const context = await generator.generateContext('docs/stories/5-2-test-story.md');

      expect(context).toEqual(cachedContext);
      expect(fs.readFile).toHaveBeenCalledTimes(1); // Only cache file
    });

    it('should invalidate cache if story file modified', async () => {
      const storyContent = '# Story\n\nTest content';

      // Mock story file newer than cache
      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          return {
            mtime: new Date(Date.now() - 1000), // Cache is older
            isDirectory: () => false
          } as any;
        }
        return {
          mtime: new Date(), // Story is newer
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('5-2-test-story.md')) {
          return storyContent;
        }
        if (filePath.includes('PRD.md')) {
          return '# PRD\n\nContent';
        }
        if (filePath.includes('architecture.md')) {
          return '# Arch\n\nContent';
        }
        throw new Error(`Unexpected file: ${filePath}`);
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      const context = await generator.generateContext('docs/stories/5-2-test-story.md');

      expect(context).toBeDefined();
      // Should have read story file and generated new context
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('5-2-test-story.md'),
        'utf-8'
      );
    });

    it('should save generated context to cache', async () => {
      const storyContent = '# Story 5.2\n\nTest';

      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          throw { code: 'ENOENT' };
        }
        return {
          mtime: new Date(),
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('5-2-test-story.md')) {
          return storyContent;
        }
        return '# Content';
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      await generator.generateContext('docs/stories/5-2-test-story.md');

      // Should have created cache directory
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('.bmad/cache/story-context'),
        { recursive: true }
      );

      // Should have written cache file
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('5-2-test-story.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle story file not found error', async () => {
      vi.mocked(fs.stat).mockRejectedValue({ code: 'ENOENT' });
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

      await expect(
        generator.generateContext('docs/stories/nonexistent.md')
      ).rejects.toThrow('Failed to generate story context');
    });

    it('should optimize context if exceeds token limit', async () => {
      // Create large content that exceeds limits
      const largePRD = '# PRD\n\n' + 'Large PRD content. '.repeat(10000);
      const largeArch = '# Architecture\n\n' + 'Large architecture. '.repeat(10000);

      const storyContent = '# Story 5.2\n\nTest story';

      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          throw { code: 'ENOENT' };
        }
        return {
          mtime: new Date(),
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('5-2-test-story.md')) {
          return storyContent;
        }
        if (filePath.includes('PRD.md')) {
          return largePRD;
        }
        if (filePath.includes('architecture.md')) {
          return largeArch;
        }
        return '';
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      const context = await generator.generateContext('docs/stories/5-2-test-story.md');

      // Should be optimized to under 50k tokens
      expect(context.totalTokens).toBeLessThan(50000);

      // Should have trimmed content
      expect(context.prdContext).toContain('[trimmed to fit token budget]');
      expect(context.architectureContext).toContain('[trimmed to fit token budget]');
    });
  });

  describe('caching', () => {
    it('should not use cache when disabled', async () => {
      const gen = new StoryContextGenerator({
        projectRoot,
        enableCache: false
      });

      const storyContent = '# Story 5.2\n\nTest';

      vi.mocked(fs.stat).mockResolvedValue({
        mtime: new Date(),
        isDirectory: () => false
      } as any);

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (filePath.includes('5-2-test-story.md')) {
          return storyContent;
        }
        return '# Content';
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      await gen.generateContext('docs/stories/5-2-test-story.md');

      // Should not have tried to write cache
      expect(fs.writeFile).not.toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle cache read errors gracefully', async () => {
      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          throw new Error('Permission denied');
        }
        return {
          mtime: new Date(),
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readFile).mockImplementation(async () => {
        return '# Story 5.2\n\nTest';
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      // Should not throw, should generate context anyway
      const context = await generator.generateContext('docs/stories/5-2-test-story.md');
      expect(context).toBeDefined();
    });

    it('should handle cache write errors gracefully', async () => {
      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => {
        if (filePath.includes('.json')) {
          throw { code: 'ENOENT' };
        }
        return {
          mtime: new Date(),
          isDirectory: () => false
        } as any;
      });

      vi.mocked(fs.readFile).mockImplementation(async () => {
        return '# Story 5.2\n\nTest';
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'));
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });

      // Should not throw, cache failure is not critical
      const context = await generator.generateContext('docs/stories/5-2-test-story.md');
      expect(context).toBeDefined();
    });
  });
});
