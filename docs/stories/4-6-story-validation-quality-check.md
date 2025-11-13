# Story 4.6: Story Validation & Quality Check

Status: in-progress

## Story

As a Scrum Master planning story implementation,
I want the system to validate story completeness, size, clarity, and dev agent compatibility,
So that I can ensure all stories are ready for autonomous development and meet quality standards.

## Acceptance Criteria

### Story Validation (AC 1-12)
1. **Story Size Validation**: Check word count (<500 words), acceptance criteria count (8-12), estimated hours (<2 hours target, <8 hours max)
2. **Clarity Validation**: Verify user story format ("As a..., I want..., So that..."), clear title, specific acceptance criteria
3. **Completeness Validation**: Ensure required fields present (id, epic, title, description, acceptance_criteria, dependencies, status, technical_notes, estimated_hours, complexity)
4. **Technical Notes Validation**: Validate affected_files, endpoints, data_structures, test_requirements are present and non-empty
5. **Dependency Validation**: Check all dependency IDs exist, no circular dependencies, no self-dependencies
6. **Dev Agent Compatibility**: Check single responsibility (not multiple unrelated features), testable acceptance criteria
7. **Validation Result**: Return ValidationResult with pass/fail, weighted score (0.0-1.0), detailed checks, blockers, warnings
8. **Score Weighting**: Apply weights - Size (20%), Clarity (30%), Completeness (25%), Dependencies (25%)
9. **Blocker Detection**: Flag critical issues as blockers (missing required fields, circular dependencies, >8 hours)
10. **Warning Detection**: Flag non-critical issues as warnings (15+ ACs, close to word limit, soft recommendations)
11. **Performance**: Complete validation in <100ms per story
12. **Batch Validation**: Support validating multiple stories with aggregate results

### Integration (AC 13-16)
13. **Orchestrator Integration**: Integrate with SolutioningOrchestrator after dependency detection
14. **Validation Logging**: Log validation warnings and blockers to console
15. **Failed Story Flagging**: Mark stories with validation failures in story object
16. **Metrics Tracking**: Add validation metrics to SolutioningResult (total validated, passed, failed, avg score)

### Testing (AC 17-20)
17. **Size Validation Tests**: Test word count, AC count, estimated hours checks
18. **Clarity Validation Tests**: Test user story format, title format, AC clarity
19. **Completeness Tests**: Test required fields, technical notes validation
20. **Edge Case Tests**: Test boundary conditions, empty arrays, missing fields, circular dependencies

## Tasks / Subtasks

### Task 1: Implement StoryValidator Service (AC: 1-12)
- [ ] Create `backend/src/solutioning/story-validator.ts` file
- [ ] Implement `StoryValidator` class
- [ ] Method: `validateStory(story: Story, allStories: Story[]): ValidationResult`
  - [ ] Check story size (word count, AC count, estimated hours)
  - [ ] Check clarity (user story format, title, ACs)
  - [ ] Check completeness (required fields, technical notes)
  - [ ] Check dependencies (valid IDs, no circular deps, no self-deps)
  - [ ] Check dev agent compatibility (single responsibility, testable)
  - [ ] Calculate weighted score (Size: 20%, Clarity: 30%, Completeness: 25%, Dependencies: 25%)
  - [ ] Collect blockers and warnings
  - [ ] Return ValidationResult with pass/fail, score, checks, blockers, warnings
- [ ] Method: `validateStories(stories: Story[]): BatchValidationResult`
  - [ ] Validate all stories
  - [ ] Aggregate results (total, passed, failed, avg score)
  - [ ] Return batch result with individual results
- [ ] Helper: `checkStorySize(story: Story): ValidationCheck[]`
- [ ] Helper: `checkStoryClarity(story: Story): ValidationCheck[]`
- [ ] Helper: `checkStoryCompleteness(story: Story): ValidationCheck[]`
- [ ] Helper: `checkDependencies(story: Story, allStories: Story[]): ValidationCheck[]`
- [ ] Helper: `checkDevAgentCompatibility(story: Story): ValidationCheck[]`
- [ ] Helper: `calculateWeightedScore(checks: ValidationCheck[]): number`
- [ ] Helper: `detectCircularDependencies(story: Story, allStories: Story[], visited: Set<string>): string[]`
- [ ] Define BatchValidationResult interface:
  ```typescript
  interface BatchValidationResult {
    totalStories: number;
    passed: number;
    failed: number;
    avgScore: number;
    results: Map<string, ValidationResult>;
  }
  ```

### Task 2: Integrate with Solutioning Orchestrator (AC: 13-16)
- [ ] Update `backend/src/solutioning/solutioning-orchestrator.ts`
- [ ] Import StoryValidator
- [ ] Add validation step after dependency detection
- [ ] Validate all stories using validateStories()
- [ ] Log validation summary (passed, failed, avg score)
- [ ] Log warnings for failed stories
- [ ] Flag stories with validation failures
- [ ] Add validation metrics to SolutioningResult:
  ```typescript
  interface SolutioningResult {
    // ... existing fields
    validationMetrics: {
      totalValidated: number;
      passed: number;
      failed: number;
      avgScore: number;
      failedStoryIds: string[];
    };
  }
  ```

### Task 3: Write Unit Tests (AC: 17-20)
- [ ] Create `backend/tests/unit/solutioning/story-validator.test.ts`
- [ ] Test scenarios:
  - [ ] Valid story passes all checks
  - [ ] Story with too many words fails size check
  - [ ] Story with too few ACs fails size check
  - [ ] Story with >8 estimated hours gets blocker
  - [ ] Story without user story format fails clarity check
  - [ ] Story with vague ACs fails clarity check
  - [ ] Story with missing required fields fails completeness check
  - [ ] Story with empty technical notes fails completeness check
  - [ ] Story with invalid dependency IDs fails dependency check
  - [ ] Story with circular dependency fails dependency check
  - [ ] Story with self-dependency fails dependency check
  - [ ] Story with multiple unrelated features fails dev agent compatibility check
  - [ ] Weighted score calculation is correct
  - [ ] Batch validation aggregates results correctly
  - [ ] Performance test: <100ms per story
- [ ] Use Vitest framework
- [ ] Target: 80%+ test coverage

### Task 4: Export and Documentation
- [ ] Export StoryValidator from `backend/src/solutioning/index.ts`
- [ ] Export ValidationResult type (already exported from types.ts)
- [ ] Export BatchValidationResult type
- [ ] Add JSDoc comments to all public methods
- [ ] Add usage examples in JSDoc

## Dependencies

**Blocking Dependencies:**
- Story 4.1 complete: Solutioning Data Models (Story, ValidationResult types)
- Story 4.5 complete: Dependency Detection (to validate after dependencies detected)

**Enables:**
- Story 4.7: Sprint Status File Generation (uses validation results)
- Story 4.9: Implementation Readiness Gate Validation (uses story validation)

**Soft Dependencies:**
- None

## Dev Notes

### Architecture Context

This story implements story validation to ensure all stories meet quality standards before implementation. It validates story size, clarity, completeness, dependencies, and dev agent compatibility.

**Validation Flow:**
1. Validate story size (word count, AC count, estimated hours)
2. Validate clarity (user story format, title, ACs)
3. Validate completeness (required fields, technical notes)
4. Validate dependencies (valid IDs, no circular deps)
5. Validate dev agent compatibility (single responsibility, testable)
6. Calculate weighted score and collect blockers/warnings
7. Return ValidationResult with pass/fail and detailed feedback

**Score Weighting:**
- Size checks: 20% (word count, AC count, estimated hours)
- Clarity checks: 30% (user story format, title, AC clarity)
- Completeness checks: 25% (required fields, technical notes)
- Dependency checks: 25% (valid IDs, no circular deps)

**Blocker vs Warning:**
- **Blockers**: Critical issues preventing implementation
  - Missing required fields
  - Circular dependencies
  - >8 estimated hours
  - Self-dependencies
  - Invalid dependency IDs
- **Warnings**: Non-critical issues for review
  - 15+ acceptance criteria
  - Close to 500-word limit
  - Soft recommendations (e.g., consider splitting story)

### Testing Strategy

**Unit Test Coverage:**
- Story size validation (word count, AC count, estimated hours)
- Story clarity validation (user story format, title, ACs)
- Story completeness validation (required fields, technical notes)
- Dependency validation (valid IDs, circular deps, self-deps)
- Dev agent compatibility validation (single responsibility, testable)
- Weighted score calculation
- Batch validation aggregation
- Performance testing (<100ms per story)

**Test Data:**
- Valid stories passing all checks
- Stories failing each validation check
- Stories with boundary conditions (e.g., exactly 500 words, exactly 12 ACs)
- Stories with circular dependencies
- Stories with invalid dependency IDs

**Coverage Target:**
- 80%+ statement coverage for all new code

### References

- **Epic 4 Tech Spec**: `docs/epics/epic-4-tech-spec.md`
- **Data Models**: `backend/src/solutioning/types.ts` (Story, ValidationResult)
- **Story 4.1**: Solutioning Data Models & Story Schema
- **Story 4.5**: Dependency Detection & Graph Generation

## Change Log

- **2025-11-13**: Story created for Epic 4 implementation

## Dev Agent Record

### Implementation Summary

**Status**: In Progress

Implementation started 2025-11-13.

### Context Reference

- `docs/stories/4-6-story-validation-quality-check.context.xml` (to be generated)

---
