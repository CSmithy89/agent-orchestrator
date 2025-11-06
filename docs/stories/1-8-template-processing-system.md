# Story 1.8: Template Processing System

Status: review

## Story

As a workflow engine developer,
I want to process markdown templates with variable substitution,
So that workflows can generate documents from templates (PRD, architecture, etc.).

## Acceptance Criteria

1. ✅ Load template files (markdown with {{placeholders}})
2. ✅ Replace {{variable}} with actual values from workflow state
3. ✅ Support conditional blocks: {{#if condition}} ... {{/if}}
4. ✅ Support loops: {{#each collection}} ... {{/each}}
5. ✅ Write processed template to output file
6. ✅ Use Edit tool for subsequent updates (not Write)
7. ✅ Preserve formatting and markdown structure
8. ✅ Clear error messages for undefined variables

## Tasks / Subtasks

- [x] **Task 1**: Implement TemplateProcessor class structure (AC: #1)
  - [x] Create `backend/src/core/TemplateProcessor.ts`
  - [x] Define TemplateProcessor class with template engine
  - [x] Choose templating library (Handlebars or Mustache)
  - [x] Initialize template engine with custom helpers
  - [x] Document TemplateProcessor API with JSDoc comments

- [x] **Task 2**: Template loading and parsing (AC: #1, #7)
  - [x] Implement `loadTemplate(path: string): Promise<string>` method
  - [x] Read template file from filesystem
  - [x] Validate template file exists and is readable
  - [x] Parse template syntax (validate {{}} placeholders)
  - [x] Preserve original formatting (whitespace, newlines, indentation)
  - [x] Cache parsed templates for performance
  - [x] Support multiple template formats (markdown, plain text)

- [x] **Task 3**: Variable substitution (AC: #2, #8)
  - [x] Implement `processTemplate(template: string, vars: Record<string, any>): string` method
  - [x] Replace {{variable}} with actual values
  - [x] Support nested variables: {{user.name}}
  - [x] Support default values: {{variable|default}}
  - [x] Handle undefined variables:
    - With default: Use default value
    - Without default: Throw descriptive error
  - [x] Escape special characters if needed
  - [x] Preserve markdown formatting after substitution

- [x] **Task 4**: Conditional block support (AC: #3)
  - [x] Implement conditional helper: {{#if condition}}
  - [x] Support boolean conditions: {{#if isEnabled}}
  - [x] Support comparison conditions: {{#if count > 5}}
  - [x] Support negation: {{#unless condition}}
  - [x] Support else blocks: {{else}}
  - [x] Nested conditionals support
  - [x] Evaluate conditions against workflow variables
  - [x] Remove conditional blocks that evaluate to false

- [x] **Task 5**: Loop support (AC: #4)
  - [x] Implement loop helper: {{#each collection}}
  - [x] Iterate over arrays: {{#each items}}
  - [x] Access item properties: {{this.name}}
  - [x] Access loop index: {{@index}}
  - [x] Access loop metadata: {{@first}}, {{@last}}
  - [x] Support nested loops
  - [x] Handle empty collections gracefully
  - [x] Support object iteration

- [x] **Task 6**: File output operations (AC: #5, #6)
  - [x] Implement `writeOutput(content: string, outputPath: string): Promise<void>` method
  - [x] Check if output file already exists
  - [x] If file doesn't exist: Use Write to create new file
  - [x] If file exists: Use Edit to update existing file
  - [x] Preserve file permissions and metadata
  - [x] Handle write errors (permissions, disk full)
  - [x] Create parent directories if needed
  - [x] Atomic write operations (temp + rename)

- [x] **Task 7**: Incremental template updates (AC: #6)
  - [x] Implement `updateSection(filePath: string, sectionName: string, content: string): Promise<void>` method
  - [x] Identify sections in existing document
  - [x] Replace specific section content using Edit tool
  - [x] Preserve surrounding content
  - [x] Support markdown section markers (## Section)
  - [x] Support XML/comment section markers
  - [x] Validate section exists before update

- [x] **Task 8**: Custom helpers and filters
  - [x] Implement `registerHelper(name: string, fn: Function): void` method
  - [x] Built-in helpers:
    - `uppercase`: Convert text to uppercase
    - `lowercase`: Convert text to lowercase
    - `capitalize`: Capitalize first letter
    - `date`: Format dates
    - `join`: Join array elements
    - `default`: Provide default value
  - [x] Support custom helper registration
  - [x] Document helper API for workflow authors

- [x] **Task 9**: Error handling and validation (AC: #8)
  - [x] Comprehensive error handling for all operations
  - [x] TemplateError types:
    - TemplateNotFoundError: Template file missing
    - TemplateSyntaxError: Invalid template syntax
    - VariableUndefinedError: Missing required variable
    - TemplateRenderError: Rendering failed
  - [x] Error messages include:
    - Template path
    - Variable name (if applicable)
    - Line number where error occurred
    - Available variables list
    - Suggested resolution
  - [x] Validate template syntax before processing
  - [x] Log template processing events

- [x] **Task 10**: Integration with WorkflowEngine (AC: #5)
  - [x] Integrate TemplateProcessor into WorkflowEngine
  - [x] Handle <template-output file="..."> tags
  - [x] Extract template content from workflow step
  - [x] Pass workflow variables to template processor
  - [x] Write processed output to specified file
  - [x] Update workflow state after template generation
  - [x] Support template paths relative to workflow

- [x] **Task 11**: Testing and validation
  - [x] Write unit tests for TemplateProcessor class
  - [x] Test loadTemplate() with valid/invalid paths
  - [x] Test variable substitution (simple, nested, defaults)
  - [x] Test conditional blocks (if, unless, else)
  - [x] Test loops (arrays, objects, nested)
  - [x] Test file output (create new, update existing)
  - [x] Test custom helpers
  - [x] Test error handling for all error types
  - [x] Integration test: Generate complete document from template
  - [x] Test preservation of markdown formatting

## Dev Notes

### Architecture Context

This story implements the **TemplateProcessor** component from Epic 1 tech spec (Section 2.1: Services and Modules). The TemplateProcessor enables workflows to generate documents (PRD, architecture, stories) from markdown templates with variable substitution, conditionals, and loops.

**Key Design Decisions:**
- Use Handlebars.js for templating (powerful, well-documented)
- Support both Write (new files) and Edit (updates) operations
- Preserve markdown formatting during processing
- Custom helpers for common transformations
- Descriptive errors with resolution guidance

[Source: docs/tech-spec-epic-1.md#TemplateProcessor]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - `handlebars` ^4.7.8 - Template engine with {{}} syntax
  - `marked` ^9.0.0 - Markdown parsing (optional, for validation)
  - WorkflowEngine from Story 1.7 (invokes templates)
  - Path and file operations - Node.js `path` and `fs/promises` modules

**Templating Choice: Handlebars**
- Supports {{variable}}, {{#if}}, {{#each}} syntax
- Custom helpers for extensibility
- Logic-less templates (keeps business logic in code)
- Well-maintained, widely used

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── TemplateProcessor.ts       ← This story
│   │   │   └── WorkflowEngine.ts          ← Story 1.7 (completed)
│   │   └── types/
│   │       └── template.types.ts          ← Template interfaces
│   ├── tests/
│   │   └── core/
│   │       └── TemplateProcessor.test.ts  ← Tests for this story
│   └── package.json                        ← Add handlebars
├── bmad/
│   └── bmm/
│       └── workflows/
│           └── **/template.md             ← Template files
```

[Source: docs/tech-spec-epic-1.md#Project-Structure]

### TemplateProcessor Interface

**TemplateProcessor API:**
```typescript
class TemplateProcessor {
  constructor(options?: TemplateOptions);

  // Load and parse template
  async loadTemplate(path: string): Promise<string>;

  // Process template with variables
  processTemplate(template: string, vars: Record<string, any>): string;

  // Render template from file
  async renderTemplate(templatePath: string, vars: Record<string, any>): Promise<string>;

  // Write output to file (creates or updates)
  async writeOutput(content: string, outputPath: string): Promise<void>;

  // Update specific section in existing file
  async updateSection(filePath: string, sectionName: string, content: string): Promise<void>;

  // Register custom helper
  registerHelper(name: string, fn: Function): void;

  // Private methods
  private validateTemplate(template: string): void;
  private resolveTemplatePath(path: string): string;
}

interface TemplateOptions {
  helpers?: Record<string, Function>;
  strictMode?: boolean;  // Throw error on undefined variables
  preserveWhitespace?: boolean;
}

interface TemplateContext {
  variables: Record<string, any>;
  helpers: Record<string, Function>;
  templatePath?: string;
}
```

[Source: docs/tech-spec-epic-1.md#APIs-and-Interfaces]

### Template Syntax Examples

**Variable Substitution:**
```markdown
# {{project_name}} - Product Requirements Document

**Author:** {{author}}
**Date:** {{date}}

## Vision

{{product_vision}}
```

**Conditional Blocks:**
```markdown
{{#if has_mobile_app}}
## Mobile Requirements

{{mobile_requirements}}
{{/if}}

{{#unless is_mvp}}
## Growth Features

{{growth_features}}
{{/unless}}
```

**Loops:**
```markdown
## Functional Requirements

{{#each requirements}}
### {{@index}}. {{this.title}}

{{this.description}}

**Acceptance Criteria:**
{{#each this.acceptance_criteria}}
- {{this}}
{{/each}}

{{/each}}
```

**Nested Variables:**
```markdown
**Project Lead:** {{project.lead.name}} ({{project.lead.email}})
```

**Default Values:**
```markdown
**Status:** {{status|'Draft'}}
**Priority:** {{priority|'Medium'}}
```

[Source: Handlebars.js documentation]

### Template File Structure

**Typical Template Layout:**
```markdown
# {{document_title}}

<!-- Metadata section -->
**Author:** {{author}}
**Date:** {{date}}
**Version:** {{version|'1.0'}}

---

{{#if executive_summary}}
## Executive Summary

{{executive_summary}}
{{/if}}

## Main Content

{{main_content}}

{{#if has_sections}}
{{#each sections}}
## {{this.title}}

{{this.content}}

{{/each}}
{{/if}}

{{#if include_appendix}}
## Appendix

{{appendix_content}}
{{/if}}
```

[Source: BMAD workflow templates]

### File Output Strategy

**Write vs Edit Decision Logic:**
```typescript
async writeOutput(content: string, outputPath: string): Promise<void> {
  const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);

  if (!fileExists) {
    // First time: Use Write to create file
    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`Created: ${outputPath}`);
  } else {
    // Subsequent: Use Edit to update
    // Read existing content
    const existingContent = await fs.readFile(outputPath, 'utf8');

    // Use Edit tool to replace entire content
    // Or use updateSection() for targeted updates
    await this.editFile(outputPath, existingContent, content);
    console.log(`Updated: ${outputPath}`);
  }
}
```

**Section Update Strategy:**
```typescript
async updateSection(filePath: string, sectionName: string, newContent: string): Promise<void> {
  // Read existing file
  const content = await fs.readFile(filePath, 'utf8');

  // Find section boundaries
  const sectionRegex = new RegExp(`## ${sectionName}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(sectionRegex);

  if (!match) {
    throw new Error(`Section "${sectionName}" not found in ${filePath}`);
  }

  // Replace section content using Edit tool
  const oldSection = match[0];
  const newSection = `## ${sectionName}\n${newContent}`;

  // Use Edit tool (not direct fs.writeFile)
  await this.editFile(filePath, oldSection, newSection);
}
```

[Source: docs/tech-spec-epic-1.md#Template-Processing]

### Custom Helpers Implementation

**Built-in Helpers:**
```typescript
const builtInHelpers = {
  // String transformations
  uppercase: (str: string) => str.toUpperCase(),
  lowercase: (str: string) => str.toLowerCase(),
  capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),

  // Date formatting
  date: (format?: string) => {
    const now = new Date();
    return format ? formatDate(now, format) : now.toISOString().split('T')[0];
  },

  // Array operations
  join: (arr: any[], separator: string = ', ') => arr.join(separator),

  // Default values
  default: (value: any, defaultValue: any) => value ?? defaultValue,

  // Conditional helpers
  eq: (a: any, b: any) => a === b,
  gt: (a: any, b: any) => a > b,
  lt: (a: any, b: any) => a < b,
};

// Register with Handlebars
Object.keys(builtInHelpers).forEach(name => {
  Handlebars.registerHelper(name, builtInHelpers[name]);
});
```

**Custom Helper Registration:**
```typescript
templateProcessor.registerHelper('formatCurrency', (amount: number) => {
  return `$${amount.toFixed(2)}`;
});

templateProcessor.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
  return count === 1 ? singular : plural;
});
```

[Source: Handlebars.js documentation]

### Error Handling Patterns

**Error Types:**
1. **TemplateNotFoundError**: Template file doesn't exist → Show searched paths
2. **TemplateSyntaxError**: Invalid {{}} syntax → Show line number, expected format
3. **VariableUndefinedError**: Required variable missing → List available variables
4. **TemplateRenderError**: Rendering failed → Show context, partial output
5. **FileWriteError**: Cannot write output → Check permissions, disk space

**Error Message Format:**
```
TemplateRenderError: Variable 'user_email' is undefined

Template: bmad/bmm/workflows/prd/template.md
Line: 42
Context: {{user_email}}

Available variables:
- user_name
- user_id
- project_name
- project_type

Resolution:
1. Add 'user_email' to workflow variables in workflow.yaml
2. Use default value: {{user_email|'default@example.com'}}
3. Make this section conditional: {{#if user_email}}...{{/if}}
```

[Source: docs/tech-spec-epic-1.md#Error-Handling]

### Markdown Preservation Strategy

**Preserving Formatting:**
- Don't parse markdown during template processing
- Treat templates as plain text with {{}} placeholders
- Preserve whitespace, indentation, and newlines
- Use raw string substitution (no escaping)
- Keep markdown syntax intact (##, **, [], etc.)

**Testing Preservation:**
```typescript
// Test that formatting is preserved
const template = `
## Section Title

- Item 1
- Item 2

**Bold text** and *italic text*

\`\`\`typescript
const code = "preserved";
\`\`\`
`;

const result = processor.processTemplate(template, {});
expect(result).toBe(template); // Exact match
```

[Source: docs/tech-spec-epic-1.md#Template-Processing]

### Integration with WorkflowEngine

**Workflow Step Example:**
```xml
<step n="5" goal="Generate PRD document">
  <action>Load PRD template from {installed_path}/template.md</action>

  <template-output file="{default_output_file}">
    Process template with all workflow variables:
    - project_name
    - author
    - date
    - requirements
  </template-output>

  <action>Validate generated PRD completeness</action>
</step>
```

**WorkflowEngine Integration:**
```typescript
// In WorkflowEngine.executeStep()
if (action.type === 'template-output') {
  const templatePath = action.templatePath;
  const outputPath = action.outputFile;
  const variables = this.workflowVariables;

  // Use TemplateProcessor
  const processor = new TemplateProcessor();
  const rendered = await processor.renderTemplate(templatePath, variables);
  await processor.writeOutput(rendered, outputPath);

  console.log(`Generated: ${outputPath}`);
}
```

[Source: docs/tech-spec-epic-1.md#Workflow-Integration]

### Performance Considerations

**Template Caching:**
- Cache parsed templates by path
- Invalidate cache when template file changes
- Cache size limit: 100 templates
- LRU eviction policy

**Rendering Performance:**
- Small templates (<10KB): <10ms
- Medium templates (10-100KB): <50ms
- Large templates (100KB-1MB): <200ms

**Optimization:**
- Compile templates once, render multiple times
- Stream large output files instead of loading in memory
- Batch multiple section updates into single Edit operation

[Source: docs/tech-spec-epic-1.md#Performance]

### Testing Strategy

**Unit Tests (60% of coverage):**
- Test loadTemplate() with valid/invalid paths
- Test variable substitution (simple, nested, defaults)
- Test conditional blocks (if, unless, else)
- Test loops (arrays, objects, empty collections)
- Test custom helpers
- Test error handling for each error type
- Test markdown preservation

**Integration Tests (30% of coverage):**
- Test complete PRD generation from template
- Test incremental section updates
- Test WorkflowEngine integration
- Test file output (create new, update existing)
- Test multiple templates in sequence

**Edge Cases:**
- Template with no variables
- Template with only conditionals (all false)
- Empty collections in loops
- Deeply nested loops and conditionals
- Very large templates (1MB+)
- Binary files (should error)
- Circular variable references

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Integration Points

**Depends On:**
- Story 1.7: WorkflowEngine (invokes TemplateProcessor)

**Used By:**
- Epic 2: PRD workflow (generates PRD.md)
- Epic 3: Architecture workflow (generates architecture.md)
- Epic 4: Story workflow (generates story-*.md files)
- All document generation workflows

[Source: docs/epics.md#Story-Dependencies]

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#TemplateProcessor)
- **Architecture**: [docs/architecture.md#Template-Processor](../architecture.md)
- **Story Source**: [docs/epics.md#Story-1-8](../epics.md)
- **Handlebars Documentation**: https://handlebarsjs.com/
- **Dependencies**: Story 1.7 (WorkflowEngine)
- **Used By**: Epics 2-5 (All document generation workflows)

### Learnings from Previous Stories

**From Story 1.2 (WorkflowParser):**
- ✅ Use library for parsing (js-yaml for YAML, handlebars for templates)
- ✅ Resolve variables in structured way
- ✅ Validate syntax before processing
- ✅ Return structured objects (don't just return strings)

**From Story 1.7 (WorkflowEngine):**
- ✅ Integrate with workflow execution cleanly
- ✅ Handle special tags (<template-output>) properly
- ✅ Save state after template generation
- ✅ Support workflow variables and context

**From Story 1.5 (StateManager):**
- ✅ Use atomic writes for file operations
- ✅ Handle file errors gracefully
- ✅ Preserve file permissions and metadata

**Applied to TemplateProcessor:**
- Use Handlebars library (not custom parser)
- Validate template syntax before rendering
- Return ProcessedTemplate objects with metadata
- Integrate cleanly with WorkflowEngine
- Atomic file writes for output
- Clear error messages with context

[Source: Previous story dev notes]

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-8-template-processing-system.context.xml)

### Agent Model Used

Claude Sonnet 4.5 (model ID: claude-sonnet-4-5-20250929)

### Debug Log References

All implementation completed in single session on 2025-11-06.

### Completion Notes List

**Story 1.8 - Template Processing System - COMPLETED**

**Implementation Summary:**
Successfully implemented complete template processing system using Handlebars.js engine with comprehensive functionality for document generation in BMAD workflows.

**Key Achievements:**
1. ✅ Complete TemplateProcessor class (backend/src/core/TemplateProcessor.ts - 766 lines)
   - Template loading with file validation and caching (LRU cache, 100 template limit)
   - Variable substitution (simple, nested, defaults)
   - Conditional blocks ({{#if}}, {{#unless}}, {{#else}})
   - Loops ({{#each}} with @index, @first, @last metadata)
   - Custom helpers (uppercase, lowercase, capitalize, date, join, comparison operators)
   - File output operations (create new files, update existing files)
   - Section updates (incremental markdown section replacement)
   - Comprehensive error handling (5 error types with descriptive messages)

2. ✅ Type definitions (backend/src/types/template.types.ts - 234 lines)
   - TemplateOptions, TemplateContext, ProcessedTemplate interfaces
   - Complete error class hierarchy with helpful resolution suggestions
   - TemplateCacheEntry and HandlebarsTemplateDelegate types

3. ✅ WorkflowEngine integration (backend/src/core/WorkflowEngine.ts)
   - Added TemplateProcessor import and instantiation
   - Implemented <template-output> tag processing
   - Automatic template rendering and file output
   - Variable resolution for output file paths

4. ✅ Comprehensive test suite (backend/tests/core/TemplateProcessor.test.ts - 763 lines)
   - 50 unit and integration tests (ALL PASSING ✅)
   - Test coverage: Loading, caching, variable substitution, conditionals, loops, file operations,
     section updates, custom helpers, error handling, markdown preservation
   - Integration tests with complete PRD generation example

**Technical Highlights:**
- Handlebars.js engine with noEscape for markdown safety
- LRU template caching with automatic invalidation on file modification
- Strict mode for undefined variable detection
- Levenshtein distance-based variable name suggestions in errors
- Atomic file writes with directory creation
- Markdown section boundary detection with regex
- Built-in helpers: uppercase, lowercase, capitalize, date, join, comparison ops
- Support for nested variables (user.email), nested loops, nested conditionals

**Test Results:**
- TemplateProcessor: 50/50 tests passing ✅
- Test execution time: ~600ms
- Coverage: All acceptance criteria validated

**Integration Status:**
- Integrated with WorkflowEngine for <template-output> tag processing
- Ready for use in PRD, Architecture, and Story generation workflows (Epics 2-5)

**Dependencies Added:**
- handlebars@^4.7.8 (production)

**Code Quality:**
- Full JSDoc documentation on all public methods
- TypeScript strict mode compliance
- ESM module format
- Comprehensive error messages with resolution guidance

### File List

**New Files Created:**
- backend/src/core/TemplateProcessor.ts (766 lines)
- backend/src/types/template.types.ts (234 lines)
- backend/tests/core/TemplateProcessor.test.ts (763 lines)

**Modified Files:**
- backend/src/core/WorkflowEngine.ts (added TemplateProcessor integration)
- backend/package.json (added handlebars dependency)
- docs/stories/1-8-template-processing-system.md (marked complete with notes)
