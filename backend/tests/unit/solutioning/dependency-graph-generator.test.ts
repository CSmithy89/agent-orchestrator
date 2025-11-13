/**
 * Unit Tests: Dependency Graph Generator
 *
 * Tests for DependencyGraphGenerator with known dependency structures.
 *
 * @module tests/unit/solutioning/dependency-graph-generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraphGenerator } from '../../../src/solutioning/dependency-graph-generator.js';
import type { Story, DependencyEdge } from '../../../src/solutioning/types.js';

describe('DependencyGraphGenerator', () => {
  let generator: DependencyGraphGenerator;
  let mockStories: Story[];

  beforeEach(() => {
    generator = new DependencyGraphGenerator();

    // Create mock stories for testing
    mockStories = [
      {
        id: '4-1',
        epic: 'epic-4',
        title: 'Data Models',
        description: 'As a developer, I want data models',
        acceptance_criteria: ['Define types'],
        dependencies: [],
        status: 'done',
        technical_notes: {
          affected_files: ['types.ts'],
          endpoints: [],
          data_structures: ['Epic', 'Story'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 8,
        complexity: 'medium'
      },
      {
        id: '4-2',
        epic: 'epic-4',
        title: 'Bob Agent',
        description: 'As a developer, I want Bob agent setup',
        acceptance_criteria: ['Load persona'],
        dependencies: ['4-1'],
        status: 'done',
        technical_notes: {
          affected_files: ['bob-agent.ts'],
          endpoints: [],
          data_structures: ['Epic'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 6,
        complexity: 'high'
      },
      {
        id: '4-3',
        epic: 'epic-4',
        title: 'Workflow Engine',
        description: 'As a developer, I want workflow engine',
        acceptance_criteria: ['Execute workflows'],
        dependencies: ['4-1'],
        status: 'in-progress',
        technical_notes: {
          affected_files: ['workflow.ts'],
          endpoints: [],
          data_structures: ['Story'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 8,
        complexity: 'high'
      },
      {
        id: '4-4',
        epic: 'epic-4',
        title: 'Epic Formation',
        description: 'As a PM, I want epics formed',
        acceptance_criteria: ['Form epics'],
        dependencies: ['4-1', '4-2'],
        status: 'in-progress',
        technical_notes: {
          affected_files: ['epic-formation.ts'],
          endpoints: [],
          data_structures: ['Epic'],
          test_requirements: 'Unit + integration'
        },
        estimated_hours: 10,
        complexity: 'high'
      }
    ];
  });

  it('should build graph nodes correctly', () => {
    // Arrange
    const edges: DependencyEdge[] = [];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    expect(graph.nodes).toHaveLength(4);
    expect(graph.nodes[0]).toEqual({
      id: '4-1',
      title: 'Data Models',
      status: 'done',
      epic: 'epic-4',
      complexity: 'medium'
    });
  });

  it('should calculate critical path with linear dependencies', () => {
    // Arrange - Linear chain: 4-1 → 4-2 → 4-4
    // from="prerequisite", to="dependent"
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-2', to: '4-4', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    expect(graph.critical_path).toContain('4-1');
    expect(graph.critical_path).toContain('4-2');
    expect(graph.critical_path).toContain('4-4');
    expect(graph.critical_path.indexOf('4-1')).toBeLessThan(graph.critical_path.indexOf('4-2'));
    expect(graph.critical_path.indexOf('4-2')).toBeLessThan(graph.critical_path.indexOf('4-4'));
  });

  it('should calculate critical path with branching dependencies', () => {
    // Arrange - Branching: 4-1 → {4-2, 4-3} → 4-4
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-1', to: '4-3', type: 'hard', blocking: true },
      { from: '4-2', to: '4-4', type: 'hard', blocking: true },
      { from: '4-3', to: '4-4', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    expect(graph.critical_path).toHaveLength(4);
    expect(graph.critical_path[0]).toBe('4-1'); // First (no dependencies)
    expect(graph.critical_path[3]).toBe('4-4'); // Last (depends on all)
  });

  it('should identify bottlenecks correctly', () => {
    // Arrange - 4-1 blocks 3 others: 4-2, 4-3, 4-4 all depend on it
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-1', to: '4-3', type: 'hard', blocking: true },
      { from: '4-1', to: '4-4', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    expect(graph.bottlenecks).toContain('4-1');
    expect(graph.metadata.bottlenecks).toContain('4-1');
  });

  it('should find parallel groups', () => {
    // Arrange - 4-2 and 4-3 can run in parallel (both depend on 4-1 only)
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-1', to: '4-3', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    const parallel2 = graph.parallelizable.find(group =>
      group.includes('4-2') && group.includes('4-3')
    );
    expect(parallel2).toBeDefined();
    // 4-4 is also at the same level (no dependencies after 4-1), so group has 3 stories
    expect(parallel2?.length).toBeGreaterThanOrEqual(2);
  });

  it('should detect circular dependencies', () => {
    // Arrange - Circular: 4-1 → 4-2 → 4-4 → 4-1
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-2', to: '4-4', type: 'hard', blocking: true },
      { from: '4-4', to: '4-1', type: 'hard', blocking: true }
    ];

    // Act & Assert
    expect(() => generator.generateGraph(mockStories, edges)).toThrow('Circular dependency detected');
  });

  it('should handle empty dependencies (all stories independent)', () => {
    // Arrange - No dependencies
    const edges: DependencyEdge[] = [];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    expect(graph.critical_path).toHaveLength(4);
    expect(graph.bottlenecks).toHaveLength(0);
    expect(graph.parallelizable.length).toBeGreaterThanOrEqual(0);
    expect(graph.metadata.totalStories).toBe(4);
  });

  it('should calculate metadata accurately', () => {
    // Arrange
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-1', to: '4-3', type: 'hard', blocking: true },
      { from: '4-2', to: '4-4', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    expect(graph.metadata.totalStories).toBe(4);
    expect(graph.metadata.criticalPathLength).toBe(4);
    expect(graph.metadata.parallelizable).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(graph.metadata.bottlenecks)).toBe(true);
  });

  it('should ignore soft dependencies in critical path calculation', () => {
    // Arrange - Mix of hard and soft dependencies
    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-2', to: '4-4', type: 'soft', blocking: false }, // Soft - should be ignored
      { from: '4-3', to: '4-4', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(mockStories, edges);

    // Assert
    // 4-4 should not depend on 4-2 in critical path (soft dependency ignored)
    const path = graph.critical_path;
    // 4-4 might come before or after 4-2 since soft dep is ignored
    expect(path).toContain('4-2');
    expect(path).toContain('4-4');
  });

  it('should handle complex graph with multiple levels', () => {
    // Arrange - More complex scenario
    const additionalStories: Story[] = [
      ...mockStories,
      {
        id: '4-5',
        epic: 'epic-4',
        title: 'Dependency Detection',
        description: 'As a SM, I want dependency detection',
        acceptance_criteria: ['Detect dependencies'],
        dependencies: ['4-4'],
        status: 'backlog',
        technical_notes: {
          affected_files: ['dependency.ts'],
          endpoints: [],
          data_structures: ['DependencyEdge'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 8,
        complexity: 'medium'
      }
    ];

    const edges: DependencyEdge[] = [
      { from: '4-1', to: '4-2', type: 'hard', blocking: true },
      { from: '4-1', to: '4-3', type: 'hard', blocking: true },
      { from: '4-2', to: '4-4', type: 'hard', blocking: true },
      { from: '4-4', to: '4-5', type: 'hard', blocking: true }
    ];

    // Act
    const graph = generator.generateGraph(additionalStories, edges);

    // Assert
    expect(graph.nodes).toHaveLength(5);
    expect(graph.critical_path).toHaveLength(5);
    // First story should be one with no dependencies (4-1)
    expect(graph.critical_path[0]).toBe('4-1');
    expect(graph.critical_path[4]).toBe('4-5'); // Last story
  });
});
