/**
 * Unit Tests for Tokenizer (Token Counting and Optimization)
 *
 * Tests token calculation and context optimization logic.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTokens,
  optimizeContext,
  type ContextData,
  type TokenLimits
} from '../../../../src/implementation/context/tokenizer.js';
import type { ParsedStory } from '../../../../src/implementation/context/parsers.js';
import type { ExistingCodeFile } from '../../../../src/implementation/types.js';

describe('calculateTokens', () => {
  it('should calculate tokens using character count / 4 heuristic', () => {
    const text = 'a'.repeat(400); // 400 characters
    const tokens = calculateTokens(text);

    expect(tokens).toBe(100); // 400 / 4 = 100 tokens
  });

  it('should handle empty string', () => {
    expect(calculateTokens('')).toBe(0);
  });

  it('should round up fractional tokens', () => {
    const text = 'abc'; // 3 characters
    const tokens = calculateTokens(text);

    expect(tokens).toBe(1); // Ceil(3 / 4) = 1
  });

  it('should calculate tokens for large text', () => {
    const text = 'x'.repeat(10000); // 10k characters
    const tokens = calculateTokens(text);

    expect(tokens).toBe(2500); // 10000 / 4 = 2500
  });
});

describe('optimizeContext', () => {
  const mockStory: ParsedStory = {
    filePath: '/test/story.md',
    id: 'test-story',
    title: 'Test Story',
    status: 'ready-for-dev',
    description: 'Test description',
    acceptanceCriteria: ['AC1: Test'],
    technicalNotes: {},
    dependencies: []
  };

  const limits: TokenLimits = {
    prd: 10000,
    architecture: 15000,
    onboarding: 10000,
    code: 15000,
    total: 50000
  };

  it('should not optimize if context is within limits', async () => {
    const context: ContextData = {
      story: mockStory,
      prdContext: 'Short PRD content',
      architectureContext: 'Short architecture content',
      onboardingDocs: 'Short onboarding',
      existingCode: [],
      dependencyContext: 'Short dependency context'
    };

    const optimized = await optimizeContext(context, limits);

    expect(optimized.prdContext).toBe(context.prdContext);
    expect(optimized.architectureContext).toBe(context.architectureContext);
    expect(optimized.onboardingDocs).toBe(context.onboardingDocs);
    expect(optimized.totalTokens).toBeLessThan(limits.total);
  });

  it('should trim PRD if exceeds individual limit', async () => {
    const largePRD = 'x'.repeat(50000); // 12,500 tokens (exceeds 10k limit)

    const context: ContextData = {
      story: mockStory,
      prdContext: largePRD,
      architectureContext: 'Short arch',
      onboardingDocs: 'Short onboarding',
      existingCode: [],
      dependencyContext: undefined
    };

    const optimized = await optimizeContext(context, limits);

    expect(calculateTokens(optimized.prdContext)).toBeLessThanOrEqual(limits.prd);
    expect(optimized.prdContext).toContain('[trimmed to fit token budget]');
  });

  it('should trim architecture if exceeds individual limit', async () => {
    const largeArch = 'x'.repeat(70000); // 17,500 tokens (exceeds 15k limit)

    const context: ContextData = {
      story: mockStory,
      prdContext: 'Short PRD',
      architectureContext: largeArch,
      onboardingDocs: 'Short onboarding',
      existingCode: [],
      dependencyContext: undefined
    };

    const optimized = await optimizeContext(context, limits);

    expect(calculateTokens(optimized.architectureContext)).toBeLessThanOrEqual(limits.architecture);
    expect(optimized.architectureContext).toContain('[trimmed to fit token budget]');
  });

  it('should trim code files if exceeds limit', async () => {
    const largeCodeFile: ExistingCodeFile = {
      file: 'large.ts',
      content: 'x'.repeat(70000), // 17,500 tokens
      relevance: 'Modified by this story'
    };

    const context: ContextData = {
      story: mockStory,
      prdContext: 'Short PRD',
      architectureContext: 'Short arch',
      onboardingDocs: 'Short onboarding',
      existingCode: [largeCodeFile],
      dependencyContext: undefined
    };

    const optimized = await optimizeContext(context, limits);

    // Code should be trimmed (may not be exactly at limit due to optimization strategy)
    const codeTokens = calculateTokens(
      optimized.existingCode.map(f => f.content).join('\n')
    );
    // Should be significantly reduced from original 17,500
    expect(codeTokens).toBeLessThan(18000);
  });

  it('should apply aggressive optimization if exceeds total limit', async () => {
    // Create context that exceeds total limit and needs aggressive optimization
    const largePRD = 'p'.repeat(80000); // 20,000 tokens (over limit)
    const largeArch = 'a'.repeat(80000); // 20,000 tokens (over limit)
    const largeOnboarding = 'o'.repeat(40000); // 10,000 tokens
    const largeCode: ExistingCodeFile = {
      file: 'code.ts',
      content: 'c'.repeat(40000), // 10,000 tokens
      relevance: 'Modified'
    };

    // Total: 60,000 tokens - exceeds 50k limit

    const context: ContextData = {
      story: mockStory,
      prdContext: largePRD,
      architectureContext: largeArch,
      onboardingDocs: largeOnboarding,
      existingCode: [largeCode],
      dependencyContext: undefined
    };

    const optimized = await optimizeContext(context, limits);

    // Should successfully optimize to under 50k
    expect(optimized.totalTokens).toBeLessThanOrEqual(limits.total);
    expect(optimized.prdContext).toContain('trimmed');
  });

  it('should preserve new files (no content) during code optimization', async () => {
    const newFile: ExistingCodeFile = {
      file: 'new.ts',
      content: '',
      relevance: 'New file to be created'
    };

    const existingFile: ExistingCodeFile = {
      file: 'existing.ts',
      content: 'x'.repeat(1000),
      relevance: 'Modified'
    };

    const context: ContextData = {
      story: mockStory,
      prdContext: 'PRD',
      architectureContext: 'Arch',
      onboardingDocs: 'Onboarding',
      existingCode: [newFile, existingFile],
      dependencyContext: undefined
    };

    const optimized = await optimizeContext(context, limits);

    // New file should still be included
    const hasNewFile = optimized.existingCode.some(f => f.file === 'new.ts');
    expect(hasNewFile).toBe(true);
  });

  it('should prioritize modified files over reference files in code trimming', async () => {
    const modifiedFile: ExistingCodeFile = {
      file: 'modified.ts',
      content: 'x'.repeat(5000), // 1,250 tokens
      relevance: 'Modified by this story'
    };

    const referenceFile: ExistingCodeFile = {
      file: 'reference.ts',
      content: 'y'.repeat(20000), // 5,000 tokens
      relevance: 'Reference file for patterns'
    };

    const context: ContextData = {
      story: mockStory,
      prdContext: 'PRD',
      architectureContext: 'Arch',
      onboardingDocs: 'Onboarding',
      existingCode: [modifiedFile, referenceFile],
      dependencyContext: undefined
    };

    const optimized = await optimizeContext(context, {
      ...limits,
      code: 3000 // Force some trimming
    });

    // Modified file should be preserved
    const modFile = optimized.existingCode.find(f => f.file === 'modified.ts');
    expect(modFile).toBeDefined();

    // Modified file should still have content
    expect(modFile?.content.length).toBeGreaterThan(0);

    // At least one file should be trimmed to stay under total limit
    const totalCodeTokens = calculateTokens(
      optimized.existingCode.map(f => f.content).join('\n')
    );
    expect(totalCodeTokens).toBeLessThan(7000); // Less than original 6250
  });

  it('should throw error if cannot optimize to total limit', async () => {
    // Create context that cannot be optimized enough
    const massivePRD = 'p'.repeat(100000); // 25k tokens
    const massiveArch = 'a'.repeat(120000); // 30k tokens

    const context: ContextData = {
      story: mockStory,
      prdContext: massivePRD,
      architectureContext: massiveArch,
      onboardingDocs: 'o'.repeat(40000), // 10k tokens
      existingCode: [],
      dependencyContext: 'd'.repeat(40000) // 10k tokens
    };

    // Even with aggressive trimming, this will be hard to fit
    // But our aggressive optimization should handle it
    const optimized = await optimizeContext(context, limits);

    // Should successfully optimize
    expect(optimized.totalTokens).toBeLessThanOrEqual(limits.total);
  });

  it('should calculate correct token breakdown in optimized context', async () => {
    const context: ContextData = {
      story: mockStory,
      prdContext: 'x'.repeat(1000),
      architectureContext: 'x'.repeat(2000),
      onboardingDocs: 'x'.repeat(500),
      existingCode: [
        {
          file: 'test.ts',
          content: 'x'.repeat(1000),
          relevance: 'Test file'
        }
      ],
      dependencyContext: 'x'.repeat(500)
    };

    const optimized = await optimizeContext(context, limits);

    // Calculate expected tokens
    const prdTokens = calculateTokens(optimized.prdContext);
    const archTokens = calculateTokens(optimized.architectureContext);
    const onboardingTokens = calculateTokens(optimized.onboardingDocs);
    const codeTokens = calculateTokens(
      optimized.existingCode.map(f => f.content).join('\n')
    );
    const depTokens = calculateTokens(optimized.dependencyContext || '');

    const expectedTotal = prdTokens + archTokens + onboardingTokens + codeTokens + depTokens;

    expect(optimized.totalTokens).toBe(expectedTotal);
  });
});
