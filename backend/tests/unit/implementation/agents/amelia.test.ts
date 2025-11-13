/**
 * Unit Tests for Amelia Agent (Developer)
 *
 * Tests Amelia's core capabilities:
 * - Story implementation
 * - Test generation
 * - Self-review
 *
 * Mocks LLM responses for deterministic testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AmeliaAgentInfrastructure } from '../../../../src/implementation/agents/amelia.js';
import { AgentPool } from '../../../../src/core/AgentPool.js';
import { ProjectConfig } from '../../../../src/config/ProjectConfig.js';
import { LLMFactory } from '../../../../src/llm/LLMFactory.js';
import type { StoryContext, CodeImplementation } from '../../../../src/implementation/types.js';

describe('AmeliaAgentInfrastructure', () => {
  let amelia: AmeliaAgentInfrastructure;
  let mockAgentPool: AgentPool;
  let mockProjectConfig: ProjectConfig;

  beforeEach(() => {
    // Create mock LLMFactory
    const mockLLMFactory = {
      createClient: vi.fn().mockResolvedValue({
        provider: 'openai',
        model: 'gpt-4o',
        invoke: vi.fn(),
        stream: vi.fn(),
        estimateCost: vi.fn().mockReturnValue(0.01),
        getTokenUsage: vi.fn().mockReturnValue({
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150
        })
      }),
      registerProvider: vi.fn(),
      validateModel: vi.fn().mockReturnValue(true),
      getAvailableProviders: vi.fn().mockReturnValue(['openai']),
      getSupportedModels: vi.fn().mockReturnValue(['gpt-4o']),
      getLogger: vi.fn()
    } as unknown as LLMFactory;

    // Create mock ProjectConfig
    mockProjectConfig = {
      getAgentConfig: vi.fn().mockReturnValue({
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.4,
        reasoning: 'GPT-4o for code generation'
      })
    } as unknown as ProjectConfig;

    // Create AgentPool with mocks
    mockAgentPool = new AgentPool(
      mockLLMFactory,
      mockProjectConfig
    );

    // Spy on AgentPool methods
    vi.spyOn(mockAgentPool, 'createAgent');
    vi.spyOn(mockAgentPool, 'invokeAgent');
    vi.spyOn(mockAgentPool, 'destroyAgent');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create Amelia agent infrastructure', async () => {
      amelia = await AmeliaAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );

      expect(amelia).toBeInstanceOf(AmeliaAgentInfrastructure);
    });
  });

  describe('implementStory', () => {
    beforeEach(async () => {
      amelia = await AmeliaAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should implement story and return code implementation', async () => {
      // Mock context
      const context: StoryContext = {
        story: {
          id: '5-1-test-story',
          title: 'Test Story',
          description: 'As a developer, I want to test Amelia',
          acceptanceCriteria: ['AC1: Agent responds', 'AC2: Code is generated'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: 'PRD context here',
        architectureContext: 'Architecture context here',
        onboardingDocs: 'Coding standards here',
        existingCode: [],
        totalTokens: 5000
      };

      // Mock LLM response with code implementation
      const mockResponse = JSON.stringify({
        files: [
          {
            path: 'backend/src/test/example.ts',
            content: 'export function hello() { return "world"; }',
            operation: 'create'
          }
        ],
        commitMessage: 'Implement test story',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [
          {
            criterion: 'AC1: Agent responds',
            implemented: true,
            evidence: 'backend/src/test/example.ts:hello'
          }
        ]
      });

      // Mock invokeAgent to return our response
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);

      // Mock createAgent to return a simple agent
      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'amelia',
        persona: 'Developer agent',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });

      // Mock destroyAgent
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      // Execute
      const result = await amelia.implementStory(context);

      // Assertions
      expect(mockAgentPool.createAgent).toHaveBeenCalledWith(
        'amelia',
        expect.objectContaining({
          taskDescription: 'Implement story 5-1-test-story: Test Story'
        })
      );
      expect(mockAgentPool.invokeAgent).toHaveBeenCalledWith(
        'test-agent-id',
        expect.stringContaining('Story ID:')
      );
      expect(mockAgentPool.destroyAgent).toHaveBeenCalledWith('test-agent-id');

      expect(result).toEqual({
        files: [
          {
            path: 'backend/src/test/example.ts',
            content: 'export function hello() { return "world"; }',
            operation: 'create'
          }
        ],
        commitMessage: 'Implement test story',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [
          {
            criterion: 'AC1: Agent responds',
            implemented: true,
            evidence: 'backend/src/test/example.ts:hello'
          }
        ]
      });
    });

    it('should handle JSON in markdown code blocks', async () => {
      const context: StoryContext = {
        story: {
          id: '5-1-test',
          title: 'Test',
          description: 'Test story',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      // Mock response with markdown code block
      const mockResponse = `Here is the implementation:\n\n\`\`\`json\n${JSON.stringify({
        files: [],
        commitMessage: 'Test commit',
        implementationNotes: 'Test notes',
        acceptanceCriteriaMapping: []
      })}\n\`\`\``;

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'amelia',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await amelia.implementStory(context);

      expect(result.commitMessage).toBe('Test commit');
    });

    it('should throw error if LLM invocation fails', async () => {
      const context: StoryContext = {
        story: {
          id: '5-1-test',
          title: 'Test',
          description: 'Test',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'amelia',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockRejectedValue(
        new Error('LLM API error')
      );
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      await expect(amelia.implementStory(context)).rejects.toThrow(
        'Amelia agent failed to implement story'
      );

      // Agent should still be destroyed even on error
      expect(mockAgentPool.destroyAgent).toHaveBeenCalled();
    });
  });

  describe('writeTests', () => {
    beforeEach(async () => {
      amelia = await AmeliaAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should generate tests with coverage report', async () => {
      const code: CodeImplementation = {
        files: [
          {
            path: 'backend/src/test/example.ts',
            content: 'export function hello() { return "world"; }',
            operation: 'create'
          }
        ],
        commitMessage: 'Test',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const mockResponse = JSON.stringify({
        files: [
          {
            path: 'backend/tests/unit/test/example.test.ts',
            content: 'import { describe, it, expect } from "vitest"; // test content'
          }
        ],
        framework: 'vitest',
        testCount: 5,
        coverage: {
          lines: 85,
          functions: 90,
          branches: 80,
          statements: 85,
          uncoveredLines: []
        },
        results: {
          passed: 5,
          failed: 0,
          skipped: 0,
          duration: 123
        }
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'amelia',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await amelia.writeTests(code);

      expect(result.framework).toBe('vitest');
      expect(result.testCount).toBe(5);
      expect(result.coverage.lines).toBe(85);
      expect(result.results.passed).toBe(5);
    });
  });

  describe('reviewCode', () => {
    beforeEach(async () => {
      amelia = await AmeliaAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should perform self-review and return report', async () => {
      const code: CodeImplementation = {
        files: [
          {
            path: 'backend/src/test/example.ts',
            content: 'export function hello() { return "world"; }',
            operation: 'create'
          }
        ],
        commitMessage: 'Test',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const mockResponse = JSON.stringify({
        checklist: [
          {
            item: 'Acceptance Criteria',
            passed: true,
            notes: 'All criteria met'
          }
        ],
        codeSmells: [],
        acceptanceCriteriaCheck: [
          {
            criterion: 'AC1: Function created',
            met: true,
            evidence: 'backend/src/test/example.ts:hello'
          }
        ],
        confidence: 0.9,
        criticalIssues: []
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'amelia',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await amelia.reviewCode(code);

      expect(result.confidence).toBe(0.9);
      expect(result.criticalIssues).toHaveLength(0);
      expect(result.checklist).toHaveLength(1);
    });
  });
});
