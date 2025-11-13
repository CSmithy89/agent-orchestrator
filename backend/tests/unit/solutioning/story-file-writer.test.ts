/**
 * Unit tests for StoryFileWriter
 *
 * Tests story file writing, epics document generation, and batch operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoryFileWriter } from '../../../src/solutioning/story-file-writer.js';
import type { Story, Epic } from '../../../src/solutioning/types.js';
import type { SolutioningResult } from '../../../src/solutioning/story-file-writer.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('StoryFileWriter', () => {
  let writer: StoryFileWriter;
  let mockStory: Story;
  let mockEpic: Epic;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock fs.writeFile to succeed by default
    vi.mocked(fs.writeFile).mockResolvedValue();

    // Mock fs.mkdir to succeed by default
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);

    // Create writer instance
    writer = new StoryFileWriter();

    // Create mock story
    mockStory = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Solutioning Data Models',
      description: 'As a developer, I want data models, So that I can build features.',
      acceptance_criteria: [
        'Interfaces defined',
        'Tests passing',
      ],
      dependencies: ['3-1'],
      status: 'backlog',
      technical_notes: {
        affected_files: ['types.ts'],
        endpoints: [],
        data_structures: ['Epic', 'Story'],
        test_requirements: 'Unit tests',
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    // Create mock epic
    mockEpic = {
      id: 'epic-4',
      title: 'Solutioning Phase Automation',
      goal: 'Automate epic formation and story decomposition',
      value_proposition: 'Reduce manual planning effort',
      stories: [mockStory],
      business_value: '15 hours saved per sprint',
      estimated_duration: '2-3 sprints',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('writeStoryFile', () => {
    it('should write story file with correct file name', async () => {
      const filePath = await writer.writeStoryFile(mockStory, mockEpic);

      expect(filePath).toBe('docs/stories/4-1-solutioning-data-models.md');
      expect(fs.mkdir).toHaveBeenCalledWith('docs/stories', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        'docs/stories/4-1-solutioning-data-models.md',
        expect.any(String),
        'utf-8'
      );
    });

    it('should generate markdown with proper structure', async () => {
      await writer.writeStoryFile(mockStory, mockEpic);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('# Story 4.1: Solutioning Data Models');
      expect(markdown).toContain('Status: backlog');
      expect(markdown).toContain('## Story');
      expect(markdown).toContain('As a developer,');
      expect(markdown).toContain('## Acceptance Criteria');
      expect(markdown).toContain('1. Interfaces defined');
      expect(markdown).toContain('2. Tests passing');
      expect(markdown).toContain('## Dependencies');
      expect(markdown).toContain('## Dev Notes');
      expect(markdown).toContain('## Change Log');
      expect(markdown).toContain('## Dev Agent Record');
    });

    it('should handle long story titles by truncating', async () => {
      const longTitleStory = {
        ...mockStory,
        title: 'This Is A Very Long Story Title That Exceeds Fifty Characters And Should Be Truncated For File System Compatibility',
      };

      const filePath = await writer.writeStoryFile(longTitleStory, mockEpic);

      // File name should be truncated to 50 chars after kebab-case
      expect(filePath).toMatch(/^docs\/stories\/4-1-.{1,50}\.md$/);
      expect(filePath.length).toBeLessThan(100);
    });

    it('should convert title to kebab-case correctly', async () => {
      const specialCharStory = {
        ...mockStory,
        title: 'User Authentication & Authorization!',
      };

      const filePath = await writer.writeStoryFile(specialCharStory, mockEpic);

      expect(filePath).toBe('docs/stories/4-1-user-authentication-authorization.md');
    });

    it('should create directory if it does not exist', async () => {
      await writer.writeStoryFile(mockStory, mockEpic);

      expect(fs.mkdir).toHaveBeenCalledWith('docs/stories', { recursive: true });
    });

    it('should throw error if file write fails', async () => {
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Disk full'));

      await expect(writer.writeStoryFile(mockStory, mockEpic)).rejects.toThrow(
        'Failed to write story file for 4-1'
      );
    });

    it('should handle story with no dependencies', async () => {
      const noDepsStory = {
        ...mockStory,
        dependencies: [],
      };

      await writer.writeStoryFile(noDepsStory, mockEpic);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('**Blocking Dependencies:**');
      // Should not have dependency list items
    });
  });

  describe('writeEpicsDocument', () => {
    it('should write epics document with correct structure', async () => {
      const filePath = await writer.writeEpicsDocument([mockEpic]);

      expect(filePath).toBe('docs/epics.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        'docs/epics.md',
        expect.any(String),
        'utf-8'
      );
    });

    it('should generate header with aggregate metrics', async () => {
      await writer.writeEpicsDocument([mockEpic]);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('# Epics Overview');
      expect(markdown).toMatch(/Generated: \d{4}-\d{2}-\d{2}/);
      expect(markdown).toContain('Total Epics: 1');
      expect(markdown).toContain('Total Stories: 1');
    });

    it('should format epic sections correctly', async () => {
      await writer.writeEpicsDocument([mockEpic]);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('## Epic 4: Solutioning Phase Automation');
      expect(markdown).toContain('**Goal**: Automate epic formation and story decomposition');
      expect(markdown).toContain('**Value Proposition**: Reduce manual planning effort');
      expect(markdown).toContain('**Business Value**: 15 hours saved per sprint');
      expect(markdown).toContain('**Estimated Duration**: 2-3 sprints');
      expect(markdown).toContain('**Stories**: 1 stories');
    });

    it('should list stories with details', async () => {
      await writer.writeEpicsDocument([mockEpic]);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('### Stories:');
      expect(markdown).toContain('1. Story 4.1: Solutioning Data Models (8 hours, medium)');
    });

    it('should handle multiple epics with separators', async () => {
      const epic2: Epic = {
        id: 'epic-5',
        title: 'Story Implementation Automation',
        goal: 'Automate story development',
        value_proposition: 'Faster development',
        stories: [],
        business_value: '20 hours saved per sprint',
        estimated_duration: '3-4 sprints',
      };

      await writer.writeEpicsDocument([mockEpic, epic2]);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('## Epic 4: Solutioning Phase Automation');
      expect(markdown).toContain('---');
      expect(markdown).toContain('## Epic 5: Story Implementation Automation');
      expect(markdown).toContain('Total Epics: 2');
      expect(markdown).toContain('Total Stories: 1');
    });

    it('should not add separator after last epic', async () => {
      await writer.writeEpicsDocument([mockEpic]);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      // Should not end with separator
      expect(markdown.trim().endsWith('---')).toBe(false);
    });

    it('should return null if write fails', async () => {
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Disk full'));

      const filePath = await writer.writeEpicsDocument([mockEpic]);

      expect(filePath).toBeNull();
    });

    it('should handle epic with multiple stories', async () => {
      const story2: Story = {
        ...mockStory,
        id: '4-2',
        title: 'Bob Agent Infrastructure',
        estimated_hours: 6,
        complexity: 'high',
      };

      const epicWithStories: Epic = {
        ...mockEpic,
        stories: [mockStory, story2],
      };

      await writer.writeEpicsDocument([epicWithStories]);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const markdown = writeCall?.[1] as string;

      expect(markdown).toContain('**Stories**: 2 stories');
      expect(markdown).toContain('1. Story 4.1: Solutioning Data Models (8 hours, medium)');
      expect(markdown).toContain('2. Story 4.2: Bob Agent Infrastructure (6 hours, high)');
    });
  });

  describe('writeAllStoryFiles', () => {
    it('should write all story files and epics document', async () => {
      const story2: Story = {
        ...mockStory,
        id: '4-2',
        title: 'Bob Agent Infrastructure',
      };

      const epicWithStories: Epic = {
        ...mockEpic,
        stories: [mockStory, story2],
      };

      const result: SolutioningResult = {
        epics: [epicWithStories],
        stories: [mockStory, story2],
      };

      const summary = await writer.writeAllStoryFiles(result);

      expect(summary.storiesWritten).toBe(2);
      expect(summary.epicsDocumentWritten).toBe(true);
      expect(summary.storyFilePaths).toHaveLength(2);
      expect(summary.epicsDocumentPath).toBe('docs/epics.md');
      expect(summary.storiesFailed).toBe(0);
      expect(summary.errors).toHaveLength(0);
    });

    it('should return WriteSummary with correct structure', async () => {
      const result: SolutioningResult = {
        epics: [mockEpic],
        stories: [mockStory],
      };

      const summary = await writer.writeAllStoryFiles(result);

      expect(summary).toMatchObject({
        storiesWritten: expect.any(Number),
        epicsDocumentWritten: expect.any(Boolean),
        storyFilePaths: expect.any(Array),
        epicsDocumentPath: expect.any(String),
        storiesFailed: expect.any(Number),
        errors: expect.any(Array),
      });
    });

    it('should handle partial failures gracefully', async () => {
      const story2: Story = {
        ...mockStory,
        id: '4-2',
        title: 'Bob Agent Infrastructure',
      };

      const epicWithStories: Epic = {
        ...mockEpic,
        stories: [mockStory, story2],
      };

      const result: SolutioningResult = {
        epics: [epicWithStories],
        stories: [mockStory, story2],
      };

      // First write succeeds, second fails
      vi.mocked(fs.writeFile)
        .mockResolvedValueOnce() // First story succeeds
        .mockRejectedValueOnce(new Error('Disk full')) // Second story fails
        .mockResolvedValueOnce(); // Epics document succeeds

      const summary = await writer.writeAllStoryFiles(result);

      expect(summary.storiesWritten).toBe(1);
      expect(summary.storiesFailed).toBe(1);
      expect(summary.errors).toHaveLength(1);
      expect(summary.errors[0]).toContain('Story 4-2');
      expect(summary.epicsDocumentWritten).toBe(true);
    });

    it('should continue writing even if epics document fails', async () => {
      const result: SolutioningResult = {
        epics: [mockEpic],
        stories: [mockStory],
      };

      // Story write succeeds, epics document fails
      vi.mocked(fs.writeFile)
        .mockResolvedValueOnce() // Story succeeds
        .mockRejectedValueOnce(new Error('Permission denied')); // Epics fails

      const summary = await writer.writeAllStoryFiles(result);

      expect(summary.storiesWritten).toBe(1);
      expect(summary.epicsDocumentWritten).toBe(false);
      expect(summary.epicsDocumentPath).toBeNull();
      expect(summary.errors).toHaveLength(1);
    });

    it('should handle empty epics array', async () => {
      const result: SolutioningResult = {
        epics: [],
        stories: [],
      };

      const summary = await writer.writeAllStoryFiles(result);

      expect(summary.storiesWritten).toBe(0);
      expect(summary.storyFilePaths).toHaveLength(0);
      // Epics document should still be written (even if empty)
      expect(summary.epicsDocumentWritten).toBe(true);
    });

    it('should collect all file paths correctly', async () => {
      const story2: Story = {
        ...mockStory,
        id: '4-2',
        title: 'Bob Agent Infrastructure',
      };

      const epicWithStories: Epic = {
        ...mockEpic,
        stories: [mockStory, story2],
      };

      const result: SolutioningResult = {
        epics: [epicWithStories],
        stories: [mockStory, story2],
      };

      const summary = await writer.writeAllStoryFiles(result);

      expect(summary.storyFilePaths).toContain('docs/stories/4-1-solutioning-data-models.md');
      expect(summary.storyFilePaths).toContain('docs/stories/4-2-bob-agent-infrastructure.md');
      expect(summary.epicsDocumentPath).toBe('docs/epics.md');
    });
  });

  describe('Custom paths', () => {
    it('should use custom stories directory', async () => {
      const customWriter = new StoryFileWriter('custom/stories', 'custom/epics.md');

      await customWriter.writeStoryFile(mockStory, mockEpic);

      expect(fs.mkdir).toHaveBeenCalledWith('custom/stories', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        'custom/stories/4-1-solutioning-data-models.md',
        expect.any(String),
        'utf-8'
      );
    });

    it('should use custom epics file path', async () => {
      const customWriter = new StoryFileWriter('custom/stories', 'custom/epics.md');

      await customWriter.writeEpicsDocument([mockEpic]);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'custom/epics.md',
        expect.any(String),
        'utf-8'
      );
    });
  });
});
