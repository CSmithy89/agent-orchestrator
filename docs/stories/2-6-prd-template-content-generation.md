# Story 2.6: PRD Template & Content Generation

Status: drafted

## Story

As the PRD workflow,
I want to generate high-quality PRD content from templates,
So that output matches professional documentation standards.

## Acceptance Criteria

1. Load prd-template.md with proper structure
2. Generate content for each template section:
   - vision_alignment, product_magic_essence
   - success_criteria, mvp_scope, growth_features
   - functional_requirements_complete
   - performance/security/scalability requirements (if applicable)
3. Adapt content to project type (API, mobile, SaaS, etc.)
4. Include domain-specific sections if complex domain detected
5. Generate 67+ functional requirements from user input
6. Format with proper markdown, tables, code blocks
7. Save incrementally as sections complete

## Tasks / Subtasks

**⚠️ ATDD Approach: START WITH TASK 8 (Write Tests First), then proceed to Tasks 1-7 (Implementation), then Task 9 (Integration Tests)**

- [ ] Task 1: Implement PRDTemplateProcessor class structure (AC: #1)
  - [ ] Create `backend/src/core/workflows/prd-template-processor.ts` file
  - [ ] Define PRDTemplateProcessor class with TemplateProcessor integration
  - [ ] Load template from `bmad/bmm/workflows/prd/template.md`
  - [ ] Parse template sections and identify placeholders
  - [ ] Initialize section state tracking
  - [ ] Add TypeScript types and JSDoc comments
  - [ ] Handle template loading errors

- [ ] Task 2: Implement section content generation (AC: #2, #3, #4)
  - [ ] Method signature: `async generateSection(sectionName: string, context: GenerationContext): Promise<string>`
  - [ ] Generate vision_alignment section (strategic product vision)
  - [ ] Generate product_magic_essence section (unique value proposition)
  - [ ] Generate success_criteria section (measurable outcomes)
  - [ ] Generate mvp_scope section (Phase 1 features)
  - [ ] Generate growth_features section (Phase 2+ features)
  - [ ] Generate functional_requirements_complete section (67+ requirements)
  - [ ] Generate performance requirements (if applicable)
  - [ ] Generate security requirements (if applicable)
  - [ ] Generate scalability requirements (if applicable)
  - [ ] Adapt content based on project type (API, mobile, SaaS, game, etc.)
  - [ ] Add domain-specific sections for complex domains (e.g., healthcare, finance)

- [ ] Task 3: Implement functional requirements generation (AC: #5)
  - [ ] Method signature: `async generateFunctionalRequirements(context: GenerationContext): Promise<Requirement[]>`
  - [ ] Extract user requirements from product brief/user input
  - [ ] Collaborate with Mary agent for requirements analysis
  - [ ] Generate 67+ granular functional requirements (target: 70-100 requirements)
  - [ ] Ensure requirements are specific, testable, and actionable (not vague)
  - [ ] Group requirements by feature area
  - [ ] Include acceptance criteria for each requirement
  - [ ] Validate requirement quality (no "handle X" or vague statements)

- [ ] Task 4: Implement markdown formatting engine (AC: #6)
  - [ ] Method signature: `formatAsMarkdown(content: any, formatType: string): string`
  - [ ] Format sections with proper markdown headers (##, ###, ####)
  - [ ] Generate markdown tables for requirements, features, criteria
  - [ ] Format code blocks for technical specifications
  - [ ] Create bulleted lists for features, capabilities, constraints
  - [ ] Add bold/italic formatting for emphasis
  - [ ] Ensure proper line breaks and spacing
  - [ ] Validate markdown syntax

- [ ] Task 5: Implement incremental save functionality (AC: #7)
  - [ ] Method signature: `async saveSection(sectionName: string, content: string): Promise<void>`
  - [ ] Integrate with Epic 1's StateManager for atomic file writes
  - [ ] Save each section to `docs/PRD.md` as it completes
  - [ ] Append sections to existing file (don't overwrite previous sections)
  - [ ] Create `docs/` directory if it doesn't exist
  - [ ] Handle concurrent write conflicts gracefully
  - [ ] Log save operations for debugging
  - [ ] Trigger template-output event for workflow to proceed

- [ ] Task 6: Implement project type adaptation logic (AC: #3, #4)
  - [ ] Method signature: `detectProjectType(context: GenerationContext): ProjectType`
  - [ ] Detect project type from product brief (API, mobile app, SaaS, game, etc.)
  - [ ] Load type-specific template sections:
    - API: REST API specifications, endpoint definitions, authentication
    - Mobile: Platform-specific requirements (iOS/Android), UX patterns
    - SaaS: Multi-tenancy, subscription models, billing
    - Game: Gameplay mechanics, progression systems, monetization
  - [ ] Detect complex domain (healthcare, finance, education, etc.)
  - [ ] Add domain-specific sections (e.g., HIPAA compliance for healthcare)
  - [ ] Customize terminology based on domain (e.g., "patient" vs "user")

- [ ] Task 7: Integrate with Mary and John agents (AC: #2, #5)
  - [ ] Method signature: `async collaborateWithAgents(context: GenerationContext): Promise<void>`
  - [ ] Spawn Mary agent for requirements analysis (via AgentPool from Story 1.4)
  - [ ] Call Mary's `analyzeRequirements()` method
  - [ ] Spawn John agent for strategic validation (via AgentPool)
  - [ ] Call John's `defineProductVision()` and `prioritizeFeatures()` methods
  - [ ] Pass shared workflow context to both agents
  - [ ] Merge agent outputs into template sections
  - [ ] Handle agent failures gracefully (retry with exponential backoff)

- [ ] Task 8: **WRITE TESTS FIRST** - Unit tests for PRDTemplateProcessor (AC: all) - **START HERE per ATDD**
  - [ ] **CRITICAL**: Write ALL tests below BEFORE implementing any code (Tests should FAIL initially)
  - [ ] Create test file: `backend/tests/core/workflows/PRDTemplateProcessor.test.ts`
  - [ ] Set up test structure: describe blocks for each AC, beforeEach/afterEach hooks
  - [ ] Mock TemplateProcessor, AgentPool, Mary/John agents, StateManager dependencies
  - [ ] Test template loading from bmad/bmm/workflows/prd/template.md (AC #1)
  - [ ] Test section parsing and placeholder identification (AC #1)
  - [ ] Test vision_alignment section generation (AC #2)
  - [ ] Test product_magic_essence section generation (AC #2)
  - [ ] Test success_criteria section generation (AC #2)
  - [ ] Test mvp_scope section generation (AC #2)
  - [ ] Test growth_features section generation (AC #2)
  - [ ] Test functional_requirements_complete section generation (AC #2, #5)
  - [ ] Test performance/security/scalability requirements generation (AC #2)
  - [ ] Test project type adaptation (API, mobile, SaaS, game) (AC #3)
  - [ ] Test domain-specific sections (healthcare, finance) (AC #4)
  - [ ] Test functional requirements count (must be ≥67) (AC #5)
  - [ ] Test requirement quality (no vague "handle X" statements) (AC #5)
  - [ ] Test markdown formatting (headers, tables, code blocks, lists) (AC #6)
  - [ ] Test incremental saves to docs/PRD.md (AC #7)
  - [ ] Test file append behavior (don't overwrite previous sections) (AC #7)
  - [ ] Test error handling for template loading failures
  - [ ] Test error handling for agent spawn failures
  - [ ] Test error handling for file write failures
  - [ ] Run tests (should all FAIL - no implementation yet): `npm run test -- PRDTemplateProcessor.test.ts`
  - [ ] **After all tests written and failing, proceed to Task 1 to implement code**
  - [ ] Target: >80% code coverage when implementation complete

- [ ] Task 9: Integration tests with Mary, John, and workflow (AC: all)
  - [ ] Test full template processing: load → generate sections → save → validate
  - [ ] Test Mary agent collaboration for requirements (call `analyzeRequirements()`)
  - [ ] Test John agent collaboration for vision (call `defineProductVision()`)
  - [ ] Test incremental saves create valid docs/PRD.md file
  - [ ] Test project type detection and adaptation (API vs mobile vs SaaS)
  - [ ] Test domain-specific section inclusion
  - [ ] Test functional requirements count (≥67 requirements)
  - [ ] Test markdown formatting in final PRD.md output
  - [ ] Test error recovery (agent failure, file write failure)
  - [ ] Verify PRD.md is valid markdown and passes parsing

## Dev Notes

### Architecture Alignment

**PRDTemplateProcessor Location**: `backend/src/core/workflows/prd-template-processor.ts`

Per architecture.md section 2.2 and tech-spec-epic-2.md:
- PRDTemplateProcessor is a Workflow Plugin component in the Orchestrator Core
- Generates PRD content from template `bmad/bmm/workflows/prd/template.md`
- Integrates with TemplateProcessor (Epic 1, Story 1.8) for base template handling
- Uses AgentPool (Epic 1, Story 1.4) to spawn Mary and John agents
- Collaborates with MaryAgent (Story 2.3) for requirements analysis
- Collaborates with JohnAgent (Story 2.4) for strategic validation
- Uses StateManager (Epic 1, Story 1.5) for incremental saves to `docs/PRD.md`
- Called by PRDWorkflowExecutor (Story 2.5) via template-output tags
- Output validated by PRDValidator (Story 2.7) for completeness

**Template Processing Pattern** (from tech spec):
```typescript
class PRDTemplateProcessor {
  constructor(
    private templateProcessor: TemplateProcessor,
    private agentPool: AgentPool,
    private stateManager: StateManager
  ) {}

  async generateContent(context: GenerationContext): Promise<void> {
    // 1. Load template
    const template = await this.loadTemplate('bmad/bmm/workflows/prd/template.md');

    // 2. Detect project type and domain
    const projectType = this.detectProjectType(context);
    const domain = this.detectDomain(context);

    // 3. Generate sections sequentially
    for (const section of template.sections) {
      const content = await this.generateSection(section.name, context);
      await this.saveSection(section.name, content);
    }

    // 4. Validate completeness (delegated to PRDValidator in Story 2.7)
  }

  async generateSection(sectionName: string, context: GenerationContext): Promise<string> {
    // Collaborate with Mary/John as needed
    const mary = await this.agentPool.get('mary');
    const john = await this.agentPool.get('john');

    switch (sectionName) {
      case 'vision_alignment':
        return await john.defineProductVision(context);
      case 'functional_requirements_complete':
        const requirements = await mary.analyzeRequirements(context);
        return this.formatRequirements(requirements); // Must generate ≥67 requirements
      // ... other sections
    }
  }

  async saveSection(sectionName: string, content: string): Promise<void> {
    // Append to docs/PRD.md using StateManager
    await this.stateManager.appendToFile('docs/PRD.md', `## ${sectionName}\n\n${content}\n\n`);
  }
}
```

**Project Type Adaptation** (AC #3):
```typescript
enum ProjectType {
  API = 'api',
  Mobile = 'mobile',
  SaaS = 'saas',
  Game = 'game',
  Desktop = 'desktop',
  EmbeddedSystem = 'embedded'
}

interface TypeSpecificSections {
  API: ['rest_api_specification', 'authentication', 'rate_limiting'];
  Mobile: ['platform_requirements', 'ux_patterns', 'offline_support'];
  SaaS: ['multi_tenancy', 'subscription_models', 'billing_integration'];
  Game: ['gameplay_mechanics', 'progression_systems', 'monetization'];
}
```

**Functional Requirements Generation** (AC #5):
- Target: 67+ granular functional requirements (actual target: 70-100 requirements)
- Source: User input, product brief, Mary agent analysis
- Quality: Specific, testable, actionable (no "handle X" or vague statements)
- Format:
  - FR-XXX: Requirement statement
  - Acceptance Criteria: Testable conditions
  - Priority: Must-have, should-have, nice-to-have
- Example:
  ```markdown
  ### Functional Requirements

  | ID | Requirement | Acceptance Criteria | Priority |
  |----|-------------|-------------------|----------|
  | FR-001 | System shall authenticate users via JWT | User can login with email/password and receive valid JWT token | Must-have |
  | FR-002 | System shall support password reset flow | User can request reset email, click link, set new password | Must-have |
  ```

### Learnings from Previous Story

**From Story 2.5: PRD Workflow Executor (Status: done)**

- **New Files Created**: Use PRDWorkflowExecutor for workflow orchestration:
  - `backend/src/core/workflows/prd-workflow-executor.ts` (907 lines) - PRDWorkflowExecutor class with 7 core methods
  - `backend/tests/core/workflows/PRDWorkflowExecutor.test.ts` (1076 lines) - Unit test patterns to follow
  - `backend/tests/integration/prd-workflow.test.ts` (168 lines) - Integration test patterns
  - `backend/src/cli/commands/run-prd-workflow.ts` (125 lines) - CLI integration pattern

- **Architectural Patterns Established**:
  - Workflow executors location: `backend/src/core/workflows/` (confirmed pattern)
  - Dependency injection pattern: Pass AgentPool, StateManager, DecisionEngine as constructor params
  - Sequential step execution with state tracking
  - Incremental PRD.md generation (append sections as workflow progresses)
  - Template-output processing triggers saves
  - Timeout protection: 30-minute default with configurable override
  - Comprehensive TypeScript interfaces for all data structures

- **Integration Patterns from Story 2.5**:
  - PRDWorkflowExecutor.execute() orchestrates entire PRD workflow
  - PRDWorkflowExecutor.processTemplateOutput() calls template processor for content generation
  - Template processor saves sections incrementally via StateManager
  - PRDWorkflowExecutor uses AgentPool to spawn/cleanup Mary and John agents
  - Shared workflow context passed between agents for coherent output
  - DecisionEngine integration for autonomous decisions (confidence >= 0.75)
  - EscalationQueue integration for low-confidence decisions (confidence < 0.75)

- **Testing Approach from Story 2.5**:
  - ATDD: Task 8 first (write ALL tests), then Tasks 1-7 (implementation)
  - 38 unit tests + 8 integration tests created
  - Target >80% coverage for workflow components
  - Performance tests: Workflow completes <30 minutes
  - Integration tests verify Mary ↔ John collaboration

- **Key Takeaways for Story 2.6**:
  - Follow ATDD approach (Task 8 first, write all tests before implementation)
  - PRDTemplateProcessor location: `backend/src/core/workflows/prd-template-processor.ts`
  - Extend/integrate with TemplateProcessor from Epic 1, Story 1.8
  - Use AgentPool (Story 1.4) to access Mary (Story 2.3) and John (Story 2.4) agents
  - Generate ≥67 functional requirements (use Mary's `analyzeRequirements()`)
  - Save incrementally to `docs/PRD.md` via StateManager (Story 1.5)
  - Adapt content based on project type (API/mobile/SaaS/game)
  - Add domain-specific sections for complex domains (healthcare, finance, education)
  - Format with proper markdown (tables, code blocks, headers)
  - Reuse test patterns from Story 2.5 (PRDWorkflowExecutor.test.ts)
  - This story enables PRD content generation, completing PRD workflow automation for Epic 2

[Source: stories/2-5-prd-workflow-executor.md#Dev-Agent-Record]
[Source: stories/2-5-prd-workflow-executor.md#Senior-Developer-Review-AI]

### Project Structure Notes

**New File to Create**:
- `backend/src/core/workflows/prd-template-processor.ts` - PRDTemplateProcessor class implementation

**Files to Reference**:
- `bmad/bmm/workflows/prd/template.md` - PRD template to load (create if not exists)
- `backend/src/core/TemplateProcessor.ts` - Base TemplateProcessor class (Story 1.8)
- `backend/src/core/AgentPool.ts` - AgentPool for agent spawning (Story 1.4)
- `backend/src/core/StateManager.ts` - StateManager for incremental saves (Story 1.5)
- `backend/src/core/agents/mary-agent.ts` - MaryAgent for requirements analysis (Story 2.3)
- `backend/src/core/agents/john-agent.ts` - JohnAgent for strategic validation (Story 2.4)
- `backend/src/core/workflows/prd-workflow-executor.ts` - PRDWorkflowExecutor calls this (Story 2.5)

**Test Files to Create**:
- `backend/tests/core/workflows/PRDTemplateProcessor.test.ts` - Unit tests (>80% coverage target)
- Update `backend/tests/integration/prd-workflow.test.ts` - Integration tests (add template processor tests)

**Output Files Generated**:
- `docs/PRD.md` - Generated PRD document with all sections (incremental appends)

**PRDTemplateProcessor Interface**:
```typescript
interface PRDTemplateProcessor {
  loadTemplate(templatePath: string): Promise<Template>;
  detectProjectType(context: GenerationContext): ProjectType;
  detectDomain(context: GenerationContext): string | null;
  generateSection(sectionName: string, context: GenerationContext): Promise<string>;
  generateFunctionalRequirements(context: GenerationContext): Promise<Requirement[]>;
  formatAsMarkdown(content: any, formatType: string): string;
  saveSection(sectionName: string, content: string): Promise<void>;
  collaborateWithAgents(context: GenerationContext): Promise<void>;
}

interface GenerationContext {
  productBrief: string;
  userInput: string;
  projectType?: ProjectType;
  domain?: string;
  maryAgent?: MaryAgent;
  johnAgent?: JohnAgent;
}

interface Template {
  sections: Array<{
    name: string;
    placeholders: string[];
    required: boolean;
  }>;
}

interface Requirement {
  id: string; // e.g., "FR-001"
  statement: string; // Specific, testable requirement
  acceptanceCriteria: string[];
  priority: 'must-have' | 'should-have' | 'nice-to-have';
}
```

### References

- [Tech Spec - Story 2.6 AC](docs/tech-spec-epic-2.md#Story-26-PRD-Template-Content-Generation) - Lines 897-903
- [Tech Spec - Template Processing Pattern](docs/tech-spec-epic-2.md#Architecture-Patterns) - Lines 192-248
- [Architecture - Workflow Plugins](docs/architecture.md#11-High-Level-Architecture) - Lines 75-84
- [Epics - Story 2.6](docs/epics.md#Story-26-PRD-Template-Content-Generation) - Lines 544-564
- [Story 1.8 - Template Processor](stories/1-8-template-processing-system.md) - Base TemplateProcessor class
- [Story 1.4 - Agent Pool](stories/1-4-agent-pool-lifecycle-management.md) - Agent spawning and lifecycle
- [Story 1.5 - State Manager](stories/1-5-state-manager-file-persistence.md) - Incremental file saves
- [Story 2.3 - Mary Agent](stories/2-3-mary-agent-business-analyst-persona.md) - Requirements analysis
- [Story 2.4 - John Agent](stories/2-4-john-agent-product-manager-persona.md) - Strategic validation
- [Story 2.5 - PRD Workflow Executor](stories/2-5-prd-workflow-executor.md) - Workflow orchestration
- [PRD Template](bmad/bmm/workflows/prd/template.md) - Template to load (create if not exists)

### Development Approach (ATDD)

**This story follows Acceptance Test-Driven Development (ATDD):**

1. **Write Tests First** (Red Phase)
   - Start with Task 8 (Unit tests) before implementing code
   - Write failing tests for each acceptance criterion
   - Create test file: `backend/tests/core/workflows/PRDTemplateProcessor.test.ts`
   - Organize tests by AC (one describe block per AC)
   - All tests should fail initially (no implementation yet)

2. **Implement Minimum Code** (Green Phase)
   - Create `backend/src/core/workflows/prd-template-processor.ts`
   - Implement just enough code to make tests pass
   - Follow Tasks 1-7 in order
   - Run tests frequently: `npm run test:watch`
   - Ensure each AC's tests pass before moving to next AC

3. **Refactor** (Refactor Phase)
   - Clean up code while keeping tests green
   - Extract duplicate logic, improve naming
   - Maintain >80% coverage: `npm run test:coverage`

4. **Integration Tests** (Task 9)
   - Write integration tests after unit tests pass
   - Test full template processing with Mary + John agents
   - Update `backend/tests/integration/prd-workflow.test.ts`

**Test-First Workflow:**
```bash
# 1. Write tests (should fail)
npm run test -- PRDTemplateProcessor.test.ts

# 2. Implement code (make tests pass)
npm run test:watch

# 3. Check coverage (target >80%)
npm run test:coverage

# 4. Refactor and verify tests still pass
npm run test
```

**Benefits of ATDD for this story:**
- Ensures all 7 ACs are testable and verified
- Catches integration issues with Mary, John, and TemplateProcessor early
- Validates template parsing and content generation
- Confirms functional requirements count (≥67 requirements)
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

# 5. Check coverage (>80% for PRDTemplateProcessor)
npm run test:coverage
```

**Code Quality Standards:**
- **TypeScript**: Strict mode enabled, no `any` types (use `unknown` if needed)
- **ESLint**: Follow project rules, disable rules only with justification comments
- **Naming**:
  - Classes: PascalCase (e.g., `PRDTemplateProcessor`)
  - Methods: camelCase (e.g., `generateSection`)
  - Interfaces: PascalCase (e.g., `GenerationContext`)
  - Files: kebab-case (e.g., `prd-template-processor.ts`)
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
- [ ] Code follows existing patterns from Story 1.8 (TemplateProcessor) and Story 2.5 (PRDWorkflowExecutor)
- [ ] Functional requirements count ≥67
- [ ] Markdown formatting validated

**Git Commit Message Format:**
```
Story 2.6: Brief description of changes

- Bullet point of what was implemented
- Reference AC numbers (e.g., AC #1, #2)
- Note any architectural decisions
- Mention test coverage achieved
- Note functional requirements count
```

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
