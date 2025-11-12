/**
 * Integration tests for TechnicalDecisionLogger
 *
 * Tests all acceptance criteria for Story 3-4:
 * - AC-1: Decision capture during workflow
 * - AC-2: ADR format generation
 * - AC-3: Decision aggregation
 * - AC-4: Technical Decisions section in architecture.md
 * - AC-5: PRD traceability
 * - AC-6: Decision audit trail
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TechnicalDecisionLogger, TechnicalDecision } from '../../src/core/technical-decision-logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('TechnicalDecisionLogger Integration Tests', () => {
  let logger: TechnicalDecisionLogger;
  let tempDir: string;

  beforeEach(async () => {
    logger = new TechnicalDecisionLogger();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tdl-test-'));
  });

  /**
   * AC-1: Decision Capture During Workflow
   */
  describe('AC-1: Decision Capture During Workflow', () => {
    it('should capture decision with all required fields', () => {
      logger.captureDecision({
        title: 'Use Microkernel Architecture',
        context: 'Need extensibility for multiple workflows',
        decision: 'Adopt microkernel pattern',
        alternatives: [
          {
            option: 'Monolithic Architecture',
            pros: ['Simpler initial implementation', 'Fewer abstraction layers'],
            cons: ['Difficult to extend', 'Tight coupling', 'Scalability challenges']
          }
        ],
        rationale: 'Balance of extensibility and simplicity',
        consequences: ['Easy to add workflows', 'More complex than monolith'],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date('2025-11-12'),
        confidence: 0.85,
        prdRequirements: ['FR-CORE-001', 'NFR-ARCH-001']
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(1);

      const decision = decisions[0];
      expect(decision.id).toBe('ADR-001');
      expect(decision.title).toBe('Use Microkernel Architecture');
      expect(decision.context).toBe('Need extensibility for multiple workflows');
      expect(decision.decision).toBe('Adopt microkernel pattern');
      expect(decision.alternatives).toHaveLength(1);
      expect(decision.alternatives[0].option).toBe('Monolithic Architecture');
      expect(decision.rationale).toBe('Balance of extensibility and simplicity');
      expect(decision.consequences).toHaveLength(2);
      expect(decision.status).toBe('accepted');
      expect(decision.decisionMaker).toBe('winston');
      expect(decision.confidence).toBe(0.85);
      expect(decision.prdRequirements).toEqual(['FR-CORE-001', 'NFR-ARCH-001']);
    });

    it('should capture multiple decisions with sequential ADR IDs', () => {
      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context 1',
        decision: 'Answer 1',
        alternatives: [],
        rationale: 'Rationale 1',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      logger.captureDecision({
        title: 'Decision 2',
        context: 'Context 2',
        decision: 'Answer 2',
        alternatives: [],
        rationale: 'Rationale 2',
        consequences: [],
        status: 'proposed',
        decisionMaker: 'murat',
        date: new Date()
      });

      logger.captureDecision({
        title: 'Decision 3',
        context: 'Context 3',
        decision: 'Answer 3',
        alternatives: [],
        rationale: 'Rationale 3',
        consequences: [],
        status: 'superseded',
        decisionMaker: 'user',
        date: new Date()
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(3);
      expect(decisions[0].id).toBe('ADR-001');
      expect(decisions[1].id).toBe('ADR-002');
      expect(decisions[2].id).toBe('ADR-003');
    });

    it('should handle partial decision data with defaults', () => {
      logger.captureDecision({
        title: 'Minimal Decision',
        decision: 'Use REST API'
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(1);

      const decision = decisions[0];
      expect(decision.id).toBe('ADR-001');
      expect(decision.title).toBe('Minimal Decision');
      expect(decision.context).toBe('');
      expect(decision.decision).toBe('Use REST API');
      expect(decision.alternatives).toEqual([]);
      expect(decision.rationale).toBe('');
      expect(decision.consequences).toEqual([]);
      expect(decision.status).toBe('proposed');
      expect(decision.decisionMaker).toBe('winston');
      expect(decision.date).toBeInstanceOf(Date);
    });
  });

  /**
   * AC-2: ADR Format Generation
   */
  describe('AC-2: ADR Format Generation', () => {
    it('should format single decision as ADR markdown', () => {
      logger.captureDecision({
        title: 'Use PostgreSQL Database',
        context: 'Need reliable relational database for structured data',
        decision: 'Use PostgreSQL as primary database',
        alternatives: [
          {
            option: 'MongoDB',
            pros: ['Flexible schema', 'Horizontal scaling'],
            cons: ['Weaker consistency guarantees', 'Complex transactions']
          },
          {
            option: 'MySQL',
            pros: ['Wide adoption', 'Good performance'],
            cons: ['Limited JSON support', 'Less advanced features']
          }
        ],
        rationale: 'PostgreSQL provides excellent ACID compliance, JSON support, and extensibility',
        consequences: [
          'Positive: Strong data integrity and consistency',
          'Positive: Advanced features like full-text search',
          'Negative: Vertical scaling limitations'
        ],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date('2025-11-12'),
        confidence: 0.90,
        prdRequirements: ['FR-DATA-001']
      });

      const markdown = logger.generateADRSection();

      // Verify markdown structure
      expect(markdown).toContain('## Technical Decisions');
      expect(markdown).toContain('### Decision Summary');
      expect(markdown).toContain('| ID | Title | Decision Maker | Date | Status |');
      expect(markdown).toContain('| ADR-001 | Use PostgreSQL Database | Winston (System Architect) | 2025-11-12 | accepted |');
      expect(markdown).toContain('### Detailed Decision Records');
      expect(markdown).toContain('### ADR-001: Use PostgreSQL Database');
      expect(markdown).toContain('**Status:** accepted');
      expect(markdown).toContain('**Decision Maker:** Winston (System Architect)');
      expect(markdown).toContain('**Date:** 2025-11-12');
      expect(markdown).toContain('**Confidence:** 90%');
      expect(markdown).toContain('#### Context');
      expect(markdown).toContain('Need reliable relational database for structured data');
      expect(markdown).toContain('#### Decision');
      expect(markdown).toContain('Use PostgreSQL as primary database');
      expect(markdown).toContain('#### Alternatives Considered');
      expect(markdown).toContain('**MongoDB**');
      expect(markdown).toContain('Pros:');
      expect(markdown).toContain('- Flexible schema');
      expect(markdown).toContain('Cons:');
      expect(markdown).toContain('- Weaker consistency guarantees');
      expect(markdown).toContain('**MySQL**');
      expect(markdown).toContain('#### Rationale');
      expect(markdown).toContain('PostgreSQL provides excellent ACID compliance');
      expect(markdown).toContain('#### Consequences');
      expect(markdown).toContain('- Positive: Strong data integrity and consistency');
      expect(markdown).toContain('- Negative: Vertical scaling limitations');
      expect(markdown).toContain('#### PRD Traceability');
      expect(markdown).toContain('- FR-DATA-001');
    });

    it('should format ADR with different decision status values', () => {
      logger.captureDecision({
        title: 'Proposed Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'proposed',
        decisionMaker: 'winston',
        date: new Date()
      });

      logger.captureDecision({
        title: 'Accepted Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date()
      });

      logger.captureDecision({
        title: 'Superseded Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'superseded',
        decisionMaker: 'user',
        date: new Date()
      });

      const markdown = logger.generateADRSection();

      expect(markdown).toContain('| ADR-001 | Proposed Decision | Winston (System Architect) |');
      expect(markdown).toContain('| proposed |');
      expect(markdown).toContain('| ADR-002 | Accepted Decision | Murat (Test Architect) |');
      expect(markdown).toContain('| accepted |');
      expect(markdown).toContain('| ADR-003 | Superseded Decision | User |');
      expect(markdown).toContain('| superseded |');
    });

    it('should handle ADR with no alternatives or consequences', () => {
      logger.captureDecision({
        title: 'Simple Decision',
        context: 'Simple context',
        decision: 'Simple solution',
        alternatives: [],
        rationale: 'Simple rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date('2025-11-12')
      });

      const markdown = logger.generateADRSection();

      expect(markdown).toContain('### ADR-001: Simple Decision');
      expect(markdown).toContain('#### Context');
      expect(markdown).toContain('Simple context');
      expect(markdown).toContain('#### Decision');
      expect(markdown).toContain('Simple solution');
      expect(markdown).toContain('#### Rationale');
      expect(markdown).toContain('Simple rationale');
      // Should not contain Alternatives or Consequences sections
      expect(markdown).not.toContain('#### Alternatives Considered');
      expect(markdown).not.toContain('#### Consequences');
    });

    it('should return placeholder when no decisions captured', () => {
      const markdown = logger.generateADRSection();

      expect(markdown).toBe('## Technical Decisions\n\nNo architectural decisions recorded.\n');
    });
  });

  /**
   * AC-3: Decision Aggregation
   */
  describe('AC-3: Decision Aggregation', () => {
    it('should merge decisions from Winston agent', () => {
      const winstonDecisions: TechnicalDecision[] = [
        {
          id: '',
          title: 'Winston Decision 1',
          context: 'Context 1',
          decision: 'Solution 1',
          alternatives: [],
          rationale: 'Rationale 1',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'winston',
          date: new Date('2025-11-12T10:00:00Z')
        },
        {
          id: '',
          title: 'Winston Decision 2',
          context: 'Context 2',
          decision: 'Solution 2',
          alternatives: [],
          rationale: 'Rationale 2',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'winston',
          date: new Date('2025-11-12T11:00:00Z')
        }
      ];

      logger.mergeDecisions(winstonDecisions);

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(2);
      expect(decisions[0].id).toBe('ADR-001');
      expect(decisions[0].title).toBe('Winston Decision 1');
      expect(decisions[1].id).toBe('ADR-002');
      expect(decisions[1].title).toBe('Winston Decision 2');
    });

    it('should merge decisions from Murat agent', () => {
      const muratDecisions: TechnicalDecision[] = [
        {
          id: '',
          title: 'Murat Decision 1',
          context: 'Test Context 1',
          decision: 'Test Solution 1',
          alternatives: [],
          rationale: 'Test Rationale 1',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'murat',
          date: new Date('2025-11-12T12:00:00Z')
        }
      ];

      logger.mergeDecisions(muratDecisions);

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(1);
      expect(decisions[0].id).toBe('ADR-001');
      expect(decisions[0].title).toBe('Murat Decision 1');
      expect(decisions[0].decisionMaker).toBe('murat');
    });

    it('should aggregate decisions from both agents with chronological ordering', () => {
      const winstonDecisions: TechnicalDecision[] = [
        {
          id: '',
          title: 'Winston Decision 1',
          context: 'Context',
          decision: 'Solution',
          alternatives: [],
          rationale: 'Rationale',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'winston',
          date: new Date('2025-11-12T10:00:00Z')
        },
        {
          id: '',
          title: 'Winston Decision 2',
          context: 'Context',
          decision: 'Solution',
          alternatives: [],
          rationale: 'Rationale',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'winston',
          date: new Date('2025-11-12T12:00:00Z')
        }
      ];

      const muratDecisions: TechnicalDecision[] = [
        {
          id: '',
          title: 'Murat Decision 1',
          context: 'Context',
          decision: 'Solution',
          alternatives: [],
          rationale: 'Rationale',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'murat',
          date: new Date('2025-11-12T11:00:00Z')
        }
      ];

      logger.mergeDecisions(winstonDecisions);
      logger.mergeDecisions(muratDecisions);

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(3);

      // Verify sequential IDs (not chronological, but order of capture)
      expect(decisions[0].id).toBe('ADR-001');
      expect(decisions[0].title).toBe('Winston Decision 1');
      expect(decisions[1].id).toBe('ADR-002');
      expect(decisions[1].title).toBe('Winston Decision 2');
      expect(decisions[2].id).toBe('ADR-003');
      expect(decisions[2].title).toBe('Murat Decision 1');
    });
  });

  /**
   * AC-4: Technical Decisions Section in Architecture.md
   */
  describe('AC-4: Technical Decisions Section in Architecture.md', () => {
    it('should generate complete section with summary table and detailed ADRs', () => {
      // Add multiple decisions
      logger.captureDecision({
        title: 'System Design Decision',
        context: 'Architecture pattern selection',
        decision: 'Use microkernel',
        alternatives: [],
        rationale: 'Extensibility',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date('2025-11-12')
      });

      logger.captureDecision({
        title: 'Test Framework Selection',
        context: 'Testing strategy',
        decision: 'Use Vitest',
        alternatives: [],
        rationale: 'Fast and modern',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date('2025-11-12')
      });

      const markdown = logger.generateADRSection();

      // Verify summary table
      expect(markdown).toContain('### Decision Summary');
      expect(markdown).toContain('| ID | Title | Decision Maker | Date | Status |');
      expect(markdown).toContain('| ADR-001 | System Design Decision | Winston (System Architect) | 2025-11-12 | accepted |');
      expect(markdown).toContain('| ADR-002 | Test Framework Selection | Murat (Test Architect) | 2025-11-12 | accepted |');

      // Verify detailed records
      expect(markdown).toContain('### Detailed Decision Records');
      expect(markdown).toContain('### ADR-001: System Design Decision');
      expect(markdown).toContain('### ADR-002: Test Framework Selection');
    });

    it('should include all decision maker types in formatted output', () => {
      logger.captureDecision({
        title: 'Winston Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      logger.captureDecision({
        title: 'Murat Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date()
      });

      logger.captureDecision({
        title: 'CIS Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'cis-agent',
        date: new Date()
      });

      logger.captureDecision({
        title: 'User Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'user',
        date: new Date()
      });

      const markdown = logger.generateADRSection();

      expect(markdown).toContain('Winston (System Architect)');
      expect(markdown).toContain('Murat (Test Architect)');
      expect(markdown).toContain('CIS Agent');
      expect(markdown).toContain('User');
    });
  });

  /**
   * AC-5: PRD Traceability
   */
  describe('AC-5: PRD Traceability', () => {
    it('should link decisions to PRD requirements', () => {
      logger.captureDecision({
        title: 'Architecture Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date(),
        prdRequirements: ['FR-CORE-001', 'FR-CORE-002']
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions[0].prdRequirements).toEqual(['FR-CORE-001', 'FR-CORE-002']);

      const markdown = logger.generateADRSection();
      expect(markdown).toContain('#### PRD Traceability');
      expect(markdown).toContain('- FR-CORE-001');
      expect(markdown).toContain('- FR-CORE-002');
    });

    it('should generate traceability matrix mapping PRD requirements to ADRs', () => {
      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date(),
        prdRequirements: ['FR-CORE-001', 'FR-CORE-002']
      });

      logger.captureDecision({
        title: 'Decision 2',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date(),
        prdRequirements: ['FR-CORE-002', 'NFR-ARCH-001']
      });

      logger.captureDecision({
        title: 'Decision 3',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date(),
        prdRequirements: ['NFR-TEST-001']
      });

      const matrix = logger.generateTraceabilityMatrix();

      expect(matrix).toEqual({
        'FR-CORE-001': ['ADR-001'],
        'FR-CORE-002': ['ADR-001', 'ADR-002'],
        'NFR-ARCH-001': ['ADR-002'],
        'NFR-TEST-001': ['ADR-003']
      });
    });

    it('should handle decisions with no PRD requirements', () => {
      logger.captureDecision({
        title: 'Decision without PRD',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      const matrix = logger.generateTraceabilityMatrix();
      expect(matrix).toEqual({});

      const markdown = logger.generateADRSection();
      expect(markdown).not.toContain('#### PRD Traceability');
    });

    it('should handle decision with multiple PRD requirements in traceability matrix', () => {
      logger.captureDecision({
        title: 'Multi-requirement Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date(),
        prdRequirements: ['FR-1', 'FR-2', 'FR-3']
      });

      const matrix = logger.generateTraceabilityMatrix();

      expect(matrix['FR-1']).toEqual(['ADR-001']);
      expect(matrix['FR-2']).toEqual(['ADR-001']);
      expect(matrix['FR-3']).toEqual(['ADR-001']);
    });
  });

  /**
   * AC-6: Decision Audit Trail
   */
  describe('AC-6: Decision Audit Trail', () => {
    it('should log all decisions with timestamps', () => {
      const timestamp1 = new Date('2025-11-12T10:00:00Z');
      const timestamp2 = new Date('2025-11-12T11:00:00Z');

      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: timestamp1
      });

      logger.captureDecision({
        title: 'Decision 2',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: timestamp2
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(2);
      expect(decisions[0].date).toEqual(timestamp1);
      expect(decisions[1].date).toEqual(timestamp2);
    });

    it('should record decision confidence scores', () => {
      logger.captureDecision({
        title: 'High Confidence Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date(),
        confidence: 0.95
      });

      logger.captureDecision({
        title: 'Low Confidence Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'proposed',
        decisionMaker: 'winston',
        date: new Date(),
        confidence: 0.65
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions[0].confidence).toBe(0.95);
      expect(decisions[1].confidence).toBe(0.65);

      const markdown = logger.generateADRSection();
      expect(markdown).toContain('**Confidence:** 95%');
      expect(markdown).toContain('**Confidence:** 65%');
    });

    it('should persist audit trail to file', async () => {
      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context 1',
        decision: 'Solution 1',
        alternatives: [],
        rationale: 'Rationale 1',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date('2025-11-12T10:00:00Z'),
        confidence: 0.85
      });

      logger.captureDecision({
        title: 'Decision 2',
        context: 'Context 2',
        decision: 'Solution 2',
        alternatives: [],
        rationale: 'Rationale 2',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date('2025-11-12T11:00:00Z'),
        confidence: 0.90
      });

      const filePath = path.join(tempDir, 'decisions.json');
      await logger.saveToFile(filePath);

      // Verify file exists and contains valid JSON
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('ADR-001');
      expect(parsed[0].title).toBe('Decision 1');
      expect(parsed[1].id).toBe('ADR-002');
      expect(parsed[1].title).toBe('Decision 2');
    });

    it('should load audit trail from file', async () => {
      // Create a decision file
      const decisions = [
        {
          id: 'ADR-001',
          title: 'Loaded Decision 1',
          context: 'Context 1',
          decision: 'Solution 1',
          alternatives: [],
          rationale: 'Rationale 1',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'winston',
          date: '2025-11-12T10:00:00Z',
          confidence: 0.85
        },
        {
          id: 'ADR-002',
          title: 'Loaded Decision 2',
          context: 'Context 2',
          decision: 'Solution 2',
          alternatives: [],
          rationale: 'Rationale 2',
          consequences: [],
          status: 'accepted',
          decisionMaker: 'murat',
          date: '2025-11-12T11:00:00Z',
          confidence: 0.90
        }
      ];

      const filePath = path.join(tempDir, 'decisions.json');
      await fs.writeFile(filePath, JSON.stringify(decisions, null, 2), 'utf-8');

      // Load decisions
      const newLogger = new TechnicalDecisionLogger();
      await newLogger.loadFromFile(filePath);

      const loadedDecisions = newLogger.getDecisionAuditTrail();
      expect(loadedDecisions).toHaveLength(2);
      expect(loadedDecisions[0].id).toBe('ADR-001');
      expect(loadedDecisions[0].title).toBe('Loaded Decision 1');
      expect(loadedDecisions[0].date).toBeInstanceOf(Date);
      expect(loadedDecisions[1].id).toBe('ADR-002');
      expect(loadedDecisions[1].title).toBe('Loaded Decision 2');

      // Verify next ID is set correctly
      newLogger.captureDecision({
        title: 'New Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      const allDecisions = newLogger.getDecisionAuditTrail();
      expect(allDecisions).toHaveLength(3);
      expect(allDecisions[2].id).toBe('ADR-003');
    });

    it('should handle missing file when loading', async () => {
      const filePath = path.join(tempDir, 'nonexistent.json');
      await logger.loadFromFile(filePath);

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions).toHaveLength(0);

      // Verify logger still works after failed load
      logger.captureDecision({
        title: 'New Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      const newDecisions = logger.getDecisionAuditTrail();
      expect(newDecisions).toHaveLength(1);
      expect(newDecisions[0].id).toBe('ADR-001');
    });

    it('should be queryable after workflow completion', () => {
      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date(),
        prdRequirements: ['FR-1']
      });

      logger.captureDecision({
        title: 'Decision 2',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date(),
        prdRequirements: ['FR-2']
      });

      // Query all decisions
      const allDecisions = logger.getDecisionAuditTrail();
      expect(allDecisions).toHaveLength(2);

      // Query by decision maker (simulated)
      const winstonDecisions = allDecisions.filter(d => d.decisionMaker === 'winston');
      expect(winstonDecisions).toHaveLength(1);
      expect(winstonDecisions[0].title).toBe('Decision 1');

      const muratDecisions = allDecisions.filter(d => d.decisionMaker === 'murat');
      expect(muratDecisions).toHaveLength(1);
      expect(muratDecisions[0].title).toBe('Decision 2');

      // Get decision count
      expect(logger.getDecisionCount()).toBe(2);
    });
  });

  /**
   * Utility Methods Tests
   */
  describe('Utility Methods', () => {
    it('should clear all decisions', () => {
      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      expect(logger.getDecisionCount()).toBe(1);

      logger.clear();

      expect(logger.getDecisionCount()).toBe(0);
      expect(logger.getDecisionAuditTrail()).toHaveLength(0);

      // Verify IDs reset
      logger.captureDecision({
        title: 'New Decision',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      const decisions = logger.getDecisionAuditTrail();
      expect(decisions[0].id).toBe('ADR-001');
    });

    it('should get decision count', () => {
      expect(logger.getDecisionCount()).toBe(0);

      logger.captureDecision({
        title: 'Decision 1',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      });

      expect(logger.getDecisionCount()).toBe(1);

      logger.captureDecision({
        title: 'Decision 2',
        context: 'Context',
        decision: 'Solution',
        alternatives: [],
        rationale: 'Rationale',
        consequences: [],
        status: 'accepted',
        decisionMaker: 'murat',
        date: new Date()
      });

      expect(logger.getDecisionCount()).toBe(2);
    });
  });
});
