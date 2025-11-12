import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Technical Decision Record (ADR) interface
 * Based on Epic 3 tech spec lines 247-263
 */
export interface TechnicalDecision {
  id: string; // ADR-001, ADR-002, etc.
  title: string;
  context: string; // Problem statement
  decision: string; // Chosen solution
  alternatives: {
    option: string;
    pros: string[];
    cons: string[];
  }[];
  rationale: string;
  consequences: string[];
  status: 'proposed' | 'accepted' | 'superseded';
  decisionMaker: 'winston' | 'murat' | 'cis-agent' | 'user';
  date: Date;
  confidence?: number; // From DecisionEngine
  prdRequirements?: string[]; // PRD requirement IDs
}

/**
 * TechnicalDecisionLogger captures and formats architectural decisions
 * as Architecture Decision Records (ADRs) for inclusion in architecture.md
 *
 * Usage:
 * ```typescript
 * const logger = new TechnicalDecisionLogger();
 * logger.captureDecision({
 *   title: "Use Microkernel Architecture",
 *   context: "Need extensibility for multiple workflows",
 *   decision: "Adopt microkernel pattern",
 *   alternatives: [...],
 *   rationale: "Balance of extensibility and simplicity",
 *   consequences: ["Easy to add workflows", "More complex than monolith"],
 *   status: "accepted",
 *   decisionMaker: "winston",
 *   date: new Date()
 * });
 * const markdown = logger.generateADRSection();
 * ```
 */
export class TechnicalDecisionLogger {
  private decisions: TechnicalDecision[] = [];
  private nextId = 1;

  /**
   * Capture a technical decision with context and rationale
   */
  captureDecision(decision: Partial<TechnicalDecision>): void {
    const adr: TechnicalDecision = {
      id: decision.id || `ADR-${String(this.nextId++).padStart(3, '0')}`,
      title: decision.title || 'Untitled Decision',
      context: decision.context || '',
      decision: decision.decision || '',
      alternatives: decision.alternatives || [],
      rationale: decision.rationale || '',
      consequences: decision.consequences || [],
      status: decision.status || 'proposed',
      decisionMaker: decision.decisionMaker || 'winston',
      date: decision.date || new Date(),
      confidence: decision.confidence,
      prdRequirements: decision.prdRequirements
    };

    this.decisions.push(adr);
  }

  /**
   * Get all captured decisions (audit trail)
   */
  getDecisionAuditTrail(): TechnicalDecision[] {
    return [...this.decisions];
  }

  /**
   * Generate Technical Decisions section markdown for architecture.md
   */
  generateADRSection(): string {
    if (this.decisions.length === 0) {
      return '## Technical Decisions\n\nNo architectural decisions recorded.\n';
    }

    let markdown = '## Technical Decisions\n\n';
    markdown += 'This section documents all significant architectural decisions made during the design phase.\n\n';

    // Add summary table
    markdown += '### Decision Summary\n\n';
    markdown += '| ID | Title | Decision Maker | Date | Status |\n';
    markdown += '|----|-------|----------------|------|--------|\n';

    for (const decision of this.decisions) {
      const dateStr = decision.date.toISOString().split('T')[0];
      markdown += `| ${decision.id} | ${decision.title} | ${this.formatDecisionMaker(decision.decisionMaker)} | ${dateStr} | ${decision.status} |\n`;
    }

    markdown += '\n### Detailed Decision Records\n\n';

    // Add detailed ADRs
    for (const decision of this.decisions) {
      markdown += this.formatADR(decision);
      markdown += '\n---\n\n';
    }

    return markdown;
  }

  /**
   * Format a single ADR as markdown
   */
  private formatADR(decision: TechnicalDecision): string {
    let markdown = `### ${decision.id}: ${decision.title}\n\n`;

    markdown += `**Status:** ${decision.status}\n`;
    markdown += `**Decision Maker:** ${this.formatDecisionMaker(decision.decisionMaker)}\n`;
    markdown += `**Date:** ${decision.date.toISOString().split('T')[0]}\n`;

    if (decision.confidence !== undefined) {
      markdown += `**Confidence:** ${(decision.confidence * 100).toFixed(0)}%\n`;
    }

    markdown += '\n#### Context\n\n';
    markdown += decision.context + '\n\n';

    markdown += '#### Decision\n\n';
    markdown += decision.decision + '\n\n';

    if (decision.alternatives && decision.alternatives.length > 0) {
      markdown += '#### Alternatives Considered\n\n';
      for (const alt of decision.alternatives) {
        markdown += `**${alt.option}**\n\n`;
        if (alt.pros.length > 0) {
          markdown += 'Pros:\n';
          for (const pro of alt.pros) {
            markdown += `- ${pro}\n`;
          }
          markdown += '\n';
        }
        if (alt.cons.length > 0) {
          markdown += 'Cons:\n';
          for (const con of alt.cons) {
            markdown += `- ${con}\n`;
          }
          markdown += '\n';
        }
      }
    }

    markdown += '#### Rationale\n\n';
    markdown += decision.rationale + '\n\n';

    if (decision.consequences && decision.consequences.length > 0) {
      markdown += '#### Consequences\n\n';
      for (const consequence of decision.consequences) {
        markdown += `- ${consequence}\n`;
      }
      markdown += '\n';
    }

    if (decision.prdRequirements && decision.prdRequirements.length > 0) {
      markdown += '#### PRD Traceability\n\n';
      for (const req of decision.prdRequirements) {
        markdown += `- ${req}\n`;
      }
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Format decision maker for display
   */
  private formatDecisionMaker(maker: string): string {
    const makers: Record<string, string> = {
      'winston': 'Winston (System Architect)',
      'murat': 'Murat (Test Architect)',
      'cis-agent': 'CIS Agent',
      'user': 'User'
    };
    return makers[maker] || maker;
  }

  /**
   * Merge decisions from multiple sources
   */
  mergeDecisions(otherDecisions: TechnicalDecision[]): void {
    for (const decision of otherDecisions) {
      this.captureDecision(decision);
    }
  }

  /**
   * Clear all decisions
   */
  clear(): void {
    this.decisions = [];
    this.nextId = 1;
  }

  /**
   * Get decision count
   */
  getDecisionCount(): number {
    return this.decisions.length;
  }

  /**
   * Generate traceability matrix: PRD requirement → ADR
   */
  generateTraceabilityMatrix(): Record<string, string[]> {
    const matrix: Record<string, string[]> = {};

    for (const decision of this.decisions) {
      if (decision.prdRequirements) {
        for (const req of decision.prdRequirements) {
          if (!matrix[req]) {
            matrix[req] = [];
          }
          matrix[req].push(decision.id);
        }
      }
    }

    return matrix;
  }

  /**
   * Save decisions to JSON file
   */
  async saveToFile(filePath: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      filePath,
      JSON.stringify(this.decisions, null, 2),
      'utf-8'
    );
  }

  /**
   * Load decisions from JSON file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const decisions = JSON.parse(content);
      this.decisions = decisions.map((d: any) => ({
        ...d,
        date: new Date(d.date)
      }));
      // Update nextId based on loaded decisions
      const maxId = Math.max(0, ...this.decisions.map(d => {
        const match = d.id.match(/ADR-(\d+)/);
        return match && match[1] ? parseInt(match[1]) : 0;
      }));
      this.nextId = maxId + 1;
    } catch (error) {
      // File doesn't exist, start fresh
      this.decisions = [];
      this.nextId = 1;
    }
  }
}
