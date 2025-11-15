#!/bin/bash

# Netlify Deployment Implementation
# Platform: Netlify (netlify.com)
# Best for: JAMstack, static sites, serverless functions

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -f "netlify.toml" ]; then
    confidence="high"
    config_file="netlify.toml"
  elif [ -f ".netlify/state.json" ]; then
    confidence="high"
    config_file=".netlify/state.json"
  elif [ -f "netlify.json" ]; then
    confidence="medium"
    config_file="netlify.json"
  fi

  echo "platform=netlify"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if Netlify CLI is installed
  if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not installed"
    echo "Install: npm install -g netlify-cli"
    return 1
  fi

  # Check if authenticated
  if [ -z "${NETLIFY_AUTH_TOKEN}" ]; then
    # Check if logged in via CLI
    if ! netlify status &> /dev/null; then
      echo "❌ Not authenticated with Netlify"
      echo "Set NETLIFY_AUTH_TOKEN or run: netlify login"
      return 1
    fi
  fi

  echo "✅ Netlify CLI installed and authenticated"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Netlify..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Determine Netlify deployment flags
  local deploy_flags=""
  case "${environment}" in
    production)
      deploy_flags="--prod"
      ;;
    staging|preview)
      deploy_flags=""  # Default is preview/branch deploy
      ;;
    dev|development)
      deploy_flags="--alias dev"
      ;;
    *)
      deploy_flags="--alias ${environment}"
      ;;
  esac

  # Add auth token if available
  if [ -n "${NETLIFY_AUTH_TOKEN}" ]; then
    deploy_flags="${deploy_flags} --auth ${NETLIFY_AUTH_TOKEN}"
  fi

  # Build the site if build command exists
  if [ -f "netlify.toml" ] && grep -q "\[build\]" netlify.toml; then
    echo "Building site..."
    netlify build ${deploy_flags}
  fi

  # Deploy command
  local deploy_cmd="netlify deploy ${deploy_flags}"

  # Dry run
  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: ${deploy_cmd}"
    return 0
  fi

  # Execute deployment
  echo "Executing: ${deploy_cmd}"
  local deploy_output
  deploy_output=$(${deploy_cmd} 2>&1 | tee /dev/tty)

  if [ $? -eq 0 ]; then
    echo "✅ Deployment successful"

    # Extract deployment URL
    local deployment_url
    deployment_url=$(echo "${deploy_output}" | grep -oE 'https://[a-zA-Z0-9.-]+\.netlify\.app' | tail -1)

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

  echo "🔄 Rolling back Netlify deployment..."

  # Get site ID
  local site_id
  site_id=$(netlify status --json 2>/dev/null | jq -r '.siteId' 2>/dev/null)

  if [ -z "${site_id}" ] || [ "${site_id}" = "null" ]; then
    echo "❌ Unable to determine site ID"
    return 1
  fi

  if [ "${target_version}" = "previous" ]; then
    echo "Finding previous deployment..."

    # Get deployment list
    local deploys
    deploys=$(netlify api listSiteDeploys --data "{\"site_id\": \"${site_id}\"}" 2>/dev/null)

    # Get second deploy (previous)
    local previous_deploy_id
    previous_deploy_id=$(echo "${deploys}" | jq -r '.[1].id' 2>/dev/null)

    if [ -z "${previous_deploy_id}" ] || [ "${previous_deploy_id}" = "null" ]; then
      echo "❌ No previous deployment found"
      return 1
    fi

    target_version="${previous_deploy_id}"
  fi

  echo "Rolling back to deployment: ${target_version}"

  # Restore deploy
  netlify api restoreSiteDeploy --data "{\"deploy_id\": \"${target_version}\"}"

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

  if [ "${environment}" = "production" ]; then
    # Get production URL
    netlify status --json 2>/dev/null | jq -r '.site_url' 2>/dev/null
  else
    # Get latest deploy URL
    netlify status --json 2>/dev/null | jq -r '.site_url' 2>/dev/null
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
