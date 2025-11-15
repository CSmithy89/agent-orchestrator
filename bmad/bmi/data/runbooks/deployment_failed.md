# Runbook: Deployment Failed

**Incident Type:** Deployment Failure
**Severity:** High
**Response Time:** < 10 minutes

---

## Symptoms

- Deployment process fails or hangs
- New version not accessible
- Build errors during deployment
- Container/pods failing to start
- Rollout stuck or timing out
- Platform reporting deployment failure

---

## Immediate Actions (First 5 Minutes)

### 1. Assess Deployment Status

```bash
# Check deployment status
bmad-cli invoke bmi/deployment-status \
  --environment production

# Platform-specific status checks:

# Kubernetes
kubectl rollout status deployment/<app-name> -n production
kubectl get pods -n production

# Vercel
vercel ls --production

# Railway
railway status

# AWS Elastic Beanstalk
eb status production

# Netlify
netlify status
```

**Deployment States:**
- **Progressing** → Still deploying, wait
- **Failed** → Deployment failed, investigate
- **Stuck** → Timeout or waiting for resource
- **Rollback in progress** → Auto-rollback triggered

### 2. Check Recent Logs

```bash
# Get deployment logs

# Kubernetes
kubectl logs -n production deployment/<app-name> --tail=100
kubectl describe pod <pod-name> -n production

# Vercel
vercel logs <deployment-url>

# Railway
railway logs --tail 100

# AWS
eb logs production --all

# Netlify
netlify logs
```

### 3. Identify Failure Stage

**Common Failure Stages:**

#### A. Build Failure
```
Error: Build failed
Error: npm ERR! code ELIFECYCLE
Error: Compilation error
```
**Next:** → Go to [Build Failures Section](#build-failures)

#### B. Container Start Failure
```
Error: CrashLoopBackOff
Error: Application failed to start
Error: Port binding failed
```
**Next:** → Go to [Runtime Failures Section](#runtime-failures)

#### C. Health Check Failure
```
Error: Readiness probe failed
Error: Health check timeout
Error: Liveness probe failed
```
**Next:** → Go to [Health Check Failures Section](#health-check-failures)

#### D. Resource Issues
```
Error: Insufficient resources
Error: ImagePullBackOff
Error: Pending (no available nodes)
```
**Next:** → Go to [Resource Issues Section](#resource-issues)

---

## Build Failures

### Common Build Errors

#### 1. Dependency Installation Failed

**Error:**
```
npm ERR! 404 Not Found - GET https://registry.npmjs.org/package-name
npm ERR! code ENOTFOUND
Error: Cannot find module 'package-name'
```

**Diagnosis:**
```bash
# Check package.json for typos
cat package.json | grep "package-name"

# Check if package exists
npm view package-name

# Check npm registry access
curl https://registry.npmjs.org/
```

**Fix:**
```bash
# Fix typo in package.json
# Or install correct package
npm install correct-package-name --save

# Commit and redeploy
git add package.json package-lock.json
git commit -m "Fix: Correct package dependency"
git push

# Or rollback
bmad-cli invoke bmi/rollback \
  --rollback-target previous \
  --environment production
```

#### 2. Build Script Failed

**Error:**
```
Error: npm run build failed
TypeError: Cannot read property 'x' of undefined
Compilation error
```

**Diagnosis:**
```bash
# Run build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check environment variables
# Build might depend on env vars
```

**Fix:**
```bash
# Fix code errors
# Commit fix
git add .
git commit -m "Fix: Build error in component"
git push

# Or ensure environment variables are set
# Vercel:
vercel env add VAR_NAME value --environment production

# Railway:
railway variables set VAR_NAME=value

# Kubernetes:
kubectl set env deployment/<app-name> VAR_NAME=value -n production
```

#### 3. Out of Memory During Build

**Error:**
```
Error: JavaScript heap out of memory
FATAL ERROR: Reached heap limit
```

**Fix:**
```bash
# Increase Node memory limit

# package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}

# Or platform-specific:
# Vercel - Automatically handles this
# Railway - Increase build resources in dashboard
# Kubernetes - Increase build job resources
```

---

## Runtime Failures

### Common Runtime Errors

#### 1. Application Crash on Startup

**Error:**
```
Error: Application exited with code 1
CrashLoopBackOff
Container keeps restarting
```

**Diagnosis:**
```bash
# Check application logs
kubectl logs -n production <pod-name>

# Look for:
# - Uncaught exceptions
# - Missing environment variables
# - Database connection errors
# - Port binding errors
```

**Common Issues:**

**A. Missing Environment Variables:**
```javascript
// Error: process.env.DATABASE_URL is undefined

// Check which vars are missing
console.log('Required env vars:', {
  DATABASE_URL: process.env.DATABASE_URL,
  API_KEY: process.env.API_KEY,
  NODE_ENV: process.env.NODE_ENV
});
```

**Fix:**
```bash
# Add missing environment variables
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL=postgresql://... \
  --from-literal=API_KEY=xxx \
  -n production

# Update deployment to use secret
kubectl set env deployment/<app-name> \
  --from=secret/app-secrets \
  -n production
```

**B. Port Binding Error:**
```
Error: Port 3000 already in use
Error: EADDRINUSE
```

**Fix:**
```javascript
// Ensure app listens on correct port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**C. Database Connection Failed:**
```
Error: ECONNREFUSED
Error: Unable to connect to database
```

**Fix:**
```bash
# Verify database is running
kubectl get pods -n database

# Test database connectivity
kubectl exec -n production <app-pod> -- nc -zv database-host 5432

# Check connection string
kubectl get secret database-credentials -n production -o yaml
```

#### 2. Container Image Issues

**Error:**
```
ImagePullBackOff
Error: Failed to pull image
Error: manifest unknown
```

**Diagnosis:**
```bash
# Check image exists
docker pull your-registry.com/app:tag

# Check image pull secrets
kubectl get secrets -n production
kubectl describe secret regcred -n production
```

**Fix:**
```bash
# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=user \
  --docker-password=pass \
  --docker-email=email@example.com \
  -n production

# Update deployment to use secret
kubectl patch deployment <app-name> -n production -p \
'{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# Or fix image tag
kubectl set image deployment/<app-name> \
  app=your-registry.com/app:correct-tag \
  -n production
```

---

## Health Check Failures

### Liveness/Readiness Probe Failed

**Error:**
```
Readiness probe failed: HTTP probe failed
Liveness probe failed: Get "http://10.0.0.1:3000/health": context deadline exceeded
```

**Diagnosis:**
```bash
# Test health endpoint manually
kubectl port-forward -n production <pod-name> 8080:3000
curl http://localhost:8080/health

# Check health endpoint logs
kubectl logs -n production <pod-name> | grep "/health"

# Check probe configuration
kubectl describe pod <pod-name> -n production | grep -A 10 "Liveness"
```

**Common Issues:**

**A. Health endpoint not implemented:**
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// With database check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
```

**B. Probe timing too aggressive:**
```yaml
# Kubernetes - Adjust probe timing
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 60  # Increase from 30
  periodSeconds: 10
  timeoutSeconds: 5        # Increase from 3
  failureThreshold: 5      # Increase from 3
```

**C. Health check taking too long:**
```javascript
// Bad: Health check does complex operations
app.get('/health', async (req, res) => {
  const users = await User.findAll();  // SLOW!
  const stats = await calculateStats(); // SLOW!
  res.json({ status: 'ok', users: users.length });
});

// Good: Simple health check
app.get('/health', async (req, res) => {
  // Just check if database is reachable
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(503).json({ status: 'error' });
  }
});
```

---

## Resource Issues

### Insufficient Resources

**Error:**
```
0/3 nodes available: insufficient cpu, insufficient memory
Pending: FailedScheduling
```

**Diagnosis:**
```bash
# Check node resources
kubectl top nodes

# Check pod resource requests
kubectl describe pod <pod-name> -n production | grep -A 5 "Requests"

# Check resource quotas
kubectl describe resourcequota -n production
```

**Fix:**

**A. Scale cluster:**
```bash
# Add more nodes (cloud provider specific)

# GKE
gcloud container clusters resize <cluster> --num-nodes 5

# EKS
eksctl scale nodegroup --cluster=<cluster> --name=<nodegroup> --nodes=5

# AKS
az aks scale --resource-group <rg> --name <cluster> --node-count 5
```

**B. Reduce resource requests:**
```yaml
# Reduce resource requests if they're too high
resources:
  requests:
    memory: "256Mi"  # Reduced from 1Gi
    cpu: "100m"      # Reduced from 500m
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**C. Evict low-priority pods:**
```bash
# Delete non-critical pods to free resources
kubectl delete pod <non-critical-pod> -n development
```

---

## Platform-Specific Failures

### Vercel Deployment Failed

**Common Issues:**

```bash
# Build timeout (exceeded 45 minutes)
# Fix: Optimize build process or upgrade plan

# Serverless function too large (> 50MB)
# Fix: Reduce dependencies, use external APIs

# Check deployment logs
vercel logs <deployment-url>

# Redeploy
vercel --prod

# Force fresh build
vercel --prod --force
```

### Railway Deployment Failed

```bash
# Check service logs
railway logs

# Common issues:
# - Build failed: Check Nixpacks build
# - Start command wrong: Update in railway.json
# - Environment variables missing

# Restart deployment
railway up

# Rollback
railway rollback
```

### Kubernetes Deployment Stuck

```bash
# Check deployment status
kubectl rollout status deployment/<app-name> -n production

# Common reasons deployment stuck:
# 1. ImagePullBackOff - fix image
# 2. CrashLoopBackOff - check logs
# 3. Pending - insufficient resources

# Pause rollout
kubectl rollout pause deployment/<app-name> -n production

# Fix issue, then resume
kubectl rollout resume deployment/<app-name> -n production

# Or undo
kubectl rollout undo deployment/<app-name> -n production
```

---

## Recovery Actions

### Option 1: Quick Rollback (Recommended)

**When to rollback:**
- Cannot identify fix quickly (< 10 min)
- Critical production issue
- Deployment consistently failing

```bash
# Execute rollback
bmad-cli invoke bmi/rollback \
  --rollback-reason "Deployment failed: {{error}}" \
  --rollback-target previous \
  --environment production \
  --skip-confirmation true

# Verify rollback success
kubectl rollout status deployment/<app-name> -n production
curl https://your-app.com/health
```

### Option 2: Fix and Redeploy

**When to fix:**
- Root cause clearly identified
- Simple fix (env var, config)
- No code changes needed

```bash
# Fix issue (e.g., add env var)
kubectl set env deployment/<app-name> MISSING_VAR=value -n production

# Or update ConfigMap
kubectl create configmap app-config \
  --from-file=config.yaml \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment
kubectl rollout restart deployment/<app-name> -n production
```

### Option 3: Hotfix Deployment

**When to hotfix:**
- Code fix needed
- Fix is small and well-tested
- Can be done quickly (< 30 min)

```bash
# Create hotfix branch
git checkout -b hotfix/deployment-fix

# Make fix
# Test locally
npm test
npm run build

# Deploy hotfix
bmad-cli invoke bmi/hotfix \
  --hotfix-description "Fix deployment failure: {{description}}" \
  --base-version "{{current_version}}" \
  --fast-track true \
  --auto-deploy true
```

---

## Verification

### After Deployment Recovery

```bash
# 1. Check deployment status
kubectl rollout status deployment/<app-name> -n production

# 2. Check pods are running
kubectl get pods -n production
# All pods should be Running (not CrashLoopBackOff)

# 3. Test health endpoint
curl https://your-app.com/health
# Should return 200 OK

# 4. Run smoke tests
bmad-cli invoke bmi/smoke-testing \
  --environment production

# 5. Check logs for errors
kubectl logs -n production deployment/<app-name> --tail=50 | grep -i error

# 6. Monitor for 10 minutes
watch -n 30 'kubectl get pods -n production'
```

**Success Criteria:**
- All pods in Running state
- Health checks passing
- No errors in logs
- Smoke tests passing
- Application accessible

---

## Post-Incident

### 1. Document Failure

```bash
cat > docs/incidents/deployment-failed-$(date +%Y%m%d-%H%M%S).md <<EOF
# Incident Report: Deployment Failure

**Date:** $(date)
**Version:** {{version}}
**Environment:** {{environment}}
**Failure Stage:** {{build|runtime|healthcheck|resources}}

## What Failed
{{description_of_failure}}

## Error Messages
\`\`\`
{{error_logs}}
\`\`\`

## Root Cause
{{root_cause}}

## Resolution
{{how_it_was_fixed}}

## Prevention
- [ ] {{preventive_action_1}}
- [ ] {{preventive_action_2}}
- [ ] Add deployment tests to catch this
EOF
```

### 2. Improve Deployment Process

**Add Pre-deployment Checks:**
```bash
# Create pre-deployment validation
cat > .github/workflows/pre-deploy-checks.yml <<EOF
name: Pre-deployment Checks

on:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check environment variables
        run: |
          # Verify all required env vars exist
          required_vars=("DATABASE_URL" "API_KEY")
          for var in "\${required_vars[@]}"; do
            if [ -z "\${!var}" ]; then
              echo "Missing: \$var"
              exit 1
            fi
          done

      - name: Test build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Check health endpoint
        run: |
          npm start &
          sleep 10
          curl -f http://localhost:3000/health
EOF
```

**Add Deployment Safety:**
```yaml
# Kubernetes - Add deployment strategy
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Ensure zero downtime

  # Add proper health checks
  template:
    spec:
      containers:
      - name: app
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## Prevention

### 1. Staging Environment Testing

```bash
# Always test in staging first
bmad-cli invoke bmi/deploy \
  --version "1.0.0" \
  --environment staging \
  --deployment-strategy rolling

# Run full test suite
bmad-cli invoke bmi/smoke-testing --environment staging
bmad-cli invoke bmi/load-testing --environment staging

# Only deploy to production if staging succeeds
if [ $? -eq 0 ]; then
  bmad-cli invoke bmi/deploy \
    --version "1.0.0" \
    --environment production
fi
```

### 2. Gradual Rollouts

```bash
# Use canary deployments for high-risk changes
bmad-cli invoke bmi/deploy \
  --environment production \
  --deployment-strategy canary \
  --canary-percentage 10

# Monitor canary for issues
# If OK, promote to 100%
# If issues, rollback automatically
```

### 3. Automated Rollback

```yaml
# Kubernetes - Add automatic rollback
spec:
  progressDeadlineSeconds: 600  # Fail deployment after 10 min

# BMI - Configure auto-rollback
deployment:
  auto_rollback_on_failure: true
  health_check_timeout: 300
  rollback_on_health_check_fail: true
```

### 4. Better Monitoring

```bash
# Monitor deployment progress
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --setup-alerts true \
  --alert-on-deployment-failure true
```

---

## Common Failure Patterns

| Failure Type | Frequency | Detection Time | Fix Time | Prevention |
|-------------|-----------|----------------|----------|------------|
| Build failure | 30% | Immediate | 10-30 min | Pre-commit hooks, CI tests |
| Missing env vars | 25% | On startup | 5 min | Environment validation |
| Image pull errors | 15% | 1-2 min | 5-10 min | Image registry monitoring |
| Resource limits | 10% | Immediate | 5 min | Resource planning |
| Health check fail | 10% | 30s-2min | 5-15 min | Health endpoint testing |
| Database issues | 5% | On startup | 10-30 min | Connection testing |
| Other | 5% | Variable | Variable | N/A |

---

**Last Updated:** 2025-11-15
**Maintained By:** BMI Team
