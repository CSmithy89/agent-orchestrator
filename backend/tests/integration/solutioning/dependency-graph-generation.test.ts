/**
 * Integration Tests: Dependency Graph Generation
 *
 * Tests complete workflow: stories → dependency detection → graph generation
 *
 * @module tests/integration/solutioning/dependency-graph-generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import { DependencyDetectionService } from '../../../src/solutioning/dependency-detection-service.js';
import { DependencyGraphGenerator } from '../../../src/solutioning/dependency-graph-generator.js';
import { Story } from '../../../src/solutioning/types.js';

// Mock modules
vi.mock('fs/promises');
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

describe('Dependency Graph Generation (Integration)', () => {
  let dependencyDetectionService: DependencyDetectionService;
  let dependencyGraphGenerator: DependencyGraphGenerator;
  let mockStories: Story[];
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    dependencyDetectionService = new DependencyDetectionService();
    dependencyGraphGenerator = new DependencyGraphGenerator();

    // Create realistic mock stories (from Story 4.4 integration test)
    mockStories = [
      {
        id: '4-1',
        epic: 'epic-4',
        title: 'Solutioning Data Models & Story Schema',
        description: 'As a solutioning system developer, I want foundational data models...',
        acceptance_criteria: [
          'TypeScript interfaces defined in types.ts',
          'JSON schema validation implemented',
          'StoryTemplateBuilder class created',
          'All tests passing with 80%+ coverage'
        ],
        dependencies: [],
        status: 'done',
        technical_notes: {
          affected_files: ['backend/src/solutioning/types.ts', 'backend/src/solutioning/schemas.ts'],
          endpoints: [],
          data_structures: ['Epic', 'Story', 'DependencyGraph', 'ValidationResult'],
          test_requirements: 'Unit tests with 80%+ coverage using Vitest'
        },
        estimated_hours: 8,
        complexity: 'medium'
      },
      {
        id: '4-2',
        epic: 'epic-4',
        title: 'Bob Agent Infrastructure & Context Builder',
        description: 'As a solutioning system developer, I want Bob agent infrastructure...',
        acceptance_criteria: [
          'Bob persona loaded from bmad/bmm/agents/bob.md',
          'LLM assignments read from .bmad/project-config.yaml',
          'SolutioningAgentContextBuilder implemented',
          'Agent methods: formEpics(), decomposeStories(), detectDependencies()'
        ],
        dependencies: ['4-1'],
        status: 'done',
        technical_notes: {
          affected_files: [
            'backend/src/solutioning/bob-agent-loader.ts',
            'backend/src/solutioning/context-builder.ts'
          ],
          endpoints: [],
          data_structures: ['Epic', 'Story', 'AgentContext'],
          test_requirements: 'Unit tests with mocked file system'
        },
        estimated_hours: 6,
        complexity: 'high'
      },
      {
        id: '4-3',
        epic: 'epic-4',
        title: 'Solutioning Workflow Engine Foundation',
        description: 'As a solutioning system developer, I want workflow engine foundation...',
        acceptance_criteria: [
          'SolutioningWorkflowEngine class extends WorkflowEngine',
          'Workflow.yaml loaded and parsed',
          'State machine transitions implemented',
          'State persistence to bmad/workflow-status.yaml'
        ],
        dependencies: ['4-1'],
        status: 'done',
        technical_notes: {
          affected_files: ['backend/src/solutioning/workflow-engine.ts'],
          endpoints: [],
          data_structures: ['SolutioningWorkflowState', 'WorkflowCheckpoint'],
          test_requirements: 'Unit tests for workflow engine and state machine'
        },
        estimated_hours: 8,
        complexity: 'high'
      },
      {
        id: '4-4',
        epic: 'epic-4',
        title: 'Epic Formation & Story Decomposition',
        description: 'As a user wanting automated story decomposition, I want Bob agent to analyze PRD...',
        acceptance_criteria: [
          'Bob agent invoked via SolutioningAgentContextBuilder',
          'PRD functional requirements analyzed',
          '3-8 epics formed with business value naming',
          '3-10 stories generated per epic',
          '8-12 clear acceptance criteria per story'
        ],
        dependencies: ['4-1', '4-2', '4-3'],
        status: 'done',
        technical_notes: {
          affected_files: [
            'backend/src/solutioning/epic-formation-service.ts',
            'backend/src/solutioning/story-decomposition-service.ts'
          ],
          endpoints: [],
          data_structures: ['Epic', 'Story'],
          test_requirements: 'Unit tests + integration tests with mock Bob responses'
        },
        estimated_hours: 12,
        complexity: 'high'
      },
      {
        id: '4-5',
        epic: 'epic-4',
        title: 'Dependency Detection & Graph Generation',
        description: 'As a Scrum Master planning story order, I want dependency detection...',
        acceptance_criteria: [
          'Invoke Bob agent detectDependencies() method',
          'Analyze technical dependencies',
          'Mark dependencies as hard/soft',
          'Generate dependency graph with critical path'
        ],
        dependencies: ['4-1', '4-2', '4-4'],
        status: 'in-progress',
        technical_notes: {
          affected_files: [
            'backend/src/solutioning/dependency-detection-service.ts',
            'backend/src/solutioning/dependency-graph-generator.ts'
          ],
          endpoints: [],
          data_structures: ['DependencyEdge', 'DependencyGraph'],
          test_requirements: 'Unit tests + integration test'
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

    // Mock LLMFactory with realistic response
    const { LLMFactory } = await import('../../../src/llm/LLMFactory.js');
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
      "from": "4-1",
      "to": "4-3",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-3 uses workflow state types from 4-1"
    },
    {
      "from": "4-1",
      "to": "4-4",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-4 uses Epic/Story types from 4-1"
    },
    {
      "from": "4-2",
      "to": "4-4",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-4 invokes Bob agent infrastructure from 4-2"
    },
    {
      "from": "4-3",
      "to": "4-4",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-4 uses workflow engine from 4-3"
    },
    {
      "from": "4-1",
      "to": "4-5",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-5 uses DependencyEdge/Graph types from 4-1"
    },
    {
      "from": "4-2",
      "to": "4-5",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-5 uses Bob agent for dependency detection"
    },
    {
      "from": "4-4",
      "to": "4-5",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-5 analyzes stories generated by 4-4"
    }
  ],
  "confidence": 0.94,
  "reasoning": "Very high confidence - Clear technical dependencies based on type imports and infrastructure usage patterns"
}
\`\`\``;

    mockInvoke = vi.fn().mockResolvedValue(mockLLMResponse);
    vi.mocked(LLMFactory).mockImplementation(() => ({
      createClient: vi.fn().mockReturnValue({
        invoke: mockInvoke
      })
    }) as any);

    // Mock fs.writeFile
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it('should execute complete dependency graph generation workflow', async () => {
    // Act
    // Step 1: Detect dependencies
    const detectionResult = await dependencyDetectionService.detectDependencies(
      mockStories,
      'PRD content',
      'Architecture content'
    );

    // Step 2: Generate dependency graph
    const graph = dependencyGraphGenerator.generateGraph(mockStories, detectionResult.edges);

    // Assert - Dependency detection results
    expect(detectionResult.edges.length).toBeGreaterThan(0);
    expect(detectionResult.metrics.totalDependencies).toBe(detectionResult.edges.length);
    expect(detectionResult.metrics.confidence).toBeGreaterThan(0.8);

    // Assert - Graph structure
    expect(graph.nodes).toHaveLength(5);
    expect(graph.edges.length).toBe(detectionResult.edges.length);

    // Assert - Critical path
    expect(graph.critical_path).toHaveLength(5);
    expect(graph.critical_path[0]).toBe('4-1'); // Foundation story comes first
    expect(graph.critical_path[4]).toBe('4-5'); // Last story in chain

    // Assert - Graph metadata
    expect(graph.metadata.totalStories).toBe(5);
    expect(graph.metadata.criticalPathLength).toBe(5);

    // Assert - Bottlenecks (4-1 blocks 4 other stories)
    expect(graph.bottlenecks).toContain('4-1');
    expect(graph.metadata.bottlenecks).toContain('4-1');

    // Assert - Parallel groups
    expect(Array.isArray(graph.parallelizable)).toBe(true);

    console.log('✓ Dependency graph generated successfully:');
    console.log(`  - Stories: ${graph.nodes.length}`);
    console.log(`  - Dependencies: ${graph.edges.length}`);
    console.log(`  - Critical path: ${graph.critical_path.join(' → ')}`);
    console.log(`  - Bottlenecks: ${graph.bottlenecks.join(', ')}`);
    console.log(`  - Parallel groups: ${graph.parallelizable.length}`);
  });

  it('should detect circular dependencies and error', async () => {
    // Arrange - Mock LLM response with circular dependency
    const circularResponse = `\`\`\`json
{
  "dependencies": [
    {"from": "4-1", "to": "4-2", "type": "hard", "blocking": true, "reasoning": "Test"},
    {"from": "4-2", "to": "4-4", "type": "hard", "blocking": true, "reasoning": "Test"},
    {"from": "4-4", "to": "4-1", "type": "hard", "blocking": true, "reasoning": "Creates cycle"}
  ],
  "confidence": 0.80,
  "reasoning": "Test circular dependency"
}
\`\`\``;

    mockInvoke.mockResolvedValue(circularResponse);

    // Act - Detect dependencies
    const detectionResult = await dependencyDetectionService.detectDependencies(
      mockStories,
      'PRD',
      'Arch'
    );

    // Assert - Graph generation should throw
    expect(() =>
      dependencyGraphGenerator.generateGraph(mockStories, detectionResult.edges)
    ).toThrow('Circular dependency detected');
  });

  it('should handle empty dependencies gracefully', async () => {
    // Arrange - Mock LLM response with no dependencies
    const noDepsResponse = `\`\`\`json
{
  "dependencies": [],
  "confidence": 0.90,
  "reasoning": "All stories are independent"
}
\`\`\``;

    mockInvoke.mockResolvedValue(noDepsResponse);

    // Act
    const detectionResult = await dependencyDetectionService.detectDependencies(
      mockStories,
      'PRD',
      'Arch'
    );
    const graph = dependencyGraphGenerator.generateGraph(mockStories, detectionResult.edges);

    // Assert
    expect(graph.edges).toHaveLength(0);
    expect(graph.critical_path).toHaveLength(5); // All stories in arbitrary order
    expect(graph.bottlenecks).toHaveLength(0);
    expect(graph.metadata.totalStories).toBe(5);
  });

  it('should save graph to file successfully', async () => {
    // Act
    const detectionResult = await dependencyDetectionService.detectDependencies(
      mockStories,
      'PRD',
      'Arch'
    );
    const graph = dependencyGraphGenerator.generateGraph(mockStories, detectionResult.edges);

    // Save to file
    const graphPath = 'docs/dependency-graph.json';
    await fs.writeFile(graphPath, JSON.stringify(graph, null, 2), 'utf-8');

    // Assert
    expect(fs.writeFile).toHaveBeenCalledWith(
      graphPath,
      expect.stringContaining('"nodes"'),
      'utf-8'
    );
  });
});
