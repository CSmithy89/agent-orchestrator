/**
 * Event Type Definitions
 * TypeScript interfaces for real-time WebSocket events
 */

/**
 * Base event structure for all real-time events
 */
export interface Event {
  projectId: string;
  eventType: EventType;
  data: unknown;
  timestamp: string;
}

/**
 * All supported event types
 */
export type EventType =
  | 'project.created'
  | 'project.updated'
  | 'project.phase.changed'
  | 'story.status.changed'
  | 'escalation.created'
  | 'escalation.responded'
  | 'agent.started'
  | 'agent.completed'
  | 'orchestrator.started'
  | 'orchestrator.paused'
  | 'orchestrator.resumed'
  | 'orchestrator.ask'
  | 'pr.created'
  | 'pr.merged'
  | 'workflow.error';

/**
 * Project created event data
 */
export interface ProjectCreatedEventData {
  id: string;
  name: string;
  status: string;
  phase: string;
}

/**
 * Project updated event data
 */
export interface ProjectUpdatedEventData {
  id: string;
  name?: string;
  status?: string;
  phase?: string;
  updatedFields: string[];
}

/**
 * Project phase changed event data
 */
export interface ProjectPhaseChangedEventData {
  id: string;
  oldPhase: string;
  newPhase: string;
}

/**
 * Story status changed event data
 */
export interface StoryStatusChangedEventData {
  storyId: string;
  epicId: string;
  title: string;
  oldStatus: string;
  newStatus: string;
}

/**
 * Escalation created event data
 */
export interface EscalationCreatedEventData {
  id: string;
  type: string;
  priority: string;
  message: string;
}

/**
 * Agent started event data
 */
export interface AgentStartedEventData {
  agentId: string;
  agentName: string;
  action: string;
}

/**
 * Agent completed event data
 */
export interface AgentCompletedEventData {
  agentId: string;
  agentName: string;
  action: string;
  duration: number;
  status: 'success' | 'failed';
}

/**
 * PR created event data
 */
export interface PRCreatedEventData {
  prNumber: number;
  title: string;
  url: string;
}

/**
 * PR merged event data
 */
export interface PRMergedEventData {
  prNumber: number;
  title: string;
  url: string;
}

/**
 * Workflow error event data
 */
export interface WorkflowErrorEventData {
  workflowId: string;
  step: string;
  error: string;
  details?: unknown;
}

/**
 * WebSocket subscription message
 */
export interface SubscriptionMessage {
  action: 'subscribe' | 'unsubscribe';
  projectId: string;
}

/**
 * WebSocket error message
 */
export interface ErrorMessage {
  error: string;
  message: string;
}

/**
 * Orchestrator started event data
 */
export interface OrchestratorStartedEventData {
  workflowName: string;
  workflowPath: string;
}

/**
 * Orchestrator paused event data
 */
export interface OrchestratorPausedEventData {
  workflowName: string;
  currentStep: string;
}

/**
 * Orchestrator resumed event data
 */
export interface OrchestratorResumedEventData {
  workflowName: string;
  currentStep: string;
}

/**
 * Escalation responded event data
 */
export interface EscalationRespondedEventData {
  id: string;
  response: unknown;
  resolvedAt: string;
}
