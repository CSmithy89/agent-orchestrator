# BMI/BMM Enhancement Strategy: Update-Safe Architecture

**Date:** 2025-11-13
**Critical Issue:** How to extend BMM without breaking on upstream updates

---

## 🚨 The Problem

### **Scenario:**
1. We extend BMM by adding Phase 5 & 6 directly to `bmad/bmm/`
2. User runs: `npx bmad-method@alpha update`
3. Installer fetches latest BMM from upstream
4. **Our Phase 5 & 6 get overwritten!** 😱

### **Why This Happens:**
```bash
# BMAD installer update process:
npx bmad-method@alpha update
  ↓
Fetches: https://github.com/bmad-code-org/BMAD-METHOD
  ↓
Replaces: bmad/bmm/ with upstream version
  ↓
Result: Our custom Phase 5 & 6 = GONE
```

---

## 🎯 Solution: Hybrid Architecture (Best of Both Worlds)

### **Approach: Build as Separate BMI Module, Integrate Seamlessly**

**Key Insight:** We can have BMI as a separate module that LOOKS and FEELS like part of BMM to users, but remains update-safe.

---

## 🏗️ Update-Safe Architecture

### **Directory Structure:**

```
agent-orchestrator/
├── bmad/
│   ├── core/           # ← Upstream (don't touch)
│   ├── cis/            # ← Upstream (don't touch)
│   ├── bmb/            # ← Upstream (don't touch)
│   ├── bmm/            # ← Upstream (don't touch)
│   │   ├── agents/
│   │   ├── workflows/
│   │   │   ├── 1-analysis/
│   │   │   ├── 2-plan-workflows/
│   │   │   ├── 3-solutioning/
│   │   │   ├── 4-implementation/
│   │   │   └── testarch/
│   │   └── config.yaml
│   │
│   └── bmi/            # ← OUR MODULE (update-safe!)
│       ├── agents/
│       │   ├── diana.md
│       │   ├── rita.md
│       │   └── phoenix.md
│       │
│       ├── workflows/
│       │   ├── 5-deployment/         # Phase 5 workflows
│       │   │   ├── deployment-workflow/
│       │   │   ├── rollback-workflow/
│       │   │   ├── database-migration/
│       │   │   ├── container-build/
│       │   │   ├── infrastructure-provision/
│       │   │   ├── monitoring-setup/
│       │   │   ├── incident-response/
│       │   │   └── performance-profiling/
│       │   │
│       │   └── 6-release/            # Phase 6 workflows
│       │       ├── release-workflow/
│       │       ├── changelog-generation/
│       │       ├── hotfix-workflow/
│       │       └── load-testing-workflow/
│       │
│       ├── integration/               # Integration with BMM
│       │   ├── orchestrate-story-extension.md
│       │   ├── orchestrate-epic-extension.md
│       │   └── bmm-integration-hooks.yaml
│       │
│       ├── config.yaml                # BMI configuration
│       └── README.md
│
├── .claude/
│   └── commands/
│       └── bmad/
│           ├── bmm/
│           │   └── workflows/
│           │       # Official BMM commands (from upstream)
│           │
│           └── bmi/                   # OUR COMMANDS (update-safe!)
│               ├── agents/
│               │   ├── diana.md
│               │   ├── rita.md
│               │   └── phoenix.md
│               │
│               └── workflows/
│                   ├── deployment-workflow.md
│                   ├── release-workflow.md
│                   └── ... (12 workflow commands)
│
└── .gitignore
    # Ignore upstream modules (will be reinstalled)
    /bmad/core/
    /bmad/cis/
    /bmad/bmm/
    /bmad/bmb/

    # Keep our custom module
    !/bmad/bmi/
```

---

## 🔗 Seamless Integration Strategy

### **Make BMI Feel Like BMM Phase 5 & 6**

**1. Slash Command Integration**

Users invoke workflows like they're part of BMM:

```bash
# User perspective:
/deploy              # Feels like BMM workflow
/release             # Feels like BMM workflow
/rollback            # Feels like BMM workflow

# Actually calls:
bmad/bmi/workflows/5-deployment/deployment-workflow/
bmad/bmi/workflows/6-release/release-workflow/
bmad/bmi/workflows/5-deployment/rollback-workflow/
```

**Implementation:**
```markdown
<!-- .claude/commands/bmad/bmi/workflows/deploy.md -->
---
description: 'Deploy application to target environment (BMI Phase 5)'
---

# deploy

Execute BMI deployment workflow (integrated with BMM lifecycle).

Load and execute: {project-root}/bmad/bmi/workflows/5-deployment/deployment-workflow/workflow.yaml

This workflow integrates seamlessly with BMM orchestrate-story and orchestrate-epic.
```

**2. orchestrate-story Integration**

**Current orchestrate-story** (in upstream BMM):
```yaml
Steps 0-8: Create, context, dev, review, merge, push
END: "Story deployed!" (just git push)
```

**Our Extension** (in BMI):
```markdown
<!-- bmad/bmi/integration/orchestrate-story-extension.md -->

# orchestrate-story Extension for Deployment

**INTEGRATION POINT:** After BMM orchestrate-story Step 8

When orchestrate-story completes Step 8 (git push main), check if BMI module is installed:

```bash
if [ -d "bmad/bmi" ]; then
  # BMI installed - extend workflow

  # Step 9: Check deployment config
  auto_deploy=$(yq '.deployment.auto_deploy_on_merge' bmad/bmi/config.yaml)

  if [ "$auto_deploy" = "true" ]; then
    # Step 10-15: Run deployment workflows
    # Invoke bmad/bmi/workflows/5-deployment/deployment-workflow
  fi
fi
```

**How to Integrate:**
- BMM orchestrate-story remains unchanged (from upstream)
- We create a WRAPPER command that calls BMM orchestrate-story
- After BMM finishes, our wrapper checks for BMI and extends
```

**3. Configuration Integration**

**Instead of modifying bmad/bmm/config.yaml (gets overwritten), use bmad/bmi/config.yaml:**

```yaml
# bmad/bmi/config.yaml

# Inherit BMM settings
inherit_from: '{project-root}/bmad/bmm/config.yaml'

# BMI-specific settings
deployment:
  auto_deploy_on_merge: true
  auto_deploy_environments:
    - dev
    - staging
  default_platform: "auto"
  # ... full deployment config

release:
  auto_release_on_epic_complete: false
  version_strategy: "semantic"
  # ... full release config

monitoring:
  platform: "prometheus"
  # ... monitoring config

performance:
  profiling_tool: "clinic"
  # ... performance config
```

**4. Agent Integration**

**BMI agents (Diana, Rita, Phoenix) live in bmad/bmi/agents/ but work with BMM workflows:**

```markdown
<!-- bmad/bmi/agents/diana.md -->

# Diana - DevOps Engineer

## Integration with BMM

Diana extends BMM's development lifecycle by adding deployment capabilities.

**Invoked by:**
- BMM orchestrate-story (Step 10+) - if BMI installed
- BMM orchestrate-epic (release step) - if BMI installed
- User commands: /deploy, /rollback, /infrastructure

**Collaborates with:**
- Bob (SM) - Receives deployment triggers
- Murat (TEA) - Runs smoke tests post-deployment
- Phoenix - Validates performance post-deployment
```

---

## 🔄 Update Workflow

### **When Upstream Updates BMM:**

```bash
# User runs update
npx bmad-method@alpha update

# Installer process:
1. Fetches latest from github.com/bmad-code-org/BMAD-METHOD
2. Updates bmad/core/, bmad/cis/, bmad/bmm/, bmad/bmb/
3. DOES NOT TOUCH bmad/bmi/ (our custom module)
4. Updates .claude/commands/bmad/{core,cis,bmm,bmb}/
5. DOES NOT TOUCH .claude/commands/bmad/bmi/ (our commands)

# Result:
✅ BMM updated to latest
✅ BMI preserved (update-safe)
✅ Integration continues to work
```

### **If Integration Breaks:**

If upstream BMM changes break our integration:

```bash
# Check what changed
git diff bmad/bmm/

# Update our integration layer
# Edit: bmad/bmi/integration/orchestrate-story-extension.md
# Adjust to new BMM workflow structure

# Test integration
/deploy --dry-run
```

---

## 📦 Module Installation

### **User Installs BMAD + BMI:**

```bash
# Step 1: Install official BMAD
npx bmad-method@alpha install
  # Installs: core, cis, bmm, bmb

# Step 2: Our project already has BMI in repo
git clone agent-orchestrator
cd agent-orchestrator
# bmad/bmi/ already exists in repo

# Step 3: Use BMI workflows
/deploy
/release
# Works seamlessly!
```

**No separate installation needed** - BMI is part of the orchestrator repo.

---

## 🎯 Contribution Path to Upstream

### **Phase 1: Build Locally (Now)**
- Build BMI as separate module in `bmad/bmi/`
- Test thoroughly in orchestrator project
- Prove value and stability

### **Phase 2: Prepare for Contribution (Later)**
- Document Phase 5 & 6 design
- Create comprehensive test suite
- Write contribution guidelines
- Ensure BMAD v6 compliance

### **Phase 3: Submit Upstream PR (When Ready)**
```bash
# Fork official repo
git clone https://github.com/bmad-code-org/BMAD-METHOD
cd BMAD-METHOD

# Move BMI into BMM
cp -r ../agent-orchestrator/bmad/bmi/* src/modules/bmm/

# Restructure as Phase 5 & 6
mv src/modules/bmm/workflows/5-deployment src/modules/bmm/workflows/5-deployment
mv src/modules/bmm/workflows/6-release src/modules/bmm/workflows/6-release
mv src/modules/bmm/agents/diana.md src/modules/bmm/agents/diana.agent.yaml

# Submit PR
git checkout -b feature/bmm-deployment-release-phases
git commit -m "Add Phase 5 (Deployment) & Phase 6 (Release) to BMM"
gh pr create
```

### **Phase 4: If Accepted**
- BMI becomes official part of BMM
- All users get it via `npx bmad-method@alpha install`
- We can remove our local `bmad/bmi/` and use official

### **Phase 5: If Not Accepted Yet**
- Keep BMI as local module
- Continue updating as upstream evolves
- No harm, still works perfectly

---

## 📋 .gitignore Strategy

```gitignore
# Ignore upstream modules (reinstalled by npx bmad-method)
/bmad/core/
/bmad/cis/
/bmad/bmm/
/bmad/bmb/

# Keep our custom BMI module
!/bmad/bmi/

# Ignore upstream commands (regenerated by installer)
/.claude/commands/bmad/core/
/.claude/commands/bmad/cis/
/.claude/commands/bmad/bmm/
/.claude/commands/bmad/bmb/

# Keep our BMI commands
!/.claude/commands/bmad/bmi/

# Keep BMAD config
!/.bmad/
```

---

## 🎯 Decision: Hybrid Model

**Build BMI as separate module that integrates with BMM**

**Advantages:**
- ✅ Update-safe (upstream updates don't break us)
- ✅ Feels integrated to users (seamless experience)
- ✅ Can contribute upstream when ready
- ✅ Can evolve independently
- ✅ No fork maintenance
- ✅ Best of both worlds

**Implementation:**
1. Build BMI in `bmad/bmi/` (not `bmad/bmm/`)
2. Create integration layer for BMM workflows
3. Slash commands in `.claude/commands/bmad/bmi/`
4. Separate config: `bmad/bmi/config.yaml`
5. Preserve on upstream updates
6. Submit to upstream when mature

---

## 📝 What This Means for Development

### **Build Process:**

**Instead of:**
```
❌ Modify bmad/bmm/ directly
❌ Add Phase 5 & 6 to bmad/bmm/workflows/
❌ Add agents to bmad/bmm/agents/
```

**We do:**
```
✅ Create bmad/bmi/ module
✅ Add workflows to bmad/bmi/workflows/5-deployment/ and 6-release/
✅ Add agents to bmad/bmi/agents/
✅ Create integration hooks in bmad/bmi/integration/
✅ Make slash commands in .claude/commands/bmad/bmi/
```

### **User Experience:**

**Still seamless:**
```bash
# Users don't know it's a separate module
/deploy                    # Deploy to environment
/release                   # Create release
/orchestrate-story         # Auto-deploys if configured

# Works exactly as if integrated into BMM
```

---

## ✅ Final Architecture Decision

**Build BMI as:**
- ✅ Separate module (`bmad/bmi/`)
- ✅ Designed for BMM integration
- ✅ Update-safe architecture
- ✅ Contribution-ready for upstream
- ✅ Seamless user experience

**This gives us:**
- Update safety ← Critical!
- Clean separation ← Maintainable
- Easy contribution ← Future-ready
- Great UX ← User-friendly

---

**Next Step:** Create BMI module with integration layer instead of modifying BMM directly.
