/**
 * Unit tests for EpicFormationService
 *
 * Tests epic formation from PRD with mocked LLM responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EpicFormationService } from '../../../src/solutioning/epic-formation-service.js';
import { Epic } from '../../../src/solutioning/types.js';
import { LLMError, LLMErrorType } from '../../../src/types/llm.types.js';

// Mock dependencies
vi.mock('../../../src/llm/LLMFactory.js');
vi.mock('../../../src/solutioning/bob-llm-config.js');
vi.mock('../../../src/solutioning/bob-agent-loader.js');

describe('EpicFormationService', () => {
  let service: EpicFormationService;

  beforeEach(() => {
    service = new EpicFormationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('formEpicsFromPRD', () => {
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

    it('should form valid epics from PRD and architecture', async () => {
      // Mock LLM response
      const mockEpics: Epic[] = [
        {
          id: 'epic-1',
          title: 'User Authentication',
          goal: 'Enable secure user registration and login',
          value_proposition: 'Provides secure access control',
          stories: [],
          business_value: 'Foundation for all user-specific features',
          estimated_duration: '1-2 sprints'
        },
        {
          id: 'epic-2',
          title: 'Content Management',
          goal: 'Enable users to create and manage content',
          value_proposition: 'Core functionality for user engagement',
          stories: [],
          business_value: 'Primary user value proposition',
          estimated_duration: '2-3 sprints'
        },
        {
          id: 'epic-3',
          title: 'Analytics Dashboard',
          goal: 'Provide insights into user behavior',
          value_proposition: 'Data-driven decision making',
          stories: [],
          business_value: 'Business intelligence and optimization',
          estimated_duration: '1-2 sprints'
        }
      ];

      const mockLLMResponse = JSON.stringify({
        epics: mockEpics,
        confidence: 0.88,
        reasoning: 'Clear requirements with well-defined boundaries'
      });

      // Mock LLM client
      const mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
      const mockClient = { invoke: mockInvoke, provider: 'anthropic', model: 'claude-haiku-3-5' };

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

      const prd = '# PRD\n\n## Features\n- User authentication\n- Content management\n- Analytics';
      const architecture = '# Architecture\n\n## Components\n- Frontend\n- Backend\n- Database';

      const result = await service.formEpicsFromPRD(prd, architecture);

      expect(result.epics).toHaveLength(3);
      expect(result.epics[0].id).toBe('epic-1');
      expect(result.metrics.totalEpics).toBe(3);
      expect(result.metrics.confidence).toBe(0.88);
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should handle LLM response wrapped in markdown code blocks', async () => {
      const mockEpics: Epic[] = [
        {
          id: 'epic-1',
          title: 'User Management',
          goal: 'Manage users',
          value_proposition: 'User control',
          stories: [],
          business_value: 'User management',
          estimated_duration: '1 sprint'
        },
        {
          id: 'epic-2',
          title: 'Settings',
          goal: 'Configure system',
          value_proposition: 'Customization',
          stories: [],
          business_value: 'Configuration',
          estimated_duration: '1 sprint'
        },
        {
          id: 'epic-3',
          title: 'Reporting',
          goal: 'Generate reports',
          value_proposition: 'Insights',
          stories: [],
          business_value: 'Analytics',
          estimated_duration: '1 sprint'
        }
      ];

      const mockLLMResponse = '```json\n' + JSON.stringify({
        epics: mockEpics,
        confidence: 0.88,
        reasoning: 'Well-structured requirements'
      }) + '\n```';

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

      const result = await service.formEpicsFromPRD('# PRD', '# Architecture');

      expect(result.epics).toHaveLength(3);
      expect(result.metrics.confidence).toBe(0.92);
    });

    it('should throw error if epic count is below minimum (3)', async () => {
      const mockEpics: Epic[] = [
        {
          id: 'epic-1',
          title: 'Only Epic',
          goal: 'Do everything',
          value_proposition: 'All-in-one',
          stories: [],
          business_value: 'Everything',
          estimated_duration: '10 sprints'
        }
      ];

      const mockLLMResponse = JSON.stringify({
        epics: mockEpics,
        confidence: 0.60,
        reasoning: 'Insufficient requirements'
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

      await expect(service.formEpicsFromPRD('# PRD', '# Architecture'))
        .rejects.toThrow('Epic formation produced 1 epics (expected 3-8)');
    });

    it('should warn on low confidence but still return epics', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockEpics: Epic[] = [
        { id: 'epic-1', title: 'Epic 1', goal: 'Test goal for validation of epics', value_proposition: 'Test value proposition for testing', stories: [], business_value: 'Test business value here', estimated_duration: '1-2 sprints' },
        { id: 'epic-2', title: 'Epic 2', goal: 'Another test goal for validation', value_proposition: 'Another value proposition here', stories: [], business_value: 'Another business value', estimated_duration: '1 sprint' },
        { id: 'epic-3', title: 'Epic 3', goal: 'Third epic goal for testing', value_proposition: 'Third value proposition here', stories: [], business_value: 'Third business value', estimated_duration: '2 sprints' }
      ];

      const mockLLMResponse = JSON.stringify({
        epics: mockEpics,
        confidence: 0.60,
        reasoning: 'Ambiguous requirements'
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

      const result = await service.formEpicsFromPRD('# PRD', '# Architecture');

      expect(result.epics).toHaveLength(3);
      expect(result.metrics.lowConfidenceDecisions).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should retry on transient LLM errors', async () => {
      const mockEpics: Epic[] = [
        { id: 'epic-1', title: 'E1', goal: 'Test goal one for validation', value_proposition: 'Test value one here', stories: [], business_value: 'Test business value here', estimated_duration: '1 sprint' },
        { id: 'epic-2', title: 'E2', goal: 'Test goal two for validation', value_proposition: 'Test value two here', stories: [], business_value: 'Test biz value second', estimated_duration: '2 sprints' },
        { id: 'epic-3', title: 'E3', goal: 'Test goal three validated', value_proposition: 'Test value three here', stories: [], business_value: 'Test biz value third', estimated_duration: '1-2 sprints' }
      ];

      const mockLLMResponse = JSON.stringify({
        epics: mockEpics,
        confidence: 0.85,
        reasoning: 'Success after retry'
      });

      const mockInvoke = vi.fn()
        .mockRejectedValueOnce(new LLMError('Rate limited', LLMErrorType.TRANSIENT, 'anthropic', 'claude-haiku-3-5'))
        .mockResolvedValueOnce(mockLLMResponse);

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

      const result = await service.formEpicsFromPRD('# PRD', '# Architecture');

      expect(result.epics).toHaveLength(3);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    it('should not retry on auth errors', async () => {
      const mockInvoke = vi.fn()
        .mockRejectedValue(new LLMError('Invalid API key', LLMErrorType.AUTH, 'anthropic', 'claude-haiku-3-5'));

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

      await expect(service.formEpicsFromPRD('# PRD', '# Architecture'))
        .rejects.toThrow('Invalid API key');

      expect(mockInvoke).toHaveBeenCalledTimes(1); // No retry
    });

    it('should throw error on invalid JSON response', async () => {
      const mockLLMResponse = 'This is not JSON';

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

      await expect(service.formEpicsFromPRD('# PRD', '# Architecture'))
        .rejects.toThrow('Failed to parse epic formation response');
    });

    it('should throw error if epic fails schema validation', async () => {
      const invalidEpic = {
        id: 'invalid-epic', // Wrong pattern (should be epic-N)
        title: 'Test Epic Title',
        goal: 'Goal for testing validation',
        value_proposition: 'Value proposition here',
        stories: [],
        business_value: 'Business value here',
        estimated_duration: '1 sprint'
      };

      const mockLLMResponse = JSON.stringify({
        epics: [invalidEpic, invalidEpic, invalidEpic],
        confidence: 0.85,
        reasoning: 'Invalid epic format'
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

      await expect(service.formEpicsFromPRD('# PRD', '# Architecture'))
        .rejects.toThrow('failed schema validation');
    });
  });
});
