/**
 * Unit Tests: Dependency Detection Service
 *
 * Tests for DependencyDetectionService with mocked LLM responses.
 *
 * @module tests/unit/solutioning/dependency-detection-service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DependencyDetectionService } from '../../../src/solutioning/dependency-detection-service.js';
import { Story, DependencyEdge } from '../../../src/solutioning/types.js';

// Mock modules
vi.mock('../../../src/solutioning/bob-llm-config.js');
vi.mock('../../../src/solutioning/bob-agent-loader.js');
vi.mock('../../../src/solutioning/context-builder.js', () => ({
  SolutioningAgentContextBuilder: vi.fn().mockImplementation(() => ({
    buildBobContext: vi.fn().mockReturnValue({
      prd: 'Mocked PRD',
      architecture: 'Mocked Architecture',
      storyPatterns: 'BMAD patterns',
      constraints: {
        storyComplexity: 500,
        confidenceThreshold: 0.75,
        maxEstimatedHours: 2
      }
    }),
    bobDependencyDetectionPrompt: vi.fn().mockReturnValue('Mocked prompt')
  }))
}));
vi.mock('../../../src/llm/LLMFactory.js', () => ({
  LLMFactory: vi.fn()
}));

describe('DependencyDetectionService', () => {
  let service: DependencyDetectionService;
  let mockStories: Story[];
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    service = new DependencyDetectionService();

    // Create mock stories
    mockStories = [
      {
        id: '4-1',
        epic: 'epic-4',
        title: 'Data Models',
        description: 'As a developer, I want data models defined',
        acceptance_criteria: ['Define types', 'Export from types.ts'],
        dependencies: [],
        status: 'done',
        technical_notes: {
          affected_files: ['backend/src/solutioning/types.ts'],
          endpoints: [],
          data_structures: ['Epic', 'Story', 'DependencyEdge'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 8,
        complexity: 'medium'
      },
      {
        id: '4-2',
        epic: 'epic-4',
        title: 'Bob Agent Infrastructure',
        description: 'As a developer, I want Bob agent setup',
        acceptance_criteria: ['Load Bob persona', 'Configure LLM'],
        dependencies: ['4-1'],
        status: 'done',
        technical_notes: {
          affected_files: ['backend/src/solutioning/bob-agent-factory.ts'],
          endpoints: [],
          data_structures: ['Epic', 'Story'],
          test_requirements: 'Unit tests'
        },
        estimated_hours: 6,
        complexity: 'high'
      },
      {
        id: '4-4',
        epic: 'epic-4',
        title: 'Epic Formation',
        description: 'As a PM, I want epics formed from PRD',
        acceptance_criteria: ['Form 3-8 epics', 'Business value naming'],
        dependencies: ['4-1', '4-2'],
        status: 'in-progress',
        technical_notes: {
          affected_files: ['backend/src/solutioning/epic-formation-service.ts'],
          endpoints: [],
          data_structures: ['Epic'],
          test_requirements: 'Unit + integration tests'
        },
        estimated_hours: 10,
        complexity: 'high'
      }
    ];

    // Mock loadBobLLMConfig
    const { loadBobLLMConfig } = await import('../../../src/solutioning/bob-llm-config.js');
    vi.mocked(loadBobLLMConfig).mockResolvedValue({
      provider: 'anthropic',
      model: 'claude-haiku-3-5',
      temperature: 0.3,
      max_tokens: 4096
    });

    // Mock loadBobPersona
    const { loadBobPersona } = await import('../../../src/solutioning/bob-agent-loader.js');
    vi.mocked(loadBobPersona).mockResolvedValue({
      name: 'Bob',
      role: 'Scrum Master',
      capabilities: ['Epic formation', 'Story decomposition', 'Dependency detection'],
      constraints: [
        'Story complexity: <500 words',
        'Confidence threshold: 0.75',
        'Max estimated hours: 2'
      ],
      patterns: ['BMAD story patterns']
    });

    // Mock LLMFactory
    const { LLMFactory } = await import('../../../src/llm/LLMFactory.js');
    mockInvoke = vi.fn();
    vi.mocked(LLMFactory).mockImplementation(() => ({
      createClient: vi.fn().mockReturnValue({
        invoke: mockInvoke
      })
    }) as any);
  });

  it('should detect dependencies successfully with mock LLM response', async () => {
    // Arrange
    const mockLLMResponse = `\`\`\`json
{
  "dependencies": [
    {
      "from": "4-1",
      "to": "4-2",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-2 uses Epic/Story types defined in 4-1"
    },
    {
      "from": "4-2",
      "to": "4-4",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-4 uses Bob agent infrastructure from 4-2"
    },
    {
      "from": "4-1",
      "to": "4-4",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-4 uses Epic types from 4-1"
    }
  ],
  "confidence": 0.92,
  "reasoning": "High confidence - Clear type imports and infrastructure usage"
}
\`\`\``;

    // Mock LLM invoke
    mockInvoke.mockResolvedValue(mockLLMResponse);

    // Act
    const result = await service.detectDependencies(mockStories, 'PRD content', 'Architecture content');

    // Assert
    expect(result.edges).toHaveLength(3);
    expect(result.edges[0]).toEqual({
      from: '4-1',
      to: '4-2',
      type: 'hard',
      blocking: true
    });
    expect(result.metrics.totalDependencies).toBe(3);
    expect(result.metrics.hardDependencies).toBe(3);
    expect(result.metrics.softDependencies).toBe(0);
    expect(result.metrics.confidence).toBe(0.92);
  });

  it('should parse JSON from markdown code blocks', async () => {
    // Arrange
    const mockLLMResponse = `Here are the dependencies:

\`\`\`json
{
  "dependencies": [
    {
      "from": "4-1",
      "to": "4-2",
      "type": "hard",
      "blocking": true,
      "reasoning": "Type dependency"
    }
  ],
  "confidence": 0.85,
  "reasoning": "Clear dependency"
}
\`\`\`

This is the analysis.`;

    mockInvoke.mockResolvedValue(mockLLMResponse);

    // Act
    const result = await service.detectDependencies(mockStories, 'PRD', 'Arch');

    // Assert
    expect(result.edges).toHaveLength(1);
    expect(result.metrics.confidence).toBe(0.85);
  });

  it('should validate story IDs exist in stories array', async () => {
    // Arrange - Response references non-existent story ID
    const mockLLMResponse = `\`\`\`json
{
  "dependencies": [
    {
      "from": "4-99",
      "to": "4-1",
      "type": "hard",
      "blocking": true,
      "reasoning": "Invalid from ID"
    }
  ],
  "confidence": 0.80,
  "reasoning": "Test"
}
\`\`\``;

    mockInvoke.mockResolvedValue(mockLLMResponse);

    // Act & Assert
    await expect(
      service.detectDependencies(mockStories, 'PRD', 'Arch')
    ).rejects.toThrow('story ID "4-99" not found');
  });

  it('should handle LLM failures with retry logic', async () => {
    // Arrange - First 2 attempts fail, 3rd succeeds
    const mockLLMResponse = `\`\`\`json
{
  "dependencies": [],
  "confidence": 0.90,
  "reasoning": "No dependencies found"
}
\`\`\``;

    mockInvoke
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(mockLLMResponse);

    // Act
    const result = await service.detectDependencies(mockStories, 'PRD', 'Arch');

    // Assert
    expect(result.edges).toHaveLength(0);
    expect(mockInvoke).toHaveBeenCalledTimes(3);
  }, 10000);

  it('should not retry on permanent errors', async () => {
    // Arrange - Auth error (permanent)
    mockInvoke.mockRejectedValue(new Error('authentication failed'));

    // Act & Assert
    await expect(
      service.detectDependencies(mockStories, 'PRD', 'Arch')
    ).rejects.toThrow('Permanent error - no retry');
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid JSON responses', async () => {
    // Arrange - Invalid JSON
    mockInvoke.mockResolvedValue('Not valid JSON at all');

    // Act & Assert
    await expect(
      service.detectDependencies(mockStories, 'PRD', 'Arch')
    ).rejects.toThrow('Failed to parse dependency detection response');
  });

  it('should track metrics correctly', async () => {
    // Arrange
    const mockLLMResponse = `\`\`\`json
{
  "dependencies": [
    {"from": "4-1", "to": "4-2", "type": "hard", "blocking": true, "reasoning": "Test"},
    {"from": "4-2", "to": "4-4", "type": "soft", "blocking": false, "reasoning": "Test"}
  ],
  "confidence": 0.88,
  "reasoning": "Test reasoning"
}
\`\`\``;

    mockInvoke.mockResolvedValue(mockLLMResponse);

    // Act
    const result = await service.detectDependencies(mockStories, 'PRD', 'Arch');

    // Assert
    expect(result.metrics.totalDependencies).toBe(2);
    expect(result.metrics.hardDependencies).toBe(1);
    expect(result.metrics.softDependencies).toBe(1);
    expect(result.metrics.confidence).toBe(0.88);
    expect(result.metrics.reasoning).toBe('Test reasoning');
    expect(result.metrics.executionTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.metrics.llmTokensUsed).toBeGreaterThanOrEqual(0);
  });
});
