/**
 * Decision Maker
 *
 * Implements decision logic for dual-agent code review.
 * Makes pass/fail/escalate decision based on review results and confidence scores.
 *
 * Decision Rules:
 * - PASS: Both reviews pass AND combined confidence ≥ threshold (default: 0.85)
 * - ESCALATE: Either review fails OR combined confidence < threshold
 * - FAIL: Fixable issues identified → return to Amelia for fixes
 *
 * @module decision-maker
 */

import {
  SelfReviewReport,
  IndependentReviewReport
} from '../types.js';

/**
 * Decision result from review
 */
export interface DecisionResult {
  /** Final decision */
  decision: 'pass' | 'fail' | 'escalate';
  /** Rationale for decision */
  rationale: string;
}

/**
 * Make pass/fail/escalate decision based on reviews
 *
 * Decision logic:
 * 1. Calculate combined confidence (average of Amelia and Alex)
 * 2. Check for critical issues (blockers)
 * 3. Check for high severity security issues
 * 4. Check if both reviews passed
 * 5. Apply confidence threshold
 * 6. Return decision with detailed rationale
 *
 * @param ameliaReview Amelia's self-review report
 * @param alexReview Alex's independent review report
 * @param confidenceThreshold Minimum confidence for pass (default: 0.85)
 * @returns Decision result with rationale
 */
export function makeDecision(
  ameliaReview: SelfReviewReport,
  alexReview: IndependentReviewReport,
  confidenceThreshold: number = 0.85
): DecisionResult {
  log('Making decision', `Threshold: ${confidenceThreshold}`);

  // Calculate combined confidence
  const combinedConfidence = (ameliaReview.confidence + alexReview.confidence) / 2;

  // Collect decision factors
  const factors: string[] = [];
  let decision: 'pass' | 'fail' | 'escalate' = 'pass';

  // Factor 1: Critical issues from Amelia
  if (ameliaReview.criticalIssues.length > 0) {
    factors.push(`${ameliaReview.criticalIssues.length} critical issues identified by Amelia`);
    decision = 'fail';
  }

  // Factor 2: Security review failures
  if (!alexReview.securityReview.passed) {
    const criticalOrHigh = alexReview.securityReview.vulnerabilities.filter(
      v => v.severity === 'critical' || v.severity === 'high'
    );
    if (criticalOrHigh.length > 0) {
      factors.push(`${criticalOrHigh.length} critical/high severity security issues`);
      decision = 'escalate'; // Security issues require human review
    }
  }

  // Factor 3: Test coverage inadequacy
  if (!alexReview.testValidation.coverageAdequate) {
    factors.push('Test coverage below 80% threshold');
    // Only set to fail if not already escalated
    if (decision === 'pass') {
      decision = 'fail'; // Can be fixed by adding tests
    }
  }

  // Factor 4: Overall review decision
  if (alexReview.decision === 'fail') {
    factors.push('Alex independent review failed');
    // Only escalate if not already failed due to fixable issues
    if (decision !== 'fail') {
      decision = 'escalate';
    }
  }

  // Factor 5: Combined confidence below threshold
  if (combinedConfidence < confidenceThreshold) {
    factors.push(
      `Combined confidence (${combinedConfidence.toFixed(2)}) below threshold (${confidenceThreshold})`
    );
    // Escalate if confidence is low, even if other checks passed
    if (decision === 'pass') {
      decision = 'escalate';
    }
  }

  // Factor 6: Both reviews passed and confidence high
  if (decision === 'pass' &&
      ameliaReview.criticalIssues.length === 0 &&
      alexReview.securityReview.passed &&
      alexReview.testValidation.coverageAdequate &&
      combinedConfidence >= confidenceThreshold) {
    factors.push('Both reviews passed with high confidence');
    factors.push(`Security score: ${alexReview.securityReview.score}`);
    factors.push(`Quality score: ${alexReview.qualityAnalysis.score}`);
    factors.push(`Test validation score: ${alexReview.testValidation.score}`);
  }

  // Build rationale
  const rationale = buildRationale(decision, factors, combinedConfidence);

  log('Decision made', `${decision} (confidence: ${combinedConfidence.toFixed(2)})`);

  return {
    decision,
    rationale
  };
}

/**
 * Build detailed rationale for decision
 *
 * @param decision Final decision
 * @param factors List of decision factors
 * @param combinedConfidence Combined confidence score
 * @returns Formatted rationale string
 */
function buildRationale(
  decision: 'pass' | 'fail' | 'escalate',
  factors: string[],
  combinedConfidence: number
): string {
  const lines: string[] = [];

  // Decision header
  if (decision === 'pass') {
    lines.push('✅ PASS - Ready for PR creation');
  } else if (decision === 'fail') {
    lines.push('❌ FAIL - Requires fixes before proceeding');
  } else {
    lines.push('⚠️ ESCALATE - Human review required');
  }

  // Combined confidence
  lines.push(`\nCombined Confidence: ${(combinedConfidence * 100).toFixed(1)}%`);

  // Decision factors
  if (factors.length > 0) {
    lines.push('\nKey Factors:');
    factors.forEach(factor => {
      lines.push(`  • ${factor}`);
    });
  }

  // Next steps
  lines.push('\nNext Steps:');
  if (decision === 'pass') {
    lines.push('  1. Proceed to PR creation');
    lines.push('  2. Include review report in PR description');
  } else if (decision === 'fail') {
    lines.push('  1. Return to Amelia for fixes');
    lines.push('  2. Re-run review after fixes applied');
  } else {
    lines.push('  1. Human review required');
    lines.push('  2. Review findings and make manual decision');
    lines.push('  3. Consider security implications and code quality concerns');
  }

  return lines.join('\n');
}

/**
 * Log message
 *
 * @param message Log message
 * @param detail Optional detail
 */
function log(message: string, detail?: string): void {
  const detailStr = detail ? ` (${detail})` : '';
  console.log(`[DecisionMaker] ${message}${detailStr}`);
}
