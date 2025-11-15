#!/bin/bash

# BMI Module Comprehensive Audit Script
# Checks for completeness, consistency, and broken references

set -e

BMI_DIR="/home/user/agent-orchestrator/bmad/bmi"
ISSUES=()
WARNINGS=()

echo "================================"
echo "BMI MODULE COMPREHENSIVE AUDIT"
echo "================================"
echo ""

# Helper functions
add_issue() {
    ISSUES+=("❌ ISSUE: $1")
}

add_warning() {
    WARNINGS+=("⚠️  WARNING: $1")
}

check_file_exists() {
    local file=$1
    local description=$2
    if [ ! -f "$file" ]; then
        add_issue "Missing file: $file ($description)"
        return 1
    fi
    return 0
}

check_dir_exists() {
    local dir=$1
    local description=$2
    if [ ! -d "$dir" ]; then
        add_issue "Missing directory: $dir ($description)"
        return 1
    fi
    return 0
}

# 1. CHECK MODULE STRUCTURE
echo "1. Checking Module Structure..."
echo "--------------------------------"

check_dir_exists "$BMI_DIR" "BMI root directory"
check_dir_exists "$BMI_DIR/agents" "Agents directory"
check_dir_exists "$BMI_DIR/workflows" "Workflows directory"
check_dir_exists "$BMI_DIR/tasks" "Tasks directory"
check_dir_exists "$BMI_DIR/templates" "Templates directory"
check_dir_exists "$BMI_DIR/data" "Data directory"
check_dir_exists "$BMI_DIR/deployment-platforms" "Deployment platforms directory"
check_dir_exists "$BMI_DIR/examples" "Examples directory"
check_dir_exists "$BMI_DIR/integration" "Integration directory"
check_dir_exists "$BMI_DIR/docs" "Docs directory"

echo "✅ Module structure checked"
echo ""

# 2. CHECK CORE CONFIGURATION
echo "2. Checking Core Configuration..."
echo "--------------------------------"

check_file_exists "$BMI_DIR/config.yaml" "Module configuration"
check_file_exists "$BMI_DIR/README.md" "Main README"
check_file_exists "$BMI_DIR/CHANGELOG.md" "Changelog"

# Validate config.yaml
if [ -f "$BMI_DIR/config.yaml" ]; then
    if ! grep -q "module_code: bmi" "$BMI_DIR/config.yaml"; then
        add_issue "config.yaml missing 'module_code: bmi'"
    fi
    if ! grep -q "module_version:" "$BMI_DIR/config.yaml"; then
        add_issue "config.yaml missing 'module_version'"
    fi
fi

echo "✅ Core configuration checked"
echo ""

# 3. CHECK AGENTS
echo "3. Checking Agents..."
echo "--------------------------------"

EXPECTED_AGENTS=("diana" "rita" "phoenix")
for agent in "${EXPECTED_AGENTS[@]}"; do
    if ! check_file_exists "$BMI_DIR/agents/$agent.md" "Agent: $agent"; then
        continue
    fi

    # Check agent has required sections
    if ! grep -q "# Agent:" "$BMI_DIR/agents/$agent.md"; then
        add_warning "Agent $agent.md missing '# Agent:' header"
    fi
done

check_file_exists "$BMI_DIR/agents/README.md" "Agents README"

echo "✅ Agents checked (${#EXPECTED_AGENTS[@]} agents)"
echo ""

# 4. CHECK WORKFLOWS
echo "4. Checking Workflows..."
echo "--------------------------------"

WORKFLOW_COUNT=0
DEPLOYMENT_WORKFLOWS=($(ls -1 "$BMI_DIR/workflows/5-deployment/" 2>/dev/null || echo ""))
RELEASE_WORKFLOWS=($(ls -1 "$BMI_DIR/workflows/6-release/" 2>/dev/null || echo ""))

# Check deployment workflows
for workflow in "${DEPLOYMENT_WORKFLOWS[@]}"; do
    if [ -z "$workflow" ]; then continue; fi

    WORKFLOW_DIR="$BMI_DIR/workflows/5-deployment/$workflow"

    check_file_exists "$WORKFLOW_DIR/workflow.yaml" "Deployment workflow: $workflow/workflow.yaml"
    check_file_exists "$WORKFLOW_DIR/instructions.md" "Deployment workflow: $workflow/instructions.md"
    check_file_exists "$WORKFLOW_DIR/checklist.md" "Deployment workflow: $workflow/checklist.md"

    # Validate workflow.yaml structure
    if [ -f "$WORKFLOW_DIR/workflow.yaml" ]; then
        if ! grep -q "workflow_name:" "$WORKFLOW_DIR/workflow.yaml"; then
            add_issue "Workflow $workflow/workflow.yaml missing 'workflow_name'"
        fi
        if ! grep -q "inputs:" "$WORKFLOW_DIR/workflow.yaml"; then
            add_warning "Workflow $workflow/workflow.yaml missing 'inputs' section"
        fi
        if ! grep -q "outputs:" "$WORKFLOW_DIR/workflow.yaml"; then
            add_warning "Workflow $workflow/workflow.yaml missing 'outputs' section"
        fi
    fi

    ((WORKFLOW_COUNT++))
done

# Check release workflows
for workflow in "${RELEASE_WORKFLOWS[@]}"; do
    if [ -z "$workflow" ]; then continue; fi

    WORKFLOW_DIR="$BMI_DIR/workflows/6-release/$workflow"

    check_file_exists "$WORKFLOW_DIR/workflow.yaml" "Release workflow: $workflow/workflow.yaml"
    check_file_exists "$WORKFLOW_DIR/instructions.md" "Release workflow: $workflow/instructions.md"
    check_file_exists "$WORKFLOW_DIR/checklist.md" "Release workflow: $workflow/checklist.md"

    # Validate workflow.yaml structure
    if [ -f "$WORKFLOW_DIR/workflow.yaml" ]; then
        if ! grep -q "workflow_name:" "$WORKFLOW_DIR/workflow.yaml"; then
            add_issue "Workflow $workflow/workflow.yaml missing 'workflow_name'"
        fi
    fi

    ((WORKFLOW_COUNT++))
done

check_file_exists "$BMI_DIR/workflows/README.md" "Workflows README"

echo "✅ Workflows checked ($WORKFLOW_COUNT workflows total)"
echo ""

# 5. CHECK TASKS
echo "5. Checking Tasks..."
echo "--------------------------------"

EXPECTED_TASKS=(
    "detect-platform"
    "calculate-version"
    "run-smoke-tests"
    "update-deployment-status"
    "update-release-status"
    "generate-release-notes"
    "publish-to-registry"
)

TASK_COUNT=0
for task in "${EXPECTED_TASKS[@]}"; do
    if check_file_exists "$BMI_DIR/tasks/$task.md" "Task: $task"; then
        ((TASK_COUNT++))
    fi
done

check_file_exists "$BMI_DIR/tasks/README.md" "Tasks README"

echo "✅ Tasks checked ($TASK_COUNT/${#EXPECTED_TASKS[@]} tasks found)"
echo ""

# 6. CHECK TEMPLATES
echo "6. Checking Templates..."
echo "--------------------------------"

EXPECTED_TEMPLATES=(
    "basic-deploy-template"
    "ci-cd-integration-template"
    "epic-release-template"
    "monitoring-template"
)

TEMPLATE_COUNT=0
for template in "${EXPECTED_TEMPLATES[@]}"; do
    if check_file_exists "$BMI_DIR/templates/$template.md" "Template: $template"; then
        ((TEMPLATE_COUNT++))
    fi
done

check_file_exists "$BMI_DIR/templates/README.md" "Templates README"

echo "✅ Templates checked ($TEMPLATE_COUNT/${#EXPECTED_TEMPLATES[@]} templates found)"
echo ""

# 7. CHECK PLATFORM IMPLEMENTATIONS
echo "7. Checking Platform Implementations..."
echo "--------------------------------"

PLATFORMS=(
    "serverless/vercel.sh"
    "serverless/railway.sh"
    "serverless/render.sh"
    "serverless/netlify.sh"
    "serverless/flyio.sh"
    "cloud/digitalocean.sh"
    "cloud/aws.sh"
    "containers/kubernetes.sh"
    "mobile/fastlane-ios.sh"
    "mobile/fastlane-android.sh"
)

PLATFORM_COUNT=0
for platform in "${PLATFORMS[@]}"; do
    PLATFORM_FILE="$BMI_DIR/deployment-platforms/$platform"
    if check_file_exists "$PLATFORM_FILE" "Platform: $platform"; then
        # Check platform script has required functions
        if ! grep -q "^detect()" "$PLATFORM_FILE"; then
            add_warning "Platform $platform missing detect() function"
        fi
        if ! grep -q "^check_prerequisites()" "$PLATFORM_FILE"; then
            add_warning "Platform $platform missing check_prerequisites() function"
        fi
        if ! grep -q "^deploy()" "$PLATFORM_FILE"; then
            add_warning "Platform $platform missing deploy() function"
        fi

        ((PLATFORM_COUNT++))
    fi
done

check_file_exists "$BMI_DIR/deployment-platforms/README.md" "Platform implementations README"

echo "✅ Platform implementations checked ($PLATFORM_COUNT/${#PLATFORMS[@]} platforms found)"
echo ""

# 8. CHECK RUNBOOKS
echo "8. Checking Runbooks..."
echo "--------------------------------"

RUNBOOKS=(
    "high_error_rate.md"
    "service_down.md"
    "high_latency.md"
    "database_issues.md"
    "deployment_failed.md"
)

RUNBOOK_COUNT=0
for runbook in "${RUNBOOKS[@]}"; do
    if check_file_exists "$BMI_DIR/data/runbooks/$runbook" "Runbook: $runbook"; then
        ((RUNBOOK_COUNT++))
    fi
done

echo "✅ Runbooks checked ($RUNBOOK_COUNT/${#RUNBOOKS[@]} runbooks found)"
echo ""

# 9. CHECK EXAMPLES
echo "9. Checking Examples..."
echo "--------------------------------"

check_dir_exists "$BMI_DIR/examples/full-stack" "Full-stack examples"
check_dir_exists "$BMI_DIR/examples/mobile" "Mobile examples"
check_dir_exists "$BMI_DIR/examples/configs" "Config examples"

check_file_exists "$BMI_DIR/examples/full-stack/railway-nextjs-postgres.md" "Full-stack example"
check_file_exists "$BMI_DIR/examples/mobile/react-native-app-deployment.md" "Mobile example"
check_file_exists "$BMI_DIR/examples/configs/README.md" "Config examples README"

echo "✅ Examples checked"
echo ""

# 10. CHECK INTEGRATION
echo "10. Checking Integration Files..."
echo "--------------------------------"

check_file_exists "$BMI_DIR/integration/bmi-integration.yaml" "Integration configuration"
check_dir_exists "$BMI_DIR/integration/hooks" "Integration hooks"
check_dir_exists "$BMI_DIR/integration/status" "Status tracking"

INTEGRATION_HOOKS=(
    "post-story-deploy.md"
    "post-epic-deploy.md"
    "incident-response.md"
    "production-release.md"
    "pre-release-gates.md"
)

for hook in "${INTEGRATION_HOOKS[@]}"; do
    check_file_exists "$BMI_DIR/integration/hooks/$hook" "Integration hook: $hook"
done

echo "✅ Integration files checked"
echo ""

# 11. CHECK DOCUMENTATION
echo "11. Checking Documentation..."
echo "--------------------------------"

DOC_FILES=(
    "README.md"
    "CHANGELOG.md"
    "DEPLOYMENT-TOOLS.md"
    "PLATFORM-SUPPORT.md"
    "agents/README.md"
    "workflows/README.md"
    "tasks/README.md"
    "templates/README.md"
    "examples/configs/README.md"
)

for doc in "${DOC_FILES[@]}"; do
    check_file_exists "$BMI_DIR/$doc" "Documentation: $doc"
done

echo "✅ Documentation checked"
echo ""

# 12. CHECK FOR BROKEN REFERENCES
echo "12. Checking for Broken References..."
echo "--------------------------------"

# Check if documented workflows exist
if grep -q "smoke-testing" "$BMI_DIR/workflows/README.md" 2>/dev/null; then
    if [ ! -d "$BMI_DIR/workflows/5-deployment/smoke-testing" ]; then
        add_issue "README documents 'smoke-testing' workflow but it doesn't exist"
    fi
fi

if grep -q "version-bump" "$BMI_DIR/workflows/README.md" 2>/dev/null; then
    if [ ! -d "$BMI_DIR/workflows/6-release/version-bump" ]; then
        add_issue "README documents 'version-bump' workflow but it doesn't exist"
    fi
fi

# Check if undocumented workflows exist
if [ -d "$BMI_DIR/workflows/5-deployment/database-migration" ]; then
    if ! grep -q "database-migration" "$BMI_DIR/workflows/README.md" 2>/dev/null; then
        add_warning "Workflow 'database-migration' exists but not documented in README"
    fi
fi

if [ -d "$BMI_DIR/workflows/5-deployment/infrastructure-provision" ]; then
    if ! grep -q "infrastructure-provision" "$BMI_DIR/workflows/README.md" 2>/dev/null; then
        add_warning "Workflow 'infrastructure-provision' exists but not documented in README"
    fi
fi

echo "✅ References checked"
echo ""

# FINAL REPORT
echo "================================"
echo "AUDIT RESULTS"
echo "================================"
echo ""

if [ ${#ISSUES[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
    echo "✅ ✅ ✅ ALL CHECKS PASSED! ✅ ✅ ✅"
    echo ""
    echo "The BMI module is complete and consistent."
else
    if [ ${#ISSUES[@]} -gt 0 ]; then
        echo "CRITICAL ISSUES FOUND (${#ISSUES[@]}):"
        echo "================================"
        for issue in "${ISSUES[@]}"; do
            echo "$issue"
        done
        echo ""
    fi

    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo "WARNINGS (${#WARNINGS[@]}):"
        echo "================================"
        for warning in "${WARNINGS[@]}"; do
            echo "$warning"
        done
        echo ""
    fi
fi

echo "Summary:"
echo "--------"
echo "Agents: ${#EXPECTED_AGENTS[@]}"
echo "Workflows: $WORKFLOW_COUNT"
echo "Tasks: $TASK_COUNT/${#EXPECTED_TASKS[@]}"
echo "Templates: $TEMPLATE_COUNT/${#EXPECTED_TEMPLATES[@]}"
echo "Platforms: $PLATFORM_COUNT/${#PLATFORMS[@]}"
echo "Runbooks: $RUNBOOK_COUNT/${#RUNBOOKS[@]}"
echo ""
echo "Issues: ${#ISSUES[@]}"
echo "Warnings: ${#WARNINGS[@]}"
echo ""

# Exit with error if issues found
if [ ${#ISSUES[@]} -gt 0 ]; then
    exit 1
fi

exit 0
