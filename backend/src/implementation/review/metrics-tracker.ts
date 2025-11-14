/**
 * Metrics Tracker
 *
 * Tracks performance metrics for dual-agent code review.
 * Monitors execution times, findings counts, and review iterations.
 *
 * Metrics Tracked:
 * - Total review time
 * - Amelia self-review time
 * - Alex independent review time
 * - Decision logic time
 * - Findings count by severity
 * - Review iterations (fix cycles)
 *
 * @module metrics-tracker
 */

import { ReviewMetrics, ReviewFinding } from '../types.js';

/**
 * Metrics Tracker
 *
 * Tracks and calculates performance metrics for code review.
 */
export class MetricsTracker {
  private totalStartTime: number = 0;
  private totalEndTime: number = 0;

  private ameliaStartTime: number = 0;
  private ameliaEndTime: number = 0;

  private alexStartTime: number = 0;
  private alexEndTime: number = 0;

  private decisionStartTime: number = 0;
  private decisionEndTime: number = 0;

  private reviewIterations: number = 1; // Default to 1 (initial review)

  /**
   * Start tracking total review time
   */
  startTotal(): void {
    this.totalStartTime = Date.now();
  }

  /**
   * End tracking total review time
   */
  endTotal(): void {
    this.totalEndTime = Date.now();
  }

  /**
   * Start tracking Amelia review time
   */
  startAmelia(): void {
    this.ameliaStartTime = Date.now();
  }

  /**
   * End tracking Amelia review time
   */
  endAmelia(): void {
    this.ameliaEndTime = Date.now();
  }

  /**
   * Start tracking Alex review time
   */
  startAlex(): void {
    this.alexStartTime = Date.now();
  }

  /**
   * End tracking Alex review time
   */
  endAlex(): void {
    this.alexEndTime = Date.now();
  }

  /**
   * Start tracking decision time
   */
  startDecision(): void {
    this.decisionStartTime = Date.now();
  }

  /**
   * End tracking decision time
   */
  endDecision(): void {
    this.decisionEndTime = Date.now();
  }

  /**
   * Increment review iterations
   *
   * Called when a fix cycle occurs and review is re-run
   */
  incrementIterations(): void {
    this.reviewIterations++;
  }

  /**
   * Track findings and categorize by severity
   *
   * @param findings Review findings to track
   */
  trackFindings(findings: ReviewFinding[]): void {
    // Findings are tracked when getMetrics() is called
    // This method is a placeholder for future enhancements
  }

  /**
   * Get review metrics
   *
   * @param findings Optional findings to count by severity
   * @returns Complete review metrics
   */
  getMetrics(findings?: ReviewFinding[]): ReviewMetrics {
    const totalTime = this.totalEndTime - this.totalStartTime;
    const ameliaTime = this.ameliaEndTime - this.ameliaStartTime;
    const alexTime = this.alexEndTime - this.alexStartTime;
    const decisionTime = this.decisionEndTime - this.decisionStartTime;

    // Count findings by severity
    const findingsCount = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    if (findings) {
      findings.forEach(finding => {
        if (finding.severity === 'critical') findingsCount.critical++;
        else if (finding.severity === 'high') findingsCount.high++;
        else if (finding.severity === 'medium') findingsCount.medium++;
        else if (finding.severity === 'low') findingsCount.low++;
        else if (finding.severity === 'info') findingsCount.info++;
      });
    }

    // Check for bottlenecks (>5 minutes for any phase)
    const BOTTLENECK_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    if (ameliaTime > BOTTLENECK_THRESHOLD) {
      this.log('Bottleneck detected', `Amelia review took ${(ameliaTime / 1000).toFixed(1)}s`);
    }
    if (alexTime > BOTTLENECK_THRESHOLD) {
      this.log('Bottleneck detected', `Alex review took ${(alexTime / 1000).toFixed(1)}s`);
    }

    return {
      totalTime,
      ameliaTime,
      alexTime,
      decisionTime,
      findingsCount,
      reviewIterations: this.reviewIterations
    };
  }

  /**
   * Log message
   *
   * @param message Log message
   * @param detail Optional detail
   */
  private log(message: string, detail?: string): void {
    const detailStr = detail ? ` (${detail})` : '';
    console.log(`[MetricsTracker] ${message}${detailStr}`);
  }
}
