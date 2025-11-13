/**
 * Unit Tests for Validators
 *
 * Tests all validation functions with various code patterns.
 */

import { describe, it, expect } from 'vitest';
import {
  validateArchitectureCompliance,
  validateCodingStandards,
  validateErrorHandling,
  validateSecurityPractices
} from '../../../../src/implementation/pipeline/validators.js';
import { CodeImplementation, StoryContext } from '../../../../src/implementation/types.js';

describe('Validators', () => {
  const mockStoryContext: StoryContext = {
    story: {
      id: 'test-story',
      title: 'Test Story',
      description: 'Test description',
      acceptanceCriteria: ['AC1'],
      technicalNotes: {},
      dependencies: []
    },
    prdContext: 'PRD context',
    architectureContext: 'Architecture with microkernel pattern',
    onboardingDocs: 'Onboarding docs',
    existingCode: [],
    totalTokens: 1000
  };

  describe('validateArchitectureCompliance', () => {
    it('should pass for code with dependency injection', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              export class TestClass {
                constructor(private readonly dep: Dependency) {}
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateArchitectureCompliance(implementation, mockStoryContext);

      // Assert
      expect(result.passed).toBe(true);
      expect(result.category).toBe('Architecture Compliance');
    });

    it('should fail for imports without .js extension', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              import { Test } from './test';
              export class TestClass {}
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateArchitectureCompliance(implementation, mockStoryContext);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues).toContain(
        expect.stringContaining('Missing .js extensions')
      );
    });

    it('should pass for imports with .js extension', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              import { Test } from './test.js';
              export class TestClass {
                constructor(private readonly dep: Test) {}
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateArchitectureCompliance(implementation, mockStoryContext);

      // Assert
      expect(result.passed).toBe(true);
    });

    it('should warn if no exports detected', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              class TestClass {}
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateArchitectureCompliance(implementation, mockStoryContext);

      // Assert
      expect(result.warnings).toContain(
        expect.stringContaining('No exports detected')
      );
    });
  });

  describe('validateCodingStandards', () => {
    it('should pass for well-formatted code', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test-class.ts',
            content: `
              /**
               * Test class
               */
              export class TestClass {
                public async method(): Promise<void> {
                  try {
                    logger.info('Test');
                  } catch (error) {
                    logger.error('Error', error as Error);
                  }
                }
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateCodingStandards(implementation, mockStoryContext);

      // Assert
      expect(result.passed).toBe(true);
    });

    it('should warn for file not in kebab-case', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'TestClass.ts',
            content: 'export class TestClass {}',
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateCodingStandards(implementation, mockStoryContext);

      // Assert
      expect(result.warnings.some(w => w.includes('kebab-case'))).toBe(true);
    });

    it('should warn for multiple any types', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              function test(a: any, b: any, c: any) {}
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateCodingStandards(implementation, mockStoryContext);

      // Assert
      expect(result.warnings.some(w => w.includes("'any' types"))).toBe(true);
    });

    it('should warn for public APIs without JSDoc', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              export class TestClass {
                public method() {}
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateCodingStandards(implementation, mockStoryContext);

      // Assert
      expect(result.warnings.some(w => w.includes('JSDoc'))).toBe(true);
    });

    it('should warn for console.log usage', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              function test() {
                console.log('Debug message');
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateCodingStandards(implementation, mockStoryContext);

      // Assert
      expect(result.warnings.some(w => w.includes('console.log'))).toBe(true);
    });
  });

  describe('validateErrorHandling', () => {
    it('should pass for code with proper error handling', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              export async function test(): Promise<void> {
                try {
                  await operation();
                } catch (error) {
                  logger.error('Operation failed', error as Error);
                  throw new Error('Descriptive message');
                }
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateErrorHandling(implementation);

      // Assert
      expect(result.passed).toBe(true);
    });

    it('should fail for empty catch blocks', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              try {
                operation();
              } catch (error) {}
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateErrorHandling(implementation);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('empty catch blocks'))).toBe(true);
    });

    it('should warn for async functions without try-catch', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              export async function test(): Promise<void> {
                await operation();
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateErrorHandling(implementation);

      // Assert
      expect(result.warnings.some(w => w.includes('try-catch'))).toBe(true);
    });

    it('should warn for catch blocks without logging', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              try {
                operation();
              } catch (error) {
                throw error;
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateErrorHandling(implementation);

      // Assert
      expect(result.warnings.some(w => w.includes('error logging'))).toBe(true);
    });

    it('should warn for error thrown without message', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              throw new Error("");
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateErrorHandling(implementation);

      // Assert
      expect(result.warnings.some(w => w.includes('descriptive message'))).toBe(true);
    });
  });

  describe('validateSecurityPractices', () => {
    it('should pass for secure code', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              const apiKey = process.env.API_KEY;
              if (!input) {
                throw new Error('Invalid input');
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.passed).toBe(true);
    });

    it('should fail for hardcoded API keys', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              const apiKey = "sk_" + "live_" + "1234567890abcdefghijklmnopqrstuvwxyz";
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('hardcoded secrets'))).toBe(true);
    });

    it('should fail for hardcoded passwords', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              const password = "mySecretPassword123";
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('hardcoded secrets'))).toBe(true);
    });

    it('should fail for SQL injection vulnerability', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              const query = "SELECT * FROM users WHERE id = " + userId;
              db.execute(query);
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('SQL injection'))).toBe(true);
    });

    it('should warn for innerHTML usage', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              element.innerHTML = userInput;
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.warnings.some(w => w.includes('innerHTML'))).toBe(true);
    });

    it('should fail for logging sensitive data', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              logger.info('User logged in', { password: user.password });
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('sensitive data'))).toBe(true);
    });

    it('should fail for eval usage', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              eval(userInput);
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.passed).toBe(false);
      expect(result.issues.some(i => i.includes('eval'))).toBe(true);
    });

    it('should warn for ReDoS vulnerable regex', async () => {
      // Arrange
      const implementation: CodeImplementation = {
        files: [
          {
            path: 'test.ts',
            content: `
              const pattern = /(.*)*$/;
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Test commit',
        implementationNotes: 'Notes',
        acceptanceCriteriaMapping: []
      };

      // Act
      const result = await validateSecurityPractices(implementation);

      // Assert
      expect(result.warnings.some(w => w.includes('ReDoS'))).toBe(true);
    });
  });
});
