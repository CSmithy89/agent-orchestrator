/**
 * Integration Tests for Dual-Agent Code Review
 *
 * Tests complete dual-review pipeline with real agent method invocations
 * (using mocked LLM responses).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualAgentCodeReviewer } from '../../../../src/implementation/review/DualAgentCodeReviewer.js';
import { AmeliaAgentInfrastructure } from '../../../../src/implementation/agents/amelia.js';
import { AlexAgentInfrastructure } from '../../../../src/implementation/agents/alex.js';
import { AgentPool } from '../../../../src/core/AgentPool.js';
import { ProjectConfig } from '../../../../src/config/ProjectConfig.js';
import {
  StoryContext,
  CodeImplementation,
  TestSuite
} from '../../../../src/implementation/types.js';

describe('Dual-Agent Review Integration', () => {
  let reviewer: DualAgentCodeReviewer;
  let ameliaAgent: AmeliaAgentInfrastructure;
  let alexAgent: AlexAgentInfrastructure;
  let mockAgentPool: AgentPool;
  let mockProjectConfig: ProjectConfig;

  beforeEach(async () => {
    // Create mock AgentPool and ProjectConfig
    mockAgentPool = {
      createAgent: vi.fn(),
      destroyAgent: vi.fn(),
      invokeAgent: vi.fn()
    } as unknown as AgentPool;

    mockProjectConfig = {} as ProjectConfig;

    // Create agent infrastructures
    ameliaAgent = await AmeliaAgentInfrastructure.create(
      mockAgentPool,
      mockProjectConfig
    );

    alexAgent = await AlexAgentInfrastructure.create(
      mockAgentPool,
      mockProjectConfig
    );

    // Create reviewer
    reviewer = new DualAgentCodeReviewer(ameliaAgent, alexAgent);
  });

  describe('Happy Path - Both Reviews Pass', () => {
    it('should complete dual-review pipeline and return pass decision', async () => {
      // Arrange
      const context: StoryContext = {
        story: {
          id: 'test-story',
          title: 'Test Story',
          description: 'As a developer, I want to test dual review',
          acceptanceCriteria: ['AC1: Code quality is high'],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      const code: CodeImplementation = {
        files: [
          {
            path: 'src/feature.ts',
            content: `
              /**
               * Feature implementation
               */
              export class Feature {
                constructor(private readonly name: string) {}

                getName(): string {
                  return this.name;
                }

                validate(): boolean {
                  if (!this.name || this.name.trim() === '') {
                    throw new Error('Name is required');
                  }
                  return true;
                }
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Add Feature class with validation',
        implementationNotes: 'Implemented Feature class with proper error handling',
        acceptanceCriteriaMapping: [
          {
            criterion: 'AC1: Code quality is high',
            implemented: true,
            evidence: 'src/feature.ts - Feature class with validation'
          }
        ]
      };

      const tests: TestSuite = {
        files: [
          {
            path: 'tests/feature.test.ts',
            content: `
              import { describe, it, expect } from 'vitest';
              import { Feature } from '../src/feature.js';

              describe('Feature', () => {
                it('should return name', () => {
                  const feature = new Feature('test');
                  expect(feature.getName()).toBe('test');
                });

                it('should validate name', () => {
                  const feature = new Feature('test');
                  expect(feature.validate()).toBe(true);
                });

                it('should throw error for empty name', () => {
                  const feature = new Feature('');
                  expect(() => feature.validate()).toThrow('Name is required');
                });
              });
            `
          }
        ],
        framework: 'vitest',
        testCount: 3,
        coverage: {
          lines: 90,
          functions: 100,
          branches: 85,
          statements: 90,
          uncoveredLines: []
        },
        results: {
          passed: 3,
          failed: 0,
          skipped: 0,
          duration: 150
        }
      };

      // Mock Amelia's reviewCode response
      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'agent-1',
        name: 'amelia',
        persona: {},
        llmConfig: {}
      } as any);

      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          checklist: [
            { item: 'Code follows TypeScript standards', passed: true },
            { item: 'Error handling present', passed: true },
            { item: 'Acceptance criteria met', passed: true }
          ],
          codeSmells: [],
          acceptanceCriteriaCheck: [
            { criterion: 'AC1: Code quality is high', met: true, evidence: 'Feature class' }
          ],
          confidence: 0.92,
          criticalIssues: []
        })
      );

      // Mock Alex's reviewSecurity response
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          vulnerabilities: [],
          score: 100,
          passed: true
        })
      );

      // Mock Alex's analyzeQuality response
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          complexityScore: 3,
          maintainabilityIndex: 90,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 90
        })
      );

      // Mock Alex's validateTests response
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          coverageAdequate: true,
          testQuality: {
            edgeCasesCovered: true,
            errorHandlingTested: true,
            integrationTestsPresent: false
          },
          missingTests: [],
          score: 90
        })
      );

      // Mock Alex's generateReport response
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          securityReview: {
            vulnerabilities: [],
            score: 100,
            passed: true
          },
          qualityAnalysis: {
            complexityScore: 3,
            maintainabilityIndex: 90,
            codeSmells: [],
            duplicationPercentage: 0,
            namingConventionViolations: [],
            score: 90
          },
          testValidation: {
            coverageAdequate: true,
            testQuality: {
              edgeCasesCovered: true,
              errorHandlingTested: true,
              integrationTestsPresent: false
            },
            missingTests: [],
            score: 90
          },
          architectureCompliance: {
            compliant: true,
            violations: []
          },
          overallScore: 0.9,
          confidence: 0.93,
          decision: 'pass',
          findings: [],
          recommendations: ['Consider adding integration tests']
        })
      );

      // Act
      const result = await reviewer.performDualReview(code, tests, context);

      // Assert
      expect(result.decision).toBe('pass');
      expect(result.combinedConfidence).toBeGreaterThan(0.85);
      expect(result.ameliaReview).toBeDefined();
      expect(result.alexReview).toBeDefined();
      expect(result.metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.ameliaTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.alexTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.decisionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Security Issue Detection', () => {
    it('should escalate when critical security issues are found', async () => {
      // Arrange
      const context: StoryContext = {
        story: {
          id: 'test-story',
          title: 'Test Story',
          description: 'Test',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      const code: CodeImplementation = {
        files: [
          {
            path: 'src/vulnerable.ts',
            content: `
              // Vulnerable code with SQL injection
              export function getUser(userId: string) {
                const query = "SELECT * FROM users WHERE id = '" + userId + "'";
                return db.execute(query);
              }
            `,
            operation: 'create'
          }
        ],
        commitMessage: 'Add user query',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const tests: TestSuite = {
        files: [],
        framework: 'vitest',
        testCount: 0,
        coverage: {
          lines: 50,
          functions: 50,
          branches: 50,
          statements: 50,
          uncoveredLines: []
        },
        results: {
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0
        }
      };

      // Mock Amelia's reviewCode (low confidence)
      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'agent-1',
        name: 'amelia',
        persona: {},
        llmConfig: {}
      } as any);

      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          checklist: [
            { item: 'Code follows standards', passed: false }
          ],
          codeSmells: [
            {
              type: 'other',
              location: 'vulnerable.ts:3',
              severity: 'high',
              recommendation: 'Avoid string concatenation in SQL queries'
            }
          ],
          acceptanceCriteriaCheck: [],
          confidence: 0.6,
          criticalIssues: []
        })
      );

      // Mock Alex's reviewSecurity (critical vulnerability)
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          vulnerabilities: [
            {
              type: 'SQL Injection',
              severity: 'critical',
              location: 'vulnerable.ts:3',
              description: 'SQL injection vulnerability due to string concatenation',
              remediation: 'Use parameterized queries or ORM'
            }
          ],
          score: 20,
          passed: false
        })
      );

      // Mock Alex's analyzeQuality
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          complexityScore: 2,
          maintainabilityIndex: 70,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 70
        })
      );

      // Mock Alex's validateTests (low coverage)
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          coverageAdequate: false,
          testQuality: {
            edgeCasesCovered: false,
            errorHandlingTested: false,
            integrationTestsPresent: false
          },
          missingTests: ['getUser'],
          score: 50
        })
      );

      // Mock Alex's generateReport (fail decision)
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValueOnce(
        JSON.stringify({
          securityReview: {
            vulnerabilities: [
              {
                type: 'SQL Injection',
                severity: 'critical',
                location: 'vulnerable.ts:3',
                description: 'SQL injection vulnerability',
                remediation: 'Use parameterized queries'
              }
            ],
            score: 20,
            passed: false
          },
          qualityAnalysis: {
            complexityScore: 2,
            maintainabilityIndex: 70,
            codeSmells: [],
            duplicationPercentage: 0,
            namingConventionViolations: [],
            score: 70
          },
          testValidation: {
            coverageAdequate: false,
            testQuality: {
              edgeCasesCovered: false,
              errorHandlingTested: false,
              integrationTestsPresent: false
            },
            missingTests: ['getUser'],
            score: 50
          },
          architectureCompliance: {
            compliant: true,
            violations: []
          },
          overallScore: 0.5,
          confidence: 0.7,
          decision: 'fail',
          findings: [
            {
              category: 'security',
              severity: 'critical',
              title: 'SQL Injection Vulnerability',
              description: 'SQL injection vulnerability due to string concatenation',
              location: 'vulnerable.ts:3',
              recommendation: 'Use parameterized queries or ORM'
            }
          ],
          recommendations: ['Fix critical security vulnerability', 'Add comprehensive tests']
        })
      );

      // Act
      const result = await reviewer.performDualReview(code, tests, context);

      // Assert
      expect(result.decision).toBe('escalate');
      expect(result.findings.length).toBeGreaterThan(0);
      const criticalFinding = result.findings.find(f => f.severity === 'critical');
      expect(criticalFinding).toBeDefined();
      expect(criticalFinding?.category).toBe('security');
    });
  });

  describe('Low Coverage Scenario', () => {
    it('should fail when test coverage is below 80%', async () => {
      // Arrange
      const context: StoryContext = {
        story: {
          id: 'test-story',
          title: 'Test Story',
          description: 'Test',
          acceptanceCriteria: [],
          technicalNotes: {},
          dependencies: []
        },
        prdContext: '',
        architectureContext: '',
        onboardingDocs: '',
        existingCode: [],
        totalTokens: 1000
      };

      const code: CodeImplementation = {
        files: [
          {
            path: 'src/feature.ts',
            content: 'export function test() { return true; }',
            operation: 'create'
          }
        ],
        commitMessage: 'Add feature',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const tests: TestSuite = {
        files: [],
        framework: 'vitest',
        testCount: 1,
        coverage: {
          lines: 60, // Below 80%
          functions: 60,
          branches: 60,
          statements: 60,
          uncoveredLines: ['feature.ts:5', 'feature.ts:10']
        },
        results: {
          passed: 1,
          failed: 0,
          skipped: 0,
          duration: 50
        }
      };

      // Mock responses for low coverage scenario
      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'agent-1',
        name: 'amelia',
        persona: {},
        llmConfig: {}
      } as any);

      vi.mocked(mockAgentPool.invokeAgent)
        .mockResolvedValueOnce(JSON.stringify({
          checklist: [{ item: 'Test coverage', passed: false }],
          codeSmells: [],
          acceptanceCriteriaCheck: [],
          confidence: 0.75,
          criticalIssues: []
        }))
        .mockResolvedValueOnce(JSON.stringify({
          vulnerabilities: [],
          score: 100,
          passed: true
        }))
        .mockResolvedValueOnce(JSON.stringify({
          complexityScore: 2,
          maintainabilityIndex: 80,
          codeSmells: [],
          duplicationPercentage: 0,
          namingConventionViolations: [],
          score: 80
        }))
        .mockResolvedValueOnce(JSON.stringify({
          coverageAdequate: false,
          testQuality: {
            edgeCasesCovered: false,
            errorHandlingTested: false,
            integrationTestsPresent: false
          },
          missingTests: ['multiple functions'],
          score: 60
        }))
        .mockResolvedValueOnce(JSON.stringify({
          securityReview: { vulnerabilities: [], score: 100, passed: true },
          qualityAnalysis: {
            complexityScore: 2,
            maintainabilityIndex: 80,
            codeSmells: [],
            duplicationPercentage: 0,
            namingConventionViolations: [],
            score: 80
          },
          testValidation: {
            coverageAdequate: false,
            testQuality: {
              edgeCasesCovered: false,
              errorHandlingTested: false,
              integrationTestsPresent: false
            },
            missingTests: ['multiple functions'],
            score: 60
          },
          architectureCompliance: { compliant: true, violations: [] },
          overallScore: 0.75,
          confidence: 0.8,
          decision: 'fail',
          findings: [],
          recommendations: ['Increase test coverage to >80%']
        }));

      // Act
      const result = await reviewer.performDualReview(code, tests, context);

      // Assert
      expect(result.decision).toBe('fail');
      expect(result.alexReview.testValidation.coverageAdequate).toBe(false);
    });
  });
});
