/**
 * E2E Test: Complex Multi-File Story Workflow
 * Tests workflow for complex story (multiple files, database migration, >200 LOC)
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
import { complexMultiFileStory } from './fixtures/story-fixtures';
import {
  complexStoryImplementation,
  complexStoryTests,
  complexStorySelfReview,
  complexStoryAlexReview,
} from './fixtures/e2e-llm-responses';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Complex Multi-File Story Workflow', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyId = '2-1-user-management-api';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('complex-story');
    await createStoryFile(testEnv.storiesDir, storyId, complexMultiFileStory);
    await createContextFile(testEnv.storiesDir, storyId, {
      storyId,
      title: 'User Management RESTful API',
      tokenCount: 35000,
    });
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'ready-for-dev');
    setupGitHubMocks().mockCompletePRWorkflow('all-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should complete workflow with multiple file creation', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: complexStoryImplementation,
      tests: complexStoryTests,
      selfReview: complexStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: complexStoryAlexReview });
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
    const implementation = await ameliaAgent.implementStory.mock.results[0].value;
    expect(implementation.files).toHaveLength(5); // Migration, model, repo, controller, routes
  });

  it('should create database migration file', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: complexStoryImplementation,
      tests: complexStoryTests,
      selfReview: complexStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: complexStoryAlexReview });
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

    const implementation = await ameliaAgent.implementStory.mock.results[0].value;
    const migrationFile = implementation.files.find((f: any) =>
      f.path.includes('migrations')
    );
    expect(migrationFile).toBeDefined();
    expect(migrationFile!.path).toBe('db/migrations/001_create_users_table.sql');
    expect(migrationFile!.content).toContain('CREATE TABLE');
    expect(migrationFile!.content).toContain('users');
  });

  it('should achieve >80% code coverage', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: complexStoryImplementation,
      tests: complexStoryTests,
      selfReview: complexStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: complexStoryAlexReview });
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

    const tests = await ameliaAgent.writeTests.mock.results[0].value;
    expect(tests.coverage.lines.percentage).toBeGreaterThan(80);
    expect(tests.coverage.functions.percentage).toBeGreaterThan(80);
    expect(tests.testCount).toBeGreaterThanOrEqual(15);
  });

  it('should validate dual-agent review for complex code', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: complexStoryImplementation,
      tests: complexStoryTests,
      selfReview: complexStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: complexStoryAlexReview });
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

    const ameliaSelfReview = await ameliaAgent.reviewCode.mock.results[0].value;
    const alexReview = await alexAgent.generateReport.mock.results[0].value;

    expect(ameliaSelfReview.confidence).toBeGreaterThan(0.85);
    expect(alexReview.confidence).toBeGreaterThan(0.85);
    expect(alexReview.overallDecision).toBe('approve');

    // Verify Alex identified potential improvements (non-blocking)
    expect(alexReview.recommendations.length).toBeGreaterThan(0);
  });

  it('should execute in <2 hours with complex implementation', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: complexStoryImplementation,
      tests: complexStoryTests,
      selfReview: complexStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({ independentReview: complexStoryAlexReview });
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
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
  });
}, { timeout: 30000 });
