import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Kanban, Network } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { PhaseProgressStepper } from '../components/projects/PhaseProgressStepper';
import { ActiveAgentsList } from '../components/projects/ActiveAgentsList';
import { EventTimeline } from '../components/projects/EventTimeline';
import { QuickActions } from '../components/projects/QuickActions';
import { useProject, useProjectWorkflowStatus } from '../hooks/useProjects';
import { useProjectWebSocket } from '../hooks/useProjectWebSocket';
import type { EventLog, AgentActivity } from '../api/types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading, error: projectError, refetch } = useProject(id || '');
  const {
    data: workflowStatus,
    isLoading: workflowLoading,
  } = useProjectWorkflowStatus(id || '');

  // Subscribe to WebSocket updates for this project
  useProjectWebSocket(id);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Invalid Project</h2>
          <p className="text-muted-foreground mb-4">No project ID provided</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Project</h2>
          <p className="text-muted-foreground mb-4">
            {projectError instanceof Error ? projectError.message : 'An unknown error occurred'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (projectLoading || !project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  // Mock data for active agents and events (will be replaced with real data when backend is ready)
  const mockAgents: AgentActivity[] = [
    {
      agentId: 'agent-dev-1',
      agentName: 'Dev Agent',
      currentTask: 'Implementing story 6-5: Project Management Views',
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: 'active',
      projectId: project.id,
    },
  ];

  const mockEvents: EventLog[] = [
    {
      id: 'event-1',
      projectId: project.id,
      eventType: 'agent.started',
      description: 'Dev Agent started working on story 6-5',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-2',
      projectId: project.id,
      eventType: 'story.status.changed',
      description: 'Story 6-5 status changed to in-progress',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-3',
      projectId: project.id,
      eventType: 'project.phase.changed',
      description: `Project phase changed to ${project.phase}`,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Map phase to badge variant
  const phaseVariantMap: Record<
    string,
    'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review'
  > = {
    analysis: 'analysis',
    planning: 'planning',
    solutioning: 'solutioning',
    implementation: 'implementation',
    review: 'review',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={phaseVariantMap[project.phase] || 'default'}>{project.phase}</Badge>
              <Badge
                variant={
                  project.status === 'active'
                    ? 'default'
                    : project.status === 'error'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {project.status}
              </Badge>
            </div>
            {project.repository && (
              <p className="text-muted-foreground mt-1">{project.repository}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/projects/${id}/stories`)}>
            <Kanban className="h-4 w-4 mr-2" />
            View Stories
          </Button>
          <Button variant="outline" onClick={() => navigate(`/projects/${id}/dependencies`)}>
            <Network className="h-4 w-4 mr-2" />
            View Dependencies
          </Button>
          <QuickActions project={project} onStatusChange={() => refetch()} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Phase Progress */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
            <CardDescription>Current phase and task completion</CardDescription>
          </CardHeader>
          <CardContent>
            {workflowLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : workflowStatus ? (
              <div className="space-y-4">
                <PhaseProgressStepper
                  phaseProgress={workflowStatus.phaseProgress}
                  currentPhase={workflowStatus.currentPhase}
                />
                {workflowStatus.currentStory && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Current Story</p>
                    <p className="text-sm font-medium mt-1">{workflowStatus.currentStory}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workflow status available</p>
            )}
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Agents</CardTitle>
            <CardDescription>Agents currently working on this project</CardDescription>
          </CardHeader>
          <CardContent>
            <ActiveAgentsList agents={project.status === 'active' ? mockAgents : []} />
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest project activity</CardDescription>
          </CardHeader>
          <CardContent>
            <EventTimeline events={mockEvents} maxHeight="500px" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
