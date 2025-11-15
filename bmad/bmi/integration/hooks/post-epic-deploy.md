# Post-Epic Deployment Hook

**Hook Type:** Post-Development Integration
**Trigger:** BMM `orchestrate-epic` or `retrospective` workflow completion
**BMI Workflows Available:** deploy, load-testing, monitoring-setup
**Auto-Trigger:** false (manual)

---

## Purpose

After an epic is completed (all stories done), this hook allows deploying the epic to staging for comprehensive testing before production release.

---

## When to Use

- Epic is complete (all stories DONE)
- Retrospective completed
- Ready for staging validation
- Want to run load tests on new features
- Need to setup monitoring for new epic

---

## How to Invoke from BMM Workflows

### From `retrospective` workflow completion

Add to `bmad/bmm/workflows/retrospective/instructions.md`:

```xml
<step n="final" goal="Optional: Deploy Epic to Staging">
  <action>Epic retrospective complete. Suggest staging deployment for validation.</action>
  <action>Ask user: "Deploy epic to staging for final validation? [y/N]"</action>
  <action if="user confirms">Invoke BMI workflows in sequence:</action>

    <!-- 1. Deploy to staging -->
    <workflow name="deploy">
      - version: {epic_version}
      - environment: staging
      - deployment_strategy: blue-green
    </workflow>

    <!-- 2. Setup monitoring for new features -->
    <workflow name="monitoring-setup">
      - environment: staging
      - setup_dashboards: true
      - setup_alerts: true
    </workflow>

    <!-- 3. Run load tests -->
    <workflow name="load-testing">
      - target_url: {staging_url}
      - load_profile: peak
      - success_criteria: "p95<500ms, error_rate<1%"
    </workflow>

  <action>Display epic deployment summary with staging URL</action>
</step>
```

---

## Integration Flow

```
BMM Epic Complete
  → Retrospective Done
    → Hook: post-epic-deploy
      → BMI deploy (staging)
        → BMI monitoring-setup
          → BMI load-testing
            → Update deployment-status.yaml
  → Epic validated on staging
```

---

## Staging Validation Workflow

After epic deployment to staging:

1. **Deploy** - Deploy epic to staging environment
2. **Monitor** - Setup dashboards and alerts for new features
3. **Load Test** - Validate performance under peak load
4. **Smoke Test** - Run automated smoke tests
5. **Manual QA** - Optional manual testing
6. **Approval Gate** - Approve for production deployment

---

## Configuration

```yaml
# bmad/bmi/integration/bmi-integration.yaml
post_epic_completion:
  description: "After an epic is complete, optionally trigger deployment to staging"
  trigger: "bmm:orchestrate-epic workflow completion"
  available_workflows:
    - deploy: "Deploy epic to staging environment"
    - load-testing: "Run load tests on staging with new epic"
    - monitoring-setup: "Setup monitoring for new features"
  auto_trigger: false
```

---

## Status Tracking

```yaml
# bmad/bmi/integration/status/deployment-status.yaml
epic_deployments:
  - epic_id: "EPIC-001-user-auth"
    version: "epic-user-auth-v1"
    environment: "staging"
    status: "deployed"
    deployed_at: "2025-11-15T14:00:00Z"
    validation:
      load_testing: "passed"
      monitoring: "configured"
      smoke_tests: "passed"
    ready_for_production: true
```
