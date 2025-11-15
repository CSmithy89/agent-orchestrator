# BMI Tasks

BMI tasks are reusable, composable operations that can be invoked by workflows or used standalone. Each task performs a specific, well-defined operation.

---

## Task Composition Philosophy

### What Are BMI Tasks?

BMI tasks are **composable documentation patterns** that define reusable operations for deployment and release workflows. Unlike executable scripts, tasks are:

1. **Specifications, not implementations** - Task .md files document the contract (inputs, outputs, behavior) but don't contain executable code
2. **Implementation-agnostic** - The same task can be implemented differently across platforms (e.g., smoke tests might use different tools per platform)
3. **Composable building blocks** - Tasks are designed to be combined within workflows to create complex deployment pipelines
4. **Agent-interpretable** - AI agents (Diana, Rita, Phoenix) read task documentation and implement the logic within workflow context

### How Tasks Work

```
Task Definition (.md file)
    ↓
  Specifies: Inputs, Outputs, Behavior
    ↓
Implementation (by agent or script)
    ↓
  Invoked: From workflow or standalone
    ↓
Returns: Documented outputs
```

### Task vs. Workflow vs. Platform Script

| Aspect | Task | Workflow | Platform Script |
|--------|------|----------|-----------------|
| **What** | Reusable operation specification | End-to-end process orchestration | Platform-specific executable |
| **File Type** | Markdown (.md) | YAML + Markdown | Bash script (.sh) |
| **Execution** | Implemented by agent/workflow | Orchestrates multiple tasks | Direct bash execution |
| **Example** | `detect-platform.md` | `deploy` workflow | `vercel.sh` |
| **Reusability** | Used by multiple workflows | May call multiple tasks | Called by deploy workflow |

### Composability Example

A deployment workflow composes multiple tasks:

```
deploy workflow
├── Task: detect-platform
│   └── Returns: platform=vercel, confidence=high
├── Task: calculate-version
│   └── Returns: next_version=1.2.3
├── Platform Script: vercel.sh
│   └── Implements: deploy() function
├── Task: run-smoke-tests
│   └── Returns: test_results=all_passed
└── Task: update-deployment-status
    └── Updates: deployment-status.yaml
```

Each task is self-contained, testable, and reusable across workflows.

### When to Create a Task

Create a new BMI task when:

- ✅ Operation is used by **2+ workflows** (promotes reusability)
- ✅ Operation has **clear inputs/outputs** (well-defined contract)
- ✅ Operation is **platform-agnostic** or has multiple implementations
- ✅ Operation can be **tested independently** of workflows
- ✅ Operation represents a **single responsibility** (one thing well)

Don't create a task when:

- ❌ Operation is **workflow-specific** (put logic in workflow instructions.md)
- ❌ Operation is **platform-specific** (belongs in platform script like vercel.sh)
- ❌ Operation has **no clear reuse case** (YAGNI - You Aren't Gonna Need It)
- ❌ Operation is too **simple** (e.g., "echo version" - just use inline action)

### Task Implementation Freedom

The task .md file documents **WHAT** the task does, not **HOW** it's implemented. This allows:

**Example: `run-smoke-tests` task**

**Node.js project implementation:**
```bash
# Agent might implement using Jest
npm run test:smoke
```

**Python project implementation:**
```bash
# Agent might implement using pytest
pytest tests/smoke/
```

**Custom implementation:**
```bash
# Agent might implement using curl
curl -f https://app.com/health || exit 1
```

All three implementations satisfy the `run-smoke-tests` task contract (inputs: target_url, outputs: test_results).

### Task Documentation Best Practices

When documenting tasks:

1. **Specify contract clearly** - Define all inputs, outputs, and side effects
2. **Provide usage examples** - Show how task is invoked from workflows and standalone
3. **Document error conditions** - What can go wrong and how to handle it
4. **Include implementation guidance** - Pseudocode or reference implementations
5. **List dependent workflows** - Which workflows use this task
6. **Version compatibility** - Note if task behavior changes across versions

**Example task structure:**
```markdown
# Task: task-name

**Purpose:** One-line description

**Used By:** workflow-1, workflow-2

## Inputs
- `input1` - Description (required)
- `input2` - Description (optional, default: value)

## Outputs
- `output1` - Description
- `output2` - Description

## Implementation Guidance
Pseudocode or reference implementation

## Error Handling
- Error condition 1 → Resolution
- Error condition 2 → Resolution

## Usage Examples
From workflow and standalone
```

---

## Task Overview

| Task | Category | Purpose | Used By |
|------|----------|---------|---------|
| **detect-platform** | Deployment | Auto-detect deployment platform | deploy, container-build |
| **run-smoke-tests** | Deployment | Execute smoke tests after deployment | deploy, rollback |
| **update-deployment-status** | Deployment | Update deployment status tracking | deploy, rollback, hotfix |
| **update-release-status** | Release | Update release status tracking | release, hotfix |
| **calculate-version** | Release | Calculate semantic version | release, hotfix |
| **publish-to-registry** | Release | Publish to package registries | release, hotfix |
| **generate-release-notes** | Release | Generate release notes from commits | release, changelog-generation |

---

## Deployment Tasks

### detect-platform

**Purpose:** Auto-detect deployment platform from config files

**How it Works:**
Scans for platform-specific configuration files and returns the detected platform with a confidence level.

**Supported Platforms (15+):**
- Vercel (vercel.json)
- Railway (railway.json, railway.toml)
- Heroku (Procfile, app.json)
- Kubernetes (k8s/, kubernetes/, deployment.yaml)
- Docker (Dockerfile, docker-compose.yml)
- Netlify (netlify.toml)
- Fly.io (fly.toml)
- Cloudflare Pages (wrangler.toml)
- AWS Elastic Beanstalk (.elasticbeanstalk/)
- GCP App Engine (app.yaml)
- Azure App Service (azure-pipelines.yml)
- Render (render.yaml)
- DigitalOcean App Platform (.do/app.yaml)
- GitLab Pages (.gitlab-ci.yml)
- Generic Docker (fallback)

**Inputs:**
- `project_path` - Path to project directory (default: current directory)

**Outputs:**
- `platform` - Detected platform name
- `confidence` - Detection confidence (high, medium, low)
- `config_file` - Configuration file found

**Detection Logic:**
```bash
# Example: Vercel detection
if [ -f "vercel.json" ]; then
  platform="vercel"
  confidence="high"
  config_file="vercel.json"
fi
```

**Usage:**
```bash
# From workflow
<action>Invoke task: detect-platform</action>
<action>Platform detected: {platform} (confidence: {confidence})</action>

# Standalone
bmad-cli invoke bmi/tasks/detect-platform \
  --project-path "/path/to/project"
```

**See:** [detect-platform.md](detect-platform.md)

---

### run-smoke-tests

**Purpose:** Execute automated smoke tests after deployment

**Test Categories (6):**
1. **Health Check** - HTTP GET to /health or /healthz endpoint
2. **API Tests** - Critical API endpoints (GET /api/status, etc.)
3. **UI Tests** - Homepage and critical UI pages load
4. **Database Connectivity** - Database connection test
5. **Authentication** - Login endpoint test
6. **Integration** - External service integration tests

**Retry Logic:**
- Up to 3 retries per test
- Exponential backoff (2s, 4s, 8s)
- Continue on failure (collect all results)

**Inputs:**
- `target_url` - Deployed application URL
- `test_categories` - Categories to test (array, default: all)
- `max_retries` - Maximum retries per test (default: 3)

**Outputs:**
- `test_results` - Results for each category (pass/fail)
- `failed_tests` - List of failed tests
- `total_tests` - Total tests executed
- `passed_tests` - Number of passed tests

**Test Format:**
```yaml
test_results:
  health_check: pass
  api_tests: pass
  ui_tests: pass
  database: pass
  authentication: pass
  integration: fail  # Example failure
```

**Usage:**
```bash
# From workflow
<action>Invoke task: run-smoke-tests</action>
  - target_url: {deployment_url}
  - test_categories: ["health", "api", "ui"]

# Standalone
bmad-cli invoke bmi/tasks/run-smoke-tests \
  --target-url "https://staging.myapp.com" \
  --test-categories '["health","api","ui"]'
```

**See:** [run-smoke-tests.md](run-smoke-tests.md)

---

### update-deployment-status

**Purpose:** Update deployment-status.yaml with deployment information

**Status File Location:**
```
bmad/bmi/integration/status/deployment-status.yaml
```

**Updates:**
1. Current deployments per environment
2. Deployment history (last 10 per environment)
3. Deployment metrics (DORA)
4. Epic deployments
5. Rollback history

**DORA Metrics Tracked:**
- Deployment frequency (per day, week, month)
- Total deployments
- Successful/failed deployments
- Average deployment time

**Inputs:**
- `environment` - Target environment (dev, staging, production)
- `version` - Deployed version
- `status` - Deployment status (deployed, failed, rolling-back)
- `deployment_strategy` - Strategy used (rolling, blue-green, etc.)
- `deployed_by` - Agent or user who deployed

**Outputs:**
- `status_updated` - Boolean indicating success
- `previous_version` - Previous version deployed to this environment

**YAML Manipulation:**
```bash
# Example using yq
yq eval -i ".current_deployments.${environment}.version = \"${version}\"" "$status_file"
yq eval -i ".deployment_metrics.total_deployments += 1" "$status_file"
```

**Usage:**
```bash
# From workflow
<action>Invoke task: update-deployment-status</action>
  - environment: {environment}
  - version: {version}
  - status: deployed
  - deployment_strategy: {strategy}
  - deployed_by: diana

# Standalone
bmad-cli invoke bmi/tasks/update-deployment-status \
  --environment production \
  --version "1.2.3" \
  --status deployed \
  --deployment-strategy blue-green \
  --deployed-by diana
```

**See:** [update-deployment-status.md](update-deployment-status.md)

---

## Release Tasks

### update-release-status

**Purpose:** Update release-status.yaml with release information

**Status File Location:**
```
bmad/bmi/integration/status/release-status.yaml
```

**Updates:**
1. Latest release
2. Release history (last 50)
3. Release metrics (DORA)
4. Active prereleases
5. Hotfix history

**DORA Metrics Tracked:**
- Release frequency (per day, week, month)
- Total releases by type (major, minor, patch, hotfix)
- Change failure rate
- Breaking changes tracking

**Inputs:**
- `release_version` - Version being released
- `release_type` - Type (major, minor, patch, prerelease, hotfix)
- `package_ecosystem` - Ecosystem (nodejs_npm, python_pypi, etc.)
- `registry` - Target registry (npm, PyPI, etc.)
- `changelog` - Changelog for this release
- `breaking_changes` - List of breaking changes

**Outputs:**
- `status_updated` - Boolean indicating success
- `previous_version` - Previous version released

**Usage:**
```bash
# From workflow
<action>Invoke task: update-release-status</action>
  - release_version: {version}
  - release_type: {type}
  - package_ecosystem: {ecosystem}
  - registry: {registry}
  - changelog: {changelog}
  - breaking_changes: {breaking_changes}

# Standalone
bmad-cli invoke bmi/tasks/update-release-status \
  --release-version "1.2.3" \
  --release-type minor \
  --package-ecosystem nodejs_npm \
  --registry npm
```

**See:** [update-release-status.md](update-release-status.md)

---

### calculate-version

**Purpose:** Calculate next semantic version from commits or explicit bump

**Version Bump Strategies:**
1. **Auto-detection** - Analyze conventional commits for version bump type
2. **Explicit** - User specifies major, minor, or patch
3. **Prerelease** - Alpha, beta, or rc versions

**Conventional Commit Detection:**
- **BREAKING CHANGE** or `!` → MAJOR bump
- **feat:** → MINOR bump
- **fix:** → PATCH bump
- Other types → PATCH bump (default)

**Ecosystem Support:**
- **Node.js** - package.json
- **Python** - pyproject.toml, setup.py
- **Rust** - Cargo.toml
- **Go** - git tags (vX.Y.Z)
- **.NET** - *.csproj

**Inputs:**
- `current_version` - Current version
- `version_bump` - Bump type (major, minor, patch, prerelease, auto)
- `prerelease_identifier` - For prereleases (alpha, beta, rc)
- `commit_range` - Git commit range for auto-detection
- `package_ecosystem` - Ecosystem for version file detection

**Outputs:**
- `next_version` - Calculated next version
- `version_bump_type` - Applied bump type
- `breaking_changes_detected` - Boolean

**Examples:**
```
Current: 1.2.3

major   → 2.0.0
minor   → 1.3.0
patch   → 1.2.4
prerelease (alpha) → 1.2.4-alpha.1
```

**Usage:**
```bash
# From workflow
<action>Invoke task: calculate-version</action>
  - current_version: {current}
  - version_bump: auto
  - commit_range: "{last_tag}..HEAD"

# Standalone
bmad-cli invoke bmi/tasks/calculate-version \
  --current-version "1.2.3" \
  --version-bump auto \
  --commit-range "v1.2.3..HEAD"
```

**See:** [calculate-version.md](calculate-version.md)

---

### publish-to-registry

**Purpose:** Publish package to appropriate registry

**Supported Ecosystems (8):**
1. **Node.js** → npm (npmjs.org)
2. **Python** → PyPI (pypi.org)
3. **Rust** → crates.io
4. **. NET** → NuGet (nuget.org)
5. **Ruby** → RubyGems (rubygems.org)
6. **Go** → Go Proxy (via git tags)
7. **Java** → Maven Central
8. **PHP** → Packagist (auto via GitHub webhook)

**Features:**
- Dry-run mode for testing
- Pre-publish validation
- Authentication handling
- Post-publish verification
- Error handling and retry logic

**Inputs:**
- `package_ecosystem` - Ecosystem
- `registry` - Target registry
- `version` - Version being published
- `registry_token_env` - Environment variable name for token
- `dry_run` - Test without actually publishing (default: false)
- `access` - Access level (public, restricted) - for npm

**Outputs:**
- `publish_success` - Boolean indicating success
- `registry_url` - URL to published package
- `publish_time` - Time taken to publish

**Usage:**
```bash
# From workflow
<action>Invoke task: publish-to-registry</action>
  - package_ecosystem: nodejs_npm
  - registry: npm
  - version: {version}
  - registry_token_env: NPM_TOKEN
  - dry_run: false

# Standalone
bmad-cli invoke bmi/tasks/publish-to-registry \
  --package-ecosystem nodejs_npm \
  --registry npm \
  --version "1.2.3" \
  --registry-token-env NPM_TOKEN
```

**See:** [publish-to-registry.md](publish-to-registry.md)

---

### generate-release-notes

**Purpose:** Generate release notes from commits, PRs, and changelog

**Supported Formats (4):**
1. **Keep a Changelog** - Structured format with categories
2. **Conventional Commits** - Commit type grouping
3. **GitHub Releases** - GitHub-style with PR links
4. **Custom** - Custom template format

**Features:**
- Breaking changes detection
- PR integration and attribution
- Contributor listing
- Customizable sections
- Multi-release support

**Inputs:**
- `commit_range` - Git commit range (e.g., "v1.2.3..HEAD")
- `release_version` - Version being released
- `release_type` - Type of release (major, minor, patch)
- `changelog_format` - Format to use
- `include_prs` - Include PR links (default: true)
- `include_contributors` - Include contributor list (default: true)

**Outputs:**
- `release_notes` - Generated release notes in markdown
- `breaking_changes` - List of breaking changes
- `contributors` - List of contributors

**Example Output (Keep a Changelog):**
```markdown
## [1.3.0] - 2025-11-15

### Added
- New user authentication system (#123)
- Support for OAuth2 providers (#125)

### Fixed
- Null pointer exception in user service (#130)

### Breaking Changes
- Authentication API endpoint changed to /api/v2/auth
```

**Usage:**
```bash
# From workflow
<action>Invoke task: generate-release-notes</action>
  - commit_range: "v1.2.3..HEAD"
  - release_version: "1.3.0"
  - changelog_format: keep-a-changelog

# Standalone
bmad-cli invoke bmi/tasks/generate-release-notes \
  --commit-range "v1.2.3..HEAD" \
  --release-version "1.3.0" \
  --changelog-format keep-a-changelog
```

**See:** [generate-release-notes.md](generate-release-notes.md)

---

## Task Development Guidelines

When creating new BMI tasks:

1. **Single Responsibility** - Each task should do one thing well
2. **Reusable** - Design for use across multiple workflows
3. **Documented Inputs/Outputs** - Clearly specify all parameters
4. **Error Handling** - Provide clear error messages
5. **Idempotent** - Running multiple times produces same result
6. **Platform Agnostic** - Work across different platforms when possible

---

## Task Invocation

### From Workflows

```yaml
<step n="N" goal="Invoke Task">
  <action>Invoke task: task-name</action>
    - input1: {value1}
    - input2: {value2}
  <action>Parse output: {output1}</action>
</step>
```

### Standalone

```bash
bmad-cli invoke bmi/tasks/task-name \
  --input1 value1 \
  --input2 value2
```

### From Scripts

```bash
#!/bin/bash

# Invoke task and capture output
result=$(bmad-cli invoke bmi/tasks/detect-platform --project-path .)

# Parse JSON output
platform=$(echo "$result" | jq -r '.platform')
echo "Detected platform: $platform"
```

---

## Creating Custom Tasks

Tasks are markdown files with a specific structure:

```markdown
# Task: Task Name

**Purpose:** Brief purpose description

**Used By:** List of workflows that use this task

**Inputs:**
- `input_name` - Description

**Outputs:**
- `output_name` - Description

## Implementation

Bash implementation or pseudocode
```

---

## Support

- **Main Documentation**: [../README.md](../README.md)
- **Workflows**: [../workflows/README.md](../workflows/README.md)
- **Templates**: [../templates/README.md](../templates/README.md)

---

**Last Updated:** 2025-11-15
