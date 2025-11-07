# Story 2.5: PRD Workflow Executor

Status: ready-for-dev

## Story

As a user wanting automated requirements analysis,
I want to run the PRD workflow and get a complete PRD document,
So that I can skip manual requirements documentation.

## Acceptance Criteria

1. Load bmad/bmm/workflows/prd/workflow.yaml
2. Execute all PRD workflow steps in order
3. Spawn Mary agent for requirements analysis
4. Spawn John agent for strategic validation
5. Process template-output tags by generating content and saving to PRD.md
6. Handle elicit-required tags (skip in #yolo mode)
7. Make autonomous decisions via DecisionEngine (target <3 escalations)
8. Complete execution in <30 minutes
9. Generate docs/PRD.md with all sections filled
10. Update workflow-status.yaml to mark PRD complete

## Tasks / Subtasks

**⚠️ ATDD Approach: START WITH TASK 8 (Write Tests First), then proceed to Tasks 1-7 (Implementation), then Task 9 (Integration Tests)**

- [ ] Task 1: Implement PRDWorkflowExecutor class structure (AC: #1, #2)
  - [ ] Create `backend/src/core/workflows/prd-workflow-executor.ts` file
  - [ ] Define PRDWorkflowExecutor class extending base WorkflowExecutor (from Epic 1, Story 1.7)
  - [ ] Load workflow configuration from `bmad/bmm/workflows/prd/workflow.yaml`
  - [ ] Parse workflow steps from YAML configuration
  - [ ] Initialize workflow state and context
  - [ ] Add TypeScript types and JSDoc comments
  - [ ] Handle workflow configuration validation errors

- [ ] Task 2: Implement agent spawning integration (AC: #3, #4)
  - [ ] Method signature: `async spawnAgent(agentType: string, context: AgentContext): Promise<Agent>`
  - [ ] Integrate with AgentPool (Story 1.4) to spawn agents
  - [ ] Spawn MaryAgent for requirements analysis (Story 2.3)
  - [ ] Spawn JohnAgent for strategic validation (Story 2.4)
  - [ ] Pass workflow context to agents (shared context pattern)
  - [ ] Handle agent initialization failures with proper error messages
  - [ ] Clean up agents after workflow completion

- [ ] Task 3: Implement step execution engine (AC: #2)
  - [ ] Method signature: `async executeStep(step: WorkflowStep): Promise<StepResult>`
  - [ ] Execute workflow steps in sequential order
  - [ ] Pass step input to agents and collect outputs
  - [ ] Handle step dependencies and prerequisites
  - [ ] Track step execution status (pending, running, completed, failed)
  - [ ] Log step execution details for debugging
  - [ ] Support step retries on transient failures

- [ ] Task 4: Implement template-output processing (AC: #5)
  - [ ] Method signature: `async processTemplateOutput(section: string, content: string): Promise<void>`
  - [ ] Parse template-output tags from workflow steps
  - [ ] Generate content for each template section using agents
  - [ ] Save generated content to `docs/PRD.md` incrementally
  - [ ] Create `docs/` directory if it doesn't exist
  - [ ] Append sections to existing file or create new file
  - [ ] Validate markdown formatting of generated content
  - [ ] Handle file write failures gracefully

- [ ] Task 5: Implement elicit-required tag handling (AC: #6)
  - [ ] Method signature: `async handleElicitation(elicitConfig: ElicitConfig): Promise<ElicitResult>`
  - [ ] Parse elicit-required tags from workflow steps
  - [ ] Check for #yolo mode flag in workflow context
  - [ ] If #yolo mode: Skip elicitation and use defaults
  - [ ] If not #yolo: Pause workflow and prompt user for input
  - [ ] Resume workflow with user's elicitation response
  - [ ] Support multiple elicitation points in workflow
  - [ ] Log elicitation decisions for audit trail

- [ ] Task 6: Integrate DecisionEngine for autonomous decisions (AC: #7)
  - [ ] Method signature: `async makeDecision(question: string, context: DecisionContext): Promise<Decision>`
  - [ ] Use DecisionEngine (Story 2.1) for autonomous decision making
  - [ ] Check onboarding docs for high-confidence decisions (0.95+)
  - [ ] Use LLM reasoning for uncertain decisions (temperature 0.3)
  - [ ] Assess confidence score (0.0-1.0 range)
  - [ ] If confidence >= 0.75: Proceed with decision autonomously
  - [ ] If confidence < 0.75: Escalate via EscalationQueue (Story 2.2)
  - [ ] Track escalation count (target: <3 escalations per workflow run)
  - [ ] Log all decisions with confidence scores and reasoning

- [ ] Task 7: Implement workflow completion and status updates (AC: #8, #9, #10)
  - [ ] Method signature: `async completeWorkflow(): Promise<WorkflowResult>`
  - [ ] Validate all required PRD sections are generated
  - [ ] Verify `docs/PRD.md` exists and contains expected content
  - [ ] Update `workflow-status.yaml` to mark PRD workflow complete
  - [ ] Track workflow execution time (target: <30 minutes)
  - [ ] Generate workflow summary report (sections generated, decisions made, escalations count)
  - [ ] Clean up agents and temporary state
  - [ ] Return WorkflowResult with success status and metadata
  - [ ] Handle partial completion scenarios (workflow interrupted mid-execution)

- [ ] Task 8: **WRITE TESTS FIRST** - Unit tests for PRDWorkflowExecutor (AC: all) - **START HERE per ATDD**
  - [ ] **CRITICAL**: Write ALL tests below BEFORE implementing any code (Tests should FAIL initially)
  - [ ] Create test file: `backend/tests/core/workflows/PRDWorkflowExecutor.test.ts`
  - [ ] Set up test structure: describe blocks for each AC, beforeEach/afterEach hooks
  - [ ] Mock WorkflowEngine, AgentPool, DecisionEngine, EscalationQueue dependencies
  - [ ] Test workflow.yaml loading and parsing (AC #1)
  - [ ] Test step execution in sequential order (AC #2)
  - [ ] Test Mary agent spawning for requirements analysis (AC #3)
  - [ ] Test John agent spawning for strategic validation (AC #4)
  - [ ] Test template-output tag processing and PRD.md generation (AC #5)
  - [ ] Test elicit-required tag handling (#yolo mode skips, normal mode prompts) (AC #6)
  - [ ] Test DecisionEngine integration with confidence scoring (AC #7)
  - [ ] Test escalation when confidence < 0.75 (target <3 escalations) (AC #7)
  - [ ] Test workflow execution time (must complete in <30 minutes) (AC #8)
  - [ ] Test PRD.md generation with all required sections (AC #9)
  - [ ] Test workflow-status.yaml update on completion (AC #10)
  - [ ] Test error handling for agent spawn failures
  - [ ] Test error handling for file write failures
  - [ ] Test partial workflow completion and resume capability
  - [ ] Run tests (should all FAIL - no implementation yet): `npm run test -- PRDWorkflowExecutor.test.ts`
  - [ ] **After all tests written and failing, proceed to Task 1 to implement code**
  - [ ] Target: >80% code coverage when implementation complete

- [ ] Task 9: Integration tests with Mary, John, and DecisionEngine (AC: all)
  - [ ] Test full workflow execution: initialization → Mary analysis → John validation → PRD generation → completion
  - [ ] Test Mary → John collaboration flow (shared workflow context)
  - [ ] Test DecisionEngine makes autonomous decisions with high confidence
  - [ ] Test EscalationQueue handles low-confidence decisions (<0.75)
  - [ ] Test PRD.md incremental generation (sections saved as workflow progresses)
  - [ ] Test workflow-status.yaml updates correctly
  - [ ] Test #yolo mode skips elicitation steps
  - [ ] Test normal mode pauses for user elicitation input
  - [ ] Test workflow completes in <30 minutes (performance test)
  - [ ] Test error recovery (workflow crashes mid-execution, resumes from last state)
  - [ ] Verify escalation count stays under target (<3 escalations)

- [ ] Task 10: Create PRDWorkflowExecutor CLI command integration (AC: all)
  - [ ] Register PRD workflow executor in CLI (Story 1.9)
  - [ ] Add `run-prd-workflow` CLI command
  - [ ] Support flags: `--yolo` for autonomous mode, `--project-path` for project directory
  - [ ] Test CLI command invocation: `npm run cli -- run-prd-workflow --project-path ./test-project`
  - [ ] Verify CLI outputs workflow progress and status updates
  - [ ] Test CLI handles errors gracefully (invalid project path, missing config)
  - [ ] Document CLI command in README or docs

## Dev Notes

### Architecture Alignment

**PRDWorkflowExecutor Location**: `backend/src/core/workflows/prd-workflow-executor.ts`

Per architecture.md section 1.1 and 2.1:
- PRDWorkflowExecutor is a Workflow Plugin in the Orchestrator Core (Microkernel)
- Executes PRD workflow from `bmad/bmm/workflows/prd/workflow.yaml`
- Integrates with Workflow Engine (Epic 1, Story 1.7) for step execution
- Uses AgentPool (Epic 1, Story 1.4) to spawn Mary and John agents
- Leverages DecisionEngine (Story 2.1) for autonomous decision making
- Uses EscalationQueue (Story 2.2) for low-confidence decision escalation
- Collaborates with MaryAgent (Story 2.3) for requirements analysis
- Collaborates with JohnAgent (Story 2.4) for strategic validation
- Generates `docs/PRD.md` with all required sections
- Updates `workflow-status.yaml` to mark PRD workflow complete

**Workflow Execution Pattern** (from architecture.md and tech spec):
```typescript
class PRDWorkflowExecutor extends WorkflowExecutor {
  constructor(
    workflowEngine: WorkflowEngine,
    agentPool: AgentPool,
    decisionEngine: DecisionEngine,
    escalationQueue: EscalationQueue
  ) {
    super(workflowEngine);
    this.agentPool = agentPool;
    this.decisionEngine = decisionEngine;
    this.escalationQueue = escalationQueue;
  }

  async execute(projectPath: string, options: ExecutionOptions): Promise<WorkflowResult> {
    // 1. Load workflow.yaml
    const workflow = await this.loadWorkflow('bmad/bmm/workflows/prd/workflow.yaml');

    // 2. Spawn agents
    const mary = await this.agentPool.spawn('mary', workflowContext);
    const john = await this.agentPool.spawn('john', workflowContext);

    // 3. Execute steps in order
    for (const step of workflow.steps) {
      await this.executeStep(step, { mary, john });
    }

    // 4. Process template-output tags → save to PRD.md
    await this.processTemplateOutputs(workflowContext);

    // 5. Update workflow-status.yaml
    await this.updateWorkflowStatus('prd', 'complete');

    return { success: true, outputPath: 'docs/PRD.md' };
  }
}
```

**DecisionEngine Integration Pattern** (from Story 2.1 and AC #7):
```typescript
async makeDecision(question: string, context: DecisionContext): Promise<Decision> {
  const decision = await this.decisionEngine.attemptAutonomousDecision(question, context);

  if (decision.confidence >= 0.75) {
    // High confidence: proceed autonomously
    this.logger.info(`[PRDWorkflow] Autonomous decision: ${decision.decision} (confidence: ${decision.confidence})`);
    return decision;
  } else {
    // Low confidence: escalate to human
    await this.escalationQueue.add({
      workflowId: 'prd-workflow',
      step: context.currentStep,
      question,
      context,
      priority: 'medium'
    });
    this.logger.warn(`[PRDWorkflow] Escalated decision: ${question} (confidence: ${decision.confidence})`);

    // Wait for human response (or use default in #yolo mode)
    const response = await this.escalationQueue.waitForResponse(escalationId);
    return { decision: response.answer, confidence: 1.0, reasoning: 'Human decision' };
  }
}
```

**Performance Requirements** (AC #8):
- Total workflow execution time: <30 minutes
- Mary agent analysis: ~5-10 minutes
- John agent validation: ~5-10 minutes
- Template processing & PRD generation: ~5-10 minutes
- Decision making & escalation handling: <5 minutes
- File I/O operations: <1 minute

**Autonomous Decision Target** (AC #7):
- DecisionEngine should handle 85%+ decisions autonomously (confidence >= 0.75)
- Target: <3 escalations per workflow run
- Typical escalations: Ambiguous requirements, conflicting user input, critical scope decisions

### Learnings from Previous Story

**From Story 2.4: John Agent - Product Manager Persona (Status: review)**

- **New Files Created**: Use JohnAgent for strategic validation:
  - `backend/src/core/agents/john-agent.ts` (766 lines) - JohnAgent class with 5 core methods
  - `backend/tests/core/agents/JohnAgent.test.ts` (982 lines) - Unit test patterns to follow
  - John persona: `bmad/bmm/agents/pm.md` (referenced by JohnAgent)

- **Architectural Patterns Established**:
  - Agent location: `backend/src/core/agents/` (confirmed pattern from Mary and John)
  - Factory pattern with private constructor for agent initialization
  - Temperature 0.5 for John (balanced strategy/creativity)
  - Exponential backoff retry logic: 3 attempts (1s, 2s, 4s delays)
  - Comprehensive TypeScript interfaces for all method signatures
  - Agent methods accept workflow context and return structured results
  - DecisionEngine and EscalationQueue integration patterns ready (tested via mocks)

- **Integration Patterns from John**:
  - JohnAgent provides 5 core methods:
    - `defineProductVision()` - Strategic product thinking
    - `prioritizeFeatures()` - Feature prioritization (RICE/MoSCoW)
    - `assessMarketFit()` - Product-market fit analysis
    - `validateRequirementsViability()` - Business viability checks
    - `generateExecutiveSummary()` - Executive-level summaries
  - John validates Mary's requirements for business viability (AC #5 from Story 2.4)
  - John challenges scope creep and unrealistic timelines (AC #6 from Story 2.4)
  - Collaboration via shared workflow context (AC #8 from Story 2.4)

- **Testing Approach from Story 2.4**:
  - ATDD: Task 8 first (write ALL tests), then Tasks 1-7 (implementation)
  - 60+ unit tests created following describe-block-per-AC pattern
  - Target >80% coverage for workflow executors
  - Performance tests: All methods <30 seconds, full workflow <30 minutes
  - Integration tests verify Mary ↔ John collaboration

- **Pending Review Items from Story 2.4**:
  - Task 9: Mary+John integration tests partially completed
  - Task 10: AgentPool registration completed
  - Test execution: 36/51 tests passing (70.6% pass rate)
  - Some tests may need adjustment based on real Mary/John integration

- **Technical Debt to Address**:
  - None specific to this story
  - Story 2.4 implementation is excellent, pending full test suite pass
  - This story (2.5) will integrate Mary and John for real, completing their collaboration

**Key Takeaways for Story 2.5**:
- Follow ATDD approach (Task 8 first, write all tests before implementation)
- PRDWorkflowExecutor location: `backend/src/core/workflows/prd-workflow-executor.ts`
- Spawn MaryAgent and JohnAgent via AgentPool (Stories 1.4, 2.3, 2.4)
- Pass shared workflow context between Mary and John for collaboration
- Use DecisionEngine (Story 2.1) for autonomous decisions (target confidence >= 0.75)
- Use EscalationQueue (Story 2.2) for low-confidence decisions (target <3 escalations)
- Generate `docs/PRD.md` incrementally via template-output processing
- Update `workflow-status.yaml` on completion
- Target: <30 minutes total execution time
- Reuse test patterns from Story 2.4 (JohnAgent.test.ts)
- This story completes the PRD workflow automation for Epic 2

[Source: stories/2-4-john-agent-product-manager-persona.md#Dev-Agent-Record]
[Source: stories/2-4-john-agent-product-manager-persona.md#Senior-Developer-Review-AI]

### Project Structure Notes

**New File to Create**:
- `backend/src/core/workflows/prd-workflow-executor.ts` - PRDWorkflowExecutor class implementation

**New Directory to Create** (if not exists):
- `backend/src/core/workflows/` - Workflow executors directory
- `backend/tests/core/workflows/` - Workflow executor tests directory

**Files to Reference**:
- `bmad/bmm/workflows/prd/workflow.yaml` - PRD workflow configuration (to be loaded)
- `backend/src/core/WorkflowEngine.ts` - WorkflowEngine base class (Story 1.7)
- `backend/src/core/AgentPool.ts` - AgentPool for agent spawning (Story 1.4)
- `backend/src/core/services/decision-engine.ts` - DecisionEngine integration (Story 2.1)
- `backend/src/core/services/escalation-queue.ts` - EscalationQueue integration (Story 2.2)
- `backend/src/core/agents/mary-agent.ts` - MaryAgent for requirements analysis (Story 2.3)
- `backend/src/core/agents/john-agent.ts` - JohnAgent for strategic validation (Story 2.4)

**Test Files to Create**:
- `backend/tests/core/workflows/PRDWorkflowExecutor.test.ts` - Unit tests (>80% coverage target)
- `backend/tests/integration/prd-workflow.test.ts` - Integration tests (Mary+John+DecisionEngine)

**Output Files Generated by Workflow**:
- `docs/PRD.md` - Generated PRD document with all sections
- `workflow-status.yaml` - Updated to mark PRD workflow complete
- `.bmad-escalations/*.json` - Escalation files (if low-confidence decisions occur)

**PRDWorkflowExecutor Interface**:
```typescript
interface PRDWorkflowExecutor extends WorkflowExecutor {
  execute(projectPath: string, options: ExecutionOptions): Promise<WorkflowResult>;
  spawnAgent(agentType: string, context: AgentContext): Promise<Agent>;
  executeStep(step: WorkflowStep): Promise<StepResult>;
  processTemplateOutput(section: string, content: string): Promise<void>;
  handleElicitation(elicitConfig: ElicitConfig): Promise<ElicitResult>;
  makeDecision(question: string, context: DecisionContext): Promise<Decision>;
  completeWorkflow(): Promise<WorkflowResult>;
}

interface ExecutionOptions {
  yoloMode?: boolean; // Skip elicitation steps if true
  maxEscalations?: number; // Maximum escalations allowed (default: 3)
  timeout?: number; // Execution timeout in milliseconds (default: 30 minutes)
}

interface WorkflowResult {
  success: boolean;
  outputPath: string; // Path to generated PRD.md
  executionTime: number; // Milliseconds
  escalationsCount: number;
  sectionsGenerated: string[];
  errors?: string[];
}
```

### References

- [Tech Spec - Story 2.5 AC](docs/tech-spec-epic-2.md#Story-25-PRD-Workflow-Executor) - Lines 776-788
- [Tech Spec - Workflow Execution Pattern](docs/tech-spec-epic-2.md#Architecture-Patterns) - Lines 192-248
- [Architecture - Workflow Plugins](docs/architecture.md#11-High-Level-Architecture) - Lines 75-84
- [Architecture - Microkernel Pattern](docs/architecture.md#1-System-Architecture-Overview) - Lines 60-72
- [Epics - Story 2.5](docs/epics.md#Story-25-PRD-Workflow-Executor) - Lines 522-541
- [Story 1.7 - Workflow Engine](stories/1-7-workflow-engine-step-executor.md) - Base WorkflowExecutor class
- [Story 1.4 - Agent Pool](stories/1-4-agent-pool-lifecycle-management.md) - Agent spawning and lifecycle
- [Story 2.1 - Decision Engine](stories/2-1-confidence-based-decision-engine.md) - Autonomous decision making
- [Story 2.2 - Escalation Queue](stories/2-2-escalation-queue-system.md) - Low-confidence escalation
- [Story 2.3 - Mary Agent](stories/2-3-mary-agent-business-analyst-persona.md) - Requirements analysis
- [Story 2.4 - John Agent](stories/2-4-john-agent-product-manager-persona.md) - Strategic validation
- [PRD Workflow Config](bmad/bmm/workflows/prd/workflow.yaml) - Workflow configuration to load

### Development Approach (ATDD)

**This story follows Acceptance Test-Driven Development (ATDD):**

1. **Write Tests First** (Red Phase)
   - Start with Task 8 (Unit tests) before implementing code
   - Write failing tests for each acceptance criterion
   - Create test file: `backend/tests/core/workflows/PRDWorkflowExecutor.test.ts`
   - Organize tests by AC (one describe block per AC)
   - All tests should fail initially (no implementation yet)

2. **Implement Minimum Code** (Green Phase)
   - Create `backend/src/core/workflows/prd-workflow-executor.ts`
   - Implement just enough code to make tests pass
   - Follow Tasks 1-7 in order
   - Run tests frequently: `npm run test:watch`
   - Ensure each AC's tests pass before moving to next AC

3. **Refactor** (Refactor Phase)
   - Clean up code while keeping tests green
   - Extract duplicate logic, improve naming
   - Ensure performance targets met (<30 minutes execution)
   - Maintain >80% coverage: `npm run test:coverage`

4. **Integration Tests** (Task 9, 10)
   - Write integration tests after unit tests pass
   - Test full PRD workflow execution (Mary + John + DecisionEngine)
   - Test CLI command integration
   - Create `backend/tests/integration/prd-workflow.test.ts`

**Test-First Workflow:**
```bash
# 1. Write tests (should fail)
npm run test -- PRDWorkflowExecutor.test.ts

# 2. Implement code (make tests pass)
npm run test:watch

# 3. Check coverage (target >80%)
npm run test:coverage

# 4. Refactor and verify tests still pass
npm run test
```

**Benefits of ATDD for this story:**
- Ensures all 10 ACs are testable and verified
- Catches integration issues with Mary, John, and DecisionEngine early
- Validates workflow execution pattern and error handling
- Confirms performance targets (<30 minutes, <3 escalations)
- Prevents regressions during refactoring

### Linting & Code Quality

**Before committing any code, run all quality checks:**

```bash
# 1. Type checking (must pass, no errors)
npm run type-check

# 2. ESLint (must pass, no errors or warnings)
npm run lint

# 3. Auto-fix lint issues (if possible)
npm run lint -- --fix

# 4. Run all tests (must pass, 0 failures)
npm run test

# 5. Check coverage (>80% for PRDWorkflowExecutor)
npm run test:coverage
```

**Code Quality Standards:**
- **TypeScript**: Strict mode enabled, no `any` types (use `unknown` if needed)
- **ESLint**: Follow project rules, disable rules only with justification comments
- **Naming**:
  - Classes: PascalCase (e.g., `PRDWorkflowExecutor`)
  - Methods: camelCase (e.g., `executeStep`)
  - Interfaces: PascalCase (e.g., `WorkflowResult`)
  - Files: kebab-case (e.g., `prd-workflow-executor.ts`)
- **Comments**: JSDoc for public methods, inline comments for complex logic
- **Imports**: ESM syntax (`import`/`export`), explicit `.js` extensions in imports
- **Error Handling**: Try-catch blocks with specific error types, helpful error messages

**Pre-commit Checklist:**
- [ ] All tests passing (unit + integration)
- [ ] Coverage >80% for new code
- [ ] TypeScript type-check passes
- [ ] ESLint passes with no warnings
- [ ] No console.log (except intentional logging)
- [ ] JSDoc comments on all public methods
- [ ] Code follows existing patterns from Story 1.7 (WorkflowEngine) and Story 2.3/2.4 (Mary/JohnAgent)
- [ ] Performance target met (<30 minutes execution time)
- [ ] Escalation target met (<3 escalations per run)

**Git Commit Message Format:**
```
Story 2.5: Brief description of changes

- Bullet point of what was implemented
- Reference AC numbers (e.g., AC #1, #2)
- Note any architectural decisions
- Mention test coverage achieved
- Mention performance metrics (execution time, escalations)
```

## Dev Agent Record

### Context Reference

docs/stories/2-5-prd-workflow-executor.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
