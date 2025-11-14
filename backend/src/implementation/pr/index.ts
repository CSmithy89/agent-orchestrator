/**
 * PR Creation Automation Module
 *
 * Exports all PR automation components for GitHub PR creation, CI monitoring, and auto-merge.
 */

export { PRCreationAutomator, PRCreationAutomatorConfig } from './PRCreationAutomator.js';
export { generatePRBody, PRBodyConfig } from './pr-body-generator.js';
export {
  monitorCIStatus,
  retryFailedChecks,
  CICheck,
  CICheckStatus,
  CICheckConclusion,
  CIMonitorResult,
  CIMonitorOptions
} from './ci-monitor.js';
export {
  autoMergePR,
  deleteRemoteBranch,
  MergeResult,
  AutoMergeOptions
} from './auto-merger.js';
export {
  triggerDependentStories,
  updateSprintStatus,
  StoryDependency,
  DependencyTriggerResult
} from './dependency-trigger.js';
