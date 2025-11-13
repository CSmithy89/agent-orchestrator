/**
 * Unit Tests for File Operations
 *
 * Tests file create, modify, delete operations with mocked file system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs/promises';
import {
  applyFileChanges,
  isPathSafe,
  readFile,
  fileExists,
  getFileStats
} from '../../../../src/implementation/pipeline/file-operations.js';
import { CodeFile } from '../../../../src/implementation/types.js';

// Mock fs/promises
vi.mock('fs/promises');

describe('File Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('applyFileChanges', () => {
    it('should create new files successfully', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test.ts',
          content: 'export class Test {}',
          operation: 'create'
        }
      ];

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.access as any).mockRejectedValue(new Error('File not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.created).toHaveLength(1);
      expect(result.created[0]).toBe('backend/src/test.ts');
      expect(result.failures).toHaveLength(0);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should modify existing files successfully', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test.ts',
          content: 'export class Test {}',
          operation: 'modify'
        }
      ];

      (fs.access as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.modified).toHaveLength(1);
      expect(result.modified[0]).toBe('backend/src/test.ts');
      expect(result.failures).toHaveLength(0);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should delete files successfully', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test.ts',
          content: '',
          operation: 'delete'
        }
      ];

      (fs.access as any).mockResolvedValue(undefined);
      (fs.unlink as any).mockResolvedValue(undefined);

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.deleted).toHaveLength(1);
      expect(result.deleted[0]).toBe('backend/src/test.ts');
      expect(result.failures).toHaveLength(0);
      expect(fs.unlink).toHaveBeenCalled();
    });

    it('should handle multiple file operations', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/create.ts',
          content: 'export class Create {}',
          operation: 'create'
        },
        {
          path: 'backend/src/modify.ts',
          content: 'export class Modify {}',
          operation: 'modify'
        },
        {
          path: 'backend/src/delete.ts',
          content: '',
          operation: 'delete'
        }
      ];

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.access as any).mockImplementation((path: string) => {
        if (path.includes('create.ts')) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve(undefined);
      });
      (fs.writeFile as any).mockResolvedValue(undefined);
      (fs.unlink as any).mockResolvedValue(undefined);

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.created).toHaveLength(1);
      expect(result.modified).toHaveLength(1);
      expect(result.deleted).toHaveLength(1);
      expect(result.failures).toHaveLength(0);
    });

    it('should track failures on file operation errors', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test.ts',
          content: 'export class Test {}',
          operation: 'create'
        }
      ];

      (fs.mkdir as any).mockRejectedValue(new Error('Permission denied'));

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.created).toHaveLength(0);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].path).toBe('backend/src/test.ts');
      expect(result.failures[0].operation).toBe('create');
      expect(result.failures[0].error).toContain('Permission denied');
    });

    it('should normalize line endings', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'test.ts',
          content: 'line1\r\nline2\r\nline3',
          operation: 'create'
        }
      ];

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.access as any).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      // Act
      await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        'line1\nline2\nline3',
        'utf-8'
      );
    });

    it('should create parent directories recursively', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/deep/nested/file.ts',
          content: 'export class Test {}',
          operation: 'create'
        }
      ];

      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.access as any).mockRejectedValue(new Error('Not found'));
      (fs.writeFile as any).mockResolvedValue(undefined);

      // Act
      await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('deep/nested'),
        { recursive: true }
      );
    });

    it('should handle modify operation on non-existent file', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test.ts',
          content: 'export class Test {}',
          operation: 'modify'
        }
      ];

      (fs.access as any).mockRejectedValue(new Error('Not found'));
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.modified).toHaveLength(1);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle delete operation on non-existent file', async () => {
      // Arrange
      const files: CodeFile[] = [
        {
          path: 'backend/src/test.ts',
          content: '',
          operation: 'delete'
        }
      ];

      (fs.access as any).mockRejectedValue(new Error('Not found'));

      // Act
      const result = await applyFileChanges(files, '/test/worktree');

      // Assert
      expect(result.deleted).toHaveLength(1);
      expect(result.failures).toHaveLength(0);
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('isPathSafe', () => {
    it('should return true for safe paths', () => {
      // Arrange
      const basePath = '/test/project';
      const filePath = 'backend/src/test.ts';

      // Act
      const result = isPathSafe(filePath, basePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for path traversal attempts', () => {
      // Arrange
      const basePath = '/test/project';
      const filePath = '../../../etc/passwd';

      // Act
      const result = isPathSafe(filePath, basePath);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for absolute paths outside base', () => {
      // Arrange
      const basePath = '/test/project';
      const filePath = '/etc/passwd';

      // Act
      const result = isPathSafe(filePath, basePath);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for nested safe paths', () => {
      // Arrange
      const basePath = '/test/project';
      const filePath = 'backend/src/deep/nested/file.ts';

      // Act
      const result = isPathSafe(filePath, basePath);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content successfully', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const content = 'export class Test {}';
      (fs.readFile as any).mockResolvedValue(content);

      // Act
      const result = await readFile(filePath);

      // Assert
      expect(result).toBe(content);
      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should throw error on read failure', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      (fs.readFile as any).mockRejectedValue(new Error('Permission denied'));

      // Act & Assert
      await expect(readFile(filePath)).rejects.toThrow(
        /Failed to read file/
      );
    });
  });

  describe('fileExists', () => {
    it('should return true for existing files', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      (fs.access as any).mockResolvedValue(undefined);

      // Act
      const result = await fileExists(filePath);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      (fs.access as any).mockRejectedValue(new Error('Not found'));

      // Act
      const result = await fileExists(filePath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should return file stats for existing files', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      const stats = { size: 1024, isFile: () => true } as any;
      (fs.stat as any).mockResolvedValue(stats);

      // Act
      const result = await getFileStats(filePath);

      // Assert
      expect(result).toBe(stats);
    });

    it('should return null for non-existent files', async () => {
      // Arrange
      const filePath = '/test/file.ts';
      (fs.stat as any).mockRejectedValue(new Error('Not found'));

      // Act
      const result = await getFileStats(filePath);

      // Assert
      expect(result).toBeNull();
    });
  });
});
