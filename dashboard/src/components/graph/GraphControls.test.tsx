/**
 * GraphControls Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import { GraphControls } from './GraphControls';
import { Toaster } from '@/components/ui/toaster';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,mock')),
  toSvg: vi.fn(() => Promise.resolve('data:image/svg+xml;base64,mock')),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('GraphControls', () => {
  const mockGraphRef = { current: document.createElement('div') };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithToaster = (ui: React.ReactElement) => {
    return render(
      <>
        {ui}
        <Toaster />
      </>
    );
  };

  it('should render all control buttons', () => {
    renderWithToaster(
      <GraphControls
        graphRef={mockGraphRef}
        projectId="project-1"
      />
    );

    expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset zoom')).toBeInTheDocument();
    expect(screen.getByTitle('Export as PNG')).toBeInTheDocument();
    expect(screen.getByTitle('Export as SVG')).toBeInTheDocument();
    expect(screen.getByTitle('Copy shareable link')).toBeInTheDocument();
  });

  it('should call onZoomIn when zoom in button is clicked', async () => {
    const user = userEvent.setup();
    const onZoomIn = vi.fn();

    renderWithToaster(
      <GraphControls
        graphRef={mockGraphRef}
        onZoomIn={onZoomIn}
      />
    );

    await user.click(screen.getByTitle('Zoom in'));
    expect(onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('should call onZoomOut when zoom out button is clicked', async () => {
    const user = userEvent.setup();
    const onZoomOut = vi.fn();

    renderWithToaster(
      <GraphControls
        graphRef={mockGraphRef}
        onZoomOut={onZoomOut}
      />
    );

    await user.click(screen.getByTitle('Zoom out'));
    expect(onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('should call onResetZoom when reset button is clicked', async () => {
    const user = userEvent.setup();
    const onResetZoom = vi.fn();

    renderWithToaster(
      <GraphControls
        graphRef={mockGraphRef}
        onResetZoom={onResetZoom}
      />
    );

    await user.click(screen.getByTitle('Reset zoom'));
    expect(onResetZoom).toHaveBeenCalledTimes(1);
  });

  it('should disable zoom buttons when callbacks not provided', () => {
    renderWithToaster(<GraphControls graphRef={mockGraphRef} />);

    expect(screen.getByTitle('Zoom in')).toBeDisabled();
    expect(screen.getByTitle('Zoom out')).toBeDisabled();
    expect(screen.getByTitle('Reset zoom')).toBeDisabled();
  });

  it('should not show copy link button without projectId', () => {
    renderWithToaster(<GraphControls graphRef={mockGraphRef} />);

    expect(screen.queryByTitle('Copy shareable link')).not.toBeInTheDocument();
  });

  it('should show copy link button with projectId', () => {
    renderWithToaster(
      <GraphControls
        graphRef={mockGraphRef}
        projectId="project-1"
      />
    );

    expect(screen.getByTitle('Copy shareable link')).toBeInTheDocument();
  });
});
