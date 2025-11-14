import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { ProjectsGrid } from './ProjectsGrid';
import type { Project } from '../../api/types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('ProjectsGrid', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Project 1',
      status: 'active',
      phase: 'implementation',
      createdAt: '2025-11-14T00:00:00Z',
      updatedAt: '2025-11-14T12:00:00Z',
    },
    {
      id: 'proj-2',
      name: 'Project 2',
      status: 'paused',
      phase: 'planning',
      createdAt: '2025-11-14T00:00:00Z',
      updatedAt: '2025-11-14T12:00:00Z',
    },
  ];

  it('should render project cards', () => {
    render(<ProjectsGrid projects={mockProjects} />);

    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('should show loading skeletons when loading', () => {
    render(<ProjectsGrid projects={[]} loading />);

    // Note: Skeleton component should have data-testid="skeleton" or we check by className
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show empty state when no projects', () => {
    render(<ProjectsGrid projects={[]} />);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first project')).toBeInTheDocument();
  });

  it('should render correct number of project cards', () => {
    render(<ProjectsGrid projects={mockProjects} />);

    const cards = screen.getAllByRole('button', { name: /View details for project/i });
    expect(cards).toHaveLength(2);
  });
});
