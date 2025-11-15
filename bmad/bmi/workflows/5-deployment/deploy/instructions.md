# Deploy - Application Deployment Instructions

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {project-root}/bmad/bmi/workflows/5-deployment/deploy/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language} and language MUST be tailored to {user_skill_level}</critical>
<critical>Generate all documents in {document_output_language}</critical>

<critical>DEPLOYMENT SAFETY: This workflow handles production deployments. Follow all safety checks, obtain required approvals, and maintain rollback capability at all times.</critical>

<workflow>

<step n="1" goal="Initialize Deployment Context">
  <action>Greet user: "I'm Diana, your DevOps Engineer. I'll help you deploy to {target_environment} safely and reliably."</action>

  <action>Gather deployment context:</action>
    - **Target Environment:** dev, staging, or production?
    - **Deployment Trigger:** What triggered this deployment? (git merge, manual request, hotfix, rollback)
    - **Story/Epic ID:** What feature or fix is being deployed? (if applicable)

  <action>Load deployment status file:</action>
    - Read: {project-root}/bmad/bmi/data/deployment-status.yaml (or create if doesn't exist)
    - Display current deployment status for target environment
    - Show last successful deployment timestamp and version

  <action>Verify prerequisites:</action>
    - Git repository is clean (no uncommitted changes)
    - Latest code is pushed to remote
    - All tests passed (check CI/CD status if available)
    - Build artifacts are ready

  <action if="prerequisites not met">HALT: "Deployment prerequisites not met. Please ensure: (1) Code is committed and pushed, (2) All tests passing, (3) Build successful. Address these issues before deploying."</action>

  <action if="target_environment is production AND require_approval_for contains production">
    <ask>⚠️ PRODUCTION DEPLOYMENT - Requires explicit approval. Type 'DEPLOY TO PRODUCTION' to confirm:</ask>
    <action if="user does not type exact phrase">HALT: "Production deployment cancelled. User did not provide explicit approval."</action>
  </action>
</step>

<step n="2" goal="Detect Deployment Platform">
  <action>Auto-detect deployment platform by scanning for config files:</action>

  <platform-detection>
    - **Vercel:** Check for vercel.json or vercel.app domain
    - **Railway:** Check for railway.json or railway.toml
    - **Render:** Check for render.yaml
    - **Netlify:** Check for netlify.toml
    - **Heroku:** Check for Procfile or heroku.yml
    - **DigitalOcean App Platform:** Check for .do/app.yaml
    - **AWS:** Check for .aws/config, cloudformation/, or cdk/
    - **GCP:** Check for app.yaml, cloudbuild.yaml, or .gcp/
    - **Azure:** Check for azure-pipelines.yml or .azure/
    - **Kubernetes:** Check for k8s/, kubernetes/, or helm/
    - **Docker:** Check for Dockerfile or docker-compose.yml
    - **Fly.io:** Check for fly.toml
    - **Cloudflare Pages:** Check for wrangler.toml
    - **GitHub Pages:** Check for .github/workflows with pages deployment
    - **GitLab Pages:** Check for .gitlab-ci.yml with pages deployment
  </platform-detection>

  <action>Report detected platform to user</action>

  <action if="platform_override is provided">
    <action>Use platform_override instead of auto-detected platform</action>
    <action>Warn user: "Platform override detected. Using {platform_override} instead of auto-detected platform."</action>
  </action>

  <action if="no platform detected AND no override">
    <ask>⚠️ Platform auto-detection failed. Please specify deployment platform manually:</ask>
    <options>
      - Vercel
      - Railway
      - Render
      - Netlify
      - Heroku
      - DigitalOcean
      - AWS (specify service: EC2, ECS, Lambda, Elastic Beanstalk, Amplify)
      - GCP (specify service: App Engine, Cloud Run, GKE, Compute Engine)
      - Azure (specify service: App Service, Container Apps, AKS, Functions)
      - Kubernetes (self-managed)
      - Docker (self-managed)
      - Fly.io
      - Cloudflare Pages
      - Other (manual deployment)
    </options>
    <action if="user cannot specify platform">HALT: "Cannot proceed without knowing deployment platform. Please configure deployment or provide platform details."</action>
  </action>

  <action>Load platform-specific deployment configuration</action>
  <action>Verify platform CLI tools are installed (vercel CLI, railway CLI, aws CLI, etc.)</action>
  <action if="CLI not installed">Provide installation instructions for platform CLI</action>
</step>

<step n="3" goal="Pre-Deployment Checks">
  <action>Execute pre-deployment checklist from: {checklist}</action>

  <check category="Security">
    <action>Verify secrets management:</action>
      - Check secrets provider: {secrets_provider}
      - Validate environment variables are set
      - Ensure no secrets in code (scan for API keys, passwords, tokens)
      - Verify SSL/TLS certificates are valid
    <action if="secrets missing or exposed">HALT: "Security check failed. Secrets are missing or exposed in code. Fix before deploying."</action>
  </check>

  <check category="Database">
    <action if="auto_run_migrations is true">
      <action>Detect database migration tool:</action>
        - Prisma (prisma/migrations/)
        - Drizzle (drizzle/)
        - Knex (migrations/)
        - TypeORM (migration/)
        - Sequelize (migrations/)
        - Django (manage.py migrate)
        - Rails (db/migrate)
        - Alembic (alembic/)

      <action if="migrations detected">
        <action>Create database backup before running migrations</action>
        <action>Show migration plan (pending migrations)</action>
        <ask if="target_environment is production">⚠️ Run {migration_count} migrations on production database? [y/N]</ask>
        <action if="user declines">HALT: "Migrations required but user declined. Cannot deploy without applying migrations."</action>
      </action>
    </action>
  </check>

  <check category="Build">
    <action>Verify build artifacts:</action>
      - Check build output directory exists (dist/, build/, out/, .next/)
      - Verify build size is reasonable (warn if >50MB for web apps)
      - Check for build warnings or errors
    <action if="build artifacts missing">
      <ask>Build artifacts not found. Run build now? [y/N]</ask>
      <action if="yes">Execute build command (npm run build, yarn build, etc.)</action>
      <action if="no OR build fails">HALT: "Build artifacts required for deployment. Build failed or was declined."</action>
    </action>
  </check>

  <check category="Performance">
    <action if="target_environment is production">
      <action>Check for performance budgets in config</action>
      <action>Validate bundle size against budget</action>
      <action if="budget exceeded">WARN: "Performance budget exceeded. Continue anyway? [y/N]"</action>
    </action>
  </check>

  <check category="Dependencies">
    <action>Verify dependency installation:</action>
      - Check package-lock.json or yarn.lock is committed
      - Scan for known vulnerabilities (npm audit, yarn audit)
      - Check for outdated critical dependencies
    <action if="high/critical vulnerabilities found">
      <warn>⚠️ Security vulnerabilities detected. Review before deploying to production.</warn>
      <ask if="target_environment is production">Continue deployment with known vulnerabilities? [y/N]</ask>
    </action>
  </check>

  <action>Generate pre-deployment report summary</action>
  <action>Display: All checks passed ✅ OR List failed checks ❌</action>
  <action if="critical checks failed">HALT: "Pre-deployment checks failed. Address issues before continuing."</action>
</step>

<step n="4" goal="Execute Deployment">
  <action>Display deployment plan:</action>
    - Platform: {detected_platform}
    - Environment: {target_environment}
    - Version/Commit: {git_commit_sha}
    - Migrations: {migration_count} pending
    - Estimated Duration: ~{estimated_duration} minutes

  <action>Ask final confirmation: "Ready to deploy? [y/N]"</action>
  <action if="user declines">HALT: "Deployment cancelled by user."</action>

  <action>Start deployment timer</action>

  <platform-specific-deployment>
    <platform name="Vercel">
      <action>Run: vercel deploy --prod (for production) OR vercel deploy (for preview)</action>
      <action>Capture deployment URL</action>
      <action>Monitor deployment progress</action>
    </platform>

    <platform name="Railway">
      <action>Run: railway up (deploys to linked environment)</action>
      <action>Capture deployment URL</action>
      <action>Monitor build logs</action>
    </platform>

    <platform name="Render">
      <action>Trigger deployment via Render API or git push to render branch</action>
      <action>Monitor deployment status via API</action>
    </platform>

    <platform name="Netlify">
      <action>Run: netlify deploy --prod OR netlify deploy</action>
      <action>Capture deployment URL</action>
    </platform>

    <platform name="Heroku">
      <action>Run: git push heroku main (or heroku branch)</action>
      <action>Monitor dyno startup</action>
      <action>Run migrations: heroku run npm run migrate (if applicable)</action>
    </platform>

    <platform name="DigitalOcean">
      <action>Trigger deployment via doctl or App Platform API</action>
      <action>Monitor deployment progress</action>
    </platform>

    <platform name="AWS">
      <service name="Elastic Beanstalk">
        <action>Run: eb deploy</action>
        <action>Monitor environment health</action>
      </service>
      <service name="ECS">
        <action>Update task definition with new image</action>
        <action>Trigger service update</action>
        <action>Monitor task rollout</action>
      </service>
      <service name="Lambda">
        <action>Deploy via AWS SAM or Serverless Framework</action>
        <action>Update function code</action>
      </service>
    </platform>

    <platform name="GCP">
      <service name="App Engine">
        <action>Run: gcloud app deploy</action>
        <action>Monitor deployment</action>
      </service>
      <service name="Cloud Run">
        <action>Build container: gcloud builds submit</action>
        <action>Deploy: gcloud run deploy</action>
        <action>Monitor revision rollout</action>
      </service>
    </platform>

    <platform name="Kubernetes">
      <action>Apply manifests: kubectl apply -f k8s/</action>
      <action>Monitor rollout: kubectl rollout status deployment/{app_name}</action>
      <action>Verify pods are healthy</action>
    </platform>

    <platform name="Docker">
      <action>Build image: docker build -t {image_name}:{version}</action>
      <action>Push to registry: docker push {image_name}:{version}</action>
      <action>Deploy to target: docker-compose up -d OR docker stack deploy</action>
    </platform>
  </platform-specific-deployment>

  <action>Monitor deployment progress in real-time</action>
  <action>Capture deployment logs</action>
  <action>Record deployment duration</action>

  <action if="deployment fails">
    <action>Capture error logs</action>
    <action>Display failure reason</action>
    <ask>Deployment failed. Trigger automatic rollback? [Y/n]</ask>
    <action if="yes">Invoke rollback workflow: {project-root}/bmad/bmi/workflows/5-deployment/rollback/workflow.yaml</action>
    <action>HALT: "Deployment failed. Check logs for details."</action>
  </action>

  <action if="deployment succeeds">
    <action>Capture deployment URL</action>
    <action>Record deployment metadata (timestamp, version, commit SHA, duration)</action>
    <action>Display success message with deployment URL</action>
  </action>
</step>

<step n="5" goal="Run Database Migrations">
  <action if="auto_run_migrations is false OR no migrations detected">Skip this step</action>

  <action if="migrations pending">
    <action>Create database backup (timestamp: {date})</action>
    <action>Verify backup completed successfully</action>

    <action>Run migrations based on detected tool:</action>
      - Prisma: npx prisma migrate deploy
      - Drizzle: npm run db:migrate OR drizzle-kit push
      - Knex: npx knex migrate:latest
      - TypeORM: npm run typeorm migration:run
      - Sequelize: npx sequelize-cli db:migrate
      - Django: python manage.py migrate
      - Rails: rails db:migrate
      - Alembic: alembic upgrade head

    <action>Monitor migration execution</action>
    <action>Capture migration logs</action>

    <action if="migrations fail">
      <action>Capture error details</action>
      <action>Restore database from backup</action>
      <action>Rollback deployment</action>
      <action>HALT: "Database migrations failed. Database restored from backup. Deployment rolled back."</action>
    </action>

    <action if="migrations succeed">
      <action>Verify database schema matches expected state</action>
      <action>Record migration success in deployment log</action>
    </action>
  </action>
</step>

<step n="6" goal="Execute Smoke Tests">
  <action if="run_smoke_tests is false OR skip_smoke_tests is true">
    <warn>⚠️ Smoke tests skipped. Deployment may have undetected issues.</warn>
    <action>Skip to step 7</action>
  </action>

  <action>Wait for deployment to stabilize (30 seconds)</action>

  <smoke-tests>
    <test name="Health Check">
      <action>GET {deployment_url}/health OR {deployment_url}/api/health</action>
      <expect>HTTP 200 OK</expect>
      <action if="fails">CRITICAL: Health check endpoint not responding</action>
    </test>

    <test name="Homepage Load">
      <action>GET {deployment_url}/</action>
      <expect>HTTP 200 OK, page loads in <3s</expect>
      <action if="fails">CRITICAL: Homepage not loading</action>
    </test>

    <test name="API Endpoints">
      <action>Test critical API endpoints (if API application)</action>
      <expect>HTTP 200 OK for GET requests, proper error codes for invalid requests</expect>
      <action if="fails">CRITICAL: API endpoints not responding correctly</action>
    </test>

    <test name="Database Connectivity">
      <action>Verify database connection via health endpoint or test query</action>
      <expect>Database connection successful</expect>
      <action if="fails">CRITICAL: Database not accessible</action>
    </test>

    <test name="Static Assets">
      <action>Verify static assets load (CSS, JS, images)</action>
      <expect>Assets load with HTTP 200, no 404 errors</expect>
      <action if="fails">WARNING: Some static assets not loading</action>
    </test>

    <test name="Authentication" if="auth_enabled">
      <action>Test login endpoint or auth flow</action>
      <expect>Authentication working correctly</expect>
      <action if="fails">CRITICAL: Authentication not working</action>
    </test>
  </smoke-tests>

  <action>Generate smoke test report</action>
  <action>Display results: X/Y tests passed</action>

  <action if="critical smoke tests failed">
    <action>Display failed tests</action>
    <ask>⚠️ CRITICAL smoke tests failed. Rollback deployment? [Y/n]</ask>
    <action if="yes OR target_environment is production">
      <action>Invoke rollback workflow</action>
      <action>HALT: "Smoke tests failed. Deployment rolled back to previous version."</action>
    </action>
    <action if="no AND target_environment is not production">
      <warn>Proceeding with failed smoke tests (non-production environment)</warn>
    </action>
  </action>

  <action>Record smoke test results in deployment status</action>
</step>

<step n="7" goal="Update Deployment Status">
  <action>Load deployment status file: {project-root}/bmad/bmi/data/deployment-status.yaml</action>

  <action>Update environment status:</action>
    - status: "active"
    - platform: "{detected_platform}"
    - url: "{deployment_url}"
    - last_deployment:
        - timestamp: "{deployment_timestamp}"
        - version: "{git_commit_sha}"
        - deployed_by: "{user_name}"
        - story_id: "{story_id}"
        - duration_seconds: "{deployment_duration}"
        - status: "success"

  <action>Append to deployment_history array:</action>
    - id: "deploy-{date}-{sequence}"
    - story_id: "{story_id}"
    - environment: "{target_environment}"
    - version: "{git_commit_sha}"
    - platform: "{detected_platform}"
    - deployed_at: "{deployment_timestamp}"
    - deployed_by: "{user_name}"
    - status: "success"
    - duration_seconds: "{deployment_duration}"
    - deployment_url: "{deployment_url}"
    - smoke_tests:
        - total: {test_count}
        - passed: {passed_count}
        - failed: {failed_count}
        - critical_failures: {critical_failures}
    - migrations_run: {migration_count}

  <action>Save updated deployment-status.yaml</action>
  <action>Commit deployment status update to git (optional, based on config)</action>
</step>

<step n="8" goal="Generate Deployment Log">
  <action>Compile comprehensive deployment log with sections:</action>

  <section name="Deployment Summary">
    - Environment: {target_environment}
    - Platform: {detected_platform}
    - Version: {git_commit_sha}
    - Story ID: {story_id}
    - Deployed By: {user_name}
    - Timestamp: {deployment_timestamp}
    - Duration: {deployment_duration}
    - Status: ✅ SUCCESS
  </section>

  <section name="Pre-Deployment Checks">
    - Security: ✅ All checks passed
    - Database: ✅ Backup created, {migration_count} migrations applied
    - Build: ✅ Build artifacts verified
    - Dependencies: ✅ No critical vulnerabilities
  </section>

  <section name="Deployment Details">
    - Platform: {detected_platform}
    - Deployment URL: {deployment_url}
    - Deployment Method: {deployment_method}
    - Logs: {deployment_logs_excerpt}
  </section>

  <section name="Post-Deployment Validation">
    - Smoke Tests: {passed_count}/{test_count} passed
    - Critical Tests: ✅ All passed
    - Database: ✅ Migrations successful
    - Performance: Response time within SLA
  </section>

  <section name="Rollback Plan">
    - Previous Version: {previous_version}
    - Rollback Command: {rollback_command}
    - Database Backup: {backup_location}
  </section>

  <action>Save deployment log to: {default_output_file}</action>
  <action>Display deployment log location</action>
</step>

<step n="9" goal="Notify Stakeholders">
  <action if="target_environment is production">
    <action>Generate deployment notification message:</action>
      - Subject: "✅ Production Deployment Complete - {story_id}"
      - Body: Deployment summary with URL, version, and smoke test results

    <action>Suggest notification channels:</action>
      - Slack deployment channel
      - Email to stakeholders
      - GitHub PR comment
      - Status dashboard update

    <action>Display notification message for user to send</action>
  </action>

  <action if="target_environment is staging OR dev">
    <action>Log deployment completion (no external notifications for non-production)</action>
  </action>
</step>

<step n="10" goal="Complete Deployment">
  <action>Display deployment completion summary:</action>

  ```
  ✅ DEPLOYMENT COMPLETE

  Environment: {target_environment}
  URL: {deployment_url}
  Version: {git_commit_sha}
  Duration: {deployment_duration}

  Smoke Tests: {passed_count}/{test_count} passed ✅
  Migrations: {migration_count} applied ✅

  Next Steps:
  - Monitor application logs for errors
  - Verify user-facing functionality
  - Check monitoring dashboards

  Rollback available if needed:
  Use: *rollback command from Diana agent
  ```

  <action>Offer post-deployment actions:</action>
    - View deployment logs
    - Run performance profiling (invoke Phoenix)
    - Monitor application (setup monitoring if not configured)
    - Return to agent menu

  <action>Workflow complete ✅</action>
</step>

</workflow>
