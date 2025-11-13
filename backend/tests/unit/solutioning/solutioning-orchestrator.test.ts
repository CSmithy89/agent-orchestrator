/**
 * Unit tests for SolutioningOrchestrator
 *
 * Tests orchestration of epic formation and story decomposition
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SolutioningOrchestrator } from '../../../src/solutioning/solutioning-orchestrator.js';
import * as fs from 'fs/promises';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../../src/solutioning/epic-formation-service.js');
vi.mock('../../../src/solutioning/story-decomposition-service.js');

describe('SolutioningOrchestrator', () => {
  let orchestrator: SolutioningOrchestrator;

  beforeEach(() => {
    orchestrator = new SolutioningOrchestrator();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeSolutioning', () => {
    it('should execute complete solutioning workflow', async () => {
      // Mock file system
      (fs.readFile as any).mockImplementation(async (path: any) => {
        if (path.includes('PRD')) {
          return '# PRD\n\n## Features\n- Auth\n- Content';
        }
        return '# Architecture\n\n## Components\n- Frontend\n- Backend';
      });

      // Mock EpicFormationService
      const { EpicFormationService } = await import('../../../src/solutioning/epic-formation-service.js');
      const mockEpics = [
        {
          id: 'epic-1',
          title: 'User Authentication',
          goal: 'Enable secure user access',
          value_proposition: 'Security',
          stories: [],
          business_value: 'Foundation',
          estimated_duration: '1-2 sprints'
        },
        {
          id: 'epic-2',
          title: 'Content Management',
          goal: 'Manage content',
          value_proposition: 'Core value',
          stories: [],
          business_value: 'Primary',
          estimated_duration: '2-3 sprints'
        },
        {
          id: 'epic-3',
          title: 'Analytics',
          goal: 'Track metrics',
          value_proposition: 'Insights',
          stories: [],
          business_value: 'Intelligence',
          estimated_duration: '1 sprint'
        }
      ];

      vi.mocked(EpicFormationService).mockImplementation(() => ({
        formEpicsFromPRD: vi.fn().mockResolvedValue({
          epics: mockEpics,
          metrics: {
            totalEpics: 3,
            executionTimeMs: 5000,
            llmTokensUsed: 2000,
            confidence: 0.88,
            lowConfidenceDecisions: []
          }
        })
      } as any));

      // Mock StoryDecompositionService
      const { StoryDecompositionService } = await import('../../../src/solutioning/story-decomposition-service.js');
      const mockStories = [
        {
          id: '1-1',
          epic: 'epic-1',
          title: 'User Registration',
          description: 'As a user...',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: [],
          status: 'backlog' as const,
          technical_notes: { affected_files: [], endpoints: [], data_structures: [], test_requirements: 'Tests' },
          estimated_hours: 2,
          complexity: 'medium' as const
        },
        {
          id: '1-2',
          epic: 'epic-1',
          title: 'User Login',
          description: 'As a user...',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: ['1-1'],
          status: 'backlog' as const,
          technical_notes: { affected_files: [], endpoints: [], data_structures: [], test_requirements: 'Tests' },
          estimated_hours: 1.5,
          complexity: 'low' as const
        }
      ];

      vi.mocked(StoryDecompositionService).mockImplementation(() => ({
        decomposeEpicIntoStories: vi.fn().mockResolvedValue({
          stories: mockStories,
          metrics: {
            epicId: 'epic-1',
            totalStories: 2,
            executionTimeMs: 3000,
            llmTokensUsed: 1500,
            confidence: 0.92,
            lowConfidenceDecisions: [],
            oversizedStoriesSplit: 0
          }
        })
      } as any));

      const result = await orchestrator.executeSolutioning(
        '/path/to/PRD.md',
        '/path/to/architecture.md'
      );

      expect(result.epics).toHaveLength(3);
      expect(result.stories.length).toBeGreaterThan(0);
      expect(result.metrics.totalEpics).toBe(3);
      expect(result.metrics.epicFormationConfidence).toBe(0.88);
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('should throw error if PRD file cannot be read', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      await expect(
        orchestrator.executeSolutioning('/invalid/path.md', '/arch.md')
      ).rejects.toThrow('Failed to read file');
    });

    it('should aggregate low-confidence decisions from all epics', async () => {
      (fs.readFile as any).mockImplementation(async (path: any) => {
        if (path.includes('PRD')) return '# PRD';
        return '# Architecture';
      });

      const { EpicFormationService } = await import('../../../src/solutioning/epic-formation-service.js');
      const mockEpics = [
        { id: 'epic-1', title: 'Epic One', goal: 'Goal for epic one', value_proposition: 'Value proposition one', stories: [], business_value: 'Business value one', estimated_duration: '1 sprint' },
        { id: 'epic-2', title: 'Epic Two', goal: 'Goal for epic two', value_proposition: 'Value proposition two', stories: [], business_value: 'Business value two', estimated_duration: '2 sprints' },
        { id: 'epic-3', title: 'Epic Three', goal: 'Goal for epic three', value_proposition: 'Value proposition three', stories: [], business_value: 'Business value three', estimated_duration: '1-2 sprints' }
      ];

      vi.spyOn(EpicFormationService.prototype, 'formEpicsFromPRD').mockResolvedValue({
        epics: mockEpics,
        metrics: {
          totalEpics: 3,
          executionTimeMs: 1000,
          llmTokensUsed: 500,
          confidence: 0.70,
          lowConfidenceDecisions: ['Low epic confidence']
        }
      });

      const { StoryDecompositionService } = await import('../../../src/solutioning/story-decomposition-service.js');
      const mockStory = {
        id: '1-1',
        epic: 'epic-1',
        title: 'Story Title',
        description: 'As a user, I want to do something, So that I can achieve a goal',
        acceptance_criteria: [
          'First acceptance criteria',
          'Second acceptance criteria',
          'Third acceptance criteria',
          'Fourth acceptance criteria',
          'Fifth acceptance criteria',
          'Sixth acceptance criteria',
          'Seventh acceptance criteria',
          'Eighth acceptance criteria'
        ],
        dependencies: [],
        status: 'backlog' as const,
        technical_notes: { affected_files: ['file.ts'], endpoints: ['/api/endpoint'], data_structures: ['Model'], test_requirements: 'Unit tests with 80%+ coverage' },
        estimated_hours: 1,
        complexity: 'low' as const
      };

      vi.spyOn(StoryDecompositionService.prototype, 'decomposeEpicIntoStories').mockResolvedValue({
          stories: [mockStory, mockStory, mockStory],
          metrics: {
            epicId: 'epic-1',
            totalStories: 3,
            executionTimeMs: 1000,
            llmTokensUsed: 500,
            confidence: 0.68,
            lowConfidenceDecisions: ['Low story confidence'],
            oversizedStoriesSplit: 0
          }
        });

      const result = await orchestrator.executeSolutioning('/prd.md', '/arch.md');

      expect(result.metrics.lowConfidenceDecisions.length).toBeGreaterThan(0);
    });
  });
});
