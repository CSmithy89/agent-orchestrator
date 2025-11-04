# Product Brief: Agent Orchestrator

**Date:** November 3, 2025
**Author:** Chris
**Context:** Software Development (Level 3 Complex System)

---

## Executive Summary

The Agent Orchestrator is an autonomous system that executes the BMAD (Building Modern Applications with Data) methodology using AI agents, enabling software development to continue 24/7 from anywhere without requiring constant human presence at a computer.

**The Core Problem:** Developers using BMAD love its structured, detailed approach but are constrained by being physically tied to a computer. Work stops when they sleep or switch machines, and there's no single source of truth accessible from anywhere.

**The Solution:** Leverage the Claude Agent SDK to create an autonomous orchestrator that manages AI agents executing BMAD workflows, including git worktree management and PR automation, accessible remotely from any device.

**Key Innovations:**
1. **Per-Agent LLM Assignment** - Each agent (Mary, Winston, Amelia, etc.) can use different LLMs optimized for their role
2. **Phase-Based Autonomy** - Complete entire phases autonomously with gates only between phases
3. **Git Worktree Parallelism** - Multiple stories developed simultaneously in isolated worktrees
4. **PWA Command Center** - Full-featured Progressive Web App accessible from any device
5. **Fresh Context Per Stage** - New agent instances prevent context bloat while maintaining continuity

---

## Core Vision

### Problem Statement

**Current Reality with BMAD:**
Developers using the BMAD methodology face critical constraints:

1. **Physical Dependency** - Must be physically present at a computer to execute workflows
2. **Device Fragmentation** - Constantly switching between computers creates confusion and lost context
3. **No Single Source of Truth** - Project state scattered across different machines
4. **Human Presence Required** - Work stops when the developer sleeps or steps away
5. **Manual Git Operations** - Worktree management, branch creation, and PR processes require manual intervention
6. **Context Loss** - Switching devices or taking breaks means re-establishing context

**The Constraint:**
You love BMAD's structured, detailed approach to software development, but the methodology requires constant human presence and interaction. The project can't continue while you sleep. You can't check status from your phone. Switching computers means rebuilding context.

### Problem Impact

**Time Lost:**
- 8+ hours/day when sleeping (project completely stopped)
- 2-4 hours/day context switching between machines
- 1-2 hours/day manual git operations (worktrees, PRs, merges)

**Productivity Impact:**
- Projects that could take days stretch to weeks
- Can't leverage "always-on" AI capabilities
- Momentum lost between sessions
- Can't monitor or adjust project while away from desk

**Opportunity Cost:**
- Missing the promise of autonomous AI development
- Can't scale to multiple concurrent projects
- Limited by human availability, not AI capabilities

### Why Existing Solutions Fall Short

**Current BMAD (Manual Mode):**
- ✅ Structured, rigorous methodology
- ✅ High-quality outputs
- ❌ Requires constant human presence
- ❌ Tied to single computer
- ❌ Work stops when developer unavailable

**Generic AI Coding Tools (Cursor, Copilot, etc.):**
- ✅ Help with code generation
- ❌ No structured methodology
- ❌ Don't manage entire project lifecycle
- ❌ No multi-agent orchestration
- ❌ Limited workflow automation

**Project Management AI Tools (Motion, Asana AI, etc.):**
- ✅ Task automation and scheduling
- ❌ Don't write code or manage development
- ❌ Not designed for software development lifecycle
- ❌ No git integration or technical workflows

**Multi-Agent Frameworks (LangGraph, CrewAI, etc.):**
- ✅ Support agent orchestration
- ❌ Generic frameworks, not methodology-specific
- ❌ Require significant custom development
- ❌ No remote accessibility built-in
- ❌ Don't implement BMAD patterns

**Gap in Market:**
No solution combines:
- Structured software development methodology (BMAD)
- Autonomous multi-agent execution
- Remote accessibility from any device
- Full git workflow automation
- 24/7 continuous operation

### Proposed Solution

**The Agent Orchestrator** is an autonomous system that:

1. **Executes BMAD Workflows Autonomously**
   - Runs Analysis → Planning → Solutioning → Implementation phases
   - Orchestrates multiple specialized AI agents (Mary, Winston, Amelia, etc.)
   - Maintains BMAD methodology rigor and quality gates

2. **Works While You Sleep**
   - 24/7 autonomous execution
   - Continues development through the night
   - Progresses through workflows without human intervention
   - Escalates only when genuinely needed (not for every decision)

3. **Accessible From Anywhere**
   - Progressive Web App (PWA) works on any device
   - Desktop, tablet, and mobile access from single app
   - Single source of truth in cloud-accessible repository
   - Check status, review progress, provide approvals from phone/tablet
   - Install on home screen, works offline-first

4. **Automates Git Operations**
   - Creates and manages git worktrees for parallel story development
   - Generates PRs automatically when stories complete
   - Handles branch management and merge orchestration
   - Maintains clean git history following best practices

5. **Leverages Claude Agent SDK**
   - Production-ready agent infrastructure (same as Claude Code)
   - Model Context Protocol (MCP) for tool integrations
   - Per-agent LLM assignment for cost/quality optimization
   - Proven patterns from production systems

### Key Differentiators

**vs. Manual BMAD:**
- ⚡ **10x faster** - 24/7 execution vs. 8 hours/day
- 🌐 **Work from anywhere** - Not tied to desk
- 🔄 **Continuous progress** - Work continues while you sleep
- 🤖 **Automation** - Git operations, PRs, workflow execution

**vs. Generic AI Tools:**
- 📋 **Structured methodology** - BMAD rigor, not ad-hoc
- 🎯 **End-to-end orchestration** - Full project lifecycle
- 👥 **Multi-agent coordination** - Specialized agents for each role
- 📊 **Quality gates** - Automated validation throughout

**vs. Project Management AI:**
- 💻 **Actually writes code** - Not just task management
- 🔧 **Technical workflows** - Git, testing, deployment
- 🏗️ **Architecture-aware** - Understands software design
- 📝 **Generates docs** - PRDs, architecture, stories

**vs. Multi-Agent Frameworks:**
- 🎓 **Methodology-native** - BMAD patterns built-in
- 📱 **Remote-first** - Web + Telegram interfaces
- 🚀 **Ready to use** - Not a framework to build on
- 🔐 **Project isolation** - One orchestrator per project

**The Unique Combination:**
- BMAD methodology rigor
- + Claude Agent SDK power
- + Remote accessibility
- + 24/7 autonomous execution
- + Full git automation
- = **Software development that never stops**

---

## Technical Architecture

### Core Architectural Principles

**From comprehensive brainstorming session (75+ ideas explored):**

1. **Phase-Boundary Gating**
   - **Phases 1-3:** Complete entire phase autonomously → Human gate → Next phase
   - **Phase 4 (Implementation):** Different pattern - Story-level gates for iterative development
   - Autonomy boundary = Phase boundary (not arbitrary checkpoints)

2. **Parameter-Driven Execution**
   - Project onboarding captures: Cost constraints, detail level, workflow selection, MVP vs Enterprise scope
   - All parameters defined upfront enable true autonomous execution
   - No mid-phase parameter changes required

3. **Fresh Context Per Stage**
   - Spawn new agent instance for each workflow stage
   - Prevents context window bloat (cost savings + focus)
   - Only loads relevant previous docs for current stage

4. **State in Files, Not Memory**
   - All state persisted to markdown/YAML files
   - Orchestrator can restart anytime without losing work
   - Git-versioned state for complete audit trail

5. **One Orchestrator Per Project**
   - Complete isolation between projects
   - No resource contention
   - Independent scaling

### 4-Phase BMM Architecture

**Phase 1: Analysis**
- Workflows: brainstorming, research, product-brief, PRD generation
- Agent: Mary (Business Analyst)
- Output: Comprehensive PRD
- Gate: Human approval to proceed to Planning

**Phase 2: Planning**
- Workflows: PRD refinement, create-epics-and-stories, UX design (if UI), tech-spec (levels 0-1)
- Agents: Winston (PM), Sophia (UX Designer)
- Output: Epic breakdown, user stories, UX specs
- Gate: Human approval to proceed to Solutioning

**Phase 3: Solutioning**
- Workflows: architecture, solutioning-gate-check
- Agent: Amelia (Architect)
- Output: Technical architecture, decision log
- Gate: Human approval to proceed to Implementation

**Phase 4: Implementation** *(Different Pattern)*
- Workflows: sprint-planning, create-story, dev-story, code-review, story-done
- Agents: Bob (Dev), Tea (Test Architect), John (Scrum Master)
- Output: Working code, PRs, deployed features
- Gates: Per-story gates (not phase-level)

### Technology Stack (Validated by Research)

**Agent Runtime:**
- Claude Agent SDK (production-ready, same foundation as Claude Code)
- Model Context Protocol (MCP) for tool integrations
- Per-agent LLM assignment via project-config.yaml

**Core Components:**
1. **Project Orchestrator** - Execute workflows, manage state, route to agents
2. **Agent Pool** - Spawn/destroy agents with configured LLMs
3. **Workflow Engine** - Interpret workflow.yaml files, execute steps
4. **State Manager** - Persist to files, enable restarts
5. **Git Worktree Manager** - Parallel story development
6. **Escalation Queue** - Handle ambiguous decisions

**Frontend:**
- Progressive Web App (PWA)
- React + Vite for fast development
- Tailwind CSS for styling
- WebSocket for real-time updates
- Two-level Kanban: Phases → Stories/Tasks

**Backend:**
- TypeScript/Node.js (better web ecosystem than Python)
- Fastify (high-performance web framework)
- File-based state (markdown + YAML)
- GitHub API for PR automation

**Per-Agent LLM Assignment:**
```yaml
# Example from project-config.yaml
agent_assignments:
  mary:    # Business Analyst
    model: "claude-sonnet-4-5"
    reasoning: "Strong reasoning for requirements analysis"

  winston: # Product Manager
    model: "claude-sonnet-4-5"
    reasoning: "Strategic thinking for PRD"

  amelia:  # Architect
    model: "claude-opus-4"
    reasoning: "Deep technical reasoning for architecture"

  bob:     # Developer
    model: "gpt-4-turbo"
    reasoning: "Fast code generation, cost-effective"

  john:    # Scrum Master
    model: "claude-haiku"
    reasoning: "Simple coordination, cost savings"
```

### Feasibility Validation (Technical Research)

**✅ HIGHLY FEASIBLE** - Validated by 36+ sources

**Market Evidence:**
- Gartner: 40% of enterprises will use agents by 2026 (up from <5%)
- Multi-agent systems: 45% faster problem resolution, 60% more accurate outcomes
- Production systems processing 1M+ operations daily exist

**Technology Evidence:**
- Claude Agent SDK: Production-ready, powers Claude Code
- MCP: Industry standard (OpenAI, Google DeepMind adopted in 2025)
- Orchestration patterns: Battle-tested (centralized, hierarchical, event-driven)

**Key Challenges (With Solutions):**
1. **75% of systems struggle beyond 5 agents** → Use hierarchical patterns, start with 5 core agents
2. **Context engineering is hardest** → Detailed task descriptions, fresh context per stage
3. **Debugging non-determinism** → OpenTelemetry traces, correlation IDs, audit trails

**Proven Benchmarks:**
- Claude Opus 4 with Sonnet 4 subagents: 90.2% success on complex tasks
- Netflix/Amazon: 50% reduction in deployment time with agent orchestration
- Ellipsis: 15 months in production with LLM agents

---

## Target Users

### Primary Users

**Developer Persona: "Solo Technical Founder"**

**Profile:**
- Building startups or side projects solo
- Comfortable with BMAD methodology
- Values structured approach but limited by time
- Wants to leverage AI but maintain quality
- Needs to balance multiple responsibilities (day job, family, etc.)

**Current Situation:**
- Uses BMAD manually when at computer
- Loses 8-12 hours/day when away from desk
- Frustrated by slow project progress
- Can't monitor projects while traveling or at day job
- Juggling multiple projects, none moving fast enough

**Pain Points:**
- "I love BMAD but can only work 2-3 hours/evening"
- "Project progress stops when I close my laptop"
- "I wish development continued while I sleep"
- "Switching computers means losing context"
- "I can't check project status from my phone"

**What They Value Most:**
- **Acceleration** - Projects complete 10x faster
- **Freedom** - Not chained to desk
- **Quality** - BMAD rigor maintained
- **Visibility** - Monitor from anywhere
- **Momentum** - Continuous progress

**Success Looks Like:**
- Start project Monday morning
- Let agents work all week (including nights)
- Check progress via PWA on phone during commute
- Review and approve phase gates remotely from PWA
- Ship to production by Friday

**Technical Comfort:**
- Understands git workflows
- Comfortable with command line
- Familiar with Claude/AI tools
- Can review code and architecture
- Knows when to trust AI vs. verify

---

## MVP Scope

### Core Features (Must-Have for Launch)

**1. BMAD Phase 1-3 Autonomous Execution**
- Execute Analysis phase fully (brainstorming, research, product brief)
- Execute Planning phase fully (PRD, epics, stories)
- Execute Solutioning phase fully (architecture, gate checks)
- Phase-level human approval gates
- State persistence in markdown/YAML files

**2. Multi-Agent Orchestration**
- Support 5 core BMAD agents: Mary (Analyst), Winston (PM), Amelia (Architect), Bob (Dev), John (SM)
- Route workflows to appropriate agents
- Fresh context per workflow stage
- Agent communication via shared project state

**3. Remote Access via PWA (Progressive Web App)**
- **Multi-Project Command Center** - Manage multiple projects from single interface
- **Project Switcher** - Quick navigation between active projects
- **Per-Project View** featuring:
  - Two-level Kanban (Phases → Stories/Tasks)
  - Natural language chat with PM agent for each project
  - Real-time updates via WebSocket
  - Story dependency visualization
  - Customizable push notifications
- **Install on any device** - Desktop, tablet, phone home screen
- **Offline-first architecture** - Works without connection, syncs when online
- **Native-like experience** - No app store needed, automatic updates

**4. Git Worktree Management (Phase 4)**
- Create worktrees for parallel story development
- Manage up to 3 concurrent stories
- Basic PR generation when stories complete
- Sequential merge to main branch

**5. Essential Observability**
- Workflow execution logs
- Agent decision audit trail
- Progress tracking per phase/workflow
- Error notifications via PWA push notifications

**6. Single Project Support**
- One orchestrator instance per project
- Project configuration via YAML
- Repository-based state storage
- Local or GitHub repository support

### Out of Scope for MVP

**Deferred to Phase 2:**
- Multi-project coordination
- Advanced LLM assignment strategies
- Complex dependency graphs for parallel stories
- Custom workflow creation
- Advanced cost optimization
- Integration with external PM tools
- SSO/multi-user support

**Future Vision Features:**
- AI-powered cost/quality optimization
- Intelligent workflow recommendations
- Cross-project learning and patterns
- Marketplace for custom agents
- Enterprise features (SSO, compliance, audit)
- Self-healing error recovery
- Predictive timeline estimation

### MVP Success Criteria

**Must Achieve:**
1. Successfully complete Phases 1-3 autonomously for sample project
2. Remote approval of phase gates via PWA (from mobile)
3. Generate valid PRs from completed stories
4. Run continuously for 48+ hours without human intervention
5. Zero data loss (all state persisted correctly)

**Quality Bar:**
1. BMAD outputs match or exceed manual quality
2. <10% escalation rate (90%+ decisions autonomous)
3. Agent execution cost <$50 per phase
4. System uptime >95%

**User Validation:**
- Solo founder completes project 5x faster than manual BMAD
- Can monitor and approve from phone via PWA successfully
- Trusts system enough to "let it run overnight"
- Would recommend to other BMAD users
- PWA feels native, works offline, syncs seamlessly

---

## Implementation Roadmap

### Top 3 Immediate Priorities (From Brainstorming Session)

**Priority #1: Phase 1A MVP - Single Phase Autonomous Execution (Weeks 1-3)**

**Rationale:** Must prove core concept works before building complexity

**Scope:**
- Execute Phase 1 (Analysis) workflows autonomously from onboarding to PRD output
- Validates fundamental architecture pattern
- Foundation for all future work

**Deliverables:**
1. Core orchestrator (workflow execution engine)
2. Parameter capture system (project onboarding)
3. Integration of 2-3 Phase 1 workflows (brainstorming, product-brief, PRD)
4. Phase gate (human approval mechanism)
5. Test with real project (dogfood on this orchestrator itself!)

**Success Metrics:**
- <3 escalations per phase
- <24 hour execution time
- PRD quality matches manual BMAD output

---

**Priority #2: Simple PWA Monitoring Dashboard (Week 4)**

**Rationale:** Visibility builds trust. Users won't adopt autonomous execution if it's a black box.

**Scope:**
- Basic dashboard showing "Phase 1 in progress, 2/4 workflows complete"
- Real-time updates via WebSocket
- Simple phase-level Kanban view
- Escalation notification system

**Deliverables:**
1. File-watching backend (monitors workflow-status.yaml)
2. React frontend with Kanban view
3. WebSocket for live updates
4. PWA setup (offline-capable, installable)

**Timeline:** 5 days
- Days 1-2: Backend (file watching, WebSocket)
- Days 3-4: Frontend (React dashboard, Kanban)
- Day 5: PWA setup, deployment, testing

---

**Priority #3: Confidence Scoring & Smart Escalation (Weeks 6-7)**

**Rationale:** Autonomous execution requires knowing when to ask for help. Bridge between "fully manual" and "fully autonomous".

**Scope:**
- Score every autonomous decision (0-100% confidence)
- Escalate to human when <70% confidence
- Learn optimal threshold from human overrides

**Deliverables:**
1. Confidence calculation algorithm
2. Decision point identification
3. Escalation UI in PWA
4. Analytics to track escalation accuracy
5. Learning system (adjust threshold based on outcomes)

**Timeline:** 2 weeks
- Week 6: Confidence scoring logic + integration
- Week 7: Escalation UI + learning system

---

### Beyond MVP: Future Phases

**Phase 2 (Months 4-6): Scale & Sophistication**
- Hierarchical multi-agent system (Orchestrator → Coordinators → Workers)
- Support 10-15 agents across multiple domains
- Complex workflow patterns (cyclic, conditional)
- Enhanced observability (OpenTelemetry, tracing)
- Human-in-the-loop for critical decisions

**Phase 3 (Months 7-12): Production-Grade**
- Event-driven architecture for scalability
- Agent marketplace (custom agent types)
- Multi-tenancy support
- Enterprise security and compliance
- API for external integrations
- Cost management and quotas

**Future Innovations (Moonshots):**
1. **Speculative Execution** - Run all probable future workflows simultaneously, merge winners
2. **Expert Agent Network** - Escalate to specialized AI experts instead of humans
3. **Continuous Context** - Single agent instance lives through entire project (1M+ token windows)
4. **Dual-State System** - Rich graph DB for AI reasoning, markdown for humans
5. **Multi-Tenant Learning** - Single orchestrator serves 1000+ projects, learns from all

---

## Supporting Materials

### Referenced Documents

This product brief synthesizes insights from:

**1. Brainstorming Session Results (2025-11-03)**
- **Techniques Used:** First Principles Thinking, SCAMPER, Six Thinking Hats, Assumption Reversal
- **75+ Ideas Generated** across immediate opportunities, future innovations, and moonshots
- **Key Insights:**
  - Phase boundaries as natural gates (not arbitrary checkpoints)
  - Parameter-driven execution enables true autonomy
  - State dualism - AI needs graphs, humans need markdown
  - Risk-based gating > phase-based gating
  - Collaborative amplification > full autonomy (AI generates, human chooses)
  - Parallel execution critical for 10x speed goal
  - Trust through transparency (confidence scores, audit trails)

**2. Technical Research Report (2025-11-03)**
- **36+ Sources Analyzed** from 2025 industry research
- **Validated Feasibility:** Highly feasible with proven technology stack
- **Key Findings:**
  - AI PM tools: Success pattern = focus on core problems (Motion, Asana)
  - AI PM tools: Failure pattern = feature bloat (ClickUp), innovation gap
  - Claude Agent SDK: Production-ready, 90.2% success on complex tasks
  - Multi-agent orchestration: 45% faster, 60% more accurate vs single-agent
  - Market: 40% of enterprises adopting agents by 2026 (Gartner)
  - Challenges: 75% fail beyond 5 agents, context engineering hardest
  - Solutions: Hierarchical patterns, detailed task descriptions, fresh context per stage
- **Production Evidence:** Systems processing 1M+ operations daily (Emergent Methods)

**3. Technical Design Document (2025-11-03)**
- **Complete System Architecture** with 6 core components
- **Implementation Details:**
  - ProjectOrchestrator class structure
  - Agent Pool management patterns
  - Workflow Engine based on workflow.xml
  - State Manager with file-based persistence
  - Git Worktree Manager for parallel development
  - Escalation Queue for human-in-the-loop
- **LLM Assignment Strategy:** Per-agent configuration via project-config.yaml
- **PWA Architecture:** Multi-project command center with per-project views
- **Security:** Isolation, audit trails, least privilege

### Key Technical Insights

**From Research:**
- Multi-agent systems achieve 45% faster problem resolution
- 75% of systems struggle beyond 5 agents (use hierarchical patterns)
- Context engineering is hardest challenge (solution: detailed task descriptions)
- Claude Agent SDK is production-ready (powers Claude Code)

**From Technical Design:**
- One orchestrator per project for complete isolation
- Agent-level LLM assignment for cost/quality optimization
- State in files, not memory (durability)
- Git worktrees enable parallel story development
- Escalate late (attempt autonomous decisions first)

**Market Validation:**
- Gartner: 40% of enterprises will use agents by 2026
- Production systems: Processing 1M+ operations daily
- Real-world examples: Finance agents, customer support, SRE automation
- Growing Claude Agent SDK community and examples

---

_This Product Brief captures the vision for the Agent Orchestrator - a system that liberates BMAD methodology from physical constraints, enabling autonomous 24/7 software development accessible from anywhere._

_Created through collaborative discovery with Chris on November 3, 2025._

_Next: PRD will transform this brief into detailed requirements and epic definitions._
