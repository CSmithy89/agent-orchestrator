/**
 * Story Validator
 *
 * Validates story completeness, size, clarity, and dev agent compatibility.
 * Ensures stories meet quality standards for autonomous development.
 *
 * @module solutioning/story-validator
 * @see docs/stories/4-6-story-validation-quality-check.md
 */

import { Story, ValidationResult, ValidationCheck } from './types.js';

/**
 * Batch validation result for multiple stories
 */
export interface BatchValidationResult {
  /** Total number of stories validated */
  totalStories: number;

  /** Number of stories that passed validation */
  passed: number;

  /** Number of stories that failed validation */
  failed: number;

  /** Average validation score across all stories */
  avgScore: number;

  /** Map of story ID to validation result */
  results: Map<string, ValidationResult>;
}

/**
 * Story Validator
 *
 * Validates individual stories and batches of stories against quality standards.
 * Checks story size, clarity, completeness, dependencies, and dev agent compatibility.
 *
 * Validation categories and weights:
 * - Size (20%): Word count, AC count, estimated hours
 * - Clarity (30%): User story format, title, AC specificity
 * - Completeness (25%): Required fields, technical notes
 * - Dependencies (25%): Valid IDs, no circular deps
 *
 * @example
 * ```typescript
 * const validator = new StoryValidator();
 * const result = validator.validateStory(story, allStories);
 * if (!result.pass) {
 *   console.error('Validation failed:', result.blockers);
 * }
 * console.log(`Score: ${result.score.toFixed(2)}`);
 * ```
 */
export class StoryValidator {
  /**
   * Validate a single story
   *
   * Performs comprehensive validation checks across all categories:
   * - Size: Word count, AC count, estimated hours
   * - Clarity: User story format, title, AC specificity
   * - Completeness: Required fields, technical notes
   * - Dependencies: Valid IDs, no circular dependencies
   * - Dev Agent Compatibility: Single responsibility, testable
   *
   * @param story Story to validate
   * @param allStories All stories in the project (for dependency validation)
   * @returns ValidationResult with pass/fail, score, checks, blockers, warnings
   *
   * @example
   * ```typescript
   * const validator = new StoryValidator();
   * const result = validator.validateStory(story, allStories);
   * console.log(`Validation ${result.pass ? 'passed' : 'failed'} with score ${result.score}`);
   * ```
   */
  validateStory(story: Story, allStories: Story[]): ValidationResult {
    const checks: ValidationCheck[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Run all validation checks
    const sizeChecks = this.checkStorySize(story);
    const clarityChecks = this.checkStoryClarity(story);
    const completenessChecks = this.checkStoryCompleteness(story);
    const dependencyChecks = this.checkDependencies(story, allStories);
    const devAgentChecks = this.checkDevAgentCompatibility(story);

    checks.push(...sizeChecks, ...clarityChecks, ...completenessChecks, ...dependencyChecks, ...devAgentChecks);

    // Collect blockers and warnings
    for (const check of checks) {
      if (!check.pass) {
        // Determine if it's a blocker or warning based on severity
        if (this.isBlocker(check)) {
          blockers.push(check.details);
        } else {
          warnings.push(check.details);
        }
      }
    }

    // Calculate weighted score
    const score = this.calculateWeightedScore(checks);

    // Pass if no blockers
    const pass = blockers.length === 0;

    return {
      pass,
      score,
      checks,
      blockers,
      warnings
    };
  }

  /**
   * Validate multiple stories in batch
   *
   * Validates all stories and aggregates results for reporting.
   *
   * @param stories Array of stories to validate
   * @returns BatchValidationResult with aggregate statistics
   *
   * @example
   * ```typescript
   * const validator = new StoryValidator();
   * const batchResult = validator.validateStories(stories);
   * console.log(`${batchResult.passed}/${batchResult.totalStories} stories passed`);
   * console.log(`Average score: ${batchResult.avgScore.toFixed(2)}`);
   * ```
   */
  validateStories(stories: Story[]): BatchValidationResult {
    const results = new Map<string, ValidationResult>();
    let totalScore = 0;
    let passed = 0;

    for (const story of stories) {
      const result = this.validateStory(story, stories);
      results.set(story.id, result);
      totalScore += result.score;
      if (result.pass) {
        passed++;
      }
    }

    return {
      totalStories: stories.length,
      passed,
      failed: stories.length - passed,
      avgScore: stories.length > 0 ? totalScore / stories.length : 0,
      results
    };
  }

  /**
   * Check story size constraints
   *
   * Validates:
   * - Word count < 500
   * - Acceptance criteria count: 8-12 (target), <15 (max)
   * - Estimated hours: <2 (target), <8 (max)
   *
   * @param story Story to check
   * @returns Array of validation checks
   */
  private checkStorySize(story: Story): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check word count
    const wordCount = story.description.split(/\s+/).length;
    checks.push({
      category: 'size',
      name: 'Word Count',
      pass: wordCount < 500,
      details: wordCount < 500
        ? `Story description has ${wordCount} words (within 500-word limit)`
        : `Story description has ${wordCount} words (exceeds 500-word limit)`
    });

    // Check acceptance criteria count
    const acCount = story.acceptance_criteria.length;
    const acPass = acCount >= 8 && acCount <= 12;
    const acWarning = acCount > 12 && acCount < 15;
    checks.push({
      category: 'size',
      name: 'Acceptance Criteria Count',
      pass: acPass || acWarning,
      details: acPass
        ? `Story has ${acCount} acceptance criteria (within 8-12 range)`
        : acWarning
        ? `Story has ${acCount} acceptance criteria (above target 8-12, consider splitting)`
        : acCount < 8
        ? `Story has ${acCount} acceptance criteria (below minimum 8)`
        : `Story has ${acCount} acceptance criteria (exceeds maximum 15, must split)`
    });

    // Check estimated hours
    const hoursPass = story.estimated_hours <= 2;
    const hoursWarning = story.estimated_hours > 2 && story.estimated_hours <= 8;
    checks.push({
      category: 'size',
      name: 'Estimated Hours',
      pass: hoursPass || hoursWarning,
      details: hoursPass
        ? `Story estimated at ${story.estimated_hours} hours (within 2-hour target)`
        : hoursWarning
        ? `Story estimated at ${story.estimated_hours} hours (above target 2, consider splitting)`
        : `Story estimated at ${story.estimated_hours} hours (exceeds maximum 8, must split)`
    });

    return checks;
  }

  /**
   * Check story clarity
   *
   * Validates:
   * - User story format: "As a..., I want..., So that..."
   * - Clear, action-oriented title
   * - Specific, testable acceptance criteria
   *
   * @param story Story to check
   * @returns Array of validation checks
   */
  private checkStoryClarity(story: Story): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check user story format
    const hasAsA = /as an?/i.test(story.description);
    const hasIWant = /I want/i.test(story.description);
    const hasSoThat = /so that/i.test(story.description);
    const validFormat = hasAsA && hasIWant && hasSoThat;
    checks.push({
      category: 'clarity',
      name: 'User Story Format',
      pass: validFormat,
      details: validFormat
        ? 'Story follows "As a..., I want..., So that..." format'
        : 'Story does not follow "As a..., I want..., So that..." format'
    });

    // Check title clarity (not too short, not too long, action-oriented)
    const titleWords = story.title.split(/\s+/).length;
    const titlePass = titleWords >= 3 && titleWords <= 10;
    checks.push({
      category: 'clarity',
      name: 'Title Clarity',
      pass: titlePass,
      details: titlePass
        ? `Story title is clear and concise (${titleWords} words)`
        : titleWords < 3
        ? `Story title is too short (${titleWords} words, need 3-10)`
        : `Story title is too long (${titleWords} words, need 3-10)`
    });

    // Check acceptance criteria specificity (not too vague)
    let vagueCriteria = 0;
    const vagueWords = ['should', 'might', 'could', 'possibly', 'maybe', 'probably'];
    for (const ac of story.acceptance_criteria) {
      const hasVagueWord = vagueWords.some(word => ac.toLowerCase().includes(word));
      if (hasVagueWord || ac.length < 20) {
        vagueCriteria++;
      }
    }
    const criteriaPass = vagueCriteria === 0;
    checks.push({
      category: 'clarity',
      name: 'Acceptance Criteria Specificity',
      pass: criteriaPass,
      details: criteriaPass
        ? 'All acceptance criteria are specific and testable'
        : `${vagueCriteria} acceptance criteria are vague or too short`
    });

    return checks;
  }

  /**
   * Check story completeness
   *
   * Validates:
   * - All required fields present
   * - Technical notes complete (affected_files, endpoints, data_structures, test_requirements)
   *
   * @param story Story to check
   * @returns Array of validation checks
   */
  private checkStoryCompleteness(story: Story): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check required fields
    const requiredFields = ['id', 'epic', 'title', 'description', 'acceptance_criteria', 'dependencies', 'status', 'technical_notes', 'estimated_hours', 'complexity'];
    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (!(field in story) || (story as any)[field] === undefined || (story as any)[field] === null) {
        missingFields.push(field);
      }
    }
    checks.push({
      category: 'completeness',
      name: 'Required Fields',
      pass: missingFields.length === 0,
      details: missingFields.length === 0
        ? 'All required fields are present'
        : `Missing required fields: ${missingFields.join(', ')}`
    });

    // Check technical notes completeness
    const technicalNotesFields = ['affected_files', 'endpoints', 'data_structures', 'test_requirements'];
    const missingTechnicalNotes: string[] = [];
    for (const field of technicalNotesFields) {
      const value = (story.technical_notes as any)[field];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        missingTechnicalNotes.push(field);
      }
    }
    checks.push({
      category: 'completeness',
      name: 'Technical Notes',
      pass: missingTechnicalNotes.length === 0,
      details: missingTechnicalNotes.length === 0
        ? 'All technical notes fields are complete'
        : `Missing or empty technical notes fields: ${missingTechnicalNotes.join(', ')}`
    });

    return checks;
  }

  /**
   * Check dependency validity
   *
   * Validates:
   * - All dependency IDs exist in story set
   * - No circular dependencies
   * - No self-dependencies
   *
   * @param story Story to check
   * @param allStories All stories in the project
   * @returns Array of validation checks
   */
  private checkDependencies(story: Story, allStories: Story[]): ValidationCheck[] {
    const checks: ValidationCheck[] = [];
    const storyIds = new Set(allStories.map(s => s.id));

    // Check for self-dependencies
    const hasSelfDep = story.dependencies.includes(story.id);
    checks.push({
      category: 'dependencies',
      name: 'Self-Dependencies',
      pass: !hasSelfDep,
      details: hasSelfDep
        ? `Story ${story.id} depends on itself`
        : 'No self-dependencies'
    });

    // Check for invalid dependency IDs
    const invalidDeps = story.dependencies.filter(dep => !storyIds.has(dep));
    checks.push({
      category: 'dependencies',
      name: 'Valid Dependency IDs',
      pass: invalidDeps.length === 0,
      details: invalidDeps.length === 0
        ? 'All dependency IDs are valid'
        : `Invalid dependency IDs: ${invalidDeps.join(', ')}`
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(story, allStories, new Set());
    checks.push({
      category: 'dependencies',
      name: 'Circular Dependencies',
      pass: circularDeps.length === 0,
      details: circularDeps.length === 0
        ? 'No circular dependencies detected'
        : `Circular dependency detected: ${circularDeps.join(' -> ')}`
    });

    return checks;
  }

  /**
   * Check dev agent compatibility
   *
   * Validates:
   * - Single responsibility (not multiple unrelated features)
   * - Testable acceptance criteria
   *
   * @param story Story to check
   * @returns Array of validation checks
   */
  private checkDevAgentCompatibility(story: Story): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    // Check for single responsibility (heuristic: title doesn't have "and" or multiple verbs)
    const multipleFeatures = /\band\b/i.test(story.title) && story.title.split(/\band\b/i).length > 2;
    checks.push({
      category: 'dev-agent',
      name: 'Single Responsibility',
      pass: !multipleFeatures,
      details: multipleFeatures
        ? 'Story appears to have multiple unrelated features (consider splitting)'
        : 'Story has single, focused responsibility'
    });

    // Check for testable acceptance criteria (not all ACs should be vague)
    const testableACs = story.acceptance_criteria.filter(ac => {
      const hasVerb = /\b(verify|validate|check|test|ensure|confirm|assert)\b/i.test(ac);
      const hasMetric = /\d+/.test(ac) || /\b(pass|fail|success|error|complete|valid|invalid)\b/i.test(ac);
      return hasVerb || hasMetric;
    });
    const testablePass = testableACs.length >= story.acceptance_criteria.length * 0.7;
    checks.push({
      category: 'dev-agent',
      name: 'Testable Acceptance Criteria',
      pass: testablePass,
      details: testablePass
        ? `${testableACs.length}/${story.acceptance_criteria.length} acceptance criteria are testable`
        : `Only ${testableACs.length}/${story.acceptance_criteria.length} acceptance criteria are testable (need 70%+)`
    });

    return checks;
  }

  /**
   * Detect circular dependencies using depth-first search
   *
   * @param story Story to check
   * @param allStories All stories in the project
   * @param visited Set of visited story IDs (for cycle detection)
   * @param path Current path (for reporting cycle)
   * @returns Array of story IDs forming a circular dependency, empty if none
   */
  private detectCircularDependencies(
    story: Story,
    allStories: Story[],
    visited: Set<string>,
    path: string[] = []
  ): string[] {
    // If we've visited this story in the current path, we have a cycle
    if (path.includes(story.id)) {
      return [...path.slice(path.indexOf(story.id)), story.id];
    }

    // If we've fully explored this story before, skip
    if (visited.has(story.id)) {
      return [];
    }

    // Add to current path
    const newPath = [...path, story.id];

    // Check each dependency
    for (const depId of story.dependencies) {
      const depStory = allStories.find(s => s.id === depId);
      if (depStory) {
        const cycle = this.detectCircularDependencies(depStory, allStories, visited, newPath);
        if (cycle.length > 0) {
          return cycle;
        }
      }
    }

    // Mark as fully explored
    visited.add(story.id);

    return [];
  }

  /**
   * Calculate weighted score from validation checks
   *
   * Weights:
   * - Size: 20%
   * - Clarity: 30%
   * - Completeness: 25%
   * - Dependencies: 25%
   *
   * @param checks Array of validation checks
   * @returns Weighted score (0.0-1.0)
   */
  private calculateWeightedScore(checks: ValidationCheck[]): number {
    const weights: Record<string, number> = {
      size: 0.2,
      clarity: 0.3,
      completeness: 0.25,
      dependencies: 0.25,
      'dev-agent': 0.0 // Dev agent checks contribute to overall pass/fail but not to score
    };

    const categoryScores: Record<string, { passed: number; total: number }> = {};

    // Count passed/total for each category
    for (const check of checks) {
      if (!categoryScores[check.category]) {
        categoryScores[check.category] = { passed: 0, total: 0 };
      }
      const categoryScore = categoryScores[check.category];
      if (categoryScore) {
        categoryScore.total++;
        if (check.pass) {
          categoryScore.passed++;
        }
      }
    }

    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;
    for (const [category, { passed, total }] of Object.entries(categoryScores)) {
      const weight = weights[category] || 0;
      const categoryScore = total > 0 ? passed / total : 1;
      totalScore += categoryScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Determine if a failed check is a blocker
   *
   * Blockers:
   * - Missing required fields
   * - Circular dependencies
   * - Self-dependencies
   * - Invalid dependency IDs
   * - >8 estimated hours
   * - >15 acceptance criteria
   *
   * @param check Validation check
   * @returns True if check failure is a blocker
   */
  private isBlocker(check: ValidationCheck): boolean {
    // Check name-based blockers
    const blockerNames = [
      'Required Fields',
      'Circular Dependencies',
      'Self-Dependencies',
      'Valid Dependency IDs'
    ];
    if (blockerNames.includes(check.name)) {
      return true;
    }

    // Check details-based blockers
    if (check.name === 'Estimated Hours' && check.details.includes('exceeds maximum 8')) {
      return true;
    }
    if (check.name === 'Acceptance Criteria Count' && check.details.includes('exceeds maximum 15')) {
      return true;
    }

    return false;
  }
}
