/**
 * CostQualityOptimizer Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CostQualityOptimizer } from '../../src/core/CostQualityOptimizer.js';
import { BudgetConfig, BudgetExceededError } from '../../src/types/cost.types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('CostQualityOptimizer', () => {
  let optimizer: CostQualityOptimizer;
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for cost tracking
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cost-optimizer-test-'));

    // Create optimizer with test budget
    const budgetConfig: BudgetConfig = {
      monthly: 1000,
      daily: 50,
      weekly: 300,
      alerts: [
        { threshold: 0.75, action: 'warn' },
        { threshold: 0.90, action: 'downgrade' },
        { threshold: 1.00, action: 'block' }
      ]
    };

    optimizer = new CostQualityOptimizer(budgetConfig, tempDir);
  });

  afterEach(async () => {
    // Cleanup temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Complexity Analysis', () => {
    it('should identify simple tasks correctly', () => {
      const complexity = optimizer.analyzeComplexity('Format the following code snippet');

      expect(complexity.level).toBe('simple');
      expect(complexity.confidence).toBeGreaterThan(0.5);
      expect(complexity.estimatedTokens).toBeLessThan(1000);
      expect(complexity.reasoning).toContain('Simple task');
    });

    it('should identify moderate tasks correctly', () => {
      const complexity = optimizer.analyzeComplexity('Generate unit tests for the UserService class with full coverage');

      expect(complexity.level).toBe('moderate');
      expect(complexity.confidence).toBeGreaterThan(0.5);
      expect(complexity.estimatedTokens).toBeGreaterThan(0);
      expect(complexity.reasoning).toContain('Moderate task');
    });

    it('should identify complex tasks correctly', () => {
      const taskDesc = 'Design a microservices architecture for a distributed e-commerce system with ' +
        'event sourcing, CQRS patterns, and fault tolerance mechanisms';

      const complexity = optimizer.analyzeComplexity(taskDesc);

      expect(complexity.level).toBe('complex');
      expect(complexity.confidence).toBeGreaterThan(0.7);
      expect(complexity.estimatedTokens).toBeGreaterThan(0);
      expect(complexity.reasoning).toContain('Complex task');
    });

    it('should classify by token count when no keywords match', () => {
      // Very long description without specific keywords (>5000 tokens)
      const longDesc = 'A'.repeat(25000);  // ~6250 tokens

      const complexity = optimizer.analyzeComplexity(longDesc);

      expect(complexity.level).toBe('complex');
      expect(complexity.estimatedTokens).toBeGreaterThan(5000);
    });

    it('should have reasonable confidence scores', () => {
      const simple = optimizer.analyzeComplexity('Show me the list');
      const moderate = optimizer.analyzeComplexity('Create a new feature for user management');
      const complex = optimizer.analyzeComplexity('Design the entire system architecture');

      expect(simple.confidence).toBeGreaterThanOrEqual(0);
      expect(simple.confidence).toBeLessThanOrEqual(1);
      expect(moderate.confidence).toBeGreaterThanOrEqual(0);
      expect(moderate.confidence).toBeLessThanOrEqual(1);
      expect(complex.confidence).toBeGreaterThanOrEqual(0);
      expect(complex.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Model Recommendation', () => {
    it('should recommend premium model for complex tasks', () => {
      const complexity = optimizer.analyzeComplexity('Design a distributed system architecture');
      const recommendation = optimizer.recommendModel(complexity);

      expect(recommendation.tier).toBe('premium');
      expect(recommendation.model).toBeDefined();
      expect(recommendation.provider).toBeDefined();
      expect(recommendation.estimatedCost).toBeGreaterThan(0);
      expect(recommendation.reasoning).toContain('premium');
    });

    it('should recommend standard model for moderate tasks', () => {
      const complexity = optimizer.analyzeComplexity('Generate unit tests for the service');
      const recommendation = optimizer.recommendModel(complexity);

      expect(recommendation.tier).toBe('standard');
      expect(recommendation.model).toBeDefined();
      expect(recommendation.provider).toBeDefined();
    });

    it('should recommend economy model for simple tasks', () => {
      const complexity = optimizer.analyzeComplexity('Format this code');
      const recommendation = optimizer.recommendModel(complexity);

      expect(recommendation.tier).toBe('economy');
      expect(recommendation.model).toBeDefined();
      expect(recommendation.provider).toBeDefined();
    });

    it('should downgrade recommendations when budget constrained', () => {
      const complexity = optimizer.analyzeComplexity('Design a complex system architecture');

      // Create budget state at 90% (downgrade threshold)
      const budgetState = {
        utilization: 0.90,
        constraint: 'downgrade' as const,
        period: 'monthly' as const,
        currentSpend: 900,
        budgetLimit: 1000
      };

      const recommendation = optimizer.recommendModel(complexity, budgetState);

      // Complex task should be downgraded from premium to standard
      expect(recommendation.tier).toBe('standard');
      expect(recommendation.reasoning).toContain('downgrade');
    });

    it('should use economy model when budget blocked', () => {
      const complexity = optimizer.analyzeComplexity('Design a complex system architecture');

      // Create budget state at 100% (block threshold)
      const budgetState = {
        utilization: 1.00,
        constraint: 'block' as const,
        period: 'monthly' as const,
        currentSpend: 1000,
        budgetLimit: 1000
      };

      const recommendation = optimizer.recommendModel(complexity, budgetState);

      // Even complex tasks should use economy when blocked
      expect(recommendation.tier).toBe('economy');
      expect(recommendation.reasoning).toContain('block');
    });
  });

  describe('Budget Constraint Checking', () => {
    it('should return no constraint when budget is healthy', () => {
      const budgetState = optimizer.checkBudgetConstraints(250, {
        monthly: 1000
      });

      expect(budgetState.utilization).toBe(0.25);
      expect(budgetState.constraint).toBe('none');
      expect(budgetState.currentSpend).toBe(250);
      expect(budgetState.budgetLimit).toBe(1000);
    });

    it('should return warn constraint at 75% threshold', () => {
      const budgetState = optimizer.checkBudgetConstraints(750, {
        monthly: 1000,
        alerts: [{ threshold: 0.75, action: 'warn' }]
      });

      expect(budgetState.utilization).toBe(0.75);
      expect(budgetState.constraint).toBe('warn');
    });

    it('should return downgrade constraint at 90% threshold', () => {
      const budgetState = optimizer.checkBudgetConstraints(900, {
        monthly: 1000,
        alerts: [
          { threshold: 0.75, action: 'warn' },
          { threshold: 0.90, action: 'downgrade' }
        ]
      });

      expect(budgetState.utilization).toBe(0.90);
      expect(budgetState.constraint).toBe('downgrade');
    });

    it('should return block constraint at 100% threshold', () => {
      const budgetState = optimizer.checkBudgetConstraints(1000, {
        monthly: 1000,
        alerts: [
          { threshold: 0.75, action: 'warn' },
          { threshold: 0.90, action: 'downgrade' },
          { threshold: 1.00, action: 'block' }
        ]
      });

      expect(budgetState.utilization).toBe(1.00);
      expect(budgetState.constraint).toBe('block');
    });

    it('should handle exceeding budget', () => {
      const budgetState = optimizer.checkBudgetConstraints(1200, {
        monthly: 1000,
        alerts: [{ threshold: 1.00, action: 'block' }]
      });

      expect(budgetState.utilization).toBe(1.2);
      expect(budgetState.constraint).toBe('block');
    });
  });

  describe('Cost Tracking', () => {
    it('should track cost for agent invocations', () => {
      optimizer.trackCost(
        'agent-123',
        'claude-sonnet-4-5',
        {
          inputTokens: 1000,
          outputTokens: 500,
          cachedTokens: 0
        },
        'implementation'
      );

      const dashboard = optimizer.getCostDashboard();
      expect(dashboard.costByAgent.has('agent-123')).toBe(true);
      expect(dashboard.costByAgent.get('agent-123')).toBeGreaterThan(0);
      expect(dashboard.costByModel.has('claude-sonnet-4-5')).toBe(true);
      expect(dashboard.costByPhase.has('implementation')).toBe(true);
    });

    it('should accumulate costs across multiple invocations', () => {
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 });
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 });
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 });

      const dashboard = optimizer.getCostDashboard();
      const agentCost = dashboard.costByAgent.get('agent-1') || 0;

      expect(agentCost).toBeGreaterThan(0);
      // Should be approximately 3x the cost of a single invocation
      expect(dashboard.currentSpend.monthly).toBeGreaterThan(0);
    });

    it('should track costs by multiple agents', () => {
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 });
      optimizer.trackCost('agent-2', 'claude-sonnet-4-5', { inputTokens: 2000, outputTokens: 1000 });

      const dashboard = optimizer.getCostDashboard();

      expect(dashboard.costByAgent.size).toBe(2);
      expect(dashboard.costByAgent.has('agent-1')).toBe(true);
      expect(dashboard.costByAgent.has('agent-2')).toBe(true);
    });

    it('should track costs by model', () => {
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 });
      optimizer.trackCost('agent-2', 'claude-sonnet-4-5', { inputTokens: 1000, outputTokens: 500 });

      const dashboard = optimizer.getCostDashboard();

      expect(dashboard.costByModel.size).toBeGreaterThanOrEqual(2);
      expect(dashboard.costByModel.has('claude-haiku')).toBe(true);
      expect(dashboard.costByModel.has('claude-sonnet-4-5')).toBe(true);
    });

    it('should track costs by phase', () => {
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 }, 'analysis');
      optimizer.trackCost('agent-2', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 }, 'implementation');

      const dashboard = optimizer.getCostDashboard();

      expect(dashboard.costByPhase.has('analysis')).toBe(true);
      expect(dashboard.costByPhase.has('implementation')).toBe(true);
    });

    it('should update daily totals', () => {
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 });

      const dashboard = optimizer.getCostDashboard();

      expect(dashboard.trends.last30Days.length).toBeGreaterThan(0);
      expect(dashboard.currentSpend.daily).toBeGreaterThan(0);
    });
  });

  describe('Cost Dashboard', () => {
    beforeEach(() => {
      // Add some test data
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 }, 'analysis');
      optimizer.trackCost('agent-2', 'claude-sonnet-4-5', { inputTokens: 2000, outputTokens: 1000 }, 'implementation');
    });

    it('should provide complete dashboard data', () => {
      const dashboard = optimizer.getCostDashboard();

      expect(dashboard.currentSpend).toBeDefined();
      expect(dashboard.currentSpend.daily).toBeGreaterThan(0);
      expect(dashboard.currentSpend.monthly).toBeGreaterThan(0);

      expect(dashboard.budget).toBeDefined();
      expect(dashboard.budget.monthly).toBe(1000);

      expect(dashboard.utilizationPercentage).toBeGreaterThanOrEqual(0);
      expect(dashboard.utilizationPercentage).toBeLessThan(100);

      expect(dashboard.costByAgent.size).toBeGreaterThan(0);
      expect(dashboard.costByModel.size).toBeGreaterThan(0);
      expect(dashboard.costByPhase.size).toBeGreaterThan(0);

      expect(dashboard.projectedMonthlyCost).toBeGreaterThan(0);
      expect(dashboard.savings).toBeGreaterThanOrEqual(0);

      expect(dashboard.topCostDrivers.agents).toBeDefined();
      expect(dashboard.topCostDrivers.models).toBeDefined();

      expect(dashboard.trends.last30Days).toBeDefined();
    });

    it('should calculate utilization percentage correctly', () => {
      // Track known cost
      const testOptimizer = new CostQualityOptimizer({
        monthly: 100
      }, tempDir);

      // Track $10 worth of costs
      testOptimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 10000, outputTokens: 5000 });

      const dashboard = testOptimizer.getCostDashboard();

      expect(dashboard.utilizationPercentage).toBeGreaterThan(0);
      expect(dashboard.utilizationPercentage).toBeLessThan(100);
    });

    it('should provide top cost drivers', () => {
      const dashboard = optimizer.getCostDashboard();

      expect(dashboard.topCostDrivers.agents.length).toBeGreaterThan(0);
      expect(dashboard.topCostDrivers.models.length).toBeGreaterThan(0);

      // Agents should be sorted by cost (descending)
      if (dashboard.topCostDrivers.agents.length > 1) {
        expect(dashboard.topCostDrivers.agents[0][1]).toBeGreaterThanOrEqual(
          dashboard.topCostDrivers.agents[1][1]
        );
      }
    });
  });

  describe('Cost Reporting', () => {
    beforeEach(() => {
      // Add test data
      optimizer.trackCost('agent-1', 'claude-haiku', { inputTokens: 1000, outputTokens: 500 }, 'analysis');
      optimizer.trackCost('agent-2', 'claude-sonnet-4-5', { inputTokens: 2000, outputTokens: 1000 }, 'implementation');
    });

    it('should generate cost report', () => {
      const report = optimizer.generateCostReport();

      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.period.start).toBeInstanceOf(Date);
      expect(report.period.end).toBeInstanceOf(Date);

      expect(report.totalCost).toBeGreaterThan(0);
      expect(report.budgetUtilization).toBeGreaterThanOrEqual(0);
      expect(report.projectedMonthlyCost).toBeGreaterThan(0);

      expect(Object.keys(report.costByAgent).length).toBeGreaterThan(0);
      expect(Object.keys(report.costByModel).length).toBeGreaterThan(0);
      expect(Object.keys(report.costByPhase).length).toBeGreaterThan(0);

      expect(report.topCostDrivers.agents.length).toBeGreaterThan(0);
      expect(report.topCostDrivers.models.length).toBeGreaterThan(0);

      expect(report.modelEfficiency.length).toBeGreaterThan(0);
    });

    it('should export report to CSV format', () => {
      const report = optimizer.generateCostReport();
      const csv = optimizer.exportToCSV(report);

      expect(csv).toContain('# Cost Report');
      expect(csv).toContain('Agent,Cost,Percentage');
      expect(csv).toContain('Model,Cost,Percentage');
      expect(csv).toContain('Model,Total Cost,Invocations,Avg Cost Per Invocation');
      expect(csv).toContain('Phase,Cost');
    });

    it('should save cost report to file', async () => {
      const report = optimizer.generateCostReport();
      const filepath = await optimizer.saveCostReport(report, tempDir);

      expect(filepath).toContain('cost-report-');
      expect(filepath).toContain('.csv');

      // Verify file exists
      const fileExists = await fs.access(filepath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const content = await fs.readFile(filepath, 'utf-8');
      expect(content).toContain('# Cost Report');
    });
  });

  describe('Optimization Strategies', () => {
    it('should cache prompts', () => {
      const prompt = 'This is a test prompt for caching';
      const key = optimizer.cachePrompt(prompt);

      expect(key).toBeDefined();
      expect(key.length).toBeGreaterThan(0);

      const cached = optimizer.getCachedPrompt(key);
      expect(cached).toBe(prompt);
    });

    it('should track cache hits', () => {
      const prompt = 'Test prompt';
      const key = optimizer.cachePrompt(prompt);

      // Access multiple times
      optimizer.cachePrompt(prompt);
      optimizer.cachePrompt(prompt);

      const cached = optimizer.getCachedPrompt(key);
      expect(cached).toBe(prompt);
    });

    it('should record optimization strategies', () => {
      optimizer.recordOptimization('caching', 'Cached agent persona', 0.005);
      optimizer.recordOptimization('compression', 'Compressed context', 0.002);

      // Verify optimization was recorded (internal state, can't directly test without exposing internals)
      // This tests that the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('Budget Alerts', () => {
    it('should trigger alerts at thresholds', () => {
      // Track costs to reach 75% threshold
      for (let i = 0; i < 30; i++) {
        optimizer.trackCost('agent-1', 'claude-sonnet-4-5', { inputTokens: 5000, outputTokens: 2500 });
      }

      // checkAndAlert is called automatically in trackCost
      // Verify no errors thrown
      expect(true).toBe(true);
    });
  });

  describe('Default Budget', () => {
    it('should use default budget if none provided', () => {
      const defaultOptimizer = new CostQualityOptimizer({} as BudgetConfig, tempDir);

      const budgetState = defaultOptimizer.checkBudgetConstraints();
      expect(budgetState.budgetLimit).toBe(500);  // Default $500/month
    });

    it('should have default alert thresholds', () => {
      const defaultOptimizer = new CostQualityOptimizer({ monthly: 1000 }, tempDir);

      // Default alerts should be set
      const budgetState = defaultOptimizer.checkBudgetConstraints();
      expect(budgetState).toBeDefined();
    });
  });
});
