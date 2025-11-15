#!/bin/bash

# Kubernetes Deployment Implementation
# Platform: Kubernetes (k8s.io)
# Best for: Containerized microservices, scalable applications
# Supports: EKS, GKE, AKS, self-hosted, k3s, minikube

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  if [ -d "k8s" ] && ls k8s/*.yaml &> /dev/null; then
    confidence="high"
    config_file="k8s/"
  elif [ -d "kubernetes" ] && ls kubernetes/*.yaml &> /dev/null; then
    confidence="high"
    config_file="kubernetes/"
  elif [ -f "deployment.yaml" ] || [ -f "deployment.yml" ]; then
    confidence="medium"
    config_file="deployment.yaml"
  elif [ -d ".kube" ]; then
    confidence="low"
    config_file=".kube/"
  fi

  echo "platform=kubernetes"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if kubectl is installed
  if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not installed"
    echo "Install: brew install kubectl"
    echo "Or: https://kubernetes.io/docs/tasks/tools/"
    return 1
  fi

  # Check if connected to a cluster
  if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Not connected to a Kubernetes cluster"
    echo "Configure kubectl with cluster credentials:"
    echo "  EKS: aws eks update-kubeconfig --name cluster-name"
    echo "  GKE: gcloud container clusters get-credentials cluster-name"
    echo "  AKS: az aks get-credentials --name cluster-name --resource-group rg-name"
    return 1
  fi

  # Check if Helm is available (optional but recommended)
  if command -v helm &> /dev/null; then
    echo "✅ kubectl and helm installed, connected to cluster"
  else
    echo "✅ kubectl installed, connected to cluster"
    echo "ℹ️  Helm not installed (optional): brew install helm"
  fi

  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to Kubernetes..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Determine manifest directory
  local manifest_dir="k8s"
  if [ -d "kubernetes" ]; then
    manifest_dir="kubernetes"
  elif [ ! -d "k8s" ] && [ -f "deployment.yaml" ]; then
    manifest_dir="."
  fi

  # Determine namespace
  local namespace="${environment}"
  if [ "${environment}" = "production" ]; then
    namespace="default"
  fi

  # Create namespace if it doesn't exist
  kubectl create namespace "${namespace}" --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null

  # Update image version in manifests (if using kustomize or helm)
  if [ -f "${manifest_dir}/kustomization.yaml" ]; then
    echo "Using Kustomize..."
    # Update image tag in kustomization
    cd "${manifest_dir}" || return 1
    kustomize edit set image "*:${version}"
    cd - || return 1
  fi

  # Deploy based on strategy
  case "${strategy}" in
    rolling|rolling-update)
      deploy_rolling "${manifest_dir}" "${namespace}" "${version}" "${dry_run}"
      ;;
    blue-green|bluegreen)
      deploy_blue_green "${manifest_dir}" "${namespace}" "${version}" "${dry_run}"
      ;;
    canary)
      deploy_canary "${manifest_dir}" "${namespace}" "${version}" "${dry_run}"
      ;;
    recreate)
      deploy_recreate "${manifest_dir}" "${namespace}" "${version}" "${dry_run}"
      ;;
    *)
      # Default to rolling
      deploy_rolling "${manifest_dir}" "${namespace}" "${version}" "${dry_run}"
      ;;
  esac

  return $?
}

# Rolling update deployment (default Kubernetes strategy)
deploy_rolling() {
  local manifest_dir=$1
  local namespace=$2
  local version=$3
  local dry_run=$4

  echo "Using rolling update strategy..."

  local deploy_cmd="kubectl apply -f ${manifest_dir}/ -n ${namespace}"

  if [ "${dry_run}" = "true" ]; then
    deploy_cmd="${deploy_cmd} --dry-run=client"
  fi

  echo "Executing: ${deploy_cmd}"
  ${deploy_cmd}

  if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    return 1
  fi

  if [ "${dry_run}" != "true" ]; then
    # Wait for rollout to complete
    echo "Waiting for rollout to complete..."
    kubectl rollout status deployment -n "${namespace}" --timeout=10m

    if [ $? -eq 0 ]; then
      echo "✅ Rolling update completed successfully"
      return 0
    else
      echo "❌ Rollout failed or timed out"
      return 1
    fi
  fi

  return 0
}

# Blue-green deployment
deploy_blue_green() {
  local manifest_dir=$1
  local namespace=$2
  local version=$3
  local dry_run=$4

  echo "Using blue-green deployment strategy..."

  # Deploy new version (green) alongside current (blue)
  # This requires service selector labels to switch between versions

  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: Would deploy green version and switch service selector"
    return 0
  fi

  # Apply new deployment with version label
  kubectl apply -f "${manifest_dir}/" -n "${namespace}"

  # Wait for new deployment to be ready
  echo "Waiting for green deployment to be ready..."
  kubectl rollout status deployment -n "${namespace}" --timeout=10m

  if [ $? -eq 0 ]; then
    echo "Green deployment ready"
    echo "ℹ️  To complete blue-green deployment:"
    echo "  1. Test green deployment"
    echo "  2. Update service selector to point to green"
    echo "  3. Delete blue deployment"
    echo ""
    echo "Example:"
    echo "  kubectl patch service <service-name> -n ${namespace} -p '{\"spec\":{\"selector\":{\"version\":\"${version}\"}}}'"
    return 0
  else
    echo "❌ Green deployment failed"
    return 1
  fi
}

# Canary deployment
deploy_canary() {
  local manifest_dir=$1
  local namespace=$2
  local version=$3
  local dry_run=$4

  echo "Using canary deployment strategy..."

  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: Would deploy canary with 10% traffic"
    return 0
  fi

  # Deploy canary version with reduced replicas
  kubectl apply -f "${manifest_dir}/" -n "${namespace}"

  echo "Canary deployment created"
  echo "ℹ️  Monitor canary metrics before full rollout:"
  echo "  1. Observe error rates, latency"
  echo "  2. Gradually increase canary replicas"
  echo "  3. Scale down old version"
  echo ""
  echo "Example:"
  echo "  kubectl scale deployment <deployment-name> -n ${namespace} --replicas=2  # Increase canary"
  echo "  kubectl scale deployment <deployment-name-old> -n ${namespace} --replicas=0  # Remove old"

  return 0
}

# Recreate deployment (delete then create)
deploy_recreate() {
  local manifest_dir=$1
  local namespace=$2
  local version=$3
  local dry_run=$4

  echo "Using recreate strategy (downtime expected)..."

  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: Would delete existing deployment and create new one"
    return 0
  fi

  # Delete existing deployment
  echo "Deleting existing deployments..."
  kubectl delete -f "${manifest_dir}/" -n "${namespace}" --ignore-not-found=true

  # Wait a moment
  sleep 5

  # Create new deployment
  echo "Creating new deployment..."
  kubectl apply -f "${manifest_dir}/" -n "${namespace}"

  # Wait for rollout
  kubectl rollout status deployment -n "${namespace}" --timeout=10m

  if [ $? -eq 0 ]; then
    echo "✅ Recreate deployment completed"
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

  echo "🔄 Rolling back Kubernetes deployment..."

  local namespace="${environment}"
  if [ "${environment}" = "production" ]; then
    namespace="default"
  fi

  # Get deployments in namespace
  local deployments
  deployments=$(kubectl get deployments -n "${namespace}" -o name | sed 's|deployment.apps/||')

  if [ -z "${deployments}" ]; then
    echo "❌ No deployments found in namespace: ${namespace}"
    return 1
  fi

  # Rollback each deployment
  echo "${deployments}" | while read -r deployment; do
    echo "Rolling back deployment: ${deployment}"

    if [ "${target_version}" = "previous" ]; then
      # Rollback to previous revision
      kubectl rollout undo deployment/"${deployment}" -n "${namespace}"
    else
      # Rollback to specific revision
      kubectl rollout undo deployment/"${deployment}" -n "${namespace}" --to-revision="${target_version}"
    fi

    # Wait for rollback
    kubectl rollout status deployment/"${deployment}" -n "${namespace}" --timeout=5m
  done

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

  local namespace="${environment}"
  if [ "${environment}" = "production" ]; then
    namespace="default"
  fi

  # Try to get ingress URL
  local ingress_url
  ingress_url=$(kubectl get ingress -n "${namespace}" -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null)

  if [ -n "${ingress_url}" ]; then
    echo "https://${ingress_url}"
    return 0
  fi

  # Try to get LoadBalancer service URL
  local lb_ip
  lb_ip=$(kubectl get svc -n "${namespace}" -o jsonpath='{.items[?(@.spec.type=="LoadBalancer")].status.loadBalancer.ingress[0].ip}' 2>/dev/null)

  if [ -n "${lb_ip}" ]; then
    echo "http://${lb_ip}"
    return 0
  fi

  # Fallback to NodePort or ClusterIP
  echo "Cluster internal (use kubectl port-forward)"
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
