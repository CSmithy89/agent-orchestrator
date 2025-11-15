#!/bin/bash

# Fly.io Deployment Implementation
# Platform: Fly.io (fly.io)
# Best for: Global edge deployment, full-stack apps, containers

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -f "fly.toml" ]; then
    confidence="high"
    config_file="fly.toml"
  elif [ -f ".fly/config.yml" ]; then
    confidence="high"
    config_file=".fly/config.yml"
  fi

  echo "platform=flyio"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if flyctl is installed
  if ! command -v flyctl &> /dev/null && ! command -v fly &> /dev/null; then
    echo "❌ Fly.io CLI (flyctl) not installed"
    echo "Install: curl -L https://fly.io/install.sh | sh"
    echo "Or: brew install flyctl"
    return 1
  fi

  # Use 'fly' or 'flyctl' (they're the same)
  local fly_cmd="flyctl"
  if command -v fly &> /dev/null; then
    fly_cmd="fly"
  fi

  # Check if authenticated
  if ! ${fly_cmd} auth whoami &> /dev/null; then
    echo "❌ Not authenticated with Fly.io"
    echo "Run: ${fly_cmd} auth login"
    return 1
  fi

  echo "✅ Fly.io CLI installed and authenticated"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Fly.io..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  local fly_cmd="fly"
  command -v flyctl &> /dev/null && fly_cmd="flyctl"

  # Check if app is initialized
  if [ ! -f "fly.toml" ]; then
    echo "❌ fly.toml not found"
    echo "Initialize with: ${fly_cmd} launch"
    return 1
  fi

  # Build deployment command based on strategy
  local deploy_cmd="${fly_cmd} deploy"

  # Add strategy-specific flags
  case "${strategy}" in
    blue-green)
      deploy_cmd="${deploy_cmd} --strategy=bluegreen"
      ;;
    canary)
      deploy_cmd="${deploy_cmd} --strategy=canary"
      ;;
    rolling)
      deploy_cmd="${deploy_cmd} --strategy=rolling"
      ;;
    immediate)
      deploy_cmd="${deploy_cmd} --strategy=immediate"
      ;;
    *)
      # Default to rolling
      deploy_cmd="${deploy_cmd} --strategy=rolling"
      ;;
  esac

  # Add image tag if version specified
  if [ -n "${version}" ] && [ "${version}" != "latest" ]; then
    deploy_cmd="${deploy_cmd} --image-label ${version}"
  fi

  # Dry run
  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: ${deploy_cmd}"
    return 0
  fi

  # Execute deployment
  echo "Executing: ${deploy_cmd}"
  ${deploy_cmd}

  if [ $? -eq 0 ]; then
    echo "✅ Deployment successful"

    # Get app name and URL
    local app_name
    app_name=$(grep -E "^app\s*=" fly.toml | sed -E 's/app\s*=\s*"(.+)"/\1/' | tr -d ' "')

    if [ -n "${app_name}" ]; then
      local deployment_url="https://${app_name}.fly.dev"
      echo "URL: ${deployment_url}"
      echo "deployment_url=${deployment_url}"
    fi

    return 0
  else
    echo "❌ Deployment failed"
    return 1
  fi
}

# Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  echo "🔄 Rolling back Fly.io deployment..."

  local fly_cmd="fly"
  command -v flyctl &> /dev/null && fly_cmd="flyctl"

  if [ "${target_version}" = "previous" ]; then
    echo "Finding previous release..."

    # Get release history
    local releases
    releases=$(${fly_cmd} releases --json 2>/dev/null)

    # Get second release (previous)
    local previous_version
    previous_version=$(echo "${releases}" | jq -r '.[1].version' 2>/dev/null)

    if [ -z "${previous_version}" ] || [ "${previous_version}" = "null" ]; then
      echo "❌ No previous release found"
      return 1
    fi

    target_version="${previous_version}"
  fi

  echo "Rolling back to version: ${target_version}"

  # Rollback to specific version
  ${fly_cmd} releases rollback "v${target_version}"

  if [ $? -eq 0 ]; then
    echo "✅ Rollback successful"
    return 0
  else
    echo "❌ Rollback failed"
    return 1
  fi
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  # Get app name from fly.toml
  local app_name
  app_name=$(grep -E "^app\s*=" fly.toml | sed -E 's/app\s*=\s*"(.+)"/\1/' | tr -d ' "')

  if [ -n "${app_name}" ]; then
    echo "https://${app_name}.fly.dev"
  fi
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
