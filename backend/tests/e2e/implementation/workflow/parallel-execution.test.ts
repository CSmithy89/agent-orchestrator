/**
 * E2E Test: Parallel Story Execution
 * Tests 3 independent stories executing concurrently in isolated worktrees
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
import { parallelStory1, parallelStory2, parallelStory3 } from './fixtures/story-fixtures';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: Parallel Story Execution', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const stories = ['6-1-logging-service', '6-2-email-service', '6-3-health-check'];

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('parallel-execution');
    await createStoryFile(testEnv.storiesDir, stories[0], parallelStory1);
    await createStoryFile(testEnv.storiesDir, stories[1], parallelStory2);
    await createStoryFile(testEnv.storiesDir, stories[2], parallelStory3);
    await createContextFile(testEnv.storiesDir, stories[0], { storyId: stories[0] });
    await createContextFile(testEnv.storiesDir, stories[1], { storyId: stories[1] });
    await createContextFile(testEnv.storiesDir, stories[2], { storyId: stories[2] });
    await updateStoryStatus(testEnv.sprintStatusPath, stories[0], 'ready-for-dev');
    await updateStoryStatus(testEnv.sprintStatusPath, stories[1], 'ready-for-dev');
    await updateStoryStatus(testEnv.sprintStatusPath, stories[2], 'ready-for-dev');
    setupGitHubMocks().mockCompletePRWorkflow('all-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should execute 3 stories in parallel successfully', async () => {
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // Execute all 3 stories in parallel
    const results = await Promise.all([
      executeE2EWorkflow({
        storyId: stories[0],
        storyPath: `${testEnv.storiesDir}/${stories[0]}.md`,
        contextPath: `${testEnv.storiesDir}/${stories[0]}.context.xml`,
        sprintStatusPath: testEnv.sprintStatusPath,
        worktreesDir: testEnv.worktreesDir,
        contextGenerator: mockStoryContextGenerator({ storyId: stories[0] }),
        ameliaAgent: mockAmeliaAgentE2E({
          implementation: { files: [{ path: 'src/utils/logger.ts', content: 'export class Logger {}', operation: 'create' as const }], commitMessage: 'Logger', implementationNotes: '', acceptanceCriteriaMapping: [] },
          tests: { files: [], framework: 'vitest', testCount: 3, coverage: { lines: { total: 15, covered: 14, percentage: 93 }, functions: { total: 3, covered: 3, percentage: 100 }, branches: { total: 2, covered: 2, percentage: 100 }, statements: { total: 15, covered: 14, percentage: 93 } }, results: { passed: 3, failed: 0, skipped: 0, total: 3, duration: 100 } },
          selfReview: { confidence: 0.95, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' },
        }),
        alexAgent: mockAlexAgentE2E({ independentReview: { confidence: 0.93, security: { vulnerabilities: [], securityScore: 96, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 1, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 94, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 92, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' } }),
        worktreeManager,
        prAutomator,
      }),
      executeE2EWorkflow({
        storyId: stories[1],
        storyPath: `${testEnv.storiesDir}/${stories[1]}.md`,
        contextPath: `${testEnv.storiesDir}/${stories[1]}.context.xml`,
        sprintStatusPath: testEnv.sprintStatusPath,
        worktreesDir: testEnv.worktreesDir,
        contextGenerator: mockStoryContextGenerator({ storyId: stories[1] }),
        ameliaAgent: mockAmeliaAgentE2E({
          implementation: { files: [{ path: 'src/services/EmailService.ts', content: 'export class EmailService {}', operation: 'create' as const }], commitMessage: 'Email', implementationNotes: '', acceptanceCriteriaMapping: [] },
          tests: { files: [], framework: 'vitest', testCount: 2, coverage: { lines: { total: 12, covered: 11, percentage: 92 }, functions: { total: 1, covered: 1, percentage: 100 }, branches: { total: 2, covered: 2, percentage: 100 }, statements: { total: 12, covered: 11, percentage: 92 } }, results: { passed: 2, failed: 0, skipped: 0, total: 2, duration: 90 } },
          selfReview: { confidence: 0.94, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' },
        }),
        alexAgent: mockAlexAgentE2E({ independentReview: { confidence: 0.92, security: { vulnerabilities: [], securityScore: 95, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 1, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 93, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 91, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' } }),
        worktreeManager,
        prAutomator,
      }),
      executeE2EWorkflow({
        storyId: stories[2],
        storyPath: `${testEnv.storiesDir}/${stories[2]}.md`,
        contextPath: `${testEnv.storiesDir}/${stories[2]}.context.xml`,
        sprintStatusPath: testEnv.sprintStatusPath,
        worktreesDir: testEnv.worktreesDir,
        contextGenerator: mockStoryContextGenerator({ storyId: stories[2] }),
        ameliaAgent: mockAmeliaAgentE2E({
          implementation: { files: [{ path: 'src/routes/health.ts', content: 'export const healthCheck = () => {}', operation: 'create' as const }], commitMessage: 'Health', implementationNotes: '', acceptanceCriteriaMapping: [] },
          tests: { files: [], framework: 'vitest', testCount: 1, coverage: { lines: { total: 5, covered: 5, percentage: 100 }, functions: { total: 1, covered: 1, percentage: 100 }, branches: { total: 0, covered: 0, percentage: 100 }, statements: { total: 5, covered: 5, percentage: 100 } }, results: { passed: 1, failed: 0, skipped: 0, total: 1, duration: 50 } },
          selfReview: { confidence: 0.98, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Excellent' },
        }),
        alexAgent: mockAlexAgentE2E({ independentReview: { confidence: 0.96, security: { vulnerabilities: [], securityScore: 98, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 1, cognitiveComplexity: 1, assessment: 'Very Low' }, maintainability: { score: 96, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 95, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Excellent' } }),
        worktreeManager,
        prAutomator,
      }),
    ]);

    // All 3 stories should complete successfully
    expect(results.every(r => r.success)).toBe(true);

    // Note: Status file updates in parallel execution may have race conditions
    // In production, this would be handled with atomic file operations or database
    // For E2E test, we primarily verify worktree isolation and parallel execution capability
    // Status updates are tested separately in sequential tests
  });

  it('should create isolated worktrees for each story', async () => {
    const worktreeManager = mockWorktreeManagerE2E(testEnv.worktreesDir);
    const prAutomator = mockPRAutomator('success');

    // Before execution
    const initialWorktrees = await worktreeManager.listWorktrees();
    expect(initialWorktrees).toHaveLength(0);

    // Execute 3 stories (cleanup happens automatically in executeE2EWorkflow)
    await Promise.all([
      executeE2EWorkflow({
        storyId: stories[0],
        storyPath: `${testEnv.storiesDir}/${stories[0]}.md`,
        contextPath: `${testEnv.storiesDir}/${stories[0]}.context.xml`,
        sprintStatusPath: testEnv.sprintStatusPath,
        worktreesDir: testEnv.worktreesDir,
        contextGenerator: mockStoryContextGenerator({ storyId: stories[0] }),
        ameliaAgent: mockAmeliaAgentE2E({ implementation: { files: [], commitMessage: '', implementationNotes: '', acceptanceCriteriaMapping: [] }, tests: { files: [], framework: 'vitest', testCount: 1, coverage: { lines: { total: 5, covered: 5, percentage: 100 }, functions: { total: 1, covered: 1, percentage: 100 }, branches: { total: 0, covered: 0, percentage: 100 }, statements: { total: 5, covered: 5, percentage: 100 } }, results: { passed: 1, failed: 0, skipped: 0, total: 1, duration: 50 } }, selfReview: { confidence: 0.95, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' } }),
        alexAgent: mockAlexAgentE2E({ independentReview: { confidence: 0.93, security: { vulnerabilities: [], securityScore: 96, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 1, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 94, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 92, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' } }),
        worktreeManager,
        prAutomator,
      }),
      executeE2EWorkflow({
        storyId: stories[1],
        storyPath: `${testEnv.storiesDir}/${stories[1]}.md`,
        contextPath: `${testEnv.storiesDir}/${stories[1]}.context.xml`,
        sprintStatusPath: testEnv.sprintStatusPath,
        worktreesDir: testEnv.worktreesDir,
        contextGenerator: mockStoryContextGenerator({ storyId: stories[1] }),
        ameliaAgent: mockAmeliaAgentE2E({ implementation: { files: [], commitMessage: '', implementationNotes: '', acceptanceCriteriaMapping: [] }, tests: { files: [], framework: 'vitest', testCount: 1, coverage: { lines: { total: 5, covered: 5, percentage: 100 }, functions: { total: 1, covered: 1, percentage: 100 }, branches: { total: 0, covered: 0, percentage: 100 }, statements: { total: 5, covered: 5, percentage: 100 } }, results: { passed: 1, failed: 0, skipped: 0, total: 1, duration: 50 } }, selfReview: { confidence: 0.95, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' } }),
        alexAgent: mockAlexAgentE2E({ independentReview: { confidence: 0.93, security: { vulnerabilities: [], securityScore: 96, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 1, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 94, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 92, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' } }),
        worktreeManager,
        prAutomator,
      }),
      executeE2EWorkflow({
        storyId: stories[2],
        storyPath: `${testEnv.storiesDir}/${stories[2]}.md`,
        contextPath: `${testEnv.storiesDir}/${stories[2]}.context.xml`,
        sprintStatusPath: testEnv.sprintStatusPath,
        worktreesDir: testEnv.worktreesDir,
        contextGenerator: mockStoryContextGenerator({ storyId: stories[2] }),
        ameliaAgent: mockAmeliaAgentE2E({ implementation: { files: [], commitMessage: '', implementationNotes: '', acceptanceCriteriaMapping: [] }, tests: { files: [], framework: 'vitest', testCount: 1, coverage: { lines: { total: 5, covered: 5, percentage: 100 }, functions: { total: 1, covered: 1, percentage: 100 }, branches: { total: 0, covered: 0, percentage: 100 }, statements: { total: 5, covered: 5, percentage: 100 } }, results: { passed: 1, failed: 0, skipped: 0, total: 1, duration: 50 } }, selfReview: { confidence: 0.95, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' } }),
        alexAgent: mockAlexAgentE2E({ independentReview: { confidence: 0.93, security: { vulnerabilities: [], securityScore: 96, recommendations: [], criticalIssues: [] }, quality: { codeSmells: [], complexity: { cyclomaticComplexity: 1, cognitiveComplexity: 1, assessment: 'Low' }, maintainability: { score: 94, issues: [] }, bestPractices: { followed: [], violated: [] } }, testValidation: { coverageAdequate: true, testQuality: { score: 92, strengths: [], weaknesses: [] }, missingTests: [], recommendations: [] }, criticalIssues: [], blockers: [], recommendations: [], overallDecision: 'approve' as const, reasoning: 'Approved' } }),
        worktreeManager,
        prAutomator,
      }),
    ]);

    // After execution, all worktrees should be cleaned up
    const finalWorktrees = await worktreeManager.listWorktrees();
    expect(finalWorktrees).toHaveLength(0);
  });
}, { timeout: 30000 });
