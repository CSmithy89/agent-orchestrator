#!/bin/bash

# DigitalOcean App Platform Deployment Implementation
# Platform: DigitalOcean App Platform (digitalocean.com)
# Best for: Apps, static sites, databases, managed containers

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -f ".do/app.yaml" ]; then
    confidence="high"
    config_file=".do/app.yaml"
  elif [ -f "app.yaml" ] && grep -q "digitalocean" app.yaml; then
    confidence="medium"
    config_file="app.yaml"
  elif [ -f ".do/deploy.template.yaml" ]; then
    confidence="high"
    config_file=".do/deploy.template.yaml"
  fi

  echo "platform=digitalocean"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if doctl is installed
  if ! command -v doctl &> /dev/null; then
    echo "❌ DigitalOcean CLI (doctl) not installed"
    echo "Install: brew install doctl"
    echo "Or: snap install doctl"
    echo "Or download from: https://github.com/digitalocean/doctl/releases"
    return 1
  fi

  # Check if authenticated
  if [ -z "${DIGITALOCEAN_ACCESS_TOKEN}" ]; then
    # Try to check if already authenticated
    if ! doctl account get &> /dev/null; then
      echo "❌ Not authenticated with DigitalOcean"
      echo "Set DIGITALOCEAN_ACCESS_TOKEN or run: doctl auth init"
      return 1
    fi
  else
    # Authenticate with token
    doctl auth init --access-token "${DIGITALOCEAN_ACCESS_TOKEN}" &> /dev/null
  fi

  echo "✅ DigitalOcean CLI installed and authenticated"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to DigitalOcean App Platform..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Check if app spec exists
  local app_spec=".do/app.yaml"
  if [ ! -f "${app_spec}" ]; then
    echo "❌ App spec not found at ${app_spec}"
    echo "Create one with: doctl apps create --spec ${app_spec}"
    return 1
  fi

  # Check if app already exists
  local app_id
  app_id=$(doctl apps list --format ID,Spec.Name --no-header 2>/dev/null | head -1 | awk '{print $1}')

  if [ -z "${app_id}" ]; then
    echo "Creating new app..."

    if [ "${dry_run}" = "true" ]; then
      echo "Dry run: Would create app from ${app_spec}"
      return 0
    fi

    # Create new app
    app_id=$(doctl apps create --spec "${app_spec}" --format ID --no-header)

    if [ $? -ne 0 ] || [ -z "${app_id}" ]; then
      echo "❌ Failed to create app"
      return 1
    fi

    echo "App created: ${app_id}"
  else
    echo "Updating existing app: ${app_id}"

    if [ "${dry_run}" = "true" ]; then
      echo "Dry run: Would update app ${app_id} from ${app_spec}"
      return 0
    fi

    # Update existing app
    doctl apps update "${app_id}" --spec "${app_spec}"

    if [ $? -ne 0 ]; then
      echo "❌ Failed to update app"
      return 1
    fi
  fi

  # Trigger deployment
  echo "Triggering deployment..."
  local deployment_id
  deployment_id=$(doctl apps create-deployment "${app_id}" --force-rebuild --format ID --no-header)

  if [ $? -ne 0 ] || [ -z "${deployment_id}" ]; then
    echo "❌ Failed to trigger deployment"
    return 1
  fi

  echo "Deployment triggered: ${deployment_id}"

  # Wait for deployment to complete
  echo "Waiting for deployment to complete..."
  local status="PENDING"
  local max_wait=900  # 15 minutes
  local waited=0

  while [ "${status}" != "ACTIVE" ] && [ ${waited} -lt ${max_wait} ]; do
    sleep 15
    waited=$((waited + 15))

    status=$(doctl apps get-deployment "${app_id}" "${deployment_id}" --format Phase --no-header 2>/dev/null)

    echo "Status: ${status} (${waited}s elapsed)"

    if [ "${status}" = "ERROR" ] || [ "${status}" = "CANCELED" ]; then
      echo "❌ Deployment failed with status: ${status}"

      # Get deployment logs
      echo "Fetching deployment logs..."
      doctl apps logs "${app_id}" --deployment "${deployment_id}" --type BUILD

      return 1
    fi
  done

  if [ "${status}" = "ACTIVE" ]; then
    echo "✅ Deployment successful"

    # Get app URL
    local app_url
    app_url=$(doctl apps get "${app_id}" --format LiveURL --no-header)

    if [ -n "${app_url}" ]; then
      echo "URL: ${app_url}"
      echo "deployment_url=${app_url}"
    fi

    return 0
  else
    echo "⚠️  Deployment timeout after ${waited}s"
    return 1
  fi
}

# Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  echo "🔄 Rolling back DigitalOcean deployment..."

  # Get app ID
  local app_id
  app_id=$(doctl apps list --format ID --no-header 2>/dev/null | head -1)

  if [ -z "${app_id}" ]; then
    echo "❌ No app found"
    return 1
  fi

  if [ "${target_version}" = "previous" ]; then
    # Get second-most recent deployment
    local previous_deployment_id
    previous_deployment_id=$(doctl apps list-deployments "${app_id}" --format ID --no-header 2>/dev/null | sed -n '2p')

    if [ -z "${previous_deployment_id}" ]; then
      echo "❌ No previous deployment found"
      return 1
    fi

    target_version="${previous_deployment_id}"
  fi

  echo "Rolling back to deployment: ${target_version}"

  # DigitalOcean doesn't have direct rollback
  # We need to get the spec from previous deployment and redeploy

  echo "⚠️  DigitalOcean App Platform doesn't support direct rollback"
  echo "Options:"
  echo "1. Revert git commit and push to trigger automatic redeploy"
  echo "2. Manually rollback in DigitalOcean dashboard"
  echo "3. Get previous app spec and update: doctl apps update ${app_id} --spec <previous-spec.yaml>"

  return 1
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  # Get app ID
  local app_id
  app_id=$(doctl apps list --format ID --no-header 2>/dev/null | head -1)

  if [ -z "${app_id}" ]; then
    return 1
  fi

  # Get app URL
  doctl apps get "${app_id}" --format LiveURL --no-header
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
