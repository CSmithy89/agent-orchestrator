/**
 * start-workflow command
 * Start workflow execution for a project
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowEngine } from '../../core/WorkflowEngine.js';
import { ProjectConfig } from '../../config/ProjectConfig.js';
import { colors } from '../utils/colors.js';
import { handleError, ProjectNotFoundError, WorkflowNotFoundError, exitWithCode } from '../utils/error-handler.js';

interface StartWorkflowOptions {
  project: string;
  workflow: string;
  verbose?: boolean;
  yolo?: boolean;
}

/**
 * Start workflow command handler
 */
export async function startWorkflow(options: StartWorkflowOptions): Promise<void> {
  try {
    const { project: projectId, workflow: workflowPath, yolo } = options;

    console.log(colors.header(`\n🚀 Starting Workflow`));
    console.log(colors.info(`   Project: ${projectId}`));
    console.log(colors.info(`   Workflow: ${workflowPath}\n`));

    // Validate project exists
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, '.bmad', 'project-config.yaml');

    try {
      await fs.access(configPath);
    } catch {
      throw new ProjectNotFoundError(projectId);
    }

    // Load project config
    console.log(colors.dim('→ Loading project configuration...'));
    const projectConfig = await ProjectConfig.loadConfig(configPath);
    const projectMetadata = projectConfig.getProjectMetadata();
    console.log(colors.success(`✓ Loaded project: ${projectMetadata.name}`));

    // Validate workflow file exists
    const resolvedWorkflowPath = path.isAbsolute(workflowPath)
      ? workflowPath
      : path.join(projectRoot, workflowPath);

    try {
      await fs.access(resolvedWorkflowPath);
    } catch {
      throw new WorkflowNotFoundError(workflowPath);
    }

    console.log(colors.success(`✓ Found workflow file: ${resolvedWorkflowPath}`));

    // Create workflow engine
    console.log(colors.dim('→ Initializing workflow engine...'));
    const engine = new WorkflowEngine(resolvedWorkflowPath, {
      projectRoot,
      yoloMode: yolo || false
    });

    // Execute workflow
    console.log(colors.info(`\n📋 Executing workflow${yolo ? ' (YOLO mode - skipping prompts)' : ''}...\n`));

    await engine.execute();

    console.log(colors.success(`\n✅ Workflow completed successfully!`));
    console.log(colors.info(`\n💡 Next steps:`));
    console.log(colors.info(`   - Check status: orchestrator status --project ${projectId}`));
    console.log(colors.info(`   - View logs: orchestrator logs --project ${projectId}`));
    console.log();

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to start workflow');
    exitWithCode(false);
  }
}
