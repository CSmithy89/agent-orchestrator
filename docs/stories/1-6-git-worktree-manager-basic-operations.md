# Story 1.6: Git Worktree Manager - Basic Operations

Status: ready-for-dev

## Story

As a story development system,
I want to create and manage git worktrees for isolated story development,
So that multiple stories can develop in parallel without branch conflicts.

## Acceptance Criteria

1. ✅ Implement WorktreeManager using simple-git library
2. ✅ createWorktree(storyId) creates worktree at /wt/story-{id}/
3. ✅ Create branch story/{id} from main
4. ✅ Track worktree location, branch name, and story ID mapping
5. ✅ Push worktree branch to remote when ready
6. ✅ destroyWorktree(storyId) removes worktree and local branch
7. ✅ Handle errors gracefully (worktree already exists, git failures)
8. ✅ List active worktrees with status

## Tasks / Subtasks

- [ ] **Task 1**: Implement WorktreeManager class structure (AC: #1, #4)
  - [ ] Create `backend/src/core/WorktreeManager.ts`
  - [ ] Define Worktree TypeScript interface matching architecture spec
  - [ ] Implement WorktreeManager class with private worktrees Map
  - [ ] Initialize simple-git library instance
  - [ ] Add tracking for active worktrees in memory
  - [ ] Document WorktreeManager API with JSDoc comments

- [ ] **Task 2**: Implement createWorktree() method (AC: #2, #3, #4)
  - [ ] Implement `createWorktree(storyId: string, baseBranch: string = 'main'): Promise<Worktree>` method
  - [ ] Validate storyId format (e.g., "1-6", "2-3")
  - [ ] Check if worktree already exists for this story (throw error if exists)
  - [ ] Generate worktree path: `/wt/story-{id}/`
  - [ ] Generate branch name: `story/{id}`
  - [ ] Execute git command: `git worktree add /wt/story-{id}/ -b story/{id} main`
  - [ ] Verify worktree created successfully (check path exists)
  - [ ] Create Worktree object with metadata:
    - storyId, path, branch, baseBranch, createdAt, status: 'active'
  - [ ] Store in worktrees Map
  - [ ] Return Worktree object

- [ ] **Task 3**: Implement pushBranch() method (AC: #5)
  - [ ] Implement `pushBranch(storyId: string): Promise<void>` method
  - [ ] Retrieve worktree from worktrees Map
  - [ ] Throw error if worktree not found
  - [ ] Change directory to worktree path
  - [ ] Execute git command: `git push -u origin story/{id}`
  - [ ] Update worktree status to 'pr-created'
  - [ ] Handle push errors (network, permissions, conflicts)

- [ ] **Task 4**: Implement destroyWorktree() method (AC: #6)
  - [ ] Implement `destroyWorktree(storyId: string): Promise<void>` method
  - [ ] Retrieve worktree from worktrees Map
  - [ ] Throw error if worktree not found
  - [ ] Execute git command: `git worktree remove /wt/story-{id}/`
  - [ ] Delete local branch: `git branch -D story/{id}`
  - [ ] Remove from worktrees Map
  - [ ] Update status to 'merged' or 'abandoned' before removal
  - [ ] Handle cleanup errors gracefully (log warning, continue)

- [ ] **Task 5**: Implement listActiveWorktrees() method (AC: #8)
  - [ ] Implement `listActiveWorktrees(): Promise<Worktree[]>` method
  - [ ] Return array of all worktrees from worktrees Map
  - [ ] Filter by status: 'active' or 'pr-created'
  - [ ] Sort by createdAt timestamp (oldest first)
  - [ ] Include worktree metadata: storyId, path, branch, status
  - [ ] Query git for actual worktree status: `git worktree list`
  - [ ] Cross-reference with tracked worktrees (detect orphaned)

- [ ] **Task 6**: Error handling and validation (AC: #7)
  - [ ] Implement `validateWorktreeNotExists(storyId: string): void` private method
  - [ ] Check if worktree already exists in Map
  - [ ] Query git worktree list to detect manual worktrees
  - [ ] Throw WorktreeExistsError with clear message
  - [ ] Implement error handling for git operations:
    - Git not available: WorktreeGitError
    - Permission denied: WorktreePermissionError
    - Worktree path conflicts: WorktreePathError
  - [ ] Handle merge conflicts detection (check git status)
  - [ ] Provide clear error messages with resolution steps
  - [ ] Log all errors with context (storyId, path, command)

- [ ] **Task 7**: Worktree persistence and recovery (AC: #4)
  - [ ] Save worktrees Map to `.bmad/worktrees.json` on create/destroy
  - [ ] Load worktrees from file on WorktreeManager initialization
  - [ ] Validate loaded worktrees still exist in git
  - [ ] Sync tracked worktrees with actual git worktrees on startup
  - [ ] Remove stale worktrees from tracking (if git removed externally)
  - [ ] Handle missing worktrees gracefully (log warning, update tracking)

- [ ] **Task 8**: Integration with project configuration (AC: #1)
  - [ ] Load base branch from project config (default: 'main')
  - [ ] Support custom worktree base path from config
  - [ ] Validate repository is a valid git repo before operations
  - [ ] Check remote is configured for push operations
  - [ ] Verify user has git credentials configured
  - [ ] Handle monorepo scenarios (worktree at repo root)

- [ ] **Task 9**: Testing and validation
  - [ ] Write unit tests for WorktreeManager class
  - [ ] Test createWorktree() creates path and branch correctly
  - [ ] Test destroyWorktree() removes worktree and branch
  - [ ] Test pushBranch() pushes to remote
  - [ ] Test listActiveWorktrees() returns correct worktrees
  - [ ] Test error handling (worktree exists, git failures)
  - [ ] Test validation logic (invalid storyId, missing repo)
  - [ ] Test worktree persistence and recovery
  - [ ] Integration test: create → push → destroy workflow
  - [ ] Test concurrent worktree operations (multiple stories)

## Dev Notes

### Architecture Context

This story implements the **WorktreeManager** component from Epic 1 tech spec (Section 2.1.4: Worktree Manager). Git worktrees enable true parallel story development by creating isolated working directories for each story, eliminating branch switching overhead and preventing conflicts.

**Key Design Decisions:**
- Worktrees created at `/wt/story-{id}/` for consistent paths
- Branch naming: `story/{id}` follows convention
- In-memory tracking with persistence for crash recovery
- Graceful error handling with clear escalation messages

[Source: docs/architecture.md#Worktree-Manager]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - `simple-git` ^3.20.0 - Git operations library
  - Path and file operations - Node.js `path` and `fs/promises` modules

**Git Requirements:**
- Git version ≥2.15.0 (worktree commands)
- Valid git repository
- Remote repository configured for push operations

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── WorktreeManager.ts        ← This story
│   │   │   ├── StateManager.ts           ← Story 1.5 (completed)
│   │   │   └── WorkflowParser.ts         ← Story 1.2 (completed)
│   │   └── types/
│   │       └── worktree.types.ts         ← Worktree interface
│   ├── tests/
│   │   └── core/
│   │       └── WorktreeManager.test.ts   ← Tests for this story
│   └── package.json                       ← Update with simple-git
├── .bmad/
│   └── worktrees.json                     ← Worktree tracking
├── wt/                                    ← Worktree root directory
│   ├── story-1-2/                         ← Example worktree
│   └── story-1-3/                         ← Example worktree
```

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### Worktree Interface

**Worktree Schema** (from architecture):
```typescript
interface Worktree {
  storyId: string;           // e.g., "1-6", "2-3"
  path: string;              // /wt/story-{id}/
  branch: string;            // story/{id}
  baseBranch: string;        // main (or configured base)
  createdAt: Date;           // Timestamp of creation
  status: 'active' | 'pr-created' | 'merged' | 'abandoned';
}

interface WorktreeManager {
  createWorktree(storyId: string, baseBranch?: string): Promise<Worktree>;
  destroyWorktree(storyId: string): Promise<void>;
  pushBranch(storyId: string): Promise<void>;
  listActiveWorktrees(): Promise<Worktree[]>;
}
```

[Source: docs/architecture.md#Worktree-Manager]

### Git Worktree Operations

**Worktree Workflow:**
1. **Create**: `git worktree add /wt/story-005/ -b story/005 main`
2. **Develop**: Amelia agent works in `/wt/story-005/`
3. **Commit**: Local commits in worktree branch
4. **Push**: `git push -u origin story/005`
5. **PR**: Created via GitHub API (Story 5.8)
6. **Cleanup**: `git worktree remove /wt/story-005/` after merge

**Isolation Benefits:**
- **Parallel Development**: Multiple stories develop simultaneously
- **No Branch Conflicts**: Each worktree is independent
- **Fast Switching**: No need to stash/unstash changes
- **Clean History**: Each branch has focused commits

[Source: docs/architecture.md#Worktree-Manager]

### Error Handling Patterns

**Error Types:**
1. **WorktreeExistsError**: Worktree already exists for story → Provide cleanup instructions
2. **WorktreeNotFoundError**: Worktree doesn't exist → Check if manually removed
3. **WorktreeGitError**: Git command failed → Log command, output, suggest resolution
4. **WorktreePathError**: Path conflicts or permissions → Check directory permissions
5. **WorktreePushError**: Push to remote failed → Check network, credentials

**Error Message Format:**
```
WorktreeExistsError: Worktree already exists for story 1-6

Worktree path: /wt/story-1-6/
Branch: story/1-6
Status: active

To cleanup, run: orchestrator worktree destroy 1-6
Or manually: git worktree remove /wt/story-1-6/
```

[Source: docs/tech-spec-epic-1.md#Error-Handling]

### Worktree Persistence

**Tracking File Format** (`.bmad/worktrees.json`):
```json
{
  "worktrees": [
    {
      "storyId": "1-6",
      "path": "/wt/story-1-6/",
      "branch": "story/1-6",
      "baseBranch": "main",
      "createdAt": "2025-11-05T10:30:00Z",
      "status": "active"
    }
  ],
  "lastSync": "2025-11-05T10:35:00Z"
}
```

**Sync Strategy:**
- Save after every create/destroy operation
- Load on WorktreeManager initialization
- Cross-reference with `git worktree list` output
- Remove stale entries (worktrees removed externally)
- Update status based on git state

[Source: docs/architecture.md#Worktree-Manager]

### Simple-Git Library Usage

**Key Methods:**
```typescript
import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit('/path/to/repo');

// Create worktree
await git.raw(['worktree', 'add', '/wt/story-1-6/', '-b', 'story/1-6', 'main']);

// List worktrees
const list = await git.raw(['worktree', 'list', '--porcelain']);

// Remove worktree
await git.raw(['worktree', 'remove', '/wt/story-1-6/']);

// Delete branch
await git.branch(['-D', 'story/1-6']);

// Push branch with upstream
await git.push('origin', 'story/1-6', ['--set-upstream']);
```

**Configuration:**
- Set baseDir to project root on initialization
- Enable binary path detection for cross-platform
- Set maxConcurrentProcesses: 5 for parallel operations
- Configure timeout: 30000ms for git operations

[Source: simple-git documentation]

### Testing Strategy

**Unit Tests (60% of coverage):**
- Test createWorktree() with valid storyId
- Test createWorktree() throws error if worktree exists
- Test destroyWorktree() removes worktree and branch
- Test destroyWorktree() throws error if worktree not found
- Test pushBranch() pushes to remote correctly
- Test listActiveWorktrees() returns correct list
- Test validateWorktreeNotExists() detects conflicts
- Test error handling for git command failures

**Integration Tests (30% of coverage):**
- Test full workflow: create → commit → push → destroy
- Test concurrent worktree operations (3 stories in parallel)
- Test worktree persistence (save → restart → load)
- Test sync with git worktree list (detect external changes)
- Test cleanup of orphaned worktrees
- Test handling of git errors (no remote, network failure)

**Edge Cases:**
- Story IDs with special characters (sanitize)
- Worktree path already exists as regular directory
- Git repository not initialized
- Remote repository not configured
- Network failures during push
- Disk full during worktree creation
- Concurrent create/destroy race conditions

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Performance Considerations

**Worktree Operations:**
- Create worktree: ~1-2 seconds (depends on repo size)
- Destroy worktree: <1 second
- List worktrees: <100ms
- Push branch: Variable (network dependent)

**Concurrent Worktrees:**
- Support up to 10 concurrent worktrees per project
- Each worktree ~100-500MB disk space (repo dependent)
- No performance degradation with multiple worktrees
- Cleanup orphaned worktrees on startup (async)

**Optimization:**
- Cache worktree list for 30 seconds (reduce git calls)
- Lazy initialize git client on first operation
- Batch destroy operations when cleaning up multiple worktrees

[Source: docs/architecture.md#Worktree-Manager]

### Integration Points

**Used By:**
- Story 5.3: Code Implementation Workflow (creates worktree for dev)
- Story 5.8: Pull Request Creation (pushes worktree branch)
- Story 5.10: PR Merge Automation (destroys worktree after merge)
- CLI commands: `orchestrator worktree create/destroy/list`

**Depends On:**
- Story 1.1: ProjectConfig (for base branch configuration)
- Git repository: Must be valid git repo with remote

[Source: docs/epics.md#Story-Dependencies]

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#Worktree-Manager)
- **Architecture**: [docs/architecture.md#Worktree-Manager](../architecture.md)
- **Story Source**: [docs/epics.md#Story-1-6](../epics.md)
- **Dependencies**: Story 1.1 (ProjectConfig for configuration)
- **Used By**: Story 5.3, 5.8, 5.10 (Story development workflows)

### Learnings from Previous Story

**From Story 1.5 (State Manager - File Persistence):**
- ✅ Use atomic writes for persistence (temp + rename pattern)
- ✅ Validate data structure before saving
- ✅ Provide clear error messages with context
- ✅ Document public API with JSDoc comments
- ✅ Use custom error classes for different failure types
- ✅ Sync in-memory state with file storage on startup
- ✅ Handle corrupted or missing files gracefully

**Applied to WorktreeManager:**
- Use atomic writes for worktrees.json persistence
- Validate worktree data before saving
- Custom error classes: WorktreeExistsError, WorktreeNotFoundError, etc.
- Sync tracked worktrees with git worktree list on startup
- Handle missing or invalid worktrees.json gracefully

[Source: docs/stories/1-5-state-manager-file-persistence.md#Dev-Notes]

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-6-git-worktree-manager-basic-operations.context.xml)

### Agent Model Used

_To be determined during implementation_

### Debug Log References

_To be added during development_

### Completion Notes List

_To be added upon story completion_

### File List

_To be added upon story completion_
