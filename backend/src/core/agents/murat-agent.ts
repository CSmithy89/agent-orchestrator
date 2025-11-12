/**
 * MuratAgent - Test Architect Persona
 *
 * Murat specializes in test strategy, test automation frameworks, test pyramid optimization,
 * CI/CD pipeline design, quality gates, and ATDD methodology.
 * Uses DecisionEngine for confidence-based decisions and collaborates with Winston for
 * architecture + test strategy alignment.
 *
 * Features:
 * - Multi-provider LLM support (GPT-4 Turbo recommended)
 * - Confidence-based autonomous decision making
 * - Automatic escalation when confidence < 0.75
 * - Winston agent integration for architecture alignment
 * - Test pyramid optimization and framework recommendations
 * - Quality gates and ATDD approach definition
 *
 * @example
 * ```typescript
 * const murat = await MuratAgent.create(
 *   { provider: 'openai', model: 'gpt-4-turbo', temperature: 0.4 },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 *
 * const testStrategy = await murat.defineTestStrategy(architectureDraft, requirements);
 * console.log(testStrategy); // Comprehensive test strategy
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { LLMFactory } from '../../llm/LLMFactory.js';
import { LLMClient } from '../../llm/LLMClient.interface.js';
import { LLMConfig, InvokeOptions } from '../../types/llm.types.js';
import { DecisionEngine, Decision } from '../services/decision-engine.js';
import { EscalationQueue } from '../services/escalation-queue.js';
import {
  TestStrategy,
  FrameworkRecommendation,
  TestPyramid,
  PipelineSpecification,
  QualityGate,
  ATDDApproach,
  ArchitectureAnalysis,
  ValidationResult
} from '../../types/agent-types.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Murat's persona structure parsed from markdown
 */
interface MuratPersona {
  /** System prompt (Murat's personality and approach) */
  systemPrompt: string;

  /** Specialized prompts for specific methods */
  specializedPrompts: {
    testStrategy: string;
    frameworkRecommendations: string;
    testPyramid: string;
    cicdPipeline: string;
    qualityGates: string;
    atddApproach: string;
    confidenceAssessment: string;
  };
}

/**
 * Decision metadata for audit trail
 */
interface DecisionRecord {
  method: string;
  question: string;
  decision: Decision;
  timestamp: Date;
}

/**
 * MuratAgent - Test Architect persona agent
 *
 * Provides intelligent test architecture design with automatic escalation when uncertain
 * and Winston integration for architecture + test strategy alignment.
 */
export class MuratAgent {
  /** Default path to Murat's persona file */
  private static readonly DEFAULT_PERSONA_PATH = '../../../../bmad/bmm/agents/murat.md';

  /** Escalation threshold (from DecisionEngine) */
  // private static readonly ESCALATION_THRESHOLD = 0.75; // TODO: Story 3-2-followup - Implement automatic escalation workflow

  /** Temperature for test architecture reasoning */
  private static readonly REASONING_TEMPERATURE = 0.4;

  /** LLM client for Murat's reasoning */
  private readonly llmClient: LLMClient;

  /** Murat's persona (system prompt + specialized prompts) */
  private readonly persona: MuratPersona;

  /** LLM configuration */
  private readonly llmConfig: LLMConfig;

  /** Temperature for LLM invocations */
  private readonly temperature: number;

  /** Decision engine for confidence-based decisions */
  private readonly decisionEngine?: DecisionEngine;

  /** Escalation queue for human intervention */
  // @ts-expect-error - Reserved for automatic escalation in Story 3-2-followup
  private readonly escalationQueue?: EscalationQueue;

  /** Current workflow context */
  // @ts-expect-error - Reserved for automatic escalation in Story 3-2-followup
  private workflowId: string = 'murat-session';
  // @ts-expect-error - Reserved for automatic escalation in Story 3-2-followup
  private currentStep: number = 0;

  /** Decision audit trail */
  private readonly decisions: DecisionRecord[] = [];

  /**
   * Private constructor - use MuratAgent.create() instead
   */
  private constructor(
    llmClient: LLMClient,
    persona: MuratPersona,
    llmConfig: LLMConfig,
    temperature: number,
    decisionEngine?: DecisionEngine,
    escalationQueue?: EscalationQueue
  ) {
    this.llmClient = llmClient;
    this.persona = persona;
    this.llmConfig = llmConfig;
    this.temperature = temperature;
    this.decisionEngine = decisionEngine;
    this.escalationQueue = escalationQueue;
  }

  /**
   * Create a new MuratAgent instance
   *
   * @param llmConfig - LLM configuration (provider, model, temperature)
   * @param llmFactory - LLM factory for creating clients
   * @param decisionEngine - Optional decision engine for confidence scoring
   * @param escalationQueue - Optional escalation queue for human intervention
   * @param personaPath - Optional custom path to persona file
   * @returns MuratAgent instance
   */
  static async create(
    llmConfig: LLMConfig,
    llmFactory: LLMFactory,
    decisionEngine?: DecisionEngine,
    escalationQueue?: EscalationQueue,
    personaPath?: string
  ): Promise<MuratAgent> {
    // Validate LLM config
    if (!llmConfig.provider || !llmConfig.model) {
      throw new Error(
        'Invalid LLM config: provider and model are required'
      );
    }

    // Set temperature to 0.4 for balanced creativity in test scenarios
    const temperature = MuratAgent.REASONING_TEMPERATURE;

    // Load persona from file
    const persona = await MuratAgent.loadPersona(personaPath);

    // Create LLM client
    const llmClient = await llmFactory.createClient(llmConfig);

    return new MuratAgent(
      llmClient,
      persona,
      llmConfig,
      temperature,
      decisionEngine,
      escalationQueue
    );
  }

  /**
   * Load Murat's persona from markdown file
   *
   * @param personaPath - Optional custom path to persona file
   * @returns Parsed persona with system prompt and specialized prompts
   */
  private static async loadPersona(personaPath?: string): Promise<MuratPersona> {
    // Resolve persona file path
    const resolvedPath = personaPath
      ? path.resolve(personaPath)
      : path.resolve(__dirname, MuratAgent.DEFAULT_PERSONA_PATH);

    try {
      const personaContent = await fs.readFile(resolvedPath, 'utf-8');
      return MuratAgent.parsePersona(personaContent);
    } catch (error) {
      throw new Error(
        `Failed to load Murat persona file at ${resolvedPath}: ${(error as Error).message}. ` +
        'Ensure bmad/bmm/agents/murat.md exists.'
      );
    }
  }

  /**
   * Parse persona markdown into structured format
   *
   * @param content - Markdown content of persona file
   * @returns Parsed persona structure
   */
  private static parsePersona(content: string): MuratPersona {
    // Extract system prompt (everything between "## System Prompt" and next "##")
    const systemPromptMatch = content.match(
      /## System Prompt\s+([\s\S]*?)(?=\n##|$)/
    );
    const systemPrompt = systemPromptMatch?.[1]?.trim() ?? 'You are Murat, an expert Test Architect.';

    // Extract specialized prompts
    const testStrategyMatch = content.match(
      /### Test Strategy Definition\s+([\s\S]*?)(?=\n###|$)/
    );
    const frameworkRecommendationsMatch = content.match(
      /### Framework Recommendations\s+([\s\S]*?)(?=\n###|$)/
    );
    const testPyramidMatch = content.match(
      /### Test Pyramid Definition\s+([\s\S]*?)(?=\n###|$)/
    );
    const cicdPipelineMatch = content.match(
      /### CI\/CD Pipeline Design\s+([\s\S]*?)(?=\n###|$)/
    );
    const qualityGatesMatch = content.match(
      /### Quality Gates Definition\s+([\s\S]*?)(?=\n###|$)/
    );
    const atddApproachMatch = content.match(
      /### ATDD Approach Specification\s+([\s\S]*?)(?=\n###|$)/
    );
    const confidenceAssessmentMatch = content.match(
      /### Confidence Assessment for Test Decisions\s+([\s\S]*?)(?=\n###|$)/
    );

    return {
      systemPrompt,
      specializedPrompts: {
        testStrategy: testStrategyMatch?.[1]?.trim() ?? 'Define comprehensive test strategy.',
        frameworkRecommendations: frameworkRecommendationsMatch?.[1]?.trim() ?? 'Recommend test frameworks.',
        testPyramid: testPyramidMatch?.[1]?.trim() ?? 'Define test pyramid distribution.',
        cicdPipeline: cicdPipelineMatch?.[1]?.trim() ?? 'Design CI/CD pipeline.',
        qualityGates: qualityGatesMatch?.[1]?.trim() ?? 'Define quality gates.',
        atddApproach: atddApproachMatch?.[1]?.trim() ?? 'Specify ATDD approach.',
        confidenceAssessment: confidenceAssessmentMatch?.[1]?.trim() ?? 'Assess confidence for test decisions.'
      }
    };
  }

  /**
   * Define comprehensive test strategy
   *
   * Analyzes architecture and requirements to generate test strategy including
   * testing philosophy, risk prioritization, framework recommendations, test pyramid,
   * CI/CD pipeline, quality gates, and ATDD approach.
   *
   * @param architecture - Architecture document content (from Winston)
   * @param requirements - PRD requirements list
   * @returns Test strategy
   * @throws Error if architecture or requirements are empty
   */
  async defineTestStrategy(architecture: string, requirements: string[]): Promise<TestStrategy> {
    // Validate input
    if (!architecture || architecture.trim().length === 0) {
      throw new Error('Cannot define test strategy from empty architecture document.');
    }
    if (!requirements || requirements.length === 0) {
      throw new Error('Cannot define test strategy from empty requirements list.');
    }

    // Log invocation
    this.logInvocation('defineTestStrategy', architecture.length + requirements.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.testStrategy,
      {
        architecture,
        requirements: requirements.join('\n- ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into TestStrategy
    const testStrategy = this.parseTestStrategy(response);

    // Log result
    this.logResult('defineTestStrategy', Object.keys(testStrategy).length);

    return testStrategy;
  }

  /**
   * Recommend test frameworks based on tech stack
   *
   * Evaluates test frameworks for unit, integration, E2E, mocking, and coverage
   * with clear rationale and alternatives considered.
   *
   * @param techStack - Tech stack from architecture (e.g., ['TypeScript', 'Node.js', 'PostgreSQL'])
   * @returns Framework recommendations
   * @throws Error if tech stack is empty
   */
  async recommendFrameworks(techStack: string[]): Promise<FrameworkRecommendation[]> {
    // Validate input
    if (!techStack || techStack.length === 0) {
      throw new Error('Cannot recommend frameworks from empty tech stack.');
    }

    // Log invocation
    this.logInvocation('recommendFrameworks', techStack.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.frameworkRecommendations,
      {
        techStack: techStack.join(', ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into FrameworkRecommendation array
    const frameworks = this.parseFrameworkRecommendations(response);

    // Log result
    this.logResult('recommendFrameworks', frameworks.length);

    return frameworks;
  }

  /**
   * Define test pyramid distribution
   *
   * Specifies optimal unit/integration/E2E test ratios with clear rationale
   * based on project type and complexity.
   *
   * @param projectType - Project type (e.g., 'backend-api', 'full-stack', 'spa')
   * @returns Test pyramid specification
   * @throws Error if project type is empty
   */
  async defineTestPyramid(projectType: string): Promise<TestPyramid> {
    // Validate input
    if (!projectType || projectType.trim().length === 0) {
      throw new Error('Cannot define test pyramid from empty project type.');
    }

    // Log invocation
    this.logInvocation('defineTestPyramid', projectType.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.testPyramid,
      {
        projectType
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into TestPyramid
    const pyramid = this.parseTestPyramid(response);

    // Log result
    this.logResult('defineTestPyramid', pyramid.unitPercentage + pyramid.integrationPercentage + pyramid.e2ePercentage);

    return pyramid;
  }

  /**
   * Design CI/CD pipeline with test automation
   *
   * Specifies pipeline stages, quality gates, test execution order, and
   * deployment triggers.
   *
   * @param projectType - Project type
   * @param testStrategy - Test strategy (from defineTestStrategy)
   * @returns CI/CD pipeline specification
   * @throws Error if inputs are invalid
   */
  async designPipeline(projectType: string, testStrategy: TestStrategy): Promise<PipelineSpecification> {
    // Validate input
    if (!projectType || projectType.trim().length === 0) {
      throw new Error('Cannot design pipeline from empty project type.');
    }
    if (!testStrategy) {
      throw new Error('Cannot design pipeline without test strategy.');
    }

    // Log invocation
    this.logInvocation('designPipeline', projectType.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.cicdPipeline,
      {
        projectType,
        testStrategy: JSON.stringify(testStrategy, null, 2)
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into PipelineSpecification
    const pipeline = this.parsePipelineSpecification(response);

    // Log result
    this.logResult('designPipeline', pipeline.stages.length);

    return pipeline;
  }

  /**
   * Define quality gates
   *
   * Specifies measurable quality thresholds for coverage, tests, security,
   * and performance based on project complexity level.
   *
   * @param projectLevel - Project complexity level (0-4)
   * @returns Quality gates
   * @throws Error if project level is invalid
   */
  async defineQualityGates(projectLevel: number): Promise<QualityGate[]> {
    // Validate input
    if (projectLevel < 0 || projectLevel > 4) {
      throw new Error('Project level must be between 0 and 4.');
    }

    // Log invocation
    this.logInvocation('defineQualityGates', projectLevel);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.qualityGates,
      {
        projectLevel: projectLevel.toString()
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into QualityGate array
    const gates = this.parseQualityGates(response);

    // Log result
    this.logResult('defineQualityGates', gates.length);

    return gates;
  }

  /**
   * Specify ATDD approach
   *
   * Defines Acceptance Test-Driven Development approach with BDD framework,
   * acceptance criteria format, test organization, and living documentation.
   *
   * @param acceptanceCriteria - Acceptance criteria from stories
   * @returns ATDD approach specification
   * @throws Error if acceptance criteria are empty
   */
  async specifyATDD(acceptanceCriteria: string[]): Promise<ATDDApproach> {
    // Validate input
    if (!acceptanceCriteria || acceptanceCriteria.length === 0) {
      throw new Error('Cannot specify ATDD from empty acceptance criteria.');
    }

    // Log invocation
    this.logInvocation('specifyATDD', acceptanceCriteria.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.atddApproach,
      {
        acceptanceCriteria: acceptanceCriteria.join('\n- ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into ATDDApproach
    const atdd = this.parseATDDApproach(response);

    // Log result
    this.logResult('specifyATDD', atdd.workflow.length);

    return atdd;
  }

  /**
   * Assess confidence for test architecture decision
   *
   * Evaluates confidence based on framework maturity, architecture fit,
   * requirement clarity, and team experience.
   *
   * @param decision - Decision question or statement
   * @param context - Decision context
   * @returns Confidence score (0.0-1.0)
   */
  async assessConfidence(decision: string, context: string): Promise<number> {
    // Use DecisionEngine if available
    if (this.decisionEngine) {
      const decisionResult = await this.makeDecision(
        decision,
        { context },
        'assessConfidence'
      );
      return decisionResult.confidence;
    }

    // Fallback: Use LLM to assess confidence
    this.logInvocation('assessConfidence', decision.length);

    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.confidenceAssessment,
      {
        decision,
        context
      }
    );

    const response = await this.invokeLLMWithRetry(prompt);
    const confidence = this.parseConfidenceScore(response);

    this.logResult('assessConfidence', confidence);

    return confidence;
  }

  /**
   * Analyze Winston's architecture for test infrastructure needs
   *
   * Extracts tech stack, identifies testability concerns, and flags components
   * requiring test infrastructure.
   *
   * @param architectureDraft - Winston's architecture document
   * @returns Architecture analysis
   * @throws Error if architecture draft is empty
   */
  async analyzeArchitecture(architectureDraft: string): Promise<ArchitectureAnalysis> {
    // Validate input
    if (!architectureDraft || architectureDraft.trim().length === 0) {
      throw new Error('Cannot analyze empty architecture draft.');
    }

    // Log invocation
    this.logInvocation('analyzeArchitecture', architectureDraft.length);

    // Build prompt for architecture analysis
    const prompt = this.buildPrompt(
      'Analyze the following architecture document and extract:\n' +
      '1. Tech stack (languages, frameworks, databases)\n' +
      '2. Testability concerns (hard-to-test components, tight coupling)\n' +
      '3. Components requiring test infrastructure (mock servers, test databases)\n' +
      '4. Data layer testing needs (database schema, API contracts)\n\n' +
      'Return results as JSON with keys: techStack, testabilityConcerns, componentsRequiringTestInfra, dataLayerTestingNeeds, summary',
      {
        architecture: architectureDraft
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into ArchitectureAnalysis
    const analysis = this.parseArchitectureAnalysis(response);

    // Log result
    this.logResult('analyzeArchitecture', analysis.techStack.length);

    return analysis;
  }

  /**
   * Validate test framework compatibility with tech stack
   *
   * Checks if recommended frameworks work with Winston's tech stack and
   * flags incompatibilities.
   *
   * @param techStack - Tech stack from Winston's architecture
   * @param frameworks - Framework names to validate
   * @returns Validation result
   * @throws Error if inputs are empty
   */
  async validateTestCompatibility(techStack: string[], frameworks: string[]): Promise<ValidationResult> {
    // Validate input
    if (!techStack || techStack.length === 0) {
      throw new Error('Cannot validate compatibility with empty tech stack.');
    }
    if (!frameworks || frameworks.length === 0) {
      throw new Error('Cannot validate compatibility with empty frameworks list.');
    }

    // Log invocation
    this.logInvocation('validateTestCompatibility', techStack.length + frameworks.length);

    // Build prompt for compatibility validation
    const prompt = this.buildPrompt(
      'Validate test framework compatibility with the given tech stack.\n' +
      'Identify incompatibilities (e.g., Jest with Deno, Mocha with Bun).\n' +
      'Return results as JSON with keys: valid, incompatibilities (array of {framework, techStack, issue, recommendation}), warnings, compatibilityScore (0.0-1.0)',
      {
        techStack: techStack.join(', '),
        frameworks: frameworks.join(', ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into ValidationResult
    const validation = this.parseValidationResult(response);

    // Log result
    this.logResult('validateTestCompatibility', validation.compatibilityScore);

    return validation;
  }

  /**
   * Make a decision using DecisionEngine
   *
   * Wraps DecisionEngine.attemptAutonomousDecision for confidence scoring.
   * Tracks all decisions in audit trail.
   *
   * @param question - Question requiring decision
   * @param context - Context for decision
   * @param method - Method name making the decision
   * @returns Decision with confidence score
   */
  private async makeDecision(
    question: string,
    context: Record<string, unknown>,
    method: string
  ): Promise<Decision> {
    if (!this.decisionEngine) {
      throw new Error('DecisionEngine not available for confidence scoring');
    }

    const decision = await this.decisionEngine.attemptAutonomousDecision(
      question,
      context
    );

    // Track in audit trail
    this.decisions.push({
      method,
      question,
      decision,
      timestamp: new Date()
    });

    return decision;
  }

  /**
   * Build prompt by combining system prompt, specialized prompt, and context
   *
   * @param specializedPrompt - Method-specific prompt
   * @param context - Context variables to inject
   * @returns Complete prompt for LLM
   */
  private buildPrompt(
    specializedPrompt: string,
    context: Record<string, unknown>
  ): string {
    let prompt = `${this.persona.systemPrompt}\n\n${specializedPrompt}\n\n`;

    // Inject context variables
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        prompt += `**${key}**:\n${value}\n\n`;
      }
    }

    return prompt;
  }

  /**
   * Invoke LLM with retry logic
   *
   * Handles transient failures with exponential backoff.
   *
   * @param prompt - Prompt for LLM
   * @param maxRetries - Maximum retry attempts
   * @returns LLM response text
   */
  private async invokeLLMWithRetry(
    prompt: string,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const options: InvokeOptions = {
          temperature: this.temperature
        };

        return await this.llmClient.invoke(prompt, options);
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 2^attempt seconds
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(
      `LLM invocation failed after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Parse test strategy from LLM response
   *
   * @param response - LLM response text
   * @returns Test strategy
   */
  private parseTestStrategy(response: string): TestStrategy {
    try {
      const parsed = JSON.parse(response);
      return parsed as TestStrategy;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as TestStrategy;
      }

      throw new Error(
        'Failed to parse LLM response into TestStrategy. Expected JSON format.'
      );
    }
  }

  /**
   * Parse framework recommendations from LLM response
   *
   * @param response - LLM response text
   * @returns Framework recommendations
   */
  private parseFrameworkRecommendations(response: string): FrameworkRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Expected array of FrameworkRecommendation');
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }

      throw new Error(
        'Failed to parse LLM response into FrameworkRecommendation array. Expected JSON array.'
      );
    }
  }

  /**
   * Parse test pyramid from LLM response
   *
   * @param response - LLM response text
   * @returns Test pyramid
   */
  private parseTestPyramid(response: string): TestPyramid {
    try {
      const parsed = JSON.parse(response);
      return parsed as TestPyramid;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as TestPyramid;
      }

      throw new Error(
        'Failed to parse LLM response into TestPyramid. Expected JSON format.'
      );
    }
  }

  /**
   * Parse pipeline specification from LLM response
   *
   * @param response - LLM response text
   * @returns Pipeline specification
   */
  private parsePipelineSpecification(response: string): PipelineSpecification {
    try {
      const parsed = JSON.parse(response);
      return parsed as PipelineSpecification;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as PipelineSpecification;
      }

      throw new Error(
        'Failed to parse LLM response into PipelineSpecification. Expected JSON format.'
      );
    }
  }

  /**
   * Parse quality gates from LLM response
   *
   * @param response - LLM response text
   * @returns Quality gates
   */
  private parseQualityGates(response: string): QualityGate[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Expected array of QualityGate');
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }

      throw new Error(
        'Failed to parse LLM response into QualityGate array. Expected JSON array.'
      );
    }
  }

  /**
   * Parse ATDD approach from LLM response
   *
   * @param response - LLM response text
   * @returns ATDD approach
   */
  private parseATDDApproach(response: string): ATDDApproach {
    try {
      const parsed = JSON.parse(response);
      return parsed as ATDDApproach;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as ATDDApproach;
      }

      throw new Error(
        'Failed to parse LLM response into ATDDApproach. Expected JSON format.'
      );
    }
  }

  /**
   * Parse architecture analysis from LLM response
   *
   * @param response - LLM response text
   * @returns Architecture analysis
   */
  private parseArchitectureAnalysis(response: string): ArchitectureAnalysis {
    try {
      const parsed = JSON.parse(response);
      return parsed as ArchitectureAnalysis;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as ArchitectureAnalysis;
      }

      throw new Error(
        'Failed to parse LLM response into ArchitectureAnalysis. Expected JSON format.'
      );
    }
  }

  /**
   * Parse validation result from LLM response
   *
   * @param response - LLM response text
   * @returns Validation result
   */
  private parseValidationResult(response: string): ValidationResult {
    try {
      const parsed = JSON.parse(response);
      return parsed as ValidationResult;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as ValidationResult;
      }

      throw new Error(
        'Failed to parse LLM response into ValidationResult. Expected JSON format.'
      );
    }
  }

  /**
   * Parse confidence score from LLM response
   *
   * @param response - LLM response text
   * @returns Confidence score (0.0-1.0)
   */
  private parseConfidenceScore(response: string): number {
    // Try to extract confidence score from response
    const scoreMatch = response.match(/confidence[:\s]+(\d+\.?\d*)/i);
    if (scoreMatch?.[1]) {
      const score = parseFloat(scoreMatch[1]);
      // If score is percentage (0-100), convert to 0-1
      return score > 1 ? score / 100 : score;
    }

    // Fallback: default to medium confidence
    return 0.7;
  }

  /**
   * Log method invocation
   *
   * @param method - Method name
   * @param inputSize - Input size (characters or item count)
   */
  private logInvocation(method: string, inputSize: number): void {
    console.log(
      `[MuratAgent] ${method}(inputSize: ${inputSize}) -> processing...`
    );
  }

  /**
   * Log method result
   *
   * @param method - Method name
   * @param resultSize - Result size (item count or confidence score)
   */
  private logResult(method: string, resultSize: number): void {
    console.log(
      `[MuratAgent] ${method}(...) -> result: ${resultSize}`
    );
  }

  /**
   * Get decision audit trail
   *
   * Returns all decisions made by Murat during session.
   *
   * @returns Array of decision records
   */
  getDecisionAuditTrail(): DecisionRecord[] {
    return [...this.decisions];
  }

  /**
   * Set workflow context
   *
   * Used for escalation tracking.
   *
   * @param workflowId - Workflow ID
   * @param step - Current step number
   */
  setWorkflowContext(workflowId: string, step: number): void {
    this.workflowId = workflowId;
    this.currentStep = step;
  }

  /**
   * Get LLM configuration
   *
   * @returns LLM configuration
   */
  getLLMConfig(): LLMConfig {
    return this.llmConfig;
  }
}
