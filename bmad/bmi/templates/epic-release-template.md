# BMI Workflow Template: Epic Release

This template demonstrates a comprehensive epic release workflow with quality gates, load testing, and monitoring setup. Use this for releasing complete epics to production.

---

## Overview

Epic releases involve deploying a complete epic (multiple stories) through staging validation before production release. This template includes:

1. **Staging Deployment** - Deploy epic to staging
2. **Quality Gates** - Load testing, performance profiling, security scans
3. **Approval Gate** - Manual approval before production
4. **Production Release** - Deploy to production with monitoring
5. **Post-Release Validation** - Verify production deployment

---

## workflow.yaml Template

```yaml
workflow:
  name: "epic-release"
  description: "Release a complete epic through staging to production"
  category: "release"
  agent: "rita"  # Rita (Release Manager) handles epic releases

  config:
    communication_language: "English"
    user_skill_level: "intermediate"
    document_output_language: "English"

  inputs:
    epic_id:
      description: "Epic ID (e.g., 'EPIC-001-user-auth')"
      required: true

    epic_version:
      description: "Epic version (e.g., 'epic-user-auth-v1')"
      required: true

    package_ecosystem:
      description: "Package ecosystem"
      required: true
      options: ["nodejs_npm", "python_pypi", "rust_crates", "dotnet_nuget", "go_pkg"]

    skip_load_tests:
      description: "Skip load testing (not recommended)"
      required: false
      type: "boolean"
      default: false

    auto_promote_to_production:
      description: "Auto-promote to production if all gates pass"
      required: false
      type: "boolean"
      default: false

  outputs:
    staging_url:
      description: "Staging deployment URL"
      type: "string"

    production_url:
      description: "Production deployment URL"
      type: "string"

    release_version:
      description: "Final release version"
      type: "string"

    quality_gates_status:
      description: "Status of all quality gates"
      type: "object"

  workflows_invoked:
    - deploy: "Deploy to staging and production"
    - load-testing: "Validate performance under load"
    - performance-profiling: "Profile for performance regressions"
    - monitoring-setup: "Setup monitoring for production"
    - release: "Create and publish release"

  tasks:
    - calculate-version: "Calculate release version"
    - update-deployment-status: "Update deployment status"
    - update-release-status: "Update release status"

  success_criteria:
    - staging_deployed: "Epic deployed to staging"
    - load_tests_pass: "Load tests meet SLA (p95<500ms, error<1%)"
    - performance_validated: "No regressions vs baseline"
    - production_deployed: "Epic deployed to production"
    - monitoring_configured: "Monitoring and alerts setup"

  estimated_duration: "30-60 minutes"
```

---

## instructions.md Template

```markdown
# Epic Release Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/custom/epic-release/workflow.yaml</critical>

<workflow>

<step n="1" goal="Initialize Epic Release">
  <action>Greet user: "I'm Rita, your Release Manager. I'll orchestrate the release of epic {epic_id}."</action>
  <action>Gather epic context:</action>
    - Epic ID: {epic_id}
    - Epic Version: {epic_version}
    - Package Ecosystem: {package_ecosystem}
    - Auto-promote: {auto_promote_to_production}
  <action>Display epic release plan with stages</action>
</step>

<step n="2" goal="Calculate Release Version">
  <action>Invoke task: calculate-version</action>
    - current_version: {current_production_version}
    - version_bump: "auto"
    - commit_range: "{last_release_tag}..HEAD"
    - package_ecosystem: {package_ecosystem}
  <action>Parse calculated version</action>
  <action>Display: "Release version: {current_version} → {next_version} ({bump_type})"</action>
  <action if="breaking_changes_detected">WARN: "Breaking changes detected! This will be a MAJOR release."</action>
</step>

<step n="3" goal="Deploy Epic to Staging">
  <action>Invoke workflow: deploy</action>
    - version: {epic_version}
    - environment: "staging"
    - deployment_strategy: "blue-green"
    - skip_smoke_tests: false
  <action>Capture staging URL from deployment output</action>
  <action>Display: "Epic deployed to staging: {staging_url}"</action>
</step>

<step n="4" goal="Setup Monitoring for Staging">
  <action>Invoke workflow: monitoring-setup</action>
    - environment: "staging"
    - setup_dashboards: true
    - setup_alerts: true
    - monitoring_categories: ["errors", "performance", "infrastructure"]
  <action>Display: "Monitoring configured for staging"</action>
</step>

<step n="5" goal="Run Load Tests on Staging">
  <action if="skip_load_tests is true">WARN: "Skipping load tests (not recommended for production releases)"</action>
  <action if="skip_load_tests is true">Skip to step 6</action>
  <action>Invoke workflow: load-testing</action>
    - target_url: {staging_url}
    - load_profile: "peak"  # Test at peak capacity
    - virtual_users: 200
    - duration: 600  # 10 minutes
    - success_criteria: "p95<500ms, error_rate<1%"
    - baseline_comparison: true
  <action>Parse load test results</action>
  <action if="load_tests failed">HALT: "Load tests failed. Fix performance issues before production release."</action>
  <action if="load_tests passed">Display: "✅ Load tests passed: p95={p95}ms, error_rate={error_rate}%"</action>
</step>

<step n="6" goal="Performance Profiling (Major/Minor releases)">
  <action if="bump_type is patch">Skip performance profiling for patch releases</action>
  <action if="bump_type is patch">Skip to step 7</action>
  <action>Invoke workflow: performance-profiling</action>
    - environment: "staging"
    - profiling_type: "cpu"
    - load_pattern: "peak"
    - comparison_mode: true
    - baseline_environment: "production"
  <action>Parse profiling results</action>
  <action if="regressions detected">WARN: "Performance regressions detected. Review before production."</action>
</step>

<step n="7" goal="Validate Quality Gates">
  <action>Summarize quality gate results:</action>
    ```
    Quality Gates Summary:
    - Staging Deployment: {staging_status}
    - Smoke Tests: {smoke_test_status}
    - Load Tests: {load_test_status}
    - Performance: {performance_status}
    ```
  <action if="any gate failed">HALT: "Quality gates failed. Cannot proceed to production."</action>
  <action if="all gates passed">Display: "✅ All quality gates passed. Ready for production."</action>
</step>

<step n="8" goal="Approval Gate for Production">
  <action if="auto_promote_to_production is true">Skip manual approval</action>
  <action if="auto_promote_to_production is true">Skip to step 9</action>
  <action>Ask user: "All quality gates passed. Proceed with production deployment? [y/N]"</action>
  <action if="user declines">HALT: "Production deployment cancelled by user."</action>
  <action if="user approves">Display: "Proceeding with production deployment..."</action>
</step>

<step n="9" goal="Create Release">
  <action>Invoke workflow: release</action>
    - release_version: {next_version}
    - release_type: {bump_type}
    - package_ecosystem: {package_ecosystem}
    - changelog_format: "keep-a-changelog"
    - registry_publish: true
    - create_git_tag: true
  <action>Capture release details</action>
  <action>Display: "Release created: {next_version}"</action>
</step>

<step n="10" goal="Deploy to Production">
  <action>Invoke workflow: deploy</action>
    - version: {next_version}
    - environment: "production"
    - deployment_strategy: "blue-green"  # Safe production strategy
    - skip_smoke_tests: false
  <action>Capture production URL from deployment output</action>
  <action>Display: "Deployed to production: {production_url}"</action>
</step>

<step n="11" goal="Setup Production Monitoring">
  <action>Invoke workflow: monitoring-setup</action>
    - environment: "production"
    - setup_dashboards: true
    - setup_alerts: true
    - monitoring_categories: ["errors", "performance", "infrastructure", "business"]
    - alert_thresholds:
        error_rate: 1.0  # Alert if error rate > 1%
        latency_p95: 500  # Alert if p95 > 500ms
  <action>Display: "Production monitoring configured with alerts"</action>
</step>

<step n="12" goal="Post-Production Validation">
  <action>Run production smoke tests:</action>
    - Health check: {production_url}/health
    - API tests: Critical endpoints
    - Integration tests: Key user flows
  <action if="any smoke test fails">CRITICAL: "Production smoke tests failed! Consider rollback."</action>
  <action>Monitor production for 10 minutes:</action>
    - Error rate: {error_rate}%
    - p95 latency: {p95}ms
    - Traffic: {rps} req/s
  <action>Display real-time production metrics</action>
</step>

<step n="13" goal="Update Release Status">
  <action>Invoke task: update-deployment-status</action>
    - environment: "production"
    - version: {next_version}
    - status: "deployed"
    - deployment_strategy: "blue-green"
    - deployed_by: "rita"
  <action>Invoke task: update-release-status</action>
    - release_version: {next_version}
    - release_type: {bump_type}
    - package_ecosystem: {package_ecosystem}
  <action>Update epic deployment status:</action>
    - epic_id: {epic_id}
    - version: {next_version}
    - environment: "production"
    - status: "deployed"
    - validation: {quality_gates_status}
</step>

<step n="14" goal="Epic Release Summary">
  <action>Display comprehensive release summary:</action>
    ```
    🎉 Epic Release Complete: {epic_id}

    **Release Version:** {next_version} ({bump_type})
    **Epic Version:** {epic_version}

    **Staging Validation:**
    - Staging URL: {staging_url}
    - Load Tests: {load_test_status}
    - Performance: {performance_status}

    **Production Deployment:**
    - Production URL: {production_url}
    - Deployment Strategy: blue-green
    - Smoke Tests: {prod_smoke_test_status}
    - Current Metrics:
      - Error Rate: {error_rate}%
      - p95 Latency: {p95}ms
      - RPS: {rps}

    **Release Artifacts:**
    - Git Tag: v{next_version}
    - Registry: {registry_url}
    - Changelog: CHANGELOG.md

    **Next Steps:**
    - Monitor production for 24 hours
    - Schedule post-release review
    - Document lessons learned
    ```
  <action>Workflow complete ✅</action>
</step>

</workflow>
```

---

## checklist.md Template

```markdown
# Epic Release Checklist

## Pre-Release (Staging)

- [ ] Epic is complete (all stories DONE)
- [ ] Epic retrospective completed
- [ ] Epic version tagged in git
- [ ] Staging environment ready
- [ ] Deployment credentials configured

## Staging Validation

- [ ] Epic deployed to staging successfully
- [ ] Staging smoke tests passed
- [ ] Monitoring setup in staging
- [ ] Load tests executed (peak profile)
- [ ] Load test SLA met (p95<500ms, error<1%)
- [ ] Performance profiling completed (major/minor)
- [ ] No performance regressions detected
- [ ] Security scan completed (if applicable)

## Production Approval

- [ ] All quality gates passed
- [ ] Breaking changes documented (if any)
- [ ] Changelog generated and reviewed
- [ ] Rollback plan documented
- [ ] On-call team notified
- [ ] Manual approval obtained (if required)

## Production Deployment

- [ ] Release version calculated
- [ ] Release created and tagged
- [ ] Package published to registry
- [ ] Production deployment executed
- [ ] Blue-green deployment completed
- [ ] Production smoke tests passed
- [ ] Production monitoring configured
- [ ] Alerts configured and tested

## Post-Deployment

- [ ] Production metrics stable (10 min observation)
- [ ] Error rate < 1%
- [ ] p95 latency < 500ms
- [ ] No customer complaints
- [ ] Deployment status updated
- [ ] Release status updated
- [ ] Epic marked as deployed
- [ ] Team notified of successful release

## Post-Release (24-48 hours)

- [ ] Production stable for 24 hours
- [ ] No incidents triggered
- [ ] Performance metrics baseline updated
- [ ] Post-release review scheduled
- [ ] Lessons learned documented
```

---

## Usage Example

### Invoke epic release workflow

```bash
bmad-cli invoke bmi/custom/epic-release \
  --epic-id "EPIC-001-user-auth" \
  --epic-version "epic-user-auth-v1" \
  --package-ecosystem "nodejs_npm" \
  --auto-promote-to-production false
```

### From BMM retrospective workflow

```yaml
# Add to bmad/bmm/workflows/retrospective/instructions.md
<step n="final" goal="Optional: Release Epic">
  <action>Ask user: "Epic complete. Release to production? [y/N]"</action>
  <action if="user confirms">Invoke BMI workflow:</action>
    - workflow: bmad/bmi/workflows/custom/epic-release
    - epic_id: {epic_id}
    - epic_version: {epic_version}
</step>
```

---

## Related Workflows

- **deploy**: Core deployment workflow
- **load-testing**: Application load testing
- **performance-profiling**: Performance analysis
- **monitoring-setup**: Monitoring configuration
- **release**: Software release management
- **rollback**: Rollback to previous version

---

## Customization

### Add Custom Quality Gates

```xml
<step n="N" goal="Custom Quality Gate">
  <action>Run custom validation:</action>
    - Database migration verification
    - Feature flag validation
    - A/B test configuration
    - Third-party integration tests
</step>
```

### Add Epic-Specific Validations

```yaml
epic_validations:
  user_auth:
    - oauth_providers_configured: true
    - jwt_secret_rotated: true
    - rate_limiting_configured: true
```
