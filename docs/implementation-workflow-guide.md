# Implementation Workflow Guide
**Agent Orchestrator Project - Phase 4 Implementation**

**Status**: PRD ✅ | Architecture ✅ | UX Design ✅ | Epics ✅
**Ready For**: Phase 4 Implementation

---

## 📋 Table of Contents

- [Current State](#current-state)
- [Pre-Implementation Validation](#pre-implementation-validation)
- [Phase 4 Setup](#phase-4-setup)
- [Story Loop Workflow](#story-loop-workflow)
- [Epic Completion Workflow](#epic-completion-workflow)
- [Agent Quick Reference](#agent-quick-reference)
- [Workflow Commands](#workflow-commands)
- [Expected Outputs](#expected-outputs)
- [Quality Gates](#quality-gates)

---

## 🎯 Current State

### ✅ Completed Phases

| Phase | Status | Documents | Agent |
|-------|--------|-----------|-------|
| **Phase 1: Analysis** | ✅ Complete | Product Brief, Research | Mary (Analyst) |
| **Phase 2: Planning** | ✅ Complete | PRD.md, Epics.md, UX Design | John (PM), Sally (UX) |
| **Phase 3: Solutioning** | ✅ Complete | Architecture.md | Winston (Architect) |
| **Phase 4: Implementation** | ⏳ Ready to Start | Sprint Status, Stories | Multiple agents |

### 📂 Your Current Documentation

```
docs/
├── PRD.md                      ✅ Product Requirements Document
├── epics.md                    ✅ Epic definitions with stories
├── architecture.md             ✅ System architecture
├── ux-design.md               ✅ UX specification
├── technical-design.md         ✅ Technical design document
├── tech-spec-epic-1.md        ✅ Epic 1 technical spec
└── sprint-status.yaml         ✅ Sprint tracking (exists)
```

### ⚠️ Missing Steps Before Implementation

Before starting any code implementation, you need to complete these critical validation and setup steps:

1. **Solutioning Gate Check** - Validate cohesion of all Phase 2-3 documents
2. **Implementation Readiness Gate** - Verify technical feasibility
3. **Test Infrastructure Setup** - Initialize test framework and CI/CD
4. **Test Design** - Create risk-based test strategy
5. **Epic Tech-Specs** - Generate JIT technical specifications per epic (if not already done)
6. **Sprint Planning** - Extract all stories into sprint-status.yaml

---

## ✅ Pre-Implementation Validation

### Step 1: Solutioning Gate Check
**Duration**: 15-30 minutes
**Agent**: Winston (Architect)
**Workflow**: `/bmad:bmm:workflows:solutioning-gate-check`

**Purpose**: Validate that PRD, Architecture, UX Design, and Epics are cohesive with no gaps or contradictions.

**Process**:
```bash
# In Claude Code or your IDE
1. Load Winston (Architect) agent in new chat
2. Command: "*solutioning-gate-check" or select menu option
3. Winston will analyze:
   - PRD requirements vs Architecture support
   - UX flows vs Technical architecture
   - Epic stories vs Architecture components
   - NFR requirements vs Architecture decisions
```

**Expected Output**:
```markdown
docs/solutioning-gate-check-report.md

Contents:
- ✅ Requirements Coverage (all PRD requirements addressed)
- ✅ Architecture Alignment (UX flows supported)
- ✅ Epic Feasibility (all stories technically possible)
- ⚠️ Gaps Identified (list any contradictions/gaps)
- 🔧 Recommendations (fixes for any issues)
```

**Possible Outcomes**:
- **GREEN (Pass)**: Proceed to Step 2
- **YELLOW (Minor Issues)**: Fix issues, then proceed
- **RED (Major Issues)**: Resolve contradictions with PM/Architect before proceeding

---

### Step 2: Implementation Readiness Gate
**Duration**: 30-45 minutes
**Agent**: Amelia (Dev) + Winston (Architect)
**Workflow**: Custom (new workflow to be added)

**Purpose**: Verify that the codebase is ready for implementation - no blockers, dependencies available, patterns established.

**Process**:
```bash
# Current workaround (until workflow implemented):
1. Load Amelia (Dev) agent in new chat
2. Ask: "Please perform implementation readiness check:
   - Review architecture.md and tech-spec-epic-1.md
   - Check if all dependencies are available or documented
   - Verify test infrastructure exists (or needs creation)
   - Identify any technical debt blockers
   - Check if coding patterns are established
   - Validate database schema is defined (if applicable)
   - Confirm API contracts are documented (if applicable)"
```

**Expected Output**:
```markdown
docs/implementation-readiness-report.md

Contents:
- ✅ Dependencies: Available/needs installation
- ✅ Test Infrastructure: Exists/needs setup (→ TEA)
- ✅ Coding Patterns: Established/needs definition
- ⚠️ Blockers: List any show-stoppers
- 🔧 Prerequisites: Actions needed before Story 0.1
```

**Blockers to Resolve**:
- Missing dependencies → Document in tech-spec or package.json
- No test infrastructure → Proceed to Step 3 (TEA setup)
- Unclear patterns → Winston updates architecture with implementation patterns
- Database schema undefined → Winston/Bob define schema in tech-spec
- API contracts unclear → Winston defines API contracts in architecture

---

### Step 3: Test Infrastructure Setup
**Duration**: 30-60 minutes
**Agent**: Murat (TEA - Test Architect)
**Workflow**: `/bmad:bmm:workflows:testarch:framework`

**Purpose**: Initialize production-ready test framework (Playwright/Vitest) with fixtures, helpers, and configuration.

**Process**:
```bash
1. Load Murat (TEA) agent in new chat
2. Wait for menu
3. Command: "*framework" or select menu option
4. Murat will:
   - Ask about test framework preference (Playwright/Cypress)
   - Create test directory structure
   - Generate fixtures and helpers
   - Configure test runner
   - Create example tests
```

**Expected Output**:
```
tests/
├── e2e/
│   └── example.spec.ts
├── support/
│   ├── fixtures/
│   │   ├── base.ts
│   │   └── index.ts
│   ├── helpers/
│   │   ├── api.ts
│   │   └── index.ts
│   └── factories/
│       └── *.factory.ts
└── README.md

playwright.config.ts (or cypress.config.ts)
```

**Verification**:
```bash
npm run test:e2e  # Should run successfully
```

---

### Step 4: CI/CD Pipeline Setup
**Duration**: 30-45 minutes
**Agent**: Murat (TEA)
**Workflow**: `/bmad:bmm:workflows:testarch:ci`

**Purpose**: Scaffold CI/CD quality pipeline with test execution, burn-in loops, and artifact collection.

**Process**:
```bash
1. Load Murat (TEA) agent in same chat or new chat
2. Command: "*ci" or select menu option
3. Murat will:
   - Ask about CI platform (GitHub Actions/GitLab CI)
   - Generate pipeline configuration
   - Configure test execution
   - Setup quality gates
   - Configure artifact collection
```

**Expected Output**:
```yaml
.github/workflows/ci.yml
# or
.gitlab-ci.yml

Contents:
- Build job
- Test job (unit, integration, e2e)
- Lint job
- Quality gates (coverage thresholds)
- Artifact upload (test reports)
```

---

### Step 5: Test Design & Risk Strategy
**Duration**: 30-45 minutes
**Agent**: Murat (TEA)
**Workflow**: `/bmad:bmm:workflows:testarch:test-design`

**Purpose**: Create comprehensive test strategy with risk assessment and prioritization.

**Process**:
```bash
1. Load Murat (TEA) agent in new chat
2. Command: "*test-design" or select menu option
3. Murat will analyze:
   - PRD requirements
   - Architecture complexity
   - Security risk areas
   - Performance critical paths
   - User impact zones
```

**Expected Output**:
```markdown
docs/test-design.md

Contents:
- Risk Assessment Matrix (High/Med/Low risks)
- Test Coverage Strategy (unit/integration/e2e ratios)
- Priority Testing Areas
- Performance Test Plan
- Security Test Plan
- Test Data Strategy
- Test Environment Requirements
```

---

### Step 6: Epic Tech-Specs (Per Epic)
**Duration**: 45-90 minutes per epic
**Agent**: Winston (Architect) or Bob (SM)
**Workflow**: `/bmad:bmm:workflows:tech-spec` or `/bmad:bmm:workflows:4-implementation/epic-tech-context`

**Purpose**: Generate Just-In-Time technical specification for each epic with detailed acceptance criteria and implementation guidance.

**For Epic 1** (you already have tech-spec-epic-1.md ✅):
```
docs/tech-spec-epic-1.md ✅ Already exists
```

**For Epic 2-6** (generate as needed, before starting epic):
```bash
1. Load Winston (Architect) or Bob (SM) in new chat
2. Command: "*tech-spec" or manually create
3. Provide:
   - Epic number (e.g., 2)
   - Epic name from epics.md
   - PRD requirements for this epic
   - Architecture sections relevant to this epic
```

**Expected Output**:
```markdown
docs/tech-spec-epic-2.md
docs/tech-spec-epic-3.md
...

Contents:
- Epic Overview
- Technical Requirements
- Architecture Integration Points
- Data Models & Schemas
- API Contracts
- Implementation Patterns
- Story-level Acceptance Criteria
- Test Requirements
- Dependencies
```

**Note**: You can generate these Just-In-Time (before starting each epic) or all upfront.

---

## 🚀 Phase 4 Setup

### Step 7: Sprint Planning
**Duration**: 15-30 minutes
**Agent**: Bob (SM - Scrum Master)
**Workflow**: `/bmad:bmm:workflows:sprint-planning`

**Purpose**: Extract all stories from epics.md and create sprint-status.yaml tracking file.

**Process**:
```bash
1. Load Bob (SM) agent in new chat
2. Wait for menu
3. Command: "*sprint-planning" or select menu option
4. Bob will:
   - Read epics.md
   - Extract all stories across all epics
   - Create sprint-status.yaml
   - Set initial statuses (backlog)
```

**Expected Output**:
```yaml
docs/sprint-status.yaml

Contents:
# Sprint Status Tracking
generated: 2025-11-04
project: Agent Orchestrator
tracking_system: file-system
story_location: "{project-root}/docs/stories"

development_status:
  # Story 0.1 (Already done)
  0-1-project-scaffolding: done

  # Epic 1: Foundation & Core Engine
  epic-1: contexted  # Tech spec exists
  1-1-project-repository-structure: backlog
  1-2-workflow-yaml-parser: backlog
  1-3-llm-factory-pattern: backlog
  1-4-agent-pool-lifecycle: backlog
  1-5-state-manager-file-persistence: backlog
  1-6-git-worktree-manager: backlog
  1-7-workflow-engine-executor: backlog
  1-8-template-processing: backlog
  1-9-cli-foundation: backlog
  1-10-error-handling-recovery: backlog
  epic-1-retrospective: optional

  # Epic 2: Analysis Phase Automation
  epic-2: backlog
  2-1-confidence-decision-engine: backlog
  2-2-escalation-queue-system: backlog
  ...
```

**Verification**:
```bash
# Check that sprint-status.yaml was created
cat docs/sprint-status.yaml
```

---

## 🔄 Story Loop Workflow

### Overview
Once sprint planning is complete, you execute the story loop for each story. The loop continues until all stories in the sprint-status.yaml are marked "done".

### Story States
```
backlog → drafted → ready-for-dev → in-progress → review → done
```

---

### Step 8: Create Story
**Duration**: 10-20 minutes per story
**Agent**: Bob (SM)
**Workflow**: `/bmad:bmm:workflows:create-story`

**Purpose**: Create detailed user story markdown file from epic/PRD/architecture.

**Process**:
```bash
1. Load Bob (SM) agent in new chat
2. Command: "*create-story" or select menu option
3. Bob will ask:
   - Which epic? (e.g., 1)
   - Which story number? (e.g., 1)
4. Bob generates story file from:
   - epics.md (story definition)
   - tech-spec-epic-1.md (technical details)
   - architecture.md (context)
```

**Expected Output**:
```markdown
docs/stories/1-1-project-repository-structure-configuration.md

Contents:
# Story 1.1: Project Repository Structure & Configuration

## Story
As a system, I need a centralized configuration system...

## Acceptance Criteria
AC 1.1.1: ProjectConfig class loads project-config.yaml
AC 1.1.2: Configuration validation with zod schemas
...

## Tasks
- [ ] Create ProjectConfig class
  - [ ] Implement load() method
  - [ ] Add schema validation
  - [ ] Handle errors gracefully

## Technical Notes
- Use js-yaml for YAML parsing
- zod for schema validation
- Refer to tech-spec-epic-1.md section 3.2

## Dev Agent Record
(Empty - to be filled during implementation)

## File List
(Empty - to be filled during implementation)

## Change Log
(Empty - to be filled during implementation)

## Status
Status: drafted
```

**Sprint Status Update**:
```yaml
development_status:
  1-1-project-repository-structure: drafted  # Updated from backlog
```

---

### Step 9: Story Context Generation
**Duration**: 5-10 minutes per story
**Agent**: Automated (or Bob)
**Workflow**: `/bmad:bmm:workflows:story-context`

**Purpose**: Assemble dynamic Story Context XML with relevant documentation and existing code patterns.

**Process**:
```bash
1. Load Bob (SM) agent in new chat (or can be automated)
2. Command: "*story-context" or select menu option
3. Workflow will:
   - Find the drafted story (1-1-*.md)
   - Load PRD, architecture, tech-spec-epic-1
   - Scan existing codebase for relevant patterns
   - Identify interfaces and dependencies
   - Assemble into context.xml
```

**Expected Output**:
```xml
docs/stories/1-1-project-repository-structure-configuration.context.xml

Contents:
<story-context>
  <story>
    <id>1-1</id>
    <title>Project Repository Structure & Configuration</title>
    <epic>Epic 1 - Foundation & Core Engine</epic>
    <acceptance-criteria>...</acceptance-criteria>
  </story>

  <artifacts>
    <prd-sections>
      <section>Configuration Management</section>
    </prd-sections>

    <architecture-sections>
      <section>ProjectConfig Class Design</section>
    </architecture-sections>

    <tech-spec>
      <section>Epic 1 - Story 1.1 Details</section>
    </tech-spec>
  </artifacts>

  <code-patterns>
    <existing-code>
      <!-- Relevant existing code snippets -->
    </existing-code>
  </code-patterns>

  <interfaces>
    <interface name="ProjectConfig">...</interface>
  </interfaces>

  <dependencies>
    <package>js-yaml</package>
    <package>zod</package>
  </dependencies>

  <constraints>
    <constraint>Must validate required fields</constraint>
    <constraint>Must support agent_assignments map</constraint>
  </constraints>

  <tests>
    <test-requirements>
      <requirement>Load valid YAML successfully</requirement>
      <requirement>Throw error for invalid YAML</requirement>
    </test-requirements>
  </tests>
</story-context>
```

---

### Step 10: ATDD - Acceptance Tests First (Per Epic)
**Duration**: 30-60 minutes per epic
**Agent**: Murat (TEA)
**Workflow**: `/bmad:bmm:workflows:testarch:atdd`

**Purpose**: Generate failing acceptance tests BEFORE implementation (TDD Red-Green-Refactor).

**When**: Before first story of each epic
**For Epic 1**: Run once before Story 1.1

**Process**:
```bash
1. Load Murat (TEA) agent in new chat
2. Command: "*atdd" or select menu option
3. Murat will:
   - Read all drafted stories for the epic
   - Extract all acceptance criteria
   - Generate E2E tests for each AC
   - Tests will FAIL initially (RED phase)
```

**Expected Output**:
```typescript
backend/tests/integration/epic-1-foundation.spec.ts

Contents:
import { describe, it, expect } from 'vitest';

describe('Epic 1: Foundation & Core Engine', () => {
  describe('Story 1.1: Project Config', () => {
    it('AC 1.1.1: should load valid project-config.yaml', async () => {
      // Given: Valid config file exists
      // When: ProjectConfig.load() is called
      // Then: Config is loaded successfully

      // This test FAILS initially (RED)
      // Amelia will make it pass (GREEN)
    });

    it('AC 1.1.2: should validate required fields', async () => {
      // Test for schema validation
    });

    // ... more tests
  });

  describe('Story 1.2: YAML Parser', () => {
    // ... tests for story 1.2
  });
});
```

**Verification**:
```bash
npm run test  # All tests should FAIL (RED phase)
# This is EXPECTED and CORRECT (TDD approach)
```

---

### Step 11: Mark Story Ready
**Duration**: 1-2 minutes per story
**Agent**: Bob (SM)
**Workflow**: `/bmad:bmm:workflows:story-ready`

**Purpose**: Mark story as ready for development (drafted → ready-for-dev).

**Process**:
```bash
1. Load Bob (SM) agent in new chat
2. Command: "*story-ready" or select menu option
3. Bob will:
   - Find first drafted story
   - Update sprint-status.yaml
   - Change status: drafted → ready-for-dev
```

**Sprint Status Update**:
```yaml
development_status:
  1-1-project-repository-structure: ready-for-dev  # Updated
```

---

### Step 12: Develop Story
**Duration**: 30 minutes - 4 hours (depends on complexity)
**Agent**: Amelia (Dev)
**Workflow**: `/bmad:bmm:workflows:dev-story`

**Purpose**: Implement the story - write code, tests, run tests, complete all AC.

**Process**:
```bash
1. Load Amelia (Dev) agent in new chat
2. Command: "*dev-story" or select menu option
3. Amelia will:
   - Find next ready-for-dev story
   - Mark story in-progress in sprint-status.yaml
   - Read story.md + story.context.xml
   - Implement each task/subtask
   - Write tests per AC (or make ATDD tests pass)
   - Run tests until all pass
   - Check off tasks in story.md
   - Update Dev Agent Record (debug log, completion notes)
   - Update File List (all modified files)
   - Update Change Log (what changed)
```

**Configuration Options**:
```yaml
# In bmad/bmm/config.yaml
run_until_complete: true  # Amelia works until story done (no stops)
run_tests_command: "npm run test"  # Test command to run
```

**HALT Conditions** (Amelia stops and escalates):
- 3 consecutive implementation failures
- Missing required configuration
- Ambiguous requirements
- New dependencies need approval

**Expected Changes**:
```typescript
// New files created:
backend/src/config/ProjectConfig.ts
backend/src/config/types.ts
backend/tests/integration/project-config.spec.ts

// Files modified:
backend/package.json (dependencies added)
docs/stories/1-1-*.md (tasks checked, notes added)
docs/sprint-status.yaml (status: in-progress)
```

**Story File Updates**:
```markdown
## Tasks
- [x] Create ProjectConfig class
  - [x] Implement load() method
  - [x] Add schema validation
  - [x] Handle errors gracefully
- [x] Write tests for all AC
- [x] All tests passing

## Dev Agent Record
### Debug Log
- Created ProjectConfig class with TypeScript
- Used js-yaml for parsing
- Implemented zod schemas for validation
- All tests passing (15 tests, 0 failures)

### Completion Notes
Implementation follows architecture patterns.
Used factory pattern for config loading.
All acceptance criteria satisfied.

## File List
- backend/src/config/ProjectConfig.ts (new)
- backend/src/config/types.ts (new)
- backend/tests/integration/project-config.spec.ts (new)
- backend/package.json (modified - added js-yaml, zod)

## Change Log
- Created ProjectConfig class
- Implemented YAML loading with validation
- Added comprehensive test coverage (15 tests)

## Status
Status: in-progress  # Will update to "ready for review"
```

**Verification**:
```bash
npm run test  # All tests should PASS (GREEN phase)
npm run build  # Should compile successfully
```

---

### Step 13: Security Gate
**Duration**: 5-10 minutes per story
**Agent**: Alex (Code Reviewer) or Automated
**Workflow**: Custom security scan + manual review

**Purpose**: Catch security issues before code review.

**Process**:
```bash
# Automated scan (run in terminal):
npm audit  # Check dependency vulnerabilities
npx eslint-plugin-security  # Check code patterns

# Manual review (load Alex agent):
1. Load Alex (Code Reviewer) agent in new chat
2. Ask: "Please perform security review for Story 1-1:
   - Check for SQL injection risks
   - Check for XSS vulnerabilities
   - Check for exposed secrets
   - Check for authentication bypasses
   - Check for authorization flaws"
```

**Expected Output**:
```markdown
Appended to story file:

## Security Scan Results
Date: 2025-11-04
Agent: Alex (Code Reviewer)

### Automated Scan
- Dependency vulnerabilities: 0 high, 0 medium
- Code pattern issues: 0 critical

### Manual Review
- ✅ No SQL injection risks (using parameterized queries)
- ✅ No XSS vulnerabilities (input validation present)
- ✅ No secrets in code (using environment variables)
- ✅ Authentication properly implemented
- ✅ Authorization checks in place

Security Score: 95/100 ✅ PASS
```

---

### Step 14: Code Review
**Duration**: 10-20 minutes per story
**Agent**: Alex (Code Reviewer)
**Workflow**: `/bmad:bmm:workflows:code-review`

**Purpose**: Senior developer review for code quality, maintainability, and best practices.

**Process**:
```bash
1. Load Alex (Code Reviewer) agent in new chat
2. Command: "Review story 1-1" or run code-review workflow
3. Alex will:
   - Read story.md + story.context.xml
   - Review code changes (File List)
   - Check against acceptance criteria
   - Verify tests cover all AC
   - Check code quality and patterns
   - Identify issues (High/Med/Low severity)
```

**Expected Output**:
```markdown
Appended to story file:

## Senior Developer Review (AI)
Date: 2025-11-04
Reviewer: Alex (Code Reviewer)

### Review Outcome
Status: **Changes Requested** ⚠️

### Summary
Good implementation overall. A few improvements needed before approval.

### Action Items
#### High Priority (2)
- [ ] [AI-Review-H1] Add error handling for file not found in ProjectConfig.load()
- [ ] [AI-Review-H2] Validate project_level is within 0-4 range

#### Medium Priority (1)
- [ ] [AI-Review-M1] Extract magic strings to constants (file paths)

#### Low Priority (1)
- [ ] [AI-Review-L1] Add JSDoc comments to public methods

### Detailed Findings
1. **Missing Error Handling** (High)
   File: ProjectConfig.ts:45
   Issue: File not found error not handled
   Recommendation: Wrap fs.readFile in try-catch

2. **Validation Gap** (High)
   File: ProjectConfig.ts:67
   Issue: project_level not range-checked
   Recommendation: Add zod validation: z.number().min(0).max(4)

... (detailed notes)

### Positive Notes
- ✅ Clean code structure
- ✅ Good test coverage (15 tests)
- ✅ Follows TypeScript best practices
- ✅ All AC satisfied

---

## Review Follow-ups (AI)
Add these tasks to implement fixes:

### High Priority
- [ ] [AI-Review-H1] Add error handling for file not found
- [ ] [AI-Review-H2] Validate project_level range

### Medium Priority
- [ ] [AI-Review-M1] Extract magic strings

### Low Priority
- [ ] [AI-Review-L1] Add JSDoc comments
```

---

### Step 15: Fix Review Issues
**Duration**: 20-60 minutes (depends on issues)
**Agent**: Amelia (Dev)
**Workflow**: `/bmad:bmm:workflows:dev-story` (resume)

**Purpose**: Address code review findings.

**Process**:
```bash
1. Load Amelia (Dev) agent in new chat
2. Command: "*dev-story" or "Resume Story 1-1"
3. Amelia will:
   - Detect "Senior Developer Review" section exists
   - Extract unchecked review follow-up tasks
   - Prioritize: High → Medium → Low
   - Implement fixes
   - Check off review tasks
   - Run tests to verify
```

**Expected Changes**:
```typescript
// Files modified to address review:
backend/src/config/ProjectConfig.ts (error handling added)
backend/src/config/constants.ts (new - extracted magic strings)
```

**Story File Updates**:
```markdown
## Review Follow-ups (AI)
### High Priority
- [x] [AI-Review-H1] Add error handling for file not found ✅
- [x] [AI-Review-H2] Validate project_level range ✅

### Medium Priority
- [x] [AI-Review-M1] Extract magic strings ✅

### Low Priority
- [x] [AI-Review-L1] Add JSDoc comments ✅

## Dev Agent Record (Updated)
### Review Fix Log
- Added try-catch for file not found (throws ConfigurationError)
- Added project_level range validation (0-4)
- Extracted file paths to constants.ts
- Added JSDoc comments to all public methods
- All tests still passing after fixes
```

---

### Step 16: Final Review (If Needed)
**Duration**: 5-10 minutes
**Agent**: Alex (Code Reviewer)
**Workflow**: Quick re-review

**Process**:
```bash
1. Load Alex agent
2. Ask: "Quick re-review of Story 1-1 after fixes"
3. Alex verifies all review items addressed
```

**Expected Output**:
```markdown
Appended to story file:

## Senior Developer Review (AI) - Follow-up
Date: 2025-11-04
Reviewer: Alex

### Review Outcome
Status: **Approved** ✅

All review items addressed. Code quality is excellent.
Ready for merge.
```

---

### Step 17: Mark Story Done
**Duration**: 1-2 minutes
**Agent**: Bob (SM) or Amelia (Dev)
**Workflow**: `/bmad:bmm:workflows:story-done`

**Purpose**: Mark story complete (in-progress → done).

**Process**:
```bash
1. Load Bob (SM) agent in new chat
2. Command: "*story-done" or select menu option
3. Bob will:
   - Update sprint-status.yaml
   - Change status: in-progress → done
   - Advance queue (next backlog → drafted)
```

**Sprint Status Update**:
```yaml
development_status:
  1-1-project-repository-structure: done  ✅
  1-2-workflow-yaml-parser: backlog  # Next story
```

---

### 🔄 Repeat Story Loop

**Repeat Steps 8-17** for each story:
- Story 1.2: Workflow YAML Parser
- Story 1.3: LLM Factory Pattern
- Story 1.4: Agent Pool Lifecycle
- ... continue until all Epic 1 stories done

**Automation Note**: The orchestrator will eventually automate Steps 8-17, spawning agents and executing workflows without manual intervention.

---

## 🏁 Epic Completion Workflow

After all stories in an epic are done, complete these quality validation steps.

---

### Step 18: Traceability Matrix
**Duration**: 20-30 minutes per epic
**Agent**: Murat (TEA)
**Workflow**: `/bmad:bmm:workflows:testarch:trace`

**Purpose**: Validate all requirements are tested, make quality gate decision.

**Process**:
```bash
1. Load Murat (TEA) agent in new chat
2. Command: "*trace" or select menu option
3. Murat will:
   - Map PRD requirements → Epic stories → Tests
   - Calculate coverage percentage
   - Identify gaps
   - Make quality gate decision (PASS/CONCERNS/FAIL/WAIVED)
```

**Expected Output**:
```markdown
docs/traceability-matrix-epic-1.md

Contents:
# Traceability Matrix - Epic 1

## Requirements Coverage
| Requirement | Story | Test Coverage | Status |
|-------------|-------|---------------|--------|
| REQ-1.1: Config Management | 1-1 | 15 tests | ✅ Covered |
| REQ-1.2: YAML Parsing | 1-2 | 12 tests | ✅ Covered |
| REQ-1.3: LLM Factory | 1-3 | 18 tests | ✅ Covered |
...

## Coverage Summary
- Total Requirements: 20
- Requirements Covered: 20
- Coverage: 100%

## Quality Gate Decision
Decision: **PASS** ✅

All requirements have test coverage. Test suite is comprehensive.
No critical gaps identified.
```

---

### Step 19: NFR Assessment
**Duration**: 30-45 minutes per epic
**Agent**: Murat (TEA)
**Workflow**: `/bmad:bmm:workflows:testarch:nfr-assess`

**Purpose**: Validate non-functional requirements (performance, security, reliability).

**Process**:
```bash
1. Load Murat (TEA) agent in new chat
2. Command: "*nfr-assess" or select menu option
3. Murat will assess:
   - Performance (response times, throughput)
   - Security (vulnerability scan, penetration test results)
   - Reliability (error handling, failover)
   - Maintainability (code quality, documentation)
   - Scalability (load handling)
```

**Expected Output**:
```markdown
docs/nfr-assessment-epic-1.md

Contents:
# NFR Assessment - Epic 1

## Performance
- API Response Time (p95): 45ms ✅ (budget: <200ms)
- Config Load Time: 12ms ✅ (budget: <50ms)
- Memory Usage: 85MB ✅ (budget: <512MB)

## Security
- Dependency Vulnerabilities: 0 high, 0 medium ✅
- Code Security Scan: No issues ✅
- Authentication: Properly implemented ✅

## Reliability
- Error Handling: Comprehensive ✅
- Test Coverage: 92% ✅ (target: >80%)
- Zero unhandled promise rejections ✅

## Maintainability
- Code Complexity: Low ✅
- Documentation: Complete ✅
- Technical Debt: Minimal ✅

## Overall Assessment
Status: **PASS** ✅

All NFRs satisfied. System is production-ready for Epic 1 scope.
```

---

### Step 20: Test Review
**Duration**: 20-30 minutes per epic
**Agent**: Murat (TEA)
**Workflow**: `/bmad:bmm:workflows:testarch:test-review`

**Purpose**: Review test quality using comprehensive knowledge base.

**Process**:
```bash
1. Load Murat (TEA) agent in new chat
2. Command: "*test-review" or select menu option
3. Murat will review:
   - Test structure and organization
   - Test coverage (branches, edge cases)
   - Test quality (assertions, clarity)
   - Test performance (flakiness, speed)
   - Best practices adherence
```

**Expected Output**:
```markdown
docs/test-review-epic-1.md

Contents:
# Test Review - Epic 1

## Test Coverage
- Unit Tests: 125 tests
- Integration Tests: 45 tests
- E2E Tests: 12 tests
- Coverage: 92% ✅

## Test Quality
- Assertions per test: 3.2 avg ✅
- Test clarity: High ✅
- Edge cases covered: 95% ✅

## Test Performance
- Flaky tests: 0 ✅
- Test suite duration: 12s ✅
- Slow tests (>1s): 2 (acceptable)

## Recommendations
- ✅ Consider adding property-based tests for validation logic
- ✅ Good use of fixtures and factories
- ✅ Test organization is clean

Overall: Excellent test quality ✅
```

---

### Step 21: Documentation Sync
**Duration**: 15-30 minutes per epic
**Agent**: Paige (Docs)
**Workflow**: Custom doc sync workflow

**Purpose**: Update README, API docs, architecture to reflect implementation.

**Process**:
```bash
1. Load Paige (Docs) agent in new chat
2. Ask: "Please sync documentation for Epic 1 completion:
   - Update README with new features
   - Update API documentation (if applicable)
   - Update architecture diagram (if structure changed)
   - Update changelog
   - Check all docs for drift"
```

**Expected Changes**:
```markdown
README.md (updated):
## Features
- ✅ Project Configuration Management
- ✅ YAML Workflow Parsing
- ✅ Multi-LLM Provider Support
- ✅ Agent Pool Management
...

CHANGELOG.md (updated):
## [0.1.0] - 2025-11-04
### Added
- Project configuration system with validation
- YAML workflow parser
- LLM factory pattern with multi-provider support
...

docs/architecture.md (reviewed, updated if needed)
```

---

### Step 22: Epic Retrospective
**Duration**: 20-30 minutes per epic
**Agent**: Bob (SM)
**Workflow**: `/bmad:bmm:workflows:retrospective`

**Purpose**: Review epic success, extract lessons learned.

**Process**:
```bash
1. Load Bob (SM) agent in new chat
2. Command: "*retrospective" or select menu option
3. Bob facilitates retrospective:
   - What went well?
   - What didn't go well?
   - What did we learn?
   - What should we change for next epic?
```

**Expected Output**:
```markdown
docs/retrospective-epic-1.md

Contents:
# Epic 1 Retrospective

## What Went Well ✅
- Test infrastructure setup was smooth (Murat/TEA workflow)
- ATDD approach caught issues early (TDD red-green-refactor)
- Code review process improved quality (Alex agent)
- Sprint status tracking kept everyone aligned
- All stories completed within estimates

## What Didn't Go Well ⚠️
- Story 1.4 took 2x longer than estimated (agent lifecycle complexity)
- Missing dependency caused 4-hour delay in Story 1.3
- Context.xml for Story 1.7 was too large (token limits)

## What We Learned 💡
- Always check dependencies before starting implementation
- Complex stories need 2x time buffer
- Context pruning is essential for large stories
- Security gate catches issues code review might miss
- Documentation sync should happen per story, not per epic

## Action Items for Epic 2 🎯
- [ ] Add dependency check to implementation readiness gate
- [ ] Multiply complex story estimates by 1.5x
- [ ] Implement context pruning in story-context workflow
- [ ] Run security gate immediately after dev-story
- [ ] Update docs per story instead of per epic

## Metrics
- Stories completed: 10/10 ✅
- Test coverage: 92% ✅
- Bugs found in review: 8 (prevented from production)
- Bugs found in production: 0 ✅
- Epic duration: 3.5 days (estimated: 3 days) - 117% accuracy
```

---

### Step 23: Update Sprint Status
**Duration**: 2 minutes
**Agent**: Bob (SM) or Manual

**Purpose**: Mark epic complete.

**Process**:
```bash
# Manually update sprint-status.yaml or use Bob
1. Load Bob agent
2. Ask: "Mark Epic 1 complete"
```

**Sprint Status Update**:
```yaml
development_status:
  # Epic 1: Complete ✅
  epic-1: done
  1-1-project-repository-structure: done
  1-2-workflow-yaml-parser: done
  1-3-llm-factory-pattern: done
  1-4-agent-pool-lifecycle: done
  1-5-state-manager-file-persistence: done
  1-6-git-worktree-manager: done
  1-7-workflow-engine-executor: done
  1-8-template-processing: done
  1-9-cli-foundation: done
  1-10-error-handling-recovery: done
  epic-1-retrospective: done

  # Epic 2: Ready to start
  epic-2: contexted  # Generate tech-spec-epic-2 before starting
```

---

## 🔁 Repeat for Next Epic

**Before starting Epic 2**:
1. Generate tech-spec-epic-2.md (Winston)
2. Run ATDD for Epic 2 stories (Murat)
3. Continue story loop (Steps 8-17) for each story
4. Epic completion workflow (Steps 18-23)

---

## 👥 Agent Quick Reference

### Agent Activation

| Agent | How to Activate | Icon |
|-------|-----------------|------|
| **Winston** (Architect) | `/bmad:bmm:agents:architect` | 🏗️ |
| **Murat** (TEA) | `/bmad:bmm:agents:tea` | 🧪 |
| **Bob** (SM) | `/bmad:bmm:agents:sm` | 🏃 |
| **Amelia** (Dev) | `/bmad:bmm:agents:dev` | 💻 |
| **Alex** (Code Reviewer) | NEW - To be created | 🔍 |
| **Paige** (Docs) | `/bmad:bmm:agents:paige` | 📚 |

### Agent Responsibilities

| Agent | Primary Workflows | When to Use |
|-------|-------------------|-------------|
| **Winston** | solutioning-gate-check, epic-tech-context, implementation-readiness | Validation, tech specs, architecture |
| **Murat** | framework, ci, test-design, atdd, trace, nfr-assess, test-review | All testing activities |
| **Bob** | sprint-planning, create-story, story-ready, story-done, retrospective | Story management, tracking |
| **Amelia** | dev-story | Implementation, coding, test writing |
| **Alex** | code-review, security-gate | Quality assurance, security |
| **Paige** | documentation sync | Documentation updates |

---

## 🎯 Workflow Commands

### Quick Command Reference

```bash
# Phase 3 Validation
/bmad:bmm:workflows:solutioning-gate-check          # Winston
(Implementation readiness - custom)                 # Amelia + Winston

# Test Infrastructure
/bmad:bmm:workflows:testarch:framework              # Murat - Test setup
/bmad:bmm:workflows:testarch:ci                     # Murat - CI/CD
/bmad:bmm:workflows:testarch:test-design            # Murat - Test strategy

# Epic Preparation
/bmad:bmm:workflows:tech-spec                       # Winston - Tech spec
/bmad:bmm:workflows:testarch:atdd                   # Murat - Failing tests

# Phase 4 Setup
/bmad:bmm:workflows:sprint-planning                 # Bob - Sprint setup

# Story Loop
/bmad:bmm:workflows:create-story                    # Bob - Story creation
/bmad:bmm:workflows:story-context                   # Auto - Context assembly
/bmad:bmm:workflows:story-ready                     # Bob - Mark ready
/bmad:bmm:workflows:dev-story                       # Amelia - Implementation
/bmad:bmm:workflows:code-review                     # Alex - Review
/bmad:bmm:workflows:story-done                      # Bob - Mark complete

# Epic Completion
/bmad:bmm:workflows:testarch:trace                  # Murat - Traceability
/bmad:bmm:workflows:testarch:nfr-assess            # Murat - NFR validation
/bmad:bmm:workflows:testarch:test-review           # Murat - Test quality
/bmad:bmm:workflows:retrospective                   # Bob - Learnings
```

---

## 📄 Expected Outputs

### Documentation Tree After Epic 1

```
docs/
├── PRD.md                                          ✅ Existing
├── epics.md                                        ✅ Existing
├── architecture.md                                 ✅ Existing
├── ux-design.md                                   ✅ Existing
├── technical-design.md                             ✅ Existing
├── tech-spec-epic-1.md                            ✅ Existing
├── sprint-status.yaml                             ✅ Generated (Step 7)
├── solutioning-gate-check-report.md               🆕 Step 1
├── implementation-readiness-report.md             🆕 Step 2
├── test-design.md                                 🆕 Step 5
├── traceability-matrix-epic-1.md                  🆕 Step 18
├── nfr-assessment-epic-1.md                       🆕 Step 19
├── test-review-epic-1.md                          🆕 Step 20
├── retrospective-epic-1.md                        🆕 Step 22
└── stories/
    ├── 1-1-project-repository-structure.md        🆕 Step 8
    ├── 1-1-project-repository-structure.context.xml  🆕 Step 9
    ├── 1-2-workflow-yaml-parser.md
    ├── 1-2-workflow-yaml-parser.context.xml
    └── ... (all Epic 1 stories)

tests/
├── e2e/
│   └── epic-1-foundation.spec.ts                  🆕 Step 3 & 10
├── support/
│   ├── fixtures/                                  🆕 Step 3
│   ├── helpers/                                   🆕 Step 3
│   └── factories/                                 🆕 Step 3
└── README.md                                      🆕 Step 3

backend/
├── src/
│   ├── config/
│   │   ├── ProjectConfig.ts                       🆕 Step 12
│   │   └── types.ts                               🆕 Step 12
│   ├── llm/
│   │   └── LLMFactory.ts                          🆕 Story 1.3
│   └── ... (implementation code)
└── tests/
    └── integration/
        └── project-config.spec.ts                 🆕 Step 12

.github/
└── workflows/
    └── ci.yml                                     🆕 Step 4
```

---

## 🚦 Quality Gates

### Gate 1: Solutioning Gate (Step 1)
**Criteria**: PRD + Architecture + UX + Epics cohesive
**Result**: PASS / FAIL
**If FAIL**: Resolve contradictions before proceeding

### Gate 2: Implementation Readiness (Step 2)
**Criteria**: No blockers, dependencies available, patterns established
**Result**: GREEN / YELLOW / RED
**If RED**: Resolve blockers before Story 0.1

### Gate 3: Security Gate (Step 13)
**Criteria**: Security score > 90/100
**Result**: PASS / WARNING / FAIL
**If FAIL**: Fix critical security issues before code review

### Gate 4: Code Review (Step 14)
**Criteria**: All high-priority issues addressed
**Result**: Approved / Changes Requested / Blocked
**If Blocked**: Major rework needed

### Gate 5: Traceability (Step 18)
**Criteria**: All requirements tested
**Result**: PASS / CONCERNS / FAIL / WAIVED
**If FAIL**: Add missing tests

### Gate 6: NFR Assessment (Step 19)
**Criteria**: Performance, security, reliability meet targets
**Result**: PASS / FAIL
**If FAIL**: Optimize before production

---

## ⚡ Quick Start Checklist

```markdown
# Implementation Checklist

## Pre-Implementation (Before any coding)
- [ ] Step 1: Solutioning Gate Check (Winston) - 20 min
- [ ] Step 2: Implementation Readiness Gate (Amelia + Winston) - 40 min
- [ ] Step 3: Test Infrastructure Setup (Murat) - 45 min
- [ ] Step 4: CI/CD Pipeline (Murat) - 30 min
- [ ] Step 5: Test Design Strategy (Murat) - 40 min
- [ ] Step 6: Generate Epic Tech-Specs if missing (Winston) - 60 min per epic
- [ ] Step 7: Sprint Planning (Bob) - 20 min

## First Story (Story 1.1)
- [ ] Step 8: Create Story (Bob) - 15 min
- [ ] Step 9: Story Context (Auto) - 8 min
- [ ] Step 10: ATDD Tests for Epic 1 (Murat) - 50 min
- [ ] Step 11: Story Ready (Bob) - 2 min
- [ ] Step 12: Dev Story (Amelia) - 2 hours
- [ ] Step 13: Security Gate (Alex/Auto) - 10 min
- [ ] Step 14: Code Review (Alex) - 15 min
- [ ] Step 15: Fix Issues (Amelia) - 30 min
- [ ] Step 16: Final Review (Alex) - 8 min
- [ ] Step 17: Story Done (Bob) - 2 min

## Repeat Steps 8-17 for Stories 1.2 through 1.10

## Epic 1 Completion
- [ ] Step 18: Traceability Matrix (Murat) - 25 min
- [ ] Step 19: NFR Assessment (Murat) - 40 min
- [ ] Step 20: Test Review (Murat) - 25 min
- [ ] Step 21: Documentation Sync (Paige) - 25 min
- [ ] Step 22: Retrospective (Bob) - 25 min
- [ ] Step 23: Update Sprint Status (Bob) - 2 min

## Ready for Epic 2!
- [ ] Generate tech-spec-epic-2.md
- [ ] Repeat story loop for Epic 2 stories
```

---

## 🎓 Best Practices

### 1. Always Use Fresh Chats
- Load each agent in a NEW chat per workflow
- Prevents context bloat and hallucinations
- Ensures consistent agent behavior

### 2. Follow the Sequence
- Don't skip validation steps (Gates 1-2)
- Don't start coding before test infrastructure exists
- Don't skip code review (catches 40-60% of bugs)

### 3. Track Everything
- sprint-status.yaml is single source of truth
- Update story files with implementation notes
- Document blockers and resolutions

### 4. Test-First Mindset
- ATDD tests before implementation (Step 10)
- Tests FAIL initially (RED phase) - this is correct
- Implementation makes tests PASS (GREEN phase)

### 5. Quality Gates Matter
- Security gate prevents 95% of vulnerabilities
- Code review prevents 40-60% of bugs
- Traceability ensures nothing is missed
- NFR assessment prevents performance regressions

### 6. Learn and Adapt
- Retrospectives capture learnings
- Apply lessons to next epic
- Update estimates based on actual durations

---

## 🆘 Troubleshooting

### Issue: "Agent not loading menu"
**Solution**: Ensure you're using the full agent path:
```
/bmad:bmm:agents:architect
```

### Issue: "Workflow not found"
**Solution**: Check workflow manifest for exact path:
```
/bmad:bmm:workflows:create-story
```

### Issue: "Story context too large (token limit)"
**Solution**: Implement context pruning (see V2 improvements)

### Issue: "Tests failing after implementation"
**Solution**:
1. Check test expectations vs implementation
2. Verify all AC are addressed
3. Run tests individually to isolate failures

### Issue: "Code review finds critical issues"
**Solution**: This is expected! Address issues in Step 15 (Fix Review Issues)

---

## 📊 Progress Tracking

### Epic 1 Progress Example

```
Epic 1: Foundation & Core Engine [████████████████████] 100%

Stories:
✅ 1.1 Project Config (done) - 2.5 hours
✅ 1.2 YAML Parser (done) - 3.0 hours
✅ 1.3 LLM Factory (done) - 4.5 hours
✅ 1.4 Agent Pool (done) - 6.0 hours
✅ 1.5 State Manager (done) - 4.0 hours
✅ 1.6 Worktree Manager (done) - 3.5 hours
✅ 1.7 Workflow Engine (done) - 5.0 hours
✅ 1.8 Template Processing (done) - 2.5 hours
✅ 1.9 CLI Foundation (done) - 3.0 hours
✅ 1.10 Error Handling (done) - 3.5 hours

Quality Gates:
✅ Security: 95/100 (PASS)
✅ Code Review: Approved
✅ Traceability: 100% (PASS)
✅ NFR Assessment: PASS
✅ Test Review: Excellent

Duration: 3.5 days (estimated: 3 days)
Accuracy: 117%
```

---

## 🚀 Next Steps

After completing this guide for Epic 1:

1. **Generate tech-spec-epic-2.md** (Winston)
2. **Run ATDD for Epic 2** (Murat)
3. **Repeat story loop** for Epic 2 stories
4. **Continue through Epic 6**

After all 6 epics:
5. **Final system integration test**
6. **Production deployment**
7. **Project retrospective**

---

## 📚 References

- **BMAD Documentation**: /bmad/bmm/docs/
- **Agent Guides**: /bmad/bmm/docs/agents-guide.md
- **Workflow Reference**: /bmad/bmm/docs/workflows-implementation.md
- **TEA Knowledge Base**: /bmad/bmm/testarch/knowledge/
- **Quick Start**: /bmad/bmm/docs/quick-start.md

---

**Document Version**: 1.0
**Last Updated**: 2025-11-04
**Author**: Agent Orchestrator Planning Team
**Status**: Living Document (update as workflow evolves)

---

## 💡 Key Takeaway

**You have all the planning done. Now it's about systematic execution:**

1. ✅ **Validate** (Steps 1-6): Ensure everything is ready
2. 🚀 **Setup** (Step 7): Initialize sprint tracking
3. 🔄 **Execute** (Steps 8-17): Story loop until all done
4. ✨ **Validate** (Steps 18-23): Quality checks and learnings

**The orchestrator will eventually automate Steps 8-17. For now, you're running BMAD manually following this exact sequence. This guide ensures you don't miss critical steps!**

**Ready to start? Begin with Step 1: Solutioning Gate Check! 🎯**
