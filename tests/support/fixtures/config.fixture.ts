import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Test fixture for configuration file testing
 * 
 * Following ATDD fixture architecture patterns:
 * - Auto-cleanup (fixture removes temp files after test)
 * - Isolated (each test gets fresh temp directory)
 * - Type-safe return values
 * 
 * @see bmad/bmm/testarch/knowledge/fixture-architecture.md
 */

export interface ConfigFixture {
  dirPath: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates temporary directory for config file testing
 * 
 * Usage:
 * ```typescript
 * const { dirPath, cleanup } = await configFileFixture();
 * try {
 *   // Use dirPath for test
 * } finally {
 *   await cleanup();
 * }
 * ```
 * 
 * @returns Fixture with temp directory path and cleanup function
 */
export async function configFileFixture(): Promise<ConfigFixture> {
  // Create unique temp directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));

  // Return fixture with cleanup
  return {
    dirPath: tempDir,
    cleanup: async () => {
      // Auto-cleanup: Remove temp directory and all contents
      await fs.rm(tempDir, { recursive: true, force: true });
    },
  };
}

/**
 * Creates temp directory with pre-written config file
 * 
 * @param configContent - YAML content to write
 * @returns Fixture with config file path and cleanup
 */
export async function configFileWithContentFixture(
  configContent: string
): Promise<ConfigFixture & { configPath: string }> {
  const { dirPath, cleanup } = await configFileFixture();
  const configPath = path.join(dirPath, 'project-config.yaml');
  
  await fs.writeFile(configPath, configContent, 'utf-8');

  return {
    dirPath,
    configPath,
    cleanup,
  };
}
