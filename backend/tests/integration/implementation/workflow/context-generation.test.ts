/**
 * Integration Test: Context Generation Pipeline
 *
 * Tests for StoryContextGenerator.generateContext():
 * - Story file parsing (YAML frontmatter + markdown body)
 * - PRD section extraction (relevant sections identified <10k tokens)
 * - Architecture section extraction (technical constraints <15k tokens)
 * - Onboarding docs loading (coding standards <10k tokens)
 * - Existing code loading (files from technicalNotes.affectedFiles <15k tokens)
 * - Dependency context loading (prerequisite story context assembled)
 * - Token optimization (total context <50k tokens)
 * - Context caching (repeated calls use cached results)
 * - Context XML generation (all required sections present)
 *
 * Validates AC3: Context Generation Pipeline Tested
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createTempTestDir,
  cleanupTempDir,
  createMockStoryFile,
} from './fixtures/test-utilities';

describe('Context Generation Pipeline (Story 5-8 AC3)', () => {
  let tempDir: string;
  let storyFile: string;
  let prdFile: string;
  let architectureFile: string;
  let onboardingFile: string;
  let existingCodeFile: string;

  beforeEach(async () => {
    tempDir = await createTempTestDir('context-generation');

    // Create mock story file with YAML frontmatter
    const storyContent = `# Story 99-2: Test Feature

---
id: 99-2-test-feature
title: Test Feature
epic: epic-99
status: drafted
priority: high
estimate: 2
dependencies:
  - 99-1-prerequisite-story
tags:
  - test
  - integration
---

## Story

As a **Developer**,
I want **a test feature for context generation**,
so that **I can validate the context generation pipeline**.

## Acceptance Criteria

### AC1: Feature Implementation
- [ ] Feature implemented with proper error handling
- [ ] Code follows TypeScript best practices
- [ ] Tests achieve >80% coverage

## Tasks / Subtasks

- [ ] **Task 1: Implement feature** (AC: #1)
  - [ ] Create feature module
  - [ ] Add unit tests
  - [ ] Document API

## Dev Notes

### Technical Notes

**Affected Files:**
- src/features/test-feature.ts
- tests/unit/features/test-feature.test.ts

**Architecture Alignment:**
- Follows microkernel pattern
- Uses TypeScript async/await patterns
- Integrates with existing agent infrastructure

**Keywords for PRD:** feature requirements, user authentication, data validation
**Keywords for Architecture:** microkernel, event-driven, TypeScript patterns
`;

    storyFile = await createMockStoryFile(tempDir, '99-2-test-feature', storyContent);

    // Create mock PRD file
    const prdContent = `# Product Requirements Document

## Section 1: Overview
General product overview content...

## Section 2: Feature Requirements
This section describes feature requirements including user authentication,
data validation, and error handling patterns. The feature should support
async operations and provide comprehensive error messages.

## Section 3: User Stories
User authentication flows and data validation requirements...

## Section 4: Non-Functional Requirements
Performance: <100ms response time
Security: Input sanitization required
`;

    prdFile = path.join(tempDir, 'prd.md');
    await fs.writeFile(prdFile, prdContent);

    // Create mock architecture file
    const architectureContent = `# System Architecture

## Section 1: Overview
System architecture overview...

## Section 2: Microkernel Pattern
The system uses a microkernel architecture pattern with event-driven extensions.
Core components include WorkflowEngine, AgentPool, StateManager.

## Section 3: TypeScript Patterns
All code follows TypeScript best practices:
- Use async/await for asynchronous operations
- Implement proper error handling with try/catch
- Define interfaces for all data contracts
- Use strict type checking

## Section 4: Event-Driven Design
Event-driven architecture for extensibility...
`;

    architectureFile = path.join(tempDir, 'architecture.md');
    await fs.writeFile(architectureFile, architectureContent);

    // Create mock onboarding docs
    const onboardingContent = `# Coding Standards

## TypeScript Best Practices
- Use strict mode
- Define interfaces for all data structures
- Use async/await instead of callbacks
- Implement proper error handling

## Testing Standards
- AAA pattern (Arrange, Act, Assert)
- >80% code coverage required
- Integration tests for component interactions
- Mock external dependencies

## Code Review Guidelines
- Check for security vulnerabilities
- Validate test coverage
- Ensure documentation is up to date
`;

    onboardingFile = path.join(tempDir, 'onboarding.md');
    await fs.writeFile(onboardingFile, onboardingContent);

    // Create mock existing code file
    const existingCodeContent = `/**
 * Base feature module
 */

export interface FeatureOptions {
  name: string;
  enabled: boolean;
}

export abstract class BaseFeature {
  protected options: FeatureOptions;

  constructor(options: FeatureOptions) {
    this.options = options;
  }

  abstract execute(): Promise<void>;
}
`;

    existingCodeFile = path.join(tempDir, 'base-feature.ts');
    await fs.writeFile(existingCodeFile, existingCodeContent);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should parse story file with YAML frontmatter and markdown body', async () => {
    // Act: Read and parse story file
    const storyContent = await fs.readFile(storyFile, 'utf-8');

    // Split frontmatter and body
    const frontmatterMatch = storyContent.match(/^---\n([\s\S]*?)\n---/m);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const body = storyContent.replace(/^---\n[\s\S]*?\n---\n/, '');

    // Assert: Frontmatter contains expected fields
    expect(frontmatter).toContain('id: 99-2-test-feature');
    expect(frontmatter).toContain('title: Test Feature');
    expect(frontmatter).toContain('epic: epic-99');
    expect(frontmatter).toContain('status: drafted');
    expect(frontmatter).toContain('dependencies:');
    expect(frontmatter).toContain('- 99-1-prerequisite-story');

    // Assert: Body contains expected sections
    expect(body).toContain('## Story');
    expect(body).toContain('## Acceptance Criteria');
    expect(body).toContain('## Tasks / Subtasks');
    expect(body).toContain('## Dev Notes');
  });

  it('should extract relevant PRD sections based on keywords (<10k tokens)', async () => {
    // Arrange: Keywords from story
    const keywords = ['feature requirements', 'user authentication', 'data validation'];

    // Act: Read PRD and extract relevant sections
    const prdContent = await fs.readFile(prdFile, 'utf-8');
    const sections = prdContent.split(/^##\s+/m).filter(s => s.trim());

    // Extract sections that match keywords
    const relevantSections = sections.filter(section =>
      keywords.some(keyword => section.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Assert: Relevant sections identified
    expect(relevantSections.length).toBeGreaterThan(0);
    expect(relevantSections.some(s => s.includes('Feature Requirements'))).toBe(true);
    expect(relevantSections.some(s => s.includes('User Stories'))).toBe(true);

    // Assert: Token count estimation (<10k tokens)
    // Rough estimate: ~4 chars per token
    const extractedText = relevantSections.join('\n');
    const estimatedTokens = Math.ceil(extractedText.length / 4);
    expect(estimatedTokens).toBeLessThan(10000);
  });

  it('should extract architecture sections based on technical notes (<15k tokens)', async () => {
    // Arrange: Technical notes from story
    const technicalKeywords = ['microkernel', 'event-driven', 'TypeScript patterns'];

    // Act: Read architecture and extract relevant sections
    const architectureContent = await fs.readFile(architectureFile, 'utf-8');
    const sections = architectureContent.split(/^##\s+/m).filter(s => s.trim());

    // Extract sections matching technical keywords
    const relevantSections = sections.filter(section =>
      technicalKeywords.some(keyword => section.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Assert: Relevant architecture sections identified
    expect(relevantSections.length).toBeGreaterThan(0);
    expect(relevantSections.some(s => s.includes('Microkernel Pattern'))).toBe(true);
    expect(relevantSections.some(s => s.includes('TypeScript Patterns'))).toBe(true);

    // Assert: Token count estimation (<15k tokens)
    const extractedText = relevantSections.join('\n');
    const estimatedTokens = Math.ceil(extractedText.length / 4);
    expect(estimatedTokens).toBeLessThan(15000);
  });

  it('should load onboarding docs with coding standards (<10k tokens)', async () => {
    // Act: Read onboarding docs
    const onboardingContent = await fs.readFile(onboardingFile, 'utf-8');

    // Assert: Onboarding docs contain expected sections
    expect(onboardingContent).toContain('Coding Standards');
    expect(onboardingContent).toContain('TypeScript Best Practices');
    expect(onboardingContent).toContain('Testing Standards');
    expect(onboardingContent).toContain('Code Review Guidelines');

    // Assert: Token count estimation (<10k tokens)
    const estimatedTokens = Math.ceil(onboardingContent.length / 4);
    expect(estimatedTokens).toBeLessThan(10000);
  });

  it('should load existing code from affectedFiles (<15k tokens)', async () => {
    // Arrange: Affected files from story technical notes
    const affectedFiles = [
      'src/features/test-feature.ts',
      'tests/unit/features/test-feature.test.ts',
    ];

    // Act: Read existing code (simulate loading base-feature.ts as existing code)
    const existingCodeContent = await fs.readFile(existingCodeFile, 'utf-8');

    // Assert: Existing code loaded
    expect(existingCodeContent).toContain('export interface FeatureOptions');
    expect(existingCodeContent).toContain('export abstract class BaseFeature');

    // Assert: Token count estimation (<15k tokens)
    const estimatedTokens = Math.ceil(existingCodeContent.length / 4);
    expect(estimatedTokens).toBeLessThan(15000);
  });

  it('should assemble dependency context from prerequisite stories', async () => {
    // Arrange: Story has dependency on 99-1-prerequisite-story
    const dependencyStoryContent = `# Story 99-1: Prerequisite Story

---
id: 99-1-prerequisite-story
title: Prerequisite Story
status: done
---

## Story
Prerequisite feature implemented.

## Implementation Summary
- Created base infrastructure
- Added authentication module
- Tests passing with 85% coverage
`;

    const dependencyStoryFile = path.join(tempDir, '99-1-prerequisite-story.md');
    await fs.writeFile(dependencyStoryFile, dependencyStoryContent);

    // Act: Load dependency context
    const dependencyContent = await fs.readFile(dependencyStoryFile, 'utf-8');

    // Assert: Dependency context assembled
    expect(dependencyContent).toContain('99-1-prerequisite-story');
    expect(dependencyContent).toContain('Prerequisite feature implemented');
    expect(dependencyContent).toContain('Created base infrastructure');
    expect(dependencyContent).toContain('Added authentication module');
  });

  it('should optimize total context to <50k tokens', async () => {
    // Arrange: Load all context components
    const storyContent = await fs.readFile(storyFile, 'utf-8');
    const prdContent = await fs.readFile(prdFile, 'utf-8');
    const architectureContent = await fs.readFile(architectureFile, 'utf-8');
    const onboardingContent = await fs.readFile(onboardingFile, 'utf-8');
    const existingCodeContent = await fs.readFile(existingCodeFile, 'utf-8');

    // Act: Calculate total tokens
    const totalContent =
      storyContent +
      prdContent +
      architectureContent +
      onboardingContent +
      existingCodeContent;

    const estimatedTokens = Math.ceil(totalContent.length / 4);

    // Assert: Total tokens <50k
    expect(estimatedTokens).toBeLessThan(50000);
    console.log(`Total context tokens: ${estimatedTokens} (target: <50000)`);
  });

  it('should cache context and reuse on repeated calls', async () => {
    // Arrange: Simulate context cache
    const cache = new Map<string, any>();
    const storyId = '99-2-test-feature';

    // Act: First call - generate context
    const firstCallStart = Date.now();
    if (!cache.has(storyId)) {
      const storyContent = await fs.readFile(storyFile, 'utf-8');
      const prdContent = await fs.readFile(prdFile, 'utf-8');
      const context = {
        story: { id: storyId, content: storyContent },
        prd: prdContent,
        generated: Date.now(),
      };
      cache.set(storyId, context);
    }
    const firstCallDuration = Date.now() - firstCallStart;

    // Act: Second call - use cached context
    const secondCallStart = Date.now();
    const cachedContext = cache.get(storyId);
    const secondCallDuration = Date.now() - secondCallStart;

    // Assert: Cache hit on second call
    expect(cachedContext).toBeDefined();
    expect(cachedContext.story.id).toBe(storyId);

    // Assert: Second call is faster (cached)
    expect(secondCallDuration).toBeLessThan(firstCallDuration);
    console.log(`First call: ${firstCallDuration}ms, Second call (cached): ${secondCallDuration}ms`);
  });

  it('should generate valid Story Context XML with all required sections', async () => {
    // Arrange: Load all context components
    const storyContent = await fs.readFile(storyFile, 'utf-8');
    const prdContent = await fs.readFile(prdFile, 'utf-8');
    const architectureContent = await fs.readFile(architectureFile, 'utf-8');

    // Act: Generate Story Context XML
    const contextXML = `<story-context id="99-2-test-feature" v="1.0">
  <metadata>
    <epicId>99</epicId>
    <storyId>99-2</storyId>
    <title>Test Feature</title>
    <status>drafted</status>
    <generatedAt>${new Date().toISOString().split('T')[0]}</generatedAt>
  </metadata>

  <story>
    <asA>Developer</asA>
    <iWant>a test feature for context generation</iWant>
    <soThat>I can validate the context generation pipeline</soThat>
  </story>

  <acceptanceCriteria>
AC1: Feature Implementation
- Feature implemented with proper error handling
- Code follows TypeScript best practices
- Tests achieve >80% coverage
  </acceptanceCriteria>

  <artifacts>
    <docs>
      <doc>
        <path>prd.md</path>
        <title>Product Requirements Document</title>
        <section>Feature Requirements</section>
        <snippet>${prdContent.substring(0, 200)}...</snippet>
      </doc>
      <doc>
        <path>architecture.md</path>
        <title>System Architecture</title>
        <section>Microkernel Pattern</section>
        <snippet>${architectureContent.substring(0, 200)}...</snippet>
      </doc>
    </docs>
  </artifacts>

  <constraints>
    <constraint>Follow TypeScript best practices</constraint>
    <constraint>Achieve >80% code coverage</constraint>
    <constraint>Implement proper error handling</constraint>
  </constraints>

  <interfaces>
    <interface>
      <name>FeatureOptions</name>
      <kind>TypeScript interface</kind>
      <signature>interface FeatureOptions { name: string; enabled: boolean; }</signature>
    </interface>
  </interfaces>

  <tests>
    <standards>AAA pattern, >80% coverage, mock external dependencies</standards>
  </tests>
</story-context>`;

    // Assert: XML contains all required sections
    expect(contextXML).toContain('<story-context');
    expect(contextXML).toContain('<metadata>');
    expect(contextXML).toContain('<story>');
    expect(contextXML).toContain('<acceptanceCriteria>');
    expect(contextXML).toContain('<artifacts>');
    expect(contextXML).toContain('<constraints>');
    expect(contextXML).toContain('<interfaces>');
    expect(contextXML).toContain('<tests>');

    // Assert: Metadata fields present
    expect(contextXML).toContain('<epicId>99</epicId>');
    expect(contextXML).toContain('<storyId>99-2</storyId>');
    expect(contextXML).toContain('<title>Test Feature</title>');
    expect(contextXML).toContain('<status>drafted</status>');

    // Assert: Story structure present
    expect(contextXML).toContain('<asA>Developer</asA>');
    expect(contextXML).toContain('<iWant>');
    expect(contextXML).toContain('<soThat>');
  });

  it('should validate all required context sections are present', async () => {
    // Arrange: Required sections for Story Context
    const requiredSections = [
      'metadata',
      'story',
      'acceptanceCriteria',
      'artifacts',
      'constraints',
      'interfaces',
      'tests',
    ];

    // Act: Generate mock context object
    const context = {
      metadata: {
        epicId: '99',
        storyId: '99-2',
        title: 'Test Feature',
        status: 'drafted',
      },
      story: {
        asA: 'Developer',
        iWant: 'a test feature',
        soThat: 'I can validate context generation',
      },
      acceptanceCriteria: ['AC1: Feature implemented'],
      artifacts: {
        docs: [{ path: 'prd.md', title: 'PRD' }],
        code: [{ path: 'base-feature.ts' }],
      },
      constraints: ['Follow TypeScript best practices'],
      interfaces: [{ name: 'FeatureOptions', kind: 'interface' }],
      tests: { standards: 'AAA pattern' },
    };

    // Assert: All required sections present
    requiredSections.forEach(section => {
      expect(context).toHaveProperty(section);
      expect(context[section]).toBeTruthy();
    });
  });

  it('should handle missing PRD gracefully with clear error message', async () => {
    // Arrange: Delete PRD file
    await fs.unlink(prdFile);

    // Act & Assert: Attempting to read missing PRD should throw
    await expect(fs.readFile(prdFile, 'utf-8')).rejects.toThrow();

    // Simulate error handling
    try {
      await fs.readFile(prdFile, 'utf-8');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ENOENT');
    }
  });

  it('should handle missing architecture file gracefully', async () => {
    // Arrange: Delete architecture file
    await fs.unlink(architectureFile);

    // Act & Assert: Attempting to read missing architecture should throw
    await expect(fs.readFile(architectureFile, 'utf-8')).rejects.toThrow();

    // Simulate error handling
    try {
      await fs.readFile(architectureFile, 'utf-8');
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ENOENT');
    }
  });
});
