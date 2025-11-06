/**
 * status command
 * Show project status and progress
 */

import { StateManager } from '../../core/StateManager.js';
import { colors, statusColors } from '../utils/colors.js';
import { handleError, exitWithCode } from '../utils/error-handler.js';

interface StatusOptions {
  project: string;
}

/**
 * Status command handler
 */
export async function status(options: StatusOptions): Promise<void> {
  try {
    const { project: projectId } = options;

    console.log(colors.header(`\n📊 Project Status`));
    console.log(colors.info(`   Project: ${projectId}\n`));

    // Load state
    const stateManager = new StateManager(process.cwd());
    const state = await stateManager.loadState(projectId);

    if (!state) {
      console.log(colors.warning(`⚠️  No active workflow for project: ${projectId}`));
      console.log(colors.info(`\n💡 To start a workflow, run:`));
      console.log(colors.dim(`   orchestrator start-workflow --project ${projectId} --workflow <path>\n`));
      exitWithCode(true);
      return;
    }

    // Display project information
    console.log(colors.bold('Project Information:'));
    console.log(colors.info(`   Name: ${state.project.name}`));
    console.log(colors.info(`   ID: ${state.project.id}`));
    console.log(colors.info(`   Level: ${state.project.level}`));
    console.log();

    // Get and display phase
    const phase = await stateManager.getProjectPhase(projectId);
    console.log(colors.bold('Current Phase:'));
    console.log(colors.info(`   ${phase}`));
    console.log();

    // Display workflow information
    console.log(colors.bold('Workflow Progress:'));
    console.log(colors.info(`   Workflow: ${state.currentWorkflow}`));
    console.log(colors.info(`   Step: ${state.currentStep}`));
    console.log();

    // Color-code by status
    const statusColor = statusColors[state.status] || statusColors.unknown;
    console.log(colors.bold('Status:'));
    console.log(statusColor(`   ${state.status.toUpperCase()}`));
    console.log();

    // Display timing information
    console.log(colors.bold('Timing:'));
    console.log(colors.info(`   Started: ${state.startTime.toLocaleString()}`));
    console.log(colors.info(`   Last Updated: ${state.lastUpdate.toLocaleString()}`));
    console.log();

    // Active agents
    if (state.agentActivity.length > 0) {
      console.log(colors.bold('Recent Agent Activity:'));
      const recentActivities = state.agentActivity.slice(-5);
      recentActivities.forEach(agent => {
        const statusIcon = agent.status === 'completed' ? '✅' :
                          agent.status === 'failed' ? '❌' : '⏳';
        const time = agent.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log(colors.info(`   ${statusIcon} [${time}] ${agent.agentName}: ${agent.action}`));
      });
      console.log();
    }

    // Suggest next actions based on status
    if (state.status === 'paused') {
      console.log(colors.info('💡 To resume workflow:'));
      console.log(colors.dim(`   orchestrator resume --project ${projectId}\n`));
    } else if (state.status === 'error') {
      console.log(colors.warning('⚠️  Workflow encountered an error'));
      console.log(colors.info('💡 Check logs for details:'));
      console.log(colors.dim(`   orchestrator logs --project ${projectId}\n`));
    } else if (state.status === 'running') {
      console.log(colors.info('💡 To pause workflow:'));
      console.log(colors.dim(`   orchestrator pause --project ${projectId}\n`));
    } else if (state.status === 'completed') {
      console.log(colors.success('✅ Workflow completed successfully!\n'));
    }

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to get project status');
    exitWithCode(false);
  }
}
