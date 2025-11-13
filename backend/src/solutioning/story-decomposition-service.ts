/**
 * Story Decomposition Service
 *
 * Decomposes epics into 3-10 vertical-slice stories with 8-12 acceptance criteria each.
 * Uses Bob agent to create independently valuable stories <500 words, <2 hours development time.
 *
 * @module solutioning/story-decomposition-service
 * @see docs/stories/4-4-epic-formation-story-decomposition-combined.md
 */

import { Epic, Story } from './types.js';
import { validateStory } from './schemas.js';
import { SolutioningAgentContextBuilder, AgentContext } from './context-builder.js';
import { loadBobLLMConfig } from './bob-llm-config.js';
import { LLMFactory } from '../llm/LLMFactory.js';
import { LLMError, LLMErrorType } from '../types/llm.types.js';

/**
 * Story decomposition response from Bob agent LLM
 */
interface StoryDecompositionResponse {
  stories: Story[];
  confidence: number;
  reasoning: string;
}

/**
 * Story decomposition metrics per epic
 */
export interface StoryDecompositionMetrics {
  epicId: string;
  totalStories: number;
  executionTimeMs: number;
  llmTokensUsed: number;
  confidence: number;
  lowConfidenceDecisions: string[];
  oversizedStoriesSplit: number;
}

/**
 * Story Decomposition Service
 *
 * Invokes Bob agent to decompose epic into 3-10 stories with:
 * - User story format: "As a..., I want..., So that..."
 * - Vertical slices (end-to-end functionality)
 * - 8-12 testable acceptance criteria per story
 * - <500 words total (description + ACs + technical notes)
 * - <2 hours development time per story
 *
 * @example
 * ```typescript
 * const service = new StoryDecompositionService();
 * const result = await service.decomposeEpicIntoStories(epic, prdContent, archContent);
 * console.log(`Decomposed epic into ${result.stories.length} stories`);
 * ```
 */
export class StoryDecompositionService {
  private contextBuilder: SolutioningAgentContextBuilder;
  private llmFactory: LLMFactory;

  constructor() {
    this.contextBuilder = new SolutioningAgentContextBuilder();
    this.llmFactory = new LLMFactory();
  }

  /**
   * Decompose epic into vertical-slice stories
   *
   * Workflow:
   * 1. Build Bob agent context with epic-specific context
   * 2. Generate story decomposition prompt
   * 3. Invoke Bob agent LLM with retry logic
   * 4. Parse JSON response to extract Story objects
   * 5. Validate each story against Story schema
   * 6. Check story sizing (<500 words, <2 hours, 8-12 ACs)
   * 7. Split oversized stories if needed
   * 8. Return Story[] array with metrics
   *
   * @param epic Epic to decompose into stories
   * @param prd PRD markdown content
   * @param architecture Architecture markdown content
   * @returns Promise resolving to story decomposition result with metrics
   * @throws Error if story decomposition fails after retries or validation fails
   *
   * @example
   * ```typescript
   * const service = new StoryDecompositionService();
   * const epic = { id: "epic-1", title: "User Authentication", ... };
   * const result = await service.decomposeEpicIntoStories(epic, prd, arch);
   * // result.stories = [{ id: "1-1", title: "User Registration", ... }]
   * ```
   */
  async decomposeEpicIntoStories(
    epic: Epic,
    prd: string,
    architecture: string
  ): Promise<{ stories: Story[]; metrics: StoryDecompositionMetrics }> {
    const startTime = Date.now();

    // Build Bob agent context
    const context = await this.contextBuilder.buildBobContext(prd, architecture);

    // Generate story decomposition prompt
    const prompt = this.contextBuilder.bobStoryDecompositionPrompt(context, epic);

    // Invoke Bob agent with retry logic
    const response = await this.invokeWithRetry(context, prompt);

    // Parse and validate response
    const { stories, confidence, reasoning } = this.parseStoryDecompositionResponse(response);

    // Validate each story against schema and sizing constraints
    const validatedStories = this.validateStories(stories, epic.id);

    // Check for oversized stories and split if needed
    let oversizedStoriesSplit = 0;
    const finalStories: Story[] = [];

    for (const story of validatedStories) {
      const wordCount = this.countWords(story);
      if (wordCount > context.constraints.storyMaxWords || story.estimated_hours > context.constraints.maxEstimatedHours) {
        console.warn(
          `[StoryDecompositionService] Story ${story.id} is oversized ` +
          `(${wordCount} words, ${story.estimated_hours} hours). Splitting...`
        );

        // Split oversized story
        const splitStories = await this.splitOversizedStory(story, context);
        finalStories.push(...splitStories);
        oversizedStoriesSplit++;
      } else {
        finalStories.push(story);
      }
    }

    // Check confidence threshold
    const lowConfidenceDecisions: string[] = [];
    if (confidence < context.constraints.confidenceThreshold) {
      lowConfidenceDecisions.push(
        `Story decomposition confidence ${confidence.toFixed(2)} below threshold ${context.constraints.confidenceThreshold}. Reasoning: ${reasoning}`
      );
      console.warn(
        `[StoryDecompositionService] Low confidence (${confidence.toFixed(2)}): ${reasoning}`
      );
    }

    // Validate story count (3-10 stories per epic)
    if (finalStories.length < 3 || finalStories.length > 10) {
      console.warn(
        `[StoryDecompositionService] Epic ${epic.id} decomposed into ${finalStories.length} stories ` +
        `(expected 3-10). This may indicate scope issues.`
      );
    }

    const executionTimeMs = Date.now() - startTime;

    // Estimate token usage
    const llmTokensUsed = Math.ceil((prompt.length + response.length) / 4);

    const metrics: StoryDecompositionMetrics = {
      epicId: epic.id,
      totalStories: finalStories.length,
      executionTimeMs,
      llmTokensUsed,
      confidence,
      lowConfidenceDecisions,
      oversizedStoriesSplit
    };

    console.log(
      `[StoryDecompositionService] Decomposed epic ${epic.id} into ${finalStories.length} stories ` +
      `in ${executionTimeMs}ms (confidence: ${confidence.toFixed(2)}, tokens: ${llmTokensUsed})`
    );

    return { stories: finalStories, metrics };
  }

  /**
   * Invoke Bob agent LLM with retry logic
   *
   * @param context Agent context for LLM configuration
   * @param prompt Story decomposition prompt
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
          temperature: 0.3, // Low temperature for consistent story decomposition
          max_tokens: 12000, // Enough for 3-10 stories with 8-12 ACs each
          system_prompt: 'You are Bob, a Scrum Master expert in story decomposition and acceptance criteria writing.'
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
              const backoffMs = Math.pow(2, attempt) * 1000;
              console.warn(
                `[StoryDecompositionService] LLM invocation failed (attempt ${attempt}/${maxRetries}). ` +
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
            `Story decomposition failed after ${maxRetries} attempts. Last error: ${lastError?.message}`
          );
        }

        // Retry with backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(
          `[StoryDecompositionService] Story decomposition attempt ${attempt}/${maxRetries} failed. ` +
          `Retrying in ${backoffMs}ms... Error: ${lastError?.message}`
        );
        await this.sleep(backoffMs);
      }
    }

    throw new Error(`Story decomposition failed: ${lastError?.message}`);
  }

  /**
   * Parse story decomposition response from Bob agent LLM
   *
   * @param response Raw LLM response text
   * @returns Parsed story decomposition response
   * @throws Error if response is not valid JSON or missing required fields
   */
  private parseStoryDecompositionResponse(response: string): StoryDecompositionResponse {
    try {
      // Extract JSON from response (LLM may wrap in markdown code blocks)
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                        response.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = (jsonMatch && jsonMatch[1]) ? jsonMatch[1] : response;

      const parsed = JSON.parse(jsonStr.trim()) as StoryDecompositionResponse;

      // Validate required fields
      if (!parsed.stories || !Array.isArray(parsed.stories)) {
        throw new Error('Response missing "stories" array');
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
        `Failed to parse story decomposition response: ${(error as Error).message}. ` +
        `Response: ${response.substring(0, 500)}...`
      );
    }
  }

  /**
   * Validate stories against Story schema
   *
   * @param stories Array of story objects to validate
   * @param epicId Expected epic ID for all stories
   * @returns Array of validated Story objects
   * @throws Error if any story fails schema validation
   */
  private validateStories(stories: Story[], epicId: string): Story[] {
    const validated: Story[] = [];

    for (const story of stories) {
      // Validate epic ID matches
      if (story.epic !== epicId) {
        throw new Error(
          `Story "${story.id}" has mismatched epic ID "${story.epic}" (expected "${epicId}")`
        );
      }

      // Validate against Story schema
      const validationResult = validateStory(story);

      if (!validationResult.pass) {
        throw new Error(
          `Story "${story.id}" failed schema validation: ${validationResult.blockers.join(', ')}`
        );
      }

      // Validate acceptance criteria count (8-12)
      if (story.acceptance_criteria.length < 8 || story.acceptance_criteria.length > 12) {
        throw new Error(
          `Story "${story.id}" has ${story.acceptance_criteria.length} acceptance criteria ` +
          `(expected 8-12). Please adjust story scope.`
        );
      }

      validated.push(story);
    }

    return validated;
  }

  /**
   * Count total words in story (description + ACs + technical notes)
   *
   * @param story Story to count words for
   * @returns Total word count
   */
  private countWords(story: Story): number {
    const description = story.description || '';
    const acs = story.acceptance_criteria.join(' ');
    const techNotes = [
      story.technical_notes.affected_files.join(' '),
      story.technical_notes.endpoints.join(' '),
      story.technical_notes.data_structures.join(' '),
      story.technical_notes.test_requirements
    ].join(' ');

    const totalText = `${description} ${acs} ${techNotes}`;
    return totalText.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Split oversized story into smaller stories
   *
   * Re-invokes Bob agent to split story into 2-3 smaller stories.
   *
   * @param story Oversized story to split
   * @param context Agent context
   * @returns Array of split stories
   */
  private async splitOversizedStory(story: Story, context: AgentContext): Promise<Story[]> {
    const prompt = `# Story Splitting Task

The following story is too large and needs to be split into 2-3 smaller stories:

**Story ID**: ${story.id}
**Title**: ${story.title}
**Description**: ${story.description}

**Acceptance Criteria**:
${story.acceptance_criteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}

**Technical Notes**:
- Files: ${story.technical_notes.affected_files.join(', ')}
- Endpoints: ${story.technical_notes.endpoints.join(', ')}
- Data Structures: ${story.technical_notes.data_structures.join(', ')}

## Constraints
- Split into 2-3 smaller stories
- Each story <${context.constraints.storyMaxWords} words
- Each story <${context.constraints.maxEstimatedHours} hours
- Each story 8-12 acceptance criteria
- Maintain vertical slicing (end-to-end functionality)

## Output Format
Return JSON with split stories:

\`\`\`json
{
  "stories": [
    {
      "id": "${story.id}-part1",
      "epic": "${story.epic}",
      "title": "...",
      "description": "As a..., I want..., So that...",
      "acceptance_criteria": [...],
      "dependencies": ["${story.id}"],
      "status": "backlog",
      "technical_notes": {...},
      "estimated_hours": 1.5,
      "complexity": "low"
    }
  ]
}
\`\`\`

Generate the split stories now.`;

    try {
      const response = await this.invokeWithRetry(context, prompt);
      const { stories: splitStories } = this.parseStoryDecompositionResponse(response);

      // Validate split stories
      const validated = this.validateStories(splitStories, story.epic);

      console.log(
        `[StoryDecompositionService] Successfully split story ${story.id} into ${validated.length} stories`
      );

      return validated;
    } catch (error) {
      console.error(
        `[StoryDecompositionService] Failed to split story ${story.id}: ${(error as Error).message}. ` +
        `Returning original story.`
      );
      // Graceful degradation - return original story
      return [story];
    }
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
