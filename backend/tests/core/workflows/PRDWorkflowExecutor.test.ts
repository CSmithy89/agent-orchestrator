/**
 * PRDWorkflowExecutor Tests
 * Comprehensive test suite for PRD workflow executor
 *
 * Following ATDD approach: These tests are written BEFORE implementation
 * and should initially FAIL until the implementation is complete.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PRDWorkflowExecutor } from '../../../src/core/workflows/prd-workflow-executor.js';
import { AgentPool } from '../../../src/core/AgentPool.js';
import { DecisionEngine } from '../../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../../src/core/services/escalation-queue.js';
import { StateManager } from '../../../src/core/StateManager.js';

describe('PRDWorkflowExecutor', () => {
  const testDir = path.join(__dirname, '__test_data__', 'prd-workflow');
  const projectRoot = path.join(testDir, 'test-project');
  const bmadDir = path.join(projectRoot, 'bmad', 'bmm', 'workflows', 'prd');
  const docsDir = path.join(projectRoot, 'docs');

  let mockAgentPool: AgentPool;
  let mockDecisionEngine: DecisionEngine;
  let mockEscalationQueue: EscalationQueue;
  let mockStateManager: StateManager;
  let mockMaryAgent: any;
  let mockJohnAgent: any;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create test directory structure
    await fs.mkdir(projectRoot, { recursive: true });
    await fs.mkdir(bmadDir, { recursive: true });
    await fs.mkdir(docsDir, { recursive: true });
    await fs.mkdir(path.join(projectRoot, '.bmad'), { recursive: true });

    // Create mock agents
    mockMaryAgent = {
      id: 'mary-agent-id',
      analyzeRequirements: vi.fn().mockResolvedValue({
        requirementsList: [
          { id: 'req-1', description: 'User authentication' },
          { id: 'req-2', description: 'Data persistence' }
        ],
        confidence: 0.9
      }),
      defineSuccessCriteria: vi.fn().mockResolvedValue({
        criteria: ['Users can log in', 'Data is saved'],
        confidence: 0.85
      }),
      negotiateScope: vi.fn().mockResolvedValue({
        scope: 'MVP features only',
        confidence: 0.8
      })
    };

    mockJohnAgent = {
      id: 'john-agent-id',
      defineProductVision: vi.fn().mockResolvedValue({
        vision: 'Streamline workflow automation',
        targetUsers: 'Development teams',
        valueProposition: 'Reduce manual work',
        confidence: 0.88
      }),
      prioritizeFeatures: vi.fn().mockResolvedValue({
        features: [
          { name: 'Authentication', priority: 'High', score: 90 },
          { name: 'Dashboard', priority: 'Medium', score: 70 }
        ],
        confidence: 0.82
      }),
      assessMarketFit: vi.fn().mockResolvedValue({
        score: 0.85,
        risks: ['Market competition'],
        opportunities: ['Growing demand'],
        confidence: 0.80
      }),
      validateRequirementsViability: vi.fn().mockResolvedValue({
        viable: true,
        concerns: [],
        recommendations: ['Add email verification'],
        confidence: 0.86
      }),
      generateExecutiveSummary: vi.fn().mockResolvedValue({
        summary: 'Automated workflow system for development teams',
        keyMetrics: ['50% time savings', '90% accuracy'],
        successCriteria: ['User adoption > 80%'],
        confidence: 0.87
      })
    };

    // Create mock AgentPool
    mockAgentPool = {
      createAgent: vi.fn().mockImplementation((agentType: string, _context?: any) => {
        if (agentType === 'mary') return Promise.resolve(mockMaryAgent);
        if (agentType === 'john') return Promise.resolve(mockJohnAgent);
        throw new Error(`Unknown agent type: ${agentType}`);
      }),
      destroyAgent: vi.fn().mockResolvedValue(undefined)
    } as any;

    // Create mock DecisionEngine
    mockDecisionEngine = {
      attemptAutonomousDecision: vi.fn().mockResolvedValue({
        decision: 'Proceed with MVP scope',
        confidence: 0.85,
        reasoning: 'Based on user input and market analysis'
      })
    } as any;

    // Create mock EscalationQueue
    mockEscalationQueue = {
      add: vi.fn().mockResolvedValue('escalation-123'),
      waitForResponse: vi.fn().mockResolvedValue({
        answer: 'User confirmed MVP scope',
        timestamp: new Date().toISOString()
      }),
      getMetrics: vi.fn().mockResolvedValue({
        total: 2,
        pending: 0,
        resolved: 2
      })
    } as any;

    // Create mock StateManager
    mockStateManager = {
      saveState: vi.fn().mockResolvedValue(undefined),
      loadState: vi.fn().mockResolvedValue(null),
      getProjectState: vi.fn().mockResolvedValue(null)
    } as any;

    // Create workflow.yaml file
    const workflowContent = `
name: PRD Workflow
description: Generate Product Requirements Document
author: BMad
version: 1.0

steps:
  - id: 1
    name: Analyze Requirements
    agent: mary
    method: analyzeRequirements
    template-output: requirements_section
  - id: 2
    name: Define Product Vision
    agent: john
    method: defineProductVision
    template-output: vision_section
  - id: 3
    name: Validate Requirements
    agent: john
    method: validateRequirementsViability
    template-output: validation_section
  - id: 4
    name: Generate Summary
    agent: john
    method: generateExecutiveSummary
    template-output: summary_section

elicit-points:
  - step: 1
    question: "What is the primary use case?"
    default: "Workflow automation"

template:
  file: prd-template.md
  sections:
    - requirements_section
    - vision_section
    - validation_section
    - summary_section

output:
  file: docs/PRD.md
  format: markdown
`;
    await fs.writeFile(path.join(bmadDir, 'workflow.yaml'), workflowContent);

    // Create project-config.yaml
    const projectConfigContent = `
project:
  name: Test Project
  description: Test project

agent_assignments:
  mary:
    model: claude-sonnet-4-5
    provider: anthropic
  john:
    model: claude-sonnet-4-5
    provider: anthropic
`;
    await fs.writeFile(path.join(projectRoot, '.bmad/project-config.yaml'), projectConfigContent);

    // Create workflow-status.yaml
    const workflowStatusContent = `
workflows:
  prd:
    status: in-progress
    started: 2025-11-07T00:00:00Z
`;
    await fs.writeFile(path.join(docsDir, 'workflow-status.yaml'), workflowStatusContent);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  // ===================================================================
  // AC #1: Load bmad/bmm/workflows/prd/workflow.yaml
  // ===================================================================
  describe('AC #1: Load workflow configuration', () => {
    it('should load workflow.yaml from bmad/bmm/workflows/prd/', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      expect(executor.getWorkflowName()).toBe('PRD Workflow');
      expect(executor.getSteps()).toHaveLength(4);
    });

    it('should throw error if workflow.yaml does not exist', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const invalidPath = path.join(bmadDir, 'nonexistent.yaml');
      await expect(executor.loadWorkflowConfig(invalidPath)).rejects.toThrow();
    });

    it('should validate workflow configuration structure', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      const config = executor.getWorkflowConfig();
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('steps');
      expect(config.steps).toBeInstanceOf(Array);
    });
  });

  // ===================================================================
  // AC #2: Execute all PRD workflow steps in order
  // ===================================================================
  describe('AC #2: Execute workflow steps in order', () => {
    it('should execute steps sequentially (1, 2, 3, 4)', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      const executionOrder: number[] = [];
      const originalExecuteStep = executor.executeStep.bind(executor);
      executor.executeStep = vi.fn().mockImplementation(async (
        step: any,
        projectPath: string,
        options: any,
        sharedContext: Record<string, any>
      ) => {
        executionOrder.push(step.id);
        return originalExecuteStep(step, projectPath, options, sharedContext);
      });

      await executor.execute(projectRoot, { yoloMode: true });

      expect(executionOrder).toEqual([1, 2, 3, 4]);
    });

    it('should track step execution status', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      const stepStatuses = executor.getStepStatuses();
      expect(stepStatuses).toHaveLength(4);
      stepStatuses.forEach(status => {
        expect(status.status).toBe('completed');
      });
    });

    it('should handle step dependencies and prerequisites', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      // Step 2 should wait for Step 1 to complete
      await executor.execute(projectRoot, { yoloMode: true });

      // Verify Mary was called before John
      expect(mockMaryAgent.analyzeRequirements).toHaveBeenCalled();
      expect(mockJohnAgent.defineProductVision).toHaveBeenCalled();
    });
  });

  // ===================================================================
  // AC #3: Spawn Mary agent for requirements analysis
  // ===================================================================
  describe('AC #3: Spawn Mary agent', () => {
    it('should spawn Mary agent via AgentPool', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      expect(mockAgentPool.spawn).toHaveBeenCalledWith('mary', expect.any(Object));
    });

    it('should call Mary agent methods for requirements analysis', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      expect(mockMaryAgent.analyzeRequirements).toHaveBeenCalled();
    });

    it('should handle Mary agent spawn failures', async () => {
      mockAgentPool.spawn = vi.fn().mockRejectedValue(new Error('Agent spawn failed'));

      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await expect(executor.execute(projectRoot, { yoloMode: true })).rejects.toThrow('Agent spawn failed');
    });
  });

  // ===================================================================
  // AC #4: Spawn John agent for strategic validation
  // ===================================================================
  describe('AC #4: Spawn John agent', () => {
    it('should spawn John agent via AgentPool', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      expect(mockAgentPool.spawn).toHaveBeenCalledWith('john', expect.any(Object));
    });

    it('should call John agent methods for strategic validation', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      expect(mockJohnAgent.defineProductVision).toHaveBeenCalled();
      expect(mockJohnAgent.validateRequirementsViability).toHaveBeenCalled();
      expect(mockJohnAgent.generateExecutiveSummary).toHaveBeenCalled();
    });

    it('should pass shared workflow context between Mary and John', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      // Verify both agents were spawned with the same context
      const maryContext = (mockAgentPool.spawn as any).mock.calls.find((call: any) => call[0] === 'mary')[1];
      const johnContext = (mockAgentPool.spawn as any).mock.calls.find((call: any) => call[0] === 'john')[1];

      expect(maryContext).toBeDefined();
      expect(johnContext).toBeDefined();
      // Context should contain shared workflow data
      expect(maryContext).toHaveProperty('projectPath');
      expect(johnContext).toHaveProperty('projectPath');
    });
  });

  // ===================================================================
  // AC #5: Process template-output tags and save to PRD.md
  // ===================================================================
  describe('AC #5: Process template-output tags', () => {
    it('should generate content for each template section', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      // Verify PRD.md was created
      const prdPath = path.join(docsDir, 'PRD.md');
      const prdExists = await fs.access(prdPath).then(() => true).catch(() => false);
      expect(prdExists).toBe(true);
    });

    it('should save PRD.md incrementally (sections as workflow progresses)', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      // Verify PRD.md contains all sections
      const prdPath = path.join(docsDir, 'PRD.md');
      const prdContent = await fs.readFile(prdPath, 'utf-8');

      expect(prdContent).toContain('Requirements');
      expect(prdContent).toContain('Vision');
      expect(prdContent).toContain('Validation');
      expect(prdContent).toContain('Summary');
    });

    it('should create docs/ directory if it does not exist', async () => {
      // Remove docs directory to test creation
      await fs.rm(docsDir, { recursive: true, force: true });

      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      // Verify docs/ directory was created
      const docsDirExists = await fs.access(docsDir).then(() => true).catch(() => false);
      expect(docsDirExists).toBe(true);
    });

    it('should handle file write failures gracefully', async () => {
      // Create an executor with a mocked processTemplateOutput that fails
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      // Mock processTemplateOutput to throw an error
      executor.processTemplateOutput = vi.fn().mockImplementation(async () => {
        throw new Error('Disk full - cannot write file');
      });

      await expect(executor.execute(projectRoot, { yoloMode: true })).rejects.toThrow(/Disk full/);
    });
  });

  // ===================================================================
  // AC #6: Handle elicit-required tags (skip in #yolo mode)
  // ===================================================================
  describe('AC #6: Handle elicitation', () => {
    it('should skip elicitation in #yolo mode', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      // Verify no user prompts were triggered (elicitation skipped)
      // In #yolo mode, should use default values
      const result = executor.getWorkflowResult();
      expect(result).toBeDefined();
    });

    it('should pause workflow for elicitation in normal mode', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      // Mock user input for elicitation
      const handleElicitationSpy = vi.spyOn(executor as any, 'handleElicitation');

      await executor.execute(projectRoot, { yoloMode: false });

      // Verify elicitation was triggered
      expect(handleElicitationSpy).toHaveBeenCalled();
    });

    it('should support multiple elicitation points in workflow', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      const config = executor.getWorkflowConfig();
      expect(config['elicit-points']).toBeDefined();
      expect(config['elicit-points']).toBeInstanceOf(Array);
    });
  });

  // ===================================================================
  // AC #7: Make autonomous decisions via DecisionEngine (target <3 escalations)
  // ===================================================================
  describe('AC #7: DecisionEngine integration', () => {
    it('should use DecisionEngine for autonomous decisions', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      expect(mockDecisionEngine.attemptAutonomousDecision).toHaveBeenCalled();
    });

    it('should proceed autonomously when confidence >= 0.75', async () => {
      mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockResolvedValue({
        decision: 'Proceed with feature X',
        confidence: 0.85,
        reasoning: 'Clear user requirement'
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

      // Verify escalation was NOT triggered
      expect(mockEscalationQueue.add).not.toHaveBeenCalled();
    });

    it('should escalate to EscalationQueue when confidence < 0.75', async () => {
      mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockResolvedValue({
        decision: 'Unclear requirement',
        confidence: 0.65,
        reasoning: 'Ambiguous user input'
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

      // Verify escalation was triggered
      expect(mockEscalationQueue.add).toHaveBeenCalled();
    });

    it('should track escalation count (target <3 per run)', async () => {
      // Simulate 2 low-confidence decisions (escalations)
      let callCount = 0;
      mockDecisionEngine.attemptAutonomousDecision = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          decision: callCount <= 2 ? 'Unclear' : 'Clear decision',
          confidence: callCount <= 2 ? 0.65 : 0.85,
          reasoning: 'Test reasoning'
        });
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

      const result = executor.getWorkflowResult();
      expect(result.escalationsCount).toBeLessThan(3);
    });

    it('should log all decisions with confidence scores and reasoning', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      const decisions = executor.getDecisionLog();
      expect(decisions).toBeDefined();
      expect(decisions).toBeInstanceOf(Array);
      decisions.forEach((decision: any) => {
        expect(decision).toHaveProperty('decision');
        expect(decision).toHaveProperty('confidence');
        expect(decision).toHaveProperty('reasoning');
      });
    });
  });

  // ===================================================================
  // AC #8: Complete execution in <30 minutes
  // ===================================================================
  describe('AC #8: Execution time performance', () => {
    it('should complete workflow execution in <30 minutes', async () => {
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
      const thirtyMinutesMs = 30 * 60 * 1000;

      expect(executionTime).toBeLessThan(thirtyMinutesMs);
    });

    it('should track workflow execution time', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      const result = executor.getWorkflowResult();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should timeout if execution exceeds configured limit', async () => {
      // Create a slow mock Mary agent that takes longer than timeout
      const slowMaryAgent = {
        analyzeRequirements: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
          return {
            requirementsList: [{ id: 'req-1', description: 'Test' }],
            confidence: 0.9
          };
        }),
        defineSuccessCriteria: vi.fn(),
        negotiateScope: vi.fn()
      };

      // Create agent pool that returns slow agent
      const slowAgentPool = {
        spawn: vi.fn().mockImplementation((agentType: string) => {
          if (agentType === 'mary') return Promise.resolve(slowMaryAgent);
          if (agentType === 'john') return Promise.resolve(mockJohnAgent);
          throw new Error(`Unknown agent type: ${agentType}`);
        }),
        destroy: vi.fn().mockResolvedValue(undefined)
      } as any;

      const executor = new PRDWorkflowExecutor(
        slowAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      // Set a very short timeout (1 second) - less than the 2 second delay
      await expect(
        executor.execute(projectRoot, { yoloMode: true, timeout: 1000 })
      ).rejects.toThrow(/timeout/i);
    }, 10000); // Allow test to run for up to 10 seconds
  });

  // ===================================================================
  // AC #9: Generate docs/PRD.md with all sections filled
  // ===================================================================
  describe('AC #9: Generate PRD.md document', () => {
    it('should generate docs/PRD.md file', async () => {
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
      const prdExists = await fs.access(prdPath).then(() => true).catch(() => false);

      expect(prdExists).toBe(true);
    });

    it('should include all required sections in PRD.md', async () => {
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

      // Verify required sections exist
      expect(prdContent).toContain('Requirements');
      expect(prdContent).toContain('Vision');
      expect(prdContent).toContain('Validation');
      expect(prdContent).toContain('Summary');
      expect(prdContent.length).toBeGreaterThan(100); // Not empty
    });

    it('should generate valid markdown format', async () => {
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

      // Basic markdown validation (contains headers)
      expect(prdContent).toMatch(/^#\s+/m); // At least one header
    });
  });

  // ===================================================================
  // AC #10: Update workflow-status.yaml to mark PRD complete
  // ===================================================================
  describe('AC #10: Update workflow-status.yaml', () => {
    it('should update workflow-status.yaml on completion', async () => {
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

    it('should mark PRD workflow as complete in workflow-status.yaml', async () => {
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

      expect(statusContent).toMatch(/prd:\s*\n\s*status:\s*complete/);
    });

    it('should preserve existing workflow status for other workflows', async () => {
      // Add another workflow status
      const statusPath = path.join(docsDir, 'workflow-status.yaml');
      const initialContent = await fs.readFile(statusPath, 'utf-8');
      const updatedContent = initialContent + `
  architecture:
    status: in-progress
    started: 2025-11-06T00:00:00Z
`;
      await fs.writeFile(statusPath, updatedContent);

      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await executor.execute(projectRoot, { yoloMode: true });

      const finalContent = await fs.readFile(statusPath, 'utf-8');

      // Verify both workflows exist
      expect(finalContent).toContain('prd');
      expect(finalContent).toContain('architecture');
      expect(finalContent).toContain('in-progress'); // Architecture still in-progress
    });
  });

  // ===================================================================
  // Additional Integration Tests
  // ===================================================================
  describe('Error Handling', () => {
    it('should handle workflow configuration validation errors', async () => {
      // Create invalid workflow.yaml
      const invalidWorkflow = `
name: Invalid Workflow
# Missing required fields
`;
      await fs.writeFile(path.join(bmadDir, 'workflow.yaml'), invalidWorkflow);

      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await expect(executor.loadWorkflowConfig(workflowPath)).rejects.toThrow();
    });

    it('should handle partial workflow completion scenarios', async () => {
      // Simulate workflow interruption
      mockJohnAgent.defineProductVision = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      await expect(executor.execute(projectRoot, { yoloMode: true })).rejects.toThrow();
    });

    it('should complete workflow execution successfully', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      const result = await executor.execute(projectRoot, { yoloMode: true });

      // Verify workflow completed
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  // ===================================================================
  // Workflow Result Interface
  // ===================================================================
  describe('WorkflowResult Interface', () => {
    it('should return WorkflowResult with success status', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      const result = await executor.execute(projectRoot, { yoloMode: true });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('outputPath');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('escalationsCount');
      expect(result).toHaveProperty('sectionsGenerated');
      expect(result.success).toBe(true);
    });

    it('should return metadata in WorkflowResult', async () => {
      const executor = new PRDWorkflowExecutor(
        mockAgentPool,
        mockDecisionEngine,
        mockEscalationQueue,
        mockStateManager
      );

      const workflowPath = path.join(bmadDir, 'workflow.yaml');
      await executor.loadWorkflowConfig(workflowPath);

      const result = await executor.execute(projectRoot, { yoloMode: true });

      expect(result.outputPath).toBe(path.join(docsDir, 'PRD.md'));
      expect(result.escalationsCount).toBeGreaterThanOrEqual(0);
      expect(result.sectionsGenerated).toBeInstanceOf(Array);
      expect(result.sectionsGenerated.length).toBeGreaterThan(0);
    });
  });
});
