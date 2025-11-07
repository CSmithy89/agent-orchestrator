# Story 2.0: Dependency Migration & Environment Setup

Status: drafted

## Story

As a development team,
I want to upgrade critical dependencies to their latest versions,
So that Epic 2 implementation has access to latest features, security patches, and bug fixes.

## Context

Before implementing Epic 2 features (Stories 2.1-2.8), we must upgrade three critical dependencies:
1. **@anthropic-ai/sdk**: v0.20.0 → v0.68.0 (48 versions, minor updates)
2. **openai**: v4.20.0 → v6.2.0 (2 major versions, breaking changes expected)
3. **uuid**: Add v13.0.0 (new dependency, ESM-only)

This story is a **prerequisite** for all Epic 2 feature stories. Without these updates, Epic 2 components will lack access to:
- Prompt caching (Anthropic SDK v0.68)
- Enhanced tool use and streaming (OpenAI SDK v6.2)
- Unique escalation ID generation (UUID v13)

**Reference**: See `docs/dependency-migration-checklist.md` for detailed migration procedures.

## Acceptance Criteria

1. ✅ **@anthropic-ai/sdk upgraded to ^0.68.0**
   - package.json updated
   - npm install succeeds
   - No peer dependency conflicts

2. ✅ **openai upgraded to ^6.2.0**
   - package.json updated
   - Breaking changes reviewed and documented
   - Migration guide consulted: https://github.com/openai/openai-node/releases

3. ✅ **uuid ^13.0.0 installed**
   - New dependency added to package.json
   - ESM import verified: `import { v4 as uuidv4 } from 'uuid'`

4. ✅ **LLMFactory tested with Anthropic SDK v0.68**
   - Create Anthropic client succeeds
   - Test API call with Claude Sonnet 4.5
   - Verify temperature parameters (0.3, 0.5, 0.7)
   - Error handling works (401, 429, 500-599)

5. ✅ **LLMFactory tested with OpenAI SDK v6.2**
   - Create OpenAI client succeeds (verify constructor signature)
   - Test API call with GPT-4
   - Test API call with GPT-4o
   - Verify streaming works
   - Error handling works (401, 429, 500-599)

6. ✅ **UUID generation verified**
   - Test file created: `test-uuid.ts`
   - UUID v4 generation works
   - Valid UUID format verified with regex
   - Test file deleted after verification

7. ✅ **All Epic 1 tests pass**
   - `npm run test` completes with 0 failures
   - No regressions in existing functionality

8. ✅ **Type checking passes**
   - `npm run type-check` completes with 0 errors
   - TypeScript types updated if needed (OpenAI SDK v6 changes)

9. ✅ **Build succeeds**
   - `npm run build` completes successfully
   - No compilation errors

10. ✅ **Integration smoke test**
    - Orchestrator CLI runs: `npm run orchestrator -- --help`
    - Test Epic 1 workflow if available

11. ✅ **Migration checklist completed**
    - All items in `docs/dependency-migration-checklist.md` checked off
    - Any issues documented in checklist notes

12. ✅ **Changes committed and pushed**
    - Git commit with detailed message
    - Push to feature branch
    - Sprint status updated to mark Story 2.0 as 'done'

## Tasks / Subtasks

- [ ] **Task 1**: Update package.json dependencies (AC: #1, #2, #3)
  - [x] Update `@anthropic-ai/sdk` to `^0.68.0` (DONE - already updated)
  - [x] Update `openai` to `^6.2.0` (DONE - already updated)
  - [x] Add `uuid` `^13.0.0` (DONE - already updated)
  - [ ] Run `npm install`
  - [ ] Verify package-lock.json updated correctly
  - [ ] Check for peer dependency warnings/errors

- [ ] **Task 2**: Review Anthropic SDK changes (AC: #4)
  - [ ] Review release notes: v0.21 through v0.68
  - [ ] Check for breaking changes (unlikely for minor versions)
  - [ ] Note new features: prompt caching, enhanced tool use, code execution
  - [ ] Update any type imports if package structure changed

- [ ] **Task 3**: Review OpenAI SDK migration guide (AC: #5)
  - [ ] Read v5.0.0 release notes (breaking changes from v4)
  - [ ] Read v6.0.0 release notes (breaking changes from v5)
  - [ ] Read v6.1.0 release notes (realtime API)
  - [ ] Read v6.2.0 release notes (dev day 2025 launches)
  - [ ] Identify breaking changes affecting LLMFactory
  - [ ] Document required code changes

- [ ] **Task 4**: Test Anthropic SDK integration (AC: #4)
  - [ ] Locate LLMFactory Anthropic provider code (Epic 1 Story 1.3)
  - [ ] Run existing Anthropic provider tests
  - [ ] Create manual test script if needed:
    ```typescript
    import { LLMFactory } from './llm/LLMFactory';

    const factory = new LLMFactory();
    const client = factory.createClient({
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      temperature: 0.3
    });

    const response = await client.invoke('Hello, test message');
    console.log('Anthropic SDK v0.68 test:', response);
    ```
  - [ ] Verify OAuth token priority (CLAUDE_CODE_OAUTH_TOKEN > ANTHROPIC_API_KEY)
  - [ ] Test error handling (remove API key, test 401)
  - [ ] Test rate limiting (verify 429 handling)

- [ ] **Task 5**: Fix OpenAI SDK breaking changes (AC: #5)
  - [ ] Locate OpenAI provider code in LLMFactory
  - [ ] Update constructor if signature changed
  - [ ] Update `client.chat.completions.create()` if needed
  - [ ] Fix streaming implementation if changed
  - [ ] Update error types if changed
  - [ ] Update TypeScript imports if package structure changed
  - [ ] Run OpenAI provider tests
  - [ ] Create manual test script if needed:
    ```typescript
    import { LLMFactory } from './llm/LLMFactory';

    const factory = new LLMFactory();
    const client = factory.createClient({
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.5
    });

    const response = await client.invoke('Hello, test message');
    console.log('OpenAI SDK v6.2 test:', response);
    ```

- [ ] **Task 6**: Test UUID integration (AC: #6)
  - [ ] Create test file:
    ```typescript
    // test-uuid.ts
    import { v4 as uuidv4 } from 'uuid';

    const testId = uuidv4();
    console.log('Generated UUID:', testId);

    const validFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    console.log('Valid format:', validFormat.test(testId));
    ```
  - [ ] Run test: `npx tsx test-uuid.ts`
  - [ ] Verify valid UUID v4 format
  - [ ] Delete test file: `rm test-uuid.ts`

- [ ] **Task 7**: Run full test suite (AC: #7)
  - [ ] Run `npm run test`
  - [ ] Verify 0 test failures
  - [ ] If failures occur:
    - [ ] Identify which tests failed
    - [ ] Determine if caused by dependency upgrades
    - [ ] Fix broken tests or rollback problematic dependency
  - [ ] Check test coverage hasn't decreased

- [ ] **Task 8**: Run type checking (AC: #8)
  - [ ] Run `npm run type-check`
  - [ ] Verify 0 TypeScript errors
  - [ ] If errors occur:
    - [ ] Check if caused by OpenAI SDK type changes
    - [ ] Update type imports/definitions
    - [ ] Fix type mismatches

- [ ] **Task 9**: Run build (AC: #9)
  - [ ] Run `npm run build`
  - [ ] Verify successful compilation
  - [ ] Check dist/ directory for output
  - [ ] If build fails:
    - [ ] Review error messages
    - [ ] Fix compilation issues
    - [ ] Re-run build

- [ ] **Task 10**: Integration smoke test (AC: #10)
  - [ ] Run `npm run orchestrator -- --help`
  - [ ] Verify CLI loads without errors
  - [ ] Test basic workflow if available (Epic 1)
  - [ ] Check console for deprecation warnings

- [ ] **Task 11**: Document migration (AC: #11)
  - [ ] Update `docs/dependency-migration-checklist.md` with completion status
  - [ ] Note any issues encountered
  - [ ] Document workarounds or fixes applied
  - [ ] Add rollback notes if any dependency was problematic

- [ ] **Task 12**: Commit and push changes (AC: #12)
  - [ ] Stage changes: `git add backend/package.json backend/package-lock.json`
  - [ ] Commit with detailed message:
    ```bash
    git commit -m "feat: Complete Story 2.0 - Dependency migration for Epic 2

    Dependencies upgraded:
    - @anthropic-ai/sdk: ^0.20.0 → ^0.68.0 (48 versions)
    - openai: ^4.20.0 → ^6.2.0 (2 major versions)
    - uuid: ^13.0.0 (new dependency)

    Testing completed:
    - All Epic 1 tests passing
    - LLMFactory tested with both providers
    - Type checking passing
    - Build successful
    - Integration smoke test passed

    Breaking changes addressed:
    - OpenAI SDK v6.2 constructor updates
    - UUID v13 ESM-only imports
    - [List any other breaking changes fixed]

    Story 2.0 complete. Ready for Story 2.1."
    ```
  - [ ] Push to remote: `git push -u origin claude/activate-feature-011CUsgWpQHVz8hZr5sQMrq3`
  - [ ] Update sprint status: Mark 2-0-dependency-migration as 'done'

## Dependencies

**Blocks**:
- Story 2.1: Confidence-Based Decision Engine
- Story 2.2: Escalation Queue System
- Story 2.3: Mary Agent - Business Analyst Persona
- Story 2.4: John Agent - Product Manager Persona
- Story 2.5: PRD Workflow Executor
- Story 2.6: PRD Template & Content Generation
- Story 2.7: PRD Quality Validation
- Story 2.8: PRD Validation Tests

**Depends On**:
- Epic 1 Story 1.3: LLM Factory Pattern Implementation (must test with upgraded SDKs)
- Epic 1 Story 1.10: Error Handling & Recovery Infrastructure (must verify retry logic still works)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenAI SDK v6 has breaking changes we can't quickly fix | Medium | High | Rollback plan: `npm install openai@^4.20.0` and defer upgrade |
| Anthropic SDK v0.68 introduces subtle bugs | Low | Medium | Comprehensive testing with real API calls |
| UUID v13 ESM-only causes import issues | Low | Low | Project already uses ESM (`"type": "module"` ✓) |
| Tests fail after upgrades | Medium | High | Fix tests or rollback dependencies, document issues |
| Build breaks due to TypeScript type changes | Medium | Medium | Update type imports, fix type errors |

## Rollback Plan

If migration fails and cannot be fixed within 4 hours:

1. **Rollback package.json**:
   ```bash
   git checkout HEAD~1 backend/package.json
   npm install
   ```

2. **Individual rollbacks**:
   - Anthropic: `npm install @anthropic-ai/sdk@^0.20.0`
   - OpenAI: `npm install openai@^4.20.0`
   - UUID: `npm uninstall uuid` (defer to Story 2.2)

3. **Document blockers**:
   - Add issues to `docs/epic-2-action-items.md`
   - Plan alternative approach or defer Epic 2

4. **Re-plan Sprint**:
   - Assess if Epic 2 can proceed with old dependencies
   - Consider alternative providers (e.g., Anthropic-only)

## Effort Estimate

- **Optimistic**: 2 hours (no breaking changes, all tests pass)
- **Realistic**: 4 hours (minor OpenAI fixes, some test updates)
- **Pessimistic**: 8 hours (significant breaking changes, refactoring needed)

**Recommendation**: Allocate 1 full day for this story with contingency.

## Success Criteria

Story 2.0 is **DONE** when:
- ✅ All 12 acceptance criteria checked off
- ✅ `npm run test` passes with 0 failures
- ✅ `npm run type-check` passes with 0 errors
- ✅ `npm run build` succeeds
- ✅ LLMFactory works with both Anthropic and OpenAI
- ✅ UUID generation verified
- ✅ Migration checklist completed
- ✅ Changes committed and pushed
- ✅ Sprint status updated to 'done'
- ✅ Ready to begin Story 2.1

## Notes

- Migration checklist: `docs/dependency-migration-checklist.md` (comprehensive guide)
- Tech spec dependencies section: `docs/tech-spec-epic-2.md` (lines 560-589)
- External validation report: Completed 2025-11-07, confirmed latest versions

**Created**: 2025-11-07
**Updated**: 2025-11-07
**Story Points**: 3 (small infrastructure story)
