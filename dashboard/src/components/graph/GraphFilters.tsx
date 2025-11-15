/**
 * GraphFilters Component
 *
 * Filter controls for the dependency graph visualization.
 */

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { GraphFilters, StoryStatus } from '@/types/dependency-graph';

interface GraphFiltersProps {
  /** Available epic numbers */
  epics: number[];

  /** Current filter state */
  filters: GraphFilters;

  /** Callback when filters change */
  onFiltersChange: (filters: GraphFilters) => void;
}

const STATUSES: { value: StoryStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'merged', label: 'Merged' },
  { value: 'blocked', label: 'Blocked' },
];

export function GraphFilters({ epics, filters, onFiltersChange }: GraphFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleEpicChange = (value: string) => {
    onFiltersChange({
      ...filters,
      epic: value === 'all' ? undefined : parseInt(value),
    });
  };

  const handleStatusToggle = (status: StoryStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length === 0 ? undefined : newStatuses,
    });
  };

  const handleBlockingToggle = () => {
    onFiltersChange({
      ...filters,
      blocking: !filters.blocking,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.epic !== undefined ||
                           (filters.status && filters.status.length > 0) ||
                           filters.blocking;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={showFilters ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2 px-1 min-w-[20px]">
            {(filters.epic ? 1 : 0) + (filters.status?.length || 0) + (filters.blocking ? 1 : 0)}
          </Badge>
        )}
      </Button>

      {showFilters && (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
          {/* Epic Filter */}
          <div className="space-y-2">
            <Label htmlFor="epic-filter" className="text-xs">Epic</Label>
            <Select
              value={filters.epic?.toString() || 'all'}
              onValueChange={handleEpicChange}
            >
              <SelectTrigger id="epic-filter" className="w-[120px]">
                <SelectValue placeholder="All Epics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Epics</SelectItem>
                {epics.map(epic => (
                  <SelectItem key={epic} value={epic.toString()}>
                    Epic {epic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs">Status</Label>
            <div className="flex gap-2">
              {STATUSES.map(({ value, label }) => (
                <Badge
                  key={value}
                  variant={filters.status?.includes(value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleStatusToggle(value)}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Blocking Filter */}
          <div className="space-y-2">
            <Label className="text-xs">Dependencies</Label>
            <Badge
              variant={filters.blocking ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={handleBlockingToggle}
            >
              Blocking Only
            </Badge>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
