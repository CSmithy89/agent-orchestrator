/**
 * Solutioning Module - Barrel Export
 *
 * Exports all types, schemas, and utilities for the Solutioning Phase Automation (Epic 4).
 * This module provides the foundational data models and validation for story management.
 *
 * @module solutioning
 * @see docs/epics/epic-4-tech-spec.md for detailed specifications
 *
 * @example
 * ```typescript
 * // Import types
 * import { Epic, Story, DependencyGraph, ValidationResult } from './solutioning';
 *
 * // Import validation functions
 * import { validateEpic, validateStory } from './solutioning';
 *
 * // Import template builder
 * import { StoryTemplateBuilder } from './solutioning';
 * ```
 */

// Export all types
export type {
  Epic,
  Story,
  TechnicalNotes,
  DependencyGraph,
  GraphNode,
  DependencyEdge,
  GraphMetadata,
  StoryMetadata,
  ValidationResult,
  ValidationCheck,
  StoryStatus,
  Complexity,
} from './types.js';

// Export validation functions
export {
  validateEpic,
  validateStory,
  validateDependencyGraph,
  validateValidationResult,
} from './schemas.js';

// Export StoryTemplateBuilder
export { StoryTemplateBuilder } from './story-template-builder.js';
export type { StoryObject } from './story-template-builder.js';

// Export Bob Agent Infrastructure (Story 4.2)
export { loadBobPersona, clearPersonaCache } from './bob-agent-loader.js';
export type { BobPersona } from './bob-agent-loader.js';

export { loadBobLLMConfig, validateBobLLMConfig } from './bob-llm-config.js';

export { SolutioningAgentContextBuilder } from './context-builder.js';
export type { AgentContext, AgentConstraints } from './context-builder.js';

export { BobAgentActions, initializeBobAgent } from './bob-agent-factory.js';
