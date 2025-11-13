/**
 * Git Operations Module
 *
 * Provides utilities for git operations during story implementation:
 * - Create git commits with descriptive messages
 * - Stage modified files
 * - Generate commit messages following project conventions
 * - Capture commit SHA for traceability
 *
 * All operations are performed in the specified worktree directory
 * to maintain isolation from the main repository.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';
import { CodeImplementation, StoryContext } from '../types.js';

const execFileAsync = promisify(execFile);

/**
 * Git commit result
 */
export interface GitCommitResult {
  /** Commit SHA */
  commitSha: string;
  /** Commit message */
  commitMessage: string;
  /** Files included in commit */
  filesCommitted: string[];
}

/**
 * Create git commit with descriptive message
 *
 * Stages all modified/created files and creates a commit with:
 * - Message format: "Story {story-id}: {brief description}"
 * - Body with acceptance criteria summary and key changes
 * - Implementation notes
 *
 * @param implementation Code implementation with files and metadata
 * @param context Story context for commit message generation
 * @param worktreePath Worktree directory path
 * @returns Git commit result with SHA and metadata
 * @throws Error if git operations fail
 */
export async function createGitCommit(
  implementation: CodeImplementation,
  context: StoryContext,
  worktreePath: string
): Promise<GitCommitResult> {
  logger.info('Creating git commit', {
    storyId: context.story.id,
    filesCount: implementation.files.length,
    worktreePath
  });

  try {
    // Stage all modified/created files
    const filePaths = implementation.files
      .filter(f => f.operation !== 'delete')
      .map(f => f.path);

    if (filePaths.length > 0) {
      await stageFiles(filePaths, worktreePath);
      logger.debug('Files staged', { filesCount: filePaths.length });
    }

    // Stage deleted files
    const deletedFiles = implementation.files
      .filter(f => f.operation === 'delete')
      .map(f => f.path);

    if (deletedFiles.length > 0) {
      await stageDeletedFiles(deletedFiles, worktreePath);
      logger.debug('Deleted files staged', { filesCount: deletedFiles.length });
    }

    // Generate commit message
    const commitMessage = generateCommitMessage(implementation, context);
    logger.debug('Commit message generated', {
      messageLength: commitMessage.length
    });

    // Create commit
    const commitSha = await commit(commitMessage, worktreePath);
    logger.info('Git commit created', {
      storyId: context.story.id,
      commitSha
    });

    return {
      commitSha,
      commitMessage,
      filesCommitted: [...filePaths, ...deletedFiles]
    };
  } catch (error) {
    logger.error('Git commit failed', error as Error, {
      storyId: context.story.id
    });
    throw new Error(
      `Failed to create git commit: ${(error as Error).message}`
    );
  }
}

/**
 * Stage files for commit
 *
 * @param filePaths File paths relative to repo root
 * @param worktreePath Worktree directory path
 * @throws Error if staging fails
 */
async function stageFiles(
  filePaths: string[],
  worktreePath: string
): Promise<void> {
  try {
    // Stage files in batches to avoid command line length limits
    const batchSize = 50;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      await execFileAsync('git', ['add', ...batch], {
        cwd: worktreePath
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to stage files: ${(error as Error).message}`
    );
  }
}

/**
 * Stage deleted files for commit
 *
 * @param filePaths File paths relative to repo root
 * @param worktreePath Worktree directory path
 * @throws Error if staging fails
 */
async function stageDeletedFiles(
  filePaths: string[],
  worktreePath: string
): Promise<void> {
  try {
    // Stage deleted files using git rm
    const batchSize = 50;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      await execFileAsync('git', ['rm', ...batch], {
        cwd: worktreePath
      });
    }
  } catch (error) {
    throw new Error(
      `Failed to stage deleted files: ${(error as Error).message}`
    );
  }
}

/**
 * Create git commit
 *
 * @param message Commit message
 * @param worktreePath Worktree directory path
 * @returns Commit SHA
 * @throws Error if commit creation fails
 */
async function commit(message: string, worktreePath: string): Promise<string> {
  try {
    // Create commit
    await execFileAsync('git', ['commit', '-m', message], {
      cwd: worktreePath
    });

    // Get commit SHA
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: worktreePath
    });

    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Failed to create commit: ${(error as Error).message}`
    );
  }
}

/**
 * Generate commit message following project conventions
 *
 * Format:
 * ```
 * Story {story-id}: {brief description}
 *
 * {acceptance criteria summary}
 *
 * Key changes:
 * - {file 1}
 * - {file 2}
 * ...
 *
 * Implementation notes:
 * {implementation notes excerpt}
 * ```
 *
 * @param implementation Code implementation
 * @param context Story context
 * @returns Formatted commit message
 */
function generateCommitMessage(
  implementation: CodeImplementation,
  context: StoryContext
): string {
  const lines: string[] = [];

  // Title: "Story {story-id}: {brief description}"
  const title = implementation.commitMessage ||
    `Story ${context.story.id}: ${context.story.title}`;
  lines.push(title);
  lines.push(''); // Blank line after title

  // Acceptance criteria summary
  if (context.story.acceptanceCriteria && context.story.acceptanceCriteria.length > 0) {
    lines.push('Acceptance Criteria:');
    const criteriaLimit = 5; // Limit to first 5 criteria
    context.story.acceptanceCriteria.slice(0, criteriaLimit).forEach((criterion, index) => {
      const truncated = criterion.length > 100
        ? criterion.substring(0, 100) + '...'
        : criterion;
      lines.push(`${index + 1}. ${truncated}`);
    });
    if (context.story.acceptanceCriteria.length > criteriaLimit) {
      lines.push(`... and ${context.story.acceptanceCriteria.length - criteriaLimit} more`);
    }
    lines.push('');
  }

  // Key changes (files modified)
  lines.push('Key changes:');
  const filesLimit = 10; // Limit to first 10 files
  implementation.files.slice(0, filesLimit).forEach(file => {
    lines.push(`- ${file.operation.toUpperCase()}: ${file.path}`);
  });
  if (implementation.files.length > filesLimit) {
    lines.push(`... and ${implementation.files.length - filesLimit} more files`);
  }
  lines.push('');

  // Implementation notes (excerpt)
  if (implementation.implementationNotes) {
    lines.push('Implementation notes:');
    const notesExcerpt = implementation.implementationNotes
      .split('\n')
      .slice(0, 10) // First 10 lines
      .join('\n');
    lines.push(notesExcerpt);

    if (implementation.implementationNotes.split('\n').length > 10) {
      lines.push('...');
    }
  }

  return lines.join('\n');
}

/**
 * Get current git branch
 *
 * @param worktreePath Worktree directory path
 * @returns Current branch name
 * @throws Error if git operation fails
 */
export async function getCurrentBranch(worktreePath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', ['branch', '--show-current'], {
      cwd: worktreePath
    });
    return stdout.trim();
  } catch (error) {
    throw new Error(
      `Failed to get current branch: ${(error as Error).message}`
    );
  }
}

/**
 * Check if worktree has uncommitted changes
 *
 * @param worktreePath Worktree directory path
 * @returns Whether there are uncommitted changes
 * @throws Error if git operation fails
 */
export async function hasUncommittedChanges(
  worktreePath: string
): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: worktreePath
    });
    return stdout.trim().length > 0;
  } catch (error) {
    throw new Error(
      `Failed to check git status: ${(error as Error).message}`
    );
  }
}

/**
 * Get list of modified files
 *
 * @param worktreePath Worktree directory path
 * @returns List of modified file paths
 * @throws Error if git operation fails
 */
export async function getModifiedFiles(
  worktreePath: string
): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: worktreePath
    });

    return stdout
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        // Parse git status output: "XY filename"
        // X = index status, Y = worktree status
        return line.substring(3).trim();
      });
  } catch (error) {
    throw new Error(
      `Failed to get modified files: ${(error as Error).message}`
    );
  }
}
