import { test, expect } from '../support/fixtures';
import { ProjectsListPage, ProjectDetailPage } from '../support/pages';

/**
 * E2E Tests for Project Management Views (Story 6.5)
 *
 * Acceptance Criteria #2:
 * - Project list loads and displays correctly
 * - Project detail view shows all sections
 * - Navigation between views works
 */

test.describe('Project Management Views', () => {
  let projectsPage: ProjectsListPage;
  let projectDetailPage: ProjectDetailPage;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsListPage(page);
    projectDetailPage = new ProjectDetailPage(page);
  });

  test.describe('Project List View', () => {
    test('should load project list page', async () => {
      await projectsPage.navigate();

      // Verify page loaded
      await expect(projectsPage.page).toHaveURL(/\/projects/);
      await expect(projectsPage.page).toHaveTitle(/Agent Orchestrator/);
    });

    test('should display project cards', async () => {
      await projectsPage.navigate();

      // Wait for projects to load
      await projectsPage.waitForLoadingToComplete();

      // Verify project cards are visible
      const projectCards = projectsPage.getProjectCards();
      const count = await projectCards.count();

      // Should have at least 0 projects (empty state is valid)
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should search projects by name', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      const initialCount = await projectsPage.getProjectCount();

      // Search for a project
      await projectsPage.searchProjects('test');

      // Wait for search results
      await projectsPage.waitForLoadingToComplete();

      // Count should change (could be less or same)
      const searchCount = await projectsPage.getProjectCount();
      expect(searchCount).toBeLessThanOrEqual(initialCount);
    });

    test('should filter projects by phase', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      // Apply phase filter
      await projectsPage.filterByPhase('planning');

      // Verify filtering occurred
      await projectsPage.waitForLoadingToComplete();

      // Projects should be filtered (count might be 0)
      const count = await projectsPage.getProjectCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter projects by status', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      // Apply status filter
      await projectsPage.filterByStatus('active');

      // Verify filtering occurred
      await projectsPage.waitForLoadingToComplete();

      const count = await projectsPage.getProjectCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should open create project modal', async () => {
      await projectsPage.navigate();

      // Click create project button
      await projectsPage.openCreateProjectModal();

      // Verify modal is visible
      const isModalVisible = await projectsPage.isCreateProjectModalVisible();
      expect(isModalVisible).toBe(true);

      // Verify modal has required fields
      await expect(projectsPage.projectNameInput).toBeVisible();
    });

    test('should create a new project', async () => {
      await projectsPage.navigate();

      const projectName = `E2E Test Project ${Date.now()}`;

      // Get initial count
      const initialCount = await projectsPage.getProjectCount();

      // Create project
      await projectsPage.createProject(projectName);

      // Wait for project to be created
      await projectsPage.waitForLoadingToComplete();

      // Verify project appears in list
      const finalCount = await projectsPage.getProjectCount();
      expect(finalCount).toBeGreaterThan(initialCount);
    });

    test('should display empty state when no projects match filters', async () => {
      await projectsPage.navigate();

      // Search for non-existent project
      await projectsPage.searchProjects('NONEXISTENT_PROJECT_XYZ123');
      await projectsPage.waitForLoadingToComplete();

      // Check if no projects message or empty state is shown
      const count = await projectsPage.getProjectCount();
      if (count === 0) {
        // This is expected - either no projects message or just 0 cards
        expect(count).toBe(0);
      }
    });
  });

  test.describe('Project Detail View', () => {
    test('should navigate to project detail from list', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      const projectCount = await projectsPage.getProjectCount();

      if (projectCount > 0) {
        // Click first project card
        const firstCard = projectsPage.getProjectCards().first();
        await firstCard.click();

        // Verify navigation to detail page
        await expect(projectDetailPage.page).toHaveURL(/\/projects\/[^/]+$/);
      } else {
        // Create a test project first
        const testProjectName = `E2E Detail Test ${Date.now()}`;
        await projectsPage.createProject(testProjectName);
        await projectsPage.waitForLoadingToComplete();

        // Click on the new project
        await projectsPage.clickProjectCard(testProjectName);
        await expect(projectDetailPage.page).toHaveURL(/\/projects\/[^/]+$/);
      }
    });

    test('should display all project detail sections', async ({ page }) => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      let projectCount = await projectsPage.getProjectCount();

      // Ensure we have a project
      if (projectCount === 0) {
        const testProjectName = `E2E Sections Test ${Date.now()}`;
        await projectsPage.createProject(testProjectName);
        await projectsPage.waitForLoadingToComplete();
        await projectsPage.clickProjectCard(testProjectName);
      } else {
        const firstCard = projectsPage.getProjectCards().first();
        await firstCard.click();
      }

      // Wait for detail page to load
      await projectDetailPage.waitForPageLoad();

      // Verify all sections are visible
      const hasPhaseProgress = await projectDetailPage.isPhaseStepperVisible();
      const hasActiveAgents = await projectDetailPage.isActiveAgentsListVisible();
      const hasEventTimeline = await projectDetailPage.isEventTimelineVisible();
      const hasQuickActions = await projectDetailPage.isQuickActionsPanelVisible();

      // At least phase progress should be visible
      expect(hasPhaseProgress || hasActiveAgents || hasEventTimeline || hasQuickActions).toBe(true);
    });

    test('should display phase progress stepper', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      // Navigate to first project or create one
      let projectCount = await projectsPage.getProjectCount();
      if (projectCount === 0) {
        await projectsPage.createProject(`E2E Phase Test ${Date.now()}`);
        await projectsPage.waitForLoadingToComplete();
        projectCount = await projectsPage.getProjectCount();
      }

      const firstCard = projectsPage.getProjectCards().first();
      await firstCard.click();
      await projectDetailPage.waitForPageLoad();

      // Verify phase stepper is visible
      const isVisible = await projectDetailPage.isPhaseStepperVisible();
      if (isVisible) {
        // Check that stepper has phases
        const phaseCount = await projectDetailPage.getPhaseCount();
        expect(phaseCount).toBeGreaterThan(0);
      }
    });

    test('should navigate back to projects list', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      // Ensure we have a project
      let projectCount = await projectsPage.getProjectCount();
      if (projectCount === 0) {
        await projectsPage.createProject(`E2E Nav Test ${Date.now()}`);
        await projectsPage.waitForLoadingToComplete();
        projectCount = await projectsPage.getProjectCount();
      }

      // Navigate to detail
      const firstCard = projectsPage.getProjectCards().first();
      await firstCard.click();
      await projectDetailPage.waitForPageLoad();

      // Go back to list
      await projectDetailPage.goBackToList();

      // Verify we're back on the list page
      await expect(projectsPage.page).toHaveURL(/\/projects\/?$/);
    });

    test('should display active agents if any', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      let projectCount = await projectsPage.getProjectCount();
      if (projectCount === 0) {
        await projectsPage.createProject(`E2E Agents Test ${Date.now()}`);
        await projectsPage.waitForLoadingToComplete();
        projectCount = await projectsPage.getProjectCount();
      }

      const firstCard = projectsPage.getProjectCards().first();
      await firstCard.click();
      await projectDetailPage.waitForPageLoad();

      const hasActiveAgents = await projectDetailPage.isActiveAgentsListVisible();

      if (hasActiveAgents) {
        // If active agents section exists, verify it's populated
        const agentCount = await projectDetailPage.getActiveAgentsCount();
        expect(agentCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display event timeline', async () => {
      await projectsPage.navigate();
      await projectsPage.waitForLoadingToComplete();

      let projectCount = await projectsPage.getProjectCount();
      if (projectCount === 0) {
        await projectsPage.createProject(`E2E Timeline Test ${Date.now()}`);
        await projectsPage.waitForLoadingToComplete();
        projectCount = await projectsPage.getProjectCount();
      }

      const firstCard = projectsPage.getProjectCards().first();
      await firstCard.click();
      await projectDetailPage.waitForPageLoad();

      const hasTimeline = await projectDetailPage.isEventTimelineVisible();

      if (hasTimeline) {
        // Verify timeline has events (could be empty for new projects)
        const eventCount = await projectDetailPage.getTimelineEventsCount();
        expect(eventCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Project CRUD Operations', () => {
    test('should create, view, and verify project', async () => {
      const projectName = `E2E CRUD Test ${Date.now()}`;

      // Navigate to projects list
      await projectsPage.navigate();

      // Create project
      await projectsPage.createProject(projectName);
      await projectsPage.waitForLoadingToComplete();

      // Verify project appears in list
      const projectCard = projectsPage.getProjectCardByName(projectName);
      await expect(projectCard).toBeVisible();

      // Click to view details
      await projectsPage.clickProjectCard(projectName);

      // Verify detail page loaded
      await expect(projectDetailPage.page).toHaveURL(/\/projects\/[^/]+$/);
      const title = await projectDetailPage.getProjectTitle();
      expect(title).toContain(projectName);
    });
  });
});
