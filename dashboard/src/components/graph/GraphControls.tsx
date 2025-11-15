/**
 * GraphControls Component
 *
 * Control buttons for graph zoom, reset, and export functionality.
 */

import { ZoomIn, ZoomOut, Maximize2, Download, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { toPng, toSvg } from 'html-to-image';

interface GraphControlsProps {
  /** Callback to zoom in */
  onZoomIn?: () => void;

  /** Callback to zoom out */
  onZoomOut?: () => void;

  /** Callback to reset zoom */
  onResetZoom?: () => void;

  /** Reference to the graph container for export */
  graphRef: React.RefObject<HTMLDivElement>;

  /** Project ID for shareable link */
  projectId?: string;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  graphRef,
  projectId,
}: GraphControlsProps) {
  const { toast } = useToast();

  const handleExportPNG = async () => {
    if (!graphRef.current) return;

    try {
      const dataUrl = await toPng(graphRef.current, {
        quality: 1.0,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `dependency-graph-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: 'Export successful',
        description: 'Dependency graph exported as PNG',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export graph as PNG',
        variant: 'destructive',
      });
    }
  };

  const handleExportSVG = async () => {
    if (!graphRef.current) return;

    try {
      const dataUrl = await toSvg(graphRef.current, {
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `dependency-graph-${Date.now()}.svg`;
      link.href = dataUrl;
      link.click();

      toast({
        title: 'Export successful',
        description: 'Dependency graph exported as SVG',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export graph as SVG',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async () => {
    if (!projectId) return;

    const url = `${window.location.origin}/projects/${projectId}/dependencies`;

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Shareable link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onZoomIn}
        title="Zoom in"
        disabled={!onZoomIn}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onZoomOut}
        title="Zoom out"
        disabled={!onZoomOut}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onResetZoom}
        title="Reset zoom"
        disabled={!onResetZoom}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPNG}
        title="Export as PNG"
      >
        <Download className="h-4 w-4 mr-2" />
        PNG
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleExportSVG}
        title="Export as SVG"
      >
        <Download className="h-4 w-4 mr-2" />
        SVG
      </Button>

      {projectId && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          title="Copy shareable link"
        >
          <Link2 className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
      )}
    </div>
  );
}
