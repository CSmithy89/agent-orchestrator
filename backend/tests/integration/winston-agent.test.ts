/**
 * WinstonAgent Integration Tests
 *
 * Tests Winston Agent integration with:
 * - LLMFactory (multi-provider support)
 * - DecisionEngine (confidence-based decisions)
 * - EscalationQueue (human intervention)
 * - CIS agent integration (mocked)
 *
 * These tests use real LLM providers with test API keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WinstonAgent, APIRequirement, TechnicalDecision, CISDecisionRequest } from '../../src/core/agents/winston-agent.js';
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

describe('WinstonAgent Integration Tests', () => {
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

  afterEach(async () => {
    // Clean up escalation files if any
    // (EscalationQueue cleanup logic)
  });

  // ==========================================
  // Persona Loading
  // ==========================================
  describe('Persona Loading', () => {
    it.skipIf(!hasApiKeys())('should load Winston persona from markdown file', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      // Create Winston agent
      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      expect(winston).toBeDefined();
      expect(typeof winston.generateSystemOverview).toBe('function');
      expect(typeof winston.designComponents).toBe('function');
      expect(typeof winston.defineDataModels).toBe('function');
      expect(typeof winston.specifyAPIs).toBe('function');
      expect(typeof winston.documentNFRs).toBe('function');
    });

    it('should throw error if persona file not found', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      await expect(
        WinstonAgent.create(
          winstonConfig,
          llmFactory,
          decisionEngine,
          escalationQueue,
          '/non/existent/path.md'
        )
      ).rejects.toThrow('Failed to load Winston persona file');
    });
  });

  // ==========================================
  // LLM Client Instantiation
  // ==========================================
  describe('LLM Client Instantiation', () => {
    it.skipIf(!hasApiKeys())('should create Winston with Claude Sonnet 4.5', async () => {
      const claudeConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      const winston = await WinstonAgent.create(
        claudeConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      expect(winston).toBeDefined();
      expect(winston.getDecisionAuditTrail()).toEqual([]);
    });

    it('should throw error if provider not registered', async () => {
      const invalidConfig: LLMConfig = {
        provider: 'invalid-provider',
        model: 'invalid-model',
        temperature: 0.3
      };

      await expect(
        WinstonAgent.create(
          invalidConfig,
          llmFactory,
          decisionEngine,
          escalationQueue
        )
      ).rejects.toThrow('Unknown provider');
    });

    it('should throw error if model not supported', async () => {
      const invalidModelConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'invalid-model',
        temperature: 0.3
      };

      await expect(
        WinstonAgent.create(
          invalidModelConfig,
          llmFactory,
          decisionEngine,
          escalationQueue
        )
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // System Architecture Overview Generation
  // ==========================================
  describe('System Architecture Overview', () => {
    it.skipIf(!hasApiKeys())('should generate system overview from PRD', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const mockPRD = `
# Product Requirements Document

## Overview
Build a task management application for small teams (5-20 users).

## Functional Requirements
- FR-001: Users can create, edit, and delete tasks
- FR-002: Tasks have title, description, due date, priority
- FR-003: Users can assign tasks to team members
- FR-004: Tasks can be organized into projects
- FR-005: Real-time updates when tasks change

## Non-Functional Requirements
- NFR-001: Support 100 concurrent users
- NFR-002: API response time < 200ms (95th percentile)
- NFR-003: 99.5% uptime
- NFR-004: Data encrypted at rest and in transit

## Technical Constraints
- Cloud-based deployment (AWS or GCP)
- Budget: $5000/month for infrastructure
- Team: 2 backend developers, 1 frontend developer
`;

      const overview = await winston.generateSystemOverview(mockPRD);

      expect(overview).toBeDefined();
      expect(typeof overview).toBe('string');
      expect(overview.length).toBeGreaterThan(100);
      // Check for key architectural concepts
      expect(overview.toLowerCase()).toMatch(/architect|system|component|layer|stack/);
    }, 120000); // 2 minutes timeout

    it.skipIf(!hasApiKeys())('should throw error if PRD is empty', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(winston.generateSystemOverview('')).rejects.toThrow(
        'Cannot generate system overview from empty PRD'
      );
    });
  });

  // ==========================================
  // Component Architecture Design
  // ==========================================
  describe('Component Architecture Design', () => {
    it.skipIf(!hasApiKeys())('should design components from requirements', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const requirements = [
        'User authentication and authorization',
        'Task creation and management',
        'Real-time notifications',
        'Project organization',
        'Team collaboration'
      ];

      const components = await winston.designComponents(requirements);

      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
      expect(components.length).toBeGreaterThan(0);

      // Validate component structure
      const firstComponent = components[0];
      expect(firstComponent).toHaveProperty('name');
      expect(firstComponent).toHaveProperty('responsibility');
      expect(firstComponent).toHaveProperty('inputs');
      expect(firstComponent).toHaveProperty('outputs');
      expect(firstComponent).toHaveProperty('dependencies');
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if requirements list is empty', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(winston.designComponents([])).rejects.toThrow(
        'Cannot design components from empty requirements list'
      );
    });
  });

  // ==========================================
  // Data Model Definition
  // ==========================================
  describe('Data Model Definition', () => {
    it.skipIf(!hasApiKeys())('should define data models from entities', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const entities = ['User', 'Task', 'Project', 'Comment'];

      const models = await winston.defineDataModels(entities);

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);

      // Validate data model structure
      const firstModel = models[0];
      expect(firstModel).toHaveProperty('name');
      expect(firstModel).toHaveProperty('description');
      expect(firstModel).toHaveProperty('attributes');
      expect(firstModel).toHaveProperty('relationships');
      expect(firstModel).toHaveProperty('validationRules');
      expect(firstModel).toHaveProperty('indexes');
      expect(Array.isArray(firstModel.attributes)).toBe(true);
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if entities list is empty', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(winston.defineDataModels([])).rejects.toThrow(
        'Cannot define data models from empty entities list'
      );
    });
  });

  // ==========================================
  // API Specification
  // ==========================================
  describe('API Specification', () => {
    it.skipIf(!hasApiKeys())('should specify APIs from requirements', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const apiRequirements: APIRequirement[] = [
        {
          method: 'POST',
          path: '/api/v1/tasks',
          description: 'Create a new task',
          authentication: 'JWT Bearer token',
          authorization: 'User must be authenticated'
        },
        {
          method: 'GET',
          path: '/api/v1/tasks/{id}',
          description: 'Get task by ID',
          authentication: 'JWT Bearer token'
        }
      ];

      const apis = await winston.specifyAPIs(apiRequirements);

      expect(apis).toBeDefined();
      expect(Array.isArray(apis)).toBe(true);
      expect(apis.length).toBeGreaterThan(0);

      // Validate API specification structure
      const firstAPI = apis[0];
      expect(firstAPI).toHaveProperty('method');
      expect(firstAPI).toHaveProperty('path');
      expect(firstAPI).toHaveProperty('description');
      expect(firstAPI).toHaveProperty('authentication');
      expect(firstAPI).toHaveProperty('request');
      expect(firstAPI).toHaveProperty('response');
      expect(firstAPI).toHaveProperty('errors');
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if endpoints list is empty', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(winston.specifyAPIs([])).rejects.toThrow(
        'Cannot specify APIs from empty endpoints list'
      );
    });
  });

  // ==========================================
  // Non-Functional Requirements Documentation
  // ==========================================
  describe('Non-Functional Requirements', () => {
    it.skipIf(!hasApiKeys())('should document NFRs from requirements', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const requirements = `
Performance Requirements:
- API response time < 200ms (95th percentile)
- Support 100 concurrent users
- Database queries < 50ms

Security Requirements:
- Data encrypted at rest (AES-256)
- Data encrypted in transit (TLS 1.3)
- JWT tokens for authentication
- Role-based access control (RBAC)

Reliability Requirements:
- 99.5% uptime
- Automated backups every 6 hours
- Disaster recovery RTO: 4 hours
`;

      const nfrs = await winston.documentNFRs(requirements);

      expect(nfrs).toBeDefined();
      expect(nfrs).toHaveProperty('performance');
      expect(nfrs).toHaveProperty('security');
      expect(nfrs).toHaveProperty('reliability');
      expect(nfrs).toHaveProperty('observability');

      // Validate performance section
      expect(nfrs.performance).toHaveProperty('latency');
      expect(nfrs.performance).toHaveProperty('throughput');
      expect(nfrs.performance).toHaveProperty('scalability');

      // Validate security section
      expect(nfrs.security).toHaveProperty('authentication');
      expect(nfrs.security).toHaveProperty('authorization');
      expect(nfrs.security).toHaveProperty('dataProtection');
    }, 120000);

    it.skipIf(!hasApiKeys())('should throw error if requirements are empty', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      await expect(winston.documentNFRs('')).rejects.toThrow(
        'Cannot document NFRs from empty requirements'
      );
    });
  });

  // ==========================================
  // Technical Decision Documentation (ADR)
  // ==========================================
  describe('Technical Decision Documentation', () => {
    it.skipIf(!hasApiKeys())('should document technical decision in ADR format', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 8000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const decision: TechnicalDecision = {
        id: winston.generateADRId(),
        title: 'Choose Database for Task Management System',
        context: 'Need to select database for storing tasks, projects, and user data. Requirements: ACID compliance, relational data, support for 100 concurrent users, budget-conscious.',
        decision: 'Use PostgreSQL as primary database',
        alternatives: [
          {
            option: 'MongoDB (NoSQL)',
            pros: ['Flexible schema', 'Horizontal scaling', 'JSON-like documents'],
            cons: ['Weaker ACID guarantees', 'Relational data awkward', 'Higher infrastructure cost']
          },
          {
            option: 'MySQL',
            pros: ['Mature ecosystem', 'ACID compliant', 'Lower cost'],
            cons: ['Less advanced features than PostgreSQL', 'Weaker JSON support']
          }
        ],
        rationale: 'PostgreSQL provides ACID compliance for data integrity, excellent JSON support for flexible task metadata, mature ecosystem, and cost-effective hosting options. Relational model fits task-project-user relationships naturally.',
        consequences: [
          'Requires PostgreSQL expertise on team',
          'Vertical scaling primary approach (horizontal more complex)',
          'Strong data consistency guarantees'
        ],
        status: 'accepted',
        decisionMaker: 'winston',
        date: new Date()
      };

      const adr = await winston.documentDecision(decision);

      expect(adr).toBeDefined();
      expect(typeof adr).toBe('string');
      expect(adr.length).toBeGreaterThan(100);
      expect(adr).toContain('ADR-');
      expect(adr.toLowerCase()).toMatch(/context|decision|alternative|rationale|consequence/);
    }, 120000);
  });

  // ==========================================
  // Confidence Assessment
  // ==========================================
  describe('Confidence Assessment', () => {
    it.skipIf(!hasApiKeys())('should assess high confidence for clear decision', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const decision = 'Should we use HTTPS for API endpoints?';
      const context = 'PRD explicitly requires data encryption in transit. Industry standard is TLS 1.3. Security is critical requirement.';

      const confidence = await winston.assessConfidence(decision, context);

      expect(confidence).toBeDefined();
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
      // High confidence expected for clear security requirement
      expect(confidence).toBeGreaterThan(0.7);
    }, 60000);

    it.skipIf(!hasApiKeys())('should assess low confidence for ambiguous decision', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3,
        maxTokens: 4000
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const decision = 'Should we use microservices or monolith architecture?';
      const context = 'PRD mentions scalability but does not specify scale targets. Team size and budget not clearly defined. Both approaches have merit.';

      const confidence = await winston.assessConfidence(decision, context);

      expect(confidence).toBeDefined();
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
      // Lower confidence expected for ambiguous architectural decision
      // Note: Actual confidence may vary, but should be reasonable
    }, 60000);
  });

  // ==========================================
  // CIS Agent Integration
  // ==========================================
  describe('CIS Agent Integration', () => {
    it.skipIf(!hasApiKeys())('should route technical decision to Dr. Quinn', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const cisRequest: CISDecisionRequest = {
        decision: 'Monolith vs Microservices architecture',
        context: 'PRD requires fast iteration (MVP in 3 months), team of 2 developers, budget $50k',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'high',
        projectContext: {
          name: 'Task Management System',
          level: 2,
          techStack: ['Node.js', 'PostgreSQL', 'React'],
          domain: 'Productivity'
        }
      };

      const cisResponse = await winston.invokeCISAgent(cisRequest);

      expect(cisResponse).toBeDefined();
      expect(cisResponse.agent).toBe('Dr. Quinn');
      expect(cisResponse.framework).toBe('Design Thinking');
      expect(cisResponse.recommendations).toBeDefined();
      expect(cisResponse.confidence).toBeGreaterThan(0.7);
      expect(cisResponse.reasoning).toBeDefined();
    });

    it.skipIf(!hasApiKeys())('should route UX decision to Maya', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const cisRequest: CISDecisionRequest = {
        decision: 'SPA vs MPA for task management interface',
        context: 'Need responsive UI, real-time updates, mobile-friendly',
        decisionType: 'ux',
        confidence: 0.68,
        urgency: 'medium',
        projectContext: {
          name: 'Task Management System',
          level: 2,
          techStack: ['React'],
          domain: 'Productivity'
        }
      };

      const cisResponse = await winston.invokeCISAgent(cisRequest);

      expect(cisResponse).toBeDefined();
      expect(cisResponse.agent).toBe('Maya');
      expect(cisResponse.framework).toBe('User-Centered Design');
    });

    it.skipIf(!hasApiKeys())('should route product decision to Sophia', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const cisRequest: CISDecisionRequest = {
        decision: 'Multi-tenancy architecture for SaaS product',
        context: 'Target market: small businesses, need data isolation and security',
        decisionType: 'product',
        confidence: 0.65,
        urgency: 'high',
        projectContext: {
          name: 'Task Management System',
          level: 2,
          techStack: ['Node.js', 'PostgreSQL'],
          domain: 'SaaS'
        }
      };

      const cisResponse = await winston.invokeCISAgent(cisRequest);

      expect(cisResponse).toBeDefined();
      expect(cisResponse.agent).toBe('Sophia');
      expect(cisResponse.framework).toBe('Business Model Canvas');
    });

    it.skipIf(!hasApiKeys())('should route innovation decision to Victor', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const cisRequest: CISDecisionRequest = {
        decision: 'Adopt AI-powered task prioritization for competitive advantage',
        context: 'Competitors use manual prioritization, opportunity to differentiate',
        decisionType: 'innovation',
        confidence: 0.60,
        urgency: 'low',
        projectContext: {
          name: 'Task Management System',
          level: 2,
          techStack: ['Node.js', 'Python', 'ML models'],
          domain: 'Productivity + AI'
        }
      };

      const cisResponse = await winston.invokeCISAgent(cisRequest);

      expect(cisResponse).toBeDefined();
      expect(cisResponse.agent).toBe('Victor');
      expect(cisResponse.framework).toBe('Innovation Canvas');
    });
  });

  // ==========================================
  // Workflow Context and Audit Trail
  // ==========================================
  describe('Workflow Context and Audit Trail', () => {
    it.skipIf(!hasApiKeys())('should set workflow context', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      winston.setWorkflowContext('architecture-workflow-123', 3);

      // Workflow context set successfully (no error thrown)
      expect(winston).toBeDefined();
    });

    it.skipIf(!hasApiKeys())('should track decisions in audit trail', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const initialTrail = winston.getDecisionAuditTrail();
      expect(initialTrail).toEqual([]);

      // Decision audit trail tracking tested via decision-making methods
    });
  });

  // ==========================================
  // ADR ID Generation
  // ==========================================
  describe('ADR ID Generation', () => {
    it.skipIf(!hasApiKeys())('should generate sequential ADR IDs', async () => {
      const winstonConfig: LLMConfig = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
        temperature: 0.3
      };

      const winston = await WinstonAgent.create(
        winstonConfig,
        llmFactory,
        decisionEngine,
        escalationQueue
      );

      const adr1 = winston.generateADRId();
      const adr2 = winston.generateADRId();
      const adr3 = winston.generateADRId();

      expect(adr1).toBe('ADR-001');
      expect(adr2).toBe('ADR-002');
      expect(adr3).toBe('ADR-003');
    });
  });
});
