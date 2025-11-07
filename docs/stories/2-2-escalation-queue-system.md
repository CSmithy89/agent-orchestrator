# Story 2.2: Escalation Queue System

Status: ready-for-dev

## Story

As a workflow orchestrator,
I want to queue decisions that need human input and resume after response,
So that autonomous workflows can continue after clarification.

## Acceptance Criteria

1. Implement EscalationQueue class
2. add(escalation) saves to .bmad-escalations/{id}.json
3. Escalation includes: workflow, step, question, AI reasoning, confidence, context
4. Pause workflow execution at escalation point
5. Notify via console (dashboard integration in Epic 6)
6. respond(escalationId, response) records human answer
7. Resume workflow from escalation step with response
8. Track escalation metrics: count, resolution time, categories

## Tasks / Subtasks

- [ ] Task 1: Implement EscalationQueue class structure (AC: #1)
  - [ ] Create `backend/src/core/services/escalation-queue.ts` file
  - [ ] Define Escalation interface with all required fields (id, workflowId, step, question, aiReasoning, confidence, context, status, createdAt, resolvedAt, response, resolutionTime)
  - [ ] Define EscalationMetrics interface (totalEscalations, resolvedCount, averageResolutionTime, categoryBreakdown)
  - [ ] Define EscalationQueue class with basic structure
  - [ ] Add TypeScript types and JSDoc comments

- [ ] Task 2: Implement file-based storage for escalations (AC: #2, #3)
  - [ ] Create `.bmad-escalations/` directory if not exists
  - [ ] Implement add(escalation) method to save escalation to `.bmad-escalations/{id}.json`
  - [ ] Use uuid v4 to generate unique escalation IDs (format: `esc-{uuid}`)
  - [ ] Ensure escalation includes: workflowId, step, question, aiReasoning, confidence, context, status, createdAt
  - [ ] Set initial status to 'pending'
  - [ ] Use atomic file writes (StateManager patterns from Epic 1) to prevent corruption
  - [ ] Add error handling for file I/O failures

- [ ] Task 3: Implement escalation retrieval methods (AC: #2)
  - [ ] Implement list(filters?) method to retrieve escalations
    - [ ] Support filtering by status ('pending' | 'resolved' | 'cancelled')
    - [ ] Support filtering by workflowId
    - [ ] Return array of Escalation objects
  - [ ] Implement getById(escalationId) method
    - [ ] Load escalation from `.bmad-escalations/{id}.json`
    - [ ] Return Escalation object or throw error if not found
    - [ ] Handle file read errors gracefully

- [ ] Task 4: Implement workflow pause/resume integration (AC: #4, #7)
  - [ ] Document integration pattern with WorkflowEngine (actual WorkflowEngine changes in Epic 1)
  - [ ] Define pause/resume contract: when escalation created, workflow must pause at current step
  - [ ] Document resume contract: when respond() called, workflow resumes from escalation step with response
  - [ ] Add workflow state tracking (paused, escalationId reference)
  - [ ] Note: WorkflowEngine integration tested in Story 2.5 (PRD Workflow Executor)

- [ ] Task 5: Implement console notification (AC: #5)
  - [ ] Add console.log notification when escalation added
  - [ ] Display: escalation ID, workflow name, question, confidence score
  - [ ] Format for readability (consider colors/emoji for CLI)
  - [ ] Note in comments: Dashboard notification deferred to Epic 6

- [ ] Task 6: Implement respond() method (AC: #6, #7)
  - [ ] Create respond(escalationId, response) method
  - [ ] Load existing escalation from file
  - [ ] Validate escalation exists and status is 'pending'
  - [ ] Update escalation with: response, status='resolved', resolvedAt timestamp
  - [ ] Calculate resolutionTime (resolvedAt - createdAt in milliseconds)
  - [ ] Save updated escalation back to file
  - [ ] Return updated Escalation object
  - [ ] Emit event/signal for workflow to resume (document integration pattern)

- [ ] Task 7: Implement escalation metrics tracking (AC: #8)
  - [ ] Create getMetrics() method
  - [ ] Load all escalation files from `.bmad-escalations/`
  - [ ] Calculate: totalEscalations count
  - [ ] Calculate: resolvedCount (status='resolved')
  - [ ] Calculate: averageResolutionTime from resolved escalations
  - [ ] Calculate: categoryBreakdown (group by question type or workflow)
  - [ ] Return EscalationMetrics object
  - [ ] Optimize for performance (<500ms per NFRs)

- [ ] Task 8: Unit tests for EscalationQueue (AC: all)
  - [ ] Test add() creates file in .bmad-escalations/ with correct schema
  - [ ] Test add() generates unique IDs (uuid v4)
  - [ ] Test add() sets status to 'pending' and createdAt timestamp
  - [ ] Test list() returns all escalations when no filters
  - [ ] Test list() filters by status='pending'
  - [ ] Test list() filters by status='resolved'
  - [ ] Test list() filters by workflowId
  - [ ] Test getById() retrieves correct escalation
  - [ ] Test getById() throws error for non-existent ID
  - [ ] Test respond() updates escalation with response
  - [ ] Test respond() sets status to 'resolved' and resolvedAt timestamp
  - [ ] Test respond() calculates resolutionTime correctly
  - [ ] Test respond() throws error for non-existent escalation
  - [ ] Test respond() throws error if escalation not pending
  - [ ] Test getMetrics() calculates totalEscalations correctly
  - [ ] Test getMetrics() calculates resolvedCount correctly
  - [ ] Test getMetrics() calculates averageResolutionTime correctly
  - [ ] Test getMetrics() categoryBreakdown groups by workflow
  - [ ] Mock file system using in-memory storage or temp directories
  - [ ] Achieve >90% code coverage

- [ ] Task 9: Integration tests with DecisionEngine and WorkflowEngine (AC: #4, #7)
  - [ ] Test escalation flow: DecisionEngine confidence <0.75 → EscalationQueue.add()
  - [ ] Test workflow pause at escalation point (integration with WorkflowEngine)
  - [ ] Test escalation retrieval: list pending escalations
  - [ ] Test respond() → workflow resume with response
  - [ ] Test error handling for file I/O failures
  - [ ] Test concurrent escalation handling (multiple workflows)
  - [ ] Verify console notification output
  - [ ] Test metrics calculation with multiple escalations

## Dev Notes

### Architecture Alignment

**EscalationQueue Location**: `backend/src/core/services/escalation-queue.ts`

Per architecture.md section 2.3.2:
- EscalationQueue is a support service in the Autonomous Intelligence layer
- Provides human intervention queue with pause/resume workflow capability
- Integrates with DecisionEngine (Story 2.1) - escalation triggered when confidence < 0.75
- Integrates with WorkflowEngine (Epic 1, Story 1.7) for pause/resume capability
- File-based storage in `.bmad-escalations/{id}.json` for persistence
- Console notification in Epic 2, dashboard integration deferred to Epic 6

**Escalation Interface** (from tech spec lines 117-139):
```typescript
interface Escalation {
  id: string;                    // UUID for tracking
  workflowId: string;            // Which workflow triggered escalation
  step: number;                  // Which step in workflow
  question: string;              // What decision is needed
  aiReasoning: string;           // Why AI couldn't decide confidently
  confidence: number;            // AI's confidence (< 0.75)
  context: Record<string, any>;  // Relevant context for human
  status: 'pending' | 'resolved' | 'cancelled';
  createdAt: Date;
  resolvedAt?: Date;
  response?: any;                // Human response when resolved
  resolutionTime?: number;       // Milliseconds to resolution
}

interface EscalationMetrics {
  totalEscalations: number;
  resolvedCount: number;
  averageResolutionTime: number;  // milliseconds
  categoryBreakdown: Record<string, number>;  // e.g., {requirements: 5, scope: 2}
}
```

**EscalationQueue Methods** (from tech spec lines 210-250):
```typescript
class EscalationQueue {
  async add(escalation: Omit<Escalation, 'id' | 'status' | 'createdAt'>): Promise<string>;
  async list(filters?: { status?: string; workflowId?: string }): Promise<Escalation[]>;
  async getById(escalationId: string): Promise<Escalation>;
  async respond(escalationId: string, response: any): Promise<Escalation>;
  async getMetrics(): Promise<EscalationMetrics>;
}
```

**Escalation Workflow** (from architecture.md lines 523-528):
1. DecisionEngine confidence < 0.75 → Trigger escalation
2. Workflow execution pauses at escalation point
3. EscalationQueue.add() saves escalation and notifies console
4. User reviews question, AI reasoning, context → Responds via respond()
5. Workflow resumes from escalation step with user response

**Storage Strategy:**
- File-based: `.bmad-escalations/{id}.json` (one file per escalation)
- Atomic writes using StateManager patterns to prevent corruption
- Escalation ID format: `esc-{uuid}` using uuid v4
- Metrics calculated on-demand from all escalation files

### Learnings from Previous Story

**From Story 2.1 (Status: review)**

- **DecisionEngine Integration**: DecisionEngine already implemented with ESCALATION_THRESHOLD = 0.75
  - When confidence < 0.75, DecisionEngine should trigger escalation by calling EscalationQueue.add()
  - DecisionEngine returns Decision object with question, confidence, reasoning - all needed for escalation context
  - Integration point: DecisionEngine.attemptAutonomousDecision() → EscalationQueue.add() when confidence < 0.75

- **File Structure Pattern**: Services go in `backend/src/core/services/`
  - DecisionEngine at `backend/src/core/services/decision-engine.ts`
  - EscalationQueue should follow: `backend/src/core/services/escalation-queue.ts`
  - Consistent with Epic 1 architecture

- **Testing Patterns**: Use vitest with established patterns from Epic 1
  - Unit tests at `backend/tests/core/EscalationQueue.test.ts`
  - Integration tests at `backend/tests/integration/escalation-queue.test.ts`
  - Mock file system for isolated unit testing
  - Use temp directories or in-memory FS for integration tests
  - Target >90% coverage for core services

- **Dependencies Available**:
  - uuid v13.0.0 (ESM-only) - already upgraded in Story 2.0
  - Use: `import { v4 as uuidv4 } from 'uuid'` for generating escalation IDs
  - StateManager patterns from Epic 1 (Story 1.5) for atomic file writes
  - RetryHandler from Epic 1 (Story 1.10) if file I/O retry needed

- **Architectural Decisions from Story 2.1**:
  - ESCALATION_THRESHOLD = 0.75 is fixed
  - Decision interface includes question, decision, confidence, reasoning, source, timestamp, context
  - Temperature 0.3 for DecisionEngine LLM reasoning
  - Two-tier decision: onboarding docs (0.95) → LLM reasoning (0.3-0.9) → escalation (<0.75)

**Key Takeaways for Story 2.2**:
- Integrate with DecisionEngine's escalation trigger (confidence < 0.75)
- Follow file structure patterns from Epic 1 and Story 2.1
- Use uuid v13 (ESM) for ID generation
- Use StateManager atomic write patterns for file safety
- Test integration with DecisionEngine escalation flow
- WorkflowEngine pause/resume integration tested in Story 2.5 (PRD Workflow)

[Source: stories/2-1-confidence-based-decision-engine.md#Dev-Agent-Record]

### Project Structure Notes

**New File to Create**:
- `backend/src/core/services/escalation-queue.ts` - EscalationQueue class implementation

**New Directory to Create**:
- `.bmad-escalations/` - Escalation storage directory (created programmatically)

**Files to Reference**:
- `backend/src/core/services/decision-engine.ts` - DecisionEngine integration (Story 2.1)
- `backend/src/core/StateManager.ts` - Atomic file write patterns (Story 1.5)
- `backend/src/core/error/RetryHandler.ts` - Retry logic for file I/O (Story 1.10)

**Test Files to Create**:
- `backend/tests/core/EscalationQueue.test.ts` - Unit tests (>90% coverage target)
- `backend/tests/integration/escalation-queue.test.ts` - Integration tests with DecisionEngine

**Storage Structure**:
```
.bmad-escalations/
  esc-{uuid1}.json
  esc-{uuid2}.json
  esc-{uuid3}.json
```

### References

- [Tech Spec - Story 2.2 AC](docs/tech-spec-epic-2.md#Story-22-Escalation-Queue-System) - Lines 738-747
- [Tech Spec - Escalation Schema](docs/tech-spec-epic-2.md#Data-Models-and-Contracts) - Lines 117-139
- [Tech Spec - EscalationQueue Interface](docs/tech-spec-epic-2.md#APIs-and-Interfaces) - Lines 210-250
- [Architecture - EscalationQueue](docs/architecture.md#232-Escalation-Queue) - Lines 494-539
- [Epics - Story 2.2](docs/epics.md#Story-22-Escalation-Queue-System) - Lines 456-473
- [Tech Spec - NFRs](docs/tech-spec-epic-2.md#Performance) - Lines 434-437 (Escalation performance targets)
- [Story 2.1 - DecisionEngine](stories/2-1-confidence-based-decision-engine.md) - Integration pattern and ESCALATION_THRESHOLD

## Dev Agent Record

### Context Reference

- [Story Context XML](2-2-escalation-queue-system.context.xml) - Generated 2025-11-07

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
