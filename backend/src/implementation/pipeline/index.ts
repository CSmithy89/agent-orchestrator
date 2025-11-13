/**
 * Code Implementation Pipeline - Public Exports
 *
 * This module exports the CodeImplementationPipeline and related utilities
 * for use in the WorkflowOrchestrator and other components.
 */

export {
  CodeImplementationPipeline,
  CodeImplementationPipelineConfig,
  PipelinePerformanceMetrics
} from './CodeImplementationPipeline.js';

export {
  validateArchitectureCompliance,
  validateCodingStandards,
  validateErrorHandling,
  validateSecurityPractices,
  ValidationResult
} from './validators.js';

export {
  applyFileChanges,
  isPathSafe,
  readFile,
  fileExists,
  getFileStats,
  FileOperationResult,
  FileOperationFailure
} from './file-operations.js';

export {
  createGitCommit,
  getCurrentBranch,
  hasUncommittedChanges,
  getModifiedFiles,
  GitCommitResult
} from './git-operations.js';
