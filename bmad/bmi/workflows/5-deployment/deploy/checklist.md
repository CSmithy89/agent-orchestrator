# Deployment Pre-Flight Checklist

This checklist ensures safe, reliable deployments to any environment. Mark each item as you complete it.

**Checklist Status Markers:**
- `[x]` - Completed successfully
- `[ ]` - Not yet completed
- `[N/A]` - Not applicable to this deployment
- `[!]` - Requires attention / blocking issue

---

## 1. Code Quality & Testing

### Source Control
- [ ] All code changes committed
- [ ] No uncommitted or unstaged files
- [ ] Code pushed to remote repository
- [ ] Correct branch selected for deployment
- [ ] No merge conflicts

### Testing
- [ ] All unit tests passing (100%)
- [ ] All integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Manual testing completed for new features
- [ ] Regression testing completed
- [ ] Test coverage meets threshold (per BMM test strategy)

### Build
- [ ] Build completes successfully
- [ ] No build warnings (or warnings reviewed and acceptable)
- [ ] Build artifacts generated correctly
- [ ] Build size within acceptable limits (<50MB for web apps)
- [ ] Source maps generated (for debugging)

---

## 2. Security

### Secrets Management
- [ ] No secrets committed to code
- [ ] Environment variables configured for target environment
- [ ] Secrets provider configured ({secrets_provider})
- [ ] API keys rotated if necessary
- [ ] Database credentials secured
- [ ] Third-party service credentials verified

### Vulnerability Scanning
- [ ] Dependency vulnerability scan completed (npm audit, yarn audit, etc.)
- [ ] No critical or high vulnerabilities present
- [ ] Medium vulnerabilities reviewed and acceptable
- [ ] Container image scanned (if using Docker)
- [ ] Static security analysis (SAST) passed

### SSL/TLS
- [ ] SSL/TLS certificates valid
- [ ] HTTPS enforced for production
- [ ] Certificate expiration date > 30 days
- [ ] Proper certificate chain configured

### Access Control
- [ ] Deployment credentials available
- [ ] User has permission to deploy to target environment
- [ ] Service accounts configured correctly
- [ ] IAM roles/policies verified (for cloud platforms)

---

## 3. Database

### Migration Readiness
- [ ] Migrations tested in lower environment first
- [ ] Migration rollback plan documented
- [ ] Database backup created BEFORE migration
- [ ] Backup verified and restorable
- [ ] Migration execution time estimated
- [ ] Downtime requirements communicated (if any)

### Data Integrity
- [ ] Data migration scripts tested
- [ ] No destructive operations without confirmation
- [ ] Foreign key constraints verified
- [ ] Indexes created for performance
- [ ] Database connections pooled correctly

### Rollback Plan
- [ ] Database backup location documented
- [ ] Rollback procedure tested
- [ ] Database restore time estimated
- [ ] Rollback communication plan ready

---

## 4. Infrastructure

### Platform Configuration
- [ ] Deployment platform detected: {detected_platform}
- [ ] Platform CLI installed and authenticated
- [ ] Platform service limits verified
- [ ] Resource quotas sufficient (CPU, memory, storage)
- [ ] Auto-scaling configured (if applicable)

### Environment Configuration
- [ ] Target environment: {target_environment}
- [ ] Environment variables set correctly
- [ ] Configuration files present (env files, config maps)
- [ ] Feature flags configured
- [ ] Service dependencies available (Redis, queues, etc.)

### Networking
- [ ] DNS records configured
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured (if applicable)
- [ ] Firewall rules verified
- [ ] CORS settings correct

### Monitoring
- [ ] Application monitoring configured (APM)
- [ ] Error tracking enabled (Sentry, Rollbar, etc.)
- [ ] Log aggregation configured
- [ ] Alerting rules configured
- [ ] Health check endpoints working

---

## 5. Dependencies

### External Services
- [ ] Third-party APIs accessible
- [ ] Service API keys valid
- [ ] Rate limits verified
- [ ] Service status checked (no outages)
- [ ] Webhook endpoints configured

### Internal Services
- [ ] All microservices healthy
- [ ] Service mesh configured (if applicable)
- [ ] Message queues accessible
- [ ] Cache services running (Redis, Memcached)
- [ ] Storage services accessible (S3, GCS, etc.)

### Package Dependencies
- [ ] package.json/requirements.txt up to date
- [ ] Lock files committed (package-lock.json, yarn.lock, Pipfile.lock)
- [ ] No deprecated dependencies
- [ ] Dependencies installed successfully
- [ ] Peer dependencies resolved

---

## 6. Performance

### Performance Budgets
- [ ] Bundle size within budget
- [ ] Image sizes optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Performance regression tests passed

### Caching
- [ ] Browser caching headers set
- [ ] CDN caching configured
- [ ] API response caching configured
- [ ] Static asset caching enabled
- [ ] Cache invalidation strategy verified

### Database Performance
- [ ] Database queries optimized
- [ ] Indexes created for slow queries
- [ ] Connection pooling configured
- [ ] Query timeout limits set
- [ ] N+1 query issues resolved

---

## 7. Compliance & Documentation

### Documentation
- [ ] Deployment notes prepared
- [ ] README updated (if applicable)
- [ ] API documentation updated
- [ ] Changelog updated
- [ ] Release notes drafted

### Compliance
- [ ] GDPR compliance verified (if applicable)
- [ ] Data retention policies enforced
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Accessibility standards met (WCAG)

### Approval
- [ ] Code review completed
- [ ] Product owner approval obtained
- [ ] Stakeholder notification sent
- [ ] Change management ticket created
- [ ] Production deployment approval obtained (if required)

---

## 8. Rollback Readiness

### Rollback Plan
- [ ] Previous version identified: {previous_version}
- [ ] Rollback procedure documented
- [ ] Rollback tested in lower environment
- [ ] Database rollback plan ready
- [ ] Rollback communication plan prepared

### Backup Verification
- [ ] Application backup created
- [ ] Database backup created
- [ ] Configuration backup created
- [ ] Backup restore tested
- [ ] Backup retention policy verified

---

## 9. Smoke Tests

### Critical Endpoints
- [ ] Health check endpoint responding
- [ ] Homepage loading successfully
- [ ] API endpoints accessible
- [ ] Authentication flow working
- [ ] Core user workflows functional

### Integration Tests
- [ ] Database connectivity verified
- [ ] External API integrations working
- [ ] File upload/download working
- [ ] Email sending working (if applicable)
- [ ] Payment processing working (if applicable)

### Performance Validation
- [ ] Response times within SLA
- [ ] Page load times acceptable (<3s)
- [ ] API response times within threshold
- [ ] Database query performance acceptable
- [ ] No memory leaks detected

---

## 10. Production-Specific (Production Deployments Only)

### Communication
- [ ] Deployment window scheduled
- [ ] Stakeholders notified of deployment
- [ ] Support team briefed
- [ ] Status page updated
- [ ] Rollback procedures communicated

### Monitoring
- [ ] On-call engineer assigned
- [ ] Monitoring dashboards ready
- [ ] Alerting thresholds configured
- [ ] Incident response plan ready
- [ ] Escalation procedures documented

### Business Continuity
- [ ] Maintenance mode page ready (if needed)
- [ ] Downtime minimized or zero-downtime deployment
- [ ] Traffic splitting configured (canary/blue-green)
- [ ] Feature flags ready to disable new features
- [ ] Customer communication prepared

---

## Checklist Summary

**Total Items:** ~120
**Completed:** ___ / ___
**Not Applicable:** ___ / ___
**Blocking Issues:** ___ / ___

**Overall Status:**
- [ ] ✅ All critical items completed - READY TO DEPLOY
- [ ] ⚠️ Some items require attention - REVIEW BEFORE DEPLOYING
- [ ] ❌ Blocking issues present - DO NOT DEPLOY

**Deployment Approval:**
- Reviewed by: _______________
- Approved by: _______________
- Timestamp: _______________

---

**Notes:**

Use this space to document any deployment-specific notes, risks, or considerations:

_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
