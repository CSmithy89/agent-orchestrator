/**
 * Integration Tests for PR Creation Pipeline
 *
 * Tests complete PR creation, CI monitoring, and merge workflow with mock GitHub API.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Octokit } from '@octokit/rest';
import { PRCreationAutomator } from '../../../../src/implementation/pr/PRCreationAutomator.js';
import { WorktreeManager } from '../../../../src/core/WorktreeManager.js';
import { Worktree } from '../../../../src/types/worktree.types.js';
import {
  IndependentReviewReport,
  CodeImplementation,
  TestSuite
} from '../../../../src/implementation/types.js';
import * as fs from 'fs/promises';

// Mock modules
vi.mock('fs/promises');
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({
    push: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('PR Creation Integration Tests', () => {
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
        content: '// PRCreationAutomator implementation',
        operation: 'create'
      },
      {
        path: 'backend/src/implementation/pr/ci-monitor.ts',
        content: '// CI monitor implementation',
        operation: 'create'
      }
    ],
    commitMessage: 'Implement PR creation automation',
    implementationNotes: 'Complete PR automation system with CI monitoring and auto-merge',
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
    findings: [],
    recommendations: []
  };

  const mockStoryContent = `# Story 5.7: PR Creation Automation

## Acceptance Criteria

- [x] AC1: PRCreationAutomator Class Implemented
- [x] AC2: @octokit/rest Integrated

## Implementation

Complete PR automation system.
`;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockSprintStatus = `# Sprint Status
development_status:
  5-7-pr-creation-automation: in-progress
`;

    // Mock file system
    (fs.readFile as any).mockImplementation((filePath: string) => {
      if (filePath.includes('sprint-status.yaml')) {
        return Promise.resolve(mockSprintStatus);
      }
      return Promise.resolve(mockStoryContent);
    });
    (fs.writeFile as any).mockResolvedValue(undefined);
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.rename as any).mockResolvedValue(undefined);

    // Create mock Octokit
    octokit = new Octokit({ auth: 'test-token' });

    // Mock logger
    logger = vi.fn();

    // Create mock WorktreeManager
    worktreeManager = new WorktreeManager('/tmp/project');
    (worktreeManager.pushBranch as any) = vi.fn().mockResolvedValue(undefined);
    (worktreeManager.destroyWorktree as any) = vi.fn().mockResolvedValue(undefined);
  });

  describe('Happy Path: Push → Create → CI Pass → Merge → Cleanup', () => {
    it('should complete full PR creation and merge pipeline', async () => {
      // Arrange - Mock all GitHub API calls
      (octokit.pulls.create as Mock) = vi.fn().mockResolvedValue({
        data: {
          html_url: 'https://github.com/test/repo/pull/123',
          number: 123,
          title: 'Story 5-7: PR Creation Automation',
          body: 'PR body'
        }
      });

      (octokit.issues.addLabels as Mock) = vi.fn().mockResolvedValue({ data: {} });
      (octokit.issues.listLabelsForRepo as Mock) = vi.fn().mockResolvedValue({ data: [] });
      (octokit.issues.createLabel as Mock) = vi.fn().mockResolvedValue({ data: {} });

      (octokit.checks.listForRef as Mock) = vi.fn()
        // First call: checks running
        .mockResolvedValueOnce({
          data: {
            check_runs: [
              { name: 'test', status: 'in_progress', conclusion: null, id: 1 },
              { name: 'build', status: 'queued', conclusion: null, id: 2 }
            ]
          }
        })
        // Second call: all checks passed
        .mockResolvedValueOnce({
          data: {
            check_runs: [
              { name: 'test', status: 'completed', conclusion: 'success', id: 1 },
              { name: 'build', status: 'completed', conclusion: 'success', id: 2 }
            ]
          }
        });

      (octokit.pulls.get as Mock) = vi.fn().mockResolvedValue({
        data: {
          mergeable: true,
          base: { ref: 'main' }
        }
      });

      (octokit.pulls.merge as Mock) = vi.fn().mockResolvedValue({
        data: {
          merged: true,
          sha: 'abc123def456',
          message: 'Merged successfully'
        }
      });

      // Create automator with auto-merge enabled
      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true,
          ciPollingInterval: 100, // Fast polling for test
          maxCIWaitTime: 10000 // Short timeout for test
        },
        logger,
        worktreeManager
      );

      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result.number).toBe(123);
      expect(result.url).toBe('https://github.com/test/repo/pull/123');
      expect(worktreeManager.pushBranch).toHaveBeenCalled();
      expect(octokit.pulls.create).toHaveBeenCalled();
      expect(octokit.issues.addLabels).toHaveBeenCalled();
      expect(octokit.checks.listForRef).toHaveBeenCalled();
      expect(octokit.pulls.merge).toHaveBeenCalled();
      expect(worktreeManager.destroyWorktree).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle push failure gracefully', async () => {
      // Arrange
      (worktreeManager.pushBranch as any).mockRejectedValue(new Error('Network error'));

      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo'
        },
        logger,
        worktreeManager
      );

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

      expect(logger).toHaveBeenCalledWith(expect.stringContaining('Failed to push branch'));
    });

    it('should handle PR already exists scenario', async () => {
      // Arrange
      const prExistsError = new Error('A pull request already exists');
      (prExistsError as any).status = 422;

      (octokit.pulls.create as Mock) = vi.fn().mockRejectedValue(prExistsError);
      (octokit.pulls.list as Mock) = vi.fn().mockResolvedValue({
        data: [
          {
            html_url: 'https://github.com/test/repo/pull/100',
            number: 100,
            title: 'Existing PR',
            body: 'Existing body',
            base: { ref: 'main' },
            head: { ref: 'story/5-7-pr-creation-automation' }
          }
        ]
      });

      (octokit.issues.addLabels as Mock) = vi.fn().mockResolvedValue({ data: {} });
      (octokit.issues.listLabelsForRepo as Mock) = vi.fn().mockResolvedValue({ data: [] });

      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo'
        },
        logger,
        worktreeManager
      );

      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result.number).toBe(100);
      expect(octokit.pulls.list).toHaveBeenCalled();
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('PR already exists'));
    });

    it('should handle CI failure with retry', async () => {
      // Arrange
      (octokit.pulls.create as Mock) = vi.fn().mockResolvedValue({
        data: {
          html_url: 'https://github.com/test/repo/pull/123',
          number: 123,
          title: 'Test PR',
          body: 'Test body'
        }
      });

      (octokit.issues.addLabels as Mock) = vi.fn().mockResolvedValue({ data: {} });
      (octokit.issues.listLabelsForRepo as Mock) = vi.fn().mockResolvedValue({ data: [] });

      // First attempt: CI fails, Second attempt: CI passes
      (octokit.checks.listForRef as Mock) = vi.fn()
        .mockResolvedValueOnce({
          data: {
            check_runs: [
              { name: 'test', status: 'completed', conclusion: 'failure', id: 1 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            check_runs: [
              { name: 'test', status: 'completed', conclusion: 'success', id: 1 }
            ]
          }
        });

      (octokit.checks.rerequestRun as Mock) = vi.fn().mockResolvedValue({ data: {} });

      (octokit.pulls.get as Mock) = vi.fn().mockResolvedValue({
        data: { mergeable: true, base: { ref: 'main' } }
      });

      (octokit.pulls.merge as Mock) = vi.fn().mockResolvedValue({
        data: { merged: true, sha: 'abc123' }
      });

      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true,
          maxCIRetries: 1,
          ciPollingInterval: 10, // Very fast polling for test
          maxCIWaitTime: 2000 // Short timeout
        },
        logger,
        worktreeManager
      );

      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result.number).toBe(123);
      expect(octokit.checks.rerequestRun).toHaveBeenCalled();
      expect(octokit.pulls.merge).toHaveBeenCalled();
    }, 10000); // Increase test timeout to 10 seconds

    it('should handle merge conflict', async () => {
      // Arrange
      (octokit.pulls.create as Mock) = vi.fn().mockResolvedValue({
        data: {
          html_url: 'https://github.com/test/repo/pull/123',
          number: 123,
          title: 'Test PR',
          body: 'Test body'
        }
      });

      (octokit.issues.addLabels as Mock) = vi.fn().mockResolvedValue({ data: {} });
      (octokit.issues.listLabelsForRepo as Mock) = vi.fn().mockResolvedValue({ data: [] });

      (octokit.checks.listForRef as Mock) = vi.fn().mockResolvedValue({
        data: {
          check_runs: [
            { name: 'test', status: 'completed', conclusion: 'success', id: 1 }
          ]
        }
      });

      (octokit.pulls.get as Mock) = vi.fn().mockResolvedValue({
        data: { mergeable: false, base: { ref: 'main' } }
      });

      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: true,
          ciPollingInterval: 100,
          maxCIWaitTime: 10000
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
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('ESCALATION: Merge conflict'));
      expect(octokit.pulls.merge).not.toHaveBeenCalled();
    });
  });

  describe('Manual Review Mode', () => {
    it('should skip CI monitoring in manual mode', async () => {
      // Arrange
      (octokit.pulls.create as Mock) = vi.fn().mockResolvedValue({
        data: {
          html_url: 'https://github.com/test/repo/pull/123',
          number: 123,
          title: 'Test PR',
          body: 'Test body'
        }
      });

      (octokit.issues.addLabels as Mock) = vi.fn().mockResolvedValue({ data: {} });
      (octokit.issues.listLabelsForRepo as Mock) = vi.fn().mockResolvedValue({ data: [] });

      prAutomator = new PRCreationAutomator(
        octokit,
        {
          projectRoot: '/tmp/project',
          githubOwner: 'test-owner',
          githubRepo: 'test-repo',
          autoMerge: false // Manual mode
        },
        logger,
        worktreeManager
      );

      // Act
      const result = await prAutomator.createPR(
        mockWorktree,
        '5-7-pr-creation-automation',
        mockReviewReport,
        mockImplementation,
        mockTestSuite
      );

      // Assert
      expect(result.number).toBe(123);
      expect(octokit.checks.listForRef).not.toHaveBeenCalled();
      expect(octokit.pulls.merge).not.toHaveBeenCalled();
      expect(logger).toHaveBeenCalledWith(expect.stringContaining('Manual review mode'));
    });
  });
});
