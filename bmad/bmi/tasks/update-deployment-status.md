# Task: Update Deployment Status

**Purpose:** Update deployment-status.yaml file with deployment information

**Used By:** deploy, rollback workflows

**Inputs:**
- `environment` - Target environment (dev, staging, production)
- `version` - Deployed version
- `status` - Deployment status (deployed, failed, rolling-back)
- `deployment_strategy` - Strategy used (rolling, blue-green, canary)
- `deployed_by` - Agent or user who deployed (diana, rita, user)

**Outputs:**
- `status_updated` - Boolean indicating if status file was updated
- `previous_version` - Previous version deployed to this environment

---

## Status File Location

```
bmad/bmi/integration/status/deployment-status.yaml
```

---

## Update Logic

### 1. Read current status file

```bash
STATUS_FILE="bmad/bmi/integration/status/deployment-status.yaml"
```

### 2. Update current deployment for environment

```yaml
# Update current_deployments section
current_deployments:
  ${environment}:
    version: "${version}"
    deployed_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    deployed_by: "${deployed_by}"
    deployment_strategy: "${deployment_strategy}"
    status: "${status}"
```

### 3. Add to deployment history

```yaml
# Append to deployment_history for environment
deployment_history:
  ${environment}:
    - version: "${version}"
      deployed_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      deployed_by: "${deployed_by}"
      deployment_strategy: "${deployment_strategy}"
      status: "${status}"
      smoke_tests: "${smoke_tests_result}"
      rollback: false
```

### 4. Update metrics

```yaml
deployment_metrics:
  total_deployments: ${total_deployments + 1}
  successful_deployments: ${successful_deployments + (status == 'deployed' ? 1 : 0)}
  failed_deployments: ${failed_deployments + (status == 'failed' ? 1 : 0)}
  # ... other metrics
```

---

## Implementation Example (YAML manipulation)

```bash
#!/bin/bash

# Function to update deployment status
update_deployment_status() {
  local environment=$1
  local version=$2
  local status=$3
  local deployment_strategy=$4
  local deployed_by=$5

  local status_file="bmad/bmi/integration/status/deployment-status.yaml"
  local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Use yq or sed to update YAML file
  # Example with yq:
  yq eval -i ".current_deployments.${environment}.version = \"${version}\"" "$status_file"
  yq eval -i ".current_deployments.${environment}.deployed_at = \"${timestamp}\"" "$status_file"
  yq eval -i ".current_deployments.${environment}.deployed_by = \"${deployed_by}\"" "$status_file"
  yq eval -i ".current_deployments.${environment}.deployment_strategy = \"${deployment_strategy}\"" "$status_file"
  yq eval -i ".current_deployments.${environment}.status = \"${status}\"" "$status_file"

  # Add to history
  local history_entry="{version: \"${version}\", deployed_at: \"${timestamp}\", deployed_by: \"${deployed_by}\", deployment_strategy: \"${deployment_strategy}\", status: \"${status}\"}"
  yq eval -i ".deployment_history.${environment} += [${history_entry}]" "$status_file"

  # Keep only last 10 deployments in history
  yq eval -i ".deployment_history.${environment} |= .[-10:]" "$status_file"

  # Update metrics
  yq eval -i ".deployment_metrics.total_deployments += 1" "$status_file"
  if [ "$status" = "deployed" ]; then
    yq eval -i ".deployment_metrics.successful_deployments += 1" "$status_file"
  elif [ "$status" = "failed" ]; then
    yq eval -i ".deployment_metrics.failed_deployments += 1" "$status_file"
  fi

  echo "✅ Deployment status updated for ${environment}: ${version} (${status})"
}

# Usage
update_deployment_status "production" "1.2.3" "deployed" "blue-green" "diana"
```

---

## Usage Example

```yaml
# From deploy workflow
<step n="10" goal="Update Deployment Status">
  <action>Invoke task: update-deployment-status</action>
    - environment: {environment}
    - version: {version}
    - status: {deployment_status}  # deployed or failed
    - deployment_strategy: {deployment_strategy}
    - deployed_by: {deployed_by}

  <action>Display: "Deployment status updated in deployment-status.yaml"</action>
</step>
```

---

## Rollback Status Update

When rolling back, mark as rollback in history:

```yaml
deployment_history:
  production:
    - version: "1.2.2"  # Rolled back to
      deployed_at: "2025-11-15T11:00:00Z"
      deployed_by: "diana"
      deployment_strategy: "blue-green-instant"
      status: "deployed"
      rollback: true  # Mark as rollback
      rollback_from: "1.2.3"  # Rolled back from this version
      rollback_reason: "High error rate detected"
```

---

## Epic Deployment Status

For epic deployments, add to epic_deployments section:

```yaml
epic_deployments:
  - epic_id: "EPIC-001-user-auth"
    version: "epic-user-auth-v1"
    environment: "staging"
    status: "deployed"
    deployed_at: "2025-11-15T14:00:00Z"
    stories_included: ["AUTH-123", "AUTH-124", "AUTH-125"]
    validation:
      load_testing: "passed"
      monitoring: "configured"
      smoke_tests: "passed"
    ready_for_production: true
```

---

## DORA Metrics Calculation

This task also updates DORA metrics:

```yaml
deployment_metrics:
  deployment_frequency:  # DORA metric
    per_day: 5.2  # Average deployments per day
    per_week: 36.4  # Average deployments per week
    per_month: 156  # Average deployments per month
```

Calculation done on the fly based on deployment history.
