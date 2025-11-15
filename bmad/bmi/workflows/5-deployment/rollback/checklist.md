# Rollback Pre-Flight Checklist

This checklist ensures safe, controlled rollbacks with minimal risk. Mark each item as you complete it.

**Checklist Status Markers:**
- `[x]` - Completed successfully
- `[ ]` - Not yet completed
- `[N/A]` - Not applicable to this rollback
- `[!]` - Requires attention / blocking issue

---

## 1. Incident Assessment

### Severity Classification
- [ ] Incident severity determined: Critical / High / Medium / Low
- [ ] Users impacted: Estimated number of affected users
- [ ] Business impact assessed: Revenue / Customer trust / Operations
- [ ] Urgency level set: Emergency / Urgent / Planned

### Rollback Decision
- [ ] Rollback decision confirmed by authorized person
- [ ] Alternative fixes considered and rejected
- [ ] Rollback is the best/fastest resolution path
- [ ] Stakeholders notified of rollback decision

---

## 2. Previous Version Verification

### Deployment History
- [ ] Previous deployment identified: {previous_version}
- [ ] Previous deployment was stable (no known issues)
- [ ] Previous deployment timestamp verified
- [ ] Time delta between deployments calculated

### Artifact Availability
- [ ] Previous version source code tagged in git
- [ ] Previous version build artifacts exist
- [ ] Previous version container images available (if applicable)
- [ ] Previous version deployment configuration available
- [ ] All dependencies for previous version available

---

## 3. Database Assessment

### Migration Status
- [ ] Database migration status checked
- [ ] Migrations applied since last deployment identified
- [ ] Migration count: {migration_count}
- [ ] Migration rollback scripts exist (if applicable)
- [ ] Migration tool supports rollback: Yes / No / Manual

### Data Integrity
- [ ] Database backup exists from before current deployment
- [ ] Backup timestamp verified (before problematic deployment)
- [ ] Backup size verified (not corrupted)
- [ ] Backup restore tested (if time permits)
- [ ] Data loss assessment: Will rollback cause data loss? Yes / No
- [ ] Data loss acceptable or mitigated

### Rollback Strategy
- [ ] Database rollback strategy determined:
  - [ ] Automated migration rollback
  - [ ] Manual SQL scripts
  - [ ] Restore from backup
  - [ ] Skip database rollback (schema compatible)

---

## 4. Platform Readiness

### Platform Detection
- [ ] Deployment platform identified: {detected_platform}
- [ ] Platform CLI tools installed and authenticated
- [ ] Platform rollback capability verified
- [ ] Rollback strategy determined: Blue-Green / Canary / Recreate / Rolling

### Platform-Specific Checks

#### Blue-Green Deployment
- [ ] Previous (green) deployment still running
- [ ] Traffic routing can be switched instantly
- [ ] DNS/load balancer configuration ready

#### Canary Deployment
- [ ] Canary traffic percentage can be set to 0%
- [ ] Stable version still receiving traffic
- [ ] Traffic split can be reverted

#### Recreate Strategy
- [ ] Previous version can be redeployed
- [ ] Downtime is acceptable
- [ ] Downtime duration estimated and communicated

#### Rolling Update
- [ ] Platform supports rollback command (kubectl rollout undo, etc.)
- [ ] Previous revision number identified
- [ ] Rolling update can be reversed

---

## 5. Impact Assessment

### Downtime Estimation
- [ ] Estimated rollback duration: {estimated_duration}
- [ ] Expected downtime: {expected_downtime}
- [ ] Downtime acceptable given incident severity
- [ ] Maintenance window scheduled (if applicable)
- [ ] Users notified of expected downtime

### Feature Impact
- [ ] Features in current version will be lost
- [ ] Lost features documented and communicated
- [ ] Users notified about feature rollback
- [ ] Workarounds identified for lost features (if needed)

### Data Impact
- [ ] New data created since deployment identified
- [ ] Data compatibility verified (will previous version handle new data?)
- [ ] Data migration/cleanup required: Yes / No
- [ ] Data loss risk: None / Low / Medium / High
- [ ] Data loss mitigation plan ready

---

## 6. Communication

### Internal Communication
- [ ] Development team notified
- [ ] Product team notified
- [ ] Support team notified
- [ ] On-call engineer assigned
- [ ] Incident channel created/updated

### External Communication
- [ ] Status page updated with incident
- [ ] Customer-facing teams notified
- [ ] Communication templates prepared:
  - [ ] Incident notification
  - [ ] Rollback in progress
  - [ ] Rollback complete
- [ ] Communication channels identified (email, Slack, status page)

---

## 7. Rollback Execution Plan

### Rollback Steps
- [ ] Rollback steps documented
- [ ] Rollback command(s) prepared
- [ ] Rollback executor assigned: {user_name}
- [ ] Rollback witness assigned (for production)
- [ ] Emergency contacts identified

### Monitoring
- [ ] Monitoring dashboards ready
- [ ] Key metrics identified for verification:
  - [ ] Health check endpoints
  - [ ] Error rates
  - [ ] Response times
  - [ ] Database connectivity
- [ ] Alert thresholds reviewed
- [ ] Log aggregation configured

---

## 8. Verification Plan

### Post-Rollback Tests
- [ ] Health check endpoints identified
- [ ] Core functionality tests prepared
- [ ] Performance benchmarks identified
- [ ] Database query tests prepared
- [ ] Integration tests ready (if applicable)

### Success Criteria
- [ ] Success criteria defined:
  - [ ] Health checks passing
  - [ ] Error rate below threshold
  - [ ] Response times within SLA
  - [ ] Core user workflows functional
- [ ] Acceptance criteria clear
- [ ] Rollback verification owner assigned

---

## 9. Rollback Contingency

### If Rollback Fails
- [ ] Escalation path defined
- [ ] Emergency contacts ready
- [ ] Manual intervention steps documented
- [ ] Alternative recovery strategies identified:
  - [ ] Restore from backup
  - [ ] Emergency hotfix
  - [ ] Manual configuration changes
  - [ ] Failover to DR environment

### Backup Plans
- [ ] Database backups verified and accessible
- [ ] Configuration backups exist
- [ ] Previous deployment artifacts backed up
- [ ] Rollback of rollback possible (if needed)

---

## 10. Post-Rollback Actions

### Incident Response
- [ ] Incident report template ready
- [ ] Root cause analysis (RCA) scheduled
- [ ] Postmortem meeting scheduled
- [ ] Action items tracker prepared

### Process Improvements
- [ ] Deployment process review scheduled
- [ ] Test coverage review scheduled
- [ ] Monitoring improvements identified
- [ ] Rollback procedure improvements documented

---

## Environment-Specific Checks

### Production Only
- [ ] Production rollback approval obtained
- [ ] Change management ticket created
- [ ] Business stakeholders notified
- [ ] Customer support briefed
- [ ] Status page incident created
- [ ] On-call rotation verified
- [ ] Incident commander assigned

### Staging/Dev
- [ ] Development team aware of rollback
- [ ] Dependent services notified
- [ ] Test environment state considered

---

## Checklist Summary

**Total Items:** ~90
**Completed:** ___ / ___
**Not Applicable:** ___ / ___
**Blocking Issues:** ___ / ___

**Overall Status:**
- [ ] ✅ All critical items completed - READY TO ROLLBACK
- [ ] ⚠️ Some items require attention - REVIEW BEFORE ROLLBACK
- [ ] ❌ Blocking issues present - DO NOT ROLLBACK YET

**Rollback Approval:**
- Reviewed by: _______________
- Approved by: _______________
- Timestamp: _______________

**Urgency Level:** Emergency / Urgent / Planned

---

## Emergency Fast-Track (Production Down)

**For critical production incidents where speed is essential, minimum checklist:**

- [ ] Previous deployment identified and verified stable
- [ ] Platform rollback command ready
- [ ] Database backup exists (for emergency restore if needed)
- [ ] Stakeholders notified (parallel action during rollback)
- [ ] Post-rollback verification tests identified

**Execute rollback immediately. Complete full checklist during/after rollback for incident report.**

---

**Notes:**

Use this space to document rollback-specific notes, risks, or special considerations:

_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
