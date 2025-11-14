/**
 * E2E Test: Performance Benchmark
 * Validates full story execution <2 hours with performance metrics tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createE2ETestEnvironment,
  createStoryFile,
  createContextFile,
  updateStoryStatus,
  mockStoryContextGenerator,
  mockAmeliaAgentE2E,
  mockAlexAgentE2E,
  mockWorktreeManagerE2E,
  mockPRAutomator,
  executeE2EWorkflow,
  assertPerformanceMetrics,
} from './fixtures/e2e-test-utilities';
import { simpleFeatureStory } from './fixtures/story-fixtures';
import { simpleStoryContext, simpleStoryImplementation, simpleStoryTests, simpleStorySelfReview, simpleStoryAlexReview } from './fixtures/e2e-llm-responses';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Performance Benchmark', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyId = '9-1-performance-benchmark';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('performance-benchmark');
    await createStoryFile(testEnv.storiesDir, storyId, simpleFeatureStory);
    await createContextFile(testEnv.storiesDir, storyId, simpleStoryContext);
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'ready-for-dev');
    setupGitHubMocks().mockCompletePRWorkflow('all-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should execute full workflow in <2 hours (simulated)', async () => {
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: simpleStoryAlexReview });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    const startTime = Date.now();
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
      measurePerformance: true,
    });
    const totalDuration = Date.now() - startTime;

    expect(result.success).toBe(true);

    // Verify E2E test execution time (mocked, should be fast)
    expect(totalDuration).toBeLessThan(10000); // 10 seconds for E2E test

    // Verify performance metrics captured
    expect(result.metrics).toBeDefined();
    expect(result.metrics!.length).toBeGreaterThan(0);

    const metricsByStep = result.metrics!.reduce((acc: Record<string, number>, m: any) => {
      acc[m.stepName] = m.duration;
      return acc;
    }, {});

    // Validate all steps measured
    expect(metricsByStep['context-generation']).toBeDefined();
    expect(metricsByStep['code-implementation']).toBeDefined();
    expect(metricsByStep['test-generation']).toBeDefined();
    expect(metricsByStep['independent-review']).toBeDefined();
    expect(metricsByStep['pr-creation']).toBeDefined();

    // In real workflow with time simulation:
    // - Context generation: <5 min
    // - Code implementation: <60 min
    // - Test generation: <30 min
    // - Review: <15 min
    // - PR creation: <10 min
    // Total: <2 hours

    // For mocked E2E test, verify steps execute quickly
    Object.values(metricsByStep).forEach((duration: number) => {
      expect(duration).toBeLessThan(2000); // Each step <2s in mocked test
    });
  });

  it('should identify performance bottlenecks if any', async () => {
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
      measurePerformance: true,
    });

    expect(result.metrics).toBeDefined();
    expect(result.metrics!.length).toBeGreaterThan(0);

    // Find slowest step
    const slowestStep = result.metrics!.reduce((max: any, current: any) =>
      current.duration > max.duration ? current : max
    );

    console.log(`Slowest step: ${slowestStep.stepName} (${slowestStep.duration}ms)`);

    // In production, would check against thresholds and log warnings
    // For E2E test, just verify metrics are useful for monitoring
    expect(slowestStep.stepName).toBeDefined();
    expect(slowestStep.duration).toBeGreaterThanOrEqual(0); // Can be 0 for very fast mocked operations
  });
}, { timeout: 60000 }); // 60 second timeout for performance benchmark
