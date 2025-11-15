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

## Deployment Strategies

Different platforms support different strategies:

| Platform | Rolling | Blue-Green | Canary | Recreate |
|----------|---------|------------|--------|----------|
| Vercel | ✅ | ✅ | ❌ | ✅ |
| Railway | ✅ | ❌ | ❌ | ✅ |
| Render | ✅ | ✅ | ❌ | ✅ |
| Kubernetes | ✅ | ✅ | ✅ | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ✅ |
| AWS (various) | ✅ | ✅ | ✅ | ✅ |

## Testing

Test platform implementations:

```bash
# Test detection
bash bmad/bmi/deployment-platforms/serverless/vercel.sh detect

# Test deployment (dry-run)
bash bmad/bmi/deployment-platforms/serverless/vercel.sh deploy "1.0.0" "staging" "rolling" --dry-run

# Test actual deployment
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment staging \
  --deployment-strategy rolling
```

---

**Last Updated:** 2025-11-15
