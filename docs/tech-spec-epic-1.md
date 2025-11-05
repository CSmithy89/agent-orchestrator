# Epic Technical Specification: Foundation & Core Engine

Date: 2025-11-05
Author: Chris
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the foundational "operating system" for the Agent Orchestrator - the core infrastructure that enables all autonomous workflow execution. This epic creates the microkernel architecture with essential services: workflow engine, agent pool management, LLM factory pattern, state persistence, git worktree operations, and error handling.

This foundation enables the system to parse and execute BMAD workflows, spawn specialized AI agents with optimal LLM assignments, persist execution state for crash recovery, and manage parallel story development through git worktrees. Without this infrastructure, no autonomous workflows can run.

## Objectives and Scope

### In Scope

**Core Infrastructure:**
- Workflow YAML parser and execution engine with step-by-step processing
- Agent pool with lifecycle management (create, invoke, destroy)
- LLM factory supporting multiple providers (Anthropic, OpenAI, Zhipu, optional Google)
- Per-agent LLM assignment from project configuration
- File-based state management (YAML + Markdown) with atomic writes
- Git worktree manager for isolated parallel development
- Template processor for markdown documents with variable substitution
- Basic CLI for local orchestrator control
- Error handling with retry logic and escalation
- Cost-quality optimizer for intelligent model selection

**Project Scaffolding:**
- Monorepo structure with backend and dashboard workspaces
- TypeScript configuration and build tooling
- Development environment setup
- Repository initialization with proper .gitignore

**Test Infrastructure:**
- Test framework setup (Vitest for unit tests)
- CI/CD pipeline configuration (GitHub Actions)
- Code coverage reporting
- Testing standards and patterns

### Out of Scope

- Specific BMAD workflows (PRD, Architecture, Story dev) - covered in Epics 2-5
- Specialized agents (Mary, Winston, Amelia, etc.) - covered in Epics 2-5
- REST API and WebSocket server - covered in Epic 6
- Web dashboard UI - covered in Epic 6
- Parallel story development logic - deferred to v1.1
- Cost tracking dashboard - basic tracking only, full dashboard in Epic 6

## System Architecture Alignment

This epic implements the **Orchestrator Core (Microkernel)** layer from the system architecture (Section 2.1 in architecture.md), specifically the Core Kernel components:

**Architecture Components Implemented:**
- **Workflow Engine** (Story 1.2, 1.7, 1.8): Parses workflow.yaml and executes instructions.md with XML tag processing
- **Agent Pool** (Story 1.4): Manages agent lifecycle with configurable concurrency limits
- **LLM Factory** (Story 1.3): Multi-provider abstraction (Anthropic, OpenAI, Zhipu, Google)
- **State Manager** (Story 1.5): File-based persistence with atomic writes for crash recovery
- **Worktree Manager** (Story 1.6): Git worktree operations for isolated story development
- **Template Processor** (Story 1.8): Markdown template rendering with variable substitution
- **Error Handler** (Story 1.10): Retry logic, error classification, and escalation
- **Cost-Quality Optimizer** (Story 1.13): Complexity analysis and optimal model recommendation

**Architectural Constraints Respected:**
- Microkernel pattern: Core engine stable, workflows added as plugins
- Event-driven: Internal event bus for real-time updates (basic events)
- File-based state: YAML for machine-readable, Markdown for human-readable
- Git integration: Auto-commit state changes, worktree isolation
- Multi-provider LLM: Factory pattern enables cost/quality optimization

**Integration Points:**
- Epics 2-5 will build workflow plugins on this foundation
- Epic 6 will add API/WebSocket layer on top of this kernel

## Detailed Design

### Services and Modules

| Module | Responsibilities | Inputs | Outputs | Owner Story |
|--------|------------------|--------|---------|-------------|
| **WorkflowEngine** | Parse and execute BMAD workflows | workflow.yaml, instructions.md, variables | Execution state, completed steps | Story 1.7 |
| **WorkflowParser** | Parse YAML/XML, resolve variables | workflow.yaml, config files | WorkflowConfig, Step[] | Story 1.2 |
| **AgentPool** | Manage agent lifecycle and concurrency | Agent name, LLM config, context | Agent instances | Story 1.4 |
| **LLMFactory** | Create LLM clients for providers | Model name, provider | LLMClient | Story 1.3 |
| **StateManager** | Persist workflow state for recovery | WorkflowState | YAML + MD files | Story 1.5 |
| **WorktreeManager** | Manage git worktrees for stories | Story ID, base branch | Worktree path, branch name | Story 1.6 |
| **TemplateProcessor** | Process markdown templates | Template path, variables | Rendered document | Story 1.8 |
| **ErrorHandler** | Retry logic and escalation | Error, context | Resolution or escalation | Story 1.10 |
| **ProjectConfig** | Load project configuration | .bmad/project-config.yaml | Configuration object | Story 1.1 |
| **CLI** | Command-line interface | User commands | Orchestrator control | Story 1.9 |
| **CostQualityOptimizer** | Optimize model selection | Task complexity, budget | Model recommendation | Story 1.13 |

### Data Models and Contracts

**WorkflowConfig Schema:**
```typescript
interface WorkflowConfig {
  name: string;
  description: string;
  author: string;
  config_source: string;  // Path to config file
  output_folder: string;  // Resolved path
  user_name: string;      // From config
  date: string;           // System-generated
  installed_path: string; // Workflow location
  template?: string;      // Template file path
  instructions: string;   // Instructions file path
  validation?: string;    // Validation checklist path
  default_output_file?: string; // Output file path
  standalone: boolean;
}
```

**WorkflowState Schema:**
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

interface AgentActivity {
  agentId: string;
  agentName: string;
  action: string;
  startTime: Date;
  endTime?: Date;
  cost: number;
}
```

**ProjectConfig Schema (.bmad/project-config.yaml):**
```yaml
project:
  name: string
  description: string
  repository: string

onboarding:
  tech_stack: string[]
  coding_standards: string
  architecture_patterns: string

agent_assignments:
  [agent_name]:
    model: string          # e.g., "claude-sonnet-4-5"
    provider: string       # e.g., "anthropic"
    base_url?: string      # Optional for wrappers
    api_key?: string       # Optional override
    reasoning: string      # Why this model/agent pairing

cost_management:
  max_monthly_budget: number
  alert_threshold: number  # 0-1
  fallback_model: string
```

**Agent Schema:**
```typescript
interface Agent {
  id: string;
  name: string;           // "mary", "winston", etc.
  persona: string;        // Loaded from bmad/bmm/agents/{name}.md
  llmClient: LLMClient;
  context: AgentContext;
  startTime: Date;
  estimatedCost: number;
}

interface LLMClient {
  provider: string;       // "anthropic", "openai", "zhipu"
  model: string;
  invoke(prompt: string, options?: InvokeOptions): Promise<string>;
  stream(prompt: string, options?: StreamOptions): AsyncIterator<string>;
  estimateCost(prompt: string, response: string): number;
}
```

**Worktree Schema:**
```typescript
interface Worktree {
  storyId: string;
  path: string;          // /wt/story-{id}/
  branch: string;        // story/{id}
  baseBranch: string;    // main
  createdAt: Date;
  status: 'active' | 'pr-created' | 'merged' | 'abandoned';
}
```

**Sprint Status Schema (bmad/sprint-status.yaml):**
```yaml
project:
  name: string
  phase: enum [analysis, planning, solutioning, implementation]

workflow:
  current: string
  step: number
  status: enum [pending, in_progress, blocked, completed]

epics:
  - id: string
    name: string
    status: enum
    stories:
      - id: string
        name: string
        status: enum
        worktree: string
        pr_number: number
        assigned_agent: string
```

### APIs and Interfaces

**WorkflowEngine Public API:**
```typescript
class WorkflowEngine {
  constructor(workflowPath: string);

  // Execute workflow from start
  async execute(): Promise<void>;

  // Resume from saved state
  async resumeFromState(state: WorkflowState): Promise<void>;

  // Execute single step (for testing)
  async executeStep(step: Step): Promise<void>;
}
```

**AgentPool Public API:**
```typescript
class AgentPool {
  // Create agent with LLM from project config
  async createAgent(
    name: string,
    context: AgentContext
  ): Promise<Agent>;

  // Invoke agent with prompt
  async invokeAgent(
    agentId: string,
    prompt: string
  ): Promise<string>;

  // Destroy agent and cleanup
  async destroyAgent(agentId: string): Promise<void>;

  // Get active agents
  getActiveAgents(): Agent[];
}
```

**LLMFactory Public API:**
```typescript
class LLMFactory {
  // Register provider
  registerProvider(name: string, provider: LLMProvider): void;

  // Create client for model
  createClient(config: LLMConfig): LLMClient;

  // Supported: { model: "claude-sonnet-4-5", provider: "anthropic" }
  // Supported: { model: "gpt-4-turbo", provider: "openai" }
  // Supported: { model: "GLM-4.6", provider: "zhipu" }
}
```

**StateManager Public API:**
```typescript
class StateManager {
  // Save state atomically
  async saveState(state: WorkflowState): Promise<void>;

  // Load state for project
  async loadState(projectId: string): Promise<WorkflowState | null>;

  // Query methods for dashboard
  async getProjectPhase(projectId: string): Promise<string>;
  async getStoryStatus(projectId: string, storyId: string): Promise<StoryStatus>;
}
```

**WorktreeManager Public API:**
```typescript
class WorktreeManager {
  // Create worktree for story
  async createWorktree(storyId: string): Promise<Worktree>;

  // Push branch to remote
  async pushBranch(storyId: string): Promise<void>;

  // Destroy worktree after merge
  async destroyWorktree(storyId: string): Promise<void>;

  // List active worktrees
  async listActiveWorktrees(): Promise<Worktree[]>;
}
```

**CLI Commands:**
```bash
# Workflow control
orchestrator start-workflow --project <id> --workflow <path>
orchestrator resume --project <id>
orchestrator pause --project <id>

# Status queries
orchestrator status --project <id>
orchestrator list-projects

# Agent management
orchestrator list-agents --project <id>

# Debug
orchestrator logs --project <id> [--tail]
orchestrator state --project <id>
```

### Workflows and Sequencing

**Workflow Execution Sequence:**

```
1. Orchestrator Start
   ↓
2. Load ProjectConfig (.bmad/project-config.yaml)
   ↓
3. Load WorkflowEngine with workflow path
   ↓
4. Parse workflow.yaml
   - Resolve variables: {project-root}, {config_source}, system-generated
   - Validate required fields
   ↓
5. Parse instructions.md
   - Extract <step> tags
   - Build step list
   ↓
6. Execute Step[0]
   - Process actions
   - Handle special tags (template-output, elicit-required, etc.)
   - Spawn agents if needed
   ↓
7. Save State (after step completion)
   - Write to bmad/sprint-status.yaml
   - Write to bmad/workflow-status.md
   - Auto-commit to git
   ↓
8. Execute Step[1] ... Step[N]
   (Repeat 6-7 for each step)
   ↓
9. Workflow Complete
   - Update workflow-status.yaml (status: completed)
   - Emit completion event
```

**Agent Lifecycle Sequence:**

```
1. AgentPool.createAgent(name, context)
   ↓
2. Load persona from bmad/bmm/agents/{name}.md
   ↓
3. Get LLM config from project config
   - agent_assignments[name] → { model, provider }
   ↓
4. LLMFactory.createClient(config)
   ↓
5. Inject context:
   - Persona
   - Onboarding docs
   - Workflow state
   - Task-specific context
   ↓
6. Agent ready for invocation
   ↓
7. AgentPool.invokeAgent(id, prompt)
   - LLMClient.invoke(prompt)
   - Track cost
   - Log request/response
   ↓
8. AgentPool.destroyAgent(id)
   - Save logs
   - Release resources
   - Update cost tracking
```

**Worktree Development Sequence:**

```
1. Story ready for development
   ↓
2. WorktreeManager.createWorktree(storyId)
   - git worktree add /wt/story-{id}/ -b story/{id} main
   ↓
3. Amelia agent works in worktree
   - Implement code
   - Write tests
   - Commit changes
   ↓
4. Self-review passes
   ↓
5. WorktreeManager.pushBranch(storyId)
   - git push -u origin story/{id}
   ↓
6. Create PR via GitHub API
   ↓
7. CI checks pass
   ↓
8. PR merged
   ↓
9. WorktreeManager.destroyWorktree(storyId)
   - git worktree remove /wt/story-{id}/
   - Delete local branch
   ↓
10. Update sprint-status.yaml (story status: merged)
```

**State Recovery Sequence:**

```
1. Orchestrator crashes during step execution
   ↓
2. User restarts orchestrator
   ↓
3. StateManager.loadState(projectId)
   - Read bmad/sprint-status.yaml
   - Parse workflow state
   ↓
4. Determine last completed step
   ↓
5. WorkflowEngine.resumeFromState(state)
   - Load workflow config
   - Skip to currentStep + 1
   - Restore variables
   ↓
6. Continue execution from recovery point
```

## Non-Functional Requirements

### Performance

**NFR-PERF-001: Workflow Execution Speed**
- Workflow parsing: <500ms for typical workflow.yaml
- Step execution: Variable based on agent invocations
- State save operations: <100ms per checkpoint
- Worktree creation: <2 seconds per worktree
- Agent spawn time: <3 seconds (includes LLM client init)

**NFR-PERF-002: Resource Efficiency**
- Orchestrator memory usage: <512MB per project
- Agent cleanup: Release resources within 30 seconds
- File I/O: Buffered writes, atomic operations
- LLM token optimization: Context pruning to minimize costs

**NFR-PERF-003: Concurrent Operations**
- Support 10+ active projects simultaneously
- Configurable concurrent agents per project (default: 3)
- Agent task queue if pool at capacity
- Fair scheduling across projects

**NFR-PERF-004: Scalability Targets**
- Support 100+ projects per orchestrator instance
- Handle projects with 100+ stories
- Parse epics with 50+ requirements
- Efficient state queries (no full file reads per query)

### Security

**NFR-SEC-001: Secrets Management**
- LLM API keys stored in environment variables or secrets manager
- Never log or expose API keys in outputs
- Project config can reference env vars: `${ANTHROPIC_API_KEY}`
- No secrets committed to git

**NFR-SEC-002: Code Execution Safety**
- Worktrees isolated per story (no cross-contamination)
- Git operations restricted to project repository
- No arbitrary command execution from workflow configs
- Validate workflow.yaml schema before execution

**NFR-SEC-003: Input Validation**
- Sanitize user inputs to prevent prompt injection
- Validate file paths (no directory traversal)
- Escape special characters in git commands
- Validate workflow variable values

**NFR-SEC-004: Authentication (Basic)**
- API keys required for LLM providers
- GitHub token required for PR operations
- Project-level access control (file-based for MVP)
- Future: JWT-based authentication for API (Epic 6)

### Reliability/Availability

**NFR-REL-001: State Persistence**
- State saved after every workflow step
- Atomic file writes (temp + rename) prevent corruption
- No data loss on orchestrator crash
- Resume from last completed step on restart

**NFR-REL-002: Error Recovery**
- Retry transient failures (LLM API rate limits)
- Exponential backoff: [1s, 2s, 4s] delays
- Max 3 retry attempts before escalation
- Clear error messages with recovery instructions

**NFR-REL-003: Fault Isolation**
- One project failure doesn't affect other projects
- Agent failures isolated to specific workflow
- Graceful degradation if LLM provider unavailable
- Continue execution where possible

**NFR-REL-004: System Availability**
- Target: 99%+ uptime for orchestrator service
- Automatic restart on crash with state recovery
- Health check for monitoring
- Watchdog process to restart hung orchestrator (future)

### Observability

**NFR-OBS-001: Logging**
- Structured logging (JSON format recommended)
- Log levels: debug, info, warn, error, critical
- Log all workflow steps with context
- Log all LLM requests/responses (excluding API keys)
- Correlation IDs for request tracing

**NFR-OBS-002: Metrics**
- Track: Agent invocations, costs per agent/project
- Track: Workflow execution times per phase
- Track: Error rates and retry counts
- Track: Worktree operations (create, destroy)
- Export metrics for monitoring (future)

**NFR-OBS-003: State Visibility**
- Human-readable: workflow-status.md
- Machine-readable: sprint-status.yaml
- CLI commands for status queries
- Dashboard integration (Epic 6)

**NFR-OBS-004: Debugging Support**
- Debug mode for detailed agent interaction logs
- Trace execution path through workflow steps
- Export state for offline analysis
- Replay workflow from specific step (future)

## Dependencies and Integrations

### Core Dependencies

**Runtime & Language:**
- Node.js: ≥20.0.0 (LTS, ESM support)
- TypeScript: ^5.0.0 (Strict mode, type safety)
- npm: ≥10.0.0 (Workspaces support)

**Workflow Execution:**
- `js-yaml`: ^4.1.0 - YAML parsing for workflow.yaml
- `xml-js`: ^1.6.0 - XML tag parsing in instructions.md (alternative: regex)
- `marked`: ^9.0.0 - Markdown processing for templates

**LLM Integration:**
- `@anthropic-ai/sdk`: ^0.20.0 - Claude API (Sonnet, Haiku)
- `openai`: ^4.20.0 - OpenAI GPT-4/GPT-3.5
- Custom adapter for Zhipu GLM (HTTP client)
- Optional: `@google/generative-ai` - Gemini models (future)

**Git Operations:**
- `simple-git`: ^3.20.0 - Git worktree management
- `@octokit/rest`: ^20.0.0 - GitHub API for PRs

**CLI & Configuration:**
- `commander`: ^11.0.0 - CLI framework (alternative: `yargs`)
- `dotenv`: ^16.0.0 - Environment variable loading
- `cosmiconfig`: ^8.3.0 - Config file discovery

**File & Data:**
- `fs-extra`: ^11.0.0 - Enhanced filesystem operations
- `glob`: ^10.3.0 - File pattern matching

**Testing:**
- `vitest`: ^1.0.0 - Unit test framework
- `@vitest/ui`: ^1.0.0 - Test UI
- `c8`: ^8.0.0 - Code coverage

**Development:**
- `tsx`: ^4.0.0 - TypeScript execution
- `eslint`: ^8.50.0 - Linting
- `prettier`: ^3.0.0 - Code formatting
- `@types/node`: ^20.0.0 - Node.js type definitions

### External Service Integrations

**LLM Providers:**
- **Anthropic API** (Claude):
  - Authentication: `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`
  - Endpoints: https://api.anthropic.com/v1/messages
  - Models: claude-sonnet-4-5, claude-haiku

- **OpenAI API** (GPT):
  - Authentication: `OPENAI_API_KEY`
  - Endpoints: https://api.openai.com/v1/chat/completions
  - Models: gpt-4-turbo, gpt-3.5-turbo-instruct

- **Zhipu AI** (GLM):
  - Authentication: `ZHIPU_API_KEY` or `ZAI_API_KEY`
  - Endpoints: Native or via z.ai wrapper
  - Models: GLM-4, GLM-4.6

- **Google AI** (Optional):
  - Authentication: `GOOGLE_API_KEY`
  - Endpoints: https://generativelanguage.googleapis.com
  - Models: gemini-1.5-pro, gemini-2.0-flash

**GitHub Integration:**
- Authentication: `GITHUB_TOKEN` (PAT or OAuth)
- Operations: Create PR, merge PR, push branches
- Permissions: repo access, PR create/merge

### Version Constraints

**Minimum Versions:**
- All LLM SDKs must support streaming responses
- simple-git must support worktree commands (v3.0+)
- TypeScript must support decorators and strict mode (v5.0+)

**Compatibility:**
- Cross-platform support: Linux, macOS, Windows WSL
- Container-ready: Docker compatible
- CI/CD friendly: GitHub Actions tested

### Integration Points for Future Epics

**Epic 2-5 (Workflow Plugins):**
- Will import WorkflowEngine, AgentPool, StateManager
- No additional dependencies expected

**Epic 6 (API/Dashboard):**
- Backend: Fastify, WebSocket (ws), JWT authentication
- Frontend: React, Vite, TanStack Query, Tailwind CSS, D3.js
- Will be added in Epic 6 stories

## Acceptance Criteria (Authoritative)

### Epic-Level Acceptance Criteria

**AC-E1-001: Workflow Execution Capability**
- System can parse and execute BMAD workflow.yaml files
- Workflows execute steps in exact sequential order
- State persists after each step for crash recovery
- Workflow can resume from last completed step

**AC-E1-002: Multi-Provider LLM Support**
- LLM Factory supports Anthropic (Claude Sonnet, Haiku)
- LLM Factory supports OpenAI (GPT-4 Turbo, GPT-3.5)
- LLM Factory supports Zhipu (GLM-4, GLM-4.6)
- Per-agent LLM assignment from project configuration works
- OAuth token authentication for Claude Code supported

**AC-E1-003: Agent Lifecycle Management**
- Agent pool can create agents with specified LLM
- Agent pool can invoke agents with prompts
- Agent pool can destroy agents and cleanup resources
- Concurrent agent limits enforced (configurable)
- Cost tracking per agent functional

**AC-E1-004: Git Worktree Operations**
- Worktree manager can create worktrees from main branch
- Worktrees isolated at /wt/story-{id}/ paths
- Branches created as story/{id} format
- Worktree manager can push branches to remote
- Worktree manager can destroy worktrees after merge

**AC-E1-005: State Persistence & Recovery**
- State saves to bmad/sprint-status.yaml (machine-readable)
- State saves to bmad/workflow-status.md (human-readable)
- Atomic file writes prevent corruption
- Orchestrator can load state and resume execution
- State includes: workflow, step, status, variables, agents

**AC-E1-006: Error Handling & Retry**
- LLM API failures retry 3x with exponential backoff
- Git operation failures escalate with clear errors
- Workflow parse errors report line numbers
- Error classification: recoverable, retryable, escalation
- One project failure doesn't affect other projects

**AC-E1-007: CLI Functionality**
- Commands work: start-workflow, pause, resume, status
- List projects command functional
- Logs command shows recent activity
- State query command shows current workflow state
- Help documentation available for each command

**AC-E1-008: Test Infrastructure**
- Vitest framework configured and functional
- CI/CD pipeline (GitHub Actions) configured
- Code coverage reporting enabled
- Test patterns documented for future stories

**AC-E1-009: Cost-Quality Optimization**
- Complexity analyzer categorizes tasks (simple, moderate, complex)
- Model recommender suggests optimal LLM per task
- Budget tracking per project operational
- Alerts trigger at 75%, 90%, 100% budget thresholds
- Cost dashboard data structure defined

## Traceability Mapping

| Acceptance Criteria | Epic 1 Stories | Architecture Components | Test Strategy |
|---------------------|----------------|-------------------------|---------------|
| **AC-E1-001: Workflow Execution** | Story 1.2 (Parser)<br>Story 1.7 (Engine)<br>Story 1.8 (Templates) | WorkflowEngine<br>WorkflowParser<br>TemplateProcessor | Unit: Parse workflow.yaml<br>Unit: Execute steps<br>Integration: End-to-end workflow |
| **AC-E1-002: Multi-Provider LLM** | Story 1.3 (LLM Factory) | LLMFactory<br>AnthropicProvider<br>OpenAIProvider<br>ZhipuProvider | Unit: Provider registration<br>Unit: Client creation<br>Integration: API calls |
| **AC-E1-003: Agent Lifecycle** | Story 1.4 (Agent Pool) | AgentPool<br>Agent<br>LLMClient | Unit: Agent create/destroy<br>Unit: Concurrency limits<br>Integration: Agent invocation |
| **AC-E1-004: Git Worktrees** | Story 1.6 (Worktree Mgr) | WorktreeManager<br>simple-git integration | Unit: Worktree create/destroy<br>Integration: Git operations<br>E2E: Story development flow |
| **AC-E1-005: State Persistence** | Story 1.5 (State Manager) | StateManager<br>Atomic file writes | Unit: Save/load state<br>Unit: Atomic writes<br>Integration: Crash recovery |
| **AC-E1-006: Error Handling** | Story 1.10 (Error Handler) | ErrorHandler<br>RetryHandler | Unit: Error classification<br>Unit: Retry logic<br>Integration: Failure scenarios |
| **AC-E1-007: CLI Functionality** | Story 1.9 (CLI) | CLI commands<br>Commander.js | Unit: Command parsing<br>Integration: CLI operations |
| **AC-E1-008: Test Infrastructure** | Story 1.11 (Test Framework)<br>Story 1.12 (CI/CD) | Vitest config<br>GitHub Actions<br>Coverage tools | Meta: Test setup validation<br>E2E: CI/CD pipeline |
| **AC-E1-009: Cost-Quality Opt** | Story 1.13 (Optimizer) | CostQualityOptimizer<br>ComplexityAnalyzer | Unit: Complexity analysis<br>Unit: Model recommendation<br>Integration: Budget tracking |

### PRD Requirements → Epic 1 Mapping

| PRD Requirement | Epic 1 Implementation | Status |
|-----------------|----------------------|--------|
| FR-CORE-001: Autonomous PRD Generation | Foundation only - workflow engine enables PRD workflow (Epic 2) | ✅ Foundation |
| FR-AGENT-001: Agent Lifecycle Management | Story 1.4 (AgentPool) | ✅ Implemented |
| FR-STATE-001: Workflow State Persistence | Story 1.5 (StateManager) | ✅ Implemented |
| FR-WORKTREE-001: Worktree Creation | Story 1.6 (WorktreeManager) | ✅ Implemented |
| FR-WF-001: YAML Workflow Parsing | Story 1.2 (WorkflowParser) | ✅ Implemented |
| FR-WF-002: Step Execution Engine | Story 1.7 (WorkflowEngine) | ✅ Implemented |
| FR-WF-003: Template Processing | Story 1.8 (TemplateProcessor) | ✅ Implemented |
| FR-API-002: LLM Factory Pattern | Story 1.3 (LLMFactory) | ✅ Implemented |
| FR-ERR-001: Graceful Degradation | Story 1.10 (ErrorHandler) | ✅ Implemented |
| FR-CLI-001: Orchestrator Commands | Story 1.9 (CLI) | ✅ Implemented |
| FR-COST-001: Cost-Quality Optimizer | Story 1.13 (CostQualityOptimizer) | ✅ Implemented |
| NFR-PERF-001: Workflow Execution Speed | All Epic 1 stories (efficiency focus) | ✅ Implemented |
| NFR-REL-001: State Persistence | Story 1.5 (atomic writes, recovery) | ✅ Implemented |
| NFR-SEC-001: Secrets Management | Story 1.1 (config loading, env vars) | ✅ Implemented |

### Story Dependencies Within Epic 1

```
Story 1.1 (Project Structure)
├── Story 1.2 (Parser) - needs ProjectConfig
├── Story 1.3 (LLM Factory)
├── Story 1.5 (State Manager)
└── Story 1.6 (Worktree Manager)

Story 1.2 + Story 1.5
└── Story 1.7 (Workflow Engine)
    └── Story 1.8 (Template Processor)

Story 1.3 (LLM Factory)
└── Story 1.4 (Agent Pool)

Story 1.3 + Story 1.6
└── Story 1.10 (Error Handler)

Story 1.7 (Workflow Engine)
└── Story 1.9 (CLI)

Story 1.4 (Agent Pool)
└── Story 1.13 (Cost-Quality Optimizer)

Story 1.1 (Project Structure)
└── Story 1.11 (Test Framework)
    └── Story 1.12 (CI/CD Pipeline)
```

## Risks, Assumptions, Open Questions

### Risks

**RISK-E1-001: Workflow Parser Complexity** (Medium)
- **Description**: XML tag parsing in instructions.md may be fragile if format inconsistent
- **Impact**: Workflow execution failures, manual debugging required
- **Mitigation**: Strict schema validation, comprehensive error messages with line numbers
- **Contingency**: Fallback to simpler syntax (e.g., YAML-only workflows)

**RISK-E1-002: Multi-Provider LLM Stability** (Medium)
- **Description**: LLM provider APIs may change, breaking integrations
- **Impact**: Agent invocations fail, workflows blocked
- **Mitigation**: Version pinning for SDKs, adapter pattern for flexibility, retry logic
- **Contingency**: Fallback to single provider (Anthropic) if others fail

**RISK-E1-003: Git Worktree Management Complexity** (High)
- **Description**: Worktree operations may fail in edge cases (disk full, permissions, conflicts)
- **Impact**: Story development blocked, manual git cleanup required
- **Mitigation**: Comprehensive error handling, clear escalation messages, automated cleanup
- **Contingency**: Manual worktree recovery procedure documented

**RISK-E1-004: State Corruption** (High)
- **Description**: Crash during state write could corrupt sprint-status.yaml
- **Impact**: Unable to resume workflow, loss of progress
- **Mitigation**: Atomic writes (temp + rename), backup copies, git history
- **Contingency**: Manual state recovery from git history or backups

**RISK-E1-005: Cost Runaway** (Medium)
- **Description**: Misconfigured agents or infinite loops could exhaust LLM budgets
- **Impact**: Unexpected costs, budget exceeded
- **Mitigation**: Budget alerts, cost tracking, max token limits per invocation, circuit breakers
- **Contingency**: Hard budget limits, auto-pause on threshold

### Assumptions

**ASSUME-E1-001: Node.js Version**
- Node.js ≥20.0.0 available on target systems
- ESM modules supported natively
- TypeScript compatible with Node 20+

**ASSUME-E1-002: Git Repository**
- Project runs in a valid git repository
- Git worktree commands available (git ≥2.15.0)
- Remote repository accessible for push operations

**ASSUME-E1-003: LLM Provider Availability**
- Anthropic, OpenAI, Zhipu APIs available and stable
- API keys provided by user in environment variables
- Reasonable rate limits for MVP usage patterns

**ASSUME-E1-004: File System Access**
- Read/write permissions for project directory
- Sufficient disk space for worktrees (≥1GB per active story)
- File system supports atomic renames

**ASSUME-E1-005: Network Connectivity**
- Reliable internet for LLM API calls
- GitHub access for PR operations
- Network latency <500ms for API calls

### Open Questions

**OPEN-E1-001: Workflow Syntax Preference**
- **Question**: Should we use XML tags in markdown or pure YAML for instructions?
- **Impact**: Parser complexity, readability, maintainability
- **Decision Needed**: By Story 1.2 start
- **Current Approach**: XML tags in markdown (existing BMAD convention)

**OPEN-E1-002: Google AI Integration Priority**
- **Question**: Should Google AI (Gemini) be included in MVP or deferred?
- **Impact**: Development time, testing complexity, provider diversity
- **Decision Needed**: By Story 1.3 start
- **Current Approach**: Optional, lower priority than Anthropic/OpenAI/Zhipu

**OPEN-E1-003: CLI Framework Choice**
- **Question**: Commander.js vs Yargs for CLI implementation?
- **Impact**: API surface, developer experience, documentation
- **Decision Needed**: By Story 1.9 start
- **Current Approach**: Commander.js (simpler, more popular)

**OPEN-E1-004: Cost Tracking Granularity**
- **Question**: Track costs per-agent, per-workflow, per-story, or all of the above?
- **Impact**: Database schema, query complexity, dashboard design
- **Decision Needed**: By Story 1.13 start
- **Current Approach**: All levels (agent, workflow, story, project) for maximum flexibility

## Test Strategy Summary

### Test Pyramid for Epic 1

```
              E2E (10%)
           ──────────────
          Integration (30%)
      ──────────────────────────
      Unit Tests (60%)
──────────────────────────────────────
```

### Unit Tests (60% of coverage)

**Focus**: Individual functions, classes, pure logic

**Coverage Target**: 80%+ code coverage for Epic 1

**Test Examples:**
- **WorkflowParser**: Parse valid/invalid YAML, variable resolution, schema validation
- **LLMFactory**: Provider registration, client creation, model validation
- **AgentPool**: Agent create/destroy, concurrency limits, cost tracking
- **StateManager**: Save/load state, atomic writes, data integrity
- **WorktreeManager**: Path validation, branch naming, cleanup logic
- **ErrorHandler**: Error classification, retry logic, backoff calculation

**Tools**: Vitest, test utilities, mocks for external dependencies

### Integration Tests (30% of coverage)

**Focus**: Component interactions, external service integration

**Test Examples:**
- **Workflow Execution Flow**: Parse → Execute → Save State (end-to-end within engine)
- **Agent Invocation Flow**: Create agent → LLM API call → Response → Destroy
- **Git Operations**: Create worktree → Commit → Push → Cleanup
- **State Recovery**: Save state → Simulate crash → Load state → Resume
- **Multi-Provider LLM**: Test all providers (Anthropic, OpenAI, Zhipu) with real API calls (dev keys)

**Tools**: Vitest integration tests, test containers (future), VCR for API mocking

### E2E Tests (10% of coverage)

**Focus**: User workflows, system-level behavior

**Test Examples:**
- **Happy Path**: Start workflow → Execute all steps → Complete successfully
- **Crash Recovery**: Start workflow → Kill process mid-execution → Resume → Complete
- **CLI Commands**: Execute CLI commands → Verify state changes → Check outputs
- **Multi-Project**: Run 3 projects simultaneously → Verify isolation → Check resource limits

**Tools**: Playwright for CLI E2E (future), shell scripts for orchestrator testing

### Test Infrastructure (Story 1.11 + 1.12)

**Vitest Configuration:**
- Test files: `*.test.ts` pattern
- Coverage: c8 for code coverage reports
- Parallel execution: Enabled (default)
- Watch mode: Available for development

**CI/CD Pipeline (GitHub Actions):**
```yaml
name: Epic 1 CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install dependencies
      - Run unit tests
      - Run integration tests
      - Generate coverage report
      - Upload coverage to codecov (optional)
```

**Coverage Requirements:**
- Minimum: 80% overall for Epic 1
- Critical paths: 100% (WorkflowEngine, StateManager, ErrorHandler)
- New code: Must maintain or improve coverage

### Test Data & Fixtures

**Mock Workflows:**
- Simple workflow (3 steps, no agents)
- Complex workflow (10 steps, multiple agents)
- Invalid workflows (missing fields, syntax errors)

**Mock LLM Responses:**
- Successful responses (typical use case)
- Error responses (rate limits, auth failures)
- Streaming responses (for future streaming support)

**Test Projects:**
- Minimal project (basic config)
- Full-featured project (all optional fields)
- Multi-epic project (complex structure)

### Testing Best Practices

**DO:**
- Write tests before implementation (TDD where appropriate)
- Use descriptive test names: `it('should create worktree at correct path when story ID provided')`
- Test edge cases and error conditions
- Mock external dependencies (LLM APIs, GitHub API)
- Use test fixtures for consistency
- Run tests in CI on every commit

**DON'T:**
- Test implementation details (test behavior, not internals)
- Skip error case tests (error handling is critical)
- Use production API keys in tests (use dev/test keys or mocks)
- Write brittle tests (avoid hardcoded timestamps, randomness)

### Acceptance Test-Driven Development (ATDD)

**Process:**
1. Write acceptance criteria (already done above)
2. Convert AC to executable tests (Story 1.11)
3. Implement feature to pass tests (Stories 1.2-1.10, 1.13)
4. Verify all ACs pass (Story completion)

**Example ATDD for AC-E1-001:**
```typescript
describe('AC-E1-001: Workflow Execution Capability', () => {
  it('should parse and execute BMAD workflow.yaml files', async () => {
    const engine = new WorkflowEngine('test/fixtures/simple-workflow.yaml');
    await engine.execute();
    expect(engine.status).toBe('completed');
  });

  it('should execute steps in exact sequential order', async () => {
    const execution = await trackExecution('test/fixtures/workflow.yaml');
    expect(execution.stepOrder).toEqual([0, 1, 2, 3, 4]);
  });

  it('should persist state after each step', async () => {
    const engine = new WorkflowEngine('test/fixtures/workflow.yaml');
    await engine.executeStep(0);
    const state = await StateManager.loadState(PROJECT_ID);
    expect(state.currentStep).toBe(0);
  });

  it('should resume from last completed step', async () => {
    const state = { currentStep: 2, /* ... */ };
    const engine = new WorkflowEngine('test/fixtures/workflow.yaml');
    await engine.resumeFromState(state);
    expect(engine.currentStep).toBe(3); // Next step after 2
  });
});
```

---

## Document Control

**Version History:**
- v1.0 (2025-11-05): Initial tech spec generated by Bob (Scrum Master agent)

**Review Status:** Draft - Pending validation

**Sign-off Required:** Chris (Product Owner)

**Next Steps:**
1. Review and approve tech spec
2. Validate against PRD requirements (coverage complete)
3. Begin Story 1.1 implementation (Project Structure)
4. Execute stories in dependency order (see traceability mapping)
