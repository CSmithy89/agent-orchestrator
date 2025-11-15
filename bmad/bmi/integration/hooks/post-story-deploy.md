# Post-Story Deployment Hook

**Hook Type:** Post-Development Integration
**Trigger:** BMM `dev-story` workflow completion (story marked DONE)
**BMI Workflows Available:** deploy, container-build
**Auto-Trigger:** false (manual)

---

## Purpose

After a story is completed and marked DONE, this hook allows deploying the changes to a development or staging environment for testing.

---

## When to Use

- Story development is complete and tests pass
- Code has been merged to main/develop branch
- Ready to test in dev/staging environment
- Want to validate changes before release

---

## How to Invoke from BMM Workflows

### Option 1: From `dev-story` workflow completion

Add this step to the end of your `dev-story` instructions.md:

```xml
<step n="final" goal="Optional: Deploy to Environment">
  <action>Ask user: "Story complete. Deploy to dev/staging environment? [y/N]"</action>
  <action if="user confirms">Invoke BMI deploy workflow:</action>
    - workflow: bmad/bmi/workflows/5-deployment/deploy
    - version: {story_version or git SHA}
    - environment: dev OR staging
    - deployment_strategy: rolling
  <action>Display deployment status and URL</action>
</step>
```

### Option 2: From `story-done` workflow

Add to `bmad/bmm/workflows/story-done/instructions.md`:

```xml
<step n="N" goal="Optional: Trigger Deployment">
  <action>Check BMI integration config: bmad/bmi/integration/bmi-integration.yaml</action>
  <action if="post_story_completion.auto_trigger is true">Auto-invoke deploy workflow</action>
  <action if="post_story_completion.auto_trigger is false">Ask user if they want to deploy</action>
</step>
```

---

## Invocation Example

```yaml
# From BMM workflow
invoke_bmi_workflow:
  workflow: deploy
  inputs:
    version: "story-AUTH-123"
    environment: "dev"
    deployment_strategy: "rolling"
    deployment_branch: "main"
    skip_smoke_tests: false

# BMI will handle:
# - Platform detection
# - Build and deployment
# - Smoke tests
# - Status updates
```

---

## Integration Flow

```
BMM dev-story (DONE)
  → Hook: post-story-deploy
    → BMI deploy workflow
      → Build artifacts
      → Deploy to environment
      → Run smoke tests
      → Update deployment-status.yaml
  → Story marked as deployed
```

---

## Status Tracking

Deployment status is tracked in:
```
bmad/bmi/integration/status/deployment-status.yaml
```

Format:
```yaml
deployments:
  - story_id: "AUTH-123"
    version: "story-AUTH-123"
    environment: "dev"
    status: "deployed"
    deployed_at: "2025-11-15T10:30:00Z"
    deployed_by: "diana"
```

---

## Configuration

Controlled by `bmad/bmi/integration/bmi-integration.yaml`:

```yaml
post_story_completion:
  description: "After a story is marked DONE, optionally trigger deployment"
  trigger: "bmm:dev-story workflow completion"
  available_workflows:
    - deploy: "Deploy the completed story to dev/staging environment"
    - container-build: "Build container image for the story"
  auto_trigger: false  # Change to true for automatic deployment
```
