/**
 * list-agents command
 * List active agents for a project
 */

import { StateManager } from '../../core/StateManager.js';
import { colors } from '../utils/colors.js';
import { handleError, StateLoadError, exitWithCode } from '../utils/error-handler.js';
import { AgentActivity } from '../../types/workflow.types.js';

interface ListAgentsOptions {
  project: string;
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Estimate cost based on agent activity (rough estimate)
 */
function estimateCost(activities: AgentActivity[]): number {
  // This is a placeholder - real implementation would use actual model pricing
  // Rough estimate: $0.01 per agent action
  return activities.length * 0.01;
}

/**
 * List agents command handler
 */
export async function listAgents(options: ListAgentsOptions): Promise<void> {
  try {
    const { project: projectId } = options;

    console.log(colors.header(`\n🤖 Active Agents`));
    console.log(colors.info(`   Project: ${projectId}\n`));

    // Load state
    const stateManager = new StateManager(process.cwd());
    const state = await stateManager.loadState(projectId);

    if (!state) {
      throw new StateLoadError(projectId);
    }

    // Check if there are any agent activities
    if (state.agentActivity.length === 0) {
      console.log(colors.dim('   No agent activity recorded yet'));
      console.log(colors.info('\n   Agents will appear here once workflow execution begins.\n'));
      exitWithCode(true);
      return;
    }

    // Group activities by agent
    const agentMap = new Map<string, AgentActivity[]>();
    for (const activity of state.agentActivity) {
      const agentActivities = agentMap.get(activity.agentId) || [];
      agentActivities.push(activity);
      agentMap.set(activity.agentId, agentActivities);
    }

    // Display table header
    console.log(colors.bold('┌──────────────────────────────────────────────────────────────────────────┐'));
    console.log(colors.bold('│ Agent Name      │ Model      │ Status     │ Duration   │ Est. Cost  │'));
    console.log(colors.bold('├──────────────────────────────────────────────────────────────────────────┤'));

    // Display each agent
    for (const [, activities] of agentMap.entries()) {
      const latestActivity = activities[activities.length - 1];
      const agentName = latestActivity.agentName.padEnd(16).substring(0, 16);

      // Determine model (placeholder - would come from agent config)
      const model = 'Claude 3.5'.padEnd(11).substring(0, 11);

      // Status
      const status = latestActivity.status === 'completed' ? colors.success('Completed') :
                     latestActivity.status === 'failed' ? colors.error('Failed   ') :
                     colors.warning('Running  ');

      // Calculate total duration
      const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
      const duration = formatDuration(totalDuration).padEnd(11).substring(0, 11);

      // Estimate cost
      const cost = estimateCost(activities).toFixed(2).padStart(9);

      console.log(`│ ${colors.info(agentName)}│ ${colors.info(model)}│ ${status}│ ${colors.info(duration)}│ $${colors.info(cost)} │`);
    }

    console.log(colors.bold('└──────────────────────────────────────────────────────────────────────────┘'));

    // Show total cost
    const totalCost = estimateCost(state.agentActivity);
    console.log(colors.info(`\nTotal estimated cost: ${colors.bold('$' + totalCost.toFixed(2))}`));
    console.log(colors.dim('Note: Cost estimates are approximate\n'));

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to list agents');
    exitWithCode(false);
  }
}
