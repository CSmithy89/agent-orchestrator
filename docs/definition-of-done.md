# Definition of Done (DoD)

**Purpose**: Checklist of criteria that must be met before a story can be marked as "done".

**Background**: Established during Epic 1 and enhanced based on retrospective findings to ensure consistent quality and complete documentation tracking.

---

## Story-Level Definition of Done

A story is considered **DONE** when ALL of the following criteria are met:

### 1. Acceptance Criteria ✅
- [ ] All acceptance criteria (AC) are implemented and verified
- [ ] Each AC has been tested and validated
- [ ] Evidence of AC completion is documented in the story file

### 2. Code Implementation ✅
- [ ] All tasks and subtasks in the story are checked off
- [ ] Code follows project coding standards and patterns
- [ ] Code compiles successfully with no TypeScript errors
- [ ] No ESLint warnings or errors (or justified exceptions documented)
- [ ] Async/await patterns used correctly (see `docs/async-patterns-guide.md`)

### 3. Testing ✅
- [ ] **Unit tests** written for all new functions/methods
- [ ] **Integration tests** written for component interactions
- [ ] **All tests passing** (0 failures, 0 errors)
- [ ] Test coverage meets targets:
  - Core components: ≥90% coverage
  - Overall: ≥80% coverage
- [ ] Tests follow patterns in `docs/test-setup-guide.md`
- [ ] No flaky tests (tests pass consistently)

### 4. Code Review ✅
- [ ] Code review completed by senior developer (Alex agent or human)
- [ ] Review status: **APPROVED** ✅
- [ ] All high-priority review findings addressed
- [ ] All medium-priority review findings addressed or documented as technical debt
- [ ] Review notes appended to story file

### 5. Security ✅
- [ ] Security scan completed (automated + manual if needed)
- [ ] No critical or high-severity security vulnerabilities
- [ ] Security score ≥90/100
- [ ] Security scan results documented in story file

### 6. Documentation Tracking ✅ (NEW - Epic 2)

**This is the key improvement from Epic 1 Retrospective!**

- [ ] **All task checkboxes accurately reflect completion status**
  - [ ] Verify each task checkbox is checked if task is complete
  - [ ] Verify no checkboxes are checked for incomplete work
  - [ ] No mismatches between task descriptions and checkbox states

- [ ] **Dev Agent Record is complete and accurate**
  - [ ] Debug log contains meaningful implementation notes
  - [ ] Challenges and solutions are documented
  - [ ] Completion notes summarize what was delivered
  - [ ] Any deferred work is explicitly noted

- [ ] **File List is complete**
  - [ ] All new files are listed
  - [ ] All modified files are listed
  - [ ] File paths are accurate and verifiable

- [ ] **Change Log is complete**
  - [ ] High-level summary of changes
  - [ ] Key implementation decisions documented
  - [ ] Any architectural changes noted

- [ ] **Status field is accurate**
  - [ ] Status reflects current state (should be "review" before DoD check)
  - [ ] Status updated to "done" only after ALL DoD criteria met

### 7. Integration ✅
- [ ] Code integrates cleanly with existing codebase
- [ ] No merge conflicts
- [ ] All dependencies properly declared in package.json
- [ ] No breaking changes to existing APIs (or migration path documented)

### 8. Build & CI/CD ✅
- [ ] Code builds successfully: `npm run build`
- [ ] CI/CD pipeline passes all checks
- [ ] No new warnings introduced in build process

---

## Epic-Level Definition of Done

An epic is considered **DONE** when ALL of the following criteria are met:

### 1. All Stories Complete ✅
- [ ] All stories in the epic marked "done"
- [ ] All story-level DoD criteria satisfied for each story

### 2. Quality Validation ✅
- [ ] **Traceability Matrix** completed (all requirements tested)
- [ ] **NFR Assessment** passed (performance, security, reliability)
- [ ] **Test Review** completed (test quality validated)

### 3. Documentation ✅
- [ ] README updated with new features (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Architecture documentation reviewed and updated
- [ ] CHANGELOG updated with epic changes

### 4. Retrospective ✅
- [ ] Epic retrospective completed
- [ ] Lessons learned documented
- [ ] Action items identified for next epic
- [ ] Sprint status updated (epic marked "done")

---

## Documentation Tracking Best Practices

**To prevent the documentation tracking issues identified in Epic 1 Retrospective:**

### During Implementation (Dev Agent)
1. **Check off tasks as you complete them** - don't batch at the end
2. **Update Dev Agent Record continuously** - add notes as you work
3. **Maintain File List in real-time** - add files as you create/modify them
4. **Document challenges immediately** - don't rely on memory later

### Before Marking Story "Review" (Dev Agent)
1. **Perform self-review of story file**:
   - Read through all tasks - are checkboxes accurate?
   - Review Dev Agent Record - is it complete?
   - Check File List - did you miss any files?
   - Verify Change Log - does it match what you did?

### During Code Review (Code Reviewer)
1. **Verify documentation accuracy**:
   - Check that task checkboxes match actual implementation
   - Confirm File List matches git diff
   - Validate Dev Agent Record is meaningful (not just "implemented")
   - Request changes if documentation is incomplete

### Before Marking Story "Done" (Scrum Master or Dev)
1. **Final documentation audit**:
   - Scan all checkboxes - 100% complete?
   - Read Dev Agent Record - tells the story of implementation?
   - Verify File List - all files accounted for?
   - Check Change Log - clear summary?

---

## DoD Violation Consequences

**If DoD is not met:**
- Story **cannot** be marked "done"
- Story remains in "review" status
- Dev agent must address gaps before story can proceed

**Common DoD violations from Epic 1:**
- ❌ All tasks implemented but checkboxes not checked (Stories 1.7, 1.10)
- ❌ Tests failing but story marked ready for review
- ❌ Code review findings not addressed
- ❌ Documentation (Dev Agent Record) empty or generic

---

## Checklist for Marking Story Done

Use this checklist in the `story-done` workflow:

```markdown
## DoD Checklist

### Implementation
- [ ] All acceptance criteria met
- [ ] All tasks/subtasks checked off
- [ ] Code compiles with no errors

### Testing
- [ ] All tests passing (0 failures)
- [ ] Coverage targets met (90%+ core, 80%+ overall)
- [ ] No flaky tests

### Review
- [ ] Code review completed
- [ ] Review status: APPROVED
- [ ] All high/medium priority findings addressed

### Security
- [ ] Security scan completed
- [ ] Security score ≥90/100

### Documentation (CRITICAL - Epic 2 Improvement)
- [ ] Task checkboxes accurately reflect completion
- [ ] Dev Agent Record is complete and meaningful
- [ ] File List includes all new/modified files
- [ ] Change Log summarizes changes
- [ ] Status field is accurate

### Integration
- [ ] Builds successfully
- [ ] CI/CD passes
- [ ] No breaking changes
```

---

## References

- **Epic 1 Retrospective**: `docs/retrospective-epic-1.md` - Identified documentation tracking issues
- **Implementation Workflow Guide**: `docs/implementation-workflow-guide.md` - Overall workflow
- **Test Setup Guide**: `docs/test-setup-guide.md` - Testing standards
- **Async Patterns Guide**: `docs/async-patterns-guide.md` - Code quality standards

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-04 | Initial DoD established |
| 1.1 | 2025-11-07 | **Enhanced documentation tracking** (Epic 1 Retrospective Action Item #3) |

---

**Last Updated**: 2025-11-07
**Status**: Active - Apply to all stories in Epic 2 and beyond
**Owner**: Scrum Master (Bob agent)
