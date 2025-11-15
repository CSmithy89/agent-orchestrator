#!/bin/bash

# Railway Deployment Implementation
# Platform: Railway (railway.app)
# Best for: Full-stack apps, databases, containers, monorepos

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -f "railway.json" ]; then
    confidence="high"
    config_file="railway.json"
  elif [ -f "railway.toml" ]; then
    confidence="high"
    config_file="railway.toml"
  elif [ -d ".railway" ]; then
    confidence="high"
    config_file=".railway/"
  fi

  echo "platform=railway"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if Railway CLI is installed
  if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed"
    echo "Install: npm install -g @railway/cli"
    echo "Or: brew install railway"
    return 1
  fi

  # Check if authenticated
  if [ -z "${RAILWAY_TOKEN}" ]; then
    # Try to check if logged in
    if ! railway whoami &> /dev/null; then
      echo "❌ Not authenticated with Railway"
      echo "Set RAILWAY_TOKEN or run: railway login"
      return 1
    fi
  fi

  echo "✅ Railway CLI installed and authenticated"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Railway..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Set Railway environment
  local railway_env=""
  case "${environment}" in
    production)
      railway_env="--environment production"
      ;;
    staging)
      railway_env="--environment staging"
      ;;
    dev)
      railway_env="--environment development"
      ;;
    *)
      railway_env="--environment ${environment}"
      ;;
  esac

  # Link project if not already linked
  if [ ! -f ".railway/project.json" ]; then
    echo "Project not linked. Linking..."
    railway link
  fi

  # Build deployment command
  local deploy_cmd="railway up ${railway_env} --detach"

  # Add token if available
  if [ -n "${RAILWAY_TOKEN}" ]; then
    export RAILWAY_TOKEN
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

    # Get deployment URL
    local deployment_url
    deployment_url=$(railway domain ${railway_env} 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.up\.railway\.app' | head -1)

    if [ -n "${deployment_url}" ]; then
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

  echo "🔄 Rolling back Railway deployment..."

  # Railway doesn't have native rollback
  # We need to redeploy a previous version

  if [ "${target_version}" = "previous" ]; then
    echo "❌ Railway doesn't support automatic rollback to 'previous'"
    echo "Please specify a git commit SHA or tag to redeploy"
    return 1
  fi

  # Checkout the target version
  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD)

  echo "Checking out ${target_version}..."
  git checkout "${target_version}"

  # Deploy
  local railway_env="--environment ${environment}"
  railway up ${railway_env} --detach

  local result=$?

  # Return to current branch
  git checkout "${current_branch}"

  if [ ${result} -eq 0 ]; then
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
  local railway_env="--environment ${environment}"

  railway domain ${railway_env} 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.up\.railway\.app' | head -1
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
