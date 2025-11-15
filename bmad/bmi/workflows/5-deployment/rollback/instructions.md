# Rollback - Deployment Rollback Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/rollback/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>ROLLBACK URGENCY: This workflow handles critical rollback situations. Execute quickly but safely. Verify each step. Production stability is paramount.</critical>

<workflow>

<step n="1" goal="Initialize Rollback Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll help you safely rollback {target_environment} deployment."</action>

  <action>Assess urgency level:</action>
    - **Emergency:** Production down, users impacted (fast-track mode)
    - **Urgent:** Critical bug detected, needs immediate rollback
    - **Planned:** Controlled rollback for quality issues

  <action>Gather rollback context:</action>
    - **Target Environment:** dev, staging, or production?
    - **Rollback Reason:** What triggered this rollback? (deployment failure, critical bug, performance degradation, security issue)
    - **Incident Severity:** How critical is this issue?

  <action>Load deployment status file:</action>
    - Read: {project-root}/bmad/bmi/data/deployment-status.yaml
    - Identify current deployment (version, timestamp, deployed_by)
    - Identify previous stable deployment
    - Display rollback target version

  <action if="no previous deployment found">HALT: "No previous deployment found for {target_environment}. Cannot rollback to non-existent version. Investigate and fix current deployment manually."</action>

  <action if="urgency is Emergency">
    <action>Skip to fast-track confirmation (minimize delay)</action>
    <action>Set execution_mode = emergency</action>
  </action>

  <action if="urgency is NOT Emergency">
    <ask>⚠️ ROLLBACK CONFIRMATION - Rolling back {target_environment} from {current_version} to {previous_version}. Continue? [y/N]</ask>
    <action if="user declines">HALT: "Rollback cancelled by user."</action>
  </action>

  <action>Start rollback timer (track duration for incident response)</action>
</step>

<step n="2" goal="Detect Platform and Rollback Strategy">
  <action>Auto-detect deployment platform (same logic as deployment workflow):</action>
    - Vercel, Railway, Render, Netlify, Heroku
    - DigitalOcean, AWS, GCP, Azure
    - Kubernetes, Docker, Fly.io, etc.

  <action>Determine rollback strategy based on platform:</action>

  <strategy name="Blue-Green Deployment">
    <applies-to>Vercel, Railway, some cloud platforms</applies-to>
    <action>Switch traffic back to previous (green) deployment</action>
    <action>Previous version already running - instant rollback</action>
  </strategy>

  <strategy name="Canary Deployment">
    <applies-to>Kubernetes, some cloud platforms with traffic splitting</applies-to>
    <action>Stop canary rollout (0% traffic to new version)</action>
    <action>Route 100% traffic to stable version</action>
  </strategy>

  <strategy name="Recreate">
    <applies-to>Heroku, some PaaS platforms</applies-to>
    <action>Redeploy previous version</action>
    <action>Downtime during redeployment</action>
  </strategy>

  <strategy name="Rolling Update">
    <applies-to>Kubernetes, ECS, Docker Swarm</applies-to>
    <action>Rolling update back to previous version</action>
    <action>Gradual rollback with zero downtime</action>
  </strategy>

  <action>Display rollback strategy: "Using {strategy} rollback for {platform}"</action>
  <action>Estimate rollback duration based on strategy</action>
</step>

<step n="3" goal="Pre-Rollback Verification">
  <action>Verify rollback prerequisites:</action>

  <check category="Previous Version Availability">
    <action>Verify previous deployment artifacts exist:</action>
      - Container image available in registry
      - Build artifacts accessible
      - Source code tagged in git
    <action if="artifacts missing">HALT: "Previous version artifacts not found. Cannot rollback without deployment artifacts."</action>
  </check>

  <check category="Database Backup">
    <action>Check if database was modified since last deployment</action>
    <action>Identify pending rollback migrations</action>
    <action if="migrations run since last deployment">
      <warn>⚠️ Database migrations were applied. Database rollback required.</warn>
      <action>Create database backup BEFORE rollback</action>
      <action>Verify backup completed successfully</action>
    </action>
  </check>

  <check category="Impact Assessment">
    <action>Estimate rollback impact:</action>
      - Expected downtime: {estimated_downtime}
      - Users affected: {estimated_users}
      - Features that will be reverted: {reverted_features}
    <action>Display impact summary to user</action>
  </check>

  <action>Execute pre-rollback checklist from: {checklist}</action>
  <action if="critical checks failed">HALT: "Pre-rollback verification failed. Address issues before rolling back."</action>
</step>

<step n="4" goal="Notify Stakeholders">
  <action if="target_environment is production">
    <action>Generate rollback notification:</action>
      - Subject: "🚨 ROLLBACK IN PROGRESS - {target_environment}"
      - Body: "Rolling back {target_environment} from {current_version} to {previous_version}. Reason: {rollback_reason}. ETA: {estimated_duration}."

    <action>Recommend notification channels:</action>
      - Status page: Post incident update
      - Slack: Alert deployment channel
      - Email: Notify stakeholders
      - PagerDuty/OpsGenie: Trigger incident (if not already triggered)

    <action>Display notification message for user to send</action>
  </action>

  <action if="urgency is Emergency">
    <action>Send notifications BEFORE rollback (parallel action)</action>
  </action>

  <action if="urgency is NOT Emergency">
    <ask>Send stakeholder notifications now? [Y/n]</ask>
  </action>
</step>

<step n="5" goal="Execute Application Rollback">
  <action>Display rollback plan:</action>
    - Platform: {detected_platform}
    - Strategy: {rollback_strategy}
    - Current Version: {current_version}
    - Target Version: {previous_version}
    - Estimated Downtime: {estimated_downtime}

  <action if="execution_mode is NOT emergency">
    <ask>Execute rollback now? [Y/n]</ask>
    <action if="user declines">HALT: "Rollback cancelled by user."</action>
  </action>

  <platform-specific-rollback>
    <platform name="Vercel">
      <action>List deployments: vercel ls</action>
      <action>Promote previous deployment: vercel promote {previous_deployment_url}</action>
      <action>Instant traffic switch (blue-green)</action>
    </platform>

    <platform name="Railway">
      <action>Identify previous deployment ID</action>
      <action>Rollback: railway rollback {previous_deployment_id}</action>
    </platform>

    <platform name="Render">
      <action>Trigger rollback via Render API</action>
      <action>Specify previous deployment commit SHA</action>
    </platform>

    <platform name="Netlify">
      <action>Restore previous production deploy: netlify rollback</action>
    </platform>

    <platform name="Heroku">
      <action>List releases: heroku releases</action>
      <action>Rollback to previous: heroku rollback {previous_release}</action>
      <action>Monitor dyno restart</action>
    </platform>

    <platform name="AWS Elastic Beanstalk">
      <action>eb use {environment_name}</action>
      <action>eb rollback OR eb deploy {previous_version}</action>
    </platform>

    <platform name="AWS ECS">
      <action>Update service to use previous task definition</action>
      <action>aws ecs update-service --task-definition {previous_task_def}</action>
      <action>Monitor task rollout</action>
    </platform>

    <platform name="GCP App Engine">
      <action>List versions: gcloud app versions list</action>
      <action>Route traffic to previous: gcloud app services set-traffic --splits {previous_version}=1</action>
    </platform>

    <platform name="GCP Cloud Run">
      <action>Update traffic to previous revision</action>
      <action>gcloud run services update-traffic --to-revisions {previous_revision}=100</action>
    </platform>

    <platform name="Kubernetes">
      <action>Rollback deployment: kubectl rollout undo deployment/{app_name}</action>
      <action>OR specify revision: kubectl rollout undo deployment/{app_name} --to-revision={revision_number}</action>
      <action>Monitor rollout: kubectl rollout status deployment/{app_name}</action>
      <action>Verify pods are healthy: kubectl get pods</action>
    </platform>

    <platform name="Docker Swarm">
      <action>Update service to previous image: docker service update --image {previous_image} {service_name}</action>
      <action>Monitor rollout: docker service ps {service_name}</action>
    </platform>
  </platform-specific-rollback>

  <action>Monitor rollback progress in real-time</action>
  <action>Capture rollback logs</action>
  <action>Record rollback duration</action>

  <action if="rollback fails">
    <action>Capture error logs</action>
    <action>Display failure reason</action>
    <action>Escalate to manual intervention</action>
    <action>HALT: "Automatic rollback failed. Manual intervention required. Check logs for details."</action>
  </action>

  <action if="rollback succeeds">
    <action>Capture rollback completion timestamp</action>
    <action>Display success message</action>
  </action>
</step>

<step n="6" goal="Rollback Database Migrations">
  <action if="skip_database_rollback is true">
    <warn>⚠️ Database rollback skipped (as requested). Database schema may be inconsistent with application code.</warn>
    <action>Skip to step 7</action>
  </action>

  <action if="no migrations to rollback">
    <action>Skip to step 7 (no database changes since last deployment)</action>
  </action>

  <action if="migrations applied since last deployment">
    <warn>⚠️ CRITICAL: Database migrations need to be rolled back. This is a sensitive operation.</warn>

    <action>Create database backup (timestamp: {date})</action>
    <action>Verify backup completed successfully</action>

    <action>Identify migrations to rollback:</action>
      - List migrations applied since previous deployment
      - Display migration list to user
      - Estimate rollback duration

    <ask if="target_environment is production">⚠️ Rollback {migration_count} database migrations? This may result in data loss. Continue? [y/N]</ask>
    <action if="user declines">
      <warn>Database rollback declined. Application and database schema may be incompatible.</warn>
      <action>Skip to step 7</action>
    </action>

    <action>Execute database rollback based on detected migration tool:</action>

      <tool name="Prisma">
        <action>Prisma does not support automated rollback migrations</action>
        <action>Manual intervention required: Create down migration or restore from backup</action>
        <recommend>Restore database from backup created before deployment</recommend>
      </tool>

      <tool name="Knex">
        <action>Rollback migrations: npx knex migrate:rollback --all</action>
        <action>OR rollback specific batch: npx knex migrate:rollback</action>
      </tool>

      <tool name="TypeORM">
        <action>Revert migrations: npm run typeorm migration:revert</action>
        <action>May need to run multiple times for all migrations</action>
      </tool>

      <tool name="Sequelize">
        <action>Undo migrations: npx sequelize-cli db:migrate:undo:all</action>
        <action>OR undo specific migration: npx sequelize-cli db:migrate:undo</action>
      </tool>

      <tool name="Django">
        <action>python manage.py migrate {app_name} {previous_migration}</action>
      </tool>

      <tool name="Rails">
        <action>rails db:rollback STEP={migration_count}</action>
      </tool>

      <tool name="Alembic">
        <action>alembic downgrade {previous_revision}</action>
      </tool>

      <tool name="Drizzle">
        <action>Drizzle Kit: Manual rollback or restore from backup</action>
        <recommend>Restore database from backup</recommend>
      </tool>

    <action>Monitor migration rollback execution</action>
    <action>Capture migration logs</action>

    <action if="migration rollback fails">
      <action>Capture error details</action>
      <warn>⚠️ CRITICAL: Database migration rollback failed!</warn>
      <action>Restore database from backup</action>
      <action if="restore fails">HALT: "Database migration rollback failed AND backup restore failed. CRITICAL DATABASE STATE. Escalate immediately."</action>
      <action if="restore succeeds">
        <action>Database restored from backup</action>
        <action>Continue to verification</action>
      </action>
    </action>

    <action if="migration rollback succeeds">
      <action>Verify database schema matches expected state</action>
      <action>Record migration rollback success</action>
    </action>
  </action>
</step>

<step n="7" goal="Post-Rollback Verification">
  <action>Wait for rollback to stabilize (30 seconds)</action>

  <verification-tests>
    <test name="Health Check">
      <action>GET {deployment_url}/health OR {deployment_url}/api/health</action>
      <expect>HTTP 200 OK</expect>
      <action if="fails">CRITICAL: Health check endpoint not responding after rollback</action>
    </test>

    <test name="Homepage Load">
      <action>GET {deployment_url}/</action>
      <expect>HTTP 200 OK, page loads correctly</expect>
      <action if="fails">CRITICAL: Homepage not loading after rollback</action>
    </test>

    <test name="Database Connectivity">
      <action>Verify database connection via health endpoint or test query</action>
      <expect>Database connection successful with correct schema</expect>
      <action if="fails">CRITICAL: Database not accessible or schema mismatch after rollback</action>
    </test>

    <test name="Core Functionality">
      <action>Test critical user workflows (login, key features)</action>
      <expect>Core functionality working correctly</expect>
      <action if="fails">WARNING: Some functionality not working after rollback</action>
    </test>

    <test name="Performance">
      <action>Check response times are acceptable</action>
      <expect>Performance within SLA thresholds</expect>
      <action if="fails">WARNING: Performance degradation after rollback</action>
    </test>
  </verification-tests>

  <action>Generate post-rollback verification report</action>
  <action>Display results: X/Y tests passed</action>

  <action if="critical verification tests failed">
    <action>Display failed tests</action>
    <warn>⚠️ CRITICAL: Post-rollback verification failed. Application may still be in degraded state.</warn>
    <action>Escalate to manual investigation</action>
    <action>Consider emergency hotfix or further rollback</action>
  </action>

  <action if="all tests passed">
    <action>✅ Post-rollback verification successful</action>
    <action>Previous stable version restored and operational</action>
  </action>
</step>

<step n="8" goal="Update Deployment Status">
  <action>Load deployment status file: {project-root}/bmad/bmi/data/deployment-status.yaml</action>

  <action>Update environment status:</action>
    - status: "active"
    - url: "{deployment_url}"
    - last_deployment:
        - version: "{previous_version}" (reverted)
        - timestamp: "{rollback_timestamp}"
        - deployed_by: "{user_name}" (rollback executor)
        - rollback_reason: "{rollback_reason}"

  <action>Append to rollback_history array:</action>
    - id: "rollback-{date}-{sequence}"
    - from_version: "{current_version}"
    - to_version: "{previous_version}"
    - environment: "{target_environment}"
    - reason: "{rollback_reason}"
    - triggered_by: "{user_name}"
    - triggered_at: "{rollback_timestamp}"
    - duration_seconds: "{rollback_duration}"
    - status: "success"
    - database_rolled_back: {true/false}
    - verification_passed: {true/false}

  <action>Update DORA metrics:</action>
    - Increment change_failure_rate (deployment that required rollback)
    - Record MTTR (mean time to recovery) = time from deployment to rollback completion

  <action>Save updated deployment-status.yaml</action>
</step>

<step n="9" goal="Generate Incident Report">
  <action>Compile incident report with sections:</action>

  <section name="Incident Summary">
    - Incident ID: incident-{date}
    - Environment: {target_environment}
    - Severity: {incident_severity}
    - Detected At: {detection_timestamp}
    - Resolved At: {rollback_completion_timestamp}
    - Duration: {incident_duration}
    - MTTR: {mean_time_to_recovery}
  </section>

  <section name="Rollback Details">
    - Rolled Back From: {current_version}
    - Rolled Back To: {previous_version}
    - Platform: {detected_platform}
    - Rollback Strategy: {rollback_strategy}
    - Rollback Duration: {rollback_duration}
    - Database Rolled Back: {true/false}
  </section>

  <section name="Root Cause">
    - Rollback Reason: {rollback_reason}
    - Contributing Factors: {contributing_factors}
    - Detection Method: {how_was_issue_detected}
  </section>

  <section name="Impact Assessment">
    - Users Affected: {estimated_users}
    - Downtime: {total_downtime}
    - Features Impacted: {impacted_features}
    - Data Loss: {any_data_loss}
  </section>

  <section name="Resolution">
    - Resolution: Rolled back to previous stable version
    - Verification: {verification_results}
    - Current Status: {current_status}
  </section>

  <section name="Next Steps">
    - Root cause analysis required
    - Fix deployment issue before redeploying
    - Update test coverage to catch similar issues
    - Review deployment process for improvements
  </section>

  <action>Save incident report to: {output_folder}/incident-report-{date}.md</action>
  <action>Display incident report location</action>
</step>

<step n="10" goal="Notify Stakeholders of Resolution">
  <action if="target_environment is production">
    <action>Generate resolution notification:</action>
      - Subject: "✅ ROLLBACK COMPLETE - {target_environment} Restored"
      - Body: "Rollback complete. {target_environment} restored to {previous_version}. Verification passed. Incident duration: {incident_duration}. Root cause analysis in progress."

    <action>Recommend notification channels:</action>
      - Status page: Update incident as resolved
      - Slack: Alert deployment channel
      - Email: Notify stakeholders
      - PagerDuty/OpsGenie: Resolve incident

    <action>Display notification message for user to send</action>
  </action>

  <action if="target_environment is staging OR dev">
    <action>Log rollback completion (no external notifications for non-production)</action>
  </action>
</step>

<step n="11" goal="Complete Rollback">
  <action>Display rollback completion summary:</action>

  ```
  ✅ ROLLBACK COMPLETE

  Environment: {target_environment}
  Rolled Back From: {current_version}
  Rolled Back To: {previous_version}
  Duration: {rollback_duration}

  Database Rollback: {true/false} ✅
  Verification: {passed_count}/{test_count} passed ✅

  Incident Report: {incident_report_location}

  Next Steps:
  - Investigate root cause of deployment failure
  - Fix issues before redeploying
  - Review and update deployment process
  - Update monitoring and alerting to catch similar issues earlier

  Status: {target_environment} is stable and operational
  ```

  <action>Offer post-rollback actions:</action>
    - View rollback logs
    - View incident report
    - Investigate failed deployment (root cause analysis)
    - Update monitoring (if issue wasn't detected early enough)
    - Return to agent menu

  <action>Workflow complete ✅</action>
</step>

</workflow>
