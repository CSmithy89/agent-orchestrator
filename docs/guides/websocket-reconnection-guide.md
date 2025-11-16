# WebSocket Reconnection Strategy Guide

**Author:** Bob (Scrum Master)
**Date:** 2025-11-16
**Status:** Active
**Related ADR:** [ADR-004: WebSocket for Real-Time Dashboard Updates](../adr/adr-004-websocket-real-time-updates.md)

## Overview

This guide documents the WebSocket reconnection strategy for the Agent Orchestrator dashboard's real-time updates system. The implementation ensures reliable, fault-tolerant connections with automatic recovery from network failures, server restarts, and client disconnections.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Exponential Backoff Algorithm](#exponential-backoff-algorithm)
3. [Connection Lifecycle](#connection-lifecycle)
4. [Heartbeat Mechanism](#heartbeat-mechanism)
5. [Error Handling](#error-handling)
6. [Edge Cases and Solutions](#edge-cases-and-solutions)
7. [Integration with TanStack Query](#integration-with-tanstack-query)
8. [Best Practices](#best-practices)
9. [Monitoring and Debugging](#monitoring-and-debugging)

## Architecture Overview

### Components

**Backend (`backend/src/api/routes/websocket.ts`)**
- WebSocket server using `ws` library
- JWT authentication during handshake
- Heartbeat ping/pong mechanism (30s interval)
- Connection state management
- Per-project event subscription model

**Frontend (`dashboard/src/hooks/useWebSocket.ts`)**
- React hook for WebSocket connections
- Automatic reconnection with exponential backoff
- Event subscription system
- Connection status tracking

### Connection Flow

```
┌─────────┐                    ┌─────────┐
│ Client  │                    │ Server  │
└────┬────┘                    └────┬────┘
     │                              │
     │ 1. Connect with JWT          │
     ├─────────────────────────────>│
     │                              │
     │ 2. Authenticate              │
     │                              │
     │ 3. Connection Accepted       │
     │<─────────────────────────────┤
     │                              │
     │ 4. Subscribe to Projects     │
     ├─────────────────────────────>│
     │                              │
     │ 5. Receive Events            │
     │<─────────────────────────────┤
     │                              │
     │ 6. Ping (every 30s)          │
     │<─────────────────────────────┤
     │                              │
     │ 7. Pong                      │
     ├─────────────────────────────>│
     │                              │
     │ 8. Connection Lost           │
     │      (network failure)       │
     │                              │
     │ 9. Auto-reconnect            │
     │    (exponential backoff)     │
     ├─────────────────────────────>│
     │                              │
```

## Exponential Backoff Algorithm

### Strategy

The client implements an **exponential backoff with jitter** strategy to avoid thundering herd problems when reconnecting.

### Implementation

```typescript
// dashboard/src/hooks/useWebSocket.ts:30-35
const getReconnectDelay = useCallback(() => {
  const baseDelay = 1000;        // 1 second
  const maxDelay = 16000;        // 16 seconds
  const delay = Math.min(
    baseDelay * Math.pow(2, reconnectAttemptsRef.current),
    maxDelay
  );
  return delay;
}, []);
```

### Backoff Schedule

| Attempt | Delay (ms) | Delay (seconds) | Total Wait Time |
|---------|-----------|-----------------|-----------------|
| 1       | 1,000     | 1s              | 1s              |
| 2       | 2,000     | 2s              | 3s              |
| 3       | 4,000     | 4s              | 7s              |
| 4       | 8,000     | 8s              | 15s             |
| 5       | 16,000    | 16s             | 31s             |
| 6       | 16,000    | 16s (capped)    | 47s             |
| 7       | 16,000    | 16s (capped)    | 63s             |
| 8       | 16,000    | 16s (capped)    | 79s             |
| 9       | 16,000    | 16s (capped)    | 95s             |
| 10      | 16,000    | 16s (capped)    | 111s            |

**After 10 attempts (default), reconnection stops.**

### Configuration

```typescript
// Configurable via hook options
useWebSocket(url, {
  reconnect: true,              // Enable/disable reconnection
  maxReconnectAttempts: 10      // Maximum attempts before giving up
});
```

### Why Exponential Backoff?

1. **Reduces server load**: Prevents all clients from reconnecting simultaneously
2. **Graceful degradation**: Gives server time to recover from overload
3. **Network-friendly**: Reduces unnecessary traffic during prolonged outages
4. **User experience**: Quick reconnection for transient issues, graceful handling of persistent ones

## Connection Lifecycle

### 1. Initial Connection

```typescript
// Connection initiated when hook mounts
useEffect(() => {
  if (enabled) {
    connect();
  }
  return () => {
    disconnect();
  };
}, [enabled, connect, disconnect]);
```

**Steps:**
1. Client retrieves JWT token from `localStorage`
2. Client initiates WebSocket connection to `ws://server/ws/status-updates`
3. Server validates JWT token during handshake
4. Server sends `connected` event with `clientId`
5. Client sends `subscribe` messages for projects
6. Server confirms subscriptions

### 2. Active Connection

**Client Responsibilities:**
- Respond to server pings with pongs (automatic in browser WebSocket)
- Send subscription/unsubscription messages
- Process incoming events
- Notify event subscribers

**Server Responsibilities:**
- Send ping every 30 seconds to detect dead connections
- Broadcast events to subscribed clients
- Process subscription requests
- Clean up on disconnect

### 3. Disconnection Detection

**Server-side (Heartbeat):**
```typescript
// backend/src/api/routes/websocket.ts:292-308
private startHeartbeat(): void {
  this.pingInterval = setInterval(() => {
    this.wss.clients.forEach((ws) => {
      const client = ws as ExtendedWebSocket;

      if (!client.isAlive) {
        console.log(`Terminating dead connection: ${client.id}`);
        return client.terminate();
      }

      client.isAlive = false;
      client.ping();
    });
  }, this.config.pingInterval); // Default: 30000ms
}
```

**Client-side (Event Listeners):**
- `onerror`: Network errors, authentication failures
- `onclose`: Connection closed by server or network
- `readyState`: Monitors connection state

### 4. Reconnection Process

```typescript
// dashboard/src/hooks/useWebSocket.ts:90-107
ws.onclose = () => {
  console.log('[WebSocket] Disconnected');
  setConnectionStatus('disconnected');
  wsRef.current = null;

  // Attempt reconnection with exponential backoff
  if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
    const delay = getReconnectDelay();
    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  }
};
```

**Steps:**
1. Connection closes (network failure, server restart, etc.)
2. Client detects `onclose` event
3. Client waits for exponential backoff delay
4. Client attempts reconnection
5. If successful, reset `reconnectAttemptsRef` to 0
6. If failed, increment attempt counter and retry
7. After max attempts, stop reconnecting (user intervention required)

### 5. Successful Reconnection

```typescript
// dashboard/src/hooks/useWebSocket.ts:55-59
ws.onopen = () => {
  console.log('[WebSocket] Connected');
  setConnectionStatus('connected');
  reconnectAttemptsRef.current = 0; // Reset reconnect attempts
};
```

**Automatic Recovery:**
- Reconnect attempts counter reset to 0
- Connection status updated to `connected`
- Client **must re-subscribe** to projects (subscriptions are not persisted)
- TanStack Query cache invalidation triggers (see Integration section)

## Heartbeat Mechanism

### Purpose

The heartbeat (ping/pong) mechanism detects **dead connections** that appear open but are actually broken (e.g., network cable unplugged, server crashed).

### Server Implementation

```typescript
// Send ping every 30 seconds
pingInterval: 30000

// Mark client as dead if no pong received
if (!client.isAlive) {
  console.log(`Terminating dead connection: ${client.id}`);
  return client.terminate();
}

client.isAlive = false;
client.ping();
```

### Client Implementation

Browser WebSocket automatically responds to pings with pongs. The server marks the client as alive when it receives a pong:

```typescript
// backend/src/api/routes/websocket.ts:158-160
client.on('pong', () => {
  client.isAlive = true;
});
```

### Timeout Behavior

- **Ping interval:** 30 seconds
- **Dead connection timeout:** 60 seconds (2 missed pongs)

If the server doesn't receive a pong within 60 seconds:
1. Server terminates the connection
2. Client detects `onclose` event
3. Reconnection process begins

## Error Handling

### Authentication Failures

**Scenario:** JWT token is invalid or expired

```typescript
// Server sends error and closes connection
if (!authResult.authenticated) {
  const errorMsg: ErrorMessage = {
    error: 'Authentication failed',
    message: authResult.error || 'Unauthorized'
  };
  ws.send(JSON.stringify(errorMsg));
  ws.close(1008, 'Authentication failed');
  return;
}
```

**Client Behavior:**
- Receives error message
- Connection closes with code `1008`
- Reconnection **will fail** until new token is obtained
- **Action required:** Redirect user to login page

### Network Errors

**Scenario:** DNS failure, server unreachable, firewall blocking

```typescript
ws.onerror = (error) => {
  console.error('[WebSocket] Error:', error);
  setConnectionStatus('error');
};
```

**Client Behavior:**
- Connection status set to `error`
- `onclose` event fires immediately after
- Reconnection process begins (exponential backoff)

### Server Restart

**Scenario:** Server goes down for maintenance or crashes

**Client Behavior:**
1. Heartbeat pongs stop arriving (within 60s)
2. Server terminates dead connection (or connection times out)
3. Client detects `onclose` event
4. Reconnection attempts begin
5. Client reconnects once server is back online
6. Client re-subscribes to projects

### Message Parse Errors

**Scenario:** Invalid JSON received from server

```typescript
try {
  const data: WebSocketEvent = JSON.parse(event.data);
  // Process event...
} catch (error) {
  console.error('[WebSocket] Failed to parse message:', error);
}
```

**Client Behavior:**
- Log error to console
- **Do not close connection** (single bad message shouldn't disconnect)
- Continue processing subsequent messages

## Edge Cases and Solutions

### 1. Thundering Herd Problem

**Problem:** When server restarts, all clients reconnect simultaneously, overwhelming the server.

**Solution:**
- Exponential backoff spreads reconnection attempts over time
- Maximum delay of 16 seconds prevents indefinite waiting
- Each client has independent backoff schedule (no synchronization)

**Future Enhancement:** Add jitter (random variance) to backoff delay:
```typescript
const jitter = Math.random() * 0.3; // ±30% variance
const delay = baseDelay * Math.pow(2, attempts) * (1 + jitter);
```

### 2. Tab Backgrounding (Mobile Safari)

**Problem:** iOS Safari suspends WebSocket connections when tab is backgrounded.

**Solution:**
- Browser fires `onclose` event when tab is foregrounded
- Reconnection process begins automatically
- User sees brief "reconnecting" state

**Monitoring:** Track `visibilitychange` events to differentiate tab backgrounding from network failures.

### 3. Stale Subscriptions After Reconnect

**Problem:** Client reconnects but doesn't re-subscribe to projects, missing events.

**Solution (Current):**
- Client state is **not persisted** across reconnections
- Application layer must re-subscribe after reconnection

**Recommended Pattern:**
```typescript
const { connectionStatus, subscribe } = useWebSocket(url);

useEffect(() => {
  if (connectionStatus === 'connected' && projectId) {
    // Re-subscribe when connection is re-established
    const unsubscribe = subscribe(projectId, handleEvent);
    return unsubscribe;
  }
}, [connectionStatus, projectId, subscribe]);
```

**Future Enhancement:** Auto-restore subscriptions on reconnect:
```typescript
// Store subscriptions in ref
const subscriptionsRef = useRef<Set<string>>(new Set());

// Re-subscribe on reconnect
ws.onopen = () => {
  subscriptionsRef.current.forEach(projectId => {
    ws.send(JSON.stringify({ action: 'subscribe', projectId }));
  });
};
```

### 4. Connection Timeout During Reconnect

**Problem:** Network is very slow, connection takes >10 seconds to establish.

**Current Behavior:**
- Browser WebSocket has default timeout (~30-60 seconds)
- If timeout occurs, `onerror` and `onclose` fire
- Reconnection attempt counted and next backoff scheduled

**Future Enhancement:** Add configurable connection timeout:
```typescript
const connectionTimeoutRef = useRef<NodeJS.Timeout>();

const connect = () => {
  const ws = new WebSocket(url);

  // Set timeout for connection establishment
  connectionTimeoutRef.current = setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      ws.close();
    }
  }, 10000); // 10 second timeout

  ws.onopen = () => {
    clearTimeout(connectionTimeoutRef.current);
    // ...
  };
};
```

### 5. Multiple Tabs/Windows

**Problem:** User has multiple dashboard tabs open, each with its own WebSocket connection.

**Current Behavior:**
- Each tab maintains independent connection
- Server handles multiple connections per user
- Each connection consumes ~2KB server memory

**Considerations:**
- Not a problem for <100 concurrent users
- For high-scale deployments, consider shared worker or broadcast channel

**Future Enhancement:** Use Shared Worker for single WebSocket connection shared across tabs:
```typescript
// Single WebSocket in shared worker
// Tabs communicate via postMessage
// Reduces server load and improves consistency
```

### 6. Max Reconnect Attempts Reached

**Problem:** After 10 failed reconnection attempts (~111 seconds), client gives up.

**Current Behavior:**
- Reconnection stops
- Connection status remains `disconnected`
- User must manually refresh page

**Recommended UX:**
```tsx
{connectionStatus === 'disconnected' && reconnectAttempts >= maxReconnectAttempts && (
  <Banner variant="error">
    Connection lost. Please check your internet and{' '}
    <button onClick={() => window.location.reload()}>refresh the page</button>.
  </Banner>
)}
```

**Future Enhancement:** Allow manual retry without page refresh:
```typescript
const retry = () => {
  reconnectAttemptsRef.current = 0;
  connect();
};
```

## Integration with TanStack Query

### Cache Invalidation on WebSocket Events

The WebSocket system integrates with TanStack Query to automatically update cached data when events are received.

**Pattern:**
```typescript
// In component or global hook
const queryClient = useQueryClient();
const { subscribe } = useWebSocket(WS_URL);

useEffect(() => {
  const unsubscribe = subscribe('*', (event: WebSocketEvent) => {
    // Invalidate relevant queries based on event type
    switch (event.eventType) {
      case 'project.updated':
        queryClient.invalidateQueries(['projects', event.projectId]);
        break;

      case 'story.status.changed':
        queryClient.invalidateQueries(['stories', event.projectId]);
        queryClient.invalidateQueries(['project', event.projectId]); // Update counts
        break;

      case 'escalation.created':
        queryClient.invalidateQueries(['escalations', event.projectId]);
        break;

      // ... other event types
    }
  });

  return unsubscribe;
}, [subscribe, queryClient]);
```

### Optimistic Updates

For user-initiated actions, use optimistic updates with rollback on error:

```typescript
const updateStoryMutation = useMutation({
  mutationFn: updateStory,
  onMutate: async (newStory) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['story', newStory.id]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['story', newStory.id]);

    // Optimistically update
    queryClient.setQueryData(['story', newStory.id], newStory);

    return { previous };
  },
  onError: (err, newStory, context) => {
    // Rollback on error
    queryClient.setQueryData(['story', newStory.id], context.previous);
  },
  onSettled: (newStory) => {
    // Refetch after mutation (WebSocket event will also trigger this)
    queryClient.invalidateQueries(['story', newStory.id]);
  }
});
```

### Reconnection and Cache Staleness

**Problem:** During disconnection, cached data may become stale.

**Solution:** Invalidate all queries on reconnection:

```typescript
useEffect(() => {
  if (connectionStatus === 'connected' && wasDisconnected.current) {
    // Refetch all active queries when reconnecting
    queryClient.invalidateQueries({ type: 'active' });
    wasDisconnected.current = false;
  }

  if (connectionStatus === 'disconnected') {
    wasDisconnected.current = true;
  }
}, [connectionStatus, queryClient]);
```

## Best Practices

### 1. Always Handle Reconnection in UI

Display connection status to users:

```tsx
function ConnectionStatus() {
  const { connectionStatus } = useWebSocket(WS_URL);

  return (
    <div className="connection-status">
      {connectionStatus === 'connecting' && (
        <Badge variant="warning">Connecting...</Badge>
      )}
      {connectionStatus === 'disconnected' && (
        <Badge variant="error">Disconnected - Reconnecting...</Badge>
      )}
      {connectionStatus === 'error' && (
        <Badge variant="error">Connection Error</Badge>
      )}
    </div>
  );
}
```

### 2. Re-subscribe After Reconnect

Always re-establish subscriptions when connection is restored:

```typescript
useEffect(() => {
  if (isConnected && projectId) {
    return subscribe(projectId, handleEvent);
  }
}, [isConnected, projectId, subscribe]);
```

### 3. Invalidate Cache on Reconnect

Ensure data freshness after reconnection:

```typescript
useEffect(() => {
  if (previousStatus === 'disconnected' && connectionStatus === 'connected') {
    queryClient.invalidateQueries({ type: 'active' });
  }
}, [connectionStatus, previousStatus, queryClient]);
```

### 4. Log Reconnection Metrics

Track reconnection events for monitoring:

```typescript
ws.onopen = () => {
  if (reconnectAttemptsRef.current > 0) {
    analytics.track('websocket_reconnected', {
      attempts: reconnectAttemptsRef.current,
      duration: Date.now() - disconnectTimestamp
    });
  }
};
```

### 5. Test Reconnection Scenarios

**Manual Testing:**
1. Disable network in DevTools → observe reconnection
2. Restart server → verify client reconnects
3. Expire JWT token → verify auth error handling
4. Background tab (mobile) → verify reconnection on foreground

**Automated Testing:**
```typescript
describe('WebSocket Reconnection', () => {
  it('should reconnect with exponential backoff', async () => {
    const { result } = renderHook(() => useWebSocket(url));

    // Simulate disconnect
    mockServer.close();
    await waitFor(() => expect(result.current.connectionStatus).toBe('disconnected'));

    // Verify reconnection attempt
    mockServer.open();
    await waitFor(() => expect(result.current.connectionStatus).toBe('connected'), {
      timeout: 5000
    });
  });
});
```

### 6. Monitor Connection Health

Track key metrics in production:
- Connection count per server instance
- Reconnection rate (reconnections/hour)
- Average reconnection delay
- Failed reconnection attempts
- Heartbeat failure rate

## Monitoring and Debugging

### Server-Side Logging

```typescript
// backend/src/api/routes/websocket.ts
console.log(`WebSocket client connected: ${client.id} (user: ${client.userId})`);
console.log(`Client ${client.id} subscribed to project ${projectId}`);
console.log(`Terminating dead connection: ${client.id}`);
console.log(`WebSocket client disconnected: ${client.id}`);
```

**Recommended Enhancements:**
- Structured logging (JSON format)
- Log levels (debug, info, warn, error)
- Connection duration tracking
- Subscription count per client

### Client-Side Logging

```typescript
// dashboard/src/hooks/useWebSocket.ts
console.log('[WebSocket] Connected');
console.log('[WebSocket] Event received:', data);
console.log('[WebSocket] Disconnected');
console.log(`[WebSocket] Reconnecting in ${delay}ms`);
console.error('[WebSocket] Error:', error);
console.error('[WebSocket] Failed to parse message:', error);
```

**Production Logging:**
- Send errors to error tracking service (Sentry, Rollbar)
- Track reconnection metrics to analytics
- Monitor connection quality (latency, dropped events)

### Browser DevTools

**Network Tab:**
- Filter by "WS" to see WebSocket connections
- View frames (messages sent/received)
- Check connection status and close codes

**Console:**
- All WebSocket logs prefixed with `[WebSocket]`
- Filter by `WebSocket` to isolate logs

**Performance Tab:**
- Record session to see connection timings
- Identify reconnection delays
- Measure event processing time

### Server Metrics

**Recommended Metrics (Prometheus/Grafana):**
```typescript
// Connection metrics
websocket_connections_total{status="connected"}
websocket_connections_total{status="disconnected"}
websocket_reconnections_total

// Performance metrics
websocket_message_duration_seconds
websocket_event_broadcast_duration_seconds

// Health metrics
websocket_heartbeat_failures_total
websocket_auth_failures_total
```

## Summary

The WebSocket reconnection strategy provides:

✅ **Automatic reconnection** with exponential backoff
✅ **Graceful degradation** during network failures
✅ **Heartbeat mechanism** to detect dead connections
✅ **Configurable retry limits** (default: 10 attempts)
✅ **Integration with TanStack Query** for cache invalidation
✅ **Production-ready** error handling and logging

**Key Takeaways:**
1. Reconnection is **automatic** with exponential backoff (1s → 16s)
2. Maximum 10 reconnection attempts (~111 seconds total)
3. Heartbeat every 30 seconds detects dead connections
4. Applications must **re-subscribe** after reconnection
5. TanStack Query cache should be **invalidated** on reconnect
6. Monitor reconnection metrics in production

## Related Documentation

- [ADR-004: WebSocket for Real-Time Dashboard Updates](../adr/adr-004-websocket-real-time-updates.md)
- [Epic 6 Retrospective](../epics/epic-6-retrospective.md)
- Backend Implementation: `backend/src/api/routes/websocket.ts`
- Frontend Implementation: `dashboard/src/hooks/useWebSocket.ts`

## Future Enhancements

1. **Jitter in backoff delays** (±30% randomness) to reduce thundering herd
2. **Auto-restore subscriptions** on reconnect (track subscriptions in ref)
3. **Configurable connection timeout** (default: 10 seconds)
4. **Shared Worker for multi-tab** (single connection for all tabs)
5. **Manual retry button** without page refresh
6. **Enhanced monitoring** with structured logs and metrics
7. **Graceful degradation UI** showing offline capabilities

---

**Last Updated:** 2025-11-16
**Version:** 1.0
**Maintainer:** Bob (Scrum Master)
