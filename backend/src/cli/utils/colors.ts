/**
 * CLI Color Utilities
 * Provides color-coded output for better terminal UX
 * Supports --no-color flag for CI/CD environments
 */

import chalk from 'chalk';

/**
 * Check if colors should be enabled
 * Deferred evaluation to ensure --no-color flag is processed by Commander first
 */
function shouldUseColors(): boolean {
  return !process.argv.includes('--no-color') && !process.env.NO_COLOR;
}

/**
 * Color utility functions
 * Each function takes text and returns colored text (or plain text if colors disabled)
 */
export const colors = {
  /**
   * Success - green text
   * Use for: completed operations, success messages
   */
  success: (text: string): string => shouldUseColors() ? chalk.green(text) : text,

  /**
   * Error - red text
   * Use for: error messages, failures
   */
  error: (text: string): string => shouldUseColors() ? chalk.red(text) : text,

  /**
   * Warning - yellow text
   * Use for: warnings, paused states
   */
  warning: (text: string): string => shouldUseColors() ? chalk.yellow(text) : text,

  /**
   * Info - cyan text
   * Use for: informational messages, metadata
   */
  info: (text: string): string => shouldUseColors() ? chalk.cyan(text) : text,

  /**
   * Debug - gray text
   * Use for: debug output, verbose logs
   */
  debug: (text: string): string => shouldUseColors() ? chalk.gray(text) : text,

  /**
   * Header - bold blue text
   * Use for: section headers, titles
   */
  header: (text: string): string => shouldUseColors() ? chalk.bold.blue(text) : text,

  /**
   * Highlight - yellow text (bright)
   * Use for: highlighting important values, variables
   */
  highlight: (text: string): string => shouldUseColors() ? chalk.yellow(text) : text,

  /**
   * Dim - gray text (dimmed)
   * Use for: less important information, hints
   */
  dim: (text: string): string => shouldUseColors() ? chalk.dim(text) : text,

  /**
   * Bold - bold text
   * Use for: emphasis
   */
  bold: (text: string): string => shouldUseColors() ? chalk.bold(text) : text,
};

/**
 * Status-specific color functions
 */
export const statusColors = {
  running: (text: string): string => colors.info(text),
  paused: (text: string): string => colors.warning(text),
  completed: (text: string): string => colors.success(text),
  error: (text: string): string => colors.error(text),
  unknown: (text: string): string => colors.dim(text),
};

/**
 * Log level colors
 */
export const logLevelColors = {
  debug: (text: string): string => colors.debug(text),
  info: (text: string): string => colors.info(text),
  warn: (text: string): string => colors.warning(text),
  error: (text: string): string => colors.error(text),
};

/**
 * Check if colors are enabled
 */
export function areColorsEnabled(): boolean {
  return shouldUseColors();
}
