# Agent Orchestrator

![CI Status](https://github.com/CSmithy89/agent-orchestrator/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![Epics](https://img.shields.io/badge/epics-6%2F6_complete-success)
![Stories](https://img.shields.io/badge/stories-61%2F61_delivered-success)

**Production-ready autonomous BMAD workflow execution system** for 24/7 AI-driven software development.

## Overview

Agent Orchestrator is a **complete, production-ready** intelligent system that autonomously executes the BMAD (Build-Measure-Analyze-Decide) methodology for software development. Through 6 completed epics and 61 delivered stories, this system demonstrates that autonomous AI-driven development can produce production-quality software with proper architecture, testing, and human oversight.

**Status**: ✅ All 6 Epics Complete | 695+ Tests | 85% Coverage | Zero Critical Issues

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

- **[📊 Project Summary](docs/PROJECT-SUMMARY.md)** - Complete achievement report (all 6 epics, metrics, learnings)
- **[PRD](docs/PRD.md)** - Product Requirements Document
- **[Architecture](docs/architecture.md)** - System Design and Technical Decisions
- **[Epics & Stories](docs/epics.md)** - Implementation Breakdown (61 stories)
- **[UX Design](docs/ux-design-specification.md)** - UI/UX Design System
- **[Sprint Status](docs/sprint-status.yaml)** - Detailed story completion tracking

## Technology Stack

- **Backend**: Node.js 20, TypeScript 5+, Fastify 4+
- **Frontend**: React 18+, Vite 5+, shadcn/ui, Tailwind CSS 3+
- **LLM Integration**: Anthropic SDK (Claude), OpenAI SDK (GPT-4)
- **Git Operations**: simple-git 3.20+, git worktrees
- **Testing**: Vitest (60% unit, 30% integration, 10% E2E) - 695 tests

## Testing

**Local Testing Strategy**: All tests run locally due to CI/CD resource constraints. See [Local Testing Strategy](docs/local-testing-strategy.md) for complete details.

### Running Tests

```bash
cd backend

# Run all tests (unit + integration)
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Requirements

- **API Keys**: Required for integration tests (see `.env.example`)
- **Git Config**: Set `user.name`, `user.email` for commit tests
- **Coverage Targets**: >80% overall coverage

### CI/CD Pipeline

The CI/CD pipeline focuses on code quality gates:
- ✅ ESLint validation
- ✅ TypeScript type checking
- ✅ Build verification

**Note**: Integration tests run locally only. All tests must pass before creating PRs.

See [docs/local-testing-strategy.md](docs/local-testing-strategy.md) for complete testing documentation.

## Project Status

**🎉 PROJECT COMPLETE - ALL EPICS DELIVERED**

- **Phase 1-3**: ✅ Analysis, Planning, Solutioning Complete
- **Phase 4**: ✅ All 6 Epics Implemented (61/61 stories)
  - Epic 1: Foundation & Core Engine (13 stories) ✅
  - Epic 2: Analysis Phase Automation (10 stories) ✅
  - Epic 3: Planning Phase Automation (8 stories) ✅
  - Epic 4: Solutioning Phase Automation (9 stories) ✅
  - Epic 5: Story Implementation Automation (9 stories) ✅
  - Epic 6: Remote Access & Monitoring (10 stories) ✅

**Quality Metrics**:
- 695+ automated tests (85% coverage)
- 0 critical bugs
- 0 technical debt
- Production-ready codebase

See **[PROJECT-SUMMARY.md](docs/PROJECT-SUMMARY.md)** for complete details.

## Next Steps

With all 6 epics complete, you can:

1. **Deploy to Production** - System is production-ready
2. **Business Hub Platform** - 200+ page technical specification ready (`future-plans/technical-specification.md`)
3. **Open Source Release** - Prepare for community contributions
4. **Commercial Product** - Package as standalone offering

## License

UNLICENSED - Private project

---

**Built with the BMAD Methodology** | [Documentation](docs/PROJECT-SUMMARY.md) | [Architecture](docs/architecture.md)
