/**
 * Type Guard Utility Library (Frontend)
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

// ============================================================================
// Type Imports (adjust to match your generated types or manual definitions)
// ============================================================================

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'error';
export type ProjectPhase = 'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review';

export interface WorkflowStatus {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

export interface StoryStatus {
  id: string;
  epicId: string;
  title: string;
  status: 'backlog' | 'drafted' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  points?: number;
}

export interface EscalationStatus {
  id: string;
  projectId: string;
  type: 'decision' | 'blocker' | 'conflict' | 'clarification';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'open' | 'responded' | 'resolved';
  createdAt: string;
}

export interface OrchestratorStatus {
  running: boolean;
  activeProjects: number;
  activeWorkflows: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface APIError {
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface WebSocketEvent {
  projectId: string;
  eventType: EventType;
  data: unknown;
  timestamp: string;
}

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
  | 'pr.created'
  | 'pr.merged'
  | 'workflow.error';

export interface SubscriptionMessage {
  action: 'subscribe' | 'unsubscribe';
  projectId: string;
}

export interface ErrorMessage {
  error: string;
  message: string;
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'error']);
export const ProjectPhaseSchema = z.enum(['analysis', 'planning', 'solutioning', 'implementation', 'review']);

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: ProjectStatusSchema,
  phase: ProjectPhaseSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const WorkflowStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  currentStep: z.string().optional(),
  progress: z.number().min(0).max(100),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});

export const StoryStatusSchema = z.object({
  id: z.string(),
  epicId: z.string(),
  title: z.string().min(1),
  status: z.enum(['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']),
  assignee: z.string().optional(),
  points: z.number().int().min(0).optional()
});

export const EscalationStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: z.enum(['decision', 'blocker', 'conflict', 'clarification']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1),
  status: z.enum(['open', 'responded', 'resolved']),
  createdAt: z.string().datetime()
});

export const OrchestratorStatusSchema = z.object({
  running: z.boolean(),
  activeProjects: z.number().int().min(0),
  activeWorkflows: z.number().int().min(0),
  health: z.enum(['healthy', 'degraded', 'unhealthy']),
  uptime: z.number().min(0)
});

export function createAPIResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.string().datetime()
  });
}

export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional()
});

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

export const WebSocketEventSchema = z.object({
  projectId: z.string().uuid(),
  eventType: EventTypeSchema,
  data: z.unknown(),
  timestamp: z.string().datetime()
});

export const SubscriptionMessageSchema = z.object({
  action: z.enum(['subscribe', 'unsubscribe']),
  projectId: z.string().uuid()
});

export const ErrorMessageSchema = z.object({
  error: z.string(),
  message: z.string()
});

// ============================================================================
// Type Guard Functions
// ============================================================================

export function isProject(value: unknown): value is Project {
  return ProjectSchema.safeParse(value).success;
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return ProjectStatusSchema.safeParse(value).success;
}

export function isProjectPhase(value: unknown): value is ProjectPhase {
  return ProjectPhaseSchema.safeParse(value).success;
}

export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return WorkflowStatusSchema.safeParse(value).success;
}

export function isStoryStatus(value: unknown): value is StoryStatus {
  return StoryStatusSchema.safeParse(value).success;
}

export function isEscalationStatus(value: unknown): value is EscalationStatus {
  return EscalationStatusSchema.safeParse(value).success;
}

export function isOrchestratorStatus(value: unknown): value is OrchestratorStatus {
  return OrchestratorStatusSchema.safeParse(value).success;
}

export function isAPIError(value: unknown): value is APIError {
  return APIErrorSchema.safeParse(value).success;
}

export function isWebSocketEvent(value: unknown): value is WebSocketEvent {
  return WebSocketEventSchema.safeParse(value).success;
}

export function isEventType(value: unknown): value is EventType {
  return EventTypeSchema.safeParse(value).success;
}

export function isSubscriptionMessage(value: unknown): value is SubscriptionMessage {
  return SubscriptionMessageSchema.safeParse(value).success;
}

export function isErrorMessage(value: unknown): value is ErrorMessage {
  return ErrorMessageSchema.safeParse(value).success;
}

// ============================================================================
// Validation Helpers (throw on error)
// ============================================================================

export function validateProject(value: unknown): Project {
  return ProjectSchema.parse(value);
}

export function validateWorkflowStatus(value: unknown): WorkflowStatus {
  return WorkflowStatusSchema.parse(value);
}

export function validateStoryStatus(value: unknown): StoryStatus {
  return StoryStatusSchema.parse(value);
}

export function validateEscalationStatus(value: unknown): EscalationStatus {
  return EscalationStatusSchema.parse(value);
}

export function validateOrchestratorStatus(value: unknown): OrchestratorStatus {
  return OrchestratorStatusSchema.parse(value);
}

export function validateWebSocketEvent(value: unknown): WebSocketEvent {
  return WebSocketEventSchema.parse(value);
}

export function validateSubscriptionMessage(value: unknown): SubscriptionMessage {
  return SubscriptionMessageSchema.parse(value);
}

export function validateAPIError(value: unknown): APIError {
  return APIErrorSchema.parse(value);
}

// ============================================================================
// Safe Parse Helpers (returns result object)
// ============================================================================

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

export function parseProjectSafe(value: unknown): SafeParseResult<Project> {
  return ProjectSchema.safeParse(value);
}

export function parseWorkflowStatusSafe(value: unknown): SafeParseResult<WorkflowStatus> {
  return WorkflowStatusSchema.safeParse(value);
}

export function parseStoryStatusSafe(value: unknown): SafeParseResult<StoryStatus> {
  return StoryStatusSchema.safeParse(value);
}

export function parseEscalationStatusSafe(value: unknown): SafeParseResult<EscalationStatus> {
  return EscalationStatusSchema.safeParse(value);
}

export function parseOrchestratorStatusSafe(value: unknown): SafeParseResult<OrchestratorStatus> {
  return OrchestratorStatusSchema.safeParse(value);
}

export function parseWebSocketEventSafe(value: unknown): SafeParseResult<WebSocketEvent> {
  return WebSocketEventSchema.safeParse(value);
}

export function parseSubscriptionMessageSafe(value: unknown): SafeParseResult<SubscriptionMessage> {
  return SubscriptionMessageSchema.safeParse(value);
}

export function parseAPIErrorSafe(value: unknown): SafeParseResult<APIError> {
  return APIErrorSchema.safeParse(value);
}

// ============================================================================
// Utility Functions
// ============================================================================

export function validateArray<T>(
  schema: z.ZodType<T>,
  items: unknown[]
): T[] {
  return z.array(schema).parse(items);
}

export function parseArraySafe<T>(
  schema: z.ZodType<T>,
  items: unknown[]
): SafeParseResult<T[]> {
  return z.array(schema).safeParse(items);
}

export function validatePartial<T extends z.ZodObject<any>>(
  schema: T,
  value: unknown
): Partial<z.infer<T>> {
  return schema.partial().parse(value);
}

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

export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}

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
// WebSocket Event Validation with Type Discrimination
// ============================================================================

export function validateTypedWebSocketEvent<T>(
  event: unknown,
  eventType: EventType,
  dataSchema: z.ZodType<T>
): T {
  const validEvent = validateWebSocketEvent(event);

  if (validEvent.eventType !== eventType) {
    throw new ValidationError(
      `Expected event type '${eventType}', got '${validEvent.eventType}'`
    );
  }

  return validateSafely(
    dataSchema,
    validEvent.data,
    `Invalid event data for '${eventType}'`
  );
}

export function validateTypedWebSocketEventSafe<T>(
  event: unknown,
  eventType: EventType,
  dataSchema: z.ZodType<T>
): SafeParseResult<T> {
  try {
    const data = validateTypedWebSocketEvent(event, eventType, dataSchema);
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

// ============================================================================
// React Hook Integration Helpers
// ============================================================================

/**
 * Hook to validate API response data
 * Useful with React Query
 */
export function useValidatedData<T>(
  data: unknown,
  schema: z.ZodType<T>
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error('Data validation failed:', error);
    return null;
  }
}

/**
 * Validate API response from React Query
 */
export function validateQueryData<T>(
  data: unknown,
  schema: z.ZodType<T>
): T {
  return validateSafely(
    schema,
    data,
    'Invalid data received from API'
  );
}

/**
 * Create validated mutation input
 */
export function createValidatedInput<T>(
  schema: z.ZodType<T>,
  input: unknown
): T {
  return validateSafely(
    schema,
    input,
    'Invalid mutation input'
  );
}

// ============================================================================
// WebSocket Hook Integration
// ============================================================================

/**
 * Type-safe WebSocket event handler
 */
export function createWebSocketEventHandler<T>(
  eventType: EventType,
  dataSchema: z.ZodType<T>,
  handler: (data: T) => void
): (event: WebSocketEvent) => void {
  return (event: WebSocketEvent) => {
    const result = validateTypedWebSocketEventSafe(event, eventType, dataSchema);
    if (result.success) {
      handler(result.data);
    } else {
      console.error(`Invalid ${eventType} event data:`, formatZodError(result.error));
    }
  };
}

// ============================================================================
// API Error Handling
// ============================================================================

/**
 * Check if error response is APIError
 */
export function isAPIErrorResponse(error: unknown): error is APIError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return isAPIError(error);
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Format validation error for display
 */
export function formatValidationErrorForDisplay(error: z.ZodError): Array<{
  field: string;
  message: string;
}> {
  return error.errors.map(err => ({
    field: err.path.join('.') || 'general',
    message: err.message
  }));
}
