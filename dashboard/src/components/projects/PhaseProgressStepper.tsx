import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import type { PhaseProgress } from '../../api/types';

interface PhaseProgressStepperProps {
  phaseProgress: PhaseProgress[];
  currentPhase: string;
}

const phaseConfig: Record<
  string,
  {
    label: string;
    variant: 'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review';
    workflows: string[];
  }
> = {
  analysis: {
    label: 'Analysis',
    variant: 'analysis',
    workflows: ['Product Brief', 'Domain Research', 'Brainstorm Project', 'Research']
  },
  planning: {
    label: 'Planning',
    variant: 'planning',
    workflows: ['PRD', 'Technical Specification', 'UX Design', 'Narrative']
  },
  solutioning: {
    label: 'Solutioning',
    variant: 'solutioning',
    workflows: ['Architecture', 'Solutioning Gate Check', 'Create Epics & Stories']
  },
  implementation: {
    label: 'Implementation',
    variant: 'implementation',
    workflows: ['Sprint Planning', 'Create Story', 'Story Context', 'Dev Story', 'Code Review', 'Story Done']
  },
};

export function PhaseProgressStepper({ phaseProgress, currentPhase }: PhaseProgressStepperProps) {
  const phases = ['analysis', 'planning', 'solutioning', 'implementation'];
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set([currentPhase]) // Auto-expand current phase
  );

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  const getPhaseStatus = (phase: string): 'completed' | 'current' | 'upcoming' => {
    const currentIndex = phases.indexOf(currentPhase);
    const phaseIndex = phases.indexOf(phase);

    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getPhaseData = (phaseName: string): PhaseProgress | undefined => {
    return phaseProgress?.find((p) => p.phase === phaseName);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Phase Progress</h3>
      <div className="space-y-6">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const phaseData = getPhaseData(phase);
          const config = phaseConfig[phase];
          const progress = phaseData?.progress || 0;

          const isExpanded = expandedPhases.has(phase);

          return (
            <div key={phase} className="space-y-2">
              <div className="flex items-center gap-3">
                {/* Phase indicator */}
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    status === 'completed' && 'border-green-500 bg-green-500 text-white',
                    status === 'current' && 'border-primary bg-primary text-primary-foreground',
                    status === 'upcoming' && 'border-muted bg-muted text-muted-foreground'
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Phase name and badge */}
                <div className="flex-1">
                  <button
                    onClick={() => togglePhase(phase)}
                    className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        status === 'current' && 'text-foreground',
                        status !== 'current' && 'text-muted-foreground'
                      )}
                    >
                      {config.label}
                    </span>
                    {status === 'current' && <Badge variant={config.variant}>Current</Badge>}
                    {status === 'completed' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Complete
                      </Badge>
                    )}
                  </button>

                  {/* Progress bar for current and completed phases */}
                  {(status === 'current' || status === 'completed') && phaseData && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {phaseData.completedTasks} / {phaseData.totalTasks} tasks
                        </span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Workflows list (collapsible) */}
                  {isExpanded && config.workflows.length > 0 && (
                    <div className="mt-3 ml-6 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Workflows:</p>
                      {config.workflows.map((workflow) => (
                        <div
                          key={workflow}
                          className="flex items-center gap-2 text-xs text-muted-foreground py-1"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                          <span>{workflow}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line (except for last phase) */}
              {index < phases.length - 1 && (
                <div className="ml-4 h-6 w-0.5 bg-border" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
