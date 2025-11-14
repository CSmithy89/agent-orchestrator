/**
 * PR Creation Automation Module
 *
 * Exports all PR automation components for GitHub PR creation, CI monitoring, and auto-merge.
 */

export { PRCreationAutomator } from './PRCreationAutomator.js';
export type { PRCreationAutomatorConfig } from './PRCreationAutomator.js';
export { generatePRBody } from './pr-body-generator.js';
export type { PRBodyConfig } from './pr-body-generator.js';
export {
  monitorCIStatus,
  retryFailedChecks
} from './ci-monitor.js';
export type {
  CICheck,
  CICheckStatus,
  CICheckConclusion,
  CIMonitorResult,
  CIMonitorOptions
} from './ci-monitor.js';
export {
  autoMergePR,
  deleteRemoteBranch
} from './auto-merger.js';
export type {
  MergeResult,
  AutoMergeOptions
} from './auto-merger.js';
export {
  triggerDependentStories,
  updateSprintStatus
} from './dependency-trigger.js';
export type {
  StoryDependency,
  DependencyTriggerResult
} from './dependency-trigger.js';
