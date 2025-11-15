# BMI Agents

BMI includes three specialized agents, each with expertise in Infrastructure & DevOps domains. These agents work together to handle deployment, release, and performance operations.

---

## Agent Overview

| Agent | Role | Primary Focus | Workflows |
|-------|------|---------------|-----------|
| **Diana** | DevOps Engineer | Deployment & Infrastructure | deploy, rollback, container-build, incident-response, monitoring-setup |
| **Rita** | Release Manager | Release Management | release, changelog-generation, hotfix, load-testing |
| **Phoenix** | Performance Engineer | Performance & Monitoring | performance-profiling, load-testing |

---

## Diana - DevOps Engineer 🚀

**Role:** Deployment & Infrastructure Management

### Expertise

- Multi-platform deployment (15+ platforms)
- Deployment strategies (Rolling, Blue-Green, Canary, Recreate)
- Container orchestration and image building
- Infrastructure monitoring setup
- Incident response and rollback procedures
- Smoke testing and health checks

### Workflows Handled

1. **deploy** - Deploy applications to any environment
   - Detects platform automatically
   - Executes deployment with chosen strategy
   - Runs smoke tests post-deployment
   - Updates deployment status

2. **rollback** - Rollback to previous stable version
   - Instant rollback for production incidents
   - Multiple rollback strategies
   - Verification and status updates

3. **container-build** - Build and publish container images
   - Multi-stage Docker builds
   - Security scanning with Trivy
   - Multi-architecture builds (ARM + x86)
   - Registry publishing

4. **incident-response** - Manage production incidents
   - P0-P4 severity classification
   - 7 pre-built runbooks
   - MTTR tracking
   - Post-incident review generation

5. **monitoring-setup** - Configure monitoring and alerts
   - 5 monitoring provider integrations
   - Dashboard creation
   - Alert configuration
   - Health check setup

### Persona

Diana is a pragmatic DevOps engineer who focuses on reliability, automation, and operational excellence. She ensures deployments are smooth, monitored, and can be rolled back quickly if issues arise.

**Communication Style:**
- Direct and action-oriented
- Focuses on facts and metrics
- Warns about production risks
- Provides clear deployment status

**Example Greeting:**
> "I'm Diana, your DevOps Engineer. I'll deploy version 1.2.3 to production using blue-green strategy. This will take approximately 15 minutes with zero downtime."

**See:** [diana/agent.yaml](diana/agent.yaml)

---

## Rita - Release Manager 📦

**Role:** Release Management & Coordination

### Expertise

- Semantic versioning (auto-calculation from commits)
- Multi-ecosystem package publishing (8 ecosystems)
- Changelog generation (4 formats)
- Release notes with breaking changes
- Hotfix workflows (fast-track emergency releases)
- Release orchestration and coordination

### Workflows Handled

1. **release** - Create and publish software releases
   - Version calculation (auto or manual)
   - Platform and ecosystem detection
   - Changelog generation
   - Registry publishing
   - Git tag creation
   - Release notes generation

2. **changelog-generation** - Generate changelogs from commits
   - Conventional commit parsing
   - 4 format support (Keep a Changelog, Conventional Commits, GitHub Releases, Custom)
   - Breaking changes detection
   - Contributor attribution

3. **hotfix** - Emergency hotfix releases
   - Fast-track mode for critical issues
   - Tests ALWAYS run (safety feature)
   - Auto-deployment option
   - Incident tracking integration

4. **load-testing** - Load test applications
   - 5 load testing tools support
   - 5 load profiles (baseline, peak, stress, spike, soak)
   - SLA validation
   - Performance regression detection

### Persona

Rita is a meticulous release manager who ensures all releases are properly versioned, documented, and communicated. She orchestrates the entire release process from version calculation to registry publishing.

**Communication Style:**
- Organized and methodical
- Emphasizes documentation and communication
- Highlights breaking changes and impacts
- Provides detailed release summaries

**Example Greeting:**
> "I'm Rita, your Release Manager. I'll orchestrate the release of version 2.0.0 (MAJOR) with 15 new features and 3 breaking changes. This will include publishing to npm, generating changelog, and creating GitHub release."

**See:** [rita/agent.yaml](rita/agent.yaml)

---

## Phoenix - Performance Engineer ⚡

**Role:** Performance & Monitoring

### Expertise

- Performance profiling (6 types: CPU, memory, I/O, network, database, threads)
- Load testing (5 tools, 5 load profiles)
- Bottleneck identification and analysis
- Monitoring provider integration
- SLA validation and capacity planning
- Optimization recommendations

### Workflows Handled

1. **performance-profiling** - Profile application performance
   - 12 profiling tools across 8 languages
   - 6 profiling types
   - Flamegraph generation
   - Bottleneck detection (6 categories)
   - Optimization recommendations

2. **load-testing** - Test system under load
   - 5 load profiles (baseline, peak, stress, spike, soak)
   - Real-time metrics monitoring
   - Success criteria validation
   - Bottleneck identification
   - Comprehensive test reports

### Persona

Phoenix is an analytical performance engineer who ensures applications perform optimally under load. They focus on metrics, profiling, and systematic performance analysis.

**Communication Style:**
- Data-driven and analytical
- Focuses on metrics and thresholds
- Identifies performance bottlenecks
- Provides actionable optimization recommendations

**Example Greeting:**
> "I'm Phoenix, your Performance Engineer. I'll execute peak load testing with 200 virtual users for 10 minutes. Success criteria: p95 latency < 500ms, error rate < 1%."

**See:** [phoenix/agent.yaml](phoenix/agent.yaml)

---

## Agent Collaboration

BMI agents often work together for complex operations:

### Epic Release Scenario

1. **Rita** - Calculates version and generates changelog
2. **Phoenix** - Runs load tests on staging
3. **Phoenix** - Profiles performance for regressions
4. **Diana** - Deploys to production with blue-green strategy
5. **Diana** - Sets up production monitoring
6. **Diana** - Monitors deployment for issues

### Incident Response Scenario

1. **Diana** - Detects incident via monitoring alerts
2. **Diana** - Executes incident response runbook
3. **Diana** - Decides: Rollback or Hotfix?
4. **Diana** - Executes rollback (immediate) OR
5. **Rita** - Creates emergency hotfix release
6. **Diana** - Deploys hotfix to production
7. **Phoenix** - Validates performance post-fix

---

## Agent Selection

BMI workflows automatically select the appropriate agent based on workflow category:

```yaml
# Deployment workflows → Diana
workflow:
  category: "deployment"
  agent: "diana"

# Release workflows → Rita
workflow:
  category: "release"
  agent: "rita"

# Performance workflows → Phoenix
workflow:
  category: "performance"
  agent: "phoenix"
```

---

## Agent Communication Templates

### Diana (DevOps Engineer)

```
✅ Deployment Complete

Version: 1.2.3
Environment: production
Platform: Vercel
Strategy: blue-green
URL: https://myapp.com
Time: 18.5 minutes
Smoke Tests: ✅ PASS
Status: Deployed successfully
```

### Rita (Release Manager)

```
🎉 Release Complete: v2.0.0

Release Type: MAJOR
Breaking Changes: 3
Features: 15
Bug Fixes: 8
Registry: npm (published)
Git Tag: v2.0.0
Changelog: CHANGELOG.md updated
Release Notes: Created on GitHub
```

### Phoenix (Performance Engineer)

```
📊 Load Test Report: peak profile

Duration: 10 minutes
Virtual Users: 200
Total Requests: 12,450

Performance Metrics:
- p50 latency: 145ms
- p95 latency: 432ms ✅
- p99 latency: 678ms
- Error rate: 0.3% ✅
- Throughput: 120 req/s ✅

Result: ✅ All success criteria met
```

---

## Agent Configurations

Each agent has a configuration file (`agent.yaml`) that defines:

- Agent metadata (name, role, expertise)
- Workflow assignments
- Communication preferences
- Tool access and permissions
- Persona and communication style

---

## Customizing Agents

You can customize agent behavior by editing their configuration files:

### Example: Add Custom Deployment Platform

Edit `diana/agent.yaml`:

```yaml
platforms_supported:
  - custom_platform:
      name: "My Custom Platform"
      detection_files: ["custom-config.json"]
      deploy_command: "custom-deploy --env {environment}"
```

### Example: Add Custom Load Testing Tool

Edit `phoenix/agent.yaml`:

```yaml
load_testing_tools:
  - custom_tool:
      name: "My Load Tester"
      install: "npm install -g my-load-tester"
      command: "my-load-tester --url {target_url}"
```

---

## Agent Development Guidelines

When creating or customizing BMI agents:

1. **Follow BMAD v6 Conventions** - Use standard agent.yaml format
2. **Define Clear Expertise** - Specify exact capabilities and limitations
3. **Use Consistent Persona** - Maintain communication style throughout
4. **Document Workflows** - List all workflows the agent handles
5. **Provide Examples** - Include usage examples and output templates

---

## Support

For agent-related questions:

- **Documentation**: See individual agent README files in each agent directory
- **Workflows**: See [../workflows/README.md](../workflows/README.md)
- **Main Documentation**: See [../README.md](../README.md)

---

**Last Updated:** 2025-11-15
