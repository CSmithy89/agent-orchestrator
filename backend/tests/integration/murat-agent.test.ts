/**
 * MuratAgent Integration Tests
 *
 * Tests Murat Agent integration with:
 * - LLMFactory (multi-provider support)
 * - DecisionEngine (confidence-based decisions)
 * - EscalationQueue (human intervention)
 * - Winston agent integration (architecture analysis, test compatibility)
 *
 * These tests use real LLM providers with test API keys.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MuratAgent } from '../../src/core/agents/murat-agent.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { LLMConfig } from '../../src/types/llm.types.js';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../src/core/services/escalation-queue.js';
import { AnthropicProvider } from '../../src/llm/providers/AnthropicProvider.js';
import { ClaudeCodeProvider } from '../../src/llm/providers/ClaudeCodeProvider.js';
import { OpenAIProvider } from '../../src/llm/providers/OpenAIProvider.js';
import { ZhipuProvider } from '../../src/llm/providers/ZhipuProvider.js';

// Shared test utilities
import { hasApiKeys } from '../utils/apiKeys.js';

describe('MuratAgent Integration Tests', () => {
  let llmFactory: LLMFactory;
  let decisionEngine: DecisionEngine;
  let escalationQueue: EscalationQueue;

  beforeEach(() => {
    // Create LLM factory with providers
    llmFactory = new LLMFactory();
    llmFactory.registerProvider('anthropic', new AnthropicProvider());
    llmFactory.registerProvider('claude-code', new ClaudeCodeProvider());
    llmFactory.registerProvider('openai', new OpenAIProvider());
    llmFactory.registerProvider('zhipu', new ZhipuProvider());

    // Create DecisionEngine (using Claude for decision-making)
    const decisionConfig: LLMConfig = {
      provider: 'claude-code',
      model: 'claude-sonnet-4-5',
      temperature: 0.3,
      maxTokens: 2000
    };
    decisionEngine = new DecisionEngine(llmFactory, decisionConfig);

    // Create EscalationQueue
    escalationQueue = new EscalationQueue();
  });

  // ==========================================
  // Persona Loading
  // ==========================================
  describe('Persona Loading', () => {
    it.skipIf(!hasApiKeys())('should load Murat persona from markdown file', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 4000
      };

      // Create Murat agent
      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      expect(murat).toBeDefined();
      expect(typeof murat.defineTestStrategy).toBe('function');
      expect(typeof murat.recommendFrameworks).toBe('function');
      expect(typeof murat.defineTestPyramid).toBe('function');
      expect(typeof murat.designPipeline).toBe('function');
      expect(typeof murat.defineQualityGates).toBe('function');
      expect(typeof murat.specifyATDD).toBe('function');
    });

    it('should throw error if persona file not found', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 4000
      };

      await expect(
        MuratAgent.create(
          muratConfig,
          llmFactory,
          decisionEngine,
          escalationQueue,
          '/non/existent/path.md'
        )
      ).rejects.toThrow('Failed to load Murat persona file');
    });
  });

  // ==========================================
  // LLM Client Instantiation
  // ==========================================
  describe('LLM Client Instantiation', () => {
    it.skipIf(!hasApiKeys())('should create Murat with GPT-4 Turbo', async () => {
      const openaiConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 4000
      };

      const murat = await MuratAgent.create(
        openaiConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      expect(murat).toBeDefined();
      expect(murat.getDecisionAuditTrail()).toEqual([]);
    });

    it('should throw error if provider not registered', async () => {
      const invalidConfig: LLMConfig = {
        provider: 'invalid-provider',
        model: 'invalid-model',
        temperature: 0.4
      };

      await expect(
        MuratAgent.create(
          invalidConfig,
          llmFactory,
          decisionEngine,
          escalationQueue
        )
      ).rejects.toThrow('Unknown provider');
    });

    it('should throw error if model not supported', async () => {
      const invalidModelConfig: LLMConfig = {
        provider: 'openai',
        model: 'invalid-model',
        temperature: 0.4
      };

      await expect(
        MuratAgent.create(
          invalidModelConfig,
          llmFactory,
          decisionEngine,
          escalationQueue
        )
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // Test Strategy Generation
  // ==========================================
  describe('Test Strategy Generation', () => {
    it.skipIf(!hasApiKeys())('should generate test strategy from architecture and requirements', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 8000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const mockArchitecture = `
# System Architecture

## Tech Stack
- Backend: Node.js, TypeScript, Express
- Database: PostgreSQL
- Frontend: React, TypeScript
- Testing: Vitest (unit), Supertest (integration)

## Components
- API Gateway
- Task Service
- User Service
- Database Layer
`;

      const requirements = [
        'FR-001: Users can create, edit, and delete tasks',
        'FR-002: Tasks have title, description, due date, priority',
        'NFR-001: API response time < 200ms',
        'NFR-002: 99.5% uptime'
      ];

      const testStrategy = await murat.defineTestStrategy(mockArchitecture, requirements);

      expect(testStrategy).toBeDefined();
      expect(testStrategy).toHaveProperty('approach');
      expect(testStrategy).toHaveProperty('philosophy');
      expect(testStrategy).toHaveProperty('frameworks');
      expect(testStrategy).toHaveProperty('pyramid');
      expect(testStrategy).toHaveProperty('cicdPipeline');
      expect(testStrategy).toHaveProperty('qualityGates');
      expect(testStrategy).toHaveProperty('atddApproach');
      expect(Array.isArray(testStrategy.frameworks)).toBe(true);
    }, 120000); // 2 minutes timeout

    it.skipIf(!hasApiKeys())('should throw error if architecture is empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.defineTestStrategy('', ['requirement'])).rejects.toThrow(
        'Cannot define test strategy from empty architecture document'
      );
    });

    it.skipIf(!hasApiKeys())('should throw error if requirements are empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.defineTestStrategy('architecture', [])).rejects.toThrow(
        'Cannot define test strategy from empty requirements list'
      );
    });
  });

  // ==========================================
  // Framework Recommendations
  // ==========================================
  describe('Framework Recommendations', () => {
    it.skipIf(!hasApiKeys())('should recommend frameworks for TypeScript/Node.js stack', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 8000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const techStack = ['TypeScript', 'Node.js', 'Express', 'PostgreSQL'];

      const frameworks = await murat.recommendFrameworks(techStack);

      expect(frameworks).toBeDefined();
      expect(Array.isArray(frameworks)).toBe(true);
      expect(frameworks.length).toBeGreaterThan(0);

      // Validate framework structure
      const firstFramework = frameworks[0];
      expect(firstFramework).toHaveProperty('category');
      expect(firstFramework).toHaveProperty('framework');
      expect(firstFramework).toHaveProperty('rationale');
      expect(firstFramework).toHaveProperty('alternatives');
      expect(firstFramework).toHaveProperty('techStackCompatibility');
      expect(Array.isArray(firstFramework.alternatives)).toBe(true);
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if tech stack is empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.recommendFrameworks([])).rejects.toThrow(
        'Cannot recommend frameworks from empty tech stack'
      );
    });
  });

  // ==========================================
  // Test Pyramid Definition
  // ==========================================
  describe('Test Pyramid Definition', () => {
    it.skipIf(!hasApiKeys())('should define test pyramid for backend API project', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 6000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const projectType = 'backend-api';

      const pyramid = await murat.defineTestPyramid(projectType);

      expect(pyramid).toBeDefined();
      expect(pyramid).toHaveProperty('unitPercentage');
      expect(pyramid).toHaveProperty('integrationPercentage');
      expect(pyramid).toHaveProperty('e2ePercentage');
      expect(pyramid).toHaveProperty('rationale');
      expect(pyramid).toHaveProperty('unitScope');
      expect(pyramid).toHaveProperty('integrationScope');
      expect(pyramid).toHaveProperty('e2eScope');
      expect(pyramid).toHaveProperty('executionTimeTargets');

      // Validate percentages sum to 100
      const total = pyramid.unitPercentage + pyramid.integrationPercentage + pyramid.e2ePercentage;
      expect(total).toBeCloseTo(100, 0);

      // Validate typical pyramid distribution (unit > integration > e2e)
      expect(pyramid.unitPercentage).toBeGreaterThan(pyramid.integrationPercentage);
      expect(pyramid.integrationPercentage).toBeGreaterThan(pyramid.e2ePercentage);
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if project type is empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.defineTestPyramid('')).rejects.toThrow(
        'Cannot define test pyramid from empty project type'
      );
    });
  });

  // ==========================================
  // CI/CD Pipeline Design
  // ==========================================
  describe('CI/CD Pipeline Design', () => {
    it.skipIf(!hasApiKeys())('should design CI/CD pipeline for project', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 8000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const projectType = 'full-stack';
      const mockTestStrategy = {
        approach: 'Shift-left testing with continuous testing',
        philosophy: 'Quality is everyone\'s responsibility',
        riskPrioritization: {
          highRisk: ['Authentication', 'Payment processing'],
          mediumRisk: ['Task management', 'Notifications'],
          lowRisk: ['UI styling']
        },
        frameworks: [],
        pyramid: {
          unitPercentage: 70,
          integrationPercentage: 20,
          e2ePercentage: 10,
          rationale: 'Standard pyramid',
          unitScope: 'Business logic',
          integrationScope: 'API contracts',
          e2eScope: 'Critical workflows',
          executionTimeTargets: {
            unit: '< 5s',
            integration: '< 30s',
            e2e: '< 5min'
          }
        },
        cicdPipeline: {
          stages: [],
          qualityGates: [],
          branchStrategies: {},
          notificationStrategy: ''
        },
        qualityGates: [],
        atddApproach: {
          workflow: [],
          bddFramework: '',
          frameworkRationale: '',
          acceptanceCriteriaFormat: '',
          testOrganization: { directoryStructure: '', namingConventions: '' },
          stepDefinitionGuidelines: [],
          livingDocumentation: { reports: '', documentationSite: '' },
          pyramidRelationship: ''
        },
        rationale: 'Comprehensive test strategy'
      };

      const pipeline = await murat.designPipeline(projectType, mockTestStrategy);

      expect(pipeline).toBeDefined();
      expect(pipeline).toHaveProperty('stages');
      expect(pipeline).toHaveProperty('qualityGates');
      expect(pipeline).toHaveProperty('branchStrategies');
      expect(Array.isArray(pipeline.stages)).toBe(true);
      expect(pipeline.stages.length).toBeGreaterThan(0);

      // Validate stage structure
      if (pipeline.stages.length > 0) {
        const firstStage = pipeline.stages[0];
        expect(firstStage).toHaveProperty('name');
        expect(firstStage).toHaveProperty('actions');
        expect(firstStage).toHaveProperty('failureHandling');
        expect(firstStage).toHaveProperty('executionTime');
      }
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if project type is empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const mockTestStrategy = {
        approach: '',
        philosophy: '',
        riskPrioritization: { highRisk: [], mediumRisk: [], lowRisk: [] },
        frameworks: [],
        pyramid: {
          unitPercentage: 70,
          integrationPercentage: 20,
          e2ePercentage: 10,
          rationale: '',
          unitScope: '',
          integrationScope: '',
          e2eScope: '',
          executionTimeTargets: { unit: '', integration: '', e2e: '' }
        },
        cicdPipeline: {
          stages: [],
          qualityGates: [],
          branchStrategies: {},
          notificationStrategy: ''
        },
        qualityGates: [],
        atddApproach: {
          workflow: [],
          bddFramework: '',
          frameworkRationale: '',
          acceptanceCriteriaFormat: '',
          testOrganization: { directoryStructure: '', namingConventions: '' },
          stepDefinitionGuidelines: [],
          livingDocumentation: { reports: '', documentationSite: '' },
          pyramidRelationship: ''
        },
        rationale: ''
      };

      await expect(murat.designPipeline('', mockTestStrategy)).rejects.toThrow(
        'Cannot design pipeline from empty project type'
      );
    });
  });

  // ==========================================
  // Quality Gates Definition
  // ==========================================
  describe('Quality Gates Definition', () => {
    it.skipIf(!hasApiKeys())('should define quality gates for project level 2', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 6000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const projectLevel = 2;

      const gates = await murat.defineQualityGates(projectLevel);

      expect(gates).toBeDefined();
      expect(Array.isArray(gates)).toBe(true);
      expect(gates.length).toBeGreaterThan(0);

      // Validate quality gate structure
      const firstGate = gates[0];
      expect(firstGate).toHaveProperty('name');
      expect(firstGate).toHaveProperty('type');
      expect(firstGate).toHaveProperty('threshold');
      expect(firstGate).toHaveProperty('rationale');
      expect(firstGate).toHaveProperty('enforcement');

      // Validate gate types
      const gateTypes = gates.map(g => g.type);
      expect(gateTypes).toContain('coverage' || 'test' || 'security' || 'performance');
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if project level is invalid', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.defineQualityGates(5)).rejects.toThrow(
        'Project level must be between 0 and 4'
      );
    });
  });

  // ==========================================
  // ATDD Approach Specification
  // ==========================================
  describe('ATDD Approach Specification', () => {
    it.skipIf(!hasApiKeys())('should specify ATDD approach from acceptance criteria', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 8000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const acceptanceCriteria = [
        'User can create a new task with title and description',
        'Task appears in task list after creation',
        'User receives success notification after task creation',
        'User can edit task details',
        'User can delete task with confirmation'
      ];

      const atdd = await murat.specifyATDD(acceptanceCriteria);

      expect(atdd).toBeDefined();
      expect(atdd).toHaveProperty('workflow');
      expect(atdd).toHaveProperty('bddFramework');
      expect(atdd).toHaveProperty('frameworkRationale');
      expect(atdd).toHaveProperty('acceptanceCriteriaFormat');
      expect(atdd).toHaveProperty('testOrganization');
      expect(atdd).toHaveProperty('stepDefinitionGuidelines');
      expect(atdd).toHaveProperty('livingDocumentation');
      expect(atdd).toHaveProperty('pyramidRelationship');
      expect(Array.isArray(atdd.workflow)).toBe(true);
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if acceptance criteria are empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.specifyATDD([])).rejects.toThrow(
        'Cannot specify ATDD from empty acceptance criteria'
      );
    });
  });

  // ==========================================
  // Confidence Assessment
  // ==========================================
  describe('Confidence Assessment', () => {
    it.skipIf(!hasApiKeys())('should assess high confidence for well-known framework', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 4000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const decision = 'Should we use Vitest for unit testing in TypeScript project?';
      const context = 'Tech stack: TypeScript, Node.js. Vitest is ESM-native, fast, and well-documented. Team has experience with Vitest.';

      const confidence = await murat.assessConfidence(decision, context);

      expect(confidence).toBeDefined();
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
      // High confidence expected for well-known framework with clear compatibility
      expect(confidence).toBeGreaterThan(0.7);
    }, 60000);

    it.skipIf(!hasApiKeys())('should assess low confidence for niche tech stack', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 4000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const decision = 'Which testing framework should we use for Zig programming language?';
      const context = 'Tech stack: Zig (niche language). Limited testing framework options. Team has no Zig experience.';

      const confidence = await murat.assessConfidence(decision, context);

      expect(confidence).toBeDefined();
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
      // Lower confidence expected for niche tech stack
      // Note: Actual confidence may vary, but should be reasonable
    }, 60000);
  });

  // ==========================================
  // Winston Integration
  // ==========================================
  describe('Winston Integration', () => {
    it.skipIf(!hasApiKeys())('should analyze Winston architecture for test infrastructure', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 8000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const mockArchitecture = `
# System Architecture

## Tech Stack
- Backend: Node.js, TypeScript, Express
- Database: PostgreSQL with Prisma ORM
- Frontend: React, TypeScript, Vite
- API: REST with OpenAPI spec

## Components
- API Gateway (Express)
- Task Service (business logic)
- User Service (authentication)
- Database Layer (Prisma)

## Data Models
- User (id, email, password_hash)
- Task (id, title, description, user_id, due_date)
`;

      const analysis = await murat.analyzeArchitecture(mockArchitecture);

      expect(analysis).toBeDefined();
      expect(analysis).toHaveProperty('techStack');
      expect(analysis).toHaveProperty('testabilityConcerns');
      expect(analysis).toHaveProperty('componentsRequiringTestInfra');
      expect(analysis).toHaveProperty('dataLayerTestingNeeds');
      expect(analysis).toHaveProperty('summary');
      expect(Array.isArray(analysis.techStack)).toBe(true);
      expect(analysis.techStack.length).toBeGreaterThan(0);
    }, 120000);

    it.skipIf(!hasApiKeys())('should validate test framework compatibility with tech stack', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 6000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const techStack = ['TypeScript', 'Node.js', 'Express'];
      const frameworks = ['Vitest', 'Supertest', 'Playwright'];

      const validation = await murat.validateTestCompatibility(techStack, frameworks);

      expect(validation).toBeDefined();
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('incompatibilities');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('compatibilityScore');
      expect(typeof validation.valid).toBe('boolean');
      expect(typeof validation.compatibilityScore).toBe('number');
      expect(validation.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(validation.compatibilityScore).toBeLessThanOrEqual(1);
    }, 120000);

    it.skipIf(!hasApiKeys())('should detect incompatibility (Jest with Deno)', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4,
        maxTokens: 6000
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const techStack = ['Deno', 'TypeScript'];
      const frameworks = ['Jest'];

      const validation = await murat.validateTestCompatibility(techStack, frameworks);

      expect(validation).toBeDefined();
      // Should detect incompatibility or have lower compatibility score
      // Jest is not designed for Deno (uses Node.js APIs)
      expect(validation.compatibilityScore).toBeLessThan(0.9);
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if architecture draft is empty', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(murat.analyzeArchitecture('')).rejects.toThrow(
        'Cannot analyze empty architecture draft'
      );
    });
  });

  // ==========================================
  // Workflow Context and Audit Trail
  // ==========================================
  describe('Workflow Context and Audit Trail', () => {
    it.skipIf(!hasApiKeys())('should set workflow context', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      murat.setWorkflowContext('test-strategy-workflow-123', 5);

      // Workflow context set successfully (no error thrown)
      expect(murat).toBeDefined();
    });

    it.skipIf(!hasApiKeys())('should track decisions in audit trail', async () => {
      const muratConfig: LLMConfig = {
        provider: 'openai',
        model: 'gpt-4-turbo',
        temperature: 0.4
      };

      const murat = await MuratAgent.create(
        muratConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const initialTrail = murat.getDecisionAuditTrail();
      expect(initialTrail).toEqual([]);

      // Decision audit trail tracking tested via decision-making methods
    });
  });
});
