import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export function Dashboard() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws/status-updates';
  const { isConnected, events } = useWebSocket(wsUrl);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Agent Orchestrator Dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionStatus isConnected={isConnected} />
            <p className="mt-4 text-sm text-muted-foreground">
              WebSocket connection to orchestrator backend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest WebSocket events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-muted-foreground">
              Events received this session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              View projects, escalations, and stories from the sidebar
            </p>
          </CardContent>
        </Card>
      </div>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Event Stream</CardTitle>
            <CardDescription>Real-time events from the orchestrator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.slice(-10).reverse().map((event, i) => (
                <div key={i} className="p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{event.eventType}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Project: {event.projectId}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
