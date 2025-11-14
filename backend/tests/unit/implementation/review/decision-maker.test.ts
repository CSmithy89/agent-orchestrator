/**
 * Unit Tests for Decision Maker
 *
 * Tests decision logic for pass/fail/escalate scenarios.
 */

import { describe, it, expect } from 'vitest';
import { makeDecision } from '../../../../src/implementation/review/decision-maker.js';
import {
  SelfReviewReport,
  IndependentReviewReport
} from '../../../../src/implementation/types.js';

describe('DecisionMaker', () => {
  describe('makeDecision', () => {
    it('should return pass when both reviews pass with high confidence', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
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

      const alexReview: IndependentReviewReport = {
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

      // Act
      const result = makeDecision(ameliaReview, alexReview, 0.85);

      // Assert
      expect(result.decision).toBe('pass');
      expect(result.rationale).toContain('PASS');
      expect(result.rationale).toContain('Both reviews passed');
    });

    it('should return escalate when confidence is below threshold', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.7, // Low confidence
        criticalIssues: []
      };

      const alexReview: IndependentReviewReport = {
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
        confidence: 0.8,
        decision: 'pass',
        findings: [],
        recommendations: []
      };

      // Act
      const result = makeDecision(ameliaReview, alexReview, 0.85);

      // Assert
      expect(result.decision).toBe('escalate');
      expect(result.rationale).toContain('ESCALATE');
      expect(result.rationale).toContain('below threshold');
    });

    it('should return fail when critical issues are identified', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: ['Missing error handling', 'No input validation']
      };

      const alexReview: IndependentReviewReport = {
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

      // Act
      const result = makeDecision(ameliaReview, alexReview, 0.85);

      // Assert
      expect(result.decision).toBe('fail');
      expect(result.rationale).toContain('FAIL');
      expect(result.rationale).toContain('critical issues');
    });

    it('should return escalate when security issues are critical/high', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: []
      };

      const alexReview: IndependentReviewReport = {
        securityReview: {
          vulnerabilities: [
            {
              type: 'SQL Injection',
              severity: 'critical',
              location: 'test.ts:10',
              description: 'SQL injection vulnerability',
              remediation: 'Use parameterized queries'
            }
          ],
          score: 40,
          passed: false
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
        architectureCompliance: { compliant: true, violations: [] },
        overallScore: 0.85,
        confidence: 0.9,
        decision: 'fail',
        findings: [],
        recommendations: []
      };

      // Act
      const result = makeDecision(ameliaReview, alexReview, 0.85);

      // Assert
      expect(result.decision).toBe('escalate');
      expect(result.rationale).toContain('ESCALATE');
      expect(result.rationale).toContain('security issues');
    });

    it('should return fail when test coverage is inadequate', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: []
      };

      const alexReview: IndependentReviewReport = {
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
          coverageAdequate: false, // Coverage below 80%
          testQuality: {
            edgeCasesCovered: false,
            errorHandlingTested: false,
            integrationTestsPresent: false
          },
          missingTests: ['function1', 'function2'],
          score: 60
        },
        architectureCompliance: { compliant: true, violations: [] },
        overallScore: 0.75,
        confidence: 0.9,
        decision: 'fail',
        findings: [],
        recommendations: []
      };

      // Act
      const result = makeDecision(ameliaReview, alexReview, 0.85);

      // Assert
      expect(result.decision).toBe('fail');
      expect(result.rationale).toContain('FAIL');
      expect(result.rationale).toContain('coverage below 80%');
    });

    it('should return escalate when Alex review fails', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.9,
        criticalIssues: []
      };

      const alexReview: IndependentReviewReport = {
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
        decision: 'fail', // Alex decided to fail
        findings: [],
        recommendations: []
      };

      // Act
      const result = makeDecision(ameliaReview, alexReview, 0.85);

      // Assert
      expect(result.decision).toBe('escalate');
      expect(result.rationale).toContain('ESCALATE');
      expect(result.rationale).toContain('independent review failed');
    });

    it('should use custom confidence threshold', () => {
      // Arrange
      const ameliaReview: SelfReviewReport = {
        checklist: [],
        codeSmells: [],
        acceptanceCriteriaCheck: [],
        confidence: 0.88,
        criticalIssues: []
      };

      const alexReview: IndependentReviewReport = {
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
        confidence: 0.88,
        decision: 'pass',
        findings: [],
        recommendations: []
      };

      // Act - with threshold 0.9 (should fail)
      const result1 = makeDecision(ameliaReview, alexReview, 0.9);
      expect(result1.decision).toBe('escalate');

      // Act - with threshold 0.85 (should pass)
      const result2 = makeDecision(ameliaReview, alexReview, 0.85);
      expect(result2.decision).toBe('pass');
    });
  });
});
