/**
 * Code Validation Module
 *
 * Provides validation functions for:
 * - Architecture compliance (microkernel pattern, plugin architecture)
 * - Coding standards (TypeScript, naming conventions, file structure)
 * - Error handling (try-catch blocks, error messages, logging)
 * - Security practices (input validation, no hardcoded secrets, secure defaults)
 *
 * All validators return ValidationResult with passed/failed status,
 * issues, and warnings for actionable feedback.
 */

import { CodeImplementation, StoryContext } from '../types.js';
import { logger } from '../../utils/logger.js';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Validation category */
  category: string;
  /** Whether validation passed */
  passed: boolean;
  /** Critical issues that failed validation */
  issues: string[];
  /** Non-critical warnings */
  warnings: string[];
}

/**
 * Validate architecture compliance
 *
 * Checks:
 * - Microkernel pattern followed (minimal core, plugins)
 * - Dependency injection used
 * - Plugin interfaces respected
 * - No circular dependencies
 * - Proper module boundaries
 *
 * @param implementation Code implementation to validate
 * @param context Story context with architecture guidance
 * @returns Validation result
 */
export async function validateArchitectureCompliance(
  implementation: CodeImplementation,
  context: StoryContext
): Promise<ValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    // Check for dependency injection pattern
    const hasConstructorInjection = implementation.files.some(file =>
      file.content.includes('constructor(') &&
      (file.content.includes('private readonly') ||
        file.content.includes('private '))
    );

    if (!hasConstructorInjection) {
      warnings.push(
        'No constructor-based dependency injection detected. Consider using DI for testability.'
      );
    }

    // Check for proper imports (ES modules)
    const hasProperImports = implementation.files.every(file => {
      if (!file.content.includes('import')) {
        return true; // No imports needed
      }
      // Check for .js extension in relative imports
      const importMatches = file.content.match(/from\s+['"](\.[^'"]+)['"]/g);
      if (!importMatches) {
        return true;
      }
      return importMatches.every(match =>
        match.includes('.js') || match.includes('.json')
      );
    });

    if (!hasProperImports) {
      issues.push(
        'Missing .js extensions in import statements. TypeScript requires explicit extensions.'
      );
    }

    // Check for proper exports (named exports preferred)
    const hasExports = implementation.files.some(file =>
      file.content.includes('export class') ||
      file.content.includes('export interface') ||
      file.content.includes('export function') ||
      file.content.includes('export const')
    );

    if (!hasExports) {
      warnings.push(
        'No exports detected. Ensure public APIs are properly exported.'
      );
    }

    // Check for circular dependency patterns
    implementation.files.forEach(file => {
      const imports = file.content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (imports) {
        const importPaths = imports.map(imp => {
          const match = imp.match(/from\s+['"]([^'"]+)['"]/);
          return match ? match[1] : '';
        });

        // Simple check: if file imports from same directory and is imported by it
        const sameDir = importPaths.filter(p => p && p.startsWith('.'));
        if (sameDir.length > 3) {
          warnings.push(
            `File ${file.path} has many same-directory imports. Check for circular dependencies.`
          );
        }
      }
    });

    // Check for architecture alignment from context
    if (context.architectureContext.includes('microkernel')) {
      const hasPluginPattern = implementation.files.some(file =>
        file.content.includes('Plugin') ||
        file.content.includes('plugin') ||
        file.content.includes('register')
      );

      if (!hasPluginPattern && context.story.title.toLowerCase().includes('plugin')) {
        warnings.push(
          'Story mentions plugin but no plugin pattern detected in implementation.'
        );
      }
    }

    const passed = issues.length === 0;

    return {
      category: 'Architecture Compliance',
      passed,
      issues,
      warnings
    };
  } catch (error) {
    logger.error('Architecture validation error', error as Error);
    return {
      category: 'Architecture Compliance',
      passed: false,
      issues: [`Validation error: ${(error as Error).message}`],
      warnings: []
    };
  }
}

/**
 * Validate coding standards
 *
 * Checks:
 * - TypeScript strict mode compliance
 * - Naming conventions (kebab-case files, PascalCase classes, camelCase functions)
 * - JSDoc comments on public APIs
 * - No 'any' types (except where documented)
 * - Explicit return types on functions
 * - Proper file structure
 *
 * @param implementation Code implementation to validate
 * @param context Story context with coding standards
 * @returns Validation result
 */
export async function validateCodingStandards(
  implementation: CodeImplementation,
  _context: StoryContext
): Promise<ValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    implementation.files.forEach(file => {
      // Check file naming convention (kebab-case)
      const fileName = file.path.split('/').pop() || '';
      const isKebabCase = /^[a-z0-9-]+\.(ts|js|json)$/.test(fileName);
      if (!isKebabCase && !fileName.endsWith('.test.ts')) {
        warnings.push(
          `File ${fileName} does not follow kebab-case naming convention.`
        );
      }

      // Check for 'any' types (should be minimal)
      const anyTypeMatches = file.content.match(/:\s*any[,;\s)]/g);
      if (anyTypeMatches && anyTypeMatches.length > 2) {
        warnings.push(
          `File ${file.path} contains multiple 'any' types. Consider explicit typing.`
        );
      }

      // Check for public methods without JSDoc
      const publicMethodMatches = file.content.match(
        /(?:public|export)\s+(?:async\s+)?(?:function\s+\w+|class\s+\w+|\w+\s*\([^)]*\)\s*:\s*\w+)/g
      );
      if (publicMethodMatches) {
        const jsdocCount = (file.content.match(/\/\*\*/g) || []).length;
        if (jsdocCount === 0 && publicMethodMatches.length > 0) {
          warnings.push(
            `File ${file.path} has public APIs without JSDoc comments.`
          );
        }
      }

      // Check for explicit return types
      const methodsWithoutReturnType = file.content.match(
        /(?:public|export)\s+(?:async\s+)?function\s+\w+\([^)]*\)\s*\{/g
      );
      if (methodsWithoutReturnType && methodsWithoutReturnType.length > 0) {
        warnings.push(
          `File ${file.path} has functions without explicit return types.`
        );
      }

      // Check for PascalCase classes
      const classMatches = file.content.match(/class\s+([A-Za-z0-9]+)/g);
      if (classMatches) {
        classMatches.forEach(match => {
          const className = match.replace('class ', '');
          if (!/^[A-Z][A-Za-z0-9]*$/.test(className)) {
            warnings.push(
              `Class ${className} in ${file.path} does not follow PascalCase convention.`
            );
          }
        });
      }

      // Check for proper error handling (basic check)
      const hasFunctions = file.content.includes('async ') || file.content.includes('function ');
      const hasTryCatch = file.content.includes('try {');
      if (hasFunctions && !hasTryCatch && file.content.length > 500) {
        warnings.push(
          `File ${file.path} contains functions but no try-catch blocks. Consider adding error handling.`
        );
      }

      // Check for console.log (should use logger)
      if (file.content.includes('console.log') && !file.path.includes('test')) {
        warnings.push(
          `File ${file.path} uses console.log instead of structured logger.`
        );
      }
    });

    const passed = issues.length === 0;

    return {
      category: 'Coding Standards',
      passed,
      issues,
      warnings
    };
  } catch (error) {
    logger.error('Coding standards validation error', error as Error);
    return {
      category: 'Coding Standards',
      passed: false,
      issues: [`Validation error: ${(error as Error).message}`],
      warnings: []
    };
  }
}

/**
 * Validate error handling
 *
 * Checks:
 * - Try-catch blocks for operations that may fail
 * - Descriptive error messages
 * - Proper error propagation (throw vs return)
 * - Logging at appropriate levels
 * - No swallowed exceptions
 * - Edge cases handled (null checks, validation)
 *
 * @param implementation Code implementation to validate
 * @returns Validation result
 */
export async function validateErrorHandling(
  implementation: CodeImplementation
): Promise<ValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    implementation.files.forEach(file => {
      // Skip test files
      if (file.path.includes('.test.')) {
        return;
      }

      // Check for async functions without try-catch
      const asyncFunctions = file.content.match(/async\s+\w+\s*\([^)]*\)\s*:\s*Promise<[^>]+>\s*\{/g);
      const tryCatchBlocks = file.content.match(/try\s*\{/g);

      if (asyncFunctions && asyncFunctions.length > 0) {
        const tryCatchCount = tryCatchBlocks ? tryCatchBlocks.length : 0;
        if (tryCatchCount === 0) {
          warnings.push(
            `File ${file.path} has async functions but no try-catch error handling.`
          );
        }
      }

      // Check for empty catch blocks (swallowed exceptions)
      const emptyCatchBlocks = file.content.match(/catch\s*\([^)]*\)\s*\{\s*\}/g);
      if (emptyCatchBlocks) {
        issues.push(
          `File ${file.path} has empty catch blocks. Exceptions should be logged or re-thrown.`
        );
      }

      // Check for error logging
      const hasErrorLogging = file.content.includes('logger.error') ||
        file.content.includes('console.error');
      const hasCatchBlocks = file.content.includes('catch (');

      if (hasCatchBlocks && !hasErrorLogging) {
        warnings.push(
          `File ${file.path} has catch blocks but no error logging.`
        );
      }

      // Check for descriptive error messages
      const throwStatements = file.content.match(/throw\s+new\s+Error\([^)]*\)/g);
      if (throwStatements) {
        throwStatements.forEach(stmt => {
          // Check if error message includes context
          if (stmt.includes('Error()') || stmt.includes('Error("")')) {
            warnings.push(
              `File ${file.path} has error thrown without descriptive message.`
            );
          }
        });
      }

      // Check for null/undefined checks on external inputs
      const hasValidation = file.content.includes('if (!') ||
        file.content.includes('if (') ||
        file.content.includes('??') ||
        file.content.includes('?.');

      if (file.content.length > 1000 && !hasValidation) {
        warnings.push(
          `File ${file.path} may be missing input validation or null checks.`
        );
      }

      // Check for error type casting
      const hasCatchWithError = file.content.match(/catch\s*\(\s*error\s*\)/g);
      const hasErrorCasting = file.content.includes('error as Error') ||
        file.content.includes('(error as Error)');

      if (hasCatchWithError && !hasErrorCasting && file.content.includes('error.message')) {
        warnings.push(
          `File ${file.path} accesses error.message without type casting to Error.`
        );
      }
    });

    const passed = issues.length === 0;

    return {
      category: 'Error Handling',
      passed,
      issues,
      warnings
    };
  } catch (error) {
    logger.error('Error handling validation error', error as Error);
    return {
      category: 'Error Handling',
      passed: false,
      issues: [`Validation error: ${(error as Error).message}`],
      warnings: []
    };
  }
}

/**
 * Validate security best practices
 *
 * Checks:
 * - No hardcoded secrets or credentials
 * - Secrets loaded from environment variables
 * - Input validation for external data
 * - SQL injection prevention (if database operations)
 * - XSS prevention (if HTML/DOM operations)
 * - Secure defaults (fail closed, least privilege)
 * - Sensitive data not logged (passwords, tokens, PII)
 *
 * @param implementation Code implementation to validate
 * @returns Validation result
 */
export async function validateSecurityPractices(
  implementation: CodeImplementation
): Promise<ValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    implementation.files.forEach(file => {
      // Skip test files
      if (file.path.includes('.test.')) {
        return;
      }

      // Check for hardcoded secrets (common patterns)
      const secretPatterns = [
        /api[_-]?key\s*=\s*['"][^'"]{20,}['"]/i,
        /password\s*=\s*['"][^'"]+['"]/i,
        /secret\s*=\s*['"][^'"]{20,}['"]/i,
        /token\s*=\s*['"][^'"]{20,}['"]/i,
        /private[_-]?key\s*=\s*['"][^'"]+['"]/i
      ];

      secretPatterns.forEach(pattern => {
        if (pattern.test(file.content)) {
          issues.push(
            `File ${file.path} may contain hardcoded secrets. Use environment variables instead.`
          );
        }
      });

      // Check for environment variable usage for sensitive config
      const hasEnvUsage = file.content.includes('process.env') ||
        file.content.includes('env.') ||
        file.content.includes('config.');

      const hasSensitiveTerms = /api[_-]?key|password|secret|token/i.test(file.content);

      if (hasSensitiveTerms && !hasEnvUsage) {
        warnings.push(
          `File ${file.path} references sensitive terms but doesn't use environment variables.`
        );
      }

      // Check for SQL injection vulnerabilities (basic check)
      if (file.content.includes('query(') || file.content.includes('execute(')) {
        const hasStringConcat = file.content.includes(' + ') &&
          (file.content.includes('SELECT') || file.content.includes('INSERT'));

        if (hasStringConcat) {
          issues.push(
            `File ${file.path} may have SQL injection vulnerability. Use parameterized queries.`
          );
        }
      }

      // Check for XSS vulnerabilities (basic check)
      if (file.content.includes('innerHTML') || file.content.includes('dangerouslySetInnerHTML')) {
        warnings.push(
          `File ${file.path} uses innerHTML. Ensure proper sanitization to prevent XSS.`
        );
      }

      // Check for sensitive data in logs
      const logStatements = file.content.match(
        /logger\.(info|debug|warn|error)\([^)]*\)/g
      );

      if (logStatements) {
        logStatements.forEach(stmt => {
          const lowerStmt = stmt.toLowerCase();
          if (
            lowerStmt.includes('password') ||
            lowerStmt.includes('token') ||
            lowerStmt.includes('secret') ||
            lowerStmt.includes('apikey')
          ) {
            issues.push(
              `File ${file.path} may be logging sensitive data. Remove passwords/tokens from logs.`
            );
          }
        });
      }

      // Check for input validation
      const hasPublicMethods = file.content.includes('public ') ||
        file.content.includes('export function') ||
        file.content.includes('export async function');

      const hasInputValidation = file.content.includes('if (!') ||
        file.content.includes('throw new Error') ||
        file.content.includes('validate');

      if (hasPublicMethods && !hasInputValidation && file.content.length > 500) {
        warnings.push(
          `File ${file.path} has public methods but may lack input validation.`
        );
      }

      // Check for secure defaults
      if (file.content.includes('https://') && file.content.includes('http://')) {
        warnings.push(
          `File ${file.path} contains both HTTP and HTTPS URLs. Prefer HTTPS for security.`
        );
      }

      // Check for eval usage (dangerous)
      if (file.content.includes('eval(')) {
        issues.push(
          `File ${file.path} uses eval(). This is a critical security risk.`
        );
      }

      // Check for unsafe regex patterns (ReDoS)
      const regexPatterns = file.content.match(/\/.*\/[gmi]*/g);
      if (regexPatterns) {
        regexPatterns.forEach(pattern => {
          // Simple check for common ReDoS patterns
          if (pattern.includes('(.*)*') || pattern.includes('(.+)+')) {
            warnings.push(
              `File ${file.path} has regex pattern that may be vulnerable to ReDoS: ${pattern}`
            );
          }
        });
      }
    });

    const passed = issues.length === 0;

    return {
      category: 'Security Practices',
      passed,
      issues,
      warnings
    };
  } catch (error) {
    logger.error('Security validation error', error as Error);
    return {
      category: 'Security Practices',
      passed: false,
      issues: [`Validation error: ${(error as Error).message}`],
      warnings: []
    };
  }
}
