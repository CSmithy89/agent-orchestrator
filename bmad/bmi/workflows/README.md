# BMI Workflows

BMI provides 10 production-ready workflows for deployment, release, and performance management. All workflows follow BMAD Method v6 conventions and are battle-tested for reliability.

---

## Workflow Categories

| Category | Workflows | Primary Agent |
|----------|-----------|---------------|
| **Deployment** | deploy, rollback, container-build, monitoring-setup, incident-response | Diana |
| **Release** | release, changelog-generation, hotfix | Rita |
| **Performance** | performance-profiling, load-testing | Phoenix |

---

## Deployment Workflows

### deploy

**Purpose:** Deploy applications to any environment
**Agent:** Diana (DevOps Engineer)
**Duration:** 10-20 minutes
**Platforms:** 15+ (Vercel, Railway, Heroku, Kubernetes, Docker, AWS, GCP, Azure, etc.)

**Capabilities:**
- Auto-detect deployment platform from config files
- Multiple deployment strategies (Rolling, Blue-Green, Canary, Recreate)
- Automated smoke tests (6 categories)
- Deployment status tracking with DORA metrics
- Environment-specific configuration

**Inputs:**
- `version` - Version to deploy
- `environment` - Target environment (dev, staging, production)
- `deployment_strategy` - Strategy to use (default: rolling)
- `skip_smoke_tests` - Skip smoke tests (not recommended)

**Outputs:**
- `deployment_status` - Success or failure
- `deployment_url` - URL of deployed application
- `smoke_test_results` - Test results summary

**Usage:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.2.3" \
  --environment production \
  --deployment-strategy blue-green
```

**See:** [5-deployment/deploy/](5-deployment/deploy/)

---

### rollback

**Purpose:** Rollback to previous stable version
**Agent:** Diana (DevOps Engineer)
**Duration:** 5-10 minutes
**Strategies:** Rolling, Blue-Green Instant, Canary Revert

**Capabilities:**
- Instant rollback for production incidents
- Multiple rollback strategies based on current deployment
- Automatic verification and smoke tests
- Rollback history tracking
- Incident correlation

**Inputs:**
- `rollback_reason` - Reason for rollback (required)
- `rollback_target` - Version to rollback to ("previous" or specific version)
- `environment` - Target environment
- `rollback_strategy` - Strategy to use (auto-detected)

**Outputs:**
- `rollback_status` - Success or failure
- `rollback_url` - URL of rolled-back application
- `rollback_time` - Time taken for rollback

**Usage:**
```bash
bmad-cli invoke bmi/rollback \
  --rollback-reason "High error rate detected" \
  --rollback-target "previous" \
  --environment production
```

**See:** [5-deployment/rollback/](5-deployment/rollback/)

---

### container-build

**Purpose:** Build and publish container images
**Agent:** Diana (DevOps Engineer)
**Duration:** 5-15 minutes
**Registries:** Docker Hub, ECR, GCR, GHCR, ACR

**Capabilities:**
- Multi-stage Docker builds
- Security scanning with Trivy
- Multi-architecture builds (ARM + x86_64)
- Image optimization and layer caching
- Registry publishing with tagging

**Inputs:**
- `dockerfile_path` - Path to Dockerfile (default: ./Dockerfile)
- `image_name` - Image name
- `image_tag` - Image tag (default: latest)
- `registry` - Target registry
- `scan_for_vulnerabilities` - Run security scan (default: true)

**Outputs:**
- `build_status` - Success or failure
- `image_url` - Full image URL with tag
- `vulnerability_scan_results` - Security scan summary

**Usage:**
```bash
bmad-cli invoke bmi/container-build \
  --image-name "myapp" \
  --image-tag "1.2.3" \
  --registry "docker.io/myorg"
```

**See:** [5-deployment/container-build/](5-deployment/container-build/)

---

### monitoring-setup

**Purpose:** Configure monitoring, dashboards, and alerts
**Agent:** Diana (DevOps Engineer)
**Duration:** 10-20 minutes
**Providers:** Datadog, New Relic, Prometheus/Grafana, CloudWatch, Azure Monitor

**Capabilities:**
- Auto-detect monitoring provider
- 5 monitoring categories (errors, performance, infrastructure, business, security)
- Dashboard creation (3 standard dashboards)
- Alert configuration (5+ standard alerts)
- Health check setup

**Inputs:**
- `environment` - Target environment
- `application_name` - Application name
- `monitoring_categories` - Categories to monitor (array)
- `setup_dashboards` - Create dashboards (default: true)
- `setup_alerts` - Configure alerts (default: true)
- `alert_thresholds` - Custom alert thresholds (object)

**Outputs:**
- `dashboard_url` - URL to monitoring dashboard
- `alerts_configured` - Number of alerts configured
- `monitoring_provider` - Detected provider

**Usage:**
```bash
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --application-name "myapp" \
  --monitoring-categories '["errors","performance","infrastructure"]'
```

**See:** [5-deployment/monitoring-setup/](5-deployment/monitoring-setup/)

---

### incident-response

**Purpose:** Manage production incidents with runbooks
**Agent:** Diana (DevOps Engineer)
**Duration:** Varies
**Severity Levels:** P0 (Critical) to P4 (Informational)

**Capabilities:**
- P0-P4 severity classification
- 7 pre-built runbooks (service_down, high_error_rate, high_latency, etc.)
- MTTR tracking (detection, response, mitigation, resolution)
- Auto-rollback decision tree
- Post-incident review (PIR) generation

**Inputs:**
- `incident_description` - Description of the incident
- `severity` - P0, P1, P2, P3, or P4
- `affected_service` - Service affected
- `environment` - Environment (usually production)

**Outputs:**
- `incident_id` - Generated incident ID
- `mttr` - Mean time to recovery
- `resolution_type` - rollback, hotfix, or mitigation
- `pir_document` - Post-incident review template

**Usage:**
```bash
bmad-cli invoke bmi/incident-response \
  --incident-description "API returning 500 errors" \
  --severity P0 \
  --affected-service "api" \
  --environment production
```

**See:** [5-deployment/incident-response/](5-deployment/incident-response/)

---

### performance-profiling

**Purpose:** Profile application performance and identify bottlenecks
**Agent:** Phoenix (Performance Engineer)
**Duration:** 15-30 minutes
**Profiling Types:** CPU, Memory, I/O, Network, Database, Threads

**Capabilities:**
- 12 profiling tools across 8 languages
- 6 profiling types
- Flamegraph generation and visualization
- Bottleneck detection (6 categories)
- Optimization recommendations
- Baseline comparison

**Inputs:**
- `environment` - Target environment
- `profiling_type` - Type of profiling (cpu, memory, io, etc.)
- `load_pattern` - Load pattern during profiling (baseline, peak)
- `comparison_mode` - Compare with baseline (default: false)

**Outputs:**
- `profiling_report` - Detailed profiling report
- `flamegraph_url` - URL to flamegraph visualization
- `bottlenecks` - List of identified bottlenecks
- `optimization_recommendations` - Recommendations

**Usage:**
```bash
bmad-cli invoke bmi/performance-profiling \
  --environment staging \
  --profiling-type cpu \
  --load-pattern peak \
  --comparison-mode true
```

**See:** [5-deployment/performance-profiling/](5-deployment/performance-profiling/)

---

## Release Workflows

### release

**Purpose:** Create and publish software releases
**Agent:** Rita (Release Manager)
**Duration:** 15-30 minutes
**Ecosystems:** 8 (Node.js, Python, Rust, .NET, Ruby, Go, Java, PHP)

**Capabilities:**
- Semantic versioning with auto-calculation
- 8 package ecosystem support
- 7 registry publishing (npm, PyPI, crates.io, NuGet, RubyGems, Maven, Packagist)
- Changelog generation (4 formats)
- Git tag creation
- Release notes generation

**Inputs:**
- `release_version` - Version to release ("auto" for auto-calculation)
- `release_type` - major, minor, patch, or "auto"
- `package_ecosystem` - Ecosystem (nodejs_npm, python_pypi, etc.)
- `changelog_format` - Format (keep-a-changelog, conventional-commits, etc.)
- `registry_publish` - Publish to registry (default: true)
- `create_git_tag` - Create git tag (default: true)

**Outputs:**
- `release_version` - Final release version
- `registry_url` - URL to published package
- `git_tag` - Created git tag
- `changelog` - Generated changelog

**Usage:**
```bash
bmad-cli invoke bmi/release \
  --release-version auto \
  --release-type auto \
  --package-ecosystem nodejs_npm \
  --changelog-format keep-a-changelog
```

**See:** [6-release/release/](6-release/release/)

---

### changelog-generation

**Purpose:** Generate changelogs from commits and PRs
**Agent:** Rita (Release Manager)
**Duration:** 5-10 minutes
**Formats:** 4 (Keep a Changelog, Conventional Commits, GitHub Releases, Custom)

**Capabilities:**
- Conventional commit parsing
- 4 changelog format support
- Breaking changes detection
- PR integration and attribution
- Contributor listing
- Multi-release changelog

**Inputs:**
- `commit_range` - Git commit range (e.g., "v1.2.3..HEAD")
- `changelog_format` - Output format
- `output_file` - File to write changelog (default: CHANGELOG.md)
- `append_mode` - Append to existing file (default: true)

**Outputs:**
- `changelog_content` - Generated changelog
- `breaking_changes` - List of breaking changes
- `contributors` - List of contributors

**Usage:**
```bash
bmad-cli invoke bmi/changelog-generation \
  --commit-range "v1.2.3..HEAD" \
  --changelog-format keep-a-changelog \
  --output-file CHANGELOG.md
```

**See:** [6-release/changelog-generation/](6-release/changelog-generation/)

---

### hotfix

**Purpose:** Emergency hotfix releases with fast-track mode
**Agent:** Rita (Release Manager)
**Duration:** 10-15 minutes
**Safety:** Tests ALWAYS run (cannot be disabled)

**Capabilities:**
- Fast-track mode for critical issues
- Tests ALWAYS enforced (safety feature)
- Auto-deployment option
- Incident tracking integration
- Emergency mode for P0 incidents

**Inputs:**
- `hotfix_description` - Description of the hotfix
- `base_version` - Current production version
- `incident_id` - Related incident ID (optional)
- `fast_track` - Enable fast-track mode (default: true)
- `auto_deploy` - Auto-deploy after tests pass (default: false)

**Outputs:**
- `hotfix_version` - Hotfix version number
- `deployment_status` - Deployment status if auto-deployed
- `test_results` - Test execution results

**Usage:**
```bash
bmad-cli invoke bmi/hotfix \
  --hotfix-description "Fix null pointer in payment API" \
  --base-version "1.2.3" \
  --fast-track true \
  --auto-deploy true
```

**See:** [6-release/hotfix/](6-release/hotfix/)

---

### load-testing

**Purpose:** Load test applications with various load profiles
**Agent:** Phoenix (Performance Engineer)
**Duration:** 10-60 minutes
**Tools:** 5 (Artillery, k6, Locust, JMeter, Gatling)

**Capabilities:**
- 5 load testing tools support
- 5 load profiles (baseline, peak, stress, spike, soak)
- Real-time metrics monitoring
- Success criteria validation
- Bottleneck identification
- Baseline comparison

**Inputs:**
- `target_url` - URL to load test
- `load_profile` - Profile to use (baseline, peak, stress, spike, soak)
- `virtual_users` - Number of virtual users (optional, profile default used)
- `duration` - Test duration in seconds (optional, profile default used)
- `success_criteria` - SLA criteria (e.g., "p95<500ms,error_rate<1%")
- `baseline_comparison` - Compare with baseline (default: false)

**Outputs:**
- `load_test_report` - Detailed test report
- `performance_metrics` - p50, p95, p99 latency, throughput, error rate
- `success_status` - Pass or fail based on criteria
- `bottlenecks` - Identified bottlenecks if criteria failed

**Usage:**
```bash
bmad-cli invoke bmi/load-testing \
  --target-url "https://staging.myapp.com" \
  --load-profile peak \
  --virtual-users 200 \
  --duration 600 \
  --success-criteria "p95<500ms,error_rate<1%"
```

**See:** [6-release/load-testing/](6-release/load-testing/)

---

## Workflow Structure

Every BMI workflow follows the same structure:

```
workflow-name/
├── workflow.yaml       # Workflow configuration
├── instructions.md     # Step-by-step execution instructions
├── checklist.md        # Quality checklist
└── README.md           # Workflow documentation (optional)
```

### workflow.yaml

Defines workflow metadata, inputs, outputs, and configuration:

```yaml
workflow:
  name: "workflow-name"
  description: "Brief description"
  category: "deployment" # or "release"
  agent: "diana" # or "rita" or "phoenix"

  inputs:
    input_name:
      description: "Input description"
      required: true
      default: "default value"

  outputs:
    output_name:
      description: "Output description"
      type: "string"
```

### instructions.md

Contains step-by-step workflow execution logic in XML format:

```xml
<workflow>
  <step n="1" goal="Initialize">
    <action>Greet user</action>
    <action>Gather inputs</action>
  </step>
  <!-- More steps -->
</workflow>
```

### checklist.md

Pre-flight, execution, and post-execution checklists:

```markdown
## Pre-Execution
- [ ] Check 1
- [ ] Check 2

## Execution
- [ ] Step 1
- [ ] Step 2

## Post-Execution
- [ ] Verification 1
- [ ] Verification 2
```

---

## Workflow Invocation

### From Command Line

```bash
bmad-cli invoke bmi/<workflow-name> \
  --input1 value1 \
  --input2 value2
```

### From BMM Workflows

```yaml
<step n="N" goal="Invoke BMI Workflow">
  <action>Invoke BMI workflow: <workflow-name></action>
    - input1: {value1}
    - input2: {value2}
</step>
```

### From CI/CD

```yaml
# GitHub Actions
- name: Deploy with BMI
  run: |
    bmad-cli invoke bmi/deploy \
      --version ${{ github.sha }} \
      --environment production
```

---

## Creating Custom Workflows

BMI provides templates for creating custom workflows. See [../templates/README.md](../templates/README.md) for details.

### Quick Start

```bash
# Copy template
cp bmad/bmi/templates/basic-deploy-template.md \
   bmad/bmi/workflows/custom/my-workflow/

# Customize workflow.yaml, instructions.md, checklist.md
# Test workflow
bmad-cli invoke bmi/custom/my-workflow --dry-run

# Use workflow
bmad-cli invoke bmi/custom/my-workflow --input value
```

---

## Workflow Best Practices

1. **Always validate inputs** - Check required inputs in step 1
2. **Provide clear status updates** - Display progress at each step
3. **Handle errors gracefully** - Provide actionable error messages
4. **Update status tracking** - Always update deployment/release status files
5. **Follow security best practices** - Never log secrets, use environment variables

---

## Support

- **Main Documentation**: [../README.md](../README.md)
- **Agents**: [../agents/README.md](../agents/README.md)
- **Tasks**: [../tasks/README.md](../tasks/README.md)
- **Templates**: [../templates/README.md](../templates/README.md)

---

**Last Updated:** 2025-11-15
