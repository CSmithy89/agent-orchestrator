/**
 * PR Creation Automator
 *
 * Orchestrates complete GitHub PR creation, CI monitoring, and auto-merge pipeline.
 * Final step in autonomous story implementation workflow.
 *
 * Pipeline:
 * 1. Push worktree branch to remote
 * 2. Create PR with comprehensive description
 * 3. Apply labels based on epic/story type
 * 4. Request reviewers (if configured)
 * 5. Monitor CI status via GitHub Checks API
 * 6. Auto-merge on CI pass (if enabled)
 * 7. Delete remote branch after merge
 * 8. Cleanup worktree
 * 9. Update sprint-status.yaml
 * 10. Trigger dependent stories
 *
 * @example
 * ```typescript
 * const prAutomator = new PRCreationAutomator(octokit, config, logger, worktreeManager);
 * const result = await prAutomator.createPR(worktree, storyId, reviewReport);
 * ```
 */

import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs/promises';
import { WorktreeManager } from '../../core/WorktreeManager.js';
import { Worktree } from '../../types/worktree.types.js';
import { PRResult } from '../orchestration/workflow-types.js';
import {
  IndependentReviewReport,
  CodeImplementation,
  TestSuite
} from '../types.js';
import { generatePRBody, PRBodyConfig } from './pr-body-generator.js';
import { monitorCIStatus, retryFailedChecks, CIMonitorResult } from './ci-monitor.js';
import { autoMergePR, deleteRemoteBranch, MergeResult } from './auto-merger.js';
import { triggerDependentStories, updateSprintStatus } from './dependency-trigger.js';

/**
 * PR Creation Automator Configuration
 */
export interface PRCreationAutomatorConfig {
  /** Project root directory */
  projectRoot: string;
  /** GitHub repository owner */
  githubOwner: string;
  /** GitHub repository name */
  githubRepo: string;
  /** Base branch for PRs (default: 'main') */
  baseBranch?: string;
  /** Enable auto-merge after CI passes (default: false) */
  autoMerge?: boolean;
  /** Human reviewers to request (usernames) */
  reviewers?: string[];
  /** Team reviewers to request (team slugs) */
  teamReviewers?: string[];
  /** Enable draft PR creation (default: false) */
  draftPR?: boolean;
  /** Delete remote branch after merge (default: true) */
  deleteBranchAfterMerge?: boolean;
  /** Max CI monitoring time in milliseconds (default: 1800000 = 30min) */
  maxCIWaitTime?: number;
  /** CI polling interval in milliseconds (default: 30000 = 30s) */
  ciPollingInterval?: number;
  /** Max retry attempts for failed CI checks (default: 2) */
  maxCIRetries?: number;
  /** Delay between CI retries in milliseconds (default: 300000 = 5min) */
  ciRetryDelay?: number;
  /** Path to sprint-status.yaml (default: docs/sprint-status.yaml) */
  sprintStatusPath?: string;
}

/**
 * PR Creation Automator
 *
 * Main class for PR creation, CI monitoring, and auto-merge automation.
 */
export class PRCreationAutomator {
  private readonly octokit: Octokit;
  private readonly config: Required<PRCreationAutomatorConfig>;
  private readonly logger: (message: string) => void;
  private readonly worktreeManager: WorktreeManager;
  private readonly git: SimpleGit;

  /**
   * Create a new PR Creation Automator
   *
   * @param octokit Octokit GitHub API client
   * @param config PR creation configuration
   * @param logger Logger function
   * @param worktreeManager Worktree manager instance
   */
  constructor(
    octokit: Octokit,
    config: PRCreationAutomatorConfig,
    logger: (message: string) => void,
    worktreeManager: WorktreeManager
  ) {
    this.octokit = octokit;
    this.logger = logger;
    this.worktreeManager = worktreeManager;

    // Apply defaults
    this.config = {
      projectRoot: config.projectRoot,
      githubOwner: config.githubOwner,
      githubRepo: config.githubRepo,
      baseBranch: config.baseBranch || 'main',
      autoMerge: config.autoMerge ?? false,
      reviewers: config.reviewers || [],
      teamReviewers: config.teamReviewers || [],
      draftPR: config.draftPR ?? false,
      deleteBranchAfterMerge: config.deleteBranchAfterMerge ?? true,
      maxCIWaitTime: config.maxCIWaitTime || 1800000, // 30 minutes
      ciPollingInterval: config.ciPollingInterval || 30000, // 30 seconds
      maxCIRetries: config.maxCIRetries || 2,
      ciRetryDelay: config.ciRetryDelay || 300000, // 5 minutes
      sprintStatusPath: config.sprintStatusPath || path.join(config.projectRoot, 'docs/sprint-status.yaml')
    };

    // Initialize git client
    this.git = simpleGit({
      baseDir: config.projectRoot,
      binary: 'git',
      maxConcurrentProcesses: 5
    });
  }

  /**
   * Create PR and optionally auto-merge
   *
   * Complete PR creation and monitoring pipeline.
   *
   * @param worktree Worktree with implemented code
   * @param storyId Story identifier
   * @param reviewReport Review report from Alex
   * @param implementation Code implementation details
   * @param testSuite Test suite details
   * @returns PR result with URL and merge status
   */
  async createPR(
    worktree: Worktree,
    storyId: string,
    reviewReport: IndependentReviewReport,
    implementation: CodeImplementation,
    testSuite: TestSuite
  ): Promise<PRResult> {
    const startTime = Date.now();
    this.logger('[PRCreationAutomator] Starting PR creation pipeline');

    try {
      // Step 1: Push branch to remote
      await this.pushBranch(worktree);

      // Step 2: Create pull request
      const pr = await this.createPullRequest(worktree, storyId, reviewReport, implementation, testSuite);

      // Step 3: Apply labels
      await this.applyLabels(pr.number, storyId);

      // Step 4: Request reviewers (if configured)
      if (this.config.reviewers.length > 0 || this.config.teamReviewers.length > 0) {
        await this.requestReviewers(pr.number);
      }

      const duration = Date.now() - startTime;
      this.logger(`[PRCreationAutomator] PR created successfully in ${duration}ms: ${pr.url}`);

      // Step 5: Handle auto-merge or manual review mode
      if (this.config.autoMerge) {
        await this.monitorAndAutoMerge(pr, worktree, storyId);
      } else {
        await this.handleManualReviewMode(pr, storyId);
      }

      return pr;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger(`[PRCreationAutomator] PR creation failed after ${duration}ms: ${error.message}`);
      await this.handlePRCreationError(error, worktree, storyId);
      throw error;
    }
  }

  /**
   * Push worktree branch to remote repository
   */
  private async pushBranch(worktree: Worktree): Promise<void> {
    this.logger(`[PRCreationAutomator] Pushing branch ${worktree.branch} to remote...`);

    try {
      // Use WorktreeManager's pushBranch method
      await this.worktreeManager.pushBranch(worktree.storyId);

      this.logger(`[PRCreationAutomator] Successfully pushed branch ${worktree.branch}`);
    } catch (error: any) {
      this.logger(`[PRCreationAutomator] Failed to push branch: ${error.message}`);
      throw new Error(`Branch push failed: ${error.message}`);
    }
  }

  /**
   * Create pull request with comprehensive description
   */
  private async createPullRequest(
    worktree: Worktree,
    storyId: string,
    reviewReport: IndependentReviewReport,
    implementation: CodeImplementation,
    testSuite: TestSuite
  ): Promise<PRResult> {
    this.logger(`[PRCreationAutomator] Creating pull request for ${storyId}...`);

    try {
      // Extract story title from story ID
      const storyTitle = this.extractStoryTitle(storyId);

      // Generate PR title
      const prTitle = `Story ${storyId}: ${storyTitle}`;

      // Generate PR body
      const storyFilePath = path.join(this.config.projectRoot, 'docs/stories', `${storyId}.md`);
      const prBodyConfig: PRBodyConfig = {
        storyId,
        storyTitle,
        storyFilePath,
        implementation,
        testSuite,
        reviewReport,
        projectRoot: this.config.projectRoot
      };
      const prBody = await generatePRBody(prBodyConfig);

      // Validate PR body length (GitHub limit: 65536 characters)
      if (prBody.length > 65536) {
        this.logger(`[PRCreationAutomator] Warning: PR body exceeds GitHub limit (${prBody.length} chars), truncating...`);
      }

      // Create PR via GitHub API
      const response = await this.octokit.pulls.create({
        owner: this.config.githubOwner,
        repo: this.config.githubRepo,
        title: prTitle,
        body: prBody.substring(0, 65536), // Ensure within GitHub limit
        head: worktree.branch,
        base: this.config.baseBranch,
        draft: this.config.draftPR
      });

      this.logger(`[PRCreationAutomator] Pull request created: #${response.data.number}`);

      return {
        url: response.data.html_url,
        number: response.data.number,
        title: prTitle,
        body: prBody,
        baseBranch: this.config.baseBranch,
        headBranch: worktree.branch,
        state: 'open',
        autoMergeEnabled: this.config.autoMerge
      };
    } catch (error: any) {
      // Check if PR already exists
      if (error.status === 422 && error.message.includes('already exists')) {
        this.logger(`[PRCreationAutomator] PR already exists for branch ${worktree.branch}`);
        // Try to find existing PR
        const existingPR = await this.findExistingPR(worktree.branch);
        if (existingPR) {
          return existingPR;
        }
      }

      this.logger(`[PRCreationAutomator] Failed to create PR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Apply labels to pull request
   */
  private async applyLabels(pullNumber: number, storyId: string): Promise<void> {
    this.logger(`[PRCreationAutomator] Applying labels to PR #${pullNumber}...`);

    try {
      // Extract epic number from story ID (e.g., "5-7-pr-creation" → "epic-5")
      const epicMatch = storyId.match(/^(\d+)-/);
      const epicLabel = epicMatch ? `epic-${epicMatch[1]}` : undefined;

      // Determine story type from title
      const storyType = this.inferStoryType(storyId);

      // Determine priority (default: medium)
      const priority = 'priority-high'; // Could be extracted from story metadata

      // Build label list
      const labels: string[] = ['ai-generated', 'reviewed'];
      if (epicLabel) {
        labels.push(epicLabel);
      }
      if (storyType) {
        labels.push(storyType);
      }
      labels.push(priority);

      // Ensure labels exist in repository
      await this.ensureLabelsExist(labels);

      // Apply labels to PR
      await this.octokit.issues.addLabels({
        owner: this.config.githubOwner,
        repo: this.config.githubRepo,
        issue_number: pullNumber,
        labels
      });

      this.logger(`[PRCreationAutomator] Applied labels: ${labels.join(', ')}`);
    } catch (error: any) {
      // Non-blocking error
      this.logger(`[PRCreationAutomator] Warning: Failed to apply labels: ${error.message}`);
    }
  }

  /**
   * Request reviewers for pull request
   */
  private async requestReviewers(pullNumber: number): Promise<void> {
    this.logger(`[PRCreationAutomator] Requesting reviewers for PR #${pullNumber}...`);

    try {
      await this.octokit.pulls.requestReviewers({
        owner: this.config.githubOwner,
        repo: this.config.githubRepo,
        pull_number: pullNumber,
        reviewers: this.config.reviewers,
        team_reviewers: this.config.teamReviewers
      });

      this.logger(`[PRCreationAutomator] Requested reviewers: ${[...this.config.reviewers, ...this.config.teamReviewers].join(', ')}`);
    } catch (error: any) {
      // Non-blocking error (reviewers may not exist)
      this.logger(`[PRCreationAutomator] Warning: Failed to request reviewers: ${error.message}`);
    }
  }

  /**
   * Monitor CI and auto-merge if all checks pass
   */
  async monitorAndAutoMerge(pr: PRResult, worktree: Worktree, storyId: string): Promise<void> {
    this.logger(`[PRCreationAutomator] Starting CI monitoring and auto-merge for PR #${pr.number}...`);

    try {
      // Monitor CI status
      let ciResult = await monitorCIStatus(this.octokit, {
        owner: this.config.githubOwner,
        repo: this.config.githubRepo,
        ref: worktree.branch,
        pollingInterval: this.config.ciPollingInterval,
        maxWaitTime: this.config.maxCIWaitTime,
        logger: this.logger
      });

      // Retry failed checks (up to maxCIRetries times)
      let retryCount = 0;
      while (!ciResult.passed && !ciResult.timedOut && retryCount < this.config.maxCIRetries) {
        retryCount++;
        this.logger(`[PRCreationAutomator] CI failed, retrying (attempt ${retryCount}/${this.config.maxCIRetries})...`);

        // Wait before retry (configurable delay)
        await this.sleep(this.config.ciRetryDelay);

        // Retry failed checks
        await retryFailedChecks(
          this.octokit,
          this.config.githubOwner,
          this.config.githubRepo,
          ciResult.failedChecks,
          this.logger
        );

        // Monitor again
        ciResult = await monitorCIStatus(this.octokit, {
          owner: this.config.githubOwner,
          repo: this.config.githubRepo,
          ref: worktree.branch,
          pollingInterval: this.config.ciPollingInterval,
          maxWaitTime: this.config.maxCIWaitTime,
          logger: this.logger
        });
      }

      if (ciResult.timedOut) {
        this.logger(`[PRCreationAutomator] CI monitoring timed out after ${ciResult.duration / 1000}s`);
        await this.escalateCITimeout(pr, ciResult);
        return;
      }

      if (!ciResult.passed) {
        this.logger(`[PRCreationAutomator] CI checks failed after ${retryCount} retries`);
        await this.escalateCIFailure(pr, ciResult);
        return;
      }

      // All CI checks passed - proceed with merge
      this.logger(`[PRCreationAutomator] All CI checks passed, proceeding with merge...`);

      const mergeResult = await autoMergePR(this.octokit, {
        owner: this.config.githubOwner,
        repo: this.config.githubRepo,
        pullNumber: pr.number,
        prTitle: pr.title,
        prBody: pr.body,
        mergeMethod: 'squash',
        logger: this.logger
      });

      if (!mergeResult.success) {
        if (mergeResult.hasConflict) {
          await this.escalateMergeConflict(pr, mergeResult);
        } else {
          await this.escalateMergeFailure(pr, mergeResult);
        }
        return;
      }

      // Merge succeeded - cleanup
      this.logger(`[PRCreationAutomator] Merge succeeded, cleaning up...`);

      // Delete remote branch
      if (this.config.deleteBranchAfterMerge) {
        await deleteRemoteBranch(this.octokit, this.git, worktree.branch, this.logger);
      }

      // Cleanup worktree
      await this.cleanupWorktree(worktree);

      // Update sprint status
      await updateSprintStatus(storyId, 'done', this.config.sprintStatusPath, this.logger);

      // Trigger dependent stories
      const depResult = await triggerDependentStories(storyId, this.config.sprintStatusPath, this.logger);
      if (depResult.readyStories.length > 0) {
        this.logger(`[PRCreationAutomator] Dependent stories ready: ${depResult.readyStories.join(', ')}`);
      }

      this.logger(`[PRCreationAutomator] PR creation and merge pipeline completed successfully`);
    } catch (error: any) {
      this.logger(`[PRCreationAutomator] Error during CI monitoring/merge: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle manual review mode (no auto-merge)
   */
  private async handleManualReviewMode(pr: PRResult, storyId: string): Promise<void> {
    this.logger(`[PRCreationAutomator] Manual review mode enabled - skipping CI monitoring and auto-merge`);
    this.logger(`[PRCreationAutomator] PR URL: ${pr.url}`);
    this.logger(`[PRCreationAutomator] Please review and merge manually`);

    // Update sprint status to 'review'
    await updateSprintStatus(storyId, 'review', this.config.sprintStatusPath, this.logger);
  }

  /**
   * Cleanup worktree after successful merge
   */
  private async cleanupWorktree(worktree: Worktree): Promise<void> {
    try {
      this.logger(`[PRCreationAutomator] Cleaning up worktree: ${worktree.path}`);
      await this.worktreeManager.destroyWorktree(worktree.storyId);
      this.logger(`[PRCreationAutomator] Worktree cleaned up successfully`);
    } catch (error: any) {
      // Non-blocking error
      this.logger(`[PRCreationAutomator] Warning: Failed to cleanup worktree: ${error.message}`);
    }
  }

  /**
   * Handle PR creation errors with escalation
   */
  private async handlePRCreationError(error: any, worktree: Worktree, storyId: string): Promise<void> {
    this.logger(`[PRCreationAutomator] Handling PR creation error...`);

    // Save error details to file
    const errorFilePath = path.join(this.config.projectRoot, '.bmad', 'errors', `pr-error-${storyId}.json`);
    const errorDetails = {
      storyId,
      worktree,
      error: {
        message: error.message,
        stack: error.stack,
        status: error.status
      },
      timestamp: new Date().toISOString()
    };

    try {
      await fs.mkdir(path.dirname(errorFilePath), { recursive: true });
      await fs.writeFile(errorFilePath, JSON.stringify(errorDetails, null, 2), 'utf-8');
      this.logger(`[PRCreationAutomator] Error details saved to: ${errorFilePath}`);
    } catch (writeError: any) {
      this.logger(`[PRCreationAutomator] Failed to save error details: ${writeError.message}`);
    }

    // Preserve worktree for manual investigation
    this.logger(`[PRCreationAutomator] Worktree preserved at: ${worktree.path}`);
    this.logger(`[PRCreationAutomator] Next steps:`);
    this.logger(`  1. Review error details in ${errorFilePath}`);
    this.logger(`  2. Investigate worktree at ${worktree.path}`);
    this.logger(`  3. Create PR manually or fix issues and retry`);
  }

  /**
   * Escalate CI timeout
   */
  private async escalateCITimeout(pr: PRResult, ciResult: CIMonitorResult): Promise<void> {
    this.logger(`[PRCreationAutomator] ESCALATION: CI monitoring timed out`);
    this.logger(`  PR: ${pr.url}`);
    this.logger(`  Duration: ${ciResult.duration / 1000}s`);
    this.logger(`  Pending checks: ${ciResult.allChecks.filter(c => c.status !== 'completed').map(c => c.name).join(', ')}`);
    // TODO: Create GitHub issue or send notification
  }

  /**
   * Escalate CI failure
   */
  private async escalateCIFailure(pr: PRResult, ciResult: CIMonitorResult): Promise<void> {
    this.logger(`[PRCreationAutomator] ESCALATION: CI checks failed`);
    this.logger(`  PR: ${pr.url}`);
    this.logger(`  Failed checks: ${ciResult.failedChecks.map(c => c.name).join(', ')}`);
    // TODO: Create GitHub issue with CI logs
  }

  /**
   * Escalate merge conflict
   */
  private async escalateMergeConflict(pr: PRResult, mergeResult: MergeResult): Promise<void> {
    this.logger(`[PRCreationAutomator] ESCALATION: Merge conflict detected`);
    this.logger(`  PR: ${pr.url}`);
    this.logger(`  Error: ${mergeResult.error}`);
    // TODO: Create GitHub issue for manual conflict resolution
  }

  /**
   * Escalate merge failure
   */
  private async escalateMergeFailure(pr: PRResult, mergeResult: MergeResult): Promise<void> {
    this.logger(`[PRCreationAutomator] ESCALATION: Merge failed`);
    this.logger(`  PR: ${pr.url}`);
    this.logger(`  Error: ${mergeResult.error}`);
    // TODO: Create GitHub issue for investigation
  }

  /**
   * Find existing PR for branch
   */
  private async findExistingPR(branchName: string): Promise<PRResult | undefined> {
    try {
      const response = await this.octokit.pulls.list({
        owner: this.config.githubOwner,
        repo: this.config.githubRepo,
        head: `${this.config.githubOwner}:${branchName}`,
        state: 'open'
      });

      if (response.data.length > 0) {
        const pr = response.data[0];
        if (!pr) {
          return undefined;
        }
        return {
          url: pr.html_url,
          number: pr.number,
          title: pr.title,
          body: pr.body || '',
          baseBranch: pr.base.ref,
          headBranch: pr.head.ref,
          state: 'open',
          autoMergeEnabled: this.config.autoMerge
        };
      }
    } catch (error: any) {
      this.logger(`[PRCreationAutomator] Failed to find existing PR: ${error.message}`);
    }

    return undefined;
  }

  /**
   * Ensure labels exist in repository
   */
  private async ensureLabelsExist(labels: string[]): Promise<void> {
    try {
      // Get existing labels
      const response = await this.octokit.issues.listLabelsForRepo({
        owner: this.config.githubOwner,
        repo: this.config.githubRepo
      });

      const existingLabels = new Set(response.data.map(l => l.name));

      // Create missing labels
      for (const label of labels) {
        if (!existingLabels.has(label)) {
          try {
            await this.octokit.issues.createLabel({
              owner: this.config.githubOwner,
              repo: this.config.githubRepo,
              name: label,
              color: this.getLabelColor(label)
            });
            this.logger(`[PRCreationAutomator] Created label: ${label}`);
          } catch (error: any) {
            // Label may have been created by another process
            this.logger(`[PRCreationAutomator] Warning: Could not create label ${label}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      this.logger(`[PRCreationAutomator] Warning: Failed to ensure labels exist: ${error.message}`);
    }
  }

  /**
   * Get label color based on label type
   */
  private getLabelColor(label: string): string {
    if (label.startsWith('epic-')) return '0366d6';
    if (label.startsWith('priority-high')) return 'd93f0b';
    if (label.startsWith('priority-medium')) return 'fbca04';
    if (label.startsWith('priority-low')) return 'c2e0c6';
    if (label === 'ai-generated') return '7057ff';
    if (label === 'reviewed') return '008672';
    if (label === 'feature') return '84b6eb';
    if (label === 'bug-fix') return 'ee0701';
    if (label === 'enhancement') return 'a2eeef';
    return 'ededed'; // default gray
  }

  /**
   * Extract story title from story ID
   */
  private extractStoryTitle(storyId: string): string {
    // Convert "5-7-pr-creation-automation" to "PR Creation Automation"
    const parts = storyId.split('-').slice(2); // Remove epic and story number
    return parts
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer story type from story ID
   */
  private inferStoryType(storyId: string): string {
    if (storyId.includes('bug') || storyId.includes('fix')) return 'bug-fix';
    if (storyId.includes('enhancement') || storyId.includes('improve')) return 'enhancement';
    return 'feature'; // default
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
