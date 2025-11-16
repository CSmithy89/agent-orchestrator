# Story 3.6: Security Gate Validation Workflow

Status: drafted

## Story

As the Agent Orchestrator,
I want a mandatory security gate that validates architecture completeness for authentication, authorization, secrets management, input validation, API security, encryption, and threat modeling,
So that security gaps are identified before progression to the solutioning phase and all architectures meet minimum security standards.

## Acceptance Criteria

1. **Security Gate Executes After Architecture Workflow**
   - Security gate runs automatically in ArchitectureWorkflowExecutor Step 8
   - Validates completed architecture.md document
   - Six security categories checked: authentication, authorization, secrets, input validation, API security, encryption, threat model
   - Each category scored: satisfied or unsatisfied
   - Overall score calculated: (satisfied checks / total checks) × 100

2. **Pass Threshold and Blocking Behavior**
   - Pass threshold: ≥95% score (19 of 20 checks must pass)
   - If passed: Log success, continue to Step 9
   - If failed: Generate gap report, create escalation, BLOCK workflow progression
   - Blocking prevents Epic 4 (Solutioning) from starting
   - Audit trail logged with timestamp, score, and evidence

3. **Authentication & Authorization Validation**
   - Check authentication strategy defined in architecture.md
   - Check authorization mechanism specified (RBAC, ABAC, etc.)
   - Check session management approach documented
   - Check token/credential handling specified
   - Extract evidence from NFR section

4. **Secrets Management Validation**
   - Check secrets storage strategy defined (environment variables, key vault, etc.)
   - Check API key handling approach documented
   - Check credential rotation policy specified
   - Check secrets not hardcoded in config examples
   - Extract evidence from security section

5. **Input Validation & API Security Validation**
   - Check input validation strategy defined
   - Check SQL injection prevention approach documented
   - Check XSS prevention measures specified
   - Check CORS policy defined
   - Check rate limiting strategy specified
   - Check API authentication mechanism documented
   - Extract evidence from API specifications and NFR sections

6. **Encryption & Threat Model Validation**
   - Check data-at-rest encryption specified
   - Check data-in-transit encryption specified (TLS/SSL)
   - Check encryption key management approach documented
   - Check OWASP Top 10 threat coverage assessed
   - Check threat mitigation strategies defined
   - Extract evidence from security section

7. **Gap Report Generation**
   - If validation fails, generate detailed gap report
   - List all unsatisfied security checks
   - Provide specific recommendations for each gap
   - Include section references where information should be added
   - Format as markdown for escalation

8. **Audit Trail and Escalation**
   - Log security gate result to workflow state
   - Include timestamp, score, checks passed/failed, evidence
   - If failed: Create escalation with gap report
   - Escalation includes: security score, gaps, recommendations
   - User must review and approve before workflow can continue

## Tasks / Subtasks

### Task 1: Create SecurityGateValidator Class (3-4 hours)

- [ ] Create `backend/src/core/security-gate-validator.ts`
- [ ] Implement SecurityGateValidator class
- [ ] Define SecurityGateCheck interface (from Epic 3 tech spec lines 227-244)
- [ ] Define SecurityGateResult interface
- [ ] Method: `validate(architecturePath: string): Promise<SecurityGateResult>`
- [ ] Method: `checkCategory(category: string, content: string): SecurityGateCheck`
- [ ] Method: `generateGapReport(gaps: string[]): string`

### Task 2: Implement Authentication & Authorization Checks (1-2 hours)

- [ ] Method: `checkAuthentication(architectureContent: string): SecurityGateCheck`
- [ ] Search for authentication strategy keywords
- [ ] Search for authorization mechanism keywords
- [ ] Search for session management approach
- [ ] Search for token/credential handling
- [ ] Extract evidence (section references)
- [ ] Return check result with satisfied boolean

### Task 3: Implement Secrets Management Checks (1-2 hours)

- [ ] Method: `checkSecretsManagement(architectureContent: string): SecurityGateCheck`
- [ ] Search for secrets storage strategy
- [ ] Search for API key handling approach
- [ ] Search for credential rotation policy
- [ ] Validate no hardcoded secrets in examples
- [ ] Extract evidence
- [ ] Return check result

### Task 4: Implement Input Validation & API Security Checks (2-3 hours)

- [ ] Method: `checkInputValidation(architectureContent: string): SecurityGateCheck`
- [ ] Search for input validation strategy
- [ ] Search for SQL injection prevention
- [ ] Search for XSS prevention measures
- [ ] Method: `checkAPISecurity(architectureContent: string): SecurityGateCheck`
- [ ] Search for CORS policy
- [ ] Search for rate limiting strategy
- [ ] Search for API authentication
- [ ] Extract evidence
- [ ] Return check results

### Task 5: Implement Encryption & Threat Model Checks (2-3 hours)

- [ ] Method: `checkEncryption(architectureContent: string): SecurityGateCheck`
- [ ] Search for data-at-rest encryption
- [ ] Search for data-in-transit encryption (TLS/SSL)
- [ ] Search for encryption key management
- [ ] Method: `checkThreatModel(architectureContent: string): SecurityGateCheck`
- [ ] Search for OWASP Top 10 coverage
- [ ] Search for threat mitigation strategies
- [ ] Extract evidence
- [ ] Return check results

### Task 6: Implement Gap Report Generation (1-2 hours)

- [ ] Method: `generateGapReport(result: SecurityGateResult): string`
- [ ] Format unsatisfied checks as markdown
- [ ] Include specific recommendations for each gap
- [ ] Include section references for adding information
- [ ] Include overall score and pass/fail status
- [ ] Return formatted markdown report

### Task 7: Integrate with ArchitectureWorkflowExecutor (1-2 hours)

- [ ] Update ArchitectureWorkflowExecutor Step 8 (remove placeholder)
- [ ] Call SecurityGateValidator.validate(architecturePath)
- [ ] Handle passed result: Log success, continue to Step 9
- [ ] Handle failed result: Generate gap report, create escalation, BLOCK workflow
- [ ] Update workflow state with security gate result
- [ ] Emit security_gate.passed or security_gate.failed event

### Task 8: Write Integration Tests (2-3 hours)

- [ ] Create `backend/tests/integration/security-gate-validator.test.ts`
- [ ] Test: Validate complete architecture (all checks pass)
- [ ] Test: Validate incomplete architecture (some checks fail)
- [ ] Test: Each security category check independently
- [ ] Test: Gap report generation
- [ ] Test: Pass threshold (95%) behavior
- [ ] Test: Blocking behavior on failure
- [ ] Verify test coverage >80%

## Dependencies

**Blocking Dependencies:**
- Story 3-3 (Architecture Workflow Executor): Integration point (Step 8)
- Story 3-5 (Architecture Template): Template structure for validation

**Soft Dependencies:**
- Story 2.2 (Escalation Queue): Create escalation on security gate failure

**Enables:**
- Epic 4 (Solutioning Phase): Blocked until security gate passes

## Dev Notes

### Security Gate Checks

**Category 1: Authentication (4 checks)**
1. Authentication strategy defined (OAuth, JWT, SAML, etc.)
2. Authorization mechanism specified (RBAC, ABAC, etc.)
3. Session management approach documented
4. Token/credential handling specified

**Category 2: Secrets Management (3 checks)**
1. Secrets storage strategy defined
2. API key handling approach documented
3. Credential rotation policy specified

**Category 3: Input Validation (3 checks)**
1. Input validation strategy defined
2. SQL injection prevention documented
3. XSS prevention measures specified

**Category 4: API Security (3 checks)**
1. CORS policy defined
2. Rate limiting strategy specified
3. API authentication mechanism documented

**Category 5: Encryption (3 checks)**
1. Data-at-rest encryption specified
2. Data-in-transit encryption specified (TLS/SSL)
3. Encryption key management documented

**Category 6: Threat Model (4 checks)**
1. OWASP Top 10 threats assessed
2. Threat mitigation strategies defined
3. Security testing approach documented
4. Incident response plan outlined

**Total: 20 checks, Pass threshold: 19/20 (95%)**

### Search Keywords

**Authentication:**
- "authentication", "OAuth", "JWT", "SAML", "SSO", "login", "credentials"
- "authorization", "RBAC", "ABAC", "permissions", "access control"
- "session", "token", "cookie", "bearer"

**Secrets:**
- "secrets", "environment variables", "key vault", "secrets manager"
- "API key", "credentials", "rotation", "hardcoded"

**Input Validation:**
- "input validation", "sanitization", "whitelist", "blacklist"
- "SQL injection", "parameterized queries", "prepared statements"
- "XSS", "cross-site scripting", "HTML encoding", "content security policy"

**API Security:**
- "CORS", "cross-origin", "rate limiting", "throttling"
- "API authentication", "API key", "bearer token"

**Encryption:**
- "encryption", "AES", "RSA", "TLS", "SSL", "HTTPS"
- "data at rest", "data in transit", "key management", "KMS"

**Threat Model:**
- "OWASP", "threat model", "security testing", "penetration testing"
- "incident response", "security monitoring", "vulnerability"

### Gap Report Example

```markdown
# Security Gate Validation Report

**Overall Score:** 85% (17/20 checks satisfied)
**Status:** ❌ FAILED (threshold: 95%)
**Date:** 2025-11-12

## Unsatisfied Checks

### Category: Secrets Management
**Check:** Credential rotation policy specified
**Status:** ❌ UNSATISFIED
**Recommendation:** Add credential rotation policy to "Non-Functional Requirements > Security" section. Specify rotation frequency (e.g., 90 days) and automated rotation mechanism.

### Category: Encryption
**Check:** Encryption key management documented
**Status:** ❌ UNSATISFIED
**Recommendation:** Add encryption key management approach to "Non-Functional Requirements > Security" section. Specify key storage (e.g., AWS KMS, Azure Key Vault), key rotation policy, and access controls.

### Category: Threat Model
**Check:** Incident response plan outlined
**Status:** ❌ UNSATISFIED
**Recommendation:** Add incident response plan to "Non-Functional Requirements > Security" section. Include detection, containment, eradication, recovery, and post-incident review procedures.

## Next Steps

1. Review gap report and update architecture.md to address unsatisfied checks
2. Re-run security gate validation
3. Once security gate passes, workflow can continue to solutioning phase
```

### References

- Epic 3 Tech Spec: `docs/epics/epic-3-tech-spec.md` (lines 123: SecurityGateValidator, lines 788: AC-3.6, lines 509: Step 8)
- PRD: FR-SEC-006 (Mandatory Security Gate)
- Architecture: Security requirements section

## Change Log

- **2025-11-12**: Story created (drafted)
