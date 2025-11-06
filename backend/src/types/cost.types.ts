/**
 * Cost Type Definitions
 * Defines types for cost tracking, budgeting, and quality optimization
 */

/**
 * Task complexity levels for model selection
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

/**
 * Model tier for cost/quality optimization
 */
export type ModelTier = 'premium' | 'standard' | 'economy';

/**
 * Budget constraint level
 */
export type BudgetConstraint = 'none' | 'warn' | 'downgrade' | 'block';

/**
 * Task complexity analysis result
 */
export interface TaskComplexity {
  /** Complexity level determined by heuristics */
  level: ComplexityLevel;

  /** Confidence in complexity assessment (0-1) */
  confidence: number;

  /** Reasoning for complexity determination */
  reasoning: string;

  /** Estimated token count for task */
  estimatedTokens: number;
}

/**
 * Token usage statistics for cost calculation
 */
export interface TokenUsage {
  /** Number of input tokens */
  inputTokens: number;

  /** Number of output tokens */
  outputTokens: number;

  /** Number of cached tokens (90% discount) */
  cachedTokens?: number;
}

/**
 * Model recommendation based on complexity and budget
 */
export interface ModelRecommendation {
  /** Recommended model identifier */
  model: string;

  /** LLM provider */
  provider: string;

  /** Model tier (premium/standard/economy) */
  tier: ModelTier;

  /** Estimated cost for this task in USD */
  estimatedCost: number;

  /** Reasoning for recommendation */
  reasoning: string;
}

/**
 * Budget configuration
 */
export interface BudgetConfig {
  /** Daily budget limit in USD */
  daily?: number;

  /** Weekly budget limit in USD */
  weekly?: number;

  /** Monthly budget limit in USD */
  monthly: number;

  /** Alert thresholds with actions */
  alerts?: BudgetAlert[];
}

/**
 * Budget alert threshold configuration
 */
export interface BudgetAlert {
  /** Threshold as percentage (0-1) */
  threshold: number;

  /** Action to take at threshold */
  action: 'warn' | 'downgrade' | 'block';

  /** Optional notification channel */
  notification?: 'console' | 'email' | 'webhook';
}

/**
 * Current budget state
 */
export interface BudgetState {
  /** Current budget utilization (0-1) */
  utilization: number;

  /** Active constraint level */
  constraint: BudgetConstraint;

  /** Budget period being tracked */
  period: 'daily' | 'weekly' | 'monthly';

  /** Current spend for period */
  currentSpend: number;

  /** Budget limit for period */
  budgetLimit: number;
}

/**
 * Cost metrics aggregation
 */
export interface CostMetrics {
  /** Cost by agent name */
  byAgent: Map<string, number>;

  /** Cost by workflow phase */
  byPhase: Map<string, number>;

  /** Cost by model */
  byModel: Map<string, number>;

  /** Total cost */
  total: number;

  /** Daily totals (last 30 days) */
  dailyTotals: Array<{ date: string; cost: number }>;
}

/**
 * Cost dashboard data structure
 */
export interface CostDashboard {
  /** Current spend by period */
  currentSpend: {
    daily: number;
    weekly: number;
    monthly: number;
  };

  /** Budget limits by period */
  budget: {
    daily: number;
    weekly: number;
    monthly: number;
  };

  /** Overall budget utilization percentage (0-100) */
  utilizationPercentage: number;

  /** Cost breakdown by agent */
  costByAgent: Map<string, number>;

  /** Cost breakdown by phase */
  costByPhase: Map<string, number>;

  /** Cost breakdown by model */
  costByModel: Map<string, number>;

  /** Projected monthly cost based on current trends */
  projectedMonthlyCost: number;

  /** Savings vs always using premium models */
  savings: number;

  /** Top cost drivers */
  topCostDrivers: {
    agents: Array<[string, number]>;
    models: Array<[string, number]>;
  };

  /** Cost trends over last 30 days */
  trends: {
    last30Days: Array<{ date: string; cost: number }>;
  };
}

/**
 * Cost report for export
 */
export interface CostReport {
  /** Report generation timestamp */
  generatedAt: Date;

  /** Report period */
  period: {
    start: Date;
    end: Date;
  };

  /** Cost breakdown by agent */
  costByAgent: Record<string, number>;

  /** Cost breakdown by phase */
  costByPhase: Record<string, number>;

  /** Cost breakdown by model */
  costByModel: Record<string, number>;

  /** Total cost for period */
  totalCost: number;

  /** Budget utilization */
  budgetUtilization: number;

  /** Projected monthly cost */
  projectedMonthlyCost: number;

  /** Savings from optimization */
  savings: number;

  /** Top cost drivers */
  topCostDrivers: {
    agents: Array<{ name: string; cost: number; percentage: number }>;
    models: Array<{ name: string; cost: number; percentage: number }>;
  };

  /** Model efficiency metrics */
  modelEfficiency: Array<{
    model: string;
    totalCost: number;
    invocations: number;
    avgCostPerInvocation: number;
  }>;
}

/**
 * Alert record for tracking alert history
 */
export interface AlertRecord {
  /** Alert timestamp */
  timestamp: Date;

  /** Budget threshold that triggered alert */
  threshold: number;

  /** Alert action */
  action: 'warn' | 'downgrade' | 'block';

  /** Budget state at alert time */
  budgetState: BudgetState;

  /** Alert message */
  message: string;
}

/**
 * Cached prompt entry
 */
export interface CachedPrompt {
  /** Cache key (hash of prompt) */
  key: string;

  /** Cached content */
  content: string;

  /** Cache creation timestamp */
  createdAt: Date;

  /** Number of cache hits */
  hits: number;

  /** Cost saved from caching */
  savedCost: number;
}

/**
 * Optimization strategy record
 */
export interface OptimizationStrategy {
  /** Strategy type */
  type: 'caching' | 'batching' | 'compression' | 'fallback';

  /** Strategy description */
  description: string;

  /** Cost saved by this strategy */
  costSaved: number;

  /** Number of times applied */
  applicationsCount: number;
}

/**
 * Budget exceeded error
 */
export class BudgetExceededError extends Error {
  constructor(
    message: string,
    public budgetState: BudgetState
  ) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}
