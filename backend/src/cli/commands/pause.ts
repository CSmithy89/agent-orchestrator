/**
 * pause command
 * Pause workflow execution
 */

import { StateManager } from '../../core/StateManager.js';
import { colors } from '../utils/colors.js';
import { handleError, StateLoadError, exitWithCode } from '../utils/error-handler.js';

interface PauseOptions {
  project: string;
}

/**
 * Pause command handler
 */
export async function pause(options: PauseOptions): Promise<void> {
  try {
    const { project: projectId } = options;

    console.log(colors.header(`\n⏸️  Pausing Workflow`));
    console.log(colors.info(`   Project: ${projectId}\n`));

    // Load current workflow state
    const stateManager = new StateManager(process.cwd());
    const state = await stateManager.loadState(projectId);

    if (!state) {
      throw new StateLoadError(projectId, 'No workflow state found');
    }

    // Check current status
    if (state.status === 'paused') {
      console.log(colors.warning(`⚠️  Workflow is already paused`));
      console.log(colors.info(`\n💡 To resume:`));
      console.log(colors.dim(`   orchestrator resume --project ${projectId}\n`));
      exitWithCode(true);
      return;
    }

    if (state.status === 'completed') {
      console.log(colors.warning(`⚠️  Workflow is already completed`));
      console.log(colors.info(`   Cannot pause a completed workflow\n`));
      exitWithCode(true);
      return;
    }

    if (state.status === 'error') {
      console.log(colors.warning(`⚠️  Workflow is in error state`));
      console.log(colors.info(`   Workflow will remain paused. Check logs for details.\n`));
      exitWithCode(true);
      return;
    }

    // Update status to 'paused'
    console.log(colors.dim(`→ Updating workflow status...`));
    state.status = 'paused';
    state.lastUpdate = new Date();
    await stateManager.saveState(state);

    console.log(colors.success(`\n✅ Workflow paused successfully`));
    console.log(colors.info(`   Step: ${state.currentStep}`));
    console.log(colors.info(`   Workflow: ${state.currentWorkflow}`));
    console.log(colors.info(`\n💡 To resume workflow:`));
    console.log(colors.dim(`   orchestrator resume --project ${projectId}\n`));

    // Note: In a real implementation, this would also signal the running engine
    // to stop after the current step completes. For now, state update is sufficient.

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to pause workflow');
    exitWithCode(false);
  }
}
