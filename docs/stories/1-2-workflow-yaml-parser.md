# Story 1.2: Workflow YAML Parser

Status: ready-for-dev

## Story

As a workflow engine developer,
I want to parse and validate workflow.yaml files,
So that I can execute BMAD workflow definitions programmatically.

## Acceptance Criteria

1. ✅ Parse workflow.yaml using js-yaml library
2. ✅ Validate required fields: name, instructions, config_source
3. ✅ Resolve {project-root} and {installed_path} variables
4. ✅ Load config_source file and resolve {config_source}:key references
5. ✅ Support system-generated variables (date:system-generated)
6. ✅ Return structured WorkflowConfig object with resolved values
7. ✅ Throw descriptive errors for invalid YAML or missing references

## Tasks / Subtasks

- [ ] **Task 1**: Implement WorkflowParser class structure (AC: #1, #2)
  - [ ] Create `backend/src/core/WorkflowParser.ts`
  - [ ] Define WorkflowConfig TypeScript interface matching tech spec schema
  - [ ] Implement `parseYAML(filePath: string): WorkflowConfig` method
  - [ ] Use `js-yaml` library for YAML parsing
  - [ ] Validate required fields: name, description, instructions, config_source
  - [ ] Throw `ValidationError` with descriptive messages for missing fields
  - [ ] Return structured WorkflowConfig object

- [ ] **Task 2**: Variable resolution system (AC: #3, #4, #5)
  - [ ] Implement `resolveVariables(config: WorkflowConfig, projectConfig: ProjectConfig): WorkflowConfig` method
  - [ ] Resolve path variables:
    - `{project-root}` → Absolute path to project root directory
    - `{installed_path}` → Workflow directory path
  - [ ] Resolve config references:
    - `{config_source}:user_name` → Load from config_source YAML path
    - `{config_source}:output_folder` → Resolve nested config values
  - [ ] Resolve system variables:
    - `date:system-generated` → Current ISO date (YYYY-MM-DD)
  - [ ] Apply variable substitution recursively (handle variables in variables)
  - [ ] Throw clear errors for undefined variable references

- [ ] **Task 3**: Config source loading and integration (AC: #4)
  - [ ] Load external config file specified in `config_source` field
  - [ ] Parse config file using `js-yaml` (supports YAML format)
  - [ ] Extract key-value pairs for {config_source}:key substitution
  - [ ] Support nested config paths (e.g., `{config_source}:project.name`)
  - [ ] Handle missing config file with descriptive error
  - [ ] Cache loaded config to avoid redundant file reads

- [ ] **Task 4**: Validation and error handling (AC: #7)
  - [ ] Implement `validateWorkflow(config: WorkflowConfig): ValidationResult` method
  - [ ] Check required fields present and non-empty
  - [ ] Validate file paths exist (instructions, template if specified)
  - [ ] Validate variable references resolve successfully
  - [ ] Return ValidationResult with:
    - `isValid: boolean`
    - `errors: string[]` (detailed error messages)
    - `warnings: string[]` (non-blocking issues)
  - [ ] Throw errors with line numbers where possible (YAML parse errors)
  - [ ] Include helpful messages: expected format, example values

- [ ] **Task 5**: Instructions parsing preparation (AC: #6)
  - [ ] Implement `parseInstructions(markdownFile: string): Step[]` method (basic version)
  - [ ] Read instructions markdown file
  - [ ] Parse step tags: `<step n="X" goal="...">`
  - [ ] Extract step number, goal, and content
  - [ ] Return array of Step objects with:
    - `number: number`
    - `goal: string`
    - `content: string` (raw markdown/XML content)
  - [ ] Note: Full XML tag parsing will be enhanced in Story 1.7 (Workflow Engine)

- [ ] **Task 6**: Testing and integration
  - [ ] Write unit tests for WorkflowParser class
  - [ ] Test valid workflow.yaml parsing
  - [ ] Test variable resolution (all types)
  - [ ] Test validation with missing/invalid fields
  - [ ] Test error messages clarity
  - [ ] Test integration with ProjectConfig from Story 1.1
  - [ ] Test edge cases: circular variables, deeply nested configs
  - [ ] Document WorkflowParser API in code comments

## Dev Notes

### Architecture Context

This story implements the **WorkflowParser** component from Epic 1 tech spec (Section 2.1.1: Workflow Engine). The parser is the first stage of workflow execution and must correctly parse, validate, and resolve all workflow configuration before the engine can execute steps.

**Key Design Decisions:**
- YAML format for workflow configuration (human-readable, industry standard)
- Strict validation to catch errors early (fail-fast principle)
- Variable resolution system enables flexible, reusable workflows
- Clear error messages with context for debugging

[Source: docs/tech-spec-epic-1.md#Core-Kernel-Components]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - `js-yaml` ^4.1.0 - YAML parsing
  - Path resolution - Node.js `path` module
  - File I/O - Node.js `fs/promises` module

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── ProjectConfig.ts       ← Story 1.1 (already exists)
│   │   ├── core/
│   │   │   └── WorkflowParser.ts      ← This story
│   │   │   └── WorkflowEngine.ts      ← Story 1.7 (future)
│   │   └── types/
│   │       └── workflow.types.ts      ← Interfaces for this story
│   ├── tests/
│   │   └── core/
│   │       └── WorkflowParser.test.ts ← Tests for this story
│   └── package.json                    ← Update with dependencies
```

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### WorkflowConfig Interface

**WorkflowConfig Schema** (from tech spec):
```typescript
interface WorkflowConfig {
  name: string;
  description: string;
  author: string;
  config_source: string;        // Path to config file
  output_folder: string;        // Resolved path
  user_name: string;            // From config
  communication_language: string; // From config
  date: string;                 // System-generated
  installed_path: string;       // Workflow location
  template?: string;            // Template file path (optional)
  instructions: string;         // Instructions file path
  validation?: string;          // Validation checklist path (optional)
  default_output_file?: string; // Output file path (optional)
  variables?: Record<string, any>; // Custom workflow variables
  standalone: boolean;
}

interface Step {
  number: number;
  goal: string;
  content: string;              // Raw markdown/XML content
  optional?: boolean;           // From optional="true" attribute
  condition?: string;           // From if="condition" attribute
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### Variable Resolution Examples

**Path Variables:**
```yaml
# Input
installed_path: "{project-root}/bmad/bmm/workflows/prd"

# Output
installed_path: "/home/chris/projects/work/Agent orchastrator/bmad/bmm/workflows/prd"
```

**Config References:**
```yaml
# workflow.yaml
config_source: "{project-root}/bmad/bmm/config.yaml"
user_name: "{config_source}:user_name"
output_folder: "{config_source}:output_folder"

# After resolution (reading from config.yaml)
user_name: "Chris"
output_folder: "/home/chris/projects/work/Agent orchastrator/docs"
```

**System Variables:**
```yaml
# Input
date: system-generated

# Output (example)
date: "2025-11-05"
```

[Source: docs/tech-spec-epic-1.md#Detailed-Design]

### Testing Strategy

**Unit Tests (60% of coverage):**
- Test valid YAML parsing with all required fields
- Test missing required fields (name, instructions, config_source)
- Test invalid YAML syntax errors
- Test variable resolution for all types (path, config, system)
- Test nested variable resolution (variables referencing variables)
- Test undefined variable error handling
- Test config_source loading (valid file, missing file)
- Test validation with valid and invalid workflows
- Test error message clarity and usefulness

**Integration Tests (30% of coverage):**
- Test with actual workflow.yaml files from bmad/bmm/workflows
- Test integration with ProjectConfig from Story 1.1
- Test parsing real bmad/bmm/workflows/prd/workflow.yaml
- Test parsing bmad/bmm/workflows/architecture/workflow.yaml
- Test end-to-end: load workflow → parse → validate → resolve → return config

**Edge Cases:**
- Circular variable references (A depends on B, B depends on A)
- Deeply nested config references (3+ levels)
- Very large workflow files (>1000 lines)
- Workflow files with unicode characters
- Malformed YAML (tabs vs spaces, quote issues)

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Error Handling Best Practices

**Error Types:**
1. **Parse Errors**: YAML syntax invalid → Report line number and syntax issue
2. **Validation Errors**: Missing required fields → List all missing fields clearly
3. **Resolution Errors**: Undefined variables → Show variable name and expected source
4. **File Errors**: Config file not found → Show attempted path and suggestions

**Error Message Format:**
```
WorkflowParseError: Failed to parse workflow at path/to/workflow.yaml

Line 15: Expected mapping for 'config_source' but found null

Required fields missing:
  - instructions: Path to workflow instructions markdown file

Please ensure all required fields are present and properly formatted.

Example:
  name: "My Workflow"
  instructions: "{installed_path}/instructions.md"
  config_source: "{project-root}/bmad/bmm/config.yaml"
```

[Source: docs/tech-spec-epic-1.md#Non-Functional-Requirements]

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#Core-Kernel-Components)
- **Architecture**: [docs/architecture.md#Workflow-Engine](../architecture.md)
- **Story Source**: [docs/epics.md#Story-1-2](../epics.md)
- **Dependencies**: Story 1.1 (ProjectConfig class required)

### Learnings from Previous Story

**From Story 1-1-project-repository-structure-configuration (Status: drafted)**

Story 1.1 is currently drafted but not yet implemented. However, the story specification provides key context for this story:

**Expected Deliverables from Story 1.1:**
- ✅ Backend workspace structure at `backend/src/`
- ✅ ProjectConfig class at `backend/src/config/ProjectConfig.ts`
- ✅ TypeScript configuration with strict mode
- ✅ Package dependencies: js-yaml, dotenv, cosmiconfig

**Integration Points:**
- WorkflowParser will import and use ProjectConfig for config_source loading
- ProjectConfig provides `loadConfig()` method to read .bmad/project-config.yaml
- ProjectConfig provides `getAgentConfig()` for per-agent LLM lookup (used later)

**Dependency on Story 1.1:**
- WorkflowParser requires ProjectConfig to resolve {config_source}:key references
- Must wait for Story 1.1 implementation before testing full variable resolution
- Can develop WorkflowParser structure independently, mock ProjectConfig for initial tests

**Next Story Dependency:**
- Story 1.7 (Workflow Engine) will depend on this WorkflowParser
- WorkflowEngine will call `parseYAML()` and `resolveVariables()` before execution
- Clean API contract essential for engine integration

[Source: docs/stories/1-1-project-repository-structure-configuration.md]

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-2-workflow-yaml-parser.context.xml)

### Agent Model Used

_To be determined during implementation_

### Debug Log References

_To be added during development_

### Completion Notes List

_To be added upon story completion_

### File List

_To be added upon story completion_
