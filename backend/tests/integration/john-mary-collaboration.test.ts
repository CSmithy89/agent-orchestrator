/**
 * Mary-John Collaboration Integration Tests
 *
 * Tests the collaboration workflow between Mary (Business Analyst) and John (Product Manager):
 * - Mary analyzes requirements → John validates for business viability
 * - Mary extracts scope → John prioritizes features
 * - Mary defines success criteria → John assesses market fit
 * - Full PRD workflow → John generates executive summary
 *
 * This completes the pending integration test from Story 2.3.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaryAgent } from '../../src/core/agents/mary-agent.js';
import { JohnAgent } from '../../src/core/agents/john-agent.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { LLMClient } from '../../src/llm/LLMClient.interface.js';
import { LLMConfig } from '../../src/types/llm.types.js';
import { DecisionEngine } from '../../src/core/services/decision-engine.js';
import { EscalationQueue } from '../../src/core/services/escalation-queue.js';

// Mock LLM dependencies for integration tests
vi.mock('fs/promises');
vi.mock('../../src/core/services/decision-engine.js');
vi.mock('../../src/core/services/escalation-queue.js');

describe('Mary-John Collaboration Integration Tests', () => {
  let maryAgent: MaryAgent;
  let johnAgent: JohnAgent;
  let mockLLMFactory: LLMFactory;
  let mockLLMClient: LLMClient;
  let mockDecisionEngine: DecisionEngine;
  let mockEscalationQueue: EscalationQueue;
  let llmConfig: LLMConfig;

  beforeEach(async () => {
    // Create mock LLM client with realistic responses
    mockLLMClient = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      invoke: vi.fn(),
      stream: vi.fn(),
      estimateCost: vi.fn().mockReturnValue(0.01),
      getTokenUsage: vi.fn().mockReturnValue({
        input_tokens: 200,
        output_tokens: 100,
        total_tokens: 300
      })
    };

    // Create mock LLM factory
    mockLLMFactory = {
      createClient: vi.fn().mockResolvedValue(mockLLMClient),
      registerProvider: vi.fn(),
      validateModel: vi.fn().mockReturnValue(true),
      getAvailableProviders: vi.fn().mockReturnValue(['anthropic', 'openai']),
      getSupportedModels: vi.fn().mockReturnValue(['claude-sonnet-4-5']),
      getLogger: vi.fn()
    } as unknown as LLMFactory;

    // Create mock DecisionEngine
    mockDecisionEngine = {
      attemptAutonomousDecision: vi.fn().mockResolvedValue({
        question: 'Is this viable?',
        decision: 'yes',
        confidence: 0.85,
        reasoning: 'Good alignment',
        source: 'llm',
        timestamp: new Date(),
        context: {}
      })
    } as unknown as DecisionEngine;

    // Create mock EscalationQueue
    mockEscalationQueue = {
      add: vi.fn().mockResolvedValue('esc-test-123'),
      list: vi.fn(),
      getById: vi.fn(),
      respond: vi.fn(),
      getMetrics: vi.fn()
    } as unknown as EscalationQueue;

    // Mock persona files
    const { default: fs } = await import('fs/promises');
    vi.mocked(fs.readFile).mockImplementation((path: any) => {
      if (path.includes('mary.md')) {
        return Promise.resolve(`
# Mary - Business Analyst
## System Prompt
You are Mary, an expert Business Analyst...
## Specialized Prompts
### Requirements Extraction
Extract requirements...
### Success Criteria Definition
Define success criteria...
### Scope Negotiation
Negotiate scope using 80/20 rule...
        `);
      } else if (path.includes('pm.md')) {
        return Promise.resolve(`
# John - Product Manager
## System Prompt
You are John, an expert Product Manager...
## Specialized Prompts
### Product Strategy
Analyze strategic product vision...
### Feature Prioritization
Apply RICE/MoSCoW frameworks...
### Market Fit Assessment
Assess product-market fit...
### Requirements Validation
Validate requirements for business viability and challenge scope creep...
### Executive Summary
Generate concise executive summaries...
        `);
      }
      return Promise.reject(new Error('File not found'));
    });

    llmConfig = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      temperature: 0.5,
      maxTokens: 4000
    };

    // Create both agents
    maryAgent = await MaryAgent.create(
      { ...llmConfig, temperature: 0.3 },
      mockLLMFactory,
      mockDecisionEngine,
      mockEscalationQueue
    );

    johnAgent = await JohnAgent.create(
      llmConfig,
      mockLLMFactory,
      mockDecisionEngine,
      mockEscalationQueue
    );
  });

  // ==========================================
  // Workflow 1: Mary analyzes → John validates
  // ==========================================
  describe('Requirements Analysis → Business Validation Workflow', () => {
    it('should validate Mary\'s requirements with John for business viability', async () => {
      // Step 1: Mary analyzes requirements
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        requirements: [
          'User authentication with email and password',
          'Password reset functionality',
          'Two-factor authentication (2FA)'
        ],
        successCriteria: [
          'Users can register with email/password',
          'Users can reset password via email',
          '2FA available for enhanced security'
        ],
        assumptions: ['Email service available'],
        clarifications: []
      }));

      const maryAnalysis = await maryAgent.analyzeRequirements(
        'Build a secure user authentication system'
      );

      expect(maryAnalysis.requirements).toHaveLength(3);
      expect(maryAnalysis.successCriteria).toHaveLength(3);

      // Step 2: John validates Mary's requirements
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        valid: true,
        concerns: [],
        scopeCreepIndicators: [],
        timelineIssues: [],
        recommendations: [
          'Requirements are well-scoped and achievable',
          'Consider prioritizing basic auth before 2FA'
        ]
      }));

      const johnValidation = await johnAgent.validateRequirementsViability({
        requirementsList: maryAnalysis.requirements,
        successCriteria: maryAnalysis.successCriteria
      });

      expect(johnValidation.valid).toBe(true);
      expect(johnValidation.concerns).toHaveLength(0);
      expect(johnValidation.recommendations.length).toBeGreaterThan(0);
    });

    it('should flag scope creep when John validates overly ambitious requirements from Mary', async () => {
      // Step 1: Mary extracts many requirements
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        requirements: [
          'Basic user auth',
          'OAuth integration (Google, Facebook, Twitter, GitHub)',
          'SAML support',
          'LDAP integration',
          'Biometric authentication',
          'Hardware token support',
          'Custom MFA solutions'
        ],
        successCriteria: ['All auth methods working'],
        assumptions: [],
        clarifications: []
      }));

      const maryAnalysis = await maryAgent.analyzeRequirements(
        'Build comprehensive authentication with all modern methods'
      );

      // Step 2: John identifies scope creep
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        valid: false,
        concerns: ['Too many authentication methods for MVP'],
        scopeCreepIndicators: [
          'OAuth integration: 4 providers is excessive for MVP',
          'SAML support: Enterprise feature, not MVP-critical',
          'LDAP integration: Complex integration, defer to post-MVP',
          'Biometric + Hardware tokens: Advanced features, not MVP'
        ],
        timelineIssues: [],
        recommendations: [
          'Focus on email/password auth for MVP',
          'Add one OAuth provider (Google) in MVP',
          'Defer other auth methods to growth phase'
        ]
      }));

      const johnValidation = await johnAgent.validateRequirementsViability({
        requirementsList: maryAnalysis.requirements
      });

      expect(johnValidation.valid).toBe(false);
      expect(johnValidation.scopeCreepIndicators.length).toBeGreaterThan(2);
      // At least one recommendation should mention MVP or focus
      expect(johnValidation.recommendations.some((rec: string) => /MVP|focus/i.test(rec))).toBe(true);
    });
  });

  // ==========================================
  // Workflow 2: Mary scopes → John prioritizes
  // ==========================================
  describe('Scope Negotiation → Feature Prioritization Workflow', () => {
    it('should prioritize Mary\'s scoped features with John\'s RICE framework', async () => {
      // Step 1: Mary negotiates scope (80/20 rule)
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        mvpScope: [
          'User registration',
          'Login/logout',
          'Password reset'
        ],
        growthFeatures: [
          'Social login',
          'Profile customization',
          'Account deletion'
        ],
        rationale: '80/20 rule: Core auth provides 80% of value'
      }));

      const maryScope = await maryAgent.negotiateScope(
        ['User authentication features'],
        { budget: 'Limited', timeline: '6 weeks' }
      );

      expect(maryScope.mvpScope).toHaveLength(3);
      expect(maryScope.growthFeatures).toHaveLength(3);

      // Step 2: John prioritizes with RICE
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        mvpFeatures: [
          'User registration',
          'Login/logout',
          'Password reset'
        ],
        growthFeatures: [
          'Social login',
          'Profile customization',
          'Account deletion'
        ],
        scopeCreepRisks: [],
        rationale: 'RICE scores: Registration (100), Login (95), Reset (80)'
      }));

      const features = [
        ...maryScope.mvpScope.map(name => ({ name, priority: 'must-have' })),
        ...maryScope.growthFeatures.map(name => ({ name, priority: 'nice-to-have' }))
      ];

      const johnPrioritization = await johnAgent.prioritizeFeatures(
        features,
        { budgetConstraints: 'Limited', timeframe: '6 weeks' }
      );

      // Verify alignment between Mary's scope and John's prioritization
      expect(johnPrioritization.mvpFeatures).toEqual(expect.arrayContaining(maryScope.mvpScope));
      expect(johnPrioritization.growthFeatures).toEqual(expect.arrayContaining(maryScope.growthFeatures));
    });
  });

  // ==========================================
  // Workflow 3: Shared workflow context
  // ==========================================
  describe('Shared Workflow Context (PRD Generation)', () => {
    it('should use shared context for Mary → John handoff in PRD workflow', async () => {
      // Simulate PRD workflow context
      const workflowContext = {
        workflowId: 'prd-workflow-001',
        projectName: 'User Auth System',
        step: 'requirements-validation',
        agents: {
          mary: {
            status: 'completed',
            output: null as any
          },
          john: {
            status: 'in-progress',
            output: null
          }
        }
      };

      // Step 1: Mary completes requirements analysis
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        requirements: ['REQ-001: User registration', 'REQ-002: Login functionality'],
        successCriteria: ['SC-001: Secure authentication', 'SC-002: Password encryption'],
        assumptions: ['HTTPS enabled'],
        clarifications: []
      }));

      const maryOutput = await maryAgent.analyzeRequirements(
        'User authentication system for SaaS platform'
      );

      // Store Mary's output in workflow context
      workflowContext.agents.mary.output = maryOutput;

      // Step 2: John validates using Mary's output from context
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        valid: true,
        concerns: [],
        scopeCreepIndicators: [],
        timelineIssues: [],
        recommendations: ['Good requirements from Mary']
      }));

      const johnValidation = await johnAgent.validateRequirementsViability({
        requirementsList: workflowContext.agents.mary.output.requirements,
        successCriteria: workflowContext.agents.mary.output.successCriteria
      });

      // Verify John accessed Mary's output
      expect(johnValidation.valid).toBe(true);
      expect(mockLLMClient.invoke).toHaveBeenCalledTimes(2); // Mary + John
    });

    it('should generate executive summary from Mary\'s full PRD analysis', async () => {
      // Step 1: Mary creates comprehensive PRD content
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        requirements: [
          'User registration with email verification',
          'Secure password storage with bcrypt',
          'JWT-based session management',
          'Password reset with time-limited tokens'
        ],
        successCriteria: [
          'Registration completes in <5 seconds',
          'Passwords encrypted with bcrypt (cost factor 12)',
          'JWT tokens expire after 24 hours'
        ],
        assumptions: ['Email service (SendGrid) available'],
        clarifications: []
      }));

      const maryAnalysis = await maryAgent.analyzeRequirements(
        'Secure authentication system with modern best practices'
      );

      // Step 2: John generates executive summary from Mary's analysis
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        summary: 'Authentication system provides secure user access with industry-standard encryption. System targets sub-5-second registration with automated email verification.',
        keyMetrics: [
          '99.9% authentication success rate',
          '<5 second registration time',
          'Bcrypt encryption (industry standard)'
        ],
        businessImpact: 'Secure platform access enables user trust and data protection',
        roi: 'Reduced security incidents by 80%, improved user confidence'
      }));

      const prdContent = {
        vision: 'Secure, user-friendly authentication',
        requirements: maryAnalysis.requirements,
        successCriteria: maryAnalysis.successCriteria,
        features: ['Registration', 'Login', 'Password Reset']
      };

      const executiveSummary = await johnAgent.generateExecutiveSummary(prdContent);

      expect(executiveSummary.summary).toBeDefined();
      expect(executiveSummary.keyMetrics.length).toBeGreaterThan(0);
      expect(executiveSummary.businessImpact.toLowerCase()).toContain('secure');
      expect(executiveSummary.roi).toBeDefined();
    });
  });

  // ==========================================
  // Workflow 4: Unrealistic timeline detection
  // ==========================================
  describe('Timeline Validation', () => {
    it('should flag unrealistic timelines when John validates Mary\'s requirements', async () => {
      // Step 1: Mary defines requirements
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        requirements: [
          'Complex AI-powered recommendation engine',
          'Real-time analytics dashboard',
          'Mobile apps (iOS + Android)',
          'Full admin panel with RBAC'
        ],
        successCriteria: ['All features production-ready'],
        assumptions: ['2-week timeline'],
        clarifications: []
      }));

      const maryAnalysis = await maryAgent.analyzeRequirements(
        'Build complete platform in 2 weeks'
      );

      // Step 2: John flags unrealistic timeline
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        valid: false,
        concerns: ['Timeline severely underestimated'],
        scopeCreepIndicators: ['Too many complex features'],
        timelineIssues: [
          'AI recommendation engine requires 4-6 weeks minimum',
          'Mobile apps need 6-8 weeks for both platforms',
          'Real-time analytics requires 3-4 weeks',
          'RBAC admin panel needs 2-3 weeks'
        ],
        recommendations: [
          'Extend timeline to 4-6 months',
          'Phase features across multiple sprints',
          'Start with web-only MVP (defer mobile)'
        ]
      }));

      const johnValidation = await johnAgent.validateRequirementsViability({
        requirementsList: maryAnalysis.requirements,
        assumptions: maryAnalysis.assumptions
      });

      expect(johnValidation.valid).toBe(false);
      expect(johnValidation.timelineIssues.length).toBeGreaterThan(2);
      // At least one recommendation should mention timeline, extend, or phase
      expect(johnValidation.recommendations.some((rec: string) => /timeline|extend|phase/i.test(rec))).toBe(true);
    });
  });

  // ==========================================
  // Error Handling in Collaboration
  // ==========================================
  describe('Error Handling', () => {
    it('should handle case where Mary provides incomplete requirements', async () => {
      // Mary provides minimal requirements
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        requirements: [],
        successCriteria: [],
        assumptions: [],
        clarifications: ['Requirements too vague to analyze']
      }));

      const maryAnalysis = await maryAgent.analyzeRequirements('Build something');

      // John should still be able to validate (even if result is negative)
      vi.mocked(mockLLMClient.invoke).mockResolvedValueOnce(JSON.stringify({
        valid: false,
        concerns: ['No concrete requirements provided'],
        scopeCreepIndicators: [],
        timelineIssues: [],
        recommendations: ['Gather detailed requirements before proceeding']
      }));

      const johnValidation = await johnAgent.validateRequirementsViability({
        requirementsList: maryAnalysis.requirements
      });

      expect(johnValidation.valid).toBe(false);
      expect(johnValidation.concerns.length).toBeGreaterThan(0);
    });
  });
});
