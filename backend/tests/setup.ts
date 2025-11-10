/**
 * Global Test Setup
 *
 * This file is executed before all tests run (configured in vitest.config.ts).
 * Used for:
 * - Global mocks and stubs
 * - Environment variable setup
 * - Test framework configuration
 * - Cleanup utilities
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config as loadDotenv } from 'dotenv';

// Load environment variables from .env file (for API keys in integration tests)
loadDotenv({ path: path.join(process.cwd(), '.env') });

// Global test timeout for long-running integration tests
const INTEGRATION_TEST_TIMEOUT = 30000;

/**
 * Setup test environment variables
 */
beforeAll(() => {
  // Ensure we're in test mode
  process.env.NODE_ENV = 'test';

  // Disable color output in CI for cleaner logs
  if (process.env.CI) {
    process.env.FORCE_COLOR = '0';
  }

  // Set test-specific configuration paths
  process.env.CONFIG_DIR = path.join(process.cwd(), 'tests', 'fixtures', 'configs');
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  // Clean up any temporary test files/directories
  const tempDirs = await findTempTestDirs();
  await Promise.all(tempDirs.map(dir => cleanupTempDir(dir)));
});

/**
 * Reset mocks after each test to prevent test pollution
 */
afterEach(() => {
  // Vitest automatically clears mocks when using vi.fn()
  // This is a placeholder for any custom cleanup needed
});

/**
 * Find temporary test directories created during test runs
 */
async function findTempTestDirs(): Promise<string[]> {
  try {
    const cwd = process.cwd();
    const entries = await fs.readdir(cwd);
    const tempDirs = entries.filter(entry => entry.startsWith('temp-test-'));
    return tempDirs.map(dir => path.join(cwd, dir));
  } catch (error) {
    // If directory doesn't exist or can't be read, return empty array
    return [];
  }
}

/**
 * Clean up a temporary directory
 */
async function cleanupTempDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors - test directory may not exist or already cleaned
    console.warn(`Failed to cleanup ${dirPath}:`, error);
  }
}

/**
 * Export timeout constants for use in tests
 */
export const TEST_TIMEOUTS = {
  UNIT: 5000,
  INTEGRATION: INTEGRATION_TEST_TIMEOUT,
  E2E: 60000,
};

/**
 * Mock console methods to reduce noise in test output
 * Uncomment if needed to suppress console output during tests
 */
// global.console = {
//   ...console,
//   log: vi.fn(),
//   debug: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   error: vi.fn(),
// };
