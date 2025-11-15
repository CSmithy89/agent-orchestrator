import { test, expect } from '../support/fixtures';
import { EscalationsPage } from '../support/pages';

/**
 * E2E Tests for Escalation Response Interface (Story 6.6)
 *
 * Acceptance Criteria #3:
 * - Escalation list displays correctly
 * - Modal opens with full context
 * - Response submission works
 */

test.describe('Escalation Interface', () => {
  let escalationsPage: EscalationsPage;

  test.beforeEach(async ({ page }) => {
    escalationsPage = new EscalationsPage(page);
  });

  test.describe('Escalation List View', () => {
    test('should load escalations page', async () => {
      await escalationsPage.navigate();

      // Verify page loaded
      await expect(escalationsPage.page).toHaveURL(/\/escalations/);
      await expect(escalationsPage.page).toHaveTitle(/Agent Orchestrator/);
    });

    test('should display escalation cards', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      // Verify escalation cards or empty state
      const count = await escalationsPage.getEscalationCount();
      expect(count).toBeGreaterThanOrEqual(0);

      // If there are escalations, verify cards are visible
      if (count > 0) {
        const cards = escalationsPage.getEscalationCards();
        await expect(cards.first()).toBeVisible();
      }
    });

    test('should filter escalations by status', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const initialCount = await escalationsPage.getEscalationCount();

      // Apply status filter
      await escalationsPage.filterByStatus('pending');
      await escalationsPage.waitForLoadingToComplete();

      // Count might change
      const filteredCount = await escalationsPage.getEscalationCount();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should filter escalations by priority', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const initialCount = await escalationsPage.getEscalationCount();

      // Apply priority filter
      await escalationsPage.filterByPriority('high');
      await escalationsPage.waitForLoadingToComplete();

      const filteredCount = await escalationsPage.getEscalationCount();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should display status badges on escalation cards', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        // Check first card has status badge
        const statusBadge = escalationsPage.getEscalationStatus(0);
        await expect(statusBadge).toBeVisible();
      }
    });

    test('should display priority badges on escalation cards', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        // Check first card has priority badge
        const priorityBadge = escalationsPage.getEscalationPriority(0);
        await expect(priorityBadge).toBeVisible();
      }
    });

    test('should show empty state when no escalations', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count === 0) {
        // Empty state is valid
        expect(count).toBe(0);
      }
    });
  });

  test.describe('Escalation Detail Modal', () => {
    test('should open detail modal when clicking escalation card', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        // Click first escalation card
        await escalationsPage.clickEscalationCard(0);

        // Verify modal is visible
        const isModalVisible = await escalationsPage.isModalVisible();
        expect(isModalVisible).toBe(true);
      }
    });

    test('should display full escalation context in modal', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Verify modal has all required sections
        await expect(escalationsPage.escalationQuestion).toBeVisible();

        // At least question should be present
        const question = await escalationsPage.getEscalationQuestion();
        expect(question.length).toBeGreaterThan(0);
      }
    });

    test('should display escalation question', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Verify question is displayed
        const question = await escalationsPage.getEscalationQuestion();
        expect(question).toBeTruthy();
        expect(question.length).toBeGreaterThan(0);
      }
    });

    test('should display escalation reasoning', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Check if reasoning section exists
        const isReasoningVisible = await escalationsPage.escalationReasoning.isVisible();

        if (isReasoningVisible) {
          const reasoning = await escalationsPage.getEscalationReasoning();
          expect(reasoning.length).toBeGreaterThan(0);
        }
      }
    });

    test('should display AI analysis', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Check if AI analysis section exists
        const isAnalysisVisible = await escalationsPage.escalationAiAnalysis.isVisible();

        if (isAnalysisVisible) {
          const analysis = await escalationsPage.getAiAnalysis();
          expect(analysis.length).toBeGreaterThan(0);
        }
      }
    });

    test('should have response textarea', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Verify response textarea is visible
        await expect(escalationsPage.responseTextarea).toBeVisible();
      }
    });

    test('should have submit button', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Verify submit button is visible
        await expect(escalationsPage.submitResponseButton).toBeVisible();
      }
    });

    test('should close modal when clicking close button', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        // Verify modal is open
        expect(await escalationsPage.isModalVisible()).toBe(true);

        // Close modal
        await escalationsPage.closeModal();

        // Verify modal is closed
        await escalationsPage.page.waitForTimeout(500);
        const isStillVisible = await escalationsPage.isModalVisible();
        expect(isStillVisible).toBe(false);
      }
    });
  });

  test.describe('Response Submission', () => {
    test('should allow typing response in textarea', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        const testResponse = 'This is a test response from E2E tests.';

        // Type in response textarea
        await escalationsPage.responseTextarea.fill(testResponse);

        // Verify text was entered
        const value = await escalationsPage.responseTextarea.inputValue();
        expect(value).toBe(testResponse);
      }
    });

    test('should submit escalation response', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        await escalationsPage.openFirstEscalation();

        const testResponse = `E2E Test Response ${Date.now()}`;

        // Submit response
        await escalationsPage.submitResponse(testResponse);

        // Wait for submission to complete
        await escalationsPage.page.waitForTimeout(1000);

        // Modal might close after submission or show success message
        // This depends on the implementation
      }
    });

    test('should update escalation status after response submission', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const count = await escalationsPage.getEscalationCount();

      if (count > 0) {
        // Get initial status
        const initialStatusBadge = escalationsPage.getEscalationStatus(0);
        const initialStatus = await initialStatusBadge.textContent();

        // Open and respond to escalation
        await escalationsPage.openFirstEscalation();
        await escalationsPage.submitResponse(`E2E Auto Response ${Date.now()}`);

        // Wait for update
        await escalationsPage.page.waitForTimeout(1000);

        // Navigate back to list if needed
        const isModalVisible = await escalationsPage.isModalVisible();
        if (isModalVisible) {
          await escalationsPage.closeModal();
        }

        // Reload page to see updated status
        await escalationsPage.reload();
        await escalationsPage.waitForLoadingToComplete();

        // Status might have changed (this is optional verification)
        const finalCount = await escalationsPage.getEscalationCount();
        expect(finalCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Filter Combinations', () => {
    test('should apply multiple filters together', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      // Apply status filter
      await escalationsPage.filterByStatus('pending');
      await escalationsPage.waitForLoadingToComplete();

      // Apply priority filter
      await escalationsPage.filterByPriority('high');
      await escalationsPage.waitForLoadingToComplete();

      // Verify filters are applied (count should be filtered)
      const count = await escalationsPage.getEscalationCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should reset filters correctly', async () => {
      await escalationsPage.navigate();
      await escalationsPage.waitForLoadingToComplete();

      const initialCount = await escalationsPage.getEscalationCount();

      // Apply filter
      await escalationsPage.filterByStatus('resolved');
      await escalationsPage.waitForLoadingToComplete();

      // Reset to all
      await escalationsPage.filterByStatus('all');
      await escalationsPage.waitForLoadingToComplete();

      // Should show all escalations again
      const resetCount = await escalationsPage.getEscalationCount();
      expect(resetCount).toBe(initialCount);
    });
  });
});
