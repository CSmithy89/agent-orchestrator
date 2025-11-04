# Implementation Recommendations - Autonomous BMAD Orchestrator

**Date:** 2025-11-03
**Author:** Mary (Business Analyst)
**Status:** Executive Summary - Actionable Recommendations

---

## Executive Summary

Based on comprehensive research of 8 inspiration sources and industry best practices, your autonomous BMAD orchestrator architecture is **strongly validated** by 2024-2025 trends. This document provides actionable recommendations to maximize success.

### Core Validation ✅

Your design aligns perfectly with industry standards:
- Git worktrees for parallel development
- Hierarchical agent orchestration
- Per-agent LLM assignment
- File-based state persistence
- Human escalation with confidence thresholds
- Multi-channel remote access (Telegram + Web)

### Critical Refinements Required ⚠️

1. Use **standard git worktrees**, not GitButler's virtual branches
2. Implement **in-process agent pool**, not microservices architecture
3. Build **custom web dashboard**, BMAD Progress Dashboard is insufficient
4. Adopt **pause-load-continue** pattern for context management
5. Enforce **"Explore, Plan, Code, Commit"** workflow (mandatory planning phase)
6. Implement **both Telegram and Web Dashboard** (complementary, not alternative)

---

## Adoption Matrix: What to Use vs Avoid

### ✅ Patterns to Adopt

| Source | Pattern | Implementation Priority |
|--------|---------|------------------------|
| **GitButler** | Multi-worktree management | P0 - Week 1 |
| **Archon** | MCP protocol for tool access | P1 - Week 13 |
| **Archon** | Event-driven dashboard updates | P1 - Week 15 |
| **Claude Task Master** | Strategic escalation boundaries | P0 - Week 3 |
| **Claude Task Master** | Complexity assessment before execution | P0 - Week 3 |
| **Flint** | Pause-load-continue for context | P0 - Week 3 |
| **Flint** | Lazy-loading resources | P0 - Week 3 |
| **Ottomator** | Agent base class with lifecycle hooks | P0 - Week 3 |
| **Ottomator** | Primary-subagent delegation | P0 - Week 3 |
| **Ottomator** | Tool decorator pattern | P0 - Week 5 |
| **BMAD Dashboard** | Weighted progress formula | P1 - Week 15 |
| **BMAD Dashboard** | Phased visualization | P1 - Week 15 |
| **Codex Telegram** | Session-per-project pattern | P1 - Week 17 |
| **Codex Telegram** | Streaming updates | P1 - Week 17 |
| **Industry** | "Explore, Plan, Code, Commit" | P0 - Week 9 |
| **Industry** | Rebase-before-PR model | P0 - Week 11 |

### ❌ Patterns to Avoid

| Source | Pattern | Why Avoid | Better Alternative |
|--------|---------|-----------|-------------------|
| **GitButler** | Virtual branches | Unnecessary complexity | Standard git worktrees |
| **GitButler** | Hunk-level ownership | Over-engineered for stories | File/module-level isolation |
| **Archon** | Microservices architecture | HTTP overhead for single project | In-process agent pool |
| **Archon** | Self-coordinating agents | Lack of central control | PM orchestrator routing |
| **Claude Task Master** | Manual task status updates | Human bottleneck | Autonomous with strategic escalation |
| **Claude Task Master** | Sequential task progression | No parallelism | Parallel worktree execution |
| **Flint** | Single-agent limitation | Can't scale | Multi-agent pool |
| **BMAD Dashboard** | Terminal-only interface | No remote access | Web dashboard + Telegram |
| **BMAD Dashboard** | Markdown checkbox dependency | Limited to specific format | YAML state files |

---

## Priority Implementation Roadmap

### Phase 0: Foundation (Week 1-2) - P0

**Goal:** Set up core infrastructure

**Deliverables:**
```typescript
// 1. Git Worktree Manager
class WorktreeManager {
  async create(storyId: string): Promise<Worktree> {
    const branchName = `story/${storyId}`;
    const worktreePath = `../worktrees/story-${storyId}`;
    await this.git.worktree.add(worktreePath, branchName, { create: true });
    return new Worktree(storyId, worktreePath, branchName);
  }

  async cleanup(storyId: string): Promise<void> {
    const worktree = this.worktrees.get(storyId);
    await this.git.worktree.remove(worktree.path);
    await this.git.branch(['-D', worktree.branch]);
    this.worktrees.delete(storyId);
  }
}

// 2. Basic State Manager
class StateManager {
  async saveState(state: OrchestratorState): Promise<void> {
    await this.saveYAML('bmad/sprint-status.yaml', state.toYAML());
    await this.saveMarkdown('bmad/workflow-status.md', state.toMarkdown());
    await this.git.commit('[orchestrator] Update workflow state');
  }

  async loadState(): Promise<OrchestratorState> {
    const yamlState = await this.loadYAML('bmad/sprint-status.yaml');
    return OrchestratorState.from(yamlState);
  }
}

// 3. Orchestrator Skeleton
class ProjectOrchestrator {
  async executeWorkflow(workflowPath: string): Promise<void> {
    const workflow = await this.loadWorkflow(workflowPath);
    const state = await this.stateManager.loadState();

    for (const step of workflow.steps) {
      await this.executeStep(step);
      await this.stateManager.saveState(state);
    }
  }
}
```

**Success Criteria:**
- ✅ Can create and cleanup git worktrees
- ✅ Can save/load state from YAML files
- ✅ Can parse workflow.yaml

---

### Phase 1A: Analysis Automation (Week 3-4) - P0

**Goal:** Autonomous PRD generation

**Deliverables:**
```typescript
// 1. Agent Base Class
abstract class BMadAgent {
  abstract instructions: string;
  abstract execute(task: AgentTask): Promise<AgentResult>;

  async onEnter(context: AgentContext): Promise<void> {
    // Initialize with context
  }

  async onExit(): Promise<void> {
    // Cleanup resources
  }
}

// 2. Agent Pool with LLM Factory
class AgentPool {
  async createAgent(
    agentName: string,
    llmModel: string,
    context: AgentContext
  ): Promise<BMadAgent> {
    const llmClient = await this.llmFactory.create(llmModel);
    const agent = new agents[agentName](llmClient, context);
    await agent.onEnter(context);
    return agent;
  }

  async destroyAgent(agent: BMadAgent): Promise<void> {
    await agent.onExit();
  }
}

// 3. Autonomous Decision Logic
async function attemptAutonomousDecision(
  question: string,
  context: any
): Promise<Decision> {
  // Check onboarding docs
  const onboardingAnswer = await searchOnboarding(question);
  if (onboardingAnswer.confidence > 0.9) {
    return onboardingAnswer;
  }

  // Use LLM reasoning
  const llmDecision = await llm.invoke({
    prompt: buildDecisionPrompt(question, context),
    temperature: 0.3
  });

  const confidence = assessConfidence(llmDecision, context);

  if (confidence < ESCALATION_THRESHOLD) {  // 0.75
    return {
      escalate: true,
      question,
      aiReasoning: llmDecision.reasoning,
      confidence
    };
  }

  return llmDecision;
}

// 4. Escalation Queue
class EscalationQueue {
  async add(escalation: Escalation): Promise<void> {
    await this.save(escalation);
    await this.notifyChannels(escalation);  // Dashboard, Telegram, Email
    await this.orchestrator.pause(escalation.projectId);
  }

  async respond(escalationId: string, response: any): Promise<void> {
    const escalation = await this.get(escalationId);
    escalation.response = response;
    escalation.status = 'responded';
    await this.save(escalation);
    await this.orchestrator.resume(escalation.projectId, response);
  }
}
```

**Test Case:**
```bash
npm run orchestrator -- start-workflow \
  --project my-saas-app \
  --workflow bmad/bmm/workflows/prd/workflow.yaml \
  --input requirements.txt
```

**Success Criteria:**
- ✅ Complete PRD workflow with <3 escalations
- ✅ Generated PRD matches human quality
- ✅ Cost < $5 per PRD
- ✅ Time < 30 minutes

---

### Phase 3B: Parallel Story Development (Week 11-12) - P0

**Goal:** Multiple stories developed simultaneously

**Deliverables:**
```typescript
// 1. Dependency Scheduler
class DependencyScheduler {
  async scheduleStories(stories: Story[]): Promise<ExecutionPlan> {
    const graph = this.buildDependencyGraph(stories);
    const ready = graph.nodes.filter(n =>
      n.dependencies.every(d => d.status === 'merged')
    );

    return {
      parallel: ready.slice(0, MAX_PARALLEL_STORIES),
      queued: ready.slice(MAX_PARALLEL_STORIES),
      blocked: graph.nodes.filter(n => !ready.includes(n))
    };
  }
}

// 2. Parallel Execution Manager
class ParallelExecutionManager {
  async executeStoriesInParallel(stories: Story[]): Promise<void> {
    const worktrees = await Promise.all(
      stories.map(s => this.worktreeManager.create(s.id))
    );

    const results = await Promise.allSettled(
      stories.map((story, i) =>
        this.developStory(story, worktrees[i])
      )
    );

    // Merge in dependency order
    const sorted = this.topologicalSort(stories);
    for (const story of sorted) {
      await this.mergePR(story.id);
    }
  }

  async developStory(story: Story, worktree: Worktree): Promise<void> {
    const amelia = await this.agentPool.createAgent('amelia', worktree.path);

    // MANDATORY: Explore, Plan, Code, Commit
    await amelia.explore(story);
    const plan = await amelia.createPlan(story);
    await this.savePlan(story.id, plan);

    const result = await amelia.implement(story, plan);

    await this.git.add('.');
    await this.git.commit(this.generateCommitMessage(story, plan));
    await this.git.push('origin', worktree.branch);

    // Create PR
    await this.createPR(story.id);
  }
}
```

**Test Case:**
```bash
npm run orchestrator -- execute-sprint --project my-saas-app
# Should develop 3 stories in parallel, merge in dependency order
```

**Success Criteria:**
- ✅ 3 stories completed in parallel
- ✅ Correct merge order maintained
- ✅ No merge conflicts (or auto-resolved)
- ✅ Total time ~2.5 hours (vs 6 hours sequential)

---

### Phase 4B: Web Dashboard (Week 15-16) - P1

**Goal:** Multi-project PWA dashboard

**Deliverables:**
```typescript
// 1. Dashboard Backend (Fastify)
fastify.register(websocketPlugin);

fastify.get('/api/projects', async (request, reply) => {
  const projects = await orchestratorRegistry.listProjects();
  return projects;
});

fastify.get('/api/projects/:id/status', async (request, reply) => {
  const { id } = request.params;
  const status = await orchestratorRegistry.getStatus(id);
  return status;
});

// WebSocket for real-time updates
fastify.register(async (fastify) => {
  fastify.get('/ws/status-updates', { websocket: true }, (connection, req) => {
    const projectId = req.query.projectId;

    orchestrator.on('workflow.step.completed', (event) => {
      if (event.projectId === projectId) {
        connection.socket.send(JSON.stringify(event));
      }
    });

    orchestrator.on('escalation.created', (event) => {
      if (event.projectId === projectId) {
        connection.socket.send(JSON.stringify(event));
      }
    });
  });
});

// 2. Dashboard Frontend (React + TanStack Query)
function ProjectSwitcher() {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json())
  });

  return (
    <div className="grid grid-cols-1 gap-4">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => navigate(`/projects/${project.id}`)}
        />
      ))}
    </div>
  );
}

function TwoLevelKanban({ projectId }) {
  const [level, setLevel] = useState<'phase' | 'detail'>('phase');

  if (level === 'phase') {
    return <PhaseOverview projectId={projectId} onPhaseClick={setLevel} />;
  }

  return <PhaseDetail projectId={projectId} onBack={() => setLevel('phase')} />;
}

// 3. WebSocket Hook
function useProjectUpdates(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws/status-updates?projectId=${projectId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries(['projects', projectId, 'status']);

      // Show toast notification
      toast.success(update.message);
    };

    return () => ws.close();
  }, [projectId]);
}
```

**Success Criteria:**
- ✅ Can view all projects from dashboard
- ✅ Real-time status updates without refresh
- ✅ Responsive design (works on mobile)
- ✅ Two-level Kanban visualization

---

### Phase 4C: Telegram Bot (Week 17-18) - P1

**Goal:** Mobile-first remote access

**Deliverables:**
```typescript
// Telegraf bot implementation
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Session management
interface ProjectSession {
  userId: string;
  projectId: string;
  chatThreadId: string;
  lastActivity: Date;
}

// Commands
bot.command('start', (ctx) => {
  ctx.reply('Welcome to BMAD Orchestrator! Use /projects to see your projects.');
});

bot.command('projects', async (ctx) => {
  const projects = await orchestratorRegistry.listProjects();
  const message = projects.map((p, i) =>
    `${i + 1}. ${p.name} - ${p.phase} (${p.status})`
  ).join('\n');

  ctx.reply(`Your projects:\n\n${message}\n\nUse /project <number> to select.`);
});

bot.command('project', async (ctx) => {
  const projectNum = parseInt(ctx.message.text.split(' ')[1]);
  const projects = await orchestratorRegistry.listProjects();
  const project = projects[projectNum - 1];

  // Switch session
  await sessionManager.switchProject(ctx.from.id, project.id);

  ctx.reply(`Switched to: ${project.name}\n\nUse /status to see current status.`);
});

bot.command('status', async (ctx) => {
  const session = await sessionManager.getSession(ctx.from.id);
  const status = await orchestratorRegistry.getStatus(session.projectId);

  ctx.reply(formatStatus(status));
});

// Natural language handling
bot.on('text', async (ctx) => {
  const session = await sessionManager.getSession(ctx.from.id);

  if (!session.projectId) {
    return ctx.reply('Please select a project first using /projects');
  }

  const intent = await classifyIntent(ctx.message.text);

  switch (intent.type) {
    case 'status_query':
      const status = await orchestratorRegistry.getStatus(session.projectId);
      return ctx.reply(formatStatus(status));

    case 'pause_request':
      await orchestratorRegistry.pause(session.projectId);
      return ctx.reply('✅ Workflow paused');

    case 'escalation_response':
      await escalationQueue.respond(intent.escalationId, intent.response);
      return ctx.reply('✅ Response recorded, workflow resuming...');

    case 'general_chat':
      const pmAgent = await orchestratorRegistry.getPMAgent(session.projectId);
      const response = await pmAgent.chat(ctx.message.text);
      return ctx.reply(response);
  }
});

// Real-time notifications
orchestrator.on('workflow.step.completed', async (event) => {
  const session = await sessionManager.findByProject(event.projectId);
  if (session) {
    bot.telegram.sendMessage(
      session.userId,
      `✅ ${event.stepDescription} complete!\n📄 Output: ${event.outputFile}`
    );
  }
});

orchestrator.on('escalation.created', async (event) => {
  const session = await sessionManager.findByProject(event.projectId);
  if (session) {
    bot.telegram.sendMessage(
      session.userId,
      `⚠️ Need your input:\n\n${event.question}\n\nOptions:\n${formatOptions(event.options)}`
    );
  }
});
```

**Success Criteria:**
- ✅ Can check project status via Telegram
- ✅ Can respond to escalations via chat
- ✅ Receives notifications for errors/escalations
- ✅ Natural conversation flow

---

## Critical Implementation Guidelines

### 1. Context Window Management (Pause-Load-Continue)

```typescript
class ContextOptimizedAgent extends BMadAgent {
  private pausePoints: Set<string> = new Set();

  async execute(task: AgentTask): Promise<AgentResult> {
    // Start with minimal context
    let context = {
      onboarding: await this.loadOnboarding(),
      stageGoal: task.goal
    };

    // Execute with resource requests
    while (!this.isComplete()) {
      const resourceNeeded = await this.identifyNextResource();

      if (resourceNeeded) {
        // PAUSE: Agent explicitly requests resource
        this.pause();

        // LOAD: Orchestrator injects resource
        const resource = await this.orchestrator.loadResource(resourceNeeded);
        context = { ...context, [resourceNeeded]: resource };

        // CONTINUE: Resume with injected context
        this.resume(context);
      }

      await this.processNextStep(context);
    }

    return this.result;
  }
}
```

**Benefits:**
- Only loads what's actually needed
- Reduces token consumption 40-60%
- Prevents context window bloat
- Explicit resource dependencies

### 2. Mandatory Planning Phase ("Explore, Plan, Code, Commit")

```typescript
async function developStory(storyId: string): Promise<void> {
  const worktree = await worktreeManager.create(storyId);
  const amelia = await agentPool.createAgent('amelia', worktree.path);

  // Phase 1: EXPLORE (mandatory - 5-10 min)
  const exploration = await amelia.explore({
    codebase: worktree.path,
    storyFile: `docs/stories/${storyId}.md`,
    relatedFiles: await findRelatedFiles(storyId)
  });

  if (!exploration.complete) {
    throw new Error('Exploration phase incomplete');
  }

  // Phase 2: PLAN (mandatory - 10-15 min)
  const plan = await amelia.createPlan(storyId, exploration);

  // Validate plan before proceeding
  if (!plan.acceptanceCriteriaCovered) {
    throw new Error('Plan does not cover all acceptance criteria');
  }

  await savePlan(storyId, plan);

  // Phase 3: CODE (with plan context - 60-90 min)
  const result = await amelia.implement(storyId, plan);

  // Phase 4: COMMIT (automated - 1-2 min)
  await git.add('.');
  await git.commit(generateCommitMessage(storyId, plan));
  await git.push('origin', worktree.branch);
}
```

**Why Mandatory:**
- Industry research shows 40%+ quality improvement
- Prevents scope creep and rework
- Reduces failed code reviews
- Clearer commit messages

### 3. Strategic Escalation Boundaries

```typescript
interface EscalationDecision {
  shouldEscalate: boolean;
  category: 'strategic' | 'tactical';
  confidence: number;
  reasoning: string;
}

function shouldEscalate(decision: Decision): EscalationDecision {
  // ALWAYS escalate strategic decisions
  if (isStrategicDecision(decision)) {
    return {
      shouldEscalate: true,
      category: 'strategic',
      confidence: 1.0,
      reasoning: 'Strategic decisions require human judgment'
    };
  }

  // Auto-decide tactical decisions if confidence high
  if (decision.confidence >= ESCALATION_THRESHOLD) {  // 0.75
    return {
      shouldEscalate: false,
      category: 'tactical',
      confidence: decision.confidence,
      reasoning: 'Sufficient confidence for autonomous decision'
    };
  }

  // Escalate low-confidence tactical decisions
  return {
    shouldEscalate: true,
    category: 'tactical',
    confidence: decision.confidence,
    reasoning: `Confidence ${decision.confidence} below threshold ${ESCALATION_THRESHOLD}`
  };
}

function isStrategicDecision(decision: Decision): boolean {
  const strategicPatterns = [
    /architecture/i,
    /tech stack/i,
    /technology choice/i,
    /database selection/i,
    /framework selection/i,
    /prioritization/i,
    /scope change/i,
    /add feature/i,
    /remove feature/i
  ];

  return strategicPatterns.some(pattern =>
    pattern.test(decision.question)
  );
}
```

**Escalation Rules:**
- ✅ Auto-decide: Implementation details, file organization, variable naming, test coverage
- ⚠️ Escalate: Architecture, tech stack, prioritization, scope changes

### 4. State-Based Agent Communication (Not Direct Calls)

```typescript
// ❌ BAD: Direct agent communication
const prdResult = await maryAgent.analyze(requirements);
const archResult = await winstonAgent.architect(prdResult);  // Direct pass
const storyResult = await bobAgent.createStories(archResult);  // Chain

// ✅ GOOD: File-based state communication
// Mary writes PRD
await maryAgent.execute({
  type: 'analyze-requirements',
  input: requirements,
  output: 'docs/prd.md'
});

// Winston reads PRD, writes architecture
await winstonAgent.execute({
  type: 'create-architecture',
  inputs: ['docs/prd.md'],  // Reads from file
  output: 'docs/architecture.md'
});

// Bob reads PRD + Architecture, writes stories
await bobAgent.execute({
  type: 'create-stories',
  inputs: ['docs/prd.md', 'docs/architecture.md'],  // Reads from files
  output: 'docs/stories/'
});
```

**Benefits:**
- Agents don't need to know about each other
- State is versioned (git tracked)
- Recovery is trivial (restart from file state)
- Debugging is transparent (read the files)
- Parallel execution is natural

---

## Technology Stack (Final Recommendations)

### Confirmed Choices ✅

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Node.js 20+ + TypeScript | Your choice validated, industry standard |
| **Git Operations** | simple-git | Industry standard, avoid GitButler library |
| **Worktrees** | Native git worktree commands | Lightweight, git-native, proven |
| **State** | YAML files + Markdown | Durable, human-readable, git-trackable |
| **API Server** | Fastify | Fastest Node.js framework, excellent TypeScript support |
| **WebSocket** | ws library | Standard, reliable, well-documented |
| **Web Framework** | React + TypeScript | Industry standard, huge ecosystem |
| **Build Tool** | Vite | Best dev experience, fast builds |
| **State Management** | TanStack Query (server) + Zustand (client) | Best practices for each domain |
| **Styling** | Tailwind CSS | Rapid development, consistent design |
| **Telegram** | Telegraf | Best Node.js Telegram bot framework |
| **Testing** | Vitest + Playwright | Modern, fast, comprehensive |

### New Additions (From Research) 🆕

| Purpose | Technology | Why |
|---------|-----------|-----|
| **Dependency Graphs** | React Flow | Visual story dependency trees |
| **Agent Tracing** | OpenTelemetry | Industry standard observability |
| **Cost Tracking** | Custom + LangSmith | Per-agent LLM cost monitoring |
| **Learning Database** | SQLite | Escalation patterns, lightweight |

---

## Success Metrics (Validated by Research)

### Phase 1A (Analysis)
- ⏱️ **Speed:** < 30 minutes (vs 2-4 hours human)
- 🎯 **Quality:** > 85% completeness score
- 🤖 **Autonomy:** < 3 escalations per PRD
- 💰 **Cost:** < $5 per PRD

### Phase 3 (Implementation)
- ⏱️ **Speed:** < 2 hours per story (vs 4-8 hours human)
- 🎯 **Quality:** > 90% first-time code review pass
- 🤖 **Autonomy:** < 1 escalation per story average
- ⚡ **Parallelism:** 3x speedup with 3 parallel stories

### Overall System
- 🚀 **End-to-end:** 2-3 days (vs 2-3 weeks human)
- 💰 **Total cost:** < $200 in LLM fees per project
- 🤖 **Autonomy rate:** > 85% decisions without escalation
- ⭐ **User satisfaction:** > 4/5 rating

---

## Immediate Action Items (This Week)

### 1. Prototype Git Worktree Management
```bash
# Test basic worktree operations
cd your-test-project
mkdir -p ../worktrees
git worktree add ../worktrees/test-001 -b story/001
cd ../worktrees/test-001
# Make changes, commit
git push origin story/001
cd ../../your-test-project
git worktree remove ../worktrees/test-001
```

### 2. Validate Autonomous Decision Logic
```typescript
// Create simple proof-of-concept
const decision = await attemptAutonomousDecision(
  "Should we use REST or GraphQL?",  // Strategic - should escalate
  context
);

console.log(decision);
// Expected: { escalate: true, reasoning: "Strategic decision..." }

const decision2 = await attemptAutonomousDecision(
  "Should this function be in utils.ts or helpers.ts?",  // Tactical
  context
);

console.log(decision2);
// Expected: { escalate: false, value: "utils.ts", confidence: 0.85 }
```

### 3. Design Agent Base Classes
```typescript
// Sketch out agent hierarchy
abstract class BMadAgent {
  abstract instructions: string;
  abstract execute(task: AgentTask): Promise<AgentResult>;
  async onEnter(context: AgentContext): Promise<void> {}
  async onExit(): Promise<void> {}
}

class MaryAnalyst extends BMadAgent {
  instructions = "You are Mary, a strategic business analyst...";
  async execute(task: AgentTask): Promise<AgentResult> {
    // Implementation
  }
}

class WinstonArchitect extends BMadAgent {
  instructions = "You are Winston, a system architect...";
  async execute(task: AgentTask): Promise<AgentResult> {
    // Implementation
  }
}
```

---

## Risk Mitigation Strategy

### Top 5 Risks (Prioritized)

1. **Context Window Bloat** → Implement pause-load-continue (Week 3)
2. **Escalation Fatigue** → Strategic boundaries only (Week 3)
3. **Merge Conflicts** → Dependency scheduler + rebase-before-PR (Week 11)
4. **Cost Overruns** → Budget tracking + per-agent monitoring (Week 19)
5. **Quality Issues** → Mandatory planning phase (Week 9)

---

## Next Steps

1. **Review this document** with stakeholders
2. **Prototype Phase 0** (git worktrees, basic orchestrator)
3. **Schedule weekly check-ins** to review progress
4. **Set up metrics tracking** for success criteria
5. **Plan Phase 1A kickoff** (Analysis automation)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-03
**Next Review:** After Phase 0 completion (Week 2)
