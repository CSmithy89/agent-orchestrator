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
import { StoryValidator } from './story-validator.js';
import { SprintStatusGenerator } from './sprint-status-generator.js';
import { StoryFileWriter } from './story-file-writer.js';
import type { WriteSummary } from './story-file-writer.js';

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

    /** Story validation execution time in milliseconds */
    validationTimeMs: number;

    /** Total number of stories validated */
    totalStoriesValidated: number;

    /** Average validation score across all stories (0.0-1.0) */
    avgValidationScore: number;

    /** Total number of validation blockers (critical issues) */
    totalBlockers: number;

    /** Total number of validation warnings (non-critical issues) */
    totalWarnings: number;

    /** Story IDs that failed validation */
    failedStoryIds: string[];
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
  private storyValidator: StoryValidator;
  private sprintStatusGenerator: SprintStatusGenerator;
  private storyFileWriter: StoryFileWriter;

  constructor() {
    this.epicFormationService = new EpicFormationService();
    this.storyDecompositionService = new StoryDecompositionService();
    this.dependencyDetectionService = new DependencyDetectionService();
    this.dependencyGraphGenerator = new DependencyGraphGenerator();
    this.storyValidator = new StoryValidator();
    this.sprintStatusGenerator = new SprintStatusGenerator();
    this.storyFileWriter = new StoryFileWriter();
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

    // Step 7: Validate all stories
    console.log('[SolutioningOrchestrator] Validating all stories...');
    const validationStartTime = Date.now();

    const batchValidationResult = this.storyValidator.validateStories(allStories);
    const validationTimeMs = Date.now() - validationStartTime;

    console.log(
      `[SolutioningOrchestrator] Story validation complete in ${validationTimeMs}ms: ` +
      `${batchValidationResult.passed}/${batchValidationResult.totalStories} stories passed ` +
      `(avg score: ${batchValidationResult.avgScore.toFixed(2)})`
    );

    // Collect validation statistics
    let totalBlockers = 0;
    let totalWarnings = 0;
    const failedStoryIds: string[] = [];

    for (const [storyId, result] of batchValidationResult.results.entries()) {
      totalBlockers += result.blockers.length;
      totalWarnings += result.warnings.length;

      if (!result.pass) {
        failedStoryIds.push(storyId);
      }

      // Log warnings for failed stories
      if (!result.pass) {
        console.warn(`[SolutioningOrchestrator] Story ${storyId} failed validation:`);
        for (const blocker of result.blockers) {
          console.warn(`  - BLOCKER: ${blocker}`);
        }
      }

      // Log warnings even for passing stories if present
      if (result.warnings.length > 0) {
        console.warn(`[SolutioningOrchestrator] Story ${storyId} has warnings:`);
        for (const warning of result.warnings) {
          console.warn(`  - WARNING: ${warning}`);
        }
      }
    }

    // Step 8: Generate sprint status YAML
    console.log('[SolutioningOrchestrator] Generating sprint status file...');

    // Build temporary result for sprint status generation
    const tempResult: SolutioningResult = {
      epics,
      stories: allStories,
      dependencyGraph,
      metrics: {
        totalEpics: epics.length,
        totalStories: allStories.length,
        avgStoriesPerEpic: epics.length > 0 ? allStories.length / epics.length : 0,
        executionTimeMs: Date.now() - startTime,
        llmTokensUsed: 0,
        epicFormationConfidence: epicFormationMetrics.confidence,
        avgStoryDecompositionConfidence: 0,
        lowConfidenceDecisions: [],
        oversizedStoriesSplit: 0,
        epicMetrics: [],
        dependencyDetectionTimeMs,
        graphGenerationTimeMs,
        totalDependencies: dependencyDetectionResult.metrics.totalDependencies,
        hardDependencies: dependencyDetectionResult.metrics.hardDependencies,
        softDependencies: dependencyDetectionResult.metrics.softDependencies,
        validationTimeMs,
        totalStoriesValidated: batchValidationResult.totalStories,
        avgValidationScore: batchValidationResult.avgScore,
        totalBlockers,
        totalWarnings,
        failedStoryIds
      }
    };

    // Extract project name from PRD path or use default
    const projectName = this.extractProjectName(prdPath);
    const sprintStatusYaml = this.sprintStatusGenerator.generateSprintStatus(tempResult, projectName);

    // Save sprint status to file
    try {
      const sprintStatusPath = 'docs/sprint-status.yaml';
      await fs.writeFile(sprintStatusPath, sprintStatusYaml, 'utf-8');
      console.log(`[SolutioningOrchestrator] Sprint status saved to ${sprintStatusPath}`);
    } catch (error) {
      console.error('[SolutioningOrchestrator] Failed to save sprint status:', (error as Error).message);
    }

    // Step 9: Write story files and epics document
    console.log('[SolutioningOrchestrator] Writing story files and epics document...');
    let writeSummary: WriteSummary;

    try {
      writeSummary = await this.storyFileWriter.writeAllStoryFiles(tempResult);
      console.log(
        `[SolutioningOrchestrator] Files written: ${writeSummary.storiesWritten} stories, ` +
        `epics document: ${writeSummary.epicsDocumentWritten}`
      );

      if (writeSummary.storiesFailed > 0) {
        console.warn(
          `[SolutioningOrchestrator] Warning: ${writeSummary.storiesFailed} story files failed to write`
        );
      }
    } catch (error) {
      console.error(
        '[SolutioningOrchestrator] Failed to write story files:',
        (error as Error).message
      );
      // Continue workflow even if file writing fails
      writeSummary = {
        storiesWritten: 0,
        epicsDocumentWritten: false,
        storyFilePaths: [],
        epicsDocumentPath: null,
        storiesFailed: 0,
        errors: [(error as Error).message],
      };
    }

    // Step 10: Calculate aggregate metrics
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
        softDependencies: dependencyDetectionResult.metrics.softDependencies,
        validationTimeMs,
        totalStoriesValidated: batchValidationResult.totalStories,
        avgValidationScore: batchValidationResult.avgScore,
        totalBlockers,
        totalWarnings,
        failedStoryIds
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
    console.log(`  - Validation: ${batchValidationResult.passed}/${batchValidationResult.totalStories} passed ` +
      `(avg score: ${batchValidationResult.avgScore.toFixed(2)})`);
    console.log(`  - Validation issues: ${totalBlockers} blockers, ${totalWarnings} warnings`);
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
   * Extract project name from PRD file path
   *
   * Tries to extract a meaningful project name from the file path.
   * Falls back to "Agent Orchestrator" if extraction fails.
   *
   * @param prdPath Path to PRD file
   * @returns Project name
   */
  private extractProjectName(prdPath: string): string {
    // Try to extract from path (e.g., /home/user/my-project/docs/PRD.md → "My Project")
    const pathParts = prdPath.split('/');

    // Look for a meaningful directory name (not docs, home, user, etc.)
    const excludedDirs = ['home', 'user', 'docs', 'tmp', 'var'];
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (part && !excludedDirs.includes(part.toLowerCase()) && part !== 'PRD.md') {
        // Convert kebab-case or snake_case to Title Case
        return part
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
    }

    // Default fallback
    return 'Agent Orchestrator';
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
