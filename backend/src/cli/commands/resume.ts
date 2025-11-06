/**
 * resume command
 * Resume paused workflow
 */

import { StateManager } from '../../core/StateManager.js';
import { WorkflowEngine } from '../../core/WorkflowEngine.js';
import { colors } from '../utils/colors.js';
import { handleError, StateLoadError, exitWithCode } from '../utils/error-handler.js';

interface ResumeOptions {
  project: string;
  yolo?: boolean;
}

/**
 * Resume command handler
 */
export async function resume(options: ResumeOptions): Promise<void> {
  try {
    const { project: projectId, yolo } = options;

    console.log(colors.header(`\n▶️  Resuming Workflow`));
    console.log(colors.info(`   Project: ${projectId}\n`));

    // Load workflow state
    const projectRoot = process.cwd();
    const stateManager = new StateManager(projectRoot);
    const state = await stateManager.loadState(projectId);

    if (!state) {
      throw new StateLoadError(projectId, 'No workflow state found. Start a workflow first.');
    }

    // Check current status
    if (state.status === 'running') {
      console.log(colors.warning(`⚠️  Workflow is already running`));
      console.log(colors.info(`\n💡 Check status:`));
      console.log(colors.dim(`   orchestrator status --project ${projectId}\n`));
      exitWithCode(true);
      return;
    }

    if (state.status === 'completed') {
      console.log(colors.warning(`⚠️  Workflow is already completed`));
      console.log(colors.info(`   Cannot resume a completed workflow\n`));
      exitWithCode(true);
      return;
    }

    if (state.status !== 'paused' && state.status !== 'error') {
      console.log(colors.warning(`⚠️  Workflow is in unexpected state: ${state.status}`));
      console.log(colors.info(`   Can only resume paused or error state workflows\n`));
      exitWithCode(false);
      return;
    }

    // Display resume information
    console.log(colors.dim('→ Loading workflow state...'));
    console.log(colors.success(`✓ Found state at step ${state.currentStep}`));
    console.log(colors.success(`✓ Workflow: ${state.currentWorkflow}`));

    // Create workflow engine
    console.log(colors.dim('→ Initializing workflow engine...'));
    const engine = new WorkflowEngine(state.currentWorkflow, {
      projectRoot,
      yoloMode: yolo || false
    });

    // Resume from state
    console.log(colors.info(`\n📋 Resuming workflow from step ${state.currentStep}${yolo ? ' (YOLO mode)' : ''}...\n`));

    await engine.resumeFromState(state);

    console.log(colors.success(`\n✅ Workflow resumed and completed successfully!`));
    console.log(colors.info(`\n💡 Next steps:`));
    console.log(colors.info(`   - Check status: orchestrator status --project ${projectId}`));
    console.log(colors.info(`   - View logs: orchestrator logs --project ${projectId}`));
    console.log();

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to resume workflow');
    exitWithCode(false);
  }
}
