/**
 * E2E Test Utilities for Complete Workflow Testing
 * Extends integration test utilities with workflow orchestration helpers
 */

import { vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import type {
  CodeImplementation,
  TestSuite,
  SelfReviewReport,
  IndependentReviewReport,
  StoryContext,
} from '@/implementation/types';

/**
 * Create complete E2E test environment with temp directories
 */
export async function createE2ETestEnvironment(testName: string) {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), `e2e-${testName}-`));

  // Create directory structure
  const storiesDir = path.join(tempDir, 'stories');
  const outputDir = path.join(tempDir, 'output');
  const worktreesDir = path.join(tempDir, 'worktrees');

  await fs.mkdir(storiesDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(worktreesDir, { recursive: true });

  // Create sprint-status.yaml
  const sprintStatusPath = path.join(outputDir, 'sprint-status.yaml');
  await fs.writeFile(sprintStatusPath, `development_status:\n`);

  return {
    tempDir,
    storiesDir,
    outputDir,
    worktreesDir,
    sprintStatusPath,
    cleanup: async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    },
  };
}

/**
 * Create story file in test environment
 */
export async function createStoryFile(
  storiesDir: string,
  storyId: string,
  content: string
): Promise<string> {
  const storyPath = path.join(storiesDir, `${storyId}.md`);
  await fs.writeFile(storyPath, content);
  return storyPath;
}

/**
 * Create story context file in test environment
 */
export async function createContextFile(
  storiesDir: string,
  storyId: string,
  context: Partial<StoryContext>
): Promise<string> {
  const contextPath = path.join(storiesDir, `${storyId}.context.xml`);

  const contextXML = `<story-context>
  <metadata>
    <storyId>${context.storyId || storyId}</storyId>
    <title>${context.title || 'Test Story'}</title>
  </metadata>
  <story>
    <tasks>${(context.tasks || []).join('\n')}</tasks>
  </story>
  <acceptanceCriteria>
${(context.acceptanceCriteria || []).map((ac: string) => `    ${ac}`).join('\n')}
  </acceptanceCriteria>
</story-context>`;

  await fs.writeFile(contextPath, contextXML);
  return contextPath;
}

/**
 * Escape regex metacharacters to prevent ReDoS attacks
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Update story status in sprint-status.yaml
 */
export async function updateStoryStatus(
  sprintStatusPath: string,
  storyId: string,
  status: string
): Promise<void> {
  let content = await fs.readFile(sprintStatusPath, 'utf-8');
  const escapedStoryId = escapeRegExp(storyId);

  if (content.includes(`${storyId}:`)) {
    // Update existing
    content = content.replace(
      new RegExp(`${escapedStoryId}:.*`),
      `${storyId}: ${status}`
    );
  } else {
    // Add new
    content += `  ${storyId}: ${status}\n`;
  }

  await fs.writeFile(sprintStatusPath, content);
}

/**
 * Read story status from sprint-status.yaml
 */
export async function readStoryStatus(
  sprintStatusPath: string,
  storyId: string
): Promise<string | null> {
  const content = await fs.readFile(sprintStatusPath, 'utf-8');
  const escapedStoryId = escapeRegExp(storyId);
  const match = content.match(new RegExp(`${escapedStoryId}:\\s*(\\S+)`));
  return match ? match[1] : null;
}

/**
 * Mock complete workflow orchestrator with all agents
 */
export function mockWorkflowOrchestrator(options: {
  contextGenerator?: any;
  ameliaAgent?: any;
  alexAgent?: any;
  worktreeManager?: any;
  prAutomator?: any;
}) {
  return {
    executeStoryWorkflow: vi.fn().mockImplementation(async (storyId: string) => {
      // Simulate complete workflow execution
      return {
        storyId,
        success: true,
        prNumber: 123,
        prUrl: `https://github.com/test/repo/pull/123`,
      };
    }),
    components: {
      contextGenerator: options.contextGenerator,
      ameliaAgent: options.ameliaAgent,
      alexAgent: options.alexAgent,
      worktreeManager: options.worktreeManager,
      prAutomator: options.prAutomator,
    },
  };
}

/**
 * Mock StoryContextGenerator
 */
export function mockStoryContextGenerator(mockContext: Partial<StoryContext>) {
  return {
    generateContext: vi.fn().mockResolvedValue({
      storyId: mockContext.storyId || 'test-story',
      title: mockContext.title || 'Test Story',
      acceptanceCriteria: mockContext.acceptanceCriteria || [],
      tasks: mockContext.tasks || [],
      tokenCount: mockContext.tokenCount || 10000,
      ...mockContext,
    }),
  };
}

/**
 * Mock Amelia agent with complete workflow responses
 */
export function mockAmeliaAgentE2E(responses: {
  implementation: CodeImplementation;
  tests: TestSuite;
  selfReview: SelfReviewReport;
  fixes?: CodeImplementation;
}) {
  return {
    name: 'amelia',
    role: 'Developer',
    implementStory: vi.fn().mockResolvedValue(responses.implementation),
    writeTests: vi.fn().mockResolvedValue(responses.tests),
    reviewCode: vi.fn().mockResolvedValue(responses.selfReview),
    fixTests: vi.fn().mockResolvedValue(responses.fixes || responses.implementation),
    applyReviewFixes: vi.fn().mockResolvedValue(responses.fixes || responses.implementation),
  };
}

/**
 * Mock Alex agent with complete review workflow responses
 */
export function mockAlexAgentE2E(responses: {
  independentReview: IndependentReviewReport;
  reReview?: IndependentReviewReport;
}) {
  let reviewCallCount = 0;

  return {
    name: 'alex',
    role: 'Code Reviewer',
    reviewSecurity: vi.fn().mockResolvedValue(responses.independentReview.securityReview),
    analyzeQuality: vi.fn().mockResolvedValue(responses.independentReview.qualityAnalysis),
    validateTests: vi.fn().mockResolvedValue(responses.independentReview.testValidation),
    generateReport: vi.fn().mockImplementation(() => {
      reviewCallCount++;
      // First call returns initial review, second call returns re-review
      return Promise.resolve(
        reviewCallCount === 1
          ? responses.independentReview
          : responses.reReview || responses.independentReview
      );
    }),
  };
}

/**
 * Mock PR Automation with full lifecycle
 */
export function mockPRAutomator(scenario: 'success' | 'ci-failure' | 'merge-failure' = 'success') {
  return {
    createPR: vi.fn().mockResolvedValue({
      number: 123,
      url: 'https://github.com/test/repo/pull/123',
      sha: 'abc123',
    }),
    monitorCI: vi.fn().mockImplementation(async () => {
      if (scenario === 'ci-failure') {
        return { allPassed: false, failedChecks: ['CI Tests'] };
      }
      return { allPassed: true, failedChecks: [] };
    }),
    autoMerge: vi.fn().mockImplementation(async () => {
      if (scenario === 'merge-failure') {
        throw new Error('PR is not mergeable');
      }
      return { merged: true, sha: 'def456' };
    }),
    deleteBranch: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Mock WorktreeManager for E2E tests
 */
export function mockWorktreeManagerE2E(worktreesDir: string) {
  const worktrees = new Map<string, string>();

  return {
    createWorktree: vi.fn().mockImplementation(async (storyId: string) => {
      const worktreePath = path.join(worktreesDir, storyId);
      await fs.mkdir(worktreePath, { recursive: true });
      worktrees.set(storyId, worktreePath);
      return worktreePath;
    }),
    removeWorktree: vi.fn().mockImplementation(async (storyId: string) => {
      const worktreePath = worktrees.get(storyId);
      if (worktreePath) {
        await fs.rm(worktreePath, { recursive: true, force: true });
        worktrees.delete(storyId);
      }
    }),
    listWorktrees: vi.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(worktrees.values()));
    }),
    getWorktreePath: vi.fn().mockImplementation((storyId: string) => {
      return worktrees.get(storyId) || null;
    }),
  };
}

/**
 * Verify E2E workflow artifacts created
 */
export async function verifyWorkflowArtifacts(
  worktreePath: string,
  expectedFiles: string[]
): Promise<boolean> {
  try {
    for (const file of expectedFiles) {
      const filePath = path.join(worktreePath, file);
      await fs.access(filePath);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Simulate time passage for performance testing (compressed time)
 */
export async function simulateWorkflowStep(
  stepName: string,
  actualMinutes: number,
  compressionFactor: number = 100
): Promise<number> {
  const compressedMs = (actualMinutes * 60 * 1000) / compressionFactor;
  await new Promise(resolve => setTimeout(resolve, compressedMs));
  return actualMinutes;
}

/**
 * Measure workflow step execution time
 */
export async function measureWorkflowStep<T>(
  stepName: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number; stepName: string }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;

  return {
    result,
    duration,
    stepName,
  };
}

/**
 * Assert workflow performance metrics
 */
export function assertPerformanceMetrics(
  metrics: Array<{ stepName: string; duration: number }>,
  thresholds: Record<string, number>
): void {
  for (const metric of metrics) {
    const threshold = thresholds[metric.stepName];
    if (threshold && metric.duration > threshold) {
      throw new Error(
        `Performance threshold exceeded for ${metric.stepName}: ${metric.duration}ms > ${threshold}ms`
      );
    }
  }
}

/**
 * Execute complete E2E workflow with mocked components
 */
export async function executeE2EWorkflow(options: {
  storyId: string;
  storyPath: string;
  contextPath: string;
  sprintStatusPath: string;
  worktreesDir: string;
  contextGenerator: any;
  ameliaAgent: any;
  alexAgent: any;
  worktreeManager: any;
  prAutomator: any;
  measurePerformance?: boolean;
}) {
  const metrics: Array<{ stepName: string; duration: number }> = [];

  // Step 1: Generate context
  const contextStep = await measureWorkflowStep('context-generation', async () => {
    return await options.contextGenerator.generateContext(options.storyPath);
  });
  if (options.measurePerformance) metrics.push(contextStep);

  // Step 2: Create worktree
  const worktree = await options.worktreeManager.createWorktree(options.storyId);

  // Step 3: Amelia implements story
  const implementationStep = await measureWorkflowStep('code-implementation', async () => {
    return await options.ameliaAgent.implementStory(contextStep.result);
  });
  if (options.measurePerformance) metrics.push(implementationStep);

  // Step 4: Amelia writes tests
  const testsStep = await measureWorkflowStep('test-generation', async () => {
    return await options.ameliaAgent.writeTests(implementationStep.result);
  });
  if (options.measurePerformance) metrics.push(testsStep);

  // Step 5: Amelia self-review
  const selfReviewStep = await measureWorkflowStep('self-review', async () => {
    return await options.ameliaAgent.reviewCode(implementationStep.result);
  });
  if (options.measurePerformance) metrics.push(selfReviewStep);

  // Step 6: Alex independent review
  const alexReviewStep = await measureWorkflowStep('independent-review', async () => {
    return await options.alexAgent.generateReport([
      selfReviewStep.result,
      testsStep.result,
    ]);
  });
  if (options.measurePerformance) metrics.push(alexReviewStep);

  // Step 7: Check if escalation needed
  const needsEscalation =
    alexReviewStep.result.confidence < 0.85 ||
    alexReviewStep.result.decision === 'escalate' ||
    alexReviewStep.result.findings.some((f: any) => f.severity === 'critical');

  if (needsEscalation) {
    return {
      success: false,
      escalated: true,
      reason: 'Low confidence or critical issues detected',
      worktree,
      context: contextStep.result,
      review: alexReviewStep.result,
      metrics,
    };
  }

  // Step 8: Create PR
  const prStep = await measureWorkflowStep('pr-creation', async () => {
    return await options.prAutomator.createPR(worktree, options.storyId, alexReviewStep.result);
  });
  if (options.measurePerformance) metrics.push(prStep);

  // Step 9: Monitor CI
  const ciResult = await options.prAutomator.monitorCI(prStep.result.number);

  if (!ciResult.allPassed) {
    return {
      success: false,
      escalated: true,
      reason: 'CI checks failed',
      failedChecks: ciResult.failedChecks,
      metrics,
    };
  }

  // Step 10: Auto-merge
  await options.prAutomator.autoMerge(prStep.result.number);

  // Step 11: Cleanup
  await options.prAutomator.deleteBranch(options.storyId);
  await options.worktreeManager.removeWorktree(options.storyId);

  // Step 12: Update status
  await updateStoryStatus(options.sprintStatusPath, options.storyId, 'done');

  return {
    success: true,
    escalated: false,
    prNumber: prStep.result.number,
    prUrl: prStep.result.url,
    metrics,
  };
}

/**
 * Wait for condition with retries (useful for async operations)
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Assert all items match predicate
 */
export function assertAll<T>(
  items: T[],
  predicate: (item: T) => boolean,
  message?: string
): void {
  const failures = items.filter(item => !predicate(item));
  if (failures.length > 0) {
    throw new Error(
      message || `${failures.length} items failed assertion: ${JSON.stringify(failures)}`
    );
  }
}
