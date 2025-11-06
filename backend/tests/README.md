# Agent Orchestrator Test Suite

Comprehensive testing documentation for the Agent Orchestrator backend.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Patterns](#test-patterns)
- [Coverage Guidelines](#coverage-guidelines)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)

## Overview

This test suite uses [Vitest](https://vitest.dev/) as the testing framework, providing:

- **Fast execution**: Parallel test runs using CPU cores
- **TypeScript support**: Native TypeScript integration
- **Code coverage**: 80% minimum threshold across all metrics
- **Watch mode**: Real-time test feedback during development
- **CI integration**: JUnit and JSON reporters for CI/CD pipelines

### Test Pyramid

Our testing strategy follows the test pyramid pattern:

```
              E2E (10%)
           ──────────────
          Integration (30%)
      ──────────────────────────
      Unit Tests (60%)
──────────────────────────────────────
```

- **Unit Tests (60%)**: Fast, isolated tests of individual functions and classes
- **Integration Tests (30%)**: Tests of component interactions and service integration
- **E2E Tests (10%)**: Full workflow tests from start to finish

## Test Structure

Tests mirror the `src/` directory structure for easy navigation:

```
backend/
├── src/
│   ├── config/
│   │   └── ProjectConfig.ts
│   ├── core/
│   │   ├── WorkflowParser.ts
│   │   ├── LLMFactory.ts
│   │   └── ...
│   └── ...
├── tests/
│   ├── setup.ts                    # Global test setup
│   ├── README.md                   # This file
│   ├── utils/
│   │   └── test-helpers.ts         # Mock utilities
│   ├── fixtures/
│   │   ├── workflows/              # Sample workflow files
│   │   ├── configs/                # Sample configs
│   │   └── responses/              # Mock LLM responses
│   ├── config/
│   │   └── ProjectConfig.test.ts   # Mirrors src/config/
│   ├── core/
│   │   ├── WorkflowParser.test.ts  # Mirrors src/core/
│   │   └── ...
│   └── integration/
│       └── *.integration.test.ts   # Integration tests
```

## Running Tests

### Available Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (interactive debugging)
npm run test:ui

# Run specific test file
npm run test tests/core/WorkflowParser.test.ts

# Run tests matching a pattern
npm run test -- --grep "WorkflowParser"
```

### Test Execution

- **Parallel Execution**: Tests run in parallel across CPU cores for speed
- **Timeout Defaults**:
  - Unit tests: 5000ms
  - Integration tests: 30000ms (use `{ timeout: 30000 }` option)
  - E2E tests: 60000ms

## Writing Tests

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

### Test Structure (AAA Pattern)

Use the **Arrange-Act-Assert** pattern for clarity:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Arrange: Set up test preconditions
  });

  // Cleanup
  afterEach(() => {
    // Clean up resources
  });

  it('should [expected behavior] when [condition]', () => {
    // Arrange: Prepare test data
    const input = 'test data';

    // Act: Execute the code under test
    const result = functionUnderTest(input);

    // Assert: Verify the result
    expect(result).toBe('expected output');
  });
});
```

### Naming Conventions

**Test Names**: Use descriptive names following the pattern:

```typescript
it('should [expected behavior] when [condition]', () => {});

// Examples:
it('should parse valid workflow YAML when file exists', () => {});
it('should throw WorkflowParseError when required field is missing', () => {});
it('should create worktree at correct path when story ID provided', () => {});
```

**Test Suites**: Group related tests using `describe`:

```typescript
describe('WorkflowParser', () => {
  describe('parseYAML', () => {
    it('should parse valid YAML', () => {});
    it('should validate required fields', () => {});
  });

  describe('resolveVariables', () => {
    it('should resolve system variables', () => {});
    it('should resolve config variables', () => {});
  });
});
```

## Test Patterns

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { WorkflowParser } from '@core/WorkflowParser';

describe('WorkflowParser - parseYAML', () => {
  it('should parse valid workflow YAML file', async () => {
    // Arrange
    const parser = new WorkflowParser();
    const yamlContent = `
      name: "Test Workflow"
      description: "Test description"
    `;

    // Act
    const config = await parser.parseYAMLContent(yamlContent);

    // Assert
    expect(config.name).toBe('Test Workflow');
    expect(config.description).toBe('Test description');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDir } from '@tests/utils/test-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('WorkflowParser - Integration', () => {
  let testDir: { path: string; cleanup: () => Promise<void> };

  beforeEach(async () => {
    testDir = await createTestDir('workflow-parser');
  });

  afterEach(async () => {
    await testDir.cleanup();
  });

  it('should parse workflow from file system', async () => {
    // Arrange
    const workflowPath = path.join(testDir.path, 'workflow.yaml');
    const content = 'name: "Test"\ndescription: "Test"';
    await fs.writeFile(workflowPath, content);

    // Act
    const parser = new WorkflowParser();
    const config = await parser.parseYAML(workflowPath);

    // Assert
    expect(config.name).toBe('Test');
  }, 30000); // 30s timeout for integration test
});
```

### Error Testing Example

```typescript
import { describe, it, expect } from 'vitest';
import { WorkflowParseError } from '@core/errors';

describe('WorkflowParser - Error Handling', () => {
  it('should throw WorkflowParseError when file not found', async () => {
    // Arrange
    const parser = new WorkflowParser();
    const invalidPath = '/nonexistent/workflow.yaml';

    // Act & Assert
    await expect(parser.parseYAML(invalidPath))
      .rejects
      .toThrow(WorkflowParseError);
  });

  it('should throw with specific error message', async () => {
    // Arrange
    const parser = new WorkflowParser();
    const invalidPath = '/nonexistent/workflow.yaml';

    // Act & Assert
    await expect(parser.parseYAML(invalidPath))
      .rejects
      .toThrow('Workflow file not found');
  });
});
```

## Coverage Guidelines

### Coverage Targets

- **Overall**: 80% minimum (lines, functions, branches, statements)
- **Per-file**: 60% minimum (allows some flexibility)
- **New code**: Aim for >80% coverage

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

### What to Cover

**DO cover**:
- Business logic and algorithms
- Error handling paths
- Edge cases and boundary conditions
- Public API methods
- Integration points

**DON'T cover** (excluded by config):
- Type definitions (`*.d.ts`)
- Configuration files (`*.config.ts`)
- Index files that only export
- Test files themselves

## Mocking Strategies

### Using Test Helpers

The `tests/utils/test-helpers.ts` file provides common mocks:

```typescript
import {
  mockFileSystem,
  mockLLMResponse,
  mockGitOperations,
  loadFixture,
  createTestDir,
} from '@tests/utils/test-helpers';

// Mock file system
const mockFs = mockFileSystem();
mockFs.readFile.mockResolvedValue('file content');

// Mock LLM response
const response = mockLLMResponse('Hello, world!');

// Mock git operations
const mockGit = mockGitOperations();
mockGit.status.mockResolvedValue({ current: 'main' });

// Load test fixtures
const workflow = await loadFixture('workflows/sample-workflow.yaml');

// Create temp directory
const { path, cleanup } = await createTestDir('my-test');
```

### Mocking External Dependencies

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock environment variables
import { mockEnv } from '@tests/utils/test-helpers';

const cleanup = mockEnv({ API_KEY: 'test-key' });
// ... run tests
cleanup();
```

### Spying on Methods

```typescript
import { vi } from 'vitest';

// Spy on console output
const consoleSpy = vi.spyOn(console, 'error');

// ... run test

expect(consoleSpy).toHaveBeenCalledWith('error message');
consoleSpy.mockRestore();
```

## Best Practices

### DO

✅ **Write tests before implementation** (TDD where appropriate)
- Forces you to think about the API and edge cases
- Results in better, more testable code

✅ **Use descriptive test names**
- `it('should create worktree at correct path when story ID provided')`
- Makes failures self-documenting

✅ **Test edge cases and error conditions**
- Null/undefined inputs
- Empty arrays/strings
- Invalid data formats
- Network failures

✅ **Mock external dependencies**
- LLM API calls
- File system (for unit tests)
- Git operations
- Network requests

✅ **Use test fixtures for consistency**
- Load sample data from `fixtures/` directory
- Ensures tests use realistic data

✅ **Run tests in CI on every commit**
- Catches regressions early
- Ensures code quality

✅ **Clean up test resources**
- Use `afterEach` to clean up files/directories
- Use `createTestDir` helper for auto-cleanup

✅ **Aim for >80% coverage on new code**
- Use coverage reports to identify gaps
- Focus on business logic and critical paths

### DON'T

❌ **Test implementation details**
- Test behavior, not internals
- Refactoring shouldn't break tests

❌ **Skip error case tests**
- Error handling is critical
- Test failure paths thoroughly

❌ **Use production API keys in tests**
- Use mock responses or test keys
- Never commit real credentials

❌ **Write brittle tests**
- Avoid hardcoded timestamps
- Don't rely on test execution order
- Use deterministic data

❌ **Couple tests to each other**
- Each test should be independent
- Tests should pass in any order

❌ **Ignore flaky tests**
- Fix or remove flaky tests immediately
- Use proper async/await patterns
- Ensure proper cleanup

## Test Categories

### Unit Tests (60% of coverage)

**Characteristics**:
- Test individual functions/classes in isolation
- No external dependencies (file system, network, database)
- Fast execution (<100ms per test)
- Mock all external interactions

**Examples**:
- `WorkflowParser.parseYAMLContent()` - parsing logic only
- `ProjectConfig.validateConfig()` - validation logic
- Variable resolution algorithms

### Integration Tests (30% of coverage)

**Characteristics**:
- Test component interactions
- Real file operations (with cleanup)
- Real git operations (in test repos)
- Slower execution (<5s per test)

**Examples**:
- Workflow parse → validate → resolve end-to-end
- ProjectConfig loading from real file
- StateManager with real file persistence

### E2E Tests (10% of coverage)

**Characteristics**:
- Test complete user workflows
- Multiple components working together
- Realistic scenarios
- Slowest execution (<60s per test)

**Examples**:
- Start workflow → Execute steps → Save state
- Parse workflow → Create agents → Execute → Cleanup

## Debugging Tests

### Using Vitest UI

```bash
npm run test:ui
```

Opens an interactive UI for debugging tests with:
- Test file browser
- Real-time test results
- Source code viewer
- Coverage visualization

### Using Console Logs

```typescript
import { it, expect } from 'vitest';

it('should debug test', () => {
  const data = { foo: 'bar' };
  console.log('Debug data:', data); // Visible in test output
  expect(data.foo).toBe('bar');
});
```

### Using Debugger

Add `debugger` statement and run with Node inspector:

```bash
node --inspect-brk node_modules/.bin/vitest
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest Coverage Guide](https://vitest.dev/guide/coverage)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Epic 1 Tech Spec](../../docs/tech-spec-epic-1.md#Test-Strategy-Summary)

---

**Last Updated**: 2025-11-06
**Story**: 1.11 - Test Framework Setup & Infrastructure
