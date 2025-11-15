#!/bin/bash

# Vercel Deployment Implementation
# Platform: Vercel (vercel.com)
# Best for: Next.js, React, Vue, static sites, serverless functions

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -f "vercel.json" ]; then
    confidence="high"
    config_file="vercel.json"
  elif [ -f ".vercel/project.json" ]; then
    confidence="high"
    config_file=".vercel/project.json"
  elif [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
    # Next.js project (likely Vercel)
    confidence="medium"
    config_file="next.config.js"
  fi

  echo "platform=vercel"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if Vercel CLI is installed
  if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not installed"
    echo "Install: npm install -g vercel"
    return 1
  fi

  # Check if authenticated
  if [ -z "${VERCEL_TOKEN}" ] && [ ! -f "${HOME}/.vercel/auth.json" ]; then
    echo "❌ Not authenticated with Vercel"
    echo "Set VERCEL_TOKEN or run: vercel login"
    return 1
  fi

  echo "✅ Vercel CLI installed and authenticated"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Vercel..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Set Vercel environment
  local vercel_env=""
  case "${environment}" in
    production)
      vercel_env="--prod"
      ;;
    staging)
      vercel_env="--target=preview"
      ;;
    dev)
      vercel_env="--target=development"
      ;;
    *)
      vercel_env="--target=preview"
      ;;
  esac

  # Build command
  local deploy_cmd="vercel ${vercel_env} --yes"

  # Add token if available
  if [ -n "${VERCEL_TOKEN}" ]; then
    deploy_cmd="${deploy_cmd} --token ${VERCEL_TOKEN}"
  fi

  # Dry run
  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: ${deploy_cmd}"
    return 0
  fi

  # Execute deployment
  echo "Executing: ${deploy_cmd}"
  local deployment_url
  deployment_url=$(${deploy_cmd} 2>&1 | tee /dev/tty | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1)

  if [ $? -eq 0 ] && [ -n "${deployment_url}" ]; then
    echo "✅ Deployment successful"
    echo "URL: ${deployment_url}"
    echo "deployment_url=${deployment_url}"
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

  echo "🔄 Rolling back Vercel deployment..."

  # Get list of deployments
  local deployments
  deployments=$(vercel ls --json 2>/dev/null)

  if [ "${target_version}" = "previous" ]; then
    echo "Finding previous deployment..."
    # Get second-most recent deployment
    local previous_url
    previous_url=$(echo "${deployments}" | jq -r '.[1].url' 2>/dev/null)

    if [ -z "${previous_url}" ] || [ "${previous_url}" = "null" ]; then
      echo "❌ No previous deployment found"
      return 1
    fi

    echo "Previous deployment: ${previous_url}"
    target_version="${previous_url}"
  fi

  # Promote deployment to production
  if [ "${environment}" = "production" ]; then
    echo "Promoting deployment: ${target_version}"
    vercel promote "${target_version}" --yes

    if [ $? -eq 0 ]; then
      echo "✅ Rollback successful"
      return 0
    else
      echo "❌ Rollback failed"
      return 1
    fi
  else
    echo "⚠️  Rollback for non-production environments not supported"
    echo "Deploy the previous version instead"
    return 1
  fi
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  if [ "${environment}" = "production" ]; then
    # Get production URL from vercel.json or project settings
    local project_name
    project_name=$(jq -r '.name // empty' vercel.json 2>/dev/null)

    if [ -n "${project_name}" ]; then
      echo "https://${project_name}.vercel.app"
    else
      # Try to get from Vercel API
      vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null
    fi
  else
    # Get latest preview deployment
    vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null
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
