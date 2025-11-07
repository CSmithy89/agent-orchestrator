# Dependency Migration Checklist - Epic 2 Preparation

**Date**: 2025-11-07
**Epic**: Epic 2 - Analysis Phase Automation
**Status**: Pre-Implementation

## Overview

This checklist tracks the migration of three critical dependencies before Epic 2 Story 2.1 implementation begins. All breaking changes must be tested and verified before development starts.

---

## 1. Anthropic SDK: v0.20.0 → v0.68.0

**Change Type**: Minor version updates (48 versions)
**Breaking Changes**: Low risk (minor version updates are backward compatible)
**Impact**: LLMFactory, DecisionEngine, Mary/John agents

### Migration Steps

- [ ] **Review release notes**: Check https://github.com/anthropics/anthropic-sdk-typescript/releases for v0.21 through v0.68
- [ ] **Install updated version**: `npm install @anthropic-ai/sdk@^0.68.0`
- [ ] **Test LLMFactory integration** (Epic 1 Story 1.3):
  - [ ] Verify `createClient('anthropic', 'claude-sonnet-4-5', config)` still works
  - [ ] Test API key authentication (ANTHROPIC_API_KEY / CLAUDE_CODE_OAUTH_TOKEN)
  - [ ] Verify streaming responses work as expected
  - [ ] Check error handling for rate limits (429) and auth errors (401/403)
- [ ] **Test temperature parameter**: Ensure 0.3 (DecisionEngine) and 0.5 (John agent) work correctly
- [ ] **Verify new features are available** (optional to use):
  - [ ] Prompt caching support
  - [ ] Enhanced tool use/function calling
  - [ ] Code execution capabilities
  - [ ] File upload support
- [ ] **Run existing Epic 1 tests**: Ensure no regressions in LLM client functionality
- [ ] **Update LLMFactory if needed**: Add types for new SDK features

### Rollback Plan

If v0.68 causes issues:
```bash
npm install @anthropic-ai/sdk@^0.20.0
```
Then investigate specific version causing issues by binary search (e.g., try v0.50, v0.35, etc.)

---

## 2. OpenAI SDK: v4.20.0 → v6.2.0

**Change Type**: Major version upgrade (2 major versions)
**Breaking Changes**: High risk (major versions typically include breaking changes)
**Impact**: LLMFactory (if OpenAI provider is used), Mary/John agents with GPT models

### Migration Steps

- [ ] **Review official migration guide**: https://github.com/openai/openai-node/releases
  - [ ] Read v5.0.0 release notes (breaking changes from v4)
  - [ ] Read v6.0.0 release notes (breaking changes from v5)
  - [ ] Read v6.1.0 release notes (realtime API support)
  - [ ] Read v6.2.0 release notes (dev day 2025 launches)
- [ ] **Backup current working code**: Create git branch `backup/openai-v4` before upgrade
- [ ] **Install updated version**: `npm install openai@^6.2.0`
- [ ] **Update LLMFactory OpenAI client creation** (likely breaking changes):
  - [ ] Check if `new OpenAI({ apiKey, ... })` constructor changed
  - [ ] Verify `client.chat.completions.create()` method signature
  - [ ] Test streaming with `stream: true` parameter
  - [ ] Check error types and error handling
- [ ] **Test with GPT-4 and GPT-4o models**:
  - [ ] Verify `model: 'gpt-4'` works
  - [ ] Verify `model: 'gpt-4o'` works
  - [ ] Test temperature parameters (0.3, 0.5, 0.7)
- [ ] **Review TypeScript type changes**:
  - [ ] Check if `ChatCompletionMessageParam` type changed
  - [ ] Verify `ChatCompletion` response type
  - [ ] Update type imports if package structure changed
- [ ] **Test error handling**:
  - [ ] Rate limit errors (429)
  - [ ] Auth errors (401/403)
  - [ ] Server errors (500-599)
  - [ ] Network errors
- [ ] **Run all LLMFactory tests**: Ensure OpenAI client tests pass
- [ ] **Test with Epic 1 RetryHandler**: Verify exponential backoff still works

### Known Breaking Changes to Watch For

Based on typical major version upgrades:
- Constructor parameter changes (e.g., config object structure)
- Method signature changes (e.g., required vs optional parameters)
- Response object structure changes
- Error class changes (e.g., `OpenAIError` → different error types)
- Package export structure changes (e.g., `import OpenAI from 'openai'` vs `import { OpenAI } from 'openai'`)

### Rollback Plan

If v6.2 has unfixable breaking changes:
```bash
npm install openai@^4.20.0
```

Then:
1. Assess if we can use v5.x instead (check release notes)
2. If v4 is required, document limitations and plan future upgrade
3. Consider using OpenAI API directly with fetch if SDK is problematic

---

## 3. UUID: None → v13.0.0 (New Dependency)

**Change Type**: New dependency
**Breaking Changes**: N/A (new install)
**Impact**: EscalationQueue (Story 2.2)
**Important**: v13+ is ESM-only (CommonJS dropped)

### Migration Steps

- [ ] **Verify project uses ESM**: Check `package.json` has `"type": "module"` ✓ (confirmed)
- [ ] **Install uuid**: `npm install uuid@^13.0.0`
- [ ] **Install TypeScript types**: `npm install -D @types/uuid` (if needed)
- [ ] **Create test file to verify ESM import**:
  ```typescript
  // test-uuid.ts
  import { v4 as uuidv4 } from 'uuid';

  const testId = uuidv4();
  console.log('Generated UUID:', testId);
  console.log('Valid format:', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(testId));
  ```
- [ ] **Run test**: `npx tsx test-uuid.ts` should print valid UUID
- [ ] **Document usage pattern** for EscalationQueue:
  ```typescript
  import { v4 as uuidv4 } from 'uuid';

  class EscalationQueue {
    async add(escalation: Omit<Escalation, 'id' | 'status' | 'createdAt'>): Promise<string> {
      const id = uuidv4();
      const newEscalation: Escalation = {
        id,
        status: 'pending',
        createdAt: new Date(),
        ...escalation
      };
      // Save to .bmad-escalations/{id}.json
      return id;
    }
  }
  ```
- [ ] **No tests needed for uuid itself** (stable, well-tested library)
- [ ] **Delete test file**: `rm test-uuid.ts` after verification

### Rollback Plan

If v13 has ESM import issues:
```bash
npm uninstall uuid
npm install uuid@^10.0.0
```

v10 supports both ESM and CommonJS. Then update imports if needed.

---

## Integration Testing Checklist

After all three migrations are complete:

- [ ] **Run full test suite**: `npm run test`
- [ ] **Check test coverage**: `npm run test:coverage` (should remain >80%)
- [ ] **Run type checking**: `npm run type-check` (should have 0 errors)
- [ ] **Run linter**: `npm run lint` (should pass)
- [ ] **Test LLMFactory with both providers**:
  - [ ] Create Anthropic client → make test API call
  - [ ] Create OpenAI client → make test API call
- [ ] **Manual smoke test**:
  - [ ] Run orchestrator CLI: `npm run orchestrator -- --help`
  - [ ] Test Epic 1 workflow if available
- [ ] **Build project**: `npm run build` (should succeed)
- [ ] **Check for deprecation warnings**: Review console output for any warnings

---

## Post-Migration Actions

Once all checkboxes above are complete:

- [ ] **Commit dependency updates**:
  ```bash
  git add backend/package.json backend/package-lock.json
  git commit -m "chore: Update dependencies for Epic 2

  - @anthropic-ai/sdk: ^0.20.0 → ^0.68.0
  - openai: ^4.20.0 → ^6.2.0
  - uuid: ^13.0.0 (new dependency)

  All tests passing. Breaking changes reviewed and verified."
  ```
- [ ] **Push to remote**: `git push -u origin claude/activate-feature-011CUsgWpQHVz8hZr5sQMrq3`
- [ ] **Update sprint status**: Mark dependency migration as complete
- [ ] **Notify team** (if applicable): Share migration results and any issues encountered
- [ ] **Document any issues**: Add notes to epic-2-action-items.md if needed
- [ ] **Proceed to Story 2.1**: Begin DecisionEngine implementation with updated dependencies

---

## Troubleshooting Guide

### Issue: npm install fails with peer dependency conflicts

**Solution**:
```bash
npm install --legacy-peer-deps
```

Or update conflicting peer dependencies.

### Issue: TypeScript errors after OpenAI upgrade

**Cause**: Type definitions changed in v6.x

**Solution**:
1. Check if `@types/openai` is installed (may not be needed in v6)
2. Update import statements to match new package structure
3. Review TypeScript error messages for specific type mismatches
4. Consult https://github.com/openai/openai-node/releases for type migration guide

### Issue: "Cannot find module 'uuid'" error

**Cause**: ESM import path issue

**Solution**:
```typescript
// Wrong (CommonJS style)
const { v4 } = require('uuid');

// Correct (ESM style)
import { v4 as uuidv4 } from 'uuid';
```

### Issue: Anthropic API calls failing with 401

**Cause**: API key not set or expired

**Solution**:
1. Check `.env` file has `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`
2. Verify key is valid (not expired, not revoked)
3. Test key with curl:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-sonnet-4-5-20250929","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
   ```

### Issue: OpenAI rate limits hit immediately

**Cause**: Tier limits are lower than expected

**Solution**:
1. Check current tier: https://platform.openai.com/account/limits
2. Request tier upgrade if needed
3. Implement rate limiting in LLMFactory (use Epic 1's RetryHandler)
4. Consider using Anthropic as primary provider (higher free tier limits)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Status |
|------|------------|--------|-------------------|
| OpenAI v6 has breaking changes we can't quickly fix | Medium | High | Rollback plan prepared ✓ |
| Anthropic v0.68 introduces subtle bugs | Low | Medium | Comprehensive testing checklist ✓ |
| UUID v13 ESM-only causes import issues | Low | Low | Project already uses ESM ✓ |
| Integration testing reveals incompatibilities | Low | Medium | Full test suite + manual testing ✓ |
| Dependencies conflict with existing Epic 1 code | Low | High | Staged testing (deps → tests → build) ✓ |

---

## Timeline Estimate

- **Anthropic SDK migration**: 30 minutes (low risk)
- **OpenAI SDK migration**: 2-3 hours (high risk, breaking changes)
- **UUID installation**: 15 minutes (low risk)
- **Integration testing**: 1 hour
- **Total**: ~4 hours

**Recommendation**: Allocate 1 day (8 hours) for migration including debugging time and contingency.

---

## Success Criteria

✅ **Migration is complete when**:
1. All three dependencies updated in package.json ✓
2. `npm install` succeeds without errors
3. `npm run test` passes with 0 failures
4. `npm run type-check` passes with 0 errors
5. `npm run build` succeeds
6. LLMFactory works with both Anthropic and OpenAI clients
7. UUID generation works in test file
8. No deprecation warnings in console
9. Changes committed and pushed to git
10. Ready to begin Story 2.1 implementation

---

## References

- **Anthropic SDK**: https://github.com/anthropics/anthropic-sdk-typescript
- **OpenAI SDK**: https://github.com/openai/openai-node
- **UUID**: https://github.com/uuidjs/uuid
- **Epic 2 Tech Spec**: docs/tech-spec-epic-2.md
- **LLMFactory**: Epic 1 Story 1.3 implementation
- **RetryHandler**: Epic 1 Story 1.10 implementation
