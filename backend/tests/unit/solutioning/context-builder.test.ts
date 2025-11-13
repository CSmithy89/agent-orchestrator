/**
 * Unit tests for Solutioning Agent Context Builder
 *
 * Tests context building, token optimization, and prompt generation.
 * Verifies AC #3, #4, #8, #9, #10: Context building and prompt templates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolutioningAgentContextBuilder, AgentContext } from '../../../src/solutioning/context-builder.js';
import { Epic, Story } from '../../../src/solutioning/types.js';
import * as bobAgentLoader from '../../../src/solutioning/bob-agent-loader.js';

// Mock bob-agent-loader
vi.mock('../../../src/solutioning/bob-agent-loader.js');

// Fixture: Large PRD for token optimization testing
const LARGE_PRD = `
# Product Requirements Document

## Introduction

This is a long introduction section that should be excluded...
`.repeat(100) + `

## Functional Requirements

### User Authentication
- Users can register with email and password
- Users can login with credentials
- Users can reset forgotten passwords

### Payment Processing
- Users can add credit cards
- Users can process payments
- Users can view transaction history

## Glossary

This glossary should be excluded from context...
`.repeat(50);

// Fixture: Architecture document
const ARCHITECTURE_DOC = `
# System Architecture

## Overview

Microkernel architecture with core engine and workflow plugins.

## Component Boundaries

- Core Engine: Agent pool, workflow engine, state manager
- Workflow Plugins: PRD, architecture, solutioning workflows

## Technology Stack

- Backend: Node.js, TypeScript
- Testing: Vitest
- LLM: Multi-provider (Anthropic, OpenAI, Zhipu, Google)

## API Specification

Detailed endpoint specifications...
(This should be excluded)

## Database Schema

Detailed schema...
(This should be excluded)
`;

// Fixture: Bob persona
const MOCK_BOB_PERSONA = {
  role: 'Scrum Master',
  systemPrompt: 'You are Bob...',
  capabilities: ['Epic Formation', 'Story Decomposition'],
  decisionApproach: 'Your Approach\n1. Analyze\n2. Form\n3. Decompose',
  storyPatterns: 'BMAD Story Patterns:\n1. Data Models First\n2. Auth Before Protected\n3. API Before Frontend',
  rawContent: '# Bob...'
};

describe('SolutioningAgentContextBuilder', () => {
  let builder: SolutioningAgentContextBuilder;

  beforeEach(() => {
    builder = new SolutioningAgentContextBuilder();
    vi.clearAllMocks();

    // Mock loadBobPersona to return fixture
    vi.mocked(bobAgentLoader.loadBobPersona).mockResolvedValue(MOCK_BOB_PERSONA);
  });

  describe('buildBobContext()', () => {
    it('should build context with PRD, architecture, and story patterns', async () => {
      const prd = '## Functional Requirements\nUser authentication required';
      const arch = '## Overview\nMicrokernel architecture';

      const context = await builder.buildBobContext(prd, arch);

      expect(context).toBeDefined();
      expect(context.prd).toBeTruthy();
      expect(context.architecture).toBeTruthy();
      expect(context.storyPatterns).toBeTruthy();
      expect(context.constraints).toBeDefined();
    });

    it('should extract functional requirements from PRD', async () => {
      const prd = `
## Introduction
Skip this section

## Functional Requirements
Include this section
- Feature 1
- Feature 2

## Glossary
Skip this too
`;
      const arch = '## Overview\nArch overview';

      const context = await builder.buildBobContext(prd, arch);

      expect(context.prd).toContain('Functional Requirements');
      expect(context.prd).toContain('Feature 1');
      expect(context.prd).not.toContain('Introduction');
      expect(context.prd).not.toContain('Glossary');
    });

    it('should extract architecture overview and exclude detailed specs', async () => {
      const prd = '## Functional Requirements\nTest';
      const arch = `
## Overview
System overview here

## Component Boundaries
Component info here

## API Specification
Detailed API specs to exclude

## Database Schema
Detailed schema to exclude
`;

      const context = await builder.buildBobContext(prd, arch);

      expect(context.architecture).toContain('Overview');
      expect(context.architecture).toContain('Component Boundaries');
      expect(context.architecture).not.toContain('API Specification');
      expect(context.architecture).not.toContain('Database Schema');
    });

    it('should load BMAD story patterns from Bob persona', async () => {
      const prd = '## Functional Requirements\nTest';
      const arch = '## Overview\nTest';

      const context = await builder.buildBobContext(prd, arch);

      expect(context.storyPatterns).toContain('BMAD Story Patterns');
      expect(context.storyPatterns).toContain('Data Models First');
    });

    it('should optimize large PRD to <30k tokens', async () => {
      const context = await builder.buildBobContext(LARGE_PRD, ARCHITECTURE_DOC);

      // Rough token estimation: 1 token ≈ 4 characters
      const estimatedTokens = Math.ceil(context.prd.length / 4);
      expect(estimatedTokens).toBeLessThan(30000);
    });

    it('should include default constraints in context', async () => {
      const prd = '## Functional Requirements\nTest';
      const arch = '## Overview\nTest';

      const context = await builder.buildBobContext(prd, arch);

      expect(context.constraints.storyMaxWords).toBe(500);
      expect(context.constraints.acceptanceCriteriaMin).toBe(8);
      expect(context.constraints.acceptanceCriteriaMax).toBe(12);
      expect(context.constraints.maxEstimatedHours).toBe(2);
      expect(context.constraints.maxContextTokens).toBe(200000);
      expect(context.constraints.confidenceThreshold).toBe(0.75);
    });

    it('should preserve content when within token limit', async () => {
      const smallPRD = '## Functional Requirements\n- Feature 1\n- Feature 2';
      const arch = '## Overview\nSmall architecture doc';

      const context = await builder.buildBobContext(smallPRD, arch);

      expect(context.prd).toContain('Feature 1');
      expect(context.prd).toContain('Feature 2');
    });

    it('should handle PRD with no functional requirements section', async () => {
      const prd = '## Introduction\nNo functional requirements here';
      const arch = '## Overview\nTest';

      const context = await builder.buildBobContext(prd, arch);

      // Should return empty or minimal PRD content
      expect(context.prd).toBeDefined();
    });

    it('should handle architecture with no overview section', async () => {
      const prd = '## Functional Requirements\nTest';
      const arch = '## API Specification\nNo overview here';

      const context = await builder.buildBobContext(prd, arch);

      // Should return empty or minimal architecture content
      expect(context.architecture).toBeDefined();
    });
  });

  describe('bobEpicFormationPrompt()', () => {
    let context: AgentContext;

    beforeEach(async () => {
      context = await builder.buildBobContext(
        '## Functional Requirements\nUser auth, payments',
        '## Overview\nMicrokernel arch'
      );
    });

    it('should generate epic formation prompt with PRD requirements', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('Epic Formation Task');
      expect(prompt).toContain('PRD Functional Requirements');
      expect(prompt).toContain('User auth, payments');
    });

    it('should include architecture context in prompt', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('Architecture Context');
      expect(prompt).toContain('Microkernel arch');
    });

    it('should include story patterns in prompt', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('BMAD Story Patterns');
      expect(prompt).toContain('Data Models First');
    });

    it('should include epic formation guidelines', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('3-8 epics');
      expect(prompt).toContain('business value focus');
      expect(prompt).toContain('Epic Grouping');
      expect(prompt).toContain('Epic Naming');
    });

    it('should include constraints in prompt', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('Story max words: 500');
      expect(prompt).toContain('Acceptance criteria: 8-12');
      expect(prompt).toContain('Confidence threshold: 0.75');
    });

    it('should include JSON output format example', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('Output Format');
      expect(prompt).toContain('```json');
      expect(prompt).toContain('"epics"');
      expect(prompt).toContain('"confidence"');
    });

    it('should include confidence scoring guidelines', () => {
      const prompt = builder.bobEpicFormationPrompt(context);

      expect(prompt).toContain('Confidence Scoring');
      expect(prompt).toContain('0.90-1.00');
      expect(prompt).toContain('0.75-0.89');
      expect(prompt).toContain('<0.50');
    });
  });

  describe('bobStoryDecompositionPrompt()', () => {
    let context: AgentContext;
    let epic: Epic;

    beforeEach(async () => {
      context = await builder.buildBobContext(
        '## Functional Requirements\nUser auth',
        '## Overview\nArch'
      );

      epic = {
        id: 'epic-1',
        title: 'User Authentication',
        goal: 'Enable secure user access',
        value_proposition: 'Security and personalization',
        stories: [],
        business_value: 'Foundation for features',
        estimated_duration: '1-2 sprints'
      };
    });

    it('should generate story decomposition prompt with epic details', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Story Decomposition Task');
      expect(prompt).toContain('Epic Details');
      expect(prompt).toContain('epic-1');
      expect(prompt).toContain('User Authentication');
      expect(prompt).toContain('Enable secure user access');
    });

    it('should include story format guidelines', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Story Format');
      expect(prompt).toContain('As a [role], I want [capability], So that [benefit]');
      expect(prompt).toContain('<300 words');
    });

    it('should include acceptance criteria guidelines (8-12 ACs)', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Acceptance Criteria');
      expect(prompt).toContain('8-12 testable, atomic');
      expect(prompt).toContain('Given... When... Then...');
      expect(prompt).toContain('independently verifiable');
    });

    it('should include story sizing constraints (<500 words, <2 hours)', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Story Sizing');
      expect(prompt).toContain('<500 words');
      expect(prompt).toContain('<2 hours');
      expect(prompt).toContain('200k token window');
    });

    it('should include technical notes requirements', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Technical Notes');
      expect(prompt).toContain('affected_files');
      expect(prompt).toContain('endpoints');
      expect(prompt).toContain('data_structures');
      expect(prompt).toContain('test_requirements');
    });

    it('should include example story structure', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Example Story Structure');
      expect(prompt).toContain('4-1');
      expect(prompt).toContain('Solutioning Data Models');
    });

    it('should include single responsibility guideline', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Single Responsibility');
      expect(prompt).toContain('ONE clear, focused objective');
      expect(prompt).toContain('vertical slicing');
    });

    it('should include confidence scoring with threshold', () => {
      const prompt = builder.bobStoryDecompositionPrompt(context, epic);

      expect(prompt).toContain('Confidence Scoring');
      expect(prompt).toContain('Confidence threshold: 0.75');
    });
  });

  describe('bobDependencyDetectionPrompt()', () => {
    let context: AgentContext;
    let stories: Story[];

    beforeEach(async () => {
      context = await builder.buildBobContext(
        '## Functional Requirements\nTest',
        '## Overview\nTest'
      );

      stories = [
        {
          id: '4-1',
          epic: 'epic-4',
          title: 'Data Models',
          description: 'As a developer, I want data models...',
          acceptance_criteria: ['Define types'],
          dependencies: [],
          status: 'backlog',
          technical_notes: {
            affected_files: ['types.ts'],
            endpoints: [],
            data_structures: ['Epic', 'Story'],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'low'
        },
        {
          id: '4-2',
          epic: 'epic-4',
          title: 'Bob Agent Infrastructure',
          description: 'As a developer, I want Bob agent...',
          acceptance_criteria: ['Load persona'],
          dependencies: ['4-1'],
          status: 'backlog',
          technical_notes: {
            affected_files: ['bob-agent-loader.ts'],
            endpoints: [],
            data_structures: [],
            test_requirements: 'Unit tests'
          },
          estimated_hours: 2,
          complexity: 'low'
        }
      ];
    });

    it('should generate dependency detection prompt with all stories', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Dependency Detection Task');
      expect(prompt).toContain('Stories to Analyze');
      expect(prompt).toContain('Story 4-1');
      expect(prompt).toContain('Story 4-2');
      expect(prompt).toContain('Data Models');
      expect(prompt).toContain('Bob Agent Infrastructure');
    });

    it('should include story technical notes in prompt', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Files: types.ts');
      expect(prompt).toContain('Data Structures: Epic, Story');
    });

    it('should include dependency type definitions (hard/soft)', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Dependency Types');
      expect(prompt).toContain('Hard Dependency');
      expect(prompt).toContain('Soft Dependency');
      expect(prompt).toContain('Type imports');
    });

    it('should include blocking status definitions', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Blocking Status');
      expect(prompt).toContain('Blocking (true)');
      expect(prompt).toContain('Non-Blocking (false)');
    });

    it('should include common dependency patterns', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Common Dependency Patterns');
      expect(prompt).toContain('Data models before business logic');
      expect(prompt).toContain('API endpoints before frontend');
      expect(prompt).toContain('Authentication before protected features');
    });

    it('should include JSON output format', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Output Format');
      expect(prompt).toContain('```json');
      expect(prompt).toContain('"dependencies"');
      expect(prompt).toContain('"from"');
      expect(prompt).toContain('"to"');
      expect(prompt).toContain('"type"');
      expect(prompt).toContain('"blocking"');
    });

    it('should include confidence scoring guidelines', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, stories);

      expect(prompt).toContain('Confidence Scoring');
      expect(prompt).toContain('0.90-1.00');
      expect(prompt).toContain('<0.50');
    });

    it('should handle empty story list', () => {
      const prompt = builder.bobDependencyDetectionPrompt(context, []);

      expect(prompt).toContain('Stories to Analyze');
      // Should not crash with empty list
    });
  });

  describe('AgentContext interface', () => {
    it('should return context with all required fields', async () => {
      const prd = '## Functional Requirements\nTest';
      const arch = '## Overview\nTest';

      const context: AgentContext = await builder.buildBobContext(prd, arch);

      expect(context).toHaveProperty('prd');
      expect(context).toHaveProperty('architecture');
      expect(context).toHaveProperty('storyPatterns');
      expect(context).toHaveProperty('constraints');

      expect(typeof context.prd).toBe('string');
      expect(typeof context.architecture).toBe('string');
      expect(typeof context.storyPatterns).toBe('string');
      expect(typeof context.constraints).toBe('object');
    });

    it('should have valid constraints structure', async () => {
      const context = await builder.buildBobContext(
        '## Functional Requirements\nTest',
        '## Overview\nTest'
      );

      const { constraints } = context;

      expect(typeof constraints.storyMaxWords).toBe('number');
      expect(typeof constraints.acceptanceCriteriaMin).toBe('number');
      expect(typeof constraints.acceptanceCriteriaMax).toBe('number');
      expect(typeof constraints.maxEstimatedHours).toBe('number');
      expect(typeof constraints.maxContextTokens).toBe('number');
      expect(typeof constraints.confidenceThreshold).toBe('number');

      expect(constraints.acceptanceCriteriaMin).toBeLessThan(constraints.acceptanceCriteriaMax);
      expect(constraints.confidenceThreshold).toBeGreaterThan(0);
      expect(constraints.confidenceThreshold).toBeLessThanOrEqual(1);
    });
  });
});
