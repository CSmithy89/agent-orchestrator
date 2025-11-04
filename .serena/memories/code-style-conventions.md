# Code Style & Conventions

## TypeScript Standards

### Type Safety
- **Strict mode enabled** - All TypeScript strict flags on
- **Explicit typing** - Avoid `any`, use specific types or `unknown`
- **Interface vs Type** - Use `interface` for objects, `type` for unions/intersections
- **Readonly by default** - Use `readonly` for immutable properties

### Naming Conventions
- **Classes**: PascalCase (e.g., `ProjectOrchestrator`, `WorkflowEngine`)
- **Interfaces**: PascalCase (e.g., `BMadAgent`, `WorkflowState`)
- **Functions/Methods**: camelCase (e.g., `executeWorkflow`, `spawnAgent`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ESCALATION_THRESHOLD`, `MAX_PARALLEL_STORIES`)
- **Private members**: Prefix with `private` keyword (e.g., `private agentPool`)

### Code Organization
```typescript
// Order within class:
// 1. Static properties
// 2. Instance properties (public first, then private)
// 3. Constructor
// 4. Public methods
// 5. Private methods

class Example {
  // Public properties first
  public readonly id: string;
  
  // Private properties
  private config: Config;
  private state: State;

  // Constructor
  constructor(id: string, config: Config) {
    this.id = id;
    this.config = config;
  }

  // Public methods
  public async execute(): Promise<void> {
    // ...
  }

  // Private methods
  private async handleStep(): Promise<void> {
    // ...
  }
}
```

## BMAD Framework Conventions

### Workflow Files
- **workflow.yaml** - Configuration with variables and metadata
- **instructions.md** - Step-by-step execution logic with XML tags
- **template.md** - Output document template (if applicable)
- **checklist.md** - Validation criteria

### BMAD XML Tags
```xml
<action>Perform this action</action>
<action if="condition">Conditional action</action>
<check if="condition">...content...</check>
<ask>Get user input</ask>
<goto step="X">Jump to step</goto>
<invoke-workflow>Call another workflow</invoke-workflow>
<template-output>Save content checkpoint</template-output>
<elicit-required>Trigger enhancement</elicit-required>
```

### Agent Naming
- Use persona names from BMAD manifest: Mary, Winston, Amelia, Bob, Murat, Paige, John, Sally
- Reference by role in comments: `// PM agent orchestrates...`
- Agent files: `bmad/bmm/agents/{name}.md`

## File Structure Conventions

### Directory Structure
```
src/
├── core/              # Core orchestrator components
│   ├── orchestrator/  # Orchestrator engine
│   ├── workflow/      # Workflow execution
│   ├── agents/        # Agent pool management
│   └── state/         # State management
├── services/          # Business logic services
├── api/               # REST API routes
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Import Order
```typescript
// 1. External dependencies
import { Fastify } from 'fastify';
import { Anthropic } from '@anthropic-ai/sdk';

// 2. Internal modules (absolute imports)
import { ProjectOrchestrator } from '@/core/orchestrator';
import { WorkflowEngine } from '@/core/workflow';

// 3. Types
import type { WorkflowConfig, AgentTask } from '@/types';

// 4. Relative imports (avoid if possible)
import { helper } from '../utils/helper';
```

## Documentation Standards

### JSDoc Comments
```typescript
/**
 * Creates a new agent instance with project-configured LLM
 * 
 * @param agentName - BMAD agent name (e.g., 'mary', 'winston')
 * @param llmModel - LLM model identifier (e.g., 'claude-sonnet-4-5')
 * @param context - Agent context including onboarding and state
 * @returns Promise resolving to agent instance
 * @throws {Error} If agent persona not found or LLM client creation fails
 */
async createAgent(
  agentName: string,
  llmModel: string,
  context: AgentContext
): Promise<BMadAgent> {
  // Implementation
}
```

### Inline Comments
- **Explain WHY, not WHAT** - Code should be self-explanatory
- **Use comments for business logic** - Explain BMAD-specific patterns
- **Document assumptions** - Note constraints or requirements
```typescript
// BMAD pattern: Fresh agent per stage to prevent context bloat
const agent = await this.agentPool.createAgent(...);

// Confidence threshold based on empirical testing (85% success rate)
const ESCALATION_THRESHOLD = 0.75;
```

## Markdown Documentation

### File Structure
```markdown
# Title (H1 - once per document)

## Overview (H2 - major sections)

### Subsection (H3 - detailed sections)

**Bold** for emphasis
*Italic* for terms
`code` for inline code
```

### YAML Conventions
```yaml
# Configuration files use snake_case
project_name: "Agent orchestrator"
output_folder: "{project-root}/docs"

# State files use camelCase for machine compatibility
currentWorkflow: "prd"
status: "in_progress"
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  await riskyOperation();
} catch (error) {
  // Log with context
  logger.error({ error, projectId }, 'Failed to execute workflow');
  
  // Rethrow or handle
  if (isRetryable(error)) {
    return await retry(riskyOperation);
  } else {
    throw new OrchestratorError('Workflow execution failed', { cause: error });
  }
}
```

### Custom Errors
```typescript
class OrchestratorError extends Error {
  constructor(message: string, public context?: any) {
    super(message);
    this.name = 'OrchestratorError';
  }
}
```

## Async/Await Standards

- **Always use async/await** over `.then()` chains
- **Handle errors explicitly** - No silent failures
- **Parallel operations** - Use `Promise.all()` for independent async calls
```typescript
// BAD: Sequential when could be parallel
const doc1 = await readFile('doc1.md');
const doc2 = await readFile('doc2.md');

// GOOD: Parallel execution
const [doc1, doc2] = await Promise.all([
  readFile('doc1.md'),
  readFile('doc2.md')
]);
```

## Git Commit Messages

Format: `<type>(<scope>): <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation only
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**
```
feat(orchestrator): add confidence-based escalation logic
fix(worktree): cleanup worktrees after PR merge
refactor(agent): extract LLM factory to separate module
docs(architecture): update deployment architecture diagram
```
