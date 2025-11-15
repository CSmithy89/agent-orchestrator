# BMI - Infrastructure & DevOps Module

**Version:** 1.0.0-alpha.1
**Author:** Chris
**Module Code:** `bmi`
**Status:** In Development

---

## 📋 Overview

BMI (BMAD Method Infrastructure) extends the BMAD development lifecycle with deployment automation, release management, and infrastructure operations. It bridges the critical gap between "code merged to git" and "running in production environments."

**The Problem BMI Solves:**
- Current BMM: `Code → Test → Git Push` ❌ (code in GitHub, not deployed)
- With BMI: `Code → Test → Git Push → Deploy → Monitor` ✅ (actually running in environments)

---

## 🤖 Agents

BMI provides three specialized agents for infrastructure and operations:

### **Diana** - DevOps Engineer 🚀
**Expertise:** Deployment automation, infrastructure provisioning, database migrations, container orchestration, monitoring setup, incident response

**Workflows:**
- deployment-workflow
- rollback-workflow
- database-migration
- container-build
- infrastructure-provision
- monitoring-setup
- incident-response

---

### **Rita** - Release Manager 📦
**Expertise:** Release orchestration, changelog generation, version management, DORA metrics tracking

**Workflows:**
- release-workflow
- changelog-generation
- hotfix-workflow

---

### **Phoenix** - Performance Engineer ⚡
**Expertise:** Performance profiling, load testing, bottleneck analysis, SLA validation, capacity planning

**Workflows:**
- performance-profiling
- load-testing-workflow

---

## 🔄 Workflows

### **Phase 5: Deployment** (8 workflows)

| Workflow | Purpose | Agent |
|----------|---------|-------|
| deployment-workflow | Deploy application to target environment | Diana |
| rollback-workflow | Safely revert to previous version | Diana |
| database-migration | Execute database schema migrations | Diana |
| container-build | Build, scan, and push container images | Diana |
| infrastructure-provision | Provision infrastructure using IaC | Diana |
| monitoring-setup | Configure monitoring and observability | Diana |
| incident-response | Structured debugging and hotfix workflow | Diana |
| performance-profiling | Profile performance and identify bottlenecks | Phoenix |

### **Phase 6: Release** (4 workflows)

| Workflow | Purpose | Agent |
|----------|---------|-------|
| release-workflow | Complete release orchestration | Rita |
| changelog-generation | Auto-generate changelog from git history | Rita |
| hotfix-workflow | Emergency production fix process | Rita |
| load-testing-workflow | Test system under load | Phoenix |

---

## 🚀 Quick Start

### **Installation**

BMI is included in the agent-orchestrator repository:

```bash
git clone agent-orchestrator
cd agent-orchestrator

# BMI already exists in bmad/bmi/
# Configure deployment settings
cp bmad/bmi/config.yaml bmad/bmi/config.local.yaml
# Edit config.local.yaml with your settings
```

### **Configuration**

Edit `bmad/bmi/config.yaml`:

```yaml
deployment:
  auto_deploy_on_merge: true
  auto_deploy_environments:
    - dev
    - staging
  default_platform: "vercel"  # or auto-detect

release:
  auto_release_on_epic_complete: false
  version_strategy: "semantic"
```

### **Usage**

```bash
# Deploy to environment
/deploy dev
/deploy staging
/deploy production

# Create release
/release

# Rollback deployment
/rollback production

# Profile performance
/profile staging

# Run load tests
/load-test production
```

---

## 🔗 Integration with BMM

BMI seamlessly integrates with BMM workflows:

### **orchestrate-story Extension**

When `orchestrate-story` completes (Step 8: git push), BMI automatically:
1. Deploys to dev environment (if `auto_deploy_on_merge: true`)
2. Runs smoke tests
3. Deploys to staging (if dev succeeds)
4. Validates performance (if story has performance requirements)

### **orchestrate-epic Extension**

When `orchestrate-epic` completes (retrospective done), BMI can:
1. Generate changelog from all epic stories
2. Bump version (semantic versioning)
3. Create GitHub release
4. Run load tests
5. Deploy to production (with manual approval)

---

## 🌐 Supported Platforms

### **Tier 1 (Fully Supported)**
- **Vercel** - Next.js, React, static sites
- **Railway** - Full-stack containers
- **Render** - Full-stack + managed databases
- **DigitalOcean** - App Platform + Droplets
- **AWS** - EC2, ECS, Lambda, Amplify
- **Netlify** - JAMstack, serverless functions

### **Tier 2 (Supported)**
- Fly.io, Heroku, GCP, Azure, Kubernetes

**Platform Auto-Detection:**
BMI automatically detects your deployment platform by scanning for:
- `vercel.json` → Vercel
- `railway.json` → Railway
- `render.yaml` → Render
- `Dockerfile` + `.do/app.yaml` → DigitalOcean
- etc.

---

## 📊 Features

### **Database Migrations**
- Auto-detect migration tool (Prisma, Drizzle, Knex, etc.)
- Automatic backups before production migrations
- Rollback capability
- Zero-downtime migration strategies

### **Container Support**
- Docker image building
- Vulnerability scanning (Trivy)
- Multi-platform builds (ARM + x86)
- Registry push (Docker Hub, ECR, GCR, GHCR)

### **Performance Validation**
- Automatic profiling on staging deployments
- SLA validation
- Load testing before production
- Performance regression detection

### **Secrets Management**
- Multiple backends: env vars, Vault, AWS Secrets Manager, Doppler
- Automatic secret provisioning during deployment
- Secret rotation workflows

### **DORA Metrics**
- Deployment frequency tracking
- Lead time for changes
- Change failure rate
- Mean time to recovery (MTTR)

---

## 📁 Module Structure

```
bmad/bmi/
├── agents/                    # Agent definitions
│   ├── diana.md              # DevOps Engineer
│   ├── rita.md               # Release Manager
│   └── phoenix.md            # Performance Engineer
│
├── workflows/
│   ├── 5-deployment/         # Phase 5 workflows
│   │   ├── deployment-workflow/
│   │   ├── rollback-workflow/
│   │   ├── database-migration/
│   │   ├── container-build/
│   │   ├── infrastructure-provision/
│   │   ├── monitoring-setup/
│   │   ├── incident-response/
│   │   └── performance-profiling/
│   │
│   └── 6-release/            # Phase 6 workflows
│       ├── release-workflow/
│       ├── changelog-generation/
│       ├── hotfix-workflow/
│       └── load-testing-workflow/
│
├── integration/              # BMM integration hooks
│   ├── orchestrate-story-extension.md
│   ├── orchestrate-epic-extension.md
│   └── bmm-integration-hooks.yaml
│
├── templates/                # Workflow templates
│   ├── deployment-manifest.yaml
│   ├── release-notes.md
│   └── incident-report.md
│
├── data/                     # Static data
│   └── runbooks/            # Operational runbooks
│
├── tasks/                    # Utility tasks
│   ├── check-health.md
│   ├── version-bump.md
│   └── notify-deployment.md
│
├── docs/                     # Documentation
│
├── config.yaml               # Module configuration
└── README.md                 # This file
```

---

## 🔧 Dependencies

### **Required CLI Tools (per platform)**
- `vercel` - Vercel deployments
- `railway` - Railway deployments
- `render` - Render deployments
- `doctl` - DigitalOcean deployments
- `aws` - AWS deployments
- `docker` - Container builds (if using containers)

### **Optional Tools**
- `terraform` or `pulumi` - Infrastructure provisioning
- `k6` or `artillery` - Load testing
- `trivy` - Container vulnerability scanning

### **BMAD Dependencies**
- `bmad/core` - Workflow engine
- `bmad/bmm` - Integration with BMM workflows
- `bmad/bmm/workflows/testarch` - Testing infrastructure (TEA)

---

## 📖 Documentation

- **[Planning Documentation](../../docs/planning/)** - Complete planning artifacts
- **[Module Brief](../../docs/planning/bmi-module-brief.md)** - Comprehensive module specification
- **[Architecture Decision](../../docs/planning/bmi-architecture-decision.md)** - Integration architecture
- **[Quality Workflow](../../docs/planning/bmi-quality-workflow.md)** - Development and audit strategy

---

## 🚦 Status

- ✅ **Planning:** Complete (5,345 lines of documentation)
- 🔄 **Development:** In Progress
  - ⏳ Module structure created
  - ⏳ Agents: Pending
  - ⏳ Workflows: Pending
  - ⏳ Integration: Pending
- ⏳ **Testing:** Pending
- ⏳ **Documentation:** Pending

---

## 🎯 Roadmap

### **Week 1: Foundation + Agents**
- [x] Module structure
- [ ] Diana agent
- [ ] Rita agent
- [ ] Phoenix agent

### **Week 2-3: Core Workflows**
- [ ] deployment-workflow
- [ ] rollback-workflow
- [ ] database-migration
- [ ] container-build
- [ ] release-workflow
- [ ] changelog-generation

### **Week 4: Integration**
- [ ] BMM integration hooks
- [ ] orchestrate-story extension
- [ ] orchestrate-epic extension
- [ ] Batch audit

### **Week 5: Documentation**
- [ ] Run redoc (generate comprehensive docs)
- [ ] Usage guides
- [ ] Examples

### **Week 6: Testing**
- [ ] Integration testing
- [ ] Platform testing
- [ ] Final audit
- [ ] v1.0.0-alpha release

---

## 🤝 Contributing

BMI is designed for eventual contribution to [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) as BMM Phase 5 & 6.

**Contribution Readiness:**
- [ ] All workflows complete and tested
- [ ] All agents fully functional
- [ ] Comprehensive documentation
- [ ] Test coverage >80%
- [ ] Platform support for Tier 1 platforms
- [ ] Example projects
- [ ] BMAD v6 compliance verified

---

## 📝 License

Part of the BMAD Method ecosystem. See main repository for license information.

---

## 🙏 Acknowledgments

Built on the BMAD Method framework by [bmad-code-org](https://github.com/bmad-code-org/BMAD-METHOD).

---

**Status:** 🔄 **In Development - Week 1**
**Next Step:** Create agents (Diana, Rita, Phoenix)
