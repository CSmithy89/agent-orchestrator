#!/bin/bash

# iOS Deployment via Fastlane
# Platform: iOS App Store
# Tool: Fastlane (fastlane.tools)
# Best for: iOS app builds, TestFlight, App Store deployment

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  # Check for iOS project files
  if [ -d "ios" ] && [ -f "ios/Podfile" ]; then
    # React Native iOS
    confidence="high"
    config_file="ios/Podfile"
  elif ls *.xcodeproj &> /dev/null 2>&1; then
    # Native iOS project
    confidence="high"
    config_file="$(ls *.xcodeproj | head -1)"
  elif ls *.xcworkspace &> /dev/null 2>&1; then
    # iOS workspace (CocoaPods)
    confidence="high"
    config_file="$(ls *.xcworkspace | head -1)"
  elif [ -f "fastlane/Fastfile" ]; then
    # Fastlane configured
    confidence="medium"
    config_file="fastlane/Fastfile"
  fi

  echo "platform=ios"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if on macOS (required for iOS builds)
  if [ "$(uname)" != "Darwin" ]; then
    echo "❌ iOS builds require macOS"
    return 1
  fi

  # Check if Xcode is installed
  if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode not installed"
    echo "Install from App Store or https://developer.apple.com/xcode/"
    return 1
  fi

  # Check if Fastlane is installed
  if ! command -v fastlane &> /dev/null; then
    echo "❌ Fastlane not installed"
    echo "Install: sudo gem install fastlane -NV"
    echo "Or: brew install fastlane"
    return 1
  fi

  # Check for Fastlane configuration
  if [ ! -f "fastlane/Fastfile" ]; then
    echo "⚠️  Fastlane not initialized"
    echo "Run: fastlane init"
    return 1
  fi

  # Check authentication (App Store Connect API Key preferred)
  if [ -n "${APP_STORE_CONNECT_API_KEY_PATH}" ]; then
    echo "✅ Using App Store Connect API Key"
  elif [ -n "${FASTLANE_USER}" ] && [ -n "${FASTLANE_PASSWORD}" ]; then
    echo "✅ Using Apple ID credentials"
  else
    echo "⚠️  No authentication configured"
    echo "Set APP_STORE_CONNECT_API_KEY_PATH or FASTLANE_USER + FASTLANE_PASSWORD"
    echo "App Store Connect API Key is recommended"
  fi

  echo "✅ iOS build environment ready"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Building and deploying iOS app..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Determine Fastlane lane based on environment
  local lane=""
  case "${environment}" in
    production)
      lane="release"  # Deploy to App Store
      ;;
    staging|testflight|beta)
      lane="beta"  # Deploy to TestFlight
      ;;
    dev|development)
      lane="adhoc"  # Ad-hoc distribution
      ;;
    *)
      lane="beta"  # Default to TestFlight
      ;;
  esac

  echo "Using Fastlane lane: ${lane}"

  # Set version number if provided
  if [ -n "${version}" ] && [ "${version}" != "latest" ]; then
    echo "Setting version to: ${version}"
    agvtool new-marketing-version "${version}"
  fi

  # Increment build number
  echo "Incrementing build number..."
  agvtool next-version -all

  # Build command
  local build_cmd="fastlane ios ${lane}"

  # Dry run
  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: ${build_cmd}"
    return 0
  fi

  # Execute build and deployment
  echo "Executing: ${build_cmd}"
  ${build_cmd}

  if [ $? -eq 0 ]; then
    echo "✅ iOS deployment successful"

    case "${lane}" in
      release)
        echo "App submitted to App Store for review"
        echo "Check status: https://appstoreconnect.apple.com/"
        ;;
      beta)
        echo "App uploaded to TestFlight"
        echo "Share with testers: https://appstoreconnect.apple.com/apps/testflight"
        ;;
      adhoc)
        echo "Ad-hoc build created"
        echo "Distribute IPA file from: build/output/"
        ;;
    esac

    return 0
  else
    echo "❌ iOS deployment failed"
    echo "Check Fastlane logs for details"
    return 1
  fi
}

# Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  echo "🔄 Rolling back iOS deployment..."

  if [ "${environment}" = "production" ]; then
    echo "⚠️  App Store releases cannot be rolled back automatically"
    echo ""
    echo "To rollback:"
    echo "1. Go to App Store Connect: https://appstoreconnect.apple.com/"
    echo "2. Select your app"
    echo "3. Submit a previous version for review"
    echo "4. Or submit a hotfix with the previous code"
    echo ""
    echo "Note: You cannot unpublish an app from the App Store"
  elif [ "${environment}" = "staging" ] || [ "${environment}" = "testflight" ]; then
    echo "⚠️  TestFlight builds cannot be rolled back"
    echo ""
    echo "To fix:"
    echo "1. Build and upload a previous version"
    echo "2. Or disable the problematic build in TestFlight"
    echo ""
    echo "Uploading previous version..."

    # Checkout previous version
    if [ "${target_version}" != "previous" ]; then
      git checkout "${target_version}"
    fi

    # Upload to TestFlight
    fastlane ios beta

    local result=$?

    # Return to current branch
    git checkout -

    return ${result}
  else
    echo "Ad-hoc builds don't need rollback - just distribute the previous IPA"
  fi

  return 1
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  case "${environment}" in
    production)
      # Get App Store URL
      local bundle_id
      bundle_id=$(xcodebuild -showBuildSettings 2>/dev/null | grep PRODUCT_BUNDLE_IDENTIFIER | awk '{print $3}' | head -1)

      if [ -n "${bundle_id}" ]; then
        # Try to get App Store URL
        echo "https://apps.apple.com/app/${bundle_id}"
      fi
      ;;
    staging|testflight|beta)
      echo "https://appstoreconnect.apple.com/apps/testflight"
      ;;
    *)
      echo "N/A (Ad-hoc distribution)"
      ;;
  esac
}

# Helper: Initialize Fastlane for iOS
init_fastlane() {
  echo "Initializing Fastlane for iOS..."

  if [ -f "fastlane/Fastfile" ]; then
    echo "Fastlane already initialized"
    return 0
  fi

  fastlane init

  # Create custom lanes
  cat > fastlane/Fastfile << 'EOF'
default_platform(:ios)

platform :ios do
  desc "Deploy to TestFlight"
  lane :beta do
    increment_build_number
    build_app(scheme: "YourAppScheme")
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end

  desc "Deploy to App Store"
  lane :release do
    increment_build_number
    build_app(scheme: "YourAppScheme")
    upload_to_app_store(
      submit_for_review: false,
      automatic_release: false
    )
  end

  desc "Ad-hoc build"
  lane :adhoc do
    increment_build_number
    build_app(
      scheme: "YourAppScheme",
      export_method: "ad-hoc"
    )
  end
end
EOF

  echo "✅ Fastlane initialized"
  echo "Edit fastlane/Fastfile to customize for your app"
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
  init)
    init_fastlane
    ;;
  *)
    echo "Usage: $0 {detect|check|deploy|rollback|get-url|init}"
    exit 1
    ;;
esac
