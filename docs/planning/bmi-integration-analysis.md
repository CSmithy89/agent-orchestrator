# BMI Module - Integration Points & Platform Analysis

**Date:** 2025-11-13
**Purpose:** Deep dive into BMM/TEA integration points and expanded platform support

---

## 🔍 Critical Discovery: Where BMM Ends

### BMM orchestrate-story Final Steps

**Step 8: Deploy to Remote** (FINAL STEP)
```bash
git push origin main
```
**Report**: "✅ Step 8: Main branch pushed to origin/main - Story deployed!"

### ⚠️ **The Gap: "Deployed" = Git Push Only**

**What BMM calls "deployment":**
- ✅ Code merged to main branch
- ✅ Pushed to git remote (GitHub/GitLab)
- ❌ **NOT deployed to any runtime environment**
- ❌ **NOT running in dev/staging/production**

**The Critical Missing Piece:**
> orchestrate-story ends with code in git. There is NO actual deployment to running environments.

---

## 🎯 BMI Handoff Points

### Handoff Point 1: After Story Completion

```
BMM: orchestrate-story (Steps 0-8)
  ├─ Step 3: dev-story (implementation + tests)
  ├─ Step 4: code-review (approval)
  ├─ Step 7: Merge to main
  └─ Step 8: git push origin main ← BMM ENDS HERE
       ↓
BMI: deployment-workflow ← BMI STARTS HERE
  ├─ Deploy to dev environment
  ├─ Run smoke tests
  ├─ Deploy to staging (if tests pass)
  └─ Ready for production release
```

### Handoff Point 2: After Epic Completion

```
BMM: retrospective (epic complete)
  └─ Epic marked complete in sprint-status.yaml ← BMM ENDS HERE
       ↓
BMI: release-workflow ← BMI STARTS HERE
  ├─ Generate changelog from epic stories
  ├─ Bump version (epic = minor version)
  ├─ Create release notes
  ├─ Deploy to production
  └─ Announce release
```

### Handoff Point 3: CI/CD Pipeline Integration

```
TEA: *ci workflow (testarch/ci)
  ├─ Scaffolds CI/CD pipeline config
  ├─ Configures test execution
  ├─ Sets up quality gates
  └─ Generates .github/workflows/test.yml ← TEA ENDS HERE
       ↓
BMI: ci-cd-enhancement workflow ← BMI EXTENDS HERE
  ├─ Add deployment jobs to pipeline
  ├─ Configure environment secrets
  ├─ Set up deployment gates
  ├─ Add performance testing
  └─ Configure auto-deployment (optional)
```

**Key Insight:** TEA builds CI/CD for TESTING, BMI extends it for DEPLOYMENT.

---

## 🧪 TEA (Murat) Integration Requirements

### What TEA Provides

**testarch/ci workflow:**
- ✅ CI/CD pipeline scaffolding (GitHub Actions, GitLab CI, etc.)
- ✅ Test execution configuration
- ✅ Parallel test sharding
- ✅ Flaky test burn-in detection
- ✅ Test artifact collection
- ✅ Quality gate configuration

**Template Files:**
- `github-actions-template.yaml` - GitHub Actions config
- `gitlab-ci-template.yaml` - GitLab CI config

### What BMI Must Add

**Deployment Extension:**
- ❌ Deployment jobs (after tests pass)
- ❌ Environment-specific configurations
- ❌ Secrets management for cloud providers
- ❌ Deployment approval gates
- ❌ Rollback mechanisms
- ❌ Performance testing in pipeline
- ❌ Production deployment automation

### Integration Strategy

**Approach 1: Extend TEA Templates**
```yaml
# .github/workflows/test.yml (from TEA)
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test

# BMI extends with:
  deploy-dev:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dev
        run: npm run deploy:dev

  deploy-staging:
    needs: deploy-dev
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: npm run deploy:staging
```

**Approach 2: Separate Deployment Pipeline**
```
.github/workflows/
├── test.yml          # From TEA (testing only)
└── deploy.yml        # From BMI (deployment only)
                      # Triggered after test.yml success
```

**Recommendation:** Use Approach 1 (extend TEA templates) for unified pipeline.

---

## 🌐 Expanded Platform Support

### Current Coverage (Original Analysis)
- ✅ AWS (EC2, ECS, Lambda, Elastic Beanstalk)
- ✅ GCP (Compute Engine, Cloud Run, App Engine)
- ✅ Azure (VMs, Container Instances, App Service)
- ✅ Kubernetes (self-managed clusters)

### Missing Platforms (Identified)

#### **Serverless/PaaS Platforms** 🚀

**1. Vercel** (Frontend/Next.js/Static)
- **CLI:** `vercel deploy`
- **Use Cases:** Next.js, React, static sites
- **Features:** Preview deployments, edge functions, automatic SSL
- **Integration:** `vercel.json` configuration
- **Pricing:** Free tier generous, scales with usage

**2. Railway** (Full-stack/Backend)
- **CLI:** `railway up`
- **Use Cases:** Node.js, Python, Go, databases
- **Features:** Auto-deploy from git, environment management
- **Integration:** `railway.json` or auto-detect
- **Pricing:** $5/month starter, usage-based

**3. Render** (Full-stack)
- **CLI:** `render deploy`
- **Use Cases:** Web services, static sites, databases, cron jobs
- **Features:** Auto-deploy, preview environments, managed databases
- **Integration:** `render.yaml` (infrastructure as code)
- **Pricing:** Free tier available, predictable pricing

**4. Netlify** (Frontend/JAMstack)
- **CLI:** `netlify deploy`
- **Use Cases:** Static sites, serverless functions, forms
- **Features:** Deploy previews, form handling, identity
- **Integration:** `netlify.toml` configuration
- **Pricing:** Free tier, pro features available

**5. Fly.io** (Full-stack/Edge)
- **CLI:** `flyctl deploy`
- **Use Cases:** Global edge deployment, full-stack apps
- **Features:** Multi-region, Postgres, edge networking
- **Integration:** `fly.toml` configuration
- **Pricing:** Pay-as-you-go, free allowance

**6. Heroku** (PaaS Classic)
- **CLI:** `heroku deploy`
- **Use Cases:** Full-stack apps, add-ons ecosystem
- **Features:** Buildpacks, pipelines, review apps
- **Integration:** `Procfile`, `app.json`
- **Pricing:** Hobby tier $7/month

#### **Container/VPS Platforms** 🐳

**7. DigitalOcean** (VPS + Managed Services)
- **CLI:** `doctl` (DigitalOcean CLI)
- **Services:**
  - **Droplets** (VPS): `doctl compute droplet create`
  - **App Platform** (PaaS): `doctl apps create`
  - **Kubernetes**: `doctl kubernetes cluster create`
  - **Spaces** (S3-compatible): `doctl spaces create`
- **Use Cases:** Full control VPS, managed Kubernetes, app platform
- **Pricing:** $4/month droplets, competitive managed services

**8. Linode (Akamai)**
- **CLI:** `linode-cli`
- **Services:** VPS, Kubernetes, Object Storage
- **Pricing:** $5/month VPS, transparent pricing

**9. Hetzner Cloud**
- **CLI:** `hcloud`
- **Services:** VPS, load balancers, volumes
- **Use Cases:** Cost-effective European hosting
- **Pricing:** €3.79/month VPS (best price/performance)

#### **Specialized Platforms** ⚡

**10. Cloudflare Pages** (Edge/Static)
- **CLI:** `wrangler pages deploy`
- **Use Cases:** Static sites, serverless (Workers)
- **Features:** Global edge network, analytics
- **Pricing:** Generous free tier

**11. Supabase** (Backend-as-a-Service)
- **CLI:** `supabase deploy`
- **Use Cases:** Postgres database, auth, storage, edge functions
- **Features:** Real-time subscriptions, auto-generated APIs
- **Pricing:** Free tier, usage-based

**12. AWS Amplify** (Full-stack Serverless)
- **CLI:** `amplify publish`
- **Use Cases:** React/Next.js + serverless backend
- **Features:** CI/CD, auth, API, hosting integrated
- **Pricing:** AWS pricing model

---

## 🛠️ Deployment CLI Mapping

### Platform-Specific Commands

#### Serverless/PaaS Platforms

```bash
# Vercel
vercel --prod                           # Deploy to production
vercel --prebuilt                       # Deploy prebuilt output
vercel env pull .env.local              # Pull environment variables
vercel domains add example.com          # Add custom domain

# Railway
railway up                              # Deploy current directory
railway run npm start                   # Run command in Railway environment
railway variables set KEY=value         # Set environment variable
railway service                         # Manage services

# Render
render deploy --service=web             # Deploy specific service
render blueprints deploy render.yaml    # Deploy infrastructure as code
render env set KEY=value                # Set environment variable

# Netlify
netlify deploy --prod                   # Deploy to production
netlify deploy --build                  # Build and deploy
netlify env:set KEY value               # Set environment variable
netlify domains:create example.com      # Add custom domain

# Fly.io
flyctl deploy                           # Deploy application
flyctl scale count 3                    # Scale to 3 instances
flyctl regions add iad                  # Add region
flyctl secrets set KEY=value            # Set secrets

# Heroku
git push heroku main                    # Deploy via git (traditional)
heroku releases:rollback v123           # Rollback to version
heroku config:set KEY=value             # Set environment variable
heroku ps:scale web=3                   # Scale dynos
```

#### Container/VPS Platforms

```bash
# DigitalOcean App Platform
doctl apps create --spec app.yaml       # Create app from spec
doctl apps update APP_ID --spec app.yaml # Update app
doctl apps deploy APP_ID                # Trigger deployment

# DigitalOcean Droplets
doctl compute droplet create NAME \
  --image ubuntu-22-04-x64 \
  --size s-1vcpu-1gb \
  --region nyc3 \
  --ssh-keys FINGERPRINT

# Docker Deployment (Generic)
docker build -t app:latest .
docker push registry.example.com/app:latest
docker run -d -p 80:3000 app:latest

# Kubernetes (Generic)
kubectl apply -f deployment.yaml
kubectl rollout status deployment/app
kubectl set image deployment/app app=app:v2
kubectl rollout undo deployment/app
```

#### Cloud Provider CLIs

```bash
# AWS CLI
aws s3 sync ./dist s3://bucket-name --delete
aws ecs update-service --cluster prod --service api --force-new-deployment
aws lambda update-function-code --function-name api --zip-file fileb://function.zip

# GCP gcloud
gcloud app deploy                       # App Engine
gcloud run deploy SERVICE --image IMAGE # Cloud Run
gcloud compute instances create NAME    # Compute Engine

# Azure CLI
az webapp deployment source config-zip  # Deploy ZIP
az containerapp update                   # Update container app
az vm create                            # Create VM
```

---

## 🔧 BMI Deployment Workflow Platform Support Matrix

| Platform | Deployment Type | CLI Tool | Config File | Auto-Deploy | Rollback | Preview Envs |
|----------|----------------|----------|-------------|-------------|----------|--------------|
| **Vercel** | Static/SSR | `vercel` | `vercel.json` | ✅ Git | ✅ Version | ✅ PR Previews |
| **Railway** | Container | `railway` | `railway.json` | ✅ Git | ✅ Redeploy | ✅ PR Envs |
| **Render** | Container/Static | `render` | `render.yaml` | ✅ Git | ✅ Version | ✅ PR Previews |
| **Netlify** | Static/Functions | `netlify` | `netlify.toml` | ✅ Git | ✅ Version | ✅ Deploy Previews |
| **Fly.io** | Container | `flyctl` | `fly.toml` | ✅ Git | ✅ Version | ❌ Manual |
| **Heroku** | Buildpack | `heroku` | `Procfile` | ✅ Git | ✅ Rollback | ✅ Review Apps |
| **DigitalOcean** | VPS/Container | `doctl` | `app.yaml` | ✅ Git | ❌ Manual | ❌ Manual |
| **AWS** | Various | `aws` | CloudFormation | ⚠️ Manual | ✅ Blue-Green | ⚠️ Manual |
| **GCP** | Various | `gcloud` | Config files | ⚠️ Manual | ✅ Versions | ⚠️ Manual |
| **Azure** | Various | `az` | ARM/Bicep | ⚠️ Manual | ✅ Slots | ⚠️ Manual |
| **Kubernetes** | Container | `kubectl` | YAML manifests | ⚠️ Manual | ✅ Rollout | ⚠️ Manual |

**Legend:**
- ✅ Native support
- ⚠️ Requires configuration
- ❌ Not supported / Manual only

---

## 📦 Platform Detection Strategy

### Auto-Detection Logic

```javascript
// Platform detection order
function detectDeploymentPlatform(projectRoot) {
  // 1. Check for platform-specific config files
  if (exists('vercel.json')) return 'vercel';
  if (exists('railway.json') || exists('railway.toml')) return 'railway';
  if (exists('render.yaml')) return 'render';
  if (exists('netlify.toml')) return 'netlify';
  if (exists('fly.toml')) return 'fly';
  if (exists('Procfile')) return 'heroku';
  if (exists('.do/app.yaml')) return 'digitalocean';

  // 2. Check for cloud provider configs
  if (exists('amplify.yml')) return 'aws-amplify';
  if (exists('app.yaml') && exists('cloudbuild.yaml')) return 'gcp';
  if (exists('azure-pipelines.yml')) return 'azure';

  // 3. Check package.json scripts
  const pkg = readJSON('package.json');
  if (pkg.scripts?.deploy) {
    if (pkg.scripts.deploy.includes('vercel')) return 'vercel';
    if (pkg.scripts.deploy.includes('railway')) return 'railway';
    // ... etc
  }

  // 4. Check git remote (if all else fails)
  const remote = execSync('git remote get-url origin').toString();
  if (remote.includes('github.com')) return 'suggest-vercel-or-railway';
  if (remote.includes('gitlab.com')) return 'suggest-render';

  // 5. Ask user
  return 'prompt-user';
}
```

---

## 🎯 Diana Agent Platform Expertise

### Updated Agent Requirements

**Diana must support:**

**Tier 1 (High Priority):**
- ✅ Vercel (Next.js, React, static sites)
- ✅ Railway (Full-stack Node.js/Python apps)
- ✅ Render (Full-stack, managed databases)
- ✅ DigitalOcean App Platform (Containerized apps)
- ✅ AWS (EC2, ECS, Lambda, Amplify)
- ✅ Netlify (JAMstack, serverless functions)

**Tier 2 (Medium Priority):**
- ⚠️ Fly.io (Edge deployment)
- ⚠️ Heroku (Legacy apps, migration scenarios)
- ⚠️ GCP (Cloud Run, App Engine)
- ⚠️ Azure (App Service, Container Instances)

**Tier 3 (Lower Priority):**
- ⚠️ Kubernetes (self-managed)
- ⚠️ Linode / Hetzner (VPS)
- ⚠️ Cloudflare Pages/Workers

### Diana's Deployment Workflow Enhancement

**New Step: Platform Selection**

```yaml
# deployment-workflow.yaml
steps:
  0_detect_platform:
    description: "Auto-detect or select deployment platform"
    actions:
      - Scan for platform config files
      - Check package.json scripts
      - Read git remote
      - Prompt user if ambiguous
    outputs:
      - platform: string (vercel|railway|render|...)
      - config_file: string (path to platform config)
      - cli_tool: string (command to execute)

  1_validate_prerequisites:
    description: "Ensure platform CLI and credentials available"
    actions:
      - Check if CLI installed (e.g., `which vercel`)
      - Verify authentication (`vercel whoami`)
      - Validate config file
    halt_if: CLI not installed or not authenticated

  2_prepare_deployment:
    description: "Pre-deployment checks and build"
    actions:
      - Run build command (if needed)
      - Validate environment variables
      - Check deployment limits (quotas)

  3_execute_deployment:
    description: "Platform-specific deployment"
    actions:
      - Execute deployment command
      - Monitor deployment progress
      - Capture deployment URL

  4_verify_deployment:
    description: "Post-deployment validation"
    actions:
      - Run smoke tests on deployed URL
      - Check health endpoints
      - Verify environment variables loaded

  5_report_status:
    description: "Report deployment outcome"
    outputs:
      - deployment_url: string
      - deployment_status: success|failed
      - deployment_logs: string
```

---

## 🧩 TEA + BMI Collaboration Model

### Workflow Handoff

```
Phase 1: TEA Sets Up Testing Infrastructure
  └─ *ci workflow
     ├─ Creates .github/workflows/test.yml
     ├─ Configures test execution
     ├─ Sets up quality gates
     └─ Outputs: CI config file path

Phase 2: BMI Extends with Deployment
  └─ ci-cd-enhancement workflow
     ├─ Reads TEA's CI config
     ├─ Adds deployment jobs
     ├─ Configures environment secrets
     ├─ Sets up deployment approvals
     └─ Outputs: Enhanced CI/CD pipeline

Phase 3: Story Deployment (Automated)
  └─ BMM: orchestrate-story completes
     ├─ Code merged to main
     ├─ CI pipeline triggers (from TEA)
     │  ├─ Tests run
     │  └─ If tests pass → Deployment jobs run (from BMI)
     └─ Auto-deploy to dev/staging
```

### Shared Responsibilities

| Responsibility | TEA (Murat) | BMI (Diana) |
|----------------|-------------|-------------|
| Test execution config | ✅ Owner | ❌ Consumer |
| Quality gates | ✅ Owner | ❌ Consumer |
| Deployment jobs | ❌ N/A | ✅ Owner |
| Environment secrets | ❌ N/A | ✅ Owner |
| Rollback strategy | ❌ N/A | ✅ Owner |
| Performance testing | ⚠️ Test setup | ⚠️ Execution in prod |
| CI pipeline file | ✅ Creates | ⚠️ Extends |

---

## 🚀 Next Steps

1. ✅ **Confirmed BMM Endpoints**
   - orchestrate-story ends at git push
   - No environment deployment exists

2. ✅ **Mapped TEA Integration**
   - TEA builds CI for testing
   - BMI extends CI for deployment

3. ✅ **Expanded Platform Coverage**
   - Added 12 serverless/PaaS platforms
   - Mapped all deployment CLIs
   - Created platform detection strategy

4. ⏭️ **Update BMI Module Structure**
   - Add platform-specific workflow templates
   - Create platform abstraction layer
   - Build CLI wrapper utilities

5. ⏭️ **Create BMI Module**
   - Use create-module workflow
   - Build Diana with multi-platform support
   - Create deployment workflows

---

**Status:** Ready to update main BMI analysis and proceed to module creation ✅
