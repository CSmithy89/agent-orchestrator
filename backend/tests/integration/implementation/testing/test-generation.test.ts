/**
 * Integration tests for Test Generation Pipeline
 *
 * Tests complete test generation and execution flow with:
 * - Real Vitest test framework
 * - Real file system operations
 * - Mock Amelia agent with realistic responses
 * - Happy path and error scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestGenerationExecutor } from '../../../../src/implementation/testing/TestGenerationExecutor.js';
import { AmeliaAgent, CodeImplementation, StoryContext, TestSuite } from '../../../../src/implementation/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('TestGenerationExecutor - Integration Tests', () => {
  let executor: TestGenerationExecutor;
  let mockAmeliaAgent: AmeliaAgent;
  let testProjectRoot: string;

  // Create a temporary test project directory
  beforeEach(async () => {
    // Create temp directory
    testProjectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'test-gen-'));

    // Initialize git repository
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('git init', { cwd: testProjectRoot });
      await execAsync('git config user.name "Test User"', { cwd: testProjectRoot });
      await execAsync('git config user.email "test@example.com"', { cwd: testProjectRoot });
      // Disable commit signing for test environment
      await execAsync('git config commit.gpgsign false', { cwd: testProjectRoot });
      await execAsync('git config gpg.format ""', { cwd: testProjectRoot });
    } catch (error) {
      // Ignore git init errors in CI environments
    }

    // Create mock package.json with Vitest
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        test: 'echo "Tests passed"',
        'test:coverage': 'echo "Lines: 85%\\nFunctions: 90%\\nBranches: 80%\\nStatements: 85%"',
      },
      devDependencies: {
        vitest: '^1.0.0',
        '@vitest/coverage-v8': '^1.0.0',
      },
    };

    await fs.writeFile(
      path.join(testProjectRoot, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create mock coverage directory and file
    await fs.mkdir(path.join(testProjectRoot, 'coverage'), { recursive: true });
    const coverageJson = {
      'backend/src/example.ts': {
        lines: { pct: 85, covered: 17, total: 20 },
        functions: { pct: 90, covered: 9, total: 10 },
        branches: { pct: 80, covered: 16, total: 20 },
        statements: { pct: 85, covered: 17, total: 20 },
      },
      'src/example.ts': {
        lines: { pct: 85, covered: 17, total: 20 },
        functions: { pct: 90, covered: 9, total: 10 },
        branches: { pct: 80, covered: 16, total: 20 },
        statements: { pct: 85, covered: 17, total: 20 },
      },
      total: {
        lines: { pct: 85 },
        functions: { pct: 90 },
        branches: { pct: 80 },
        statements: { pct: 85 },
      },
    };
    await fs.writeFile(
      path.join(testProjectRoot, 'coverage', 'coverage-summary.json'),
      JSON.stringify(coverageJson, null, 2)
    );

    // Create mock Amelia agent that returns realistic test suite
    mockAmeliaAgent = {
      name: 'amelia',
      role: 'Developer',
      expertise: ['code-implementation', 'test-generation', 'debugging', 'refactoring', 'documentation'],
      llm: {
        model: 'gpt-4o',
        provider: 'openai',
        temperature: 0.4,
      },
      implementStory: async () => {
        throw new Error('Not implemented');
      },
      writeTests: async (implementation: CodeImplementation): Promise<TestSuite> => {
        // Generate realistic test files based on implementation
        const testFiles = implementation.files.map((file) => {
          const testPath = file.path.replace('src/', 'tests/unit/').replace('.ts', '.test.ts');
          const moduleName = path.basename(file.path, '.ts');

          return {
            path: testPath,
            content: `import { describe, it, expect } from 'vitest';
import { ${moduleName} } from '../../src/${moduleName}.js';

describe('${moduleName}', () => {
  it('should work correctly', () => {
    expect(${moduleName}).toBeDefined();
  });

  it('should handle edge cases', () => {
    expect(() => ${moduleName}()).not.toThrow();
  });
});
`,
          };
        });

        return {
          files: testFiles,
          framework: 'vitest',
          testCount: testFiles.length * 2,
          coverage: {
            lines: 85,
            functions: 90,
            branches: 80,
            statements: 85,
            uncoveredLines: [],
          },
          results: {
            passed: testFiles.length * 2,
            failed: 0,
            skipped: 0,
            duration: 1000,
          },
        };
      },
      reviewCode: async () => {
        throw new Error('Not implemented');
      },
      execute: async () => {
        throw new Error('Not implemented');
      },
    } as any;

    executor = new TestGenerationExecutor(mockAmeliaAgent, testProjectRoot);
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Happy Path', () => {
    it('should execute complete test generation pipeline', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'src/example.ts',
            content: 'export function example() { return "test"; }',
            operation: 'create',
          },
        ],
        commitMessage: 'Implement example',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [],
      };

      const context: StoryContext = {
        story: {
          id: '5-5-test-generation',
          title: 'Test Generation',
          description: 'Generate tests',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: [],
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000,
      };

      // Act
      const result = await executor.execute(implementation, context);

      // Assert
      expect(result).toBeDefined();
      expect(result.framework).toBe('vitest');
      expect(result.testCount).toBeGreaterThan(0);
      expect(result.coverage.lines).toBeGreaterThanOrEqual(80);

      // Verify test files were created
      const testFilePath = path.join(testProjectRoot, 'tests/unit/example.test.ts');
      const testFileExists = await fs
        .access(testFilePath)
        .then(() => true)
        .catch(() => false);
      expect(testFileExists).toBe(true);
    });

    it('should create test files with proper directory structure', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'src/deeply/nested/module.ts',
            content: 'export function module() { return "test"; }',
            operation: 'create',
          },
        ],
        commitMessage: 'Implement nested module',
        implementationNotes: 'Created nested module',
        acceptanceCriteriaMapping: [],
      };

      const context: StoryContext = {
        story: {
          id: '5-5-test-generation',
          title: 'Test Generation',
          description: 'Generate tests',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: [],
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000,
      };

      // Act
      const result = await executor.execute(implementation, context);

      // Assert
      expect(result.files.length).toBeGreaterThan(0);

      // Verify nested directory structure was created
      const testFilePath = path.join(testProjectRoot, 'tests/unit/deeply/nested/module.test.ts');
      const testFileExists = await fs
        .access(testFilePath)
        .then(() => true)
        .catch(() => false);
      expect(testFileExists).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle framework detection failure', async () => {
      // Arrange - Remove package.json
      await fs.unlink(path.join(testProjectRoot, 'package.json'));

      const implementation: CodeImplementation = {
        files: [
          {
            path: 'src/example.ts',
            content: 'export function example() { return "test"; }',
            operation: 'create',
          },
        ],
        commitMessage: 'Implement example',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [],
      };

      const context: StoryContext = {
        story: {
          id: '5-5-test-generation',
          title: 'Test Generation',
          description: 'Generate tests',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: [],
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000,
      };

      // Act & Assert
      await expect(executor.execute(implementation, context)).rejects.toThrow(
        'Test framework detection failed'
      );
    });

    it('should handle test generation failure from Amelia', async () => {
      // Arrange - Mock Amelia to throw error
      mockAmeliaAgent.writeTests = async () => {
        throw new Error('Amelia test generation failed');
      };

      const implementation: CodeImplementation = {
        files: [
          {
            path: 'src/example.ts',
            content: 'export function example() { return "test"; }',
            operation: 'create',
          },
        ],
        commitMessage: 'Implement example',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [],
      };

      const context: StoryContext = {
        story: {
          id: '5-5-test-generation',
          title: 'Test Generation',
          description: 'Generate tests',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: [],
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000,
      };

      // Act & Assert
      await expect(executor.execute(implementation, context)).rejects.toThrow(
        'Amelia test generation failed'
      );
    });
  });

  describe('Coverage Validation', () => {
    it('should validate coverage meets 80% threshold', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'src/example.ts',
            content: 'export function example() { return "test"; }',
            operation: 'create',
          },
        ],
        commitMessage: 'Implement example',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [],
      };

      const context: StoryContext = {
        story: {
          id: '5-5-test-generation',
          title: 'Test Generation',
          description: 'Generate tests',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: [],
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000,
      };

      // Act
      const result = await executor.execute(implementation, context);

      // Assert
      expect(result.coverage.lines).toBeGreaterThanOrEqual(80);
      expect(result.coverage.functions).toBeGreaterThanOrEqual(80);
      expect(result.coverage.branches).toBeGreaterThanOrEqual(80);
      expect(result.coverage.statements).toBeGreaterThanOrEqual(80);
    });

    it('should log warning for low coverage', async () => {
      // Arrange - Create low coverage report
      const lowCoverageJson = {
        total: {
          lines: { pct: 60 },
          functions: { pct: 65 },
          branches: { pct: 55 },
          statements: { pct: 60 },
        },
      };
      await fs.writeFile(
        path.join(testProjectRoot, 'coverage', 'coverage-summary.json'),
        JSON.stringify(lowCoverageJson, null, 2)
      );

      const implementation: CodeImplementation = {
        files: [
          {
            path: 'src/example.ts',
            content: 'export function example() { return "test"; }',
            operation: 'create',
          },
        ],
        commitMessage: 'Implement example',
        implementationNotes: 'Created example function',
        acceptanceCriteriaMapping: [],
      };

      const context: StoryContext = {
        story: {
          id: '5-5-test-generation',
          title: 'Test Generation',
          description: 'Generate tests',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: [],
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000,
      };

      // Act
      const result = await executor.execute(implementation, context);

      // Assert - Should still complete but with low coverage
      expect(result.coverage.lines).toBeLessThan(80);
    });
  });
});
