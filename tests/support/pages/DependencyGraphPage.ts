import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Dependency Graph Page
 *
 * Route: /dependencies
 * Features:
 * - D3.js graph visualization
 * - Pan, zoom, drag interactions
 * - Layout algorithm selector
 * - Epic/status filters
 * - Export functions (PNG, SVG, JSON)
 */
export class DependencyGraphPage extends BasePage {
  readonly graphContainer: Locator;
  readonly graphSvg: Locator;
  readonly layoutSelector: Locator;
  readonly epicFilter: Locator;
  readonly statusFilter: Locator;
  readonly exportPngButton: Locator;
  readonly exportSvgButton: Locator;
  readonly exportJsonButton: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly resetZoomButton: Locator;
  readonly storyNodes: Locator;
  readonly dependencyEdges: Locator;
  readonly nodeTooltip: Locator;

  constructor(page: Page) {
    super(page);

    // Graph container
    this.graphContainer = page.locator('[data-testid="dependency-graph-container"]').or(
      page.locator('[class*="graph-container"]')
    );
    this.graphSvg = page.locator('svg[data-testid="dependency-graph"]').or(
      this.graphContainer.locator('svg').first()
    );

    // Controls
    this.layoutSelector = page.locator('[data-testid="layout-selector"]').or(
      page.locator('select[name="layout"]')
    );
    this.epicFilter = page.locator('[data-testid="graph-epic-filter"]').or(
      page.locator('select[name="epic"]')
    );
    this.statusFilter = page.locator('[data-testid="graph-status-filter"]').or(
      page.locator('select[name="status"]')
    );

    // Export buttons
    this.exportPngButton = page.locator('[data-testid="export-png"]').or(
      page.locator('button', { hasText: 'PNG' })
    );
    this.exportSvgButton = page.locator('[data-testid="export-svg"]').or(
      page.locator('button', { hasText: 'SVG' })
    );
    this.exportJsonButton = page.locator('[data-testid="export-json"]').or(
      page.locator('button', { hasText: 'JSON' })
    );

    // Zoom controls
    this.zoomInButton = page.locator('[data-testid="zoom-in"]').or(
      page.locator('button[aria-label="Zoom in"]')
    );
    this.zoomOutButton = page.locator('[data-testid="zoom-out"]').or(
      page.locator('button[aria-label="Zoom out"]')
    );
    this.resetZoomButton = page.locator('[data-testid="reset-zoom"]').or(
      page.locator('button[aria-label="Reset zoom"]')
    );

    // Graph elements
    this.storyNodes = this.graphSvg.locator('[data-testid="story-node"]').or(
      this.graphSvg.locator('circle.node')
    );
    this.dependencyEdges = this.graphSvg.locator('[data-testid="dependency-edge"]').or(
      this.graphSvg.locator('line.edge, path.edge')
    );
    this.nodeTooltip = page.locator('[data-testid="node-tooltip"]').or(
      page.locator('[role="tooltip"]')
    );
  }

  /**
   * Navigate to dependency graph page
   */
  async navigate(projectId?: string) {
    const path = projectId ? `/projects/${projectId}/dependencies` : '/dependencies';
    await this.goto(path);
  }

  /**
   * Change layout algorithm
   */
  async changeLayout(layout: 'force' | 'hierarchical' | 'circular') {
    await this.selectOption(this.layoutSelector, layout);
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter by epic
   */
  async filterByEpic(epic: string) {
    await this.selectOption(this.epicFilter, epic);
    await this.waitForLoadingToComplete();
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string) {
    await this.selectOption(this.statusFilter, status);
    await this.waitForLoadingToComplete();
  }

  /**
   * Get all story nodes
   */
  getStoryNodes() {
    return this.storyNodes;
  }

  /**
   * Get node count
   */
  async getNodeCount(): Promise<number> {
    return await this.storyNodes.count();
  }

  /**
   * Get all dependency edges
   */
  getDependencyEdges() {
    return this.dependencyEdges;
  }

  /**
   * Get edge count
   */
  async getEdgeCount(): Promise<number> {
    return await this.dependencyEdges.count();
  }

  /**
   * Click on a story node
   */
  async clickNode(nodeIndex: number = 0) {
    const node = this.storyNodes.nth(nodeIndex);
    await node.click();
    await this.waitForElement(this.nodeTooltip);
  }

  /**
   * Get node by story ID
   */
  getNodeByStoryId(storyId: string) {
    return this.graphSvg.locator(`[data-story-id="${storyId}"]`);
  }

  /**
   * Zoom in
   */
  async zoomIn(clicks: number = 1) {
    for (let i = 0; i < clicks; i++) {
      await this.clickElement(this.zoomInButton);
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Zoom out
   */
  async zoomOut(clicks: number = 1) {
    for (let i = 0; i < clicks; i++) {
      await this.clickElement(this.zoomOutButton);
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Reset zoom
   */
  async resetZoom() {
    await this.clickElement(this.resetZoomButton);
    await this.page.waitForTimeout(200);
  }

  /**
   * Pan graph by dragging
   */
  async panGraph(deltaX: number, deltaY: number) {
    const graphBox = await this.graphContainer.boundingBox();
    if (!graphBox) {
      throw new Error('Graph container not found');
    }

    const startX = graphBox.x + graphBox.width / 2;
    const startY = graphBox.y + graphBox.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
    await this.page.mouse.up();
    await this.page.waitForTimeout(200);
  }

  /**
   * Drag a node
   */
  async dragNode(nodeIndex: number, deltaX: number, deltaY: number) {
    const node = this.storyNodes.nth(nodeIndex);
    const nodeBox = await node.boundingBox();
    if (!nodeBox) {
      throw new Error('Node not found');
    }

    const startX = nodeBox.x + nodeBox.width / 2;
    const startY = nodeBox.y + nodeBox.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + deltaX, startY + deltaY);
    await this.page.mouse.up();
    await this.page.waitForTimeout(200);
  }

  /**
   * Zoom using mouse wheel
   */
  async zoomWithWheel(deltaY: number) {
    const graphBox = await this.graphContainer.boundingBox();
    if (!graphBox) {
      throw new Error('Graph container not found');
    }

    const centerX = graphBox.x + graphBox.width / 2;
    const centerY = graphBox.y + graphBox.height / 2;

    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.wheel(0, deltaY);
    await this.page.waitForTimeout(200);
  }

  /**
   * Export graph as PNG
   */
  async exportPng() {
    // Setup download listener
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickElement(this.exportPngButton);
    const download = await downloadPromise;
    return download;
  }

  /**
   * Export graph as SVG
   */
  async exportSvg() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickElement(this.exportSvgButton);
    const download = await downloadPromise;
    return download;
  }

  /**
   * Export graph as JSON
   */
  async exportJson() {
    const downloadPromise = this.page.waitForEvent('download');
    await this.clickElement(this.exportJsonButton);
    const download = await downloadPromise;
    return download;
  }

  /**
   * Check if graph is rendered
   */
  async isGraphRendered(): Promise<boolean> {
    return await this.isVisible(this.graphSvg) && (await this.getNodeCount()) > 0;
  }

  /**
   * Check if tooltip is visible
   */
  async isTooltipVisible(): Promise<boolean> {
    return await this.isVisible(this.nodeTooltip);
  }

  /**
   * Get tooltip content
   */
  async getTooltipContent(): Promise<string> {
    return await this.getTextContent(this.nodeTooltip);
  }

  /**
   * Wait for graph to render
   */
  async waitForGraphRender(timeout: number = 5000) {
    await this.graphSvg.waitFor({ state: 'visible', timeout });
    // Wait for at least one node to appear
    await this.storyNodes.first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Get graph dimensions
   */
  async getGraphDimensions() {
    const box = await this.graphSvg.boundingBox();
    return box;
  }
}
