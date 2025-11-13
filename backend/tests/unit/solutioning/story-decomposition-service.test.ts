/**
 * Unit tests for StoryDecompositionService
 *
 * Tests story decomposition from epic with mocked LLM responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoryDecompositionService } from '../../../src/solutioning/story-decomposition-service.js';
import { Epic, Story } from '../../../src/solutioning/types.js';

// Mock dependencies
vi.mock('../../../src/llm/LLMFactory.js');
vi.mock('../../../src/solutioning/bob-llm-config.js');
vi.mock('../../../src/solutioning/bob-agent-loader.js');

describe('StoryDecompositionService', () => {
  let service: StoryDecompositionService;

  const mockEpic: Epic = {
    id: 'epic-1',
    title: 'User Authentication',
    goal: 'Enable secure user registration and login',
    value_proposition: 'Provides secure access control',
    stories: [],
    business_value: 'Foundation for all user-specific features',
    estimated_duration: '1-2 sprints'
  };

  beforeEach(() => {
    service = new StoryDecompositionService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('decomposeEpicIntoStories', () => {
    beforeEach(async () => {
      // Mock Bob persona loader
      const mockBobPersona = await import('../../../src/solutioning/bob-agent-loader.js');
      vi.spyOn(mockBobPersona, 'loadBobPersona').mockResolvedValue({
        role: 'Scrum Master',
        name: 'Bob',
        expertise: ['Epic Formation', 'Story Decomposition'],
        decisionApproach: 'BMAD patterns',
        storyPatterns: 'BMAD story patterns'
      } as any);
    });

    it('should decompose epic into valid stories', async () => {
      const mockStories: Story[] = [
        {
          id: '1-1',
          epic: 'epic-1',
          title: 'User Registration',
          description: 'As a new user, I want to register an account, So that I can access the platform',
          acceptance_criteria: [
            'AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'
          ],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['auth.ts'],
            endpoints: ['/api/register'],
            data_structures: ['User'],
            test_requirements: 'Unit tests with 80%+ coverage'
          },
          estimated_hours: 2,
          complexity: 'medium'
        },
        {
          id: '1-2',
          epic: 'epic-1',
          title: 'User Login',
          description: 'As a user, I want to login, So that I can access my account',
          acceptance_criteria: [
            'AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'
          ],
          dependencies: ['1-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['auth.ts'],
            endpoints: ['/api/login'],
            data_structures: ['Session'],
            test_requirements: 'Unit tests with 80%+ coverage'
          },
          estimated_hours: 1.5,
          complexity: 'low'
        },
        {
          id: '1-3',
          epic: 'epic-1',
          title: 'Password Reset',
          description: 'As a user, I want to reset my password, So that I can recover my account',
          acceptance_criteria: [
            'AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'
          ],
          dependencies: ['1-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['auth.ts'],
            endpoints: ['/api/reset-password'],
            data_structures: ['PasswordResetToken'],
            test_requirements: 'Unit tests with 80%+ coverage'
          },
          estimated_hours: 2,
          complexity: 'medium'
        }
      ];

      const mockLLMResponse = JSON.stringify({
        stories: mockStories,
        confidence: 0.90,
        reasoning: 'Clear epic scope with well-defined stories'
      });

      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      const mockClient = { invoke: mockInvoke };

      const mockLLMFactory = await import('../../../src/llm/LLMFactory.js');
      vi.mocked(mockLLMFactory.LLMFactory).mockReturnValue({
        createClient: vi.fn().mockResolvedValue(mockClient),
        registerProvider: vi.fn(),
        validateModel: vi.fn().mockReturnValue(true),
        getAvailableProviders: vi.fn().mockReturnValue(['anthropic']),
        getSupportedModels: vi.fn().mockReturnValue(['claude-haiku-3-5']),
        getLogger: vi.fn()
      } as any);

      const mockBobConfig = await import('../../../src/solutioning/bob-llm-config.js');
      vi.spyOn(mockBobConfig, 'loadBobLLMConfig').mockResolvedValue({
        model: 'claude-haiku-3-5',
        provider: 'anthropic'
      });

      const result = await service.decomposeEpicIntoStories(mockEpic, '# PRD', '# Architecture');

      expect(result.stories).toHaveLength(3);
      expect(result.stories[0].id).toBe('1-1');
      expect(result.metrics.totalStories).toBe(3);
      expect(result.metrics.confidence).toBe(0.90);
    });

    it('should throw error if story has wrong epic ID', async () => {
      const mockStories: Story[] = [
        {
          id: '1-1',
          epic: 'epic-2', // Wrong epic ID
          title: 'User Story Title',
          description: 'As a user, I want to perform an action, So that I can achieve a goal',
          acceptance_criteria: [
            'User can perform action successfully',
            'System validates input correctly',
            'Error handling works as expected',
            'Response time is under 200ms',
            'Data is persisted correctly',
            'User receives confirmation message',
            'Audit log is created',
            'Unit tests cover all scenarios'
          ],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['file.ts'],
            endpoints: ['/api/endpoint'],
            data_structures: ['DataModel'],
            test_requirements: 'Unit tests with 80%+ coverage'
          },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '1-2',
          epic: 'epic-2', // Wrong epic ID
          title: 'Second Story Title',
          description: 'As a user, I want to perform another action, So that I can achieve another goal',
          acceptance_criteria: [
            'User can perform action successfully',
            'System validates input correctly',
            'Error handling works as expected',
            'Response time is under 200ms',
            'Data is persisted correctly',
            'User receives confirmation message',
            'Audit log is created',
            'Unit tests cover all scenarios'
          ],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['file2.ts'],
            endpoints: ['/api/endpoint2'],
            data_structures: ['DataModel2'],
            test_requirements: 'Unit tests with 80%+ coverage'
          },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '1-3',
          epic: 'epic-2', // Wrong epic ID
          title: 'Third Story Title',
          description: 'As a user, I want to do something else, So that I can accomplish my task',
          acceptance_criteria: [
            'User can perform action successfully',
            'System validates input correctly',
            'Error handling works as expected',
            'Response time is under 200ms',
            'Data is persisted correctly',
            'User receives confirmation message',
            'Audit log is created',
            'Unit tests cover all scenarios'
          ],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['file3.ts'],
            endpoints: ['/api/endpoint3'],
            data_structures: ['DataModel3'],
            test_requirements: 'Unit tests with 80%+ coverage'
          },
          estimated_hours: 1,
          complexity: 'low'
        }
      ];

      const mockLLMResponse = JSON.stringify({
        stories: mockStories,
        confidence: 0.85,
        reasoning: 'Epic mismatch'
      });

      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      const mockClient = { invoke: mockInvoke };

      const mockLLMFactory = await import('../../../src/llm/LLMFactory.js');
      vi.mocked(mockLLMFactory.LLMFactory).mockReturnValue({
        createClient: vi.fn().mockResolvedValue(mockClient),
        registerProvider: vi.fn(),
        validateModel: vi.fn().mockReturnValue(true),
        getAvailableProviders: vi.fn().mockReturnValue(['anthropic']),
        getSupportedModels: vi.fn().mockReturnValue(['claude-haiku-3-5']),
        getLogger: vi.fn()
      } as any);

      const mockBobConfig = await import('../../../src/solutioning/bob-llm-config.js');
      vi.spyOn(mockBobConfig, 'loadBobLLMConfig').mockResolvedValue({
        model: 'claude-haiku-3-5',
        provider: 'anthropic'
      });

      await expect(service.decomposeEpicIntoStories(mockEpic, '# PRD', '# Architecture'))
        .rejects.toThrow('mismatched epic ID');
    });

    it('should throw error if story has too few acceptance criteria', async () => {
      const mockStories: Story[] = [
        {
          id: '1-1',
          epic: 'epic-1',
          title: 'Story',
          description: 'As a..., I want..., So that...',
          acceptance_criteria: ['AC1', 'AC2'], // Only 2 ACs (need 8-12)
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: [],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Tests'
          },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '1-2',
          epic: 'epic-1',
          title: 'Story 2',
          description: 'As a..., I want..., So that...',
          acceptance_criteria: ['AC1', 'AC2'], // Only 2 ACs (need 8-12)
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: [],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Tests'
          },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '1-3',
          epic: 'epic-1',
          title: 'Story 3',
          description: 'As a..., I want..., So that...',
          acceptance_criteria: ['AC1', 'AC2'], // Only 2 ACs (need 8-12)
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: [],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Tests'
          },
          estimated_hours: 1,
          complexity: 'low'
        }
      ];

      const mockLLMResponse = JSON.stringify({
        stories: mockStories,
        confidence: 0.85,
        reasoning: 'Insufficient ACs'
      });

      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      const mockClient = { invoke: mockInvoke };

      const mockLLMFactory = await import('../../../src/llm/LLMFactory.js');
      vi.mocked(mockLLMFactory.LLMFactory).mockReturnValue({
        createClient: vi.fn().mockResolvedValue(mockClient),
        registerProvider: vi.fn(),
        validateModel: vi.fn().mockReturnValue(true),
        getAvailableProviders: vi.fn().mockReturnValue(['anthropic']),
        getSupportedModels: vi.fn().mockReturnValue(['claude-haiku-3-5']),
        getLogger: vi.fn()
      } as any);

      const mockBobConfig = await import('../../../src/solutioning/bob-llm-config.js');
      vi.spyOn(mockBobConfig, 'loadBobLLMConfig').mockResolvedValue({
        model: 'claude-haiku-3-5',
        provider: 'anthropic'
      });

      await expect(service.decomposeEpicIntoStories(mockEpic, '# PRD', '# Architecture'))
        .rejects.toThrow('acceptance criteria');
    });

    it('should warn on low confidence', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockStories: Story[] = [
        {
          id: '1-1',
          epic: 'epic-1',
          title: 'Story 1',
          description: 'As a..., I want..., So that...',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: [],
          status: 'backlog',
          technical_notes: { affected_files: [], endpoints: [], data_structures: [], test_requirements: 'Tests' },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '1-2',
          epic: 'epic-1',
          title: 'Story 2',
          description: 'As a..., I want..., So that...',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: [],
          status: 'backlog',
          technical_notes: { affected_files: [], endpoints: [], data_structures: [], test_requirements: 'Tests' },
          estimated_hours: 1,
          complexity: 'low'
        },
        {
          id: '1-3',
          epic: 'epic-1',
          title: 'Story 3',
          description: 'As a..., I want..., So that...',
          acceptance_criteria: ['AC1', 'AC2', 'AC3', 'AC4', 'AC5', 'AC6', 'AC7', 'AC8'],
          dependencies: [],
          status: 'backlog',
          technical_notes: { affected_files: [], endpoints: [], data_structures: [], test_requirements: 'Tests' },
          estimated_hours: 1,
          complexity: 'low'
        }
      ];

      const mockLLMResponse = JSON.stringify({
        stories: mockStories,
        confidence: 0.65,
        reasoning: 'Ambiguous epic scope'
      });

      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      const mockClient = { invoke: mockInvoke };

      const mockLLMFactory = await import('../../../src/llm/LLMFactory.js');
      vi.mocked(mockLLMFactory.LLMFactory).mockReturnValue({
        createClient: vi.fn().mockResolvedValue(mockClient),
        registerProvider: vi.fn(),
        validateModel: vi.fn().mockReturnValue(true),
        getAvailableProviders: vi.fn().mockReturnValue(['anthropic']),
        getSupportedModels: vi.fn().mockReturnValue(['claude-haiku-3-5']),
        getLogger: vi.fn()
      } as any);

      const mockBobConfig = await import('../../../src/solutioning/bob-llm-config.js');
      vi.spyOn(mockBobConfig, 'loadBobLLMConfig').mockResolvedValue({
        model: 'claude-haiku-3-5',
        provider: 'anthropic'
      });

      const result = await service.decomposeEpicIntoStories(mockEpic, '# PRD', '# Architecture');

      expect(result.stories).toHaveLength(3);
      expect(result.metrics.lowConfidenceDecisions).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
