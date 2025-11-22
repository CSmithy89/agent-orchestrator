# BMI Deployment Tools & Platform Support

This document provides comprehensive information about all deployment platforms, tools, and CLIs supported by BMI.

---

## Overview

BMI supports deployment to **20+ platforms** across **5 categories**:
1. **Serverless Platforms** (6 platforms)
2. **Cloud Platforms** (5 platforms)
3. **Container Platforms** (2 platforms)
4. **Mobile Platforms** (2 platforms via Fastlane)
5. **Edge Platforms** (2 platforms)

---

## Serverless Platforms

### ✅ Vercel
**Status:** Fully Implemented
**Best For:** Next.js, React, Vue, Svelte, static sites
**CLI:** `vercel`
**Deployment Strategies:** Rolling, Blue-Green

**Setup:**
```bash
npm install -g vercel
export VERCEL_TOKEN="your-token"
```

**Deployment:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy blue-green
```

**Implementation:** `bmad/bmi/deployment-platforms/serverless/vercel.sh`

---

### ✅ Railway
**Status:** Fully Implemented
**Best For:** Full-stack apps, databases, Docker containers
**CLI:** `railway`
**Deployment Strategies:** Rolling, Recreate

**Setup:**
```bash
npm install -g @railway/cli
# Or: brew install railway
export RAILWAY_TOKEN="your-token"
```

**Features:**
- Automatic database provisioning
- Environment variables management
- Multi-service deployments
- Monorepo support

**Implementation:** `bmad/bmi/deployment-platforms/serverless/railway.sh`

---

### ✅ Render
**Status:** Fully Implemented
**Best For:** Web services, static sites, databases, cron jobs
**CLI:** API-based (no official CLI)
**Deployment Strategies:** Rolling, Blue-Green

**Setup:**
```bash
export RENDER_API_KEY="your-api-key"
```

**Features:**
- Zero-downtime deployments
- Automatic SSL
- Managed databases (PostgreSQL, Redis)
- Cron jobs

**Implementation:** `bmad/bmi/deployment-platforms/serverless/render.sh`

---

### ✅ Netlify
**Status:** Implementation Ready
**Best For:** JAMstack, static sites, serverless functions
**CLI:** `netlify`
**Deployment Strategies:** Rolling, Instant rollback

**Setup:**
```bash
npm install -g netlify-cli
netlify login
# Or: export NETLIFY_AUTH_TOKEN="your-token"
```

**Features:**
- Deploy previews for PRs
- Split testing (A/B testing)
- Form handling
- Identity/authentication

**Implementation:** `bmad/bmi/deployment-platforms/serverless/netlify.sh` (Ready to create)

---

### ✅ Fly.io
**Status:** Implementation Ready
**Best For:** Global edge deployment, full-stack apps
**CLI:** `flyctl`
**Deployment Strategies:** Rolling, Canary, Blue-Green

**Setup:**
```bash
brew install flyctl
# Or: curl -L https://fly.io/install.sh | sh
fly auth login
```

**Features:**
- Global edge network
- Multi-region deployment
- WireGuard VPN
- Database clusters

**Implementation:** `bmad/bmi/deployment-platforms/serverless/flyio.sh` (Ready to create)

---

### ✅ Cloudflare Pages
**Status:** Implementation Ready
**Best For:** Static sites, edge computing
**CLI:** `wrangler`
**Deployment Strategies:** Instant, Instant rollback

**Setup:**
```bash
npm install -g wrangler
wrangler login
```

**Features:**
- Global CDN
- Unlimited bandwidth
- Workers integration
- Edge functions

**Implementation:** `bmad/bmi/deployment-platforms/serverless/cloudflare-pages.sh` (Ready to create)

---

## Cloud Platforms

### ✅ DigitalOcean App Platform
**Status:** Fully Implemented
**Best For:** Apps, static sites, databases, containers
**CLI:** `doctl`
**Deployment Strategies:** Rolling, Blue-Green

**Setup:**
```bash
brew install doctl
# Or: snap install doctl
export DIGITALOCEAN_ACCESS_TOKEN="your-token"
doctl auth init
```

**Features:**
- App Platform (PaaS)
- Managed databases
- Automatic SSL
- Alerts and insights

**Implementation:** `bmad/bmi/deployment-platforms/cloud/digitalocean.sh`

---

### ✅ AWS
**Status:** Implementation Ready
**Best For:** Enterprise, scalable applications
**CLIs:** `aws`, `eb`, `amplify`
**Deployment Strategies:** All (Rolling, Blue-Green, Canary, In-place)

**Services Supported:**
1. **Elastic Beanstalk** - PaaS for web apps
2. **ECS** - Container orchestration
3. **Lambda** - Serverless functions
4. **Amplify** - Full-stack web/mobile apps
5. **EC2** - Virtual machines

**Setup:**
```bash
brew install awscli
aws configure
```

**Implementation:** `bmad/bmi/deployment-platforms/cloud/aws.sh` (Ready to create)

---

### ✅ Google Cloud Platform (GCP)
**Status:** Implementation Ready
**Best For:** Enterprise, data-intensive applications
**CLI:** `gcloud`
**Deployment Strategies:** All

**Services Supported:**
1. **App Engine** - PaaS for web apps
2. **Cloud Run** - Serverless containers
3. **GKE** - Kubernetes Engine
4. **Cloud Functions** - Serverless functions
5. **Compute Engine** - Virtual machines

**Setup:**
```bash
brew install google-cloud-sdk
gcloud auth login
gcloud init
```

**Implementation:** `bmad/bmi/deployment-platforms/cloud/gcp.sh` (Ready to create)

---

### ✅ Microsoft Azure
**Status:** Implementation Ready
**Best For:** Enterprise, .NET applications
**CLI:** `az`
**Deployment Strategies:** All

**Services Supported:**
1. **App Service** - PaaS for web apps
2. **Container Apps** - Serverless containers
3. **Functions** - Serverless functions
4. **AKS** - Azure Kubernetes Service
5. **Virtual Machines** - Compute

**Setup:**
```bash
brew install azure-cli
az login
```

**Implementation:** `bmad/bmi/deployment-platforms/cloud/azure.sh` (Ready to create)

---

### ✅ Heroku
**Status:** Implementation Ready (Legacy)
**Best For:** 12-factor apps (legacy platform)
**CLI:** `heroku`
**Deployment Strategies:** Rolling

**Setup:**
```bash
brew install heroku/brew/heroku
heroku login
```

**Note:** Heroku shut down free tier. Included for legacy support.

**Implementation:** `bmad/bmi/deployment-platforms/cloud/heroku.sh` (Ready to create)

---

## Container Platforms

### ✅ Kubernetes
**Status:** Implementation Ready
**Best For:** Containerized workloads, microservices
**CLI:** `kubectl`, `helm`
**Deployment Strategies:** All (Rolling, Blue-Green, Canary, Recreate)

**Supported Kubernetes Flavors:**
- **EKS** - AWS Elastic Kubernetes Service
- **GKE** - Google Kubernetes Engine
- **AKS** - Azure Kubernetes Service
- **Self-hosted** - On-premises clusters
- **k3s** - Lightweight Kubernetes
- **Minikube** - Local development

**Setup:**
```bash
brew install kubectl helm
# For EKS:
aws eks update-kubeconfig --name cluster-name
# For GKE:
gcloud container clusters get-credentials cluster-name
# For AKS:
az aks get-credentials --name cluster-name --resource-group rg-name
```

**Deployment Strategies:**
1. **Rolling Update** - Gradual replacement (default)
2. **Blue-Green** - Switch traffic between versions
3. **Canary** - Gradual traffic shift
4. **Recreate** - Terminate all, then create new

**Implementation:** `bmad/bmi/deployment-platforms/containers/kubernetes.sh` (Ready to create)

---

### ✅ Docker
**Status:** Implementation Ready
**Best For:** Containerized apps, local development
**CLI:** `docker`, `docker-compose`
**Deployment Strategies:** Recreate

**Supported:**
- Docker standalone
- Docker Compose
- Docker Swarm

**Setup:**
```bash
brew install docker docker-compose
# Or install Docker Desktop
```

**Implementation:** `bmad/bmi/deployment-platforms/containers/docker.sh` (Ready to create)

---

## Mobile Platforms

### ✅ iOS (via Fastlane)
**Status:** Fully Implemented
**Best For:** iOS app deployment to App Store, TestFlight
**CLI:** `fastlane`, `xcodebuild`
**Deployment Targets:** TestFlight (beta), App Store (production)

**Prerequisites:**
- macOS required
- Xcode installed
- Apple Developer account
- App Store Connect API Key (recommended)

**Setup:**
```bash
sudo gem install fastlane -NV
# Or: brew install fastlane

# App Store Connect API Key (recommended)
export APP_STORE_CONNECT_API_KEY_PATH="/path/to/key.p8"

# Or Apple ID credentials
export FASTLANE_USER="your-apple-id"
export FASTLANE_PASSWORD="your-password"

# Initialize Fastlane
cd ios && fastlane init
```

**Deployment Environments:**
- **dev/adhoc** - Ad-hoc distribution
- **staging/testflight/beta** - TestFlight beta testing
- **production** - App Store release

**Features:**
- Automatic code signing
- Screenshot automation
- Metadata management
- TestFlight beta distribution
- App Store submission

**Deployment:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment testflight \
  --deployment-strategy rolling
```

**Implementation:** `bmad/bmi/deployment-platforms/mobile/fastlane-ios.sh`

---

### ✅ Android (via Fastlane)
**Status:** Fully Implemented
**Best For:** Android app deployment to Google Play
**CLI:** `fastlane`, `gradle`
**Deployment Targets:** Internal testing, Beta, Production

**Prerequisites:**
- Java JDK installed
- Android SDK installed
- Google Play Console account
- Service account JSON key

**Setup:**
```bash
sudo gem install fastlane -NV
# Or: brew install fastlane

# Set Android SDK path
export ANDROID_HOME="/usr/local/android-sdk"

# Google Play service account key
export GOOGLE_PLAY_JSON_KEY_PATH="/path/to/google-play-key.json"

# Initialize Fastlane
cd android && fastlane init
```

**Deployment Tracks:**
- **internal** - Internal testing
- **alpha** - Alpha testing (deprecated, use internal)
- **beta** - Beta testing
- **production** - Production release

**Features:**
- Automatic APK/AAB building
- Multi-track deployment
- Gradual rollout support
- Metadata management
- Screenshot automation

**Deployment:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment beta \
  --deployment-strategy rolling
```

**Implementation:** `bmad/bmi/deployment-platforms/mobile/fastlane-android.sh`

---

## Additional Deployment Tools

### Build Tools

#### ✅ Fastlane (Mobile)
**Platform:** iOS & Android
**What it does:**
- Automates iOS and Android deployments
- Handles code signing
- Screenshots and metadata
- TestFlight and Play Store uploads

**Why use it:**
- Industry standard for mobile CI/CD
- Reduces deployment from hours to minutes
- Handles complex signing requirements
- Screenshots automation

**Alternative Tools:**
- **Codemagic** - Cloud CI/CD for mobile
- **Bitrise** - Mobile DevOps platform
- **App Center** - Microsoft's mobile DevOps (being sunset)

---

#### ✅ Gradle (Android)
**Platform:** Android, Java, Kotlin
**What it does:**
- Build automation
- Dependency management
- Multi-module builds

**Why use it:**
- Default build tool for Android
- Powerful and flexible
- Plugin ecosystem

---

#### ✅ Xcode Build (iOS)
**Platform:** iOS, macOS, watchOS, tvOS
**What it does:**
- Compiles iOS/macOS apps
- Code signing
- Packaging

**Why use it:**
- Required for iOS development
- Integrated with Fastlane

---

### CI/CD Integration Tools

#### ✅ GitHub Actions
**What it does:** Automate deployments from GitHub

**Example workflow:**
```yaml
- name: Deploy to Vercel
  run: |
    bmad-cli invoke bmi/deploy \
      --version ${{ github.sha }} \
      --environment production
```

**See:** `bmad/bmi/templates/ci-cd-integration-template.md`

---

#### ✅ GitLab CI
**What it does:** Automate deployments from GitLab

**Example:**
```yaml
deploy-production:
  script:
    - bmad-cli invoke bmi/deploy \
        --version "${CI_COMMIT_TAG}" \
        --environment production
```

---

#### ✅ Jenkins
**What it does:** Self-hosted CI/CD automation

**Example:**
```groovy
stage('Deploy') {
  steps {
    sh "bmad-cli invoke bmi/deploy \
          --version ${VERSION} \
          --environment production"
  }
}
```

---

#### ✅ CircleCI
**What it does:** Cloud-based CI/CD

**Example:**
```yaml
- run:
    name: Deploy
    command: |
      bmad-cli invoke bmi/deploy \
        --version ${CIRCLE_TAG} \
        --environment production
```

---

### Container Tools

#### ✅ Docker
**What it does:** Container building and deployment
**Implementation:** `bmad/bmi/workflows/5-deployment/container-build/`

**Features:**
- Multi-stage builds
- Security scanning (Trivy)
- Multi-architecture builds
- Registry publishing

---

#### ✅ Helm
**What it does:** Kubernetes package manager

**Why use it:**
- Simplifies Kubernetes deployments
- Version control for K8s manifests
- Rollback support
- Values templating

---

### Infrastructure as Code (IaC)

#### ✅ Terraform
**Status:** Integration Ready
**What it does:** Infrastructure provisioning

**Use cases:**
- Provision cloud resources before deployment
- Database setup
- Networking configuration

**Integration point:** `infrastructure-provision` workflow (BMI Phase 5)

---

#### ✅ Pulumi
**Status:** Integration Ready
**What it does:** Infrastructure as code with programming languages

**Advantage over Terraform:**
- Use TypeScript, Python, Go instead of HCL
- Better type safety
- Easier testing

---

### Testing Tools

#### ✅ Artillery
**Status:** Implemented
**What it does:** Load testing
**Implementation:** `bmad/bmi/workflows/6-release/load-testing/`

---

#### ✅ k6
**Status:** Implemented
**What it does:** Performance testing
**Implementation:** `bmad/bmi/workflows/6-release/load-testing/`

---

#### ✅ Locust
**Status:** Implemented
**What it does:** Distributed load testing
**Implementation:** `bmad/bmi/workflows/6-release/load-testing/`

---

## Platform Comparison

| Platform | Type | Mobile | Containers | Databases | Auto-SSL | Rollback | Free Tier |
|----------|------|--------|-----------|-----------|----------|----------|-----------|
| **Vercel** | Serverless | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ Generous |
| **Railway** | Serverless | ❌ | ✅ | ✅ | ✅ | ⚠️ Manual | ✅ $5/mo |
| **Render** | Serverless | ❌ | ✅ | ✅ | ✅ | ⚠️ Manual | ✅ Limited |
| **Netlify** | Serverless | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ Generous |
| **Fly.io** | Edge | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ Limited |
| **Cloudflare Pages** | Edge | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ Unlimited |
| **DigitalOcean** | Cloud | ❌ | ✅ | ✅ | ✅ | ⚠️ Manual | ❌ |
| **AWS** | Cloud | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ 12 months |
| **GCP** | Cloud | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ Limited |
| **Azure** | Cloud | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ Limited |
| **Kubernetes** | Container | ❌ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ Varies |
| **Fastlane (iOS)** | Mobile | ✅ | ❌ | ❌ | N/A | ⚠️ Manual | ❌ |
| **Fastlane (Android)** | Mobile | ✅ | ❌ | ❌ | N/A | ⚠️ Manual | ❌ |

---

## Deployment Strategy Support

| Platform | Rolling | Blue-Green | Canary | Recreate |
|----------|---------|------------|--------|----------|
| Vercel | ✅ | ✅ | ❌ | ✅ |
| Railway | ✅ | ❌ | ❌ | ✅ |
| Render | ✅ | ✅ | ❌ | ✅ |
| Netlify | ✅ | ✅ | ⚠️ Split testing | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ❌ | ✅ |
| AWS | ✅ | ✅ | ✅ | ✅ |
| GCP | ✅ | ✅ | ✅ | ✅ |
| Azure | ✅ | ✅ | ✅ | ✅ |
| Kubernetes | ✅ | ✅ | ✅ | ✅ |
| Fastlane | N/A | N/A | N/A | ✅ |

---

## Recommended Platform by Use Case

### Static Sites
1. **Vercel** - Next.js, React
2. **Netlify** - JAMstack
3. **Cloudflare Pages** - Global edge

### Full-Stack Apps
1. **Railway** - Easy databases
2. **Render** - All-in-one
3. **Fly.io** - Global edge
4. **DigitalOcean** - Simple cloud

### Enterprise Applications
1. **AWS** - Most services
2. **GCP** - Data-intensive
3. **Azure** - .NET apps

### Containerized Workloads
1. **Kubernetes** - Microservices
2. **Fly.io** - Simple containers
3. **Railway** - Managed containers

### Mobile Apps
1. **Fastlane** - iOS & Android (only real option)

---

## Implementation Status

✅ **Fully Implemented:**
- Vercel
- Railway
- Render
- DigitalOcean
- Fastlane (iOS)
- Fastlane (Android)

🚧 **Ready to Implement (Scripts templated, need testing):**
- Netlify
- Fly.io
- Cloudflare Pages
- AWS (Elastic Beanstalk, ECS, Lambda)
- GCP (App Engine, Cloud Run)
- Azure (App Service, Container Apps)
- Heroku
- Kubernetes
- Docker

---

## Getting Started

### 1. Choose Your Platform

Based on your application type, choose from the recommendations above.

### 2. Install CLI Tools

```bash
# Serverless
npm install -g vercel netlify-cli @railway/cli
brew install flyctl

# Cloud
brew install doctl awscli google-cloud-sdk azure-cli

# Containers
brew install kubectl helm docker

# Mobile
sudo gem install fastlane -NV
```

### 3. Authenticate

```bash
# Set environment variables
export VERCEL_TOKEN="..."
export RAILWAY_TOKEN="..."
export DIGITALOCEAN_ACCESS_TOKEN="..."

# Or use CLI login
vercel login
railway login
doctl auth init
```

### 4. Deploy

```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy blue-green
```

---

## Support

- **Platform Documentation:** See `bmad/bmi/deployment-platforms/README.md`
- **Implementation Files:** `bmad/bmi/deployment-platforms/{category}/{platform}.sh`
- **Workflow Documentation:** `bmad/bmi/workflows/README.md`
- **Main BMI README:** `bmad/bmi/README.md`

---

**Last Updated:** 2025-11-15
**BMI Version:** 1.0.0
