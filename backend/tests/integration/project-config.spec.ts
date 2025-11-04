import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectConfig } from '../../src/config/ProjectConfig';
import { createConfigFactory } from '../../../tests/support/factories/config.factory';
import { configFileFixture } from '../../../tests/support/fixtures/config.fixture';
import fs from 'fs/promises';
import path from 'path';

/**
 * Story 1.1: Project Repository Structure & Configuration
 *
 * Acceptance tests for ProjectConfig class following ATDD methodology.
 * All tests are written BEFORE implementation (RED phase).
 *
 * Test Structure: Given-When-Then
 * Test Level: Integration (business logic + file I/O)
 */

describe('ProjectConfig - Story 1.1', () => {
  let tempConfigDir: string;
  let cleanupFn: () => Promise<void>;

  beforeEach(async () => {
    // Setup: Create temporary config directory for each test
    const { dirPath, cleanup } = await configFileFixture();
    tempConfigDir = dirPath;
    cleanupFn = cleanup;
  });

  afterEach(async () => {
    // Cleanup: Remove temporary files
    await cleanupFn();
  });

  describe('AC1: TypeScript Project Setup', () => {
    it('should have valid TypeScript configuration', async () => {
      // GIVEN: Project directory exists
      const projectRoot = process.cwd();

      // WHEN: Reading tsconfig.json
      const tsconfigPath = path.join(projectRoot, 'backend/tsconfig.json');
      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));

      // THEN: TypeScript is properly configured
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.target).toBe('ES2020');
      expect(tsconfig.compilerOptions.module).toBe('commonjs');
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should have valid package.json with dependencies', async () => {
      // GIVEN: Backend workspace exists
      const projectRoot = process.cwd();

      // WHEN: Reading backend package.json
      const packagePath = path.join(projectRoot, 'backend/package.json');
      const pkg = JSON.parse(await fs.readFile(packagePath, 'utf-8'));

      // THEN: Package is properly configured
      expect(pkg.name).toBe('@agent-orchestrator/backend');
      expect(pkg.dependencies).toHaveProperty('@anthropic-ai/sdk');
      expect(pkg.dependencies).toHaveProperty('openai');
      expect(pkg.dependencies).toHaveProperty('js-yaml');
      expect(pkg.devDependencies).toHaveProperty('vitest');
    });
  });

  describe('AC2: Directory Structure', () => {
    it('should create src/ directory with proper structure', async () => {
      // GIVEN: Backend workspace initialized
      const backendRoot = path.join(process.cwd(), 'backend');

      // WHEN: Checking directory structure
      const srcExists = await fs.stat(path.join(backendRoot, 'src')).then(() => true).catch(() => false);
      const configExists = await fs.stat(path.join(backendRoot, 'src/config')).then(() => true).catch(() => false);

      // THEN: Required directories exist
      expect(srcExists).toBe(true);
      expect(configExists).toBe(true);
    });

    it('should create tests/ directory with integration subdirectory', async () => {
      // GIVEN: Backend workspace initialized
      const backendRoot = path.join(process.cwd(), 'backend');

      // WHEN: Checking test directory structure
      const testsExists = await fs.stat(path.join(backendRoot, 'tests')).then(() => true).catch(() => false);
      const integrationExists = await fs.stat(path.join(backendRoot, 'tests/integration')).then(() => true).catch(() => false);

      // THEN: Test directories exist
      expect(testsExists).toBe(true);
      expect(integrationExists).toBe(true);
    });

    it('should have .bmad/ directory for configuration', async () => {
      // GIVEN: Project root initialized
      const projectRoot = process.cwd();

      // WHEN: Checking for .bmad directory
      const bmadExists = await fs.stat(path.join(projectRoot, '.bmad')).then(() => true).catch(() => false);

      // THEN: .bmad directory exists
      expect(bmadExists).toBe(true);
    });
  });

  describe('AC3: ProjectConfig Class - Load Configuration', () => {
    it('should load valid project-config.yaml successfully', async () => {
      // GIVEN: Valid configuration file exists
      const configData = createConfigFactory({
        project_name: 'Test Orchestrator',
        project_type: 'software',
        project_level: 3,
      });
      const configPath = path.join(tempConfigDir, 'project-config.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      const config = await ProjectConfig.load(configPath);

      // THEN: Configuration is loaded successfully
      expect(config.projectName).toBe('Test Orchestrator');
      expect(config.projectType).toBe('software');
      expect(config.projectLevel).toBe(3);
    });

    it('should throw error when config file does not exist', async () => {
      // GIVEN: Non-existent config path
      const invalidPath = path.join(tempConfigDir, 'nonexistent.yaml');

      // WHEN: Attempting to load config
      // THEN: Error is thrown with clear message
      await expect(ProjectConfig.load(invalidPath)).rejects.toThrow(
        /Configuration file not found/
      );
    });
  });

  describe('AC4: Support Loading Project Metadata and Agent Assignments', () => {
    it('should load project metadata fields', async () => {
      // GIVEN: Config with complete metadata
      const configData = createConfigFactory({
        project_name: 'Agent Orchestrator',
        project_type: 'software',
        project_level: 3,
        field_type: 'greenfield',
        description: 'Autonomous BMAD workflow execution',
      });
      const configPath = path.join(tempConfigDir, 'project-config.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      const config = await ProjectConfig.load(configPath);

      // THEN: All metadata fields are accessible
      expect(config.projectName).toBe('Agent Orchestrator');
      expect(config.projectType).toBe('software');
      expect(config.projectLevel).toBe(3);
      expect(config.fieldType).toBe('greenfield');
      expect(config.description).toBe('Autonomous BMAD workflow execution');
    });

    it('should load agent LLM assignments', async () => {
      // GIVEN: Config with agent assignments
      const configData = createConfigFactory({
        agent_assignments: {
          mary: 'claude-sonnet-4-5',
          winston: 'gpt-4-turbo',
          amelia: 'claude-haiku-4-0',
        },
      });
      const configPath = path.join(tempConfigDir, 'project-config.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      const config = await ProjectConfig.load(configPath);

      // THEN: Agent assignments are accessible
      expect(config.getAgentModel('mary')).toBe('claude-sonnet-4-5');
      expect(config.getAgentModel('winston')).toBe('gpt-4-turbo');
      expect(config.getAgentModel('amelia')).toBe('claude-haiku-4-0');
    });

    it('should load onboarding docs paths', async () => {
      // GIVEN: Config with onboarding paths
      const configData = createConfigFactory({
        onboarding_docs: [
          'docs/architecture.md',
          'docs/PRD.md',
          'docs/epics.md',
        ],
      });
      const configPath = path.join(tempConfigDir, 'project-config.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      const config = await ProjectConfig.load(configPath);

      // THEN: Onboarding paths are accessible
      expect(config.onboardingDocs).toEqual([
        'docs/architecture.md',
        'docs/PRD.md',
        'docs/epics.md',
      ]);
    });
  });

  describe('AC5: Configuration Schema Validation', () => {
    it('should validate required fields on load', async () => {
      // GIVEN: Config missing required field (project_name)
      const invalidConfig = `
project_type: software
project_level: 3
`;
      const configPath = path.join(tempConfigDir, 'invalid-config.yaml');
      await fs.writeFile(configPath, invalidConfig);

      // WHEN: Loading invalid configuration
      // THEN: Clear validation error is thrown
      await expect(ProjectConfig.load(configPath)).rejects.toThrow(
        /Missing required field: project_name/
      );
    });

    it('should validate project_level is within range', async () => {
      // GIVEN: Config with invalid project_level
      const configData = createConfigFactory({
        project_level: 5, // Invalid: should be 0-4
      });
      const configPath = path.join(tempConfigDir, 'invalid-level.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      // THEN: Validation error with clear message
      await expect(ProjectConfig.load(configPath)).rejects.toThrow(
        /project_level must be between 0 and 4/
      );
    });

    it('should validate project_type is valid enum', async () => {
      // GIVEN: Config with invalid project_type
      const configData = createConfigFactory({
        project_type: 'invalid-type',
      });
      const configPath = path.join(tempConfigDir, 'invalid-type.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      // THEN: Validation error with allowed values
      await expect(ProjectConfig.load(configPath)).rejects.toThrow(
        /project_type must be one of: software, game, narrative, product/
      );
    });

    it('should validate agent model names', async () => {
      // GIVEN: Config with invalid model name
      const configData = createConfigFactory({
        agent_assignments: {
          mary: 'invalid-model-123',
        },
      });
      const configPath = path.join(tempConfigDir, 'invalid-model.yaml');
      await fs.writeFile(configPath, configData);

      // WHEN: Loading configuration
      // THEN: Model validation error
      await expect(ProjectConfig.load(configPath)).rejects.toThrow(
        /Invalid model name: invalid-model-123/
      );
    });
  });

  describe('AC6: Example Configuration with Documentation', () => {
    it('should provide example project-config.yaml file', async () => {
      // GIVEN: Project repository
      const examplePath = path.join(process.cwd(), '.bmad/project-config.example.yaml');

      // WHEN: Checking for example file
      const exampleExists = await fs.stat(examplePath).then(() => true).catch(() => false);

      // THEN: Example file exists
      expect(exampleExists).toBe(true);
    });

    it('should have inline documentation in example config', async () => {
      // GIVEN: Example configuration file
      const examplePath = path.join(process.cwd(), '.bmad/project-config.example.yaml');
      const content = await fs.readFile(examplePath, 'utf-8');

      // WHEN: Parsing example content
      // THEN: Contains inline documentation comments
      expect(content).toContain('# Project Configuration');
      expect(content).toContain('# Agent LLM assignments');
      expect(content).toContain('# Onboarding documentation paths');
    });
  });
});
