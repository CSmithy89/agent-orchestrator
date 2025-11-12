/**
 * Agent-specific type definitions for specialized agent capabilities
 *
 * This file contains TypeScript interfaces for agent-specific data structures,
 * particularly for test architecture (Murat) and system architecture (Winston).
 */

/**
 * Test strategy comprehensive definition
 */
export interface TestStrategy {
  /** Overall testing philosophy and approach */
  approach: string;

  /** Testing philosophy description */
  philosophy: string;

  /** Risk-based prioritization */
  riskPrioritization: {
    highRisk: string[];
    mediumRisk: string[];
    lowRisk: string[];
  };

  /** Framework recommendations */
  frameworks: FrameworkRecommendation[];

  /** Test pyramid distribution */
  pyramid: TestPyramid;

  /** CI/CD pipeline specification */
  cicdPipeline: PipelineSpecification;

  /** Quality gates */
  qualityGates: QualityGate[];

  /** ATDD approach */
  atddApproach: ATDDApproach;

  /** Rationale for overall strategy */
  rationale: string;
}

/**
 * Framework recommendation with alternatives
 */
export interface FrameworkRecommendation {
  /** Framework category (unit, integration, e2e, mocking, coverage) */
  category: 'unit' | 'integration' | 'e2e' | 'mocking' | 'coverage' | 'mutation' | 'bdd';

  /** Recommended framework name */
  framework: string;

  /** Rationale for recommendation */
  rationale: string;

  /** Alternatives considered */
  alternatives: Array<{
    name: string;
    pros: string[];
    cons: string[];
  }>;

  /** Tech stack compatibility */
  techStackCompatibility: string[];

  /** Key features */
  features?: string[];

  /** Performance characteristics */
  performance?: string;
}

/**
 * Test pyramid distribution ratios
 */
export interface TestPyramid {
  /** Unit test percentage (typically 70%) */
  unitPercentage: number;

  /** Integration test percentage (typically 20%) */
  integrationPercentage: number;

  /** E2E test percentage (typically 10%) */
  e2ePercentage: number;

  /** Rationale for distribution */
  rationale: string;

  /** Unit test scope description */
  unitScope: string;

  /** Integration test scope description */
  integrationScope: string;

  /** E2E test scope description */
  e2eScope: string;

  /** Execution time targets */
  executionTimeTargets: {
    unit: string;
    integration: string;
    e2e: string;
  };
}

/**
 * CI/CD pipeline specification
 */
export interface PipelineSpecification {
  /** Pipeline stages in order */
  stages: PipelineStage[];

  /** Quality gates that must pass */
  qualityGates: string[];

  /** Branch strategies (feature, main, release) */
  branchStrategies: Record<string, string>;

  /** Notification strategy */
  notificationStrategy: string;

  /** Rollback strategy */
  rollbackStrategy?: string;
}

/**
 * Pipeline stage definition
 */
export interface PipelineStage {
  /** Stage name */
  name: string;

  /** Stage description */
  description: string;

  /** Actions performed in this stage */
  actions: string[];

  /** Failure handling strategy */
  failureHandling: string;

  /** Execution time target */
  executionTime: string;

  /** Parallel execution flag */
  parallel?: boolean;

  /** Stage order/sequence */
  order: number;
}

/**
 * Quality gate definition
 */
export interface QualityGate {
  /** Gate name */
  name: string;

  /** Gate type (coverage, test, security, performance) */
  type: 'coverage' | 'test' | 'security' | 'performance' | 'mutation';

  /** Threshold value */
  threshold: string | number;

  /** Rationale for this threshold */
  rationale: string;

  /** Enforcement level (block, warn, advisory) */
  enforcement: 'block' | 'warn' | 'advisory';

  /** Measurement metric */
  metric?: string;
}

/**
 * ATDD (Acceptance Test-Driven Development) approach
 */
export interface ATDDApproach {
  /** ATDD workflow description */
  workflow: string[];

  /** BDD framework recommendation */
  bddFramework: string;

  /** BDD framework rationale */
  frameworkRationale: string;

  /** Acceptance criteria format (Gherkin, etc.) */
  acceptanceCriteriaFormat: string;

  /** Test organization structure */
  testOrganization: {
    directoryStructure: string;
    namingConventions: string;
  };

  /** Step definition guidelines */
  stepDefinitionGuidelines: string[];

  /** Living documentation approach */
  livingDocumentation: {
    reports: string;
    documentationSite: string;
  };

  /** ATDD and test pyramid relationship */
  pyramidRelationship: string;
}

/**
 * Architecture analysis result (for Winston integration)
 */
export interface ArchitectureAnalysis {
  /** Tech stack extracted from architecture */
  techStack: string[];

  /** Testability concerns identified */
  testabilityConcerns: string[];

  /** Components requiring test infrastructure */
  componentsRequiringTestInfra: string[];

  /** Database/API testing requirements */
  dataLayerTestingNeeds: string[];

  /** Summary of analysis */
  summary: string;
}

/**
 * Tech stack compatibility validation result
 */
export interface ValidationResult {
  /** Validation passed flag */
  valid: boolean;

  /** Incompatibilities found */
  incompatibilities: Array<{
    framework: string;
    techStack: string;
    issue: string;
    recommendation: string;
  }>;

  /** Warnings (non-blocking issues) */
  warnings: string[];

  /** Overall compatibility score (0.0-1.0) */
  compatibilityScore: number;
}
