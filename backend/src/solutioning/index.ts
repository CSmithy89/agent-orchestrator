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

// Export SolutioningWorkflowEngine (Story 4.3)
export { SolutioningWorkflowEngine } from './workflow-engine.js';
export type {
  SolutioningWorkflowState,
  StepContext,
  StepHook,
  WorkflowCheckpoint,
  ExecutionPlan,
  WorkflowProgress,
  SolutioningEngineOptions
} from './workflow-engine.js';

// Export Epic Formation Service (Story 4.4)
export { EpicFormationService } from './epic-formation-service.js';
export type { EpicFormationMetrics } from './epic-formation-service.js';

// Export Story Decomposition Service (Story 4.4)
export { StoryDecompositionService } from './story-decomposition-service.js';
export type { StoryDecompositionMetrics } from './story-decomposition-service.js';

// Export Solutioning Orchestrator (Story 4.4)
export { SolutioningOrchestrator } from './solutioning-orchestrator.js';
export type { SolutioningResult } from './solutioning-orchestrator.js';

// Export Dependency Detection Service (Story 4.5)
export { DependencyDetectionService } from './dependency-detection-service.js';
export type { DependencyDetectionResult, DependencyDetectionMetrics } from './dependency-detection-service.js';

// Export Dependency Graph Generator (Story 4.5)
export { DependencyGraphGenerator } from './dependency-graph-generator.js';

// Export Story Validator (Story 4.6)
export { StoryValidator } from './story-validator.js';
export type { BatchValidationResult } from './story-validator.js';

// Export Sprint Status Generator (Story 4.7)
export { SprintStatusGenerator } from './sprint-status-generator.js';
