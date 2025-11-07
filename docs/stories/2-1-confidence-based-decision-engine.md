# Story 2.1: Confidence-Based Decision Engine

Status: ready-for-dev

## Story

As an autonomous workflow developer,
I want agents to assess their confidence in decisions and escalate when uncertain,
So that the orchestrator balances autonomy with safety.

## Acceptance Criteria

1. Implement DecisionEngine class with confidence scoring
2. attemptAutonomousDecision(question, context) returns Decision with confidence (0-1)
3. Check onboarding docs first for explicit answers (confidence 0.95)
4. Use LLM reasoning with low temperature (0.3) for decisions
5. Assess confidence based on answer clarity and context sufficiency
6. Escalate if confidence < 0.75 (ESCALATION_THRESHOLD)
7. Return decision value and reasoning for audit trail
8. Track: question, decision, confidence, reasoning, outcome

## Tasks / Subtasks

- [ ] Task 1: Implement DecisionEngine class structure (AC: #1)
  - [ ] Create `src/core/services/decision-engine.ts` file
  - [ ] Define Decision interface with all required fields
  - [ ] Define DecisionEngine class with ESCALATION_THRESHOLD constant (0.75)
  - [ ] Add TypeScript types and JSDoc comments

- [ ] Task 2: Implement onboarding docs lookup (AC: #3)
  - [ ] Create checkOnboardingDocs(question) private method
  - [ ] Search `.bmad/onboarding/` directory for relevant files
  - [ ] Use basic keyword matching to find explicit answers
  - [ ] Return answer with confidence 0.95 if found, null otherwise
  - [ ] Add error handling for missing onboarding directory

- [ ] Task 3: Implement LLM reasoning decision logic (AC: #4, #5)
  - [ ] Create useLLMReasoning(question, context) private method
  - [ ] Use LLMFactory to create LLM client with temperature 0.3
  - [ ] Construct prompt asking for decision + confidence assessment
  - [ ] Parse LLM response for: decision value, confidence score, reasoning
  - [ ] Assess confidence based on:
    - Answer clarity (look for certainty indicators like "definitely", "clearly")
    - Context sufficiency (check if LLM mentions missing info)
    - Response length and specificity
  - [ ] Return structured response: { value, confidence, reasoning }

- [ ] Task 4: Implement attemptAutonomousDecision main method (AC: #2, #6, #7, #8)
  - [ ] Create public attemptAutonomousDecision(question, context) method
  - [ ] Check onboarding docs first (Step 1)
  - [ ] If onboarding doc answer found: Return Decision with confidence 0.95
  - [ ] If not found: Call useLLMReasoning(question, context)
  - [ ] If confidence < ESCALATION_THRESHOLD (0.75): Mark for escalation
  - [ ] Return complete Decision object with all fields:
    - question, decision, confidence, reasoning, source, timestamp, context
  - [ ] Log decision for audit trail

- [ ] Task 5: Unit tests for DecisionEngine (AC: all)
  - [ ] Test checkOnboardingDocs returns 0.95 confidence when answer found
  - [ ] Test checkOnboardingDocs returns null when no answer found
  - [ ] Test useLLMReasoning uses temperature 0.3
  - [ ] Test useLLMReasoning confidence scoring (0.0-1.0 range)
  - [ ] Test attemptAutonomousDecision returns proper Decision object
  - [ ] Test escalation trigger when confidence < 0.75
  - [ ] Test audit trail tracking (all Decision fields populated)
  - [ ] Mock LLMFactory to control LLM responses
  - [ ] Achieve >90% code coverage

- [ ] Task 6: Integration tests with LLMFactory (AC: #2, #4)
  - [ ] Test DecisionEngine works with Anthropic provider
  - [ ] Test DecisionEngine works with OpenAI provider
  - [ ] Test error handling for LLM API failures
  - [ ] Test retry logic integration (from Story 1.10)
  - [ ] Verify temperature 0.3 passed to LLM client

## Dev Notes

### Architecture Alignment

**DecisionEngine Location**: `backend/src/core/services/decision-engine.ts`

Per architecture.md section 2.3.1:
- DecisionEngine is a support service in the Autonomous Intelligence layer
- Provides confidence-based decision making for all autonomous workflows
- Uses ESCALATION_THRESHOLD = 0.75 as the cutoff for human escalation
- Integrates with LLMFactory (Epic 1, Story 1.3) for LLM reasoning
- Temperature fixed at 0.3 for consistent, deterministic reasoning

**Decision Interface**:
```typescript
interface Decision {
  question: string;              // Original question requiring decision
  decision: any;                 // Decision value (varies by question type)
  confidence: number;            // 0.0-1.0, triggers escalation if <0.75
  reasoning: string;             // AI rationale for audit trail
  source: 'onboarding' | 'llm';  // Onboarding doc (0.95) or LLM reasoning (0.3-0.9)
  timestamp: Date;
  context: Record<string, any>;  // Relevant context used in decision
}
```

**Confidence Scoring Factors** (from tech spec lines 486-489):
- **Answer clarity**: Look for certainty indicators ("definitely", "likely", "maybe")
- **Context sufficiency**: Check if enough info was provided to decide
- **LLM certainty**: Parse response for confidence level expressions

**Escalation Flow**:
1. DecisionEngine confidence < 0.75 → Trigger escalation
2. Workflow pauses at escalation point (handled by WorkflowEngine)
3. EscalationQueue notified (Story 2.2)
4. Human responds, workflow resumes with response

### Learnings from Previous Story

**From Story 2.0 (Status: done)**

- **Dependencies Upgraded**: @anthropic-ai/sdk v0.68.0, openai v6.8.1, uuid v13.0.0
- **LLMFactory Integration**: Successfully tested with both Anthropic and OpenAI providers
  - AnthropicProvider at `src/llm/providers/AnthropicProvider.ts` is compatible with v0.68
  - OpenAIProvider at `src/llm/providers/OpenAIProvider.ts` is compatible with v6.8
  - No code changes needed - existing implementations work with new SDKs
- **Test Infrastructure**: Test suite with 389 tests passing, patterns established
  - Integration tests at `tests/integration/` folder
  - Use vitest for test framework
  - Follow existing patterns for mocking LLMFactory
- **Error Handling**: RetryHandler available from Epic 1 (Story 1.10)
  - Handles 401, 429, 500-599 errors with exponential backoff
  - Use for LLM API call reliability

**Key Takeaways for Story 2.1**:
- Use existing LLMFactory - already tested with upgraded SDKs
- Follow established testing patterns from Epic 1
- Integrate with RetryHandler for LLM API calls
- Temperature 0.3 ensures consistent reasoning (balance between creativity and determinism)

[Source: stories/2-0-dependency-migration.md#Dev-Agent-Record]

### Project Structure Notes

**New File to Create**:
- `backend/src/core/services/decision-engine.ts` - Main DecisionEngine class

**Files to Reference**:
- `backend/src/llm/LLMFactory.ts` - LLM client creation (Story 1.3)
- `backend/src/core/error/RetryHandler.ts` - Retry logic (Story 1.10)
- `.bmad/onboarding/` - Onboarding docs directory (check if exists)

**Test Files to Create**:
- `backend/tests/core/DecisionEngine.test.ts` - Unit tests
- `backend/tests/integration/decision-engine.test.ts` - Integration tests with LLMFactory

### References

- [Tech Spec - Story 2.1 AC](docs/tech-spec-epic-2.md#Story-21-Confidence-Based-Decision-Engine) - Lines 726-736
- [Architecture - DecisionEngine](docs/architecture.md#231-Decision-Engine) - Lines 446-490
- [Epics - Story 2.1](docs/epics.md#Story-21-Confidence-Based-Decision-Engine) - Lines 436-453
- [Architecture - Decision Schema](docs/tech-spec-epic-2.md#Data-Models-and-Contracts) - Lines 104-113
- [LLMFactory Integration](backend/src/llm/LLMFactory.ts) - Temperature parameter support

## Dev Agent Record

### Context Reference

- [Story Context XML](2-1-confidence-based-decision-engine.context.xml) - Generated 2025-11-07

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
