import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { EscalationStatus } from '../../api/types';
import { formatRelativeTime } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface EscalationCardProps {
  escalation: EscalationStatus;
  onClick?: () => void;
}

export function EscalationCard({ escalation, onClick }: EscalationCardProps) {
  const isResolved = escalation.status === 'resolved' || escalation.status === 'responded';

  const severityColor = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  const SeverityIcon = isResolved ? CheckCircle2 : escalation.severity === 'critical' || escalation.severity === 'high' ? AlertCircle : Clock;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isResolved ? 'opacity-60 bg-gray-50 dark:bg-gray-900' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon className={`w-5 h-5 mt-0.5 ${isResolved ? 'text-green-500' : 'text-orange-500'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm line-clamp-1">{escalation.title}</h3>
            <Badge className={severityColor[escalation.severity]}>{escalation.severity}</Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {escalation.question}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {isResolved ? (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Resolved {escalation.respondedAt ? formatRelativeTime(escalation.respondedAt) : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Created {formatRelativeTime(escalation.createdAt)}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {escalation.type}
              </Badge>
            </div>

            {escalation.confidenceScore !== undefined && !isResolved && (
              <span className="text-xs">
                Confidence: {Math.round(escalation.confidenceScore * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
