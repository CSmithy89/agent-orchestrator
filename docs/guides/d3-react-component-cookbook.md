# D3.js + React Component Cookbook

**Author:** Charlie (Developer)
**Date:** 2025-11-16
**Status:** Active
**Related:** [ADR-005: D3.js for Dependency Graph Visualization](../adr/adr-005-d3js-dependency-visualization.md)

## Overview

This cookbook documents battle-tested patterns for integrating D3.js with React, based on the DependencyGraph component built in Epic 6 (Story 6-8). D3's imperative API conflicts with React's declarative model, requiring careful integration patterns to avoid re-render issues, memory leaks, and performance problems.

## Table of Contents

1. [Core Integration Pattern](#core-integration-pattern)
2. [Force-Directed Graphs](#force-directed-graphs)
3. [Pan, Zoom & Drag Interactions](#pan-zoom--drag-interactions)
4. [Data Updates & Animations](#data-updates--animations)
5. [Export Functionality](#export-functionality)
6. [Performance Optimization](#performance-optimization)
7. [Accessibility Patterns](#accessibility-patterns)
8. [Testing D3 Components](#testing-d3-components)
9. [Common Pitfalls](#common-pitfalls)

## Core Integration Pattern

### The `useRef` + `useEffect` Pattern

**The Golden Rule:** React owns the component tree, D3 owns the DOM subtree within the SVG.

```typescript
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DependencyGraphProps {
  data: { nodes: Node[]; edges: Edge[] };
  width?: number;
  height?: number;
}

function DependencyGraph({ data, width = 800, height = 600 }: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Edge> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // D3 owns this DOM subtree
    const svg = d3.select(svgRef.current);

    // Clear previous render
    svg.selectAll('*').remove();

    // Render graph with D3
    renderGraph(svg, data, width, height);

    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [data, width, height]); // Re-run when dependencies change

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      data-testid="dependency-graph"
      aria-label="Story dependency visualization"
    />
  );
}
```

**Key Points:**
- ✅ `useRef` creates a stable reference to the SVG element
- ✅ `useEffect` runs D3 code after React renders
- ✅ D3 manipulates DOM directly inside the SVG
- ✅ Cleanup function stops animations on unmount
- ✅ Dependencies array controls when to re-render

### Why Not Mix React and D3 Rendering?

```typescript
// ❌ Bad: Mixing React and D3 rendering
function BadGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('circle').data(data.nodes).enter().append('circle');
  }, [data]);

  return (
    <svg ref={svgRef}>
      {/* React tries to render here while D3 also manipulates DOM */}
      {data.nodes.map(node => (
        <circle key={node.id} /> {/* 💥 Conflict! */}
      ))}
    </svg>
  );
}

// ✅ Good: Let D3 own the entire SVG content
function GoodGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear first
    svg.selectAll('circle').data(data.nodes).enter().append('circle');
  }, [data]);

  return <svg ref={svgRef} />;
}
```

## Force-Directed Graphs

### Basic Force Simulation

```typescript
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

function createForceSimulation(
  nodes: Node[],
  edges: Edge[],
  width: number,
  height: number
) {
  return forceSimulation(nodes)
    .force('link', forceLink(edges)
      .id((d: any) => d.id)
      .distance(100) // Link length
    )
    .force('charge', forceManyBody()
      .strength(-300) // Repulsion strength
    )
    .force('center', forceCenter(width / 2, height / 2))
    .force('collision', forceCollide()
      .radius(40) // Collision radius (prevent overlap)
    )
    .alpha(1) // Initial energy
    .alphaDecay(0.02); // Energy decay rate
}
```

### Rendering Nodes and Edges

```typescript
function renderGraph(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: GraphData,
  width: number,
  height: number
) {
  // Create container group
  const g = svg.append('g').attr('class', 'graph-container');

  // Create edges
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(data.edges)
    .enter()
    .append('line')
    .attr('data-testid', 'dependency-edge')
    .attr('stroke', '#999')
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.6);

  // Create nodes
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('data-testid', 'story-node')
    .attr('data-story-id', d => d.id)
    .attr('r', 20)
    .attr('fill', d => getNodeColor(d.status))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // Add labels
  const label = g.append('g')
    .attr('class', 'labels')
    .selectAll('text')
    .data(data.nodes)
    .enter()
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 35)
    .attr('font-size', 12)
    .text(d => d.label);

  // Create simulation
  const simulation = createForceSimulation(data.nodes, data.edges, width, height);

  // Update positions on tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => (d.source as any).x)
      .attr('y1', d => (d.source as any).y)
      .attr('x2', d => (d.target as any).x)
      .attr('y2', d => (d.target as any).y);

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    label
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });

  return simulation;
}
```

### Optimizing Force Simulation Parameters

**For Story Dependency Graphs (from Epic 6):**

```typescript
const params = {
  linkDistance: 100,      // Balanced spacing for readability
  chargeStrength: -300,   // Strong repulsion prevents overlap
  collisionRadius: 40,    // Prevents node overlap
  alphaDecay: 0.02,       // Smooth stabilization (lower = slower)
  velocityDecay: 0.4,     // Friction (higher = faster settling)
};

forceSimulation(nodes)
  .force('link', forceLink(edges).distance(params.linkDistance))
  .force('charge', forceManyBody().strength(params.chargeStrength))
  .force('collision', forceCollide().radius(params.collisionRadius))
  .alphaDecay(params.alphaDecay)
  .velocityDecay(params.velocityDecay);
```

**Tuning Tips:**
- **Too clustered?** Increase `chargeStrength` (more negative)
- **Too spread out?** Decrease `linkDistance`
- **Nodes overlapping?** Increase `collisionRadius`
- **Simulation not settling?** Decrease `alphaDecay`

## Pan, Zoom & Drag Interactions

### Zoom Behavior

```typescript
import { zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';

function addZoomBehavior(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  const zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4]) // Min and max zoom levels
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoomBehavior);

  // Return zoom control functions
  return {
    zoomIn: () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
    },
    zoomOut: () => {
      svg.transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.3);
    },
    resetZoom: () => {
      svg.transition().duration(500).call(zoomBehavior.transform, zoomIdentity);
    }
  };
}
```

### Exposing Zoom Controls to React

```typescript
function DependencyGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomControlsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
  } | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    const g = svg.append('g');

    // Setup zoom and store controls
    zoomControlsRef.current = addZoomBehavior(svg, g);

    // Render graph...
  }, [data]);

  return (
    <div>
      <div className="zoom-controls">
        <button onClick={() => zoomControlsRef.current?.zoomIn()}>
          Zoom In
        </button>
        <button onClick={() => zoomControlsRef.current?.zoomOut()}>
          Zoom Out
        </button>
        <button onClick={() => zoomControlsRef.current?.resetZoom()}>
          Reset
        </button>
      </div>
      <svg ref={svgRef} />
    </div>
  );
}
```

### Drag Behavior for Nodes

```typescript
import { drag } from 'd3-drag';

function addDragBehavior(
  node: d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>,
  simulation: d3.Simulation<Node, Edge>
) {
  const dragBehavior = drag<SVGCircleElement, Node>()
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
      d.fx = null; // Release fixed position
      d.fy = null;
    });

  node.call(dragBehavior);
}
```

### Combining Pan and Drag

**Problem:** Zoom behavior conflicts with node drag behavior.

**Solution:** Disable zoom drag when dragging nodes.

```typescript
const zoomBehavior = zoom<SVGSVGElement, unknown>()
  .filter((event) => {
    // Disable zoom drag when dragging nodes
    return !event.target.closest('.node');
  })
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
  });
```

## Data Updates & Animations

### Enter-Update-Exit Pattern

```typescript
function updateGraph(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  newData: GraphData
) {
  // Update nodes
  const node = g.selectAll<SVGCircleElement, Node>('circle')
    .data(newData.nodes, d => d.id); // Key function for object constancy

  // EXIT: Remove old nodes
  node.exit()
    .transition()
    .duration(500)
    .attr('r', 0)
    .remove();

  // UPDATE: Update existing nodes
  node
    .transition()
    .duration(500)
    .attr('fill', d => getNodeColor(d.status));

  // ENTER: Add new nodes
  node.enter()
    .append('circle')
    .attr('r', 0)
    .attr('fill', d => getNodeColor(d.status))
    .transition()
    .duration(500)
    .attr('r', 20);
}
```

### React-Triggered Updates

```typescript
function DependencyGraph({ data, highlightNode }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Initial render
  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    renderGraph(svg, data);
  }, [data]);

  // Update highlight (without full re-render)
  useEffect(() => {
    if (!svgRef.current || !highlightNode) return;

    const svg = d3.select(svgRef.current);

    // Remove previous highlight
    svg.selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 2);

    // Add new highlight
    svg.select(`[data-story-id="${highlightNode}"]`)
      .attr('stroke', '#ff0')
      .attr('stroke-width', 4);
  }, [highlightNode]); // Only re-run when highlightNode changes

  return <svg ref={svgRef} />;
}
```

## Export Functionality

### Export as PNG

```typescript
function exportAsPng(svgElement: SVGSVGElement, filename: string = 'graph.png') {
  const canvas = document.createElement('canvas');
  const bbox = svgElement.getBoundingBox();

  canvas.width = bbox.width;
  canvas.height = bbox.height;

  const ctx = canvas.getContext('2d')!;
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
```

### Export as SVG

```typescript
function exportAsSvg(svgElement: SVGSVGElement, filename: string = 'graph.svg') {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
```

### Export as JSON

```typescript
function exportAsJson(data: GraphData, filename: string = 'graph.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
```

### React Integration

```typescript
function DependencyGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleExportPng = () => {
    if (svgRef.current) {
      exportAsPng(svgRef.current);
    }
  };

  const handleExportSvg = () => {
    if (svgRef.current) {
      exportAsSvg(svgRef.current);
    }
  };

  const handleExportJson = () => {
    exportAsJson(data);
  };

  return (
    <div>
      <div className="export-controls">
        <button onClick={handleExportPng} data-testid="export-png">
          Export PNG
        </button>
        <button onClick={handleExportSvg} data-testid="export-svg">
          Export SVG
        </button>
        <button onClick={handleExportJson} data-testid="export-json">
          Export JSON
        </button>
      </div>
      <svg ref={svgRef} />
    </div>
  );
}
```

## Performance Optimization

### Virtualization for Large Graphs

**Problem:** Rendering >200 nodes causes performance issues.

**Solution:** Switch to list view or use canvas rendering.

```typescript
function DependencyGraph({ data }: Props) {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  useEffect(() => {
    // Auto-switch to list view for large graphs
    if (data.nodes.length > 200) {
      setViewMode('list');
    }
  }, [data.nodes.length]);

  if (viewMode === 'list') {
    return <DependencyList data={data} />;
  }

  return <ForceDirectedGraph data={data} />;
}
```

### Throttle Force Simulation Updates

```typescript
import { throttle } from 'lodash-es';

const throttledTick = throttle(() => {
  link.attr('x1', d => d.source.x)...
  node.attr('cx', d => d.x)...
}, 16); // 60fps

simulation.on('tick', throttledTick);
```

### Disable Simulation for Static Graphs

```typescript
// For graphs that don't need force layout
function renderStaticGraph(svg, data, layout: 'hierarchical' | 'circular') {
  const positions = calculateLayout(data, layout);

  const node = svg.selectAll('circle')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('cx', (d, i) => positions[i].x)
    .attr('cy', (d, i) => positions[i].y);

  // No force simulation needed!
}
```

## Accessibility Patterns

### Keyboard Navigation

```typescript
function addKeyboardNavigation(
  node: d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>
) {
  let focusedIndex = 0;
  const nodes = node.nodes();

  d3.select(document).on('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();

      // Move focus
      focusedIndex = (focusedIndex + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length;
      nodes[focusedIndex].focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Activate focused node
      const nodeData = d3.select(nodes[focusedIndex]).datum() as Node;
      handleNodeClick(nodeData);
    }
  });

  // Make nodes focusable
  node.attr('tabindex', 0);
}
```

### ARIA Labels

```typescript
// Add ARIA labels to SVG elements
const node = g.append('g')
  .selectAll('circle')
  .data(data.nodes)
  .enter()
  .append('circle')
  .attr('role', 'button')
  .attr('aria-label', d => `Story ${d.id}: ${d.title}`)
  .attr('tabindex', 0);

// Add title for tooltips
node.append('title')
  .text(d => `${d.title}\nStatus: ${d.status}\nEpic: ${d.epic}`);
```

### Screen Reader Support

```typescript
// Add hidden text description
svg.append('desc')
  .text(`Dependency graph showing ${data.nodes.length} stories and ${data.edges.length} dependencies`);

// Add ARIA live region for updates
const liveRegion = d3.select('body')
  .append('div')
  .attr('role', 'status')
  .attr('aria-live', 'polite')
  .attr('aria-atomic', 'true')
  .style('position', 'absolute')
  .style('left', '-10000px');

// Announce updates
simulation.on('end', () => {
  liveRegion.text('Graph layout complete');
});
```

## Testing D3 Components

### Unit Testing with Vitest

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DependencyGraph from './DependencyGraph';

describe('DependencyGraph', () => {
  const mockData = {
    nodes: [
      { id: '6-1', label: 'Story 6-1', status: 'done' },
      { id: '6-2', label: 'Story 6-2', status: 'in-progress' },
    ],
    edges: [
      { source: '6-1', target: '6-2' }
    ]
  };

  it('should render SVG element', () => {
    const { container } = render(<DependencyGraph data={mockData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render nodes', async () => {
    const { container } = render(<DependencyGraph data={mockData} />);

    // Wait for D3 to render
    await new Promise(resolve => setTimeout(resolve, 100));

    const nodes = container.querySelectorAll('circle');
    expect(nodes).toHaveLength(2);
  });
});
```

### E2E Testing with Playwright

See [E2E Testing Patterns Guide](./e2e-testing-patterns-guide.md) for detailed patterns.

## Common Pitfalls

### ❌ Pitfall 1: Not Cleaning Up Simulations

```typescript
// ❌ Bad: Simulation keeps running after unmount
useEffect(() => {
  const simulation = d3.forceSimulation(nodes);
  // ...
}, [nodes]);

// ✅ Good: Stop simulation on unmount
useEffect(() => {
  const simulation = d3.forceSimulation(nodes);
  return () => {
    simulation.stop();
  };
}, [nodes]);
```

### ❌ Pitfall 2: Recreating Simulation on Every Render

```typescript
// ❌ Bad: Creates new simulation on every render
function BadGraph({ data }) {
  const simulation = d3.forceSimulation(data.nodes); // 💥 New simulation every render!
  // ...
}

// ✅ Good: Use ref to persist simulation
function GoodGraph({ data }) {
  const simulationRef = useRef<d3.Simulation | null>(null);

  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation(data.nodes);
    } else {
      simulationRef.current.nodes(data.nodes);
    }
  }, [data]);
}
```

### ❌ Pitfall 3: Forgetting Key Function

```typescript
// ❌ Bad: No key function (causes wrong nodes to update)
svg.selectAll('circle').data(data.nodes)

// ✅ Good: Use key function for object constancy
svg.selectAll('circle').data(data.nodes, d => d.id)
```

### ❌ Pitfall 4: Mixing Imperative and Declarative

```typescript
// ❌ Bad: Half React, half D3
function BadGraph({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    d3.select(svgRef.current).append('circle'); // D3 manipulation
  }, []);

  return (
    <svg ref={svgRef}>
      <circle /> {/* React rendering - conflicts with D3! */}
    </svg>
  );
}

// ✅ Good: Pick one approach
function GoodGraph({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear first
    svg.selectAll('circle').data(data.nodes).enter().append('circle');
  }, [data]);

  return <svg ref={svgRef} />;
}
```

### ❌ Pitfall 5: Not Handling Window Resize

```typescript
// ✅ Good: Handle resize
function DependencyGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const parent = svgRef.current.parentElement;
        setDimensions({
          width: parent?.clientWidth || 800,
          height: parent?.clientHeight || 600
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    renderGraph(svgRef.current!, data, dimensions.width, dimensions.height);
  }, [data, dimensions]);

  return <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />;
}
```

## Summary

**Key Patterns:**
1. ✅ **useRef + useEffect** - React renders container, D3 owns content
2. ✅ **Cleanup simulations** - Stop on unmount to prevent memory leaks
3. ✅ **Key functions** - Use for enter-update-exit pattern
4. ✅ **Separate concerns** - Don't mix React and D3 rendering
5. ✅ **Performance** - Throttle updates, virtualize large graphs
6. ✅ **Accessibility** - ARIA labels, keyboard navigation, screen reader support
7. ✅ **Testing** - Unit tests for rendering, E2E for interactions

**Performance Metrics from Epic 6:**
- **50 nodes/edges:** Smooth 60fps
- **100 nodes/edges:** 45-60fps
- **200+ nodes:** Auto-switch to list view
- **Pan/Zoom:** No lag with 100 nodes
- **Export:** <2 seconds for PNG (100 nodes)

## Related Documentation

- [ADR-005: D3.js for Dependency Graph Visualization](../adr/adr-005-d3js-dependency-visualization.md)
- [Epic 6 Retrospective](../epics/epic-6-retrospective.md)
- [E2E Testing Patterns Guide](./e2e-testing-patterns-guide.md)
- Implementation: `dashboard/src/components/graph/DependencyGraph.tsx`

---

**Last Updated:** 2025-11-16
**Version:** 1.0
**Maintainer:** Charlie (Developer)
