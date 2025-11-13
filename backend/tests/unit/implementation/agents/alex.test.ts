/**
 * Unit Tests for Alex Agent (Code Reviewer)
 *
 * Tests Alex's core capabilities:
 * - Security review
 * - Quality analysis
 * - Test validation
 * - Report generation
 *
 * Mocks LLM responses for deterministic testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AlexAgentInfrastructure } from '../../../../src/implementation/agents/alex.js';
import { AgentPool } from '../../../../src/core/AgentPool.js';
import { ProjectConfig } from '../../../../src/config/ProjectConfig.js';
import { LLMFactory } from '../../../../src/llm/LLMFactory.js';
import type {
  CodeImplementation,
  TestSuite,
  CoverageReport
} from '../../../../src/implementation/types.js';

describe('AlexAgentInfrastructure', () => {
  let alex: AlexAgentInfrastructure;
  let mockAgentPool: AgentPool;
  let mockProjectConfig: ProjectConfig;

  beforeEach(() => {
    // Create mock LLMFactory
    const mockLLMFactory = {
      createClient: vi.fn().mockResolvedValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        invoke: vi.fn(),
        stream: vi.fn(),
        estimateCost: vi.fn().mockReturnValue(0.01),
        getTokenUsage: vi.fn().mockReturnValue({
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150
        })
      }),
      registerProvider: vi.fn(),
      validateModel: vi.fn().mockReturnValue(true),
      getAvailableProviders: vi.fn().mockReturnValue(['anthropic']),
      getSupportedModels: vi.fn().mockReturnValue(['claude-sonnet-4-5']),
      getLogger: vi.fn()
    } as unknown as LLMFactory;

    // Create mock ProjectConfig
    mockProjectConfig = {
      getAgentConfig: vi.fn().mockReturnValue({
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        reasoning: 'Claude Sonnet for code review'
      })
    } as unknown as ProjectConfig;

    // Create AgentPool with mocks
    mockAgentPool = new AgentPool(
      mockLLMFactory,
      mockProjectConfig
    );

    // Spy on AgentPool methods
    vi.spyOn(mockAgentPool, 'createAgent');
    vi.spyOn(mockAgentPool, 'invokeAgent');
    vi.spyOn(mockAgentPool, 'destroyAgent');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create Alex agent infrastructure', async () => {
      alex = await AlexAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );

      expect(alex).toBeInstanceOf(AlexAgentInfrastructure);
    });
  });

  describe('reviewSecurity', () => {
    beforeEach(async () => {
      alex = await AlexAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should review security and return findings', async () => {
      const code: CodeImplementation = {
        files: [
          {
            path: 'backend/src/api/users.ts',
            content: 'export function getUser(id: string) { /* code */ }',
            operation: 'create'
          }
        ],
        commitMessage: 'Add user API',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const mockResponse = JSON.stringify({
        vulnerabilities: [],
        score: 95,
        passed: true
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'alex',
        persona: 'Code reviewer',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await alex.reviewSecurity(code);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(95);
      expect(result.vulnerabilities).toHaveLength(0);

      expect(mockAgentPool.createAgent).toHaveBeenCalledWith(
        'alex',
        expect.any(Object)
      );
      expect(mockAgentPool.destroyAgent).toHaveBeenCalled();
    });

    it('should identify security vulnerabilities', async () => {
      const code: CodeImplementation = {
        files: [
          {
            path: 'backend/src/api/users.ts',
            content: 'const query = "SELECT * FROM users WHERE id = " + userId;',
            operation: 'create'
          }
        ],
        commitMessage: 'Add user query',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const mockResponse = JSON.stringify({
        vulnerabilities: [
          {
            type: 'A03:2021 – Injection',
            severity: 'high',
            location: 'backend/src/api/users.ts:1',
            description: 'SQL injection vulnerability',
            remediation: 'Use parameterized queries'
          }
        ],
        score: 40,
        passed: false
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'alex',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await alex.reviewSecurity(code);

      expect(result.passed).toBe(false);
      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].severity).toBe('high');
    });
  });

  describe('analyzeQuality', () => {
    beforeEach(async () => {
      alex = await AlexAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should analyze code quality and return metrics', async () => {
      const code: CodeImplementation = {
        files: [
          {
            path: 'backend/src/test/example.ts',
            content: 'export function hello() { return "world"; }',
            operation: 'create'
          }
        ],
        commitMessage: 'Test',
        implementationNotes: '',
        acceptanceCriteriaMapping: []
      };

      const mockResponse = JSON.stringify({
        complexityScore: 5.2,
        maintainabilityIndex: 82,
        codeSmells: [],
        duplicationPercentage: 2,
        namingConventionViolations: [],
        score: 88
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'alex',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await alex.analyzeQuality(code);

      expect(result.score).toBe(88);
      expect(result.maintainabilityIndex).toBe(82);
      expect(result.complexityScore).toBe(5.2);
    });
  });

  describe('validateTests', () => {
    beforeEach(async () => {
      alex = await AlexAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should validate test coverage and quality', async () => {
      const tests: TestSuite = {
        files: [
          {
            path: 'backend/tests/unit/test/example.test.ts',
            content: '// test content'
          }
        ],
        framework: 'vitest',
        testCount: 10,
        coverage: {
          lines: 85,
          functions: 90,
          branches: 82,
          statements: 85,
          uncoveredLines: []
        },
        results: {
          passed: 10,
          failed: 0,
          skipped: 0,
          duration: 200
        }
      };

      const coverage: CoverageReport = tests.coverage;

      const mockResponse = JSON.stringify({
        coverageAdequate: true,
        testQuality: {
          edgeCasesCovered: true,
          errorHandlingTested: true,
          integrationTestsPresent: true
        },
        missingTests: [],
        score: 90
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'alex',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await alex.validateTests(tests, coverage);

      expect(result.coverageAdequate).toBe(true);
      expect(result.score).toBe(90);
      expect(result.testQuality.edgeCasesCovered).toBe(true);
    });

    it('should flag inadequate coverage', async () => {
      const tests: TestSuite = {
        files: [],
        framework: 'vitest',
        testCount: 5,
        coverage: {
          lines: 65,
          functions: 70,
          branches: 60,
          statements: 65,
          uncoveredLines: ['file.ts:42', 'file.ts:67']
        },
        results: {
          passed: 5,
          failed: 0,
          skipped: 0,
          duration: 100
        }
      };

      const mockResponse = JSON.stringify({
        coverageAdequate: false,
        testQuality: {
          edgeCasesCovered: false,
          errorHandlingTested: false,
          integrationTestsPresent: false
        },
        missingTests: ['function hello()'],
        score: 55
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'alex',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await alex.validateTests(tests, tests.coverage);

      expect(result.coverageAdequate).toBe(false);
      expect(result.score).toBe(55);
    });
  });

  describe('generateReport', () => {
    beforeEach(async () => {
      alex = await AlexAgentInfrastructure.create(
        mockAgentPool,
        mockProjectConfig
      );
    });

    it('should generate comprehensive review report with pass decision', async () => {
      const reviews = [
        {
          vulnerabilities: [],
          score: 95,
          passed: true
        },
        {
          complexityScore: 6.5,
          maintainabilityIndex: 80,
          codeSmells: [],
          duplicationPercentage: 3,
          namingConventionViolations: [],
          score: 85
        },
        {
          coverageAdequate: true,
          testQuality: {
            edgeCasesCovered: true,
            errorHandlingTested: true,
            integrationTestsPresent: true
          },
          missingTests: [],
          score: 88
        }
      ];

      const mockResponse = JSON.stringify({
        securityReview: reviews[0],
        qualityAnalysis: reviews[1],
        testValidation: reviews[2],
        architectureCompliance: {
          compliant: true,
          violations: []
        },
        overallScore: 0.89,
        confidence: 0.92,
        decision: 'pass',
        findings: [],
        recommendations: ['Consider adding more integration tests']
      });

      vi.mocked(mockAgentPool.createAgent).mockResolvedValue({
        id: 'test-agent-id',
        name: 'alex',
        persona: '',
        llmClient: {} as any,
        context: {} as any,
        startTime: new Date(),
        estimatedCost: 0
      });
      vi.mocked(mockAgentPool.invokeAgent).mockResolvedValue(mockResponse);
      vi.mocked(mockAgentPool.destroyAgent).mockResolvedValue(undefined);

      const result = await alex.generateReport(reviews);

      expect(result.decision).toBe('pass');
      expect(result.overallScore).toBe(0.89);
      expect(result.confidence).toBe(0.92);
      expect(result.architectureCompliance.compliant).toBe(true);
    });
  });
});
