import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProjectFilters, type ProjectFilterState } from '../components/projects/ProjectFilters';
import { ProjectsGrid } from '../components/projects/ProjectsGrid';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { useProjects } from '../hooks/useProjects';
import { useProjectWebSocket } from '../hooks/useProjectWebSocket';
import type { Project } from '../api/types';

export function ProjectsListPage() {
  const { data: projects, isLoading, error } = useProjects();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProjectFilterState>({
    phase: 'all',
    status: 'all',
    search: '',
    sortBy: 'lastUpdated',
  });

  // Subscribe to WebSocket updates for all projects
  useProjectWebSocket();

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = [...projects];

    // Filter by phase
    if (filters.phase !== 'all') {
      filtered = filtered.filter((p) => p.phase === filters.phase);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.repository?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (filters.sortBy === 'lastUpdated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [projects, filters]);

  const handleCreateProject = (name: string, repository: string) => {
    // TODO: Implement project creation API call
    console.log('Create project:', { name, repository });
    // This will be implemented in a future story
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Projects</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your autonomous development projects
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Filters */}
      <ProjectFilters onFilterChange={setFilters} />

      {/* Projects Grid */}
      <ProjectsGrid projects={filteredProjects} loading={isLoading} />

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
