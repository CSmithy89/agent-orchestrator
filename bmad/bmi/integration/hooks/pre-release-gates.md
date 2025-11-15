# Pre-Release Quality Gates Hook

**Hook Type:** Pre-Release Integration
**Trigger:** Before creating a software release
**BMI Workflows Available:** load-testing, performance-profiling, container-build
**Auto-Trigger:** true (quality gates must pass)

---

## Purpose

Before creating a production release, run quality gates to ensure performance, stability, and container images are ready.

---

## Quality Gates

1. **Load Testing** - Validate performance under peak load
2. **Performance Profiling** - Identify any performance regressions
3. **Container Build** - Build and scan production container images

---

## When to Use

- Before creating a major/minor release
- Before deploying to production
- As part of release approval process
- For release candidates (RC)

---

## Integration Flow

```
Release Initiated
  → Pre-Release Quality Gates
    ├─ Load Testing (REQUIRED)
    │   - Profile: peak
    │   - Success criteria: p95<500ms, error_rate<1%
    │   - Duration: 10 minutes
    │
    ├─ Performance Profiling (OPTIONAL for major releases)
    │   - Profile application under load
    │   - Identify bottlenecks
    │   - Compare to baseline
    │
    └─ Container Build (if containerized)
        - Build production images
        - Vulnerability scan with Trivy
        - Tag with release version

  → All gates pass? → Proceed with release
  → Any gate fails? → Halt release, fix issues
```

---

## How to Invoke from BMM Release Process

### Add to beginning of `release` workflow

```xml
<step n="1" goal="Run Pre-Release Quality Gates">
  <action>Before creating release, run quality gates</action>

  <!-- 1. Load Testing (REQUIRED) -->
  <workflow name="load-testing">
    - target_url: {staging_url}
    - load_profile: peak
    - virtual_users: 200
    - duration: 600  # 10 minutes
    - success_criteria:
        p95_latency: 500  # ms
        error_rate: 1.0   # %
        throughput: 100   # req/s
    - baseline_comparison: true
    - halt_on_failure: true  # Stop release if load test fails
  </workflow>

  <!-- 2. Performance Profiling (OPTIONAL for major releases) -->
  <action if="version_bump is major or minor">
    <workflow name="performance-profiling">
      - profiling_target: {staging_url}
      - environment: staging
      - profiling_type: cpu  # or memory, io
      - profiling_duration: 60
      - baseline_comparison: true
    </workflow>
  </action>

  <!-- 3. Container Build (if applicable) -->
  <action if="container_based_deployment">
    <workflow name="container-build">
      - dockerfile_path: "./Dockerfile"
      - image_name: "{app_name}"
      - image_tag: "{release_version}"
      - target_registries: ["docker", "ecr"]
      - scan_vulnerabilities: true
      - multi_platform: true  # linux/amd64, linux/arm64
    </workflow>
  </action>

  <action if="all gates pass">Proceed with release creation</action>
  <action if="any gate fails">HALT: Fix quality gate failures before releasing</action>
</step>
```

---

## Success Criteria Matrix

| Gate | Required | Success Criteria | Halt on Fail |
|------|----------|------------------|--------------|
| Load Testing | ✅ Yes | p95<500ms, error<1%, throughput>100 req/s | ✅ Yes |
| Performance Profiling | ⚠️ Major/Minor only | No regressions vs baseline | ❌ No (warn only) |
| Container Build | ⚠️ If containerized | Vulnerability scan PASS | ✅ Yes |

---

## Configuration

```yaml
# bmad/bmi/integration/bmi-integration.yaml
pre_release:
  description: "Before creating a release, run quality gates"
  trigger: "bmm:create-story workflow with release flag"
  available_workflows:
    - load-testing: "Run load tests before release"
    - performance-profiling: "Profile application performance"
    - container-build: "Build production container images"
  auto_trigger: true  # Always run quality gates
  halt_on_failure: true  # Stop release if gates fail
```

---

## Example: Quality Gates Report

```markdown
# Pre-Release Quality Gates Report
**Release Version:** 1.3.0
**Date:** 2025-11-15

## Quality Gate Results

### 1. Load Testing ✅ PASSED
- Profile: peak (200 VUs, 10 min)
- p95 latency: 420ms (threshold: <500ms) ✅
- Error rate: 0.3% (threshold: <1%) ✅
- Throughput: 145 req/s (threshold: >100 req/s) ✅

### 2. Performance Profiling ✅ PASSED
- Profiling type: CPU
- Hot functions: No regressions detected
- Baseline comparison: +2% latency (acceptable)

### 3. Container Build ✅ PASSED
- Image: myapp:1.3.0
- Vulnerability scan: 0 critical, 2 medium (acceptable)
- Pushed to: Docker Hub, AWS ECR

## Recommendation
✅ **APPROVED FOR RELEASE**
All quality gates passed. Safe to proceed with release 1.3.0.
```

---

## Bypass Override (Emergency Only)

For emergency hotfixes, quality gates can be bypassed:

```yaml
# ONLY for P0 hotfixes
bypass_quality_gates: true
bypass_reason: "Emergency P0 hotfix for production outage"
skip_load_testing: true  # NOT RECOMMENDED
run_minimal_smoke_tests: true  # Minimum safety
```

**WARNING:** Bypassing quality gates significantly increases risk. Only use for emergency hotfixes with explicit approval.
