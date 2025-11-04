/**
 * Data factory for project configuration test data
 * 
 * Following ATDD best practices:
 * - Uses faker for random data (when available)
 * - Supports override pattern for specific scenarios
 * - Generates complete valid objects
 * 
 * @see bmad/bmm/testarch/knowledge/data-factories.md
 */

export interface ConfigFactoryOptions {
  project_name?: string;
  project_type?: 'software' | 'game' | 'narrative' | 'product';
  project_level?: number;
  field_type?: 'greenfield' | 'brownfield';
  description?: string;
  agent_assignments?: Record<string, string>;
  onboarding_docs?: string[];
}

/**
 * Creates valid YAML configuration string for testing
 * 
 * @param overrides - Partial configuration to override defaults
 * @returns YAML string ready to write to file
 */
export function createConfigFactory(overrides: ConfigFactoryOptions = {}): string {
  const defaults = {
    project_name: 'Test Project',
    project_type: 'software',
    project_level: 3,
    field_type: 'greenfield',
    description: 'Test project description',
    agent_assignments: {
      mary: 'claude-sonnet-4-5',
      winston: 'claude-sonnet-4-5',
      amelia: 'claude-haiku-4-0',
    },
    onboarding_docs: [
      'docs/architecture.md',
      'docs/PRD.md',
    ],
  };

  const config = { ...defaults, ...overrides };

  // Generate YAML string
  return `# Generated test configuration
project_name: "${config.project_name}"
project_type: ${config.project_type}
project_level: ${config.project_level}
field_type: ${config.field_type}
description: "${config.description}"

# Agent LLM assignments
agent_assignments:
${Object.entries(config.agent_assignments)
  .map(([agent, model]) => `  ${agent}: "${model}"`)
  .join('\n')}

# Onboarding documentation paths
onboarding_docs:
${config.onboarding_docs.map((doc) => `  - "${doc}"`).join('\n')}
`;
}

/**
 * Creates minimal valid configuration (only required fields)
 */
export function createMinimalConfigFactory(): string {
  return `project_name: "Minimal Project"
project_type: software
project_level: 0
`;
}

/**
 * Creates invalid configuration for error testing
 */
export function createInvalidConfigFactory(invalidField: string): string {
  switch (invalidField) {
    case 'missing_name':
      return `project_type: software
project_level: 3
`;
    case 'invalid_level':
      return `project_name: "Invalid Level"
project_type: software
project_level: 10
`;
    case 'invalid_type':
      return `project_name: "Invalid Type"
project_type: invalid_type
project_level: 3
`;
    default:
      throw new Error(`Unknown invalid field: ${invalidField}`);
  }
}
