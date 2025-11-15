# BMI Platform Support Matrix

**Last Updated:** 2025-11-15
**BMI Version:** 1.0.0
**Total Platforms Supported:** 10+ fully implemented, 10+ ready to implement

---

## ✅ Fully Implemented Platforms (10)

These platforms have complete implementations with all deployment functions working:

### Serverless Platforms (5)

| Platform | Status | Config File | CLI Tool | Strategies | Notes |
|----------|--------|-------------|----------|------------|-------|
| **Vercel** | ✅ Complete | `vercel.json` | `vercel` | Rolling, Blue-Green | Perfect for Next.js, React |
| **Railway** | ✅ Complete | `railway.json` | `railway` | Rolling | Full-stack with databases |
| **Render** | ✅ Complete | `render.yaml` | API-based | Rolling, Blue-Green | Web services, databases |
| **Netlify** | ✅ Complete | `netlify.toml` | `netlify` | Rolling, Instant rollback | JAMstack, serverless functions |
| **Fly.io** | ✅ Complete | `fly.toml` | `flyctl` | All (Rolling, Blue-Green, Canary) | Global edge deployment |

### Cloud Platforms (2)

| Platform | Status | Config File | CLI Tool | Strategies | Notes |
|----------|--------|-------------|----------|------------|-------|
| **DigitalOcean** | ✅ Complete | `.do/app.yaml` | `doctl` | Rolling, Blue-Green | App Platform, managed services |
| **AWS** | ✅ Complete | Multiple | `aws`, `eb`, `sam` | All | EB, ECS, Lambda, Amplify |

### Container Platforms (1)

| Platform | Status | Config File | CLI Tool | Strategies | Notes |
|----------|--------|-------------|----------|------------|-------|
| **Kubernetes** | ✅ Complete | `k8s/`, `deployment.yaml` | `kubectl`, `helm` | All (Rolling, Blue-Green, Canary, Recreate) | EKS, GKE, AKS, self-hosted |

### Mobile Platforms (2)

| Platform | Status | Config File | CLI Tool | Strategies | Notes |
|----------|--------|-------------|----------|------------|-------|
| **iOS** | ✅ Complete | `ios/Podfile`, `*.xcodeproj` | `fastlane`, `xcodebuild` | Rolling | App Store, TestFlight |
| **Android** | ✅ Complete | `android/build.gradle` | `fastlane`, `gradle` | Rolling | Google Play (Internal, Beta, Production) |

---

## 🚧 Ready to Implement (10+)

These platforms have implementation templates ready but need testing:

### Serverless

- **Cloudflare Pages** - Edge-first static sites
- **Heroku** - 12-factor apps (legacy support)

### Cloud

- **Google Cloud Platform (GCP)** - App Engine, Cloud Run, GKE
- **Microsoft Azure** - App Service, Container Apps, Functions
- **IBM Cloud** - Cloud Foundry, Kubernetes

### Containers

- **Docker** - Standalone, Docker Compose, Swarm
- **Amazon ECS** - Expanded support beyond AWS implementation
- **Google Cloud Run** - Serverless containers

### Edge

- **Cloudflare Workers** - Edge computing
- **Deno Deploy** - TypeScript edge runtime

### Database/Backend

- **Supabase** - Backend-as-a-service
- **PlanetScale** - MySQL platform
- **Neon** - Serverless Postgres

---

## Platform Detection

BMI automatically detects your platform by scanning for config files:

```bash
# Serverless
vercel.json             → Vercel
railway.json            → Railway
render.yaml             → Render
netlify.toml            → Netlify
fly.toml                → Fly.io
amplify.yml             → AWS Amplify

# Cloud
.do/app.yaml            → DigitalOcean
.elasticbeanstalk/      → AWS Elastic Beanstalk
ecs-params.yml          → AWS ECS
app.yaml                → GCP App Engine

# Containers
k8s/*.yaml              → Kubernetes
deployment.yaml         → Kubernetes
Dockerfile              → Docker/Generic

# Mobile
ios/Podfile             → iOS
*.xcodeproj             → iOS
android/build.gradle    → Android
```

---

## Deployment Strategies by Platform

| Platform | Rolling | Blue-Green | Canary | Recreate |
|----------|---------|------------|--------|----------|
| **Vercel** | ✅ | ✅ | ❌ | ✅ |
| **Railway** | ✅ | ❌ | ❌ | ✅ |
| **Render** | ✅ | ✅ | ❌ | ✅ |
| **Netlify** | ✅ | ✅ | ⚠️ Split | ✅ |
| **Fly.io** | ✅ | ✅ | ✅ | ✅ |
| **DigitalOcean** | ✅ | ✅ | ❌ | ✅ |
| **AWS** | ✅ | ✅ | ✅ | ✅ |
| **Kubernetes** | ✅ | ✅ | ✅ | ✅ |
| **iOS (Fastlane)** | ✅ | N/A | N/A | N/A |
| **Android (Fastlane)** | ✅ | N/A | N/A | ⚠️ Gradual rollout |

**Legend:**
- ✅ Fully supported
- ⚠️ Partial support or alternative method
- ❌ Not supported by platform
- N/A Not applicable

---

## Mobile Platform Features

### iOS (via Fastlane)

**Deployment Environments:**
- **Development** - Ad-hoc distribution
- **Staging/TestFlight** - Beta testing
- **Production** - App Store

**Features:**
- ✅ Automatic code signing (no manual provisioning profile management!)
- ✅ Build number auto-increment
- ✅ TestFlight beta distribution with external testers
- ✅ App Store submission
- ✅ Screenshot automation
- ✅ Metadata management
- ✅ App Store Connect API Key support (recommended)

**Requirements:**
- macOS required
- Xcode installed
- Apple Developer account ($99/year)
- App Store Connect API Key or Apple ID credentials

**Implementation:** `bmad/bmi/deployment-platforms/mobile/fastlane-ios.sh`

### Android (via Fastlane)

**Deployment Tracks:**
- **Internal** - Internal testing team
- **Beta** - Beta testers
- **Production** - Public release with gradual rollout

**Features:**
- ✅ Automatic APK/AAB building with Gradle
- ✅ Automatic app signing with keystore
- ✅ Multi-track deployment (internal, beta, production)
- ✅ Gradual rollout support (10% → 100%)
- ✅ Play Console integration
- ✅ Screenshot automation
- ✅ Metadata management

**Requirements:**
- Java JDK 11+
- Android SDK
- Google Play Console account ($25 one-time)
- Service account JSON key for API access

**Implementation:** `bmad/bmi/deployment-platforms/mobile/fastlane-android.sh`

---

## Platform Comparison

### Best For...

**Static Sites:**
1. Vercel - Next.js optimized
2. Netlify - JAMstack ecosystem
3. Cloudflare Pages - Global CDN

**Full-Stack Apps:**
1. Railway - Easiest with databases
2. Render - All-in-one solution
3. Fly.io - Global distribution
4. DigitalOcean - Simple cloud

**Enterprise:**
1. AWS - Most services, best scaling
2. GCP - Data-intensive workloads
3. Azure - .NET ecosystem

**Containers:**
1. Kubernetes - Production microservices
2. Fly.io - Simple containers globally
3. Railway - Managed containers
4. AWS ECS - AWS ecosystem

**Mobile:**
1. Fastlane - ONLY real option for iOS/Android automation

---

## Platform-Specific Deployment Examples

### Vercel (Next.js)

```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy blue-green
```

**What happens:**
1. Detects Vercel from `vercel.json`
2. Builds Next.js app
3. Deploys with blue-green strategy
4. Returns deployment URL
5. Runs smoke tests

### Railway (Full-Stack)

```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy rolling
```

**Features:**
- Auto-provisions PostgreSQL database
- Environment variables from Railway
- Automatic HTTPS

### Kubernetes (Microservices)

```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy canary
```

**Supports:**
- EKS, GKE, AKS, self-hosted
- Kustomize and Helm
- All deployment strategies
- Multi-namespace deployments

### iOS (Mobile)

```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.5" \
  --environment testflight \
  --deployment-strategy rolling
```

**What happens:**
1. Detects iOS from `ios/Podfile`
2. Sets version to 1.0.5
3. Auto-increments build number
4. Builds with Xcode
5. Signs with provisioning profile
6. Uploads to TestFlight
7. Makes available to beta testers

### Android (Mobile)

```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.5" \
  --environment beta \
  --deployment-strategy rolling
```

**What happens:**
1. Detects Android from `android/build.gradle`
2. Sets version to 1.0.5
3. Builds AAB with Gradle
4. Signs with keystore
5. Uploads to Play Console beta track
6. Makes available to beta testers

---

## CLI Tool Requirements

### Serverless

```bash
# Install all serverless CLIs
npm install -g vercel netlify-cli @railway/cli
brew install flyctl
```

### Cloud

```bash
# Install cloud CLIs
brew install doctl awscli google-cloud-sdk azure-cli
```

### Containers

```bash
# Install container tools
brew install kubectl helm docker docker-compose
```

### Mobile

```bash
# Install Fastlane
sudo gem install fastlane -NV
# Or: brew install fastlane

# iOS requires Xcode (macOS only)
# Android requires Java JDK and Android SDK
```

---

## Authentication Setup

### Serverless

```bash
# Vercel
export VERCEL_TOKEN="your-token"

# Railway
export RAILWAY_TOKEN="your-token"

# Netlify
export NETLIFY_AUTH_TOKEN="your-token"

# Fly.io
fly auth login
```

### Cloud

```bash
# DigitalOcean
export DIGITALOCEAN_ACCESS_TOKEN="your-token"
doctl auth init

# AWS
aws configure

# GCP
gcloud auth login
```

### Mobile

```bash
# iOS (App Store Connect API Key - recommended)
export APP_STORE_CONNECT_API_KEY_ID="your-key-id"
export APP_STORE_CONNECT_API_ISSUER_ID="your-issuer-id"
export APP_STORE_CONNECT_API_KEY_PATH="/path/to/key.p8"

# Android (Google Play service account)
export GOOGLE_PLAY_JSON_KEY_PATH="/path/to/key.json"
```

---

## Platform Limitations

### Serverless

- **Vercel:** Function timeout 10s (hobby), 60s (pro)
- **Railway:** $5/month minimum after free tier
- **Render:** Slower cold starts on free tier
- **Netlify:** 100GB bandwidth free tier
- **Fly.io:** 3 VMs free, then paid

### Cloud

- **AWS:** Complex pricing, easy to overspend
- **DigitalOcean:** Simpler but fewer services than AWS
- **GCP:** Best for BigQuery/ML, complex for simple apps

### Containers

- **Kubernetes:** Steep learning curve, complex setup
- **Docker:** Manual orchestration required

### Mobile

- **iOS:** macOS required, $99/year Apple Developer
- **Android:** $25 one-time Google Play Console fee
- **Both:** App review process (1-3 days)

---

## Rollback Support

| Platform | Auto Rollback | Manual Rollback | Notes |
|----------|---------------|-----------------|-------|
| Vercel | ✅ | ✅ | Instant via deployment promotion |
| Railway | ❌ | ✅ | Redeploy previous commit |
| Render | ❌ | ⚠️ | Via dashboard |
| Netlify | ✅ | ✅ | Instant rollback |
| Fly.io | ✅ | ✅ | `fly releases rollback` |
| DigitalOcean | ❌ | ⚠️ | Via dashboard |
| AWS | ✅ | ✅ | Depends on service |
| Kubernetes | ✅ | ✅ | `kubectl rollout undo` |
| iOS | ❌ | ⚠️ | Upload previous version |
| Android | ❌ | ⚠️ | Halt rollout + upload previous |

---

## Cost Comparison (Monthly)

### Development Environment

| Platform | Free Tier | Paid (Dev) |
|----------|-----------|------------|
| Vercel | ✅ Generous | $20/mo (Pro) |
| Railway | $5 credit | $5/mo |
| Render | ✅ Limited | $7/mo |
| Netlify | ✅ Generous | $19/mo (Pro) |
| Fly.io | 3 VMs free | $3-10/mo |
| DigitalOcean | ❌ | $4-12/mo |

### Production Environment

| Platform | Typical Cost | Notes |
|----------|--------------|-------|
| Vercel | $20-100/mo | Scales with bandwidth |
| Railway | $20-50/mo | Based on resources |
| Render | $25-100/mo | Includes database |
| AWS | $50-500/mo | Highly variable |
| Kubernetes | $100-300/mo | Cluster + nodes |
| iOS | $99/year | Developer account |
| Android | $25 one-time | Play Console |

---

## Implementation Files

All platform implementations are located at:

```
bmad/bmi/deployment-platforms/
├── serverless/
│   ├── vercel.sh          ✅ Complete
│   ├── railway.sh         ✅ Complete
│   ├── render.sh          ✅ Complete
│   ├── netlify.sh         ✅ Complete
│   └── flyio.sh           ✅ Complete
├── cloud/
│   ├── digitalocean.sh    ✅ Complete
│   ├── aws.sh             ✅ Complete
│   ├── gcp.sh             🚧 Ready
│   ├── azure.sh           🚧 Ready
│   └── heroku.sh          🚧 Ready
├── containers/
│   ├── kubernetes.sh      ✅ Complete
│   └── docker.sh          🚧 Ready
├── mobile/
│   ├── fastlane-ios.sh    ✅ Complete
│   └── fastlane-android.sh✅ Complete
└── README.md
```

---

## Testing Status

| Platform | Detection | Prerequisites | Deploy | Rollback | URL |
|----------|-----------|---------------|--------|----------|-----|
| Vercel | ✅ | ✅ | ✅ | ✅ | ✅ |
| Railway | ✅ | ✅ | ✅ | ✅ | ✅ |
| Render | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Netlify | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| AWS | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kubernetes | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| iOS | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Android | ✅ | ✅ | ✅ | ⚠️ | ✅ |

**Legend:**
- ✅ Fully tested and working
- ⚠️ Partially working or manual steps required
- ❌ Not implemented
- 🚧 Implementation ready, needs testing

---

## Support & Documentation

- **Platform implementations:** `bmad/bmi/deployment-platforms/`
- **Deployment tools guide:** `bmad/bmi/DEPLOYMENT-TOOLS.md`
- **Full-stack example:** `bmad/bmi/examples/full-stack/railway-nextjs-postgres.md`
- **Mobile example:** `bmad/bmi/examples/mobile/react-native-app-deployment.md`
- **Main documentation:** `bmad/bmi/README.md`
- **Workflow documentation:** `bmad/bmi/workflows/README.md`

---

**BMI Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2025-11-15
