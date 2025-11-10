# Pull Request

## Description

<!-- Provide a clear and concise description of the changes in this PR -->

## Related Story/Issue

<!-- Link to the story or issue this PR addresses -->
- Story: <!-- e.g., Story 3.1: Winston Agent Implementation -->
- Epic: <!-- e.g., Epic 3: Planning Phase Automation -->
- Resolves: <!-- GitHub issue number, if applicable -->

## Type of Change

<!-- Check the type of change this PR introduces -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Test improvements
- [ ] CI/CD changes

## Changes Made

<!-- List the key changes made in this PR -->

-
-
-

## Testing

<!-- Describe the testing performed to verify this PR -->

### Test Coverage
- [ ] All tests passing (0 failures)
- [ ] New unit tests added
- [ ] Integration tests added/updated
- [ ] Coverage targets met (≥90% core, ≥80% overall)
- [ ] No flaky tests

### Manual Testing
<!-- Describe any manual testing performed -->

-
-

## Code Review Checklist

### General Quality
- [ ] Code follows project coding standards and patterns
- [ ] No TypeScript errors or warnings
- [ ] No ESLint warnings (or exceptions documented)
- [ ] Code is self-documenting or includes helpful comments
- [ ] No duplicate code (DRY principle followed)

### For Agent Implementation Stories
- [ ] **OAuth Authentication Pattern**: All LLM configurations use `'claude-code'` provider
- [ ] **JSDoc Examples**: All documentation examples show `'claude-code'` provider
- [ ] **Integration Tests**: Tests use `'claude-code'` provider with real OAuth token
- [ ] **Environment Variables**: `CLAUDE_CODE_OAUTH_TOKEN` documented
- [ ] Reference: `docs/llm-provider-patterns.md`

### Async Pattern Compliance
- [ ] All async functions use async/await (no callbacks)
- [ ] All promises are properly awaited
- [ ] Error handling present for async operations
- [ ] No `fs.accessSync` or other sync methods in async code
- [ ] Timeouts configured appropriately
- [ ] Reference: `docs/async-patterns-guide.md`

### Testing Standards
- [ ] Tests follow patterns in `docs/testing-guide.md`
- [ ] Shared test utilities used (from `backend/tests/utils/`)
- [ ] No duplicate test setup code
- [ ] API key dependencies handled correctly
- [ ] Test isolation maintained
- [ ] Reference: `docs/test-setup-guide.md`

### Documentation
- [ ] All task checkboxes accurately reflect completion status
- [ ] Dev Agent Record is complete and meaningful
- [ ] File List includes all new/modified files
- [ ] Change Log summarizes changes
- [ ] JSDoc comments added for public APIs
- [ ] README updated (if applicable)

### Security
- [ ] No hardcoded secrets or API keys
- [ ] No sensitive data in logs
- [ ] Input validation present
- [ ] Error messages don't leak sensitive information

### Integration
- [ ] Changes integrate cleanly with existing codebase
- [ ] No merge conflicts
- [ ] All dependencies declared in package.json
- [ ] No breaking changes (or migration path documented)

### Build & CI/CD
- [ ] `npm run build` succeeds
- [ ] CI/CD pipeline passes
- [ ] No new build warnings

## Definition of Done

<!-- Confirm all DoD criteria are met -->

- [ ] All acceptance criteria met
- [ ] All tasks/subtasks complete
- [ ] Code review completed with approval
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security scan passed (if applicable)

## Screenshots/Demo

<!-- If applicable, add screenshots or demo GIFs -->

## Additional Notes

<!-- Any additional information reviewers should know -->

---

## For Reviewers

### Focus Areas

<!-- What should reviewers pay special attention to? -->

-
-

### Questions for Reviewers

<!-- Any specific questions or concerns to address? -->

-
-

---

**References:**
- Definition of Done: `docs/definition-of-done.md`
- OAuth Pattern Guide: `docs/llm-provider-patterns.md`
- Async Patterns Guide: `docs/async-patterns-guide.md`
- Testing Guide: `docs/testing-guide.md`
