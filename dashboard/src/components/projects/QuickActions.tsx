import { useState } from 'react';
import { Pause, Play, FileText, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { orchestratorsApi } from '../../api/orchestrators';
import { useToast } from '../../hooks/useToast';
import type { Project } from '../../api/types';

interface QuickActionsProps {
  project: Project;
  onStatusChange?: () => void;
}

export function QuickActions({ project, onStatusChange }: QuickActionsProps) {
  const { toast } = useToast();
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const handlePause = async () => {
    setIsPausing(true);
    try {
      await orchestratorsApi.pause(project.id);
      toast({
        title: 'Workflow Paused',
        description: `${project.name} workflow has been paused successfully.`,
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to pause workflow',
        variant: 'destructive',
      });
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await orchestratorsApi.resume(project.id);
      toast({
        title: 'Workflow Resumed',
        description: `${project.name} workflow has been resumed successfully.`,
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resume workflow',
        variant: 'destructive',
      });
    } finally {
      setIsResuming(false);
    }
  };

  const canPause = project.status === 'active';
  const canResume = project.status === 'paused';

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Pause button */}
      {canPause && (
        <Button
          variant="outline"
          onClick={handlePause}
          disabled={isPausing}
          className="gap-2"
          aria-label="Pause workflow"
        >
          <Pause className="h-4 w-4" />
          {isPausing ? 'Pausing...' : 'Pause'}
        </Button>
      )}

      {/* Resume button */}
      {canResume && (
        <Button
          variant="default"
          onClick={handleResume}
          disabled={isResuming}
          className="gap-2"
          aria-label="Resume workflow"
        >
          <Play className="h-4 w-4" />
          {isResuming ? 'Resuming...' : 'Resume'}
        </Button>
      )}

      {/* View Docs dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" aria-label="View documentation">
            <FileText className="h-4 w-4" />
            View Docs
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/docs/${project.id}/prd`} target="_blank" rel="noopener noreferrer">
              Product Requirements (PRD)
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/docs/${project.id}/architecture`} target="_blank" rel="noopener noreferrer">
              Architecture Document
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/docs/${project.id}/epics`} target="_blank" rel="noopener noreferrer">
              Epics
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/docs/${project.id}/stories`} target="_blank" rel="noopener noreferrer">
              Stories
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
