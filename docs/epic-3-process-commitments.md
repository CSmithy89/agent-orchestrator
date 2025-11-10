# Epic 3 Process Commitments

**Date**: 2025-11-10
**Status**: Active
**Context**: Story 2.9 (Technical Debt Resolution), Action Item #3

---

## Overview

Epic 2 retrospective identified process deviations that accumulated technical debt. This document establishes **mandatory process commitments** for Epic 3 and all subsequent epics to prevent recurrence.

## Critical Finding from Epic 2

**Problem**: Epic 2 bypassed code review for 2 stories (Stories 2.4 and 2.5), allowing:
- Documentation tracking issues to go undetected
- OAuth authentication pattern inconsistencies to persist
- Quality safeguards to be circumvented

**Impact**: Technical debt accumulated that required Story 2.9 to resolve, delaying Epic 3 start.

**Root Cause**: Branch protection was not enabled, allowing direct commits to `main` without review.

---

## Mandatory Process Commitments for Epic 3

### 1. Code Review Process (100% Compliance)

**Commitment**: ALL Epic 3 stories require pull request review and approval before merging to `main`.

**Enforcement**:
- ✅ GitHub branch protection enabled on `main` branch (see Configuration section)
- ✅ PR template enforces review checklist
- ✅ Definition of Done updated with PR requirement

**No Exceptions**: Even small changes require PR review to:
- Catch documentation tracking errors
- Verify OAuth authentication pattern compliance
- Validate async pattern usage
- Ensure test coverage requirements
- Maintain quality standards

**Process**:
1. Developer creates feature branch from `main`
2. Developer implements story following DoD
3. Developer creates PR using template
4. Developer performs self-review against PR checklist
5. Reviewer performs code review
6. Developer addresses review feedback
7. Reviewer approves PR
8. Developer merges PR (or auto-merge if configured)

### 2. Branch Protection Configuration

**Required Settings** (configured in GitHub repository settings):

```yaml
Branch Protection Rule: main
  ✅ Require pull request reviews before merging
    - Required approving reviews: 1
    - Dismiss stale pull request approvals when new commits are pushed: ✅
    - Require review from Code Owners: (optional)

  ✅ Require status checks to pass before merging
    - Required checks:
      - Lint & Code Quality
      - Test Suite
      - Build

  ✅ Require branches to be up to date before merging: (optional - recommended)

  ✅ Do not allow bypassing the above settings
    - Exception: Administrators can override in emergency
```

**Verification**:
```bash
# This should fail:
git push origin main

# Error: Updates were rejected because the tip of your current branch is behind
# its remote counterpart. You must create a pull request.
```

### 3. Emergency Bypass Procedure

**When Allowed**:
- Production-down hotfixes requiring immediate deployment
- Critical security vulnerabilities
- Data loss prevention

**Procedure**:
1. Administrator with override permission must approve bypass
2. Bypass must be documented in `docs/emergency-bypass-log.md`
3. Post-merge PR review required within 24 hours
4. Retrospective item created to understand why emergency occurred

**Log Format**:
```markdown
## Emergency Bypass - [Date]

- **Story**: [Story ID and title]
- **Reason**: [Why bypass was necessary]
- **Approved By**: [Administrator name]
- **Commit**: [Commit SHA]
- **Post-Merge Review**: [Link to post-merge PR review]
- **Lessons Learned**: [What can prevent this in future]
```

### 4. Pull Request Template Compliance

**All PRs Must Complete**:
- Description and context
- Related story/issue linkage
- Type of change classification
- Changes made summary
- Testing section (test coverage + manual testing)
- **Code Review Checklist** (comprehensive quality checks)
- Definition of Done confirmation

**Special Checklist Sections**:
- **For Agent Stories**: OAuth authentication pattern compliance
- **For All Stories**: Async pattern compliance
- **For All Stories**: Testing standards compliance
- **For All Stories**: Documentation tracking

**Reference**: `.github/pull_request_template.md`

### 5. Definition of Done Updates

**New DoD Requirement** (v1.3):

Section 4: Code Review ✅
```markdown
- [ ] Pull request created and linked to story
- [ ] PR template completed with all sections
- [ ] Self-review completed against PR checklist
- [ ] Code review completed by senior developer or peer
- [ ] Review status: APPROVED ✅
- [ ] All high-priority review findings addressed
- [ ] All medium-priority review findings addressed or documented as technical debt
- [ ] Review notes appended to story file
```

**Reference**: `docs/definition-of-done.md` v1.3

### 6. Review Responsibilities

**Developer Responsibilities**:
- Create clear, focused PRs (one story per PR)
- Complete PR template thoroughly
- Perform self-review before requesting review
- Respond to review feedback promptly
- Address all review findings or discuss with reviewer

**Reviewer Responsibilities**:
- Review within 24 hours of request
- Use PR checklist systematically
- Provide constructive, actionable feedback
- Verify DoD compliance
- Approve only when all criteria met

**Escalation**:
- If review blocked > 24 hours: Escalate to Scrum Master
- If reviewer/developer disagree: Escalate to Architect
- If uncertain about pattern: Reference pattern documentation

---

## Quality Safeguards Restored

### 1. OAuth Authentication Pattern

**Guard**: PR checklist verifies `'claude-code'` provider usage for all agent implementations

**Reference**: `docs/llm-provider-patterns.md`

**Verification**:
- [ ] All `LLMConfig` objects use `provider: 'claude-code'`
- [ ] JSDoc examples show `'claude-code'` provider
- [ ] Integration tests use `'claude-code'` provider

### 2. Async Pattern Compliance

**Guard**: PR checklist verifies async/await usage

**Reference**: `docs/async-patterns-guide.md`

**Verification**:
- [ ] All async functions use async/await
- [ ] All promises properly awaited
- [ ] Error handling present for async operations
- [ ] No sync methods in async code

### 3. Testing Standards

**Guard**: PR checklist verifies test coverage and quality

**Reference**: `docs/testing-guide.md` (created in Story 2.9 Task 2)

**Verification**:
- [ ] All tests passing (0 failures)
- [ ] Coverage targets met (≥90% core, ≥80% overall)
- [ ] Shared test utilities used
- [ ] Test isolation maintained

### 4. Documentation Tracking

**Guard**: PR checklist verifies documentation accuracy

**Reference**: `docs/definition-of-done.md` Section 7

**Verification**:
- [ ] Task checkboxes match completion status
- [ ] Dev Agent Record complete and meaningful
- [ ] File List accurate
- [ ] Change Log summarizes changes

---

## Metrics and Accountability

### Epic 3 Quality Metrics

**Target**: 100% compliance with all process commitments

**Tracked Metrics**:
- **PR Review Rate**: 100% of stories have PR review
- **Branch Protection Bypasses**: 0 bypasses (except documented emergencies)
- **PR Template Completion**: 100% of PRs complete all sections
- **DoD Compliance**: 100% of stories meet DoD before merge

**Measurement**:
- Track in `docs/sprint-status.yaml`
- Review in Epic 3 retrospective
- Compare to Epic 2 (2 stories without PR review = 22% non-compliance)

### Accountability

**Scrum Master (Bob)**:
- Verify PR reviews are completed
- Track metrics in sprint status
- Escalate process violations
- Report metrics in retrospective

**Architect (Winston)**:
- Review architectural decisions in PRs
- Verify pattern compliance (OAuth, async, testing)
- Provide guidance on technical concerns

**Developers (Amelia, etc.)**:
- Follow PR review process
- Complete PR template thoroughly
- Address review feedback
- Maintain quality standards

---

## Success Criteria

Epic 3 process compliance is successful when:

✅ **100% PR Review Rate**: All 10+ Epic 3 stories reviewed before merge
✅ **0 Direct Commits**: Branch protection prevents all direct commits to `main`
✅ **0 Quality Escapes**: No post-merge discoveries of:
- OAuth authentication pattern violations
- Async pattern violations
- Test coverage gaps
- Documentation tracking errors

✅ **No Technical Debt from Process Deviations**: Epic 3 retrospective shows 0 action items related to skipped reviews or process bypasses

---

## References

- **Epic 2 Retrospective**: `docs/retrospective-epic-2.md` - Action Item #3
- **Story 2.9**: `docs/stories/2-9-technical-debt-resolution.md` - Task 3
- **Definition of Done v1.3**: `docs/definition-of-done.md`
- **PR Template**: `.github/pull_request_template.md`
- **Pattern Documentation**:
  - OAuth: `docs/llm-provider-patterns.md`
  - Async: `docs/async-patterns-guide.md`
  - Testing: `docs/testing-guide.md` (created in Story 2.9)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-10 | Initial process commitments (Story 2.9 Task 3) |

---

**Maintained by**: Scrum Master (Bob agent)
**Next Review**: Epic 3 Retrospective
**Status**: Active - Apply to all Epic 3 stories

---

## Configuration Instructions for GitHub Branch Protection

**To enable branch protection** (requires repository admin access):

1. Navigate to: `https://github.com/[org]/agent-orchestrator/settings/branches`

2. Click "Add branch protection rule"

3. Configure as follows:
   - **Branch name pattern**: `main`
   - ✅ Require a pull request before merging
     - ✅ Require approvals: 1
     - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
     - Status checks: `Lint & Code Quality`, `Test Suite`, `Build`
   - ✅ Require branches to be up to date before merging (recommended)
   - ✅ Do not allow bypassing the above settings

4. Click "Create" or "Save changes"

5. Test protection:
   ```bash
   # This should fail with permission error:
   git push origin main
   ```

6. Document activation in Story 2.9 completion notes

**Status**: ⚠️ **ACTION REQUIRED** - Manual GitHub settings configuration needed
