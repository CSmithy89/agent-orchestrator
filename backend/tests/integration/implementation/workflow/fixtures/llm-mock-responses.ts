/**
 * Mock LLM Responses for Amelia and Alex agents
 * Used in integration tests to provide deterministic responses
 */

import type {
  CodeImplementation,
  TestSuite,
  SelfReviewReport,
  IndependentReviewReport,
  SecurityReview,
  QualityAnalysis,
  TestValidation,
} from '@/implementation/types';

/**
 * Mock Amelia responses for code implementation
 */
export const mockAmeliaImplementation: CodeImplementation = {
  files: [
    {
      path: 'src/sample/feature.ts',
      content: `/**
 * Sample feature implementation
 */
export class SampleFeature {
  async execute(input: string): Promise<string> {
    if (!input) {
      throw new Error('Input is required');
    }
    return \`Processed: \${input}\`;
  }
}
`,
      operation: 'create' as const,
    },
  ],
  commitMessage: 'Implement sample feature with validation',
  implementationNotes: 'Implemented SampleFeature class with error handling and async support',
  acceptanceCriteriaMapping: [
    {
      criteriaId: 'AC1',
      implementedBy: ['src/sample/feature.ts'],
      notes: 'Feature implemented with proper error handling and documentation',
    },
  ],
};

/**
 * Mock Amelia test suite generation
 */
export const mockAmeliaTests: TestSuite = {
  files: [
    {
      path: 'tests/unit/sample/feature.test.ts',
      content: `import { describe, it, expect } from 'vitest';
import { SampleFeature } from '@/sample/feature';

describe('SampleFeature', () => {
  it('should process valid input', async () => {
    const feature = new SampleFeature();
    const result = await feature.execute('test');
    expect(result).toBe('Processed: test');
  });

  it('should throw error for empty input', async () => {
    const feature = new SampleFeature();
    await expect(feature.execute('')).rejects.toThrow('Input is required');
  });
});
`,
    },
  ],
  framework: 'vitest',
  testCount: 2,
  coverage: {
    lines: { total: 10, covered: 9, percentage: 90 },
    functions: { total: 1, covered: 1, percentage: 100 },
    branches: { total: 2, covered: 2, percentage: 100 },
    statements: { total: 10, covered: 9, percentage: 90 },
  },
  results: {
    passed: 2,
    failed: 0,
    skipped: 0,
    total: 2,
    duration: 150,
  },
};

/**
 * Mock Amelia self-review report
 */
export const mockAmeliaSelfReview: SelfReviewReport = {
  confidence: 0.92,
  checklistResults: {
    acceptanceCriteriaMet: true,
    testCoverageAdequate: true,
    codingStandardsFollowed: true,
    documentationComplete: true,
    errorHandlingPresent: true,
  },
  potentialIssues: [],
  improvementSuggestions: [
    'Consider adding more edge case tests',
    'Could add performance benchmarks',
  ],
  overallAssessment: 'Implementation meets all acceptance criteria with high quality',
};

/**
 * Mock Alex security review (passing)
 */
export const mockAlexSecurityReview: SecurityReview = {
  vulnerabilities: [],
  securityScore: 95,
  recommendations: [
    'Consider adding rate limiting if this is exposed via API',
  ],
  criticalIssues: [],
};

/**
 * Mock Alex quality analysis (passing)
 */
export const mockAlexQualityAnalysis: QualityAnalysis = {
  codeSmells: [],
  complexity: {
    cyclomaticComplexity: 2,
    cognitiveComplexity: 1,
    assessment: 'Low complexity, maintainable code',
  },
  maintainability: {
    score: 88,
    issues: [],
  },
  bestPractices: {
    followed: ['TypeScript types', 'Error handling', 'Async/await'],
    violated: [],
  },
};

/**
 * Mock Alex test validation (passing)
 */
export const mockAlexTestValidation: TestValidation = {
  coverageAdequate: true,
  testQuality: {
    score: 90,
    strengths: ['Good coverage of error cases', 'Clear test descriptions'],
    weaknesses: ['Could add more edge case tests'],
  },
  missingTests: [],
  recommendations: ['Add integration tests for feature interactions'],
};

/**
 * Mock Alex independent review report (passing)
 */
export const mockAlexIndependentReview: IndependentReviewReport = {
  confidence: 0.88,
  security: mockAlexSecurityReview,
  quality: mockAlexQualityAnalysis,
  testValidation: mockAlexTestValidation,
  criticalIssues: [],
  blockers: [],
  recommendations: [
    'Consider adding integration tests',
    'Add performance benchmarks for future optimization',
  ],
  overallDecision: 'approve' as const,
  reasoning: 'Code meets quality standards with no critical issues. Minor improvements suggested for future iterations.',
};

/**
 * Mock Alex independent review (with critical issues - triggers escalation)
 */
export const mockAlexReviewWithCriticalIssues: IndependentReviewReport = {
  confidence: 0.65,
  security: {
    ...mockAlexSecurityReview,
    vulnerabilities: [
      {
        severity: 'high' as const,
        type: 'SQL Injection',
        location: 'src/sample/feature.ts:10',
        description: 'User input not sanitized before database query',
        recommendation: 'Use parameterized queries',
      },
    ],
    criticalIssues: ['SQL Injection vulnerability in feature.ts'],
    securityScore: 45,
  },
  quality: mockAlexQualityAnalysis,
  testValidation: mockAlexTestValidation,
  criticalIssues: ['SQL Injection vulnerability in feature.ts'],
  blockers: ['Security vulnerability must be fixed before merge'],
  recommendations: [
    'CRITICAL: Fix SQL injection vulnerability',
    'Add security tests for input validation',
  ],
  overallDecision: 'reject' as const,
  reasoning: 'Critical security vulnerability found. Must be addressed before approval.',
};

/**
 * Mock Alex review with low confidence (triggers escalation)
 */
export const mockAlexReviewLowConfidence: IndependentReviewReport = {
  confidence: 0.75, // Below 0.85 threshold
  security: mockAlexSecurityReview,
  quality: mockAlexQualityAnalysis,
  testValidation: mockAlexTestValidation,
  criticalIssues: [],
  blockers: [],
  recommendations: [
    'Code appears correct but complex logic needs human verification',
    'Consider simplifying the implementation',
  ],
  overallDecision: 'uncertain' as const,
  reasoning: 'Implementation appears correct but complexity makes automated review uncertain. Human review recommended.',
};

/**
 * Mock Amelia test failure context
 */
export const mockTestFailureContext = {
  failedTests: [
    {
      name: 'should process valid input',
      error: 'Expected "Processed: test" but got "Error: Invalid input"',
      file: 'tests/unit/sample/feature.test.ts',
      line: 8,
    },
  ],
  coverage: {
    lines: { total: 10, covered: 5, percentage: 50 },
    functions: { total: 1, covered: 0, percentage: 0 },
    branches: { total: 2, covered: 1, percentage: 50 },
    statements: { total: 10, covered: 5, percentage: 50 },
  },
};

/**
 * Mock Amelia fix for failed tests
 */
export const mockAmeliaTestFix: CodeImplementation = {
  files: [
    {
      path: 'src/sample/feature.ts',
      content: `/**
 * Sample feature implementation (FIXED)
 */
export class SampleFeature {
  async execute(input: string): Promise<string> {
    if (!input || input.trim() === '') {
      throw new Error('Input is required');
    }
    // FIX: Changed validation logic
    return \`Processed: \${input}\`;
  }
}
`,
      operation: 'update' as const,
    },
  ],
  commitMessage: 'Fix input validation logic',
  implementationNotes: 'Fixed validation to properly handle empty strings',
  acceptanceCriteriaMapping: [
    {
      criteriaId: 'AC1',
      implementedBy: ['src/sample/feature.ts'],
      notes: 'Fixed validation logic',
    },
  ],
};
