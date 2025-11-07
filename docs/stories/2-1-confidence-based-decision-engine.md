# Story 2.1: Confidence-Based Decision Engine

Status: review

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

- [x] Task 1: Implement DecisionEngine class structure (AC: #1)
  - [x] Create `src/core/services/decision-engine.ts` file
  - [x] Define Decision interface with all required fields
  - [x] Define DecisionEngine class with ESCALATION_THRESHOLD constant (0.75)
  - [x] Add TypeScript types and JSDoc comments

- [x] Task 2: Implement onboarding docs lookup (AC: #3)
  - [x] Create checkOnboardingDocs(question) private method
  - [x] Search `.bmad/onboarding/` directory for relevant files
  - [x] Use basic keyword matching to find explicit answers
  - [x] Return answer with confidence 0.95 if found, null otherwise
  - [x] Add error handling for missing onboarding directory

- [x] Task 3: Implement LLM reasoning decision logic (AC: #4, #5)
  - [x] Create useLLMReasoning(question, context) private method
  - [x] Use LLMFactory to create LLM client with temperature 0.3
  - [x] Construct prompt asking for decision + confidence assessment
  - [x] Parse LLM response for: decision value, confidence score, reasoning
  - [x] Assess confidence based on:
    - Answer clarity (look for certainty indicators like "definitely", "clearly")
    - Context sufficiency (check if LLM mentions missing info)
    - Response length and specificity
  - [x] Return structured response: { value, confidence, reasoning }

- [x] Task 4: Implement attemptAutonomousDecision main method (AC: #2, #6, #7, #8)
  - [x] Create public attemptAutonomousDecision(question, context) method
  - [x] Check onboarding docs first (Step 1)
  - [x] If onboarding doc answer found: Return Decision with confidence 0.95
  - [x] If not found: Call useLLMReasoning(question, context)
  - [x] If confidence < ESCALATION_THRESHOLD (0.75): Mark for escalation
  - [x] Return complete Decision object with all fields:
    - question, decision, confidence, reasoning, source, timestamp, context
  - [x] Log decision for audit trail

- [x] Task 5: Unit tests for DecisionEngine (AC: all)
  - [x] Test checkOnboardingDocs returns 0.95 confidence when answer found
  - [x] Test checkOnboardingDocs returns null when no answer found
  - [x] Test useLLMReasoning uses temperature 0.3
  - [x] Test useLLMReasoning confidence scoring (0.0-1.0 range)
  - [x] Test attemptAutonomousDecision returns proper Decision object
  - [x] Test escalation trigger when confidence < 0.75
  - [x] Test audit trail tracking (all Decision fields populated)
  - [x] Mock LLMFactory to control LLM responses
  - [x] Achieve >90% code coverage

- [x] Task 6: Integration tests with LLMFactory (AC: #2, #4)
  - [x] Test DecisionEngine works with Anthropic provider
  - [x] Test DecisionEngine works with OpenAI provider
  - [x] Test error handling for LLM API failures
  - [x] Test retry logic integration (from Story 1.10)
  - [x] Verify temperature 0.3 passed to LLM client

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

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

None required - implementation completed without issues.

### Completion Notes List

1. **DecisionEngine Implementation** - Implemented complete DecisionEngine class with all features:
   - ESCALATION_THRESHOLD constant set to 0.75
   - Two-tier decision approach: onboarding docs (0.95 confidence) → LLM reasoning (temperature 0.3)
   - Confidence scoring based on answer clarity, context sufficiency, and certainty indicators
   - Automatic escalation flagging for confidence < 0.75
   - Complete audit trail with all Decision fields (question, decision, confidence, reasoning, source, timestamp, context)

2. **Confidence Calibration** - Implemented sophisticated confidence adjustment:
   - High certainty indicators ("definitely", "clearly") increase confidence by +0.1
   - Low certainty indicators ("maybe", "unsure") decrease confidence by -0.2
   - Missing context mentions decrease confidence by -0.15
   - Final confidence constrained to 0.3-0.9 range for LLM decisions

3. **Onboarding Docs Integration** - Implemented file-based onboarding documentation lookup:
   - Searches `.bmad/onboarding/` directory for markdown files
   - Basic keyword matching with match score calculation
   - Returns confidence 0.95 for onboarding doc answers
   - Graceful fallback to LLM when onboarding directory missing

4. **Comprehensive Testing** - Created 35 unit tests + 15 integration tests:
   - All 8 acceptance criteria covered with dedicated test groups
   - 100% of unit tests passing (35/35)
   - Integration tests properly skip when API keys unavailable
   - Tests follow established vitest patterns from Epic 1
   - Mocking strategy consistent with existing LLMFactory tests

5. **Temperature 0.3 Validation** - Verified low temperature setting for consistent reasoning:
   - Tests confirm temperature 0.3 passed to LLM client in InvokeOptions
   - Aligns with industry best practices for deterministic decision-making
   - Web research validated: 0.2-0.3 optimal for precision tasks

### File List

**Implementation:**
- backend/src/core/services/decision-engine.ts (NEW, 450+ lines) - Complete DecisionEngine implementation

**Tests:**
- backend/tests/core/DecisionEngine.test.ts (NEW, 600+ lines) - 35 unit tests covering all ACs
- backend/tests/integration/decision-engine.test.ts (NEW, 350+ lines) - 15 integration tests with real providers
