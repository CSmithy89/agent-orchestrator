/**
 * Test utilities for workflow integration tests
 * Provides common helpers for setup, mocking, and assertions
 */

import { vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

/**
 * Create a temporary test directory
 */
export async function createTempTestDir(prefix: string = 'workflow-test'): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), `${prefix}-`));
  return tempDir;
}

/**
 * Clean up temporary test directory
 */
export async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup temp dir ${dirPath}:`, error);
  }
}

/**
 * Create a mock story file in a temp directory
 */
export async function createMockStoryFile(
  tempDir: string,
  storyId: string,
  content?: string
): Promise<string> {
  const storyPath = path.join(tempDir, `${storyId}.md`);
  const defaultContent = content || `# Story ${storyId}

---
id: ${storyId}
title: Test Story
status: drafted
---

## Story
As a developer, I want to test the workflow.

## Acceptance Criteria
- [ ] AC1: Feature implemented

## Tasks / Subtasks
- [ ] Task 1: Implement feature
`;

  await fs.writeFile(storyPath, defaultContent);
  return storyPath;
}

/**
 * Create mock sprint-status.yaml file
 */
export async function createMockSprintStatus(
  tempDir: string,
  storyId: string,
  status: string = 'ready-for-dev'
): Promise<string> {
  const statusPath = path.join(tempDir, 'sprint-status.yaml');
  const content = `
development_status:
  ${storyId}: ${status}
`;

  await fs.writeFile(statusPath, content);
  return statusPath;
}

/**
 * Mock Amelia agent with predefined responses
 */
export function mockAmeliaAgent(responses: {
  implementStory?: any;
  writeTests?: any;
  fixTests?: any;
  reviewCode?: any;
}) {
  return {
    name: 'amelia',
    role: 'Developer',
    implementStory: vi.fn().mockResolvedValue(responses.implementStory),
    writeTests: vi.fn().mockResolvedValue(responses.writeTests),
    fixTests: vi.fn().mockResolvedValue(responses.fixTests),
    reviewCode: vi.fn().mockResolvedValue(responses.reviewCode),
  };
}

/**
 * Mock Alex agent with predefined responses
 */
export function mockAlexAgent(responses: {
  reviewSecurity?: any;
  analyzeQuality?: any;
  validateTests?: any;
  generateReport?: any;
}) {
  return {
    name: 'alex',
    role: 'Code Reviewer',
    reviewSecurity: vi.fn().mockResolvedValue(responses.reviewSecurity),
    analyzeQuality: vi.fn().mockResolvedValue(responses.analyzeQuality),
    validateTests: vi.fn().mockResolvedValue(responses.validateTests),
    generateReport: vi.fn().mockResolvedValue(responses.generateReport),
  };
}

/**
 * Mock WorktreeManager
 */
export function mockWorktreeManager(tempDir: string) {
  const worktreePath = path.join(tempDir, 'worktrees', 'test-story');

  return {
    createWorktree: vi.fn().mockResolvedValue(worktreePath),
    removeWorktree: vi.fn().mockResolvedValue(undefined),
    listWorktrees: vi.fn().mockResolvedValue([worktreePath]),
    getWorktreePath: vi.fn().mockReturnValue(worktreePath),
  };
}

/**
 * Mock StateManager
 */
export function mockStateManager() {
  const state = new Map<string, any>();

  return {
    saveState: vi.fn().mockImplementation((key: string, value: any) => {
      state.set(key, value);
      return Promise.resolve();
    }),
    loadState: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(state.get(key));
    }),
    deleteState: vi.fn().mockImplementation((key: string) => {
      state.delete(key);
      return Promise.resolve();
    }),
    createCheckpoint: vi.fn().mockResolvedValue('checkpoint-123'),
    loadCheckpoint: vi.fn().mockResolvedValue({}),
  };
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Measure execution time of an async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;
  return { result, duration };
}

/**
 * Create a spy on console methods for testing logging
 */
export function spyOnConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log = vi.fn((...args: any[]) => {
    logs.push(args.join(' '));
  });

  console.error = vi.fn((...args: any[]) => {
    errors.push(args.join(' '));
  });

  console.warn = vi.fn((...args: any[]) => {
    warnings.push(args.join(' '));
  });

  return {
    logs,
    errors,
    warnings,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

/**
 * Assert that all items in an array match a predicate
 */
export function assertAll<T>(
  items: T[],
  predicate: (item: T) => boolean,
  message?: string
): void {
  const failures = items.filter(item => !predicate(item));
  if (failures.length > 0) {
    throw new Error(
      message || `Assertion failed for ${failures.length} items: ${JSON.stringify(failures)}`
    );
  }
}

/**
 * Create a mock file system for testing
 */
export class MockFileSystem {
  private files: Map<string, string> = new Map();

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    return content;
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async unlink(path: string): Promise<void> {
    this.files.delete(path);
  }

  getFiles(): string[] {
    return Array.from(this.files.keys());
  }

  clear(): void {
    this.files.clear();
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
