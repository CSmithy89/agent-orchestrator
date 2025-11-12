import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CISAgentRouter, CISDecisionRequest, ProjectContext } from '../../src/core/cis-agent-router.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { LLMConfig } from '../../src/types/llm.types.js';

describe('CISAgentRouter', () => {
  let router: CISAgentRouter;
  let mockLLMFactory: LLMFactory;
  let mockLLMConfig: LLMConfig;

  const testProjectContext: ProjectContext = {
    name: 'Agent Orchestrator',
    level: 3,
    techStack: ['TypeScript', 'Node.js', 'PostgreSQL'],
    domain: 'AI/ML'
  };

  beforeEach(() => {
    // Create mock LLM factory
    mockLLMConfig = {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 4096
    };

    mockLLMFactory = {
      createClient: vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Use microservices architecture',
          rationale: 'Better scalability and fault isolation',
          framework: 'Systems Thinking',
          confidence: 0.85,
          alternatives: ['Monolith', 'Microkernel']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      })
    } as any;

    router = new CISAgentRouter(mockLLMFactory, mockLLMConfig);
  });

  // ==================== Decision Type Classification Tests ====================

  describe('Decision Type Classification', () => {
    it('should classify technical decisions correctly', () => {
      const decision = 'Should we use microservices or monolithic architecture for scalability?';
      const type = router.classifyDecisionType(decision);
      expect(type).toBe('technical');
    });

    it('should classify UX decisions correctly', () => {
      const decision = 'Should we use SPA or MPA for better user experience and rendering performance?';
      const type = router.classifyDecisionType(decision);
      expect(type).toBe('ux');
    });

    it('should classify product decisions correctly', () => {
      const decision = 'Which target audience should we prioritize in our MVP scope?';
      const type = router.classifyDecisionType(decision);
      expect(type).toBe('product');
    });

    it('should classify innovation decisions correctly', () => {
      const decision = 'What disruptive opportunities exist for competitive differentiation in the market?';
      const type = router.classifyDecisionType(decision);
      expect(type).toBe('innovation');
    });

    it('should default to technical for ambiguous decisions', () => {
      const decision = 'What should we do about the database?';
      const type = router.classifyDecisionType(decision);
      expect(type).toBe('technical');
    });

    it('should handle mixed keywords by choosing highest score', () => {
      const decision = 'Should we use GraphQL API architecture for better user experience?';
      const type = router.classifyDecisionType(decision);
      // 'API', 'architecture' = technical (2), 'user', 'experience' = ux (2)
      // Should pick technical due to GraphQL being more technical
      expect(['technical', 'ux']).toContain(type);
    });
  });

  // ==================== Dr. Quinn Integration Tests ====================

  describe('Dr. Quinn Integration (Technical Decisions)', () => {
    it('should route technical decision to Dr. Quinn', async () => {
      const request: CISDecisionRequest = {
        decision: 'Should we use microservices or monolithic architecture?',
        context: 'Building a scalable AI agent orchestration platform',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'high',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.agent).toBe('dr-quinn');
      expect(response.recommendation).toBeTruthy();
      expect(response.rationale).toBeTruthy();
      expect(response.framework).toBeTruthy();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });

    it('should include alternatives in Dr. Quinn response', async () => {
      const request: CISDecisionRequest = {
        decision: 'SQL vs NoSQL database choice',
        context: 'Need ACID compliance and complex queries',
        decisionType: 'technical',
        confidence: 0.60,
        urgency: 'medium',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.alternatives).toBeDefined();
      expect(Array.isArray(response.alternatives)).toBe(true);
    });
  });

  // ==================== Maya Integration Tests ====================

  describe('Maya Integration (UX Decisions)', () => {
    it('should route UX decision to Maya', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Use SPA with server-side rendering',
          rationale: 'Best balance of performance and user experience',
          framework: 'Design Thinking',
          confidence: 0.80,
          userImpact: 'Faster initial load, seamless transitions',
          alternatives: ['Pure SPA', 'Pure MPA']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      });

      const request: CISDecisionRequest = {
        decision: 'Should we use SPA or MPA architecture?',
        context: 'User-facing application with rich interactions',
        decisionType: 'ux',
        confidence: 0.68,
        urgency: 'high',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.agent).toBe('maya');
      expect(response.recommendation).toBeTruthy();
      expect(response.userImpact).toBeTruthy();
      expect(response.framework).toContain('Design');
    });

    it('should include user impact assessment in Maya response', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Implement WebSocket for real-time updates',
          rationale: 'Users need immediate feedback',
          framework: 'User-Centered Design',
          confidence: 0.75,
          userImpact: 'Real-time collaboration without page refresh',
          alternatives: ['Polling', 'Server-Sent Events']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      });

      const request: CISDecisionRequest = {
        decision: 'How to implement real-time updates?',
        context: 'Collaborative editing application',
        decisionType: 'ux',
        confidence: 0.62,
        urgency: 'medium',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.userImpact).toBeDefined();
      expect(typeof response.userImpact).toBe('string');
      expect(response.userImpact!.length).toBeGreaterThan(0);
    });
  });

  // ==================== Sophia Integration Tests ====================

  describe('Sophia Integration (Product Decisions)', () => {
    it('should route product decision to Sophia', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Target enterprise developers first',
          rationale: 'Strongest product-market fit and narrative',
          framework: 'Storytelling',
          confidence: 0.82,
          narrativeElements: ['Hero: Enterprise Developer', 'Challenge: Complex Workflows', 'Solution: AI Orchestration'],
          alternatives: ['Individual developers', 'Startups']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      });

      const request: CISDecisionRequest = {
        decision: 'Which target audience should we prioritize?',
        context: 'AI agent orchestration platform launch',
        decisionType: 'product',
        confidence: 0.55,
        urgency: 'high',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.agent).toBe('sophia');
      expect(response.recommendation).toBeTruthy();
      expect(response.narrativeElements).toBeDefined();
      expect(Array.isArray(response.narrativeElements)).toBe(true);
    });

    it('should include narrative elements in Sophia response', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Focus MVP on workflow automation',
          rationale: 'Core narrative of productivity and efficiency',
          framework: 'Hero\'s Journey',
          confidence: 0.78,
          narrativeElements: ['Pain: Manual workflows', 'Quest: Automation', 'Victory: 10x productivity'],
          alternatives: ['Full feature set', 'AI playground']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      });

      const request: CISDecisionRequest = {
        decision: 'What features should be in MVP?',
        context: 'First product release',
        decisionType: 'product',
        confidence: 0.50,
        urgency: 'high',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.narrativeElements).toBeDefined();
      expect(response.narrativeElements!.length).toBeGreaterThan(0);
    });
  });

  // ==================== Victor Integration Tests ====================

  describe('Victor Integration (Innovation Decisions)', () => {
    it('should route innovation decision to Victor', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Adopt agent swarm architecture for differentiation',
          rationale: 'Blue Ocean opportunity in collaborative AI',
          framework: 'Blue Ocean Strategy',
          confidence: 0.88,
          disruptionPotential: 'High - unique in market, addresses unmet need',
          alternatives: ['Single agent', 'Human-in-loop only']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      });

      const request: CISDecisionRequest = {
        decision: 'How to differentiate from competitors?',
        context: 'Crowded AI orchestration market',
        decisionType: 'innovation',
        confidence: 0.45,
        urgency: 'high',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.agent).toBe('victor');
      expect(response.recommendation).toBeTruthy();
      expect(response.disruptionPotential).toBeDefined();
      expect(response.framework).toContain('Blue Ocean');
    });

    it('should include disruption potential in Victor response', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(JSON.stringify({
          recommendation: 'Implement autonomous decision-making workflows',
          rationale: 'Jobs-to-be-Done: eliminate manual decision overhead',
          framework: 'Jobs-to-be-Done',
          confidence: 0.80,
          disruptionPotential: 'Medium-High - novel approach but requires market education',
          alternatives: ['Semi-autonomous', 'Human approval required']
        })),
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307'
      });

      const request: CISDecisionRequest = {
        decision: 'Should workflows be fully autonomous?',
        context: 'Balancing automation with control',
        decisionType: 'innovation',
        confidence: 0.52,
        urgency: 'medium',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.disruptionPotential).toBeDefined();
      expect(typeof response.disruptionPotential).toBe('string');
      expect(response.disruptionPotential!.length).toBeGreaterThan(0);
    });
  });

  // ==================== Invocation Limit Tests ====================

  describe('Invocation Limit Enforcement', () => {
    it('should track invocation count', async () => {
      expect(router.getInvocationCount()).toBe(0);

      const request: CISDecisionRequest = {
        decision: 'Test decision 1',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      await router.routeDecision(request);
      expect(router.getInvocationCount()).toBe(1);

      await router.routeDecision({ ...request, decision: 'Test decision 2' });
      expect(router.getInvocationCount()).toBe(2);
    });

    it('should enforce maximum 3 invocations per workflow', async () => {
      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      // First 3 should succeed
      await router.routeDecision({ ...request, decision: 'Decision 1' });
      await router.routeDecision({ ...request, decision: 'Decision 2' });
      await router.routeDecision({ ...request, decision: 'Decision 3' });

      expect(router.getInvocationCount()).toBe(3);

      // 4th should throw error
      await expect(
        router.routeDecision({ ...request, decision: 'Decision 4' })
      ).rejects.toThrow('invocation limit exceeded');
    });

    it('should emit limit_exceeded event when limit reached', async () => {
      const limitExceededSpy = vi.fn();
      router.on('cis.limit_exceeded', limitExceededSpy);

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      // Exhaust limit
      await router.routeDecision({ ...request, decision: 'Decision 1' });
      await router.routeDecision({ ...request, decision: 'Decision 2' });
      await router.routeDecision({ ...request, decision: 'Decision 3' });

      // Try 4th
      try {
        await router.routeDecision({ ...request, decision: 'Decision 4' });
      } catch {
        // Expected to throw
      }

      expect(limitExceededSpy).toHaveBeenCalledTimes(1);
      expect(limitExceededSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          decision: 'Decision 4',
          count: 3,
          limit: 3
        })
      );
    });

    it('should reset invocation tracking', async () => {
      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      await router.routeDecision(request);
      expect(router.getInvocationCount()).toBe(1);

      router.reset();
      expect(router.getInvocationCount()).toBe(0);
      expect(router.getInvocationHistory().length).toBe(0);
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    it('should handle CIS agent unavailable gracefully', async () => {
      const errorFactory = {
        createClient: vi.fn().mockResolvedValue({
          invoke: vi.fn().mockRejectedValue(new Error('Agent unavailable')),
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307'
        })
      } as any;

      const errorRouter = new CISAgentRouter(errorFactory, mockLLMConfig);

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      await expect(errorRouter.routeDecision(request)).rejects.toThrow('Agent unavailable');
    });

    it('should emit error event on CIS invocation failure', async () => {
      const errorFactory = {
        createClient: vi.fn().mockResolvedValue({
          invoke: vi.fn().mockRejectedValue(new Error('Network error')),
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307'
        })
      } as any;

      const errorRouter = new CISAgentRouter(errorFactory, mockLLMConfig);
      const errorSpy = vi.fn();
      errorRouter.on('cis.error', errorSpy);

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      try {
        await errorRouter.routeDecision(request);
      } catch {
        // Expected to throw
      }

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: 'dr-quinn',
          decision: 'Test decision',
          error: 'Network error'
        })
      );
    });

    it('should handle timeout after 60 seconds', async () => {
      const timeoutFactory = {
        createClient: vi.fn().mockResolvedValue({
          invoke: vi.fn().mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 70000)) // 70 seconds
          ),
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307'
        })
      } as any;

      const timeoutRouter = new CISAgentRouter(timeoutFactory, mockLLMConfig, {
        timeoutMs: 100 // 100ms for testing
      });

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      await expect(timeoutRouter.routeDecision(request)).rejects.toThrow('timeout');
    });

    it('should track failed invocations in history', async () => {
      const errorFactory = {
        createClient: vi.fn().mockResolvedValue({
          invoke: vi.fn().mockRejectedValue(new Error('Test error')),
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307'
        })
      } as any;

      const errorRouter = new CISAgentRouter(errorFactory, mockLLMConfig);

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      try {
        await errorRouter.routeDecision(request);
      } catch {
        // Expected to throw
      }

      const history = errorRouter.getInvocationHistory();
      expect(history.length).toBe(1);
      expect(history[0]!.success).toBe(false);
      expect(history[0]!.error).toBe('Test error');
    });

    it('should handle malformed JSON responses gracefully', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue('Not valid JSON at all')
      });

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      // Should return response with defaults
      expect(response.recommendation).toBe('No recommendation provided');
      expect(response.rationale).toBe('No rationale provided');
    });

    it('should parse JSON from markdown code blocks', async () => {
      mockLLMFactory.createClient = vi.fn().mockResolvedValue({
        invoke: vi.fn().mockResolvedValue(`
Here's my analysis:

\`\`\`json
{
  "recommendation": "Use microservices",
  "rationale": "Better scalability",
  "framework": "Systems Thinking",
  "confidence": 0.85,
  "alternatives": ["Monolith"]
}
\`\`\`
        `)
      });

      const request: CISDecisionRequest = {
        decision: 'Architecture choice',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      const response = await router.routeDecision(request);

      expect(response.recommendation).toBe('Use microservices');
      expect(response.confidence).toBe(0.85);
    });
  });

  // ==================== Event Emission Tests ====================

  describe('Event Emission', () => {
    it('should emit success event on successful CIS invocation', async () => {
      const successSpy = vi.fn();
      router.on('cis.success', successSpy);

      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      await router.routeDecision(request);

      expect(successSpy).toHaveBeenCalledTimes(1);
      expect(successSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: 'dr-quinn',
          decision: 'Test decision',
          count: 1
        })
      );
    });
  });

  // ==================== Invocation History Tests ====================

  describe('Invocation History', () => {
    it('should track successful invocations in history', async () => {
      const request: CISDecisionRequest = {
        decision: 'Test decision',
        context: 'Test context',
        decisionType: 'technical',
        confidence: 0.65,
        urgency: 'low',
        projectContext: testProjectContext
      };

      await router.routeDecision(request);

      const history = router.getInvocationHistory();
      expect(history.length).toBe(1);
      expect(history[0]!.agent).toBe('dr-quinn');
      expect(history[0]!.decision).toBe('Test decision');
      expect(history[0]!.success).toBe(true);
      expect(history[0]!.timestamp).toBeInstanceOf(Date);
    });

    it('should track multiple invocations with different agents', async () => {
      const requests = [
        {
          decision: 'Technical decision',
          context: 'Test',
          decisionType: 'technical' as const,
          confidence: 0.65,
          urgency: 'low' as const,
          projectContext: testProjectContext
        },
        {
          decision: 'UX decision',
          context: 'Test',
          decisionType: 'ux' as const,
          confidence: 0.60,
          urgency: 'low' as const,
          projectContext: testProjectContext
        }
      ];

      for (const request of requests) {
        await router.routeDecision(request);
      }

      const history = router.getInvocationHistory();
      expect(history.length).toBe(2);
      expect(history[0]!.agent).toBe('dr-quinn');
      expect(history[1]!.agent).toBe('maya');
    });
  });
});
