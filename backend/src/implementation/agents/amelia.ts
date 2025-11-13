/**
 * Amelia Agent - Developer Persona
 *
 * Amelia specializes in code implementation, test generation, and self-review.
 * Uses AgentPool for lifecycle management and LLM invocation.
 * Configured with GPT-4o for superior code generation capabilities.
 *
 * Features:
 * - Story implementation following acceptance criteria
 * - Comprehensive test generation with >80% coverage target
 * - Critical self-review before handoff to Alex
 * - Integration with Epic 1 AgentPool and LLMFactory
 * - Cost tracking and event emission
 *
 * @example
 * ```typescript
 * const amelia = await AmeliaAgentInfrastructure.create(agentPool, projectConfig);
 *
 * // Implement story
 * const implementation = await amelia.implementStory(storyContext);
 *
 * // Generate tests
 * const tests = await amelia.writeTests(implementation);
 *
 * // Self-review
 * const review = await amelia.reviewCode(implementation);
 * ```
 */

import { AgentPool } from '../../core/AgentPool.js';
import { Agent, AgentContext } from '../../types/agent.js';
import { ProjectConfig } from '../../config/ProjectConfig.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite,
  SelfReviewReport
} from '../types.js';
import {
  ameliaImplementPrompt,
  ameliaTestPrompt,
  ameliaSelfReviewPrompt
} from '../prompts/amelia-prompts.js';

/**
 * Amelia Agent Infrastructure
 *
 * Provides developer agent capabilities for autonomous story implementation.
 */
export class AmeliaAgentInfrastructure {
  /** Agent Pool for lifecycle management */
  private readonly agentPool: AgentPool;

  /** Project configuration */
  private readonly projectConfig: ProjectConfig;

  /** Active agent instance (null when not active) */
  private agent: Agent | null = null;

  /**
   * Private constructor - use AmeliaAgentInfrastructure.create() instead
   */
  private constructor(
    agentPool: AgentPool,
    projectConfig: ProjectConfig
  ) {
    this.agentPool = agentPool;
    this.projectConfig = projectConfig;
  }

  /**
   * Create a new Amelia agent infrastructure
   *
   * @param agentPool Agent pool for lifecycle management
   * @param projectConfig Project configuration
   * @returns Amelia agent infrastructure
   */
  static async create(
    agentPool: AgentPool,
    projectConfig: ProjectConfig
  ): Promise<AmeliaAgentInfrastructure> {
    return new AmeliaAgentInfrastructure(agentPool, projectConfig);
  }

  /**
   * Implement story according to acceptance criteria
   *
   * Invokes Amelia agent via AgentPool with specialized implementation prompt.
   * Follows architecture patterns, coding standards, and technical notes.
   *
   * @param context Story context with requirements and existing code
   * @returns Code implementation with files, commit message, and AC mapping
   * @throws Error if agent creation fails or LLM invocation fails
   */
  async implementStory(context: StoryContext): Promise<CodeImplementation> {
    this.log('Starting story implementation', context.story.id);

    try {
      // Create agent context for AgentPool
      const agentContext: AgentContext = {
        onboardingDocs: [context.onboardingDocs],
        workflowState: {
          currentPhase: 'implementation',
          storyId: context.story.id
        },
        taskDescription: `Implement story ${context.story.id}: ${context.story.title}`
      };

      // Create Amelia agent via AgentPool
      this.agent = await this.agentPool.createAgent('amelia', agentContext);
      this.log('Agent created', this.agent.id);

      // Build specialized prompt for implementation
      const prompt = ameliaImplementPrompt(context);

      // Invoke agent with prompt
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Agent invoked successfully', response.length);

      // Parse response into CodeImplementation
      const implementation = this.parseCodeImplementation(response);

      return implementation;
    } catch (error) {
      this.log('Story implementation failed', (error as Error).message);
      throw new Error(
        `Amelia agent failed to implement story: ${(error as Error).message}`
      );
    } finally {
      // Destroy agent to free resources
      if (this.agent) {
        await this.agentPool.destroyAgent(this.agent.id);
        this.agent = null;
      }
    }
  }

  /**
   * Generate comprehensive tests for implemented code
   *
   * Targets >80% code coverage with unit and integration tests.
   * Includes edge cases and error handling tests.
   *
   * @param code Code implementation to test
   * @returns Test suite with test files, coverage, and results
   * @throws Error if agent creation fails or test generation fails
   */
  async writeTests(code: CodeImplementation): Promise<TestSuite> {
    this.log('Starting test generation', code.files.length);

    try {
      // Create minimal story context for test generation
      const context: StoryContext = {
        story: {
          id: 'test-generation',
          title: 'Generate Tests',
          description: 'Generate comprehensive tests for implementation',
          acceptanceCriteria: ['Test coverage >80%'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      // Create agent context
      const agentContext: AgentContext = {
        onboardingDocs: [],
        workflowState: {
          currentPhase: 'test-generation'
        },
        taskDescription: 'Generate comprehensive tests'
      };

      // Create Amelia agent
      this.agent = await this.agentPool.createAgent('amelia', agentContext);
      this.log('Agent created for test generation', this.agent.id);

      // Build specialized prompt for test generation
      const prompt = ameliaTestPrompt(context, code);

      // Invoke agent
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Test generation complete', response.length);

      // Parse response into TestSuite
      const tests = this.parseTestSuite(response);

      return tests;
    } catch (error) {
      this.log('Test generation failed', (error as Error).message);
      throw new Error(
        `Amelia agent failed to generate tests: ${(error as Error).message}`
      );
    } finally {
      // Destroy agent
      if (this.agent) {
        await this.agentPool.destroyAgent(this.agent.id);
        this.agent = null;
      }
    }
  }

  /**
   * Perform self-review of implemented code
   *
   * Critical self-assessment before handoff to Alex for independent review.
   * Checks acceptance criteria, code quality, and identifies issues.
   *
   * @param code Code implementation to review
   * @returns Self-review report with checklist, code smells, and confidence
   * @throws Error if agent creation fails or review fails
   */
  async reviewCode(code: CodeImplementation): Promise<SelfReviewReport> {
    this.log('Starting self-review', code.files.length);

    try {
      // Create minimal context for self-review
      const context: StoryContext = {
        story: {
          id: 'self-review',
          title: 'Self Review',
          description: 'Perform critical self-review',
          acceptanceCriteria: ['Code meets all requirements'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      // Create minimal test suite for review
      const tests: TestSuite = {
        files: [],
        framework: 'vitest',
        testCount: 0,
        coverage: {
          lines: 0,
          functions: 0,
          branches: 0,
          statements: 0,
          uncoveredLines: []
        },
        results: {
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        }
      };

      // Create agent context
      const agentContext: AgentContext = {
        onboardingDocs: [],
        workflowState: {
          currentPhase: 'self-review'
        },
        taskDescription: 'Perform self-review'
      };

      // Create Amelia agent
      this.agent = await this.agentPool.createAgent('amelia', agentContext);
      this.log('Agent created for self-review', this.agent.id);

      // Build specialized prompt for self-review
      const prompt = ameliaSelfReviewPrompt(context, code, tests);

      // Invoke agent
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Self-review complete', response.length);

      // Parse response into SelfReviewReport
      const review = this.parseSelfReviewReport(response);

      return review;
    } catch (error) {
      this.log('Self-review failed', (error as Error).message);
      throw new Error(
        `Amelia agent failed to review code: ${(error as Error).message}`
      );
    } finally {
      // Destroy agent
      if (this.agent) {
        await this.agentPool.destroyAgent(this.agent.id);
        this.agent = null;
      }
    }
  }

  /**
   * Parse LLM response into CodeImplementation
   *
   * Expects JSON format from LLM with files, commitMessage, implementationNotes, acceptanceCriteriaMapping.
   *
   * @param response LLM response text
   * @returns Parsed CodeImplementation
   * @throws Error if parsing fails
   */
  private parseCodeImplementation(response: string): CodeImplementation {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return {
        files: parsed.files || [],
        commitMessage: parsed.commitMessage || 'Implementation complete',
        implementationNotes: parsed.implementationNotes || '',
        acceptanceCriteriaMapping: parsed.acceptanceCriteriaMapping || []
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          files: parsed.files || [],
          commitMessage: parsed.commitMessage || 'Implementation complete',
          implementationNotes: parsed.implementationNotes || '',
          acceptanceCriteriaMapping: parsed.acceptanceCriteriaMapping || []
        };
      }

      throw new Error(
        'Failed to parse LLM response into CodeImplementation. Expected JSON format.'
      );
    }
  }

  /**
   * Parse LLM response into TestSuite
   *
   * @param response LLM response text
   * @returns Parsed TestSuite
   * @throws Error if parsing fails
   */
  private parseTestSuite(response: string): TestSuite {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return {
        files: parsed.files || [],
        framework: parsed.framework || 'vitest',
        testCount: parsed.testCount || 0,
        coverage: parsed.coverage || {
          lines: 0,
          functions: 0,
          branches: 0,
          statements: 0,
          uncoveredLines: []
        },
        results: parsed.results || {
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        }
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          files: parsed.files || [],
          framework: parsed.framework || 'vitest',
          testCount: parsed.testCount || 0,
          coverage: parsed.coverage || {
            lines: 0,
            functions: 0,
            branches: 0,
            statements: 0,
            uncoveredLines: []
          },
          results: parsed.results || {
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
          }
        };
      }

      throw new Error(
        'Failed to parse LLM response into TestSuite. Expected JSON format.'
      );
    }
  }

  /**
   * Parse LLM response into SelfReviewReport
   *
   * @param response LLM response text
   * @returns Parsed SelfReviewReport
   * @throws Error if parsing fails
   */
  private parseSelfReviewReport(response: string): SelfReviewReport {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return {
        checklist: parsed.checklist || [],
        codeSmells: parsed.codeSmells || [],
        acceptanceCriteriaCheck: parsed.acceptanceCriteriaCheck || [],
        confidence: parsed.confidence || 0.5,
        criticalIssues: parsed.criticalIssues || []
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          checklist: parsed.checklist || [],
          codeSmells: parsed.codeSmells || [],
          acceptanceCriteriaCheck: parsed.acceptanceCriteriaCheck || [],
          confidence: parsed.confidence || 0.5,
          criticalIssues: parsed.criticalIssues || []
        };
      }

      throw new Error(
        'Failed to parse LLM response into SelfReviewReport. Expected JSON format.'
      );
    }
  }

  /**
   * Log message
   *
   * @param message Log message
   * @param detail Optional detail
   */
  private log(message: string, detail?: string | number): void {
    const detailStr = detail !== undefined ? ` (${detail})` : '';
    console.log(`[AmeliaAgent] ${message}${detailStr}`);
  }
}
