# ATDD Checklist - Story 1.1: Project Repository Structure & Configuration

**Generated**: 2025-11-04  
**Story**: Epic 1, Story 1.1  
**Test Level**: Integration (API/Business Logic)  
**Status**: RED Phase (All tests failing - awaiting implementation)

---

## Story Summary

**User Story**:  
As a system architect,  
I want a well-organized project structure with configuration management,  
So that the orchestrator can load project-specific settings and maintain clean separation of concerns.

**Value**: Foundation for all configuration-driven behavior in the orchestrator

---

## Acceptance Criteria → Test Mapping

### AC1: TypeScript Project Setup

**Tests Created**:
- ✅ `should have valid TypeScript configuration`
- ✅ `should have valid package.json with dependencies`

**Coverage**: TypeScript config, dependencies, project setup

---

### AC2: Directory Structure

**Tests Created**:
- ✅ `should create src/ directory with proper structure`
- ✅ `should create tests/ directory with integration subdirectory`
- ✅ `should have .bmad/ directory for configuration`

**Coverage**: Complete directory scaffold verification

---

### AC3: ProjectConfig Class - Load Configuration

**Tests Created**:
- ✅ `should load valid project-config.yaml successfully`
- ✅ `should throw error when config file does not exist`

**Coverage**: Basic load functionality, error handling

---

### AC4: Load Project Metadata and Agent Assignments

**Tests Created**:
- ✅ `should load project metadata fields`
- ✅ `should load agent LLM assignments`
- ✅ `should load onboarding docs paths`

**Coverage**: All configuration fields from spec

---

### AC5: Configuration Schema Validation

**Tests Created**:
- ✅ `should validate required fields on load`
- ✅ `should validate project_level is within range`
- ✅ `should validate project_type is valid enum`
- ✅ `should validate agent model names`

**Coverage**: Comprehensive validation with clear error messages

---

### AC6: Example Configuration with Documentation

**Tests Created**:
- ✅ `should provide example project-config.yaml file`
- ✅ `should have inline documentation in example config`

**Coverage**: Developer experience, onboarding

---

## Test Files Created

### Integration Tests
- **File**: `backend/tests/integration/project-config.spec.ts`
- **Test Count**: 15 tests across 6 acceptance criteria
- **Pattern**: Given-When-Then structure
- **Dependencies**: Vitest, Node fs/promises, path

### Supporting Infrastructure
- **Data Factory**: `tests/support/factories/config.factory.ts`
  - `createConfigFactory()` - Creates valid YAML config with overrides
  - `createMinimalConfigFactory()` - Minimal valid config
  - `createInvalidConfigFactory()` - Invalid configs for error testing

- **Test Fixtures**: `tests/support/fixtures/config.fixture.ts`
  - `configFileFixture()` - Temp directory with auto-cleanup
  - `configFileWithContentFixture()` - Pre-written config file fixture

---

## Implementation Checklist

### Phase 1: Backend Workspace Setup

- [ ] **Task 1.1**: Initialize backend workspace
  ```bash
  cd backend
  npm init -y
  ```
  - [ ] Update package.json with name: `@agent-orchestrator/backend`
  - [ ] Add description: "Autonomous workflow orchestration engine"

- [ ] **Task 1.2**: Install dependencies
  ```bash
  npm install @anthropic-ai/sdk openai js-yaml
  npm install -D vitest @types/node typescript @vitest/ui
  ```

- [ ] **Task 1.3**: Create TypeScript configuration
  - [ ] Create `backend/tsconfig.json`
  - [ ] Set target: ES2020
  - [ ] Set module: commonjs
  - [ ] Enable strict mode
  - [ ] Set outDir: dist
  - [ ] Set rootDir: src

- [ ] **Task 1.4**: Create directory structure
  ```bash
  mkdir -p backend/src/config
  mkdir -p backend/tests/integration
  mkdir -p backend/dist
  mkdir -p .bmad
  ```

- [ ] **Task 1.5**: Create Vitest configuration
  - [ ] Create `backend/vitest.config.ts`
  - [ ] Configure test patterns: `tests/**/*.spec.ts`
  - [ ] Enable coverage reporting

- [ ] **Task 1.6**: Add test scripts to package.json
  ```json
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "build": "tsc",
    "dev": "tsc --watch"
  }
  ```

**Verify**: Run `npm run test` - Should find 15 failing tests ✅

---

### Phase 2: ProjectConfig Class Implementation

- [ ] **Task 2.1**: Create ProjectConfig class skeleton
  - [ ] File: `backend/src/config/ProjectConfig.ts`
  - [ ] Export `ProjectConfig` class
  - [ ] Add static `load(configPath: string)` method

- [ ] **Task 2.2**: Implement YAML loading
  - [ ] Use `js-yaml` to parse config file
  - [ ] Read file with `fs.promises.readFile()`
  - [ ] Handle file not found error with clear message

**Test Target**: `should load valid project-config.yaml successfully`  
**Run**: `npm run test -- project-config.spec.ts -t "should load valid"`

- [ ] **Task 2.3**: Add configuration properties
  - [ ] `projectName: string`
  - [ ] `projectType: string`
  - [ ] `projectLevel: number`
  - [ ] `fieldType: string`
  - [ ] `description: string`
  - [ ] `agentAssignments: Record<string, string>`
  - [ ] `onboardingDocs: string[]`

- [ ] **Task 2.4**: Implement `getAgentModel(agentName: string)` method
  - [ ] Return model from agentAssignments map
  - [ ] Throw error if agent not found

**Test Target**: `should load agent LLM assignments`  
**Run**: `npm run test -- project-config.spec.ts -t "should load agent"`

---

### Phase 3: Configuration Validation

- [ ] **Task 3.1**: Create validation helper
  - [ ] File: `backend/src/config/validation.ts`
  - [ ] Export `validateConfig(data: any): void` function

- [ ] **Task 3.2**: Validate required fields
  - [ ] Check `project_name` exists (required)
  - [ ] Check `project_type` exists (required)
  - [ ] Check `project_level` exists (required)
  - [ ] Throw descriptive error: "Missing required field: {field}"

**Test Target**: `should validate required fields on load`  
**Run**: `npm run test -- project-config.spec.ts -t "validate required"`

- [ ] **Task 3.3**: Validate project_level range
  - [ ] Check `project_level` is number
  - [ ] Check `project_level` is between 0 and 4
  - [ ] Throw error: "project_level must be between 0 and 4"

**Test Target**: `should validate project_level is within range`

- [ ] **Task 3.4**: Validate project_type enum
  - [ ] Define valid types: ['software', 'game', 'narrative', 'product']
  - [ ] Check project_type is in valid list
  - [ ] Throw error with allowed values

**Test Target**: `should validate project_type is valid enum`

- [ ] **Task 3.5**: Validate agent model names
  - [ ] Define valid model patterns (claude-*, gpt-*)
  - [ ] Validate each model in agent_assignments
  - [ ] Throw error: "Invalid model name: {model}"

**Test Target**: `should validate agent model names`

- [ ] **Task 3.6**: Integrate validation into ProjectConfig.load()
  - [ ] Call validateConfig() after parsing YAML
  - [ ] Catch and re-throw validation errors with context

**Verify**: Run `npm run test -- project-config.spec.ts` - AC5 tests should pass

---

### Phase 4: Example Configuration File

- [ ] **Task 4.1**: Create example config file
  - [ ] File: `.bmad/project-config.example.yaml`
  - [ ] Include all configuration fields
  - [ ] Add inline comments explaining each field

- [ ] **Task 4.2**: Document configuration structure
  ```yaml
  # Project Configuration
  # This file defines project metadata and agent LLM assignments

  project_name: "Agent Orchestrator"
  project_type: software  # Options: software, game, narrative, product
  project_level: 3        # Range: 0-4 (complexity level)
  field_type: greenfield  # Options: greenfield, brownfield
  description: "Autonomous BMAD workflow execution system"

  # Agent LLM assignments
  # Maps agent personas to specific LLM models
  agent_assignments:
    mary: "claude-sonnet-4-5"      # Business Analyst
    winston: "claude-sonnet-4-5"   # System Architect
    amelia: "claude-haiku-4-0"     # Developer (faster model)

  # Onboarding documentation paths
  # Relative paths from project root
  onboarding_docs:
    - "docs/architecture.md"
    - "docs/PRD.md"
    - "docs/epics.md"
  ```

**Test Target**: `should provide example project-config.yaml file`  
**Run**: `npm run test -- project-config.spec.ts -t "example"`

**Verify**: All 15 tests should pass ✅ (GREEN phase achieved)

---

## Red-Green-Refactor Workflow

### 🔴 RED Phase (Complete)

**Status**: All tests written and failing  
**Verification**: Run `npm run test` - 15 tests fail

**Failure Reasons** (Expected):
- ProjectConfig class does not exist
- Dependencies not installed
- Directory structure not created

This is CORRECT - tests fail because implementation is missing.

---

### 🟢 GREEN Phase (DEV Team - Use Checklist Above)

**Workflow**:
1. Pick ONE task from Implementation Checklist
2. Implement minimal code to make related test(s) pass
3. Run specific test to verify green
4. Commit change
5. Move to next task
6. Repeat until all 15 tests pass

**Example Cycle**:
```bash
# 1. Pick Task 2.1 (Create ProjectConfig skeleton)
# 2. Implement minimal class
# 3. Run test
npm run test -- project-config.spec.ts -t "should load valid"

# 4. If green, commit
git add backend/src/config/ProjectConfig.ts
git commit -m "feat: add ProjectConfig skeleton (Story 1.1, Task 2.1)"

# 5. Move to Task 2.2
```

**Goal**: Minimum viable implementation, no over-engineering

---

### 🔵 REFACTOR Phase (DEV Team - After All Green)

**When**: All 15 tests passing  
**Focus**: Code quality improvements with test safety net

**Refactoring Opportunities**:
- Extract validation logic to separate module
- Add TypeScript interfaces for config schema
- Improve error messages with more context
- Add JSDoc documentation
- Optimize file I/O (caching, async optimization)

**Rules**:
- Tests must remain green after each refactor
- One refactor at a time
- Run full test suite after each change

---

## Running Tests

### Full Test Suite
```bash
cd backend
npm run test
```

### Specific Test File
```bash
npm run test -- project-config.spec.ts
```

### Single Test
```bash
npm run test -- project-config.spec.ts -t "should load valid"
```

### Watch Mode (TDD)
```bash
npm run test -- --watch
```

### UI Mode (Visual Debugging)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

---

## Required data-testid Attributes

**None** - This story is backend-only (no UI components)

---

## Mock Requirements

**None** - Story 1.1 has no external service dependencies

**Note**: Future stories (1.3+) will require:
- Mock Anthropic API for LLM testing
- Mock OpenAI API for LLM testing

---

## Expected Test Output (RED Phase)

```
 FAIL  backend/tests/integration/project-config.spec.ts
  ProjectConfig - Story 1.1
    AC1: TypeScript Project Setup
      ✕ should have valid TypeScript configuration (2 ms)
      ✕ should have valid package.json with dependencies (1 ms)
    AC2: Directory Structure
      ✕ should create src/ directory with proper structure
      ✕ should create tests/ directory with integration subdirectory
      ✕ should have .bmad/ directory for configuration
    AC3: ProjectConfig Class - Load Configuration
      ✕ should load valid project-config.yaml successfully
      ✕ should throw error when config file does not exist
    AC4: Support Loading Project Metadata and Agent Assignments
      ✕ should load project metadata fields
      ✕ should load agent LLM assignments
      ✕ should load onboarding docs paths
    AC5: Configuration Schema Validation
      ✕ should validate required fields on load
      ✕ should validate project_level is within range
      ✕ should validate project_type is valid enum
      ✕ should validate agent model names
    AC6: Example Configuration with Documentation
      ✕ should provide example project-config.yaml file
      ✕ should have inline documentation in example config

Test Files  1 failed (1)
     Tests  15 failed (15)
```

This is CORRECT for RED phase!

---

## Expected Test Output (GREEN Phase - Target)

```
 PASS  backend/tests/integration/project-config.spec.ts
  ProjectConfig - Story 1.1
    AC1: TypeScript Project Setup
      ✓ should have valid TypeScript configuration (2 ms)
      ✓ should have valid package.json with dependencies (1 ms)
    AC2: Directory Structure
      ✓ should create src/ directory with proper structure (1 ms)
      ✓ should create tests/ directory with integration subdirectory
      ✓ should have .bmad/ directory for configuration
    AC3: ProjectConfig Class - Load Configuration
      ✓ should load valid project-config.yaml successfully (5 ms)
      ✓ should throw error when config file does not exist (2 ms)
    AC4: Support Loading Project Metadata and Agent Assignments
      ✓ should load project metadata fields (4 ms)
      ✓ should load agent LLM assignments (3 ms)
      ✓ should load onboarding docs paths (3 ms)
    AC5: Configuration Schema Validation
      ✓ should validate required fields on load (3 ms)
      ✓ should validate project_level is within range (2 ms)
      ✓ should validate project_type is valid enum (2 ms)
      ✓ should validate agent model names (2 ms)
    AC6: Example Configuration with Documentation
      ✓ should provide example project-config.yaml file (1 ms)
      ✓ should have inline documentation in example config (2 ms)

Test Files  1 passed (1)
     Tests  15 passed (15)
  Duration  45ms
```

---

## Definition of Done

Story 1.1 is DONE when:

- [ ] All 15 tests pass (GREEN phase)
- [ ] Code coverage ≥60% for ProjectConfig class
- [ ] No linter errors (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Example config file exists with documentation
- [ ] CI pipeline passes (lint + test + build)
- [ ] Code reviewed and approved
- [ ] Merged to main branch

---

## TDD-Guard Integration Notes

**Your tdd-guard hook enforces**:
- Tests must exist before implementation files
- Tests must be run and pass before committing

**Workflow with tdd-guard**:
1. Tests already exist (this ATDD deliverable) ✅
2. Implement code to make tests pass (GREEN phase)
3. Run `npm run test` to verify
4. Commit - tdd-guard validates tests pass ✅
5. CI runs full test suite automatically ✅

**Result**: tdd-guard + ATDD + CI = Complete test-first workflow! 🎉

---

## Knowledge Base References Applied

- **Fixture Architecture** (`fixture-architecture.md`): Auto-cleanup pattern in config.fixture.ts
- **Data Factories** (`data-factories.md`): Override pattern in config.factory.ts
- **Test Quality** (`test-quality.md`): Given-When-Then structure, atomic assertions
- **Test Levels Framework** (`test-levels-framework.md`): Integration level selected for config logic

---

## Next Steps

1. **Start Implementation**: Follow Implementation Checklist Phase 1
2. **TDD Cycle**: Run tests → implement → verify green → commit
3. **CI Validation**: Push to trigger GitHub Actions pipeline
4. **Review**: Request code review when all tests pass
5. **Merge**: Merge to main after approval
6. **Story 1.2**: Begin next story (Workflow YAML Parser)

---

**ATDD Complete - Ready for GREEN Phase** 🟢  
**Developer**: Follow checklist above, one task at a time  
**Questions**: Review Story 1.1 in `docs/epics.md` or consult TEA agent

**Generated by**: TEA Agent (Murat - Master Test Architect)  
**Workflow**: `bmad/bmm/testarch/atdd`  
**Date**: 2025-11-04
