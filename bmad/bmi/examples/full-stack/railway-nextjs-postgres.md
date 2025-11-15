# Example: Full-Stack Next.js App with PostgreSQL on Railway

This example shows how to deploy a complete Next.js + PostgreSQL application to Railway using BMI.

---

## Application Stack

- **Frontend:** Next.js 14 with React
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Railway managed)
- **Platform:** Railway
- **Environment:** Development → Staging → Production

---

## Project Structure

```
my-nextjs-app/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utilities
│   └── db.ts              # Database connection
├── public/                # Static assets
├── railway.json           # Railway configuration
├── package.json
├── next.config.js
└── .env.example
```

---

## Step 1: Setup Railway Configuration

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Step 2: Setup Database Connection

Create `lib/db.ts`:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default pool;
```

---

## Step 3: Environment Variables

Create `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# Railway (set in Railway dashboard)
# DATABASE_URL - auto-provided by Railway PostgreSQL
# NODE_ENV=production
```

---

## Step 4: Initial Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link project (or create new)
railway link

# Create PostgreSQL database
railway add --database postgresql

# Set environment variables
railway variables set NODE_ENV=production
```

---

## Step 5: Deploy to Development

```bash
# Deploy to dev environment
bmad-cli invoke bmi/deploy \
  --version "dev-$(git rev-parse --short HEAD)" \
  --environment dev \
  --deployment-strategy rolling

# What happens:
# 1. ✅ Detects Railway platform (railway.json)
# 2. ✅ Builds Next.js app
# 3. ✅ Deploys to Railway dev environment
# 4. ✅ Runs smoke tests
# 5. ✅ Updates deployment status
# 6. ✅ Returns deployment URL
```

**Expected Output:**
```
🚀 Deploying to Railway...
Version: dev-a1b2c3d
Environment: dev
Strategy: rolling

✅ Detected platform: railway (confidence: high)
✅ Prerequisites check passed
Building application...
Deploying to Railway dev environment...
✅ Deployment successful
URL: https://my-nextjs-app-dev.up.railway.app

Running smoke tests...
✅ Health check: PASS
✅ API tests: PASS
✅ UI tests: PASS

deployment_url=https://my-nextjs-app-dev.up.railway.app
```

---

## Step 6: Deploy to Staging

```bash
# Deploy to staging
bmad-cli invoke bmi/deploy \
  --version "1.0.0-beta.1" \
  --environment staging \
  --deployment-strategy rolling

# Run load tests on staging
bmad-cli invoke bmi/load-testing \
  --target-url "https://my-nextjs-app-staging.up.railway.app" \
  --load-profile peak \
  --virtual-users 100 \
  --duration 300 \
  --success-criteria "p95<500ms,error_rate<1%"
```

---

## Step 7: Deploy to Production

```bash
# Deploy to production with blue-green strategy (if Railway supports)
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy rolling

# Setup monitoring
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --application-name "my-nextjs-app" \
  --monitoring-categories '["errors","performance","infrastructure"]' \
  --setup-dashboards true \
  --setup-alerts true
```

---

## Step 8: Hotfix Deployment

If production issue detected:

```bash
# Create emergency hotfix
bmad-cli invoke bmi/hotfix \
  --hotfix-description "Fix null pointer in user API" \
  --base-version "1.0.0" \
  --fast-track true \
  --auto-deploy true

# Or rollback to previous version
bmad-cli invoke bmi/rollback \
  --rollback-reason "High error rate" \
  --rollback-target "previous" \
  --environment production
```

---

## CI/CD Integration (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [develop, main]
  pull_request:
    types: [closed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Development
        if: github.ref == 'refs/heads/develop'
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          bmad-cli invoke bmi/deploy \
            --version "dev-${{ github.sha }}" \
            --environment dev \
            --deployment-strategy rolling

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          bmad-cli invoke bmi/deploy \
            --version "prod-${{ github.sha }}" \
            --environment production \
            --deployment-strategy rolling

      - name: Run Load Tests
        if: github.ref == 'refs/heads/main'
        run: |
          bmad-cli invoke bmi/load-testing \
            --target-url "https://my-nextjs-app.up.railway.app" \
            --load-profile baseline \
            --success-criteria "p95<500ms,error_rate<1%"
```

---

## Database Migrations

Handle database migrations before deployment:

```bash
# Add migration script to package.json
{
  "scripts": {
    "migrate": "prisma migrate deploy",
    "postdeploy": "npm run migrate"
  }
}
```

Railway will automatically run `migrate` after deployment.

---

## Monitoring Setup

After deployment, setup monitoring:

```bash
# Install monitoring package
npm install @railway/observability

# Configure in your app
// app/instrumentation.ts
import { registerOTel } from '@railway/observability';

export function register() {
  registerOTel({
    serviceName: 'my-nextjs-app',
    environment: process.env.NODE_ENV
  });
}
```

---

## Environment-Specific Configurations

### Development
- Database: Railway managed PostgreSQL (dev instance)
- Replicas: 1
- Auto-deploy: On every commit to develop

### Staging
- Database: Railway managed PostgreSQL (staging instance)
- Replicas: 2
- Auto-deploy: On merge to main
- Load tests: Required before production

### Production
- Database: Railway managed PostgreSQL (production instance with backups)
- Replicas: 3+
- Auto-deploy: Disabled (manual approval)
- Monitoring: Full observability stack

---

## Cost Optimization

Railway pricing considerations:

```bash
# Development
- App: $5/month (starter plan)
- Database: Included in starter

# Staging
- App: $10/month
- Database: $10/month

# Production
- App: $20/month (pro plan with more resources)
- Database: $25/month (with daily backups)

Total: ~$70/month for full pipeline
```

---

## Troubleshooting

### Deployment fails

```bash
# Check Railway logs
railway logs

# Check deployment status
railway status

# Redeploy
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment production \
  --deployment-strategy rolling
```

### Database connection issues

```bash
# Check DATABASE_URL is set
railway variables

# Test database connection
railway connect postgresql
```

### Slow performance

```bash
# Run performance profiling
bmad-cli invoke bmi/performance-profiling \
  --environment staging \
  --profiling-type cpu \
  --load-pattern peak

# Optimize based on results
# - Add caching (Redis)
# - Optimize database queries
# - Enable Next.js image optimization
```

---

## Summary

This example showed:
- ✅ Full-stack Next.js + PostgreSQL deployment
- ✅ Multi-environment setup (dev, staging, production)
- ✅ Database migration handling
- ✅ CI/CD with GitHub Actions
- ✅ Load testing and monitoring
- ✅ Hotfix and rollback procedures

**Next Steps:**
- Add Redis for caching
- Setup CDN for static assets
- Implement feature flags
- Add APM monitoring
