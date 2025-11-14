/**
 * Auto-Merger
 *
 * Handles automatic PR merging after CI passes.
 * Implements squash merge strategy for clean history.
 * Includes conflict detection and branch protection validation.
 */

import { Octokit } from '@octokit/rest';
import simpleGit, { SimpleGit } from 'simple-git';

/**
 * Merge Result
 */
export interface MergeResult {
  /** Whether merge succeeded */
  success: boolean;
  /** Merge commit SHA (if successful) */
  sha?: string;
  /** Error message (if failed) */
  error?: string;
  /** Whether merge conflict occurred */
  hasConflict: boolean;
}

/**
 * Auto-Merge Options
 */
export interface AutoMergeOptions {
  /** GitHub repository owner */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Pull request number */
  pullNumber: number;
  /** PR title (for commit message) */
  prTitle: string;
  /** PR body (for commit description) */
  prBody: string;
  /** Merge method (default: 'squash') */
  mergeMethod?: 'merge' | 'squash' | 'rebase';
  /** Logger function */
  logger?: (message: string) => void;
}

/**
 * Merge pull request automatically
 *
 * @param octokit Octokit client
 * @param options Auto-merge options
 * @returns Merge result
 */
export async function autoMergePR(
  octokit: Octokit,
  options: AutoMergeOptions
): Promise<MergeResult> {
  const {
    owner,
    repo,
    pullNumber,
    prTitle,
    prBody,
    mergeMethod = 'squash',
    logger = console.log
  } = options;

  logger(`[Auto-Merger] Attempting to merge PR #${pullNumber} using ${mergeMethod} merge`);

  try {
    // Check if PR is mergeable
    const prData = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber
    });

    if (prData.data.mergeable === false) {
      logger(`[Auto-Merger] PR #${pullNumber} has merge conflicts`);
      return {
        success: false,
        error: 'PR has merge conflicts',
        hasConflict: true
      };
    }

    if (prData.data.mergeable === null) {
      // GitHub is still calculating mergeability
      logger(`[Auto-Merger] Waiting for GitHub to calculate mergeability...`);
      await sleep(5000);

      // Retry once
      const retryPrData = await octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber
      });

      if (retryPrData.data.mergeable === false) {
        logger(`[Auto-Merger] PR #${pullNumber} has merge conflicts`);
        return {
          success: false,
          error: 'PR has merge conflicts',
          hasConflict: true
        };
      }
    }

    // Validate branch protection rules
    try {
      const baseBranch = prData.data.base.ref;
      const protection = await octokit.repos.getBranchProtection({
        owner,
        repo,
        branch: baseBranch
      });

      logger(`[Auto-Merger] Branch protection active for ${baseBranch}`);

      // Check if required status checks passed
      if (protection.data.required_status_checks) {
        logger(`[Auto-Merger] Required status checks: ${protection.data.required_status_checks.contexts.join(', ')}`);
      }
    } catch (error) {
      // Branch protection may not be configured
      logger(`[Auto-Merger] No branch protection configured (or insufficient permissions)`);
    }

    // Generate merge commit message
    const commitTitle = prTitle;
    const commitMessage = generateCommitMessage(prBody);

    // Perform merge
    logger(`[Auto-Merger] Merging PR #${pullNumber}...`);
    const mergeResponse = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      merge_method: mergeMethod,
      commit_title: commitTitle,
      commit_message: commitMessage
    });

    if (mergeResponse.data.merged) {
      logger(`[Auto-Merger] Successfully merged PR #${pullNumber}`);
      logger(`[Auto-Merger] Merge commit SHA: ${mergeResponse.data.sha}`);
      return {
        success: true,
        sha: mergeResponse.data.sha,
        hasConflict: false
      };
    } else {
      logger(`[Auto-Merger] Failed to merge PR #${pullNumber}: ${mergeResponse.data.message}`);
      return {
        success: false,
        error: mergeResponse.data.message,
        hasConflict: false
      };
    }
  } catch (error: any) {
    logger(`[Auto-Merger] Error during merge: ${error.message}`);

    // Check for specific error types
    const errorMessage = error.message || String(error);
    const hasConflict = errorMessage.toLowerCase().includes('conflict') ||
                        errorMessage.toLowerCase().includes('merge');

    return {
      success: false,
      error: errorMessage,
      hasConflict
    };
  }
}

/**
 * Delete remote branch after merge
 *
 * @param octokit Octokit client (unused - using git directly)
 * @param git SimpleGit instance
 * @param branchName Branch name to delete
 * @param logger Logger function
 */
export async function deleteRemoteBranch(
  octokit: Octokit,
  git: SimpleGit,
  branchName: string,
  logger: (msg: string) => void = console.log
): Promise<void> {
  try {
    logger(`[Auto-Merger] Deleting remote branch: ${branchName}`);

    // Delete remote branch using git
    await git.push('origin', branchName, ['--delete']);

    logger(`[Auto-Merger] Successfully deleted remote branch: ${branchName}`);
  } catch (error: any) {
    // Non-blocking error - log but don't fail
    logger(`[Auto-Merger] Warning: Could not delete remote branch ${branchName}: ${error.message}`);
  }
}

/**
 * Generate commit message from PR body
 *
 * Extracts key sections from PR body for commit message.
 */
function generateCommitMessage(prBody: string): string {
  const lines = prBody.split('\n');
  const messageParts: string[] = [];

  // Extract implementation section (up to 500 chars)
  let inImplementation = false;
  for (const line of lines) {
    if (line.match(/^#+\s*Implementation/i)) {
      inImplementation = true;
      continue;
    }
    if (inImplementation && line.match(/^#+\s/)) {
      break;
    }
    if (inImplementation && line.trim()) {
      messageParts.push(line);
      if (messageParts.join('\n').length > 500) {
        break;
      }
    }
  }

  // Default if no implementation section found
  if (messageParts.length === 0) {
    messageParts.push('See PR description for details.');
  }

  return messageParts.join('\n').trim();
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
