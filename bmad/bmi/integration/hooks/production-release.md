# Production Release Integration Hook

**Hook Type:** Release Integration
**Trigger:** Manual or scheduled software release
**BMI Workflows Available:** release, changelog-generation, deploy
**Auto-Trigger:** false (manual approval required)

---

## Purpose

Orchestrate complete production release including version bump, changelog generation, package publishing, and deployment.

---

## Release Process Overview

```
Pre-Release (Quality Gates) ✅
  → Release Creation
    → Changelog Generation
      → Version Bump
        → Package Publishing
          → Production Deployment
            → Monitoring and Validation
```

---

## Complete Release Flow

### 1. Pre-Release Quality Gates (from pre-release-gates.md)
- Load testing
- Performance profiling
- Container builds

### 2. Changelog Generation
```yaml
workflow: changelog-generation
inputs:
  version: "{new_version}"
  since_tag: "{current_version}"
  format: "keep-a-changelog"  # or conventional-commits
  include_prs: true
  breaking_changes_section: true
```

### 3. Release Creation
```yaml
workflow: release
inputs:
  version_bump: "minor"  # or major, patch
  release_branch: "main"
  release_type: "stable"
  publish_registries: ["npm", "docker"]  # Package-specific
  skip_tests: false  # NEVER skip
  skip_build: false  # NEVER skip
```

### 4. Production Deployment
```yaml
workflow: deploy
inputs:
  version: "{new_version}"
  environment: "production"
  deployment_strategy: "blue-green"  # Safer for production
  run_smoke_tests: true
  rollback_on_failure: true
```

---

## How to Create a Production Release

### Option 1: From BMM Manual Release Workflow

Create a new BMM workflow for releases:

```xml
<!-- bmad/bmm/workflows/create-release/instructions.md -->
<workflow>
  <step n="1" goal="Initialize Release">
    <action>Determine version bump: major/minor/patch</action>
    <action>Verify main branch is stable and tests pass</action>
  </step>

  <step n="2" goal="Run Pre-Release Quality Gates">
    <action>Invoke pre-release-gates (load testing, profiling, container build)</action>
    <action if="gates fail">HALT: Fix quality issues before releasing</action>
  </step>

  <step n="3" goal="Generate Changelog">
    <action>Invoke BMI changelog-generation workflow</action>
    <action>Review and approve changelog</action>
  </step>

  <step n="4" goal="Create Release">
    <action>Invoke BMI release workflow</action>
    <action>Wait for package publishing to complete</action>
    <action>Verify package accessible on registries</action>
  </step>

  <step n="5" goal="Deploy to Production">
    <action>Ask for production deployment approval</action>
    <action if="approved">Invoke BMI deploy workflow (production)</action>
    <action>Monitor deployment progress</action>
    <action>Run post-deployment validation</action>
  </step>

  <step n="6" goal="Post-Release Monitoring">
    <action>Monitor for 1 hour post-deployment</action>
    <action>Check error rates and latency</action>
    <action>Verify no customer-reported issues</action>
  </step>

  <step n="7" goal="Release Communication">
    <action>Announce release to team</action>
    <action>Update documentation</action>
    <action>Create blog post (if major release)</action>
  </step>
</workflow>
```

### Option 2: Automated Release (CI/CD)

```yaml
# .github/workflows/release.yml
name: Production Release
on:
  workflow_dispatch:
    inputs:
      version_bump:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - major
          - minor
          - patch

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Run load tests
        run: bmad-cli invoke bmi/load-testing --load-profile peak

  release:
    needs: quality-gates
    runs-on: ubuntu-latest
    steps:
      - name: Generate changelog
        run: bmad-cli invoke bmi/changelog-generation

      - name: Create release
        run: bmad-cli invoke bmi/release --version-bump ${{ inputs.version_bump }}

  deploy:
    needs: release
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: bmad-cli invoke bmi/deploy --environment production
```

---

## Release Approval Gates

### Required Approvals

| Gate | Approver | Required |
|------|----------|----------|
| Quality gates pass | Automated | ✅ Yes |
| Changelog reviewed | Release Manager | ✅ Yes |
| Production deployment | Engineering Lead | ✅ Yes |
| Major version bump | Product Manager | ⚠️ Major only |

---

## Release Types and Strategies

### Major Release (1.x.x → 2.0.0)
- **Quality Gates:** All required (load testing, profiling, container build)
- **Deployment Strategy:** Blue-green with extended canary (10% → 50% → 100%)
- **Monitoring:** Enhanced monitoring for 24 hours
- **Approvals:** Product Manager + Engineering Lead
- **Communication:** Blog post, customer email, documentation update

### Minor Release (x.1.x → x.2.0)
- **Quality Gates:** Load testing + container build
- **Deployment Strategy:** Blue-green
- **Monitoring:** Enhanced monitoring for 1 hour
- **Approvals:** Engineering Lead
- **Communication:** Release notes, team announcement

### Patch Release (x.x.1 → x.x.2)
- **Quality Gates:** Load testing (baseline profile)
- **Deployment Strategy:** Rolling update
- **Monitoring:** Standard monitoring
- **Approvals:** Release Manager
- **Communication:** Release notes

### Hotfix (Emergency)
- **Quality Gates:** Minimal (smoke tests only)
- **Deployment Strategy:** Immediate rolling (or blue-green if time permits)
- **Monitoring:** Enhanced monitoring for 1 hour
- **Approvals:** On-call engineer (fast-track)
- **Communication:** Incident resolution notice

---

## Status Tracking

```yaml
# bmad/bmi/integration/status/release-status.yaml
releases:
  - version: "1.3.0"
    type: "minor"
    status: "deployed"
    created_at: "2025-11-15T10:00:00Z"
    deployed_at: "2025-11-15T11:30:00Z"
    quality_gates:
      load_testing: "passed"
      performance_profiling: "passed"
      container_build: "passed"
    deployment:
      environment: "production"
      strategy: "blue-green"
      status: "success"
    registries:
      - name: "npm"
        url: "https://npmjs.com/package/myapp/v/1.3.0"
      - name: "docker"
        url: "https://hub.docker.com/r/myapp/tags/1.3.0"
```

---

## Rollback Plan

If release causes issues:

1. **Immediate:** Invoke `rollback` workflow to previous version
2. **Monitor:** Check if rollback resolves issue
3. **Hotfix:** If rollback doesn't resolve, create hotfix
4. **Post-Mortem:** Conduct post-incident review

---

## Configuration

```yaml
# bmad/bmi/integration/bmi-integration.yaml
release:
  description: "Create and publish software release"
  trigger: "Manual or scheduled release workflow"
  available_workflows:
    - release: "Create semantic version release with changelog"
    - changelog-generation: "Generate changelog from commits/PRs"
    - deploy: "Deploy release to production"
  auto_trigger: false  # Manual approval required
  require_quality_gates: true
```
