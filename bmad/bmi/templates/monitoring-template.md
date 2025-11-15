# BMI Workflow Template: Monitoring Setup

This template demonstrates how to setup comprehensive monitoring, dashboards, and alerts for your application across different environments.

---

## Overview

Monitoring is critical for production applications. This template helps you setup:

1. **Application Monitoring** - Error tracking, performance metrics
2. **Infrastructure Monitoring** - Server health, resource utilization
3. **Business Metrics** - User engagement, conversion rates
4. **Alerts** - Proactive notifications for issues
5. **Dashboards** - Visualize all metrics in one place

---

## workflow.yaml Template

```yaml
workflow:
  name: "monitoring-setup"
  description: "Setup comprehensive monitoring, dashboards, and alerts"
  category: "operations"
  agent: "phoenix"  # Phoenix (Performance Engineer) handles monitoring

  config:
    communication_language: "English"
    user_skill_level: "intermediate"
    document_output_language: "English"

  inputs:
    environment:
      description: "Target environment"
      required: true
      options: ["dev", "staging", "production"]

    application_name:
      description: "Application name for monitoring"
      required: true

    monitoring_categories:
      description: "Categories to monitor"
      required: false
      type: "array"
      default: ["errors", "performance", "infrastructure"]
      options: ["errors", "performance", "infrastructure", "business", "security"]

    setup_dashboards:
      description: "Create monitoring dashboards"
      required: false
      type: "boolean"
      default: true

    setup_alerts:
      description: "Configure monitoring alerts"
      required: false
      type: "boolean"
      default: true

    alert_thresholds:
      description: "Custom alert thresholds"
      required: false
      type: "object"
      default:
        error_rate: 1.0  # Alert if error rate > 1%
        latency_p95: 500  # Alert if p95 > 500ms
        cpu_usage: 80  # Alert if CPU > 80%
        memory_usage: 85  # Alert if memory > 85%

  outputs:
    dashboard_url:
      description: "URL to monitoring dashboard"
      type: "string"

    alerts_configured:
      description: "Number of alerts configured"
      type: "number"

    monitoring_provider:
      description: "Detected monitoring provider"
      type: "string"

  monitoring_providers:
    - datadog: "Datadog APM and Infrastructure"
    - newrelic: "New Relic APM"
    - prometheus_grafana: "Prometheus + Grafana"
    - cloudwatch: "AWS CloudWatch"
    - azure_monitor: "Azure Monitor"
    - sentry: "Sentry for error tracking"
    - custom: "Custom monitoring solution"

  success_criteria:
    - monitoring_configured: "Monitoring provider configured"
    - dashboards_created: "Dashboards created and accessible"
    - alerts_configured: "Alerts configured and tested"
    - health_checks_passing: "Application health checks passing"

  estimated_duration: "10-20 minutes"
```

---

## instructions.md Template

```markdown
# Monitoring Setup Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>

<workflow>

<step n="1" goal="Initialize Monitoring Setup">
  <action>Greet user: "I'm Phoenix, your Performance Engineer. I'll setup monitoring for {application_name} in {environment}."</action>
  <action>Gather monitoring context:</action>
    - Environment: {environment}
    - Application: {application_name}
    - Categories: {monitoring_categories}
    - Dashboards: {setup_dashboards}
    - Alerts: {setup_alerts}
  <action>Display monitoring setup plan</action>
</step>

<step n="2" goal="Detect Monitoring Provider">
  <action>Auto-detect monitoring provider:</action>
    - Check for Datadog: dd-agent installed or DD_API_KEY env var
    - Check for New Relic: newrelic-agent or NEW_RELIC_LICENSE_KEY
    - Check for Prometheus: prometheus.yml config
    - Check for CloudWatch: AWS credentials and region
    - Check for Azure Monitor: Azure credentials
    - Check for Sentry: Sentry DSN configured
  <action>Display: "Detected provider: {monitoring_provider}"</action>
  <action if="no provider detected">Ask user to select provider manually</action>
</step>

<step n="3" goal="Configure Application Monitoring">
  <action if="errors not in monitoring_categories">Skip error monitoring</action>
  <action>Setup error tracking:</action>
    - Configure error collection
    - Setup error grouping by type
    - Configure source maps (for JavaScript)
    - Enable stack traces
  <action>Display: "Error tracking configured"</action>
</step>

<step n="4" goal="Configure Performance Monitoring">
  <action if="performance not in monitoring_categories">Skip performance monitoring</action>
  <action>Setup performance metrics:</action>
    - HTTP request latency (p50, p95, p99)
    - Throughput (requests/sec)
    - Response times by endpoint
    - Database query performance
    - External API call latency
  <action>Display: "Performance monitoring configured"</action>
</step>

<step n="5" goal="Configure Infrastructure Monitoring">
  <action if="infrastructure not in monitoring_categories">Skip infrastructure monitoring</action>
  <action>Setup infrastructure metrics:</action>
    - CPU utilization
    - Memory usage
    - Disk I/O
    - Network traffic
    - Container metrics (if containerized)
    - Database connections
  <action>Display: "Infrastructure monitoring configured"</action>
</step>

<step n="6" goal="Configure Business Metrics">
  <action if="business not in monitoring_categories">Skip business metrics</action>
  <action>Setup business metrics:</action>
    - Active users
    - User signups
    - Conversion rates
    - Revenue metrics
    - Feature usage
  <action>Display: "Business metrics configured"</action>
</step>

<step n="7" goal="Configure Security Monitoring">
  <action if="security not in monitoring_categories">Skip security monitoring</action>
  <action>Setup security metrics:</action>
    - Failed authentication attempts
    - Suspicious activity patterns
    - API rate limit violations
    - CORS errors
    - SQL injection attempts
  <action>Display: "Security monitoring configured"</action>
</step>

<step n="8" goal="Create Dashboards">
  <action if="setup_dashboards is false">Skip dashboard creation</action>
  <action if="setup_dashboards is false">Skip to step 9</action>
  <action>Create monitoring dashboards:</action>

  <dashboard name="Application Overview">
    - Request rate (timeseries)
    - Error rate (timeseries)
    - p95 latency (timeseries)
    - Active users (gauge)
    - Top errors (table)
  </dashboard>

  <dashboard name="Performance">
    - Latency distribution (histogram)
    - Slow endpoints (table)
    - Database query performance (timeseries)
    - External API latency (timeseries)
  </dashboard>

  <dashboard name="Infrastructure">
    - CPU usage by host (timeseries)
    - Memory usage by host (timeseries)
    - Disk I/O (timeseries)
    - Network traffic (timeseries)
  </dashboard>

  <action>Get dashboard URL from provider</action>
  <action>Display: "Dashboards created: {dashboard_url}"</action>
</step>

<step n="9" goal="Configure Alerts">
  <action if="setup_alerts is false">Skip alert configuration</action>
  <action if="setup_alerts is false">Skip to step 10</action>
  <action>Configure monitoring alerts with thresholds:</action>

  <alert name="High Error Rate">
    - Condition: error_rate > {alert_thresholds.error_rate}%
    - Duration: 5 minutes
    - Severity: Critical
    - Notification: email, slack, pagerduty
  </alert>

  <alert name="High Latency">
    - Condition: p95_latency > {alert_thresholds.latency_p95}ms
    - Duration: 10 minutes
    - Severity: Warning
    - Notification: email, slack
  </alert>

  <alert name="High CPU Usage">
    - Condition: cpu_usage > {alert_thresholds.cpu_usage}%
    - Duration: 15 minutes
    - Severity: Warning
    - Notification: email
  </alert>

  <alert name="High Memory Usage">
    - Condition: memory_usage > {alert_thresholds.memory_usage}%
    - Duration: 15 minutes
    - Severity: Warning
    - Notification: email
  </alert>

  <alert name="Service Down">
    - Condition: health_check_failing
    - Duration: 1 minute
    - Severity: Critical
    - Notification: email, slack, pagerduty
  </alert>

  <action>Count alerts configured: {alerts_configured}</action>
  <action>Display: "{alerts_configured} alerts configured"</action>
</step>

<step n="10" goal="Setup Health Checks">
  <action>Configure application health checks:</action>
    - HTTP health endpoint: /health or /healthz
    - Check frequency: 30 seconds
    - Timeout: 5 seconds
    - Expected status: 200 OK
  <action>Test health check endpoint</action>
  <action if="health_check fails">WARN: "Health check failing. Investigate before proceeding."</action>
</step>

<step n="11" goal="Test Monitoring">
  <action>Verify monitoring is working:</action>
    - Generate test request to application
    - Verify request appears in metrics
    - Generate test error
    - Verify error appears in error tracking
    - Check dashboard displays metrics
  <action>Display: "Monitoring verification complete"</action>
</step>

<step n="12" goal="Monitoring Summary">
  <action>Display comprehensive monitoring summary:</action>
    ```
    ✅ Monitoring Setup Complete

    **Environment:** {environment}
    **Application:** {application_name}
    **Provider:** {monitoring_provider}

    **Categories Configured:**
    {monitoring_categories}

    **Dashboards:**
    - URL: {dashboard_url}
    - Application Overview
    - Performance
    - Infrastructure

    **Alerts ({alerts_configured}):**
    - High Error Rate (>{alert_thresholds.error_rate}%)
    - High Latency (>{alert_thresholds.latency_p95}ms)
    - High CPU (>{alert_thresholds.cpu_usage}%)
    - High Memory (>{alert_thresholds.memory_usage}%)
    - Service Down

    **Next Steps:**
    - Access dashboard: {dashboard_url}
    - Test alerts by triggering conditions
    - Configure notification channels
    - Setup SLO/SLA tracking
    ```
  <action>Workflow complete ✅</action>
</step>

</workflow>
```

---

## Provider-Specific Configuration

### Datadog

```bash
# Install Datadog agent
DD_API_KEY=<key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure APM
# In application code:
const tracer = require('dd-trace').init({
  service: 'my-app',
  env: 'production'
});

# Create dashboard via API
curl -X POST "https://api.datadoghq.com/api/v1/dashboard" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -d @dashboard.json
```

### Prometheus + Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

```bash
# Import Grafana dashboard
curl -X POST "http://grafana:3000/api/dashboards/db" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d @dashboard.json
```

### AWS CloudWatch

```javascript
// In application code (Node.js)
const cloudwatch = new AWS.CloudWatch();

cloudwatch.putMetricData({
  Namespace: 'MyApp',
  MetricData: [{
    MetricName: 'RequestLatency',
    Value: latency,
    Unit: 'Milliseconds',
    Timestamp: new Date()
  }]
});
```

### Sentry (Error Tracking)

```javascript
// In application code
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

---

## checklist.md Template

```markdown
# Monitoring Setup Checklist

## Pre-Setup

- [ ] Monitoring provider selected
- [ ] API keys/credentials configured
- [ ] Environment variables set
- [ ] Application endpoints identified
- [ ] Alert notification channels configured

## Configuration

- [ ] Error tracking configured
- [ ] Performance metrics configured
- [ ] Infrastructure metrics configured
- [ ] Business metrics configured (if applicable)
- [ ] Security metrics configured (if applicable)

## Dashboards

- [ ] Application Overview dashboard created
- [ ] Performance dashboard created
- [ ] Infrastructure dashboard created
- [ ] Dashboard URLs documented
- [ ] Team members have access to dashboards

## Alerts

- [ ] High error rate alert configured
- [ ] High latency alert configured
- [ ] High CPU usage alert configured
- [ ] High memory usage alert configured
- [ ] Service down alert configured
- [ ] Alert thresholds appropriate for application
- [ ] Alert notifications tested

## Validation

- [ ] Health checks passing
- [ ] Metrics appearing in dashboards
- [ ] Test error appears in error tracking
- [ ] Alerts can be triggered by test conditions
- [ ] Notification channels working

## Documentation

- [ ] Dashboard URLs documented
- [ ] Alert runbooks created
- [ ] On-call rotation configured
- [ ] Team trained on monitoring tools
```

---

## Usage Example

### Setup monitoring for production

```bash
bmad-cli invoke bmi/custom/monitoring-setup \
  --environment production \
  --application-name "my-app" \
  --monitoring-categories '["errors","performance","infrastructure"]' \
  --setup-dashboards true \
  --setup-alerts true \
  --alert-thresholds '{"error_rate":1.0,"latency_p95":500}'
```

### From deployment workflow

```yaml
# Add to deploy workflow
<step n="N" goal="Setup Monitoring">
  <action>Invoke workflow: monitoring-setup</action>
    - environment: {environment}
    - application_name: {app_name}
    - monitoring_categories: ["errors", "performance"]
</step>
```

---

## Related Workflows

- **deploy**: Application deployment
- **incident-response**: Incident management (uses monitoring alerts)
- **performance-profiling**: Performance analysis
- **load-testing**: Load testing (generates metrics)
