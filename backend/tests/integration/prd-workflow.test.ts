/**
 * PRD Workflow Integration Tests
 * Tests full workflow execution with Mary, John, DecisionEngine, and PRDValidator (Story 2.7)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PRDWorkflowExecutor } from '../../src/core/workflows/prd-workflow-executor.js';
import { PRDValidator } from '../../src/core/workflows/prd-validator.js';
import { AgentPool } from '../../src/core/AgentPool.js';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../src/core/services/escalation-queue.js';
import { StateManager } from '../../src/core/StateManager.js';

describe('PRD Workflow Integration Tests', () => {
  const testDir = path.join(__dirname, '__test_data__', 'prd-integration');
  const projectRoot = path.join(testDir, 'test-project');
  const bmadDir = path.join(projectRoot, 'bmad', 'bmm', 'workflows', 'prd');
  const docsDir = path.join(projectRoot, 'docs');

  let mockAgentPool: AgentPool;
  let mockDecisionEngine: DecisionEngine;
  let mockEscalationQueue: EscalationQueue;
  let mockStateManager: StateManager;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create test directory structure
    await fs.mkdir(projectRoot, { recursive: true });
    await fs.mkdir(bmadDir, { recursive: true });
    await fs.mkdir(docsDir, { recursive: true });
    await fs.mkdir(path.join(projectRoot, '.bmad'), { recursive: true });

    // Create workflow.yaml
    const workflowContent = `
name: PRD Workflow Integration Test
description: Test full workflow execution
steps:
  - id: 1
    name: Mary Requirements Analysis
    agent: mary
    method: analyzeRequirements
    template-output: requirements_section
  - id: 2
    name: John Product Vision
    agent: john
    method: defineProductVision
    template-output: vision_section
`;
    await fs.writeFile(path.join(bmadDir, 'workflow.yaml'), workflowContent);

    // Mock services
    mockStateManager = {
      saveState: vi.fn().mockResolvedValue(undefined),
      loadState: vi.fn().mockResolvedValue(null)
    } as any;

    mockDecisionEngine = {
      attemptAutonomousDecision: vi.fn().mockResolvedValue({
        decision: 'Proceed',
        confidence: 0.9,
        reasoning: 'High confidence'
      })
    } as any;

    mockEscalationQueue = {
      add: vi.fn().mockResolvedValue('escalation-1'),
      waitForResponse: vi.fn().mockResolvedValue({
        answer: 'Approved',
        timestamp: new Date().toISOString()
      })
    } as any;

    mockAgentPool = {
      createAgent: vi.fn().mockImplementation((agentType: string, _context?: any) => {
        if (agentType === 'mary') {
          return Promise.resolve({
            id: 'mary-agent-id',
            analyzeRequirements: vi.fn().mockResolvedValue({
              requirementsList: ['Req 1', 'Req 2'],
              confidence: 0.85
            })
          });
        }
        if (agentType === 'john') {
          return Promise.resolve({
            id: 'john-agent-id',
            defineProductVision: vi.fn().mockResolvedValue({
              vision: 'Test vision',
              confidence: 0.88
            })
          });
        }
        throw new Error(`Unknown agent: ${agentType}`);
      }),
      destroyAgent: vi.fn().mockResolvedValue(undefined)
    } as any;
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute full workflow: Mary → John → PRD generation', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    const result = await executor.execute(projectRoot, { yoloMode: true });

    // Verify workflow completed successfully
    expect(result.success).toBe(true);

    // Verify both agents were spawned
    expect(mockAgentPool.createAgent).toHaveBeenCalledWith('mary', expect.any(Object));
    expect(mockAgentPool.createAgent).toHaveBeenCalledWith('john', expect.any(Object));

    // Verify PRD.md was generated
    const prdPath = path.join(docsDir, 'PRD.md');
    const prdExists = await fs.access(prdPath).then(() => true).catch(() => false);
    expect(prdExists).toBe(true);
  });

  it('should pass shared context between Mary and John', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    await executor.execute(projectRoot, { yoloMode: true });

    // Verify both agents received context
    const maryCall = (mockAgentPool.createAgent as any).mock.calls.find((c: any) => c[0] === 'mary');
    const johnCall = (mockAgentPool.createAgent as any).mock.calls.find((c: any) => c[0] === 'john');

    expect(maryCall).toBeDefined();
    expect(johnCall).toBeDefined();

    expect(maryCall[1]).toHaveProperty('projectPath');
    expect(johnCall[1]).toHaveProperty('projectPath');
  });

  it('should make autonomous decisions with DecisionEngine', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    await executor.execute(projectRoot, { yoloMode: true });

    // Verify DecisionEngine was used
    expect(mockDecisionEngine.attemptAutonomousDecision).toHaveBeenCalled();
  });

  it('should escalate low-confidence decisions', async () => {
    mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockResolvedValue({
      decision: 'Unclear',
      confidence: 0.6, // Below threshold
      reasoning: 'Low confidence'
    });

    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    await executor.execute(projectRoot, { yoloMode: true });

    // Verify escalation occurred
    expect(mockEscalationQueue.add).toHaveBeenCalled();
    expect(mockEscalationQueue.waitForResponse).toHaveBeenCalled();
  });

  it('should generate PRD.md incrementally', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    await executor.execute(projectRoot, { yoloMode: true });

    const prdPath = path.join(docsDir, 'PRD.md');
    const prdContent = await fs.readFile(prdPath, 'utf-8');

    // Verify both sections were added
    expect(prdContent).toContain('Requirements Section');
    expect(prdContent).toContain('Vision Section');
  });

  it('should update workflow-status.yaml correctly', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    await executor.execute(projectRoot, { yoloMode: true });

    const statusPath = path.join(docsDir, 'workflow-status.yaml');
    const statusContent = await fs.readFile(statusPath, 'utf-8');

    expect(statusContent).toContain('prd');
    expect(statusContent).toContain('complete');
  });

  it('should complete in less than 30 minutes (performance test)', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    const startTime = Date.now();
    await executor.execute(projectRoot, { yoloMode: true });
    const endTime = Date.now();

    const executionTime = endTime - startTime;
    const thirtyMinutes = 30 * 60 * 1000;

    expect(executionTime).toBeLessThan(thirtyMinutes);
  });

  it('should keep escalations under target (<3)', async () => {
    const executor = new PRDWorkflowExecutor(
      mockAgentPool,
      mockDecisionEngine,
      mockEscalationQueue,
      mockStateManager
    );

    const workflowPath = path.join(bmadDir, 'workflow.yaml');
    await executor.loadWorkflowConfig(workflowPath);

    const result = await executor.execute(projectRoot, { yoloMode: true });

    expect(result.escalationsCount).toBeLessThan(3);
  });

  // ====================
  // Story 2.7: PRDValidator Integration Tests
  // ====================
  describe('PRDValidator Integration (Story 2.7)', () => {
    it('should validate generated PRD after template processing', async () => {
      // Create a valid PRD
      const validPRD = `# Product Requirements Document

## Executive Summary
Comprehensive overview of the agent orchestrator system.

## Success Criteria
- PRD generated in <30 minutes
- Completeness score >85%
- <3 escalations per workflow

## MVP Scope
- User authentication with JWT
- Agent pool management
- Workflow execution engine

## Functional Requirements

### FR-001: Authentication
**Statement**: System shall authenticate users via JWT tokens with 24-hour expiry.
**Acceptance Criteria**:
- User receives valid JWT on successful login
- Token expires after 24 hours
- Invalid tokens rejected with 401 error

### FR-002: Agent Pool
**Statement**: System shall spawn agents with configurable LLM providers.
**Acceptance Criteria**:
- Agents spawned with OpenAI, Anthropic, or local LLMs
- Agent pool maintains max capacity limit
- Failed spawns retried with exponential backoff

## Success Metrics
- 100 active users in first month
- <2s response time for 95th percentile
- >85% completeness score on all PRDs
`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, validPRD);

      // Create validator with mock StateManager that can read the file
      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(validPRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);
      const result = await validator.validate(prdPath);

      // Should pass quality gate
      expect(result.passesQualityGate).toBe(true);
      expect(result.completenessScore).toBeGreaterThanOrEqual(85);
      expect(result.sectionsPresent).toContain('Executive Summary');
      expect(result.sectionsPresent).toContain('Success Criteria');
      expect(result.sectionsPresent).toContain('MVP Scope');
      expect(result.sectionsPresent).toContain('Functional Requirements');
      expect(result.requirementsCount).toBeGreaterThan(0);
    });

    it('should fail quality gate for incomplete PRD (missing sections)', async () => {
      const incompletePRD = `# Product Requirements Document

## Executive Summary
Brief overview.

## Functional Requirements

### FR-001: Feature
**Statement**: System shall handle feature.
**Acceptance Criteria**:
- Feature works
`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, incompletePRD);

      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(incompletePRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);
      const result = await validator.validate(prdPath);

      // Should fail quality gate (missing sections + vague requirements)
      expect(result.passesQualityGate).toBe(false);
      expect(result.completenessScore).toBeLessThan(85);
      expect(result.sectionsMissing.length).toBeGreaterThan(0);
    });

    it('should fail quality gate for PRD with vague requirements', async () => {
      const vaguePRD = `# Product Requirements Document

## Executive Summary
Overview provided.

## Success Criteria
- System should perform well
- Users should be happy

## MVP Scope
- Handle user authentication
- Manage data processing
- Support file uploads

## Functional Requirements

### FR-001: Authentication
**Statement**: System shall handle authentication.
**Acceptance Criteria**:
- Auth works

### FR-002: Data
**Statement**: System shall manage user data.
**Acceptance Criteria**:
- Data handled properly

## Success Metrics
- Metrics improve
`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, vaguePRD);

      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(vaguePRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);
      const result = await validator.validate(prdPath);

      // Should fail due to vague requirements and subjective criteria
      expect(result.passesQualityGate).toBe(false);
      expect(result.clarityIssues.length).toBeGreaterThan(0);

      const highSeverityIssues = result.clarityIssues.filter(
        issue => issue.severity === 'high'
      );
      expect(highSeverityIssues.length).toBeGreaterThan(0);
    });

    it('should detect contradictions in PRD', async () => {
      const contradictoryPRD = `# Product Requirements Document

## Executive Summary
System will be a lightweight microservice architecture.

## Success Criteria
- System deployed as monolithic application
- Response time <100ms

## MVP Scope
- Stateless REST API

## Functional Requirements

### FR-001: Session
**Statement**: System shall use JWT for stateless authentication.
**Acceptance Criteria**:
- Server maintains session state in database

### FR-002: Database
**Statement**: System shall use NoSQL database.
**Acceptance Criteria**:
- All data stored in PostgreSQL

## Success Metrics
- Zero downtime during deployments
`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, contradictoryPRD);

      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(contradictoryPRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);
      const result = await validator.validate(prdPath);

      // Should detect contradictions
      expect(result.contradictions.length).toBeGreaterThan(0);
      expect(result.passesQualityGate).toBe(false);
    });

    it('should identify gaps in requirements', async () => {
      const gappyPRD = `# Product Requirements Document

## Executive Summary
Overview.

## Success Criteria
- Criterion 1

## MVP Scope
- Feature A

## Functional Requirements

### FR-001: User Login
**Statement**: System shall authenticate users.
**Acceptance Criteria**:
- Users can log in

### FR-002: File Upload
**Statement**: System shall process uploaded files.
**Acceptance Criteria**:
- Files are processed

## Success Metrics
- Metric 1
`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, gappyPRD);

      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(gappyPRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);
      const result = await validator.validate(prdPath);

      // Should identify gaps (missing error handling, security details, etc.)
      expect(result.gaps.length).toBeGreaterThan(0);

      // Should find security gap for authentication
      const securityGaps = result.gaps.filter(gap =>
        gap.toLowerCase().includes('security')
      );
      expect(securityGaps.length).toBeGreaterThan(0);

      // Should find error handling gaps
      const errorGaps = result.gaps.filter(gap =>
        gap.toLowerCase().includes('error')
      );
      expect(errorGaps.length).toBeGreaterThan(0);
    });

    it('should provide actionable feedback for regeneration when score <85%', async () => {
      const lowQualityPRD = `# Product Requirements Document

## Executive Summary
Brief text.

## Functional Requirements

### FR-001: Feature
**Statement**: System shall handle the feature.
**Acceptance Criteria**:
- Works
`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, lowQualityPRD);

      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(lowQualityPRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);
      const result = await validator.validate(prdPath);

      expect(result.completenessScore).toBeLessThan(85);
      expect(result.passesQualityGate).toBe(false);

      // Should provide actionable feedback
      const hasActionableFeedback =
        result.sectionsMissing.length > 0 ||
        result.gaps.length > 0 ||
        result.clarityIssues.length > 0;

      expect(hasActionableFeedback).toBe(true);

      // Feedback should be specific
      if (result.sectionsMissing.length > 0) {
        result.sectionsMissing.forEach(section => {
          expect(section).toBeDefined();
          expect(section.length).toBeGreaterThan(0);
        });
      }

      if (result.clarityIssues.length > 0) {
        result.clarityIssues.forEach(issue => {
          expect(issue.section).toBeDefined();
          expect(issue.issue).toBeDefined();
          expect(issue.severity).toMatch(/high|medium|low/);
        });
      }
    });

    it('should complete validation in reasonable time (<5 seconds)', async () => {
      const largePRD = `# Product Requirements Document\n\n` +
        `## Executive Summary\n${'Text. '.repeat(1000)}\n\n` +
        `## Success Criteria\n${'- Criterion\n'.repeat(100)}\n\n` +
        `## MVP Scope\n${'- Feature\n'.repeat(100)}\n\n` +
        `## Functional Requirements\n` +
        Array.from({ length: 100 }, (_, i) => `
### FR-${String(i + 1).padStart(3, '0')}: Feature ${i + 1}
**Statement**: System shall provide feature ${i + 1}.
**Acceptance Criteria**:
- Criterion 1
- Criterion 2
        `).join('\n') +
        `\n## Success Metrics\n${'- Metric\n'.repeat(50)}`;

      const prdPath = path.join(docsDir, 'PRD.md');
      await fs.writeFile(prdPath, largePRD);

      const mockStateManagerWithReadFile = {
        ...mockStateManager,
        readFile: vi.fn().mockResolvedValue(largePRD),
      } as any;

      const validator = new PRDValidator(mockStateManagerWithReadFile);

      const startTime = Date.now();
      const result = await validator.validate(prdPath);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // <5 seconds
    });
  });
});
