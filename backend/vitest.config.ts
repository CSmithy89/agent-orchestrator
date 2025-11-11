import { defineConfig } from 'vitest/config';
import path from 'path';
import os from 'os';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test setup
    globals: true,

    // Setup files for global configuration
    setupFiles: ['./tests/setup.ts'],

    // Test file patterns
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'coverage'],

    // Coverage configuration
    coverage: {
      provider: 'v8', // Using v8 (modern, faster than c8) - see Story 1.11 notes
      reporter: ['text', 'html', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ],
      // Target 80% coverage as per Epic 1 testing strategy
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      },
      // Per-file thresholds (60% minimum for flexibility)
      perFile: true,
    },

    // Parallel execution configuration (AC #4)
    // Use CPU cores for optimal parallel execution
    // Use 'forks' for integration tests that need process.chdir()
    // Run sequentially in CI to prevent OOM (fixes heap allocation errors)
    pool: 'forks',
    poolOptions: {
      forks: {
        // Max concurrency: Run sequentially in CI (maxForks: 1) to prevent OOM
        // Use more forks locally based on CPU cores (leave 1 core for system)
        maxForks: process.env.CI ? 1 : Math.max(1, os.cpus().length - 1),
        minForks: 1,
      }
    },

    // Timeout configuration
    // Unit tests: 5000ms, Integration tests: 30000ms (set per-test as needed)
    testTimeout: 5000,      // Default for unit tests
    hookTimeout: 10000,     // Hook timeout

    // Watch mode configuration (AC #5)
    watch: false, // Disabled by default, enabled via --watch flag

    // CI-friendly reporters (AC #7)
    reporters: process.env.CI
      ? ['verbose', 'json', 'junit']
      : ['verbose'],

    // Output configuration for CI
    outputFile: {
      json: './coverage/test-results.json',
      junit: './coverage/junit.xml',
    },
  },

  // Path resolution (matches tsconfig.json paths)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@core': path.resolve(__dirname, './src/core'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@types': path.resolve(__dirname, './src/types'),
      '@tests': path.resolve(__dirname, './tests'),
    }
  }
});
