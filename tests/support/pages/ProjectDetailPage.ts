import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Project Detail Page
 *
 * Route: /projects/:id
 * Features:
 * - Phase progress stepper
 * - Active agents list
 * - Event timeline
 * - Quick actions panel
 */
export class ProjectDetailPage extends BasePage {
  readonly phaseProgressStepper: Locator;
  readonly activeAgentsList: Locator;
  readonly eventTimeline: Locator;
  readonly quickActionsPanel: Locator;
  readonly backToListButton: Locator;
  readonly startProjectButton: Locator;
  readonly pauseProjectButton: Locator;
  readonly resumeProjectButton: Locator;
  readonly deleteProjectButton: Locator;

  constructor(page: Page) {
    super(page);

    // Main sections
    this.phaseProgressStepper = page.locator('[data-testid="phase-progress-stepper"]').or(
      page.locator('[class*="phase-stepper"]')
    );
    this.activeAgentsList = page.locator('[data-testid="active-agents-list"]').or(
      page.locator('[class*="agents-list"]')
    );
    this.eventTimeline = page.locator('[data-testid="event-timeline"]').or(
      page.locator('[class*="timeline"]')
    );
    this.quickActionsPanel = page.locator('[data-testid="quick-actions"]').or(
      page.locator('[class*="quick-actions"]')
    );

    // Navigation and actions
    this.backToListButton = page.locator('[data-testid="back-to-list"]').or(
      page.locator('button', { hasText: 'Back' })
    );
    this.startProjectButton = page.locator('[data-testid="start-project"]').or(
      page.locator('button', { hasText: 'Start' })
    );
    this.pauseProjectButton = page.locator('[data-testid="pause-project"]').or(
      page.locator('button', { hasText: 'Pause' })
    );
    this.resumeProjectButton = page.locator('[data-testid="resume-project"]').or(
      page.locator('button', { hasText: 'Resume' })
    );
    this.deleteProjectButton = page.locator('[data-testid="delete-project"]').or(
      page.locator('button', { hasText: 'Delete' })
    );
  }

  /**
   * Navigate to project detail page
   */
  async navigate(projectId: string) {
    await this.goto(`/projects/${projectId}`);
  }

  /**
   * Get current phase from stepper
   */
  async getCurrentPhase(): Promise<string> {
    const activePhase = this.phaseProgressStepper.locator('[data-active="true"]').or(
      this.phaseProgressStepper.locator('[class*="active"]')
    ).first();
    return await this.getTextContent(activePhase);
  }

  /**
   * Get all phases from stepper
   */
  getPhaseSteps() {
    return this.phaseProgressStepper.locator('[data-testid="phase-step"]').or(
      this.phaseProgressStepper.locator('[class*="step"]')
    );
  }

  /**
   * Get phase count
   */
  async getPhaseCount(): Promise<number> {
    return await this.getPhaseSteps().count();
  }

  /**
   * Get active agents
   */
  getActiveAgents() {
    return this.activeAgentsList.locator('[data-testid="agent-item"]').or(
      this.activeAgentsList.locator('li')
    );
  }

  /**
   * Get active agents count
   */
  async getActiveAgentsCount(): Promise<number> {
    return await this.getActiveAgents().count();
  }

  /**
   * Get agent by name
   */
  getAgentByName(name: string) {
    return this.activeAgentsList.locator('[data-testid="agent-item"]', { hasText: name });
  }

  /**
   * Get timeline events
   */
  getTimelineEvents() {
    return this.eventTimeline.locator('[data-testid="timeline-event"]').or(
      this.eventTimeline.locator('[class*="event"]')
    );
  }

  /**
   * Get timeline events count
   */
  async getTimelineEventsCount(): Promise<number> {
    return await this.getTimelineEvents().count();
  }

  /**
   * Get latest timeline event
   */
  getLatestEvent() {
    return this.getTimelineEvents().first();
  }

  /**
   * Start project
   */
  async startProject() {
    await this.clickElement(this.startProjectButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Pause project
   */
  async pauseProject() {
    await this.clickElement(this.pauseProjectButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Resume project
   */
  async resumeProject() {
    await this.clickElement(this.resumeProjectButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Delete project
   */
  async deleteProject() {
    await this.clickElement(this.deleteProjectButton);
    // Handle confirmation dialog if present
    const confirmButton = this.page.locator('button', { hasText: 'Confirm' });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    await this.waitForLoadingToComplete();
  }

  /**
   * Navigate back to projects list
   */
  async goBackToList() {
    await this.clickElement(this.backToListButton);
    await this.waitForPageLoad();
  }

  /**
   * Check if phase stepper is visible
   */
  async isPhaseStepperVisible(): Promise<boolean> {
    return await this.isVisible(this.phaseProgressStepper);
  }

  /**
   * Check if active agents list is visible
   */
  async isActiveAgentsListVisible(): Promise<boolean> {
    return await this.isVisible(this.activeAgentsList);
  }

  /**
   * Check if event timeline is visible
   */
  async isEventTimelineVisible(): Promise<boolean> {
    return await this.isVisible(this.eventTimeline);
  }

  /**
   * Check if quick actions panel is visible
   */
  async isQuickActionsPanelVisible(): Promise<boolean> {
    return await this.isVisible(this.quickActionsPanel);
  }

  /**
   * Get project title
   */
  async getProjectTitle(): Promise<string> {
    const title = this.page.locator('h1').first();
    return await this.getTextContent(title);
  }
}
