/**
 * CostQualityOptimizer - Intelligent model selection and cost tracking
 * Analyzes task complexity, recommends optimal models, tracks costs, and enforces budgets
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  TaskComplexity,
  ComplexityLevel,
  ModelRecommendation,
  ModelTier,
  BudgetConfig,
  BudgetState,
  BudgetConstraint,
  CostMetrics,
  CostDashboard,
  CostReport,
  AlertRecord,
  BudgetExceededError,
  TokenUsage,
  CachedPrompt,
  OptimizationStrategy
} from '../types/cost.types.js';

/**
 * Model pricing data (USD per million tokens)
 */
interface ModelPricing {
  inputCostPerM: number;
  outputCostPerM: number;
  cachedCostPerM: number;  // 90% discount
}

/**
 * Model tier definition
 */
interface ModelTierDefinition {
  models: Array<{ model: string; provider: string; pricing: ModelPricing }>;
  targetCostRange: { min: number; max: number };
}

/**
 * Cost Quality Optimizer implementation
 */
export class CostQualityOptimizer {
  /** Budget configuration */
  private budgetConfig: BudgetConfig;

  /** Cost metrics tracking */
  private costMetrics: CostMetrics;

  /** Alert history */
  private alertHistory: AlertRecord[] = [];

  /** Prompt cache */
  private promptCache: Map<string, CachedPrompt> = new Map();

  /** Optimization strategies applied */
  private optimizationStrategies: Map<string, OptimizationStrategy> = new Map();

  /** Cost tracking file path */
  private costTrackingFile: string;

  /** Model tier definitions */
  private readonly modelTiers: Record<ModelTier, ModelTierDefinition> = {
    premium: {
      models: [
        {
          model: 'claude-sonnet-4-5',
          provider: 'anthropic',
          pricing: { inputCostPerM: 3, outputCostPerM: 15, cachedCostPerM: 0.3 }
        },
        {
          model: 'gpt-4-turbo',
          provider: 'openai',
          pricing: { inputCostPerM: 10, outputCostPerM: 30, cachedCostPerM: 1.0 }
        }
      ],
      targetCostRange: { min: 0.10, max: 0.50 }
    },
    standard: {
      models: [
        {
          model: 'claude-haiku',
          provider: 'anthropic',
          pricing: { inputCostPerM: 0.25, outputCostPerM: 1.25, cachedCostPerM: 0.025 }
        },
        {
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          pricing: { inputCostPerM: 0.50, outputCostPerM: 1.50, cachedCostPerM: 0.05 }
        }
      ],
      targetCostRange: { min: 0.01, max: 0.05 }
    },
    economy: {
      models: [
        {
          model: 'claude-haiku',
          provider: 'anthropic',
          pricing: { inputCostPerM: 0.25, outputCostPerM: 1.25, cachedCostPerM: 0.025 }
        }
      ],
      targetCostRange: { min: 0.001, max: 0.01 }
    }
  };

  /** Complexity keywords mapping */
  private readonly complexityKeywords = {
    simple: ['format', 'list', 'show', 'display', 'view', 'get', 'fetch'],
    moderate: ['generate', 'create', 'implement', 'review', 'analyze', 'update', 'modify'],
    complex: ['architecture', 'design', 'critical', 'novel', 'complex', 'system', 'infrastructure']
  };

  /**
   * Create CostQualityOptimizer
   * @param budgetConfig Budget configuration
   * @param costTrackingDir Directory for cost tracking files
   */
  constructor(budgetConfig: BudgetConfig, costTrackingDir?: string) {
    // Set budget config with defaults
    this.budgetConfig = {
      monthly: budgetConfig.monthly || 500,  // Default $500/month
      daily: budgetConfig.daily,
      weekly: budgetConfig.weekly,
      alerts: budgetConfig.alerts || [
        { threshold: 0.75, action: 'warn' },
        { threshold: 0.90, action: 'downgrade' },
        { threshold: 1.00, action: 'block' }
      ]
    };

    // Initialize cost metrics
    this.costMetrics = {
      byAgent: new Map(),
      byPhase: new Map(),
      byModel: new Map(),
      total: 0,
      dailyTotals: []
    };

    // Set cost tracking file path
    const trackingDir = costTrackingDir || path.join(process.cwd(), '.bmad', 'cost-reports');
    this.costTrackingFile = path.join(trackingDir, 'cost-metrics.json');

    // Load existing cost metrics if available
    this.loadCostMetrics().catch(() => {
      // Ignore errors on first run
      this.log('Starting with fresh cost metrics');
    });

    this.log('CostQualityOptimizer initialized with budget: $' + this.budgetConfig.monthly + '/month');
  }

  /**
   * Analyze task complexity using heuristics
   * @param taskDescription Task description text
   * @returns TaskComplexity analysis result
   */
  analyzeComplexity(taskDescription: string): TaskComplexity {
    const text = taskDescription.toLowerCase();

    // Estimate token count (rough: 4 chars per token)
    const estimatedTokens = Math.ceil(taskDescription.length / 4);

    // Check for complexity keywords
    const simpleMatches = this.complexityKeywords.simple.filter(kw => text.includes(kw)).length;
    const moderateMatches = this.complexityKeywords.moderate.filter(kw => text.includes(kw)).length;
    const complexMatches = this.complexityKeywords.complex.filter(kw => text.includes(kw)).length;

    // Determine complexity level
    let level: ComplexityLevel;
    let confidence: number;
    let reasoning: string;

    if (complexMatches > 0 || estimatedTokens > 5000) {
      level = 'complex';
      confidence = Math.min(0.95, 0.7 + (complexMatches * 0.1) + (estimatedTokens > 5000 ? 0.15 : 0));
      reasoning = `Complex task detected: ${complexMatches} complex keywords, ~${estimatedTokens} tokens`;
    } else if (moderateMatches > 0 || (estimatedTokens >= 1000 && estimatedTokens <= 5000)) {
      level = 'moderate';
      confidence = Math.min(0.90, 0.65 + (moderateMatches * 0.1));
      reasoning = `Moderate task detected: ${moderateMatches} moderate keywords, ~${estimatedTokens} tokens`;
    } else {
      level = 'simple';
      confidence = Math.min(0.90, 0.6 + (simpleMatches * 0.1) + (estimatedTokens < 500 ? 0.2 : 0));
      reasoning = `Simple task detected: ${simpleMatches} simple keywords, ~${estimatedTokens} tokens`;
    }

    const complexity: TaskComplexity = {
      level,
      confidence,
      reasoning,
      estimatedTokens
    };

    this.log(`Complexity analysis: ${level} (confidence: ${(confidence * 100).toFixed(0)}%) - ${reasoning}`);

    return complexity;
  }

  /**
   * Recommend optimal model based on complexity and budget state
   * @param complexity Task complexity analysis
   * @param budgetState Current budget state (optional, will check if not provided)
   * @returns Model recommendation
   */
  recommendModel(complexity: TaskComplexity, budgetState?: BudgetState): ModelRecommendation {
    // Check budget state if not provided
    const budget = budgetState || this.checkBudgetConstraints();

    // Determine target tier based on complexity
    let targetTier: ModelTier;
    if (complexity.level === 'complex') {
      targetTier = 'premium';
    } else if (complexity.level === 'moderate') {
      targetTier = 'standard';
    } else {
      targetTier = 'economy';
    }

    // Apply budget constraints to downgrade if necessary
    if (budget.constraint === 'downgrade') {
      if (targetTier === 'premium') {
        targetTier = 'standard';
        this.log(`Budget constraint: downgrading premium → standard`);
      } else if (targetTier === 'standard') {
        targetTier = 'economy';
        this.log(`Budget constraint: downgrading standard → economy`);
      }
    } else if (budget.constraint === 'block') {
      // Use economy model even for complex tasks when budget blocked
      targetTier = 'economy';
      this.log(`Budget constraint: forcing economy tier due to budget block`);
    }

    // Select model from tier
    const tierDef = this.modelTiers[targetTier];
    const selectedModel = tierDef.models[0];  // Use first model in tier

    // Estimate cost
    const estimatedCost = this.estimateTaskCost(
      complexity.estimatedTokens,
      complexity.estimatedTokens * 0.5,  // Assume output is 50% of input
      selectedModel.pricing
    );

    const recommendation: ModelRecommendation = {
      model: selectedModel.model,
      provider: selectedModel.provider,
      tier: targetTier,
      estimatedCost,
      reasoning: `${targetTier} tier selected for ${complexity.level} task (complexity: ${complexity.confidence.toFixed(2)}, budget: ${budget.constraint})`
    };

    this.log(`Model recommendation: ${recommendation.model} (${recommendation.provider}) - ${recommendation.reasoning}`);

    return recommendation;
  }

  /**
   * Check current budget constraints
   * @param currentSpend Optional override for current spend
   * @param budget Optional budget config override
   * @returns Current budget state
   */
  checkBudgetConstraints(currentSpend?: number, budget?: BudgetConfig): BudgetState {
    const spend = currentSpend ?? this.getCurrentMonthlySpend();
    const budgetCfg = budget || this.budgetConfig;
    const budgetLimit = budgetCfg.monthly;

    const utilization = budgetLimit > 0 ? spend / budgetLimit : 0;

    // Determine constraint level based on alert thresholds
    let constraint: BudgetConstraint = 'none';

    const sortedAlerts = (budgetCfg.alerts || []).sort((a, b) => b.threshold - a.threshold);
    for (const alert of sortedAlerts) {
      if (utilization >= alert.threshold) {
        constraint = alert.action === 'warn' ? 'warn' :
                    alert.action === 'downgrade' ? 'downgrade' : 'block';
        break;
      }
    }

    const state: BudgetState = {
      utilization,
      constraint,
      period: 'monthly',
      currentSpend: spend,
      budgetLimit
    };

    return state;
  }

  /**
   * Track cost for an agent invocation
   * @param agentId Agent identifier
   * @param model Model used
   * @param usage Token usage stats
   * @param phase Optional workflow phase
   */
  trackCost(agentId: string, model: string, usage: TokenUsage, phase?: string): void {
    // Find model pricing
    const pricing = this.findModelPricing(model);
    if (!pricing) {
      this.log(`Warning: Unknown model ${model}, using default pricing`);
      return;
    }

    // Calculate cost
    const cost = this.calculateCost(usage, pricing);

    // Update total cost
    this.costMetrics.total += cost;

    // Update cost by agent
    const agentCost = this.costMetrics.byAgent.get(agentId) || 0;
    this.costMetrics.byAgent.set(agentId, agentCost + cost);

    // Update cost by model
    const modelCost = this.costMetrics.byModel.get(model) || 0;
    this.costMetrics.byModel.set(model, modelCost + cost);

    // Update cost by phase if provided
    if (phase) {
      const phaseCost = this.costMetrics.byPhase.get(phase) || 0;
      this.costMetrics.byPhase.set(phase, phaseCost + cost);
    }

    // Update daily totals
    const today = new Date().toISOString().split('T')[0];
    const dailyEntry = this.costMetrics.dailyTotals.find(e => e.date === today);
    if (dailyEntry) {
      dailyEntry.cost += cost;
    } else {
      this.costMetrics.dailyTotals.push({ date: today, cost });
      // Keep only last 30 days
      if (this.costMetrics.dailyTotals.length > 30) {
        this.costMetrics.dailyTotals = this.costMetrics.dailyTotals.slice(-30);
      }
    }

    this.log(`Cost tracked: $${cost.toFixed(6)} for agent ${agentId} using ${model} (${usage.inputTokens} in, ${usage.outputTokens} out)`);

    // Check and alert if budget thresholds crossed
    this.checkAndAlert();

    // Persist cost metrics asynchronously
    this.saveCostMetrics().catch(error => {
      this.log(`Error saving cost metrics: ${error.message}`);
    });
  }

  /**
   * Check budget and trigger alerts if thresholds crossed
   */
  checkAndAlert(): void {
    const budgetState = this.checkBudgetConstraints();

    // Check each alert threshold
    for (const alert of this.budgetConfig.alerts || []) {
      if (budgetState.utilization >= alert.threshold) {
        // Check if we've already alerted at this threshold today
        const today = new Date().toISOString().split('T')[0];
        const alreadyAlerted = this.alertHistory.some(
          record => record.threshold === alert.threshold &&
          record.timestamp.toISOString().startsWith(today)
        );

        if (!alreadyAlerted) {
          this.triggerAlert(alert.threshold, alert.action, budgetState);
        }
      }
    }
  }

  /**
   * Trigger a budget alert
   */
  private triggerAlert(threshold: number, action: 'warn' | 'downgrade' | 'block', budgetState: BudgetState): void {
    const thresholdPct = (threshold * 100).toFixed(0);
    let message: string;

    if (action === 'warn') {
      message = `⚠️ Budget Warning: ${thresholdPct}% of monthly budget used ($${budgetState.currentSpend.toFixed(2)}/$${budgetState.budgetLimit.toFixed(2)})`;
    } else if (action === 'downgrade') {
      message = `🔻 Budget Alert: ${thresholdPct}% of monthly budget used. Downgrading to cost-effective models for non-critical tasks.`;
    } else {
      message = `🛑 Budget Limit Reached: ${thresholdPct}% of monthly budget used. New tasks require user approval.`;
    }

    // Log alert
    console.warn(`[CostQualityOptimizer] ${message}`);

    // Record alert
    const alert: AlertRecord = {
      timestamp: new Date(),
      threshold,
      action,
      budgetState,
      message
    };
    this.alertHistory.push(alert);

    this.log(`Alert triggered: ${action} at ${thresholdPct}% threshold`);
  }

  /**
   * Get cost dashboard data
   * @returns Dashboard data structure
   */
  getCostDashboard(): CostDashboard {
    const currentSpend = {
      daily: this.getDailySpend(),
      weekly: this.getWeeklySpend(),
      monthly: this.getCurrentMonthlySpend()
    };

    const budget = {
      daily: this.budgetConfig.daily || (this.budgetConfig.monthly / 30),
      weekly: this.budgetConfig.weekly || (this.budgetConfig.monthly / 4),
      monthly: this.budgetConfig.monthly
    };

    const utilizationPercentage = (currentSpend.monthly / budget.monthly) * 100;

    // Calculate projected monthly cost based on daily average
    const daysInMonth = new Date().getDate();
    const avgDailyCost = currentSpend.monthly / daysInMonth;
    const projectedMonthlyCost = avgDailyCost * 30;

    // Calculate savings (vs always using premium)
    const premiumModel = this.modelTiers.premium.models[0];
    const avgActualCostPerInvocation = this.costMetrics.total / this.getTotalInvocations();
    const estimatedPremiumCost = this.estimateTaskCost(2000, 1000, premiumModel.pricing);
    const savings = Math.max(0, (estimatedPremiumCost - avgActualCostPerInvocation) * this.getTotalInvocations());

    // Get top cost drivers
    const topAgents = Array.from(this.costMetrics.byAgent.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topModels = Array.from(this.costMetrics.byModel.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const dashboard: CostDashboard = {
      currentSpend,
      budget,
      utilizationPercentage,
      costByAgent: this.costMetrics.byAgent,
      costByPhase: this.costMetrics.byPhase,
      costByModel: this.costMetrics.byModel,
      projectedMonthlyCost,
      savings,
      topCostDrivers: {
        agents: topAgents,
        models: topModels
      },
      trends: {
        last30Days: [...this.costMetrics.dailyTotals]
      }
    };

    return dashboard;
  }

  /**
   * Generate cost report
   * @returns Cost report object
   */
  generateCostReport(): CostReport {
    const dashboard = this.getCostDashboard();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Convert maps to records for report
    const costByAgent: Record<string, number> = {};
    this.costMetrics.byAgent.forEach((cost, agent) => {
      costByAgent[agent] = cost;
    });

    const costByPhase: Record<string, number> = {};
    this.costMetrics.byPhase.forEach((cost, phase) => {
      costByPhase[phase] = cost;
    });

    const costByModel: Record<string, number> = {};
    this.costMetrics.byModel.forEach((cost, model) => {
      costByModel[model] = cost;
    });

    // Calculate top cost drivers with percentages
    const totalCost = this.costMetrics.total;
    const topAgents = dashboard.topCostDrivers.agents.map(([name, cost]) => ({
      name,
      cost,
      percentage: (cost / totalCost) * 100
    }));

    const topModels = dashboard.topCostDrivers.models.map(([name, cost]) => ({
      name,
      cost,
      percentage: (cost / totalCost) * 100
    }));

    // Calculate model efficiency
    const modelEfficiency = Array.from(this.costMetrics.byModel.entries()).map(([model, cost]) => ({
      model,
      totalCost: cost,
      invocations: this.getModelInvocationCount(model),
      avgCostPerInvocation: cost / this.getModelInvocationCount(model)
    }));

    const report: CostReport = {
      generatedAt: now,
      period: {
        start: monthStart,
        end: now
      },
      costByAgent,
      costByPhase,
      costByModel,
      totalCost,
      budgetUtilization: dashboard.utilizationPercentage,
      projectedMonthlyCost: dashboard.projectedMonthlyCost,
      savings: dashboard.savings,
      topCostDrivers: {
        agents: topAgents,
        models: topModels
      },
      modelEfficiency
    };

    return report;
  }

  /**
   * Export cost report to CSV format
   * @param report Cost report to export
   * @returns CSV string
   */
  exportToCSV(report: CostReport): string {
    const lines: string[] = [];

    // Header
    lines.push('# Cost Report');
    lines.push(`# Generated: ${report.generatedAt.toISOString()}`);
    lines.push(`# Period: ${report.period.start.toISOString()} to ${report.period.end.toISOString()}`);
    lines.push(`# Total Cost: $${report.totalCost.toFixed(2)}`);
    lines.push(`# Budget Utilization: ${report.budgetUtilization.toFixed(1)}%`);
    lines.push('');

    // Cost by Agent
    lines.push('Agent,Cost,Percentage');
    for (const agent of report.topCostDrivers.agents) {
      lines.push(`${agent.name},$${agent.cost.toFixed(4)},${agent.percentage.toFixed(1)}%`);
    }
    lines.push('');

    // Cost by Model
    lines.push('Model,Cost,Percentage');
    for (const model of report.topCostDrivers.models) {
      lines.push(`${model.name},$${model.cost.toFixed(4)},${model.percentage.toFixed(1)}%`);
    }
    lines.push('');

    // Model Efficiency
    lines.push('Model,Total Cost,Invocations,Avg Cost Per Invocation');
    for (const efficiency of report.modelEfficiency) {
      lines.push(`${efficiency.model},$${efficiency.totalCost.toFixed(4)},${efficiency.invocations},$${efficiency.avgCostPerInvocation.toFixed(6)}`);
    }
    lines.push('');

    // Cost by Phase
    lines.push('Phase,Cost');
    for (const [phase, cost] of Object.entries(report.costByPhase)) {
      lines.push(`${phase},$${cost.toFixed(4)}`);
    }

    return lines.join('\n');
  }

  /**
   * Save cost report to file
   * @param report Cost report
   * @param directory Output directory
   */
  async saveCostReport(report: CostReport, directory?: string): Promise<string> {
    const reportDir = directory || path.join(process.cwd(), '.bmad', 'cost-reports');

    // Ensure directory exists
    await fs.mkdir(reportDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = report.generatedAt.toISOString().split('T')[0];
    const filename = `cost-report-${timestamp}.csv`;
    const filepath = path.join(reportDir, filename);

    // Export to CSV
    const csv = this.exportToCSV(report);

    // Write file
    await fs.writeFile(filepath, csv, 'utf-8');

    this.log(`Cost report saved to: ${filepath}`);

    return filepath;
  }

  /**
   * Cache a prompt for reuse
   * @param content Prompt content
   * @returns Cache key
   */
  cachePrompt(content: string): string {
    const key = crypto.createHash('md5').update(content).digest('hex');

    const existing = this.promptCache.get(key);
    if (existing) {
      existing.hits++;
      return key;
    }

    const cached: CachedPrompt = {
      key,
      content,
      createdAt: new Date(),
      hits: 0,
      savedCost: 0
    };

    this.promptCache.set(key, cached);
    return key;
  }

  /**
   * Get cached prompt
   * @param key Cache key
   * @returns Cached content or undefined
   */
  getCachedPrompt(key: string): string | undefined {
    const cached = this.promptCache.get(key);
    return cached?.content;
  }

  /**
   * Record optimization strategy application
   * @param type Strategy type
   * @param description Strategy description
   * @param costSaved Cost saved by strategy
   */
  recordOptimization(type: 'caching' | 'batching' | 'compression' | 'fallback', description: string, costSaved: number): void {
    const existing = this.optimizationStrategies.get(type);

    if (existing) {
      existing.applicationsCount++;
      existing.costSaved += costSaved;
    } else {
      this.optimizationStrategies.set(type, {
        type,
        description,
        costSaved,
        applicationsCount: 1
      });
    }

    this.log(`Optimization applied: ${type} - saved $${costSaved.toFixed(6)}`);
  }

  /**
   * Calculate cost from token usage
   */
  private calculateCost(usage: TokenUsage, pricing: ModelPricing): number {
    const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputCostPerM;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputCostPerM;
    const cachedCost = ((usage.cachedTokens || 0) / 1_000_000) * pricing.cachedCostPerM;

    return inputCost + outputCost + cachedCost;
  }

  /**
   * Estimate cost for a task
   */
  private estimateTaskCost(inputTokens: number, outputTokens: number, pricing: ModelPricing): number {
    return this.calculateCost({ inputTokens, outputTokens }, pricing);
  }

  /**
   * Find pricing for a model
   */
  private findModelPricing(model: string): ModelPricing | undefined {
    for (const tier of Object.values(this.modelTiers)) {
      const found = tier.models.find(m => m.model === model);
      if (found) {
        return found.pricing;
      }
    }
    return undefined;
  }

  /**
   * Get current monthly spend
   */
  private getCurrentMonthlySpend(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.costMetrics.dailyTotals
      .filter(e => new Date(e.date) >= monthStart)
      .reduce((sum, e) => sum + e.cost, 0);
  }

  /**
   * Get daily spend (today)
   */
  private getDailySpend(): number {
    const today = new Date().toISOString().split('T')[0];
    const entry = this.costMetrics.dailyTotals.find(e => e.date === today);
    return entry?.cost || 0;
  }

  /**
   * Get weekly spend (last 7 days)
   */
  private getWeeklySpend(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.costMetrics.dailyTotals
      .filter(e => new Date(e.date) >= weekAgo)
      .reduce((sum, e) => sum + e.cost, 0);
  }

  /**
   * Get total invocations (estimated from agent count)
   */
  private getTotalInvocations(): number {
    // Rough estimate: assume each agent costs average amount per invocation
    return Math.max(1, this.costMetrics.byAgent.size * 10);  // Assume ~10 invocations per agent
  }

  /**
   * Get invocation count for a model (estimated)
   */
  private getModelInvocationCount(model: string): number {
    // Rough estimate based on proportion of cost
    const modelCost = this.costMetrics.byModel.get(model) || 0;
    const totalCost = this.costMetrics.total;
    const proportion = totalCost > 0 ? modelCost / totalCost : 0;
    return Math.max(1, Math.round(this.getTotalInvocations() * proportion));
  }

  /**
   * Load cost metrics from file
   */
  private async loadCostMetrics(): Promise<void> {
    try {
      const data = await fs.readFile(this.costTrackingFile, 'utf-8');
      const parsed = JSON.parse(data);

      // Convert arrays back to maps
      this.costMetrics.byAgent = new Map(Object.entries(parsed.byAgent || {}));
      this.costMetrics.byPhase = new Map(Object.entries(parsed.byPhase || {}));
      this.costMetrics.byModel = new Map(Object.entries(parsed.byModel || {}));
      this.costMetrics.total = parsed.total || 0;
      this.costMetrics.dailyTotals = parsed.dailyTotals || [];

      this.log(`Loaded cost metrics: $${this.costMetrics.total.toFixed(2)} total`);
    } catch (error) {
      throw new Error(`Failed to load cost metrics: ${(error as Error).message}`);
    }
  }

  /**
   * Save cost metrics to file
   */
  private async saveCostMetrics(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.costTrackingFile), { recursive: true });

      // Convert maps to objects for JSON serialization
      const serializable = {
        byAgent: Object.fromEntries(this.costMetrics.byAgent),
        byPhase: Object.fromEntries(this.costMetrics.byPhase),
        byModel: Object.fromEntries(this.costMetrics.byModel),
        total: this.costMetrics.total,
        dailyTotals: this.costMetrics.dailyTotals
      };

      await fs.writeFile(this.costTrackingFile, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save cost metrics: ${(error as Error).message}`);
    }
  }

  /**
   * Log message
   */
  private log(message: string): void {
    console.log(`[CostQualityOptimizer] ${message}`);
  }
}
