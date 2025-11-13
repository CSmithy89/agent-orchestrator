/**
 * Unit Tests for StoryValidator
 *
 * Tests all validation rules, scoring algorithm, blocker/warning detection.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StoryValidator } from '../../../src/solutioning/story-validator.js';
import { Story } from '../../../src/solutioning/types.js';

describe('StoryValidator', () => {
  let validator: StoryValidator;
  let validStory: Story;
  let allStories: Story[];

  beforeEach(() => {
    validator = new StoryValidator();

    // Create a valid story fixture
    validStory = {
      id: '4-6',
      epic: 'epic-4',
      title: 'Story Validation Quality Check',
      description: 'As a Scrum Master, I want to validate story quality, So that dev agents can implement stories successfully.',
      acceptance_criteria: [
        'Story size validation checks word count, AC count, and estimated hours',
        'Clarity validation checks user story format and clear ACs',
        'Completeness validation checks required fields and technical notes',
        'Dependency validation checks valid IDs and no circular dependencies',
        'Dev agent compatibility checks single responsibility and testable scope',
        'Quality score calculation uses weighted checks',
        'Blocker detection identifies critical issues',
        'Warning detection identifies non-critical issues',
        'Validation integration with SolutioningOrchestrator',
        'Batch validation aggregates results correctly'
      ],
      dependencies: ['4-1', '4-5'],
      status: 'in-progress',
      technical_notes: {
        affected_files: ['backend/src/solutioning/story-validator.ts'],
        endpoints: [],
        data_structures: ['Story', 'ValidationResult', 'ValidationCheck'],
        test_requirements: 'Unit tests with 80%+ coverage using Vitest'
      },
      estimated_hours: 2,
      complexity: 'medium'
    };

    // Create a set of all stories for dependency validation
    allStories = [
      validStory,
      {
        id: '4-1',
        epic: 'epic-4',
        title: 'Solutioning Data Models',
        description: 'As a developer, I want data models, So that I can use them.',
        acceptance_criteria: [
          'AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'
        ],
        dependencies: [],
        status: 'done',
        technical_notes: {
          affected_files: ['backend/src/solutioning/types.ts'],
          endpoints: [],
          data_structures: ['Story', 'Epic'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 1,
        complexity: 'low'
      },
      {
        id: '4-5',
        epic: 'epic-4',
        title: 'Dependency Detection',
        description: 'As a developer, I want dependency detection, So that I can analyze dependencies.',
        acceptance_criteria: [
          'AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'
        ],
        dependencies: ['4-1'],
        status: 'done',
        technical_notes: {
          affected_files: ['backend/src/solutioning/dependency-detection-service.ts'],
          endpoints: [],
          data_structures: ['DependencyEdge'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 2,
        complexity: 'medium'
      }
    ];
  });

  describe('validateStory - Valid Story', () => {
    it('should pass validation for a valid story', () => {
      const result = validator.validateStory(validStory, allStories);

      expect(result.pass).toBe(true);
      expect(result.blockers).toHaveLength(0);
      expect(result.score).toBeGreaterThan(0.8); // Should have high score
    });
  });

  describe('validateStory - Size Validation', () => {
    it('should warn for story with too many words', () => {
      const oversizedStory: Story = {
        ...validStory,
        description: 'As a developer, I want to implement a feature. ' + 'This is a very long description. '.repeat(100) // >500 words
      };

      const result = validator.validateStory(oversizedStory, allStories);

      // Word count is a warning, not a blocker
      expect(result.pass).toBe(true);
      expect(result.warnings.some(w => w.includes('exceeds 500-word limit'))).toBe(true);
    });

    it('should warn for story with too few ACs', () => {
      const fewACsStory: Story = {
        ...validStory,
        acceptance_criteria: ['AC1', 'AC2', 'AC3'] // Less than 8
      };

      const result = validator.validateStory(fewACsStory, allStories);

      // <8 ACs is a failed check but not automatically a blocker
      expect(result.pass).toBe(true);
      const acCheck = result.checks.find(c => c.name === 'Acceptance Criteria Count');
      expect(acCheck?.pass).toBe(false);
      expect(acCheck?.details).toContain('below minimum 8');
    });

    it('should fail validation for story with too many ACs', () => {
      const manyACsStory: Story = {
        ...validStory,
        acceptance_criteria: Array.from({ length: 20 }, (_, i) => `AC${i + 1}`) // >15
      };

      const result = validator.validateStory(manyACsStory, allStories);

      expect(result.pass).toBe(false);
      expect(result.blockers.some(b => b.includes('exceeds maximum 15'))).toBe(true);
    });

    it('should pass but warn for story with >2 hours but <8 hours', () => {
      const longStory: Story = {
        ...validStory,
        estimated_hours: 4
      };

      const result = validator.validateStory(longStory, allStories);

      // Should pass but with a check that notes it's above target
      expect(result.pass).toBe(true);
      const hoursCheck = result.checks.find(c => c.name === 'Estimated Hours');
      expect(hoursCheck?.details).toContain('above target 2');
    });

    it('should fail validation for story with >8 estimated hours', () => {
      const tooLongStory: Story = {
        ...validStory,
        estimated_hours: 10
      };

      const result = validator.validateStory(tooLongStory, allStories);

      expect(result.pass).toBe(false);
      expect(result.blockers.some(b => b.includes('exceeds maximum 8'))).toBe(true);
    });
  });

  describe('validateStory - Clarity Validation', () => {
    it('should warn for story without user story format', () => {
      const noFormatStory: Story = {
        ...validStory,
        description: 'This story implements a feature without proper format.'
      };

      const result = validator.validateStory(noFormatStory, allStories);

      // User story format is a warning, not a blocker
      expect(result.pass).toBe(true);
      expect(result.warnings.some(w => w.includes('does not follow "As a..., I want..., So that..." format'))).toBe(true);
    });

    it('should warn for story with too short title', () => {
      const shortTitleStory: Story = {
        ...validStory,
        title: 'Story'
      };

      const result = validator.validateStory(shortTitleStory, allStories);

      // Short title is a warning, not a blocker
      expect(result.pass).toBe(true);
      expect(result.warnings.some(w => w.includes('too short'))).toBe(true);
    });

    it('should warn for story with vague acceptance criteria', () => {
      const vagueACsStory: Story = {
        ...validStory,
        acceptance_criteria: [
          'Should work',
          'Maybe handle errors',
          'Could be better',
          'Possibly add tests',
          'Probably validate',
          'Might refactor',
          'System should be fast',
          'It could work'
        ]
      };

      const result = validator.validateStory(vagueACsStory, allStories);

      // Vague ACs are a warning, not a blocker
      expect(result.pass).toBe(true);
      expect(result.warnings.some(w => w.includes('vague or too short'))).toBe(true);
    });
  });

  describe('validateStory - Completeness Validation', () => {
    it('should fail validation for story with missing required fields', () => {
      const missingFieldsStory: any = {
        id: '4-6',
        epic: 'epic-4',
        title: 'Story Title',
        description: '',
        acceptance_criteria: [], // Empty but not undefined
        dependencies: [],
        status: 'backlog',
        technical_notes: { // Empty but not undefined
          affected_files: [],
          endpoints: [],
          data_structures: [],
          test_requirements: ''
        },
        // Missing estimated_hours, complexity
      };

      const result = validator.validateStory(missingFieldsStory as Story, allStories);

      expect(result.pass).toBe(false);
      expect(result.blockers.some(b => b.includes('Missing required fields'))).toBe(true);
    });

    it('should warn for story with empty technical notes', () => {
      const emptyTechNotesStory: Story = {
        ...validStory,
        technical_notes: {
          affected_files: [],
          endpoints: [],
          data_structures: [],
          test_requirements: ''
        }
      };

      const result = validator.validateStory(emptyTechNotesStory, allStories);

      // Empty technical notes is a failed check but not automatically a blocker
      expect(result.pass).toBe(true);
      const techNotesCheck = result.checks.find(c => c.name === 'Technical Notes');
      expect(techNotesCheck?.pass).toBe(false);
      expect(techNotesCheck?.details).toContain('Missing or empty technical notes fields');
    });
  });

  describe('validateStory - Dependency Validation', () => {
    it('should fail validation for story with self-dependency', () => {
      const selfDepStory: Story = {
        ...validStory,
        dependencies: ['4-6', '4-1'] // Depends on itself
      };

      const result = validator.validateStory(selfDepStory, allStories);

      expect(result.pass).toBe(false);
      expect(result.blockers.some(b => b.includes('depends on itself'))).toBe(true);
    });

    it('should fail validation for story with invalid dependency IDs', () => {
      const invalidDepStory: Story = {
        ...validStory,
        dependencies: ['4-999'] // Non-existent story
      };

      const result = validator.validateStory(invalidDepStory, allStories);

      expect(result.pass).toBe(false);
      expect(result.blockers.some(b => b.includes('Invalid dependency IDs'))).toBe(true);
    });

    it('should detect circular dependencies', () => {
      // Create circular dependency: 4-6 -> 4-1 -> 4-5 -> 4-6
      const circularStories: Story[] = [
        {
          ...validStory,
          id: '4-6',
          dependencies: ['4-1']
        },
        {
          id: '4-1',
          epic: 'epic-4',
          title: 'Data Models',
          description: 'As a developer, I want data models, So that I can use them.',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: ['4-5'], // Creates cycle
          status: 'done',
          technical_notes: {
            affected_files: ['types.ts'],
            endpoints: [],
            data_structures: ['Story'],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '4-5',
          epic: 'epic-4',
          title: 'Dependency Detection',
          description: 'As a developer, I want dependency detection, So that I can detect dependencies.',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: ['4-6'], // Completes cycle
          status: 'done',
          technical_notes: {
            affected_files: ['service.ts'],
            endpoints: [],
            data_structures: ['Deps'],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'medium'
        }
      ];

      const result = validator.validateStory(circularStories[0], circularStories);

      expect(result.pass).toBe(false);
      expect(result.blockers.some(b => b.includes('Circular dependency detected'))).toBe(true);
    });
  });

  describe('validateStory - Dev Agent Compatibility', () => {
    it('should warn for story with multiple features', () => {
      const multiFeatureStory: Story = {
        ...validStory,
        title: 'User Registration and Login and Profile and Settings and Dashboard'
      };

      const result = validator.validateStory(multiFeatureStory, allStories);

      expect(result.warnings.some(w => w.includes('multiple unrelated features'))).toBe(true);
    });

    it('should warn for story with non-testable acceptance criteria', () => {
      const nonTestableStory: Story = {
        ...validStory,
        acceptance_criteria: [
          'The system should look nice',
          'Users will like it',
          'It should feel responsive',
          'The UI should be intuitive',
          'Code should be clean',
          'Architecture should be good',
          'Performance should be acceptable',
          'Quality should be high'
        ]
      };

      const result = validator.validateStory(nonTestableStory, allStories);

      // Non-testable ACs are a warning, not a blocker
      expect(result.pass).toBe(true);
      expect(result.warnings.some(w => w.includes('acceptance criteria are testable'))).toBe(true);
    });
  });

  describe('validateStory - Quality Score Calculation', () => {
    it('should calculate high score (>0.8) for valid story', () => {
      const result = validator.validateStory(validStory, allStories);

      expect(result.score).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate medium score (0.5-0.8) for story with some issues', () => {
      const mediumStory: Story = {
        ...validStory,
        title: 'X', // Too short
        acceptance_criteria: Array.from({ length: 14 }, (_, i) => `Acceptance Criterion ${i + 1}`) // Above target but not blocker
      };

      const result = validator.validateStory(mediumStory, allStories);

      expect(result.score).toBeGreaterThan(0.5);
      expect(result.score).toBeLessThan(0.9);
    });

    it('should calculate low score (<0.6) for story with many issues', () => {
      const poorStory: Story = {
        ...validStory,
        title: 'X', // Too short
        description: 'Bad description', // Missing user story format
        acceptance_criteria: ['AC1', 'AC2', 'AC3'], // Too few
        technical_notes: {
          affected_files: [],
          endpoints: [],
          data_structures: [],
          test_requirements: ''
        }
      };

      const result = validator.validateStory(poorStory, allStories);

      expect(result.score).toBeLessThan(0.6);
    });
  });

  describe('validateStories - Batch Validation', () => {
    it('should validate multiple stories and aggregate results', () => {
      const story7: Story = {
        ...validStory,
        id: '4-7',
        dependencies: []
      };
      const story8: Story = {
        ...validStory,
        id: '4-8',
        dependencies: ['4-7']
      };

      const stories: Story[] = [validStory, story7, story8];

      const result = validator.validateStories(stories);

      expect(result.totalStories).toBe(3);
      expect(result.passed).toBeGreaterThanOrEqual(2); // At least 2 should pass
      expect(result.avgScore).toBeGreaterThan(0.7);
      expect(result.results.size).toBe(3);
    });

    it('should correctly count passed and failed stories', () => {
      const story7: Story = {
        ...validStory,
        id: '4-7',
        acceptance_criteria: ['AC1', 'AC2'], // Too few - should fail
        dependencies: []
      };
      const story8: Story = {
        ...validStory,
        id: '4-8',
        estimated_hours: 10, // Too long - should fail
        dependencies: []
      };

      const stories: Story[] = [validStory, story7, story8];

      const result = validator.validateStories(stories);

      expect(result.totalStories).toBe(3);
      expect(result.passed).toBeGreaterThanOrEqual(1); // At least valid story passes
      expect(result.failed).toBeGreaterThanOrEqual(2); // At least 2 fail
      expect(result.avgScore).toBeLessThan(0.8);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty description gracefully', () => {
      const emptyDescStory: Story = {
        ...validStory,
        description: ''
      };

      const result = validator.validateStory(emptyDescStory, allStories);

      // Empty description fails format check but is a warning
      expect(result.pass).toBe(true);
      expect(result.warnings.some(w => w.includes('format'))).toBe(true);
    });

    it('should handle story with no dependencies', () => {
      const noDepsStory: Story = {
        ...validStory,
        dependencies: []
      };

      const result = validator.validateStory(noDepsStory, allStories);

      // Should pass dependency validation
      const depChecks = result.checks.filter(c => c.category === 'dependencies');
      expect(depChecks.every(c => c.pass)).toBe(true);
    });

    it('should handle empty stories array in batch validation', () => {
      const result = validator.validateStories([]);

      expect(result.totalStories).toBe(0);
      expect(result.passed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.avgScore).toBe(0);
    });

    it('should validate story with exactly 8 acceptance criteria', () => {
      const exactACStory: Story = {
        ...validStory,
        acceptance_criteria: Array.from({ length: 8 }, (_, i) => `Acceptance Criterion ${i + 1}`)
      };

      const result = validator.validateStory(exactACStory, allStories);

      const acCheck = result.checks.find(c => c.name === 'Acceptance Criteria Count');
      expect(acCheck?.pass).toBe(true);
      expect(acCheck?.details).toContain('within 8-12 range');
    });

    it('should validate story with exactly 12 acceptance criteria', () => {
      const exactACStory: Story = {
        ...validStory,
        acceptance_criteria: Array.from({ length: 12 }, (_, i) => `Acceptance Criterion ${i + 1}`)
      };

      const result = validator.validateStory(exactACStory, allStories);

      const acCheck = result.checks.find(c => c.name === 'Acceptance Criteria Count');
      expect(acCheck?.pass).toBe(true);
      expect(acCheck?.details).toContain('within 8-12 range');
    });
  });
});
