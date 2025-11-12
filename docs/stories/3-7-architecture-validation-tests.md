# Story 3.7: Architecture Validation Tests

Status: drafted

## Story

As the Agent Orchestrator,
I want architecture validation tests that verify completeness, PRD traceability, test strategy completeness, and technical decision consistency,
So that generated architecture documents meet quality standards before progressing to the solutioning phase.

## Acceptance Criteria

1. **Architecture Completeness Validation**
   - Check all required sections present in architecture.md
   - Required sections: System Overview, Component Architecture, Data Models, APIs, Non-Functional Requirements, Test Strategy, Technical Decisions
   - Each section must have substantive content (not just placeholder text)
   - Minimum word count per section enforced
   - Completeness score calculated: (complete sections / total sections) × 100

2. **PRD Traceability Validation**
   - Extract all PRD requirements (functional and non-functional)
   - Verify each PRD requirement addressed in architecture.md
   - Check System Overview covers high-level requirements
   - Check Component Architecture covers functional requirements
   - Check NFR section covers non-functional requirements
   - Generate traceability matrix: PRD requirement → Architecture section
   - Traceability score calculated: (addressed requirements / total requirements) × 100

3. **Test Strategy Completeness Validation**
   - Check test strategy section present and non-empty
   - Check test frameworks defined
   - Check test pyramid specified (unit, integration, E2E ratios)
   - Check CI/CD pipeline defined
   - Check quality gates specified
   - Check ATDD approach documented
   - Test strategy score calculated: (complete elements / total elements) × 100

4. **Technical Decision Consistency Validation**
   - Check Technical Decisions section contains ADRs
   - Check no contradictory decisions (e.g., "use monolith" vs "use microservices")
   - Check technology stack decisions consistent across sections
   - Check test framework compatible with technology stack
   - Detect conflicts and generate conflict report
   - Consistency score calculated: 100% if no conflicts, 0% if conflicts detected

5. **Overall Quality Score**
   - Overall quality score = average of: completeness, traceability, test strategy, consistency scores
   - Pass threshold: ≥85% overall quality score
   - If passed: Log success, mark architecture as validated
   - If failed: Generate validation report with improvement recommendations
   - Validation report includes: scores, missing elements, conflicts, recommendations

6. **Integration with Workflow**
   - Validation executes in ArchitectureWorkflowExecutor Step 9
   - Replace placeholder validation with real validation logic
   - Log validation results to workflow state
   - Emit validation events (passed/failed)
   - If failed: Create escalation with validation report
   - Only proceed to workflow completion if validation passes

## Tasks / Subtasks

### Task 1: Create ArchitectureValidator Class (2-3 hours)

- [ ] Create `backend/src/core/architecture-validator.ts`
- [ ] Implement ArchitectureValidator class
- [ ] Define ValidationResult interface
- [ ] Define TraceabilityMatrix type
- [ ] Method: `validate(architecturePath: string, prdPath: string): Promise<ValidationResult>`
- [ ] Method: `generateValidationReport(result: ValidationResult): string`

### Task 2: Implement Completeness Validation (2-3 hours)

- [ ] Method: `validateCompleteness(architectureContent: string): CompletenessResult`
- [ ] Check all required sections present
- [ ] Check each section has substantive content (>100 words)
- [ ] Calculate completeness score
- [ ] Identify missing or incomplete sections
- [ ] Return completeness result

### Task 3: Implement PRD Traceability Validation (3-4 hours)

- [ ] Method: `validateTraceability(architectureContent: string, prdContent: string): TraceabilityResult`
- [ ] Extract PRD requirements (functional, non-functional)
- [ ] Parse PRD sections: Features, Functional Requirements, Non-Functional Requirements
- [ ] Search architecture for requirement coverage
- [ ] Generate traceability matrix
- [ ] Calculate traceability score
- [ ] Identify unaddressed requirements
- [ ] Return traceability result

### Task 4: Implement Test Strategy Validation (2-3 hours)

- [ ] Method: `validateTestStrategy(architectureContent: string): TestStrategyResult`
- [ ] Check test strategy section exists
- [ ] Check test frameworks defined
- [ ] Check test pyramid specified
- [ ] Check CI/CD pipeline defined
- [ ] Check quality gates specified
- [ ] Check ATDD approach documented
- [ ] Calculate test strategy score
- [ ] Return test strategy result

### Task 5: Implement Consistency Validation (3-4 hours)

- [ ] Method: `validateConsistency(architectureContent: string): ConsistencyResult`
- [ ] Extract technology stack from all sections
- [ ] Check no contradictory architectural decisions
- [ ] Check test frameworks compatible with tech stack
- [ ] Check component communication patterns consistent
- [ ] Detect conflicts and generate conflict list
- [ ] Calculate consistency score
- [ ] Return consistency result

### Task 6: Implement Overall Quality Score (1-2 hours)

- [ ] Method: `calculateOverallScore(results: ValidationResults): number`
- [ ] Average completeness, traceability, test strategy, consistency scores
- [ ] Apply weighting if needed (all equal for MVP)
- [ ] Return overall score (0-100)
- [ ] Method: `generateValidationReport(result: ValidationResult): string`
- [ ] Format validation results as markdown report
- [ ] Include scores, missing elements, conflicts, recommendations
- [ ] Return formatted report

### Task 7: Integrate with ArchitectureWorkflowExecutor (1-2 hours)

- [ ] Update ArchitectureWorkflowExecutor Step 9 (remove placeholder)
- [ ] Call ArchitectureValidator.validate(architecturePath, prdPath)
- [ ] Handle passed result: Log success, complete workflow
- [ ] Handle failed result: Generate report, create escalation, block completion
- [ ] Update workflow state with validation result
- [ ] Emit validation.passed or validation.failed event

### Task 8: Write Integration Tests (2-3 hours)

- [ ] Create `backend/tests/integration/architecture-validator.test.ts`
- [ ] Test: Validate complete architecture (all checks pass)
- [ ] Test: Validate incomplete architecture (missing sections)
- [ ] Test: PRD traceability with complete coverage
- [ ] Test: PRD traceability with gaps
- [ ] Test: Test strategy validation
- [ ] Test: Consistency validation with conflicts
- [ ] Test: Overall quality score calculation
- [ ] Verify test coverage >80%

## Dependencies

**Blocking Dependencies:**
- Story 3-3 (Architecture Workflow Executor): Integration point (Step 9)
- Story 3-5 (Architecture Template): Template structure defines required sections
- Story 3-6 (Security Gate): Security validation precedes quality validation

**Soft Dependencies:**
- Story 2.2 (Escalation Queue): Create escalation on validation failure

**Enables:**
- Epic 4 (Solutioning Phase): Validates architecture ready for story decomposition

## Dev Notes

### Required Architecture Sections

1. **System Overview** (minimum 200 words)
2. **Component Architecture** (minimum 300 words)
3. **Data Models** (minimum 200 words)
4. **API Specifications** (minimum 200 words)
5. **Non-Functional Requirements** (minimum 400 words)
6. **Test Strategy** (minimum 300 words)
7. **Technical Decisions** (minimum 200 words, at least 3 ADRs)

### Test Strategy Required Elements

1. Test frameworks defined (e.g., "Vitest for unit/integration, Playwright for E2E")
2. Test pyramid specified (e.g., "60% unit, 30% integration, 10% E2E")
3. CI/CD pipeline defined (e.g., "GitHub Actions, run on PR and main push")
4. Quality gates specified (e.g., "80% coverage, 0 failures")
5. ATDD approach documented (e.g., "Write acceptance criteria tests before implementation")

### Consistency Checks

**Technology Stack Consistency:**
- Language across all sections (e.g., TypeScript)
- Framework across component and API sections (e.g., Fastify)
- Database across data model and API sections (e.g., PostgreSQL)
- Test framework compatible with language (e.g., Vitest for TypeScript)

**Architectural Decision Consistency:**
- No contradictory patterns (e.g., "use monolith" + "use microservices")
- No contradictory communication patterns (e.g., "synchronous REST" + "asynchronous message queue" without rationale)
- No contradictory data strategies (e.g., "SQL database" + "document store" without clear separation)

### Validation Report Example

```markdown
# Architecture Validation Report

**Overall Quality Score:** 78% ❌ FAILED (threshold: 85%)
**Date:** 2025-11-12

## Scores

- **Completeness:** 85% (6/7 sections complete)
- **PRD Traceability:** 90% (27/30 requirements addressed)
- **Test Strategy:** 60% (3/5 elements complete)
- **Consistency:** 100% (no conflicts detected)

## Completeness Issues

### Missing Section: Technical Decisions
**Severity:** HIGH
**Issue:** Technical Decisions section is empty (0 ADRs)
**Recommendation:** Add at least 3 Architecture Decision Records documenting key architectural choices (e.g., architecture pattern, technology stack, test strategy)

## PRD Traceability Issues

### Unaddressed Requirements

1. **NFR-PERF-001:** Workflow execution speed <45 minutes
   - **Missing from:** Non-Functional Requirements > Performance section
   - **Recommendation:** Add performance targets and optimization strategies

2. **FR-CORE-003:** Resume capability after crash
   - **Missing from:** Component Architecture > State Manager section
   - **Recommendation:** Document state persistence and resume logic

3. **NFR-SEC-002:** API rate limiting
   - **Missing from:** API Specifications > Security section
   - **Recommendation:** Specify rate limiting strategy and implementation approach

## Test Strategy Issues

### Missing Elements

1. **CI/CD Pipeline:** Not defined
   - **Recommendation:** Add CI/CD pipeline specification (tools, triggers, stages)

2. **ATDD Approach:** Not documented
   - **Recommendation:** Document Acceptance Test-Driven Development approach

## Next Steps

1. Review validation report and update architecture.md to address issues
2. Add Technical Decisions section with ADRs
3. Address PRD traceability gaps
4. Complete test strategy section
5. Re-run architecture validation
6. Once validation passes (≥85% score), workflow can complete
```

### References

- Epic 3 Tech Spec: `docs/epics/epic-3-tech-spec.md` (lines 124: ArchitectureValidator, lines 799: AC-3.7, lines 521: Step 9)
- PRD: NFR-ARCH-001 (Architecture quality standards)
- Architecture: Quality standards section

## Change Log

- **2025-11-12**: Story created (drafted)
