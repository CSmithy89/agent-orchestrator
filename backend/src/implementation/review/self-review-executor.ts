/**
 * Self-Review Executor
 *
 * Executes Amelia's self-review with critical issue auto-fix.
 * Amelia reviews her own code before handoff to Alex for independent review.
 *
 * Features:
 * - Self-review checklist validation
 * - Code smell detection
 * - Acceptance criteria verification
 * - Critical issue identification and auto-fix
 * - Confidence score calculation
 *
 * @module self-review-executor
 */

import { AmeliaAgentInfrastructure } from '../agents/amelia.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite,
  SelfReviewReport
} from '../types.js';

/**
 * Execute Amelia's self-review with critical issue auto-fix
 *
 * Pipeline:
 * 1. Invoke Amelia.reviewCode() to get self-review report
 * 2. Identify critical issues (blockers)
 * 3. If critical issues found: auto-fix and re-validate
 * 4. Return final self-review report
 *
 * @param ameliaAgent Amelia agent infrastructure
 * @param code Code implementation to review
 * @param tests Test suite with coverage
 * @param context Story context for review guidance
 * @returns Self-review report with confidence score
 * @throws Error if self-review fails or auto-fix fails
 */
export async function executeSelfReview(
  ameliaAgent: AmeliaAgentInfrastructure,
  code: CodeImplementation,
  _tests: TestSuite,
  context: StoryContext
): Promise<SelfReviewReport> {
  log('Starting Amelia self-review', code.files.length);

  try {
    // Step 1: Invoke Amelia's reviewCode() method
    const initialReview = await ameliaAgent.reviewCode(code);

    log('Self-review complete',
      `Confidence: ${initialReview.confidence.toFixed(2)}, ` +
      `Critical issues: ${initialReview.criticalIssues.length}`);

    // Step 2: Check for critical issues
    if (initialReview.criticalIssues.length > 0) {
      log('Critical issues detected', initialReview.criticalIssues.length);

      // Note: Auto-fix would be implemented here in production
      // For now, we return the review with critical issues flagged
      // The decision logic will handle escalation

      // TODO (Story 5.7): Implement auto-fix with Amelia.implementFixes()
      // const fixedCode = await ameliaAgent.implementFixes(initialReview.criticalIssues);
      // const reReview = await ameliaAgent.reviewCode(fixedCode);
      // return reReview;
    }

    // Step 3: Validate self-review completeness
    validateSelfReview(initialReview, context);

    return initialReview;
  } catch (error) {
    log('Self-review failed', (error as Error).message);
    throw new Error(
      `Self-review execution failed: ${(error as Error).message}`
    );
  }
}

/**
 * Validate self-review report completeness
 *
 * Ensures all required sections are present and valid.
 *
 * @param review Self-review report to validate
 * @param context Story context for validation
 * @throws Error if validation fails
 */
function validateSelfReview(
  review: SelfReviewReport,
  _context: StoryContext
): void {
  // Validate checklist exists
  if (!review.checklist || review.checklist.length === 0) {
    throw new Error('Self-review checklist is empty');
  }

  // Validate acceptance criteria check
  if (!review.acceptanceCriteriaCheck || review.acceptanceCriteriaCheck.length === 0) {
    log('Warning: No acceptance criteria checks found', 'Continuing');
  }

  // Validate confidence is in valid range
  if (review.confidence < 0 || review.confidence > 1) {
    throw new Error(`Invalid confidence score: ${review.confidence}`);
  }

  // Validate code smells are categorized
  review.codeSmells.forEach(smell => {
    if (!['long-function', 'duplication', 'poor-naming', 'complexity', 'other'].includes(smell.type)) {
      log('Warning: Unknown code smell type', smell.type);
    }
    if (!['low', 'medium', 'high'].includes(smell.severity)) {
      throw new Error(`Invalid code smell severity: ${smell.severity}`);
    }
  });

  log('Self-review validation passed', 'All checks complete');
}

/**
 * Log message
 *
 * @param message Log message
 * @param detail Optional detail
 */
function log(message: string, detail?: string | number): void {
  const detailStr = detail !== undefined ? ` (${detail})` : '';
  console.log(`[SelfReviewExecutor] ${message}${detailStr}`);
}
