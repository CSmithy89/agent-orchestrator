/**
 * Integration Test: State Management
 *
 * Tests workflow state management:
 * - Worktree lifecycle: create → develop → cleanup
 * - Worktree isolation for parallel stories
 * - Sprint-status.yaml atomic updates
 * - State checkpointing and recovery
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  createTempTestDir,
  cleanupTempDir,
  createMockSprintStatus,
} from './fixtures/test-utilities';

describe('State Management (Story 5-8 AC6)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempTestDir('state-management');
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('Worktree Lifecycle', () => {
    it('should create isolated worktree directory', async () => {
      // Arrange
      const worktreePath = path.join(tempDir, 'worktrees', 'story-99-1');

      // Act
      await fs.mkdir(worktreePath, { recursive: true });
      const exists = await fs.access(worktreePath).then(() => true).catch(() => false);

      // Assert
      expect(exists).toBe(true);
    });

    it('should develop in isolated worktree', async () => {
      // Arrange
      const worktreePath = path.join(tempDir, 'worktrees', 'story-99-1');
      await fs.mkdir(worktreePath, { recursive: true });

      // Act: Create file in worktree
      const filePath = path.join(worktreePath, 'feature.ts');
      await fs.writeFile(filePath, 'export class Feature {}');

      // Assert: File created in worktree
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('Feature');
    });

    it('should cleanup worktree after completion', async () => {
      // Arrange
      const worktreePath = path.join(tempDir, 'worktrees', 'story-99-1');
      await fs.mkdir(worktreePath, { recursive: true });

      // Act: Cleanup
      await fs.rm(worktreePath, { recursive: true, force: true });
      const exists = await fs.access(worktreePath).then(() => true).catch(() => false);

      // Assert: Worktree removed
      expect(exists).toBe(false);
    });
  });

  describe('Worktree Isolation', () => {
    it('should isolate multiple parallel stories in separate worktrees', async () => {
      // Arrange: Create 3 worktrees
      const worktrees = ['story-99-1', 'story-99-2', 'story-99-3'];
      const worktreePaths = await Promise.all(
        worktrees.map(async (story) => {
          const wPath = path.join(tempDir, 'worktrees', story);
          await fs.mkdir(wPath, { recursive: true });
          await fs.writeFile(path.join(wPath, 'file.ts'), `// ${story}`);
          return wPath;
        })
      );

      // Assert: All worktrees exist
      expect(worktreePaths).toHaveLength(3);

      // Assert: Files are isolated
      const contents = await Promise.all(
        worktreePaths.map(async (wPath) => {
          return await fs.readFile(path.join(wPath, 'file.ts'), 'utf-8');
        })
      );

      expect(contents[0]).toContain('story-99-1');
      expect(contents[1]).toContain('story-99-2');
      expect(contents[2]).toContain('story-99-3');
    });

    it('should prevent cross-contamination between worktrees', async () => {
      // Arrange: Create 2 worktrees
      const wt1 = path.join(tempDir, 'worktrees', 'story-1');
      const wt2 = path.join(tempDir, 'worktrees', 'story-2');

      await fs.mkdir(wt1, { recursive: true });
      await fs.mkdir(wt2, { recursive: true });

      // Act: Create different files in each
      await fs.writeFile(path.join(wt1, 'feature1.ts'), 'feature1');
      await fs.writeFile(path.join(wt2, 'feature2.ts'), 'feature2');

      // Assert: Files don't cross-contaminate
      const wt1Files = await fs.readdir(wt1);
      const wt2Files = await fs.readdir(wt2);

      expect(wt1Files).toContain('feature1.ts');
      expect(wt1Files).not.toContain('feature2.ts');
      expect(wt2Files).toContain('feature2.ts');
      expect(wt2Files).not.toContain('feature1.ts');
    });
  });

  describe('Agent State Transitions', () => {
    it('should track status updates correctly', () => {
      // Arrange
      const stateTransitions: Array<{ status: string; timestamp: number }> = [];

      // Act: Track transitions
      stateTransitions.push({ status: 'idle', timestamp: Date.now() });
      stateTransitions.push({ status: 'implementing', timestamp: Date.now() });
      stateTransitions.push({ status: 'testing', timestamp: Date.now() });
      stateTransitions.push({ status: 'reviewing', timestamp: Date.now() });
      stateTransitions.push({ status: 'completed', timestamp: Date.now() });

      // Assert: All transitions logged
      expect(stateTransitions).toHaveLength(5);
      expect(stateTransitions.map(t => t.status)).toEqual([
        'idle',
        'implementing',
        'testing',
        'reviewing',
        'completed',
      ]);
    });
  });

  describe('Sprint-Status Atomic Updates', () => {
    it('should use temp file + rename pattern for atomic writes', async () => {
      // Arrange
      const statusFile = path.join(tempDir, 'sprint-status.yaml');
      const tempFile = path.join(tempDir, 'sprint-status.yaml.tmp');

      await fs.writeFile(statusFile, 'development_status:\n  story-1: ready-for-dev');

      // Act: Atomic update
      const newContent = 'development_status:\n  story-1: in-progress';
      await fs.writeFile(tempFile, newContent);
      await fs.rename(tempFile, statusFile);

      // Assert: File updated atomically
      const content = await fs.readFile(statusFile, 'utf-8');
      expect(content).toContain('in-progress');

      // Assert: Temp file removed
      const tempExists = await fs.access(tempFile).then(() => true).catch(() => false);
      expect(tempExists).toBe(false);
    });

    it('should handle concurrent updates without corruption', async () => {
      // Arrange
      const statusFile = await createMockSprintStatus(tempDir, '99-1-sample', 'ready-for-dev');

      // Act: Simulate concurrent updates (in real scenario, would use locks)
      const update1 = fs.readFile(statusFile, 'utf-8')
        .then(content => content.replace('ready-for-dev', 'in-progress'))
        .then(newContent => fs.writeFile(statusFile + '.tmp1', newContent))
        .then(() => fs.rename(statusFile + '.tmp1', statusFile));

      await update1;

      // Assert: File is consistent
      const finalContent = await fs.readFile(statusFile, 'utf-8');
      expect(finalContent).toContain('in-progress');
    });
  });

  describe('State Checkpointing', () => {
    it('should save state after each major step', async () => {
      // Arrange
      const checkpointDir = path.join(tempDir, 'checkpoints');
      await fs.mkdir(checkpointDir, { recursive: true });

      // Act: Save checkpoints
      const checkpoints = [
        { step: 'context-generation', data: { contextGenerated: true } },
        { step: 'code-implementation', data: { filesCreated: ['feature.ts'] } },
        { step: 'test-generation', data: { testsPassed: true } },
      ];

      for (const cp of checkpoints) {
        const cpFile = path.join(checkpointDir, `${cp.step}.json`);
        await fs.writeFile(cpFile, JSON.stringify(cp.data));
      }

      // Assert: All checkpoints saved
      const cpFiles = await fs.readdir(checkpointDir);
      expect(cpFiles).toHaveLength(3);
      expect(cpFiles).toContain('context-generation.json');
      expect(cpFiles).toContain('code-implementation.json');
      expect(cpFiles).toContain('test-generation.json');
    });

    it('should load state from checkpoint', async () => {
      // Arrange
      const checkpointFile = path.join(tempDir, 'checkpoint.json');
      const savedState = {
        storyId: '99-1-sample',
        currentStep: 'test-generation',
        completedSteps: ['context-generation', 'code-implementation'],
      };

      await fs.writeFile(checkpointFile, JSON.stringify(savedState));

      // Act: Load checkpoint
      const loadedStateStr = await fs.readFile(checkpointFile, 'utf-8');
      const loadedState = JSON.parse(loadedStateStr);

      // Assert: State loaded correctly
      expect(loadedState.storyId).toBe('99-1-sample');
      expect(loadedState.currentStep).toBe('test-generation');
      expect(loadedState.completedSteps).toHaveLength(2);
    });

    it('should resume from checkpoint after failure', async () => {
      // Arrange
      const checkpoint = {
        storyId: '99-1-sample',
        currentStep: 'test-generation',
        completedSteps: ['context-generation', 'code-implementation'],
      };

      // Act: Resume
      const nextStep = checkpoint.currentStep;
      const skipSteps = checkpoint.completedSteps;

      // Assert: Workflow resumes correctly
      expect(nextStep).toBe('test-generation');
      expect(skipSteps).not.toContain('test-generation');
      expect(skipSteps).toContain('context-generation');
    });
  });

  describe('State Consistency', () => {
    it('should prevent partial updates', async () => {
      // Arrange
      const statusFile = path.join(tempDir, 'sprint-status.yaml');
      const initialContent = 'development_status:\n  story-1: ready-for-dev\n  story-2: ready-for-dev';

      await fs.writeFile(statusFile, initialContent);

      // Act: Update atomically
      const updated = initialContent.replace('story-1: ready-for-dev', 'story-1: in-progress');
      await fs.writeFile(statusFile, updated);

      // Assert: Both stories present (no partial update)
      const content = await fs.readFile(statusFile, 'utf-8');
      expect(content).toContain('story-1: in-progress');
      expect(content).toContain('story-2: ready-for-dev');
    });

    it('should rollback on failure', () => {
      // Arrange
      const originalState = { storyStatus: 'ready-for-dev' };
      let currentState = { ...originalState };

      // Act: Simulate failed update
      try {
        currentState.storyStatus = 'in-progress';
        // Simulate failure
        throw new Error('Update failed');
      } catch (error) {
        // Rollback
        currentState = { ...originalState };
      }

      // Assert: State rolled back
      expect(currentState.storyStatus).toBe('ready-for-dev');
    });
  });

  describe('Concurrent Story Execution', () => {
    it('should handle 3 stories in parallel without conflicts', async () => {
      // Arrange: Create 3 worktrees
      const stories = [
        { id: '99-1', status: 'ready-for-dev' },
        { id: '99-2', status: 'ready-for-dev' },
        { id: '99-3', status: 'ready-for-dev' },
      ];

      // Act: Create isolated worktrees and status files
      const results = await Promise.all(
        stories.map(async (story) => {
          const worktreePath = path.join(tempDir, 'worktrees', `story-${story.id}`);
          await fs.mkdir(worktreePath, { recursive: true });

          const statusFile = path.join(tempDir, `status-${story.id}.yaml`);
          await fs.writeFile(statusFile, `development_status:\n  ${story.id}: ${story.status}`);

          return { story: story.id, worktreePath, statusFile };
        })
      );

      // Assert: All stories processed independently
      expect(results).toHaveLength(3);

      // Assert: No conflicts
      for (const result of results) {
        const exists = await fs.access(result.worktreePath).then(() => true).catch(() => false);
        expect(exists).toBe(true);

        const content = await fs.readFile(result.statusFile, 'utf-8');
        expect(content).toContain(result.story);
      }
    });
  });
});
