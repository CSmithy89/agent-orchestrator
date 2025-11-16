# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Agent Orchestrator project.

## What is an ADR?

An Architecture Decision Record (ADR) captures important architectural decisions made during the project, including:
- The context and problem being addressed
- Options considered
- The decision made and why
- Consequences of the decision

## How to Use This Directory

1. **Create a new ADR:** Copy `../templates/adr-template.md` and follow the naming convention
2. **File Naming:** `adr-XXX-short-title.md` (e.g., `adr-001-use-fastify.md`)
3. **Sequential Numbering:** Use the next available number
4. **Update this index:** Add your ADR to the table below

## ADR Index

| Number | Title | Status | Date | Epic/Story |
|--------|-------|--------|------|------------|
| [001](./adr-001-use-fastify-for-api-server.md) | Use Fastify for API Server | Accepted | 2025-11-14 | Epic 6 |
| [002](./adr-002-openapi-schema-type-generation.md) | OpenAPI Schema as Type Source | Accepted | 2025-11-14 | Epic 6 |
| [003](./adr-003-react-vite-tanstack-query.md) | React + Vite + TanStack Query for Dashboard | Accepted | 2025-11-14 | Epic 6 |
| [004](./adr-004-websocket-real-time-updates.md) | WebSocket for Real-Time Updates | Accepted | 2025-11-14 | Epic 6 |
| [005](./adr-005-d3js-dependency-visualization.md) | D3.js for Dependency Graph Visualization | Accepted | 2025-11-15 | Epic 6 |
| [006](./adr-006-playwright-e2e-testing.md) | Playwright for E2E Testing | Accepted | 2025-11-15 | Epic 6 |

## Status Definitions

- **Proposed:** Under discussion, not yet decided
- **Accepted:** Decision made and being implemented/implemented
- **Deprecated:** No longer applicable or recommended
- **Superseded:** Replaced by another ADR (link to the new one)

## Template

Use the template at `../templates/adr-template.md` for creating new ADRs.

## Guidelines

1. Keep ADRs concise (1-2 pages)
2. Focus on the "why" not just the "what"
3. Include options considered, not just the chosen solution
4. Update status as decisions evolve
5. Link related ADRs and documentation
