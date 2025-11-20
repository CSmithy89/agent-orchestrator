import { test as base, Page } from '@playwright/test';

/**
 * Base test fixture extending Playwright's test
 *
 * Usage:
 * import { test } from '@/tests/support/fixtures/base';
 *
 * test('example', async ({ page }) => {
 *   // Your test code - page is automatically authenticated
 * });
 */

/**
 * Handles development login for E2E tests
 */
async function handleDevLogin(page: Page) {
  // Check if we're on the login page
  const isLoginPage = await page.locator('text=Development Login').isVisible().catch(() => false);

  if (isLoginPage) {
    // Fill in username and click login
    await page.locator('input[type="text"]').fill('e2e-test-user');
    await page.locator('button', { hasText: 'Login' }).click();

    // Wait for navigation to complete
    await page.waitForURL(/\/(projects|$)/, { timeout: 10000 });
  }
}

// Define custom fixture types here
export type CustomFixtures = {
  // Automatically authenticated page
};

// Export extended test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Override page fixture to automatically handle authentication
  page: async ({ page }, use) => {
    // Navigate to base URL and handle login if needed
    await page.goto('/');
    await handleDevLogin(page);

    // Use the authenticated page
    await use(page);
  },
});

export { expect } from '@playwright/test';
