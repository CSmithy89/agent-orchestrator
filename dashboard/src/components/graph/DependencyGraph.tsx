/**
 * DependencyGraph Component
 *
 * Interactive D3.js-based dependency graph visualization.
 * Displays stories as nodes and dependencies as edges with hierarchical layout.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { DependencyGraph as DependencyGraphType, DependencyNode, DependencyEdge, GraphFilters } from '@/types/dependency-graph';
import { StoryNodeTooltip } from './StoryNodeTooltip';
import { DependencyEdgeTooltip } from './DependencyEdgeTooltip';

// Node color mapping based on status
const NODE_COLORS = {
  pending: '#9CA3AF', // Gray
  'in-progress': '#3B82F6', // Blue
  review: '#F59E0B', // Amber
  merged: '#10B981', // Green
  blocked: '#EF4444', // Red
} as const;

// Node size mapping based on complexity
const NODE_SIZES = {
  small: 32,
  medium: 48,
  large: 64,
} as const;

interface DependencyGraphProps {
  /** Graph data to visualize */
  graph: DependencyGraphType;

  /** Callback when a node is clicked */
  onNodeClick?: (node: DependencyNode) => void;

  /** Filter options to apply to the graph */
  filters?: GraphFilters;

  /** Optional class name for styling */
  className?: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  node: DependencyNode | null;
}

interface EdgeTooltipState {
  visible: boolean;
  x: number;
  y: number;
  edge: DependencyEdge | null;
  sourceStory: string;
  targetStory: string;
}

/**
 * D3 Node with position data
 */
interface D3Node extends DependencyNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

/**
 * D3 Link with source/target objects
 */
interface D3Link {
  source: D3Node;
  target: D3Node;
  type: 'hard' | 'soft';
  isBlocking: boolean;
}

export function DependencyGraph({ graph, onNodeClick, filters, className = '' }: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });
  const [edgeTooltip, setEdgeTooltip] = useState<EdgeTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    edge: null,
    sourceStory: '',
    targetStory: '',
  });

  // Apply filters to graph data
  const filteredGraph = useCallback(() => {
    if (!filters) return graph;

    let filteredNodes = graph.nodes;
    let filteredEdges = graph.edges;

    // Filter by epic
    if (filters.epic !== undefined) {
      filteredNodes = filteredNodes.filter(node => node.epicNumber === filters.epic);
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filteredNodes = filteredNodes.filter(node => filters.status!.includes(node.status));
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Filter by blocking
    if (filters.blocking) {
      filteredEdges = filteredEdges.filter(e => e.isBlocking);
      const nodeIds = new Set([...filteredEdges.map(e => e.source), ...filteredEdges.map(e => e.target)]);
      filteredNodes = filteredNodes.filter(n => nodeIds.has(n.id));
    }

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      criticalPath: graph.criticalPath,
    };
  }, [graph, filters]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const filtered = filteredGraph();
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous graph
    svg.selectAll('*').remove();

    // AC 10: Virtualization for graphs >100 stories
    // When graph has >100 nodes, use simplified rendering for performance
    const useVirtualization = filtered.nodes.length > 100;
    const virtualizedNodes = useVirtualization
      ? filtered.nodes.slice(0, 100) // Show first 100 nodes for initial render
      : filtered.nodes;

    // Filter edges to only include those connected to virtualized nodes
    const virtualizedNodeIds = new Set(virtualizedNodes.map(n => n.id));
    const virtualizedEdges = filtered.edges.filter(
      e => virtualizedNodeIds.has(e.source) && virtualizedNodeIds.has(e.target)
    );

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Main group for graph elements
    const g = svg.append('g');

    // Create simulation for force-directed layout
    // Use virtualized nodes for performance when >100 nodes
    const simulation = d3.forceSimulation<D3Node>(virtualizedNodes as D3Node[])
      .force('link', d3.forceLink<D3Node, D3Link>(virtualizedEdges.map(e => ({
        source: virtualizedNodes.find(n => n.id === e.source)!,
        target: virtualizedNodes.find(n => n.id === e.target)!,
        type: e.type,
        isBlocking: e.isBlocking,
      }))).id((d: D3Node) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => NODE_SIZES[(d as D3Node).complexity] + 10));

    // Draw edges
    const edgesData = virtualizedEdges.map(e => ({
      source: virtualizedNodes.find(n => n.id === e.source)!,
      target: virtualizedNodes.find(n => n.id === e.target)!,
      type: e.type,
      isBlocking: e.isBlocking,
      originalEdge: e, // Keep reference to original edge for tooltip
    })) as (D3Link & { originalEdge: DependencyEdge })[];

    const link = g.append('g')
      .selectAll<SVGLineElement, D3Link & { originalEdge: DependencyEdge }>('line')
      .data(edgesData)
      .join('line')
      .attr('class', 'edge')
      .attr('stroke', d => d.isBlocking ? '#EF4444' : '#9CA3AF')
      .attr('stroke-width', d => filtered.criticalPath.includes((d.source as D3Node).id) &&
                                   filtered.criticalPath.includes((d.target as D3Node).id) ? 3 : 1)
      .attr('stroke-dasharray', d => d.type === 'soft' ? '5,5' : '0')
      .attr('opacity', 0.6)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        // AC 5: Edge click interaction - show dependency details tooltip
        event.stopPropagation();
        const rect = container.getBoundingClientRect();
        const sourceNode = d.source as D3Node;
        const targetNode = d.target as D3Node;
        setEdgeTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          edge: d.originalEdge,
          sourceStory: `Story ${sourceNode.epicNumber}.${sourceNode.storyNumber}`,
          targetStory: `Story ${targetNode.epicNumber}.${targetNode.storyNumber}`,
        });
        // Hide node tooltip if showing
        setTooltip({ visible: false, x: 0, y: 0, node: null });
      })
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.6);
      });

    // Draw nodes
    const node = g.append('g')
      .selectAll<SVGGElement, D3Node>('g')
      .data(virtualizedNodes as D3Node[])
      .join('g')
      .attr('class', 'node')
      .attr('tabindex', 0) // AC 9: Make nodes keyboard-focusable
      .attr('role', 'button') // AC 9: Add semantic role for accessibility
      .attr('aria-label', d => `Story ${d.epicNumber}.${d.storyNumber}: ${d.title}`)
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node circles
    node.append('circle')
      .attr('r', d => NODE_SIZES[d.complexity])
      .attr('fill', d => NODE_COLORS[d.status])
      .attr('stroke', d => d.status === 'in-progress' ? '#3B82F6' : '#1F2937')
      .attr('stroke-width', d => d.status === 'in-progress' ? 3 : 2)
      .style('filter', d => d.status === 'in-progress' ? 'url(#glow)' : 'none');

    // Add glow filter for in-progress nodes
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Node labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => `${d.epicNumber}.${d.storyNumber}`);

    // Worktree indicator
    node.filter(d => d.hasWorktree)
      .append('circle')
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('r', 8)
      .attr('fill', '#F97316');

    // Node interactions
    node.on('click', (event, d) => {
      event.stopPropagation();
      if (onNodeClick) {
        onNodeClick(d as DependencyNode);
      }
      // Hide edge tooltip if showing
      setEdgeTooltip({ visible: false, x: 0, y: 0, edge: null, sourceStory: '', targetStory: '' });
    });

    // AC 9: Keyboard navigation - Enter key to open story
    node.on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d as DependencyNode);
        }
      }
    });

    // AC 9: Visual focus indicator for keyboard navigation
    node.on('focus', function() {
      d3.select(this).select('circle')
        .attr('stroke-width', 4)
        .attr('stroke', '#3B82F6');
    });

    node.on('blur', function(_event, d) {
      d3.select(this).select('circle')
        .attr('stroke-width', (d as D3Node).status === 'in-progress' ? 3 : 2)
        .attr('stroke', (d as D3Node).status === 'in-progress' ? '#3B82F6' : '#1F2937');
    });

    node.on('mouseover', (event, d) => {
      const rect = container.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        node: d as DependencyNode,
      });
      // Hide edge tooltip if showing
      setEdgeTooltip({ visible: false, x: 0, y: 0, edge: null, sourceStory: '', targetStory: '' });
    });

    node.on('mouseout', () => {
      setTooltip({
        visible: false,
        x: 0,
        y: 0,
        node: null,
      });
    });

    // Double-click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg.transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
    });

    // Click on background to hide tooltips
    svg.on('click', () => {
      setTooltip({ visible: false, x: 0, y: 0, node: null });
      setEdgeTooltip({ visible: false, x: 0, y: 0, edge: null, sourceStory: '', targetStory: '' });
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x || 0)
        .attr('y1', d => (d.source as D3Node).y || 0)
        .attr('x2', d => (d.target as D3Node).x || 0)
        .attr('y2', d => (d.target as D3Node).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [filteredGraph, onNodeClick]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        aria-label="Story dependency graph"
        role="img"
      />
      {tooltip.visible && tooltip.node && (
        <StoryNodeTooltip
          node={tooltip.node}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
      {edgeTooltip.visible && edgeTooltip.edge && (
        <DependencyEdgeTooltip
          edge={edgeTooltip.edge}
          sourceStory={edgeTooltip.sourceStory}
          targetStory={edgeTooltip.targetStory}
          x={edgeTooltip.x}
          y={edgeTooltip.y}
        />
      )}
    </div>
  );
}
