/**
 * DependencyGraphPage Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DependencyGraphPage } from './DependencyGraphPage';
import * as useDependencyGraphModule from '@/hooks/useDependencyGraph';
import * as useDependencyWebSocketModule from '@/hooks/useDependencyWebSocket';
import * as useProjectStoriesModule from '@/hooks/useProjectStories';
import type { DependencyGraph } from '@/types/dependency-graph';

// Mock hooks
vi.mock('@/hooks/useDependencyGraph');
vi.mock('@/hooks/useDependencyWebSocket');
vi.mock('@/hooks/useProjectStories');
vi.mock('@/components/kanban/StoryDetailModal', () => ({
  StoryDetailModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="story-modal" onClick={onClose}>Modal</div> : null,
}));

describe('DependencyGraphPage', () => {
  let queryClient: QueryClient;

  const mockGraph: DependencyGraph = {
    nodes: [
      {
        id: '6-7',
        storyId: '6-7',
        epicNumber: 6,
        storyNumber: 7,
        title: 'Kanban Board',
        status: 'merged',
        complexity: 'large',
        hasWorktree: false,
      },
      {
        id: '6-8',
        storyId: '6-8',
        epicNumber: 6,
        storyNumber: 8,
        title: 'Dependency Graph',
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

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(useDependencyWebSocketModule.useDependencyWebSocket).mockReturnValue({
      events: [],
    });

    vi.mocked(useProjectStoriesModule.useProjectStories).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);
  });

  const renderPage = (projectId = 'project-1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/projects/${projectId}/dependencies`]}>
          <Routes>
            <Route path="/projects/:projectId/dependencies" element={<DependencyGraphPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('should show loading skeleton while fetching data', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
      refetch: vi.fn(),
    } as any);

    renderPage();

    // Should show skeletons
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('should show error message when fetch fails', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      isError: true,
      isSuccess: false,
      refetch: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByText('Failed to load dependency graph')).toBeInTheDocument();
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });

  it('should show empty state when no graph data', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByText('No dependency graph available')).toBeInTheDocument();
  });

  it('should render graph view by default on desktop', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: mockGraph,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByText('Dependency Graph')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /story dependency graph/i })).toBeInTheDocument();
  });

  it('should toggle between graph and list views', async () => {
    const user = userEvent.setup();

    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: mockGraph,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    // Should start in graph view
    expect(screen.getByRole('img', { name: /story dependency graph/i })).toBeInTheDocument();

    // Click list view button
    const listViewButton = screen.getByRole('button', { name: /list view/i });
    await user.click(listViewButton);

    // Should now show list view
    await waitFor(() => {
      expect(screen.getByText(/6\.7 - Kanban Board/)).toBeInTheDocument();
    });
  });

  it('should display filters', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: mockGraph,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('should display graph controls in graph view', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: mockGraph,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    expect(screen.getByTitle('Export as PNG')).toBeInTheDocument();
    expect(screen.getByTitle('Export as SVG')).toBeInTheDocument();
  });

  it('should save view mode preference to localStorage', async () => {
    const user = userEvent.setup();

    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: mockGraph,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    const listViewButton = screen.getByRole('button', { name: /list view/i });
    await user.click(listViewButton);

    await waitFor(() => {
      expect(localStorage.getItem('dependency-graph-view-mode')).toBe('list');
    });
  });

  it('should include screen reader description', () => {
    vi.mocked(useDependencyGraphModule.useDependencyGraph).mockReturnValue({
      data: mockGraph,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    } as any);

    renderPage();

    // Screen reader description should be present
    const description = screen.getByRole('region', { name: /dependency graph description/i });
    expect(description).toBeInTheDocument();
  });
});
