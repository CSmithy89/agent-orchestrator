/**
 * Core API Type Definitions
 * TypeScript interfaces for all API entities
 */

// Generic API Response
export interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// API Error Response
export interface APIError {
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'error';
export type ProjectPhase = 'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review';

// Workflow Types
export interface WorkflowStatus {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

// Story Types
export interface StoryStatus {
  id: string;
  epicId: string;
  title: string;
  status: 'backlog' | 'drafted' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  points?: number;
}

// Escalation Types
export interface EscalationStatus {
  id: string;
  projectId: string;
  type: 'decision' | 'blocker' | 'conflict' | 'clarification';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'open' | 'responded' | 'resolved';
  createdAt: string;
}

// Orchestrator Status
export interface OrchestratorStatus {
  running: boolean;
  activeProjects: number;
  activeWorkflows: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
}
