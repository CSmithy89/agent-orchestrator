/**
 * Zod Validation Schemas
 * Runtime validation schemas for API requests and responses
 */

import { z } from 'zod';

// API Response Schema
export const APIResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    timestamp: z.string()
  });

// API Error Schema
export const APIErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional()
});

// Project Schemas
export const ProjectStatusSchema = z.enum(['active', 'paused', 'completed', 'error']);
export const ProjectPhaseSchema = z.enum(['analysis', 'planning', 'solutioning', 'implementation', 'review']);

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: ProjectStatusSchema,
  phase: ProjectPhaseSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

// Workflow Schema
export const WorkflowStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  currentStep: z.string().optional(),
  progress: z.number().min(0).max(100),
  startedAt: z.string().optional(),
  completedAt: z.string().optional()
});

// Story Schema
export const StoryStatusSchema = z.object({
  id: z.string(),
  epicId: z.string(),
  title: z.string(),
  status: z.enum(['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']),
  assignee: z.string().optional(),
  points: z.number().optional()
});

// Escalation Schema
export const EscalationStatusSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: z.enum(['decision', 'blocker', 'conflict', 'clarification']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  status: z.enum(['open', 'responded', 'resolved']),
  createdAt: z.string()
});

// Orchestrator Status Schema
export const OrchestratorStatusSchema = z.object({
  running: z.boolean(),
  activeProjects: z.number(),
  activeWorkflows: z.number(),
  health: z.enum(['healthy', 'degraded', 'unhealthy']),
  uptime: z.number()
});
