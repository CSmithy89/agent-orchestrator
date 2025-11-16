# Story 3.5: Architecture Template Content Generation

Status: drafted

## Story

As the Agent Orchestrator,
I want an architecture template with comprehensive sections that Winston and Murat agents can fill in,
So that generated architecture documents follow a consistent structure and include all required information.

## Acceptance Criteria

1. **Template Structure Defined**
   - Template file created at `bmad/bmm/workflows/architecture/template.md`
   - Contains all required sections: System Overview, Component Architecture, Data Models, APIs, Non-Functional Requirements, Test Strategy, Technical Decisions
   - Sections include placeholder markers for agent-generated content
   - Variable placeholders: {{project_name}}, {{date}}, {{user_name}}, {{epic_id}}
   - Markdown formatting and structure validated

2. **Variable Substitution System**
   - TemplateProcessor (Story 1.8) supports architecture template variables
   - Variables resolved from workflow state and PRD
   - Date variables auto-populated with current date
   - User variables populated from git config or environment
   - Project variables populated from project configuration

3. **Section Replacement System**
   - Each section has unique placeholder marker
   - TemplateProcessor can replace individual sections independently
   - Section markers preserved for incremental updates
   - Markdown heading levels consistent
   - Section ordering maintained

4. **Template Validation**
   - Validate template structure before workflow execution
   - Check all required sections present
   - Check variable placeholders well-formed
   - Check markdown syntax valid
   - Provide clear error messages for malformed templates

5. **Template Customization Support**
   - Support project-specific template overrides
   - Load template from project `.bmad/` directory if exists
   - Fall back to default template if no override
   - Log template source (default or custom)
   - Validate custom templates against schema

## Tasks / Subtasks

### Task 1: Create Architecture Template File (2-3 hours)

- [ ] Create `bmad/bmm/workflows/architecture/template.md`
- [ ] Define document structure with all sections
- [ ] Add System Overview section with placeholder
- [ ] Add Component Architecture section with placeholder
- [ ] Add Data Models & APIs sections with placeholders
- [ ] Add Non-Functional Requirements section with placeholder
- [ ] Add Test Strategy section with placeholder
- [ ] Add Technical Decisions section with placeholder
- [ ] Include frontmatter with metadata
- [ ] Validate markdown syntax

### Task 2: Implement Variable Substitution (1-2 hours)

- [ ] Extend TemplateProcessor to support architecture variables
- [ ] Method: `resolveVariables(template: string, context: Record<string, string>): string`
- [ ] Support standard variables: project_name, date, user_name, epic_id
- [ ] Support nested variables: {{config_source:field}}
- [ ] Auto-detect missing variables and use defaults
- [ ] Test variable resolution with various inputs

### Task 3: Implement Section Replacement (2-3 hours)

- [ ] Method: `replaceSection(document: string, sectionName: string, content: string): string`
- [ ] Locate section by heading marker
- [ ] Replace content between section heading and next heading
- [ ] Preserve markdown formatting
- [ ] Handle missing sections gracefully
- [ ] Test section replacement with various content

### Task 4: Implement Template Validation (1-2 hours)

- [ ] Method: `validateTemplate(templatePath: string): ValidationResult`
- [ ] Check required sections present
- [ ] Check variable placeholders well-formed
- [ ] Check markdown syntax valid
- [ ] Generate detailed validation errors
- [ ] Return pass/fail with error list

### Task 5: Implement Custom Template Support (1-2 hours)

- [ ] Check for custom template at `.bmad/workflows/architecture/template.md`
- [ ] Load custom template if exists, otherwise default
- [ ] Validate custom templates before use
- [ ] Log template source for audit trail
- [ ] Support template versioning

### Task 6: Write Integration Tests (2-3 hours)

- [ ] Create `backend/tests/integration/architecture-template.test.ts`
- [ ] Test: Load default template successfully
- [ ] Test: Variable substitution with all variables
- [ ] Test: Section replacement preserves formatting
- [ ] Test: Template validation detects errors
- [ ] Test: Custom template loading and fallback
- [ ] Verify test coverage >80%

## Dependencies

**Blocking Dependencies:**
- Story 1.8 (Template Processor): Core template processing system
- Story 3-3 (Architecture Workflow Executor): Uses template to generate architecture.md

**Soft Dependencies:**
- None

**Enables:**
- Story 3-4 (Technical Decisions Logger): Fills Technical Decisions section
- Story 3-6 (Security Gate): Validates architecture.md generated from template
- Story 3-7 (Architecture Validation): Validates template structure compliance

## Dev Notes

### Template Structure

The architecture template includes:
1. **Frontmatter**: project_name, date, author, version
2. **System Overview**: High-level architecture description, architectural patterns
3. **Component Architecture**: Component breakdown, responsibilities, interactions
4. **Data Models**: Entity definitions, relationships, schemas
5. **API Specifications**: Endpoint definitions, request/response formats
6. **Non-Functional Requirements**: Performance, security, reliability, observability
7. **Test Strategy**: Test frameworks, test pyramid, CI/CD, quality gates
8. **Technical Decisions**: ADRs for all architectural decisions

### Variable Placeholders

```markdown
---
project: {{project_name}}
date: {{date}}
author: {{user_name}}
epic: {{epic_id}}
---

# Architecture Document: {{project_name}}

Generated: {{date}}
Author: {{user_name}}
```

### Section Markers

```markdown
## System Overview

<!-- SECTION: system-overview -->
{{system_overview_content}}
<!-- END SECTION: system-overview -->

## Component Architecture

<!-- SECTION: component-architecture -->
{{component_architecture_content}}
<!-- END SECTION: component-architecture -->
```

### References

- Epic 3 Tech Spec: `docs/epics/epic-3-tech-spec.md` (lines 122: ArchitectureTemplateProcessor, lines 782: AC-3.5)
- Story 1.8: Template Processing System
- Story 3-3: Architecture Workflow Executor (uses template)

## Change Log

- **2025-11-12**: Story created (drafted)
