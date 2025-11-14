/**
 * E2E Test: Multi-Story Dependency Chain
 * Tests sequential execution where Story B depends on Story A
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
import { dependencyStoryA, dependencyStoryB } from './fixtures/story-fixtures';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Multi-Story Dependency Chain', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyAId = '5-1-base-auth-service';
  const storyBId = '5-2-protected-endpoints';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('dependency-chain');
    await createStoryFile(testEnv.storiesDir, storyAId, dependencyStoryA);
    await createStoryFile(testEnv.storiesDir, storyBId, dependencyStoryB);
    await createContextFile(testEnv.storiesDir, storyAId, { storyId: storyAId });
    await createContextFile(testEnv.storiesDir, storyBId, { storyId: storyBId });
    await updateStoryStatus(testEnv.sprintStatusPath, storyAId, 'ready-for-dev');
    await updateStoryStatus(testEnv.sprintStatusPath, storyBId, 'drafted');
    setupGitHubMocks().mockCompletePRWorkflow('all-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should complete Story A first, then Story B', async () => {
    // Story A workflow
    const contextGenA = mockStoryContextGenerator({ storyId: storyAId });
    const ameliaAgentA = mockAmeliaAgentE2E({
      implementation: { files: [{ path: 'src/services/AuthService.ts', content: 'export class AuthService {}', operation: 'create' as const }], commitMessage: 'Add auth service', implementationNotes: '', acceptanceCriteriaMapping: [] },
      tests: { files: [], framework: 'vitest', testCount: 5, coverage: { lines: { total: 30, covered: 27, percentage: 90 }, functions: { total: 2, covered: 2, percentage: 100 }, branches: { total: 4, covered: 4, percentage: 100 }, statements: { total: 30, covered: 27, percentage: 90 } }, results: { passed: 5, failed: 0, skipped: 0, total: 5, duration: 150 } },
      selfReview: { confidence: 0.93, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' },
    });
    const alexAgentA = mockAlexAgentE2E({
      independentReview: { confidence: 0.91, security: { vulnerabilities: [], securityScore: 95, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 2, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 92, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 90, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' },
    });
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // Execute Story A
    const resultA = await executeE2EWorkflow({
      storyId: storyAId,
      storyPath: `${testEnv.storiesDir}/${storyAId}.md`,
      contextPath: `${testEnv.storiesDir}/${storyAId}.context.xml`,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator: contextGenA,
      ameliaAgent: ameliaAgentA,
      alexAgent: alexAgentA,
      worktreeManager,
      prAutomator,
    });

    expect(resultA.success).toBe(true);
    const statusA = await readStoryStatus(testEnv.sprintStatusPath, storyAId);
    expect(statusA).toBe('done');

    // Now Story B can execute (depends on A)
    await updateStoryStatus(testEnv.sprintStatusPath, storyBId, 'ready-for-dev');

    const contextGenB = mockStoryContextGenerator({ storyId: storyBId });
    const ameliaAgentB = mockAmeliaAgentE2E({
      implementation: { files: [{ path: 'src/middleware/authMiddleware.ts', content: 'import { AuthService } from "@/services/AuthService"; // Uses Story A', operation: 'create' as const }], commitMessage: 'Add auth middleware', implementationNotes: 'Uses AuthService from Story A', acceptanceCriteriaMapping: [] },
      tests: { files: [], framework: 'vitest', testCount: 4, coverage: { lines: { total: 20, covered: 18, percentage: 90 }, functions: { total: 1, covered: 1, percentage: 100 }, branches: { total: 2, covered: 2, percentage: 100 }, statements: { total: 20, covered: 18, percentage: 90 } }, results: { passed: 4, failed: 0, skipped: 0, total: 4, duration: 120 } },
      selfReview: { confidence: 0.92, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' },
    });
    const alexAgentB = mockAlexAgentE2E({
      independentReview: { confidence: 0.90, security: { vulnerabilities: [], securityScore: 94, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 2, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 90, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 88, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' },
    });

    // Execute Story B
    const resultB = await executeE2EWorkflow({
      storyId: storyBId,
      storyPath: `${testEnv.storiesDir}/${storyBId}.md`,
      contextPath: `${testEnv.storiesDir}/${storyBId}.context.xml`,
      sprintStatusPath: testEnv.sprintStatusPath,
      worktreesDir: testEnv.worktreesDir,
      contextGenerator: contextGenB,
      ameliaAgent: ameliaAgentB,
      alexAgent: alexAgentB,
      worktreeManager,
      prAutomator,
    });

    expect(resultB.success).toBe(true);
    const statusB = await readStoryStatus(testEnv.sprintStatusPath, storyBId);
    expect(statusB).toBe('done');

    // Verify Story B can access Story A's code
    const implB = await ameliaAgentB.implementStory.mock.results[0].value;
    expect(implB.files[0].content).toContain('AuthService');
    expect(implB.implementationNotes).toContain('Story A');
  });
}, { timeout: 30000 });
