import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Projects List Page
 *
 * Route: /projects
 * Features:
 * - Project grid display
 * - Filtering by phase/status
 * - Search functionality
 * - Create project modal
 */
export class ProjectsListPage extends BasePage {
  readonly searchInput: Locator;
  readonly phaseFilter: Locator;
  readonly statusFilter: Locator;
  readonly createProjectButton: Locator;
  readonly projectCards: Locator;
  readonly createProjectModal: Locator;
  readonly projectNameInput: Locator;
  readonly projectConfigTextarea: Locator;
  readonly submitProjectButton: Locator;
  readonly cancelProjectButton: Locator;

  constructor(page: Page) {
    super(page);

    // Search and filters
    this.searchInput = page.locator('[data-testid="project-search"]').or(
      page.locator('input[placeholder*="Search"]')
    );
    this.phaseFilter = page.locator('[data-testid="phase-filter"]').or(
      page.locator('select[name="phase"]')
    );
    this.statusFilter = page.locator('[data-testid="status-filter"]').or(
      page.locator('select[name="status"]')
    );

    // Project grid
    this.createProjectButton = page.locator('[data-testid="create-project-button"]').or(
      page.locator('button', { hasText: 'Create Project' })
    );
    this.projectCards = page.locator('[data-testid="project-card"]').or(
      page.locator('[class*="project-card"]')
    );

    // Create project modal
    this.createProjectModal = page.locator('[data-testid="create-project-modal"]').or(
      page.locator('[role="dialog"]')
    );
    this.projectNameInput = page.locator('[data-testid="project-name-input"]').or(
      page.locator('input[name="name"]')
    );
    this.projectConfigTextarea = page.locator('[data-testid="project-config-textarea"]').or(
      page.locator('textarea[name="config"]')
    );
    this.submitProjectButton = page.locator('[data-testid="submit-project-button"]').or(
      this.createProjectModal.locator('button[type="submit"]')
    );
    this.cancelProjectButton = page.locator('[data-testid="cancel-project-button"]').or(
      this.createProjectModal.locator('button', { hasText: 'Cancel' })
    );
  }

  /**
   * Navigate to projects list page
   */
  async navigate() {
    await this.goto('/projects');
  }

  /**
   * Search for projects
   */
  async searchProjects(query: string) {
    await this.fillInput(this.searchInput, query);
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter projects by phase
   */
  async filterByPhase(phase: string) {
    await this.selectOption(this.phaseFilter, phase);
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter projects by status
   */
  async filterByStatus(status: string) {
    await this.selectOption(this.statusFilter, status);
    await this.waitForLoadingToComplete();
  }

  /**
   * Get all project cards
   */
  getProjectCards() {
    return this.projectCards;
  }

  /**
   * Get project card by name
   */
  getProjectCardByName(name: string) {
    return this.page.locator('[data-testid="project-card"]', { hasText: name });
  }

  /**
   * Click on a project card to view details
   */
  async clickProjectCard(projectName: string) {
    const card = this.getProjectCardByName(projectName);
    await card.click();
    await this.waitForPageLoad();
  }

  /**
   * Get project count
   */
  async getProjectCount(): Promise<number> {
    return await this.projectCards.count();
  }

  /**
   * Open create project modal
   */
  async openCreateProjectModal() {
    await this.clickElement(this.createProjectButton);
    await this.waitForElement(this.createProjectModal);
  }

  /**
   * Create a new project
   */
  async createProject(name: string, config?: string) {
    await this.openCreateProjectModal();
    await this.fillInput(this.projectNameInput, name);

    if (config) {
      await this.fillInput(this.projectConfigTextarea, config);
    }

    await this.clickElement(this.submitProjectButton);
    await this.waitForLoadingToComplete();
  }

  /**
   * Cancel project creation
   */
  async cancelProjectCreation() {
    await this.clickElement(this.cancelProjectButton);
  }

  /**
   * Check if create project modal is visible
   */
  async isCreateProjectModalVisible(): Promise<boolean> {
    return await this.isVisible(this.createProjectModal);
  }

  /**
   * Get project card status badge
   */
  getProjectStatus(projectName: string) {
    const card = this.getProjectCardByName(projectName);
    return card.locator('[data-testid="project-status-badge"]').or(
      card.locator('[class*="badge"]')
    );
  }

  /**
   * Get project card phase info
   */
  getProjectPhase(projectName: string) {
    const card = this.getProjectCardByName(projectName);
    return card.locator('[data-testid="project-phase"]').or(
      card.locator('[class*="phase"]')
    );
  }

  /**
   * Check if no projects message is displayed
   */
  async hasNoProjectsMessage(): Promise<boolean> {
    const noProjectsMessage = this.page.locator('[data-testid="no-projects"]').or(
      this.page.locator('text=No projects found')
    );
    return await this.isVisible(noProjectsMessage);
  }
}
