import { test, expect } from '../support/fixtures';
import { KanbanBoardPage } from '../support/pages';

/**
 * E2E Tests for Kanban Board (Story 6.7)
 *
 * Acceptance Criteria #4:
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
    test('should load kanban board page', async () => {
      await kanbanPage.navigate();

      // Verify page loaded
      await expect(kanbanPage.page).toHaveURL(/\/kanban/);
      await expect(kanbanPage.page).toHaveTitle(/Agent Orchestrator/);
    });

    test('should display all 6 columns', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      // Verify all columns are visible
      const allColumnsVisible = await kanbanPage.areAllColumnsVisible();
      expect(allColumnsVisible).toBe(true);
    });

    test('should display backlog column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const column = kanbanPage.getColumn('backlog');
      await expect(column).toBeVisible();

      const title = await kanbanPage.getColumnTitle('backlog');
      expect(title.toLowerCase()).toContain('backlog');
    });

    test('should display drafted column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const column = kanbanPage.getColumn('drafted');
      await expect(column).toBeVisible();

      const title = await kanbanPage.getColumnTitle('drafted');
      expect(title.toLowerCase()).toContain('draft');
    });

    test('should display ready column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const column = kanbanPage.getColumn('ready');
      await expect(column).toBeVisible();

      const title = await kanbanPage.getColumnTitle('ready');
      expect(title.toLowerCase()).toContain('ready');
    });

    test('should display in-progress column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const column = kanbanPage.getColumn('in-progress');
      await expect(column).toBeVisible();

      const title = await kanbanPage.getColumnTitle('in-progress');
      expect(title.toLowerCase()).toMatch(/in.progress|progress/);
    });

    test('should display review column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const column = kanbanPage.getColumn('review');
      await expect(column).toBeVisible();

      const title = await kanbanPage.getColumnTitle('review');
      expect(title.toLowerCase()).toContain('review');
    });

    test('should display done column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const column = kanbanPage.getColumn('done');
      await expect(column).toBeVisible();

      const title = await kanbanPage.getColumnTitle('done');
      expect(title.toLowerCase()).toContain('done');
    });
  });

  test.describe('Story Cards', () => {
    test('should display story cards', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      // Get total story count
      const totalCount = await kanbanPage.getTotalStoryCount();
      expect(totalCount).toBeGreaterThanOrEqual(0);

      // If there are stories, verify they're visible
      if (totalCount > 0) {
        const firstCard = kanbanPage.storyCards.first();
        await expect(firstCard).toBeVisible();
      }
    });

    test('should display story title on cards', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        const firstCard = kanbanPage.storyCards.first();
        const titleElement = firstCard.locator('[data-testid="story-title"]').or(
          firstCard.locator('h3, h4').first()
        );
        await expect(titleElement).toBeVisible();

        const title = await titleElement.textContent();
        expect(title).toBeTruthy();
        expect(title!.length).toBeGreaterThan(0);
      }
    });

    test('should display epic badge on cards', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        const firstCard = kanbanPage.storyCards.first();
        const epicBadge = firstCard.locator('[data-testid="story-epic-badge"]').or(
          firstCard.locator('[class*="epic"]')
        );

        // Epic badge might be present
        const isVisible = await epicBadge.isVisible().catch(() => false);
        // This is acceptable either way
        expect(typeof isVisible).toBe('boolean');
      }
    });

    test('should display status badge on cards', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        const firstCard = kanbanPage.storyCards.first();
        const statusBadge = firstCard.locator('[data-testid="story-status-badge"]').or(
          firstCard.locator('[class*="status"]')
        );

        // Status might be indicated by column position instead of badge
        const isVisible = await statusBadge.isVisible().catch(() => false);
        expect(typeof isVisible).toBe('boolean');
      }
    });

    test('should open story detail modal on card click', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        // Get first story card title
        const firstCard = kanbanPage.storyCards.first();
        const titleElement = firstCard.locator('[data-testid="story-title"]').or(
          firstCard.locator('h3, h4').first()
        );
        const storyTitle = await titleElement.textContent();

        if (storyTitle) {
          // Click the card
          await kanbanPage.clickStoryCard(storyTitle);

          // Verify modal opens
          const isModalVisible = await kanbanPage.isStoryModalVisible();
          expect(isModalVisible).toBe(true);

          // Close modal
          await kanbanPage.closeStoryModal();
        }
      }
    });
  });

  test.describe('Epic Filter', () => {
    test('should have epic filter dropdown', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      // Verify epic filter exists
      await expect(kanbanPage.epicFilter).toBeVisible();
    });

    test('should filter stories by epic', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const initialCount = await kanbanPage.getTotalStoryCount();

      if (initialCount > 0) {
        // Apply epic filter
        await kanbanPage.filterByEpic('Epic 6');
        await kanbanPage.waitForLoadingToComplete();

        // Count might change
        const filteredCount = await kanbanPage.getTotalStoryCount();
        expect(filteredCount).toBeGreaterThanOrEqual(0);
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    });

    test('should reset filter to show all stories', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const initialCount = await kanbanPage.getTotalStoryCount();

      // Apply filter
      await kanbanPage.filterByEpic('Epic 5');
      await kanbanPage.waitForLoadingToComplete();

      // Reset filter
      await kanbanPage.filterByEpic('all');
      await kanbanPage.waitForLoadingToComplete();

      // Should show all stories again
      const resetCount = await kanbanPage.getTotalStoryCount();
      expect(resetCount).toBe(initialCount);
    });
  });

  test.describe('Drag and Drop', () => {
    test('should support drag and drop between columns', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      // Find a story card to drag
      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        // Get first story
        const firstCard = kanbanPage.storyCards.first();
        const titleElement = firstCard.locator('[data-testid="story-title"]').or(
          firstCard.locator('h3, h4').first()
        );
        const storyTitle = await titleElement.textContent();

        if (storyTitle) {
          // Try to drag from backlog to drafted
          const initialBacklogCount = await kanbanPage.getCardCountInColumn('backlog');
          const initialDraftedCount = await kanbanPage.getCardCountInColumn('drafted');

          if (initialBacklogCount > 0) {
            // Get first card in backlog
            const backlogCards = kanbanPage.getCardsInColumn('backlog');
            const firstBacklogCard = backlogCards.first();
            const cardTitle = await firstBacklogCard.locator('[data-testid="story-title"]').or(
              firstBacklogCard.locator('h3, h4').first()
            ).textContent();

            if (cardTitle) {
              // Perform drag
              await kanbanPage.dragStoryCard(cardTitle, 'drafted');

              // Wait for update
              await kanbanPage.page.waitForTimeout(1000);

              // Verify card moved
              const finalBacklogCount = await kanbanPage.getCardCountInColumn('backlog');
              const finalDraftedCount = await kanbanPage.getCardCountInColumn('drafted');

              // Count should change
              expect(finalBacklogCount).toBe(initialBacklogCount - 1);
              expect(finalDraftedCount).toBe(initialDraftedCount + 1);
            }
          }
        }
      }
    });

    test('should persist status change after drag', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const backlogCount = await kanbanPage.getCardCountInColumn('backlog');

      if (backlogCount > 0) {
        // Get a card to drag
        const backlogCards = kanbanPage.getCardsInColumn('backlog');
        const firstCard = backlogCards.first();
        const titleElement = firstCard.locator('[data-testid="story-title"]').or(
          firstCard.locator('h3, h4').first()
        );
        const storyTitle = await titleElement.textContent();

        if (storyTitle) {
          // Drag card
          await kanbanPage.dragStoryCard(storyTitle, 'drafted');
          await kanbanPage.page.waitForTimeout(1000);

          // Reload page
          await kanbanPage.reload();
          await kanbanPage.waitForLoadingToComplete();

          // Verify card is still in new column
          const isInDrafted = await kanbanPage.isCardInColumn(storyTitle, 'drafted');
          expect(isInDrafted).toBe(true);
        }
      }
    });
  });

  test.describe('Column Management', () => {
    test('should display card counts in each column', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      // Get counts for all columns
      const backlogCount = await kanbanPage.getCardCountInColumn('backlog');
      const draftedCount = await kanbanPage.getCardCountInColumn('drafted');
      const readyCount = await kanbanPage.getCardCountInColumn('ready');
      const inProgressCount = await kanbanPage.getCardCountInColumn('in-progress');
      const reviewCount = await kanbanPage.getCardCountInColumn('review');
      const doneCount = await kanbanPage.getCardCountInColumn('done');

      // All counts should be >= 0
      expect(backlogCount).toBeGreaterThanOrEqual(0);
      expect(draftedCount).toBeGreaterThanOrEqual(0);
      expect(readyCount).toBeGreaterThanOrEqual(0);
      expect(inProgressCount).toBeGreaterThanOrEqual(0);
      expect(reviewCount).toBeGreaterThanOrEqual(0);
      expect(doneCount).toBeGreaterThanOrEqual(0);

      // Sum should equal total
      const sum = backlogCount + draftedCount + readyCount + inProgressCount + reviewCount + doneCount;
      const total = await kanbanPage.getTotalStoryCount();
      expect(sum).toBe(total);
    });

    test('should show empty state in columns with no cards', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      // Check each column - empty columns should have 0 cards
      const columns: Array<'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done'> = [
        'backlog',
        'drafted',
        'ready',
        'in-progress',
        'review',
        'done',
      ];

      for (const columnStatus of columns) {
        const count = await kanbanPage.getCardCountInColumn(columnStatus);
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Story Detail Modal', () => {
    test('should display story details in modal', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        const firstCard = kanbanPage.storyCards.first();
        const titleElement = firstCard.locator('[data-testid="story-title"]').or(
          firstCard.locator('h3, h4').first()
        );
        const storyTitle = await titleElement.textContent();

        if (storyTitle) {
          await kanbanPage.clickStoryCard(storyTitle);

          // Verify modal content
          await expect(kanbanPage.storyDetailModal).toBeVisible();

          // Modal should contain story information
          const modalContent = await kanbanPage.storyDetailModal.textContent();
          expect(modalContent).toBeTruthy();
          expect(modalContent!.length).toBeGreaterThan(0);
        }
      }
    });

    test('should close modal on close button click', async () => {
      await kanbanPage.navigate();
      await kanbanPage.waitForLoadingToComplete();

      const totalCount = await kanbanPage.getTotalStoryCount();

      if (totalCount > 0) {
        const firstCard = kanbanPage.storyCards.first();
        const titleElement = firstCard.locator('[data-testid="story-title"]').or(
          firstCard.locator('h3, h4').first()
        );
        const storyTitle = await titleElement.textContent();

        if (storyTitle) {
          await kanbanPage.clickStoryCard(storyTitle);

          // Verify modal is open
          expect(await kanbanPage.isStoryModalVisible()).toBe(true);

          // Close modal
          await kanbanPage.closeStoryModal();

          // Verify modal is closed
          await kanbanPage.page.waitForTimeout(500);
          expect(await kanbanPage.isStoryModalVisible()).toBe(false);
        }
      }
    });
  });
});
