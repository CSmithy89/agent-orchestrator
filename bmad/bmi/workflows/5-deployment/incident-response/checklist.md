# Incident Response Pre-Flight and Post-Resolution Checklist

**Checklist Status Markers:** `[x]` Completed | `[ ]` Not completed | `[N/A]` Not applicable | `[!]` Requires attention

---

## Pre-Incident Readiness (Setup Once)

### 1. Monitoring and Alerting
- [ ] Monitoring system configured and operational
- [ ] Critical alerts configured (high error rate, service down, high latency)
- [ ] Alert routing configured (Slack, PagerDuty, email)
- [ ] Alert notifications tested and verified
- [ ] On-call schedule configured with rotation
- [ ] Escalation policies defined for P0-P4 incidents

### 2. Communication Channels
- [ ] Incident Slack workspace/channel template ready
- [ ] Status page account configured (if public-facing)
- [ ] Internal stakeholder notification list maintained
- [ ] Customer communication templates prepared
- [ ] Escalation contact list up to date (engineering leads, management)

### 3. Documentation and Runbooks
- [ ] Runbooks created for common incident types
- [ ] Architecture diagrams available for troubleshooting
- [ ] Service dependencies documented
- [ ] Database access credentials stored securely
- [ ] Infrastructure access (AWS, GCP, Azure) verified
- [ ] Third-party service contact information documented

### 4. Tools and Access
- [ ] Incident responders have production access
- [ ] Logging system accessible (query permissions verified)
- [ ] Monitoring dashboards accessible to all responders
- [ ] Deployment rollback procedures documented and tested
- [ ] Database backup/restore procedures tested
- [ ] Incident management tool configured (Jira, Linear, PagerDuty)

---

## During Incident Response

### 5. Incident Declaration
- [ ] Incident ID generated: {incident_id}
- [ ] Incident start time recorded: {start_time}
- [ ] Severity level assigned (P0-P4): {severity}
- [ ] Incident type classified: {incident_type}
- [ ] Affected service(s) identified: {affected_service}
- [ ] Customer impact assessed: {customer_impact}

### 6. Team Assembly
- [ ] Incident commander assigned (for P0/P1)
- [ ] Primary responder identified
- [ ] On-call engineer notified
- [ ] Engineering lead notified (if P0/P1)
- [ ] Management escalated (if P0)
- [ ] Incident war room created (Slack channel + video call)

### 7. Initial Communication
- [ ] Status page updated with "Investigating" status (if P0/P1)
- [ ] Internal stakeholders notified
- [ ] Customer communication sent (if required)
- [ ] Next communication time scheduled (30 min for P0, 1 hour for P1)

### 8. Diagnostics Gathered
- [ ] Monitoring dashboards reviewed
- [ ] Error logs analyzed for spike/patterns
- [ ] Recent deployments reviewed (last 24 hours)
- [ ] Infrastructure health verified (CPU, memory, disk, network)
- [ ] Database health checked (connections, query performance)
- [ ] Third-party service status verified
- [ ] Recent configuration changes reviewed

### 9. Runbook Execution
- [ ] Appropriate runbook selected: {runbook_name}
- [ ] Runbook steps executed sequentially
- [ ] Results of each step documented in timeline
- [ ] Likely root cause identified: {root_cause}

### 10. Mitigation Applied
- [ ] Mitigation strategy selected: {mitigation_strategy}
- [ ] Mitigation applied: {mitigation_action}
- [ ] Mitigation time recorded: {mitigation_time}
- [ ] Metrics monitored post-mitigation (5-10 min observation)
- [ ] Mitigation effectiveness confirmed

### 11. Service Recovery Validation
- [ ] Health checks passing
- [ ] Error rate returned to baseline (< {baseline_error_rate})
- [ ] Latency returned to normal (p95 < {baseline_latency}ms)
- [ ] Customer-reported issues resolved
- [ ] Synthetic monitors passing
- [ ] Service stable for 15-30 minutes (no regression)
- [ ] Resolution time recorded: {resolution_time}

### 12. Resolution Communication
- [ ] Status page updated with "Resolved" status (if P0/P1)
- [ ] Internal stakeholders notified of resolution
- [ ] Customer apology/explanation sent (if required)
- [ ] Incident war room notified of resolution
- [ ] War room scheduled for archival (24 hours)

### 13. MTTR Calculation
- [ ] Detection time calculated: {detection_time}
- [ ] Response time calculated: {response_time}
- [ ] Mitigation time calculated: {mitigation_time}
- [ ] Resolution time calculated: {resolution_time}
- [ ] Total MTTR calculated: {total_mttr}
- [ ] SLA compliance verified: {met_sla ? "Met" : "Missed"}
- [ ] Metrics logged to monitoring system

### 14. Incident Report
- [ ] Incident report document created
- [ ] Timeline documented with timestamps
- [ ] Root cause documented
- [ ] Customer impact quantified (users affected, duration)
- [ ] Mitigation steps documented
- [ ] Responders listed
- [ ] Incident report saved to output folder

---

## Post-Incident Review (PIR)

### 15. PIR Scheduling (if required)
- [ ] PIR required? (P0/P1: Yes, P2: Recommended, P3/P4: Optional)
- [ ] PIR scheduled within required timeframe:
  - [ ] P0: Within 48 hours
  - [ ] P1: Within 48 hours
  - [ ] P2: Within 1 week (recommended)
- [ ] PIR facilitator assigned
- [ ] PIR attendees identified (responders + stakeholders)
- [ ] Calendar invite sent

### 16. PIR Document Preparation
- [ ] PIR template created
- [ ] Incident summary written
- [ ] Timeline reviewed for accuracy
- [ ] "What went well" section brainstormed
- [ ] "What went wrong" section brainstormed
- [ ] "Where we got lucky" section brainstormed

### 17. Action Items Identified
- [ ] Action items to prevent recurrence identified
- [ ] Each action item assigned an owner
- [ ] Each action item has a due date
- [ ] Action items categorized:
  - [ ] Monitoring improvements
  - [ ] Runbook updates
  - [ ] Code fixes
  - [ ] Infrastructure changes
  - [ ] Process improvements
- [ ] Action items tracked in project management tool

### 18. Prevention Measures
- [ ] Root cause prevention strategy defined
- [ ] Monitoring gaps identified and addressed
- [ ] Alerting improvements identified
- [ ] Runbook updates documented
- [ ] Code/infrastructure fixes prioritized
- [ ] Team training needs identified

### 19. Knowledge Sharing
- [ ] Incident report shared with engineering team
- [ ] PIR findings shared with stakeholders
- [ ] Runbook updated with lessons learned
- [ ] Architecture documentation updated (if needed)
- [ ] Team retrospective held (if P0/P1)

---

**Checklist Summary:**
- Total Items: ~95
- Completed: ___ / ___
- Incident Status: [ ] 🚨 Active | [ ] ✅ Resolved | [ ] 📋 Post-Mortem Complete
