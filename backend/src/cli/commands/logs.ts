/**
 * logs command
 * Display project logs
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { colors, logLevelColors } from '../utils/colors.js';
import { handleError, exitWithCode } from '../utils/error-handler.js';

interface LogsOptions {
  project: string;
  tail?: string;
  follow?: boolean;
}

/**
 * Parse log entry and apply color coding
 */
function formatLogEntry(line: string): string {
  // Match log format: [timestamp] [level] message
  const logRegex = /^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/;
  const match = line.match(logRegex);

  if (match) {
    const [, timestamp, level, message] = match;
    const levelLower = level?.toLowerCase() || "";

    const coloredLevel = (level && logLevelColors[levelLower as keyof typeof logLevelColors])
      ? logLevelColors[levelLower as keyof typeof logLevelColors](level)
      : level || "";

    return `${colors.dim(`[${timestamp}]`)} ${coloredLevel} ${message}`;
  }

  // Return line as-is if doesn't match format
  return line;
}

/**
 * Logs command handler
 */
export async function logs(options: LogsOptions): Promise<void> {
  try {
    const { project: projectId, tail = '50', follow = false } = options;
    const tailLines = parseInt(tail, 10);

    if (isNaN(tailLines) || tailLines < 1) {
      throw new Error('--tail must be a positive number');
    }

    console.log(colors.header(`\n📜 Project Logs`));
    console.log(colors.info(`   Project: ${projectId}`));
    console.log(colors.info(`   Showing last ${tailLines} lines${follow ? ' (following...)' : ''}\n`));

    // Determine log file path
    const projectRoot = process.cwd();
    const logPath = path.join(projectRoot, 'logs', `${projectId}.log`);

    // Check if log file exists
    try {
      await fs.access(logPath);
    } catch {
      console.log(colors.warning(`⚠️  No log file found for project: ${projectId}`));
      console.log(colors.info(`\n   Expected location: ${logPath}`));
      console.log(colors.info(`   Start a workflow to generate logs.\n`));
      exitWithCode(true);
      return;
    }

    // Read log file
    const logContents = await fs.readFile(logPath, 'utf-8');
    const logLines = logContents.split('\n').filter(line => line.trim() !== '');

    // Get last N lines
    const displayLines = logLines.slice(-tailLines);

    if (displayLines.length === 0) {
      console.log(colors.dim('   (Log file is empty)\n'));
      exitWithCode(true);
      return;
    }

    // Display formatted logs
    displayLines.forEach(line => {
      console.log(formatLogEntry(line));
    });

    console.log();

    // Follow mode (watch for new entries)
    if (follow) {
      console.log(colors.dim('--- Following log file (Ctrl+C to exit) ---\n'));

      // Note: Real follow implementation would use fs.watch or tail -f equivalent
      // For now, just show a message
      console.log(colors.warning('⚠️  Follow mode (-f) is not yet implemented'));
      console.log(colors.info('   Use: tail -f ' + logPath + '\n'));
    }

    exitWithCode(true);
  } catch (error) {
    handleError(error, 'Failed to display logs');
    exitWithCode(false);
  }
}
