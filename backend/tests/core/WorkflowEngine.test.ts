/**
 * WorkflowEngine Tests
 * Comprehensive test suite for workflow execution engine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkflowEngine } from '../../src/core/WorkflowEngine.js';
import { WorkflowParser } from '../../src/core/WorkflowParser.js';
import { StateManager } from '../../src/core/StateManager.js';
import { WorkflowExecutionError } from '../../src/types/workflow.types.js';

describe('WorkflowEngine', () => {
  const testDir = path.join(__dirname, '__test_data__', 'workflow-engine');
  const projectRoot = path.join(testDir, 'test-project');
  const bmadDir = path.join(projectRoot, 'bmad');

  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(projectRoot, { recursive: true });
    await fs.mkdir(bmadDir, { recursive: true });
    await fs.mkdir(path.join(bmadDir, 'test-project'), { recursive: true });

    // Create a minimal config file
    const configContent = `
project:
  metadata:
    owner: test-user
    name: Test Project
`;
    await fs.writeFile(path.join(bmadDir, 'config.yaml'), configContent);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Variable Substitution', () => {
    it('should replace simple variables', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      // Create workflow file
      const workflowContent = `
name: Variable Test
description: Test variable substitution
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  test_var: test_value
  nested:
    key: nested_value
`;
      await fs.writeFile(workflowPath, workflowContent);

      // Create simple instructions file
      const instructionsContent = `
<step n="1" goal="Test variables">
  <action>Variable value is {{test_var}}</action>
  <action>Nested value is {{nested.key}}</action>
  <action>Default value is {{missing_var|default}}</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      // Execute workflow (should not throw)
      await expect(engine.execute()).resolves.not.toThrow();
    });

    it('should throw error for undefined variables without default', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Undefined Variable Test
description: Test undefined variable error
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Test undefined variable">
  <action>This should fail: {{undefined_variable}}</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).rejects.toThrow(WorkflowExecutionError);
    });
  });

  describe('Conditional Logic', () => {
    it('should evaluate simple comparisons', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Conditional Test
description: Test conditional logic
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  count: 5
  status: active
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Test conditionals">
  <check if="count > 3">
    <action>Count is greater than 3</action>
  </check>
  <check if="status == active">
    <action>Status is active</action>
  </check>
  <action if="count == 5">Count is exactly 5</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).resolves.not.toThrow();
    });

    it('should handle logical operators (AND, OR, NOT)', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Logical Operators Test
description: Test AND, OR, NOT
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  enabled: true
  count: 5
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Test logical operators">
  <check if="enabled is true AND count > 3">
    <action>Both conditions are true</action>
  </check>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).resolves.not.toThrow();
    });
  });

  describe('Step Execution', () => {
    it('should execute steps sequentially', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Sequential Test
description: Test sequential execution
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="First step">
  <action>Execute first step</action>
</step>
<step n="2" goal="Second step">
  <action>Execute second step</action>
</step>
<step n="3" goal="Third step">
  <action>Execute third step</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).resolves.not.toThrow();
    });

    it('should skip optional steps in YOLO mode', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: YOLO Mode Test
description: Test YOLO mode
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Required step">
  <action>This should execute</action>
</step>
<step n="2" goal="Optional step" optional="true">
  <action>This should be skipped in YOLO mode</action>
</step>
<step n="3" goal="Another required step">
  <action>This should also execute</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, {
        projectRoot,
        yoloMode: true
      });

      await expect(engine.execute()).resolves.not.toThrow();
    });

    it('should skip steps based on conditions', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Conditional Steps Test
description: Test conditional step execution
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
variables:
  skip_step: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Always execute">
  <action>This should execute</action>
</step>
<step n="2" goal="Conditional step" if="skip_step is false">
  <action>This should be skipped</action>
</step>
<step n="3" goal="Always execute">
  <action>This should also execute</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).resolves.not.toThrow();
    });
  });

  describe('Action Types', () => {
    it('should handle different action types', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Action Types Test
description: Test different action types
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Test actions">
  <action>Regular action</action>
  <output>Output message</output>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).resolves.not.toThrow();
    });

    it('should skip prompts in YOLO mode', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Prompt Skip Test
description: Test prompt skipping in YOLO mode
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="Test prompts">
  <ask>This prompt should be skipped</ask>
  <elicit-required>This elicitation should be skipped</elicit-required>
  <template-output file="output.md">This should be auto-approved</template-output>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, {
        projectRoot,
        yoloMode: true
      });

      await expect(engine.execute()).resolves.not.toThrow();
    });
  });

  describe('State Persistence', () => {
    it('should save state after each step', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: State Persistence Test
description: Test state saving
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="First step">
  <action>Step 1</action>
</step>
<step n="2" goal="Second step">
  <action>Step 2</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await engine.execute();

      // Verify state file was created
      const stateFile = path.join(bmadDir, 'test-project', 'sprint-status.yaml');
      const stateExists = await fs.access(stateFile).then(() => true).catch(() => false);
      expect(stateExists).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for malformed step numbers', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Malformed Steps Test
description: Test error handling
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="First step">
  <action>Step 1</action>
</step>
<step n="3" goal="Skipped step 2">
  <action>This should fail validation</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).rejects.toThrow(WorkflowExecutionError);
    });

    it('should handle missing instructions file', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'missing-instructions.md');

      const workflowContent = `
name: Missing Instructions Test
description: Test missing file handling
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const engine = new WorkflowEngine(workflowPath, { projectRoot });

      await expect(engine.execute()).rejects.toThrow();
    });
  });

  describe('Crash Recovery', () => {
    it('should resume from saved state', async () => {
      const workflowPath = path.join(projectRoot, 'workflow.yaml');
      const instructionsPath = path.join(projectRoot, 'instructions.md');

      const workflowContent = `
name: Recovery Test
description: Test crash recovery
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${instructionsPath}
standalone: true
`;
      await fs.writeFile(workflowPath, workflowContent);

      const instructionsContent = `
<step n="1" goal="First step">
  <action>Step 1</action>
</step>
<step n="2" goal="Second step">
  <action>Step 2</action>
</step>
<step n="3" goal="Third step">
  <action>Step 3</action>
</step>
`;
      await fs.writeFile(instructionsPath, instructionsContent);

      // Execute first workflow to create state
      const engine1 = new WorkflowEngine(workflowPath, { projectRoot });
      await engine1.execute();

      // Load state
      const stateManager = new StateManager(projectRoot);
      const state = await stateManager.loadState('test-project');

      expect(state).not.toBeNull();

      if (state) {
        // Resume from state
        const engine2 = new WorkflowEngine(workflowPath, { projectRoot });
        await expect(engine2.resumeFromState(state)).resolves.not.toThrow();
      }
    });
  });

  describe('Nested Workflows', () => {
    it('should invoke nested workflows', async () => {
      const mainWorkflowPath = path.join(projectRoot, 'main-workflow.yaml');
      const nestedWorkflowPath = path.join(projectRoot, 'nested-workflow.yaml');
      const mainInstructionsPath = path.join(projectRoot, 'main-instructions.md');
      const nestedInstructionsPath = path.join(projectRoot, 'nested-instructions.md');

      // Create nested workflow
      const nestedWorkflowContent = `
name: Nested Workflow
description: Nested workflow
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${nestedInstructionsPath}
standalone: true
`;
      await fs.writeFile(nestedWorkflowPath, nestedWorkflowContent);

      const nestedInstructionsContent = `
<step n="1" goal="Nested step">
  <action>Executing nested workflow</action>
</step>
`;
      await fs.writeFile(nestedInstructionsPath, nestedInstructionsContent);

      // Create main workflow
      const mainWorkflowContent = `
name: Main Workflow
description: Main workflow with nested invocation
author: test
config_source: ${path.join(bmadDir, 'config.yaml')}
output_folder: ${projectRoot}/output
user_name: Test User
communication_language: English
date: date:system-generated
installed_path: ${projectRoot}
instructions: ${mainInstructionsPath}
standalone: true
`;
      await fs.writeFile(mainWorkflowPath, mainWorkflowContent);

      const mainInstructionsContent = `
<step n="1" goal="Main step">
  <action>Before nested workflow</action>
  <invoke-workflow path="${nestedWorkflowPath}" />
  <action>After nested workflow</action>
</step>
`;
      await fs.writeFile(mainInstructionsPath, mainInstructionsContent);

      const engine = new WorkflowEngine(mainWorkflowPath, { projectRoot });

      await expect(engine.execute()).resolves.not.toThrow();
    });
  });
});
