/**
 * Epic 5: Story Implementation Automation - Orchestration Module
 *
 * This module provides the complete story workflow orchestration system.
 * It coordinates Story 5.1 agents (Amelia, Alex), Story 5.2 context generator,
 * and Epic 1 core components (WorktreeManager, StateManager, AgentPool) into
 * a cohesive pipeline that autonomously develops stories from context to PR.
 *
 * @module implementation/orchestration
 */

export { WorkflowOrchestrator } from './WorkflowOrchestrator.js';

export type {
  StoryWorkflowState,
  PRResult,
  AgentActivity,
  ReviewStatus,
  PerformanceMetrics,
  EscalationContext,
  StepExecutionResult,
  WorkflowOrchestratorConfig
} from './workflow-types.js';
