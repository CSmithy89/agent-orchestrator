# Guidelines and Patterns

## BMAD Methodology Patterns

### Four-Phase Development Lifecycle

1. **Analysis (Optional)** - Understand the problem space
   - Product Brief (user needs, market context)
   - Domain Research (market, competitive, technical)
   - Brainstorming (creative ideation)

2. **Planning (Required)** - Define what to build
   - PRD (product requirements, features, scope)
   - Tech Spec (technical specification for Level 0-1)
   - Narrative (story-driven games/apps)
   - UX Design (user experience specification)

3. **Solutioning (Level 3-4)** - Design how to build it
   - Architecture (system design, tech stack, components)
   - Solutioning Gate Check (validate PRD ↔ Architecture alignment)
   - Epic & Story Breakdown (bite-sized development tasks)

4. **Implementation (Iterative)** - Build it
   - Sprint Planning (extract and track stories)
   - Story Development (implement with tests)
   - Code Review (quality validation)
   - PR & Merge (integrate changes)

### Scale-Adaptive System (Levels 0-4)

**Level 0: Trivial** (Bug fix, typo)
- Quick Spec Flow → Direct implementation
- No PRD needed

**Level 1: Small** (Single isolated feature)
- Tech Spec only → Implementation
- No PRD needed

**Level 2: Simple** (Multiple related features)
- PRD → (Optional Architecture) → Stories → Implementation
- Architecture optional but recommended

**Level 3: Medium** (System with integrations, 10+ stories)
- PRD → Architecture → Epics/Stories → Implementation
- Full solutioning required

**Level 4: Complex** (Enterprise system, 100+ stories, multiple modules)
- Product Brief → PRD → Architecture → Epics/Stories → Implementation
- Comprehensive planning required

**This Project:** Level 3 (Medium Scale)

## Autonomous Orchestration Patterns

### Confidence-Based Escalation

**Pattern:** Attempt autonomous decision → Assess confidence → Escalate if < 75%

```typescript
// Decision Flow
1. Check onboarding docs for explicit answer (confidence: 0.95)
2. Use LLM reasoning with context (confidence: varies)
3. Assess confidence based on:
   - Answer clarity (clear vs vague)
   - Context sufficiency (enough info?)
   - Certainty indicators in response
4. If confidence >= 0.75: Proceed autonomously
   If confidence < 0.75: Escalate to human
```

**Escalation Triggers:**
- Low confidence decisions (< 75%)
- Repeated failures (same task fails > 2x)
- Test failures after retries
- Complex merge conflicts
- Budget overruns
- Security concerns

### Fresh Agent Per Stage

**Pattern:** Create new agent instance for each workflow stage

**Why:** Prevents LLM context window bloat

```typescript
// BAD: Reusing agent (context grows unbounded)
const mary = await createAgent('mary');
await mary.execute(task1);  // Context: 10k tokens
await mary.execute(task2);  // Context: 25k tokens
await mary.execute(task3);  // Context: 50k tokens (bloated!)

// GOOD: Fresh agent per stage
async function executeStage(task) {
  const agent = await createAgent(task.agent, buildContext(task));
  const result = await agent.execute(task);
  await destroyAgent(agent);  // Clean up context
  return result;
}
```

### Git Worktree Parallelism

**Pattern:** One worktree per story for true parallel development

```bash
# Main repo
/project/src/          (main branch, protected)

# Worktrees (isolated)
/wt/story-001/         (branch: story/001, Amelia working)
/wt/story-002/         (branch: story/002, Amelia working)
/wt/story-003/         (branch: story/003, waiting for dependencies)
```

**Benefits:**
- No branch switching (no stash/unstash)
- True isolation (no conflicts during development)
- Fast parallel development
- Clean commit history per branch

**Workflow:**
1. Create worktree: `git worktree add /wt/story-001 -b story/001`
2. Develop in worktree
3. Create PR from worktree branch
4. Merge PR
5. Cleanup: `git worktree remove /wt/story-001`

### State in Files Pattern

**Pattern:** All state persisted to files (YAML/Markdown), not memory

**Why:**
- Git-friendly (state versioned)
- Human-readable (users can inspect)
- Crash-resistant (orchestrator can restart anytime)
- No database needed (simplicity)

**Files:**
- `bmad/workflow-status.md` - Human-readable status
- `bmad/sprint-status.yaml` - Machine-readable state
- `.bmad/project-config.yaml` - Project configuration
- `.bmad-escalations/*.json` - Escalation queue

### Agent Pool Per Project

**Pattern:** Each project orchestrator has its own agent pool (no sharing)

**Why:**
- Complete isolation between projects
- No resource contention
- Different projects can use different LLM models
- True parallel execution

```typescript
class ProjectOrchestrator {
  private agentPool: AgentPool;  // Each orchestrator has own pool
  
  constructor(projectId: string, config: ProjectConfig) {
    this.agentPool = new AgentPool(config.agent_assignments);
  }
}
```

## Design Patterns

### Microkernel Architecture

**Core Kernel:** Minimal, stable workflow execution engine
**Plugins:** BMAD workflows loaded dynamically

**Benefits:**
- Core engine changes rarely
- Workflows evolve independently
- Easy to add new workflows
- Each workflow testable in isolation

### LLM Factory Pattern

**Pattern:** Abstract LLM provider behind factory interface

```typescript
interface LLMClient {
  invoke(prompt: string): Promise<string>;
  stream(prompt: string): AsyncIterable<string>;
}

class LLMFactory {
  create(model: string, provider: string): LLMClient {
    // Returns appropriate client (Anthropic, OpenAI, etc.)
  }
}

// Agent doesn't know which LLM it's using
class BMadAgent {
  constructor(
    private llmClient: LLMClient  // Injected, not hardcoded
  ) {}
}
```

**Benefits:**
- Easy to swap LLM providers
- Per-agent LLM assignment
- Cost optimization (cheap models for simple tasks)
- Provider-agnostic agent code

### Event-Driven Updates

**Pattern:** Components communicate via events, not direct calls

**Events:**
- `project.phase.changed`
- `story.status.changed`
- `escalation.created`
- `agent.started / completed`
- `pr.created / merged`
- `workflow.error`

**Benefits:**
- Decoupling (components don't know about each other)
- Real-time updates (WebSocket)
- Easy to add new consumers (dashboard, notifications)

## Error Handling Patterns

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  backoffMs: number[] = [1000, 2000, 4000]
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await sleep(backoffMs[i]);
    }
  }
}
```

### Graceful Degradation

**Pattern:** System continues operating even if some components fail

**Examples:**
- One project fails → Other projects continue
- Agent spawn fails → Queue task, retry later
- State save fails → Log error, continue (risky but better than crash)

### Error Classification

**Recoverable:** Handle internally, log and continue
- Optional file missing
- Non-critical API call failure

**Retryable:** Retry with backoff
- LLM API rate limit
- Network timeout
- Temporary file lock

**Escalation:** Human intervention required
- Git merge conflict
- Test failures after retries
- Security vulnerability detected

## Security Patterns

### Path Traversal Prevention

```typescript
function validatePath(path: string, projectRoot: string): void {
  const absolute = path.resolve(path);
  if (!absolute.startsWith(projectRoot)) {
    throw new SecurityError('Path outside project root');
  }
}
```

### Input Sanitization

```typescript
function sanitizeUserInput(input: string): string {
  // Remove prompt injection patterns
  const dangerous = [
    /ignore previous instructions/gi,
    /system:/gi,
    /you are now/gi
  ];
  
  let clean = input;
  for (const pattern of dangerous) {
    clean = clean.replace(pattern, '[REDACTED]');
  }
  return clean;
}
```

### Secrets Management

- Never log API keys
- Never commit secrets to git
- Use environment variables (.env)
- Future: HashiCorp Vault or AWS Secrets Manager

## Code Organization Patterns

### Separation of Concerns

- **Core** - Workflow engine, state management, agent pool
- **Services** - Business logic (decision engine, escalation queue)
- **API** - REST endpoints, WebSocket handlers
- **Utils** - Pure utility functions (no side effects)

### Dependency Injection

```typescript
// BAD: Hard-coded dependency
class Orchestrator {
  private llmClient = new AnthropicClient();  // Can't test/swap
}

// GOOD: Injected dependency
class Orchestrator {
  constructor(
    private llmFactory: LLMFactory  // Injected, testable
  ) {}
}
```

### Single Responsibility Principle

Each class/function should have one reason to change.

**Example:**
- `WorkflowEngine` - Executes workflows (not responsible for LLM calls)
- `AgentPool` - Manages agent lifecycle (not responsible for LLM API)
- `LLMFactory` - Creates LLM clients (not responsible for agent logic)

## Performance Patterns

### Parallel Execution

```typescript
// BAD: Sequential (slow)
const doc1 = await readFile('doc1.md');
const doc2 = await readFile('doc2.md');
const doc3 = await readFile('doc3.md');

// GOOD: Parallel (fast)
const [doc1, doc2, doc3] = await Promise.all([
  readFile('doc1.md'),
  readFile('doc2.md'),
  readFile('doc3.md')
]);
```

### Caching

- **LLM responses** - Cache onboarding doc searches
- **Template processing** - Cache compiled templates
- **API responses** - Cache with TTL (stale-while-revalidate)

### Lazy Loading

Load resources only when needed (don't preload everything).

## Testing Patterns

### Test Pyramid (60/30/10)

- **60% Unit Tests** - Fast, isolated, test individual functions
- **30% Integration Tests** - Test component interactions
- **10% E2E Tests** - Full workflow execution

### Mocking

```typescript
// Mock LLM API (avoid real API costs)
const mockLLM = {
  invoke: vi.fn().mockResolvedValue('Mocked response')
};

// Mock file system (fast, isolated)
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('Mocked content')
}));
```

### Test Fixtures

Reusable test data:
- Sample workflow.yaml files
- Mock LLM responses
- Test project configurations
- Example documents
