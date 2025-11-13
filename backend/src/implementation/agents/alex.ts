/**
 * Alex Agent - Code Reviewer Persona
 *
 * Alex specializes in independent code review with security, quality, and test focus.
 * Uses AgentPool for lifecycle management and LLM invocation.
 * Configured with Claude Sonnet 4.5 for superior analytical reasoning.
 *
 * Features:
 * - Security vulnerability detection (OWASP categories)
 * - Code quality analysis (complexity, maintainability, smells)
 * - Test coverage validation (>80% target)
 * - Comprehensive review report generation
 * - Different LLM than Amelia for diverse perspectives
 *
 * @example
 * ```typescript
 * const alex = await AlexAgentInfrastructure.create(agentPool, projectConfig);
 *
 * // Review security
 * const securityReview = await alex.reviewSecurity(implementation);
 *
 * // Analyze quality
 * const qualityAnalysis = await alex.analyzeQuality(implementation);
 *
 * // Validate tests
 * const testValidation = await alex.validateTests(tests, coverage);
 *
 * // Generate final report
 * const report = await alex.generateReport([securityReview, qualityAnalysis, testValidation]);
 * ```
 */

import { AgentPool } from '../../core/AgentPool.js';
import { Agent, AgentContext } from '../../types/agent.js';
import { ProjectConfig } from '../../config/ProjectConfig.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite,
  CoverageReport,
  SecurityReview,
  QualityAnalysis,
  TestValidation,
  IndependentReviewReport,
  Review
} from '../types.js';
import {
  alexSecurityPrompt,
  alexQualityPrompt,
  alexTestValidationPrompt,
  alexReportPrompt
} from '../prompts/alex-prompts.js';

/**
 * Alex Agent Infrastructure
 *
 * Provides code reviewer agent capabilities for independent code review.
 */
export class AlexAgentInfrastructure {
  /** Agent Pool for lifecycle management */
  private readonly agentPool: AgentPool;

  /** Project configuration */
  private readonly projectConfig: ProjectConfig;

  /** Active agent instance (null when not active) */
  private agent: Agent | null = null;

  /**
   * Private constructor - use AlexAgentInfrastructure.create() instead
   */
  private constructor(
    agentPool: AgentPool,
    projectConfig: ProjectConfig
  ) {
    this.agentPool = agentPool;
    this.projectConfig = projectConfig;
  }

  /**
   * Create a new Alex agent infrastructure
   *
   * @param agentPool Agent pool for lifecycle management
   * @param projectConfig Project configuration
   * @returns Alex agent infrastructure
   */
  static async create(
    agentPool: AgentPool,
    projectConfig: ProjectConfig
  ): Promise<AlexAgentInfrastructure> {
    return new AlexAgentInfrastructure(agentPool, projectConfig);
  }

  /**
   * Review code for security vulnerabilities
   *
   * Performs thorough security analysis using OWASP Top 10 categories.
   * Identifies vulnerabilities with severity ratings and remediation advice.
   *
   * @param code Code implementation to review
   * @returns Security review with vulnerabilities and pass/fail
   * @throws Error if agent creation fails or review fails
   */
  async reviewSecurity(code: CodeImplementation): Promise<SecurityReview> {
    this.log('Starting security review', code.files.length);

    try {
      // Create minimal story context for security review
      const context: StoryContext = {
        story: {
          id: 'security-review',
          title: 'Security Review',
          description: 'Identify security vulnerabilities',
          acceptanceCriteria: ['No critical or high severity issues'],
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
          currentPhase: 'security-review'
        },
        taskDescription: 'Review code for security vulnerabilities'
      };

      // Create Alex agent via AgentPool
      this.agent = await this.agentPool.createAgent('alex', agentContext);
      this.log('Agent created', this.agent.id);

      // Build specialized prompt for security review
      const prompt = alexSecurityPrompt(context, code);

      // Invoke agent with prompt
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Security review complete', response.length);

      // Parse response into SecurityReview
      const review = this.parseSecurityReview(response);

      return review;
    } catch (error) {
      this.log('Security review failed', (error as Error).message);
      throw new Error(
        `Alex agent failed to review security: ${(error as Error).message}`
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
   * Analyze code quality metrics
   *
   * Evaluates complexity, maintainability, code smells, duplication, and naming.
   * Provides quality score (0-100) and specific recommendations.
   *
   * @param code Code implementation to analyze
   * @returns Quality analysis with metrics and recommendations
   * @throws Error if agent creation fails or analysis fails
   */
  async analyzeQuality(code: CodeImplementation): Promise<QualityAnalysis> {
    this.log('Starting quality analysis', code.files.length);

    try {
      // Create minimal story context for quality analysis
      const context: StoryContext = {
        story: {
          id: 'quality-analysis',
          title: 'Quality Analysis',
          description: 'Analyze code quality metrics',
          acceptanceCriteria: ['Quality score ≥75'],
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
          currentPhase: 'quality-analysis'
        },
        taskDescription: 'Analyze code quality'
      };

      // Create Alex agent
      this.agent = await this.agentPool.createAgent('alex', agentContext);
      this.log('Agent created for quality analysis', this.agent.id);

      // Build specialized prompt
      const prompt = alexQualityPrompt(context, code);

      // Invoke agent
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Quality analysis complete', response.length);

      // Parse response
      const analysis = this.parseQualityAnalysis(response);

      return analysis;
    } catch (error) {
      this.log('Quality analysis failed', (error as Error).message);
      throw new Error(
        `Alex agent failed to analyze quality: ${(error as Error).message}`
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
   * Validate test coverage and quality
   *
   * Ensures >80% coverage target is met and tests are comprehensive.
   * Checks for edge cases, error handling, and integration tests.
   *
   * @param tests Test suite to validate
   * @param coverage Coverage report
   * @returns Test validation with adequacy check and missing tests
   * @throws Error if agent creation fails or validation fails
   */
  async validateTests(
    tests: TestSuite,
    coverage: CoverageReport
  ): Promise<TestValidation> {
    this.log('Starting test validation', tests.testCount);

    try {
      // Create agent context
      const agentContext: AgentContext = {
        onboardingDocs: [],
        workflowState: {
          currentPhase: 'test-validation'
        },
        taskDescription: 'Validate test coverage and quality'
      };

      // Create Alex agent
      this.agent = await this.agentPool.createAgent('alex', agentContext);
      this.log('Agent created for test validation', this.agent.id);

      // Build specialized prompt
      const prompt = alexTestValidationPrompt(tests, coverage);

      // Invoke agent
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Test validation complete', response.length);

      // Parse response
      const validation = this.parseTestValidation(response);

      return validation;
    } catch (error) {
      this.log('Test validation failed', (error as Error).message);
      throw new Error(
        `Alex agent failed to validate tests: ${(error as Error).message}`
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
   * Generate comprehensive review report
   *
   * Aggregates security, quality, and test reviews into final decision.
   * Decision: pass (merge ready), fail (blockers), or escalate (human review needed).
   *
   * @param reviews Array of completed reviews (security, quality, test)
   * @returns Independent review report with decision and recommendations
   * @throws Error if agent creation fails or report generation fails
   */
  async generateReport(reviews: Review[]): Promise<IndependentReviewReport> {
    this.log('Generating review report', reviews.length);

    try {
      // Create agent context
      const agentContext: AgentContext = {
        onboardingDocs: [],
        workflowState: {
          currentPhase: 'report-generation'
        },
        taskDescription: 'Generate comprehensive review report'
      };

      // Create Alex agent
      this.agent = await this.agentPool.createAgent('alex', agentContext);
      this.log('Agent created for report generation', this.agent.id);

      // Build specialized prompt
      const prompt = alexReportPrompt(reviews);

      // Invoke agent
      const response = await this.agentPool.invokeAgent(this.agent.id, prompt);
      this.log('Report generation complete', response.length);

      // Parse response
      const report = this.parseIndependentReviewReport(response);

      return report;
    } catch (error) {
      this.log('Report generation failed', (error as Error).message);
      throw new Error(
        `Alex agent failed to generate report: ${(error as Error).message}`
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
   * Parse LLM response into SecurityReview
   *
   * @param response LLM response text
   * @returns Parsed SecurityReview
   * @throws Error if parsing fails
   */
  private parseSecurityReview(response: string): SecurityReview {
    try {
      const parsed = JSON.parse(response);
      return {
        vulnerabilities: parsed.vulnerabilities || [],
        score: parsed.score || 100,
        passed: parsed.passed !== false
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          vulnerabilities: parsed.vulnerabilities || [],
          score: parsed.score || 100,
          passed: parsed.passed !== false
        };
      }

      throw new Error(
        'Failed to parse LLM response into SecurityReview. Expected JSON format.'
      );
    }
  }

  /**
   * Parse LLM response into QualityAnalysis
   *
   * @param response LLM response text
   * @returns Parsed QualityAnalysis
   * @throws Error if parsing fails
   */
  private parseQualityAnalysis(response: string): QualityAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        complexityScore: parsed.complexityScore || 0,
        maintainabilityIndex: parsed.maintainabilityIndex || 0,
        codeSmells: parsed.codeSmells || [],
        duplicationPercentage: parsed.duplicationPercentage || 0,
        namingConventionViolations: parsed.namingConventionViolations || [],
        score: parsed.score || 0
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          complexityScore: parsed.complexityScore || 0,
          maintainabilityIndex: parsed.maintainabilityIndex || 0,
          codeSmells: parsed.codeSmells || [],
          duplicationPercentage: parsed.duplicationPercentage || 0,
          namingConventionViolations: parsed.namingConventionViolations || [],
          score: parsed.score || 0
        };
      }

      throw new Error(
        'Failed to parse LLM response into QualityAnalysis. Expected JSON format.'
      );
    }
  }

  /**
   * Parse LLM response into TestValidation
   *
   * @param response LLM response text
   * @returns Parsed TestValidation
   * @throws Error if parsing fails
   */
  private parseTestValidation(response: string): TestValidation {
    try {
      const parsed = JSON.parse(response);
      return {
        coverageAdequate: parsed.coverageAdequate !== false,
        testQuality: parsed.testQuality || {
          edgeCasesCovered: false,
          errorHandlingTested: false,
          integrationTestsPresent: false
        },
        missingTests: parsed.missingTests || [],
        score: parsed.score || 0
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          coverageAdequate: parsed.coverageAdequate !== false,
          testQuality: parsed.testQuality || {
            edgeCasesCovered: false,
            errorHandlingTested: false,
            integrationTestsPresent: false
          },
          missingTests: parsed.missingTests || [],
          score: parsed.score || 0
        };
      }

      throw new Error(
        'Failed to parse LLM response into TestValidation. Expected JSON format.'
      );
    }
  }

  /**
   * Parse LLM response into IndependentReviewReport
   *
   * @param response LLM response text
   * @returns Parsed IndependentReviewReport
   * @throws Error if parsing fails
   */
  private parseIndependentReviewReport(response: string): IndependentReviewReport {
    try {
      const parsed = JSON.parse(response);
      return {
        securityReview: parsed.securityReview || {
          vulnerabilities: [],
          score: 100,
          passed: true
        },
        qualityAnalysis: parsed.qualityAnalysis || {
          complexityScore: 0,
          maintainabilityIndex: 0,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 0
        },
        testValidation: parsed.testValidation || {
          coverageAdequate: false,
          testQuality: {
            edgeCasesCovered: false,
            errorHandlingTested: false,
            integrationTestsPresent: false
          },
          missingTests: [],
          score: 0
        },
        architectureCompliance: parsed.architectureCompliance || {
          compliant: true,
          violations: []
        },
        overallScore: parsed.overallScore || 0,
        confidence: parsed.confidence || 0.5,
        decision: parsed.decision || 'escalate',
        findings: parsed.findings || [],
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          securityReview: parsed.securityReview || {
            vulnerabilities: [],
            score: 100,
            passed: true
          },
          qualityAnalysis: parsed.qualityAnalysis || {
            complexityScore: 0,
            maintainabilityIndex: 0,
            codeSmells: [],
            duplicationPercentage: 0,
            namingConventionViolations: [],
            score: 0
          },
          testValidation: parsed.testValidation || {
            coverageAdequate: false,
            testQuality: {
              edgeCasesCovered: false,
              errorHandlingTested: false,
              integrationTestsPresent: false
            },
            missingTests: [],
            score: 0
          },
          architectureCompliance: parsed.architectureCompliance || {
            compliant: true,
            violations: []
          },
          overallScore: parsed.overallScore || 0,
          confidence: parsed.confidence || 0.5,
          decision: parsed.decision || 'escalate',
          findings: parsed.findings || [],
          recommendations: parsed.recommendations || []
        };
      }

      throw new Error(
        'Failed to parse LLM response into IndependentReviewReport. Expected JSON format.'
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
    console.log(`[AlexAgent] ${message}${detailStr}`);
  }
}
