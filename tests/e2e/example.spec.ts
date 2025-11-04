import { test, expect } from '../support/fixtures';

/**
 * Example E2E test suite demonstrating best practices
 * 
 * This test suite serves as a template for writing E2E tests
 * in the Agent Orchestrator project.
 */

test.describe('Example Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to the application
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Agent Orchestrator/);
  });

  test('should have accessible navigation', async ({ page }) => {
    // Verify key navigation elements exist
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test.describe('API Health Check', () => {
    test('should return healthy status', async ({ request }) => {
      // Test backend health endpoint
      const response = await request.get('/health');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('status', 'healthy');
    });
  });
});

test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Verify mobile-specific behavior
    const mobileMenu = page.locator('[aria-label="mobile menu"]');
    // Add mobile-specific assertions as UI is built
  });
});
