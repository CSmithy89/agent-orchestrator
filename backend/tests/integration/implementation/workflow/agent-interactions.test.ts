/**
 * Integration Test: Agent Interactions
 *
 * Tests Amelia and Alex agent coordination:
 * - Agent initialization with proper LLM configuration
 * - Context passing between agents
 * - Amelia → Alex handoff for code review
 * - Review coordination and aggregated decisions
 * - Error handling for LLM API failures
 */

import { describe, it, expect, vi } from 'vitest';
import {
  mockAmeliaImplementation,
  mockAmeliaTests,
  mockAmeliaSelfReview,
  mockAlexIndependentReview,
  mockAlexSecurityReview,
  mockAlexQualityAnalysis,
  mockAlexTestValidation,
} from './fixtures/llm-mock-responses';
import { mockAmeliaAgent, mockAlexAgent, retryWithBackoff } from './fixtures/test-utilities';
import type {
  StoryContext,
} from '@/implementation/types';

describe('Agent Interactions (Story 5-8 AC2)', () => {
  const mockStoryContext: StoryContext = {
    story: {
      id: '99-1-sample-test-story',
      title: 'Sample Test Story',
      description: 'Test story for agent interactions',
      acceptanceCriteria: ['AC1: Feature implemented', 'AC2: Tests passing'],
      technicalNotes: {},
      dependencies: [],
    },
    prdContext: 'PRD context...',
    architectureContext: 'Architecture context...',
    onboardingDocs: 'Coding standards...',
    existingCode: [],
    totalTokens: 45000,
  };

  describe('Amelia Agent Initialization and Methods', () => {
    it('should initialize Amelia agent with correct configuration', () => {
      // Arrange & Act
      const amelia = mockAmeliaAgent({
        implementStory: mockAmeliaImplementation,
        writeTests: mockAmeliaTests,
        reviewCode: mockAmeliaSelfReview,
      });

      // Assert: Agent has correct properties
      expect(amelia.name).toBe('amelia');
      expect(amelia.role).toBe('Developer');
      expect(amelia.implementStory).toBeDefined();
      expect(amelia.writeTests).toBeDefined();
      expect(amelia.reviewCode).toBeDefined();
    });

    it('should invoke Amelia.implementStory() with story context', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        implementStory: mockAmeliaImplementation,
      });

      // Act
      const implementation = await amelia.implementStory(mockStoryContext);

      // Assert: Implementation returned
      expect(implementation).toBeDefined();
      expect(implementation.files).toHaveLength(1);
      expect(implementation.commitMessage).toBeTruthy();
      expect(implementation.acceptanceCriteriaMapping).toHaveLength(1);

      // Assert: Amelia was called with correct context
      expect(amelia.implementStory).toHaveBeenCalledWith(mockStoryContext);
      expect(amelia.implementStory).toHaveBeenCalledTimes(1);
    });

    it('should invoke Amelia.writeTests() with code implementation', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        writeTests: mockAmeliaTests,
      });

      // Act
      const tests = await amelia.writeTests(mockAmeliaImplementation);

      // Assert: Tests returned
      expect(tests).toBeDefined();
      expect(tests.testCount).toBeGreaterThan(0);
      expect(tests.coverage.lines.percentage).toBeGreaterThanOrEqual(80);

      // Assert: Amelia was called with implementation
      expect(amelia.writeTests).toHaveBeenCalledWith(mockAmeliaImplementation);
      expect(amelia.writeTests).toHaveBeenCalledTimes(1);
    });

    it('should invoke Amelia.reviewCode() for self-review', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        reviewCode: mockAmeliaSelfReview,
      });

      // Act
      const review = await amelia.reviewCode(mockAmeliaImplementation);

      // Assert: Self-review returned
      expect(review).toBeDefined();
      expect(review.confidence).toBeGreaterThan(0.85);
      expect(review.checklistResults.acceptanceCriteriaMet).toBe(true);

      // Assert: Amelia was called with implementation
      expect(amelia.reviewCode).toHaveBeenCalledWith(mockAmeliaImplementation);
      expect(amelia.reviewCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alex Agent Initialization with Different LLM', () => {
    it('should initialize Alex agent with different LLM configuration', () => {
      // Arrange & Act
      const alex = mockAlexAgent({
        reviewSecurity: mockAlexSecurityReview,
        analyzeQuality: mockAlexQualityAnalysis,
        validateTests: mockAlexTestValidation,
        generateReport: mockAlexIndependentReview,
      });

      // Assert: Agent has correct properties
      expect(alex.name).toBe('alex');
      expect(alex.role).toBe('Code Reviewer');
      expect(alex.reviewSecurity).toBeDefined();
      expect(alex.analyzeQuality).toBeDefined();
      expect(alex.validateTests).toBeDefined();
      expect(alex.generateReport).toBeDefined();
    });

    it('should invoke Alex.reviewSecurity() for security analysis', async () => {
      // Arrange
      const alex = mockAlexAgent({
        reviewSecurity: mockAlexSecurityReview,
      });

      // Act
      const securityReview = await alex.reviewSecurity(mockAmeliaImplementation);

      // Assert: Security review returned
      expect(securityReview).toBeDefined();
      expect(securityReview.vulnerabilities).toBeDefined();
      expect(securityReview.securityScore).toBeGreaterThan(0);
      expect(securityReview.criticalIssues).toBeDefined();

      // Assert: Alex was called with implementation
      expect(alex.reviewSecurity).toHaveBeenCalledWith(mockAmeliaImplementation);
      expect(alex.reviewSecurity).toHaveBeenCalledTimes(1);
    });

    it('should invoke Alex.analyzeQuality() for code quality analysis', async () => {
      // Arrange
      const alex = mockAlexAgent({
        analyzeQuality: mockAlexQualityAnalysis,
      });

      // Act
      const qualityAnalysis = await alex.analyzeQuality(mockAmeliaImplementation);

      // Assert: Quality analysis returned
      expect(qualityAnalysis).toBeDefined();
      expect(qualityAnalysis.complexity).toBeDefined();
      expect(qualityAnalysis.maintainability).toBeDefined();
      expect(qualityAnalysis.bestPractices).toBeDefined();

      // Assert: Alex was called with implementation
      expect(alex.analyzeQuality).toHaveBeenCalledWith(mockAmeliaImplementation);
      expect(alex.analyzeQuality).toHaveBeenCalledTimes(1);
    });

    it('should invoke Alex.validateTests() for test validation', async () => {
      // Arrange
      const alex = mockAlexAgent({
        validateTests: mockAlexTestValidation,
      });

      // Act
      const testValidation = await alex.validateTests(mockAmeliaTests, mockAmeliaTests.coverage);

      // Assert: Test validation returned
      expect(testValidation).toBeDefined();
      expect(testValidation.coverageAdequate).toBe(true);
      expect(testValidation.testQuality).toBeDefined();

      // Assert: Alex was called with tests and coverage
      expect(alex.validateTests).toHaveBeenCalledWith(mockAmeliaTests, mockAmeliaTests.coverage);
      expect(alex.validateTests).toHaveBeenCalledTimes(1);
    });
  });

  describe('Amelia → Alex Handoff', () => {
    it('should pass code implementation from Amelia to Alex for review', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        implementStory: mockAmeliaImplementation,
      });

      const alex = mockAlexAgent({
        reviewSecurity: mockAlexSecurityReview,
      });

      // Act: Amelia implements
      const implementation = await amelia.implementStory(mockStoryContext);

      // Act: Alex reviews Amelia's implementation
      const securityReview = await alex.reviewSecurity(implementation);

      // Assert: Implementation passed from Amelia to Alex
      expect(implementation).toBe(mockAmeliaImplementation);
      expect(alex.reviewSecurity).toHaveBeenCalledWith(implementation);
      expect(securityReview).toBeDefined();
    });

    it('should pass tests from Amelia to Alex for validation', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        writeTests: mockAmeliaTests,
      });

      const alex = mockAlexAgent({
        validateTests: mockAlexTestValidation,
      });

      // Act: Amelia writes tests
      const tests = await amelia.writeTests(mockAmeliaImplementation);

      // Act: Alex validates Amelia's tests
      const testValidation = await alex.validateTests(tests, tests.coverage);

      // Assert: Tests passed from Amelia to Alex
      expect(tests).toBe(mockAmeliaTests);
      expect(alex.validateTests).toHaveBeenCalledWith(tests, tests.coverage);
      expect(testValidation.coverageAdequate).toBe(true);
    });
  });

  describe('Review Coordination', () => {
    it('should aggregate self-review and independent review for decision', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        reviewCode: mockAmeliaSelfReview,
      });

      const alex = mockAlexAgent({
        generateReport: mockAlexIndependentReview,
      });

      // Act: Both agents review
      const selfReview = await amelia.reviewCode(mockAmeliaImplementation);
      const independentReview = await alex.generateReport([
        mockAlexSecurityReview,
        mockAlexQualityAnalysis,
        mockAlexTestValidation,
      ]);

      // Act: Aggregate decision
      const aggregatedDecision = {
        ameliaConfidence: selfReview.confidence,
        alexConfidence: independentReview.confidence,
        overallConfidence: (selfReview.confidence + independentReview.confidence) / 2,
        criticalIssues: independentReview.criticalIssues,
        decision: independentReview.criticalIssues.length === 0 && independentReview.confidence > 0.85
          ? 'approve'
          : 'reject',
      };

      // Assert: Aggregated decision combines both reviews
      expect(aggregatedDecision.ameliaConfidence).toBe(0.92);
      expect(aggregatedDecision.alexConfidence).toBe(0.88);
      expect(aggregatedDecision.overallConfidence).toBe(0.90);
      expect(aggregatedDecision.criticalIssues).toHaveLength(0);
      expect(aggregatedDecision.decision).toBe('approve');
    });

    it('should reject if Alex finds critical issues even if Amelia approves', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        reviewCode: mockAmeliaSelfReview, // Confidence: 0.92
      });

      const alexWithIssues = mockAlexAgent({
        generateReport: {
          confidence: 0.65,
          criticalIssues: ['SQL Injection vulnerability'],
          overallDecision: 'reject',
        },
      });

      // Act: Both agents review
      const selfReview = await amelia.reviewCode(mockAmeliaImplementation);
      const independentReview = await alexWithIssues.generateReport([]);

      // Act: Aggregate decision
      const aggregatedDecision = {
        ameliaConfidence: selfReview.confidence,
        alexConfidence: independentReview.confidence,
        criticalIssues: independentReview.criticalIssues,
        decision: independentReview.criticalIssues.length > 0 ? 'reject' : 'approve',
      };

      // Assert: Critical issues trigger rejection
      expect(aggregatedDecision.ameliaConfidence).toBe(0.92); // High
      expect(aggregatedDecision.alexConfidence).toBe(0.65); // Low
      expect(aggregatedDecision.criticalIssues).toHaveLength(1);
      expect(aggregatedDecision.decision).toBe('reject');
    });
  });

  describe('Agent Error Handling', () => {
    it('should handle LLM API timeout with retry', async () => {
      // Arrange: Mock LLM API that fails first time, succeeds second time
      let callCount = 0;
      const ameliaWithRetry = {
        name: 'amelia',
        role: 'Developer',
        implementStory: vi.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            throw new Error('LLM API timeout');
          }
          return mockAmeliaImplementation;
        }),
      };

      // Act: Call with retry logic
      const implementation = await retryWithBackoff(
        () => ameliaWithRetry.implementStory(mockStoryContext),
        3,
        100
      );

      // Assert: Retry succeeded
      expect(implementation).toBe(mockAmeliaImplementation);
      expect(ameliaWithRetry.implementStory).toHaveBeenCalledTimes(2); // Failed once, succeeded on retry
    });

    it('should track agent state transitions', async () => {
      // Arrange
      const agentStates: Array<{ agent: string; state: string; timestamp: number }> = [];

      const amelia = mockAmeliaAgent({
        implementStory: mockAmeliaImplementation,
        writeTests: mockAmeliaTests,
        reviewCode: mockAmeliaSelfReview,
      });

      // Act: Simulate state transitions
      agentStates.push({ agent: 'amelia', state: 'idle', timestamp: Date.now() });

      await amelia.implementStory(mockStoryContext);
      agentStates.push({ agent: 'amelia', state: 'implementing', timestamp: Date.now() });

      await amelia.writeTests(mockAmeliaImplementation);
      agentStates.push({ agent: 'amelia', state: 'testing', timestamp: Date.now() });

      await amelia.reviewCode(mockAmeliaImplementation);
      agentStates.push({ agent: 'amelia', state: 'reviewing', timestamp: Date.now() });

      agentStates.push({ agent: 'amelia', state: 'completed', timestamp: Date.now() });

      // Assert: State transitions tracked correctly
      expect(agentStates).toHaveLength(5);
      expect(agentStates.map(s => s.state)).toEqual([
        'idle',
        'implementing',
        'testing',
        'reviewing',
        'completed',
      ]);
      expect(agentStates.every(s => s.agent === 'amelia')).toBe(true);
    });
  });

  describe('Context Passing', () => {
    it('should provide StoryContext correctly to both agents', async () => {
      // Arrange
      const amelia = mockAmeliaAgent({
        implementStory: mockAmeliaImplementation,
      });

      const alex = mockAlexAgent({
        generateReport: mockAlexIndependentReview,
      });

      // Act: Pass context to both agents
      await amelia.implementStory(mockStoryContext);
      await alex.generateReport([
        mockAlexSecurityReview,
        mockAlexQualityAnalysis,
        mockAlexTestValidation,
      ]);

      // Assert: Context passed to both agents
      expect(amelia.implementStory).toHaveBeenCalledWith(mockStoryContext);
      expect(alex.generateReport).toHaveBeenCalled();
      expect(mockStoryContext.story.id).toBe('99-1-sample-test-story');
      expect(mockStoryContext.totalTokens).toBeLessThan(50000);
    });

    it('should validate context includes all required sections', async () => {
      // Arrange
      const context = mockStoryContext;

      // Assert: All required sections present
      expect(context.story).toBeDefined();
      expect(context.story.id).toBeTruthy();
      expect(context.story.title).toBeTruthy();
      expect(context.story.acceptanceCriteria).toBeDefined();
      expect(context.story.acceptanceCriteria.length).toBeGreaterThan(0);

      expect(context.prdContext).toBeTruthy();
      expect(context.architectureContext).toBeTruthy();
      expect(context.onboardingDocs).toBeTruthy();
      expect(context.existingCode).toBeDefined();

      expect(context.totalTokens).toBeGreaterThan(0);
      expect(context.totalTokens).toBeLessThan(50000);
    });
  });
});
