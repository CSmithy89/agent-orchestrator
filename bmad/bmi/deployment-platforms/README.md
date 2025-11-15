# Platform Deployment Implementations

This directory contains platform-specific deployment implementations for BMI. Each platform has its own implementation file with detection, deployment, and rollback logic.

## Supported Platforms

### Serverless Platforms
- **Vercel** - Next.js, React, static sites
- **Railway** - Full-stack containers, databases
- **Netlify** - JAMstack, serverless functions
- **Render** - Full-stack apps, managed databases
- **Fly.io** - Global edge deployment
- **Cloudflare Pages** - Edge-first deployment

### Cloud Platforms
- **DigitalOcean App Platform** - Apps, databases, static sites
- **AWS** - EC2, ECS, Lambda, Amplify, Elastic Beanstalk
- **GCP** - App Engine, Cloud Run, GKE
- **Azure** - App Service, Container Apps, Functions
- **Heroku** - 12-factor apps (legacy)

### Container Platforms
- **Kubernetes** - K8s clusters (EKS, GKE, AKS, self-hosted)
- **Docker** - Docker Compose, standalone containers

### Mobile Platforms
- **iOS** - App Store deployment via Fastlane
- **Android** - Google Play deployment via Fastlane

---

## Quick Reference Table

| Platform | Status | Config File | CLI Tool | Implementation File |
|----------|--------|-------------|----------|---------------------|
| **Serverless** |
| Vercel | ✅ Complete | `vercel.json` | `vercel` | [serverless/vercel.sh](serverless/vercel.sh) |
| Railway | ✅ Complete | `railway.json` | `railway` | [serverless/railway.sh](serverless/railway.sh) |
| Netlify | ✅ Complete | `netlify.toml` | `netlify` | [serverless/netlify.sh](serverless/netlify.sh) |
| Render | ✅ Complete | `render.yaml` | API-based | [serverless/render.sh](serverless/render.sh) |
| Fly.io | ✅ Complete | `fly.toml` | `flyctl` | [serverless/flyio.sh](serverless/flyio.sh) |
| **Cloud** |
| DigitalOcean | ✅ Complete | `.do/app.yaml` | `doctl` | [cloud/digitalocean.sh](cloud/digitalocean.sh) |
| AWS | ✅ Complete | Multiple | `aws`, `eb`, `sam` | [cloud/aws.sh](cloud/aws.sh) |
| **Containers** |
| Kubernetes | ✅ Complete | `k8s/*.yaml` | `kubectl`, `helm` | [containers/kubernetes.sh](containers/kubernetes.sh) |
| **Mobile** |
| iOS | ✅ Complete | `ios/Fastfile` | `fastlane`, `xcodebuild` | [mobile/fastlane-ios.sh](mobile/fastlane-ios.sh) |
| Android | ✅ Complete | `android/Fastfile` | `fastlane`, `gradle` | [mobile/fastlane-android.sh](mobile/fastlane-android.sh) |

**Legend:**
- ✅ Complete - Fully implemented and tested
- 🚧 Ready - Implementation ready, needs testing
- 📝 Planned - Planned for future release

### Deployment Strategy Support

| Platform | Rolling | Blue-Green | Canary | Recreate |
|----------|---------|------------|--------|----------|
| Vercel | ✅ | ✅ | ❌ | ✅ |
| Railway | ✅ | ❌ | ❌ | ✅ |
| Netlify | ✅ | ✅ | ⚠️ Split Testing | ✅ |
| Render | ✅ | ✅ | ❌ | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ❌ | ✅ |
| AWS | ✅ | ✅ | ✅ | ✅ |
| Kubernetes | ✅ | ✅ | ✅ | ✅ |
| iOS/Android | ✅ | N/A | N/A | N/A |

**Legend:**
- ✅ Fully supported
- ⚠️ Partial support or alternative method
- ❌ Not supported by platform
- N/A Not applicable

---

## Platform Files

Each platform has its own implementation file:

```
deployment-platforms/
├── serverless/
│   ├── vercel.sh           # Vercel deployment
│   ├── railway.sh          # Railway deployment
│   ├── netlify.sh          # Netlify deployment
│   ├── render.sh           # Render deployment
│   ├── flyio.sh            # Fly.io deployment
│   └── cloudflare-pages.sh # Cloudflare Pages deployment
├── cloud/
│   ├── digitalocean.sh     # DigitalOcean App Platform
│   ├── aws.sh              # AWS (multiple services)
│   ├── gcp.sh              # Google Cloud Platform
│   ├── azure.sh            # Microsoft Azure
│   └── heroku.sh           # Heroku
├── containers/
│   ├── kubernetes.sh       # Kubernetes deployment
│   └── docker.sh           # Docker deployment
├── mobile/
│   ├── ios-fastlane.sh     # iOS deployment with Fastlane
│   └── android-fastlane.sh # Android deployment with Fastlane
└── README.md               # This file
```

## Usage

Platform implementations are invoked by the `deploy` workflow:

```bash
# Detect platform
platform=$(detect_platform)

# Load platform-specific implementation
source "bmad/bmi/deployment-platforms/${category}/${platform}.sh"

# Deploy
deploy_to_platform "${version}" "${environment}" "${strategy}"
```

## Implementation Structure

Each platform file follows this structure:

```bash
#!/bin/bash

# Platform detection
detect() {
  # Check for platform-specific config files
  # Return: platform name, confidence level
}

# Prerequisites check
check_prerequisites() {
  # Verify CLI tools installed
  # Verify authentication configured
  # Return: 0 if OK, 1 if missing
}

# Deploy function
deploy() {
  local version=$1
  local environment=$2
  local strategy=$3

  # Platform-specific deployment logic
  # Return: 0 on success, 1 on failure
}

# Rollback function
rollback() {
  local target_version=$1
  local environment=$2

  # Platform-specific rollback logic
  # Return: 0 on success, 1 on failure
}

# Get deployment URL
get_deployment_url() {
  local environment=$1

  # Return the deployed application URL
}
```

## Adding New Platforms

To add a new platform:

1. Create new file in appropriate category directory
2. Implement the 5 required functions (detect, check_prerequisites, deploy, rollback, get_deployment_url)
3. Test deployment on actual platform
4. Update this README
5. Update `tasks/detect-platform.md`

## Platform-Specific Notes

See individual platform files for:
- Required CLI tools
- Authentication setup
- Environment variables
- Configuration files
- Deployment strategies supported
- Known limitations

## CLI Tools Required

### Serverless
- `vercel` - Vercel CLI
- `railway` - Railway CLI
- `netlify` - Netlify CLI
- `render` - Render CLI (via API)
- `flyctl` - Fly.io CLI
- `wrangler` - Cloudflare CLI

### Cloud
- `doctl` - DigitalOcean CLI
- `aws` - AWS CLI
- `gcloud` - Google Cloud CLI
- `az` - Azure CLI
- `heroku` - Heroku CLI

### Containers
- `kubectl` - Kubernetes CLI
- `docker` - Docker CLI
- `helm` - Helm (optional, for K8s)

### Mobile
- `fastlane` - Fastlane CLI (iOS/Android)
- `xcodebuild` - Xcode CLI (iOS only)
- `gradle` - Gradle (Android only)

## Authentication

Each platform requires authentication:

```bash
# Vercel
export VERCEL_TOKEN="your-token"

# Railway
export RAILWAY_TOKEN="your-token"

# Netlify
export NETLIFY_AUTH_TOKEN="your-token"

# DigitalOcean
export DIGITALOCEAN_ACCESS_TOKEN="your-token"
doctl auth init

# AWS
aws configure

# GCP
gcloud auth login

# Azure
az login

# Fastlane (iOS)
export FASTLANE_USER="your-apple-id"
export FASTLANE_PASSWORD="your-password"
# Or use App Store Connect API Key
```

## Testing

### Manual Testing

Test platform implementations manually before deploying to production:

```bash
# 1. Test detection
bash bmad/bmi/deployment-platforms/serverless/vercel.sh detect

# 2. Test prerequisites check
bash bmad/bmi/deployment-platforms/serverless/vercel.sh check

# 3. Test deployment (dry-run)
bash bmad/bmi/deployment-platforms/serverless/vercel.sh deploy "1.0.0" "staging" "rolling" true

# 4. Test actual deployment to staging
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment staging \
  --deployment-strategy rolling

# 5. Verify deployment URL
bash bmad/bmi/deployment-platforms/serverless/vercel.sh get-url staging

# 6. Test rollback
bmad-cli invoke bmi/rollback \
  --rollback-target "previous" \
  --environment staging
```

### Testing Checklist

For each platform implementation, verify:

- [ ] **Detection works correctly**
  - `detect()` identifies platform from config files
  - Returns correct confidence level (high/medium/low)
  - Returns correct config file path

- [ ] **Prerequisites check is thorough**
  - `check_prerequisites()` verifies CLI tool installed
  - Checks for valid authentication/credentials
  - Provides helpful error messages when missing

- [ ] **Deployment succeeds**
  - `deploy()` successfully deploys application
  - Handles all deployment strategies (rolling, blue-green, canary, recreate)
  - Returns correct deployment URL
  - Updates deployment status

- [ ] **Rollback works**
  - `rollback()` successfully reverts to previous version
  - Verifies rollback with smoke tests
  - Handles edge cases (first deployment, no previous version)

- [ ] **Error handling**
  - Script fails gracefully with clear error messages
  - Provides actionable resolution steps
  - Logs errors for debugging

- [ ] **Documentation**
  - README includes platform-specific notes
  - CLI tools and authentication documented
  - Known limitations listed

### Automated Testing (Future Enhancement)

While v1.0 relies on manual testing, future versions will include:

**ShellCheck Linting:**
```bash
# Lint all platform scripts
find bmad/bmi/deployment-platforms -name "*.sh" -exec shellcheck {} \;
```

**Integration Tests:**
```bash
# Test actual deployments to real platforms
npm run test:integration -- --platform vercel
npm run test:integration -- --platform railway
```

**Mock Testing:**
```bash
# Test logic without actual deployments
npm run test:unit -- platform-implementations
```

### Platform Testing Matrix

| Platform | Detection | Prerequisites | Deploy | Rollback | URL | Tested |
|----------|-----------|---------------|--------|----------|-----|--------|
| Vercel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Railway | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Netlify | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Render | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| AWS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kubernetes | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| iOS | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Android | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |

**Legend:**
- ✅ Fully tested and working
- ⚠️ Partially working or manual steps required
- ❌ Not implemented

### Testing Recommendations

1. **Always test in staging first** - Never test new platform implementations in production
2. **Use dry-run mode** - Test deployment logic without actually deploying
3. **Test rollback immediately** - After first successful deployment, test rollback
4. **Monitor deployments** - Watch logs during deployment for errors
5. **Document failures** - Keep track of issues encountered and solutions
6. **Test edge cases**:
   - First deployment (no previous version to rollback to)
   - Deployment failure scenarios
   - Network failures mid-deployment
   - Invalid credentials
   - Missing config files

### Reporting Issues

If you encounter issues with a platform implementation:

1. Check platform-specific documentation in the script comments
2. Verify CLI tool version: `<cli-tool> --version`
3. Check authentication: `<cli-tool> whoami` or equivalent
4. Enable debug mode: `set -x` in the script
5. Report issue with:
   - Platform name and version
   - Error message and logs
   - Steps to reproduce
   - Expected vs actual behavior

---

**Last Updated:** 2025-11-15
