/**
 * Integration tests for Architecture Template Content Generation
 *
 * Tests all acceptance criteria for Story 3-5:
 * - AC-1: Template Structure Defined
 * - AC-2: Variable Substitution System
 * - AC-3: Section Replacement System
 * - AC-4: Template Validation
 * - AC-5: Template Customization Support
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TemplateProcessor } from '../../src/core/TemplateProcessor.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Architecture Template Content Generation Integration Tests', () => {
  let processor: TemplateProcessor;
  let tempDir: string;
  // Template is at project root, not backend root
  const templatePath = path.resolve(__dirname, '../../../bmad/bmm/workflows/architecture/template.md');

  beforeEach(async () => {
    processor = new TemplateProcessor();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'arch-template-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * AC-1: Template Structure Defined
   */
  describe('AC-1: Template Structure Defined', () => {
    it('should load architecture template successfully', async () => {
      const template = await processor.loadTemplate(templatePath);

      expect(template).toBeTruthy();
      expect(template.length).toBeGreaterThan(100);
    });

    it('should contain all required sections with XML markers', async () => {
      const template = await processor.loadTemplate(templatePath);

      const requiredSections = [
        'system-overview',
        'component-architecture',
        'data-models',
        'api-specifications',
        'non-functional-requirements',
        'test-strategy',
        'technical-decisions',
        'glossary',
        'references'
      ];

      for (const section of requiredSections) {
        expect(template).toContain(`<!-- SECTION: ${section} -->`);
        expect(template).toContain(`<!-- END SECTION: ${section} -->`);
      }
    });

    it('should contain variable placeholders in frontmatter', async () => {
      const template = await processor.loadTemplate(templatePath);

      expect(template).toContain('{{project_name}}');
      expect(template).toContain('{{date}}');
      expect(template).toContain('{{user_name}}');
      expect(template).toContain('{{epic_id}}');
    });

    it('should start with valid YAML frontmatter', async () => {
      const template = await processor.loadTemplate(templatePath);

      expect(template.startsWith('---')).toBe(true);
      expect(template.indexOf('---', 3)).toBeGreaterThan(0);
    });

    it('should have valid markdown structure', async () => {
      const template = await processor.loadTemplate(templatePath);

      // Check for main heading
      expect(template).toContain('# Architecture Document:');

      // Check for section headings
      expect(template).toContain('## System Overview');
      expect(template).toContain('## Component Architecture');
      expect(template).toContain('## Data Models & APIs');
      expect(template).toContain('## Test Strategy');
      expect(template).toContain('## Technical Decisions');
    });
  });

  /**
   * AC-2: Variable Substitution System
   */
  describe('AC-2: Variable Substitution System', () => {
    it('should resolve system default variables (date, timestamp)', async () => {
      const vars = await processor.resolveArchitectureVariables();

      expect(vars.date).toBeTruthy();
      expect(vars.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
      expect(vars.timestamp).toBeTruthy();
      expect(vars.year).toBe(new Date().getFullYear().toString());
    });

    it('should resolve git config variables', async () => {
      const vars = await processor.resolveArchitectureVariables();

      // Git config may or may not be available
      // If available, should have user_name and/or user_email
      if (vars.user_name) {
        expect(typeof vars.user_name).toBe('string');
        expect(vars.user_name.length).toBeGreaterThan(0);
      }

      if (vars.user_email) {
        expect(typeof vars.user_email).toBe('string');
        expect(vars.user_email.length).toBeGreaterThan(0);
      }
    });

    it('should resolve explicit context variables with highest priority', async () => {
      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test Project',
        epic_id: 'epic-3',
        custom_var: 'custom_value'
      });

      expect(vars.project_name).toBe('Test Project');
      expect(vars.epic_id).toBe('epic-3');
      expect(vars.custom_var).toBe('custom_value');
    });

    it('should resolve workflow state variables', async () => {
      const vars = await processor.resolveArchitectureVariables({
        workflowState: {
          current_step: 'architecture',
          epic_id: 'epic-3',
          status: 'in-progress'
        }
      });

      expect(vars.current_step).toBe('architecture');
      expect(vars.epic_id).toBe('epic-3');
      expect(vars.status).toBe('in-progress');
    });

    it('should resolve project config variables', async () => {
      // Create test project config
      const configPath = path.join(tempDir, 'project-config.yaml');
      await fs.writeFile(configPath,
`project_name: "Agent Orchestrator"
repository: "github.com/test/repo"
version: "1.0.0"
`);

      const vars = await processor.resolveArchitectureVariables({
        projectConfigPath: configPath
      });

      expect(vars.project_name).toBe('Agent Orchestrator');
      expect(vars.repository).toBe('github.com/test/repo');
      expect(vars.version).toBe('1.0.0');
    });

    it('should prioritize explicit variables over config', async () => {
      // Create test project config
      const configPath = path.join(tempDir, 'project-config.yaml');
      await fs.writeFile(configPath, 'project_name: "Config Project"');

      const vars = await processor.resolveArchitectureVariables({
        projectConfigPath: configPath,
        project_name: 'Explicit Project'
      });

      expect(vars.project_name).toBe('Explicit Project');
    });

    it('should handle missing project config gracefully', async () => {
      const vars = await processor.resolveArchitectureVariables({
        projectConfigPath: '/non/existent/config.yaml',
        project_name: 'Test Project'
      });

      // Should still have explicit variables even if config load fails
      expect(vars.project_name).toBe('Test Project');
      expect(vars.date).toBeTruthy();
    });

    it('should handle invalid project config gracefully', async () => {
      // Create a config file with invalid YAML
      const invalidConfigPath = path.join(tempDir, 'invalid-config.yaml');
      await fs.writeFile(invalidConfigPath, 'invalid: yaml: : syntax: error\n[malformed');

      const vars = await processor.resolveArchitectureVariables({
        projectConfigPath: invalidConfigPath,
        project_name: 'Test Project'
      });

      // Should still have explicit variables even if config parsing fails
      expect(vars.project_name).toBe('Test Project');
      expect(vars.date).toBeTruthy();
    });

    it('should handle git config unavailable gracefully', async () => {
      // This test runs in an environment where git may not be configured
      // The implementation should handle this gracefully and still return other variables
      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test Project'
      });

      // Should have system variables even if git config fails
      expect(vars.project_name).toBe('Test Project');
      expect(vars.date).toBeTruthy();
      expect(vars.timestamp).toBeTruthy();
      expect(vars.year).toBeTruthy();
      // user_name and user_email may or may not be present depending on git config availability
    });

    it('should substitute all variables in template', async () => {
      const template = await processor.loadTemplate(templatePath);

      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test App',
        epic_id: 'epic-3',
        user_name: 'Test User',
        system_overview_content: 'System overview',
        component_architecture_content: 'Components',
        data_models_content: 'Data models',
        api_specifications_content: 'APIs',
        nfr_content: 'NFRs',
        test_strategy_content: 'Testing',
        technical_decisions_content: 'Decisions',
        glossary_content: 'Terms',
        references_content: 'Refs'
      });

      const rendered = processor.processTemplate(template, vars);

      expect(rendered).toContain('Test App');
      expect(rendered).toContain('epic-3');
      expect(rendered).toContain('Test User');
      expect(rendered).not.toContain('{{project_name}}');
      expect(rendered).not.toContain('{{epic_id}}');
      expect(rendered).not.toContain('{{user_name}}');
    });
  });

  /**
   * AC-3: Section Replacement System
   */
  describe('AC-3: Section Replacement System', () => {
    it('should replace section content with XML markers', async () => {
      const template = await processor.loadTemplate(templatePath);
      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test',
        epic_id: 'epic-3',
        user_name: 'Tester',
        system_overview_content: 'placeholder',
        component_architecture_content: 'placeholder',
        data_models_content: 'placeholder',
        api_specifications_content: 'placeholder',
        nfr_content: 'placeholder',
        test_strategy_content: 'placeholder',
        technical_decisions_content: 'placeholder',
        glossary_content: 'placeholder',
        references_content: 'placeholder'
      });

      const rendered = processor.processTemplate(template, vars);

      const newContent = 'This is the updated system overview section.';
      const updated = processor.replaceSectionWithMarkers(
        rendered,
        'system-overview',
        newContent
      );

      expect(updated).toContain('<!-- SECTION: system-overview -->');
      expect(updated).toContain(newContent);
      expect(updated).toContain('<!-- END SECTION: system-overview -->');

      // Verify the system-overview section was updated (not placeholder)
      const systemOverviewSection = updated.match(
        /<!-- SECTION: system-overview -->([\s\S]*?)<!-- END SECTION: system-overview -->/
      );
      expect(systemOverviewSection).toBeTruthy();
      expect(systemOverviewSection![1]).toContain(newContent);
      expect(systemOverviewSection![1]).not.toContain('placeholder');
    });

    it('should preserve section markers after replacement', async () => {
      const content = `
<!-- SECTION: test-section -->
Old content
<!-- END SECTION: test-section -->
`;

      const updated = processor.replaceSectionWithMarkers(
        content,
        'test-section',
        'New content'
      );

      expect(updated).toContain('<!-- SECTION: test-section -->');
      expect(updated).toContain('New content');
      expect(updated).toContain('<!-- END SECTION: test-section -->');
      expect(updated).not.toContain('Old content');
    });

    it('should replace multiple sections independently', async () => {
      const template = await processor.loadTemplate(templatePath);
      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test',
        epic_id: 'epic-3',
        user_name: 'Tester',
        system_overview_content: 'original overview',
        component_architecture_content: 'original components',
        data_models_content: 'placeholder',
        api_specifications_content: 'placeholder',
        nfr_content: 'placeholder',
        test_strategy_content: 'placeholder',
        technical_decisions_content: 'placeholder',
        glossary_content: 'placeholder',
        references_content: 'placeholder'
      });

      let rendered = processor.processTemplate(template, vars);

      // Replace system overview
      rendered = processor.replaceSectionWithMarkers(
        rendered,
        'system-overview',
        'Updated system overview'
      );

      // Replace component architecture
      rendered = processor.replaceSectionWithMarkers(
        rendered,
        'component-architecture',
        'Updated components'
      );

      expect(rendered).toContain('Updated system overview');
      expect(rendered).toContain('Updated components');
      expect(rendered).not.toContain('original overview');
      expect(rendered).not.toContain('original components');
    });

    it('should maintain markdown heading levels after replacement', async () => {
      const template = await processor.loadTemplate(templatePath);
      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test',
        epic_id: 'epic-3',
        user_name: 'Tester',
        system_overview_content: 'content',
        component_architecture_content: 'content',
        data_models_content: 'content',
        api_specifications_content: 'content',
        nfr_content: 'content',
        test_strategy_content: 'content',
        technical_decisions_content: 'content',
        glossary_content: 'content',
        references_content: 'content'
      });

      let rendered = processor.processTemplate(template, vars);

      rendered = processor.replaceSectionWithMarkers(
        rendered,
        'system-overview',
        '### Subsection\nContent here'
      );

      // Main section heading should still be ##
      expect(rendered).toContain('## System Overview');
      // Our subsection should be ###
      expect(rendered).toContain('### Subsection');
    });

    it('should throw error for non-existent section', () => {
      const content = `
<!-- SECTION: existing -->
Content
<!-- END SECTION: existing -->
`;

      expect(() => {
        processor.replaceSectionWithMarkers(
          content,
          'non-existent',
          'New content'
        );
      }).toThrow('Section start marker not found');
    });

    it('should throw error for malformed markers (missing end)', () => {
      const content = `
<!-- SECTION: test -->
Content without end marker
`;

      expect(() => {
        processor.replaceSectionWithMarkers(
          content,
          'test',
          'New content'
        );
      }).toThrow('Section end marker not found');
    });
  });

  /**
   * AC-4: Template Validation
   */
  describe('AC-4: Template Validation', () => {
    it('should validate architecture template successfully', async () => {
      const template = await processor.loadTemplate(templatePath);
      const result = processor.validateArchitectureTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing frontmatter', () => {
      const template = `# No frontmatter

<!-- SECTION: system-overview -->
Content
<!-- END SECTION: system-overview -->
`;

      const result = processor.validateArchitectureTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template must start with YAML frontmatter (---)');
    });

    it('should detect missing required sections', () => {
      const template = `---
project: test
---

# Architecture

<!-- SECTION: system-overview -->
Content
<!-- END SECTION: system-overview -->
`;

      const result = processor.validateArchitectureTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required sections');
    });

    it('should detect mismatched section markers', () => {
      const template = `---
project: test
---

<!-- SECTION: system-overview -->
Content
<!-- END SECTION: system-overview -->

<!-- SECTION: component-architecture -->
Content
<!-- Missing end marker -->

<!-- SECTION: data-models -->
Content
<!-- END SECTION: data-models -->

<!-- SECTION: api-specifications -->
Content
<!-- END SECTION: api-specifications -->

<!-- SECTION: non-functional-requirements -->
Content
<!-- END SECTION: non-functional-requirements -->

<!-- SECTION: test-strategy -->
Content
<!-- END SECTION: test-strategy -->

<!-- SECTION: technical-decisions -->
Content
<!-- END SECTION: technical-decisions -->
`;

      const result = processor.validateArchitectureTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Mismatched section markers'))).toBe(true);
    });

    it('should detect malformed variable syntax', () => {
      const template = `---
project: {{project_name
---

# Architecture

<!-- SECTION: system-overview -->
Content
<!-- END SECTION: system-overview -->

<!-- SECTION: component-architecture -->
Content
<!-- END SECTION: component-architecture -->

<!-- SECTION: data-models -->
Content
<!-- END SECTION: data-models -->

<!-- SECTION: api-specifications -->
Content
<!-- END SECTION: api-specifications -->

<!-- SECTION: non-functional-requirements -->
Content
<!-- END SECTION: non-functional-requirements -->

<!-- SECTION: test-strategy -->
Content
<!-- END SECTION: test-strategy -->

<!-- SECTION: technical-decisions -->
Content
<!-- END SECTION: technical-decisions -->
`;

      const result = processor.validateArchitectureTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('syntax error'))).toBe(true);
    });

    it('should warn about missing recommended variables', () => {
      const template = `---
project: Static Project
---

# Architecture

<!-- SECTION: system-overview -->
Content
<!-- END SECTION: system-overview -->

<!-- SECTION: component-architecture -->
Content
<!-- END SECTION: component-architecture -->

<!-- SECTION: data-models -->
Content
<!-- END SECTION: data-models -->

<!-- SECTION: api-specifications -->
Content
<!-- END SECTION: api-specifications -->

<!-- SECTION: non-functional-requirements -->
Content
<!-- END SECTION: non-functional-requirements -->

<!-- SECTION: test-strategy -->
Content
<!-- END SECTION: test-strategy -->

<!-- SECTION: technical-decisions -->
Content
<!-- END SECTION: technical-decisions -->
`;

      const result = processor.validateArchitectureTemplate(template);

      // May pass validation but should have warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('missing recommended variables');
    });

    it('should provide clear error messages for malformed templates', () => {
      const template = `Invalid template`;

      const result = processor.validateArchitectureTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.every(e => typeof e === 'string' && e.length > 0)).toBe(true);
    });
  });

  /**
   * AC-5: Template Customization Support
   */
  describe('AC-5: Template Customization Support', () => {
    it('should load default template when no override exists', async () => {
      const result = await processor.loadTemplateWithOverride(
        templatePath,
        path.join(tempDir, 'non-existent.md')
      );

      expect(result.source).toBe('default');
      expect(result.content).toBeTruthy();
      expect(result.content.length).toBeGreaterThan(100);
      expect(result.path).toContain('template.md');
    });

    it('should load custom template when override exists and is valid', async () => {
      // Create custom template
      const customPath = path.join(tempDir, 'custom-template.md');
      const customTemplate = `---
project: {{project_name}}
date: {{date}}
author: {{user_name}}
epic: {{epic_id}}
version: 2.0
---

# Custom Architecture: {{project_name}}

<!-- SECTION: system-overview -->
{{system_overview_content}}
<!-- END SECTION: system-overview -->

<!-- SECTION: component-architecture -->
{{component_architecture_content}}
<!-- END SECTION: component-architecture -->

<!-- SECTION: data-models -->
{{data_models_content}}
<!-- END SECTION: data-models -->

<!-- SECTION: api-specifications -->
{{api_specifications_content}}
<!-- END SECTION: api-specifications -->

<!-- SECTION: non-functional-requirements -->
{{nfr_content}}
<!-- END SECTION: non-functional-requirements -->

<!-- SECTION: test-strategy -->
{{test_strategy_content}}
<!-- END SECTION: test-strategy -->

<!-- SECTION: technical-decisions -->
{{technical_decisions_content}}
<!-- END SECTION: technical-decisions -->
`;

      await fs.writeFile(customPath, customTemplate);

      const result = await processor.loadTemplateWithOverride(
        templatePath,
        customPath
      );

      expect(result.source).toBe('custom');
      expect(result.content).toContain('Custom Architecture');
      expect(result.content).toContain('version: 2.0');
    });

    it('should fall back to default if custom template is invalid', async () => {
      // Create invalid custom template
      const customPath = path.join(tempDir, 'invalid-template.md');
      await fs.writeFile(customPath, 'Invalid template without sections');

      const result = await processor.loadTemplateWithOverride(
        templatePath,
        customPath
      );

      expect(result.source).toBe('default');
      expect(result.content).toBeTruthy();
    });

    it('should validate custom templates before use', async () => {
      // Create custom template with missing sections
      const customPath = path.join(tempDir, 'incomplete-template.md');
      const incompleteTemplate = `---
project: {{project_name}}
---

# Incomplete Template

<!-- SECTION: system-overview -->
Content
<!-- END SECTION: system-overview -->
`;

      await fs.writeFile(customPath, incompleteTemplate);

      const result = await processor.loadTemplateWithOverride(
        templatePath,
        customPath
      );

      // Should fall back to default due to validation failure
      expect(result.source).toBe('default');
    });

    it('should log template source for audit trail', async () => {
      // Spy on console.log
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await processor.loadTemplateWithOverride(
          templatePath,
          path.join(tempDir, 'non-existent.md')
        );

        expect(logs.some(log => log.includes('Using default template'))).toBe(true);
      } finally {
        console.log = originalLog;
      }
    });
  });

  /**
   * Integration Test: End-to-End Template Processing
   */
  describe('Integration: End-to-End Template Processing', () => {
    it('should process complete architecture document from template', async () => {
      // Load template
      const { content: template } = await processor.loadTemplateWithOverride(
        templatePath
      );

      // Resolve variables
      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Agent Orchestrator',
        epic_id: 'epic-3',
        user_name: 'Test Developer',
        system_overview_content: 'Microkernel architecture with plugin-based workflows',
        component_architecture_content: 'Core engine, workflow plugins, agent pool',
        data_models_content: 'WorkflowState, AgentContext, DecisionRecord',
        api_specifications_content: 'REST API for workflow control',
        nfr_content: 'Performance: <2s response time\nSecurity: OAuth2 authentication',
        test_strategy_content: 'Unit tests: 80% coverage\nIntegration tests: All workflows',
        technical_decisions_content: 'ADR-001: Use microkernel pattern',
        glossary_content: 'ADR: Architecture Decision Record',
        references_content: 'PRD: docs/PRD.md'
      });

      // Process template
      const rendered = processor.processTemplate(template, vars);

      // Verify output
      expect(rendered).toContain('Agent Orchestrator');
      expect(rendered).toContain('epic-3');
      expect(rendered).toContain('Test Developer');
      expect(rendered).toContain('Microkernel architecture');
      expect(rendered).toContain('REST API');
      expect(rendered).toContain('80% coverage');
      expect(rendered).toContain('ADR-001');

      // Verify no unresolved variables
      expect(rendered).not.toContain('{{project_name}}');
      expect(rendered).not.toContain('{{epic_id}}');
    });

    it('should support incremental section updates', async () => {
      // Load and render initial template
      const { content: template } = await processor.loadTemplateWithOverride(
        templatePath
      );

      const initialVars = await processor.resolveArchitectureVariables({
        project_name: 'Test Project',
        epic_id: 'epic-3',
        user_name: 'Developer',
        system_overview_content: 'Initial overview',
        component_architecture_content: 'Initial components',
        data_models_content: 'Initial models',
        api_specifications_content: 'Initial APIs',
        nfr_content: 'Initial NFRs',
        test_strategy_content: 'Initial tests',
        technical_decisions_content: 'Initial decisions',
        glossary_content: 'Initial glossary',
        references_content: 'Initial refs'
      });

      let document = processor.processTemplate(template, initialVars);

      // Update system overview
      document = processor.replaceSectionWithMarkers(
        document,
        'system-overview',
        'Updated system overview with more detail'
      );

      // Update test strategy
      document = processor.replaceSectionWithMarkers(
        document,
        'test-strategy',
        'Updated test strategy with CI/CD pipeline'
      );

      // Verify updates
      expect(document).toContain('Updated system overview with more detail');
      expect(document).toContain('Updated test strategy with CI/CD pipeline');
      expect(document).not.toContain('Initial overview');
      expect(document).not.toContain('Initial tests');

      // Other sections should remain unchanged
      expect(document).toContain('Initial components');
      expect(document).toContain('Initial models');
    });

    it('should write complete architecture document to file', async () => {
      const outputPath = path.join(tempDir, 'architecture.md');

      // Load and process template
      const { content: template } = await processor.loadTemplateWithOverride(
        templatePath
      );

      const vars = await processor.resolveArchitectureVariables({
        project_name: 'Test Project',
        epic_id: 'epic-3',
        user_name: 'Developer',
        system_overview_content: 'System overview',
        component_architecture_content: 'Components',
        data_models_content: 'Data models',
        api_specifications_content: 'APIs',
        nfr_content: 'NFRs',
        test_strategy_content: 'Testing',
        technical_decisions_content: 'Decisions',
        glossary_content: 'Glossary',
        references_content: 'References'
      });

      const rendered = processor.processTemplate(template, vars);

      // Write to file
      await processor.writeOutput(rendered, outputPath);

      // Verify file exists and has content
      const written = await fs.readFile(outputPath, 'utf8');
      expect(written).toBe(rendered);
      expect(written).toContain('Test Project');
      expect(written).toContain('System overview');
    });
  });
});
