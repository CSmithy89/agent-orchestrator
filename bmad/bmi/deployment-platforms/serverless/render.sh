#!/bin/bash

# Render Deployment Implementation
# Platform: Render (render.com)
# Best for: Web services, static sites, databases, cron jobs

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -f "render.yaml" ]; then
    confidence="high"
    config_file="render.yaml"
  elif [ -f ".render/render.yaml" ]; then
    confidence="high"
    config_file=".render/render.yaml"
  fi

  echo "platform=render"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if API key is set (Render doesn't have official CLI, uses API)
  if [ -z "${RENDER_API_KEY}" ]; then
    echo "❌ RENDER_API_KEY not set"
    echo "Get your API key from: https://dashboard.render.com/account/api-keys"
    return 1
  fi

  # Check if curl/jq are available (for API calls)
  if ! command -v curl &> /dev/null; then
    echo "❌ curl not installed"
    return 1
  fi

  if ! command -v jq &> /dev/null; then
    echo "❌ jq not installed (required for JSON parsing)"
    return 1
  fi

  echo "✅ Render API key configured"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Render..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Render deploys are triggered via Git push or API
  # We'll use the API to trigger a manual deploy

  # Get service ID from render.yaml
  local service_id
  service_id=$(yq eval '.services[0].name' render.yaml 2>/dev/null)

  if [ -z "${service_id}" ]; then
    echo "❌ Could not find service name in render.yaml"
    return 1
  fi

  # Trigger deployment via API
  local api_url="https://api.render.com/v1/services/${service_id}/deploys"

  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: Would call ${api_url}"
    return 0
  fi

  echo "Triggering deployment for service: ${service_id}"

  # Create deploy request
  local deploy_response
  deploy_response=$(curl -s -X POST "${api_url}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"clearCache\": \"clear\"}")

  # Parse response
  local deploy_id
  deploy_id=$(echo "${deploy_response}" | jq -r '.id' 2>/dev/null)

  if [ -z "${deploy_id}" ] || [ "${deploy_id}" = "null" ]; then
    echo "❌ Deployment trigger failed"
    echo "Response: ${deploy_response}"
    return 1
  fi

  echo "Deployment triggered: ${deploy_id}"

  # Wait for deployment to complete
  echo "Waiting for deployment to complete..."
  local status="building"
  local max_wait=600  # 10 minutes
  local waited=0

  while [ "${status}" != "live" ] && [ ${waited} -lt ${max_wait} ]; do
    sleep 10
    waited=$((waited + 10))

    local deploy_status
    deploy_status=$(curl -s -X GET "https://api.render.com/v1/services/${service_id}/deploys/${deploy_id}" \
      -H "Authorization: Bearer ${RENDER_API_KEY}")

    status=$(echo "${deploy_status}" | jq -r '.status' 2>/dev/null)

    echo "Status: ${status} (${waited}s elapsed)"

    if [ "${status}" = "failed" ]; then
      echo "❌ Deployment failed"
      return 1
    fi
  done

  if [ "${status}" = "live" ]; then
    echo "✅ Deployment successful"

    # Get service URL
    local service_url
    service_url=$(curl -s -X GET "https://api.render.com/v1/services/${service_id}" \
      -H "Authorization: Bearer ${RENDER_API_KEY}" | jq -r '.serviceDetails.url' 2>/dev/null)

    if [ -n "${service_url}" ]; then
      echo "URL: ${service_url}"
      echo "deployment_url=${service_url}"
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

  echo "🔄 Rolling back Render deployment..."

  # Get service ID
  local service_id
  service_id=$(yq eval '.services[0].name' render.yaml 2>/dev/null)

  if [ -z "${service_id}" ]; then
    echo "❌ Could not find service name in render.yaml"
    return 1
  fi

  # Get deploy history
  local deploys
  deploys=$(curl -s -X GET "https://api.render.com/v1/services/${service_id}/deploys" \
    -H "Authorization: Bearer ${RENDER_API_KEY}")

  if [ "${target_version}" = "previous" ]; then
    # Find the last successful deploy (that's not the current one)
    local previous_deploy_id
    previous_deploy_id=$(echo "${deploys}" | jq -r '.[] | select(.status == "live") | .id' 2>/dev/null | sed -n '2p')

    if [ -z "${previous_deploy_id}" ]; then
      echo "❌ No previous deployment found"
      return 1
    fi

    target_version="${previous_deploy_id}"
  fi

  echo "Rolling back to deploy: ${target_version}"

  # Render doesn't have native rollback via API
  # We need to redeploy the previous commit
  echo "⚠️  Render doesn't support direct rollback via API"
  echo "Please use git to revert to the previous version and push to trigger redeploy"
  echo "Or manually rollback in the Render dashboard"

  return 1
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  # Get service ID
  local service_id
  service_id=$(yq eval '.services[0].name' render.yaml 2>/dev/null)

  if [ -z "${service_id}" ]; then
    return 1
  fi

  # Get service details
  curl -s -X GET "https://api.render.com/v1/services/${service_id}" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" | jq -r '.serviceDetails.url' 2>/dev/null
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
