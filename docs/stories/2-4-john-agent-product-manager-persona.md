# Story 2.4: John Agent - Product Manager Persona

Status: drafted

## Story

As the orchestrator core,
I want a John agent that provides strategic product guidance,
So that PRD workflows benefit from PM-level thinking.

## Acceptance Criteria

1. Load John persona from bmad/bmm/agents/pm.md
2. Configure with project-assigned LLM from `.bmad/project-config.yaml` agent_assignments:
   - Supports any provider: Anthropic (Claude), OpenAI (GPT/Codex), Zhipu (GLM), Google (Gemini)
   - Recommended: Claude Sonnet for strategic reasoning and product decisions
   - See Story 1.3 for configuration examples with multiple providers
3. Specialized prompts for: product strategy, prioritization, roadmap planning
4. Methods: defineProductVision(), prioritizeFeatures(), assessMarketFit()
5. Validate Mary's requirements for business viability
6. Challenge scope creep and unrealistic timelines
7. Generate executive summaries and success metrics
8. Collaborate with Mary through shared workflow context

## Tasks / Subtasks

**⚠️ ATDD Approach: START WITH TASK 8 (Write Tests First), then proceed to Tasks 1-7 (Implementation), then Task 9 (Integration Tests)**

- [ ] Task 1: Implement JohnAgent class structure (AC: #1, #2)
  - [ ] Create `backend/src/agents/john-agent.ts` file
  - [ ] Define JohnAgent class extending base Agent class (from Epic 1, Story 1.4)
  - [ ] Load persona from `bmad/bmm/agents/pm.md` (name: "John", role: "Product Manager")
  - [ ] Configure with LLM from project config agent_assignments section
  - [ ] Support multi-provider LLM assignment (Anthropic, OpenAI, Zhipu, Google)
  - [ ] Add TypeScript types and JSDoc comments
  - [ ] Set recommended temperature: 0.5 for balanced strategy/creativity

- [ ] Task 2: Implement specialized prompts for product management (AC: #3)
  - [ ] Create prompt templates directory: `backend/src/agents/prompts/john/`
  - [ ] Define productStrategyPrompt: strategic product thinking, market positioning
  - [ ] Define prioritizationPrompt: feature prioritization frameworks (RICE, MoSCoW)
  - [ ] Define roadmapPrompt: roadmap planning, milestone sequencing
  - [ ] Store prompts as reusable template strings
  - [ ] Include context placeholders for PRD, user input, market data

- [ ] Task 3: Implement defineProductVision() method (AC: #4)
  - [ ] Method signature: `async defineProductVision(context: ProductContext): Promise<ProductVision>`
  - [ ] Input: ProductContext (user requirements, market data, competitive analysis)
  - [ ] Process: Use LLM with productStrategyPrompt to synthesize vision
  - [ ] Output: ProductVision (vision statement, target users, value proposition, differentiation)
  - [ ] Include confidence scoring for vision clarity
  - [ ] Generate supporting rationale for vision decisions

- [ ] Task 4: Implement prioritizeFeatures() method (AC: #4)
  - [ ] Method signature: `async prioritizeFeatures(features: Feature[], context: PrioritizationContext): Promise<PrioritizedFeatures>`
  - [ ] Input: Feature list from Mary's requirements, business constraints
  - [ ] Process: Apply prioritization framework (RICE or MoSCoW) via LLM
  - [ ] Output: Ranked feature list with scores and rationale
  - [ ] Identify MVP-critical vs growth features
  - [ ] Flag scope creep risks (AC #6)

- [ ] Task 5: Implement assessMarketFit() method (AC: #4)
  - [ ] Method signature: `async assessMarketFit(requirements: Requirements, marketData: MarketData): Promise<MarketFitAssessment>`
  - [ ] Input: Requirements from Mary, market/competitive data
  - [ ] Process: Analyze product-market fit using LLM reasoning
  - [ ] Output: MarketFitAssessment (score, risks, opportunities, recommendations)
  - [ ] Identify business viability concerns (AC #5)
  - [ ] Generate market positioning recommendations

- [ ] Task 6: Implement validateRequirementsViability() method (AC: #5, #6)
  - [ ] Method signature: `async validateRequirementsViability(requirements: Requirements): Promise<ValidationResult>`
  - [ ] Input: Mary's requirements from PRD workflow context
  - [ ] Check for: scope creep indicators, unrealistic timelines, resource constraints
  - [ ] Use LLM to identify business viability red flags
  - [ ] Output: ValidationResult (pass/fail, concerns, recommendations)
  - [ ] Challenge requirements constructively with evidence

- [ ] Task 7: Implement generateExecutiveSummary() method (AC: #7)
  - [ ] Method signature: `async generateExecutiveSummary(prdContent: PRDContent): Promise<ExecutiveSummary>`
  - [ ] Input: Full PRD content (vision, requirements, features)
  - [ ] Process: Synthesize key points for executive audience
  - [ ] Output: ExecutiveSummary (1-2 paragraphs, key metrics, success criteria)
  - [ ] Include business impact and ROI indicators
  - [ ] Use clear, non-technical language

- [ ] Task 8: **WRITE TESTS FIRST** - Unit tests for JohnAgent (AC: all) - **START HERE per ATDD**
  - [ ] **CRITICAL**: Write ALL tests below BEFORE implementing any code (Tests should FAIL initially)
  - [ ] Create test file: `backend/tests/agents/JohnAgent.test.ts`
  - [ ] Set up test structure: describe blocks for each AC, beforeEach/afterEach hooks
  - [ ] Mock LLMFactory and AgentPool dependencies
  - [ ] Test persona loading from bmad/bmm/agents/pm.md
  - [ ] Test LLM configuration from project config (all providers)
  - [ ] Test defineProductVision() returns valid ProductVision
  - [ ] Test prioritizeFeatures() ranks features correctly
  - [ ] Test assessMarketFit() returns MarketFitAssessment
  - [ ] Test validateRequirementsViability() identifies scope creep
  - [ ] Test validateRequirementsViability() flags unrealistic timelines
  - [ ] Test generateExecutiveSummary() creates concise summary
  - [ ] Test collaboration with Mary via shared workflow context
  - [ ] Run tests (should all FAIL - no implementation yet): `npm run test -- JohnAgent.test.ts`
  - [ ] **After all tests written and failing, proceed to Task 1 to implement code**
  - [ ] Target: >90% code coverage when implementation complete

- [ ] Task 9: Integration tests with Mary and PRD workflow (AC: #5, #8)
  - [ ] Test Mary → John collaboration flow (shared workflow context)
  - [ ] Test John validates Mary's requirements for viability
  - [ ] Test John challenges scope creep in requirements
  - [ ] Test John identifies unrealistic timelines
  - [ ] Test John generates executive summary from PRD
  - [ ] Test multi-provider LLM assignment (Anthropic, OpenAI, Zhipu)
  - [ ] Verify confidence scoring in decision-making
  - [ ] Test error handling for invalid context or missing data

- [ ] Task 10: Create JohnAgent integration with AgentPool (AC: #8)
  - [ ] Register JohnAgent in AgentPool factory (Story 1.4)
  - [ ] Test spawning John agent with configured LLM
  - [ ] Verify John can access workflow context (shared with Mary)
  - [ ] Test John's methods callable from workflow steps
  - [ ] Verify proper agent lifecycle (create, execute, destroy)

## Dev Notes

### Architecture Alignment

**JohnAgent Location**: `backend/src/agents/john-agent.ts`

Per architecture.md section 2.3.2:
- JohnAgent is a Product Manager persona in the Agent Layer
- Provides strategic product guidance for PRD workflows
- Integrates with AgentPool (Epic 1, Story 1.4) for lifecycle management
- Uses LLMFactory (Epic 1, Story 1.3) for multi-provider LLM support
- Collaborates with MaryAgent (Story 2.3) through shared workflow context
- Persona loaded from bmad/bmm/agents/pm.md (already exists as "John")

**Agent Architecture Pattern** (from architecture.md lines 320-350):
```typescript
class JohnAgent extends Agent {
  constructor(llmClient: LLMClient, context: AgentContext) {
    super("John", "Product Manager", llmClient, context);
    this.loadPersona("bmad/bmm/agents/pm.md");
  }

  async defineProductVision(context: ProductContext): Promise<ProductVision>;
  async prioritizeFeatures(features: Feature[], context: PrioritizationContext): Promise<PrioritizedFeatures>;
  async assessMarketFit(requirements: Requirements, marketData: MarketData): Promise<MarketFitAssessment>;
  async validateRequirementsViability(requirements: Requirements): Promise<ValidationResult>;
  async generateExecutiveSummary(prdContent: PRDContent): Promise<ExecutiveSummary>;
}
```

**Collaboration Pattern** (from tech spec lines 770-774):
- John receives Mary's requirements via shared workflow context
- John validates requirements for business viability (AC #5)
- John challenges scope creep and unrealistic timelines (AC #6)
- John generates executive summaries and success metrics (AC #7)
- Workflow passes Mary's output as input to John's methods

**LLM Configuration** (from Story 1.3 and AC #2):
```yaml
# Example .bmad/project-config.yaml
agent_assignments:
  john:
    model: "claude-sonnet-4-5"
    provider: "anthropic"
    temperature: 0.5
  # Alternative providers:
  # model: "gpt-4-turbo" / provider: "openai"
  # model: "GLM-4.6" / provider: "zhipu"
  # model: "gemini-1.5-pro" / provider: "google"
```

**Specialized Prompts** (AC #3):
- Product Strategy: Vision definition, market positioning, value proposition
- Prioritization: RICE/MoSCoW frameworks, MVP vs growth feature classification
- Roadmap Planning: Milestone sequencing, timeline validation, dependency mapping

### Learnings from Previous Story

**From Story 2.2: Escalation Queue System (Status: done)**

- **File Structure Pattern**: Services go in `backend/src/core/services/`, Agents go in `backend/src/agents/`
  - JohnAgent should be at `backend/src/agents/john-agent.ts`
  - Follow consistent naming: kebab-case files, PascalCase classes

- **Testing Patterns**: ATDD approach works well
  - Start with Task 8 (write ALL tests first)
  - All tests should fail initially (no implementation)
  - Implement code to make tests pass
  - Target >90% coverage for core agents
  - Use vitest with established patterns from Epic 1

- **Dependencies Available**:
  - LLMFactory (Story 1.3) for multi-provider LLM support
  - AgentPool (Story 1.4) for agent lifecycle management
  - DecisionEngine (Story 2.1) for confidence scoring in decisions
  - EscalationQueue (Story 2.2) for escalating low-confidence decisions
  - All dependencies upgraded in Story 2.0 (uuid v13 ESM, etc.)

- **Integration Patterns**:
  - Agents integrate with AgentPool via factory registration
  - Persona loaded from markdown files in bmad/bmm/agents/
  - LLM configured via project config agent_assignments section
  - Workflow context shared between agents (Mary ↔ John collaboration)

- **Key Architectural Decisions**:
  - Base Agent class pattern established in Story 1.4
  - Agent methods return typed interfaces (ProductVision, MarketFitAssessment, etc.)
  - Confidence scoring applied to strategic decisions
  - Temperature 0.5 recommended for John (balanced strategy/creativity)

- **Quality Standards**:
  - TypeScript strict mode, no `any` types
  - JSDoc comments on all public methods
  - Explicit return types
  - Error handling with clear messages
  - ESLint must pass with no warnings

**Key Takeaways for Story 2.4**:
- Follow agent architecture pattern from Story 1.4 (AgentPool, base Agent class)
- Use ATDD approach (write tests first in Task 8)
- Integrate with Mary via shared workflow context
- Apply confidence scoring to product decisions
- Use LLMFactory for multi-provider support
- Test collaboration with Mary and PRD workflow in Task 9

[Source: stories/2-2-escalation-queue-system.md#Dev-Agent-Record]

### Project Structure Notes

**New File to Create**:
- `backend/src/agents/john-agent.ts` - JohnAgent class implementation

**New Directory to Create**:
- `backend/src/agents/prompts/john/` - John's specialized prompts (optional, can inline in class)

**Files to Reference**:
- `bmad/bmm/agents/pm.md` - John persona definition (already exists)
- `backend/src/core/AgentPool.ts` - AgentPool for registration (Story 1.4)
- `backend/src/core/LLMFactory.ts` - LLMFactory for multi-provider support (Story 1.3)
- `backend/src/core/services/decision-engine.ts` - DecisionEngine integration (Story 2.1)
- `backend/src/agents/mary-agent.ts` - MaryAgent for collaboration pattern (Story 2.3)

**Test Files to Create**:
- `backend/tests/agents/JohnAgent.test.ts` - Unit tests (>90% coverage target)
- `backend/tests/integration/john-mary-collaboration.test.ts` - Integration tests with Mary

**Agent Methods Interface**:
```typescript
interface JohnAgent extends Agent {
  defineProductVision(context: ProductContext): Promise<ProductVision>;
  prioritizeFeatures(features: Feature[], context: PrioritizationContext): Promise<PrioritizedFeatures>;
  assessMarketFit(requirements: Requirements, marketData: MarketData): Promise<MarketFitAssessment>;
  validateRequirementsViability(requirements: Requirements): Promise<ValidationResult>;
  generateExecutiveSummary(prdContent: PRDContent): Promise<ExecutiveSummary>;
}
```

### References

- [Tech Spec - Story 2.4 AC](docs/tech-spec-epic-2.md#Story-24-John-Agent---Product-Manager-Persona) - Lines 762-774
- [Tech Spec - Agent Persona Schema](docs/tech-spec-epic-2.md#Data-Models-and-Contracts) - Lines 141-154
- [Architecture - Agent Layer](docs/architecture.md#22-Agent-Layer) - Lines 320-380
- [Epics - Story 2.4](docs/epics.md#Story-24-John-Agent---Product-Manager-Persona) - Lines 499-519
- [Story 1.3 - LLM Factory](stories/1-3-llm-factory-pattern-implementation.md) - Multi-provider LLM configuration
- [Story 1.4 - Agent Pool](stories/1-4-agent-pool-lifecycle-management.md) - Agent lifecycle and registration
- [Story 2.1 - Decision Engine](stories/2-1-confidence-based-decision-engine.md) - Confidence scoring pattern
- [Story 2.2 - Escalation Queue](stories/2-2-escalation-queue-system.md) - Learnings and patterns
- [Story 2.3 - Mary Agent](stories/2-3-mary-agent-business-analyst-persona.md) - Collaboration pattern (to be created)
- [Agent Persona File](bmad/bmm/agents/pm.md) - John's persona definition

### Development Approach (ATDD)

**This story follows Acceptance Test-Driven Development (ATDD):**

1. **Write Tests First** (Red Phase)
   - Start with Task 8 (Unit tests) before implementing code
   - Write failing tests for each acceptance criterion
   - Create test file: `backend/tests/agents/JohnAgent.test.ts`
   - Organize tests by AC (one describe block per AC)
   - All tests should fail initially (no implementation yet)

2. **Implement Minimum Code** (Green Phase)
   - Create `backend/src/agents/john-agent.ts`
   - Implement just enough code to make tests pass
   - Follow Tasks 1-7 in order
   - Run tests frequently: `npm run test:watch`
   - Ensure each AC's tests pass before moving to next AC

3. **Refactor** (Refactor Phase)
   - Clean up code while keeping tests green
   - Extract duplicate logic, improve naming
   - Ensure performance targets met
   - Maintain >90% coverage: `npm run test:coverage`

4. **Integration Tests** (Task 9, 10)
   - Write integration tests after unit tests pass
   - Test John ↔ Mary collaboration flow
   - Test JohnAgent integration with AgentPool
   - Create `backend/tests/integration/john-mary-collaboration.test.ts`

**Test-First Workflow:**
```bash
# 1. Write tests (should fail)
npm run test -- JohnAgent.test.ts

# 2. Implement code (make tests pass)
npm run test:watch

# 3. Check coverage (target >90%)
npm run test:coverage

# 4. Refactor and verify tests still pass
npm run test
```

**Benefits of ATDD for this story:**
- Ensures all 8 ACs are testable and verified
- Catches integration issues with Mary early
- Validates collaboration pattern with shared workflow context
- Confirms LLM configuration works across providers
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

# 5. Check coverage (>90% for JohnAgent)
npm run test:coverage
```

**Code Quality Standards:**
- **TypeScript**: Strict mode enabled, no `any` types (use `unknown` if needed)
- **ESLint**: Follow project rules, disable rules only with justification comments
- **Naming**:
  - Classes: PascalCase (e.g., `JohnAgent`)
  - Methods: camelCase (e.g., `defineProductVision`)
  - Interfaces: PascalCase (e.g., `ProductVision`)
  - Files: kebab-case (e.g., `john-agent.ts`)
- **Comments**: JSDoc for public methods, inline comments for complex logic
- **Imports**: ESM syntax (`import`/`export`), explicit `.js` extensions in imports
- **Error Handling**: Try-catch blocks with specific error types, helpful error messages

**Pre-commit Checklist:**
- [ ] All tests passing (unit + integration)
- [ ] Coverage >90% for new code
- [ ] TypeScript type-check passes
- [ ] ESLint passes with no warnings
- [ ] No console.log (except intentional logging)
- [ ] JSDoc comments on all public methods
- [ ] Code follows existing patterns from Story 1.4 (AgentPool) and Story 2.3 (MaryAgent)

**Git Commit Message Format:**
```
Story 2.4: Brief description of changes

- Bullet point of what was implemented
- Reference AC numbers (e.g., AC #1, #2)
- Note any architectural decisions
- Mention test coverage achieved
```

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- Agent model name and version will be added during implementation -->

### Debug Log References

### Completion Notes List

### File List
