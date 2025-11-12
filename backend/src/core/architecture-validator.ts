import * as fs from 'fs/promises';

/**
 * Required architecture section with minimum word count
 */
interface RequiredSection {
  name: string;
  minWordCount: number;
  keywords: string[];
}

/**
 * Completeness validation result
 */
export interface CompletenessResult {
  score: number; // 0-100
  completeSections: string[];
  incompleteSections: Array<{
    name: string;
    reason: string;
    actualWordCount: number;
    requiredWordCount: number;
  }>;
}

/**
 * PRD requirement entry
 */
interface PRDRequirement {
  id: string;
  text: string;
  type: 'functional' | 'non-functional';
}

/**
 * Traceability matrix entry
 */
export interface TraceabilityMatrixEntry {
  requirement: PRDRequirement;
  covered: boolean;
  sections: string[]; // Architecture sections that address this requirement
}

/**
 * Traceability validation result
 */
export interface TraceabilityResult {
  score: number; // 0-100
  matrix: TraceabilityMatrixEntry[];
  unaddressedRequirements: PRDRequirement[];
}

/**
 * Test strategy validation result
 */
export interface TestStrategyResult {
  score: number; // 0-100
  presentElements: string[];
  missingElements: Array<{
    name: string;
    recommendation: string;
  }>;
}

/**
 * Detected architectural contradiction
 */
export interface Contradiction {
  pattern: string;
  opposite: string;
  context: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Consistency validation result
 */
export interface ConsistencyResult {
  score: number; // 0 or 100 (binary)
  conflicts: Contradiction[];
  techStackConsistent: boolean;
}

/**
 * Overall validation result
 */
export interface ValidationResult {
  passed: boolean; // True if overall score >= 85%
  overallScore: number; // 0-100
  completeness: CompletenessResult;
  traceability: TraceabilityResult;
  testStrategy: TestStrategyResult;
  consistency: ConsistencyResult;
  timestamp: Date;
}

/**
 * ArchitectureValidator validates architecture documents across four dimensions:
 * 1. Completeness: All required sections present with substantive content
 * 2. PRD Traceability: All PRD requirements addressed in architecture
 * 3. Test Strategy: Complete test strategy with frameworks, pyramid, CI/CD, gates, ATDD
 * 4. Consistency: No contradictory architectural decisions
 *
 * Pass threshold: 85% overall quality score
 *
 * Usage:
 * ```typescript
 * const validator = new ArchitectureValidator();
 * const result = await validator.validate('/path/to/architecture.md', '/path/to/PRD.md');
 * if (!result.passed) {
 *   console.log(validator.generateValidationReport(result));
 * }
 * ```
 */
export class ArchitectureValidator {
  private readonly PASS_THRESHOLD = 0.85; // 85%

  /**
   * Required architecture sections with minimum word counts
   */
  private readonly REQUIRED_SECTIONS: RequiredSection[] = [
    {
      name: 'System Overview',
      minWordCount: 200,
      keywords: ['architecture', 'overview', 'design', 'pattern', 'approach']
    },
    {
      name: 'Component Architecture',
      minWordCount: 300,
      keywords: ['component', 'module', 'service', 'layer', 'communication', 'interaction']
    },
    {
      name: 'Data Models',
      minWordCount: 200,
      keywords: ['entity', 'model', 'relationship', 'database', 'schema', 'field']
    },
    {
      name: 'API Specifications',
      minWordCount: 200,
      keywords: ['endpoint', 'API', 'REST', 'request', 'response', 'contract']
    },
    {
      name: 'Non-Functional Requirements',
      minWordCount: 400,
      keywords: ['performance', 'security', 'reliability', 'scalability', 'throughput', 'latency']
    },
    {
      name: 'Test Strategy',
      minWordCount: 300,
      keywords: ['test', 'strategy', 'framework', 'pyramid', 'CI/CD', 'quality gate', 'ATDD']
    },
    {
      name: 'Technical Decisions',
      minWordCount: 200,
      keywords: ['decision', 'ADR', 'architecture', 'rationale', 'alternative', 'context']
    }
  ];

  /**
   * Required test strategy elements
   */
  private readonly TEST_STRATEGY_ELEMENTS = [
    {
      name: 'Test Frameworks',
      keywords: ['test framework', 'Vitest', 'Jest', 'Mocha', 'Playwright', 'Cypress', 'testing library']
    },
    {
      name: 'Test Pyramid',
      keywords: ['test pyramid', 'unit test', 'integration test', 'E2E', 'ratio']
    },
    {
      name: 'CI/CD Pipeline',
      keywords: ['CI/CD', 'GitHub Actions', 'Jenkins', 'pipeline', 'trigger', 'stage', 'continuous']
    },
    {
      name: 'Quality Gates',
      keywords: ['quality gate', 'coverage', 'failure', 'threshold', 'standard', 'minimum']
    },
    {
      name: 'ATDD Approach',
      keywords: ['ATDD', 'acceptance test', 'test-driven', 'BDD', 'acceptance criteria']
    }
  ];

  /**
   * Contradiction patterns to detect
   */
  private readonly CONTRADICTION_PATTERNS = [
    {
      pattern: 'monolith',
      opposites: ['microservice', 'micro-service', 'distributed', 'independently scalable'],
      severity: 'HIGH' as const
    },
    {
      pattern: 'stateless',
      opposites: ['session', 'state management', 'session state', 'stateful'],
      severity: 'HIGH' as const
    },
    {
      pattern: 'synchronous',
      opposites: ['asynchronous', 'message queue', 'event-driven', 'async'],
      severity: 'MEDIUM' as const
    },
    {
      pattern: 'SQL',
      opposites: ['NoSQL', 'document store', 'MongoDB', 'DynamoDB'],
      severity: 'MEDIUM' as const
    }
  ];

  /**
   * Validate architecture document
   *
   * @param architecturePath - Path to architecture.md file
   * @param prdPath - Path to PRD.md file
   * @returns Validation result with overall score and dimension scores
   */
  async validate(architecturePath: string, prdPath: string): Promise<ValidationResult> {
    console.log('[ArchitectureValidator] Starting validation...');
    console.log(`[ArchitectureValidator] Architecture: ${architecturePath}`);
    console.log(`[ArchitectureValidator] PRD: ${prdPath}`);

    // Read files
    const architectureContent = await fs.readFile(architecturePath, 'utf-8');
    const prdContent = await fs.readFile(prdPath, 'utf-8');

    // Execute all validation checks
    const completeness = this.validateCompleteness(architectureContent);
    const traceability = this.validateTraceability(architectureContent, prdContent);
    const testStrategy = this.validateTestStrategy(architectureContent);
    const consistency = this.validateConsistency(architectureContent);

    // Calculate overall score (equal weighting: 25% each)
    const overallScore = this.calculateOverallScore(completeness, traceability, testStrategy, consistency);
    const passed = overallScore >= this.PASS_THRESHOLD * 100;

    console.log('[ArchitectureValidator] Validation complete');
    console.log(`[ArchitectureValidator] Completeness: ${completeness.score}%`);
    console.log(`[ArchitectureValidator] Traceability: ${traceability.score}%`);
    console.log(`[ArchitectureValidator] Test Strategy: ${testStrategy.score}%`);
    console.log(`[ArchitectureValidator] Consistency: ${consistency.score}%`);
    console.log(`[ArchitectureValidator] Overall: ${overallScore}% (${passed ? 'PASSED' : 'FAILED'})`);

    return {
      passed,
      overallScore,
      completeness,
      traceability,
      testStrategy,
      consistency,
      timestamp: new Date()
    };
  }

  /**
   * Validate architecture completeness
   * Checks all required sections present with substantive content (minimum word count)
   *
   * @param architectureContent - Architecture document content
   * @returns Completeness result with score and missing sections
   */
  validateCompleteness(architectureContent: string): CompletenessResult {
    const completeSections: string[] = [];
    const incompleteSections: CompletenessResult['incompleteSections'] = [];

    for (const section of this.REQUIRED_SECTIONS) {
      const sectionContent = this.extractSection(architectureContent, section.name);
      const wordCount = this.countWords(sectionContent);

      if (wordCount >= section.minWordCount) {
        completeSections.push(section.name);
      } else {
        incompleteSections.push({
          name: section.name,
          reason: wordCount === 0 ? 'Section missing or empty' : 'Below minimum word count',
          actualWordCount: wordCount,
          requiredWordCount: section.minWordCount
        });
      }
    }

    const score = Math.round((completeSections.length / this.REQUIRED_SECTIONS.length) * 100);

    return {
      score,
      completeSections,
      incompleteSections
    };
  }

  /**
   * Validate PRD traceability
   * Checks that all PRD requirements are addressed in architecture
   *
   * @param architectureContent - Architecture document content
   * @param prdContent - PRD document content
   * @returns Traceability result with score and traceability matrix
   */
  validateTraceability(architectureContent: string, prdContent: string): TraceabilityResult {
    // Extract PRD requirements
    const requirements = this.extractPRDRequirements(prdContent);

    if (requirements.length === 0) {
      // No requirements to trace - perfect score
      return {
        score: 100,
        matrix: [],
        unaddressedRequirements: []
      };
    }

    // Build traceability matrix
    const matrix: TraceabilityMatrixEntry[] = [];
    const unaddressedRequirements: PRDRequirement[] = [];

    for (const requirement of requirements) {
      const sections = this.findRequirementCoverage(architectureContent, requirement);
      const covered = sections.length > 0;

      matrix.push({
        requirement,
        covered,
        sections
      });

      if (!covered) {
        unaddressedRequirements.push(requirement);
      }
    }

    const addressedCount = matrix.filter(entry => entry.covered).length;
    const score = Math.round((addressedCount / requirements.length) * 100);

    return {
      score,
      matrix,
      unaddressedRequirements
    };
  }

  /**
   * Validate test strategy completeness
   * Checks that test strategy section contains all required elements
   *
   * @param architectureContent - Architecture document content
   * @returns Test strategy result with score and missing elements
   */
  validateTestStrategy(architectureContent: string): TestStrategyResult {
    const testStrategySection = this.extractSection(architectureContent, 'Test Strategy');
    const presentElements: string[] = [];
    const missingElements: TestStrategyResult['missingElements'] = [];

    for (const element of this.TEST_STRATEGY_ELEMENTS) {
      const present = this.hasKeywords(testStrategySection, element.keywords);

      if (present) {
        presentElements.push(element.name);
      } else {
        missingElements.push({
          name: element.name,
          recommendation: this.getTestStrategyRecommendation(element.name)
        });
      }
    }

    const score = Math.round((presentElements.length / this.TEST_STRATEGY_ELEMENTS.length) * 100);

    return {
      score,
      presentElements,
      missingElements
    };
  }

  /**
   * Validate technical decision consistency
   * Checks for contradictory architectural decisions
   *
   * @param architectureContent - Architecture document content
   * @returns Consistency result with conflicts and score (binary: 0% or 100%)
   */
  validateConsistency(architectureContent: string): ConsistencyResult {
    const conflicts: Contradiction[] = [];
    const contentLower = architectureContent.toLowerCase();

    // Check for contradictory patterns
    for (const contradictionPattern of this.CONTRADICTION_PATTERNS) {
      const hasPattern = contentLower.includes(contradictionPattern.pattern.toLowerCase());

      if (hasPattern) {
        // Check if any opposite patterns exist
        for (const opposite of contradictionPattern.opposites) {
          if (contentLower.includes(opposite.toLowerCase())) {
            conflicts.push({
              pattern: contradictionPattern.pattern,
              opposite,
              context: `Document contains both "${contradictionPattern.pattern}" and "${opposite}" without clear rationale`,
              severity: contradictionPattern.severity
            });
          }
        }
      }
    }

    // Binary scoring: 100% if no conflicts, 0% if conflicts detected
    const score = conflicts.length === 0 ? 100 : 0;
    const techStackConsistent = conflicts.length === 0;

    return {
      score,
      conflicts,
      techStackConsistent
    };
  }

  /**
   * Calculate overall quality score
   * Equal weighting: 25% completeness, 25% traceability, 25% test strategy, 25% consistency
   *
   * @param completeness - Completeness result
   * @param traceability - Traceability result
   * @param testStrategy - Test strategy result
   * @param consistency - Consistency result
   * @returns Overall score (0-100)
   */
  private calculateOverallScore(
    completeness: CompletenessResult,
    traceability: TraceabilityResult,
    testStrategy: TestStrategyResult,
    consistency: ConsistencyResult
  ): number {
    const average = (completeness.score + traceability.score + testStrategy.score + consistency.score) / 4;
    return Math.round(average);
  }

  /**
   * Generate validation report
   * Creates markdown report with scores, findings, and recommendations
   *
   * @param result - Validation result
   * @returns Markdown formatted report
   */
  generateValidationReport(result: ValidationResult): string {
    let markdown = '# Architecture Validation Report\n\n';
    markdown += `**Overall Quality Score:** ${result.overallScore}% ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    markdown += `**Threshold:** 85%\n`;
    markdown += `**Date:** ${result.timestamp.toISOString().split('T')[0]}\n\n`;

    // Scores section
    markdown += '## Scores\n\n';
    markdown += `- **Completeness:** ${result.completeness.score}% (${result.completeness.completeSections.length}/${this.REQUIRED_SECTIONS.length} sections complete)\n`;
    markdown += `- **PRD Traceability:** ${result.traceability.score}% (${result.traceability.matrix.length - result.traceability.unaddressedRequirements.length}/${result.traceability.matrix.length} requirements addressed)\n`;
    markdown += `- **Test Strategy:** ${result.testStrategy.score}% (${result.testStrategy.presentElements.length}/${this.TEST_STRATEGY_ELEMENTS.length} elements complete)\n`;
    markdown += `- **Consistency:** ${result.consistency.score}% (${result.consistency.conflicts.length} conflicts detected)\n\n`;

    if (result.passed) {
      markdown += '## Status\n\n';
      markdown += '✅ Architecture meets quality standards. Ready for solutioning phase.\n\n';
      return markdown;
    }

    // Completeness issues
    if (result.completeness.incompleteSections.length > 0) {
      markdown += '## Completeness Issues\n\n';
      for (const section of result.completeness.incompleteSections) {
        markdown += `### ${section.reason}: ${section.name}\n`;
        markdown += `**Severity:** HIGH\n`;
        markdown += `**Issue:** ${section.actualWordCount} words (minimum: ${section.requiredWordCount})\n`;
        markdown += `**Recommendation:** Expand ${section.name} section to meet minimum word count requirement\n\n`;
      }
    }

    // PRD traceability issues
    if (result.traceability.unaddressedRequirements.length > 0) {
      markdown += '## PRD Traceability Issues\n\n';
      markdown += '### Unaddressed Requirements\n\n';
      for (let i = 0; i < result.traceability.unaddressedRequirements.length; i++) {
        const req = result.traceability.unaddressedRequirements[i]!;
        markdown += `${i + 1}. **${req.id}:** ${req.text}\n`;
        markdown += `   - **Type:** ${req.type}\n`;
        markdown += `   - **Recommendation:** Address this requirement in ${this.getRecommendedSection(req.type)} section\n\n`;
      }
    }

    // Test strategy issues
    if (result.testStrategy.missingElements.length > 0) {
      markdown += '## Test Strategy Issues\n\n';
      markdown += '### Missing Elements\n\n';
      for (let i = 0; i < result.testStrategy.missingElements.length; i++) {
        const element = result.testStrategy.missingElements[i]!;
        markdown += `${i + 1}. **${element.name}:** Not defined\n`;
        markdown += `   - **Recommendation:** ${element.recommendation}\n\n`;
      }
    }

    // Consistency issues
    if (result.consistency.conflicts.length > 0) {
      markdown += '## Consistency Issues\n\n';
      markdown += '### Detected Contradictions\n\n';
      for (const conflict of result.consistency.conflicts) {
        markdown += `**Severity:** ${conflict.severity}\n`;
        markdown += `**Conflict:** ${conflict.pattern} vs ${conflict.opposite}\n`;
        markdown += `**Context:** ${conflict.context}\n`;
        markdown += `**Recommendation:** Clarify architectural decision or remove contradiction\n\n`;
      }
    }

    // Next steps
    markdown += '## Next Steps\n\n';
    markdown += '1. Review validation report and update architecture.md to address issues\n';
    markdown += '2. Expand incomplete sections to meet minimum word counts\n';
    markdown += '3. Address PRD traceability gaps\n';
    markdown += '4. Complete test strategy elements\n';
    markdown += '5. Resolve architectural contradictions\n';
    markdown += '6. Re-run architecture validation\n';
    markdown += '7. Once validation passes (≥85% score), workflow can complete\n';

    return markdown;
  }

  /**
   * Extract section content from markdown document
   *
   * @param content - Document content
   * @param sectionName - Section name to extract
   * @returns Section content (or empty string if not found)
   */
  private extractSection(content: string, sectionName: string): string {
    // Match section header (## Section Name) - case insensitive, multiline
    const sectionRegex = new RegExp(`^##\\s+${this.escapeRegex(sectionName)}.*$`, 'im');
    const match = content.match(sectionRegex);

    if (!match) {
      return '';
    }

    // Find the end of the header line
    const headerEndIndex = match.index! + match[0].length;

    // Extract content from after the header line
    const contentAfterHeader = content.substring(headerEndIndex);

    // Find next section header (## ...) or end of document
    const nextSectionMatch = contentAfterHeader.match(/^##\s+/m);
    const endIndex = nextSectionMatch?.index ?? contentAfterHeader.length;

    return contentAfterHeader.substring(0, endIndex).trim();
  }

  /**
   * Count words in text content
   *
   * @param content - Text content
   * @returns Word count
   */
  private countWords(content: string): number {
    if (!content || content.trim() === '') {
      return 0;
    }

    // Remove markdown formatting, code blocks, and extra whitespace
    const cleanedContent = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/[#*_~[\]()]/g, '') // Remove markdown symbols
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (cleanedContent === '') {
      return 0;
    }

    return cleanedContent.split(/\s+/).length;
  }

  /**
   * Extract PRD requirements (functional and non-functional)
   *
   * @param prdContent - PRD document content
   * @returns Array of PRD requirements
   */
  private extractPRDRequirements(prdContent: string): PRDRequirement[] {
    const requirements: PRDRequirement[] = [];

    // Extract functional requirements
    const functionalSection = this.extractSection(prdContent, 'Functional Requirements');
    const functionalReqs = this.extractRequirementsList(functionalSection, 'functional');
    requirements.push(...functionalReqs);

    // Extract non-functional requirements
    const nfrSection = this.extractSection(prdContent, 'Non-Functional Requirements');
    const nfrReqs = this.extractRequirementsList(nfrSection, 'non-functional');
    requirements.push(...nfrReqs);

    // Also check Features section for high-level requirements
    const featuresSection = this.extractSection(prdContent, 'Features');
    const featureReqs = this.extractRequirementsList(featuresSection, 'functional');
    requirements.push(...featureReqs);

    return requirements;
  }

  /**
   * Extract requirements from a section
   *
   * @param content - Section content
   * @param type - Requirement type
   * @returns Array of requirements
   */
  private extractRequirementsList(content: string, type: 'functional' | 'non-functional'): PRDRequirement[] {
    const requirements: PRDRequirement[] = [];
    const lines = content.split('\n');

    let reqId = 1;
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Match bullet points, numbered lists, or standalone requirements
      if (trimmedLine.match(/^[-*•]\s+.+/) || trimmedLine.match(/^\d+\.\s+.+/)) {
        const text = trimmedLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();

        // Skip empty or very short items (likely headers)
        if (text.length > 10) {
          const prefix = type === 'functional' ? 'FR' : 'NFR';
          requirements.push({
            id: `${prefix}-${reqId}`,
            text,
            type
          });
          reqId++;
        }
      }
    }

    return requirements;
  }

  /**
   * Find architecture sections that cover a PRD requirement
   *
   * @param architectureContent - Architecture document content
   * @param requirement - PRD requirement
   * @returns Array of section names that address the requirement
   */
  private findRequirementCoverage(architectureContent: string, requirement: PRDRequirement): string[] {
    const sections: string[] = [];

    // Extract key terms from requirement (ignore common words)
    const keyTerms = this.extractKeyTerms(requirement.text);

    // Check each architecture section for coverage
    for (const section of this.REQUIRED_SECTIONS) {
      const sectionContent = this.extractSection(architectureContent, section.name);

      // Check if section mentions key terms from requirement
      const covered = keyTerms.some(term =>
        sectionContent.toLowerCase().includes(term.toLowerCase())
      );

      if (covered) {
        sections.push(section.name);
      }
    }

    return sections;
  }

  /**
   * Extract key terms from requirement text
   *
   * @param text - Requirement text
   * @returns Array of key terms
   */
  private extractKeyTerms(text: string): string[] {
    // Remove common words
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Return unique terms
    return Array.from(new Set(words));
  }

  /**
   * Check if content contains any of the specified keywords
   *
   * @param content - Content to check
   * @param keywords - Keywords to search for
   * @returns True if any keyword found
   */
  private hasKeywords(content: string, keywords: string[]): boolean {
    const contentLower = content.toLowerCase();
    return keywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
  }

  /**
   * Get recommendation for missing test strategy element
   *
   * @param elementName - Element name
   * @returns Recommendation text
   */
  private getTestStrategyRecommendation(elementName: string): string {
    const recommendations: Record<string, string> = {
      'Test Frameworks': 'Specify test frameworks for different test types (e.g., "Vitest for unit/integration, Playwright for E2E")',
      'Test Pyramid': 'Specify test distribution ratios (e.g., "60% unit tests, 30% integration tests, 10% E2E tests")',
      'CI/CD Pipeline': 'Document CI/CD tools, triggers, and pipeline stages (e.g., "GitHub Actions triggered on PR and main push")',
      'Quality Gates': 'Define quality standards and failure conditions (e.g., "80% code coverage minimum, 0 test failures")',
      'ATDD Approach': 'Document Acceptance Test-Driven Development approach (e.g., "Write acceptance criteria tests before implementation")'
    };

    return recommendations[elementName] || `Add ${elementName} to Test Strategy section`;
  }

  /**
   * Get recommended section for requirement type
   *
   * @param requirementType - Requirement type
   * @returns Recommended section name
   */
  private getRecommendedSection(requirementType: 'functional' | 'non-functional'): string {
    return requirementType === 'functional'
      ? 'Component Architecture or System Overview'
      : 'Non-Functional Requirements';
  }

  /**
   * Escape special regex characters
   *
   * @param str - String to escape
   * @returns Escaped string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
