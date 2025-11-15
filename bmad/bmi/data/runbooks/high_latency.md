# Runbook: High Latency

**Incident Type:** High Latency / Slow Response Time
**Severity:** Medium to High
**Response Time:** < 30 minutes

---

## Symptoms

- Response times significantly above baseline (p95 > SLA)
- Users reporting slow page loads
- API requests taking longer than expected
- Timeout errors starting to appear
- Monitoring alerts for latency thresholds

---

## Immediate Actions (First 5 Minutes)

### 1. Measure Current Latency

```bash
# Check current response times
bmad-cli invoke bmi/monitoring-query \
  --metric "response_time_p95" \
  --timeframe "15m"

# Get latency breakdown by endpoint
bmad-cli invoke bmi/monitoring-query \
  --metric "latency_by_endpoint" \
  --timeframe "15m"

# Quick manual test
time curl https://your-app.com/api/users
```

**Severity Assessment:**
| Latency (p95) | Severity | Action |
|---------------|----------|---------|
| < 500ms | Normal | Monitor only |
| 500ms - 1s | Low | Investigate |
| 1s - 3s | Medium | Active investigation |
| 3s - 10s | High | Immediate action required |
| > 10s | Critical | Consider scaling/rollback |

### 2. Check System Load

```bash
# Kubernetes - Check resource usage
kubectl top pods -n production

# Check CPU usage
bmad-cli invoke bmi/monitoring-query \
  --metric "cpu_usage" \
  --timeframe "15m"

# Check memory usage
bmad-cli invoke bmi/monitoring-query \
  --metric "memory_usage" \
  --timeframe "15m"
```

### 3. Check Recent Deployments

```bash
# List recent deployments
bmad-cli invoke bmi/deployment-history \
  --environment production \
  --limit 5

# Check if latency increased after deployment
```

**If deployment within last hour and latency spike correlates:**
- High probability deployment introduced performance regression
- Consider rollback if latency > 3s (p95)

---

## Investigation (5-30 Minutes)

### 4. Identify Slow Components

**Check Application Performance Monitoring (APM):**

```bash
# Get slow transaction traces
# Using application monitoring tool (New Relic, Datadog, etc.)

# Profile specific endpoints
curl -X POST https://your-app.com/api/slow-endpoint \
  -w "\nTime: %{time_total}s\n"

# Check database query performance
bmad-cli invoke bmi/monitoring-query \
  --metric "database_query_time" \
  --timeframe "15m"
```

**Common Slow Components:**

#### A. Database Queries
```
Symptoms:
- High database query time
- Database CPU usage elevated
- Slow transaction traces showing DB calls
```
**Action:** → Go to [database_issues.md](./database_issues.md)

#### B. External API Calls
```
Symptoms:
- Timeouts to external services
- Slow third-party API responses
- Network latency increased
```
**Action:** Check external service status, implement timeouts

#### C. CPU Bound Operations
```
Symptoms:
- High CPU usage (> 80%)
- Pods/instances maxed out
- CPU throttling in container metrics
```
**Action:** Scale resources or optimize code

#### D. Memory Issues
```
Symptoms:
- High memory usage (> 80%)
- Memory leak patterns
- Garbage collection overhead
```
**Action:** Restart service, investigate memory leak

#### E. Network Issues
```
Symptoms:
- High network latency
- Packet loss
- DNS resolution slow
```
**Action:** Check network infrastructure

### 5. Analyze Traffic Patterns

```bash
# Check current request rate
bmad-cli invoke bmi/monitoring-query \
  --metric "requests_per_second" \
  --timeframe "15m"

# Compare to normal baseline
bmad-cli invoke bmi/monitoring-query \
  --metric "requests_per_second" \
  --timeframe "7d"

# Check if unusual traffic spike
```

**Traffic Spike Scenarios:**
- Legitimate spike (marketing campaign, viral event)
- DDoS attack
- Bot traffic
- Retry storms from clients

### 6. Check Database Performance

```bash
# Get slow queries
# PostgreSQL:
kubectl exec -n production <db-pod> -- psql -U user -d dbname -c "\
SELECT query, mean_exec_time, calls \
FROM pg_stat_statements \
ORDER BY mean_exec_time DESC \
LIMIT 10;"

# Check active connections
kubectl exec -n production <db-pod> -- psql -U user -d dbname -c "\
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check database cache hit ratio
bmad-cli invoke bmi/monitoring-query \
  --metric "database_cache_hit_ratio" \
  --timeframe "15m"
```

**Database Performance Indicators:**
- Cache hit ratio < 90% → Poor caching
- Active connections > max_connections * 0.8 → Connection pool exhaustion
- Slow query time > 1s → Query optimization needed

---

## Remediation Actions

### Option 1: Scale Resources (Quick Fix)

**When to scale:**
- High CPU or memory usage (> 80%)
- Resource limits being hit
- Legitimate traffic increase

```bash
# Scale up replicas
bmad-cli invoke bmi/deploy \
  --environment production \
  --scale-replicas 10 \
  --deployment-strategy rolling

# Or manually:
# Kubernetes
kubectl scale deployment/<app-name> --replicas=10 -n production

# Railway
railway scale --replicas 10

# AWS Auto Scaling
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name production-asg \
  --desired-capacity 10
```

**Increase resource limits:**
```bash
# Kubernetes - Increase CPU/memory
kubectl set resources deployment/<app-name> \
  --limits=cpu=2000m,memory=4Gi \
  --requests=cpu=1000m,memory=2Gi \
  -n production

kubectl rollout status deployment/<app-name> -n production
```

**Verify improvement:**
```bash
# Check latency after scaling
bmad-cli invoke bmi/monitoring-query \
  --metric "response_time_p95" \
  --timeframe "5m"

# Monitor for 5-10 minutes
watch -n 30 'bmad-cli invoke bmi/monitoring-query --metric response_time_p95 --timeframe 5m'
```

### Option 2: Add Caching

**When to cache:**
- Repeated identical requests
- Expensive computations
- Database queries that don't change often

```javascript
// Add Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function getCachedData(key) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFromDatabase(key);
  await client.setEx(key, 3600, JSON.stringify(data)); // Cache for 1 hour
  return data;
}
```

**Deploy caching layer:**
```bash
# Railway - Add Redis
railway add --plugin redis

# Kubernetes - Deploy Redis
kubectl apply -f k8s/redis.yaml -n production

# Vercel - Use Vercel KV
vercel env add REDIS_URL <url> --environment production
```

### Option 3: Optimize Database

**Add missing indexes:**
```sql
-- Identify missing indexes
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Add index
CREATE INDEX idx_users_email ON users(email);

-- Reindex if needed
REINDEX TABLE users;
```

**Optimize slow queries:**
```bash
# Get slow query log
kubectl logs -n production <db-pod> | grep "slow query"

# For each slow query:
# 1. Run EXPLAIN ANALYZE
# 2. Add appropriate indexes
# 3. Rewrite inefficient queries
# 4. Consider query result caching
```

**Scale database:**
```bash
# Railway - Scale database
railway database scale --memory 4096 --cpu 2

# AWS RDS - Modify instance
aws rds modify-db-instance \
  --db-instance-identifier production-db \
  --db-instance-class db.t3.large \
  --apply-immediately

# Add read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier production-db-replica \
  --source-db-instance-identifier production-db
```

### Option 4: Implement Rate Limiting

**When to use:**
- Suspicious traffic patterns
- Bot attacks
- Retry storms

```javascript
// Add rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);
```

**Or use platform rate limiting:**
```bash
# Cloudflare rate limiting
# Vercel firewall rules
# AWS WAF rate-based rules
```

### Option 5: Rollback (If deployment-related)

**When to rollback:**
- Latency increased immediately after deployment
- Code changes introduced inefficiency
- Cannot identify quick fix

```bash
# Execute rollback
bmad-cli invoke bmi/rollback \
  --rollback-reason "Performance regression: p95 latency {{latency}}ms" \
  --rollback-target "previous" \
  --environment production

# Verify latency improvement
bmad-cli invoke bmi/monitoring-query \
  --metric "response_time_p95" \
  --timeframe "5m"
```

### Option 6: Optimize Code

**Profile the application:**
```bash
# Node.js - Use clinic.js
clinic doctor -- node app.js

# Generate flame graph
clinic flame -- node app.js

# Or use built-in profiler
node --inspect app.js
```

**Common code optimizations:**

```javascript
// Bad: N+1 query problem
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// Good: Batch query
const userIds = users.map(u => u.id);
const posts = await Post.findAll({ where: { userId: userIds } });
const postsByUser = groupBy(posts, 'userId');
users.forEach(u => u.posts = postsByUser[u.id] || []);

// Bad: Synchronous blocking operation
const data = fs.readFileSync('large-file.json');

// Good: Asynchronous
const data = await fs.promises.readFile('large-file.json');

// Bad: No connection pooling
const db = await mysql.createConnection(config);

// Good: Use connection pool
const pool = mysql.createPool(config);
```

---

## Verification

### After Remediation

```bash
# 1. Check latency returned to normal
bmad-cli invoke bmi/monitoring-query \
  --metric "response_time_p95" \
  --timeframe "5m"
# Target: < 500ms (or your SLA threshold)

# 2. Check latency across all endpoints
bmad-cli invoke bmi/monitoring-query \
  --metric "latency_by_endpoint" \
  --timeframe "5m"

# 3. Run performance tests
bmad-cli invoke bmi/load-testing \
  --environment production \
  --virtual-users 50 \
  --duration 300 \
  --success-criteria "p95<500ms"

# 4. Monitor for 15 minutes
watch -n 60 'bmad-cli invoke bmi/monitoring-query --metric response_time_p95 --timeframe 10m'
```

**Success Criteria:**
- p95 latency < SLA threshold (typically 500ms)
- p99 latency < 2x SLA threshold
- No timeout errors
- CPU usage < 70%
- Memory usage < 70%
- Stable performance for 15 minutes

---

## Performance Profiling

### Deep Performance Analysis

```bash
# Run comprehensive profiling
bmad-cli invoke bmi/performance-profiling \
  --environment staging \
  --profiling-type cpu \
  --duration 300 \
  --load-pattern peak

# Analyze results:
# - Identify CPU hotspots
# - Find slow functions
# - Detect inefficient algorithms
# - Locate I/O bottlenecks
```

### Database Profiling

```bash
# Enable query logging
# PostgreSQL:
ALTER DATABASE production SET log_min_duration_statement = 100;

# Monitor slow queries
tail -f /var/log/postgresql/postgresql.log | grep "duration:"

# Analyze query execution plans
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
```

### Network Profiling

```bash
# Check DNS resolution time
time dig your-app.com

# Test network latency to database
ping -c 10 database-host

# Trace network path
traceroute database-host

# Test bandwidth
iperf3 -c database-host
```

---

## Post-Incident

### 1. Document Findings

```bash
cat > docs/incidents/latency-$(date +%Y%m%d-%H%M%S).md <<EOF
# Incident Report: High Latency

**Date:** $(date)
**Duration:** {{duration}}
**Peak Latency (p95):** {{peak_latency}}ms
**SLA Target:** {{sla}}ms
**SLA Breach:** {{if_applicable}}

## Timeline
- {{time}}: Latency spike detected
- {{time}}: Investigation started
- {{time}}: Root cause identified: {{root_cause}}
- {{time}}: {{remediation}} executed
- {{time}}: Latency returned to normal

## Root Cause
{{detailed_analysis}}

## Resolution
{{what_was_done}}

## Optimizations Implemented
- {{optimization_1}}
- {{optimization_2}}

## Action Items
- [ ] {{action_item_1}}
- [ ] Add performance regression tests
- [ ] Update performance budgets
EOF
```

### 2. Performance Budgets

```javascript
// Add performance budgets to CI/CD
// lighthouse-ci.json
{
  "ci": {
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "interactive": ["error", {"maxNumericValue": 3000}],
        "speed-index": ["error", {"maxNumericValue": 3000}]
      }
    }
  }
}
```

### 3. Load Testing

```bash
# Add regular load testing
bmad-cli invoke bmi/load-testing \
  --environment staging \
  --schedule "daily" \
  --virtual-users 100 \
  --duration 600 \
  --success-criteria "p95<500ms,p99<1000ms,error_rate<0.01"
```

---

## Prevention

### Proactive Measures

1. **Performance Monitoring**
```bash
# Setup comprehensive monitoring
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --monitoring-categories '["performance","infrastructure"]' \
  --setup-dashboards true \
  --setup-alerts true
```

2. **Regular Load Testing**
```bash
# Test before each production deployment
bmad-cli invoke bmi/load-testing \
  --environment staging \
  --load-profile peak \
  --success-criteria "p95<500ms"
```

3. **Auto-Scaling**
```yaml
# Kubernetes HPA based on custom metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: http_request_duration_p95
      target:
        type: AverageValue
        averageValue: "500m"  # 500ms
```

4. **Code Review Focus**
- Review database queries for N+1 problems
- Check for synchronous blocking operations
- Verify pagination on large datasets
- Ensure proper indexing

5. **Caching Strategy**
```javascript
// Multi-level caching
const cache = {
  memory: new Map(),  // L1: In-memory
  redis: redisClient, // L2: Distributed
  cdn: cloudflare     // L3: Edge
};
```

---

## SLA Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| API Response (p95) | < 500ms | 500-1000ms | > 1000ms |
| Page Load | < 3s | 3-5s | > 5s |
| Database Query | < 100ms | 100-500ms | > 500ms |
| External API | < 2s | 2-5s | > 5s |

---

**Last Updated:** 2025-11-15
**Maintained By:** BMI Team
