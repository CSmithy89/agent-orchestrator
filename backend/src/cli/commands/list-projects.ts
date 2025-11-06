/**
 * list-projects command
 * List all orchestrator projects
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectConfig } from '../../config/ProjectConfig.js';
import { StateManager } from '../../core/StateManager.js';
import { colors, statusColors } from '../utils/colors.js';
import { handleError, exitWithCode } from '../utils/error-handler.js';

/**
 * List projects command handler
 */
export async function listProjects(): Promise<void> {
  try {
    console.log(colors.header(`\n📋 Orchestrator Projects\n`));

    const projectRoot = process.cwd();
    const bmadDir = path.join(projectRoot, '.bmad');

    // Check if .bmad directory exists
    try {
      await fs.access(bmadDir);
    } catch {
      console.log(colors.warning('⚠️  No .bmad directory found'));
      console.log(colors.info('\n   This directory has not been initialized as an orchestrator project.'));
      console.log(colors.info('   Initialize by creating .bmad/project-config.yaml\n'));
      exitWithCode(true);
      return;
    }

    // Load project configuration
    let projectConfig: ProjectConfig;
    let projectName = 'Unknown';
    const projectId = path.basename(projectRoot);

    try {
      projectConfig = await ProjectConfig.loadConfig();
      const metadata = projectConfig.getProjectMetadata();
      projectName = metadata.name;
    } catch {
      // Project config not found or invalid
      console.log(colors.warning('⚠️  Project configuration not found or invalid'));
      console.log(colors.info('\n   Expected: .bmad/project-config.yaml\n'));
      exitWithCode(true);
      return;
    }

    // Load workflow state
    const stateManager = new StateManager(projectRoot);
    const state = await stateManager.loadState(projectId);

    // Display project in table format
    console.log(colors.bold('┌───────────────────────────────────────────────────────────────────┐'));
    console.log(colors.bold('│ Project ID        │ Name              │ Phase          │ Status  │'));
    console.log(colors.bold('├───────────────────────────────────────────────────────────────────┤'));

    if (state) {
      const phase = await stateManager.getProjectPhase(projectId);
      const statusColor = statusColors[state.status] || statusColors.unknown;
      const statusText = state.status.charAt(0).toUpperCase() + state.status.slice(1);

      // Format table row
      const idPadded = projectId.padEnd(18).substring(0, 18);
      const namePadded = projectName.padEnd(18).substring(0, 18);
      const phaseLabel = phase.includes(':')
        ? phase.split(':', 2)[1]!.trimStart()
        : phase;
      const phasePadded = phaseLabel.padEnd(15).substring(0, 15);

      console.log(`│ ${colors.info(idPadded)}│ ${colors.info(namePadded)}│ ${colors.info(phasePadded)}│ ${statusColor(statusText.padEnd(8))}│`);
    } else {
      // No active workflow
      const idPadded = projectId.padEnd(18).substring(0, 18);
      const namePadded = projectName.padEnd(18).substring(0, 18);

      console.log(`│ ${colors.info(idPadded)}│ ${colors.info(namePadded)}│ ${colors.dim('No workflow'.padEnd(15))}│ ${colors.dim('Idle'.padEnd(8))}│`);
    }

    console.log(colors.bold('└───────────────────────────────────────────────────────────────────┘'));
    console.log();

    // Show helpful commands
    if (state) {
      console.log(colors.info('💡 View project details:'));
      console.log(colors.dim(`   orchestrator status --project ${projectId}\n`));
    } else {
      console.log(colors.info('💡 Start a workflow:'));
      console.log(colors.dim(`   orchestrator start-workflow --project ${projectId} --workflow <path>\n`));
    }

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to list projects');
    exitWithCode(false);
  }
}
