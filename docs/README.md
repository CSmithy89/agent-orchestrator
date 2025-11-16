# Agent Orchestrator Documentation

**Navigation guide for all project documentation**

## 🎯 Start Here

- **[📊 PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)** - Complete achievement report (all 6 epics, 61 stories, metrics, learnings)
- **[PRD.md](PRD.md)** - Product Requirements Document
- **[architecture.md](architecture.md)** - System Architecture & Technical Design
- **[sprint-status.yaml](sprint-status.yaml)** - Story completion tracking (all epics)

## 📋 Project Planning Documents

### Product Requirements
- [PRD.md](PRD.md) - Complete product requirements and vision

### Architecture & Design
- [architecture.md](architecture.md) - System architecture overview
- [adr/](adr/) - Architecture Decision Records (6 ADRs)
  - [ADR-001: Fastify for API Server](adr/adr-001-use-fastify-for-api-server.md)
  - [ADR-002: OpenAPI Schema Generation](adr/adr-002-openapi-schema-type-generation.md)
  - [ADR-003: React + Vite + TanStack Query](adr/adr-003-react-vite-tanstack-query.md)
  - [ADR-004: WebSocket Real-Time Updates](adr/adr-004-websocket-real-time-updates.md)
  - [ADR-005: D3.js Dependency Visualization](adr/adr-005-d3js-dependency-visualization.md)
  - [ADR-006: Playwright E2E Testing](adr/adr-006-playwright-e2e-testing.md)

## 🏗️ Epic Documentation

### Technical Specifications
All epic tech specs located in [epics/](epics/):
- [epic-1-tech-spec.md](epics/epic-1-tech-spec.md) - Foundation & Core Engine
- [epic-2-tech-spec.md](epics/epic-2-tech-spec.md) - Analysis Phase Automation
- [epic-3-tech-spec.md](epics/epic-3-tech-spec.md) - Planning Phase Automation
- [epic-4-tech-spec.md](epics/epic-4-tech-spec.md) - Solutioning Phase Automation
- [epic-5-tech-spec.md](epics/epic-5-tech-spec.md) - Story Implementation Automation
- [epic-6-tech-spec.md](epics/epic-6-tech-spec.md) - Remote Access & Monitoring

### Retrospectives
All epic retrospectives located in [retrospectives/](retrospectives/):
- [epic-1-retrospective.md](retrospectives/epic-1-retrospective.md) - Foundation learnings
- [epic-2-retrospective.md](retrospectives/epic-2-retrospective.md) - Analysis automation insights
- [epic-3-retrospective.md](retrospectives/epic-3-retrospective.md) - Planning automation insights
- [epic-4-retrospective.md](retrospectives/epic-4-retrospective.md) - Solutioning insights
- [epic-5-retrospective.md](retrospectives/epic-5-retrospective.md) - Implementation insights
- [epic-6-retrospective.md](retrospectives/epic-6-retrospective.md) - Dashboard & monitoring insights

### Stories (Archived)
All 61 completed stories archived in [archive/stories/](archive/stories/) organized by epic:
- Epic 1: 13 stories (Foundation & Core Engine)
- Epic 2: 10 stories (Analysis Phase Automation)
- Epic 3: 8 stories (Planning Phase Automation)
- Epic 4: 9 stories (Solutioning Phase Automation)
- Epic 5: 9 stories (Story Implementation Automation)
- Epic 6: 10 stories (Remote Access & Monitoring)

## 📚 Technical Guides

### Testing
- [testing-guide.md](testing-guide.md) - Overall testing strategy
- [local-testing-strategy.md](local-testing-strategy.md) - Local test execution approach
- [integration-testing-strategy.md](integration-testing-strategy.md) - Integration test patterns
- [test-setup-guide.md](test-setup-guide.md) - Test environment setup
- [guides/e2e-testing-patterns-guide.md](guides/e2e-testing-patterns-guide.md) - E2E testing best practices

### Implementation Patterns
- [guides/type-guard-library-guide.md](guides/type-guard-library-guide.md) - Type safety patterns
- [guides/websocket-monitoring-guide.md](guides/websocket-monitoring-guide.md) - WebSocket implementation
- [guides/websocket-reconnection-guide.md](guides/websocket-reconnection-guide.md) - Reconnection handling
- [guides/d3-react-component-cookbook.md](guides/d3-react-component-cookbook.md) - D3.js + React patterns
- [guides/bundle-size-monitoring-guide.md](guides/bundle-size-monitoring-guide.md) - Performance optimization
- [llm-provider-patterns.md](llm-provider-patterns.md) - LLM integration patterns
- [async-patterns-guide.md](async-patterns-guide.md) - Async/await best practices

### Operations
- [ci-cd.md](ci-cd.md) - CI/CD pipeline overview
- [ci.md](ci.md) - Continuous integration setup
- [ci-secrets-management.md](ci-secrets-management.md) - Secrets handling
- [git-worktree-cheatsheet.md](git-worktree-cheatsheet.md) - Git worktree commands
- [implementation-workflow-guide.md](implementation-workflow-guide.md) - Development workflow

## 🎓 Process Documentation

### Methodology
- [definition-of-done.md](definition-of-done.md) - Story completion criteria
- [enhancement-incorporation-guide.md](enhancement-incorporation-guide.md) - Feature addition process
- [dependency-migration-checklist.md](dependency-migration-checklist.md) - Dependency upgrade process

### Coverage & Quality
- [fr-coverage-matrix.md](fr-coverage-matrix.md) - Functional requirements coverage

## 📦 Archive

Historical documents and completed work:
- [archive/stories/](archive/stories/) - All 61 completed story files organized by epic
- [archive/planning/](archive/planning/) - Initial planning documents (brainstorming, product brief, research)
- [archive/reports/](archive/reports/) - Historical validation and readiness reports
- [archive/ux/](archive/ux/) - Original UX specification
- [archive/working-files/](archive/working-files/) - Temporary analysis and working documents

## 🔧 Templates

Reusable document templates:
- [templates/adr-template.md](templates/adr-template.md) - Architecture Decision Record template
- [templates/story-template.md](templates/story-template.md) - User story template

## 📊 Quick Stats

- **Epics Completed**: 6/6 (100%)
- **Stories Delivered**: 61/61 (100%)
- **Test Coverage**: 85% (695+ tests)
- **Documentation Files**: 100+ markdown files
- **ADRs**: 6 architecture decisions documented
- **Lines of Code**: ~35,000 (production) + ~15,000 (tests)

## 🚀 Next Steps

See [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) for detailed next step recommendations.

---

**Last Updated**: November 16, 2025
**Project Status**: ✅ All Epics Complete - Production Ready
