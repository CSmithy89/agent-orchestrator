# Module Brief: BMI (Infrastructure & DevOps)

**Date:** 2025-11-13
**Author:** Chris
**Module Code:** `bmi`
**Status:** Ready for Development
**Architecture:** Update-Safe Separate Module with BMM Integration

---

## Executive Summary

BMI (BMAD Method Infrastructure) extends the BMAD development lifecycle with deployment automation, release management, and infrastructure operations. It bridges the critical gap between "code merged to git" and "running in production environments."

**Module Category:** Infrastructure & Operations
**Complexity Level:** Standard (3 agents, 12 workflows)
**Target Users:** Development teams using BMAD Method who need deployment automation

**Key Innovation:** First BMAD module to seamlessly integrate with BMM while remaining update-safe from upstream changes.

---

## Module Identity

### Core Concept

BMI completes the software delivery pipeline by adding **actual deployment** capabilities to BMAD. Currently, BMM's "deployment" means `git push` - code in GitHub but not running anywhere. BMI deploys to real environments (dev, staging, production) across 15+ platforms.

**The Gap We Fill:**
```
Current BMM:  Code → Test → Git Push ❌ (not deployed)
With BMI:     Code → Test → Git Push → Deploy → Monitor ✅
```

### Unique Value Proposition

What makes this module special:

1. **Platform-Agnostic**: Supports 15+ deployment platforms (Vercel, Railway, Render, AWS, etc.) with auto-detection
2. **Seamless BMM Integration**: Extends orchestrate-story and orchestrate-epic without modifying BMM
3. **Update-Safe Architecture**: Survives upstream BMAD updates (lives in separate bmad/bmi/ directory)
4. **Database-Aware**: Handles migrations, backups, and schema changes during deployment
5. **Performance-Validated**: Automatic performance profiling and load testing
6. **Configuration-Driven**: Auto-deploy on merge, environment-specific configs, approval gates
7. **Contribution-Ready**: Designed for eventual contribution to official BMAD-METHOD repo

### Personality Theme

**"DevOps Automation Heroes"** - Diana (DevOps Engineer), Rita (Release Manager), and Phoenix (Performance Engineer) work as an elite operations team that makes deployment feel magical. They handle the complexity of infrastructure, platforms, and performance so developers can focus on building features.

**Communication Style:**
- **Diana**: Pragmatic, systems-thinking, "infrastructure as choreography"
- **Rita**: Methodical, detail-oriented, "every release tells a story"
- **Phoenix**: Data-driven, optimization-obsessed, "performance is a feature"

---

## Agent Architecture

### Agent Roster

**1. Diana - DevOps Engineer** 🚀
**Role:** Deployment Specialist + Infrastructure Architect
**Expertise:**
- Multi-platform deployment (Vercel, Railway, Render, AWS, GCP, Azure, DigitalOcean, etc.)
- Infrastructure as Code (Terraform, Pulumi, CDK)
- Container orchestration (Docker, Kubernetes)
- Database migrations (Prisma, Drizzle, Knex)
- Secrets management (Vault, AWS Secrets Manager, Doppler)
- Monitoring setup (Prometheus, DataDog, New Relic)
- Incident response and rollback strategies

**Personality:**
Calm under pressure, systems thinker. Views infrastructure as living systems that need care and feeding. Believes in automation over heroics, planning over panic.

**Workflows Owned:**
- deployment-workflow
- rollback-workflow
- database-migration
- container-build
- infrastructure-provision
- monitoring-setup
- incident-response

---

**2. Rita - Release Manager** 📦
**Role:** Release Orchestration + Changelog Curator
**Expertise:**
- Semantic versioning strategies
- Changelog generation (Keep a Changelog, Conventional Commits)
- Release notes creation
- Git tagging and GitHub releases
- Deployment coordination
- DORA metrics tracking (deployment frequency, lead time, MTTR)
- Hotfix process management

**Personality:**
Meticulous, story-driven. Treats every release as a narrative arc - what changed, why it matters, how to use it. Believes releases should be celebrations, not crises.

**Workflows Owned:**
- release-workflow
- changelog-generation
- hotfix-workflow

---

**3. Phoenix - Performance Engineer** ⚡
**Role:** Performance Profiling + Load Testing Specialist
**Expertise:**
- Application profiling (Node.js, browser, database)
- Load testing (k6, Artillery, JMeter)
- Bottleneck analysis (CPU, memory, database, network)
- Performance optimization strategies
- SLA validation
- Capacity planning
- Performance regression detection

**Personality:**
Curious, data-obsessed. Sees performance as a feature that deserves first-class treatment. Hunts for bottlenecks like a detective, celebrates when shaving milliseconds off response times.

**Workflows Owned:**
- performance-profiling
- load-testing-workflow

---

### Agent Interaction Model

How agents work together:

**Scenario 1: Story Deployment**
```
Bob (BMM) completes orchestrate-story
  ↓
Diana: Deploy to dev → run migrations → build container
  ↓
Murat (BMM/TEA): Run smoke tests
  ↓
Diana: Deploy to staging (if tests pass)
  ↓
Phoenix: Profile performance → validate SLAs
  ↓
Result: Story actually deployed and validated
```

**Scenario 2: Epic Release**
```
Bob (BMM) completes orchestrate-epic
  ↓
Rita: Generate changelog → bump version → create GitHub release
  ↓
Phoenix: Run load tests against staging
  ↓
Rita: Coordinate production deployment
  ↓
Diana: Deploy to production (with approval)
  ↓
Phoenix: Monitor production performance
  ↓
Rita: Track DORA metrics
```

**Scenario 3: Production Incident**
```
Monitoring alerts trigger
  ↓
Diana: Invoke incident-response workflow
  ↓
Diana: Diagnose issue → implement fix
  ↓
Rita: Coordinate hotfix release
  ↓
Diana: Deploy hotfix to production
  ↓
Rita: Document post-mortem
  ↓
Phoenix: Analyze performance impact
```

---

## Workflow Ecosystem

### Core Workflows (4)

Essential functionality that delivers primary value:

**1. deployment-workflow** (Phase 5)
**Purpose:** Deploy application to target environment
**Inputs:** Environment (dev/staging/production), deployment strategy, version
**Outputs:** Deployment URL, status, health check results
**Key Features:**
- Platform auto-detection (15+ platforms supported)
- Database migration integration
- Container build integration
- Secrets provisioning
- Smoke test execution
- Rollback on failure

**2. release-workflow** (Phase 6)
**Purpose:** Complete release orchestration from version bump to production
**Inputs:** Epic ID, story files, current version
**Outputs:** New version, changelog, release notes, GitHub release
**Key Features:**
- Semantic version bumping
- Changelog generation from stories
- Release notes creation
- Git tagging
- GitHub release creation
- DORA metrics tracking
- Production deployment coordination

**3. performance-profiling** (Phase 5)
**Purpose:** Profile application performance and identify bottlenecks
**Inputs:** Environment, component (API/frontend/database)
**Outputs:** Performance report, bottleneck analysis, optimization recommendations
**Key Features:**
- Multi-tool profiling (clinic.js, Lighthouse, database EXPLAIN)
- Baseline comparison
- SLA validation
- Optimization story generation

**4. rollback-workflow** (Phase 5)
**Purpose:** Safely revert to previous version
**Inputs:** Environment, target version (or "previous")
**Outputs:** Rollback status, incident report
**Key Features:**
- Version identification
- Safety validation
- Automated rollback execution
- Incident documentation

---

### Feature Workflows (6)

Specialized capabilities that enhance the module:

**5. database-migration** (Phase 5)
**Purpose:** Execute database schema migrations during deployment
**Supports:** Prisma, Drizzle, Knex, Sequelize, TypeORM
**Key Features:**
- Migration validation (dry-run)
- Automatic backups (production)
- Rollback capability
- Zero-downtime strategies

**6. container-build** (Phase 5)
**Purpose:** Build, scan, and push container images
**Key Features:**
- Multi-platform builds (ARM + x86)
- Vulnerability scanning (Trivy)
- Registry push (Docker Hub, ECR, GCR)
- Layer caching optimization

**7. infrastructure-provision** (Phase 5)
**Purpose:** Provision infrastructure using IaC
**Supports:** Terraform, Pulumi, AWS CDK
**Key Features:**
- Infrastructure planning and cost estimates
- SSL/TLS certificate provisioning
- DNS record management
- Resource inventory tracking

**8. monitoring-setup** (Phase 5)
**Purpose:** Configure monitoring and observability
**Supports:** Prometheus/Grafana, DataDog, New Relic, CloudWatch
**Key Features:**
- Metrics collection setup
- Dashboard creation
- Alert configuration
- Notification channels (Slack, email, PagerDuty)

**9. incident-response** (Phase 5)
**Purpose:** Structured debugging and hotfix workflow
**Key Features:**
- Severity assessment
- Diagnostic data gathering
- Root cause analysis
- Post-mortem generation

**10. changelog-generation** (Phase 6)
**Purpose:** Auto-generate changelog from git history and stories
**Formats:** Keep a Changelog, Conventional Commits, Angular
**Key Features:**
- Story-driven changelogs
- PR/commit linking
- Change categorization (Added, Changed, Fixed, Breaking)

---

### Utility Workflows (2)

Supporting operations and maintenance:

**11. hotfix-workflow** (Phase 6)
**Purpose:** Emergency production fix process
**Key Features:**
- Hotfix branch creation
- Expedited testing
- Patch version bump
- Immediate deployment
- Main branch cherry-pick

**12. load-testing-workflow** (Phase 6)
**Purpose:** Test system under load
**Tools:** k6, Artillery, JMeter
**Key Features:**
- Scenario definition
- Load profile configuration
- Capacity analysis
- SLA validation

---

## User Scenarios

### Primary Use Case

**"Deploy Story to Production with Confidence"**

**Actor:** Development Team using BMAD Method
**Goal:** Deploy completed story from local dev through production with automated validation

**Journey:**
1. Developer completes story using BMM's dev-story workflow
2. Code review passes (BMM's code-review workflow)
3. **orchestrate-story triggers BMI automatically:**
   - **Step 9:** Diana detects database migrations, runs them in dev
   - **Step 10:** Diana builds container image, scans for vulnerabilities
   - **Step 11:** Diana deploys to dev environment (auto-detected platform: Vercel)
   - **Step 12:** Murat runs smoke tests, all pass
   - **Step 13:** Diana deploys to staging environment
   - **Step 14:** Phoenix profiles performance, validates SLAs
   - **Step 15:** Story marked as "deployed to staging"
4. **Manual production deployment:**
   - User runs `/deploy production` when ready
   - Diana requires manual approval (configured gate)
   - Diana deploys to production
   - Phoenix monitors production performance
5. **Result:** Story deployed across all environments with full validation

**Time:** ~15 minutes (dev → staging), manual for production

---

### Secondary Use Cases

**Scenario 2: "Release Epic to Production"**

**Journey:**
1. Epic complete (all stories done, retrospective complete)
2. orchestrate-epic triggers Rita automatically
3. Rita generates changelog from all epic stories
4. Rita bumps minor version (epic = new features)
5. Rita creates GitHub release with notes
6. Phoenix runs load tests against staging
7. Rita coordinates production deployment
8. Diana deploys to production (manual approval required)
9. Phoenix monitors production, validates no regression
10. Rita tracks DORA metrics (deployment frequency, lead time)

**Scenario 3: "Handle Production Incident"**

**Journey:**
1. Monitoring alerts: Error rate spike in production
2. User invokes `/incident` command
3. Diana starts incident-response workflow
4. Diana gathers diagnostic logs, identifies bug
5. Rita creates hotfix workflow
6. Developer implements emergency fix
7. Murat runs critical tests only
8. Rita bumps patch version
9. Diana deploys hotfix to production immediately
10. Rita documents post-mortem
11. Phoenix analyzes performance impact

**Scenario 4: "Provision New Environment"**

**Journey:**
1. User runs `/infrastructure dev2`
2. Diana loads Terraform templates
3. Diana provisions: database, app service, SSL cert
4. Diana configures DNS records
5. Diana sets up monitoring and alerts
6. Diana stores environment credentials in Vault
7. Result: New dev2 environment ready for deployment

---

## Technical Planning

### Data Requirements

**Configuration Storage:**
- `bmad/bmi/config.yaml` - Module configuration
- `.env` files - Environment-specific secrets (gitignored)
- `docs/deployments/` - Deployment history logs

**Deployment Metadata:**
```yaml
# docs/deployments/deployment-history.yaml
deployments:
  - id: "deploy-2025-11-13-001"
    story: "1-2-workflow-yaml-parser"
    environment: "dev"
    platform: "vercel"
    url: "https://dev.example.com"
    version: "1.0.0-dev.123"
    timestamp: "2025-11-13T10:30:00Z"
    status: "success"
    duration_seconds: 45
```

**DORA Metrics:**
```yaml
# docs/metrics/dora.yaml
metrics:
  deployment_frequency:
    - date: "2025-11-13"
      deployments: 5
      environment: "production"

  lead_time_for_changes:
    - story: "1-2-workflow-yaml-parser"
      commit_time: "2025-11-12T15:00:00Z"
      deploy_time: "2025-11-13T10:30:00Z"
      lead_time_hours: 19.5

  change_failure_rate:
    - week: "2025-W46"
      total_deployments: 20
      failed_deployments: 1
      failure_rate: 0.05

  mean_time_to_recovery:
    - incident: "prod-2025-11-13-001"
      detected: "2025-11-13T14:00:00Z"
      resolved: "2025-11-13T14:18:00Z"
      mttr_minutes: 18
```

**Performance Baselines:**
```yaml
# docs/metrics/performance-baseline.yaml
baselines:
  api:
    response_time_p95_ms: 250
    response_time_p99_ms: 500
    throughput_rps: 1000

  frontend:
    page_load_time_ms: 1800
    time_to_interactive_ms: 2500
    lighthouse_score: 92

  database:
    query_time_p95_ms: 50
    connection_pool_utilization: 0.6
```

---

### Integration Points

**1. BMM Integration (Seamless Extension)**

```yaml
# bmad/bmi/integration/bmm-integration-hooks.yaml

orchestrate_story_extension:
  hook_point: "after_step_8_git_push"
  condition: "config.deployment.auto_deploy_on_merge == true"
  actions:
    - workflow: "bmad/bmi/workflows/5-deployment/deployment-workflow"
      agent: "Diana"
      environment: "dev"
    - workflow: "bmad/bmi/workflows/5-deployment/deployment-workflow"
      agent: "Diana"
      environment: "staging"
      condition: "dev_deployment_success"

orchestrate_epic_extension:
  hook_point: "after_retrospective"
  condition: "config.release.auto_release_on_epic_complete == true"
  actions:
    - workflow: "bmad/bmi/workflows/6-release/release-workflow"
      agent: "Rita"
    - workflow: "bmad/bmi/workflows/5-deployment/deployment-workflow"
      agent: "Diana"
      environment: "production"
      require_approval: true
```

**2. TEA Integration (Testing + Deployment)**

```yaml
# Diana extends TEA's CI pipeline with deployment jobs
tea_ci_extension:
  trigger: "after_testarch_ci_workflow"
  action: "add_deployment_jobs_to_ci_pipeline"

  # TEA creates: .github/workflows/test.yml
  # Diana extends with:
  deployment_jobs:
    - deploy-dev (after tests pass)
    - deploy-staging (after dev succeeds)
```

**3. Platform Integrations**

**Tier 1 Platforms (Must Support):**
- Vercel (Next.js, React, static sites)
- Railway (Full-stack containers)
- Render (Full-stack + managed databases)
- DigitalOcean App Platform
- AWS (EC2, ECS, Lambda, Amplify)
- Netlify (JAMstack, serverless functions)

**Tier 2 Platforms:**
- Fly.io, Heroku, GCP, Azure

**Detection Strategy:**
```javascript
// Platform auto-detection
if (exists('vercel.json')) → Vercel
if (exists('railway.json')) → Railway
if (exists('render.yaml')) → Render
if (exists('Dockerfile') && exists('.do/app.yaml')) → DigitalOcean
// ... etc
```

**4. Secret Managers**

- Environment variables (.env files)
- HashiCorp Vault
- AWS Secrets Manager
- GCP Secret Manager
- Doppler
- 1Password CLI

---

### Dependencies

**External Dependencies:**

**Required CLI Tools (per platform):**
- `vercel` - Vercel deployments
- `railway` - Railway deployments
- `render` - Render deployments
- `doctl` - DigitalOcean deployments
- `aws` - AWS deployments
- `gcloud` - GCP deployments
- `az` - Azure deployments
- `kubectl` - Kubernetes deployments
- `terraform` or `pulumi` - Infrastructure provisioning
- `docker` - Container builds

**Testing Tools:**
- `k6` or `artillery` - Load testing
- `clinic` or `0x` - Node.js profiling
- `lighthouse` - Frontend performance

**Optional:**
- `trivy` - Container vulnerability scanning
- `snyk` - Dependency security scanning

**Internal BMAD Dependencies:**
- `bmad/core` - Workflow engine (workflow.xml)
- `bmad/bmm` - Integration hooks
- `bmad/bmm/workflows/testarch` - Testing infrastructure (TEA)

**No breaking dependencies:** BMI can work standalone if needed, but designed for BMM integration.

---

## Installation & Setup

### Installation Process

**For Users:**
```bash
# BMI comes pre-installed in orchestrator repo
git clone agent-orchestrator
cd agent-orchestrator

# BMAD core already installed
# BMI already exists in bmad/bmi/

# Configure deployment settings
cp bmad/bmi/config.example.yaml bmad/bmi/config.yaml
# Edit config.yaml with your platform settings

# Install platform CLI (if needed)
npm install -g vercel  # or railway, render, etc.

# Login to platform
vercel login

# Ready to deploy!
/deploy
```

**For Developers (Contributing to BMI):**
```bash
# Clone orchestrator repo
git clone agent-orchestrator

# BMI source code in bmad/bmi/
# Make changes to workflows or agents

# Test locally
/deploy --dry-run

# Commit changes
git add bmad/bmi/
git commit -m "feat: add new deployment feature"
```

### Configuration

**Minimal Configuration (bmad/bmi/config.yaml):**
```yaml
deployment:
  auto_deploy_on_merge: true
  auto_deploy_environments:
    - dev
  default_platform: "vercel"  # or "auto" for detection

release:
  auto_release_on_epic_complete: false
```

**Full Configuration:**
- See `bmad/bmi/config.example.yaml` for all options
- Platform-specific settings
- Secrets management
- Monitoring configuration
- Performance SLAs

---

## Success Metrics

**Adoption Metrics:**
- Number of deployments per day
- Number of environments managed
- Platforms used

**Quality Metrics:**
- Deployment success rate (target: >95%)
- Rollback frequency (target: <5%)
- Incident response time (target: <15 min)

**DORA Metrics:**
- Deployment frequency (target: daily)
- Lead time for changes (target: <1 day)
- Change failure rate (target: <5%)
- Mean time to recovery (target: <1 hour)

**Performance Metrics:**
- Deployment time (target: <5 min)
- Performance regression detection rate
- SLA validation pass rate

---

## Future Enhancements

**Phase 2 Features (Not in MVP):**
- Database backup automation
- Cost tracking and optimization
- Advanced notifications (Slack, email, PagerDuty)
- Environment lifecycle management (preview envs per PR)
- Feature flags integration (LaunchDarkly, Split.io)
- Blue-green and canary deployment strategies

**Phase 3 Features:**
- Chaos engineering workflows
- Disaster recovery testing
- Compliance and audit logging
- Multi-region deployments
- Service mesh integration (Istio, Linkerd)

**Potential Separate Modules:**
- **BMS** (Security) - Security audits, compliance, vulnerability management
- **BMD** (Data) - Advanced database operations, ETL pipelines
- **BMX** (Mobile) - iOS/Android deployment (App Store, Play Store)

---

## Contribution to Upstream

**Goal:** Contribute BMI to official BMAD-METHOD as BMM Phase 5 & 6

**Contribution Timeline:**
1. **Q1 2025:** Build and test BMI locally in orchestrator project
2. **Q2 2025:** Gather user feedback, refine workflows
3. **Q3 2025:** Prepare contribution PR to bmad-code-org/BMAD-METHOD
4. **Q4 2025:** Integration into official BMM (if accepted)

**Contribution Readiness Checklist:**
- [ ] All 12 workflows complete and tested
- [ ] All 3 agents fully functional
- [ ] Comprehensive documentation
- [ ] Test suite coverage >80%
- [ ] Platform support for Tier 1 platforms
- [ ] Example projects demonstrating usage
- [ ] Migration guide for existing BMM users
- [ ] BMAD v6 compliance verified

---

## Risks & Mitigations

**Risk 1: Upstream BMM Changes Break Integration**
**Mitigation:** Update-safe architecture (separate bmad/bmi/ module). Integration layer easy to update.

**Risk 2: Platform API Changes**
**Mitigation:** Version-locked CLI dependencies. Regular platform compatibility tests.

**Risk 3: Secrets Management Complexity**
**Mitigation:** Support multiple backends (env vars, Vault, cloud providers). Clear documentation.

**Risk 4: Performance Overhead**
**Mitigation:** Async workflows, optional performance testing, configurable profiling.

**Risk 5: User Confusion (BMM vs BMI)**
**Mitigation:** Seamless integration makes it feel like one system. Clear docs on separation.

---

## Implementation Roadmap

### Week 1-2: Foundation
- [ ] Create bmad/bmi/ directory structure
- [ ] Build Diana agent
- [ ] Create deployment-workflow (basic)
- [ ] Test with Vercel (simplest platform)

### Week 3: Core Deployment
- [ ] Add platform auto-detection
- [ ] Add Railway, Render support
- [ ] Create database-migration workflow
- [ ] Create container-build workflow

### Week 4: Orchestration Integration
- [ ] Create orchestrate-story extension hooks
- [ ] Test auto-deploy on merge
- [ ] Integrate with TEA smoke tests

### Week 5: Release Management
- [ ] Build Rita agent
- [ ] Create release-workflow
- [ ] Create changelog-generation
- [ ] Integrate with orchestrate-epic

### Week 6: Performance & Refinement
- [ ] Build Phoenix agent
- [ ] Create performance-profiling workflow
- [ ] Create load-testing workflow
- [ ] Documentation polish
- [ ] Integration testing

---

## Conclusion

BMI completes BMAD's vision of end-to-end software delivery automation. By adding deployment, release management, and performance validation as a separate but seamlessly integrated module, we provide users with a complete DevOps solution while maintaining update safety and contribution flexibility.

**Architecture Decision:** Build as separate `bmad/bmi/` module with BMM integration layer.

**Benefit:** Best of both worlds - feels integrated to users, but update-safe and contribution-ready for upstream.

**Next Step:** Begin Week 1-2 implementation (foundation + Diana agent + basic deployment).

---

**Status:** ✅ **Ready to Build**

**Approval:** Awaiting user confirmation to proceed with implementation.
