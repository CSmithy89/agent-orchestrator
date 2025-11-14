import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/useToast';
import { useSubmitEscalationResponse } from '../../hooks/useEscalations';
import type { EscalationDetail } from '../../api/types';
import { AlertCircle, Brain, MessageSquare, TrendingUp } from 'lucide-react';

interface EscalationDetailModalProps {
  escalation: EscalationDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EscalationDetailModal({
  escalation,
  open,
  onOpenChange,
}: EscalationDetailModalProps) {
  const [response, setResponse] = useState('');
  const { toast } = useToast();
  const submitResponse = useSubmitEscalationResponse();

  const handleSubmit = async () => {
    if (!escalation || !response.trim()) return;

    try {
      await submitResponse.mutateAsync({
        id: escalation.id,
        response: response.trim(),
      });

      toast({
        title: 'Response submitted successfully',
        description: 'The workflow will resume shortly.',
      });

      setResponse('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to submit response',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  if (!escalation) return null;

  const isResolved = escalation.status === 'resolved' || escalation.status === 'responded';
  const confidencePercent = Math.round(escalation.confidenceScore * 100);
  const confidenceColor =
    confidencePercent >= 70 ? 'text-green-600' : confidencePercent >= 40 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="flex-1">{escalation.title}</DialogTitle>
            <Badge
              className={
                escalation.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : escalation.severity === 'high'
                  ? 'bg-orange-100 text-orange-800'
                  : escalation.severity === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {escalation.severity}
            </Badge>
          </div>
          <DialogDescription>
            {escalation.type} · Project: {escalation.projectId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="w-4 h-4" />
              Question
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{escalation.question}</p>
            </div>
          </div>

          {/* Context Section */}
          {(escalation.context !== undefined && escalation.context !== null) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Context
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {typeof escalation.context === 'string'
                    ? escalation.context
                    : JSON.stringify(escalation.context, null, 2)}
                </p>
              </div>
            </div>
          )}

          {/* AI Attempted Decision */}
          {escalation.attemptedDecision && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Brain className="w-4 h-4" />
                AI's Attempted Decision
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">{escalation.attemptedDecision}</p>
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {escalation.aiReasoning && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Brain className="w-4 h-4" />
                AI Reasoning
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm whitespace-pre-wrap">{escalation.aiReasoning}</p>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                AI Confidence Score
              </div>
              <span className={`text-sm font-semibold ${confidenceColor}`}>
                {confidencePercent}%
              </span>
            </div>
            <Progress value={confidencePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {confidencePercent >= 70
                ? 'High confidence - AI was fairly certain'
                : confidencePercent >= 40
                ? 'Medium confidence - AI had some uncertainty'
                : 'Low confidence - AI needed human guidance'}
            </p>
          </div>

          {/* Existing Response (if already resolved) */}
          {isResolved && escalation.response && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                <MessageSquare className="w-4 h-4" />
                Your Response
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm whitespace-pre-wrap">{escalation.response.response}</p>
              </div>
            </div>
          )}

          {/* Response Input (only for pending escalations) */}
          {!isResolved && (
            <div className="space-y-2">
              <Label htmlFor="response">Your Response</Label>
              <Textarea
                id="response"
                placeholder="Enter your decision or guidance..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide clear guidance to help the workflow proceed. Your response will be used by the AI to make decisions.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isResolved && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!response.trim() || submitResponse.isPending}
            >
              {submitResponse.isPending ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
