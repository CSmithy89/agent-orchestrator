# BMI Module - Complete Analysis & Mapping

**Module:** BMI (Infrastructure & DevOps)
**Date:** 2025-11-13
**Status:** Planning Phase

---

## 📋 Module Overview

**Purpose:** Complete deployment, infrastructure, monitoring, and operations automation for BMAD projects

**Scope:** Bridge the gap between BMM Phase 4 (implementation complete) and production operations

**Integration Point:** Extends BMM workflow lifecycle with deployment and operations phases

---

## 🤖 Agents Required

### 1. Diana - DevOps Engineer 🚀

**Core Expertise:**
- Deployment strategies (blue-green, canary, rolling)
- Infrastructure as Code (Terraform, Pulumi, CDK)
- CI/CD pipeline management (GitHub Actions, GitLab CI, Jenkins)
- Container orchestration (Docker, Kubernetes, ECS)
- Cloud platforms (AWS, GCP, Azure)
- Configuration management (Ansible, Chef)

**Responsibilities:**
- Execute deployment workflows
- Provision infrastructure
- Configure CI/CD pipelines
- Monitor deployment health
- Coordinate with Rita for releases
- Handle rollbacks

**Key Workflows:**
- deployment-workflow
- infrastructure-provision
- monitoring-setup
- rollback-workflow
- incident-response

---

### 2. Rita - Release Manager 📦

**Core Expertise:**
- Version management (semantic versioning)
- Release coordination
- Changelog generation (from commits, PRs, stories)
- Release notes creation
- Deployment scheduling
- Stakeholder communication
- Release validation

**Responsibilities:**
- Orchestrate release process
- Generate changelogs and release notes
- Coordinate deployment timing
- Validate release readiness
- Manage version numbers
- Create git tags and GitHub releases

**Key Workflows:**
- release-workflow
- changelog-generation
- version-management
- release-notes-creation
- hotfix-workflow

---

### 3. Phoenix - Performance Engineer ⚡

**Core Expertise:**
- Performance profiling (Node.js, browser, database)
- Load testing (k6, Artillery, JMeter)
- Optimization strategies
- Bottleneck analysis
- Performance monitoring (New Relic, DataDog, Prometheus)
- Database query optimization
- Caching strategies
- Frontend optimization (bundle size, lazy loading)

**Responsibilities:**
- Profile application performance
- Design and execute load tests
- Identify bottlenecks
- Recommend optimizations
- Set performance baselines
- Monitor production performance

**Key Workflows:**
- performance-profiling
- load-testing-workflow
- optimization-workflow
- performance-monitoring-setup

---

## 🔄 Workflows Required

### Phase 5: Deployment Workflows

#### 1. deployment-workflow
**Purpose:** Deploy application to target environment
**Inputs:**
- Environment (dev/staging/production)
- Deployment strategy (blue-green/canary/rolling)
- Version/tag to deploy
- Configuration overrides

**Steps:**
1. Validate deployment prerequisites
2. Run pre-deployment checks
3. Execute deployment strategy
4. Run smoke tests
5. Validate deployment health
6. Update deployment records

**Outputs:**
- Deployment status
- Health check results
- Rollback instructions (if needed)

**Dependencies:**
- Git repository access
- Cloud provider credentials
- Deployment manifests/configs
- Health check endpoints

---

#### 2. rollback-workflow
**Purpose:** Safely rollback to previous version
**Inputs:**
- Environment
- Target version (or "previous")
- Rollback reason

**Steps:**
1. Identify current and target versions
2. Validate rollback safety
3. Execute rollback strategy
4. Verify rollback success
5. Document incident
6. Notify stakeholders

**Outputs:**
- Rollback status
- Incident report
- Action items for prevention

---

#### 3. infrastructure-provision
**Purpose:** Provision/update infrastructure using IaC
**Inputs:**
- Infrastructure template (Terraform/Pulumi)
- Environment
- Resource specifications
- Cost constraints

**Steps:**
1. Validate IaC syntax
2. Plan infrastructure changes
3. Review resource costs
4. Apply infrastructure changes
5. Validate resource creation
6. Update documentation

**Outputs:**
- Infrastructure state
- Resource inventory
- Cost estimates
- Access credentials

**Tools Supported:**
- Terraform
- Pulumi
- AWS CDK
- Azure Bicep

---

#### 4. monitoring-setup
**Purpose:** Configure monitoring and observability
**Inputs:**
- Application stack
- Monitoring requirements
- Alert thresholds
- Notification channels

**Steps:**
1. Install monitoring agents
2. Configure metrics collection
3. Set up dashboards
4. Configure alerts
5. Test notification flow
6. Document runbooks

**Outputs:**
- Monitoring configuration
- Dashboard URLs
- Alert rules
- Runbook documentation

**Platforms:**
- Prometheus/Grafana
- DataDog
- New Relic
- CloudWatch
- Application Insights

---

#### 5. incident-response
**Purpose:** Structured debugging and hotfix workflow
**Inputs:**
- Incident description
- Severity level
- Affected environment
- User impact

**Steps:**
1. Assess incident severity
2. Gather diagnostic data
3. Identify root cause
4. Implement immediate fix (hotfix)
5. Deploy emergency patch
6. Post-mortem analysis
7. Prevent recurrence

**Outputs:**
- Incident report
- Root cause analysis
- Hotfix details
- Prevention action items

---

### Phase 6: Release Management Workflows

#### 6. release-workflow
**Purpose:** Complete release orchestration
**Inputs:**
- Release type (major/minor/patch)
- Release branch
- Target date
- Release notes draft

**Steps:**
1. Validate release readiness
2. Bump version numbers
3. Generate changelog
4. Create release notes
5. Create git tag
6. Build release artifacts
7. Create GitHub release
8. Deploy to production
9. Announce release

**Outputs:**
- Version number
- Git tag
- Release notes
- Changelog
- Deployment status

**Integrates with:**
- BMM sprint-planning (story status)
- BMM retrospective (epic completion)
- deployment-workflow

---

#### 7. changelog-generation
**Purpose:** Auto-generate changelog from git history
**Inputs:**
- From version/tag
- To version/tag (or HEAD)
- Changelog format (Keep a Changelog, Angular, Custom)

**Steps:**
1. Parse git commits between versions
2. Categorize changes (features, fixes, breaking)
3. Link to PRs and stories
4. Format according to convention
5. Add manual entries (if needed)
6. Update CHANGELOG.md

**Outputs:**
- Formatted changelog
- Updated CHANGELOG.md file

**Conventions Supported:**
- Keep a Changelog
- Conventional Commits
- Angular style
- Custom templates

---

#### 8. hotfix-workflow
**Purpose:** Emergency production fix
**Inputs:**
- Issue description
- Severity
- Affected versions

**Steps:**
1. Create hotfix branch
2. Implement fix
3. Run critical tests
4. Bump patch version
5. Deploy to production
6. Cherry-pick to main
7. Document incident

**Outputs:**
- Hotfix version
- Deployment status
- Incident documentation

---

### Phase 7: Performance & Optimization Workflows

#### 9. performance-profiling
**Purpose:** Profile application performance
**Inputs:**
- Application component (API, frontend, database)
- Environment
- Profiling duration
- Metrics to capture

**Steps:**
1. Set up profiling tools
2. Capture baseline metrics
3. Run profiling session
4. Analyze results
5. Identify bottlenecks
6. Generate recommendations
7. Create optimization stories

**Outputs:**
- Performance report
- Bottleneck analysis
- Optimization recommendations
- Story drafts (if fixes needed)

**Tools:**
- Node.js: clinic.js, 0x
- Browser: Lighthouse, Chrome DevTools
- Database: EXPLAIN ANALYZE, slow query log
- APM: New Relic, DataDog

---

#### 10. load-testing-workflow
**Purpose:** Test system under load
**Inputs:**
- Test scenarios
- Load profile (users, duration, ramp-up)
- Performance SLAs
- Environment

**Steps:**
1. Define test scenarios
2. Configure load generators
3. Run load tests
4. Monitor system metrics
5. Analyze results vs SLAs
6. Identify capacity limits
7. Generate capacity plan

**Outputs:**
- Load test results
- Performance vs SLA comparison
- Capacity recommendations
- Scaling thresholds

**Tools:**
- k6
- Artillery
- JMeter
- Gatling
- Locust

---

## 🔗 Integration Points

### With BMM Module

**Story Completion → Deployment:**
```
BMM: story-done → orchestrate-story
  ↓
BMI: deployment-workflow (deploy to dev/staging)
  ↓
BMI: performance-profiling (validate performance)
```

**Epic Completion → Release:**
```
BMM: retrospective (epic complete)
  ↓
BMI: release-workflow
  ↓
  - changelog-generation
  - version-management
  - deployment-workflow (production)
```

**Code Review → Deployment Gate:**
```
BMM: code-review
  ↓
BMI: performance-profiling (if needed)
  ↓
BMI: deployment-workflow (staging)
```

### With Core Module

**Workflow Orchestration:**
- BMI workflows are standard BMAD workflows
- Use Core task system for utilities
- Integrate with Core party-mode for cross-module discussions

### With CIS Module

**Performance Analysis:**
- Use problem-solving workflow for bottleneck analysis
- Innovation-strategy for optimization approaches

---

## 📦 Module Structure

```
bmad/bmi/
├── agents/
│   ├── diana.md                    # DevOps Engineer
│   ├── rita.md                     # Release Manager
│   └── phoenix.md                  # Performance Engineer
│
├── workflows/
│   ├── deployment-workflow/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── README.md
│   │
│   ├── rollback-workflow/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   └── README.md
│   │
│   ├── infrastructure-provision/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md (Terraform/Pulumi templates)
│   │   └── README.md
│   │
│   ├── monitoring-setup/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md (config templates)
│   │   └── README.md
│   │
│   ├── incident-response/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md (incident report)
│   │   └── README.md
│   │
│   ├── release-workflow/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   └── README.md
│   │
│   ├── changelog-generation/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md (changelog formats)
│   │   └── README.md
│   │
│   ├── hotfix-workflow/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   └── README.md
│   │
│   ├── performance-profiling/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md (report template)
│   │   └── README.md
│   │
│   └── load-testing-workflow/
│       ├── workflow.yaml
│       ├── instructions.md
│       ├── template.md (test scenarios)
│       └── README.md
│
├── tasks/
│   ├── check-health.md             # Quick health check
│   ├── notify-stakeholders.md      # Send notifications
│   ├── version-bump.md             # Bump version numbers
│   └── create-git-tag.md           # Create and push tags
│
├── templates/
│   ├── deployment-manifest.yaml    # Kubernetes/Docker deployment
│   ├── terraform-base.tf           # Base Terraform template
│   ├── monitoring-config.yaml      # Monitoring configs
│   ├── incident-report.md          # Incident report template
│   └── release-notes.md            # Release notes template
│
├── data/
│   ├── deployment-strategies.yaml  # Strategy definitions
│   ├── platform-configs/           # Platform-specific configs
│   │   ├── aws.yaml
│   │   ├── gcp.yaml
│   │   └── azure.yaml
│   └── runbooks/                   # Operational runbooks
│       ├── deployment.md
│       ├── rollback.md
│       └── incident-response.md
│
├── _module-installer/
│   ├── install-config.yaml
│   └── assets/
│       └── example-configs/
│
├── config.yaml                     # Generated configuration
├── README.md                       # Module documentation
└── docs/
    ├── getting-started.md
    ├── deployment-guide.md
    ├── infrastructure-guide.md
    └── monitoring-guide.md
```

---

## 🎯 Missing Pieces Analysis

### What We Have (BMM provides):
✅ Story completion workflow
✅ Code review workflow
✅ Git operations (commit, branch)
✅ Testing infrastructure
✅ Epic/story tracking

### What's Missing (BMI must provide):

#### 🚨 Critical Gaps:
❌ **Deployment automation** - No way to deploy to environments
❌ **Infrastructure provisioning** - No IaC workflow
❌ **Release management** - No version/tag/changelog automation
❌ **Monitoring setup** - No observability configuration
❌ **Performance testing** - No load testing workflow
❌ **Incident response** - No structured debugging workflow
❌ **Rollback capability** - No safe rollback process

#### 🔧 Required Tools/Integrations:

**Cloud Providers:**
- AWS SDK (for AWS deployments)
- GCP SDK (for GCP deployments)
- Azure SDK (for Azure deployments)

**IaC Tools:**
- Terraform CLI
- Pulumi CLI
- AWS CDK (optional)

**CI/CD Integration:**
- GitHub Actions API (for pipeline triggers)
- GitLab CI API (optional)

**Monitoring Platforms:**
- Prometheus/Grafana
- DataDog API
- New Relic API
- CloudWatch API

**Performance Tools:**
- k6 CLI
- Artillery CLI
- Lighthouse CLI
- Node.js profiling tools

**Version Control:**
- Git tagging
- GitHub Releases API
- Changelog parsers

---

## 📋 Configuration Requirements

### Module Config (config.yaml)

```yaml
# BMI Module Configuration
# Generated by BMAD installer

# User settings (inherited)
user_name: Chris
communication_language: English
output_folder: '{project-root}/docs'

# BMI-specific settings
deployment:
  default_platform: 'aws'  # aws | gcp | azure | kubernetes
  default_strategy: 'blue-green'  # blue-green | canary | rolling
  environments:
    - dev
    - staging
    - production

infrastructure:
  iac_tool: 'terraform'  # terraform | pulumi | cdk
  state_backend: 's3'  # s3 | gcs | azurerm | local
  terraform_version: '1.6.0'

monitoring:
  platform: 'prometheus'  # prometheus | datadog | newrelic | cloudwatch
  alert_channels:
    - type: 'slack'
      webhook: '${SLACK_WEBHOOK_URL}'
    - type: 'email'
      recipients: ['team@example.com']

performance:
  load_testing_tool: 'k6'  # k6 | artillery | jmeter
  profiling_tool: 'clinic'  # clinic | 0x | lighthouse

release:
  changelog_format: 'keepachangelog'  # keepachangelog | conventional | angular
  release_notes_template: '{project-root}/bmad/bmi/templates/release-notes.md'
  auto_tag: true
  auto_deploy: false  # Manual approval for production

# Paths
deployment_logs: '{project-root}/logs/deployments'
infrastructure_state: '{project-root}/infrastructure/.tfstate'
runbooks: '{project-root}/bmad/bmi/data/runbooks'
```

---

## 🔐 Credentials & Secrets Management

**Required Environment Variables:**

```bash
# Cloud Providers
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION

GCP_PROJECT_ID
GCP_SERVICE_ACCOUNT_KEY

AZURE_SUBSCRIPTION_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET

# Monitoring
DATADOG_API_KEY
NEWRELIC_LICENSE_KEY
SLACK_WEBHOOK_URL

# CI/CD
GITHUB_TOKEN
GITLAB_TOKEN

# Database (for migrations)
DATABASE_URL
```

**Secrets Handling:**
- Never store in config files
- Use environment variables
- Support .env files (dev)
- Integrate with secret managers (AWS Secrets Manager, etc.)

---

## 🧪 Testing Requirements

### Workflow Testing

Each workflow needs:
- Unit tests (workflow logic)
- Integration tests (with real services)
- Smoke tests (deployment validation)

### Agent Testing

Each agent needs:
- Persona validation
- Workflow execution tests
- Integration with other agents

---

## 📊 Success Metrics

**Deployment Reliability:**
- Deployment success rate > 95%
- Rollback time < 5 minutes
- Zero-downtime deployments

**Release Velocity:**
- Time from story-done to production < 24 hours
- Automated release process (no manual steps)
- Complete audit trail

**Performance:**
- Performance tests run on every deployment
- Automated bottleneck detection
- Performance regression alerts

**Operations:**
- Incident response time < 15 minutes
- Complete monitoring coverage
- Automated runbook execution

---

## 🚀 Implementation Priority

### Phase 1: Core Deployment (Week 1-2)
1. Diana agent
2. deployment-workflow
3. rollback-workflow
4. Basic monitoring

### Phase 2: Release Management (Week 3)
5. Rita agent
6. release-workflow
7. changelog-generation
8. version-management

### Phase 3: Performance (Week 4)
9. Phoenix agent
10. performance-profiling
11. load-testing-workflow

### Phase 4: Infrastructure (Week 5)
12. infrastructure-provision
13. monitoring-setup (comprehensive)
14. incident-response

### Phase 5: Polish & Integration (Week 6)
15. Complete documentation
16. Integration testing with orchestrator
17. Example projects/templates
18. Runbook creation

---

## 🎯 Next Steps

1. **Create Module Brief** - Use BMad Builder's module-brief workflow
2. **Build Agents** - Start with Diana (highest priority)
3. **Create Core Workflows** - deployment-workflow first
4. **Test Integration** - Deploy orchestrator project itself
5. **Iterate & Refine** - Based on real usage

---

**Status:** Ready for module-brief workflow ✅
