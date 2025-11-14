/**
 * Unit Tests for PR Body Generator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generatePRBody } from '../../../../src/implementation/pr/pr-body-generator.js';
import { IndependentReviewReport, CodeImplementation, TestSuite } from '../../../../src/implementation/types.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('generatePRBody', () => {
  const mockStoryContent = `# Story 5.7: PR Creation Automation

## Acceptance Criteria

- [x] AC1: PRCreationAutomator Class Implemented
- [x] AC2: @octokit/rest Integrated for GitHub API Access
- [ ] AC3: Worktree Branch Pushed to Remote

## Tasks

- Task 1: Create PRCreationAutomator class
`;

  const mockImplementation: CodeImplementation = {
    files: [
      { path: 'backend/src/implementation/pr/PRCreationAutomator.ts', content: '// Code', operation: 'create' },
      { path: 'backend/src/implementation/pr/ci-monitor.ts', content: '// Code', operation: 'create' }
    ],
    commitMessage: 'Implement PR creation automation',
    implementationNotes: 'Created comprehensive PR automation system with CI monitoring and auto-merge.',
    acceptanceCriteriaMapping: []
  };

  const mockTestSuite: TestSuite = {
    files: [],
    framework: 'vitest',
    testCount: 25,
    coverage: {
      lines: 88.5,
      functions: 92.0,
      branches: 85.5,
      statements: 88.0,
      uncoveredLines: []
    },
    results: {
      passed: 25,
      failed: 0,
      skipped: 0,
      duration: 5000
    }
  };

  const mockReviewReport: IndependentReviewReport = {
    securityReview: {
      vulnerabilities: [],
      score: 100,
      passed: true
    } as any,
    qualityAnalysis: {
      complexityScore: 10,
      maintainabilityIndex: 85,
      codeSmells: [],
      duplicationPercentage: 0,
      namingConventionViolations: [],
      score: 90
    } as any,
    testValidation: {
      coverageAdequate: true,
      testQuality: {
        edgeCasesCovered: true,
        errorHandlingTested: true,
        integrationTestsPresent: true
      },
      missingTests: [],
      score: 95
    } as any,
    architectureCompliance: {
      compliant: true,
      violations: []
    },
    overallScore: 0.95,
    confidence: 0.92,
    decision: 'pass',
    findings: [
      {
        category: 'quality',
        severity: 'medium',
        title: 'Consider extracting helper function',
        description: 'Long method could be refactored',
        location: 'PRCreationAutomator.ts:150',
        recommendation: 'Extract into separate function'
      }
    ],
    recommendations: ['Add more edge case tests']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fs.readFile as any).mockResolvedValue(mockStoryContent);
  });

  it('should generate comprehensive PR body', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('## Story Overview');
    expect(body).toContain('5-7-pr-creation-automation');
    expect(body).toContain('PR Creation Automation');
  });

  it('should include acceptance criteria', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('## Acceptance Criteria');
    expect(body).toContain('AC1: PRCreationAutomator Class Implemented');
    expect(body).toContain('AC2: @octokit/rest Integrated for GitHub API Access');
  });

  it('should include implementation notes', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('## Implementation');
    expect(body).toContain('Created comprehensive PR automation system');
  });

  it('should include files changed summary', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('### Files Changed');
    expect(body).toContain('**Created (2):**');
    expect(body).toContain('backend/src/implementation/pr/PRCreationAutomator.ts');
    expect(body).toContain('backend/src/implementation/pr/ci-monitor.ts');
  });

  it('should include test summary', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('## Test Summary');
    expect(body).toContain('vitest');
    expect(body).toContain('25 passed');
    expect(body).toContain('### Code Coverage');
    expect(body).toContain('88.5%');
  });

  it('should include review summary', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('## Review Summary');
    expect(body).toContain('100/100');
    expect(body).toContain('95.0/100');
    expect(body).toContain('92.0%');
    expect(body).toContain('PASS');
  });

  it('should include review findings', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('### Review Findings');
    expect(body).toContain('**Medium (1):**');
    expect(body).toContain('Consider extracting helper function');
  });

  it('should include agent signature', async () => {
    // Arrange
    const config = {
      storyId: '5-7-pr-creation-automation',
      storyTitle: 'PR Creation Automation',
      storyFilePath: '/tmp/project/docs/stories/5-7-pr-creation-automation.md',
      implementation: mockImplementation,
      testSuite: mockTestSuite,
      reviewReport: mockReviewReport,
      projectRoot: '/tmp/project'
    };

    // Act
    const body = await generatePRBody(config);

    // Assert
    expect(body).toContain('**Implemented by:** Amelia (Developer Agent)');
    expect(body).toContain('**Reviewed by:** Alex (Code Reviewer Agent)');
  });
});
