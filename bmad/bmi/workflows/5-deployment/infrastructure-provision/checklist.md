# Infrastructure Provision Pre-Flight Checklist

This checklist ensures safe, cost-effective cloud infrastructure provisioning. Mark each item as you complete it.

**Checklist Status Markers:**
- `[x]` - Completed successfully
- `[ ]` - Not yet completed
- `[N/A]` - Not applicable to this provision
- `[!]` - Requires attention / blocking issue

---

## 1. IaC Tool Readiness

### Tool Installation
- [ ] IaC tool installed: Terraform / Pulumi / CDK / CloudFormation / Other
- [ ] Tool version verified and compatible
- [ ] Tool dependencies installed (Node.js for CDK, Python for Pulumi, etc.)
- [ ] Tool plugins/providers installed

### Infrastructure Code
- [ ] Infrastructure code exists and is organized
- [ ] Code follows IaC best practices
- [ ] Code is committed to version control (git)
- [ ] No uncommitted changes (or changes documented)
- [ ] Code reviewed by team (if applicable)

### State Management (Terraform/Pulumi)
- [ ] State backend configured (S3, GCS, Azure Storage, Pulumi Cloud)
- [ ] State locking enabled (DynamoDB for Terraform S3 backend)
- [ ] State file backed up
- [ ] No state lock conflicts
- [ ] State encryption enabled

---

## 2. Cloud Provider Credentials

### Credential Configuration
- [ ] Cloud provider CLI installed (aws, gcloud, az, doctl)
- [ ] CLI version verified and compatible
- [ ] Credentials configured and authenticated
- [ ] Correct account/project/subscription selected
- [ ] Permissions verified (sufficient to create all planned resources)

### Account Verification
- [ ] **AWS:** Account ID matches expected environment
- [ ] **GCP:** Project ID matches expected environment
- [ ] **Azure:** Subscription ID matches expected environment
- [ ] **DigitalOcean:** API token valid and has write permissions

### Environment Isolation
- [ ] Using separate accounts/projects for dev/staging/production
- [ ] No risk of provisioning in wrong environment
- [ ] Credentials scoped to least privilege for provisioning

---

## 3. Infrastructure Planning

### Resource Planning
- [ ] Infrastructure requirements documented
- [ ] Resource sizing appropriate for workload
- [ ] High availability requirements considered
- [ ] Disaster recovery strategy defined
- [ ] Backup and restore strategy planned

### Network Design
- [ ] VPC/Virtual Network architecture designed
- [ ] Subnet allocation planned (public, private, database tiers)
- [ ] IP address ranges (CIDR blocks) chosen without conflicts
- [ ] Inter-VPC connectivity planned (if multi-region/multi-account)
- [ ] DNS strategy defined

### Compute Resources
- [ ] Instance types/sizes chosen based on workload
- [ ] Auto-scaling configured (if applicable)
- [ ] Container orchestration strategy defined (if using containers)
- [ ] Serverless architecture designed (if using functions)

### Storage Resources
- [ ] Object storage buckets planned (S3, GCS, Azure Blob)
- [ ] Block storage volumes sized appropriately
- [ ] Database instances sized and configured
- [ ] Backup retention policies defined

---

## 4. Security Configuration

### IAM and Access Control
- [ ] IAM roles and policies defined with least privilege
- [ ] No overly permissive policies (avoid *, admin access)
- [ ] Service accounts created for applications
- [ ] MFA enabled for human users (if applicable)
- [ ] Access keys rotated regularly

### Network Security
- [ ] Security groups/firewalls configured with least privilege
- [ ] No 0.0.0.0/0 ingress on sensitive ports (SSH, RDP, databases)
- [ ] Private subnets used for databases and internal services
- [ ] Bastion hosts/jump boxes configured for SSH access
- [ ] Network segmentation implemented

### Encryption
- [ ] Encryption at rest enabled for all storage resources
  - [ ] S3/GCS/Blob buckets
  - [ ] EBS/Persistent disks
  - [ ] RDS/Cloud SQL databases
- [ ] Encryption in transit enforced (HTTPS, SSL/TLS)
- [ ] KMS/Key Vault configured for encryption keys
- [ ] Secrets managed via secrets manager (not hardcoded)

### Compliance
- [ ] Compliance requirements identified (GDPR, HIPAA, SOC2, etc.)
- [ ] Compliance controls implemented in infrastructure
- [ ] Audit logging enabled (CloudTrail, Cloud Audit Logs, Activity Log)
- [ ] Resource tagging for compliance tracking

---

## 5. Cost Management

### Cost Estimation
- [ ] Cost estimation completed (Infracost or manual)
- [ ] Estimated monthly cost reviewed: $___________
- [ ] Cost fits within budget
- [ ] Cost breakdown by resource type reviewed
- [ ] Annual cost projection calculated

### Cost Optimization
- [ ] Right-sized instances (not over-provisioned)
- [ ] Reserved instances/committed use discounts considered (for production)
- [ ] Spot instances considered for non-critical workloads
- [ ] Auto-scaling configured to scale down during low usage
- [ ] Unused resources identified and removed

### Cost Monitoring
- [ ] Cost alerts configured in cloud provider
- [ ] Budget limits set
- [ ] Cost allocation tags applied to all resources
- [ ] Cost dashboard created (if applicable)

---

## 6. Resource Tagging

### Required Tags (Apply to ALL resources)
- [ ] Environment: dev / staging / production
- [ ] Project: {project_name}
- [ ] Owner: {team_or_person}
- [ ] Cost-Center: {cost_center_code}
- [ ] ManagedBy: terraform / pulumi / cdk / cloudformation

### Optional Tags
- [ ] Application: {application_name}
- [ ] Service: {service_name}
- [ ] Version: {infrastructure_version}
- [ ] Compliance: {compliance_framework}

### Tag Validation
- [ ] All resources have required tags
- [ ] Tag values are consistent and standardized
- [ ] Tags match organizational tagging policy

---

## 7. Monitoring and Observability

### Monitoring Setup
- [ ] Monitoring strategy defined (CloudWatch, Stackdriver, Azure Monitor)
- [ ] Metrics collection configured
- [ ] Log aggregation configured
- [ ] Log retention policies defined

### Alerting
- [ ] Critical alerts defined:
  - [ ] Resource health alerts
  - [ ] Cost spike alerts
  - [ ] Security incident alerts
- [ ] Alert notification channels configured (email, Slack, PagerDuty)
- [ ] On-call rotation defined (for production)

### Dashboards
- [ ] Infrastructure dashboard created (if applicable)
- [ ] Key metrics visualized
- [ ] Dashboard shared with team

---

## 8. High Availability and Resilience

### Redundancy
- [ ] Multi-AZ deployment for critical resources (production)
- [ ] Load balancers configured for distribution
- [ ] Database replication configured (if applicable)
- [ ] Auto-scaling groups configured with min instance counts

### Backup and Recovery
- [ ] Automated backups configured
  - [ ] Databases
  - [ ] File systems
  - [ ] Critical data stores
- [ ] Backup retention period defined
- [ ] Backup restore tested (or restore procedure documented)

### Disaster Recovery
- [ ] DR strategy defined (RTO and RPO targets)
- [ ] Multi-region failover planned (if critical)
- [ ] DR runbook created

---

## 9. Infrastructure as Code Best Practices

### Code Quality
- [ ] IaC code follows style guide
- [ ] Code is modular and reusable (modules/stacks)
- [ ] Variables externalized (not hardcoded)
- [ ] Sensitive values use secrets management
- [ ] Code is well-documented with comments

### Validation
- [ ] IaC code validated (terraform validate, pulumi preview, etc.)
- [ ] No syntax errors
- [ ] No missing required variables
- [ ] Dependencies resolved correctly

### Version Control
- [ ] Infrastructure code in git repository
- [ ] Branch strategy defined (main, develop, feature branches)
- [ ] Pull request workflow (if team)
- [ ] Code review completed (if applicable)

---

## 10. Provision Execution Planning

### Pre-Provision
- [ ] Dry-run completed (terraform plan, pulumi preview, cdk diff)
- [ ] Plan reviewed and understood
- [ ] Destructive changes identified and approved
- [ ] Team notified of provision (if applicable)

### Execution
- [ ] Provision window scheduled (if downtime expected)
- [ ] Executor assigned: {user_name}
- [ ] Rollback plan documented
- [ ] Emergency contacts identified

### Post-Provision
- [ ] Post-provision validation tests defined
- [ ] Success criteria defined
- [ ] Resource inventory will be documented
- [ ] Provision log will be saved

---

## Environment-Specific Checks

### Production Only
- [ ] Production provision approval obtained
- [ ] Change management ticket created
- [ ] Business stakeholders notified
- [ ] Maintenance window communicated (if applicable)
- [ ] Rollback plan tested in staging
- [ ] Multiple reviewers approved infrastructure code

### Dev/Staging
- [ ] Development team aware of provision
- [ ] No production data will be used
- [ ] Cost limits appropriate for non-production

---

## Checklist Summary

**Total Items:** ~110
**Completed:** ___ / ___
**Not Applicable:** ___ / ___
**Blocking Issues:** ___ / ___

**Overall Status:**
- [ ] ✅ All critical items completed - READY TO PROVISION
- [ ] ⚠️ Some items require attention - REVIEW BEFORE PROVISIONING
- [ ] ❌ Blocking issues present - DO NOT PROVISION YET

**Provision Approval:**
- Reviewed by: _______________
- Approved by: _______________
- Timestamp: _______________

**Estimated Monthly Cost:** $_______________

---

**Security Risk Assessment:**

High Risk Items (require special attention):
- [ ] Public IP addresses assigned
- [ ] Overly permissive security groups (0.0.0.0/0)
- [ ] Unencrypted storage resources
- [ ] Admin/wildcard IAM permissions

**Cost Risk Assessment:**

High Cost Items (monitor closely):
- [ ] Large instance types (e.g., x2.32xlarge)
- [ ] High storage volumes (>1TB)
- [ ] Data transfer heavy workloads
- [ ] Managed services with high per-hour costs

---

**Notes:**

Use this space to document provision-specific notes, risks, or special considerations:

_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
