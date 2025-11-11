/**
 * run-prd-workflow command
 * Execute PRD workflow to generate Product Requirements Document
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { PRDWorkflowExecutor } from '../../core/workflows/prd-workflow-executor.js';
import { AgentPool } from '../../core/AgentPool.js';
import { DecisionEngine } from '../../core/services/decision-engine.js';
import { EscalationQueue } from '../../core/services/escalation-queue.js';
import { StateManager } from '../../core/StateManager.js';
import { ProjectConfig } from '../../config/ProjectConfig.js';
import { LLMFactory } from '../../llm/LLMFactory.js';
import { colors } from '../utils/colors.js';
import { handleError, ProjectNotFoundError, WorkflowNotFoundError, exitWithCode } from '../utils/error-handler.js';

interface RunPRDWorkflowOptions {
  projectPath?: string;
  verbose?: boolean;
  yolo?: boolean;
  maxEscalations?: number;
  timeout?: number;
}

/**
 * Run PRD workflow command handler
 */
export async function runPRDWorkflow(options: RunPRDWorkflowOptions): Promise<void> {
  try {
    const { projectPath: projectPathInput, yolo, maxEscalations, timeout } = options;

    // Determine project root
    const projectRoot = projectPathInput || process.cwd();

    console.log(colors.header(`\n🚀 Running PRD Workflow`));
    console.log(colors.info(`   Project: ${projectRoot}`));
    if (yolo) {
      console.log(colors.info(`   Mode: YOLO (autonomous, no prompts)`));
    }
    console.log();

    // Validate project exists
    const configPath = path.join(projectRoot, '.bmad', 'project-config.yaml');
    try {
      await fs.access(configPath);
    } catch {
      throw new ProjectNotFoundError(projectRoot);
    }

    // Load project config
    console.log(colors.dim('→ Loading project configuration...'));
    const projectConfig = await ProjectConfig.loadConfig(configPath);
    const projectMetadata = projectConfig.getProjectMetadata();
    console.log(colors.success(`✓ Loaded project: ${projectMetadata.name}`));

    // Validate workflow file exists
    const workflowPath = path.join(projectRoot, 'bmad', 'bmm', 'workflows', 'prd', 'workflow.yaml');
    try {
      await fs.access(workflowPath);
    } catch {
      throw new WorkflowNotFoundError(workflowPath);
    }
    console.log(colors.success(`✓ Found PRD workflow: ${workflowPath}`));

    // Create workflow dependencies
    console.log(colors.dim('→ Initializing workflow components...'));

    const stateManager = new StateManager(projectRoot);
    const llmFactory = new LLMFactory();
    const agentPool = new AgentPool(llmFactory, projectConfig);
    const decisionEngine = new DecisionEngine(
      llmFactory,
      { provider: 'claude-code', model: 'claude-sonnet-4-5', maxTokens: 2000 },
      path.join(projectRoot, '.bmad', 'onboarding')
    );
    const escalationQueue = new EscalationQueue(path.join(projectRoot, '.bmad-escalations'));

    console.log(colors.success(`✓ Components initialized`));

    // Create PRD workflow executor
    console.log(colors.dim('→ Creating PRD workflow executor...'));
    const executor = new PRDWorkflowExecutor(
      agentPool,
      decisionEngine,
      escalationQueue,
      stateManager
    );

    // Load workflow configuration
    await executor.loadWorkflowConfig(workflowPath);
    console.log(colors.success(`✓ Workflow loaded: ${executor.getWorkflowName()}`));
    console.log(colors.info(`   Steps: ${executor.getSteps().length}`));

    // Execute workflow
    console.log(colors.info(`\n📋 Executing PRD workflow...\n`));

    const result = await executor.execute(projectRoot, {
      yoloMode: yolo || false,
      maxEscalations: maxEscalations || 3,
      timeout: timeout || 30 * 60 * 1000 // Default: 30 minutes
    });

    // Display results
    console.log(colors.success(`\n✅ PRD Workflow completed successfully!`));
    console.log();
    console.log(colors.header('📊 Execution Summary:'));
    console.log(colors.info(`   Output: ${result.outputPath}`));
    console.log(colors.info(`   Execution time: ${(result.executionTime / 1000).toFixed(2)}s`));
    console.log(colors.info(`   Sections generated: ${result.sectionsGenerated.length}`));
    console.log(colors.info(`   Escalations: ${result.escalationsCount} (target: <3)`));

    if (result.escalationsCount >= 3) {
      console.log(colors.warning(`   ⚠️  Escalation count is at or above target`));
    }

    console.log();
    console.log(colors.info(`💡 Next steps:`));
    console.log(colors.info(`   - Review PRD: ${result.outputPath}`));
    console.log(colors.info(`   - Check workflow status: docs/workflow-status.yaml`));
    if (result.escalationsCount > 0) {
      console.log(colors.info(`   - Review escalations: .bmad-escalations/`));
    }
    console.log();

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to run PRD workflow');
    exitWithCode(false);
  }
}
