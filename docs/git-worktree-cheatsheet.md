# Git Worktree Cheat Sheet

**Quick reference for parallel development with git worktrees**

---

## 📖 What Are Worktrees?

Git worktrees allow you to check out multiple branches **simultaneously** in separate directories, all sharing the same `.git` database.

### Visual Example:
```
/home/chris/projects/work/
├── Agent orchastrator/               ← Main repo (main branch)
│   ├── .git/                        ← Shared database
│   └── ...
├── agent-orchestrator-story-1-1/    ← Worktree 1 (feature branch)
│   └── ... (independent files)
└── agent-orchestrator-story-1-2/    ← Worktree 2 (another feature)
    └── ... (independent files)
```

**Key Benefit**: No more `git stash`, no branch switching conflicts, work on multiple stories in parallel!

---

## 🚀 Quick Start

### Using Helper Script (Recommended)

```bash
# Create worktree for Story 1.1
cd "/home/chris/projects/work/Agent orchastrator"
./scripts/worktree.sh create 1-1

# Navigate to worktree
cd ../agent-orchestrator-story-1-1

# Open in VS Code
code .

# Start working!
```

---

## 📋 Helper Script Commands

### Create Worktree
```bash
./scripts/worktree.sh create <story-id>

# Examples:
./scripts/worktree.sh create 1-1    # Story 1.1
./scripts/worktree.sh create 1-2    # Story 1.2
./scripts/worktree.sh create 2-3    # Story 2.3
```

Creates:
- Directory: `../agent-orchestrator-story-<story-id>/`
- Branch: `feature/story-<story-id>-<name>`

### List All Worktrees
```bash
./scripts/worktree.sh list

# Output:
# /path/to/Agent orchastrator        main
# /path/to/agent-orchestrator-story-1-1  feature/story-1-1-project-config
# /path/to/agent-orchestrator-story-1-2  feature/story-1-2-yaml-parser
```

### Remove Worktree
```bash
./scripts/worktree.sh remove <story-id>

# Example:
./scripts/worktree.sh remove 1-1
```

**Important**: Only remove after PR is merged!

### Clean All Worktrees
```bash
./scripts/worktree.sh clean

# Removes ALL worktrees, keeps only main repo
# Use when starting fresh or after completing epic
```

---

## 🔧 Manual Commands (Without Helper)

### Create Worktree
```bash
cd "/home/chris/projects/work/Agent orchastrator"

# Syntax:
git worktree add <path> -b <branch-name>

# Example:
git worktree add ../agent-orchestrator-story-1-1 -b feature/story-1-1-project-config
```

### List Worktrees
```bash
git worktree list
```

### Remove Worktree
```bash
# From main repo:
cd "/home/chris/projects/work/Agent orchastrator"
git worktree remove ../agent-orchestrator-story-1-1

# Or with force (if has uncommitted changes):
git worktree remove ../agent-orchestrator-story-1-1 --force
```

### Prune Deleted Worktrees
```bash
# Clean up worktree metadata after manual deletion
git worktree prune
```

---

## 💼 Complete Workflow

### 1. Start New Story

```bash
# From main repo
cd "/home/chris/projects/work/Agent orchastrator"

# Ensure main is up to date
git checkout main
git pull origin main

# Create worktree
./scripts/worktree.sh create 1-1

# Navigate
cd ../agent-orchestrator-story-1-1

# Verify branch
git branch --show-current
# Output: feature/story-1-1-project-config
```

### 2. Work in Worktree

```bash
# Open VS Code
code .

# Make changes
# Edit files, implement features

# Commit regularly
git add .
git commit -m "feat: implement feature X"

# Push to remote (first time)
git push -u origin feature/story-1-1-project-config

# Subsequent pushes
git push
```

### 3. Create Pull Request

```bash
# From worktree
cd ../agent-orchestrator-story-1-1

# Option A: GitHub CLI (fastest)
gh pr create \
  --title "Story 1.1: Project Repository Structure & Configuration" \
  --body "Implements ProjectConfig class..."

# Option B: Web UI
git push
# Then visit GitHub and click "Create Pull Request"
```

### 4. Continue Work While PR Under Review

```bash
# PR #1 is under review, start Story 1.2!
cd "/home/chris/projects/work/Agent orchastrator"
./scripts/worktree.sh create 1-2

cd ../agent-orchestrator-story-1-2
code .

# Work on Story 1.2 while Story 1.1 CI runs
# Zero conflicts, zero waiting!
```

### 5. After PR Merged

```bash
# Go back to main repo
cd "/home/chris/projects/work/Agent orchastrator"

# Remove worktree
./scripts/worktree.sh remove 1-1

# Update main
git checkout main
git pull origin main

# Story 1.1 code is now in main!
# Story 1.2 worktree continues working
```

---

## 🎯 Parallel Development Patterns

### Pattern 1: Work on Two Stories Simultaneously

```bash
# Terminal 1: Story 1.1
cd ../agent-orchestrator-story-1-1
npm run test -- --watch

# Terminal 2: Story 1.2
cd ../agent-orchestrator-story-1-2
npm run dev

# VS Code Window 1: Story 1.1
# VS Code Window 2: Story 1.2

# No conflicts!
```

### Pattern 2: Quick Hotfix While Working on Feature

```bash
# Working on Story 2.5 in worktree
cd ../agent-orchestrator-story-2-5

# Bug reported in production!
# Create hotfix worktree
cd "/home/chris/projects/work/Agent orchastrator"
git worktree add ../agent-orchestrator-hotfix -b hotfix/urgent-bug

cd ../agent-orchestrator-hotfix
# Fix bug
git commit -m "fix: urgent production bug"
git push -u origin hotfix/urgent-bug
gh pr create --title "Hotfix: Urgent Bug"

# Merge immediately
# Clean up hotfix worktree
cd "/home/chris/projects/work/Agent orchastrator"
git worktree remove ../agent-orchestrator-hotfix
git pull origin main

# Continue working on Story 2.5
cd ../agent-orchestrator-story-2-5
# No disruption to your work!
```

### Pattern 3: Experiment Without Risk

```bash
# Create experimental worktree
git worktree add ../agent-orchestrator-experiment -b experiment/new-approach

cd ../agent-orchestrator-experiment
# Try risky refactoring

# If it works: merge
# If it fails: delete worktree
cd "/home/chris/projects/work/Agent orchastrator"
git worktree remove ../agent-orchestrator-experiment --force
git branch -D experiment/new-approach

# Main work unaffected!
```

---

## ⚠️ Common Mistakes & Solutions

### Mistake 1: Forgetting to Remove Worktree After Merge

**Problem**: Old worktrees pile up, confusion ensues

**Solution**:
```bash
# List all worktrees
./scripts/worktree.sh list

# Remove merged ones
./scripts/worktree.sh remove 1-1
./scripts/worktree.sh remove 1-2

# Or clean all at once
./scripts/worktree.sh clean
```

### Mistake 2: Trying to Check Out Same Branch in Multiple Worktrees

**Problem**: Git prevents checking out same branch twice

**Solution**: Each worktree needs unique branch
```bash
# ❌ Wrong:
git worktree add ../worktree2 -b feature/story-1-1  # Already exists!

# ✅ Correct:
git worktree add ../worktree2 -b feature/story-1-2  # New branch
```

### Mistake 3: Deleting Worktree Directory Manually

**Problem**: Git metadata not cleaned up

**Solution**:
```bash
# If you deleted directory manually:
git worktree prune

# Always use proper removal:
./scripts/worktree.sh remove 1-1
```

### Mistake 4: Forgetting Which Worktree You're In

**Problem**: Commit to wrong branch

**Solution**: Check before committing
```bash
# Always verify:
git branch --show-current
pwd

# Use PS1 prompt showing branch (add to ~/.bashrc):
export PS1='\[\e[32m\]\u@\h \[\e[34m\]\w\[\e[33m\]$(__git_ps1 " (%s)")\[\e[0m\]\$ '
```

---

## 🎓 Advanced Tips

### Tip 1: Open All Worktrees in VS Code Workspace

Create `.vscode/agent-orchestrator.code-workspace`:
```json
{
  "folders": [
    {
      "name": "Main Repo",
      "path": "/home/chris/projects/work/Agent orchastrator"
    },
    {
      "name": "Story 1.1",
      "path": "/home/chris/projects/work/agent-orchestrator-story-1-1"
    },
    {
      "name": "Story 1.2",
      "path": "/home/chris/projects/work/agent-orchestrator-story-1-2"
    }
  ]
}
```

Open workspace: `code agent-orchestrator.code-workspace`

### Tip 2: Sync Dependencies Across Worktrees

```bash
# Install dependency in one worktree
cd ../agent-orchestrator-story-1-1
npm install new-package

# Sync to other worktrees
cd ../agent-orchestrator-story-1-2
npm install  # Reads package-lock.json from shared .git

# Or: Share node_modules with symlinks (advanced)
```

### Tip 3: Run Tests in All Worktrees

```bash
# Create test script: scripts/test-all-worktrees.sh
#!/bin/bash
for worktree in ../agent-orchestrator-story-*; do
  echo "Testing $worktree..."
  cd "$worktree"
  npm run test || echo "❌ Tests failed in $worktree"
done
```

---

## 🔍 Troubleshooting

### Issue: "fatal: 'path' already exists"

**Cause**: Worktree directory already exists

**Fix**:
```bash
# Remove existing directory
rm -rf ../agent-orchestrator-story-1-1

# Or use different path
git worktree add ../agent-orchestrator-story-1-1-v2 -b feature/story-1-1
```

### Issue: "fatal: cannot remove locked working tree"

**Cause**: Worktree is in use (files open)

**Fix**:
```bash
# Close all files/terminals in that worktree
# Then:
git worktree unlock ../agent-orchestrator-story-1-1
git worktree remove ../agent-orchestrator-story-1-1
```

### Issue: "Worktree still has uncommitted changes"

**Cause**: Trying to remove worktree with uncommitted work

**Fix**:
```bash
# Option A: Commit changes
cd ../agent-orchestrator-story-1-1
git add .
git commit -m "wip: save work"

# Option B: Force remove (loses changes!)
cd "/home/chris/projects/work/Agent orchastrator"
git worktree remove ../agent-orchestrator-story-1-1 --force
```

---

## 📊 Comparison: Traditional vs Worktrees

### Traditional Workflow (Without Worktrees)

```bash
# Working on Story 1.1
git checkout feature/story-1-1
# Edit files...

# Need to work on Story 1.2
git stash  # Save Story 1.1 work
git checkout feature/story-1-2
# Edit files...

# Back to Story 1.1
git checkout feature/story-1-1
git stash pop  # Restore work
# Potential conflicts 😢

# Time wasted: ~5 minutes per switch
# Risk: Stash conflicts, lost work
```

### Worktree Workflow

```bash
# Working on Story 1.1
cd ../agent-orchestrator-story-1-1
# Edit files...

# Need to work on Story 1.2
cd ../agent-orchestrator-story-1-2
# Edit files immediately!

# Back to Story 1.1
cd ../agent-orchestrator-story-1-1
# Continue instantly!

# Time wasted: 0 seconds
# Risk: Zero
```

---

## 🎯 Best Practices

1. **One Worktree Per Story**
   - Clean, organized, no confusion
   - Easy to track progress

2. **Remove Worktrees After Merge**
   - Keep workspace clean
   - Avoid outdated code

3. **Use Descriptive Branch Names**
   - `feature/story-1-1-project-config` ✅
   - `fix/urgent-bug-123` ✅
   - `test123` ❌

4. **Keep Main Repo on Main Branch**
   - Don't work directly in main repo
   - Use worktrees for all feature work

5. **Commit Regularly in Worktrees**
   - Small, focused commits
   - Easy to review
   - Safe to remove worktree

---

## 🆚 When NOT to Use Worktrees

**Don't use worktrees for:**
- ❌ Quick one-line fixes (just commit on main branch)
- ❌ Reviewing others' code (use `gh pr checkout` instead)
- ❌ Short-lived experiments (<10 minutes)

**Use normal branches for:**
- Quick hotfixes
- Code reviews
- Temporary experiments

---

## 📚 Additional Resources

- **Git Documentation**: https://git-scm.com/docs/git-worktree
- **Pro Git Book**: https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging
- **Helper Script**: `scripts/worktree.sh` (in this repo)

---

## 🚀 Quick Reference Card

```bash
# === Daily Commands ===

# Start story
./scripts/worktree.sh create X-X
cd ../agent-orchestrator-story-X-X
code .

# Work and commit
git add .
git commit -m "feat: ..."
git push -u origin feature/story-X-X-name

# Create PR
gh pr create --fill

# After merge
cd "/home/chris/projects/work/Agent orchastrator"
./scripts/worktree.sh remove X-X
git pull origin main

# === Status ===
./scripts/worktree.sh list

# === Cleanup ===
./scripts/worktree.sh clean
```

---

**Happy parallel developing!** 🌳✨
