import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectConfig } from '../../src/config/ProjectConfig.js';
import { ConfigValidationError } from '../../src/types/ProjectConfig.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('ProjectConfig', () => {
  const testConfigDir = path.join(process.cwd(), '.bmad-test');
  const testConfigPath = path.join(testConfigDir, 'project-config.yaml');

  const validConfig = {
    project: {
      name: 'Test Project',
      description: 'A test project',
      repository: 'https://github.com/test/test'
    },
    onboarding: {
      tech_stack: ['Node.js', 'TypeScript'],
      coding_standards: 'docs/coding-standards.md',
      architecture_patterns: 'docs/architecture.md'
    },
    agent_assignments: {
      mary: {
        model: 'claude-sonnet-4-5',
        provider: 'anthropic',
        reasoning: 'Best for business analysis'
      },
      winston: {
        model: 'gpt-4o',
        provider: 'openai',
        reasoning: 'Best for architecture'
      }
    },
    cost_management: {
      max_monthly_budget: 1000,
      alert_threshold: 0.8,
      fallback_model: 'claude-haiku'
    }
  };

  beforeEach(async () => {
    await fs.mkdir(testConfigDir, { recursive: true });
    await fs.writeFile(testConfigPath, yaml.dump(validConfig));
  });

  afterEach(async () => {
    await fs.rm(testConfigDir, { recursive: true, force: true });
  });

  it('should load valid configuration from YAML file', async () => {
    const config = await ProjectConfig.loadConfig(testConfigPath);

    expect(config).toBeInstanceOf(ProjectConfig);
    expect(config.getProjectMetadata().name).toBe('Test Project');
    expect(config.getProjectMetadata().repository).toBe('https://github.com/test/test');
  });

  it('should throw error when config file not found', async () => {
    await expect(
      ProjectConfig.loadConfig(path.join(testConfigDir, 'nonexistent.yaml'))
    ).rejects.toThrow('Configuration file not found');
  });

  it('should throw error for invalid YAML syntax', async () => {
    await fs.writeFile(testConfigPath, 'invalid: yaml: syntax:\n  - [unclosed');

    await expect(
      ProjectConfig.loadConfig(testConfigPath)
    ).rejects.toThrow();
  });

  it('should expand environment variables', async () => {
    process.env.TEST_API_KEY = 'test-key-123';

    const configWithEnv = {
      ...validConfig,
      agent_assignments: {
        mary: {
          ...validConfig.agent_assignments.mary,
          api_key: '${TEST_API_KEY}'
        }
      }
    };

    await fs.writeFile(testConfigPath, yaml.dump(configWithEnv));
    const config = await ProjectConfig.loadConfig(testConfigPath);

    expect(config.getAgentConfig('mary')?.api_key).toBe('test-key-123');

    delete process.env.TEST_API_KEY;
  });

  it('should throw error for missing required field', async () => {
    const invalidConfig = structuredClone(validConfig);
    delete invalidConfig.project.name;

    await fs.writeFile(testConfigPath, yaml.dump(invalidConfig));

    await expect(
      ProjectConfig.loadConfig(testConfigPath)
    ).rejects.toThrow(ConfigValidationError);
  });

  it('should throw error for invalid provider', async () => {
    const invalidConfig = {
      ...validConfig,
      agent_assignments: {
        mary: {
          model: 'some-model',
          provider: 'unknown',
          reasoning: 'test'
        }
      }
    };

    await fs.writeFile(testConfigPath, yaml.dump(invalidConfig));

    await expect(
      ProjectConfig.loadConfig(testConfigPath)
    ).rejects.toThrow(ConfigValidationError);
  });

  it('should return agent configuration for existing agent', async () => {
    const config = await ProjectConfig.loadConfig(testConfigPath);
    const maryConfig = config.getAgentConfig('mary');

    expect(maryConfig).toBeDefined();
    expect(maryConfig?.model).toBe('claude-sonnet-4-5');
    expect(maryConfig?.provider).toBe('anthropic');
    expect(maryConfig?.reasoning).toBe('Best for business analysis');
  });

  it('should return undefined for non-existent agent', async () => {
    const config = await ProjectConfig.loadConfig(testConfigPath);
    const result = config.getAgentConfig('nonexistent');

    expect(result).toBeUndefined();
  });

  it('should return onboarding documentation paths', async () => {
    const config = await ProjectConfig.loadConfig(testConfigPath);
    const onboarding = config.getOnboardingDocs();

    expect(onboarding.tech_stack).toEqual(['Node.js', 'TypeScript']);
    expect(onboarding.coding_standards).toBe('docs/coding-standards.md');
    expect(onboarding.architecture_patterns).toBe('docs/architecture.md');
  });

  it('should return cost management configuration', async () => {
    const config = await ProjectConfig.loadConfig(testConfigPath);
    const costConfig = config.getCostManagement();

    expect(costConfig.max_monthly_budget).toBe(1000);
    expect(costConfig.alert_threshold).toBe(0.8);
    expect(costConfig.fallback_model).toBe('claude-haiku-3-5');
  });

  it('should return project metadata', async () => {
    const config = await ProjectConfig.loadConfig(testConfigPath);
    const metadata = config.getProjectMetadata();

    expect(metadata.name).toBe('Test Project');
    expect(metadata.description).toBe('A test project');
    expect(metadata.repository).toBe('https://github.com/test/test');
  });
});
