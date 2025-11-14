// API Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// API Error structure
export interface APIError {
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  phase: 'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review';
  createdAt: string;
  updatedAt: string;
  repository?: string;
  config?: ProjectConfig;
}

export interface ProjectConfig {
  workflowPath?: string;
  autoStart?: boolean;
  escalationStrategy?: string;
}

export interface PhaseProgress {
  phase: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
}

// Workflow and Story types
export interface WorkflowStatus {
  projectId: string;
  currentPhase: string;
  currentStory?: string;
  phaseProgress: PhaseProgress[];
  estimatedCompletion?: string;
}

export interface StoryStatus {
  id: string;
  key: string;
  title: string;
  status: 'backlog' | 'drafted' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
  assignedTo?: string;
  storyPoints?: number;
  epic?: string;
  acceptanceCriteria?: string[];
}

export interface StoryDetail extends StoryStatus {
  description: string;
  tasks: Task[];
  dependencies?: string[];
  blockedBy?: string[];
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  subtasks?: Task[];
}

// Orchestrator types
export interface OrchestratorStatus {
  running: boolean;
  activeProjects: number;
  activeWorkflows: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
}

// Escalation types
export interface EscalationStatus {
  id: string;
  projectId: string;
  type: 'decision' | 'blocker' | 'clarification' | 'approval';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  context?: unknown;
  status: 'pending' | 'responded' | 'resolved';
  createdAt: string;
  respondedAt?: string;
}

export interface EscalationDetail extends EscalationStatus {
  agentId: string;
  workflowStep: string;
  options?: string[];
  response?: EscalationResponse;
}

export interface EscalationResponse {
  decision?: string;
  response: string;
  notes?: string;
}

// Sprint Status types
export interface SprintStatus {
  projectKey: string;
  currentEpic: string;
  stories: Record<string, string>; // story-key -> status
  velocity?: number;
}

// WebSocket Event types
export interface WebSocketEvent {
  projectId: string;
  eventType: WebSocketEventType;
  data: unknown;
  timestamp: string;
}

export type WebSocketEventType =
  | 'project.phase.changed'
  | 'story.status.changed'
  | 'escalation.created'
  | 'escalation.responded'
  | 'orchestrator.started'
  | 'orchestrator.paused'
  | 'orchestrator.resumed'
  | 'agent.started'
  | 'agent.completed'
  | 'pr.created'
  | 'pr.merged'
  | 'workflow.error';

// API Request types
export interface CreateProjectRequest {
  name: string;
  repository: string;
  config?: ProjectConfig;
}

export interface UpdateProjectRequest {
  name?: string;
  status?: Project['status'];
  config?: ProjectConfig;
}

export interface StartOrchestratorRequest {
  workflowPath?: string;
}

export interface RespondToEscalationRequest {
  response: string;
  decision?: string;
  notes?: string;
}
