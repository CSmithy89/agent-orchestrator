# Infrastructure Provision - Cloud Infrastructure Provisioning Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/infrastructure-provision/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>INFRASTRUCTURE SAFETY: This workflow creates cloud resources that incur costs. Always show cost estimates, validate security configurations, and confirm destructive changes before applying.</critical>

<workflow>

<step n="1" goal="Initialize Infrastructure Provisioning Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll help you provision cloud infrastructure for {target_environment} using Infrastructure as Code."</action>

  <action>Gather provisioning context:</action>
    - **Target Environment:** dev, staging, or production?
    - **Cloud Provider:** AWS, GCP, Azure, or DigitalOcean?
    - **Provisioning Goal:** New infrastructure, update existing, or destroy resources?

  <action>Set execution mode:</action>
    - **Plan Only (dry-run):** Generate plan without applying (recommended for first run)
    - **Interactive:** Step-by-step with confirmation (default)
    - **Automated:** Auto-apply changes (requires auto_approve flag)

  <action if="dry_run is true">
    <action>Set execution_mode = plan_only</action>
    <action>Display: "Running in DRY-RUN mode - no changes will be applied"</action>
  </action>

  <action>Verify prerequisites:</action>
    - IaC tool installed (Terraform, Pulumi, CDK, etc.)
    - Cloud provider CLI installed (aws, gcloud, az, doctl)
    - Credentials configured
    - Infrastructure code committed to git

  <action if="prerequisites not met">HALT: "Infrastructure provisioning prerequisites not met. Please ensure: (1) IaC tool installed, (2) Cloud CLI installed, (3) Credentials configured, (4) Infrastructure code committed."</action>
</step>

<step n="2" goal="Detect IaC Tool and Cloud Provider">
  <action>Auto-detect IaC tool by scanning for config files:</action>

  <iac-tool-detection>
    - **Terraform:** Check for *.tf files, terraform.tfvars, .terraform/
    - **Pulumi:** Check for Pulumi.yaml, Pulumi.{env}.yaml
    - **AWS CDK:** Check for cdk.json, package.json with @aws-cdk/* dependencies
    - **CloudFormation:** Check for *.template.json or *.template.yaml
    - **GCP Deployment Manager:** Check for *.jinja, *.py in deployment/
    - **Azure ARM:** Check for *.azuredeploy.json
    - **Azure Bicep:** Check for *.bicep files
  </iac-tool-detection>

  <action>Report detected IaC tool to user</action>

  <action if="iac_tool_override is provided">
    <action>Use iac_tool_override instead of auto-detected tool</action>
    <warn>IaC tool override detected. Using {iac_tool_override} instead of auto-detected tool.</warn>
  </action>

  <action if="no tool detected AND no override">
    <ask>⚠️ IaC tool auto-detection failed. Please specify tool manually:</ask>
    <options>
      - Terraform
      - Pulumi (specify language: TypeScript/Python/Go/.NET)
      - AWS CDK (specify language: TypeScript/Python/Java/.NET)
      - AWS CloudFormation
      - GCP Deployment Manager
      - Azure ARM Templates
      - Azure Bicep
    </options>
    <action if="user cannot specify tool">HALT: "Cannot proceed without knowing IaC tool. Please configure infrastructure code or provide tool details."</action>
  </action>

  <action>Verify IaC tool version and compatibility:</action>
    - Terraform: terraform version (>= 1.0 recommended)
    - Pulumi: pulumi version (>= 3.0 recommended)
    - AWS CDK: cdk --version (>= 2.0 recommended)

  <action>Detect cloud provider from IaC configuration:</action>
    - Terraform: Check provider blocks (aws, google, azurerm, digitalocean)
    - Pulumi: Check stack config or resource providers
    - CDK: Check imported modules (@aws-cdk/*, @pulumi/gcp, etc.)

  <action>Verify cloud provider matches user-specified provider</action>
  <action if="mismatch">WARN: "IaC configuration uses {detected_provider} but you specified {user_provider}. Proceeding with {detected_provider}."</action>
</step>

<step n="3" goal="Verify Cloud Credentials">
  <action>Verify cloud provider credentials are configured:</action>

  <cloud-provider name="AWS">
    <action>Check AWS credentials: aws sts get-caller-identity</action>
    <action>Display AWS account ID, user/role ARN</action>
    <action>Verify correct AWS account for target environment</action>
    <action if="wrong account">HALT: "AWS account mismatch. Expected {expected_account}, got {actual_account}. Update AWS_PROFILE or credentials."</action>
  </cloud-provider>

  <cloud-provider name="GCP">
    <action>Check GCP credentials: gcloud auth list</action>
    <action>Display active account and project ID</action>
    <action>Verify correct GCP project for target environment</action>
    <action if="wrong project">HALT: "GCP project mismatch. Expected {expected_project}, got {actual_project}. Run: gcloud config set project {expected_project}"</action>
  </cloud-provider>

  <cloud-provider name="Azure">
    <action>Check Azure credentials: az account show</action>
    <action>Display subscription ID and tenant ID</action>
    <action>Verify correct Azure subscription for target environment</action>
    <action if="wrong subscription">HALT: "Azure subscription mismatch. Expected {expected_subscription}, got {actual_subscription}. Run: az account set --subscription {expected_subscription}"</action>
  </cloud-provider>

  <cloud-provider name="DigitalOcean">
    <action>Check DigitalOcean token: doctl auth list</action>
    <action>Verify DIGITALOCEAN_TOKEN or DIGITALOCEAN_ACCESS_TOKEN env var set</action>
    <action if="no token">HALT: "DigitalOcean credentials not found. Set DIGITALOCEAN_ACCESS_TOKEN environment variable."</action>
  </cloud-provider>

  <action>Display credential verification summary</action>
  <action if="target_environment is production">
    <ask>⚠️ PRODUCTION INFRASTRUCTURE - You are about to provision production resources. Verify credentials are correct. Continue? [y/N]</ask>
    <action if="user declines">HALT: "Production infrastructure provisioning cancelled by user."</action>
  </action>
</step>

<step n="4" goal="Initialize IaC Tool and State Management">
  <iac-tool name="Terraform">
    <action>Initialize Terraform: terraform init</action>
    <action>Verify backend configuration for state storage:</action>
      - Local backend: terraform.tfstate (not recommended for production)
      - S3 backend: Check S3 bucket and DynamoDB table for state locking
      - GCS backend: Check GCS bucket for state storage
      - Azure backend: Check Azure Storage Account

    <action if="using local backend AND target_environment is production">
      <warn>⚠️ WARNING: Using local backend for production. Recommend migrating to remote backend (S3, GCS, Azure Storage) for state safety and team collaboration.</warn>
    </action>

    <action>Check for state lock:</action>
      - If state is locked: Display lock info (who locked, when)
      - If lock is stale: Offer to force-unlock (dangerous, confirm first)

    <action if="state locked">
      <ask>State is locked by {lock_owner} since {lock_time}. Force unlock? [y/N] (WARNING: Only if you're sure no other provision is running)</ask>
      <action if="yes">terraform force-unlock {lock_id}</action>
      <action if="no">HALT: "State is locked. Wait for other provision to complete or force-unlock if stale."</action>
    </action>

    <action>Create state backup before changes:</action>
      - terraform state pull > backup-{date}.tfstate
  </iac-tool>

  <iac-tool name="Pulumi">
    <action>Select Pulumi stack: pulumi stack select {environment}</action>
    <action>Verify stack backend:</action>
      - Pulumi Cloud (default)
      - Self-hosted (S3, Azure Blob, GCS)

    <action>Display current stack configuration</action>
    <action>Create state snapshot: pulumi stack export > backup-{date}.json</action>
  </iac-tool>

  <iac-tool name="AWS CDK">
    <action>Bootstrap CDK (if not already): cdk bootstrap aws://{account}/{region}</action>
    <action>Display CDK stack info: cdk list</action>
  </iac-tool>

  <iac-tool name="CloudFormation">
    <action>Check for existing stack: aws cloudformation describe-stacks --stack-name {stack_name}</action>
    <action if="stack exists">
      <action>Display current stack status and resources</action>
      <action>Provisioning will UPDATE existing stack</action>
    </action>
    <action if="stack not exists">
      <action>Provisioning will CREATE new stack</action>
    </action>
  </iac-tool>

  <action>State initialization complete</action>
</step>

<step n="5" goal="Generate Infrastructure Plan">
  <action>Generate infrastructure plan (dry-run to see what will change):</action>

  <iac-tool name="Terraform">
    <action>Generate plan: terraform plan -out=tfplan-{date}</action>
    <action>Save plan output to file for review</action>
    <action>Parse plan to extract resource changes:</action>
      - Resources to CREATE (green)
      - Resources to UPDATE/MODIFY (yellow)
      - Resources to DESTROY (red)
      - Resources UNCHANGED (gray)
  </iac-tool>

  <iac-tool name="Pulumi">
    <action>Preview changes: pulumi preview --diff</action>
    <action>Parse preview to extract resource changes</action>
  </iac-tool>

  <iac-tool name="AWS CDK">
    <action>Generate diff: cdk diff</action>
    <action>Parse diff to extract resource changes</action>
  </iac-tool>

  <iac-tool name="CloudFormation">
    <action>Create change set: aws cloudformation create-change-set --stack-name {stack_name} --template-body file://{template}</action>
    <action>Describe change set: aws cloudformation describe-change-set --change-set-name {change_set_name}</action>
    <action>Parse change set to extract resource changes</action>
  </iac-tool>

  <action>Display infrastructure plan summary:</action>

  ```
  INFRASTRUCTURE PLAN SUMMARY

  Resources to CREATE: {create_count}
  Resources to UPDATE: {update_count}
  Resources to DESTROY: {destroy_count}
  Resources UNCHANGED: {unchanged_count}

  Estimated Provision Time: {estimated_duration}
  ```

  <action>Display detailed changes by category:</action>
    - Networking (VPC, subnets, security groups, load balancers)
    - Compute (EC2, containers, serverless functions)
    - Storage (S3, EBS, databases)
    - Security (IAM roles, policies, secrets)
    - Monitoring (CloudWatch, alarms, dashboards)

  <action if="destroy_count > 0">
    <warn>⚠️ DESTRUCTIVE CHANGES DETECTED: {destroy_count} resources will be DESTROYED</warn>
    <action>Display resources to be destroyed</action>
    <action if="target_environment is production">
      <ask>⚠️ CRITICAL: About to destroy {destroy_count} PRODUCTION resources. Are you absolutely sure? Type 'DESTROY PRODUCTION RESOURCES' to confirm:</ask>
      <action if="user does not type exact phrase">HALT: "Production resource destruction cancelled. User did not provide explicit confirmation."</action>
    </action>
  </action>
</step>

<step n="6" goal="Estimate Infrastructure Costs">
  <action>Estimate monthly infrastructure costs:</action>

  <cost-estimation>
    <tool name="Infracost" if="infracost installed">
      <action>Run cost estimation: infracost breakdown --path .</action>
      <action>Parse output to extract monthly cost estimate</action>
      <action>Display cost breakdown by resource type</action>
    </tool>

    <tool name="Manual Estimation" if="infracost not available">
      <action>Estimate costs based on resource types:</action>
        - Compute instances: {instance_type} × {instance_count} × {hours_per_month} × {rate}
        - Storage: {storage_gb} × {storage_rate_per_gb}
        - Data transfer: Estimate based on usage patterns
        - Managed services: Lookup pricing for databases, caches, etc.

      <warn>Manual cost estimation is approximate. Consider installing Infracost for accurate pricing.</warn>
    </tool>
  </cost-estimation>

  <action>Display cost estimate summary:</action>

  ```
  ESTIMATED MONTHLY COST

  Compute:        ${compute_cost}
  Storage:        ${storage_cost}
  Networking:     ${networking_cost}
  Data Transfer:  ${transfer_cost}
  Managed Services: ${services_cost}
  -----------------------------------
  TOTAL:          ${total_monthly_cost}/month

  Annual Cost:    ${annual_cost}/year
  ```

  <action if="cost_budget_limit is set AND total_monthly_cost > cost_budget_limit">
    <warn>⚠️ COST ALERT: Estimated cost ${total_monthly_cost}/month EXCEEDS budget limit of ${cost_budget_limit}/month</warn>
    <ask>Proceed anyway? [y/N]</ask>
    <action if="no">HALT: "Infrastructure provisioning cancelled due to cost budget exceeded."</action>
  </action>

  <action if="target_environment is production">
    <action>Recommend setting up cost alerts and budgets in cloud provider</action>
  </action>
</step>

<step n="7" goal="Security Validation">
  <action>Execute pre-provision security checklist from: {checklist}</action>

  <security-checks>
    <check category="IAM and Access Control">
      <action>Verify least-privilege IAM policies</action>
      <action>Check for overly permissive policies (*, admin access)</action>
      <action>Validate service account permissions</action>
      <action if="found overly permissive">WARN: "Found overly permissive IAM policies. Review before provisioning."</action>
    </check>

    <check category="Network Security">
      <action>Verify security groups/firewall rules:</action>
        - Check for 0.0.0.0/0 ingress on sensitive ports (SSH, RDP, databases)
        - Validate VPC isolation
        - Verify private subnet configuration for databases
      <action if="found open ingress">WARN: "Found security group rules with 0.0.0.0/0 ingress. Recommend restricting access."</action>
    </check>

    <check category="Encryption">
      <action>Verify encryption at rest:</action>
        - S3 buckets: Encryption enabled
        - EBS volumes: Encryption enabled
        - RDS databases: Encryption enabled
        - Secrets: Using KMS or cloud secret manager
      <action if="unencrypted resources found">WARN: "Found unencrypted resources. Strongly recommend enabling encryption for {resource_list}."</action>
    </check>

    <check category="Public Exposure">
      <action>Check for publicly accessible resources:</action>
        - S3 buckets with public read/write
        - Databases with public IP addresses
        - Load balancers without authentication
      <action if="found public exposure">WARN: "Found publicly exposed resources: {resource_list}. Verify this is intentional."</action>
    </check>

    <check category="Compliance">
      <action>Tag validation:</action>
        - Check all resources have required tags (environment, owner, project, cost-center)
        - Verify compliance tags for regulated industries
      <action if="missing tags">WARN: "Some resources missing required tags. Add tags for cost allocation and governance."</action>
    </check>
  </security-checks>

  <action>Generate security validation report</action>
  <action>Display critical security findings</action>

  <action if="critical security issues found">
    <ask>⚠️ SECURITY ISSUES FOUND: {critical_count} critical security issues detected. Proceed anyway? [y/N]</ask>
    <action if="no">HALT: "Infrastructure provisioning cancelled due to security issues."</action>
  </action>
</step>

<step n="8" goal="Execute Infrastructure Provisioning">
  <action if="execution_mode is plan_only">
    <action>Display: "DRY-RUN COMPLETE - No changes applied"</action>
    <action>Save plan to file: {output_folder}/infrastructure-plan-{date}.md</action>
    <action>Skip to step 10 (skip actual provisioning)</action>
  </action>

  <action>Display provision execution plan:</action>
    - IaC Tool: {detected_tool}
    - Cloud Provider: {cloud_provider}
    - Environment: {target_environment}
    - Resources to CREATE: {create_count}
    - Resources to UPDATE: {update_count}
    - Resources to DESTROY: {destroy_count}
    - Estimated Cost: ${total_monthly_cost}/month
    - Estimated Duration: {estimated_duration}

  <action if="auto_approve is NOT true">
    <ask>Execute infrastructure provisioning now? [Y/n]</ask>
    <action if="user declines">HALT: "Infrastructure provisioning cancelled by user."</action>
  </action>

  <action>Start provision timer</action>

  <iac-tool name="Terraform">
    <action>Apply plan: terraform apply tfplan-{date}</action>
    <action>Monitor apply progress in real-time</action>
    <action>Capture terraform output for resource IDs and connection details</action>
  </iac-tool>

  <iac-tool name="Pulumi">
    <action>Apply changes: pulumi up --yes (if auto_approve) OR pulumi up</action>
    <action>Monitor update progress</action>
    <action>Capture stack outputs</action>
  </iac-tool>

  <iac-tool name="AWS CDK">
    <action>Deploy stack: cdk deploy --require-approval never (if auto_approve) OR cdk deploy</action>
    <action>Monitor deployment</action>
    <action>Capture CloudFormation outputs</action>
  </iac-tool>

  <iac-tool name="CloudFormation">
    <action>Execute change set: aws cloudformation execute-change-set --change-set-name {change_set_name}</action>
    <action>Wait for stack completion: aws cloudformation wait stack-create-complete OR stack-update-complete</action>
    <action>Monitor stack events in real-time</action>
  </iac-tool>

  <action>Monitor provisioning progress with live updates</action>
  <action>Capture detailed logs</action>
  <action>Record provision duration</action>

  <action if="provision fails">
    <action>Capture error logs and failed resource details</action>
    <action>Display failure reason</action>
    <action>Recommend rollback or manual cleanup</action>
    <action>HALT: "Infrastructure provisioning failed. Check logs for details. Manual intervention may be required."</action>
  </action>

  <action if="provision succeeds">
    <action>Capture completion timestamp</action>
    <action>Extract resource IDs, endpoints, and connection details</action>
    <action>Display success message</action>
  </action>
</step>

<step n="9" goal="Generate Resource Inventory">
  <action>Generate comprehensive resource inventory:</action>

  <iac-tool name="Terraform">
    <action>List all resources: terraform state list</action>
    <action>Get resource details: terraform state show {resource_address} (for each resource)</action>
    <action>Extract resource IDs, ARNs, endpoints</action>
    <action>Capture terraform outputs: terraform output -json</action>
  </iac-tool>

  <iac-tool name="Pulumi">
    <action>Export stack state: pulumi stack export</action>
    <action>Get stack outputs: pulumi stack output --json</action>
    <action>Extract resource URNs and IDs</action>
  </iac-tool>

  <iac-tool name="CloudFormation">
    <action>Describe stack resources: aws cloudformation describe-stack-resources --stack-name {stack_name}</action>
    <action>Get stack outputs: aws cloudformation describe-stacks --stack-name {stack_name} --query 'Stacks[0].Outputs'</action>
  </iac-tool>

  <action>Compile resource inventory with categories:</action>

  ```markdown
  # Infrastructure Resource Inventory

  ## Environment: {target_environment}
  ## Provisioned: {provision_timestamp}
  ## Total Resources: {total_resource_count}

  ### Networking
  - VPC: {vpc_id} ({vpc_cidr})
  - Subnets: {subnet_list}
  - Load Balancer: {lb_dns_name}
  - Security Groups: {sg_list}

  ### Compute
  - Instances: {instance_list}
  - Auto Scaling Groups: {asg_list}
  - Containers/Functions: {container_list}

  ### Storage
  - S3 Buckets: {bucket_list}
  - EBS Volumes: {volume_list}
  - Databases: {db_endpoint_list}

  ### Security
  - IAM Roles: {role_list}
  - KMS Keys: {key_list}
  - Secrets: {secret_list}

  ### Monitoring
  - CloudWatch Alarms: {alarm_list}
  - Log Groups: {log_group_list}

  ### Outputs
  {outputs_json}
  ```

  <action>Save resource inventory to: {output_folder}/infrastructure-inventory-{environment}-{date}.md</action>
  <action>Display inventory location</action>
</step>

<step n="10" goal="Post-Provision Validation">
  <action>Validate provisioned infrastructure:</action>

  <validation-checks>
    <check name="Resource Creation">
      <action>Verify all planned resources were created successfully</action>
      <expect>Created resource count matches plan</expect>
      <action if="mismatch">WARN: "Some resources failed to create. Check logs for details."</action>
    </check>

    <check name="Connectivity">
      <action>Test connectivity to key resources:</action>
        - Load balancer health checks
        - Database connection tests
        - API endpoint reachability
      <expect>All key resources are accessible</expect>
      <action if="fails">WARN: "Some resources not accessible. Check security groups and network configuration."</action>
    </check>

    <check name="Security Compliance">
      <action>Re-run security validation on provisioned resources</action>
      <expect>No new security issues introduced</expect>
      <action if="fails">WARN: "Post-provision security scan found issues. Review and remediate."</action>
    </check>

    <check name="Cost Validation">
      <action>Verify actual cost aligns with estimate (if cloud provider billing API available)</action>
      <action>Set up cost alerts and budgets in cloud provider</action>
    </check>
  </validation-checks>

  <action>Generate post-provision validation report</action>
  <action>Display validation results</action>

  <action if="critical validation failures">
    <warn>⚠️ POST-PROVISION VALIDATION FAILED: Some resources may not be functioning correctly.</warn>
    <action>Recommend investigation and potential rollback</action>
  </action>
</step>

<step n="11" goal="Generate Provision Log">
  <action>Compile comprehensive provision log:</action>

  <section name="Provision Summary">
    - Environment: {target_environment}
    - Cloud Provider: {cloud_provider}
    - IaC Tool: {detected_tool}
    - Provisioned By: {user_name}
    - Timestamp: {provision_timestamp}
    - Duration: {provision_duration}
    - Status: ✅ SUCCESS
  </section>

  <section name="Resources Created">
    - Total Resources: {total_resource_count}
    - By Category: {resource_breakdown}
    - See full inventory: {inventory_file_location}
  </section>

  <section name="Cost Estimate">
    - Monthly Cost: ${total_monthly_cost}
    - Annual Cost: ${annual_cost}
    - Cost Breakdown: {cost_by_category}
  </section>

  <section name="Security Validation">
    - Critical Issues: {critical_count}
    - Warnings: {warning_count}
    - Recommendations: {recommendation_count}
  </section>

  <section name="Next Steps">
    - Configure monitoring and alerting
    - Set up cost budgets and alerts
    - Deploy application to provisioned infrastructure
    - Run security hardening scripts (if applicable)
    - Document infrastructure architecture
  </section>

  <action>Save provision log to: {default_output_file}</action>
  <action>Display provision log location</action>
</step>

<step n="12" goal="Complete Infrastructure Provisioning">
  <action>Display provision completion summary:</action>

  ```
  ✅ INFRASTRUCTURE PROVISIONING COMPLETE

  Environment: {target_environment}
  Cloud Provider: {cloud_provider}
  IaC Tool: {detected_tool}

  Resources Created: {create_count} ✅
  Resources Updated: {update_count} ✅
  Resources Destroyed: {destroy_count} ✅

  Estimated Monthly Cost: ${total_monthly_cost}

  Resource Inventory: {inventory_location}
  Provision Log: {log_location}

  Next Steps:
  - Review resource inventory for connection details
  - Configure monitoring (*monitoring-setup from Diana)
  - Set up cost alerts in cloud provider console
  - Deploy application (*deploy from Diana)
  - Run security hardening if needed

  Infrastructure is ready for deployment! 🚀
  ```

  <action>Offer post-provision actions:</action>
    - View resource inventory
    - View provision log
    - Configure monitoring (invoke monitoring-setup workflow)
    - Deploy application (invoke deployment workflow)
    - Return to agent menu

  <action>Workflow complete ✅</action>
</step>

</workflow>
