/**
 * Unit tests for JSON Schema Validation
 *
 * Tests validate Epic, Story, DependencyGraph, and ValidationResult
 * schemas with valid and invalid inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  validateEpic,
  validateStory,
  validateDependencyGraph,
  validateValidationResult,
} from '../../../src/solutioning/schemas.js';
import type {
  Epic,
  Story,
  DependencyGraph,
  ValidationResult,
} from '../../../src/solutioning/types.js';

describe('Epic Schema Validation', () => {
  it('should validate a valid epic object', () => {
    const epic: Epic = {
      id: 'epic-4',
      title: 'Solutioning Phase Automation',
      goal: 'Automate epic formation and story decomposition',
      value_proposition: 'Reduce manual planning effort by 80%',
      stories: [],
      business_value: '15 hours saved per sprint',
      estimated_duration: '2-3 sprints',
    };

    const result = validateEpic(epic);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.blockers).toHaveLength(0);
  });

  it('should reject epic with invalid id format', () => {
    const epic = {
      id: 'invalid-id',
      title: 'Test Epic',
      goal: 'Test goal with sufficient length',
      value_proposition: 'Test value proposition with sufficient length',
      stories: [],
      business_value: 'Test value',
      estimated_duration: '1-2 sprints',
    };

    const result = validateEpic(epic);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('id'))).toBe(true);
  });

  it('should reject epic with missing required fields', () => {
    const epic = {
      id: 'epic-4',
      title: 'Test Epic',
    };

    const result = validateEpic(epic);
    expect(result.pass).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('should reject epic with invalid story in stories array', () => {
    const epic = {
      id: 'epic-4',
      title: 'Test Epic',
      goal: 'Test goal with sufficient length',
      value_proposition: 'Test value proposition with sufficient length',
      stories: [{ invalid: 'story' }],
      business_value: 'Test value',
      estimated_duration: '1-2 sprints',
    };

    const result = validateEpic(epic);
    expect(result.pass).toBe(false);
  });

  it('should reject epic with goal too short', () => {
    const epic = {
      id: 'epic-4',
      title: 'Test Epic',
      goal: 'Short',
      value_proposition: 'Test value proposition with sufficient length',
      stories: [],
      business_value: 'Test value',
      estimated_duration: '1-2 sprints',
    };

    const result = validateEpic(epic);
    expect(result.pass).toBe(false);
  });
});

describe('Story Schema Validation', () => {
  it('should validate a valid story object', () => {
    const story: Story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Solutioning Data Models',
      description: 'As a developer, I want data models, So that I can build features.',
      acceptance_criteria: [
        'TypeScript interfaces defined',
        'JSON schema validation implemented',
        'All tests passing with 80%+ coverage',
      ],
      dependencies: [],
      status: 'in-progress',
      technical_notes: {
        affected_files: ['backend/src/solutioning/types.ts'],
        endpoints: [],
        data_structures: ['Epic', 'Story', 'DependencyGraph'],
        test_requirements: 'Unit tests with 80%+ coverage using Vitest',
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.blockers).toHaveLength(0);
  });

  it('should reject story with invalid id format', () => {
    const story = {
      id: 'invalid',
      epic: 'epic-4',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Test',
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('id'))).toBe(true);
  });

  it('should reject story with invalid epic format', () => {
    const story = {
      id: '4-1',
      epic: 'invalid-epic',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Test',
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('epic'))).toBe(true);
  });

  it('should reject story with invalid status', () => {
    const story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'invalid-status',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Test',
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('status'))).toBe(true);
  });

  it('should reject story with invalid complexity', () => {
    const story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Test',
      },
      estimated_hours: 8,
      complexity: 'invalid',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('complexity'))).toBe(true);
  });

  it('should reject story with missing technical_notes fields', () => {
    const story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
  });

  it('should reject story with negative estimated_hours', () => {
    const story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Test',
      },
      estimated_hours: -5,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('estimated_hours'))).toBe(true);
  });

  it('should reject story with empty acceptance_criteria', () => {
    const story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Test Story',
      description: 'Test description',
      acceptance_criteria: [],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: 'Test',
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('acceptance_criteria'))).toBe(true);
  });
});

describe('DependencyGraph Schema Validation', () => {
  it('should validate a valid dependency graph', () => {
    const graph: DependencyGraph = {
      nodes: [
        {
          id: '4-1',
          title: 'Data Models',
          status: 'done',
          epic: 'epic-4',
          complexity: 'medium',
        },
        {
          id: '4-2',
          title: 'Bob Agent',
          status: 'in-progress',
          epic: 'epic-4',
          complexity: 'high',
        },
      ],
      edges: [
        {
          from: '4-1',
          to: '4-2',
          type: 'hard',
          blocking: true,
        },
      ],
      critical_path: ['4-1', '4-2', '4-3'],
      bottlenecks: ['4-1'],
      parallelizable: [['4-4', '4-5'], ['4-6', '4-7']],
      metadata: {
        totalStories: 9,
        parallelizable: 6,
        bottlenecks: ['4-1'],
        criticalPathLength: 3,
      },
    };

    const result = validateDependencyGraph(graph);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.blockers).toHaveLength(0);
  });

  it('should reject graph with invalid node id format', () => {
    const graph = {
      nodes: [
        {
          id: 'invalid',
          title: 'Test',
          status: 'backlog',
          epic: 'epic-4',
          complexity: 'medium',
        },
      ],
      edges: [],
      critical_path: [],
      bottlenecks: [],
      parallelizable: [],
      metadata: {
        totalStories: 1,
        parallelizable: 0,
        bottlenecks: [],
        criticalPathLength: 0,
      },
    };

    const result = validateDependencyGraph(graph);
    expect(result.pass).toBe(false);
  });

  it('should reject graph with invalid edge type', () => {
    const graph = {
      nodes: [],
      edges: [
        {
          from: '4-1',
          to: '4-2',
          type: 'invalid',
          blocking: true,
        },
      ],
      critical_path: [],
      bottlenecks: [],
      parallelizable: [],
      metadata: {
        totalStories: 0,
        parallelizable: 0,
        bottlenecks: [],
        criticalPathLength: 0,
      },
    };

    const result = validateDependencyGraph(graph);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('type'))).toBe(true);
  });

  it('should reject graph with missing metadata fields', () => {
    const graph = {
      nodes: [],
      edges: [],
      critical_path: [],
      bottlenecks: [],
      parallelizable: [],
      metadata: {
        totalStories: 0,
      },
    };

    const result = validateDependencyGraph(graph);
    expect(result.pass).toBe(false);
  });

  it('should reject graph with negative metadata values', () => {
    const graph = {
      nodes: [],
      edges: [],
      critical_path: [],
      bottlenecks: [],
      parallelizable: [],
      metadata: {
        totalStories: -1,
        parallelizable: 0,
        bottlenecks: [],
        criticalPathLength: 0,
      },
    };

    const result = validateDependencyGraph(graph);
    expect(result.pass).toBe(false);
  });
});

describe('ValidationResult Schema Validation', () => {
  it('should validate a valid validation result', () => {
    const validationResult: ValidationResult = {
      pass: true,
      score: 0.95,
      checks: [
        {
          category: 'completeness',
          name: 'All Fields Present',
          pass: true,
          details: 'All required fields are present',
        },
      ],
      blockers: [],
      warnings: ['Story has 15 estimated hours (target: <8 hours)'],
    };

    const result = validateValidationResult(validationResult);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.blockers).toHaveLength(0);
  });

  it('should reject validation result with score out of range', () => {
    const validationResult = {
      pass: true,
      score: 1.5,
      checks: [],
      blockers: [],
      warnings: [],
    };

    const result = validateValidationResult(validationResult);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('score'))).toBe(true);
  });

  it('should reject validation result with invalid check structure', () => {
    const validationResult = {
      pass: true,
      score: 0.95,
      checks: [
        {
          category: 'test',
          name: 'Test Check',
          // Missing pass field
        },
      ],
      blockers: [],
      warnings: [],
    };

    const result = validateValidationResult(validationResult);
    expect(result.pass).toBe(false);
  });

  it('should reject validation result with missing required fields', () => {
    const validationResult = {
      pass: true,
      score: 0.95,
    };

    const result = validateValidationResult(validationResult);
    expect(result.pass).toBe(false);
  });
});

describe('Edge Cases and Error Handling', () => {
  it('should handle null input gracefully', () => {
    const result = validateStory(null);
    expect(result.pass).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('should handle undefined input gracefully', () => {
    const result = validateStory(undefined);
    expect(result.pass).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('should handle empty object gracefully', () => {
    const result = validateStory({});
    expect(result.pass).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('should handle array input gracefully', () => {
    const result = validateStory([]);
    expect(result.pass).toBe(false);
  });

  it('should handle number input gracefully', () => {
    const result = validateStory(123);
    expect(result.pass).toBe(false);
  });

  it('should handle string input gracefully', () => {
    const result = validateStory('invalid');
    expect(result.pass).toBe(false);
  });

  it('should provide detailed error messages for field paths', () => {
    const story = {
      id: '4-1',
      epic: 'epic-4',
      title: 'Test',
      description: 'Test',
      acceptance_criteria: ['AC1'],
      dependencies: [],
      status: 'backlog',
      technical_notes: {
        affected_files: [],
        endpoints: [],
        data_structures: [],
        test_requirements: '', // Empty string should fail minLength
      },
      estimated_hours: 8,
      complexity: 'medium',
    };

    const result = validateStory(story);
    expect(result.pass).toBe(false);
    expect(result.blockers.some((b) => b.includes('test_requirements'))).toBe(true);
  });
});
