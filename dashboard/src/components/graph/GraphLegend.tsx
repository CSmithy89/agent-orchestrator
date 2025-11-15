/**
 * GraphLegend Component
 *
 * Legend explaining node colors, edge types, and graph symbols.
 */

import { Card } from '@/components/ui/card';

export function GraphLegend() {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Node Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#9CA3AF]" />
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="text-xs">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F59E0B]" />
            <span className="text-xs">Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#10B981]" />
            <span className="text-xs">Merged</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#EF4444]" />
            <span className="text-xs">Blocked</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Node Size</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400" />
            <span className="text-xs">Small complexity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-400" />
            <span className="text-xs">Medium complexity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-400" />
            <span className="text-xs">Large complexity</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Edge Types</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400" />
            <span className="text-xs">Hard dependency (blocking)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-gray-400" />
            <span className="text-xs">Soft dependency (suggested)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500" />
            <span className="text-xs">Blocking (cannot proceed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gray-700" />
            <span className="text-xs">Critical path</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Indicators</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#F97316]" />
            <span className="text-xs">Active worktree</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p><strong>Tip:</strong> Drag nodes to rearrange, scroll to zoom, double-click to reset</p>
      </div>
    </Card>
  );
}
