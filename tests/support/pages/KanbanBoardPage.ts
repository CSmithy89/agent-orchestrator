import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Kanban Board Page
 *
 * Route: /kanban
 * Features:
 * - 6 columns (backlog, drafted, ready, in-progress, review, done)
 * - Story cards with drag-and-drop
 * - Epic filter
 * - Story detail modal
 */
export class KanbanBoardPage extends BasePage {
  readonly epicFilter: Locator;
  readonly backlogColumn: Locator;
  readonly draftedColumn: Locator;
  readonly readyColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly reviewColumn: Locator;
  readonly doneColumn: Locator;
  readonly storyCards: Locator;
  readonly storyDetailModal: Locator;
  readonly closeStoryModalButton: Locator;

  constructor(page: Page) {
    super(page);

    // Filters
    this.epicFilter = page.locator('[data-testid="epic-filter"]').or(
      page.locator('select[name="epic"]')
    );

    // Kanban columns
    this.backlogColumn = page.locator('[data-testid="column-backlog"]').or(
      page.locator('[data-status="backlog"]')
    );
    this.draftedColumn = page.locator('[data-testid="column-drafted"]').or(
      page.locator('[data-status="drafted"]')
    );
    this.readyColumn = page.locator('[data-testid="column-ready"]').or(
      page.locator('[data-status="ready"]')
    );
    this.inProgressColumn = page.locator('[data-testid="column-in-progress"]').or(
      page.locator('[data-status="in-progress"]')
    );
    this.reviewColumn = page.locator('[data-testid="column-review"]').or(
      page.locator('[data-status="review"]')
    );
    this.doneColumn = page.locator('[data-testid="column-done"]').or(
      page.locator('[data-status="done"]')
    );

    // Story cards
    this.storyCards = page.locator('[data-testid="story-card"]').or(
      page.locator('[class*="story-card"]')
    );

    // Story detail modal
    this.storyDetailModal = page.locator('[data-testid="story-detail-modal"]').or(
      page.locator('[role="dialog"]')
    );
    this.closeStoryModalButton = page.locator('[data-testid="close-story-modal"]').or(
      this.storyDetailModal.locator('button[aria-label="Close"]')
    );
  }

  /**
   * Navigate to kanban board page
   */
  async navigate() {
    await this.goto('/kanban');
  }

  /**
   * Filter stories by epic
   */
  async filterByEpic(epic: string) {
    await this.selectOption(this.epicFilter, epic);
    await this.waitForLoadingToComplete();
  }

  /**
   * Get column by status
   */
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

  /**
   * Get all story cards in a column
   */
  getCardsInColumn(status: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done') {
    const column = this.getColumn(status);
    return column.locator('[data-testid="story-card"]').or(
      column.locator('[class*="story-card"]')
    );
  }

  /**
   * Get card count in a column
   */
  async getCardCountInColumn(status: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done'): Promise<number> {
    return await this.getCardsInColumn(status).count();
  }

  /**
   * Get story card by title
   */
  getStoryCardByTitle(title: string) {
    return this.page.locator('[data-testid="story-card"]', { hasText: title });
  }

  /**
   * Click on a story card to view details
   */
  async clickStoryCard(title: string) {
    const card = this.getStoryCardByTitle(title);
    await card.click();
    await this.waitForElement(this.storyDetailModal);
  }

  /**
   * Drag story card from one column to another
   */
  async dragStoryCard(storyTitle: string, targetStatus: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done') {
    const card = this.getStoryCardByTitle(storyTitle);
    const targetColumn = this.getColumn(targetStatus);

    // Perform drag and drop
    await card.dragTo(targetColumn);
    await this.waitForLoadingToComplete();
  }

  /**
   * Check if story card exists in column
   */
  async isCardInColumn(storyTitle: string, status: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done'): Promise<boolean> {
    const column = this.getColumn(status);
    const card = column.locator('[data-testid="story-card"]', { hasText: storyTitle });
    return await this.isVisible(card);
  }

  /**
   * Get story card epic badge
   */
  getStoryEpicBadge(storyTitle: string) {
    const card = this.getStoryCardByTitle(storyTitle);
    return card.locator('[data-testid="story-epic-badge"]').or(
      card.locator('[class*="epic-badge"]')
    );
  }

  /**
   * Get story card status badge
   */
  getStoryStatusBadge(storyTitle: string) {
    const card = this.getStoryCardByTitle(storyTitle);
    return card.locator('[data-testid="story-status-badge"]').or(
      card.locator('[class*="status-badge"]')
    );
  }

  /**
   * Check if all 6 columns are visible
   */
  async areAllColumnsVisible(): Promise<boolean> {
    const columns = [
      this.backlogColumn,
      this.draftedColumn,
      this.readyColumn,
      this.inProgressColumn,
      this.reviewColumn,
      this.doneColumn,
    ];

    for (const column of columns) {
      if (!(await this.isVisible(column))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get column title
   */
  async getColumnTitle(status: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done'): Promise<string> {
    const column = this.getColumn(status);
    const title = column.locator('[data-testid="column-title"]').or(
      column.locator('h2, h3').first()
    );
    return await this.getTextContent(title);
  }

  /**
   * Close story detail modal
   */
  async closeStoryModal() {
    await this.clickElement(this.closeStoryModalButton);
  }

  /**
   * Check if story modal is visible
   */
  async isStoryModalVisible(): Promise<boolean> {
    return await this.isVisible(this.storyDetailModal);
  }

  /**
   * Get total story count across all columns
   */
  async getTotalStoryCount(): Promise<number> {
    return await this.storyCards.count();
  }

  /**
   * Wait for story card to appear in column (real-time update)
   */
  async waitForStoryInColumn(storyTitle: string, status: 'backlog' | 'drafted' | 'ready' | 'in-progress' | 'review' | 'done', timeout: number = 5000) {
    const column = this.getColumn(status);
    const card = column.locator('[data-testid="story-card"]', { hasText: storyTitle });
    await card.waitFor({ state: 'visible', timeout });
  }
}
