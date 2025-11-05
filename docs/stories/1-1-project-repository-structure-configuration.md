# Story 1.1: Project Repository Structure & Configuration

Status: ready-for-dev

## Story

As a system architect,
I want a well-organized project structure with configuration management,
So that the orchestrator can load project-specific settings and maintain clean separation of concerns.

## Acceptance Criteria

1. ✅ Create TypeScript project with proper tsconfig.json and package.json
2. ✅ Establish directory structure: src/, tests/, docs/, .bmad/
3. ✅ Implement ProjectConfig class that loads from .bmad/project-config.yaml
4. ✅ Support loading: project metadata, agent LLM assignments, onboarding docs paths
5. ✅ Validate configuration schema on load with clear error messages
6. ✅ Include example project-config.yaml with inline documentation

## Tasks / Subtasks

- [ ] **Task 1**: Setup TypeScript project configuration (AC: #1)
  - [ ] Create `backend/package.json` with dependencies (TypeScript, ts-node, @types/node)
  - [ ] Create `backend/tsconfig.json` with strict mode and ES2022 target
  - [ ] Configure build output to `backend/dist/`
  - [ ] Add scripts: build, dev, test
  - [ ] Install dependencies: `js-yaml`, `dotenv`, `cosmiconfig`

- [ ] **Task 2**: Establish directory structure (AC: #2)
  - [ ] Create `backend/src/` directory for source code
  - [ ] Create `backend/src/config/` for configuration management
  - [ ] Create `backend/src/core/` for core orchestrator components
  - [ ] Create `backend/src/providers/` for LLM provider implementations
  - [ ] Create `backend/src/types/` for TypeScript type definitions
  - [ ] Create `backend/tests/` for unit and integration tests
  - [ ] Create `.bmad/` directory at project root for BMAD configuration

- [ ] **Task 3**: Implement ProjectConfig class (AC: #3, #4)
  - [ ] Create `backend/src/config/ProjectConfig.ts`
  - [ ] Define ProjectConfigSchema interface with all required fields
  - [ ] Implement `loadConfig()` method to read `.bmad/project-config.yaml`
  - [ ] Parse YAML using `js-yaml` library
  - [ ] Support environment variable expansion (${ENV_VAR} syntax)
  - [ ] Load sections: project metadata, onboarding, agent_assignments, cost_management
  - [ ] Implement `getAgentConfig(agentName)` method for per-agent LLM lookup
  - [ ] Implement `getOnboardingDocs()` to return paths to onboarding documents

- [ ] **Task 4**: Configuration validation (AC: #5)
  - [ ] Define required fields schema (project.name, project.repository, etc.)
  - [ ] Implement validation logic with descriptive error messages
  - [ ] Validate agent_assignments: model, provider fields required
  - [ ] Validate supported LLM providers (anthropic, openai, zhipu, google)
  - [ ] Throw ValidationError with field path and expected format
  - [ ] Unit tests for valid and invalid configurations

- [ ] **Task 5**: Create example configuration (AC: #6)
  - [ ] Create `.bmad/project-config.example.yaml` with inline comments
  - [ ] Document all fields with descriptions
  - [ ] Provide example agent assignments for Mary, Winston, Amelia, etc.
  - [ ] Include multi-provider examples (Claude, GPT-4, GLM via z.ai)
  - [ ] Add cost management example with budget thresholds
  - [ ] Reference from README.md

- [ ] **Task 6**: Testing and documentation
  - [ ] Write unit tests for ProjectConfig class
  - [ ] Test valid configuration loading
  - [ ] Test invalid configuration error handling
  - [ ] Test environment variable expansion
  - [ ] Update README with configuration setup instructions
  - [ ] Document configuration schema in architecture.md reference

## Dev Notes

### Architecture Context

This story implements the **ProjectConfig** component from the Epic 1 tech spec (Section 2.1: Core Kernel Components). The configuration system is the entry point for all orchestrator operations and must be loaded before any workflows can execute.

**Key Design Decisions:**
- File-based configuration (YAML) for human readability
- Schema validation to catch errors early
- Per-agent LLM assignment enables cost/quality optimization
- Environment variable support for secure API key management

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - `js-yaml` ^4.1.0 - YAML parsing
  - `dotenv` ^16.0.0 - Environment variables
  - `cosmiconfig` ^8.3.0 - Config file discovery (optional)

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── ProjectConfig.ts  ← This story
│   │   ├── core/                 ← Epic 1 stories
│   │   ├── providers/            ← Story 1.3
│   │   └── types/
│   ├── tests/
│   ├── package.json              ← This story
│   └── tsconfig.json             ← This story
├── .bmad/
│   └── project-config.yaml       ← Configuration file
└── package.json                  ← Monorepo root (Story 0.1)
```

### Configuration Schema

**ProjectConfig Schema** (from tech spec):
```yaml
project:
  name: string
  description: string
  repository: string

onboarding:
  tech_stack: string[]
  coding_standards: string
  architecture_patterns: string

agent_assignments:
  [agent_name]:
    model: string          # e.g., "claude-sonnet-4-5"
    provider: string       # e.g., "anthropic"
    base_url?: string      # Optional for wrappers
    api_key?: string       # Optional override
    reasoning: string      # Why this model/agent pairing

cost_management:
  max_monthly_budget: number
  alert_threshold: number  # 0-1
  fallback_model: string
```

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### Testing Strategy

**Unit Tests (60% of coverage):**
- Test valid configuration parsing
- Test invalid YAML syntax errors
- Test missing required fields validation
- Test environment variable expansion
- Test agent config lookup

**Integration Tests (30% of coverage):**
- Test loading from actual .bmad/project-config.yaml
- Test with multiple agent configurations
- Test error handling for missing config file

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md)
- **Architecture**: [docs/architecture.md#ProjectConfig](../architecture.md)
- **PRD Requirements**: [docs/PRD.md#FR-CLI-001](../PRD.md) (Project configuration system)
- **Story Source**: [docs/epics.md#Epic-1-Story-1-1](../epics.md)

### Learnings from Previous Story

**From Story 0-1-project-scaffolding-initialization (Status: done)**

This story builds on Story 0.1 which established:
- ✅ Monorepo structure with workspaces
- ✅ Root package.json with npm workspaces
- ✅ Basic .env.example with LLM provider keys
- ✅ Directory scaffolding (`backend/`, `dashboard/`)

**Key Continuity Points:**
- Backend workspace already exists at `backend/` directory
- Root `.env.example` defines API key variables - reference these in config
- Monorepo structure complete - focus on backend TypeScript setup
- Git repository initialized - commit changes when done

**Next Story Setup:**
- Story 1.2 (Workflow Parser) will depend on ProjectConfig class
- Story 1.3 (LLM Factory) will use agent_assignments from config
- All Epic 1 stories will import and use ProjectConfig

[Source: docs/epics.md#Story-0-1]

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-1-project-repository-structure-configuration.context.xml) - Generated 2025-11-05

### Agent Model Used

_To be determined during implementation_

### Debug Log References

_To be added during development_

### Completion Notes List

_To be added upon story completion_

### File List

_To be added upon story completion_
