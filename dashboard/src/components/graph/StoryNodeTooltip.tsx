/**
 * StoryNodeTooltip Component
 *
 * Tooltip that displays story information when hovering over graph nodes.
 */

import type { DependencyNode } from '@/types/dependency-graph';
import { Badge } from '@/components/ui/badge';

interface StoryNodeTooltipProps {
  /** The node to display information for */
  node: DependencyNode;

  /** X position of the tooltip */
  x: number;

  /** Y position of the tooltip */
  y: number;
}

const STATUS_LABELS = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  review: 'Review',
  merged: 'Merged',
  blocked: 'Blocked',
} as const;

const STATUS_COLORS = {
  pending: 'secondary',
  'in-progress': 'default',
  review: 'default',
  merged: 'default',
  blocked: 'destructive',
} as const;

export function StoryNodeTooltip({ node, x, y }: StoryNodeTooltipProps) {
  return (
    <div
      className="absolute z-50 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md pointer-events-none"
      style={{
        left: `${x + 10}px`,
        top: `${y + 10}px`,
      }}
    >
      <div className="space-y-1">
        <div className="font-semibold">{node.title}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Story {node.epicNumber}.{node.storyNumber}
          </span>
          <Badge variant={STATUS_COLORS[node.status]}>
            {STATUS_LABELS[node.status]}
          </Badge>
        </div>
        {node.hasWorktree && (
          <div className="text-xs text-muted-foreground">
            🟠 Active worktree
          </div>
        )}
      </div>
    </div>
  );
}
