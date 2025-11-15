# Contributing to BMI

Thank you for your interest in contributing to the BMAD Method Infrastructure & DevOps (BMI) module! This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Adding New Platforms](#adding-new-platforms)
4. [Creating New Workflows](#creating-new-workflows)
5. [Adding New Tasks](#adding-new-tasks)
6. [Documentation](#documentation)
7. [Code Style Guidelines](#code-style-guidelines)
8. [Testing Requirements](#testing-requirements)
9. [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project follows the BMAD Method conventions and best practices. All contributors are expected to:

- Be respectful and professional
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in Issues
- Use the bug report template
- Include detailed steps to reproduce
- Include your environment (OS, CLI versions, platform)

###suggesting Enhancements

- Check if the enhancement has already been suggested
- Use the feature request template
- Explain the use case and benefits
- Provide examples if possible

### Contributing Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test your changes thoroughly
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

---

## Adding New Platforms

To add support for a new deployment platform:

### 1. Choose the Right Category

```
bmad/bmi/deployment-platforms/
├── serverless/     # Serverless platforms (Vercel, Railway, etc.)
├── cloud/          # Cloud platforms (AWS, GCP, Azure, etc.)
├── containers/     # Container platforms (Docker, Kubernetes, etc.)
└── mobile/         # Mobile platforms (iOS, Android, etc.)
```

### 2. Create Platform Implementation File

```bash
# Example: Adding Cloudflare Pages
touch bmad/bmi/deployment-platforms/serverless/cloudflare-pages.sh
chmod +x bmad/bmi/deployment-platforms/serverless/cloudflare-pages.sh
```

### 3. Implement Required Functions

Every platform implementation must include these 5 functions:

```bash
#!/bin/bash

# 1. Platform detection
detect() {
  local confidence="none"
  local config_file=""

  # Check for platform-specific config files
  if [ -f "wrangler.toml" ]; then
    confidence="high"
    config_file="wrangler.toml"
  fi

  echo "platform=cloudflare-pages"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# 2. Prerequisites check
check_prerequisites() {
  # Check CLI tool installed
  if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not installed"
    echo "Install: npm install -g wrangler"
    return 1
  fi

  # Check authentication
  if ! wrangler whoami &> /dev/null; then
    echo "❌ Not authenticated with Cloudflare"
    echo "Run: wrangler login"
    return 1
  fi

  echo "✅ Cloudflare Pages prerequisites met"
  return 0
}

# 3. Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Cloudflare Pages..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"

  if [ "$dry_run" = "true" ]; then
    echo "Dry run - would deploy now"
    return 0
  fi

  # Actual deployment logic
  wrangler pages publish ./dist --project-name myapp

  echo "✅ Deployment successful"
  return 0
}

# 4. Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  echo "🔄 Rolling back Cloudflare Pages deployment..."

  # Rollback logic (if platform supports it)
  # Some platforms don't support rollback

  return 0
}

# 5. Get deployment URL
get_deployment_url() {
  local environment=$1

  # Return the deployment URL
  echo "https://myapp.pages.dev"
}

# Main entry point
case "${1}" in
  detect)
    detect
    ;;
  check)
    check_prerequisites
    ;;
  deploy)
    deploy "$2" "$3" "$4" "$5"
    ;;
  rollback)
    rollback "$2" "$3"
    ;;
  get-url)
    get_deployment_url "$2"
    ;;
  *)
    echo "Usage: $0 {detect|check|deploy|rollback|get-url}"
    exit 1
    ;;
esac
```

### 4. Test Your Implementation

```bash
# Test detection
bash bmad/bmi/deployment-platforms/serverless/cloudflare-pages.sh detect

# Test prerequisites
bash bmad/bmi/deployment-platforms/serverless/cloudflare-pages.sh check

# Test deployment (dry-run)
bash bmad/bmi/deployment-platforms/serverless/cloudflare-pages.sh deploy "1.0.0" "staging" "rolling" true

# Test actual deployment
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment staging
```

### 5. Update Documentation

- Add platform to `deployment-platforms/README.md` quick reference table
- Add platform to `PLATFORM-SUPPORT.md`
- Add example config to `examples/configs/`
- Update `tasks/detect-platform.md` with detection logic

### 6. Submit Pull Request

- Include test results
- Include documentation updates
- Describe the new platform and its use cases

---

## Creating New Workflows

To create a new workflow:

### 1. Choose the Right Category

```
bmad/bmi/workflows/
├── 5-deployment/    # Deployment-related workflows
└── 6-release/       # Release-related workflows
```

### 2. Create Workflow Directory

```bash
mkdir -p bmad/bmi/workflows/5-deployment/my-workflow
cd bmad/bmi/workflows/5-deployment/my-workflow
```

### 3. Create Required Files

Every workflow needs:

```
my-workflow/
├── workflow.yaml       # Workflow configuration (REQUIRED)
├── instructions.md     # Execution instructions (REQUIRED)
└── checklist.md        # Quality checklist (REQUIRED)
```

### 4. Define workflow.yaml

```yaml
name: "my-workflow"
description: "Brief description of what this workflow does"
author: "BMad Infrastructure & DevOps Module"

config_source: "{project-root}/bmad/bmi/config.yaml"
output_folder: "{config_source}:output_folder"

installed_path: "{project-root}/bmad/bmi/workflows/5-deployment/my-workflow"
template: false
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
checklist: "{installed_path}/checklist.md"

mode: interactive

required_inputs:
  - input_name: "Input description"

optional_inputs:
  - optional_input: "Optional input description (default: value)"

output_artifacts:
  - output_name: "Output description"

halt_conditions:
  - "Condition that stops workflow"

standalone: true
```

### 5. Write instructions.md

Follow the BMAD XML workflow format:

```xml
<workflow>
  <context>
    Brief context about what this workflow does
  </context>

  <step n="1" goal="Initialize and gather inputs">
    <action>Greet user</action>
    <action>Explain workflow purpose</action>
    <action>Gather required inputs</action>
  </step>

  <step n="2" goal="Execute main logic">
    <action>Perform the main workflow tasks</action>
  </step>

  <step n="N" goal="Finalize and output results">
    <action>Generate output artifacts</action>
    <action>Update status tracking</action>
    <action>Display results to user</action>
  </step>
</workflow>
```

### 6. Create checklist.md

```markdown
# My Workflow Checklist

## Pre-Execution
- [ ] Required inputs collected
- [ ] Prerequisites verified

## Execution
- [ ] Step 1 completed
- [ ] Step 2 completed

## Post-Execution
- [ ] Outputs generated
- [ ] Status updated
- [ ] User notified
```

### 7. Test Your Workflow

```bash
bmad-cli invoke bmi/my-workflow \
  --input-name "value"
```

### 8. Document Your Workflow

Add section to `workflows/README.md`:

```markdown
### my-workflow

**Purpose:** Brief description
**Agent:** Diana/Rita/Phoenix
**Duration:** Estimated time

**Capabilities:**
- Feature 1
- Feature 2

**Inputs:**
- `input_name` - Description

**Outputs:**
- `output_name` - Description

**Usage:**
\```bash
bmad-cli invoke bmi/my-workflow --input-name value
\```

**See:** [5-deployment/my-workflow/](5-deployment/my-workflow/)
```

---

## Adding New Tasks

Tasks are reusable components used across workflows:

### 1. Create Task File

```bash
touch bmad/bmi/tasks/my-task.md
```

### 2. Document Task

```markdown
# Task: My Task

**Purpose:** What this task does

**Used By:**
- workflow-1
- workflow-2

## Inputs
- input1 - Description
- input2 - Description

## Outputs
- output1 - Description

## Execution Logic

\```bash
# Pseudo-code or actual implementation
function my_task() {
  local input1=$1
  local input2=$2

  # Task logic here

  echo "output1_value"
}
\```

## Example Usage

\```bash
result=$(my_task "value1" "value2")
\```

## Error Handling

- Error scenario 1 → Solution
- Error scenario 2 → Solution
```

### 3. Update tasks/README.md

Add task to the list and provide usage examples.

---

## Documentation

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide real-world use cases
- Keep documentation up-to-date with code changes

### Documentation Files

- `README.md` - Main module documentation
- `CHANGELOG.md` - Version history
- `workflows/README.md` - Workflow documentation
- `tasks/README.md` - Task documentation
- `deployment-platforms/README.md` - Platform documentation
- Code comments in implementation files

---

## Code Style Guidelines

### Bash Scripts

```bash
#!/bin/bash

# Use strict mode
set -euo pipefail

# Clear function names
function deploy_to_platform() {
  local version=$1
  local environment=$2

  # Implementation
}

# Descriptive variable names
DEPLOYMENT_URL="https://example.com"

# Comments for complex logic
# This section handles blue-green deployment by...
```

### YAML Files

```yaml
# Use 2-space indentation
workflow:
  name: "my-workflow"
  description: "Clear description"

  # Group related fields
  inputs:
    input1: "Description"
    input2: "Description"
```

### Markdown Documentation

```markdown
# Use proper heading hierarchy

## Second level

### Third level

**Bold for emphasis**

`code` for technical terms

\```bash
# Code blocks with language
command --flag value
\```
```

---

## Testing Requirements

### Before Submitting

- [ ] All new code tested manually
- [ ] Documentation updated
- [ ] Examples provided
- [ ] No broken links in documentation
- [ ] Bash scripts pass shellcheck (if applicable)

### Platform Implementations

Test all 5 required functions:
- `detect()` - Returns correct platform and confidence
- `check_prerequisites()` - Verifies requirements
- `deploy()` - Successfully deploys
- `rollback()` - Successfully rolls back
- `get_deployment_url()` - Returns correct URL

### Workflows

Test workflow:
- All inputs collected properly
- All steps execute successfully
- Outputs generated correctly
- Error handling works
- Checklist items are valid

---

## Pull Request Process

### 1. Before Creating PR

- Test your changes thoroughly
- Update documentation
- Follow code style guidelines
- Write clear commit messages

### 2. PR Title Format

```
[Type] Brief description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance
```

Examples:
- `feat: Add Cloudflare Pages platform support`
- `fix: Correct Kubernetes rollback logic`
- `docs: Update workflow README with new examples`

### 3. PR Description

Include:
- **What**: What changes were made
- **Why**: Why the changes were needed
- **How**: How to test the changes
- **Screenshots/Logs**: If applicable

### 4. Review Process

- Maintainers will review within 3-5 business days
- Address feedback promptly
- Keep PR focused and manageable
- Squash commits before merging (if requested)

### 5. After Merge

- Delete your feature branch
- Update your fork
- Celebrate! 🎉

---

## Questions?

- Check existing documentation in `bmad/bmi/`
- Search closed issues for similar questions
- Create a new issue with the "question" label
- Join community discussions

---

## License

By contributing to BMI, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to BMI!** 🚀

Your efforts help make deployment and release management better for everyone.
