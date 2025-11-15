# BMI Architecture Decision: Separate Module vs BMM Integration

**Date:** 2025-11-13
**Decision:** Should BMI be a separate module or integrated into BMM?

---

## 🔍 Analysis of Both Approaches

### **Option A: Separate Module (bmad/bmi/)**

**Structure:**
```
bmad/
├── core/           # Core orchestration
├── cis/            # Creative & Innovation
├── bmm/            # Development lifecycle
├── bmb/            # Builder tools
└── bmi/            # Infrastructure & DevOps (NEW MODULE)
    ├── agents/
    │   ├── diana.md
    │   ├── rita.md
    │   └── phoenix.md
    └── workflows/
        ├── deployment-workflow/
        ├── release-workflow/
        └── ...
```

**Pros:**
- ✅ Clean separation of concerns (dev vs ops)
- ✅ Can be installed independently
- ✅ Users who don't need deployment can skip it
- ✅ Easier to version and maintain separately
- ✅ Follows BMAD's modular architecture
- ✅ Can evolve at different pace than BMM
- ✅ Clear ownership (Diana/Rita/Phoenix vs BMM agents)

**Cons:**
- ❌ Handoff friction between modules
- ❌ Users need to install 2 modules for full lifecycle
- ❌ Integration points require cross-module coordination
- ❌ Duplicate configuration (both modules need project config)
- ❌ More complex for users to understand module boundaries

---

### **Option B: Integrate into BMM as Phase 5**

**Structure:**
```
bmad/
├── core/
├── cis/
├── bmb/
└── bmm/            # Complete development + operations lifecycle
    ├── agents/
    │   ├── analyst.md
    │   ├── architect.md
    │   ├── dev.md
    │   ├── sm.md
    │   ├── tea.md
    │   ├── diana.md      # NEW
    │   ├── rita.md       # NEW
    │   └── phoenix.md    # NEW
    └── workflows/
        ├── 1-analysis/
        ├── 2-plan-workflows/
        ├── 3-solutioning/
        ├── 4-implementation/
        ├── 5-deployment/   # NEW PHASE
        │   ├── deployment-workflow/
        │   ├── rollback-workflow/
        │   ├── container-build/
        │   ├── database-migration/
        │   └── ...
        ├── 6-release/      # NEW PHASE
        │   ├── release-workflow/
        │   ├── changelog-generation/
        │   └── ...
        └── testarch/       # Testing (already integrated)
```

**Pros:**
- ✅ Seamless integration with orchestrate-story
- ✅ One module for complete dev lifecycle
- ✅ Simpler user experience (install BMM, get everything)
- ✅ Existing pattern: TEA already integrated into BMM
- ✅ No cross-module handoff complexity
- ✅ Natural progression: develop → test → deploy → release
- ✅ orchestrate-story can extend to actual deployment
- ✅ Unified configuration and state management

**Cons:**
- ❌ BMM becomes very large (8+ agents, 45+ workflows)
- ❌ Can't install deployment without development
- ❌ Mixed concerns (dev + ops in one module)
- ❌ Harder to maintain as complexity grows

---

## 📊 Comparison Matrix

| Criteria | Separate BMI Module | Integrated into BMM |
|----------|---------------------|---------------------|
| **User Experience** | Complex (2 modules) | Simple (1 module) |
| **Installation** | Optional, separate | Included with BMM |
| **Integration** | Cross-module handoffs | Seamless, built-in |
| **Maintenance** | Independent versioning | Coupled with BMM |
| **Module Size** | Focused (3 agents, 12 workflows) | Large (12 agents, 45+ workflows) |
| **Separation of Concerns** | Clean (dev vs ops) | Mixed (full lifecycle) |
| **orchestrate-story** | Must call BMI workflows | Native integration |
| **Configuration** | Separate config files | Unified config |
| **For Simple Projects** | Can skip deployment | Always installed |
| **For Enterprise** | Can add separately | Built-in, ready |

---

## 🎯 Recommendation: **Integrated into BMM as Phase 5 & 6**

### **Why Integration is Better**

**1. Natural Workflow Progression**
```
Phase 1: Analysis (optional)
Phase 2: Planning (PRD, tech spec)
Phase 3: Solutioning (architecture)
Phase 4: Implementation (stories, testing)
Phase 5: Deployment ← NEW (deploy to environments)
Phase 6: Release ← NEW (release management)
```

**2. BMM Already Has Testing (TEA)**
- TEA workflows are in `bmm/workflows/testarch/`
- Testing is just as "operations-y" as deployment
- Sets precedent for including ops in BMM

**3. orchestrate-story Integration**
Current orchestrate-story ends at:
```
Step 8: git push origin main → "Story deployed!"
```

With integration, seamlessly extends to:
```
Step 8: git push origin main
Step 9: Deploy to dev (BMM Phase 5 workflow) ← NEW
Step 10: Run smoke tests (TEA integration)
Step 11: Deploy to staging (if tests pass) ← NEW
```

**4. BMM is Already Large**
- BMM currently has **12 agents** (including game dev agents)
- BMM has **34+ workflows** across phases
- Adding 3 agents + 12 workflows is only 25% growth
- Keeping deployment separate doesn't significantly reduce complexity

**5. User Mental Model**
Users think: "BMM = complete dev lifecycle"
- If deployment is separate, users wonder: "Why isn't deployment included?"
- Integration matches user expectations

**6. Existing Examples**
- `testarch/` - Testing infrastructure (9 workflows) is in BMM
- `document-project/` - Brownfield analysis is in BMM
- BMM already covers "beyond just coding"

---

## 🏗️ Integration Architecture

### **BMM Phase Structure (Updated)**

```
bmad/bmm/workflows/
├── 1-analysis/              # Optional exploration
├── 2-plan-workflows/        # PRD, tech-spec, narrative, UX
├── 3-solutioning/           # Architecture, validation
├── 4-implementation/        # Stories, dev, code review
├── 5-deployment/            # NEW: Environment deployment
│   ├── deployment-workflow/
│   ├── rollback-workflow/
│   ├── database-migration/
│   ├── container-build/
│   ├── infrastructure-provision/
│   ├── monitoring-setup/
│   ├── incident-response/
│   └── performance-profiling/
├── 6-release/               # NEW: Release management
│   ├── release-workflow/
│   ├── changelog-generation/
│   ├── hotfix-workflow/
│   └── load-testing-workflow/
├── testarch/                # Existing: Testing infrastructure
├── document-project/        # Existing: Brownfield analysis
└── workflow-status/         # Existing: Status tracking
```

### **Agent Integration**

**Existing BMM Agents:**
1. Mary (Analyst)
2. John (PM)
3. Winston (Architect)
4. Murat (TEA)
5. Amelia (Developer)
6. Bob (Scrum Master)
7. Alex (Code Reviewer) - mentioned in config
8. Sally (UX Designer)
9. Paige (Documentation)
10-12. Game dev agents (if enabled)

**New Agents (Deployment & Operations):**
13. **Diana** (DevOps Engineer) - Phase 5 workflows
14. **Rita** (Release Manager) - Phase 6 workflows
15. **Phoenix** (Performance Engineer) - Phase 5 & 6 workflows

**Total:** 15 agents (12 existing + 3 new)

---

## 🔗 Workflow Integration Points

### **Integration Point 1: orchestrate-story Extension**

**Current Behavior:**
```yaml
orchestrate-story:
  - Step 0-7: Create, context, dev, review, commit, push, merge
  - Step 8: git push origin main
  - END: "Story deployed!" ❌ (actually just in git)
```

**Enhanced Behavior (with Phase 5):**
```yaml
orchestrate-story:
  # Existing steps 0-8
  - Step 0-8: Same as before (ends with git push main)

  # NEW Phase 5 steps
  - Step 9: Check deployment config
    - Read bmm config for auto_deploy setting
    - If auto_deploy == false → SKIP to Step 14
    - If auto_deploy == true → CONTINUE

  - Step 10: Deploy to dev environment
    - Invoke: bmm/workflows/5-deployment/deployment-workflow
    - Agent: Diana
    - Environment: dev
    - Auto-deploy: true

  - Step 11: Run smoke tests
    - Invoke: bmm/workflows/testarch/test-design (smoke test suite)
    - Agent: Murat
    - Validate deployment health

  - Step 12: Deploy to staging (conditional)
    - If smoke tests pass → Deploy to staging
    - Invoke: bmm/workflows/5-deployment/deployment-workflow
    - Agent: Diana
    - Environment: staging
    - Auto-deploy: true (configurable)

  - Step 13: Performance validation
    - Invoke: bmm/workflows/5-deployment/performance-profiling
    - Agent: Phoenix
    - Validate performance SLAs

  - Step 14: Update story status
    - Mark story as "deployed" in sprint-status.yaml
    - Add deployment metadata (URLs, timestamps)

  - Step 15: Clean up
    - Kill background processes
    - Report completion
```

**Configuration:**
```yaml
# bmad/bmm/config.yaml (existing file)
# Add deployment settings:

deployment:
  auto_deploy_on_merge: true      # Auto-deploy after story merge
  auto_deploy_environments:
    - dev                          # Always deploy to dev
    - staging                      # Deploy to staging if dev succeeds
  require_approval_for:
    - production                   # Never auto-deploy production

  default_platform: "auto"         # Auto-detect or: vercel, railway, aws, etc.
  run_smoke_tests: true            # Run smoke tests after deploy
  run_performance_tests: false     # Run perf tests after deploy (optional)
```

---

### **Integration Point 2: orchestrate-epic Extension**

**Current Behavior:**
```yaml
orchestrate-epic:
  - Step 0: Epic tech spec (if needed)
  - Step 1-N: Execute all stories (via orchestrate-story)
  - Step N+1: Retrospective
  - END
```

**Enhanced Behavior (with Phase 6):**
```yaml
orchestrate-epic:
  - Step 0: Epic tech spec (if needed)
  - Step 1-N: Execute all stories (each story auto-deploys to dev/staging)
  - Step N+1: Epic retrospective

  # NEW Phase 6 steps
  - Step N+2: Check release config
    - If auto_release_on_epic_complete == false → SKIP
    - If true → CONTINUE

  - Step N+3: Generate release
    - Invoke: bmm/workflows/6-release/release-workflow
    - Agent: Rita
    - Inputs:
      - Epic number
      - All story files from epic
      - Current version

  - Step N+4: Deploy to production (manual approval)
    - Invoke: bmm/workflows/5-deployment/deployment-workflow
    - Agent: Diana
    - Environment: production
    - Require manual approval (configurable)

  - Step N+5: Performance validation
    - Invoke: bmm/workflows/6-release/load-testing-workflow
    - Agent: Phoenix
    - Validate production performance

  - Step N+6: Update epic status
    - Mark epic as "released" in sprint-status.yaml
    - Add release metadata (version, URLs, timestamp)
```

**Configuration:**
```yaml
# bmad/bmm/config.yaml

release:
  auto_release_on_epic_complete: false  # Manual release by default
  version_strategy: "semantic"          # semantic, calendar, custom
  changelog_format: "keepachangelog"    # keepachangelog, conventional
  deploy_to_production: false           # Require manual trigger
  run_load_tests: true                  # Run load tests before production
```

---

### **Integration Point 3: TEA + Deployment Collaboration**

**TEA Sets Up CI/CD Testing, Diana Extends with Deployment**

```yaml
workflow: testarch/ci
  - Step 1: TEA creates .github/workflows/test.yml
  - Step 2: Configure test execution, quality gates
  - OUTPUT: CI pipeline file path

workflow: 5-deployment/ci-cd-enhancement
  - Step 1: Read TEA's CI config file
  - Step 2: Add deployment jobs
    - Add job: deploy-dev (runs after tests pass)
    - Add job: deploy-staging (runs after dev succeeds)
  - Step 3: Configure environment secrets
  - Step 4: Setup deployment approvals (production)
  - OUTPUT: Enhanced CI/CD pipeline
```

**Example Enhanced Pipeline:**
```yaml
# .github/workflows/test.yml (created by TEA)
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      # TEA's test configuration

  # Diana adds deployment jobs:
  deploy-dev:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dev
        run: npm run deploy:dev  # Calls deployment-workflow

  deploy-staging:
    needs: deploy-dev
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: npm run deploy:staging  # Calls deployment-workflow
```

---

### **Integration Point 4: Database Migration in Dev Workflow**

**dev-story workflow enhancement:**

```yaml
# bmm/workflows/4-implementation/dev-story/workflow.yaml

steps:
  # Existing steps...
  - implement_code
  - write_tests
  - run_tests

  # NEW: Check for database changes
  - check_database_changes:
      description: "Detect if database schema changed"
      actions:
        - Scan for migration files (prisma/migrations/, drizzle/, etc.)
        - Check if new migrations created
        - Validate migration safety
      outputs:
        has_migrations: boolean
        migration_files: string[]

  # NEW: Test migrations locally
  - test_migrations:
      if: has_migrations == true
      description: "Run migrations in local dev DB"
      actions:
        - Invoke: bmm/workflows/5-deployment/database-migration
        - Agent: Diana
        - Environment: local
        - Mode: test (dry-run)
      validation:
        - Migrations run successfully
        - Schema matches expectations
        - Can rollback cleanly
```

---

## 🧠 Agent Awareness & Invocation Rules

### **How Agents Know When to Invoke Deployment Workflows**

**Rule-Based Invocation System:**

```yaml
# bmad/bmm/workflows/invocation-rules.yaml (NEW FILE)

# Rules for when agents should invoke Phase 5 (Deployment) workflows

deployment_triggers:

  # Trigger 1: After story merge (orchestrate-story)
  after_story_merge:
    condition: "Story status == 'done' AND code merged to main"
    invoke:
      - workflow: 5-deployment/deployment-workflow
        agent: Diana
        environment: dev
        auto: true  # Automatic invocation

    then_if_success:
      - workflow: 5-deployment/deployment-workflow
        agent: Diana
        environment: staging
        auto: config.deployment.auto_deploy_environments.includes('staging')

  # Trigger 2: During dev-story (database changes detected)
  on_database_schema_change:
    condition: "Migration files created during implementation"
    invoke:
      - workflow: 5-deployment/database-migration
        agent: Diana
        environment: local
        mode: test
        auto: true

  # Trigger 3: Container-based project
  on_dockerfile_change:
    condition: "Dockerfile modified OR container config changed"
    invoke:
      - workflow: 5-deployment/container-build
        agent: Diana
        auto: true

  # Trigger 4: Infrastructure changes
  on_infrastructure_change:
    condition: "Terraform/Pulumi files modified"
    invoke:
      - workflow: 5-deployment/infrastructure-provision
        agent: Diana
        environment: dev
        auto: false  # Require manual approval

  # Trigger 5: Performance concerns
  on_performance_concern:
    condition: "Story tagged 'performance' OR acceptance criteria mention performance"
    invoke:
      - workflow: 5-deployment/performance-profiling
        agent: Phoenix
        environment: staging
        auto: true

release_triggers:

  # Trigger 1: Epic completion
  after_epic_complete:
    condition: "All epic stories == 'done' AND retrospective complete"
    invoke:
      - workflow: 6-release/release-workflow
        agent: Rita
        auto: config.release.auto_release_on_epic_complete

  # Trigger 2: Hotfix needed
  on_production_incident:
    condition: "Incident severity == 'critical'"
    invoke:
      - workflow: 6-release/hotfix-workflow
        agent: Rita
        auto: true

  # Trigger 3: Manual release request
  on_release_command:
    condition: "User invokes /release or /hotfix"
    invoke:
      - workflow: 6-release/release-workflow
        agent: Rita
        auto: false  # Manual flow

monitoring_triggers:

  # Trigger: First deployment to environment
  on_first_deployment_to_env:
    condition: "Environment has no monitoring setup"
    invoke:
      - workflow: 5-deployment/monitoring-setup
        agent: Diana
        auto: true

  # Trigger: Incident detected
  on_incident_detected:
    condition: "Monitoring alert triggered OR user reports incident"
    invoke:
      - workflow: 5-deployment/incident-response
        agent: Diana
        priority: high
        auto: true
```

---

### **Agent Decision Trees**

**Diana (DevOps) Decision Tree:**
```
└─ Story merged to main?
   ├─ YES
   │  ├─ Check deployment config
   │  │  ├─ auto_deploy == true?
   │  │  │  ├─ YES: Invoke deployment-workflow (dev)
   │  │  │  └─ NO: Skip deployment
   │  │  └─ Database migrations detected?
   │  │     ├─ YES: Invoke database-migration FIRST
   │  │     └─ NO: Proceed with deployment
   │  └─ Container-based deployment?
   │     ├─ YES: Invoke container-build FIRST
   │     └─ NO: Use platform CLI directly
   └─ NO: Wait for story completion
```

**Rita (Release Manager) Decision Tree:**
```
└─ Epic complete?
   ├─ YES
   │  ├─ Check release config
   │  │  ├─ auto_release == true?
   │  │  │  ├─ YES: Invoke release-workflow
   │  │  │  └─ NO: Offer to create release
   │  │  └─ Determine release type
   │  │     ├─ Epic == breaking changes? → MAJOR version
   │  │     ├─ Epic == new features? → MINOR version
   │  │     └─ Epic == bug fixes? → PATCH version
   │  └─ Generate changelog from epic stories
   └─ NO: Wait for epic completion

└─ Production incident?
   └─ YES: Invoke hotfix-workflow immediately
```

**Phoenix (Performance) Decision Tree:**
```
└─ Story has performance requirements?
   ├─ YES
   │  ├─ Deployment to staging complete?
   │  │  ├─ YES: Invoke performance-profiling
   │  │  └─ NO: Wait for staging deployment
   │  └─ Performance SLAs defined in story?
   │     ├─ YES: Validate against SLAs
   │     └─ NO: Create baseline metrics
   └─ NO: Skip performance validation

└─ Epic releasing to production?
   └─ YES: Invoke load-testing-workflow
```

**Murat (TEA) Integration:**
```
└─ CI/CD pipeline setup requested?
   ├─ YES
   │  ├─ Invoke testarch/ci (create test pipeline)
   │  └─ Notify Diana to extend with deployment
   └─ Tests failed during deployment?
      └─ YES: Block deployment, alert Amelia (dev)
```

---

## 📋 Sprint Status Enhancement

**Update sprint-status.yaml to track deployment:**

```yaml
# docs/sprint-status.yaml

development_status:
  # Existing story tracking
  1-1-project-repository-structure: done

  # Enhanced with deployment status
  1-2-workflow-yaml-parser:
    story_status: done
    deployed_to:
      dev:
        status: success
        url: https://dev.example.com
        timestamp: 2025-11-13T10:30:00Z
        version: 1.0.0-dev.123
      staging:
        status: success
        url: https://staging.example.com
        timestamp: 2025-11-13T11:00:00Z
        version: 1.0.0-staging.123
      production:
        status: pending
        scheduled_for: 2025-11-15T09:00:00Z

  # Epic-level release tracking
  epic-1:
    epic_status: completed
    retrospective: completed
    release:
      version: 1.0.0
      released: true
      released_at: 2025-11-14T14:00:00Z
      changelog: docs/releases/CHANGELOG-1.0.0.md
      release_notes: docs/releases/RELEASE-1.0.0.md
```

---

## 🎯 Final Decision: **Integrate into BMM**

### **Rationale:**
1. ✅ Seamless user experience (one module = complete lifecycle)
2. ✅ Natural workflow progression (develop → test → deploy → release)
3. ✅ Follows existing pattern (TEA is in BMM)
4. ✅ orchestrate-story extends cleanly
5. ✅ No cross-module handoff complexity
6. ✅ Unified configuration and state

### **Implementation Path:**

**Phase 5: Deployment** (bmm/workflows/5-deployment/)
- deployment-workflow
- rollback-workflow
- database-migration
- container-build
- infrastructure-provision
- monitoring-setup
- incident-response
- performance-profiling

**Phase 6: Release** (bmm/workflows/6-release/)
- release-workflow
- changelog-generation
- hotfix-workflow
- load-testing-workflow

**New Agents in BMM:**
- Diana (DevOps Engineer)
- Rita (Release Manager)
- Phoenix (Performance Engineer)

---

## ✅ Action Items

1. Update bmm/config.yaml with deployment & release settings
2. Create invocation-rules.yaml for agent awareness
3. Enhance orchestrate-story with Steps 9-15 (deployment)
4. Enhance orchestrate-epic with release steps
5. Update sprint-status.yaml schema for deployment tracking
6. Create Phase 5 & 6 workflow directories
7. Build Diana, Rita, Phoenix agents
8. Create 12 workflows across Phase 5 & 6
9. Update BMM README to document new phases
10. Test integration with orchestrator project

---

**Decision:** ✅ **Integrate into BMM as Phase 5 & Phase 6**

This provides the best user experience and cleanest integration with existing BMAD workflows.
