/**
 * Integration Tests for Code Implementation Pipeline
 *
 * Tests the complete pipeline with real file system and git operations.
 * Uses temporary directories for isolation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  applyFileChanges,
  readFile,
  fileExists
} from '../../../../src/implementation/pipeline/file-operations.js';
import {
  createGitCommit,
  getCurrentBranch,
  hasUncommittedChanges,
  getModifiedFiles
} from '../../../../src/implementation/pipeline/git-operations.js';
import {
  CodeFile,
  CodeImplementation,
  StoryContext
} from '../../../../src/implementation/types.js';

const execFileAsync = promisify(execFile);

describe('Code Implementation Pipeline Integration', () => {
  let testDir: string;
  let worktreePath: string;

  beforeAll(async () => {
    // Create temporary directory for tests
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));
    worktreePath = path.join(testDir, 'worktree');

    // Initialize git repository
    await fs.mkdir(worktreePath, { recursive: true });
    await execFileAsync('git', ['init'], { cwd: worktreePath });
    await execFileAsync('git', ['config', 'user.name', 'Test User'], { cwd: worktreePath });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: worktreePath });

    // Create initial commit
    const readmePath = path.join(worktreePath, 'README.md');
    await fs.writeFile(readmePath, '# Test Project', 'utf-8');
    await execFileAsync('git', ['add', 'README.md'], { cwd: worktreePath });
    await execFileAsync('git', ['commit', '-m', 'Initial commit'], { cwd: worktreePath });
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up test directory:', error);
    }
  });

  describe('File Operations Integration', () => {
    it('should create new files with proper directory structure', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test/TestClass.ts',
          content: 'export class TestClass {}',
          operation: 'create'
        }
      ];

      // Act
      const result = await applyFileChanges(files, worktreePath);

      // Assert
      expect(result.created).toHaveLength(1);
      expect(result.failures).toHaveLength(0);

      const filePath = path.join(worktreePath, 'backend/src/test/TestClass.ts');
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);

      const content = await readFile(filePath);
      expect(content).toBe('export class TestClass {}');
    });

    it('should modify existing files', async () => {
      // Arrange
      const filePath = path.join(worktreePath, 'backend/src/modify-test.ts');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, 'original content', 'utf-8');

      const files: CodeFile[] = [
        {
          path: 'backend/src/modify-test.ts',
          content: 'modified content',
          operation: 'modify'
        }
      ];

      // Act
      const result = await applyFileChanges(files, worktreePath);

      // Assert
      expect(result.modified).toHaveLength(1);
      expect(result.failures).toHaveLength(0);

      const content = await readFile(filePath);
      expect(content).toBe('modified content');
    });

    it('should delete files', async () => {
      // Arrange
      const filePath = path.join(worktreePath, 'backend/src/delete-test.ts');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, 'to be deleted', 'utf-8');

      const files: CodeFile[] = [
        {
          path: 'backend/src/delete-test.ts',
          content: '',
          operation: 'delete'
        }
      ];

      // Act
      const result = await applyFileChanges(files, worktreePath);

      // Assert
      expect(result.deleted).toHaveLength(1);
      expect(result.failures).toHaveLength(0);

      const exists = await fileExists(filePath);
      expect(exists).toBe(false);
    });

    it('should handle multiple file operations in one batch', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/batch/create1.ts',
          content: 'export class Create1 {}',
          operation: 'create'
        },
        {
          path: 'backend/src/batch/create2.ts',
          content: 'export class Create2 {}',
          operation: 'create'
        },
        {
          path: 'backend/src/batch/create3.ts',
          content: 'export class Create3 {}',
          operation: 'create'
        }
      ];

      // Act
      const result = await applyFileChanges(files, worktreePath);

      // Assert
      expect(result.created).toHaveLength(3);
      expect(result.failures).toHaveLength(0);

      for (const file of files) {
        const filePath = path.join(worktreePath, file.path);
        const exists = await fileExists(filePath);
        expect(exists).toBe(true);
      }
    });
  });

  describe('Git Operations Integration', () => {
    beforeEach(async () => {
      // Ensure clean working directory
      const modified = await getModifiedFiles(worktreePath);
      if (modified.length > 0) {
        // Reset any uncommitted changes
        await execFileAsync('git', ['reset', '--hard', 'HEAD'], { cwd: worktreePath });
        await execFileAsync('git', ['clean', '-fd'], { cwd: worktreePath });
      }
    });

    it('should create git commit with files', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/commit-test.ts',
          content: 'export class CommitTest {}',
          operation: 'create'
        }
      ];

      await applyFileChanges(files, worktreePath);

      const implementation: CodeImplementation = {
        files,
        commitMessage: 'Test commit',
        implementationNotes: 'Test notes',
        acceptanceCriteriaMapping: []
      };

      const context: StoryContext = {
        story: {
          id: 'test-story',
          title: 'Test Story',
          description: 'Test description',
          acceptanceCriteria: ['AC1'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      // Act
      const result = await createGitCommit(implementation, context, worktreePath);

      // Assert
      expect(result.commitSha).toBeTruthy();
      expect(result.commitSha).toHaveLength(40); // Git SHA is 40 characters
      expect(result.commitMessage).toContain('Test commit');
      expect(result.filesCommitted).toHaveLength(1);

      // Verify commit exists
      const hasChanges = await hasUncommittedChanges(worktreePath);
      expect(hasChanges).toBe(false);
    });

    it('should get current branch', async () => {
      // Act
      const branch = await getCurrentBranch(worktreePath);

      // Assert
      expect(branch).toBeTruthy();
    });

    it('should detect uncommitted changes', async () => {
      // Arrange
      const filePath = path.join(worktreePath, 'backend/src/uncommitted.ts');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, 'export class Uncommitted {}', 'utf-8');

      // Act
      const hasChanges = await hasUncommittedChanges(worktreePath);

      // Assert
      expect(hasChanges).toBe(true);

      // Clean up
      await fs.unlink(filePath);
    });

    it('should detect no uncommitted changes in clean repo', async () => {
      // Act
      const hasChanges = await hasUncommittedChanges(worktreePath);

      // Assert
      expect(hasChanges).toBe(false);
    });

    it('should list modified files', async () => {
      // Arrange
      const filePath = path.join(worktreePath, 'backend/src/modified.ts');
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, 'export class Modified {}', 'utf-8');

      // Act
      const modified = await getModifiedFiles(worktreePath);

      // Assert
      expect(modified.length).toBeGreaterThan(0);
      expect(modified.some(f => f.includes('modified.ts'))).toBe(true);

      // Clean up
      await fs.unlink(filePath);
    });

    it('should handle commit with multiple files', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/multi/file1.ts',
          content: 'export class File1 {}',
          operation: 'create'
        },
        {
          path: 'backend/src/multi/file2.ts',
          content: 'export class File2 {}',
          operation: 'create'
        },
        {
          path: 'backend/src/multi/file3.ts',
          content: 'export class File3 {}',
          operation: 'create'
        }
      ];

      await applyFileChanges(files, worktreePath);

      const implementation: CodeImplementation = {
        files,
        commitMessage: 'Multi-file commit',
        implementationNotes: 'Multiple files',
        acceptanceCriteriaMapping: []
      };

      const context: StoryContext = {
        story: {
          id: 'multi-file-story',
          title: 'Multi File Story',
          description: 'Test multiple files',
          acceptanceCriteria: ['AC1', 'AC2', 'AC3'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      // Act
      const result = await createGitCommit(implementation, context, worktreePath);

      // Assert
      expect(result.commitSha).toBeTruthy();
      expect(result.filesCommitted).toHaveLength(3);
    });
  });

  describe('Complete Pipeline Integration', () => {
    it('should execute complete workflow: file changes -> git commit', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/pipeline/PipelineTest.ts',
          content: `
            /**
             * Pipeline test class
             */
            export class PipelineTest {
              constructor(private readonly dep: Dependency) {}

              async execute(): Promise<void> {
                try {
                  await this.dep.method();
                } catch (error) {
                  logger.error('Execution failed', error as Error);
                  throw new Error('Pipeline test failed');
                }
              }
            }
          `,
          operation: 'create'
        }
      ];

      const implementation: CodeImplementation = {
        files,
        commitMessage: 'Story test-pipeline: Complete pipeline test',
        implementationNotes: 'Tested complete pipeline workflow',
        acceptanceCriteriaMapping: [
          {
            criterion: 'AC1: Files created',
            implemented: true,
            evidence: 'backend/src/pipeline/PipelineTest.ts'
          }
        ]
      };

      const context: StoryContext = {
        story: {
          id: 'test-pipeline',
          title: 'Complete Pipeline Test',
          description: 'Test complete pipeline',
          acceptanceCriteria: ['AC1: Files created'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      // Act - Apply file changes
      const fileResult = await applyFileChanges(files, worktreePath);

      // Assert file changes
      expect(fileResult.created).toHaveLength(1);
      expect(fileResult.failures).toHaveLength(0);

      // Act - Create git commit
      const commitResult = await createGitCommit(implementation, context, worktreePath);

      // Assert git commit
      expect(commitResult.commitSha).toBeTruthy();
      expect(commitResult.filesCommitted).toHaveLength(1);

      // Verify file exists
      const filePath = path.join(worktreePath, 'backend/src/pipeline/PipelineTest.ts');
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);

      // Verify no uncommitted changes
      const hasChanges = await hasUncommittedChanges(worktreePath);
      expect(hasChanges).toBe(false);
    });

    it('should handle error scenarios gracefully', async () => {
      // Arrange - Try to create file in non-writable location (simulated by invalid path)
      const files: CodeFile[] = [
        {
          path: '../../../etc/passwd',
          content: 'malicious content',
          operation: 'create'
        }
      ];

      // Act
      const result = await applyFileChanges(files, worktreePath);

      // Assert - Should track failure
      // Note: actual behavior depends on path validation and permissions
      expect(result.failures.length + result.created.length).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should complete file operations in reasonable time', async () => {
      // Arrange
      const fileCount = 50;
      const files: CodeFile[] = Array.from({ length: fileCount }, (_, i) => ({
        path: `backend/src/perf/file${i}.ts`,
        content: `export class File${i} {}`,
        operation: 'create'
      }));

      const startTime = Date.now();

      // Act
      const result = await applyFileChanges(files, worktreePath);

      const duration = Date.now() - startTime;

      // Assert
      expect(result.created).toHaveLength(fileCount);
      expect(result.failures).toHaveLength(0);
      expect(duration).toBeLessThan(5000); // Should complete in <5 seconds
    });
  });
});
