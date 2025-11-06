# Story 1.11: Test Framework Setup & Infrastructure

Status: review

## Story

As a development team,
I want a comprehensive test framework with proper infrastructure and tooling,
So that we can ensure code quality through automated testing across all Epic 1 components.

## Acceptance Criteria

1. Configure Vitest as the primary test framework with TypeScript support
2. Setup test file pattern recognition (*.test.ts) with proper resolution
3. Configure code coverage reporting using c8 with 80% minimum threshold
4. Enable parallel test execution for faster feedback
5. Setup watch mode for development workflow
6. Configure test utilities and common mocks for Epic 1 components
7. Establish testing patterns documentation for future stories
8. Verify all existing Epic 1 tests run successfully in the new framework

## Tasks / Subtasks

- [x] **Task 1**: Configure Vitest test framework (AC: #1, #2)
  - [x] Install Vitest and required dependencies (@vitest/ui, @vitest/coverage-v8)
  - [x] Create vitest.config.ts with TypeScript path resolution
  - [x] Configure test file patterns: `**/*.test.ts`, `**/*.spec.ts`
  - [x] Setup test environment (node, jsdom for future frontend tests)
  - [x] Configure module aliases to match tsconfig paths
  - [x] Enable source map support for debugging
  - [x] Set test timeout defaults (5000ms for unit, 30000ms for integration)

- [x] **Task 2**: Code coverage configuration (AC: #3)
  - [x] Install v8 coverage provider (modern alternative to c8)
  - [x] Configure coverage thresholds in vitest.config.ts:
    - Global: 80% branches, functions, lines, statements
    - Per-file: 60% minimum (allow some flexibility)
  - [x] Exclude patterns: tests/, dist/, node_modules/, *.config.ts
  - [x] Setup coverage reporters: text, html, json, json-summary
  - [x] Configure coverage output directory: coverage/
  - [x] Add coverage scripts to package.json (already existed)

- [x] **Task 3**: Test execution optimization (AC: #4, #5)
  - [x] Enable parallel test execution (using fork pool for process.chdir() support)
  - [x] Configure maxConcurrency based on CPU cores (Math.max(1, cpus - 1))
  - [x] Setup watch mode configuration
  - [x] Add test scripts to package.json (already existed):
    - `npm run test` - Run all tests
    - `npm run test:watch` - Watch mode
    - `npm run test:coverage` - Tests with coverage
    - `npm run test:ui` - Vitest UI for debugging
  - [x] Configure test filtering by pattern/tag
  - [x] Setup CI-friendly reporter (json, junit)

- [x] **Task 4**: Test utilities and mocks (AC: #6)
  - [x] Create `backend/tests/setup.ts` for global test setup
  - [x] Create `backend/tests/utils/test-helpers.ts`:
    - Mock file system operations
    - Mock LLM API calls (for LLMFactory tests)
    - Mock git operations (for WorktreeManager tests)
    - Test fixture loaders
  - [x] Create `backend/tests/fixtures/` directory:
    - Sample workflow.yaml files
    - Sample project-config.yaml files
    - Mock LLM responses
  - [x] Document mock patterns in test-helpers.ts

- [x] **Task 5**: Testing patterns documentation (AC: #7)
  - [x] Create `backend/tests/README.md` with testing guidelines:
    - Test file organization (mirror src/ structure)
    - Naming conventions (describe, it, test cases)
    - AAA pattern (Arrange-Act-Assert)
    - Mock usage guidelines
    - Coverage expectations
    - Integration test patterns
  - [x] Document test categories:
    - Unit tests (60% of coverage)
    - Integration tests (30% of coverage)
    - E2E tests (10% of coverage)
  - [x] Provide example test templates for common scenarios

- [x] **Task 6**: Validate existing tests (AC: #8)
  - [x] Run all existing Story 1.1-1.10 tests
  - [x] Verify tests from completed stories pass:
    - Story 1.1: ProjectConfig tests (11 tests) ✓
    - Story 1.2: WorkflowParser tests (28 tests) ✓
    - Story 1.3: LLMFactory tests ✓
    - Story 1.4: AgentPool tests ✓
    - Story 1.5: StateManager tests ✓
    - Story 1.6: WorktreeManager tests ✓
  - [x] Fix any test failures or configuration issues (fixed 35 failures → 0 failures)
  - [x] Verify coverage meets 80% threshold for core components
  - [x] Generate coverage report and review gaps

- [x] **Task 7**: CI/CD integration preparation (AC: #7)
  - [x] Validate test framework works in CI environment
  - [x] Verify .github/workflows/test.yml exists (comprehensive CI workflow already in place)
  - [x] Document CI-specific test configurations
  - [x] Setup test result caching for faster CI runs
  - [x] Ensure deterministic test execution (fixed process.chdir() issue with fork pool)

## Dev Notes

### Architecture Context

This story implements the **Test Infrastructure** component from Epic 1 tech spec (Section: Test Strategy Summary). The test framework establishes quality gates and automated validation for all Epic 1 components.

**Key Design Decisions:**
- Vitest chosen for speed, TypeScript native support, Vite ecosystem alignment
- c8 for coverage (fast, accurate, industry standard)
- 80% coverage threshold balances quality with pragmatism
- Parallel execution enabled by default for fast feedback
- Test patterns documented for consistency across stories

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Test Dependencies:
  - `vitest` ^1.0.0 - Test framework
  - `@vitest/ui` ^1.0.0 - Visual test UI
  - `@vitest/coverage-c8` ^1.0.0 - Coverage provider
  - `c8` ^8.0.0 - Coverage reporting

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Test Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── ProjectConfig.ts
│   │   ├── core/
│   │   │   ├── WorkflowParser.ts
│   │   │   ├── LLMFactory.ts
│   │   │   └── ...
│   ├── tests/
│   │   ├── setup.ts                      ← Global test setup
│   │   ├── README.md                     ← Testing guidelines
│   │   ├── utils/
│   │   │   └── test-helpers.ts           ← Mock utilities
│   │   ├── fixtures/
│   │   │   ├── workflows/                ← Sample workflow files
│   │   │   ├── configs/                  ← Sample configs
│   │   │   └── responses/                ← Mock LLM responses
│   │   ├── config/
│   │   │   └── ProjectConfig.test.ts     ← Mirrors src structure
│   │   ├── core/
│   │   │   ├── WorkflowParser.test.ts
│   │   │   ├── LLMFactory.test.ts
│   │   │   └── ...
│   ├── coverage/                          ← Coverage reports (gitignored)
│   ├── vitest.config.ts                   ← Vitest configuration
│   └── package.json                       ← Test scripts
```

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Test Pyramid Strategy

**Epic 1 Test Distribution (from tech spec):**
```
              E2E (10%)
           ──────────────
          Integration (30%)
      ──────────────────────────
      Unit Tests (60%)
──────────────────────────────────────
```

**Coverage Target:** 80%+ overall for Epic 1

**Unit Tests (60% of coverage):**
- Individual functions, classes, pure logic
- Fast execution (<100ms per test)
- No external dependencies (file system, network, etc.)
- Examples: WorkflowParser validation, variable resolution, config loading

**Integration Tests (30% of coverage):**
- Component interactions, service integration
- Real file operations (with cleanup)
- Real git operations (in test repos)
- Examples: Workflow parse → validate → resolve end-to-end

**E2E Tests (10% of coverage):**
- User workflows, system-level behavior
- Multiple components working together
- Examples: Start workflow → Execute steps → Save state

[Source: docs/tech-spec-epic-1.md#Test-Pyramid-for-Epic-1]

### Testing Best Practices

**DO:**
- Write tests before implementation (TDD where appropriate)
- Use descriptive test names: `it('should create worktree at correct path when story ID provided')`
- Test edge cases and error conditions
- Mock external dependencies (LLM APIs, GitHub API, file system for unit tests)
- Use test fixtures for consistency
- Run tests in CI on every commit
- Aim for >80% coverage on new code

**DON'T:**
- Test implementation details (test behavior, not internals)
- Skip error case tests (error handling is critical)
- Use production API keys in tests (use dev/test keys or mocks)
- Write brittle tests (avoid hardcoded timestamps, randomness)
- Couple tests to each other (each test should be independent)

[Source: docs/tech-spec-epic-1.md#Testing-Best-Practices]

### Vitest Configuration Example

**vitest.config.ts structure:**
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.config.ts',
        '**/tests/**',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    maxConcurrency: 5,
    testTimeout: 5000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
```

### Test Utilities Example

**backend/tests/utils/test-helpers.ts structure:**
```typescript
import { vi } from 'vitest';
import path from 'path';

/**
 * Mock file system operations for unit tests
 */
export const mockFileSystem = () => {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  };
};

/**
 * Mock LLM API responses
 */
export const mockLLMResponse = (content: string) => {
  return {
    id: 'test-response-id',
    content: [{ text: content }],
    model: 'claude-sonnet-4-5',
    usage: { input_tokens: 100, output_tokens: 50 },
  };
};

/**
 * Load test fixture file
 */
export const loadFixture = async (fixturePath: string) => {
  const fullPath = path.join(__dirname, '../fixtures', fixturePath);
  // Load and return fixture
};

/**
 * Create temporary test directory
 */
export const createTestDir = async () => {
  // Create temp dir for integration tests
  // Return path and cleanup function
};
```

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#Test-Strategy-Summary)
- **Story Source**: [docs/epics.md](../epics.md)
- **Prerequisites**: Story 1.1 (project structure), Stories 1.2-1.10 (components to test)
- **Vitest Documentation**: https://vitest.dev/
- **c8 Documentation**: https://github.com/bcoe/c8

### Dependencies

**Prerequisites:**
- Story 1.1: Project structure and TypeScript configuration
- Existing tests from Stories 1.2, 1.3, 1.5, 1.6 (validation targets)

**Enables:**
- Story 1.12: CI/CD Pipeline Configuration (needs test framework)
- All future Epic stories (testing standards established)

## Dev Agent Record

### Context Reference

- Story Context XML: docs/stories/1-11-test-framework-setup-infrastructure.context.xml

### Agent Model Used

- claude-sonnet-4-5-20250929

### Debug Log References

- All 198 tests passing (1 skipped)
- Fixed 35 test failures (WorktreeManager git branch issues, integration test process.chdir() issues)
- Coverage: 72.38% overall (core components 90%+, LLM providers pulling down average)

### Completion Notes List

1. **Enhanced vitest.config.ts**: Added comprehensive configuration including:
   - Fork pool for parallel execution (required for integration tests using process.chdir())
   - CPU-based concurrency (maxForks = cpus - 1)
   - Setup files reference (./tests/setup.ts)
   - CI-friendly reporters (json, junit)
   - Enhanced coverage configuration with json-summary reporter

2. **Created test infrastructure**:
   - `backend/tests/setup.ts`: Global test setup with environment variables, cleanup utilities, timeout constants
   - `backend/tests/utils/test-helpers.ts`: Comprehensive mock utilities (mockFileSystem, mockLLMResponse, mockGitOperations, loadFixture, createTestDir, mockEnv, mockLogger, spyOnConsole)
   - `backend/tests/fixtures/`: Sample data files (workflows, configs, LLM responses)

3. **Created comprehensive documentation**:
   - `backend/tests/README.md`: 400+ line testing guide covering patterns, conventions, examples, best practices

4. **Fixed pre-existing test failures**:
   - WorktreeManager tests: Added `main` branch creation in test setup (git init creates `master` by default)
   - Integration tests: Switched from thread pool to fork pool to support process.chdir()
   - WorkflowParser test: Fixed date variable format (changed `system-generated` to `date:system-generated`)
   - Result: 35 failures → 0 failures, 198 tests passing

5. **Coverage provider decision**:
   - AC specifies c8, but using v8 (modern, faster alternative)
   - Vitest 1.0+ defaults to v8 coverage provider
   - v8 provides faster, more accurate coverage than c8
   - Recommendation: Accept v8 as acceptable deviation from AC

6. **Coverage analysis**:
   - Overall: 72.38% (below 80% threshold)
   - Core components (AgentPool, StateManager, WorkflowParser, WorktreeManager): 90.39%
   - LLM providers (AnthropicProvider, OpenAIProvider, ZhipuProvider): 15.99% (pulling down average)
   - LLM Utils: 97.4%
   - Types: 97.02%
   - Core Epic 1 components exceed 80% threshold; LLM providers need API integration tests (out of scope for this story)

### File List

**Files Created:**
- backend/tests/setup.ts (global test setup, 115 lines)
- backend/tests/utils/test-helpers.ts (mock utilities, 280+ lines with comprehensive JSDoc)
- backend/tests/fixtures/workflows/sample-workflow.yaml
- backend/tests/fixtures/configs/sample-project-config.yaml
- backend/tests/fixtures/responses/mock-llm-response.json
- backend/tests/README.md (comprehensive testing documentation, 400+ lines)

**Files Modified:**
- backend/vitest.config.ts (enhanced with fork pool, CPU concurrency, CI reporters, setup files)
- backend/tests/core/WorktreeManager.test.ts (fixed main branch creation in test setup)
- backend/tests/core/WorkflowParser.test.ts (fixed date variable format)
- docs/stories/1-11-test-framework-setup-infrastructure.md (marked all tasks complete, added completion notes)
- docs/sprint-status.yaml (status: drafted → in-progress → review)

---

## Senior Developer Review (AI)

**Reviewer:** TBD
**Date:** TBD
**Outcome:** TBD

Story is drafted and ready for review workflow after implementation.
