# Agent Orchestrator - System Architecture

**Author:** Winston (Architect Agent)
**Date:** 2025-11-04
**Version:** 1.0
**Project:** Agent Orchestrator
**Project Level:** 3 (Medium Scale - 10+ concurrent projects, 100+ stories per project)

---

## Executive Summary

The Agent Orchestrator is an autonomous BMAD workflow execution system that enables 24/7 software development with minimal human intervention. This architecture document defines the technical design for a resilient, scalable orchestration platform that coordinates multiple AI agents across the software development lifecycle.

**Architectural Approach:** Microkernel pattern with event-driven extensions, optimized for autonomous agent coordination and parallel story development.

**Core Principles:**
1. **Autonomy First**: System makes 85%+ decisions independently with confidence-based escalation
2. **Parallel Intelligence**: Multiple stories develop simultaneously in isolated git worktrees
3. **State Resilience**: All execution state persisted for crash recovery and resume
4. **Remote Accessible**: Full monitoring and control via REST API + WebSocket
5. **Cost Conscious**: LLM provider abstraction enables cost/quality optimization per agent

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Epic 6)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │  React PWA       │   │  Mobile App      │   │  CLI Client      │   │
│  │  Dashboard       │   │  (Future)        │   │  (Local Dev)     │   │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘   │
│           │                       │                       │             │
│           └───────────────────────┴───────────────────────┘             │
│                                   │                                     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │ HTTPS / WSS
┌───────────────────────────────────┼─────────────────────────────────────┐
│                         API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Fastify REST API Server                                        │   │
│  │  - Authentication (JWT)                                          │   │
│  │  - Rate Limiting                                                 │   │
│  │  - Request Validation                                            │   │
│  └──────────────────────┬──────────────────────────────────────────┘   │
│  ┌──────────────────────┴──────────────────────────────────────────┐   │
│  │  WebSocket Server                                                │   │
│  │  - Real-time event streaming                                     │   │
│  │  - Project-level subscriptions                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │ Internal API
┌───────────────────────────────────┼─────────────────────────────────────┐
│                      ORCHESTRATOR CORE (MICROKERNEL)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  CORE KERNEL (Epic 1)                                          │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │     │
│  │  │ Workflow Engine│  │  Agent Pool    │  │ State Manager  │  │     │
│  │  │ (XML Parser)   │  │  (Lifecycle)   │  │ (File-based)   │  │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │     │
│  │  │ Template Proc. │  │  LLM Factory   │  │ Worktree Mgr   │  │     │
│  │  │ (Markdown)     │  │  (Multi-prov.) │  │ (Git Ops)      │  │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  WORKFLOW PLUGINS (Epics 2-5)                                  │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │     │
│  │  │ PRD Workflow   │  │ Arch. Workflow │  │ Story Workflow │  │     │
│  │  │ (Epic 2)       │  │ (Epic 3)       │  │ (Epic 4)       │  │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │     │
│  │  │ Dev Workflow   │  │ Code Review    │  │ PR Automation  │  │     │
│  │  │ (Epic 5)       │  │ Workflow       │  │ Workflow       │  │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │  SUPPORT SERVICES                                              │     │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │     │
│  │  │ Decision Eng.  │  │ Escalation Q.  │  │ Error Handler  │  │     │
│  │  │ (Confidence)   │  │ (Human Loop)   │  │ (Retry Logic)  │  │     │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │     │
│  └───────────────────────────────────────────────────────────────┘     │
└───────────────────────────────────┼─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────┐
│                        EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│  │ Anthropic API  │  │  OpenAI API    │  │  GitHub API    │           │
│  │ (Claude)       │  │  (GPT-4)       │  │  (PR/Git Ops)  │           │
│  └────────────────┘  └────────────────┘  └────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Architectural Pattern: Microkernel + Event-Driven

**Chosen Pattern:** **Microkernel Architecture** (also known as Plugin Architecture)

**Rationale:**
- **Core Kernel**: Minimal, stable workflow execution engine (Epic 1)
- **Plugins**: BMAD workflows loaded dynamically (Epics 2-5)
- **Extensibility**: New workflows added without core changes
- **Stability**: Core engine changes rarely; workflows evolve independently
- **Testability**: Each workflow plugin tested in isolation

**Event-Driven Layer:**
- **Event Bus**: Internal event streaming for real-time updates
- **Event Types**: agent.started, story.completed, phase.changed, escalation.created, pr.merged
- **Consumers**: WebSocket server, State manager, Notification service
- **Decoupling**: Components communicate via events, not direct calls

**Why Not Microservices?**
- **Overkill for v1.0**: Single-machine deployment sufficient for 10 projects
- **Complexity**: Service mesh, inter-service auth, distributed tracing not needed yet
- **Latency**: Agent coordination requires tight coupling, not network calls
- **Future**: Can extract services later (e.g., separate API service) if scale demands

---

## 2. Component Architecture

### 2.1 Core Kernel Components (Epic 1)

#### 2.1.1 Workflow Engine

**Responsibility:** Parse and execute BMAD workflow.yaml files with XML instructions

**Key Classes:**
```typescript
class WorkflowEngine {
  private workflowConfig: WorkflowConfig;
  private stepIndex: number;
  private variables: Map<string, any>;

  constructor(workflowPath: string);

  async execute(): Promise<void>;
  async executeStep(step: Step): Promise<void>;
  async resumeFromState(state: WorkflowState): Promise<void>;
  private replaceVariables(template: string): string;
  private evaluateCondition(condition: string): boolean;
  private handleGoto(targetStep: number): void;
  private handleInvokeWorkflow(workflowPath: string): Promise<void>;
}

class WorkflowParser {
  parseYAML(filePath: string): WorkflowConfig;
  parseInstructions(markdownFile: string): Step[];
  resolveVariables(config: WorkflowConfig, projectConfig: ProjectConfig): WorkflowConfig;
  validateWorkflow(config: WorkflowConfig): ValidationResult;
}
```

**Data Flow:**
1. Load workflow.yaml → Parse YAML → Resolve variables → Validate
2. Load instructions.md → Parse XML tags → Build step list
3. Execute step[0] → Save state → Execute step[1] → Save state → ...
4. On crash: Load state → Resume from last completed step

**State Persistence:**
- Save after each step to `bmad/sprint-status.yaml`
- Include: workflow name, current step, variables, agent activity
- Atomic writes (temp file + rename) to prevent corruption

**Error Handling:**
- Parse errors: Report line number and clear message, exit gracefully
- Step failures: Retry 3x with exponential backoff, then escalate
- Invalid variables: Fail fast with descriptive error

---

#### 2.1.2 Agent Pool

**Responsibility:** Manage AI agent lifecycle, LLM assignment, and resource limits

**Key Classes:**
```typescript
interface Agent {
  id: string;
  name: string; // "mary", "winston", "amelia", etc.
  persona: string; // Loaded from bmad/bmm/agents/{name}.md
  llmClient: LLMClient;
  context: AgentContext;
  startTime: Date;
  estimatedCost: number;
}

class AgentPool {
  private activeAgents: Map<string, Agent>;
  private agentQueue: AgentTask[];
  private maxConcurrentAgents: number; // From project config

  async createAgent(name: string, llmModel: string, context: AgentContext): Promise<Agent>;
  async destroyAgent(agentId: string): Promise<void>;
  async invokeAgent(agentId: string, prompt: string): Promise<string>;
  getActiveAgents(): Agent[];
  private enforceResourceLimits(): void;
}

class LLMFactory {
  private providers: Map<string, LLMProvider>;

  registerProvider(name: string, provider: LLMProvider): void;
  createClient(modelName: string): LLMClient;
}

interface LLMClient {
  invoke(prompt: string, options?: InvokeOptions): Promise<string>;
  stream(prompt: string, options?: StreamOptions): AsyncIterator<string>;
  estimateCost(prompt: string, response: string): number;
}
```

**Agent Lifecycle:**
1. **Create**: Load persona markdown → Initialize LLM client → Inject context
2. **Active**: Process tasks, track cost, emit events
3. **Destroy**: Save logs → Release LLM connection → Cleanup within 30s

**Concurrency Control:**
- Max concurrent agents configurable per project (default: 3)
- Queue additional agent tasks if pool at capacity
- Prioritize critical agents (e.g., Mary for PRD > Amelia for story)

**Cost Tracking:**
- Estimate tokens: prompt + response
- Calculate cost per LLM provider pricing
- Aggregate by project, agent, workflow
- Escalate if budget threshold exceeded (configurable)

---

#### 2.1.3 State Manager

**Responsibility:** Persist workflow state for crash recovery and monitoring

**Key Classes:**
```typescript
interface WorkflowState {
  project: {
    id: string;
    name: string;
    level: number;
  };
  currentWorkflow: string;
  currentStep: number;
  status: 'running' | 'paused' | 'completed' | 'error';
  variables: Record<string, any>;
  agentActivity: AgentActivity[];
  startTime: Date;
  lastUpdate: Date;
}

class StateManager {
  async saveState(state: WorkflowState): Promise<void>;
  async loadState(projectId: string): Promise<WorkflowState | null>;
  async getProjectPhase(projectId: string): Promise<string>; // "Analysis", "Planning", etc.
  async getStoryStatus(projectId: string, storyId: string): Promise<StoryStatus>;
  private atomicWrite(filePath: string, content: string): Promise<void>;
}
```

**Storage Strategy:**
- **Machine-readable**: `bmad/sprint-status.yaml` (YAML for structure)
- **Human-readable**: `bmad/workflow-status.md` (Markdown for display)
- **Parallel writes**: Both files updated simultaneously
- **Atomic writes**: Write to `.tmp` file, then rename to prevent corruption

**State Queries:**
- Dashboard queries state without re-reading entire files
- Cache parsed state in memory (invalidate on write)
- Efficient lookups for project phase, story status, agent activity

**Git Integration:**
- Auto-commit state changes with descriptive messages
- Example: "Phase 2 (Planning) started - Architecture workflow running"
- Enables state history and rollback if needed

---

#### 2.1.4 Worktree Manager

**Responsibility:** Create/manage git worktrees for parallel story development

**Key Classes:**
```typescript
interface Worktree {
  storyId: string;
  path: string; // /wt/story-{id}/
  branch: string; // story/{id}
  baseBranch: string; // main
  createdAt: Date;
  status: 'active' | 'pr-created' | 'merged' | 'abandoned';
}

class WorktreeManager {
  private worktrees: Map<string, Worktree>;
  private git: SimpleGit; // simple-git library

  async createWorktree(storyId: string): Promise<Worktree>;
  async destroyWorktree(storyId: string): Promise<void>;
  async pushBranch(storyId: string): Promise<void>;
  async listActiveWorktrees(): Promise<Worktree[]>;
  private validateWorktreeNotExists(storyId: string): void;
}
```

**Worktree Workflow:**
1. **Create**: `git worktree add /wt/story-005/ -b story/005 main`
2. **Develop**: Amelia agent works in `/wt/story-005/`
3. **Commit**: Local commits in worktree branch
4. **Push**: `git push -u origin story/005`
5. **PR**: Created via GitHub API
6. **Cleanup**: `git worktree remove /wt/story-005/` after merge

**Isolation Benefits:**
- **Parallel Development**: Multiple stories develop simultaneously
- **No Branch Conflicts**: Each worktree is independent
- **Fast Switching**: No need to stash/unstash changes
- **Clean History**: Each branch has focused commits

**Error Handling:**
- Worktree already exists: Error with clear message
- Git operation failure: Log error, cleanup partial state, escalate
- Merge conflicts: Detect early, escalate to human

---

#### 2.1.5 Template Processor

**Responsibility:** Process markdown templates with variable substitution

**Key Classes:**
```typescript
class TemplateProcessor {
  async processTemplate(
    templatePath: string,
    variables: Record<string, any>
  ): Promise<string>;

  async writeToFile(
    outputPath: string,
    content: string,
    mode: 'write' | 'edit'
  ): Promise<void>;

  private replaceVariables(template: string, variables: Record<string, any>): string;
  private evaluateConditionals(template: string, variables: Record<string, any>): string;
  private processLoops(template: string, variables: Record<string, any>): string;
}
```

**Template Syntax:**
```markdown
# {{project_name}}

## Vision
{{vision_alignment}}

{{#if has_ui}}
## UX Design
{{ux_summary}}
{{/if}}

{{#each functional_requirements}}
- {{requirement}}
{{/each}}
```

**Processing Rules:**
- **Variables**: Replace `{{variable}}` with actual value
- **Conditionals**: Process `{{#if condition}}...{{/if}}` blocks
- **Loops**: Iterate `{{#each collection}}...{{/each}}` blocks
- **Undefined**: Error if variable not found (strict mode)

**Output Strategy:**
- **First write**: Use `Write` tool (new file)
- **Subsequent updates**: Use `Edit` tool (incremental changes)
- **Preserve formatting**: Maintain markdown structure and indentation

---

### 2.2 Workflow Plugins (Epics 2-5)

Each BMAD workflow is a **plugin** to the core kernel. Workflows are self-contained with:
- `workflow.yaml`: Configuration and variables
- `instructions.md`: Step-by-step execution logic (XML tags)
- `template.md`: Output document template (if applicable)
- Supporting files: checklists, catalogs, patterns

**Workflow Execution Model:**
1. Kernel loads workflow.yaml → Resolves variables → Validates
2. Kernel parses instructions.md → Builds step list
3. Kernel executes steps in order → Spawns agents as needed → Saves state
4. Workflow completes → Updates workflow-status.yaml → Emits event

**Example Workflows:**
- **PRD Workflow** (Epic 2): Spawns Mary + John → Generates docs/PRD.md
- **Architecture Workflow** (Epic 3): Spawns Winston + Murat → Generates docs/architecture.md
- **Story Decomposition Workflow** (Epic 4): Spawns Bob → Generates docs/epics.md
- **Story Development Workflow** (Epic 5): Spawns Amelia → Creates PR

**Workflow Dependencies:**
- Workflows can invoke other workflows via `<invoke-workflow>` tag
- Example: `dev-story` workflow invokes `story-context` task
- Kernel manages workflow stack and state transitions

---

### 2.3 Support Services

#### 2.3.1 Decision Engine

**Responsibility:** Enable autonomous decisions with confidence-based escalation

**Key Classes:**
```typescript
interface Decision {
  question: string;
  answer: string;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  source: 'onboarding' | 'llm-inference' | 'human-response';
  timestamp: Date;
}

class DecisionEngine {
  private ESCALATION_THRESHOLD = 0.75;

  async attemptAutonomousDecision(
    question: string,
    context: DecisionContext
  ): Promise<Decision>;

  private async checkOnboardingDocs(question: string): Promise<Decision | null>;
  private async useLLMReasoning(question: string, context: DecisionContext): Promise<Decision>;
  private assessConfidence(answer: string, context: DecisionContext): number;
}
```

**Decision Flow:**
1. **Check Onboarding**: Search project onboarding docs for explicit answer
   - If found: Return with confidence 0.95 (high confidence)
2. **LLM Inference**: Use low-temperature LLM (0.3) for reasoning
   - Parse response for clarity, certainty indicators
   - Assess confidence based on answer quality and context sufficiency
3. **Confidence Check**:
   - If confidence >= 0.75: Proceed autonomously
   - If confidence < 0.75: Escalate to human
4. **Audit Trail**: Log all decisions with reasoning for review

**Confidence Scoring Factors:**
- Answer clarity (clear vs vague)
- Context sufficiency (enough info to decide?)
- Certainty indicators in LLM response ("definitely", "likely", "maybe")
- Onboarding doc match (exact > inferred > none)

---

#### 2.3.2 Escalation Queue

**Responsibility:** Queue decisions requiring human input and resume after response

**Key Classes:**
```typescript
interface Escalation {
  id: string;
  projectId: string;
  workflowName: string;
  stepNumber: number;
  question: string;
  aiReasoning: string;
  aiConfidence: number;
  context: Record<string, any>;
  status: 'pending' | 'responded' | 'resolved';
  createdAt: Date;
  response?: string;
  respondedAt?: Date;
}

class EscalationQueue {
  async add(escalation: Escalation): Promise<void>;
  async respond(escalationId: string, response: string): Promise<void>;
  async list(filters?: EscalationFilters): Promise<Escalation[]>;
  async getById(escalationId: string): Promise<Escalation>;
}
```

**Escalation Workflow:**
1. **Trigger**: DecisionEngine confidence < 0.75
2. **Pause**: Workflow execution pauses at escalation point
3. **Notify**: Event emitted → WebSocket → Dashboard notification
4. **User Response**: User reviews question, AI reasoning, context → Responds
5. **Resume**: Workflow resumes from escalation step with user response

**Storage:**
- Save to `.bmad-escalations/{id}.json`
- Track metrics: count, resolution time, categories
- Archive resolved escalations for learning

**Notification Strategy:**
- **Critical Escalations**: Modal interrupt in dashboard (e.g., phase gate approval)
- **Important Escalations**: Toast notification (e.g., ambiguous requirement)
- **Batch Escalations**: Badge indicator (e.g., multiple during PRD generation)

---

#### 2.3.3 Error Handler

**Responsibility:** Retry transient failures, gracefully degrade, escalate when needed

**Key Classes:**
```typescript
class ErrorHandler {
  async handleError(error: Error, context: ErrorContext): Promise<ErrorResolution>;
  private classifyError(error: Error): ErrorType; // recoverable, retryable, escalation
  private async retryWithBackoff(fn: Function, maxAttempts: number): Promise<any>;
}

class RetryHandler {
  async retry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;
}

interface RetryOptions {
  maxAttempts: number; // Default: 3
  backoffMs: number[]; // [1000, 2000, 4000]
  retryableErrors: ErrorType[];
}
```

**Error Classification:**
- **Recoverable**: Handled internally, log and continue (e.g., optional file missing)
- **Retryable**: Retry with exponential backoff (e.g., LLM API rate limit)
- **Escalation**: Human intervention required (e.g., Git merge conflict)

**Retry Strategy:**
- **LLM API Failures**: Retry 3x with [1s, 2s, 4s] backoff, then escalate
- **Git Operations**: Clean state, log error, escalate (no retry)
- **File I/O**: Retry 2x with 500ms backoff, then escalate

**Graceful Degradation:**
- **One Project Fails**: Continue other projects (isolation)
- **Agent Spawn Fails**: Queue task, retry later
- **State Save Fails**: Log error, continue execution (risky but better than crash)

**Health Monitoring:**
- Expose `/health` endpoint for monitoring
- Report: uptime, active projects, agent pool status, recent errors
- Alert if error rate exceeds threshold

---

## 3. Data Models

### 3.1 Core Domain Models

#### Project Configuration

```yaml
# .bmad/project-config.yaml
project:
  name: "Agent Orchestrator"
  id: "agent-orchestrator-001"
  level: 3
  repository: "https://github.com/user/agent-orchestrator"

agents:
  mary: "claude-sonnet-4-5"      # Analyst
  john: "claude-sonnet-4-5"      # PM
  winston: "claude-sonnet-4-5"   # Architect
  murat: "claude-sonnet-4-5"     # Test Architect
  bob: "claude-haiku-4"          # Scrum Master (cost-effective)
  amelia: "gpt-4-turbo"          # Developer (superior code gen)

onboarding:
  - docs/onboarding/coding-standards.md
  - docs/onboarding/architecture-principles.md

settings:
  max_concurrent_agents: 3
  llm_budget_usd: 50
  auto_merge_prs: false
  escalation_threshold: 0.75
```

#### Workflow State

```yaml
# bmad/sprint-status.yaml
generated: "2025-11-04T10:30:00Z"
project:
  id: "agent-orchestrator-001"
  name: "Agent Orchestrator"
  level: 3

current_workflow:
  name: "dev-story"
  path: "bmad/bmm/workflows/dev-story/workflow.yaml"
  step: 5
  status: "running"

variables:
  story_id: "story-005"
  worktree_path: "/wt/story-005/"

agent_activity:
  - agent: "amelia"
    task: "Implementing Story 5.3"
    llm: "gpt-4-turbo"
    start_time: "2025-11-04T10:25:00Z"
    estimated_cost: 0.42

phase_progress:
  current_phase: "Implementation"
  phase_status: "in_progress"
  stories_total: 61
  stories_completed: 14
  stories_in_progress: 3
```

#### Story Metadata

```yaml
# docs/stories/story-005.md frontmatter
---
id: "story-005"
epic: "Epic 1: Foundation"
title: "State Manager - File Persistence"
status: "in_progress"
assigned_agent: "amelia"
worktree: "/wt/story-005/"
pr_number: null
dependencies: ["story-001"]
created_at: "2025-11-03"
started_at: "2025-11-04T10:25:00Z"
---
```

---

### 3.2 Database Strategy: File-Based (No SQL Database)

**Decision:** Use file-based storage with YAML/Markdown instead of SQL database

**Rationale:**
1. **Simplicity**: No database setup, migrations, or schema management
2. **Git-Friendly**: All state versioned in git (history, rollback, collaboration)
3. **Human-Readable**: YAML/Markdown readable by users and AI agents
4. **Low Complexity**: Eliminates database as failure point
5. **Sufficient Scale**: 10 projects × 100 stories = 1000 files (manageable)

**Trade-offs:**
- **Query Performance**: Slower than SQL for complex queries (acceptable for v1.0)
- **Concurrency**: File locking required for writes (low contention expected)
- **Atomicity**: Must implement atomic writes manually (temp + rename pattern)

**Future Migration Path:**
- If scale exceeds 50 projects or queries become slow:
  - Add SQLite for fast queries (read replicas of file state)
  - Or migrate to PostgreSQL for multi-machine orchestrator
- File-based state remains source of truth initially

---

### 3.3 API Data Models (Epic 6)

#### REST API Request/Response Models

```typescript
// Project Management
interface CreateProjectRequest {
  name: string;
  repository: string;
  level: number;
  agents: Record<string, string>; // agent name -> LLM model
  initialRequirements?: string;
}

interface ProjectResponse {
  id: string;
  name: string;
  level: number;
  currentPhase: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  lastUpdate: Date;
  attentionItems: AttentionItem[];
}

interface AttentionItem {
  type: 'escalation' | 'gate-approval' | 'build-failure';
  severity: 'critical' | 'important' | 'info';
  message: string;
  link?: string;
}

// Workflow Control
interface StartWorkflowRequest {
  workflowName: string;
  variables?: Record<string, any>;
}

interface WorkflowStatusResponse {
  workflowName: string;
  step: number;
  totalSteps: number;
  status: 'running' | 'paused' | 'completed' | 'error';
  agentActivity: AgentActivity[];
  progressPercentage: number;
}

// Escalation
interface EscalationResponse {
  id: string;
  question: string;
  aiReasoning: string;
  aiConfidence: number;
  context: Record<string, any>;
  status: 'pending' | 'responded';
  createdAt: Date;
}

interface RespondToEscalationRequest {
  response: string;
}

// Story Management
interface StoryResponse {
  id: string;
  epicId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'review' | 'merged' | 'blocked';
  worktree?: string;
  prNumber?: number;
  dependencies: string[];
  assignedAgent?: string;
}
```

#### WebSocket Event Models

```typescript
interface WebSocketEvent {
  eventType: string;
  projectId: string;
  timestamp: Date;
  data: any;
}

// Event Types
interface PhaseChangedEvent extends WebSocketEvent {
  eventType: 'project.phase.changed';
  data: {
    from: string;
    to: string;
  };
}

interface StoryStatusChangedEvent extends WebSocketEvent {
  eventType: 'story.status.changed';
  data: {
    storyId: string;
    from: string;
    to: string;
  };
}

interface EscalationCreatedEvent extends WebSocketEvent {
  eventType: 'escalation.created';
  data: {
    escalationId: string;
    question: string;
    severity: 'critical' | 'important';
  };
}

interface AgentStartedEvent extends WebSocketEvent {
  eventType: 'agent.started';
  data: {
    agentName: string;
    task: string;
    llmModel: string;
  };
}

interface PRCreatedEvent extends WebSocketEvent {
  eventType: 'pr.created';
  data: {
    storyId: string;
    prNumber: number;
    prUrl: string;
  };
}
```

---

## 4. API Specifications

### 4.1 REST API Endpoints (Epic 6)

**Base URL:** `https://orchestrator.example.com/api`

**Authentication:** JWT Bearer Token
- Token includes: user ID, project access list, expiration
- Obtained via POST /api/auth/login (username/password or OAuth)

#### Projects API

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

**Example: List Projects**
```http
GET /api/projects?status=active&phase=Implementation
Authorization: Bearer <jwt_token>

Response 200 OK:
{
  "projects": [
    {
      "id": "proj-001",
      "name": "Agent Orchestrator",
      "level": 3,
      "currentPhase": "Implementation",
      "status": "active",
      "lastUpdate": "2025-11-04T10:30:00Z",
      "attentionItems": [
        {
          "type": "escalation",
          "severity": "important",
          "message": "Story 5.3 needs input on error handling strategy",
          "link": "/api/escalations/esc-042"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

#### Workflow Control API

```
GET  /api/orchestrators/:projectId/status
POST /api/orchestrators/:projectId/start
POST /api/orchestrators/:projectId/pause
POST /api/orchestrators/:projectId/resume
```

**Example: Get Orchestrator Status**
```http
GET /api/orchestrators/proj-001/status
Authorization: Bearer <jwt_token>

Response 200 OK:
{
  "workflowName": "dev-story",
  "step": 5,
  "totalSteps": 10,
  "status": "running",
  "agentActivity": [
    {
      "agentName": "amelia",
      "task": "Writing tests for Story 5.3",
      "llmModel": "gpt-4-turbo",
      "startTime": "2025-11-04T10:25:00Z",
      "estimatedCost": 0.42
    }
  ],
  "progressPercentage": 50
}
```

#### Escalation API

```
GET  /api/escalations
GET  /api/escalations/:id
POST /api/escalations/:id/respond
```

**Example: Respond to Escalation**
```http
POST /api/escalations/esc-042/respond
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "response": "Use try-catch with exponential backoff for LLM API failures. Escalate after 3 retries."
}

Response 200 OK:
{
  "escalationId": "esc-042",
  "status": "resolved",
  "workflowResumed": true
}
```

#### State Query API

```
GET /api/projects/:id/workflow-status
GET /api/projects/:id/sprint-status
GET /api/projects/:id/stories
GET /api/projects/:id/stories/:storyId
```

**Example: Get Stories**
```http
GET /api/projects/proj-001/stories?status=in_progress&epic=Epic 5
Authorization: Bearer <jwt_token>

Response 200 OK:
{
  "stories": [
    {
      "id": "story-005",
      "epicId": "epic-1",
      "title": "State Manager - File Persistence",
      "status": "in_progress",
      "worktree": "/wt/story-005/",
      "prNumber": null,
      "dependencies": ["story-001"],
      "assignedAgent": "amelia"
    }
  ],
  "total": 1
}
```

---

### 4.2 WebSocket API

**Endpoint:** `wss://orchestrator.example.com/ws/status-updates`

**Authentication:** JWT token via query param or initial message

**Connection Flow:**
1. Client connects: `wss://orchestrator.example.com/ws/status-updates?token=<jwt>`
2. Client subscribes to project: `{"action": "subscribe", "projectId": "proj-001"}`
3. Server sends events: `{"eventType": "story.status.changed", "projectId": "proj-001", ...}`
4. Client unsubscribes: `{"action": "unsubscribe", "projectId": "proj-001"}`
5. Client disconnects

**Event Types:**
- `project.phase.changed`: Phase transition (Analysis → Planning)
- `story.status.changed`: Story status update (pending → in_progress)
- `escalation.created`: New escalation needs attention
- `agent.started` / `agent.completed`: Agent lifecycle events
- `pr.created` / `pr.merged`: GitHub PR events
- `workflow.error`: Workflow execution error

**Reconnection Handling:**
- Client implements exponential backoff: 1s, 2s, 4s, 8s, max 30s
- Server sends `heartbeat` ping every 30 seconds
- Client responds with `pong` to maintain connection

---

## 5. Technology Stack Decisions

**Version Verification:** All technology versions verified current as of 2025-11-04. Versions represent stable, production-ready releases with active maintenance and community support.

### Decision Summary

**Quick Reference:** All major architectural decisions at a glance.

| Category | Decision | Version | Rationale |
|----------|----------|---------|-----------|
| **Architecture Pattern** | Microkernel + Event-Driven | N/A | Extensibility without core changes, workflow plugins isolated, event-driven decoupling |
| **Data Persistence** | File-based (YAML/Markdown) | N/A | Simple, git-friendly, human-readable, sufficient for v1.0 scale (10 projects) |
| **Backend Runtime** | Node.js | 20 LTS | LLM library ecosystem, async I/O, excellent TypeScript support |
| **Backend Language** | TypeScript | 5+ | Type safety, refactoring confidence, better developer experience |
| **Web Framework** | Fastify | 4+ | 2-3x faster than Express, excellent TypeScript support, modern plugin ecosystem |
| **LLM Providers** | Anthropic (Claude) + OpenAI (GPT-4) | Latest SDKs | Multi-provider enables cost/quality optimization per agent |
| **Git Workflow** | Worktrees | Git 2.25+ | True isolation for parallel story development, no branch switching overhead |
| **API Pattern** | REST + WebSocket | N/A | REST for CRUD operations, WebSocket for real-time updates |
| **Authentication** | JWT | jsonwebtoken ^9.0 | Industry standard, stateless, works with frontend/backend |
| **State Storage** | File-based YAML | js-yaml ^4.1 | Sufficient for v1.0, PostgreSQL migration path documented |
| **Testing Framework** | Vitest | ^1.0 | Fast, Vite-based, excellent TypeScript support, 60%/30%/10% test pyramid |
| **Frontend Framework** | React | 18+ | Component model, rich ecosystem, per UX design specification |
| **Frontend Build Tool** | Vite | 5+ | Fast dev server, optimized builds, modern tooling |
| **UI Library** | shadcn/ui + Radix UI | Latest | Per UX spec, accessible (WCAG 2.1 AA), fully customizable |
| **Styling** | Tailwind CSS | 3+ | Per UX spec, rapid responsive design, excellent with shadcn/ui |
| **State Management (Frontend)** | Zustand | ^4.4 | Simple, no boilerplate, TypeScript-friendly |
| **Server State (Frontend)** | TanStack Query | ^5.10 | Cache, refetch, optimistic updates, server state management |
| **Deployment (v1.0)** | Single-machine (Linux VPS) | Ubuntu 22.04 LTS | Sufficient for 10 projects, simple, cost-effective |
| **Process Manager** | PM2 | Latest | Auto-restart, log rotation, production process management |
| **Reverse Proxy** | Nginx | Latest | Static file serving, HTTPS termination, WebSocket proxy |
| **Logging** | pino | ^8.16 | Fast structured logging, JSON output, sanitization support |
| **Validation** | zod | ^3.22 | TypeScript-first schema validation, API request validation |
| **Git Operations** | simple-git | ^3.20 | Node.js git wrapper, supports worktrees, well-maintained |
| **HTTP Client** | undici | ^6.0 | Fast, modern, Node.js recommended HTTP client |
| **GitHub Integration** | @octokit/rest | ^20.0 | Official GitHub REST API client, PR automation |

**Future Migration Paths:**
- **Data:** File-based → PostgreSQL (when scale exceeds 50 projects or queries slow)
- **Deployment:** Single-machine → Multi-machine with Redis + Bull queue (v2.0)
- **Monitoring:** Add Prometheus + Grafana, Sentry error tracking (v1.1)

---

### 5.1 Backend Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | Node.js 20 LTS | LLM library ecosystem, async I/O, familiarity |
| **Language** | TypeScript 5+ | Type safety, better DX, refactoring confidence |
| **Web Framework** | Fastify 4+ | Fast, TypeScript-friendly, plugin ecosystem, better than Express |
| **WebSocket** | ws library | Lightweight, well-tested, Fastify integration |
| **Git Operations** | simple-git | Node.js git wrapper, supports worktrees, active maintenance |
| **YAML Parser** | js-yaml | Standard YAML parser, schema validation support |
| **Markdown Parser** | marked | Fast, extensible, supports GFM |
| **HTTP Client** | undici | Fast, modern, Node.js recommended |
| **Testing** | Vitest | Fast, Vite-based, great TypeScript support |
| **Logging** | pino | Fast structured logging, JSON output |
| **Validation** | zod | TypeScript-first schema validation |

**Dependencies:**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "openai": "^4.20.0",
    "@octokit/rest": "^20.0.0",
    "fastify": "^4.24.0",
    "ws": "^8.14.0",
    "simple-git": "^3.20.0",
    "js-yaml": "^4.1.0",
    "marked": "^10.0.0",
    "undici": "^6.0.0",
    "pino": "^8.16.0",
    "pino-pretty": "^10.2.0",
    "zod": "^3.22.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

---

### 5.2 Frontend Stack (Epic 6)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | React 18+ | Component model, ecosystem, UX design spec |
| **Build Tool** | Vite 5+ | Fast dev server, optimized builds, modern |
| **UI Library** | shadcn/ui + Radix UI | Per UX spec, accessible, customizable |
| **Styling** | Tailwind CSS 3+ | Per UX spec, rapid responsive design |
| **Theme Tool** | tweakcn | CLI tool for easy shadcn/ui theme customization |
| **State Management** | Zustand | Simple, no boilerplate, TypeScript-friendly |
| **Server State** | TanStack Query | Cache, refetch, optimistic updates |
| **Routing** | React Router 6+ | Standard, type-safe, data loading |
| **Forms** | React Hook Form | Performance, validation, low re-renders |
| **Charts** | Recharts | React-friendly, responsive, shadcn integration |
| **Icons** | Lucide React | Clean, consistent, tree-shakeable |
| **Date/Time** | date-fns | Lightweight, tree-shakeable, i18n support |

**Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.10.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.294.0",
    "recharts": "^2.10.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tweakcn": "latest"
  }
}
```

---

### 5.3 External Services

| Service | Provider | Purpose | Pricing Model |
|---------|----------|---------|---------------|
| **LLM API** | Anthropic (Claude) | Mary, John, Winston, Murat, Bob agents | Pay-per-token (~$3-15/M tokens) |
| **LLM API** | OpenAI (GPT-4) | Amelia agent (superior code gen) | Pay-per-token (~$10-30/M tokens) |
| **Git Hosting** | GitHub | Repository, PR automation, CI/CD | Free for public, $4/user/month private |
| **Secrets** | Environment Vars | API keys, JWT secret | Free (local .env) |

**Future Considerations:**
- **Cloud Hosting**: Railway, Render, or AWS (after v1.0 local deployment)
- **Monitoring**: Sentry for error tracking, Prometheus + Grafana for metrics
- **Database**: PostgreSQL if file-based storage becomes bottleneck

---

### 5.4 Naming Conventions

**Purpose:** Ensure consistent naming across the codebase for AI agent clarity and maintainability.

#### Backend (TypeScript/Node.js)

**Files and Directories:**
- **Source files**: `kebab-case.ts` (e.g., `workflow-engine.ts`, `agent-pool.ts`)
- **Test files**: `kebab-case.test.ts` (e.g., `workflow-engine.test.ts`)
- **Directories**: `kebab-case` (e.g., `src/core/`, `src/workflows/`)
- **Config files**: `kebab-case.yaml` or `kebab-case.json`

**Code Elements:**
- **Classes**: `PascalCase` (e.g., `WorkflowEngine`, `AgentPool`, `StateManager`)
- **Interfaces**: `PascalCase` with "I" prefix optional (e.g., `LLMClient`, `Agent`, `WorkflowConfig`)
- **Types**: `PascalCase` (e.g., `ErrorType`, `WorkflowState`)
- **Functions/Methods**: `camelCase` (e.g., `createAgent()`, `executeStep()`, `saveState()`)
- **Variables**: `camelCase` (e.g., `currentStep`, `agentPool`, `workflowConfig`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `ESCALATION_THRESHOLD`, `DEFAULT_TIMEOUT`)
- **Private members**: Prefix with `_` (e.g., `_internalState`, `_processQueue()`)

**API Endpoints:**
- **REST routes**: `lowercase` with hyphens (e.g., `/api/projects`, `/api/workflow-status`)
- **Path parameters**: `camelCase` in code, `:id` format in route (e.g., `/api/projects/:projectId`)
- **Query parameters**: `snake_case` (e.g., `?status=active&phase=planning`)

**Database/State Files:**
- **YAML files**: `kebab-case.yaml` (e.g., `project-config.yaml`, `sprint-status.yaml`)
- **State directories**: `kebab-case` (e.g., `.bmad-escalations/`, `.bmad/`)
- **File-based IDs**: `kebab-case-with-id` (e.g., `project-001`, `story-005`)

#### Frontend (React/TypeScript)

**Files and Directories:**
- **React components**: `PascalCase.tsx` (e.g., `ProjectCard.tsx`, `EscalationModal.tsx`)
- **Component directories**: `PascalCase/` (e.g., `ProjectCard/`, `shared/Button/`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-project-status.ts`, `use-websocket.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `api-client.ts`, `format-date.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `project.types.ts`, `workflow.types.ts`)
- **Test files**: `ComponentName.test.tsx`

**Code Elements:**
- **React Components**: `PascalCase` (e.g., `ProjectCard`, `PhaseKanbanBoard`, `StoryCard`)
- **Component props**: `PascalCase` interface (e.g., `ProjectCardProps`)
- **Hooks**: `useCamelCase` (e.g., `useProjectStatus`, `useWebSocket`, `useAuth`)
- **Functions**: `camelCase` (e.g., `fetchProjects()`, `handleSubmit()`)
- **Variables**: `camelCase` (e.g., `projectList`, `isLoading`, `errorMessage`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`, `WS_RECONNECT_DELAY`)
- **CSS classes**: `kebab-case` (e.g., `project-card`, `escalation-modal`, `status-badge`)

**State Management (Zustand):**
- **Store files**: `use-store-name.ts` (e.g., `use-auth-store.ts`, `use-projects-store.ts`)
- **Store actions**: `camelCase` (e.g., `setUser()`, `addProject()`, `clearCache()`)

#### Git Conventions

**Branches:**
- **Feature**: `feature/short-description` (e.g., `feature/agent-pool`)
- **Story**: `story/{id}` (e.g., `story/005`)
- **Bugfix**: `bugfix/issue-description`
- **Release**: `release/v1.0.0`

**Worktrees:**
- **Location**: `/wt/story-{id}/` (e.g., `/wt/story-005/`)
- **Branch name**: `story/{id}` (matches story ID)

**Commit Messages:**
- **Format**: `<type>: <description>` (e.g., `feat: add agent pool lifecycle management`)
- **Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- **Agent commits**: Include signature (e.g., `🤖 Generated with Amelia (Developer Agent)`)

#### Event and Message Conventions

**WebSocket Events:**
- **Event types**: `subject.action.qualifier` (e.g., `project.phase.changed`, `story.status.changed`)
- **Lowercase**: All lowercase with dots as separators

**Log Messages:**
- **Structured**: JSON format with consistent fields
- **Level**: `debug`, `info`, `warn`, `error`, `critical`
- **Context fields**: `camelCase` (e.g., `projectId`, `storyId`, `agentName`)

#### Environment Variables

**Format:** `UPPER_SNAKE_CASE` with meaningful prefixes

```bash
# API Keys
ANTHROPIC_API_KEY
OPENAI_API_KEY
GITHUB_TOKEN

# Server Configuration
PORT
JWT_SECRET
NODE_ENV

# LLM Configuration
LLM_MAX_RETRIES
LLM_TIMEOUT_MS
```

---

## 6. Security Architecture

### 6.1 Threat Model

**Assets to Protect:**
1. **API Keys**: Anthropic/OpenAI keys (high value, costly if leaked)
2. **User Data**: Project code, requirements, architecture docs
3. **Git Repository**: Source code, commit history
4. **Dashboard Access**: Orchestrator control interface

**Threats:**
1. **API Key Exposure**: Keys committed to git, logged, or transmitted insecurely
2. **Unauthorized API Access**: Attackers control orchestrator, start workflows, read data
3. **Code Injection**: Malicious workflow.yaml or instructions.md executed
4. **Secrets in Logs**: API keys, tokens logged to files
5. **SSRF (Server-Side Request Forgery)**: Orchestrator fetches attacker URLs

---

### 6.2 Security Controls

#### Authentication & Authorization

**JWT-based Authentication:**
```typescript
interface JWTPayload {
  userId: string;
  projectAccess: string[]; // List of project IDs user can access
  exp: number; // Expiration timestamp
}

class AuthService {
  generateToken(userId: string, projectAccess: string[]): string;
  verifyToken(token: string): JWTPayload | null;
}
```

**Implementation:**
- Secret key stored in environment variable (not in code)
- Token expiration: 24 hours
- Refresh token mechanism for long-lived sessions
- Role-based access (future): admin, developer, viewer

**API Rate Limiting:**
- Per-user: 100 requests/minute
- Per-IP: 1000 requests/minute
- LLM API: Budget tracking, alert at 80% usage
- Fastify rate-limit plugin

---

#### Secrets Management

**Strategy: Environment Variables + Secret Vault (Future)**

**Current (v1.0):**
```bash
# .env (git-ignored)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
JWT_SECRET=random-256-bit-secret
GITHUB_TOKEN=ghp_...
```

**Future (v1.1+):**
- Use HashiCorp Vault or AWS Secrets Manager
- Rotate secrets automatically
- Audit secret access

**Code Practices:**
- Never log API keys (sanitize logs)
- Never commit secrets to git (pre-commit hook checks)
- Use `REDACTED` placeholder in debug logs

---

#### Input Validation

**Prevent Code Injection:**

```typescript
class WorkflowValidator {
  validateWorkflowYAML(config: WorkflowConfig): ValidationResult {
    // 1. Schema validation (zod)
    const result = WorkflowConfigSchema.safeParse(config);
    if (!result.success) return { valid: false, errors: result.error };

    // 2. Path traversal prevention
    if (config.instructions.includes('..') || config.instructions.includes('~')) {
      return { valid: false, errors: ['Path traversal detected'] };
    }

    // 3. URL validation (prevent SSRF)
    if (config.template?.startsWith('http://') || config.template?.startsWith('https://')) {
      return { valid: false, errors: ['Remote template URLs not allowed'] };
    }

    // 4. Command injection (no shell execution in workflows)
    // Workflows use Node.js APIs only, not shell commands

    return { valid: true };
  }
}
```

**API Input Validation:**
- Use zod schemas for all API request bodies
- Sanitize user input (escape HTML, validate URLs)
- Reject requests with invalid JWT tokens

---

#### Secure Logging

**Structured Logging with Sanitization:**

```typescript
const logger = pino({
  level: 'info',
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Exclude headers with sensitive data
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? 'REDACTED' : undefined,
      },
    }),
    res: pino.stdSerializers.res,
  },
  // Custom serializer to redact API keys
  redact: {
    paths: ['*.apiKey', '*.api_key', '*.token', '*.password'],
    censor: '[REDACTED]',
  },
});
```

**Log Levels:**
- **debug**: Verbose (development only)
- **info**: Normal operations (workflow started, story completed)
- **warn**: Recoverable errors (LLM API rate limit, retry triggered)
- **error**: Unrecoverable errors (workflow failed, escalation)
- **critical**: System-wide failures (orchestrator crash)

---

#### Network Security

**HTTPS Enforcement:**
- All API traffic over HTTPS (TLS 1.2+)
- HTTP redirects to HTTPS
- HSTS (HTTP Strict Transport Security) header

**CORS Configuration:**
```typescript
fastify.register(cors, {
  origin: [
    'https://dashboard.example.com', // Production dashboard
    'http://localhost:5173',         // Local dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});
```

**CSP (Content Security Policy):**
- Dashboard: Only load scripts from same origin + CDN
- No inline scripts (prevent XSS)

---

### 6.3 Security Testing

**Automated Testing:**
- **Dependency Scanning**: `npm audit` in CI/CD
- **SAST (Static Analysis)**: ESLint security plugins
- **Secret Scanning**: git-secrets pre-commit hook

**Manual Testing:**
- **Penetration Testing**: After v1.0 release
- **Security Audit**: Third-party review (recommended)

---

## 7. Testing Strategy

### 7.1 Test Pyramid

```
         /\
        /E2E\       10% - End-to-End (Full workflow execution)
       /------\
      /Integr.\    30% - Integration (Component interactions)
     /----------\
    /  Unit     \  60% - Unit (Individual functions/classes)
   /--------------\
```

**Rationale:** Fast feedback from unit tests, confidence from E2E tests

---

### 7.2 Unit Testing (60%)

**Scope:** Individual functions, classes, utilities

**Framework:** Vitest (fast, TypeScript-friendly)

**Coverage Target:** >80% code coverage

**Example Tests:**
```typescript
// WorkflowParser.test.ts
describe('WorkflowParser', () => {
  it('should parse valid workflow YAML', () => {
    const parser = new WorkflowParser();
    const config = parser.parseYAML('test-fixtures/valid-workflow.yaml');
    expect(config.name).toBe('test-workflow');
    expect(config.variables).toHaveProperty('output_folder');
  });

  it('should throw error on invalid YAML', () => {
    const parser = new WorkflowParser();
    expect(() => parser.parseYAML('test-fixtures/invalid.yaml'))
      .toThrow('Invalid YAML syntax');
  });

  it('should resolve variables correctly', () => {
    const parser = new WorkflowParser();
    const config = parser.resolveVariables(rawConfig, projectConfig);
    expect(config.variables.output_folder).toBe('/home/user/docs');
  });
});
```

**Test Utilities:**
- **Mocking**: Mock LLM API calls (avoid real API costs)
- **Fixtures**: Sample workflow.yaml, PRD.md for testing
- **Assertions**: Vitest matchers + custom matchers for domain logic

---

### 7.3 Integration Testing (30%)

**Scope:** Component interactions, database/file I/O, external API mocking

**Example Tests:**
```typescript
// AgentPool.integration.test.ts
describe('AgentPool Integration', () => {
  it('should create agent with LLM client', async () => {
    const factory = new LLMFactory();
    factory.registerProvider('anthropic', mockAnthropicProvider);

    const pool = new AgentPool(factory, { maxConcurrentAgents: 3 });
    const agent = await pool.createAgent('mary', 'claude-sonnet-4-5', mockContext);

    expect(agent.name).toBe('mary');
    expect(agent.llmClient).toBeDefined();
    expect(pool.getActiveAgents()).toHaveLength(1);
  });

  it('should queue tasks when pool at capacity', async () => {
    const pool = new AgentPool(factory, { maxConcurrentAgents: 2 });

    // Create 3 agents (3rd should queue)
    await pool.createAgent('mary', 'claude-sonnet-4-5', mockContext);
    await pool.createAgent('john', 'claude-sonnet-4-5', mockContext);
    const thirdPromise = pool.createAgent('winston', 'claude-sonnet-4-5', mockContext);

    expect(pool.getActiveAgents()).toHaveLength(2);

    // Destroy one agent, 3rd should be created
    await pool.destroyAgent(pool.getActiveAgents()[0].id);
    await thirdPromise;

    expect(pool.getActiveAgents()).toHaveLength(2);
  });
});
```

**Mocking Strategy:**
- **LLM APIs**: Mock with pre-defined responses (vitest.mock)
- **Git Operations**: Use in-memory git or test repositories
- **File I/O**: Use temp directories (fs-extra)

---

### 7.4 End-to-End Testing (10%)

**Scope:** Full workflow execution, API requests, WebSocket events

**Framework:** Playwright (for dashboard E2E) + Vitest (for API E2E)

**Example Tests:**
```typescript
// prd-workflow.e2e.test.ts
describe('PRD Workflow E2E', () => {
  it('should execute PRD workflow and generate PRD.md', async () => {
    // Setup: Create test project
    const projectId = await createTestProject({
      name: 'Test Project',
      level: 2,
      initialRequirements: 'Build a todo app',
    });

    // Execute: Start PRD workflow
    const orchestrator = new Orchestrator();
    await orchestrator.startWorkflow(projectId, 'prd');

    // Wait for completion (with timeout)
    await waitForWorkflowCompletion(projectId, { timeout: 60000 });

    // Assert: PRD.md exists and has expected structure
    const prdPath = `test-projects/${projectId}/docs/PRD.md`;
    expect(fs.existsSync(prdPath)).toBe(true);

    const prdContent = fs.readFileSync(prdPath, 'utf-8');
    expect(prdContent).toContain('## Vision Alignment');
    expect(prdContent).toContain('## Functional Requirements');

    // Assert: Workflow state updated
    const state = await stateManager.loadState(projectId);
    expect(state.workflow_status.prd).toBe(prdPath);
  }, 120000); // 2 minute timeout
});
```

**Dashboard E2E Tests (Playwright):**
```typescript
// dashboard.e2e.test.ts
test('should display project status and escalations', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173');
  await page.fill('input[name="username"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for portfolio view
  await page.waitForSelector('[data-testid="project-card"]');

  // Verify project displayed
  const projectCard = page.locator('[data-testid="project-card"]').first();
  await expect(projectCard).toContainText('Test Project');
  await expect(projectCard).toContainText('Phase 2: Planning');

  // Click project to view details
  await projectCard.click();
  await page.waitForSelector('[data-testid="kanban-board"]');

  // Verify escalation badge
  const escalationBadge = page.locator('[data-testid="escalation-badge"]');
  await expect(escalationBadge).toContainText('1');
});
```

---

### 7.5 Test Data Management

**Test Fixtures:**
- **Workflows**: Sample workflow.yaml files for each BMAD workflow
- **Documents**: Sample PRD.md, architecture.md, epics.md
- **Personas**: Agent persona markdown files
- **Responses**: Mock LLM responses for consistent testing

**Test Projects:**
- Create in `/test-projects/` directory (git-ignored)
- Clean up after tests (teardown)
- Reusable project templates for different scenarios

---

### 7.6 Performance Testing

**Load Testing (Story 5.8):**
- Simulate 10 concurrent story development workflows
- Measure: Time to completion, LLM API latency, memory usage
- Target: <2 hours per story, <2GB memory for orchestrator

**Stress Testing:**
- Push system beyond normal limits (20 concurrent agents)
- Identify breaking point and graceful degradation

**Tools:**
- **Artillery** for API load testing
- **Node.js profiler** (--prof) for CPU profiling
- **heapdump** for memory leak detection

---

## 8. Deployment Architecture

### 8.1 Deployment Strategy (v1.0)

**Target:** Single-machine deployment (local or VPS)

**Rationale:**
- v1.0 scope: 10 concurrent projects (manageable on 1 machine)
- Simplicity over scalability (can scale later)
- Cost-effective for solo developers

**Recommended Specs:**
- **CPU**: 4+ cores (for parallel agent execution)
- **RAM**: 8GB+ (Node.js + React build + agents)
- **Disk**: 50GB+ SSD (git repositories, state files, logs)
- **OS**: Linux (Ubuntu 22.04 LTS recommended)

---

### 8.2 Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  SERVER (VPS or Local Machine)                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NGINX (Reverse Proxy)                                    │   │
│  │  - HTTPS termination (Let's Encrypt)                      │   │
│  │  - Static file serving (/dashboard → React build)        │   │
│  │  - API proxy (/api → Fastify)                             │   │
│  │  - WebSocket proxy (/ws → WebSocket server)              │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│  ┌────────────────────┴─────────────────────────────────────┐   │
│  │  PM2 (Process Manager)                                    │   │
│  │  - orchestrator-api (Fastify server)                      │   │
│  │  - orchestrator-core (Background workflows)               │   │
│  │  - Auto-restart on crash                                  │   │
│  │  - Log rotation                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FILE SYSTEM                                              │   │
│  │  /opt/orchestrator/                                       │   │
│  │    ├── backend/          (Node.js API + Core)             │   │
│  │    │   ├── src/                                           │   │
│  │    │   │   ├── core/         (Kernel components)          │   │
│  │    │   │   │   ├── workflow-engine.ts                     │   │
│  │    │   │   │   ├── agent-pool.ts                          │   │
│  │    │   │   │   ├── state-manager.ts                       │   │
│  │    │   │   │   ├── worktree-manager.ts                    │   │
│  │    │   │   │   ├── llm-factory.ts                         │   │
│  │    │   │   │   └── template-processor.ts                  │   │
│  │    │   │   ├── workflows/      (Workflow plugins)         │   │
│  │    │   │   │   ├── prd-workflow.ts                        │   │
│  │    │   │   │   ├── architecture-workflow.ts               │   │
│  │    │   │   │   ├── story-workflow.ts                      │   │
│  │    │   │   │   └── dev-workflow.ts                        │   │
│  │    │   │   ├── services/      (Support services)          │   │
│  │    │   │   │   ├── decision-engine.ts                     │   │
│  │    │   │   │   ├── escalation-queue.ts                    │   │
│  │    │   │   │   └── error-handler.ts                       │   │
│  │    │   │   ├── api/           (REST API routes)           │   │
│  │    │   │   │   ├── projects.ts                            │   │
│  │    │   │   │   ├── orchestrators.ts                       │   │
│  │    │   │   │   ├── escalations.ts                         │   │
│  │    │   │   │   └── stories.ts                             │   │
│  │    │   │   ├── lib/           (Utilities)                 │   │
│  │    │   │   │   ├── logger.ts                              │   │
│  │    │   │   │   ├── validator.ts                           │   │
│  │    │   │   │   └── git-utils.ts                           │   │
│  │    │   │   ├── types/         (TypeScript types)          │   │
│  │    │   │   │   ├── workflow.types.ts                      │   │
│  │    │   │   │   ├── agent.types.ts                         │   │
│  │    │   │   │   └── api.types.ts                           │   │
│  │    │   │   └── server.ts      (Fastify entry point)       │   │
│  │    │   ├── tests/                                         │   │
│  │    │   │   ├── unit/                                      │   │
│  │    │   │   ├── integration/                               │   │
│  │    │   │   └── e2e/                                       │   │
│  │    │   ├── package.json                                   │   │
│  │    │   └── tsconfig.json                                  │   │
│  │    ├── dashboard/        (React PWA)                       │   │
│  │    │   ├── src/                                           │   │
│  │    │   │   ├── components/   (React components)           │   │
│  │    │   │   │   ├── ui/          (shadcn/ui components)    │   │
│  │    │   │   │   │   ├── Button.tsx                         │   │
│  │    │   │   │   │   ├── Card.tsx                           │   │
│  │    │   │   │   │   ├── Dialog.tsx                         │   │
│  │    │   │   │   │   └── ...                                │   │
│  │    │   │   │   ├── features/    (Feature components)      │   │
│  │    │   │   │   │   ├── ProjectCard.tsx                    │   │
│  │    │   │   │   │   ├── StoryCard.tsx                      │   │
│  │    │   │   │   │   ├── EscalationModal.tsx                │   │
│  │    │   │   │   │   ├── PhaseKanbanBoard.tsx               │   │
│  │    │   │   │   │   └── AIchatInterface.tsx                │   │
│  │    │   │   │   └── layouts/     (Layout components)       │   │
│  │    │   │   │       ├── DashboardLayout.tsx                │   │
│  │    │   │   │       └── PortfolioLayout.tsx                │   │
│  │    │   │   ├── hooks/        (Custom React hooks)         │   │
│  │    │   │   │   ├── use-project-status.ts                  │   │
│  │    │   │   │   ├── use-websocket.ts                       │   │
│  │    │   │   │   └── use-auth.ts                            │   │
│  │    │   │   ├── services/     (API clients)                │   │
│  │    │   │   │   ├── api-client.ts                          │   │
│  │    │   │   │   └── websocket-client.ts                    │   │
│  │    │   │   ├── stores/       (Zustand stores)             │   │
│  │    │   │   │   ├── use-auth-store.ts                      │   │
│  │    │   │   │   └── use-projects-store.ts                  │   │
│  │    │   │   ├── lib/          (Utilities)                  │   │
│  │    │   │   │   ├── format-date.ts                         │   │
│  │    │   │   │   └── utils.ts                               │   │
│  │    │   │   ├── types/        (TypeScript types)           │   │
│  │    │   │   │   ├── project.types.ts                       │   │
│  │    │   │   │   └── workflow.types.ts                      │   │
│  │    │   │   └── App.tsx       (Root component)             │   │
│  │    │   ├── dist/          (Build output)                  │   │
│  │    │   ├── package.json                                   │   │
│  │    │   └── vite.config.ts                                 │   │
│  │    ├── projects/         (User projects)                  │   │
│  │    │   ├── project-001/                                   │   │
│  │    │   │   ├── .bmad/                                     │   │
│  │    │   │   ├── docs/                                      │   │
│  │    │   │   ├── src/                                       │   │
│  │    │   │   └── wt/       (Git worktrees)                  │   │
│  │    ├── logs/             (Application logs)               │   │
│  │    └── .env              (Environment variables)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 8.3 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build:backend
      - run: npm run build:dashboard
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          source: "dist/*"
          target: "/opt/orchestrator/"
      - uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/orchestrator
            pm2 restart orchestrator-api
            pm2 restart orchestrator-core
```

---

### 8.4 Monitoring & Observability

**Logging:**
- **Application Logs**: pino → `/opt/orchestrator/logs/app.log`
- **PM2 Logs**: `/opt/orchestrator/logs/pm2-*.log`
- **NGINX Logs**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- **Rotation**: logrotate (daily rotation, keep 30 days)

**Metrics (Future - v1.1):**
- Prometheus + Grafana dashboard
- Metrics: Request rate, agent execution time, LLM API latency, error rate
- Alerts: High error rate, API budget exceeded, disk space low

**Error Tracking:**
- Sentry for frontend + backend errors
- Source maps for stack traces
- User context (project ID, user ID) attached to errors

**Health Checks:**
- `/health` endpoint: Returns orchestrator status, DB connection, LLM API availability
- Uptime monitoring: UptimeRobot or similar (ping every 5 minutes)

---

## 9. Scalability & Performance

### 9.1 Performance Requirements

**From PRD:**
- PRD generation: <30 minutes
- Architecture generation: <45 minutes
- Story implementation: <2 hours per story
- API response time: <200ms (p95)
- Dashboard load time: <2 seconds
- WebSocket latency: <1 second

---

### 9.2 Bottleneck Analysis

**Identified Bottlenecks:**

1. **LLM API Latency** (Biggest)
   - Claude/GPT-4 response time: 5-30 seconds per invocation
   - Mitigations:
     - Use streaming for real-time feedback
     - Batch prompts where possible
     - Cache repetitive queries (e.g., onboarding doc searches)

2. **Git Worktree Operations**
   - Creating worktree: 2-5 seconds
   - Mitigations:
     - Pre-create worktrees for next N stories (speculative)
     - Use `git worktree add --detach` for faster creation
     - SSD for fast file I/O

3. **File I/O for State Persistence**
   - YAML parsing: 10-50ms for large files
   - Mitigations:
     - Cache parsed state in memory
     - Invalidate cache only on writes
     - Use streaming YAML parser for very large files

4. **Agent Context Size**
   - Large context (>100k tokens) slows LLM inference
   - Mitigations:
     - Intelligent context pruning (Story 5.2)
     - Relevance scoring to include only pertinent info
     - Summarize long documents before passing to agents

---

### 9.3 Scaling Strategy (v1.0 → v2.0)

**Current (v1.0): Single Machine**
- Supports: 10 concurrent projects, 3 agents per project
- Limits: CPU (agent concurrency), LLM API rate limits

**Future (v1.1): Vertical Scaling**
- Upgrade server: 8+ cores, 16GB RAM
- Increase max concurrent agents: 10
- Supports: 20-30 projects

**Future (v2.0): Horizontal Scaling**
- Multi-machine deployment
- Architecture changes:
  - **API Server**: Scale horizontally (load balancer)
  - **Orchestrator Core**: Distributed queue (Redis + Bull)
  - **State Storage**: PostgreSQL (replaces file-based)
  - **WebSocket**: Sticky sessions or Redis adapter
- Supports: 100+ projects, unlimited agents

**Database Migration Path (v1.x → v2.0):**
- Introduce PostgreSQL as read replica of file-based state
- Migrate writes incrementally
- Eventually deprecate file-based storage

---

### 9.4 Caching Strategy

**API Response Caching:**
- GET /api/projects: Cache 30 seconds (stale-while-revalidate)
- GET /api/projects/:id/stories: Cache 10 seconds
- WebSocket events invalidate cache

**LLM Response Caching:**
- Cache onboarding doc searches (key: question hash)
- Cache template processing (key: template + variables hash)
- TTL: 1 hour (invalidate on config change)

**Frontend Caching:**
- TanStack Query: 5 minute cache for project lists
- Aggressive caching for static assets (versioned URLs)

---

## 10. Migration & Rollout Plan

### 10.1 Phased Rollout (Epic-Based)

**Phase 1: Foundation (Weeks 1-3)**
- Deploy: Epic 1 complete
- Users: Internal testing only (developer)
- Capabilities: Workflow execution, agent spawning, state persistence
- Success Criteria: Can execute basic workflows end-to-end

**Phase 2: Autonomous Workflows (Weeks 4-6)**
- Deploy: Epic 2-3 complete
- Users: Internal + 1-2 alpha testers
- Capabilities: PRD + Architecture generation
- Success Criteria: PRD completes in <30 minutes with >85% quality

**Phase 3: Story Generation (Week 7)**
- Deploy: Epic 4 complete
- Users: Expand to 5 alpha testers
- Capabilities: Full solutioning phase (stories ready to implement)
- Success Criteria: 10-20 stories generated, all pass validation

**Phase 4: Implementation Automation (Weeks 8-10)**
- Deploy: Epic 5 complete
- Users: 10 beta testers
- Capabilities: Autonomous story implementation with PRs
- Success Criteria: Stories implement in <2 hours, >80% test coverage

**Phase 5: Remote Access (Weeks 11-12)**
- Deploy: Epic 6 complete
- Users: Public beta (invite-only)
- Capabilities: Full dashboard, mobile access, escalation response
- Success Criteria: >40% mobile usage, escalations resolved in <2 minutes

**Phase 6: General Availability (Week 13+)**
- Deploy: All epics complete, production-ready
- Users: Public release
- Capabilities: Complete autonomous development orchestration

---

### 10.2 Rollback Plan

**Rollback Triggers:**
- Critical bug affecting all projects (crash loop, data loss)
- Security vulnerability discovered
- Performance regression (>50% slower)

**Rollback Process:**
1. Revert git to previous stable commit
2. Re-deploy previous version via CI/CD
3. Restore state files from backup (if needed)
4. Notify users via status page

**State Migration:**
- Forward-compatible state format (versioned)
- Older versions can read newer state (ignore unknown fields)
- Prevents rollback from breaking existing projects

---

## 11. Technical Decisions Log

### TD-001: Microkernel Architecture

**Decision:** Use microkernel pattern with workflow plugins instead of monolithic or microservices

**Context:** Need extensible system that can add new workflows without core changes

**Alternatives:**
1. **Monolithic**: All workflows hardcoded in core (rejected: not extensible)
2. **Microservices**: Each workflow as separate service (rejected: overkill, high complexity)
3. **Microkernel**: Core engine + plugin workflows (chosen)

**Consequences:**
- ✅ Pro: Easy to add new workflows (just add YAML + instructions)
- ✅ Pro: Core engine stable, workflows evolve independently
- ✅ Pro: Each workflow testable in isolation
- ❌ Con: Workflow execution overhead (loading plugins)

**Status:** Accepted

---

### TD-002: File-Based State Storage

**Decision:** Use YAML/Markdown files for state instead of SQL database

**Context:** Need state persistence with git-friendliness and human readability

**Alternatives:**
1. **SQL Database** (PostgreSQL, SQLite): Fast queries (rejected: complexity, not git-friendly)
2. **File-based** (YAML/Markdown): Simple, git-friendly (chosen)
3. **NoSQL** (MongoDB, Redis): Fast, schemaless (rejected: overkill)

**Consequences:**
- ✅ Pro: Simple (no database setup, migrations)
- ✅ Pro: Git-friendly (state versioned, history)
- ✅ Pro: Human-readable (users can inspect files)
- ❌ Con: Slower queries than SQL (acceptable for v1.0 scale)
- ❌ Con: Manual atomic writes (temp + rename pattern)

**Migration Path:** Add SQLite/PostgreSQL as read replica in v1.1 if query performance becomes issue

**Status:** Accepted

---

### TD-003: TypeScript + Node.js Stack

**Decision:** Use TypeScript 5+ and Node.js 20 LTS for backend

**Context:** Need type-safe, async-friendly runtime with LLM library ecosystem

**Alternatives:**
1. **Python**: Excellent LLM libraries (rejected: less type-safe, slower async)
2. **Go**: Fast, type-safe (rejected: smaller LLM ecosystem, harder AI integration)
3. **TypeScript + Node.js**: Type-safe, async, ecosystem (chosen)

**Consequences:**
- ✅ Pro: Type safety reduces bugs
- ✅ Pro: LLM library ecosystem (Anthropic, OpenAI SDKs)
- ✅ Pro: Async I/O for agent concurrency
- ❌ Con: Single-threaded (mitigated with worker threads if needed)

**Status:** Accepted

---

### TD-004: Git Worktrees for Parallel Development

**Decision:** Use git worktrees instead of branches for parallel story development

**Context:** Need true isolation for multiple stories developing simultaneously

**Alternatives:**
1. **Branches only**: Switch branches per story (rejected: slow, stash/unstash overhead)
2. **Git worktrees**: Multiple working directories (chosen)
3. **Separate clones**: Full repo clones per story (rejected: disk space, slow)

**Consequences:**
- ✅ Pro: True isolation (no branch switching)
- ✅ Pro: Fast parallel development (each agent has own directory)
- ✅ Pro: Clean commit history (focused branches)
- ❌ Con: Must cleanup worktrees after merge
- ❌ Con: Slightly more complex git operations

**Status:** Accepted

---

### TD-005: Fastify for REST API

**Decision:** Use Fastify instead of Express for REST API framework

**Context:** Need fast, modern, TypeScript-friendly web framework

**Alternatives:**
1. **Express**: Most popular (rejected: older, slower, weak TypeScript support)
2. **Fastify**: Fast, modern, TypeScript-friendly (chosen)
3. **Koa**: Minimalist (rejected: smaller ecosystem)

**Consequences:**
- ✅ Pro: 2-3x faster than Express
- ✅ Pro: Excellent TypeScript support
- ✅ Pro: Plugin ecosystem (auth, rate-limit, WebSocket)
- ❌ Con: Smaller community than Express (mitigated: still large ecosystem)

**Status:** Accepted

---

### TD-006: React + shadcn/ui for Dashboard

**Decision:** Use React 18 + shadcn/ui (Radix + Tailwind) for web dashboard

**Context:** UX design spec specifies shadcn/ui, need accessible component library

**Alternatives:**
1. **Vue + Vuetify**: Alternative framework (rejected: UX spec specifies React)
2. **React + Material UI**: Popular library (rejected: UX spec specifies shadcn/ui)
3. **React + shadcn/ui**: Per UX spec (chosen)

**Consequences:**
- ✅ Pro: Matches UX design spec exactly
- ✅ Pro: Accessible (Radix UI primitives)
- ✅ Pro: Customizable (copy-paste components)
- ❌ Con: Manual component setup (mitigated: CLI tool)

**Status:** Accepted

---

## 12. Open Questions & Future Work

### 12.1 Open Questions (To Be Resolved in Implementation)

1. **Agent Context Pruning Strategy (Story 5.2)**
   - Q: How to intelligently prune context to fit 200k token limit?
   - Options: Relevance scoring, summarization, vector search
   - Decision: Defer to implementation phase, experiment with relevance scoring first

2. **Parallel Story Development Limit (Epic 5)**
   - Q: How many stories can realistically develop in parallel on one machine?
   - Current: 3 concurrent agents (conservative)
   - Future: Benchmark with 5, 10, 20 concurrent agents

3. **LLM Provider Fallback Strategy (Epic 1)**
   - Q: If Anthropic API down, should we fallback to OpenAI?
   - Options: Auto-fallback, escalate, queue and retry
   - Decision: Defer to Story 1.10 (Error Handling)

4. **State Conflict Resolution (Epic 1)**
   - Q: If two orchestrators run simultaneously, how to prevent state conflicts?
   - Options: File locking, single-writer guarantee, conflict detection
   - Decision: v1.0 assumes single orchestrator instance; address in v1.1 if needed

---

### 12.2 Future Enhancements (Post-v1.0)

**v1.1: Enhanced Monitoring & Observability**
- Prometheus + Grafana dashboards
- Distributed tracing (OpenTelemetry)
- Cost analytics per agent/project/workflow
- Performance profiling and optimization

**v1.2: Advanced AI Features**
- Multi-turn agent conversations (Mary ↔ John collaboration)
- Agent learning from past escalations (reduce future escalations)
- Auto-tuning confidence thresholds per project

**v2.0: Multi-Machine Orchestration**
- Distributed agent pool (Redis + Bull queue)
- PostgreSQL for state storage
- Horizontal API scaling (load balancer)
- Multi-region deployment

**v2.1: Plugin Marketplace**
- Community-contributed workflows
- Custom agent personas
- Workflow templates for different project types

**Future: Self-Improvement**
- Orchestrator analyzes its own performance
- Proposes architecture improvements
- Auto-generates new workflows based on patterns

---

## 13. Conclusion

This architecture provides a solid foundation for the Agent Orchestrator, balancing:

✅ **Simplicity**: File-based storage, single-machine deployment, minimal dependencies
✅ **Scalability**: Microkernel pattern enables horizontal scaling when needed
✅ **Reliability**: State persistence, error recovery, confidence-based escalation
✅ **Security**: JWT auth, secrets management, input validation, secure logging
✅ **Performance**: Async I/O, caching, efficient LLM usage, <2hr story implementation

**Key Architectural Strengths:**
1. **Microkernel + Event-Driven**: Core engine stable, workflows extensible, components decoupled
2. **Autonomous Decision Engine**: 85%+ decisions automated with confidence-based escalation
3. **Git Worktree Isolation**: True parallel development without branch conflicts
4. **File-Based State**: Simple, git-friendly, human-readable (with PostgreSQL migration path)
5. **Multi-Provider LLM**: Cost/quality optimization per agent

**Implementation Readiness:**
- All 61 stories have clear technical context
- Component interfaces defined with TypeScript
- Data models specified with schemas
- API contracts documented with examples
- Testing strategy defined with coverage targets

**Next Steps:**
1. Begin Epic 1 implementation (Foundation - Stories 1.1 through 1.10)
2. Set up project structure per Story 1.1
3. Implement core components in parallel where possible
4. Follow epic sequencing from epics.md

This architecture supports autonomous development 24/7 with confidence, scalability, and maintainability. Let's build it! 🏗️

---

**Document Status:** ✅ Complete and ready for implementation
**Last Updated:** 2025-11-04
**Next Review:** After Epic 1 completion (Week 3)
