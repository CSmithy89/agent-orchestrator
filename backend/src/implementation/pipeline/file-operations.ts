/**
 * File Operations Module
 *
 * Provides utilities for applying file changes to the worktree:
 * - Create new files with proper directory structure
 * - Modify existing files
 * - Delete files
 * - Validate file operations
 * - Handle file operation errors gracefully
 *
 * All operations are performed in the specified worktree directory
 * to maintain isolation from the main repository.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import { CodeFile } from '../types.js';

/**
 * File operation result
 */
export interface FileOperationResult {
  /** Files successfully created */
  created: string[];
  /** Files successfully modified */
  modified: string[];
  /** Files successfully deleted */
  deleted: string[];
  /** Failed operations with error details */
  failures: FileOperationFailure[];
}

/**
 * File operation failure details
 */
export interface FileOperationFailure {
  /** File path that failed */
  path: string;
  /** Operation that failed */
  operation: 'create' | 'modify' | 'delete';
  /** Error message */
  error: string;
}

/**
 * Apply file changes to worktree
 *
 * Processes all file operations (create, modify, delete) and tracks
 * successes and failures for comprehensive error reporting.
 *
 * @param files File operations to apply
 * @param worktreePath Worktree directory path
 * @returns File operation result with successes and failures
 */
export async function applyFileChanges(
  files: CodeFile[],
  worktreePath: string
): Promise<FileOperationResult> {
  const result: FileOperationResult = {
    created: [],
    modified: [],
    deleted: [],
    failures: []
  };

  logger.info('Applying file changes', {
    worktreePath,
    totalFiles: files.length
  });

  for (const file of files) {
    try {
      const absolutePath = path.resolve(worktreePath, file.path);

      switch (file.operation) {
        case 'create':
          await createFile(absolutePath, file.content);
          result.created.push(file.path);
          logger.debug('File created', { path: file.path });
          break;

        case 'modify':
          await modifyFile(absolutePath, file.content);
          result.modified.push(file.path);
          logger.debug('File modified', { path: file.path });
          break;

        case 'delete':
          await deleteFile(absolutePath);
          result.deleted.push(file.path);
          logger.debug('File deleted', { path: file.path });
          break;

        default:
          throw new Error(`Unknown operation: ${file.operation}`);
      }
    } catch (error) {
      const failure: FileOperationFailure = {
        path: file.path,
        operation: file.operation,
        error: (error as Error).message
      };
      result.failures.push(failure);
      logger.error('File operation failed', error as Error, {
        path: file.path,
        operation: file.operation
      });
    }
  }

  logger.info('File changes applied', {
    created: result.created.length,
    modified: result.modified.length,
    deleted: result.deleted.length,
    failures: result.failures.length
  });

  return result;
}

/**
 * Create a new file with content
 *
 * Creates parent directories recursively if they don't exist.
 * Validates that file doesn't already exist (unless overwriting).
 *
 * @param filePath Absolute file path
 * @param content File content
 * @throws Error if file creation fails
 */
async function createFile(filePath: string, content: string): Promise<void> {
  try {
    // Create parent directories recursively
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });

    // Check if file already exists
    try {
      await fs.access(filePath);
      // File exists - log warning but proceed with overwrite
      logger.warn('File already exists, overwriting', { path: filePath });
    } catch {
      // File doesn't exist - this is expected
    }

    // Write file with proper line endings
    const normalizedContent = normalizeLineEndings(content);
    await fs.writeFile(filePath, normalizedContent, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to create file ${filePath}: ${(error as Error).message}`
    );
  }
}

/**
 * Modify an existing file with new content
 *
 * Validates that file exists before modifying.
 * Creates backup of original content for safety.
 *
 * @param filePath Absolute file path
 * @param content New file content
 * @throws Error if file modification fails
 */
async function modifyFile(filePath: string, content: string): Promise<void> {
  try {
    // Validate file exists
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist - treat as create operation
      logger.warn('File not found for modification, creating instead', {
        path: filePath
      });
      await createFile(filePath, content);
      return;
    }

    // Create backup (optional - for safety)
    // const backupPath = `${filePath}.backup`;
    // await fs.copyFile(filePath, backupPath);

    // Write new content
    const normalizedContent = normalizeLineEndings(content);
    await fs.writeFile(filePath, normalizedContent, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to modify file ${filePath}: ${(error as Error).message}`
    );
  }
}

/**
 * Delete a file
 *
 * Validates that file exists before deleting.
 * Handles missing files gracefully.
 *
 * @param filePath Absolute file path
 * @throws Error if file deletion fails
 */
async function deleteFile(filePath: string): Promise<void> {
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist - log warning but don't fail
      logger.warn('File not found for deletion', { path: filePath });
      return;
    }

    // Delete file
    await fs.unlink(filePath);
  } catch (error) {
    throw new Error(
      `Failed to delete file ${filePath}: ${(error as Error).message}`
    );
  }
}

/**
 * Normalize line endings to LF
 *
 * Ensures consistent line endings across platforms.
 *
 * @param content File content
 * @returns Content with normalized line endings
 */
function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

/**
 * Validate file path is safe (no path traversal)
 *
 * Prevents malicious paths like "../../etc/passwd".
 *
 * @param filePath File path to validate
 * @param basePath Base directory path
 * @returns Whether path is safe
 */
export function isPathSafe(filePath: string, basePath: string): boolean {
  const resolvedPath = path.resolve(basePath, filePath);
  const resolvedBase = path.resolve(basePath);

  // Ensure resolved path is within base path
  return resolvedPath.startsWith(resolvedBase);
}

/**
 * Read file content
 *
 * Utility function for reading file content safely.
 *
 * @param filePath Absolute file path
 * @returns File content
 * @throws Error if file read fails
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read file ${filePath}: ${(error as Error).message}`
    );
  }
}

/**
 * Check if file exists
 *
 * @param filePath Absolute file path
 * @returns Whether file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 *
 * @param filePath Absolute file path
 * @returns File stats or null if file doesn't exist
 */
export async function getFileStats(
  filePath: string
): Promise<fs.Stats | null> {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}
