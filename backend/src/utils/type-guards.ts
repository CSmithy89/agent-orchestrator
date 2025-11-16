/**
 * Type Guard Utility Library
 * Runtime type validation for all domain types using Zod
 *
 * This library provides:
 * - Zod schemas for runtime validation
 * - TypeScript type guard functions
 * - Validation helpers and error handling
 * - Safe parsing utilities
 *
 * Usage:
 * ```typescript
 * import { isProject, validateProject, parseProjectSafe } from '@/utils/type-guards';
 *
 * // Type guard (boolean check)
 * if (isProject(data)) {
 *   console.log(data.id); // TypeScript knows data is Project
 * }
 *
 * // Validation (throws on error)
 * const project = validateProject(unknownData);
 *
 * // Safe parsing (returns result object)
 * const result = parseProjectSafe(unknownData);
 * if (result.success) {
 *   console.log(result.data.id);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

import { z } from 'zod';
import type {
  Project,
  ProjectStatus,
  ProjectPhase,
  WorkflowStatus,
  StoryStatus,
  EscalationStatus,
  OrchestratorStatus,
  APIResponse,
  APIError
} from '../api/types/api.types.js';
import type {
  Event,
  EventType,
  SubscriptionMessage,
  ErrorMessage,
  ProjectCreatedEventData,
  ProjectUpdatedEventData,
  ProjectPhaseChangedEventData,
  StoryStatusChangedEventData,
  EscalationCreatedEventData,
  EscalationRespondedEventData,
  AgentStartedEventData,
  AgentCompletedEventData,
  PRCreatedEventData,
  PRMergedEventData,
  WorkflowErrorEventData,
  OrchestratorStartedEventData,
  OrchestratorPausedEventData,
  OrchestratorResumedEventData
} from '../api/types/events.types.js';

// ============================================================================
// Core API Type Schemas
// ============================================================================

/**
 * Project status enum
 */
export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'error']);

/**
 * Project phase enum
 */
export const ProjectPhaseSchema = z.enum(['analysis', 'planning', 'solutioning', 'implementation', 'review']);

/**
 * Project schema
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: ProjectStatusSchema,
  phase: ProjectPhaseSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

/**
 * Workflow status schema
 */
export const WorkflowStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  currentStep: z.string().optional(),
  progress: z.number().min(0).max(100),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

/**
 * Story status schema
 */
export const StoryStatusSchema = z.object({
  id: z.string(),
  epicId: z.string(),
  title: z.string().min(1),
  status: z.enum(['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']),
  assignee: z.string().optional(),
  points: z.number().int().min(0).optional()
});

/**
 * Escalation status schema
 */
export const EscalationStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: z.enum(['decision', 'blocker', 'conflict', 'clarification']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1),
  status: z.enum(['open', 'responded', 'resolved']),
  createdAt: z.string().datetime()
});

/**
 * Orchestrator status schema
 */
export const OrchestratorStatusSchema = z.object({
  running: z.boolean(),
  activeProjects: z.number().int().min(0),
  activeWorkflows: z.number().int().min(0),
  health: z.enum(['healthy', 'degraded', 'unhealthy']),
  uptime: z.number().min(0)
});

/**
 * Generic API response schema
 */
export function createAPIResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.string().datetime()
  });
}

/**
 * API error schema
 */
export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional()
});

// ============================================================================
// Event Type Schemas
// ============================================================================

/**
 * Event type enum
 */
export const EventTypeSchema = z.enum([
  'project.created',
  'project.updated',
  'project.phase.changed',
  'story.status.changed',
  'escalation.created',
  'escalation.responded',
  'agent.started',
  'agent.completed',
  'orchestrator.started',
  'orchestrator.paused',
  'orchestrator.resumed',
  'pr.created',
  'pr.merged',
  'workflow.error'
]);

/**
 * Base event schema
 */
export const EventSchema = z.object({
  projectId: z.string().uuid(),
  eventType: EventTypeSchema,
  data: z.unknown(),
  timestamp: z.string().datetime()
});

/**
 * WebSocket subscription message schema
 */
export const SubscriptionMessageSchema = z.object({
  action: z.enum(['subscribe', 'unsubscribe']),
  projectId: z.string().uuid()
});

/**
 * WebSocket error message schema
 */
export const ErrorMessageSchema = z.object({
  error: z.string(),
  message: z.string()
});

// Event Data Schemas
export const ProjectCreatedEventDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  phase: z.string()
});

export const ProjectUpdatedEventDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  status: z.string().optional(),
  phase: z.string().optional(),
  updatedFields: z.array(z.string())
});

export const ProjectPhaseChangedEventDataSchema = z.object({
  id: z.string().uuid(),
  oldPhase: z.string(),
  newPhase: z.string()
});

export const StoryStatusChangedEventDataSchema = z.object({
  storyId: z.string(),
  epicId: z.string(),
  title: z.string(),
  oldStatus: z.string(),
  newStatus: z.string()
});

export const EscalationCreatedEventDataSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  priority: z.string(),
  message: z.string()
});

export const EscalationRespondedEventDataSchema = z.object({
  id: z.string().uuid(),
  response: z.unknown(),
  resolvedAt: z.string().datetime()
});

export const AgentStartedEventDataSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  action: z.string()
});

export const AgentCompletedEventDataSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  action: z.string(),
  duration: z.number().min(0),
  status: z.enum(['success', 'failed'])
});

export const PRCreatedEventDataSchema = z.object({
  prNumber: z.number().int().positive(),
  title: z.string(),
  url: z.string().url()
});

export const PRMergedEventDataSchema = z.object({
  prNumber: z.number().int().positive(),
  title: z.string(),
  url: z.string().url()
});

export const WorkflowErrorEventDataSchema = z.object({
  workflowId: z.string(),
  step: z.string(),
  error: z.string(),
  details: z.unknown().optional()
});

export const OrchestratorStartedEventDataSchema = z.object({
  workflowName: z.string(),
  workflowPath: z.string()
});

export const OrchestratorPausedEventDataSchema = z.object({
  workflowName: z.string(),
  currentStep: z.string()
});

export const OrchestratorResumedEventDataSchema = z.object({
  workflowName: z.string(),
  currentStep: z.string()
});

// ============================================================================
// Type Guard Functions
// ============================================================================

/**
 * Type guard for Project
 */
export function isProject(value: unknown): value is Project {
  return ProjectSchema.safeParse(value).success;
}

/**
 * Type guard for ProjectStatus
 */
export function isProjectStatus(value: unknown): value is ProjectStatus {
  return ProjectStatusSchema.safeParse(value).success;
}

/**
 * Type guard for ProjectPhase
 */
export function isProjectPhase(value: unknown): value is ProjectPhase {
  return ProjectPhaseSchema.safeParse(value).success;
}

/**
 * Type guard for WorkflowStatus
 */
export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return WorkflowStatusSchema.safeParse(value).success;
}

/**
 * Type guard for StoryStatus
 */
export function isStoryStatus(value: unknown): value is StoryStatus {
  return StoryStatusSchema.safeParse(value).success;
}

/**
 * Type guard for EscalationStatus
 */
export function isEscalationStatus(value: unknown): value is EscalationStatus {
  return EscalationStatusSchema.safeParse(value).success;
}

/**
 * Type guard for OrchestratorStatus
 */
export function isOrchestratorStatus(value: unknown): value is OrchestratorStatus {
  return OrchestratorStatusSchema.safeParse(value).success;
}

/**
 * Type guard for APIError
 */
export function isAPIError(value: unknown): value is APIError {
  return APIErrorSchema.safeParse(value).success;
}

/**
 * Type guard for Event
 */
export function isEvent(value: unknown): value is Event {
  return EventSchema.safeParse(value).success;
}

/**
 * Type guard for EventType
 */
export function isEventType(value: unknown): value is EventType {
  return EventTypeSchema.safeParse(value).success;
}

/**
 * Type guard for SubscriptionMessage
 */
export function isSubscriptionMessage(value: unknown): value is SubscriptionMessage {
  return SubscriptionMessageSchema.safeParse(value).success;
}

/**
 * Type guard for ErrorMessage
 */
export function isErrorMessage(value: unknown): value is ErrorMessage {
  return ErrorMessageSchema.safeParse(value).success;
}

// Event Data Type Guards
export function isProjectCreatedEventData(value: unknown): value is ProjectCreatedEventData {
  return ProjectCreatedEventDataSchema.safeParse(value).success;
}

export function isProjectUpdatedEventData(value: unknown): value is ProjectUpdatedEventData {
  return ProjectUpdatedEventDataSchema.safeParse(value).success;
}

export function isProjectPhaseChangedEventData(value: unknown): value is ProjectPhaseChangedEventData {
  return ProjectPhaseChangedEventDataSchema.safeParse(value).success;
}

export function isStoryStatusChangedEventData(value: unknown): value is StoryStatusChangedEventData {
  return StoryStatusChangedEventDataSchema.safeParse(value).success;
}

export function isEscalationCreatedEventData(value: unknown): value is EscalationCreatedEventData {
  return EscalationCreatedEventDataSchema.safeParse(value).success;
}

export function isEscalationRespondedEventData(value: unknown): value is EscalationRespondedEventData {
  return EscalationRespondedEventDataSchema.safeParse(value).success;
}

export function isAgentStartedEventData(value: unknown): value is AgentStartedEventData {
  return AgentStartedEventDataSchema.safeParse(value).success;
}

export function isAgentCompletedEventData(value: unknown): value is AgentCompletedEventData {
  return AgentCompletedEventDataSchema.safeParse(value).success;
}

export function isPRCreatedEventData(value: unknown): value is PRCreatedEventData {
  return PRCreatedEventDataSchema.safeParse(value).success;
}

export function isPRMergedEventData(value: unknown): value is PRMergedEventData {
  return PRMergedEventDataSchema.safeParse(value).success;
}

export function isWorkflowErrorEventData(value: unknown): value is WorkflowErrorEventData {
  return WorkflowErrorEventDataSchema.safeParse(value).success;
}

export function isOrchestratorStartedEventData(value: unknown): value is OrchestratorStartedEventData {
  return OrchestratorStartedEventDataSchema.safeParse(value).success;
}

export function isOrchestratorPausedEventData(value: unknown): value is OrchestratorPausedEventData {
  return OrchestratorPausedEventDataSchema.safeParse(value).success;
}

export function isOrchestratorResumedEventData(value: unknown): value is OrchestratorResumedEventData {
  return OrchestratorResumedEventDataSchema.safeParse(value).success;
}

// ============================================================================
// Validation Helpers (throw on error)
// ============================================================================

/**
 * Validate Project (throws ZodError on failure)
 */
export function validateProject(value: unknown): Project {
  return ProjectSchema.parse(value);
}

/**
 * Validate WorkflowStatus (throws ZodError on failure)
 */
export function validateWorkflowStatus(value: unknown): WorkflowStatus {
  return WorkflowStatusSchema.parse(value);
}

/**
 * Validate StoryStatus (throws ZodError on failure)
 */
export function validateStoryStatus(value: unknown): StoryStatus {
  return StoryStatusSchema.parse(value);
}

/**
 * Validate EscalationStatus (throws ZodError on failure)
 */
export function validateEscalationStatus(value: unknown): EscalationStatus {
  return EscalationStatusSchema.parse(value);
}

/**
 * Validate OrchestratorStatus (throws ZodError on failure)
 */
export function validateOrchestratorStatus(value: unknown): OrchestratorStatus {
  return OrchestratorStatusSchema.parse(value);
}

/**
 * Validate Event (throws ZodError on failure)
 */
export function validateEvent(value: unknown): Event {
  return EventSchema.parse(value);
}

/**
 * Validate SubscriptionMessage (throws ZodError on failure)
 */
export function validateSubscriptionMessage(value: unknown): SubscriptionMessage {
  return SubscriptionMessageSchema.parse(value);
}

/**
 * Validate APIError (throws ZodError on failure)
 */
export function validateAPIError(value: unknown): APIError {
  return APIErrorSchema.parse(value);
}

// ============================================================================
// Safe Parse Helpers (returns result object)
// ============================================================================

/**
 * Safe parse result type
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Safe parse Project
 */
export function parseProjectSafe(value: unknown): SafeParseResult<Project> {
  return ProjectSchema.safeParse(value);
}

/**
 * Safe parse WorkflowStatus
 */
export function parseWorkflowStatusSafe(value: unknown): SafeParseResult<WorkflowStatus> {
  return WorkflowStatusSchema.safeParse(value);
}

/**
 * Safe parse StoryStatus
 */
export function parseStoryStatusSafe(value: unknown): SafeParseResult<StoryStatus> {
  return StoryStatusSchema.safeParse(value);
}

/**
 * Safe parse EscalationStatus
 */
export function parseEscalationStatusSafe(value: unknown): SafeParseResult<EscalationStatus> {
  return EscalationStatusSchema.safeParse(value);
}

/**
 * Safe parse OrchestratorStatus
 */
export function parseOrchestratorStatusSafe(value: unknown): SafeParseResult<OrchestratorStatus> {
  return OrchestratorStatusSchema.safeParse(value);
}

/**
 * Safe parse Event
 */
export function parseEventSafe(value: unknown): SafeParseResult<Event> {
  return EventSchema.safeParse(value);
}

/**
 * Safe parse SubscriptionMessage
 */
export function parseSubscriptionMessageSafe(value: unknown): SafeParseResult<SubscriptionMessage> {
  return SubscriptionMessageSchema.safeParse(value);
}

/**
 * Safe parse APIError
 */
export function parseAPIErrorSafe(value: unknown): SafeParseResult<APIError> {
  return APIErrorSchema.safeParse(value);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate array of items
 */
export function validateArray<T>(
  schema: z.ZodType<T>,
  items: unknown[]
): T[] {
  return z.array(schema).parse(items);
}

/**
 * Safe parse array of items
 */
export function parseArraySafe<T>(
  schema: z.ZodType<T>,
  items: unknown[]
): SafeParseResult<T[]> {
  return z.array(schema).safeParse(items);
}

/**
 * Validate partial object (for PATCH requests)
 */
export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  value: unknown
): Partial<z.infer<T>> {
  return schema.partial().parse(value);
}

/**
 * Assert type and narrow (throws on failure)
 */
export function assertType<T>(
  schema: z.ZodType<T>,
  value: unknown,
  errorMessage?: string
): asserts value is T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(errorMessage || `Type assertion failed: ${result.error.message}`);
  }
}

/**
 * Format Zod error for logging/display
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}

/**
 * Create custom validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError?: z.ZodError,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Wrap validation in try-catch and convert to ValidationError
 */
export function validateSafely<T>(
  schema: z.ZodType<T>,
  value: unknown,
  errorMessage?: string
): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        errorMessage || `Validation failed: ${formatZodError(error)}`,
        error
      );
    }
    throw error;
  }
}

// ============================================================================
// Type Guard Composition Utilities
// ============================================================================

/**
 * Create union type guard
 */
export function createUnionTypeGuard<T extends readonly z.ZodTypeAny[]>(
  ...schemas: T
): (value: unknown) => value is z.infer<T[number]> {
  const unionSchema = z.union(schemas as any);
  return (value: unknown): value is z.infer<T[number]> => {
    return unionSchema.safeParse(value).success;
  };
}

/**
 * Create discriminated union type guard
 */
export function createDiscriminatedUnionTypeGuard<
  K extends string,
  T extends readonly [z.ZodObject<any>, z.ZodObject<any>, ...z.ZodObject<any>[]]
>(
  discriminatorKey: K,
  ...schemas: T
): (value: unknown) => value is z.infer<T[number]> {
  const unionSchema = z.discriminatedUnion(discriminatorKey, schemas as any);
  return (value: unknown): value is z.infer<T[number]> => {
    return unionSchema.safeParse(value).success;
  };
}

/**
 * Check if value is one of the specified types
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  ...guards: Array<(v: unknown) => v is T[number]>
): value is T[number] {
  return guards.some(guard => guard(value));
}

// ============================================================================
// WebSocket Event Validation
// ============================================================================

/**
 * Validate WebSocket event and extract typed data
 */
export function validateWebSocketEvent<T>(
  event: unknown,
  eventType: EventType,
  dataSchema: z.ZodType<T>
): T {
  // First validate it's a valid Event
  const validEvent = validateEvent(event);

  // Check event type matches
  if (validEvent.eventType !== eventType) {
    throw new ValidationError(
      `Expected event type '${eventType}', got '${validEvent.eventType}'`
    );
  }

  // Validate and return typed data
  return validateSafely(
    dataSchema,
    validEvent.data,
    `Invalid event data for '${eventType}'`
  );
}

/**
 * Safe validate WebSocket event
 */
export function validateWebSocketEventSafe<T>(
  event: unknown,
  eventType: EventType,
  dataSchema: z.ZodType<T>
): SafeParseResult<T> {
  try {
    const data = validateWebSocketEvent(event, eventType, dataSchema);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    if (error instanceof ValidationError && error.zodError) {
      return { success: false, error: error.zodError };
    }
    throw error;
  }
}
