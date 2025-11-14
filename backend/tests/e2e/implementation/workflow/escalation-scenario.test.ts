/**
 * E2E Test: Human Escalation Scenario
 * Tests story that triggers escalation due to low confidence or critical issues
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
import { ambiguousRequirementsStory } from './fixtures/story-fixtures';
import { escalationStoryImplementation, escalationSelfReview, escalationAlexReview } from './fixtures/e2e-llm-responses';
import { cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Human Escalation Scenario', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyId = '4-1-recommendation-algorithm';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('escalation');
    await createStoryFile(testEnv.storiesDir, storyId, ambiguousRequirementsStory);
    await createContextFile(testEnv.storiesDir, storyId, { storyId, title: 'Recommendation Algorithm' });
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'ready-for-dev');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should trigger escalation for low confidence review', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: escalationStoryImplementation,
      tests: { files: [], framework: 'vitest', testCount: 2, coverage: { lines: { total: 20, covered: 10, percentage: 50 }, functions: { total: 2, covered: 1, percentage: 50 }, branches: { total: 4, covered: 2, percentage: 50 }, statements: { total: 20, covered: 10, percentage: 50 } }, results: { passed: 2, failed: 0, skipped: 0, total: 2, duration: 100 } },
      selfReview: escalationSelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: escalationAlexReview });
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

    // Verify escalation triggered
    expect(result.success).toBe(false);
    expect(result.escalated).toBe(true);
    expect(result.reason).toContain('Low confidence');
    expect(prAutomator.createPR).not.toHaveBeenCalled();
  });

  it('should preserve worktree for human debugging', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: escalationStoryImplementation,
      tests: { files: [], framework: 'vitest', testCount: 2, coverage: { lines: { total: 20, covered: 10, percentage: 50 }, functions: { total: 2, covered: 1, percentage: 50 }, branches: { total: 4, covered: 2, percentage: 50 }, statements: { total: 20, covered: 10, percentage: 50 } }, results: { passed: 2, failed: 0, skipped: 0, total: 2, duration: 100 } },
      selfReview: escalationSelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: escalationAlexReview });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    await executeE2EWorkflow({
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

    // Verify worktree NOT cleaned up
    expect(worktreeManager.removeWorktree).not.toHaveBeenCalled();
    const worktrees = await worktreeManager.listWorktrees();
    expect(worktrees.length).toBeGreaterThan(0);
  });

  it('should keep story status as in-progress (not done)', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: escalationStoryImplementation,
      tests: { files: [], framework: 'vitest', testCount: 2, coverage: { lines: { total: 20, covered: 10, percentage: 50 }, functions: { total: 2, covered: 1, percentage: 50 }, branches: { total: 4, covered: 2, percentage: 50 }, statements: { total: 20, covered: 10, percentage: 50 } }, results: { passed: 2, failed: 0, skipped: 0, total: 2, duration: 100 } },
      selfReview: escalationSelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: escalationAlexReview });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'in-progress');

    await executeE2EWorkflow({
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

    // Status should NOT be updated to done
    const status = await readStoryStatus(testEnv.sprintStatusPath, storyId);
    expect(status).toBe('in-progress'); // Still in-progress, not done
  });

  it('should provide escalation context with story details and recommendations', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: escalationStoryImplementation,
      tests: { files: [], framework: 'vitest', testCount: 2, coverage: { lines: { total: 20, covered: 10, percentage: 50 }, functions: { total: 2, covered: 1, percentage: 50 }, branches: { total: 4, covered: 2, percentage: 50 }, statements: { total: 20, covered: 10, percentage: 50 } }, results: { passed: 2, failed: 0, skipped: 0, total: 2, duration: 100 } },
      selfReview: escalationSelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: escalationAlexReview });
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

    expect(result.review).toBeDefined();
    expect(result.review.recommendations).toBeDefined();
    expect(result.review.recommendations.length).toBeGreaterThan(0);
    expect(result.review.criticalIssues).toContain('Requirements too vague for confident implementation');
  });
}, { timeout: 30000 });
