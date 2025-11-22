# BMI Workflow Template: Basic Deployment

This template demonstrates a basic deployment workflow for BMI. Use this as a starting point for creating custom deployment workflows.

---

## Template Structure

```
bmad/bmi/workflows/custom/my-deployment/
├── workflow.yaml       # Workflow configuration
├── instructions.md     # Step-by-step instructions
└── checklist.md        # Quality checklist
```

---

## workflow.yaml Template

```yaml
workflow:
  name: "my-deployment"
  description: "Custom deployment workflow for [your application]"
  category: "deployment"
  agent: "diana"  # Diana (DevOps Engineer) handles deployments

  # Configuration variables
  config:
    communication_language: "English"
    user_skill_level: "intermediate"
    document_output_language: "English"

  # Input parameters
  inputs:
    version:
      description: "Version to deploy (e.g., '1.2.3' or 'latest')"
      required: true
      default: "latest"

    environment:
      description: "Target environment"
      required: true
      options: ["dev", "staging", "production"]
      default: "dev"

    deployment_strategy:
      description: "Deployment strategy to use"
      required: false
      options: ["rolling", "blue-green", "canary", "recreate"]
      default: "rolling"

    skip_smoke_tests:
      description: "Skip smoke tests after deployment"
      required: false
      type: "boolean"
      default: false

  # Outputs
  outputs:
    deployment_status:
      description: "Success or failure status"
      type: "string"

    deployment_url:
      description: "URL of deployed application"
      type: "string"

    deployment_time:
      description: "Time taken for deployment in seconds"
      type: "number"

  # Tasks used by this workflow
  tasks:
    - detect-platform: "Auto-detect deployment platform"
    - run-smoke-tests: "Execute smoke tests after deployment"
    - update-deployment-status: "Update deployment status file"

  # Platform support
  platform_support:
    - vercel: "Serverless deployments"
    - railway: "Full-stack applications"
    - heroku: "12-factor apps"
    - kubernetes: "Containerized workloads"
    - docker: "Container deployments"

  # Success criteria
  success_criteria:
    - smoke_tests_pass: "All smoke tests must pass"
    - deployment_healthy: "Application health checks pass"
    - rollback_ready: "Previous version available for rollback"

  # Estimated duration
  estimated_duration: "5-15 minutes"
```

---

## instructions.md Template

```markdown
# My Deployment Workflow Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/custom/my-deployment/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<workflow>

<step n="1" goal="Initialize Deployment Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll deploy {version} to {environment}."</action>
  <action>Validate inputs:</action>
    - Version: {version}
    - Environment: {environment}
    - Strategy: {deployment_strategy}
  <action if="environment is production">WARN: "Deploying to production. Ensure all quality gates passed."</action>
</step>

<step n="2" goal="Detect Deployment Platform">
  <action>Invoke task: detect-platform</action>
  <action>Parse output to determine platform type</action>
  <action>Display: "Detected platform: {platform} (confidence: {confidence})"</action>
  <action if="platform is unknown">ERROR: "Unable to detect platform. Please specify manually."</action>
</step>

<step n="3" goal="Verify Deployment Prerequisites">
  <action>Check deployment requirements:</action>
    - Environment configured: {environment}
    - Platform credentials available
    - Version exists in source control
  <action if="any check fails">ERROR: "Prerequisites not met. Aborting deployment."</action>
</step>

<step n="4" goal="Build Application">
  <action if="platform requires build">Build application for {platform}:</action>
    - Run build command for platform
    - Generate deployment artifacts
  <action>Display build summary: "Build completed in {build_time}s"</action>
</step>

<step n="5" goal="Execute Deployment">
  <action>Deploy to {environment} using {deployment_strategy} strategy:</action>
    - Start deployment on {platform}
    - Monitor deployment progress
    - Wait for deployment completion
  <action>Track deployment time</action>
  <action>Display: "Deployment completed. URL: {deployment_url}"</action>
</step>

<step n="6" goal="Run Smoke Tests">
  <action if="skip_smoke_tests is true">Skip smoke tests (user requested)</action>
  <action if="skip_smoke_tests is true">Skip to step 7</action>
  <action>Invoke task: run-smoke-tests</action>
    - target_url: {deployment_url}
    - test_categories: ["health", "api", "ui"]
  <action>Parse smoke test results</action>
  <action if="smoke_tests failed">WARN: "Smoke tests failed. Consider rollback."</action>
</step>

<step n="7" goal="Update Deployment Status">
  <action>Invoke task: update-deployment-status</action>
    - environment: {environment}
    - version: {version}
    - status: {deployment_status}
    - deployment_strategy: {deployment_strategy}
    - deployed_by: "diana"
  <action>Display: "Deployment status updated in deployment-status.yaml"</action>
</step>

<step n="8" goal="Deployment Summary">
  <action>Display deployment summary:</action>
    ```
    ✅ Deployment Complete

    Version: {version}
    Environment: {environment}
    Platform: {platform}
    Strategy: {deployment_strategy}
    URL: {deployment_url}
    Time: {deployment_time}s
    Smoke Tests: {smoke_test_status}
    ```
  <action>Workflow complete ✅</action>
</step>

</workflow>
```

---

## checklist.md Template

```markdown
# Deployment Workflow Checklist

## Pre-Deployment

- [ ] Version to deploy is specified and valid
- [ ] Target environment is configured
- [ ] Deployment credentials are available
- [ ] Build artifacts can be generated
- [ ] Previous version is documented (for rollback)

## Deployment

- [ ] Platform detected successfully
- [ ] Build completed without errors
- [ ] Deployment strategy executed
- [ ] Application deployed successfully
- [ ] Deployment URL is accessible

## Post-Deployment

- [ ] Smoke tests executed and passed
- [ ] Application health checks passing
- [ ] Deployment status updated
- [ ] Deployment metrics recorded
- [ ] Team notified of deployment

## Production-Specific (if environment = production)

- [ ] All quality gates passed in staging
- [ ] Load tests completed successfully
- [ ] Performance profiling shows no regressions
- [ ] Security scan completed
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] On-call team notified
```

---

## Usage Example

### Create workflow from template

```bash
# 1. Copy template to custom workflow directory
cp -r bmad/bmi/templates/basic-deploy-template.md bmad/bmi/workflows/custom/my-app-deploy/

# 2. Customize workflow.yaml with your settings
# 3. Customize instructions.md with your deployment steps
# 4. Update checklist.md with your requirements
```

### Invoke custom workflow

```bash
bmad-cli invoke bmi/custom/my-app-deploy \
  --version 1.2.3 \
  --environment staging \
  --deployment-strategy blue-green \
  --skip-smoke-tests false
```

---

## Customization Tips

### 1. Add Custom Tasks

Create project-specific tasks:

```yaml
tasks:
  - custom-build: "Build with custom toolchain"
  - custom-tests: "Run project-specific tests"
```

### 2. Add Environment Variables

Configure environment-specific variables:

```yaml
environments:
  dev:
    url: "https://dev.myapp.com"
    replicas: 1
  staging:
    url: "https://staging.myapp.com"
    replicas: 2
  production:
    url: "https://myapp.com"
    replicas: 5
```

### 3. Add Custom Validations

Add project-specific validation steps:

```xml
<step n="N" goal="Custom Validation">
  <action>Validate custom requirements:</action>
    - Database migrations applied
    - Feature flags configured
    - API keys rotated
</step>
```

### 4. Integrate with CI/CD

Call from GitHub Actions:

```yaml
- name: Deploy with BMI
  run: |
    bmad-cli invoke bmi/custom/my-app-deploy \
      --version ${{ github.sha }} \
      --environment production
```

---

## Related Workflows

- **deploy**: Core BMI deployment workflow (more comprehensive)
- **rollback**: Rollback to previous version if deployment fails
- **monitoring-setup**: Setup monitoring for deployed application
- **load-testing**: Test deployed application under load

---

## Support

For questions or issues:
1. Check BMI documentation: `bmad/bmi/README.md`
2. Review workflow examples: `bmad/bmi/workflows/`
3. Consult agent documentation: `bmad/bmi/agents/diana/`
