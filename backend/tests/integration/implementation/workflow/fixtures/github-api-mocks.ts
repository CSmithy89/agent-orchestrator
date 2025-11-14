/**
 * GitHub API Mock Responses for Integration Tests
 * Uses nock to mock GitHub REST API endpoints
 */

import nock from 'nock';

export interface MockGitHubOptions {
  owner?: string;
  repo?: string;
  prNumber?: number;
  sha?: string;
  ciStatus?: 'success' | 'failure' | 'pending';
  ciConclusion?: 'success' | 'failure' | 'cancelled' | null;
}

export class GitHubAPIMocker {
  private scope: nock.Scope;
  private options: Required<MockGitHubOptions>;

  constructor(options: MockGitHubOptions = {}) {
    this.options = {
      owner: options.owner || 'test-owner',
      repo: options.repo || 'test-repo',
      prNumber: options.prNumber || 123,
      sha: options.sha || 'abc123def456',
      ciStatus: options.ciStatus || 'success',
      ciConclusion: options.ciConclusion || 'success',
    };

    this.scope = nock('https://api.github.com');
  }

  /**
   * Mock PR creation endpoint
   */
  mockPRCreation(customResponse?: any) {
    const defaultResponse = {
      number: this.options.prNumber,
      html_url: `https://github.com/${this.options.owner}/${this.options.repo}/pull/${this.options.prNumber}`,
      state: 'open',
      title: 'Test PR',
      body: 'Test PR body',
      head: { sha: this.options.sha },
      base: { ref: 'main' },
    };

    this.scope
      .post(`/repos/${this.options.owner}/${this.options.repo}/pulls`)
      .reply(201, customResponse || defaultResponse);

    return this;
  }

  /**
   * Mock adding labels to PR
   */
  mockAddLabels(labels: string[] = ['story-implementation', 'auto-merge']) {
    this.scope
      .post(`/repos/${this.options.owner}/${this.options.repo}/issues/${this.options.prNumber}/labels`, {
        labels,
      })
      .reply(200, labels.map(label => ({ name: label })));

    return this;
  }

  /**
   * Mock requesting reviewers
   */
  mockRequestReviewers(reviewers: string[] = []) {
    this.scope
      .post(`/repos/${this.options.owner}/${this.options.repo}/pulls/${this.options.prNumber}/requested_reviewers`, {
        reviewers,
      })
      .reply(201, {
        requested_reviewers: reviewers.map(login => ({ login })),
      });

    return this;
  }

  /**
   * Mock CI checks - multiple calls with different statuses
   */
  mockCIChecks(scenario: 'all-pass' | 'some-fail' | 'pending-then-pass' | 'timeout' = 'all-pass') {
    switch (scenario) {
      case 'all-pass':
        this.scope
          .get(`/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.sha}/check-runs`)
          .reply(200, {
            check_runs: [
              {
                name: 'CI Tests',
                status: 'completed',
                conclusion: 'success',
              },
              {
                name: 'Build',
                status: 'completed',
                conclusion: 'success',
              },
            ],
          });
        break;

      case 'some-fail':
        this.scope
          .get(`/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.sha}/check-runs`)
          .reply(200, {
            check_runs: [
              {
                name: 'CI Tests',
                status: 'completed',
                conclusion: 'failure',
              },
              {
                name: 'Build',
                status: 'completed',
                conclusion: 'success',
              },
            ],
          });
        break;

      case 'pending-then-pass':
        // First call: queued
        this.scope
          .get(`/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.sha}/check-runs`)
          .reply(200, {
            check_runs: [
              {
                name: 'CI Tests',
                status: 'queued',
                conclusion: null,
              },
            ],
          });

        // Second call: in_progress
        this.scope
          .get(`/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.sha}/check-runs`)
          .reply(200, {
            check_runs: [
              {
                name: 'CI Tests',
                status: 'in_progress',
                conclusion: null,
              },
            ],
          });

        // Third call: completed/success
        this.scope
          .get(`/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.sha}/check-runs`)
          .reply(200, {
            check_runs: [
              {
                name: 'CI Tests',
                status: 'completed',
                conclusion: 'success',
              },
            ],
          });
        break;

      case 'timeout':
        // Always return pending (simulates timeout)
        this.scope
          .get(`/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.sha}/check-runs`)
          .times(10) // Allow multiple retries
          .reply(200, {
            check_runs: [
              {
                name: 'CI Tests',
                status: 'in_progress',
                conclusion: null,
              },
            ],
          });
        break;
    }

    return this;
  }

  /**
   * Mock PR merge
   */
  mockPRMerge(shouldFail: boolean = false) {
    if (shouldFail) {
      this.scope
        .put(`/repos/${this.options.owner}/${this.options.repo}/pulls/${this.options.prNumber}/merge`)
        .reply(409, {
          message: 'Pull Request is not mergeable',
          documentation_url: 'https://docs.github.com/rest/pulls/pulls#merge-a-pull-request',
        });
    } else {
      this.scope
        .put(`/repos/${this.options.owner}/${this.options.repo}/pulls/${this.options.prNumber}/merge`)
        .reply(200, {
          sha: this.options.sha,
          merged: true,
          message: 'Pull Request successfully merged',
        });
    }

    return this;
  }

  /**
   * Mock delete branch
   */
  mockDeleteBranch(branch: string = 'feature/test-branch') {
    this.scope
      .delete(`/repos/${this.options.owner}/${this.options.repo}/git/refs/heads/${branch}`)
      .reply(204);

    return this;
  }

  /**
   * Mock API rate limit error
   */
  mockRateLimitError() {
    this.scope
      .post(`/repos/${this.options.owner}/${this.options.repo}/pulls`)
      .reply(403, {
        message: 'API rate limit exceeded',
        documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
      });

    return this;
  }

  /**
   * Mock network error
   */
  mockNetworkError() {
    this.scope
      .post(`/repos/${this.options.owner}/${this.options.repo}/pulls`)
      .replyWithError('Network error');

    return this;
  }

  /**
   * Setup complete PR workflow mocks (creation → CI → merge → cleanup)
   */
  mockCompletePRWorkflow(ciScenario: 'all-pass' | 'some-fail' | 'pending-then-pass' = 'all-pass') {
    return this
      .mockPRCreation()
      .mockAddLabels()
      .mockRequestReviewers()
      .mockCIChecks(ciScenario)
      .mockPRMerge()
      .mockDeleteBranch();
  }

  /**
   * Clean up all nock interceptors
   */
  cleanup() {
    nock.cleanAll();
  }

  /**
   * Verify all mocks were called
   */
  verify() {
    if (!this.scope.isDone()) {
      console.error('Pending mocks:', this.scope.pendingMocks());
      throw new Error('Not all nock interceptors were used');
    }
  }
}

/**
 * Helper function to setup GitHub API mocks for a test
 */
export function setupGitHubMocks(options?: MockGitHubOptions): GitHubAPIMocker {
  return new GitHubAPIMocker(options);
}

/**
 * Helper to clean up after tests
 */
export function cleanupGitHubMocks() {
  nock.cleanAll();
  nock.enableNetConnect(); // Re-enable net connect after tests
}
