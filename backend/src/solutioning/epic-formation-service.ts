/**
 * Epic Formation Service
 *
 * Analyzes PRD functional requirements and forms 3-8 epics with business value focus.
 * Uses Bob agent to identify natural feature groupings and create independently valuable epics.
 *
 * @module solutioning/epic-formation-service
 * @see docs/stories/4-4-epic-formation-story-decomposition-combined.md
 */

import { Epic } from './types.js';
import { validateEpic } from './schemas.js';
import { SolutioningAgentContextBuilder, AgentContext } from './context-builder.js';
import { loadBobLLMConfig } from './bob-llm-config.js';
import { LLMFactory } from '../llm/LLMFactory.js';
import { LLMError, LLMErrorType } from '../types/llm.types.js';

/**
 * Epic formation response from Bob agent LLM
 */
interface EpicFormationResponse {
  epics: Epic[];
  confidence: number;
  reasoning: string;
}

/**
 * Epic formation metrics
 */
export interface EpicFormationMetrics {
  totalEpics: number;
  executionTimeMs: number;
  llmTokensUsed: number;
  confidence: number;
  lowConfidenceDecisions: string[];
}

/**
 * Epic Formation Service
 *
 * Invokes Bob agent to analyze PRD requirements and form 3-8 epics with:
 * - Business value naming (not technical components)
 * - Independent value and completability in 1-2 sprints
 * - Natural feature groupings (auth, payments, admin, etc.)
 *
 * @example
 * ```typescript
 * const service = new EpicFormationService();
 * const result = await service.formEpicsFromPRD(prdContent, archContent);
 * console.log(`Formed ${result.epics.length} epics with confidence ${result.confidence}`);
 * ```
 */
export class EpicFormationService {
  private contextBuilder: SolutioningAgentContextBuilder;
  private llmFactory: LLMFactory;

  constructor() {
    this.contextBuilder = new SolutioningAgentContextBuilder();
    this.llmFactory = new LLMFactory();
  }

  /**
   * Form epics from PRD functional requirements
   *
   * Workflow:
   * 1. Build Bob agent context (PRD + architecture, optimized to <30k tokens)
   * 2. Generate epic formation prompt
   * 3. Invoke Bob agent LLM with retry logic
   * 4. Parse JSON response to extract Epic objects
   * 5. Validate each epic against Epic schema
   * 6. Check confidence scoring (threshold: 0.75)
   * 7. Return Epic[] array with metrics
   *
   * @param prd PRD markdown content
   * @param architecture Architecture markdown content
   * @returns Promise resolving to epic formation result with metrics
   * @throws Error if epic formation fails after retries or validation fails
   *
   * @example
   * ```typescript
   * const service = new EpicFormationService();
   * const result = await service.formEpicsFromPRD(prdContent, archContent);
   * // result.epics = [{ id: "epic-1", title: "User Authentication", ... }]
   * // result.metrics = { totalEpics: 5, confidence: 0.88, ... }
   * ```
   */
  async formEpicsFromPRD(
    prd: string,
    architecture: string
  ): Promise<{ epics: Epic[]; metrics: EpicFormationMetrics }> {
    const startTime = Date.now();

    // Build Bob agent context
    const context = await this.contextBuilder.buildBobContext(prd, architecture);

    // Generate epic formation prompt
    const prompt = this.contextBuilder.bobEpicFormationPrompt(context);

    // Invoke Bob agent with retry logic
    const response = await this.invokeWithRetry(context, prompt);

    // Parse and validate response
    const { epics, confidence, reasoning } = this.parseEpicFormationResponse(response);

    // Validate each epic against schema
    const validatedEpics = this.validateEpics(epics);

    // Check confidence threshold
    const lowConfidenceDecisions: string[] = [];
    if (confidence < context.constraints.confidenceThreshold) {
      lowConfidenceDecisions.push(
        `Epic formation confidence ${confidence.toFixed(2)} below threshold ${context.constraints.confidenceThreshold}. Reasoning: ${reasoning}`
      );
      console.warn(
        `[EpicFormationService] Low confidence (${confidence.toFixed(2)}): ${reasoning}`
      );
    }

    // Validate epic count (3-8 epics)
    if (validatedEpics.length < 3 || validatedEpics.length > 8) {
      throw new Error(
        `Epic formation produced ${validatedEpics.length} epics (expected 3-8). ` +
        `Consider adjusting PRD scope or epic granularity.`
      );
    }

    const executionTimeMs = Date.now() - startTime;

    // Estimate token usage (rough approximation: prompt + response / 4)
    const llmTokensUsed = Math.ceil((prompt.length + response.length) / 4);

    const metrics: EpicFormationMetrics = {
      totalEpics: validatedEpics.length,
      executionTimeMs,
      llmTokensUsed,
      confidence,
      lowConfidenceDecisions
    };

    console.log(
      `[EpicFormationService] Formed ${validatedEpics.length} epics in ${executionTimeMs}ms ` +
      `(confidence: ${confidence.toFixed(2)}, tokens: ${llmTokensUsed})`
    );

    return { epics: validatedEpics, metrics };
  }

  /**
   * Invoke Bob agent LLM with retry logic
   *
   * Retries up to 3 times with exponential backoff for transient errors
   * (network failures, rate limiting, timeouts).
   *
   * @param context Agent context for LLM configuration
   * @param prompt Epic formation prompt
   * @returns Promise resolving to LLM response text
   * @throws Error if all retries fail or permanent error encountered
   */
  private async invokeWithRetry(_context: AgentContext, prompt: string): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Load Bob LLM config
        const llmConfig = await loadBobLLMConfig();

        // Create LLM client
        const llmClient = await this.llmFactory.createClient(llmConfig);

        // Invoke LLM
        const response = await llmClient.invoke(prompt, {
          temperature: 0.3, // Low temperature for consistent, formulaic epic formation
          max_tokens: 8000,  // Enough for 3-8 epics with full details
          system_prompt: 'You are Bob, a Scrum Master expert in epic formation and story decomposition.'
        });

        // Success - return response
        return response;
      } catch (error) {
        lastError = error as Error;

        // Check error type
        if (error instanceof LLMError) {
          // Permanent errors - don't retry
          if (
            error.errorType === LLMErrorType.AUTH ||
            error.errorType === LLMErrorType.CONFIG ||
            error.errorType === LLMErrorType.PERMANENT
          ) {
            throw error;
          }

          // Transient errors - retry with exponential backoff
          if (error.errorType === LLMErrorType.TRANSIENT) {
            if (attempt < maxRetries) {
              const backoffMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.warn(
                `[EpicFormationService] LLM invocation failed (attempt ${attempt}/${maxRetries}). ` +
                `Retrying in ${backoffMs}ms... Error: ${error.message}`
              );
              await this.sleep(backoffMs);
              continue;
            }
          }
        }

        // Unknown error or last retry - throw
        if (attempt === maxRetries) {
          throw new Error(
            `Epic formation failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
          );
        }

        // Retry with backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `[EpicFormationService] Epic formation attempt ${attempt}/${maxRetries} failed. ` +
          `Retrying in ${backoffMs}ms... Error: ${lastError?.message}`
        );
        await this.sleep(backoffMs);
      }
    }

    // Should never reach here, but TypeScript requires it
    throw new Error(`Epic formation failed: ${lastError?.message}`);
  }

  /**
   * Parse epic formation response from Bob agent LLM
   *
   * Expected JSON format:
   * ```json
   * {
   *   "epics": [
   *     { "id": "epic-1", "title": "User Authentication", ... }
   *   ],
   *   "confidence": 0.85,
   *   "reasoning": "High confidence - Clear authentication requirements"
   * }
   * ```
   *
   * @param response Raw LLM response text
   * @returns Parsed epic formation response
   * @throws Error if response is not valid JSON or missing required fields
   */
  private parseEpicFormationResponse(response: string): EpicFormationResponse {
    try {
      // Extract JSON from response (LLM may wrap in markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                        response.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = (jsonMatch && jsonMatch[1]) ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonStr.trim()) as EpicFormationResponse;

      // Validate required fields
      if (!parsed.epics || !Array.isArray(parsed.epics)) {
        throw new Error('Response missing "epics" array');
      }
      if (typeof parsed.confidence !== 'number') {
        throw new Error('Response missing "confidence" number');
      }
      if (typeof parsed.reasoning !== 'string') {
        throw new Error('Response missing "reasoning" string');
      }

      return parsed;
    } catch (error) {
      throw new Error(
        `Failed to parse epic formation response: ${(error as Error).message}. ` +
        `Response: ${response.substring(0, 500)}...`
      );
    }
  }

  /**
   * Validate epics against Epic schema
   *
   * Ensures each epic has valid structure and required fields.
   * Adds default empty stories array if not present (will be populated by story decomposition).
   *
   * @param epics Array of epic objects to validate
   * @returns Array of validated Epic objects
   * @throws Error if any epic fails schema validation
   */
  private validateEpics(epics: Epic[]): Epic[] {
    const validated: Epic[] = [];

    for (const epic of epics) {
      // Ensure stories array exists (may be empty initially)
      if (!epic.stories) {
        epic.stories = [];
      }

      // Validate against Epic schema
      const validationResult = validateEpic(epic);

      if (!validationResult.pass) {
        throw new Error(
          `Epic "${epic.id}" failed schema validation: ${validationResult.blockers.join(', ')}`
        );
      }

      validated.push(epic);
    }

    return validated;
  }

  /**
   * Sleep for specified milliseconds (for retry backoff)
   *
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
