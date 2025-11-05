/**
 * Worktree Type Definitions
 *
 * Defines types for git worktree management operations.
 */

/**
 * Represents a git worktree for isolated story development.
 */
export interface Worktree {
  /** Story identifier (e.g., "1-6", "2-3") */
  storyId: string;
  /** Absolute path to worktree directory (e.g., "/wt/story-1-6/") */
  path: string;
  /** Branch name associated with worktree (e.g., "story/1-6") */
  branch: string;
  /** Base branch from which worktree was created (e.g., "main") */
  baseBranch: string;
  /** Timestamp when worktree was created */
  createdAt: Date;
  /** Current status of the worktree */
  status: WorktreeStatus;
}

/**
 * Possible states of a worktree throughout its lifecycle.
 */
export type WorktreeStatus = 'active' | 'pr-created' | 'merged' | 'abandoned';

/**
 * Persistence format for worktree tracking.
 */
export interface WorktreePersistenceData {
  /** List of tracked worktrees */
  worktrees: WorktreeSerializable[];
  /** Last sync timestamp with git worktree list */
  lastSync: string;
}

/**
 * Serializable format for worktree data (dates as ISO strings).
 */
export interface WorktreeSerializable {
  storyId: string;
  path: string;
  branch: string;
  baseBranch: string;
  createdAt: string;  // ISO 8601 date string
  status: WorktreeStatus;
}

/**
 * Base error class for worktree operations.
 */
export class WorktreeError extends Error {
  constructor(message: string, public readonly storyId?: string) {
    super(message);
    this.name = 'WorktreeError';
    Object.setPrototypeOf(this, WorktreeError.prototype);
  }
}

/**
 * Error thrown when attempting to create a worktree that already exists.
 */
export class WorktreeExistsError extends WorktreeError {
  constructor(
    storyId: string,
    public readonly existingPath: string,
    public readonly existingBranch: string
  ) {
    super(
      `Worktree already exists for story ${storyId}\n\n` +
      `Worktree path: ${existingPath}\n` +
      `Branch: ${existingBranch}\n` +
      `Status: active\n\n` +
      `To cleanup, run: git worktree remove ${existingPath}\n` +
      `Or use destroyWorktree('${storyId}')`,
      storyId
    );
    this.name = 'WorktreeExistsError';
    Object.setPrototypeOf(this, WorktreeExistsError.prototype);
  }
}

/**
 * Error thrown when attempting to operate on a worktree that doesn't exist.
 */
export class WorktreeNotFoundError extends WorktreeError {
  constructor(storyId: string) {
    super(
      `Worktree not found for story ${storyId}\n\n` +
      `The worktree may have been manually removed or never created.\n` +
      `Use createWorktree('${storyId}') to create a new worktree.`,
      storyId
    );
    this.name = 'WorktreeNotFoundError';
    Object.setPrototypeOf(this, WorktreeNotFoundError.prototype);
  }
}

/**
 * Error thrown when git commands fail during worktree operations.
 */
export class WorktreeGitError extends WorktreeError {
  constructor(
    message: string,
    public readonly command: string,
    public readonly output: string,
    storyId?: string
  ) {
    super(
      `Git command failed: ${command}\n\n` +
      `Error: ${message}\n` +
      `Output: ${output}\n\n` +
      `Suggestion: Check git installation and repository state.`,
      storyId
    );
    this.name = 'WorktreeGitError';
    Object.setPrototypeOf(this, WorktreeGitError.prototype);
  }
}

/**
 * Error thrown when worktree path operations fail (permissions, conflicts, etc.).
 */
export class WorktreePathError extends WorktreeError {
  constructor(message: string, public readonly path: string, storyId?: string) {
    super(
      `Worktree path error: ${path}\n\n` +
      `Error: ${message}\n\n` +
      `Suggestion: Check directory permissions and path availability.`,
      storyId
    );
    this.name = 'WorktreePathError';
    Object.setPrototypeOf(this, WorktreePathError.prototype);
  }
}

/**
 * Error thrown when push operations fail.
 */
export class WorktreePushError extends WorktreeError {
  constructor(
    message: string,
    public readonly branch: string,
    storyId?: string
  ) {
    super(
      `Failed to push branch: ${branch}\n\n` +
      `Error: ${message}\n\n` +
      `Suggestion: Check network connection, remote configuration, and credentials.`,
      storyId
    );
    this.name = 'WorktreePushError';
    Object.setPrototypeOf(this, WorktreePushError.prototype);
  }
}
