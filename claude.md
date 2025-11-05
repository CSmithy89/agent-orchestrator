# Claude AI Assistant - Agent Orchestrator Project Guide

**Last Updated**: 2025-11-04  
**Project**: Agent Orchestrator - Autonomous BMAD Workflow Execution System  
**Purpose**: This document guides Claude AI assistants in understanding project preferences, workflows, and available tools

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Development Philosophy](#development-philosophy)
3. [Workflows & Methodologies](#workflows--methodologies)
4. [MCP Tools Available](#mcp-tools-available)
5. [Git Workflow](#git-workflow)
6. [Testing Strategy](#testing-strategy)
7. [Code Style & Preferences](#code-style--preferences)
8. [Communication Preferences](#communication-preferences)

---

## 🎯 Project Overview

### What We're Building

**Agent Orchestrator** - An autonomous system that executes BMAD (Build-Measure-Analyze-Decide) workflows for 24/7 software development using AI agents.

### Key Features
- Multi-agent orchestration (Mary, Winston, Amelia, Bob, etc.)
- Autonomous PRD, Architecture, and Story generation
- Git worktree parallelism for simultaneous story development
- Confidence-based decision making (85%+ autonomous)
- Real-time monitoring via PWA dashboard

### Technology Stack
- **Backend**: Node.js 20 LTS, TypeScript 5+, Fastify 4+
- **Frontend**: React 18+, Vite 5+, shadcn/ui, Tailwind CSS 3+, tweakcn
- **LLM Integration**: Anthropic SDK (Claude), OpenAI SDK (GPT-4)
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **CI/CD**: GitHub Actions with burn-in loop

### Project Structure
```
agent-orchestrator/
├── backend/          # Node.js/TypeScript orchestration engine
├── dashboard/        # React/Vite PWA dashboard
├── tests/           # E2E tests (Playwright)
├── bmad/            # BMAD framework (agents, workflows, tasks)
├── docs/            # Documentation (PRD, Architecture, Epics)
├── scripts/         # Helper scripts (worktree, CI, burn-in)
└── .github/         # CI/CD workflows
```

---

## 💡 Development Philosophy

### Core Principles

1. **Test-First Development**
   - ATDD (Acceptance Test-Driven Development) for complex stories
   - Tests written BEFORE implementation (RED → GREEN → REFACTOR)
   - TDD-guard hook enforces test existence before commits

2. **Quality Gates**
   - CI/CD pipeline with 5 stages
   - Burn-in loop (10 iterations) catches flaky tests
   - CodeRabbit AI reviews every PR
   - Branch protection requires PR approval + CI pass

3. **Parallel Development**
   - Git worktrees for simultaneous story development
   - Each story in isolated directory
   - Zero branch-switching overhead

4. **Documentation-Driven**
   - PRD drives all requirements
   - Architecture document defines technical decisions
   - Epics break down into granular stories
   - ATDD checklists guide implementation

5. **Autonomous by Default**
   - AI makes 85%+ of decisions
   - Escalates only when confidence < threshold
   - Agents operate 24/7 without human intervention

---

## 🔄 Workflows & Methodologies

### BMAD Methodology (4 Phases)

#### Phase 1: Analysis
- **Brainstorming** (`/bmad:bmm:workflows:brainstorming`)
- **Research** (`/bmad:bmm:workflows:research`)
- **Product Brief** (`/bmad:bmm:workflows:product-brief`)

#### Phase 2: Planning
- **PRD Creation** (`/bmad:bmm:workflows:prd`)
- **UX Design** (`/bmad:bmm:workflows:create-ux-design`) - if applicable
- **Architecture** (`/bmad:bmm:workflows:architecture`)

#### Phase 3: Solutioning
- **Epic & Story Creation** (`/bmad:bmm:workflows:create-epics-and-stories`)
- **Solutioning Gate Check** (`/bmad:bmm:workflows:solutioning-gate-check`)
- **Sprint Planning** (`/bmad:bmm:workflows:sprint-planning`)

#### Phase 4: Implementation
- **Story Development** (`/bmad:bmm:workflows:dev-story`)
- **Code Review** (`/bmad:bmm:workflows:code-review`)
- **Retrospective** (`/bmad:bmm:workflows:retrospective`)

### Test Architect (TEA) Workflows

**When to Use**: Complex infrastructure stories, new patterns, high-risk changes

#### Available TEA Workflows:

1. **`/bmad:bmm:workflows:testarch/framework`**
   - Initialize test framework (Playwright/Cypress)
   - Called: Once per project (✅ Complete)

2. **`/bmad:bmm:workflows:testarch/ci`**
   - Setup CI/CD pipeline with burn-in loop
   - Called: Once per project (✅ Complete)

3. **`/bmad:bmm:workflows:testarch/atdd`** ⭐ **CRITICAL**
   - Generate acceptance tests BEFORE implementation
   - Use for: 40-50% of stories (complex ones)
   - Outputs: Failing tests (RED phase) + implementation checklist
   - Decision Tree:
     - Story has >3 acceptance criteria? → Use ATDD
     - Complex logic/algorithms? → Use ATDD
     - First of its kind? → Use ATDD
     - Simple CRUD? → Skip ATDD, use manual TDD

4. **`/bmad:bmm:workflows:testarch/test-design`**
   - Design test strategy for complex features
   - Called: During Epic 1+ for complex components

5. **`/bmad:bmm:workflows:testarch/automate`**
   - Test automation patterns (data factories, mocks)
   - Called: Epic 2+ when test suite >50 tests

### TDD Red-Green-Refactor Cycle

#### RED Phase (TEA Agent)
- Write failing tests first
- Tests define expected behavior
- Tests fail due to missing implementation (correct!)

#### GREEN Phase (Developer/Claude)
- Implement minimal code to pass tests
- One test at a time
- No over-engineering

#### REFACTOR Phase (Developer/Claude)
- Improve code quality with confidence
- Tests provide safety net
- Extract duplications, optimize

---

## 🛠️ MCP Tools Available

**CRITICAL**: Claude has access to powerful MCP (Model Context Protocol) servers. Use them proactively!

### 1. Serena - Semantic Code Understanding ⭐⭐⭐

**Purpose**: Semantic codebase analysis and editing (symbol-level, not text-level)

**Key Tools**:
- `find_symbol(name_path, relative_path)` - Find classes, functions, methods by name
- `get_symbols_overview(relative_path)` - Get file structure overview
- `find_referencing_symbols(name_path, relative_path)` - Find all references
- `replace_symbol_body(name_path, relative_path, body)` - Update symbol implementation
- `insert_after_symbol()` / `insert_before_symbol()` - Add new code
- `rename_symbol(name_path, relative_path, new_name)` - Rename with refactoring
- `search_for_pattern(substring_pattern, relative_path)` - Regex search
- `list_dir(relative_path, recursive)` - List directory contents

**When to Use**:
- ✅ Reading code: Use `get_symbols_overview` BEFORE reading full files
- ✅ Finding implementations: Use `find_symbol` instead of grepping
- ✅ Understanding relationships: Use `find_referencing_symbols`
- ✅ Refactoring: Use `rename_symbol` for safe renames
- ✅ Targeted edits: Use `replace_symbol_body` for precise changes
- ❌ DON'T: Read entire files unless necessary (token-inefficient!)

**Language Support**: TypeScript, JavaScript, Python, Go, Rust, C/C++, Java, PHP

**Example Workflow**:
```typescript
// 1. Get overview of file
serena.get_symbols_overview("backend/src/config/ProjectConfig.ts")

// 2. Find specific method
serena.find_symbol("ProjectConfig/load", "backend/src/config/ProjectConfig.ts", {
  include_body: true,
  depth: 0
})

// 3. Find all usages
serena.find_referencing_symbols("ProjectConfig/load", "backend/src/config/ProjectConfig.ts")

// 4. Edit method
serena.replace_symbol_body(
  "ProjectConfig/load",
  "backend/src/config/ProjectConfig.ts",
  newImplementation
)
```

**Important Notes**:
- Serena reads code SYMBOLICALLY (understands classes, methods)
- Much faster and more accurate than text-based search
- ALWAYS use for TypeScript/JavaScript codebase exploration

---

### 2. Playwright MCP - Browser Automation ⭐⭐

**Purpose**: Browser automation via accessibility tree (not screenshots)

**Key Tools**:
- `browser_navigate(url)` - Navigate to page
- `browser_snapshot()` - Capture accessibility snapshot
- `browser_click(element, ref)` - Click elements
- `browser_type(element, ref, text)` - Fill inputs
- `browser_evaluate(function)` - Run JavaScript
- `browser_take_screenshot()` - Visual snapshot

**When to Use**:
- ✅ E2E test creation via recording mode
- ✅ Testing dashboard UI interactions
- ✅ Debugging test failures (snapshots + traces)
- ✅ Validating accessibility
- ❌ DON'T: Use for simple unit tests

**Test Generation Workflow** (ATDD Recording Mode):
```
1. browser_navigate("/dashboard")
2. browser_click("Login button", ref="...")
3. browser_type("Email input", ref="...", "test@example.com")
4. browser_take_screenshot() # Verify state
5. Generate test file with interactions
```

**Integration**: Works with `tests/e2e/*.spec.ts` (Playwright config already set up)

---

### 3. DeepWiki - GitHub Documentation ⭐⭐

**Purpose**: AI-powered documentation for any GitHub repository

**Key Tools**:
- `read_wiki_structure(repoName)` - Get documentation topics
- `read_wiki_contents(repoName)` - View full documentation
- `ask_question(repoName, question)` - Natural language queries

**When to Use**:
- ✅ Understanding external dependencies (Anthropic SDK, Fastify, etc.)
- ✅ Learning library APIs before implementation
- ✅ Researching best practices for frameworks
- ✅ Quick reference for unfamiliar tools

**Example**:
```typescript
// Before implementing LLM factory (Story 1.3):
deepwiki.ask_question("anthropics/anthropic-sdk-typescript", 
  "How do I create a streaming completion with retry logic?")

// Understanding Fastify routing:
deepwiki.read_wiki_contents("fastify/fastify")
```

**Supported**: Any public GitHub repository

---

### 4. Context7 - Library Documentation ⭐⭐⭐

**Purpose**: Up-to-date, version-specific documentation for libraries

**Key Tools**:
- `resolve-library-id(libraryName)` - Find library ID
- `get-library-docs(context7CompatibleLibraryID, topic?)` - Get docs

**When to Use**:
- ✅ ALWAYS use before implementing new library integration
- ✅ Reference current API (avoids outdated knowledge)
- ✅ Find code examples for specific features
- ✅ Verify method signatures and parameters

**Workflow**:
```typescript
// 1. Resolve library
const libId = context7.resolve_library_id("@anthropic-ai/sdk")
// Returns: /anthropic-ai/sdk

// 2. Get documentation
context7.get_library_docs("/anthropic-ai/sdk", {
  topic: "streaming",
  tokens: 5000
})
// Returns: Current docs with code examples
```

**Critical for**:
- Anthropic SDK integration (Story 1.3)
- OpenAI SDK integration (Story 1.3)
- Fastify setup (Story 1.1)
- React/Vite/shadcn/ui (Epic 6)

**Knowledge Base**: Over 100+ popular libraries indexed

---

### 5. Magic (21st.dev) - UI Component Generation ⭐

**Purpose**: AI-generated UI components (like v0.dev but in IDE)

**Key Tools**:
- `21st_magic_component_builder()` - Generate new component from description
- `21st_magic_component_inspiration()` - Browse existing components
- `21st_magic_component_refiner()` - Improve/refine existing component
- `logo_search(queries, format)` - Search company logos (SVG/JSX/TSX)

**When to Use**:
- ✅ Epic 6 (Dashboard UI implementation)
- ✅ Creating shadcn/ui components quickly
- ✅ Prototyping UI layouts
- ✅ Adding brand logos (GitHub, Anthropic, OpenAI)

**Example**:
```typescript
// Generate dashboard card component
magic.21st_magic_component_builder({
  message: "Create a project status card with title, status badge, and progress bar",
  format: "TSX",
  absolutePathToCurrentFile: "dashboard/src/components/ProjectCard.tsx"
})

// Search for logos
magic.logo_search(["anthropic", "openai", "github"], "TSX")
```

**Status**: Free during beta period

---

### 6. Sequential Thinking - Complex Problem Solving ⭐⭐

**Purpose**: Dynamic, reflective problem-solving through chain-of-thought

**Key Tool**:
- `sequentialthinking()` - Think through complex problems step by step

**When to Use**:
- ✅ Complex architectural decisions
- ✅ Multi-step algorithm design
- ✅ Debugging intricate issues
- ✅ Planning refactoring strategies

**Features**:
- Adjustable thought count (can revise estimate)
- Can question/revise previous thoughts
- Hypothesis generation and verification
- Branching thought paths

**Example Flow**:
```
Thought 1: "Need to design LLM factory. Key requirements: multi-provider support..."
Thought 2: "Factory pattern makes sense. But how to handle retries?"
Thought 3: "Revising thought 2 - decorator pattern better for retries"
Thought 4: "Verify: Does decorator work with streaming?"
...continues until solution found
```

---

## 🌳 Git Workflow

### Branch Strategy

**Main Branch**: `main` (protected)
- Requires PR approval
- Requires CI passing (lint, test-unit, test-e2e)
- Requires conversation resolution
- Requires linear history
- Blocks force pushes

**Feature Branches**: `feature/story-X-Y-name`
- Created via git worktrees
- One branch per story
- Short-lived (1-3 days)

**Hotfix Branches**: `hotfix/description`
- For urgent production fixes
- Merged immediately after review

### Worktree Workflow (CRITICAL)

**Always use worktrees for feature development!**

```bash
# Start story
cd "/home/chris/projects/work/Agent orchastrator"
./scripts/worktree.sh create X-Y

# Work in isolation
cd ../agent-orchestrator-story-X-Y
code .

# Commit and push
git add .
git commit -m "feat: implement feature"
git push -u origin feature/story-X-Y-name

# Create PR
gh pr create --fill

# After merge, cleanup
cd "/home/chris/projects/work/Agent orchastrator"
./scripts/worktree.sh remove X-Y
git pull origin main
```

**Benefits**:
- ✅ Work on multiple stories simultaneously
- ✅ No branch switching overhead
- ✅ No git stash conflicts
- ✅ Isolated testing environments

**Reference**: See `docs/git-worktree-cheatsheet.md` for complete guide

### Commit Message Format

**Format**:
```
<type>: <subject>

<body>

<footer>
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Add/update tests
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `chore:` - Build/tooling
- `ci:` - CI/CD changes

**Example**:
```
feat: implement ProjectConfig with YAML validation

- Add ProjectConfig.load() method
- Implement schema validation
- Add error handling for missing files
- Support agent assignments and onboarding docs

Closes #42
```

**Rules**:
- ❌ NO "Co-Authored-By: Claude" lines (blocked by hook)
- ✅ Present tense ("add" not "added")
- ✅ Lowercase subject
- ✅ Reference issues/stories when applicable

---

## 🧪 Testing Strategy

### Test Pyramid (60/30/10)

1. **60% Unit Tests** (Vitest)
   - Location: `backend/tests/unit/`, `dashboard/tests/unit/`
   - Fast, isolated, granular
   - Test pure logic, utilities, helpers

2. **30% Integration Tests** (Vitest)
   - Location: `backend/tests/integration/`
   - Test business logic + I/O (file, DB, API)
   - Example: ProjectConfig loading + validation

3. **10% E2E Tests** (Playwright)
   - Location: `tests/e2e/`
   - Test critical user journeys
   - Example: Dashboard login → view projects → escalate

### Test Patterns

#### Given-When-Then Structure
```typescript
test('should load valid configuration', async () => {
  // GIVEN: Valid config file exists
  const configPath = createTestConfig({
    project_name: 'Test Project'
  });

  // WHEN: Loading configuration
  const config = await ProjectConfig.load(configPath);

  // THEN: Configuration is loaded correctly
  expect(config.projectName).toBe('Test Project');
});
```

#### Data Factories (Override Pattern)
```typescript
// tests/support/factories/config.factory.ts
export const createConfigFactory = (overrides = {}) => ({
  project_name: 'Default Project',
  project_type: 'software',
  project_level: 3,
  ...overrides  // Override specific fields
});
```

#### Test Fixtures (Auto-Cleanup)
```typescript
// tests/support/fixtures/config.fixture.ts
export async function configFileFixture() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
  
  return {
    dirPath: tempDir,
    cleanup: async () => {
      await fs.rm(tempDir, { recursive: true });
    }
  };
}
```

### Running Tests

```bash
# Unit/Integration (Vitest)
npm run test --workspace=backend
npm run test:watch --workspace=backend

# E2E (Playwright)
npm run test:e2e
npm run test:e2e:ui          # Visual mode
npm run test:e2e:debug       # Debug mode

# Full CI pipeline (local)
./scripts/ci-local.sh

# Burn-in loop (flaky detection)
./scripts/burn-in.sh
```

### CI/CD Pipeline

**Stages**:
1. **Lint** - ESLint, Prettier, TypeScript (<2 min)
2. **Unit Tests** - Parallel workspace testing (<10 min)
3. **E2E Tests** - 4-way sharding (<10 min per shard)
4. **Burn-in** - 10 iterations, PRs to main only (<30 min)
5. **Report** - Aggregate results

**Triggers**:
- Push to main/develop
- Pull requests
- Manual dispatch

**Status Checks Required for Merge**:
- ✅ Lint & Code Quality
- ✅ test-e2e
- ✅ test-unit

---

## 🎨 Code Style & Preferences

### TypeScript

**Strict Mode**: Enabled
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

**Prefer**:
- ✅ Async/await over promises
- ✅ Explicit return types on public methods
- ✅ Interface over type (for objects)
- ✅ Const over let/var
- ✅ Named exports over default exports

**Avoid**:
- ❌ Any type (use unknown)
- ❌ Non-null assertions (!.)
- ❌ Implicit any
- ❌ God classes (>500 lines)

### Naming Conventions

```typescript
// Classes: PascalCase
class ProjectConfig {}

// Interfaces: PascalCase
interface WorkflowConfig {}

// Functions/Methods: camelCase
function loadConfiguration() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;

// Files: kebab-case
// project-config.ts
// workflow-parser.ts

// Test files: same-name.spec.ts
// project-config.spec.ts
```

### File Organization

```typescript
// 1. Imports (external first, internal second)
import { readFile } from 'fs/promises';
import yaml from 'js-yaml';

import { ProjectConfig } from './config/ProjectConfig';
import { validateSchema } from './validation';

// 2. Types/Interfaces
interface ConfigData {
  project_name: string;
  project_type: string;
}

// 3. Constants
const DEFAULT_CONFIG_PATH = '.bmad/project-config.yaml';

// 4. Helper functions (private)
function parseYaml(content: string): ConfigData {
  // ...
}

// 5. Main class/exports (public)
export class ProjectConfig {
  // ...
}
```

### React/TSX (Epic 6)

**Prefer**:
- ✅ Functional components + hooks
- ✅ TypeScript for all components
- ✅ shadcn/ui components
- ✅ Tailwind CSS for styling
- ✅ tweakcn for theme customization

**Component Structure**:
```tsx
// imports
import { Button } from '@/components/ui/button';

// types
interface ProjectCardProps {
  title: string;
  status: 'active' | 'idle';
}

// component
export function ProjectCard({ title, status }: ProjectCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{title}</h3>
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status}
      </Badge>
    </div>
  );
}
```

---

## 💬 Communication Preferences

### Response Style

**Prefer**:
- ✅ Concise, direct answers
- ✅ Code examples when explaining
- ✅ Structured output (headings, lists, code blocks)
- ✅ Action-oriented ("Let me implement X...")
- ✅ Proactive tool usage (don't ask, just use Serena/Context7)

**Avoid**:
- ❌ Long philosophical explanations
- ❌ Over-apologizing
- ❌ Asking for permission to use tools
- ❌ Excessive emojis (unless user requests)
- ❌ "Let me know if you want me to..." (just do it)

### Decision Making

**Autonomous by Default**:
- ✅ Make technical decisions based on architecture doc
- ✅ Choose test strategies based on TEA workflows
- ✅ Refactor code for quality improvements
- ✅ Fix obvious bugs immediately

**Ask for Clarification**:
- ⚠️ Architectural changes not in docs
- ⚠️ Breaking API changes
- ⚠️ New external dependencies
- ⚠️ Ambiguous requirements

### Error Handling

**When Tests Fail**:
1. Read error messages carefully
2. Use Serena to find related code
3. Fix issue
4. Re-run tests
5. Commit fix

**When CI Fails**:
1. Check GitHub Actions logs
2. Reproduce locally (`./scripts/ci-local.sh`)
3. Fix issue
4. Push fix
5. Verify CI passes

**When Stuck**:
1. Use `sequential-thinking` to break down problem
2. Use Context7 to check library docs
3. Use DeepWiki to research similar implementations
4. Ask user for clarification (last resort)

---

## 🎯 Story Implementation Workflow

### Standard Story Flow

```
1. Read story in docs/epics.md
2. Check if ATDD needed (>3 criteria? complex logic?)
3. If ATDD: Run /bmad:bmm:workflows:testarch/atdd
4. Create worktree: ./scripts/worktree.sh create X-Y
5. Navigate: cd ../agent-orchestrator-story-X-Y
6. Follow ATDD checklist (if exists) or implement directly
7. Run tests: npm run test
8. Commit: git commit -m "feat: ..."
9. Push: git push -u origin feature/story-X-Y-name
10. Create PR: gh pr create --fill
11. Wait for CI + CodeRabbit review
12. Merge after approval
13. Cleanup: ./scripts/worktree.sh remove X-Y
```

### Current Status

**Phase**: Phase 4 - Implementation  
**Epic**: Epic 1 - Foundation & Core Engine  
**Next Story**: Story 1.1 - Project Repository Structure & Configuration  
**ATDD Status**: ✅ Complete (15 tests in RED phase)  
**Checklist**: `docs/atdd-checklist-story-1-1.md`

---

## 🚨 Critical Reminders

### MUST DO

1. ⭐ **Use Serena** for all code exploration (NEVER read full files first)
2. ⭐ **Use Context7** before implementing library integrations
3. ⭐ **Use worktrees** for all feature development
4. ⭐ **Run ATDD** for complex stories (>3 criteria)
5. ⭐ **Write tests first** (RED → GREEN → REFACTOR)

### NEVER DO

1. ❌ Commit without tests (tdd-guard will block)
2. ❌ Add "Co-Authored-By: Claude" to commits (hook blocks)
3. ❌ Push directly to main (branch protection blocks)
4. ❌ Use `git stash` (use worktrees instead)
5. ❌ Read entire files when Serena can find symbols

---

## 📚 Key Documentation Files

**Reference these frequently**:

- `docs/PRD.md` - Product requirements (what to build)
- `docs/architecture.md` - Technical decisions (how to build)
- `docs/epics.md` - Story breakdown (what's next)
- `docs/atdd-checklist-story-X-Y.md` - Implementation guide (current story)
- `docs/ci.md` - CI/CD pipeline documentation
- `docs/git-worktree-cheatsheet.md` - Worktree reference
- `tests/README.md` - Test framework guide

---

## 🎓 Learning Resources

**MCP Documentation**:
- Serena: https://github.com/oraios/serena
- Playwright MCP: https://github.com/microsoft/playwright-mcp
- Context7: https://github.com/upstash/context7
- DeepWiki: https://cognition.ai/blog/deepwiki-mcp-server
- Magic: https://21st.dev/magic

**Testing**:
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- ATDD Guide: `bmad/bmm/workflows/testarch/atdd/instructions.md`

**Git Worktrees**:
- Official Docs: https://git-scm.com/docs/git-worktree
- Our Guide: `docs/git-worktree-cheatsheet.md`

---

## ✅ Session Checklist

**At Start of Session**:
- [ ] Read this file (claude.md)
- [ ] Check current sprint status (docs/sprint-status.yaml)
- [ ] Identify next story to implement
- [ ] Determine if ATDD needed

**During Session**:
- [ ] Use Serena for code exploration
- [ ] Use Context7 for library docs
- [ ] Create worktree for feature work
- [ ] Write tests first (if new code)
- [ ] Commit regularly with clear messages

**At End of Session**:
- [ ] Run tests (npm run test)
- [ ] Commit all changes
- [ ] Push to remote
- [ ] Update sprint status if story complete

---

**Last Updated**: 2025-11-04  
**Maintained By**: Development Team + Claude AI  
**Version**: 1.0

---

**Remember**: This is a living document. Update as project evolves! 🚀
