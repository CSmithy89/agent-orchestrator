import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 *
 * Provides common functionality for all page objects including:
 * - Navigation helpers
 * - Common UI elements (header, sidebar)
 * - Wait utilities
 * - Accessibility helpers
 */
export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly sidebar: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.sidebar = page.locator('[data-testid="sidebar"]').or(page.locator('nav[aria-label="Main navigation"]'));
    this.mainContent = page.locator('main');
  }

  /**
   * Navigate to a specific route
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(locator: Locator, timeout: number = 5000) {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Click an element with optional wait
   */
  async clickElement(locator: Locator) {
    await locator.click();
  }

  /**
   * Fill input field
   */
  async fillInput(locator: Locator, value: string) {
    await locator.fill(value);
  }

  /**
   * Get text content of an element
   */
  async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent()) || '';
  }

  /**
   * Check if element has specific text
   */
  async hasText(locator: Locator, text: string): Promise<boolean> {
    const content = await this.getTextContent(locator);
    return content.includes(text);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(locator: Locator, value: string) {
    await locator.selectOption(value);
  }

  /**
   * Check accessibility with axe-core
   */
  async checkAccessibility() {
    // Note: Requires @axe-core/playwright to be installed
    // This is a placeholder for accessibility testing
    // await injectAxe(this.page);
    // const results = await checkA11y(this.page);
    // return results;
  }

  /**
   * Get all navigation links
   */
  getNavigationLinks() {
    return this.sidebar.locator('a');
  }

  /**
   * Navigate using sidebar link
   */
  async navigateToPage(linkText: string) {
    const link = this.sidebar.locator('a', { hasText: linkText });
    await link.click();
    await this.waitForPageLoad();
  }

  /**
   * Check if page has error message
   */
  async hasErrorMessage(): Promise<boolean> {
    const errorLocator = this.page.locator('[role="alert"]').or(
      this.page.locator('[data-testid="error-message"]')
    );
    return await errorLocator.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const errorLocator = this.page.locator('[role="alert"]').or(
      this.page.locator('[data-testid="error-message"]')
    );
    return await this.getTextContent(errorLocator);
  }

  /**
   * Check if loading state is present
   */
  async isLoading(): Promise<boolean> {
    const loadingLocator = this.page.locator('[data-testid="loading"]').or(
      this.page.locator('[aria-label="Loading"]')
    );
    return await loadingLocator.isVisible();
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingToComplete(timeout: number = 10000) {
    const loadingLocator = this.page.locator('[data-testid="loading"]').or(
      this.page.locator('[aria-label="Loading"]')
    );
    await loadingLocator.waitFor({ state: 'hidden', timeout }).catch(() => {
      // Loading indicator might not appear for fast requests
    });
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `tests/reports/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back
   */
  async goBack() {
    await this.page.goBack();
    await this.waitForPageLoad();
  }
}
