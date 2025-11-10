/**
 * Git Configuration Utilities for Testing
 *
 * Provides helpers for configuring Git in test environments
 * to prevent common issues like missing user identity or GPG signing.
 *
 * Addresses Epic 1.11 issue: Git operations failing with
 * "Please tell me who you are" error.
 */

import { simpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

/**
 * Configure Git with test user identity and settings
 *
 * Sets:
 * - user.name = "Test User"
 * - user.email = "test@example.com"
 * - commit.gpgsign = false (prevents GPG signing errors in CI/CD)
 *
 * @param repoPath Optional path to repository (defaults to current directory)
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await setupGitConfig();
 * });
 *
 * it('should commit changes', async () => {
 *   // Git operations work without "who are you" errors
 *   await git.commit('Test commit');
 * });
 * ```
 */
export const setupGitConfig = async (repoPath?: string) => {
  const git = repoPath ? simpleGit(repoPath) : simpleGit();

  await git.addConfig('user.name', 'Test User', false, 'local');
  await git.addConfig('user.email', 'test@example.com', false, 'local');
  await git.addConfig('commit.gpgsign', 'false', false, 'local');
};

/**
 * Clean up Git test configuration
 *
 * Removes test configuration from repository.
 * Call in afterEach to clean up test state.
 *
 * @param repoPath Optional path to repository
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await cleanupGitConfig();
 * });
 * ```
 */
export const cleanupGitConfig = async (repoPath?: string) => {
  const git = repoPath ? simpleGit(repoPath) : simpleGit();

  try {
    // Remove test config (fails silently if not set)
    await git.raw(['config', '--local', '--unset', 'user.name']).catch(() => {});
    await git.raw(['config', '--local', '--unset', 'user.email']).catch(() => {});
    await git.raw(['config', '--local', '--unset', 'commit.gpgsign']).catch(() => {});
  } catch (error) {
    // Ignore errors during cleanup
  }
};

/**
 * Create temporary Git repository for testing
 *
 * Creates a new directory, initializes Git, and configures test user.
 *
 * @param repoPath Path where repository should be created
 * @returns SimpleGit instance for the new repository
 *
 * @example
 * ```typescript
 * let testRepo: string;
 * let git: SimpleGit;
 *
 * beforeEach(async () => {
 *   testRepo = path.join(__dirname, 'temp-repo');
 *   git = await createTestRepo(testRepo);
 * });
 *
 * afterEach(async () => {
 *   await fs.rm(testRepo, { recursive: true, force: true });
 * });
 * ```
 */
export const createTestRepo = async (repoPath: string) => {
  // Create directory
  await fs.mkdir(repoPath, { recursive: true });

  // Initialize Git
  const git = simpleGit(repoPath);
  await git.init();

  // Configure for testing
  await setupGitConfig(repoPath);

  return git;
};

/**
 * Create initial commit in test repository
 *
 * Useful for tests that require existing commits.
 *
 * @param repoPath Path to repository
 * @param message Commit message (defaults to "Initial commit")
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   git = await createTestRepo(testRepo);
 *   await createInitialCommit(testRepo);
 *   // Repository now has 1 commit
 * });
 * ```
 */
export const createInitialCommit = async (repoPath: string, message: string = 'Initial commit') => {
  const git = simpleGit(repoPath);

  // Create README
  const readmePath = path.join(repoPath, 'README.md');
  await fs.writeFile(readmePath, '# Test Repository\n');

  // Commit
  await git.add('README.md');
  await git.commit(message);
};

/**
 * Clean up test repository
 *
 * Removes test repository directory and all contents.
 *
 * @param repoPath Path to repository to remove
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await cleanupTestRepo(testRepo);
 * });
 * ```
 */
export const cleanupTestRepo = async (repoPath: string) => {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors during cleanup
  }
};

/**
 * Create Git worktree for testing
 *
 * Creates a worktree at specified path from existing repository.
 *
 * @param mainRepoPath Path to main repository
 * @param worktreePath Path for new worktree
 * @param branchName Branch name for worktree
 *
 * @example
 * ```typescript
 * const worktree = await createTestWorktree(
 *   mainRepo,
 *   path.join(mainRepo, 'worktrees', 'feature-branch'),
 *   'feature-branch'
 * );
 * ```
 */
export const createTestWorktree = async (
  mainRepoPath: string,
  worktreePath: string,
  branchName: string
) => {
  const git = simpleGit(mainRepoPath);

  // Create worktree
  await git.raw(['worktree', 'add', worktreePath, '-b', branchName]);

  // Configure worktree
  await setupGitConfig(worktreePath);

  return simpleGit(worktreePath);
};

/**
 * Remove Git worktree
 *
 * @param mainRepoPath Path to main repository
 * @param worktreePath Path to worktree to remove
 *
 * @example
 * ```typescript
 * afterEach(async () => {
 *   await removeTestWorktree(mainRepo, worktreePath);
 * });
 * ```
 */
export const removeTestWorktree = async (mainRepoPath: string, worktreePath: string) => {
  const git = simpleGit(mainRepoPath);

  try {
    // Remove worktree
    await git.raw(['worktree', 'remove', worktreePath, '--force']);
  } catch (error) {
    // Try to clean up directory if worktree removal fails
    await cleanupTestRepo(worktreePath);
  }
};

/**
 * Get current Git user configuration
 *
 * @param repoPath Optional path to repository
 * @returns Object with user name and email
 *
 * @example
 * ```typescript
 * const user = await getGitUser();
 * // user.name === 'Test User'
 * // user.email === 'test@example.com'
 * ```
 */
export const getGitUser = async (repoPath?: string) => {
  const git = repoPath ? simpleGit(repoPath) : simpleGit();

  const name = await git.raw(['config', 'user.name']).catch(() => '');
  const email = await git.raw(['config', 'user.email']).catch(() => '');

  return {
    name: name.trim(),
    email: email.trim()
  };
};

/**
 * Check if Git is configured for testing
 *
 * @param repoPath Optional path to repository
 * @returns True if user.name and user.email are set
 *
 * @example
 * ```typescript
 * if (!await isGitConfigured()) {
 *   await setupGitConfig();
 * }
 * ```
 */
export const isGitConfigured = async (repoPath?: string): Promise<boolean> => {
  const user = await getGitUser(repoPath);
  return !!(user.name && user.email);
};
