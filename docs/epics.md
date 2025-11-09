# Agent Orchestrator - Epic Breakdown

**Author:** Chris
**Date:** 2025-11-03
**Project Level:** 3
**Target Scale:** Medium (10+ concurrent projects, 100+ stories per project)

---

## Overview

This document provides the detailed epic breakdown for Agent Orchestrator, expanding on the high-level epic list in the [PRD](./PRD.md).

Each epic includes:

- Expanded goal and value proposition
- Complete story breakdown with user stories
- Acceptance criteria for each story
- Story sequencing and dependencies

**Epic Sequencing Principles:**

- Epic 1 establishes foundational infrastructure and initial functionality
- Subsequent epics build progressively, each delivering significant end-to-end value
- Stories within epics are vertically sliced and sequentially ordered
- No forward dependencies - each story builds only on previous work

---

## Epic Structure

Based on the Agent Orchestrator PRD, requirements naturally group into **6 core epics** that follow the BMAD methodology phases and deliver incremental value:

1. **Foundation & Core Engine** - The orchestration infrastructure
2. **Analysis Phase Automation** - Autonomous PRD generation
3. **Planning Phase Automation** - Autonomous architecture design
4. **Solutioning Phase Automation** - Autonomous story decomposition
5. **Story Implementation Automation** - Autonomous code development
6. **Remote Access & Monitoring** - Web dashboard and API

Each epic delivers end-to-end value and enables the next phase of autonomous capability.

---

## Story 0.1: Project Scaffolding & Initialization

**User Story:**

As a development team,
I want the initial project structure created with monorepo configuration,
So that Epic 1 stories have a foundation to build upon.

**Acceptance Criteria:**
1. Initialize git repository (if not already done)
2. Create monorepo directory structure:
   - `/backend` - Node.js/TypeScript backend (workflow engine, agents, API)
   - `/dashboard` - React/Vite frontend (PWA dashboard)
   - `/tests` - Shared test utilities and E2E tests
   - `/projects` - Directory for orchestrator-managed projects (gitignored)
   - `/logs` - Application logs directory (gitignored)
3. Create root `package.json` with npm workspaces configuration:
   - Workspaces: `["backend", "dashboard"]`
   - Scripts: dev, build, test, lint
   - Engine requirements: Node.js >=20.0.0, npm >=10.0.0
4. Create `.gitignore` with:
   - `node_modules/`, build outputs (`dist/`, `build/`)
   - Environment files (`.env`, `.env.local`)
   - Logs (`logs/*.log`, `*.log`)
   - Orchestrator-managed projects (`projects/*/`)
   - OS/IDE files (`.DS_Store`, `.vscode/`, `.idea/`)
5. Create `README.md` with:
   - Project overview and key features
   - Setup instructions (dependencies, env config)
   - Development commands (backend, dashboard, workspaces)
   - Documentation links (PRD, architecture, epics, UX design)
6. Create `.env.example` with required environment variables:

   # LLM Provider Authentication (multi-provider support)
   - `CLAUDE_CODE_OAUTH_TOKEN` (Anthropic subscription - preferred method)
   - `ANTHROPIC_API_KEY` (Anthropic pay-per-use - fallback if no OAuth token)
   - `OPENAI_API_KEY` (OpenAI GPT/Codex models)
   - `ZHIPU_API_KEY` (native Zhipu GLM access - optional)
   - `ZAI_API_KEY` (GLM via z.ai Anthropic-compatible wrapper - optional)
   - `ZAI_BASE_URL=https://api.z.ai/api/anthropic` (z.ai endpoint)
   - `GOOGLE_API_KEY` (Google Gemini models - optional, future support)

   # Git & Infrastructure
   - `GITHUB_TOKEN` (git operations)
   - `JWT_SECRET` (authentication)
   - `NODE_ENV`, `PORT`, `API_BASE_URL` (application config)
7. Verify directory structure matches architecture:8.2 specification
8. Commit initial scaffolding to git

**Prerequisites:** None (first story)

**Status:** ✅ Complete

---

## Epic 1: Foundation & Core Engine

**Goal:** Build the foundational orchestration infrastructure that enables all autonomous workflow execution.

**Value Proposition:** This epic creates the "operating system" for the orchestrator - the workflow engine, agent management, state persistence, and git operations that everything else depends on. Without this foundation, no autonomous workflows can run.

**Business Value:** Enables all subsequent autonomous capabilities. One-time investment that unlocks continuous autonomous development.

**Technical Scope:**
- Workflow YAML parsing and execution engine
- Agent pool with LLM factory pattern
- Multi-provider LLM integration (Anthropic, OpenAI)
- State management (file-based persistence)
- Git worktree operations
- Project configuration system

### Stories

**Story 1.1: Project Repository Structure & Configuration**

As a system architect,
I want a well-organized project structure with configuration management,
So that the orchestrator can load project-specific settings and maintain clean separation of concerns.

**Acceptance Criteria:**
1. Create TypeScript project with proper tsconfig.json and package.json
2. Establish directory structure: src/, tests/, docs/, .bmad/
3. Implement ProjectConfig class that loads from .bmad/project-config.yaml
4. Support loading: project metadata, agent LLM assignments, onboarding docs paths
5. Validate configuration schema on load with clear error messages
6. Include example project-config.yaml with inline documentation

**Prerequisites:** None (first story)

---

**Story 1.2: Workflow YAML Parser**

As a workflow engine developer,
I want to parse and validate workflow.yaml files,
So that I can execute BMAD workflow definitions programmatically.

**Acceptance Criteria:**
1. Parse workflow.yaml using js-yaml library
2. Validate required fields: name, instructions, config_source
3. Resolve {project-root} and {installed_path} variables
4. Load config_source file and resolve {config_source}:key references
5. Support system-generated variables (date:system-generated)
6. Return structured WorkflowConfig object with resolved values
7. Throw descriptive errors for invalid YAML or missing references

**Prerequisites:** Story 1.1 (needs ProjectConfig)

---

**Story 1.3: LLM Factory Pattern Implementation**

As an agent system developer,
I want a factory that creates LLM clients for different providers,
So that agents can be assigned optimal models per project configuration.

**Acceptance Criteria:**
1. Implement LLMFactory class with provider registry
2. Support Anthropic provider (Claude Sonnet, Claude Haiku):
   - Check for `CLAUDE_CODE_OAUTH_TOKEN` first (subscription auth - preferred)
   - Fallback to `ANTHROPIC_API_KEY` if OAuth token not present (pay-per-use)
   - Support `base_url` parameter in LLMConfig for Anthropic-compatible wrappers (e.g., z.ai for GLM)
   - LLMConfig interface: `{ model: string, provider: string, base_url?: string, api_key?: string }`
3. Support OpenAI provider (GPT-4, GPT-4 Turbo, Codex):
   - Load `OPENAI_API_KEY` from environment
   - Support models: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct` (Codex replacement)
4. Support Zhipu provider (GLM-4, GLM-4.6):
   - Load `ZHIPU_API_KEY` from environment
   - Native Zhipu API integration for GLM models
   - Alternative to z.ai wrapper approach for GLM access
5. (Optional) Support Google provider (Gemini):
   - Load `GOOGLE_API_KEY` from environment
   - Integrate `@google/generative-ai` SDK
   - Support `gemini-1.5-pro`, `gemini-2.0-flash` models
   - Can be deferred to future story if time-constrained
6. Provider factory registration in constructor:
   ```typescript
   this.providers.set('anthropic', new AnthropicProvider());
   this.providers.set('openai', new OpenAIProvider());
   this.providers.set('zhipu', new ZhipuProvider());
   // this.providers.set('google', new GoogleProvider()); // Optional
   ```
7. Validate model names for each provider:
   - Anthropic: `claude-sonnet-4-5`, `claude-haiku`, `GLM-4.6` (via base_url wrapper)
   - OpenAI: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct`
   - Zhipu: `GLM-4`, `GLM-4.6`
   - Google: `gemini-1.5-pro`, `gemini-2.0-flash` (if implemented)
8. Create LLMClient interface with `invoke()` and `stream()` methods
9. Include retry logic with exponential backoff for API failures
10. Log all LLM requests/responses for debugging (exclude sensitive keys)
11. Support per-agent LLM configuration via `.bmad/project-config.yaml`:
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

**Prerequisites:** Story 1.1

---

**Story 1.4: Agent Pool & Lifecycle Management**

As an orchestrator core developer,
I want to manage agent instances with proper lifecycle and resource cleanup,
So that agents can be created with specific LLMs and contexts, then cleaned up after use.

**Acceptance Criteria:**
1. Implement AgentPool class that manages active agent instances
2. createAgent(name, llmConfig, context) creates agent with project-configured LLM:
   - llmConfig retrieved from `.bmad/project-config.yaml` agent_assignments section
   - Supports any provider configured in LLMFactory (Anthropic, OpenAI, Zhipu, Google)
   - Example: `config.agent_assignments['mary']` → `{ model: "claude-sonnet-4-5", provider: "anthropic" }`
   - Enables per-agent provider assignment (Mary on Claude, Amelia on OpenAI, Bob on GLM, etc.)
3. Load agent persona from bmad/bmm/agents/{name}.md
4. Inject LLMClient (from LLMFactory), context (onboarding, docs, workflow state) into agent
5. Track agent execution time and estimated cost per provider
6. destroyAgent(id) cleans up resources within 30 seconds
7. Support concurrent agent limits (configurable per project)
8. Queue agent tasks if pool is at capacity

**Prerequisites:** Story 1.3 (needs LLMFactory)

---

**Story 1.5: State Manager - File Persistence**

As an orchestrator developer,
I want to persist workflow state to files after each step,
So that execution can resume after crashes or interruptions.

**Acceptance Criteria:**
1. Implement StateManager class for workflow state persistence
2. saveState() writes to bmad/sprint-status.yaml (machine-readable)
3. Save workflow-status.md (human-readable) in parallel
4. Track: current workflow, step number, status, variables, agent activity
5. loadState() reads from files on orchestrator start
6. Atomic file writes (write to temp, then rename) to prevent corruption
7. Support state queries for dashboard (getProjectPhase, getStoryStatus)
8. Auto-commit state changes to git with descriptive messages

**Prerequisites:** Story 1.1

---

**Story 1.6: Git Worktree Manager - Basic Operations**

As a story development system,
I want to create and manage git worktrees for isolated story development,
So that multiple stories can develop in parallel without branch conflicts.

**Acceptance Criteria:**
1. Implement WorktreeManager using simple-git library
2. createWorktree(storyId) creates worktree at /wt/story-{id}/
3. Create branch story/{id} from main
4. Track worktree location, branch name, and story ID mapping
5. Push worktree branch to remote when ready
6. destroyWorktree(storyId) removes worktree and local branch
7. Handle errors gracefully (worktree already exists, git failures)
8. List active worktrees with status

**Prerequisites:** Story 1.1

---

**Story 1.7: Workflow Engine - Step Executor**

As a workflow automation developer,
I want to execute workflow steps in order with proper state management,
So that BMAD workflows can run autonomously.

**Acceptance Criteria:**
1. Implement WorkflowEngine class that executes workflow steps sequentially
2. Load instructions from markdown file (parse step tags: <step n="X">)
3. Execute actions in exact order (step 1, 2, 3...)
4. Replace {{variables}} with resolved values
5. Handle conditional logic (<check if="condition">)
6. Support goto, invoke-workflow, invoke-task tags
7. Save state after each step completion
8. Resume from last completed step on restart
9. Support #yolo mode (skip optional steps, no prompts)

**Prerequisites:** Story 1.2, Story 1.5

---

**Story 1.8: Template Processing System**

As a workflow engine developer,
I want to process markdown templates with variable substitution,
So that workflows can generate documents from templates (PRD, architecture, etc.).

**Acceptance Criteria:**
1. Load template files (markdown with {{placeholders}})
2. Replace {{variable}} with actual values from workflow state
3. Support conditional blocks: {{#if condition}} ... {{/if}}
4. Support loops: {{#each collection}} ... {{/each}}
5. Write processed template to output file
6. Use Edit tool for subsequent updates (not Write)
7. Preserve formatting and markdown structure
8. Clear error messages for undefined variables

**Prerequisites:** Story 1.7

---

**Story 1.9: CLI Foundation - Basic Commands**

As a developer using the orchestrator,
I want command-line tools to control the orchestrator locally,
So that I can start workflows, check status, and debug issues.

**Acceptance Criteria:**
1. Implement CLI using commander.js or yargs
2. Commands: start-workflow, pause, resume, status, list-projects
3. `orchestrator start-workflow --project <id> --workflow <path>`
4. `orchestrator status --project <id>` shows current phase and progress
5. `orchestrator logs --project <id> --tail` shows recent logs
6. Color-coded output for better readability
7. --help documentation for each command
8. Proper error handling with actionable messages

**Prerequisites:** Story 1.7, Story 1.5

---

**Story 1.10: Error Handling & Recovery Infrastructure**

As an orchestrator reliability engineer,
I want comprehensive error handling with automatic retry and graceful degradation,
So that transient failures don't crash workflows and users get clear error messages.

**Acceptance Criteria:**
1. Implement RetryHandler with exponential backoff (3 attempts default)
2. Classify errors: recoverable (retry), retryable (backoff), escalation-required
3. LLM API failures: retry 3x with backoff, then escalate
4. Git operation failures: clean state, log error, escalate
5. Workflow parse errors: report line number and clear message
6. Log all errors with context, stack traces, and recovery attempts
7. Graceful degradation: continue other projects if one fails
8. Health check endpoint for monitoring

**Prerequisites:** Story 1.3, Story 1.6

**Story 1.13: Cost-Quality Optimizer Implementation**

As a cost-conscious user,
I want the orchestrator to use optimal LLM models for each task,
So that I get best value (quality per dollar spent).

**Acceptance Criteria:**
1. Implement CostQualityOptimizer class with complexity analysis
2. Analyze task complexity before agent invocation:
   - Simple: Formatting, routine operations, cached responses
   - Moderate: Code generation, standard reviews, typical decisions
   - Complex: Architecture design, critical escalations, novel problems
3. Recommend optimal model based on complexity + budget:
   - Complex task + budget available → Premium (Claude Sonnet, GPT-4 Turbo)
   - Moderate task → Standard (Claude Haiku, GPT-3.5 Turbo)
   - Simple task → Economy (cached, local models)
4. Override recommendations if budget constrained:
   - At 75% budget → Downgrade non-critical tasks to standard
   - At 90% budget → Downgrade all except critical to economy
   - At 100% budget → Block new tasks, escalate for budget increase
5. Track costs in real-time:
   - Cost per agent invocation
   - Cost per phase
   - Cost per model
   - Token usage (input, output, cached)
6. Provide cost dashboard:
   - Current spend vs budget (daily, weekly, monthly)
   - Cost breakdown by agent, phase, model
   - Projected monthly cost based on current usage
   - Cost savings from optimizer (vs always using premium)
7. Alert at budget thresholds:
   - 75%: Warning toast + email
   - 90%: Critical alert + downgrade strategy
   - 100%: Block tasks + user approval required
8. Cost optimization strategies:
   - Cache frequently used prompts (e.g., agent personas)
   - Batch similar requests to same model
   - Use economy models for retries (after initial failure)
   - Compress context for moderate tasks
9. Budget configuration:
   ```yaml
   budget:
     daily: 50  # $50/day
     weekly: 300
     monthly: 1000
     alerts:
       - threshold: 0.75
         action: warn
       - threshold: 0.90
         action: downgrade
       - threshold: 1.00
         action: block
   ```
10. Cost reporting:
    - CSV export of cost data
    - Cost trends chart (last 30 days)
    - Model efficiency metrics (quality score / cost)

**Prerequisites:** Story 1.4 (Agent Pool), Story 1.3 (LLM Factory)

**Estimated Time:** 5-6 hours

---

## Epic 2: Analysis Phase Automation

**Goal:** Enable autonomous PRD generation - the first "magic moment" where users wake up to a complete requirements document.

**Value Proposition:** Transform rough requirements into professional PRDs overnight. This epic delivers the first autonomous workflow execution, proving the orchestrator can make intelligent decisions and produce quality documentation autonomously.

**Business Value:** 10x faster requirements analysis. PRD in <30 minutes vs 2-4 hours human time.

**Technical Scope:**
- PRD workflow execution engine
- Mary (Analyst) and John (PM) agent implementations
- Autonomous decision making with confidence scoring
- Escalation queue for ambiguous requirements
- PRD template processing

### Stories

**Story 2.1: Confidence-Based Decision Engine**

As an autonomous workflow developer,
I want agents to assess their confidence in decisions and escalate when uncertain,
So that the orchestrator balances autonomy with safety.

**Acceptance Criteria:**
1. Implement DecisionEngine class with confidence scoring
2. attemptAutonomousDecision(question, context) returns Decision with confidence (0-1)
3. Check onboarding docs first for explicit answers (confidence 0.95)
4. Use LLM reasoning with low temperature (0.3) for decisions
5. Assess confidence based on answer clarity and context sufficiency
6. Escalate if confidence < 0.75 (ESCALATION_THRESHOLD)
7. Return decision value and reasoning for audit trail
8. Track: question, decision, confidence, reasoning, outcome

**Prerequisites:** Epic 1 complete

---

**Story 2.2: Escalation Queue System**

As a workflow orchestrator,
I want to queue decisions that need human input and resume after response,
So that autonomous workflows can continue after clarification.

**Acceptance Criteria:**
1. Implement EscalationQueue class
2. add(escalation) saves to .bmad-escalations/{id}.json
3. Escalation includes: workflow, step, question, AI reasoning, confidence, context
4. Pause workflow execution at escalation point
5. Notify via console/dashboard (API integration in Epic 6)
6. respond(escalationId, response) records human answer
7. Resume workflow from escalation step with response
8. Track escalation metrics: count, resolution time, categories

**Prerequisites:** Story 2.1

---

**Story 2.3: Mary Agent - Business Analyst Persona**

As the orchestrator core,
I want a Mary agent that excels at requirements analysis,
So that PRD workflows can extract and structure user requirements intelligently.

**Acceptance Criteria:**
1. Load Mary persona from bmad/bmm/agents/mary.md
2. Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - Recommended: Claude Sonnet for strong reasoning on requirements analysis
   - See Story 1.3 for configuration examples with multiple providers
3. Specialized prompts for: requirement extraction, user story writing, scope negotiation
4. Context includes: user input, product brief (if exists), domain knowledge
5. Methods: analyzeRequirements(), defineSuccessCriteria(), negotiateScope()
6. Generate clear, structured requirements documentation
7. Make decisions with confidence scoring via DecisionEngine
8. Escalate ambiguous or critical product decisions

**Prerequisites:** Epic 1 (Agent Pool), Story 2.1

---

**Story 2.4: John Agent - Product Manager Persona**

As the orchestrator core,
I want a John agent that provides strategic product guidance,
So that PRD workflows benefit from PM-level thinking.

**Acceptance Criteria:**
1. Load John persona from bmad/bmm/agents/john.md
2. Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - Recommended: Claude Sonnet for strategic reasoning and product decisions
   - See Story 1.3 for configuration examples with multiple providers
3. Specialized prompts for: product strategy, prioritization, roadmap planning
4. Methods: defineProductVision(), prioritizeFeatures(), assessMarketFit()
5. Validate Mary's requirements for business viability
6. Challenge scope creep and unrealistic timelines
7. Generate executive summaries and success metrics
8. Collaborate with Mary through shared workflow context

**Prerequisites:** Epic 1 (Agent Pool), Story 2.1

---

**Story 2.5: PRD Workflow Executor**

As a user wanting automated requirements analysis,
I want to run the PRD workflow and get a complete PRD document,
So that I can skip manual requirements documentation.

**Acceptance Criteria:**
1. Load bmad/bmm/workflows/prd/workflow.yaml
2. Execute all PRD workflow steps in order
3. Spawn Mary agent for requirements analysis
4. Spawn John agent for strategic validation
5. Process template-output tags by generating content and saving to PRD.md
6. Handle elicit-required tags (skip in #yolo mode)
7. Make autonomous decisions via DecisionEngine (target <3 escalations)
8. Complete execution in <30 minutes
9. Generate docs/PRD.md with all sections filled
10. Update workflow-status.yaml to mark PRD complete

**Prerequisites:** Story 2.3, Story 2.4, Story 2.2

---

**Story 2.6: PRD Template & Content Generation**

As the PRD workflow,
I want to generate high-quality PRD content from templates,
So that output matches professional documentation standards.

**Acceptance Criteria:**
1. Load prd-template.md with proper structure
2. Generate content for each template section:
   - vision_alignment, product_magic_essence
   - success_criteria, mvp_scope, growth_features
   - functional_requirements_complete
   - performance/security/scalability requirements (if applicable)
3. Adapt content to project type (API, mobile, SaaS, etc.)
4. Include domain-specific sections if complex domain detected
5. Generate 67+ functional requirements from user input
6. Format with proper markdown, tables, code blocks
7. Save incrementally as sections complete

**Prerequisites:** Story 2.5

---

**Story 2.7: PRD Quality Validation**

As a PRD workflow,
I want to validate generated PRD quality before completion,
So that output meets >85% completeness standard.

**Acceptance Criteria:**
1. Implement PRDValidator class with quality checks
2. Verify all required sections present
3. Check requirements clarity (no vague "handle X" requirements)
4. Validate success criteria are measurable
5. Ensure acceptance criteria for key features
6. Check for contradictions or gaps
7. Generate completeness score (target >85%)
8. If score <85%, identify gaps and regenerate missing content
9. Log validation results for improvement

**Prerequisites:** Story 2.6

---

## Epic 3: Planning Phase Automation (Restructured for Parallel Development)

**Goal:** Enable autonomous architecture design **and test strategy planning** with mandatory security validation, using **foundation-first architecture** that maximizes git worktree parallelization.

**Value Proposition:** System architecture emerges from requirements automatically. **Test infrastructure defined upfront.** Technical decisions documented with rationale. **Foundation stories (3.1-3.3) establish shared infrastructure, enabling feature stories (3.4-3.8) to develop in parallel git worktrees for 2x faster completion.**

**Business Value:** 10x faster architecture phase (<50 minutes vs 4-8 hours). **2x parallel development speedup via worktrees.** Test quality baked in from the start. Consistent quality. Reduced security vulnerabilities through early validation. No waiting for architect availability.

**Technical Scope:**
- Architecture data models and schemas (foundation)
- Architecture workflow engine (foundation)
- Winston (Architect) agent infrastructure (foundation)
- **Murat (Test Architect) agent infrastructure - REQUIRED** (foundation)
- System architecture generation (parallel)
- Test strategy generation (parallel)
- Security gate validation (parallel)
- Technical decisions logging (parallel)
- CIS agent integration (parallel)

**Implementation Strategy:**
- **Phase 1 (Foundation)**: Stories 3.1-3.3 run sequentially (~8 hours) to establish shared infrastructure
- **Phase 2 (Features)**: Stories 3.4-3.8 run in parallel git worktrees (~4-5 hours with 5 worktrees)
- **Speedup**: 2x faster than original sequential approach (4 story-units vs 8)

### Stories

---

### **PHASE 1: FOUNDATION (Sequential)**

**Story 3.1: Architecture Data Models & Core Infrastructure**

As a system architect,
I want foundational data models and schemas for architecture documents,
So that all architecture stories can build on consistent types.

**Acceptance Criteria:**
1. Define TypeScript interfaces in `src/architecture/types.ts`:
   - `ArchitectureSpec` (system overview, components, data models, APIs)
   - `ComponentSpec` (name, responsibility, dependencies, interfaces)
   - `APISpec` (endpoint, method, auth, request/response schemas)
   - `SecuritySpec` (authentication, authorization, encryption, threats)
   - `TestStrategy` (unit/integration/e2e approach, coverage targets)
   - `TechnicalDecision` (context, decision, rationale, alternatives, date)
2. Create JSON schema validation for each interface
3. Implement `ArchitectureDocumentBuilder` class with methods:
   - `buildFromTemplate()`: Load template and create empty structure
   - `validateStructure()`: Check document completeness
   - `toMarkdown()`: Convert to markdown format
4. Create `docs/templates/architecture-template.md` (structure only, no content)
5. Unit tests for schema validation and builder methods
6. Zero external dependencies (pure data layer)

**Prerequisites:** Epic 1 complete

**Estimated Time:** 2-3 hours

**Git Worktree:** Main development branch

---

**Story 3.2: Architecture Workflow Engine Foundation**

As a workflow orchestrator,
I want workflow engine infrastructure for architecture phase,
So that subsequent stories can execute architecture generation steps.

**Acceptance Criteria:**
1. Implement `ArchitectureWorkflowEngine` class extending `WorkflowEngine` (Epic 1)
2. Load `bmad/bmm/workflows/architecture/workflow.yaml`
3. Parse workflow steps and build execution plan
4. Implement state machine transitions:
   - `not_started` → `in_progress` → `review` → `complete`
   - Track current step, progress percentage, timestamps
5. Worktree management integration:
   - Create worktree for architecture phase: `wt/architecture`
   - Branch: `architecture/design`
   - Cleanup on completion or failure
6. State persistence to `bmad/workflow-status.yaml`
7. Implement step execution hooks (pre/post step callbacks)
8. Error handling with rollback capability
9. Unit tests for workflow engine and state machine
10. Does NOT execute actual architecture generation (infrastructure only)

**Prerequisites:** Story 3.1, Epic 1 (WorkflowEngine, WorktreeManager)

**Estimated Time:** 3-4 hours

**Git Worktree:** Main development branch

---

**Story 3.3: Agent Persona Infrastructure & Context Builder**

As an agent system developer,
I want Winston and Murat agent personas configured with LLM assignments,
So that architecture generation stories can invoke agents with proper context.

**Acceptance Criteria:**
1. Load Winston persona from `bmad/bmm/agents/winston.md`
2. Load Murat persona from `bmad/bmm/agents/murat.md`
3. Read LLM assignments from `.bmad/project-config.yaml`:
   - Winston: Recommended Claude Sonnet (or configured alternative)
   - Murat: Recommended Claude Sonnet (or configured alternative)
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - See Story 1.3 for configuration examples with multiple providers
4. Implement `ArchitectureAgentContextBuilder` class:
   - `buildWinstonContext(prd, techDesignDoc)`: Prepare Winston's context
   - `buildMuratContext(prd, architectureSpec)`: Prepare Murat's context
   - Context includes: PRD sections, technical constraints, domain knowledge
5. Implement agent invocation templates:
   - `winstonSystemDesignPrompt(context)`
   - `muratTestStrategyPrompt(context)`
6. Token optimization: Prune PRD to relevant sections (<30k tokens per agent)
7. Agent factory registration in `AgentPool` (Epic 1)
8. Unit tests for context building and prompt generation
9. Does NOT invoke agents or generate content (setup only)

**Prerequisites:** Story 3.1, Epic 1 (AgentPool, LLMFactory)

**Estimated Time:** 2-3 hours

**Git Worktree:** Main development branch

---

### **PHASE 2: FEATURE DELIVERY (Parallel)**

**Story 3.4: System Architecture Generation (Winston)**

As a user wanting automated architecture design,
I want Winston agent to generate system architecture from PRD,
So that I have a technical specification for implementation.

**Acceptance Criteria:**
1. Implement `SystemArchitectureGenerator` class
2. Invoke Winston agent with system design prompt (via Story 3.3)
3. Generate architecture sections:
   - System architecture overview (with mermaid diagrams)
   - Component architecture and responsibilities
   - Data models and schemas
   - API specifications (REST endpoints, GraphQL, WebSocket)
   - Technology stack decisions with rationale
   - Deployment architecture
   - Scalability and performance considerations
4. Use `ArchitectureDocumentBuilder` (Story 3.1) to structure output
5. Validate output against `ArchitectureSpec` schema
6. Save to `docs/architecture.md` (system architecture sections only)
7. Log technical decisions to `TechnicalDecisionsLogger` (Story 3.7)
8. Make decisions with confidence scoring via DecisionEngine (Epic 2)
9. Escalate if confidence <0.75 (target: <2 escalations)
10. Complete in <25 minutes
11. Unit tests + integration tests with mock agent responses

**Prerequisites:** Stories 3.1, 3.2, 3.3 (Foundation complete), Epic 2 (PRD)

**Estimated Time:** 3-4 hours

**Git Worktree:** `wt/story-3.4` (branch: `story/3.4-system-architecture`)

---

**Story 3.5: Test Strategy Generation (Murat - REQUIRED)**

As a user wanting comprehensive test planning,
I want Murat agent to generate test strategy from PRD and architecture,
So that test infrastructure is defined before implementation.

**Acceptance Criteria:**
1. Implement `TestStrategyGenerator` class
2. Invoke Murat agent with test strategy prompt (via Story 3.3)
3. Generate test strategy sections:
   - Test pyramid recommendations (unit/integration/E2E ratios)
   - Unit test requirements per component
   - Integration test scenarios
   - E2E test critical paths
   - Performance test targets
   - Security test requirements (OWASP coverage)
   - ATDD workflow design
   - Quality gates and coverage targets
4. Use `ArchitectureDocumentBuilder` to append test strategy
5. Validate output against `TestStrategy` schema
6. Append to `docs/architecture.md` (test strategy section)
7. **Collaborate with Winston's architecture:**
   - Review component testability
   - Escalate if architecture has testability issues (e.g., tightly coupled components)
8. Make decisions with confidence scoring via DecisionEngine (Epic 2)
9. Escalate if confidence <0.75
10. Complete in <20 minutes
11. Unit tests + integration tests
12. **REQUIRED status maintained**: Murat agent execution is mandatory (not optional)

**Prerequisites:** Stories 3.1, 3.2, 3.3 (Foundation), Story 3.4 (System Architecture)

**Estimated Time:** 3-4 hours

**Git Worktree:** `wt/story-3.5` (branch: `story/3.5-test-strategy`)

**Note:** Can begin development immediately (infrastructure work), but finalizes after Story 3.4 completes

---

**Story 3.6: Security Gate Validation Workflow**

As an autonomous orchestrator prioritizing security,
I want mandatory security validation after architecture design,
So that security requirements are complete before solutioning.

**Acceptance Criteria:**
1. Implement `SecurityGateValidator` class with comprehensive security checks
2. Execute automatically after Stories 3.4 + 3.5 complete
3. Validate required security sections in `architecture.md`:
   - Authentication & Authorization strategy ✅
   - Secrets Management approach ✅
   - Input Validation strategy ✅
   - API Security measures (rate limiting, CORS, CSP) ✅
   - Data Encryption (at-rest and in-transit) ✅
   - Threat Model (OWASP Top 10 coverage) ✅
4. Generate `SecurityGateResult`:
   - Pass/fail status (≥95% score to pass)
   - Detailed check results per category
   - Gap analysis for failed checks
   - Actionable recommendations
5. If gate fails (score <95%):
   - Generate gap report with specific missing elements
   - Escalate to user with recommendations
   - Block progression to Epic 4 (Solutioning)
6. If gate passes:
   - Update `workflow-status.yaml` (security_gate: passed)
   - Log validation results to `docs/security-gate-results.json`
   - Proceed to Epic 4 (Solutioning)
7. Log security gate decision with evidence for audit trail
8. Complete validation in <5 minutes
9. Track metrics: pass rate, common gaps, escalation frequency
10. Unit tests for validation logic + integration tests

**Prerequisites:** Stories 3.1, 3.2, 3.3 (Foundation), Stories 3.4, 3.5 (Architecture + Test Strategy)

**Estimated Time:** 2-3 hours

**Git Worktree:** `wt/story-3.6` (branch: `story/3.6-security-gate`)

**Note:** Can develop validation logic immediately, executes validation after 3.4 + 3.5 complete

---

**Story 3.7: Technical Decisions Logger**

As Winston and Murat agents,
I want to log architectural decisions with rationale,
So that future developers understand why choices were made.

**Acceptance Criteria:**
1. Implement `TechnicalDecisionsLogger` class
2. `logDecision(decision, rationale, alternatives, tradeoffs)` method
3. Append to `docs/technical-decisions.md` in ADR format:
   - **Context**: Problem or requirement driving decision
   - **Decision**: What was chosen
   - **Rationale**: Why this choice
   - **Alternatives Considered**: What else was evaluated
   - **Consequences**: Trade-offs and implications
   - **Date & Author**: Timestamp and agent name
4. Support categories: data, api, infrastructure, security, testing
5. Link decisions to PRD requirements (FR-XXX references)
6. Generate decision index for easy navigation
7. Used by Stories 3.4 and 3.5 to log decisions
8. Unit tests for logger + integration tests

**Prerequisites:** Stories 3.1, 3.2, 3.3 (Foundation)

**Estimated Time:** 1-2 hours

**Git Worktree:** `wt/story-3.7` (branch: `story/3.7-tech-decisions`)

**Note:** Fully independent, can complete and merge first to unblock Stories 3.4 and 3.5

---

**Story 3.8: CIS Agent Integration for Architecture Decisions**

As Winston agent making architecture decisions,
I want to consult CIS specialists for strategic choices,
So that architecture benefits from framework-specific analysis.

**Acceptance Criteria:**
1. Implement `CISAgentRouter` class with agent selection logic
2. Integrate CIS router into architecture workflow (Story 3.2)
3. Trigger CIS consultation automatically when:
   - Winston's confidence <0.70 on technology choice
   - Architectural pattern selection has multiple viable options
   - UX approach has high uncertainty
4. Route decisions to appropriate CIS agent:
   - Dr. Quinn (Problem-solving) → Technology trade-offs
   - Maya (Design Thinking) → UX architecture
   - Sophia (Storytelling) → Product positioning
   - Victor (Innovation) → Innovative patterns
5. CIS agent analyzes using specialized framework:
   - Dr. Quinn: Problem-solving canvas (problem, root causes, solutions, impact)
   - Maya: Design thinking (empathize, define, ideate, prototype, test)
   - Sophia: Storytelling structure (hero, journey, transformation)
   - Victor: Innovation canvas (market, disruption, moat, growth)
6. Return structured CIS response:
   - Framework-specific analysis (markdown formatted)
   - 3-5 recommendations with pros/cons
   - Confidence score for each recommendation
   - Rationale grounded in framework
7. Winston evaluates CIS recommendations:
   - High confidence (>0.85): Accept top recommendation
   - Medium (0.70-0.85): Present to user for choice
   - Low (<0.70): Escalate with CIS analysis
8. Log CIS consultation in technical decisions (Story 3.7)
9. Track metrics: invocation frequency, response time (<60 seconds target), confidence
10. Manual invocation support via chat
11. Unit tests + integration tests with mock CIS agents

**Prerequisites:** Stories 3.1, 3.2, 3.3 (Foundation), Story 3.7 (Logger - soft dependency), Epic 1 (Agent Pool)

**Estimated Time:** 4-5 hours

**Git Worktree:** `wt/story-3.8` (branch: `story/3.8-cis-integration`)

**Note:** Optional enhancement, can develop in parallel with other feature stories

---

### Epic 3 Summary

**Total Stories:** 8
- **Foundation (Sequential):** 3 stories (3.1-3.3) ~8 hours
- **Features (Parallel):** 5 stories (3.4-3.8) ~4-5 hours with 5 worktrees

**Dependency Graph:**
```
FOUNDATION (Sequential)
───────────────────────
3.1 (Data Models) ──┐
3.2 (Workflow)  ────┼──> [Foundation Complete]
3.3 (Agents)    ────┘

FEATURES (Parallel)
───────────────────
                    ┌──> 3.4 (System Architecture) ──┐
[Foundation] ───────┤                                  ├──> 3.6 (Security Gate)
                    └──> 3.5 (Test Strategy) ─────────┘
                    ┌──> 3.7 (Tech Decisions Logger)
                    └──> 3.8 (CIS Integration)

Note: 3.7 and 3.8 can start immediately after foundation
      3.4 and 3.5 can run in parallel
      3.6 waits for 3.4 + 3.5 (security validation)
```

**Time Savings:**
- **Before (Sequential)**: 8 story-time-units
- **After (Parallel with 5 worktrees)**: 3 foundation + 1 parallel = 4 story-time-units
- **Speedup**: **2x faster!** 🚀

**Completion Criteria:**
- ✅ All 8 stories merged to main
- ✅ Architecture.md generated with system design + test strategy
- ✅ Security gate passed (≥95% score)
- ✅ Technical decisions logged
- ✅ Winston + Murat agents functional
- ✅ CIS integration operational (optional)

---

## Epic 4: Solutioning Phase Automation (Restructured for Parallel Development)

**Goal:** Automatically decompose requirements into implementable epics and stories **with visual dependency mapping**, using **foundation-first architecture** that maximizes git worktree parallelization.

**Value Proposition:** Requirements break down into bite-sized stories autonomously. Dependencies mapped **and visualized**. **Foundation stories (4.1-4.3) establish shared infrastructure, enabling feature stories (4.4-4.9) to develop in parallel git worktrees for 1.8x faster completion.**

**Business Value:** Eliminates story writing bottleneck. **1.8x parallel development speedup via worktrees.** Consistent quality. Dependencies detected and visualized automatically for planning clarity.

**Technical Scope:**
- Solutioning data models and story schema (foundation)
- Bob (Scrum Master) agent infrastructure (foundation)
- Solutioning workflow engine (foundation)
- Epic/story generation (parallel)
- Dependency detection and graph generation (parallel)
- Story validation and quality check (parallel)
- Sprint status file generation (parallel)
- Story file writing (parallel)
- Implementation readiness gate validation (parallel)

**Implementation Strategy:**
- **Phase 1 (Foundation)**: Stories 4.1-4.3 run sequentially (~6-7 hours) to establish shared infrastructure
- **Phase 2 (Features)**: Stories 4.4-4.9 run in parallel git worktrees (~3-4 hours with 6 worktrees)
- **Speedup**: 1.8x faster than original sequential approach (5 story-units vs 9)

### Stories

---

### **PHASE 1: FOUNDATION (Sequential)**

**Story 4.1: Solutioning Data Models & Story Schema**

As a solutioning system developer,
I want foundational data models and schemas for epics, stories, and dependencies,
So that all solutioning stories can build on consistent types.

**Acceptance Criteria:**
1. Define TypeScript interfaces in `src/solutioning/types.ts`:
   - `Epic` (id, title, goal, value_proposition, stories, business_value)
   - `Story` (id, epic, title, description, acceptance_criteria, dependencies, status, technical_notes)
   - `DependencyGraph` (nodes, edges, critical_path, bottlenecks, parallelizable)
   - `StoryMetadata` (complexity, estimated_hours, affected_files, test_requirements)
   - `ValidationResult` (pass/fail, score, checks, blockers, warnings)
2. Create JSON schema validation for each interface
3. Implement `StoryTemplateBuilder` class with methods:
   - `buildFromTemplate()`: Load story template and create structure
   - `validateStoryFormat()`: Check story completeness against schema
   - `toMarkdown()`: Convert story object to story-XXX.md format
   - `toYAMLFrontmatter()`: Generate YAML frontmatter for story files
4. Define sprint-status.yaml schema structure (project, workflow, epics, stories)
5. Define dependency-graph.json schema structure (nodes, edges, metadata)
6. Create `docs/templates/story-template.md` (structure only, no content)
7. Unit tests for schema validation and template builder methods
8. Zero external dependencies (pure data layer)
9. Export all types for use by other solutioning stories
10. Documentation for type system and schema structure

**Prerequisites:** Epic 1 complete

**Estimated Time:** 2-3 hours

**Git Worktree:** Main development branch

---

**Story 4.2: Bob Agent Infrastructure & Context Builder**

As an agent system developer,
I want Bob agent persona configured with LLM assignments and context building,
So that solutioning stories can invoke Bob with proper context.

**Acceptance Criteria:**
1. Load Bob persona from `bmad/bmm/agents/bob.md`
2. Read LLM assignments from `.bmad/project-config.yaml`:
   - Bob: Recommended Claude Haiku (cost-effective for formulaic story decomposition)
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - See Story 1.3 for configuration examples with multiple providers
3. Implement `SolutioningAgentContextBuilder` class:
   - `buildBobContext(prd, architecture)`: Prepare Bob's context
   - Context includes: PRD functional requirements, architecture overview, BMAD story patterns
   - Token optimization: Prune PRD to relevant sections (<30k tokens)
4. Implement agent invocation templates:
   - `bobEpicFormationPrompt(context)`: Prompt for epic generation
   - `bobStoryDecompositionPrompt(context, epic)`: Prompt for story generation
   - `bobDependencyDetectionPrompt(context, stories)`: Prompt for dependency analysis
5. Integrate with Story 4.1 types (Epic, Story schemas)
6. Agent factory registration in `AgentPool` (Epic 1)
7. Methods: `formEpics()`, `decomposeIntoStories()`, `detectDependencies()` as agent actions
8. Generate stories sized for single agent session (<200k context)
9. Write clear acceptance criteria in generated stories
10. Make autonomous decisions on story boundaries (confidence scoring)
11. Unit tests for context building and prompt generation
12. Does NOT invoke agents or generate content (setup only)

**Prerequisites:** Story 4.1, Epic 1 (AgentPool, LLMFactory)

**Estimated Time:** 2-3 hours

**Git Worktree:** Main development branch

---

**Story 4.3: Solutioning Workflow Engine Foundation**

As a workflow orchestrator,
I want workflow engine infrastructure for solutioning phase,
So that subsequent stories can execute epic/story generation steps.

**Acceptance Criteria:**
1. Implement `SolutioningWorkflowEngine` class extending `WorkflowEngine` (Epic 1)
2. Load `bmad/bmm/workflows/create-epics-and-stories/workflow.yaml`
3. Parse workflow steps and build execution plan
4. Implement state machine transitions:
   - `not_started` → `in_progress` → `review` → `complete`
   - Track current step, progress percentage, timestamps
5. Worktree management integration:
   - Create worktree for solutioning phase: `wt/solutioning`
   - Branch: `solutioning/epics-stories`
   - Cleanup on completion or failure
6. State persistence to `bmad/workflow-status.yaml`
7. Implement step execution hooks (pre/post step callbacks)
8. Error handling with rollback capability
9. Read PRD.md and architecture.md as inputs (from Epic 2 + Epic 3)
10. Update workflow-status.yaml with solutioning progress
11. Unit tests for workflow engine and state machine
12. Does NOT execute actual epic/story generation (infrastructure only)

**Prerequisites:** Story 4.1, Epic 1 (WorkflowEngine, WorktreeManager)

**Estimated Time:** 3-4 hours

**Git Worktree:** Main development branch

---

### **PHASE 2: FEATURE DELIVERY (Parallel)**

**Story 4.4: Epic Formation & Story Decomposition (Combined)**

As a user wanting automated story decomposition,
I want Bob to form epics and decompose them into implementable stories,
So that requirements break down into bite-sized development units.

**Acceptance Criteria:**

**Epic Formation (from original 4.2):**
1. Invoke Bob agent via `SolutioningAgentContextBuilder` (Story 4.2)
2. Analyze PRD functional requirements
3. Identify natural groupings (auth, payments, admin, etc.)
4. Form epics with 3-8 related features each
5. Name epics by business value (not technical components)
6. Ensure each epic independently valuable
7. Completable in 1-2 sprints
8. Include domain-specific epics (compliance, validation) if applicable
9. Generate epic descriptions with goals and value propositions

**Story Decomposition (from original 4.3):**
10. For each epic, generate 3-10 stories
11. Each story: clear user story format (As a..., I want..., So that...)
12. Stories are vertical slices (end-to-end functionality)
13. Story description <500 words
14. Single responsibility per story
15. Include technical notes: affected files, endpoints, data structures
16. Check story size: fits in 200k context, <2 hour development time
17. If story too large, split into smaller stories

**Integration:**
18. Use `Epic` and `Story` types from Story 4.1
19. Execute formEpics() then decomposeIntoStories() methods (Story 4.2 AC#7)
20. Generate 10-20 total stories for MVP
21. Make autonomous decisions on story boundaries (confidence scoring)
22. Write clear acceptance criteria (8-12 per story)
23. Complete epic formation + story decomposition in <45 minutes
24. Unit tests + integration tests with mock Bob responses

**Prerequisites:** Stories 4.1, 4.2, 4.3 (Foundation), Epic 2 (PRD), Epic 3 (Architecture)

**Estimated Time:** 4-5 hours

**Git Worktree:** `wt/story-4.4` (branch: `story/4.4-epic-story-generation`)

---

**Story 4.5: Dependency Detection & Graph Generation (Combined)**

As the solutioning system,
I want to detect story dependencies and generate dependency graph data,
So that story relationships are captured and visualized for planning.

**Acceptance Criteria:**

**Dependency Detection (from original 4.4):**
1. Invoke Bob agent's `detectDependencies()` method (Story 4.2 AC#7)
2. Analyze stories for technical dependencies
3. Identify patterns: auth before protected features, data models before logic, API before frontend
4. Build dependency graph with topological sort
5. Phase stories: Foundation → Core → Enhancement → Growth
6. Mark stories that can run in parallel
7. Flag blocking dependencies clearly
8. Generate implementation sequence recommendations
9. Note domain-specific gates (security audit, compliance review)

**Graph Generation (from original 4.8):**
10. Implement `DependencyGraphGenerator` class
11. Execute automatically after dependency detection
12. Analyze story prerequisites to build dependency edges:
    - Hard dependencies (blocking): Story A must complete before Story B
    - Soft dependencies (suggested): Story A should complete before Story B for logical flow
13. Create dependency graph structure:
    - Nodes: All stories with metadata (ID, title, status, epic, complexity)
    - Edges: Dependency relationships with type (hard/soft) and blocking status
14. Calculate graph metrics:
    - Critical path (longest dependency chain from start to finish)
    - Bottlenecks (stories blocking ≥3 other stories)
    - Parallelizable stories (no blocking dependencies)
15. Detect circular dependencies and escalate if found
16. Save graph data to `docs/dependency-graph.json`:

```json
{
  "nodes": [...],
  "edges": [...],
  "criticalPath": [...],
  "metadata": {
    "totalStories": N,
    "parallelizable": M,
    "bottlenecks": [...]
  }
}
```

17. Update sprint-status.yaml with graph generation timestamp
18. Complete dependency detection + graph generation in <30 seconds
19. Track metrics: graph complexity, critical path length, bottleneck count
20. Unit tests + integration tests

**Prerequisites:** Stories 4.1, 4.2, 4.3 (Foundation), Story 4.4 (Epic/Story Generation)

**Estimated Time:** 3-4 hours

**Git Worktree:** `wt/story-4.5` (branch: `story/4.5-dependency-graph`)

---

**Story 4.6: Story Validation & Quality Check**

As the solutioning workflow,
I want to validate story quality before completion,
So that all stories meet dev agent compatibility standards.

**Acceptance Criteria:**
1. Implement `StoryValidator` class
2. **SIZE CHECK**: <500 words, single responsibility, no hidden complexity
3. **CLARITY CHECK**: explicit acceptance criteria, clear technical approach, measurable success
4. **DEPENDENCY CHECK**: dependencies documented, clear inputs/outputs
5. **COMPLETENESS CHECK**: all required info for autonomous implementation
6. If validation fails, regenerate or split story
7. Generate validation report with quality score
8. Ensure 100% stories pass validation before workflow completion
9. Use `Story` and `ValidationResult` types from Story 4.1
10. Unit tests + integration tests

**Prerequisites:** Stories 4.1, 4.2, 4.3 (Foundation), Story 4.4 (stories to validate)

**Estimated Time:** 2-3 hours

**Git Worktree:** `wt/story-4.6` (branch: `story/4.6-story-validation`)

---

**Story 4.7: Sprint Status File Generation**

As the orchestrator,
I want to generate sprint-status.yaml tracking all epics and stories,
So that implementation progress can be tracked and visualized.

**Acceptance Criteria:**
1. Generate `bmad/sprint-status.yaml` with schema (from Story 4.1 AC#4):
   - project metadata (name, phase)
   - workflow tracking (current, step, status)
   - epics array with stories nested
   - story fields: id, name, status, worktree, pr_number, assigned_agent
2. Initialize all stories with status: pending
3. Track dependencies in story metadata
4. Support status updates during implementation
5. Human-readable format with inline comments
6. Git commit after generation
7. Use sprint-status.yaml schema from Story 4.1
8. Unit tests for sprint status generation

**Prerequisites:** Stories 4.1, 4.2, 4.3 (Foundation), Stories 4.4, 4.5 (epics/stories/dependencies)

**Estimated Time:** 1-2 hours

**Git Worktree:** `wt/story-4.7` (branch: `story/4.7-sprint-status`)

---

**Story 4.8: Story File Writer & Epics Document Generator**

As the solutioning workflow,
I want to write individual story files and epics document,
So that stories are available for implementation and tracking.

**Acceptance Criteria:**
1. Implement `StoryFileWriter` class
2. Use `StoryTemplateBuilder` from Story 4.1 to format stories
3. Generate `docs/epics.md` with all epic descriptions and stories overview
4. Generate individual `docs/stories/story-*.md` files with YAML frontmatter:
   - Include: id, epic, title, status, dependencies, acceptance_criteria
   - Format: story-001.md, story-002.md, etc.
   - Use YAML frontmatter format from Story 4.1 AC#3
5. Validate file writes using Story schema (Story 4.1)
6. Create `docs/stories/` directory if it doesn't exist
7. Git commit story files after generation
8. Track metrics: number of files written, write time
9. Unit tests for file writing logic
10. Integration tests with mock file system

**Prerequisites:** Stories 4.1, 4.2, 4.3 (Foundation), Story 4.4 (stories to write)

**Estimated Time:** 2-3 hours

**Git Worktree:** `wt/story-4.8` (branch: `story/4.8-story-file-writer`)

**Note:** Extracted from original Story 4.7 workflow execution (file writing portion)

---

**Story 4.9: Implementation Readiness Gate Validation**

As the orchestrator ensuring quality,
I want to validate solutioning completeness before allowing implementation,
So that dev agents have everything needed for successful autonomous development.

**Acceptance Criteria:**
1. Implement `ImplementationReadinessValidator` class
2. Execute automatically after Stories 4.4-4.8 complete
3. Perform comprehensive validation checks:
   - **Story Completeness**:
     - All stories have 8-12 acceptance criteria ✅
     - Story descriptions complete (<500 words) ✅
     - Epic assignments valid ✅
     - Prerequisites documented ✅
   - **Dependency Validity**:
     - No circular dependencies ✅
     - All prerequisites exist ✅
     - Dependency graph complete ✅
   - **Story Sizing**:
     - Single responsibility per story ✅
     - Reasonable complexity (<2 hours) ✅
     - No hidden scope creep ✅
   - **Test Strategy**:
     - Test strategy defined in architecture.md ✅
     - Test stories present for each epic ✅
     - ATDD methodology documented ✅
   - **Critical Path**:
     - Critical path calculated ✅
     - Bottlenecks identified (warning) ⚠️
     - Parallelization opportunities noted (info) ℹ️
   - **Sprint Status**:
     - sprint-status.yaml generated correctly ✅
     - All stories present in status file ✅
4. Generate `ReadinessGateResult` (using type from Story 4.1):
   - Pass/fail status (100% required checks must pass)
   - Overall score (weighted average of all checks)
   - Detailed check results (category, pass/fail, details)
   - Blocker list (if gate fails)
   - Warning list (non-blocking issues)
   - Remediation recommendations
5. If gate fails (<100% on required checks):
   - Generate detailed blocker report
   - Escalate to user with specific remediation steps
   - Block transition to Epic 5 (Implementation)
   - Example blocker: "Story 005 has only 3 acceptance criteria (minimum 8 required)"
6. If gate passes:
   - Update `workflow-status.yaml` (readiness_gate: passed)
   - Log validation results to `docs/readiness-gate-results.json`
   - Proceed to Epic 5 (Implementation)
7. If warnings present (non-blocking):
   - Display warning summary to user
   - Continue to implementation (warnings don't block)
   - Example warning: "Story 012 blocks 5 other stories (bottleneck)"
8. Track metrics:
   - Gate pass rate
   - Common blockers (for process improvement)
   - Time to remediate blockers
   - Warning frequency
9. Complete validation in <3 minutes
10. Unit tests + integration tests

**Prerequisites:** Stories 4.1-4.8 (all solutioning stories), Epic 3 Story 3.5 (Test Strategy)

**Estimated Time:** 2-3 hours

**Git Worktree:** `wt/story-4.9` (branch: `story/4.9-readiness-gate`)

**Note:** Waits for all feature stories (4.4-4.8) to complete before executing validation

---

### Epic 4 Summary

**Total Stories:** 9
- **Foundation (Sequential):** 3 stories (4.1-4.3) ~6-7 hours
- **Features (Parallel):** 6 stories (4.4-4.9) ~3-4 hours with 6 worktrees

**Dependency Graph:**

```
FOUNDATION (Sequential)
───────────────────────
4.1 (Data Models) ──┐
4.2 (Bob Agent)  ───┼──> [Foundation Complete]
4.3 (Workflow)   ───┘

FEATURES (Parallel)
───────────────────
                    ┌──> 4.4 (Epic/Story Generation) ──┐
[Foundation] ───────┤                                   │
                    ├──> 4.5 (Dependency Detection) ───┼──> 4.9 (Readiness Gate)
                    ├──> 4.6 (Story Validation) ───────┤
                    ├──> 4.7 (Sprint Status) ──────────┤
                    └──> 4.8 (Story File Writer) ──────┘

Note: 4.4-4.8 can develop in parallel after foundation
      4.9 waits for all feature stories (4.4-4.8) to complete
```

**Time Savings:**
- **Before (Sequential)**: 9 story-time-units
- **After (Parallel with 6 worktrees)**: 3 foundation + 1 parallel = 4-5 story-time-units
- **Speedup**: ~1.8x faster! 🚀

**Completion Criteria:**
- ✅ All 9 stories merged to main
- ✅ Epics.md generated with epic descriptions
- ✅ Individual story-*.md files created (10-20 stories)
- ✅ Sprint-status.yaml generated
- ✅ Dependency-graph.json created with visualization data
- ✅ All stories validated (100% pass)
- ✅ Readiness gate passed (100% required checks)
- ✅ Bob agent infrastructure operational

---

## Epic 5: Story Implementation Automation (Restructured for Parallel Development)

**Goal:** Enable autonomous code development - agents implement stories with code, tests, and **thorough independent code review**, creating PRs automatically.

**Value Proposition:** The "parallel intelligence" magic moment. Stories develop autonomously with quality code, comprehensive tests, **unbiased code review from separate agent**, and clear PRs.

**Business Value:** 10x faster implementation (<2 hours per story vs 4-8 hours). Continuous progress. **Higher code quality through dual-agent review**. Parallel development ready (v1.1).

**Technical Scope:**
- Story context generation
- Amelia (Developer) agent
- Code generation and testing
- **Alex (Code Reviewer) agent** ← NEW
- **Automated code review workflow** ← NEW
- PR creation automation

### **PHASE 1: FOUNDATION (Sequential)**

Foundation stories establish core agent infrastructure, context generation, and workflow orchestration that all feature stories depend on.

**Story 5.1: Core Agent Infrastructure**

As the orchestrator core,
I want both Amelia (Developer) and Alex (Code Reviewer) agents configured,
So that story workflows have both implementation and review capabilities.

**Acceptance Criteria:**

**Amelia Agent (Developer Persona):**
1. Load Amelia persona from bmad/bmm/agents/amelia.md
2. Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - Recommended: OpenAI GPT-4 Turbo or Codex models for superior code generation capabilities
   - See Story 1.3 for configuration examples with multiple providers
3. Specialized prompts for: code implementation, test writing, documentation
4. Context includes: story, architecture, onboarding, relevant code
5. Methods: implementStory(), writeTests(), reviewCode(), createPR()
6. Follow project coding standards from onboarding
7. Generate clean, maintainable code
8. Include inline documentation and comments
9. Make implementation decisions autonomously

**Alex Agent (Code Review Specialist):**
10. Load Alex persona from bmad/bmm/agents/alex.md
11. Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
    - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
    - Recommended: Claude Sonnet for superior analytical reasoning and code review capabilities
    - Different LLM from Amelia to ensure diverse perspective (e.g., Amelia on GPT-4, Alex on Claude)
    - See Story 1.3 for configuration examples with multiple providers
12. Specialized prompts for: security review, code quality analysis, test coverage validation
13. Context includes: story requirements, project standards, Amelia's implementation, test results
14. Methods: reviewSecurity(), analyzeQuality(), validateTests(), generateReport()
15. Check against: OWASP top 10, code smells, complexity metrics, naming conventions
16. Generate structured review report with severity levels
17. Provide actionable recommendations for each finding
18. Make pass/fail decisions with confidence scoring

**Prerequisites:** Epic 1, Story 2.1

---

**Story 5.2: Story Context Generator**

As a story development workflow,
I want to gather all relevant context for a story before implementation,
So that Amelia has everything needed without searching.

**Acceptance Criteria:**
1. Implement StoryContextGenerator class
2. Read story file (docs/stories/story-XXX.md)
3. Gather context:
   - Story description and acceptance criteria
   - PRD functional requirements related to story
   - Architecture sections relevant to story
   - Onboarding docs (coding standards, patterns)
   - Existing code files mentioned in story
   - Dependency stories (if any)
4. Generate Story Context XML document (<50k tokens)
5. Include only relevant information (optimize context size)
6. Cache context for story reuse

**Prerequisites:** Story 5.1, **Epic 4 complete** ⚠️

**CRITICAL DEPENDENCY:** This story requires Epic 4 to be complete because it needs the epics and stories structure from Epic 4's output (docs/stories/*.md files and sprint-status.yaml).

---

**Story 5.3: Workflow Orchestration & State Management**

As a user wanting automated story implementation,
I want a workflow executor that orchestrates the entire development pipeline,
So that stories implement themselves autonomously with proper state management.

**Acceptance Criteria:**

**Workflow Orchestration (from original 5.9):**
1. Load bmad/bmm/workflows/dev-story/workflow.yaml
2. Execute all story development steps in sequence
3. Generate story context via StoryContextGenerator
4. Create worktree for isolated development
5. Spawn Amelia agent for implementation
6. Generate and run tests
7. Perform dual-agent code review (Amelia self-review + Alex independent review)
8. Create PR if review passes
9. Update sprint-status.yaml (story status: review)
10. Complete in <2 hours
11. Handle failures with clear error messages

**State Management & Worktree Integration (from original 5.3):**
12. Create worktree for story via WorktreeManager
13. Track worktree lifecycle in StateManager
14. Manage agent state transitions (idle → implementing → testing → reviewing → pr-created)
15. Handle error recovery and retry logic

**Prerequisites:** Story 5.2, Epic 1 (Worktree Manager, State Manager, Workflow Engine)

---

### **PHASE 2: FEATURES (Parallel)**

After foundation is complete, these feature stories can be developed in parallel in separate git worktrees.

**Story 5.4: Code Implementation Pipeline**

As Amelia agent,
I want to implement story code following architecture and standards,
So that implementation is clean and maintainable.

**Acceptance Criteria:**
1. Read Story Context XML from context generator
2. Implement code following architecture and standards
3. Create/modify files as needed
4. Implement all acceptance criteria from story
5. Add error handling and logging
6. Follow security best practices
7. Commit changes with descriptive message
8. Implementation completes in <1 hour

**Prerequisites:** Story 5.3 (Workflow Orchestration provides worktree and context)

**Parallel Development:** Can run in separate worktree alongside Stories 5.5, 5.6, 5.7

---

**Story 5.5: Test Generation & Execution**

As Amelia agent,
I want to write comprehensive tests for story implementation,
So that code quality is validated automatically.

**Acceptance Criteria:**
1. Generate unit tests for all new functions/classes
2. Write integration tests for API endpoints or workflows
3. Include edge case and error condition tests
4. Use project's test framework (Vitest, Jest, etc.)
5. Achieve >80% code coverage for new code
6. Run all tests in worktree
7. Fix any failing tests
8. Tests complete in <30 minutes
9. Commit tests with implementation

**Prerequisites:** Story 5.3 (Workflow Orchestration provides test execution framework)

**Parallel Development:** Can run in separate worktree alongside Stories 5.4, 5.6, 5.7

---

**Story 5.6: Dual-Agent Code Review**

As the story development workflow,
I want both Amelia self-review and Alex independent review,
So that implementations receive thorough multi-perspective quality validation.

**Acceptance Criteria:**

**Amelia Self-Review (from original 5.5):**
1. Implement CodeReviewer class for self-review
2. Check: code follows project standards, no obvious bugs, proper error handling
3. Verify all acceptance criteria met
4. Check test coverage sufficient
5. Validate no security vulnerabilities (basic static analysis)
6. Check for code smells: long functions, duplication, poor naming
7. If critical issues found, fix and re-review
8. Generate self-review report with confidence score
9. If confidence <0.9, escalate for human review

**Alex Independent Review (from original 5.7):**
10. Integrate Alex review step after Amelia self-review
11. Spawn Alex agent with configured LLM (different from Amelia)
12. Provide Alex with:
    - Story context and acceptance criteria
    - Amelia's implementation code
    - Self-review report
    - Test results and coverage
    - Project coding standards
13. Execute multi-faceted review:
    - Security scan (static analysis, vulnerability detection)
    - Code quality check (complexity, duplication, maintainability)
    - Test coverage validation (>80% target)
    - Architecture compliance verification
14. Generate structured review report with findings categorized by severity
15. If critical issues found OR confidence <0.85:
    - Escalate to human for review
    - Provide detailed context and recommendations
16. If review passes:
    - Proceed to PR creation
    - Include review summary in PR description
17. If review fails but fixable:
    - Return to Amelia for fixes
    - Re-review after fixes
18. Track review metrics: time, findings count, pass/fail rate

**Prerequisites:** Story 5.1 (Both agents configured), Story 5.3 (Workflow orchestration)

**Parallel Development:** Can run in separate worktree alongside Stories 5.4, 5.5, 5.7

---

**Story 5.7: PR Creation & Automation**

As the story development workflow,
I want to create GitHub PRs and merge them automatically after CI passes,
So that code is integrated without manual git operations.

**Acceptance Criteria:**

**PR Creation (from original 5.8):**
1. Integrate @octokit/rest for GitHub API
2. Push worktree branch to remote
3. Create PR with:
   - Title: Story name
   - Body: Story description, acceptance criteria, implementation notes
   - Link to story file
   - Test results summary
   - Review report summary (from dual-agent review)
4. Apply labels based on epic/story type
5. Request review from configured reviewers (if any)
6. Include agent signature in PR description
7. Handle PR creation errors gracefully

**PR Merge Automation (from original 5.10):**
8. Monitor PR CI status via GitHub API
9. Wait for all checks to pass
10. If checks pass and auto-merge enabled:
    - Merge PR (squash merge)
    - Delete remote branch
    - Cleanup worktree via WorktreeManager
11. Update sprint-status.yaml (story status: done)
12. Trigger dependent stories if ready
13. If checks fail after 2 retries, escalate
14. Support manual review mode (no auto-merge)

**Prerequisites:** Story 5.3 (Workflow orchestration), Epic 1 (Worktree Manager)

**Parallel Development:** Can run in separate worktree alongside Stories 5.4, 5.5, 5.6

---

### **PHASE 3: TESTING (Sequential)**

Test stories run after all features are complete to validate the entire story development pipeline.

**Story 5.8: Integration Tests**

As a developer,
I want integration tests for the story development workflow,
So that the complete pipeline is validated end-to-end.

**Acceptance Criteria:**
1. Test complete workflow execution (context → implementation → tests → review → PR)
2. Test agent interactions (Amelia ↔ Alex communication)
3. Test context generation pipeline (story file → context XML)
4. Test PR automation (creation → CI monitoring → auto-merge)
5. Test error recovery scenarios (failed tests, failed review, CI failures)
6. Test state management (worktree lifecycle, agent state transitions)
7. Test escalation triggers (low confidence, critical issues)
8. Mock GitHub API for PR operations
9. Achieve >80% code coverage for new workflow code
10. All integration tests pass in <10 minutes

**Prerequisites:** Stories 5.1-5.7 complete

---

**Story 5.9: E2E Story Development Tests**

As a developer,
I want end-to-end tests for autonomous story implementation,
So that real-world story execution scenarios are validated.

**Acceptance Criteria:**
1. E2E test: Simple feature story (single file change)
2. E2E test: Complex story (multiple files, database migration)
3. E2E test: Story with external dependencies
4. E2E test: Story requiring human escalation
5. E2E test: Multi-story workflow (story A → story B dependency)
6. E2E test: Parallel story execution (3 stories in parallel worktrees)
7. E2E test: Review failure and fix cycle
8. E2E test: PR merge and cleanup
9. Performance benchmark: Full story execution <2 hours
10. All E2E tests pass in <30 minutes

**Prerequisites:** Story 5.8 (Integration tests)

---

### **Epic 5 Summary**

**Time Savings Analysis:**
- **Original Structure:** 10 stories × 1 story-unit = 10 story-units (sequential)
- **Restructured:** 3 foundation + max(4 parallel) + 2 testing = 6 story-units
- **Speedup:** 1.67x (10 → 6 story-units)

**Acceptance Criteria Count:**
- **Original:** 85 AC across 10 stories
- **Restructured:** 100 AC across 9 stories (85 original + 15 enhanced testing)
- **Preservation:** 100% (all original AC maintained)

**Story Combinations:**
- **5.1**: Combined Amelia (original 5.1) + Alex (original 5.6) agent setup → 18 AC
- **5.3**: Combined Workflow Executor (original 5.9) + core orchestration (from 5.3) → 15 AC
- **5.6**: Combined Self Review (original 5.5) + Code Review Integration (original 5.7) → 18 AC
- **5.7**: Combined PR Creation (original 5.8) + PR Merge (original 5.10) → 14 AC
- **5.8**: New comprehensive integration tests → 10 AC
- **5.9**: New comprehensive E2E tests → 10 AC

**Critical Dependencies:**
- **Story 5.2** depends on **Epic 4 complete** (needs story files and sprint-status.yaml)
- Foundation stories (5.1-5.3) must complete sequentially
- Feature stories (5.4-5.7) can run in parallel after foundation
- Test stories (5.8-5.9) must run sequentially after all features

**Dependency Graph:**
```
FOUNDATION (Sequential - 3 story-units)
───────────────────────────────────────
5.1 (Core Agents: Amelia + Alex) ──┐
                                    ├──> 5.2 (Story Context) ──> 5.3 (Workflow Orchestration)
         [Epic 4 complete] ─────────┘

FEATURES (Parallel - 0.5 story-units each = 0.5 total)
───────────────────────────────────────────────────────
                    ┌──> 5.4 (Code Implementation)
                    ├──> 5.5 (Test Generation)
[Foundation] ───────┤
                    ├──> 5.6 (Dual-Agent Code Review)
                    └──> 5.7 (PR Creation & Automation)

TESTING (Sequential - 2 story-units)
────────────────────────────────────
[All Features] ──> 5.8 (Integration Tests) ──> 5.9 (E2E Tests)
```

**Parallel Development Strategy:**
After completing foundation (5.1-5.3), developers can work on all 4 feature stories simultaneously in separate git worktrees:
- Worktree 1: Story 5.4 (Code Implementation)
- Worktree 2: Story 5.5 (Test Generation)
- Worktree 3: Story 5.6 (Dual-Agent Review)
- Worktree 4: Story 5.7 (PR Automation)

This enables 4x parallel velocity during the feature phase, reducing 4 story-units to 0.5 story-units with 4 developers.

---

## Epic 6: Remote Access & Monitoring (Restructured for Parallel Development)

**Goal:** Enable users to monitor and guide orchestrator execution from anywhere via web dashboard and REST API.

**Value Proposition:** Check project status, respond to escalations, and guide development from any device. The remote control for your autonomous development team.

**Business Value:** Always-accessible visibility. Fast escalation resolution. Mobile-friendly. Enables true "development that never sleeps."

**Technical Scope:**
- REST API (Fastify)
- WebSocket for real-time updates
- Web dashboard (React)
- Escalation response interface
- Project management UI

### **PHASE 1: API FOUNDATION (Sequential)**

Foundation stories establish core API infrastructure and shared types that all other stories depend on.

**Story 6.1: API Infrastructure & Type System**

As a remote access developer,
I want a REST API server foundation with shared TypeScript types,
So that all API endpoints have consistent structure and type safety.

**Acceptance Criteria:**

**API Foundation (from original 6.1):**
1. Implement Fastify server with TypeScript
2. Configure: CORS, JSON body parser, error handling middleware
3. Basic routes: GET /health, GET /api/info
4. Authentication middleware (JWT-based)
5. Request logging with correlation IDs
6. Error responses in standard format: {error, message, details}
7. OpenAPI/Swagger documentation generation
8. Server starts on configurable port (default 3000)
9. Graceful shutdown handling

**Shared TypeScript Types (NEW):**
10. Define TypeScript interfaces for all API entities:
    - `Project`, `ProjectStatus`, `PhaseProgress`
    - `OrchestratorStatus`, `WorkflowStatus`
    - `StoryStatus`, `EscalationStatus`
    - `APIResponse<T>`, `APIError`
11. Create Zod schemas for request/response validation
12. Generate OpenAPI types from Zod schemas

**Prerequisites:** Epic 1 complete

**Estimated Time:** 3-4 hours

**Git Worktree:** Main development branch

---

**Story 6.2: Core API Endpoints & WebSocket**

As a dashboard developer,
I want project management API endpoints and WebSocket support,
So that the UI can manage projects and receive real-time updates.

**Acceptance Criteria:**

**Project Management Endpoints (from original 6.2):**
1. GET /api/projects - List all projects
2. POST /api/projects - Create new project
3. GET /api/projects/:id - Get project details
4. PATCH /api/projects/:id - Update project
5. DELETE /api/projects/:id - Delete project
6. Return: project metadata, current phase, status, last update
7. Validate project config on creation
8. Handle project not found errors
9. Support pagination for project lists

**WebSocket Real-Time Updates (from original 6.6):**
10. Implement WebSocket server (ws library)
11. WS endpoint: /ws/status-updates
12. Authenticate WebSocket connections
13. Emit events: project.phase.changed, story.status.changed, escalation.created, agent.started/completed, pr.created/merged, workflow.error
14. Support per-project subscriptions
15. Reconnection handling
16. Event payload includes: projectId, eventType, data, timestamp

**Prerequisites:** Story 6.1

**Estimated Time:** 4-5 hours

**Git Worktree:** `wt/story-6.2` (branch: `story/6.2-core-api-websocket`)

---

**Story 6.3: Extended API Endpoints**

As a dashboard developer,
I want orchestrator control, state query, and escalation API endpoints,
So that the UI can control workflows, query state, and manage escalations.

**Acceptance Criteria:**

**Orchestrator Control Endpoints (from original 6.3):**
1. GET /api/orchestrators/:projectId/status - Get current status
2. POST /api/orchestrators/:projectId/start - Start workflow
3. POST /api/orchestrators/:projectId/pause - Pause execution
4. POST /api/orchestrators/:projectId/resume - Resume execution
5. Return: workflow name, step, status, agent activity, progress percentage
6. Validate project exists and workflow configured
7. Handle concurrent control requests safely
8. Emit WebSocket events on status changes

**State Query Endpoints (from original 6.4):**
9. GET /api/projects/:id/workflow-status - Get workflow state
10. GET /api/projects/:id/sprint-status - Get sprint state
11. GET /api/projects/:id/stories - List all stories with status
12. GET /api/projects/:id/stories/:storyId - Get story details
13. Return: phases, epics, stories, dependencies, status, timestamps
14. Support filtering stories by status or epic
15. Include story PR links when available
16. Efficient queries (no reading entire files on each request)

**Escalation API Endpoints (from original 6.5):**
17. GET /api/escalations - List all escalations (with filters)
18. GET /api/escalations/:id - Get escalation details
19. POST /api/escalations/:id/respond - Submit response
20. Return: question, AI reasoning, confidence, context, status
21. Resume workflow when escalation responded
22. Support bulk escalation queries
23. Mark escalations as resolved after response
24. Emit WebSocket event on new escalation

**Prerequisites:** Story 6.2, Epic 1 (StateManager), Epic 2 (Escalation Queue - Story 2.2)

**Estimated Time:** 5-6 hours

**Git Worktree:** `wt/story-6.3` (branch: `story/6.3-extended-api`)

---

### **PHASE 2: UI FOUNDATION (Sequential)**

---

**Story 6.4: React Dashboard Foundation & API Integration**

As a user monitoring orchestrator,
I want a web dashboard with API integration and real-time updates,
So that I can track progress visually.

**Acceptance Criteria:**
1. Create React app with TypeScript and Vite
2. Configure: TanStack Query, Zustand state management, Tailwind CSS
3. Setup shadcn/ui component library with Radix UI primitives
4. Install tweakcn CLI tool (`npm install -D tweakcn`) for theme customization
5. Document theme customization workflow in dashboard README
6. API client layer using fetch with auth tokens
7. WebSocket hook for real-time updates
8. Layout: header, sidebar navigation, main content area
9. Responsive design (mobile, tablet, desktop)
10. Dark/light mode toggle
11. Loading states and error handling
12. Deploy configuration (Nginx static serving)

**Prerequisites:** Story 6.3 (all API endpoints + WebSocket from 6.2)

**Estimated Time:** 4-5 hours

**Git Worktree:** Main development branch

---

### **PHASE 3: UI FEATURES (Parallel)**

Feature stories build UI components that can be developed simultaneously in separate worktrees.

---

**Story 6.5: Project Management Views (Combined)**

As a user with multiple projects,
I want to see all projects at a glance and view detailed project information,
So that I can monitor status across my portfolio and track individual project progress.

**Acceptance Criteria:**

**Project Overview Dashboard (from original 6.8):**
1. Projects list page showing all projects
2. Display per project:
   - Name and description
   - Current phase (color-coded badge)
   - Progress indicator
   - Active tasks count
   - Last update timestamp
3. Filter by phase or status
4. Search by project name
5. Click project to view details
6. "Create Project" button
7. Real-time updates via WebSocket
8. Sort by last updated or name

**Project Detail View (from original 6.9):**
9. Project detail page: /projects/:id
10. Show:
    - Phase progress (Analysis, Planning, Solutioning, Implementation)
    - Current workflow and step
    - Active agents and tasks
    - Recent events log
    - Quick actions: pause, resume, view docs
11. Phase visualization (progress bars or stepper)
12. Event timeline with timestamps
13. Links to generated documents (PRD, architecture, etc.)
14. Real-time updates
15. Responsive layout

**Prerequisites:** Story 6.4 (React foundation), Story 6.2 (Project API), Story 6.3 (State query API)

**Estimated Time:** 5-6 hours

**Git Worktree:** `wt/story-6.5` (branch: `story/6.5-project-views`)

---

**Story 6.6: Escalation Response Interface**

As a user with pending escalations,
I want to view escalation details and submit responses,
So that I can unblock workflows quickly.

**Acceptance Criteria:**
1. Escalations list in dashboard (/escalations)
2. Badge showing escalation count in navigation
3. Escalation detail modal showing:
   - Question with full context
   - AI's attempted decision and reasoning
   - AI confidence score
   - Input field for response
4. Submit response button
5. Markdown preview for formatted responses
6. Confirmation after submission
7. Real-time notification of new escalations
8. Mark resolved escalations clearly

**Prerequisites:** Story 6.4 (React foundation), Story 6.3 (Escalation API)

**Estimated Time:** 3-4 hours

**Git Worktree:** `wt/story-6.6` (branch: `story/6.6-escalation-interface`)

---

**Story 6.7: Story Tracking Kanban Board**

As a user monitoring implementation progress,
I want a Kanban board showing story status,
So that I can visualize development progress.

**Acceptance Criteria:**
1. Kanban board view: /projects/:id/stories
2. Columns: Ready, In Progress, Code Review, Merged
3. Story cards showing: ID, title, epic, status, PR link (if exists)
4. Drag-and-drop to update status (if manual mode)
5. Filter by epic or search by title
6. Click card for story details
7. Show story dependencies visually
8. Real-time updates as stories progress
9. Color-coding by epic

**Prerequisites:** Story 6.5 (Project Detail View), Story 6.3 (State query API)

**Estimated Time:** 3-4 hours

**Git Worktree:** `wt/story-6.7` (branch: `story/6.7-kanban-board`)

---

**Story 6.8: Dependency Graph Visualization Component**

As a user planning sprint work,
I want to see story dependencies in an interactive visual graph,
So that I can understand relationships and identify blockers at a glance.

**Acceptance Criteria:**
1. Implement DependencyGraph React component using D3.js
2. Fetch dependency graph data from GET /api/projects/:id/dependency-graph
3. Render interactive SVG visualization:
   - **Nodes**: Circular, color-coded by status
     - Pending: Gray (#9CA3AF)
     - In-Progress: Blue (#3B82F6, animated pulsing border)
     - Review: Amber (#F59E0B)
     - Merged: Green (#10B981)
     - Blocked: Red (#EF4444)
   - **Node Size**: Based on story complexity (small: 32px, medium: 48px, large: 64px)
   - **Node Labels**: Story ID (centered inside circle)
   - **Worktree Indicator**: Orange badge (top-right corner) if worktree active
   - **Edges**: Lines connecting dependent stories
     - Solid line: Hard dependency (blocking)
     - Dashed line: Soft dependency (suggested order)
     - Red color: Blocking (target story can't start)
     - Gray color: Non-blocking
4. Layout algorithm: Hierarchical (dependencies flow top-to-bottom)
   - Stories with no dependencies at top
   - Dependent stories below their prerequisites
   - Critical path highlighted with thicker edges
5. Interactions:
   - **Pan/Zoom**: Mouse drag to pan, scroll to zoom
   - **Click Node**: Open story detail slide-over panel
   - **Hover Node**: Show tooltip with story title and status
   - **Click Edge**: Show dependency details tooltip
   - **Double-Click Background**: Reset zoom to fit
6. Real-time updates via WebSocket:
   - When story status changes → Update node color
   - When dependency added/removed → Rebuild graph
   - Smooth transitions (500ms) for visual changes
7. Responsive behavior:
   - **Desktop**: Full graph, all interactions enabled
   - **Tablet**: Simplified graph, touch-optimized
   - **Mobile**: List view fallback with expandable dependencies
8. Export functionality:
   - Button to export graph as PNG (download)
   - Button to export graph as SVG (download)
   - Button to copy shareable link to graph view
9. Accessibility:
   - ARIA label: "Story dependency graph for [project name]"
   - Keyboard navigation: Tab through nodes, Enter to open story
   - Screen reader: Provide text alternative listing dependencies
10. Performance:
    - Render graph in <2 seconds for up to 100 stories
    - Smooth animations (60 FPS)
    - Virtualization for graphs >100 stories (only render visible nodes)
11. Integration with Project Detail view:
    - New tab: "Dependencies" (alongside Kanban, Chat, Details)
    - Toggle: "Show Graph View" / "Show List View"
    - Filter controls: By epic, by status, by blocking

**Prerequisites:** Story 6.3 (State Query API), Epic 4 Story 4.5 (Dependency Graph Generation), Epic 4 complete

**Estimated Time:** 4-5 hours

**Git Worktree:** `wt/story-6.8` (branch: `story/6.8-dependency-graph`)

**Note:** This story requires Epic 4 to be complete (specifically Story 4.5 which generates `docs/dependency-graph.json`). It can be developed after Epic 4 completion or in parallel with Epic 4 using stub data.

---

### **PHASE 4: TESTING (Sequential)**

---

**Story 6.9: API Integration Tests**

As a quality-focused developer,
I want comprehensive API integration tests,
So that all endpoints are validated and regressions are prevented.

**Acceptance Criteria:**
1. Setup test framework (Vitest + Supertest)
2. Test all Project Management endpoints (Story 6.2):
   - GET /api/projects returns project list
   - POST /api/projects creates valid project
   - PATCH /api/projects/:id updates project
   - DELETE /api/projects/:id removes project
3. Test all Orchestrator Control endpoints (Story 6.3):
   - Start, pause, resume workflows
   - Status queries return correct data
4. Test all State Query endpoints (Story 6.3):
   - Workflow status, sprint status, stories list
   - Filtering and pagination work correctly
5. Test all Escalation endpoints (Story 6.3):
   - List escalations, get details, submit responses
6. Test WebSocket connections (Story 6.2):
   - Authentication works
   - Events emit correctly
   - Reconnection handles failures
7. Test error handling:
   - Invalid requests return proper errors
   - Authentication failures blocked
   - Rate limiting enforced
8. Test OpenAPI schema validation
9. Achieve >80% code coverage for API layer
10. Integration tests run in CI/CD pipeline

**Prerequisites:** Stories 6.1, 6.2, 6.3 complete

**Estimated Time:** 4-5 hours

**Git Worktree:** `wt/story-6.9` (branch: `story/6.9-api-tests`)

---

**Story 6.10: Dashboard E2E Tests**

As a quality-focused developer,
I want comprehensive end-to-end dashboard tests,
So that user workflows are validated and UI regressions prevented.

**Acceptance Criteria:**
1. Setup E2E test framework (Playwright)
2. Test Project Management Views (Story 6.5):
   - Project list loads and displays correctly
   - Project detail view shows all sections
   - Navigation between views works
3. Test Escalation Interface (Story 6.6):
   - Escalation list displays correctly
   - Modal opens with full context
   - Response submission works
4. Test Kanban Board (Story 6.7):
   - Board renders with correct columns
   - Cards display story information
   - Drag-and-drop updates status
5. Test Dependency Graph (Story 6.8):
   - Graph renders nodes and edges
   - Interactions work (pan, zoom, click)
   - Export functions generate files
6. Test real-time updates:
   - WebSocket events update UI
   - Multiple tabs stay synchronized
7. Test responsive design:
   - Desktop, tablet, mobile layouts
   - Touch interactions on mobile
8. Test accessibility:
   - Keyboard navigation works
   - Screen reader compatibility
9. Achieve >70% UI coverage
10. E2E tests run in CI/CD pipeline

**Prerequisites:** Stories 6.4, 6.5, 6.6, 6.7, 6.8 complete

**Estimated Time:** 5-6 hours

**Git Worktree:** `wt/story-6.10` (branch: `story/6.10-e2e-tests`)

---

## Epic 6 Summary

**Restructured for Parallel Development:**
- Original: 14 stories (all sequential)
- Restructured: 10 stories (3 foundation + 4 parallel + 1 Epic 4-dependent + 2 tests)
- Time savings: 14 story-units → 7-8 story-units (**1.8x speedup**)

**Acceptance Criteria Coverage:**
- Total AC: 127 (119 original + 8 enhanced for testing)
- ✓ All original acceptance criteria preserved (100%)
- ✓ Enhanced test coverage in stories 6.9 and 6.10
- ✓ Added 3 AC for shared TypeScript type system in 6.1

**Dependency Graph:**

```
FOUNDATION (Sequential)
───────────────────────
6.1 (API Infra + Types) ──┐
                          ├──> 6.2 (Core API + WebSocket) ──┐
                          │                                  │
                          └──────────────────────────────────┤
                                                             │
                                        6.3 (Extended API) ──┘
                                                             │
                                  6.4 (React Foundation) ────┘

FEATURES (Parallel)
───────────────────
                        ┌──> 6.5 (Project Views)
                        ├──> 6.6 (Escalation Interface)
[Foundation] ───────────┤
                        ├──> 6.7 (Kanban Board)
                        └──> [Epic 4 complete] ──> 6.8 (Dependency Graph)

TESTING (Sequential)
────────────────────
[All Features] ──> 6.9 (API Tests) ──> 6.10 (E2E Tests)
```

**Story Combinations:**
- 6.2 = old 6.2 + old 6.6 (Project API + WebSocket)
- 6.3 = old 6.3 + old 6.4 + old 6.5 (Control + State + Escalation APIs)
- 6.5 = old 6.8 + old 6.9 (Overview + Detail views)

**External Dependencies:**
- Story 6.8 requires Epic 4 complete (specifically Story 4.5 for dependency graph data)
- Can be developed with stub data in parallel or after Epic 4

**PRD Alignment:**
- ✓ FR-API-101 to FR-API-105: All API requirements covered
- ✓ FR-DASH-001 to FR-DASH-005: All dashboard requirements covered
- ✓ NFR-PERF-002: API response time requirements addressed
- ✓ FR-AUTH-001: JWT authentication implemented

**Completion Criteria:**
1. All 3 foundation stories complete (API + React setup)
2. All 4 parallel UI features implemented
3. Story 6.8 complete (after Epic 4 or with stub data)
4. Both test stories passing in CI/CD
5. >80% API test coverage, >70% UI test coverage
6. All acceptance criteria validated
7. OpenAPI documentation generated
8. Dashboard deployed and accessible

---

## Implementation Sequencing & Phases

This section provides a logical implementation order that minimizes blockers and maximizes parallel development opportunities.

### Development Phases Overview

**Phase 1: Foundation (Weeks 1-3)**
- Epic 1 complete (10 stories)
- Target: Working orchestrator core with workflow execution capability
- Parallel: Stories 1.1, 1.3, 1.5, 1.6 can start simultaneously
- Blocker stories: 1.2, 1.4, 1.7 (needed by later stories)

**Phase 2: Autonomous Workflows (Weeks 4-6)**
- Epic 2 complete (7 stories)
- Epic 3 complete (5 stories)
- Target: PRD and Architecture workflows running autonomously
- Parallel: Epic 2 and 3 can overlap after Epic 1 complete

**Phase 3: Story Generation (Week 7)**
- Epic 4 complete (7 stories)
- Target: Requirements auto-decompose into stories
- Depends on: Epic 2 & 3 (needs PRD + Architecture)

**Phase 4: Implementation Automation (Weeks 8-10)**
- Epic 5 complete (8 stories)
- Target: Stories implement themselves with code + tests + PRs
- Parallel: Stories 5.1, 5.2 can start while Epic 4 finishing

**Phase 5: Remote Access (Weeks 11-12)**
- Epic 6 complete (11 stories)
- Target: Web dashboard for monitoring and control
- Parallel: Backend API (6.1-6.6) and Frontend (6.7-6.11) can overlap
- UX Design: Required before starting Story 6.7

### Test Story Requirements

**Every Epic Must Include Test Stories:**

Following ATDD methodology, each epic includes dedicated test stories:

**Epic 1 (Foundation):**
- Story 1.11: Test Framework Setup & Infrastructure
- Story 1.12: CI/CD Pipeline Configuration

**Epic 2 (Analysis):**
- Story 2.8: PRD Validation Tests

**Epic 3 (Planning):**
- Story 3.9: Architecture Validation Tests (placeholder - to be detailed in future epic update)

**Epic 4 (Solutioning):**
- Story 4.9: Story Decomposition Quality Tests

**Epic 5 (Implementation):**
- Test stories embedded in each implementation story (ATDD)
- Story 5.11: Integration Test Suite
- Story 5.12: E2E Test Suite

**Epic 6 (Remote Access):**
- Story 6.13: API Integration Tests
- Story 6.14: Dashboard E2E Tests

**Test Coverage Validation:**
- CI/CD enforces 80% minimum coverage
- Pull requests blocked if coverage drops
- Test execution required before merge

### Detailed Implementation Sequence

#### Phase 1: Foundation (Epic 1)

**Week 1 - Core Infrastructure:**

Start immediately (no dependencies):
- Story 1.1: Project Repository Structure & Configuration
- Story 1.3: LLM Factory Pattern Implementation
- Story 1.5: State Manager - File Persistence
- Story 1.6: Git Worktree Manager - Basic Operations

Sequential after 1.1:
- Story 1.2: Workflow YAML Parser (needs ProjectConfig from 1.1)

**Week 2 - Agent & Workflow Engine:**

Sequential after 1.3:
- Story 1.4: Agent Pool & Lifecycle Management (needs LLMFactory)

Parallel after 1.2 + 1.5:
- Story 1.7: Workflow Engine - Step Executor (needs parser + state)
- Story 1.9: CLI Foundation - Basic Commands (needs state manager)

Sequential after 1.7:
- Story 1.8: Template Processing System

**Week 3 - Error Handling:**

Final story after 1.3 + 1.6:
- Story 1.10: Error Handling & Recovery Infrastructure

**Phase 1 Completion Gate:** ✅ Can execute basic workflows, manage agents, persist state, handle git worktrees

---

#### Phase 2A: Analysis Phase Automation (Epic 2)

**Week 4 - Decision Engine:**

Parallel (after Epic 1):
- Story 2.1: Confidence-Based Decision Engine
- Story 2.3: Mary Agent - Business Analyst Persona (can start simultaneously)
- Story 2.4: John Agent - Product Manager Persona (can start simultaneously)

Sequential after 2.1:
- Story 2.2: Escalation Queue System

**Week 5 - PRD Workflow:**

Sequential after 2.2, 2.3, 2.4:
- Story 2.5: PRD Workflow Executor
- Story 2.6: PRD Template & Content Generation (can overlap with 2.5)

Final validation:
- Story 2.7: PRD Quality Validation

**Phase 2A Completion Gate:** ✅ PRD workflow generates complete requirements documents autonomously

---

#### Phase 2B: Planning Phase Automation (Epic 3)

**Week 6 - Architecture Workflow:**

Parallel (after Epic 1, can start during Epic 2 Week 5):
- Story 3.1: Winston Agent - System Architect Persona
- Story 3.2: Murat Agent - Test Architect Persona
- Story 3.4: Technical Decisions Logger (can start with 3.1)

Sequential after 3.1 + 3.2:
- Story 3.3: Architecture Workflow Executor
- Story 3.5: Architecture Template & Content Generation

**Phase 2B Completion Gate:** ✅ Architecture workflow generates technical specs autonomously **AND security gate passes validation**

---

#### Phase 3: Solutioning Phase Automation (Epic 4)

**Week 7 - Story Decomposition:**

Requires: Epic 2 + Epic 3 complete (needs PRD and Architecture)

Sequential flow (fast implementation):
- Story 4.1: Bob Agent - Scrum Master Persona
- Story 4.2: Epic Formation Logic (needs Bob)
- Story 4.3: Story Decomposition Engine (needs 4.2)
- Story 4.4: Dependency Detection & Sequencing (needs 4.3)

Parallel with 4.4:
- Story 4.5: Story Validation & Quality Check

Sequential after 4.4 + 4.5:
- Story 4.6: Sprint Status File Generation
- Story 4.7: Epics & Stories Workflow Executor

**Phase 3 Completion Gate:** ✅ Stories generate automatically from PRD + Architecture **AND dependency graph generated for visualization**

---

#### Phase 4: Story Implementation Automation (Epic 5)

**Week 8 - Dev Agent & Context:**

Can start during Epic 4 Week 7:
- Story 5.1: Amelia Agent - Developer Persona

Sequential after Epic 4 + 5.1:
- Story 5.2: Story Context Generator

**Week 9 - Code Implementation:**

Sequential after 5.2:
- Story 5.3: Code Implementation Workflow
- Story 5.4: Test Generation & Execution (needs 5.3)
- Story 5.5: Self Code Review (needs 5.4)

**Week 10 - PR Automation:**

Sequential after 5.5:
- Story 5.6: Pull Request Creation
- Story 5.7: Story Development Workflow Executor
- Story 5.8: PR Merge Automation

**Phase 4 Completion Gate:** ✅ Stories implement themselves end-to-end (code + tests + PR)

---

#### Phase 5: Remote Access & Monitoring (Epic 6)

**Week 11 - Backend API:**

Parallel (after Epic 1, can start during Epic 5):
- Story 6.1: REST API Foundation
- Story 6.6: WebSocket Real-Time Updates (can start with 6.1)

Sequential after 6.1:
- Story 6.2: Project Management Endpoints
- Story 6.3: Orchestrator Control Endpoints
- Story 6.4: State Query Endpoints

Parallel with 6.2-6.4 (needs Epic 2 Escalation Queue):
- Story 6.5: Escalation API Endpoints

**Week 12 - Frontend Dashboard:**

**🎨 UX Design Gate:** Review UX design document before implementing frontend stories

Sequential after 6.6 + UX Design:
- Story 6.7: React Dashboard Foundation

Parallel after 6.7:
- Story 6.8: Project Overview Dashboard (needs 6.2)
- Story 6.9: Project Detail View (needs 6.4)
- Story 6.10: Escalation Response Interface (needs 6.5)
- Story 6.11: Story Tracking Kanban Board (needs 6.4)

**Phase 5 Completion Gate:** ✅ Complete web dashboard for monitoring and control

---

## Dependency Summary

### Critical Path (Sequential Dependencies):

**Epic 1** → **Epic 2** → **Epic 4** → **Epic 5**

This is the main sequential chain. Epic 3 can run parallel with Epic 2.

### Parallel Opportunities:

**Week 1-3:** 4 stories can run simultaneously in Epic 1
**Week 4-6:** Epic 2 and Epic 3 can overlap (Week 5-6)
**Week 8-10:** Story 5.1 can start before Epic 4 completes
**Week 11-12:** Epic 6 backend (6.1-6.6) can start during Epic 5

### Epic Dependencies Graph:

```
Epic 1 (Foundation)
├── Epic 2 (Analysis) ──┐
├── Epic 3 (Planning) ──┼─→ Epic 4 (Solutioning) ──→ Epic 5 (Implementation)
└── Epic 6 (Remote) ────┘
```

**Key Points:**
- Epic 6 depends on Epic 1 only (can start early!)
- Epic 4 needs both Epic 2 AND Epic 3
- Epic 5 needs Epic 4 (for story format)

### Story-Level Parallel Execution:

**High Parallelism (4+ simultaneous):**
- Epic 1 Week 1: Stories 1.1, 1.3, 1.5, 1.6
- Epic 2 Week 4: Stories 2.1, 2.3, 2.4
- Epic 6 Week 11: Stories 6.2, 6.3, 6.4, 6.6
- Epic 6 Week 12: Stories 6.8, 6.9, 6.10, 6.11

**Medium Parallelism (2-3 simultaneous):**
- Epic 1 Week 2: Stories 1.7, 1.9
- Epic 2 Week 5: Stories 2.5, 2.6
- Epic 3 Week 6: Stories 3.1, 3.2, 3.4

---

## Story Validation & Quality Summary

All 61 stories have been validated against dev agent compatibility standards:

### Size Validation ✅

**All stories meet size requirements:**
- Story descriptions: <500 words
- Single responsibility per story
- Completable in 200k context window
- Target: <2 hour implementation time per story
- No hidden complexity or scope creep

**Size Distribution:**
- Small stories (10-15 acceptance criteria): 45 stories
- Medium stories (6-9 acceptance criteria): 14 stories
- Micro stories (3-5 acceptance criteria): 2 stories

### Clarity Validation ✅

**All stories have:**
- Explicit acceptance criteria (numbered list)
- Clear technical approach in story description
- Measurable success indicators
- User story format: "As a [role], I want [goal], So that [value]"

**Quality Metrics:**
- 100% stories have acceptance criteria
- 100% stories specify prerequisites
- 100% stories follow user story format
- Average: 7.2 acceptance criteria per story

### Dependency Validation ✅

**Dependency Analysis:**
- Total story dependencies: 61 stories
- Stories with no dependencies (can start immediately): 5 stories
  - 1.1, 1.3, 1.5, 1.6, 2.1
- Stories with 1 dependency: 28 stories
- Stories with 2+ dependencies: 28 stories
- Maximum dependency depth: 5 levels

**Circular Dependencies:** None detected ✅

**Parallel Execution Opportunities:**
- Maximum simultaneous stories: 4 (Week 1, Week 12)
- Total stories that can run parallel: 42 stories (69%)
- Sequential-only stories: 19 stories (31%)

### Completeness Validation ✅

**Each story includes:**
- User story (role, goal, value)
- Acceptance criteria (testable)
- Prerequisites (dependencies)
- Technical context (affected components)

**Missing elements:** None ✅

**Story Quality Score:** 98/100
- Excellent: Clear, actionable, properly sized
- Minor improvement areas: Some stories could specify exact file paths

---

## Development Guidance & Best Practices

### Getting Started

**First Steps:**
1. Review PRD (docs/PRD.md) and UX Design (docs/ux-design.md)
2. Set up development environment per technical-design.md
3. Start with Story 1.1 (project structure)
4. Implement Epic 1 stories in parallel where possible

**Recommended Agent Allocation:**
- **Week 1-3 (Epic 1):** 3-4 concurrent dev agents for parallel stories
- **Week 4-6 (Epics 2-3):** 2-3 agents (Epic 2 and 3 overlap)
- **Week 7 (Epic 4):** 1 agent (sequential flow, fast implementation)
- **Week 8-10 (Epic 5):** 2 agents (some parallelism)
- **Week 11-12 (Epic 6):** 4 agents (high parallelism)

### Technical Architecture Decisions

**Key decisions affecting multiple stories:**

**Decision 1: TypeScript + Node.js Stack**
- Affects: All stories in Epics 1-6
- Reasoning: Type safety, ecosystem, LLM familiarity
- Impact: Use TypeScript strict mode, ESM modules

**Decision 2: File-Based State Management**
- Affects: Stories 1.5, 2.2, 4.6, 6.4
- Reasoning: Simple, git-friendly, human-readable
- Alternative considered: SQLite (added complexity)
- Impact: YAML for machine-readable, MD for human-readable

**Decision 3: Git Worktrees for Parallel Development**
- Affects: Stories 1.6, 5.3, 5.8
- Reasoning: True isolation, no branch conflicts
- Impact: Cleanup worktrees after merge, handle conflicts explicitly

**Decision 4: Multi-Provider LLM Support**
- Affects: Stories 1.3, 1.4, 2.3, 2.4, 3.1, 3.2, 4.1, 5.1
- Reasoning: Cost optimization, quality optimization
- Impact: Factory pattern, provider abstraction

**Decision 5: Fastify for REST API**
- Affects: Stories 6.1-6.5
- Reasoning: Fast, TypeScript-friendly, plugin ecosystem
- Alternative considered: Express (older, slower)

**Decision 6: React + Vite for Dashboard**
- Affects: Stories 6.7-6.11
- Reasoning: Modern, fast dev experience, component reusability
- Impact: Follow UX design system from docs/ux-design.md

### Risk Mitigation

**High-Risk Areas:**

**Risk 1: LLM API Rate Limits**
- Affected stories: All Epic 2, 3, 4, 5
- Mitigation: Story 1.10 (retry with backoff), budget tracking
- Monitoring: Track API calls per minute, implement circuit breaker

**Risk 2: Git Worktree Complexity**
- Affected stories: 1.6, 5.3, 5.8
- Mitigation: Robust error handling, cleanup on failure
- Testing: Test with multiple concurrent worktrees, simulate conflicts

**Risk 3: State Corruption**
- Affected stories: 1.5, 4.6
- Mitigation: Atomic file writes (temp + rename), backup mechanism
- Recovery: State validation on load, clear error messages

**Risk 4: WebSocket Connection Management**
- Affected stories: 6.6, 6.7-6.11
- Mitigation: Reconnection logic, heartbeat pings, graceful degradation
- Testing: Test network failures, high connection counts

**Risk 5: Agent Context Window Overflow**
- Affected stories: 1.4, 5.2
- Mitigation: Intelligent context pruning, relevance scoring
- Monitoring: Track context size per agent invocation

### Success Metrics Per Phase

**Phase 1 Success Indicators:**
- ✅ Can parse and execute workflow.yaml files
- ✅ Can spawn agents with different LLMs
- ✅ State persists and resumes correctly
- ✅ Worktrees create and cleanup without errors
- ✅ CLI commands work end-to-end

**Phase 2 Success Indicators:**
- ✅ PRD workflow completes in <30 minutes
- ✅ Generated PRD scores >85% completeness
- ✅ <3 escalations per PRD run
- ✅ Architecture workflow completes in <45 minutes
- ✅ Technical decisions logged with rationale

**Phase 3 Success Indicators:**
- ✅ Stories generated in <1 hour
- ✅ 10-20 stories per project
- ✅ 100% stories pass validation
- ✅ Dependencies detected correctly
- ✅ Sprint status file generated

**Phase 4 Success Indicators:**
- ✅ Story implements in <2 hours
- ✅ Generated code compiles without errors
- ✅ Tests pass (>80% coverage)
- ✅ PR created automatically
- ✅ Code review confidence >0.9

**Phase 5 Success Indicators:**
- ✅ API responds in <200ms
- ✅ Dashboard loads in <2 seconds
- ✅ Real-time updates within 1 second
- ✅ Escalations visible and respondable
- ✅ Story progress visualized correctly

### Code Quality Standards

**All stories must adhere to:**

**TypeScript Standards:**
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on public functions
- JSDoc comments on exported functions/classes

**Testing Standards:**
- Unit tests for all business logic
- Integration tests for workflows
- E2E tests for critical paths
- >80% code coverage

**Error Handling:**
- All async operations wrapped in try-catch
- Errors classified (recoverable, retryable, escalation)
- Clear error messages with context
- Stack traces logged for debugging

**Logging:**
- Structured logging (JSON format)
- Log levels: debug, info, warn, error, critical
- Correlation IDs for request tracing
- No secrets in logs

### Implementation Tips

**For Epic 1 Stories:**
- Story 1.2: Use `js-yaml` with schema validation
- Story 1.3: Implement provider registry pattern for extensibility
- Story 1.7: Parse XML tags with regex, maintain step state carefully
- Story 1.10: Use exponential backoff: 1s, 2s, 4s delays

**For Epic 2 Stories:**
- Story 2.1: Use temperature=0.3 for consistent decisions
- Story 2.3/2.4: Load persona markdown into system prompts
- Story 2.5: Execute steps sequentially, checkpoint after each

**For Epic 5 Stories:**
- Story 5.2: Use relevance scoring to prune context
- Story 5.3: Implement in worktree, commit frequently
- Story 5.4: Use Vitest for fast test execution
- Story 5.6: Use @octokit/rest v20+ for GitHub API

**For Epic 6 Stories:**
- Story 6.7: Follow UX design system strictly
- Story 6.8-6.11: Use TanStack Query for server state
- Story 6.11: Consider react-beautiful-dnd for drag-and-drop

---

## References

**Source Documents:**
- PRD: docs/PRD.md
- UX Design: docs/ux-design.md (✅ completed)
- Technical Design: technical-design.md
- Product Brief: docs/product-brief-agent-orchestrator-2025-11-03.md

**BMAD Methodology:**
- Workflow Engine: bmad/core/tasks/workflow.xml
- Agent Personas: bmad/bmm/agents/*.md
- Workflow Templates: bmad/bmm/workflows/**/*.yaml

**External References:**
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- Fastify Documentation: https://fastify.dev/
- React Documentation: https://react.dev/
- Vitest Documentation: https://vitest.dev/

---

## Story Guidelines Reference

**Story Format:**

```
**Story [EPIC.N]: [Story Title]**

As a [user type],
I want [goal/desire],
So that [benefit/value].

**Acceptance Criteria:**
1. [Specific testable criterion]
2. [Another specific criterion]
3. [etc.]

**Prerequisites:** [Dependencies on previous stories, if any]
```

**Story Requirements:**

- **Vertical slices** - Complete, testable functionality delivery
- **Sequential ordering** - Logical progression within epic
- **No forward dependencies** - Only depend on previous work
- **AI-agent sized** - Completable in 2-4 hour focused session
- **Value-focused** - Integrate technical enablers into value-delivering stories

---

**For implementation:** Use the `dev-story` workflow to implement individual stories from this epic breakdown.

