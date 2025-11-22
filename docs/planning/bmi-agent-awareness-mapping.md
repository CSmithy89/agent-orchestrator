# BMI Agent Awareness & Workflow Invocation Mapping

**Date:** 2025-11-13
**Purpose:** Comprehensive mapping of when and how agents invoke deployment workflows

---

## 🧠 Agent Awareness System

### **Core Principle**
Agents must know:
1. **WHEN** to invoke deployment workflows (triggers)
2. **WHICH** workflow to invoke (workflow selection)
3. **HOW** to invoke it (parameters, context)
4. **WHAT** to do with results (validation, next steps)

---

## 📊 Workflow Invocation Matrix

| Trigger Event | Invoking Agent | Target Workflow | Environment | Auto/Manual |
|---------------|----------------|-----------------|-------------|-------------|
| Story merged to main | Bob (SM) via orchestrate-story | deployment-workflow | dev | Auto |
| Dev deployment succeeds | Diana | deployment-workflow | staging | Auto (configurable) |
| Migration files created | Amelia (Dev) | database-migration | local | Auto |
| Epic complete | Bob via orchestrate-epic | release-workflow | N/A | Manual (configurable) |
| Dockerfile changed | Diana | container-build | N/A | Auto |
| Infrastructure code changed | Winston | infrastructure-provision | dev | Manual |
| Production incident | On-call/User | incident-response | production | Manual |
| Performance concern in story | Phoenix | performance-profiling | staging | Auto |
| Epic releasing | Rita | load-testing-workflow | production | Auto |
| First deployment to env | Diana | monitoring-setup | {env} | Auto |
| Deployment fails | Diana | rollback-workflow | {env} | Auto |
| Critical bug in production | Rita | hotfix-workflow | production | Manual |
| SSL cert expiring | Diana | infrastructure-provision | production | Auto (scheduled) |
| Secrets need rotation | Diana | secrets-rotate | all | Auto (scheduled) |

---

## 🤖 Agent-by-Agent Invocation Rules

### **Bob (Scrum Master) - Orchestration Leader**

**Workflows Bob Invokes:**
- orchestrate-story (primary workflow)
- orchestrate-epic (primary workflow)

**Deployment Integration:**

```yaml
# In orchestrate-story workflow
bob_invocation_rules:

  after_step_8_git_push:
    # Step 8 complete: Code merged and pushed
    condition: "git push origin main succeeded"
    decision:
      - Check bmm/config.yaml → deployment.auto_deploy_on_merge
      - If true:
          invoke: deployment-workflow
          agent: Diana
          params:
            environment: dev
            trigger: "story_merge"
            story_id: "{story-file}"
      - If false:
          skip_deployment: true
          notify_user: "Auto-deploy disabled. Run /deploy manually."

  after_dev_deployment:
    condition: "Dev deployment succeeded"
    decision:
      - Check bmm/config.yaml → deployment.auto_deploy_environments
      - If "staging" in list:
          invoke: deployment-workflow
          agent: Diana
          params:
            environment: staging
            trigger: "dev_success"
            story_id: "{story-file}"
      - Else:
          notify_user: "Dev deployed. Run /deploy staging manually."

  after_staging_deployment:
    condition: "Staging deployment succeeded"
    decision:
      - Check story acceptance criteria
      - If "performance" in criteria OR story tagged "performance":
          invoke: performance-profiling
          agent: Phoenix
          params:
            environment: staging
            story_id: "{story-file}"
      - Run smoke tests via TEA
```

**In orchestrate-epic:**

```yaml
bob_epic_invocation_rules:

  after_all_stories_complete:
    condition: "All epic stories == 'done' AND retrospective complete"
    decision:
      - Check bmm/config.yaml → release.auto_release_on_epic_complete
      - If true:
          invoke: release-workflow
          agent: Rita
          params:
            epic_id: "{epic-number}"
            stories: "{all-epic-story-files}"
      - If false:
          notify_user: "Epic complete. Run /release to create release."

  after_release_workflow:
    condition: "Release workflow complete (changelog, version bump, tag)"
    decision:
      - Check bmm/config.yaml → release.deploy_to_production
      - If true:
          invoke: deployment-workflow
          agent: Diana
          params:
            environment: production
            trigger: "release"
            version: "{release-version}"
            require_approval: true  # Always require approval for prod
      - If false:
          notify_user: "Release ready. Run /deploy production manually."
```

---

### **Diana (DevOps Engineer) - Deployment Specialist**

**Workflows Diana Owns:**
- deployment-workflow (primary)
- rollback-workflow
- database-migration
- container-build
- infrastructure-provision
- monitoring-setup
- incident-response

**Invocation Rules:**

```yaml
diana_invocation_rules:

  # Diana is INVOKED by other workflows, so these are "when invoked" rules

  when_invoked_for_deployment:
    inputs_required:
      - environment: string (dev|staging|production)
      - trigger: string (story_merge|epic_release|manual)
      - story_id or version: string

    steps:
      1_preflight_checks:
        - Check if database migrations pending
        - If yes:
            invoke: database-migration
            agent: self (Diana)
            params:
              environment: "{environment}"
              migrations: "{detected-migration-files}"
        - Check if container-based deployment
        - If yes:
            invoke: container-build
            agent: self (Diana)
            params:
              tag: "{version or git-sha}"

      2_detect_platform:
        - Scan for platform config files
        - Auto-detect deployment platform
        - Load platform-specific deployment strategy

      3_execute_deployment:
        - Run platform CLI commands
        - Monitor deployment progress
        - Capture deployment URL

      4_post_deployment_validation:
        - Run smoke tests (invoke TEA)
        - Check health endpoints
        - Validate environment variables loaded

      5_setup_monitoring_if_needed:
        - Check if monitoring configured for environment
        - If not:
            invoke: monitoring-setup
            agent: self (Diana)
            params:
              environment: "{environment}"

      6_handle_failure:
        - If deployment fails:
            invoke: rollback-workflow
            agent: self (Diana)
            params:
              environment: "{environment}"
              target_version: "previous"
        - Notify team via Slack/email

  when_invoked_for_database_migration:
    inputs_required:
      - environment: string
      - migrations: array of migration files

    steps:
      1_validate_migrations:
        - Check migration syntax
        - Verify migrations can run (dry-run)
        - Calculate rollback strategy

      2_backup_database:
        - If production: ALWAYS backup first
        - If staging: backup if config says so
        - Store backup location

      3_execute_migrations:
        - Run migrations sequentially
        - Log each migration result
        - Stop on first failure

      4_verify_schema:
        - Check schema matches expectations
        - Run validation queries

      5_handle_failure:
        - If migration fails:
            - Rollback migrations
            - Restore from backup (if production)
            - Report failure with details

  when_invoked_for_infrastructure:
    inputs_required:
      - environment: string
      - infrastructure_files: array (Terraform, Pulumi, etc.)

    steps:
      1_plan_changes:
        - Run terraform plan or equivalent
        - Calculate cost estimate
        - Identify resource changes

      2_require_approval:
        - If production: ALWAYS require approval
        - Show plan to user
        - Wait for confirmation

      3_apply_changes:
        - Execute infrastructure provisioning
        - Monitor resource creation
        - Handle errors gracefully

      4_configure_ssl_domains:
        - If new environment: setup SSL certificates
        - Configure DNS records
        - Validate HTTPS working

  when_invoked_for_incident:
    inputs_required:
      - incident_description: string
      - severity: critical|high|medium|low
      - environment: string

    steps:
      1_assess_severity:
        - If critical: invoke hotfix-workflow immediately
        - If high: gather diagnostics, plan fix
        - If medium/low: create issue, schedule fix

      2_gather_diagnostics:
        - Pull logs from monitoring
        - Check error rates, response times
        - Identify affected users/services

      3_implement_fix:
        - If quick fix possible: deploy hotfix
        - If requires code change: create hotfix story
        - If infrastructure: modify infrastructure

      4_post_incident:
        - Document root cause
        - Create prevention action items
        - Update runbooks
```

---

### **Rita (Release Manager) - Release Orchestrator**

**Workflows Rita Owns:**
- release-workflow (primary)
- changelog-generation
- hotfix-workflow

**Invocation Rules:**

```yaml
rita_invocation_rules:

  when_invoked_for_release:
    inputs_required:
      - epic_id: string
      - stories: array of story files
      - current_version: string (e.g., "1.2.3")

    steps:
      1_determine_version_bump:
        - Analyze epic type (breaking|feature|fix)
        - Breaking changes → MAJOR version bump
        - New features → MINOR version bump
        - Bug fixes only → PATCH version bump
        - Calculate new version

      2_generate_changelog:
        - invoke: changelog-generation
          agent: self (Rita)
          params:
            from_version: "{current_version}"
            to_version: "{new_version}"
            stories: "{epic_stories}"
        - Parse stories for changes
        - Categorize: Added, Changed, Fixed, Breaking
        - Format according to Keep a Changelog

      3_create_release_notes:
        - Extract highlights from epic
        - Summarize key features
        - Include migration guide if breaking changes
        - Add deployment instructions

      4_version_bump:
        - Update package.json version
        - Update other version files
        - Commit version changes

      5_create_git_tag:
        - Create annotated tag: v{new_version}
        - Include release notes in tag message
        - Push tag to origin

      6_create_github_release:
        - Use GitHub API to create release
        - Attach changelog
        - Upload build artifacts (if any)

      7_coordinate_deployment:
        - Check release.deploy_to_production config
        - If true:
            notify: Diana to deploy production
            invoke: deployment-workflow (via Diana)
            params:
              environment: production
              version: "{new_version}"
              require_approval: true

      8_track_dora_metrics:
        - Record deployment frequency
        - Calculate lead time for changes
        - Update metrics in docs/metrics/dora.yaml

  when_invoked_for_hotfix:
    inputs_required:
      - incident_id: string
      - severity: critical|high
      - description: string

    steps:
      1_create_hotfix_branch:
        - git checkout -b hotfix/v{version}-{issue}
        - Create from production tag

      2_coordinate_fix_implementation:
        - If simple: Diana implements immediately
        - If complex: Amelia creates emergency story

      3_expedited_testing:
        - Run critical tests only (not full suite)
        - Manual validation by team

      4_version_bump:
        - Bump PATCH version
        - Update version files

      5_deploy_immediately:
        - invoke: deployment-workflow (via Diana)
          params:
            environment: production
            version: "{hotfix_version}"
            expedited: true

      6_post_hotfix:
        - Cherry-pick to main branch
        - Create post-mortem document
        - Schedule prevention work
```

---

### **Phoenix (Performance Engineer) - Performance Specialist**

**Workflows Phoenix Owns:**
- performance-profiling
- load-testing-workflow

**Invocation Rules:**

```yaml
phoenix_invocation_rules:

  when_invoked_for_profiling:
    inputs_required:
      - environment: string (staging|production)
      - story_id: string (optional)
      - component: string (api|frontend|database)

    steps:
      1_establish_baseline:
        - Check if baseline metrics exist
        - If not: capture current performance as baseline
        - Store in docs/metrics/performance-baseline.yaml

      2_run_profiling_tools:
        - If API: Use clinic.js, 0x profiler
        - If frontend: Use Lighthouse, Chrome DevTools
        - If database: Run EXPLAIN ANALYZE, slow query log
        - Capture flamegraphs, CPU/memory usage

      3_analyze_bottlenecks:
        - Identify slow endpoints (>1s response time)
        - Find CPU-intensive operations
        - Detect memory leaks
        - Check database query performance

      4_generate_recommendations:
        - Suggest optimizations (caching, query optimization, etc.)
        - Estimate performance improvement
        - Prioritize by impact

      5_create_optimization_stories:
        - If significant bottlenecks found:
            create story drafts for optimizations
            link to profiling report

      6_validate_slas:
        - Compare against performance SLAs in story
        - Report: PASS/FAIL for each SLA
        - If FAIL: block deployment OR create follow-up story

  when_invoked_for_load_testing:
    inputs_required:
      - environment: production (typically)
      - load_profile: object (users, duration, ramp-up)

    steps:
      1_prepare_test_scenarios:
        - Define user journeys to test
        - Create k6 or Artillery scripts
        - Configure load profile

      2_run_load_tests:
        - Execute load test scripts
        - Monitor system under load
        - Capture metrics (RPS, latency, errors)

      3_analyze_capacity:
        - Identify breaking point
        - Calculate max concurrent users
        - Measure response time under load

      4_validate_slas:
        - Check p95 latency < SLA threshold
        - Verify error rate < 0.1%
        - Confirm system recovers after load

      5_capacity_planning:
        - Recommend scaling thresholds
        - Suggest infrastructure upgrades if needed
        - Update capacity plan document

  when_story_has_performance_tag:
    # Phoenix watches for stories tagged "performance"
    condition: "Story has 'performance' tag OR acceptance criteria mention performance"
    trigger: "After story deployed to staging"
    action:
      invoke: performance-profiling
      agent: self (Phoenix)
      params:
        environment: staging
        story_id: "{story-file}"
        component: auto-detect

  when_epic_releases:
    condition: "Epic releasing to production"
    trigger: "Before production deployment"
    action:
      invoke: load-testing-workflow
      agent: self (Phoenix)
      params:
        environment: production
        epic_id: "{epic-number}"
```

---

### **Murat (TEA) - Testing Integration**

**Workflows Murat Owns:**
- testarch/* (testing infrastructure)

**Deployment Integration:**

```yaml
murat_deployment_integration:

  after_deployment_to_any_environment:
    condition: "Diana completes deployment"
    trigger: "Run smoke tests"
    action:
      - Run smoke test suite
      - Validate critical paths working
      - Report results to Diana
      - If tests fail: Block further deployment

  when_setting_up_cicd:
    # Murat creates CI pipeline, Diana extends it
    workflow: testarch/ci
    outputs:
      ci_config_file: ".github/workflows/test.yml"
    then:
      notify: Diana to extend with deployment jobs
      diana_action:
        - Read Murat's CI config
        - Add deployment jobs (deploy-dev, deploy-staging)
        - Configure deployment secrets
        - Enable deployment gates

  performance_testing_collaboration:
    # Murat provides test infrastructure, Phoenix runs perf tests
    condition: "Phoenix requests performance test execution"
    action:
      - Provide test framework setup
      - Configure performance test runners
      - Integrate perf tests into CI pipeline
```

---

### **Amelia (Developer) - Implementation Specialist**

**Deployment Awareness:**

```yaml
amelia_deployment_awareness:

  during_dev_story:
    # Amelia checks for deployment-related changes
    checks:
      - If database migrations created:
          notify: Diana about migrations
          recommend: Test migrations locally first
      - If Dockerfile modified:
          notify: Diana about container changes
          recommend: Build container locally to verify
      - If environment variables added:
          notify: Diana about new secrets needed
          recommend: Document new env vars in .env.example

  database_migration_detection:
    condition: "Migration files created during implementation"
    trigger: "Before marking story as done"
    action:
      invoke: database-migration
      agent: Diana
      params:
        environment: local
        migrations: "{new-migration-files}"
        mode: test  # Dry-run locally

  container_build_verification:
    condition: "Dockerfile or docker-compose.yml changed"
    trigger: "Before marking story as done"
    action:
      invoke: container-build
      agent: Diana
      params:
        tag: "test-{story-id}"
        push: false  # Don't push, just verify build works
```

---

### **Winston (Architect) - Infrastructure Design**

**Deployment Coordination:**

```yaml
winston_deployment_coordination:

  when_architecture_changes_infrastructure:
    condition: "Architecture decisions require infrastructure changes"
    examples:
      - Adding cache layer (Redis)
      - Adding message queue (RabbitMQ)
      - Changing database (Postgres → MongoDB)
      - Adding CDN
    action:
      notify: Diana about infrastructure requirements
      recommend: Diana invoke infrastructure-provision
      params:
        infrastructure_type: "{redis|postgres|cdn|etc}"
        environment: dev  # Provision in dev first

  when_architecture_defines_slas:
    condition: "Architecture document specifies performance SLAs"
    action:
      notify: Phoenix about SLA requirements
      recommend: Phoenix configure performance tests
      sla_examples:
        - API response time < 200ms (p95)
        - Page load time < 2s
        - Database query < 100ms

  security_requirements:
    condition: "Architecture requires security measures"
    examples:
      - SSL/TLS enforcement
      - Secret rotation policy
      - Access control (IAM, RBAC)
    action:
      notify: Diana about security requirements
      recommend: Diana configure security measures during infrastructure-provision
```

---

## 🔄 Workflow Chaining & Orchestration

### **Primary Workflow Chains**

**Chain 1: Story Development → Deployment**
```
orchestrate-story (Bob)
  ├─ create-story (Bob)
  ├─ story-context (Bob)
  ├─ dev-story (Amelia)
  │  └─ database-migration (Diana) [if DB changes]
  ├─ code-review (Alex/SM)
  ├─ git operations (Bob)
  ├─ deployment-workflow (Diana) [dev]
  │  ├─ container-build (Diana) [if containerized]
  │  ├─ database-migration (Diana) [if migrations]
  │  └─ monitoring-setup (Diana) [if first deploy]
  ├─ smoke tests (Murat)
  ├─ deployment-workflow (Diana) [staging]
  └─ performance-profiling (Phoenix) [if performance story]
```

**Chain 2: Epic Completion → Release → Production**
```
orchestrate-epic (Bob)
  ├─ epic-tech-context (Winston)
  ├─ [multiple orchestrate-story calls]
  ├─ retrospective (Bob)
  ├─ release-workflow (Rita)
  │  ├─ changelog-generation (Rita)
  │  ├─ version-bump (Rita)
  │  └─ git tagging (Rita)
  ├─ load-testing-workflow (Phoenix)
  └─ deployment-workflow (Diana) [production]
      └─ monitoring-setup (Diana) [if needed]
```

**Chain 3: Production Incident → Hotfix → Deploy**
```
incident-response (Diana)
  ├─ diagnose issue
  ├─ hotfix-workflow (Rita)
  │  ├─ create hotfix branch
  │  ├─ emergency implementation (Amelia or Diana)
  │  ├─ critical tests (Murat)
  │  └─ version bump (Rita)
  └─ deployment-workflow (Diana) [production]
      └─ post-incident analysis (Diana)
```

---

## 📝 Configuration-Driven Behavior

### **bmad/bmm/config.yaml Deployment Section**

```yaml
# BMM Configuration with Deployment Settings

# Existing BMM config...
project_name: "Agent Orchestrator"
user_name: Chris
# ...

# NEW: Deployment Configuration
deployment:
  # Auto-deployment settings
  auto_deploy_on_merge: true        # Auto-deploy after story merge
  auto_deploy_environments:
    - dev                            # Always deploy to dev
    - staging                        # Deploy to staging if dev succeeds

  # Platform configuration
  default_platform: "auto"           # Auto-detect or: vercel, railway, aws, etc.
  platform_configs:
    vercel:
      team_id: "team_xxx"
      project_id: "prj_xxx"
    railway:
      project_id: "xxx"
      environment_ids:
        dev: "env-dev-xxx"
        staging: "env-staging-xxx"
        production: "env-prod-xxx"

  # Validation settings
  run_smoke_tests: true              # Run smoke tests after deploy
  run_performance_tests: false       # Run perf tests after deploy (optional)
  block_on_test_failure: true        # Block deployment if tests fail

  # Deployment gates
  require_approval_for:
    - production                     # Always require manual approval for prod

  # Database migration
  auto_run_migrations: true          # Auto-run migrations during deployment
  migration_tool: "prisma"           # prisma | drizzle | knex | sequelize
  backup_before_migration: true      # Backup DB before migrations (production only)

  # Container configuration
  container_registry: "docker.io"    # docker.io | ghcr.io | ecr
  container_namespace: "myorg"
  multi_arch_build: false            # Build for ARM + x86

  # Secrets management
  secrets_provider: "env"            # env | vault | aws-secrets | doppler
  secrets_config:
    # vault:
    #   url: "https://vault.example.com"
    #   path: "secret/data/myapp"

# NEW: Release Configuration
release:
  # Release automation
  auto_release_on_epic_complete: false  # Manual release by default

  # Versioning
  version_strategy: "semantic"          # semantic | calendar | custom
  version_file: "package.json"          # Where to update version

  # Changelog
  changelog_format: "keepachangelog"    # keepachangelog | conventional | angular
  changelog_file: "CHANGELOG.md"
  include_commit_links: true

  # Release notes
  release_notes_template: "{project-root}/bmad/bmm/workflows/6-release/templates/release-notes.md"

  # Production deployment
  deploy_to_production: false           # Require manual trigger
  run_load_tests: true                  # Run load tests before production

  # DORA metrics
  track_dora_metrics: true
  metrics_file: "{project-root}/docs/metrics/dora.yaml"

# NEW: Monitoring Configuration
monitoring:
  platform: "prometheus"             # prometheus | datadog | newrelic | cloudwatch
  setup_on_first_deploy: true        # Auto-setup monitoring on first deploy
  alert_channels:
    - type: "slack"
      webhook_url_env: "SLACK_WEBHOOK_URL"
    - type: "email"
      recipients: ["team@example.com"]

  # Health checks
  health_check_endpoint: "/health"
  health_check_interval: "30s"

  # Synthetic monitoring
  uptime_checks: false               # Setup uptime monitoring (future)

# Performance Configuration
performance:
  # Profiling
  profiling_tool: "clinic"           # clinic | 0x | lighthouse
  profile_on_staging: true           # Auto-profile staging deployments

  # Load testing
  load_testing_tool: "k6"            # k6 | artillery | jmeter
  load_test_scenarios: "{project-root}/tests/load/"

  # SLAs (defaults if not in story)
  default_slas:
    api_response_time_p95: 500       # ms
    page_load_time: 3000              # ms
    error_rate: 0.01                  # 1%
```

---

## 🎯 Agent Invocation Summary

| Agent | Primary Role | Invokes Workflows | Invoked By | Key Trigger |
|-------|--------------|-------------------|------------|-------------|
| **Bob** | Orchestrator | orchestrate-story, orchestrate-epic | User | Manual start |
| **Diana** | DevOps | deployment-workflow, rollback, DB migration, container-build | Bob, Rita, Self | Story merge, release |
| **Rita** | Release Mgr | release-workflow, changelog, hotfix | Bob, User | Epic complete, incident |
| **Phoenix** | Performance | performance-profiling, load-testing | Bob, Diana, Self | Performance tag, release |
| **Murat** | Testing | testarch/ci, smoke tests | Diana, Bob | Deployment, CI setup |
| **Amelia** | Developer | dev-story | Bob | Story implementation |
| **Winston** | Architect | architecture | User | Architecture design |

---

## ✅ Implementation Checklist

- [ ] Create invocation-rules.yaml in bmm/workflows/
- [ ] Update orchestrate-story to include deployment steps 9-15
- [ ] Update orchestrate-epic to include release steps
- [ ] Add deployment/release config to bmm/config.yaml
- [ ] Create Phase 5 (deployment) directory structure
- [ ] Create Phase 6 (release) directory structure
- [ ] Build Diana agent with awareness rules
- [ ] Build Rita agent with awareness rules
- [ ] Build Phoenix agent with awareness rules
- [ ] Update sprint-status.yaml schema
- [ ] Create workflow templates for all 12 new workflows
- [ ] Test integration with orchestrator project
- [ ] Document agent invocation patterns in BMM README

---

**Status:** ✅ **Comprehensive mapping complete**

Agents now have complete awareness of:
- When to invoke deployment workflows
- Which workflow to invoke based on context
- How to chain workflows together
- What to do with workflow results
