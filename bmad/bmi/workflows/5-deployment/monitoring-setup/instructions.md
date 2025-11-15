# Monitoring Setup - Application and Infrastructure Monitoring Configuration Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/monitoring-setup/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>

<critical>MONITORING IMPORTANCE: Proper monitoring is essential for production observability. Configure metrics, logs, alerts, and dashboards before incidents occur.</critical>

<workflow>

<step n="1" goal="Initialize Monitoring Setup Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll help you configure monitoring for {application_name} in {target_environment}."</action>
  <action>Gather monitoring context:</action>
    - Application Name: {application_name}
    - Environment: {target_environment}
    - Monitoring Platform: {monitoring_platform} (from config or auto-detect)
  <action>Verify prerequisites:</action>
    - Monitoring platform account/credentials
    - Application deployed and accessible
    - Cloud provider access (if using cloud-native monitoring)
  <action if="prerequisites not met">HALT: "Monitoring setup prerequisites not met. Ensure monitoring platform configured and application deployed."</action>
</step>

<step n="2" goal="Detect Monitoring Platform">
  <action>Auto-detect monitoring platform from deployment environment and config:</action>
    - AWS deployment → CloudWatch
    - GCP deployment → Stackdriver (Google Cloud Monitoring)
    - Azure deployment → Azure Monitor
    - Check for: Datadog agent, New Relic agent, Prometheus scrape config, Elastic APM
  <action if="monitoring_platform_override provided">Use override instead of auto-detected</action>
  <action if="no platform detected">
    <ask>Select monitoring platform:</ask>
    <options>CloudWatch, Stackdriver, Azure Monitor, Datadog, New Relic, Prometheus+Grafana, Elastic Stack, Sentry, Honeycomb</options>
  </action>
  <action>Display selected platform</action>
</step>

<step n="3" goal="Configure Metrics Collection">
  <action>Configure application metrics based on platform:</action>

  <platform name="CloudWatch">
    <action>Create CloudWatch namespace: {application_name}/{environment}</action>
    <action>Configure metrics: Custom metrics via CloudWatch agent or SDK</action>
    <action>Set metric retention: 15 months (CloudWatch default)</action>
  </platform>

  <platform name="Datadog/NewRelic">
    <action>Install agent: Provide agent installation instructions</action>
    <action>Configure API key and application name</action>
    <action>Enable APM and distributed tracing</action>
  </platform>

  <platform name="Prometheus">
    <action>Configure /metrics endpoint in application</action>
    <action>Add scrape config to Prometheus configuration</action>
    <action>Set scrape interval: {metrics_collection_interval}s</action>
  </platform>

  <action>Configure standard metrics:</action>
    - Request rate (requests/second)
    - Error rate (errors/second, error percentage)
    - Response time (p50, p95, p99 latency)
    - Throughput (data processed)
    - Active connections/sessions
  <action>Configure infrastructure metrics:</action>
    - CPU utilization
    - Memory usage
    - Disk I/O
    - Network I/O
</step>

<step n="4" goal="Configure Log Aggregation">
  <action>Configure log collection based on platform:</action>

  <platform name="CloudWatch Logs">
    <action>Create log group: /aws/{service}/{application_name}/{environment}</action>
    <action>Set retention: {log_retention_days} days</action>
    <action>Configure log streams per instance/container</action>
  </platform>

  <platform name="Elastic Stack">
    <action>Configure Filebeat/Fluentd for log shipping</action>
    <action>Set Elasticsearch index pattern: {application_name}-{environment}-*</action>
    <action>Configure index lifecycle policy (retention)</action>
  </platform>

  <platform name="Datadog/NewRelic">
    <action>Configure log forwarder to platform</action>
    <action>Set log retention per plan limits</action>
  </platform>

  <action>Configure log levels and filtering:</action>
    - Production: INFO and above (exclude DEBUG)
    - Staging: DEBUG and above
    - Dev: ALL levels
  <action>Configure structured logging (JSON format recommended)</action>
</step>

<step n="5" goal="Create Dashboards">
  <action>Create default dashboards for key metrics:</action>

  <dashboard name="Application Performance">
    - Request rate over time
    - Error rate over time
    - Response time percentiles (p50/p95/p99)
    - Throughput
    - Active users/sessions
  </dashboard>

  <dashboard name="Infrastructure Health">
    - CPU utilization by instance/container
    - Memory usage by instance/container
    - Disk usage and I/O
    - Network I/O
    - Instance/container count
  </dashboard>

  <dashboard name="Errors and Exceptions">
    - Error count by type
    - Exception traces
    - Failed request details
    - Error rate trends
  </dashboard>

  <action>Provide dashboard URLs and access instructions</action>
</step>

<step n="6" goal="Configure Alerts">
  <action>Create alert rules for critical conditions:</action>

  <alert name="High Error Rate">
    - Condition: Error rate > 5% for 5 minutes
    - Severity: Critical
    - Notification: {alert_notification_channels}
  </alert>

  <alert name="High Latency">
    - Condition: p95 latency > 1000ms for 5 minutes
    - Severity: Warning
    - Notification: {alert_notification_channels}
  </alert>

  <alert name="Service Down">
    - Condition: Health check failing for 2 minutes
    - Severity: Critical
    - Notification: PagerDuty (if production), Slack, Email
  </alert>

  <alert name="High CPU">
    - Condition: CPU > 80% for 10 minutes
    - Severity: Warning
  </alert>

  <alert name="High Memory">
    - Condition: Memory > 85% for 10 minutes
    - Severity: Warning
  </alert>

  <alert name="Disk Space Low">
    - Condition: Disk usage > 90%
    - Severity: Critical
  </alert>

  <action>Configure alert notification channels (Slack, Email, PagerDuty, Webhooks)</action>
  <action>Test alert delivery with test notification</action>
</step>

<step n="7" goal="Enable APM and Tracing">
  <action if="enable_apm is false">Skip to step 8</action>

  <action>Configure Application Performance Monitoring:</action>
    - Install APM agent/SDK in application
    - Configure transaction tracing
    - Enable slow query detection
    - Configure error reporting

  <action if="enable_distributed_tracing is true">
    <action>Configure distributed tracing (OpenTelemetry, Jaeger, Zipkin)</action>
    <action>Instrument HTTP clients and servers with trace context propagation</action>
    <action>Configure trace sampling rate (100% for staging, 10-20% for production)</action>
  </action>
</step>

<step n="8" goal="Validate Monitoring">
  <action>Validate monitoring is working correctly:</action>
    - Verify metrics are being collected (check last datapoint timestamp)
    - Verify logs are being shipped (check recent log entries)
    - Verify dashboards display data correctly
    - Test alert delivery (trigger test alert)
    - Verify APM traces (if enabled)
  <action if="validation fails">
    <action>Display failed checks</action>
    <action>Provide troubleshooting guidance</action>
  </action>
  <action if="validation succeeds">Display: "✅ Monitoring validated successfully"</action>
</step>

<step n="9" goal="Generate Monitoring Documentation">
  <action>Compile monitoring setup documentation:</action>
  - Monitoring Platform: {monitoring_platform}
  - Dashboard URLs: {dashboard_urls}
  - Alert Rules: {alert_count} configured
  - Log Retention: {log_retention_days} days
  - Metrics Collection Interval: {metrics_collection_interval}s
  - APM Enabled: {enable_apm}
  - Distributed Tracing: {enable_distributed_tracing}

  <action>Save monitoring configuration to: {default_output_file}</action>
</step>

<step n="10" goal="Complete Monitoring Setup">
  <action>Display monitoring setup summary:</action>

  ```
  ✅ MONITORING SETUP COMPLETE

  Application: {application_name}
  Environment: {target_environment}
  Platform: {monitoring_platform}

  Dashboards: {dashboard_count} created
  Alerts: {alert_count} configured
  Logs: {log_retention_days} days retention
  APM: {enabled/disabled}

  Next Steps:
  - Access dashboards: {dashboard_urls}
  - Configure additional custom metrics as needed
  - Review and adjust alert thresholds based on baseline
  - Set up on-call rotation for critical alerts

  Monitoring is live! 📊
  ```
  <action>Workflow complete ✅</action>
</step>

</workflow>
