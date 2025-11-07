# Epic Technical Specification: Analysis Phase Automation

Date: 2025-11-07
Author: Chris
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 enables autonomous PRD generation - the first "magic moment" of the Agent Orchestrator where users provide rough requirements and wake up to a complete, professional Product Requirements Document. This epic implements the Analysis Phase Automation with intelligent decision-making, Mary (Business Analyst) and John (Product Manager) agent personas, and the escalation queue system for handling ambiguous requirements.

Building on the foundation established in Epic 1, this epic delivers the first end-to-end autonomous workflow execution, proving the orchestrator can make nuanced decisions, collaborate between multiple agents, and produce quality documentation with minimal human intervention. The PRD workflow targets <30 minutes execution time with <3 escalations, demonstrating 10x faster requirements analysis compared to traditional manual processes (30 minutes vs 2-4 hours).

## Objectives and Scope

### In Scope

**Autonomous Decision Making:**
- DecisionEngine class with confidence scoring (0-1 scale)
- Autonomous decision attempts with onboarding doc consultation
- Confidence threshold-based escalation (< 0.75 triggers escalation)
- Decision audit trail (question, decision, confidence, reasoning, outcome)

**Escalation System:**
- EscalationQueue class for managing human intervention requests
- File-based escalation storage (.bmad-escalations/{id}.json)
- Workflow pause/resume capability at escalation points
- Escalation metadata tracking (metrics, resolution time, categories)
- Console notification (dashboard integration deferred to Epic 6)

**Agent Personas:**
- Mary agent (Business Analyst) - requirements analysis specialist
- John agent (Product Manager) - strategic product guidance specialist
- Multi-provider LLM support (Anthropic, OpenAI, Zhipu, Google)
- Per-agent LLM assignment from project configuration
- Specialized prompts and methods per persona

**PRD Workflow Execution:**
- PRD workflow executor (bmad/bmm/workflows/prd/workflow.yaml)
- Multi-agent collaboration (Mary ↔ John)
- Template processing with incremental saves
- PRD quality validation (>85% completeness target)
- Section-by-section content generation with approval checkpoints

**Documentation Output:**
- Complete PRD document (docs/PRD.md)
- All required sections populated
- Professional formatting with markdown, tables, code blocks
- Domain-specific sections where applicable

### Out of Scope

- Architecture workflow and Winston agent (Epic 3)
- Story decomposition and Bob agent (Epic 4)
- Code implementation and Amelia agent (Epic 5)
- Dashboard/API for escalation responses (Epic 6)
- Multi-project orchestration (parallel PRD generation)
- Advanced decision pattern learning (future enhancement)

## System Architecture Alignment

This epic implements components from the **Autonomous Intelligence** layer and the **PRD Workflow Plugin** from the system architecture (Sections 2.2 and 2.3 in architecture.md):

**Architecture Components Implemented:**
- **DecisionEngine** (Story 2.1): Confidence-based autonomous decision making with LLM reasoning (temperature 0.3)
- **EscalationQueue** (Story 2.2): Human intervention management with pause/resume workflow capability
- **Mary Agent** (Story 2.3): Business analyst persona with requirements extraction and user story specialization
- **John Agent** (Story 2.4): Product manager persona with strategic validation and prioritization
- **PRD Workflow Executor** (Story 2.5): Workflow engine integration for PRD generation
- **PRD Template Processor** (Story 2.6): Content generation from templates with domain adaptation
- **PRD Validator** (Story 2.7): Quality validation with completeness scoring (>85% target)

**Architectural Patterns Followed:**
- **Plugin Architecture**: PRD workflow plugs into Epic 1's workflow engine
- **Multi-Agent Collaboration**: Mary and John share workflow context for coherent output
- **Confidence-Based Escalation**: Balances autonomy (>85% decisions autonomous) with safety (escalate ambiguity)
- **Incremental Output**: Template-output tags trigger saves and user approval
- **Provider Abstraction**: Agents use Epic 1's LLMFactory for multi-provider support

**Integration Points:**
- **Depends On**: Epic 1 (WorkflowEngine, AgentPool, LLMFactory, TemplateProcessor, StateManager, ErrorHandler)
- **Used By**: Epic 3 (Architecture workflow will reference PRD output)
- **Future Integration**: Epic 6 (Dashboard will visualize escalations and provide response UI)

## Detailed Design

### Services and Modules

{{services_modules}}

### Data Models and Contracts

{{data_models}}

### APIs and Interfaces

{{apis_interfaces}}

### Workflows and Sequencing

{{workflows_sequencing}}

## Non-Functional Requirements

### Performance

{{nfr_performance}}

### Security

{{nfr_security}}

### Reliability/Availability

{{nfr_reliability}}

### Observability

{{nfr_observability}}

## Dependencies and Integrations

{{dependencies_integrations}}

## Acceptance Criteria (Authoritative)

{{acceptance_criteria}}

## Traceability Mapping

{{traceability_mapping}}

## Risks, Assumptions, Open Questions

{{risks_assumptions_questions}}

## Test Strategy Summary

{{test_strategy}}
