import { test as base } from '@playwright/test';

/**
 * Base test fixture extending Playwright's test
 * 
 * Usage:
 * import { test } from '@/tests/support/fixtures/base';
 * 
 * test('example', async ({ page }) => {
 *   // Your test code
 * });
 */

// Define custom fixture types here
export type CustomFixtures = {
  // Add custom fixtures as the test framework evolves
  // Example: authenticatedPage: Page;
};

// Export extended test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Custom fixture implementations will go here
});

export { expect } from '@playwright/test';
