# BMI Templates

BMI templates provide ready-to-use starting points for creating custom workflows. Each template includes complete workflow structure, documentation, and examples.

---

## Template Overview

| Template | Purpose | Complexity | Use Case |
|----------|---------|------------|----------|
| **basic-deploy-template** | Basic deployment workflow | Simple | Custom platform deployment |
| **epic-release-template** | Epic release with quality gates | Advanced | Full epic release process |
| **monitoring-template** | Monitoring setup | Medium | Custom monitoring configuration |
| **ci-cd-integration-template** | CI/CD integration | Medium | Automate BMI in pipelines |

---

## Templates

### basic-deploy-template

**Purpose:** Create a basic deployment workflow for custom platforms

**What's Included:**
- Complete workflow.yaml configuration
- Step-by-step instructions.md with 8 deployment steps
- Quality checklist.md
- Platform detection
- Smoke test integration
- Deployment status tracking

**Best For:**
- Deploying to custom or less common platforms
- Learning BMI workflow structure
- Simple deployment needs
- Quick prototyping

**Structure:**
```
custom/my-deployment/
├── workflow.yaml       # Configuration
├── instructions.md     # Execution steps
└── checklist.md        # Quality checklist
```

**Workflow Steps:**
1. Initialize deployment context
2. Detect deployment platform
3. Verify deployment prerequisites
4. Build application
5. Execute deployment
6. Run smoke tests
7. Update deployment status
8. Display deployment summary

**Customization Points:**
- Add custom platform support
- Modify deployment strategy
- Add environment variables
- Customize smoke tests
- Extend status tracking

**Usage:**
```bash
# 1. Copy template
cp bmad/bmi/templates/basic-deploy-template.md \
   bmad/bmi/workflows/custom/my-deploy/

# 2. Customize workflow files

# 3. Test workflow
bmad-cli invoke bmi/custom/my-deploy \
  --version "1.0.0" \
  --environment dev \
  --deployment-strategy rolling
```

**See:** [basic-deploy-template.md](basic-deploy-template.md)

---

### epic-release-template

**Purpose:** Release complete epics with comprehensive quality gates

**What's Included:**
- Full epic release orchestration (14 steps)
- Staging validation workflow
- Load testing integration
- Performance profiling for major/minor releases
- Approval gate for production
- Production monitoring setup
- Post-deployment validation

**Best For:**
- Releasing complete epics to production
- Multi-environment release pipelines
- Quality-gated releases
- Enterprise deployment processes

**Quality Gates:**
1. **Staging Deployment** - Deploy to staging first
2. **Load Tests** - Validate performance under peak load
3. **Performance Profiling** - Check for regressions (major/minor only)
4. **Approval** - Manual approval before production
5. **Production Deployment** - Blue-green production deploy
6. **Monitoring** - Setup production monitoring
7. **Validation** - Post-deployment smoke tests

**Workflow Steps:**
1. Initialize epic release
2. Calculate release version
3. Deploy epic to staging
4. Setup monitoring for staging
5. Run load tests on staging
6. Performance profiling (major/minor)
7. Validate quality gates
8. Approval gate for production
9. Create release
10. Deploy to production
11. Setup production monitoring
12. Post-production validation
13. Update release status
14. Epic release summary

**Customization Points:**
- Add custom quality gates
- Modify approval process
- Add epic-specific validations
- Customize monitoring configuration
- Extend status tracking

**Usage:**
```bash
# Invoke epic release
bmad-cli invoke bmi/custom/epic-release \
  --epic-id "EPIC-001-user-auth" \
  --epic-version "epic-user-auth-v1" \
  --package-ecosystem nodejs_npm \
  --auto-promote-to-production false
```

**See:** [epic-release-template.md](epic-release-template.md)

---

### monitoring-template

**Purpose:** Setup comprehensive monitoring, dashboards, and alerts

**What's Included:**
- Multi-provider monitoring support (5 providers)
- 5 monitoring categories
- 3 standard dashboards
- 5+ standard alerts
- Health check configuration

**Monitoring Providers:**
1. **Datadog** - APM and infrastructure
2. **New Relic** - APM and insights
3. **Prometheus + Grafana** - Open source stack
4. **AWS CloudWatch** - AWS native
5. **Azure Monitor** - Azure native

**Monitoring Categories:**
1. **Errors** - Error tracking and grouping
2. **Performance** - Latency, throughput, response times
3. **Infrastructure** - CPU, memory, disk, network
4. **Business** - User metrics, conversions, revenue
5. **Security** - Failed logins, suspicious activity

**Standard Dashboards:**
1. **Application Overview** - Request rate, error rate, latency, active users
2. **Performance** - Latency distribution, slow endpoints, database queries
3. **Infrastructure** - CPU/memory by host, disk I/O, network traffic

**Standard Alerts:**
1. **High Error Rate** - Error rate > threshold for 5 minutes
2. **High Latency** - p95 latency > threshold for 10 minutes
3. **High CPU** - CPU usage > threshold for 15 minutes
4. **High Memory** - Memory usage > threshold for 15 minutes
5. **Service Down** - Health check failing for 1 minute

**Customization Points:**
- Add custom monitoring categories
- Create custom dashboards
- Configure custom alerts
- Adjust alert thresholds
- Add business-specific metrics

**Usage:**
```bash
# Setup monitoring
bmad-cli invoke bmi/custom/monitoring-setup \
  --environment production \
  --application-name "myapp" \
  --monitoring-categories '["errors","performance","infrastructure"]' \
  --alert-thresholds '{"error_rate":1.0,"latency_p95":500}'
```

**See:** [monitoring-template.md](monitoring-template.md)

---

### ci-cd-integration-template

**Purpose:** Integrate BMI workflows with CI/CD pipelines

**What's Included:**
- GitHub Actions examples (5 workflows)
- GitLab CI configuration
- Jenkins pipeline
- CircleCI config
- Quality gates enforcement
- Automatic rollback on failure

**CI/CD Platform Examples:**

#### GitHub Actions
- `deploy-dev.yml` - Deploy to dev on PR merge
- `deploy-staging.yml` - Deploy to staging on main push
- `deploy-production.yml` - Deploy to production on tag
- `release.yml` - Create release on version tag
- `rollback.yml` - Manual rollback workflow

#### GitLab CI
- Multi-stage pipeline (deploy-dev, deploy-staging, quality-gates, deploy-production)
- Platform detection and deployment
- Load testing before production

#### Jenkins
- Jenkinsfile with multi-branch support
- Automatic rollback on failure
- Production approval gate

#### CircleCI
- Multi-job workflows
- Environment-specific deployments

**Features:**
- **Automated Deployment** - Deploy on merge/push/tag
- **Quality Gates** - Load tests and performance checks
- **Approval Gates** - Manual approval for production
- **Rollback Strategy** - Auto-rollback on failure
- **Notifications** - Slack, email, PagerDuty
- **Secrets Management** - Secure credential handling

**Customization Points:**
- Add custom CI/CD platforms
- Modify deployment triggers
- Add custom quality gates
- Configure notification channels
- Extend rollback logic

**Usage Examples:**

**GitHub Actions:**
```yaml
# .github/workflows/deploy-production.yml
- name: Deploy to Production
  run: |
    bmad-cli invoke bmi/deploy \
      --version "${{ steps.version.outputs.VERSION }}" \
      --environment production \
      --deployment-strategy blue-green
```

**GitLab CI:**
```yaml
# .gitlab-ci.yml
deploy-production:
  stage: deploy-production
  only:
    - tags
  script:
    - bmad-cli invoke bmi/deploy \
        --version "${CI_COMMIT_TAG#v}" \
        --environment production
```

**Jenkins:**
```groovy
// Jenkinsfile
stage('Deploy to Production') {
  when { tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP" }
  steps {
    sh """
      bmad-cli invoke bmi/deploy \
        --version \${VERSION} \
        --environment production
    """
  }
}
```

**See:** [ci-cd-integration-template.md](ci-cd-integration-template.md)

---

## Using Templates

### 1. Choose Template

Select the template that best matches your use case:
- **Simple deployment** → basic-deploy-template
- **Epic release** → epic-release-template
- **Monitoring** → monitoring-template
- **CI/CD automation** → ci-cd-integration-template

### 2. Copy Template

```bash
# Copy template to custom workflows directory
cp bmad/bmi/templates/<template-name>.md \
   bmad/bmi/workflows/custom/<your-workflow-name>/
```

### 3. Customize

Edit the three main files:

**workflow.yaml:**
- Modify inputs/outputs
- Adjust configuration
- Update success criteria

**instructions.md:**
- Customize workflow steps
- Add/remove actions
- Modify agent behavior

**checklist.md:**
- Add project-specific checks
- Modify quality gates
- Update validation criteria

### 4. Test

```bash
# Test workflow with dry-run
bmad-cli invoke bmi/custom/<your-workflow-name> \
  --dry-run \
  --input1 value1

# Run actual workflow
bmad-cli invoke bmi/custom/<your-workflow-name> \
  --input1 value1 \
  --input2 value2
```

### 5. Iterate

- Test in dev environment first
- Gather feedback
- Refine workflow
- Document changes

---

## Template Structure

All templates follow the same structure:

```markdown
# BMI Workflow Template: [Name]

## Overview
Brief description and purpose

## workflow.yaml Template
Complete workflow.yaml configuration

## instructions.md Template
Step-by-step workflow instructions

## checklist.md Template
Quality checklist

## Usage Example
How to use the template

## Customization Tips
How to customize for specific needs

## Related Workflows
Links to related BMI workflows
```

---

## Creating Your Own Templates

You can create your own templates for common use cases in your organization:

### Template Guidelines

1. **Document Everything** - Include complete workflow.yaml, instructions.md, and checklist.md
2. **Provide Examples** - Show real usage examples
3. **Explain Customization** - Point out customization points
4. **Follow Conventions** - Use BMAD Method v6 conventions
5. **Test Thoroughly** - Test template across different scenarios

### Template Checklist

- [ ] Complete workflow.yaml with all inputs/outputs
- [ ] Detailed instructions.md with all steps
- [ ] Comprehensive checklist.md
- [ ] Usage examples for common scenarios
- [ ] Customization guide
- [ ] Related workflows documented
- [ ] Tested in real environment

---

## Best Practices

### When to Use Templates

- **Starting new workflows** - Templates provide structure
- **Learning BMI** - See how workflows are built
- **Standardization** - Ensure consistency across workflows
- **Rapid prototyping** - Quick starts for new use cases

### When to Build from Scratch

- **Highly custom workflows** - Templates may be too constraining
- **Simple one-off tasks** - Template overhead not worth it
- **Experimental workflows** - Freedom to explore

### Template Customization Tips

1. **Start with closest template** - Don't start from scratch
2. **Keep what works** - Don't reinvent the wheel
3. **Document changes** - Note what you customized and why
4. **Test incrementally** - Test each customization
5. **Share back** - Contribute improvements to templates

---

## Support

- **Main Documentation**: [../README.md](../README.md)
- **Workflows**: [../workflows/README.md](../workflows/README.md)
- **Tasks**: [../tasks/README.md](../tasks/README.md)
- **Agents**: [../agents/README.md](../agents/README.md)

---

**Last Updated:** 2025-11-15
