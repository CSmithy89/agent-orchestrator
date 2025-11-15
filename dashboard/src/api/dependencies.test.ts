/**
 * Dependency Graph API Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDependencyGraph } from './dependencies';
import { client } from './client';
import type { DependencyGraph } from '@/types/dependency-graph';

// Mock the client
vi.mock('./client', () => ({
  client: {
    get: vi.fn(),
  },
}));

describe('getDependencyGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dependency graph for a project', async () => {
    const mockGraph: DependencyGraph = {
      nodes: [
        {
          id: '6-8',
          storyId: '6-8',
          epicNumber: 6,
          storyNumber: 8,
          title: 'Dependency Graph Visualization',
          status: 'in-progress',
          complexity: 'medium',
          hasWorktree: true,
        },
      ],
      edges: [
        {
          source: '6-7',
          target: '6-8',
          type: 'hard',
          isBlocking: false,
        },
      ],
      criticalPath: ['6-7', '6-8'],
    };

    vi.mocked(client.get).mockResolvedValue(mockGraph);

    const result = await getDependencyGraph('project-1');

    expect(client.get).toHaveBeenCalledWith('/api/projects/project-1/dependency-graph');
    expect(result).toEqual(mockGraph);
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    vi.mocked(client.get).mockRejectedValue(error);

    await expect(getDependencyGraph('project-1')).rejects.toThrow('API Error');
  });

  it('should construct correct URL with project ID', async () => {
    const projectId = 'test-project-123';
    vi.mocked(client.get).mockResolvedValue({ nodes: [], edges: [], criticalPath: [] });

    await getDependencyGraph(projectId);

    expect(client.get).toHaveBeenCalledWith(`/api/projects/${projectId}/dependency-graph`);
  });
});
