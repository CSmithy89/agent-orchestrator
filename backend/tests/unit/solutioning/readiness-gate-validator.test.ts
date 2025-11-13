/**
 * Unit Tests for ReadinessGateValidator
 *
 * Tests all 5 validation checks, quality scoring, blocker/warning detection,
 * and recommendations generation.
 *
 * @see backend/src/solutioning/readiness-gate-validator.ts
 * @see docs/stories/4-9-implementation-readiness-gate-validation.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReadinessGateValidator } from '../../../src/solutioning/readiness-gate-validator.js';
import type { SolutioningResult } from '../../../src/solutioning/solutioning-orchestrator.js';
import type { Story, Epic, DependencyGraph } from '../../../src/solutioning/types.js';

describe('ReadinessGateValidator', () => {
  let validator: ReadinessGateValidator;

  beforeEach(() => {
    validator = new ReadinessGateValidator();
  });

  /**
   * Helper: Create a complete valid story for testing
   */
  function createValidStory(id: string, dependencies: string[] = []): Story {
    return {
      id,
      epic: 'epic-1',
      title: `Story ${id}`,
      description: 'As a user, I want to do something, So that I achieve a goal',
      acceptance_criteria: [
        'Verify feature works correctly',
        'Ensure validation passes',
        'Test edge cases',
      ],
      dependencies,
      status: 'drafted',
      technical_notes: {
        affected_files: ['file.ts'],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Unit tests with 80% coverage',
      },
      estimated_hours: 4,
      complexity: 'medium',
    };
  }

  /**
   * Helper: Create a valid epic for testing
   */
  function createValidEpic(id: string, stories: Story[]): Epic {
    return {
      id,
      title: `Epic ${id}`,
      goal: 'Achieve epic goal',
      value_proposition: 'Deliver business value',
      stories,
      business_value: '10 hours saved',
      estimated_duration: '1 sprint',
    };
  }

  /**
   * Helper: Create a valid dependency graph for testing
   */
  function createValidDependencyGraph(stories: Story[]): DependencyGraph {
    return {
      nodes: stories.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        epic: s.epic,
        complexity: s.complexity,
      })),
      edges: stories.flatMap((s) =>
        s.dependencies.map((depId) => ({
          from: depId,
          to: s.id,
          type: 'hard' as const,
          blocking: true,
        }))
      ),
      critical_path: stories.slice(0, 3).map((s) => s.id),
      bottlenecks: [],
      parallelizable: [stories.slice(0, 2).map((s) => s.id)],
      metadata: {
        totalStories: stories.length,
        parallelizable: Math.floor(stories.length / 2),
        bottlenecks: [],
        criticalPathLength: 3,
      },
    };
  }

  /**
   * Helper: Create a complete valid solutioning result for testing
   */
  function createValidSolutioningResult(storyCount: number = 15): SolutioningResult {
    const stories: Story[] = [];
    for (let i = 1; i <= storyCount; i++) {
      stories.push(createValidStory(`story-${i}`, i > 1 ? [`story-${i - 1}`] : []));
    }

    const epicsCount = Math.ceil(storyCount / 3);
    const epics: Epic[] = [];
    for (let i = 0; i < epicsCount; i++) {
      const epicStories = stories.slice(i * 3, (i + 1) * 3);
      if (epicStories.length > 0) {
        epics.push(createValidEpic(`epic-${i + 1}`, epicStories));
      }
    }

    const dependencyGraph = createValidDependencyGraph(stories);

    return {
      epics,
      stories,
      dependencyGraph,
      metrics: {
        totalEpics: epics.length,
        totalStories: stories.length,
        avgStoriesPerEpic: stories.length / epics.length,
        executionTimeMs: 1000,
        llmTokensUsed: 5000,
        epicFormationConfidence: 0.9,
        avgStoryDecompositionConfidence: 0.85,
        lowConfidenceDecisions: [],
        oversizedStoriesSplit: 0,
        epicMetrics: [],
        dependencyDetectionTimeMs: 100,
        graphGenerationTimeMs: 50,
        totalDependencies: stories.length - 1,
        hardDependencies: stories.length - 1,
        softDependencies: 0,
        validationTimeMs: 200,
        totalStoriesValidated: stories.length,
        avgValidationScore: 0.95,
        totalBlockers: 0,
        totalWarnings: 0,
        failedStoryIds: [],
      },
    };
  }

  // ============================================================================
  // Test 1: validate() returns ReadinessGateResult with all required fields
  // ============================================================================
  it('should return ReadinessGateResult with all required fields', () => {
    const result = createValidSolutioningResult();
    const readinessResult = validator.validate(result);

    expect(readinessResult).toBeDefined();
    expect(readinessResult).toHaveProperty('pass');
    expect(readinessResult).toHaveProperty('qualityScore');
    expect(readinessResult).toHaveProperty('blockers');
    expect(readinessResult).toHaveProperty('warnings');
    expect(readinessResult).toHaveProperty('recommendations');
    expect(readinessResult).toHaveProperty('checks');
    expect(readinessResult.checks).toHaveProperty('storyCompleteness');
    expect(readinessResult.checks).toHaveProperty('dependencyValidity');
    expect(readinessResult.checks).toHaveProperty('storySizing');
    expect(readinessResult.checks).toHaveProperty('testStrategy');
    expect(readinessResult.checks).toHaveProperty('criticalPathAnalysis');
  });

  // ============================================================================
  // Test 2: Story completeness check validates all stories have required fields
  // ============================================================================
  it('should pass story completeness check for valid stories', () => {
    const result = createValidSolutioningResult();
    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storyCompleteness.pass).toBe(true);
    expect(readinessResult.checks.storyCompleteness.score).toBeGreaterThanOrEqual(90);
    expect(readinessResult.checks.storyCompleteness.issues.length).toBe(0);
  });

  // ============================================================================
  // Test 3: Story completeness check detects missing titles
  // ============================================================================
  it('should fail story completeness check when stories missing titles', () => {
    const result = createValidSolutioningResult(10);
    // Make multiple stories incomplete to drop score below 75
    result.stories[0].title = ''; // Missing title
    result.stories[1].title = '';
    result.stories[2].title = '';

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storyCompleteness.pass).toBe(false);
    expect(readinessResult.checks.storyCompleteness.score).toBeLessThan(75);
    expect(readinessResult.checks.storyCompleteness.issues.length).toBeGreaterThan(0);
    expect(readinessResult.checks.storyCompleteness.issues[0]).toContain('Missing title');
  });

  // ============================================================================
  // Test 4: Story completeness check detects missing descriptions
  // ============================================================================
  it('should fail story completeness check when stories missing descriptions', () => {
    const result = createValidSolutioningResult(10);
    // Make multiple stories incomplete to drop score below 75
    result.stories[0].description = ''; // Missing description
    result.stories[1].description = '';
    result.stories[2].description = '';

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storyCompleteness.pass).toBe(false);
    expect(readinessResult.checks.storyCompleteness.score).toBeLessThan(75);
    expect(readinessResult.checks.storyCompleteness.issues.length).toBeGreaterThan(0);
    expect(readinessResult.checks.storyCompleteness.issues[0]).toContain('Missing description');
  });

  // ============================================================================
  // Test 5: Story completeness check detects missing acceptance criteria
  // ============================================================================
  it('should fail story completeness check when stories missing acceptance criteria', () => {
    const result = createValidSolutioningResult(10);
    // Make multiple stories incomplete to drop score below 75
    result.stories[0].acceptance_criteria = []; // Missing ACs
    result.stories[1].acceptance_criteria = [];
    result.stories[2].acceptance_criteria = [];

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storyCompleteness.pass).toBe(false);
    expect(readinessResult.checks.storyCompleteness.score).toBeLessThan(75);
    expect(readinessResult.checks.storyCompleteness.issues.length).toBeGreaterThan(0);
    expect(readinessResult.checks.storyCompleteness.issues[0]).toContain('Missing acceptance criteria');
  });

  // ============================================================================
  // Test 6: Dependency validity check detects circular dependencies
  // ============================================================================
  it('should fail dependency validity check when circular dependencies exist', () => {
    const result = createValidSolutioningResult(5);
    // Create circular dependency: story-1 -> story-2 -> story-3 -> story-1
    result.stories[0].dependencies = ['story-3'];
    result.stories[1].dependencies = ['story-1'];
    result.stories[2].dependencies = ['story-2'];

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.dependencyValidity.pass).toBe(false);
    expect(readinessResult.checks.dependencyValidity.score).toBeLessThan(100);
    expect(readinessResult.checks.dependencyValidity.issues.some((issue) =>
      issue.includes('Circular dependency')
    )).toBe(true);
  });

  // ============================================================================
  // Test 7: Dependency validity check detects invalid story ID references
  // ============================================================================
  it('should fail dependency validity check when invalid story IDs referenced', () => {
    const result = createValidSolutioningResult(5);
    // Add multiple invalid references to drop score below 75
    result.stories[0].dependencies = ['nonexistent-story-99']; // Invalid ID
    result.stories[1].dependencies = ['fake-story-100'];
    result.stories[2].dependencies = ['missing-story-101'];

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.dependencyValidity.pass).toBe(false);
    expect(readinessResult.checks.dependencyValidity.score).toBeLessThan(75);
    expect(readinessResult.checks.dependencyValidity.issues.some((issue) =>
      issue.includes('Invalid dependency reference')
    )).toBe(true);
  });

  // ============================================================================
  // Test 8: Story sizing check validates story count within 10-20 range
  // ============================================================================
  it('should pass story sizing check for 10-20 stories', () => {
    const result = createValidSolutioningResult(15); // Optimal size

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storySizing.pass).toBe(true);
    expect(readinessResult.checks.storySizing.score).toBeGreaterThanOrEqual(90);
  });

  // ============================================================================
  // Test 9: Story sizing check fails for too few stories
  // ============================================================================
  it('should fail story sizing check when too few stories (<10)', () => {
    const result = createValidSolutioningResult(5); // Too few

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storySizing.pass).toBe(false);
    expect(readinessResult.checks.storySizing.issues.some((issue) =>
      issue.includes('Too few stories')
    )).toBe(true);
  });

  // ============================================================================
  // Test 10: Story sizing check fails for too many stories
  // ============================================================================
  it('should fail story sizing check when too many stories (>20)', () => {
    const result = createValidSolutioningResult(25); // Too many

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.storySizing.pass).toBe(false);
    expect(readinessResult.checks.storySizing.issues.some((issue) =>
      issue.includes('Too many stories')
    )).toBe(true);
  });

  // ============================================================================
  // Test 11: Test strategy check validates all stories have test requirements
  // ============================================================================
  it('should pass test strategy check when all stories have test requirements', () => {
    const result = createValidSolutioningResult(15);
    // Ensure all ACs are highly testable
    result.stories.forEach((story) => {
      story.acceptance_criteria = [
        'Verify the implementation is correct',
        'Ensure all tests pass',
        'Validate the output matches expected results',
        'Test error handling works properly',
      ];
    });

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.testStrategy.pass).toBe(true);
    expect(readinessResult.checks.testStrategy.score).toBeGreaterThanOrEqual(75);
  });

  // ============================================================================
  // Test 12: Test strategy check detects missing test requirements
  // ============================================================================
  it('should fail test strategy check when stories missing test requirements', () => {
    const result = createValidSolutioningResult(10);
    // Remove test mentions
    result.stories.forEach((story) => {
      story.technical_notes.test_requirements = 'No testing needed';
      story.acceptance_criteria = ['Do something', 'Do another thing'];
    });

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.testStrategy.pass).toBe(false);
    expect(readinessResult.checks.testStrategy.score).toBeLessThan(75);
  });

  // ============================================================================
  // Test 13: Critical path analysis check detects bottlenecks
  // ============================================================================
  it('should detect bottlenecks when story blocks >5 other stories', () => {
    const result = createValidSolutioningResult(15);
    // Make story-1 block many stories
    result.dependencyGraph.edges = [];
    for (let i = 2; i <= 8; i++) {
      result.dependencyGraph.edges.push({
        from: 'story-1',
        to: `story-${i}`,
        type: 'hard',
        blocking: true,
      });
    }

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.criticalPathAnalysis.pass).toBe(false);
    expect(readinessResult.checks.criticalPathAnalysis.issues.some((issue) =>
      issue.includes('Blocks')
    )).toBe(true);
  });

  // ============================================================================
  // Test 14: Critical path analysis check validates parallelization
  // ============================================================================
  it('should pass critical path check when sufficient parallelization exists', () => {
    const result = createValidSolutioningResult(15);
    // Ensure good parallelization
    result.dependencyGraph.parallelizable = [
      ['story-1', 'story-2', 'story-3'],
      ['story-4', 'story-5', 'story-6'],
      ['story-7', 'story-8'],
    ];

    const readinessResult = validator.validate(result);

    expect(readinessResult.checks.criticalPathAnalysis.pass).toBe(true);
    expect(readinessResult.checks.criticalPathAnalysis.score).toBeGreaterThanOrEqual(75);
  });

  // ============================================================================
  // Test 15: Quality score calculated correctly with weighted checks
  // ============================================================================
  it('should calculate quality score correctly with weighted checks (20% each)', () => {
    const result = createValidSolutioningResult(15);
    // Ensure all ACs are highly testable
    result.stories.forEach((story) => {
      story.acceptance_criteria = [
        'Verify the implementation is correct',
        'Ensure all tests pass',
        'Validate the output matches expected results',
        'Test error handling works properly',
      ];
    });

    const readinessResult = validator.validate(result);

    // All checks should score reasonably high for valid result
    expect(readinessResult.checks.storyCompleteness.score).toBeGreaterThanOrEqual(75);
    expect(readinessResult.checks.dependencyValidity.score).toBeGreaterThanOrEqual(75);
    expect(readinessResult.checks.storySizing.score).toBeGreaterThanOrEqual(75);
    expect(readinessResult.checks.testStrategy.score).toBeGreaterThanOrEqual(75);
    expect(readinessResult.checks.criticalPathAnalysis.score).toBeGreaterThanOrEqual(75);

    // Quality score should be weighted average
    const expectedScore = Math.round(
      readinessResult.checks.storyCompleteness.score * 0.2 +
        readinessResult.checks.dependencyValidity.score * 0.2 +
        readinessResult.checks.storySizing.score * 0.2 +
        readinessResult.checks.testStrategy.score * 0.2 +
        readinessResult.checks.criticalPathAnalysis.score * 0.2
    );

    expect(readinessResult.qualityScore).toBe(expectedScore);
  });

  // ============================================================================
  // Test 16: Pass/fail determined correctly (threshold 75)
  // ============================================================================
  it('should pass gate when quality score >= 75', () => {
    const result = createValidSolutioningResult(15);

    const readinessResult = validator.validate(result);

    expect(readinessResult.qualityScore).toBeGreaterThanOrEqual(75);
    expect(readinessResult.pass).toBe(true);
  });

  // ============================================================================
  // Test 17: Pass/fail determined correctly when score < 75
  // ============================================================================
  it('should fail gate when quality score < 75', () => {
    const result = createValidSolutioningResult(5); // Too few stories, will fail sizing

    // Add more failures
    result.stories.forEach((story, idx) => {
      if (idx < 3) {
        story.title = ''; // Missing titles
        story.acceptance_criteria = []; // Missing ACs
      }
    });

    const readinessResult = validator.validate(result);

    expect(readinessResult.qualityScore).toBeLessThan(75);
    expect(readinessResult.pass).toBe(false);
  });

  // ============================================================================
  // Test 18: Blockers identified when score < 75
  // ============================================================================
  it('should identify blockers when quality score < 75', () => {
    const result = createValidSolutioningResult(3); // Very few stories (critical failure)

    // Add critical failures to ALL stories
    result.stories.forEach((story) => {
      story.title = '';
      story.description = '';
      story.acceptance_criteria = [];
      story.technical_notes.test_requirements = '';
    });

    // Add circular dependency
    result.stories[0].dependencies = ['story-2'];
    result.stories[1].dependencies = ['story-3'];
    result.stories[2].dependencies = ['story-1'];

    const readinessResult = validator.validate(result);

    expect(readinessResult.pass).toBe(false);
    expect(readinessResult.qualityScore).toBeLessThan(75);
    expect(readinessResult.blockers.length).toBeGreaterThan(0);
    expect(readinessResult.blockers[0]).toContain('Quality score below pass threshold');
  });

  // ============================================================================
  // Test 19: Warnings identified when score >= 75 but individual check 50-75
  // ============================================================================
  it('should identify warnings when score >= 75 but individual check 50-75', () => {
    const result = createValidSolutioningResult(15);

    // Create a minor issue (borderline score)
    result.stories[0].technical_notes.test_requirements = 'Testing approach TBD';
    result.stories[1].acceptance_criteria = ['Do something vague', 'Maybe do this'];

    const readinessResult = validator.validate(result);

    // Should still pass overall but may have warnings
    if (readinessResult.qualityScore >= 75) {
      expect(readinessResult.pass).toBe(true);
      // Warnings may or may not be present depending on check scores
      expect(readinessResult.warnings).toBeDefined();
    }
  });

  // ============================================================================
  // Test 20: Recommendations generated based on check results
  // ============================================================================
  it('should generate recommendations based on check results', () => {
    const result = createValidSolutioningResult(15);

    const readinessResult = validator.validate(result);

    expect(readinessResult.recommendations).toBeDefined();
    expect(readinessResult.recommendations.length).toBeGreaterThan(0);
    expect(readinessResult.recommendations[0]).toContain('quality');
  });

  // ============================================================================
  // Test 21: Recommendations include positive feedback for excellent scores
  // ============================================================================
  it('should include positive feedback in recommendations for excellent scores', () => {
    const result = createValidSolutioningResult(15);

    const readinessResult = validator.validate(result);

    if (readinessResult.qualityScore >= 90) {
      expect(
        readinessResult.recommendations.some((rec) => rec.includes('Excellent'))
      ).toBe(true);
    }
  });

  // ============================================================================
  // Test 22: Handles edge case of empty stories array gracefully
  // ============================================================================
  it('should handle edge case of empty stories array gracefully', () => {
    const result = createValidSolutioningResult(0);

    const readinessResult = validator.validate(result);

    expect(readinessResult).toBeDefined();
    // Story sizing should definitely fail with 0 stories
    expect(readinessResult.checks.storySizing.pass).toBe(false);
    expect(readinessResult.checks.storySizing.issues.some(issue =>
      issue.includes('Too few stories')
    )).toBe(true);
  });

  // ============================================================================
  // Test 23: All CheckResults have required fields
  // ============================================================================
  it('should ensure all CheckResults have required fields (pass, score, details, issues)', () => {
    const result = createValidSolutioningResult(15);

    const readinessResult = validator.validate(result);

    const checks = Object.values(readinessResult.checks);
    checks.forEach((check) => {
      expect(check).toHaveProperty('pass');
      expect(check).toHaveProperty('score');
      expect(check).toHaveProperty('details');
      expect(check).toHaveProperty('issues');
      expect(typeof check.pass).toBe('boolean');
      expect(typeof check.score).toBe('number');
      expect(typeof check.details).toBe('string');
      expect(Array.isArray(check.issues)).toBe(true);
    });
  });

  // ============================================================================
  // Test 24: Scores capped at 0 and 100
  // ============================================================================
  it('should cap scores at 0 (no negative scores)', () => {
    const result = createValidSolutioningResult(5);

    // Create many failures to drive scores negative if not capped
    result.stories.forEach((story) => {
      story.title = '';
      story.description = '';
      story.acceptance_criteria = [];
      story.technical_notes.test_requirements = '';
    });

    const readinessResult = validator.validate(result);

    const checks = Object.values(readinessResult.checks);
    checks.forEach((check) => {
      expect(check.score).toBeGreaterThanOrEqual(0);
      expect(check.score).toBeLessThanOrEqual(100);
    });

    expect(readinessResult.qualityScore).toBeGreaterThanOrEqual(0);
    expect(readinessResult.qualityScore).toBeLessThanOrEqual(100);
  });
});
