# Test Setup Guide

**Purpose**: Standard test configuration and best practices for the Agent Orchestrator project.

**Background**: During Epic 1 (Stories 1.10, 1.11), we encountered 68+ test failures due to test environment configuration issues. This guide establishes standards to prevent similar issues in future development.

---

## Quick Start Checklist

When setting up tests for a new component:

- [ ] Use Vitest test framework with v8 coverage provider
- [ ] Configure test git repositories with standard settings
- [ ] Use fork pool for tests that require process.chdir()
- [ ] Follow async/await patterns (see async-patterns-guide.md)
- [ ] Set up test fixtures in `beforeEach` with proper cleanup in `afterEach`
- [ ] Mock file system operations where appropriate
- [ ] Target 90%+ coverage for core components, 80%+ overall

---

## Git Configuration in Tests

### Problem
Git configuration from the user's environment can leak into test environments, causing failures:
- GPG signing requirements fail in CI
- Default branch names differ (git creates `master`, we expect `main`)
- Git hooks can interfere with test operations

### Solution: Standard Test Git Configuration

```typescript
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

async function setupTestGitRepo(repoPath: string): Promise<void> {
  // Create directory
  await fs.mkdir(repoPath, { recursive: true });

  // Initialize git
  execSync('git init', { cwd: repoPath, stdio: 'pipe' });

  // Configure standard test settings
  execSync('git config user.name "Test User"', { cwd: repoPath });
  execSync('git config user.email "test@example.com"', { cwd: repoPath });
  execSync('git config commit.gpgSign false', { cwd: repoPath }); // ✅ Disable GPG signing
  execSync('git config core.hooksPath /dev/null', { cwd: repoPath }); // ✅ Disable hooks

  // Create main branch explicitly
  await fs.writeFile(path.join(repoPath, 'README.md'), '# Test Repo');
  execSync('git add .', { cwd: repoPath });
  execSync('git commit -m "Initial commit"', { cwd: repoPath });
  execSync('git branch -M main', { cwd: repoPath }); // ✅ Ensure main branch exists
}
```

### Test Repository Template

For reusable test setup, create `tests/fixtures/test-git-repo.ts`:

```typescript
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { execSync } from 'child_process';

export async function createTestGitRepo(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-repo-'));

  execSync('git init', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tempDir });
  execSync('git config user.email "test@example.com"', { cwd: tempDir });
  execSync('git config commit.gpgSign false', { cwd: tempDir });
  execSync('git config core.hooksPath /dev/null', { cwd: tempDir });

  // Create initial commit on main branch
  await fs.writeFile(path.join(tempDir, 'README.md'), '# Test');
  execSync('git add .', { cwd: tempDir });
  execSync('git commit -m "Initial commit"', { cwd: tempDir });
  execSync('git branch -M main', { cwd: tempDir });

  return tempDir;
}

export async function cleanupTestGitRepo(repoPath: string): Promise<void> {
  await fs.rm(repoPath, { recursive: true, force: true });
}
```

**Usage in tests**:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestGitRepo, cleanupTestGitRepo } from './fixtures/test-git-repo';

describe('WorktreeManager', () => {
  let testRepo: string;

  beforeEach(async () => {
    testRepo = await createTestGitRepo();
  });

  afterEach(async () => {
    await cleanupTestGitRepo(testRepo);
  });

  it('should create worktree', async () => {
    // Test implementation using testRepo
  });
});
```

---

## Process Isolation: Fork Pool vs Thread Pool

### Problem
Vitest uses thread pool by default, but `process.chdir()` affects all threads in the pool, causing test interference.

### Solution: Use Fork Pool for Tests with process.chdir()

**In `vitest.config.ts`**:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks', // ✅ Use fork pool instead of thread pool
    poolOptions: {
      forks: {
        singleFork: false, // Allow parallel test execution
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
});
```

**When to use fork pool**:
- Tests that use `process.chdir()`
- Tests that modify `process.env`
- Tests that require true process isolation

**Trade-offs**:
- Fork pool is slightly slower than thread pool
- But prevents test interference and flakiness
- Worth it for reliability

---

## Async/Await Best Practices in Tests

### Problem
Async handling issues caused 33 test failures in Story 1.10.

### Solution: Consistent Async Patterns

**❌ Bad: Missing await**
```typescript
it('should handle errors', () => {
  errorHandler.handleError(error); // Missing await!
  expect(result).toBe('success'); // Runs before async completes
});
```

**✅ Good: Proper async/await**
```typescript
it('should handle errors', async () => {
  await errorHandler.handleError(error);
  expect(result).toBe('success');
});
```

**❌ Bad: Unhandled promise rejections**
```typescript
it('should reject invalid input', async () => {
  parser.parse(invalidYaml); // Throws but not caught
});
```

**✅ Good: Expect rejections explicitly**
```typescript
it('should reject invalid input', async () => {
  await expect(parser.parse(invalidYaml)).rejects.toThrow('Invalid YAML');
});
```

**❌ Bad: Mixing callbacks and async/await**
```typescript
it('should complete workflow', (done) => {
  workflow.execute().then(() => {
    expect(state).toBe('complete');
    done();
  });
});
```

**✅ Good: Use async/await consistently**
```typescript
it('should complete workflow', async () => {
  await workflow.execute();
  expect(state).toBe('complete');
});
```

See `docs/async-patterns-guide.md` for comprehensive async patterns.

---

## File System Operations in Tests

### Mock vs Real File System

**Use mocks** for:
- Unit tests of logic that happens to use fs
- Fast tests that don't need real I/O
- Testing error conditions (permissions, missing files)

**Use real file system** for:
- Integration tests of file-based components
- Testing actual git operations
- End-to-end workflows

### Mocking File System

```typescript
import { vi } from 'vitest';
import fs from 'fs/promises';

vi.mock('fs/promises');

it('should handle missing file', async () => {
  vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));
  await expect(loadConfig()).rejects.toThrow('ENOENT');
});
```

### Real File System with Cleanup

```typescript
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

describe('StateManager', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'state-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should persist state', async () => {
    const stateFile = path.join(tempDir, 'state.json');
    await stateManager.save(stateFile, { key: 'value' });
    const loaded = await stateManager.load(stateFile);
    expect(loaded).toEqual({ key: 'value' });
  });
});
```

---

## Test Structure and Organization

### File Organization
```
tests/
├── unit/              # Fast, isolated unit tests
│   ├── WorkflowParser.test.ts
│   ├── LLMFactory.test.ts
│   └── ErrorHandler.test.ts
├── integration/       # Tests with real I/O, git, etc.
│   ├── WorkflowEngine.test.ts
│   ├── WorktreeManager.test.ts
│   └── StateManager.test.ts
├── e2e/               # End-to-end workflow tests
│   └── workflow-execution.test.ts
└── fixtures/          # Shared test utilities
    ├── test-git-repo.ts
    ├── test-workflows.ts
    └── test-llm-responses.ts
```

### Test Naming Convention
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do expected behavior when condition', async () => {
      // Test implementation
    });

    it('should throw error when invalid input', async () => {
      // Test implementation
    });
  });
});
```

---

## Coverage Requirements

### Targets
- **Core components**: 90%+ coverage (ErrorHandler, WorkflowEngine, StateManager, etc.)
- **Overall project**: 80%+ coverage
- **New features**: Must not decrease overall coverage

### Measuring Coverage
```bash
npm test -- --coverage
```

### Coverage Report Location
```
coverage/
├── index.html        # Browse coverage in browser
├── coverage.json     # Machine-readable coverage data
└── lcov.info         # Coverage for CI systems
```

### What to Cover
✅ **High priority**:
- Error handling paths
- Conditional logic branches
- Edge cases (empty input, null, undefined)
- Integration points between components

❌ **Lower priority**:
- Simple getters/setters
- Type definitions
- Trivial utility functions

---

## Common Pitfalls and Solutions

### Pitfall 1: Test Isolation Failure
**Problem**: Tests pass individually but fail when run together.

**Cause**: Shared state between tests (singletons, module-level variables).

**Solution**:
```typescript
// Reset singletons in afterEach
afterEach(() => {
  LLMFactory.resetInstance();
  StateManager.clearCache();
});
```

### Pitfall 2: Timing-Dependent Tests
**Problem**: Tests sometimes pass, sometimes fail (flaky tests).

**Cause**: Race conditions, assuming operation timing.

**Solution**:
```typescript
// ❌ Bad: Assuming timing
it('should update after delay', async () => {
  startAsyncOperation();
  await new Promise(resolve => setTimeout(resolve, 100)); // Fragile!
  expect(result).toBe('updated');
});

// ✅ Good: Wait for condition
it('should update after completion', async () => {
  await startAsyncOperation();
  await waitForCondition(() => result === 'updated', 5000);
  expect(result).toBe('updated');
});
```

### Pitfall 3: Over-Mocking
**Problem**: Tests pass but code fails in production.

**Cause**: Mocking too many dependencies, tests become meaningless.

**Solution**: Mock at boundaries only:
- Mock external APIs (LLM providers)
- Mock file system for unit tests, use real for integration
- Don't mock code you own and control

### Pitfall 4: Test Data Coupling
**Problem**: Tests break when unrelated data changes.

**Cause**: Tests depend on exact format of test data.

**Solution**:
```typescript
// ❌ Bad: Brittle test data dependency
expect(result).toEqual({
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  // ... 20 more fields
});

// ✅ Good: Test relevant fields only
expect(result).toMatchObject({
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
});
expect(result.createdAt).toBeDefined();
```

---

## CI/CD Integration

### Running Tests in CI
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test -- --coverage --reporter=verbose

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage.json
```

### Coverage Gates
Configure minimum coverage in `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      }
    }
  }
});
```

---

## References

- **Epic 1 Retrospective**: `docs/retrospective-epic-1.md` - Details of test challenges in Stories 1.10, 1.11
- **Async Patterns**: `docs/async-patterns-guide.md` - Comprehensive async/await best practices
- **Vitest Docs**: https://vitest.dev/
- **Git Configuration**: https://git-scm.com/docs/git-config

---

**Last Updated**: 2025-11-07
**Related Stories**: 1.10 (Error Handling), 1.11 (Test Framework Setup)
