/**
 * WorkflowEngine Integration Tests
 * End-to-end workflow execution scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowEngine } from '../../src/core/WorkflowEngine.js';
import { StateManager } from '../../src/core/StateManager.js';

describe('WorkflowEngine Integration Tests', () => {
  const testDir = path.join(__dirname, '__test_data__', 'integration');
  const projectRoot = path.join(testDir, 'test-project');
  const bmadDir = path.join(projectRoot, 'bmad');

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(projectRoot, { recursive: true });
    await fs.mkdir(bmadDir, { recursive: true });
    await fs.mkdir(path.join(bmadDir, 'test-project'), { recursive: true });

    // Create config file
    const configContent = `
project:
  metadata:
    owner: integration-test
    name: Integration Test Project
`;
    await fs.writeFile(path.join(bmadDir, 'config.yaml'), configContent);

    // Create project-config.yaml for WorkflowEngine
    const projectConfigContent = `
project:
  name: Integration Test Project
  description: End-to-end workflow integration tests
  repository: https://github.com/test/integration-project

onboarding:
  tech_stack: []
  coding_standards: ${projectRoot}/docs/coding-standards.md
  architecture_patterns: ${projectRoot}/docs/architecture.md

agent_assignments:
  test-agent:
    model: claude-haiku
    provider: anthropic
    reasoning: Test agent

cost_management:
  max_monthly_budget: 1000
  alert_threshold: 0.8
  fallback_model: claude-haiku
  budget:
    daily: 100
    weekly: 500
    monthly: 1000
    alerts:
      - threshold: 0.75
        action: warn
        notification: console
`;
    await fs.mkdir(path.join(projectRoot, '.bmad'), { recursive: true });
    await fs.writeFile(path.join(projectRoot, '.bmad/project-config.yaml'), projectConfigContent);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should execute a complete workflow end-to-end', async () => {
    const workflowPath = path.join(projectRoot, 'workflow.yaml');
    const instructionsPath = path.join(projectRoot, 'instructions.md');

    // Create a realistic workflow
    const workflowContent = `
name: Complete Workflow Test
description: End-to-end workflow execution
author: integration-test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Integration Tester
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  project_name: Test Project
  version: 1.0.0
  enable_feature: true
`;
    await fs.writeFile(workflowPath, workflowContent);

    // Create comprehensive instructions
    const instructionsContent = `
<step n="1" goal="Initialize project">
  <action>Create project structure for {{project_name}}</action>
  <action>Set version to {{version}}</action>
  <output>Project initialized successfully</output>
</step>

<step n="2" goal="Configure features">
  <check if="enable_feature is true">
    <action>Enable advanced features</action>
  </check>
  <action>Configuration complete</action>
</step>

<step n="3" goal="Optional cleanup" optional="true">
  <action>Clean up temporary files</action>
</step>

<step n="4" goal="Finalize">
  <action>Finalize project setup</action>
  <output>Workflow completed for {{project_name}} v{{version}}</output>
</step>
`;
    await fs.writeFile(instructionsPath, instructionsContent);

    // Execute workflow
    const engine = new WorkflowEngine(workflowPath, { projectRoot });
    await engine.execute();

    // Verify state was saved
    const stateManager = new StateManager(projectRoot);
    const state = await stateManager.loadState('test-project');

    expect(state).not.toBeNull();
    expect(state?.status).toBe('completed');
    expect(state?.currentStep).toBe(4);
    expect(state?.variables.project_name).toBe('Test Project');
    expect(state?.variables.version).toBe('1.0.0');
  });

  it('should handle crash recovery scenario', async () => {
    const workflowPath = path.join(projectRoot, 'workflow.yaml');
    const instructionsPath = path.join(projectRoot, 'instructions.md');

    const workflowContent = `
name: Recovery Workflow
description: Test crash and recovery
author: integration-test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Integration Tester
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  counter: 0
`;
    await fs.writeFile(workflowPath, workflowContent);

    const instructionsContent = `
<step n="1" goal="Step 1">
  <action>Execute step 1</action>
</step>

<step n="2" goal="Step 2">
  <action>Execute step 2</action>
</step>

<step n="3" goal="Step 3">
  <action>Execute step 3</action>
</step>

<step n="4" goal="Step 4">
  <action>Execute step 4</action>
</step>
`;
    await fs.writeFile(instructionsPath, instructionsContent);

    // Execute first workflow (simulate crash after step 2)
    const engine1 = new WorkflowEngine(workflowPath, { projectRoot });
    await engine1.execute();

    // Load saved state
    const stateManager = new StateManager(projectRoot);
    const state = await stateManager.loadState('test-project');

    expect(state).not.toBeNull();

    // Modify state to simulate crash after step 2
    if (state) {
      state.currentStep = 2;
      state.status = 'paused';
      await stateManager.saveState(state);

      // Resume from crashed state - pass same StateManager to avoid cache issues
      const engine2 = new WorkflowEngine(workflowPath, {
        projectRoot,
        stateManager
      });
      await engine2.resumeFromState(state);

      // Clear cache and reload to get fresh state from disk
      stateManager.clearCache();
      const finalState = await stateManager.loadState('test-project');
      expect(finalState?.status).toBe('completed');
      expect(finalState?.currentStep).toBe(4);
    }
  });

  it('should execute workflow with all features in YOLO mode', async () => {
    const workflowPath = path.join(projectRoot, 'workflow.yaml');
    const instructionsPath = path.join(projectRoot, 'instructions.md');

    const workflowContent = `
name: YOLO Mode Workflow
description: Test YOLO mode execution
author: integration-test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Integration Tester
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  auto_mode: true
`;
    await fs.writeFile(workflowPath, workflowContent);

    const instructionsContent = `
<step n="1" goal="Required step">
  <action>This should execute</action>
</step>

<step n="2" goal="Interactive step" optional="true">
  <ask>This prompt should be skipped</ask>
  <elicit-required>This should be skipped</elicit-required>
</step>

<step n="3" goal="Template step">
  <template-output file="output.md">This should be auto-approved</template-output>
</step>

<step n="4" goal="Final step">
  <action>Workflow complete in YOLO mode</action>
</step>
`;
    await fs.writeFile(instructionsPath, instructionsContent);

    // Execute in YOLO mode
    const engine = new WorkflowEngine(workflowPath, {
      projectRoot,
      yoloMode: true
    });
    await engine.execute();

    // Verify completion
    const stateManager = new StateManager(projectRoot);
    const state = await stateManager.loadState('test-project');

    expect(state?.status).toBe('completed');
  });

  it('should execute workflow with conditional branching', async () => {
    const workflowPath = path.join(projectRoot, 'workflow.yaml');
    const instructionsPath = path.join(projectRoot, 'instructions.md');

    const workflowContent = `
name: Conditional Workflow
description: Test conditional execution
author: integration-test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Integration Tester
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  environment: production
  debug_enabled: false
  version: 2
`;
    await fs.writeFile(workflowPath, workflowContent);

    const instructionsContent = `
<step n="1" goal="Environment setup">
  <check if="environment == production">
    <action>Configure production settings</action>
  </check>
  <check if="debug_enabled is true">
    <action>Enable debug logging</action>
  </check>
</step>

<step n="2" goal="Version check">
  <check if="version > 1">
    <action>Use new API version</action>
  </check>
  <check if="version <= 1">
    <action>Use legacy API version</action>
  </check>
</step>

<step n="3" goal="Debug step" if="debug_enabled is true">
  <action>This should be skipped</action>
</step>

<step n="4" goal="Production step" if="environment == production">
  <action>This should execute</action>
</step>
`;
    await fs.writeFile(instructionsPath, instructionsContent);

    const engine = new WorkflowEngine(workflowPath, { projectRoot });
    await engine.execute();

    const stateManager = new StateManager(projectRoot);
    const state = await stateManager.loadState('test-project');

    expect(state?.status).toBe('completed');
  });
});
