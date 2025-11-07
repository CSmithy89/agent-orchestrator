/**
 * PRD Workflow Integration Tests
 * Tests full workflow execution with Mary, John, and DecisionEngine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PRDWorkflowExecutor } from '../../src/core/workflows/prd-workflow-executor.js';
import { AgentPool } from '../../src/core/AgentPool.js';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../src/core/services/escalation-queue.js';
import { StateManager } from '../../src/core/StateManager.js';
import { MaryAgent } from '../../src/core/agents/mary-agent.js';
import { JohnAgent } from '../../src/core/agents/john-agent.js';

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
      spawn: vi.fn().mockImplementation((agentType: string) => {
        if (agentType === 'mary') {
          return Promise.resolve({
            analyzeRequirements: vi.fn().mockResolvedValue({
              requirementsList: ['Req 1', 'Req 2'],
              confidence: 0.85
            })
          });
        }
        if (agentType === 'john') {
          return Promise.resolve({
            defineProductVision: vi.fn().mockResolvedValue({
              vision: 'Test vision',
              confidence: 0.88
            })
          });
        }
        throw new Error(`Unknown agent: ${agentType}`);
      }),
      destroy: vi.fn().mockResolvedValue(undefined)
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
    expect(mockAgentPool.spawn).toHaveBeenCalledWith('mary', expect.any(Object));
    expect(mockAgentPool.spawn).toHaveBeenCalledWith('john', expect.any(Object));

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
    const maryCall = (mockAgentPool.spawn as any).mock.calls.find((c: any) => c[0] === 'mary');
    const johnCall = (mockAgentPool.spawn as any).mock.calls.find((c: any) => c[0] === 'john');

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
});
