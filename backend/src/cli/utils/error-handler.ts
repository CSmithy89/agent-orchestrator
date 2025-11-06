/**
 * CLI Error Handler
 * Provides centralized error handling with actionable resolution steps
 */

import { colors } from './colors.js';
import {
  WorkflowParseError,
  WorkflowExecutionError
} from '../../types/errors.types.js';
import { ConfigValidationError } from '../../types/ProjectConfig.js';

/**
 * Custom CLI error types
 */
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project '${projectId}' not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class WorkflowNotFoundError extends Error {
  constructor(workflowPath: string) {
    super(`Workflow file not found at '${workflowPath}'`);
    this.name = 'WorkflowNotFoundError';
  }
}

export class StateLoadError extends Error {
  constructor(projectId: string, cause?: string) {
    super(`Cannot load project state for '${projectId}'${cause ? `: ${cause}` : ''}`);
    this.name = 'StateLoadError';
  }
}

/**
 * Handle CLI errors with actionable resolution steps
 * @param error Error object
 * @param context Context message (e.g., "Failed to start workflow")
 */
export function handleError(error: unknown, context: string): void {
  console.error(colors.error(`\n❌ ${context}`));

  if (error instanceof Error) {
    console.error(colors.error(`   ${error.message}`));

    // Provide actionable resolution steps based on error type
    if (error instanceof ProjectNotFoundError) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Run 'orchestrator list-projects' to see available projects`));
      console.error(colors.info(`   2. Check if project ID is correct`));
      console.error(colors.info(`   3. Ensure project has been initialized with .bmad/project-config.yaml`));
    } else if (error instanceof WorkflowNotFoundError) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Verify the workflow path is correct`));
      console.error(colors.info(`   2. Check if workflow.yaml file exists at the specified path`));
      console.error(colors.info(`   3. Use absolute path or path relative to project root`));
    } else if (error instanceof WorkflowParseError) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Check workflow.yaml syntax (must be valid YAML)`));
      console.error(colors.info(`   2. Ensure all required fields are present (name, description, instructions)`));
      console.error(colors.info(`   3. Verify variable references use correct syntax: {{variable_name}}`));
      if (error.field) {
        console.error(colors.highlight(`   Field with issue: ${error.field}`));
      }
    } else if (error instanceof WorkflowExecutionError) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Check logs for detailed error information`));
      console.error(colors.info(`   2. Verify all required variables are defined`));
      console.error(colors.info(`   3. Run 'orchestrator logs --project <id>' to see execution logs`));
      if (error.stepNumber !== undefined) {
        console.error(colors.highlight(`   Failed at step: ${error.stepNumber}`));
      }
    } else if (error instanceof ConfigValidationError) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Check .bmad/project-config.yaml syntax`));
      console.error(colors.info(`   2. Ensure all required configuration fields are present`));
      console.error(colors.info(`   3. Verify field types match expected schema`));
      if (error.field) {
        console.error(colors.highlight(`   Field with issue: ${error.field}`));
      }
    } else if (error instanceof StateLoadError) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Check if project has been initialized`));
      console.error(colors.info(`   2. Try running a workflow first to create state`));
      console.error(colors.info(`   3. Verify bmad/sprint-status.yaml exists`));
    } else if (error.message.includes('not found') || error.message.includes('ENOENT')) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Check if the file or directory exists`));
      console.error(colors.info(`   2. Verify the path is correct`));
      console.error(colors.info(`   3. Ensure you have read permissions`));
    } else if (error.message.includes('permission') || error.message.includes('EACCES')) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Check file permissions`));
      console.error(colors.info(`   2. Run with appropriate access rights`));
      console.error(colors.info(`   3. Verify you own the files/directories`));
    } else if (error.message.includes('parse') || error.message.includes('YAML')) {
      console.error(colors.info(`\n💡 Resolution steps:`));
      console.error(colors.info(`   1. Validate YAML syntax using a YAML linter`));
      console.error(colors.info(`   2. Check for proper indentation (spaces, not tabs)`));
      console.error(colors.info(`   3. Ensure no special characters are unescaped`));
    }

    // Verbose mode: show stack trace
    if (process.argv.includes('--verbose')) {
      console.error(colors.debug(`\n🔍 Stack trace:`));
      console.error(colors.debug(error.stack || 'No stack trace available'));
    } else {
      console.error(colors.dim(`\n   Run with --verbose for detailed stack trace`));
    }
  } else {
    console.error(colors.error(`   Unknown error occurred`));
    console.error(colors.dim(`   ${String(error)}`));
  }

  console.error(); // Empty line for spacing
}

/**
 * Check if error is a "not found" error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof ProjectNotFoundError || error instanceof WorkflowNotFoundError) {
    return true;
  }
  if (error instanceof Error) {
    return error.message.includes('not found') ||
           error.message.includes('ENOENT') ||
           (error as NodeJS.ErrnoException).code === 'ENOENT';
  }
  return false;
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof Error) {
    const nodeError = error as NodeJS.ErrnoException;
    return error.message.includes('permission') ||
           nodeError.code === 'EACCES' ||
           nodeError.code === 'EPERM';
  }
  return false;
}

/**
 * Exit process with appropriate exit code
 * @param success Whether the operation was successful
 */
export function exitWithCode(success: boolean): void {
  process.exit(success ? 0 : 1);
}
