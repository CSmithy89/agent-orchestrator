# BMI - BMAD Method Infrastructure & DevOps Module

**BMI (BMAD Method Infrastructure)** is a comprehensive Infrastructure & DevOps module that extends the BMAD Method with deployment, release management, monitoring, and incident response capabilities.

> **Version:** 1.0.0
> **Status:** Production Ready
> **BMAD Core Version:** 6.x
> **License:** MIT

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Agents](#agents)
- [Workflows](#workflows)
- [Tasks](#tasks)
- [Templates](#templates)
- [Integration with BMM](#integration-with-bmm)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [DORA Metrics](#dora-metrics)
- [Contributing](#contributing)

---

## Overview

BMI provides a complete Infrastructure & DevOps solution for the BMAD Method, enabling automated deployments, releases, monitoring, and incident response across multiple platforms and environments.

### Why BMI?

- **🚀 Automated Deployments** - Deploy to 15+ platforms with a single command
- **📦 Multi-Ecosystem Releases** - Support for 8 package ecosystems and 7 registries
- **📊 Built-in Monitoring** - Integrated monitoring with 5 major providers
- **🔥 Incident Response** - Automated incident management with runbooks and MTTR tracking
- **⚡ Performance Analysis** - Load testing and performance profiling
- **🔄 BMM Integration** - Seamless integration with BMM development workflows
- **📈 DORA Metrics** - Automated tracking of deployment frequency, lead time, MTTR, and change failure rate

---

## Features

### Deployment Capabilities

- **Multi-Platform Support**: Vercel, Railway, Heroku, Kubernetes, Docker, Netlify, Fly.io, Cloudflare Pages, AWS, GCP, Azure
- **Deployment Strategies**: Rolling, Blue-Green, Canary, Recreate
- **Automated Smoke Tests**: Health checks, API tests, UI tests, database connectivity, auth, integration
- **Rollback Support**: Instant rollback to previous stable versions
- **Container Builds**: Multi-stage builds with security scanning and optimization

### Release Management

- **Semantic Versioning**: Auto-calculation from conventional commits
- **Multi-Ecosystem Publishing**: npm, PyPI, crates.io, NuGet, RubyGems, Maven Central, Packagist
- **Changelog Generation**: 4 formats (Keep a Changelog, Conventional Commits, GitHub Releases, Custom)
- **Hotfix Workflows**: Fast-track emergency releases with tests ALWAYS enforced
- **Release Notes**: Automated generation with breaking changes and contributors

### Monitoring & Observability

- **Monitoring Providers**: Datadog, New Relic, Prometheus + Grafana, AWS CloudWatch, Azure Monitor, Sentry
- **Dashboard Creation**: Application overview, performance, infrastructure dashboards
- **Alert Configuration**: Error rate, latency, CPU, memory, service health alerts
- **Performance Profiling**: CPU, memory, I/O, network, database, thread profiling
- **Load Testing**: Artillery, k6, Locust, JMeter, Gatling with 5 load profiles

### Incident Response

- **Severity Levels**: P0 (Critical) to P4 (Informational)
- **Runbooks**: 7 pre-built runbooks for common incidents
- **MTTR Tracking**: Detection, response, mitigation, resolution times
- **Post-Incident Review**: Automated PIR template generation
- **Auto-Rollback**: Automatic rollback on deployment failures

---

## Architecture

```
bmad/bmi/
├── agents/                    # BMI Agents (Diana, Rita, Phoenix)
│   ├── diana/                 # DevOps Engineer - Deployments
│   ├── rita/                  # Release Manager - Releases
│   └── phoenix/               # Performance Engineer - Monitoring & Performance
├── workflows/                 # BMI Workflows
│   ├── 5-deployment/          # Deployment workflows
│   │   ├── deploy/            # Core deployment workflow
│   │   ├── rollback/          # Rollback workflow
│   │   ├── container-build/   # Container building
│   │   ├── monitoring-setup/  # Monitoring configuration
│   │   ├── incident-response/ # Incident management
│   │   └── performance-profiling/ # Performance analysis
│   └── 6-release/             # Release workflows
│       ├── release/           # Software release management
│       ├── changelog-generation/ # Changelog creation
│       ├── hotfix/            # Emergency hotfix releases
│       └── load-testing/      # Load testing
├── tasks/                     # Reusable tasks
│   ├── detect-platform.md     # Platform detection
│   ├── run-smoke-tests.md     # Smoke test execution
│   ├── update-deployment-status.md # Deployment status tracking
│   ├── update-release-status.md # Release status tracking
│   ├── calculate-version.md   # Version calculation
│   ├── publish-to-registry.md # Registry publishing
│   └── generate-release-notes.md # Release notes generation
├── templates/                 # Workflow templates
│   ├── basic-deploy-template.md # Basic deployment template
│   ├── epic-release-template.md # Epic release template
│   ├── monitoring-template.md # Monitoring setup template
│   └── ci-cd-integration-template.md # CI/CD integration
├── integration/               # BMM-BMI Integration
│   ├── bmi-integration.yaml   # Integration configuration
│   ├── hooks/                 # Integration hooks
│   │   ├── post-story-deploy.md
│   │   ├── post-epic-deploy.md
│   │   ├── incident-response.md
│   │   ├── pre-release-gates.md
│   │   └── production-release.md
│   └── status/                # Status tracking
│       ├── deployment-status.yaml
│       ├── release-status.yaml
│       └── incident-status.yaml
└── README.md                  # This file
```

---

## Quick Start

### Installation

BMI is installed as part of the BMAD Method. If you're starting fresh:

```bash
# Clone BMAD repository
git clone https://github.com/your-org/agent-orchestrator.git
cd agent-orchestrator

# BMI is already included in bmad/bmi/
```

### First Deployment

```bash
# Deploy to dev environment
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment dev \
  --deployment-strategy rolling
```

### First Release

```bash
# Create a release
bmad-cli invoke bmi/release \
  --release-version "1.0.0" \
  --release-type minor \
  --package-ecosystem nodejs_npm \
  --registry-publish true
```

### Setup Monitoring

```bash
# Configure monitoring
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --application-name "my-app" \
  --monitoring-categories '["errors","performance","infrastructure"]'
```

---

## Agents

BMI includes three specialized agents, each with expertise in specific domains:

### Diana - DevOps Engineer

**Role:** Deployment & Infrastructure Management
**Expertise:** Platform deployment, container orchestration, rollback strategies
**Workflows:** deploy, rollback, container-build, incident-response, monitoring-setup

Diana handles all deployment-related activities, ensuring smooth releases across multiple platforms.

**See:** [agents/diana/README.md](agents/diana/README.md)

### Rita - Release Manager

**Role:** Release Management & Coordination
**Expertise:** Version management, changelog generation, registry publishing
**Workflows:** release, changelog-generation, hotfix, load-testing

Rita orchestrates the entire release process, from version calculation to registry publishing.

**See:** [agents/rita/README.md](agents/rita/README.md)

### Phoenix - Performance Engineer

**Role:** Performance & Monitoring
**Expertise:** Load testing, performance profiling, monitoring setup
**Workflows:** load-testing, performance-profiling

Phoenix ensures applications perform optimally and are properly monitored in production.

**See:** [agents/phoenix/README.md](agents/phoenix/README.md)

---

## Workflows

BMI provides 10 production-ready workflows across deployment and release categories.

### Deployment Workflows (6)

| Workflow | Purpose | Agent | Duration |
|----------|---------|-------|----------|
| **deploy** | Deploy applications to any environment | Diana | 10-20 min |
| **rollback** | Rollback to previous stable version | Diana | 5-10 min |
| **container-build** | Build and publish container images | Diana | 5-15 min |
| **monitoring-setup** | Configure monitoring and alerts | Diana | 10-20 min |
| **incident-response** | Manage production incidents | Diana | Varies |
| **performance-profiling** | Profile application performance | Phoenix | 15-30 min |

### Release Workflows (4)

| Workflow | Purpose | Agent | Duration |
|----------|---------|-------|----------|
| **release** | Create and publish software releases | Rita | 15-30 min |
| **changelog-generation** | Generate changelogs from commits | Rita | 5-10 min |
| **hotfix** | Emergency hotfix releases | Rita | 10-15 min |
| **load-testing** | Load test applications | Phoenix | 10-60 min |

**See:** [workflows/README.md](workflows/README.md)

---

## Tasks

BMI includes 7 reusable tasks that can be invoked by workflows or used standalone:

### Deployment Tasks

- **detect-platform** - Auto-detect deployment platform (15+ platforms)
- **run-smoke-tests** - Execute smoke tests (6 categories)
- **update-deployment-status** - Update deployment status tracking

### Release Tasks

- **update-release-status** - Update release status tracking
- **calculate-version** - Calculate semantic version from commits
- **publish-to-registry** - Publish to package registries (7 registries)
- **generate-release-notes** - Generate release notes (4 formats)

**See:** [tasks/README.md](tasks/README.md)

---

## Templates

BMI provides 4 workflow templates for creating custom workflows:

- **basic-deploy-template** - Basic deployment workflow starter
- **epic-release-template** - Epic release with quality gates
- **monitoring-template** - Comprehensive monitoring setup
- **ci-cd-integration-template** - CI/CD pipeline integration

**See:** [templates/README.md](templates/README.md)

---

## Integration with BMM

BMI seamlessly integrates with BMM (BMAD Method Management) workflows, enabling deployment and release capabilities at key points in the development lifecycle.

### Integration Points

1. **Post-Story Deployment** - Deploy after story completion
2. **Post-Epic Deployment** - Deploy epic to staging after retrospective
3. **Incident Response** - Auto-trigger on production incidents
4. **Pre-Release Gates** - Quality gates before production release
5. **Production Release** - Production deployment with monitoring

### Example: Deploy After Story Completion

```yaml
# From BMM dev-story workflow
<step n="final" goal="Optional: Deploy to Environment">
  <action>Ask user: "Story complete. Deploy to dev/staging? [y/N]"</action>
  <action if="user confirms">Invoke BMI deploy workflow:</action>
    - version: {story_version}
    - environment: dev
    - deployment_strategy: rolling
</step>
```

### Example: Epic Release with Quality Gates

```yaml
# From BMM retrospective workflow
<step n="final" goal="Optional: Release Epic">
  <action>Ask user: "Epic complete. Release to production? [y/N]"</action>
  <action if="user confirms">Invoke BMI epic-release workflow:</action>
    - epic_id: {epic_id}
    - epic_version: {epic_version}
    - package_ecosystem: nodejs_npm
</step>
```

**See:** [integration/README.md](integration/README.md)

---

## Usage Examples

### Deploying to Multiple Environments

```bash
# Deploy to dev
bmad-cli invoke bmi/deploy --version "1.2.3" --environment dev

# Deploy to staging with blue-green strategy
bmad-cli invoke bmi/deploy --version "1.2.3" --environment staging --deployment-strategy blue-green

# Deploy to production (requires approval)
bmad-cli invoke bmi/deploy --version "1.2.3" --environment production --deployment-strategy blue-green
```

### Creating Releases

```bash
# Auto-calculate version from commits
bmad-cli invoke bmi/release \
  --release-version auto \
  --release-type auto \
  --package-ecosystem nodejs_npm \
  --changelog-format keep-a-changelog

# Explicit version bump
bmad-cli invoke bmi/release \
  --release-version "2.0.0" \
  --release-type major \
  --package-ecosystem python_pypi
```

### Emergency Hotfix

```bash
# Fast-track hotfix for critical bug
bmad-cli invoke bmi/hotfix \
  --hotfix-description "Fix null pointer in payment API" \
  --base-version "1.2.3" \
  --fast-track true \
  --auto-deploy true
```

### Load Testing

```bash
# Run peak load test
bmad-cli invoke bmi/load-testing \
  --target-url "https://staging.myapp.com" \
  --load-profile peak \
  --virtual-users 200 \
  --duration 600 \
  --success-criteria "p95<500ms,error_rate<1%"
```

### Incident Response

```bash
# Manual incident trigger
bmad-cli invoke bmi/incident-response \
  --incident-description "API returning 500 errors" \
  --severity P0 \
  --affected-service "api" \
  --environment production
```

### Rollback

```bash
# Rollback to previous version
bmad-cli invoke bmi/rollback \
  --rollback-reason "High error rate detected" \
  --rollback-target "previous" \
  --environment production \
  --rollback-strategy "blue-green-instant"
```

---

## Configuration

### Environment Configuration

Configure environments in `integration/bmi-integration.yaml`:

```yaml
environments:
  dev:
    url: "https://dev.myapp.com"
    auto_deploy: true
    require_approval: false
  staging:
    url: "https://staging.myapp.com"
    auto_deploy: false
    require_approval: true
  production:
    url: "https://myapp.com"
    auto_deploy: false
    require_approval: true
    require_quality_gates: true
```

### Platform Credentials

Store credentials as environment variables:

```bash
# Deployment platforms
export VERCEL_TOKEN="your-token"
export RAILWAY_TOKEN="your-token"
export HEROKU_API_KEY="your-key"

# Package registries
export NPM_TOKEN="your-token"
export PYPI_TOKEN="your-token"
export CARGO_REGISTRY_TOKEN="your-token"

# Monitoring providers
export DATADOG_API_KEY="your-key"
export NEW_RELIC_LICENSE_KEY="your-key"
```

### Alert Thresholds

Customize alert thresholds:

```yaml
alert_thresholds:
  error_rate: 1.0        # Alert if error rate > 1%
  latency_p95: 500       # Alert if p95 latency > 500ms
  cpu_usage: 80          # Alert if CPU > 80%
  memory_usage: 85       # Alert if memory > 85%
```

---

## Best Practices

### Deployment

1. **Always test in staging first** - Deploy to staging before production
2. **Use blue-green for production** - Enables instant rollback
3. **Never skip smoke tests** - Catch issues before they impact users
4. **Monitor after deployment** - Watch metrics for 10-30 minutes
5. **Document rollback plan** - Know how to rollback before deploying

### Release Management

1. **Use semantic versioning** - Follow semver for version numbers
2. **Document breaking changes** - Clearly communicate breaking changes
3. **Generate changelogs** - Keep users informed of changes
4. **Test prereleases** - Use alpha/beta/rc for testing
5. **Tag releases in git** - Always create git tags for releases

### Monitoring

1. **Setup monitoring on day 1** - Don't wait for production
2. **Configure meaningful alerts** - Avoid alert fatigue
3. **Create dashboards** - Visualize key metrics
4. **Track DORA metrics** - Measure and improve DevOps performance
5. **Review metrics regularly** - Weekly reviews of trends

### Incident Response

1. **Have runbooks ready** - Pre-define response procedures
2. **Track MTTR** - Measure and improve response times
3. **Conduct PIRs** - Learn from every incident
4. **Document action items** - Follow through on improvements
5. **Test rollback procedures** - Practice rollbacks regularly

---

## Troubleshooting

### Deployment Failures

**Problem:** Platform not detected
**Solution:** Check for platform-specific config files (vercel.json, railway.json, etc.)

**Problem:** Authentication failed
**Solution:** Verify environment variables for platform tokens are set

**Problem:** Smoke tests failing
**Solution:** Check application logs and health endpoint

### Release Failures

**Problem:** Version already exists
**Solution:** Bump version number or use auto-calculation

**Problem:** Registry publish failed
**Solution:** Verify registry token and package validation

**Problem:** Changelog generation empty
**Solution:** Ensure commits follow conventional commit format

### Monitoring Issues

**Problem:** Metrics not appearing
**Solution:** Verify monitoring provider credentials and integration

**Problem:** Alerts not firing
**Solution:** Check alert configuration and threshold values

**Problem:** Dashboard not loading
**Solution:** Verify dashboard URL and access permissions

---

## DORA Metrics

BMI automatically tracks DORA (DevOps Research and Assessment) metrics:

### Deployment Frequency

How often you deploy to production.

```yaml
deployment_metrics:
  deployment_frequency:
    per_day: 5.2
    per_week: 36.4
    per_month: 156
```

### Lead Time for Changes

Time from commit to production deployment.

```yaml
lead_time:
  average: "2.5 hours"
  p50: "1.8 hours"
  p95: "4.2 hours"
```

### Mean Time to Recovery (MTTR)

Time to recover from incidents.

```yaml
mttr:
  p0_critical: "12 minutes"
  p1_high: "45 minutes"
  overall_average: "32 minutes"
```

### Change Failure Rate

Percentage of deployments causing incidents.

```yaml
change_failure_rate:
  percentage: 2.5
  total_deployments: 156
  failed_deployments: 4
```

---

## Contributing

We welcome contributions to BMI! Here's how you can help:

### Reporting Issues

- Use GitHub Issues for bug reports
- Include workflow name, inputs, and error messages
- Provide reproduction steps

### Adding New Workflows

1. Follow BMAD Method v6 conventions
2. Include workflow.yaml, instructions.md, checklist.md
3. Add comprehensive documentation
4. Test thoroughly across platforms

### Adding Platform Support

1. Add detection logic to `tasks/detect-platform.md`
2. Add deployment commands to `workflows/deploy/`
3. Update documentation
4. Test on actual platform

---

## Support

- **Documentation**: [bmad/bmi/README.md](README.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

## License

MIT License - See [LICENSE](../../LICENSE) for details

---

## Acknowledgments

BMI is built on top of the BMAD Method v6 and integrates with BMM for seamless development-to-deployment workflows.

**Built with ❤️ by the BMAD Method Team**

---

**Version:** 1.0.0
**Last Updated:** 2025-11-15
**Status:** Production Ready
