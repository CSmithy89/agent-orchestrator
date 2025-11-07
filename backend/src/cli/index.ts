#!/usr/bin/env node

/**
 * Agent Orchestrator CLI
 * Command-line interface for local orchestrator control
 */

import { Command } from 'commander';
import { startWorkflow } from './commands/start-workflow.js';
import { pause } from './commands/pause.js';
import { resume } from './commands/resume.js';
import { status } from './commands/status.js';
import { logs } from './commands/logs.js';
import { listProjects } from './commands/list-projects.js';
import { listAgents } from './commands/list-agents.js';
import { state } from './commands/state.js';
import { runPRDWorkflow } from './commands/run-prd-workflow.js';
import { colors } from './utils/colors.js';

// Create CLI program
const program = new Command();

// Configure program
program
  .name('orchestrator')
  .description('Agent Orchestrator - Autonomous BMAD workflow execution')
  .version('1.0.0');

// Global options
program
  .option('--verbose', 'Verbose output with detailed logging')
  .option('--no-color', 'Disable colored output');

// Workflow control commands
program
  .command('start-workflow')
  .description('Start a new workflow execution')
  .requiredOption('-p, --project <id>', 'Project ID')
  .requiredOption('-w, --workflow <path>', 'Workflow YAML path')
  .option('--yolo', 'YOLO mode: skip optional steps and prompts')
  .action(startWorkflow);

program
  .command('pause')
  .description('Pause workflow execution')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(pause);

program
  .command('resume')
  .description('Resume paused workflow')
  .requiredOption('-p, --project <id>', 'Project ID')
  .option('--yolo', 'YOLO mode: skip optional steps and prompts')
  .action(resume);

// Status query commands
program
  .command('status')
  .description('Show project status and progress')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(status);

program
  .command('logs')
  .description('Show project logs')
  .requiredOption('-p, --project <id>', 'Project ID')
  .option('-t, --tail <n>', 'Number of lines to show', '50')
  .option('-f, --follow', 'Stream logs in real-time (not yet implemented)')
  .action(logs);

program
  .command('list-projects')
  .description('List all orchestrator projects')
  .action(listProjects);

program
  .command('list-agents')
  .description('List active agents for a project')
  .requiredOption('-p, --project <id>', 'Project ID')
  .action(listAgents);

program
  .command('state')
  .description('Show detailed workflow state')
  .requiredOption('-p, --project <id>', 'Project ID')
  .option('--json', 'Output as JSON')
  .action(state);

// PRD workflow command
program
  .command('run-prd-workflow')
  .description('Execute PRD workflow to generate Product Requirements Document')
  .option('--project-path <path>', 'Project root path (defaults to current directory)')
  .option('--yolo', 'YOLO mode: skip elicitation and use defaults')
  .option('--max-escalations <n>', 'Maximum escalations allowed', '3')
  .option('--timeout <ms>', 'Workflow execution timeout in milliseconds', '1800000')
  .action(runPRDWorkflow);

// Custom help
program.on('--help', () => {
  console.log('');
  console.log(colors.header('Examples:'));
  console.log('');
  console.log(colors.dim('  # Start a workflow'));
  console.log('  $ orchestrator start-workflow --project my-project --workflow bmad/workflows/prd.yaml');
  console.log('');
  console.log(colors.dim('  # Check project status'));
  console.log('  $ orchestrator status --project my-project');
  console.log('');
  console.log(colors.dim('  # View logs'));
  console.log('  $ orchestrator logs --project my-project --tail 100');
  console.log('');
  console.log(colors.dim('  # Pause workflow'));
  console.log('  $ orchestrator pause --project my-project');
  console.log('');
  console.log(colors.dim('  # Resume workflow'));
  console.log('  $ orchestrator resume --project my-project');
  console.log('');
  console.log(colors.dim('  # List projects'));
  console.log('  $ orchestrator list-projects');
  console.log('');
  console.log(colors.dim('  # List agents'));
  console.log('  $ orchestrator list-agents --project my-project');
  console.log('');
  console.log(colors.dim('  # Show detailed state'));
  console.log('  $ orchestrator state --project my-project');
  console.log('');
});

// Parse arguments
program.parse();
