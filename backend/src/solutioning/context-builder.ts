/**
 * Solutioning Agent Context Builder
 *
 * Builds optimized context for Bob agent including PRD, architecture, and story patterns.
 * Generates prompts for epic formation, story decomposition, and dependency detection.
 *
 * @module solutioning/context-builder
 * @see docs/epics/epic-4-tech-spec.md - Lines 230-278 for API specification
 */

import { Epic, Story } from './types.js';
import { loadBobPersona } from './bob-agent-loader.js';

/**
 * Story sizing and context constraints for autonomous agents
 */
export interface AgentConstraints {
  /** Maximum words per story (description + ACs + technical notes) */
  storyMaxWords: number;

  /** Minimum acceptance criteria per story */
  acceptanceCriteriaMin: number;

  /** Maximum acceptance criteria per story */
  acceptanceCriteriaMax: number;

  /** Maximum estimated hours per story */
  maxEstimatedHours: number;

  /** Maximum context tokens (story + PRD + architecture + epic) */
  maxContextTokens: number;

  /** Confidence threshold for autonomous execution */
  confidenceThreshold: number;
}

/**
 * Agent context for Bob (Scrum Master) agent invocation
 *
 * Contains optimized PRD, architecture, story patterns, and constraints
 * for epic formation, story decomposition, and dependency detection.
 */
export interface AgentContext {
  /** Pruned PRD functional requirements (<30k tokens) */
  prd: string;

  /** Architecture overview with component boundaries and constraints */
  architecture: string;

  /** BMAD story patterns and quality guidelines */
  storyPatterns: string;

  /** Story sizing and context constraints */
  constraints: AgentConstraints;
}

/**
 * Default constraints for story sizing and context windows
 */
const DEFAULT_CONSTRAINTS: AgentConstraints = {
  storyMaxWords: 500,
  acceptanceCriteriaMin: 8,
  acceptanceCriteriaMax: 12,
  maxEstimatedHours: 2,
  maxContextTokens: 200000,
  confidenceThreshold: 0.75
};

/**
 * Solutioning Agent Context Builder
 *
 * Prepares optimized context for Bob agent invocation:
 * - Extracts functional requirements from PRD (excludes introduction, glossary, appendices)
 * - Extracts architecture overview and constraints (excludes detailed API specs)
 * - Loads BMAD story patterns from Bob persona
 * - Optimizes token usage (<30k tokens for PRD)
 */
export class SolutioningAgentContextBuilder {
  /**
   * Build context for Bob agent
   *
   * Extracts relevant sections from PRD and architecture, loads story patterns,
   * and optimizes for token efficiency (<30k tokens).
   *
   * @param prd Full PRD markdown content
   * @param architecture Full architecture markdown content
   * @returns AgentContext with optimized content
   *
   * @example
   * ```typescript
   * const builder = new SolutioningAgentContextBuilder();
   * const context = await builder.buildBobContext(prdContent, archContent);
   * console.log(context.constraints.storyMaxWords); // 500
   * ```
   */
  async buildBobContext(prd: string, architecture: string): Promise<AgentContext> {
    // Extract functional requirements from PRD
    const prdOptimized = this.extractFunctionalRequirements(prd);

    // Extract architecture overview and constraints
    const archOptimized = this.extractArchitectureOverview(architecture);

    // Load BMAD story patterns from Bob persona
    const persona = await loadBobPersona();
    const storyPatterns = persona.storyPatterns || persona.decisionApproach;

    // Estimate tokens and prune if needed
    const prdPruned = this.optimizeTokenUsage(prdOptimized, 30000);

    return {
      prd: prdPruned,
      architecture: archOptimized,
      storyPatterns,
      constraints: DEFAULT_CONSTRAINTS
    };
  }

  /**
   * Extract functional requirements sections from PRD
   *
   * Includes:
   * - Functional Requirements sections
   * - Features sections
   * - User Stories sections
   * - Use Cases sections
   *
   * Excludes:
   * - Introduction/Executive Summary
   * - Glossary/Definitions
   * - Appendices/References
   * - Non-functional requirements (performance, security - handled in architecture)
   *
   * @param prd Full PRD markdown
   * @returns Optimized PRD with only functional requirements
   */
  private extractFunctionalRequirements(prd: string): string {
    const lines = prd.split('\n');
    const result: string[] = [];
    let inRelevantSection = false;

    // Sections to include (functional requirements)
    const includeSections = [
      'functional requirements',
      'features',
      'user stories',
      'use cases',
      'capabilities',
      'requirements',
      'epic'
    ];

    // Sections to exclude (non-functional content)
    const excludeSections = [
      'introduction',
      'executive summary',
      'glossary',
      'definitions',
      'appendix',
      'appendices',
      'references',
      'bibliography',
      'non-functional requirements',
      'performance requirements',
      'security requirements'
    ];

    for (const line of lines) {
      // Check for section headers (## or ###)
      if (line.match(/^#{2,3}\s+/)) {
        const sectionTitle = line.replace(/^#{2,3}\s+/, '').toLowerCase().trim();

        // Check if this is a section we should include
        const shouldInclude = includeSections.some(s => sectionTitle.includes(s));
        const shouldExclude = excludeSections.some(s => sectionTitle.includes(s));

        inRelevantSection = shouldInclude && !shouldExclude;
      }

      // Include line if in relevant section
      if (inRelevantSection) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Extract architecture overview and constraints
   *
   * Includes:
   * - System Overview
   * - Component Boundaries
   * - Technology Stack
   * - Architecture Constraints
   * - High-level Data Flow
   *
   * Excludes:
   * - Detailed API Specifications
   * - Database Schemas (unless needed for epic scoping)
   * - Implementation Details
   * - Code Examples
   *
   * @param architecture Full architecture markdown
   * @returns Optimized architecture with overview and constraints
   */
  private extractArchitectureOverview(architecture: string): string {
    const lines = architecture.split('\n');
    const result: string[] = [];
    let inRelevantSection = false;

    // Sections to include (high-level architecture)
    const includeSections = [
      'overview',
      'system architecture',
      'component',
      'technology stack',
      'tech stack',
      'constraints',
      'data flow',
      'architecture principles',
      'design principles'
    ];

    // Sections to exclude (detailed implementation)
    const excludeSections = [
      'api specification',
      'api reference',
      'endpoint details',
      'database schema',
      'data model',
      'code examples',
      'implementation details',
      'deployment'
    ];

    for (const line of lines) {
      // Check for section headers (## or ###)
      if (line.match(/^#{2,3}\s+/)) {
        const sectionTitle = line.replace(/^#{2,3}\s+/, '').toLowerCase().trim();

        // Check if this is a section we should include
        const shouldInclude = includeSections.some(s => sectionTitle.includes(s));
        const shouldExclude = excludeSections.some(s => sectionTitle.includes(s));

        inRelevantSection = shouldInclude && !shouldExclude;
      }

      // Include line if in relevant section
      if (inRelevantSection) {
        result.push(line);
      }
    }

    return result.join('\n');
  }

  /**
   * Optimize token usage by pruning content if it exceeds limit
   *
   * Rough estimation: 1 token ≈ 4 characters
   * Prunes by:
   * 1. Removing empty lines
   * 2. Truncating long sections
   * 3. Keeping most important sections (requirements, epics, features)
   *
   * @param content Markdown content to optimize
   * @param maxTokens Maximum tokens allowed
   * @returns Optimized content within token limit
   */
  private optimizeTokenUsage(content: string, maxTokens: number): string {
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(content.length / 4);

    if (estimatedTokens <= maxTokens) {
      return content; // Already within limit
    }

    // Calculate reduction ratio
    const reductionRatio = maxTokens / estimatedTokens;
    const targetChars = Math.floor(content.length * reductionRatio);

    // Remove excess whitespace first
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    let optimized = lines.join('\n');

    // If still too large, truncate to target character count
    if (optimized.length > targetChars) {
      optimized = optimized.substring(0, targetChars);

      // Truncate at last complete section to avoid broken markdown
      const lastSectionIndex = optimized.lastIndexOf('\n## ');
      if (lastSectionIndex > 0) {
        optimized = optimized.substring(0, lastSectionIndex);
      }

      optimized += '\n\n[... Content truncated for token optimization ...]';
    }

    return optimized;
  }

  /**
   * Generate prompt for Bob agent to form epics from PRD
   *
   * Prompts Bob to analyze PRD functional requirements and form 3-8 epics
   * with business value naming, independent value, and 1-2 sprint duration.
   *
   * @param context Agent context with PRD, architecture, patterns
   * @returns Formatted prompt for epic formation
   *
   * @example
   * ```typescript
   * const prompt = builder.bobEpicFormationPrompt(context);
   * // Prompt includes PRD requirements, epic formation guidelines, confidence scoring
   * ```
   */
  bobEpicFormationPrompt(context: AgentContext): string {
    return `# Epic Formation Task

## Your Role
You are Bob, a Scrum Master expert in epic formation and story decomposition.

## Task
Analyze the provided PRD functional requirements and form 3-8 epics with business value focus.

## PRD Functional Requirements
${context.prd}

## Architecture Context
${context.architecture}

## BMAD Story Patterns
${context.storyPatterns}

## Epic Formation Guidelines

**Epic Grouping**:
- Group features by business value, NOT technical architecture
- Each epic should be independently valuable and testable
- Target 3-8 epics total (avoid too many small or too few large epics)
- Each epic should contain 3-10 stories
- Epic should be completable in 1-2 sprints

**Epic Naming**:
- Use business value names: "User Authentication" NOT "Auth Service"
- Focus on user outcomes: "Payment Processing" NOT "Payment API"
- Avoid technical jargon: "Content Management" NOT "CRUD Operations"

**Epic Structure**:
Each epic must include:
- \`id\`: Epic identifier (e.g., "epic-1", "epic-2")
- \`title\`: Business value name
- \`goal\`: Clear statement of what epic achieves
- \`value_proposition\`: Why this epic matters - business impact
- \`business_value\`: Quantifiable value (revenue, cost reduction, user satisfaction)
- \`estimated_duration\`: Time to complete (e.g., "1-2 sprints")

**Epic Dependencies**:
- Consider natural sequencing (auth before features, data before logic)
- Identify foundation epics that enable others
- Note cross-epic dependencies in reasoning

## Constraints
- Story max words: ${context.constraints.storyMaxWords}
- Acceptance criteria: ${context.constraints.acceptanceCriteriaMin}-${context.constraints.acceptanceCriteriaMax} per story
- Max context tokens: ${context.constraints.maxContextTokens}
- Confidence threshold: ${context.constraints.confidenceThreshold}

## Output Format

Respond with JSON matching this structure:

\`\`\`json
{
  "epics": [
    {
      "id": "epic-1",
      "title": "User Authentication",
      "goal": "Enable users to securely register, login, and manage accounts",
      "value_proposition": "Provides secure access control and personalized user experiences",
      "business_value": "Foundation for all user-specific features, required for 90% of functionality",
      "estimated_duration": "1-2 sprints"
    }
  ],
  "confidence": 0.85,
  "reasoning": "High confidence - Clear authentication requirements in PRD sections 3.1-3.4"
}
\`\`\`

## Confidence Scoring
Include confidence score (0.0-1.0) in response metadata for each decision:
- **0.90-1.00**: Very clear PRD requirements, obvious epic boundaries
- **0.75-0.89**: Clear requirements, minor ambiguity in grouping
- **0.50-0.74**: Moderate ambiguity, multiple valid decompositions
- **<0.50**: Significant ambiguity, requires human review

**Confidence threshold: ${context.constraints.confidenceThreshold}**
- Decisions ≥${context.constraints.confidenceThreshold}: Proceed with autonomous execution
- Decisions <${context.constraints.confidenceThreshold}: Flag for human review with reasoning

Generate the epic formation JSON response now.
`;
  }

  /**
   * Generate prompt for Bob agent to decompose epic into stories
   *
   * Prompts Bob to decompose epic into 3-10 vertical-slice stories with
   * 8-12 acceptance criteria each, <500 words, <2 hours development time.
   *
   * @param context Agent context with PRD, architecture, patterns
   * @param epic Epic to decompose into stories
   * @returns Formatted prompt for story decomposition
   *
   * @example
   * ```typescript
   * const prompt = builder.bobStoryDecompositionPrompt(context, epic);
   * // Prompt includes epic details, story format, AC guidelines, sizing constraints
   * ```
   */
  bobStoryDecompositionPrompt(context: AgentContext, epic: Epic): string {
    return `# Story Decomposition Task

## Your Role
You are Bob, a Scrum Master expert in story decomposition and acceptance criteria writing.

## Task
Decompose the following epic into 3-10 vertical-slice stories with clear acceptance criteria.

## Epic Details
- **ID**: ${epic.id}
- **Title**: ${epic.title}
- **Goal**: ${epic.goal}
- **Value Proposition**: ${epic.value_proposition}
- **Business Value**: ${epic.business_value}
- **Estimated Duration**: ${epic.estimated_duration}

## PRD Context (Relevant Sections)
${context.prd}

## Architecture Context
${context.architecture}

## BMAD Story Patterns
${context.storyPatterns}

## Story Decomposition Guidelines

**Story Format**:
- Always follow: "As a [role], I want [capability], So that [benefit]"
- Keep description <300 words
- Focus on single, vertical-slice functionality (end-to-end feature)
- Explain WHY (business value), not just WHAT (features)

**Acceptance Criteria**:
- Generate 8-12 testable, atomic acceptance criteria per story
- Each AC should be independently verifiable by automated tests
- Use "Given... When... Then..." format or numbered checklist
- Each AC should map to specific functionality or constraint
- Focus on observable outcomes, not implementation details
- Include test coverage requirement (typically 80%+ coverage)

**Story Sizing**:
- Total <500 words (description + all ACs + technical notes)
- Story must be completable in <2 hours by autonomous agent
- If story too large, split into multiple smaller stories
- Ensure story + context fits in 200k token window

**Technical Notes**:
For each story, include:
- \`affected_files\`: List of new files to create or existing files to modify
- \`endpoints\`: List of API endpoints if applicable
- \`data_structures\`: List of data models/types
- \`test_requirements\`: Specific test requirements

**Dependencies**:
- List story IDs this story depends on (use format: "4-1", "4-2")
- Empty array if no dependencies (foundation story)
- Hard dependencies block this story
- Soft dependencies suggest optimal order

**Single Responsibility**:
- Each story should have ONE clear, focused objective
- Avoid stories that do multiple unrelated things
- Follow vertical slicing: Include frontend + backend + tests for ONE feature

**Example Story Structure**:
\`\`\`json
{
  "id": "4-1",
  "epic": "epic-4",
  "title": "Solutioning Data Models & Story Schema",
  "description": "As a solutioning system developer, I want foundational data models (Epic, Story, DependencyEdge) with JSON schema validation, So that downstream stories can build type-safe epic/story generation with automated validation.",
  "acceptance_criteria": [
    "TypeScript interfaces defined: Epic, Story, DependencyEdge, TechnicalNotes",
    "JSON schemas implemented using ajv library for validation",
    "validateEpic(), validateStory(), validateDependencyGraph() functions exported",
    "Schema validation provides detailed error messages with field paths",
    "StoryTemplateBuilder class with buildFromTemplate(), toMarkdown() methods",
    "All exports available from backend/src/solutioning/index.ts",
    "Zero external dependencies beyond ajv and js-yaml",
    "Unit tests with 80%+ coverage using Vitest framework"
  ],
  "dependencies": [],
  "status": "backlog",
  "technical_notes": {
    "affected_files": [
      "backend/src/solutioning/types.ts",
      "backend/src/solutioning/schemas.ts",
      "backend/src/solutioning/story-template-builder.ts"
    ],
    "endpoints": [],
    "data_structures": ["Epic", "Story", "DependencyEdge", "TechnicalNotes"],
    "test_requirements": "Unit tests for all validation functions, template builder methods"
  },
  "estimated_hours": 2,
  "complexity": "low"
}
\`\`\`

## Constraints
- Story max words: ${context.constraints.storyMaxWords}
- Acceptance criteria: ${context.constraints.acceptanceCriteriaMin}-${context.constraints.acceptanceCriteriaMax} per story
- Max estimated hours: ${context.constraints.maxEstimatedHours}
- Max context tokens: ${context.constraints.maxContextTokens}
- Confidence threshold: ${context.constraints.confidenceThreshold}

## Output Format

Respond with JSON matching this structure:

\`\`\`json
{
  "stories": [
    {
      "id": "story-id",
      "epic": "${epic.id}",
      "title": "Story Title",
      "description": "As a..., I want..., So that...",
      "acceptance_criteria": ["AC1", "AC2", "..."],
      "dependencies": [],
      "status": "backlog",
      "technical_notes": {
        "affected_files": [],
        "endpoints": [],
        "data_structures": [],
        "test_requirements": ""
      },
      "estimated_hours": 2,
      "complexity": "low"
    }
  ],
  "confidence": 0.92,
  "reasoning": "High confidence - Foundation story with clear data model requirements"
}
\`\`\`

## Confidence Scoring
Include confidence score (0.0-1.0) in response metadata:
- **0.90-1.00**: Very clear epic scope, obvious story boundaries
- **0.75-0.89**: Clear scope, minor decisions on story splitting
- **0.50-0.74**: Moderate complexity, multiple valid decompositions
- **<0.50**: High complexity, unclear boundaries, needs human input

**Confidence threshold: ${context.constraints.confidenceThreshold}**
- If confidence <${context.constraints.confidenceThreshold}, provide reasoning for human review

Generate the story decomposition JSON response now.
`;
  }

  /**
   * Generate prompt for Bob agent to detect dependencies between stories
   *
   * Prompts Bob to analyze stories and identify technical dependencies
   * (data models before logic, auth before features, API before frontend).
   *
   * @param context Agent context with PRD, architecture, patterns
   * @param stories Array of stories to analyze for dependencies
   * @returns Formatted prompt for dependency detection
   *
   * @example
   * ```typescript
   * const prompt = builder.bobDependencyDetectionPrompt(context, stories);
   * // Prompt includes all stories, dependency patterns, hard/soft types
   * ```
   */
  bobDependencyDetectionPrompt(context: AgentContext, stories: Story[]): string {
    // Format stories for prompt
    const storyList = stories.map(s => `
**Story ${s.id}**: ${s.title}
- Epic: ${s.epic}
- Description: ${s.description}
- Technical Notes:
  - Files: ${s.technical_notes.affected_files.join(', ')}
  - Data Structures: ${s.technical_notes.data_structures.join(', ')}
  - Endpoints: ${s.technical_notes.endpoints.join(', ')}
`).join('\n');

    return `# Dependency Detection Task

## Your Role
You are Bob, a Scrum Master expert in identifying technical dependencies between stories.

## Task
Analyze all stories and identify technical dependencies with type (hard/soft) and blocking status.

## Stories to Analyze
${storyList}

## Architecture Context
${context.architecture}

## Dependency Detection Guidelines

**Dependency Types**:
- **Hard Dependency**: Story A cannot be implemented without Story B
  - Type imports (Story uses types defined in another story)
  - Infrastructure dependencies (Story uses infrastructure created in another story)
  - API dependencies (Frontend story needs backend endpoint from another story)
- **Soft Dependency**: Story A benefits from Story B but can work around
  - Test fixtures can substitute for real implementation
  - Mocking can substitute for real dependencies
  - Stories can be implemented in parallel with coordination

**Blocking Status**:
- **Blocking (true)**: Story cannot START until dependency completes
- **Non-Blocking (false)**: Story can start but should IDEALLY wait for dependency

**Common Dependency Patterns**:
1. **Data models before business logic** (hard, blocking)
   - Stories using types must wait for type definition stories
2. **API endpoints before frontend integration** (hard, blocking)
   - Frontend stories using endpoints must wait for backend API stories
3. **Authentication before protected features** (hard, blocking)
   - Stories requiring auth must wait for auth infrastructure stories
4. **Infrastructure before feature usage** (hard, blocking)
   - Stories using infrastructure must wait for infrastructure stories
5. **Schema validation before content generation** (hard, blocking)
   - Stories generating content must wait for validation schema stories
6. **Happy path before edge cases** (soft, non-blocking)
   - Edge case stories can be developed in parallel with fixtures
7. **Core features before optimizations** (soft, non-blocking)
   - Optimization stories can use mocks while core is developed

**Analysis Approach**:
1. Review each story's technical notes (affected_files, data_structures, endpoints)
2. Identify type imports between stories (look for shared data_structures)
3. Identify infrastructure usage (one story creates, another uses)
4. Identify API dependencies (backend creates endpoint, frontend consumes)
5. Determine if dependency is hard (cannot implement without) or soft (can mock/fixture)
6. Determine if dependency is blocking (cannot start) or non-blocking (can start in parallel)

## Output Format

Respond with JSON matching this structure:

\`\`\`json
{
  "dependencies": [
    {
      "from": "4-2",
      "to": "4-1",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-2 uses Epic/Story types defined in 4-1"
    },
    {
      "from": "4-4",
      "to": "4-2",
      "type": "hard",
      "blocking": true,
      "reasoning": "Story 4-4 invokes Bob agent infrastructure created in 4-2"
    },
    {
      "from": "4-5",
      "to": "4-4",
      "type": "soft",
      "blocking": false,
      "reasoning": "Story 4-5 benefits from epics/stories created in 4-4, but can use fixtures"
    }
  ],
  "confidence": 0.88,
  "reasoning": "High confidence - Clear technical dependencies based on type imports and infrastructure usage"
}
\`\`\`

## Confidence Scoring
Include confidence score (0.0-1.0) in response metadata:
- **0.90-1.00**: Clear technical dependencies from imports/infrastructure
- **0.75-0.89**: Most dependencies clear, minor ambiguity
- **0.50-0.74**: Some dependencies unclear, multiple sequencing options
- **<0.50**: Significant ambiguity, needs architectural review

**Confidence threshold: ${context.constraints.confidenceThreshold}**
- If confidence <${context.constraints.confidenceThreshold}, provide reasoning for human review

Generate the dependency detection JSON response now.
`;
  }
}
