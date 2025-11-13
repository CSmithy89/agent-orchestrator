/**
 * Code Implementation Pipeline - Public Exports
 *
 * This module exports the CodeImplementationPipeline and related utilities
 * for use in the WorkflowOrchestrator and other components.
 */

export {
  CodeImplementationPipeline,
  type CodeImplementationPipelineConfig,
  type PipelinePerformanceMetrics
} from './CodeImplementationPipeline.js';

export {
  validateArchitectureCompliance,
  validateCodingStandards,
  validateErrorHandling,
  validateSecurityPractices,
  type ValidationResult
} from './validators.js';

export {
  applyFileChanges,
  isPathSafe,
  readFile,
  fileExists,
  getFileStats,
  type FileOperationResult,
  type FileOperationFailure
} from './file-operations.js';

export {
  createGitCommit,
  getCurrentBranch,
  hasUncommittedChanges,
  getModifiedFiles,
  type GitCommitResult
} from './git-operations.js';
