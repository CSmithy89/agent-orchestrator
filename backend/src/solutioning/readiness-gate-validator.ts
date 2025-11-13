/**
 * Readiness Gate Validator
 *
 * Final validation gate before implementation - comprehensive quality checks
 * to ensure all solutioning outputs are complete, valid, and ready for development.
 *
 * Performs 5 validation checks:
 * 1. Story completeness (all required fields present)
 * 2. Dependency validity (no circular deps, all IDs valid)
 * 3. Story sizing (10-20 stories, balanced distribution)
 * 4. Test strategy (all stories testable)
 * 5. Critical path analysis (no bottlenecks, parallelization possible)
 *
 * @module solutioning/readiness-gate-validator
 * @see docs/stories/4-9-implementation-readiness-gate-validation.md
 */

import type { SolutioningResult } from './solutioning-orchestrator.js';
import type { Story, DependencyGraph } from './types.js';

/**
 * Result of an individual validation check
 */
export interface CheckResult {
  /** Whether this check passed (score >= 75) */
  pass: boolean;

  /** Score from 0-100 for this check */
  score: number;

  /** Human-readable details about the check result */
  details: string;

  /** List of specific issues found during this check */
  issues: string[];
}

/**
 * Comprehensive result of readiness gate validation
 */
export interface ReadinessGateResult {
  /** Overall pass/fail (true if qualityScore >= 75) */
  pass: boolean;

  /** Weighted quality score from 0-100 */
  qualityScore: number;

  /** Critical issues preventing gate passage */
  blockers: string[];

  /** Minor issues, can proceed with caution */
  warnings: string[];

  /** Actionable recommendations for improvement */
  recommendations: string[];

  /** Individual check results */
  checks: {
    storyCompleteness: CheckResult;
    dependencyValidity: CheckResult;
    storySizing: CheckResult;
    testStrategy: CheckResult;
    criticalPathAnalysis: CheckResult;
  };
}

/**
 * Readiness Gate Validator
 *
 * Validates solutioning result against quality standards before implementation.
 */
export class ReadinessGateValidator {
  /**
   * Validate complete solutioning result
   *
   * @param result - Complete solutioning result from orchestrator
   * @returns Comprehensive validation result with pass/fail and recommendations
   */
  validate(result: SolutioningResult): ReadinessGateResult {
    // Run all 5 validation checks
    const storyCompleteness = this.checkStoryCompleteness(result.stories);
    const dependencyValidity = this.checkDependencyValidity(
      result.stories,
      result.dependencyGraph
    );
    const storySizing = this.checkStorySizing(result);
    const testStrategy = this.checkTestStrategy(result.stories);
    const criticalPathAnalysis = this.checkCriticalPath(result.dependencyGraph);

    // Calculate weighted quality score (each check weighted at 20%)
    const qualityScore = Math.round(
      storyCompleteness.score * 0.2 +
        dependencyValidity.score * 0.2 +
        storySizing.score * 0.2 +
        testStrategy.score * 0.2 +
        criticalPathAnalysis.score * 0.2
    );

    // Determine pass/fail (threshold: 75)
    const pass = qualityScore >= 75;

    // Identify blockers and warnings
    const { blockers, warnings } = this.identifyIssues(
      qualityScore,
      {
        storyCompleteness,
        dependencyValidity,
        storySizing,
        testStrategy,
        criticalPathAnalysis,
      }
    );

    // Generate actionable recommendations
    const recommendations = this.generateRecommendations(
      qualityScore,
      {
        storyCompleteness,
        dependencyValidity,
        storySizing,
        testStrategy,
        criticalPathAnalysis,
      }
    );

    return {
      pass,
      qualityScore,
      blockers,
      warnings,
      recommendations,
      checks: {
        storyCompleteness,
        dependencyValidity,
        storySizing,
        testStrategy,
        criticalPathAnalysis,
      },
    };
  }

  /**
   * Check 1: Story Completeness
   *
   * Validates all stories have required fields and are well-defined.
   */
  private checkStoryCompleteness(stories: Story[]): CheckResult {
    const issues: string[] = [];
    let score = 100;

    stories.forEach((story) => {
      // Check required fields
      if (!story.title || story.title.trim() === '') {
        issues.push(`Story ${story.id}: Missing title`);
        score -= 10;
      }

      if (!story.description || story.description.trim() === '') {
        issues.push(`Story ${story.id}: Missing description`);
        score -= 10;
      }

      if (!story.acceptance_criteria || story.acceptance_criteria.length === 0) {
        issues.push(`Story ${story.id}: Missing acceptance criteria`);
        score -= 15;
      }

      if (!story.technical_notes) {
        issues.push(`Story ${story.id}: Missing technical notes`);
        score -= 10;
      }

      if (!story.dependencies) {
        issues.push(`Story ${story.id}: Missing dependencies array`);
        score -= 5;
      }

      // Check AC quality (actionable verbs)
      if (story.acceptance_criteria && story.acceptance_criteria.length > 0) {
        const actionVerbs = ['verify', 'ensure', 'validate', 'implement', 'create', 'test', 'check', 'confirm'];
        const hasActionableACs = story.acceptance_criteria.some((ac) =>
          actionVerbs.some((verb) => ac.toLowerCase().includes(verb))
        );

        if (!hasActionableACs) {
          issues.push(`Story ${story.id}: Acceptance criteria may not be actionable`);
          score -= 5;
        }
      }
    });

    // Cap score at 0
    score = Math.max(0, score);

    const pass = score >= 75;
    const details = pass
      ? `All ${stories.length} stories are complete with required fields`
      : `${issues.length} completeness issues found across ${stories.length} stories`;

    return { pass, score, details, issues };
  }

  /**
   * Check 2: Dependency Validity
   *
   * Validates dependency graph integrity (no circular deps, valid IDs).
   */
  private checkDependencyValidity(
    stories: Story[],
    graph: DependencyGraph
  ): CheckResult {
    const issues: string[] = [];
    let score = 100;

    // Build set of valid story IDs
    const validIds = new Set(stories.map((s) => s.id));

    // Check 1: All referenced story IDs exist
    stories.forEach((story) => {
      story.dependencies.forEach((depId) => {
        if (!validIds.has(depId)) {
          issues.push(`Story ${story.id}: Invalid dependency reference "${depId}"`);
          score -= 10;
        }
      });
    });

    // Check 2: Detect circular dependencies
    const circularDeps = this.detectCircularDependencies(stories);
    if (circularDeps.length > 0) {
      circularDeps.forEach((cycle) => {
        issues.push(`Circular dependency detected: ${cycle.join(' → ')}`);
        score -= 20;
      });
    }

    // Check 3: Validate dependency depth (max 6 levels)
    const maxDepth = this.calculateMaxDependencyDepth(stories);
    if (maxDepth > 6) {
      issues.push(`Dependency depth too high: ${maxDepth} levels (max 6)`);
      score -= 10;
    }

    // Check 4: Validate graph connectivity (no isolated subgraphs)
    const isolatedStories = this.findIsolatedStories(stories, graph);
    if (isolatedStories.length > 0) {
      isolatedStories.forEach((storyId) => {
        issues.push(`Story ${storyId}: Isolated from dependency graph`);
        score -= 5;
      });
    }

    // Cap score at 0
    score = Math.max(0, score);

    const pass = score >= 75;
    const details = pass
      ? `Dependency graph is valid with ${graph.edges.length} dependencies`
      : `${issues.length} dependency issues found`;

    return { pass, score, details, issues };
  }

  /**
   * Check 3: Story Sizing
   *
   * Validates story count and distribution across epics.
   */
  private checkStorySizing(result: SolutioningResult): CheckResult {
    const issues: string[] = [];
    let score = 100;

    const totalStories = result.stories.length;
    const totalEpics = result.epics.length;

    // Check 1: Total story count (10-20 for MVP)
    if (totalStories < 10) {
      issues.push(`Too few stories: ${totalStories} (minimum 10 for MVP)`);
      // More severe penalty for very low counts
      if (totalStories === 0) {
        score -= 50; // Critical failure
      } else if (totalStories < 5) {
        score -= 30;
      } else {
        score -= 20;
      }
    } else if (totalStories > 20) {
      issues.push(`Too many stories: ${totalStories} (maximum 20 for MVP)`);
      score -= 20;
    } else if (totalStories === 9 || totalStories === 21) {
      // Close to boundary, just a warning
      issues.push(`Story count near boundary: ${totalStories} (optimal: 10-20)`);
      score -= 5;
    }

    // Check 2: Stories per epic (2-5 balanced)
    result.epics.forEach((epic) => {
      const epicStoryCount = epic.stories.length;

      if (epicStoryCount < 2) {
        issues.push(`Epic ${epic.id}: Too few stories (${epicStoryCount}, minimum 2)`);
        score -= 10;
      } else if (epicStoryCount > 5) {
        issues.push(`Epic ${epic.id}: Too many stories (${epicStoryCount}, maximum 5)`);
        score -= 10;
      }
    });

    // Check 3: No single epic with >50% of total stories
    result.epics.forEach((epic) => {
      const percentage = (epic.stories.length / totalStories) * 100;
      if (percentage > 50) {
        issues.push(
          `Epic ${epic.id}: Contains ${Math.round(percentage)}% of all stories (max 50%)`
        );
        score -= 15;
      }
    });

    // Cap score at 0
    score = Math.max(0, score);

    const pass = score >= 75;
    const avgStoriesPerEpic = totalEpics > 0 ? (totalStories / totalEpics).toFixed(1) : '0';
    const details = pass
      ? `Good sizing: ${totalStories} stories across ${totalEpics} epics (avg ${avgStoriesPerEpic}/epic)`
      : `${issues.length} sizing issues found`;

    return { pass, score, details, issues };
  }

  /**
   * Check 4: Test Strategy
   *
   * Validates all stories have test requirements and testable ACs.
   */
  private checkTestStrategy(stories: Story[]): CheckResult {
    const issues: string[] = [];
    let score = 100;

    let testableACCount = 0;
    let totalACCount = 0;

    stories.forEach((story) => {
      // Check 1: Story mentions "test" in technical notes or ACs
      const hasTestMention =
        story.technical_notes?.test_requirements?.toLowerCase().includes('test') ||
        story.acceptance_criteria.some((ac) => ac.toLowerCase().includes('test'));

      if (!hasTestMention) {
        issues.push(`Story ${story.id}: No test requirements documented`);
        score -= 5;
      }

      // Check 2: Acceptance criteria testability
      story.acceptance_criteria.forEach((ac) => {
        totalACCount++;

        // Testable ACs are objective and measurable
        const objectiveKeywords = [
          'verify', 'ensure', 'validate', 'return', 'display', 'create',
          'save', 'update', 'delete', 'equal', 'contain', 'include',
          'greater', 'less', 'match', 'fail', 'succeed', 'throw', 'test',
          'check', 'confirm', 'implement',
        ];

        const isTestable = objectiveKeywords.some((keyword) =>
          ac.toLowerCase().includes(keyword)
        );

        if (isTestable) {
          testableACCount++;
        } else {
          issues.push(`Story ${story.id}: Vague AC - "${ac.substring(0, 50)}..."`);
          score -= 2;
        }
      });
    });

    // Calculate testability percentage
    const testabilityPercent = totalACCount > 0
      ? (testableACCount / totalACCount) * 100
      : 0;

    if (testabilityPercent < 80) {
      issues.push(
        `Low AC testability: ${testabilityPercent.toFixed(1)}% (minimum 80%)`
      );
      score -= 15;
    }

    // Cap score at 0
    score = Math.max(0, score);

    const pass = score >= 75;
    const details = pass
      ? `Strong test strategy: ${testabilityPercent.toFixed(1)}% of ACs are testable`
      : `${issues.length} test strategy issues found`;

    return { pass, score, details, issues };
  }

  /**
   * Check 5: Critical Path Analysis
   *
   * Validates no single-point-of-failure bottlenecks in dependency graph.
   */
  private checkCriticalPath(graph: DependencyGraph): CheckResult {
    const issues: string[] = [];
    let score = 100;

    // Check 1: No story blocks >5 other stories
    const blockingCounts = this.calculateBlockingCounts(graph);
    Object.entries(blockingCounts).forEach(([storyId, count]) => {
      if (count > 5) {
        issues.push(`Story ${storyId}: Blocks ${count} other stories (max 5)`);
        score -= 15;
      }
    });

    // Check 2: At least 50% of stories can be parallelized
    const totalStories = graph.nodes.length;
    const parallelizableCount = graph.parallelizable.flat().length;
    const parallelizationPercent = totalStories > 0
      ? (parallelizableCount / totalStories) * 100
      : 0;

    if (parallelizationPercent < 50) {
      issues.push(
        `Low parallelization: ${parallelizationPercent.toFixed(1)}% (minimum 50%)`
      );
      score -= 20;
    }

    // Check 3: Critical path length reasonable
    const avgStoriesPerEpic = graph.metadata.totalStories / Math.max(1, graph.critical_path.length);
    if (graph.critical_path.length > avgStoriesPerEpic * 3) {
      issues.push(
        `Critical path too long: ${graph.critical_path.length} stories (max ${Math.round(avgStoriesPerEpic * 3)})`
      );
      score -= 10;
    }

    // Check 4: Bottlenecks (stories blocking 3+ others)
    if (graph.bottlenecks.length > 0) {
      graph.bottlenecks.forEach((bottleneck) => {
        issues.push(`Bottleneck detected: Story ${bottleneck} blocks multiple stories`);
        score -= 5;
      });
    }

    // Cap score at 0
    score = Math.max(0, score);

    const pass = score >= 75;
    const details = pass
      ? `Good parallelization: ${parallelizationPercent.toFixed(1)}% of stories can run in parallel`
      : `${issues.length} critical path issues found`;

    return { pass, score, details, issues };
  }

  /**
   * Identify blockers (critical) vs warnings (minor)
   */
  private identifyIssues(
    qualityScore: number,
    checks: ReadinessGateResult['checks']
  ): { blockers: string[]; warnings: string[] } {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Blocker: Quality score <75
    if (qualityScore < 75) {
      blockers.push(
        `Quality score below pass threshold: ${qualityScore}/100 (minimum 75)`
      );
    }

    // Check each validation for blockers/warnings
    Object.entries(checks).forEach(([checkName, result]) => {
      if (result.score < 50) {
        // Major issues = blocker
        blockers.push(`${this.formatCheckName(checkName)}: Critical issues (score ${result.score}/100)`);
        result.issues.slice(0, 3).forEach((issue) => blockers.push(`  - ${issue}`));
      } else if (result.score < 75) {
        // Minor issues = warning
        warnings.push(`${this.formatCheckName(checkName)}: Minor issues (score ${result.score}/100)`);
        result.issues.slice(0, 2).forEach((issue) => warnings.push(`  - ${issue}`));
      }
    });

    return { blockers, warnings };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    qualityScore: number,
    checks: ReadinessGateResult['checks']
  ): string[] {
    const recommendations: string[] = [];

    // Overall recommendation based on score
    if (qualityScore >= 90) {
      recommendations.push('Excellent quality! All solutioning outputs are ready for implementation.');
    } else if (qualityScore >= 75) {
      recommendations.push('Good quality. Address warnings before starting implementation if possible.');
    } else if (qualityScore >= 60) {
      recommendations.push('Fair quality. Resolve all blockers before proceeding to implementation.');
    } else {
      recommendations.push('Poor quality. Significant rework required before implementation can begin.');
    }

    // Per-check recommendations
    if (checks.storyCompleteness.score < 90) {
      recommendations.push('Story Completeness: Ensure all stories have complete fields (title, description, ACs, technical notes)');
    }

    if (checks.dependencyValidity.score < 90) {
      recommendations.push('Dependency Validity: Fix circular dependencies and validate all story ID references');
    }

    if (checks.storySizing.score < 90) {
      recommendations.push('Story Sizing: Rebalance story distribution across epics or adjust MVP scope to 10-20 stories');
    }

    if (checks.testStrategy.score < 90) {
      recommendations.push('Test Strategy: Add test requirements to all stories and make acceptance criteria more testable');
    }

    if (checks.criticalPathAnalysis.score < 90) {
      recommendations.push('Critical Path: Reduce dependency bottlenecks to enable more parallel story execution');
    }

    return recommendations;
  }

  // Helper methods

  /**
   * Detect circular dependencies in story graph
   */
  private detectCircularDependencies(stories: Story[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (storyId: string, path: string[]): void => {
      if (recursionStack.has(storyId)) {
        // Found a cycle
        const cycleStart = path.indexOf(storyId);
        cycles.push([...path.slice(cycleStart), storyId]);
        return;
      }

      if (visited.has(storyId)) {
        return;
      }

      visited.add(storyId);
      recursionStack.add(storyId);

      const story = stories.find((s) => s.id === storyId);
      if (story) {
        story.dependencies.forEach((depId) => {
          dfs(depId, [...path, storyId]);
        });
      }

      recursionStack.delete(storyId);
    };

    stories.forEach((story) => {
      if (!visited.has(story.id)) {
        dfs(story.id, []);
      }
    });

    return cycles;
  }

  /**
   * Calculate maximum dependency depth
   */
  private calculateMaxDependencyDepth(stories: Story[]): number {
    const depthMap = new Map<string, number>();

    const calculateDepth = (storyId: string, visited: Set<string>): number => {
      if (depthMap.has(storyId)) {
        return depthMap.get(storyId)!;
      }

      if (visited.has(storyId)) {
        // Circular dependency, return arbitrary depth
        return 10;
      }

      const story = stories.find((s) => s.id === storyId);
      if (!story || story.dependencies.length === 0) {
        depthMap.set(storyId, 0);
        return 0;
      }

      visited.add(storyId);

      const maxChildDepth = Math.max(
        ...story.dependencies.map((depId) => calculateDepth(depId, new Set(visited)))
      );

      const depth = maxChildDepth + 1;
      depthMap.set(storyId, depth);

      return depth;
    };

    let maxDepth = 0;
    stories.forEach((story) => {
      const depth = calculateDepth(story.id, new Set());
      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  /**
   * Find isolated stories (not connected to main dependency graph)
   */
  private findIsolatedStories(stories: Story[], graph: DependencyGraph): string[] {
    // Stories are isolated if they have no dependencies and nothing depends on them
    const hasIncomingEdge = new Set(graph.edges.map((e) => e.to));
    const hasOutgoingEdge = new Set(graph.edges.map((e) => e.from));

    return stories
      .filter((story) => {
        const noDependencies = story.dependencies.length === 0;
        const notDependedUpon = !hasIncomingEdge.has(story.id);
        const notInGraph = !hasOutgoingEdge.has(story.id);

        // Isolated if no incoming/outgoing edges (unless it's a root story with dependents)
        return noDependencies && notDependedUpon && notInGraph && stories.length > 1;
      })
      .map((story) => story.id);
  }

  /**
   * Calculate how many stories each story blocks
   */
  private calculateBlockingCounts(graph: DependencyGraph): Record<string, number> {
    const counts: Record<string, number> = {};

    graph.edges.forEach((edge) => {
      counts[edge.from] = (counts[edge.from] || 0) + 1;
    });

    return counts;
  }

  /**
   * Format check name for display
   */
  private formatCheckName(checkName: string): string {
    return checkName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }
}
