import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test-utils/test-utils';
import { ProjectsListPage } from './ProjectsListPage';
import { useProjects } from '../hooks/useProjects';
import type { Project } from '../api/types';
import userEvent from '@testing-library/user-event';

// Mock hooks
vi.mock('../hooks/useProjects');
vi.mock('../hooks/useProjectWebSocket');

describe('ProjectsListPage', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Test Project 1',
      status: 'active',
      phase: 'implementation',
      createdAt: '2025-11-14T00:00:00Z',
      updatedAt: '2025-11-14T12:00:00Z',
      repository: 'https://github.com/test/repo1',
    },
    {
      id: 'proj-2',
      name: 'Test Project 2',
      status: 'paused',
      phase: 'planning',
      createdAt: '2025-11-14T00:00:00Z',
      updatedAt: '2025-11-14T11:00:00Z',
      repository: 'https://github.com/test/repo2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and create button', async () => {
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectsListPage />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Manage and monitor your autonomous development projects')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
  });

  it('should display projects list', async () => {
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectsListPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
      expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    });
  });

  it('should show loading skeletons', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(<ProjectsListPage />);

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show error message when fetch fails', () => {
    vi.mocked(useProjects).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch projects'),
    } as any);

    render(<ProjectsListPage />);

    expect(screen.getByText('Error Loading Projects')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch projects')).toBeInTheDocument();
  });

  it('should open create project modal when button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectsListPage />);

    const createButton = screen.getByRole('button', { name: /Create Project/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Project')).toBeInTheDocument();
    });
  });

  it('should filter projects by search term', async () => {
    const user = userEvent.setup();
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectsListPage />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await user.type(searchInput, 'Project 1');

    await waitFor(
      () => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should show empty state when no projects match filters', async () => {
    const user = userEvent.setup();
    vi.mocked(useProjects).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    } as any);

    render(<ProjectsListPage />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await user.type(searchInput, 'nonexistent');

    await waitFor(
      () => {
        expect(screen.getByText('No projects found')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });
});
