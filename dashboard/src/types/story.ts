/**
 * Story types for Kanban board visualization
 */

export interface Epic {
  number: number;
  title: string;
  color: string;
}

export interface Story {
  id: string;
  projectId: string;
  epicNumber: number;
  storyNumber: number;
  title: string;
  status: 'backlog' | 'ready' | 'in-progress' | 'review' | 'merged' | 'done';
  prUrl?: string;
  dependencies?: string[]; // Story IDs this story depends on
  epic: Epic;
  description?: string;
  acceptanceCriteria?: string[];
  tasks?: StoryTask[];
  storyPoints?: number;
}

export interface StoryTask {
  id: string;
  description: string;
  completed: boolean;
  subtasks?: StoryTask[];
}

export interface UpdateStoryStatusRequest {
  status: string;
}
