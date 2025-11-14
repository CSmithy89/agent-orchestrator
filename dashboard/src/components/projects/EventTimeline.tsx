import { useState } from 'react';
import {
  Circle,
  CheckCircle,
  AlertCircle,
  GitPullRequest,
  GitMerge,
  Play,
  Pause,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import { Button } from '../ui/button';
import type { EventLog, WebSocketEventType } from '../../api/types';

interface EventTimelineProps {
  events: EventLog[];
  maxHeight?: string;
}

const eventIcons: Record<WebSocketEventType, React.ElementType> = {
  'project.phase.changed': Circle,
  'story.status.changed': CheckCircle,
  'escalation.created': AlertCircle,
  'escalation.responded': CheckCircle,
  'orchestrator.started': Play,
  'orchestrator.paused': Pause,
  'orchestrator.resumed': Play,
  'agent.started': Play,
  'agent.completed': CheckCircle,
  'pr.created': GitPullRequest,
  'pr.merged': GitMerge,
  'workflow.error': XCircle,
};

const eventColors: Record<WebSocketEventType, string> = {
  'project.phase.changed': 'text-blue-500',
  'story.status.changed': 'text-green-500',
  'escalation.created': 'text-yellow-500',
  'escalation.responded': 'text-green-500',
  'orchestrator.started': 'text-green-500',
  'orchestrator.paused': 'text-yellow-500',
  'orchestrator.resumed': 'text-green-500',
  'agent.started': 'text-blue-500',
  'agent.completed': 'text-green-500',
  'pr.created': 'text-purple-500',
  'pr.merged': 'text-green-500',
  'workflow.error': 'text-red-500',
};

export function EventTimeline({ events, maxHeight = '400px' }: EventTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No recent events
      </div>
    );
  }

  // Sort events by timestamp (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Recent Events</h3>
      <div className="relative space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        {sortedEvents.map((event, index) => {
          const Icon = eventIcons[event.eventType] || Circle;
          const color = eventColors[event.eventType] || 'text-gray-500';
          const isExpanded = expandedEvents.has(event.id);
          const hasDetails = event.data && Object.keys(event.data).length > 0;

          return (
            <div key={event.id} className="relative flex gap-3 pb-4">
              {/* Timeline connector */}
              {index < sortedEvents.length - 1 && (
                <div className="absolute left-4 top-8 h-full w-0.5 bg-border" aria-hidden="true" />
              )}

              {/* Event icon */}
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-background ${color}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.description}</p>
                    {event.agentId && (
                      <p className="text-xs text-muted-foreground mt-0.5">Agent: {event.agentId}</p>
                    )}
                    {event.workflowStep && (
                      <p className="text-xs text-muted-foreground">Step: {event.workflowStep}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(event.timestamp)}
                  </span>
                </div>

                {/* Expandable details */}
                {hasDetails && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => toggleEventExpanded(event.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Hide details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Show details
                        </>
                      )}
                    </Button>
                    {isExpanded && (
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
