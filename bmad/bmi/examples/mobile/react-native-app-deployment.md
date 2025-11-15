# Example: React Native App Deployment to iOS App Store & Google Play

This example shows how to deploy a React Native app to both iOS App Store and Google Play using BMI with Fastlane.

---

## Application Stack

- **Framework:** React Native 0.73
- **Platforms:** iOS 15+ and Android 12+
- **Tools:** Fastlane for automated deployment
- **CI/CD:** GitHub Actions
- **Environments:** Development (Ad-hoc/Internal) → TestFlight/Beta → Production

---

## Project Structure

```
my-rn-app/
├── android/                # Android native code
│   ├── app/
│   ├── build.gradle
│   └── fastlane/          # Android Fastlane config
│       ├── Fastfile
│       └── Appfile
├── ios/                   # iOS native code
│   ├── MyApp.xcworkspace
│   ├── MyApp/
│   └── fastlane/         # iOS Fastlane config
│       ├── Fastfile
│       └── Appfile
├── src/                  # React Native code
├── package.json
└── .github/
    └── workflows/
        ├── ios-deploy.yml
        └── android-deploy.yml
```

---

## Part 1: iOS Setup

### Step 1: Install Fastlane

```bash
# Install Fastlane
sudo gem install fastlane -NV
# Or: brew install fastlane

# Navigate to iOS directory
cd ios

# Initialize Fastlane
fastlane init

# Choose option 2: "Automate beta distribution to TestFlight"
```

### Step 2: Configure iOS Fastfile

Edit `ios/fastlane/Fastfile`:

```ruby
default_platform(:ios)

platform :ios do
  desc "Increment build number"
  lane :bump_build do
    increment_build_number(
      xcodeproj: "MyApp.xcodeproj"
    )
  end

  desc "Deploy to TestFlight"
  lane :beta do
    bump_build
    build_app(
      scheme: "MyApp",
      export_method: "app-store",
      export_options: {
        provisioningProfiles: {
          "com.mycompany.myapp" => "match AppStore com.mycompany.myapp"
        }
      }
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      distribute_external: true,
      groups: ["Beta Testers"],
      changelog: "Bug fixes and improvements"
    )
  end

  desc "Deploy to App Store"
  lane :release do
    bump_build
    build_app(
      scheme: "MyApp",
      export_method: "app-store"
    )
    upload_to_app_store(
      submit_for_review: false,
      automatic_release: false,
      precheck_include_in_app_purchases: false
    )
  end

  desc "Ad-hoc distribution for development"
  lane :adhoc do
    bump_build
    build_app(
      scheme: "MyApp",
      export_method: "ad-hoc"
    )
    # Upload to distribution service (e.g., Firebase App Distribution)
  end
end
```

### Step 3: Configure App Store Connect API Key

```bash
# Download API key from App Store Connect
# Settings → Users and Access → Keys → App Store Connect API

# Set environment variables
export APP_STORE_CONNECT_API_KEY_ID="your-key-id"
export APP_STORE_CONNECT_API_ISSUER_ID="your-issuer-id"
export APP_STORE_CONNECT_API_KEY_PATH="/path/to/AuthKey_XXXXX.p8"

# Or create fastlane/.env
echo "APP_STORE_CONNECT_API_KEY_ID=your-key-id" > fastlane/.env
echo "APP_STORE_CONNECT_API_ISSUER_ID=your-issuer-id" >> fastlane/.env
echo "APP_STORE_CONNECT_API_KEY_PATH=./AuthKey_XXXXX.p8" >> fastlane/.env
```

### Step 4: Deploy iOS to TestFlight

```bash
# From project root
bmad-cli invoke bmi/deploy \
  --version "1.0.5" \
  --environment testflight \
  --deployment-strategy rolling

# What happens:
# 1. ✅ Detects iOS platform (ios/Podfile, *.xcodeproj)
# 2. ✅ Checks Fastlane and Xcode installed
# 3. ✅ Sets version to 1.0.5
# 4. ✅ Increments build number automatically
# 5. ✅ Builds iOS app with Xcode
# 6. ✅ Signs app with provisioning profile
# 7. ✅ Uploads to TestFlight
# 8. ✅ Makes available for beta testers
# 9. ✅ Returns TestFlight URL
```

**Expected Output:**
```
🚀 Building and deploying iOS app...
Version: 1.0.5
Environment: testflight
Strategy: rolling

✅ iOS build environment ready
Setting version to: 1.0.5
Incrementing build number...
Executing: fastlane ios beta

[fastlane] Building app...
[fastlane] Signing with provisioning profile...
[fastlane] Uploading to TestFlight...
[fastlane] ✓ Successfully uploaded to TestFlight

✅ iOS deployment successful
App uploaded to TestFlight
Share with testers: https://appstoreconnect.apple.com/apps/testflight
```

### Step 5: Deploy iOS to App Store

```bash
# Deploy to production
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy rolling

# App is submitted to App Store for review
# Check status at: https://appstoreconnect.apple.com/
```

---

## Part 2: Android Setup

### Step 1: Initialize Fastlane for Android

```bash
# Navigate to Android directory
cd android

# Initialize Fastlane
fastlane init

# Choose option 3: "Automate Google Play deployment"
# Provide Google Play service account JSON key
```

### Step 2: Setup Google Play Service Account

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create service account with "Service Account User" role
3. Enable Google Play Android Developer API
4. Download JSON key
5. Grant access in Google Play Console (Settings → API access)

```bash
# Save JSON key
cp ~/Downloads/google-play-key.json android/google-play-key.json

# Add to .gitignore
echo "google-play-key.json" >> .gitignore

# Set environment variable
export GOOGLE_PLAY_JSON_KEY_PATH="./google-play-key.json"
```

### Step 3: Configure Android Fastfile

Edit `android/fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Build APK"
  lane :build do
    gradle(task: "clean assembleRelease")
  end

  desc "Deploy to Internal Testing"
  lane :internal do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(
      track: 'internal',
      release_status: 'completed',
      json_key: ENV['GOOGLE_PLAY_JSON_KEY_PATH'],
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  desc "Deploy to Beta Testing"
  lane :beta do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(
      track: 'beta',
      release_status: 'completed',
      json_key: ENV['GOOGLE_PLAY_JSON_KEY_PATH'],
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true,
      rollout: '0.1'  # Start with 10% rollout
    )
  end

  desc "Deploy to Production"
  lane :production do
    gradle(task: "clean bundleRelease")
    upload_to_play_store(
      track: 'production',
      release_status: 'completed',
      json_key: ENV['GOOGLE_PLAY_JSON_KEY_PATH'],
      skip_upload_metadata: false,
      skip_upload_images: false,
      skip_upload_screenshots: false,
      rollout: '0.2'  # Start with 20% rollout
    )
  end
end
```

### Step 4: Configure Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Create `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=***
MYAPP_RELEASE_KEY_PASSWORD=***
```

### Step 5: Deploy Android to Beta

```bash
# From project root
bmad-cli invoke bmi/deploy \
  --version "1.0.5" \
  --environment beta \
  --deployment-strategy rolling

# What happens:
# 1. ✅ Detects Android platform (android/build.gradle)
# 2. ✅ Checks Fastlane and Gradle installed
# 3. ✅ Sets version to 1.0.5
# 4. ✅ Builds Android AAB with Gradle
# 5. ✅ Signs app with keystore
# 6. ✅ Uploads to Play Console beta track
# 7. ✅ Makes available for beta testers (10% rollout)
# 8. ✅ Returns Play Console URL
```

**Expected Output:**
```
🚀 Building and deploying Android app...
Version: 1.0.5
Environment: beta
Strategy: rolling

✅ Android build environment ready
Setting version to: 1.0.5
Executing: fastlane android beta track:beta

[fastlane] Running Gradle task: bundleRelease
[fastlane] Signing AAB...
[fastlane] Uploading to Play Console...
[fastlane] ✓ Successfully uploaded to beta track

✅ Android deployment successful
App uploaded to beta track
Manage testers: https://play.google.com/console/
```

### Step 6: Deploy Android to Production

```bash
# Deploy to production
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy rolling

# App is uploaded to production track (20% rollout)
# Gradually increase rollout percentage in Play Console
```

---

## Part 3: CI/CD Automation

### GitHub Actions: iOS Deployment

Create `.github/workflows/ios-deploy.yml`:

```yaml
name: iOS Deployment

on:
  push:
    tags:
      - 'ios-v*.*.*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - testflight
          - production

jobs:
  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      - name: Install Fastlane
        run: gem install fastlane

      - name: Install dependencies
        run: |
          cd ios
          pod install

      - name: Setup provisioning profiles
        env:
          APP_STORE_CONNECT_API_KEY_ID: ${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}
          APP_STORE_CONNECT_API_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_API_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY_BASE64: ${{ secrets.APP_STORE_CONNECT_API_KEY_BASE64 }}
        run: |
          echo "$APP_STORE_CONNECT_API_KEY_BASE64" | base64 --decode > AuthKey.p8
          echo "APP_STORE_CONNECT_API_KEY_PATH=$(pwd)/AuthKey.p8" >> $GITHUB_ENV

      - name: Deploy to TestFlight
        if: github.event.inputs.environment == 'testflight' || startsWith(github.ref, 'refs/tags/ios-v')
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${GITHUB_REF#refs/tags/ios-v}" \
            --environment testflight

      - name: Deploy to App Store
        if: github.event.inputs.environment == 'production'
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${GITHUB_REF#refs/tags/ios-v}" \
            --environment production
```

### GitHub Actions: Android Deployment

Create `.github/workflows/android-deploy.yml`:

```yaml
name: Android Deployment

on:
  push:
    tags:
      - 'android-v*.*.*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        type: choice
        options:
          - internal
          - beta
          - production

jobs:
  deploy-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      - name: Install Fastlane
        run: gem install fastlane

      - name: Setup Google Play key
        env:
          GOOGLE_PLAY_JSON_KEY_BASE64: ${{ secrets.GOOGLE_PLAY_JSON_KEY_BASE64 }}
        run: |
          echo "$GOOGLE_PLAY_JSON_KEY_BASE64" | base64 --decode > google-play-key.json
          echo "GOOGLE_PLAY_JSON_KEY_PATH=$(pwd)/google-play-key.json" >> $GITHUB_ENV

      - name: Setup keystore
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > android/app/my-release-key.keystore

      - name: Deploy to Beta
        if: github.event.inputs.environment == 'beta' || startsWith(github.ref, 'refs/tags/android-v')
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${GITHUB_REF#refs/tags/android-v}" \
            --environment beta

      - name: Deploy to Production
        if: github.event.inputs.environment == 'production'
        run: |
          bmad-cli invoke bmi/deploy \
            --version "${GITHUB_REF#refs/tags/android-v}" \
            --environment production
```

---

## Part 4: Version Management

### Automated Version Bumping

```bash
# Install version management tool
npm install -g standard-version

# Bump version and create tag
standard-version

# This creates:
# - Updates package.json version
# - Creates CHANGELOG.md
# - Creates git tag (e.g., v1.0.5)

# Push tags
git push --follow-tags origin main

# GitHub Actions will automatically deploy based on tag
```

---

## Part 5: Testing Before Deployment

### Pre-deployment Testing

```bash
# Run Jest tests
npm test

# Run E2E tests with Detox
npm run e2e:ios
npm run e2e:android

# Only deploy if tests pass
if npm test && npm run e2e:ios; then
  bmad-cli invoke bmi/deploy \
    --version "1.0.5" \
    --environment testflight
fi
```

---

## Part 6: Monitoring Post-Deployment

### Setup Crash Reporting

```bash
# Install Sentry
npm install @sentry/react-native

# Configure
// App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV
});
```

### Monitor Deployment Success

```bash
# Check TestFlight testers
# iOS: https://appstoreconnect.apple.com/apps/testflight

# Check Play Console
# Android: https://play.google.com/console/

# Monitor crash rate
# - Should be < 1%
# - Monitor for 24-48 hours before production release
```

---

## Part 7: Rollback Procedures

### iOS Rollback

```bash
# TestFlight: Upload previous version
bmad-cli invoke bmi/rollback \
  --rollback-target "1.0.4" \
  --environment testflight

# App Store: Cannot rollback automatically
# - Submit previous version for review
# - Or submit hotfix
```

### Android Rollback

```bash
# Beta/Production: Halt rollout in Play Console
# Then upload previous version

bmad-cli invoke bmi/rollback \
  --rollback-target "1.0.4" \
  --environment beta

# Or halt rollout to 0% in Play Console
# Settings → Release → Halt rollout
```

---

## Summary

This example showed:
- ✅ Complete iOS deployment with Fastlane (TestFlight + App Store)
- ✅ Complete Android deployment with Fastlane (Beta + Production)
- ✅ CI/CD automation with GitHub Actions
- ✅ Version management and tagging
- ✅ Pre-deployment testing
- ✅ Post-deployment monitoring
- ✅ Rollback procedures

**Deployment Timeline:**
- Development (Ad-hoc/Internal): Immediate
- TestFlight/Beta: ~30 minutes
- App Store/Play Store review: 1-3 days

**Best Practices:**
- Always test on TestFlight/Beta before production
- Start with 10-20% rollout on production
- Monitor crash rates for 24-48 hours
- Have rollback plan ready
- Keep previous version deployable
