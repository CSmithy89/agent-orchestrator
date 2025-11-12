/**
 * ArchitectureWorkflowExecutor - Orchestrates Winston and Murat agents through architecture workflow
 *
 * Executes the 9-step architecture workflow autonomously with state persistence and resume capability.
 * Coordinates Winston (System Architect) for architecture design and Murat (Test Architect) for test strategy.
 *
 * Features:
 * - Sequential workflow execution (steps 1-9)
 * - Winston agent coordination (steps 2-5, 7)
 * - Murat agent coordination (steps 6, 7)
 * - State persistence after each step for crash recovery
 * - Resume capability from saved state
 * - Template processing for architecture document generation
 * - Performance monitoring and cost tracking
 * - Event emission for observability
 *
 * @example
 * ```typescript
 * // Execute architecture workflow from PRD
 * const architecturePath = await ArchitectureWorkflowExecutor.execute(
 *   '/path/to/PRD.md',
 *   { epicId: 'epic-3' }
 * );
 *
 * // Resume interrupted workflow
 * const resumedPath = await ArchitectureWorkflowExecutor.resume('project-id');
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as readline from 'readline';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { LLMFactory } from '../llm/LLMFactory.js';
import { LLMConfig } from '../types/llm.types.js';
import { WinstonAgent, type DecisionRecord as WinstonDecisionRecord } from '../core/agents/winston-agent.js';
import { MuratAgent, type DecisionRecord as MuratDecisionRecord } from '../core/agents/murat-agent.js';
import { DecisionEngine } from '../core/services/decision-engine.js';
import { EscalationQueue } from '../core/services/escalation-queue.js';
import { StateManager } from '../core/StateManager.js';
import { TemplateProcessor } from '../core/TemplateProcessor.js';
import { WorkflowState, AgentActivity } from '../types/workflow.types.js';
import { TechnicalDecisionLogger, TechnicalDecision } from '../core/technical-decision-logger.js';
import { SecurityGateValidator } from '../core/security-gate-validator.js';
import { ArchitectureValidator } from '../core/architecture-validator.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Architecture workflow state (extends WorkflowState)
 */
export interface ArchitectureWorkflowState extends WorkflowState {
  /** Workflow type */
  workflow: 'architecture';

  /** Workflow-specific variables */
  variables: {
    epic_id?: string;
    project_name: string;
    prd_path: string;
    architecture_output_path: string;
    user_name: string;
    date: string;
    [key: string]: any;
  };

  /** Security gate status */
  securityGate: {
    status: 'pending' | 'passed' | 'failed';
    score?: number;
    gaps?: string[];
  };

  /** Architecture validation status */
  validation: {
    status: 'pending' | 'passed' | 'failed';
    overallScore?: number;
    completenessScore?: number;
    traceabilityScore?: number;
    testStrategyScore?: number;
    consistencyScore?: number;
  };
}

/**
 * Architecture workflow configuration
 */
export interface ArchitectureWorkflowConfig {
  name: string;
  description: string;
  author: string;
  config_source: string;
  output_folder: string;
  user_name: string;
  date: string;
  template: string;
  instructions: string;
  validation?: string;
  variables?: Record<string, any>;
}

/**
 * Execution options for architecture workflow
 */
export interface ArchitectureExecutionOptions {
  /** Epic ID (optional) */
  epicId?: string;

  /** Skip security gate (NEVER use in production) */
  skipSecurityGate?: boolean;

  /** Project root directory */
  projectRoot?: string;

  /** Workflow ID for resume */
  workflowId?: string;
}

/**
 * Performance metrics for workflow execution
 */
interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  stepDurations: Map<number, number>;
  totalDuration?: number;
  tokenUsage: {
    winston: { input: number; output: number };
    murat: { input: number; output: number };
  };
  estimatedCost: number;
  escalationCount: number;
}

/**
 * ArchitectureWorkflowExecutor class
 * Orchestrates architecture workflow execution with Winston and Murat agents
 */
export class ArchitectureWorkflowExecutor extends EventEmitter {
  /** Default architecture workflow path */
  private static readonly DEFAULT_WORKFLOW_PATH = '../../../../bmad/bmm/workflows/3-solutioning/architecture/workflow.yaml';

  /** Winston retry attempts */
  private static readonly WINSTON_RETRIES = 3;

  /** Murat retry attempts */
  private static readonly MURAT_RETRIES = 2;

  /** Project root directory */
  private readonly projectRoot: string;

  /** Workflow configuration */
  private workflowConfig?: ArchitectureWorkflowConfig;

  /** Workflow state */
  private state?: ArchitectureWorkflowState;

  /** Winston agent instance */
  private winstonAgent?: WinstonAgent;

  /** Murat agent instance */
  private muratAgent?: MuratAgent;

  /** LLM Factory */
  private llmFactory: LLMFactory;

  /** Decision Engine */
  private decisionEngine: DecisionEngine;

  /** Escalation Queue */
  private escalationQueue: EscalationQueue;

  /** State Manager */
  private stateManager: StateManager;

  /** Template Processor */
  private templateProcessor: TemplateProcessor;

  /** Performance metrics */
  private metrics: PerformanceMetrics;

  /** Current architecture document content */
  private architectureContent: string = '';

  /**
   * Private constructor - use static execute() or resume() methods
   */
  private constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
    this.llmFactory = new LLMFactory();

    // Create DecisionEngine with required parameters
    const decisionLLMConfig: LLMConfig = {
      provider: 'claude-code',
      model: 'claude-sonnet-4-5'
    };
    this.decisionEngine = new DecisionEngine(
      this.llmFactory,
      decisionLLMConfig,
      path.join(projectRoot, '.bmad/onboarding')
    );

    // Create EscalationQueue with explicit directory
    this.escalationQueue = new EscalationQueue(
      path.join(projectRoot, '.bmad-escalations')
    );

    this.stateManager = new StateManager(projectRoot);
    this.templateProcessor = new TemplateProcessor({
      basePath: projectRoot,
      strictMode: true,
      preserveWhitespace: true
    });
    this.metrics = {
      startTime: Date.now(),
      stepDurations: new Map(),
      tokenUsage: {
        winston: { input: 0, output: 0 },
        murat: { input: 0, output: 0 }
      },
      estimatedCost: 0,
      escalationCount: 0
    };
  }

  /**
   * Execute architecture workflow from start to completion
   *
   * @param prdPath - Path to PRD document
   * @param options - Execution options
   * @returns Path to generated architecture document
   */
  static async execute(
    prdPath: string,
    options: ArchitectureExecutionOptions = {}
  ): Promise<string> {
    const projectRoot = options.projectRoot || process.cwd();
    const executor = new ArchitectureWorkflowExecutor(projectRoot);

    console.log('[ArchitectureWorkflowExecutor] Starting architecture workflow execution');
    executor.emit('workflow.architecture.started', {
      projectId: path.basename(projectRoot),
      prdPath,
      timestamp: new Date()
    });

    try {
      // Load workflow configuration
      await executor.loadWorkflowConfig(options.epicId);

      // Validate PRD path
      await executor.validatePRDPath(prdPath);

      // Initialize workflow state
      executor.initializeState(prdPath, options.epicId);

      // Execute steps 1-9 sequentially
      for (let step = 1; step <= 9; step++) {
        await executor.executeStep(step);
      }

      // Finalize metrics
      executor.finalizeMetrics();

      // Mark workflow as completed
      if (executor.state) {
        executor.state.status = 'completed';
        await executor.stateManager.saveState(executor.state);
      }

      const architecturePath = executor.state?.variables.architecture_output_path || '';
      executor.emit('workflow.architecture.completed', {
        projectId: path.basename(projectRoot),
        architecturePath,
        duration: executor.metrics.totalDuration,
        cost: executor.metrics.estimatedCost
      });

      console.log(`[ArchitectureWorkflowExecutor] Workflow completed in ${(executor.metrics.totalDuration! / 1000).toFixed(2)}s`);
      console.log(`[ArchitectureWorkflowExecutor] Estimated cost: $${executor.metrics.estimatedCost.toFixed(2)}`);
      console.log(`[ArchitectureWorkflowExecutor] Architecture document: ${architecturePath}`);

      return architecturePath;
    } catch (error) {
      const errorDetails = error as Error;
      executor.emit('workflow.architecture.failed', {
        projectId: path.basename(projectRoot),
        step: executor.state?.currentStep || 0,
        error: errorDetails.message,
        escalationId: null
      });

      if (executor.state) {
        executor.state.status = 'error';
        await executor.stateManager.saveState(executor.state);
      }

      throw error;
    }
  }

  /**
   * Resume architecture workflow from saved state
   *
   * @param projectId - Project identifier
   * @param skipPrompt - Skip user prompt (for automated/testing scenarios)
   * @returns Path to completed architecture document
   */
  static async resume(projectId: string, skipPrompt: boolean = false): Promise<string> {
    const projectRoot = process.cwd();
    const executor = new ArchitectureWorkflowExecutor(projectRoot);

    console.log(`[ArchitectureWorkflowExecutor] Checking for interrupted workflow: ${projectId}`);

    // Load saved state
    const savedState = await executor.loadState(projectId);
    if (!savedState) {
      throw new Error(`No interrupted workflow found for project: ${projectId}`);
    }

    // Validate state is resumable
    if (savedState.currentStep >= 9) {
      throw new Error('Workflow already completed');
    }

    // Restore state
    executor.state = savedState as ArchitectureWorkflowState;

    // Display workflow state information
    console.log(`\n[ArchitectureWorkflowExecutor] Interrupted workflow detected:`);
    console.log(`  - Current step: ${executor.state.currentStep} of 9`);
    console.log(`  - Last update: ${executor.state.lastUpdate}`);
    console.log(`  - Agent activity: ${executor.state.agentActivity.length} agent actions tracked`);
    console.log(`  - PRD: ${executor.state.variables.prd_path}`);

    // Prompt user for resume or restart (unless skipPrompt is true)
    let shouldRestart = false;
    if (!skipPrompt) {
      shouldRestart = await ArchitectureWorkflowExecutor.promptUserForResumeOrRestart(
        executor.state.currentStep
      );
    }

    // If restart requested, delete state and execute from scratch
    if (shouldRestart) {
      console.log('\n[ArchitectureWorkflowExecutor] Restarting workflow from beginning...');

      // Delete state file
      try {
        const stateFilePath = path.join(projectRoot, 'bmad', projectId, 'sprint-status.yaml');
        await fs.unlink(stateFilePath);
        console.log(`[ArchitectureWorkflowExecutor] Deleted state file: ${stateFilePath}`);
      } catch (error) {
        console.warn('[ArchitectureWorkflowExecutor] Could not delete state file:', error);
      }

      return ArchitectureWorkflowExecutor.execute(
        executor.state.variables.prd_path,
        {
          projectRoot,
          epicId: executor.state.variables.epic_id
        }
      );
    }

    // Resume from saved state
    console.log('\n[ArchitectureWorkflowExecutor] Resuming workflow from saved state...');

    // Load workflow configuration
    await executor.loadWorkflowConfig(executor.state.variables.epic_id);

    // Load existing architecture content
    const architecturePath = executor.state.variables.architecture_output_path;
    try {
      executor.architectureContent = await fs.readFile(architecturePath, 'utf-8');
    } catch {
      console.warn('[ArchitectureWorkflowExecutor] Could not load existing architecture content');
    }

    // Resume from next step
    const resumeStep = executor.state.currentStep + 1;
    console.log(`[ArchitectureWorkflowExecutor] Resuming from step ${resumeStep}`);

    try {
      for (let step = resumeStep; step <= 9; step++) {
        await executor.executeStep(step);
      }

      // Finalize metrics
      executor.finalizeMetrics();

      // Mark as completed
      executor.state.status = 'completed';
      await executor.stateManager.saveState(executor.state);

      executor.emit('workflow.architecture.completed', {
        projectId,
        architecturePath,
        duration: executor.metrics.totalDuration,
        cost: executor.metrics.estimatedCost
      });

      return architecturePath;
    } catch (error) {
      executor.state.status = 'error';
      await executor.stateManager.saveState(executor.state);
      throw error;
    }
  }

  /**
   * Prompt user to resume or restart workflow
   *
   * @param currentStep - Current step in saved state
   * @returns true if user wants to restart, false to resume
   */
  private static async promptUserForResumeOrRestart(currentStep: number): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log(`\n[USER INPUT REQUIRED]`);
      rl.question(
        `Resume from step ${currentStep + 1} or restart workflow? (r=resume [default], restart=restart): `,
        (answer) => {
          rl.close();
          const normalizedAnswer = answer.trim().toLowerCase();
          const shouldRestart = normalizedAnswer === 'restart';
          resolve(shouldRestart);
        }
      );
    });
  }

  /**
   * Validate architecture completeness (placeholder for Story 3-7)
   *
   * @param architecturePath - Path to architecture document
   * @returns Validation result
   */
  static async validate(_architecturePath: string): Promise<{ valid: boolean; score: number }> {
    console.log('[ArchitectureWorkflowExecutor] Architecture validation deferred to Story 3-7');
    // Placeholder - will be implemented in Story 3-7
    return { valid: true, score: 100 };
  }

  /**
   * Load workflow configuration from workflow.yaml
   *
   * @param epicId - Optional epic ID
   */
  private async loadWorkflowConfig(epicId?: string): Promise<void> {
    // Try project-specific workflow path first, then fall back to default
    const projectWorkflowPath = path.join(
      this.projectRoot,
      'bmad/bmm/workflows/3-solutioning/architecture/workflow.yaml'
    );
    const defaultWorkflowPath = path.resolve(__dirname, ArchitectureWorkflowExecutor.DEFAULT_WORKFLOW_PATH);

    let workflowPath = projectWorkflowPath;
    try {
      await fs.access(projectWorkflowPath);
    } catch {
      // Fall back to default path
      workflowPath = defaultWorkflowPath;
    }

    try {
      const workflowContent = await fs.readFile(workflowPath, 'utf-8');
      const config = yaml.load(workflowContent) as any;

      // Resolve variables
      this.workflowConfig = {
        name: config.name || 'architecture',
        description: config.description || 'Architecture workflow',
        author: config.author || 'BMad',
        config_source: config.config_source || '',
        output_folder: config.output_folder || path.join(this.projectRoot, 'docs'),
        user_name: config.user_name || 'Developer',
        date: new Date().toISOString().split('T')[0] || new Date().toISOString(),
        template: config.template || '',
        instructions: config.instructions || '',
        validation: config.validation,
        variables: {
          ...config.variables,
          epic_id: epicId
        }
      };

      console.log('[ArchitectureWorkflowExecutor] Workflow configuration loaded');
    } catch (error) {
      throw new Error(
        `Failed to load workflow configuration from ${workflowPath}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Validate PRD path exists and is readable
   *
   * @param prdPath - Path to PRD document
   */
  private async validatePRDPath(prdPath: string): Promise<void> {
    try {
      const stats = await fs.stat(prdPath);
      if (!stats.isFile()) {
        throw new Error(`PRD path is not a file: ${prdPath}`);
      }

      const content = await fs.readFile(prdPath, 'utf-8');
      if (!content || content.trim().length === 0) {
        throw new Error(`PRD file is empty: ${prdPath}`);
      }

      console.log(`[ArchitectureWorkflowExecutor] PRD validated: ${prdPath}`);
    } catch (error) {
      throw new Error(
        `PRD validation failed: ${(error as Error).message}`
      );
    }
  }

  /**
   * Initialize workflow state
   *
   * @param prdPath - Path to PRD document
   * @param epicId - Optional epic ID
   */
  private initializeState(prdPath: string, epicId?: string): void {
    if (!this.workflowConfig) {
      throw new Error('Workflow configuration not loaded');
    }

    const workflowId = `architecture-${Date.now()}`;
    const architecturePath = path.join(
      this.workflowConfig.output_folder,
      'architecture.md'
    );

    this.state = {
      project: {
        id: path.basename(this.projectRoot),
        name: this.workflowConfig.name,
        level: 0
      },
      workflow: 'architecture',
      currentWorkflow: 'architecture',
      currentStep: 0,
      status: 'running',
      variables: {
        epic_id: epicId,
        project_name: this.workflowConfig.name,
        prd_path: prdPath,
        architecture_output_path: architecturePath,
        user_name: this.workflowConfig.user_name,
        date: this.workflowConfig.date
      },
      agentActivity: [],
      securityGate: {
        status: 'pending'
      },
      validation: {
        status: 'pending'
      },
      startTime: new Date(),
      lastUpdate: new Date()
    };

    console.log(`[ArchitectureWorkflowExecutor] State initialized: ${workflowId}`);
  }

  /**
   * Execute a workflow step
   *
   * @param stepNumber - Step number (1-9)
   */
  private async executeStep(stepNumber: number): Promise<void> {
    if (!this.state) {
      throw new Error('State not initialized');
    }

    const stepStart = Date.now();
    console.log(`\n[ArchitectureWorkflowExecutor] ===== Step ${stepNumber} =====`);

    try {
      switch (stepNumber) {
        case 1:
          await this.executeStep1();
          break;
        case 2:
          await this.executeStep2();
          break;
        case 3:
          await this.executeStep3();
          break;
        case 4:
          await this.executeStep4();
          break;
        case 5:
          await this.executeStep5();
          break;
        case 6:
          await this.executeStep6();
          break;
        case 7:
          await this.executeStep7();
          break;
        case 8:
          await this.executeStep8();
          break;
        case 9:
          await this.executeStep9();
          break;
        default:
          throw new Error(`Invalid step number: ${stepNumber}`);
      }

      // Update state
      this.state.currentStep = stepNumber;
      this.state.lastUpdate = new Date();

      // Save state after step completion
      await this.stateManager.saveState(this.state);

      // Track step duration
      const stepDuration = Date.now() - stepStart;
      this.metrics.stepDurations.set(stepNumber, stepDuration);

      // Emit step completed event
      this.emit('workflow.architecture.step_completed', {
        projectId: this.state.project.id,
        step: stepNumber,
        duration: stepDuration
      });

      console.log(`[ArchitectureWorkflowExecutor] Step ${stepNumber} completed in ${(stepDuration / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error(`[ArchitectureWorkflowExecutor] Step ${stepNumber} failed:`, error);
      throw error;
    }
  }

  /**
   * Step 1: Load Configuration
   */
  private async executeStep1(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 1: Load Configuration');

    if (!this.state || !this.workflowConfig) {
      throw new Error('State or config not initialized');
    }

    // Load PRD content
    const prdContent = await fs.readFile(this.state.variables.prd_path, 'utf-8');
    this.state.variables.prd_content = prdContent;

    // Load template
    const templatePath = path.resolve(this.projectRoot, 'bmad/bmm/workflows/3-solutioning/architecture/architecture-template.md');
    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Substitute template variables
      const processedTemplate = this.templateProcessor.processTemplate(templateContent, this.state.variables);

      // Write initial architecture document
      await this.templateProcessor.writeOutput(
        processedTemplate,
        this.state.variables.architecture_output_path
      );

      this.architectureContent = processedTemplate;
      console.log(`[ArchitectureWorkflowExecutor] Architecture template initialized: ${this.state.variables.architecture_output_path}`);
    } catch (error) {
      console.warn(`[ArchitectureWorkflowExecutor] Template not found, will generate inline: ${(error as Error).message}`);
      // Initialize empty architecture document
      this.architectureContent = `# Architecture Document\n\nProject: ${this.state.variables.project_name}\nDate: ${this.state.variables.date}\n`;
      await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');
    }
  }

  /**
   * Step 2: System Overview (Winston)
   */
  private async executeStep2(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 2: System Overview (Winston)');

    if (!this.state) throw new Error('State not initialized');

    // Create Winston agent
    const winston = await this.createWinstonAgent();
    winston.setWorkflowContext('architecture', 2);

    // Track Winston activity
    const winstonActivity: AgentActivity = {
      agentId: 'winston-architecture',
      agentName: 'Winston (System Architect)',
      action: 'Generate System Overview',
      timestamp: new Date(),
      status: 'started'
    };
    this.state.agentActivity.push(winstonActivity);

    this.emit('agent.winston.started', {
      projectId: this.state.project.id,
      section: 'system-overview',
      timestamp: new Date()
    });

    // Generate system overview with retry logic
    const overview = await this.invokeWithRetry(
      async () => winston.generateSystemOverview(this.state!.variables.prd_content),
      ArchitectureWorkflowExecutor.WINSTON_RETRIES,
      'Winston.generateSystemOverview'
    );

    // Update architecture document
    this.architectureContent = this.replaceSection(this.architectureContent, 'System Overview', overview);
    await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');

    // Update Winston activity
    winstonActivity.status = 'completed';
    winstonActivity.duration = Date.now() - winstonActivity.timestamp.getTime();
    winstonActivity.output = 'System Overview section generated';

    this.emit('agent.winston.completed', {
      projectId: this.state.project.id,
      section: 'system-overview',
      duration: winstonActivity.duration,
      tokens: 0, // TODO: Track actual tokens
      cost: 0
    });

    console.log('[ArchitectureWorkflowExecutor] System Overview completed');
  }

  /**
   * Step 3: Component Design (Winston)
   */
  private async executeStep3(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 3: Component Design (Winston)');

    if (!this.state) throw new Error('State not initialized');

    const winston = await this.createWinstonAgent();
    winston.setWorkflowContext('architecture', 3);

    // Extract requirements from PRD
    const requirements = this.extractRequirements(this.state.variables.prd_content);

    // Design components
    const components = await this.invokeWithRetry(
      async () => winston.designComponents(requirements),
      ArchitectureWorkflowExecutor.WINSTON_RETRIES,
      'Winston.designComponents'
    );

    // Format components as markdown
    const componentSection = this.formatComponentDesigns(components);

    // Update architecture document
    this.architectureContent = this.replaceSection(this.architectureContent, 'Component Architecture', componentSection);
    await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');

    console.log(`[ArchitectureWorkflowExecutor] Component Design completed (${components.length} components)`);
  }

  /**
   * Step 4: Data Models & APIs (Winston)
   */
  private async executeStep4(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 4: Data Models & APIs (Winston)');

    if (!this.state) throw new Error('State not initialized');

    const winston = await this.createWinstonAgent();
    winston.setWorkflowContext('architecture', 4);

    // Extract entities from PRD
    const entities = this.extractEntities(this.state.variables.prd_content);

    // Define data models
    const dataModels = await this.invokeWithRetry(
      async () => winston.defineDataModels(entities),
      ArchitectureWorkflowExecutor.WINSTON_RETRIES,
      'Winston.defineDataModels'
    );

    // Extract API requirements
    const apiRequirements = this.extractAPIRequirements(this.state.variables.prd_content);

    // Specify APIs
    const apiSpecs = await this.invokeWithRetry(
      async () => winston.specifyAPIs(apiRequirements),
      ArchitectureWorkflowExecutor.WINSTON_RETRIES,
      'Winston.specifyAPIs'
    );

    // Format sections
    const dataModelSection = this.formatDataModels(dataModels);
    const apiSection = this.formatAPISpecifications(apiSpecs);

    // Update architecture document
    this.architectureContent = this.replaceSection(this.architectureContent, 'Data Models', dataModelSection);
    this.architectureContent = this.replaceSection(this.architectureContent, 'API Specifications', apiSection);
    await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');

    console.log(`[ArchitectureWorkflowExecutor] Data Models & APIs completed`);
  }

  /**
   * Step 5: Non-Functional Requirements (Winston)
   */
  private async executeStep5(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 5: Non-Functional Requirements (Winston)');

    if (!this.state) throw new Error('State not initialized');

    const winston = await this.createWinstonAgent();
    winston.setWorkflowContext('architecture', 5);

    // Extract NFR requirements from PRD
    const nfrRequirements = this.extractNFRRequirements(this.state.variables.prd_content);

    // Document NFRs
    const nfrs = await this.invokeWithRetry(
      async () => winston.documentNFRs(nfrRequirements),
      ArchitectureWorkflowExecutor.WINSTON_RETRIES,
      'Winston.documentNFRs'
    );

    // Format NFRs
    const nfrSection = this.formatNFRSection(nfrs);

    // Update architecture document
    this.architectureContent = this.replaceSection(this.architectureContent, 'Non-Functional Requirements', nfrSection);
    await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');

    console.log('[ArchitectureWorkflowExecutor] NFRs completed');
  }

  /**
   * Step 6: Test Strategy (Murat)
   */
  private async executeStep6(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 6: Test Strategy (Murat)');

    if (!this.state) throw new Error('State not initialized');

    // Create Murat agent
    const murat = await this.createMuratAgent();
    murat.setWorkflowContext('architecture', 6);

    // Track Murat activity
    const muratActivity: AgentActivity = {
      agentId: 'murat-architecture',
      agentName: 'Murat (Test Architect)',
      action: 'Generate Test Strategy',
      timestamp: new Date(),
      status: 'started'
    };
    this.state.agentActivity.push(muratActivity);

    this.emit('agent.murat.started', {
      projectId: this.state.project.id,
      timestamp: new Date()
    });

    // Pass Winston's architecture draft to Murat
    const requirements = this.extractRequirements(this.state.variables.prd_content);

    // Define test strategy
    const testStrategy = await this.invokeWithRetry(
      async () => murat.defineTestStrategy(this.architectureContent, requirements),
      ArchitectureWorkflowExecutor.MURAT_RETRIES,
      'Murat.defineTestStrategy'
    );

    // Extract tech stack from architecture
    const techStack = this.extractTechStack(this.architectureContent);

    // Recommend frameworks
    const frameworks = await this.invokeWithRetry(
      async () => murat.recommendFrameworks(techStack),
      ArchitectureWorkflowExecutor.MURAT_RETRIES,
      'Murat.recommendFrameworks'
    );

    // Define test pyramid
    const projectType = 'backend-api'; // TODO: Extract from PRD
    const pyramid = await this.invokeWithRetry(
      async () => murat.defineTestPyramid(projectType),
      ArchitectureWorkflowExecutor.MURAT_RETRIES,
      'Murat.defineTestPyramid'
    );

    // Design CI/CD pipeline
    const pipeline = await this.invokeWithRetry(
      async () => murat.designPipeline(projectType, testStrategy),
      ArchitectureWorkflowExecutor.MURAT_RETRIES,
      'Murat.designPipeline'
    );

    // Define quality gates
    const qualityGates = await this.invokeWithRetry(
      async () => murat.defineQualityGates(this.state!.project.level),
      ArchitectureWorkflowExecutor.MURAT_RETRIES,
      'Murat.defineQualityGates'
    );

    // Specify ATDD approach
    const acceptanceCriteria = this.extractAcceptanceCriteria(this.state.variables.prd_content);
    const atdd = await this.invokeWithRetry(
      async () => murat.specifyATDD(acceptanceCriteria),
      ArchitectureWorkflowExecutor.MURAT_RETRIES,
      'Murat.specifyATDD'
    );

    // Format test strategy section
    const testStrategySection = this.formatTestStrategy(testStrategy, frameworks, pyramid, pipeline, qualityGates, atdd);

    // Update architecture document
    this.architectureContent = this.replaceSection(this.architectureContent, 'Test Strategy', testStrategySection);
    await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');

    // Update Murat activity
    muratActivity.status = 'completed';
    muratActivity.duration = Date.now() - muratActivity.timestamp.getTime();
    muratActivity.output = 'Test Strategy section generated';

    this.emit('agent.murat.completed', {
      projectId: this.state.project.id,
      duration: muratActivity.duration,
      tokens: 0, // TODO: Track actual tokens
      cost: 0
    });

    console.log('[ArchitectureWorkflowExecutor] Test Strategy completed');
  }

  /**
   * Step 7: Technical Decisions
   */
  private async executeStep7(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 7: Technical Decisions');

    if (!this.state) throw new Error('State not initialized');

    // Create TechnicalDecisionLogger
    const logger = new TechnicalDecisionLogger();

    // Get decision audit trails from both agents
    const winston = await this.createWinstonAgent();
    const murat = await this.createMuratAgent();

    const winstonDecisions = winston.getDecisionAuditTrail();
    const muratDecisions = murat.getDecisionAuditTrail();

    // Convert and merge Winston's decisions
    const winstonTechnicalDecisions = this.convertDecisionRecordsToTechnicalDecisions(
      winstonDecisions,
      'winston'
    );
    logger.mergeDecisions(winstonTechnicalDecisions);

    // Convert and merge Murat's decisions
    const muratTechnicalDecisions = this.convertDecisionRecordsToTechnicalDecisions(
      muratDecisions,
      'murat'
    );
    logger.mergeDecisions(muratTechnicalDecisions);

    // Generate ADR section markdown
    const decisionsSection = logger.generateADRSection();

    // Update architecture document
    this.architectureContent = this.replaceSection(this.architectureContent, 'Technical Decisions', decisionsSection);
    await fs.writeFile(this.state.variables.architecture_output_path, this.architectureContent, 'utf-8');

    console.log(`[ArchitectureWorkflowExecutor] Technical Decisions completed (${winstonDecisions.length + muratDecisions.length} decisions)`);
  }

  /**
   * Step 8: Security Gate Validation
   *
   * Validates architecture completeness for security requirements using SecurityGateValidator.
   * Implements mandatory security gate with 95% pass threshold (19/20 checks).
   *
   * Pass: Continue to Step 9 (Architecture Validation)
   * Fail: Generate gap report, create escalation, BLOCK workflow progression
   */
  private async executeStep8(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 8: Security Gate Validation');

    if (!this.state) throw new Error('State not initialized');

    const architecturePath = this.state.variables.architecture_output_path;

    // Validate architecture security completeness
    const validator = new SecurityGateValidator();
    const result = await validator.validate(architecturePath);

    // Update state with validation result
    this.state.securityGate.score = result.overallScore;
    this.state.securityGate.gaps = result.gaps;

    // Audit trail logging
    console.log(`[ArchitectureWorkflowExecutor] Security Gate Result: ${result.overallScore}% (${result.passed ? 'PASSED' : 'FAILED'})`);
    console.log(`[ArchitectureWorkflowExecutor] Checks: ${result.checks.filter(c => c.satisfied).length}/${result.checks.length} satisfied`);

    if (result.passed) {
      // PASS: Update state and continue workflow
      this.state.securityGate.status = 'passed';

      console.log('[ArchitectureWorkflowExecutor] ✅ Security gate PASSED - all security requirements satisfied');

      this.emit('security_gate.passed', {
        projectId: this.state.project.id,
        score: result.overallScore,
        timestamp: result.timestamp
      });

    } else {
      // FAIL: Generate gap report, create escalation, BLOCK workflow
      this.state.securityGate.status = 'failed';

      console.log('[ArchitectureWorkflowExecutor] ❌ Security gate FAILED - security requirements incomplete');
      console.log(`[ArchitectureWorkflowExecutor] Gaps: ${result.gaps.length} unsatisfied checks`);

      // Generate detailed gap report
      const gapReport = validator.generateGapReport(result);

      // Write gap report to file system
      const gapReportPath = architecturePath.replace('.md', '-security-gaps.md');
      await fs.writeFile(gapReportPath, gapReport, 'utf-8');
      console.log(`[ArchitectureWorkflowExecutor] Gap report written to: ${gapReportPath}`);

      // Create escalation for human review
      const escalationId = await this.escalationQueue.add({
        workflowId: this.state.workflow,
        step: 8,
        question: 'Security gate validation failed. Review gap report and update architecture to address security requirements before continuing to solutioning phase.',
        aiReasoning: `Architecture scored ${result.overallScore}% on security gate validation. Pass threshold is 95%. ${result.gaps.length} security checks failed. See gap report at ${gapReportPath} for details.`,
        confidence: 1.0,
        context: {
          score: result.overallScore,
          passThreshold: 95,
          gaps: result.gaps,
          gapReportPath,
          architecturePath
        }
      });

      console.log(`[ArchitectureWorkflowExecutor] Escalation created: ${escalationId}`);
      console.log('[ArchitectureWorkflowExecutor] Workflow BLOCKED - user review and approval required');

      this.emit('security_gate.failed', {
        projectId: this.state.project.id,
        score: result.overallScore,
        gaps: result.gaps,
        escalationId,
        gapReportPath,
        timestamp: result.timestamp
      });

      // BLOCK workflow progression
      throw new Error(
        `Security gate validation failed (${result.overallScore}% < 95% threshold). ` +
        `${result.gaps.length} security checks unsatisfied. ` +
        `Review gap report at ${gapReportPath} and resolve escalation ${escalationId} before continuing.`
      );
    }
  }

  /**
   * Step 9: Architecture Validation
   * Validates architecture completeness, PRD traceability, test strategy, and consistency
   * Pass threshold: 85% overall quality score
   */
  private async executeStep9(): Promise<void> {
    console.log('[ArchitectureWorkflowExecutor] Step 9: Architecture Validation');

    if (!this.state) throw new Error('State not initialized');

    const architecturePath = this.state.variables.architecture_output_path;
    const prdPath = this.state.variables.prd_path;

    console.log('[ArchitectureWorkflowExecutor] Validating architecture quality...');
    console.log(`[ArchitectureWorkflowExecutor] Architecture: ${architecturePath}`);
    console.log(`[ArchitectureWorkflowExecutor] PRD: ${prdPath}`);

    // Create validator and execute validation
    const validator = new ArchitectureValidator();
    const result = await validator.validate(architecturePath, prdPath);

    console.log(`[ArchitectureWorkflowExecutor] Validation Result: ${result.overallScore}% (${result.passed ? 'PASSED' : 'FAILED'})`);
    console.log(`[ArchitectureWorkflowExecutor] Completeness: ${result.completeness.score}%`);
    console.log(`[ArchitectureWorkflowExecutor] Traceability: ${result.traceability.score}%`);
    console.log(`[ArchitectureWorkflowExecutor] Test Strategy: ${result.testStrategy.score}%`);
    console.log(`[ArchitectureWorkflowExecutor] Consistency: ${result.consistency.score}%`);

    if (result.passed) {
      // PASS: Update state and complete workflow
      this.state.validation.status = 'passed';
      this.state.validation.overallScore = result.overallScore;
      this.state.validation.completenessScore = result.completeness.score;
      this.state.validation.traceabilityScore = result.traceability.score;
      this.state.validation.testStrategyScore = result.testStrategy.score;
      this.state.validation.consistencyScore = result.consistency.score;

      console.log('[ArchitectureWorkflowExecutor] ✅ Architecture validation PASSED - quality standards met');

      this.emit('validation.passed', {
        projectId: this.state.project.id,
        overallScore: result.overallScore,
        scores: {
          completeness: result.completeness.score,
          traceability: result.traceability.score,
          testStrategy: result.testStrategy.score,
          consistency: result.consistency.score
        },
        timestamp: result.timestamp
      });

      // Mark workflow as completed
      this.state.status = 'completed';
      console.log('[ArchitectureWorkflowExecutor] Workflow completed successfully');

    } else {
      // FAIL: Generate validation report, create escalation, BLOCK workflow
      this.state.validation.status = 'failed';
      this.state.validation.overallScore = result.overallScore;
      this.state.validation.completenessScore = result.completeness.score;
      this.state.validation.traceabilityScore = result.traceability.score;
      this.state.validation.testStrategyScore = result.testStrategy.score;
      this.state.validation.consistencyScore = result.consistency.score;

      console.log('[ArchitectureWorkflowExecutor] ❌ Architecture validation FAILED - quality standards not met');
      console.log(`[ArchitectureWorkflowExecutor] Completeness gaps: ${result.completeness.incompleteSections.length}`);
      console.log(`[ArchitectureWorkflowExecutor] Traceability gaps: ${result.traceability.unaddressedRequirements.length}`);
      console.log(`[ArchitectureWorkflowExecutor] Test strategy gaps: ${result.testStrategy.missingElements.length}`);
      console.log(`[ArchitectureWorkflowExecutor] Consistency conflicts: ${result.consistency.conflicts.length}`);

      // Generate detailed validation report
      const validationReport = validator.generateValidationReport(result);

      // Write validation report to file system
      const validationReportPath = architecturePath.replace('.md', '-validation-report.md');
      await fs.writeFile(validationReportPath, validationReport, 'utf-8');
      console.log(`[ArchitectureWorkflowExecutor] Validation report written to: ${validationReportPath}`);

      // Create escalation for human review
      const escalationId = await this.escalationQueue.add({
        workflowId: this.state.workflow,
        step: 9,
        question: 'Architecture validation failed. Review validation report and update architecture to meet quality standards before continuing.',
        aiReasoning: `Architecture scored ${result.overallScore}% on quality validation. Pass threshold is 85%. ` +
          `Completeness: ${result.completeness.score}%, Traceability: ${result.traceability.score}%, ` +
          `Test Strategy: ${result.testStrategy.score}%, Consistency: ${result.consistency.score}%. ` +
          `See validation report at ${validationReportPath} for details.`,
        confidence: 1.0,
        context: {
          overallScore: result.overallScore,
          passThreshold: 85,
          completenessScore: result.completeness.score,
          traceabilityScore: result.traceability.score,
          testStrategyScore: result.testStrategy.score,
          consistencyScore: result.consistency.score,
          incompleteSections: result.completeness.incompleteSections.length,
          unaddressedRequirements: result.traceability.unaddressedRequirements.length,
          missingTestElements: result.testStrategy.missingElements.length,
          conflicts: result.consistency.conflicts.length,
          validationReportPath,
          architecturePath,
          prdPath
        }
      });

      console.log(`[ArchitectureWorkflowExecutor] Escalation created: ${escalationId}`);
      console.log('[ArchitectureWorkflowExecutor] Workflow BLOCKED - user review and approval required');

      this.emit('validation.failed', {
        projectId: this.state.project.id,
        overallScore: result.overallScore,
        scores: {
          completeness: result.completeness.score,
          traceability: result.traceability.score,
          testStrategy: result.testStrategy.score,
          consistency: result.consistency.score
        },
        gaps: {
          incompleteSections: result.completeness.incompleteSections.length,
          unaddressedRequirements: result.traceability.unaddressedRequirements.length,
          missingTestElements: result.testStrategy.missingElements.length,
          conflicts: result.consistency.conflicts.length
        },
        escalationId,
        validationReportPath,
        timestamp: result.timestamp
      });

      // BLOCK workflow progression
      throw new Error(
        `Architecture validation failed (${result.overallScore}% < 85% threshold). ` +
        `Review validation report at ${validationReportPath} and resolve escalation ${escalationId} before continuing.`
      );
    }
  }

  /**
   * Create Winston agent instance
   */
  private async createWinstonAgent(): Promise<WinstonAgent> {
    if (!this.winstonAgent) {
      this.winstonAgent = await WinstonAgent.create(
        {
          provider: 'claude-code',
          model: 'claude-sonnet-4-5'
        },
        this.llmFactory,
        this.decisionEngine,
        this.escalationQueue
      );
    }
    return this.winstonAgent;
  }

  /**
   * Create Murat agent instance
   */
  private async createMuratAgent(): Promise<MuratAgent> {
    if (!this.muratAgent) {
      this.muratAgent = await MuratAgent.create(
        {
          provider: 'openai',
          model: 'gpt-4-turbo'
        },
        this.llmFactory,
        this.decisionEngine,
        this.escalationQueue
      );
    }
    return this.muratAgent;
  }

  /**
   * Invoke function with retry logic
   *
   * @param fn - Function to invoke
   * @param maxRetries - Maximum retry attempts
   * @param methodName - Method name for logging
   * @returns Result from function
   */
  private async invokeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    methodName: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ArchitectureWorkflowExecutor] ${methodName} failed (attempt ${attempt + 1}/${maxRetries}):`, error);

        if (attempt < maxRetries - 1) {
          // Exponential backoff
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries exhausted - escalate
    this.metrics.escalationCount++;
    throw new Error(
      `${methodName} failed after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Replace section in architecture document
   *
   * @param content - Current document content
   * @param sectionName - Section name to replace
   * @param newContent - New section content
   * @returns Updated document content
   */
  private replaceSection(content: string, sectionName: string, newContent: string): string {
    const sectionRegex = new RegExp(`(## ${sectionName}\\s*)([\\s\\S]*?)(?=\\n## |$)`, 'i');
    const match = content.match(sectionRegex);

    if (match) {
      return content.replace(sectionRegex, `$1\n\n${newContent}\n\n`);
    } else {
      // Section doesn't exist, append it
      return `${content}\n\n## ${sectionName}\n\n${newContent}\n`;
    }
  }

  /**
   * Load workflow state from file
   *
   * @param projectId - Project identifier
   * @returns Workflow state or null
   */
  private async loadState(projectId: string): Promise<WorkflowState | null> {
    try {
      return await this.stateManager.loadState(projectId);
    } catch {
      return null;
    }
  }

  /**
   * Finalize performance metrics
   */
  private finalizeMetrics(): void {
    this.metrics.endTime = Date.now();
    this.metrics.totalDuration = this.metrics.endTime - this.metrics.startTime;

    // Calculate estimated cost
    // Claude Sonnet: $3 input / $15 output per 1M tokens
    // GPT-4 Turbo: $10 input / $30 output per 1M tokens
    const winstonCost =
      (this.metrics.tokenUsage.winston.input * 3 + this.metrics.tokenUsage.winston.output * 15) / 1_000_000;
    const muratCost =
      (this.metrics.tokenUsage.murat.input * 10 + this.metrics.tokenUsage.murat.output * 30) / 1_000_000;

    this.metrics.estimatedCost = winstonCost + muratCost;

    // Warn if exceeded targets
    if (this.metrics.totalDuration && this.metrics.totalDuration > 45 * 60 * 1000) {
      console.warn(`[ArchitectureWorkflowExecutor] WARNING: Workflow exceeded 45-minute target (${(this.metrics.totalDuration / 1000 / 60).toFixed(2)} minutes)`);
    }

    if (this.metrics.estimatedCost > 10) {
      console.warn(`[ArchitectureWorkflowExecutor] WARNING: Estimated cost exceeded $10 target ($${this.metrics.estimatedCost.toFixed(2)})`);
    }

    if (this.metrics.escalationCount > 2) {
      console.warn(`[ArchitectureWorkflowExecutor] WARNING: Escalation count exceeded target of 2 (${this.metrics.escalationCount} escalations)`);
    }
  }

  // ===== HELPER METHODS FOR PRD EXTRACTION =====

  private extractRequirements(prdContent: string): string[] {
    // Simple extraction - looks for bullet points or numbered lists
    const lines = prdContent.split('\n');
    const requirements: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        requirements.push(trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''));
      }
    }

    return requirements.length > 0 ? requirements : ['Extract requirements from PRD'];
  }

  private extractEntities(prdContent: string): string[] {
    // Simple extraction - looks for entities mentioned in PRD
    const entities = new Set<string>();
    const words = prdContent.match(/\b[A-Z][a-z]+\b/g) || [];

    for (const word of words) {
      if (word.length > 3 && !['This', 'That', 'The', 'For', 'And', 'But'].includes(word)) {
        entities.add(word);
      }
    }

    return Array.from(entities).slice(0, 10); // Limit to 10 entities
  }

  private extractAPIRequirements(_prdContent: string): any[] {
    // Default API requirements (parameter unused in MVP - will be enhanced later)
    return [
      { method: 'GET', path: '/api/resource', description: 'Get resource', authentication: 'JWT', authorization: 'User' },
      { method: 'POST', path: '/api/resource', description: 'Create resource', authentication: 'JWT', authorization: 'Admin' }
    ];
  }

  private extractNFRRequirements(prdContent: string): string {
    // Extract NFR sections from PRD
    const nfrSection = prdContent.match(/## Non-Functional Requirements([\s\S]*?)(?=\n## |$)/i);
    return nfrSection?.[1]?.trim() || 'Performance, security, and reliability requirements';
  }

  private extractTechStack(_architectureContent: string): string[] {
    // Extract tech stack from architecture content (parameter unused in MVP - will be enhanced later)
    const techStack = new Set<string>(['TypeScript', 'Node.js', 'PostgreSQL', 'REST API']);
    return Array.from(techStack);
  }

  private extractAcceptanceCriteria(_prdContent: string): string[] {
    // Extract acceptance criteria from PRD (parameter unused in MVP - will be enhanced later)
    return ['System must handle user authentication', 'System must validate input data'];
  }

  // ===== FORMATTING METHODS =====

  private formatComponentDesigns(components: any[]): string {
    return components.map(c => `### ${c.name}\n\n**Responsibility:** ${c.responsibility}\n\n**Dependencies:** ${c.dependencies.join(', ')}\n`).join('\n');
  }

  private formatDataModels(models: any[]): string {
    return models.map(m => `### ${m.name}\n\n${m.description}\n\n**Attributes:**\n${m.attributes.map((a: any) => `- ${a.name}: ${a.type}${a.required ? ' (required)' : ''}`).join('\n')}\n`).join('\n');
  }

  private formatAPISpecifications(specs: any[]): string {
    return specs.map(s => `### ${s.method} ${s.path}\n\n${s.description}\n\n**Authentication:** ${s.authentication}\n**Authorization:** ${s.authorization}\n`).join('\n');
  }

  private formatNFRSection(nfrs: any): string {
    return `### Performance\n\n- Latency: ${nfrs.performance.latency}\n- Throughput: ${nfrs.performance.throughput}\n\n### Security\n\n- Authentication: ${nfrs.security.authentication}\n- Authorization: ${nfrs.security.authorization}\n`;
  }

  private formatTestStrategy(testStrategy: any, frameworks: any[], pyramid: any, pipeline: any, qualityGates: any[], atdd: any): string {
    let section = `### Test Philosophy\n\n${testStrategy.philosophy}\n\n`;
    section += `### Frameworks\n\n${frameworks.map(f => `- **${f.category}:** ${f.framework} - ${f.rationale}`).join('\n')}\n\n`;
    section += `### Test Pyramid\n\n- Unit Tests: ${pyramid.unitPercentage}%\n- Integration Tests: ${pyramid.integrationPercentage}%\n- E2E Tests: ${pyramid.e2ePercentage}%\n\n`;
    section += `### CI/CD Pipeline\n\n${pipeline.stages.map((s: any) => `1. ${s.name}: ${s.description}`).join('\n')}\n\n`;
    section += `### Quality Gates\n\n${qualityGates.map(g => `- ${g.metric}: ${g.threshold}`).join('\n')}\n\n`;
    section += `### ATDD Approach\n\n${atdd.description}\n`;
    return section;
  }

  /**
   * Convert DecisionRecord array to TechnicalDecision array
   *
   * @param decisions - Array of DecisionRecord from Winston or Murat
   * @param decisionMaker - 'winston' or 'murat'
   * @returns Array of TechnicalDecision
   */
  private convertDecisionRecordsToTechnicalDecisions(
    decisions: WinstonDecisionRecord[] | MuratDecisionRecord[],
    decisionMaker: 'winston' | 'murat'
  ): TechnicalDecision[] {
    return decisions.map((record) => ({
      id: '', // Will be assigned by logger
      title: record.question,
      context: `Decision made during ${record.method} execution`,
      decision: String(record.decision.decision),
      alternatives: [], // DecisionRecord doesn't include alternatives
      rationale: record.decision.reasoning || 'See decision details',
      consequences: [], // DecisionRecord doesn't include consequences
      status: 'accepted' as const,
      decisionMaker,
      date: record.timestamp,
      confidence: record.decision.confidence
    }));
  }
}
