# Commands and Workflows

## Important Context

⚠️ **This project is in PLANNING phase** - No build/test/run commands exist yet. The project structure and workflows are defined in the architecture documents, but implementation hasn't started.

## BMAD Agent Commands

**Note:** These are executed within Claude Code or IDE with BMAD support.

### Core Workflows

```bash
# Check workflow status and recommendations
*workflow-status

# Initialize new BMM project workflow
*workflow-init

# Document existing brownfield codebase
*document-project
```

### Product Management (Mary, John)
```bash
# Create Product Brief (interactive)
*product-brief

# Create PRD (Product Requirements Document)
*prd

# Research (market, technical, competitive)
*research

# Brainstorm project ideas
*brainstorm-project
```

### Architecture (Winston)
```bash
# Create system architecture
*architecture

# Validate architecture completeness
*validate-architecture

# Check solutioning gate (PRD + Architecture alignment)
*solutioning-gate-check
```

### Test Architecture (Murat/Tea)
```bash
# Initialize test framework (Playwright/Cypress)
*framework

# Generate E2E tests first (ATDD approach)
*atdd

# Generate test automation
*automate

# Create test scenarios
*test-design

# Map requirements to tests + quality gate decision
*trace

# Validate non-functional requirements
*nfr-assess

# Scaffold CI/CD quality pipeline
*ci

# Review test quality
*test-review
```

### Implementation (Bob, Amelia)
```bash
# Generate epic breakdown and stories
*create-epics-and-stories

# Create next user story
*create-story

# Execute a story (implement + test)
*dev-story

# Mark story ready for development
*story-ready

# Mark story done
*story-done

# Generate story context
*story-context

# Perform code review
*code-review

# Handle course corrections during sprint
*correct-course

# Sprint planning (extract epics/stories, track status)
*sprint-planning

# Sprint retrospective
*retrospective
```

### UX Design (Sally)
```bash
# Create comprehensive UX design
*create-ux-design

# Create narrative design (story-driven games/apps)
*narrative
```

### BMAD Builder (Meta - for creating workflows/agents)
```bash
# Create new workflow
*create-workflow

# Edit existing workflow
*edit-workflow

# Audit workflow quality
*audit-workflow

# Create new agent
*create-agent

# Edit existing agent
*edit-agent

# Create new BMAD module
*create-module

# Edit existing module
*edit-module

# Generate/update documentation
*redoc

# Convert legacy workflows to BMAD v6
*convert-legacy
```

### Creative & Innovation (CIS Module)
```bash
# Brainstorming session
*brainstorming

# Storytelling (narrative frameworks)
*storytelling

# Problem-solving (systematic methodologies)
*problem-solving

# Design thinking process
*design-thinking

# Innovation strategy (disruption, business models)
*innovation-strategy
```

### Multi-Agent Collaboration
```bash
# Party mode - engage all agents in group discussion
*party-mode
```

## Planned Development Commands

**Note:** These will be implemented in the Agent Orchestrator project.

### Orchestrator Management (Future)
```bash
# Start orchestrator for a project
npm run orchestrator -- start --project <project-id>

# Pause orchestrator
npm run orchestrator -- pause --project <project-id>

# Resume orchestrator
npm run orchestrator -- resume --project <project-id>

# Check orchestrator status
npm run orchestrator -- status --project <project-id>

# Execute specific workflow
npm run orchestrator -- start-workflow \
  --project <project-id> \
  --workflow <workflow-path>
```

### Development Commands (Future)
```bash
# Install dependencies
npm install

# Development server (API + Dashboard)
npm run dev

# Build for production
npm run build

# Run tests
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only

# Lint and format
npm run lint              # Check code style
npm run lint:fix          # Fix code style issues
npm run format            # Format code with Prettier

# Type checking
npm run type-check        # TypeScript type checking
```

### Git Commands

```bash
# Standard git workflow
git status
git add <files>
git commit -m "message"
git push

# Worktree management (for parallel story development)
git worktree add /wt/story-001 -b story/001
git worktree list
git worktree remove /wt/story-001
```

## System Commands (Linux)

```bash
# File operations
ls -la                    # List files with details
find . -name "*.ts"       # Find TypeScript files
grep -r "pattern" ./src   # Search in source files

# Process management
ps aux | grep node        # List Node.js processes
kill -9 <pid>             # Kill process

# Disk usage
df -h                     # Disk space
du -sh ./                 # Directory size

# System info
uname -a                  # System information
cat /etc/os-release       # OS version
```

## BMAD Workflow Engine Concepts

### Workflow Execution
1. Load `workflow.yaml` - Configuration and variables
2. Load `instructions.md` - Step-by-step execution logic
3. Resolve variables from config
4. Execute steps in order
5. Handle template outputs, elicitations, and escalations
6. Save state after each step

### XML Tags in Instructions
```xml
<action>Perform this action</action>
<action if="condition">Conditional action</action>
<check if="condition">Block wrapper</check>
<ask>Get user input</ask>
<goto step="X">Jump to step</goto>
<invoke-workflow>Call another workflow</invoke-workflow>
<template-output>Save content checkpoint</template-output>
<elicit-required>Trigger enhancement</elicit-required>
```

## When Task is Completed

**For BMAD Documentation Projects:**
1. Validate generated documents against templates
2. Check workflow status (`bmad/workflow-status.md`)
3. Ensure all artifacts saved to `{output_folder}` (typically `docs/`)
4. Commit changes to git with descriptive message

**For Agent Orchestrator Implementation (Future):**
1. Run linters: `npm run lint`
2. Run formatters: `npm run format`
3. Run tests: `npm test`
4. Run type checking: `npm run type-check`
5. Review code changes
6. Commit with conventional commit message format
7. Push to repository (triggers CI/CD)

## Environment Setup

**Current Development:**
- Node.js 20 LTS (check: `node --version`)
- TypeScript 5+ (when project initialized)
- Git 2.30+ (for worktree support)

**IDE Configuration:**
- Claude Code with BMAD agents loaded
- TypeScript language server enabled
- Serena MCP activated for code analysis
