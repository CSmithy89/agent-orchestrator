/**
 * Unit Tests for MetricsTracker
 *
 * Tests performance metrics tracking for code review.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsTracker } from '../../../../src/implementation/review/metrics-tracker.js';
import { ReviewFinding } from '../../../../src/implementation/types.js';

describe('MetricsTracker', () => {
  let tracker: MetricsTracker;

  beforeEach(() => {
    tracker = new MetricsTracker();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('time tracking', () => {
    it('should track total review time', () => {
      // Arrange
      tracker.startTotal();
      vi.advanceTimersByTime(1000); // 1 second
      tracker.endTotal();

      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.totalTime).toBeGreaterThan(0);
    });

    it('should track Amelia review time', () => {
      // Arrange
      tracker.startAmelia();
      vi.advanceTimersByTime(500);
      tracker.endAmelia();

      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.ameliaTime).toBeGreaterThan(0);
    });

    it('should track Alex review time', () => {
      // Arrange
      tracker.startAlex();
      vi.advanceTimersByTime(700);
      tracker.endAlex();

      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.alexTime).toBeGreaterThan(0);
    });

    it('should track decision time', () => {
      // Arrange
      tracker.startDecision();
      vi.advanceTimersByTime(100);
      tracker.endDecision();

      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.decisionTime).toBeGreaterThan(0);
    });

    it('should track all phases together', () => {
      // Arrange
      tracker.startTotal();

      tracker.startAmelia();
      vi.advanceTimersByTime(500);
      tracker.endAmelia();

      tracker.startAlex();
      vi.advanceTimersByTime(700);
      tracker.endAlex();

      tracker.startDecision();
      vi.advanceTimersByTime(100);
      tracker.endDecision();

      tracker.endTotal();

      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.totalTime).toBeGreaterThan(0);
      expect(metrics.ameliaTime).toBeGreaterThan(0);
      expect(metrics.alexTime).toBeGreaterThan(0);
      expect(metrics.decisionTime).toBeGreaterThan(0);
    });
  });

  describe('findings tracking', () => {
    it('should count findings by severity', () => {
      // Arrange
      const findings: ReviewFinding[] = [
        {
          category: 'security',
          severity: 'critical',
          title: 'Critical security issue',
          description: 'Test',
          location: 'test.ts:1',
          recommendation: 'Fix'
        },
        {
          category: 'quality',
          severity: 'high',
          title: 'High quality issue',
          description: 'Test',
          location: 'test.ts:2',
          recommendation: 'Fix'
        },
        {
          category: 'testing',
          severity: 'medium',
          title: 'Medium test issue',
          description: 'Test',
          location: 'test.ts:3',
          recommendation: 'Fix'
        },
        {
          category: 'architecture',
          severity: 'low',
          title: 'Low architecture issue',
          description: 'Test',
          location: 'test.ts:4',
          recommendation: 'Fix'
        },
        {
          category: 'quality',
          severity: 'info',
          title: 'Info',
          description: 'Test',
          location: 'test.ts:5',
          recommendation: 'Note'
        }
      ];

      // Act
      const metrics = tracker.getMetrics(findings);

      // Assert
      expect(metrics.findingsCount.critical).toBe(1);
      expect(metrics.findingsCount.high).toBe(1);
      expect(metrics.findingsCount.medium).toBe(1);
      expect(metrics.findingsCount.low).toBe(1);
      expect(metrics.findingsCount.info).toBe(1);
    });

    it('should handle empty findings array', () => {
      // Arrange
      const findings: ReviewFinding[] = [];

      // Act
      const metrics = tracker.getMetrics(findings);

      // Assert
      expect(metrics.findingsCount.critical).toBe(0);
      expect(metrics.findingsCount.high).toBe(0);
      expect(metrics.findingsCount.medium).toBe(0);
      expect(metrics.findingsCount.low).toBe(0);
      expect(metrics.findingsCount.info).toBe(0);
    });
  });

  describe('review iterations', () => {
    it('should default to 1 iteration', () => {
      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.reviewIterations).toBe(1);
    });

    it('should increment iterations', () => {
      // Arrange
      tracker.incrementIterations();
      tracker.incrementIterations();

      // Act
      const metrics = tracker.getMetrics();

      // Assert
      expect(metrics.reviewIterations).toBe(3); // 1 (default) + 2 (incremented)
    });
  });
});
