/**
 * state command
 * Show detailed workflow state
 */

import { StateManager } from '../../core/StateManager.js';
import { colors } from '../utils/colors.js';
import { handleError, StateLoadError, exitWithCode } from '../utils/error-handler.js';

interface StateOptions {
  project: string;
  json?: boolean;
}

/**
 * State command handler
 */
export async function state(options: StateOptions): Promise<void> {
  try {
    const { project: projectId, json } = options;

    // Load state
    const stateManager = new StateManager(process.cwd());
    const workflowState = await stateManager.loadState(projectId);

    if (!workflowState) {
      throw new StateLoadError(projectId);
    }

    // JSON output
    if (json) {
      const jsonOutput = {
        project: workflowState.project,
        currentWorkflow: workflowState.currentWorkflow,
        currentStep: workflowState.currentStep,
        status: workflowState.status,
        variables: workflowState.variables,
        agentActivity: workflowState.agentActivity.map(a => ({
          agentId: a.agentId,
          agentName: a.agentName,
          action: a.action,
          timestamp: a.timestamp.toISOString(),
          duration: a.duration,
          status: a.status,
          output: a.output
        })),
        startTime: workflowState.startTime.toISOString(),
        lastUpdate: workflowState.lastUpdate.toISOString()
      };

      console.log(JSON.stringify(jsonOutput, null, 2));
      exitWithCode(true);
      return;
    }

    // Human-readable output
    console.log(colors.header(`\n🔍 Detailed Workflow State`));
    console.log(colors.info(`   Project: ${projectId}\n`));

    // Project information
    console.log(colors.bold('Project:'));
    console.log(colors.info(`   ID: ${workflowState.project.id}`));
    console.log(colors.info(`   Name: ${workflowState.project.name}`));
    console.log(colors.info(`   Level: ${workflowState.project.level}`));
    console.log();

    // Workflow information
    console.log(colors.bold('Workflow:'));
    console.log(colors.info(`   Path: ${workflowState.currentWorkflow}`));
    console.log(colors.info(`   Current Step: ${workflowState.currentStep}`));
    console.log(colors.info(`   Status: ${workflowState.status}`));
    console.log();

    // Timing
    console.log(colors.bold('Timing:'));
    console.log(colors.info(`   Started: ${workflowState.startTime.toLocaleString()}`));
    console.log(colors.info(`   Last Updated: ${workflowState.lastUpdate.toLocaleString()}`));
    const elapsed = workflowState.lastUpdate.getTime() - workflowState.startTime.getTime();
    const elapsedMinutes = Math.floor(elapsed / 1000 / 60);
    console.log(colors.info(`   Elapsed: ${elapsedMinutes} minutes`));
    console.log();

    // Variables
    console.log(colors.bold('Variables:'));
    const varKeys = Object.keys(workflowState.variables);
    if (varKeys.length > 0) {
      varKeys.forEach(key => {
        const value = typeof workflowState.variables[key] === 'object'
          ? JSON.stringify(workflowState.variables[key])
          : String(workflowState.variables[key]);
        console.log(colors.info(`   ${key}: ${colors.dim(value)}`));
      });
    } else {
      console.log(colors.dim('   (No variables set)'));
    }
    console.log();

    // Agent activity
    console.log(colors.bold('Agent Activity:'));
    if (workflowState.agentActivity.length > 0) {
      console.log(colors.info(`   Total actions: ${workflowState.agentActivity.length}`));
      console.log(colors.info(`   Agents used: ${new Set(workflowState.agentActivity.map(a => a.agentName)).size}`));

      console.log();
      console.log(colors.dim('   Recent activity (last 10):'));
      const recentActivities = workflowState.agentActivity.slice(-10);
      recentActivities.forEach(activity => {
        const statusIcon = activity.status === 'completed' ? '✅' :
                          activity.status === 'failed' ? '❌' : '⏳';
        const time = activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log(colors.info(`   ${statusIcon} [${time}] ${activity.agentName}: ${activity.action}`));
      });
    } else {
      console.log(colors.dim('   (No agent activity recorded)'));
    }
    console.log();

    // Helpful commands
    console.log(colors.info('💡 For JSON output (machine-readable):'));
    console.log(colors.dim(`   orchestrator state --project ${projectId} --json\n`));

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to get workflow state');
    exitWithCode(false);
  }
}
