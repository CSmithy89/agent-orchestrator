/**
 * E2E Test: Simple Feature Story Workflow
 * Tests complete workflow for simple feature (single file change, <50 LOC)
 * Validates: context → implementation → tests → review → PR → merge
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
  verifyWorkflowArtifacts,
} from './fixtures/e2e-test-utilities';
import { simpleFeatureStory } from './fixtures/story-fixtures';
import {
  simpleStoryContext,
  simpleStoryImplementation,
  simpleStoryTests,
  simpleStorySelfReview,
  simpleStoryAlexReview,
} from './fixtures/e2e-llm-responses';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Simple Feature Story Workflow', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  let storyPath: string;
  let contextPath: string;
  const storyId = '1-1-user-input-validation';

  beforeEach(async () => {
    // Create test environment
    testEnv = await createE2ETestEnvironment('simple-feature');

    // Create story file
    storyPath = await createStoryFile(
      testEnv.storiesDir,
      storyId,
      simpleFeatureStory
    );

    // Create context file
    contextPath = await createContextFile(
      testEnv.storiesDir,
      storyId,
      simpleStoryContext
    );

    // Set initial story status
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'ready-for-dev');

    // Setup GitHub API mocks
    setupGitHubMocks({
      owner: 'test-owner',
      repo: 'test-repo',
      prNumber: 123,
    }).mockCompletePRWorkflow('all-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should complete full workflow for simple feature story', async () => {
    // ARRANGE: Setup mocked agents and components
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT: Execute complete E2E workflow
    const result = await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
      measurePerformance: true,
    });

    // ASSERT: Workflow completed successfully
    expect(result.success).toBe(true);
    expect(result.escalated).toBe(false);
    expect(result.prNumber).toBe(123);
    expect(result.prUrl).toBe('https://github.com/test/repo/pull/123');

    // Verify all workflow steps were called
    expect(contextGenerator.generateContext).toHaveBeenCalledWith(storyPath);
    expect(ameliaAgent.implementStory).toHaveBeenCalledTimes(1);
    expect(ameliaAgent.writeTests).toHaveBeenCalledTimes(1);
    expect(ameliaAgent.reviewCode).toHaveBeenCalledTimes(1);
    expect(alexAgent.generateReport).toHaveBeenCalledTimes(1);
    expect(prAutomator.createPR).toHaveBeenCalledTimes(1);
    expect(prAutomator.autoMerge).toHaveBeenCalledTimes(1);

    // Verify story status updated to done
    const finalStatus = await readStoryStatus(testEnv.sprintStatusPath, storyId);
    expect(finalStatus).toBe('done');

    // Verify worktree was cleaned up
    const worktrees = await worktreeManager.listWorktrees();
    expect(worktrees).toHaveLength(0);
  });

  it('should create expected code files', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT
    await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    // ASSERT: Implementation created expected files
    const implementation = await ameliaAgent.implementStory.mock.results[0].value;
    expect(implementation.files).toHaveLength(2);
    expect(implementation.files[0].path).toBe('src/validation/email.ts');
    expect(implementation.files[1].path).toBe('src/validation/password.ts');
    expect(implementation.files[0].operation).toBe('create');
    expect(implementation.files[1].operation).toBe('create');
  });

  it('should create test files with >80% coverage', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT
    await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    // ASSERT: Tests created with adequate coverage
    const tests = await ameliaAgent.writeTests.mock.results[0].value;
    expect(tests.files).toHaveLength(2);
    expect(tests.testCount).toBeGreaterThanOrEqual(9);
    expect(tests.coverage.lines.percentage).toBeGreaterThan(80);
    expect(tests.coverage.functions.percentage).toBeGreaterThan(80);
    expect(tests.results.passed).toBe(tests.results.total);
    expect(tests.results.failed).toBe(0);
  });

  it('should validate status transitions: ready-for-dev → in-progress → done', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT & ASSERT: Check initial status
    let status = await readStoryStatus(testEnv.sprintStatusPath, storyId);
    expect(status).toBe('ready-for-dev');

    // Simulate workflow marking story in-progress
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'in-progress');
    status = await readStoryStatus(testEnv.sprintStatusPath, storyId);
    expect(status).toBe('in-progress');

    // Execute workflow
    await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    // Check final status
    status = await readStoryStatus(testEnv.sprintStatusPath, storyId);
    expect(status).toBe('done');
  });

  it('should pass dual-agent review with high confidence', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT
    await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    // ASSERT: Both reviews passed with high confidence
    const ameliaSelfReview = await ameliaAgent.reviewCode.mock.results[0].value;
    expect(ameliaSelfReview.confidence).toBeGreaterThan(0.85);
    expect(ameliaSelfReview.checklistResults.acceptanceCriteriaMet).toBe(true);

    const alexReview = await alexAgent.generateReport.mock.results[0].value;
    expect(alexReview.confidence).toBeGreaterThan(0.85);
    expect(alexReview.overallDecision).toBe('approve');
    expect(alexReview.criticalIssues).toHaveLength(0);
    expect(alexReview.blockers).toHaveLength(0);
  });

  it('should create PR with correct structure', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT
    const result = await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    // ASSERT: PR created with all required information
    expect(prAutomator.createPR).toHaveBeenCalledWith(
      expect.any(String), // worktree path
      storyId,
      expect.objectContaining({
        confidence: expect.any(Number),
        overallDecision: 'approve',
      })
    );
    expect(result.prUrl).toContain('github.com');
    expect(result.prNumber).toBe(123);
  });

  it('should execute workflow in <2 hours (compressed time)', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT
    const startTime = Date.now();
    const result = await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
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

    // ASSERT: Workflow completed quickly (mocked, so should be <1 second)
    // In real E2E with time simulation, would validate <2 hours proportionally
    expect(duration).toBeLessThan(5000); // 5 seconds max for E2E test
    expect(result.metrics).toBeDefined();
    expect(result.metrics!.length).toBeGreaterThan(0);

    // Verify performance metrics captured
    const metricNames = result.metrics!.map((m: any) => m.stepName);
    expect(metricNames).toContain('context-generation');
    expect(metricNames).toContain('code-implementation');
    expect(metricNames).toContain('test-generation');
    expect(metricNames).toContain('independent-review');
    expect(metricNames).toContain('pr-creation');
  });

  it('should execute acceptance criteria validation', async () => {
    // ARRANGE
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: simpleStorySelfReview,
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: simpleStoryAlexReview,
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // ACT
    await executeE2EWorkflow({
      storyId,
      storyPath,
      contextPath,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator,
      ameliaAgent,
      alexAgent,
      worktreeManager,
      prAutomator,
    });

    // ASSERT: Implementation maps to acceptance criteria
    const implementation = await ameliaAgent.implementStory.mock.results[0].value;
    expect(implementation.acceptanceCriteriaMapping).toBeDefined();
    expect(implementation.acceptanceCriteriaMapping).toHaveLength(2);

    const ac1 = implementation.acceptanceCriteriaMapping.find((m: any) => m.criteriaId === 'AC1');
    expect(ac1).toBeDefined();
    expect(ac1.implementedBy).toContain('src/validation/email.ts');

    const ac2 = implementation.acceptanceCriteriaMapping.find((m: any) => m.criteriaId === 'AC2');
    expect(ac2).toBeDefined();
    expect(ac2.implementedBy).toContain('src/validation/password.ts');
  });
}, { timeout: 30000 }); // 30 second timeout for E2E test
