# Runbook: High Error Rate

**Incident Type:** High Error Rate
**Severity:** High
**Response Time:** < 15 minutes

---

## Symptoms

- Error rate exceeds normal baseline (typically > 1%)
- Increased 4xx or 5xx HTTP responses
- Application throwing exceptions
- Users reporting failures or broken functionality
- Monitoring alerts triggered for error thresholds

---

## Immediate Actions (First 5 Minutes)

### 1. Assess Severity
```bash
# Check current error rate
bmad-cli invoke bmi/monitoring-query \
  --metric "error_rate" \
  --timeframe "15m"

# Get error breakdown by type
bmad-cli invoke bmi/monitoring-query \
  --metric "errors_by_type" \
  --timeframe "15m"
```

**Decision Point:**
- **Error rate > 10%**: Critical - Execute emergency rollback
- **Error rate 5-10%**: High - Continue investigation, prepare for rollback
- **Error rate 1-5%**: Medium - Continue investigation

### 2. Check Recent Deployments
```bash
# List recent deployments
bmad-cli invoke bmi/deployment-history \
  --environment production \
  --limit 5

# Check if error spike correlates with deployment
```

**If deployment within last 30 minutes:**
- High probability deployment caused the issue
- **Proceed to Rollback section**

### 3. Check Application Logs
```bash
# Get recent error logs
kubectl logs -n production deployment/<app-name> \
  --since=15m --tail=100 | grep -i error

# Or for cloud platforms:
# Vercel: vercel logs <deployment-url> --follow
# Railway: railway logs
# AWS: aws logs tail /aws/elasticbeanstalk/<env-name>
```

---

## Investigation (5-15 Minutes)

### 4. Identify Error Patterns

**Common Error Patterns:**

#### A. Database Connection Errors
```
Error: ECONNREFUSED, connection refused
Error: Too many connections
Error: Query timeout
```
**Action:** → Go to [database_issues.md](./database_issues.md)

#### B. External API Failures
```
Error: 503 Service Unavailable
Error: Request timeout
Error: ENOTFOUND api.external-service.com
```
**Action:** Check external service status pages

#### C. Application Logic Errors
```
TypeError: Cannot read property 'x' of undefined
ReferenceError: variable is not defined
Error: Invalid input
```
**Action:** Review recent code changes, check sentry/error tracking

#### D. Resource Exhaustion
```
Error: JavaScript heap out of memory
Error: ENOMEM: not enough memory
Error: Too many open files
```
**Action:** → Go to [high_latency.md](./high_latency.md) (resource section)

### 5. Check Dependencies
```bash
# Check if third-party services are down
curl https://status.stripe.com
curl https://status.github.com
# Check your services' health endpoints
curl https://your-api.com/health
```

### 6. Check Database Health
```bash
# Check database connection pool
bmad-cli invoke bmi/monitoring-query \
  --metric "database_connections" \
  --timeframe "15m"

# Check database error rate
bmad-cli invoke bmi/monitoring-query \
  --metric "database_errors" \
  --timeframe "15m"
```

---

## Remediation Actions

### Option 1: Rollback (Recommended if deployment-related)

**When to rollback:**
- Error rate > 5%
- Errors started immediately after deployment
- Unable to identify root cause within 15 minutes

```bash
# Execute rollback
bmad-cli invoke bmi/rollback \
  --rollback-reason "High error rate: {{error_rate}}%" \
  --rollback-target "previous" \
  --environment production

# Verify error rate decreases
bmad-cli invoke bmi/monitoring-query \
  --metric "error_rate" \
  --timeframe "5m"
```

### Option 2: Hotfix (If root cause identified)

**When to hotfix:**
- Root cause clearly identified
- Fix is simple and low-risk
- Rollback would cause data loss or other issues

```bash
# Create and deploy hotfix
bmad-cli invoke bmi/hotfix \
  --hotfix-description "Fix: {{description}}" \
  --base-version "{{current_version}}" \
  --fast-track true \
  --auto-deploy true
```

### Option 3: Configuration Change

**When to use:**
- Error caused by configuration issue
- No code changes needed

```bash
# Update environment variables
# Vercel:
vercel env add KEY value --environment production

# Railway:
railway variables set KEY=value --environment production

# Kubernetes:
kubectl set env deployment/<app-name> KEY=value -n production
kubectl rollout restart deployment/<app-name> -n production
```

### Option 4: Scale Resources (If resource exhaustion)

```bash
# Scale up replicas
bmad-cli invoke bmi/deploy \
  --environment production \
  --scale-replicas 6 \
  --deployment-strategy rolling

# Or manual scaling:
# Kubernetes:
kubectl scale deployment/<app-name> --replicas=6 -n production

# Railway:
railway scale --replicas 6
```

---

## Verification

### After Remediation (5-10 Minutes)

```bash
# 1. Verify error rate returned to normal
bmad-cli invoke bmi/monitoring-query \
  --metric "error_rate" \
  --timeframe "5m"

# 2. Run smoke tests
bmad-cli invoke bmi/smoke-testing \
  --environment production

# 3. Check application health
curl https://your-app.com/health

# 4. Monitor for 10 minutes to ensure stability
watch -n 30 'bmad-cli invoke bmi/monitoring-query --metric error_rate --timeframe 5m'
```

**Success Criteria:**
- Error rate < 1%
- All smoke tests passing
- No new error spikes for 10 minutes
- Health checks returning 200 OK

---

## Post-Incident

### 1. Document Incident
```bash
# Create incident report
cat > docs/incidents/incident-$(date +%Y%m%d-%H%M%S).md <<EOF
# Incident Report: High Error Rate

**Date:** $(date)
**Duration:** {{duration}}
**Severity:** {{severity}}
**Error Rate Peak:** {{peak_error_rate}}%

## Timeline
- {{time}}: Error rate spike detected
- {{time}}: Investigation started
- {{time}}: Root cause identified: {{root_cause}}
- {{time}}: {{remediation_action}} executed
- {{time}}: Service restored

## Root Cause
{{detailed_root_cause}}

## Resolution
{{resolution_details}}

## Action Items
- [ ] {{action_item_1}}
- [ ] {{action_item_2}}
EOF
```

### 2. Update Monitoring
```bash
# Add/improve alerts if needed
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --setup-alerts true \
  --alert-threshold "error_rate>0.02"  # 2%
```

### 3. Review and Improve
- Update this runbook if gaps identified
- Add preventive measures (tests, monitoring)
- Schedule post-mortem meeting if high severity

---

## Prevention

### Proactive Measures

1. **Better Testing**
```bash
# Add integration tests
# Add error scenario tests
# Add load testing before production
bmad-cli invoke bmi/load-testing \
  --environment staging \
  --success-criteria "error_rate<0.01"
```

2. **Gradual Rollouts**
```bash
# Use canary deployments for high-risk changes
bmad-cli invoke bmi/deploy \
  --environment production \
  --deployment-strategy canary \
  --canary-percentage 10
```

3. **Enhanced Monitoring**
```bash
# Setup error tracking
# Sentry, Datadog, New Relic
# Setup real user monitoring (RUM)
```

4. **Circuit Breakers**
```javascript
// Add circuit breakers for external dependencies
const circuitBreaker = require('opossum');
const breaker = circuitBreaker(externalAPICall, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```

---

## Common Root Causes

| Root Cause | Frequency | Detection Time | Fix Time |
|-----------|-----------|----------------|----------|
| Deployment bug | 40% | < 5 min | 5-15 min (rollback) |
| Database issues | 20% | 5-10 min | 10-30 min |
| External API down | 15% | < 5 min | Wait for recovery |
| Configuration error | 10% | 5-10 min | 5-10 min |
| Resource exhaustion | 10% | 5-15 min | 10-20 min |
| Other | 5% | Variable | Variable |

---

## Contact Information

**On-Call Rotation:** See PagerDuty
**Escalation Path:** Tech Lead → Engineering Manager → CTO
**External Vendors:**
- Database: [support contact]
- Hosting: [support contact]

---

**Last Updated:** 2025-11-15
**Maintained By:** BMI Team
