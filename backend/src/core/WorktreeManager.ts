/**
 * WorktreeManager - Manage git worktrees for isolated story development
 * Enables parallel story development without branch conflicts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import simpleGit, { SimpleGit, GitError } from 'simple-git';
import {
  Worktree,
  WorktreeStatus,
  WorktreePersistenceData,
  WorktreeSerializable,
  WorktreeError,
  WorktreeExistsError,
  WorktreeNotFoundError,
  WorktreeGitError,
  WorktreePathError,
  WorktreePushError
} from '../types/worktree.types.js';

/**
 * WorktreeManager class
 * Manages git worktrees for isolated story development with persistence and recovery
 */
export class WorktreeManager {
  private readonly projectRoot: string;
  private readonly worktreesPath: string;
  private readonly persistencePath: string;
  private readonly git: SimpleGit;
  private readonly worktrees: Map<string, Worktree> = new Map();
  private readonly baseBranch: string;

  /**
   * Create a new WorktreeManager instance
   * @param projectRoot Absolute path to project root directory
   * @param baseBranch Base branch for creating worktrees (default: 'main')
   */
  constructor(projectRoot: string, baseBranch: string = 'main') {
    this.projectRoot = projectRoot;
    this.baseBranch = baseBranch;
    this.worktreesPath = path.join(projectRoot, 'wt');
    this.persistencePath = path.join(projectRoot, '.bmad', 'worktrees.json');

    // Initialize simple-git with project root
    this.git = simpleGit({
      baseDir: projectRoot,
      binary: 'git',
      maxConcurrentProcesses: 5,
      trimmed: false,
      timeout: {
        block: 30000
      }
    });
  }

  /**
   * Initialize WorktreeManager
   * Loads persisted worktrees and syncs with actual git worktrees
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      // Validate this is a git repository
      await this.validateGitRepository();

      // Load persisted worktrees
      await this.loadPersistedWorktrees();

      // Sync with actual git worktrees
      await this.syncWithGitWorktrees();

      // Ensure worktrees directory exists
      await this.ensureWorktreesDirectory();
    } catch (error) {
      if (error instanceof WorktreeError) {
        throw error;
      }
      throw new WorktreeError(
        `Failed to initialize WorktreeManager: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new worktree for story development
   * @param storyId Story identifier (e.g., "1-6", "2-3")
   * @param baseBranch Base branch to create worktree from (default: configured base)
   * @returns Promise resolving to the created Worktree object
   * @throws WorktreeExistsError if worktree already exists for this story
   * @throws WorktreeGitError if git operation fails
   */
  async createWorktree(storyId: string, baseBranch?: string): Promise<Worktree> {
    // Validate storyId format
    this.validateStoryId(storyId);

    // Check if worktree already exists
    this.validateWorktreeNotExists(storyId);

    const branch = baseBranch || this.baseBranch;
    const worktreePath = this.getWorktreePath(storyId);
    const branchName = this.getBranchName(storyId);

    try {
      // Create worktree with new branch
      await this.git.raw([
        'worktree',
        'add',
        worktreePath,
        '-b',
        branchName,
        branch
      ]);

      // Verify worktree was created
      await this.verifyPathExists(worktreePath, storyId);

      // Create Worktree object
      const worktree: Worktree = {
        storyId,
        path: worktreePath,
        branch: branchName,
        baseBranch: branch,
        createdAt: new Date(),
        status: 'active'
      };

      // Store in tracking map
      this.worktrees.set(storyId, worktree);

      // Persist to disk
      await this.persistWorktrees();

      return worktree;
    } catch (error) {
      if (error instanceof WorktreeError) {
        throw error;
      }

      const gitError = error as GitError;
      throw new WorktreeGitError(
        gitError.message || String(error),
        `git worktree add ${worktreePath} -b ${branchName} ${branch}`,
        gitError.message || '',
        storyId
      );
    }
  }

  /**
   * Push worktree branch to remote repository
   * @param storyId Story identifier
   * @returns Promise that resolves when push is complete
   * @throws WorktreeNotFoundError if worktree doesn't exist
   * @throws WorktreePushError if push operation fails
   */
  async pushBranch(storyId: string): Promise<void> {
    const worktree = this.getWorktreeOrThrow(storyId);

    try {
      // Push branch with upstream tracking
      const gitInstance = simpleGit(worktree.path);
      await gitInstance.push('origin', worktree.branch, ['--set-upstream']);

      // Update status
      worktree.status = 'pr-created';
      this.worktrees.set(storyId, worktree);

      // Persist changes
      await this.persistWorktrees();
    } catch (error) {
      const gitError = error as GitError;
      throw new WorktreePushError(
        gitError.message || String(error),
        worktree.branch,
        storyId
      );
    }
  }

  /**
   * Destroy a worktree and remove its branch
   * @param storyId Story identifier
   * @returns Promise that resolves when worktree is destroyed
   * @throws WorktreeNotFoundError if worktree doesn't exist
   */
  async destroyWorktree(storyId: string): Promise<void> {
    const worktree = this.getWorktreeOrThrow(storyId);

    try {
      // Update status before removal
      worktree.status = 'merged';

      // Remove worktree
      await this.git.raw(['worktree', 'remove', worktree.path]);

      // Delete local branch
      try {
        await this.git.branch(['-D', worktree.branch]);
      } catch (error) {
        // Log warning but continue - branch may already be deleted
        console.warn(`Warning: Could not delete branch ${worktree.branch}: ${error}`);
      }

      // Remove from tracking
      this.worktrees.delete(storyId);

      // Persist changes
      await this.persistWorktrees();
    } catch (error) {
      if (error instanceof WorktreeError) {
        throw error;
      }

      // Log warning but don't fail - worktree may already be removed
      console.warn(`Warning during worktree cleanup for ${storyId}: ${error}`);

      // Still remove from tracking
      this.worktrees.delete(storyId);
      await this.persistWorktrees();
    }
  }

  /**
   * List all active worktrees
   * @returns Promise resolving to array of active/pr-created worktrees
   */
  async listActiveWorktrees(): Promise<Worktree[]> {
    // Filter by active statuses
    const activeWorktrees = Array.from(this.worktrees.values())
      .filter(wt => wt.status === 'active' || wt.status === 'pr-created')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return activeWorktrees;
  }

  /**
   * Get a specific worktree by story ID
   * @param storyId Story identifier
   * @returns Worktree object or undefined if not found
   */
  getWorktree(storyId: string): Worktree | undefined {
    return this.worktrees.get(storyId);
  }

  /**
   * Validate that worktree doesn't already exist for this story
   * @param storyId Story identifier
   * @throws WorktreeExistsError if worktree exists
   */
  private validateWorktreeNotExists(storyId: string): void {
    const existing = this.worktrees.get(storyId);
    if (existing) {
      throw new WorktreeExistsError(storyId, existing.path, existing.branch);
    }

    // Also check git worktree list for manually created worktrees
    const expectedPath = this.getWorktreePath(storyId);
    const expectedBranch = this.getBranchName(storyId);

    // Note: For full validation, we'd query git here, but that's expensive
    // The sync operation on initialization handles detection of manual worktrees
  }

  /**
   * Get worktree or throw error if not found
   * @param storyId Story identifier
   * @returns Worktree object
   * @throws WorktreeNotFoundError if worktree doesn't exist
   */
  private getWorktreeOrThrow(storyId: string): Worktree {
    const worktree = this.worktrees.get(storyId);
    if (!worktree) {
      throw new WorktreeNotFoundError(storyId);
    }
    return worktree;
  }

  /**
   * Validate story ID format
   * @param storyId Story identifier
   * @throws WorktreeError if format is invalid
   */
  private validateStoryId(storyId: string): void {
    const validPattern = /^[\w]+-[\w]+$/;
    if (!validPattern.test(storyId)) {
      throw new WorktreeError(
        `Invalid story ID format: "${storyId}". Expected format: "epic-story" (e.g., "1-6", "2-3")`,
        storyId
      );
    }
  }

  /**
   * Get worktree path for story
   * @param storyId Story identifier
   * @returns Absolute path to worktree directory
   */
  private getWorktreePath(storyId: string): string {
    return path.join(this.worktreesPath, `story-${storyId}`);
  }

  /**
   * Get branch name for story
   * @param storyId Story identifier
   * @returns Branch name
   */
  private getBranchName(storyId: string): string {
    return `story/${storyId}`;
  }

  /**
   * Validate that project is a valid git repository
   * @throws WorktreeGitError if not a valid git repository
   */
  private async validateGitRepository(): Promise<void> {
    try {
      // Try to run a git command to verify it's a valid repo
      await this.git.revparse(['--git-dir']);
    } catch (error) {
      throw new WorktreeGitError(
        'Not a valid git repository',
        'git rev-parse --git-dir',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Ensure worktrees directory exists
   * @throws WorktreePathError if directory cannot be created
   */
  private async ensureWorktreesDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.worktreesPath, { recursive: true });
    } catch (error) {
      throw new WorktreePathError(
        `Failed to create worktrees directory: ${error instanceof Error ? error.message : String(error)}`,
        this.worktreesPath
      );
    }
  }

  /**
   * Verify that path exists on filesystem
   * @param filePath Path to verify
   * @param storyId Story identifier for error context
   * @throws WorktreePathError if path doesn't exist
   */
  private async verifyPathExists(filePath: string, storyId: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new WorktreePathError(
        `Worktree path does not exist after creation`,
        filePath,
        storyId
      );
    }
  }

  /**
   * Load persisted worktrees from disk
   */
  private async loadPersistedWorktrees(): Promise<void> {
    try {
      // Ensure .bmad directory exists
      const bmadDir = path.dirname(this.persistencePath);
      await fs.mkdir(bmadDir, { recursive: true });

      // Try to read persistence file
      const fileContents = await fs.readFile(this.persistencePath, 'utf-8');
      const data: WorktreePersistenceData = JSON.parse(fileContents);

      // Deserialize worktrees
      for (const serialized of data.worktrees) {
        const worktree: Worktree = {
          ...serialized,
          createdAt: new Date(serialized.createdAt)
        };
        this.worktrees.set(worktree.storyId, worktree);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist yet - this is fine for first run
        return;
      }
      // Log warning but don't fail - corrupted persistence file
      console.warn(`Warning: Could not load persisted worktrees: ${error}`);
    }
  }

  /**
   * Persist worktrees to disk
   */
  private async persistWorktrees(): Promise<void> {
    try {
      // Serialize worktrees
      const serialized: WorktreeSerializable[] = Array.from(this.worktrees.values()).map(wt => ({
        ...wt,
        createdAt: wt.createdAt.toISOString()
      }));

      const data: WorktreePersistenceData = {
        worktrees: serialized,
        lastSync: new Date().toISOString()
      };

      // Atomic write: temp file + rename
      const tempPath = `${this.persistencePath}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.rename(tempPath, this.persistencePath);
    } catch (error) {
      // Log warning but don't fail - persistence is not critical
      console.warn(`Warning: Could not persist worktrees: ${error}`);
    }
  }

  /**
   * Sync tracked worktrees with actual git worktrees
   * Detects manually created/removed worktrees and orphaned entries
   */
  private async syncWithGitWorktrees(): Promise<void> {
    try {
      // Get actual worktrees from git
      const output = await this.git.raw(['worktree', 'list', '--porcelain']);
      const gitWorktrees = this.parseWorktreeList(output);

      const trackedPaths = new Set(
        Array.from(this.worktrees.values()).map(wt => path.resolve(wt.path))
      );

      // Check each tracked worktree
      for (const [storyId, worktree] of this.worktrees.entries()) {
        const exists = gitWorktrees.some(
          gw => path.resolve(gw.path) === path.resolve(worktree.path)
        );
        if (!exists) {
          // Worktree was removed externally
          console.warn(`Removing stale worktree tracking for ${storyId} (path: ${worktree.path})`);
          this.worktrees.delete(storyId);
          trackedPaths.delete(path.resolve(worktree.path));
        }
      }

      // Register git worktrees that are not yet tracked
      for (const gitWorktree of gitWorktrees) {
        const resolvedPath = path.resolve(gitWorktree.path);
        if (resolvedPath === path.resolve(this.projectRoot) || trackedPaths.has(resolvedPath)) {
          continue;
        }

        const folderMatch = path.basename(gitWorktree.path).match(/^story-(.+)$/);
        if (!folderMatch) {
          continue;
        }

        const storyId = folderMatch[1];
        if (this.worktrees.has(storyId)) {
          continue;
        }

        const branchName = (gitWorktree.branch || '').replace(/^refs\/heads\//, '');

        this.worktrees.set(storyId, {
          storyId,
          path: gitWorktree.path,
          branch: branchName,
          baseBranch: this.baseBranch,
          createdAt: new Date(),
          status: 'active'
        });
        trackedPaths.add(resolvedPath);
      }

      // Persist cleaned up/discovered state
      await this.persistWorktrees();
    } catch (error) {
      // Log warning but don't fail - sync is best-effort
      console.warn(`Warning: Could not sync with git worktrees: ${error}`);
    }
  }

  /**
   * Parse output of `git worktree list --porcelain`
   * @param output Git command output
   * @returns Array of worktree info objects
   */
  private parseWorktreeList(output: string): Array<{ path: string; branch: string }> {
    const worktrees: Array<{ path: string; branch: string }> = [];
    const lines = output.split('\n');

    let currentPath = '';
    let currentBranch = '';

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        currentPath = line.substring('worktree '.length).trim();
      } else if (line.startsWith('branch ')) {
        currentBranch = line.substring('branch '.length).trim();
      } else if (line === '') {
        // Empty line marks end of worktree entry
        if (currentPath) {
          worktrees.push({ path: currentPath, branch: currentBranch });
        }
        currentPath = '';
        currentBranch = '';
      }
    }

    // Handle last entry if no trailing newline
    if (currentPath) {
      worktrees.push({ path: currentPath, branch: currentBranch });
    }

    return worktrees;
  }
}
