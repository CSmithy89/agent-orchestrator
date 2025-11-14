import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { formatRelativeTime } from '../../lib/utils';
import type { Project } from '../../api/types';

interface ProjectCardProps {
  project: Project;
}

// Map phase to badge variant
const phaseVariantMap: Record<Project['phase'], 'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review'> = {
  analysis: 'analysis',
  planning: 'planning',
  solutioning: 'solutioning',
  implementation: 'implementation',
  review: 'review',
};

// Calculate progress percentage based on phase
function getPhaseProgress(phase: Project['phase']): number {
  const phaseProgress: Record<Project['phase'], number> = {
    analysis: 25,
    planning: 40,
    solutioning: 60,
    implementation: 80,
    review: 95,
  };
  return phaseProgress[phase] || 0;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/projects/${project.id}`);
    }
  };

  const progress = getPhaseProgress(project.phase);

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for project ${project.name}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {project.repository || 'No repository specified'}
            </CardDescription>
          </div>
          <Badge variant={phaseVariantMap[project.phase]} className="ml-2">
            {project.phase}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Active tasks count and last update */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Status:{' '}
              <span className={`font-medium ${
                project.status === 'active' ? 'text-green-600 dark:text-green-400' :
                project.status === 'paused' ? 'text-yellow-600 dark:text-yellow-400' :
                project.status === 'error' ? 'text-red-600 dark:text-red-400' :
                'text-blue-600 dark:text-blue-400'
              }`}>
                {project.status}
              </span>
            </span>
            <span className="text-muted-foreground" title={new Date(project.updatedAt).toLocaleString()}>
              {formatRelativeTime(project.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
