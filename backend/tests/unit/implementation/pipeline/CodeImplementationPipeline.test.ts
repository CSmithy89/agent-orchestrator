/**
 * Unit Tests for CodeImplementationPipeline
 *
 * Tests the complete code implementation pipeline with mocked dependencies.
 * Follows AAA pattern (Arrange, Act, Assert).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeImplementationPipeline } from '../../../../src/implementation/pipeline/CodeImplementationPipeline.js';
import { AmeliaAgentInfrastructure } from '../../../../src/implementation/agents/amelia.js';
import {
  StoryContext,
  CodeImplementation,
  CodeFile,
  AcceptanceCriteriaMapping
} from '../../../../src/implementation/types.js';

// Mock dependencies
vi.mock('../../../../src/implementation/agents/amelia.js');
vi.mock('../../../../src/implementation/pipeline/validators.js');
vi.mock('../../../../src/implementation/pipeline/file-operations.js');
vi.mock('../../../../src/implementation/pipeline/git-operations.js');
vi.mock('../../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('CodeImplementationPipeline', () => {
  let pipeline: CodeImplementationPipeline;
  let mockAmeliaAgent: any;
  let mockStoryContext: StoryContext;
  let mockCodeImplementation: CodeImplementation;

  beforeEach(async () => {
    // Create mock Amelia agent
    mockAmeliaAgent = {
      implementStory: vi.fn(),
      writeTests: vi.fn(),
      reviewCode: vi.fn()
    };

    // Create pipeline instance
    pipeline = new CodeImplementationPipeline(mockAmeliaAgent, {
      projectRoot: '/test/project',
      worktreePath: '/test/worktree',
      strictValidation: true,
      enablePerformanceTracking: true
    });

    // Create mock story context
    mockStoryContext = {
      story: {
        id: '5-4-code-implementation-pipeline',
        title: 'Code Implementation Pipeline',
        description: 'As a system, I want to implement code automatically',
        acceptanceCriteria: [
          'AC1: Pipeline executes successfully',
          'AC2: Files are created correctly',
          'AC3: Validation passes'
        ],
        technicalNotes: {
          architectureAlignment: 'Microkernel pattern',
          designDecisions: ['Dependency injection', 'Factory pattern']
        },
        dependencies: ['5-1', '5-2', '5-3']
      },
      prdContext: 'PRD context for testing',
      architectureContext: 'Architecture context with microkernel pattern',
      onboardingDocs: 'Coding standards and conventions',
      existingCode: [],
      totalTokens: 10000
    };

    // Create mock code implementation
    mockCodeImplementation = {
      files: [
        {
          path: 'backend/src/test/TestClass.ts',
          content: 'export class TestClass { constructor(private readonly dep: Dep) {} }',
          operation: 'create'
        }
      ],
      commitMessage: 'Story 5-4: Code Implementation Pipeline',
      implementationNotes: 'Implementation notes here',
      acceptanceCriteriaMapping: [
        {
          criterion: 'AC1: Pipeline executes successfully',
          implemented: true,
          evidence: 'Implemented in TestClass.ts'
        }
      ]
    };

    // Setup default mock implementations
    mockAmeliaAgent.implementStory.mockResolvedValue(mockCodeImplementation);

    // Mock validators to pass by default
    const { validateArchitectureCompliance, validateCodingStandards, validateErrorHandling, validateSecurityPractices } = await import('../../../../src/implementation/pipeline/validators.js');
    (validateArchitectureCompliance as any).mockResolvedValue({
      category: 'Architecture Compliance',
      passed: true,
      issues: [],
      warnings: []
    });
    (validateCodingStandards as any).mockResolvedValue({
      category: 'Coding Standards',
      passed: true,
      issues: [],
      warnings: []
    });
    (validateErrorHandling as any).mockResolvedValue({
      category: 'Error Handling',
      passed: true,
      issues: [],
      warnings: []
    });
    (validateSecurityPractices as any).mockResolvedValue({
      category: 'Security Practices',
      passed: true,
      issues: [],
      warnings: []
    });

    // Mock file operations to succeed by default
    const { applyFileChanges } = await import('../../../../src/implementation/pipeline/file-operations.js');
    (applyFileChanges as any).mockResolvedValue({
      created: ['backend/src/test/TestClass.ts'],
      modified: [],
      deleted: [],
      failures: []
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute complete pipeline successfully', async () => {
      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result).toBeDefined();
      expect(result.files).toHaveLength(1);
      expect(result.commitMessage).toBe('Story 5-4: Code Implementation Pipeline');
      expect(mockAmeliaAgent.implementStory).toHaveBeenCalledWith(mockStoryContext);
    });

    it('should parse and validate context', async () => {
      // Act
      await pipeline.execute(mockStoryContext);

      // Assert
      expect(mockAmeliaAgent.implementStory).toHaveBeenCalled();
    });

    it('should extract acceptance criteria', async () => {
      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result.acceptanceCriteriaMapping).toBeDefined();
      expect(result.acceptanceCriteriaMapping.length).toBeGreaterThan(0);
    });

    it('should invoke Amelia agent for implementation', async () => {
      // Act
      await pipeline.execute(mockStoryContext);

      // Assert
      expect(mockAmeliaAgent.implementStory).toHaveBeenCalledTimes(1);
      expect(mockAmeliaAgent.implementStory).toHaveBeenCalledWith(mockStoryContext);
    });

    it('should validate implementation', async () => {
      // Arrange
      const { validateArchitectureCompliance, validateCodingStandards } = await import('../../../../src/implementation/pipeline/validators.js');

      // Act
      await pipeline.execute(mockStoryContext);

      // Assert
      expect(validateArchitectureCompliance).toHaveBeenCalled();
      expect(validateCodingStandards).toHaveBeenCalled();
    });

    it('should apply file changes to worktree', async () => {
      // Arrange
      const { applyFileChanges } = await import('../../../../src/implementation/pipeline/file-operations.js');

      // Act
      await pipeline.execute(mockStoryContext);

      // Assert
      expect(applyFileChanges).toHaveBeenCalledWith(
        mockCodeImplementation.files,
        '/test/worktree'
      );
    });

    it('should enhance implementation with metadata', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        implementationNotes: '', // Empty notes
        acceptanceCriteriaMapping: [] // Empty mapping
      });

      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result.implementationNotes).toBeTruthy();
      expect(result.implementationNotes.length).toBeGreaterThan(0);
      expect(result.acceptanceCriteriaMapping).toBeTruthy();
      expect(result.acceptanceCriteriaMapping.length).toBeGreaterThan(0);
    });

    it('should track performance metrics', async () => {
      // Act
      await pipeline.execute(mockStoryContext);

      // Assert
      const metrics = pipeline.getPerformanceMetrics();
      expect(metrics.totalDuration).toBeGreaterThan(0);
      expect(metrics.contextParsingDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.ameliaInvocationDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.validationDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.fileOperationsDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('context validation', () => {
    it('should throw error if story ID is missing', async () => {
      // Arrange
      const invalidContext = {
        ...mockStoryContext,
        story: { ...mockStoryContext.story, id: '' }
      };

      // Act & Assert
      await expect(pipeline.execute(invalidContext)).rejects.toThrow(
        /Story context missing required field: story.id/
      );
    });

    it('should throw error if story title is missing', async () => {
      // Arrange
      const invalidContext = {
        ...mockStoryContext,
        story: { ...mockStoryContext.story, title: '' }
      };

      // Act & Assert
      await expect(pipeline.execute(invalidContext)).rejects.toThrow(
        /Story context missing required field: story.title/
      );
    });

    it('should throw error if acceptance criteria are missing', async () => {
      // Arrange
      const invalidContext = {
        ...mockStoryContext,
        story: { ...mockStoryContext.story, acceptanceCriteria: [] }
      };

      // Act & Assert
      await expect(pipeline.execute(invalidContext)).rejects.toThrow(
        /Story context missing acceptance criteria/
      );
    });

    it('should warn if token count exceeds limit', async () => {
      // Arrange
      const { logger } = await import('../../../../src/utils/logger.js');
      const highTokenContext = {
        ...mockStoryContext,
        totalTokens: 60000
      };

      // Act
      await pipeline.execute(highTokenContext);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Context exceeds recommended token limit',
        expect.any(Object)
      );
    });
  });

  describe('Amelia agent integration', () => {
    it('should retry on Amelia invocation failure', async () => {
      // Arrange
      mockAmeliaAgent.implementStory
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockCodeImplementation);

      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(mockAmeliaAgent.implementStory).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should throw error after max retries', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockRejectedValue(new Error('Persistent failure'));

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Amelia invocation failed after 3 attempts/
      );
      expect(mockAmeliaAgent.implementStory).toHaveBeenCalledTimes(3);
    });

    it('should throw error if Amelia returns no files', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        files: []
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Amelia returned no files/
      );
    });

    it('should throw error if Amelia returns no commit message', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        commitMessage: ''
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Amelia returned no commit message/
      );
    });
  });

  describe('validation failures', () => {
    it('should throw error on architecture validation failure in strict mode', async () => {
      // Arrange
      const { validateArchitectureCompliance } = await import('../../../../src/implementation/pipeline/validators.js');
      (validateArchitectureCompliance as any).mockResolvedValue({
        category: 'Architecture Compliance',
        passed: false,
        issues: ['Missing dependency injection'],
        warnings: []
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Validation failed/
      );
    });

    it('should throw error on coding standards failure in strict mode', async () => {
      // Arrange
      const { validateCodingStandards } = await import('../../../../src/implementation/pipeline/validators.js');
      (validateCodingStandards as any).mockResolvedValue({
        category: 'Coding Standards',
        passed: false,
        issues: ['Missing JSDoc comments'],
        warnings: []
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Validation failed/
      );
    });

    it('should throw error on error handling failure in strict mode', async () => {
      // Arrange
      const { validateErrorHandling } = await import('../../../../src/implementation/pipeline/validators.js');
      (validateErrorHandling as any).mockResolvedValue({
        category: 'Error Handling',
        passed: false,
        issues: ['Empty catch blocks'],
        warnings: []
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Validation failed/
      );
    });

    it('should throw error on security validation failure in strict mode', async () => {
      // Arrange
      const { validateSecurityPractices } = await import('../../../../src/implementation/pipeline/validators.js');
      (validateSecurityPractices as any).mockResolvedValue({
        category: 'Security Practices',
        passed: false,
        issues: ['Hardcoded secrets detected'],
        warnings: []
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Validation failed/
      );
    });
  });

  describe('file operations', () => {
    it('should throw error if file operations fail', async () => {
      // Arrange
      const { applyFileChanges } = await import('../../../../src/implementation/pipeline/file-operations.js');
      (applyFileChanges as any).mockResolvedValue({
        created: [],
        modified: [],
        deleted: [],
        failures: [
          { path: 'test.ts', operation: 'create', error: 'Permission denied' }
        ]
      });

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /File operation failures/
      );
    });
  });

  describe('implementation enhancement', () => {
    it('should generate implementation notes if not provided', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        implementationNotes: ''
      });

      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result.implementationNotes).toBeTruthy();
      expect(result.implementationNotes).toContain('Implementation Notes');
      expect(result.implementationNotes).toContain(mockStoryContext.story.id);
    });

    it('should generate acceptance criteria mapping if not provided', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        acceptanceCriteriaMapping: []
      });

      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result.acceptanceCriteriaMapping).toBeDefined();
      expect(result.acceptanceCriteriaMapping.length).toBe(
        mockStoryContext.story.acceptanceCriteria.length
      );
      result.acceptanceCriteriaMapping.forEach(mapping => {
        expect(mapping.criterion).toBeTruthy();
        expect(mapping.implemented).toBe(true);
        expect(mapping.evidence).toBeTruthy();
      });
    });

    it('should preserve existing implementation notes if provided', async () => {
      // Arrange
      const customNotes = 'Custom implementation notes from Amelia';
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        implementationNotes: customNotes
      });

      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result.implementationNotes).toBe(customNotes);
    });

    it('should preserve existing AC mapping if complete', async () => {
      // Arrange
      const customMapping: AcceptanceCriteriaMapping[] = [
        { criterion: 'AC1', implemented: true, evidence: 'Evidence 1' },
        { criterion: 'AC2', implemented: true, evidence: 'Evidence 2' },
        { criterion: 'AC3', implemented: true, evidence: 'Evidence 3' }
      ];
      mockAmeliaAgent.implementStory.mockResolvedValue({
        ...mockCodeImplementation,
        acceptanceCriteriaMapping: customMapping
      });

      // Act
      const result = await pipeline.execute(mockStoryContext);

      // Assert
      expect(result.acceptanceCriteriaMapping).toEqual(customMapping);
    });
  });

  describe('performance tracking', () => {
    it('should initialize performance metrics', () => {
      // Act
      const metrics = pipeline.getPerformanceMetrics();

      // Assert
      expect(metrics).toBeDefined();
      expect(metrics.contextParsingDuration).toBe(0);
      expect(metrics.ameliaInvocationDuration).toBe(0);
      expect(metrics.validationDuration).toBe(0);
      expect(metrics.fileOperationsDuration).toBe(0);
      expect(metrics.gitCommitDuration).toBe(0);
      expect(metrics.totalDuration).toBe(0);
      expect(metrics.bottlenecks).toEqual([]);
    });

    it('should track execution time for each step', async () => {
      // Act
      await pipeline.execute(mockStoryContext);
      const metrics = pipeline.getPerformanceMetrics();

      // Assert
      expect(metrics.contextParsingDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.ameliaInvocationDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.validationDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.fileOperationsDuration).toBeGreaterThanOrEqual(0);
      expect(metrics.totalDuration).toBeGreaterThan(0);
    });

    it('should return performance metrics after execution', async () => {
      // Act
      await pipeline.execute(mockStoryContext);
      const metrics = pipeline.getPerformanceMetrics();

      // Assert
      expect(metrics.totalDuration).toBeGreaterThan(0);
      expect(metrics.totalDuration).toBeGreaterThanOrEqual(
        metrics.contextParsingDuration +
        metrics.ameliaInvocationDuration +
        metrics.validationDuration +
        metrics.fileOperationsDuration
      );
    });
  });

  describe('error handling', () => {
    it('should throw descriptive error on pipeline failure', async () => {
      // Arrange
      mockAmeliaAgent.implementStory.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow(
        /Code implementation pipeline failed for story 5-4-code-implementation-pipeline/
      );
    });

    it('should log error on pipeline failure', async () => {
      // Arrange
      const { logger } = await import('../../../../src/utils/logger.js');
      mockAmeliaAgent.implementStory.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(pipeline.execute(mockStoryContext)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Code implementation pipeline failed',
        expect.any(Error),
        expect.objectContaining({ storyId: mockStoryContext.story.id })
      );
    });
  });
});
