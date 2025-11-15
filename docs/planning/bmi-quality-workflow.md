# BMI Quality Workflow: audit-workflow & redoc Strategy

**Date:** 2025-11-13
**Purpose:** Define when and how to use audit-workflow and redoc for optimal quality

---

## 🎯 The Question

**Should we run audit-workflow and redoc:**
- **Before** module creation? (Nothing to audit yet)
- **After** complete creation? (Batch all issues at the end)
- **During** creation iteratively? (Catch issues early)

---

## ✅ Recommended: Iterative Quality Gates

### **Approach: Build → Audit → Fix → Repeat**

**Why Iterative:**
1. ✅ Catch compliance issues early (easier to fix)
2. ✅ Learn patterns as you build (apply to future workflows)
3. ✅ Avoid massive rework at the end
4. ✅ Maintain consistent quality throughout
5. ✅ Documentation stays current with code

---

## 📋 Optimal Development Workflow

### **Phase 1: Module Structure (Week 1)**

**Step 1.1: Create Module Scaffold**
```bash
# Use BMad Builder to create module structure
/bmad:bmb:workflows:create-module

# Creates:
bmad/bmi/
├── agents/
├── workflows/
├── config.yaml
└── README.md
```

**Step 1.2: Audit Module Structure (FIRST AUDIT)**
```bash
# No workflows yet, but audit module structure
/bmad:bmb:workflows:audit-workflow --target=module-structure

# Checks:
- Directory structure follows BMAD conventions
- config.yaml format correct
- Module metadata present
- README template in place
```

**Expected Output:**
```
✅ Module structure compliant
⚠️ Add module description to README
⚠️ Define install-config.yaml for future installation
```

**Fix issues before proceeding.**

---

### **Phase 2: Agent Creation (Week 1)**

**Step 2.1: Create Diana Agent**
```bash
/bmad:bmb:workflows:create-agent

# Creates: bmad/bmi/agents/diana.md
```

**Step 2.2: Audit Diana (AGENT AUDIT)**
```bash
/bmad:bmb:workflows:audit-workflow --target=agent --path=bmad/bmi/agents/diana.md

# Checks:
- Persona completeness
- Menu structure valid
- Workflow references correct
- Communication style defined
- Principles clear
```

**Expected Output:**
```
✅ Agent structure valid
✅ Persona complete
⚠️ Add more workflow references to menu
✅ Communication style defined
```

**Fix, then proceed to Rita, then Phoenix.**

**Step 2.3: Create Rita & Phoenix**
- Repeat audit after each agent
- Fix issues before moving to next

---

### **Phase 3: Core Workflows (Weeks 2-3)**

**Incremental Workflow Development:**

**Step 3.1: Create deployment-workflow**
```bash
/bmad:bmb:workflows:create-workflow

# Creates: bmad/bmi/workflows/5-deployment/deployment-workflow/
```

**Step 3.2: AUDIT IMMEDIATELY (WORKFLOW AUDIT #1)**
```bash
/bmad:bmb:workflows:audit-workflow --path=bmad/bmi/workflows/5-deployment/deployment-workflow

# Comprehensive checks:
- workflow.yaml structure valid
- Variable usage correct
- Instructions.md complete
- Template.md (if needed)
- No bloat or redundancy
- Follows BMAD v6 standards
```

**Expected Output:**
```
✅ workflow.yaml valid
⚠️ Missing validation checklist.md
✅ Instructions clear
⚠️ Variable 'environment' not defined in workflow.yaml
✅ No bloat detected
```

**Step 3.3: Fix Issues**
- Add checklist.md
- Define 'environment' variable
- Re-audit to confirm

**Step 3.4: Repeat for Each Workflow**
```
Create rollback-workflow → Audit → Fix
Create database-migration → Audit → Fix
Create container-build → Audit → Fix
... etc
```

**Benefits:**
- Each workflow is compliant when complete
- Patterns learned apply to subsequent workflows
- No massive cleanup at the end

---

### **Phase 4: Batch Audit (Week 4)**

**After All Workflows Created, Run Comprehensive Audit:**

**Step 4.1: Full Module Audit**
```bash
/bmad:bmb:workflows:audit-workflow --target=module --path=bmad/bmi

# Checks entire module:
- All workflows compliant
- All agents compliant
- Config.yaml complete
- Cross-workflow consistency
- Integration completeness
```

**Expected Output:**
```
Module: BMI (Infrastructure & DevOps)
Status: ✅ COMPLIANT

Agents: 3/3 compliant
  ✅ Diana
  ✅ Rita
  ✅ Phoenix

Workflows: 12/12 compliant
  ✅ deployment-workflow
  ✅ rollback-workflow
  ✅ database-migration
  ... (all 12)

Issues:
  ⚠️ Minor: Inconsistent variable naming across workflows
  ⚠️ Minor: Some workflows missing usage examples

Recommendations:
  - Standardize variable names (use 'target_environment' not 'env')
  - Add examples to workflow README files
```

**Step 4.2: Fix Batch Issues**
- Address cross-workflow inconsistencies
- Standardize naming conventions
- Add missing examples

---

### **Phase 5: Documentation Generation (Week 5)**

**After module is audit-clean, generate documentation:**

**Step 5.1: Run redoc**
```bash
/bmad:bmb:workflows:redoc --target=bmad/bmi

# Generates/updates:
- bmad/bmi/README.md (comprehensive)
- bmad/bmi/agents/README.md (agent roster)
- bmad/bmi/workflows/5-deployment/README.md
- bmad/bmi/workflows/6-release/README.md
- bmad/bmi/docs/ (additional guides)
```

**What redoc Creates:**

**1. Module README (bmad/bmi/README.md):**
```markdown
# BMI - Infrastructure & DevOps Module

Complete deployment, release, and infrastructure automation for BMAD.

## Overview
[Generated from module-brief and actual structure]

## Agents
- **Diana** - DevOps Engineer [link to agent]
- **Rita** - Release Manager [link to agent]
- **Phoenix** - Performance Engineer [link to agent]

## Workflows

### Phase 5: Deployment
- deployment-workflow - Deploy to environments
- rollback-workflow - Safe rollback
- database-migration - Schema changes
... [all workflows with descriptions]

### Phase 6: Release
- release-workflow - Complete release orchestration
- changelog-generation - Auto-generate changelogs
... [all workflows]

## Quick Start
[Generated usage examples]

## Configuration
[Config.yaml documentation]

## Integration with BMM
[Integration guide]
```

**2. Workflow READMEs:**
- Each workflow folder gets README with usage examples
- Generated from workflow.yaml + instructions.md

**3. Agent Documentation:**
- Agent roster guide
- When to use which agent
- Agent collaboration patterns

**Step 5.2: Review Generated Docs**
- Read through all generated documentation
- Add human touches where needed
- Ensure examples are accurate

**Step 5.3: Re-run redoc if Needed**
- After manual edits, can re-run redoc
- It updates without overwriting manual additions (smart merge)

---

## 🔄 Continuous Quality: Audit on Changes

**After Initial Development:**

**Whenever you modify workflows:**
```bash
# Edit workflow
vim bmad/bmi/workflows/5-deployment/deployment-workflow/instructions.md

# Audit the specific workflow
/bmad:bmb:workflows:audit-workflow --path=bmad/bmi/workflows/5-deployment/deployment-workflow

# Fix any issues introduced
```

**Before committing to git:**
```bash
# Run full module audit
/bmad:bmb:workflows:audit-workflow --target=module --path=bmad/bmi

# Ensure all compliant before commit
git add bmad/bmi/
git commit -m "feat: add new deployment feature"
```

---

## 📊 Quality Metrics Tracking

**Create Quality Log:**
```yaml
# bmad/bmi/quality-log.yaml

audits:
  - date: 2025-11-13
    type: module-structure
    status: passed
    issues_found: 2
    issues_fixed: 2

  - date: 2025-11-14
    type: agent
    target: diana
    status: passed
    issues_found: 1
    issues_fixed: 1

  - date: 2025-11-15
    type: workflow
    target: deployment-workflow
    status: passed
    issues_found: 3
    issues_fixed: 3

  ... [track all audits]

documentation:
  - date: 2025-11-20
    type: redoc
    target: full-module
    files_generated: 15
    manual_edits: 3
```

**Benefits:**
- Track quality improvements over time
- See common issues (learn patterns)
- Demonstrate quality to upstream for contribution

---

## 🎯 Recommended Workflow Summary

### **Week 1: Structure + Agents**
```
Day 1-2:
  - Create module structure
  - ✅ Audit module structure
  - Fix issues

Day 3-4:
  - Create Diana agent
  - ✅ Audit Diana
  - Fix issues

Day 5:
  - Create Rita agent
  - ✅ Audit Rita
  - Create Phoenix agent
  - ✅ Audit Phoenix
```

### **Week 2-3: Workflows (Iterative)**
```
For each workflow:
  1. Create workflow
  2. ✅ Audit workflow immediately
  3. Fix issues
  4. Move to next workflow

Workflow order (by priority):
  1. deployment-workflow → Audit → Fix
  2. rollback-workflow → Audit → Fix
  3. database-migration → Audit → Fix
  4. container-build → Audit → Fix
  5. release-workflow → Audit → Fix
  6. changelog-generation → Audit → Fix
  ... continue for all 12
```

### **Week 4: Integration + Batch Audit**
```
Day 1-2:
  - Create integration layer
  - Test orchestrate-story extension
  - Test orchestrate-epic extension

Day 3:
  - ✅ Full module audit (batch)
  - Identify cross-workflow issues
  - Standardize naming/patterns

Day 4-5:
  - Fix batch issues
  - Re-audit to confirm compliance
```

### **Week 5: Documentation**
```
Day 1-2:
  - ✅ Run redoc (full module)
  - Review generated docs
  - Add manual examples/guides

Day 3-4:
  - Polish documentation
  - Add screenshots/diagrams
  - Create getting-started guide

Day 5:
  - Final audit pass
  - ✅ Confirm all compliant
  - Prepare for testing
```

### **Week 6: Testing + Refinement**
```
Day 1-3:
  - Integration testing with orchestrator
  - Test all workflows end-to-end
  - Fix bugs discovered

Day 4:
  - ✅ Final audit (ensure fixes compliant)
  - Update docs if needed
  - Re-run redoc if major changes

Day 5:
  - Final polish
  - Create demo/examples
  - Tag v1.0.0-alpha
```

---

## ✅ Final Recommendation

**Run audit-workflow:**
- ✅ **After module structure** - Ensure foundation correct
- ✅ **After each agent** - Catch persona issues early
- ✅ **After each workflow** - Immediate feedback loop
- ✅ **After all workflows (batch)** - Cross-workflow consistency
- ✅ **Before git commits** - Quality gate
- ✅ **Final pass before release** - Comprehensive validation

**Run redoc:**
- ❌ **Not before creation** - Nothing to document
- ❌ **Not during creation** - Too early, structure changing
- ✅ **After all workflows complete** - Comprehensive docs
- ✅ **After major changes** - Keep docs current
- ✅ **Before contribution to upstream** - Documentation ready

---

## 🎯 Answer to Your Question

**Should we run audit-workflow and redoc before or after creation?**

**Answer:**

**audit-workflow:**
- ✅ **DURING creation** (iteratively after each component)
- ✅ **AFTER complete creation** (comprehensive batch audit)
- ❌ NOT before (nothing to audit)

**redoc:**
- ❌ NOT during creation (too early)
- ✅ **AFTER complete creation** (Week 5)
- ✅ After major changes (keep docs current)

**Best Practice:**
```
Build incrementally → Audit each piece → Fix → Continue
Complete all → Batch audit → Fix cross-cutting → Document
```

---

**Status:** ✅ **Quality workflow defined**

**Next Step:** Create module structure, then audit-workflow on structure, then build agents with audit after each.
