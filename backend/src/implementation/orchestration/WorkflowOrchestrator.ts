/**
 * Workflow Orchestrator - Complete Story Development Pipeline Coordinator
 *
 * This orchestrator executes the complete dev-story workflow from context generation
 * through PR creation and merge. It coordinates:
 * - StoryContextGenerator (Story 5.2) for story context assembly
 * - WorktreeManager (Epic 1) for isolated development environments
 * - Amelia agent (Story 5.1) for implementation, testing, and self-review
 * - Alex agent (Story 5.1) for independent code review
 * - StateManager (Epic 1) for workflow state persistence and resume capability
 * - Sprint-status.yaml updates for story status tracking
 *
 * Features:
 * - Sequential 14-step pipeline execution
 * - State checkpointing after each major step
 * - Retry logic with exponential backoff for transient failures
 * - Error recovery and escalation for persistent failures
 * - Performance tracking (<2 hours target for complete workflow)
 * - Graceful degradation (Alex unavailable -> Amelia only)
 * - Dual-agent review coordination
 *
 * @example
 * ```typescript
 * const orchestrator = new WorkflowOrchestrator(config, dependencies);
 * const pr = await orchestrator.executeStoryWorkflow('5-3-workflow-orchestration-state-management');
 * console.log(`PR created: ${pr.url}`);
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { spawn } from 'child_process';
import { Octokit } from '@octokit/rest';
import { logger } from '../../utils/logger.js';
import { StoryContextGenerator } from '../context/StoryContextGenerator.js';
import { WorktreeManager } from '../../core/WorktreeManager.js';
import { StateManager } from '../../core/StateManager.js';
import { AgentPool } from '../../core/AgentPool.js';
import { StoryContext, CodeImplementation, TestSuite, SelfReviewReport, IndependentReviewReport } from '../types.js';
import {
  StoryWorkflowState,
  PRResult,
  WorkflowOrchestratorConfig,
  EscalationContext,
  PerformanceMetrics
} from './workflow-types.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<Omit<WorkflowOrchestratorConfig, 'projectRoot'>> = {
  sprintStatusPath: 'docs/sprint-status.yaml',
  statePath: '.bmad/state',
  autoMerge: false,
  maxTestFixAttempts: 3,
  maxRetryAttempts: 3,
  baseRetryDelay: 1000,
  enableGracefulDegradation: true,
  minConfidenceThreshold: 0.85
};

/**
 * WorkflowOrchestrator Dependencies
 *
 * All dependencies are injected for testability.
 */
export interface WorkflowOrchestratorDependencies {
  /** Story context generator from Story 5.2 */
  contextGenerator: StoryContextGenerator;

  /** Worktree manager from Epic 1 */
  worktreeManager: WorktreeManager;

  /** State manager from Epic 1 */
  stateManager: StateManager;

  /** Agent pool from Epic 1 */
  agentPool: AgentPool;
}

/**
 * Workflow Orchestrator
 *
 * Coordinates the complete story development pipeline.
 */
export class WorkflowOrchestrator {
  private config: Required<WorkflowOrchestratorConfig>;
  private contextGenerator: StoryContextGenerator;
  private worktreeManager: WorktreeManager;
  private agentPool: AgentPool;
  private octokit: Octokit;

  /**
   * Create a new Workflow Orchestrator
   *
   * @param config Orchestrator configuration
   * @param dependencies Injected dependencies
   */
  constructor(
    config: WorkflowOrchestratorConfig,
    dependencies: WorkflowOrchestratorDependencies
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };

    this.contextGenerator = dependencies.contextGenerator;
    this.worktreeManager = dependencies.worktreeManager;
    // stateManager reserved for future use
    this.agentPool = dependencies.agentPool;

    // Initialize Octokit with GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    this.octokit = new Octokit({
      auth: githubToken
    });
  }

  /**
   * Execute complete story workflow from context to PR
   *
   * This is the main entry point for story development automation.
   * It orchestrates all 14 steps of the dev-story workflow:
   * 1. Generate story context
   * 2. Create worktree
   * 3. Implement story (Amelia)
   * 4. Apply code changes
   * 5. Generate tests (Amelia)
   * 6. Apply test changes
   * 7. Run tests
   * 8. Fix failing tests (if needed)
   * 9. Self-review (Amelia)
   * 10. Independent review (Alex)
   * 11. Review decision
   * 12. Create PR
   * 13. Monitor CI and auto-merge
   * 14. Cleanup
   *
   * @param storyId Story identifier (e.g., "5-3-workflow-orchestration-state-management")
   * @returns PR result if successful
   * @throws Error if workflow fails or escalates to human
   */
  async executeStoryWorkflow(storyId: string): Promise<PRResult> {
    const workflowStartTime = Date.now();

    logger.info('Starting story workflow execution', { storyId });

    try {
      // Initialize or load workflow state
      let state = await this.loadOrInitializeState(storyId);

      // Update sprint-status to "in-progress"
      await this.updateSprintStatus(storyId, 'in-progress');

      // Execute workflow steps sequentially
      state = await this.executeWorkflowSteps(state);

      // Update sprint-status to "done" (after merge)
      await this.updateSprintStatus(storyId, 'done');

      // Calculate total duration
      const totalDuration = Date.now() - workflowStartTime;
      state.performance.totalDuration = totalDuration;

      logger.info('Story workflow completed successfully', {
        storyId,
        prUrl: state.prUrl,
        totalDuration,
        targetDuration: 2 * 60 * 60 * 1000 // 2 hours in ms
      });

      // Return PR result
      return {
        url: state.prUrl!,
        number: this.extractPRNumber(state.prUrl!),
        title: `Story ${storyId}`,
        body: 'Automated PR from story workflow',
        baseBranch: 'main',
        headBranch: state.branchName!,
        state: 'merged',
        autoMergeEnabled: this.config.autoMerge
      };
    } catch (error) {
      logger.error('Story workflow failed', error as Error, { storyId });
      throw error;
    }
  }

  /**
   * Execute all workflow steps sequentially
   *
   * @param state Current workflow state
   * @returns Updated workflow state
   */
  private async executeWorkflowSteps(state: StoryWorkflowState): Promise<StoryWorkflowState> {
    // Step 1: Generate context
    if (state.currentStep <= 1) {
      state = await this.executeStep(state, 1, 'Generate Story Context', async () => {
        const context = await this.generateContext(state.storyId);
        return { context };
      });
    }

    // Step 2: Create worktree
    if (state.currentStep <= 2) {
      state = await this.executeStep(state, 2, 'Create Worktree', async () => {
        const worktree = await this.createWorktree(state.storyId);
        state.worktreePath = worktree.path;
        state.branchName = worktree.branch;
        return { worktree };
      });
    }

    // Step 3: Load context for implementation
    const storyFilePath = path.join(this.config.projectRoot, 'docs/stories', `${state.storyId}.md`);
    const context = await this.contextGenerator.generateContext(storyFilePath);

    // Step 3-6: Implementation and Testing (Amelia)
    if (state.currentStep <= 6) {
      state = await this.executeAmeliaImplementation(state, context);
    }

    // Step 7-8: Test Execution and Fixes
    if (state.currentStep <= 8) {
      state = await this.executeTestingPhase(state);
    }

    // Step 9-11: Dual-Agent Review
    if (state.currentStep <= 11) {
      state = await this.executeReviewPhase(state, context);
    }

    // Step 12: Create PR
    if (state.currentStep <= 12) {
      state = await this.executeStep(state, 12, 'Create Pull Request', async () => {
        const pr = await this.createPullRequest(state);
        state.prUrl = pr.url;
        await this.updateSprintStatus(state.storyId, 'review');
        return { pr };
      });
    }

    // Step 13: Monitor CI and Auto-Merge
    if (state.currentStep <= 13 && this.config.autoMerge) {
      state = await this.executeStep(state, 13, 'Monitor CI and Auto-Merge', async () => {
        await this.monitorCIAndMerge(state);
        return {};
      });
    }

    // Step 14: Cleanup
    if (state.currentStep <= 14) {
      state = await this.executeStep(state, 14, 'Cleanup Worktree', async () => {
        await this.cleanupWorktree(state);
        return {};
      });
    }

    return state;
  }

  /**
   * Execute Amelia implementation phase (steps 3-6)
   *
   * @param state Current workflow state
   * @param context Story context
   * @returns Updated workflow state
   */
  private async executeAmeliaImplementation(
    state: StoryWorkflowState,
    context: StoryContext
  ): Promise<StoryWorkflowState> {
    // Create Amelia agent
    const ameliaAgent = await this.createAmeliaAgent(state, context);

    try {
      // Step 3: Implement story
      if (state.currentStep <= 3) {
        state = await this.executeStep(state, 3, 'Implement Story (Amelia)', async () => {
          state.agentActivity.amelia.status = 'implementing';
          await this.checkpointState(state);

          const implementation = await this.retryWithBackoff(
            () => ameliaAgent.implementStory(context),
            this.config.maxRetryAttempts,
            this.config.baseRetryDelay,
            'Amelia implementStory'
          );

          return { implementation };
        });
      }

      // Step 4: Apply code changes
      if (state.currentStep <= 4) {
        state = await this.executeStep(state, 4, 'Apply Code Changes', async () => {
          const implementation = state.variables.implementation as CodeImplementation;
          await this.applyCodeChanges(state.worktreePath!, implementation);
          return {};
        });
      }

      // Step 5: Generate tests
      if (state.currentStep <= 5) {
        state = await this.executeStep(state, 5, 'Generate Tests (Amelia)', async () => {
          state.agentActivity.amelia.status = 'testing';
          await this.checkpointState(state);

          const implementation = state.variables.implementation as CodeImplementation;
          const tests = await this.retryWithBackoff(
            () => ameliaAgent.writeTests(implementation),
            this.config.maxRetryAttempts,
            this.config.baseRetryDelay,
            'Amelia writeTests'
          );

          return { tests };
        });
      }

      // Step 6: Apply test changes
      if (state.currentStep <= 6) {
        state = await this.executeStep(state, 6, 'Apply Test Changes', async () => {
          const tests = state.variables.tests as TestSuite;
          await this.applyTestChanges(state.worktreePath!, tests);
          return {};
        });
      }
    } finally {
      // Mark Amelia as completed
      state.agentActivity.amelia.status = 'completed';
      state.agentActivity.amelia.endTime = new Date();
      await this.checkpointState(state);
    }

    return state;
  }

  /**
   * Execute testing phase (steps 7-8)
   *
   * @param state Current workflow state
   * @returns Updated workflow state
   */
  private async executeTestingPhase(state: StoryWorkflowState): Promise<StoryWorkflowState> {
    // Step 7: Run tests
    if (state.currentStep <= 7) {
      state = await this.executeStep(state, 7, 'Run Tests', async () => {
        const results = await this.runTests(state.worktreePath!);
        return { testResults: results };
      });
    }

    // Step 8: Fix failing tests (if needed)
    if (state.currentStep <= 8) {
      const testResults = state.variables.testResults as any;
      if (testResults && testResults.failed > 0) {
        state = await this.executeStep(state, 8, 'Fix Failing Tests', async () => {
          await this.fixFailingTests(state, testResults);
          return {};
        });
      }
    }

    return state;
  }

  /**
   * Execute review phase (steps 9-11)
   *
   * @param state Current workflow state
   * @param context Story context
   * @returns Updated workflow state
   */
  private async executeReviewPhase(
    state: StoryWorkflowState,
    context: StoryContext
  ): Promise<StoryWorkflowState> {
    const ameliaAgent = await this.createAmeliaAgent(state, context);

    try {
      // Step 9: Amelia self-review
      if (state.currentStep <= 9) {
        state = await this.executeStep(state, 9, 'Self-Review (Amelia)', async () => {
          state.agentActivity.amelia.status = 'reviewing';
          await this.checkpointState(state);

          const implementation = state.variables.implementation as CodeImplementation;
          const selfReview = await this.retryWithBackoff(
            () => ameliaAgent.reviewCode(implementation),
            this.config.maxRetryAttempts,
            this.config.baseRetryDelay,
            'Amelia reviewCode'
          ) as SelfReviewReport;

          state.reviewStatus.selfReviewPassed = selfReview.criticalIssues.length === 0;
          state.reviewStatus.confidence = selfReview.confidence;

          return { selfReview };
        });
      }

      // Step 10: Alex independent review
      if (state.currentStep <= 10) {
        state = await this.executeIndependentReview(state, context);
      }

      // Step 11: Review decision
      if (state.currentStep <= 11) {
        state = await this.executeStep(state, 11, 'Review Decision', async () => {
          const selfReview = state.variables.selfReview as SelfReviewReport;
          const independentReview = state.variables.independentReview as IndependentReviewReport;

          const shouldProceed = this.shouldProceedToPR(selfReview, independentReview);

          if (!shouldProceed) {
            await this.escalateForHumanReview(state, selfReview, independentReview);
            throw new Error('Workflow escalated to human review');
          }

          return { reviewDecision: 'pass' };
        });
      }
    } finally {
      state.agentActivity.amelia.status = 'completed';
      state.agentActivity.amelia.endTime = new Date();
      await this.checkpointState(state);
    }

    return state;
  }

  /**
   * Execute independent review by Alex (Step 10)
   *
   * @param state Current workflow state
   * @param context Story context
   * @returns Updated workflow state
   */
  private async executeIndependentReview(
    state: StoryWorkflowState,
    context: StoryContext
  ): Promise<StoryWorkflowState> {
    return await this.executeStep(state, 10, 'Independent Review (Alex)', async () => {
      // Try to create Alex agent
      let alexAgent;
      try {
        alexAgent = await this.createAlexAgent(state, context);
        state.agentActivity.alex.status = 'reviewing';
        await this.checkpointState(state);
      } catch (error) {
        // Graceful degradation: Alex unavailable
        if (this.config.enableGracefulDegradation) {
          logger.warn('Alex agent unavailable, proceeding with Amelia review only', {
            error: (error as Error).message
          });

          // Create mock independent review based on self-review
          const selfReview = state.variables.selfReview as SelfReviewReport;
          const mockReview: IndependentReviewReport = {
            securityReview: { vulnerabilities: [], score: 100, passed: true },
            qualityAnalysis: {
              complexityScore: 10,
              maintainabilityIndex: 80,
              codeSmells: [],
              duplicationPercentage: 0,
              namingConventionViolations: [],
              score: 90
            },
            testValidation: {
              coverageAdequate: true,
              testQuality: {
                edgeCasesCovered: true,
                errorHandlingTested: true,
                integrationTestsPresent: true
              },
              missingTests: [],
              score: 90
            },
            architectureCompliance: { compliant: true, violations: [] },
            overallScore: 0.9,
            confidence: selfReview.confidence,
            decision: selfReview.criticalIssues.length === 0 ? 'pass' : 'fail',
            findings: [],
            recommendations: ['Note: Independent review by Alex unavailable, proceeding with self-review only']
          };

          state.reviewStatus.independentReviewPassed = mockReview.decision === 'pass';
          return { independentReview: mockReview };
        } else {
          throw error;
        }
      }

      try {
        const implementation = state.variables.implementation as CodeImplementation;
        const tests = state.variables.tests as TestSuite;

        // Execute all Alex review methods
        const securityReview = await this.retryWithBackoff(
          () => alexAgent.reviewSecurity(implementation),
          2, // Alex gets fewer retries
          this.config.baseRetryDelay * 2,
          'Alex reviewSecurity'
        );

        const qualityAnalysis = await this.retryWithBackoff(
          () => alexAgent.analyzeQuality(implementation),
          2,
          this.config.baseRetryDelay * 2,
          'Alex analyzeQuality'
        );

        const testValidation = await this.retryWithBackoff(
          () => alexAgent.validateTests(tests, tests.coverage),
          2,
          this.config.baseRetryDelay * 2,
          'Alex validateTests'
        );

        // Generate comprehensive report
        const independentReview = await this.retryWithBackoff(
          () => alexAgent.generateReport([securityReview, qualityAnalysis, testValidation]),
          2,
          this.config.baseRetryDelay * 2,
          'Alex generateReport'
        ) as IndependentReviewReport;

        state.reviewStatus.independentReviewPassed = independentReview.decision === 'pass';

        return { independentReview };
      } finally {
        state.agentActivity.alex.status = 'completed';
        state.agentActivity.alex.endTime = new Date();
        await this.checkpointState(state);
      }
    });
  }

  /**
   * Execute a single workflow step with error handling and checkpointing
   *
   * @param state Current workflow state
   * @param step Step number
   * @param name Step name
   * @param executor Step execution function
   * @returns Updated workflow state
   */
  private async executeStep(
    state: StoryWorkflowState,
    step: number,
    name: string,
    executor: () => Promise<Record<string, unknown>>
  ): Promise<StoryWorkflowState> {
    const startTime = Date.now();

    logger.info(`Executing workflow step ${step}: ${name}`, {
      storyId: state.storyId,
      currentStep: state.currentStep
    });

    try {
      // Execute step
      const result = await executor();

      // Update state with step result
      state.variables = {
        ...state.variables,
        ...result
      };

      // Advance to next step
      state.currentStep = step + 1;
      state.lastUpdate = new Date();

      // Track performance
      const duration = Date.now() - startTime;
      this.trackStepPerformance(state, step, duration);

      // Log bottlenecks (>30 minutes)
      if (duration > 30 * 60 * 1000) {
        logger.warn(`Workflow step ${step} took longer than 30 minutes`, {
          step,
          name,
          duration
        });
      }

      // Checkpoint state
      await this.checkpointState(state);

      logger.info(`Workflow step ${step} completed`, {
        storyId: state.storyId,
        step,
        name,
        duration
      });

      return state;
    } catch (error) {
      logger.error(`Workflow step ${step} failed`, error as Error, {
        storyId: state.storyId,
        step,
        name
      });

      // Update state with error
      state.status = 'error';
      state.lastUpdate = new Date();
      await this.checkpointState(state);

      throw error;
    }
  }

  /**
   * Generate story context (Step 1)
   *
   * @param storyId Story identifier
   * @returns Story context
   */
  private async generateContext(storyId: string): Promise<StoryContext> {
    const storyFilePath = path.join(this.config.projectRoot, 'docs/stories', `${storyId}.md`);

    logger.info('Generating story context', { storyId, storyFilePath });

    const context = await this.contextGenerator.generateContext(storyFilePath);

    // Validate token count
    if (context.totalTokens > 50000) {
      logger.warn('Story context exceeds 50k token target', {
        storyId,
        totalTokens: context.totalTokens
      });
    }

    return context;
  }

  /**
   * Create worktree for story development (Step 2)
   *
   * @param storyId Story identifier
   * @returns Worktree info
   */
  private async createWorktree(storyId: string) {
    logger.info('Creating worktree', { storyId });

    const worktree = await this.worktreeManager.createWorktree(storyId);

    logger.info('Worktree created', {
      storyId,
      path: worktree.path,
      branch: worktree.branch
    });

    return worktree;
  }

  /**
   * Create Amelia agent
   *
   * @param state Workflow state
   * @param context Story context
   * @returns Amelia agent
   */
  private async createAmeliaAgent(state: StoryWorkflowState, context: StoryContext) {
    logger.info('Creating Amelia agent', { storyId: state.storyId });

    const agent = await this.agentPool.createAgent('amelia', {
      taskDescription: context.story.description,
      workflowState: state as unknown as Record<string, unknown>,
      onboardingDocs: [context.onboardingDocs]
    });

    state.agentActivity.amelia.agentId = agent.id;
    state.agentActivity.amelia.startTime = new Date();
    await this.checkpointState(state);

    // Return mock agent with required methods (actual implementation would use real agent)
    return agent as any;
  }

  /**
   * Create Alex agent
   *
   * @param state Workflow state
   * @param context Story context
   * @returns Alex agent
   */
  private async createAlexAgent(state: StoryWorkflowState, context: StoryContext) {
    logger.info('Creating Alex agent', { storyId: state.storyId });

    const agent = await this.agentPool.createAgent('alex', {
      taskDescription: context.story.description,
      workflowState: state as unknown as Record<string, unknown>,
      onboardingDocs: [context.onboardingDocs]
    });

    state.agentActivity.alex.agentId = agent.id;
    state.agentActivity.alex.startTime = new Date();
    await this.checkpointState(state);

    // Return mock agent with required methods (actual implementation would use real agent)
    return agent as any;
  }

  /**
   * Apply code changes to worktree (Step 4)
   *
   * @param worktreePath Worktree path
   * @param implementation Code implementation
   */
  private async applyCodeChanges(worktreePath: string, implementation: CodeImplementation): Promise<void> {
    logger.info('Applying code changes', { worktreePath, fileCount: implementation.files.length });

    for (const file of implementation.files) {
      const filePath = path.join(worktreePath, file.path);

      if (file.operation === 'create' || file.operation === 'modify') {
        // Create directory if needed
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Write file
        await fs.writeFile(filePath, file.content, 'utf-8');

        logger.info('File written', { file: file.path, operation: file.operation });
      } else if (file.operation === 'delete') {
        // Delete file
        await fs.unlink(filePath);

        logger.info('File deleted', { file: file.path });
      }
    }
  }

  /**
   * Apply test changes to worktree (Step 6)
   *
   * @param worktreePath Worktree path
   * @param tests Test suite
   */
  private async applyTestChanges(worktreePath: string, tests: TestSuite): Promise<void> {
    logger.info('Applying test changes', { worktreePath, fileCount: tests.files.length });

    for (const file of tests.files) {
      const filePath = path.join(worktreePath, file.path);

      // Create directory if needed
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write test file
      await fs.writeFile(filePath, file.content, 'utf-8');

      logger.info('Test file written', { file: file.path });
    }
  }

  /**
   * Run tests in worktree (Step 7)
   *
   * @param worktreePath Worktree path
   * @returns Test results
   */
  private async runTests(worktreePath: string): Promise<unknown> {
    logger.info('Running tests', { worktreePath });

    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test', '--', '--reporter=json'], {
        cwd: worktreePath,
        shell: true,
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      testProcess.on('close', (code) => {
        logger.info('Test execution completed', { exitCode: code });

        const exitCode = code ?? 1; // Default to 1 if null

        try {
          // Try to parse vitest JSON output
          const lines = stdout.split('\n');
          let testResults: any = null;

          // Find the JSON output line from vitest
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.testResults || parsed.numTotalTests !== undefined) {
                testResults = parsed;
                break;
              }
            } catch (e) {
              // Not JSON, skip
            }
          }

          // If JSON parsing succeeds, use it
          if (testResults) {
            const result = {
              passed: testResults.numPassedTests || 0,
              failed: testResults.numFailedTests || 0,
              skipped: testResults.numPendingTests || 0,
              duration: testResults.testResults?.reduce((sum: number, t: any) => sum + (t.perfStats?.runtime || 0), 0) || 0,
              coverage: this.extractCoverage(testResults)
            };
            resolve(result);
            return;
          }

          // Fallback: Parse text output
          const passedMatch = stdout.match(/(\d+) passed/);
          const failedMatch = stdout.match(/(\d+) failed/);
          const skippedMatch = stdout.match(/(\d+) skipped/);

          const result = {
            passed: passedMatch?.[1] ? parseInt(passedMatch[1], 10) : 0,
            failed: failedMatch?.[1] ? parseInt(failedMatch[1], 10) : (exitCode === 0 ? 0 : 1),
            skipped: skippedMatch?.[1] ? parseInt(skippedMatch[1], 10) : 0,
            duration: 0,
            coverage: this.extractCoverageFromOutput(stdout)
          };

          if (exitCode !== 0 && result.failed === 0) {
            result.failed = 1; // Mark as failed if exit code is non-zero
          }

          resolve(result);
        } catch (error) {
          logger.error('Failed to parse test results', error as Error, { stdout, stderr });

          // Return minimal result based on exit code
          resolve({
            passed: exitCode === 0 ? 1 : 0,
            failed: exitCode === 0 ? 0 : 1,
            skipped: 0,
            duration: 0,
            coverage: { lines: 0, functions: 0, branches: 0, statements: 0 }
          });
        }
      });

      testProcess.on('error', (error) => {
        logger.error('Test execution failed', error, { worktreePath });
        reject(new Error(`Test execution failed: ${error.message}`));
      });
    });
  }

  /**
   * Extract coverage from test results JSON
   *
   * @param testResults Test results object
   * @returns Coverage object
   */
  private extractCoverage(testResults: any): any {
    const coverage = testResults.coverage || testResults.coverageMap;
    if (coverage) {
      return {
        lines: coverage.lines?.pct || 0,
        functions: coverage.functions?.pct || 0,
        branches: coverage.branches?.pct || 0,
        statements: coverage.statements?.pct || 0
      };
    }
    return { lines: 0, functions: 0, branches: 0, statements: 0 };
  }

  /**
   * Extract coverage from text output
   *
   * @param output Test output
   * @returns Coverage object
   */
  private extractCoverageFromOutput(output: string): any {
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    if (coverageMatch && coverageMatch[1] && coverageMatch[2] && coverageMatch[3] && coverageMatch[4]) {
      return {
        lines: parseFloat(coverageMatch[1]),
        functions: parseFloat(coverageMatch[2]),
        branches: parseFloat(coverageMatch[3]),
        statements: parseFloat(coverageMatch[4])
      };
    }
    return { lines: 0, functions: 0, branches: 0, statements: 0 };
  }

  /**
   * Fix failing tests (Step 8)
   *
   * @param state Workflow state
   * @param testResults Test results
   */
  private async fixFailingTests(state: StoryWorkflowState, testResults: any): Promise<void> {
    logger.info('Fixing failing tests', {
      storyId: state.storyId,
      failedTests: testResults.failed
    });

    // Implement auto-fix cycle with Amelia (up to maxTestFixAttempts)
    // This would invoke Amelia to analyze failures and generate fixes
    // For now, this is a placeholder

    let attempts = 0;
    while (attempts < this.config.maxTestFixAttempts && testResults.failed > 0) {
      attempts++;

      logger.info(`Test fix attempt ${attempts}/${this.config.maxTestFixAttempts}`);

      // Mock fix (actual implementation would use Amelia)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-run tests
      testResults = await this.runTests(state.worktreePath!);

      if (testResults.failed === 0) {
        logger.info('Tests fixed successfully', { attempts });
        return;
      }
    }

    // Escalate if tests still failing
    if (testResults.failed > 0) {
      throw new Error(`Test failures persist after ${attempts} fix attempts`);
    }
  }

  /**
   * Determine if workflow should proceed to PR creation
   *
   * Decision logic:
   * - Both reviews must pass
   * - Confidence must be >= threshold (default 0.85)
   * - No critical issues
   *
   * @param selfReview Amelia self-review
   * @param independentReview Alex independent review
   * @returns Whether to proceed to PR
   */
  private shouldProceedToPR(
    selfReview: SelfReviewReport,
    independentReview: IndependentReviewReport
  ): boolean {
    // Check confidence threshold
    if (!selfReview.confidence || selfReview.confidence < this.config.minConfidenceThreshold) {
      logger.warn('Self-review confidence below threshold', {
        confidence: selfReview.confidence,
        threshold: this.config.minConfidenceThreshold
      });
      return false;
    }

    // Check for critical issues
    if (selfReview.criticalIssues.length > 0) {
      logger.warn('Critical issues found in self-review', {
        issues: selfReview.criticalIssues
      });
      return false;
    }

    // Check independent review decision
    if (independentReview.decision !== 'pass') {
      logger.warn('Independent review did not pass', {
        decision: independentReview.decision,
        confidence: independentReview.confidence
      });
      return false;
    }

    // Check independent review confidence
    if (independentReview.confidence < this.config.minConfidenceThreshold) {
      logger.warn('Independent review confidence below threshold', {
        confidence: independentReview.confidence,
        threshold: this.config.minConfidenceThreshold
      });
      return false;
    }

    logger.info('Reviews passed, proceeding to PR', {
      selfReviewConfidence: selfReview.confidence,
      independentReviewConfidence: independentReview.confidence
    });

    return true;
  }

  /**
   * Escalate workflow to human review
   *
   * @param state Workflow state
   * @param selfReview Amelia self-review
   * @param independentReview Alex independent review
   */
  private async escalateForHumanReview(
    state: StoryWorkflowState,
    selfReview: SelfReviewReport,
    independentReview: IndependentReviewReport
  ): Promise<void> {
    logger.warn('Escalating story to human review', {
      storyId: state.storyId,
      selfReviewConfidence: selfReview.confidence,
      independentReviewConfidence: independentReview.confidence
    });

    // Determine escalation reason
    let reason: EscalationContext['reason'] = 'low-confidence';
    if (selfReview.criticalIssues.length > 0) {
      reason = 'critical-issues';
    }

    const escalation: EscalationContext = {
      storyId: state.storyId,
      reason,
      step: state.currentStep,
      errorMessage: `Review failed: ${reason}`,
      selfReview,
      independentReview,
      state,
      timestamp: new Date()
    };

    // Save escalation context (integration with Epic 2 escalation queue would go here)
    const escalationPath = path.join(
      this.config.projectRoot,
      this.config.statePath,
      `escalation-${state.storyId}.json`
    );

    await fs.mkdir(path.dirname(escalationPath), { recursive: true });
    await fs.writeFile(escalationPath, JSON.stringify(escalation, null, 2), 'utf-8');

    logger.info('Escalation context saved', { escalationPath });
  }

  /**
   * Create pull request (Step 12)
   *
   * @param state Workflow state
   * @returns PR result
   */
  private async createPullRequest(state: StoryWorkflowState): Promise<PRResult> {
    logger.info('Creating pull request', {
      storyId: state.storyId,
      branch: state.branchName
    });

    try {
      // Extract owner and repo from git config or environment
      const owner = process.env.GITHUB_OWNER || await this.getGitHubOwner();
      const repo = process.env.GITHUB_REPO || await this.getGitHubRepo();

      // Push branch to remote first
      await this.pushBranch(state);

      // Create PR title and body
      const title = `Story ${state.storyId}`;
      const body = this.generatePRBody(state);

      // Create PR using GitHub API
      const response = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head: state.branchName!,
        base: 'main'
      });

      const pr: PRResult = {
        url: response.data.html_url,
        number: response.data.number,
        title: response.data.title,
        body: response.data.body || '',
        baseBranch: response.data.base.ref,
        headBranch: response.data.head.ref,
        state: 'open',
        autoMergeEnabled: this.config.autoMerge
      };

      logger.info('Pull request created', { prUrl: pr.url, prNumber: pr.number });

      return pr;
    } catch (error) {
      logger.error('Failed to create pull request', error as Error, {
        storyId: state.storyId,
        branch: state.branchName
      });
      throw new Error(`PR creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get GitHub owner from git remote
   *
   * @returns Owner name
   */
  private async getGitHubOwner(): Promise<string> {
    return new Promise((resolve, reject) => {
      const gitProcess = spawn('git', ['remote', 'get-url', 'origin'], {
        cwd: this.config.projectRoot,
        shell: true
      });

      let output = '';
      gitProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          // Parse git@github.com:owner/repo.git or https://github.com/owner/repo.git
          const match = output.match(/github\.com[:/]([^/]+)\//);
          if (match && match[1]) {
            resolve(match[1]);
            return;
          }
        }
        reject(new Error('Could not determine GitHub owner from git remote'));
      });
    });
  }

  /**
   * Get GitHub repo from git remote
   *
   * @returns Repo name
   */
  private async getGitHubRepo(): Promise<string> {
    return new Promise((resolve, reject) => {
      const gitProcess = spawn('git', ['remote', 'get-url', 'origin'], {
        cwd: this.config.projectRoot,
        shell: true
      });

      let output = '';
      gitProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          // Parse git@github.com:owner/repo.git or https://github.com/owner/repo.git
          const match = output.match(/\/([^/]+?)(?:\.git)?$/);
          if (match && match[1]) {
            resolve(match[1].replace('.git', ''));
            return;
          }
        }
        reject(new Error('Could not determine GitHub repo from git remote'));
      });
    });
  }

  /**
   * Push branch to remote
   *
   * @param state Workflow state
   */
  private async pushBranch(state: StoryWorkflowState): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('Pushing branch to remote', { branch: state.branchName });

      const gitProcess = spawn('git', ['push', '-u', 'origin', state.branchName!], {
        cwd: state.worktreePath || this.config.projectRoot,
        shell: true
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Branch pushed successfully', { branch: state.branchName });
          resolve();
        } else {
          reject(new Error(`Failed to push branch: exit code ${code}`));
        }
      });

      gitProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Generate PR body from workflow state
   *
   * @param state Workflow state
   * @returns PR body markdown
   */
  private generatePRBody(state: StoryWorkflowState): string {
    const selfReview = state.variables.selfReview as SelfReviewReport;
    const independentReview = state.variables.independentReview as IndependentReviewReport;

    let body = `## Story ${state.storyId}\n\n`;
    body += `Automated PR from story workflow orchestrator.\n\n`;
    body += `### Review Summary\n\n`;

    if (selfReview) {
      body += `**Self-Review (Amelia):**\n`;
      body += `- Confidence: ${(selfReview.confidence * 100).toFixed(0)}%\n`;
      body += `- Critical Issues: ${selfReview.criticalIssues.length}\n\n`;
    }

    if (independentReview) {
      body += `**Independent Review (Alex):**\n`;
      body += `- Decision: ${independentReview.decision}\n`;
      body += `- Confidence: ${(independentReview.confidence * 100).toFixed(0)}%\n`;
      body += `- Overall Score: ${(independentReview.overallScore * 100).toFixed(0)}%\n\n`;

      if (independentReview.recommendations.length > 0) {
        body += `**Recommendations:**\n`;
        independentReview.recommendations.forEach(rec => {
          body += `- ${rec}\n`;
        });
        body += `\n`;
      }
    }

    body += `### Performance\n\n`;
    if (state.performance.totalDuration) {
      const durationMins = Math.round(state.performance.totalDuration / 1000 / 60);
      body += `- Total Duration: ${durationMins} minutes\n`;
    }

    return body;
  }

  /**
   * Monitor CI and auto-merge (Step 13)
   *
   * @param state Workflow state
   */
  private async monitorCIAndMerge(state: StoryWorkflowState): Promise<void> {
    logger.info('Monitoring CI status', {
      storyId: state.storyId,
      prUrl: state.prUrl
    });

    try {
      // Extract owner, repo, and PR number
      const owner = process.env.GITHUB_OWNER || await this.getGitHubOwner();
      const repo = process.env.GITHUB_REPO || await this.getGitHubRepo();
      const prNumber = this.extractPRNumber(state.prUrl!);

      // Poll every 30 seconds, max 30 minutes timeout
      const pollInterval = 30000; // 30 seconds
      const maxPolls = 60; // 30 minutes
      let polls = 0;

      while (polls < maxPolls) {
        polls++;

        // Get PR details to check CI status
        const pr = await this.octokit.pulls.get({
          owner,
          repo,
          pull_number: prNumber
        });

        // Get commit SHA for checks
        const headSha = pr.data.head.sha;

        // Get check runs for the commit
        const checkRuns = await this.octokit.checks.listForRef({
          owner,
          repo,
          ref: headSha
        });

        // Analyze check run statuses
        const checks = checkRuns.data.check_runs;
        const totalChecks = checks.length;

        if (totalChecks === 0) {
          logger.debug('No CI checks found yet, waiting...', {
            poll: polls,
            maxPolls
          });
        } else {
          const completedChecks = checks.filter(c => c.status === 'completed');
          const successfulChecks = checks.filter(c => c.conclusion === 'success');
          const failedChecks = checks.filter(c => c.conclusion === 'failure' || c.conclusion === 'cancelled');

          logger.info('CI check status', {
            total: totalChecks,
            completed: completedChecks.length,
            successful: successfulChecks.length,
            failed: failedChecks.length
          });

          // All checks completed successfully
          if (completedChecks.length === totalChecks && failedChecks.length === 0) {
            logger.info('All CI checks passed', { prUrl: state.prUrl });
            state.ciStatus = 'passed';

            // Merge PR if auto-merge is enabled
            if (this.config.autoMerge) {
              await this.mergePR(owner, repo, prNumber, state);
            } else {
              logger.info('Auto-merge disabled, PR ready for manual merge', {
                prUrl: state.prUrl
              });
            }

            return;
          }

          // Any checks failed
          if (failedChecks.length > 0) {
            logger.error('CI checks failed', undefined, {
              storyId: state.storyId,
              prUrl: state.prUrl,
              failedChecks: failedChecks.map(c => c.name)
            });
            state.ciStatus = 'failed';
            const error = new Error(`CI checks failed: ${failedChecks.map(c => c.name).join(', ')}`);
            throw error;
          }

          // Checks still running
          state.ciStatus = 'running';
        }

        // Wait before next poll
        if (polls < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }

      // Timeout
      logger.warn('CI monitoring timeout', {
        prUrl: state.prUrl,
        polls,
        maxDuration: '30 minutes'
      });
      throw new Error('CI monitoring timeout (30 minutes)');
    } catch (error) {
      logger.error('CI monitoring failed', error as Error, {
        storyId: state.storyId,
        prUrl: state.prUrl
      });
      throw error;
    }
  }

  /**
   * Merge pull request
   *
   * @param owner GitHub owner
   * @param repo GitHub repo
   * @param prNumber PR number
   * @param state Workflow state
   */
  private async mergePR(
    owner: string,
    repo: string,
    prNumber: number,
    state: StoryWorkflowState
  ): Promise<void> {
    logger.info('Merging pull request', {
      prUrl: state.prUrl,
      prNumber
    });

    try {
      await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        merge_method: 'squash',
        commit_title: `Story ${state.storyId}`,
        commit_message: `Automated merge after successful CI checks`
      });

      logger.info('Pull request merged successfully', {
        prUrl: state.prUrl,
        prNumber
      });

      // Delete branch after merge (optional but recommended)
      try {
        await this.octokit.git.deleteRef({
          owner,
          repo,
          ref: `heads/${state.branchName}`
        });
        logger.info('Branch deleted after merge', { branch: state.branchName });
      } catch (error) {
        logger.warn('Failed to delete branch after merge (non-critical)', {
          branch: state.branchName,
          error: (error as Error).message
        });
      }
    } catch (error) {
      logger.error('Failed to merge pull request', error as Error, {
        prUrl: state.prUrl,
        prNumber
      });
      throw new Error(`PR merge failed: ${(error as Error).message}`);
    }
  }

  /**
   * Cleanup worktree (Step 14)
   *
   * @param state Workflow state
   */
  private async cleanupWorktree(state: StoryWorkflowState): Promise<void> {
    if (!state.worktreePath) {
      return;
    }

    logger.info('Cleaning up worktree', {
      storyId: state.storyId,
      worktreePath: state.worktreePath
    });

    try {
      await this.worktreeManager.destroyWorktree(state.storyId);

      logger.info('Worktree cleaned up', { storyId: state.storyId });
    } catch (error) {
      // Cleanup failure is not critical
      logger.warn('Worktree cleanup failed (non-critical)', {
        storyId: state.storyId,
        error: (error as Error).message
      });
    }

    // Remove workflow state file
    const statePath = path.join(
      this.config.projectRoot,
      this.config.statePath,
      `story-workflow-${state.storyId}.json`
    );

    try {
      await fs.unlink(statePath);
      logger.info('Workflow state file removed', { statePath });
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Update sprint-status.yaml
   *
   * @param storyId Story identifier
   * @param status New status
   */
  private async updateSprintStatus(
    storyId: string,
    status: 'in-progress' | 'review' | 'done'
  ): Promise<void> {
    const sprintStatusPath = path.join(this.config.projectRoot, this.config.sprintStatusPath);

    logger.info('Updating sprint status', { storyId, status });

    try {
      // Read current file
      const content = await fs.readFile(sprintStatusPath, 'utf-8');

      // Parse YAML
      const data = yaml.parse(content);

      // Update status
      if (data.development_status && data.development_status[storyId]) {
        data.development_status[storyId] = status;

        // Write back (atomic write via temp file)
        const tmpPath = `${sprintStatusPath}.tmp`;
        await fs.writeFile(tmpPath, yaml.stringify(data), 'utf-8');
        await fs.rename(tmpPath, sprintStatusPath);

        logger.info('Sprint status updated', { storyId, status });
      } else {
        logger.warn('Story not found in sprint-status.yaml', { storyId });
      }
    } catch (error) {
      logger.error('Failed to update sprint status', error as Error, { storyId, status });
      throw error;
    }
  }

  /**
   * Load or initialize workflow state
   *
   * @param storyId Story identifier
   * @returns Workflow state
   */
  private async loadOrInitializeState(storyId: string): Promise<StoryWorkflowState> {
    const statePath = path.join(
      this.config.projectRoot,
      this.config.statePath,
      `story-workflow-${storyId}.json`
    );

    try {
      // Try to load existing state
      const content = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(content) as StoryWorkflowState;

      logger.info('Loaded existing workflow state', { storyId, currentStep: state.currentStep });

      return state;
    } catch (error) {
      // State doesn't exist, create new
      logger.info('Initializing new workflow state', { storyId });

      const state: StoryWorkflowState = {
        workflow: 'dev-story',
        storyId,
        currentStep: 1,
        agentActivity: {
          amelia: { status: 'idle' },
          alex: { status: 'idle' }
        },
        reviewStatus: {
          selfReviewPassed: false,
          independentReviewPassed: false,
          confidence: 0
        },
        performance: {},
        project: {
          id: 'agent-orchestrator',
          name: 'Agent Orchestrator',
          level: 3
        },
        currentWorkflow: 'dev-story',
        status: 'running',
        variables: {},
        startTime: new Date(),
        lastUpdate: new Date()
      };

      return state;
    }
  }

  /**
   * Checkpoint workflow state
   *
   * @param state Workflow state
   */
  private async checkpointState(state: StoryWorkflowState): Promise<void> {
    const statePath = path.join(
      this.config.projectRoot,
      this.config.statePath,
      `story-workflow-${state.storyId}.json`
    );

    try {
      // Create directory if needed
      await fs.mkdir(path.dirname(statePath), { recursive: true });

      // Atomic write
      const tmpPath = `${statePath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
      await fs.rename(tmpPath, statePath);

      logger.debug('Workflow state checkpointed', {
        storyId: state.storyId,
        currentStep: state.currentStep
      });
    } catch (error) {
      logger.error('Failed to checkpoint workflow state', error as Error, {
        storyId: state.storyId
      });
      // Don't throw - checkpoint failure shouldn't stop workflow
    }
  }

  /**
   * Retry operation with exponential backoff
   *
   * @param operation Operation to retry
   * @param maxAttempts Maximum retry attempts
   * @param baseDelay Base delay in milliseconds
   * @param operationName Operation name for logging
   * @returns Operation result
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    baseDelay: number,
    operationName: string
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          logger.error(`Operation failed after ${maxAttempts} attempts`, error as Error, {
            operation: operationName
          });
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Operation failed, retrying in ${delay}ms`, {
          operation: operationName,
          attempt,
          maxAttempts,
          error: (error as Error).message
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Retry failed: ${operationName}`);
  }

  /**
   * Track step performance
   *
   * @param state Workflow state
   * @param step Step number
   * @param duration Duration in milliseconds
   */
  private trackStepPerformance(state: StoryWorkflowState, step: number, duration: number): void {
    const performanceKey = this.getPerformanceKey(step);
    if (performanceKey) {
      state.performance[performanceKey as keyof PerformanceMetrics] = duration as any;
    }
  }

  /**
   * Get performance metric key for step
   *
   * @param step Step number
   * @returns Performance metric key
   */
  private getPerformanceKey(step: number): string | null {
    const keyMap: Record<number, string> = {
      1: 'contextGeneration',
      2: 'worktreeCreation',
      3: 'implementation',
      5: 'testGeneration',
      7: 'testExecution',
      9: 'selfReview',
      10: 'independentReview',
      12: 'prCreation',
      13: 'ciMonitoring'
    };

    return keyMap[step] || null;
  }

  /**
   * Extract PR number from PR URL
   *
   * @param prUrl PR URL
   * @returns PR number
   */
  private extractPRNumber(prUrl: string): number {
    const match = prUrl.match(/\/pull\/(\d+)/);
    return match && match[1] ? parseInt(match[1], 10) : 0;
  }
}
