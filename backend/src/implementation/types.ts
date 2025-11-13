/**
 * Epic 5: Story Implementation Automation - Type Definitions
 *
 * This file defines all TypeScript interfaces and types for the dual-agent
 * story implementation system featuring Amelia (Developer) and Alex (Code Reviewer).
 */

import { Agent } from '../types/agent.js';

/**
 * Amelia Agent - Developer persona with code implementation capabilities
 * Extends base Agent interface with specialized methods for story development
 */
export interface AmeliaAgent extends Agent {
  name: 'amelia';
  role: 'Developer';
  expertise: [
    'code-implementation',
    'test-generation',
    'debugging',
    'refactoring',
    'documentation'
  ];
  llm: {
    /** Model name (e.g., "gpt-4o") */
    model: string;
    /** Provider name (e.g., "openai") */
    provider: string;
    /** Temperature for balanced creativity/precision (recommended: 0.4) */
    temperature: number;
  };

  /** Implement story according to acceptance criteria */
  implementStory(context: StoryContext): Promise<CodeImplementation>;

  /** Generate comprehensive tests for implemented code */
  writeTests(code: CodeImplementation): Promise<TestSuite>;

  /** Perform self-review of implemented code */
  reviewCode(code: CodeImplementation): Promise<SelfReviewReport>;
}

/**
 * Alex Agent - Code Reviewer persona with security and quality focus
 * Different LLM than Amelia ensures diverse perspectives
 */
export interface AlexAgent extends Agent {
  name: 'alex';
  role: 'Code Reviewer';
  expertise: [
    'security-review',
    'code-quality-analysis',
    'test-coverage-validation',
    'architecture-compliance',
    'performance-analysis'
  ];
  llm: {
    /** Model name (e.g., "claude-sonnet-4-5") - MUST differ from Amelia */
    model: string;
    /** Provider name (e.g., "anthropic") */
    provider: string;
    /** Temperature for precise analytical review (recommended: 0.3) */
    temperature: number;
  };

  /** Review code for security vulnerabilities */
  reviewSecurity(code: CodeImplementation): Promise<SecurityReview>;

  /** Analyze code quality metrics */
  analyzeQuality(code: CodeImplementation): Promise<QualityAnalysis>;

  /** Validate test coverage and quality */
  validateTests(tests: TestSuite, coverage: CoverageReport): Promise<TestValidation>;

  /** Generate comprehensive review report aggregating all reviews */
  generateReport(reviews: Review[]): Promise<IndependentReviewReport>;
}

/**
 * Story Context - Complete context needed for story implementation
 * Token-optimized to stay under 50k tokens
 */
export interface StoryContext {
  story: {
    /** Story identifier (e.g., "5-1-core-agent-infrastructure") */
    id: string;
    /** Story title */
    title: string;
    /** User story description (As a... I want... So that...) */
    description: string;
    /** Acceptance criteria with checkboxes */
    acceptanceCriteria: string[];
    /** Technical notes and architecture alignment */
    technicalNotes: TechnicalNotes;
    /** Story dependencies (prerequisite story IDs) */
    dependencies: string[];
  };
  /** Relevant PRD sections (<10k tokens) */
  prdContext: string;
  /** Relevant architecture sections (<15k tokens) */
  architectureContext: string;
  /** Coding standards, patterns (<10k tokens) */
  onboardingDocs: string;
  /** Existing code files mentioned in story (<15k tokens) */
  existingCode: ExistingCodeFile[];
  /** Context from prerequisite stories (optional) */
  dependencyContext?: string;
  /** Total token count (target: <50k) */
  totalTokens: number;
}

/**
 * Technical notes from story file
 */
export interface TechnicalNotes {
  /** Architecture alignment notes */
  architectureAlignment?: string;
  /** Key design decisions */
  designDecisions?: string[];
  /** Testing standards */
  testingStandards?: string;
  /** References to docs */
  references?: string[];
}

/**
 * Existing code file with relevance context
 */
export interface ExistingCodeFile {
  /** File path relative to repo root */
  file: string;
  /** File content */
  content: string;
  /** Why this file is relevant to the story */
  relevance: string;
}

/**
 * Code Implementation - Result of Amelia's implementStory()
 */
export interface CodeImplementation {
  /** Files to create, modify, or delete */
  files: CodeFile[];
  /** Commit message following project conventions */
  commitMessage: string;
  /** Implementation notes explaining approach */
  implementationNotes: string;
  /** Mapping of acceptance criteria to implementation */
  acceptanceCriteriaMapping: AcceptanceCriteriaMapping[];
}

/**
 * Code file operation
 */
export interface CodeFile {
  /** File path relative to repo root (e.g., "backend/src/implementation/agents/amelia.ts") */
  path: string;
  /** Full file content */
  content: string;
  /** Operation type */
  operation: 'create' | 'modify' | 'delete';
}

/**
 * Mapping between acceptance criteria and implementation evidence
 */
export interface AcceptanceCriteriaMapping {
  /** Acceptance criterion text */
  criterion: string;
  /** Whether this criterion is implemented */
  implemented: boolean;
  /** File/function that implements this criterion */
  evidence: string;
}

/**
 * Test Suite - Result of Amelia's writeTests()
 */
export interface TestSuite {
  /** Test files to create */
  files: TestFile[];
  /** Test framework used (e.g., "vitest", "jest") */
  framework: string;
  /** Total number of test cases */
  testCount: number;
  /** Code coverage report */
  coverage: CoverageReport;
  /** Test execution results */
  results: TestResults;
}

/**
 * Test file
 */
export interface TestFile {
  /** Test file path relative to repo root */
  path: string;
  /** Test file content */
  content: string;
}

/**
 * Code coverage metrics
 */
export interface CoverageReport {
  /** Line coverage percentage */
  lines: number;
  /** Function coverage percentage */
  functions: number;
  /** Branch coverage percentage */
  branches: number;
  /** Statement coverage percentage */
  statements: number;
  /** Uncovered lines (file:line references) */
  uncoveredLines: string[];
}

/**
 * Test execution results
 */
export interface TestResults {
  /** Number of passed tests */
  passed: number;
  /** Number of failed tests */
  failed: number;
  /** Number of skipped tests */
  skipped: number;
  /** Total execution duration in milliseconds */
  duration: number;
  /** Failed test details (if any) */
  failures?: TestFailure[];
}

/**
 * Failed test details
 */
export interface TestFailure {
  /** Test name */
  test: string;
  /** Error message */
  error: string;
}

/**
 * Self Review Report - Result of Amelia's reviewCode()
 */
export interface SelfReviewReport {
  /** Self-review checklist items */
  checklist: ChecklistItem[];
  /** Code smells identified */
  codeSmells: CodeSmell[];
  /** Acceptance criteria verification */
  acceptanceCriteriaCheck: AcceptanceCriteriaCheck[];
  /** Confidence in implementation (0.0-1.0) */
  confidence: number;
  /** Critical issues requiring immediate fix */
  criticalIssues: string[];
}

/**
 * Self-review checklist item
 */
export interface ChecklistItem {
  /** Checklist item description */
  item: string;
  /** Whether item passed review */
  passed: boolean;
  /** Optional notes */
  notes?: string;
}

/**
 * Code smell detection
 */
export interface CodeSmell {
  /** Type of code smell */
  type: 'long-function' | 'duplication' | 'poor-naming' | 'complexity' | 'other';
  /** Location (file:line) */
  location: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high';
  /** Recommendation for fix */
  recommendation: string;
}

/**
 * Acceptance criteria check result
 */
export interface AcceptanceCriteriaCheck {
  /** Acceptance criterion text */
  criterion: string;
  /** Whether criterion is met */
  met: boolean;
  /** Evidence that criterion is met */
  evidence: string;
}

/**
 * Independent Review Report - Result of Alex's generateReport()
 */
export interface IndependentReviewReport {
  /** Security review results */
  securityReview: SecurityReview;
  /** Code quality analysis */
  qualityAnalysis: QualityAnalysis;
  /** Test validation results */
  testValidation: TestValidation;
  /** Architecture compliance check */
  architectureCompliance: {
    /** Whether code complies with architecture */
    compliant: boolean;
    /** Architecture violations found */
    violations: string[];
  };
  /** Overall quality score (0.0-1.0) */
  overallScore: number;
  /** Reviewer confidence (0.0-1.0) */
  confidence: number;
  /** Final decision */
  decision: 'pass' | 'fail' | 'escalate';
  /** Detailed findings */
  findings: ReviewFinding[];
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Security Review - Result of Alex's reviewSecurity()
 */
export interface SecurityReview {
  /** Security vulnerabilities found */
  vulnerabilities: SecurityVulnerability[];
  /** Security score (0-100) */
  score: number;
  /** Whether security review passed (no critical/high severity issues) */
  passed: boolean;
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  /** Vulnerability type (OWASP category) */
  type: string;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Location (file:line) */
  location: string;
  /** Vulnerability description */
  description: string;
  /** Remediation advice */
  remediation: string;
}

/**
 * Quality Analysis - Result of Alex's analyzeQuality()
 */
export interface QualityAnalysis {
  /** Cyclomatic complexity score */
  complexityScore: number;
  /** Maintainability index (0-100) */
  maintainabilityIndex: number;
  /** Code smells detected */
  codeSmells: CodeSmellSummary[];
  /** Code duplication percentage */
  duplicationPercentage: number;
  /** Naming convention violations */
  namingConventionViolations: string[];
  /** Quality score (0-100) */
  score: number;
}

/**
 * Code smell summary
 */
export interface CodeSmellSummary {
  /** Type of code smell */
  type: string;
  /** Number of occurrences */
  count: number;
  /** Locations where found */
  locations: string[];
}

/**
 * Test Validation - Result of Alex's validateTests()
 */
export interface TestValidation {
  /** Whether coverage is adequate (>80% for new code) */
  coverageAdequate: boolean;
  /** Test quality assessment */
  testQuality: TestQualityMetrics;
  /** Functions missing tests */
  missingTests: string[];
  /** Test validation score (0-100) */
  score: number;
}

/**
 * Test quality metrics
 */
export interface TestQualityMetrics {
  /** Whether edge cases are covered */
  edgeCasesCovered: boolean;
  /** Whether error handling is tested */
  errorHandlingTested: boolean;
  /** Whether integration tests are present */
  integrationTestsPresent: boolean;
}

/**
 * Review finding from independent review
 */
export interface ReviewFinding {
  /** Finding category */
  category: 'security' | 'quality' | 'testing' | 'architecture';
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  /** Finding title */
  title: string;
  /** Detailed description */
  description: string;
  /** Location (file:line) */
  location: string;
  /** Recommendation for fix */
  recommendation: string;
}

/**
 * Generic review type for Alex's generateReport()
 */
export type Review = SecurityReview | QualityAnalysis | TestValidation;
