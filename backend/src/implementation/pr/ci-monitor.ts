/**
 * CI Monitor
 *
 * Monitors GitHub CI checks via GitHub Checks API.
 * Polls every 30 seconds with 30-minute timeout.
 * Supports retry logic for transient failures.
 */

import { Octokit } from '@octokit/rest';

/**
 * CI Check Status
 */
export type CICheckStatus = 'queued' | 'in_progress' | 'completed';

/**
 * CI Check Conclusion
 */
export type CICheckConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required'
  | 'skipped';

/**
 * CI Check Details
 */
export interface CICheck {
  /** Check name */
  name: string;
  /** Check status */
  status: CICheckStatus;
  /** Check conclusion (if completed) */
  conclusion?: CICheckConclusion;
  /** Check ID */
  id: number;
}

/**
 * CI Monitoring Result
 */
export interface CIMonitorResult {
  /** All checks passed */
  passed: boolean;
  /** Failed checks */
  failedChecks: CICheck[];
  /** All checks */
  allChecks: CICheck[];
  /** Duration in milliseconds */
  duration: number;
  /** Whether timeout occurred */
  timedOut: boolean;
}

/**
 * CI Monitor Options
 */
export interface CIMonitorOptions {
  /** GitHub repository owner */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Git ref (branch, tag, or SHA) */
  ref: string;
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  pollingInterval?: number;
  /** Max wait time in milliseconds (default: 1800000 = 30min) */
  maxWaitTime?: number;
  /** Logger function */
  logger?: (message: string) => void;
}

/**
 * Monitor CI checks for a GitHub ref
 *
 * Polls GitHub Checks API until all checks complete or timeout.
 *
 * @param octokit Octokit client
 * @param options CI monitor options
 * @returns CI monitoring result
 */
export async function monitorCIStatus(
  octokit: Octokit,
  options: CIMonitorOptions
): Promise<CIMonitorResult> {
  const {
    owner,
    repo,
    ref,
    pollingInterval = 30000, // 30 seconds
    maxWaitTime = 1800000, // 30 minutes
    logger = console.log
  } = options;

  const startTime = Date.now();
  let lastStatusUpdate = Date.now();
  let iteration = 0;

  logger(`[CI Monitor] Starting CI monitoring for ${owner}/${repo}@${ref}`);
  logger(`[CI Monitor] Polling interval: ${pollingInterval / 1000}s, Max wait: ${maxWaitTime / 1000}s`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    iteration++;
    const elapsed = Date.now() - startTime;

    // Check timeout
    if (elapsed > maxWaitTime) {
      logger(`[CI Monitor] Timeout reached after ${elapsed / 1000}s`);
      const checks = await fetchChecks(octokit, owner, repo, ref);
      return {
        passed: false,
        failedChecks: checks.filter(c => c.conclusion === 'failure'),
        allChecks: checks,
        duration: elapsed,
        timedOut: true
      };
    }

    // Fetch current check status
    const checks = await fetchChecks(octokit, owner, repo, ref);

    // Log summary every 5 minutes
    if (Date.now() - lastStatusUpdate > 300000) {
      // 5 minutes
      logCheckSummary(checks, elapsed, logger);
      lastStatusUpdate = Date.now();
    }

    // Check if all checks completed
    const completedChecks = checks.filter(c => c.status === 'completed');
    const pendingChecks = checks.filter(c => c.status !== 'completed');

    if (pendingChecks.length === 0 && checks.length > 0) {
      // All checks completed
      const failedChecks = completedChecks.filter(
        c => c.conclusion === 'failure' || c.conclusion === 'timed_out' || c.conclusion === 'action_required'
      );
      const passed = failedChecks.length === 0;

      logger(`[CI Monitor] All checks completed after ${elapsed / 1000}s`);
      logger(`[CI Monitor] Result: ${passed ? 'PASSED' : 'FAILED'}`);
      if (failedChecks.length > 0) {
        logger(`[CI Monitor] Failed checks: ${failedChecks.map(c => c.name).join(', ')}`);
      }

      return {
        passed,
        failedChecks,
        allChecks: checks,
        duration: elapsed,
        timedOut: false
      };
    }

    // Log current status
    if (iteration === 1 || iteration % 10 === 0) {
      logger(`[CI Monitor] Iteration ${iteration}: ${completedChecks.length}/${checks.length} checks completed`);
      logger(`[CI Monitor] Pending: ${pendingChecks.map(c => c.name).join(', ')}`);
    }

    // Wait before next poll
    await sleep(pollingInterval);
  }
}

/**
 * Fetch all checks for a ref
 */
async function fetchChecks(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
): Promise<CICheck[]> {
  try {
    const response = await octokit.checks.listForRef({
      owner,
      repo,
      ref
    });

    return response.data.check_runs.map(check => ({
      name: check.name,
      status: check.status as CICheckStatus,
      conclusion: check.conclusion as CICheckConclusion | undefined,
      id: check.id
    }));
  } catch (error) {
    console.error(`[CI Monitor] Error fetching checks: ${error}`);
    return [];
  }
}

/**
 * Log check summary
 */
function logCheckSummary(checks: CICheck[], elapsed: number, logger: (msg: string) => void): void {
  const statusCounts = {
    queued: checks.filter(c => c.status === 'queued').length,
    in_progress: checks.filter(c => c.status === 'in_progress').length,
    completed: checks.filter(c => c.status === 'completed').length
  };

  const completedChecks = checks.filter(c => c.status === 'completed');
  const conclusionCounts = {
    success: completedChecks.filter(c => c.conclusion === 'success').length,
    failure: completedChecks.filter(c => c.conclusion === 'failure').length,
    other: completedChecks.filter(c => c.conclusion && !['success', 'failure'].includes(c.conclusion)).length
  };

  logger(`[CI Monitor] Status Update (${elapsed / 1000}s elapsed):`);
  logger(`  - Queued: ${statusCounts.queued}`);
  logger(`  - In Progress: ${statusCounts.in_progress}`);
  logger(`  - Completed: ${statusCounts.completed} (${conclusionCounts.success} success, ${conclusionCounts.failure} failure, ${conclusionCounts.other} other)`);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry failed CI checks
 *
 * Re-runs failed checks via GitHub API.
 * Note: This requires workflow_run permissions.
 *
 * @param octokit Octokit client
 * @param owner Repository owner
 * @param repo Repository name
 * @param failedChecks Failed check details
 * @param logger Logger function
 */
export async function retryFailedChecks(
  octokit: Octokit,
  owner: string,
  repo: string,
  failedChecks: CICheck[],
  logger: (msg: string) => void = console.log
): Promise<void> {
  logger(`[CI Monitor] Retrying ${failedChecks.length} failed checks...`);

  for (const check of failedChecks) {
    try {
      // Re-run the check
      await octokit.checks.rerequestRun({
        owner,
        repo,
        check_run_id: check.id
      });
      logger(`[CI Monitor] Requested re-run for check: ${check.name}`);
    } catch (error) {
      logger(`[CI Monitor] Failed to re-run check ${check.name}: ${error}`);
    }
  }
}
