/**
 * PRDWorkflowExecutor - Execute PRD workflow with autonomous decision making
 * Orchestrates Mary and John agents to generate complete PRD documents
 *
 * Story 2.5: PRD Workflow Executor
 * AC: Load workflow.yaml, execute steps in order, spawn agents, process templates,
 * handle elicitation, make autonomous decisions, complete in <30min, generate PRD.md,
 * update workflow-status.yaml
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AgentPool } from '../AgentPool.js';
import { DecisionEngine } from '../services/decision-engine.js';
import { EscalationQueue } from '../services/escalation-queue.js';
import { StateManager } from '../StateManager.js';
import { WorkflowExecutionError } from '../../types/errors.types.js';

/**
 * Workflow configuration interface
 */
export interface WorkflowConfig {
  name: string;
  description: string;
  author?: string;
  version?: string;
  steps: WorkflowStep[];
  'elicit-points'?: ElicitPoint[];
  template?: {
    file: string;
    sections: string[];
  };
  output?: {
    file: string;
    format: string;
  };
  [key: string]: any;
}

/**
 * Workflow step interface
 */
export interface WorkflowStep {
  id: number;
  name: string;
  agent?: string;
  method?: string;
  'template-output'?: string;
  condition?: string;
  [key: string]: any;
}

/**
 * Elicitation point interface
 */
export interface ElicitPoint {
  step: number;
  question: string;
  default: string;
}

/**
 * Execution options interface
 */
export interface ExecutionOptions {
  yoloMode?: boolean;
  maxEscalations?: number;
  timeout?: number;
}

/**
 * Workflow result interface
 */
export interface WorkflowResult {
  success: boolean;
  outputPath: string;
  executionTime: number;
  escalationsCount: number;
  sectionsGenerated: string[];
  errors?: string[];
}

/**
 * Step result interface
 */
export interface StepResult {
  stepId: number;
  status: 'completed' | 'failed' | 'skipped';
  output?: any;
  error?: Error;
}

/**
 * Step status interface
 */
export interface StepStatus {
  stepId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

/**
 * Decision context interface
 */
export interface DecisionContext {
  currentStep: number;
  stepName: string;
  question: string;
  [key: string]: any;
}

/**
 * Elicit configuration interface
 */
export interface ElicitConfig {
  question: string;
  default: string;
}

/**
 * Elicit result interface
 */
export interface ElicitResult {
  answer: string;
  timestamp: string;
}

/**
 * Decision interface
 */
export interface WorkflowDecision {
  decision: string;
  confidence: number;
  reasoning: string;
}

/**
 * Agent context interface for workflow executor
 */
export interface AgentContext {
  projectPath: string;
  workflowConfig: WorkflowConfig;
  sharedData: Record<string, any>;
  // Additional fields required by AgentPool
  onboardingDocs: string[];
  workflowState: Record<string, unknown>;
  taskDescription: string;
}

/**
 * PRDWorkflowExecutor class
 * Executes PRD workflow by orchestrating Mary and John agents
 */
export class PRDWorkflowExecutor {
  private agentPool: AgentPool;
  private decisionEngine: DecisionEngine;
  private escalationQueue: EscalationQueue;
  // @ts-expect-error - Reserved for future use
  private _stateManager: StateManager; // Future work: workflow state persistence
  private workflowConfig?: WorkflowConfig;
  private stepStatuses: StepStatus[] = [];
  private decisionLog: WorkflowDecision[] = [];
  private escalationsCount: number = 0;
  private startTime: number = 0;
  private endTime: number = 0;
  private spawnedAgents: Map<string, any> = new Map();
  private workflowResult?: WorkflowResult;
  private sectionsGenerated: string[] = [];

  /**
   * Create a new PRDWorkflowExecutor instance
   * @param agentPool AgentPool for spawning Mary and John agents
   * @param decisionEngine DecisionEngine for autonomous decision making
   * @param escalationQueue EscalationQueue for low-confidence decision escalation
   * @param stateManager StateManager for workflow state persistence
   */
  constructor(
    agentPool: AgentPool,
    decisionEngine: DecisionEngine,
    escalationQueue: EscalationQueue,
    stateManager: StateManager
  ) {
    this.agentPool = agentPool;
    this.decisionEngine = decisionEngine;
    this.escalationQueue = escalationQueue;
    this._stateManager = stateManager;
  }

  /**
   * Load workflow configuration from YAML file
   * AC #1: Load bmad/bmm/workflows/prd/workflow.yaml
   *
   * @param workflowPath Path to workflow.yaml file
   */
  async loadWorkflowConfig(workflowPath: string): Promise<void> {
    try {
      // Read workflow.yaml file
      const fileContent = await fs.readFile(workflowPath, 'utf-8');

      // Parse YAML
      const config = yaml.load(fileContent) as WorkflowConfig;

      // Validate configuration
      if (!config.name) {
        throw new WorkflowExecutionError('Workflow configuration missing required field: name');
      }

      if (!config.steps || !Array.isArray(config.steps)) {
        throw new WorkflowExecutionError('Workflow configuration missing required field: steps');
      }

      this.workflowConfig = config;

      // Initialize step statuses
      this.stepStatuses = config.steps.map(step => ({
        stepId: step.id,
        status: 'pending'
      }));

      console.log(`[PRDWorkflowExecutor] Loaded workflow: ${config.name}`);
      console.log(`[PRDWorkflowExecutor] Steps: ${config.steps.length}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new WorkflowExecutionError(`Workflow file not found: ${workflowPath}`);
      }
      throw new WorkflowExecutionError(`Failed to load workflow configuration: ${error.message}`);
    }
  }

  /**
   * Execute the PRD workflow
   * AC #2: Execute all PRD workflow steps in order
   * AC #8: Complete execution in <30 minutes
   *
   * @param projectPath Path to project root directory
   * @param options Execution options (yoloMode, maxEscalations, timeout)
   * @returns WorkflowResult with success status and metadata
   */
  async execute(projectPath: string, options: ExecutionOptions = {}): Promise<WorkflowResult> {
    this.startTime = Date.now();

    try {
      // Validate workflow is loaded
      if (!this.workflowConfig) {
        throw new WorkflowExecutionError('Workflow configuration not loaded. Call loadWorkflowConfig() first.');
      }

      console.log(`[PRDWorkflowExecutor] Starting workflow execution`);
      console.log(`[PRDWorkflowExecutor] Project: ${projectPath}`);
      console.log(`[PRDWorkflowExecutor] YOLO mode: ${options.yoloMode || false}`);

      // Set up timeout if specified
      const timeout = options.timeout || 30 * 60 * 1000; // Default: 30 minutes
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new WorkflowExecutionError('Workflow execution timeout exceeded'));
        }, timeout);
      });

      // Execute workflow with timeout
      const executionPromise = this.executeWorkflowSteps(projectPath, options);
      await Promise.race([executionPromise, timeoutPromise]);

      // Update workflow-status.yaml
      await this.completeWorkflow(projectPath);

      this.endTime = Date.now();
      const executionTime = this.endTime - this.startTime;

      // Build workflow result
      this.workflowResult = {
        success: true,
        outputPath: path.join(projectPath, 'docs', 'PRD.md'),
        executionTime,
        escalationsCount: this.escalationsCount,
        sectionsGenerated: this.sectionsGenerated
      };

      console.log(`[PRDWorkflowExecutor] Workflow completed successfully`);
      console.log(`[PRDWorkflowExecutor] Execution time: ${(executionTime / 1000).toFixed(2)}s`);
      console.log(`[PRDWorkflowExecutor] Escalations: ${this.escalationsCount}`);

      return this.workflowResult;
    } catch (error: any) {
      this.endTime = Date.now();
      const executionTime = this.endTime - this.startTime;

      // Build error result
      this.workflowResult = {
        success: false,
        outputPath: '',
        executionTime,
        escalationsCount: this.escalationsCount,
        sectionsGenerated: this.sectionsGenerated,
        errors: [error.message]
      };

      console.error(`[PRDWorkflowExecutor] Workflow execution failed: ${error.message}`);
      throw error;
    } finally {
      // Clean up agents
      await this.cleanupAgents();
    }
  }

  /**
   * Execute workflow steps sequentially
   * @private
   */
  private async executeWorkflowSteps(projectPath: string, options: ExecutionOptions): Promise<void> {
    if (!this.workflowConfig) {
      throw new WorkflowExecutionError('Workflow configuration not loaded');
    }

    // Create shared workflow context
    const sharedContext: Record<string, any> = {};

    // Execute each step in order (AC #2)
    for (const step of this.workflowConfig.steps) {
      console.log(`\n[PRDWorkflowExecutor] Executing Step ${step.id}: ${step.name}`);

      // Update step status to running
      const stepStatus = this.stepStatuses.find(s => s.stepId === step.id);
      if (stepStatus) {
        stepStatus.status = 'running';
        stepStatus.startTime = Date.now();
      }

      // Execute step
      const result = await this.executeStep(step, projectPath, options, sharedContext);

      // Update step status
      if (stepStatus) {
        stepStatus.status = result.status === 'completed' ? 'completed' : 'failed';
        stepStatus.endTime = Date.now();
      }

      // Store step output in shared context
      if (result.output) {
        sharedContext[`step_${step.id}_output`] = result.output;
      }

      // Handle failed step
      if (result.status === 'failed') {
        throw new WorkflowExecutionError(
          `Step ${step.id} (${step.name}) failed: ${result.error?.message}`,
          step.id
        );
      }
    }
  }

  /**
   * Execute a single workflow step
   * AC #2: Execute all PRD workflow steps in order
   * AC #3: Spawn Mary agent for requirements analysis
   * AC #4: Spawn John agent for strategic validation
   *
   * @param step Workflow step to execute
   * @param projectPath Project root path
   * @param options Execution options
   * @param sharedContext Shared context between steps
   * @returns StepResult with status and output
   */
  async executeStep(
    step: WorkflowStep,
    projectPath: string,
    options: ExecutionOptions,
    sharedContext: Record<string, any>
  ): Promise<StepResult> {
    try {
      let output: any;

      // Check for elicitation point
      const elicitPoint = this.workflowConfig?.['elicit-points']?.find(e => e.step === step.id);
      if (elicitPoint) {
        output = await this.handleElicitation(
          { question: elicitPoint.question, default: elicitPoint.default },
          options.yoloMode || false
        );
      }

      // Execute agent method if specified
      if (step.agent && step.method) {
        // Spawn agent if not already spawned
        if (!this.spawnedAgents.has(step.agent)) {
          const agent = await this.spawnAgent(step.agent, {
            projectPath,
            workflowConfig: this.workflowConfig!,
            sharedData: sharedContext,
            onboardingDocs: [],
            workflowState: {},
            taskDescription: step.name || `Step ${step.id}`
          });
          this.spawnedAgents.set(step.agent, agent);
        }

        // Get agent and call method
        const agent = this.spawnedAgents.get(step.agent);
        if (!agent || typeof agent[step.method] !== 'function') {
          throw new WorkflowExecutionError(
            `Agent ${step.agent} does not have method ${step.method}`
          );
        }

        // Call agent method
        output = await agent[step.method](sharedContext);

        // Make decision if confidence is provided
        if (output && typeof output.confidence === 'number') {
          const decision = await this.makeDecision(
            `Should we proceed with ${step.name}?`,
            {
              currentStep: step.id,
              stepName: step.name,
              question: `Confidence: ${output.confidence}`,
              output
            }
          );

          // Log decision
          this.decisionLog.push(decision);
        }
      }

      // Process template-output if specified
      if (step['template-output']) {
        await this.processTemplateOutput(step['template-output'], output, projectPath);
      }

      return {
        stepId: step.id,
        status: 'completed',
        output
      };
    } catch (error: any) {
      return {
        stepId: step.id,
        status: 'failed',
        error
      };
    }
  }

  /**
   * Spawn agent via AgentPool
   * AC #3: Spawn Mary agent for requirements analysis
   * AC #4: Spawn John agent for strategic validation
   *
   * @param agentType Agent type (mary, john)
   * @param context Agent context
   * @returns Spawned agent instance
   */
  async spawnAgent(agentType: string, context: AgentContext): Promise<any> {
    try {
      console.log(`[PRDWorkflowExecutor] Spawning ${agentType} agent`);

      const agent = await this.agentPool.createAgent(agentType, context);

      console.log(`[PRDWorkflowExecutor] ${agentType} agent spawned successfully`);
      return agent;
    } catch (error: any) {
      throw new WorkflowExecutionError(`Failed to spawn ${agentType} agent: ${error.message}`);
    }
  }

  /**
   * Process template-output tag by generating content and saving to PRD.md
   * AC #5: Process template-output tags by generating content and saving to PRD.md
   *
   * @param section Section name
   * @param content Content to save
   * @param projectPath Project root path
   */
  async processTemplateOutput(
    section: string,
    content: any,
    projectPath: string
  ): Promise<void> {
    try {
      console.log(`[PRDWorkflowExecutor] Processing template-output: ${section}`);

      // Generate markdown content from agent output
      let markdownContent = `\n## ${this.formatSectionTitle(section)}\n\n`;

      if (typeof content === 'object') {
        markdownContent += this.formatObjectAsMarkdown(content);
      } else {
        markdownContent += String(content);
      }

      markdownContent += '\n';

      // Ensure docs directory exists
      const docsDir = path.join(projectPath, 'docs');
      await fs.mkdir(docsDir, { recursive: true });

      // Append to PRD.md
      const prdPath = path.join(docsDir, 'PRD.md');

      // Check if file exists
      let existingContent = '';
      try {
        existingContent = await fs.readFile(prdPath, 'utf-8');
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create with header
          existingContent = `# Product Requirements Document\n\nGenerated by PRD Workflow\n`;
        } else {
          throw error;
        }
      }

      // Append new section
      const updatedContent = existingContent + markdownContent;
      await fs.writeFile(prdPath, updatedContent, 'utf-8');

      // Track section as generated
      this.sectionsGenerated.push(section);

      console.log(`[PRDWorkflowExecutor] Saved section to: ${prdPath}`);
    } catch (error: any) {
      throw new WorkflowExecutionError(`Failed to process template-output: ${error.message}`);
    }
  }

  /**
   * Handle elicitation point
   * AC #6: Handle elicit-required tags (skip in #yolo mode)
   *
   * @param elicitConfig Elicitation configuration
   * @param yoloMode Whether YOLO mode is enabled
   * @returns Elicit result with answer
   */
  async handleElicitation(
    elicitConfig: ElicitConfig,
    yoloMode: boolean
  ): Promise<ElicitResult> {
    if (yoloMode) {
      // Skip elicitation in YOLO mode, use default
      console.log(`[PRDWorkflowExecutor] Skipping elicitation (YOLO mode): ${elicitConfig.question}`);
      console.log(`[PRDWorkflowExecutor] Using default: ${elicitConfig.default}`);

      return {
        answer: elicitConfig.default,
        timestamp: new Date().toISOString()
      };
    } else {
      // In normal mode, would pause and prompt user
      // For now, using default (in real implementation, would await user input)
      console.log(`[PRDWorkflowExecutor] Elicitation point: ${elicitConfig.question}`);
      console.log(`[PRDWorkflowExecutor] Using default: ${elicitConfig.default}`);

      return {
        answer: elicitConfig.default,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Make autonomous decision via DecisionEngine
   * AC #7: Make autonomous decisions via DecisionEngine (target <3 escalations)
   *
   * @param question Decision question
   * @param context Decision context
   * @returns Decision with confidence score and reasoning
   */
  async makeDecision(question: string, context: DecisionContext): Promise<WorkflowDecision> {
    try {
      // Use DecisionEngine to make autonomous decision
      const decision = await this.decisionEngine.attemptAutonomousDecision(question, context);

      console.log(`[PRDWorkflowExecutor] Decision: ${decision.decision} (confidence: ${decision.confidence})`);

      // Check confidence threshold
      if (decision.confidence < 0.75) {
        // Low confidence: escalate to human
        console.log(`[PRDWorkflowExecutor] Low confidence (${decision.confidence}), escalating...`);

        const escalationId = await this.escalationQueue.add({
          workflowId: 'prd-workflow',
          step: context.currentStep,
          question,
          aiReasoning: decision.reasoning || 'Low confidence decision',
          confidence: decision.confidence,
          context
        });

        this.escalationsCount++;

        // Wait for human response
        console.log(`[PRDWorkflowExecutor] Waiting for human response to escalation: ${escalationId}`);
        const response = await this.escalationQueue.waitForResponse(escalationId);

        console.log(`[PRDWorkflowExecutor] Received human response: ${response.answer}`);

        // Use human response as the decision
        return {
          decision: String(response.answer),
          confidence: 1.0, // Human decisions have full confidence
          reasoning: `Human override: ${response.answer}`
        };
      }

      // High confidence: proceed autonomously
      // Convert DecisionEngine's Decision to WorkflowDecision
      return {
        decision: String(decision.decision),
        confidence: decision.confidence,
        reasoning: decision.reasoning
      };
    } catch (error: any) {
      throw new WorkflowExecutionError(`Failed to make decision: ${error.message}`);
    }
  }

  /**
   * Complete workflow and update workflow-status.yaml
   * AC #9: Generate docs/PRD.md with all sections filled
   * AC #10: Update workflow-status.yaml to mark PRD complete
   *
   * @param projectPath Project root path
   * @returns WorkflowResult with success status and metadata
   */
  async completeWorkflow(projectPath?: string): Promise<WorkflowResult> {
    try {
      if (!projectPath) {
        throw new WorkflowExecutionError('Project path required for workflow completion');
      }

      console.log(`[PRDWorkflowExecutor] Completing workflow...`);

      // Verify PRD.md exists
      const prdPath = path.join(projectPath, 'docs', 'PRD.md');
      try {
        await fs.access(prdPath);
      } catch (error) {
        throw new WorkflowExecutionError('PRD.md was not generated');
      }

      // Update workflow-status.yaml
      const statusPath = path.join(projectPath, 'docs', 'workflow-status.yaml');

      let statusContent = '';
      try {
        statusContent = await fs.readFile(statusPath, 'utf-8');
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create it
          statusContent = 'workflows:\n';
        } else {
          throw error;
        }
      }

      // Update PRD workflow status to complete
      const prdStatusRegex = /prd:\s*\n\s*status:\s*\w+/;
      if (prdStatusRegex.test(statusContent)) {
        // Update existing PRD status
        statusContent = statusContent.replace(
          prdStatusRegex,
          `prd:\n    status: complete`
        );
      } else {
        // Add new PRD status
        if (!statusContent.includes('workflows:')) {
          statusContent = 'workflows:\n' + statusContent;
        }
        statusContent += `  prd:\n    status: complete\n    completed: ${new Date().toISOString()}\n`;
      }

      await fs.writeFile(statusPath, statusContent, 'utf-8');

      console.log(`[PRDWorkflowExecutor] Updated workflow-status.yaml`);

      // Return workflow result
      return this.workflowResult || {
        success: true,
        outputPath: prdPath,
        executionTime: Date.now() - this.startTime,
        escalationsCount: this.escalationsCount,
        sectionsGenerated: this.sectionsGenerated
      };
    } catch (error: any) {
      throw new WorkflowExecutionError(`Failed to complete workflow: ${error.message}`);
    }
  }

  /**
   * Clean up agents after workflow completion
   * @private
   */
  private async cleanupAgents(): Promise<void> {
    console.log(`[PRDWorkflowExecutor] Cleaning up agents...`);

    for (const [agentType, agent] of this.spawnedAgents.entries()) {
      try {
        await this.agentPool.destroyAgent(agent.id);
        console.log(`[PRDWorkflowExecutor] Destroyed ${agentType} agent`);
      } catch (error: any) {
        console.error(`[PRDWorkflowExecutor] Failed to destroy ${agentType} agent: ${error.message}`);
      }
    }

    this.spawnedAgents.clear();
  }

  /**
   * Format section title (convert snake_case to Title Case)
   * @private
   */
  private formatSectionTitle(section: string): string {
    return section
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format object as markdown
   * @private
   */
  private formatObjectAsMarkdown(obj: any): string {
    let markdown = '';

    for (const [key, value] of Object.entries(obj)) {
      // Skip confidence field (internal)
      if (key === 'confidence') continue;

      const formattedKey = this.formatSectionTitle(key);

      if (Array.isArray(value)) {
        markdown += `**${formattedKey}:**\n\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            markdown += `- ${JSON.stringify(item, null, 2)}\n`;
          } else {
            markdown += `- ${item}\n`;
          }
        });
        markdown += '\n';
      } else if (typeof value === 'object') {
        markdown += `**${formattedKey}:**\n\n`;
        markdown += JSON.stringify(value, null, 2);
        markdown += '\n\n';
      } else {
        markdown += `**${formattedKey}:** ${value}\n\n`;
      }
    }

    return markdown;
  }

  // ===================================================================
  // Public Getters for Testing
  // ===================================================================

  /**
   * Get workflow name
   * @returns Workflow name
   */
  getWorkflowName(): string {
    return this.workflowConfig?.name || '';
  }

  /**
   * Get workflow steps
   * @returns Array of workflow steps
   */
  getSteps(): WorkflowStep[] {
    return this.workflowConfig?.steps || [];
  }

  /**
   * Get workflow configuration
   * @returns Workflow configuration object
   */
  getWorkflowConfig(): WorkflowConfig | undefined {
    return this.workflowConfig;
  }

  /**
   * Get step statuses
   * @returns Array of step statuses
   */
  getStepStatuses(): StepStatus[] {
    return this.stepStatuses;
  }

  /**
   * Get workflow result
   * @returns Workflow result
   */
  getWorkflowResult(): WorkflowResult | undefined {
    return this.workflowResult;
  }

  /**
   * Get decision log
   * @returns Array of decisions made during workflow
   */
  getDecisionLog(): WorkflowDecision[] {
    return this.decisionLog;
  }
}
