import { LLMFactory } from '../llm/LLMFactory.js';
import { LLMConfig } from '../types/llm.types.js';
import { EventEmitter } from 'events';

/**
 * Decision type classification
 */
export type DecisionType = 'technical' | 'ux' | 'product' | 'innovation';

/**
 * CIS agent identifier
 */
export type CISAgent = 'dr-quinn' | 'maya' | 'sophia' | 'victor';

/**
 * Project context for CIS decision routing
 */
export interface ProjectContext {
  name: string;
  level: number;
  techStack: string[];
  domain: string;
}

/**
 * CIS decision request
 * Sent to CIS agent router when Winston encounters low-confidence decision
 */
export interface CISDecisionRequest {
  /** The architectural question/decision to make */
  decision: string;

  /** Architectural context (PRD excerpt, constraints, etc.) */
  context: string;

  /** Type of decision */
  decisionType: DecisionType;

  /** Winston's confidence score (0-1) */
  confidence: number;

  /** Decision urgency level */
  urgency: 'low' | 'medium' | 'high';

  /** Project context information */
  projectContext: ProjectContext;
}

/**
 * CIS agent response
 * Returned by CIS agent after analyzing decision
 */
export interface CISResponse {
  /** CIS agent that handled the decision */
  agent: CISAgent;

  /** Recommended decision/approach */
  recommendation: string;

  /** Rationale for recommendation */
  rationale: string;

  /** Framework used by CIS agent */
  framework: string;

  /** CIS agent's confidence in recommendation (0-1) */
  confidence: number;

  /** Alternative approaches considered (optional) */
  alternatives?: string[];

  /** User impact assessment (Maya only) */
  userImpact?: string;

  /** Narrative elements (Sophia only) */
  narrativeElements?: string[];

  /** Disruption potential (Victor only) */
  disruptionPotential?: string;

  /** Response timestamp */
  timestamp: Date;
}

/**
 * CIS invocation history entry
 */
interface CISInvocation {
  agent: CISAgent;
  decision: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

/**
 * CISAgentRouter routes low-confidence architectural decisions to specialized
 * CIS agents (Dr. Quinn, Maya, Sophia, Victor) for framework-based analysis.
 *
 * Key Features:
 * - Automatic decision type classification
 * - Confidence threshold enforcement (<0.70)
 * - Invocation limit (max 3 per workflow)
 * - Graceful error handling and fallback
 * - Timeout protection (60s per invocation)
 *
 * Usage:
 * ```typescript
 * const router = new CISAgentRouter(llmFactory, llmConfig);
 * const response = await router.routeDecision(request);
 * ```
 */
export class CISAgentRouter extends EventEmitter {
  private readonly llmFactory: LLMFactory;
  private readonly llmConfig: LLMConfig;
  private readonly maxInvocations: number;
  private readonly timeoutMs: number;

  /** Track number of CIS invocations in current workflow */
  private invocationCount: number = 0;

  /** History of CIS invocations */
  private invocationHistory: CISInvocation[] = [];

  /**
   * Decision type classification keywords
   * Used to automatically classify decision type from decision text
   */
  private readonly DECISION_TYPE_KEYWORDS = {
    technical: [
      'architecture',
      'pattern',
      'technology',
      'framework',
      'database',
      'scalability',
      'performance',
      'microservices',
      'monolith',
      'API',
      'REST',
      'GraphQL',
      'cache',
      'queue'
    ],
    ux: [
      'user',
      'interface',
      'experience',
      'rendering',
      'SPA',
      'MPA',
      'real-time',
      'interaction',
      'client',
      'frontend',
      'UI',
      'UX',
      'design',
      'responsive'
    ],
    product: [
      'audience',
      'feature',
      'scope',
      'MVP',
      'prioritization',
      'product',
      'positioning',
      'market fit',
      'roadmap',
      'customer',
      'target'
    ],
    innovation: [
      'differentiation',
      'competitive',
      'disruptive',
      'novel',
      'innovation',
      'opportunity',
      'unique',
      'breakthrough',
      'disruption',
      'market',
      'strategy'
    ]
  };

  constructor(
    llmFactory: LLMFactory,
    llmConfig: LLMConfig,
    options: {
      maxInvocations?: number;
      timeoutMs?: number;
    } = {}
  ) {
    super();
    this.llmFactory = llmFactory;
    this.llmConfig = llmConfig;
    this.maxInvocations = options.maxInvocations || 3;
    this.timeoutMs = options.timeoutMs || 60000; // 60 seconds
  }

  /**
   * Route decision to appropriate CIS agent
   *
   * @param request - CIS decision request
   * @returns CIS agent response with recommendation
   * @throws Error if invocation limit exceeded
   */
  async routeDecision(request: CISDecisionRequest): Promise<CISResponse> {
    console.log('[CISAgentRouter] Routing decision:', request.decision);
    console.log(`[CISAgentRouter] Decision type: ${request.decisionType}, Confidence: ${request.confidence}`);

    // Check invocation limit
    if (this.invocationCount >= this.maxInvocations) {
      const error = `CIS invocation limit exceeded (${this.maxInvocations}). Queue for user escalation.`;
      console.error(`[CISAgentRouter] ${error}`);
      this.emit('cis.limit_exceeded', {
        decision: request.decision,
        count: this.invocationCount,
        limit: this.maxInvocations
      });
      throw new Error(error);
    }

    // Route to appropriate CIS agent based on decision type
    let agent: CISAgent;
    let response: CISResponse;

    try {
      switch (request.decisionType) {
        case 'technical':
          agent = 'dr-quinn';
          response = await this.invokeDrQuinn(request.decision, request.context);
          break;

        case 'ux':
          agent = 'maya';
          response = await this.invokeMaya(request.decision, request.context);
          break;

        case 'product':
          agent = 'sophia';
          response = await this.invokeSophia(request.decision, request.context);
          break;

        case 'innovation':
          agent = 'victor';
          response = await this.invokeVictor(request.decision, request.context);
          break;

        default:
          throw new Error(`Unknown decision type: ${request.decisionType}`);
      }

      // Track successful invocation
      this.invocationCount++;
      this.invocationHistory.push({
        agent,
        decision: request.decision,
        timestamp: new Date(),
        success: true
      });

      console.log(`[CISAgentRouter] CIS agent ${agent} invoked successfully (${this.invocationCount}/${this.maxInvocations})`);
      this.emit('cis.success', {
        agent,
        decision: request.decision,
        count: this.invocationCount
      });

      return response;
    } catch (error) {
      // Track failed invocation - determine agent from decision type if not assigned yet
      const failedAgent: CISAgent = agent! ?? this.getAgentFromDecisionType(request.decisionType);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.invocationHistory.push({
        agent: failedAgent,
        decision: request.decision,
        timestamp: new Date(),
        success: false,
        error: errorMessage
      });

      console.error(`[CISAgentRouter] CIS invocation failed:`, error);
      this.emit('cis.error', {
        agent: failedAgent,
        decision: request.decision,
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Get CIS agent identifier from decision type
   * Helper method to safely map decision types to agents
   */
  private getAgentFromDecisionType(decisionType: DecisionType): CISAgent {
    const mapping: Record<DecisionType, CISAgent> = {
      technical: 'dr-quinn',
      ux: 'maya',
      product: 'sophia',
      innovation: 'victor'
    };
    return mapping[decisionType];
  }

  /**
   * Classify decision type based on keywords
   *
   * @param decision - Decision text to classify
   * @returns Decision type classification
   */
  classifyDecisionType(decision: string): DecisionType {
    const decisionLower = decision.toLowerCase();

    // Count keyword matches for each type
    const scores: Record<DecisionType, number> = {
      technical: 0,
      ux: 0,
      product: 0,
      innovation: 0
    };

    for (const [type, keywords] of Object.entries(this.DECISION_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (decisionLower.includes(keyword.toLowerCase())) {
          scores[type as DecisionType]++;
        }
      }
    }

    // Return type with highest score
    const sortedTypes = (Object.entries(scores) as [DecisionType, number][]).sort(
      ([, scoreA], [, scoreB]) => scoreB - scoreA
    );

    const topEntry = sortedTypes[0];
    if (!topEntry) {
      console.log('[CISAgentRouter] No score entries found, defaulting to technical');
      return 'technical';
    }

    const [topType, topScore] = topEntry;

    // Default to 'technical' if no clear match
    if (topScore === 0) {
      console.log('[CISAgentRouter] No keyword match, defaulting to technical');
      return 'technical';
    }

    console.log(`[CISAgentRouter] Classified as ${topType} (score: ${topScore})`);
    return topType;
  }

  /**
   * Invoke Dr. Quinn for technical architecture trade-offs
   *
   * Uses: Creative Problem Solving, TRIZ, Systems Thinking, First Principles
   * Examples: Monolith vs microservices, SQL vs NoSQL, sync vs async
   *
   * @param problem - Technical architecture problem
   * @param context - Architectural context
   * @returns CIS response with technical recommendation
   */
  private async invokeDrQuinn(problem: string, context: string): Promise<CISResponse> {
    console.log('[CISAgentRouter] Invoking Dr. Quinn for technical decision');

    // Create prompt for Dr. Quinn
    const prompt = `You are Dr. Quinn, a creative problem-solving expert using frameworks like TRIZ, Systems Thinking, and First Principles Analysis.

**Technical Architecture Decision:**
${problem}

**Context:**
${context}

Please analyze this technical trade-off and provide:
1. Recommendation (which option to choose)
2. Rationale (framework-based analysis)
3. Framework used (which methodology guided your analysis)
4. Confidence (0-1, how confident are you)
5. Alternatives (other approaches considered)

Format your response as JSON:
{
  "recommendation": "...",
  "rationale": "...",
  "framework": "...",
  "confidence": 0.X,
  "alternatives": ["...", "..."]
}`;

    try {
      const llm = await this.llmFactory.createClient(this.llmConfig);
      const responseText = await Promise.race([
        llm.invoke(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('CIS invocation timeout')), this.timeoutMs)
        )
      ]);

      // Parse JSON response
      const parsed = this.parseJSONResponse(responseText);

      return {
        agent: 'dr-quinn',
        recommendation: parsed.recommendation || 'No recommendation provided',
        rationale: parsed.rationale || 'No rationale provided',
        framework: parsed.framework || 'Creative Problem Solving',
        confidence: parsed.confidence || 0.75,
        alternatives: parsed.alternatives || [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[CISAgentRouter] Dr. Quinn invocation failed:', error);
      throw error;
    }
  }

  /**
   * Invoke Maya for UX-centric architecture decisions
   *
   * Uses: Design Thinking, User-Centered Design, Empathy Mapping
   * Examples: SPA vs MPA, client-side vs server-side rendering, real-time updates
   *
   * @param designQuestion - UX-related architecture question
   * @param context - Architectural context
   * @returns CIS response with UX-centric recommendation
   */
  private async invokeMaya(designQuestion: string, context: string): Promise<CISResponse> {
    console.log('[CISAgentRouter] Invoking Maya for UX decision');

    const prompt = `You are Maya, a Design Thinking expert focused on user-centered design and empathetic problem-solving.

**UX Architecture Decision:**
${designQuestion}

**Context:**
${context}

Please analyze this UX-centric trade-off and provide:
1. Recommendation (which option best serves users)
2. Rationale (Design Thinking framework analysis)
3. Framework used (which methodology guided your analysis)
4. Confidence (0-1, how confident are you)
5. User impact (how this affects user experience)
6. Alternatives (other approaches considered)

Format your response as JSON:
{
  "recommendation": "...",
  "rationale": "...",
  "framework": "...",
  "confidence": 0.X,
  "userImpact": "...",
  "alternatives": ["...", "..."]
}`;

    try {
      const llm = await this.llmFactory.createClient(this.llmConfig);
      const responseText = await Promise.race([
        llm.invoke(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('CIS invocation timeout')), this.timeoutMs)
        )
      ]);

      const parsed = this.parseJSONResponse(responseText);

      return {
        agent: 'maya',
        recommendation: parsed.recommendation || 'No recommendation provided',
        rationale: parsed.rationale || 'No rationale provided',
        framework: parsed.framework || 'Design Thinking',
        confidence: parsed.confidence || 0.75,
        userImpact: parsed.userImpact || 'Impact assessment not provided',
        alternatives: parsed.alternatives || [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[CISAgentRouter] Maya invocation failed:', error);
      throw error;
    }
  }

  /**
   * Invoke Sophia for product narrative and positioning decisions
   *
   * Uses: Storytelling, Narrative Structure, Hero's Journey
   * Examples: Target audience prioritization, feature trade-offs, MVP scope
   *
   * @param narrativeNeed - Product narrative question
   * @param context - Product context
   * @returns CIS response with product narrative recommendation
   */
  private async invokeSophia(narrativeNeed: string, context: string): Promise<CISResponse> {
    console.log('[CISAgentRouter] Invoking Sophia for product decision');

    const prompt = `You are Sophia, a master storyteller using narrative frameworks to craft compelling product stories.

**Product Decision:**
${narrativeNeed}

**Context:**
${context}

Please analyze this product positioning decision and provide:
1. Recommendation (which approach tells the best product story)
2. Rationale (storytelling framework analysis)
3. Framework used (which narrative methodology guided your analysis)
4. Confidence (0-1, how confident are you)
5. Narrative elements (key story elements that support this decision)
6. Alternatives (other approaches considered)

Format your response as JSON:
{
  "recommendation": "...",
  "rationale": "...",
  "framework": "...",
  "confidence": 0.X,
  "narrativeElements": ["...", "...", "..."],
  "alternatives": ["...", "..."]
}`;

    try {
      const llm = await this.llmFactory.createClient(this.llmConfig);
      const responseText = await Promise.race([
        llm.invoke(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('CIS invocation timeout')), this.timeoutMs)
        )
      ]);

      const parsed = this.parseJSONResponse(responseText);

      return {
        agent: 'sophia',
        recommendation: parsed.recommendation || 'No recommendation provided',
        rationale: parsed.rationale || 'No rationale provided',
        framework: parsed.framework || 'Storytelling',
        confidence: parsed.confidence || 0.75,
        narrativeElements: parsed.narrativeElements || [],
        alternatives: parsed.alternatives || [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[CISAgentRouter] Sophia invocation failed:', error);
      throw error;
    }
  }

  /**
   * Invoke Victor for innovation and disruption opportunities
   *
   * Uses: Blue Ocean Strategy, Jobs-to-be-Done, Innovation Canvas
   * Examples: Competitive differentiation, disruptive approaches, novel solutions
   *
   * @param innovationChallenge - Innovation challenge or opportunity
   * @param context - Market/competitive context
   * @returns CIS response with innovation recommendation
   */
  private async invokeVictor(innovationChallenge: string, context: string): Promise<CISResponse> {
    console.log('[CISAgentRouter] Invoking Victor for innovation decision');

    const prompt = `You are Victor, an innovation strategist using Blue Ocean Strategy, Jobs-to-be-Done, and disruption frameworks.

**Innovation Challenge:**
${innovationChallenge}

**Context:**
${context}

Please analyze this innovation opportunity and provide:
1. Recommendation (which approach offers greatest differentiation)
2. Rationale (innovation framework analysis)
3. Framework used (which methodology guided your analysis)
4. Confidence (0-1, how confident are you)
5. Disruption potential (assessment of market impact and differentiation)
6. Alternatives (other approaches considered)

Format your response as JSON:
{
  "recommendation": "...",
  "rationale": "...",
  "framework": "...",
  "confidence": 0.X,
  "disruptionPotential": "...",
  "alternatives": ["...", "..."]
}`;

    try {
      const llm = await this.llmFactory.createClient(this.llmConfig);
      const responseText = await Promise.race([
        llm.invoke(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('CIS invocation timeout')), this.timeoutMs)
        )
      ]);

      const parsed = this.parseJSONResponse(responseText);

      return {
        agent: 'victor',
        recommendation: parsed.recommendation || 'No recommendation provided',
        rationale: parsed.rationale || 'No rationale provided',
        framework: parsed.framework || 'Blue Ocean Strategy',
        confidence: parsed.confidence || 0.75,
        disruptionPotential: parsed.disruptionPotential || 'Potential assessment not provided',
        alternatives: parsed.alternatives || [],
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[CISAgentRouter] Victor invocation failed:', error);
      throw error;
    }
  }

  /**
   * Parse JSON response from CIS agent
   * Handles both clean JSON and JSON embedded in markdown code blocks
   *
   * @param responseText - Raw response text from LLM
   * @returns Parsed JSON object
   */
  private parseJSONResponse(responseText: string): {
    recommendation?: string;
    rationale?: string;
    framework?: string;
    confidence?: number;
    alternatives?: string[];
    userImpact?: string;
    narrativeElements?: string[];
    disruptionPotential?: string;
  } {
    try {
      // Try direct JSON parse first
      return JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try finding JSON object in text
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      console.warn('[CISAgentRouter] Could not parse JSON from response, returning empty object');
      return {};
    }
  }

  /**
   * Get current invocation count
   */
  getInvocationCount(): number {
    return this.invocationCount;
  }

  /**
   * Get invocation history
   */
  getInvocationHistory(): CISInvocation[] {
    return [...this.invocationHistory];
  }

  /**
   * Reset invocation tracking (for new workflow)
   */
  reset(): void {
    this.invocationCount = 0;
    this.invocationHistory = [];
    console.log('[CISAgentRouter] Invocation tracking reset');
  }
}
