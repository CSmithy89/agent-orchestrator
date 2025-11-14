/**
 * Unit tests for TestGenerationExecutor
 *
 * Tests cover:
 * - Test framework auto-detection
 * - Test generation with mock Amelia agent
 * - Test file creation
 * - Test execution and result parsing
 * - Coverage report generation and validation
 * - Automatic test fixing retry logic
 * - Error handling for each step
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestGenerationExecutor } from '../../../../src/implementation/testing/TestGenerationExecutor.js';
import { AmeliaAgent, CodeImplementation, StoryContext, TestSuite, TestFile, CoverageReport } from '../../../../src/implementation/types.js';
import { Logger } from '../../../../src/utils/logger.js';
import * as fs from 'fs/promises';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('child_process');
vi.mock('../../../../src/utils/logger.js');

describe('TestGenerationExecutor', () => {
  let executor: TestGenerationExecutor;
  let mockAmeliaAgent: AmeliaAgent;
  let mockLogger: Logger;
  const projectRoot = '/test/project';

  // Mock implementations
  const mockImplementation: CodeImplementation = {
    files: [
      {
        path: 'backend/src/example.ts',
        content: 'export function example() { return "test"; }',
        operation: 'create',
      },
    ],
    commitMessage: 'Implement example feature',
    implementationNotes: 'Created example function',
    acceptanceCriteriaMapping: [
      {
        criterion: 'Example criterion',
        implemented: true,
        evidence: 'backend/src/example.ts:example()',
      },
    ],
  };

  const mockContext: StoryContext = {
    story: {
      id: '5-5-test-generation-execution',
      title: 'Test Generation Execution',
      description: 'As a developer...',
      acceptanceCriteria: ['AC1: Tests generated', 'AC2: Coverage >80%'],
      technicalNotes: {
        architectureAlignment: 'Follows Epic 5 pattern',
        designDecisions: ['Use Vitest for testing'],
        testingStandards: 'AAA pattern, >80% coverage',
        references: ['docs/epics/epic-5-tech-spec.md'],
      },
      dependencies: ['5-1-core-agent-infrastructure'],
    },
    prdContext: 'PRD context...',
    architectureContext: 'Architecture context...',
    onboardingDocs: 'Onboarding docs...',
    existingCode: [],
    totalTokens: 10000,
  };

  const mockTestSuite: TestSuite = {
    files: [
      {
        path: 'backend/tests/unit/example.test.ts',
        content: 'import { describe, it, expect } from "vitest";\nimport { example } from "../../src/example.js";\n\ndescribe("example", () => {\n  it("should return test", () => {\n    expect(example()).toBe("test");\n  });\n});',
      },
    ],
    framework: 'vitest',
    testCount: 1,
    coverage: {
      lines: 85,
      functions: 90,
      branches: 80,
      statements: 85,
      uncoveredLines: [],
    },
    results: {
      passed: 1,
      failed: 0,
      skipped: 0,
      duration: 1000,
    },
  };

  const mockPackageJson = {
    name: 'test-project',
    scripts: {
      test: 'vitest run',
      'test:coverage': 'vitest run --coverage',
    },
    devDependencies: {
      vitest: '^1.0.0',
      '@vitest/coverage-v8': '^1.0.0',
    },
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock Amelia agent
    mockAmeliaAgent = {
      name: 'amelia',
      role: 'Developer',
      expertise: ['code-implementation', 'test-generation', 'debugging', 'refactoring', 'documentation'],
      llm: {
        model: 'gpt-4o',
        provider: 'openai',
        temperature: 0.4,
      },
      implementStory: vi.fn(),
      writeTests: vi.fn().mockResolvedValue(mockTestSuite),
      reviewCode: vi.fn(),
      execute: vi.fn(),
    } as any;

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as any;

    // Create executor instance
    executor = new TestGenerationExecutor(mockAmeliaAgent, projectRoot, mockLogger);

    // Mock fs.readFile for package.json
    vi.mocked(fs.readFile).mockImplementation(async (path: any) => {
      if (path.includes('package.json')) {
        return JSON.stringify(mockPackageJson);
      }
      if (path.includes('coverage-summary.json')) {
        return JSON.stringify({
          total: {
            lines: { pct: 85 },
            functions: { pct: 90 },
            branches: { pct: 80 },
            statements: { pct: 85 },
          },
        });
      }
      throw new Error('File not found');
    });

    // Mock fs.mkdir
    vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);

    // Mock fs.writeFile
    vi.mocked(fs.writeFile).mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectTestFramework', () => {
    it('should detect Vitest from package.json', async () => {
      // Arrange & Act
      const result = await executor['detectTestFramework']();

      // Assert
      expect(result).toEqual({
        framework: 'vitest',
        testCommand: 'npm test',
        coverageCommand: 'npm run test:coverage',
        coverageTool: '@vitest/coverage-v8',
        testFileExtension: '.test.ts',
        testDirectory: 'backend/tests',
      });
    });

    it('should detect Jest from package.json', async () => {
      // Arrange
      const jestPackageJson = {
        ...mockPackageJson,
        devDependencies: {
          jest: '^29.0.0',
        },
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(jestPackageJson));

      // Act
      const result = await executor['detectTestFramework']();

      // Assert
      expect(result.framework).toBe('jest');
      expect(result.coverageTool).toBe('jest');
    });

    it('should throw error if no test framework detected', async () => {
      // Arrange
      const noFrameworkPackageJson = {
        name: 'test-project',
        devDependencies: {},
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(noFrameworkPackageJson));

      // Act & Assert
      await expect(executor['detectTestFramework']()).rejects.toThrow(
        'No test framework detected'
      );
    });

    it('should handle missing package.json', async () => {
      // Arrange
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      // Act & Assert
      await expect(executor['detectTestFramework']()).rejects.toThrow(
        'Test framework detection failed'
      );
    });
  });

  describe('createTestFiles', () => {
    it('should create all test files with proper directory structure', async () => {
      // Arrange
      const testFiles: TestFile[] = [
        {
          path: 'backend/tests/unit/example.test.ts',
          content: 'test content',
        },
        {
          path: 'backend/tests/integration/example.integration.test.ts',
          content: 'integration test content',
        },
      ];

      // Act
      await executor['createTestFiles'](testFiles, {
        framework: 'vitest',
        testCommand: 'npm test',
        coverageCommand: 'npm run test:coverage',
        coverageTool: '@vitest/coverage-v8',
        testFileExtension: '.test.ts',
        testDirectory: 'backend/tests',
      });

      // Assert
      expect(fs.mkdir).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('backend/tests/unit/example.test.ts'),
        'test content',
        'utf-8'
      );
    });

    it('should handle file creation errors', async () => {
      // Arrange
      const testFiles: TestFile[] = [
        {
          path: 'backend/tests/unit/example.test.ts',
          content: 'test content',
        },
      ];
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(
        executor['createTestFiles'](testFiles, {
          framework: 'vitest',
          testCommand: 'npm test',
          coverageCommand: 'npm run test:coverage',
          coverageTool: '@vitest/coverage-v8',
          testFileExtension: '.test.ts',
          testDirectory: 'backend/tests',
        })
      ).rejects.toThrow('Test file creation failed');
    });
  });

  describe('parseTestResults', () => {
    it('should parse Vitest test results', () => {
      // Arrange
      const output = `
Test Files  1 passed (1)
     Tests  5 passed (5)
      Start at 10:00:00
      Duration  1.23s
`;

      // Act
      const result = executor['parseTestResults'](output, '', 'vitest');

      // Assert
      expect(result.passed).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should parse Vitest test failures', () => {
      // Arrange
      const output = `
Test Files  1 failed (1)
     Tests  2 failed | 3 passed (5)

FAIL  backend/tests/unit/example.test.ts
  ✕ should handle error case
    Error: Expected error not thrown
`;

      // Act
      const result = executor['parseTestResults'](output, '', 'vitest');

      // Assert
      // The regex looks for "Tests X passed" - in this case it's "2 failed | 3 passed (5)"
      // So it should extract the "3 passed" part
      expect(result.passed).toBe(3);
      expect(result.failed).toBe(2);
    });

    it('should parse Jest test results', () => {
      // Arrange
      const output = `
Tests:       1 failed, 4 passed, 5 total
Snapshots:   0 total
Time:        1.234 s
`;

      // Act
      const result = executor['parseTestResults'](output, '', 'jest');

      // Assert
      expect(result.passed).toBe(4);
      expect(result.failed).toBe(1);
      expect(result.skipped).toBe(0);
    });

    it('should parse Mocha test results', () => {
      // Arrange
      const output = `
  5 passing (123ms)
  1 failing
  2 pending
`;

      // Act
      const result = executor['parseTestResults'](output, '', 'mocha');

      // Assert
      expect(result.passed).toBe(5);
      expect(result.failed).toBe(1);
      expect(result.skipped).toBe(2);
    });
  });

  describe('parseCoverageReport', () => {
    it('should parse coverage from JSON file', async () => {
      // Arrange
      const coverageJson = {
        'backend/src/example.ts': {
          lines: { pct: 85.5, covered: 171, total: 200 },
          functions: { pct: 90.0, covered: 9, total: 10 },
          branches: { pct: 80.0, covered: 16, total: 20 },
          statements: { pct: 85.0, covered: 17, total: 20 },
        },
        total: {
          lines: { pct: 85.5 },
          functions: { pct: 90.0 },
          branches: { pct: 80.0 },
          statements: { pct: 85.0 },
        },
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(coverageJson));

      // Act
      const result = await executor['parseCoverageReport'](
        {
          framework: 'vitest',
          testCommand: 'npm test',
          coverageCommand: 'npm run test:coverage',
          coverageTool: '@vitest/coverage-v8',
          testFileExtension: '.test.ts',
          testDirectory: 'backend/tests',
        },
        '',
        mockImplementation
      );

      // Assert
      expect(result.lines).toBe(85.5);
      expect(result.functions).toBe(90.0);
      expect(result.branches).toBe(80.0);
      expect(result.statements).toBe(85.0);
    });

    it('should parse coverage from output text', async () => {
      // Arrange
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));
      const output = `
Coverage summary:
Lines      : 85.5%
Functions  : 90.0%
Branches   : 80.0%
Statements : 85.0%
`;

      // Act
      const result = await executor['parseCoverageReport'](
        {
          framework: 'vitest',
          testCommand: 'npm test',
          coverageCommand: 'npm run test:coverage',
          coverageTool: '@vitest/coverage-v8',
          testFileExtension: '.test.ts',
          testDirectory: 'backend/tests',
        },
        output,
        mockImplementation
      );

      // Assert
      expect(result.lines).toBe(85.5);
      expect(result.functions).toBe(90.0);
      expect(result.branches).toBe(80.0);
      expect(result.statements).toBe(85.0);
    });

    it('should return zero coverage if parsing fails', async () => {
      // Arrange
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      // Act
      const result = await executor['parseCoverageReport'](
        {
          framework: 'vitest',
          testCommand: 'npm test',
          coverageCommand: 'npm run test:coverage',
          coverageTool: '@vitest/coverage-v8',
          testFileExtension: '.test.ts',
          testDirectory: 'backend/tests',
        },
        '',
        mockImplementation
      );

      // Assert
      expect(result.lines).toBe(0);
      expect(result.functions).toBe(0);
      expect(result.branches).toBe(0);
      expect(result.statements).toBe(0);
    });
  });

  describe('validateCoverage', () => {
    it('should return true if all metrics meet 80% threshold', () => {
      // Arrange
      const coverage: CoverageReport = {
        lines: 85,
        functions: 90,
        branches: 80,
        statements: 85,
        uncoveredLines: [],
      };

      // Act
      const result = executor['validateCoverage'](coverage);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if any metric below 80% threshold', () => {
      // Arrange
      const coverage: CoverageReport = {
        lines: 75, // Below threshold
        functions: 90,
        branches: 80,
        statements: 85,
        uncoveredLines: [],
      };

      // Act
      const result = executor['validateCoverage'](coverage);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if branches below threshold', () => {
      // Arrange
      const coverage: CoverageReport = {
        lines: 85,
        functions: 90,
        branches: 75, // Below threshold
        statements: 85,
        uncoveredLines: [],
      };

      // Act
      const result = executor['validateCoverage'](coverage);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('execute - error handling', () => {
    it('should handle test generation errors gracefully', async () => {
      // Arrange
      vi.mocked(fs.readFile).mockImplementation(async (path: any) => {
        if (path.includes('package.json')) {
          return JSON.stringify(mockPackageJson);
        }
        throw new Error('File not found');
      });

      // Mock failing Amelia agent
      mockAmeliaAgent.writeTests = vi.fn().mockRejectedValue(new Error('Test generation failed'));

      // Act & Assert
      await expect(executor.execute(mockImplementation, mockContext)).rejects.toThrow(
        'Test generation failed'
      );
    });
  });

  describe('logPerformanceMetrics', () => {
    it('should log performance metrics without bottlenecks', () => {
      // Arrange
      const metrics = {
        generationDuration: 5000,
        executionDuration: 10000,
        coverageDuration: 3000,
        totalDuration: 18000,
        bottlenecks: [],
      };

      // Act
      executor['logPerformanceMetrics'](metrics);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Test pipeline performance metrics',
        expect.objectContaining({
          generationDuration: '5000ms',
          executionDuration: '10000ms',
          totalDuration: '18000ms',
        })
      );
    });

    it('should log warning for bottlenecks', () => {
      // Arrange
      const metrics = {
        generationDuration: 15 * 60 * 1000, // 15 minutes
        executionDuration: 10000,
        coverageDuration: 3000,
        totalDuration: 15 * 60 * 1000 + 13000,
        bottlenecks: ['Test generation: 900000ms'],
      };

      // Act
      executor['logPerformanceMetrics'](metrics);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Performance bottlenecks detected',
        expect.objectContaining({
          bottlenecks: ['Test generation: 900000ms'],
        })
      );
    });

    it('should log warning when approaching timeout', () => {
      // Arrange
      const metrics = {
        generationDuration: 10 * 60 * 1000,
        executionDuration: 10 * 60 * 1000,
        coverageDuration: 6 * 60 * 1000,
        totalDuration: 26 * 60 * 1000, // 26 minutes (approaching 30 min timeout)
        bottlenecks: [],
      };

      // Act
      executor['logPerformanceMetrics'](metrics);

      // Assert
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Test pipeline approaching 30-minute timeout',
        expect.objectContaining({
          duration: 26 * 60 * 1000,
        })
      );
    });
  });
});
