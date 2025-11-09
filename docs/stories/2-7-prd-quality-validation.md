# Story 2.7: PRD Quality Validation

Status: drafted

## Story

As a PRD workflow,
I want to validate generated PRD quality before completion,
So that output meets >85% completeness standard.

## Acceptance Criteria

1. Implement PRDValidator class with quality checks
2. Verify all required sections present
3. Check requirements clarity (no vague "handle X" requirements)
4. Validate success criteria are measurable
5. Ensure acceptance criteria for key features
6. Check for contradictions or gaps
7. Generate completeness score (target >85%)
8. If score <85%, identify gaps and regenerate missing content
9. Log validation results for improvement

## Tasks / Subtasks

**⚠️ ATDD Approach: START WITH TASK 8 (Write Tests First), then proceed to Tasks 1-7 (Implementation), then Task 9 (Integration Tests)**

- [ ] Task 1: Implement PRDValidator class structure (AC: #1)
  - [ ] Create `backend/src/core/workflows/prd-validator.ts` file
  - [ ] Define PRDValidator class with constructor accepting StateManager
  - [ ] Define PRDValidationResult interface with TypeScript types
  - [ ] Define ClarityIssue interface (section, issue, severity)
  - [ ] Initialize validation rules configuration
  - [ ] Add TypeScript types and JSDoc comments
  - [ ] Handle file reading errors gracefully

- [ ] Task 2: Implement section presence validation (AC: #2)
  - [ ] Method signature: `validateSectionsPresent(prdContent: string): { sectionsPresent: string[], sectionsMissing: string[] }`
  - [ ] Define required sections list (from template):
    - Executive Summary
    - Success Criteria
    - MVP Scope
    - Functional Requirements
    - Success Metrics (or equivalent)
  - [ ] Parse markdown to extract all ## level headers
  - [ ] Compare extracted sections against required sections
  - [ ] Return sectionsPresent and sectionsMissing arrays
  - [ ] Handle optional sections (performance, security, scalability - only required if applicable to project type)

- [ ] Task 3: Implement requirements clarity validation (AC: #3)
  - [ ] Method signature: `validateRequirementsClarity(prdContent: string): ClarityIssue[]`
  - [ ] Extract all functional requirements from PRD (FR-XXX format)
  - [ ] Check for vague phrases in each requirement:
    - "handle X" (e.g., "handle errors")
    - "manage Y" (e.g., "manage users")
    - "support Z" (without specifics)
    - "improve W" (without measurable target)
  - [ ] Flag requirements that are not specific or testable
  - [ ] Return array of clarity issues with section, issue text, and severity
  - [ ] Severity levels: 'high' (blocking vague requirement), 'medium' (unclear acceptance criteria), 'low' (minor wording improvement)

- [ ] Task 4: Implement success criteria validation (AC: #4)
  - [ ] Method signature: `validateSuccessCriteria(prdContent: string): ClarityIssue[]`
  - [ ] Extract success criteria from Success Criteria section
  - [ ] Check that each criterion is measurable (contains numbers, percentages, or quantifiable outcomes)
  - [ ] Flag criteria that are subjective or unquantifiable (e.g., "users are happy")
  - [ ] Ensure success criteria map to specific features
  - [ ] Return array of issues for non-measurable criteria

- [ ] Task 5: Implement feature acceptance criteria validation (AC: #5)
  - [ ] Method signature: `validateAcceptanceCriteria(prdContent: string): ClarityIssue[]`
  - [ ] Extract key features from MVP Scope and Functional Requirements
  - [ ] For each key feature (e.g., user authentication, data export), check if acceptance criteria are defined
  - [ ] Flag features missing acceptance criteria (high severity)
  - [ ] Check that acceptance criteria are testable (use keywords: "shall", "must", "given/when/then")
  - [ ] Return array of issues for features missing or unclear ACs

- [ ] Task 6: Implement contradiction and gap detection (AC: #6)
  - [ ] Method signature: `detectContradictions(prdContent: string): string[]`
  - [ ] Method signature: `identifyGaps(prdContent: string): string[]`
  - [ ] Contradiction detection:
    - Check for conflicting requirements (e.g., "real-time sync" vs "batch processing only")
    - Check for inconsistent terminology (e.g., "user" vs "customer" for same entity)
    - Check for priority conflicts (two features both marked "must-have" but mutually exclusive)
  - [ ] Gap detection:
    - Missing user flows (e.g., login defined but no logout)
    - Incomplete feature descriptions (mentioned but not specified)
    - Missing error handling requirements
    - No data validation rules where needed
  - [ ] Return arrays of contradictions and gaps as strings

- [ ] Task 7: Implement completeness score calculation (AC: #7, #8)
  - [ ] Method signature: `calculateCompletenessScore(validationResult: Partial<PRDValidationResult>): number`
  - [ ] Scoring algorithm (0-100 scale):
    - Base score: 100 points
    - Missing required section: -15 points each
    - Vague requirement (high severity): -5 points each
    - Non-measurable success criterion: -3 points each
    - Missing acceptance criteria (key feature): -10 points each
    - Contradiction detected: -5 points each
    - Gap identified: -3 points each
  - [ ] Calculate final score (minimum 0, maximum 100)
  - [ ] Set passesQualityGate = true if score >= 85 and no high-severity clarity issues
  - [ ] Return completeness score as integer

- [ ] Task 8: **WRITE TESTS FIRST** - Unit tests for PRDValidator (AC: all) - **START HERE per ATDD**
  - [ ] **CRITICAL**: Write ALL tests below BEFORE implementing any code (Tests should FAIL initially)
  - [ ] Create test file: `backend/tests/core/workflows/PRDValidator.test.ts`
  - [ ] Set up test structure: describe blocks for each AC, beforeEach/afterEach hooks
  - [ ] Mock StateManager dependency (PRDValidator reads PRD.md via StateManager)
  - [ ] Test fixtures: Create sample PRD content (valid PRD, PRD with gaps, PRD with vague requirements)
  - [ ] Test section presence validation (AC #2):
    - [ ] Test all required sections present → sectionsPresent has all, sectionsMissing is empty
    - [ ] Test missing required section → section appears in sectionsMissing
    - [ ] Test extra sections present → no error (optional sections allowed)
  - [ ] Test requirements clarity validation (AC #3):
    - [ ] Test vague "handle X" requirement → flagged as high severity
    - [ ] Test vague "manage Y" requirement → flagged as high severity
    - [ ] Test specific, testable requirement → no issues
    - [ ] Test multiple vague requirements → all flagged
  - [ ] Test success criteria validation (AC #4):
    - [ ] Test measurable criterion (e.g., ">85% completeness") → no issues
    - [ ] Test non-measurable criterion (e.g., "users are happy") → flagged
    - [ ] Test quantifiable outcomes (numbers, percentages) → no issues
  - [ ] Test acceptance criteria validation (AC #5):
    - [ ] Test feature with acceptance criteria → no issues
    - [ ] Test key feature missing ACs → flagged as high severity
    - [ ] Test testable ACs (given/when/then format) → no issues
  - [ ] Test contradiction detection (AC #6):
    - [ ] Test conflicting requirements → contradiction detected
    - [ ] Test inconsistent terminology → contradiction detected
    - [ ] Test consistent PRD → no contradictions
  - [ ] Test gap detection (AC #6):
    - [ ] Test missing user flow (login but no logout) → gap identified
    - [ ] Test incomplete feature description → gap identified
    - [ ] Test complete PRD → no gaps
  - [ ] Test completeness score calculation (AC #7):
    - [ ] Test perfect PRD → score = 100
    - [ ] Test PRD with 1 missing section → score = 85 (100 - 15)
    - [ ] Test PRD with 2 missing sections → score = 70 (100 - 30)
    - [ ] Test PRD with vague requirements → score reduced by 5 per vague requirement
    - [ ] Test score boundary (score = 85) → passesQualityGate = true
    - [ ] Test score below threshold (score = 84) → passesQualityGate = false
  - [ ] Test validate() main method integration (AC #1, all):
    - [ ] Test validate(prdFilePath) returns complete PRDValidationResult
    - [ ] Test PRD.md file not found → error handling
    - [ ] Test empty PRD.md → score = 0, all sections missing
  - [ ] Test gap regeneration trigger (AC #8):
    - [ ] Test score <85 → gaps list populated for regeneration
    - [ ] Test score >=85 → no regeneration needed
  - [ ] Test logging integration (AC #9):
    - [ ] Test validation results logged (console or file)
    - [ ] Test log includes score, gaps, contradictions
  - [ ] Run tests (should all FAIL - no implementation yet): `npm run test -- PRDValidator.test.ts`
  - [ ] **After all tests written and failing, proceed to Task 1 to implement code**
  - [ ] Target: >90% code coverage when implementation complete

- [ ] Task 9: Integration tests with PRDWorkflowExecutor and PRDTemplateProcessor (AC: all)
  - [ ] Test full workflow: PRDTemplateProcessor generates PRD.md → PRDValidator validates
  - [ ] Test validation with real PRD.md (generated by Story 2.6 tests)
  - [ ] Test score >=85% → workflow marks PRD complete
  - [ ] Test score <85% → workflow identifies gaps and triggers regeneration
  - [ ] Test regeneration: missing sections regenerated by PRDTemplateProcessor
  - [ ] Test retry limit: if score still <85 after 2 regenerations, escalate to user
  - [ ] Test validation logging: results saved to workflow state
  - [ ] Verify PRDWorkflowExecutor calls PRDValidator.validate() at correct workflow step

## Dev Notes

### Architecture Alignment

**PRDValidator Location**: `backend/src/core/workflows/prd-validator.ts`

Per architecture.md section 2.2 and tech-spec-epic-2.md:
- PRDValidator is a Workflow Plugin component in the Orchestrator Core
- Validates PRD quality after PRDTemplateProcessor (Story 2.6) generates content
- Called by PRDWorkflowExecutor (Story 2.5) at workflow step "Quality Validation"
- Uses StateManager (Epic 1, Story 1.5) to read docs/PRD.md
- Generates PRDValidationResult with completeness score (0-100) and gap identification
- If score <85%, triggers PRDTemplateProcessor to regenerate missing/gap sections

**Validation Pattern** (from tech spec):
```typescript
interface PRDValidationResult {
  completenessScore: number;     // 0-100, target >85
  sectionsPresent: string[];     // All required sections found
  sectionsMissing: string[];     // Required sections not found
  requirementsCount: number;     // Total functional requirements
  clarityIssues: Array<{
    section: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  contradictions: string[];      // Conflicting requirements identified
  gaps: string[];                // Missing information
  passesQualityGate: boolean;    // True if score >85 and no high-severity issues
}

class PRDValidator {
  constructor(private stateManager: StateManager) {}

  async validate(prdFilePath: string): Promise<PRDValidationResult> {
    // 1. Read PRD.md
    const prdContent = await this.stateManager.readFile(prdFilePath);

    // 2. Run all validation checks
    const sectionsResult = this.validateSectionsPresent(prdContent);
    const clarityIssues = this.validateRequirementsClarity(prdContent);
    const successCriteriaIssues = this.validateSuccessCriteria(prdContent);
    const acIssues = this.validateAcceptanceCriteria(prdContent);
    const contradictions = this.detectContradictions(prdContent);
    const gaps = this.identifyGaps(prdContent);

    // 3. Calculate completeness score
    const result: PRDValidationResult = {
      ...sectionsResult,
      requirementsCount: this.countRequirements(prdContent),
      clarityIssues: [...clarityIssues, ...successCriteriaIssues, ...acIssues],
      contradictions,
      gaps,
      completenessScore: 0,
      passesQualityGate: false
    };

    result.completenessScore = this.calculateCompletenessScore(result);
    result.passesQualityGate = result.completenessScore >= 85 &&
                                !result.clarityIssues.some(i => i.severity === 'high');

    // 4. Log results
    this.logValidationResults(result);

    return result;
  }

  private validateSectionsPresent(content: string): { sectionsPresent: string[], sectionsMissing: string[] } {
    const requiredSections = [
      'Executive Summary',
      'Success Criteria',
      'MVP Scope',
      'Functional Requirements',
      'Success Metrics' // or equivalent
    ];

    const foundSections = this.extractMarkdownSections(content);
    const sectionsPresent = requiredSections.filter(s => foundSections.includes(s));
    const sectionsMissing = requiredSections.filter(s => !foundSections.includes(s));

    return { sectionsPresent, sectionsMissing };
  }

  private validateRequirementsClarity(content: string): ClarityIssue[] {
    const issues: ClarityIssue[] = [];
    const requirements = this.extractRequirements(content);

    const vaguePatterns = [
      /\bhandle\s+\w+/i,    // "handle errors", "handle requests"
      /\bmanage\s+\w+/i,    // "manage users", "manage data"
      /\bsupport\s+\w+$/i,  // "support payments" (without specifics)
      /\bimprove\s+\w+$/i   // "improve performance" (without measurable target)
    ];

    requirements.forEach(req => {
      vaguePatterns.forEach(pattern => {
        if (pattern.test(req.statement)) {
          issues.push({
            section: 'Functional Requirements',
            issue: `Requirement "${req.id}: ${req.statement}" is vague or not testable`,
            severity: 'high'
          });
        }
      });
    });

    return issues;
  }

  private calculateCompletenessScore(result: Partial<PRDValidationResult>): number {
    let score = 100;

    // Deduct points for issues
    score -= (result.sectionsMissing?.length || 0) * 15;
    score -= result.clarityIssues?.filter(i => i.severity === 'high').length || 0 * 5;
    score -= result.clarityIssues?.filter(i => i.severity === 'medium').length || 0 * 3;
    score -= (result.contradictions?.length || 0) * 5;
    score -= (result.gaps?.length || 0) * 3;

    return Math.max(0, Math.min(100, score));
  }
}
```

**Required Sections** (from PRD template in Story 2.6):
- Executive Summary (product overview, vision)
- Success Criteria (measurable outcomes)
- MVP Scope (Phase 1 features)
- Functional Requirements (67+ requirements)
- Success Metrics (KPIs, measurements)

**Optional Sections** (project-type specific):
- Performance Requirements (if applicable to project type)
- Security Requirements (if applicable)
- Scalability Requirements (if applicable)
- Domain-Specific Sections (e.g., HIPAA compliance for healthcare)

### Learnings from Previous Story

**From Story 2.6: PRD Template & Content Generation (Status: done)**

- **New Files Created**: Use PRDTemplateProcessor patterns for validator:
  - `backend/src/core/workflows/prd-template-processor.ts` (900 lines) - Follow class structure pattern
  - `backend/tests/core/workflows/PRDTemplateProcessor.test.ts` (800 lines) - Follow test organization pattern

- **Architectural Patterns Established**:
  - Workflow validators location: `backend/src/core/workflows/` (same directory as template processor)
  - Dependency injection pattern: Pass StateManager as constructor param
  - Markdown parsing: Use regex to extract sections (## headers) and requirements (FR-XXX format)
  - Validation rules: Define clear, testable validation criteria
  - Comprehensive TypeScript interfaces for all data structures
  - Error handling: Try-catch blocks with specific error types

- **Integration Patterns from Story 2.6**:
  - PRDWorkflowExecutor orchestrates workflow: generate → validate → complete
  - PRDValidator called after PRDTemplateProcessor completes all sections
  - If validation score <85%, PRDWorkflowExecutor calls PRDTemplateProcessor to regenerate gaps
  - StateManager used to read docs/PRD.md (atomic file read)
  - Validation results stored in workflow state for audit trail

- **Testing Approach from Story 2.6**:
  - ATDD: Task 8 first (write ALL tests), then Tasks 1-7 (implementation)
  - Test fixtures: Create sample PRD content (valid PRD, PRD with gaps, PRD with vague requirements)
  - Target >90% coverage for validators (critical quality component)
  - Integration tests verify PRDWorkflowExecutor → PRDValidator → PRDTemplateProcessor flow

- **Key Takeaways for Story 2.7**:
  - Follow ATDD approach (Task 8 first, write all tests before implementation)
  - PRDValidator location: `backend/src/core/workflows/prd-validator.ts`
  - Use StateManager (Story 1.5) to read docs/PRD.md
  - Markdown parsing: Extract ## sections, FR-XXX requirements, success criteria
  - Scoring algorithm: 100 base - deductions for missing sections, vague requirements, gaps
  - Threshold: score >=85 and no high-severity issues → passesQualityGate = true
  - If validation fails, identify specific gaps for PRDTemplateProcessor to regenerate
  - Reuse test patterns from Story 2.6 (PRDTemplateProcessor.test.ts)
  - This story completes Epic 2 PRD workflow automation by ensuring quality output

[Source: stories/2-6-prd-template-content-generation.md#Dev-Agent-Record]

### Project Structure Notes

**New File to Create**:
- `backend/src/core/workflows/prd-validator.ts` - PRDValidator class implementation

**Files to Reference**:
- `docs/PRD.md` - PRD document to validate (generated by Story 2.6)
- `backend/src/core/StateManager.ts` - StateManager for file reading (Story 1.5)
- `backend/src/core/workflows/prd-workflow-executor.ts` - PRDWorkflowExecutor calls this (Story 2.5)
- `backend/src/core/workflows/prd-template-processor.ts` - PRDTemplateProcessor for regeneration (Story 2.6)

**Test Files to Create**:
- `backend/tests/core/workflows/PRDValidator.test.ts` - Unit tests (>90% coverage target)
- Update `backend/tests/integration/prd-workflow.test.ts` - Integration tests (add validation tests)

**PRDValidator Interface**:
```typescript
interface PRDValidator {
  validate(prdFilePath: string): Promise<PRDValidationResult>;
  validateSectionsPresent(content: string): { sectionsPresent: string[], sectionsMissing: string[] };
  validateRequirementsClarity(content: string): ClarityIssue[];
  validateSuccessCriteria(content: string): ClarityIssue[];
  validateAcceptanceCriteria(content: string): ClarityIssue[];
  detectContradictions(content: string): string[];
  identifyGaps(content: string): string[];
  calculateCompletenessScore(result: Partial<PRDValidationResult>): number;
  logValidationResults(result: PRDValidationResult): void;
}

interface PRDValidationResult {
  completenessScore: number;
  sectionsPresent: string[];
  sectionsMissing: string[];
  requirementsCount: number;
  clarityIssues: ClarityIssue[];
  contradictions: string[];
  gaps: string[];
  passesQualityGate: boolean;
}

interface ClarityIssue {
  section: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}
```

### References

- [Tech Spec - Story 2.7 AC](docs/tech-spec-epic-2.md#Story-27-PRD-Quality-Validation) - Lines 904-913
- [Tech Spec - PRDValidationResult Schema](docs/tech-spec-epic-2.md#Data-Models-and-Contracts) - Lines 156-172
- [Architecture - Workflow Plugins](docs/architecture.md#11-High-Level-Architecture) - Lines 75-84
- [Epics - Story 2.7](docs/epics.md#Story-27-PRD-Quality-Validation) - Lines 567-585
- [Story 1.5 - State Manager](stories/1-5-state-manager-file-persistence.md) - File reading for docs/PRD.md
- [Story 2.5 - PRD Workflow Executor](stories/2-5-prd-workflow-executor.md) - Workflow orchestration
- [Story 2.6 - PRD Template Processor](stories/2-6-prd-template-content-generation.md) - Content generation and patterns

### Development Approach (ATDD)

**This story follows Acceptance Test-Driven Development (ATDD):**

1. **Write Tests First** (Red Phase)
   - Start with Task 8 (Unit tests) before implementing code
   - Write failing tests for each acceptance criterion
   - Create test file: `backend/tests/core/workflows/PRDValidator.test.ts`
   - Organize tests by AC (one describe block per AC)
   - All tests should fail initially (no implementation yet)

2. **Implement Minimum Code** (Green Phase)
   - Create `backend/src/core/workflows/prd-validator.ts`
   - Implement just enough code to make tests pass
   - Follow Tasks 1-7 in order
   - Run tests frequently: `npm run test:watch`
   - Ensure each AC's tests pass before moving to next AC

3. **Refactor** (Refactor Phase)
   - Clean up code while keeping tests green
   - Extract duplicate logic, improve naming
   - Maintain >90% coverage: `npm run test:coverage`

4. **Integration Tests** (Task 9)
   - Write integration tests after unit tests pass
   - Test full validation with PRDWorkflowExecutor + PRDTemplateProcessor
   - Update `backend/tests/integration/prd-workflow.test.ts`

**Test-First Workflow:**
```bash
# 1. Write tests (should fail)
npm run test -- PRDValidator.test.ts

# 2. Implement code (make tests pass)
npm run test:watch

# 3. Check coverage (target >90%)
npm run test:coverage

# 4. Refactor and verify tests still pass
npm run test
```

**Benefits of ATDD for this story:**
- Ensures all 9 ACs are testable and verified
- Validates scoring algorithm accuracy
- Confirms markdown parsing correctness
- Tests gap identification logic thoroughly
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

# 5. Check coverage (>90% for PRDValidator)
npm run test:coverage
```

**Code Quality Standards:**
- **TypeScript**: Strict mode enabled, no `any` types (use `unknown` if needed)
- **ESLint**: Follow project rules, disable rules only with justification comments
- **Naming**:
  - Classes: PascalCase (e.g., `PRDValidator`)
  - Methods: camelCase (e.g., `validateSectionsPresent`)
  - Interfaces: PascalCase (e.g., `PRDValidationResult`, `ClarityIssue`)
  - Files: kebab-case (e.g., `prd-validator.ts`)
- **Comments**: JSDoc for public methods, inline comments for complex validation logic
- **Imports**: ESM syntax (`import`/`export`), explicit `.js` extensions in imports
- **Error Handling**: Try-catch blocks with specific error types, helpful error messages

**Pre-commit Checklist:**
- [ ] All tests passing (unit + integration)
- [ ] Coverage >90% for PRDValidator
- [ ] TypeScript type-check passes
- [ ] ESLint passes with no warnings
- [ ] No console.log (except intentional logging)
- [ ] JSDoc comments on all public methods
- [ ] Code follows existing patterns from Story 2.6 (PRDTemplateProcessor)
- [ ] Validation logic is clear and testable
- [ ] Scoring algorithm is accurate and well-documented

**Git Commit Message Format:**
```
Story 2.7: Brief description of changes

- Bullet point of what was implemented
- Reference AC numbers (e.g., AC #1, #2)
- Note any validation rules added
- Mention test coverage achieved
```

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
