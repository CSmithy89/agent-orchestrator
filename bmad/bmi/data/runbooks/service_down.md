# Runbook: Service Down

**Incident Type:** Service Down / Total Outage
**Severity:** Critical
**Response Time:** < 5 minutes

---

## Symptoms

- Service completely unavailable (returning 502, 503, 504)
- Health check endpoints failing
- Uptime monitoring showing downtime
- Users unable to access application
- Zero traffic to application

---

## Immediate Actions (First 2 Minutes)

### 1. Confirm Outage

```bash
# Check application endpoint
curl -I https://your-app.com
# Expected: 502 Bad Gateway, 503 Service Unavailable, or timeout

# Check health endpoint
curl https://your-app.com/health
# Expected: Failure or timeout

# Check multiple endpoints to rule out single endpoint issue
curl https://your-app.com/
curl https://your-app.com/api/health
curl https://your-app.com/api/users
```

**Severity Assessment:**
- All endpoints down = Critical (proceed immediately)
- Partial endpoints down = High (investigate further)
- Single endpoint down = Medium (targeted investigation)

### 2. Check Service Status

**Platform-Specific Status Checks:**

#### Vercel
```bash
# Check deployment status
vercel ls --production

# Check deployment logs
vercel logs <deployment-url>
```

#### Railway
```bash
# Check service status
railway status

# Check deployment logs
railway logs --tail 100
```

#### Kubernetes
```bash
# Check pod status
kubectl get pods -n production

# Check deployment status
kubectl get deployments -n production

# Check service endpoints
kubectl get endpoints -n production
```

#### AWS Elastic Beanstalk
```bash
# Check environment health
aws elasticbeanstalk describe-environment-health \
  --environment-name production \
  --attribute-names All
```

#### DigitalOcean
```bash
# Check app status
doctl apps list

# Get app details
doctl apps get <app-id>
```

---

## Investigation (2-10 Minutes)

### 3. Check Platform Status

```bash
# Check if platform itself is down
# Vercel: https://www.vercel-status.com/
# Railway: https://status.railway.app/
# AWS: https://status.aws.amazon.com/
# DigitalOcean: https://status.digitalocean.com/
# Netlify: https://www.netlifystatus.com/

# Or use automated check
curl -I https://status.vercel.com
```

**If platform is down:**
- Monitor platform status page
- Consider failover to backup region/platform if available
- Communicate ETA to users based on platform status

### 4. Check Recent Changes

```bash
# List recent deployments
bmad-cli invoke bmi/deployment-history \
  --environment production \
  --limit 10

# Check if outage correlates with deployment
# If yes → Immediate rollback
```

### 5. Check Logs

**Get application logs:**

```bash
# Kubernetes
kubectl logs -n production deployment/<app-name> --tail=200

# Look for crash loops
kubectl describe pod -n production <pod-name>

# Railway
railway logs --tail 200

# Vercel
vercel logs <deployment-url> --follow

# AWS
aws logs tail /aws/elasticbeanstalk/<env-name> --follow
```

**Look for:**
- Application crash on startup
- Port binding errors
- Database connection failures
- Missing environment variables
- Out of memory errors
- Uncaught exceptions

### 6. Check Infrastructure

**Container/Pod Status:**
```bash
# Kubernetes - Check if pods are running
kubectl get pods -n production
# Look for: CrashLoopBackOff, ImagePullBackOff, Error, Pending

# Check events
kubectl get events -n production --sort-by='.lastTimestamp' | tail -20

# Check resource limits
kubectl describe pod <pod-name> -n production | grep -A 5 "Limits"
```

**Database Connectivity:**
```bash
# Test database connection
# From within a pod:
kubectl exec -n production <pod-name> -- nc -zv database-host 5432

# Or test from local machine:
psql -h database-host -U username -d database_name -c "SELECT 1"
```

**Network Issues:**
```bash
# Check DNS resolution
kubectl exec -n production <pod-name> -- nslookup database-host

# Check service endpoints
kubectl get endpoints -n production
```

---

## Remediation Actions

### Option 1: Restart Service (Quick Fix)

**When to restart:**
- Temporary glitch suspected
- No obvious root cause
- Service ran fine previously

```bash
# Kubernetes
kubectl rollout restart deployment/<app-name> -n production

# Railway
railway restart

# Vercel - Redeploy
vercel --prod

# AWS Elastic Beanstalk
aws elasticbeanstalk restart-app-server --environment-name production
```

**Monitor for 2-3 minutes:**
```bash
# Watch pod status
kubectl get pods -n production -w

# Check if service recovers
watch -n 5 'curl -I https://your-app.com'
```

### Option 2: Rollback (If deployment-related)

**When to rollback:**
- Service went down immediately after deployment
- New deployment won't start
- Logs show errors in new code

```bash
# Execute immediate rollback
bmad-cli invoke bmi/rollback \
  --rollback-reason "Service down after deployment" \
  --rollback-target "previous" \
  --environment production \
  --skip-confirmation true

# Or manual rollback:
# Kubernetes
kubectl rollout undo deployment/<app-name> -n production

# Railway
railway rollback

# Vercel
vercel rollback <previous-deployment-url>
```

**Verify service recovery:**
```bash
# Check pods are running
kubectl get pods -n production

# Verify endpoint responds
curl https://your-app.com/health

# Run smoke tests
bmad-cli invoke bmi/smoke-testing --environment production
```

### Option 3: Scale Up Resources

**When to scale:**
- Out of memory errors
- Resource limits reached
- High CPU/memory usage in logs

```bash
# Kubernetes - Increase resources
kubectl set resources deployment/<app-name> \
  --limits=memory=2Gi,cpu=1000m \
  --requests=memory=1Gi,cpu=500m \
  -n production

# Kubernetes - Increase replicas
kubectl scale deployment/<app-name> --replicas=5 -n production

# Railway
railway scale --memory 2048 --replicas 3

# AWS - Update instance type
eb scale 5  # Scale to 5 instances
```

### Option 4: Fix Configuration

**When to use:**
- Missing environment variables
- Wrong database URL
- Configuration mismatch

```bash
# Kubernetes - Update env vars
kubectl set env deployment/<app-name> \
  DATABASE_URL=postgresql://... \
  -n production

# Kubernetes - Update from ConfigMap
kubectl create configmap app-config \
  --from-file=config.yaml \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl rollout restart deployment/<app-name> -n production

# Railway
railway variables set DATABASE_URL=postgresql://...
railway restart

# Vercel
vercel env add DATABASE_URL postgresql://... --environment production
vercel --prod  # Redeploy
```

### Option 5: Database Recovery

**If database is unreachable:**
```bash
# Check database status
# PostgreSQL on Railway:
railway connect postgres

# Check database pods (Kubernetes):
kubectl get pods -n database

# Restart database (if self-hosted):
kubectl rollout restart statefulset/<database-name> -n database

# For managed databases:
# - Check cloud provider console
# - Verify connection strings
# - Check database logs
```

**See:** [database_issues.md](./database_issues.md) for detailed database troubleshooting

---

## Platform-Specific Recovery

### Kubernetes Specific

**Common Issues:**

#### Image Pull Errors
```bash
# Check image pull status
kubectl describe pod <pod-name> -n production | grep -A 10 "Events"

# Fix: Update image pull secrets
kubectl create secret docker-registry regcred \
  --docker-server=registry.com \
  --docker-username=user \
  --docker-password=pass \
  --docker-email=email@example.com \
  -n production
```

#### Resource Quota Exceeded
```bash
# Check resource quotas
kubectl describe resourcequota -n production

# Increase quota or scale down other services
```

#### Pending Pods (No Available Nodes)
```bash
# Check node status
kubectl get nodes

# Scale cluster (cloud provider specific)
# GKE:
gcloud container clusters resize <cluster-name> --num-nodes 5

# EKS:
eksctl scale nodegroup --cluster=<cluster> --name=<nodegroup> --nodes=5
```

### Serverless Platforms

#### Vercel Build Failures
```bash
# Check build logs
vercel logs <deployment-url>

# Redeploy with verbose logs
vercel --prod --debug
```

#### Railway Deployment Stuck
```bash
# Cancel stuck deployment
railway deployment cancel

# Retry deployment
railway up --service <service-name>
```

---

## Verification

### After Service Recovery

```bash
# 1. Verify health endpoint
curl https://your-app.com/health
# Expected: 200 OK

# 2. Check main endpoint
curl https://your-app.com/
# Expected: 200 OK with correct response

# 3. Run smoke tests
bmad-cli invoke bmi/smoke-testing \
  --environment production \
  --test-suite critical-paths

# 4. Check monitoring dashboards
bmad-cli invoke bmi/monitoring-query \
  --metric "uptime" \
  --timeframe "5m"

# 5. Verify database connectivity
curl https://your-app.com/api/db-check

# 6. Monitor for 10 minutes
watch -n 30 'curl -I https://your-app.com'
```

**Success Criteria:**
- All endpoints returning 200 OK
- Health checks passing
- All smoke tests passing
- No errors in logs for 5 minutes
- Monitoring shows normal metrics

---

## Communication

### Status Updates

**Immediate (< 5 min):**
```
🔴 INVESTIGATING: Service outage detected at [TIME]
We are investigating the issue and will provide updates shortly.
```

**During Investigation (5-15 min):**
```
🔴 IDENTIFIED: Root cause identified as [CAUSE]
We are working on restoration. ETA: [TIME]
```

**After Recovery:**
```
🟢 RESOLVED: Service has been restored at [TIME]
Total downtime: [DURATION]
Root cause: [CAUSE]
Post-mortem to follow.
```

**Channels:**
- Status page update
- Slack notifications
- Email to affected users (if applicable)
- Twitter/social media (for public-facing services)

---

## Post-Incident

### 1. Create Incident Report

```bash
cat > docs/incidents/outage-$(date +%Y%m%d-%H%M%S).md <<EOF
# Incident Report: Service Outage

**Date:** $(date)
**Duration:** {{total_downtime}}
**Severity:** Critical
**Affected Users:** {{user_count or "All users"}}

## Timeline
- {{time}}: Service went down
- {{time}}: Incident detected
- {{time}}: Investigation started
- {{time}}: Root cause identified: {{root_cause}}
- {{time}}: {{recovery_action}} executed
- {{time}}: Service fully restored

## Root Cause
{{detailed_analysis}}

## Impact
- Downtime: {{duration}}
- Affected users: {{count}}
- Revenue impact: {{if_applicable}}

## Resolution
{{what_was_done}}

## Action Items
- [ ] {{preventive_action_1}}
- [ ] {{preventive_action_2}}
- [ ] Schedule post-mortem meeting
- [ ] Update monitoring/alerting
- [ ] Update this runbook if needed
EOF
```

### 2. Schedule Post-Mortem

- Within 24-48 hours of incident
- Invite all stakeholders
- Blameless analysis
- Focus on prevention

### 3. Implement Preventive Measures

**Improve Monitoring:**
```bash
# Add uptime checks
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --setup-alerts true \
  --uptime-checks true \
  --alert-channels slack,email
```

**Add Redundancy:**
- Multi-region deployment
- Database replication
- Load balancing across multiple instances

**Improve Testing:**
```bash
# Add integration tests for critical paths
# Add startup tests
# Add health check validation
```

---

## Prevention

### Proactive Measures

1. **Health Checks**
```yaml
# Kubernetes liveness/readiness probes
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

2. **Resource Limits**
```yaml
# Prevent resource exhaustion
resources:
  limits:
    memory: "1Gi"
    cpu: "500m"
  requests:
    memory: "512Mi"
    cpu: "250m"
```

3. **Auto-Scaling**
```bash
# Kubernetes HPA
kubectl autoscale deployment <app-name> \
  --cpu-percent=50 \
  --min=3 \
  --max=10 \
  -n production
```

4. **Deployment Safety**
```bash
# Use canary deployments
bmad-cli invoke bmi/deploy \
  --environment production \
  --deployment-strategy canary \
  --canary-percentage 10

# Automatic rollback on failure
# Progressive rollout with health checks
```

---

## Downtime Costs

| Downtime Duration | Typical Impact |
|-------------------|----------------|
| < 5 minutes | Minor - Usually unnoticed |
| 5-15 minutes | Moderate - User complaints |
| 15-60 minutes | High - Revenue impact, SLA breach |
| > 1 hour | Critical - Major revenue loss, reputation damage |

---

## Escalation

**Immediate Escalation Triggers:**
- Service down > 15 minutes
- Unable to identify root cause within 10 minutes
- Require infrastructure/platform provider support
- Data loss suspected

**Escalation Path:**
1. On-call engineer (0-10 min)
2. Tech lead (10-15 min)
3. Engineering manager (15-30 min)
4. CTO + Support from platform provider (30+ min)

---

**Last Updated:** 2025-11-15
**Maintained By:** BMI Team
