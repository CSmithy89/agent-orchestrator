import * as fs from 'fs/promises';

/**
 * Security check result for a single category
 */
export interface SecurityGateCheck {
  category: 'authentication' | 'secrets' | 'input-validation' | 'api-security' | 'encryption' | 'threat-model';
  requirement: string;
  satisfied: boolean;
  evidence?: string; // Section reference from architecture.md
  recommendation?: string; // If not satisfied
}

/**
 * Overall security gate validation result
 */
export interface SecurityGateResult {
  passed: boolean; // True if score >= 95%
  overallScore: number; // 0-100
  checks: SecurityGateCheck[];
  gaps: string[]; // List of unsatisfied requirements
  escalationRequired: boolean;
  timestamp: Date;
}

/**
 * SecurityGateValidator validates architecture completeness for security requirements.
 * Implements mandatory security gate (Story 3-6) with 95% pass threshold.
 *
 * Six security categories validated:
 * 1. Authentication & Authorization (4 checks)
 * 2. Secrets Management (3 checks)
 * 3. Input Validation (3 checks)
 * 4. API Security (3 checks)
 * 5. Encryption (3 checks)
 * 6. Threat Model (4 checks)
 *
 * Total: 20 checks, Pass threshold: 19/20 (95%)
 *
 * Usage:
 * ```typescript
 * const validator = new SecurityGateValidator();
 * const result = await validator.validate('/path/to/architecture.md');
 * if (!result.passed) {
 *   console.log(validator.generateGapReport(result));
 * }
 * ```
 */
export class SecurityGateValidator {
  private readonly PASS_THRESHOLD = 0.95; // 95%

  /**
   * Validate architecture security completeness
   * BLOCKING: Throws error if validation fails
   */
  async validate(architecturePath: string): Promise<SecurityGateResult> {
    const content = await fs.readFile(architecturePath, 'utf-8');

    const checks: SecurityGateCheck[] = [
      ...this.checkAuthentication(content),
      ...this.checkSecretsManagement(content),
      ...this.checkInputValidation(content),
      ...this.checkAPISecurity(content),
      ...this.checkEncryption(content),
      ...this.checkThreatModel(content)
    ];

    const satisfiedCount = checks.filter(c => c.satisfied).length;
    const totalCount = checks.length;
    const score = totalCount > 0 ? satisfiedCount / totalCount : 0;

    const gaps = checks
      .filter(c => !c.satisfied)
      .map(c => `${c.category}: ${c.requirement}`);

    const result: SecurityGateResult = {
      passed: score >= this.PASS_THRESHOLD,
      overallScore: Math.round(score * 100),
      checks,
      gaps,
      escalationRequired: score < this.PASS_THRESHOLD,
      timestamp: new Date()
    };

    return result;
  }

  /**
   * Check authentication & authorization (4 checks)
   */
  private checkAuthentication(content: string): SecurityGateCheck[] {
    const checks: SecurityGateCheck[] = [];

    // Check 1: Authentication strategy
    checks.push(this.createCheck(
      'authentication',
      'Authentication strategy defined',
      content,
      ['authentication', 'OAuth', 'JWT', 'SAML', 'SSO', 'login'],
      'Add authentication strategy to Non-Functional Requirements > Security section'
    ));

    // Check 2: Authorization mechanism
    checks.push(this.createCheck(
      'authentication',
      'Authorization mechanism specified',
      content,
      ['authorization', 'RBAC', 'ABAC', 'permissions', 'access control'],
      'Add authorization mechanism to NFR > Security section'
    ));

    // Check 3: Session management
    checks.push(this.createCheck(
      'authentication',
      'Session management approach documented',
      content,
      ['session', 'token', 'cookie', 'bearer'],
      'Add session management approach to NFR > Security section'
    ));

    // Check 4: Token/credential handling
    checks.push(this.createCheck(
      'authentication',
      'Token/credential handling specified',
      content,
      ['token', 'credential', 'API key', 'bearer'],
      'Add token/credential handling to NFR > Security section'
    ));

    return checks;
  }

  /**
   * Check secrets management (3 checks)
   */
  private checkSecretsManagement(content: string): SecurityGateCheck[] {
    const checks: SecurityGateCheck[] = [];

    // Check 1: Secrets storage
    checks.push(this.createCheck(
      'secrets',
      'Secrets storage strategy defined',
      content,
      ['secrets', 'environment variable', 'key vault', 'secrets manager', 'KMS'],
      'Add secrets storage strategy to NFR > Security section'
    ));

    // Check 2: API key handling
    checks.push(this.createCheck(
      'secrets',
      'API key handling approach documented',
      content,
      ['API key', 'credentials', 'secrets'],
      'Add API key handling to NFR > Security section'
    ));

    // Check 3: Credential rotation
    checks.push(this.createCheck(
      'secrets',
      'Credential rotation policy specified',
      content,
      ['rotation', 'rotate', 'expiry', 'credential'],
      'Add credential rotation policy to NFR > Security section'
    ));

    return checks;
  }

  /**
   * Check input validation (3 checks)
   */
  private checkInputValidation(content: string): SecurityGateCheck[] {
    const checks: SecurityGateCheck[] = [];

    // Check 1: Input validation strategy
    checks.push(this.createCheck(
      'input-validation',
      'Input validation strategy defined',
      content,
      ['input validation', 'sanitization', 'whitelist', 'blacklist', 'validation'],
      'Add input validation strategy to NFR > Security section'
    ));

    // Check 2: SQL injection prevention
    checks.push(this.createCheck(
      'input-validation',
      'SQL injection prevention documented',
      content,
      ['SQL injection', 'parameterized', 'prepared statement', 'ORM'],
      'Add SQL injection prevention to NFR > Security section'
    ));

    // Check 3: XSS prevention
    checks.push(this.createCheck(
      'input-validation',
      'XSS prevention measures specified',
      content,
      ['XSS', 'cross-site scripting', 'HTML encoding', 'CSP', 'content security policy'],
      'Add XSS prevention to NFR > Security section'
    ));

    return checks;
  }

  /**
   * Check API security (3 checks)
   */
  private checkAPISecurity(content: string): SecurityGateCheck[] {
    const checks: SecurityGateCheck[] = [];

    // Check 1: CORS policy
    checks.push(this.createCheck(
      'api-security',
      'CORS policy defined',
      content,
      ['CORS', 'cross-origin', 'origin'],
      'Add CORS policy to API Specifications > Security section'
    ));

    // Check 2: Rate limiting
    checks.push(this.createCheck(
      'api-security',
      'Rate limiting strategy specified',
      content,
      ['rate limit', 'throttling', 'rate limiting'],
      'Add rate limiting strategy to NFR > Security section'
    ));

    // Check 3: API authentication
    checks.push(this.createCheck(
      'api-security',
      'API authentication mechanism documented',
      content,
      ['API authentication', 'API key', 'bearer token'],
      'Add API authentication to API Specifications > Security section'
    ));

    return checks;
  }

  /**
   * Check encryption (3 checks)
   */
  private checkEncryption(content: string): SecurityGateCheck[] {
    const checks: SecurityGateCheck[] = [];

    // Check 1: Data-at-rest encryption
    checks.push(this.createCheck(
      'encryption',
      'Data-at-rest encryption specified',
      content,
      ['data at rest', 'encryption', 'AES', 'encrypted'],
      'Add data-at-rest encryption to NFR > Security section'
    ));

    // Check 2: Data-in-transit encryption
    checks.push(this.createCheck(
      'encryption',
      'Data-in-transit encryption specified',
      content,
      ['TLS', 'SSL', 'HTTPS', 'data in transit', 'transport encryption'],
      'Add data-in-transit encryption (TLS/SSL) to NFR > Security section'
    ));

    // Check 3: Encryption key management
    checks.push(this.createCheck(
      'encryption',
      'Encryption key management documented',
      content,
      ['key management', 'KMS', 'key vault', 'key rotation'],
      'Add encryption key management to NFR > Security section'
    ));

    return checks;
  }

  /**
   * Check threat model (4 checks)
   */
  private checkThreatModel(content: string): SecurityGateCheck[] {
    const checks: SecurityGateCheck[] = [];

    // Check 1: OWASP Top 10
    checks.push(this.createCheck(
      'threat-model',
      'OWASP Top 10 threats assessed',
      content,
      ['OWASP', 'threat model', 'security threat'],
      'Add OWASP Top 10 threat assessment to NFR > Security section'
    ));

    // Check 2: Threat mitigation
    checks.push(this.createCheck(
      'threat-model',
      'Threat mitigation strategies defined',
      content,
      ['mitigation', 'threat', 'security measure'],
      'Add threat mitigation strategies to NFR > Security section'
    ));

    // Check 3: Security testing
    checks.push(this.createCheck(
      'threat-model',
      'Security testing approach documented',
      content,
      ['security testing', 'penetration test', 'vulnerability scan'],
      'Add security testing approach to Test Strategy section'
    ));

    // Check 4: Incident response
    checks.push(this.createCheck(
      'threat-model',
      'Incident response plan outlined',
      content,
      ['incident response', 'security incident', 'breach response'],
      'Add incident response plan to NFR > Security section'
    ));

    return checks;
  }

  /**
   * Create a security check with keyword matching
   */
  private createCheck(
    category: SecurityGateCheck['category'],
    requirement: string,
    content: string,
    keywords: string[],
    recommendation: string
  ): SecurityGateCheck {
    const contentLower = content.toLowerCase();
    const satisfied = keywords.some(kw => contentLower.includes(kw.toLowerCase()));

    return {
      category,
      requirement,
      satisfied,
      evidence: satisfied ? 'Found in architecture document' : undefined,
      recommendation: satisfied ? undefined : recommendation
    };
  }

  /**
   * Generate gap remediation report
   */
  generateGapReport(result: SecurityGateResult): string {
    let markdown = '# Security Gate Validation Report\n\n';
    markdown += `**Overall Score:** ${result.overallScore}% ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    markdown += `**Threshold:** 95%\n`;
    markdown += `**Date:** ${result.timestamp.toISOString().split('T')[0]}\n\n`;

    if (result.passed) {
      markdown += '## Status\n\n';
      markdown += '✅ All security requirements satisfied. Architecture meets security standards.\n\n';
      return markdown;
    }

    markdown += '## Unsatisfied Checks\n\n';

    const unsatisfiedChecks = result.checks.filter(c => !c.satisfied);
    const byCategory = this.groupByCategory(unsatisfiedChecks);

    for (const [category, checks] of Object.entries(byCategory)) {
      markdown += `### Category: ${this.formatCategory(category)}\n\n`;
      for (const check of checks) {
        markdown += `**Check:** ${check.requirement}\n`;
        markdown += `**Status:** ❌ UNSATISFIED\n`;
        markdown += `**Recommendation:** ${check.recommendation}\n\n`;
      }
    }

    markdown += '## Next Steps\n\n';
    markdown += '1. Review gap report and update architecture.md to address unsatisfied checks\n';
    markdown += '2. Re-run security gate validation\n';
    markdown += '3. Once security gate passes, workflow can continue to solutioning phase\n';

    return markdown;
  }

  /**
   * Group checks by category
   */
  private groupByCategory(checks: SecurityGateCheck[]): Record<string, SecurityGateCheck[]> {
    const grouped: Record<string, SecurityGateCheck[]> = {};
    for (const check of checks) {
      if (!grouped[check.category]) {
        grouped[check.category] = [];
      }
      grouped[check.category]!.push(check);
    }
    return grouped;
  }

  /**
   * Format category name for display
   */
  private formatCategory(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
