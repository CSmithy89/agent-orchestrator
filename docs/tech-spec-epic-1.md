# Epic Technical Specification: Foundation & Core Engine

Date: 2025-11-04
Author: Chris
Epic ID: 1
Status: Draft

---

## Overview

Epic 1: Foundation & Core Engine establishes the orchestration kernel that enables autonomous BMAD workflow execution throughout the Agent Orchestrator system. This epic delivers the microkernel architecture - a stable workflow execution engine, multi-provider LLM integration with per-agent assignment, agent lifecycle management with resource controls, file-based state persistence for crash recovery, and git worktree operations for parallel story development. Building this foundation is critical: without these core components, no autonomous workflows (PRD generation, architecture design, story development) can function. This epic represents the "operating system layer" that all subsequent epics (2-6) depend upon for workflow coordination, agent spawning, state management, and parallel development capabilities.

The 10 stories in this epic (1.1-1.10) establish: project configuration management (1.1), workflow YAML parsing with variable resolution (1.2), factory-based LLM client creation supporting Anthropic/OpenAI/Zhipu providers (1.3), agent pool with lifecycle management and concurrency limits (1.4), atomic file-based state persistence with git auto-commit (1.5), git worktree manager for isolated story development (1.6), workflow engine executing XML-tagged instruction steps (1.7), markdown template processing with variable substitution (1.8), CLI commands for local orchestrator control (1.9), and comprehensive error handling with retry logic and escalation (1.10).

## Objectives and Scope

**In Scope:**
- ✅ Workflow engine parsing and executing BMAD workflow.yaml files with XML instruction steps
- ✅ Multi-provider LLM factory (Anthropic Claude, OpenAI GPT-4, Zhipu GLM, optional Google Gemini)
- ✅ Per-agent LLM assignment via project configuration (cost/quality optimization)
- ✅ Agent pool managing lifecycle, context injection, concurrency limits, cost tracking
- ✅ File-based state persistence (YAML machine-readable, Markdown human-readable) with atomic writes
- ✅ Git worktree manager for parallel story development in isolated directories
- ✅ Template processor for markdown documents with {{variable}} replacement and conditionals
- ✅ CLI commands for orchestrator control (start, pause, resume, status, logs)
- ✅ Error handling infrastructure with retry logic, exponential backoff, and escalation classification
- ✅ Project configuration loading from `.bmad/project-config.yaml` with validation

**Out of Scope (Handled by Later Epics):**
- ❌ Specific workflow implementations (PRD, Architecture, Story workflows - Epics 2-5)
- ❌ Confidence-based decision engine and escalation queue (Epic 2)
- ❌ Story context generation and code implementation (Epic 5)
- ❌ REST API and WebSocket server (Epic 6)
- ❌ Web dashboard UI components (Epic 6)
- ❌ Agent persona implementations (Mary, John, Winston, Murat, Bob, Amelia - Epics 2-5)
- ❌ GitHub PR automation and merge workflows (Epic 5)
- ❌ Cost tracking dashboards and budget alerts (post-MVP)
- ❌ Performance monitoring and LLM model optimization (v1.1)

## System Architecture Alignment

This epic implements **Section 2.1: Core Kernel Components** from the Architecture document, establishing the microkernel foundation:

**Alignment with Architecture Patterns:**
- **Microkernel Architecture (Architecture 1.2)**: Epic 1 builds the stable kernel; Epics 2-5 add workflow plugins
- **Event-Driven Layer**: Event bus for internal streaming (agent.started, workflow.completed events)
- **File-Based State (Architecture 3.2)**: YAML/Markdown storage as designed, enabling git-friendly versioning
- **Component Isolation**: Each Story 1.x corresponds to one architectural component (1.2→WorkflowParser, 1.3→LLMFactory, etc.)

**Core Components from Architecture 2.1:**
- **Story 1.2** implements **Workflow Engine** (Architecture 2.1.1): WorkflowEngine, WorkflowParser classes
- **Story 1.3** implements **LLM Factory** (Architecture 2.1.2): LLMFactory, LLMClient interface, multi-provider support
- **Story 1.4** implements **Agent Pool** (Architecture 2.1.2): AgentPool class with lifecycle and resource limits
- **Story 1.5** implements **State Manager** (Architecture 2.1.3): StateManager class with atomic file writes
- **Story 1.6** implements **Worktree Manager** (Architecture 2.1.4): WorktreeManager using simple-git library
- **Story 1.8** implements **Template Processor** (Architecture 2.1.5): TemplateProcessor for markdown {{variables}}

**Technology Stack Alignment (Architecture 5.1):**
- Node.js 20 LTS runtime
- TypeScript 5+ with strict mode
- simple-git for worktree operations
- js-yaml for workflow parsing
- pino for structured logging
- zod for schema validation

**Naming Conventions (Architecture 5.4):**
- Classes: PascalCase (WorkflowEngine, AgentPool, StateManager)
- Files: kebab-case.ts (workflow-engine.ts, agent-pool.ts)
- Functions: camelCase (createAgent, saveState, executeStep)
- Constants: UPPER_SNAKE_CASE (MAX_RETRIES, ESCALATION_THRESHOLD)

## Detailed Design

### Services and Modules

Epic 1 delivers six core modules that form the orchestration kernel:

| Module | Responsibilities | Key Classes | Stories |
|--------|-----------------|-------------|---------|
| **Project Configuration** | Load and validate `.bmad/project-config.yaml`, resolve project metadata, agent LLM assignments, onboarding paths | ProjectConfig, ConfigLoader | 1.1 |
| **Workflow Engine** | Parse workflow.yaml, execute instruction steps sequentially, handle conditionals/loops/goto, manage workflow state, resume from checkpoints | WorkflowEngine, WorkflowParser, StepExecutor | 1.2, 1.7 |
| **LLM Factory** | Create LLM clients for multiple providers (Anthropic, OpenAI, Zhipu, Google), validate model names, handle API authentication, retry logic with backoff | LLMFactory, AnthropicProvider, OpenAIProvider, ZhipuProvider, LLMClient interface | 1.3 |
| **Agent Pool** | Manage agent lifecycle (create, active, destroy), enforce concurrency limits, queue tasks when pool full, track execution time and cost, inject context | AgentPool, Agent interface, AgentContext | 1.4 |
| **State Manager** | Persist workflow state to files after each step, atomic writes (temp + rename), load state on orchestrator start, query project phase/story status, git auto-commit | StateManager, WorkflowState interface | 1.5 |
| **Worktree Manager** | Create git worktrees for stories, manage worktree lifecycle, push branches to remote, cleanup after merge, track active worktrees | WorktreeManager, Worktree interface | 1.6 |
| **Template Processor** | Process markdown templates with {{variables}}, handle conditionals {{#if}}, loops {{#each}}, write to output files (Write first time, Edit subsequent) | TemplateProcessor | 1.8 |
| **CLI Controller** | Command-line interface for orchestrator control, commands: start-workflow, pause, resume, status, logs, colored output | CLIController, CommandHandler | 1.9 |
| **Error Handler** | Classify errors (recoverable, retryable, escalation), retry with exponential backoff, graceful degradation, health check endpoint | ErrorHandler, RetryHandler, ErrorClassifier | 1.10 |

**Module Interactions:**
- WorkflowEngine → AgentPool: Spawns agents for workflow steps
- AgentPool → LLMFactory: Creates LLM clients for agents
- WorkflowEngine → StateManager: Saves state after each step
- WorkflowEngine → TemplateProcessor: Processes output templates
- WorkflowEngine → WorktreeManager: Creates worktrees for story development
- All modules → ErrorHandler: Error handling and retry logic

### Data Models and Contracts

**Core Domain Models:**

```typescript
// Project Configuration (Story 1.1)
interface ProjectConfig {
  project: {
    name: string;
    id: string;
    level: number; // 0-4
    repository: string; // Git URL
  };
  agent_assignments: Record<string, LLMConfig>; // agent name -> LLM config
  onboarding: string[]; // Paths to onboarding docs
  settings: {
    max_concurrent_agents: number;
    llm_budget_usd?: number;
    auto_merge_prs: boolean;
    escalation_threshold: number; // 0.0-1.0
  };
}

interface LLMConfig {
  model: string; // "claude-sonnet-4-5", "gpt-4-turbo", etc.
  provider: string; // "anthropic", "openai", "zhipu", "google"
  base_url?: string; // For Anthropic-compatible wrappers (e.g., z.ai for GLM)
  api_key?: string; // Optional override, defaults to env var
}

// Workflow Configuration (Story 1.2)
interface WorkflowConfig {
  name: string;
  description: string;
  config_source: string; // Path to bmad/bmm/config.yaml
  installed_path: string; // Workflow directory path
  instructions: string; // Path to instructions.md
  template?: string; // Path to template.md (if template workflow)
  validation?: string; // Path to checklist.md
  default_output_file?: string; // Output file path with {{variables}}
  variables: Record<string, any>; // Resolved variables
}

interface Step {
  number: number;
  goal: string;
  content: string; // Step instructions (markdown or XML)
  optional?: boolean;
  condition?: string; // For if="condition"
  tags: StepTag[]; // Parsed XML tags
}

interface StepTag {
  type: 'action' | 'ask' | 'check' | 'goto' | 'invoke-workflow' | 'invoke-task' | 'template-output' | 'elicit-required';
  content?: string;
  attributes?: Record<string, string>;
}

// Agent Models (Story 1.4)
interface Agent {
  id: string;
  name: string; // "mary", "winston", "amelia", etc.
  persona: string; // Loaded from bmad/bmm/agents/{name}.md
  llmClient: LLMClient;
  context: AgentContext;
  startTime: Date;
  estimatedCost: number;
  status: 'initializing' | 'active' | 'completed' | 'failed';
}

interface AgentContext {
  projectConfig: ProjectConfig;
  workflowState: WorkflowState;
  onboardingDocs: string[]; // Loaded doc contents
  previousOutputs?: Record<string, string>; // Prior phase outputs (PRD, architecture)
  currentTask: string;
}

interface LLMClient {
  invoke(prompt: string, options?: InvokeOptions): Promise<string>;
  stream(prompt: string, options?: StreamOptions): AsyncIterator<string>;
  estimateCost(prompt: string, response: string): number;
}

interface InvokeOptions {
  temperature?: number; // 0.0-1.0
  maxTokens?: number;
  systemPrompt?: string;
}

// Workflow State (Story 1.5)
interface WorkflowState {
  project: {
    id: string;
    name: string;
    level: number;
  };
  currentWorkflow: string; // Workflow name
  currentStep: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  variables: Record<string, any>;
  agentActivity: AgentActivity[];
  startTime: Date;
  lastUpdate: Date;
  checkpoints: Checkpoint[]; // Step completion history
}

interface AgentActivity {
  agentName: string;
  task: string;
  llmModel: string;
  startTime: Date;
  estimatedCost: number;
  status: 'running' | 'completed' | 'failed';
}

interface Checkpoint {
  step: number;
  timestamp: Date;
  status: 'completed' | 'failed';
  variables: Record<string, any>; // Variables at this step
}

// Git Worktree (Story 1.6)
interface Worktree {
  storyId: string;
  path: string; // /wt/story-{id}/
  branch: string; // story/{id}
  baseBranch: string; // main
  createdAt: Date;
  status: 'active' | 'pr-created' | 'merged' | 'abandoned';
}

// Error Handling (Story 1.10)
enum ErrorType {
  Recoverable = 'recoverable', // Handle internally, log and continue
  Retryable = 'retryable',     // Retry with exponential backoff
  Escalation = 'escalation'    // Requires human intervention
}

interface ErrorContext {
  operation: string;
  component: string;
  projectId?: string;
  workflowName?: string;
  stepNumber?: number;
  attemptNumber: number;
  originalError: Error;
}

interface RetryOptions {
  maxAttempts: number; // Default: 3
  backoffMs: number[]; // [1000, 2000, 4000]
  retryableErrors: ErrorType[];
}
```

### APIs and Interfaces

**Component Interfaces (Internal APIs):**

```typescript
// Workflow Engine API (Story 1.2, 1.7)
class WorkflowEngine {
  constructor(workflowPath: string, projectConfig: ProjectConfig);

  // Execute workflow from start
  async execute(): Promise<void>;

  // Execute single step
  async executeStep(step: Step): Promise<void>;

  // Resume from saved state
  async resumeFromState(state: WorkflowState): Promise<void>;

  // Variable replacement
  private replaceVariables(template: string): string;

  // Condition evaluation
  private evaluateCondition(condition: string): boolean;

  // Control flow
  private handleGoto(targetStep: number): void;
  private async handleInvokeWorkflow(workflowPath: string): Promise<void>;
}

class WorkflowParser {
  // Parse workflow YAML file
  parseYAML(filePath: string): WorkflowConfig;

  // Parse instructions markdown with XML tags
  parseInstructions(markdownFile: string): Step[];

  // Resolve variables in config
  resolveVariables(config: WorkflowConfig, projectConfig: ProjectConfig): WorkflowConfig;

  // Validate workflow structure
  validateWorkflow(config: WorkflowConfig): ValidationResult;
}

// LLM Factory API (Story 1.3)
class LLMFactory {
  private providers: Map<string, LLMProvider>;

  // Register LLM provider
  registerProvider(name: string, provider: LLMProvider): void;

  // Create LLM client for model
  createClient(llmConfig: LLMConfig): LLMClient;

  // Validate model name for provider
  private validateModel(provider: string, model: string): boolean;
}

interface LLMProvider {
  // Create client instance
  createClient(model: string, apiKey: string, baseUrl?: string): LLMClient;

  // Get supported models
  getSupportedModels(): string[];

  // Estimate cost per token
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;
}

// Agent Pool API (Story 1.4)
class AgentPool {
  private activeAgents: Map<string, Agent>;
  private agentQueue: AgentTask[];
  private maxConcurrentAgents: number;

  // Create agent with LLM and context
  async createAgent(name: string, llmConfig: LLMConfig, context: AgentContext): Promise<Agent>;

  // Destroy agent and cleanup resources
  async destroyAgent(agentId: string): Promise<void>;

  // Invoke agent with prompt
  async invokeAgent(agentId: string, prompt: string): Promise<string>;

  // Get all active agents
  getActiveAgents(): Agent[];

  // Enforce resource limits
  private enforceResourceLimits(): void;
}

// State Manager API (Story 1.5)
class StateManager {
  // Save workflow state (atomic write)
  async saveState(state: WorkflowState): Promise<void>;

  // Load workflow state from files
  async loadState(projectId: string): Promise<WorkflowState | null>;

  // Query project phase
  async getProjectPhase(projectId: string): Promise<string>;

  // Query story status
  async getStoryStatus(projectId: string, storyId: string): Promise<StoryStatus>;

  // Atomic file write (temp + rename)
  private async atomicWrite(filePath: string, content: string): Promise<void>;

  // Git auto-commit
  private async gitCommit(message: string): Promise<void>;
}

// Worktree Manager API (Story 1.6)
class WorktreeManager {
  private worktrees: Map<string, Worktree>;
  private git: SimpleGit;

  // Create worktree for story
  async createWorktree(storyId: string): Promise<Worktree>;

  // Destroy worktree and cleanup
  async destroyWorktree(storyId: string): Promise<void>;

  // Push worktree branch to remote
  async pushBranch(storyId: string): Promise<void>;

  // List all active worktrees
  async listActiveWorktrees(): Promise<Worktree[]>;

  // Validate worktree doesn't exist
  private validateWorktreeNotExists(storyId: string): void;
}

// Template Processor API (Story 1.8)
class TemplateProcessor {
  // Process template with variable substitution
  async processTemplate(templatePath: string, variables: Record<string, any>): Promise<string>;

  // Write to output file
  async writeToFile(outputPath: string, content: string, mode: 'write' | 'edit'): Promise<void>;

  // Replace {{variables}} in template
  private replaceVariables(template: string, variables: Record<string, any>): string;

  // Evaluate {{#if condition}} blocks
  private evaluateConditionals(template: string, variables: Record<string, any>): string;

  // Process {{#each collection}} loops
  private processLoops(template: string, variables: Record<string, any>): string;
}

// Error Handler API (Story 1.10)
class ErrorHandler {
  // Handle error with classification and retry
  async handleError(error: Error, context: ErrorContext): Promise<ErrorResolution>;

  // Classify error type
  private classifyError(error: Error): ErrorType;

  // Retry operation with exponential backoff
  private async retryWithBackoff(fn: Function, maxAttempts: number): Promise<any>;
}

class RetryHandler {
  // Retry function with options
  async retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>;
}
```

### Workflows and Sequencing

**Epic 1 Component Initialization Sequence:**

```
1. System Startup
   ├─> Load ProjectConfig (Story 1.1)
   │   └─> Validate schema, resolve paths
   ├─> Initialize LLMFactory (Story 1.3)
   │   ├─> Register Anthropic provider
   │   ├─> Register OpenAI provider
   │   └─> Register Zhipu provider
   ├─> Initialize StateManager (Story 1.5)
   │   └─> Load existing project states
   ├─> Initialize AgentPool (Story 1.4)
   │   └─> Set concurrency limits from config
   ├─> Initialize WorktreeManager (Story 1.6)
   │   └─> Scan for active worktrees
   └─> Initialize ErrorHandler (Story 1.10)
       └─> Setup retry logic and health monitoring

2. Workflow Execution (Story 1.2, 1.7)
   ├─> WorkflowParser.parseYAML(workflow.yaml)
   │   ├─> Load config_source
   │   ├─> Resolve variables
   │   └─> Validate schema
   ├─> WorkflowParser.parseInstructions(instructions.md)
   │   └─> Parse XML step tags
   ├─> WorkflowEngine.execute()
   │   ├─> For each step:
   │   │   ├─> Execute step content
   │   │   ├─> Handle special tags (action, ask, template-output)
   │   │   ├─> StateManager.saveState() [CHECKPOINT]
   │   │   └─> Next step
   │   └─> Workflow complete

3. Agent Spawning (Story 1.4)
   ├─> AgentPool.createAgent(name, llmConfig, context)
   │   ├─> Load persona from bmad/bmm/agents/{name}.md
   │   ├─> LLMFactory.createClient(llmConfig)
   │   ├─> Inject context (onboarding, workflow state)
   │   ├─> Track start time and cost
   │   └─> Return Agent instance
   ├─> Agent.invoke(prompt)
   │   ├─> LLMClient.invoke(prompt)
   │   ├─> Track token usage and cost
   │   └─> Return response
   └─> AgentPool.destroyAgent(agentId)
       ├─> Save agent logs
       ├─> Release LLM connection
       └─> Cleanup within 30s

4. State Persistence Flow (Story 1.5)
   ├─> StateManager.saveState(workflowState)
   │   ├─> Serialize to YAML (sprint-status.yaml)
   │   ├─> Generate Markdown (workflow-status.md)
   │   ├─> Atomic write (temp file + rename)
   │   └─> Git auto-commit
   └─> On crash/restart:
       ├─> StateManager.loadState(projectId)
       ├─> WorkflowEngine.resumeFromState(state)
       └─> Continue from last checkpoint

5. Worktree Development Flow (Story 1.6)
   ├─> WorktreeManager.createWorktree(storyId)
   │   ├─> Git worktree add /wt/story-{id}/ -b story/{id} main
   │   ├─> Track worktree metadata
   │   └─> Return Worktree instance
   ├─> [Code development happens in worktree]
   ├─> WorktreeManager.pushBranch(storyId)
   │   └─> Git push -u origin story/{id}
   └─> [After PR merge]
       └─> WorktreeManager.destroyWorktree(storyId)
           ├─> Git worktree remove /wt/story-{id}/
           └─> Cleanup complete

6. Error Handling Flow (Story 1.10)
   ├─> Operation fails
   ├─> ErrorHandler.handleError(error, context)
   │   ├─> Classify error type
   │   ├─> If Recoverable: Log and continue
   │   ├─> If Retryable:
   │   │   ├─> RetryHandler.retry(operation, options)
   │   │   ├─> Attempt 1: Wait 1s
   │   │   ├─> Attempt 2: Wait 2s
   │   │   ├─> Attempt 3: Wait 4s
   │   │   └─> If still fails: Escalate
   │   └─> If Escalation: Add to escalation queue
   └─> Error resolved or escalated
```

**Template Processing Sequence (Story 1.8):**

```
1. Workflow step with <template-output> tag
   ├─> TemplateProcessor.processTemplate(templatePath, variables)
   │   ├─> Load template.md
   │   ├─> Replace {{variables}} with actual values
   │   ├─> Evaluate {{#if condition}} blocks
   │   ├─> Process {{#each collection}} loops
   │   └─> Return processed content
   ├─> TemplateProcessor.writeToFile(outputPath, content, mode)
   │   ├─> If first write: Use Write tool
   │   └─> If update: Use Edit tool
   └─> Show content to user for approval
```

## Non-Functional Requirements

### Performance

**Epic 1 Performance Targets:**

| Component | Metric | Target | Rationale |
|-----------|--------|--------|-----------|
| **Workflow Parser** | Parse workflow.yaml | <100ms | Small YAML files, synchronous operation |
| **State Persistence** | Save workflow state | <200ms | File I/O with atomic write (temp + rename) |
| **State Load** | Load project state | <500ms | Parse YAML + validate schema |
| **Agent Creation** | Spawn agent with LLM client | <2s | Load persona, initialize LLM client, inject context |
| **Agent Destruction** | Cleanup agent resources | <30s | Save logs, release LLM connection (Architecture 2.1.2) |
| **Worktree Creation** | Create git worktree | <5s | Git worktree add operation (Architecture 9.2) |
| **Worktree Cleanup** | Delete worktree | <5 minutes | Git worktree remove after PR merge (Architecture 2.1.4) |
| **Template Processing** | Process markdown template | <1s | Variable substitution, conditionals, loops |
| **LLM Client Creation** | Factory creates client | <500ms | Provider validation, API key injection |
| **Error Retry Backoff** | Retry with exponential backoff | 1s, 2s, 4s | LLM API failures (Architecture 2.3.3) |

**Memory Usage:**
- Orchestrator Core: <512MB per project (Architecture NFR-PERF-004)
- Agent Pool: <200MB for 3 concurrent agents
- State Manager: <50MB cached state (invalidate on write)
- Worktree Manager: <20MB metadata for active worktrees

**Resource Efficiency:**
- Agent cleanup must release resources within 30 seconds
- State file cache invalidation on write to prevent stale data
- Worktree cleanup within 5 minutes of merge to free disk space
- LLM client connection pooling to reduce initialization overhead

**Bottleneck Mitigations (Architecture 9.2):**
- **LLM API Latency**: Use streaming for real-time feedback (Story 1.3)
- **Git Worktree Operations**: SSD recommended for fast file I/O
- **File I/O State Persistence**: Cache parsed state in memory, invalidate on writes
- **Agent Context Size**: Intelligent context pruning (out of scope for Epic 1, handled in Epic 5)

### Security

**Epic 1 Security Controls:**

**SEC-001: API Key Protection (Story 1.3)**
- LLM API keys stored in environment variables (never in code)
- Keys loaded from `.env` file (git-ignored)
- Never log API keys (sanitize with pino redact - Architecture 6.2)
- Use `[REDACTED]` placeholder in debug logs
- Pre-commit hook checks for accidental key commits

**SEC-002: Secrets Management (Story 1.1)**
```typescript
// Project config can override API keys per agent
interface LLMConfig {
  model: string;
  provider: string;
  api_key?: string; // Optional override, defaults to env var
}

// Loading priority:
// 1. Project config agent_assignments.{agent}.api_key
// 2. Environment variable {PROVIDER}_API_KEY
// 3. Error if neither found
```

**SEC-003: Input Validation (Story 1.2, 1.7)**
- Workflow YAML schema validation with zod (Architecture 6.2)
- Path traversal prevention: Reject `..` and `~` in file paths
- No remote template URLs: Only local file paths allowed
- Variable injection sanitization: Escape special characters in user inputs

**SEC-004: Structured Logging with Redaction (Story 1.10)**
```typescript
const logger = pino({
  level: 'info',
  redact: {
    paths: ['*.apiKey', '*.api_key', '*.token', '*.password', 'Authorization'],
    censor: '[REDACTED]',
  },
});
```

**SEC-005: File System Isolation (Story 1.5, 1.6)**
- Project files isolated in dedicated directories
- Git operations restricted to project repository
- No cross-project file access
- Validate all file paths before operations

**SEC-006: Code Injection Prevention (Story 1.2)**
- No shell command execution in workflow engine
- Use Node.js APIs only (fs, path, etc.)
- XML tag parsing with safe libraries (marked)
- No eval() or Function() constructor

**Security Testing (Architecture 6.3):**
- `npm audit` in CI/CD for dependency scanning
- ESLint security plugins (Story 1.1)
- git-secrets pre-commit hook (check for API keys)
- Manual penetration testing recommended after v1.0

### Reliability/Availability

**Epic 1 Reliability Controls:**

**REL-001: State Persistence for Crash Recovery (Story 1.5)**
- Save workflow state after EVERY step execution
- Atomic writes prevent corruption: Write to `.tmp` file → rename
- On orchestrator crash: Load state → Resume from last checkpoint
- No data loss guarantee: State always persisted before next step

**REL-002: Error Classification and Handling (Story 1.10)**
```typescript
enum ErrorType {
  Recoverable = 'recoverable', // Log and continue (e.g., optional file missing)
  Retryable = 'retryable',     // Retry 3x with exponential backoff (e.g., LLM API rate limit)
  Escalation = 'escalation'    // Human intervention required (e.g., Git merge conflict)
}
```

**REL-003: Retry Logic with Exponential Backoff**
- LLM API failures: Retry 3x with [1s, 2s, 4s] backoff (Architecture 2.3.3)
- Git operations: No retry, log error and escalate (data integrity)
- File I/O: Retry 2x with 500ms backoff, then escalate

**REL-004: Graceful Degradation (Architecture NFR-REL-004)**
- One project fails: Continue other projects (isolation)
- Agent spawn fails: Queue task, retry later
- State save fails: Log critical error, continue execution (risky but better than crash)
- LLM provider unavailable: Escalate for manual provider change

**REL-005: Health Monitoring (Story 1.10)**
- Expose `/health` endpoint (implemented in Epic 6)
- Report: uptime, active projects, agent pool status, recent errors
- Alert if error rate exceeds threshold (10 errors/minute)

**Availability Targets (Architecture NFR-REL-001):**
- Orchestrator Core: 99%+ uptime
- Automatic restart on crash with PM2 (Architecture 8.3)
- State recovery: Resume from last checkpoint within 30 seconds
- No manual intervention required for transient failures

### Observability

**Epic 1 Logging and Monitoring:**

**OBS-001: Structured Logging with Pino (Story 1.10)**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  formatters: {
    level: (label) => ({ level: label }), // Log level as string
  },
  timestamp: pino.stdTimeFunctions.isoTime, // ISO 8601 timestamps
  redact: {
    paths: ['*.apiKey', '*.api_key', '*.token', 'Authorization'],
    censor: '[REDACTED]',
  },
});

// Usage
logger.info({ projectId, workflowName, step }, 'Workflow step started');
logger.error({ err, context }, 'LLM API call failed');
```

**OBS-002: Log Levels (Architecture NFR-MAINT-002)**
- **debug**: Verbose (development only) - Variable values, internal state
- **info**: Normal operations - Workflow started, agent created, step completed
- **warn**: Recoverable errors - LLM API rate limit, retry triggered
- **error**: Unrecoverable errors - Workflow failed, escalation required
- **critical**: System-wide failures - Orchestrator crash, state corruption

**OBS-003: Contextual Logging**
Every log entry includes context fields:
```typescript
interface LogContext {
  projectId?: string;
  workflowName?: string;
  stepNumber?: number;
  agentName?: string;
  attemptNumber?: number;
  timestamp: string; // ISO 8601
}
```

**OBS-004: Component-Specific Logging**

| Component | Log Events | Level | Example |
|-----------|-----------|-------|---------|
| **WorkflowEngine** | Workflow started, step completed, workflow error | info, error | `{ workflowName, step, status }` |
| **AgentPool** | Agent created, agent destroyed, agent invoked | info | `{ agentName, llmModel, estimatedCost }` |
| **StateManager** | State saved, state loaded, git commit | info, debug | `{ projectId, checkpoint }` |
| **WorktreeManager** | Worktree created, worktree destroyed, push failed | info, error | `{ storyId, worktreePath, branch }` |
| **LLMFactory** | Client created, provider registered | info | `{ provider, model }` |
| **ErrorHandler** | Error classified, retry attempt, escalation | warn, error | `{ errorType, attemptNumber }` |

**OBS-005: Log Rotation and Storage (Architecture 8.4)**
- Application logs: pino → `logs/app.log`
- PM2 logs: `logs/pm2-*.log`
- Rotation: Daily, keep 30 days (logrotate)
- Size limit: 100MB per log file

**OBS-006: Debug Mode**
Enable verbose logging for troubleshooting:
```bash
LOG_LEVEL=debug npm start
# Logs: Variable values, LLM prompts/responses, internal state
```

**OBS-007: Metrics Collection (Future - Story 1.10 Foundation)**
Track metrics for performance monitoring:
- Workflow execution time per workflow type
- Agent spawn/destroy time
- State persistence latency
- Error rate per component
- LLM API call latency (by provider)

**Future Enhancements (v1.1 - Architecture 8.4):**
- Prometheus metrics export
- Grafana dashboards for visualization
- Sentry error tracking with source maps
- Distributed tracing with OpenTelemetry

## Dependencies and Integrations

### External Dependencies

**NPM Package Dependencies (Story 1.1):**

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",      // Anthropic Claude LLM provider
    "openai": "^4.20.0",                  // OpenAI GPT-4 LLM provider
    "simple-git": "^3.20.0",              // Git operations, worktree management
    "js-yaml": "^4.1.0",                  // YAML parsing for workflow configs
    "marked": "^10.0.0",                  // Markdown parsing for instructions
    "pino": "^8.16.0",                    // Structured logging
    "pino-pretty": "^10.2.0",             // Pretty log formatter (dev)
    "zod": "^3.22.0",                     // Schema validation
    "commander": "^11.1.0"                // CLI argument parsing
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"
  }
}
```

**LLM Provider SDKs (Story 1.3):**
- **Anthropic SDK**: Claude Sonnet 4.5, Haiku 4 models
- **OpenAI SDK**: GPT-4 Turbo, GPT-4o models
- **Zhipu**: GLM models via Anthropic-compatible API (z.ai base_url)
- **Google (Optional)**: Gemini models via official SDK

**Git Operations (Story 1.6):**
- **simple-git**: Node.js wrapper for git CLI
- **Git 2.25+**: Native git binary required for worktree operations
- Assumes git installed on system (orchestrator environment)

### Internal Dependencies (Epic-to-Epic)

**Epic 1 → Epics 2-6:**
Epic 1 is the foundation layer. All subsequent epics depend on components delivered here:

| Epic | Depends on Epic 1 Components | Reason |
|------|------------------------------|--------|
| **Epic 2: PRD Workflow** | WorkflowEngine, AgentPool, StateManager, TemplateProcessor | Executes PRD workflow, spawns Mary+John agents, persists state |
| **Epic 3: Architecture Workflow** | WorkflowEngine, AgentPool, StateManager, TemplateProcessor | Executes architecture workflow, spawns Winston+Murat agents |
| **Epic 4: Story Workflow** | WorkflowEngine, AgentPool, StateManager, TemplateProcessor | Executes story decomposition workflow, spawns Bob agent |
| **Epic 5: Dev Workflow** | WorkflowEngine, AgentPool, WorktreeManager, StateManager | Executes story development, spawns Amelia agent, creates worktrees |
| **Epic 6: API/Dashboard** | StateManager, AgentPool, WorkflowEngine | Queries project state, orchestrator control, real-time updates |

**Story Dependencies Within Epic 1:**

```
Story 1.1 (Project Config)
  ↓
Story 1.3 (LLM Factory) ← depends on LLMConfig from 1.1
  ↓
Story 1.4 (Agent Pool) ← depends on LLMFactory from 1.3
  ↓
Story 1.2 (Workflow Parser) → can run parallel with 1.3, 1.4
  ↓
Story 1.5 (State Manager) ← depends on WorkflowState schema
  ↓
Story 1.7 (Workflow Engine) ← depends on 1.2 (Parser) and 1.5 (State)
  ↓
Story 1.6 (Worktree Manager) → can run parallel with 1.7
Story 1.8 (Template Processor) → can run parallel with 1.7
  ↓
Story 1.9 (CLI) ← depends on WorkflowEngine (1.7)
  ↓
Story 1.10 (Error Handler) ← last, wraps all components
```

**Recommended Story Implementation Order:**
1. **Phase 1**: Stories 1.1, 1.2 (foundational schemas and parsing)
2. **Phase 2**: Stories 1.3, 1.4 (LLM and agent infrastructure) - parallel with 1.5
3. **Phase 3**: Story 1.5 (state persistence)
4. **Phase 4**: Story 1.7 (workflow engine integration)
5. **Phase 5**: Stories 1.6, 1.8, 1.9 (supporting features) - parallel
6. **Phase 6**: Story 1.10 (error handling wrap-up)

### System Integrations

**File System Integration (All Stories):**
- Read/write project configuration files (`.bmad/project-config.yaml`)
- Read/write workflow YAML files (`bmad/bmm/workflows/*/workflow.yaml`)
- Read agent persona markdown files (`bmad/bmm/agents/*.md`)
- Read/write state files (`bmad/sprint-status.yaml`, `bmad/workflow-status.md`)
- Read/write template files (`bmad/bmm/workflows/*/template.md`)

**Git Integration (Story 1.6):**
- Execute git commands via simple-git library
- Worktree operations: `git worktree add`, `git worktree remove`
- Branch operations: `git checkout`, `git push`, `git commit`
- Assumes git repository initialized in project root
- Requires git credentials configured (SSH keys or HTTPS tokens)

**Environment Variables (Story 1.1, 1.3):**
```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional
ZHIPU_API_KEY=...
GOOGLE_API_KEY=...
LOG_LEVEL=info  # debug, info, warn, error
NODE_ENV=production  # development, production
```

### Data Flow Between Components

```
1. System Startup
   ProjectConfig → LLMFactory (agent LLM assignments)
   ProjectConfig → AgentPool (concurrency limits)
   ProjectConfig → StateManager (project metadata)

2. Workflow Execution
   WorkflowParser → WorkflowEngine (parsed workflow)
   WorkflowEngine → AgentPool (spawn agents)
   AgentPool → LLMFactory (create LLM clients)
   WorkflowEngine → StateManager (save checkpoints)
   WorkflowEngine → TemplateProcessor (process output templates)

3. Agent Invocation
   AgentPool → Agent (create/destroy)
   Agent → LLMClient (invoke LLM)
   LLMClient → LLM Provider API (external call)

4. State Persistence
   WorkflowEngine → StateManager (save workflow state)
   StateManager → File System (YAML/Markdown)
   StateManager → Git (auto-commit)

5. Worktree Management
   WorkflowEngine → WorktreeManager (create/destroy)
   WorktreeManager → Git (worktree operations)

6. Error Handling
   All Components → ErrorHandler (on error)
   ErrorHandler → RetryHandler (retry logic)
   ErrorHandler → EscalationQueue (if escalation needed)
```

### Testing Dependencies

**Unit Testing (Story 1.1-1.10):**
- Vitest for test execution
- Mock LLM providers (avoid real API costs)
- Mock git operations (use in-memory or test repos)
- Mock file system (use temp directories)

**Integration Testing:**
- Test fixtures: Sample workflow.yaml, PRD.md, agent personas
- Requires git repository for worktree tests
- Requires .env file with test API keys (optional, use mocks)

**No External Service Dependencies for Testing:**
Epic 1 components can be fully tested with mocks - no live LLM APIs or external services required during CI/CD.

## Acceptance Criteria (Authoritative)

This section defines the **authoritative acceptance criteria** for Epic 1. Each story's AC must be fully satisfied for the story to be considered complete.

### Story 1.1: Project Repository Structure & Configuration

✅ **AC-1.1.1:** Create TypeScript project with proper tsconfig.json and package.json
✅ **AC-1.1.2:** Establish directory structure: src/, tests/, docs/, .bmad/
✅ **AC-1.1.3:** Implement ProjectConfig class that loads from .bmad/project-config.yaml
✅ **AC-1.1.4:** Support loading: project metadata, agent LLM assignments, onboarding docs paths
✅ **AC-1.1.5:** Validate configuration schema on load with clear error messages
✅ **AC-1.1.6:** Include example project-config.yaml with inline documentation

**Definition of Done:**
- TypeScript compiles without errors
- Unit tests for ProjectConfig class pass (>80% coverage)
- Example config loads successfully
- Validation catches invalid schemas with descriptive errors

---

### Story 1.2: Workflow YAML Parser

✅ **AC-1.2.1:** Parse workflow.yaml using js-yaml library
✅ **AC-1.2.2:** Validate required fields: name, instructions, config_source
✅ **AC-1.2.3:** Resolve {project-root} and {installed_path} variables
✅ **AC-1.2.4:** Load config_source file and resolve {config_source}:key references
✅ **AC-1.2.5:** Support system-generated variables (date:system-generated)
✅ **AC-1.2.6:** Return structured WorkflowConfig object with resolved values
✅ **AC-1.2.7:** Throw descriptive errors for invalid YAML or missing references

**Definition of Done:**
- WorkflowParser class parses valid workflow.yaml files correctly
- Variable resolution works for all supported patterns
- Unit tests cover happy path and error cases (>80% coverage)
- Integration test with real workflow.yaml file succeeds

---

### Story 1.3: LLM Factory Pattern Implementation

✅ **AC-1.3.1:** Implement LLMFactory class with provider registry
✅ **AC-1.3.2:** Support Anthropic provider (Claude Sonnet, Claude Haiku):
- Check for `CLAUDE_CODE_OAUTH_TOKEN` first (subscription auth - preferred)
- Fallback to `ANTHROPIC_API_KEY` if OAuth token not present (pay-per-use)
- Support `base_url` parameter in LLMConfig for Anthropic-compatible wrappers (e.g., z.ai for GLM)
- LLMConfig interface: `{ model: string, provider: string, base_url?: string, api_key?: string }`

✅ **AC-1.3.3:** Support OpenAI provider (GPT-4, GPT-4 Turbo, Codex):
- Load `OPENAI_API_KEY` from environment
- Support models: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct` (Codex replacement)

✅ **AC-1.3.4:** Support Zhipu provider (GLM-4, GLM-4.6):
- Load `ZHIPU_API_KEY` from environment
- Native Zhipu API integration for GLM models
- Alternative to z.ai wrapper approach for GLM access

✅ **AC-1.3.5:** (Optional) Support Google provider (Gemini):
- Load `GOOGLE_API_KEY` from environment
- Integrate `@google/generative-ai` SDK
- Support `gemini-1.5-pro`, `gemini-2.0-flash` models
- Can be deferred to future story if time-constrained

✅ **AC-1.3.6:** Provider factory registration in constructor:
```typescript
this.providers.set('anthropic', new AnthropicProvider());
this.providers.set('openai', new OpenAIProvider());
this.providers.set('zhipu', new ZhipuProvider());
// this.providers.set('google', new GoogleProvider()); // Optional
```

✅ **AC-1.3.7:** Validate model names for each provider:
- Anthropic: `claude-sonnet-4-5`, `claude-haiku`, `GLM-4.6` (via base_url wrapper)
- OpenAI: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct`
- Zhipu: `GLM-4`, `GLM-4.6`
- Google: `gemini-1.5-pro`, `gemini-2.0-flash` (if implemented)

✅ **AC-1.3.8:** Create LLMClient interface with `invoke()` and `stream()` methods
✅ **AC-1.3.9:** Include retry logic with exponential backoff for API failures
✅ **AC-1.3.10:** Log all LLM requests/responses for debugging (exclude sensitive keys)
✅ **AC-1.3.11:** Support per-agent LLM configuration via `.bmad/project-config.yaml`:
```yaml
agent_assignments:
  amelia:
    model: "gpt-4-turbo"
    provider: "openai"
  winston:
    model: "GLM-4.6"
    provider: "anthropic"  # Using z.ai wrapper
    base_url: "https://api.z.ai/api/anthropic"
    api_key: "${ZAI_API_KEY}"
```

**Definition of Done:**
- LLMFactory creates clients for Anthropic, OpenAI, Zhipu providers
- All providers load API keys correctly (OAuth token prioritized for Anthropic)
- Unit tests mock LLM API calls (no real API costs)
- Integration test creates client and invokes mock LLM successfully
- Retry logic tested with simulated API failures

---

### Story 1.4: Agent Pool & Lifecycle Management

✅ **AC-1.4.1:** Implement AgentPool class that manages active agent instances
✅ **AC-1.4.2:** createAgent(name, llmConfig, context) creates agent with project-configured LLM:
- llmConfig retrieved from `.bmad/project-config.yaml` agent_assignments section
- Supports any provider configured in LLMFactory (Anthropic, OpenAI, Zhipu, Google)
- Example: `config.agent_assignments['mary']` → `{ model: "claude-sonnet-4-5", provider: "anthropic" }`
- Enables per-agent provider assignment (Mary on Claude, Amelia on OpenAI, Bob on GLM, etc.)

✅ **AC-1.4.3:** Load agent persona from bmad/bmm/agents/{name}.md
✅ **AC-1.4.4:** Inject LLMClient (from LLMFactory), context (onboarding, docs, workflow state) into agent
✅ **AC-1.4.5:** Track agent execution time and estimated cost per provider
✅ **AC-1.4.6:** destroyAgent(id) cleans up resources within 30 seconds
✅ **AC-1.4.7:** Support concurrent agent limits (configurable per project)
✅ **AC-1.4.8:** Queue agent tasks if pool is at capacity

**Definition of Done:**
- AgentPool creates agents with correct LLM clients from config
- Agent persona loaded from markdown files
- Concurrency limits enforced (max 3 concurrent agents by default)
- destroyAgent completes within 30 seconds
- Unit tests cover agent lifecycle (create, invoke, destroy)
- Integration test creates agent, invokes LLM (mocked), destroys agent

---

### Story 1.5: State Manager - File Persistence

✅ **AC-1.5.1:** Implement StateManager class for workflow state persistence
✅ **AC-1.5.2:** saveState() writes to bmad/sprint-status.yaml (machine-readable)
✅ **AC-1.5.3:** Save workflow-status.md (human-readable) in parallel
✅ **AC-1.5.4:** Track: current workflow, step number, status, variables, agent activity
✅ **AC-1.5.5:** loadState() reads from files on orchestrator start
✅ **AC-1.5.6:** Atomic file writes (write to temp, then rename) to prevent corruption
✅ **AC-1.5.7:** Support state queries for dashboard (getProjectPhase, getStoryStatus)
✅ **AC-1.5.8:** Auto-commit state changes to git with descriptive messages

**Definition of Done:**
- StateManager saves and loads workflow state correctly
- Both YAML and Markdown files written
- Atomic writes implemented (temp + rename)
- Git auto-commit works with descriptive messages
- State queries (getProjectPhase, getStoryStatus) return correct data
- Unit tests cover save, load, and query operations
- Integration test simulates crash-recovery scenario

---

### Story 1.6: Git Worktree Manager - Basic Operations

✅ **AC-1.6.1:** Implement WorktreeManager using simple-git library
✅ **AC-1.6.2:** createWorktree(storyId) creates worktree at /wt/story-{id}/
✅ **AC-1.6.3:** Create branch story/{id} from main
✅ **AC-1.6.4:** Track worktree location, branch name, and story ID mapping
✅ **AC-1.6.5:** Push worktree branch to remote when ready
✅ **AC-1.6.6:** destroyWorktree(storyId) removes worktree and local branch
✅ **AC-1.6.7:** Handle errors gracefully (worktree already exists, git failures)
✅ **AC-1.6.8:** List active worktrees with status

**Definition of Done:**
- WorktreeManager creates worktrees successfully
- Worktree paths follow /wt/story-{id}/ convention
- Branches created as story/{id}
- destroyWorktree cleans up worktree and branch
- Error handling tested (duplicate worktree, git failures)
- Unit tests mock git operations
- Integration test creates/destroys worktree in test repository

---

### Story 1.7: Workflow Engine - Step Executor

✅ **AC-1.7.1:** Implement WorkflowEngine class that executes workflow steps sequentially
✅ **AC-1.7.2:** Load instructions from markdown file (parse step tags: <step n="X">)
✅ **AC-1.7.3:** Execute actions in exact order (step 1, 2, 3...)
✅ **AC-1.7.4:** Replace {{variables}} with resolved values
✅ **AC-1.7.5:** Handle conditional logic (<check if="condition">)
✅ **AC-1.7.6:** Support goto, invoke-workflow, invoke-task tags
✅ **AC-1.7.7:** Save state after each step completion
✅ **AC-1.7.8:** Resume from last completed step on restart
✅ **AC-1.7.9:** Support #yolo mode (skip optional steps, no prompts)

**Definition of Done:**
- WorkflowEngine executes steps in correct sequence
- Variable replacement works correctly
- Conditional logic (if statements) evaluated properly
- goto, invoke-workflow, invoke-task tags handled
- State saved after each step
- Resume from checkpoint tested (simulate crash)
- Unit tests cover all step types
- Integration test executes complete workflow.yaml file

---

### Story 1.8: Template Processing System

✅ **AC-1.8.1:** Load template files (markdown with {{placeholders}})
✅ **AC-1.8.2:** Replace {{variable}} with actual values from workflow state
✅ **AC-1.8.3:** Support conditional blocks: {{#if condition}} ... {{/if}}
✅ **AC-1.8.4:** Support loops: {{#each collection}} ... {{/each}}
✅ **AC-1.8.5:** Write processed template to output file
✅ **AC-1.8.6:** Use Edit tool for subsequent updates (not Write)
✅ **AC-1.8.7:** Preserve formatting and markdown structure
✅ **AC-1.8.8:** Clear error messages for undefined variables

**Definition of Done:**
- TemplateProcessor loads and processes templates correctly
- Variable substitution works for simple and nested variables
- Conditionals ({{#if}}) evaluated correctly
- Loops ({{#each}}) iterate over collections
- First write uses Write tool, subsequent uses Edit tool
- Error messages clear when variable undefined
- Unit tests cover all template features
- Integration test processes real template.md file

---

### Story 1.9: CLI Foundation - Basic Commands

✅ **AC-1.9.1:** Implement CLI using commander.js or yargs
✅ **AC-1.9.2:** Commands: start-workflow, pause, resume, status, list-projects
✅ **AC-1.9.3:** `orchestrator start-workflow --project <id> --workflow <path>`
✅ **AC-1.9.4:** `orchestrator status --project <id>` shows current phase and progress
✅ **AC-1.9.5:** `orchestrator logs --project <id> --tail` shows recent logs
✅ **AC-1.9.6:** Color-coded output for better readability
✅ **AC-1.9.7:** --help documentation for each command
✅ **AC-1.9.8:** Proper error handling with actionable messages

**Definition of Done:**
- CLI commands execute successfully
- Help documentation displayed correctly
- Color-coded output improves readability
- Error messages actionable and clear
- Unit tests verify command parsing
- Integration test executes start-workflow command

---

### Story 1.10: Error Handling & Recovery Infrastructure

✅ **AC-1.10.1:** Implement RetryHandler with exponential backoff (3 attempts default)
✅ **AC-1.10.2:** Classify errors: recoverable (retry), retryable (backoff), escalation-required
✅ **AC-1.10.3:** LLM API failures: retry 3x with backoff, then escalate
✅ **AC-1.10.4:** Git operation failures: clean state, log error, escalate
✅ **AC-1.10.5:** Workflow parse errors: report line number and clear message
✅ **AC-1.10.6:** Log all errors with context, stack traces, and recovery attempts
✅ **AC-1.10.7:** Graceful degradation: continue other projects if one fails
✅ **AC-1.10.8:** Health check endpoint for monitoring

**Definition of Done:**
- ErrorHandler classifies errors correctly
- RetryHandler retries with exponential backoff (1s, 2s, 4s)
- LLM API failures tested with retry logic
- Git failures logged and escalated appropriately
- Workflow parse errors report line numbers
- Logging includes full context and stack traces
- Graceful degradation tested (one project fails, others continue)
- Health check endpoint returns system status

---

## Traceability Mapping

### PRD Requirements → Epic 1 Stories

| PRD Requirement | Story | Acceptance Criteria | Rationale |
|-----------------|-------|---------------------|-----------|
| FR-WF-001: YAML Workflow Parsing | 1.2 | AC-1.2.1 to AC-1.2.7 | Parse workflow.yaml with variable resolution |
| FR-WF-002: Step Execution Engine | 1.7 | AC-1.7.1 to AC-1.7.9 | Execute workflow steps in order with state management |
| FR-WF-003: Template Processing | 1.8 | AC-1.8.1 to AC-1.8.8 | Process markdown templates with variable substitution |
| FR-WF-004: State Checkpointing | 1.5 | AC-1.5.1 to AC-1.5.8 | Save state after each step for crash recovery |
| FR-AGENT-001: Agent Lifecycle | 1.4 | AC-1.4.1 to AC-1.4.8 | Create, manage, destroy agents with context |
| FR-AGENT-002: Agent Pool | 1.4 | AC-1.4.7, AC-1.4.8 | Manage concurrent agents with limits and queuing |
| FR-AGENT-003: Agent Context | 1.4 | AC-1.4.4 | Inject onboarding, docs, workflow state into agents |
| FR-API-002: LLM Factory | 1.3 | AC-1.3.1 to AC-1.3.11 | Multi-provider LLM client creation |
| FR-WORKTREE-001: Worktree Creation | 1.6 | AC-1.6.2 to AC-1.6.4 | Create worktrees for isolated story development |
| FR-WORKTREE-002: Worktree Development | 1.6 | AC-1.6.5 | Push worktree branch to remote |
| FR-WORKTREE-003: PR Creation & Merge | 1.6 | AC-1.6.6 | Delete worktree after merge |
| FR-STATE-001: Workflow State Persistence | 1.5 | AC-1.5.2 to AC-1.5.6 | Persist state to YAML/Markdown files |
| FR-STATE-002: Project State Tracking | 1.5 | AC-1.5.7 | Query project phase and story status |
| FR-STATE-003: State Recovery | 1.5 | AC-1.5.5, AC-1.5.8 | Resume from checkpoint after crash |
| FR-CLI-001: Orchestrator Commands | 1.9 | AC-1.9.3 to AC-1.9.5 | CLI for orchestrator control |
| FR-ERR-001: Graceful Degradation | 1.10 | AC-1.10.7 | Continue other projects if one fails |
| FR-ERR-002: State Recovery | 1.10 | AC-1.10.3, AC-1.10.4 | Retry transient failures, escalate others |
| FR-ERR-003: Error Logging | 1.10 | AC-1.10.6 | Log errors with context and stack traces |
| NFR-PERF-004: Resource Efficiency | 1.4 | AC-1.4.6 | Agent cleanup within 30 seconds |
| NFR-SEC-001: API Key Protection | 1.3 | AC-1.3.2, AC-1.3.10 | Never log API keys, use [REDACTED] |
| NFR-REL-001: System Availability | 1.5, 1.10 | AC-1.5.6, AC-1.10.7 | Atomic writes, graceful degradation |

### Architecture Components → Epic 1 Stories

| Architecture Component | Story | Deliverable |
|------------------------|-------|-------------|
| Architecture 2.1.1: Workflow Engine | 1.2, 1.7 | WorkflowEngine, WorkflowParser classes |
| Architecture 2.1.2: Agent Pool | 1.3, 1.4 | LLMFactory, AgentPool classes |
| Architecture 2.1.3: State Manager | 1.5 | StateManager class with atomic writes |
| Architecture 2.1.4: Worktree Manager | 1.6 | WorktreeManager class with simple-git |
| Architecture 2.1.5: Template Processor | 1.8 | TemplateProcessor class |
| Architecture 2.3.3: Error Handler | 1.10 | ErrorHandler, RetryHandler classes |
| Architecture 5.1: Technology Stack | 1.1 | Node.js 20, TypeScript 5+, pino, zod |
| Architecture 5.4: Naming Conventions | 1.1 | PascalCase classes, kebab-case files |

### Epic 1 Dependencies for Subsequent Epics

| Dependent Epic | Requires from Epic 1 | Critical Components |
|----------------|----------------------|---------------------|
| Epic 2: PRD Workflow | Stories 1.1-1.8 | WorkflowEngine, AgentPool, StateManager, TemplateProcessor |
| Epic 3: Architecture Workflow | Stories 1.1-1.8 | WorkflowEngine, AgentPool, StateManager, TemplateProcessor |
| Epic 4: Story Workflow | Stories 1.1-1.8 | WorkflowEngine, AgentPool, StateManager, TemplateProcessor |
| Epic 5: Dev Workflow | Stories 1.1-1.8 | WorkflowEngine, AgentPool, WorktreeManager, StateManager |
| Epic 6: API/Dashboard | Stories 1.4, 1.5, 1.7, 1.9 | StateManager (queries), AgentPool (status), WorkflowEngine (control) |

### Success Metrics Mapping

| PRD Success Metric | Epic 1 Contribution | Measurement |
|--------------------|---------------------|-------------|
| PRD completion <30 minutes | Stories 1.2, 1.7, 1.8 enable workflow execution | Workflow engine performance |
| >85% autonomous decisions | Story 1.10 error handling reduces escalations | Error classification accuracy |
| Code quality >90% first attempt | Story 1.4 agent quality via optimal LLM assignment | Per-agent LLM configuration |
| Project budget <$200 | Story 1.3 multi-provider LLM enables cost optimization | Cost tracking per provider |
| 99%+ uptime | Story 1.5 state recovery, Story 1.10 graceful degradation | Crash recovery success rate |

## Risks, Assumptions, Open Questions

### Risks

**RISK-1: Multi-Provider LLM Complexity (Medium Severity, High Impact)**
- **Description**: Supporting 4+ LLM providers (Anthropic, OpenAI, Zhipu, Google) adds complexity to authentication, model validation, error handling, and cost tracking
- **Impact**: Development time for Story 1.3 could expand by 30-50% if provider APIs diverge significantly
- **Mitigation**:
  - Prioritize Anthropic and OpenAI (mandatory) in Story 1.3
  - Defer Zhipu and Google to v1.1 if schedule pressure
  - Create LLMProvider interface to abstract differences
  - Mock all LLM providers in tests to avoid API dependencies
- **Owner**: Amelia (Developer)
- **Status**: Accepted - proceed with mitigation

**RISK-2: Git Worktree Edge Cases (Medium Severity, Medium Impact)**
- **Description**: Git worktree operations can fail in edge cases: dirty working directory, detached HEAD, network failures during push, orphaned worktrees
- **Impact**: Story 1.6 may require additional error handling beyond initial scope
- **Mitigation**:
  - Story 1.6.7 (AC-1.6.7) explicitly covers error handling
  - Validate working directory clean before createWorktree()
  - Document worktree cleanup procedure for manual intervention
  - Add `orchestrator cleanup-worktrees` CLI command in Story 1.9
- **Owner**: Amelia (Developer)
- **Status**: Mitigated - error handling scoped in AC

**RISK-3: State Corruption During Crash (High Severity, Low Probability)**
- **Description**: If orchestrator crashes mid-write during state persistence, files could corrupt (half-written YAML)
- **Impact**: Project state lost, manual recovery required
- **Mitigation**:
  - Story 1.5.6 (AC-1.5.6) requires atomic writes (temp + rename)
  - Atomic rename is OS-level atomic operation on Unix (POSIX guarantee)
  - Git auto-commit provides backup (can revert to previous commit)
  - Test crash-recovery scenario in integration tests
- **Owner**: Amelia (Developer)
- **Status**: Mitigated - atomic writes prevent corruption

**RISK-4: LLM API Rate Limits Exceed Retry Capacity (Medium Severity, Medium Probability)**
- **Description**: During high-concurrency periods (3+ agents active), LLM API rate limits could be exceeded repeatedly, exhausting retry attempts
- **Impact**: Workflows escalate unnecessarily, reducing autonomy below 85% target
- **Mitigation**:
  - Story 1.3.9 (AC-1.3.9) implements exponential backoff (1s, 2s, 4s)
  - Story 1.4.7 (AC-1.4.7) enforces concurrency limits (default: 3 agents)
  - Monitor rate limit errors in logs, adjust concurrency limits per project
  - Future v1.1: Implement rate-limit-aware scheduling
- **Owner**: Amelia (Developer), Bob (Scrum Master - monitoring)
- **Status**: Accepted - monitor in production

**RISK-5: Agent Context Size Exceeds LLM Token Limits (Low Severity, Medium Probability)**
- **Description**: Large onboarding docs + workflow state + PRD + architecture could exceed LLM context limits (200k tokens for Claude)
- **Impact**: Agent creation fails, workflow cannot proceed
- **Mitigation**:
  - Story 1.4.4 (AC-1.4.4) injects context, but no pruning in Epic 1 (deferred to Epic 5)
  - Assumption: Onboarding docs <50k tokens, PRD <30k tokens, architecture <40k tokens (fits in 200k context)
  - Document token budget guidelines for onboarding docs
  - Future Epic 5: Implement intelligent context pruning
- **Owner**: Bob (Scrum Master - documentation), Amelia (Epic 5 implementation)
- **Status**: Accepted - Epic 5 will address

**RISK-6: Dependency Version Conflicts (Low Severity, Low Probability)**
- **Description**: NPM dependencies (Anthropic SDK, OpenAI SDK, simple-git, etc.) could have conflicting transitive dependencies
- **Impact**: Build failures, runtime errors
- **Mitigation**:
  - Use npm workspaces to isolate backend dependencies
  - Lock dependency versions with package-lock.json
  - Run `npm audit` in CI/CD (Architecture 6.3)
  - Test with clean `node_modules` in CI/CD
- **Owner**: Amelia (Developer)
- **Status**: Mitigated - standard npm best practices

### Assumptions

**ASSUM-1: Git Repository Initialized**
- All projects managed by orchestrator assume git repository already initialized in project root
- Orchestrator will NOT initialize git repositories
- Validation: Check `.git/` directory exists before worktree operations

**ASSUM-2: Git Credentials Configured**
- SSH keys or HTTPS tokens configured for pushing branches to remote
- Orchestrator will NOT manage git authentication
- Validation: Document git setup requirements in README.md

**ASSUM-3: Node.js 20 LTS Available**
- Deployment environment has Node.js 20+ and npm 10+ installed
- Orchestrator will NOT bundle Node.js runtime
- Validation: Check engine requirements in package.json

**ASSUM-4: File System Permissions**
- Orchestrator has read/write permissions for project directory and `/wt/` subdirectory
- Orchestrator can execute git commands (not restricted by OS permissions)
- Validation: Test file operations on startup, fail fast with clear error

**ASSUM-5: Onboarding Docs Fit in LLM Context**
- Onboarding documentation <50k tokens total
- If exceeded, agent context injection may fail
- Validation: Epic 5 will implement context pruning (future)

**ASSUM-6: Single Orchestrator Instance Per Project**
- No concurrent orchestrator instances managing same project
- File-based state persistence assumes single writer
- Validation: Document limitation in README.md

**ASSUM-7: LLM Provider APIs Stable**
- Anthropic, OpenAI, Zhipu API interfaces remain backward compatible
- SDK updates won't break existing integrations
- Validation: Pin SDK versions, test updates in staging before production

**ASSUM-8: Project Configuration Manually Created**
- `.bmad/project-config.yaml` created by user before first workflow execution
- Orchestrator will NOT generate project configuration
- Validation: Fail fast with clear error if config missing

### Open Questions

**OQ-1: Optimal Agent Concurrency Limit** (Decision Required: Story 1.4)
- **Question**: What's the default max concurrent agents? 3? 5? Configurable per project?
- **Impact**: Affects performance and LLM API costs
- **Options**:
  - Option A: Default 3, configurable in project-config.yaml (recommended)
  - Option B: Fixed 5, no configuration
  - Option C: Dynamic based on available memory/CPU
- **Decision Owner**: Winston (Architect), Amelia (Developer)
- **Target Resolution**: Before Story 1.4 implementation
- **Recommendation**: Option A - default 3, configurable

**OQ-2: Git Worktree Base Directory** (Decision Required: Story 1.6)
- **Question**: Where should worktrees be created? `/wt/`, `/worktrees/`, or configurable?
- **Impact**: Affects file system organization and documentation
- **Options**:
  - Option A: Fixed `/wt/` (short, matches architecture 9.2)
  - Option B: Configurable in project-config.yaml
  - Option C: `/worktrees/` (more explicit)
- **Decision Owner**: Winston (Architect)
- **Target Resolution**: Before Story 1.6 implementation
- **Recommendation**: Option A - fixed `/wt/` per architecture

**OQ-3: State File Git Auto-Commit Granularity** (Decision Required: Story 1.5)
- **Question**: Commit after every step? Or batch commits per workflow completion?
- **Impact**: Git history verbosity vs crash recovery granularity
- **Options**:
  - Option A: Commit after every step (fine-grained recovery, verbose git history)
  - Option B: Commit after workflow completion (cleaner git history, less recovery granularity)
  - Option C: Commit after every N steps (compromise)
- **Decision Owner**: Bob (Scrum Master), Winston (Architect)
- **Target Resolution**: Before Story 1.5 implementation
- **Recommendation**: Option A - commit after every step (prioritize reliability)

**OQ-4: Error Escalation Notification Mechanism** (Deferred to Epic 6)
- **Question**: How are users notified of escalations? Console log only? Email? Dashboard?
- **Impact**: User experience for escalation handling
- **Options**:
  - Option A: Console log only (Epic 1 - MVP)
  - Option B: Desktop notification (v1.1)
  - Option C: Dashboard + email (Epic 6)
- **Decision Owner**: Bob (Scrum Master), Epic 6 team
- **Target Resolution**: Epic 6 planning
- **Recommendation**: Option A for Epic 1, Option C for Epic 6

**OQ-5: Template Processing Performance for Large Files** (Monitoring Required: Story 1.8)
- **Question**: Can TemplateProcessor handle large templates (>10k lines)?
- **Impact**: PRD/architecture document generation performance
- **Options**:
  - Option A: No optimization (test with real templates)
  - Option B: Streaming template processing (v1.1)
  - Option C: Parallel section processing (v1.1)
- **Decision Owner**: Amelia (Developer)
- **Target Resolution**: Monitor during Story 1.8 testing
- **Recommendation**: Option A, defer optimization to v1.1 if needed

## Test Strategy Summary

### Unit Testing Strategy

**Framework:** Vitest (Architecture 5.1)
**Coverage Target:** >80% line coverage per story

**Unit Test Approach by Component:**

| Component | Test Focus | Mocking Strategy |
|-----------|-----------|------------------|
| **ProjectConfig (Story 1.1)** | Schema validation, error messages | Mock file system (in-memory YAML) |
| **WorkflowParser (Story 1.2)** | Variable resolution, YAML parsing | Mock file reads, use test fixtures |
| **LLMFactory (Story 1.3)** | Provider registration, client creation, retry logic | Mock LLM API calls (no real API costs) |
| **AgentPool (Story 1.4)** | Agent lifecycle, concurrency limits, queuing | Mock LLMFactory, mock persona files |
| **StateManager (Story 1.5)** | Save/load state, atomic writes, git commit | Mock file system, mock git operations |
| **WorktreeManager (Story 1.6)** | Worktree create/destroy, error handling | Mock simple-git library |
| **WorkflowEngine (Story 1.7)** | Step execution, variable replacement, conditionals | Mock StateManager, mock AgentPool |
| **TemplateProcessor (Story 1.8)** | Variable substitution, conditionals, loops | Use test templates (small fixtures) |
| **CLI (Story 1.9)** | Command parsing, error handling | Mock WorkflowEngine, mock StateManager |
| **ErrorHandler (Story 1.10)** | Error classification, retry logic, backoff timing | Mock all dependencies, simulate failures |

**Sample Unit Test:**
```typescript
// Story 1.3: LLM Factory Unit Test
describe('LLMFactory', () => {
  it('should create Anthropic client with OAuth token prioritization', () => {
    process.env.CLAUDE_CODE_OAUTH_TOKEN = 'oauth-token-123';
    process.env.ANTHROPIC_API_KEY = 'api-key-456';

    const factory = new LLMFactory();
    const client = factory.createClient({
      model: 'claude-sonnet-4-5',
      provider: 'anthropic',
    });

    expect(client).toBeDefined();
    expect(client.apiKey).toBe('oauth-token-123'); // OAuth prioritized
  });

  it('should retry LLM API call 3x with exponential backoff', async () => {
    const mockLLM = jest.fn()
      .mockRejectedValueOnce(new Error('Rate limit'))
      .mockRejectedValueOnce(new Error('Rate limit'))
      .mockResolvedValueOnce('Success');

    const result = await retryWithBackoff(mockLLM, { maxAttempts: 3 });

    expect(mockLLM).toHaveBeenCalledTimes(3);
    expect(result).toBe('Success');
  });
});
```

### Integration Testing Strategy

**Framework:** Vitest with real file system and test git repository
**Coverage Target:** All critical workflows end-to-end

**Integration Test Scenarios:**

**INT-1: Workflow Execution End-to-End (Story 1.7)**
- Load real workflow.yaml file
- Parse instructions.md with XML tags
- Execute steps sequentially
- Save state after each step
- Verify output files created
- **Expected Result**: Workflow completes, state saved, outputs generated

**INT-2: Agent Lifecycle with Mocked LLM (Story 1.4)**
- Create agent with LLMFactory
- Load agent persona from markdown
- Invoke agent with mocked LLM response
- Destroy agent and verify cleanup
- **Expected Result**: Agent created, invoked, destroyed within 30s

**INT-3: Crash Recovery Simulation (Story 1.5)**
- Execute workflow to step 3
- Save state
- Simulate crash (kill process)
- Restart orchestrator
- Resume workflow from step 3
- **Expected Result**: Workflow resumes from last checkpoint

**INT-4: Git Worktree Create/Destroy (Story 1.6)**
- Initialize test git repository
- Create worktree for story-1.1
- Verify worktree exists at /wt/story-1.1/
- Verify branch story/1.1 created
- Push branch to remote (mock)
- Destroy worktree
- **Expected Result**: Worktree created, pushed, destroyed

**INT-5: Template Processing with Real Template (Story 1.8)**
- Load real template.md file
- Inject variables from workflow state
- Process conditionals and loops
- Write output file
- **Expected Result**: Output file matches expected content

**INT-6: Error Handling with Simulated Failures (Story 1.10)**
- Simulate LLM API rate limit error
- Verify retry with exponential backoff
- Simulate git failure
- Verify error escalation
- **Expected Result**: Retries succeed or escalate appropriately

### Manual Testing Checklist

**MAN-1: Multi-Provider LLM Authentication (Story 1.3)**
- [ ] Test Anthropic with CLAUDE_CODE_OAUTH_TOKEN
- [ ] Test Anthropic with ANTHROPIC_API_KEY fallback
- [ ] Test OpenAI with OPENAI_API_KEY
- [ ] Test Zhipu with ZHIPU_API_KEY (native)
- [ ] Test GLM via z.ai wrapper (base_url parameter)
- [ ] Verify API key redaction in logs (no [REDACTED] leaks)

**MAN-2: CLI Commands (Story 1.9)**
- [ ] Execute `orchestrator start-workflow --project test --workflow prd`
- [ ] Execute `orchestrator status --project test`
- [ ] Execute `orchestrator logs --project test --tail`
- [ ] Verify color-coded output in terminal
- [ ] Verify error messages actionable

**MAN-3: Worktree Operations in Real Git Repo (Story 1.6)**
- [ ] Create worktree for story-1.1
- [ ] Verify `/wt/story-1.1/` directory exists
- [ ] Verify `git branch` shows `story/1.1`
- [ ] Push branch to remote (requires git credentials)
- [ ] Verify branch visible on GitHub/GitLab
- [ ] Destroy worktree
- [ ] Verify directory deleted, branch removed

**MAN-4: State Persistence and Recovery (Story 1.5)**
- [ ] Start workflow execution
- [ ] Verify `bmad/sprint-status.yaml` updated after each step
- [ ] Verify `bmad/workflow-status.md` updated in parallel
- [ ] Kill orchestrator mid-execution (Ctrl+C)
- [ ] Restart orchestrator
- [ ] Verify workflow resumes from last completed step

### Test Data and Fixtures

**Test Fixtures Directory:** `/tests/fixtures/`

| Fixture File | Purpose | Used By |
|--------------|---------|---------|
| `project-config.example.yaml` | Valid project config | Story 1.1 tests |
| `workflow-simple.yaml` | Simple workflow with 3 steps | Story 1.2, 1.7 tests |
| `workflow-complex.yaml` | Complex workflow with conditionals | Story 1.7 tests |
| `template-prd.md` | PRD template with {{variables}} | Story 1.8 tests |
| `agent-mary.md` | Mary agent persona | Story 1.4 tests |
| `instructions-sample.md` | Workflow instructions with XML tags | Story 1.7 tests |

**Test Git Repository:** Create test git repo in `/tests/git-repo/` for worktree tests

### CI/CD Test Execution

**GitHub Actions Workflow:**

```yaml
name: Epic 1 Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Check coverage
        run: npm run test:coverage
        # Enforce 80% coverage threshold

      - name: Run linter
        run: npm run lint

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

**Test Execution Order:**
1. Unit tests (fast, no external dependencies)
2. Integration tests (slower, uses file system and test git repo)
3. Manual smoke tests (before release)

**Epic 1 Definition of Done (Testing):**
- [ ] All unit tests pass (>80% coverage per story)
- [ ] All integration tests pass
- [ ] Manual testing checklist complete
- [ ] No security vulnerabilities (npm audit)
- [ ] Code linter passes (ESLint)
- [ ] Test fixtures documented in README

---

**Epic 1 Tech Spec Complete**
**Generated:** 2025-11-04
**Author:** Chris
**Status:** Draft → Ready for Review
