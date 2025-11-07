# Epic Technical Specification: Analysis Phase Automation

Date: 2025-11-07
Author: Chris
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 enables autonomous PRD generation - the first "magic moment" of the Agent Orchestrator where users provide rough requirements and wake up to a complete, professional Product Requirements Document. This epic implements the Analysis Phase Automation with intelligent decision-making, Mary (Business Analyst) and John (Product Manager) agent personas, and the escalation queue system for handling ambiguous requirements.

Building on the foundation established in Epic 1, this epic delivers the first end-to-end autonomous workflow execution, proving the orchestrator can make nuanced decisions, collaborate between multiple agents, and produce quality documentation with minimal human intervention. The PRD workflow targets <30 minutes execution time with <3 escalations, demonstrating 10x faster requirements analysis compared to traditional manual processes (30 minutes vs 2-4 hours).

## Objectives and Scope

### In Scope

**Autonomous Decision Making:**
- DecisionEngine class with confidence scoring (0-1 scale)
- Autonomous decision attempts with onboarding doc consultation
- Confidence threshold-based escalation (< 0.75 triggers escalation)
- Decision audit trail (question, decision, confidence, reasoning, outcome)

**Escalation System:**
- EscalationQueue class for managing human intervention requests
- File-based escalation storage (.bmad-escalations/{id}.json)
- Workflow pause/resume capability at escalation points
- Escalation metadata tracking (metrics, resolution time, categories)
- Console notification (dashboard integration deferred to Epic 6)

**Agent Personas:**
- Mary agent (Business Analyst) - requirements analysis specialist
- John agent (Product Manager) - strategic product guidance specialist
- Multi-provider LLM support (Anthropic, OpenAI, Zhipu, Google)
- Per-agent LLM assignment from project configuration
- Specialized prompts and methods per persona

**PRD Workflow Execution:**
- PRD workflow executor (bmad/bmm/workflows/prd/workflow.yaml)
- Multi-agent collaboration (Mary ↔ John)
- Template processing with incremental saves
- PRD quality validation (>85% completeness target)
- Section-by-section content generation with approval checkpoints

**Documentation Output:**
- Complete PRD document (docs/PRD.md)
- All required sections populated
- Professional formatting with markdown, tables, code blocks
- Domain-specific sections where applicable

### Out of Scope

- Architecture workflow and Winston agent (Epic 3)
- Story decomposition and Bob agent (Epic 4)
- Code implementation and Amelia agent (Epic 5)
- Dashboard/API for escalation responses (Epic 6)
- Multi-project orchestration (parallel PRD generation)
- Advanced decision pattern learning (future enhancement)

## System Architecture Alignment

This epic implements components from the **Autonomous Intelligence** layer and the **PRD Workflow Plugin** from the system architecture (Sections 2.2 and 2.3 in architecture.md):

**Architecture Components Implemented:**
- **DecisionEngine** (Story 2.1): Confidence-based autonomous decision making with LLM reasoning (temperature 0.3)
- **EscalationQueue** (Story 2.2): Human intervention management with pause/resume workflow capability
- **Mary Agent** (Story 2.3): Business analyst persona with requirements extraction and user story specialization
- **John Agent** (Story 2.4): Product manager persona with strategic validation and prioritization
- **PRD Workflow Executor** (Story 2.5): Workflow engine integration for PRD generation
- **PRD Template Processor** (Story 2.6): Content generation from templates with domain adaptation
- **PRD Validator** (Story 2.7): Quality validation with completeness scoring (>85% target)

**Architectural Patterns Followed:**
- **Plugin Architecture**: PRD workflow plugs into Epic 1's workflow engine
- **Multi-Agent Collaboration**: Mary and John share workflow context for coherent output
- **Confidence-Based Escalation**: Balances autonomy (>85% decisions autonomous) with safety (escalate ambiguity)
- **Incremental Output**: Template-output tags trigger saves and user approval
- **Provider Abstraction**: Agents use Epic 1's LLMFactory for multi-provider support

**Integration Points:**
- **Depends On**: Epic 1 (WorkflowEngine, AgentPool, LLMFactory, TemplateProcessor, StateManager, ErrorHandler)
- **Used By**: Epic 3 (Architecture workflow will reference PRD output)
- **Future Integration**: Epic 6 (Dashboard will visualize escalations and provide response UI)

## Detailed Design

### Services and Modules

| Module | Responsibilities | Inputs | Outputs | Owner Story |
|--------|------------------|--------|---------|-------------|
| **DecisionEngine** | Assess decision confidence and determine escalation | question, context, onboarding docs | Decision (value, confidence, reasoning) | Story 2.1 |
| **EscalationQueue** | Manage human intervention requests, pause/resume workflows | escalation metadata | Escalation ID, response when resolved | Story 2.2 |
| **MaryAgent** | Requirements analysis, user story writing, scope negotiation | user input, product brief, domain knowledge | requirements, success criteria, scope proposals | Story 2.3 |
| **JohnAgent** | Product strategy, prioritization, market fit assessment | Mary's requirements, product vision | strategic validation, prioritized features, executive summaries | Story 2.4 |
| **PRDWorkflowExecutor** | Orchestrate PRD generation workflow | workflow.yaml, user input | docs/PRD.md, workflow state | Story 2.5 |
| **PRDTemplateProcessor** | Generate PRD content from templates | template.md, variables, domain context | populated PRD sections | Story 2.6 |
| **PRDValidator** | Validate PRD completeness and quality | generated PRD | completeness score, gap identification | Story 2.7 |

### Data Models and Contracts

**Decision Schema:**
```typescript
interface Decision {
  question: string;              // Original question requiring decision
  decision: any;                 // Decision value (varies by question type)
  confidence: number;            // 0.0-1.0, triggers escalation if <0.75
  reasoning: string;             // AI rationale for audit trail
  source: 'onboarding' | 'llm';  // Onboarding doc (0.95) or LLM reasoning (0.3-0.9)
  timestamp: Date;
  context: Record<string, any>;  // Relevant context used in decision
}
```

**Escalation Schema:**
```typescript
interface Escalation {
  id: string;                    // UUID for tracking
  workflowId: string;            // Which workflow triggered escalation
  step: number;                  // Which step in workflow
  question: string;              // What decision is needed
  aiReasoning: string;           // Why AI couldn't decide confidently
  confidence: number;            // AI's confidence (< 0.75)
  context: Record<string, any>;  // Relevant context for human
  status: 'pending' | 'resolved' | 'cancelled';
  createdAt: Date;
  resolvedAt?: Date;
  response?: any;                // Human response when resolved
  resolutionTime?: number;       // Milliseconds to resolution
}

interface EscalationMetrics {
  totalEscalations: number;
  resolvedCount: number;
  averageResolutionTime: number;  // milliseconds
  categoryBreakdown: Record<string, number>;  // e.g., {requirements: 5, scope: 2}
}
```

**Agent Persona Schema:**
```typescript
interface AgentPersona {
  name: string;                  // e.g., "Mary", "John"
  role: string;                  // e.g., "Business Analyst", "Product Manager"
  provider: string;              // e.g., "anthropic", "openai", "zhipu"
  model: string;                 // e.g., "claude-sonnet-4-5", "gpt-4"
  temperature: number;           // e.g., 0.3 for reasoning, 0.7 for creativity
  systemPrompt: string;          // Persona definition and capabilities
  specializedPrompts: {
    [method: string]: string;    // e.g., analyzeRequirements: "..."
  };
}
```

**PRD Validation Result:**
```typescript
interface PRDValidationResult {
  completenessScore: number;     // 0-100, target >85
  sectionsPresent: string[];     // All required sections found
  sectionsMissing: string[];     // Required sections not found
  requirementsCount: number;     // Total functional requirements
  clarityIssues: Array<{
    section: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  contradictions: string[];      // Conflicting requirements identified
  gaps: string[];                // Missing information
  passesQualityGate: boolean;    // True if score >85 and no high-severity issues
}
```

### APIs and Interfaces

**DecisionEngine Interface:**
```typescript
class DecisionEngine {
  /**
   * Attempt autonomous decision with confidence scoring
   * @param question - Decision to be made
   * @param context - Relevant context for decision
   * @returns Decision with confidence score
   */
  async attemptAutonomousDecision(
    question: string,
    context: Record<string, any>
  ): Promise<Decision>;

  /**
   * Check onboarding docs for explicit answers
   * @param question - Question to search
   * @returns Answer if found, null otherwise
   */
  private async checkOnboardingDocs(question: string): Promise<string | null>;

  /**
   * Use LLM reasoning for decision
   * @param question - Question for LLM
   * @param context - Context to provide
   * @returns Decision with reasoning
   */
  private async useLLMReasoning(
    question: string,
    context: Record<string, any>
  ): Promise<{ value: any; confidence: number; reasoning: string }>;
}
```

**EscalationQueue Interface:**
```typescript
class EscalationQueue {
  /**
   * Add escalation to queue and pause workflow
   * @param escalation - Escalation details
   * @returns Escalation ID
   */
  async add(escalation: Omit<Escalation, 'id' | 'status' | 'createdAt'>): Promise<string>;

  /**
   * List escalations with optional filtering
   * @param filters - Filter criteria
   * @returns Filtered escalations
   */
  async list(filters?: {
    status?: 'pending' | 'resolved' | 'cancelled';
    workflowId?: string;
  }): Promise<Escalation[]>;

  /**
   * Get specific escalation by ID
   * @param escalationId - Escalation UUID
   * @returns Escalation details
   */
  async getById(escalationId: string): Promise<Escalation>;

  /**
   * Respond to escalation and resume workflow
   * @param escalationId - Escalation to resolve
   * @param response - Human response
   * @returns Updated escalation
   */
  async respond(escalationId: string, response: any): Promise<Escalation>;

  /**
   * Get escalation metrics
   * @returns Aggregated metrics
   */
  async getMetrics(): Promise<EscalationMetrics>;
}
```

**Agent Persona Interfaces:**
```typescript
// Mary Agent (Business Analyst)
interface MaryAgent {
  /**
   * Analyze requirements from user input
   * @param userInput - Raw requirements
   * @param productBrief - Optional product brief
   * @returns Structured requirements
   */
  analyzeRequirements(
    userInput: string,
    productBrief?: string
  ): Promise<{
    requirements: string[];
    successCriteria: string[];
    assumptions: string[];
  }>;

  /**
   * Define success criteria for features
   * @param features - Feature list
   * @returns Measurable success criteria
   */
  defineSuccessCriteria(features: string[]): Promise<string[]>;

  /**
   * Negotiate scope based on constraints
   * @param requirements - Full requirements
   * @param constraints - Time/budget/team constraints
   * @returns MVP scope and growth features
   */
  negotiateScope(
    requirements: string[],
    constraints: Record<string, any>
  ): Promise<{
    mvpScope: string[];
    growthFeatures: string[];
  }>;
}

// John Agent (Product Manager)
interface JohnAgent {
  /**
   * Define product vision
   * @param requirements - Mary's requirements
   * @returns Product vision and positioning
   */
  defineProductVision(
    requirements: string[]
  ): Promise<{
    vision: string;
    positioning: string;
    valueProposition: string;
  }>;

  /**
   * Prioritize features by value and effort
   * @param features - Feature list
   * @returns Prioritized features with rationale
   */
  prioritizeFeatures(
    features: string[]
  ): Promise<Array<{
    feature: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
  }>>;

  /**
   * Assess market fit
   * @param productConcept - Product description
   * @returns Market analysis and recommendations
   */
  assessMarketFit(
    productConcept: string
  ): Promise<{
    targetMarket: string;
    competitiveAdvantage: string;
    risks: string[];
  }>;
}
```

### Workflows and Sequencing

**PRD Workflow Sequence:**

1. **Initialization** (Story 2.5)
   - Load PRD workflow.yaml
   - Initialize template with placeholders
   - Create workflow state

2. **Requirements Gathering** (Story 2.3 - Mary)
   - Mary analyzes user input
   - Extract functional requirements
   - Identify success criteria
   - Use DecisionEngine for ambiguous requirements (confidence check)
   - Escalate if confidence < 0.75

3. **Strategic Validation** (Story 2.4 - John)
   - John reviews Mary's requirements
   - Define product vision and positioning
   - Prioritize features (MVP vs growth)
   - Challenge scope creep
   - Validate business viability

4. **Content Generation** (Story 2.6)
   - Generate PRD sections from template
   - Vision & alignment
   - Success criteria & metrics
   - Functional requirements (67+ items)
   - Non-functional requirements
   - Adapt to project domain (API, mobile, SaaS, game, etc.)

5. **Incremental Saves** (Story 2.5)
   - Save after each major section (template-output tags)
   - Show user generated content
   - Get approval to continue [c] or edit [e]

6. **Quality Validation** (Story 2.7)
   - Run PRDValidator on completed document
   - Check completeness score (target >85%)
   - Identify gaps and contradictions
   - If score <85%, regenerate missing content

7. **Finalization** (Story 2.5)
   - Save final PRD to docs/PRD.md
   - Update workflow-status.yaml (mark PRD complete)
   - Log metrics (escalations, time, quality score)

**Collaboration Pattern (Mary ↔ John):**
```
User Input
    ↓
  Mary (analyze)
    ↓
Requirements Draft
    ↓
  John (validate & prioritize)
    ↓
Strategic Feedback
    ↓
  Mary (refine)
    ↓
Final Requirements
    ↓
Template Generation
    ↓
Quality Validation
    ↓
docs/PRD.md
```

**Decision Points (with DecisionEngine):**
- Unclear requirement scope → Escalate
- Ambiguous acceptance criteria → Escalate
- Technology choice (if mentioned) → Escalate
- MVP feature boundary → Autonomous (Mary/John collaborate)
- Success metric definition → Autonomous (John defines)
- User story format → Autonomous (Mary decides)

## Non-Functional Requirements

### Performance

**PRD Workflow Execution Time:**
- **Target**: Complete PRD generation in <30 minutes (10x faster than manual 2-4 hours)
- **Breakdown**:
  - Workflow initialization: <1 minute
  - Requirements gathering (Mary): 5-10 minutes
  - Strategic validation (John): 5-10 minutes
  - Content generation: 10-15 minutes
  - Quality validation: 2-3 minutes
- **Measurement**: Track workflow execution time from start to completion, log in workflow state

**LLM Response Time:**
- **DecisionEngine**: <5 seconds per autonomous decision attempt
- **Agent invocations**: <30 seconds per Mary/John method call
- **Temperature optimization**: Use 0.3 for reasoning tasks (DecisionEngine) to improve response consistency and speed

**Escalation Performance:**
- **Queue operations**: <100ms for add/list/getById/respond operations
- **File I/O**: Atomic writes to .bmad-escalations/{id}.json using Epic 1's StateManager patterns
- **Metrics calculation**: <500ms for getMetrics() across all escalations

**Resource Constraints:**
- **Memory**: <500MB for PRD workflow execution (agent contexts, templates, state)
- **Concurrent agents**: Max 2 agents active simultaneously (Mary + John)
- **LLM token limits**: Stay within provider context windows (100K for Claude, 128K for GPT-4)

**Cost Targets (from PRD):**
- **PRD generation**: <$5 in LLM fees
- **Breakdown**: Mary ($2-3), John ($1-2), DecisionEngine ($0.50-1)
- **Token optimization**: Use Epic 1's CostQualityOptimizer to recommend optimal models

### Security

**Sensitive Data Handling:**
- **Escalation storage**: .bmad-escalations/ directory contains project-specific questions and AI reasoning
  - **Risk**: May contain proprietary product ideas, business strategies, or competitive information
  - **Mitigation**: Store in project directory (not shared), add to .gitignore if needed, consider encryption at rest
- **LLM API keys**: Accessed via Epic 1's LLMFactory, not stored in Epic 2 components
- **PRD content**: May contain confidential product roadmaps and market strategies
  - **Mitigation**: File permissions restrict to project owner, warn users about LLM provider data policies

**Agent Persona Security:**
- **Prompt injection risks**: Mary/John agents receive user input that could contain malicious prompts
  - **Mitigation**: Use system prompts that establish role boundaries, Epic 1's LLMFactory handles input sanitization
- **Decision escalation**: DecisionEngine should not auto-approve security-sensitive decisions (e.g., auth mechanisms)
  - **Mitigation**: Technology choices always escalate, low confidence threshold (0.75) for safety

**Authentication/Authorization:**
- **Not applicable in Epic 2**: Local CLI operation only, no multi-user concerns
- **Epic 6 consideration**: When API is added, escalation responses must be authenticated

**Data Privacy:**
- **LLM provider data**: User requirements sent to Anthropic/OpenAI/Zhipu APIs
  - **User responsibility**: Ensure compliance with provider data policies (retention, training usage)
  - **Recommendation**: Use providers with zero-retention policies for sensitive projects

### Reliability/Availability

**Error Handling:**
- **LLM failures**: Use Epic 1's RetryHandler with exponential backoff (see epic-2-action-items.md Task 3)
  - Rate limits (429): Retry with Retry-After header
  - Server errors (500-599): Retry up to 3 times
  - Auth errors (401/403): Don't retry, escalate immediately
- **Agent failures**: If Mary or John fail, pause workflow and escalate (don't auto-retry agent logic)
- **DecisionEngine failures**: If LLM reasoning fails, fall back to escalation (fail-safe)

**State Persistence:**
- **Workflow state**: Use Epic 1's StateManager to persist after each template-output checkpoint
- **Escalation persistence**: Each escalation immediately saved to disk (atomic write)
- **Crash recovery**: Workflow can resume from last checkpoint if orchestrator crashes

**Graceful Degradation:**
- **Missing onboarding docs**: DecisionEngine falls back to LLM reasoning (lower confidence)
- **Quality validation failure**: If PRDValidator score <85%, regenerate gaps rather than failing workflow
- **Escalation queue unavailable**: Log error, pause workflow, notify user via console

**Availability Targets:**
- **PRD workflow**: Available 24/7 for local CLI execution
- **Escalation queue**: File-based, no external dependencies, 99.9% availability
- **LLM providers**: Accept provider SLA variability, use retry logic for transient failures

### Observability

**Logging:**
- **Workflow execution**: Log each PRD workflow step (start, completion, duration)
  - Format: `[PRD-Workflow] Step 3: Requirements Gathering (Mary) - Duration: 8m 23s`
- **Agent invocations**: Log each Mary/John method call with input/output sizes
  - Format: `[MaryAgent] analyzeRequirements(inputSize: 1200 chars) -> requirements: 45 items`
- **Decision tracking**: Log all DecisionEngine attempts with confidence scores
  - Format: `[DecisionEngine] Question: "MVP feature boundary?" - Decision: [list] - Confidence: 0.82 - Source: llm`
- **Escalations**: Log creation, resolution, and cancellation events
  - Format: `[Escalation] Created: esc-abc123 - Question: "Technology choice?" - Confidence: 0.68`

**Metrics:**
- **PRD workflow metrics** (tracked in workflow state):
  - Execution time (total, per step)
  - Escalation count (target <3)
  - PRD completeness score (target >85%)
  - LLM cost (target <$5)
  - Token usage (input/output per agent)
- **Escalation metrics** (via EscalationQueue.getMetrics()):
  - Total escalations count
  - Resolution time (average, min, max)
  - Category breakdown (requirements, scope, technology, etc.)
  - Resolution status distribution (pending/resolved/cancelled)
- **Agent performance metrics**:
  - Mary invocation count, average duration
  - John invocation count, average duration
  - LLM token usage per agent

**Debugging:**
- **Decision audit trail**: Each Decision object contains question, reasoning, confidence, context
- **Escalation context**: Each Escalation includes AI reasoning and relevant context for debugging
- **Workflow state inspection**: StateManager persists full workflow state for post-mortem analysis
- **Verbose mode**: CLI flag to enable detailed logging of agent prompts and LLM responses

**Monitoring:**
- **Epic 2 scope**: Console logging only
- **Epic 6 integration**: WebSocket events for real-time workflow progress
  - `workflow.step.started`
  - `workflow.step.completed`
  - `escalation.created`
  - `escalation.resolved`
- **Alerting**: Not implemented in Epic 2 (console warnings only)

## Dependencies and Integrations

### Epic 1 Dependencies (Required)

Epic 2 builds directly on Epic 1's foundation and requires these components:

| Component | Usage in Epic 2 | Interface |
|-----------|-----------------|-----------|
| **WorkflowEngine** | Execute PRD workflow.yaml, process instructions.md | `executeWorkflow(workflowConfig)` |
| **AgentPool** | Spawn and manage Mary/John agent instances | `createAgent(name, config)`, `invokeAgent(id, prompt)` |
| **LLMFactory** | Create LLM clients for agents and DecisionEngine | `createClient(provider, model, config)` |
| **TemplateProcessor** | Generate PRD content from template.md | `processTemplate(template, variables)` |
| **StateManager** | Persist workflow state and escalations | `saveState(state)`, `loadState(workflowId)` |
| **ErrorHandler** | Handle LLM and workflow failures | `handleError(error, context)` |
| **RetryHandler** | Retry LLM API calls with backoff | `executeWithRetry(fn, isRetryable)` |
| **Logger** | Log workflow execution and decisions | `info()`, `warn()`, `error()`, `debug()` |

### External Library Dependencies

**Required for Epic 2 (to be added to backend/package.json):**

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.68.0",      // UPDATE REQUIRED (currently ^0.20.0)
    "openai": "^6.2.0",                   // UPDATE REQUIRED (currently ^4.20.0)
    "js-yaml": "^4.1.0",                  // Already present (workflow parsing)
    "uuid": "^13.0.0",                    // NEW - Generate escalation IDs (ESM-only)
    "handlebars": "^4.7.8"                // Already present (template processing)
  }
}
```

**New dependency to add:**
- **uuid**: For generating unique escalation IDs (UUID v4, v13+ is ESM-only, compatible with project's "type": "module")

**Breaking changes to address:**
- **@anthropic-ai/sdk v0.20 → v0.68**: Review 48 versions of changes, test LLMFactory integration
- **openai v4.20 → v6.2**: Major version upgrade includes breaking changes, review migration guide at https://github.com/openai/openai-node/releases
- **uuid v9 → v13**: ESM-only (CommonJS dropped), update imports to `import { v4 as uuidv4 } from 'uuid'`

**Rationale for dependencies:**
- `@anthropic-ai/sdk` (v0.68+): Mary/John agents and DecisionEngine use Claude (recommended). Latest version includes prompt caching, enhanced tool use, and code execution support.
- `openai` (v6.2+): Support for GPT models (alternative to Claude). v6+ includes realtime API support and improved streaming.
- `uuid` (v13+): Generate unique escalation IDs (`esc-abc123...`). ESM-only, uses `import { v4 as uuidv4 } from 'uuid'`.
- `handlebars`: Template variable substitution in PRD template
- `js-yaml`: Parse workflow.yaml and project-config.yaml

### Integration Points

**1. LLMFactory Integration (Epic 1 Story 1.3)**
- **Used by**: DecisionEngine, MaryAgent, JohnAgent
- **Purpose**: Create LLM clients for autonomous reasoning
- **Configuration**: Agent assignments from `.bmad/project-config.yaml`
- **Example**:
  ```yaml
  agent_assignments:
    mary:
      provider: anthropic
      model: claude-sonnet-4-5
      temperature: 0.3
    john:
      provider: anthropic
      model: claude-sonnet-4-5
      temperature: 0.5
  ```

**2. AgentPool Integration (Epic 1 Story 1.4)**
- **Used by**: PRDWorkflowExecutor
- **Purpose**: Spawn Mary and John agents, manage lifecycles
- **Pattern**: Create agents at workflow start, destroy at workflow end
- **Concurrency**: Max 2 agents (Mary + John) per workflow

**3. WorkflowEngine Integration (Epic 1 Story 1.7)**
- **Used by**: PRDWorkflowExecutor
- **Purpose**: Execute PRD workflow steps, handle template-output and elicit-required tags
- **Workflow file**: `bmad/bmm/workflows/prd/workflow.yaml`
- **Instructions**: `bmad/bmm/workflows/prd/instructions.md`

**4. StateManager Integration (Epic 1 Story 1.5)**
- **Used by**: PRDWorkflowExecutor, EscalationQueue
- **Purpose**: Persist workflow state after each checkpoint, save escalations
- **Files**:
  - Workflow state: `.bmad/workflows/{workflowId}/state.yaml`
  - Escalations: `.bmad-escalations/{escalationId}.json`

**5. ErrorHandler Integration (Epic 1 Story 1.10)**
- **Used by**: All Epic 2 components
- **Purpose**: Handle LLM failures, workflow errors
- **Deferred work**: LLM client retry integration (see epic-2-action-items.md Task 3)

**6. TemplateProcessor Integration (Epic 1 Story 1.8)**
- **Used by**: PRDTemplateProcessor
- **Purpose**: Render PRD template with variable substitution
- **Template**: `bmad/bmm/workflows/prd/template.md`

### External Service Dependencies

**LLM Provider APIs:**
- **Anthropic API** (recommended): Claude models for Mary, John, DecisionEngine
  - API key: `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`
  - Endpoints: `https://api.anthropic.com/v1/messages`
  - Rate limits: 50 requests/min (tier 1), 1000/min (tier 2)
- **OpenAI API** (alternative): GPT models
  - API key: `OPENAI_API_KEY`
  - Endpoints: `https://api.openai.com/v1/chat/completions`
  - Rate limits: Vary by tier and model (Tier 1: ~500 RPM for GPT-4, ~5000 RPM for GPT-4o; check account settings for current limits)
- **Zhipu API** (optional): GLM models for Chinese language projects
  - API key: `ZHIPU_API_KEY`
  - Endpoints: Zhipu GLM API

**File System:**
- **Read**: PRD workflow files, templates, project config, onboarding docs
- **Write**: docs/PRD.md, .bmad-escalations/*.json, workflow state files

**Git (via simple-git):**
- **Used by**: StateManager for auto-commit (Epic 1)
- **Purpose**: Version control for PRD.md and escalation files
- **Not directly used in Epic 2**: Inherited from Epic 1 infrastructure

### Integration with Future Epics

**Epic 3 (Architecture Phase):**
- **Input dependency**: Epic 3's Architecture workflow will read `docs/PRD.md` generated by Epic 2
- **Traceability**: Architecture decisions reference PRD requirements

**Epic 6 (Remote Access & Monitoring):**
- **Dashboard integration**: Escalation UI will call `EscalationQueue.list()` and `.respond()`
- **WebSocket events**: Real-time workflow progress notifications
- **API endpoints**:
  - `GET /api/escalations` → `EscalationQueue.list()`
  - `POST /api/escalations/{id}/respond` → `EscalationQueue.respond()`

### Configuration Files

**Project Configuration (.bmad/project-config.yaml):**
```yaml
# Required for Epic 2
agent_assignments:
  mary:
    provider: anthropic
    model: claude-sonnet-4-5
    temperature: 0.3
  john:
    provider: anthropic
    model: claude-sonnet-4-5
    temperature: 0.5

decision_engine:
  confidence_threshold: 0.75
  onboarding_docs_path: .bmad/onboarding/

escalation_config:
  storage_path: .bmad-escalations/
  notification_method: console  # Epic 6: dashboard
```

**Environment Variables (.env):**
```bash
# LLM Provider Keys (one required)
ANTHROPIC_API_KEY=sk-ant-xxx
CLAUDE_CODE_OAUTH_TOKEN=xxx  # Preferred
OPENAI_API_KEY=sk-xxx         # Alternative
ZHIPU_API_KEY=xxx             # Optional

# Logging
LOG_LEVEL=info                # debug for verbose mode
```

### Version Constraints

**Node.js**: >=20.0.0 (ESM support, modern async/await)
**TypeScript**: ^5.3.0 (type safety for interfaces)
**Vitest**: ^1.0.0 (testing framework from Epic 1)

### Breaking Changes / Migration Notes

**None**: Epic 2 is additive, no breaking changes to Epic 1 components

## Acceptance Criteria (Authoritative)

This section consolidates all acceptance criteria from Epic 2 stories. Each story's criteria are testable and must be verified before marking the story as done.

### Story 2.1: Confidence-Based Decision Engine

1. ✅ Implement DecisionEngine class with confidence scoring
2. ✅ attemptAutonomousDecision(question, context) returns Decision with confidence (0-1)
3. ✅ Check onboarding docs first for explicit answers (confidence 0.95)
4. ✅ Use LLM reasoning with low temperature (0.3) for decisions
5. ✅ Assess confidence based on answer clarity and context sufficiency
6. ✅ Escalate if confidence < 0.75 (ESCALATION_THRESHOLD)
7. ✅ Return decision value and reasoning for audit trail
8. ✅ Track: question, decision, confidence, reasoning, outcome

### Story 2.2: Escalation Queue System

1. ✅ Implement EscalationQueue class
2. ✅ add(escalation) saves to .bmad-escalations/{id}.json
3. ✅ Escalation includes: workflow, step, question, AI reasoning, confidence, context
4. ✅ Pause workflow execution at escalation point
5. ✅ Notify via console (dashboard integration in Epic 6)
6. ✅ respond(escalationId, response) records human answer
7. ✅ Resume workflow from escalation step with response
8. ✅ Track escalation metrics: count, resolution time, categories

### Story 2.3: Mary Agent - Business Analyst Persona

1. ✅ Load Mary persona from bmad/bmm/agents/mary.md
2. ✅ Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - Recommended: Claude Sonnet for strong reasoning on requirements analysis
   - See Story 1.3 for configuration examples with multiple providers
3. ✅ Specialized prompts for: requirement extraction, user story writing, scope negotiation
4. ✅ Context includes: user input, product brief (if exists), domain knowledge
5. ✅ Methods: analyzeRequirements(), defineSuccessCriteria(), negotiateScope()
6. ✅ Generate clear, structured requirements documentation
7. ✅ Make decisions with confidence scoring via DecisionEngine
8. ✅ Escalate ambiguous or critical product decisions

### Story 2.4: John Agent - Product Manager Persona

1. ✅ Load John persona from bmad/bmm/agents/john.md
2. ✅ Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - Recommended: Claude Sonnet for strategic reasoning and product decisions
   - See Story 1.3 for configuration examples with multiple providers
3. ✅ Specialized prompts for: product strategy, prioritization, roadmap planning
4. ✅ Methods: defineProductVision(), prioritizeFeatures(), assessMarketFit()
5. ✅ Validate Mary's requirements for business viability
6. ✅ Challenge scope creep and unrealistic timelines
7. ✅ Generate executive summaries and success metrics
8. ✅ Collaborate with Mary through shared workflow context

### Story 2.5: PRD Workflow Executor

1. ✅ Load bmad/bmm/workflows/prd/workflow.yaml
2. ✅ Execute all PRD workflow steps in order
3. ✅ Spawn Mary agent for requirements analysis
4. ✅ Spawn John agent for strategic validation
5. ✅ Process template-output tags by generating content and saving to PRD.md
6. ✅ Handle elicit-required tags (skip in #yolo mode)
7. ✅ Make autonomous decisions via DecisionEngine (target <3 escalations)
8. ✅ Complete execution in <30 minutes
9. ✅ Generate docs/PRD.md with all sections filled
10. ✅ Update workflow-status.yaml to mark PRD complete

### Story 2.6: PRD Template & Content Generation

1. ✅ Load prd-template.md with proper structure
2. ✅ Generate content for each template section:
   - vision_alignment, product_magic_essence
   - success_criteria, mvp_scope, growth_features
   - functional_requirements_complete
   - performance/security/scalability requirements (if applicable)
3. ✅ Adapt content to project type (API, mobile, SaaS, etc.)
4. ✅ Include domain-specific sections if complex domain detected
5. ✅ Generate 67+ functional requirements from user input
6. ✅ Format with proper markdown, tables, code blocks
7. ✅ Save incrementally as sections complete

### Story 2.7: PRD Quality Validation

1. ✅ Implement PRDValidator class with quality checks
2. ✅ Verify all required sections present
3. ✅ Check requirements clarity (no vague "handle X" requirements)
4. ✅ Validate success criteria are measurable
5. ✅ Ensure acceptance criteria for key features
6. ✅ Check for contradictions or gaps
7. ✅ Generate completeness score (target >85%)
8. ✅ If score <85%, identify gaps and regenerate missing content
9. ✅ Log validation results for improvement

### Story 2.8: PRD Validation Tests

1. ✅ Unit tests for DecisionEngine:
   - Test confidence scoring (0.0-1.0 range)
   - Test onboarding doc lookup (confidence 0.95)
   - Test LLM reasoning with temperature 0.3
   - Test escalation threshold (< 0.75 triggers escalation)
2. ✅ Unit tests for EscalationQueue:
   - Test add() creates file in .bmad-escalations/
   - Test list() filters by status and workflowId
   - Test getById() retrieves correct escalation
   - Test respond() updates escalation and resumes workflow
   - Test getMetrics() calculates correct aggregates
3. ✅ Unit tests for Mary/John agents:
   - Test agent initialization with LLM config
   - Test analyzeRequirements() returns structured data
   - Test defineProductVision() generates vision/positioning
   - Test DecisionEngine integration (confidence scoring)
4. ✅ Integration tests for PRD workflow:
   - Test full workflow execution (initialization → finalization)
   - Test Mary ↔ John collaboration (shared context)
   - Test template processing and incremental saves
   - Test quality validation (<85% triggers regeneration)
   - Test escalation flow (pause → respond → resume)
5. ✅ Test coverage targets:
   - DecisionEngine: >90% coverage
   - EscalationQueue: >90% coverage
   - Mary/John agents: >80% coverage
   - PRD workflow: >80% coverage
6. ✅ Test execution in CI/CD pipeline
7. ✅ All tests passing (0 failures, 0 errors)

**Note**: Story 2.8 follows ATDD (Acceptance Test-Driven Development) - tests written alongside implementation, not as separate story

## Traceability Mapping

This mapping traces each acceptance criterion to its implementing component, API method, and test case.

| AC# | Story | Acceptance Criterion | Component | API/Method | Test Case |
|-----|-------|---------------------|-----------|------------|-----------|
| 2.1.1 | 2.1 | Implement DecisionEngine class | DecisionEngine | class DecisionEngine | tests/core/DecisionEngine.test.ts |
| 2.1.2 | 2.1 | attemptAutonomousDecision() returns Decision | DecisionEngine | attemptAutonomousDecision() | DecisionEngine: should return Decision object |
| 2.1.3 | 2.1 | Check onboarding docs first (0.95 confidence) | DecisionEngine | checkOnboardingDocs() | DecisionEngine: should return 0.95 confidence for onboarding matches |
| 2.1.4 | 2.1 | Use LLM reasoning (temp 0.3) | DecisionEngine | useLLMReasoning() | DecisionEngine: should use temperature 0.3 |
| 2.1.5 | 2.1 | Assess confidence | DecisionEngine | useLLMReasoning() | DecisionEngine: should assess confidence 0.3-0.9 |
| 2.1.6 | 2.1 | Escalate if confidence < 0.75 | DecisionEngine | attemptAutonomousDecision() | DecisionEngine: should escalate when confidence <0.75 |
| 2.1.7 | 2.1 | Return decision and reasoning | DecisionEngine | attemptAutonomousDecision() | DecisionEngine: should include reasoning in Decision |
| 2.1.8 | 2.1 | Track decision metadata | DecisionEngine | Decision interface | DecisionEngine: should track question, decision, confidence, reasoning |
| 2.2.1 | 2.2 | Implement EscalationQueue class | EscalationQueue | class EscalationQueue | tests/core/EscalationQueue.test.ts |
| 2.2.2 | 2.2 | add() saves to .bmad-escalations/{id}.json | EscalationQueue | add() | EscalationQueue: should save escalation to file |
| 2.2.3 | 2.2 | Escalation includes metadata | EscalationQueue | Escalation interface | EscalationQueue: should include workflow, step, question, etc |
| 2.2.4 | 2.2 | Pause workflow at escalation | WorkflowEngine | (integration) | PRDWorkflow: should pause at escalation point |
| 2.2.5 | 2.2 | Notify via console | EscalationQueue | add() | EscalationQueue: should log to console |
| 2.2.6 | 2.2 | respond() records answer | EscalationQueue | respond() | EscalationQueue: should update escalation with response |
| 2.2.7 | 2.2 | Resume workflow after response | WorkflowEngine | (integration) | PRDWorkflow: should resume from escalation step |
| 2.2.8 | 2.2 | Track escalation metrics | EscalationQueue | getMetrics() | EscalationQueue: should calculate metrics |
| 2.3.1 | 2.3 | Load Mary persona | MaryAgent | constructor | tests/agents/MaryAgent.test.ts |
| 2.3.2 | 2.3 | Configure with LLM from config | MaryAgent | constructor | MaryAgent: should use LLM from project-config |
| 2.3.3 | 2.3 | Specialized prompts | MaryAgent | system/specialized prompts | MaryAgent: should load specialized prompts |
| 2.3.4 | 2.3 | Context includes user input/brief | MaryAgent | analyzeRequirements() | MaryAgent: should process user input and product brief |
| 2.3.5 | 2.3 | Methods implemented | MaryAgent | analyzeRequirements(), defineSuccessCriteria(), negotiateScope() | MaryAgent: should implement all methods |
| 2.3.6 | 2.3 | Generate requirements | MaryAgent | analyzeRequirements() | MaryAgent: should return structured requirements |
| 2.3.7 | 2.3 | Use DecisionEngine | MaryAgent | (integration) | MaryAgent: should call DecisionEngine for decisions |
| 2.3.8 | 2.3 | Escalate ambiguous decisions | MaryAgent | (integration) | MaryAgent: should escalate when confidence <0.75 |
| 2.4.1 | 2.4 | Load John persona | JohnAgent | constructor | tests/agents/JohnAgent.test.ts |
| 2.4.2 | 2.4 | Configure with LLM from config | JohnAgent | constructor | JohnAgent: should use LLM from project-config |
| 2.4.3 | 2.4 | Specialized prompts | JohnAgent | system/specialized prompts | JohnAgent: should load specialized prompts |
| 2.4.4 | 2.4 | Methods implemented | JohnAgent | defineProductVision(), prioritizeFeatures(), assessMarketFit() | JohnAgent: should implement all methods |
| 2.4.5 | 2.4 | Validate requirements | JohnAgent | (integration) | JohnAgent: should validate Mary's requirements |
| 2.4.6 | 2.4 | Challenge scope creep | JohnAgent | (integration) | JohnAgent: should identify scope creep |
| 2.4.7 | 2.4 | Generate summaries | JohnAgent | defineProductVision() | JohnAgent: should generate executive summary |
| 2.4.8 | 2.4 | Collaborate with Mary | PRDWorkflowExecutor | (integration) | PRDWorkflow: Mary and John share context |
| 2.5.1 | 2.5 | Load PRD workflow.yaml | PRDWorkflowExecutor | constructor | tests/workflows/PRDWorkflow.test.ts |
| 2.5.2 | 2.5 | Execute steps in order | PRDWorkflowExecutor | executeWorkflow() | PRDWorkflow: should execute steps sequentially |
| 2.5.3 | 2.5 | Spawn Mary agent | PRDWorkflowExecutor | (via AgentPool) | PRDWorkflow: should spawn Mary agent |
| 2.5.4 | 2.5 | Spawn John agent | PRDWorkflowExecutor | (via AgentPool) | PRDWorkflow: should spawn John agent |
| 2.5.5 | 2.5 | Process template-output tags | PRDWorkflowExecutor | (via WorkflowEngine) | PRDWorkflow: should save after template-output |
| 2.5.6 | 2.5 | Handle elicit-required | PRDWorkflowExecutor | (via WorkflowEngine) | PRDWorkflow: should skip elicit in #yolo mode |
| 2.5.7 | 2.5 | Target <3 escalations | PRDWorkflowExecutor | (integration) | PRDWorkflow: should have <3 escalations |
| 2.5.8 | 2.5 | Complete in <30 minutes | PRDWorkflowExecutor | executeWorkflow() | PRDWorkflow: should complete in <30min |
| 2.5.9 | 2.5 | Generate docs/PRD.md | PRDWorkflowExecutor | (via TemplateProcessor) | PRDWorkflow: should create PRD.md |
| 2.5.10 | 2.5 | Update workflow-status.yaml | PRDWorkflowExecutor | (via StateManager) | PRDWorkflow: should mark PRD complete |
| 2.6.1 | 2.6 | Load prd-template.md | PRDTemplateProcessor | constructor | tests/workflows/PRDTemplateProcessor.test.ts |
| 2.6.2 | 2.6 | Generate all sections | PRDTemplateProcessor | generateContent() | PRDTemplateProcessor: should populate all sections |
| 2.6.3 | 2.6 | Adapt to project type | PRDTemplateProcessor | generateContent() | PRDTemplateProcessor: should adapt to API/mobile/SaaS |
| 2.6.4 | 2.6 | Domain-specific sections | PRDTemplateProcessor | generateContent() | PRDTemplateProcessor: should add domain sections |
| 2.6.5 | 2.6 | Generate 67+ requirements | PRDTemplateProcessor | generateContent() | PRDTemplateProcessor: should generate ≥67 requirements |
| 2.6.6 | 2.6 | Format markdown | PRDTemplateProcessor | generateContent() | PRDTemplateProcessor: should format with markdown |
| 2.6.7 | 2.6 | Save incrementally | PRDTemplateProcessor | (via TemplateProcessor) | PRDTemplateProcessor: should save after each section |
| 2.7.1 | 2.7 | Implement PRDValidator | PRDValidator | class PRDValidator | tests/workflows/PRDValidator.test.ts |
| 2.7.2 | 2.7 | Verify sections present | PRDValidator | validate() | PRDValidator: should check all required sections |
| 2.7.3 | 2.7 | Check clarity | PRDValidator | validate() | PRDValidator: should flag vague requirements |
| 2.7.4 | 2.7 | Validate measurable criteria | PRDValidator | validate() | PRDValidator: should validate success criteria |
| 2.7.5 | 2.7 | Check acceptance criteria | PRDValidator | validate() | PRDValidator: should verify acceptance criteria |
| 2.7.6 | 2.7 | Check contradictions/gaps | PRDValidator | validate() | PRDValidator: should identify contradictions |
| 2.7.7 | 2.7 | Generate completeness score | PRDValidator | validate() | PRDValidator: should calculate score 0-100 |
| 2.7.8 | 2.7 | Regenerate if <85% | PRDWorkflowExecutor | (integration) | PRDWorkflow: should regenerate gaps if score <85% |
| 2.7.9 | 2.7 | Log validation results | PRDValidator | validate() | PRDValidator: should log results |
| 2.8.1-7 | 2.8 | All test coverage | All components | All methods | See Story 2.8 acceptance criteria above |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Severity | Probability | Mitigation | Owner |
|------|----------|-------------|------------|-------|
| **LLM API rate limits** during PRD workflow execution | High | Medium | Use Epic 1's RetryHandler with exponential backoff; implement request throttling; monitor rate limit headers | Story 2.1, 2.5 |
| **Low confidence decisions** causing excessive escalations (>3) | High | Medium | Fine-tune confidence threshold (0.75); improve onboarding docs coverage; iterate on LLM prompts for clearer reasoning | Story 2.1, 2.2 |
| **Mary/John agent collaboration** producing inconsistent PRD sections | Medium | Low | Enforce shared context via WorkflowEngine; implement validation checks for contradictions; review output quality metrics | Story 2.3, 2.4, 2.7 |
| **PRD quality validation** missing subtle gaps/contradictions | Medium | Medium | Iterative refinement of PRDValidator rules based on real-world PRDs; human review of validator logic | Story 2.7 |
| **Escalation queue file corruption** causing workflow failures | Low | Low | Use Epic 1's StateManager atomic writes; implement escalation backup/recovery mechanism | Story 2.2 |
| **LLM cost overruns** (>$5 per PRD) | Medium | Low | Use CostQualityOptimizer to recommend cheaper models for non-critical tasks; monitor token usage; set budget alerts | Story 2.5, 2.6 |
| **30-minute execution target** not met for complex projects | Medium | Medium | Optimize LLM prompts to reduce token usage; parallelize Mary/John where possible (future); profile workflow bottlenecks | Story 2.5 |
| **Onboarding docs** insufficient for domain-specific decisions | Low | Medium | Provide clear onboarding doc templates; encourage users to document preferences; fallback to escalation gracefully | Story 2.1 |

### Assumptions

1. **Epic 1 foundation is stable**: DecisionEngine, EscalationQueue, and agents depend on Epic 1 components (WorkflowEngine, AgentPool, LLMFactory, StateManager) being production-ready
2. **LLM providers are reliable**: Anthropic/OpenAI/Zhipu APIs have acceptable uptime (>99%) and rate limits accommodate workflow needs
3. **User input quality**: Users provide meaningful requirements (not just "build an app"); workflow cannot generate quality PRD from vague input
4. **Single-user execution**: Epic 2 assumes local CLI operation; no concurrent PRD workflows for same project (multi-user deferred to Epic 6)
5. **File system availability**: .bmad-escalations/ directory is writable and accessible; no permission issues
6. **Onboarding docs exist**: Users have created `.bmad/onboarding/` directory with project preferences (optional but improves autonomy)
7. **Mary/John personas are effective**: Predefined agent personas generate quality output without extensive customization
8. **Template structure is universal**: PRD template works for API/mobile/SaaS/game projects with minor domain adaptations
9. **Confidence scoring is reliable**: 0.75 threshold balances autonomy and escalations appropriately (may need tuning)
10. **Test coverage represents quality**: >80% coverage ensures adequate testing (not just metric gaming)

### Open Questions

| Question | Impact | Decision Needed By | Status |
|----------|--------|---------------------|--------|
| Should DecisionEngine support **learning from escalation responses** to improve future confidence scores? | High | Epic 2 or deferred to v1.1 | **Deferred**: Too complex for MVP; track escalation patterns manually for now |
| What if **Mary and John disagree** on requirements scope? How to resolve conflicts autonomously? | Medium | Story 2.4 | **Resolved**: John has final authority on scope decisions (PM role); document in agent personas |
| Should escalations support **priority levels** (critical, important, batch)? | Medium | Story 2.2 | **Resolved**: Yes, add priority field to Escalation schema; console shows all, Epic 6 dashboard filters by priority |
| How to handle **PRD regeneration** when validation fails? Full regeneration or incremental fixes? | Medium | Story 2.7 | **Resolved**: Incremental fixes - PRDValidator identifies gaps, regenerate only missing sections (more efficient) |
| Should workflow support **#yolo mode** to skip all escalations? | Low | Story 2.5 | **Resolved**: Yes, inherited from Epic 1's WorkflowEngine; useful for testing and confident users |
| What happens if **user abandons escalation** (never responds)? | Medium | Story 2.2 | **Open**: Current design pauses indefinitely; consider timeout (48 hours?) with default response or workflow cancellation |
| Can users **edit PRD.md manually** during workflow execution? | Low | Story 2.5 | **Open**: Not recommended; workflow may overwrite changes; consider workflow pause/resume for manual edits (future) |
| Should **multi-language PRDs** be supported (e.g., Chinese for Zhipu users)? | Low | Epic 2 or future | **Deferred**: English-only for MVP; language support is template/prompt engineering work for v1.1 |
| How to measure **PRD quality** beyond completeness score? User satisfaction? | Medium | Post-Epic 2 | **Open**: Track user ratings (manual); Epic 6 dashboard could include PRD rating feature |
| Should Mary/John agents **retain memory** across multiple PRD workflows for same user? | Medium | Epic 2 or future | **Deferred**: Stateless for MVP; agent memory is complex (requires vector DB, embeddings) - v1.1+ |

### Dependencies on Decisions

- **Escalation priority levels** (resolved) → Affects Escalation schema (Story 2.2) and Epic 6 dashboard design
- **Incremental PRD regeneration** (resolved) → Affects PRDValidator and PRDTemplateProcessor implementation (Story 2.7)
- **John's authority on scope conflicts** (resolved) → Affects John agent prompts and decision logic (Story 2.4)
- **Escalation timeout** (open) → May require EscalationQueue enhancement if decided before Epic 2 completion

## Test Strategy Summary

### Testing Approach

Epic 2 follows **ATDD (Acceptance Test-Driven Development)** - tests written alongside implementation to verify acceptance criteria immediately.

**Test Pyramid:**
- **Unit Tests** (70%): DecisionEngine, EscalationQueue, Mary/John agents, PRDValidator, PRDTemplateProcessor
- **Integration Tests** (25%): PRD workflow execution, Mary ↔ John collaboration, escalation flow
- **E2E Tests** (5%): Full PRD workflow from user input to docs/PRD.md (deferred to Story 5.12)

### Unit Test Strategy

**Story 2.1 - DecisionEngine:**
- Test confidence scoring (0.0-1.0 range)
- Test onboarding doc lookup (confidence 0.95 when found)
- Test LLM reasoning with temperature 0.3
- Test escalation threshold (<0.75 triggers escalation)
- Test decision metadata tracking (question, decision, confidence, reasoning)
- Mock LLMFactory to control LLM responses
- **Coverage target**: >90%

**Story 2.2 - EscalationQueue:**
- Test add() creates file in .bmad-escalations/ with correct schema
- Test list() filters by status ('pending', 'resolved', 'cancelled')
- Test list() filters by workflowId
- Test getById() retrieves correct escalation
- Test respond() updates escalation status and records response
- Test respond() calculates resolutionTime correctly
- Test getMetrics() aggregates counts and resolution times
- Mock file system for isolated testing
- **Coverage target**: >90%

**Story 2.3 - MaryAgent:**
- Test agent initialization with LLM config from project-config.yaml
- Test analyzeRequirements() returns structured data (requirements, successCriteria, assumptions)
- Test defineSuccessCriteria() generates measurable criteria
- Test negotiateScope() splits requirements into MVP and growth features
- Test DecisionEngine integration (confidence scoring for ambiguous requirements)
- Mock LLMFactory and DecisionEngine
- **Coverage target**: >80%

**Story 2.4 - JohnAgent:**
- Test agent initialization with LLM config
- Test defineProductVision() generates vision, positioning, valueProposition
- Test prioritizeFeatures() returns prioritized features with rationale
- Test assessMarketFit() generates target market and competitive advantage
- Test validation of Mary's requirements (scope challenge)
- Mock LLMFactory and DecisionEngine
- **Coverage target**: >80%

**Story 2.6 - PRDTemplateProcessor:**
- Test template loading and variable substitution
- Test section generation for all required sections
- Test domain adaptation (API vs mobile vs SaaS)
- Test requirement count (≥67 functional requirements)
- Test markdown formatting (tables, code blocks)
- Mock TemplateProcessor (Epic 1)
- **Coverage target**: >80%

**Story 2.7 - PRDValidator:**
- Test section presence checks (all required sections)
- Test clarity checks (flag vague requirements like "handle X")
- Test measurable criteria validation
- Test acceptance criteria validation
- Test contradiction detection
- Test gap identification
- Test completeness score calculation (0-100)
- **Coverage target**: >90%

### Integration Test Strategy

**Story 2.5 - PRD Workflow:**
- Test full workflow execution (initialization → finalization)
- Test Mary agent spawning and requirements analysis
- Test John agent spawning and strategic validation
- Test Mary ↔ John collaboration (shared context)
- Test template-output tag processing (incremental saves)
- Test elicit-required tag handling (#yolo mode skips)
- Test DecisionEngine integration (<3 escalations target)
- Test execution time (<30 minutes)
- Test docs/PRD.md generation (all sections populated)
- Test workflow-status.yaml update (mark PRD complete)
- Test quality validation (<85% triggers regeneration)
- Test escalation flow:
  1. DecisionEngine confidence <0.75 → escalation created
  2. Workflow pauses at escalation point
  3. User responds via EscalationQueue.respond()
  4. Workflow resumes with response
- Use test fixtures for user input and expected PRD output
- Mock LLM responses for deterministic testing
- **Coverage target**: >80%

### Test Data & Fixtures

**Test PRD inputs** (various project types):
- Simple API project (minimal requirements)
- Mobile app (UX-heavy)
- SaaS platform (complex domain)
- Game (narrative-heavy)
- Each with varying ambiguity levels to test escalations

**Expected outputs**:
- Complete PRD.md for each test input
- Escalation count metrics
- Completeness scores
- Execution time benchmarks

### Performance Testing

**Targets from NFRs:**
- PRD workflow execution: <30 minutes
- DecisionEngine: <5 seconds per decision
- Agent invocations: <30 seconds per call
- EscalationQueue operations: <100ms
- Metrics calculation: <500ms

**Performance tests:**
- Measure PRD workflow execution time with realistic LLM response times
- Measure DecisionEngine overhead for 10 decisions
- Measure EscalationQueue.getMetrics() with 100 escalations

### Mocking Strategy

**Mock Epic 1 components**:
- **LLMFactory**: Return deterministic LLM responses for tests
- **WorkflowEngine**: Test workflow step execution without full YAML parsing
- **AgentPool**: Control agent lifecycle for tests
- **StateManager**: Use in-memory state instead of file system
- **TemplateProcessor**: Return predictable template output

**Mock external services**:
- **Anthropic API**: Mock Claude responses (no real API calls in tests)
- **File system**: Use in-memory FS or temp directories

### Test Execution

**Local development**:
```bash
npm run test                 # Run all tests
npm run test:watch          # Watch mode for TDD
npm run test:coverage       # Generate coverage report
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
```

**CI/CD pipeline** (GitHub Actions from Epic 1):
- Run all tests on every commit
- Enforce coverage thresholds (>80% overall, >90% core)
- Block PRs if tests fail or coverage drops
- Generate test report artifacts

### Test Coverage Tracking

**Coverage targets (from Story 2.8)**:
- DecisionEngine: >90%
- EscalationQueue: >90%
- Mary/John agents: >80%
- PRD workflow: >80%
- Overall Epic 2: >85%

**Coverage enforcement**:
- Vitest coverage plugin (from Epic 1)
- CI/CD blocks merge if coverage < threshold
- Coverage reports uploaded to artifacts

### Test Quality Standards

**Test characteristics**:
- Fast: Unit tests <1s each, integration tests <10s each
- Isolated: No external dependencies (mock LLMs, file system)
- Deterministic: Same input always produces same output
- Readable: Clear test names, arrange-act-assert pattern
- Maintainable: DRY test utilities, shared fixtures

**Test patterns**:
- Arrange-Act-Assert (AAA)
- Given-When-Then for integration tests
- Test factories for complex object creation
- Shared test utilities in tests/utils/

### Definition of Done for Tests (Story 2.8)

Before Epic 2 is complete:
- [ ] All acceptance criteria have corresponding tests
- [ ] All unit tests passing (0 failures)
- [ ] All integration tests passing (0 failures)
- [ ] Coverage >85% overall, >90% for core components
- [ ] CI/CD pipeline passing
- [ ] No flaky tests (tests pass consistently)
- [ ] Test documentation in README (how to run, how to add new tests)
