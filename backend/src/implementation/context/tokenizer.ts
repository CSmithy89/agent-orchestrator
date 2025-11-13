/**
 * Tokenizer - Token counting and context optimization
 *
 * Uses character count / 4 heuristic (industry standard, accurate within 10% for GPT-style models).
 * Implements optimization strategy to stay under 50k token target.
 */

import { logger } from '../../utils/logger.js';
import { ExistingCodeFile } from '../types.js';
import { ParsedStory } from './parsers.js';

/**
 * Context data for optimization
 */
export interface ContextData {
  story: ParsedStory;
  prdContext: string;
  architectureContext: string;
  onboardingDocs: string;
  existingCode: ExistingCodeFile[];
  dependencyContext?: string;
}

/**
 * Optimized context data
 */
export interface OptimizedContext {
  prdContext: string;
  architectureContext: string;
  onboardingDocs: string;
  existingCode: ExistingCodeFile[];
  dependencyContext?: string;
  totalTokens: number;
}

/**
 * Token limits configuration
 */
export interface TokenLimits {
  prd: number;
  architecture: number;
  onboarding: number;
  code: number;
  total: number;
}

/**
 * Calculate approximate token count for text
 *
 * Uses character count / 4 heuristic (industry standard for GPT-style models).
 * This is accurate within 10% for English text.
 *
 * @param text Text to count tokens for
 * @returns Approximate token count
 */
export function calculateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Optimize context to stay within token limits
 *
 * Optimization strategy (trim in this priority order):
 * 1. PRD (often verbose, can be trimmed)
 * 2. Architecture (detailed, can focus on essentials)
 * 3. Existing code (preserve most critical files)
 * 4. Onboarding (important for quality, keep unless desperate)
 * 5. Dependency context (critical for correctness, preserve)
 *
 * @param context Context data to optimize
 * @param limits Token limits for each section
 * @returns Optimized context within limits
 * @throws Error if cannot achieve total limit even after aggressive optimization
 */
export async function optimizeContext(
  context: ContextData,
  limits: TokenLimits
): Promise<OptimizedContext> {
  // Calculate initial token counts
  const prdTokens = calculateTokens(context.prdContext);
  const archTokens = calculateTokens(context.architectureContext);
  const onboardingTokens = calculateTokens(context.onboardingDocs);
  const codeTokens = calculateTokens(
    context.existingCode.map(f => f.content).join('\n')
  );
  const depTokens = calculateTokens(context.dependencyContext || '');
  const totalTokens = prdTokens + archTokens + onboardingTokens + codeTokens + depTokens;

  logger.info('Initial token counts', {
    prd: prdTokens,
    architecture: archTokens,
    onboarding: onboardingTokens,
    code: codeTokens,
    dependency: depTokens,
    total: totalTokens,
    limit: limits.total
  });

  // Start optimization
  let optimizedPrd = context.prdContext;
  let optimizedArch = context.architectureContext;
  let optimizedOnboarding = context.onboardingDocs;
  let optimizedCode = context.existingCode;
  const optimizedDep = context.dependencyContext;

  // Phase 1: Trim PRD if exceeds individual limit
  if (prdTokens > limits.prd) {
    logger.info('Trimming PRD context', {
      current: prdTokens,
      limit: limits.prd
    });
    optimizedPrd = trimToTokenLimit(context.prdContext, limits.prd);
  }

  // Phase 2: Trim architecture if exceeds individual limit
  if (archTokens > limits.architecture) {
    logger.info('Trimming architecture context', {
      current: archTokens,
      limit: limits.architecture
    });
    optimizedArch = trimToTokenLimit(context.architectureContext, limits.architecture);
  }

  // Phase 3: Trim onboarding if exceeds individual limit
  if (onboardingTokens > limits.onboarding) {
    logger.info('Trimming onboarding docs', {
      current: onboardingTokens,
      limit: limits.onboarding
    });
    optimizedOnboarding = trimToTokenLimit(context.onboardingDocs, limits.onboarding);
  }

  // Phase 4: Trim code if exceeds individual limit
  const currentCodeTokens = calculateTokens(
    context.existingCode.map(f => f.content).join('\n')
  );
  if (currentCodeTokens > limits.code) {
    logger.info('Trimming code files', {
      current: currentCodeTokens,
      limit: limits.code
    });
    optimizedCode = trimCodeFiles(context.existingCode, limits.code);
  }

  // Recalculate total after individual trims
  let newTotal =
    calculateTokens(optimizedPrd) +
    calculateTokens(optimizedArch) +
    calculateTokens(optimizedOnboarding) +
    calculateTokens(optimizedCode.map(f => f.content).join('\n')) +
    calculateTokens(optimizedDep || '');

  // Check if optimization needed for total
  if (newTotal <= limits.total) {
    logger.info('Context within token limits after individual optimization', {
      original: totalTokens,
      optimized: newTotal
    });
    return {
      prdContext: optimizedPrd,
      architectureContext: optimizedArch,
      onboardingDocs: optimizedOnboarding,
      existingCode: optimizedCode,
      dependencyContext: optimizedDep,
      totalTokens: newTotal
    };
  }

  // Phase 5: If still over total limit, apply aggressive optimization
  logger.warn('Still over limit after individual trims, applying aggressive optimization', {
    current: newTotal,
    limit: limits.total
  });

  if (newTotal > limits.total) {

    const excess = newTotal - limits.total;
    const excessChars = excess * 4; // Convert to characters

    // Priority 1: Further trim PRD (50% of excess)
    const prdTrim = Math.floor(excessChars * 0.5);
    if (prdTrim > 0 && optimizedPrd.length > prdTrim) {
      optimizedPrd = optimizedPrd.slice(0, optimizedPrd.length - prdTrim) +
        '\n\n... [aggressively trimmed to fit token budget]';
    }

    // Priority 2: Further trim architecture (30% of excess)
    const archTrim = Math.floor(excessChars * 0.3);
    if (archTrim > 0 && optimizedArch.length > archTrim) {
      optimizedArch = optimizedArch.slice(0, optimizedArch.length - archTrim) +
        '\n\n... [aggressively trimmed to fit token budget]';
    }

    // Priority 3: Trim code files (20% of excess)
    const codeTrim = Math.floor(excessChars * 0.2);
    if (codeTrim > 0) {
      const currentCodeSize = optimizedCode.reduce((sum, f) => sum + f.content.length, 0);
      if (currentCodeSize > codeTrim) {
        const newLimit = Math.floor((currentCodeSize - codeTrim) / 4); // Convert to tokens
        optimizedCode = trimCodeFiles(optimizedCode, newLimit);
      }
    }

    // Recalculate final total
    newTotal =
      calculateTokens(optimizedPrd) +
      calculateTokens(optimizedArch) +
      calculateTokens(optimizedOnboarding) +
      calculateTokens(optimizedCode.map(f => f.content).join('\n')) +
      calculateTokens(optimizedDep || '');
  }

  // Final check
  if (newTotal > limits.total) {
    logger.error('Cannot optimize context to fit token limit', undefined, {
      current: newTotal,
      limit: limits.total
    });
    throw new Error(
      `Context optimization failed: ${newTotal} tokens exceeds limit of ${limits.total} tokens. ` +
      'Consider increasing token limits or simplifying the story scope.'
    );
  }

  logger.info('Context optimization complete', {
    original: totalTokens,
    optimized: newTotal,
    saved: totalTokens - newTotal,
    prd: calculateTokens(optimizedPrd),
    architecture: calculateTokens(optimizedArch),
    onboarding: calculateTokens(optimizedOnboarding),
    code: calculateTokens(optimizedCode.map(f => f.content).join('\n')),
    dependency: calculateTokens(optimizedDep || '')
  });

  return {
    prdContext: optimizedPrd,
    architectureContext: optimizedArch,
    onboardingDocs: optimizedOnboarding,
    existingCode: optimizedCode,
    dependencyContext: optimizedDep,
    totalTokens: newTotal
  };
}

/**
 * Trim text to token limit
 */
function trimToTokenLimit(text: string, tokenLimit: number): string {
  const currentTokens = calculateTokens(text);

  if (currentTokens <= tokenLimit) {
    return text;
  }

  // Reserve tokens for the trimmed message suffix
  const suffixMessage = '\n\n... [trimmed to fit token budget]';
  const suffixTokens = calculateTokens(suffixMessage);
  const availableTokens = tokenLimit - suffixTokens;

  // Calculate character limit (1 token ≈ 4 chars)
  const charLimit = availableTokens * 4;

  // Trim to character limit
  const trimmed = text.slice(0, charLimit);

  // Try to end at a paragraph or sentence boundary
  const lastParagraph = trimmed.lastIndexOf('\n\n');
  const lastSentence = trimmed.lastIndexOf('. ');

  if (lastParagraph > charLimit * 0.8) {
    return trimmed.slice(0, lastParagraph) + suffixMessage;
  } else if (lastSentence > charLimit * 0.8) {
    return trimmed.slice(0, lastSentence + 1) + suffixMessage;
  }

  return trimmed + suffixMessage;
}

/**
 * Trim code files to stay within token limit
 *
 * Strategy:
 * 1. Preserve new files (to be created) - show as empty
 * 2. Preserve modified files with full content (highest priority)
 * 3. Trim reference files (lowest priority)
 *
 * @param codeFiles Array of code files
 * @param tokenLimit Token limit for code files
 * @returns Trimmed code files
 */
function trimCodeFiles(
  codeFiles: ExistingCodeFile[],
  tokenLimit: number
): ExistingCodeFile[] {
  // Separate files by category
  const newFiles = codeFiles.filter(f => !f.content);
  const modifiedFiles = codeFiles.filter(
    f => f.content && f.relevance.includes('modified')
  );
  const referenceFiles = codeFiles.filter(
    f => f.content && !f.relevance.includes('modified')
  );

  const result: ExistingCodeFile[] = [];
  let usedTokens = 0;

  // Always include new files (they have no content)
  result.push(...newFiles);

  // Include modified files (highest priority)
  for (const file of modifiedFiles) {
    const fileTokens = calculateTokens(file.content);

    if (usedTokens + fileTokens <= tokenLimit) {
      result.push(file);
      usedTokens += fileTokens;
    } else {
      // Trim this file to fit remaining budget
      const remaining = tokenLimit - usedTokens;
      if (remaining > 100) {
        // Only include if we have at least 100 tokens left
        result.push({
          ...file,
          content: trimToTokenLimit(file.content, remaining),
          relevance: file.relevance + ' (truncated to fit budget)'
        });
        usedTokens = tokenLimit;
      }
      break; // No more room
    }
  }

  // Include reference files if room remains
  for (const file of referenceFiles) {
    const fileTokens = calculateTokens(file.content);

    if (usedTokens + fileTokens <= tokenLimit) {
      result.push(file);
      usedTokens += fileTokens;
    } else {
      // Try to include truncated version
      const remaining = tokenLimit - usedTokens;
      if (remaining > 100) {
        result.push({
          ...file,
          content: trimToTokenLimit(file.content, remaining),
          relevance: file.relevance + ' (truncated to fit budget)'
        });
        usedTokens = tokenLimit;
      }
      break; // No more room
    }
  }

  logger.info('Code files trimmed', {
    original: codeFiles.length,
    kept: result.length,
    new: newFiles.length,
    modified: modifiedFiles.filter(f => result.includes(f)).length,
    reference: referenceFiles.filter(f => result.includes(f)).length
  });

  return result;
}
