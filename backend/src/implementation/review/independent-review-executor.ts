/**
 * Independent Review Executor
 *
 * Executes Alex's independent review with security, quality, and test validation.
 * Alex provides fresh perspective using different LLM than Amelia.
 *
 * Features:
 * - Security review (OWASP Top 10)
 * - Code quality analysis (complexity, maintainability, smells)
 * - Test coverage validation (>80% target)
 * - Comprehensive report generation
 * - Independent analysis (no shared state with Amelia)
 *
 * @module independent-review-executor
 */

import { AlexAgentInfrastructure } from '../agents/alex.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite,
  SelfReviewReport,
  IndependentReviewReport,
  SecurityReview,
  QualityAnalysis,
  TestValidation,
  Review
} from '../types.js';

/**
 * Execute Alex's independent review
 *
 * Pipeline:
 * 1. Security review (OWASP Top 10 vulnerability detection)
 * 2. Quality analysis (complexity, maintainability, code smells)
 * 3. Test validation (coverage adequacy, test quality)
 * 4. Generate comprehensive review report
 * 5. Make pass/fail decision based on findings
 *
 * @param alexAgent Alex agent infrastructure
 * @param code Code implementation to review
 * @param tests Test suite with coverage
 * @param context Story context for review guidance
 * @param ameliaReview Amelia's self-review (for context, not bias)
 * @returns Independent review report with decision
 * @throws Error if any review phase fails
 */
export async function executeIndependentReview(
  alexAgent: AlexAgentInfrastructure,
  code: CodeImplementation,
  tests: TestSuite,
  context: StoryContext,
  ameliaReview: SelfReviewReport
): Promise<IndependentReviewReport> {
  log('Starting Alex independent review', 'Security, Quality, Tests');

  try {
    // Phase 1: Security Review
    log('Phase 1: Security review', 'Starting');
    const securityReview = await performSecurityReview(alexAgent, code);
    log('Phase 1: Security review',
      `Complete (score: ${securityReview.score}, passed: ${securityReview.passed})`);

    // Phase 2: Quality Analysis
    log('Phase 2: Quality analysis', 'Starting');
    const qualityAnalysis = await performQualityAnalysis(alexAgent, code);
    log('Phase 2: Quality analysis',
      `Complete (score: ${qualityAnalysis.score})`);

    // Phase 3: Test Validation
    log('Phase 3: Test validation', 'Starting');
    const testValidation = await performTestValidation(alexAgent, tests);
    log('Phase 3: Test validation',
      `Complete (score: ${testValidation.score}, adequate: ${testValidation.coverageAdequate})`);

    // Phase 4: Generate Review Report
    log('Phase 4: Report generation', 'Starting');
    const reviews: Review[] = [securityReview, qualityAnalysis, testValidation];
    const report = await alexAgent.generateReport(reviews);
    log('Phase 4: Report generation',
      `Complete (decision: ${report.decision}, confidence: ${report.confidence.toFixed(2)})`);

    return report;
  } catch (error) {
    log('Independent review failed', (error as Error).message);
    throw new Error(
      `Independent review execution failed: ${(error as Error).message}`
    );
  }
}

/**
 * Perform security review using Alex agent
 *
 * Detects OWASP Top 10 vulnerabilities:
 * - SQL Injection
 * - Cross-Site Scripting (XSS)
 * - Cross-Site Request Forgery (CSRF)
 * - Insecure Deserialization
 * - Authentication Issues
 *
 * @param alexAgent Alex agent infrastructure
 * @param code Code implementation to review
 * @returns Security review with vulnerabilities and pass/fail
 * @throws Error if security review fails
 */
async function performSecurityReview(
  alexAgent: AlexAgentInfrastructure,
  code: CodeImplementation
): Promise<SecurityReview> {
  try {
    const review = await alexAgent.reviewSecurity(code);

    // Validate security review
    if (review.score < 0 || review.score > 100) {
      throw new Error(`Invalid security score: ${review.score}`);
    }

    // Check for critical/high severity issues
    const criticalOrHigh = review.vulnerabilities.filter(
      v => v.severity === 'critical' || v.severity === 'high'
    );

    if (criticalOrHigh.length > 0) {
      log('Security issues detected',
        `${criticalOrHigh.length} critical/high severity issues`);
    }

    return review;
  } catch (error) {
    log('Security review failed', (error as Error).message);
    throw new Error(
      `Security review failed: ${(error as Error).message}`
    );
  }
}

/**
 * Perform quality analysis using Alex agent
 *
 * Analyzes:
 * - Cyclomatic complexity
 * - Maintainability index
 * - Code smells (long methods, deep nesting, god classes)
 * - Code duplication
 * - Naming convention violations
 *
 * @param alexAgent Alex agent infrastructure
 * @param code Code implementation to analyze
 * @returns Quality analysis with metrics and score
 * @throws Error if quality analysis fails
 */
async function performQualityAnalysis(
  alexAgent: AlexAgentInfrastructure,
  code: CodeImplementation
): Promise<QualityAnalysis> {
  try {
    const analysis = await alexAgent.analyzeQuality(code);

    // Validate quality analysis
    if (analysis.score < 0 || analysis.score > 100) {
      throw new Error(`Invalid quality score: ${analysis.score}`);
    }

    if (analysis.maintainabilityIndex < 0 || analysis.maintainabilityIndex > 100) {
      throw new Error(`Invalid maintainability index: ${analysis.maintainabilityIndex}`);
    }

    if (analysis.duplicationPercentage < 0 || analysis.duplicationPercentage > 100) {
      throw new Error(`Invalid duplication percentage: ${analysis.duplicationPercentage}`);
    }

    return analysis;
  } catch (error) {
    log('Quality analysis failed', (error as Error).message);
    throw new Error(
      `Quality analysis failed: ${(error as Error).message}`
    );
  }
}

/**
 * Perform test validation using Alex agent
 *
 * Validates:
 * - Coverage adequacy (>80% for lines, functions, branches, statements)
 * - Test quality (edge cases, error handling, integration tests)
 * - Missing tests identification
 *
 * @param alexAgent Alex agent infrastructure
 * @param tests Test suite with coverage
 * @returns Test validation with adequacy check and score
 * @throws Error if test validation fails
 */
async function performTestValidation(
  alexAgent: AlexAgentInfrastructure,
  tests: TestSuite
): Promise<TestValidation> {
  try {
    const validation = await alexAgent.validateTests(tests, tests.coverage);

    // Validate test validation
    if (validation.score < 0 || validation.score > 100) {
      throw new Error(`Invalid test validation score: ${validation.score}`);
    }

    // Log coverage metrics
    log('Coverage metrics',
      `Lines: ${tests.coverage.lines.toFixed(1)}%, ` +
      `Functions: ${tests.coverage.functions.toFixed(1)}%, ` +
      `Branches: ${tests.coverage.branches.toFixed(1)}%`);

    return validation;
  } catch (error) {
    log('Test validation failed', (error as Error).message);
    throw new Error(
      `Test validation failed: ${(error as Error).message}`
    );
  }
}

/**
 * Log message
 *
 * @param message Log message
 * @param detail Optional detail
 */
function log(message: string, detail?: string | number): void {
  const detailStr = detail !== undefined ? ` (${detail})` : '';
  console.log(`[IndependentReviewExecutor] ${message}${detailStr}`);
}
