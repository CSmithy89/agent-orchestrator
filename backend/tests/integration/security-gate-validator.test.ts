/**
 * SecurityGateValidator Integration Tests
 *
 * Tests the SecurityGateValidator implementation for Story 3-6.
 * Validates all 20 security checks across 6 categories with 95% pass threshold.
 *
 * Story 3-6 - Security Gate Validation Workflow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SecurityGateValidator } from '../../src/core/security-gate-validator.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SecurityGateValidator', () => {
  const testDir = '.security-gate-test';
  let validator: SecurityGateValidator;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir(testDir, { recursive: true });

    validator = new SecurityGateValidator();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================================================
  // AC #1: Complete Architecture - All Checks Pass
  // ============================================================================
  describe('AC #1: Complete architecture validation', () => {
    it('should pass validation with 100% score when all security requirements are met', async () => {
      const completeArchitecture = `
# System Architecture

## Non-Functional Requirements

### Security

#### Authentication & Authorization
- **Authentication Strategy**: OAuth 2.0 with JWT tokens for stateless authentication
- **Authorization Mechanism**: RBAC (Role-Based Access Control) with granular permissions
- **Session Management**: JWT bearer tokens with refresh token rotation
- **Token Handling**: Secure token storage with httpOnly cookies and credential encryption

#### Secrets Management
- **Secrets Storage**: AWS Secrets Manager for centralized secrets management
- **API Key Handling**: Encrypted API keys with environment variable injection
- **Credential Rotation**: Automated 90-day credential rotation policy with KMS integration

#### Input Validation & XSS Prevention
- **Input Validation Strategy**: Whitelist-based input validation with Joi schema validation
- **SQL Injection Prevention**: Parameterized queries with ORM (Prisma) for all database operations
- **XSS Prevention**: HTML encoding for all user input and CSP (Content Security Policy) headers

#### API Security
- **CORS Policy**: Restrictive cross-origin policy with allowed origins whitelist
- **Rate Limiting**: Token bucket rate limiting (100 req/min per user) with Redis throttling
- **API Authentication**: Bearer token API authentication with API key rotation

#### Encryption
- **Data-at-Rest Encryption**: AES-256 encryption for sensitive data with encrypted database fields
- **Data-in-Transit Encryption**: TLS 1.3 for all HTTPS communication with transport encryption
- **Key Management**: AWS KMS for encryption key management with automated key rotation policy

#### Threat Model & Security Testing
- **OWASP Top 10**: Comprehensive threat model covering OWASP security threats
- **Threat Mitigation**: Layer defense security measures with threat detection and mitigation strategies
- **Security Testing**: Automated penetration testing and vulnerability scanning with security testing pipeline
- **Incident Response**: 24/7 incident response plan with security incident escalation and breach response protocols
`;

      const archPath = path.join(testDir, 'complete-arch.md');
      await fs.writeFile(archPath, completeArchitecture, 'utf-8');

      const result = await validator.validate(archPath);

      expect(result.passed).toBe(true);
      expect(result.overallScore).toBe(100);
      expect(result.checks).toHaveLength(20);
      expect(result.checks.filter(c => c.satisfied)).toHaveLength(20);
      expect(result.gaps).toHaveLength(0);
      expect(result.escalationRequired).toBe(false);
    });
  });

  // ============================================================================
  // AC #2: Pass Threshold - 95% (19/20 checks)
  // ============================================================================
  describe('AC #2: Pass threshold validation', () => {
    it('should pass with exactly 95% score (19/20 checks)', async () => {
      // Architecture missing only incident response (1 check)
      const almostCompleteArchitecture = `
# Architecture

## Security

#### Authentication
OAuth 2.0 with JWT tokens, RBAC authorization, session management with bearer tokens,
secure credential handling

#### Secrets Management
AWS Secrets Manager for secrets storage, encrypted API key handling,
credential rotation policy with KMS

#### Input Validation
Whitelist-based input validation and sanitization, parameterized queries and ORM for
SQL injection prevention, HTML encoding and CSP for XSS prevention

#### API Security
CORS policy with origin restrictions, rate limiting with throttling,
API authentication with bearer tokens

#### Encryption
AES-256 data at rest encryption, TLS 1.3 data in transit encryption,
KMS key management with key rotation

#### Threat Model
OWASP Top 10 threat assessment, threat mitigation strategies,
security testing with penetration tests
`;

      const archPath = path.join(testDir, 'almost-complete-arch.md');
      await fs.writeFile(archPath, almostCompleteArchitecture, 'utf-8');

      const result = await validator.validate(archPath);

      expect(result.passed).toBe(true);
      expect(result.overallScore).toBe(95);
      expect(result.checks.filter(c => c.satisfied)).toHaveLength(19);
      expect(result.gaps).toHaveLength(1);
      expect(result.escalationRequired).toBe(false);
    });

    it('should fail with 90% score (18/20 checks) - below threshold', async () => {
      // Architecture missing incident response and security testing (2 checks)
      const incompleteArchitecture = `
# Architecture

## Security

#### Authentication
OAuth 2.0 with JWT tokens, RBAC authorization, session management, credentials

#### Secrets Management
Secrets Manager for secrets, API key handling, rotation policy

#### Input Validation
Validation strategy, parameterized queries, XSS prevention with HTML encoding

#### API Security
CORS policy, rate limiting, API authentication

#### Encryption
Data at rest encryption with AES, TLS for data in transit, key management with KMS

#### Threat Model
OWASP Top 10 assessment, threat mitigation strategies
`;

      const archPath = path.join(testDir, 'incomplete-arch.md');
      await fs.writeFile(archPath, incompleteArchitecture, 'utf-8');

      const result = await validator.validate(archPath);

      expect(result.passed).toBe(false);
      expect(result.overallScore).toBe(90);
      expect(result.checks.filter(c => c.satisfied)).toHaveLength(18);
      expect(result.gaps).toHaveLength(2);
      expect(result.escalationRequired).toBe(true);
    });
  });

  // ============================================================================
  // AC #3: Authentication & Authorization Category (4 checks)
  // ============================================================================
  describe('AC #3: Authentication & Authorization validation', () => {
    it('should validate authentication strategy', async () => {
      const arch = 'Authentication strategy: OAuth 2.0 with JWT tokens';
      const archPath = path.join(testDir, 'auth-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const authChecks = result.checks.filter(c => c.category === 'authentication');

      expect(authChecks.find(c => c.requirement.includes('Authentication strategy'))?.satisfied).toBe(true);
    });

    it('should validate authorization mechanism', async () => {
      const arch = 'Authorization: RBAC with permissions and access control';
      const archPath = path.join(testDir, 'authz-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const authChecks = result.checks.filter(c => c.category === 'authentication');

      expect(authChecks.find(c => c.requirement.includes('Authorization mechanism'))?.satisfied).toBe(true);
    });

    it('should validate session management', async () => {
      const arch = 'Session management: JWT tokens with bearer authentication';
      const archPath = path.join(testDir, 'session-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const authChecks = result.checks.filter(c => c.category === 'authentication');

      expect(authChecks.find(c => c.requirement.includes('Session management'))?.satisfied).toBe(true);
    });

    it('should validate token/credential handling', async () => {
      const arch = 'Token handling: Secure bearer token storage and credential encryption';
      const archPath = path.join(testDir, 'token-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const authChecks = result.checks.filter(c => c.category === 'authentication');

      expect(authChecks.find(c => c.requirement.includes('Token/credential handling'))?.satisfied).toBe(true);
    });
  });

  // ============================================================================
  // AC #4: Secrets Management Category (3 checks)
  // ============================================================================
  describe('AC #4: Secrets Management validation', () => {
    it('should validate secrets storage strategy', async () => {
      const arch = 'Secrets storage: AWS Secrets Manager with KMS encryption';
      const archPath = path.join(testDir, 'secrets-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const secretsChecks = result.checks.filter(c => c.category === 'secrets');

      expect(secretsChecks.find(c => c.requirement.includes('Secrets storage'))?.satisfied).toBe(true);
    });

    it('should validate API key handling', async () => {
      const arch = 'API key handling: Encrypted credentials in secrets manager';
      const archPath = path.join(testDir, 'apikey-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const secretsChecks = result.checks.filter(c => c.category === 'secrets');

      expect(secretsChecks.find(c => c.requirement.includes('API key handling'))?.satisfied).toBe(true);
    });

    it('should validate credential rotation policy', async () => {
      const arch = 'Credential rotation: 90-day rotation policy for all credentials';
      const archPath = path.join(testDir, 'rotation-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const secretsChecks = result.checks.filter(c => c.category === 'secrets');

      expect(secretsChecks.find(c => c.requirement.includes('rotation policy'))?.satisfied).toBe(true);
    });
  });

  // ============================================================================
  // AC #5: Input Validation Category (3 checks)
  // ============================================================================
  describe('AC #5: Input Validation validation', () => {
    it('should validate input validation strategy', async () => {
      const arch = 'Input validation: Whitelist-based validation and sanitization';
      const archPath = path.join(testDir, 'input-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const inputChecks = result.checks.filter(c => c.category === 'input-validation');

      expect(inputChecks.find(c => c.requirement.includes('Input validation strategy'))?.satisfied).toBe(true);
    });

    it('should validate SQL injection prevention', async () => {
      const arch = 'SQL injection prevention: Parameterized queries with ORM';
      const archPath = path.join(testDir, 'sql-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const inputChecks = result.checks.filter(c => c.category === 'input-validation');

      expect(inputChecks.find(c => c.requirement.includes('SQL injection'))?.satisfied).toBe(true);
    });

    it('should validate XSS prevention', async () => {
      const arch = 'XSS prevention: HTML encoding and CSP headers';
      const archPath = path.join(testDir, 'xss-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const inputChecks = result.checks.filter(c => c.category === 'input-validation');

      expect(inputChecks.find(c => c.requirement.includes('XSS prevention'))?.satisfied).toBe(true);
    });
  });

  // ============================================================================
  // AC #5: API Security Category (3 checks)
  // ============================================================================
  describe('AC #5: API Security validation', () => {
    it('should validate CORS policy', async () => {
      const arch = 'CORS policy: Restrictive cross-origin with allowed origins';
      const archPath = path.join(testDir, 'cors-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const apiChecks = result.checks.filter(c => c.category === 'api-security');

      expect(apiChecks.find(c => c.requirement.includes('CORS'))?.satisfied).toBe(true);
    });

    it('should validate rate limiting', async () => {
      const arch = 'Rate limiting: Throttling with 100 req/min limit';
      const archPath = path.join(testDir, 'ratelimit-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const apiChecks = result.checks.filter(c => c.category === 'api-security');

      expect(apiChecks.find(c => c.requirement.includes('Rate limiting'))?.satisfied).toBe(true);
    });

    it('should validate API authentication', async () => {
      const arch = 'API authentication: Bearer token with API key rotation';
      const archPath = path.join(testDir, 'apiauth-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const apiChecks = result.checks.filter(c => c.category === 'api-security');

      expect(apiChecks.find(c => c.requirement.includes('API authentication'))?.satisfied).toBe(true);
    });
  });

  // ============================================================================
  // AC #6: Encryption Category (3 checks)
  // ============================================================================
  describe('AC #6: Encryption validation', () => {
    it('should validate data-at-rest encryption', async () => {
      const arch = 'Data at rest: AES-256 encryption for all sensitive data';
      const archPath = path.join(testDir, 'encryption-rest-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const encryptionChecks = result.checks.filter(c => c.category === 'encryption');

      expect(encryptionChecks.find(c => c.requirement.includes('Data-at-rest'))?.satisfied).toBe(true);
    });

    it('should validate data-in-transit encryption', async () => {
      const arch = 'Data in transit: TLS 1.3 for HTTPS with transport encryption';
      const archPath = path.join(testDir, 'encryption-transit-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const encryptionChecks = result.checks.filter(c => c.category === 'encryption');

      expect(encryptionChecks.find(c => c.requirement.includes('Data-in-transit'))?.satisfied).toBe(true);
    });

    it('should validate encryption key management', async () => {
      const arch = 'Key management: AWS KMS with automated key rotation';
      const archPath = path.join(testDir, 'keymanagement-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const encryptionChecks = result.checks.filter(c => c.category === 'encryption');

      expect(encryptionChecks.find(c => c.requirement.includes('key management'))?.satisfied).toBe(true);
    });
  });

  // ============================================================================
  // AC #6: Threat Model Category (4 checks)
  // ============================================================================
  describe('AC #6: Threat Model validation', () => {
    it('should validate OWASP Top 10 assessment', async () => {
      const arch = 'Threat model: OWASP Top 10 security threats assessment';
      const archPath = path.join(testDir, 'owasp-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const threatChecks = result.checks.filter(c => c.category === 'threat-model');

      expect(threatChecks.find(c => c.requirement.includes('OWASP'))?.satisfied).toBe(true);
    });

    it('should validate threat mitigation strategies', async () => {
      const arch = 'Threat mitigation: Defense-in-depth security measures';
      const archPath = path.join(testDir, 'mitigation-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const threatChecks = result.checks.filter(c => c.category === 'threat-model');

      expect(threatChecks.find(c => c.requirement.includes('mitigation'))?.satisfied).toBe(true);
    });

    it('should validate security testing approach', async () => {
      const arch = 'Security testing: Automated penetration testing and vulnerability scans';
      const archPath = path.join(testDir, 'sectest-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const threatChecks = result.checks.filter(c => c.category === 'threat-model');

      expect(threatChecks.find(c => c.requirement.includes('Security testing'))?.satisfied).toBe(true);
    });

    it('should validate incident response plan', async () => {
      const arch = 'Incident response: 24/7 security incident escalation and breach response';
      const archPath = path.join(testDir, 'incident-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const threatChecks = result.checks.filter(c => c.category === 'threat-model');

      expect(threatChecks.find(c => c.requirement.includes('Incident response'))?.satisfied).toBe(true);
    });
  });

  // ============================================================================
  // AC #7: Gap Report Generation
  // ============================================================================
  describe('AC #7: Gap Report generation', () => {
    it('should generate detailed gap report with markdown formatting', async () => {
      const minimalArchitecture = `
# Architecture

## Security
Basic security considerations.
`;

      const archPath = path.join(testDir, 'minimal-arch.md');
      await fs.writeFile(archPath, minimalArchitecture, 'utf-8');

      const result = await validator.validate(archPath);
      const gapReport = validator.generateGapReport(result);

      expect(gapReport).toContain('# Security Gate Validation Report');
      expect(gapReport).toContain('**Overall Score:**');
      expect(gapReport).toContain('❌ FAILED');
      expect(gapReport).toContain('**Threshold:** 95%');
      expect(gapReport).toContain('## Unsatisfied Checks');
      expect(gapReport).toContain('**Status:** ❌ UNSATISFIED');
      expect(gapReport).toContain('**Recommendation:**');
      expect(gapReport).toContain('## Next Steps');
    });

    it('should generate passing report for complete architecture', async () => {
      const completeArchitecture = `
OAuth 2.0, JWT, RBAC, authorization, session management, bearer token, credentials,
AWS Secrets Manager, API key handling, credential rotation policy, KMS,
input validation, sanitization, SQL injection, parameterized queries, ORM,
XSS prevention, HTML encoding, CSP,
CORS policy, cross-origin, rate limiting, throttling, API authentication,
data at rest encryption, AES, TLS, HTTPS, data in transit, key management,
OWASP Top 10, threat model, mitigation, security testing, penetration test,
incident response, security incident, breach response
`;

      const archPath = path.join(testDir, 'complete-arch2.md');
      await fs.writeFile(archPath, completeArchitecture, 'utf-8');

      const result = await validator.validate(archPath);
      const gapReport = validator.generateGapReport(result);

      expect(gapReport).toContain('✅ PASSED');
      expect(gapReport).toContain('## Status');
      expect(gapReport).toContain('All security requirements satisfied');
    });

    it('should group gaps by category in report', async () => {
      const partialArchitecture = `
# Architecture
OAuth 2.0 authentication with JWT tokens.
CORS policy and rate limiting configured.
`;

      const archPath = path.join(testDir, 'partial-arch.md');
      await fs.writeFile(archPath, partialArchitecture, 'utf-8');

      const result = await validator.validate(archPath);
      const gapReport = validator.generateGapReport(result);

      // Should have category headers
      expect(gapReport).toContain('### Category:');
    });
  });

  // ============================================================================
  // AC #8: Audit Trail and State Management
  // ============================================================================
  describe('AC #8: Validation result structure', () => {
    it('should include timestamp in validation result', async () => {
      const arch = 'Security: OAuth 2.0';
      const archPath = path.join(testDir, 'timestamp-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include score and gaps in result', async () => {
      const arch = 'Security: OAuth 2.0';
      const archPath = path.join(testDir, 'score-test.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);

      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(Array.isArray(result.checks)).toBe(true);
      expect(result.checks).toHaveLength(20);
    });

    it('should set escalationRequired flag based on pass threshold', async () => {
      const passingArch = `
OAuth, JWT, RBAC, authorization, session, bearer, token, credentials,
secrets, environment variable, key vault, secrets manager, API key, rotation,
input validation, sanitization, SQL injection, parameterized, ORM,
XSS, HTML encoding, CSP,
CORS, cross-origin, rate limit, throttling, API authentication,
data at rest, AES, encrypted, TLS, HTTPS, key management, KMS,
OWASP, threat model, mitigation, security testing, penetration test,
incident response, security incident
`;
      const archPath1 = path.join(testDir, 'passing-arch.md');
      await fs.writeFile(archPath1, passingArch, 'utf-8');

      const result1 = await validator.validate(archPath1);
      expect(result1.escalationRequired).toBe(false);

      const failingArch = 'Security: Basic considerations';
      const archPath2 = path.join(testDir, 'failing-arch.md');
      await fs.writeFile(archPath2, failingArch, 'utf-8');

      const result2 = await validator.validate(archPath2);
      expect(result2.escalationRequired).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('Edge cases', () => {
    it('should handle empty architecture file', async () => {
      const archPath = path.join(testDir, 'empty-arch.md');
      await fs.writeFile(archPath, '', 'utf-8');

      const result = await validator.validate(archPath);

      expect(result.passed).toBe(false);
      expect(result.overallScore).toBe(0);
      expect(result.gaps).toHaveLength(20);
    });

    it('should handle non-existent file', async () => {
      const archPath = path.join(testDir, 'non-existent.md');

      await expect(validator.validate(archPath)).rejects.toThrow();
    });

    it('should be case-insensitive for keyword matching', async () => {
      const arch = 'OAUTH 2.0, RBAC, JWT, BEARER TOKEN, SESSION MANAGEMENT, CREDENTIALS';
      const archPath = path.join(testDir, 'uppercase-arch.md');
      await fs.writeFile(archPath, arch, 'utf-8');

      const result = await validator.validate(archPath);
      const authChecks = result.checks.filter(c => c.category === 'authentication');

      expect(authChecks.filter(c => c.satisfied).length).toBeGreaterThan(0);
    });
  });
});
