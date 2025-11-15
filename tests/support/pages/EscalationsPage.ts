import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Escalations Page
 *
 * Route: /escalations
 * Features:
 * - Escalation list with cards
 * - Status/priority filters
 * - Escalation detail modal
 * - Response submission
 */
export class EscalationsPage extends BasePage {
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly escalationCards: Locator;
  readonly escalationDetailModal: Locator;
  readonly escalationQuestion: Locator;
  readonly escalationReasoning: Locator;
  readonly escalationAiAnalysis: Locator;
  readonly responseTextarea: Locator;
  readonly submitResponseButton: Locator;
  readonly closeModalButton: Locator;

  constructor(page: Page) {
    super(page);

    // Filters
    this.statusFilter = page.locator('[data-testid="escalation-status-filter"]').or(
      page.locator('select[name="status"]')
    );
    this.priorityFilter = page.locator('[data-testid="escalation-priority-filter"]').or(
      page.locator('select[name="priority"]')
    );

    // Escalation list
    this.escalationCards = page.locator('[data-testid="escalation-card"]').or(
      page.locator('[class*="escalation-card"]')
    );

    // Escalation detail modal
    this.escalationDetailModal = page.locator('[data-testid="escalation-detail-modal"]').or(
      page.locator('[role="dialog"]')
    );
    this.escalationQuestion = page.locator('[data-testid="escalation-question"]').or(
      this.escalationDetailModal.locator('[class*="question"]')
    );
    this.escalationReasoning = page.locator('[data-testid="escalation-reasoning"]').or(
      this.escalationDetailModal.locator('[class*="reasoning"]')
    );
    this.escalationAiAnalysis = page.locator('[data-testid="escalation-ai-analysis"]').or(
      this.escalationDetailModal.locator('[class*="ai-analysis"]')
    );
    this.responseTextarea = page.locator('[data-testid="escalation-response-textarea"]').or(
      this.escalationDetailModal.locator('textarea[name="response"]')
    );
    this.submitResponseButton = page.locator('[data-testid="submit-escalation-response"]').or(
      this.escalationDetailModal.locator('button[type="submit"]')
    );
    this.closeModalButton = page.locator('[data-testid="close-escalation-modal"]').or(
      this.escalationDetailModal.locator('button[aria-label="Close"]')
    );
  }

  /**
   * Navigate to escalations page
   */
  async navigate() {
    await this.goto('/escalations');
  }

  /**
   * Filter escalations by status
   */
  async filterByStatus(status: string) {
    await this.selectOption(this.statusFilter, status);
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter escalations by priority
   */
  async filterByPriority(priority: string) {
    await this.selectOption(this.priorityFilter, priority);
    await this.waitForLoadingToComplete();
  }

  /**
   * Get all escalation cards
   */
  getEscalationCards() {
    return this.escalationCards;
  }

  /**
   * Get escalation count
   */
  async getEscalationCount(): Promise<number> {
    return await this.escalationCards.count();
  }

  /**
   * Get escalation card by index
   */
  getEscalationCardByIndex(index: number) {
    return this.escalationCards.nth(index);
  }

  /**
   * Click on an escalation card to view details
   */
  async clickEscalationCard(index: number) {
    const card = this.getEscalationCardByIndex(index);
    await card.click();
    await this.waitForElement(this.escalationDetailModal);
  }

  /**
   * Open escalation detail modal by clicking first card
   */
  async openFirstEscalation() {
    await this.clickEscalationCard(0);
  }

  /**
   * Check if modal is visible
   */
  async isModalVisible(): Promise<boolean> {
    return await this.isVisible(this.escalationDetailModal);
  }

  /**
   * Get escalation question from modal
   */
  async getEscalationQuestion(): Promise<string> {
    return await this.getTextContent(this.escalationQuestion);
  }

  /**
   * Get escalation reasoning from modal
   */
  async getEscalationReasoning(): Promise<string> {
    return await this.getTextContent(this.escalationReasoning);
  }

  /**
   * Get AI analysis from modal
   */
  async getAiAnalysis(): Promise<string> {
    return await this.getTextContent(this.escalationAiAnalysis);
  }

  /**
   * Submit escalation response
   */
  async submitResponse(response: string) {
    await this.fillInput(this.responseTextarea, response);
    await this.clickElement(this.submitResponseButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Close escalation modal
   */
  async closeModal() {
    await this.clickElement(this.closeModalButton);
  }

  /**
   * Get escalation status badge from card
   */
  getEscalationStatus(cardIndex: number) {
    const card = this.getEscalationCardByIndex(cardIndex);
    return card.locator('[data-testid="escalation-status-badge"]').or(
      card.locator('[class*="status-badge"]')
    );
  }

  /**
   * Get escalation priority badge from card
   */
  getEscalationPriority(cardIndex: number) {
    const card = this.getEscalationCardByIndex(cardIndex);
    return card.locator('[data-testid="escalation-priority-badge"]').or(
      card.locator('[class*="priority-badge"]')
    );
  }

  /**
   * Check if no escalations message is displayed
   */
  async hasNoEscalationsMessage(): Promise<boolean> {
    const noEscalationsMessage = this.page.locator('[data-testid="no-escalations"]').or(
      this.page.locator('text=No escalations found')
    );
    return await this.isVisible(noEscalationsMessage);
  }

  /**
   * Wait for escalation to be resolved (status change)
   */
  async waitForEscalationResolution(cardIndex: number, timeout: number = 5000) {
    const statusBadge = this.getEscalationStatus(cardIndex);
    await this.page.waitForFunction(
      (badge) => {
        const text = badge?.textContent?.toLowerCase() || '';
        return text.includes('resolved') || text.includes('completed');
      },
      statusBadge,
      { timeout }
    );
  }
}
