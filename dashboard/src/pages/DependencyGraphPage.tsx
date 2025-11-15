/**
 * DependencyGraphPage Component
 *
 * Page for viewing project dependency graph with interactive visualization.
 * Includes graph view, list view, filters, controls, and real-time updates.
 */

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { DependencyGraph } from '@/components/graph/DependencyGraph';
import { DependencyListView } from '@/components/graph/DependencyListView';
import { GraphControls } from '@/components/graph/GraphControls';
import { GraphFilters } from '@/components/graph/GraphFilters';
import { GraphLegend } from '@/components/graph/GraphLegend';
import { StoryDetailModal } from '@/components/kanban/StoryDetailModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDependencyGraph } from '@/hooks/useDependencyGraph';
import { useDependencyWebSocket } from '@/hooks/useDependencyWebSocket';
import { useProjectStories } from '@/hooks/useProjectStories';
import type { GraphFilters as GraphFiltersType, DependencyNode, ViewMode } from '@/types/dependency-graph';

export function DependencyGraphPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Check if mobile device (screen width < 768px)
    const isMobile = window.innerWidth < 768;
    // Try to load from localStorage, default to list on mobile, graph on desktop
    const saved = localStorage.getItem('dependency-graph-view-mode');
    return (saved as ViewMode) || (isMobile ? 'list' : 'graph');
  });
  const [filters, setFilters] = useState<GraphFiltersType>({});
  const [selectedStory, setSelectedStory] = useState<DependencyNode | null>(null);

  // Data fetching
  const { data: graph, isLoading, error } = useDependencyGraph(projectId);
  const { data: stories = [] } = useProjectStories(projectId || '');

  // Real-time updates
  useDependencyWebSocket(projectId);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('dependency-graph-view-mode', viewMode);
  }, [viewMode]);

  // Get unique epic numbers from graph data
  const availableEpics = graph ? [...new Set(graph.nodes.map(n => n.epicNumber))].sort() : [];

  // Handle node click
  const handleNodeClick = (node: DependencyNode) => {
    setSelectedStory(node);
  };

  // Handle story modal close
  const handleCloseStoryModal = () => {
    setSelectedStory(null);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Failed to load dependency graph</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No dependency graph available</h2>
          <p className="text-sm text-muted-foreground">Create some stories to see the dependency graph</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dependency Graph</h1>

          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'graph' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('graph')}
              className="hidden md:flex"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Graph View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {viewMode === 'graph' && (
            <GraphControls
              graphRef={graphContainerRef}
              projectId={projectId}
            />
          )}

          <GraphFilters
            epics={availableEpics}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Main visualization area */}
        <div className="flex-1 overflow-auto" ref={graphContainerRef}>
          {viewMode === 'graph' ? (
            <div className="h-full min-h-[600px]">
              <DependencyGraph
                graph={graph}
                filters={filters}
                onNodeClick={handleNodeClick}
              />
            </div>
          ) : (
            <DependencyListView
              graph={graph}
              onStoryClick={handleNodeClick}
            />
          )}
        </div>

        {/* Legend sidebar (hidden on mobile) */}
        {viewMode === 'graph' && (
          <div className="hidden lg:block w-64 flex-shrink-0">
            <GraphLegend />
          </div>
        )}
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <StoryDetailModal
          story={stories.find(s => s.id === selectedStory.storyId) || null}
          isOpen={!!selectedStory}
          onClose={handleCloseStoryModal}
        />
      )}

      {/* Accessibility: Screen reader description */}
      <div className="sr-only" role="region" aria-label="Dependency graph description">
        <h2>Story Dependencies</h2>
        <p>This graph shows the dependencies between stories in the project.</p>
        <ul>
          {graph.nodes.map(node => {
            const deps = graph.edges
              .filter(e => e.target === node.id)
              .map(e => graph.nodes.find(n => n.id === e.source))
              .filter(Boolean);

            return (
              <li key={node.id}>
                Story {node.epicNumber}.{node.storyNumber}: {node.title}
                {deps.length > 0 && (
                  <>
                    {' '}depends on{' '}
                    {deps.map(d => `${d!.epicNumber}.${d!.storyNumber}`).join(', ')}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
