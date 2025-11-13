/**
 * Unit Tests for SprintStatusGenerator
 *
 * Tests YAML generation from SolutioningResult with various configurations.
 * Validates project metadata, status definitions, hierarchical structure, and YAML validity.
 */

import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { SprintStatusGenerator } from '../../../src/solutioning/sprint-status-generator.js';
import { SolutioningResult } from '../../../src/solutioning/solutioning-orchestrator.js';
import { Epic, Story } from '../../../src/solutioning/types.js';

describe('SprintStatusGenerator', () => {
  let generator: SprintStatusGenerator;

  beforeEach(() => {
    generator = new SprintStatusGenerator();
  });

  describe('generateSprintStatus - Basic Generation', () => {
    it('should generate valid YAML from minimal SolutioningResult (1 epic, 1 story)', () => {
      const story: Story = {
        id: '1-1',
        epic: 'epic-1',
        title: 'Test Story',
        description: 'As a developer, I want to test, So that I can verify.',
        acceptance_criteria: [
          'AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'
        ],
        dependencies: [],
        status: 'backlog',
        technical_notes: {
          affected_files: ['test.ts'],
          endpoints: [],
          data_structures: [],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 2,
        complexity: 'medium'
      };

      const epic: Epic = {
        id: 'epic-1',
        title: 'Test Epic',
        goal: 'Test epic goal',
        value_proposition: 'Test value proposition',
        stories: [story],
        business_value: 'Test business value',
        estimated_duration: '1 sprint'
      };

      const result: SolutioningResult = {
        epics: [epic],
        stories: [story],
        dependencyGraph: {
          nodes: [],
          edges: [],
          critical_path: [],
          bottlenecks: [],
          parallelizable: [],
          metadata: {
            total_stories: 1,
            total_dependencies: 0,
            avg_dependencies_per_story: 0,
            max_parallel_stories: 1,
            estimated_total_time: 2,
            generated: new Date().toISOString()
          }
        },
        metrics: {
          totalEpics: 1,
          totalStories: 1,
          avgStoriesPerEpic: 1,
          executionTimeMs: 1000,
          llmTokensUsed: 1000,
          epicFormationConfidence: 0.9,
          avgStoryDecompositionConfidence: 0.9,
          lowConfidenceDecisions: [],
          oversizedStoriesSplit: 0,
          epicMetrics: [],
          dependencyDetectionTimeMs: 100,
          graphGenerationTimeMs: 50,
          totalDependencies: 0,
          hardDependencies: 0,
          softDependencies: 0,
          validationTimeMs: 50,
          totalStoriesValidated: 1,
          avgValidationScore: 0.9,
          totalBlockers: 0,
          totalWarnings: 0,
          failedStoryIds: []
        }
      };

      const yaml = generator.generateSprintStatus(result, 'Test Project');

      // Should not throw when parsing
      expect(() => parseYaml(yaml)).not.toThrow();

      // Should include project name
      expect(yaml).toContain('project: Test Project');

      // Should include epic and story
      expect(yaml).toContain('epic-1: backlog');
      expect(yaml).toContain('1-1-test-story: backlog');
      expect(yaml).toContain('epic-1-retrospective: optional');
    });

    it('should generate valid YAML from multiple epics and stories', () => {
      const stories: Story[] = [
        {
          id: '1-1',
          epic: 'epic-1',
          title: 'Story One',
          description: 'As a developer, I want to test, So that I can verify.',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['test.ts'],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'medium'
        },
        {
          id: '1-2',
          epic: 'epic-1',
          title: 'Story Two',
          description: 'As a developer, I want to test, So that I can verify.',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: ['1-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['test.ts'],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'medium'
        },
        {
          id: '2-1',
          epic: 'epic-2',
          title: 'Story Three',
          description: 'As a developer, I want to test, So that I can verify.',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['test.ts'],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'medium'
        }
      ];

      const epics: Epic[] = [
        {
          id: 'epic-1',
          title: 'Epic One',
          goal: 'Epic one goal',
          value_proposition: 'Epic one value',
          stories: [stories[0], stories[1]],
          business_value: 'Epic one business value',
          estimated_duration: '1 sprint'
        },
        {
          id: 'epic-2',
          title: 'Epic Two',
          goal: 'Epic two goal',
          value_proposition: 'Epic two value',
          stories: [stories[2]],
          business_value: 'Epic two business value',
          estimated_duration: '1 sprint'
        }
      ];

      const result: SolutioningResult = {
        epics,
        stories,
        dependencyGraph: {
          nodes: [],
          edges: [],
          critical_path: [],
          bottlenecks: [],
          parallelizable: [],
          metadata: {
            total_stories: 3,
            total_dependencies: 1,
            avg_dependencies_per_story: 0.33,
            max_parallel_stories: 2,
            estimated_total_time: 6,
            generated: new Date().toISOString()
          }
        },
        metrics: {
          totalEpics: 2,
          totalStories: 3,
          avgStoriesPerEpic: 1.5,
          executionTimeMs: 2000,
          llmTokensUsed: 2000,
          epicFormationConfidence: 0.9,
          avgStoryDecompositionConfidence: 0.9,
          lowConfidenceDecisions: [],
          oversizedStoriesSplit: 0,
          epicMetrics: [],
          dependencyDetectionTimeMs: 100,
          graphGenerationTimeMs: 50,
          totalDependencies: 1,
          hardDependencies: 1,
          softDependencies: 0,
          validationTimeMs: 50,
          totalStoriesValidated: 3,
          avgValidationScore: 0.9,
          totalBlockers: 0,
          totalWarnings: 0,
          failedStoryIds: []
        }
      };

      const yaml = generator.generateSprintStatus(result, 'Multi Epic Project');

      // Parse to verify validity
      const parsed = parseYaml(yaml);
      expect(parsed).toBeDefined();

      // Should include all epics
      expect(yaml).toContain('epic-1: backlog');
      expect(yaml).toContain('epic-2: backlog');

      // Should include all stories
      expect(yaml).toContain('1-1-story-one: backlog');
      expect(yaml).toContain('1-2-story-two: backlog');
      expect(yaml).toContain('2-1-story-three: backlog');

      // Should include retrospectives
      expect(yaml).toContain('epic-1-retrospective: optional');
      expect(yaml).toContain('epic-2-retrospective: optional');
    });
  });

  describe('generateSprintStatus - Project Metadata', () => {
    it('should include generated date in YYYY-MM-DD format', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      // Check date format in header comment
      expect(yaml).toMatch(/# Date: \d{4}-\d{2}-\d{2}/);

      // Check date in metadata
      expect(yaml).toMatch(/generated: \d{4}-\d{2}-\d{2}/);

      // Parse and verify date is valid
      const parsed = parseYaml(yaml);
      expect(parsed.generated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include project name', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'My Awesome Project');

      expect(yaml).toContain('project: My Awesome Project');

      const parsed = parseYaml(yaml);
      expect(parsed.project).toBe('My Awesome Project');
    });

    it('should generate project key from project name', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Agent Orchestrator');

      expect(yaml).toContain('project_key: agent-orchestrator');

      const parsed = parseYaml(yaml);
      expect(parsed.project_key).toBe('agent-orchestrator');
    });

    it('should include tracking system as file-system', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('tracking_system: file-system');

      const parsed = parseYaml(yaml);
      expect(parsed.tracking_system).toBe('file-system');
    });

    it('should include story location placeholder', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('story_location: "{project-root}/docs/stories"');

      const parsed = parseYaml(yaml);
      expect(parsed.story_location).toBe('{project-root}/docs/stories');
    });
  });

  describe('generateSprintStatus - Status Definitions Header', () => {
    it('should include comprehensive status definitions comment block', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      // Check for status definitions header
      expect(yaml).toContain('# STATUS DEFINITIONS:');
      expect(yaml).toContain('# ==================');

      // Check for epic status definitions
      expect(yaml).toContain('# Epic Status:');
      expect(yaml).toContain('#   - backlog: Epic exists in epic file but not contexted');
      expect(yaml).toContain('#   - contexted: Epic tech context created');

      // Check for story status definitions
      expect(yaml).toContain('# Story Status:');
      expect(yaml).toContain('#   - backlog: Story only exists in epic file');
      expect(yaml).toContain('#   - drafted: Story file created in stories folder');
      expect(yaml).toContain('#   - ready-for-dev: Draft approved and story context created');
      expect(yaml).toContain('#   - in-progress: Developer actively working on implementation');
      expect(yaml).toContain('#   - review: Under SM review');
      expect(yaml).toContain('#   - done: Story completed');

      // Check for retrospective status definitions
      expect(yaml).toContain('# Retrospective Status:');
      expect(yaml).toContain('#   - optional: Can be completed but not required');
      expect(yaml).toContain('#   - completed: Retrospective has been done');
    });

    it('should include workflow notes comment block', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('# WORKFLOW NOTES:');
      expect(yaml).toContain('# ===============');
      expect(yaml).toContain('# - Epics should be \'contexted\' before stories can be \'drafted\'');
      expect(yaml).toContain('# - Stories can be worked in parallel if team capacity allows');
    });
  });

  describe('generateSprintStatus - Epic and Story Tracking', () => {
    it('should track epic status as backlog', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('epic-1: backlog');

      const parsed = parseYaml(yaml);
      expect(parsed.development_status['epic-1']).toBe('backlog');
    });

    it('should track story status as backlog', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('1-1-test-story: backlog');

      const parsed = parseYaml(yaml);
      expect(parsed.development_status['1-1-test-story']).toBe('backlog');
    });

    it('should include retrospective status as optional', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('epic-1-retrospective: optional');

      const parsed = parseYaml(yaml);
      expect(parsed.development_status['epic-1-retrospective']).toBe('optional');
    });

    it('should format story key correctly with kebab-case title', () => {
      const story: Story = {
        id: '4-7',
        epic: 'epic-4',
        title: 'Sprint Status File Generation',
        description: 'Test',
        acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
        dependencies: [],
        status: 'backlog',
        technical_notes: {
          affected_files: ['test.ts'],
          endpoints: [],
          data_structures: [],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 2,
        complexity: 'medium'
      };

      const epic: Epic = {
        id: 'epic-4',
        title: 'Test Epic',
        goal: 'Test goal',
        value_proposition: 'Test value',
        stories: [story],
        business_value: 'Test business value',
        estimated_duration: '1 sprint'
      };

      const result: SolutioningResult = {
        epics: [epic],
        stories: [story],
        dependencyGraph: createMinimalDependencyGraph(),
        metrics: createMinimalMetrics()
      };

      const yaml = generator.generateSprintStatus(result, 'Test Project');

      expect(yaml).toContain('4-7-sprint-status-file-generation: backlog');

      const parsed = parseYaml(yaml);
      expect(parsed.development_status['4-7-sprint-status-file-generation']).toBe('backlog');
    });

    it('should handle story titles with special characters', () => {
      const story: Story = {
        id: '2-3',
        epic: 'epic-2',
        title: 'API & WebSocket Integration',
        description: 'Test',
        acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
        dependencies: [],
        status: 'backlog',
        technical_notes: {
          affected_files: ['test.ts'],
          endpoints: [],
          data_structures: [],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 2,
        complexity: 'medium'
      };

      const epic: Epic = {
        id: 'epic-2',
        title: 'Test Epic',
        goal: 'Test goal',
        value_proposition: 'Test value',
        stories: [story],
        business_value: 'Test business value',
        estimated_duration: '1 sprint'
      };

      const result: SolutioningResult = {
        epics: [epic],
        stories: [story],
        dependencyGraph: createMinimalDependencyGraph(),
        metrics: createMinimalMetrics()
      };

      const yaml = generator.generateSprintStatus(result, 'Test Project');

      // Ampersand should be removed, spaces converted to hyphens
      expect(yaml).toContain('2-3-api-websocket-integration: backlog');
    });
  });

  describe('generateSprintStatus - YAML Validity', () => {
    it('should generate valid YAML that can be parsed', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      // Should not throw
      expect(() => parseYaml(yaml)).not.toThrow();

      const parsed = parseYaml(yaml);
      expect(parsed).toBeDefined();
      expect(parsed.project).toBeDefined();
      expect(parsed.development_status).toBeDefined();
    });

    it('should maintain hierarchical structure in parsed YAML', () => {
      const result = createMinimalResult();
      const yaml = generator.generateSprintStatus(result, 'Test Project');

      const parsed = parseYaml(yaml);

      // Check top-level structure
      expect(parsed).toHaveProperty('generated');
      expect(parsed).toHaveProperty('project');
      expect(parsed).toHaveProperty('project_key');
      expect(parsed).toHaveProperty('tracking_system');
      expect(parsed).toHaveProperty('story_location');
      expect(parsed).toHaveProperty('development_status');

      // Check development_status structure
      expect(parsed.development_status).toHaveProperty('epic-1');
      expect(parsed.development_status).toHaveProperty('1-1-test-story');
      expect(parsed.development_status).toHaveProperty('epic-1-retrospective');
    });
  });
});

// Helper functions to create minimal test fixtures
function createMinimalResult(): SolutioningResult {
  const story: Story = {
    id: '1-1',
    epic: 'epic-1',
    title: 'Test Story',
    description: 'As a developer, I want to test, So that I can verify.',
    acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
    dependencies: [],
    status: 'backlog',
    technical_notes: {
      affected_files: ['test.ts'],
      endpoints: [],
      data_structures: [],
      test_requirements: 'Unit tests'
    },
    estimated_hours: 2,
    complexity: 'medium'
  };

  const epic: Epic = {
    id: 'epic-1',
    title: 'Test Epic',
    goal: 'Test epic goal',
    value_proposition: 'Test value proposition',
    stories: [story],
    business_value: 'Test business value',
    estimated_duration: '1 sprint'
  };

  return {
    epics: [epic],
    stories: [story],
    dependencyGraph: createMinimalDependencyGraph(),
    metrics: createMinimalMetrics()
  };
}

function createMinimalDependencyGraph() {
  return {
    nodes: [],
    edges: [],
    critical_path: [],
    bottlenecks: [],
    parallelizable: [],
    metadata: {
      total_stories: 1,
      total_dependencies: 0,
      avg_dependencies_per_story: 0,
      max_parallel_stories: 1,
      estimated_total_time: 2,
      generated: new Date().toISOString()
    }
  };
}

function createMinimalMetrics() {
  return {
    totalEpics: 1,
    totalStories: 1,
    avgStoriesPerEpic: 1,
    executionTimeMs: 1000,
    llmTokensUsed: 1000,
    epicFormationConfidence: 0.9,
    avgStoryDecompositionConfidence: 0.9,
    lowConfidenceDecisions: [],
    oversizedStoriesSplit: 0,
    epicMetrics: [],
    dependencyDetectionTimeMs: 100,
    graphGenerationTimeMs: 50,
    totalDependencies: 0,
    hardDependencies: 0,
    softDependencies: 0,
    validationTimeMs: 50,
    totalStoriesValidated: 1,
    avgValidationScore: 0.9,
    totalBlockers: 0,
    totalWarnings: 0,
    failedStoryIds: []
  };
}
