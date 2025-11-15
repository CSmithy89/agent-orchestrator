# BMI Platform Configuration Examples

This directory contains example configuration files for various deployment platforms supported by BMI.

---

## Quick Start

1. **Choose your platform** from the list below
2. **Copy the example config** to your project root
3. **Customize** with your specific settings
4. **Deploy** using BMI:
   ```bash
   bmad-cli invoke bmi/deploy \
     --version "1.0.0" \
     --environment production
   ```

---

## Platform Configurations

### Serverless Platforms

#### Vercel (Next.js, React, Static)
**File:** `vercel.json`

**Copy to your project:**
```bash
cp bmad/bmi/examples/configs/vercel.json vercel.json
```

**Customize:**
- Update `name` to your app name
- Configure `env` variables
- Adjust `regions` for deployment locations
- Set `functions` timeout and memory limits
- Configure `routes`, `redirects`, `rewrites` as needed

**Deploy:**
```bash
bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
```

**Documentation:** https://vercel.com/docs/project-configuration

---

#### Railway (Full-Stack Apps)
**File:** `railway.json`

**Copy to your project:**
```bash
cp bmad/bmi/examples/configs/railway.json railway.json
```

**Customize:**
- Update `build.buildCommand` for your framework
- Set `deploy.startCommand` for your server
- Configure `healthcheckPath`
- Add environment-specific variables

**Deploy:**
```bash
bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
```

**Documentation:** https://docs.railway.app/deploy/config-as-code

---

#### Render (Web Services, Static Sites, Databases)
**File:** `render.yaml`

**Copy to your project:**
```bash
cp bmad/bmi/examples/configs/render.yaml render.yaml
```

**Customize:**
- Update service `name` and `branch`
- Configure `buildCommand` and `startCommand`
- Set up `databases` as needed
- Add `cronjobs` for scheduled tasks
- Configure `envVars` from databases or other services

**Deploy:**
```bash
bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
```

**Documentation:** https://render.com/docs/infrastructure-as-code

---

#### Netlify (JAMstack, Static Sites, Serverless Functions)
**File:** `netlify.toml`

**Copy to your project:**
```bash
cp bmad/bmi/examples/configs/netlify.toml netlify.toml
```

**Customize:**
- Update `build.command` and `build.publish`
- Configure context-specific builds (production, preview, staging)
- Set up `redirects` and `rewrites`
- Add `headers` for security
- Configure `functions` directory
- Add `plugins` as needed
- Set up `split` for A/B testing

**Deploy:**
```bash
bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
```

**Documentation:** https://docs.netlify.com/configure-builds/file-based-configuration/

---

#### Fly.io (Global Edge, Containers)
**File:** `fly.toml`

**Copy to your project:**
```bash
cp bmad/bmi/examples/configs/fly.toml fly.toml
```

**Customize:**
- Update `app` name and `primary_region`
- Configure `build` (Dockerfile or buildpacks)
- Set up `services` with health checks
- Configure `vm` size (CPU, memory)
- Add multiple `regions` for global deployment
- Set up `mounts` for persistent storage
- Configure `processes` for multi-process apps

**Deploy:**
```bash
bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
```

**Documentation:** https://fly.io/docs/reference/configuration/

---

### Cloud Platforms

#### DigitalOcean App Platform
**File:** `.do/app.yaml`

**Copy to your project:**
```bash
mkdir -p .do
cp bmad/bmi/examples/configs/.do/app.yaml .do/app.yaml
```

**Customize:**
- Update `name` and `region`
- Configure `services` with your GitHub repo
- Set `build_command` and `run_command`
- Add `static_sites` for frontend apps
- Configure `databases` (PostgreSQL, Redis)
- Set up `jobs` for cron tasks or pre/post-deploy hooks
- Add `domains` for custom domains

**Deploy:**
```bash
bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
```

**Documentation:** https://docs.digitalocean.com/products/app-platform/reference/app-spec/

---

### Container Platforms

#### Kubernetes (Production-Grade Orchestration)
**File:** `kubernetes-deployment.yaml`

**Copy to your project:**
```bash
mkdir -p k8s
cp bmad/bmi/examples/configs/kubernetes-deployment.yaml k8s/deployment.yaml
```

**Customize:**
- Update `namespace`, `app` labels
- Configure `image` registry and tag
- Set `replicas` count
- Adjust `resources` (CPU, memory limits/requests)
- Configure `livenessProbe` and `readinessProbe` paths
- Set environment variables in `ConfigMap` and `Secret`
- Update `Service` type (ClusterIP, LoadBalancer, NodePort)
- Configure `Ingress` for external access
- Adjust `HorizontalPodAutoscaler` min/max replicas
- Set up `PodDisruptionBudget` for high availability

**Deploy:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy rolling
```

**Supported Strategies:**
- `rolling` - Gradual replacement (default)
- `blue-green` - Environment switching
- `canary` - Progressive traffic shifting
- `recreate` - Complete replacement (downtime)

**Documentation:** https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

---

### Mobile Platforms

#### iOS (Fastlane)
**File:** `ios/fastlane/Fastfile`

**Setup:**
```bash
cd ios
fastlane init

# Replace generated Fastfile with example
cp ../bmad/bmi/examples/configs/ios/fastlane/Fastfile fastlane/Fastfile
```

**Customize:**
- Update `xcodeproj` name
- Set `app_identifier` (bundle ID)
- Configure `match` for code signing
- Update `slack` webhook (optional)
- Adjust `capture_screenshots` devices as needed

**Available Lanes:**
```bash
# Ad-hoc distribution
fastlane adhoc

# TestFlight beta
fastlane beta

# App Store release
fastlane release

# Generate screenshots
fastlane screenshots
```

**Deploy with BMI:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.5" \
  --environment testflight
```

**Documentation:** https://docs.fastlane.tools/

---

#### Android (Fastlane)
**File:** `android/fastlane/Fastfile`

**Setup:**
```bash
cd android
fastlane init

# Replace generated Fastfile with example
cp ../bmad/bmi/examples/configs/android/fastlane/Fastfile fastlane/Fastfile
```

**Customize:**
- Update `app_package_name`
- Set `GOOGLE_PLAY_JSON_KEY_PATH` environment variable
- Adjust rollout percentages as needed
- Configure `slack` webhook (optional)

**Available Lanes:**
```bash
# Build APK/AAB
fastlane build_aab

# Internal testing
fastlane internal

# Beta track (10% rollout)
fastlane beta

# Production (20% rollout)
fastlane production

# Increase rollout
fastlane increase_rollout percentage:0.5

# Complete rollout (100%)
fastlane complete_rollout
```

**Deploy with BMI:**
```bash
bmad-cli invoke bmi/deploy \
  --version "1.0.5" \
  --environment beta
```

**Documentation:** https://docs.fastlane.tools/

---

## Environment Variables

### Serverless Platforms

**Vercel:**
```bash
vercel env add DATABASE_URL --environment production
vercel env add API_KEY --environment production
```

**Railway:**
```bash
railway variables set DATABASE_URL=postgresql://...
railway variables set API_KEY=xxx
```

**Netlify:**
```bash
netlify env:set DATABASE_URL postgresql://...
netlify env:set API_KEY xxx
```

**Fly.io:**
```bash
fly secrets set DATABASE_URL=postgresql://...
fly secrets set API_KEY=xxx
```

### Mobile Platforms

**iOS:**
```bash
# App Store Connect API Key (recommended)
export APP_STORE_CONNECT_API_KEY_ID="your-key-id"
export APP_STORE_CONNECT_API_ISSUER_ID="your-issuer-id"
export APP_STORE_CONNECT_API_KEY_PATH="/path/to/key.p8"
```

**Android:**
```bash
# Google Play service account
export GOOGLE_PLAY_JSON_KEY_PATH="/path/to/key.json"

# Keystore for signing
export MYAPP_RELEASE_STORE_FILE="my-release-key.keystore"
export MYAPP_RELEASE_STORE_PASSWORD="***"
export MYAPP_RELEASE_KEY_ALIAS="my-key-alias"
export MYAPP_RELEASE_KEY_PASSWORD="***"
```

---

## Platform Comparison

| Platform | Best For | Complexity | Cost (Starter) |
|----------|----------|------------|----------------|
| **Vercel** | Next.js, React | Low | Free tier, $20/mo Pro |
| **Railway** | Full-stack with DB | Low | $5/mo |
| **Render** | Web services + DB | Low-Medium | Free tier, $7/mo |
| **Netlify** | JAMstack, Static | Low | Free tier, $19/mo Pro |
| **Fly.io** | Global edge apps | Medium | 3 VMs free, $3-10/mo |
| **DigitalOcean** | Simple cloud apps | Medium | $4-12/mo |
| **Kubernetes** | Production microservices | High | $100-300/mo (cluster + nodes) |
| **iOS (Fastlane)** | iOS apps | Medium | $99/year (Apple Developer) |
| **Android (Fastlane)** | Android apps | Medium | $25 one-time (Play Console) |

---

## Deployment Strategies by Platform

| Platform | Rolling | Blue-Green | Canary | Recreate |
|----------|---------|------------|--------|----------|
| Vercel | ✅ | ✅ | ❌ | ✅ |
| Railway | ✅ | ❌ | ❌ | ✅ |
| Render | ✅ | ✅ | ❌ | ✅ |
| Netlify | ✅ | ✅ | ⚠️ Split | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ❌ | ✅ |
| Kubernetes | ✅ | ✅ | ✅ | ✅ |
| iOS/Android | ✅ | N/A | N/A | N/A |

---

## Next Steps

1. **Choose your platform** from the examples above
2. **Copy the config file** to your project
3. **Customize** with your settings
4. **Test locally** if possible
5. **Deploy to staging** first:
   ```bash
   bmad-cli invoke bmi/deploy --version "1.0.0" --environment staging
   ```
6. **Deploy to production** after validation:
   ```bash
   bmad-cli invoke bmi/deploy --version "1.0.0" --environment production
   ```

---

## Additional Resources

- **Main BMI Documentation:** [../../README.md](../../README.md)
- **Platform Support Matrix:** [../../PLATFORM-SUPPORT.md](../../PLATFORM-SUPPORT.md)
- **Deployment Tools Guide:** [../../DEPLOYMENT-TOOLS.md](../../DEPLOYMENT-TOOLS.md)
- **Full-Stack Example:** [../full-stack/railway-nextjs-postgres.md](../full-stack/railway-nextjs-postgres.md)
- **Mobile Example:** [../mobile/react-native-app-deployment.md](../mobile/react-native-app-deployment.md)

---

**Questions?** Check the main BMI documentation or create an issue in the repository.
