/**
 * Unit Tests for Story File Parsers
 *
 * Tests story file parsing including:
 * - YAML frontmatter parsing
 * - Story description extraction
 * - Acceptance criteria parsing
 * - Technical notes extraction
 * - Dependency extraction
 * - Task parsing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import { parseStoryFile } from '../../../../src/implementation/context/parsers.js';

// Mock fs module
vi.mock('fs/promises');

describe('parseStoryFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse complete story file', async () => {
    const storyContent = `# Story 5.2: Story Context Generator

Status: ready-for-dev

## Story

As a **Story Implementation Orchestrator**,
I want **a Story Context Generator that assembles comprehensive technical context**,
so that **Amelia agent has all necessary context to implement stories**.

## Acceptance Criteria

### AC1: StoryContextGenerator Class Implemented
- [ ] StoryContextGenerator class created
- [ ] generateContext() method implemented

### AC2: Story File Parsed
- [ ] YAML frontmatter parsed
- [ ] Story statement extracted

## Dev Notes

### Architecture Alignment
Integrates with Epic 1 core infrastructure.

### Key Design Decisions
- XML format for context
- Token optimization strategy

### File Structure:
\`\`\`
src/implementation/context/
  ├── StoryContextGenerator.ts
  └── parsers.ts
\`\`\`

### References
- [Epic 5 Tech Spec](docs/epics/epic-5-tech-spec.md)

## Tasks / Subtasks

- [ ] **Task 1: Create StoryContextGenerator** (AC: #1)
  - [ ] Implement constructor
  - [ ] Implement generateContext()
- [ ] **Task 2: Parse story file** (AC: #2)
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/stories/5-2-story-context-generator.md');

    expect(story.id).toBe('5-2-story-context-generator');
    expect(story.title).toContain('Story Context Generator');
    expect(story.status).toBe('ready-for-dev');
    expect(story.description).toContain('Story Implementation Orchestrator');
    expect(story.acceptanceCriteria).toHaveLength(2);
    expect(story.acceptanceCriteria[0]).toContain('StoryContextGenerator Class Implemented');
    expect(story.technicalNotes).toBeDefined();
    expect(story.technicalNotes?.architectureAlignment).toContain('Epic 1');
    expect(story.technicalNotes?.designDecisions).toHaveLength(2);
    expect(story.technicalNotes?.affectedFiles).toContain('src/implementation/context/StoryContextGenerator.ts');
    expect(story.technicalNotes?.references).toHaveLength(1);
    expect(story.tasks).toHaveLength(4); // 2 tasks + 2 subtasks
  });

  it('should extract story description in As a... I want... format', async () => {
    const storyContent = `# Story 1.1

## Story

As a **developer**,
I want **to parse stories**,
so that **I can extract information**.
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-test.md');

    expect(story.description).toBe(
      'As a developer, I want to parse stories, so that I can extract information'
    );
  });

  it('should parse acceptance criteria with checkboxes', async () => {
    const storyContent = `# Story 1.1

## Acceptance Criteria

### AC1: First Criterion
- [ ] Item 1
- [ ] Item 2

### AC2: Second Criterion
- [ ] Item 3
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-test.md');

    expect(story.acceptanceCriteria).toHaveLength(2);
    expect(story.acceptanceCriteria[0]).toContain('First Criterion');
    expect(story.acceptanceCriteria[0]).toContain('Item 1');
    expect(story.acceptanceCriteria[0]).toContain('Item 2');
    expect(story.acceptanceCriteria[1]).toContain('Second Criterion');
  });

  it('should extract affected files from file structure', async () => {
    const storyContent = `# Story 1.1

## Dev Notes

### File Structure:
\`\`\`
src/
  ├── main.ts
  └── utils.ts
\`\`\`

Also modifying src/config/config.ts
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-test.md');

    expect(story.technicalNotes?.affectedFiles).toBeDefined();
    expect(story.technicalNotes?.affectedFiles).toContain('main.ts');
    expect(story.technicalNotes?.affectedFiles).toContain('utils.ts');
    expect(story.technicalNotes?.affectedFiles).toContain('src/config/config.ts');
  });

  it('should extract design patterns mentioned in dev notes', async () => {
    const storyContent = `# Story 1.1

## Dev Notes

Uses the singleton pattern for state management and factory pattern for object creation.
Also implements the microkernel architecture.
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-test.md');

    expect(story.technicalNotes?.patterns).toBeDefined();
    expect(story.technicalNotes?.patterns).toContain('singleton');
    expect(story.technicalNotes?.patterns).toContain('factory');
    expect(story.technicalNotes?.patterns).toContain('microkernel');
  });

  it('should extract constraints from dev notes', async () => {
    const storyContent = `# Story 1.1

## Dev Notes

IMPORTANT: Must validate all inputs.
CRITICAL: Token count MUST be under 50k.
This is a REQUIRED feature.
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-test.md');

    expect(story.technicalNotes?.constraints).toBeDefined();
    expect(story.technicalNotes?.constraints).toHaveLength(3);
    expect(story.technicalNotes?.constraints?.[0]).toContain('IMPORTANT');
    expect(story.technicalNotes?.constraints?.[1]).toContain('CRITICAL');
  });

  it('should extract dependencies from dev notes', async () => {
    const storyContent = `# Story 5.2

## Dev Notes

This story depends on Story 5.1 (core-agent-infrastructure).
Also depends on Story 4.9.
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/5-2-test.md');

    expect(story.dependencies).toBeDefined();
    expect(story.dependencies).toContain('5-1');
    expect(story.dependencies).toContain('4-9');
  });

  it('should parse tasks and subtasks with hierarchy', async () => {
    const storyContent = `# Story 1.1

## Tasks / Subtasks

- [ ] **Task 1: Main task**
  - [ ] Subtask 1.1
  - [ ] Subtask 1.2
- [ ] **Task 2: Second task**
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-test.md');

    expect(story.tasks).toHaveLength(4);
    expect(story.tasks?.[0]).toContain('Task 1');
    expect(story.tasks?.[1]).toContain('Subtask 1.1');
    expect(story.tasks?.[2]).toContain('Subtask 1.2');
    expect(story.tasks?.[3]).toContain('Task 2');
  });

  it('should handle story with YAML frontmatter', async () => {
    const storyContent = `---
status: ready-for-dev
epic: 5
dependencies:
  - 5-1-core-agent-infrastructure
---

# Story 5.2: Test Story

## Story

As a developer, I want to test parsing.
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/5-2-test.md');

    expect(story.status).toBe('ready-for-dev');
  });

  it('should handle minimal story file', async () => {
    const storyContent = `# Story 1.1: Minimal Story

Status: backlog
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/1-1-minimal.md');

    expect(story.id).toBe('1-1-minimal');
    expect(story.title).toContain('Minimal Story');
    expect(story.status).toBe('backlog');
    expect(story.description).toBe('');
    expect(story.acceptanceCriteria).toHaveLength(0);
  });

  it('should handle malformed story file gracefully', async () => {
    const storyContent = `This is not a valid story file.
No headings or structure.
`;

    vi.mocked(fs.readFile).mockResolvedValue(storyContent);

    const story = await parseStoryFile('/test/malformed.md');

    expect(story.id).toBe('malformed');
    expect(story.status).toBe('unknown');
    expect(story.description).toBe('');
  });

  it('should throw error if file not found', async () => {
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

    await expect(
      parseStoryFile('/test/nonexistent.md')
    ).rejects.toThrow('Story file not found');
  });

  it('should throw error on file read failure', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

    await expect(
      parseStoryFile('/test/forbidden.md')
    ).rejects.toThrow('Failed to parse story file');
  });
});
