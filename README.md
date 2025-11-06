# Agent Orchestrator

![CI Status](https://github.com/CSmithy89/agent-orchestrator/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen)

Autonomous BMAD workflow execution system for 24/7 software development.

## Overview

Agent Orchestrator is an intelligent system that autonomously executes the BMAD (Build-Measure-Analyze-Decide) methodology for software development. It enables continuous development by orchestrating AI agents that handle requirements analysis, architecture design, story decomposition, and implementation.

## Key Features

- **Autonomous Workflow Execution**: PRD, Architecture, and Story generation without human intervention
- **Multi-Agent Orchestration**: Specialized agents (Mary, Winston, Amelia, etc.) for different development phases
- **Confidence-Based Decision Making**: AI makes 85%+ of decisions autonomously, escalating only when uncertain
- **Git Worktree Parallelism**: Multiple stories develop simultaneously in isolated branches
- **Remote Dashboard Access**: Monitor and control development from anywhere via PWA

## Project Structure

```
agent-orchestrator/
├── backend/          # Node.js/TypeScript backend (workflow engine, agent pool)
├── dashboard/        # React/Vite frontend (PWA dashboard)
├── tests/           # Shared test utilities and E2E tests
├── projects/        # Orchestrator-managed projects (gitignored)
├── logs/            # Application logs (gitignored)
├── bmad/            # BMAD framework (agents, workflows, tasks)
└── docs/            # Project documentation (PRD, architecture, epics)
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

3. **Required API Keys**:
   - Anthropic API key (for Claude models)
   - OpenAI API key (for GPT-4 models)
   - GitHub token (for repository operations)

## Development

**Backend**:
```bash
cd backend
npm run dev
```

**Dashboard**:
```bash
cd dashboard
npm run dev
```

**All workspaces**:
```bash
npm run dev
```

## Documentation

- **[PRD](docs/PRD.md)** - Product Requirements Document
- **[Architecture](docs/architecture.md)** - System Design and Technical Decisions
- **[Epics & Stories](docs/epics.md)** - Implementation Breakdown (61 stories)
- **[UX Design](docs/ux-design-specification.md)** - UI/UX Design System

## Technology Stack

- **Backend**: Node.js 20, TypeScript 5+, Fastify 4+
- **Frontend**: React 18+, Vite 5+, shadcn/ui, Tailwind CSS 3+
- **LLM Integration**: Anthropic SDK (Claude), OpenAI SDK (GPT-4)
- **Git Operations**: simple-git 3.20+, git worktrees
- **Testing**: Vitest (60% unit, 30% integration, 10% E2E)

## Project Status

**Current Phase**: Phase 4 - Implementation
**Next Story**: Story 0.1 (Project Scaffolding) - ✅ Complete
**Timeline**: 12-14 weeks to MVP

## License

UNLICENSED - Private project

---

**Built with the BMAD Methodology**
test
