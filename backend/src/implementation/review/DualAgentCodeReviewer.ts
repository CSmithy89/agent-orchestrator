/**
 * Dual-Agent Code Reviewer
 *
 * Coordinates Amelia's self-review with Alex's independent review to make
 * autonomous pass/fail decisions for story implementations.
 *
 * Features:
 * - Amelia self-review with critical issue auto-fix
 * - Alex independent review (security, quality, test validation)
 * - Aggregated findings and decision logic
 * - Performance metrics tracking
 * - Integration with WorkflowOrchestrator
 *
 * Decision Logic:
 * - Pass: Both reviews pass AND combined confidence >0.85
 * - Escalate: Either review fails OR combined confidence <0.85
 * - Fail: Fixable issues identified → return to Amelia for fixes
 *
 * @example
 * ```typescript
 * const reviewer = new DualAgentCodeReviewer(amelia, alex, logger);
 * const result = await reviewer.performDualReview(code, tests, context);
 *
 * if (result.decision === 'pass') {
 *   // Proceed to PR creation
 * } else if (result.decision === 'escalate') {
 *   // Human review required
 * } else {
 *   // Return to Amelia for fixes
 * }
 * ```
 */

import { AmeliaAgentInfrastructure } from '../agents/amelia.js';
import { AlexAgentInfrastructure } from '../agents/alex.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite,
  CombinedReviewResult,
  SelfReviewReport,
  IndependentReviewReport,
  ReviewFinding,
  ReviewMetrics
} from '../types.js';
import { executeSelfReview } from './self-review-executor.js';
import { executeIndependentReview } from './independent-review-executor.js';
import { makeDecision } from './decision-maker.js';
import { MetricsTracker } from './metrics-tracker.js';

/**
 * Dual-Agent Code Reviewer
 *
 * Orchestrates comprehensive code review using two agents with different perspectives.
 */
export class DualAgentCodeReviewer {
  /** Amelia agent for self-review and auto-fix */
  private readonly ameliaAgent: AmeliaAgentInfrastructure;

  /** Alex agent for independent review */
  private readonly alexAgent: AlexAgentInfrastructure;

  /** Confidence threshold for pass/fail decision (default: 0.85) */
  private readonly confidenceThreshold: number;

  /**
   * Create a new Dual-Agent Code Reviewer
   *
   * @param ameliaAgent Amelia agent infrastructure
   * @param alexAgent Alex agent infrastructure
   * @param options Optional configuration
   */
  constructor(
    ameliaAgent: AmeliaAgentInfrastructure,
    alexAgent: AlexAgentInfrastructure,
    options?: {
      confidenceThreshold?: number;
    }
  ) {
    this.ameliaAgent = ameliaAgent;
    this.alexAgent = alexAgent;

    // Validate confidence threshold to prevent NaN
    if (options?.confidenceThreshold !== undefined) {
      this.confidenceThreshold = options.confidenceThreshold;
    } else {
      const envValue = process.env.REVIEW_CONFIDENCE_THRESHOLD;
      const parsed = envValue !== undefined ? Number(envValue) : 0.85;
      // Ensure valid number between 0 and 1, fallback to 0.85 if invalid
      this.confidenceThreshold =
        Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 0.85;
    }
  }

  /**
   * Perform dual-agent code review
   *
   * Complete review pipeline:
   * 1. Amelia self-review → identify critical issues
   * 2. Auto-fix critical issues (if any)
   * 3. Alex independent review (security, quality, tests)
   * 4. Aggregate findings and make decision
   *
   * @param code Code implementation to review
   * @param tests Test suite with coverage
   * @param context Story context for review guidance
   * @returns Combined review result with pass/fail/escalate decision
   * @throws Error if review fails at any phase
   */
  async performDualReview(
    code: CodeImplementation,
    tests: TestSuite,
    context: StoryContext
  ): Promise<CombinedReviewResult> {
    this.log('INFO', 'Starting dual-agent code review', context.story.id);

    const metrics = new MetricsTracker();
    metrics.startTotal();

    try {
      // Phase 1: Amelia Self-Review
      this.log('INFO', 'Phase 1: Amelia self-review', 'Starting');
      metrics.startAmelia();

      const ameliaReview = await executeSelfReview(
        this.ameliaAgent,
        code,
        tests,
        context
      );

      metrics.endAmelia();
      this.log('INFO', 'Phase 1: Amelia self-review',
        `Complete (confidence: ${ameliaReview.confidence.toFixed(2)})`);

      // Phase 2: Alex Independent Review
      this.log('INFO', 'Phase 2: Alex independent review', 'Starting');
      metrics.startAlex();

      const alexReview = await executeIndependentReview(
        this.alexAgent,
        code,
        tests,
        context,
        ameliaReview
      );

      metrics.endAlex();
      this.log('INFO', 'Phase 2: Alex independent review',
        `Complete (confidence: ${alexReview.confidence.toFixed(2)})`);

      // Phase 3: Decision Logic
      this.log('INFO', 'Phase 3: Decision logic', 'Starting');
      metrics.startDecision();

      const decision = makeDecision(
        ameliaReview,
        alexReview,
        this.confidenceThreshold
      );

      metrics.endDecision();
      this.log('INFO', 'Phase 3: Decision logic',
        `Complete (decision: ${decision.decision})`);

      // Phase 4: Aggregate Results
      const combinedScore = this.calculateCombinedScore(ameliaReview, alexReview);
      const combinedConfidence = this.calculateCombinedConfidence(ameliaReview, alexReview);
      const findings = this.aggregateFindings(ameliaReview, alexReview);
      const recommendations = this.aggregateRecommendations(ameliaReview, alexReview);

      metrics.endTotal();

      const result: CombinedReviewResult = {
        ameliaReview,
        alexReview,
        combinedScore,
        combinedConfidence,
        decision: decision.decision,
        decisionRationale: decision.rationale,
        findings,
        recommendations,
        metrics: metrics.getMetrics(findings)
      };

      this.logMetrics(result.metrics);
      this.log('INFO', 'Dual-agent code review complete',
        `Decision: ${result.decision}, Confidence: ${result.combinedConfidence.toFixed(2)}`);

      return result;
    } catch (error) {
      metrics.endTotal();
      this.log('ERROR', 'Dual-agent code review failed', (error as Error).message);
      throw new Error(
        `Dual-agent code review failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Calculate combined quality score
   *
   * Weighted average: 30% Amelia confidence, 70% Alex overall score
   *
   * @param ameliaReview Amelia's self-review
   * @param alexReview Alex's independent review
   * @returns Combined score (0.0-1.0)
   */
  private calculateCombinedScore(
    ameliaReview: SelfReviewReport,
    alexReview: IndependentReviewReport
  ): number {
    // Weight Amelia's confidence at 30%, Alex's overall score at 70%
    return ameliaReview.confidence * 0.3 + alexReview.overallScore * 0.7;
  }

  /**
   * Calculate combined confidence score
   *
   * Average of Amelia and Alex confidence scores
   *
   * @param ameliaReview Amelia's self-review
   * @param alexReview Alex's independent review
   * @returns Combined confidence (0.0-1.0)
   */
  private calculateCombinedConfidence(
    ameliaReview: SelfReviewReport,
    alexReview: IndependentReviewReport
  ): number {
    return (ameliaReview.confidence + alexReview.confidence) / 2;
  }

  /**
   * Aggregate findings from both reviews
   *
   * Combines and deduplicates findings from Amelia and Alex
   *
   * @param ameliaReview Amelia's self-review
   * @param alexReview Alex's independent review
   * @returns Aggregated findings
   */
  private aggregateFindings(
    ameliaReview: SelfReviewReport,
    alexReview: IndependentReviewReport
  ): ReviewFinding[] {
    const findings: ReviewFinding[] = [];

    // Add Amelia's code smells as findings
    ameliaReview.codeSmells.forEach(smell => {
      findings.push({
        category: 'quality',
        severity: smell.severity === 'high' ? 'high' :
                  smell.severity === 'medium' ? 'medium' : 'low',
        title: `Code Smell: ${smell.type}`,
        description: smell.recommendation,
        location: smell.location,
        recommendation: smell.recommendation
      });
    });

    // Add Amelia's critical issues as critical findings
    ameliaReview.criticalIssues.forEach(issue => {
      findings.push({
        category: 'quality',
        severity: 'critical',
        title: 'Critical Issue',
        description: issue,
        location: 'multiple',
        recommendation: 'Fix immediately before proceeding'
      });
    });

    // Add all Alex's findings
    findings.push(...alexReview.findings);

    return findings;
  }

  /**
   * Aggregate recommendations from both reviews
   *
   * @param ameliaReview Amelia's self-review
   * @param alexReview Alex's independent review
   * @returns Aggregated recommendations
   */
  private aggregateRecommendations(
    ameliaReview: SelfReviewReport,
    alexReview: IndependentReviewReport
  ): string[] {
    const recommendations: string[] = [];

    // Add Amelia's code smell recommendations
    ameliaReview.codeSmells.forEach(smell => {
      recommendations.push(smell.recommendation);
    });

    // Add Alex's recommendations
    recommendations.push(...alexReview.recommendations);

    // Deduplicate
    return Array.from(new Set(recommendations));
  }

  /**
   * Log metrics for performance monitoring
   *
   * @param metrics Review metrics
   */
  private logMetrics(metrics: ReviewMetrics): void {
    this.log('INFO', 'Review Metrics', JSON.stringify({
      totalTime: `${metrics.totalTime}ms`,
      ameliaTime: `${metrics.ameliaTime}ms`,
      alexTime: `${metrics.alexTime}ms`,
      decisionTime: `${metrics.decisionTime}ms`,
      findingsCount: metrics.findingsCount,
      reviewIterations: metrics.reviewIterations
    }, null, 2));
  }

  /**
   * Log message
   *
   * @param level Log level
   * @param message Log message
   * @param detail Optional detail
   */
  private log(level: 'INFO' | 'ERROR', message: string, detail?: string): void {
    const detailStr = detail ? ` - ${detail}` : '';
    console.log(`[DualAgentCodeReviewer] [${level}] ${message}${detailStr}`);
  }
}
