# WebSocket Connection Monitoring Guide

**Author:** Alice (Architect)
**Date:** 2025-11-16
**Status:** Active
**Related:** [ADR-004: WebSocket for Real-Time Dashboard Updates](../adr/adr-004-websocket-real-time-updates.md)

## Overview

This guide documents the WebSocket connection monitoring system for the Agent Orchestrator dashboard. It establishes metrics, alerts, and monitoring practices to ensure reliable real-time updates and prevent connection overhead issues.

## Table of Contents

1. [Monitoring Requirements](#monitoring-requirements)
2. [Metrics Collection](#metrics-collection)
3. [Prometheus Integration](#prometheus-integration)
4. [Grafana Dashboard](#grafana-dashboard)
5. [Alerting Rules](#alerting-rules)
6. [Performance Thresholds](#performance-thresholds)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Monitoring Requirements

### Key Metrics to Track

**Connection Metrics:**
- Active connections count
- New connections per minute
- Disconnections per minute
- Connection duration (avg, p50, p95, p99)
- Failed authentication attempts
- Reconnection attempts

**Subscription Metrics:**
- Total subscriptions
- Subscriptions per project
- Subscriptions per user
- Average subscriptions per connection

**Performance Metrics:**
- Message throughput (messages/second)
- Message latency (send to receive)
- Heartbeat ping/pong times
- Memory usage per connection
- CPU usage for WebSocket handling

**Error Metrics:**
- Connection errors (by type)
- Message parsing errors
- Authentication failures
- Heartbeat timeouts

### Performance Targets (from Epic 6)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Active Connections** | <500 | >500 | >1000 |
| **Message Latency** | <50ms | >100ms | >500ms |
| **Connection Duration** | >5min | <1min | <30s |
| **Memory per Connection** | <2KB | >5KB | >10KB |
| **Heartbeat Failures** | 0% | >1% | >5% |
| **Failed Auth Rate** | <1% | >5% | >10% |

## Metrics Collection

### Backend Metrics (Prometheus Format)

```typescript
// backend/src/api/routes/websocket.metrics.ts
import { register, Counter, Gauge, Histogram } from 'prom-client';

// ============================================================================
// Connection Metrics
// ============================================================================

export const wsConnectionsTotal = new Counter({
  name: 'websocket_connections_total',
  help: 'Total number of WebSocket connections established',
  labelNames: ['status'] // 'opened', 'closed', 'failed'
});

export const wsActiveConnections = new Gauge({
  name: 'websocket_active_connections',
  help: 'Current number of active WebSocket connections'
});

export const wsConnectionDuration = new Histogram({
  name: 'websocket_connection_duration_seconds',
  help: 'WebSocket connection duration in seconds',
  buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600] // 1s to 1hr
});

export const wsAuthFailures = new Counter({
  name: 'websocket_auth_failures_total',
  help: 'Total number of WebSocket authentication failures',
  labelNames: ['reason'] // 'missing_token', 'invalid_token', 'expired_token'
});

// ============================================================================
// Subscription Metrics
// ============================================================================

export const wsSubscriptionsTotal = new Gauge({
  name: 'websocket_subscriptions_total',
  help: 'Current number of active subscriptions'
});

export const wsSubscriptionsByProject = new Gauge({
  name: 'websocket_subscriptions_by_project',
  help: 'Number of subscriptions per project',
  labelNames: ['project_id']
});

export const wsSubscriptionsPerConnection = new Histogram({
  name: 'websocket_subscriptions_per_connection',
  help: 'Number of subscriptions per WebSocket connection',
  buckets: [0, 1, 2, 5, 10, 20, 50]
});

// ============================================================================
// Message Metrics
// ============================================================================

export const wsMessagesTotal = new Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction', 'type'] // direction: 'sent'|'received', type: event type
});

export const wsMessageLatency = new Histogram({
  name: 'websocket_message_latency_milliseconds',
  help: 'WebSocket message latency in milliseconds',
  labelNames: ['event_type'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
});

export const wsMessageErrors = new Counter({
  name: 'websocket_message_errors_total',
  help: 'Total number of WebSocket message errors',
  labelNames: ['error_type'] // 'parse_error', 'validation_error', 'send_error'
});

// ============================================================================
// Heartbeat Metrics
// ============================================================================

export const wsHeartbeatsSent = new Counter({
  name: 'websocket_heartbeats_sent_total',
  help: 'Total number of heartbeat pings sent'
});

export const wsHeartbeatLatency = new Histogram({
  name: 'websocket_heartbeat_latency_milliseconds',
  help: 'WebSocket heartbeat ping/pong latency in milliseconds',
  buckets: [1, 5, 10, 25, 50, 100, 250, 500]
});

export const wsHeartbeatTimeouts = new Counter({
  name: 'websocket_heartbeat_timeouts_total',
  help: 'Total number of heartbeat timeouts (dead connections)'
});

// ============================================================================
// Resource Metrics
// ============================================================================

export const wsMemoryUsage = new Gauge({
  name: 'websocket_memory_usage_bytes',
  help: 'Memory usage for WebSocket connections'
});

export const wsCPUUsage = new Gauge({
  name: 'websocket_cpu_usage_percent',
  help: 'CPU usage percentage for WebSocket handling'
});

// Export Prometheus registry
export { register as metricsRegistry };
```

### Instrumentation in WebSocket Handler

```typescript
// backend/src/api/routes/websocket.ts
import {
  wsConnectionsTotal,
  wsActiveConnections,
  wsConnectionDuration,
  wsAuthFailures,
  wsSubscriptionsTotal,
  wsMessagesTotal,
  wsHeartbeatsSent,
  wsHeartbeatTimeouts
} from './websocket.metrics.js';

export class WebSocketHandler {
  private connectionStartTimes: Map<string, number> = new Map();

  private setupAuthenticatedConnection(ws: WebSocket, userId?: string): void {
    const client = ws as ExtendedWebSocket;
    client.id = uuidv4();

    // Track connection start time
    this.connectionStartTimes.set(client.id, Date.now());

    // Update metrics
    wsConnectionsTotal.inc({ status: 'opened' });
    wsActiveConnections.inc();

    // ... existing setup code

    // Setup close handler with metrics
    client.on('close', () => {
      this.handleDisconnect(client);

      // Update metrics
      wsActiveConnections.dec();
      wsConnectionsTotal.inc({ status: 'closed' });

      // Track connection duration
      const startTime = this.connectionStartTimes.get(client.id);
      if (startTime) {
        const duration = (Date.now() - startTime) / 1000;
        wsConnectionDuration.observe(duration);
        this.connectionStartTimes.delete(client.id);
      }
    });
  }

  private async authenticate(request: IncomingMessage): Promise<AuthResult> {
    try {
      // ... existing auth code
    } catch (error) {
      wsAuthFailures.inc({ reason: 'invalid_token' });
      return { authenticated: false, error: 'Invalid token' };
    }
  }

  private handleSubscribe(client: ExtendedWebSocket, projectId: string): void {
    // ... existing subscribe code

    // Update metrics
    wsSubscriptionsTotal.inc();
    wsSubscriptionsByProject.inc({ project_id: projectId });
  }

  private handleUnsubscribe(client: ExtendedWebSocket, projectId: string): void {
    // ... existing unsubscribe code

    // Update metrics
    wsSubscriptionsTotal.dec();
    wsSubscriptionsByProject.dec({ project_id: projectId });
  }

  private startHeartbeat(): void {
    if (this.config.pingInterval) {
      this.pingInterval = setInterval(() => {
        this.wss.clients.forEach((ws) => {
          const client = ws as ExtendedWebSocket;

          if (!client.isAlive) {
            // Update metrics
            wsHeartbeatTimeouts.inc();
            return client.terminate();
          }

          client.isAlive = false;
          client.ping();

          // Update metrics
          wsHeartbeatsSent.inc();
        });
      }, this.config.pingInterval);
    }
  }
}
```

### Metrics Endpoint

```typescript
// backend/src/api/routes/metrics.ts
import { FastifyInstance } from 'fastify';
import { metricsRegistry } from './websocket.metrics.js';

export async function metricsRoutes(fastify: FastifyInstance) {
  // Prometheus metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', metricsRegistry.contentType);
    return metricsRegistry.metrics();
  });

  // Health check with WebSocket status
  fastify.get('/health/websocket', async (request, reply) => {
    const metrics = await metricsRegistry.getSingleMetricAsString('websocket_active_connections');

    return {
      status: 'healthy',
      activeConnections: parseInt(metrics.split(' ')[1] || '0'),
      timestamp: new Date().toISOString()
    };
  });
}
```

## Prometheus Integration

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'agent-orchestrator-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  prometheus-data:
  grafana-data:
```

## Grafana Dashboard

### Dashboard Configuration (JSON)

```json
{
  "dashboard": {
    "title": "WebSocket Connections",
    "panels": [
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "websocket_active_connections",
            "legendFormat": "Active Connections"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Connection Rate",
        "targets": [
          {
            "expr": "rate(websocket_connections_total{status=\"opened\"}[5m])",
            "legendFormat": "Opened/min"
          },
          {
            "expr": "rate(websocket_connections_total{status=\"closed\"}[5m])",
            "legendFormat": "Closed/min"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Message Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(websocket_message_latency_milliseconds_bucket[5m]))",
            "legendFormat": "p95 Latency"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Subscriptions by Project",
        "targets": [
          {
            "expr": "websocket_subscriptions_by_project",
            "legendFormat": "{{ project_id }}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Heartbeat Timeouts",
        "targets": [
          {
            "expr": "rate(websocket_heartbeat_timeouts_total[5m])",
            "legendFormat": "Timeouts/min"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Authentication Failures",
        "targets": [
          {
            "expr": "rate(websocket_auth_failures_total[5m])",
            "legendFormat": "{{ reason }}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### Key Panels to Include

**1. Connection Health:**
- Active connections (gauge)
- Connection rate (opened vs closed)
- Connection duration histogram
- Failed connections rate

**2. Performance:**
- Message latency (p50, p95, p99)
- Message throughput (messages/sec)
- Heartbeat latency
- CPU and memory usage

**3. Subscriptions:**
- Total subscriptions
- Subscriptions by project (bar chart)
- Subscriptions per connection (histogram)

**4. Errors:**
- Authentication failures by reason
- Message parsing errors
- Heartbeat timeouts
- Connection errors

## Alerting Rules

### Prometheus Alerting Rules

```yaml
# alerts.yml
groups:
  - name: websocket_alerts
    interval: 30s
    rules:
      # Connection count alerts
      - alert: HighWebSocketConnections
        expr: websocket_active_connections > 500
        for: 5m
        labels:
          severity: warning
          component: websocket
        annotations:
          summary: "High number of WebSocket connections"
          description: "{{ $value }} active connections (threshold: 500)"

      - alert: CriticalWebSocketConnections
        expr: websocket_active_connections > 1000
        for: 2m
        labels:
          severity: critical
          component: websocket
        annotations:
          summary: "Critical number of WebSocket connections"
          description: "{{ $value }} active connections (threshold: 1000)"

      # Latency alerts
      - alert: HighWebSocketLatency
        expr: histogram_quantile(0.95, rate(websocket_message_latency_milliseconds_bucket[5m])) > 100
        for: 5m
        labels:
          severity: warning
          component: websocket
        annotations:
          summary: "High WebSocket message latency"
          description: "p95 latency: {{ $value }}ms (threshold: 100ms)"

      - alert: CriticalWebSocketLatency
        expr: histogram_quantile(0.95, rate(websocket_message_latency_milliseconds_bucket[5m])) > 500
        for: 2m
        labels:
          severity: critical
          component: websocket
        annotations:
          summary: "Critical WebSocket message latency"
          description: "p95 latency: {{ $value }}ms (threshold: 500ms)"

      # Heartbeat alerts
      - alert: HighHeartbeatTimeouts
        expr: rate(websocket_heartbeat_timeouts_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
          component: websocket
        annotations:
          summary: "High rate of heartbeat timeouts"
          description: "{{ $value }} timeouts/sec (threshold: 0.01/sec = 1% of connections)"

      # Authentication alerts
      - alert: HighAuthenticationFailures
        expr: rate(websocket_auth_failures_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
          component: websocket
        annotations:
          summary: "High rate of authentication failures"
          description: "{{ $value }} failures/sec"

      # Connection churn alert
      - alert: HighConnectionChurn
        expr: rate(websocket_connections_total{status="closed"}[5m]) > 1
        for: 10m
        labels:
          severity: warning
          component: websocket
        annotations:
          summary: "High connection churn rate"
          description: "{{ $value }} disconnections/sec - possible reconnection loop"
```

### Alertmanager Configuration

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'component']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack'

receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}'
```

## Performance Thresholds

### Connection Limits

**Soft Limit (Warning):** 500 concurrent connections
- **Action:** Send alert to team
- **Investigation:** Check for unexpected traffic patterns
- **Timeline:** Review within 1 hour

**Hard Limit (Critical):** 1,000 concurrent connections
- **Action:** Immediate alert to on-call
- **Investigation:** Check for DDoS, reconnection loops, or load balancer issues
- **Timeline:** Respond within 15 minutes

### Memory Per Connection

**Target:** <2 KB per connection
- **Calculation:** 500 connections × 2 KB = 1 MB total
- **Warning:** >5 KB per connection (2.5 MB for 500 connections)
- **Critical:** >10 KB per connection (5 MB for 500 connections)

**Monitoring Query:**
```promql
websocket_memory_usage_bytes / websocket_active_connections
```

### Message Latency

**Target:** <50ms (p95)
- **Acceptable:** 50-100ms
- **Warning:** 100-500ms
- **Critical:** >500ms

**Monitoring Query:**
```promql
histogram_quantile(0.95, rate(websocket_message_latency_milliseconds_bucket[5m]))
```

## Troubleshooting

### High Connection Count

**Symptoms:**
- Active connections >500
- Memory usage increasing
- CPU usage elevated

**Investigation:**
1. Check for reconnection loops:
   ```promql
   rate(websocket_connections_total{status="opened"}[5m]) /
   rate(websocket_connections_total{status="closed"}[5m])
   ```
   If ratio >1.5, clients are reconnecting too quickly.

2. Check connection duration:
   ```promql
   histogram_quantile(0.50, rate(websocket_connection_duration_seconds_bucket[5m]))
   ```
   If p50 <1 minute, connections are too short.

3. Check for specific users/projects:
   ```promql
   sum by (project_id) (websocket_subscriptions_by_project)
   ```

**Solutions:**
- Implement rate limiting for reconnections
- Increase reconnection backoff delay
- Block abusive clients

### High Message Latency

**Symptoms:**
- p95 latency >100ms
- Users report delays in real-time updates
- Lag in dashboard updates

**Investigation:**
1. Check message queue size
2. Check CPU usage
3. Check network latency
4. Check event processing time

**Solutions:**
- Optimize event handlers
- Implement message batching
- Add more workers
- Scale horizontally

### Memory Leaks

**Symptoms:**
- Memory usage growing over time
- Process restarts due to OOM
- High swap usage

**Investigation:**
1. Check memory per connection trend
2. Check for unsubscribed event handlers
3. Check for orphaned simulations

**Solutions:**
- Ensure cleanup in disconnect handler
- Implement periodic memory profiling
- Add memory limits per connection

## Best Practices

### 1. Regular Monitoring Review

**Weekly:**
- Review connection trends
- Check latency percentiles
- Verify alert thresholds

**Monthly:**
- Analyze connection patterns
- Review capacity planning
- Update alert thresholds

### 2. Capacity Planning

**Current Capacity (Epic 6 results):**
- Tested: 1,000+ concurrent connections
- Target: 500 normal, 1,000 peak
- Overhead: ~2 KB per connection

**Scaling Strategy:**
- Add horizontal scaling at 500 connections
- Load balancer distributes connections
- Sticky sessions for WebSocket affinity

### 3. Performance Testing

**Load Testing:**
```bash
# Simulate 500 concurrent connections
k6 run websocket-load-test.js --vus 500 --duration 5m
```

**Stress Testing:**
```bash
# Test maximum capacity
k6 run websocket-stress-test.js --vus 1000 --duration 10m
```

### 4. Monitoring Stack Maintenance

**Prometheus:**
- Retention: 15 days
- Scrape interval: 10 seconds
- Storage: 100 GB

**Grafana:**
- Auto-refresh: 30 seconds
- Dashboards: Export regularly
- Users: Limit to team members

## Summary

**Key Metrics:**
- ✅ **Active connections:** Target <500, Critical >1000
- ✅ **Message latency:** Target <50ms (p95), Critical >500ms
- ✅ **Memory per connection:** Target <2KB, Critical >10KB
- ✅ **Heartbeat timeouts:** Target 0%, Warning >1%

**Monitoring Stack:**
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and notifications

**Alerts Configured:**
1. High connection count (>500)
2. Critical connection count (>1000)
3. High message latency (>100ms p95)
4. Critical message latency (>500ms p95)
5. High heartbeat timeouts (>1%)
6. High authentication failures (>5%)
7. High connection churn rate

**Best Practices:**
1. Monitor connection count trends
2. Track latency percentiles
3. Set up proactive alerts
4. Regular capacity planning
5. Load test before deployments

## Related Documentation

- [ADR-004: WebSocket for Real-Time Dashboard Updates](../adr/adr-004-websocket-real-time-updates.md)
- [WebSocket Reconnection Guide](./websocket-reconnection-guide.md)
- [Epic 6 Retrospective](../epics/epic-6-retrospective.md)
- Implementation: `backend/src/api/routes/websocket.ts`

---

**Last Updated:** 2025-11-16
**Version:** 1.0
**Maintainer:** Alice (Architect)
