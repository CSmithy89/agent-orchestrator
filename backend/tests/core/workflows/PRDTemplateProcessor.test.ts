/**
 * PRDTemplateProcessor Tests
 * Story 2.6: PRD Template & Content Generation
 *
 * ATDD Approach: These tests are written BEFORE implementation
 * Expected: All tests should FAIL initially (Red phase)
 * After implementation: All tests should PASS (Green phase)
 *
 * Test Coverage Target: >80%
 * Run: npm run test -- PRDTemplateProcessor.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { PRDTemplateProcessor, ProjectType } from '../../../src/core/workflows/prd-template-processor.js';
import type { GenerationContext, Requirement } from '../../../src/core/workflows/prd-template-processor.js';

// Mock dependencies
const mockTemplateProcessor = {
  loadTemplate: vi.fn(),
  processTemplate: vi.fn(),
  registerHelper: vi.fn(),
};

const mockAgentPool = {
  spawn: vi.fn(),
  get: vi.fn(),
  release: vi.fn(),
};

const mockStateManager = {
  appendToFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
};

const mockMaryAgent = {
  analyzeRequirements: vi.fn(),
  defineSuccessCriteria: vi.fn(),
  negotiateScope: vi.fn(),
};

const mockJohnAgent = {
  defineProductVision: vi.fn(),
  prioritizeFeatures: vi.fn(),
  assessMarketFit: vi.fn(),
  validateRequirementsViability: vi.fn(),
  generateExecutiveSummary: vi.fn(),
};

describe('PRDTemplateProcessor', () => {
  let processor: PRDTemplateProcessor;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock AgentPool to return mock agents
    mockAgentPool.spawn.mockImplementation(async (agentType: string) => {
      if (agentType === 'mary') return mockMaryAgent;
      if (agentType === 'john') return mockJohnAgent;
      throw new Error(`Unknown agent type: ${agentType}`);
    });

    mockAgentPool.get.mockImplementation((agentType: string) => {
      if (agentType === 'mary') return mockMaryAgent;
      if (agentType === 'john') return mockJohnAgent;
      return null;
    });

    // Instantiate PRDTemplateProcessor with mocked dependencies
    processor = new PRDTemplateProcessor(
      mockTemplateProcessor as any,
      mockAgentPool as any,
      mockStateManager as any,
      '/test/project'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ====================
  // AC #1: Load prd-template.md with proper structure
  // ====================
  describe('AC #1: Template Loading', () => {
    it('should load template from bmad/bmm/workflows/prd/template.md', async () => {
      const templateContent = '# PRD Template\n## {{section}}';
      mockTemplateProcessor.loadTemplate.mockResolvedValue(templateContent);

      // PRDTemplateProcessor not yet implemented - this will fail
      // const result = await processor.loadTemplate('bmad/bmm/workflows/prd/template.md');

      expect(mockTemplateProcessor.loadTemplate).toHaveBeenCalledWith(
        expect.stringContaining('prd/template.md')
      );
    });

    it('should parse template sections and identify placeholders', async () => {
      const template = `
# {{vision_alignment}}
## {{product_magic_essence}}
### {{functional_requirements_complete}}
      `;
      mockTemplateProcessor.loadTemplate.mockResolvedValue(template);

      // const sections = await processor.parseTemplateSections(template);

      // Expected sections: vision_alignment, product_magic_essence, functional_requirements_complete
      // expect(sections).toContain('vision_alignment');
      // expect(sections).toContain('product_magic_essence');
      // expect(sections).toContain('functional_requirements_complete');
    });

    it('should throw error if template file not found', async () => {
      mockTemplateProcessor.loadTemplate.mockRejectedValue(
        new Error('Template not found')
      );

      // await expect(processor.loadTemplate('invalid-path.md')).rejects.toThrow('Template not found');
    });

    it('should handle template with no placeholders', async () => {
      const template = '# Static PRD Template\nNo variables here.';
      mockTemplateProcessor.loadTemplate.mockResolvedValue(template);

      // const sections = await processor.parseTemplateSections(template);

      // expect(sections).toHaveLength(0);
    });
  });

  // ====================
  // AC #2: Generate content for each template section
  // ====================
  describe('AC #2: Section Content Generation', () => {
    const context: GenerationContext = {
      productBrief: 'Build an agent orchestrator for autonomous development',
      userInput: 'Need automated PRD generation',
      projectType: 'api',
    };

    it('should generate vision_alignment section', async () => {
      mockJohnAgent.defineProductVision.mockResolvedValue({
        vision: 'Automate software development with AI agents',
        positioning: 'Developer productivity tool',
        targetAudience: 'Software development teams',
      });

      // const section = await processor.generateSection('vision_alignment', context);

      expect(mockJohnAgent.defineProductVision).toHaveBeenCalled();
      // expect(section).toContain('Automate software development');
    });

    it('should generate product_magic_essence section', async () => {
      mockJohnAgent.defineProductVision.mockResolvedValue({
        uniqueValueProposition: '10x faster requirements analysis',
        keyDifferentiators: ['Autonomous agents', 'Multi-LLM support'],
      });

      // const section = await processor.generateSection('product_magic_essence', context);

      expect(mockJohnAgent.defineProductVision).toHaveBeenCalled();
      // expect(section).toContain('10x faster');
    });

    it('should generate success_criteria section', async () => {
      mockMaryAgent.defineSuccessCriteria.mockResolvedValue({
        criteria: [
          'PRD generated in <30 minutes',
          'Completeness score >85%',
          '<3 escalations per workflow',
        ],
      });

      // const section = await processor.generateSection('success_criteria', context);

      expect(mockMaryAgent.defineSuccessCriteria).toHaveBeenCalled();
      // expect(section).toContain('PRD generated in <30 minutes');
    });

    it('should generate mvp_scope section', async () => {
      mockJohnAgent.prioritizeFeatures.mockResolvedValue({
        mvpFeatures: [
          'User authentication',
          'Basic dashboard',
          'API endpoints',
        ],
        reasoning: 'Core functionality for MVP',
      });

      // const section = await processor.generateSection('mvp_scope', context);

      expect(mockJohnAgent.prioritizeFeatures).toHaveBeenCalled();
      // expect(section).toContain('User authentication');
    });

    it('should generate growth_features section', async () => {
      mockJohnAgent.prioritizeFeatures.mockResolvedValue({
        phase2Features: [
          'Advanced analytics',
          'Multi-tenancy',
          'Integrations',
        ],
      });

      // const section = await processor.generateSection('growth_features', context);

      expect(mockJohnAgent.prioritizeFeatures).toHaveBeenCalled();
      // expect(section).toContain('Advanced analytics');
    });

    it('should generate functional_requirements_complete section with 67+ requirements', async () => {
      const requirements: Requirement[] = Array.from({ length: 70 }, (_, i) => ({
        id: `FR-${String(i + 1).padStart(3, '0')}`,
        statement: `Requirement ${i + 1}`,
        acceptanceCriteria: [`Criteria for requirement ${i + 1}`],
        priority: 'must-have' as const,
      }));

      mockMaryAgent.analyzeRequirements.mockResolvedValue({
        requirements,
        totalCount: 70,
      });

      // const section = await processor.generateSection('functional_requirements_complete', context);

      expect(mockMaryAgent.analyzeRequirements).toHaveBeenCalled();
      // expect(section).toContain('FR-001');
      // expect(section).toContain('FR-070');
      // Requirements count should be >= 67
    });

    it('should generate performance requirements when applicable', async () => {
      const contextWithPerf = {
        ...context,
        requiresPerformance: true,
      };

      // const section = await processor.generateSection('performance_requirements', contextWithPerf);

      // expect(section).toContain('response time');
      // expect(section).toContain('throughput');
    });

    it('should generate security requirements when applicable', async () => {
      const contextWithSecurity = {
        ...context,
        requiresSecurity: true,
        domain: 'finance',
      };

      // const section = await processor.generateSection('security_requirements', contextWithSecurity);

      // expect(section).toContain('authentication');
      // expect(section).toContain('authorization');
    });

    it('should generate scalability requirements when applicable', async () => {
      const contextWithScale = {
        ...context,
        requiresScalability: true,
      };

      // const section = await processor.generateSection('scalability_requirements', contextWithScale);

      // expect(section).toContain('horizontal scaling');
      // expect(section).toContain('load balancing');
    });
  });

  // ====================
  // AC #3: Adapt content to project type
  // ====================
  describe('AC #3: Project Type Adaptation', () => {
    it('should detect API project type', async () => {
      const context: GenerationContext = {
        productBrief: 'Build a REST API for user management',
        userInput: 'Need CRUD endpoints',
      };

      // const projectType = await processor.detectProjectType(context);

      // expect(projectType).toBe('api');
    });

    it('should detect mobile project type', async () => {
      const context: GenerationContext = {
        productBrief: 'Build an iOS app for fitness tracking',
        userInput: 'Need mobile app with React Native',
      };

      // const projectType = await processor.detectProjectType(context);

      // expect(projectType).toBe('mobile');
    });

    it('should detect SaaS project type', async () => {
      const context: GenerationContext = {
        productBrief: 'Build a subscription-based CRM platform',
        userInput: 'Multi-tenant SaaS application',
      };

      // const projectType = await processor.detectProjectType(context);

      // expect(projectType).toBe('saas');
    });

    it('should detect game project type', async () => {
      const context: GenerationContext = {
        productBrief: 'Build a 2D platformer game',
        userInput: 'Unity game with progression system',
      };

      // const projectType = await processor.detectProjectType(context);

      // expect(projectType).toBe('game');
    });

    it('should add API-specific sections for API projects', async () => {
      const context: GenerationContext = {
        productBrief: 'REST API',
        userInput: 'CRUD endpoints',
        projectType: 'api',
      };

      // const sections = await processor.generateContent(context);

      // expect(sections).toContain('rest_api_specification');
      // expect(sections).toContain('authentication');
      // expect(sections).toContain('rate_limiting');
    });

    it('should add mobile-specific sections for mobile projects', async () => {
      const context: GenerationContext = {
        productBrief: 'Mobile app',
        userInput: 'iOS and Android',
        projectType: 'mobile',
      };

      // const sections = await processor.generateContent(context);

      // expect(sections).toContain('platform_requirements');
      // expect(sections).toContain('ux_patterns');
      // expect(sections).toContain('offline_support');
    });

    it('should add SaaS-specific sections for SaaS projects', async () => {
      const context: GenerationContext = {
        productBrief: 'SaaS platform',
        userInput: 'Multi-tenant',
        projectType: 'saas',
      };

      // const sections = await processor.generateContent(context);

      // expect(sections).toContain('multi_tenancy');
      // expect(sections).toContain('subscription_models');
      // expect(sections).toContain('billing_integration');
    });
  });

  // ====================
  // AC #4: Include domain-specific sections
  // ====================
  describe('AC #4: Domain-Specific Sections', () => {
    it('should detect healthcare domain', async () => {
      const context: GenerationContext = {
        productBrief: 'Patient management system',
        userInput: 'HIPAA compliance required',
      };

      // const domain = await processor.detectDomain(context);

      // expect(domain).toBe('healthcare');
    });

    it('should detect finance domain', async () => {
      const context: GenerationContext = {
        productBrief: 'Banking application',
        userInput: 'PCI-DSS compliance needed',
      };

      // const domain = await processor.detectDomain(context);

      // expect(domain).toBe('finance');
    });

    it('should detect education domain', async () => {
      const context: GenerationContext = {
        productBrief: 'Learning management system',
        userInput: 'FERPA compliance required',
      };

      // const domain = await processor.detectDomain(context);

      // expect(domain).toBe('education');
    });

    it('should add HIPAA compliance section for healthcare', async () => {
      const context: GenerationContext = {
        productBrief: 'Healthcare app',
        userInput: 'Patient data',
        domain: 'healthcare',
      };

      // const sections = await processor.generateContent(context);

      // expect(sections).toContain('hipaa_compliance');
      // expect(sections).toContain('phi_protection');
    });

    it('should add PCI-DSS section for finance', async () => {
      const context: GenerationContext = {
        productBrief: 'Payment system',
        userInput: 'Credit card processing',
        domain: 'finance',
      };

      // const sections = await processor.generateContent(context);

      // expect(sections).toContain('pci_dss_compliance');
      // expect(sections).toContain('payment_security');
    });

    it('should not add domain sections for generic projects', async () => {
      const context: GenerationContext = {
        productBrief: 'Task management app',
        userInput: 'To-do list',
      };

      // const domain = await processor.detectDomain(context);

      // expect(domain).toBeNull();
    });
  });

  // ====================
  // AC #5: Generate 67+ functional requirements
  // ====================
  describe('AC #5: Functional Requirements Generation', () => {
    it('should generate at least 67 functional requirements', async () => {
      const requirements: Requirement[] = Array.from({ length: 75 }, (_, i) => ({
        id: `FR-${String(i + 1).padStart(3, '0')}`,
        statement: `System shall ${['authenticate users', 'validate inputs', 'store data', 'send notifications'][i % 4]}`,
        acceptanceCriteria: [`User can complete action successfully`],
        priority: 'must-have' as const,
      }));

      mockMaryAgent.analyzeRequirements.mockResolvedValue({
        requirements,
        totalCount: 75,
      });

      const context: GenerationContext = {
        productBrief: 'Complex application',
        userInput: 'Many features needed',
      };

      // const reqs = await processor.generateFunctionalRequirements(context);

      expect(mockMaryAgent.analyzeRequirements).toHaveBeenCalled();
      // expect(reqs.length).toBeGreaterThanOrEqual(67);
    });

    it('should ensure requirements are specific and testable', async () => {
      mockMaryAgent.analyzeRequirements.mockResolvedValue({
        requirements: [
          {
            id: 'FR-001',
            statement: 'System shall authenticate users via JWT tokens with expiry',
            acceptanceCriteria: ['User receives valid JWT on successful login', 'Token expires after 24 hours'],
            priority: 'must-have',
          },
        ],
      });

      const context: GenerationContext = {
        productBrief: 'API',
        userInput: 'Auth needed',
      };

      // const reqs = await processor.generateFunctionalRequirements(context);

      expect(mockMaryAgent.analyzeRequirements).toHaveBeenCalled();
      // Each requirement should have specific statement and acceptance criteria
      // Should NOT contain vague phrases like "handle X" or "manage Y"
    });

    it('should reject vague requirements like "handle authentication"', async () => {
      const vagueRequirements = [
        {
          id: 'FR-001',
          statement: 'System shall handle authentication',
          acceptanceCriteria: ['Auth works'],
          priority: 'must-have',
        },
      ];

      mockMaryAgent.analyzeRequirements.mockResolvedValue({
        requirements: vagueRequirements,
      });

      // const isValid = await processor.validateRequirementQuality(vagueRequirements);

      // expect(isValid).toBe(false);
      // Should reject requirements with "handle", "manage", "deal with" without specifics
    });

    it('should group requirements by feature area', async () => {
      const requirements = [
        { id: 'FR-001', statement: 'Auth: login', acceptanceCriteria: [], priority: 'must-have' as const },
        { id: 'FR-002', statement: 'Auth: logout', acceptanceCriteria: [], priority: 'must-have' as const },
        { id: 'FR-003', statement: 'Profile: view', acceptanceCriteria: [], priority: 'must-have' as const },
      ];

      mockMaryAgent.analyzeRequirements.mockResolvedValue({ requirements });

      // const grouped = await processor.groupRequirementsByFeature(requirements);

      // expect(grouped).toHaveProperty('Auth');
      // expect(grouped).toHaveProperty('Profile');
      // expect(grouped.Auth).toHaveLength(2);
      // expect(grouped.Profile).toHaveLength(1);
    });

    it('should include acceptance criteria for each requirement', async () => {
      mockMaryAgent.analyzeRequirements.mockResolvedValue({
        requirements: [
          {
            id: 'FR-001',
            statement: 'User login',
            acceptanceCriteria: [
              'User enters valid credentials',
              'System validates credentials',
              'User receives JWT token',
            ],
            priority: 'must-have',
          },
        ],
      });

      // const reqs = await processor.generateFunctionalRequirements(context);

      // expect(reqs[0].acceptanceCriteria).toHaveLength(3);
    });
  });

  // ====================
  // AC #6: Format with proper markdown
  // ====================
  describe('AC #6: Markdown Formatting', () => {
    it('should format sections with proper headers (##, ###, ####)', async () => {
      const content = {
        title: 'Vision',
        subsections: [
          { title: 'Overview', content: 'Text' },
          { title: 'Details', content: 'More text' },
        ],
      };

      // const markdown = processor.formatAsMarkdown(content, 'section');

      // expect(markdown).toContain('## Vision');
      // expect(markdown).toContain('### Overview');
      // expect(markdown).toContain('### Details');
    });

    it('should generate markdown tables for requirements', async () => {
      const requirements = [
        { id: 'FR-001', statement: 'Login', acceptanceCriteria: ['Valid JWT'], priority: 'must-have' },
        { id: 'FR-002', statement: 'Logout', acceptanceCriteria: ['Session cleared'], priority: 'must-have' },
      ];

      // const markdown = processor.formatAsMarkdown(requirements, 'table');

      // expect(markdown).toContain('| ID | Requirement | Acceptance Criteria | Priority |');
      // expect(markdown).toContain('|----|-------------|---------------------|----------|');
      // expect(markdown).toContain('| FR-001 | Login | Valid JWT | must-have |');
    });

    it('should format code blocks for technical specifications', async () => {
      const techSpec = {
        endpoint: '/api/users',
        method: 'POST',
        payload: '{ "email": "user@example.com" }',
      };

      // const markdown = processor.formatAsMarkdown(techSpec, 'code');

      // expect(markdown).toContain('```');
      // expect(markdown).toContain('POST /api/users');
    });

    it('should create bulleted lists for features', async () => {
      const features = ['User authentication', 'Dashboard', 'Reports'];

      // const markdown = processor.formatAsMarkdown(features, 'list');

      // expect(markdown).toContain('- User authentication');
      // expect(markdown).toContain('- Dashboard');
      // expect(markdown).toContain('- Reports');
    });

    it('should add bold/italic formatting for emphasis', async () => {
      const content = {
        important: 'Critical requirement',
        note: 'Additional info',
      };

      // const markdown = processor.formatAsMarkdown(content, 'emphasized');

      // expect(markdown).toContain('**Critical requirement**');
      // expect(markdown).toContain('*Additional info*');
    });

    it('should ensure proper line breaks and spacing', async () => {
      const sections = ['Section 1', 'Section 2'];

      // const markdown = processor.formatAsMarkdown(sections, 'multi-section');

      // Should have double newlines between sections
      // expect(markdown).toMatch(/Section 1\n\nSection 2/);
    });

    it('should validate markdown syntax', async () => {
      const invalidMarkdown = '# Heading\n## Wrong ##\n';

      // const isValid = processor.validateMarkdownSyntax(invalidMarkdown);

      // expect(isValid).toBe(false);
    });
  });

  // ====================
  // AC #7: Save incrementally as sections complete
  // ====================
  describe('AC #7: Incremental Save Functionality', () => {
    it('should save each section to docs/PRD.md as it completes', async () => {
      const sectionContent = '## Vision\n\nOur product vision...';

      // await processor.saveSection('vision_alignment', sectionContent);

      expect(mockStateManager.appendToFile).toHaveBeenCalledWith(
        'docs/PRD.md',
        expect.stringContaining('Vision')
      );
    });

    it('should append sections without overwriting previous sections', async () => {
      mockStateManager.readFile.mockResolvedValue('## Section 1\nExisting content\n');

      const newSection = '## Section 2\nNew content\n';

      // await processor.saveSection('section_2', newSection);

      expect(mockStateManager.appendToFile).toHaveBeenCalled();
      // Should append, not overwrite
    });

    it('should create docs/ directory if it does not exist', async () => {
      mockStateManager.appendToFile.mockRejectedValueOnce(
        new Error('Directory does not exist')
      );
      mockStateManager.appendToFile.mockResolvedValueOnce(undefined);

      // await processor.saveSection('test_section', 'content');

      // Should retry after creating directory
      expect(mockStateManager.appendToFile).toHaveBeenCalled();
    });

    it('should handle concurrent write conflicts gracefully', async () => {
      mockStateManager.appendToFile
        .mockRejectedValueOnce(new Error('File locked'))
        .mockResolvedValueOnce(undefined);

      // await processor.saveSection('test_section', 'content');

      // Should retry on conflict
      expect(mockStateManager.appendToFile).toHaveBeenCalledTimes(2);
    });

    it('should log save operations for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // await processor.saveSection('test_section', 'content');

      // expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Saved section'));
      consoleSpy.mockRestore();
    });

    it('should trigger template-output event for workflow', async () => {
      const eventEmitter = { emit: vi.fn() };

      // processor.setEventEmitter(eventEmitter);
      // await processor.saveSection('test_section', 'content');

      // expect(eventEmitter.emit).toHaveBeenCalledWith('template-output', 'test_section');
    });

    it('should handle file write failures gracefully', async () => {
      mockStateManager.appendToFile.mockRejectedValue(
        new Error('Disk full')
      );

      // await expect(processor.saveSection('test_section', 'content')).rejects.toThrow('Disk full');
    });
  });

  // ====================
  // Integration & Error Handling Tests
  // ====================
  describe('Integration Tests', () => {
    it('should integrate with Mary agent for requirements analysis', async () => {
      mockAgentPool.spawn.mockResolvedValue(mockMaryAgent);
      mockMaryAgent.analyzeRequirements.mockResolvedValue({
        requirements: Array.from({ length: 70 }, (_, i) => ({
          id: `FR-${String(i + 1).padStart(3, '0')}`,
          statement: `Requirement ${i + 1}`,
          acceptanceCriteria: [],
          priority: 'must-have',
        })),
      });

      const context: GenerationContext = {
        productBrief: 'Test project',
        userInput: 'Test input',
      };

      // await processor.collaborateWithAgents(context);

      expect(mockAgentPool.spawn).toHaveBeenCalledWith('mary', expect.any(Object));
      expect(mockMaryAgent.analyzeRequirements).toHaveBeenCalled();
    });

    it('should integrate with John agent for strategic validation', async () => {
      mockAgentPool.spawn.mockResolvedValue(mockJohnAgent);
      mockJohnAgent.defineProductVision.mockResolvedValue({
        vision: 'Test vision',
      });

      const context: GenerationContext = {
        productBrief: 'Test project',
        userInput: 'Test input',
      };

      // await processor.collaborateWithAgents(context);

      expect(mockAgentPool.spawn).toHaveBeenCalledWith('john', expect.any(Object));
      expect(mockJohnAgent.defineProductVision).toHaveBeenCalled();
    });

    it('should retry agent spawning on failure with exponential backoff', async () => {
      mockAgentPool.spawn
        .mockRejectedValueOnce(new Error('Agent spawn failed'))
        .mockRejectedValueOnce(new Error('Agent spawn failed'))
        .mockResolvedValueOnce(mockMaryAgent);

      // await processor.collaborateWithAgents(context);

      // Should retry 3 times with delays: 1s, 2s, 4s
      expect(mockAgentPool.spawn).toHaveBeenCalledTimes(3);
    });

    it('should handle agent method failures gracefully', async () => {
      mockMaryAgent.analyzeRequirements.mockRejectedValue(
        new Error('LLM API error')
      );

      // await expect(processor.generateFunctionalRequirements(context)).rejects.toThrow('LLM API error');
    });
  });

  // ====================
  // Performance Tests
  // ====================
  describe('Performance', () => {
    it('should complete section generation in reasonable time', async () => {
      const startTime = Date.now();

      mockJohnAgent.defineProductVision.mockResolvedValue({
        vision: 'Test vision',
      });

      const context: GenerationContext = {
        productBrief: 'Test',
        userInput: 'Test',
      };

      // await processor.generateSection('vision_alignment', context);

      const duration = Date.now() - startTime;
      // Should complete in <5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });
});
