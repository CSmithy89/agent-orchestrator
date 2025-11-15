/**
 * DependencyListView Component
 *
 * List view fallback for mobile devices showing dependencies in a hierarchical list.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DependencyGraph, DependencyNode } from '@/types/dependency-graph';

interface DependencyListViewProps {
  /** Graph data to display */
  graph: DependencyGraph;

  /** Callback when a story is clicked */
  onStoryClick?: (node: DependencyNode) => void;
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

export function DependencyListView({ graph, onStoryClick }: DependencyListViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Get dependencies for a node
  const getDependencies = (nodeId: string) => {
    const dependencyIds = graph.edges
      .filter(edge => edge.target === nodeId)
      .map(edge => edge.source);

    return graph.nodes.filter(node => dependencyIds.includes(node.id));
  };

  // Get dependent stories (stories that depend on this one)
  const getDependents = (nodeId: string) => {
    const dependentIds = graph.edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);

    return graph.nodes.filter(node => dependentIds.includes(node.id));
  };

  const getEdgeInfo = (sourceId: string, targetId: string) => {
    return graph.edges.find(edge => edge.source === sourceId && edge.target === targetId);
  };

  if (graph.nodes.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No stories to display
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {graph.nodes.map((node) => {
        const isExpanded = expandedNodes.has(node.id);
        const dependencies = getDependencies(node.id);
        const dependents = getDependents(node.id);
        const hasDependencies = dependencies.length > 0 || dependents.length > 0;

        return (
          <Card key={node.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {hasDependencies && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleNode(node.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onStoryClick?.(node)}
                  >
                    <div className="font-semibold">
                      {node.epicNumber}.{node.storyNumber} - {node.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={STATUS_COLORS[node.status]}>
                        {STATUS_LABELS[node.status]}
                      </Badge>
                      <Badge variant="outline">{node.complexity}</Badge>
                      {node.hasWorktree && (
                        <Badge variant="outline" className="bg-orange-100">
                          Active worktree
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && hasDependencies && (
                  <div className="mt-4 ml-8 space-y-3">
                    {dependencies.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                          Dependencies ({dependencies.length})
                        </div>
                        <div className="space-y-2">
                          {dependencies.map((dep) => {
                            const edge = getEdgeInfo(dep.id, node.id);
                            return (
                              <div
                                key={dep.id}
                                className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                                onClick={() => onStoryClick?.(dep)}
                              >
                                <span>
                                  {dep.epicNumber}.{dep.storyNumber} - {dep.title}
                                </span>
                                {edge && (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {edge.type}
                                    </Badge>
                                    {edge.isBlocking && (
                                      <Badge variant="destructive" className="text-xs">
                                        Blocking
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {dependents.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                          Blocks ({dependents.length})
                        </div>
                        <div className="space-y-2">
                          {dependents.map((dep) => {
                            const edge = getEdgeInfo(node.id, dep.id);
                            return (
                              <div
                                key={dep.id}
                                className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted"
                                onClick={() => onStoryClick?.(dep)}
                              >
                                <span>
                                  {dep.epicNumber}.{dep.storyNumber} - {dep.title}
                                </span>
                                {edge && (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {edge.type}
                                    </Badge>
                                    {edge.isBlocking && (
                                      <Badge variant="destructive" className="text-xs">
                                        Blocking
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
