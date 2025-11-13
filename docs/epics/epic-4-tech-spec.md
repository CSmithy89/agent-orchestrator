# Epic Technical Specification: Solutioning Phase Automation

Date: 2025-11-12
Author: Chris
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 implements the Solutioning Phase Automation, which automatically decomposes PRD requirements into implementable epics and stories with comprehensive dependency mapping and visualization. This epic bridges the gap between high-level architecture (Epic 3) and actual implementation (Epic 5) by generating structured, bite-sized development units that are sized for autonomous agent execution within 200k token context windows.

The system employs a **foundation-first architecture** that enables parallel development through git worktrees, achieving a 1.8x speedup over sequential implementation. The Bob (Scrum Master) agent performs intelligent story decomposition with confidence-based decision making, while the dependency detection system generates both machine-readable graph data and visual representations to aid planning and execution.

## Objectives and Scope

**In Scope:**
- Foundational data models and schemas for epics, stories, dependencies, and validation results
- Bob (Scrum Master) agent infrastructure with LLM assignment and context building capabilities
- Solutioning workflow engine foundation extending the core workflow engine
- Automated epic formation from PRD functional requirements with business value grouping
- Intelligent story decomposition ensuring single responsibility and agent-appropriate sizing
- Dependency detection with topological sorting and parallelization analysis
- Automated dependency graph generation with critical path calculation
- Story validation ensuring dev agent compatibility (size, clarity, completeness checks)
- Sprint status file generation tracking all epics and stories with metadata
- Story file writing to individual markdown files with YAML frontmatter
- Epics document generation consolidating all epic descriptions
- Implementation readiness gate validation with comprehensive quality checks

**Out of Scope:**
- Actual story implementation (Epic 5)
- Real-time dependency graph visualization UI (Epic 6)
- Learning from story decomposition patterns (post-MVP)
- Multi-project epic/story management (post-MVP)
- Custom story templates per project type (post-MVP)

## System Architecture Alignment

This epic extends the **Microkernel Architecture** established in Epic 1 by adding solutioning workflow plugins. Key architectural alignments:

**Core Kernel Extensions:**
- Leverages `WorkflowEngine` for solutioning workflow execution
- Utilizes `AgentPool` and `LLMFactory` for Bob agent instantiation with optimal LLM assignment
- Employs `StateManager` for workflow state persistence in `bmad/sprint-status.yaml`
- Uses `WorktreeManager` for foundation stories (4.1-4.3) in main branch and feature stories (4.4-4.9) in parallel worktrees
- Integrates with `TemplateProcessor` for story markdown generation

**Workflow Plugin Pattern:**
- Solutioning workflows are self-contained plugins: `bmad/bmm/workflows/create-epics-and-stories/`
- Includes: `workflow.yaml`, `instructions.md`, `template.md` (story template)
- Invoked by orchestrator core with PRD and Architecture as inputs

**Data Flow:**
- Inputs: `docs/PRD.md`, `docs/architecture.md` (from Epic 2 & 3)
- Processing: Bob agent analysis → Epic formation → Story decomposition → Dependency detection → Validation → File generation
- Outputs: `docs/epics.md`, `docs/stories/story-*.md`, `docs/sprint-status.yaml`, `docs/dependency-graph.json`

**Component Interactions:**
- Solutioning workflows invoke Bob agent via `AgentPool.createAgent("bob", llmModel, context)`
- Bob agent uses confidence-based decision engine (confidence threshold: 0.75) for story boundary decisions
- State checkpointing after each major step (epic formation, story decomposition, validation)
- Event emission for real-time monitoring: `epic.formed`, `stories.generated`, `dependency-graph.created`, `readiness-gate.passed`

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **SolutioningDataModels** | Define TypeScript interfaces for Epic, Story, DependencyGraph, ValidationResult; Provide JSON schema validation | None | Type definitions exported from `src/solutioning/types.ts` | Story 4.1 |
| **StoryTemplateBuilder** | Build story objects from templates; Validate story format; Convert to markdown with YAML frontmatter | Story object | Markdown string with frontmatter | Story 4.1 |
| **SolutioningAgentContextBuilder** | Build Bob agent context from PRD and Architecture; Token optimization (<30k); Generate prompts for epic formation, story decomposition, dependency detection | PRD, Architecture | AgentContext, Prompt strings | Story 4.2 |
| **BobAgentInfrastructure** | Load Bob persona; Configure LLM assignment; Provide methods: formEpics(), decomposeIntoStories(), detectDependencies() | PRD, Architecture, AgentContext | Epic objects, Story objects, Dependency graph | Story 4.2 |
| **SolutioningWorkflowEngine** | Extend WorkflowEngine; Execute solutioning workflow steps; Manage worktrees; Track state transitions | workflow.yaml, PRD, Architecture | Workflow completion event | Story 4.3 |
| **EpicFormationService** | Invoke Bob agent to analyze PRD and form epics with business value grouping | PRD | Epic objects (3-8 features each) | Story 4.4 |
| **StoryDecompositionService** | Invoke Bob agent to decompose epics into vertical-slice stories with clear acceptance criteria | Epic objects, PRD, Architecture | Story objects (3-10 per epic) | Story 4.4 |
| **DependencyDetectionService** | Invoke Bob agent to detect technical dependencies; Build dependency graph with topological sort | Story objects | Dependency edges with hard/soft types | Story 4.5 |
| **DependencyGraphGenerator** | Generate graph data structure with nodes, edges, metrics; Calculate critical path and bottlenecks; Detect circular dependencies | Dependency edges, Story objects | `docs/dependency-graph.json` | Story 4.5 |
| **StoryValidator** | Validate story size, clarity, dependency documentation, completeness; Generate validation reports | Story objects | ValidationResult objects | Story 4.6 |
| **SprintStatusGenerator** | Generate sprint-status.yaml with project metadata, workflow tracking, epic/story status | Epic objects, Story objects, Dependency graph | `docs/sprint-status.yaml` | Story 4.7 |
| **StoryFileWriter** | Write individual story markdown files; Generate epics.md document; Use StoryTemplateBuilder for formatting | Story objects, Epic objects | `docs/stories/story-*.md`, `docs/epics.md` | Story 4.8 |
| **ImplementationReadinessValidator** | Validate story completeness, dependency validity, story sizing, test strategy, critical path; Generate readiness gate report | All solutioning outputs | ReadinessGateResult, `docs/readiness-gate-results.json` | Story 4.9 |

### Data Models and Contracts

**Core Type Definitions** (`src/solutioning/types.ts`):

```typescript
interface Epic {
  id: string; // "epic-1", "epic-2", etc.
  title: string; // Business value name, not technical component
  goal: string; // Clear, concise goal statement
  value_proposition: string; // Why this epic matters
  stories: Story[]; // 3-10 stories per epic
  business_value: string; // Revenue, cost reduction, user satisfaction, etc.
  estimated_duration: string; // "1-2 sprints"
}

interface Story {
  id: string; // "4-1", "4-2", etc.
  epic: string; // Parent epic ID
  title: string; // Concise, action-oriented
  description: string; // User story format: As a..., I want..., So that... (<500 words)
  acceptance_criteria: string[]; // 8-12 testable, atomic criteria
  dependencies: string[]; // Array of story IDs that must complete first
  status: StoryStatus; // "backlog" | "drafted" | "ready-for-dev" | "in-progress" | "review" | "done"
  technical_notes: TechnicalNotes; // Implementation guidance
  estimated_hours: number; // <2 hours for autonomous completion
  complexity: Complexity; // "low" | "medium" | "high"
}

interface TechnicalNotes {
  affected_files: string[]; // Files likely to change
  endpoints: string[]; // API endpoints involved (if applicable)
  data_structures: string[]; // Key data models or types
  test_requirements: string; // Testing approach summary
}

interface DependencyGraph {
  nodes: GraphNode[]; // All stories with metadata
  edges: DependencyEdge[]; // Dependency relationships
  critical_path: string[]; // Longest dependency chain
  bottlenecks: string[]; // Stories blocking ≥3 other stories
  parallelizable: string[][]; // Groups of stories with no blocking dependencies
  metadata: GraphMetadata;
}

interface GraphNode {
  id: string; // Story ID
  title: string;
  status: StoryStatus;
  epic: string;
  complexity: Complexity;
}

interface DependencyEdge {
  from: string; // Prerequisite story ID
  to: string; // Dependent story ID
  type: 'hard' | 'soft'; // hard = blocking, soft = suggested
  blocking: boolean; // Cannot start until prerequisite complete
}

interface GraphMetadata {
  totalStories: number;
  parallelizable: number;
  bottlenecks: string[];
  criticalPathLength: number;
}

interface StoryMetadata {
  complexity: Complexity;
  estimated_hours: number;
  affected_files: string[];
  test_requirements: string;
}

interface ValidationResult {
  pass: boolean; // True if all checks pass
  score: number; // Weighted average of check scores (0.0-1.0)
  checks: ValidationCheck[]; // Individual check results
  blockers: string[]; // Critical issues preventing implementation
  warnings: string[]; // Non-blocking issues for review
}

interface ValidationCheck {
  category: string; // "size" | "clarity" | "dependencies" | "completeness"
  name: string; // Check name
  pass: boolean;
  details: string; // Specific findings
}

type StoryStatus = "backlog" | "drafted" | "ready-for-dev" | "in-progress" | "review" | "done";
type Complexity = "low" | "medium" | "high";
```

**Sprint Status YAML Schema** (`docs/sprint-status.yaml`):

```yaml
generated: "2025-11-12"
project: "Agent Orchestrator"
project_key: "agent-orchestrator"
tracking_system: "file-system"
story_location: "{project-root}/docs/stories"

development_status:
  # Epic status: backlog | contexted
  epic-1: contexted

  # Story status: backlog | drafted | ready-for-dev | in-progress | review | done
  1-1-story-title: done
  1-2-story-title: in-progress

  epic-2: backlog
  2-1-story-title: backlog
```

**Dependency Graph JSON Schema** (`docs/dependency-graph.json`):

```json
{
  "nodes": [
    {
      "id": "4-1",
      "title": "Solutioning Data Models & Story Schema",
      "status": "backlog",
      "epic": "epic-4",
      "complexity": "medium"
    }
  ],
  "edges": [
    {
      "from": "4-1",
      "to": "4-4",
      "type": "hard",
      "blocking": true
    }
  ],
  "criticalPath": ["4-1", "4-2", "4-3", "4-4", "4-9"],
  "metadata": {
    "totalStories": 9,
    "parallelizable": 6,
    "bottlenecks": ["4-3"],
    "criticalPathLength": 5
  }
}
```

### APIs and Interfaces

**AgentPool API** (from Epic 1, used by Epic 4):

```typescript
// Create Bob agent with configured LLM
const bobAgent = await agentPool.createAgent(
  "bob",
  "claude-haiku-3-5", // Cost-effective for formulaic story decomposition
  {
    prd: prdContent,
    architecture: archContent,
    storyPatterns: bmadPatterns
  }
);

// Invoke agent methods
const epics = await bobAgent.invoke(bobEpicFormationPrompt(context));
const stories = await bobAgent.invoke(bobStoryDecompositionPrompt(context, epic));
const dependencies = await bobAgent.invoke(bobDependencyDetectionPrompt(context, stories));
```

**SolutioningAgentContextBuilder API** (Story 4.2):

```typescript
class SolutioningAgentContextBuilder {
  buildBobContext(prd: string, architecture: string): AgentContext {
    // Token optimization: Prune PRD to functional requirements (<30k tokens)
    const prunedPRD = this.extractFunctionalRequirements(prd);
    const archOverview = this.extractArchitectureOverview(architecture);

    return {
      prd: prunedPRD,
      architecture: archOverview,
      storyPatterns: this.loadBMADPatterns(),
      constraints: {
        storyMaxWords: 500,
        acceptanceCriteriaMin: 8,
        acceptanceCriteriaMax: 12,
        maxContextTokens: 200000
      }
    };
  }

  bobEpicFormationPrompt(context: AgentContext): string;
  bobStoryDecompositionPrompt(context: AgentContext, epic: Epic): string;
  bobDependencyDetectionPrompt(context: AgentContext, stories: Story[]): string;
}
```

**StoryTemplateBuilder API** (Story 4.1):

```typescript
class StoryTemplateBuilder {
  buildFromTemplate(storyData: Story): StoryObject {
    // Load template and populate with story data
  }

  validateStoryFormat(story: StoryObject): ValidationResult {
    // Check completeness against schema
  }

  toMarkdown(story: StoryObject): string {
    // Convert to story-XXX.md format with frontmatter
  }

  toYAMLFrontmatter(story: StoryObject): string {
    // Generate YAML frontmatter section
  }
}
```

**DependencyGraphGenerator API** (Story 4.5):

```typescript
class DependencyGraphGenerator {
  async generate(stories: Story[]): Promise<DependencyGraph> {
    const nodes = this.buildNodes(stories);
    const edges = this.detectDependencies(stories);
    const criticalPath = this.calculateCriticalPath(nodes, edges);
    const bottlenecks = this.identifyBottlenecks(nodes, edges);
    const parallelizable = this.findParallelizableGroups(nodes, edges);

    return {
      nodes,
      edges,
      criticalPath,
      bottlenecks,
      parallelizable,
      metadata: this.calculateMetadata(nodes, edges, criticalPath, bottlenecks)
    };
  }

  private calculateCriticalPath(nodes: GraphNode[], edges: DependencyEdge[]): string[];
  private identifyBottlenecks(nodes: GraphNode[], edges: DependencyEdge[]): string[];
  private findParallelizableGroups(nodes: GraphNode[], edges: DependencyEdge[]): string[][];
}
```

### Workflows and Sequencing

**Solutioning Workflow Sequence** (Foundation → Features):

```
PHASE 1: FOUNDATION (Sequential - 6-7 hours)
┌────────────────────────────────────────────────────────────┐
│ Story 4.1: Data Models & Schemas                          │
│   ├─ Define Epic, Story, DependencyGraph interfaces       │
│   ├─ Create JSON schema validation                        │
│   ├─ Implement StoryTemplateBuilder                       │
│   └─ Export types for other stories                       │
└──────────────────┬─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│ Story 4.2: Bob Agent Infrastructure                        │
│   ├─ Load Bob persona from bmad/bmm/agents/bob.md         │
│   ├─ Read LLM assignments from .bmad/project-config.yaml  │
│   ├─ Implement SolutioningAgentContextBuilder             │
│   └─ Define agent methods: formEpics(), decomposeStories()│
└──────────────────┬─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│ Story 4.3: Solutioning Workflow Engine                    │
│   ├─ Extend WorkflowEngine from Epic 1                    │
│   ├─ Load workflow.yaml and parse steps                   │
│   ├─ Implement state machine transitions                  │
│   ├─ Integrate worktree management                        │
│   └─ State persistence to sprint-status.yaml              │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
        [Foundation Complete]
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│ PHASE 2: FEATURE DELIVERY (Parallel - 3-4 hours)            │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ Story 4.4       │  │ Story 4.5       │  │ Story 4.6    ││
│  │ Epic/Story Gen  │  │ Dependency      │  │ Validation   ││
│  │ (4-5h)          │  │ Detection (3-4h)│  │ (2-3h)       ││
│  └─────────┬───────┘  └─────────┬───────┘  └──────┬───────┘│
│            │                    │                  │         │
│            │                    │                  │         │
│  ┌─────────▼───────┐  ┌─────────▼───────┐  ┌──────▼───────┐│
│  │ Story 4.7       │  │ Story 4.8       │  │ Story 4.9    ││
│  │ Sprint Status   │  │ File Writer     │  │ Readiness    ││
│  │ (1-2h)          │  │ (2-3h)          │  │ Gate (2-3h)  ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
│            │                    │                  │         │
│            └────────────────────┴──────────────────┘         │
│                                 │                            │
└─────────────────────────────────┼────────────────────────────┘
                                  ▼
                    [All Features Complete]
                                  │
                                  ▼
                  ┌───────────────────────────┐
                  │ Story 4.9 Executes        │
                  │ Readiness Gate Validation │
                  └───────────────┬───────────┘
                                  │
                                  ▼
                    [Epic 4 Complete: Ready for Epic 5 Implementation]
```

**Story 4.4 Internal Sequence** (Epic Formation + Story Decomposition):

```
1. Load PRD and Architecture via SolutioningAgentContextBuilder
2. Invoke Bob agent: formEpics()
   ├─ Analyze PRD functional requirements
   ├─ Identify natural groupings (auth, payments, admin, etc.)
   ├─ Form 3-8 epics with business value naming
   └─ Output: Epic[] objects
3. For each Epic:
   ├─ Invoke Bob agent: decomposeIntoStories(epic)
   ├─ Generate 3-10 vertical-slice stories
   ├─ Write clear acceptance criteria (8-12 per story)
   ├─ Add technical notes (affected files, endpoints, data structures)
   └─ Output: Story[] objects
4. Validate story sizing (<500 words, <2 hours, single responsibility)
5. Return all epics and stories for next phase
```

**Story 4.5 Internal Sequence** (Dependency Detection + Graph Generation):

```
1. Load all stories from Story 4.4
2. Invoke Bob agent: detectDependencies(stories)
   ├─ Analyze technical dependencies
   ├─ Identify patterns: data models → logic, auth → protected features
   ├─ Mark hard vs soft dependencies
   └─ Output: DependencyEdge[]
3. Execute DependencyGraphGenerator
   ├─ Build graph nodes from stories
   ├─ Add dependency edges
   ├─ Calculate critical path (topological sort)
   ├─ Identify bottlenecks (stories blocking ≥3 others)
   ├─ Find parallelizable groups (no blocking dependencies)
   └─ Detect circular dependencies (error if found)
4. Save to docs/dependency-graph.json
5. Update sprint-status.yaml with graph timestamp
```

## Non-Functional Requirements

### Performance

**LLM Invocation Performance:**
- Bob agent context building: <5 seconds (token optimization to <30k)
- Epic formation: <30 seconds for 5-8 epics
- Story decomposition per epic: <60 seconds for 3-10 stories (total <10 minutes for all epics)
- Dependency detection: <30 seconds for 20-30 stories
- Graph generation: <3 seconds for 30 stories with 50 dependencies

**File I/O Performance:**
- Story file writing: <100ms per story (total <3 seconds for 30 stories)
- Sprint status YAML update: <200ms with atomic writes
- Dependency graph JSON write: <100ms

**Overall Workflow Performance:**
- Complete solutioning phase (10-20 stories): <1 hour from PRD/Architecture to ready-for-dev stories
- Foundation phase (Stories 4.1-4.3): 6-7 hours sequential
- Feature phase (Stories 4.4-4.9): 3-4 hours with 6 parallel worktrees (1.8x speedup vs sequential)

**Resource Constraints:**
- Max concurrent LLM requests: 1 (Bob agent sequential processing to maintain context quality)
- Memory usage: <500MB for solutioning workflow execution
- Disk space: <10MB for all generated files (epics, stories, dependency graph)

### Security

**LLM API Security:**
- Bob agent LLM API keys stored in `.bmad/.secrets.yaml` (gitignored)
- API keys loaded via environment variables at runtime
- No API keys in logs or error messages
- TLS/HTTPS for all LLM provider connections

**File System Security:**
- Generated story files written to project repository only (no external file writes)
- Atomic file writes prevent partial/corrupted files
- Git operations respect .gitignore patterns
- No execution of generated code in solutioning phase (only file writes)

**Input Validation:**
- PRD and Architecture markdown parsed safely (no code execution)
- Bob agent responses validated against schemas before persistence
- Story IDs validated (alphanumeric + hyphens only)
- File paths validated to prevent directory traversal

**Secrets Management:**
- LLM API keys never logged or included in generated files
- Sprint status YAML excludes sensitive project details
- Dependency graph contains only story IDs and relationships (no code snippets)

### Reliability/Availability

**Error Recovery:**
- Workflow state checkpointed after each major step (epic formation, story decomposition, validation)
- Resume from last checkpoint on crash/interruption
- Bob agent invocation retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- LLM provider failover: If Claude Haiku unavailable, escalate with alternative provider suggestion

**Validation and Quality Gates:**
- Story validation ensures all stories meet dev agent compatibility standards before proceeding
- Implementation readiness gate validates completeness with 100% required checks pass rate
- Circular dependency detection prevents invalid dependency graphs
- Schema validation for all JSON/YAML outputs

**Graceful Degradation:**
- If dependency detection fails: Generate stories without dependency graph (manual dependency review)
- If graph generation fails: Log warning, continue with stories only (manual visualization)
- If validation finds blockers: Halt workflow, display remediation steps (no auto-regeneration)

**State Consistency:**
- Atomic writes for sprint-status.yaml (write to .tmp, rename on success)
- Git commit after each phase completion (foundation, features, readiness gate)
- State rollback on validation failure (revert to previous checkpoint)

### Observability

**Logging:**
- Structured logs (JSON format) for all workflow steps with correlation IDs
- Log levels: DEBUG (agent prompts/responses), INFO (step execution), WARN (validation warnings), ERROR (failures)
- Key log events:
  - `solutioning.phase.started` (foundation | features)
  - `bob.agent.invoked` (method: formEpics | decomposeStories | detectDependencies)
  - `epics.formed` (count: N)
  - `stories.decomposed` (epic: X, count: N)
  - `dependency-graph.generated` (total_stories, parallelizable)
  - `validation.completed` (pass: true/false, score: 0.0-1.0)
  - `readiness-gate.result` (pass: true/false, blockers: [])

**Metrics:**
- Epic formation time (seconds)
- Story decomposition time per epic (seconds)
- Average story word count (target: <500)
- Average acceptance criteria per story (target: 8-12)
- Dependency graph complexity (total edges, critical path length, bottleneck count)
- Validation pass rate (%)
- Readiness gate pass rate (%)
- LLM token usage per invocation (input tokens, output tokens, estimated cost)

**Tracing:**
- Distributed trace context propagated through workflow steps
- Trace spans for each story 4.1-4.9 execution
- Bob agent invocations tagged with epic/story context
- Trace attributes: project_id, workflow_name, step_number, agent_name

**Cost Tracking:**
- Bob agent LLM costs tracked per invocation: formEpics ($0.50-1.00), decomposeStories ($0.30-0.50 per epic), detectDependencies ($0.20-0.40)
- Total solutioning phase cost: <$5 target
- Cost alerts if estimated total exceeds $10 (configurable threshold)

## Dependencies and Integrations

**Internal Dependencies:**

| Dependency | Component | Purpose | Version/Commit |
|------------|-----------|---------|----------------|
| Epic 1 Core Engine | `WorkflowEngine`, `AgentPool`, `LLMFactory`, `StateManager`, `WorktreeManager` | Foundation for solutioning workflow execution, Bob agent management, worktree operations | Completed |
| Epic 2 PRD | `docs/PRD.md` | Source of functional requirements for epic formation | Completed |
| Epic 3 Architecture | `docs/architecture.md` | Technical constraints and system design context | Completed |
| Epic 3 Story 3.5 | Test Strategy in Architecture | Required for readiness gate validation (Story 4.9) | Completed |

**External Dependencies:**

| Dependency | Purpose | Version | Installation |
|------------|---------|---------|--------------|
| `js-yaml` | YAML parsing for sprint-status.yaml | ^4.1.0 | npm install js-yaml |
| `ajv` | JSON schema validation for story schemas | ^8.12.0 | npm install ajv |
| `simple-git` | Git operations for worktree management | ^3.20.0 | npm install simple-git |
| `marked` | Markdown parsing for PRD/Architecture | ^9.1.0 | npm install marked |
| `@anthropic-ai/sdk` | Claude API for Bob agent (Haiku model) | ^0.24.0 | npm install @anthropic-ai/sdk |

**LLM Provider Integration:**
- Bob agent configured for Claude Haiku 3.5 (cost-effective, good at formulaic tasks)
- LLM assignment read from `.bmad/project-config.yaml`:
  ```yaml
  agents:
    bob:
      provider: anthropic
      model: claude-haiku-3-5
      temperature: 0.3
      max_tokens: 4096
  ```
- Supports alternative providers: OpenAI (GPT-4), Zhipu (GLM), Google (Gemini) via LLMFactory pattern

**File System Integration:**
- Read: `docs/PRD.md`, `docs/architecture.md`, `bmad/bmm/agents/bob.md`, `.bmad/project-config.yaml`
- Write: `docs/epics.md`, `docs/stories/story-*.md`, `docs/sprint-status.yaml`, `docs/dependency-graph.json`, `docs/readiness-gate-results.json`
- Git: Auto-commit after foundation phase, feature phase, and readiness gate

**Workflow Integration:**
- Invoked by orchestrator core after Epic 3 (Architecture) completes
- Invokes no sub-workflows (self-contained solutioning phase)
- Emits events for Epic 5 (Implementation) trigger: `readiness-gate.passed` event

## Acceptance Criteria (Authoritative)

1. **Data Models and Schemas (Story 4.1):**
   - TypeScript interfaces defined for Epic, Story, DependencyGraph, StoryMetadata, ValidationResult with complete fields
   - JSON schema validation implemented for all interfaces with ajv library
   - StoryTemplateBuilder class created with methods: buildFromTemplate(), validateStoryFormat(), toMarkdown(), toYAMLFrontmatter()
   - Sprint-status.yaml schema structure documented with comments
   - Dependency-graph.json schema structure documented with examples
   - Story template markdown file created at docs/templates/story-template.md
   - Unit tests cover schema validation and template builder methods (100% coverage)
   - Zero external dependencies beyond type definitions (pure data layer)
   - All types exported for use by Stories 4.2-4.9

2. **Bob Agent Infrastructure (Story 4.2):**
   - Bob persona loaded from bmad/bmm/agents/bob.md with full context
   - LLM assignments read from .bmad/project-config.yaml with support for multiple providers
   - SolutioningAgentContextBuilder class implemented with buildBobContext() method
   - Context includes PRD functional requirements, architecture overview, BMAD story patterns
   - Token optimization prunes PRD to <30k tokens for context efficiency
   - Agent invocation templates created: bobEpicFormationPrompt(), bobStoryDecompositionPrompt(), bobDependencyDetectionPrompt()
   - Integration with Story 4.1 types (Epic, Story schemas)
   - Agent factory registration in AgentPool from Epic 1
   - Methods defined: formEpics(), decomposeIntoStories(), detectDependencies() as agent actions
   - Stories sized for single agent session (<200k context)
   - Clear acceptance criteria written in generated stories (8-12 per story)
   - Autonomous decision-making with confidence scoring (threshold: 0.75)
   - Unit tests for context building and prompt generation

3. **Solutioning Workflow Engine (Story 4.3):**
   - SolutioningWorkflowEngine class extends WorkflowEngine from Epic 1
   - Workflow.yaml loaded from bmad/bmm/workflows/create-epics-and-stories/workflow.yaml
   - Workflow steps parsed and execution plan built
   - State machine transitions implemented: not_started → in_progress → review → complete
   - Progress tracking: current step, percentage, timestamps
   - Worktree management integrated: wt/solutioning branch for workflow execution
   - State persistence to bmad/workflow-status.yaml after each step
   - Pre/post step execution hooks implemented
   - Error handling with rollback capability
   - PRD.md and architecture.md read as inputs from Epic 2 & 3
   - Workflow-status.yaml updated with solutioning progress
   - Unit tests for workflow engine and state machine (80%+ coverage)
   - No actual epic/story generation (infrastructure only)

4. **Epic Formation and Story Decomposition (Story 4.4):**
   - Bob agent invoked via SolutioningAgentContextBuilder
   - PRD functional requirements analyzed and natural groupings identified
   - 3-8 epics formed with business value naming (not technical components)
   - Each epic independently valuable and completable in 1-2 sprints
   - Epic descriptions include goals and value propositions
   - 3-10 stories generated per epic in user story format (As a..., I want..., So that...)
   - Stories are vertical slices with end-to-end functionality
   - Story descriptions <500 words with single responsibility
   - Technical notes included: affected files, endpoints, data structures
   - Story sizing validated: fits in 200k context, <2 hour development time
   - Large stories automatically split into smaller stories
   - Epic and Story types from Story 4.1 used
   - 10-20 total stories generated for MVP
   - Autonomous decisions on story boundaries with confidence scoring
   - 8-12 clear acceptance criteria per story
   - Complete epic formation + story decomposition in <45 minutes
   - Unit tests + integration tests with mock Bob responses

5. **Dependency Detection and Graph Generation (Story 4.5):**
   - Bob agent's detectDependencies() method invoked
   - Technical dependencies analyzed (auth before protected features, data models before logic, API before frontend)
   - Dependency graph built with topological sort
   - Stories phased: Foundation → Core → Enhancement → Growth
   - Stories that can run in parallel marked clearly
   - Blocking dependencies flagged
   - Implementation sequence recommendations generated
   - DependencyGraphGenerator class implemented
   - Dependency edges created from story prerequisites (hard vs soft dependencies)
   - Graph structure complete: nodes (all stories with metadata), edges (dependency relationships with type)
   - Graph metrics calculated: critical path, bottlenecks (stories blocking ≥3 others), parallelizable stories
   - Circular dependencies detected and escalated if found
   - Graph saved to docs/dependency-graph.json in specified JSON format
   - Sprint-status.yaml updated with graph generation timestamp
   - Complete dependency detection + graph generation in <30 seconds
   - Metrics tracked: graph complexity, critical path length, bottleneck count
   - Unit tests + integration tests

6. **Story Validation (Story 4.6):**
   - StoryValidator class implemented
   - SIZE CHECK: <500 words, single responsibility, no hidden complexity validated
   - CLARITY CHECK: explicit acceptance criteria, clear technical approach, measurable success validated
   - DEPENDENCY CHECK: dependencies documented, clear inputs/outputs validated
   - COMPLETENESS CHECK: all required info for autonomous implementation validated
   - Failed stories regenerated or split automatically
   - Validation report generated with quality score (0.0-1.0)
   - 100% stories pass validation before workflow completion enforced
   - Story and ValidationResult types from Story 4.1 used
   - Unit tests + integration tests

7. **Sprint Status File Generation (Story 4.7):**
   - bmad/sprint-status.yaml generated with schema from Story 4.1
   - Project metadata included: name, phase
   - Workflow tracking included: current, step, status
   - Epics array with stories nested
   - Story fields populated: id, name, status, worktree, pr_number, assigned_agent
   - All stories initialized with status: pending
   - Dependencies tracked in story metadata
   - Status updates supported during implementation
   - Human-readable format with inline comments
   - Git commit after generation
   - Unit tests for sprint status generation

8. **Story File Writer and Epics Document (Story 4.8):**
   - StoryFileWriter class implemented
   - StoryTemplateBuilder from Story 4.1 used for formatting
   - docs/epics.md generated with all epic descriptions and stories overview
   - Individual docs/stories/story-*.md files generated with YAML frontmatter
   - Frontmatter includes: id, epic, title, status, dependencies, acceptance_criteria
   - File naming: story-001.md, story-002.md, etc.
   - Story schema from Story 4.1 used for validation
   - docs/stories/ directory created if doesn't exist
   - Git commit after story files generation
   - Metrics tracked: number of files written, write time
   - Unit tests for file writing logic
   - Integration tests with mock file system

9. **Implementation Readiness Gate (Story 4.9):**
   - ImplementationReadinessValidator class implemented
   - Executes automatically after Stories 4.4-4.8 complete
   - Comprehensive validation checks performed:
     - Story Completeness: 8-12 acceptance criteria, <500 words, valid epic assignments, prerequisites documented
     - Dependency Validity: no circular dependencies, all prerequisites exist, dependency graph complete
     - Story Sizing: single responsibility, reasonable complexity (<2 hours), no scope creep
     - Test Strategy: defined in architecture.md, test stories present, ATDD documented
     - Critical Path: calculated, bottlenecks identified (warning), parallelization opportunities noted (info)
     - Sprint Status: sprint-status.yaml correct, all stories present
   - ReadinessGateResult generated (using type from Story 4.1): pass/fail status, overall score, detailed check results, blocker list, warning list, remediation recommendations
   - Gate failure (<100% required checks): detailed blocker report, escalation to user, blocks transition to Epic 5
   - Gate pass: workflow-status.yaml updated (readiness_gate: passed), validation logged to docs/readiness-gate-results.json, proceed to Epic 5
   - Warnings (non-blocking): warning summary displayed, implementation continues, warnings logged
   - Metrics tracked: gate pass rate, common blockers, time to remediate, warning frequency
   - Complete validation in <3 minutes
   - Unit tests + integration tests

## Traceability Mapping

| AC# | Spec Section | Components/APIs | Test Idea |
|-----|--------------|-----------------|-----------|
| 1 | Data Models - Epic, Story, DependencyGraph interfaces | `src/solutioning/types.ts`, ajv schemas | Unit test schema validation with valid/invalid inputs |
| 1 | Data Models - StoryTemplateBuilder | `StoryTemplateBuilder.buildFromTemplate()`, `validateStoryFormat()`, `toMarkdown()`, `toYAMLFrontmatter()` | Unit test template building with mock story data |
| 2 | Bob Agent - Persona loading | `bmad/bmm/agents/bob.md`, `SolutioningAgentContextBuilder.buildBobContext()` | Unit test context building with PRD/Architecture fixtures |
| 2 | Bob Agent - LLM assignment | `.bmad/project-config.yaml`, `LLMFactory.createClient()` | Unit test multi-provider support with mock configs |
| 2 | Bob Agent - Agent methods | `formEpics()`, `decomposeIntoStories()`, `detectDependencies()` | Integration test with mock LLM responses |
| 3 | Workflow Engine - State machine | `SolutioningWorkflowEngine.executeStep()`, state transitions | Unit test state transitions with mock steps |
| 3 | Workflow Engine - Worktree management | `WorktreeManager.createWorktree()`, `destroyWorktree()` | Integration test with test git repository |
| 3 | Workflow Engine - State persistence | `StateManager.saveState()`, bmad/workflow-status.yaml | Unit test atomic writes with failure simulation |
| 4 | Epic Formation - Epic generation | `formEpics()` method, Bob agent invocation | Integration test with real PRD, verify 3-8 epics formed |
| 4 | Story Decomposition - Story generation | `decomposeIntoStories()` method, Bob agent invocation | Integration test with mock epic, verify 3-10 stories generated with AC |
| 5 | Dependency Detection - Dependency analysis | `detectDependencies()` method, Bob agent invocation | Integration test with mock stories, verify hard/soft dependencies detected |
| 5 | Graph Generation - Metrics calculation | `DependencyGraphGenerator.generate()`, critical path algorithm | Unit test with known dependency graph, verify critical path correctness |
| 5 | Graph Generation - Circular dependency detection | `DependencyGraphGenerator.detectCircularDependencies()` | Unit test with circular dependency input, expect error |
| 6 | Story Validation - Size/Clarity/Dependency checks | `StoryValidator.validateStory()` | Unit test with valid/invalid stories, verify validation results |
| 6 | Story Validation - Validation report | `ValidationResult` generation | Unit test with failed stories, verify blockers/warnings populated |
| 7 | Sprint Status - YAML generation | `SprintStatusGenerator.generate()`, docs/sprint-status.yaml | Integration test, verify YAML structure and content |
| 8 | Story File Writer - Individual story files | `StoryFileWriter.writeStoryFile()`, docs/stories/story-*.md | Integration test, verify file creation with correct frontmatter |
| 8 | Story File Writer - Epics document | `StoryFileWriter.writeEpicsDocument()`, docs/epics.md | Integration test, verify epics document structure |
| 9 | Readiness Gate - Comprehensive validation | `ImplementationReadinessValidator.validate()`, all validation checks | Integration test with complete solutioning output, verify pass/fail |
| 9 | Readiness Gate - Blocker escalation | Readiness gate failure handling | Integration test with incomplete stories, verify escalation message |

## Risks, Assumptions, Open Questions

**Risks:**

1. **Risk**: Bob agent LLM (Claude Haiku) may generate inconsistent story quality
   - **Mitigation**: Story validation (Story 4.6) catches quality issues, regeneration required if validation fails
   - **Monitoring**: Track validation pass rate, adjust LLM temperature or prompts if <90% pass rate

2. **Risk**: Dependency detection may miss non-obvious dependencies
   - **Mitigation**: Human review of dependency graph after generation, manual addition of missing dependencies
   - **Fallback**: If graph generation fails, proceed with stories only (manual dependency tracking)

3. **Risk**: Circular dependencies in generated stories block implementation
   - **Mitigation**: Circular dependency detection in Story 4.5 escalates immediately, requires manual resolution
   - **Prevention**: Bob agent prompts emphasize acyclic dependency structures

4. **Risk**: Story decomposition generates stories too large for autonomous implementation
   - **Mitigation**: Story validation size check enforces <500 words, <2 hours, single responsibility
   - **Auto-remediation**: If story too large, Bob agent invoked to split story (Story 4.4)

5. **Risk**: Readiness gate false negatives block valid implementation
   - **Mitigation**: Configurable validation thresholds, manual override option for non-blocking warnings
   - **Monitoring**: Track false negative rate, adjust validation criteria if too strict

**Assumptions:**

1. **Assumption**: PRD and Architecture (Epic 2 & 3) are complete and high quality
   - **Validation**: PRD completeness checked in Epic 2, Architecture completeness checked in Epic 3
   - **Impact if false**: Low-quality inputs → Low-quality stories → Readiness gate failures

2. **Assumption**: Bob agent (Claude Haiku) can consistently generate 8-12 acceptance criteria per story
   - **Validation**: Story validation checks AC count, regeneration if <8 or >12
   - **Impact if false**: Manual AC writing required, increased solutioning phase time

3. **Assumption**: 10-20 stories sufficient for MVP implementation
   - **Validation**: PRD scope determines story count, may be more or fewer based on complexity
   - **Impact if false**: If >30 stories, solutioning phase may exceed 1 hour target

4. **Assumption**: Git worktree manager from Epic 1 supports parallel feature development
   - **Validation**: Epic 1 tests cover worktree creation/deletion
   - **Impact if false**: Feature stories (4.4-4.9) must run sequentially, no 1.8x speedup

5. **Assumption**: Story file format (markdown with YAML frontmatter) is stable
   - **Validation**: Story template in Story 4.1 defines canonical format
   - **Impact if false**: File writer logic must change, potential breakage in Epic 5 story consumption

**Open Questions:**

1. **Question**: Should dependency graph visualization be included in Epic 4 or deferred to Epic 6?
   - **Decision**: Defer to Epic 6 (Dashboard). Epic 4 generates graph data only (JSON), Epic 6 renders visualization
   - **Rationale**: Separates data generation from UI concerns, enables parallel development

2. **Question**: What is the optimal LLM model for Bob agent (cost vs quality)?
   - **Decision**: Start with Claude Haiku 3.5 (cost-effective), monitor story quality, adjust if needed
   - **Experiment**: A/B test Haiku vs Sonnet for epic formation, measure quality and cost difference

3. **Question**: Should story regeneration be automatic or require human approval?
   - **Decision**: Story validation failures require human review and manual regeneration
   - **Rationale**: Prevents infinite regeneration loops, human judgment needed for quality assessment

4. **Question**: How to handle edge cases where no clear story boundaries exist?
   - **Decision**: Bob agent uses confidence scoring, escalates if confidence <0.75 on story boundary decision
   - **Fallback**: Human defines story boundaries manually, Bob agent implements decomposition

5. **Question**: Should epic/story IDs be numeric (1, 2, 3) or semantic (auth, payments)?
   - **Decision**: Numeric IDs with semantic titles (e.g., "4-1: Solutioning Data Models & Story Schema")
   - **Rationale**: Numeric IDs enable sequential ordering and easy reference, titles provide semantic meaning

## Test Strategy Summary

**Unit Testing:**
- All TypeScript classes and methods tested in isolation (target: 80%+ coverage)
- Mock external dependencies: LLM API calls, file system operations, git operations
- Test frameworks: Jest for unit tests, ts-jest for TypeScript support
- Key test suites:
  - Data models: Schema validation with valid/invalid inputs
  - Template builder: Story formatting and frontmatter generation
  - Context builder: Token optimization and prompt generation
  - Dependency graph: Critical path calculation, bottleneck detection, circular dependency detection
  - Story validator: Size/clarity/dependency/completeness checks
  - Readiness gate: All validation categories with pass/fail scenarios

**Integration Testing:**
- Test interactions between solutioning components with real file system and git operations (test repository)
- Mock only external LLM API calls (use fixture responses)
- Key integration tests:
  - End-to-end solutioning workflow: PRD → Epics → Stories → Dependency Graph → Validation → Files
  - Bob agent invocation with context building and response parsing
  - Worktree creation and cleanup for parallel story development
  - Sprint status YAML generation and updates
  - Story file writing with correct frontmatter and structure
  - Readiness gate validation with complete solutioning output

**Story-Level Testing:**
- Each story (4.1-4.9) includes unit tests and integration tests as acceptance criteria
- Test coverage reports generated per story
- Test execution as part of story DoD (Definition of Done)

**Manual Testing:**
- Human review of generated epics and stories for quality and coherence
- Dependency graph visualization (manual inspection of JSON output until Epic 6 UI available)
- Readiness gate validation results reviewed for false positives/negatives
- LLM prompt tuning based on story quality feedback

**Performance Testing:**
- Measure solutioning workflow end-to-end time (target: <1 hour)
- Measure LLM invocation latency (Bob agent methods)
- Measure file I/O performance (story file writes, YAML updates)
- Load testing: Generate stories for large PRD (50+ functional requirements)

**Test Automation:**
- All unit and integration tests run in CI/CD pipeline
- Story validation and readiness gate executed automatically in workflow
- Test results logged and reported in workflow-status.yaml

**Test Data:**
- Fixture PRD and Architecture documents for repeatable testing
- Mock LLM responses for deterministic integration tests
- Known-good dependency graphs for validation testing
