/**
 * DecisionEngine - Autonomous decision making with confidence-based escalation
 *
 * Enables agents to assess their confidence in decisions and escalate to humans
 * when uncertain. Uses a two-tier approach:
 * 1. Check onboarding docs for explicit answers (confidence 0.95)
 * 2. Use LLM reasoning with temperature 0.3 (confidence varies)
 *
 * Escalates when confidence < 0.75 threshold.
 *
 * @example
 * ```typescript
 * const engine = new DecisionEngine(llmFactory, {
 *   provider: 'anthropic',
 *   model: 'claude-sonnet-4-5'
 * });
 *
 * const decision = await engine.attemptAutonomousDecision(
 *   'Should I proceed with this deployment?',
 *   { environment: 'production', changes: 'database schema update' }
 * );
 *
 * if (decision.confidence < 0.75) {
 *   // Escalate to human for review
 *   console.log('Human review required:', decision.reasoning);
 * } else {
 *   // Proceed autonomously
 *   console.log('Autonomous decision:', decision.decision);
 * }
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LLMFactory } from '../../llm/LLMFactory.js';
import { LLMConfig, InvokeOptions } from '../../types/llm.types.js';

/**
 * Decision represents an autonomous decision with confidence scoring
 */
export interface Decision {
  /** Original question requiring decision */
  question: string;

  /** Decision value (varies by question type) */
  decision: unknown;

  /** Confidence score (0.0-1.0), triggers escalation if <0.75 */
  confidence: number;

  /** AI rationale for audit trail */
  reasoning: string;

  /** Source of decision: onboarding doc (0.95) or LLM reasoning (0.3-0.9) */
  source: 'onboarding' | 'llm';

  /** Timestamp when decision was made */
  timestamp: Date;

  /** Relevant context used in decision */
  context: Record<string, unknown>;
}

/**
 * Result from onboarding docs lookup
 */
interface OnboardingResult {
  answer: string;
  confidence: number;
  source: string;
}

/**
 * Result from LLM reasoning
 */
interface LLMReasoningResult {
  value: unknown;
  confidence: number;
  reasoning: string;
}

/**
 * DecisionEngine - Confidence-based autonomous decision making
 *
 * Provides intelligent decision making with automatic escalation when uncertain.
 * Uses onboarding documentation as first-line answers, falling back to LLM
 * reasoning with low temperature for consistency.
 */
export class DecisionEngine {
  /** Confidence threshold below which decisions are escalated to humans */
  private static readonly ESCALATION_THRESHOLD = 0.75;

  /** Temperature setting for LLM reasoning (low for consistency) */
  private static readonly LLM_TEMPERATURE = 0.3;

  /** Confidence level for onboarding doc answers */
  private static readonly ONBOARDING_CONFIDENCE = 0.95;

  /** Path to onboarding documentation directory */
  private readonly onboardingPath: string;

  /** LLM factory for creating reasoning clients */
  private readonly llmFactory: LLMFactory;

  /** LLM configuration for decision reasoning */
  private readonly llmConfig: LLMConfig;

  /**
   * Create a new DecisionEngine
   *
   * @param llmFactory - Factory for creating LLM clients
   * @param llmConfig - Configuration for LLM (provider, model)
   * @param onboardingPath - Path to onboarding docs directory (default: .bmad/onboarding)
   */
  constructor(
    llmFactory: LLMFactory,
    llmConfig: LLMConfig,
    onboardingPath: string = '.bmad/onboarding'
  ) {
    this.llmFactory = llmFactory;
    this.llmConfig = llmConfig;
    this.onboardingPath = onboardingPath;
  }

  /**
   * Attempt an autonomous decision with confidence scoring
   *
   * Decision flow:
   * 1. Check onboarding docs for explicit answer (confidence 0.95)
   * 2. If not found, use LLM reasoning (temp 0.3, confidence varies)
   * 3. If confidence < 0.75, mark for escalation
   * 4. Return Decision with complete audit trail
   *
   * @param question - The question requiring a decision
   * @param context - Relevant context for the decision
   * @returns Decision object with confidence score and reasoning
   */
  async attemptAutonomousDecision(
    question: string,
    context: Record<string, unknown>
  ): Promise<Decision> {
    const timestamp = new Date();

    // Step 1: Check onboarding docs first
    const onboardingResult = await this.checkOnboardingDocs(question);

    if (onboardingResult) {
      // Found explicit answer in onboarding docs
      const decision: Decision = {
        question,
        decision: onboardingResult.answer,
        confidence: onboardingResult.confidence,
        reasoning: `Found explicit answer in onboarding documentation: ${onboardingResult.source}`,
        source: 'onboarding',
        timestamp,
        context
      };

      this.logDecision(decision);
      return decision;
    }

    // Step 2: Use LLM reasoning
    const llmResult = await this.useLLMReasoning(question, context);

    const decision: Decision = {
      question,
      decision: llmResult.value,
      confidence: llmResult.confidence,
      reasoning: llmResult.reasoning,
      source: 'llm',
      timestamp,
      context
    };

    // Step 3: Check if escalation needed
    if (decision.confidence < DecisionEngine.ESCALATION_THRESHOLD) {
      decision.reasoning += ` [ESCALATION REQUIRED: confidence ${decision.confidence.toFixed(2)} < threshold ${DecisionEngine.ESCALATION_THRESHOLD}]`;
    }

    this.logDecision(decision);
    return decision;
  }

  /**
   * Check onboarding documentation for explicit answers
   *
   * Searches the onboarding directory for files containing relevant keywords
   * and explicit answers to the question.
   *
   * @param question - The question to search for
   * @returns OnboardingResult if answer found, null otherwise
   */
  private async checkOnboardingDocs(question: string): Promise<OnboardingResult | null> {
    try {
      // Check if onboarding directory exists
      const stats = await fs.stat(this.onboardingPath);
      if (!stats.isDirectory()) {
        return null;
      }

      // Extract keywords from question for matching
      const keywords = this.extractKeywords(question);

      // Read all files in onboarding directory
      const files = await fs.readdir(this.onboardingPath);

      for (const file of files) {
        // Only process markdown files
        if (!file.endsWith('.md')) {
          continue;
        }

        const filePath = path.join(this.onboardingPath, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Basic keyword matching
        const matchScore = this.calculateMatchScore(content, keywords);

        if (matchScore > 0.5) {
          // Found relevant content
          return {
            answer: content,
            confidence: DecisionEngine.ONBOARDING_CONFIDENCE,
            source: file
          };
        }
      }

      return null;
    } catch (error) {
      // Directory doesn't exist or other error - continue without onboarding docs
      return null;
    }
  }

  /**
   * Use LLM reasoning to make a decision
   *
   * Creates an LLM client with temperature 0.3 for consistent reasoning,
   * asks it to make a decision and assess confidence.
   *
   * @param question - The question to decide on
   * @param context - Relevant context for the decision
   * @returns LLM reasoning result with value, confidence, and reasoning
   */
  private async useLLMReasoning(
    question: string,
    context: Record<string, unknown>
  ): Promise<LLMReasoningResult> {
    // Create LLM client with low temperature for consistency
    const client = await this.llmFactory.createClient(this.llmConfig);

    // Construct prompt for decision + confidence assessment
    const prompt = this.buildDecisionPrompt(question, context);

    const options: InvokeOptions = {
      temperature: DecisionEngine.LLM_TEMPERATURE,
      max_tokens: 1000,
      system_prompt: 'You are an autonomous decision-making assistant. Provide clear decisions with confidence assessments.'
    };

    // Invoke LLM
    const response = await client.invoke(prompt, options);

    // Parse response for decision, confidence, and reasoning
    return this.parseLLMResponse(response);
  }

  /**
   * Build a prompt for LLM decision making
   *
   * @param question - The question to decide on
   * @param context - Relevant context
   * @returns Formatted prompt
   */
  private buildDecisionPrompt(question: string, context: Record<string, unknown>): string {
    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return `Question: ${question}

Context:
${contextStr}

Please provide a decision for this question. In your response, include:
1. Your decision/answer
2. Your confidence level (0.0-1.0)
3. Your reasoning

Format your response as JSON:
{
  "decision": "your decision here",
  "confidence": 0.8,
  "reasoning": "your reasoning here"
}`;
  }

  /**
   * Parse LLM response to extract decision, confidence, and reasoning
   *
   * Assesses confidence based on:
   * - Answer clarity (certainty indicators like "definitely", "clearly")
   * - Context sufficiency (mentions of missing info)
   * - Response length and specificity
   *
   * @param response - Raw LLM response
   * @returns Parsed decision result
   */
  private parseLLMResponse(response: string): LLMReasoningResult {
    try {
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate confidence is in valid range
        let confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

        // Adjust confidence based on answer clarity
        confidence = this.adjustConfidenceByClarity(parsed.decision, parsed.reasoning, confidence);

        return {
          value: parsed.decision,
          confidence,
          reasoning: parsed.reasoning || 'No reasoning provided'
        };
      }
    } catch (error) {
      // Failed to parse JSON - fall back to text analysis
    }

    // Fallback: analyze text for certainty indicators
    const confidence = this.assessConfidenceFromText(response);

    return {
      value: response,
      confidence,
      reasoning: 'Unable to parse structured response, using text analysis'
    };
  }

  /**
   * Adjust confidence based on answer clarity and certainty indicators
   *
   * @param decision - The decision text
   * @param reasoning - The reasoning text
   * @param baseConfidence - Base confidence from LLM
   * @returns Adjusted confidence score
   */
  private adjustConfidenceByClarity(
    decision: unknown,
    reasoning: string,
    baseConfidence: number
  ): number {
    let adjustment = 0;

    const text = `${decision} ${reasoning}`.toLowerCase();

    // High certainty indicators - increase confidence
    const highCertainty = ['definitely', 'clearly', 'certain', 'confident', 'sure'];
    if (highCertainty.some(word => text.includes(word))) {
      adjustment += 0.1;
    }

    // Low certainty indicators - decrease confidence
    const lowCertainty = ['maybe', 'perhaps', 'might', 'possibly', 'unsure', 'unclear'];
    if (lowCertainty.some(word => text.includes(word))) {
      adjustment -= 0.2;
    }

    // Missing context indicators - decrease confidence
    if (text.includes('missing') || text.includes('insufficient') || text.includes('need more')) {
      adjustment -= 0.15;
    }

    // Short answers might indicate less confidence
    if (reasoning.length < 50) {
      adjustment -= 0.05;
    }

    // Constrain to valid range
    return Math.max(0.3, Math.min(0.9, baseConfidence + adjustment));
  }

  /**
   * Assess confidence from text when structured parsing fails
   *
   * @param text - Response text
   * @returns Estimated confidence score
   */
  private assessConfidenceFromText(text: string): number {
    // Handle undefined or null text
    if (!text) {
      return 0.5;
    }

    const lower = text.toLowerCase();

    // Default to medium-low confidence for unparseable responses
    let confidence = 0.5;

    // Check for certainty indicators
    if (lower.includes('definitely') || lower.includes('clearly')) {
      confidence = 0.7;
    } else if (lower.includes('probably') || lower.includes('likely')) {
      confidence = 0.6;
    } else if (lower.includes('maybe') || lower.includes('perhaps')) {
      confidence = 0.4;
    } else if (lower.includes('unsure') || lower.includes('unclear')) {
      confidence = 0.3;
    }

    return confidence;
  }

  /**
   * Extract keywords from question for document matching
   *
   * @param question - The question text
   * @returns Array of keywords
   */
  private extractKeywords(question: string): string[] {
    // Simple keyword extraction: split on whitespace and remove common words
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were',
      'what', 'how', 'when', 'where', 'who', 'why',
      'should', 'could', 'would', 'will', 'can',
      'do', 'does', 'did', 'have', 'has', 'had',
      'be', 'been', 'being', 'am', 'to', 'from',
      'in', 'on', 'at', 'by', 'for', 'with', 'about',
      'as', 'of', 'or', 'and', 'but', 'if', 'then'
    ]);

    return question
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Calculate match score between content and keywords
   *
   * @param content - Document content
   * @param keywords - Keywords to match
   * @returns Match score (0.0-1.0)
   */
  private calculateMatchScore(content: string, keywords: string[]): number {
    const lowerContent = content.toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        matches++;
      }
    }

    return keywords.length > 0 ? matches / keywords.length : 0;
  }

  /**
   * Log decision for audit trail
   *
   * Uses LLMLogger from LLMFactory for consistent logging across the system.
   *
   * @param decision - The decision to log
   */
  private logDecision(decision: Decision): void {
    // Only log in development for now (production logging can be configured separately)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DecisionEngine]', {
        question: decision.question,
        confidence: decision.confidence,
        source: decision.source,
        escalation: decision.confidence < DecisionEngine.ESCALATION_THRESHOLD,
        timestamp: decision.timestamp.toISOString()
      });
    }

    // LLMFactory logger is available for future structured logging needs
    // const logger = this.llmFactory.getLogger();
    // e.g., logger.logDecision(decision) when LLMLogger supports it
  }

  /**
   * Get the escalation threshold
   *
   * @returns Current escalation threshold
   */
  static getEscalationThreshold(): number {
    return DecisionEngine.ESCALATION_THRESHOLD;
  }
}
