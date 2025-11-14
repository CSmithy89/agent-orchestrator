/**
 * PR Body Generator
 *
 * Generates comprehensive GitHub PR descriptions from story context and review results.
 * Includes story overview, acceptance criteria, implementation notes, test summary,
 * and dual-agent review results.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { IndependentReviewReport, TestSuite, CodeImplementation } from '../types.js';

/**
 * PR Body Configuration
 */
export interface PRBodyConfig {
  /** Story ID (e.g., "5-7-pr-creation-automation") */
  storyId: string;
  /** Story title */
  storyTitle: string;
  /** Path to story file */
  storyFilePath: string;
  /** Code implementation details */
  implementation: CodeImplementation;
  /** Test suite details */
  testSuite: TestSuite;
  /** Review report from Alex */
  reviewReport: IndependentReviewReport;
  /** Project root directory */
  projectRoot: string;
}

/**
 * Generate comprehensive PR body from story context and review
 *
 * @param config PR body configuration
 * @returns GitHub-flavored markdown PR body
 */
export async function generatePRBody(config: PRBodyConfig): Promise<string> {
  const {
    storyId,
    storyTitle,
    storyFilePath,
    implementation,
    testSuite,
    reviewReport,
    projectRoot
  } = config;

  // Read story file to extract acceptance criteria
  const storyContent = await fs.readFile(storyFilePath, 'utf-8');
  const acceptanceCriteria = extractAcceptanceCriteria(storyContent);

  // Build PR body sections
  const sections: string[] = [];

  // Story Overview
  sections.push('## Story Overview\n');
  sections.push(`**Story:** ${storyTitle}\n`);
  sections.push(`**Story ID:** ${storyId}\n`);
  sections.push(`**Story File:** [${path.basename(storyFilePath)}](${getRelativePath(projectRoot, storyFilePath)})\n`);

  // Acceptance Criteria
  sections.push('\n## Acceptance Criteria\n');
  if (acceptanceCriteria.length > 0) {
    acceptanceCriteria.forEach(ac => {
      sections.push(`- [x] ${ac}\n`);
    });
  } else {
    sections.push('_See story file for detailed acceptance criteria_\n');
  }

  // Implementation Notes
  sections.push('\n## Implementation\n');
  sections.push(implementation.implementationNotes || '_No implementation notes provided_');
  sections.push('\n');

  // Files Changed
  sections.push('\n### Files Changed\n');
  const filesByOperation = groupFilesByOperation(implementation.files);
  if (filesByOperation.create.length > 0) {
    sections.push(`\n**Created (${filesByOperation.create.length}):**\n`);
    filesByOperation.create.forEach(f => sections.push(`- ${f.path}\n`));
  }
  if (filesByOperation.modify.length > 0) {
    sections.push(`\n**Modified (${filesByOperation.modify.length}):**\n`);
    filesByOperation.modify.forEach(f => sections.push(`- ${f.path}\n`));
  }
  if (filesByOperation.delete.length > 0) {
    sections.push(`\n**Deleted (${filesByOperation.delete.length}):**\n`);
    filesByOperation.delete.forEach(f => sections.push(`- ${f.path}\n`));
  }

  // Test Summary
  sections.push('\n## Test Summary\n');
  sections.push(`- **Test Framework:** ${testSuite.framework}\n`);
  sections.push(`- **Total Tests:** ${testSuite.testCount}\n`);
  sections.push(`- **Test Results:** ${testSuite.results.passed} passed, ${testSuite.results.failed} failed, ${testSuite.results.skipped} skipped\n`);
  sections.push(`- **Test Duration:** ${testSuite.results.duration}ms\n`);
  sections.push('\n### Code Coverage\n');
  sections.push(`- **Lines:** ${testSuite.coverage.lines.toFixed(1)}%\n`);
  sections.push(`- **Functions:** ${testSuite.coverage.functions.toFixed(1)}%\n`);
  sections.push(`- **Branches:** ${testSuite.coverage.branches.toFixed(1)}%\n`);
  sections.push(`- **Statements:** ${testSuite.coverage.statements.toFixed(1)}%\n`);

  // Review Summary
  sections.push('\n## Review Summary\n');
  sections.push(`- **Security Score:** ${reviewReport.securityReview.score}/100\n`);
  sections.push(`- **Quality Score:** ${reviewReport.qualityAnalysis.score}/100\n`);
  sections.push(`- **Test Validation Score:** ${reviewReport.testValidation.score}/100\n`);
  sections.push(`- **Overall Score:** ${(reviewReport.overallScore * 100).toFixed(1)}/100\n`);
  sections.push(`- **Reviewer Confidence:** ${(reviewReport.confidence * 100).toFixed(1)}%\n`);
  sections.push(`- **Decision:** ${reviewReport.decision.toUpperCase()}\n`);

  if (reviewReport.findings.length > 0) {
    sections.push('\n### Review Findings\n');
    const findingsBySeverity = groupFindingsBySeverity(reviewReport.findings);

    if (findingsBySeverity.critical.length > 0) {
      sections.push(`\n**Critical (${findingsBySeverity.critical.length}):**\n`);
      findingsBySeverity.critical.forEach(f => {
        sections.push(`- **${f.title}** (${f.location}): ${f.description}\n`);
      });
    }
    if (findingsBySeverity.high.length > 0) {
      sections.push(`\n**High (${findingsBySeverity.high.length}):**\n`);
      findingsBySeverity.high.forEach(f => {
        sections.push(`- **${f.title}** (${f.location}): ${f.description}\n`);
      });
    }
    if (findingsBySeverity.medium.length > 0) {
      sections.push(`\n**Medium (${findingsBySeverity.medium.length}):**\n`);
      findingsBySeverity.medium.forEach(f => {
        sections.push(`- ${f.title} (${f.location})\n`);
      });
    }
  }

  // Agent Signature
  sections.push('\n---\n');
  sections.push('**Implemented by:** Amelia (Developer Agent)\n');
  sections.push('**Reviewed by:** Alex (Code Reviewer Agent)\n');
  sections.push(`**Story File:** [docs/stories/${storyId}.md](docs/stories/${storyId}.md)\n`);

  return sections.join('');
}

/**
 * Extract acceptance criteria from story markdown
 */
function extractAcceptanceCriteria(storyContent: string): string[] {
  const criteria: string[] = [];
  const lines = storyContent.split('\n');
  let inAcceptanceCriteria = false;

  for (const line of lines) {
    // Start of acceptance criteria section
    if (line.match(/^#+\s*Acceptance Criteria/i)) {
      inAcceptanceCriteria = true;
      continue;
    }

    // End of acceptance criteria (next section)
    if (inAcceptanceCriteria && line.match(/^#+\s/)) {
      break;
    }

    // Extract checkbox items
    if (inAcceptanceCriteria && line.match(/^-\s*\[.\]\s*.+/)) {
      const match = line.match(/^-\s*\[.\]\s*(.+)/);
      if (match && match[1]) {
        // Extract AC title (first line before nested items)
        const acText = match[1].trim();
        if (!acText.startsWith('-')) {
          criteria.push(acText);
        }
      }
    }
  }

  return criteria;
}

/**
 * Group files by operation type
 */
function groupFilesByOperation(files: Array<{ path: string; operation: string }>) {
  return {
    create: files.filter(f => f.operation === 'create'),
    modify: files.filter(f => f.operation === 'modify'),
    delete: files.filter(f => f.operation === 'delete')
  };
}

/**
 * Group review findings by severity
 */
function groupFindingsBySeverity(findings: Array<{ severity: string; title: string; description: string; location: string }>) {
  return {
    critical: findings.filter(f => f.severity === 'critical'),
    high: findings.filter(f => f.severity === 'high'),
    medium: findings.filter(f => f.severity === 'medium'),
    low: findings.filter(f => f.severity === 'low'),
    info: findings.filter(f => f.severity === 'info')
  };
}

/**
 * Get relative path from project root
 * Normalizes to POSIX separators for GitHub markdown links
 */
function getRelativePath(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}
