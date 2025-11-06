/**
 * Test Utilities and Mocks
 *
 * Common test utilities, mocks, and helpers for Epic 1 components.
 * These helpers promote consistency across tests and reduce boilerplate.
 */

import { vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Mock file system operations for unit tests
 *
 * Usage:
 * ```typescript
 * const mockFs = mockFileSystem();
 * mockFs.readFile.mockResolvedValue('file content');
 * ```
 */
export const mockFileSystem = () => {
  return {
    readFile: vi.fn<any, any>(),
    writeFile: vi.fn<any, any>(),
    access: vi.fn<any, any>(),
    mkdir: vi.fn<any, any>(),
    rm: vi.fn<any, any>(),
    readdir: vi.fn<any, any>(),
    stat: vi.fn<any, any>(),
    exists: vi.fn<any, any>(),
  };
};

/**
 * Mock LLM API response
 *
 * Creates a mock response object matching the Anthropic/OpenAI API format.
 *
 * @param content - The text content of the response
 * @param model - The model identifier (default: claude-sonnet-4)
 * @returns Mock LLM response object
 *
 * Usage:
 * ```typescript
 * const response = mockLLMResponse('Hello, world!');
 * mockLLMClient.messages.create.mockResolvedValue(response);
 * ```
 */
export const mockLLMResponse = (
  content: string,
  model: string = 'claude-sonnet-4'
) => {
  return {
    id: `msg-test-${Date.now()}`,
    type: 'message' as const,
    role: 'assistant' as const,
    content: [
      {
        type: 'text' as const,
        text: content,
      },
    ],
    model,
    stop_reason: 'end_turn' as const,
    stop_sequence: null,
    usage: {
      input_tokens: Math.floor(content.length / 4), // Rough approximation
      output_tokens: Math.floor(content.length / 4),
    },
  };
};

/**
 * Mock git operations for WorktreeManager tests
 *
 * Usage:
 * ```typescript
 * const mockGit = mockGitOperations();
 * mockGit.status.mockResolvedValue({ current: 'main', ... });
 * ```
 */
export const mockGitOperations = () => {
  return {
    status: vi.fn<any, any>(),
    branch: vi.fn<any, any>(),
    checkout: vi.fn<any, any>(),
    raw: vi.fn<any, any>(),
    pull: vi.fn<any, any>(),
    push: vi.fn<any, any>(),
    add: vi.fn<any, any>(),
    commit: vi.fn<any, any>(),
    log: vi.fn<any, any>(),
  };
};

/**
 * Load a test fixture file
 *
 * @param fixturePath - Relative path to fixture (e.g., 'workflows/sample-workflow.yaml')
 * @returns File contents as string
 *
 * Usage:
 * ```typescript
 * const workflow = await loadFixture('workflows/sample-workflow.yaml');
 * ```
 */
export const loadFixture = async (fixturePath: string): Promise<string> => {
  const fullPath = path.join(
    process.cwd(),
    'tests',
    'fixtures',
    fixturePath
  );

  try {
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load fixture: ${fixturePath}. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Load and parse a JSON fixture
 *
 * @param fixturePath - Relative path to JSON fixture
 * @returns Parsed JSON object
 */
export const loadJSONFixture = async <T = any>(
  fixturePath: string
): Promise<T> => {
  const content = await loadFixture(fixturePath);
  return JSON.parse(content);
};

/**
 * Create a temporary test directory
 *
 * @param prefix - Optional prefix for directory name
 * @returns Object with path and cleanup function
 *
 * Usage:
 * ```typescript
 * const { path, cleanup } = await createTestDir('my-test');
 * try {
 *   // Use path for test operations
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
export const createTestDir = async (
  prefix: string = 'test'
): Promise<{ path: string; cleanup: () => Promise<void> }> => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const dirName = `temp-test-${prefix}-${timestamp}-${random}`;
  const dirPath = path.join(process.cwd(), dirName);

  await fs.mkdir(dirPath, { recursive: true });

  const cleanup = async () => {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup test directory ${dirPath}:`, error);
    }
  };

  return { path: dirPath, cleanup };
};

/**
 * Wait for a condition to be true (useful for async operations)
 *
 * @param condition - Function that returns true when condition is met
 * @param timeout - Maximum time to wait in ms (default: 5000)
 * @param interval - Check interval in ms (default: 100)
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

/**
 * Mock environment variables for a test
 *
 * @param envVars - Object with environment variables to set
 * @returns Cleanup function to restore original environment
 *
 * Usage:
 * ```typescript
 * const cleanup = mockEnv({ API_KEY: 'test-key' });
 * try {
 *   // Test code
 * } finally {
 *   cleanup();
 * }
 * ```
 */
export const mockEnv = (envVars: Record<string, string>): (() => void) => {
  const originalEnv: Record<string, string | undefined> = {};

  // Save original values and set new ones
  for (const [key, value] of Object.entries(envVars)) {
    originalEnv[key] = process.env[key];
    process.env[key] = value;
  }

  // Return cleanup function
  return () => {
    for (const [key, originalValue] of Object.entries(originalEnv)) {
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  };
};

/**
 * Create a mock logger for testing
 */
export const mockLogger = () => {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  };
};

/**
 * Spy on console methods (useful for testing error output)
 *
 * Usage:
 * ```typescript
 * const { console: mockConsole, restore } = spyOnConsole();
 * // Run test
 * expect(mockConsole.error).toHaveBeenCalledWith('error message');
 * restore();
 * ```
 */
export const spyOnConsole = () => {
  const _originalConsole = { ...console };
  const mockConsole = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  };

  return {
    console: mockConsole,
    restore: () => {
      mockConsole.log.mockRestore();
      mockConsole.error.mockRestore();
      mockConsole.warn.mockRestore();
      mockConsole.info.mockRestore();
      mockConsole.debug.mockRestore();
    },
  };
};
