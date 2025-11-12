/**
 * WinstonAgent - System Architect Persona
 *
 * Winston specializes in system design, component architecture, data modeling,
 * API design, and technical decision documentation (ADR format).
 * Uses DecisionEngine for confidence-based decisions and integrates with CIS agents
 * for strategic architectural decisions.
 *
 * Features:
 * - Multi-provider LLM support (Claude Sonnet 4.5 recommended)
 * - Confidence-based autonomous decision making
 * - Automatic escalation when confidence < 0.75
 * - CIS agent integration for low-confidence decisions (< 0.70)
 * - Architecture Decision Record (ADR) format
 * - Comprehensive NFR documentation
 *
 * @example
 * ```typescript
 * const winston = await WinstonAgent.create(
 *   { provider: 'anthropic', model: 'claude-sonnet-4-5', temperature: 0.3 },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 *
 * const overview = await winston.generateSystemOverview(prdContent);
 * console.log(overview); // System architecture overview section
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
 * Component design result
 */
export interface ComponentDesign {
  /** Component name */
  name: string;

  /** Component responsibility (single responsibility principle) */
  responsibility: string;

  /** Input interfaces */
  inputs: string[];

  /** Output interfaces */
  outputs: string[];

  /** Dependencies on other components */
  dependencies: string[];

  /** Technology used for this component */
  technology?: string;

  /** Rationale for this component's existence */
  rationale: string;
}

/**
 * Data model definition
 */
export interface DataModel {
  /** Entity name */
  name: string;

  /** Entity description */
  description: string;

  /** Attributes with types and constraints */
  attributes: Array<{
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }>;

  /** Relationships with other entities */
  relationships: Array<{
    type: string;
    entity: string;
    description: string;
  }>;

  /** Validation rules */
  validationRules: string[];

  /** Indexes for query optimization */
  indexes: {
    primary: string;
    secondary?: string[];
  };
}

/**
 * API requirement input
 */
export interface APIRequirement {
  /** HTTP method */
  method: string;

  /** Endpoint path */
  path: string;

  /** Endpoint description */
  description: string;

  /** Required authentication */
  authentication?: string;

  /** Required authorization */
  authorization?: string;
}

/**
 * API specification output
 */
export interface APISpecification {
  /** HTTP method */
  method: string;

  /** Endpoint path */
  path: string;

  /** Description */
  description: string;

  /** Authentication method */
  authentication: string;

  /** Authorization requirements */
  authorization: string;

  /** Request schema */
  request: Record<string, unknown>;

  /** Response schema (200 OK) */
  response: Record<string, unknown>;

  /** Error responses */
  errors: Array<{
    code: number;
    description: string;
  }>;

  /** Rate limiting */
  rateLimiting?: string;
}

/**
 * Non-functional requirements section
 */
export interface NFRSection {
  /** Performance requirements */
  performance: {
    latency: string;
    throughput: string;
    scalability: string;
  };

  /** Security requirements */
  security: {
    authentication: string;
    authorization: string;
    dataProtection: string;
    inputValidation: string;
    compliance: string;
  };

  /** Reliability requirements */
  reliability: {
    availability: string;
    faultTolerance: string;
    disasterRecovery: string;
  };

  /** Observability requirements */
  observability: {
    logging: string;
    metrics: string;
    tracing: string;
    alerting: string;
  };
}

/**
 * Technical decision for ADR documentation
 */
export interface TechnicalDecision {
  /** ADR ID (e.g., ADR-001) */
  id: string;

  /** Decision title */
  title: string;

  /** Problem context */
  context: string;

  /** Chosen solution */
  decision: string;

  /** Alternatives considered with pros/cons */
  alternatives: Array<{
    option: string;
    pros: string[];
    cons: string[];
  }>;

  /** Rationale for chosen decision */
  rationale: string;

  /** Consequences (positive and negative) */
  consequences: string[];

  /** Decision status */
  status: 'proposed' | 'accepted' | 'superseded';

  /** Decision maker */
  decisionMaker: 'winston' | 'murat' | 'cis-agent' | 'user';

  /** Decision date */
  date: Date;
}

/**
 * CIS decision request for strategic decisions
 */
export interface CISDecisionRequest {
  /** Decision question */
  decision: string;

  /** Decision context */
  context: string;

  /** Decision type (technical, ux, product, innovation) */
  decisionType: 'technical' | 'ux' | 'product' | 'innovation';

  /** Winston's confidence score */
  confidence: number;

  /** Decision urgency */
  urgency: 'low' | 'medium' | 'high';

  /** Project context */
  projectContext: {
    name: string;
    level: number;
    techStack: string[];
    domain: string;
  };
}

/**
 * CIS agent response
 */
export interface CISResponse {
  /** CIS agent name (e.g., "Dr. Quinn") */
  agent: string;

  /** Framework used (e.g., "Design Thinking") */
  framework: string;

  /** CIS recommendations */
  recommendations: string;

  /** Confidence score after CIS analysis */
  confidence: number;

  /** CIS reasoning */
  reasoning: string;
}

/**
 * Winston's persona structure parsed from markdown
 */
interface WinstonPersona {
  /** System prompt (Winston's personality and approach) */
  systemPrompt: string;

  /** Specialized prompts for specific methods */
  specializedPrompts: {
    systemOverview: string;
    componentDesign: string;
    dataModeling: string;
    apiSpecification: string;
    nfrDocumentation: string;
    technicalDecision: string;
    confidenceAssessment: string;
    cisIntegration: string;
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
 * WinstonAgent - System Architect persona agent
 *
 * Provides intelligent architecture design with automatic escalation when uncertain
 * and CIS integration for strategic decisions.
 */
export class WinstonAgent {
  /** Default path to Winston's persona file */
  private static readonly DEFAULT_PERSONA_PATH = '../../../../bmad/bmm/agents/winston.md';

  /** Escalation threshold (from DecisionEngine) */
  // private static readonly ESCALATION_THRESHOLD = 0.75; // TODO: Story 3-1-followup - Implement automatic escalation workflow

  /** CIS integration threshold (lower than escalation) */
  // private static readonly CIS_THRESHOLD = 0.70; // TODO: Story 3-8 - Implement automatic CIS routing

  /** Temperature for architectural reasoning */
  private static readonly REASONING_TEMPERATURE = 0.3;

  /** LLM client for Winston's reasoning */
  private readonly llmClient: LLMClient;

  /** Winston's persona (system prompt + specialized prompts) */
  private readonly persona: WinstonPersona;

  /** LLM configuration */
  private readonly llmConfig: LLMConfig;

  /** Temperature for LLM invocations */
  private readonly temperature: number;

  /** Decision engine for confidence-based decisions */
  private readonly decisionEngine?: DecisionEngine;

  /** Escalation queue for human intervention */
  // @ts-expect-error - Reserved for automatic escalation in Story 3-1-followup
  private readonly escalationQueue?: EscalationQueue;

  /** Current workflow context */
  // @ts-expect-error - Reserved for automatic escalation in Story 3-1-followup
  private workflowId: string = 'winston-session';
  // @ts-expect-error - Reserved for automatic escalation in Story 3-1-followup
  private currentStep: number = 0;

  /** Decision audit trail */
  private readonly decisions: DecisionRecord[] = [];

  /** ADR counter for generating ADR IDs */
  private adrCounter: number = 0;

  /**
   * Private constructor - use WinstonAgent.create() instead
   */
  private constructor(
    llmClient: LLMClient,
    persona: WinstonPersona,
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
   * Create a new WinstonAgent instance
   *
   * @param llmConfig - LLM configuration (provider, model, temperature)
   * @param llmFactory - LLM factory for creating clients
   * @param decisionEngine - Optional decision engine for confidence scoring
   * @param escalationQueue - Optional escalation queue for human intervention
   * @param personaPath - Optional custom path to persona file
   * @returns WinstonAgent instance
   */
  static async create(
    llmConfig: LLMConfig,
    llmFactory: LLMFactory,
    decisionEngine?: DecisionEngine,
    escalationQueue?: EscalationQueue,
    personaPath?: string
  ): Promise<WinstonAgent> {
    // Validate LLM config
    if (!llmConfig.provider || !llmConfig.model) {
      throw new Error(
        'Invalid LLM config: provider and model are required'
      );
    }

    // Set temperature to 0.3 for architectural reasoning
    const temperature = WinstonAgent.REASONING_TEMPERATURE;

    // Load persona from file
    const persona = await WinstonAgent.loadPersona(personaPath);

    // Create LLM client
    const llmClient = await llmFactory.createClient(llmConfig);

    return new WinstonAgent(
      llmClient,
      persona,
      llmConfig,
      temperature,
      decisionEngine,
      escalationQueue
    );
  }

  /**
   * Load Winston's persona from markdown file
   *
   * @param personaPath - Optional custom path to persona file
   * @returns Parsed persona with system prompt and specialized prompts
   */
  private static async loadPersona(personaPath?: string): Promise<WinstonPersona> {
    // Resolve persona file path
    const resolvedPath = personaPath
      ? path.resolve(personaPath)
      : path.resolve(__dirname, WinstonAgent.DEFAULT_PERSONA_PATH);

    try {
      const personaContent = await fs.readFile(resolvedPath, 'utf-8');
      return WinstonAgent.parsePersona(personaContent);
    } catch (error) {
      throw new Error(
        `Failed to load Winston persona file at ${resolvedPath}: ${(error as Error).message}. ` +
        'Ensure bmad/bmm/agents/winston.md exists.'
      );
    }
  }

  /**
   * Parse persona markdown into structured format
   *
   * @param content - Markdown content of persona file
   * @returns Parsed persona structure
   */
  private static parsePersona(content: string): WinstonPersona {
    // Extract system prompt (everything between "## System Prompt" and next "##")
    const systemPromptMatch = content.match(
      /## System Prompt\s+([\s\S]*?)(?=\n##|$)/
    );
    const systemPrompt = systemPromptMatch?.[1]?.trim() ?? 'You are Winston, an expert System Architect.';

    // Extract specialized prompts
    const systemOverviewMatch = content.match(
      /### System Architecture Overview Generation\s+([\s\S]*?)(?=\n###|$)/
    );
    const componentDesignMatch = content.match(
      /### Component Architecture Design\s+([\s\S]*?)(?=\n###|$)/
    );
    const dataModelingMatch = content.match(
      /### Data Model Definition\s+([\s\S]*?)(?=\n###|$)/
    );
    const apiSpecificationMatch = content.match(
      /### API Specification\s+([\s\S]*?)(?=\n###|$)/
    );
    const nfrDocumentationMatch = content.match(
      /### Non-Functional Requirements Documentation\s+([\s\S]*?)(?=\n###|$)/
    );
    const technicalDecisionMatch = content.match(
      /### Technical Decision Documentation \(ADR Format\)\s+([\s\S]*?)(?=\n###|$)/
    );
    const confidenceAssessmentMatch = content.match(
      /### Confidence Assessment\s+([\s\S]*?)(?=\n###|$)/
    );
    const cisIntegrationMatch = content.match(
      /### CIS Agent Integration\s+([\s\S]*?)(?=\n###|$)/
    );

    return {
      systemPrompt,
      specializedPrompts: {
        systemOverview: systemOverviewMatch?.[1]?.trim() ?? 'Generate system architecture overview.',
        componentDesign: componentDesignMatch?.[1]?.trim() ?? 'Design component architecture.',
        dataModeling: dataModelingMatch?.[1]?.trim() ?? 'Define data models.',
        apiSpecification: apiSpecificationMatch?.[1]?.trim() ?? 'Specify API contracts.',
        nfrDocumentation: nfrDocumentationMatch?.[1]?.trim() ?? 'Document non-functional requirements.',
        technicalDecision: technicalDecisionMatch?.[1]?.trim() ?? 'Document technical decisions in ADR format.',
        confidenceAssessment: confidenceAssessmentMatch?.[1]?.trim() ?? 'Assess confidence for decisions.',
        cisIntegration: cisIntegrationMatch?.[1]?.trim() ?? 'Integrate with CIS agents.'
      }
    };
  }

  /**
   * Generate system architecture overview
   *
   * Analyzes PRD and generates high-level system design including architectural
   * approach, key patterns, system layers, technology stack, and cross-cutting concerns.
   *
   * @param prd - PRD document content
   * @returns System architecture overview (markdown)
   * @throws Error if PRD is empty or invalid
   */
  async generateSystemOverview(prd: string): Promise<string> {
    // Validate input
    if (!prd || prd.trim().length === 0) {
      throw new Error('Cannot generate system overview from empty PRD.');
    }

    // Log invocation
    this.logInvocation('generateSystemOverview', prd.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.systemOverview,
      {
        prd
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Log result
    this.logResult('generateSystemOverview', response.length);

    return response;
  }

  /**
   * Design component architecture
   *
   * Breaks down system into components with clear responsibilities,
   * interfaces, dependencies, and communication patterns.
   *
   * @param requirements - PRD requirements list
   * @returns Component designs
   * @throws Error if requirements list is empty
   */
  async designComponents(requirements: string[]): Promise<ComponentDesign[]> {
    // Validate input
    if (!requirements || requirements.length === 0) {
      throw new Error('Cannot design components from empty requirements list.');
    }

    // Log invocation
    this.logInvocation('designComponents', requirements.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.componentDesign,
      {
        requirements: requirements.join('\n- ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into ComponentDesign array
    const components = this.parseComponentDesigns(response);

    // Log result
    this.logResult('designComponents', components.length);

    return components;
  }

  /**
   * Define data models
   *
   * Designs entities with attributes, relationships, validation rules,
   * and indexes for the system.
   *
   * @param entities - Entity names from PRD
   * @returns Data model definitions
   * @throws Error if entities list is empty
   */
  async defineDataModels(entities: string[]): Promise<DataModel[]> {
    // Validate input
    if (!entities || entities.length === 0) {
      throw new Error('Cannot define data models from empty entities list.');
    }

    // Log invocation
    this.logInvocation('defineDataModels', entities.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.dataModeling,
      {
        entities: entities.join('\n- ')
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into DataModel array
    const models = this.parseDataModels(response);

    // Log result
    this.logResult('defineDataModels', models.length);

    return models;
  }

  /**
   * Specify API contracts
   *
   * Designs API endpoints with request/response schemas, authentication,
   * authorization, error handling, and rate limiting.
   *
   * @param endpoints - API requirements from PRD
   * @returns API specifications
   * @throws Error if endpoints list is empty
   */
  async specifyAPIs(endpoints: APIRequirement[]): Promise<APISpecification[]> {
    // Validate input
    if (!endpoints || endpoints.length === 0) {
      throw new Error('Cannot specify APIs from empty endpoints list.');
    }

    // Log invocation
    this.logInvocation('specifyAPIs', endpoints.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.apiSpecification,
      {
        endpoints: JSON.stringify(endpoints, null, 2)
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into APISpecification array
    const apis = this.parseAPISpecifications(response);

    // Log result
    this.logResult('specifyAPIs', apis.length);

    return apis;
  }

  /**
   * Document non-functional requirements
   *
   * Specifies performance, security, reliability, and observability requirements
   * with concrete, measurable targets.
   *
   * @param requirements - PRD requirements text
   * @returns NFR section
   * @throws Error if requirements are empty
   */
  async documentNFRs(requirements: string): Promise<NFRSection> {
    // Validate input
    if (!requirements || requirements.trim().length === 0) {
      throw new Error('Cannot document NFRs from empty requirements.');
    }

    // Log invocation
    this.logInvocation('documentNFRs', requirements.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.nfrDocumentation,
      {
        requirements
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Parse response into NFRSection
    const nfrs = this.parseNFRSection(response);

    // Log result
    this.logResult('documentNFRs', Object.keys(nfrs).length);

    return nfrs;
  }

  /**
   * Document technical decision in ADR format
   *
   * Creates an Architecture Decision Record with context, decision, alternatives,
   * rationale, and consequences.
   *
   * @param decision - Technical decision details
   * @returns ADR markdown document
   */
  async documentDecision(decision: TechnicalDecision): Promise<string> {
    // Log invocation
    this.logInvocation('documentDecision', decision.title.length);

    // Build prompt with context
    const prompt = this.buildPrompt(
      this.persona.specializedPrompts.technicalDecision,
      {
        decision: JSON.stringify(decision, null, 2)
      }
    );

    // Invoke LLM with retry logic
    const response = await this.invokeLLMWithRetry(prompt);

    // Log result
    this.logResult('documentDecision', response.length);

    return response;
  }

  /**
   * Assess confidence for architectural decision
   *
   * Evaluates confidence based on context sufficiency, answer clarity,
   * PRD alignment, and technical feasibility.
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
   * Invoke CIS agent for strategic decision
   *
   * Routes low-confidence decisions to appropriate CIS agent based on decision type.
   * Mocked implementation - actual CIS integration would call CIS agent services.
   *
   * @param request - CIS decision request
   * @returns CIS response with recommendations
   */
  async invokeCISAgent(request: CISDecisionRequest): Promise<CISResponse> {
    // Log CIS invocation
    console.log(
      `[WinstonAgent] Invoking CIS agent for decision: ${request.decision}`
    );

    // Route to appropriate CIS agent based on decision type
    const cisAgent = this.routeCISAgent(request.decisionType);

    // Mock CIS response (in real implementation, this would call CIS agent service)
    const mockResponse: CISResponse = {
      agent: cisAgent,
      framework: this.getCISFramework(request.decisionType),
      recommendations: `Strategic recommendation for: ${request.decision}`,
      confidence: 0.85,
      reasoning: `CIS ${cisAgent} applied ${this.getCISFramework(request.decisionType)} framework`
    };

    // Log CIS response
    console.log(
      `[WinstonAgent] CIS agent ${cisAgent} responded with confidence: ${mockResponse.confidence}`
    );

    return mockResponse;
  }

  /**
   * Route decision to appropriate CIS agent
   *
   * @param decisionType - Type of decision
   * @returns CIS agent name
   */
  private routeCISAgent(decisionType: string): string {
    switch (decisionType) {
      case 'technical':
        return 'Dr. Quinn';
      case 'ux':
        return 'Maya';
      case 'product':
        return 'Sophia';
      case 'innovation':
        return 'Victor';
      default:
        return 'Dr. Quinn'; // Default to technical
    }
  }

  /**
   * Get CIS framework for decision type
   *
   * @param decisionType - Type of decision
   * @returns Framework name
   */
  private getCISFramework(decisionType: string): string {
    switch (decisionType) {
      case 'technical':
        return 'Design Thinking';
      case 'ux':
        return 'User-Centered Design';
      case 'product':
        return 'Business Model Canvas';
      case 'innovation':
        return 'Innovation Canvas';
      default:
        return 'First Principles Analysis';
    }
  }

  /**
   * Generate next ADR ID
   *
   * @returns ADR ID (e.g., ADR-001)
   */
  generateADRId(): string {
    this.adrCounter++;
    return `ADR-${String(this.adrCounter).padStart(3, '0')}`;
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
  // TODO: Story 3-1-followup - Implement automatic escalation workflow
  // private async escalate(
  //   method: string,
  //   reason: string,
  //   decision: Decision
  // ): Promise<string> {
  //   if (!this.escalationQueue) {
  //     throw new Error('EscalationQueue not available for escalations');
  //   }
  //
  //   this.currentStep++;
  //
  //   const escalationId = await this.escalationQueue.add({
  //     workflowId: this.workflowId,
  //     step: this.currentStep,
  //     question: decision.question,
  //     aiReasoning: decision.reasoning,
  //     confidence: decision.confidence,
  //     context: {
  //       method,
  //       reason,
  //       ...decision.context
  //     }
  //   });
  //
  //   console.log(
  //     `[WinstonAgent] Escalated ${method} (confidence: ${decision.confidence.toFixed(2)}) - ` +
  //     `Escalation ID: ${escalationId}`
  //   );
  //
  //   return escalationId;
  // }

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
   * Parse component designs from LLM response
   *
   * @param response - LLM response text
   * @returns Component designs
   */
  private parseComponentDesigns(response: string): ComponentDesign[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Expected array of ComponentDesign');
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
        'Failed to parse LLM response into ComponentDesign array. Expected JSON array.'
      );
    }
  }

  /**
   * Parse data models from LLM response
   *
   * @param response - LLM response text
   * @returns Data models
   */
  private parseDataModels(response: string): DataModel[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Expected array of DataModel');
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
        'Failed to parse LLM response into DataModel array. Expected JSON array.'
      );
    }
  }

  /**
   * Parse API specifications from LLM response
   *
   * @param response - LLM response text
   * @returns API specifications
   */
  private parseAPISpecifications(response: string): APISpecification[] {
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('Expected array of APISpecification');
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
        'Failed to parse LLM response into APISpecification array. Expected JSON array.'
      );
    }
  }

  /**
   * Parse NFR section from LLM response
   *
   * @param response - LLM response text
   * @returns NFR section
   */
  private parseNFRSection(response: string): NFRSection {
    try {
      const parsed = JSON.parse(response);
      return parsed as NFRSection;
    } catch (error) {
      // Fallback: extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch?.[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed as NFRSection;
      }

      throw new Error(
        'Failed to parse LLM response into NFRSection. Expected JSON format.'
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
      `[WinstonAgent] ${method}(inputSize: ${inputSize}) -> processing...`
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
      `[WinstonAgent] ${method}(...) -> result: ${resultSize}`
    );
  }

  /**
   * Get decision audit trail
   *
   * Returns all decisions made by Winston during session.
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
