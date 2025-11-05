# Story 1.8: Template Processing System

Status: ready-for-dev

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

- [ ] **Task 1**: Implement TemplateProcessor class structure (AC: #1)
  - [ ] Create `backend/src/core/TemplateProcessor.ts`
  - [ ] Define TemplateProcessor class with template engine
  - [ ] Choose templating library (Handlebars or Mustache)
  - [ ] Initialize template engine with custom helpers
  - [ ] Document TemplateProcessor API with JSDoc comments

- [ ] **Task 2**: Template loading and parsing (AC: #1, #7)
  - [ ] Implement `loadTemplate(path: string): Promise<string>` method
  - [ ] Read template file from filesystem
  - [ ] Validate template file exists and is readable
  - [ ] Parse template syntax (validate {{}} placeholders)
  - [ ] Preserve original formatting (whitespace, newlines, indentation)
  - [ ] Cache parsed templates for performance
  - [ ] Support multiple template formats (markdown, plain text)

- [ ] **Task 3**: Variable substitution (AC: #2, #8)
  - [ ] Implement `processTemplate(template: string, vars: Record<string, any>): string` method
  - [ ] Replace {{variable}} with actual values
  - [ ] Support nested variables: {{user.name}}
  - [ ] Support default values: {{variable|default}}
  - [ ] Handle undefined variables:
    - With default: Use default value
    - Without default: Throw descriptive error
  - [ ] Escape special characters if needed
  - [ ] Preserve markdown formatting after substitution

- [ ] **Task 4**: Conditional block support (AC: #3)
  - [ ] Implement conditional helper: {{#if condition}}
  - [ ] Support boolean conditions: {{#if isEnabled}}
  - [ ] Support comparison conditions: {{#if count > 5}}
  - [ ] Support negation: {{#unless condition}}
  - [ ] Support else blocks: {{else}}
  - [ ] Nested conditionals support
  - [ ] Evaluate conditions against workflow variables
  - [ ] Remove conditional blocks that evaluate to false

- [ ] **Task 5**: Loop support (AC: #4)
  - [ ] Implement loop helper: {{#each collection}}
  - [ ] Iterate over arrays: {{#each items}}
  - [ ] Access item properties: {{this.name}}
  - [ ] Access loop index: {{@index}}
  - [ ] Access loop metadata: {{@first}}, {{@last}}
  - [ ] Support nested loops
  - [ ] Handle empty collections gracefully
  - [ ] Support object iteration

- [ ] **Task 6**: File output operations (AC: #5, #6)
  - [ ] Implement `writeOutput(content: string, outputPath: string): Promise<void>` method
  - [ ] Check if output file already exists
  - [ ] If file doesn't exist: Use Write to create new file
  - [ ] If file exists: Use Edit to update existing file
  - [ ] Preserve file permissions and metadata
  - [ ] Handle write errors (permissions, disk full)
  - [ ] Create parent directories if needed
  - [ ] Atomic write operations (temp + rename)

- [ ] **Task 7**: Incremental template updates (AC: #6)
  - [ ] Implement `updateSection(filePath: string, sectionName: string, content: string): Promise<void>` method
  - [ ] Identify sections in existing document
  - [ ] Replace specific section content using Edit tool
  - [ ] Preserve surrounding content
  - [ ] Support markdown section markers (## Section)
  - [ ] Support XML/comment section markers
  - [ ] Validate section exists before update

- [ ] **Task 8**: Custom helpers and filters
  - [ ] Implement `registerHelper(name: string, fn: Function): void` method
  - [ ] Built-in helpers:
    - `uppercase`: Convert text to uppercase
    - `lowercase`: Convert text to lowercase
    - `capitalize`: Capitalize first letter
    - `date`: Format dates
    - `join`: Join array elements
    - `default`: Provide default value
  - [ ] Support custom helper registration
  - [ ] Document helper API for workflow authors

- [ ] **Task 9**: Error handling and validation (AC: #8)
  - [ ] Comprehensive error handling for all operations
  - [ ] TemplateError types:
    - TemplateNotFoundError: Template file missing
    - TemplateSyntaxError: Invalid template syntax
    - VariableUndefinedError: Missing required variable
    - TemplateRenderError: Rendering failed
  - [ ] Error messages include:
    - Template path
    - Variable name (if applicable)
    - Line number where error occurred
    - Available variables list
    - Suggested resolution
  - [ ] Validate template syntax before processing
  - [ ] Log template processing events

- [ ] **Task 10**: Integration with WorkflowEngine (AC: #5)
  - [ ] Integrate TemplateProcessor into WorkflowEngine
  - [ ] Handle <template-output file="..."> tags
  - [ ] Extract template content from workflow step
  - [ ] Pass workflow variables to template processor
  - [ ] Write processed output to specified file
  - [ ] Update workflow state after template generation
  - [ ] Support template paths relative to workflow

- [ ] **Task 11**: Testing and validation
  - [ ] Write unit tests for TemplateProcessor class
  - [ ] Test loadTemplate() with valid/invalid paths
  - [ ] Test variable substitution (simple, nested, defaults)
  - [ ] Test conditional blocks (if, unless, else)
  - [ ] Test loops (arrays, objects, nested)
  - [ ] Test file output (create new, update existing)
  - [ ] Test custom helpers
  - [ ] Test error handling for all error types
  - [ ] Integration test: Generate complete document from template
  - [ ] Test preservation of markdown formatting

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

_To be determined during implementation_

### Debug Log References

_To be added during development_

### Completion Notes List

_To be added upon story completion_

### File List

_To be added upon story completion_
