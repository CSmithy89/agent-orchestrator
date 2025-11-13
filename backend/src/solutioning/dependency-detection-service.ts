/**
 * Dependency Detection Service
 *
 * Detects technical dependencies between stories using Bob agent analysis.
 * Analyzes patterns: data models → logic, auth → protected features, API → frontend.
 * Marks hard vs soft dependencies and blocking status.
 *
 * @module solutioning/dependency-detection-service
 * @see docs/stories/4-5-dependency-detection-graph-generation-combined.md
 */

import { Story, DependencyEdge } from './types.js';
import { SolutioningAgentContextBuilder } from './context-builder.js';
import { loadBobLLMConfig } from './bob-llm-config.js';
import { LLMFactory } from '../llm/LLMFactory.js';

/**
 * Metrics for dependency detection execution
 */
export interface DependencyDetectionMetrics {
  /** Total execution time in milliseconds */
  executionTimeMs: number;

  /** Total LLM tokens used (estimated) */
  llmTokensUsed: number;

  /** Total number of dependencies detected */
  totalDependencies: number;

  /** Number of hard (blocking) dependencies */
  hardDependencies: number;

  /** Number of soft (suggested) dependencies */
  softDependencies: number;

  /** Confidence score from Bob agent (0.0-1.0) */
  confidence: number;

  /** Reasoning for confidence score */
  reasoning: string;
}

/**
 * Result of dependency detection with edges and metrics
 */
export interface DependencyDetectionResult {
  /** Detected dependency edges */
  edges: DependencyEdge[];

  /** Execution metrics */
  metrics: DependencyDetectionMetrics;
}

/**
 * LLM response structure for dependency detection
 */
interface DependencyDetectionResponse {
  dependencies: Array<{
    from: string;
    to: string;
    type: 'hard' | 'soft';
    blocking: boolean;
    reasoning: string;
  }>;
  confidence: number;
  reasoning: string;
}

/**
 * Dependency Detection Service
 *
 * Invokes Bob agent to detect technical dependencies between stories.
 * Analyzes patterns like data models before logic, auth before features.
 * Returns validated DependencyEdge[] array with metrics.
 *
 * @example
 * ```typescript
 * const service = new DependencyDetectionService();
 * const result = await service.detectDependencies(stories);
 * console.log(`Detected ${result.edges.length} dependencies`);
 * console.log(`Hard: ${result.metrics.hardDependencies}, Soft: ${result.metrics.softDependencies}`);
 * ```
 */
export class DependencyDetectionService {
  private contextBuilder: SolutioningAgentContextBuilder;

  constructor() {
    this.contextBuilder = new SolutioningAgentContextBuilder();
  }

  /**
   * Detect dependencies between stories using Bob agent
   *
   * Workflow:
   * 1. Build Bob agent context with PRD, architecture, and stories
   * 2. Generate dependency detection prompt
   * 3. Invoke Bob agent via LLM with retry logic
   * 4. Parse JSON response from LLM
   * 5. Validate each DependencyEdge against schema
   * 6. Validate story IDs exist in stories array
   * 7. Return DependencyDetectionResult with edges and metrics
   *
   * Performance: <30 seconds for 20-30 stories
   *
   * @param stories Array of stories to analyze for dependencies
   * @param prd PRD content for context
   * @param architecture Architecture content for context
   * @returns Promise resolving to DependencyDetectionResult
   * @throws Error if LLM invocation fails after retries or validation fails
   *
   * @example
   * ```typescript
   * const result = await service.detectDependencies(stories, prd, architecture);
   * const graph = generateGraph(stories, result.edges);
   * ```
   */
  async detectDependencies(
    stories: Story[],
    prd: string,
    architecture: string
  ): Promise<DependencyDetectionResult> {
    const startTime = Date.now();

    console.log('[DependencyDetectionService] Starting dependency detection...');
    console.log(`[DependencyDetectionService] Analyzing ${stories.length} stories for dependencies`);

    // Build Bob agent context
    const context = await this.contextBuilder.buildBobContext(prd, architecture);

    // Generate dependency detection prompt
    const prompt = this.contextBuilder.bobDependencyDetectionPrompt(context, stories);

    // Invoke Bob agent with retry logic
    const response = await this.invokeBobAgent(prompt);

    // Parse response
    const parsedResponse = this.parseResponse(response);

    // Validate dependencies
    const edges = this.validateDependencies(parsedResponse.dependencies, stories);

    // Calculate metrics
    const executionTimeMs = Date.now() - startTime;
    const hardDependencies = edges.filter(e => e.type === 'hard').length;
    const softDependencies = edges.filter(e => e.type === 'soft').length;

    const metrics: DependencyDetectionMetrics = {
      executionTimeMs,
      llmTokensUsed: this.estimateTokenUsage(prompt, response),
      totalDependencies: edges.length,
      hardDependencies,
      softDependencies,
      confidence: parsedResponse.confidence,
      reasoning: parsedResponse.reasoning
    };

    console.log(
      `[DependencyDetectionService] Detected ${edges.length} dependencies ` +
      `(${hardDependencies} hard, ${softDependencies} soft) in ${executionTimeMs}ms`
    );
    console.log(`[DependencyDetectionService] Confidence: ${parsedResponse.confidence.toFixed(2)}`);

    return { edges, metrics };
  }

  /**
   * Invoke Bob agent via LLM with retry logic
   *
   * Retry strategy:
   * - 3 attempts with exponential backoff (2s, 4s, 8s)
   * - No retry for permanent errors (auth, config)
   *
   * @param prompt Dependency detection prompt
   * @returns Promise resolving to LLM response text
   * @throws Error if all retry attempts fail
   */
  private async invokeBobAgent(prompt: string): Promise<string> {
    const llmConfig = await loadBobLLMConfig();
    const llmFactory = new LLMFactory();
    const llmClient = await llmFactory.createClient(llmConfig);

    const maxRetries = 3;
    const retryDelays = [2000, 4000, 8000]; // Exponential backoff

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(
          `[DependencyDetectionService] Invoking Bob agent (attempt ${attempt + 1}/${maxRetries})...`
        );

        const response = await llmClient.invoke(prompt, {
          temperature: 0.3,
          max_tokens: 8000
        });

        console.log('[DependencyDetectionService] Bob agent invocation successful');
        return response;

      } catch (error) {
        const errorMessage = (error as Error).message;

        // Don't retry on permanent errors
        if (
          errorMessage.includes('authentication') ||
          errorMessage.includes('authorization') ||
          errorMessage.includes('api_key') ||
          errorMessage.includes('Unknown provider')
        ) {
          throw new Error(
            `[DependencyDetectionService] Permanent error - no retry: ${errorMessage}`
          );
        }

        // Last attempt - throw error
        if (attempt === maxRetries - 1) {
          throw new Error(
            `[DependencyDetectionService] Failed after ${maxRetries} attempts: ${errorMessage}`
          );
        }

        // Wait before retry
        const delay = retryDelays[attempt] || 2000;
        console.warn(
          `[DependencyDetectionService] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${errorMessage}`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('[DependencyDetectionService] All retry attempts failed');
  }

  /**
   * Parse LLM response to extract dependency detection result
   *
   * Handles:
   * - JSON in markdown code blocks (```json ... ```)
   * - Raw JSON response
   * - Validation of response structure
   *
   * @param response LLM response text
   * @returns Parsed DependencyDetectionResponse
   * @throws Error if response cannot be parsed or is invalid
   */
  private parseResponse(response: string): DependencyDetectionResponse {
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonText = (jsonMatch && jsonMatch[1]) ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonText.trim());

      // Validate response structure
      if (!parsed.dependencies || !Array.isArray(parsed.dependencies)) {
        throw new Error('Response missing "dependencies" array');
      }

      if (typeof parsed.confidence !== 'number') {
        throw new Error('Response missing "confidence" number');
      }

      if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
        throw new Error('Response missing "reasoning" string');
      }

      return parsed as DependencyDetectionResponse;

    } catch (error) {
      throw new Error(
        `Failed to parse dependency detection response: ${(error as Error).message}. ` +
        `Response: ${response.substring(0, 500)}`
      );
    }
  }

  /**
   * Validate dependencies against schema and story IDs
   *
   * Validates:
   * - All required fields present (from, to, type, blocking)
   * - Story IDs exist in stories array
   * - Type is 'hard' or 'soft'
   * - Blocking is boolean
   *
   * @param dependencies Raw dependencies from LLM response
   * @param stories Array of stories for ID validation
   * @returns Validated DependencyEdge[] array
   * @throws Error if validation fails
   */
  private validateDependencies(
    dependencies: Array<{
      from: string;
      to: string;
      type: 'hard' | 'soft';
      blocking: boolean;
      reasoning: string;
    }>,
    stories: Story[]
  ): DependencyEdge[] {
    const storyIds = new Set(stories.map(s => s.id));
    const validatedEdges: DependencyEdge[] = [];

    for (const dep of dependencies) {
      // Validate required fields
      if (!dep.from || typeof dep.from !== 'string') {
        throw new Error(`Dependency missing valid "from" field: ${JSON.stringify(dep)}`);
      }

      if (!dep.to || typeof dep.to !== 'string') {
        throw new Error(`Dependency missing valid "to" field: ${JSON.stringify(dep)}`);
      }

      if (dep.type !== 'hard' && dep.type !== 'soft') {
        throw new Error(
          `Dependency has invalid "type" (must be "hard" or "soft"): ${JSON.stringify(dep)}`
        );
      }

      if (typeof dep.blocking !== 'boolean') {
        throw new Error(`Dependency missing boolean "blocking" field: ${JSON.stringify(dep)}`);
      }

      // Validate story IDs exist
      if (!storyIds.has(dep.from)) {
        throw new Error(
          `Dependency "from" story ID "${dep.from}" not found in stories array`
        );
      }

      if (!storyIds.has(dep.to)) {
        throw new Error(
          `Dependency "to" story ID "${dep.to}" not found in stories array`
        );
      }

      // Add validated edge (remove reasoning as it's not in DependencyEdge type)
      validatedEdges.push({
        from: dep.from,
        to: dep.to,
        type: dep.type,
        blocking: dep.blocking
      });
    }

    console.log(`[DependencyDetectionService] Validated ${validatedEdges.length} dependency edges`);

    return validatedEdges;
  }

  /**
   * Estimate token usage for LLM invocation
   *
   * Rough estimation: 1 token ≈ 4 characters
   *
   * @param prompt Input prompt
   * @param response LLM response
   * @returns Estimated token count
   */
  private estimateTokenUsage(prompt: string, response: string): number {
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(response.length / 4);
    return inputTokens + outputTokens;
  }
}
