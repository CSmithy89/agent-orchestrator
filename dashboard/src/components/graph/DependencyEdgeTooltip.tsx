/**
 * DependencyEdgeTooltip Component
 *
 * Tooltip that displays dependency information when clicking on graph edges.
 */

import type { DependencyEdge } from '@/types/dependency-graph';
import { Badge } from '@/components/ui/badge';

interface DependencyEdgeTooltipProps {
  /** The edge to display information for */
  edge: DependencyEdge;

  /** Source story ID */
  sourceStory: string;

  /** Target story ID */
  targetStory: string;

  /** X position of the tooltip */
  x: number;

  /** Y position of the tooltip */
  y: number;
}

const TYPE_LABELS = {
  hard: 'Hard Dependency',
  soft: 'Soft Dependency',
} as const;

const TYPE_DESCRIPTIONS = {
  hard: 'Blocking - target cannot start until source is complete',
  soft: 'Suggested order - not strictly blocking',
} as const;

export function DependencyEdgeTooltip({ edge, sourceStory, targetStory, x, y }: DependencyEdgeTooltipProps) {
  return (
    <div
      className="absolute z-50 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md pointer-events-none"
      style={{
        left: `${x + 10}px`,
        top: `${y + 10}px`,
      }}
    >
      <div className="space-y-2">
        <div className="font-semibold">Dependency Details</div>
        <div className="space-y-1">
          <div className="text-xs">
            <span className="text-muted-foreground">From:</span> {sourceStory}
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">To:</span> {targetStory}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={edge.isBlocking ? 'destructive' : 'secondary'}>
            {TYPE_LABELS[edge.type]}
          </Badge>
          {edge.isBlocking && (
            <Badge variant="destructive">Blocking</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {TYPE_DESCRIPTIONS[edge.type]}
        </div>
      </div>
    </div>
  );
}
