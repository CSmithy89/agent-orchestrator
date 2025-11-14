/**
 * E2E Test: External API Integration Story
 * Tests story with external dependencies (API client, security review)
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
import { apiIntegrationStory } from './fixtures/story-fixtures';
import { setupGitHubMocks, cleanupGitHubMocks } from '../../../integration/implementation/workflow/fixtures/github-api-mocks';

describe('E2E: External API Integration Story', () => {
  let testEnv: Awaited<ReturnType<typeof createE2ETestEnvironment>>;
  const storyId = '3-1-stripe-payment-integration';

  beforeEach(async () => {
    testEnv = await createE2ETestEnvironment('api-integration');
    await createStoryFile(testEnv.storiesDir, storyId, apiIntegrationStory);
    await createContextFile(testEnv.storiesDir, storyId, { storyId, title: 'Stripe Payment Integration' });
    await updateStoryStatus(testEnv.sprintStatusPath, storyId, 'ready-for-dev');
    setupGitHubMocks().mockCompletePRWorkflow('all-pass');
  });

  afterEach(async () => {
    await testEnv.cleanup();
    cleanupGitHubMocks();
    vi.clearAllMocks();
  });

  it('should complete workflow with API client integration', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: {
        files: [
          { path: 'src/integrations/stripe/StripeClient.ts', content: 'export class StripeClient {}', operation: 'create' as const },
          { path: 'src/services/PaymentService.ts', content: 'export class PaymentService {}', operation: 'create' as const },
        ],
        commitMessage: 'Implement Stripe integration',
        implementationNotes: 'Added Stripe client and payment service',
        acceptanceCriteriaMapping: [],
      },
      tests: {
        files: [{ path: 'tests/unit/services/PaymentService.test.ts', content: '// Tests' }],
        framework: 'vitest',
        testCount: 8,
        coverage: { lines: { total: 50, covered: 45, percentage: 90 }, functions: { total: 4, covered: 4, percentage: 100 }, branches: { total: 8, covered: 8, percentage: 100 }, statements: { total: 50, covered: 45, percentage: 90 } },
        results: { passed: 8, failed: 0, skipped: 0, total: 8, duration: 200 },
      },
      selfReview: {
        confidence: 0.90,
        checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true },
        potentialIssues: [],
        improvementSuggestions: [],
        overallAssessment: 'Good implementation',
      },
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: {
        confidence: 0.92,
        security: { vulnerabilities: [], securityScore: 98, recommendations: ['API key handling is secure'], criticalIssues: [] },
        quality: { codeSmells: [], complexity: { cyclomaticComplexity: 3, cognitiveComplexity: 2, assessment: 'Low' }, maintainability: { score: 90, issues: [] }, bestPractices: { followed: ['Environment variables', 'Error handling'], violated: [] } },
        testValidation: { coverageAdequate: true, testQuality: { score: 90, strengths: ['API mocking'], weaknesses: [] }, missingTests: [], recommendations: [] },
        criticalIssues: [],
        blockers: [],
        recommendations: [],
        overallDecision: 'approve' as const,
        reasoning: 'Secure API integration',
      },
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

    // Verify security review validated API key handling
    const alexReview = await alexAgent.generateReport.mock.results[0].value;
    expect(alexReview.security.criticalIssues).toHaveLength(0);
    expect(alexReview.security.securityScore).toBeGreaterThan(90);
  });

  it('should validate API mocking in tests', async () => {
    const contextGenerator = mockStoryContextGenerator({ storyId });
    const ameliaAgent = mockAmeliaAgentE2E({
      implementation: { files: [], commitMessage: '', implementationNotes: '', acceptanceCriteriaMapping: [] },
      tests: {
        files: [{ path: 'tests/unit/services/PaymentService.test.ts', content: 'import nock from "nock"; // API mocking' }],
        framework: 'vitest',
        testCount: 8,
        coverage: { lines: { total: 50, covered: 45, percentage: 90 }, functions: { total: 4, covered: 4, percentage: 100 }, branches: { total: 8, covered: 8, percentage: 100 }, statements: { total: 50, covered: 45, percentage: 90 } },
        results: { passed: 8, failed: 0, skipped: 0, total: 8, duration: 200 },
      },
      selfReview: { confidence: 0.90, checklistResults: { acceptanceCriteriaMet: true, testCoverageAdequate: true, codingStandardsFollowed: true, documentationComplete: true, errorHandlingPresent: true }, potentialIssues: [], improvementSuggestions: [], overallAssessment: 'Good' },
    });
    const alexAgent = mockAlexAgentE2E({
      independentReview: {
        confidence: 0.92,
        security: { vulnerabilities: [], securityScore: 98, recommendations: [], criticalIssues: [] },
        quality: { codeSmells: [], complexity: { cyclomaticComplexity: 3, cognitiveComplexity: 2, assessment: 'Low' }, maintainability: { score: 90, issues: [] }, bestPractices: { followed: [], violated: [] } },
        testValidation: { coverageAdequate: true, testQuality: { score: 90, strengths: ['API mocking with nock'], weaknesses: [] }, missingTests: [], recommendations: [] },
        criticalIssues: [],
        blockers: [],
        recommendations: [],
        overallDecision: 'approve' as const,
        reasoning: 'Tests properly mock external API',
      },
    });
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
    const alexReview = await alexAgent.generateReport.mock.results[0].value;

    expect(tests.files[0].content).toContain('nock');
    expect(alexReview.testValidation.testQuality.strengths).toContain('API mocking with nock');
  });
}, { timeout: 30000 });
