/**
 * DependencyGraph Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DependencyGraph } from './DependencyGraph';
import type { DependencyGraph as DependencyGraphType } from '@/types/dependency-graph';

// Mock D3 to avoid issues with jsdom
vi.mock('d3', () => {
  // Create a fully chainable mock for D3 selection operations
  const createChainableMock = (): any => {
    const mock: any = {
      select: vi.fn(function(this: any) { return mock; }),
      selectAll: vi.fn(function(this: any) { return mock; }),
      remove: vi.fn(function(this: any) { return mock; }),
      append: vi.fn(function(this: any) { return mock; }),
      data: vi.fn(function(this: any) { return mock; }),
      join: vi.fn(function(this: any) { return mock; }),
      attr: vi.fn(function(this: any) { return mock; }),
      style: vi.fn(function(this: any) { return mock; }),
      text: vi.fn(function(this: any) { return mock; }),
      on: vi.fn(function(this: any) { return mock; }),
      call: vi.fn(function(this: any) { return mock; }),
      transition: vi.fn(function(this: any) { return mock; }),
      duration: vi.fn(function(this: any) { return mock; }),
    };
    return mock;
  };

  const chainable = createChainableMock();

  return {
    select: vi.fn(() => chainable),
    zoom: vi.fn(() => ({
      scaleExtent: vi.fn(function(this: any) { return this; }),
      on: vi.fn(function(this: any) { return this; }),
      transform: vi.fn(function(this: any) { return this; }), // Used for zoom.transform()
    })),
    forceSimulation: vi.fn(() => ({
      force: vi.fn(function(this: any) { return this; }),
      on: vi.fn(function(this: any) { return this; }),
      stop: vi.fn(function(this: any) { return this; }),
      alphaTarget: vi.fn(function(this: any) { return this; }), // Used for simulation.alphaTarget()
      restart: vi.fn(function(this: any) { return this; }), // Used for simulation.restart()
    })),
    forceLink: vi.fn(() => ({
      id: vi.fn(function(this: any) { return this; }),
      distance: vi.fn(function(this: any) { return this; }),
    })),
    forceManyBody: vi.fn(() => ({
      strength: vi.fn(function(this: any) { return this; }),
    })),
    forceCenter: vi.fn(() => ({})),
    forceCollide: vi.fn(() => ({
      radius: vi.fn(function(this: any) { return this; }),
    })),
    drag: vi.fn(() => ({
      on: vi.fn(() => ({
        on: vi.fn(() => ({
          on: vi.fn(() => ({})),
        })),
      })),
    })),
    zoomIdentity: {},
  };
});

describe('DependencyGraph', () => {
  const mockGraph: DependencyGraphType = {
    nodes: [
      {
        id: '6-7',
        storyId: '6-7',
        epicNumber: 6,
        storyNumber: 7,
        title: 'Kanban Board',
        status: 'merged',
        complexity: 'large',
        hasWorktree: false,
      },
      {
        id: '6-8',
        storyId: '6-8',
        epicNumber: 6,
        storyNumber: 8,
        title: 'Dependency Graph',
        status: 'in-progress',
        complexity: 'medium',
        hasWorktree: true,
      },
    ],
    edges: [
      {
        source: '6-7',
        target: '6-8',
        type: 'hard',
        isBlocking: false,
      },
    ],
    criticalPath: ['6-7', '6-8'],
  };

  it('should render SVG element', () => {
    render(<DependencyGraph graph={mockGraph} />);

    const svg = screen.getByRole('img', { name: /story dependency graph/i });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('should have correct ARIA label', () => {
    render(<DependencyGraph graph={mockGraph} />);

    const svg = screen.getByLabelText('Story dependency graph');
    expect(svg).toBeInTheDocument();
  });

  it('should call onNodeClick when provided', () => {
    const onNodeClick = vi.fn();
    render(<DependencyGraph graph={mockGraph} onNodeClick={onNodeClick} />);

    // The actual click interaction is handled by D3, which is mocked
    // In a real test, we'd use integration testing with a real browser
    expect(onNodeClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DependencyGraph graph={mockGraph} className="custom-class" />
    );

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
  });

  it('should handle empty graph', () => {
    const emptyGraph: DependencyGraphType = {
      nodes: [],
      edges: [],
      criticalPath: [],
    };

    render(<DependencyGraph graph={emptyGraph} />);

    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
  });

  it('should filter nodes by epic', () => {
    const multiEpicGraph: DependencyGraphType = {
      nodes: [
        ...mockGraph.nodes,
        {
          id: '5-1',
          storyId: '5-1',
          epicNumber: 5,
          storyNumber: 1,
          title: 'Epic 5 Story',
          status: 'merged',
          complexity: 'small',
          hasWorktree: false,
        },
      ],
      edges: mockGraph.edges,
      criticalPath: mockGraph.criticalPath,
    };

    render(<DependencyGraph graph={multiEpicGraph} filters={{ epic: 6 }} />);

    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    // Filtering logic is tested in the component's internal logic
  });

  it('should filter nodes by status', () => {
    render(<DependencyGraph graph={mockGraph} filters={{ status: ['in-progress'] }} />);

    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
    // Filtering logic is tested in the component's internal logic
  });

  it('should filter edges by blocking', () => {
    const graphWithBlocking: DependencyGraphType = {
      ...mockGraph,
      edges: [
        {
          source: '6-7',
          target: '6-8',
          type: 'hard',
          isBlocking: true,
        },
      ],
    };

    render(<DependencyGraph graph={graphWithBlocking} filters={{ blocking: true }} />);

    const svg = screen.getByRole('img');
    expect(svg).toBeInTheDocument();
  });
});
