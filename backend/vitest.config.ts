import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test setup
    globals: true,

    // Test file patterns
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ],
      // Target 80% coverage as per Epic 1 testing strategy
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },

    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@core': path.resolve(__dirname, './src/core'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@types': path.resolve(__dirname, './src/types')
    }
  }
});
