# Epic Technical Specification: Story Implementation Automation

Date: 2025-11-13
Author: Chris
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 implements the Story Implementation Automation phase, enabling autonomous code development where AI agents (Amelia as Developer and Alex as Code Reviewer) implement stories with code, comprehensive tests, and thorough independent code review, creating PRs automatically. This epic represents the "parallel intelligence" magic moment where stories develop autonomously with quality code, unbiased review from a separate agent, and clear PRs ready for integration.

The system employs a **foundation-first architecture** that enables parallel development through git worktrees, achieving a 1.67x speedup over sequential implementation (6 story-units vs 10 story-units). The dual-agent review architecture ensures higher code quality through Amelia's self-review combined with Alex's independent security, quality, and test coverage validation.

This epic transforms the orchestrator from a planning system (Epics 1-4) into a fully autonomous implementation engine, completing the end-to-end software development lifecycle automation.

## Objectives and Scope

**In Scope:**
- Core agent infrastructure for both Amelia (Developer) and Alex (Code Reviewer) personas
- Story context generation with comprehensive context assembly (<50k tokens)
- Workflow orchestration and state management for complete story development pipeline
- Code implementation pipeline following architecture and coding standards
- Test generation and execution with >80% code coverage
- Dual-agent code review (Amelia self-review + Alex independent review)
- PR creation and automation with CI monitoring and auto-merge capability
- Integration tests for complete workflow validation
- End-to-end tests for real-world story execution scenarios

**Out of Scope:**
- Manual code reviews by human developers (automated via agents)
- Story decomposition (Epic 4 - Solutioning Phase)
- PRD and Architecture generation (Epics 2-3)
- Dashboard UI for monitoring (Epic 6)
- Learning from implementation patterns (post-MVP)
- Multi-language code generation beyond TypeScript/JavaScript (post-MVP)
- Custom test frameworks per story type (post-MVP)

## System Architecture Alignment

This epic extends the **Microkernel Architecture** established in Epic 1 by adding story implementation workflow plugins. Key architectural alignments:

**Core Kernel Extensions:**
- Leverages `WorkflowEngine` for story development workflow execution (dev-story workflow)
- Utilizes `AgentPool` and `LLMFactory` for Amelia and Alex agent instantiation with optimal LLM assignment
- Employs `StateManager` for workflow state persistence tracking story status transitions
- Uses `WorktreeManager` for isolated story development in parallel worktrees
- Integrates with `TemplateProcessor` for PR description generation

**Workflow Plugin Pattern:**
- Story development workflows are self-contained plugins: `bmad/bmm/workflows/dev-story/`
- Includes: `workflow.yaml`, `instructions.md`, `template.md` (PR template)
- Invoked by orchestrator core with story context as input

**Data Flow:**
- Inputs: `docs/stories/story-*.md` (from Epic 4), `docs/architecture.md` (Epic 3), `docs/PRD.md` (Epic 2)
- Processing: Story context generation → Worktree creation → Amelia implementation → Test generation → Dual-agent review → PR creation → CI monitoring → Auto-merge
- Outputs: Implemented code (src/*), tests (test/*), PR (GitHub), updated `docs/sprint-status.yaml`

**Component Interactions:**
- Story workflow invokes Amelia agent via `AgentPool.createAgent("amelia", llmModel, context)`
- Story workflow invokes Alex agent via `AgentPool.createAgent("alex", llmModel, context)`
- Amelia and Alex use different LLMs for diverse perspectives (e.g., Amelia on GPT-4 Turbo for code gen, Alex on Claude Sonnet for analytical review)
- State checkpointing after each major step (context generation, implementation, testing, review, PR creation)
- Event emission for real-time monitoring: `story.started`, `code.implemented`, `tests.generated`, `review.completed`, `pr.created`, `story.completed`

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **AmeliaAgentInfrastructure** | Load Amelia persona; Configure LLM assignment; Provide methods: implementStory(), writeTests(), reviewCode() | Story context, architecture, coding standards | Implemented code, tests, self-review report | Story 5.1 |
| **AlexAgentInfrastructure** | Load Alex persona; Configure LLM assignment (different from Amelia); Provide methods: reviewSecurity(), analyzeQuality(), validateTests(), generateReport() | Story context, Amelia's code, test results, standards | Independent review report with pass/fail | Story 5.1 |
| **StoryContextGenerator** | Build comprehensive story context from story file, PRD, architecture, onboarding docs, existing code; Token optimization (<50k) | Story file path, PRD, Architecture, Onboarding | Story Context XML document | Story 5.2 |
| **WorkflowOrchestrator** | Execute dev-story workflow steps in sequence; Coordinate Amelia and Alex agents; Manage worktree lifecycle; Track state transitions | Story file, workflow.yaml | Completed story with PR | Story 5.3 |
| **StateManager** | Track story status transitions (backlog → drafted → ready-for-dev → in-progress → review → done); Persist agent state | Story status, agent activity | Updated sprint-status.yaml | Story 5.3 |
| **CodeImplementationPipeline** | Execute Amelia's code implementation; Follow architecture and standards; Create/modify files; Add error handling and logging | Story Context XML | Implemented code with git commit | Story 5.4 |
| **TestGenerationExecutor** | Generate unit and integration tests; Execute tests; Achieve >80% coverage; Fix failing tests | Implemented code, story context | Test files, test results, coverage report | Story 5.5 |
| **DualAgentCodeReviewer** | Coordinate Amelia self-review and Alex independent review; Aggregate findings; Make pass/fail decisions | Implemented code, tests, story context | Combined review report, pass/fail decision | Story 5.6 |
| **PRCreationAutomator** | Create GitHub PR with @octokit/rest; Monitor CI status; Auto-merge if checks pass; Cleanup worktree | Worktree branch, review report, story data | GitHub PR URL, merge status | Story 5.7 |
| **StoryWorkflowIntegrationTests** | Test complete workflow execution; Test agent interactions; Test error recovery | Workflow components, mock data | Test results, coverage report | Story 5.8 |
| **StoryWorkflowE2ETests** | Test real-world story scenarios; Test parallel execution; Performance benchmarks | Complete workflow, test stories | E2E test results, performance metrics | Story 5.9 |

### Data Models and Contracts

**Core Type Definitions** (`src/implementation/types.ts`):

```typescript
interface AmeliaAgent extends Agent {
  name: 'amelia';
  role: 'Developer';
  expertise: [
    'code-implementation',
    'test-generation',
    'debugging',
    'refactoring',
    'documentation'
  ];
  llm: {
    model: string; // From .bmad/project-config.yaml agent_assignments
    provider: string; // 'anthropic' | 'openai' | 'zhipu' | 'google'
    temperature: number; // 0.4 for balanced creativity/precision
  };
  methods: {
    implementStory(context: StoryContext): Promise<CodeImplementation>;
    writeTests(code: CodeImplementation): Promise<TestSuite>;
    reviewCode(code: CodeImplementation): Promise<SelfReviewReport>;
  };
}

interface AlexAgent extends Agent {
  name: 'alex';
  role: 'Code Reviewer';
  expertise: [
    'security-review',
    'code-quality-analysis',
    'test-coverage-validation',
    'architecture-compliance',
    'performance-analysis'
  ];
  llm: {
    model: string; // Different from Amelia for diverse perspective
    provider: string; // 'anthropic' | 'openai' | 'zhipu' | 'google'
    temperature: number; // 0.3 for precise analytical review
  };
  methods: {
    reviewSecurity(code: CodeImplementation): Promise<SecurityReview>;
    analyzeQuality(code: CodeImplementation): Promise<QualityAnalysis>;
    validateTests(tests: TestSuite, coverage: CoverageReport): Promise<TestValidation>;
    generateReport(reviews: Review[]): Promise<IndependentReviewReport>;
  };
}

interface StoryContext {
  story: {
    id: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    technicalNotes: TechnicalNotes;
    dependencies: string[];
  };
  prdContext: string; // Relevant PRD sections (<10k tokens)
  architectureContext: string; // Relevant architecture sections (<15k tokens)
  onboardingDocs: string; // Coding standards, patterns (<10k tokens)
  existingCode: {
    file: string;
    content: string;
    relevance: string;
  }[]; // Existing code files mentioned in story (<15k tokens)
  dependencyContext?: string; // Context from prerequisite stories
  totalTokens: number; // <50k target
}

interface CodeImplementation {
  files: {
    path: string; // src/components/Foo.ts
    content: string; // Full file content
    operation: 'create' | 'modify' | 'delete';
  }[];
  commitMessage: string;
  implementationNotes: string;
  acceptanceCriteriaMapping: {
    criterion: string; // AC text
    implemented: boolean;
    evidence: string; // File/function that implements it
  }[];
}

interface TestSuite {
  files: {
    path: string; // test/components/Foo.test.ts
    content: string;
  }[];
  framework: string; // 'vitest' | 'jest' | 'mocha'
  testCount: number;
  coverage: CoverageReport;
  results: TestResults;
}

interface CoverageReport {
  lines: number; // Percentage
  functions: number;
  branches: number;
  statements: number;
  uncoveredLines: string[]; // File:line references
}

interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // milliseconds
  failures?: {
    test: string;
    error: string;
  }[];
}

interface SelfReviewReport {
  checklist: {
    item: string;
    passed: boolean;
    notes?: string;
  }[];
  codeSmells: {
    type: string; // 'long-function' | 'duplication' | 'poor-naming'
    location: string; // File:line
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }[];
  acceptanceCriteriaCheck: {
    criterion: string;
    met: boolean;
    evidence: string;
  }[];
  confidence: number; // 0.0-1.0
  criticalIssues: string[]; // Blockers requiring fix
}

interface IndependentReviewReport {
  securityReview: SecurityReview;
  qualityAnalysis: QualityAnalysis;
  testValidation: TestValidation;
  architectureCompliance: {
    compliant: boolean;
    violations: string[];
  };
  overallScore: number; // 0.0-1.0
  confidence: number; // 0.0-1.0
  decision: 'pass' | 'fail' | 'escalate';
  findings: ReviewFinding[];
  recommendations: string[];
}

interface SecurityReview {
  vulnerabilities: {
    type: string; // OWASP category
    severity: 'critical' | 'high' | 'medium' | 'low';
    location: string;
    description: string;
    remediation: string;
  }[];
  score: number; // 0-100
  passed: boolean; // No critical or high severity issues
}

interface QualityAnalysis {
  complexityScore: number; // Cyclomatic complexity
  maintainabilityIndex: number; // 0-100
  codeSmells: {
    type: string;
    count: number;
    locations: string[];
  }[];
  duplicationPercentage: number;
  namingConventionViolations: string[];
  score: number; // 0-100
}

interface TestValidation {
  coverageAdequate: boolean; // >80% for new code
  testQuality: {
    edgeCasesCovered: boolean;
    errorHandlingTested: boolean;
    integrationTestsPresent: boolean;
  };
  missingTests: string[]; // Functions without tests
  score: number; // 0-100
}

interface ReviewFinding {
  category: 'security' | 'quality' | 'testing' | 'architecture';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  location: string;
  recommendation: string;
}

interface StoryWorkflowState extends WorkflowState {
  workflow: 'dev-story';
  storyId: string;
  currentStep: number; // 1-8 (context, worktree, implement, test, review, pr, ci-monitor, cleanup)
  worktreePath?: string;
  branchName?: string;
  agentActivity: {
    amelia: {
      status: 'idle' | 'implementing' | 'testing' | 'reviewing' | 'completed';
      startTime?: Date;
      endTime?: Date;
    };
    alex: {
      status: 'idle' | 'reviewing' | 'completed';
      startTime?: Date;
      endTime?: Date;
    };
  };
  reviewStatus: {
    selfReviewPassed: boolean;
    independentReviewPassed: boolean;
    confidence: number;
  };
  prUrl?: string;
  ciStatus?: 'pending' | 'running' | 'passed' | 'failed';
}
```

**Sprint Status Update Schema** (`docs/sprint-status.yaml`):

```yaml
development_status:
  # Story status: backlog | drafted | ready-for-dev | in-progress | review | done
  5-1-core-agent-infrastructure: in-progress  # Amelia + Alex working
  5-2-story-context-generator: done           # Context ready
  5-3-workflow-orchestration-state-management: review  # PR created, in review
```

### APIs and Interfaces

**AgentPool API** (from Epic 1, used by Epic 5):

```typescript
// Create Amelia agent with configured LLM
const ameliaAgent = await agentPool.createAgent(
  "amelia",
  "gpt-4-turbo", // Superior code generation
  {
    story: storyContext,
    architecture: archContent,
    onboarding: onboardingDocs,
    existingCode: relevantCode
  }
);

// Create Alex agent with different LLM for diverse perspective
const alexAgent = await agentPool.createAgent(
  "alex",
  "claude-sonnet-4-5", // Superior analytical reasoning
  {
    story: storyContext,
    standards: codingStandards,
    ameliaCode: codeImplementation,
    testResults: testSuite
  }
);

// Invoke agent methods
const implementation = await ameliaAgent.invoke(ameliaImplementPrompt(context));
const tests = await ameliaAgent.invoke(ameliaTestPrompt(context, implementation));
const selfReview = await ameliaAgent.invoke(ameliaSelfReviewPrompt(context, implementation, tests));
const independentReview = await alexAgent.invoke(alexReviewPrompt(context, implementation, tests, selfReview));
```

**StoryContextGenerator API** (Story 5.2):

```typescript
class StoryContextGenerator {
  async generateContext(storyFilePath: string): Promise<StoryContext> {
    const story = await this.readStoryFile(storyFilePath);
    const prdContext = await this.extractRelevantPRDSections(story);
    const archContext = await this.extractRelevantArchSections(story);
    const onboarding = await this.loadOnboardingDocs();
    const existingCode = await this.loadRelevantCode(story.technicalNotes.affectedFiles);
    const dependencyContext = await this.loadDependencyContext(story.dependencies);

    return {
      story,
      prdContext,
      architectureContext: archContext,
      onboardingDocs: onboarding,
      existingCode,
      dependencyContext,
      totalTokens: this.calculateTokens()
    };
  }

  private async extractRelevantPRDSections(story: Story): Promise<string>;
  private async extractRelevantArchSections(story: Story): Promise<string>;
  private async loadOnboardingDocs(): Promise<string>;
  private async loadRelevantCode(files: string[]): Promise<CodeFile[]>;
  private async loadDependencyContext(deps: string[]): Promise<string>;
}
```

**WorkflowOrchestrator API** (Story 5.3):

```typescript
class WorkflowOrchestrator {
  async executeStoryWorkflow(storyId: string): Promise<PRResult> {
    // Step 1: Generate context
    const context = await this.contextGenerator.generateContext(storyId);

    // Step 2: Create worktree
    const worktree = await this.worktreeManager.createWorktree(storyId);

    // Step 3: Implement story (Amelia)
    const implementation = await this.ameliaAgent.implementStory(context);
    await this.applyCodeChanges(worktree, implementation);

    // Step 4: Generate tests (Amelia)
    const tests = await this.ameliaAgent.writeTests(implementation);
    await this.applyTestChanges(worktree, tests);

    // Step 5: Run tests
    const testResults = await this.runTests(worktree);
    if (!testResults.passed) {
      await this.fixFailingTests(worktree, testResults);
    }

    // Step 6: Dual-agent review
    const selfReview = await this.ameliaAgent.reviewCode(implementation);
    const independentReview = await this.alexAgent.generateReport([
      await this.alexAgent.reviewSecurity(implementation),
      await this.alexAgent.analyzeQuality(implementation),
      await this.alexAgent.validateTests(tests, testResults.coverage)
    ]);

    // Step 7: Make pass/fail decision
    if (!this.shouldProceedToPR(selfReview, independentReview)) {
      return this.escalateForHumanReview(storyId, selfReview, independentReview);
    }

    // Step 8: Create PR
    const pr = await this.prAutomator.createPR(worktree, storyId, independentReview);

    // Step 9: Monitor CI and auto-merge
    await this.monitorCIAndMerge(pr, worktree);

    // Step 10: Update status
    await this.stateManager.updateStoryStatus(storyId, 'done');

    return pr;
  }

  private async shouldProceedToPR(
    selfReview: SelfReviewReport,
    independentReview: IndependentReviewReport
  ): Promise<boolean>;
}
```

**DualAgentCodeReviewer API** (Story 5.6):

```typescript
class DualAgentCodeReviewer {
  async performDualReview(
    code: CodeImplementation,
    tests: TestSuite,
    context: StoryContext
  ): Promise<CombinedReviewResult> {
    // Phase 1: Amelia self-review
    const selfReview = await this.ameliaAgent.reviewCode(code);

    // If critical issues, fix immediately
    if (selfReview.criticalIssues.length > 0) {
      const fixes = await this.ameliaAgent.implementFixes(selfReview.criticalIssues);
      code = this.applyFixes(code, fixes);
    }

    // Phase 2: Alex independent review
    const securityReview = await this.alexAgent.reviewSecurity(code);
    const qualityAnalysis = await this.alexAgent.analyzeQuality(code);
    const testValidation = await this.alexAgent.validateTests(tests, tests.coverage);

    const independentReview = await this.alexAgent.generateReport([
      securityReview,
      qualityAnalysis,
      testValidation
    ]);

    // Phase 3: Aggregate and decide
    return {
      selfReview,
      independentReview,
      decision: this.makeDecision(selfReview, independentReview),
      confidence: this.calculateConfidence(selfReview, independentReview),
      aggregatedFindings: this.aggregateFindings(selfReview, independentReview)
    };
  }

  private makeDecision(
    selfReview: SelfReviewReport,
    independentReview: IndependentReviewReport
  ): 'pass' | 'fail' | 'escalate';
}
```

**PRCreationAutomator API** (Story 5.7):

```typescript
class PRCreationAutomator {
  async createPR(
    worktree: Worktree,
    storyId: string,
    reviewReport: IndependentReviewReport
  ): Promise<PRResult> {
    // Push branch to remote
    await this.pushBranch(worktree);

    // Create PR via @octokit/rest
    const pr = await this.octokit.pulls.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title: `Story ${storyId}: ${worktree.story.title}`,
      body: this.generatePRBody(worktree.story, reviewReport),
      head: worktree.branchName,
      base: 'main'
    });

    // Apply labels
    await this.applyLabels(pr, storyId);

    return {
      url: pr.data.html_url,
      number: pr.data.number,
      branchName: worktree.branchName
    };
  }

  async monitorAndAutoMerge(pr: PRResult): Promise<void> {
    // Poll CI status
    const ciPassed = await this.waitForCI(pr.number);

    if (!ciPassed) {
      throw new Error(`CI failed for PR ${pr.number}`);
    }

    // Auto-merge if enabled
    if (this.config.autoMerge) {
      await this.octokit.pulls.merge({
        owner: this.config.owner,
        repo: this.config.repo,
        pull_number: pr.number,
        merge_method: 'squash'
      });

      await this.cleanup(pr.branchName);
    }
  }

  private generatePRBody(story: Story, review: IndependentReviewReport): string;
}
```

### Workflows and Sequencing

**Story Development Workflow Sequence** (Foundation → Features → Testing):

```
PHASE 1: FOUNDATION (Sequential - 3 story-units)
┌────────────────────────────────────────────────────────────┐
│ Story 5.1: Core Agent Infrastructure                      │
│   ├─ Load Amelia persona from bmad/bmm/agents/amelia.md  │
│   ├─ Load Alex persona from bmad/bmm/agents/alex.md      │
│   ├─ Configure LLMs from .bmad/project-config.yaml       │
│   ├─ Different LLMs for diverse perspectives              │
│   └─ Export agent methods for workflow use                │
└──────────────────┬─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│ Story 5.2: Story Context Generator                        │
│   ├─ Read story file (docs/stories/story-XXX.md)         │
│   ├─ Extract relevant PRD sections (<10k tokens)          │
│   ├─ Extract relevant Architecture sections (<15k)        │
│   ├─ Load onboarding docs (coding standards) (<10k)       │
│   ├─ Load existing code files mentioned in story (<15k)   │
│   └─ Generate Story Context XML (<50k tokens total)       │
└──────────────────┬─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│ Story 5.3: Workflow Orchestration & State Management     │
│   ├─ Load bmad/bmm/workflows/dev-story/workflow.yaml     │
│   ├─ Create worktree for isolated development             │
│   ├─ Coordinate Amelia and Alex agents                    │
│   ├─ Track state transitions (idle → implementing →       │
│   │   testing → reviewing → pr-created → done)            │
│   └─ Handle error recovery and retry logic                │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   ▼
        [Foundation Complete]
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│ PHASE 2: FEATURE DELIVERY (Parallel - 0.5 story-units)      │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ Story 5.4       │  │ Story 5.5       │  │ Story 5.6    ││
│  │ Code Impl.      │  │ Test Gen/Exec   │  │ Dual Review  ││
│  │ (1-2h)          │  │ (1-2h)          │  │ (1-2h)       ││
│  └─────────┬───────┘  └─────────┬───────┘  └──────┬───────┘│
│            │                    │                  │         │
│            │         ┌──────────▼──────────┐       │         │
│            │         │ Story 5.7           │       │         │
│            │         │ PR Creation/Merge   │       │         │
│            │         │ (1-2h)              │       │         │
│            │         └──────────┬──────────┘       │         │
│            └────────────────────┴──────────────────┘         │
│                                 │                            │
└─────────────────────────────────┼────────────────────────────┘
                                  ▼
                    [All Features Complete]
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────┐
│ PHASE 3: TESTING (Sequential - 2 story-units)               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Story 5.8: Integration Tests                        │   │
│  │   ├─ Test workflow execution                        │   │
│  │   ├─ Test agent interactions                        │   │
│  │   ├─ Test error recovery                            │   │
│  │   └─ 80%+ code coverage                             │   │
│  └─────────────────┬───────────────────────────────────┘   │
│                    │                                        │
│  ┌─────────────────▼───────────────────────────────────┐   │
│  │ Story 5.9: E2E Story Development Tests              │   │
│  │   ├─ Test simple feature story                      │   │
│  │   ├─ Test complex multi-file story                  │   │
│  │   ├─ Test parallel story execution                  │   │
│  │   └─ Performance benchmark: <2 hours per story      │   │
│  └─────────────────────────────────────────────────────┘   │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     ▼
        [Epic 5 Complete: Autonomous Implementation Ready]
```

**Story 5.3 Internal Sequence** (Workflow Orchestration):

```
1. Load story file from docs/stories/story-XXX.md
2. Invoke StoryContextGenerator.generateContext(storyId)
3. Create worktree via WorktreeManager (branch: story/XXX-title)
4. Update StateManager (story status: in-progress, agent: amelia → implementing)
5. Invoke Amelia: implementStory(context)
   ├─ Read context XML
   ├─ Implement code following architecture
   ├─ Add error handling and logging
   ├─ Follow security best practices
   └─ Return CodeImplementation object
6. Apply code changes to worktree
7. Invoke Amelia: writeTests(implementation)
   ├─ Generate unit tests for all functions/classes
   ├─ Write integration tests for workflows
   ├─ Include edge cases and error conditions
   └─ Return TestSuite object
8. Apply test changes to worktree
9. Run tests in worktree: npm test
10. If tests fail: Fix and re-run (max 3 attempts)
11. Invoke Amelia: reviewCode(implementation)
    ├─ Check code follows standards
    ├─ Verify acceptance criteria met
    ├─ Check for code smells
    └─ Return SelfReviewReport
12. If critical issues: Fix and re-review
13. Invoke Alex: generateReport([security, quality, testValidation])
    ├─ reviewSecurity(code) → scan for vulnerabilities
    ├─ analyzeQuality(code) → complexity, maintainability
    ├─ validateTests(tests, coverage) → >80% coverage check
    └─ Return IndependentReviewReport with pass/fail decision
14. Make final decision based on both reviews:
    ├─ If both pass and confidence >0.85: Proceed to PR
    ├─ If either fail or confidence <0.85: Escalate to human
    └─ If fixable issues: Return to Amelia for fixes
15. If decision is pass: Invoke PRCreationAutomator
16. Create PR with story details and review summary
17. Monitor CI status via GitHub API
18. If CI passes and auto-merge enabled: Merge PR
19. Cleanup worktree
20. Update StateManager (story status: done)
21. Emit event: story.completed
```

## Non-Functional Requirements

### Performance

**Story Execution Performance:**
- Complete story development (context → PR merged): <2 hours target
- Story context generation: <5 minutes (<50k tokens)
- Code implementation (Amelia): <60 minutes for typical story
- Test generation and execution: <30 minutes
- Dual-agent code review: <15 minutes (Amelia self-review: <5 min, Alex independent: <10 min)
- PR creation and CI monitoring: <10 minutes
- Auto-merge and cleanup: <5 minutes

**Parallel Execution Performance:**
- Foundation phase (Stories 5.1-5.3): 6-7 hours sequential
- Feature phase (Stories 5.4-5.7): 1-2 hours with 4 parallel worktrees (vs 6-8 hours sequential)
- 1.67x speedup vs original structure (6 story-units vs 10 story-units)
- Support for up to 4 concurrent stories in parallel worktrees

**Resource Constraints:**
- Max concurrent Amelia agents: 4 (parallel story limit)
- Max concurrent Alex agents: 4 (one per Amelia agent)
- Memory usage per agent: <512MB
- Disk space per worktree: <100MB
- Total LLM cost per story: <$2-5 target

### Security

**Code Security:**
- Alex agent performs OWASP Top 10 security checks on all generated code
- Static analysis for common vulnerabilities: SQL injection, XSS, CSRF, insecure deserialization
- Secrets detection: No hardcoded API keys, passwords, or credentials
- Input validation: All user inputs validated before use
- Authentication/Authorization: Proper implementation of security gates

**Agent Security:**
- Amelia and Alex agents authenticate via LLM provider API keys
- API keys stored in `.bmad/.secrets.yaml` (gitignored)
- Agent context isolated per story (no cross-story access)
- No execution of untrusted code during review

**PR Security:**
- GitHub API authentication via Personal Access Token (PAT)
- PAT stored securely in environment variables
- Branch protection rules enforced (require CI pass before merge)
- Auto-merge only enabled if all security checks pass

**Secrets Management:**
- LLM API keys loaded from environment variables
- No secrets in generated code or PR descriptions
- Redact sensitive information from logs and review reports

### Reliability/Availability

**Error Recovery:**
- Workflow state checkpointed after each major step
- Resume capability from any step after crash
- Amelia agent retry logic: 3 attempts with exponential backoff for transient failures
- Alex agent retry logic: 2 attempts, escalate if persistent failures
- Test failure auto-fix: Up to 3 attempts to fix failing tests

**Quality Gates:**
- Dual-agent review ensures high code quality (Amelia self-review + Alex independent)
- Test coverage validation: >80% for new code (enforced by Alex)
- CI checks must pass before merge (automated via GitHub Actions)
- Human escalation if confidence <0.85 or critical issues found

**Graceful Degradation:**
- If Alex agent unavailable: Fall back to Amelia self-review only, add warning to PR
- If test execution fails: Escalate with test output, do not proceed to review
- If PR creation fails: Save code to worktree, log error, escalate
- If CI fails after 2 retries: Escalate with CI logs, do not auto-merge

**State Consistency:**
- Atomic updates to sprint-status.yaml (write to .tmp, rename on success)
- Git commits after each major step (implementation, tests, review)
- Worktree cleanup only after successful PR merge
- State rollback on critical failure (restore from last checkpoint)

### Observability

**Logging:**
- Structured logs (JSON format) for all workflow steps with correlation IDs
- Log levels: DEBUG (agent prompts/responses - opt-in), INFO (step execution), WARN (retries, non-blocking issues), ERROR (failures), CRITICAL (unrecoverable errors)
- Key log events:
  - `story.workflow.started` (storyId, timestamp)
  - `story.context.generated` (storyId, tokenCount, duration)
  - `amelia.implementing` (storyId, contextSize)
  - `amelia.tests.generated` (storyId, testCount, coverage)
  - `amelia.self-review.completed` (storyId, confidence, issueCount)
  - `alex.independent-review.started` (storyId, timestamp)
  - `alex.security-review.completed` (storyId, vulnerabilities, score)
  - `alex.quality-analysis.completed` (storyId, complexityScore, maintainabilityIndex)
  - `alex.test-validation.completed` (storyId, coverageAdequate, missingTests)
  - `review.decision` (storyId, decision: 'pass' | 'fail' | 'escalate', confidence)
  - `pr.created` (storyId, prUrl, prNumber)
  - `ci.status.changed` (prNumber, status: 'pending' | 'running' | 'passed' | 'failed')
  - `pr.merged` (prNumber, storyId)
  - `story.completed` (storyId, duration, cost)

**Metrics:**
- Story execution time (total and per-step)
- Agent invocation count and duration (Amelia, Alex)
- Code quality metrics: complexity, maintainability, duplication
- Test metrics: count, coverage, pass rate, duration
- Review metrics: findings count by severity, pass/fail rate, confidence scores
- PR metrics: time to create, CI duration, merge success rate
- LLM token usage and estimated cost per story
- Escalation count and resolution time

**Tracing:**
- Story workflow trace ID (correlate all logs for a story)
- Agent invocation trace (parent = workflow, child = agent method)
- Dual-agent review trace (link Amelia → Alex → decision)
- PR lifecycle trace (creation → CI → merge → cleanup)
- Trace attributes: projectId, storyId, workflowStep, agentName, llmModel

**Cost Tracking:**
- Amelia agent LLM costs tracked per invocation: implementStory ($0.50-1.50), writeTests ($0.30-0.80), reviewCode ($0.20-0.40)
- Alex agent LLM costs tracked per invocation: reviewSecurity ($0.30-0.60), analyzeQuality ($0.20-0.40), validateTests ($0.10-0.30)
- Total story development cost: <$2-5 target
- Cost alerts if estimated total exceeds $10 (configurable threshold)

## Dependencies and Integrations

**Internal Dependencies:**

| Dependency | Component | Purpose | Version/Commit |
|------------|-----------|---------|----------------|
| Epic 1 Core Engine | `WorkflowEngine`, `AgentPool`, `LLMFactory`, `StateManager`, `WorktreeManager` | Foundation for story workflow execution, agent management, worktree operations | Completed |
| Epic 2 PRD | `docs/PRD.md` | Source of functional requirements for story context | Completed |
| Epic 3 Architecture | `docs/architecture.md` | Technical design and coding standards for implementation | Completed |
| Epic 4 Solutioning | `docs/stories/story-*.md`, `docs/sprint-status.yaml` | Story definitions and status tracking | Completed |

**External Dependencies:**

| Dependency | Purpose | Version | Installation |
|------------|---------|---------|--------------|
| `@octokit/rest` | GitHub API for PR operations | ^20.0.0 | npm install @octokit/rest |
| `@anthropic-ai/sdk` | Claude API for Alex agent | ^0.27.0 | npm install @anthropic-ai/sdk |
| `openai` | OpenAI API for Amelia agent | ^4.20.0 | npm install openai |
| `simple-git` | Git operations for worktree management | ^3.21.0 | npm install simple-git |
| `vitest` | Test framework for generated tests | ^1.0.0 | npm install -D vitest |
| `@vitest/coverage-v8` | Code coverage reporting | ^1.0.0 | npm install -D @vitest/coverage-v8 |

**LLM Provider Integration:**
- Amelia agent configured for GPT-4 Turbo or similar (superior code generation)
- Alex agent configured for Claude Sonnet 4.5 (superior analytical reasoning)
- Different LLMs ensure diverse perspectives (key to dual-agent review value)
- LLM assignments read from `.bmad/project-config.yaml`:
  ```yaml
  agents:
    amelia:
      provider: openai
      model: gpt-4-turbo
      temperature: 0.4
      max_tokens: 8192
    alex:
      provider: anthropic
      model: claude-sonnet-4-5
      temperature: 0.3
      max_tokens: 8192
  ```
- Supports alternative providers: Zhipu (GLM), Google (Gemini) via LLMFactory pattern

**GitHub Integration:**
- PR creation via @octokit/rest GitHub API
- CI status monitoring via GitHub Checks API
- Branch protection rules enforced (require CI pass)
- Auto-merge via GitHub merge API (squash merge)
- Authentication via Personal Access Token (PAT) in environment variable `GITHUB_TOKEN`

**File System Integration:**
- Read: `docs/stories/story-*.md`, `docs/PRD.md`, `docs/architecture.md`, `docs/onboarding/*.md`, `bmad/bmm/agents/amelia.md`, `bmad/bmm/agents/alex.md`, `.bmad/project-config.yaml`
- Write: `src/**/*.ts` (implementation), `test/**/*.test.ts` (tests), `docs/sprint-status.yaml` (status updates)
- Git: Worktree creation, branch management, commits, push, PR creation, merge, cleanup

**Workflow Integration:**
- Invoked by orchestrator core after Epic 4 (Solutioning) completes
- Invokes no sub-workflows (self-contained story development)
- Emits events for Epic 6 (Dashboard) consumption: `story.started`, `story.completed`, `review.completed`, `pr.created`

## Acceptance Criteria (Authoritative)

1. **Core Agent Infrastructure (Story 5.1):**
   - Amelia agent persona loaded from bmad/bmm/agents/amelia.md with full developer context
   - Alex agent persona loaded from bmad/bmm/agents/alex.md with full code reviewer context
   - Both agents configured with project-assigned LLMs from .bmad/project-config.yaml agent_assignments
   - Amelia and Alex use different LLMs for diverse perspectives (e.g., Amelia on GPT-4 Turbo, Alex on Claude Sonnet)
   - Amelia methods implemented: implementStory(), writeTests(), reviewCode()
   - Alex methods implemented: reviewSecurity(), analyzeQuality(), validateTests(), generateReport()
   - Agent factory registration in AgentPool from Epic 1
   - Integration with Story 5.1 types (AmeliaAgent, AlexAgent interfaces)
   - Specialized prompts created for each agent's responsibilities
   - Unit tests for agent initialization and method invocations

2. **Story Context Generator (Story 5.2):**
   - StoryContextGenerator class implemented
   - Story file read from docs/stories/story-XXX.md with YAML frontmatter parsing
   - Relevant PRD sections extracted (<10k tokens) based on story description keywords
   - Relevant Architecture sections extracted (<15k tokens) based on technical notes
   - Onboarding docs loaded (coding standards, patterns) (<10k tokens)
   - Existing code files loaded from story.technicalNotes.affectedFiles (<15k tokens)
   - Dependency context loaded from prerequisite stories (if dependencies exist)
   - Story Context XML document generated with all sections
   - Total token count calculated and validated (<50k target)
   - Context caching implemented for story reuse
   - Unit tests for context generation with mock story files

3. **Workflow Orchestration & State Management (Story 5.3):**
   - WorkflowOrchestrator class implemented
   - bmad/bmm/workflows/dev-story/workflow.yaml loaded and parsed
   - Complete story development pipeline orchestrated: context → worktree → implement → test → review → PR → CI → merge
   - Worktree created for isolated development via WorktreeManager (branch: story/XXX-title)
   - Amelia agent spawned for implementation and testing
   - Alex agent spawned for independent code review
   - State transitions tracked: idle → implementing → testing → reviewing → pr-created → done
   - StateManager integrated for workflow state persistence
   - Sprint-status.yaml updated with story status at each major step
   - Error recovery and retry logic implemented (transient failures)
   - Complete story workflow executes in <2 hours
   - Failures handled with clear error messages and escalation
   - Unit tests for orchestrator logic + integration tests with mock agents

4. **Code Implementation Pipeline (Story 5.4):**
   - CodeImplementationPipeline class implemented
   - Story Context XML read and parsed
   - Code implemented following architecture and coding standards
   - All acceptance criteria from story addressed in implementation
   - Files created/modified as needed (src/**/*.ts)
   - Error handling and logging added to all functions
   - Security best practices followed (input validation, secrets handling)
   - Implementation notes generated documenting key decisions
   - Acceptance criteria mapping provided (criterion → implemented → evidence)
   - Git commit created with descriptive message
   - Implementation completes in <1 hour
   - Integration with Story 5.3 orchestrator
   - Unit tests + integration tests with mock story context

5. **Test Generation & Execution (Story 5.5):**
   - TestGenerationExecutor class implemented
   - Unit tests generated for all new functions/classes
   - Integration tests written for API endpoints or workflows
   - Edge case and error condition tests included
   - Project's test framework used (Vitest, Jest, etc. - auto-detected)
   - Test files created at test/**/*.test.ts
   - Tests executed in worktree: npm test
   - Code coverage report generated with >80% target for new code
   - Failing tests automatically fixed (up to 3 attempts)
   - Test suite committed with implementation
   - Tests complete in <30 minutes
   - Integration with Story 5.3 orchestrator
   - Unit tests + integration tests

6. **Dual-Agent Code Review (Story 5.6):**
   - DualAgentCodeReviewer class implemented coordinating both agents
   - **Amelia Self-Review:** CodeReviewer class checks code against standards, verifies acceptance criteria met, validates test coverage, checks for code smells (long functions, duplication, poor naming), generates self-review report with confidence score, fixes critical issues if found
   - **Alex Independent Review:** Alex agent spawned with different LLM than Amelia, provided with story context, Amelia's code, self-review report, test results, and project standards
   - **Security Review (Alex):** Static analysis performed, vulnerability detection executed (OWASP Top 10), security score calculated (0-100), critical/high severity issues identified
   - **Quality Analysis (Alex):** Complexity metrics calculated (cyclomatic complexity), maintainability index computed (0-100), code smells detected and categorized, duplication percentage measured, naming convention violations identified
   - **Test Validation (Alex):** Coverage adequacy checked (>80% for new code), test quality assessed (edge cases, error handling, integration tests), missing tests identified
   - **Review Report:** Structured report generated with findings categorized by severity (critical, high, medium, low, info), overall score calculated (0-1), confidence score provided (0-1), pass/fail/escalate decision made
   - **Decision Logic:** If both reviews pass and confidence >0.85: proceed to PR; If either fails or confidence <0.85: escalate to human; If fixable issues: return to Amelia for fixes
   - Review metrics tracked: time, findings count, pass/fail rate
   - Integration with Story 5.3 orchestrator
   - Unit tests + integration tests

7. **PR Creation & Automation (Story 5.7):**
   - PRCreationAutomator class implemented
   - @octokit/rest integrated for GitHub API access
   - Worktree branch pushed to remote
   - PR created with title (story name), body (description, acceptance criteria, implementation notes, test summary, review report), link to story file, agent signature
   - Labels applied based on epic/story type
   - Configured reviewers requested (if any)
   - PR creation errors handled gracefully with escalation
   - CI status monitored via GitHub Checks API (polling every 30 seconds)
   - All checks waited for completion (max 30 minutes timeout)
   - If checks pass and auto-merge enabled: PR merged (squash merge), remote branch deleted, worktree cleaned up
   - Sprint-status.yaml updated (story status: done)
   - Dependent stories triggered if ready (all prerequisites done)
   - If checks fail after 2 retries: escalate with CI logs
   - Manual review mode supported (no auto-merge)
   - Integration with Story 5.3 orchestrator
   - Unit tests + integration tests with mock GitHub API

8. **Integration Tests (Story 5.8):**
   - Complete workflow execution tested: context → implementation → tests → review → PR
   - Agent interaction tests: Amelia ↔ Alex communication, context passing, review coordination
   - Context generation pipeline tested: story file → context XML with all required sections
   - PR automation tested: creation → CI monitoring → auto-merge (mocked GitHub API)
   - Error recovery scenarios tested: failed tests, failed review, CI failures, transient errors
   - State management tested: worktree lifecycle, agent state transitions, sprint-status updates
   - Escalation triggers tested: low confidence (<0.85), critical issues, persistent failures
   - GitHub API mocked for PR operations
   - >80% code coverage achieved for new workflow code
   - All integration tests pass in <10 minutes

9. **E2E Story Development Tests (Story 5.9):**
   - E2E test: Simple feature story (single file change, <50 LOC)
   - E2E test: Complex story (multiple files, database migration, >200 LOC)
   - E2E test: Story with external dependencies (API integration)
   - E2E test: Story requiring human escalation (low confidence scenario)
   - E2E test: Multi-story workflow (story A → story B dependency chain)
   - E2E test: Parallel story execution (3 stories in parallel worktrees)
   - E2E test: Review failure and fix cycle (Amelia fixes issues identified by Alex)
   - E2E test: PR merge and cleanup (full lifecycle)
   - Performance benchmark: Full story execution <2 hours validated
   - All E2E tests pass in <30 minutes

## Traceability Mapping

| AC# | Spec Section | Components/APIs | Test Idea |
|-----|--------------|-----------------|-----------|
| 1 | Core Agent Infrastructure - Amelia | `AmeliaAgentInfrastructure`, `implementStory()`, `writeTests()`, `reviewCode()` | Unit test: Amelia persona loads, agent methods callable |
| 1 | Core Agent Infrastructure - Alex | `AlexAgentInfrastructure`, `reviewSecurity()`, `analyzeQuality()`, `validateTests()`, `generateReport()` | Unit test: Alex persona loads, different LLM configured |
| 2 | Story Context Generator | `StoryContextGenerator.generateContext()`, token optimization | Integration test: Generate context for test story, verify <50k tokens |
| 3 | Workflow Orchestration | `WorkflowOrchestrator.executeStoryWorkflow()`, state transitions | Integration test: Execute workflow end-to-end, verify status updates |
| 4 | Code Implementation | `CodeImplementationPipeline`, Amelia agent invocation | Integration test: Implement test story, verify code created |
| 5 | Test Generation | `TestGenerationExecutor`, test execution, coverage | Integration test: Generate tests for implementation, run, verify coverage |
| 6 | Dual-Agent Review | `DualAgentCodeReviewer`, Amelia self-review, Alex independent review | Integration test: Review test code, verify both agents execute |
| 6 | Security Review (Alex) | `AlexAgent.reviewSecurity()`, OWASP checks | Unit test: Review code with known vulnerabilities, verify detection |
| 6 | Quality Analysis (Alex) | `AlexAgent.analyzeQuality()`, complexity metrics | Unit test: Analyze code with high complexity, verify scoring |
| 6 | Test Validation (Alex) | `AlexAgent.validateTests()`, coverage check | Unit test: Validate tests with <80% coverage, verify failure |
| 7 | PR Creation | `PRCreationAutomator.createPR()`, @octokit/rest | Integration test: Create PR with mock GitHub API, verify PR structure |
| 7 | PR Auto-Merge | `PRCreationAutomator.monitorAndAutoMerge()`, CI monitoring | Integration test: Monitor CI with mock status, verify merge logic |
| 8 | Integration Tests | All workflow components, error recovery | Integration test suite covering all components |
| 9 | E2E Tests | Complete story development pipeline | E2E test suite with real stories |

## Risks, Assumptions, Open Questions

### Risks

**R-5.1: Dual-Agent Review Cost (Severity: Medium)**
- **Description**: Running both Amelia and Alex agents increases LLM costs compared to single-agent approach
- **Impact**: Story cost may exceed $2-5 target if both agents use expensive models
- **Mitigation**:
  - Use cost-effective models: Amelia on GPT-4 Turbo ($10/$30 per 1M tokens), Alex on Claude Sonnet ($3/$15)
  - Context optimization: Keep Amelia context <30k, Alex context <20k
  - Monitor per-story costs, adjust LLM assignments if exceeding budget
- **Contingency**: Make Alex review optional for low-risk stories (configuration flag)

**R-5.2: Code Quality Variance (Severity: High)**
- **Description**: Amelia may generate inconsistent code quality depending on story complexity and LLM performance
- **Impact**: Failed reviews, human escalations, longer story completion times
- **Mitigation**:
  - Comprehensive story context (<50k tokens) with clear examples
  - Alex independent review catches quality issues
  - Iterative fix cycle: Amelia fixes issues identified by Alex
  - Track code quality metrics, adjust prompts if quality degradation detected
- **Contingency**: Human review for complex stories, refine agent prompts based on failures

**R-5.3: Test Coverage Gaps (Severity: Medium)**
- **Description**: Amelia may not generate comprehensive tests, missing edge cases or integration scenarios
- **Impact**: Lower code coverage (<80%), bugs in production, failed Alex validation
- **Mitigation**:
  - Alex validates test coverage and identifies missing tests
  - Amelia re-generates tests based on Alex feedback
  - Test templates and examples in story context
  - Track coverage metrics, escalate if consistently <80%
- **Contingency**: Human-written tests for critical features, test template library

**R-5.4: GitHub API Rate Limits (Severity: Low)**
- **Description**: PR creation and CI monitoring may hit GitHub API rate limits with high story volume
- **Impact**: Failed PR creation, delayed CI status checks
- **Mitigation**:
  - Use authenticated requests (5000 requests/hour vs 60 unauthenticated)
  - Batch CI status checks (poll every 30 seconds vs every 5 seconds)
  - Implement exponential backoff on rate limit errors
  - Monitor rate limit remaining, throttle requests if approaching limit
- **Contingency**: Manual PR creation if API unavailable, webhook-based CI status updates

**R-5.5: Parallel Execution Conflicts (Severity: Medium)**
- **Description**: Multiple stories in parallel worktrees may modify same files, causing merge conflicts
- **Impact**: Failed PR merges, manual conflict resolution required
- **Mitigation**:
  - Dependency detection in Epic 4 identifies file conflicts
  - Sequential execution of stories with file overlap
  - Git worktree isolation prevents conflicts during development
  - Merge conflict detection and escalation
- **Contingency**: Human conflict resolution, improved dependency detection

### Assumptions

**A-5.1**: Story context <50k tokens sufficient for Amelia to implement stories correctly
**A-5.2**: Alex agent can accurately detect security vulnerabilities and code quality issues through static analysis
**A-5.3**: Amelia and Alex using different LLMs provides meaningfully diverse perspectives (not just different responses from same capability)
**A-5.4**: GitHub CI passes >90% of the time after dual-agent review (high-quality code assumption)
**A-5.5**: Test frameworks (Vitest, Jest) installed and configured in project
**A-5.6**: >80% code coverage target is appropriate for all story types (may need adjustment per project)
**A-5.7**: Auto-merge is safe with dual-agent review + CI checks (no additional human review needed)

### Open Questions

**Q-5.1**: Should Alex review be required for all stories or only medium/high complexity?
- **Current Design**: Alex reviews all stories (comprehensive quality gate)
- **Alternative**: Skip Alex for simple stories (<50 LOC, low complexity) to reduce cost
- **Decision**: Required for all stories in MVP, add complexity-based routing in v1.1

**Q-5.2**: How many fix iterations should be allowed before human escalation?
- **Current Design**: Amelia fixes issues once based on Alex feedback, escalate if still failing
- **Alternative**: Allow 2-3 iterations to handle complex issues
- **Decision**: Single fix iteration for MVP, track success rate, adjust if needed

**Q-5.3**: Should test failures block PR creation or create PR with failing tests?
- **Current Design**: Tests must pass before PR creation (quality gate)
- **Alternative**: Create PR with failing tests, let CI report failures
- **Decision**: Block PR creation if tests fail, maintain quality standard

**Q-5.4**: What is the optimal CI timeout before escalation?
- **Current Design**: 30 minutes max wait for CI completion
- **Alternative**: Configurable per-project timeout (some projects have slower CI)
- **Decision**: Fixed 30 minutes for MVP, add project-level configuration in v1.1

**Q-5.5**: Should PRs be squash merged, rebase merged, or regular merged?
- **Current Design**: Squash merge (clean history, single commit per story)
- **Alternative**: Rebase merge (preserve story commits) or regular merge (full history)
- **Decision**: Squash merge for MVP (simpler), explore alternatives based on user feedback

## Test Strategy Summary

**Unit Testing:**
- All TypeScript classes and methods tested in isolation (target: 80%+ coverage)
- Mock external dependencies: LLM API calls, GitHub API, file system operations
- Test frameworks: Vitest for unit tests, @vitest/coverage-v8 for coverage
- Key test suites:
  - Agent infrastructure: Persona loading, LLM configuration, method invocations
  - Story context generator: Context assembly, token optimization, caching
  - Workflow orchestrator: Step execution, state transitions, error recovery
  - Code implementation: File creation, code formatting, standards compliance
  - Test generation: Test template application, coverage calculation
  - Dual-agent reviewer: Review coordination, decision logic, confidence scoring
  - PR automation: PR creation, CI monitoring, auto-merge logic

**Integration Testing:**
- Test interactions between story development components with real file system and git operations (test repository)
- Mock only external APIs: LLM API calls (use fixture responses), GitHub API (mock responses)
- Key integration tests:
  - End-to-end story workflow: Story file → Context → Implementation → Tests → Review → PR
  - Agent coordination: Amelia → Alex handoff, review aggregation
  - Worktree lifecycle: Creation, development, cleanup
  - State persistence: sprint-status.yaml updates, workflow state checkpointing
  - Error recovery: Test failures → fix cycle, review failures → escalation

**Story-Level Testing:**
- Each story (5.1-5.9) includes unit tests and integration tests as acceptance criteria
- Test coverage reports generated per story
- Test execution as part of story DoD (Definition of Done)

**End-to-End Testing:**
- Real-world story scenarios with actual story files
- Simple story: Single file change, basic implementation
- Complex story: Multiple files, database migration, API integration
- Parallel execution: 3 stories simultaneously in separate worktrees
- Failure scenarios: Review failure → fix cycle, CI failure → escalation
- Performance benchmark: <2 hours per story validation

**Performance Testing:**
- Measure complete story workflow execution time (target: <2 hours)
- Measure each workflow step duration (context, implementation, tests, review, PR)
- Measure LLM invocation latency for Amelia and Alex
- Measure test execution time (target: <30 minutes)
- Load testing: 10 stories in parallel worktrees

**Test Automation:**
- All unit and integration tests run in CI/CD pipeline (GitHub Actions)
- Test results reported in PR checks
- Coverage reports generated and tracked over time
- Tests fail CI if coverage drops below 80%

**Test Data:**
- Fixture story files for repeatable testing (simple, moderate, complex)
- Mock LLM responses for deterministic integration tests
- Known-good and known-bad code samples for review testing
- Test repositories with controlled file structures

**ATDD Approach:**
- Write acceptance criteria tests BEFORE implementation (Test-First Development)
- Map each AC to executable test
- Use BDD-style test descriptions (given/when/then)
- Validate acceptance criteria with stakeholders before coding

---

**Epic 5 Technical Specification Approval:**

- [ ] Winston (Architect) - Architecture design complete and sound
- [ ] Murat (Test Architect) - Test strategy comprehensive and achievable
- [ ] Bob (Scrum Master) - Stories can be decomposed from this spec
- [ ] Chris (Product Owner) - Meets PRD requirements and vision

**Next Steps:**
1. Mark epic-5 status as "contexted" in docs/sprint-status.yaml
2. Run story creation workflow to draft first story (5.1: Core Agent Infrastructure)
3. Validate story dependencies and sequencing
4. Begin implementation of foundation stories (5.1-5.3)

---

_This technical specification provides the authoritative blueprint for implementing Epic 5: Story Implementation Automation. All implementation decisions must trace back to this spec to ensure consistency and completeness._
