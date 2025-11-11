/**
 * PRDValidator - PRD Quality Validation
 * Story 2.7: PRD Quality Validation
 *
 * Validates generated PRD quality before completion to ensure >85% completeness standard.
 *
 * Features:
 * - Verify all required sections present
 * - Check requirements clarity (no vague "handle X" requirements)
 * - Validate success criteria are measurable
 * - Ensure acceptance criteria for key features
 * - Check for contradictions or gaps
 * - Generate completeness score (target >85%)
 * - Identify gaps and regenerate missing content if score <85%
 * - Log validation results for improvement
 *
 * @see docs/tech-spec-epic-2.md#Story-2.7
 * @see docs/stories/2-7-prd-quality-validation.md
 */

import * as fs from 'fs/promises';
import type { StateManager } from '../StateManager.js';

/**
 * Clarity issue definition
 */
export interface ClarityIssue {
  section: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * PRD validation result
 */
export interface PRDValidationResult {
  completenessScore: number;     // 0-100, target >85
  sectionsPresent: string[];     // All required sections found
  sectionsMissing: string[];     // Required sections not found
  requirementsCount: number;     // Total functional requirements
  clarityIssues: ClarityIssue[]; // Vague/unclear requirements
  contradictions: string[];      // Conflicting requirements
  gaps: string[];                // Missing information
  passesQualityGate: boolean;    // True if score >=85 and no high-severity issues
}

/**
 * Required sections in a complete PRD
 */
const REQUIRED_SECTIONS = [
  'Executive Summary',
  'Success Criteria',
  'MVP Scope',
  'Functional Requirements',
  'Success Metrics',
];

/**
 * Vague patterns that indicate unclear requirements
 */
const VAGUE_PATTERNS = [
  /\bhandle\s+\w+/gi,
  /\bmanage\s+\w+/gi,
  /\bmanaged\s+/gi,
  /\bsupport\s+\w+/gi,
  /\bdeal\s+with\s+\w+/gi,
  /\bprocess\s+\w+(?!\s+in\s+<)/gi, // "process X" but not "process in <2s"
];

/**
 * Subjective patterns in success criteria
 */
const SUBJECTIVE_PATTERNS = [
  /should\s+be\s+\w+/gi,
  /should\s+perform\s+well/gi,
  /should\s+improve/gi,
  /should\s+increase/gi,
  /users?\s+should\s+be\s+happy/gi,
  /perform\s+well/gi,
  /be\s+good/gi,
  /work\s+properly/gi,
  /handled?\s+properly/gi,
];

/**
 * Keywords indicating contradictions
 */
const CONTRADICTION_KEYWORDS = [
  { term: 'microservice', opposite: 'monolithic' },
  { term: 'stateless', opposite: 'session' },
  { term: 'stateless', opposite: 'state' },
  { term: 'nosql', opposite: 'sql' },
  { term: 'nosql', opposite: 'postgres' },
  { term: 'zero downtime', opposite: 'maintenance window' },
  { term: 'real-time', opposite: 'batch processing' },
];

/**
 * PRDValidator class - Validates PRD quality
 */
export class PRDValidator {
  private stateManager: StateManager | { readFile: (path: string) => Promise<string> };

  /**
   * Create a new PRDValidator instance
   *
   * @param stateManager - State manager for reading files
   *
   * @example
   * ```typescript
   * const validator = new PRDValidator(stateManager);
   * const result = await validator.validate('docs/PRD.md');
   * ```
   */
  constructor(stateManager: StateManager | { readFile: (path: string) => Promise<string> }) {
    if (!stateManager) {
      throw new Error('StateManager is required');
    }
    this.stateManager = stateManager;
  }

  /**
   * Validate a PRD document
   *
   * @param prdFilePath - Path to PRD markdown file
   * @returns Validation result with completeness score and issues
   */
  async validate(prdFilePath: string): Promise<PRDValidationResult> {
    if (!prdFilePath || typeof prdFilePath !== 'string') {
      throw new Error('Valid file path is required');
    }

    // Read PRD content - try stateManager.readFile first, fallback to fs
    let content: string;
    try {
      if ('readFile' in this.stateManager && typeof this.stateManager.readFile === 'function') {
        content = await this.stateManager.readFile(prdFilePath);
      } else {
        content = await fs.readFile(prdFilePath, 'utf-8');
      }
    } catch (error) {
      throw new Error(`File not found: ${(error as Error).message}`);
    }

    // Handle empty or whitespace-only content
    if (!content || content.trim().length === 0) {
      const emptyResult: PRDValidationResult = {
        completenessScore: 0,
        sectionsPresent: [],
        sectionsMissing: REQUIRED_SECTIONS,
        requirementsCount: 0,
        clarityIssues: [],
        contradictions: [],
        gaps: [],
        passesQualityGate: false,
      };
      this.logValidationResults(emptyResult);
      return emptyResult;
    }

    // Perform all validations
    const { sectionsPresent, sectionsMissing } = this.validateSectionsPresent(content);
    const clarityIssues = [
      ...this.validateRequirementsClarity(content),
      ...this.validateSuccessCriteria(content),
      ...this.validateAcceptanceCriteria(content),
    ];
    const contradictions = this.detectContradictions(content);
    const gaps = this.identifyGaps(content);
    const requirementsCount = this.countRequirements(content);

    // Calculate completeness score
    const partialResult: Partial<PRDValidationResult> = {
      sectionsPresent,
      sectionsMissing,
      clarityIssues,
      contradictions,
      gaps,
      requirementsCount,
    };
    const completenessScore = this.calculateCompletenessScore(partialResult);

    // Determine if passes quality gate
    const highSeverityIssues = clarityIssues.filter(issue => issue.severity === 'high');
    const passesQualityGate = completenessScore >= 85 && highSeverityIssues.length === 0;

    const result: PRDValidationResult = {
      completenessScore,
      sectionsPresent,
      sectionsMissing,
      requirementsCount,
      clarityIssues,
      contradictions,
      gaps,
      passesQualityGate,
    };

    // Log validation results
    this.logValidationResults(result);

    return result;
  }

  /**
   * Validate that all required sections are present
   */
  private validateSectionsPresent(content: string): {
    sectionsPresent: string[];
    sectionsMissing: string[];
  } {
    const sectionsPresent: string[] = [];
    const sectionsMissing: string[] = [];

    // Extract all markdown headers (## or ###)
    const headerRegex = /^#{2,3}\s+(.+)$/gm;
    const headers: string[] = [];
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      headers.push(match[1].trim());
    }

    // Check each required section
    for (const requiredSection of REQUIRED_SECTIONS) {
      const found = headers.some(header =>
        header.toLowerCase() === requiredSection.toLowerCase()
      );

      if (found) {
        sectionsPresent.push(requiredSection);
      } else {
        sectionsMissing.push(requiredSection);
      }
    }

    return { sectionsPresent, sectionsMissing };
  }

  /**
   * Validate requirements clarity - detect vague patterns
   */
  private validateRequirementsClarity(content: string): ClarityIssue[] {
    const issues: ClarityIssue[] = [];

    // Extract functional requirements sections
    const requirementRegex = /###\s+(FR-\d{3}[^#]*?)(?=###|##|$)/gs;
    const requirements = content.match(requirementRegex) || [];

    for (const requirement of requirements) {
      const reqIdMatch = requirement.match(/FR-\d{3}/);
      const reqId = reqIdMatch ? reqIdMatch[0] : 'Unknown';

      // Check for vague patterns
      for (const pattern of VAGUE_PATTERNS) {
        const matches = requirement.match(pattern);
        if (matches) {
          for (const match of matches) {
            issues.push({
              section: reqId,
              issue: `Vague requirement: "${match}". Be more specific about implementation.`,
              severity: 'high',
            });
          }
        }
      }

      // Check for missing specificity keywords
      if (!/shall\s+\w+\s+\w+\s+via|using|with|through/i.test(requirement)) {
        if (/shall\s+(handle|manage|support|deal)/i.test(requirement)) {
          issues.push({
            section: reqId,
            issue: `Requirement lacks implementation details (via/using/with/through).`,
            severity: 'medium',
          });
        }
      }
    }

    // Also check MVP Scope section for vague patterns
    const mvpScopeMatch = content.match(/##\s+MVP\s+Scope([\s\S]*?)(?=##|$)/i);
    if (mvpScopeMatch) {
      const mvpSection = mvpScopeMatch[1];
      for (const pattern of VAGUE_PATTERNS) {
        const matches = mvpSection.match(pattern);
        if (matches) {
          for (const match of matches) {
            issues.push({
              section: 'MVP Scope',
              issue: `Vague scope item: "${match}". Be more specific about implementation.`,
              severity: 'high',
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validate success criteria are measurable
   */
  private validateSuccessCriteria(content: string): ClarityIssue[] {
    const issues: ClarityIssue[] = [];

    // Extract Success Criteria section
    const successCriteriaMatch = content.match(
      /##\s+Success\s+Criteria([\s\S]*?)(?=##|$)/i
    );

    if (!successCriteriaMatch) {
      return issues;
    }

    const successCriteriaSection = successCriteriaMatch[1];

    // Check for subjective patterns
    for (const pattern of SUBJECTIVE_PATTERNS) {
      const matches = successCriteriaSection.match(pattern);
      if (matches) {
        for (const match of matches) {
          issues.push({
            section: 'Success Criteria',
            issue: `Subjective criterion: "${match}". Use measurable metrics (numbers, percentages, time).`,
            severity: 'high',
          });
        }
      }
    }

    // Check if criteria contain measurable values (numbers, %, <, >)
    const lines = successCriteriaSection.split('\n').filter(line => line.trim().startsWith('-'));
    for (const line of lines) {
      const hasMeasurableValue = /\d+|%|<|>|≤|≥/.test(line);
      if (!hasMeasurableValue && line.length > 10) {
        // Avoid false positives on very short lines
        issues.push({
          section: 'Success Criteria',
          issue: `Criterion may not be measurable: "${line.trim()}". Add specific metrics.`,
          severity: 'medium',
        });
      }
    }

    return issues;
  }

  /**
   * Validate acceptance criteria for requirements
   */
  private validateAcceptanceCriteria(content: string): ClarityIssue[] {
    const issues: ClarityIssue[] = [];

    // Extract functional requirements
    const requirementRegex = /###\s+(FR-\d{3}[^#]*?)(?=###|##|$)/gs;
    const requirements = content.match(requirementRegex) || [];

    for (const requirement of requirements) {
      const reqIdMatch = requirement.match(/FR-\d{3}/);
      const reqId = reqIdMatch ? reqIdMatch[0] : 'Unknown';

      // Check if Acceptance Criteria section exists
      if (!/\*\*Acceptance\s+Criteria\*\*/i.test(requirement)) {
        issues.push({
          section: reqId,
          issue: `Missing Acceptance Criteria section.`,
          severity: 'high',
        });
        continue;
      }

      // Extract AC section
      const acMatch = requirement.match(
        /\*\*Acceptance\s+Criteria\*\*:?\s*([\s\S]*?)(?=\*\*|###|##|$)/i
      );

      if (acMatch && acMatch[1]) {
        const acSection = acMatch[1];

        // Check for vague acceptance criteria
        const vagueACPatterns = [
          { pattern: /works?$/im, name: 'works' },
          { pattern: /handled?\s+properly/i, name: 'handled properly' },
          { pattern: /processed?\s+correctly/i, name: 'processed correctly' },
          { pattern: /managed?\s+successfully/i, name: 'managed successfully' },
        ];

        for (const { pattern, name } of vagueACPatterns) {
          const match = acSection.match(pattern);
          if (match) {
            issues.push({
              section: reqId,
              issue: `Vague acceptance criteria: "${name}". Be specific about expected behavior and outcomes.`,
              severity: 'medium',
            });
          }
        }

        // Check if AC is too short (likely not detailed enough)
        const acLines = acSection.split('\n').filter(line => line.trim().startsWith('-'));
        if (acLines.length === 0) {
          issues.push({
            section: reqId,
            issue: `Acceptance Criteria section appears empty or improperly formatted.`,
            severity: 'high',
          });
        } else if (acLines.length === 1 && acLines[0].length < 20) {
          issues.push({
            section: reqId,
            issue: `Acceptance Criteria may be too brief. Add more specific test conditions.`,
            severity: 'low',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect contradictions in the PRD
   */
  private detectContradictions(content: string): string[] {
    const contradictions: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for keyword contradictions
    for (const { term, opposite } of CONTRADICTION_KEYWORDS) {
      if (lowerContent.includes(term) && lowerContent.includes(opposite)) {
        contradictions.push(
          `Potential contradiction: Document mentions both "${term}" and "${opposite}". Verify consistency.`
        );
      }
    }

    return contradictions;
  }

  /**
   * Identify gaps in the PRD
   */
  private identifyGaps(content: string): string[] {
    const gaps: string[] = [];

    // Extract functional requirements
    const requirementRegex = /###\s+(FR-\d{3}[^#]*?)(?=###|##|$)/gs;
    const requirements = content.match(requirementRegex) || [];

    for (const requirement of requirements) {
      const reqIdMatch = requirement.match(/FR-\d{3}/);
      const reqId = reqIdMatch ? reqIdMatch[0] : 'Unknown';

      // Extract only Statement and Acceptance Criteria, exclude comments in parentheses
      const requirementBody = requirement.replace(/\([^)]*\)/g, '');

      // Check for common missing details
      const missingDetails: string[] = [];

      // Error handling
      if (!/error|exception|failure|timeout|retry/i.test(requirementBody)) {
        missingDetails.push('error handling');
      }

      // Security considerations
      if (/authentication|auth|login|password|token/i.test(requirementBody)) {
        if (!/encrypt|hash|secure|protection/i.test(requirementBody)) {
          missingDetails.push('security details (encryption, protection)');
        }
      }

      // Data validation
      if (/data|input|upload|form/i.test(requirementBody)) {
        if (!/validat|sanitiz|check|verify/i.test(requirementBody)) {
          missingDetails.push('data validation');
        }
      }

      // Performance considerations
      if (/process|generat|calculat|search/i.test(requirementBody)) {
        if (!/time|performance|speed|duration|timeout/i.test(requirementBody)) {
          missingDetails.push('performance criteria');
        }
      }

      if (missingDetails.length > 0) {
        gaps.push(`${reqId}: Missing ${missingDetails.join(', ')}`);
      }
    }

    return gaps;
  }

  /**
   * Calculate completeness score (0-100)
   *
   * Scoring algorithm:
   * - Start with 100
   * - Deduct 15 points per missing section
   * - Deduct 5 points per vague requirement
   * - Deduct 3 points per gap
   * - Deduct 5 points per contradiction
   * - Minimum score is 0
   */
  private calculateCompletenessScore(result: Partial<PRDValidationResult>): number {
    let score = 100;

    // Deduct for missing sections
    score -= (result.sectionsMissing?.length || 0) * 15;

    // Deduct for vague requirements (high severity issues)
    const vagueRequirements = result.clarityIssues?.filter(
      issue => issue.severity === 'high'
    ).length || 0;
    score -= vagueRequirements * 5;

    // Deduct for gaps
    score -= (result.gaps?.length || 0) * 3;

    // Deduct for contradictions
    score -= (result.contradictions?.length || 0) * 5;

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  /**
   * Count functional requirements in the PRD
   */
  private countRequirements(content: string): number {
    const requirementRegex = /###\s+FR-\d{3}/g;
    const matches = content.match(requirementRegex);
    return matches ? matches.length : 0;
  }

  /**
   * Log validation results for debugging and improvement
   */
  private logValidationResults(result: PRDValidationResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('PRD Validation Results');
    console.log('='.repeat(60));
    console.log(`Completeness Score: ${result.completenessScore}/100`);
    console.log(`Quality Gate: ${result.passesQualityGate ? 'PASS ✓' : 'FAIL ✗'}`);
    console.log(`Requirements Count: ${result.requirementsCount}`);
    console.log(`Sections Present: ${result.sectionsPresent.length}/${REQUIRED_SECTIONS.length}`);

    if (result.sectionsMissing.length > 0) {
      console.log(`\nMissing Sections (${result.sectionsMissing.length}):`);
      result.sectionsMissing.forEach(section => console.log(`  - ${section}`));
    }

    if (result.clarityIssues.length > 0) {
      console.log(`\nClarity Issues (${result.clarityIssues.length}):`);
      const highSeverity = result.clarityIssues.filter(i => i.severity === 'high');
      const mediumSeverity = result.clarityIssues.filter(i => i.severity === 'medium');
      const lowSeverity = result.clarityIssues.filter(i => i.severity === 'low');

      if (highSeverity.length > 0) {
        console.log(`  High Severity: ${highSeverity.length}`);
        highSeverity.slice(0, 3).forEach(issue =>
          console.log(`    - [${issue.section}] ${issue.issue}`)
        );
      }
      if (mediumSeverity.length > 0) {
        console.log(`  Medium Severity: ${mediumSeverity.length}`);
      }
      if (lowSeverity.length > 0) {
        console.log(`  Low Severity: ${lowSeverity.length}`);
      }
    }

    if (result.contradictions.length > 0) {
      console.log(`\nContradictions (${result.contradictions.length}):`);
      result.contradictions.forEach(c => console.log(`  - ${c}`));
    }

    if (result.gaps.length > 0) {
      console.log(`\nGaps (${result.gaps.length}):`);
      result.gaps.slice(0, 5).forEach(gap => console.log(`  - ${gap}`));
      if (result.gaps.length > 5) {
        console.log(`  ... and ${result.gaps.length - 5} more`);
      }
    }

    console.log('='.repeat(60) + '\n');
  }
}
