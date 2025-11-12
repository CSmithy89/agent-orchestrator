# Epic Technical Specification: Planning Phase Automation

Date: 2025-11-12
Author: Chris
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 establishes the autonomous Planning Phase of the Agent Orchestrator, transforming high-level requirements from the PRD into concrete technical architecture. This epic implements the Winston (System Architect) and Murat (Test Architect) agents who collaborate to produce comprehensive architecture documentation including system design, technical decisions, **mandatory test strategy**, and **security gate validation** before allowing progression to the solutioning phase.

The Planning Phase bridges the gap between "what we're building" (PRD) and "how we'll build it" (implementation stories), ensuring all technical decisions are documented, security requirements are validated, and test infrastructure is planned before any code is written. This phase is critical for autonomous operation as it establishes the technical guardrails that guide all subsequent implementation work.

## Objectives and Scope

**In Scope:**

1. **Winston Agent (System Architect)**
   - Persona definition with architectural expertise
   - System design and component architecture
   - Data model and API specification
   - Technology stack decisions with rationale
   - Performance and scalability considerations

2. **Murat Agent (Test Architect - REQUIRED)**
   - Persona definition with testing expertise
   - Test strategy and framework selection
   - Test pyramid definition (unit, integration, E2E ratios)
   - CI/CD pipeline specification
   - Quality gates and coverage requirements
   - ATDD (Acceptance Test-Driven Development) approach

3. **Architecture Workflow Executor**
   - BMAD workflow.yaml parser and executor
   - Architecture template processing
   - Technical decisions logger
   - Multi-agent coordination (Winston + Murat)
   - State management during architecture phase

4. **Security Gate Validation (MANDATORY)**
   - Automated security completeness checks
   - Authentication/authorization validation
   - Secrets management verification
   - Input validation strategy check
   - API security measures validation (rate limiting, CORS, CSP)
   - Data encryption strategy verification
   - Threat model assessment (OWASP Top 10)
   - **Blocking gate**: Prevent progression to solutioning if security incomplete

5. **CIS Agent Integration**
   - Strategic decision routing to CIS agents
   - Dr. Quinn for complex technical trade-offs
   - Maya for UX-centric architecture decisions
   - Sophia for product narrative clarity
   - Victor for innovation and differentiation opportunities

6. **Architecture Validation Tests**
   - Architecture completeness scoring
   - PRD traceability validation
   - Technical decision consistency checks
   - Test strategy completeness validation

**Out of Scope:**

- Story decomposition (Epic 4 - Solutioning Phase)
- Code implementation (Epic 5)
- UX design workflow (separate workflow)
- Game Design Document workflow (GDD - not applicable to this project)

**Success Criteria:**

- Complete architecture document generated in <45 minutes
- Security gate passes with ≥95% score
- Test strategy defined and complete
- <2 escalations during architecture workflow
- All PRD requirements addressed in architecture
- Technical decisions documented with clear rationale

## System Architecture Alignment

Epic 3 directly implements the **Planning Phase** components defined in the System Architecture (docs/architecture.md):

**Core Components (from Architecture Section 2.1):**

- **Workflow Engine** (Story 3-3): Executes architecture workflow.yaml with XML instructions
- **Agent Pool** (Stories 3-1, 3-2): Creates Winston and Murat agents with appropriate LLM assignments
- **Template Processor** (Story 3-5): Processes architecture template with variable substitution
- **State Manager** (Story 3-3): Persists workflow state during architecture phase

**Support Services (from Architecture Section 2.3):**

- **Decision Engine** (Story 3-8): Routes strategic architectural decisions to CIS agents
- **Security Gate Validator** (Story 3-6): Validates security completeness before solutioning
- **Error Handler** (Story 3-3): Graceful error recovery during workflow execution

**Architectural Constraints:**

- Microkernel architecture pattern: Architecture workflow is a **plugin** to core kernel
- Event-driven layer: Emit events (phase.changed, escalation.created) for real-time updates
- State resilience: Workflow state persisted after each step for crash recovery
- Cost optimization: Winston uses Claude Sonnet (analytical reasoning), Murat uses GPT-4 Turbo (test expertise)

**Integration Points:**

- **Input**: docs/PRD.md (from Epic 2 - Analysis Phase)
- **Output**: docs/architecture.md (consumed by Epic 4 - Solutioning Phase)
- **Dependencies**: Epic 1 (Foundation) must be complete
- **Successor**: Epic 4 blocked until Epic 3 security gate passes

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner (Story) |
|--------|---------------|--------|---------|---------------|
| **WinstonAgent** | System architecture design, component breakdown, technology decisions | PRD, project context, onboarding docs | Architecture sections: system design, data models, API specs, NFRs | 3-1 |
| **MuratAgent** | Test strategy definition, framework selection, quality gates | PRD, architecture draft, tech stack | Test strategy sections: frameworks, pyramid, CI/CD, ATDD approach | 3-2 |
| **ArchitectureWorkflowExecutor** | Orchestrate architecture workflow steps, coordinate agents, manage state | workflow.yaml, instructions.md, template.md | Completed architecture.md, workflow state | 3-3 |
| **TechnicalDecisionLogger** | Capture architectural decisions with rationale, ADR format | Decisions from Winston, Murat, CIS agents | Technical decisions section in architecture.md | 3-4 |
| **ArchitectureTemplateProcessor** | Fill architecture template with generated content | Template placeholders, agent outputs, variables | Final architecture.md document | 3-5 |
| **SecurityGateValidator** | Validate security completeness, block progression if gaps | Completed architecture.md | Security gate result (pass/fail), gap report | 3-6 |
| **ArchitectureValidator** | Validate architecture quality and completeness | architecture.md, PRD.md | Validation score, completeness report | 3-7 |
| **CISAgentRouter** | Route strategic decisions to specialized CIS agents | Decision context, confidence score, decision type | CIS recommendations with framework analysis | 3-8 |

### Data Models and Contracts

**Winston Agent Persona Contract:**
```typescript
interface WinstonAgent extends Agent {
  name: 'winston';
  role: 'System Architect';
  expertise: [
    'system-design',
    'component-architecture',
    'data-modeling',
    'api-design',
    'performance-optimization',
    'scalability-patterns',
    'technology-selection'
  ];
  llm: {
    model: 'claude-sonnet-4-5'; // Analytical reasoning
    provider: 'claude-code';
    temperature: 0.3; // Precise architectural decisions
  };
  outputs: [
    'system-architecture-overview',
    'component-breakdown',
    'data-models',
    'api-specifications',
    'technology-stack-rationale',
    'non-functional-requirements',
    'technical-constraints'
  ];
}
```

**Murat Agent Persona Contract:**
```typescript
interface MuratAgent extends Agent {
  name: 'murat';
  role: 'Test Architect';
  expertise: [
    'test-strategy',
    'test-automation',
    'framework-selection',
    'ci-cd-pipeline-design',
    'quality-gates',
    'atdd-methodology',
    'test-pyramid-optimization'
  ];
  llm: {
    model: 'gpt-4-turbo'; // Test expertise
    provider: 'openai';
    temperature: 0.4; // Balanced creativity for test scenarios
  };
  outputs: [
    'test-strategy',
    'framework-recommendations',
    'test-pyramid-definition',
    'ci-cd-pipeline-spec',
    'quality-gates',
    'coverage-requirements',
    'atdd-approach'
  ];
}
```

**Architecture Workflow State:**
```typescript
interface ArchitectureWorkflowState extends WorkflowState {
  workflow: 'architecture';
  currentStep: number; // 1-9 (per instructions.md)
  variables: {
    epic_id?: string;
    project_name: string;
    prd_path: string;
    architecture_output_path: string;
    user_name: string;
    date: string;
  };
  agentActivity: [
    {
      agent: 'winston';
      status: 'active' | 'completed';
      startTime: Date;
      sections: string[]; // Architecture sections assigned
    },
    {
      agent: 'murat';
      status: 'active' | 'completed';
      startTime: Date;
      sections: ['test-strategy'];
    }
  ];
  securityGate: {
    status: 'pending' | 'passed' | 'failed';
    score?: number;
    gaps?: string[];
  };
}
```

**Security Gate Check Model:**
```typescript
interface SecurityGateCheck {
  category: 'authentication' | 'secrets' | 'input-validation' | 'api-security' | 'encryption' | 'threat-model';
  requirement: string;
  satisfied: boolean;
  evidence?: string; // Section reference from architecture.md
  recommendation?: string; // If not satisfied
}

interface SecurityGateResult {
  passed: boolean; // True if score >= 95%
  overallScore: number; // 0-100
  checks: SecurityGateCheck[];
  gaps: string[]; // List of unsatisfied requirements
  escalationRequired: boolean;
  timestamp: Date;
}
```

**Technical Decision Record (ADR):**
```typescript
interface TechnicalDecision {
  id: string; // ADR-001, ADR-002, etc.
  title: string;
  context: string; // Problem statement
  decision: string; // Chosen solution
  alternatives: {
    option: string;
    pros: string[];
    cons: string[];
  }[];
  rationale: string;
  consequences: string[];
  status: 'proposed' | 'accepted' | 'superseded';
  decisionMaker: 'winston' | 'murat' | 'cis-agent' | 'user';
  date: Date;
}
```

**CIS Decision Request:**
```typescript
interface CISDecisionRequest {
  decision: string; // The architectural question
  context: string; // PRD excerpt, constraints, etc.
  decisionType: 'technical' | 'ux' | 'product' | 'innovation';
  confidence: number; // Winston's confidence (0-1)
  urgency: 'low' | 'medium' | 'high';
  projectContext: {
    name: string;
    level: number;
    techStack: string[];
    domain: string;
  };
}
```

### APIs and Interfaces

**Architecture Workflow API:**

```typescript
class ArchitectureWorkflowExecutor {
  /**
   * Execute architecture workflow from start to completion
   * @returns Path to generated architecture document
   */
  async execute(
    prdPath: string,
    options?: {
      epicId?: string;
      skipSecurityGate?: boolean; // Default: false (NEVER skip in production)
    }
  ): Promise<string>;

  /**
   * Resume architecture workflow from saved state
   * @returns Path to completed architecture document
   */
  async resume(projectId: string): Promise<string>;

  /**
   * Validate architecture completeness and quality
   * @returns Validation result with score
   */
  async validate(architecturePath: string): Promise<ValidationResult>;
}
```

**Winston Agent API:**

```typescript
interface IWinstonAgent {
  /**
   * Generate system architecture overview
   */
  generateSystemOverview(prd: string): Promise<string>;

  /**
   * Design component architecture
   */
  designComponents(requirements: string[]): Promise<ComponentDesign[]>;

  /**
   * Define data models
   */
  defineDataModels(entities: string[]): Promise<DataModel[]>;

  /**
   * Specify API contracts
   */
  specifyAPIs(endpoints: APIRequirement[]): Promise<APISpecification[]>;

  /**
   * Document technical decisions
   */
  documentDecision(decision: TechnicalDecision): Promise<string>;

  /**
   * Assess confidence for architectural decision
   */
  assessConfidence(decision: string, context: string): Promise<number>;
}
```

**Murat Agent API:**

```typescript
interface IMuratAgent {
  /**
   * Define comprehensive test strategy
   */
  defineTestStrategy(
    architecture: string,
    requirements: string[]
  ): Promise<TestStrategy>;

  /**
   * Recommend test frameworks
   */
  recommendFrameworks(techStack: string[]): Promise<FrameworkRecommendation[]>;

  /**
   * Design CI/CD pipeline
   */
  designPipeline(
    projectType: string,
    testStrategy: TestStrategy
  ): Promise<PipelineSpecification>;

  /**
   * Define quality gates
   */
  defineQualityGates(projectLevel: number): Promise<QualityGate[]>;

  /**
   * Specify ATDD approach
   */
  specifyATDD(acceptanceCriteria: string[]): Promise<ATDDApproach>;
}
```

**Security Gate Validator API:**

```typescript
interface ISecurityGateValidator {
  /**
   * Validate architecture security completeness
   * BLOCKING: Throws error if validation fails
   */
  async validate(architecturePath: string): Promise<SecurityGateResult>;

  /**
   * Check specific security category
   */
  async checkCategory(
    category: string,
    architectureContent: string
  ): Promise<SecurityGateCheck>;

  /**
   * Generate gap remediation report
   */
  async generateGapReport(gaps: string[]): Promise<string>;
}
```

**CIS Agent Router API:**

```typescript
interface ICISAgentRouter {
  /**
   * Route decision to appropriate CIS agent
   */
  async routeDecision(request: CISDecisionRequest): Promise<CISResponse>;

  /**
   * Invoke Dr. Quinn for technical trade-offs
   */
  async invokeDrQuinn(
    problem: string,
    context: string
  ): Promise<CISResponse>;

  /**
   * Invoke Maya for UX-centric decisions
   */
  async invokeMaya(
    designQuestion: string,
    context: string
  ): Promise<CISResponse>;

  /**
   * Invoke Sophia for product narrative
   */
  async invokeSophia(
    narrativeNeed: string,
    context: string
  ): Promise<CISResponse>;

  /**
   * Invoke Victor for innovation opportunities
   */
  async invokeVictor(
    innovationChallenge: string,
    context: string
  ): Promise<CISResponse>;
}
```

### Workflows and Sequencing

**Architecture Workflow Execution Sequence:**

```
1. Load Configuration (Step 1)
   └─> Read workflow.yaml
   └─> Resolve variables ({output_folder}, {user_name}, etc.)
   └─> Load PRD from docs/PRD.md
   └─> Initialize architecture.md from template

2. System Overview (Step 2 - Winston)
   └─> Winston: Analyze PRD high-level requirements
   └─> Winston: Generate system architecture overview
   └─> Winston: Architectural approach and patterns
   └─> Save to architecture.md (Overview section)

3. Component Design (Step 3 - Winston)
   └─> Winston: Break down into components/modules
   └─> Winston: Define component responsibilities
   └─> Winston: Specify inter-component communication
   └─> Save to architecture.md (Component Architecture section)

4. Data Models & APIs (Step 4 - Winston)
   └─> Winston: Design data models (entities, relationships)
   └─> Winston: Specify API contracts (endpoints, requests/responses)
   └─> Winston: Define integration points
   └─> Save to architecture.md (Data Models & APIs sections)

5. Non-Functional Requirements (Step 5 - Winston)
   └─> Winston: Performance requirements
   └─> Winston: Security requirements (authentication, authorization, encryption)
   └─> Winston: Reliability and availability targets
   └─> Winston: Observability strategy (logging, metrics, tracing)
   └─> Save to architecture.md (NFR section)

6. Test Strategy (Step 6 - Murat) **REQUIRED**
   └─> Murat: Analyze architecture and PRD requirements
   └─> Murat: Define test strategy and approach
   └─> Murat: Recommend test frameworks
   └─> Murat: Specify test pyramid (unit/integration/E2E ratios)
   └─> Murat: Design CI/CD pipeline
   └─> Murat: Define quality gates and coverage requirements
   └─> Murat: Specify ATDD approach
   └─> Save to architecture.md (Test Strategy section)

7. Technical Decisions (Step 7 - Winston + Murat + CIS)
   └─> Aggregate all decisions made during workflow
   └─> Format as Architecture Decision Records (ADRs)
   └─> Include rationale, alternatives, consequences
   └─> CIS agent contributions noted
   └─> Save to architecture.md (Technical Decisions section)

8. Security Gate Validation (Step 8) **MANDATORY**
   └─> SecurityGateValidator: Load architecture.md
   └─> Check authentication/authorization specification
   └─> Check secrets management strategy
   └─> Check input validation approach
   └─> Check API security measures
   └─> Check data encryption strategy
   └─> Check threat model coverage
   └─> Calculate score: (satisfied checks / total checks) × 100
   └─> IF score >= 95%: PASS (continue)
   └─> IF score < 95%: FAIL (escalate with gap report, BLOCK workflow)

9. Architecture Validation (Step 9)
   └─> Validate architecture completeness
   └─> Validate PRD traceability
   └─> Validate test strategy completeness
   └─> Generate validation report
   └─> Mark workflow as completed

10. State Update
    └─> Update workflow-status.yaml (phase = "Planning", status = "completed")
    └─> Emit event: phase.architecture.completed
    └─> Ready for Epic 4 (Solutioning Phase)
```

**CIS Agent Invocation Points:**

```
Trigger: Winston's confidence < 0.70 on strategic decision

Decision Type → CIS Agent
├─ Technical trade-off (e.g., monolith vs microservices) → Dr. Quinn
├─ UX architecture (e.g., SPA vs MPA) → Maya
├─ Product positioning (e.g., target audience prioritization) → Sophia
└─ Innovation opportunity (e.g., competitive differentiation) → Victor

Flow:
1. Winston encounters decision with low confidence
2. CISAgentRouter classifies decision type
3. Route to appropriate CIS agent
4. CIS agent applies framework (e.g., Design Thinking, Innovation Canvas)
5. Return structured recommendations with rationale
6. Winston incorporates CIS analysis into decision
7. Log CIS contribution in Technical Decisions section
```

## Non-Functional Requirements

### Performance

**Workflow Execution Speed:**
- Complete architecture workflow: <45 minutes (target from PRD)
- Winston agent invocations: <5 minutes per section
- Murat agent test strategy: <10 minutes
- Security gate validation: <5 minutes (automated checks)
- CIS agent invocations: <60 seconds per decision

**Resource Efficiency:**
- Winston agent memory: <256MB
- Murat agent memory: <256MB
- Template processing: <1 second
- State persistence: <500ms per save

**Token Optimization:**
- Winston context size: <50k tokens (PRD + onboarding + section context)
- Murat context size: <30k tokens (architecture draft + test requirements)
- CIS agent context: <20k tokens (decision context only)
- Estimated total cost: <$10 per architecture workflow (PRD target)

### Security

**Authentication & Authorization:**
- Winston and Murat agents authenticate via LLM provider API keys
- API keys stored in project secrets (not in code or config)
- Agent context isolated per project (no cross-project access)

**Security Gate Enforcement:**
- **Mandatory validation**: Cannot bypass security gate in production
- **Blocking behavior**: Workflow halts if security gate fails
- **Audit trail**: All security gate results logged with timestamp
- **Escalation required**: Human review required for failed gates

**Secrets Management:**
- LLM API keys loaded from environment variables
- Project-specific secrets in `.bmad/.secrets` (gitignored)
- No secrets in generated architecture.md document
- Redact sensitive information from logs

**Input Validation:**
- Validate PRD file path exists before workflow start
- Sanitize user inputs in escalation responses
- Validate workflow.yaml structure before execution
- Prevent path traversal in file operations

### Reliability/Availability

**State Resilience:**
- Workflow state saved after each step completion
- Atomic writes to prevent state corruption
- Resume capability from any step after crash
- State backup before destructive operations

**Error Recovery:**
- Winston agent failure: Retry 3x with exponential backoff, then escalate
- Murat agent failure: Retry 2x, escalate if test strategy critical
- Security gate failure: Generate detailed gap report, escalate (no auto-retry)
- Template processing error: Log error, use fallback template, continue

**Graceful Degradation:**
- CIS agent unavailable: Continue with Winston's original decision, log warning
- Template missing: Use inline generation, warn user
- Previous architecture exists: Offer to overwrite or merge, don't fail

**Data Durability:**
- Architecture.md committed to git after completion
- Workflow state persisted to disk (not just in-memory)
- Backup state on major step transitions
- No data loss on orchestrator crash

### Observability

**Logging Requirements:**
- **Structured logs**: JSON format with timestamp, level, context
- **Log levels**:
  - DEBUG: Agent prompts and responses (opt-in)
  - INFO: Workflow step starts/completions, agent invocations
  - WARN: Retryable errors, CIS fallbacks, optional validations skipped
  - ERROR: Failed steps, escalations, security gate failures
  - CRITICAL: Workflow corruption, unrecoverable errors

**Metrics:**
- Workflow execution time (total and per-step)
- Agent invocation count and duration (Winston, Murat, CIS agents)
- LLM token usage and estimated cost
- Security gate pass/fail rate
- Escalation count and resolution time
- Architecture validation scores

**Tracing:**
- Workflow execution trace ID (correlate all logs)
- Agent invocation trace (parent = workflow, child = agent)
- CIS decision trace (link decision → CIS agent → result)
- State transition trace (visualize workflow progress)

**Events Emitted:**
```typescript
// Workflow lifecycle
'workflow.architecture.started' { projectId, prdPath, timestamp }
'workflow.architecture.step_completed' { projectId, step, duration }
'workflow.architecture.completed' { projectId, architecturePath, duration, cost }
'workflow.architecture.failed' { projectId, step, error, escalationId }

// Agent activity
'agent.winston.started' { projectId, section, timestamp }
'agent.winston.completed' { projectId, section, duration, tokens, cost }
'agent.murat.started' { projectId, timestamp }
'agent.murat.completed' { projectId, duration, tokens, cost }
'agent.cis.invoked' { projectId, agent, decision, confidence }

// Security gate
'security_gate.started' { projectId, timestamp }
'security_gate.passed' { projectId, score, timestamp }
'security_gate.failed' { projectId, score, gaps, escalationId }

// Escalations
'escalation.created' { projectId, workflowStep, question, confidence }
'escalation.responded' { escalationId, response, timestamp }
```

## Dependencies and Integrations

**External Dependencies (from package.json and tech stack):**

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "openai": "^4.20.0",
    "simple-git": "^3.21.0",
    "yaml": "^2.3.4",
    "markdown-it": "^14.0.0",
    "fastify": "^4.25.0",
    "ws": "^8.16.0",
    "@sinclair/typebox": "^0.32.0",
    "pino": "^8.17.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0"
  }
}
```

**Internal Dependencies:**

| Story | Depends On | Reason |
|-------|-----------|--------|
| 3-1 (Winston Agent) | 1-3 (LLM Factory) | Winston requires LLM client instantiation |
| 3-2 (Murat Agent) | 1-3 (LLM Factory) | Murat requires LLM client instantiation |
| 3-3 (Workflow Executor) | 1-2 (Workflow Parser), 1-4 (Agent Pool), 1-8 (Template Processor) | Workflow execution requires parser, agents, templates |
| 3-4 (Technical Decisions Logger) | 3-1 (Winston), 3-2 (Murat) | Logs decisions from both agents |
| 3-5 (Template Processor) | 1-8 (Template Processing System) | Extends core template processor for architecture |
| 3-6 (Security Gate) | 3-5 (Template Processor) | Validates completed architecture.md |
| 3-7 (Validation Tests) | 3-3 (Workflow Executor), 3-6 (Security Gate) | Tests workflow and security gate |
| 3-8 (CIS Integration) | CIS agents (separate module), 3-1 (Winston) | Winston invokes CIS for strategic decisions |

**Integration Points:**

| System | Integration Type | Purpose | Authentication |
|--------|-----------------|---------|----------------|
| Anthropic API | REST API | Claude Sonnet for Winston agent | API Key (env var: ANTHROPIC_API_KEY) |
| OpenAI API | REST API | GPT-4 Turbo for Murat agent | API Key (env var: OPENAI_API_KEY) |
| Git | Local CLI | Commit architecture.md, state files | SSH/HTTPS (user credentials) |
| File System | Node.js fs module | Read PRD, write architecture.md, persist state | OS-level permissions |
| Event Bus | Internal | Emit workflow/agent events | N/A (internal) |
| CIS Agents | Internal function calls | Strategic decision support | N/A (internal) |

**External Service Constraints:**

- **Anthropic API**: Rate limit 500 requests/min (tier 1), 5000 requests/min (tier 2)
- **OpenAI API**: Rate limit 3000 requests/min, 90000 tokens/min (GPT-4 Turbo)
- **Token Limits**: Claude Sonnet (200k context), GPT-4 Turbo (128k context)
- **Cost per 1M tokens**: Claude Sonnet ($3 input / $15 output), GPT-4 Turbo ($10 input / $30 output)

## Acceptance Criteria (Authoritative)

**AC-3.1: Winston Agent Persona Implemented**
1. Winston agent persona defined in bmad/bmm/agents/winston.md
2. Persona includes system architecture expertise, decision-making approach, communication style
3. Winston uses Claude Sonnet 4.5 via LLM factory
4. Winston generates system overview, component design, data models, API specs, NFRs
5. Winston documents technical decisions with rationale
6. Winston assesses confidence for architectural decisions
7. Winston integrates with CIS agents for strategic decisions (<0.70 confidence)

**AC-3.2: Murat Agent Persona Implemented**
1. Murat agent persona defined in bmad/bmm/agents/murat.md
2. Persona includes test architecture expertise, quality mindset, framework knowledge
3. Murat uses GPT-4 Turbo via LLM factory
4. Murat generates comprehensive test strategy (frameworks, pyramid, CI/CD, ATDD)
5. Murat defines quality gates and coverage requirements
6. Test strategy section is REQUIRED in all architecture documents
7. Murat's test strategy addresses all PRD requirements

**AC-3.3: Architecture Workflow Executes End-to-End**
1. Workflow loads from bmad/bmm/workflows/architecture/workflow.yaml
2. Workflow executes all steps in exact order (1-9)
3. Winston and Murat agents spawned and coordinated
4. Architecture.md generated from template with all sections filled
5. Workflow state persisted after each step
6. Workflow resumes from last step after interruption
7. Workflow completes in <45 minutes with <2 escalations

**AC-3.4: Technical Decisions Logged**
1. All architectural decisions captured with context and rationale
2. Decisions formatted as ADRs (Architecture Decision Records)
3. Alternatives considered and documented
4. Decision maker identified (Winston, Murat, CIS agent, user)
5. CIS agent contributions noted and linked
6. Technical decisions section present in architecture.md
7. Decisions traceable to PRD requirements

**AC-3.5: Architecture Template Processing**
1. Template loaded from bmad/bmm/workflows/architecture/template.md
2. Variables resolved: {{project_name}}, {{date}}, {{user_name}}, etc.
3. Sections filled by Winston and Murat agent outputs
4. Markdown formatting preserved
5. Output written to docs/architecture.md
6. Architecture.md validates as well-formed markdown
7. All required sections present (system overview, components, data models, APIs, NFRs, test strategy, technical decisions)

**AC-3.6: Security Gate Validates Architecture**
1. Security gate executes after architecture workflow completes
2. Six security categories validated: authentication, secrets, input validation, API security, encryption, threat model
3. Each category scored (satisfied/unsatisfied)
4. Overall score calculated: (satisfied / total) × 100
5. Pass threshold: ≥95% score
6. If failed: Generate gap report with specific recommendations
7. If failed: Escalate to user, BLOCK progression to solutioning phase
8. Audit trail logged with timestamp and evidence

**AC-3.7: Architecture Validation Tests**
1. Architecture completeness test: All required sections present
2. PRD traceability test: All PRD requirements addressed
3. Test strategy completeness test: Frameworks, pyramid, CI/CD, ATDD defined
4. Technical decision consistency test: No contradictory decisions
5. Validation score calculated and reported
6. Tests run as part of CI/CD pipeline
7. Tests fail if architecture quality below threshold

**AC-3.8: CIS Agent Integration**
1. CISAgentRouter routes decisions to appropriate CIS agent
2. Dr. Quinn invoked for technical trade-offs (confidence <0.70)
3. Maya invoked for UX-centric architecture decisions
4. Sophia invoked for product narrative clarity
5. Victor invoked for innovation opportunities
6. CIS responses include framework-specific analysis
7. CIS recommendations integrated into technical decisions section
8. CIS invocations logged and traceable

## Traceability Mapping

| Acceptance Criteria | Spec Section | Component/API | Test Idea |
|---------------------|--------------|---------------|-----------|
| AC-3.1: Winston Agent | Services & Modules (WinstonAgent), APIs (IWinstonAgent) | WinstonAgent class, LLM factory | Unit test: Winston persona loads, integration test: Winston generates architecture sections |
| AC-3.2: Murat Agent | Services & Modules (MuratAgent), APIs (IMuratAgent) | MuratAgent class, LLM factory | Unit test: Murat persona loads, integration test: Murat generates test strategy |
| AC-3.3: Architecture Workflow | Services & Modules (ArchitectureWorkflowExecutor), Workflows & Sequencing | ArchitectureWorkflowExecutor class, WorkflowEngine | Integration test: Execute full workflow, validate architecture.md generated, state persisted |
| AC-3.4: Technical Decisions | Data Models (TechnicalDecision), Services & Modules (TechnicalDecisionLogger) | TechnicalDecisionLogger class | Unit test: ADR formatting, integration test: Decisions logged during workflow |
| AC-3.5: Template Processing | Services & Modules (ArchitectureTemplateProcessor), Workflows & Sequencing | TemplateProcessor class | Unit test: Variable substitution, integration test: Template → architecture.md |
| AC-3.6: Security Gate | Services & Modules (SecurityGateValidator), APIs (ISecurityGateValidator), Workflows & Sequencing | SecurityGateValidator class | Unit test: Each security check, integration test: Full gate validation, escalation on failure |
| AC-3.7: Validation Tests | Services & Modules (ArchitectureValidator) | ArchitectureValidator class, Vitest test suite | Unit test: Each validation rule, E2E test: Validate complete architecture |
| AC-3.8: CIS Integration | Services & Modules (CISAgentRouter), APIs (ICISAgentRouter), Workflows & Sequencing | CISAgentRouter class, CIS agents | Integration test: Route decision to Dr. Quinn, verify recommendations returned |

**PRD Requirement Traceability:**

| PRD Requirement | Architecture Section | Implementation (Stories) |
|-----------------|---------------------|--------------------------|
| FR-CORE-002: Autonomous Architecture Design | Overview, System Architecture Alignment | 3-1, 3-2, 3-3, 3-5 |
| FR-SEC-006: Mandatory Security Gate | Non-Functional Requirements (Security), Security Gate Validator | 3-6 |
| NFR-TEST-007: Test Architecture Required | Test Strategy section (Murat), Workflows & Sequencing | 3-2, 3-3 |
| FR-CIS-001: Strategic Decision Points | CIS Agent Router, Workflows & Sequencing (CIS invocation points) | 3-8 |
| NFR-PERF-001: Workflow Execution Speed (<45 min) | Non-Functional Requirements (Performance) | 3-3 (workflow optimization) |
| NFR-COST-001: LLM Cost Optimization (<$10 per architecture) | Non-Functional Requirements (Performance - Token Optimization) | 3-1, 3-2 (context optimization) |

## Risks, Assumptions, Open Questions

### Risks

**R-3.1: LLM Hallucination in Architecture Design (Severity: High)**
- **Description**: Winston or Murat agents generate invalid or incomplete architecture due to LLM limitations
- **Mitigation**:
  - Validate architecture against PRD completeness
  - Security gate enforces critical sections
  - Architecture validation tests catch gaps
  - Escalate to user if validation score <85%
- **Contingency**: Human architect reviews architecture before solutioning phase

**R-3.2: Security Gate Too Strict (Severity: Medium)**
- **Description**: 95% threshold blocks valid architectures due to false negatives
- **Mitigation**:
  - Tune threshold based on project level (higher for security-critical projects)
  - Allow user override with justification (logged for audit)
  - Iterative refinement of security checks based on feedback
- **Contingency**: Escalate to user with gap report, allow informed override

**R-3.3: CIS Agent Integration Latency (Severity: Low)**
- **Description**: CIS agent invocations add significant latency to workflow (<60s target)
- **Mitigation**:
  - Invoke CIS agents only for strategic decisions (confidence <0.70)
  - Parallel invocation if multiple decisions (not sequential)
  - Cache CIS responses for similar decisions
- **Contingency**: Make CIS integration optional, fall back to Winston's decision

**R-3.4: Winston/Murat Agent Conflicts (Severity: Medium)**
- **Description**: Winston and Murat produce contradictory recommendations (e.g., tech stack vs test framework compatibility)
- **Mitigation**:
  - Murat receives Winston's architecture draft as input (sequential, not parallel)
  - Murat validates tech stack compatibility with test frameworks
  - Conflict detection in validation tests
- **Contingency**: Escalate conflicts to user with both recommendations

**R-3.5: Cost Overrun (>$10 Budget) (Severity: Medium)**
- **Description**: Complex architectures exceed $10 cost budget due to large PRDs or multiple CIS invocations
- **Mitigation**:
  - Context optimization (only relevant PRD sections)
  - Limit CIS invocations (max 3 per workflow)
  - Monitor token usage, warn at 80% budget
- **Contingency**: Allow budget override for complex projects, track actual costs

### Assumptions

**A-3.1**: PRD document is complete and well-structured (from Epic 2)
**A-3.2**: Winston and Murat agents have access to up-to-date technology knowledge (via LLM training data)
**A-3.3**: Claude Sonnet 4.5 and GPT-4 Turbo models remain available at current pricing
**A-3.4**: CIS agents (Dr. Quinn, Maya, Sophia, Victor) are implemented and available
**A-3.5**: Git repository initialized and writable (for committing architecture.md)
**A-3.6**: User responds to escalations within reasonable timeframe (workflow pauses)
**A-3.7**: Security gate validation is automated (no manual security review required)

### Open Questions

**Q-3.1**: Should Winston and Murat work in parallel or sequentially?
- **Current Design**: Sequential (Winston → Murat)
- **Rationale**: Murat needs Winston's tech stack decisions to recommend compatible frameworks
- **Alternative**: Parallel with conflict resolution step
- **Decision**: Keep sequential for MVP, explore parallel in v1.1 if bottleneck

**Q-3.2**: How many CIS agent invocations are optimal per workflow?
- **Current Design**: Unlimited, triggered by confidence <0.70
- **Risk**: Cost overrun if many low-confidence decisions
- **Proposal**: Limit to 3 CIS invocations per workflow, batch remaining decisions for user escalation
- **Decision**: Implement limit, track CIS usage metrics

**Q-3.3**: Should security gate be configurable per project?
- **Current Design**: Fixed 95% threshold, 6 required categories
- **Use Case**: Low-risk internal tools may not need full security validation
- **Proposal**: Project-level security gate configuration (strict, standard, relaxed)
- **Decision**: Fixed for MVP (all projects same standard), add configurability in v1.1

**Q-3.4**: How to handle architecture updates after initial generation?
- **Current Design**: Workflow generates new architecture.md, overwrites existing
- **Risk**: Lose manual edits if user modified architecture after generation
- **Proposal**: Detect existing architecture, offer merge or overwrite options
- **Decision**: Implement detection and confirmation prompt in workflow step 1

**Q-3.5**: Should test strategy be mandatory for all project types?
- **Current Design**: Murat agent always generates test strategy (required)
- **Use Case**: Prototypes or research projects may not need comprehensive testing
- **Proposal**: Make Murat optional for project level 0-1, required for level 2+
- **Decision**: Required for all levels in MVP (aligns with PRD requirement), review in retrospective

## Test Strategy Summary

**Test Levels:**

1. **Unit Tests (60% coverage target)**
   - Winston agent: Persona loading, confidence assessment, decision documentation
   - Murat agent: Persona loading, test framework recommendations, quality gate definitions
   - SecurityGateValidator: Each security check category independently
   - TechnicalDecisionLogger: ADR formatting, decision aggregation
   - TemplateProcessor: Variable substitution, conditional blocks

2. **Integration Tests (30% coverage target)**
   - ArchitectureWorkflowExecutor: Full workflow execution, state persistence, resume capability
   - Winston + Murat coordination: Sequential execution, data handoff
   - CISAgentRouter: Decision routing to correct CIS agent, response integration
   - Security gate in workflow: Validation execution, escalation on failure

3. **End-to-End Tests (10% coverage target)**
   - Complete architecture workflow: PRD → architecture.md generation
   - Security gate pass/fail scenarios
   - CIS agent integration in real workflow
   - Escalation handling and resume

**Test Frameworks:**
- **Unit & Integration**: Vitest (TypeScript native, fast execution)
- **E2E**: Playwright (workflow execution, file I/O validation)
- **Mocking**: vitest mocks for LLM API calls (avoid actual API costs in tests)
- **Assertions**: @vitest/expect, custom architecture validators

**Quality Gates:**
- All tests pass (0 failures)
- Code coverage ≥80% for new code
- No critical linter errors
- Architecture validation tests pass
- Security gate tests validate all 6 categories

**CI/CD Integration:**
- Run tests on every PR
- Block merge if tests fail or coverage drops
- Report test results and coverage in PR
- Alert on test failures in main branch

**Test Data:**
- Mock PRD documents (simple, moderate, complex)
- Mock architecture outputs (valid, incomplete, invalid security)
- Mock CIS agent responses
- Test escalation scenarios

**ATDD Approach:**
- Write acceptance criteria tests BEFORE implementation
- Map each AC to executable test
- Use BDD-style test descriptions (given/when/then)
- Validate acceptance criteria with stakeholders before coding

---

**Epic 3 Technical Specification Approval:**

- [ ] Winston (Architect) - Architecture design complete and sound
- [ ] Murat (Test Architect) - Test strategy comprehensive and achievable
- [ ] Bob (Scrum Master) - Stories can be decomposed from this spec
- [ ] Chris (Product Owner) - Meets PRD requirements and vision

**Next Steps:**
1. Run solutioning workflow to decompose Epic 3 into 8 implementable stories
2. Validate story dependencies and sequencing
3. Begin Story 3-1: Winston Agent Persona Implementation

---

_This technical specification provides the authoritative blueprint for implementing Epic 3: Planning Phase Automation. All implementation decisions must trace back to this spec to ensure consistency and completeness._
