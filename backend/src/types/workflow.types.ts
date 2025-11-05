/**
 * Workflow Type Definitions
 * Defines the schema for workflow.yaml and related structures
 */

/**
 * Workflow configuration schema
 * Parsed from workflow.yaml files
 */
export interface WorkflowConfig {
  /** Workflow name */
  name: string;

  /** Workflow description */
  description: string;

  /** Workflow author */
  author: string;

  /** Path to config source file (e.g., bmad/bmm/config.yaml) */
  config_source: string;

  /** Resolved output folder path */
  output_folder: string;

  /** User name from config */
  user_name: string;

  /** Communication language from config */
  communication_language: string;

  /** System-generated date (ISO format: YYYY-MM-DD) */
  date: string;

  /** Workflow installation path */
  installed_path: string;

  /** Optional template file path */
  template?: string;

  /** Instructions file path (markdown with XML tags) */
  instructions: string;

  /** Optional validation checklist path */
  validation?: string;

  /** Optional default output file path */
  default_output_file?: string;

  /** Custom workflow variables */
  variables?: Record<string, any>;

  /** Whether workflow is standalone */
  standalone: boolean;
}

/**
 * Workflow step structure
 * Parsed from instructions markdown file
 */
export interface Step {
  /** Step number */
  number: number;

  /** Step goal/description */
  goal: string;

  /** Raw markdown/XML content */
  content: string;

  /** Whether step is optional (from optional="true" attribute) */
  optional?: boolean;

  /** Conditional expression (from if="condition" attribute) */
  condition?: string;
}

/**
 * Validation result structure
 * Returned by validateWorkflow method
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;

  /** Array of error messages (blocking issues) */
  errors: string[];

  /** Array of warning messages (non-blocking issues) */
  warnings: string[];
}

/**
 * Workflow parse error
 * Thrown when workflow YAML parsing or validation fails
 */
export class WorkflowParseError extends Error {
  constructor(
    message: string,
    public field?: string,
    public expected?: string,
    public filePath?: string
  ) {
    super(message);
    this.name = 'WorkflowParseError';
  }
}
