/**
 * Unit Tests for PRCreationAutomator
 *
 * Tests PR creation, CI monitoring, and auto-merge logic with mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Octokit } from '@octokit/rest';
import { PRCreationAutomator } from '../../../../src/implementation/pr/PRCreationAutomator.js';
import { WorktreeManager } from '../../../../src/core/WorktreeManager.js';
import { Worktree } from '../../../../src/types/worktree.types.js';
import {
  IndependentReviewReport,
  CodeImplementation,
  TestSuite,
  SecurityReview,
  QualityAnalysis,
  TestValidation
} from '../../../../src/implementation/types.js';

// Mock modules
vi.mock('@octokit/rest');
vi.mock('../../../../src/core/WorktreeManager.js');
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    push: vi.fn().mockResolvedValue(undefined)
  }))
}));
vi.mock('../../../../src/implementation/pr/pr-body-generator.js', () => ({
  generatePRBody: vi.fn().mockResolvedValue('Mock PR body')
}));
vi.mock('../../../../src/implementation/pr/ci-monitor.js', () => ({
  monitorCIStatus: vi.fn().mockResolvedValue({
    passed: true,
    failedChecks: [],
    allChecks: [],
    duration: 60000,
    timedOut: false
  }),
  retryFailedChecks: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../../../src/implementation/pr/auto-merger.js', () => ({
  autoMergePR: vi.fn().mockResolvedValue({
    success: true,
    sha: 'abc123',
    hasConflict: false
  }),
  deleteRemoteBranch: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../../../src/implementation/pr/dependency-trigger.js', () => ({
  triggerDependentStories: vi.fn().mockResolvedValue({
    readyStories: [],
    blockedStories: [],
    circularDependencies: []
  }),
  updateSprintStatus: vi.fn().mockResolvedValue(undefined)
}));

describe('PRCreationAutomator', () => {
  let octokit: Octokit;
  let worktreeManager: WorktreeManager;
  let prAutomator: PRCreationAutomator;
  let logger: Mock;

  const mockWorktree: Worktree = {
    storyId: '5-7-pr-creation-automation',
    path: '/tmp/wt/story-5-7',
    branch: 'story/5-7-pr-creation-automation',
    baseBranch: 'main',
    createdAt: new Date(),
    status: 'active'
  };

  const mockImplementation: CodeImplementation = {
    files: [
      {
        path: 'backend/src/implementation/pr/PRCreationAutomator.ts',
        content: '// Code',
        operation: 'create'
      }
    ],
    commitMessage: 'Implement PR creation automation',
    implementationNotes: 'Created PRCreationAutomator class',
    acceptanceCriteriaMapping: []
  };

  const mockTestSuite: TestSuite = {
    files: [],
    framework: 'vitest',
    testCount: 20,
    coverage: {
      lines: 85,
      functions: 90,
      branches: 80,
      statements: 85,
      uncoveredLines: []
    },
    results: {
      passed: 20,
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
    } as SecurityReview,
    qualityAnalysis: {
      complexityScore: 10,
      maintainabilityIndex: 85,
      codeSmells: [],
      duplicationPercentage: 0,
      namingConventionViolations: [],
      score: 90
    } as QualityAnalysis,
    testValidation: {
      coverageAdequate: true,
      testQuality: {
        edgeCasesCovered: true,
        errorHandlingTested: true,
        integrationTestsPresent: true
      },
      missingTests: [],
      score: 95
    } as TestValidation,
    architectureCompliance: {
      compliant: true,
      violations: []
    },
    overallScore: 0.95,
    confidence: 0.9,
    decision: 'pass',
    findings: [],
    recommendations: []
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    const mockSprintStatus = `# Sprint Status
development_status:
  5-7-pr-creation-automation: in-progress
`;

    // Mock file system
    vi.mock('fs/promises', () => ({
      readFile: vi.fn().mockImplementation((filePath: string) => {
        if (filePath.includes('sprint-status.yaml')) {
          return Promise.resolve(mockSprintStatus);
        }
        return Promise.resolve('# Mock story content');
      }),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined)
    }));

    // Create mock Octokit with proper structure
    octokit = {
      pulls: {
        create: vi.fn().mockResolvedValue({
          data: {
            html_url: 'https://github.com/test/repo/pull/1',
            number: 1,
            title: 'Story 5-7: PR Creation Automation',
            body: 'Mock PR body'
          }
        }),
        requestReviewers: vi.fn().mockResolvedValue({ data: {} }),
        list: vi.fn().mockResolvedValue({ data: [] }),
        get: vi.fn().mockResolvedValue({ data: { mergeable: true, base: { ref: 'main' } } }),
        merge: vi.fn().mockResolvedValue({ data: { merged: true, sha: 'abc123' } })
      },
      issues: {
        addLabels: vi.fn().mockResolvedValue({ data: {} }),
        listLabelsForRepo: vi.fn().mockResolvedValue({ data: [] }),
        createLabel: vi.fn().mockResolvedValue({ data: {} })
      },
      checks: {
        listForRef: vi.fn().mockResolvedValue({ data: { check_runs: [] } }),
        rerequestRun: vi.fn().mockResolvedValue({ data: {} })
      },
      repos: {
        getBranchProtection: vi.fn().mockRejectedValue(new Error('No protection'))
      }
    } as any;

    // Create mock WorktreeManager
    worktreeManager = {
      pushBranch: vi.fn().mockResolvedValue(undefined),
      destroyWorktree: vi.fn().mockResolvedValue(undefined)
    } as any;

    // Create mock logger
    logger = vi.fn();

    // Create PRCreationAutomator instance
    prAutomator = new PRCreationAutomator(
      octokit,
      {
        projectRoot: '/tmp/project',
        githubOwner: 'test-owner',
        githubRepo: 'test-repo',
        baseBranch: 'main',
        autoMerge: false // Start with manual mode for basic tests
      },
      logger,
      worktreeManager
    );
  });

  describe('createPR', () => {
    it('should create PR with comprehensive description', async () => {
      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.url).toBe('https://github.com/test/repo/pull/1');
      expect(result.number).toBe(1);
      expect(result.state).toBe('open');
      expect(worktreeManager.pushBranch).toHaveBeenCalledWith('5-7-pr-creation-automation');
      expect(octokit.pulls.create).toHaveBeenCalled();
    });

    it('should apply labels to PR', async () => {
      // Act
      await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(octokit.issues.addLabels).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          issue_number: 1,
          labels: expect.arrayContaining(['ai-generated', 'reviewed', 'epic-5'])
        })
      );
    });

    it('should handle PR creation with reviewers', async () => {
      // Arrange
      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          reviewers: ['reviewer1', 'reviewer2'],
          teamReviewers: ['team1']
        },
        logger,
        worktreeManager
      );

      // Act
      await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(octokit.pulls.requestReviewers).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          pull_number: 1,
          reviewers: ['reviewer1', 'reviewer2'],
          team_reviewers: ['team1']
        })
      );
    });

    it('should handle branch push failure', async () => {
      // Arrange
      (worktreeManager.pushBranch as Mock).mockRejectedValue(new Error('Push failed'));

      // Act & Assert
      await expect(
        prAutomator.createPR(
          mockWorktree,
          '5-7-pr-creation-automation',
          mockReviewReport,
          mockImplementation,
          mockTestSuite
        )
      ).rejects.toThrow('Branch push failed');
    });

    it('should handle PR already exists error', async () => {
      // Arrange
      const existingPRError = new Error('PR already exists');
      (existingPRError as any).status = 422;
      (octokit.pulls.create as Mock).mockRejectedValueOnce(existingPRError);
      (octokit.pulls.list as Mock) = vi.fn().mockResolvedValue({
        data: [
          {
            html_url: 'https://github.com/test/repo/pull/1',
            number: 1,
            title: 'Existing PR',
            body: 'Existing body',
            base: { ref: 'main' },
            head: { ref: 'story/5-7-pr-creation-automation' }
          }
        ]
      });

      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result.number).toBe(1);
      expect(octokit.pulls.list).toHaveBeenCalled();
    });
  });

  describe('monitorAndAutoMerge', () => {
    it('should auto-merge when CI passes', async () => {
      // Arrange
      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true
        },
        logger,
        worktreeManager
      );

      const mockPR = {
        url: 'https://github.com/test/repo/pull/1',
        number: 1,
        title: 'Test PR',
        body: 'Test body',
        baseBranch: 'main',
        headBranch: 'story/5-7',
        state: 'open' as const,
        autoMergeEnabled: true
      };

      // Import mocked modules
      const { autoMergePR } = await import('../../../../src/implementation/pr/auto-merger.js');
      const { updateSprintStatus } = await import('../../../../src/implementation/pr/dependency-trigger.js');

      // Act
      await prAutomator.monitorAndAutoMerge(mockPR, mockWorktree, '5-7-pr-creation-automation');

      // Assert
      expect(autoMergePR).toHaveBeenCalled();
      expect(updateSprintStatus).toHaveBeenCalledWith(
        '5-7-pr-creation-automation',
        'done',
        expect.any(String),
        expect.any(Function)
      );
      expect(worktreeManager.destroyWorktree).toHaveBeenCalledWith('5-7-pr-creation-automation');
    });

    it('should handle CI timeout', async () => {
      // Arrange
      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true
        },
        logger,
        worktreeManager
      );

      const { monitorCIStatus } = await import('../../../../src/implementation/pr/ci-monitor.js');
      (monitorCIStatus as Mock).mockResolvedValue({
        passed: false,
        failedChecks: [],
        allChecks: [],
        duration: 1800000,
        timedOut: true
      });

      const mockPR = {
        url: 'https://github.com/test/repo/pull/1',
        number: 1,
        title: 'Test PR',
        body: 'Test body',
        baseBranch: 'main',
        headBranch: 'story/5-7',
        state: 'open' as const,
        autoMergeEnabled: true
      };

      // Act
      await prAutomator.monitorAndAutoMerge(mockPR, mockWorktree, '5-7-pr-creation-automation');

      // Assert
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('ESCALATION: CI monitoring timed out'));
    });

    it('should retry failed CI checks', async () => {
      // Arrange - Use fast polling and retry delay to avoid test timeout
      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true,
          maxCIRetries: 1, // Reduce retries for test
          ciPollingInterval: 10, // Very fast polling
          ciRetryDelay: 10, // Very fast retry for test
          maxCIWaitTime: 2000 // Short timeout
        },
        logger,
        worktreeManager
      );

      const { monitorCIStatus, retryFailedChecks } = await import('../../../../src/implementation/pr/ci-monitor.js');

      // First call: failure, second call after retry: success
      (monitorCIStatus as Mock)
        .mockResolvedValueOnce({
          passed: false,
          failedChecks: [{ name: 'test', status: 'completed', conclusion: 'failure', id: 1 }],
          allChecks: [],
          duration: 100, // Short duration
          timedOut: false
        })
        .mockResolvedValueOnce({
          passed: true,
          failedChecks: [],
          allChecks: [],
          duration: 100,
          timedOut: false
        });

      const mockPR = {
        url: 'https://github.com/test/repo/pull/1',
        number: 1,
        title: 'Test PR',
        body: 'Test body',
        baseBranch: 'main',
        headBranch: 'story/5-7',
        state: 'open' as const,
        autoMergeEnabled: true
      };

      // Act
      await prAutomator.monitorAndAutoMerge(mockPR, mockWorktree, '5-7-pr-creation-automation');

      // Assert
      expect(retryFailedChecks).toHaveBeenCalled();
      expect(monitorCIStatus).toHaveBeenCalledTimes(2);
    }, 10000); // Add 10 second timeout for this test

    it('should handle merge conflict', async () => {
      // Arrange
      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true,
          ciPollingInterval: 10,
          maxCIWaitTime: 1000
        },
        logger,
        worktreeManager
      );

      const { monitorCIStatus } = await import('../../../../src/implementation/pr/ci-monitor.js');
      const { autoMergePR } = await import('../../../../src/implementation/pr/auto-merger.js');

      // Mock CI to pass
      (monitorCIStatus as Mock).mockResolvedValue({
        passed: true,
        failedChecks: [],
        allChecks: [],
        duration: 100,
        timedOut: false
      });

      // Mock merge to fail with conflict
      (autoMergePR as Mock).mockResolvedValue({
        success: false,
        hasConflict: true,
        error: 'Merge conflict'
      });

      const mockPR = {
        url: 'https://github.com/test/repo/pull/1',
        number: 1,
        title: 'Test PR',
        body: 'Test body',
        baseBranch: 'main',
        headBranch: 'story/5-7',
        state: 'open' as const,
        autoMergeEnabled: true
      };

      // Act
      await prAutomator.monitorAndAutoMerge(mockPR, mockWorktree, '5-7-pr-creation-automation');

      // Assert
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('ESCALATION: Merge conflict detected'));
    });
  });

  describe('handleManualReviewMode', () => {
    it('should skip CI monitoring in manual mode', async () => {
      // Arrange
      const { updateSprintStatus } = await import('../../../../src/implementation/pr/dependency-trigger.js');

      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result).toBeDefined();
      expect(updateSprintStatus).toHaveBeenCalledWith(
        '5-7-pr-creation-automation',
        'review',
        expect.any(String),
        expect.any(Function)
      );
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('Manual review mode enabled'));
    });
  });
});
