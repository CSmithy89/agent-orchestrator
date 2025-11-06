# Story 1.13: Cost-Quality Optimizer Implementation

Status: drafted

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

- [ ] **Task 1**: Implement CostQualityOptimizer class structure (AC: #1)
  - [ ] Create backend/src/core/CostQualityOptimizer.ts
  - [ ] Define CostQualityOptimizer class with constructor
  - [ ] Define interfaces: TaskComplexity, ModelRecommendation, CostMetrics
  - [ ] Setup budget configuration loading from project config
  - [ ] Initialize cost tracking data structures (per agent, phase, model)
  - [ ] Implement logger for cost-related events

- [ ] **Task 2**: Task complexity analysis (AC: #2)
  - [ ] Implement analyzeComplexity(taskDescription: string): TaskComplexity method
  - [ ] Define complexity levels:
    - Simple: Formatting, routine operations, cached responses
    - Moderate: Code generation, standard reviews, typical decisions
    - Complex: Architecture design, critical escalations, novel problems
  - [ ] Use heuristics to determine complexity:
    - Token count estimates (simple: <1000, moderate: 1000-5000, complex: >5000)
    - Keyword detection (architecture, design, critical, novel → complex)
    - Task type classification (format, review, generate → moderate)
  - [ ] Return TaskComplexity object with level and confidence score
  - [ ] Add complexity analysis logging for transparency

- [ ] **Task 3**: Model recommendation engine (AC: #3)
  - [ ] Implement recommendModel(complexity: TaskComplexity, budget: BudgetState): ModelRecommendation
  - [ ] Define model tiers:
    - Premium: Claude Sonnet 4.5, GPT-4 Turbo (complex tasks)
    - Standard: Claude Haiku, GPT-3.5 Turbo (moderate tasks)
    - Economy: Cached responses, local models (simple tasks)
  - [ ] Recommendation logic:
    - Complex + budget available → Premium
    - Moderate → Standard
    - Simple → Economy
  - [ ] Return ModelRecommendation with model name, provider, reasoning
  - [ ] Include cost estimate in recommendation

- [ ] **Task 4**: Budget constraint handling (AC: #4)
  - [ ] Implement checkBudgetConstraints(currentSpend: number, budget: Budget): BudgetState
  - [ ] Calculate budget utilization percentage
  - [ ] Define threshold actions:
    - 75%: Warning, downgrade non-critical tasks to standard
    - 90%: Critical alert, downgrade all except critical to economy
    - 100%: Block new tasks, require user approval
  - [ ] Override model recommendations based on budget state
  - [ ] Log budget constraint decisions

- [ ] **Task 5**: Real-time cost tracking (AC: #5)
  - [ ] Implement trackCost(agentId: string, model: string, usage: TokenUsage): void
  - [ ] Track cost per agent invocation (input tokens, output tokens, cached tokens)
  - [ ] Aggregate costs by phase (analysis, planning, solutioning, implementation)
  - [ ] Aggregate costs by model (sum across all invocations)
  - [ ] Calculate running totals (daily, weekly, monthly)
  - [ ] Store cost data in CostMetrics data structure
  - [ ] Persist cost metrics to file for historical tracking

- [ ] **Task 6**: Cost dashboard data structure (AC: #6)
  - [ ] Define CostDashboard interface with:
    - currentSpend: { daily, weekly, monthly }
    - budget: { daily, weekly, monthly }
    - utilizationPercentage: number
    - costByAgent: Map<string, number>
    - costByPhase: Map<string, number>
    - costByModel: Map<string, number>
    - projectedMonthlyCost: number
    - savings: number (vs always using premium)
  - [ ] Implement getCostDashboard(): CostDashboard method
  - [ ] Calculate projected monthly cost from current usage trends
  - [ ] Calculate savings by comparing actual vs premium-only cost
  - [ ] Format data for dashboard consumption

- [ ] **Task 7**: Budget threshold alerts (AC: #7)
  - [ ] Implement checkAndAlert(budgetState: BudgetState): void
  - [ ] Generate alerts at 75%, 90%, 100% thresholds
  - [ ] Alert types:
    - 75%: Warning toast + email (if configured)
    - 90%: Critical alert + downgrade strategy notification
    - 100%: Block tasks + user approval required notification
  - [ ] Integrate with notification system (console logs for MVP, webhooks future)
  - [ ] Track alert history to avoid duplicate alerts
  - [ ] Log all alerts with timestamp and budget state

- [ ] **Task 8**: Cost optimization strategies (AC: #8)
  - [ ] Implement caching for frequently used prompts:
    - Cache agent personas (reuse across invocations)
    - Cache onboarding docs (load once per session)
    - Track cache hit rate and savings
  - [ ] Implement batching for similar requests:
    - Group multiple formatting tasks
    - Process in single LLM call when possible
  - [ ] Implement context compression for moderate tasks:
    - Prune irrelevant context
    - Summarize long documents
    - Reduce token count by 20-40%
  - [ ] Use economy models for retries (after initial failure)
  - [ ] Document optimization strategies applied

- [ ] **Task 9**: Budget configuration (AC: #9)
  - [ ] Extend .bmad/project-config.yaml schema with budget section:
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
  - [ ] Update ProjectConfig to load budget configuration
  - [ ] Validate budget values (positive numbers, consistent hierarchy)
  - [ ] Provide default budget if not configured (monthly: 500)
  - [ ] Document budget configuration in config example file

- [ ] **Task 10**: Cost reporting and export (AC: #10)
  - [ ] Implement generateCostReport(): CostReport method
  - [ ] Include in report:
    - Cost breakdown by agent, phase, model
    - Daily/weekly/monthly totals
    - Budget utilization
    - Projected monthly cost
    - Savings from optimization
    - Top cost drivers (agents, models)
  - [ ] Implement exportToCSV(report: CostReport): string
  - [ ] Generate cost trends chart data (last 30 days)
  - [ ] Calculate model efficiency metrics (quality score / cost)
  - [ ] Save cost reports to bmad/cost-reports/ directory
  - [ ] Add timestamp to report filenames

- [ ] **Task 11**: Integration with AgentPool (AC: #1, #3)
  - [ ] Update AgentPool to use CostQualityOptimizer
  - [ ] Call analyzeComplexity() before agent invocation
  - [ ] Call recommendModel() to get optimal model
  - [ ] Pass recommended model to LLMFactory
  - [ ] Call trackCost() after agent invocation completes
  - [ ] Handle budget blocks (throw BudgetExceededError)
  - [ ] Log optimizer decisions for transparency

- [ ] **Task 12**: Testing and validation
  - [ ] Write unit tests for CostQualityOptimizer class
  - [ ] Test complexity analysis with various task descriptions
  - [ ] Test model recommendations across complexity levels
  - [ ] Test budget constraint handling at all thresholds
  - [ ] Test cost tracking accuracy
  - [ ] Test dashboard data generation
  - [ ] Test alert triggering at thresholds
  - [ ] Test optimization strategies (cache, batch, compress)
  - [ ] Test CSV export format
  - [ ] Integration test with AgentPool

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

- Story Context XML will be generated by story-context workflow

### Agent Model Used

- TBD (will be assigned when story moves to in-progress)

### Debug Log References

- TBD (will be populated during implementation)

### Completion Notes List

- TBD (will be populated during implementation)

### File List

**Expected Files to Create:**
- backend/src/core/CostQualityOptimizer.ts
- backend/src/types/cost.types.ts
- backend/tests/core/CostQualityOptimizer.test.ts
- .bmad/cost-reports/ (directory)

**Expected Files to Modify:**
- backend/src/core/AgentPool.ts (integration)
- .bmad/project-config.yaml (budget configuration example)
- docs/sprint-status.yaml (status: backlog → drafted → ready-for-dev)

---

## Senior Developer Review (AI)

**Reviewer:** TBD
**Date:** TBD
**Outcome:** TBD

Story is drafted and ready for review workflow after implementation.
