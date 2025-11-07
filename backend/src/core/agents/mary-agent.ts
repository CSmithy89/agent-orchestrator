/**
 * MaryAgent - Business Analyst Persona
 *
 * Mary specializes in requirements extraction, user story writing, and scope negotiation.
 * Uses DecisionEngine for confidence-based decisions and EscalationQueue for human input.
 *
 * Features:
 * - Multi-provider LLM support (Anthropic, OpenAI, Zhipu, Google)
 * - Confidence-based autonomous decision making
 * - Automatic escalation when confidence < 0.75
 * - Structured requirements documentation
 * - Measurable success criteria (Given-When-Then format)
 * - MVP scope negotiation using 80/20 rule
 *
 * @example
 * ```typescript
 * const mary = await MaryAgent.create(
 *   { provider: 'anthropic', model: 'claude-sonnet-4-5', temperature: 0.3 },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 *
 * const analysis = await mary.analyzeRequirements(
 *   'Build a user authentication system',
 *   'SaaS platform for small businesses'
 * );
 * console.log(analysis.requirements); // Structured requirements
 * console.log(analysis.successCriteria); // Measurable criteria
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

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Result from requirements analysis
 */
export interface AnalysisResult {
  /** Structured functional requirements */
  requirements: string[];

  /** Measurable success criteria (Given-When-Then format) */
  successCriteria: string[];

  /** Implicit assumptions identified */
  assumptions: string[];

  /** Questions needing clarification */
  clarifications: string[];
}

/**
 * Result from scope negotiation
 */
export interface ScopeResult {
  /** Minimum viable product features (80% of value from 20% of features) */
  mvpScope: string[];

  /** Post-MVP enhancement features */
  growthFeatures: string[];

  /** Reasoning for MVP boundary decision */
  rationale: string;
}

/**
 * Mary's persona structure parsed from markdown
 */
interface MaryPersona {
  /** System prompt (Mary's personality and approach) */
  systemPrompt: string;

  /** Specialized prompts for specific methods */
  specializedPrompts: {
    requirementsExtraction: string;
    successCriteriaDefinition: string;
    scopeNegotiation: string;
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
 * MaryAgent - Business Analyst persona agent
 *
 * Provides intelligent requirements analysis with automatic escalation when uncertain.
 */
export class MaryAgent {
  /** Default path to Mary's persona file */
  private static readonly DEFAULT_PERSONA_PATH = '../../../../bmad/bmm/agents/mary.md';

  /** Escalation threshold (from DecisionEngine) */
  private static readonly ESCALATION_THRESHOLD = 0.75;

  /** Temperature for analytical reasoning */
  private static readonly REASONING_TEMPERATURE = 0.3;

  /** LLM client for Mary's reasoning */
  private readonly llmClient: LLMClient;

  /** Mary's persona (system prompt + specialized prompts) */
  private readonly persona: MaryPersona;

  /** LLM configuration */
  private readonly llmConfig: LLMConfig;

  /** Temperature for LLM invocations */
  private readonly temperature: number;

  /** Decision engine for confidence-based decisions */
  private readonly decisionEngine?: DecisionEngine;

  /** Escalation queue for human intervention */
  private readonly escalationQueue?: EscalationQueue;

  /** Current workflow context */
  private workflowId: string = 'mary-session';
  private currentStep: number = 0;

  /** Decision audit trail */
  private readonly decisions: DecisionRecord[] = [];

  /**
   * Private constructor - use MaryAgent.create() instead
   */
  private constructor(
    llmClient: LLMClient,
    persona: MaryPersona,
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
   * Create a new MaryAgent instance
   *
   * @param llmConfig - LLM configuration (provider, model, temperature)
   * @param llmFactory - LLM factory for creating clients
   * @param decisionEngine - Optional decision engine for confidence scoring
   * @param escalationQueue - Optional escalation queue for human intervention
   * @param personaPath - Optional custom path to persona file
   * @returns MaryAgent instance
   */
  static async create(
    llmConfig: LLMConfig,
    llmFactory: LLMFactory,
    decisionEngine?: DecisionEngine,
    escalationQueue?: EscalationQueue,
    personaPath?: string
  ): Promise<MaryAgent> {
    // Validate LLM config
    if (!llmConfig.provider || !llmConfig.model) {
      throw new Error(
        'Invalid LLM config: provider and model are required'
      );
    }

    // Set temperature to 0.3 for analytical reasoning
    const temperature = MaryAgent.REASONING_TEMPERATURE;

    // Load persona from file
    const persona = await MaryAgent.loadPersona(personaPath);

    // Create LLM client
    const llmClient = await llmFactory.createClient(llmConfig);

    return new MaryAgent(
      llmClient,
      persona,
      llmConfig,
      temperature,
      decisionEngine,
      escalationQueue
    );
  }

  /**
   * Load Mary's persona from markdown file
   *
   * @param personaPath - Optional custom path to persona file
   * @returns Parsed persona with system prompt and specialized prompts
   */
  private static async loadPersona(personaPath?: string): Promise<MaryPersona> {
    // Resolve persona file path
    const resolvedPath = personaPath
      ? path.resolve(personaPath)
      : path.resolve(__dirname, MaryAgent.DEFAULT_PERSONA_PATH);

    try {
      const personaContent = await fs.readFile(resolvedPath, 'utf-8');
      return MaryAgent.parsePersona(personaContent);
    } catch (error) {
      throw new Error(
        `Failed to load Mary persona file at ${resolvedPath}: ${(error as Error).message}. ` +
        'Ensure bmad/bmm/agents/mary.md exists.'
      );
    }
  }

  /**
   * Parse persona markdown into structured format
   *
   * @param content - Markdown content of persona file
   * @returns Parsed persona structure
   */
  private static parsePersona(content: string): MaryPersona {
    // Extract system prompt (everything between "## System Prompt" and next "##")
    const systemPromptMatch = content.match(
      /## System Prompt\s+([\s\S]*?)(?=\n##|$)/
    );
    const systemPrompt = systemPromptMatch?.[1]?.trim() ?? 'You are Mary, an expert Business Analyst.';

    // Extract specialized prompts
    const requirementsMatch = content.match(
      /### Requirements Extraction\s+([\s\S]*?)(?=\n###|$)/
    );
    const successCriteriaMatch = content.match(
      /### Success Criteria Definition\s+([\s\S]*?)(?=\n###|$)/
    );
    const scopeNegotiationMatch = content.match(
      /### Scope Negotiation\s+([\s\S]*?)(?=\n###|$)/
    );

    return {
      systemPrompt,
      specializedPrompts: {
        requirementsExtraction: requirementsMatch?.[1]?.trim() ?? 'Extract requirements from user input.',
        successCriteriaDefinition: successCriteriaMatch?.[1]?.trim() ?? 'Define success criteria for features.',
        scopeNegotiation: scopeNegotiationMatch?.[1]?.trim() ?? 'Negotiate scope into MVP and growth features.'
      }
    };
  }

  /**
   * Analyze requirements from user input
   *
   * Extracts structured requirements, success criteria, assumptions, and clarifications.
   * Uses DecisionEngine to assess if requirements are clear enough to proceed.
   * Escalates via EscalationQueue if confidence < 0.75.
   *
   * @param userInput - Raw requirements from user
   * @param productBrief - Optional product brief for strategic context
   * @returns Structured analysis result
   * @throws Error if requirements are too vague and confidence < 0.75
   */
  async analyzeRequirements(
    userInput: string,
    productBrief?: string
  ): Promise<AnalysisResult> {
    // Validate input
    if (!userInput || userInput.trim().length === 0) {
      throw new Error('Cannot analyze empty input. Please provide user requirements.');
    }

    // Log invocation
    this.logInvocation('analyzeRequirements', userInput.length);

    // Check if requirements are clear enough (using DecisionEngine if available)
    if (this.decisionEngine) {
      const clarityDecision = await this.makeDecision(
        'Are these requirements clear enough to extract structured requirements?',
        {
          userInput,
          productBrief,
          inputLength: userInput.length
        },
        'analyzeRequirements'
      );

      // If confidence < 0.75, escalate
      if (clarityDecision.confidence < MaryAgent.ESCALATION_THRESHOLD) {
        await this.escalate(
          'analyzeRequirements',
          'Requirements are too vague or unclear',
          clarityDecision
        );
        throw new Error(
          `Requirements analysis requires human input (escalation created). ` +
          `Reason: ${clarityDecision.reasoning}`
        );
      }
    }

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.requirementsExtraction,
      {
        userInput,
        productBrief
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into AnalysisResult
    const result = this.parseAnalysisResult(response);

    // Log result
    this.logResult('analyzeRequirements', result.requirements.length);

    return result;
  }

  /**
   * Define success criteria for features
   *
   * Generates measurable, testable criteria in Given-When-Then format.
   * Ensures criteria are concrete and verifiable.
   *
   * @param features - List of features requiring success criteria
   * @returns Array of success criteria strings
   * @throws Error if features list is empty
   */
  async defineSuccessCriteria(features: string[]): Promise<string[]> {
    // Validate input
    if (!features || features.length === 0) {
      throw new Error('Cannot define success criteria for empty features list.');
    }

    // Log invocation
    this.logInvocation('defineSuccessCriteria', features.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.successCriteriaDefinition,
      {
        features: features.join('\n- ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into array of criteria strings
    const criteria = this.parseSuccessCriteria(response);

    // Log result
    this.logResult('defineSuccessCriteria', criteria.length);

    return criteria;
  }

  /**
   * Negotiate scope into MVP and growth features
   *
   * Applies 80/20 rule: identifies 20% of features that deliver 80% of value for MVP.
   * Considers constraints (timeline, budget, team size) in decision.
   * Uses DecisionEngine to assess confidence in MVP boundary decisions.
   *
   * @param requirements - Full list of requirements
   * @param constraints - Constraints (timeline, budget, teamSize, etc.)
   * @returns Scope result with MVP, growth features, and rationale
   * @throws Error if MVP boundary decision confidence < 0.75
   */
  async negotiateScope(
    requirements: string[],
    constraints: Record<string, unknown>
  ): Promise<ScopeResult> {
    // Validate input
    if (!requirements || requirements.length === 0) {
      throw new Error('Cannot negotiate scope for empty requirements list.');
    }

    // Log invocation
    this.logInvocation('negotiateScope', requirements.length);

    // Check if we have enough context for MVP decisions (using DecisionEngine if available)
    if (this.decisionEngine) {
      const scopeDecision = await this.makeDecision(
        'Do we have enough information to determine MVP boundary for these requirements?',
        {
          requirements,
          constraints,
          requirementCount: requirements.length
        },
        'negotiateScope'
      );

      // If confidence < 0.75, escalate
      if (scopeDecision.confidence < MaryAgent.ESCALATION_THRESHOLD) {
        await this.escalate(
          'negotiateScope',
          'Insufficient context to determine MVP boundary',
          scopeDecision
        );
        throw new Error(
          `Scope negotiation requires human input (escalation created). ` +
          `Reason: ${scopeDecision.reasoning}`
        );
      }
    }

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.scopeNegotiation,
      {
        requirements: requirements.join('\n- '),
        constraints: JSON.stringify(constraints, null, 2)
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into ScopeResult
    const result = this.parseScopeResult(response);

    // Log result
    this.logResult('negotiateScope', result.mvpScope.length);

    return result;
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
   * Escalate decision to human via EscalationQueue
   *
   * Called when DecisionEngine confidence < 0.75.
   * Pauses workflow until human responds.
   *
   * @param method - Method requiring escalation
   * @param reason - Reason for escalation
   * @param decision - Low-confidence decision
   * @returns Escalation ID
   */
  private async escalate(
    method: string,
    reason: string,
    decision: Decision
  ): Promise<string> {
    if (!this.escalationQueue) {
      throw new Error('EscalationQueue not available for escalations');
    }

    this.currentStep++;

    const escalationId = await this.escalationQueue.add({
      workflowId: this.workflowId,
      step: this.currentStep,
      question: decision.question,
      aiReasoning: decision.reasoning,
      confidence: decision.confidence,
      context: {
        method,
        reason,
        ...decision.context
      }
    });

    console.log(
      `[MaryAgent] Escalated ${method} (confidence: ${decision.confidence.toFixed(2)}) - ` +
      `Escalation ID: ${escalationId}`
    );

    return escalationId;
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
   * Parse LLM response into AnalysisResult
   *
   * Expects JSON format from LLM with requirements, successCriteria, assumptions, clarifications.
   *
   * @param response - LLM response text
   * @returns Parsed AnalysisResult
   */
  private parseAnalysisResult(response: string): AnalysisResult {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return {
        requirements: parsed.requirements || [],
        successCriteria: parsed.successCriteria || [],
        assumptions: parsed.assumptions || [],
        clarifications: parsed.clarifications || []
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          requirements: parsed.requirements || [],
          successCriteria: parsed.successCriteria || [],
          assumptions: parsed.assumptions || [],
          clarifications: parsed.clarifications || []
        };
      }

      throw new Error(
        'Failed to parse LLM response into AnalysisResult. Expected JSON format.'
      );
    }
  }

  /**
   * Parse LLM response into array of success criteria
   *
   * Expects JSON array of strings.
   *
   * @param response - LLM response text
   * @returns Array of success criteria strings
   */
  private parseSuccessCriteria(response: string): string[] {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Expected array of strings');
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
        'Failed to parse LLM response into success criteria array. Expected JSON array.'
      );
    }
  }

  /**
   * Parse LLM response into ScopeResult
   *
   * Expects JSON format with mvpScope, growthFeatures, rationale.
   *
   * @param response - LLM response text
   * @returns Parsed ScopeResult
   */
  private parseScopeResult(response: string): ScopeResult {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      return {
        mvpScope: parsed.mvpScope || [],
        growthFeatures: parsed.growthFeatures || [],
        rationale: parsed.rationale || ''
      };
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          mvpScope: parsed.mvpScope || [],
          growthFeatures: parsed.growthFeatures || [],
          rationale: parsed.rationale || ''
        };
      }

      throw new Error(
        'Failed to parse LLM response into ScopeResult. Expected JSON format.'
      );
    }
  }

  /**
   * Log method invocation
   *
   * Format: [MaryAgent] method(inputSize: X chars/items) -> ...
   *
   * @param method - Method name
   * @param inputSize - Input size (characters or item count)
   */
  private logInvocation(method: string, inputSize: number): void {
    console.log(
      `[MaryAgent] ${method}(inputSize: ${inputSize}) -> processing...`
    );
  }

  /**
   * Log method result
   *
   * Format: [MaryAgent] method(...) -> result: X items
   *
   * @param method - Method name
   * @param resultSize - Result size (item count)
   */
  private logResult(method: string, resultSize: number): void {
    console.log(
      `[MaryAgent] ${method}(...) -> result: ${resultSize} items`
    );
  }

  /**
   * Get decision audit trail
   *
   * Returns all decisions made by Mary during session.
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
}
