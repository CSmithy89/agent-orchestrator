/**
 * Epic 5: Story Implementation Automation - Test Generation Executor
 *
 * TestGenerationExecutor orchestrates the complete test generation and execution pipeline:
 * 1. Auto-detect test framework (Vitest, Jest, Mocha)
 * 2. Generate unit, integration, and edge case tests
 * 3. Create test files in proper directory structure
 * 4. Execute tests and capture results
 * 5. Generate and validate code coverage (>80% target)
 * 6. Automatically fix failing tests (up to 3 attempts)
 * 7. Commit test suite to git
 *
 * Integration: Invoked by WorkflowOrchestrator.executeAmeliaTesting()
 * Input: CodeImplementation (from Story 5.4) + StoryContext (from Story 5.2)
 * Output: TestSuite with test files, results, and coverage report
 */

import { AmeliaAgent, CodeImplementation, StoryContext, TestSuite, TestFile, CoverageReport, TestResults, TestFailure, TestFailureContext } from '../types.js';
import { logger } from '../../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * Test framework configuration detected from project
 */
export interface TestFrameworkConfig {
  /** Framework name (vitest, jest, mocha, etc.) */
  framework: string;
  /** Test runner command (npm test, npm run test:unit, etc.) */
  testCommand: string;
  /** Coverage command (npm run test:coverage, etc.) */
  coverageCommand: string;
  /** Coverage tool (vitest/coverage-v8, istanbul, c8, etc.) */
  coverageTool: string;
  /** Test file extension (.test.ts, .spec.ts, etc.) */
  testFileExtension: string;
  /** Test directory base path */
  testDirectory: string;
}

/**
 * Performance metrics for test pipeline execution
 */
export interface TestPerformanceMetrics {
  /** Test generation duration in milliseconds */
  generationDuration: number;
  /** Test execution duration in milliseconds */
  executionDuration: number;
  /** Coverage analysis duration in milliseconds */
  coverageDuration: number;
  /** Test fixing duration in milliseconds (if needed) */
  fixingDuration?: number;
  /** Total pipeline duration in milliseconds */
  totalDuration: number;
  /** Bottleneck steps (>10 minutes) */
  bottlenecks: string[];
}

/**
 * TestGenerationExecutor - Main test pipeline orchestration class
 *
 * Responsibilities:
 * - Coordinate test generation through Amelia agent
 * - Execute tests in isolated worktree environment
 * - Validate code coverage meets >80% target
 * - Automatically fix failing tests with retry logic
 * - Commit test suite to version control
 *
 * Performance Target: <30 minutes for typical story
 */
export class TestGenerationExecutor {
  private readonly logger: typeof logger;
  private readonly ameliaAgent: AmeliaAgent;
  private readonly projectRoot: string;

  /**
   * Create TestGenerationExecutor with dependency injection
   *
   * @param ameliaAgent - Amelia agent for test generation
   * @param projectRoot - Project root directory path
   * @param logger - Logger instance
   */
  constructor(ameliaAgent: AmeliaAgent, projectRoot: string, customLogger?: typeof logger) {
    this.ameliaAgent = ameliaAgent;
    this.projectRoot = projectRoot;
    this.logger = customLogger || logger;
  }

  /**
   * Execute complete test generation and execution pipeline
   *
   * Pipeline steps:
   * 1. Detect test framework and configuration
   * 2. Generate tests using Amelia agent (unit, integration, edge cases)
   * 3. Create test files in proper directory structure
   * 4. Execute tests in worktree
   * 5. Generate and validate code coverage (>80% target)
   * 6. Fix failing tests (up to 3 attempts)
   * 7. Commit test suite to git
   *
   * @param implementation - Code implementation from Story 5.4
   * @param context - Story context from Story 5.2
   * @returns TestSuite with test files, results, and coverage
   * @throws Error if tests fail after 3 fix attempts or timeout
   */
  async execute(implementation: CodeImplementation, context: StoryContext): Promise<TestSuite> {
    const startTime = Date.now();
    const metrics: Partial<TestPerformanceMetrics> = {
      bottlenecks: [],
    };

    try {
      this.logger.info('Starting test generation and execution pipeline', {
        storyId: context.story.id,
        filesCount: implementation.files.length,
      });

      // Step 1: Detect test framework
      this.logger.info('Step 1: Detecting test framework configuration');
      const stepStart = Date.now();
      const frameworkConfig = await this.detectTestFramework();
      const stepDuration = Date.now() - stepStart;
      this.logger.info('Test framework detected', {
        framework: frameworkConfig.framework,
        duration: `${stepDuration}ms`,
      });

      // Step 2: Generate tests using Amelia agent
      this.logger.info('Step 2: Generating tests with Amelia agent');
      const genStart = Date.now();
      const testSuite = await this.ameliaAgent.writeTests(implementation);
      metrics.generationDuration = Date.now() - genStart;

      if (metrics.generationDuration > 10 * 60 * 1000) {
        metrics.bottlenecks!.push(`Test generation: ${metrics.generationDuration}ms`);
        this.logger.warn('Test generation exceeded 10 minutes', {
          duration: metrics.generationDuration,
        });
      }

      this.logger.info('Tests generated', {
        testCount: testSuite.testCount,
        filesCount: testSuite.files.length,
        duration: `${metrics.generationDuration}ms`,
      });

      // Step 3: Create test files in proper directory structure
      this.logger.info('Step 3: Creating test files');
      await this.createTestFiles(testSuite.files, frameworkConfig);

      // Step 4: Execute tests
      this.logger.info('Step 4: Executing tests');
      const execStart = Date.now();
      let testResults = await this.executeTests(frameworkConfig);
      metrics.executionDuration = Date.now() - execStart;

      this.logger.info('Tests executed', {
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped,
        duration: `${metrics.executionDuration}ms`,
      });

      // Step 5: Generate coverage report
      this.logger.info('Step 5: Generating code coverage report');
      const covStart = Date.now();
      const coverageReport = await this.generateCoverageReport(frameworkConfig, implementation);
      metrics.coverageDuration = Date.now() - covStart;

      this.logger.info('Coverage report generated', {
        lines: `${coverageReport.lines}%`,
        functions: `${coverageReport.functions}%`,
        branches: `${coverageReport.branches}%`,
        statements: `${coverageReport.statements}%`,
        duration: `${metrics.coverageDuration}ms`,
      });

      // Validate coverage meets 80% target
      const coverageValid = this.validateCoverage(coverageReport);
      if (!coverageValid) {
        this.logger.warn('Coverage below 80% target', {
          lines: coverageReport.lines,
          uncoveredLines: coverageReport.uncoveredLines,
        });
      }

      // Step 6: Fix failing tests (up to 3 attempts)
      if (testResults.failed > 0) {
        this.logger.info('Step 6: Fixing failing tests', {
          failedCount: testResults.failed,
        });
        const fixStart = Date.now();
        testResults = await this.fixFailingTests(
          testResults,
          testSuite.files,
          frameworkConfig,
          implementation,
          testSuite.framework
        );
        metrics.fixingDuration = Date.now() - fixStart;

        if (metrics.fixingDuration > 10 * 60 * 1000) {
          metrics.bottlenecks!.push(`Test fixing: ${metrics.fixingDuration}ms`);
        }

        if (testResults.failed > 0) {
          throw new Error(
            `Tests still failing after 3 fix attempts: ${testResults.failed} failures`
          );
        }

        this.logger.info('All tests now passing', {
          passed: testResults.passed,
          fixDuration: `${metrics.fixingDuration}ms`,
        });
      }

      // Step 7: Commit test suite
      this.logger.info('Step 7: Committing test suite');
      const commitSha = await this.commitTestSuite(testSuite, testResults, coverageReport, context);

      this.logger.info('Test suite committed', {
        commitSha,
      });

      // Calculate total duration and log performance metrics
      metrics.totalDuration = Date.now() - startTime;
      this.logPerformanceMetrics(metrics as TestPerformanceMetrics);

      // Enforce 30-minute timeout
      if (metrics.totalDuration > 30 * 60 * 1000) {
        const timeoutError = new Error(
          `Test pipeline timeout: ${metrics.totalDuration}ms exceeds 30 minute limit`
        ) as Error & { duration: number };
        timeoutError.duration = metrics.totalDuration;
        this.logger.error('Test pipeline exceeded 30-minute timeout', timeoutError);
        throw timeoutError;
      }

      // Return complete TestSuite
      return {
        ...testSuite,
        coverage: coverageReport,
        results: testResults,
      };
    } catch (error) {
      this.logger.error('Test generation pipeline failed', error as Error, {
        storyId: context.story.id,
        duration: Date.now() - startTime,
      });
      throw new Error(`Test generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Auto-detect test framework from package.json and existing tests
   *
   * Detection strategy:
   * 1. Check package.json for test framework dependencies
   * 2. Check for existing test files to infer framework syntax
   * 3. Load test configuration from project config files
   * 4. Determine test runner and coverage commands
   *
   * @returns Test framework configuration
   * @throws Error if no test framework detected
   */
  private async detectTestFramework(): Promise<TestFrameworkConfig> {
    try {
      // Read package.json to detect framework
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Detect framework from dependencies
      let framework = 'unknown';
      let coverageTool = 'unknown';

      if (dependencies['vitest']) {
        framework = 'vitest';
        coverageTool = dependencies['@vitest/coverage-v8'] ? '@vitest/coverage-v8' : 'vitest';
      } else if (dependencies['jest']) {
        framework = 'jest';
        coverageTool = dependencies['jest'] ? 'jest' : 'istanbul';
      } else if (dependencies['mocha']) {
        framework = 'mocha';
        coverageTool = dependencies['c8'] ? 'c8' : dependencies['nyc'] ? 'nyc' : 'istanbul';
      }

      if (framework === 'unknown') {
        throw new Error(
          'No test framework detected. Please install vitest, jest, or mocha and configure test scripts in package.json'
        );
      }

      // Determine test commands from package.json scripts
      const scripts = packageJson.scripts || {};
      const testCommand = scripts['test'] ? 'npm test' : scripts['test:unit'] ? 'npm run test:unit' : 'npm test';
      const coverageCommand = scripts['test:coverage']
        ? 'npm run test:coverage'
        : scripts['coverage']
          ? 'npm run coverage'
          : 'npm test -- --coverage';

      // Determine test file extension and directory
      const testFileExtension = '.test.ts'; // Default for TypeScript projects
      const testDirectory = framework === 'vitest' || framework === 'jest' ? 'backend/tests' : 'test';

      const config: TestFrameworkConfig = {
        framework,
        testCommand,
        coverageCommand,
        coverageTool,
        testFileExtension,
        testDirectory,
      };

      this.logger.info('Test framework configuration detected', config);
      return config;
    } catch (error) {
      this.logger.error('Failed to detect test framework', error as Error);
      throw new Error(`Test framework detection failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create test files in proper directory structure
   *
   * Directory structure:
   * - Unit tests: backend/tests/unit/{module-path}/{file-name}.test.ts
   * - Integration tests: backend/tests/integration/{module-path}/{file-name}.test.ts
   *
   * @param testFiles - Test files from Amelia agent
   * @param config - Test framework configuration
   */
  private async createTestFiles(testFiles: TestFile[], _config: TestFrameworkConfig): Promise<void> {
    try {
      for (const testFile of testFiles) {
        const fullPath = path.join(this.projectRoot, testFile.path);
        const dir = path.dirname(fullPath);

        // Create directory recursively if needed
        await fs.mkdir(dir, { recursive: true });

        // Write test file
        await fs.writeFile(fullPath, testFile.content, 'utf-8');

        this.logger.info('Test file created', {
          path: testFile.path,
        });
      }

      this.logger.info('All test files created', {
        count: testFiles.length,
      });
    } catch (error) {
      this.logger.error('Failed to create test files', error as Error);
      throw new Error(`Test file creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute tests using detected test framework
   *
   * Execution:
   * - Run test command in worktree (isolated from main branch)
   * - Capture stdout and stderr
   * - Parse test results (passed, failed, skipped counts)
   * - Track execution duration
   * - Enforce 30-minute timeout
   *
   * @param config - Test framework configuration
   * @returns Test execution results
   */
  private async executeTests(config: TestFrameworkConfig): Promise<TestResults> {
    try {
      const startTime = Date.now();

      // Execute test command with timeout
      const { stdout, stderr } = await execAsync(config.testCommand, {
        cwd: this.projectRoot,
        timeout: 30 * 60 * 1000, // 30 minute timeout
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      });

      const duration = Date.now() - startTime;

      // Parse test results from output
      const results = this.parseTestResults(stdout, stderr, config.framework);
      results.duration = duration;

      return results;
    } catch (error: any) {
      // Handle test failures (non-zero exit code)
      if (error.stdout || error.stderr) {
        const results = this.parseTestResults(error.stdout || '', error.stderr || '', config.framework);
        results.duration = Date.now();
        return results;
      }

      this.logger.error('Test execution failed', error as Error);
      throw new Error(`Test execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse test results from test runner output
   *
   * Supports:
   * - Vitest output format
   * - Jest output format
   * - Mocha output format
   *
   * @param stdout - Standard output from test runner
   * @param stderr - Standard error from test runner
   * @param framework - Test framework name
   * @returns Parsed test results
   */
  private parseTestResults(stdout: string, stderr: string, framework: string): TestResults {
    const output = stdout + stderr;

    // Parse based on framework
    if (framework === 'vitest') {
      return this.parseVitestResults(output);
    } else if (framework === 'jest') {
      return this.parseJestResults(output);
    } else if (framework === 'mocha') {
      return this.parseMochaResults(output);
    }

    // Fallback: Try to extract counts from generic patterns
    const passedMatch = output.match(/(\d+)\s+(?:passed|passing)/i);
    const failedMatch = output.match(/(\d+)\s+(?:failed|failing)/i);
    const skippedMatch = output.match(/(\d+)\s+(?:skipped|pending)/i);

    return {
      passed: passedMatch ? parseInt(passedMatch[1] ?? '0', 10) : 0,
      failed: failedMatch ? parseInt(failedMatch[1] ?? '0', 10) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1] ?? '0', 10) : 0,
      duration: 0,
      failures: this.extractFailures(output),
    };
  }

  /**
   * Parse Vitest test results
   */
  private parseVitestResults(output: string): TestResults {
    // Vitest format: "Test Files  1 passed (1)"
    //               "     Tests  5 passed (5)"
    //               "     Tests  2 failed | 3 passed (5)"
    // Use word boundary to match "Tests" not "Test Files"
    const passedMatch = output.match(/\bTests\s+(?:\d+\s+failed\s+\|\s+)?(\d+)\s+passed/i);
    const failedMatch = output.match(/\bTests\s+(\d+)\s+failed/i);
    const skippedMatch = output.match(/\bTests\s+(?:\d+\s+(?:passed|failed)\s+\|\s+)?(\d+)\s+skipped/i);

    return {
      passed: passedMatch ? parseInt(passedMatch[1] ?? '0', 10) : 0,
      failed: failedMatch ? parseInt(failedMatch[1] ?? '0', 10) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1] ?? '0', 10) : 0,
      duration: 0,
      failures: this.extractFailures(output),
    };
  }

  /**
   * Parse Jest test results
   */
  private parseJestResults(output: string): TestResults {
    // Jest format: "Tests:       1 failed, 5 passed, 6 total"
    const passedMatch = output.match(/(\d+)\s+passed/i);
    const failedMatch = output.match(/(\d+)\s+failed/i);
    const skippedMatch = output.match(/(\d+)\s+skipped/i);

    return {
      passed: passedMatch ? parseInt(passedMatch[1] ?? '0', 10) : 0,
      failed: failedMatch ? parseInt(failedMatch[1] ?? '0', 10) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1] ?? '0', 10) : 0,
      duration: 0,
      failures: this.extractFailures(output),
    };
  }

  /**
   * Parse Mocha test results
   */
  private parseMochaResults(output: string): TestResults {
    // Mocha format: "5 passing (123ms)"
    //               "1 failing"
    const passedMatch = output.match(/(\d+)\s+passing/i);
    const failedMatch = output.match(/(\d+)\s+failing/i);
    const skippedMatch = output.match(/(\d+)\s+pending/i);

    return {
      passed: passedMatch ? parseInt(passedMatch[1] ?? '0', 10) : 0,
      failed: failedMatch ? parseInt(failedMatch[1] ?? '0', 10) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1] ?? '0', 10) : 0,
      duration: 0,
      failures: this.extractFailures(output),
    };
  }

  /**
   * Extract test failure details from output
   */
  private extractFailures(output: string): TestFailure[] {
    const failures: TestFailure[] = [];

    // Try to extract failure details using common patterns
    // This is a simplified version - real implementation would be more robust
    const failurePattern = /(?:✕|×|FAIL)\s+(.+?)\n[\s\S]*?Error:\s*(.+?)(?:\n\n|\n\s*at)/g;
    let match;

    while ((match = failurePattern.exec(output)) !== null) {
      failures.push({
        test: match[1]?.trim() ?? '',
        error: match[2]?.trim() ?? '',
      });
    }

    return failures;
  }

  /**
   * Generate code coverage report
   *
   * Coverage metrics:
   * - Lines coverage
   * - Functions coverage
   * - Branches coverage
   * - Statements coverage
   *
   * Target: >80% for all metrics
   *
   * @param config - Test framework configuration
   * @param implementation - Code implementation to calculate coverage for
   * @returns Coverage report
   */
  private async generateCoverageReport(
    config: TestFrameworkConfig,
    implementation: CodeImplementation
  ): Promise<CoverageReport> {
    try {
      // Execute coverage command
      const { stdout, stderr } = await execAsync(config.coverageCommand, {
        cwd: this.projectRoot,
        timeout: 30 * 60 * 1000,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      });

      // Parse coverage from output or coverage report file
      const coverage = await this.parseCoverageReport(config, stdout + stderr, implementation);

      return coverage;
    } catch (error: any) {
      // Coverage command may fail but still produce coverage data
      if (error.stdout || error.stderr) {
        const coverage = await this.parseCoverageReport(config, error.stdout + error.stderr, implementation);
        return coverage;
      }

      this.logger.error('Coverage generation failed', error as Error);
      throw new Error(`Coverage generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse coverage report from output or coverage files
   * Filters coverage to only include new/modified files from implementation
   */
  private async parseCoverageReport(
    _config: TestFrameworkConfig,
    output: string,
    implementation: CodeImplementation
  ): Promise<CoverageReport> {
    try {
      // Extract file paths from implementation for filtering
      const implementationFiles = implementation.files.map((f) =>
        path.join(this.projectRoot, f.path)
      );

      // Try to read coverage JSON file (common location)
      const coverageJsonPath = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');

      try {
        const coverageJson = JSON.parse(await fs.readFile(coverageJsonPath, 'utf-8'));

        // Filter coverage to only include implementation files
        const filteredCoverage = this.filterCoverageToNewCode(coverageJson, implementationFiles);

        return {
          lines: filteredCoverage.lines?.pct || 0,
          functions: filteredCoverage.functions?.pct || 0,
          branches: filteredCoverage.branches?.pct || 0,
          statements: filteredCoverage.statements?.pct || 0,
          uncoveredLines: this.extractUncoveredLines(coverageJson, implementationFiles),
        };
      } catch {
        // Fall back to parsing from output
        this.logger.warn(
          'Could not read coverage JSON, falling back to output parsing. ' +
          'Note: Fallback coverage is for entire codebase, not filtered to new code only. ' +
          'Ensure coverage tool generates JSON output for accurate new-code-only metrics.'
        );
        return this.parseCoverageFromOutput(output, implementationFiles);
      }
    } catch (error) {
      this.logger.error('Failed to parse coverage report', error as Error);

      // Return default coverage if parsing fails
      return {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
        uncoveredLines: [],
      };
    }
  }

  /**
   * Parse coverage from test runner output
   *
   * IMPORTANT: This fallback method parses text output which typically only provides
   * overall coverage percentages for the entire codebase. It cannot filter to new code only
   * because text output lacks file-level detail. For accurate new-code-only coverage,
   * ensure the coverage tool generates JSON output (coverage-summary.json).
   *
   * @param output - Coverage output text
   * @param implementationFiles - Implementation files (unused in text parsing, kept for consistency)
   * @returns Coverage report (WARNING: not filtered to new code only)
   */
  private parseCoverageFromOutput(output: string, implementationFiles: string[]): CoverageReport {
    // Log warning about inability to filter from text output
    this.logger.warn(
      'Parsing coverage from text output - cannot filter to new code only. ' +
      `Coverage percentages reflect entire codebase, not just ${implementationFiles.length} implementation files.`
    );

    // Try to extract coverage percentages from output
    const linesMatch = output.match(/(?:Lines|Line)\s*:\s*(\d+(?:\.\d+)?)/i);
    const functionsMatch = output.match(/(?:Functions|Function)\s*:\s*(\d+(?:\.\d+)?)/i);
    const branchesMatch = output.match(/(?:Branches|Branch)\s*:\s*(\d+(?:\.\d+)?)/i);
    const statementsMatch = output.match(/(?:Statements|Statement)\s*:\s*(\d+(?:\.\d+)?)/i);

    return {
      lines: linesMatch ? parseFloat(linesMatch[1] ?? '0') : 0,
      functions: functionsMatch ? parseFloat(functionsMatch[1] ?? '0') : 0,
      branches: branchesMatch ? parseFloat(branchesMatch[1] ?? '0') : 0,
      statements: statementsMatch ? parseFloat(statementsMatch[1] ?? '0') : 0,
      uncoveredLines: [],
    };
  }

  /**
   * Filter coverage JSON to only include new/modified code files
   *
   * @param coverageJson - Full coverage report JSON
   * @param implementationFiles - Absolute paths of implementation files
   * @returns Filtered coverage metrics for new code only
   */
  private filterCoverageToNewCode(
    coverageJson: any,
    implementationFiles: string[]
  ): any {
    // Extract just the file paths without the project root for comparison
    const implFilePaths = implementationFiles.map((f) => {
      // Remove project root and normalize
      const relativePath = f.replace(this.projectRoot, '').replace(/^[/\\]/, '');
      return relativePath.replace(/\\/g, '/').toLowerCase();
    });

    const totalLines = { covered: 0, total: 0 };
    const totalFunctions = { covered: 0, total: 0 };
    const totalBranches = { covered: 0, total: 0 };
    const totalStatements = { covered: 0, total: 0 };

    // Iterate through coverage JSON and aggregate only implementation files
    for (const [filePath, fileData] of Object.entries(coverageJson)) {
      if (filePath === 'total') continue;

      // Normalize the file path for comparison (remove leading slashes, normalize separators)
      const normalizedCoveragePath = filePath
        .replace(/^[/\\]/, '')
        .replace(/\\/g, '/')
        .toLowerCase();

      // Check if this file is in the implementation
      // Use endsWith check to match files regardless of absolute vs relative paths
      const isImplementationFile = implFilePaths.some(
        (implPath) =>
          normalizedCoveragePath.endsWith(implPath) || implPath.endsWith(normalizedCoveragePath) || normalizedCoveragePath === implPath
      );

      if (isImplementationFile) {
        const data = fileData as any;

        // Aggregate lines
        if (data.lines) {
          totalLines.covered += data.lines.covered || 0;
          totalLines.total += data.lines.total || 0;
        }

        // Aggregate functions
        if (data.functions) {
          totalFunctions.covered += data.functions.covered || 0;
          totalFunctions.total += data.functions.total || 0;
        }

        // Aggregate branches
        if (data.branches) {
          totalBranches.covered += data.branches.covered || 0;
          totalBranches.total += data.branches.total || 0;
        }

        // Aggregate statements
        if (data.statements) {
          totalStatements.covered += data.statements.covered || 0;
          totalStatements.total += data.statements.total || 0;
        }
      }
    }

    // Calculate percentages for new code only
    return {
      lines: {
        pct: totalLines.total > 0 ? (totalLines.covered / totalLines.total) * 100 : 0,
        covered: totalLines.covered,
        total: totalLines.total,
      },
      functions: {
        pct: totalFunctions.total > 0 ? (totalFunctions.covered / totalFunctions.total) * 100 : 0,
        covered: totalFunctions.covered,
        total: totalFunctions.total,
      },
      branches: {
        pct: totalBranches.total > 0 ? (totalBranches.covered / totalBranches.total) * 100 : 0,
        covered: totalBranches.covered,
        total: totalBranches.total,
      },
      statements: {
        pct: totalStatements.total > 0 ? (totalStatements.covered / totalStatements.total) * 100 : 0,
        covered: totalStatements.covered,
        total: totalStatements.total,
      },
    };
  }

  /**
   * Extract uncovered lines from coverage JSON, filtered to implementation files only
   *
   * @param coverageJson - Coverage report JSON
   * @param implementationFiles - Absolute paths of implementation files to filter
   * @returns List of uncovered lines (file:line format)
   */
  private extractUncoveredLines(coverageJson: any, implementationFiles?: string[]): string[] {
    const uncovered: string[] = [];

    // Extract relative paths from implementation files
    const implFilePaths = implementationFiles
      ? implementationFiles.map((f) => {
          const relativePath = f.replace(this.projectRoot, '').replace(/^[/\\]/, '');
          return relativePath.replace(/\\/g, '/').toLowerCase();
        })
      : [];

    // Iterate through files in coverage report
    for (const [filePath, fileData] of Object.entries(coverageJson)) {
      if (filePath === 'total') continue;

      // If implementation files provided, filter to only those files
      if (implementationFiles && implementationFiles.length > 0) {
        const normalizedCoveragePath = filePath
          .replace(/^[/\\]/, '')
          .replace(/\\/g, '/')
          .toLowerCase();

        const isImplementationFile = implFilePaths.some(
          (implPath) =>
            normalizedCoveragePath.endsWith(implPath) || implPath.endsWith(normalizedCoveragePath) || normalizedCoveragePath === implPath
        );

        if (!isImplementationFile) continue;
      }

      const data = fileData as any;
      if (data.lines && data.lines.uncovered) {
        for (const line of data.lines.uncovered) {
          uncovered.push(`${filePath}:${line}`);
        }
      }
    }

    return uncovered;
  }

  /**
   * Validate coverage meets >80% target for all metrics
   */
  private validateCoverage(coverage: CoverageReport): boolean {
    const threshold = 80;

    return (
      coverage.lines >= threshold &&
      coverage.functions >= threshold &&
      coverage.branches >= threshold &&
      coverage.statements >= threshold
    );
  }

  /**
   * Automatically fix failing tests (up to 3 attempts)
   *
   * Fix strategy:
   * 1. Parse test failures to extract test name, error, stack trace
   * 2. Invoke Amelia agent to fix failing tests
   * 3. Apply fixed test code to worktree
   * 4. Re-execute tests
   * 5. Repeat up to 3 times
   * 6. Escalate if tests still fail
   *
   * @param testResults - Current test results with failures
   * @param testFiles - Test files that may need fixing
   * @param config - Test framework configuration
   * @param implementation - Original code implementation
   * @param framework - Test framework name
   * @returns Updated test results after fixes
   */
  private async fixFailingTests(
    testResults: TestResults,
    testFiles: TestFile[],
    config: TestFrameworkConfig,
    implementation: CodeImplementation,
    framework: string
  ): Promise<TestResults> {
    const maxAttempts = 3;
    let currentResults = testResults;
    let currentTestFiles = testFiles;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.logger.info(`Fix attempt ${attempt}/${maxAttempts}`, {
        failedCount: currentResults.failed,
      });

      try {
        // Invoke Amelia agent to analyze failures and fix tests
        this.logger.info('Invoking Amelia agent to fix failing tests', {
          failures: currentResults.failures?.length || 0,
        });

        // Prepare failure context for Amelia
        const failureContext: TestFailureContext = {
          implementation,
          testFiles: currentTestFiles,
          testResults: currentResults,
          framework,
        };

        // Invoke Amelia agent to fix failing tests
        const fixedTestSuite = await this.ameliaAgent.fixTests(failureContext);

        this.logger.info('Amelia agent fixed tests', {
          fixedTestCount: fixedTestSuite.testCount,
          fixedFilesCount: fixedTestSuite.files.length,
        });

        // Apply fixed test files to worktree
        await this.createTestFiles(fixedTestSuite.files, config);
        currentTestFiles = fixedTestSuite.files;

        // Re-execute tests after fixes
        currentResults = await this.executeTests(config);

        if (currentResults.failed === 0) {
          this.logger.info('All tests passing after fixes', {
            attempt,
            passed: currentResults.passed,
          });
          break;
        } else {
          this.logger.warn('Some tests still failing after fix attempt', {
            attempt,
            failed: currentResults.failed,
          });
        }
      } catch (error) {
        this.logger.error(`Fix attempt ${attempt} failed`, error as Error);

        if (attempt === maxAttempts) {
          throw new Error(`Failed to fix tests after ${maxAttempts} attempts: ${(error as Error).message}`);
        }
      }
    }

    return currentResults;
  }

  /**
   * Commit test suite to git
   *
   * Commit format:
   * - Message: "Tests for Story {story-id}: {description}"
   * - Body: test count, coverage summary, frameworks used
   * - Includes all test files
   * - Excludes coverage report files
   *
   * @param testSuite - Test suite to commit
   * @param results - Test execution results
   * @param coverage - Coverage report
   * @param context - Story context
   * @returns Commit SHA
   */
  private async commitTestSuite(
    testSuite: TestSuite,
    results: TestResults,
    coverage: CoverageReport,
    context: StoryContext
  ): Promise<string> {
    try {
      // Stage test files using execFile for security (prevents command injection)
      const filePaths = testSuite.files.map(f => f.path);

      // Stage files in batches to avoid command line length limits
      const batchSize = 50;
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        await execFileAsync('git', ['add', '--', ...batch], {
          cwd: this.projectRoot,
        });
      }

      // Generate commit message
      const commitMessage = `Tests for Story ${context.story.id}: ${context.story.title}

Test Count: ${testSuite.testCount} (${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped)
Coverage: ${coverage.lines.toFixed(1)}% lines, ${coverage.functions.toFixed(1)}% functions, ${coverage.branches.toFixed(1)}% branches, ${coverage.statements.toFixed(1)}% statements
Framework: ${testSuite.framework}`;

      // Create commit using execFile with argument array (prevents command injection)
      await execFileAsync('git', ['commit', '-m', commitMessage], {
        cwd: this.projectRoot,
      });

      // Get commit SHA safely
      const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
        cwd: this.projectRoot,
      });

      const commitSha = stdout.trim();

      this.logger.info('Test suite committed', {
        commitSha,
        filesCount: testSuite.files.length,
      });

      return commitSha;
    } catch (error) {
      this.logger.error('Failed to commit test suite', error as Error);
      throw new Error(`Test suite commit failed: ${(error as Error).message}`);
    }
  }

  /**
   * Log performance metrics for test pipeline
   */
  private logPerformanceMetrics(metrics: TestPerformanceMetrics): void {
    this.logger.info('Test pipeline performance metrics', {
      generationDuration: `${metrics.generationDuration}ms`,
      executionDuration: `${metrics.executionDuration}ms`,
      coverageDuration: `${metrics.coverageDuration}ms`,
      fixingDuration: metrics.fixingDuration ? `${metrics.fixingDuration}ms` : 'N/A',
      totalDuration: `${metrics.totalDuration}ms`,
      bottlenecks: metrics.bottlenecks.length > 0 ? metrics.bottlenecks : 'None',
    });

    if (metrics.bottlenecks.length > 0) {
      this.logger.warn('Performance bottlenecks detected', {
        bottlenecks: metrics.bottlenecks,
      });
    }

    // Log warning if total duration approaches timeout
    if (metrics.totalDuration > 25 * 60 * 1000) {
      this.logger.warn('Test pipeline approaching 30-minute timeout', {
        duration: metrics.totalDuration,
        remaining: 30 * 60 * 1000 - metrics.totalDuration,
      });
    }
  }
}
