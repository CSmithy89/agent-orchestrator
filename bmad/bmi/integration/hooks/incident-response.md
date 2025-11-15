# Incident Response Integration Hook

**Hook Type:** Emergency Integration
**Trigger:** Production incident detected (manual or monitoring alert)
**BMI Workflows Available:** incident-response, rollback, hotfix, monitoring-setup
**Auto-Trigger:** true for P0/P1 incidents

---

## Purpose

When a production incident occurs, this hook orchestrates the emergency response including incident management, rollback, and hotfix creation.

---

## When to Use

- Production outage or degradation detected
- Monitoring alerts firing for critical issues
- Customer-reported production issues
- P0/P1 incidents requiring immediate response

---

## Incident Severity Levels

- **P0 (Critical)** - Complete outage → Auto-trigger incident-response + rollback
- **P1 (High)** - Major degradation → Auto-trigger incident-response
- **P2 (Medium)** - Minor degradation → Manual trigger
- **P3 (Low)** - Small issue → Optional
- **P4 (Informational)** - No customer impact → Optional

---

## Integration Flow for P0 Incident

```
Production Alert (P0)
  → Auto-trigger incident-response workflow
    → Assess severity and impact
    → Execute runbook (service_down, high_error_rate, etc.)

    Decision Point: Can mitigate without code change?

    ├─ YES → Rollback workflow
    │   → Rollback to previous stable version
    │   → Verify service recovery
    │   → Update incident with resolution
    │
    └─ NO → Hotfix workflow
        → Create hotfix branch
        → Apply emergency fix
        → Run tests (NEVER skipped)
        → Deploy hotfix
        → Verify service recovery
        → Update incident with resolution
```

---

## How to Invoke from Monitoring/Alerting

### Option 1: Automatic from monitoring alert

Setup monitoring alert to trigger BMI workflow:

```bash
# Example: CloudWatch Alarm → SNS → Lambda → Invoke BMI
aws cloudwatch put-metric-alarm \
  --alarm-name "HighErrorRate-P0" \
  --alarm-actions "arn:aws:sns:region:account:trigger-bmi-incident" \
  --metric-name "ErrorRate" \
  --threshold 5.0
```

### Option 2: Manual invocation

```bash
# Invoke BMI incident-response workflow
bmad-cli invoke bmi/incident-response \
  --incident-description "API returning 500 errors" \
  --severity P0 \
  --affected-service "api" \
  --environment production
```

---

## Incident Response Decision Tree

```
INCIDENT DETECTED
  │
  ├─ Can rollback? (recent deployment)
  │   ├─ Yes → ROLLBACK
  │   └─ No → Continue investigation
  │
  ├─ Code fix required?
  │   ├─ Yes → HOTFIX workflow
  │   └─ No → Configuration/infrastructure fix
  │
  ├─ Mitigation available?
  │   ├─ Yes → Apply mitigation (scale, restart, etc.)
  │   └─ No → Escalate to engineering
  │
  └─ Monitor for recovery
      → Update incident with resolution
      → Schedule post-incident review (PIR)
```

---

## Workflow Invocation Examples

### Scenario 1: Deployment caused issue → Rollback

```yaml
# Auto-trigger rollback for recent deployment issue
invoke_bmi_workflow:
  workflow: rollback
  inputs:
    rollback_reason: "Deployment v1.2.3 causing high error rate"
    rollback_target: "v1.2.2"  # Previous stable version
    environment: production
    rollback_strategy: "blue-green-instant"  # Fast rollback
    incident_id: "INC-20251115-001"
```

### Scenario 2: Code bug requires hotfix

```yaml
# Trigger hotfix workflow for code bug
invoke_bmi_workflow:
  workflow: hotfix
  inputs:
    hotfix_description: "Fix null pointer exception in payment API"
    base_version: "1.2.2"  # Current production version
    incident_id: "INC-20251115-001"
    fast_track: true  # Enable fast-track mode
    auto_deploy: true  # Auto-deploy after tests pass
```

### Scenario 3: Enhanced monitoring needed

```yaml
# Setup enhanced monitoring during incident
invoke_bmi_workflow:
  workflow: monitoring-setup
  inputs:
    environment: production
    monitoring_categories: ["errors", "performance", "infrastructure"]
    alert_thresholds:
      error_rate: 1.0  # Lower threshold during incident
      latency_p95: 500  # More sensitive
```

---

## Status Tracking

```yaml
# bmad/bmi/integration/status/incident-status.yaml
incidents:
  - incident_id: "INC-20251115-001"
    severity: "P0"
    description: "API returning 500 errors"
    status: "resolved"
    created_at: "2025-11-15T09:00:00Z"
    resolved_at: "2025-11-15T09:45:00Z"
    mttr: "45 minutes"
    resolution:
      type: "hotfix"
      hotfix_version: "1.2.3"
      deployed_at: "2025-11-15T09:40:00Z"
    runbook_used: "high_error_rate"
```

---

## Configuration

```yaml
# bmad/bmi/integration/bmi-integration.yaml
incident_response:
  description: "Respond to production incidents"
  trigger: "Production incident detected (manual or alert)"
  available_workflows:
    - incident-response: "Follow incident response runbook"
    - rollback: "Rollback to previous version"
    - hotfix: "Create emergency hotfix release"
    - monitoring-setup: "Enhance monitoring during incident"
  auto_trigger: true  # Auto-trigger for P0/P1 incidents
```

---

## Post-Incident Review (PIR)

After incident resolution:

1. **incident-response** workflow generates PIR template
2. Schedule PIR meeting (within 48 hours for P0/P1)
3. Document:
   - What went well
   - What went wrong
   - Where we got lucky
   - Action items to prevent recurrence
4. Track action items to completion
