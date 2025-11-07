# Async/Await Patterns Best Practices

**Purpose**: Standard async/await patterns and best practices for the Agent Orchestrator codebase.

**Background**: During Epic 1 (Story 1.7, 1.10), synchronous file operations and improper async handling caused test failures and event loop blocking. This guide establishes patterns to prevent similar issues.

---

## Core Principle

**Always use async/await for I/O operations in Node.js.**

Blocking the event loop with synchronous operations degrades performance and can cause timeouts, especially in concurrent workflows.

---

## File System Operations

### ❌ Bad: Synchronous Operations
```typescript
import fs from 'fs';

function checkFileExists(path: string): boolean {
  try {
    fs.accessSync(path); // Blocks event loop!
    return true;
  } catch {
    return false;
  }
}
```

**Problems**:
- Blocks event loop during file system access
- Prevents other async operations from progressing
- Can cause timeouts in concurrent scenarios

### ✅ Good: Async Operations
```typescript
import fs from 'fs/promises';

async function checkFileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
```

**Benefits**:
- Non-blocking, allows concurrent operations
- Follows Node.js best practices
- Better error handling

### File System Cheat Sheet

| Operation | ❌ Avoid (Sync) | ✅ Use (Async) |
|-----------|----------------|----------------|
| Read file | `fs.readFileSync()` | `await fs.readFile()` |
| Write file | `fs.writeFileSync()` | `await fs.writeFile()` |
| Check exists | `fs.accessSync()` | `await fs.access()` |
| Read directory | `fs.readdirSync()` | `await fs.readdir()` |
| Create directory | `fs.mkdirSync()` | `await fs.mkdir()` |
| Remove file/dir | `fs.rmSync()` | `await fs.rm()` |
| Get stats | `fs.statSync()` | `await fs.stat()` |

---

## Error Handling Patterns

### Pattern 1: Try-Catch for Expected Errors

```typescript
async function loadConfig(path: string): Promise<Config> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new ConfigNotFoundError(`Config file not found: ${path}`);
    }
    if (error instanceof SyntaxError) {
      throw new InvalidConfigError(`Invalid JSON in config: ${error.message}`);
    }
    throw error; // Re-throw unexpected errors
  }
}
```

**When to use**:
- Expected errors that need custom handling
- Converting system errors to domain errors
- Adding context to error messages

### Pattern 2: Let Errors Propagate

```typescript
async function saveState(state: State): Promise<void> {
  // Let file system errors propagate naturally
  await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));
}
```

**When to use**:
- Errors that caller should handle
- No additional context needed
- Pass-through operations

### Pattern 3: Fallback Values

```typescript
async function loadConfigWithFallback(path: string): Promise<Config> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return getDefaultConfig();
  }
}
```

**When to use**:
- Optional configuration
- Non-critical operations
- Graceful degradation

---

## Promise Patterns

### Pattern 1: Sequential Operations

When operations depend on each other:

```typescript
async function processWorkflow(workflowPath: string): Promise<Result> {
  const content = await fs.readFile(workflowPath, 'utf-8');
  const parsed = await parseYaml(content);
  const validated = await validateWorkflow(parsed);
  const result = await executeWorkflow(validated);
  return result;
}
```

### Pattern 2: Parallel Operations

When operations are independent:

```typescript
async function loadAllConfigs(): Promise<AllConfigs> {
  // Run in parallel for better performance
  const [workflow, agents, llm] = await Promise.all([
    loadWorkflowConfig(),
    loadAgentsConfig(),
    loadLLMConfig(),
  ]);

  return { workflow, agents, llm };
}
```

### Pattern 3: Sequential with Accumulation

When processing items one at a time:

```typescript
async function executeSteps(steps: Step[]): Promise<StepResult[]> {
  const results: StepResult[] = [];

  for (const step of steps) {
    const result = await executeStep(step, results);
    results.push(result);
  }

  return results;
}
```

**Note**: Can't use `map()` with async when steps depend on previous results.

### Pattern 4: Parallel with Limit

When processing many items but limiting concurrency:

```typescript
async function processFilesInBatches(
  files: string[],
  batchSize: number
): Promise<Result[]> {
  const results: Result[] = [];

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(file => processFile(file))
    );
    results.push(...batchResults);
  }

  return results;
}
```

---

## Common Mistakes and Fixes

### Mistake 1: Forgetting await

❌ **Bad**:
```typescript
async function loadAndProcess(): Promise<void> {
  const data = loadData(); // Missing await!
  process(data); // data is a Promise, not the actual data
}
```

✅ **Good**:
```typescript
async function loadAndProcess(): Promise<void> {
  const data = await loadData();
  process(data);
}
```

### Mistake 2: Async in Array Methods

❌ **Bad**:
```typescript
// forEach doesn't wait for async operations
async function processAll(items: Item[]): Promise<void> {
  items.forEach(async (item) => {
    await processItem(item); // These all run, but function returns before they complete
  });
  console.log('Done'); // Logs before processing completes!
}
```

✅ **Good Option 1 - Sequential**:
```typescript
async function processAll(items: Item[]): Promise<void> {
  for (const item of items) {
    await processItem(item);
  }
  console.log('Done'); // Logs after all processing
}
```

✅ **Good Option 2 - Parallel**:
```typescript
async function processAll(items: Item[]): Promise<void> {
  await Promise.all(items.map(item => processItem(item)));
  console.log('Done'); // Logs after all processing
}
```

### Mistake 3: Not Handling Promise Rejection

❌ **Bad**:
```typescript
async function riskyOperation(): Promise<void> {
  someAsyncOperation(); // Unhandled promise rejection if it fails!
}
```

✅ **Good**:
```typescript
async function riskyOperation(): Promise<void> {
  try {
    await someAsyncOperation();
  } catch (error) {
    logger.error('Operation failed:', error);
    throw error;
  }
}
```

### Mistake 4: Mixing Promises and Callbacks

❌ **Bad**:
```typescript
function loadData(callback: (data: Data) => void): void {
  fs.readFile('data.json', 'utf-8', (err, content) => {
    if (err) throw err;
    callback(JSON.parse(content));
  });
}
```

✅ **Good**:
```typescript
async function loadData(): Promise<Data> {
  const content = await fs.readFile('data.json', 'utf-8');
  return JSON.parse(content);
}
```

### Mistake 5: Creating Promises Unnecessarily

❌ **Bad**:
```typescript
async function getData(): Promise<string> {
  return new Promise((resolve) => {
    resolve('data'); // Unnecessary Promise wrapper
  });
}
```

✅ **Good**:
```typescript
async function getData(): Promise<string> {
  return 'data'; // async function auto-wraps in Promise
}
```

---

## Advanced Patterns

### Pattern 1: Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage
const result = await retryWithBackoff(() => callLLMAPI(prompt), 3, 1000);
```

### Pattern 2: Timeout Wrapper

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(errorMessage || `Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  );

  return Promise.race([promise, timeout]);
}

// Usage
const result = await withTimeout(
  slowOperation(),
  5000,
  'Slow operation timed out'
);
```

### Pattern 3: Debounce Async Operations

```typescript
function debounceAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delayMs: number
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: R) => void) | null = null;
  let latestReject: ((error: any) => void) | null = null;

  return (...args: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          latestResolve?.(result);
        } catch (error) {
          latestReject?.(error);
        }
      }, delayMs);
    });
  };
}

// Usage: File save that debounces rapid calls
const debouncedSave = debounceAsync(saveState, 1000);
```

### Pattern 4: Queue with Concurrency Limit

```typescript
class AsyncQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private running = 0;

  constructor(private concurrency: number) {}

  async add(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const operation = this.queue.shift()!;
      this.running++;
      operation();
    }
  }
}

// Usage: Limit parallel LLM API calls
const llmQueue = new AsyncQueue(3); // Max 3 concurrent requests

const results = await Promise.all(
  prompts.map(prompt => llmQueue.add(() => callLLMAPI(prompt)))
);
```

---

## Testing Async Code

### Pattern 1: Test Async Functions

```typescript
import { describe, it, expect } from 'vitest';

describe('AsyncOperation', () => {
  it('should complete successfully', async () => {
    const result = await asyncOperation();
    expect(result).toBe('success');
  });

  it('should throw on invalid input', async () => {
    await expect(asyncOperation('invalid')).rejects.toThrow('Invalid input');
  });
});
```

### Pattern 2: Test Timing-Dependent Code

```typescript
import { vi } from 'vitest';

it('should retry after delay', async () => {
  vi.useFakeTimers();

  const promise = retryWithBackoff(failingOperation, 3, 1000);

  // Fast-forward time
  await vi.advanceTimersByTimeAsync(1000);
  await vi.advanceTimersByTimeAsync(2000);
  await vi.advanceTimersByTimeAsync(4000);

  const result = await promise;
  expect(result).toBe('success');

  vi.useRealTimers();
});
```

### Pattern 3: Test Parallel Operations

```typescript
it('should process items in parallel', async () => {
  const startTime = Date.now();

  await processAllInParallel([item1, item2, item3]);

  const duration = Date.now() - startTime;

  // Should take ~100ms (parallel), not ~300ms (sequential)
  expect(duration).toBeLessThan(150);
});
```

---

## Performance Considerations

### 1. Prefer Parallel When Possible

```typescript
// Sequential: ~3 seconds total
async function loadSequential() {
  const a = await fetch('/api/a'); // 1s
  const b = await fetch('/api/b'); // 1s
  const c = await fetch('/api/c'); // 1s
  return [a, b, c];
}

// Parallel: ~1 second total
async function loadParallel() {
  const [a, b, c] = await Promise.all([
    fetch('/api/a'), // All run concurrently
    fetch('/api/b'),
    fetch('/api/c'),
  ]);
  return [a, b, c];
}
```

### 2. Limit Concurrency for Resource-Intensive Operations

```typescript
// Bad: Could spawn 1000+ concurrent file operations
async function processAllFiles(files: string[]) {
  return Promise.all(files.map(f => processFile(f)));
}

// Good: Batch processing with concurrency limit
async function processAllFiles(files: string[], batchSize = 10) {
  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(f => processFile(f)));
    results.push(...batchResults);
  }
  return results;
}
```

### 3. Avoid Creating Promises in Loops

```typescript
// Less efficient: Creates promises repeatedly
async function loadItems() {
  const items = [];
  for (let i = 0; i < 10; i++) {
    items.push(await loadItem(i));
  }
  return items;
}

// More efficient: Create all promises once, await all
async function loadItems() {
  const promises = Array.from({ length: 10 }, (_, i) => loadItem(i));
  return Promise.all(promises);
}
```

---

## Integration with Error Handling

See `ErrorHandler` class for production-ready error handling that integrates with these async patterns:

```typescript
import { ErrorHandler } from './core/ErrorHandler';

async function robustOperation() {
  try {
    const result = await ErrorHandler.retryOperation(
      () => riskyAsyncOperation(),
      {
        maxRetries: 3,
        retryDelayMs: 1000,
        backoffMultiplier: 2,
      }
    );
    return result;
  } catch (error) {
    await ErrorHandler.handleError(error, {
      operation: 'robustOperation',
      severity: 'high',
    });
    throw error;
  }
}
```

---

## Checklist for Code Review

When reviewing async code, check for:

- [ ] All I/O operations use async/await (no sync operations)
- [ ] All async functions have `await` or return promises directly
- [ ] Error handling with try-catch for expected errors
- [ ] No unhandled promise rejections
- [ ] Appropriate use of parallel vs sequential operations
- [ ] No async callbacks in array methods (forEach, map without Promise.all)
- [ ] No unnecessary Promise wrappers
- [ ] Proper typing of Promise return types
- [ ] Tests include async/await and test error cases
- [ ] Timeouts for operations that could hang

---

## References

- **Epic 1 Retrospective**: `docs/retrospective-epic-1.md` - Async issues in Stories 1.7, 1.10
- **Test Setup Guide**: `docs/test-setup-guide.md` - Testing async code
- **ErrorHandler**: `src/core/ErrorHandler.ts` - Production retry/backoff patterns
- **Node.js Async Best Practices**: https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/

---

**Last Updated**: 2025-11-07
**Related Stories**: 1.7 (WorkflowEngine async refactor), 1.10 (Error handling async patterns)
