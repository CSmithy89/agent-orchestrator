# Test Framework Documentation

**Agent Orchestrator E2E Testing with Playwright**

This document provides comprehensive guidance for writing and maintaining E2E tests for the Agent Orchestrator project.

## Table of Contents

- [Overview](#overview)
- [Framework Architecture](#framework-architecture)
- [Getting Started](#getting-started)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Technology Stack

- **Framework**: Playwright 1.40+
- **Language**: TypeScript 5+
- **Test Runner**: Playwright Test Runner
- **Browsers**: Chromium, Firefox, WebKit

### Test Pyramid Strategy

- **60% Unit Tests**: Component and function-level tests (Vitest in workspaces)
- **30% Integration Tests**: API and service integration tests
- **10% E2E Tests**: Full user flow tests (Playwright - this directory)

### Why Playwright?

Playwright was selected for Agent Orchestrator because:

- **Worker Parallelism**: Run tests across multiple workers for speed
- **Multi-Browser Support**: Test across Chromium, Firefox, and WebKit
- **Video/Trace Debugging**: Capture video and traces for debugging failures
- **API Testing**: Built-in support for API endpoint testing
- **Large Repo Optimization**: Designed for performance at scale

---

## Framework Architecture

```
tests/
├── e2e/                    # E2E test suites
│   └── example.spec.ts     # Example test suite
├── support/
│   ├── fixtures/           # Custom test fixtures
│   │   ├── base.ts        # Base fixture extending Playwright
│   │   └── index.ts       # Fixture exports
│   └── helpers/            # Test helper utilities
│       ├── api.ts         # API testing helpers
│       └── index.ts       # Helper exports
└── reports/               # Test reports (gitignored)
    ├── html/              # HTML reports
    └── results.json       # JSON results
```

### Fixture Pattern

Fixtures provide reusable test setup and teardown logic:

```typescript
import { test, expect } from '../support/fixtures';

test('my test', async ({ page }) => {
  // Fixtures are automatically set up and torn down
});
```

### Helper Pattern

Helpers encapsulate common test operations:

```typescript
import { ApiHelper } from '../support/helpers';

const apiHelper = new ApiHelper(request);
const response = await apiHelper.authenticatedRequest('/api/projects');
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@playwright/test`: Playwright test framework
- Browser binaries (Chromium, Firefox, WebKit)

### 2. Install Browsers (if needed)

```bash
npx playwright install
```

### 3. Run Tests

**All tests**:
```bash
npm run test:e2e
```

**UI Mode** (interactive):
```bash
npm run test:e2e:ui
```

**Debug Mode**:
```bash
npm run test:e2e:debug
```

**View Reports**:
```bash
npm run test:e2e:report
```

### 4. Run Specific Tests

**Single file**:
```bash
npx playwright test example.spec.ts
```

**Single test**:
```bash
npx playwright test -g "should load the homepage"
```

**Single browser**:
```bash
npx playwright test --project=chromium
```

---

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '../support/fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('button[type="submit"]');
    
    // Act
    await button.click();
    
    // Assert
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

### API Testing

```typescript
test('should fetch projects', async ({ request }) => {
  const response = await request.get('/api/projects');
  
  expect(response.ok()).toBeTruthy();
  
  const projects = await response.json();
  expect(projects).toBeInstanceOf(Array);
});
```

### Mobile Testing

```typescript
test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should work on mobile', async ({ page }) => {
    // Test mobile-specific behavior
  });
});
```

### Authentication Testing

```typescript
test.describe('Authenticated Features', () => {
  test.use({ storageState: 'auth.json' });

  test('should access protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

---

## Best Practices

### 1. Use Descriptive Test Names

❌ **Bad**:
```typescript
test('test 1', async ({ page }) => { ... });
```

✅ **Good**:
```typescript
test('should display error message when project name is empty', async ({ page }) => { ... });
```

### 2. Use Page Object Pattern for Complex Pages

```typescript
// pages/dashboard.page.ts
export class DashboardPage {
  constructor(private page: Page) {}
  
  async navigateToProjects() {
    await this.page.click('[data-testid="projects-link"]');
  }
  
  async getProjectCount() {
    return this.page.locator('.project-card').count();
  }
}

// In test:
const dashboard = new DashboardPage(page);
await dashboard.navigateToProjects();
```

### 3. Use Data-Testid Attributes

```typescript
// Prefer data-testid over fragile selectors
await page.locator('[data-testid="submit-button"]').click();

// Avoid:
await page.locator('button.btn-primary.mt-4').click();
```

### 4. Use Soft Assertions for Non-Critical Checks

```typescript
await expect.soft(page.locator('.warning')).toBeVisible();
await expect.soft(page.locator('.info')).toContainText('Info');
// Test continues even if these fail
```

### 5. Cleanup Test Data

```typescript
test.afterEach(async ({ request }) => {
  // Clean up test data
  await request.delete('/api/test-projects');
});
```

### 6. Use Timeouts Wisely

```typescript
// Increase timeout for slow operations
await expect(page.locator('.result')).toBeVisible({ timeout: 30000 });
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/reports/html/
```

### Environment Variables

Tests respect these environment variables:

- `API_BASE_URL`: Base URL for API requests (default: `http://localhost:3000`)
- `CI`: Set to `true` in CI environments for stricter settings

---

## Troubleshooting

### Tests Fail in CI but Pass Locally

**Solution**: Check for timing issues. CI environments are often slower.

```typescript
// Increase timeouts in playwright.config.ts
timeout: 60 * 1000, // 60 seconds
```

### "Element not visible" Errors

**Solution**: Wait for elements to be visible before interacting:

```typescript
await page.locator('button').waitFor({ state: 'visible' });
await page.locator('button').click();
```

### Browser Not Installed

**Solution**: Install browsers:

```bash
npx playwright install
```

### Tests Hang/Timeout

**Solution**: Check for missing awaits:

```typescript
// ❌ Bad
page.goto('/');

// ✅ Good
await page.goto('/');
```

### Network Requests Fail

**Solution**: Ensure the dev server is running:

```bash
npm run dev
```

Or check `playwright.config.ts` webServer configuration.

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Agent Orchestrator Architecture](../docs/architecture.md)

---

## Maintenance Notes

**Created**: 2025-11-04  
**Framework Version**: Playwright 1.40+  
**Last Updated**: 2025-11-04  

**Maintainer**: TEA Agent (Murat - Master Test Architect)

For questions or issues with the test framework, consult:
1. This README
2. Architecture document (Section 6.1 - Test Strategy)
3. TEA agent via `/bmad:bmm:agents:tea`
