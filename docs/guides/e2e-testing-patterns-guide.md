# E2E Testing Patterns Guide

**Author:** Tess (Test Architect)
**Date:** 2025-11-16
**Status:** Active
**Related:** [ADR-006: Playwright for End-to-End Testing](../adr/adr-006-playwright-e2e-testing.md)

## Overview

This guide documents the E2E testing patterns and best practices used in the Agent Orchestrator dashboard, based on the 155 Playwright tests created in Epic 6 (Story 6-10). It provides a comprehensive reference for writing maintainable, reliable, and accessible E2E tests using the Page Object Model pattern.

## Table of Contents

1. [Test Structure & Organization](#test-structure--organization)
2. [Page Object Model Pattern](#page-object-model-pattern)
3. [Test Patterns & Best Practices](#test-patterns--best-practices)
4. [Drag-and-Drop Testing](#drag-and-drop-testing)
5. [Real-Time Updates Testing](#real-time-updates-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Cross-Browser Testing](#cross-browser-testing)
8. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
9. [Debugging & Troubleshooting](#debugging--troubleshooting)
10. [CI/CD Integration](#cicd-integration)

## Test Structure & Organization

### Directory Structure

```
tests/
├── e2e/                          # E2E test specs
│   ├── project-management.spec.ts (20 tests)
│   ├── escalation-interface.spec.ts (25 tests)
│   ├── kanban-board.spec.ts (30 tests)
│   ├── dependency-graph.spec.ts (25 tests)
│   ├── realtime-updates.spec.ts (15 tests)
│   ├── responsive-design.spec.ts (20 tests)
│   └── accessibility.spec.ts (30 tests)
├── support/                      # Test utilities
│   ├── fixtures/                 # Custom Playwright fixtures
│   │   ├── base.ts
│   │   ├── config.fixture.ts
│   │   └── index.ts
│   ├── helpers/                  # Test helpers
│   │   ├── api.ts
│   │   └── index.ts
│   ├── pages/                    # Page Object Models
│   │   ├── BasePage.ts
│   │   ├── ProjectsListPage.ts
│   │   ├── ProjectDetailPage.ts
│   │   ├── KanbanBoardPage.ts
│   │   ├── DependencyGraphPage.ts
│   │   ├── EscalationsPage.ts
│   │   └── index.ts
│   └── factories/                # Test data factories
│       ├── config.factory.ts
│       └── index.ts
├── reports/                      # Test reports and screenshots
│   ├── screenshots/
│   └── videos/
└── README.md                     # Test documentation
```

### Test File Organization

**Pattern: Group Related Tests**

```typescript
import { test, expect } from '../support/fixtures';
import { KanbanBoardPage } from '../support/pages';

/**
 * E2E Tests for Kanban Board (Story 6.7)
 *
 * Acceptance Criteria:
 * - Board renders with correct columns
 * - Cards display story information
 * - Drag-and-drop updates status
 */
test.describe('Kanban Board', () => {
  let kanbanPage: KanbanBoardPage;

  test.beforeEach(async ({ page }) => {
    kanbanPage = new KanbanBoardPage(page);
  });

  test.describe('Board Layout', () => {
    test('should display all 6 columns', async () => {
      // ...
    });
  });

  test.describe('Drag and Drop', () => {
    test('should move card to new column', async () => {
      // ...
    });
  });
});
```

**Benefits:**
- ✅ Clear hierarchy with nested `describe` blocks
- ✅ Shared setup in `beforeEach`
- ✅ Related tests grouped together
- ✅ Easy to find and maintain tests

## Page Object Model Pattern

### BasePage - Foundation

All page objects extend `BasePage` for common functionality:

```typescript
// tests/support/pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly sidebar: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.sidebar = page.locator('[data-testid="sidebar"]').or(
      page.locator('nav[aria-label="Main navigation"]')
    );
    this.mainContent = page.locator('main');
  }

  /** Navigate to a specific route */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /** Wait for page to be fully loaded */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /** Wait for loading to complete */
  async waitForLoadingToComplete(timeout: number = 10000) {
    const loadingLocator = this.page.locator('[data-testid="loading"]').or(
      this.page.locator('[aria-label="Loading"]')
    );
    await loadingLocator.waitFor({ state: 'hidden', timeout }).catch(() => {
      // Loading indicator might not appear for fast requests
    });
  }

  /** Check if page has error message */
  async hasErrorMessage(): Promise<boolean> {
    const errorLocator = this.page.locator('[role="alert"]').or(
      this.page.locator('[data-testid="error-message"]')
    );
    return await errorLocator.isVisible();
  }
}
```

**Key Features:**
- ✅ Common locators (header, sidebar, main)
- ✅ Navigation helpers
- ✅ Loading state management
- ✅ Error handling
- ✅ Reusable across all pages

### Page Object Pattern

**Example: KanbanBoardPage**

```typescript
// tests/support/pages/KanbanBoardPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class KanbanBoardPage extends BasePage {
  // Define locators as readonly properties
  readonly epicFilter: Locator;
  readonly backlogColumn: Locator;
  readonly draftedColumn: Locator;
  readonly storyCards: Locator;
  readonly storyDetailModal: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators with flexible selectors
    this.epicFilter = page.locator('[data-testid="epic-filter"]').or(
      page.locator('select[name="epic"]')
    );

    this.backlogColumn = page.locator('[data-testid="column-backlog"]').or(
      page.locator('[data-status="backlog"]')
    );

    // ... other locators
  }

  /** Navigate to kanban board page */
  async navigate() {
    await this.goto('/kanban');
  }

  /** Filter stories by epic */
  async filterByEpic(epic: string) {
    await this.selectOption(this.epicFilter, epic);
    await this.waitForLoadingToComplete();
  }

  /** Get column by status */
  getColumn(status: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done'): Locator {
    const columns = {
      'backlog': this.backlogColumn,
      'drafted': this.draftedColumn,
      'ready': this.readyColumn,
      'in-progress': this.inProgressColumn,
      'review': this.reviewColumn,
      'done': this.doneColumn,
    };
    return columns[status];
  }

  /** Drag story card from one column to another */
  async dragStoryCard(storyTitle: string, targetStatus: string) {
    const card = this.getStoryCardByTitle(storyTitle);
    const targetColumn = this.getColumn(targetStatus);

    await card.dragTo(targetColumn);
    await this.waitForLoadingToComplete();
  }
}
```

**Best Practices:**

1. **Flexible Locators with `.or()` Fallbacks**
   ```typescript
   // ✅ Good: Multiple strategies
   this.epicFilter = page.locator('[data-testid="epic-filter"]').or(
     page.locator('select[name="epic"]')
   );

   // ❌ Bad: Single brittle selector
   this.epicFilter = page.locator('#epic-filter');
   ```

2. **Readonly Locators**
   ```typescript
   // ✅ Good: Prevents accidental reassignment
   readonly backlogColumn: Locator;

   // ❌ Bad: Mutable locator
   backlogColumn: Locator;
   ```

3. **Descriptive Method Names**
   ```typescript
   // ✅ Good: Clear intent
   async dragStoryCard(title: string, targetStatus: string)

   // ❌ Bad: Unclear intent
   async drag(a: string, b: string)
   ```

4. **Encapsulate Complex Logic**
   ```typescript
   // ✅ Good: Method handles all drag logic
   async dragStoryCard(title, targetStatus) {
     const card = this.getStoryCardByTitle(title);
     const targetColumn = this.getColumn(targetStatus);
     await card.dragTo(targetColumn);
     await this.waitForLoadingToComplete();
   }

   // ❌ Bad: Test exposes implementation details
   test('should drag card', async () => {
     const card = page.locator(`[data-title="${title}"]`);
     const column = page.locator(`[data-status="${status}"]`);
     await card.dragTo(column);
     await page.waitForTimeout(500);
   });
   ```

## Test Patterns & Best Practices

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
test('should create new project', async () => {
  // Arrange: Setup test state
  await projectsPage.navigate();
  await projectsPage.waitForLoadingToComplete();

  // Act: Perform action
  await projectsPage.clickCreateProjectButton();
  await projectsPage.fillProjectForm({
    name: 'Test Project',
    description: 'Test Description'
  });
  await projectsPage.submitProjectForm();

  // Assert: Verify result
  await expect(projectsPage.successMessage).toBeVisible();
  await expect(projectsPage.successMessage).toHaveText('Project created');
});
```

### Pattern 2: Auto-Waiting (Playwright Built-in)

```typescript
// ✅ Good: Playwright auto-waits
test('should click button', async () => {
  await projectsPage.createProjectButton.click();
  // Playwright waits for button to be clickable
});

// ❌ Bad: Manual waiting (flaky)
test('should click button', async () => {
  await page.waitForTimeout(1000); // 💥 Flaky!
  await projectsPage.createProjectButton.click();
});
```

**When to use explicit waits:**
- Waiting for loading indicators to disappear
- Waiting for real-time updates
- Waiting for animations to complete

```typescript
// ✅ Good: Wait for specific condition
await projectsPage.waitForLoadingToComplete();

// ✅ Good: Wait for element state
await locator.waitFor({ state: 'hidden', timeout: 5000 });

// ❌ Bad: Arbitrary timeout
await page.waitForTimeout(2000);
```

### Pattern 3: Test Isolation

```typescript
test.describe('Projects', () => {
  // ✅ Good: Each test is independent
  test.beforeEach(async ({ page }) => {
    const projectsPage = new ProjectsListPage(page);
    await projectsPage.navigate();
    await projectsPage.waitForLoadingToComplete();
  });

  test('should display projects', async () => {
    // Test doesn't rely on previous test
  });

  test('should create project', async () => {
    // Fresh state from beforeEach
  });
});
```

**Avoid test interdependence:**
```typescript
// ❌ Bad: Tests depend on each other
test('should create project', async () => {
  // Creates project "Test 1"
});

test('should update project', async () => {
  // Assumes "Test 1" exists from previous test
  // 💥 Fails if previous test skipped or run in isolation
});
```

### Pattern 4: Data-Driven Tests

```typescript
const statuses = ['backlog', 'drafted', 'ready', 'in-progress', 'review', 'done'];

statuses.forEach(status => {
  test(`should display ${status} column`, async () => {
    await kanbanPage.navigate();
    const column = kanbanPage.getColumn(status);
    await expect(column).toBeVisible();
  });
});
```

### Pattern 5: Assertions Best Practices

```typescript
// ✅ Good: Specific assertions
await expect(projectCard).toBeVisible();
await expect(projectCard).toHaveText('Test Project');
await expect(projectCard).toHaveClass(/active/);

// ❌ Bad: Generic assertions
expect(await projectCard.isVisible()).toBe(true);
expect(await projectCard.textContent()).toContain('Test');
```

**Playwright auto-retry assertions:**
```typescript
// ✅ Good: Auto-retries until timeout
await expect(successMessage).toBeVisible(); // Retries for 5 seconds

// ❌ Bad: No retry (flaky)
expect(await successMessage.isVisible()).toBe(true); // Single check
```

## Drag-and-Drop Testing

### Pattern: Kanban Card Drag-and-Drop

```typescript
test('should move story card between columns', async () => {
  await kanbanPage.navigate();
  await kanbanPage.waitForLoadingToComplete();

  // Verify initial state
  const initialCount = await kanbanPage.getCardCountInColumn('backlog');
  await expect(kanbanPage.getStoryCardByTitle('Story 6-1')).toBeVisible();

  // Perform drag-and-drop
  await kanbanPage.dragStoryCard('Story 6-1', 'in-progress');

  // Verify card moved
  await expect(kanbanPage.getCardCountInColumn('backlog')).toBe(initialCount - 1);
  const isInProgress = await kanbanPage.isCardInColumn('Story 6-1', 'in-progress');
  expect(isInProgress).toBe(true);
});
```

**Page Object Implementation:**
```typescript
async dragStoryCard(storyTitle: string, targetStatus: string) {
  const card = this.getStoryCardByTitle(storyTitle);
  const targetColumn = this.getColumn(targetStatus);

  // Playwright's dragTo method handles all drag logic
  await card.dragTo(targetColumn);

  // Wait for API call to complete
  await this.waitForLoadingToComplete();
}
```

**Alternative: Manual Drag Sequence**
```typescript
async dragStoryCardManual(storyTitle: string, targetStatus: string) {
  const card = this.getStoryCardByTitle(storyTitle);
  const targetColumn = this.getColumn(targetStatus);

  // Get bounding boxes
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();

  if (!cardBox || !columnBox) {
    throw new Error('Element not found');
  }

  // Perform drag sequence
  await this.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await this.page.mouse.down();
  await this.page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + columnBox.height / 2);
  await this.page.mouse.up();

  await this.waitForLoadingToComplete();
}
```

## Real-Time Updates Testing

### Pattern: WebSocket Event Testing

```typescript
test('should update story card when WebSocket event received', async () => {
  await kanbanPage.navigate();
  await kanbanPage.waitForLoadingToComplete();

  // Trigger action that generates WebSocket event (in another tab or via API)
  // For example, update story status via API

  // Wait for real-time update to appear
  await kanbanPage.waitForStoryInColumn('Story 6-2', 'done', 5000);

  // Verify card updated
  const isDone = await kanbanPage.isCardInColumn('Story 6-2', 'done');
  expect(isDone).toBe(true);
});
```

**Page Object Method:**
```typescript
async waitForStoryInColumn(
  storyTitle: string,
  status: string,
  timeout: number = 5000
) {
  const column = this.getColumn(status);
  const card = column.locator('[data-testid="story-card"]', { hasText: storyTitle });
  await card.waitFor({ state: 'visible', timeout });
}
```

### Pattern: Multi-Tab Real-Time Sync

```typescript
test('should sync updates across multiple tabs', async ({ browser }) => {
  // Create two tabs
  const context = await browser.newContext();
  const page1 = await context.newPage();
  const page2 = await context.newPage();

  const kanban1 = new KanbanBoardPage(page1);
  const kanban2 = new KanbanBoardPage(page2);

  // Navigate both tabs
  await kanban1.navigate();
  await kanban2.navigate();

  // Perform action in tab 1
  await kanban1.dragStoryCard('Story 6-3', 'review');

  // Verify update appears in tab 2 (WebSocket sync)
  await kanban2.waitForStoryInColumn('Story 6-3', 'review', 5000);

  // Cleanup
  await page1.close();
  await page2.close();
  await context.close();
});
```

## Accessibility Testing

### Pattern: Keyboard Navigation

```typescript
test.describe('Keyboard Navigation', () => {
  test('should navigate with Tab key', async ({ page }) => {
    await projectsPage.navigate();

    // Start from top
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveCount(1);

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveCount(1);
    }
  });

  test('should activate button with Enter key', async ({ page }) => {
    await projectsPage.navigate();

    // Focus button
    await projectsPage.createProjectButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify action triggered
    await expect(projectsPage.createProjectModal).toBeVisible();
  });

  test('should activate button with Space key', async ({ page }) => {
    await projectsPage.navigate();

    // Focus button
    await projectsPage.createProjectButton.focus();

    // Press Space
    await page.keyboard.press('Space');

    // Verify action triggered
    await expect(projectsPage.createProjectModal).toBeVisible();
  });
});
```

### Pattern: ARIA Attributes

```typescript
test('should have correct ARIA attributes', async () => {
  await escalationsPage.navigate();

  // Check ARIA roles
  await expect(escalationsPage.escalationsList).toHaveAttribute('role', 'list');

  // Check ARIA labels
  await expect(escalationsPage.filterButton).toHaveAttribute('aria-label', /filter/i);

  // Check ARIA-expanded
  await escalationsPage.clickFilterButton();
  await expect(escalationsPage.filterButton).toHaveAttribute('aria-expanded', 'true');
});
```

### Pattern: Focus Management

```typescript
test('should trap focus in modal', async ({ page }) => {
  await projectsPage.navigate();
  await projectsPage.clickCreateProjectButton();

  // Get first and last focusable elements in modal
  const firstFocusable = projectsPage.createProjectModal.locator('button, input, select').first();
  const lastFocusable = projectsPage.createProjectModal.locator('button, input, select').last();

  // Focus last element
  await lastFocusable.focus();

  // Tab forward (should wrap to first)
  await page.keyboard.press('Tab');
  await expect(firstFocusable).toBeFocused();

  // Tab backward (should wrap to last)
  await page.keyboard.press('Shift+Tab');
  await expect(lastFocusable).toBeFocused();
});
```

### Pattern: Screen Reader Text

```typescript
test('should have screen reader text for icons', async () => {
  await kanbanPage.navigate();

  // Check for visually hidden text
  const statusIcon = kanbanPage.page.locator('[data-testid="story-status-icon"]').first();

  // Should have aria-label or visually hidden text
  const ariaLabel = await statusIcon.getAttribute('aria-label');
  const srText = await statusIcon.locator('.sr-only, .visually-hidden').textContent();

  expect(ariaLabel || srText).toBeTruthy();
});
```

## Cross-Browser Testing

### Pattern: Browser-Specific Tests

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### Pattern: Mobile Viewport Testing

```typescript
test('should be responsive on mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await projectsPage.navigate();

  // Verify mobile layout
  await expect(projectsPage.sidebar).toBeHidden(); // Hidden on mobile
  await expect(projectsPage.mobileMenuButton).toBeVisible();
});
```

### Pattern: Device Emulation

```typescript
// playwright.config.ts
import { devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'Desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'Tablet', use: { ...devices['iPad Pro'] } },
    { name: 'Mobile', use: { ...devices['iPhone 12'] } },
  ],
});
```

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Hardcoded Timeouts

```typescript
// ❌ Bad: Arbitrary timeout
await page.waitForTimeout(2000);

// ✅ Good: Wait for specific condition
await projectsPage.waitForLoadingToComplete();
```

### ❌ Anti-Pattern 2: Testing Implementation Details

```typescript
// ❌ Bad: Testing internal state
expect(component._internalState).toBe('active');

// ✅ Good: Testing user-visible behavior
await expect(projectCard).toHaveClass(/active/);
```

### ❌ Anti-Pattern 3: Brittle Selectors

```typescript
// ❌ Bad: CSS class selectors (change frequently)
page.locator('.btn-primary-lg-rounded');

// ✅ Good: data-testid or semantic selectors
page.locator('[data-testid="create-project-button"]');
page.locator('button', { hasText: 'Create Project' });
```

### ❌ Anti-Pattern 4: Copy-Paste Tests

```typescript
// ❌ Bad: Duplicate code in every test
test('test 1', async () => {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
  // ...
});

test('test 2', async () => {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle');
  // ...
});

// ✅ Good: Use beforeEach or Page Objects
test.beforeEach(async () => {
  await projectsPage.navigate();
});
```

### ❌ Anti-Pattern 5: Testing Multiple Things

```typescript
// ❌ Bad: Test does too much
test('should create, update, and delete project', async () => {
  // Create
  // Update
  // Delete
  // 💥 If update fails, delete never runs
});

// ✅ Good: One test, one concern
test('should create project', async () => { /* ... */ });
test('should update project', async () => { /* ... */ });
test('should delete project', async () => { /* ... */ });
```

## Debugging & Troubleshooting

### Debug Mode

```bash
# Run test in headed mode with slow motion
npx playwright test --headed --slow-mo=1000

# Debug specific test
npx playwright test project-management.spec.ts --debug
```

### Screenshots on Failure

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
});
```

### Manual Screenshots

```typescript
test('should display dashboard', async ({ page }) => {
  await projectsPage.navigate();

  // Take screenshot
  await page.screenshot({ path: 'dashboard.png', fullPage: true });
});
```

### Playwright Inspector

```typescript
test('should debug test', async ({ page }) => {
  await projectsPage.navigate();

  // Pause test for debugging
  await page.pause();

  // Continue with test...
});
```

### Trace Viewer

```bash
# Run test with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests (shard ${{ matrix.shard }}/4)
        run: npm run test:e2e -- --shard=${{ matrix.shard }}/4

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.shard }}
          path: test-results/
```

### Parallel Execution

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : 2,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
});
```

### Test Reports

```bash
# Generate HTML report
npx playwright test --reporter=html

# View report
npx playwright show-report
```

## Summary

**Key Takeaways:**

1. ✅ **Use Page Object Model** for maintainable tests
2. ✅ **Leverage Playwright auto-waiting** - avoid hardcoded timeouts
3. ✅ **Test user behavior**, not implementation
4. ✅ **Ensure test isolation** - each test independent
5. ✅ **Write accessible tests** - keyboard nav, ARIA, focus
6. ✅ **Use flexible locators** with `.or()` fallbacks
7. ✅ **Test real-time features** with explicit waits
8. ✅ **Run cross-browser** tests (Chromium, Firefox, WebKit)
9. ✅ **Parallelize in CI** with sharding for speed
10. ✅ **Debug effectively** with traces, screenshots, and inspector

**Test Metrics from Epic 6:**
- **155 E2E tests** across 7 test suites
- **100% pass rate** (155/155 passing)
- **3 browsers** (Chromium, Firefox, WebKit)
- **CI time:** ~5-10 minutes (4-shard parallel)
- **WCAG 2.1 Level AA** compliance

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [ADR-006: Playwright for End-to-End Testing](../adr/adr-006-playwright-e2e-testing.md)
- [Epic 6 Retrospective](../epics/epic-6-retrospective.md)
- Test Implementation: `tests/e2e/`, `tests/support/pages/`

---

**Last Updated:** 2025-11-16
**Version:** 1.0
**Maintainer:** Tess (Test Architect)
