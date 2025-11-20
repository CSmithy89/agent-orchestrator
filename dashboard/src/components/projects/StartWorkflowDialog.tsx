import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { orchestratorsApi } from '../../api/orchestrators';
import { useToast } from '../../hooks/useToast';

interface StartWorkflowDialogProps {
  projectId: string;
  currentPhase: string;
  onWorkflowStarted?: () => void;
}

// Workflow configuration mapping phase to workflows with their paths
const workflowConfig: Record<
  string,
  {
    name: string;
    path: string;
    description: string;
  }[]
> = {
  analysis: [
    {
      name: 'Product Brief',
      path: 'bmad/bmm/workflows/1-analysis/product-brief',
      description: 'Create initial product vision and requirements',
    },
    {
      name: 'Domain Research',
      path: 'bmad/bmm/workflows/1-analysis/domain-research',
      description: 'Research domain, market, and competitive landscape',
    },
    {
      name: 'Brainstorm Project',
      path: 'bmad/bmm/workflows/1-analysis/brainstorm-project',
      description: 'Collaborative brainstorming for project ideas',
    },
    {
      name: 'Research',
      path: 'bmad/bmm/workflows/1-analysis/research',
      description: 'Deep research on technical or market topics',
    },
  ],
  planning: [
    {
      name: 'PRD',
      path: 'bmad/bmm/workflows/2-plan-workflows/prd',
      description: 'Create Product Requirements Document',
    },
    {
      name: 'Technical Specification',
      path: 'bmad/bmm/workflows/2-plan-workflows/tech-spec',
      description: 'Define technical architecture and specifications',
    },
    {
      name: 'UX Design',
      path: 'bmad/bmm/workflows/2-plan-workflows/create-ux-design',
      description: 'Design user experience and interface',
    },
    {
      name: 'Narrative',
      path: 'bmad/bmm/workflows/2-plan-workflows/narrative',
      description: 'Create narrative design for story-driven projects',
    },
  ],
  solutioning: [
    {
      name: 'Architecture',
      path: 'bmad/bmm/workflows/3-solutioning/architecture',
      description: 'Define system architecture and technical decisions',
    },
    {
      name: 'Solutioning Gate Check',
      path: 'bmad/bmm/workflows/3-solutioning/solutioning-gate-check',
      description: 'Validate completeness before implementation',
    },
  ],
  implementation: [
    {
      name: 'Sprint Planning',
      path: 'bmad/bmm/workflows/4-implementation/sprint-planning',
      description: 'Plan sprint and story priorities',
    },
    {
      name: 'Create Story',
      path: 'bmad/bmm/workflows/4-implementation/create-story',
      description: 'Create a new user story',
    },
    {
      name: 'Story Context',
      path: 'bmad/bmm/workflows/4-implementation/story-context',
      description: 'Gather context for story implementation',
    },
    {
      name: 'Dev Story',
      path: 'bmad/bmm/workflows/4-implementation/dev-story',
      description: 'Implement story tasks and subtasks',
    },
    {
      name: 'Code Review',
      path: 'bmad/bmm/workflows/4-implementation/code-review',
      description: 'Review completed story code',
    },
    {
      name: 'Story Done',
      path: 'bmad/bmm/workflows/4-implementation/story-done',
      description: 'Mark story as complete and advance queue',
    },
  ],
};

export function StartWorkflowDialog({
  projectId,
  currentPhase,
  onWorkflowStarted,
}: StartWorkflowDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);

  const availableWorkflows = workflowConfig[currentPhase] || [];

  const handleStartWorkflow = async () => {
    if (!selectedWorkflow) {
      toast({
        title: 'No Workflow Selected',
        description: 'Please select a workflow to start',
        variant: 'destructive',
      });
      return;
    }

    setIsStarting(true);
    try {
      await orchestratorsApi.start(projectId, { workflowPath: selectedWorkflow });
      toast({
        title: 'Workflow Started',
        description: 'The workflow has been started successfully',
      });
      setOpen(false);
      setSelectedWorkflow('');
      onWorkflowStarted?.();
    } catch (error) {
      toast({
        title: 'Error Starting Workflow',
        description: error instanceof Error ? error.message : 'Failed to start workflow',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const selectedWorkflowDetails = availableWorkflows.find(w => w.path === selectedWorkflow);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Play className="h-4 w-4" />
          Start Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Workflow</DialogTitle>
          <DialogDescription>
            Select a workflow to start for the {currentPhase} phase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="workflow-select" className="text-sm font-medium">
              Workflow
            </label>
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger id="workflow-select">
                <SelectValue placeholder="Select a workflow..." />
              </SelectTrigger>
              <SelectContent>
                {availableWorkflows.map((workflow) => (
                  <SelectItem key={workflow.path} value={workflow.path}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedWorkflowDetails && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {selectedWorkflowDetails.description}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartWorkflow}
            disabled={!selectedWorkflow || isStarting}
            className="gap-2"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Workflow
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
