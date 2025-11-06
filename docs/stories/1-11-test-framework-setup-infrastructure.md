# Story 1.11: Test Framework Setup & Infrastructure

Status: drafted

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

- [ ] **Task 1**: Configure Vitest test framework (AC: #1, #2)
  - [ ] Install Vitest and required dependencies (@vitest/ui, @vitest/coverage-c8)
  - [ ] Create vitest.config.ts with TypeScript path resolution
  - [ ] Configure test file patterns: `**/*.test.ts`, `**/*.spec.ts`
  - [ ] Setup test environment (node, jsdom for future frontend tests)
  - [ ] Configure module aliases to match tsconfig paths
  - [ ] Enable source map support for debugging
  - [ ] Set test timeout defaults (5000ms for unit, 30000ms for integration)

- [ ] **Task 2**: Code coverage configuration (AC: #3)
  - [ ] Install c8 coverage provider
  - [ ] Configure coverage thresholds in vitest.config.ts:
    - Global: 80% branches, functions, lines, statements
    - Per-file: 60% minimum (allow some flexibility)
  - [ ] Exclude patterns: tests/, dist/, node_modules/, *.config.ts
  - [ ] Setup coverage reporters: text, html, json
  - [ ] Configure coverage output directory: coverage/
  - [ ] Add coverage scripts to package.json

- [ ] **Task 3**: Test execution optimization (AC: #4, #5)
  - [ ] Enable parallel test execution (default: true, validate it works)
  - [ ] Configure maxConcurrency based on CPU cores
  - [ ] Setup watch mode configuration
  - [ ] Add test scripts to package.json:
    - `npm run test` - Run all tests
    - `npm run test:watch` - Watch mode
    - `npm run test:coverage` - Tests with coverage
    - `npm run test:ui` - Vitest UI for debugging
  - [ ] Configure test filtering by pattern/tag
  - [ ] Setup CI-friendly reporter (json, junit)

- [ ] **Task 4**: Test utilities and mocks (AC: #6)
  - [ ] Create `backend/tests/setup.ts` for global test setup
  - [ ] Create `backend/tests/utils/test-helpers.ts`:
    - Mock file system operations
    - Mock LLM API calls (for LLMFactory tests)
    - Mock git operations (for WorktreeManager tests)
    - Test fixture loaders
  - [ ] Create `backend/tests/fixtures/` directory:
    - Sample workflow.yaml files
    - Sample project-config.yaml files
    - Mock LLM responses
  - [ ] Document mock patterns in test-helpers.ts

- [ ] **Task 5**: Testing patterns documentation (AC: #7)
  - [ ] Create `backend/tests/README.md` with testing guidelines:
    - Test file organization (mirror src/ structure)
    - Naming conventions (describe, it, test cases)
    - AAA pattern (Arrange-Act-Assert)
    - Mock usage guidelines
    - Coverage expectations
    - Integration test patterns
  - [ ] Document test categories:
    - Unit tests (60% of coverage)
    - Integration tests (30% of coverage)
    - E2E tests (10% of coverage)
  - [ ] Provide example test templates for common scenarios

- [ ] **Task 6**: Validate existing tests (AC: #8)
  - [ ] Run all existing Story 1.1-1.10 tests
  - [ ] Verify tests from completed stories pass:
    - Story 1.1: ProjectConfig tests (11 tests)
    - Story 1.2: WorkflowParser tests (28 tests)
    - Story 1.3: LLMFactory tests (expected)
    - Story 1.5: StateManager tests (expected)
    - Story 1.6: WorktreeManager tests (expected)
  - [ ] Fix any test failures or configuration issues
  - [ ] Verify coverage meets 80% threshold for completed stories
  - [ ] Generate coverage report and review gaps

- [ ] **Task 7**: CI/CD integration preparation (AC: #7)
  - [ ] Validate test framework works in CI environment
  - [ ] Create .github/workflows/test.yml template (ready for Story 1.12)
  - [ ] Document CI-specific test configurations
  - [ ] Setup test result caching for faster CI runs
  - [ ] Ensure deterministic test execution (no flaky tests)

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

- Story Context XML will be generated by story-context workflow

### Agent Model Used

- TBD (will be assigned when story moves to in-progress)

### Debug Log References

- TBD (will be populated during implementation)

### Completion Notes List

- TBD (will be populated during implementation)

### File List

**Expected Files to Create:**
- backend/vitest.config.ts
- backend/tests/setup.ts
- backend/tests/README.md
- backend/tests/utils/test-helpers.ts
- backend/tests/fixtures/workflows/sample-workflow.yaml
- backend/tests/fixtures/configs/sample-project-config.yaml

**Expected Files to Modify:**
- backend/package.json (add test scripts and dependencies)
- docs/stories/1-11-test-framework-setup-infrastructure.md (task checkboxes, dev notes)
- docs/sprint-status.yaml (status: backlog → drafted → ready-for-dev)

---

## Senior Developer Review (AI)

**Reviewer:** TBD
**Date:** TBD
**Outcome:** TBD

Story is drafted and ready for review workflow after implementation.
