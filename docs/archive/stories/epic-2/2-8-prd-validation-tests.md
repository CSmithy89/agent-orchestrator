# Story 2.8: PRD Validation Tests

Status: ready-for-dev

## Story

As a PRD workflow development team,
I want comprehensive test coverage for all Epic 2 components,
So that PRD automation is reliable and regressions are prevented.

## Acceptance Criteria

1. Unit tests for DecisionEngine exist and pass
   - Test confidence scoring (0.0-1.0 range)
   - Test onboarding doc lookup (confidence 0.95)
   - Test LLM reasoning with temperature 0.3
   - Test escalation threshold (< 0.75 triggers escalation)

2. Unit tests for EscalationQueue exist and pass
   - Test add() creates file in .bmad-escalations/
   - Test list() filters by status and workflowId
   - Test getById() retrieves correct escalation
   - Test respond() updates escalation and resumes workflow
   - Test getMetrics() calculates correct aggregates

3. Unit tests for Mary/John agents exist and pass
   - Test agent initialization with LLM config
   - Test analyzeRequirements() returns structured data
   - Test defineProductVision() generates vision/positioning
   - Test DecisionEngine integration (confidence scoring)

4. Integration tests for PRD workflow exist and pass
   - Test full workflow execution (initialization → finalization)
   - Test Mary ↔ John collaboration (shared context)
   - Test template processing and incremental saves
   - Test quality validation (<85% triggers regeneration)
   - Test escalation flow (pause → respond → resume)

5. Test coverage targets are met
   - DecisionEngine: >90% coverage
   - EscalationQueue: >90% coverage
   - Mary/John agents: >80% coverage
   - PRD workflow: >80% coverage

6. Test execution in CI/CD pipeline works
   - Tests run automatically on commits
   - Coverage reports generated
   - Pull requests blocked if tests fail or coverage drops

7. All tests passing with 0 failures, 0 errors
   - No flaky tests
   - No skipped tests (unless explicitly documented)
   - All TypeScript type errors resolved

## Tasks / Subtasks

**⚠️ IMPORTANT**: This is a VERIFICATION story. Tests were already written during Stories 2.1-2.7 using ATDD methodology. These tasks verify and consolidate existing tests.

- [ ] Task 1: Verify DecisionEngine tests exist and are comprehensive (AC: #1)
  - [ ] Check `backend/tests/core/DecisionEngine.test.ts` exists
  - [ ] Verify all test cases from AC #1 are present
  - [ ] Run tests: `npm run test -- DecisionEngine.test.ts`
  - [ ] Confirm 0 failures, 0 errors
  - [ ] Check coverage: `npm run test:coverage -- DecisionEngine`
  - [ ] Verify >90% coverage achieved
  - [ ] Document test count and coverage percentage

- [ ] Task 2: Verify EscalationQueue tests exist and are comprehensive (AC: #2)
  - [ ] Check `backend/tests/core/EscalationQueue.test.ts` exists
  - [ ] Verify all test cases from AC #2 are present
  - [ ] Run tests: `npm run test -- EscalationQueue.test.ts`
  - [ ] Confirm 0 failures, 0 errors
  - [ ] Check coverage: `npm run test:coverage -- EscalationQueue`
  - [ ] Verify >90% coverage achieved
  - [ ] Document test count and coverage percentage

- [ ] Task 3: Verify Mary and John agent tests exist and are comprehensive (AC: #3)
  - [ ] Check `backend/tests/agents/MaryAgent.test.ts` exists
  - [ ] Check `backend/tests/agents/JohnAgent.test.ts` exists
  - [ ] Verify all test cases from AC #3 are present for both agents
  - [ ] Run tests: `npm run test -- MaryAgent.test.ts JohnAgent.test.ts`
  - [ ] Confirm 0 failures, 0 errors
  - [ ] Check coverage: `npm run test:coverage -- agents/`
  - [ ] Verify >80% coverage achieved for both agents
  - [ ] Document test counts and coverage percentages

- [ ] Task 4: Verify PRD workflow integration tests exist and are comprehensive (AC: #4)
  - [ ] Check `backend/tests/integration/prd-workflow.test.ts` exists
  - [ ] Verify all test scenarios from AC #4 are present:
    - Full workflow execution (initialization → finalization)
    - Mary ↔ John collaboration (shared context)
    - Template processing and incremental saves
    - Quality validation (<85% triggers regeneration)
    - Escalation flow (pause → respond → resume)
  - [ ] Run tests: `npm run test -- prd-workflow.test.ts`
  - [ ] Confirm 0 failures, 0 errors
  - [ ] Check coverage: `npm run test:coverage -- integration/`
  - [ ] Verify >80% coverage achieved
  - [ ] Document test count and coverage percentage

- [ ] Task 5: Verify PRDWorkflowExecutor tests exist (Story 2.5 tests)
  - [ ] Check `backend/tests/core/workflows/PRDWorkflowExecutor.test.ts` exists
  - [ ] Run tests: `npm run test -- PRDWorkflowExecutor.test.ts`
  - [ ] Confirm 0 failures, 0 errors
  - [ ] Check coverage for PRDWorkflowExecutor component
  - [ ] Document test count and coverage percentage

- [ ] Task 6: Verify PRDTemplateProcessor tests exist (Story 2.6 tests)
  - [ ] Check `backend/tests/core/workflows/PRDTemplateProcessor.test.ts` exists
  - [ ] Run tests: `npm run test -- PRDTemplateProcessor.test.ts`
  - [ ] Confirm 0 failures, 0 errors
  - [ ] Check coverage for PRDTemplateProcessor component
  - [ ] Document test count and coverage percentage

- [ ] Task 7: Verify PRDValidator tests exist (Story 2.7 tests)
  - [ ] Check `backend/tests/core/workflows/PRDValidator.test.ts` exists
  - [ ] Run tests: `npm run test -- PRDValidator.test.ts`
  - [ ] Confirm 0 failures, 0 errors (expected: 65/65 passing from Story 2.7)
  - [ ] Check coverage for PRDValidator component (expected: >90%)
  - [ ] Fix any remaining TypeScript warnings (7 warnings noted in Story 2.7 review)
  - [ ] Re-run tests after fixes to confirm still passing
  - [ ] Document test count (expected: 58 unit + 7 integration = 65)

- [ ] Task 8: Run complete Epic 2 test suite (AC: #5, #7)
  - [ ] Run all tests: `npm run test`
  - [ ] Confirm ALL tests passing: 0 failures, 0 errors
  - [ ] Generate coverage report: `npm run test:coverage`
  - [ ] Verify coverage targets met:
    - DecisionEngine: >90% ✓
    - EscalationQueue: >90% ✓
    - Mary/John agents: >80% ✓
    - PRD workflow components: >80% ✓
  - [ ] Document total test count and overall coverage percentage
  - [ ] Take screenshot or save coverage report HTML

- [ ] Task 9: Verify CI/CD pipeline integration (AC: #6)
  - [ ] Check `.github/workflows/` for test automation config (from Story 1.12)
  - [ ] Verify test command is in CI pipeline: `npm run test`
  - [ ] Verify coverage command is in CI pipeline: `npm run test:coverage`
  - [ ] Confirm coverage enforcement is active (>80% minimum)
  - [ ] Check that PR merge is blocked if tests fail
  - [ ] Document CI/CD test integration status

- [ ] Task 10: Create Epic 2 test summary document
  - [ ] Create `docs/test-reports/epic-2-test-summary.md`
  - [ ] Document total test count per component
  - [ ] Document coverage percentages per component
  - [ ] Include test execution time
  - [ ] List any known test limitations or TODOs
  - [ ] Confirm Epic 2 quality gate passed (all ACs met)

- [ ] Task 11: Fix any remaining test issues
  - [ ] Address TypeScript strict mode warnings in PRDValidator (7 warnings from Story 2.7)
  - [ ] Fix any flaky tests identified during execution
  - [ ] Update test documentation if needed
  - [ ] Re-run full test suite after fixes
  - [ ] Confirm 100% pass rate maintained

## Dev Notes

### Story Context

**Story Type**: VERIFICATION & QUALITY GATE

This is NOT an implementation story. Story 2.8 verifies that Epic 2 followed ATDD (Acceptance Test-Driven Development) correctly and that all tests exist, pass, and meet coverage targets.

**Tech Spec Confirmation** (docs/tech-spec-epic-2.md, line 825):
> "**Note**: Story 2.8 follows ATDD (Acceptance Test-Driven Development) - tests written alongside implementation, not as separate story"

This means:
- Tests were already written during Stories 2.1-2.7 as part of ATDD
- Story 2.8 **verifies** these tests exist and pass
- Story 2.8 **validates** coverage targets are met
- Story 2.8 acts as **Epic 2 quality gate** before moving to Epic 3

### Test Infrastructure (from Story 1.11)

**Test Framework**: Vitest
**Test Locations**:
```
backend/tests/
├── core/
│   ├── DecisionEngine.test.ts         # Story 2.1 (confidence, escalation)
│   ├── EscalationQueue.test.ts        # Story 2.2 (queue operations)
│   └── workflows/
│       ├── PRDWorkflowExecutor.test.ts    # Story 2.5 (workflow orchestration)
│       ├── PRDTemplateProcessor.test.ts   # Story 2.6 (content generation)
│       └── PRDValidator.test.ts           # Story 2.7 (quality validation)
├── agents/
│   ├── MaryAgent.test.ts              # Story 2.3 (business analyst)
│   └── JohnAgent.test.ts              # Story 2.4 (product manager)
└── integration/
    └── prd-workflow.test.ts           # Full workflow integration tests
```

**Test Commands**:
```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- PRDValidator.test.ts

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

### Coverage Targets (from tech-spec-epic-2.md)

| Component | Target Coverage | Story |
|-----------|----------------|-------|
| DecisionEngine | >90% | 2.1 |
| EscalationQueue | >90% | 2.2 |
| MaryAgent | >80% | 2.3 |
| JohnAgent | >80% | 2.4 |
| PRDWorkflowExecutor | >80% | 2.5 |
| PRDTemplateProcessor | >80% | 2.6 |
| PRDValidator | >90% | 2.7 |
| PRD Workflow (integration) | >80% | All |

### Learnings from Previous Story

**From Story 2-7-prd-quality-validation (Status: done)**

**Test Results from Story 2.7** (Reference for what "complete" looks like):
- Test Count: 65/65 tests passing (100% pass rate)
  - Unit tests: 58 tests
  - Integration tests: 7 tests
- Coverage: >90% for PRDValidator component ✅
- Performance: <5 seconds execution time ✅
- Quality: ESLint passing, no errors/warnings ✅

**Known Issue from Story 2.7** (line 743-751):
- ⚠️ **7 TypeScript strict mode warnings** in PRDValidator
  - Locations: lines 219, 283, 318, 331, 388, 399, 406
  - Type: "Object possibly undefined" / "String possibly undefined"
  - Impact: LOW - code functions correctly, but strict mode compliance needed
  - Fix: Add null guards or optional chaining
  - **Must be addressed in Story 2.8 for 100% clean test run**

**ATDD Methodology Confirmed**:
From Story 2.7 completion notes (line 526-528):
> "Development Approach: ATDD (Acceptance Test-Driven Development)
> - ✅ Phase 1 (RED): Wrote all 58 unit tests BEFORE implementation
> - ✅ Phase 2 (GREEN): Implemented PRDValidator class to make all tests pass
> - ✅ Phase 3 (INTEGRATION): Added 7 integration tests"

This confirms that Epic 2 followed ATDD - tests were written FIRST for each story, then implementation, then integration tests. Story 2.8 validates that this methodology was followed correctly across ALL Epic 2 stories.

**Test Organization Pattern** (to verify in Story 2.8):
1. Unit tests in `backend/tests/core/` or `backend/tests/agents/`
2. Integration tests in `backend/tests/integration/`
3. Each component has dedicated test file (e.g., `PRDValidator.test.ts`)
4. Tests organized by acceptance criterion (describe blocks per AC)
5. Comprehensive test coverage (happy path + error cases + edge cases)

**Quality Standards** (from Story 2.7):
- TypeScript: Strict mode compliance (no warnings)
- ESLint: No errors or warnings
- Test Coverage: >80-90% per component
- Test Pass Rate: 100% (0 failures, 0 errors)
- Performance: Tests should complete in <30 seconds for full Epic 2 suite

### Project Structure Notes

**Test Files to Verify** (created in previous stories):
- `backend/tests/core/DecisionEngine.test.ts` (Story 2.1)
- `backend/tests/core/EscalationQueue.test.ts` (Story 2.2)
- `backend/tests/agents/MaryAgent.test.ts` (Story 2.3)
- `backend/tests/agents/JohnAgent.test.ts` (Story 2.4)
- `backend/tests/core/workflows/PRDWorkflowExecutor.test.ts` (Story 2.5)
- `backend/tests/core/workflows/PRDTemplateProcessor.test.ts` (Story 2.6)
- `backend/tests/core/workflows/PRDValidator.test.ts` (Story 2.7)
- `backend/tests/integration/prd-workflow.test.ts` (Integration across all)

**New Files to Create** (Story 2.8 deliverables):
- `docs/test-reports/epic-2-test-summary.md` - Comprehensive test report
- Optional: `docs/test-reports/epic-2-coverage-report.html` - Visual coverage report

**Files to Update** (if TypeScript warnings need fixing):
- `backend/src/core/workflows/prd-validator.ts` - Fix 7 TypeScript warnings

**CI/CD Configuration** (to verify):
- `.github/workflows/*.yml` - Test automation from Story 1.12

### References

- [Tech Spec - Story 2.8 ACs](docs/tech-spec-epic-2.md#Story-28-PRD-Validation-Tests) - Lines 797-825
- [Tech Spec - ATDD Note](docs/tech-spec-epic-2.md#Story-28-PRD-Validation-Tests) - Line 825
- [Tech Spec - Traceability Mapping](docs/tech-spec-epic-2.md#Traceability-Mapping) - Lines 854-913
- [Story 1.11 - Test Framework Setup](stories/1-11-test-framework-setup-infrastructure.md) - Test infrastructure foundation
- [Story 1.12 - CI/CD Pipeline](stories/1-12-ci-cd-pipeline-configuration.md) - Automated test execution
- [Story 2.1 - DecisionEngine](stories/2-1-confidence-based-decision-engine.md) - Confidence scoring tests
- [Story 2.2 - EscalationQueue](stories/2-2-escalation-queue-system.md) - Queue operation tests
- [Story 2.3 - Mary Agent](stories/2-3-mary-agent-business-analyst-persona.md) - Business analyst tests
- [Story 2.4 - John Agent](stories/2-4-john-agent-product-manager-persona.md) - Product manager tests
- [Story 2.5 - PRD Workflow Executor](stories/2-5-prd-workflow-executor.md) - Workflow orchestration tests
- [Story 2.6 - PRD Template Processor](stories/2-6-prd-template-content-generation.md) - Content generation tests
- [Story 2.7 - PRD Validator](stories/2-7-prd-quality-validation.md) - Quality validation tests (65 tests example)
- [Epics - Epic 2 Overview](docs/epics.md#Epic-2-Analysis-Phase-Automation) - Epic context

### Verification Checklist

Use this checklist to verify Story 2.8 completion:

**Test File Existence** (Task 1-7):
- [ ] DecisionEngine.test.ts exists and has comprehensive tests
- [ ] EscalationQueue.test.ts exists and has comprehensive tests
- [ ] MaryAgent.test.ts exists and has comprehensive tests
- [ ] JohnAgent.test.ts exists and has comprehensive tests
- [ ] PRDWorkflowExecutor.test.ts exists and has comprehensive tests
- [ ] PRDTemplateProcessor.test.ts exists and has comprehensive tests
- [ ] PRDValidator.test.ts exists and has comprehensive tests (65 tests expected)
- [ ] prd-workflow.test.ts exists and has integration tests

**Test Execution** (Task 8):
- [ ] All tests pass: 0 failures, 0 errors
- [ ] No flaky tests (tests pass consistently)
- [ ] No skipped tests (all tests enabled)
- [ ] Test execution time <30 seconds for Epic 2 suite

**Coverage Validation** (Task 8):
- [ ] DecisionEngine: >90% coverage ✓
- [ ] EscalationQueue: >90% coverage ✓
- [ ] MaryAgent: >80% coverage ✓
- [ ] JohnAgent: >80% coverage ✓
- [ ] PRDWorkflowExecutor: >80% coverage ✓
- [ ] PRDTemplateProcessor: >80% coverage ✓
- [ ] PRDValidator: >90% coverage ✓
- [ ] Overall Epic 2: >80% coverage ✓

**Code Quality** (Task 11):
- [ ] TypeScript strict mode: 0 warnings (fix 7 warnings from Story 2.7)
- [ ] ESLint: 0 errors, 0 warnings
- [ ] No console.log statements (except intentional logging)
- [ ] All tests have clear, descriptive names

**CI/CD Integration** (Task 9):
- [ ] Tests run automatically on git push
- [ ] Coverage reports generated automatically
- [ ] PR merge blocked if tests fail
- [ ] PR merge blocked if coverage drops below 80%

**Documentation** (Task 10):
- [ ] Epic 2 test summary document created
- [ ] Test counts documented per component
- [ ] Coverage percentages documented per component
- [ ] Known limitations documented (if any)
- [ ] Epic 2 quality gate status: PASSED ✓

### Expected Outcomes

After Story 2.8 completion:

1. **Verified Test Suite**: All Epic 2 tests exist and pass (0 failures)
2. **Coverage Validation**: All components meet or exceed coverage targets
3. **Quality Gate Passed**: Epic 2 ready for production deployment
4. **CI/CD Confirmed**: Automated testing working correctly
5. **Documentation Complete**: Test summary report available for stakeholders
6. **Clean Code**: All TypeScript warnings resolved
7. **Epic 2 Complete**: Ready to proceed to Epic 3 (Planning Phase Automation)

### Story 2.8 Success Criteria

**STORY IS COMPLETE WHEN**:
- ✅ All 7 acceptance criteria validated and documented
- ✅ All 11 tasks completed and checked off
- ✅ Epic 2 test summary document created
- ✅ All tests passing (0 failures, 0 errors)
- ✅ Coverage targets met for all components
- ✅ TypeScript warnings from Story 2.7 resolved
- ✅ CI/CD pipeline validation confirmed
- ✅ Epic 2 quality gate: PASSED

**Epic 2 Quality Gate Status**: PENDING (Story 2.8 completion required)

## Dev Agent Record

### Context Reference

- docs/stories/2-8-prd-validation-tests.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
