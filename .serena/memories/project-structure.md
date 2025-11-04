# Project Structure

## Root Directory Layout

```
agent-orchestrator/
├── .bmad/                    # BMAD project configuration
│   └── project-config.yaml   # Agent LLM assignments, onboarding
├── .claude/                  # Claude Code IDE agents/commands
├── .gemini/                  # Gemini IDE commands
├── .serena/                  # Serena MCP memories
├── bmad/                     # BMAD framework modules
│   ├── bmb/                  # BMad Builder module (workflow/agent creation)
│   ├── bmm/                  # BMad Method module (core development)
│   ├── cis/                  # Creative & Innovation Strategy module
│   ├── core/                 # BMAD core tasks and workflows
│   └── _cfg/                 # BMAD configuration manifests
├── docs/                     # Project documentation and outputs
│   ├── stories/              # User stories (implementation artifacts)
│   ├── research/             # Research documents
│   ├── architecture.md       # System architecture document
│   ├── PRD.md                # Product Requirements Document
│   ├── epics.md              # Epic breakdown
│   └── *.md                  # Other documentation
├── src/                      # Source code (to be created)
│   ├── core/                 # Core orchestrator components
│   ├── services/             # Business logic services
│   ├── api/                  # REST API implementation
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── tests/                    # Test suite (to be created)
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── dashboard/                # React PWA dashboard (to be created)
│   ├── src/                  # Dashboard source code
│   └── dist/                 # Built dashboard
├── wt/                       # Git worktrees (runtime, not in git)
│   ├── story-001/            # Worktree for story 1
│   ├── story-002/            # Worktree for story 2
│   └── ...
├── package.json              # Node.js dependencies (to be created)
├── tsconfig.json             # TypeScript configuration (to be created)
└── README.md                 # Project README (to be created)
```

## BMAD Framework Structure

### BMB Module (`bmad/bmb/`)
**Purpose:** BMad Builder - Tools for creating and managing BMAD modules, workflows, and agents

```
bmad/bmb/
├── agents/
│   └── bmad-builder.md       # BMad Builder agent persona
├── workflows/
│   ├── create-workflow/      # Workflow creation workflow
│   ├── create-agent/         # Agent creation workflow
│   ├── create-module/        # Module creation workflow
│   ├── edit-workflow/        # Workflow editing workflow
│   ├── audit-workflow/       # Workflow quality audit
│   └── redoc/                # Documentation generation
└── config.yaml               # BMB configuration
```

### BMM Module (`bmad/bmm/`)
**Purpose:** BMad Method - Core development methodology with agents and workflows

```
bmad/bmm/
├── agents/                   # BMAD development agents
│   ├── tea.md                # Murat - Test Architect
│   ├── architect.md          # Winston - System Architect
│   ├── dev.md                # Amelia - Developer
│   ├── pm.md                 # John - Product Manager
│   ├── analyst.md            # Mary - Business Analyst
│   ├── sm.md                 # Bob - Scrum Master
│   ├── ux-designer.md        # Sally - UX Designer
│   └── paige.md              # Paige - Documentation Specialist
├── workflows/
│   ├── 1-analysis/           # Phase 1: Product Brief, Research
│   │   ├── product-brief/
│   │   ├── research/
│   │   └── brainstorm-project/
│   ├── 2-plan-workflows/     # Phase 2: PRD, Tech Spec, UX Design
│   │   ├── prd/
│   │   ├── tech-spec/
│   │   ├── narrative/
│   │   └── create-ux-design/
│   ├── 3-solutioning/        # Phase 3: Architecture, Epics/Stories
│   │   ├── architecture/
│   │   └── solutioning-gate-check/
│   ├── 4-implementation/     # Phase 4: Story Development
│   │   ├── dev-story/
│   │   ├── create-story/
│   │   ├── story-context/
│   │   ├── code-review/
│   │   └── sprint-planning/
│   ├── testarch/             # Testing workflows (Tea's domain)
│   │   ├── framework/        # Test framework setup
│   │   ├── atdd/             # Test-first development
│   │   ├── automate/         # Test automation
│   │   ├── test-design/      # Test scenario creation
│   │   ├── ci/               # CI/CD pipeline
│   │   └── test-review/      # Test quality review
│   └── workflow-status/      # Workflow tracking
├── testarch/                 # Test architecture knowledge base
│   └── knowledge/            # Best practices, patterns
├── docs/                     # BMM documentation
└── config.yaml               # BMM configuration
```

### CIS Module (`bmad/cis/`)
**Purpose:** Creative & Innovation Strategy - Brainstorming, design thinking, problem-solving

```
bmad/cis/
├── agents/
│   ├── brainstorming-coach.md
│   ├── storyteller.md
│   ├── creative-problem-solver.md
│   ├── innovation-strategist.md
│   └── design-thinking-coach.md
├── workflows/
│   ├── brainstorming/
│   ├── storytelling/
│   ├── problem-solving/
│   ├── design-thinking/
│   └── innovation-strategy/
└── config.yaml
```

### Core Module (`bmad/core/`)
**Purpose:** BMAD core functionality - Tasks, workflows, master orchestrator

```
bmad/core/
├── agents/
│   └── bmad-master.md        # Master orchestrator agent
├── tasks/
│   ├── workflow.xml          # Workflow execution engine
│   ├── adv-elicit.xml        # Advanced elicitation
│   ├── validate-workflow.xml # Workflow validation
│   └── index-docs.xml        # Documentation indexing
├── workflows/
│   ├── party-mode/           # Multi-agent collaboration
│   └── brainstorming/        # Brainstorming sessions
└── tools/
    └── shard-doc.xml         # Document splitting tool
```

## State Files

### Project Configuration
```yaml
# .bmad/project-config.yaml
project:
  name: "Agent orchestrator"
  id: "agent-orchestrator-001"
  level: 3
  repository: "https://github.com/user/agent-orchestrator"

agents:
  mary: "claude-sonnet-4-5"      # Analyst
  winston: "claude-sonnet-4-5"   # Architect
  amelia: "gpt-4-turbo"          # Developer
  murat: "claude-sonnet-4-5"     # Test Architect
  bob: "claude-haiku-4"          # Scrum Master

onboarding:
  - docs/onboarding/coding-standards.md
  - docs/onboarding/architecture-principles.md
```

### Workflow Status
```yaml
# bmad/sprint-status.yaml
project:
  name: "Agent orchestrator"
  phase: "planning"  # analysis | planning | solutioning | implementation

workflow:
  current: "bmad/bmm/workflows/architecture/workflow.yaml"
  step: 12
  status: "in_progress"

epics:
  - id: "epic-001"
    name: "Foundation"
    status: "pending"
```

## Documentation Structure

```
docs/
├── architecture.md           # System architecture (Winston's output)
├── PRD.md                    # Product requirements (Mary + John's output)
├── epics.md                  # Epic breakdown (Bob's output)
├── technical-design.md       # Detailed technical design
├── stories/                  # Individual story files
│   ├── story-001.md
│   ├── story-002.md
│   └── ...
├── research/                 # Research documents
│   └── *.md
└── bmm-workflow-status.yaml  # Current workflow state
```

## Key Path Variables

**BMAD uses these path conventions:**
- `{project-root}` - Project root directory (resolved at runtime)
- `{installed_path}` - Path where workflow/module is installed
- `{config_source}:variable` - Load from config file

**Example:**
```yaml
output_folder: "{project-root}/docs"
instructions: "{installed_path}/instructions.md"
user_name: "{config_source}:user_name"
```
