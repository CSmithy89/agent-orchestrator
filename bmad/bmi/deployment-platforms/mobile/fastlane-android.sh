#!/bin/bash

# Android Deployment via Fastlane
# Platform: Google Play Store
# Tool: Fastlane (fastlane.tools)
# Best for: Android app builds, Play Console, Google Play deployment

# Platform detection
detect() {
  local confidence="none"
  local config_file=""

  # Check for Android project files
  if [ -f "android/build.gradle" ]; then
    # React Native Android or standalone
    confidence="high"
    config_file="android/build.gradle"
  elif [ -f "build.gradle" ] && [ -d "app" ]; then
    # Native Android project
    confidence="high"
    config_file="build.gradle"
  elif [ -f "settings.gradle" ]; then
    # Gradle project
    confidence="medium"
    config_file="settings.gradle"
  elif [ -f "android/fastlane/Fastfile" ] || [ -f "fastlane/Fastfile" ]; then
    # Fastlane configured
    confidence="medium"
    config_file="fastlane/Fastfile"
  fi

  echo "platform=android"
  echo "confidence=${confidence}"
  echo "config_file=${config_file}"
}

# Prerequisites check
check_prerequisites() {
  # Check if Java is installed
  if ! command -v java &> /dev/null; then
    echo "❌ Java not installed"
    echo "Install Java 11 or higher"
    return 1
  fi

  # Check if Gradle is installed or gradle wrapper exists
  if ! command -v gradle &> /dev/null && [ ! -f "gradlew" ]; then
    echo "❌ Gradle not installed and no gradle wrapper found"
    echo "Install: brew install gradle"
    echo "Or use gradle wrapper: gradle wrapper"
    return 1
  fi

  # Check if Fastlane is installed
  if ! command -v fastlane &> /dev/null; then
    echo "❌ Fastlane not installed"
    echo "Install: sudo gem install fastlane -NV"
    echo "Or: brew install fastlane"
    return 1
  fi

  # Check for Android SDK
  if [ -z "${ANDROID_HOME}" ] && [ -z "${ANDROID_SDK_ROOT}" ]; then
    echo "⚠️  ANDROID_HOME or ANDROID_SDK_ROOT not set"
    echo "Set ANDROID_HOME to your Android SDK path"
    echo "Example: export ANDROID_HOME=/usr/local/android-sdk"
  fi

  # Check for Fastlane configuration
  local fastlane_dir="android/fastlane"
  if [ ! -d "${fastlane_dir}" ]; then
    fastlane_dir="fastlane"
  fi

  if [ ! -f "${fastlane_dir}/Fastfile" ]; then
    echo "⚠️  Fastlane not initialized"
    echo "Run: cd android && fastlane init"
    return 1
  fi

  # Check for Google Play service account JSON
  if [ -z "${GOOGLE_PLAY_JSON_KEY_PATH}" ] && [ ! -f "google-play-key.json" ]; then
    echo "⚠️  Google Play service account key not found"
    echo "Set GOOGLE_PLAY_JSON_KEY_PATH or place google-play-key.json in project root"
    echo "Get key from: https://console.cloud.google.com/iam-admin/serviceaccounts"
  fi

  echo "✅ Android build environment ready"
  return 0
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3
  local dry_run=${4:-false}

  echo "🚀 Building and deploying Android app..."
  echo "Version: ${version}"
  echo "Environment: ${environment}"
  echo "Strategy: ${strategy}"

  # Determine Fastlane lane based on environment
  local lane=""
  local track=""

  case "${environment}" in
    production)
      lane="production"
      track="production"  # Deploy to production track
      ;;
    staging|beta)
      lane="beta"
      track="beta"  # Deploy to beta track
      ;;
    internal|alpha)
      lane="internal"
      track="internal"  # Deploy to internal testing track
      ;;
    dev|development)
      lane="build"  # Just build APK/AAB
      ;;
    *)
      lane="beta"
      track="beta"
      ;;
  esac

  echo "Using Fastlane lane: ${lane}"

  # Set working directory
  local work_dir="."
  if [ -d "android" ]; then
    work_dir="android"
    cd android || return 1
  fi

  # Set version if provided
  if [ -n "${version}" ] && [ "${version}" != "latest" ]; then
    echo "Setting version to: ${version}"

    # Update version in build.gradle
    if [ -f "app/build.gradle" ]; then
      # Extract major.minor.patch
      local version_name="${version}"
      local version_code
      version_code=$(date +%Y%m%d%H%M)  # Use timestamp as version code

      # Update versionName and versionCode
      sed -i.bak "s/versionName \".*\"/versionName \"${version_name}\"/" app/build.gradle
      sed -i.bak "s/versionCode .*/versionCode ${version_code}/" app/build.gradle
      rm -f app/build.gradle.bak
    fi
  fi

  # Build command
  local build_cmd="fastlane android ${lane}"

  # Add track parameter for Play Store deployment
  if [ "${lane}" != "build" ]; then
    build_cmd="${build_cmd} track:${track}"
  fi

  # Dry run
  if [ "${dry_run}" = "true" ]; then
    echo "Dry run: ${build_cmd}"
    [ "${work_dir}" = "android" ] && cd ..
    return 0
  fi

  # Execute build and deployment
  echo "Executing: ${build_cmd}"
  ${build_cmd}

  local result=$?

  # Return to original directory
  [ "${work_dir}" = "android" ] && cd ..

  if [ ${result} -eq 0 ]; then
    echo "✅ Android deployment successful"

    case "${lane}" in
      production)
        echo "App submitted to Google Play production track"
        echo "Check status: https://play.google.com/console/"
        ;;
      beta)
        echo "App uploaded to beta track"
        echo "Manage testers: https://play.google.com/console/"
        ;;
      internal)
        echo "App uploaded to internal testing track"
        echo "Share with internal testers"
        ;;
      build)
        echo "APK/AAB built successfully"
        echo "Output: android/app/build/outputs/"
        ;;
    esac

    return 0
  else
    echo "❌ Android deployment failed"
    echo "Check Fastlane logs for details"
    return 1
  fi
}

# Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  echo "🔄 Rolling back Android deployment..."

  if [ "${environment}" = "production" ]; then
    echo "⚠️  Google Play production releases cannot be fully rolled back"
    echo ""
    echo "Options:"
    echo "1. Halt rollout: Reduce rollout percentage to 0% in Play Console"
    echo "2. Submit hotfix: Build and submit a fix version"
    echo "3. Previous version: Google Play keeps previous versions available"
    echo ""
    echo "To halt rollout:"
    echo "1. Go to Play Console: https://play.google.com/console/"
    echo "2. Select your app > Production > Latest release"
    echo "3. Halt rollout or update rollout percentage to 0%"

  elif [ "${environment}" = "beta" ] || [ "${environment}" = "staging" ]; then
    echo "Uploading previous version to beta track..."

    # Checkout previous version
    if [ "${target_version}" != "previous" ]; then
      git checkout "${target_version}"
    fi

    # Upload to beta track
    cd android 2>/dev/null || true
    fastlane android beta track:beta

    local result=$?

    # Return to current branch
    git checkout -
    cd .. 2>/dev/null || true

    return ${result}
  else
    echo "Development builds don't need rollback - just distribute the previous APK/AAB"
  fi

  return 1
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  # Get package name from build.gradle
  local package_name
  if [ -f "android/app/build.gradle" ]; then
    package_name=$(grep -E 'applicationId ' android/app/build.gradle | sed -E 's/.*applicationId "(.+)".*/\1/' | tr -d ' ')
  elif [ -f "app/build.gradle" ]; then
    package_name=$(grep -E 'applicationId ' app/build.gradle | sed -E 's/.*applicationId "(.+)".*/\1/' | tr -d ' ')
  fi

  if [ -n "${package_name}" ]; then
    case "${environment}" in
      production)
        echo "https://play.google.com/store/apps/details?id=${package_name}"
        ;;
      beta|staging|internal)
        echo "https://play.google.com/console/ (beta/internal testing)"
        ;;
      *)
        echo "N/A (local build)"
        ;;
    esac
  else
    echo "Unable to determine package name"
  fi
}

# Helper: Initialize Fastlane for Android
init_fastlane() {
  echo "Initializing Fastlane for Android..."

  local work_dir="."
  if [ -d "android" ]; then
    work_dir="android"
    cd android || return 1
  fi

  if [ -f "fastlane/Fastfile" ]; then
    echo "Fastlane already initialized"
    [ "${work_dir}" = "android" ] && cd ..
    return 0
  fi

  fastlane init

  # Create custom lanes
  cat > fastlane/Fastfile << 'EOF'
default_platform(:android)

platform :android do
  desc "Build APK"
  lane :build do
    gradle(task: "clean assembleRelease")
  end

  desc "Deploy to Internal Testing"
  lane :internal do |options|
    gradle(task: "clean bundleRelease")
    upload_to_play_store(
      track: options[:track] || 'internal',
      release_status: 'completed',
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  desc "Deploy to Beta Testing"
  lane :beta do |options|
    gradle(task: "clean bundleRelease")
    upload_to_play_store(
      track: options[:track] || 'beta',
      release_status: 'completed',
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  desc "Deploy to Production"
  lane :production do |options|
    gradle(task: "clean bundleRelease")
    upload_to_play_store(
      track: options[:track] || 'production',
      release_status: 'completed',
      skip_upload_metadata: false,
      skip_upload_images: false,
      skip_upload_screenshots: false
    )
  end
end
EOF

  echo "✅ Fastlane initialized"
  echo "Edit fastlane/Fastfile to customize for your app"
  echo ""
  echo "Next steps:"
  echo "1. Setup Google Play service account: https://docs.fastlane.tools/actions/upload_to_play_store/#setup"
  echo "2. Download JSON key and set GOOGLE_PLAY_JSON_KEY_PATH"
  echo "3. Configure signing in android/app/build.gradle"

  [ "${work_dir}" = "android" ] && cd ..
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
