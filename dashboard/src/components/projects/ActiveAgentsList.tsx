import { User, Clock } from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils';
import { Badge } from '../ui/badge';
import type { AgentActivity } from '../../api/types';

interface ActiveAgentsListProps {
  agents: AgentActivity[];
}

export function ActiveAgentsList({ agents }: ActiveAgentsListProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No active agents at the moment
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Active Agents</h3>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.agentId} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{agent.agentName}</span>
                <Badge
                  variant={
                    agent.status === 'active'
                      ? 'default'
                      : agent.status === 'error'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {agent.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{agent.currentTask}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Started {formatRelativeTime(agent.startTime)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
