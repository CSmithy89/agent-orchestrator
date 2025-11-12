# Story 3.8: CIS Agent Integration for Architecture Decisions

Status: drafted

## Story

As the Agent Orchestrator,
I want to route low-confidence architectural decisions to specialized CIS agents (Dr. Quinn, Maya, Sophia, Victor),
So that complex strategic decisions benefit from framework-specific expertise and creative problem-solving.

## Acceptance Criteria

1. **CIS Agent Router Implementation**
   - CISAgentRouter class routes decisions to appropriate CIS agents
   - Decision routing based on decision type: technical, UX, product, innovation
   - Confidence threshold: <0.70 triggers CIS agent invocation
   - Router classifies decision type automatically
   - Router tracks CIS invocations in workflow state

2. **Dr. Quinn Integration (Technical Trade-offs)**
   - Route technical architecture trade-offs to Dr. Quinn
   - Examples: monolith vs microservices, SQL vs NoSQL, synchronous vs asynchronous
   - Dr. Quinn applies creative problem-solving frameworks
   - Returns structured analysis with pros/cons and recommendation
   - Response includes confidence score and rationale

3. **Maya Integration (UX-Centric Decisions)**
   - Route UX-related architecture decisions to Maya
   - Examples: SPA vs MPA, client-side vs server-side rendering, real-time updates strategy
   - Maya applies Design Thinking methodology
   - Returns user-centric analysis and recommendation
   - Response includes user impact assessment

4. **Sophia Integration (Product Narrative)**
   - Route product positioning decisions to Sophia
   - Examples: target audience prioritization, feature trade-offs, MVP scope
   - Sophia applies storytelling frameworks
   - Returns product narrative with strategic rationale
   - Response includes narrative consistency check

5. **Victor Integration (Innovation Opportunities)**
   - Route innovation challenges to Victor
   - Examples: competitive differentiation, disruptive opportunities, novel approaches
   - Victor applies innovation strategy frameworks
   - Returns innovation analysis with disruption potential
   - Response includes market positioning recommendation

6. **CIS Response Integration**
   - CIS recommendations integrated into Winston's decision-making
   - CIS responses logged in Technical Decisions section
   - ADRs note CIS agent contribution (e.g., "Recommendation from Dr. Quinn")
   - CIS invocations tracked in workflow metrics
   - Limit CIS invocations: maximum 3 per workflow (cost control)

7. **Error Handling and Fallback**
   - If CIS agent unavailable: Continue with Winston's original decision, log warning
   - If CIS invocation times out: Use Winston's decision, log timeout
   - If CIS invocation exceeds limit: Queue remaining decisions for user escalation
   - Graceful degradation ensures workflow can complete without CIS agents

## Tasks / Subtasks

### Task 1: Create CISAgentRouter Class (3-4 hours)

- [ ] Create `backend/src/core/cis-agent-router.ts`
- [ ] Implement CISAgentRouter class
- [ ] Define CISDecisionRequest interface (from Epic 3 tech spec lines 267-281)
- [ ] Define CISResponse interface
- [ ] Method: `routeDecision(request: CISDecisionRequest): Promise<CISResponse>`
- [ ] Method: `classifyDecisionType(decision: string): 'technical' | 'ux' | 'product' | 'innovation'`
- [ ] Track CIS invocation count (max 3 per workflow)

### Task 2: Implement Dr. Quinn Integration (2-3 hours)

- [ ] Method: `invokeDrQuinn(problem: string, context: string): Promise<CISResponse>`
- [ ] Call Dr. Quinn CIS agent via SlashCommand or direct invocation
- [ ] Pass problem statement and architectural context
- [ ] Parse Dr. Quinn's response (framework-based analysis)
- [ ] Extract recommendation, pros/cons, confidence score
- [ ] Return structured CISResponse

### Task 3: Implement Maya Integration (2-3 hours)

- [ ] Method: `invokeMaya(designQuestion: string, context: string): Promise<CISResponse>`
- [ ] Call Maya CIS agent via SlashCommand or direct invocation
- [ ] Pass UX question and architectural context
- [ ] Parse Maya's response (Design Thinking analysis)
- [ ] Extract recommendation, user impact, confidence score
- [ ] Return structured CISResponse

### Task 4: Implement Sophia Integration (2-3 hours)

- [ ] Method: `invokeSophia(narrativeNeed: string, context: string): Promise<CISResponse>`
- [ ] Call Sophia CIS agent via SlashCommand or direct invocation
- [ ] Pass product narrative question and context
- [ ] Parse Sophia's response (storytelling framework)
- [ ] Extract recommendation, narrative elements, confidence score
- [ ] Return structured CISResponse

### Task 5: Implement Victor Integration (2-3 hours)

- [ ] Method: `invokeVictor(innovationChallenge: string, context: string): Promise<CISResponse>`
- [ ] Call Victor CIS agent via SlashCommand or direct invocation
- [ ] Pass innovation challenge and context
- [ ] Parse Victor's response (innovation strategy framework)
- [ ] Extract recommendation, disruption potential, confidence score
- [ ] Return structured CISResponse

### Task 6: Integrate with Winston Agent (2-3 hours)

- [ ] Update WinstonAgent to assess decision confidence
- [ ] Method: `assessConfidence(decision: string, context: string): number`
- [ ] If confidence <0.70: Invoke CISAgentRouter
- [ ] Classify decision type and route to appropriate CIS agent
- [ ] Integrate CIS recommendation into Winston's decision
- [ ] Log CIS contribution in decision audit trail

### Task 7: Implement Error Handling (1-2 hours)

- [ ] Handle CIS agent unavailable: Fall back to Winston's decision
- [ ] Handle CIS invocation timeout: Use Winston's decision after 60s
- [ ] Handle invocation limit exceeded: Queue for user escalation
- [ ] Log all errors and fallback decisions
- [ ] Emit CIS error events for monitoring

### Task 8: Write Integration Tests (2-3 hours)

- [ ] Create `backend/tests/integration/cis-agent-router.test.ts`
- [ ] Test: Route technical decision to Dr. Quinn
- [ ] Test: Route UX decision to Maya
- [ ] Test: Route product decision to Sophia
- [ ] Test: Route innovation decision to Victor
- [ ] Test: Decision type classification
- [ ] Test: Invocation limit enforcement (max 3)
- [ ] Test: Error handling and fallback
- [ ] Verify test coverage >80%

## Dependencies

**Blocking Dependencies:**
- Story 3-1 (Winston Agent): Integration point for low-confidence decisions
- CIS Agents Module: Dr. Quinn, Maya, Sophia, Victor personas must exist

**Soft Dependencies:**
- Story 3-4 (Technical Decisions Logger): Logs CIS contributions in ADRs
- Story 2.1 (Decision Engine): Confidence scoring triggers CIS invocation

**Enables:**
- Epic 3 quality improvement: Better architectural decisions through specialized expertise

## Dev Notes

### CIS Agent Decision Types

**Technical (Dr. Quinn):**
- Architecture patterns (monolith, microservices, microkernel, etc.)
- Technology stack choices (language, framework, database)
- Communication patterns (REST, GraphQL, message queue, etc.)
- Scalability strategies (horizontal, vertical, caching, etc.)

**UX (Maya):**
- Application architecture (SPA, MPA, PWA, hybrid)
- Rendering strategy (client-side, server-side, static)
- Real-time updates approach (polling, WebSocket, SSE)
- User interaction patterns

**Product (Sophia):**
- Target audience prioritization
- Feature trade-offs and scope decisions
- MVP vs full product decisions
- Product positioning and narrative

**Innovation (Victor):**
- Competitive differentiation strategies
- Disruptive technology opportunities
- Novel architectural approaches
- Market positioning innovations

### Decision Type Classification Keywords

```typescript
const DECISION_TYPE_KEYWORDS = {
  technical: ['architecture', 'pattern', 'technology', 'framework', 'database', 'scalability', 'performance', 'microservices', 'monolith'],
  ux: ['user', 'interface', 'experience', 'rendering', 'SPA', 'MPA', 'real-time', 'interaction', 'client', 'frontend'],
  product: ['audience', 'feature', 'scope', 'MVP', 'prioritization', 'product', 'positioning', 'market fit'],
  innovation: ['differentiation', 'competitive', 'disruptive', 'novel', 'innovation', 'opportunity', 'unique']
};
```

### CISDecisionRequest Interface

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

### CISResponse Interface

```typescript
interface CISResponse {
  agent: 'dr-quinn' | 'maya' | 'sophia' | 'victor';
  recommendation: string;
  rationale: string;
  framework: string; // Framework used (e.g., "Creative Problem Solving", "Design Thinking")
  confidence: number; // CIS agent's confidence (0-1)
  alternatives?: string[];
  userImpact?: string; // Maya only
  narrativeElements?: string[]; // Sophia only
  disruptionPotential?: string; // Victor only
  timestamp: Date;
}
```

### Integration Example

**Winston encounters low-confidence decision:**
```typescript
// Winston assessing architectural decision
const confidence = await winston.assessConfidence(
  "Should we use microservices or monolithic architecture?",
  prdContext
);

if (confidence < 0.70) {
  // Route to CIS agent
  const cisRequest: CISDecisionRequest = {
    decision: "Microservices vs Monolithic architecture",
    context: prdContext,
    decisionType: 'technical',
    confidence,
    urgency: 'high',
    projectContext: {
      name: "Agent Orchestrator",
      level: 3,
      techStack: ["TypeScript", "Node.js"],
      domain: "AI/ML"
    }
  };

  const cisResponse = await cisAgentRouter.routeDecision(cisRequest);

  // Integrate CIS recommendation
  winston.integrateExternalRecommendation(cisResponse);

  // Log in decision audit trail
  winston.logDecision({
    decision: "Use microkernel architecture pattern",
    rationale: cisResponse.rationale,
    cisAgent: cisResponse.agent,
    confidence: cisResponse.confidence
  });
}
```

### References

- Epic 3 Tech Spec: `docs/epics/epic-3-tech-spec.md` (lines 125: CISAgentRouter, lines 808: AC-3.8, lines 536: CIS invocation points)
- CIS Agents: `bmad/cis/agents/` (Dr. Quinn, Maya, Sophia, Victor)
- PRD: FR-CIS-001 (Strategic Decision Points)

## Change Log

- **2025-11-12**: Story created (drafted)
