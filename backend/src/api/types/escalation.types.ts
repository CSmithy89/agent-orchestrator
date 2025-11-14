/**
 * Escalation API Types
 * TypeScript interfaces and Zod schemas for escalation management endpoints
 */

import { z } from 'zod';

/**
 * Escalation detail (extends core Escalation interface)
 */
export interface EscalationDetail {
  id: string;
  projectId: string;
  workflowId: string;
  step: number;
  question: string;
  aiReasoning: string;
  confidence: number;
  context: Record<string, unknown>;
  status: 'pending' | 'resolved' | 'cancelled';
  createdAt: string;
  resolvedAt?: string;
  response?: unknown;
  resolutionTime?: number;
}

/**
 * Escalation list filters
 */
export interface EscalationListFilters {
  status?: 'pending' | 'resolved' | 'cancelled';
  projectId?: string;
}

/**
 * Escalation response request
 */
export interface EscalationResponseRequest {
  response: unknown;
}

/**
 * Escalation response result
 */
export interface EscalationResponseResult {
  message: string;
  escalationId: string;
  resolvedAt: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Escalation detail schema
 */
export const EscalationDetailSchema = z.object({
  id: z.string(),
  projectId: z.string().uuid(),
  workflowId: z.string(),
  step: z.number().int().min(0),
  question: z.string(),
  aiReasoning: z.string(),
  confidence: z.number().min(0).max(1),
  context: z.record(z.unknown()),
  status: z.enum(['pending', 'resolved', 'cancelled']),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  response: z.unknown().optional(),
  resolutionTime: z.number().optional()
});

/**
 * Escalation list filters schema
 */
export const EscalationListFiltersSchema = z.object({
  status: z.enum(['pending', 'resolved', 'cancelled']).optional(),
  projectId: z.string().uuid().optional()
});

/**
 * Escalation response request schema
 */
export const EscalationResponseRequestSchema = z.object({
  response: z.unknown().refine(
    (val) => val !== null && val !== undefined && (typeof val !== 'string' || val.trim().length > 0),
    { message: 'Response cannot be empty' }
  )
});

/**
 * Escalation response result schema
 */
export const EscalationResponseResultSchema = z.object({
  message: z.string(),
  escalationId: z.string(),
  resolvedAt: z.string()
});
