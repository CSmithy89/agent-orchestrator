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
  readonly startWorkflowButton: Locator;
  readonly startWorkflowDialog: Locator;
  readonly workflowSelectCombobox: Locator;

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

    // Start Workflow Dialog
    this.startWorkflowButton = page.locator('button', { hasText: 'Start Workflow' });
    this.startWorkflowDialog = page.locator('[role="dialog"]', { hasText: 'Start Workflow' });
    this.workflowSelectCombobox = this.startWorkflowDialog.locator('[role="combobox"]');
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

  /**
   * Open Start Workflow dialog
   */
  async openStartWorkflowDialog() {
    await this.clickElement(this.startWorkflowButton);
    await this.startWorkflowDialog.waitFor({ state: 'visible' });
  }

  /**
   * Select workflow from dialog
   */
  async selectWorkflow(workflowName: string) {
    await this.workflowSelectCombobox.click();
    await this.page.locator('[role="option"]', { hasText: workflowName }).click();
  }

  /**
   * Start selected workflow
   */
  async startWorkflow(workflowName: string) {
    await this.openStartWorkflowDialog();
    await this.selectWorkflow(workflowName);

    const startButton = this.startWorkflowDialog.locator('button', { hasText: 'Start Workflow' }).last();
    await startButton.click();

    // Wait for dialog to close
    await this.startWorkflowDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Check if Start Workflow dialog is visible
   */
  async isStartWorkflowDialogVisible(): Promise<boolean> {
    return await this.isVisible(this.startWorkflowDialog);
  }

  /**
   * Get available workflows in dialog
   */
  async getAvailableWorkflows(): Promise<string[]> {
    await this.workflowSelectCombobox.click();
    const options = this.page.locator('[role="option"]');
    const count = await options.count();
    const workflows: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) workflows.push(text.trim());
    }

    // Close dropdown
    await this.workflowSelectCombobox.click();

    return workflows;
  }

  /**
   * Click phase button to expand/collapse workflows
   */
  async togglePhaseWorkflows(phaseName: string) {
    const phaseButton = this.page.locator('button', { hasText: phaseName }).first();
    await phaseButton.click();
  }

  /**
   * Check if phase workflows are expanded
   */
  async arePhaseWorkflowsExpanded(phaseName: string): Promise<boolean> {
    // Look for the workflows list under the phase
    const workflowsList = this.page.locator(`text=${phaseName}`).locator('..').locator('text=Workflows:');
    return await this.isVisible(workflowsList);
  }

  /**
   * Get workflows for a phase
   */
  async getPhaseWorkflows(phaseName: string): Promise<string[]> {
    // Make sure phase is expanded
    const isExpanded = await this.arePhaseWorkflowsExpanded(phaseName);
    if (!isExpanded) {
      await this.togglePhaseWorkflows(phaseName);
    }

    // Get all workflow items after "Workflows:" text
    const workflowItems = this.page.locator(`text=${phaseName}`).locator('..').locator('text=/^[A-Z]/').filter({ has: this.page.locator('text=/^[A-Z]/')});
    const count = await workflowItems.count();
    const workflows: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await workflowItems.nth(i).textContent();
      if (text && text !== phaseName && text !== 'Workflows:') {
        workflows.push(text.trim());
      }
    }

    return workflows;
  }

  /**
   * Get project status badge text
   */
  async getProjectStatus(): Promise<string> {
    const statusBadge = this.page.locator('[data-testid="project-status"]').or(
      this.page.locator('text=/pending|active|completed|paused/i').first()
    );
    return await this.getTextContent(statusBadge);
  }

  /**
   * Click View Docs dropdown
   */
  async openViewDocsDropdown() {
    const viewDocsButton = this.page.locator('button', { hasText: 'View Docs' });
    await this.clickElement(viewDocsButton);
    await this.page.waitForTimeout(300); // Wait for dropdown animation
  }

  /**
   * Get available documents from View Docs dropdown
   */
  async getAvailableDocuments(): Promise<string[]> {
    await this.openViewDocsDropdown();

    const docItems = this.page.locator('[role="menuitem"]').or(
      this.page.locator('[data-testid^="doc-"]')
    );

    const count = await docItems.count();
    const documents: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await docItems.nth(i).textContent();
      if (text) documents.push(text.trim());
    }

    // Close dropdown by pressing Escape
    await this.page.keyboard.press('Escape');

    return documents;
  }

  /**
   * Check if a document is available in View Docs
   */
  async hasDocument(documentName: string): Promise<boolean> {
    const docs = await this.getAvailableDocuments();
    return docs.some(doc => doc.toLowerCase().includes(documentName.toLowerCase()));
  }

  /**
   * Wait for workflow to complete
   * Polls the project status until it changes from 'active' to something else
   */
  async waitForWorkflowCompletion(timeoutMs: number = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getProjectStatus();

      if (status.toLowerCase() !== 'active') {
        return; // Workflow completed
      }

      await this.page.waitForTimeout(2000); // Poll every 2 seconds
    }

    throw new Error(`Workflow did not complete within ${timeoutMs}ms`);
  }

  /**
   * Get completed task count from phase stepper
   */
  async getCompletedTaskCount(): Promise<number> {
    // Look for completed checkmarks in the phase stepper
    const completedTasks = this.phaseProgressStepper.locator('[data-completed="true"]').or(
      this.phaseProgressStepper.locator('.completed').or(
        this.phaseProgressStepper.locator('svg').filter({ hasText: 'check' })
      )
    );

    return await completedTasks.count();
  }
}
