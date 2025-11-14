/**
 * E2E Test: Complete PR Lifecycle
 * Tests PR creation → CI monitoring → Auto-merge → Cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createE2ETestEnvironment,
  createStoryFile,
  createContextFile,
  updateStoryStatus,
  readStoryStatus,
  mockStoryContextGenerator,
  mockAmeliaAgentE2E,
  mockAlexAgentE2E,
  mockWorktreeManagerE2E,
  mockPRAutomator,
  executeE2EWorkflow,
} from './fixtures/e2e-test-utilities';
import { simpleFeatureStory } from './fixtures/story-fixtures';
import { simpleStoryContext, simpleStoryImplementation, simpleStoryTests, simpleStorySelfReview, simpleStoryAlexReview } from './fixtures/e2e-llm-responses';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Complete PR Lifecycle', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyId = '8-1-pr-lifecycle-test';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('pr-lifecycle');
    await createStoryFile(testEnv.storiesDir, storyId, simpleFeatureStory);
    await createContextFile(testEnv.storiesDir, storyId, simpleStoryContext);
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'ready-for-dev');
    setupGitHubMocks().mockCompletePRWorkflow('pending-then-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should complete full PR lifecycle: creation → CI → merge → cleanup', async () => {
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: simpleStoryAlexReview });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    const result = await executeE2EWorkflow({
      storyId,
      storyPath: `${testEnv.storiesDir}/${storyId}.md`,
      contextPath: `${testEnv.storiesDir}/${storyId}.context.xml`,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    expect(result.success).toBe(true);

    // Verify PR created
    expect(prAutomator.createPR).toHaveBeenCalledTimes(1);
    expect(result.prNumber).toBe(123);
    expect(result.prUrl).toBe('https://github.com/test/repo/pull/123');

    // Verify CI monitored
    expect(prAutomator.monitorCI).toHaveBeenCalledWith(123);

    // Verify auto-merge executed
    expect(prAutomator.autoMerge).toHaveBeenCalledWith(123);

    // Verify branch deleted
    expect(prAutomator.deleteBranch).toHaveBeenCalledWith(storyId);

    // Verify worktree cleaned up
    expect(worktreeManager.removeWorktree).toHaveBeenCalledWith(storyId);

    // Verify status updated to done
    const status = await readStoryStatus(testEnv.sprintStatusPath, storyId);
    expect(status).toBe('done');
  });

  it('should stop workflow if CI checks fail', async () => {
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: simpleStoryAlexReview });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('ci-failure');

    const result = await executeE2EWorkflow({
      storyId,
      storyPath: `${testEnv.storiesDir}/${storyId}.md`,
      contextPath: `${testEnv.storiesDir}/${storyId}.context.xml`,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    expect(result.success).toBe(false);
    expect(result.escalated).toBe(true);
    expect(result.reason).toContain('CI checks failed');

    // Verify auto-merge NOT called
    expect(prAutomator.autoMerge).not.toHaveBeenCalled();
  });
}, { timeout: 30000 });
