/**
 * JohnAgent - Product Manager Persona
 *
 * John specializes in strategic product guidance, feature prioritization, and market validation.
 * Uses DecisionEngine for confidence-based strategic decisions and EscalationQueue for uncertain product choices.
 *
 * Features:
 * - Multi-provider LLM support (Anthropic, OpenAI, Zhipu, Google)
 * - Strategic product vision definition
 * - RICE/MoSCoW feature prioritization
 * - Product-market fit assessment
 * - Business viability validation
 * - Executive summary generation
 *
 * @example
 * ```typescript
 * const john = await JohnAgent.create(
 *   { provider: 'claude-code', model: 'claude-sonnet-4-5', temperature: 0.5 },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 *
 * const vision = await john.defineProductVision({
 *   userRequirements: 'AI agent orchestration platform',
 *   marketData: { competitors: [], trends: ['AI automation'] }
 * });
 * console.log(vision.visionStatement); // Strategic product vision
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { LLMFactory } from '../../llm/LLMFactory.js';
import { LLMClient } from '../../llm/LLMClient.interface.js';
import { LLMConfig, InvokeOptions } from '../../types/llm.types.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Product vision result from strategic analysis
 */
export interface ProductVision {
  /** Clear product vision statement */
  visionStatement: string;

  /** Target user segments */
  targetUsers: string[];

  /** Core value proposition */
  valueProposition: string;

  /** Key differentiators from competitors */
  differentiation: string;

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Feature for prioritization
 */
export interface Feature {
  name: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Context for feature prioritization
 */
export interface PrioritizationContext {
  budgetConstraints?: string;
  timeframe?: string;
  [key: string]: any;
}

/**
 * Prioritized features result
 */
export interface PrioritizedFeatures {
  /** MVP-critical features */
  mvpFeatures: string[];

  /** Post-MVP growth features */
  growthFeatures: string[];

  /** Identified scope creep concerns */
  scopeCreepRisks: string[];

  /** Prioritization reasoning */
  rationale: string;
}

/**
 * Product requirements for market fit analysis
 */
export interface Requirements {
  features?: string[];
  requirementsList?: string[];
  [key: string]: any;
}

/**
 * Market data for assessment
 */
export interface MarketData {
  marketSize?: string;
  competitors?: string[];
  trends?: string[];
  [key: string]: any;
}

/**
 * Market fit assessment result
 */
export interface MarketFitAssessment {
  /** Market fit score (0-100) */
  score: number;

  /** Market risks identified */
  risks: string[];

  /** Market opportunities */
  opportunities: string[];

  /** Strategic recommendations */
  recommendations: string[];
}

/**
 * Requirements validation result
 */
export interface ValidationResult {
  /** Overall validation result */
  valid: boolean;

  /** Business viability concerns */
  concerns: string[];

  /** Scope creep red flags */
  scopeCreepIndicators: string[];

  /** Unrealistic timeline flags */
  timelineIssues: string[];

  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * PRD content for executive summary
 */
export interface PRDContent {
  vision?: string;
  requirements?: string[];
  features?: string[];
  successCriteria?: string[];
  [key: string]: any;
}

/**
 * Executive summary result
 */
export interface ExecutiveSummary {
  /** 1-2 paragraph executive summary */
  summary: string;

  /** Key success metrics */
  keyMetrics: string[];

  /** Expected business impact */
  businessImpact: string;

  /** ROI indicators */
  roi: string;
}

/**
 * John's persona structure parsed from markdown
 */
interface JohnPersona {
  /** System prompt (John's personality and approach) */
  systemPrompt: string;

  /** Specialized prompts for specific methods */
  specializedPrompts: {
    productStrategy: string;
    featurePrioritization: string;
    marketFit: string;
    requirementsValidation: string;
    executiveSummary: string;
    roadmapPlanning?: string;
  };
}


/**
 * JohnAgent - Product Manager persona agent
 *
 * Provides strategic product guidance with automatic escalation when uncertain.
 */
export class JohnAgent {
  /** Default path to John's persona file (pm.md with name="John") */
  private static readonly DEFAULT_PERSONA_PATH = '../../../../bmad/bmm/agents/pm.md';

  /** Temperature for strategic reasoning (balanced strategy/creativity) */
  private static readonly STRATEGY_TEMPERATURE = 0.5;

  /** Maximum retries for LLM API failures */
  private static readonly MAX_RETRIES = 3;

  /** Initial backoff delay in milliseconds */
  private static readonly INITIAL_BACKOFF = 1000;

  /** LLM client for John's reasoning */
  private readonly llmClient: LLMClient;

  /** John's persona (system prompt + specialized prompts) */
  private readonly persona: JohnPersona;

  /** LLM configuration (reserved for future use) */
  // @ts-expect-error - Reserved for future use
  private readonly _llmConfig: LLMConfig;

  /** Temperature for LLM invocations */
  private readonly temperature: number;

  // Decision engine integration and workflow tracking
  private static readonly ESCALATION_THRESHOLD = 0.75;
  private readonly decisionEngine?: DecisionEngine;
  private readonly escalationQueue?: EscalationQueue;
  // private workflowId: string = 'john-session';
  // private currentStep: number = 0;
  // private readonly decisions: DecisionRecord[] = [];

  /**
   * Private constructor - use JohnAgent.create() instead
   */
  private constructor(
    llmClient: LLMClient,
    persona: JohnPersona,
    llmConfig: LLMConfig,
    temperature: number,
    decisionEngine?: DecisionEngine,
    escalationQueue?: EscalationQueue
  ) {
    this.llmClient = llmClient;
    this.persona = persona;
    this._llmConfig = llmConfig;
    this.temperature = temperature;
    this.decisionEngine = decisionEngine;
    this.escalationQueue = escalationQueue;
  }

  /**
   * Create a new JohnAgent instance
   *
   * @param llmConfig - LLM configuration (provider, model, temperature)
   * @param llmFactory - LLM factory for creating clients
   * @param personaPath - Optional custom path to persona file
   * @returns JohnAgent instance
   */
  static async create(
    llmConfig: LLMConfig,
    llmFactory: LLMFactory,
    decisionEngine?: DecisionEngine,
    escalationQueue?: EscalationQueue,
    personaPath?: string
  ): Promise<JohnAgent> {
    // Validate LLM config
    if (!llmConfig.provider || !llmConfig.model) {
      throw new Error(
        'Invalid LLM config: provider and model are required'
      );
    }

    // Validate provider and model
    if (!llmFactory.validateModel(llmConfig.provider, llmConfig.model)) {
      throw new Error(
        `Invalid provider '${llmConfig.provider}' or model '${llmConfig.model}'`
      );
    }

    // Set temperature to 0.5 for balanced strategy/creativity
    const temperature = JohnAgent.STRATEGY_TEMPERATURE;

    // Load persona from file
    const persona = await JohnAgent.loadPersona(personaPath);

    // Create LLM client
    const llmClient = await llmFactory.createClient(llmConfig);

    return new JohnAgent(
      llmClient,
      persona,
      llmConfig,
      temperature,
      decisionEngine,
      escalationQueue
    );
  }

  /**
   * Load John's persona from markdown file
   *
   * @param personaPath - Optional custom path to persona file
   * @returns Parsed persona
   */
  private static async loadPersona(personaPath?: string): Promise<JohnPersona> {
    try {
      // Resolve persona file path
      const resolvedPath = personaPath || path.resolve(__dirname, JohnAgent.DEFAULT_PERSONA_PATH);

      // Read persona file
      const personaContent = await fs.readFile(resolvedPath, 'utf-8');

      // Parse persona markdown
      return JohnAgent.parsePersona(personaContent);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(
          `John persona file not found at: ${personaPath || JohnAgent.DEFAULT_PERSONA_PATH}`
        );
      }
      throw new Error(`Failed to load John persona: ${error.message}`);
    }
  }

  /**
   * Parse persona markdown into structured format
   *
   * @param content - Raw markdown content
   * @returns Parsed persona
   */
  private static parsePersona(content: string): JohnPersona {
    const systemPromptMatch = content.match(/## System Prompt\s+([\s\S]*?)(?=##|$)/);
    const productStrategyMatch = content.match(/### Product Strategy\s+([\s\S]*?)(?=###|$)/);
    const prioritizationMatch = content.match(/### Feature Prioritization\s+([\s\S]*?)(?=###|$)/);
    const marketFitMatch = content.match(/### Market Fit Assessment\s+([\s\S]*?)(?=###|$)/);
    const validationMatch = content.match(/### Requirements Validation\s+([\s\S]*?)(?=###|$)/);
    const summaryMatch = content.match(/### Executive Summary\s+([\s\S]*?)(?=###|$)/);
    const roadmapMatch = content.match(/### Roadmap Planning\s+([\s\S]*?)(?=###|$)/);

    return {
      systemPrompt: systemPromptMatch?.[1]?.trim() || 'You are John, an expert Product Manager...',
      specializedPrompts: {
        productStrategy: productStrategyMatch?.[1]?.trim() || 'Analyze requirements and synthesize strategic product vision...',
        featurePrioritization: prioritizationMatch?.[1]?.trim() || 'Apply RICE/MoSCoW frameworks to prioritize features...',
        marketFit: marketFitMatch?.[1]?.trim() || 'Assess product-market fit and business viability...',
        requirementsValidation: validationMatch?.[1]?.trim() || 'Validate requirements for business viability and challenge scope creep...',
        executiveSummary: summaryMatch?.[1]?.trim() || 'Generate concise executive summaries for stakeholders...',
        roadmapPlanning: roadmapMatch?.[1]?.trim()
      }
    };
  }

  /**
   * Get John's name
   *
   * @returns Agent name
   */
  getName(): string {
    return 'John';
  }

  /**
   * Get John's role
   *
   * @returns Agent role
   */
  getRole(): string {
    return 'Product Manager';
  }

  /**
   * Get specialized prompts
   *
   * @returns Specialized prompts object
   */
  getSpecializedPrompts(): JohnPersona['specializedPrompts'] {
    return this.persona.specializedPrompts;
  }

  /**
   * Define product vision from user requirements and market data
   *
   * @param context - Product context (user requirements, market data)
   * @returns Product vision
   */
  async defineProductVision(context: {
    userRequirements: string;
    marketData?: any;
  }): Promise<ProductVision> {
    const startTime = Date.now();
    this.log('defineProductVision', `userRequirements=${context.userRequirements.length} chars`);

    try {
      // Build prompt with system prompt + specialized prompt
      const prompt = `${this.persona.systemPrompt}

${this.persona.specializedPrompts.productStrategy}

User Requirements:
${context.userRequirements}

Market Data:
${context.marketData ? JSON.stringify(context.marketData, null, 2) : 'Not provided'}

Generate a strategic product vision. Return JSON with:
{
  "visionStatement": "Clear product vision statement",
  "targetUsers": ["User segment 1", "User segment 2"],
  "valueProposition": "Core value proposition",
  "differentiation": "Key differentiators",
  "confidence": 0.85
}`;

      // Invoke LLM with retry logic
      const response = await this.invokeWithRetry(prompt);

      // Parse response
      const vision = this.parseJSONResponse<ProductVision>(response, 'defineProductVision');

      // Validate required fields
      if (!vision.visionStatement || !vision.targetUsers || !vision.valueProposition || !vision.differentiation) {
        throw new Error('Missing required fields in ProductVision response');
      }

      // Ensure confidence is set
      if (typeof vision.confidence !== 'number') {
        vision.confidence = 0.8; // Default confidence
      }

      const duration = Date.now() - startTime;
      this.log('defineProductVision', `completed in ${duration}ms -> vision defined with confidence ${vision.confidence}`);

      return vision;
    } catch (error: any) {
      this.log('defineProductVision', `ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prioritize features using RICE/MoSCoW frameworks
   *
   * @param features - List of features to prioritize
   * @param context - Prioritization context (budget, timeframe, etc.)
   * @returns Prioritized features
   */
  async prioritizeFeatures(
    features: Feature[],
    context: PrioritizationContext
  ): Promise<PrioritizedFeatures> {
    const startTime = Date.now();
    this.log('prioritizeFeatures', `features=${features.length}, context provided`);

    try {
      // Build prompt
      const prompt = `${this.persona.systemPrompt}

${this.persona.specializedPrompts.featurePrioritization}

Features to Prioritize:
${JSON.stringify(features, null, 2)}

Prioritization Context:
${JSON.stringify(context, null, 2)}

Apply RICE or MoSCoW framework to prioritize features. Return JSON with:
{
  "mvpFeatures": ["Feature 1", "Feature 2"],
  "growthFeatures": ["Feature 3", "Feature 4"],
  "scopeCreepRisks": ["Risk 1: Description", "Risk 2: Description"],
  "rationale": "Detailed prioritization reasoning"
}`;

      // Invoke LLM with retry logic
      const response = await this.invokeWithRetry(prompt);

      // Parse response
      const prioritized = this.parseJSONResponse<PrioritizedFeatures>(response, 'prioritizeFeatures');

      // Validate required fields
      if (!prioritized.mvpFeatures || !prioritized.growthFeatures || !prioritized.rationale) {
        throw new Error('Missing required fields in PrioritizedFeatures response');
      }

      // Ensure scopeCreepRisks is an array
      if (!prioritized.scopeCreepRisks) {
        prioritized.scopeCreepRisks = [];
      }

      const duration = Date.now() - startTime;
      this.log('prioritizeFeatures', `completed in ${duration}ms -> ${prioritized.mvpFeatures.length} MVP, ${prioritized.growthFeatures.length} growth`);

      return prioritized;
    } catch (error: any) {
      this.log('prioritizeFeatures', `ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assess product-market fit
   *
   * @param requirements - Product requirements
   * @param marketData - Market data (size, competitors, trends)
   * @returns Market fit assessment
   */
  async assessMarketFit(
    requirements: Requirements,
    marketData: MarketData
  ): Promise<MarketFitAssessment> {
    const startTime = Date.now();
    this.log('assessMarketFit', `requirements provided, marketData provided`);

    try {
      // Build prompt
      const prompt = `${this.persona.systemPrompt}

${this.persona.specializedPrompts.marketFit}

Product Requirements:
${JSON.stringify(requirements, null, 2)}

Market Data:
${JSON.stringify(marketData, null, 2)}

Analyze product-market fit and business viability. Return JSON with:
{
  "score": 75,
  "risks": ["Risk 1", "Risk 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      // Invoke LLM with retry logic
      const response = await this.invokeWithRetry(prompt);

      // Parse response
      const assessment = this.parseJSONResponse<MarketFitAssessment>(response, 'assessMarketFit');

      // Validate required fields
      if (typeof assessment.score !== 'number' || !assessment.risks || !assessment.opportunities || !assessment.recommendations) {
        throw new Error('Missing required fields in MarketFitAssessment response');
      }

      // Validate score range
      if (assessment.score < 0 || assessment.score > 100) {
        throw new Error('Market fit score must be between 0 and 100');
      }

      const duration = Date.now() - startTime;
      this.log('assessMarketFit', `completed in ${duration}ms -> score ${assessment.score}`);

      return assessment;
    } catch (error: any) {
      this.log('assessMarketFit', `ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate requirements for business viability
   *
   * Challenges scope creep and unrealistic timelines.
   *
   * @param requirements - Requirements to validate (can be Mary's output)
   * @returns Validation result
   */
  async validateRequirementsViability(requirements: Requirements): Promise<ValidationResult> {
    const startTime = Date.now();
    this.log('validateRequirementsViability', `requirements provided`);

    try {
      // Build prompt
      const prompt = `${this.persona.systemPrompt}

${this.persona.specializedPrompts.requirementsValidation}

Requirements to Validate:
${JSON.stringify(requirements, null, 2)}

Validate requirements for business viability. Challenge scope creep and unrealistic timelines. Return JSON with:
{
  "valid": true,
  "concerns": ["Concern 1", "Concern 2"],
  "scopeCreepIndicators": ["Indicator 1: Description", "Indicator 2: Description"],
  "timelineIssues": ["Issue 1: Description", "Issue 2: Description"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      // Invoke LLM with retry logic
      const response = await this.invokeWithRetry(prompt);

      // Parse response
      const validation = this.parseJSONResponse<ValidationResult>(response, 'validateRequirementsViability');

      // Validate required fields
      if (typeof validation.valid !== 'boolean' || !validation.concerns || !validation.recommendations) {
        throw new Error('Missing required fields in ValidationResult response');
      }

      // Ensure arrays exist
      if (!validation.scopeCreepIndicators) {
        validation.scopeCreepIndicators = [];
      }
      if (!validation.timelineIssues) {
        validation.timelineIssues = [];
      }

      const duration = Date.now() - startTime;
      this.log('validateRequirementsViability', `completed in ${duration}ms -> valid=${validation.valid}, concerns=${validation.concerns.length}`);

      return validation;
    } catch (error: any) {
      this.log('validateRequirementsViability', `ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate executive summary from PRD content
   *
   * @param prdContent - PRD content (vision, requirements, features, success criteria)
   * @returns Executive summary
   */
  async generateExecutiveSummary(prdContent: PRDContent): Promise<ExecutiveSummary> {
    const startTime = Date.now();
    this.log('generateExecutiveSummary', `prdContent provided`);

    try {
      // Build prompt
      const prompt = `${this.persona.systemPrompt}

${this.persona.specializedPrompts.executiveSummary}

PRD Content:
${JSON.stringify(prdContent, null, 2)}

Generate a concise executive summary (1-2 paragraphs). Use clear, non-technical language. Return JSON with:
{
  "summary": "1-2 paragraph executive summary for stakeholders",
  "keyMetrics": ["Metric 1", "Metric 2", "Metric 3"],
  "businessImpact": "Expected business impact",
  "roi": "ROI indicators and projections"
}`;

      // Invoke LLM with retry logic
      const response = await this.invokeWithRetry(prompt);

      // Parse response
      const summary = this.parseJSONResponse<ExecutiveSummary>(response, 'generateExecutiveSummary');

      // Validate required fields
      if (!summary.summary || !summary.keyMetrics || !summary.businessImpact || !summary.roi) {
        throw new Error('Missing required fields in ExecutiveSummary response');
      }

      // Validate summary length (should be concise)
      if (summary.summary.length > 1000) {
        throw new Error('Executive summary should be concise (<1000 chars)');
      }

      const duration = Date.now() - startTime;
      this.log('generateExecutiveSummary', `completed in ${duration}ms -> summary generated (${summary.summary.length} chars)`);

      return summary;
    } catch (error: any) {
      this.log('generateExecutiveSummary', `ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invoke LLM with exponential backoff retry logic
   *
   * @param prompt - Prompt to send to LLM
   * @returns LLM response
   */
  private async invokeWithRetry(prompt: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < JohnAgent.MAX_RETRIES; attempt++) {
      try {
        const options: InvokeOptions = {
          temperature: this.temperature,
          max_tokens: 4000
        };

        return await this.llmClient.invoke(prompt, options);
      } catch (error: any) {
        lastError = error;

        // Don't retry on validation errors or non-retryable errors
        if (error.message.includes('Invalid') || error.message.includes('validation')) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < JohnAgent.MAX_RETRIES - 1) {
          const backoffMs = JohnAgent.INITIAL_BACKOFF * Math.pow(2, attempt);
          this.log('invokeWithRetry', `Retry attempt ${attempt + 1}/${JohnAgent.MAX_RETRIES} after ${backoffMs}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw new Error(`LLM API failure after ${JohnAgent.MAX_RETRIES} retries: ${lastError?.message}`);
  }

  /**
   * Parse JSON response from LLM
   *
   * @param response - Raw LLM response
   * @param method - Method name for error messages
   * @returns Parsed JSON object
   */
  private parseJSONResponse<T>(response: string, method: string): T {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

      return JSON.parse(jsonString);
    } catch (error: any) {
      throw new Error(`Invalid JSON response from ${method}: ${error.message}`);
    }
  }

  /**
   * Log structured message
   *
   * Format: [JohnAgent] method(inputSize) -> result
   *
   * @param method - Method name
   * @param message - Log message
   */
  private log(method: string, message: string): void {
    console.log(`[JohnAgent] ${method}: ${message}`);
  }
}
