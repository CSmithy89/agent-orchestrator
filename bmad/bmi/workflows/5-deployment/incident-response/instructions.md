# Incident Response - Production Incident Management Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/incident-response/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>INCIDENT RESPONSE: Speed is critical. Every minute of downtime impacts customers and business. Focus on rapid mitigation first, root cause analysis second.</critical>

<workflow>

<step n="1" goal="Declare Incident and Assess Severity">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll guide you through this incident response for {incident_description}."</action>
  <action>Generate incident ID (if not provided): INC-{YYYYMMDD}-{sequence} (e.g., INC-20251115-001)</action>
  <action>Record incident start time (this is the clock start for MTTR)</action>
  <action>Assess and confirm severity level:</action>
  ```
  P0 (Critical):    Complete outage, all customers affected → Response: Immediate
  P1 (High):        Major degradation, many customers affected → Response: < 15 min
  P2 (Medium):      Minor degradation, some customers affected → Response: < 1 hour
  P3 (Low):         Small issue, minimal impact → Response: < 4 hours
  P4 (Informational): No customer impact → Response: Best effort
  ```
  <action if="severity is P0 or P1">ALERT: "High-severity incident detected. Auto-escalating and enabling emergency mode."</action>
  <action>Classify incident type:</action>
    - Service Outage
    - Performance Degradation
    - Security Incident
    - Data Loss/Corruption
    - Third-Party Dependency Failure
    - Infrastructure Failure
    - Deployment-Related
</step>

<step n="2" goal="Assemble Incident Response Team">
  <action if="severity is P0">Page on-call engineer + engineering lead + management (immediate escalation)</action>
  <action if="severity is P1">Notify on-call engineer + engineering lead</action>
  <action if="severity is P2 or P3">Assign to primary responder from {responder_team}</action>
  <action>Designate incident commander (IC) for P0/P1 incidents</action>
  <action>Create incident war room:</action>
    - Slack channel: #incident-{incident_id}
    - Video call link (if P0/P1)
    - Shared incident document
  <action>Display team roster and communication channels</action>
</step>

<step n="3" goal="Send Initial Customer Communication">
  <action if="severity is P0 or P1">Send initial status page update:</action>
  ```
  Status: Investigating
  Title: {affected_service} experiencing {issue_description}
  Message: "We are investigating reports of {customer_impact}.
           Our team is actively working on this issue.
           Next update in 30 minutes."
  Timestamp: {current_time}
  ```
  <action if="severity is P2">Send internal notification to stakeholders</action>
  <action>Log communication in incident timeline</action>
</step>

<step n="4" goal="Gather Initial Diagnostic Data">
  <action>Collect diagnostic information:</action>
    - Check monitoring dashboards for abnormal metrics
    - Review recent deployments (last 24 hours)
    - Check error logs for spike in errors
    - Verify infrastructure health (CPU, memory, disk, network)
    - Check third-party service status pages
    - Review recent configuration changes
  <action>Display diagnostic summary:</action>
  ```
  📊 Diagnostic Summary:
  - Recent Deployments: {recent_deployments}
  - Error Rate: {current_error_rate} (baseline: {baseline_error_rate})
  - Latency: p95={p95_latency}ms (baseline: {baseline_latency}ms)
  - Infrastructure: {infrastructure_status}
  - Third-Party Services: {third_party_status}
  ```
  <action>Identify likely root cause or narrow down investigation scope</action>
</step>

<step n="5" goal="Select and Execute Incident Runbook">
  <action>Match incident to available runbook:</action>
    - High Error Rate → high_error_rate runbook
    - Service Down → service_down runbook
    - High Latency → high_latency runbook
    - Database Issues → database_issues runbook
    - Memory Leak → memory_leak runbook
    - Security Breach → security_breach runbook
    - Third-Party Outage → third_party_outage runbook
  <action if="no matching runbook">Use generic troubleshooting approach (check logs, metrics, recent changes)</action>
  <action>Execute runbook steps:</action>

  <runbook name="service_down">
    1. Verify service health endpoint returns 200 OK
    2. Check application logs for crashes or fatal errors
    3. Verify database connectivity
    4. Check infrastructure (pods/containers running, load balancer healthy)
    5. Review recent deployments (consider rollback)
    6. Restart service if safe to do so
    7. Scale up resources if resource exhaustion detected
  </runbook>

  <runbook name="high_error_rate">
    1. Identify error type from logs (500 errors, timeouts, database errors)
    2. Check for recent code deployments (correlation analysis)
    3. Verify database query performance
    4. Check third-party API availability
    5. Review application configuration changes
    6. Consider rollback if deployment-related
    7. Implement hotfix if code bug identified
  </runbook>

  <runbook name="high_latency">
    1. Identify slow endpoints from APM traces
    2. Check database query performance (slow queries)
    3. Verify cache hit rate (Redis, Memcached)
    4. Check for resource contention (CPU, memory)
    5. Review recent traffic patterns (spike in requests?)
    6. Scale horizontally if capacity issue
    7. Optimize slow queries or implement caching
  </runbook>

  <runbook name="database_issues">
    1. Verify database connectivity from application
    2. Check connection pool exhaustion
    3. Identify slow queries (EXPLAIN ANALYZE)
    4. Check database resource utilization (CPU, memory, IOPS)
    5. Verify replication lag (if using replicas)
    6. Consider connection pool increase
    7. Kill long-running queries if blocking others
    8. Scale database resources if needed
  </runbook>

  <runbook name="security_breach">
    1. IMMEDIATELY isolate affected systems (network segmentation)
    2. Preserve evidence (logs, snapshots, memory dumps)
    3. Revoke compromised credentials
    4. Block malicious IP addresses
    5. Assess scope of breach (data accessed, systems compromised)
    6. Engage security team and legal counsel
    7. Prepare breach notification (if customer data affected)
    8. Document chain of custody for forensics
  </runbook>

  <action>Record runbook execution and results in incident timeline</action>
</step>

<step n="6" goal="Implement Mitigation">
  <action>Based on runbook results, implement mitigation:</action>
    - Rollback deployment (invoke rollback workflow)
    - Restart service/pods
    - Scale resources (horizontal/vertical)
    - Disable feature flag
    - Failover to backup system
    - Implement rate limiting
    - Block malicious traffic
    - Apply hotfix
  <action>Monitor impact of mitigation (metrics should improve within 5-10 minutes)</action>
  <action if="mitigation successful">Record mitigation time (MTTR checkpoint)</action>
  <action if="mitigation unsuccessful">Escalate and try alternative mitigation strategy</action>
</step>

<step n="7" goal="Verify Service Recovery">
  <action>Validate service health:</action>
    - Health checks passing
    - Error rate returned to baseline
    - Latency returned to normal levels
    - Customer-reported issues resolved
    - All synthetic monitors passing
  <action>Monitor for 15-30 minutes to ensure stability (no regression)</action>
  <action if="service recovered">Record resolution time (MTTR complete)</action>
  <action if="service not recovered">Return to step 5 (try different runbook/mitigation)</action>
</step>

<step n="8" goal="Send Resolution Communication">
  <action if="severity is P0 or P1">Update status page:</action>
  ```
  Status: Resolved
  Title: {affected_service} issue resolved
  Message: "The issue affecting {affected_service} has been resolved.
           Root cause: {brief_root_cause}
           Services are now operating normally.
           We apologize for the disruption."
  Timestamp: {current_time}
  Duration: {incident_duration}
  ```
  <action>Send internal resolution notification with summary</action>
  <action>Close incident war room (archive Slack channel after 24 hours)</action>
</step>

<step n="9" goal="Calculate and Report MTTR Metrics">
  <action>Calculate MTTR breakdown:</action>
  ```
  📈 MTTR Metrics for {incident_id}

  Detection Time:   {detection_time} (incident start → alert fired)
  Response Time:    {response_time} (alert → first responder engaged)
  Mitigation Time:  {mitigation_time} (response → mitigation applied)
  Resolution Time:  {resolution_time} (mitigation → full recovery)

  Total MTTR:       {total_mttr}

  SLA Target (P{severity}): {sla_target}
  Status: {met_sla ? "✅ SLA Met" : "❌ SLA Missed"}
  ```
  <action>Log metrics to monitoring system for trend analysis</action>
</step>

<step n="10" goal="Generate Incident Report">
  <action>Create incident report document:</action>
  ```markdown
  # Incident Report: {incident_id}

  **Incident ID:** {incident_id}
  **Severity:** P{severity}
  **Status:** Resolved
  **Duration:** {incident_duration}
  **MTTR:** {total_mttr}

  ## Summary
  {incident_description}

  ## Timeline
  - **{start_time}** - Incident detected via {alert_source}
  - **{response_time}** - Incident declared, team assembled
  - **{mitigation_time}** - Mitigation implemented: {mitigation_action}
  - **{resolution_time}** - Service fully recovered

  ## Customer Impact
  {customer_impact}

  ## Root Cause
  {detailed_root_cause}

  ## Mitigation
  {mitigation_description}

  ## Metrics
  - MTTR: {total_mttr}
  - Affected Users: {affected_users}
  - Error Rate Peak: {peak_error_rate}

  ## Runbook Used
  {runbook_name}

  ## Responders
  {responder_list}
  ```
  <action>Save incident report to {output_folder}/incident-{incident_id}-{date}.md</action>
</step>

<step n="11" goal="Schedule Post-Incident Review (if required)">
  <action if="severity is P0 or P1">Post-Incident Review (PIR) is REQUIRED within 48 hours</action>
  <action if="severity is P2">PIR is RECOMMENDED within 1 week</action>
  <action if="severity is P3 or P4">PIR is OPTIONAL</action>
  <action if="PIR required">Create PIR document template:</action>
  ```markdown
  # Post-Incident Review: {incident_id}

  **Date:** {pir_date}
  **Facilitator:** {facilitator_name}
  **Attendees:** {attendee_list}

  ## Incident Summary
  {incident_summary}

  ## What Went Well
  - {positive_1}
  - {positive_2}

  ## What Went Wrong
  - {negative_1}
  - {negative_2}

  ## Where We Got Lucky
  - {luck_factor_1}

  ## Action Items
  | Action | Owner | Due Date | Status |
  |--------|-------|----------|--------|
  | {action_1} | {owner_1} | {due_date_1} | Open |
  | {action_2} | {owner_2} | {due_date_2} | Open |

  ## Prevention Measures
  {how_to_prevent_recurrence}

  ## Monitoring Improvements
  {monitoring_gaps_identified}
  ```
  <action>Schedule PIR meeting and send calendar invite</action>
  <action>Workflow complete ✅</action>
</step>

</workflow>
