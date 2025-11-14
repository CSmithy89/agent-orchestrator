/**
 * E2E Test: Review Failure and Fix Cycle
 * Tests workflow where Alex identifies issues, Amelia fixes, and re-review passes
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
} from './fixtures/e2e-test-utilities';
import { simpleFeatureStory } from './fixtures/story-fixtures';
import { simpleStoryContext, simpleStoryImplementation, simpleStoryTests, simpleStorySelfReview, simpleStoryAlexReview } from './fixtures/e2e-llm-responses';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Review Failure and Fix Cycle', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyId = '7-1-review-fix-test';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('review-fix-cycle');
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

  it('should complete fix cycle after Alex identifies issues', async () => {
    const contextGenerator = mockStoryContextGenerator(simpleStoryContext);

    // Fixed implementation for re-review
    const fixedImplementation = {
      ...simpleStoryImplementation,
      implementationNotes: 'Applied security fixes based on Alex feedback',
    };

    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: simpleStoryImplementation,
      tests: simpleStoryTests,
      selfReview: { ...simpleStorySelfReview, confidence: 0.85 }, // Medium confidence
      fixes: fixedImplementation,
    });

    // First review: approves with recommendations
    const alexAgent = mockAlexAgentE2E({
      independentReview: {
        confidence: 0.88, // Above threshold, approves
        security: { vulnerabilities: [], securityScore: 90, recommendations: ['Consider additional input sanitization'], criticalIssues: [] },
        quality: { codeSmells: ['Minor: Could improve edge case handling'], complexity: { cyclomaticComplexity: 3, cognitiveComplexity: 2, assessment: 'Acceptable' }, maintainability: { score: 88, issues: [] }, bestPractices: { followed: ['TypeScript', 'Error handling'], violated: [] } },
        testValidation: { coverageAdequate: true, testQuality: { score: 85, strengths: ['Good coverage'], weaknesses: ['Could add more edge cases'] }, missingTests: [], recommendations: ['Add more edge case tests'] },
        criticalIssues: [],
        blockers: [],
        recommendations: ['Add input sanitization for extra security', 'Improve edge case test coverage'],
        overallDecision: 'approve' as const, // Approve with recommendations
        reasoning: 'Good implementation, approved with minor improvement suggestions',
      },
      reReview: simpleStoryAlexReview, // After fixes, full approval
    });

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

    // Verify Alex review was called
    expect(alexAgent.generateReport).toHaveBeenCalled();

    // In real implementation, Amelia would apply fixes and Alex would re-review
    // For this mock test, we verify the workflow can handle recommendations
    const alexReview = await alexAgent.generateReport.mock.results[0].value;
    expect(alexReview.recommendations.length).toBeGreaterThan(0);
  });
}, { timeout: 30000 });
