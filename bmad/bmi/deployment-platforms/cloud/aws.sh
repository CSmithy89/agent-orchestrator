#!/bin/bash

# AWS Deployment Implementation
# Platform: AWS (Amazon Web Services)
# Services: Elastic Beanstalk, ECS, Lambda, Amplify
# Best for: Enterprise applications, scalable workloads

# Platform detection
detect() {
  local confidence="none"
  local config_file=""
  local aws_service="unknown"

  # Elastic Beanstalk
  if [ -f ".elasticbeanstalk/config.yml" ]; then
    confidence="high"
    config_file=".elasticbeanstalk/config.yml"
    aws_service="elasticbeanstalk"
  # ECS
  elif [ -f "ecs-params.yml" ] || [ -f "task-definition.json" ]; then
    confidence="high"
    config_file="ecs-params.yml or task-definition.json"
    aws_service="ecs"
  # Lambda (SAM)
  elif [ -f "template.yaml" ] && grep -q "AWS::Serverless" template.yaml; then
    confidence="high"
    config_file="template.yaml"
    aws_service="lambda"
  # Amplify
  elif [ -f "amplify.yml" ] || [ -d "amplify" ]; then
    confidence="high"
    config_file="amplify.yml"
    aws_service="amplify"
  # Generic AWS (has Dockerfile, might use ECS/EB)
  elif [ -f "Dockerfile" ] && [ -f ".aws/config" ]; then
    confidence="medium"
    config_file="Dockerfile"
    aws_service="ecs"
  fi

  echo "platform=aws"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
  echo "aws_service=${aws_service}"
}

# Prerequisites check
check_prerequisites() {
  # Check if AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo "Install: brew install awscli"
    echo "Or: pip install awscli"
    echo "Or: https://aws.amazon.com/cli/"
    return 1
  fi

  # Check if AWS credentials are configured
  if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "Run: aws configure"
    echo "Or set: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    return 1
  fi

  # Detect AWS service
  local aws_service
  aws_service=$(detect | grep "aws_service=" | cut -d'=' -f2)

  # Check service-specific CLI
  case "${aws_service}" in
    elasticbeanstalk)
      if ! command -v eb &> /dev/null; then
        echo "⚠️  EB CLI not installed (optional but recommended)"
        echo "Install: pip install awsebcli"
      fi
      ;;
    ecs)
      # ECS uses aws CLI, no additional tool needed
      echo "✅ AWS CLI configured for ECS"
      ;;
    lambda)
      if ! command -v sam &> /dev/null; then
        echo "⚠️  SAM CLI not installed (recommended for Lambda)"
        echo "Install: brew install aws-sam-cli"
      fi
      ;;
    amplify)
      if ! command -v amplify &> /dev/null; then
        echo "⚠️  Amplify CLI not installed"
        echo "Install: npm install -g @aws-amplify/cli"
      fi
      ;;
  esac

  echo "✅ AWS CLI installed and configured"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Deploying to AWS..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Detect AWS service
  local aws_service
  aws_service=$(detect | grep "aws_service=" | cut -d'=' -f2)

  echo "AWS Service: ${aws_service}"

  # Route to appropriate service deployment
  case "${aws_service}" in
    elasticbeanstalk)
      deploy_elasticbeanstalk "${version}" "${environment}" "${strategy}" "${dry_run}"
      ;;
    ecs)
      deploy_ecs "${version}" "${environment}" "${strategy}" "${dry_run}"
      ;;
    lambda)
      deploy_lambda "${version}" "${environment}" "${strategy}" "${dry_run}"
      ;;
    amplify)
      deploy_amplify "${version}" "${environment}" "${strategy}" "${dry_run}"
      ;;
    *)
      echo "❌ AWS service not detected or unsupported"
      echo "Supported: Elastic Beanstalk, ECS, Lambda (SAM), Amplify"
      return 1
      ;;
  esac
}

# Elastic Beanstalk deployment
deploy_elasticbeanstalk() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=$4

  echo "Deploying to Elastic Beanstalk..."

  # Check if EB CLI is available
  if command -v eb &> /dev/null; then
    # Use EB CLI
    local deploy_cmd="eb deploy ${environment}"

    if [ "${dry_run}" = "true" ]; then
      deploy_cmd="${deploy_cmd} --dry-run"
    fi

    echo "Executing: ${deploy_cmd}"
    ${deploy_cmd}

    if [ $? -eq 0 ]; then
      echo "✅ Elastic Beanstalk deployment successful"

      # Get environment URL
      local url
      url=$(eb status "${environment}" | grep "CNAME" | awk '{print $2}')
      if [ -n "${url}" ]; then
        echo "URL: https://${url}"
        echo "deployment_url=https://${url}"
      fi

      return 0
    else
      echo "❌ Deployment failed"
      return 1
    fi
  else
    # Use AWS CLI
    echo "Using AWS CLI for Elastic Beanstalk deployment..."

    # Create application version
    local app_name
    app_name=$(grep "application_name" .elasticbeanstalk/config.yml | awk '{print $2}')

    if [ -z "${app_name}" ]; then
      echo "❌ Unable to determine application name"
      return 1
    fi

    # Package and upload
    zip -r app-${version}.zip . -x "*.git*" ".elasticbeanstalk/*"

    aws s3 cp app-${version}.zip s3://${app_name}-deployments/

    # Create application version
    aws elasticbeanstalk create-application-version \
      --application-name "${app_name}" \
      --version-label "${version}" \
      --source-bundle S3Bucket="${app_name}-deployments",S3Key="app-${version}.zip"

    # Update environment
    aws elasticbeanstalk update-environment \
      --application-name "${app_name}" \
      --environment-name "${environment}" \
      --version-label "${version}"

    echo "✅ Deployment initiated"
    return 0
  fi
}

# ECS deployment
deploy_ecs() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=$4

  echo "Deploying to ECS..."

  # Get cluster and service names
  local cluster_name="${environment}-cluster"
  local service_name="${environment}-service"

  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: Would update ECS service ${service_name} in cluster ${cluster_name}"
    return 0
  fi

  # Update service with new task definition
  aws ecs update-service \
    --cluster "${cluster_name}" \
    --service "${service_name}" \
    --force-new-deployment

  if [ $? -eq 0 ]; then
    echo "✅ ECS deployment successful"

    # Wait for deployment to stabilize
    echo "Waiting for service to stabilize..."
    aws ecs wait services-stable \
      --cluster "${cluster_name}" \
      --services "${service_name}"

    return 0
  else
    echo "❌ ECS deployment failed"
    return 1
  fi
}

# Lambda deployment
deploy_lambda() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=$4

  echo "Deploying Lambda function..."

  if command -v sam &> /dev/null; then
    # Use SAM CLI
    local deploy_cmd="sam deploy --no-confirm-changeset"

    if [ "${dry_run}" = "true" ]; then
      deploy_cmd="sam validate"
    fi

    echo "Executing: ${deploy_cmd}"
    ${deploy_cmd}

    return $?
  else
    echo "❌ SAM CLI not installed"
    echo "Install: brew install aws-sam-cli"
    return 1
  fi
}

# Amplify deployment
deploy_amplify() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=$4

  echo "Deploying with Amplify..."

  if command -v amplify &> /dev/null; then
    if [ "${dry_run}" = "true" ]; then
      echo "Dry run: Would publish to Amplify"
      return 0
    fi

    amplify publish

    return $?
  else
    echo "❌ Amplify CLI not installed"
    echo "Install: npm install -g @aws-amplify/cli"
    return 1
  fi
}

# Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  echo "🔄 Rolling back AWS deployment..."

  # Detect AWS service
  local aws_service
  aws_service=$(detect | grep "aws_service=" | cut -d'=' -f2)

  case "${aws_service}" in
    elasticbeanstalk)
      # Rollback Elastic Beanstalk
      if command -v eb &> /dev/null; then
        echo "Rolling back Elastic Beanstalk environment..."
        eb deploy "${environment}" --version "${target_version}"
        return $?
      fi
      ;;
    ecs)
      # Rollback ECS by updating to previous task definition
      echo "Rolling back ECS service..."
      local cluster_name="${environment}-cluster"
      local service_name="${environment}-service"

      aws ecs update-service \
        --cluster "${cluster_name}" \
        --service "${service_name}" \
        --task-definition "${target_version}"

      return $?
      ;;
    lambda)
      echo "⚠️  Lambda rollback requires publishing previous version"
      return 1
      ;;
  esac

  return 1
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  # Detect AWS service
  local aws_service
  aws_service=$(detect | grep "aws_service=" | cut -d'=' -f2)

  case "${aws_service}" in
    elasticbeanstalk)
      if command -v eb &> /dev/null; then
        eb status "${environment}" | grep "CNAME" | awk '{print "https://" $2}'
      fi
      ;;
    amplify)
      echo "Check Amplify Console for app URL"
      ;;
    *)
      echo "Unknown"
      ;;
  esac
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
