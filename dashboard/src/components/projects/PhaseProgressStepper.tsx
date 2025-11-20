import { Check } from 'lucide-react';
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
  { label: string; variant: 'analysis' | 'planning' | 'solutioning' | 'implementation' | 'review' }
> = {
  analysis: { label: 'Analysis', variant: 'analysis' },
  planning: { label: 'Planning', variant: 'planning' },
  solutioning: { label: 'Solutioning', variant: 'solutioning' },
  implementation: { label: 'Implementation', variant: 'implementation' },
};

export function PhaseProgressStepper({ phaseProgress, currentPhase }: PhaseProgressStepperProps) {
  const phases = ['analysis', 'planning', 'solutioning', 'implementation'];

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
                  <div className="flex items-center gap-2">
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
                  </div>

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
