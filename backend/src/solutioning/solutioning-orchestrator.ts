/**
 * Solutioning Orchestrator
 *
 * Coordinates epic formation and story decomposition to generate complete solutioning output.
 * Orchestrates the full workflow: PRD → Epics → Stories with metrics tracking.
 *
 * @module solutioning/solutioning-orchestrator
 * @see docs/stories/4-4-epic-formation-story-decomposition-combined.md
 */

import * as fs from 'fs/promises';
import { Epic, Story, DependencyGraph } from './types.js';
import { EpicFormationService } from './epic-formation-service.js';
import { StoryDecompositionService, StoryDecompositionMetrics } from './story-decomposition-service.js';
import { DependencyDetectionService } from './dependency-detection-service.js';
import { DependencyGraphGenerator } from './dependency-graph-generator.js';

/**
 * Solutioning result with epics, stories, dependency graph, and comprehensive metrics
 */
export interface SolutioningResult {
  /** Array of epics formed from PRD */
  epics: Epic[];

  /** Array of all stories across all epics */
  stories: Story[];

  /** Dependency graph with critical path and bottleneck analysis */
  dependencyGraph: DependencyGraph;

  /** Aggregate metrics for the entire solutioning process */
  metrics: {
    /** Total number of epics formed */
    totalEpics: number;

    /** Total number of stories generated */
    totalStories: number;

    /** Average stories per epic */
    avgStoriesPerEpic: number;

    /** Total execution time in milliseconds */
    executionTimeMs: number;

    /** Total LLM tokens used (estimated) */
    llmTokensUsed: number;

    /** Epic formation confidence score */
    epicFormationConfidence: number;

    /** Average story decomposition confidence across all epics */
    avgStoryDecompositionConfidence: number;

    /** All low-confidence decisions flagged for human review */
    lowConfidenceDecisions: string[];

    /** Number of oversized stories that were split */
    oversizedStoriesSplit: number;

    /** Per-epic metrics */
    epicMetrics: StoryDecompositionMetrics[];

    /** Dependency detection execution time in milliseconds */
    dependencyDetectionTimeMs: number;

    /** Graph generation execution time in milliseconds */
    graphGenerationTimeMs: number;

    /** Total number of dependencies detected */
    totalDependencies: number;

    /** Number of hard (blocking) dependencies */
    hardDependencies: number;

    /** Number of soft (suggested) dependencies */
    softDependencies: number;
  };
}

/**
 * Solutioning Orchestrator
 *
 * Executes the complete solutioning workflow:
 * 1. Read PRD and architecture files from disk
 * 2. Invoke EpicFormationService to form 3-8 epics
 * 3. For each epic, invoke StoryDecompositionService to generate 3-10 stories
 * 4. Aggregate all stories (target: 10-20 total)
 * 5. Track comprehensive metrics (execution time, token usage, confidence scores)
 * 6. Return SolutioningResult with epics, stories, and metrics
 *
 * @example
 * ```typescript
 * const orchestrator = new SolutioningOrchestrator();
 * const result = await orchestrator.executeSolutioning(
 *   'docs/PRD.md',
 *   'docs/architecture.md'
 * );
 * console.log(`Generated ${result.metrics.totalEpics} epics, ${result.metrics.totalStories} stories`);
 * console.log(`Execution time: ${result.metrics.executionTimeMs}ms`);
 * ```
 */
export class SolutioningOrchestrator {
  private epicFormationService: EpicFormationService;
  private storyDecompositionService: StoryDecompositionService;
  private dependencyDetectionService: DependencyDetectionService;
  private dependencyGraphGenerator: DependencyGraphGenerator;

  constructor() {
    this.epicFormationService = new EpicFormationService();
    this.storyDecompositionService = new StoryDecompositionService();
    this.dependencyDetectionService = new DependencyDetectionService();
    this.dependencyGraphGenerator = new DependencyGraphGenerator();
  }

  /**
   * Execute complete solutioning workflow
   *
   * Workflow:
   * 1. Read PRD and architecture files
   * 2. Form epics from PRD (3-8 epics)
   * 3. For each epic, decompose into stories (3-10 stories per epic)
   * 4. Aggregate all stories
   * 5. Calculate comprehensive metrics
   * 6. Return result with epics, stories, and metrics
   *
   * Target metrics:
   * - 10-20 total stories for MVP scope
   * - <45 minutes total execution time
   * - High confidence scores (>0.75)
   *
   * @param prdPath Path to PRD markdown file
   * @param architecturePath Path to architecture markdown file
   * @returns Promise resolving to SolutioningResult
   * @throws Error if files cannot be read or solutioning fails
   *
   * @example
   * ```typescript
   * const orchestrator = new SolutioningOrchestrator();
   * const result = await orchestrator.executeSolutioning(
   *   '/home/user/project/docs/PRD.md',
   *   '/home/user/project/docs/architecture.md'
   * );
   * ```
   */
  async executeSolutioning(
    prdPath: string,
    architecturePath: string
  ): Promise<SolutioningResult> {
    const startTime = Date.now();

    console.log('[SolutioningOrchestrator] Starting solutioning workflow...');

    // Step 1: Read PRD and architecture files
    console.log('[SolutioningOrchestrator] Reading PRD and architecture files...');
    const prd = await this.readFile(prdPath);
    const architecture = await this.readFile(architecturePath);

    // Step 2: Form epics from PRD
    console.log('[SolutioningOrchestrator] Forming epics from PRD...');
    const epicFormationResult = await this.epicFormationService.formEpicsFromPRD(prd, architecture);
    const epics = epicFormationResult.epics;
    const epicFormationMetrics = epicFormationResult.metrics;

    console.log(
      `[SolutioningOrchestrator] Formed ${epics.length} epics in ${epicFormationMetrics.executionTimeMs}ms`
    );

    // Step 3: Decompose each epic into stories
    const allStories: Story[] = [];
    const epicMetrics: StoryDecompositionMetrics[] = [];
    let totalStoryDecompositionConfidence = 0;
    let totalOversizedStoriesSplit = 0;

    for (let i = 0; i < epics.length; i++) {
      const epic = epics[i];
      if (!epic) {
        throw new Error(`Epic at index ${i} is undefined`);
      }

      console.log(
        `[SolutioningOrchestrator] Decomposing epic ${i + 1}/${epics.length}: ${epic.id} - ${epic.title}...`
      );

      const storyDecompositionResult = await this.storyDecompositionService.decomposeEpicIntoStories(
        epic,
        prd,
        architecture
      );

      const stories = storyDecompositionResult.stories;
      const metrics = storyDecompositionResult.metrics;

      // Add stories to epic
      epic.stories = stories;

      // Aggregate stories
      allStories.push(...stories);

      // Track metrics
      epicMetrics.push(metrics);
      totalStoryDecompositionConfidence += metrics.confidence;
      totalOversizedStoriesSplit += metrics.oversizedStoriesSplit;

      console.log(
        `[SolutioningOrchestrator] Epic ${epic.id} decomposed into ${stories.length} stories ` +
        `(confidence: ${metrics.confidence.toFixed(2)})`
      );
    }

    // Step 4: Detect dependencies between stories
    console.log('[SolutioningOrchestrator] Detecting dependencies between stories...');
    const dependencyDetectionStartTime = Date.now();

    let dependencyDetectionResult;
    try {
      dependencyDetectionResult = await this.dependencyDetectionService.detectDependencies(
        allStories,
        prd,
        architecture
      );
    } catch (error) {
      console.error('[SolutioningOrchestrator] Dependency detection failed:', (error as Error).message);
      console.warn('[SolutioningOrchestrator] Continuing without dependency graph');

      // Create empty dependency graph
      dependencyDetectionResult = {
        edges: [],
        metrics: {
          executionTimeMs: Date.now() - dependencyDetectionStartTime,
          llmTokensUsed: 0,
          totalDependencies: 0,
          hardDependencies: 0,
          softDependencies: 0,
          confidence: 0,
          reasoning: 'Dependency detection failed'
        }
      };
    }

    const dependencyDetectionTimeMs = Date.now() - dependencyDetectionStartTime;
    console.log(
      `[SolutioningOrchestrator] Dependency detection complete in ${dependencyDetectionTimeMs}ms: ` +
      `${dependencyDetectionResult.edges.length} dependencies detected`
    );

    // Step 5: Generate dependency graph
    console.log('[SolutioningOrchestrator] Generating dependency graph...');
    const graphGenerationStartTime = Date.now();

    const dependencyGraph = this.dependencyGraphGenerator.generateGraph(
      allStories,
      dependencyDetectionResult.edges
    );

    const graphGenerationTimeMs = Date.now() - graphGenerationStartTime;
    console.log(
      `[SolutioningOrchestrator] Dependency graph generated in ${graphGenerationTimeMs}ms`
    );

    // Step 6: Save dependency graph to file
    try {
      const graphPath = 'docs/dependency-graph.json';
      await fs.writeFile(graphPath, JSON.stringify(dependencyGraph, null, 2), 'utf-8');
      console.log(`[SolutioningOrchestrator] Dependency graph saved to ${graphPath}`);
    } catch (error) {
      console.error('[SolutioningOrchestrator] Failed to save dependency graph:', (error as Error).message);
    }

    // Step 7: Calculate aggregate metrics
    const executionTimeMs = Date.now() - startTime;
    const avgStoryDecompositionConfidence = epics.length > 0
      ? totalStoryDecompositionConfidence / epics.length
      : 0;

    // Aggregate low-confidence decisions
    const lowConfidenceDecisions: string[] = [
      ...epicFormationMetrics.lowConfidenceDecisions,
      ...epicMetrics.flatMap(m => m.lowConfidenceDecisions)
    ];

    // Calculate total token usage
    const llmTokensUsed = epicFormationMetrics.llmTokensUsed +
      epicMetrics.reduce((sum, m) => sum + m.llmTokensUsed, 0) +
      dependencyDetectionResult.metrics.llmTokensUsed;

    const result: SolutioningResult = {
      epics,
      stories: allStories,
      dependencyGraph,
      metrics: {
        totalEpics: epics.length,
        totalStories: allStories.length,
        avgStoriesPerEpic: epics.length > 0 ? allStories.length / epics.length : 0,
        executionTimeMs,
        llmTokensUsed,
        epicFormationConfidence: epicFormationMetrics.confidence,
        avgStoryDecompositionConfidence,
        lowConfidenceDecisions,
        oversizedStoriesSplit: totalOversizedStoriesSplit,
        epicMetrics,
        dependencyDetectionTimeMs,
        graphGenerationTimeMs,
        totalDependencies: dependencyDetectionResult.metrics.totalDependencies,
        hardDependencies: dependencyDetectionResult.metrics.hardDependencies,
        softDependencies: dependencyDetectionResult.metrics.softDependencies
      }
    };

    // Log completion summary
    console.log('\n[SolutioningOrchestrator] Solutioning workflow complete!');
    console.log(`  - Epics: ${result.metrics.totalEpics}`);
    console.log(`  - Stories: ${result.metrics.totalStories}`);
    console.log(`  - Avg stories/epic: ${result.metrics.avgStoriesPerEpic.toFixed(1)}`);
    console.log(`  - Dependencies: ${result.metrics.totalDependencies} ` +
      `(${result.metrics.hardDependencies} hard, ${result.metrics.softDependencies} soft)`);
    console.log(`  - Critical path length: ${dependencyGraph.critical_path.length}`);
    console.log(`  - Bottlenecks: ${dependencyGraph.bottlenecks.length}`);
    console.log(`  - Parallel groups: ${dependencyGraph.parallelizable.length}`);
    console.log(`  - Execution time: ${(executionTimeMs / 1000).toFixed(1)}s`);
    console.log(`  - LLM tokens: ${llmTokensUsed.toLocaleString()}`);
    console.log(`  - Epic formation confidence: ${epicFormationMetrics.confidence.toFixed(2)}`);
    console.log(`  - Avg story confidence: ${avgStoryDecompositionConfidence.toFixed(2)}`);
    console.log(`  - Oversized stories split: ${totalOversizedStoriesSplit}`);

    if (lowConfidenceDecisions.length > 0) {
      console.warn(
        `\n[SolutioningOrchestrator] ⚠️  ${lowConfidenceDecisions.length} low-confidence decisions ` +
        `flagged for human review`
      );
    }

    // Validate target metrics
    this.validateTargetMetrics(result);

    return result;
  }

  /**
   * Read file from disk
   *
   * @param filePath Path to file
   * @returns Promise resolving to file contents
   * @throws Error if file cannot be read
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read file "${filePath}": ${(error as Error).message}`
      );
    }
  }

  /**
   * Validate target metrics and log warnings if targets not met
   *
   * Target metrics:
   * - 10-20 total stories for MVP scope
   * - <45 minutes total execution time
   * - Confidence scores >0.75
   *
   * @param result Solutioning result to validate
   */
  private validateTargetMetrics(result: SolutioningResult): void {
    const warnings: string[] = [];

    // Check story count (10-20 target)
    if (result.metrics.totalStories < 10) {
      warnings.push(
        `Story count (${result.metrics.totalStories}) below target (10-20). ` +
        `Consider expanding PRD scope or reducing epic granularity.`
      );
    } else if (result.metrics.totalStories > 20) {
      warnings.push(
        `Story count (${result.metrics.totalStories}) above target (10-20). ` +
        `Consider reducing PRD scope or increasing epic/story granularity.`
      );
    }

    // Check execution time (<45 minutes target)
    const executionMinutes = result.metrics.executionTimeMs / 60000;
    if (executionMinutes > 45) {
      warnings.push(
        `Execution time (${executionMinutes.toFixed(1)} min) exceeds target (45 min). ` +
        `Consider optimizing LLM calls or reducing scope.`
      );
    }

    // Check confidence scores (>0.75 target)
    if (result.metrics.epicFormationConfidence < 0.75) {
      warnings.push(
        `Epic formation confidence (${result.metrics.epicFormationConfidence.toFixed(2)}) below threshold (0.75). ` +
        `Human review recommended.`
      );
    }

    if (result.metrics.avgStoryDecompositionConfidence < 0.75) {
      warnings.push(
        `Average story decomposition confidence (${result.metrics.avgStoryDecompositionConfidence.toFixed(2)}) ` +
        `below threshold (0.75). Human review recommended.`
      );
    }

    // Log warnings
    if (warnings.length > 0) {
      console.warn('\n[SolutioningOrchestrator] ⚠️  Target metric warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
}
