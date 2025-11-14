/**
 * State Query Types
 * TypeScript interfaces and Zod schemas for state query endpoints
 */

import { z } from 'zod';

/**
 * Workflow phase information
 */
export interface WorkflowPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  steps: string[];
}

/**
 * Workflow status (current phase and steps)
 */
export interface WorkflowStatusDetail {
  projectId: string;
  currentPhase: string;
  phases: WorkflowPhase[];
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

/**
 * Epic information in sprint status
 */
export interface Epic {
  id: string;
  title: string;
  status: 'backlog' | 'contexted' | 'in-progress' | 'completed';
  stories: string[]; // Story IDs belonging to this epic
}

/**
 * Story information in sprint status
 */
export interface Story {
  id: string;
  epicId: string;
  title: string;
  status: 'backlog' | 'drafted' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  points?: number;
  prLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sprint status (epics and stories)
 */
export interface SprintStatus {
  projectId: string;
  project: string;
  generatedAt: string;
  epics: Epic[];
  stories: Story[];
}

/**
 * Detailed story information
 */
export interface StoryDetail extends Story {
  description: string;
  acceptanceCriteria: string[];
  tasks: string[];
  dependencies: string[];
  blockedBy?: string[];
}

/**
 * Story list query filters
 */
export interface StoryListFilters {
  status?: 'backlog' | 'drafted' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
  epic?: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Workflow phase schema
 */
export const WorkflowPhaseSchema = z.object({
  name: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  steps: z.array(z.string())
});

/**
 * Workflow status detail schema
 */
export const WorkflowStatusDetailSchema = z.object({
  projectId: z.string().uuid(),
  currentPhase: z.string(),
  phases: z.array(WorkflowPhaseSchema),
  status: z.enum(['idle', 'running', 'paused', 'completed', 'error'])
});

/**
 * Epic schema
 */
export const EpicSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['backlog', 'contexted', 'in-progress', 'completed']),
  stories: z.array(z.string())
});

/**
 * Story schema
 */
export const StorySchema = z.object({
  id: z.string(),
  epicId: z.string(),
  title: z.string(),
  status: z.enum(['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']),
  assignee: z.string().optional(),
  points: z.number().optional(),
  prLink: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

/**
 * Sprint status schema
 */
export const SprintStatusSchema = z.object({
  projectId: z.string().uuid(),
  project: z.string(),
  generatedAt: z.string(),
  epics: z.array(EpicSchema),
  stories: z.array(StorySchema)
});

/**
 * Story detail schema
 */
export const StoryDetailSchema = StorySchema.extend({
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  tasks: z.array(z.string()),
  dependencies: z.array(z.string()),
  blockedBy: z.array(z.string()).optional()
});

/**
 * Story list filters schema
 */
export const StoryListFiltersSchema = z.object({
  status: z.enum(['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']).optional(),
  epic: z.string().optional()
});
