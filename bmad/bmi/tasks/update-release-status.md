# Task: Update Release Status

**Purpose:** Update release-status.yaml file with release information

**Used By:** release, hotfix, changelog-generation workflows

**Inputs:**
- `release_version` - Version being released (e.g., "1.2.3")
- `release_type` - Type of release (major, minor, patch, prerelease, hotfix)
- `package_ecosystem` - Ecosystem (nodejs_npm, python_pypi, rust_crates, etc.)
- `registry` - Target registry (npm, PyPI, crates.io, etc.)
- `changelog` - Changelog for this release
- `breaking_changes` - List of breaking changes (if any)

**Outputs:**
- `status_updated` - Boolean indicating if status file was updated
- `previous_version` - Previous version released

---

## Status File Location

```
bmad/bmi/integration/status/release-status.yaml
```

---

## Update Logic

### 1. Read current status file

```bash
STATUS_FILE="bmad/bmi/integration/status/release-status.yaml"
```

### 2. Update latest release

```yaml
latest_release:
  version: "${release_version}"
  released_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  release_type: "${release_type}"
  package_ecosystem: "${package_ecosystem}"
  registry: "${registry}"
  changelog: "${changelog}"
  breaking_changes: ${breaking_changes_array}
```

### 3. Add to release history

```yaml
# Append to release_history
release_history:
  - version: "${release_version}"
    released_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    release_type: "${release_type}"
    package_ecosystem: "${package_ecosystem}"
    registry: "${registry}"
    breaking_changes: ${has_breaking_changes}
    hotfix: ${is_hotfix}
    prerelease: ${is_prerelease}
```

### 4. Update release metrics

```yaml
release_metrics:
  total_releases: ${total_releases + 1}
  major_releases: ${major_releases + (release_type == 'major' ? 1 : 0)}
  minor_releases: ${minor_releases + (release_type == 'minor' ? 1 : 0)}
  patch_releases: ${patch_releases + (release_type == 'patch' ? 1 : 0)}
  hotfixes: ${hotfixes + (is_hotfix ? 1 : 0)}
  # DORA metrics
  release_frequency:
    per_day: ${calculate from history}
    per_week: ${calculate from history}
```

---

## Implementation Example (YAML manipulation)

```bash
#!/bin/bash

# Function to update release status
update_release_status() {
  local release_version=$1
  local release_type=$2
  local package_ecosystem=$3
  local registry=$4
  local changelog=$5
  local breaking_changes=$6  # JSON array or empty string

  local status_file="bmad/bmi/integration/status/release-status.yaml"
  local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Check if breaking changes
  local has_breaking=false
  if [ -n "$breaking_changes" ] && [ "$breaking_changes" != "[]" ]; then
    has_breaking=true
  fi

  # Check if hotfix
  local is_hotfix=false
  if [ "$release_type" = "hotfix" ]; then
    is_hotfix=true
  fi

  # Update latest release
  yq eval -i ".latest_release.version = \"${release_version}\"" "$status_file"
  yq eval -i ".latest_release.released_at = \"${timestamp}\"" "$status_file"
  yq eval -i ".latest_release.release_type = \"${release_type}\"" "$status_file"
  yq eval -i ".latest_release.package_ecosystem = \"${package_ecosystem}\"" "$status_file"
  yq eval -i ".latest_release.registry = \"${registry}\"" "$status_file"
  yq eval -i ".latest_release.changelog = \"${changelog}\"" "$status_file"

  if [ "$has_breaking" = true ]; then
    yq eval -i ".latest_release.breaking_changes = ${breaking_changes}" "$status_file"
  else
    yq eval -i ".latest_release.breaking_changes = []" "$status_file"
  fi

  # Add to release history
  local history_entry="{version: \"${release_version}\", released_at: \"${timestamp}\", release_type: \"${release_type}\", package_ecosystem: \"${package_ecosystem}\", registry: \"${registry}\", breaking_changes: ${has_breaking}, hotfix: ${is_hotfix}}"
  yq eval -i ".release_history += [${history_entry}]" "$status_file"

  # Keep only last 50 releases in history
  yq eval -i ".release_history |= .[-50:]" "$status_file"

  # Update metrics
  yq eval -i ".release_metrics.total_releases += 1" "$status_file"

  case "$release_type" in
    major)
      yq eval -i ".release_metrics.major_releases += 1" "$status_file"
      ;;
    minor)
      yq eval -i ".release_metrics.minor_releases += 1" "$status_file"
      ;;
    patch)
      yq eval -i ".release_metrics.patch_releases += 1" "$status_file"
      ;;
    hotfix)
      yq eval -i ".release_metrics.hotfixes += 1" "$status_file"
      ;;
  esac

  # Calculate DORA metrics (release frequency)
  # This would be done by analyzing release_history timestamps
  # For simplicity, we'll increment counters here

  echo "✅ Release status updated: ${release_version} (${release_type})"
}

# Usage
update_release_status "1.2.3" "minor" "nodejs_npm" "npm" "Added new features" "[]"
```

---

## Usage Example

```yaml
# From release workflow
<step n="11" goal="Update Release Status">
  <action>Invoke task: update-release-status</action>
    - release_version: {version}
    - release_type: {release_type}
    - package_ecosystem: {ecosystem}
    - registry: {registry}
    - changelog: {changelog_content}
    - breaking_changes: {breaking_changes_list}

  <action>Display: "Release status updated in release-status.yaml"</action>
</step>
```

---

## Hotfix Status Update

When releasing a hotfix, include additional metadata:

```yaml
release_history:
  - version: "1.2.4"
    released_at: "2025-11-15T12:00:00Z"
    release_type: "hotfix"
    package_ecosystem: "nodejs_npm"
    registry: "npm"
    breaking_changes: false
    hotfix: true
    incident_id: "INC-20251115-001"
    base_version: "1.2.3"
    hotfix_reason: "Critical security vulnerability patched"
```

---

## Prerelease Status Update

For prereleases (alpha, beta, rc):

```yaml
active_prereleases:
  - version: "2.0.0-beta.1"
    prerelease_type: "beta"
    released_at: "2025-11-15T13:00:00Z"
    target_version: "2.0.0"
    feedback_period: "2 weeks"
    ready_for_stable: false
```

---

## DORA Metrics Calculation

This task also updates DORA metrics:

```yaml
release_metrics:
  release_frequency:  # DORA metric
    per_day: 0.8  # Average releases per day
    per_week: 5.6  # Average releases per week
    per_month: 24  # Average releases per month

  change_failure_rate:  # DORA metric (requires incident tracking)
    percentage: 2.5  # Percentage of releases causing incidents
    total_failed_releases: 3
```

Calculation done on the fly based on release history and incident correlation.
