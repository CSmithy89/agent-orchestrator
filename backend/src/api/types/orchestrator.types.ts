/**
 * Orchestrator Control Types
 * TypeScript interfaces and Zod schemas for orchestrator control endpoints
 */

import { z } from 'zod';

/**
 * Agent activity information
 */
export interface AgentActivity {
  agentId: string;
  agentName: string;
  action: string;
  status: 'started' | 'completed' | 'failed';
  startedAt: string;
  duration?: number;
}

/**
 * Project orchestrator status (workflow execution state for a specific project)
 */
export interface ProjectOrchestratorStatus {
  projectId: string;
  workflowName: string;
  currentStep: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  agentActivity: AgentActivity[];
  progress: number; // 0-100 percentage
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

/**
 * Workflow start request
 */
export interface StartWorkflowRequest {
  workflowPath: string;
  yoloMode?: boolean;
}

/**
 * Workflow control response
 */
export interface WorkflowControlResponse {
  message: string;
  status: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Agent activity schema
 */
export const AgentActivitySchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  action: z.string(),
  status: z.enum(['started', 'completed', 'failed']),
  startedAt: z.string(),
  duration: z.number().optional()
});

/**
 * Project orchestrator status schema
 */
export const ProjectOrchestratorStatusSchema = z.object({
  projectId: z.string().uuid(),
  workflowName: z.string(),
  currentStep: z.string(),
  status: z.enum(['idle', 'running', 'paused', 'completed', 'error']),
  agentActivity: z.array(AgentActivitySchema),
  progress: z.number().min(0).max(100),
  startedAt: z.string().optional(),
  pausedAt: z.string().optional(),
  completedAt: z.string().optional()
});

/**
 * Start workflow request schema
 */
export const StartWorkflowRequestSchema = z.object({
  workflowPath: z.string().min(1),
  yoloMode: z.boolean().optional().default(false)
});

/**
 * Workflow control response schema
 */
export const WorkflowControlResponseSchema = z.object({
  message: z.string(),
  status: z.string()
});
