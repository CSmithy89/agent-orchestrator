/**
 * JSON Schema Validation for Solutioning Data Models
 *
 * Provides runtime validation using ajv (JSON Schema validator).
 * Validates Epic, Story, DependencyGraph, and ValidationResult objects
 * against their TypeScript interface definitions.
 *
 * @module solutioning/schemas
 * @see solutioning/types for TypeScript interface definitions
 */

import Ajv, { type ErrorObject } from 'ajv';
import type { ValidationResult as SolutioningValidationResult } from './types.js';

// Initialize ajv for better error messages
const ajv = new Ajv({
  allErrors: true, // Collect all errors, not just first
  verbose: true,   // Include schema and data in errors
});

/**
 * JSON Schema for TechnicalNotes interface
 */
const technicalNotesSchema = {
  type: 'object',
  properties: {
    affected_files: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    endpoints: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    data_structures: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    test_requirements: {
      type: 'string',
      minLength: 1,
    },
  },
  required: ['affected_files', 'endpoints', 'data_structures', 'test_requirements'],
  additionalProperties: true,
};

/**
 * JSON Schema for Story interface
 */
const storySchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: '^\\d+-\\d+$', // Matches "4-1", "4-2", etc.
    },
    epic: {
      type: 'string',
      pattern: '^epic-\\d+$', // Matches "epic-4", "epic-5", etc.
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
    },
    description: {
      type: 'string',
      minLength: 10,
      maxLength: 5000,
    },
    acceptance_criteria: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 20,
    },
    dependencies: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    status: {
      type: 'string',
      enum: ['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done'],
    },
    technical_notes: technicalNotesSchema,
    estimated_hours: {
      type: 'number',
      minimum: 0,
      maximum: 100,
    },
    complexity: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
    },
  },
  required: [
    'id',
    'epic',
    'title',
    'description',
    'acceptance_criteria',
    'dependencies',
    'status',
    'technical_notes',
    'estimated_hours',
    'complexity',
  ],
  additionalProperties: true,
};

/**
 * JSON Schema for Epic interface
 */
const epicSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: '^epic-\\d+$', // Matches "epic-1", "epic-2", etc.
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
    },
    goal: {
      type: 'string',
      minLength: 10,
      maxLength: 1000,
    },
    value_proposition: {
      type: 'string',
      minLength: 10,
      maxLength: 1000,
    },
    stories: {
      type: 'array',
      items: storySchema,
      minItems: 0,
      maxItems: 15,
    },
    business_value: {
      type: 'string',
      minLength: 1,
    },
    estimated_duration: {
      type: 'string',
      minLength: 1,
    },
  },
  required: [
    'id',
    'title',
    'goal',
    'value_proposition',
    'stories',
    'business_value',
    'estimated_duration',
  ],
  additionalProperties: true,
};

/**
 * JSON Schema for GraphNode interface
 */
const graphNodeSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: '^\\d+-\\d+$',
    },
    title: {
      type: 'string',
      minLength: 1,
    },
    status: {
      type: 'string',
      enum: ['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done'],
    },
    epic: {
      type: 'string',
      pattern: '^epic-\\d+$',
    },
    complexity: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
    },
  },
  required: ['id', 'title', 'status', 'epic', 'complexity'],
  additionalProperties: true,
};

/**
 * JSON Schema for DependencyEdge interface
 */
const dependencyEdgeSchema = {
  type: 'object',
  properties: {
    from: {
      type: 'string',
      pattern: '^\\d+-\\d+$',
    },
    to: {
      type: 'string',
      pattern: '^\\d+-\\d+$',
    },
    type: {
      type: 'string',
      enum: ['hard', 'soft'],
    },
    blocking: {
      type: 'boolean',
    },
  },
  required: ['from', 'to', 'type', 'blocking'],
  additionalProperties: true,
};

/**
 * JSON Schema for GraphMetadata interface
 */
const graphMetadataSchema = {
  type: 'object',
  properties: {
    totalStories: {
      type: 'number',
      minimum: 0,
    },
    parallelizable: {
      type: 'number',
      minimum: 0,
    },
    bottlenecks: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    criticalPathLength: {
      type: 'number',
      minimum: 0,
    },
  },
  required: ['totalStories', 'parallelizable', 'bottlenecks', 'criticalPathLength'],
  additionalProperties: true,
};

/**
 * JSON Schema for DependencyGraph interface
 */
const dependencyGraphSchema = {
  type: 'object',
  properties: {
    nodes: {
      type: 'array',
      items: graphNodeSchema,
      minItems: 0,
    },
    edges: {
      type: 'array',
      items: dependencyEdgeSchema,
      minItems: 0,
    },
    critical_path: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    bottlenecks: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    parallelizable: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'string' },
      },
      minItems: 0,
    },
    metadata: graphMetadataSchema,
  },
  required: ['nodes', 'edges', 'critical_path', 'bottlenecks', 'parallelizable', 'metadata'],
  additionalProperties: true,
};

/**
 * JSON Schema for ValidationCheck interface
 */
const validationCheckSchema = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      minLength: 1,
    },
    name: {
      type: 'string',
      minLength: 1,
    },
    pass: {
      type: 'boolean',
    },
    details: {
      type: 'string',
      minLength: 0,
    },
  },
  required: ['category', 'name', 'pass', 'details'],
  additionalProperties: true,
};

/**
 * JSON Schema for ValidationResult interface
 */
const validationResultSchema = {
  type: 'object',
  properties: {
    pass: {
      type: 'boolean',
    },
    score: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    checks: {
      type: 'array',
      items: validationCheckSchema,
      minItems: 0,
    },
    blockers: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
    },
  },
  required: ['pass', 'score', 'checks', 'blockers', 'warnings'],
  additionalProperties: true,
};

/**
 * Compile validation functions
 */
const validateEpicAjv = ajv.compile(epicSchema);
const validateStoryAjv = ajv.compile(storySchema);
const validateDependencyGraphAjv = ajv.compile(dependencyGraphSchema);
const validateValidationResultAjv = ajv.compile(validationResultSchema);

/**
 * Format ajv errors into human-readable messages with field paths.
 *
 * @param errors - Array of ajv validation errors
 * @returns Array of formatted error messages
 *
 * @example
 * ```typescript
 * // Input: [{ instancePath: '/title', message: 'must be string' }]
 * // Output: ["Field 'title': must be string"]
 * ```
 */
function formatValidationErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((error) => {
    // Type assertion needed as ErrorObject type may not include instancePath in some type definitions
    // At runtime with Ajv v8, instancePath is the correct property (v6 used dataPath)
    const field = (error as any).instancePath || 'root';
    const fieldPath = field.replace(/^\//, '').replace(/\//g, '.');
    const fieldName = fieldPath || 'root';

    // Format different error types
    if (error.keyword === 'type' && 'type' in error.params) {
      return `Field '${fieldName}': expected type ${error.params.type}, got ${typeof error.data}`;
    } else if (error.keyword === 'required' && 'missingProperty' in error.params) {
      return `Field '${fieldName}': missing required property '${error.params.missingProperty}'`;
    } else if (error.keyword === 'enum' && 'allowedValues' in error.params) {
      return `Field '${fieldName}': must be one of [${error.params.allowedValues.join(', ')}]`;
    } else if (error.keyword === 'pattern' && 'pattern' in error.params) {
      return `Field '${fieldName}': does not match required pattern ${error.params.pattern}`;
    } else if (error.keyword === 'minItems' && 'limit' in error.params) {
      return `Field '${fieldName}': must have at least ${error.params.limit} items`;
    } else if (error.keyword === 'maxItems' && 'limit' in error.params) {
      return `Field '${fieldName}': must have at most ${error.params.limit} items`;
    } else if (error.keyword === 'minimum' && 'limit' in error.params) {
      return `Field '${fieldName}': must be >= ${error.params.limit}`;
    } else if (error.keyword === 'maximum' && 'limit' in error.params) {
      return `Field '${fieldName}': must be <= ${error.params.limit}`;
    } else {
      return `Field '${fieldName}': ${error.message}`;
    }
  });
}

/**
 * Validate an Epic object against the Epic schema.
 *
 * @param data - Object to validate
 * @returns ValidationResult with pass/fail status and detailed error messages
 *
 * @example
 * ```typescript
 * const epic = { id: 'epic-4', title: 'Test', ... };
 * const result = validateEpic(epic);
 * if (!result.pass) {
 *   console.error('Validation failed:', result.blockers);
 * }
 * ```
 */
export function validateEpic(data: unknown): SolutioningValidationResult {
  const isValid = validateEpicAjv(data) as boolean;
  const errors = formatValidationErrors(validateEpicAjv.errors);

  return {
    pass: isValid,
    score: isValid ? 1.0 : 0.0,
    checks: [
      {
        category: 'schema',
        name: 'Epic Schema Validation',
        pass: isValid,
        details: isValid ? 'Epic object is valid' : errors.join('; '),
      },
    ],
    blockers: isValid ? [] : errors,
    warnings: [],
  };
}

/**
 * Validate a Story object against the Story schema.
 *
 * @param data - Object to validate
 * @returns ValidationResult with pass/fail status and detailed error messages
 *
 * @example
 * ```typescript
 * const story = { id: '4-1', epic: 'epic-4', ... };
 * const result = validateStory(story);
 * if (!result.pass) {
 *   console.error('Validation failed:', result.blockers);
 * }
 * ```
 */
export function validateStory(data: unknown): SolutioningValidationResult {
  const isValid = validateStoryAjv(data) as boolean;
  const errors = formatValidationErrors(validateStoryAjv.errors);

  return {
    pass: isValid,
    score: isValid ? 1.0 : 0.0,
    checks: [
      {
        category: 'schema',
        name: 'Story Schema Validation',
        pass: isValid,
        details: isValid ? 'Story object is valid' : errors.join('; '),
      },
    ],
    blockers: isValid ? [] : errors,
    warnings: [],
  };
}

/**
 * Validate a DependencyGraph object against the DependencyGraph schema.
 *
 * @param data - Object to validate
 * @returns ValidationResult with pass/fail status and detailed error messages
 *
 * @example
 * ```typescript
 * const graph = { nodes: [...], edges: [...], ... };
 * const result = validateDependencyGraph(graph);
 * if (!result.pass) {
 *   console.error('Validation failed:', result.blockers);
 * }
 * ```
 */
export function validateDependencyGraph(data: unknown): SolutioningValidationResult {
  const isValid = validateDependencyGraphAjv(data) as boolean;
  const errors = formatValidationErrors(validateDependencyGraphAjv.errors);

  return {
    pass: isValid,
    score: isValid ? 1.0 : 0.0,
    checks: [
      {
        category: 'schema',
        name: 'DependencyGraph Schema Validation',
        pass: isValid,
        details: isValid ? 'DependencyGraph object is valid' : errors.join('; '),
      },
    ],
    blockers: isValid ? [] : errors,
    warnings: [],
  };
}

/**
 * Validate a ValidationResult object against the ValidationResult schema.
 * Useful for validating validation results from external sources.
 *
 * @param data - Object to validate
 * @returns ValidationResult with pass/fail status and detailed error messages
 *
 * @example
 * ```typescript
 * const result = { pass: true, score: 0.95, ... };
 * const validation = validateValidationResult(result);
 * if (!validation.pass) {
 *   console.error('Validation result is invalid:', validation.blockers);
 * }
 * ```
 */
export function validateValidationResult(data: unknown): SolutioningValidationResult {
  const isValid = validateValidationResultAjv(data) as boolean;
  const errors = formatValidationErrors(validateValidationResultAjv.errors);

  return {
    pass: isValid,
    score: isValid ? 1.0 : 0.0,
    checks: [
      {
        category: 'schema',
        name: 'ValidationResult Schema Validation',
        pass: isValid,
        details: isValid ? 'ValidationResult object is valid' : errors.join('; '),
      },
    ],
    blockers: isValid ? [] : errors,
    warnings: [],
  };
}
