# Task Completion Checklist

## General Guidelines

When a task is marked as complete, ensure the following steps are completed:

### Documentation Tasks (Current Phase)

- [ ] **Document Validation**
  - Verify document follows BMAD template structure
  - Check all required sections are present
  - Ensure markdown formatting is correct
  - Validate YAML frontmatter (if applicable)

- [ ] **File Location**
  - Document saved to correct location in `docs/` folder
  - File naming follows conventions (kebab-case)
  - Related files organized in subdirectories

- [ ] **Workflow Status Update**
  - Update `bmad/workflow-status.md` with completion
  - Update `bmad/sprint-status.yaml` if applicable
  - Mark workflow step as complete

- [ ] **Quality Check**
  - Cross-reference with PRD/Architecture for consistency
  - Verify technical accuracy
  - Check for completeness against acceptance criteria

- [ ] **Git Commit**
  - Stage changes: `git add <files>`
  - Commit with descriptive message
  - Follow commit message format: `<type>(<scope>): <subject>`
  - Push to remote if appropriate

### Development Tasks (Future - When Implementation Starts)

- [ ] **Code Quality**
  - Run linter: `npm run lint` (must pass)
  - Run formatter: `npm run format`
  - Run type checker: `npm run type-check` (no errors)
  - Fix any warnings or errors

- [ ] **Testing**
  - Write unit tests for new functions/classes
  - Run all tests: `npm test` (all passing)
  - Verify test coverage meets threshold (>80%)
  - Add integration tests if needed

- [ ] **Code Review**
  - Self-review code changes
  - Check for security issues
  - Verify error handling is robust
  - Ensure logging is appropriate

- [ ] **Documentation**
  - Add JSDoc comments for public APIs
  - Update README.md if needed
  - Update architecture docs if design changed
  - Add inline comments for complex logic

- [ ] **Story Completion (Implementation Phase)**
  - All acceptance criteria met
  - Code committed to worktree branch
  - Tests passing in CI/CD
  - PR created (if ready for review)
  - Worktree cleanup (after PR merge)

## Phase-Specific Checklists

### Analysis Phase (PRD, Product Brief)
- [ ] Vision alignment clearly stated
- [ ] User personas defined
- [ ] Functional requirements listed
- [ ] Non-functional requirements specified
- [ ] Success metrics defined
- [ ] Risks and assumptions documented

### Planning Phase (Architecture, Tech Spec)
- [ ] System architecture diagram included
- [ ] Component responsibilities defined
- [ ] Data models specified
- [ ] API contracts documented
- [ ] Technology decisions explained
- [ ] Security considerations addressed

### Solutioning Phase (Epics, Stories)
- [ ] Epics have clear business value
- [ ] Stories are independently deliverable
- [ ] Acceptance criteria are testable
- [ ] Dependencies identified
- [ ] Estimates provided (if required)
- [ ] Stories follow template structure

### Implementation Phase (Code Development)
- [ ] Code follows style conventions
- [ ] Tests written and passing
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] PR description complete

### Testing Phase (Test Framework, Automation)
- [ ] Test framework properly configured
- [ ] Test cases cover critical paths
- [ ] Test data/fixtures created
- [ ] CI/CD pipeline integrated
- [ ] Test reports generated
- [ ] Flaky tests fixed

## Pre-Commit Checklist (Quick)

**Before committing any changes:**

1. **Verify Changes**
   ```bash
   git status      # Check staged files
   git diff        # Review changes
   ```

2. **Quality Checks** (when code exists)
   ```bash
   npm run lint    # Check code style
   npm test        # Run tests
   ```

3. **Commit**
   ```bash
   git add <files>
   git commit -m "type(scope): message"
   ```

4. **Review**
   - Read commit message - clear and descriptive?
   - All related files included?
   - No secrets or API keys committed?

## Common Mistakes to Avoid

❌ **Don't:**
- Commit without running tests (when they exist)
- Leave console.log() in production code
- Commit commented-out code (delete or use git stash)
- Include TODO comments without tracking them
- Forget to update documentation
- Mix multiple unrelated changes in one commit
- Commit secrets or API keys
- Leave merge conflict markers

✅ **Do:**
- Write clear commit messages
- Keep commits focused and atomic
- Update tests when changing behavior
- Document complex decisions
- Clean up before committing
- Review your own diff before committing

## Escalation Criteria

**When to escalate to human:**
- Ambiguous requirements (confidence < 75%)
- Security concerns
- Architecture decisions with trade-offs
- Breaking changes required
- Budget/timeline concerns
- Test failures after 2 retries

## Definition of Done (DoD)

**A task is "done" when:**
1. All acceptance criteria met
2. Code/documentation reviewed and approved
3. Tests written and passing
4. No known bugs or issues
5. Documentation updated
6. Changes committed and pushed
7. Workflow status updated
8. Next steps identified (if applicable)
