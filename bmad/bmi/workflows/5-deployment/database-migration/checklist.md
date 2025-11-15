# Database Migration Pre-Flight Checklist

This checklist ensures safe database migrations with backup and rollback capability. Mark each item as you complete it.

**Checklist Status Markers:**
- `[x]` - Completed successfully
- `[ ]` - Not yet completed
- `[N/A]` - Not applicable to this migration
- `[!]` - Requires attention / blocking issue

---

## 1. Migration Tool Readiness

### Tool Installation
- [ ] Migration tool installed: Prisma / Drizzle / Knex / TypeORM / Sequelize / Django / Rails / Alembic / Flyway / Liquibase
- [ ] Tool version verified and compatible
- [ ] Tool dependencies installed (Node.js, Python, Ruby, etc.)
- [ ] Migration files exist in project

### Migration Files
- [ ] Migration files committed to version control
- [ ] Migration file naming follows conventions
- [ ] No uncommitted migrations (or documented intentionally)
- [ ] Migration dependencies resolved (if migrations depend on each other)
- [ ] Migration code reviewed (if applicable)

---

## 2. Database Connection

### Connection Validation
- [ ] Database connection string configured
- [ ] Database accessible from current environment
- [ ] Credentials valid and have migration permissions
- [ ] Network access verified (firewall, VPN, security groups)
- [ ] Correct database selected (dev/staging/production)

### Database Permissions
- [ ] User has CREATE TABLE permissions
- [ ] User has ALTER TABLE permissions
- [ ] User has DROP permissions (if needed for rollback)
- [ ] User has INSERT/UPDATE permissions for migration tracking table
- [ ] Sufficient database storage space available

### Environment Verification
- [ ] Connected to correct environment (dev/staging/production)
- [ ] Database name matches expected environment
- [ ] No accidental production connection from dev environment
- [ ] Database backup retention policy understood

---

## 3. Migration Planning

### Pending Migrations
- [ ] Pending migrations identified: {pending_count}
- [ ] Migration order validated (dependencies respected)
- [ ] Estimated migration duration calculated: {estimated_duration}
- [ ] Downtime requirements determined (if any)
- [ ] Maintenance window scheduled (if required)

### Destructive Operations
- [ ] Analyzed for destructive operations (DROP, TRUNCATE, ALTER with data loss)
- [ ] No destructive operations OR destructive operations approved
- [ ] Data backup plan for affected tables (if destructive)
- [ ] Data migration scripts prepared (if needed)
- [ ] Rollback plan for destructive migrations documented

### Migration Content Review
- [ ] Migration SQL reviewed and understood
- [ ] No syntax errors in migration files
- [ ] Foreign key constraints respected
- [ ] Index creation planned (won't cause timeout on large tables)
- [ ] No breaking changes to application (or application updated)

---

## 4. Backup Strategy

### Backup Creation
- [ ] Database backup tool available (pg_dump, mysqldump, etc.)
- [ ] Sufficient storage space for backup
- [ ] Backup location configured and accessible
- [ ] Backup compression enabled (to save space)
- [ ] Backup encryption considered (for sensitive data)

### Backup Verification
- [ ] Test backup creation (dry-run)
- [ ] Backup file integrity verified (checksum)
- [ ] Backup size reasonable (not corrupted/incomplete)
- [ ] Backup restore tested (in lower environment) OR restore procedure documented
- [ ] Cloud backup configured (for production - S3, GCS, Azure Blob)

### Backup Retention
- [ ] Backup retention policy defined
- [ ] Old backups will be cleaned up (space management)
- [ ] Backup metadata stored (timestamp, schema version, checksum)

---

## 5. Rollback Planning

### Rollback Capability
- [ ] Migration tool supports rollback for this migration type
- [ ] Rollback scripts generated (if manual rollback needed)
- [ ] Rollback procedure documented
- [ ] Rollback tested in lower environment
- [ ] Rollback duration estimated

### Rollback Strategy
- [ ] Automatic rollback on failure enabled (rollback_on_failure=true)
- [ ] Backup restore procedure ready (if rollback not possible)
- [ ] Data loss acceptable if rolling back (or data preserved)
- [ ] Application compatible with rolled-back schema

---

## 6. Data Integrity

### Pre-Migration Validation
- [ ] Database in consistent state (no pending transactions)
- [ ] Foreign key constraints valid
- [ ] No orphaned records
- [ ] Data quality checks passed
- [ ] Critical data exported/backed up separately (if needed)

### Post-Migration Validation
- [ ] Post-migration validation tests defined:
  - [ ] Row count validation (ensure no unexpected data loss)
  - [ ] Foreign key constraint validation
  - [ ] Null constraint validation
  - [ ] Data type validation
- [ ] Sample data queries prepared for validation
- [ ] Expected row counts documented

---

## 7. Performance Considerations

### Migration Performance
- [ ] Migration estimated to complete within timeout limit ({migration_timeout} seconds)
- [ ] Large table migrations optimized (batching, partitioning)
- [ ] Index creation planned for off-peak hours (if large table)
- [ ] Table locks understood (won't block application for too long)
- [ ] Migration tested on production-sized dataset (in staging)

### Application Impact
- [ ] Application can handle schema changes gracefully
- [ ] Zero-downtime migration strategy (if applicable):
  - [ ] Dual-write to old and new columns
  - [ ] Gradual migration approach
  - [ ] Backward-compatible schema changes
- [ ] Application updated to use new schema (if breaking changes)
- [ ] Application deployment coordinated with migrations

---

## 8. Production-Specific Checks (Production Only)

### Approval and Communication
- [ ] Production migration approval obtained
- [ ] Change management ticket created
- [ ] Database administrator notified (if applicable)
- [ ] Application team notified
- [ ] Maintenance window communicated to users/stakeholders
- [ ] Status page updated (if downtime expected)

### Safety Measures
- [ ] Production database backup created AND verified
- [ ] Cloud backup uploaded and verified
- [ ] Read replica lag checked (if using replication)
- [ ] Connection pooling configuration reviewed
- [ ] Query timeout limits reviewed
- [ ] Monitoring and alerting configured for migration

### Incident Response
- [ ] On-call engineer assigned
- [ ] Rollback decision criteria defined
- [ ] Emergency contacts identified
- [ ] Escalation path documented
- [ ] Post-migration verification plan ready

---

## 9. Testing in Lower Environments

### Staging/Dev Testing
- [ ] Migrations tested in dev environment
- [ ] Migrations tested in staging environment with production-like data
- [ ] No issues encountered in lower environments
- [ ] Migration performance acceptable in staging
- [ ] Application functionality verified after migrations

### Dry-Run
- [ ] Dry-run completed (migration plan reviewed)
- [ ] Generated SQL reviewed (if tool supports SQL preview)
- [ ] No unexpected changes in migration plan
- [ ] Migration duration within acceptable limits

---

## 10. Post-Migration Plan

### Verification
- [ ] Post-migration verification tests ready
- [ ] Database connectivity tests prepared
- [ ] Application smoke tests prepared
- [ ] Performance regression tests planned (if applicable)
- [ ] Monitoring dashboards ready (query performance, connection counts)

### Documentation
- [ ] Migration log will be generated
- [ ] Schema changes documented
- [ ] Rollback procedure documented
- [ ] Known issues/limitations documented (if any)

### Monitoring
- [ ] Database monitoring configured (query performance, locks, deadlocks)
- [ ] Alert thresholds reviewed
- [ ] Log aggregation configured
- [ ] Slow query log enabled (if applicable)

---

## Checklist Summary

**Total Items:** ~100
**Completed:** ___ / ___
**Not Applicable:** ___ / ___
**Blocking Issues:** ___ / ___

**Overall Status:**
- [ ] ✅ All critical items completed - READY TO MIGRATE
- [ ] ⚠️ Some items require attention - REVIEW BEFORE MIGRATING
- [ ] ❌ Blocking issues present - DO NOT MIGRATE YET

**Migration Approval:**
- Reviewed by: _______________
- Approved by: _______________
- Timestamp: _______________

**Pending Migrations:** {pending_count}
**Estimated Duration:** {estimated_duration}

---

## Critical Reminders

**Before Migration:**
- ✅ Create database backup
- ✅ Verify backup integrity
- ✅ Test database connection
- ✅ Review pending migrations

**During Migration:**
- ✅ Monitor migration progress
- ✅ Watch for errors or warnings
- ✅ Track migration duration
- ✅ Be ready to rollback if needed

**After Migration:**
- ✅ Verify migrations applied successfully
- ✅ Run post-migration validation tests
- ✅ Test application functionality
- ✅ Monitor database performance
- ✅ Keep backup until confirmed stable

---

**Notes:**

Use this space to document migration-specific notes, risks, or special considerations:

_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
