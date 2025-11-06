# Story 1.13: Cost-Quality Optimizer Implementation

Status: review

## Story

As a cost-conscious user,
I want the orchestrator to use optimal LLM models for each task,
So that I get best value (quality per dollar spent).

## Acceptance Criteria

1. Implement CostQualityOptimizer class with complexity analysis
2. Analyze task complexity before agent invocation (Simple, Moderate, Complex)
3. Recommend optimal model based on complexity + budget constraints
4. Override recommendations if budget constrained (75%, 90%, 100% thresholds)
5. Track costs in real-time (per agent invocation, per phase, per model)
6. Provide cost dashboard data structure with spend vs budget metrics
7. Alert at budget thresholds (75%, 90%, 100%) with appropriate actions
8. Implement cost optimization strategies (caching, batching, compression)
9. Configure budget settings in project configuration file
10. Generate cost reporting with CSV export and trend analysis

## Tasks / Subtasks

- [x] **Task 1**: Implement CostQualityOptimizer class structure (AC: #1)
  - [x] Create backend/src/core/CostQualityOptimizer.ts
  - [x] Define CostQualityOptimizer class with constructor
  - [x] Define interfaces: TaskComplexity, ModelRecommendation, CostMetrics
  - [x] Setup budget configuration loading from project config
  - [x] Initialize cost tracking data structures (per agent, phase, model)
  - [x] Implement logger for cost-related events

- [x] **Task 2**: Task complexity analysis (AC: #2)
  - [x] Implement analyzeComplexity(taskDescription: string): TaskComplexity method
  - [x] Define complexity levels:
    - Simple: Formatting, routine operations, cached responses
    - Moderate: Code generation, standard reviews, typical decisions
    - Complex: Architecture design, critical escalations, novel problems
  - [x] Use heuristics to determine complexity:
    - Token count estimates (simple: <1000, moderate: 1000-5000, complex: >5000)
    - Keyword detection (architecture, design, critical, novel → complex)
    - Task type classification (format, review, generate → moderate)
  - [x] Return TaskComplexity object with level and confidence score
  - [x] Add complexity analysis logging for transparency

- [x] **Task 3**: Model recommendation engine (AC: #3)
  - [x] Implement recommendModel(complexity: TaskComplexity, budget: BudgetState): ModelRecommendation
  - [x] Define model tiers:
    - Premium: Claude Sonnet 4.5, GPT-4 Turbo (complex tasks)
    - Standard: Claude Haiku, GPT-3.5 Turbo (moderate tasks)
    - Economy: Cached responses, local models (simple tasks)
  - [x] Recommendation logic:
    - Complex + budget available → Premium
    - Moderate → Standard
    - Simple → Economy
  - [x] Return ModelRecommendation with model name, provider, reasoning
  - [x] Include cost estimate in recommendation

- [x] **Task 4**: Budget constraint handling (AC: #4)
  - [x] Implement checkBudgetConstraints(currentSpend: number, budget: Budget): BudgetState
  - [x] Calculate budget utilization percentage
  - [x] Define threshold actions:
    - 75%: Warning, downgrade non-critical tasks to standard
    - 90%: Critical alert, downgrade all except critical to economy
    - 100%: Block new tasks, require user approval
  - [x] Override model recommendations based on budget state
  - [x] Log budget constraint decisions

- [x] **Task 5**: Real-time cost tracking (AC: #5)
  - [x] Implement trackCost(agentId: string, model: string, usage: TokenUsage): void
  - [x] Track cost per agent invocation (input tokens, output tokens, cached tokens)
  - [x] Aggregate costs by phase (analysis, planning, solutioning, implementation)
  - [x] Aggregate costs by model (sum across all invocations)
  - [x] Calculate running totals (daily, weekly, monthly)
  - [x] Store cost data in CostMetrics data structure
  - [x] Persist cost metrics to file for historical tracking

- [x] **Task 6**: Cost dashboard data structure (AC: #6)
  - [x] Define CostDashboard interface with:
    - currentSpend: { daily, weekly, monthly }
    - budget: { daily, weekly, monthly }
    - utilizationPercentage: number
    - costByAgent: Map<string, number>
    - costByPhase: Map<string, number>
    - costByModel: Map<string, number>
    - projectedMonthlyCost: number
    - savings: number (vs always using premium)
  - [x] Implement getCostDashboard(): CostDashboard method
  - [x] Calculate projected monthly cost from current usage trends
  - [x] Calculate savings by comparing actual vs premium-only cost
  - [x] Format data for dashboard consumption

- [x] **Task 7**: Budget threshold alerts (AC: #7)
  - [x] Implement checkAndAlert(budgetState: BudgetState): void
  - [x] Generate alerts at 75%, 90%, 100% thresholds
  - [x] Alert types:
    - 75%: Warning toast + email (if configured)
    - 90%: Critical alert + downgrade strategy notification
    - 100%: Block tasks + user approval required notification
  - [x] Integrate with notification system (console logs for MVP, webhooks future)
  - [x] Track alert history to avoid duplicate alerts
  - [x] Log all alerts with timestamp and budget state

- [x] **Task 8**: Cost optimization strategies (AC: #8)
  - [x] Implement caching for frequently used prompts:
    - Cache agent personas (reuse across invocations)
    - Cache onboarding docs (load once per session)
    - Track cache hit rate and savings
  - [x] Implement batching for similar requests:
    - Group multiple formatting tasks
    - Process in single LLM call when possible
  - [x] Implement context compression for moderate tasks:
    - Prune irrelevant context
    - Summarize long documents
    - Reduce token count by 20-40%
  - [x] Use economy models for retries (after initial failure)
  - [x] Document optimization strategies applied

- [x] **Task 9**: Budget configuration (AC: #9)
  - [x] Extend .bmad/project-config.yaml schema with budget section:
    ```yaml
    budget:
      daily: 50        # $50/day
      weekly: 300      # $300/week
      monthly: 1000    # $1000/month
      alerts:
        - threshold: 0.75
          action: warn
        - threshold: 0.90
          action: downgrade
        - threshold: 1.00
          action: block
    ```
  - [x] Update ProjectConfig to load budget configuration
  - [x] Validate budget values (positive numbers, consistent hierarchy)
  - [x] Provide default budget if not configured (monthly: 500)
  - [x] Document budget configuration in config example file

- [x] **Task 10**: Cost reporting and export (AC: #10)
  - [x] Implement generateCostReport(): CostReport method
  - [x] Include in report:
    - Cost breakdown by agent, phase, model
    - Daily/weekly/monthly totals
    - Budget utilization
    - Projected monthly cost
    - Savings from optimization
    - Top cost drivers (agents, models)
  - [x] Implement exportToCSV(report: CostReport): string
  - [x] Generate cost trends chart data (last 30 days)
  - [x] Calculate model efficiency metrics (quality score / cost)
  - [x] Save cost reports to bmad/cost-reports/ directory
  - [x] Add timestamp to report filenames

- [x] **Task 11**: Integration with AgentPool (AC: #1, #3)
  - [x] Update AgentPool to use CostQualityOptimizer
  - [x] Call analyzeComplexity() before agent invocation
  - [x] Call recommendModel() to get optimal model
  - [x] Pass recommended model to LLMFactory
  - [x] Call trackCost() after agent invocation completes
  - [x] Handle budget blocks (throw BudgetExceededError)
  - [x] Log optimizer decisions for transparency

- [x] **Task 12**: Testing and validation
  - [x] Write unit tests for CostQualityOptimizer class
  - [x] Test complexity analysis with various task descriptions
  - [x] Test model recommendations across complexity levels
  - [x] Test budget constraint handling at all thresholds
  - [x] Test cost tracking accuracy
  - [x] Test dashboard data generation
  - [x] Test alert triggering at thresholds
  - [x] Test optimization strategies (cache, batch, compress)
  - [x] Test CSV export format
  - [x] Integration test with AgentPool

## Dev Notes

### Architecture Context

This story implements the **Cost-Quality Optimizer** component from Epic 1 tech spec (Section: Story 1.13). The optimizer enables intelligent model selection based on task complexity and budget constraints, maximizing value (quality per dollar).

**Key Design Decisions:**
- Complexity analysis uses heuristics (token count, keywords, task type)
- Three-tier model strategy (Premium, Standard, Economy)
- Budget thresholds trigger automatic downgrade strategies
- Real-time cost tracking with historical persistence
- Caching and compression for cost optimization
- CSV export for external analysis

[Source: docs/tech-spec-epic-1.md#Story-1.13]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - Existing LLMFactory for model instantiation
  - Existing AgentPool for integration
  - File I/O for cost report persistence
  - CSV generation (built-in, no library needed)

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── CostQualityOptimizer.ts      ← This story
│   │   │   ├── AgentPool.ts                 ← Update for integration
│   │   │   └── LLMFactory.ts                ← Used for model costs
│   │   └── types/
│   │       └── cost.types.ts                ← Cost-related interfaces
│   ├── tests/
│   │   └── core/
│   │       └── CostQualityOptimizer.test.ts ← Tests
├── .bmad/
│   ├── project-config.yaml                   ← Budget configuration
│   └── cost-reports/                         ← Cost report output
│       └── cost-report-YYYY-MM-DD.csv
```

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### Cost Calculation

**LLM Pricing (approximate, as of 2025):**

**Anthropic:**
- Claude Sonnet 4.5: $3/million input tokens, $15/million output tokens
- Claude Haiku: $0.25/million input tokens, $1.25/million output tokens

**OpenAI:**
- GPT-4 Turbo: $10/million input tokens, $30/million output tokens
- GPT-3.5 Turbo: $0.50/million input tokens, $1.50/million output tokens

**Zhipu:**
- GLM-4: ~$1/million tokens (via wrapper)

**Cost Calculation Formula:**
```typescript
cost = (inputTokens / 1_000_000) * inputPrice +
       (outputTokens / 1_000_000) * outputPrice +
       (cachedTokens / 1_000_000) * (inputPrice * 0.1) // 90% discount for cached
```

### Complexity Analysis Heuristics

**Simple Tasks (Economy Models):**
- Token count: <1000 tokens
- Keywords: format, list, show, display, simple
- Examples: Format code, list files, show status
- Cost target: <$0.001 per task

**Moderate Tasks (Standard Models):**
- Token count: 1000-5000 tokens
- Keywords: generate, review, implement, create
- Examples: Generate code, review PR, implement feature
- Cost target: $0.01-0.05 per task

**Complex Tasks (Premium Models):**
- Token count: >5000 tokens
- Keywords: architecture, design, critical, novel, complex
- Examples: Design architecture, critical decisions, novel solutions
- Cost target: $0.10-0.50 per task

### Budget Configuration Example

```yaml
budget:
  daily: 50          # $50/day max
  weekly: 300        # $300/week max
  monthly: 1000      # $1000/month max
  alerts:
    - threshold: 0.75
      action: warn
      notification: email  # or: console, webhook
    - threshold: 0.90
      action: downgrade
      notification: email
    - threshold: 1.00
      action: block
      notification: email

  # Optional: Model-specific cost limits
  model_limits:
    claude-sonnet-4-5:
      max_daily: 20    # Max $20/day for premium model
```

### Cost Optimization Strategies

**1. Caching (10x cost reduction):**
- Cache agent personas (loaded once, reused many times)
- Cache onboarding docs (loaded once per session)
- Cache common responses (e.g., "yes", "no", "confirmed")
- Track cache hit rate: target >50%

**2. Batching (2-3x cost reduction):**
- Group multiple formatting tasks into single request
- Process multiple code reviews in one LLM call
- Batch similar decisions together

**3. Context Compression (20-40% cost reduction):**
- Prune irrelevant code from context
- Summarize long documents before including
- Remove duplicate information
- Use extractive summarization

**4. Model Fallback (2-5x cost reduction):**
- Use economy model for retries (after premium fails)
- Downgrade non-critical tasks automatically
- Use standard model for follow-up questions

### Cost Dashboard Data Structure

```typescript
interface CostDashboard {
  currentSpend: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  budget: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  utilizationPercentage: number;  // 0-100
  costByAgent: Map<string, number>;  // agent name → total cost
  costByPhase: Map<string, number>;  // phase → total cost
  costByModel: Map<string, number>;  // model → total cost
  projectedMonthlyCost: number;      // Based on current trends
  savings: number;                    // vs always premium
  topCostDrivers: {
    agents: [string, number][];       // Top 5 agents by cost
    models: [string, number][];       // Top 5 models by cost
  };
  trends: {
    last30Days: { date: string, cost: number }[];
  };
}
```

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#Story-1.13)
- **Story Source**: [docs/epics.md](../epics.md)
- **Prerequisites**: Story 1.3 (LLMFactory), Story 1.4 (AgentPool)
- **Anthropic Pricing**: https://www.anthropic.com/pricing
- **OpenAI Pricing**: https://openai.com/pricing

### Dependencies

**Prerequisites:**
- Story 1.3: LLMFactory with multi-provider support
- Story 1.4: AgentPool for integration point
- Story 1.1: ProjectConfig for budget configuration

**Enables:**
- Cost-effective autonomous development
- Budget-aware model selection
- Cost transparency and reporting

### Learnings from Previous Story

**From Story 1.4: Agent Pool & Lifecycle Management (Status: ready-for-dev)**

Story 1.4 established the AgentPool where CostQualityOptimizer will integrate.

**Expected Integration Points:**
- AgentPool.createAgent() will call CostQualityOptimizer.recommendModel()
- AgentPool will track token usage and call CostQualityOptimizer.trackCost()
- Budget exceeded errors will be thrown from AgentPool

**From Story 1.3: LLM Factory Pattern Implementation (Status: done)**

Story 1.3 created the LLMFactory with multi-provider support.

**Integration Points:**
- CostQualityOptimizer will use LLMFactory's cost estimation methods
- Model recommendations will map to LLMFactory provider names
- Cost tracking will use actual token usage from LLM responses

[Source: docs/stories/1-3-llm-factory-pattern-implementation.md, docs/stories/1-4-agent-pool-lifecycle-management.md]

## Dev Agent Record

### Context Reference

- Story context XML: docs/stories/1-13-cost-quality-optimizer-implementation.context.xml

### Agent Model Used

- Claude Sonnet 4.5 (claude-sonnet-4-5) via Anthropic

### Debug Log References

- Implementation followed TDD approach with comprehensive test suite
- All 33 unit tests passed on first run after test fixes
- Integration with AgentPool tested and verified

### Completion Notes List

- **CostQualityOptimizer Implementation**: Created comprehensive cost optimizer with complexity analysis, model recommendations, budget constraints, cost tracking, dashboard, reporting, and optimization strategies
- **Type Definitions**: Defined complete type system in cost.types.ts including TaskComplexity, ModelRecommendation, CostDashboard, CostReport, and BudgetConfig
- **Budget Configuration**: Extended ProjectConfig to support enhanced budget configuration with daily/weekly/monthly limits and progressive alert thresholds
- **AgentPool Integration**: Successfully integrated cost optimizer with AgentPool for automatic model selection and cost tracking on every agent invocation
- **Test Coverage**: Wrote 33 comprehensive unit tests covering all functionality including complexity analysis, model recommendation, budget constraints, cost tracking, dashboards, and reporting
- **Cost Reporting**: Implemented CSV export functionality for cost reports with trend analysis and model efficiency metrics
- **Optimization Strategies**: Implemented prompt caching, batching support, and optimization tracking infrastructure
- **Budget Alerts**: Implemented progressive budget alerting at 75%, 90%, and 100% thresholds with configurable actions

**Key Technical Decisions:**
- Used heuristic-based complexity analysis (token count + keyword matching) for fast, offline analysis
- Three-tier model strategy (premium/standard/economy) maps directly to complexity levels
- Budget constraints automatically downgrade model recommendations to stay within budget
- Cost tracking persists to .bmad/cost-reports/cost-metrics.json for historical analysis
- All costs calculated using current 2025 LLM pricing from Anthropic and OpenAI
- BudgetExceededError thrown when budget at 100% to prevent overruns

### File List

**Files Created:**
- backend/src/core/CostQualityOptimizer.ts (869 lines) - Main optimizer implementation
- backend/src/types/cost.types.ts (273 lines) - Complete type definitions for cost system
- backend/tests/core/CostQualityOptimizer.test.ts (602 lines) - Comprehensive test suite (33 tests, all passing)
- .bmad/cost-reports/ (directory) - Cost report output directory

**Files Modified:**
- backend/src/core/AgentPool.ts (lines 6-14, 64-65, 74-80, 140-188, 377-389) - Added CostQualityOptimizer integration
- backend/src/types/ProjectConfig.ts (lines 60-101) - Added BudgetAlertConfig interface and enhanced CostManagementConfig
- backend/src/config/ProjectConfig.ts (lines 284-314) - Added getBudgetConfig() method for optimizer
- .bmad/project-config.example.yaml (lines 81-117) - Documented enhanced budget configuration with examples
- docs/sprint-status.yaml (line 60) - Updated status: drafted → in-progress → review

---

## Senior Developer Review (AI)

**Reviewer:** TBD
**Date:** TBD
**Outcome:** TBD

Story is drafted and ready for review workflow after implementation.
