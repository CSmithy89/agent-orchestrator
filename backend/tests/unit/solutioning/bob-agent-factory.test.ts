/**
 * Unit tests for Bob Agent Factory and Action Methods
 *
 * Tests agent action method stubs and initialization.
 * Verifies AC #6, #7, #12: Agent factory and infrastructure-only scope
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BobAgentActions, initializeBobAgent } from '../../../src/solutioning/bob-agent-factory.js';
import { AgentContext } from '../../../src/solutioning/context-builder.js';
import { Epic, Story } from '../../../src/solutioning/types.js';
import * as bobAgentLoader from '../../../src/solutioning/bob-agent-loader.js';
import * as bobLLMConfig from '../../../src/solutioning/bob-llm-config.js';

// Mock modules
vi.mock('../../../src/solutioning/bob-agent-loader.js');
vi.mock('../../../src/solutioning/bob-llm-config.js');

// Mock persona
const MOCK_BOB_PERSONA = {
  role: 'Scrum Master',
  systemPrompt: 'You are Bob...',
  capabilities: ['Epic Formation'],
  decisionApproach: 'Approach',
  storyPatterns: 'Patterns',
  rawContent: '# Bob'
};

// Mock LLM config
const MOCK_LLM_CONFIG = {
  model: 'glm-4-plus',
  provider: 'zhipu'
};

describe('Bob Agent Factory and Actions', () => {
  let bobActions: BobAgentActions;
  let mockContext: AgentContext;

  beforeEach(() => {
    bobActions = new BobAgentActions();
    vi.clearAllMocks();

    // Mock context
    mockContext = {
      prd: '## Functional Requirements\nUser authentication',
      architecture: '## Overview\nMicrokernel architecture',
      storyPatterns: 'BMAD patterns',
      constraints: {
        storyMaxWords: 500,
        acceptanceCriteriaMin: 8,
        acceptanceCriteriaMax: 12,
        maxEstimatedHours: 2,
        maxContextTokens: 200000,
        confidenceThreshold: 0.75
      }
    };

    // Mock loadBobPersona
    vi.mocked(bobAgentLoader.loadBobPersona).mockResolvedValue(MOCK_BOB_PERSONA);

    // Mock loadBobLLMConfig
    vi.mocked(bobLLMConfig.loadBobLLMConfig).mockResolvedValue(MOCK_LLM_CONFIG);
  });

  describe('BobAgentActions class', () => {
    it('should create instance successfully', () => {
      expect(bobActions).toBeInstanceOf(BobAgentActions);
    });

    it('should have formEpics method', () => {
      expect(bobActions.formEpics).toBeDefined();
      expect(typeof bobActions.formEpics).toBe('function');
    });

    it('should have decomposeIntoStories method', () => {
      expect(bobActions.decomposeIntoStories).toBeDefined();
      expect(typeof bobActions.decomposeIntoStories).toBe('function');
    });

    it('should have detectDependencies method', () => {
      expect(bobActions.detectDependencies).toBeDefined();
      expect(typeof bobActions.detectDependencies).toBe('function');
    });
  });

  describe('formEpics()', () => {
    it('should throw "Not yet implemented" error (infrastructure only)', async () => {
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow(/not yet implemented/i);
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow('Story 4.4');
    });

    it('should reference Epic Formation & Story Decomposition story', async () => {
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow(
        'Epic Formation & Story Decomposition'
      );
    });

    it('should explain this is infrastructure-only Story 4.2', async () => {
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow('infrastructure-only');
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow('Story 4.2');
    });

    it('should have correct return type signature (Promise<Epic[]>)', async () => {
      // Type check - method signature should accept AgentContext and return Promise<Epic[]>
      const methodSignature: (context: AgentContext) => Promise<Epic[]> = bobActions.formEpics.bind(bobActions);
      expect(methodSignature).toBeDefined();
    });

    it('should accept AgentContext parameter', async () => {
      // Method should not throw parameter type errors
      const promise = bobActions.formEpics(mockContext);
      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).rejects.toThrow();
    });
  });

  describe('decomposeIntoStories()', () => {
    let mockEpic: Epic;

    beforeEach(() => {
      mockEpic = {
        id: 'epic-1',
        title: 'User Authentication',
        goal: 'Enable secure user access',
        value_proposition: 'Security foundation',
        stories: [],
        business_value: 'Core feature',
        estimated_duration: '1-2 sprints'
      };
    });

    it('should throw "Not yet implemented" error (infrastructure only)', async () => {
      await expect(bobActions.decomposeIntoStories(mockContext, mockEpic)).rejects.toThrow(
        /not yet implemented/i
      );
      await expect(bobActions.decomposeIntoStories(mockContext, mockEpic)).rejects.toThrow(
        'Story 4.4'
      );
    });

    it('should reference Epic Formation & Story Decomposition story', async () => {
      await expect(bobActions.decomposeIntoStories(mockContext, mockEpic)).rejects.toThrow(
        'Epic Formation & Story Decomposition'
      );
    });

    it('should explain this is infrastructure-only Story 4.2', async () => {
      await expect(bobActions.decomposeIntoStories(mockContext, mockEpic)).rejects.toThrow(
        'infrastructure-only'
      );
      await expect(bobActions.decomposeIntoStories(mockContext, mockEpic)).rejects.toThrow(
        'Story 4.2'
      );
    });

    it('should have correct return type signature (Promise<Story[]>)', async () => {
      // Type check - method signature should accept AgentContext, Epic and return Promise<Story[]>
      const methodSignature: (context: AgentContext, epic: Epic) => Promise<Story[]> =
        bobActions.decomposeIntoStories.bind(bobActions);
      expect(methodSignature).toBeDefined();
    });

    it('should accept AgentContext and Epic parameters', async () => {
      const promise = bobActions.decomposeIntoStories(mockContext, mockEpic);
      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).rejects.toThrow();
    });
  });

  describe('detectDependencies()', () => {
    let mockStories: Story[];

    beforeEach(() => {
      mockStories = [
        {
          id: '4-1',
          epic: 'epic-4',
          title: 'Data Models',
          description: 'As a developer, I want data models...',
          acceptance_criteria: ['Define types'],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['types.ts'],
            endpoints: [],
            data_structures: ['Epic', 'Story'],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'low'
        },
        {
          id: '4-2',
          epic: 'epic-4',
          title: 'Bob Agent',
          description: 'As a developer, I want Bob agent...',
          acceptance_criteria: ['Load persona'],
          dependencies: ['4-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['bob-agent-loader.ts'],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'low'
        }
      ];
    });

    it('should throw "Not yet implemented" error (infrastructure only)', async () => {
      await expect(bobActions.detectDependencies(mockContext, mockStories)).rejects.toThrow(
        /not yet implemented/i
      );
      await expect(bobActions.detectDependencies(mockContext, mockStories)).rejects.toThrow(
        'Story 4.5'
      );
    });

    it('should reference Dependency Detection & Graph Generation story', async () => {
      await expect(bobActions.detectDependencies(mockContext, mockStories)).rejects.toThrow(
        'Dependency Detection & Graph Generation'
      );
    });

    it('should explain this is infrastructure-only Story 4.2', async () => {
      await expect(bobActions.detectDependencies(mockContext, mockStories)).rejects.toThrow(
        'infrastructure-only'
      );
      await expect(bobActions.detectDependencies(mockContext, mockStories)).rejects.toThrow(
        'Story 4.2'
      );
    });

    it('should have correct return type signature (Promise<DependencyEdge[]>)', async () => {
      // Type check - method signature should accept AgentContext, Story[] and return Promise<DependencyEdge[]>
      const methodSignature: (context: AgentContext, stories: Story[]) => Promise<any[]> =
        bobActions.detectDependencies.bind(bobActions);
      expect(methodSignature).toBeDefined();
    });

    it('should accept AgentContext and Story[] parameters', async () => {
      const promise = bobActions.detectDependencies(mockContext, mockStories);
      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).rejects.toThrow();
    });
  });

  describe('initializeBobAgent()', () => {
    it('should load Bob persona and LLM config successfully', async () => {
      const status = await initializeBobAgent();

      expect(status.personaLoaded).toBe(true);
      expect(status.llmConfigLoaded).toBe(true);
      expect(status.model).toBe('glm-4-plus');
      expect(status.provider).toBe('zhipu');
    });

    it('should call loadBobPersona()', async () => {
      await initializeBobAgent();

      expect(bobAgentLoader.loadBobPersona).toHaveBeenCalledTimes(1);
    });

    it('should call loadBobLLMConfig()', async () => {
      await initializeBobAgent();

      expect(bobLLMConfig.loadBobLLMConfig).toHaveBeenCalledTimes(1);
    });

    it('should return correct model and provider from config', async () => {
      const customConfig = {
        model: 'claude-sonnet-4-5',
        provider: 'anthropic'
      };
      vi.mocked(bobLLMConfig.loadBobLLMConfig).mockResolvedValue(customConfig);

      const status = await initializeBobAgent();

      expect(status.model).toBe('claude-sonnet-4-5');
      expect(status.provider).toBe('anthropic');
    });

    it('should throw error when persona loading fails', async () => {
      vi.mocked(bobAgentLoader.loadBobPersona).mockRejectedValue(
        new Error('Persona file not found')
      );

      await expect(initializeBobAgent()).rejects.toThrow('Persona file not found');
    });

    it('should throw error when LLM config loading fails', async () => {
      vi.mocked(bobLLMConfig.loadBobLLMConfig).mockRejectedValue(
        new Error('Config parse error')
      );

      await expect(initializeBobAgent()).rejects.toThrow('Config parse error');
    });
  });

  describe('Infrastructure-Only Verification (AC #12)', () => {
    it('should NOT invoke LLM in formEpics (throws error instead)', async () => {
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow();
      // No LLM client should be created or invoked
    });

    it('should NOT invoke LLM in decomposeIntoStories (throws error instead)', async () => {
      const mockEpic: Epic = {
        id: 'epic-1',
        title: 'Test',
        goal: 'Test',
        value_proposition: 'Test',
        stories: [],
        business_value: 'Test',
        estimated_duration: '1 sprint'
      };

      await expect(bobActions.decomposeIntoStories(mockContext, mockEpic)).rejects.toThrow();
      // No LLM client should be created or invoked
    });

    it('should NOT invoke LLM in detectDependencies (throws error instead)', async () => {
      await expect(bobActions.detectDependencies(mockContext, [])).rejects.toThrow();
      // No LLM client should be created or invoked
    });

    it('should NOT generate actual epics/stories in this story', async () => {
      // All methods throw errors - no actual content generation
      await expect(bobActions.formEpics(mockContext)).rejects.toThrow();
      await expect(bobActions.decomposeIntoStories(mockContext, {} as Epic)).rejects.toThrow();
      await expect(bobActions.detectDependencies(mockContext, [])).rejects.toThrow();
    });

    it('initializeBobAgent should only load config, not invoke LLM', async () => {
      const status = await initializeBobAgent();

      // Should just load config and persona
      expect(status.personaLoaded).toBe(true);
      expect(status.llmConfigLoaded).toBe(true);

      // Should NOT have any LLM invocation side effects
      expect(bobAgentLoader.loadBobPersona).toHaveBeenCalledTimes(1);
      expect(bobLLMConfig.loadBobLLMConfig).toHaveBeenCalledTimes(1);
    });
  });
});
