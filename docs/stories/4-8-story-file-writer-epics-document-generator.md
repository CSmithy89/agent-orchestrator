# Story 4.8: Story File Writer & Epics Document Generator

Status: done

## Story

As a Scrum Master,
I want story and epic documentation files automatically generated,
So that developers have clear, well-formatted requirements documentation ready for implementation.

## Acceptance Criteria

1. **StoryFileWriter Service Created** (`backend/src/solutioning/story-file-writer.ts`)
   - `writeStoryFile(story: Story, epic: Epic): Promise<void>` - Write individual story markdown file
   - `writeEpicsDocument(epics: Epic[]): Promise<void>` - Write consolidated epics.md
   - `writeAllStoryFiles(result: SolutioningResult): Promise<WriteSummary>` - Batch write all files
   - Uses StoryTemplateBuilder for markdown generation
   - Creates directories if needed (docs/stories/)
   - Returns write summary with file counts and locations

2. **Story File Format with YAML Frontmatter**
   - YAML frontmatter includes: id, epic, title, status, estimated_hours, complexity, dependencies
   - Story sections: User Story, Acceptance Criteria, Technical Notes, Dependencies, Dev Notes, Dev Agent Record, Change Log
   - Uses StoryTemplateBuilder.toYAMLFrontmatter() and toMarkdown() methods
   - Proper markdown formatting with numbered acceptance criteria
   - File naming: `docs/stories/{epic_num}-{story_num}-{title-kebab-case}.md`
   - UTF-8 encoding with proper line endings

3. **Epics Document Format**
   - Header with generation date, total epics count, total stories count
   - Per-epic sections with: Goal, Value Proposition, Business Value, Estimated Duration, Story count
   - Bulleted list of stories with titles, estimated hours, and complexity
   - Markdown separator between epics (---)
   - Professional formatting for human readability
   - File location: `docs/epics.md`

4. **Directory Creation and File Management**
   - Check if docs/stories/ directory exists
   - Create directory structure if missing (recursive)
   - Handle file write errors gracefully with descriptive messages
   - Log successful file writes with paths
   - Overwrite existing files (idempotent operation)

5. **Integration with SolutioningOrchestrator**
   - Add Step 9 in executeSolutioning() after sprint status generation
   - Instantiate StoryFileWriter in constructor
   - Call writeAllStoryFiles(result) with complete solutioning result
   - Log file writing summary (count of files, locations)
   - Handle write failures without blocking workflow completion

6. **Batch Writing with WriteSummary Result**
   - WriteSummary interface with: storiesWritten, epicsDocumentWritten, storyFilePaths, epicsDocumentPath
   - Write all story files in sequence (not parallel - avoid file system race conditions)
   - Write epics document after all story files
   - Return summary with all written file paths
   - Track and report any write failures

7. **Story File Naming Convention**
   - Format: `{epic_num}-{story_num}-{title-kebab-case}.md`
   - Example: `4-1-solutioning-data-models-story-schema.md`
   - Use StoryTemplateBuilder.titleToKebabCase() for consistent naming
   - No spaces or special characters in filenames
   - Handle long titles (truncate if >50 characters after kebab-case)

8. **Epics Document Content Quality**
   - Clear hierarchy with ## for epic titles
   - Bold labels for metadata (Goal, Value Proposition, etc.)
   - Numbered story lists (1., 2., 3.) with details in parentheses
   - Accurate story counts per epic
   - Aggregate metrics in header (total epics, total stories)
   - Professional, readable markdown structure

9. **Error Handling and Logging**
   - Try-catch blocks around all fs.writeFile operations
   - Descriptive error messages with file paths
   - Console logging for successful writes
   - Warn on write failures but continue processing other files
   - Return partial success results if some writes fail

10. **Unit Tests with 100% Coverage**
    - Test writeStoryFile() with valid story and epic
    - Test writeEpicsDocument() with multiple epics
    - Test writeAllStoryFiles() batch operation
    - Test directory creation when docs/stories/ missing
    - Test file write errors (mock fs.writeFile rejection)
    - Test markdown formatting and YAML frontmatter
    - Test file naming convention with various titles
    - Test WriteSummary result structure
    - Mock fs.writeFile and fs.mkdir for all tests
    - At least 12 comprehensive tests

11. **TypeScript Type Safety**
    - WriteSummary interface exported from story-file-writer.ts
    - Proper typing for all method parameters and return values
    - Use fs.promises for async/await file operations
    - Import types from ./types.js (Epic, Story, SolutioningResult)
    - No 'any' types except for error handling

12. **StoryTemplateBuilder Reuse**
    - Instantiate StoryTemplateBuilder in StoryFileWriter constructor
    - Use buildFromTemplate() to create StoryObject
    - Use toMarkdown() to generate markdown content
    - Use toYAMLFrontmatter() to generate frontmatter
    - Cache builder instance for reuse across multiple story writes

## Tasks / Subtasks

### Task 1: Create Story and Context Files (AC: 1)
- [x] Create story markdown file: `docs/stories/4-8-story-file-writer-epics-document-generator.md`
- [x] Create story context XML file with references to StoryTemplateBuilder

### Task 2: Implement StoryFileWriter Service (AC: 1, 2, 3, 4, 6, 7, 9, 11, 12)
- [x] Create `backend/src/solutioning/story-file-writer.ts` file
- [x] Define WriteSummary interface (storiesWritten, epicsDocumentWritten, file paths)
- [x] Implement StoryFileWriter class with StoryTemplateBuilder instance
- [x] Implement writeStoryFile() method:
  - [x] Use StoryTemplateBuilder to generate markdown
  - [x] Generate file name with kebab-case title
  - [x] Ensure docs/stories/ directory exists
  - [x] Write file with UTF-8 encoding
  - [x] Error handling with descriptive messages
- [x] Implement writeEpicsDocument() method:
  - [x] Generate header with metadata (date, counts)
  - [x] For each epic, generate section with goal, value, stories list
  - [x] Format stories with estimated hours and complexity
  - [x] Add markdown separators between epics
  - [x] Write to docs/epics.md
- [x] Implement writeAllStoryFiles() method:
  - [x] Write all story files sequentially
  - [x] Write epics document
  - [x] Collect file paths
  - [x] Return WriteSummary
  - [x] Handle partial failures gracefully
- [x] Add console logging for all write operations
- [x] Implement directory creation helper (fs.mkdir with recursive option)

### Task 3: Integrate with SolutioningOrchestrator (AC: 5)
- [x] Import StoryFileWriter in solutioning-orchestrator.ts
- [x] Instantiate StoryFileWriter in constructor
- [x] Add Step 9 in executeSolutioning() after sprint status generation (after line 380)
- [x] Call storyFileWriter.writeAllStoryFiles(result)
- [x] Log write summary (files written, locations)
- [x] Handle write failures without blocking workflow

### Task 4: Update Module Exports (AC: 1)
- [x] Add StoryFileWriter export to backend/src/solutioning/index.ts
- [x] Export WriteSummary interface type

### Task 5: Write Comprehensive Unit Tests (AC: 10)
- [x] Create `backend/tests/unit/solutioning/story-file-writer.test.ts`
- [x] Mock fs.promises (writeFile, mkdir)
- [x] Test writeStoryFile() with valid inputs
- [x] Test writeStoryFile() file naming convention
- [x] Test writeStoryFile() with directory creation
- [x] Test writeStoryFile() error handling
- [x] Test writeEpicsDocument() with single epic
- [x] Test writeEpicsDocument() with multiple epics
- [x] Test writeEpicsDocument() markdown formatting
- [x] Test writeAllStoryFiles() batch operation
- [x] Test writeAllStoryFiles() with write failures
- [x] Test WriteSummary result structure
- [x] Test YAML frontmatter integration
- [x] Test markdown content format
- [x] Verify 23 tests total with 100% pass rate

### Task 6: Run Tests and Verify (AC: 10)
- [x] Run unit tests: `npm test -- tests/unit/solutioning/story-file-writer.test.ts`
- [x] Verify 100% test pass rate (23/23 tests passed)
- [x] Check test coverage report

### Task 7: TypeScript Compilation (AC: 11)
- [x] Run type check: `npm run type-check`
- [x] Fix any type errors

### Task 8: Update Sprint Status and Commit
- [x] Update docs/sprint-status.yaml: mark story 4-8 as done
- [x] Commit all changes with descriptive message
- [x] Push to branch: claude/orchestrate-epic-workflow-011CV59j9ifgwddHwMJg573n

## Dependencies

**Blocking Dependencies:**
- 4-1-solutioning-data-models-story-schema (provides Story, Epic types and StoryTemplateBuilder)
- 4-6-story-validation-quality-check (completed - provides validated stories)
- 4-7-sprint-status-file-generation (completed - establishes file writing pattern)

**Enables:**
- 4-9-implementation-readiness-gate-validation (needs story files for validation)

**Soft Dependencies:**
- None

## Dev Notes

### Architecture Context

Story 4.8 completes the solutioning workflow by writing all documentation files. This is the final output generation step before the implementation readiness gate (Story 4.9).

**Key Design Decisions:**
- Sequential file writing (not parallel) to avoid file system race conditions and ensure consistent ordering
- Directory creation on-demand with recursive option for robustness
- Reuse StoryTemplateBuilder from Story 4.1 for consistent markdown formatting
- WriteSummary result provides visibility into what files were created
- Graceful degradation: write failures are logged but don't block the workflow

**File Organization:**
- Individual story files: `docs/stories/{epic}-{story}-{title}.md`
- Consolidated epics document: `docs/epics.md`
- Both files are regenerated on each solutioning run (idempotent)

### Project Structure Notes

**New Files Created:**
- `backend/src/solutioning/story-file-writer.ts` - StoryFileWriter service
- `backend/tests/unit/solutioning/story-file-writer.test.ts` - Unit tests (12+ tests)

**Modified Files:**
- `backend/src/solutioning/solutioning-orchestrator.ts` - Add Step 9 for file writing
- `backend/src/solutioning/index.ts` - Export StoryFileWriter and WriteSummary
- `docs/sprint-status.yaml` - Mark story 4-8 as done

**Generated Output Files (during solutioning runs):**
- `docs/stories/*.md` - Individual story markdown files (10-20 files typical)
- `docs/epics.md` - Consolidated epics document

### Testing Strategy

**Unit Tests (12+ tests):**
- writeStoryFile() tests:
  - Valid story write with correct file name and content
  - YAML frontmatter formatting
  - Markdown content formatting
  - Directory creation when missing
  - Error handling for write failures
- writeEpicsDocument() tests:
  - Single epic document generation
  - Multiple epics with proper formatting
  - Header metadata accuracy
  - Story list formatting
- writeAllStoryFiles() tests:
  - Batch write all stories and epics document
  - WriteSummary result structure
  - Partial failure handling
  - File path collection

**Mocking Strategy:**
- Mock fs.promises.writeFile to avoid actual file I/O
- Mock fs.promises.mkdir for directory creation tests
- Verify method calls with correct paths and content
- Test error scenarios by mocking rejections

**Coverage Target:**
- 100% statement coverage
- 100% branch coverage for error paths
- All public methods tested

### References

- **Epic 4 Tech Spec**: `docs/epics/epic-4-tech-spec.md` (Story 4.8 requirements)
- **Story 4.1**: StoryTemplateBuilder implementation
- **Story 4.7**: Sprint Status Generator (file writing pattern reference)
- **Solutioning Orchestrator**: Integration point for Step 9

## Change Log

- **2025-11-13**: Story created (in-progress) - Implementation started

## Dev Agent Record

### Context Reference

- `docs/stories/4-8-story-file-writer-epics-document-generator.context.xml` (To be generated)

### Agent Model Used

<!-- Will be filled by dev agent during implementation -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent during implementation -->

### File List

<!-- Will be filled by dev agent during implementation -->
