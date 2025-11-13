# Solutioning Type System

> **Epic 4: Solutioning Phase Automation - Story 4.1**
> Foundational data models and schemas for epic formation, story decomposition, and dependency analysis.

## Overview

The Solutioning module provides the core data structures and validation logic for automating the solutioning phase of software development. This includes:

- **TypeScript Interfaces**: Strongly-typed data models for epics, stories, and dependency graphs
- **JSON Schema Validation**: Runtime validation using ajv for data integrity
- **Story Template Builder**: Utilities for generating story markdown files from structured data

All types are **pure data definitions** with no external dependencies beyond validation (ajv). No LLM calls, no file I/O in core types.

## Architecture

### Foundation-First Pattern

This story (4.1) is the **foundation** for Epic 4. All subsequent stories (4.2-4.9) depend on these types:

- **Story 4.2**: Bob Agent Infrastructure - uses Epic, Story types
- **Story 4.3**: Solutioning Workflow Engine - uses all solutioning types
- **Story 4.4**: Epic Formation & Story Decomposition - uses Epic, Story types
- **Story 4.5**: Dependency Detection & Graph Generation - uses DependencyGraph, DependencyEdge types
- **Story 4.6**: Story Validation - uses ValidationResult, Story types
- **Story 4.7**: Sprint Status File Generation - uses sprint-status.yaml schema
- **Story 4.8**: Story File Writer - uses StoryTemplateBuilder
- **Story 4.9**: Implementation Readiness Gate - uses ValidationResult types

### Module Structure

```
backend/src/solutioning/
├── types.ts                    # Core TypeScript interfaces
├── schemas.ts                  # JSON schema validation (ajv)
├── story-template-builder.ts  # Story markdown generation
├── index.ts                    # Barrel exports
└── README.md                   # This file

backend/tests/unit/solutioning/
├── types.test.ts
├── schemas.test.ts
└── story-template-builder.test.ts

docs/templates/
└── story-template.md           # Story structure template
```

## Type Definitions

### Core Types

#### `StoryStatus`

Story lifecycle status values:

```typescript
type StoryStatus =
  | "backlog"        // Story exists in epic file but not drafted
  | "drafted"        // Story file created in stories folder
  | "ready-for-dev"  // Draft approved and story context created
  | "in-progress"    // Developer actively working on implementation
  | "review"         // Under review (via code-review workflow)
  | "done";          // Story completed and merged
```

#### `Complexity`

Story complexity for estimation:

```typescript
type Complexity = "low" | "medium" | "high";
```

### Data Model Interfaces

#### `Epic`

Represents a major feature grouping 3-10 related stories.

```typescript
interface Epic {
  id: string;                    // "epic-1", "epic-2", etc.
  title: string;                 // Business value name
  goal: string;                  // Clear goal statement
  value_proposition: string;     // Why this epic matters
  stories: Story[];              // 3-10 stories
  business_value: string;        // Quantifiable value
  estimated_duration: string;    // "1-2 sprints"
}
```

**Example:**

```typescript
import { Epic } from './solutioning';

const epic: Epic = {
  id: "epic-4",
  title: "Solutioning Phase Automation",
  goal: "Automate epic formation and story decomposition",
  value_proposition: "Reduce manual planning effort by 80%",
  stories: [story1, story2, story3],
  business_value: "15 hours saved per sprint in planning",
  estimated_duration: "2-3 sprints"
};
```

#### `Story`

Represents a single unit of work (<8 hours for autonomous completion).

```typescript
interface Story {
  id: string;                       // "4-1", "4-2", etc.
  epic: string;                     // Parent epic ID
  title: string;                    // Action-oriented title
  description: string;              // "As a..., I want..., So that..."
  acceptance_criteria: string[];    // 8-12 testable criteria
  dependencies: string[];           // Story IDs that block this story
  status: StoryStatus;              // Current lifecycle status
  technical_notes: TechnicalNotes;  // Implementation guidance
  estimated_hours: number;          // Target: <8 hours
  complexity: Complexity;           // Planning complexity
}
```

**Example:**

```typescript
import { Story } from './solutioning';

const story: Story = {
  id: "4-1",
  epic: "epic-4",
  title: "Solutioning Data Models & Story Schema",
  description: "As a solutioning system developer, I want foundational data models...",
  acceptance_criteria: [
    "TypeScript interfaces defined in types.ts",
    "JSON schema validation implemented",
    "All tests passing with 80%+ coverage"
  ],
  dependencies: [],
  status: "in-progress",
  technical_notes: {
    affected_files: ["backend/src/solutioning/types.ts"],
    endpoints: [],
    data_structures: ["Epic", "Story", "DependencyGraph"],
    test_requirements: "Unit tests with 80%+ coverage using Vitest"
  },
  estimated_hours: 8,
  complexity: "medium"
};
```

#### `TechnicalNotes`

Implementation guidance for a story.

```typescript
interface TechnicalNotes {
  affected_files: string[];     // Files likely to change
  endpoints: string[];          // API endpoints (if applicable)
  data_structures: string[];    // Key data models
  test_requirements: string;    // Testing approach
}
```

#### `DependencyGraph`

Represents story relationships for parallel work planning.

```typescript
interface DependencyGraph {
  nodes: GraphNode[];           // All stories with metadata
  edges: DependencyEdge[];      // Dependency relationships
  critical_path: string[];      // Longest dependency chain
  bottlenecks: string[];        // Stories blocking ≥3 others
  parallelizable: string[][];   // Groups of parallel stories
  metadata: GraphMetadata;      // Aggregate statistics
}
```

**Example:**

```typescript
import { DependencyGraph } from './solutioning';

const graph: DependencyGraph = {
  nodes: [
    { id: "4-1", title: "Data Models", status: "done", epic: "epic-4", complexity: "medium" },
    { id: "4-2", title: "Bob Agent", status: "in-progress", epic: "epic-4", complexity: "high" }
  ],
  edges: [
    { from: "4-1", to: "4-2", type: "hard", blocking: true }
  ],
  critical_path: ["4-1", "4-2", "4-3"],
  bottlenecks: ["4-1"],
  parallelizable: [["4-4", "4-5"], ["4-6", "4-7"]],
  metadata: {
    totalStories: 9,
    parallelizable: 6,
    bottlenecks: ["4-1"],
    criticalPathLength: 3
  }
};
```

#### `GraphNode`, `DependencyEdge`, `GraphMetadata`

Supporting interfaces for dependency graph:

```typescript
interface GraphNode {
  id: string;              // Story ID
  title: string;           // Story title
  status: StoryStatus;     // Current status
  epic: string;            // Parent epic
  complexity: Complexity;  // Story complexity
}

interface DependencyEdge {
  from: string;            // Prerequisite story ID
  to: string;              // Dependent story ID
  type: 'hard' | 'soft';   // hard = blocking, soft = suggested
  blocking: boolean;       // Cannot start until prerequisite complete
}

interface GraphMetadata {
  totalStories: number;         // Total count
  parallelizable: number;       // Can work in parallel
  bottlenecks: string[];        // Story IDs blocking ≥3 others
  criticalPathLength: number;   // Longest chain length
}
```

#### `ValidationResult`, `ValidationCheck`

Story quality validation results:

```typescript
interface ValidationResult {
  pass: boolean;              // True if all checks pass
  score: number;              // Weighted average (0.0-1.0)
  checks: ValidationCheck[];  // Individual check results
  blockers: string[];         // Critical issues
  warnings: string[];         // Non-blocking issues
}

interface ValidationCheck {
  category: string;    // "size" | "clarity" | "dependencies" | "completeness"
  name: string;        // Check name
  pass: boolean;       // Check result
  details: string;     // Specific findings
}
```

## JSON Schema Validation

### Usage

All validation functions return a `ValidationResult` object with detailed error messages:

```typescript
import { validateEpic, validateStory, validateDependencyGraph } from './solutioning';

// Validate an Epic
const epicResult = validateEpic(epicData);
if (!epicResult.pass) {
  console.error('Epic validation failed:', epicResult.blockers);
}

// Validate a Story
const storyResult = validateStory(storyData);
if (!storyResult.pass) {
  console.error('Story validation failed:', storyResult.blockers);
}

// Validate a DependencyGraph
const graphResult = validateDependencyGraph(graphData);
if (!graphResult.pass) {
  console.error('Graph validation failed:', graphResult.blockers);
}
```

### Error Messages

Validation errors include field paths and expected types:

```typescript
// Example error messages:
// - "Field 'id': expected type string, got number"
// - "Field 'epic': does not match required pattern ^epic-\d+$"
// - "Field 'acceptance_criteria': missing required property 'test_requirements'"
// - "Field 'status': must be one of [backlog, drafted, ready-for-dev, in-progress, review, done]"
```

## Story Template Builder

### StoryTemplateBuilder Class

Generates story markdown files from Story objects.

```typescript
import { StoryTemplateBuilder } from './solutioning';

const builder = new StoryTemplateBuilder();

// Build story from template
const story = await builder.buildFromTemplate({
  id: '4-1',
  epic: 'epic-4',
  title: 'Data Models',
  description: 'As a developer, I want data models, So that I can build features.',
  acceptance_criteria: ['Interfaces defined', 'Tests passing'],
  dependencies: [],
  status: 'drafted',
  technical_notes: {
    affected_files: ['types.ts'],
    endpoints: [],
    data_structures: ['Epic', 'Story'],
    test_requirements: 'Unit tests with 80%+ coverage'
  },
  estimated_hours: 8,
  complexity: 'medium'
});

// Validate story format
const validation = builder.validateStoryFormat(story);
if (!validation.pass) {
  console.error('Story format invalid:', validation.warnings);
}

// Generate markdown
const markdown = builder.toMarkdown(story);

// Generate YAML frontmatter
const frontmatter = builder.toYAMLFrontmatter(story);
```

## Sprint Status YAML Schema

The `sprint-status.yaml` file tracks epic and story status:

```yaml
generated: "2025-11-12"              # ISO date string
project: "Agent Orchestrator"       # Project name
project_key: "agent-orchestrator"   # Unique project identifier
tracking_system: "file-system"      # Tracking system type
story_location: "{project-root}/docs/stories"  # Path to story files

development_status:
  # Epic status: backlog | contexted
  epic-4: contexted

  # Story status: backlog | drafted | ready-for-dev | in-progress | review | done
  4-1-solutioning-data-models-story-schema: in-progress
  4-2-bob-agent-infrastructure: ready-for-dev
  4-3-solutioning-workflow-engine: backlog
```

**Status Definitions:**

- **Epic Status:**
  - `backlog`: Epic exists in epic file but not contexted
  - `contexted`: Epic tech context created (required before drafting stories)

- **Story Status:**
  - `backlog`: Story only exists in epic file
  - `drafted`: Story file created in stories folder
  - `ready-for-dev`: Draft approved and story context created
  - `in-progress`: Developer actively working on implementation
  - `review`: Under review (via code-review workflow)
  - `done`: Story completed and merged

## Dependency Graph JSON Schema

Example `dependency-graph.json` structure:

```json
{
  "nodes": [
    {
      "id": "4-1",
      "title": "Solutioning Data Models",
      "status": "done",
      "epic": "epic-4",
      "complexity": "medium"
    },
    {
      "id": "4-2",
      "title": "Bob Agent Infrastructure",
      "status": "in-progress",
      "epic": "epic-4",
      "complexity": "high"
    }
  ],
  "edges": [
    {
      "from": "4-1",
      "to": "4-2",
      "type": "hard",
      "blocking": true
    }
  ],
  "critical_path": ["4-1", "4-2", "4-3"],
  "bottlenecks": ["4-1"],
  "parallelizable": [
    ["4-4", "4-5"],
    ["4-6", "4-7"]
  ],
  "metadata": {
    "totalStories": 9,
    "parallelizable": 6,
    "bottlenecks": ["4-1"],
    "criticalPathLength": 3
  }
}
```

## Testing

### Unit Tests

Comprehensive unit tests with 80%+ coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Organization

- `backend/tests/unit/solutioning/types.test.ts` - Type validation tests
- `backend/tests/unit/solutioning/schemas.test.ts` - Schema validation tests
- `backend/tests/unit/solutioning/story-template-builder.test.ts` - Builder tests

### Test Examples

```typescript
import { describe, it, expect } from 'vitest';
import { validateEpic, validateStory } from '../../src/solutioning/schemas.js';

describe('Epic Schema Validation', () => {
  it('should validate a valid epic object', () => {
    const epic = {
      id: 'epic-4',
      title: 'Solutioning Phase',
      goal: 'Automate planning',
      value_proposition: 'Save time',
      stories: [],
      business_value: '15 hours saved',
      estimated_duration: '2-3 sprints'
    };
    const result = validateEpic(epic);
    expect(result.pass).toBe(true);
  });

  it('should reject an invalid epic object', () => {
    const epic = { id: 123, title: null };
    const result = validateEpic(epic);
    expect(result.pass).toBe(false);
    expect(result.blockers.length).toBeGreaterThan(0);
  });
});
```

## Dependencies

### External Dependencies

- **ajv** (^8.12.0): JSON schema validation
- **js-yaml** (^4.1.0): YAML parsing for sprint-status.yaml

### Internal Dependencies

- No circular dependencies
- Compatible with Epic 1 core types (`WorkflowState`, etc.)
- Pure data layer - no external API calls

## References

- **Epic 4 Tech Spec**: `docs/epics/epic-4-tech-spec.md` (Lines 88-228)
- **Epics Breakdown**: `docs/epics.md` (Story 4.1, lines 985-1018)
- **Architecture Document**: `docs/architecture.md` (Microkernel Architecture)
- **Testing Guide**: `docs/testing-guide.md` (Test patterns and coverage)
- **Existing Sprint Status**: `docs/sprint-status.yaml` (Current format reference)

## License

UNLICENSED - Internal use only
