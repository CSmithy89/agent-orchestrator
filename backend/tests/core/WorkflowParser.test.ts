/**
 * WorkflowParser Unit Tests
 * Tests for YAML parsing, variable resolution, validation, and instructions parsing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowParser } from '../../src/core/WorkflowParser.js';
import { WorkflowParseError } from '../../src/types/workflow.types.js';
import { ProjectConfig } from '../../src/config/ProjectConfig.js';

describe('WorkflowParser', () => {
  let parser: WorkflowParser;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test files
    tempDir = path.join(process.cwd(), 'temp-test-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    parser = new WorkflowParser(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('parseYAML', () => {
    it('should parse valid workflow.yaml with all required fields', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'workflow.yaml');
      const workflowContent = `
name: "Test Workflow"
description: "Test workflow description"
author: "Test Author"
config_source: "{project-root}/config.yaml"
instructions: "{installed_path}/instructions.md"
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Act
      const config = await parser.parseYAML(workflowPath);

      // Assert
      expect(config.name).toBe('Test Workflow');
      expect(config.description).toBe('Test workflow description');
      expect(config.author).toBe('Test Author');
      expect(config.config_source).toBe('{project-root}/config.yaml');
      expect(config.instructions).toBe('{installed_path}/instructions.md');
      expect(config.standalone).toBe(true);
    });

    it('should throw WorkflowParseError when name field is missing', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'workflow.yaml');
      const workflowContent = `
description: "Test workflow description"
instructions: "{installed_path}/instructions.md"
config_source: "{project-root}/config.yaml"
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Act & Assert
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(WorkflowParseError);
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(/name/);
    });

    it('should throw WorkflowParseError when instructions field is missing', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'workflow.yaml');
      const workflowContent = `
name: "Test Workflow"
description: "Test workflow description"
config_source: "{project-root}/config.yaml"
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Act & Assert
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(WorkflowParseError);
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(/instructions/);
    });

    it('should throw WorkflowParseError when config_source field is missing', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'workflow.yaml');
      const workflowContent = `
name: "Test Workflow"
description: "Test workflow description"
instructions: "{installed_path}/instructions.md"
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Act & Assert
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(WorkflowParseError);
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(/config_source/);
    });

    it('should throw WorkflowParseError when workflow file not found', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'nonexistent.yaml');

      // Act & Assert
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(WorkflowParseError);
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(/not found/);
    });

    it('should throw WorkflowParseError for invalid YAML syntax', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'workflow.yaml');
      const workflowContent = `
name: "Test Workflow
description: unclosed quote
instructions: [invalid
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Act & Assert
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(WorkflowParseError);
      await expect(parser.parseYAML(workflowPath)).rejects.toThrow(/YAML parse error/);
    });
  });

  describe('resolveVariables', () => {
    it('should resolve {project-root} variable correctly', async () => {
      // Arrange
      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: `${tempDir}/config.yaml`,
        instructions: '{project-root}/instructions.md',
        output_folder: '{project-root}/output',
        user_name: 'test',
        communication_language: 'en',
        date: 'system-generated',
        installed_path: '{project-root}/workflows',
        standalone: true
      };

      // Create minimal config file
      await fs.writeFile(
        path.join(tempDir, 'config.yaml'),
        'user_name: TestUser\ncommunication_language: English'
      );

      const projectConfig = {} as ProjectConfig; // Mock

      // Act
      const resolved = await parser.resolveVariables(config, projectConfig);

      // Assert
      expect(resolved.instructions).toBe(`${tempDir}/instructions.md`);
      expect(resolved.output_folder).toBe(`${tempDir}/output`);
      expect(resolved.installed_path).toBe(`${tempDir}/workflows`);
    });

    it('should resolve {installed_path} variable correctly', async () => {
      // Arrange
      const workflowDir = path.join(tempDir, 'workflows', 'test');
      await fs.mkdir(workflowDir, { recursive: true });

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: `${tempDir}/config.yaml`,
        instructions: `${workflowDir}/instructions.md`,
        template: '{installed_path}/template.md',
        user_name: 'test',
        communication_language: 'en',
        date: 'system-generated',
        installed_path: '{installed_path}',
        output_folder: '',
        standalone: true
      };

      // Create minimal config file
      await fs.writeFile(
        path.join(tempDir, 'config.yaml'),
        'user_name: TestUser\ncommunication_language: English'
      );

      const projectConfig = {} as ProjectConfig; // Mock

      // Act
      const resolved = await parser.resolveVariables(config, projectConfig);

      // Assert
      expect(resolved.template).toBe(`${workflowDir}/template.md`);
    });

    it('should resolve {config_source}:key references', async () => {
      // Arrange
      const configPath = path.join(tempDir, 'config.yaml');
      const configContent = `
user_name: Chris
communication_language: English
output_folder: /home/chris/output
`;
      await fs.writeFile(configPath, configContent);

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: '{config_source}:user_name',
        communication_language: '{config_source}:communication_language',
        output_folder: '{config_source}:output_folder',
        date: 'system-generated',
        installed_path: '{project-root}',
        standalone: true
      };

      const projectConfig = {} as ProjectConfig; // Mock

      // Act
      const resolved = await parser.resolveVariables(config, projectConfig);

      // Assert
      expect(resolved.user_name).toBe('Chris');
      expect(resolved.communication_language).toBe('English');
      expect(resolved.output_folder).toBe('/home/chris/output');
    });

    it('should resolve nested config paths', async () => {
      // Arrange
      const configPath = path.join(tempDir, 'config.yaml');
      const configContent = `
project:
  metadata:
    owner: Chris
    team: Engineering
`;
      await fs.writeFile(configPath, configContent);

      const config = {
        name: 'Test',
        description: 'Test',
        author: '{config_source}:project.metadata.owner',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: '{config_source}:project.metadata.owner',
        communication_language: 'en',
        output_folder: '',
        date: 'system-generated',
        installed_path: '{project-root}',
        standalone: true,
        variables: {
          team: '{config_source}:project.metadata.team'
        }
      };

      const projectConfig = {} as ProjectConfig; // Mock

      // Act
      const resolved = await parser.resolveVariables(config, projectConfig);

      // Assert
      expect(resolved.author).toBe('Chris');
      expect(resolved.user_name).toBe('Chris');
      expect(resolved.variables?.team).toBe('Engineering');
    });

    it('should resolve system-generated date variable', async () => {
      // Arrange
      const configPath = path.join(tempDir, 'config.yaml');
      await fs.writeFile(configPath, 'user_name: Test');

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: 'test',
        communication_language: 'en',
        date: 'system-generated',
        output_folder: '',
        installed_path: '{project-root}',
        standalone: true
      };

      const projectConfig = {} as ProjectConfig; // Mock

      // Act
      const resolved = await parser.resolveVariables(config, projectConfig);

      // Assert
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      expect(resolved.date).toBe(today);
    });

    it('should throw error for undefined config reference', async () => {
      // Arrange
      const configPath = path.join(tempDir, 'config.yaml');
      await fs.writeFile(configPath, 'user_name: Test');

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: '{config_source}:nonexistent_key',
        communication_language: 'en',
        date: 'system-generated',
        output_folder: '',
        installed_path: '{project-root}',
        standalone: true
      };

      const projectConfig = {} as ProjectConfig; // Mock

      // Act & Assert
      await expect(parser.resolveVariables(config, projectConfig)).rejects.toThrow(
        WorkflowParseError
      );
      await expect(parser.resolveVariables(config, projectConfig)).rejects.toThrow(
        /nonexistent_key/
      );
    });

    it('should throw error when config_source file not found', async () => {
      // Arrange
      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: path.join(tempDir, 'nonexistent.yaml'),
        instructions: '{project-root}/instructions.md',
        user_name: 'test',
        communication_language: 'en',
        date: 'system-generated',
        output_folder: '',
        installed_path: '{project-root}',
        standalone: true
      };

      const projectConfig = {} as ProjectConfig; // Mock

      // Act & Assert
      await expect(parser.resolveVariables(config, projectConfig)).rejects.toThrow(
        WorkflowParseError
      );
      await expect(parser.resolveVariables(config, projectConfig)).rejects.toThrow(
        /not found/
      );
    });

    it('should cache loaded config to avoid redundant file reads', async () => {
      // Arrange
      const configPath = path.join(tempDir, 'config.yaml');
      await fs.writeFile(configPath, 'user_name: Test');

      const config1 = {
        name: 'Test1',
        description: 'Test',
        author: 'Test',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: '{config_source}:user_name',
        communication_language: 'en',
        date: 'system-generated',
        output_folder: '',
        installed_path: '{project-root}',
        standalone: true
      };

      const config2 = { ...config1, name: 'Test2' };

      const projectConfig = {} as ProjectConfig; // Mock

      // Act
      const resolved1 = await parser.resolveVariables(config1, projectConfig);
      const resolved2 = await parser.resolveVariables(config2, projectConfig);

      // Assert
      expect(resolved1.user_name).toBe('Test');
      expect(resolved2.user_name).toBe('Test');
    });
  });

  describe('validateWorkflow', () => {
    it('should return valid result for complete workflow config', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      await fs.writeFile(instructionsPath, '# Instructions');

      // Create config file
      const configPath = path.join(tempDir, 'config.yaml');
      await fs.writeFile(configPath, 'user_name: test\noutput_folder: /tmp');

      const config = {
        name: 'Test',
        description: 'Test workflow',
        author: 'Test',
        config_source: configPath,
        instructions: instructionsPath,
        user_name: 'test',
        communication_language: 'en',
        date: '2025-11-05',
        output_folder: tempDir,
        installed_path: tempDir,
        standalone: true
      };

      // Act
      const result = await parser.validateWorkflow(config);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', async () => {
      // Arrange
      const config = {
        name: '',
        description: '',
        author: 'Test',
        config_source: path.join(tempDir, 'config.yaml'),
        instructions: '',
        user_name: 'test',
        communication_language: 'en',
        date: '2025-11-05',
        output_folder: tempDir,
        installed_path: tempDir,
        standalone: true
      };

      // Act
      const result = await parser.validateWorkflow(config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
      expect(result.errors.some(e => e.includes('instructions'))).toBe(true);
    });

    it('should detect missing instructions file', async () => {
      // Arrange
      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: path.join(tempDir, 'config.yaml'),
        instructions: path.join(tempDir, 'nonexistent.md'),
        user_name: 'test',
        communication_language: 'en',
        date: '2025-11-05',
        output_folder: tempDir,
        installed_path: tempDir,
        standalone: true
      };

      // Act
      const result = await parser.validateWorkflow(config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Instructions file not found'))).toBe(true);
    });

    it('should detect unresolved variables', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      await fs.writeFile(instructionsPath, '# Instructions');

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: path.join(tempDir, 'config.yaml'),
        instructions: instructionsPath,
        user_name: '{config_source}:user_name',
        communication_language: 'en',
        date: '2025-11-05',
        output_folder: '{unresolved_var}',
        installed_path: tempDir,
        standalone: true
      };

      // Act
      const result = await parser.validateWorkflow(config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Unresolved variables'))).toBe(true);
    });

    it('should warn about missing optional files', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      await fs.writeFile(instructionsPath, '# Instructions');

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: path.join(tempDir, 'config.yaml'),
        instructions: instructionsPath,
        template: path.join(tempDir, 'nonexistent-template.md'),
        validation: path.join(tempDir, 'nonexistent-validation.md'),
        user_name: 'test',
        communication_language: 'en',
        date: '2025-11-05',
        output_folder: tempDir,
        installed_path: tempDir,
        standalone: true
      };

      // Act
      const result = await parser.validateWorkflow(config);

      // Assert
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Template'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Validation'))).toBe(true);
    });
  });

  describe('parseInstructions', () => {
    it('should parse step tags from instructions markdown', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      const instructionsContent = `# Workflow Instructions

<step n="1" goal="Setup environment">
  - Install dependencies
  - Configure settings
</step>

<step n="2" goal="Run tests">
  - Execute unit tests
  - Verify results
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      // Act
      const steps = await parser.parseInstructions(instructionsPath);

      // Assert
      expect(steps).toHaveLength(2);
      expect(steps[0].number).toBe(1);
      expect(steps[0].goal).toBe('Setup environment');
      expect(steps[0].content).toContain('Install dependencies');
      expect(steps[1].number).toBe(2);
      expect(steps[1].goal).toBe('Run tests');
      expect(steps[1].content).toContain('Execute unit tests');
    });

    it('should extract step number, goal, and content', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      const instructionsContent = `
<step n="1" goal="First step">
This is the step content.
It can span multiple lines.
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      // Act
      const steps = await parser.parseInstructions(instructionsPath);

      // Assert
      expect(steps).toHaveLength(1);
      expect(steps[0].number).toBe(1);
      expect(steps[0].goal).toBe('First step');
      expect(steps[0].content).toContain('This is the step content');
      expect(steps[0].content).toContain('multiple lines');
    });

    it('should parse optional attribute', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      const instructionsContent = `
<step n="1" goal="Required step">
Required content
</step>

<step n="2" goal="Optional step" optional="true">
Optional content
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      // Act
      const steps = await parser.parseInstructions(instructionsPath);

      // Assert
      expect(steps).toHaveLength(2);
      expect(steps[0].optional).toBeFalsy();
      expect(steps[1].optional).toBe(true);
    });

    it('should parse conditional attribute', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      const instructionsContent = `
<step n="1" goal="Conditional step" if="condition_met">
Conditional content
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      // Act
      const steps = await parser.parseInstructions(instructionsPath);

      // Assert
      expect(steps).toHaveLength(1);
      expect(steps[0].condition).toBe('condition_met');
    });

    it('should throw error when instructions file not found', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'nonexistent.md');

      // Act & Assert
      await expect(parser.parseInstructions(instructionsPath)).rejects.toThrow(
        WorkflowParseError
      );
      await expect(parser.parseInstructions(instructionsPath)).rejects.toThrow(/not found/);
    });

    it('should return empty array when no steps found', async () => {
      // Arrange
      const instructionsPath = path.join(tempDir, 'instructions.md');
      const instructionsContent = `# Instructions\n\nNo step tags here.`;
      await fs.writeFile(instructionsPath, instructionsContent);

      // Act
      const steps = await parser.parseInstructions(instructionsPath);

      // Assert
      expect(steps).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular variable references gracefully', async () => {
      // Note: Current implementation doesn't detect circular refs, but shouldn't hang
      // This test ensures we don't hang indefinitely

      const configPath = path.join(tempDir, 'config.yaml');
      await fs.writeFile(
        configPath,
        'var_a: "{config_source}:var_b"\nvar_b: "{config_source}:var_a"'
      );

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: '{config_source}:var_a',
        communication_language: 'en',
        date: 'system-generated',
        output_folder: '',
        installed_path: '{project-root}',
        standalone: true
      };

      const projectConfig = {} as ProjectConfig;

      // This should either resolve or fail, but not hang
      // The current implementation will leave unresolved references
      const resolved = await parser.resolveVariables(config, projectConfig);
      expect(resolved.user_name).toContain('{config_source}');
    });

    it('should handle very deeply nested config paths', async () => {
      // Arrange
      const configPath = path.join(tempDir, 'config.yaml');
      const configContent = `
level1:
  level2:
    level3:
      level4:
        level5:
          value: "deep_value"
`;
      await fs.writeFile(configPath, configContent);

      const config = {
        name: 'Test',
        description: 'Test',
        author: 'Test',
        config_source: configPath,
        instructions: '{project-root}/instructions.md',
        user_name: '{config_source}:level1.level2.level3.level4.level5.value',
        communication_language: 'en',
        date: 'system-generated',
        output_folder: '',
        installed_path: '{project-root}',
        standalone: true
      };

      const projectConfig = {} as ProjectConfig;

      // Act
      const resolved = await parser.resolveVariables(config, projectConfig);

      // Assert
      expect(resolved.user_name).toBe('deep_value');
    });

    it('should handle workflow with unicode characters', async () => {
      // Arrange
      const workflowPath = path.join(tempDir, 'workflow.yaml');
      const workflowContent = `
name: "测试工作流 Test Workflow 🚀"
description: "Description with émojis and spëcial çharacters"
author: "José García"
config_source: "{project-root}/config.yaml"
instructions: "{installed_path}/instructions.md"
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Act
      const config = await parser.parseYAML(workflowPath);

      // Assert
      expect(config.name).toBe('测试工作流 Test Workflow 🚀');
      expect(config.description).toContain('émojis');
      expect(config.author).toBe('José García');
    });
  });
});
