# Runbook: Database Issues

**Incident Type:** Database Problems
**Severity:** High to Critical
**Response Time:** < 10 minutes

---

## Symptoms

- Database connection errors
- Slow database queries (> 1s)
- Connection pool exhausted
- Database timeouts
- Data inconsistencies
- Application errors related to database operations

---

## Immediate Actions (First 5 Minutes)

### 1. Verify Database Connectivity

```bash
# Test database connection
# PostgreSQL
psql -h database-host -U username -d database_name -c "SELECT 1;"

# MySQL
mysql -h database-host -u username -p database_name -e "SELECT 1;"

# From application pod (Kubernetes)
kubectl exec -n production <app-pod> -- nc -zv database-host 5432

# Check database pod status (if self-hosted)
kubectl get pods -n database
kubectl describe pod <db-pod> -n database
```

**Possible Results:**
- ✅ Connection successful → Database is up, check application connection
- ❌ Connection refused → Database is down
- ❌ Timeout → Network/firewall issues
- ❌ Authentication failed → Credentials problem

### 2. Check Database Status

**Managed Databases:**

```bash
# Railway
railway connect postgres

# AWS RDS
aws rds describe-db-instances \
  --db-instance-identifier production-db \
  --query 'DBInstances[0].DBInstanceStatus'

# DigitalOcean
doctl databases list

# Google Cloud SQL
gcloud sql instances describe production-db
```

**Self-Hosted (Kubernetes):**
```bash
# Check database pod
kubectl get pods -n database
kubectl logs -n database <db-pod> --tail=100

# Check database resource usage
kubectl top pod -n database
```

### 3. Check Connection Pool

```bash
# PostgreSQL - Check active connections
kubectl exec -n production <db-pod> -- psql -U user -d dbname -c "\
SELECT count(*), state \
FROM pg_stat_activity \
GROUP BY state;"

# Check connection pool settings in application
# Look for: max connections, pool size, idle timeout
```

**Connection Pool Analysis:**
- Total connections > max_connections → Pool exhausted
- Many idle connections → Connection leak
- Many active connections → High load or slow queries

---

## Common Database Issues

### Issue 1: Database Connection Errors

**Symptoms:**
```
Error: ECONNREFUSED
Error: connection refused
Error: unable to connect to database
```

**Diagnosis:**
```bash
# Check if database is running
# PostgreSQL
pg_isready -h database-host -p 5432

# Check database logs
kubectl logs -n database <db-pod> --tail=200

# Check if port is open
telnet database-host 5432
```

**Resolution:**

**A. Database is down:**
```bash
# Restart database (self-hosted)
kubectl rollout restart statefulset/<db-name> -n database

# Restart managed database
# Railway: Check Railway dashboard
# AWS RDS:
aws rds reboot-db-instance --db-instance-identifier production-db
```

**B. Network issues:**
```bash
# Check network policies (Kubernetes)
kubectl get networkpolicies -n production

# Check service endpoints
kubectl get endpoints -n database

# Verify database service
kubectl get svc -n database
```

**C. Wrong connection string:**
```bash
# Verify environment variable
kubectl get secret database-credentials -n production -o yaml

# Update connection string
kubectl set env deployment/<app-name> \
  DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  -n production

kubectl rollout restart deployment/<app-name> -n production
```

### Issue 2: Connection Pool Exhausted

**Symptoms:**
```
Error: Too many connections
Error: Timeout acquiring connection from pool
Error: Pool is exhausted
```

**Diagnosis:**
```bash
# Check current connection count
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT count(*) as connections, state \
FROM pg_stat_activity \
GROUP BY state;"

# Check max connections setting
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SHOW max_connections;"
```

**Resolution:**

**A. Increase connection pool size:**
```javascript
// Adjust application connection pool
// PostgreSQL with pg
const pool = new Pool({
  max: 20,  // Increase from default 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
});
```

**B. Increase database max_connections:**
```bash
# PostgreSQL - Edit config
kubectl exec -n database <db-pod> -- bash -c "\
echo 'max_connections = 200' >> /var/lib/postgresql/data/postgresql.conf"

# Restart database
kubectl rollout restart statefulset/<db-name> -n database

# Managed databases - Update via dashboard/CLI
# AWS RDS uses parameter groups
# Railway has connection limit in dashboard
```

**C. Fix connection leaks:**
```javascript
// Bad: Not releasing connection
const result = await pool.query('SELECT * FROM users');

// Good: Using pool correctly
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users');
  return result.rows;
} finally {
  client.release();  // Always release!
}

// Best: Let ORM handle it
const users = await User.findAll();
```

### Issue 3: Slow Queries

**Symptoms:**
```
Query execution time > 1s
Application timeouts
High database CPU usage
```

**Diagnosis:**

```bash
# PostgreSQL - Find slow queries
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT query, mean_exec_time, calls, total_exec_time \
FROM pg_stat_statements \
ORDER BY mean_exec_time DESC \
LIMIT 10;"

# Check currently running queries
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT pid, now() - pg_stat_activity.query_start AS duration, query \
FROM pg_stat_activity \
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%' \
ORDER BY duration DESC;"

# MySQL - Slow query log
kubectl exec -n database <db-pod> -- mysql -u root -p -e "\
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;"
```

**Resolution:**

**A. Add missing indexes:**
```sql
-- Analyze query execution plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Look for "Seq Scan" (table scan) - add index
CREATE INDEX idx_users_email ON users(email);

-- For composite queries
CREATE INDEX idx_users_email_status ON users(email, status);

-- For JSONB columns (PostgreSQL)
CREATE INDEX idx_user_metadata ON users USING GIN (metadata);
```

**B. Optimize queries:**
```sql
-- Bad: Select all columns
SELECT * FROM users WHERE status = 'active';

-- Good: Select only needed columns
SELECT id, name, email FROM users WHERE status = 'active';

-- Bad: N+1 query
-- App code fetches each user's posts separately

-- Good: Use JOIN or batch query
SELECT u.*, p.*
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE u.status = 'active';

-- Bad: No limit
SELECT * FROM logs ORDER BY created_at DESC;

-- Good: Always paginate large tables
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100 OFFSET 0;
```

**C. Use query caching:**
```javascript
// Add Redis caching layer
const cache = require('redis').createClient(process.env.REDIS_URL);

async function getUser(id) {
  const cacheKey = `user:${id}`;
  const cached = await cache.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  await cache.setEx(cacheKey, 3600, JSON.stringify(user));
  return user;
}
```

### Issue 4: Database Disk Full

**Symptoms:**
```
Error: No space left on device
Error: Could not extend file
Database refusing writes
```

**Diagnosis:**
```bash
# Check disk usage (self-hosted)
kubectl exec -n database <db-pod> -- df -h

# Check database size
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT pg_size_pretty(pg_database_size('dbname'));"

# Check table sizes
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) \
FROM pg_stat_user_tables \
ORDER BY pg_total_relation_size(relid) DESC \
LIMIT 10;"
```

**Resolution:**

**A. Immediate: Increase disk size:**
```bash
# AWS RDS
aws rds modify-db-instance \
  --db-instance-identifier production-db \
  --allocated-storage 100 \
  --apply-immediately

# Kubernetes PVC
kubectl patch pvc database-pvc -n database -p \
  '{"spec":{"resources":{"requests":{"storage":"100Gi"}}}}'

# Railway
# Increase storage in Railway dashboard
```

**B. Clean up old data:**
```sql
-- Delete old logs
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Archive old data to separate table
CREATE TABLE logs_archive AS SELECT * FROM logs WHERE created_at < NOW() - INTERVAL '1 year';
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '1 year';

-- Vacuum to reclaim space (PostgreSQL)
VACUUM FULL logs;
```

**C. Implement data retention:**
```javascript
// Add data cleanup job
// Using node-cron
const cron = require('node-cron');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  await db.query(
    "DELETE FROM logs WHERE created_at < NOW() - INTERVAL '90 days'"
  );
  console.log('Old logs cleaned up');
});
```

### Issue 5: Database Lock Issues

**Symptoms:**
```
Error: Deadlock detected
Error: Lock wait timeout exceeded
Queries hanging indefinitely
```

**Diagnosis:**
```bash
# PostgreSQL - Check locks
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT * FROM pg_locks \
WHERE NOT granted;"

# Find blocking queries
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;"
```

**Resolution:**

**A. Kill blocking query:**
```bash
# Terminate specific query
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT pg_terminate_backend(<pid>);"

# Cancel query (graceful)
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT pg_cancel_backend(<pid>);"
```

**B. Fix transaction issues:**
```javascript
// Bad: Long-running transaction
await db.transaction(async (t) => {
  // Lots of operations...
  // External API call (SLOW!)
  await callExternalAPI();
  // More operations...
});

// Good: Keep transactions short
const data = await callExternalAPI();  // Outside transaction
await db.transaction(async (t) => {
  // Only database operations inside transaction
  await User.create(data, { transaction: t });
});
```

**C. Use proper isolation levels:**
```javascript
// Use READ COMMITTED for most cases (default)
const result = await db.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED
}, async (t) => {
  // ...
});

// Use SERIALIZABLE only when necessary
```

---

## Database Backup & Recovery

### Immediate Backup (Before Risky Operation)

```bash
# PostgreSQL dump
kubectl exec -n database <db-pod> -- pg_dump \
  -U user dbname > backup-$(date +%Y%m%d-%H%M%S).sql

# Managed databases
# Railway: Automatic backups
# AWS RDS: Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier production-db \
  --db-snapshot-identifier pre-fix-$(date +%Y%m%d-%H%M%S)
```

### Database Recovery

```bash
# Restore from backup
kubectl exec -i -n database <db-pod> -- psql -U user dbname < backup.sql

# AWS RDS - Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier production-db-restored \
  --db-snapshot-identifier pre-fix-20231115-120000
```

---

## Verification

### After Database Fix

```bash
# 1. Test database connectivity
psql -h database-host -U username -d database_name -c "SELECT 1;"

# 2. Check connection count
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "\
SELECT count(*) FROM pg_stat_activity;"

# 3. Test slow queries are fixed
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
# Should show index scan, < 10ms

# 4. Check database health
bmad-cli invoke bmi/monitoring-query \
  --metric "database_health" \
  --timeframe "5m"

# 5. Run application smoke tests
bmad-cli invoke bmi/smoke-testing \
  --environment production \
  --test-suite database-operations
```

**Success Criteria:**
- Database connectivity restored
- Connection pool not exhausted (< 80% used)
- Query response time < 100ms (p95)
- No lock issues
- Application functioning normally

---

## Monitoring & Alerts

### Database Monitoring Setup

```bash
# Setup comprehensive database monitoring
bmad-cli invoke bmi/monitoring-setup \
  --environment production \
  --monitoring-categories '["database"]' \
  --setup-dashboards true \
  --setup-alerts true
```

**Key Metrics to Monitor:**
- Connection count / pool usage
- Query execution time (p95, p99)
- Database CPU usage
- Database memory usage
- Disk usage and IOPS
- Cache hit ratio
- Lock wait time
- Replication lag (if using replicas)

**Alert Thresholds:**
```yaml
alerts:
  - metric: connection_pool_usage
    threshold: 80%
    severity: warning
  - metric: query_time_p95
    threshold: 500ms
    severity: warning
  - metric: disk_usage
    threshold: 85%
    severity: critical
  - metric: database_cpu
    threshold: 80%
    severity: high
```

---

## Prevention

### 1. Connection Management

```javascript
// Use connection pooling properly
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Always release connections
async function queryDB() {
  const client = await pool.connect();
  try {
    return await client.query('SELECT * FROM users');
  } finally {
    client.release();
  }
}

// Use ORM with proper connection handling
// Sequelize, TypeORM, Prisma all manage connections
```

### 2. Query Optimization

```sql
-- Regular index maintenance
REINDEX TABLE users;
VACUUM ANALYZE users;

-- Create appropriate indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_posts_user_created ON posts(user_id, created_at DESC);

-- Partial indexes for common filters
CREATE INDEX idx_active_users ON users(id) WHERE status = 'active';
```

### 3. Regular Maintenance

```bash
# Weekly vacuum (PostgreSQL)
cron: "0 2 * * 0"  # Sunday 2 AM
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "VACUUM ANALYZE;"

# Monthly reindex
cron: "0 3 1 * *"  # First of month 3 AM
kubectl exec -n database <db-pod> -- psql -U user -d dbname -c "REINDEX DATABASE dbname;"
```

### 4. Database Scaling

**Read Replicas:**
```bash
# AWS RDS - Create read replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier production-db-replica \
  --source-db-instance-identifier production-db \
  --db-instance-class db.t3.medium

# Route read queries to replica
const readPool = new Pool({ connectionString: process.env.DATABASE_READ_URL });
const writePool = new Pool({ connectionString: process.env.DATABASE_WRITE_URL });

// Read from replica
const users = await readPool.query('SELECT * FROM users');

// Write to primary
await writePool.query('INSERT INTO users ...');
```

**Connection Pooling with PgBouncer:**
```yaml
# Deploy PgBouncer for connection pooling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
spec:
  template:
    spec:
      containers:
      - name: pgbouncer
        image: edoburu/pgbouncer:latest
        env:
        - name: DATABASE_URL
          value: postgresql://user:pass@postgres:5432/dbname
        - name: POOL_MODE
          value: transaction
        - name: MAX_CLIENT_CONN
          value: "1000"
        - name: DEFAULT_POOL_SIZE
          value: "25"
```

---

**Last Updated:** 2025-11-15
**Maintained By:** BMI Team
