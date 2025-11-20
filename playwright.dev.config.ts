import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for running tests against already-running dev servers
 * Use this when backend (3002) and dashboard (5173) are already running
 *
 * Usage: npx playwright test --config=playwright.dev.config.ts
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run (extended for workflow tests)
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/reports/html' }],
    ['json', { outputFile: 'tests/reports/results.json' }],
    ['junit', { outputFile: 'tests/reports/junit.xml' }],
    ['list']
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests (dashboard runs on 5173, backend on 3002)
    baseURL: process.env.DASHBOARD_URL || 'http://localhost:5173',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',

    // Timeouts
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer config - assumes servers are already running
});
