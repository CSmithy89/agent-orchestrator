/**
 * Unit Tests for DualAgentCodeReviewer
 *
 * Tests dual-agent code review coordination with mocked Amelia and Alex agents.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualAgentCodeReviewer } from '../../../../src/implementation/review/DualAgentCodeReviewer.js';
import { AmeliaAgentInfrastructure } from '../../../../src/implementation/agents/amelia.js';
import { AlexAgentInfrastructure } from '../../../../src/implementation/agents/alex.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite,
  SelfReviewReport,
  IndependentReviewReport
} from '../../../../src/implementation/types.js';

// Mock the executor modules
vi.mock('../../../../src/implementation/review/self-review-executor.js', () => ({
  executeSelfReview: vi.fn()
}));

vi.mock('../../../../src/implementation/review/independent-review-executor.js', () => ({
  executeIndependentReview: vi.fn()
}));

vi.mock('../../../../src/implementation/review/decision-maker.js', () => ({
  makeDecision: vi.fn()
}));

import { executeSelfReview } from '../../../../src/implementation/review/self-review-executor.js';
import { executeIndependentReview } from '../../../../src/implementation/review/independent-review-executor.js';
import { makeDecision } from '../../../../src/implementation/review/decision-maker.js';

describe('DualAgentCodeReviewer', () => {
  let reviewer: DualAgentCodeReviewer;
  let mockAmeliaAgent: AmeliaAgentInfrastructure;
  let mockAlexAgent: AlexAgentInfrastructure;
  let mockContext: StoryContext;
  let mockCode: CodeImplementation;
  let mockTests: TestSuite;

  beforeEach(() => {
    // Create mock agents
    mockAmeliaAgent = {} as AmeliaAgentInfrastructure;
    mockAlexAgent = {} as AlexAgentInfrastructure;

    // Create reviewer instance
    reviewer = new DualAgentCodeReviewer(mockAmeliaAgent, mockAlexAgent);

    // Create mock context
    mockContext = {
      story: {
        id: 'test-story',
        title: 'Test Story',
        description: 'Test description',
        acceptanceCriteria: ['AC1: Test passes'],
        technicalNotes: {},
        dependencies: []
      },
      prdContext: '',
      architectureContext: '',
      onboardingDocs: '',
      existingCode: [],
      totalTokens: 1000
    };

    // Create mock code implementation
    mockCode = {
      files: [
        {
          path: 'src/test.ts',
          content: 'export function test() { return true; }',
          operation: 'create'
        }
      ],
      commitMessage: 'Test implementation',
      implementationNotes: 'Test notes',
      acceptanceCriteriaMapping: []
    };

    // Create mock test suite
    mockTests = {
      files: [
        {
          path: 'tests/test.test.ts',
          content: 'test("test", () => { expect(true).toBe(true); })'
        }
      ],
      framework: 'vitest',
      testCount: 1,
      coverage: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
        uncoveredLines: []
      },
      results: {
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 100
      }
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('performDualReview', () => {
    it('should orchestrate complete dual-review pipeline', async () => {
      // Arrange
      const mockAmeliaReview: SelfReviewReport = {
        checklist: [
          { item: 'Code follows standards', passed: true }
        ],
        codeSmells: [],
        acceptanceCriteriaCheck: [
          { criterion: 'AC1', met: true, evidence: 'test.ts' }
        ],
        confidence: 0.9,
        criticalIssues: []
      };

      const mockAlexReview: IndependentReviewReport = {
        securityReview: {
          vulnerabilities: [],
          score: 100,
          passed: true
        },
        qualityAnalysis: {
          complexityScore: 5,
          maintainabilityIndex: 85,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 85
        },
        testValidation: {
          coverageAdequate: true,
          testQuality: {
            edgeCasesCovered: true,
            errorHandlingTested: true,
            integrationTestsPresent: false
          },
          missingTests: [],
          score: 85
        },
        architectureCompliance: {
          compliant: true,
          violations: []
        },
        overallScore: 0.85,
        confidence: 0.9,
        decision: 'pass',
        findings: [],
        recommendations: []
      };

      vi.mocked(executeSelfReview).mockResolvedValue(mockAmeliaReview);
      vi.mocked(executeIndependentReview).mockResolvedValue(mockAlexReview);
      vi.mocked(makeDecision).mockReturnValue({
        decision: 'pass',
        rationale: 'Both reviews passed with high confidence'
      });

      // Act
      const result = await reviewer.performDualReview(mockCode, mockTests, mockContext);

      // Assert
      expect(executeSelfReview).toHaveBeenCalledWith(
        mockAmeliaAgent,
        mockCode,
        mockTests,
        mockContext
      );
      expect(executeIndependentReview).toHaveBeenCalledWith(
        mockAlexAgent,
        mockCode,
        mockTests,
        mockContext,
        mockAmeliaReview
      );
      expect(makeDecision).toHaveBeenCalledWith(
        mockAmeliaReview,
        mockAlexReview,
        0.85
      );
      expect(result.decision).toBe('pass');
      expect(result.ameliaReview).toEqual(mockAmeliaReview);
      expect(result.alexReview).toEqual(mockAlexReview);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.ameliaTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.alexTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.decisionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle escalate decision when confidence is low', async () => {
      // Arrange
      const mockAmeliaReview: SelfReviewReport = {
        checklist: [
          { item: 'Code follows standards', passed: true }
        ],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.7, // Low confidence
        criticalIssues: []
      };

      const mockAlexReview: IndependentReviewReport = {
        securityReview: {
          vulnerabilities: [],
          score: 100,
          passed: true
        },
        qualityAnalysis: {
          complexityScore: 5,
          maintainabilityIndex: 85,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 85
        },
        testValidation: {
          coverageAdequate: true,
          testQuality: {
            edgeCasesCovered: true,
            errorHandlingTested: true,
            integrationTestsPresent: false
          },
          missingTests: [],
          score: 85
        },
        architectureCompliance: {
          compliant: true,
          violations: []
        },
        overallScore: 0.85,
        confidence: 0.75, // Low confidence
        decision: 'escalate',
        findings: [],
        recommendations: []
      };

      vi.mocked(executeSelfReview).mockResolvedValue(mockAmeliaReview);
      vi.mocked(executeIndependentReview).mockResolvedValue(mockAlexReview);
      vi.mocked(makeDecision).mockReturnValue({
        decision: 'escalate',
        rationale: 'Combined confidence below threshold'
      });

      // Act
      const result = await reviewer.performDualReview(mockCode, mockTests, mockContext);

      // Assert
      expect(result.decision).toBe('escalate');
      expect(result.combinedConfidence).toBe(0.725); // (0.7 + 0.75) / 2
    });

    it('should handle error during self-review', async () => {
      // Arrange
      vi.mocked(executeSelfReview).mockRejectedValue(
        new Error('Self-review failed')
      );

      // Act & Assert
      await expect(
        reviewer.performDualReview(mockCode, mockTests, mockContext)
      ).rejects.toThrow('Dual-agent code review failed: Self-review failed');
    });

    it('should handle error during independent review', async () => {
      // Arrange
      const mockAmeliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: []
      };

      vi.mocked(executeSelfReview).mockResolvedValue(mockAmeliaReview);
      vi.mocked(executeIndependentReview).mockRejectedValue(
        new Error('Independent review failed')
      );

      // Act & Assert
      await expect(
        reviewer.performDualReview(mockCode, mockTests, mockContext)
      ).rejects.toThrow('Dual-agent code review failed: Independent review failed');
    });

    it('should use custom confidence threshold', async () => {
      // Arrange
      const customThreshold = 0.9;
      const customReviewer = new DualAgentCodeReviewer(
        mockAmeliaAgent,
        mockAlexAgent,
        { confidenceThreshold: customThreshold }
      );

      const mockAmeliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: []
      };

      const mockAlexReview: IndependentReviewReport = {
        securityReview: { vulnerabilities: [], score: 100, passed: true },
        qualityAnalysis: {
          complexityScore: 5,
          maintainabilityIndex: 85,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 85
        },
        testValidation: {
          coverageAdequate: true,
          testQuality: {
            edgeCasesCovered: true,
            errorHandlingTested: true,
            integrationTestsPresent: false
          },
          missingTests: [],
          score: 85
        },
        architectureCompliance: { compliant: true, violations: [] },
        overallScore: 0.85,
        confidence: 0.9,
        decision: 'pass',
        findings: [],
        recommendations: []
      };

      vi.mocked(executeSelfReview).mockResolvedValue(mockAmeliaReview);
      vi.mocked(executeIndependentReview).mockResolvedValue(mockAlexReview);
      vi.mocked(makeDecision).mockReturnValue({
        decision: 'pass',
        rationale: 'Test'
      });

      // Act
      await customReviewer.performDualReview(mockCode, mockTests, mockContext);

      // Assert
      expect(makeDecision).toHaveBeenCalledWith(
        mockAmeliaReview,
        mockAlexReview,
        customThreshold
      );
    });

    it('should aggregate findings from both reviews', async () => {
      // Arrange
      const mockAmeliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [
          {
            type: 'long-function',
            location: 'test.ts:10',
            severity: 'medium',
            recommendation: 'Split into smaller functions'
          }
        ],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: ['Missing error handling']
      };

      const mockAlexReview: IndependentReviewReport = {
        securityReview: { vulnerabilities: [], score: 100, passed: true },
        qualityAnalysis: {
          complexityScore: 5,
          maintainabilityIndex: 85,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 85
        },
        testValidation: {
          coverageAdequate: true,
          testQuality: {
            edgeCasesCovered: true,
            errorHandlingTested: true,
            integrationTestsPresent: false
          },
          missingTests: [],
          score: 85
        },
        architectureCompliance: { compliant: true, violations: [] },
        overallScore: 0.85,
        confidence: 0.9,
        decision: 'pass',
        findings: [
          {
            category: 'security',
            severity: 'low',
            title: 'Minor security issue',
            description: 'Test issue',
            location: 'test.ts:5',
            recommendation: 'Fix this'
          }
        ],
        recommendations: ['Improve security']
      };

      vi.mocked(executeSelfReview).mockResolvedValue(mockAmeliaReview);
      vi.mocked(executeIndependentReview).mockResolvedValue(mockAlexReview);
      vi.mocked(makeDecision).mockReturnValue({
        decision: 'pass',
        rationale: 'Test'
      });

      // Act
      const result = await reviewer.performDualReview(mockCode, mockTests, mockContext);

      // Assert
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Should include Amelia's code smell
      const codeSmellFinding = result.findings.find(f => f.title.includes('Code Smell'));
      expect(codeSmellFinding).toBeDefined();

      // Should include Amelia's critical issue
      const criticalFinding = result.findings.find(f => f.severity === 'critical');
      expect(criticalFinding).toBeDefined();

      // Should include Alex's finding
      const alexFinding = result.findings.find(f => f.title === 'Minor security issue');
      expect(alexFinding).toBeDefined();
    });
  });
});
