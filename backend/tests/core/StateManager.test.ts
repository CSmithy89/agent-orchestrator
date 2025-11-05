/**
 * StateManager Unit Tests
 * Tests state persistence, loading, atomic writes, and crash recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StateManager } from '../../src/core/StateManager.js';
import {
  WorkflowState,
  StateManagerError,
  AgentActivity
} from '../../src/types/workflow.types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

const TEST_DIR = path.join(process.cwd(), 'test-state-manager');
const BMAD_DIR = path.join(TEST_DIR, 'bmad');

describe('StateManager', () => {
  let stateManager: StateManager;
  let mockState: WorkflowState;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }

    // Create fresh test directory
    await fs.mkdir(TEST_DIR, { recursive: true });

    // Initialize StateManager with test directory
    stateManager = new StateManager(TEST_DIR);

    // Create mock state
    mockState = {
      project: {
        id: 'test-project',
        name: 'Test Project',
        level: 3
      },
      currentWorkflow: 'bmad/bmm/workflows/prd/workflow.yaml',
      currentStep: 2,
      status: 'running',
      variables: {
        user_name: 'Test User',
        output_folder: 'docs'
      },
      agentActivity: [
        {
          agentId: 'mary-001',
          agentName: 'Mary',
          action: 'PRD creation',
          timestamp: new Date('2025-11-05T10:00:00Z'),
          status: 'completed',
          duration: 5000
        }
      ],
      startTime: new Date('2025-11-05T09:00:00Z'),
      lastUpdate: new Date('2025-11-05T10:05:00Z')
    };
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('saveState()', () => {
    it('should write YAML state file', async () => {
      await stateManager.saveState(mockState);

      const yamlPath = path.join(BMAD_DIR, 'test-project', 'sprint-status.yaml');
      const exists = await fs.access(yamlPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(yamlPath, 'utf-8');
      const parsed = yaml.load(content) as any;

      expect(parsed.project.id).toBe('test-project');
      expect(parsed.currentWorkflow).toBe('bmad/bmm/workflows/prd/workflow.yaml');
      expect(parsed.currentStep).toBe(2);
      expect(parsed.status).toBe('running');
    });

    it('should write Markdown state file', async () => {
      await stateManager.saveState(mockState);

      const mdPath = path.join(BMAD_DIR, 'test-project', 'workflow-status.md');
      const exists = await fs.access(mdPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(mdPath, 'utf-8');

      expect(content).toContain('# Test Project - Workflow Status');
      expect(content).toContain('**Project:** Test Project (Level 3)');
      expect(content).toContain('**Status:** Running');
      expect(content).toContain('## Current Workflow');
      expect(content).toContain('## Agent Activity');
      expect(content).toContain('## Variables');
    });

    it('should write both files with matching data', async () => {
      await stateManager.saveState(mockState);

      const yamlPath = path.join(BMAD_DIR, 'test-project', 'sprint-status.yaml');
      const yamlContent = await fs.readFile(yamlPath, 'utf-8');
      const parsedYaml = yaml.load(yamlContent) as any;

      const mdPath = path.join(BMAD_DIR, 'test-project', 'workflow-status.md');
      const mdContent = await fs.readFile(mdPath, 'utf-8');

      // Verify data consistency
      expect(mdContent).toContain(parsedYaml.project.name);
      expect(mdContent).toContain(`Level ${parsedYaml.project.level}`);
      expect(mdContent).toContain(parsedYaml.currentWorkflow);
    });

    it('should validate state before saving', async () => {
      const invalidState = {
        ...mockState,
        project: { id: '', name: '', level: 3 }
      };

      await expect(stateManager.saveState(invalidState)).rejects.toThrow(StateManagerError);
    });

    it('should reject invalid status', async () => {
      const invalidState = {
        ...mockState,
        status: 'invalid-status' as any
      };

      await expect(stateManager.saveState(invalidState)).rejects.toThrow(StateManagerError);
      await expect(stateManager.saveState(invalidState)).rejects.toThrow(/status must be one of/);
    });

    it('should reject negative step number', async () => {
      const invalidState = {
        ...mockState,
        currentStep: -1
      };

      await expect(stateManager.saveState(invalidState)).rejects.toThrow(StateManagerError);
      await expect(stateManager.saveState(invalidState)).rejects.toThrow(/currentStep must be a non-negative number/);
    });

    it('should update cache after save', async () => {
      await stateManager.saveState(mockState);

      // Load from cache (should not read file)
      const loaded = await stateManager.loadState('test-project');

      expect(loaded).not.toBeNull();
      expect(loaded?.project.id).toBe('test-project');
      expect(loaded?.currentStep).toBe(2);
    });

    it('should create bmad directory if it does not exist', async () => {
      // Verify bmad directory doesn't exist
      const bmadExists = await fs.access(BMAD_DIR).then(() => true).catch(() => false);
      expect(bmadExists).toBe(false);

      // Save state should create it
      await stateManager.saveState(mockState);

      // Verify directory was created
      const bmadExistsAfter = await fs.access(BMAD_DIR).then(() => true).catch(() => false);
      expect(bmadExistsAfter).toBe(true);
    });
  });

  describe('loadState()', () => {
    it('should load saved state correctly', async () => {
      await stateManager.saveState(mockState);

      // Clear cache to force file read
      stateManager.clearCache();

      const loaded = await stateManager.loadState('test-project');

      expect(loaded).not.toBeNull();
      expect(loaded?.project.id).toBe('test-project');
      expect(loaded?.project.name).toBe('Test Project');
      expect(loaded?.currentWorkflow).toBe('bmad/bmm/workflows/prd/workflow.yaml');
      expect(loaded?.currentStep).toBe(2);
      expect(loaded?.status).toBe('running');
    });

    it('should parse dates correctly', async () => {
      await stateManager.saveState(mockState);
      stateManager.clearCache();

      const loaded = await stateManager.loadState('test-project');

      expect(loaded?.startTime).toBeInstanceOf(Date);
      expect(loaded?.lastUpdate).toBeInstanceOf(Date);
      expect(loaded?.startTime.toISOString()).toBe('2025-11-05T09:00:00.000Z');
    });

    it('should parse agent activity timestamps', async () => {
      await stateManager.saveState(mockState);
      stateManager.clearCache();

      const loaded = await stateManager.loadState('test-project');

      expect(loaded?.agentActivity).toHaveLength(1);
      expect(loaded?.agentActivity[0].timestamp).toBeInstanceOf(Date);
      expect(loaded?.agentActivity[0].agentName).toBe('Mary');
      expect(loaded?.agentActivity[0].status).toBe('completed');
    });

    it('should return null for missing file', async () => {
      const loaded = await stateManager.loadState('non-existent-project');

      expect(loaded).toBeNull();
    });

    it('should handle corrupted YAML gracefully', async () => {
      // Create corrupted YAML file in the project subdirectory
      const yamlPath = path.join(BMAD_DIR, 'test-project', 'sprint-status.yaml');
      await fs.mkdir(path.dirname(yamlPath), { recursive: true });
      await fs.writeFile(yamlPath, 'invalid: yaml: content: [[[', 'utf-8');

      const loaded = await stateManager.loadState('test-project');

      // Should return null and log error (not throw)
      expect(loaded).toBeNull();
    });

    it('should cache loaded state', async () => {
      await stateManager.saveState(mockState);
      stateManager.clearCache();

      // First load
      const loaded1 = await stateManager.loadState('test-project');

      // Modify the file
      const yamlPath = path.join(BMAD_DIR, 'sprint-status.yaml');
      const modifiedState = { ...mockState, currentStep: 999 };
      const yamlContent = yaml.dump({
        ...modifiedState,
        startTime: modifiedState.startTime.toISOString(),
        lastUpdate: modifiedState.lastUpdate.toISOString(),
        agentActivity: modifiedState.agentActivity.map(a => ({
          ...a,
          timestamp: a.timestamp.toISOString()
        }))
      });
      await fs.writeFile(yamlPath, yamlContent, 'utf-8');

      // Second load (should use cache, not see modification)
      const loaded2 = await stateManager.loadState('test-project');

      expect(loaded2?.currentStep).toBe(2); // Original value from cache
      expect(loaded2?.currentStep).not.toBe(999);
    });
  });

  describe('atomicWrite()', () => {
    it('should write file atomically', async () => {
      await stateManager.saveState(mockState);

      const yamlPath = path.join(BMAD_DIR, 'test-project', 'sprint-status.yaml');
      const content = await fs.readFile(yamlPath, 'utf-8');

      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should not leave temp files after successful write', async () => {
      await stateManager.saveState(mockState);

      const yamlTempPath = path.join(BMAD_DIR, 'test-project', 'sprint-status.yaml.tmp');
      const mdTempPath = path.join(BMAD_DIR, 'test-project', 'workflow-status.md.tmp');

      const yamlTempExists = await fs.access(yamlTempPath).then(() => true).catch(() => false);
      const mdTempExists = await fs.access(mdTempPath).then(() => true).catch(() => false);

      expect(yamlTempExists).toBe(false);
      expect(mdTempExists).toBe(false);
    });
  });

  describe('getProjectPhase()', () => {
    it('should return Analysis phase for product-brief workflow', async () => {
      const state = {
        ...mockState,
        currentWorkflow: 'bmad/bmm/workflows/product-brief/workflow.yaml'
      };

      await stateManager.saveState(state);

      const phase = await stateManager.getProjectPhase('test-project');

      expect(phase).toContain('Analysis');
    });

    it('should return Planning phase for PRD workflow', async () => {
      const state = {
        ...mockState,
        currentWorkflow: 'bmad/bmm/workflows/prd/workflow.yaml'
      };

      await stateManager.saveState(state);

      const phase = await stateManager.getProjectPhase('test-project');

      expect(phase).toContain('Planning');
    });

    it('should return Solutioning phase for architecture workflow', async () => {
      const state = {
        ...mockState,
        currentWorkflow: 'bmad/bmm/workflows/architecture/workflow.yaml'
      };

      await stateManager.saveState(state);

      const phase = await stateManager.getProjectPhase('test-project');

      expect(phase).toContain('Solutioning');
    });

    it('should return Implementation phase for dev-story workflow', async () => {
      const state = {
        ...mockState,
        currentWorkflow: 'bmad/bmm/workflows/dev-story/workflow.yaml'
      };

      await stateManager.saveState(state);

      const phase = await stateManager.getProjectPhase('test-project');

      expect(phase).toContain('Implementation');
    });

    it('should return Unknown for missing project', async () => {
      const phase = await stateManager.getProjectPhase('non-existent-project');

      expect(phase).toBe('Unknown');
    });
  });

  describe('getStoryStatus()', () => {
    it('should return story status from variables', async () => {
      const state = {
        ...mockState,
        variables: {
          ...mockState.variables,
          story_1_5: {
            title: 'State Manager',
            status: 'in-progress',
            assignedAgent: 'amelia',
            progressPercent: 60
          }
        }
      };

      await stateManager.saveState(state);

      const storyStatus = await stateManager.getStoryStatus('test-project', '1.5');

      expect(storyStatus).not.toBeNull();
      expect(storyStatus?.storyId).toBe('1.5');
      expect(storyStatus?.title).toBe('State Manager');
      expect(storyStatus?.status).toBe('in-progress');
      expect(storyStatus?.assignedAgent).toBe('amelia');
      expect(storyStatus?.progressPercent).toBe(60);
    });

    it('should return null for missing story', async () => {
      await stateManager.saveState(mockState);

      const storyStatus = await stateManager.getStoryStatus('test-project', '99.99');

      expect(storyStatus).toBeNull();
    });

    it('should return null for missing project', async () => {
      const storyStatus = await stateManager.getStoryStatus('non-existent', '1.5');

      expect(storyStatus).toBeNull();
    });
  });

  describe('clearCache()', () => {
    it('should clear the state cache', async () => {
      await stateManager.saveState(mockState);

      // Verify cache is populated
      const loaded1 = await stateManager.loadState('test-project');
      expect(loaded1).not.toBeNull();

      // Modify file
      const yamlPath = path.join(BMAD_DIR, 'test-project', 'sprint-status.yaml');
      const modifiedState = { ...mockState, currentStep: 999 };
      const yamlContent = yaml.dump({
        ...modifiedState,
        startTime: modifiedState.startTime.toISOString(),
        lastUpdate: modifiedState.lastUpdate.toISOString(),
        agentActivity: modifiedState.agentActivity.map(a => ({
          ...a,
          timestamp: a.timestamp.toISOString()
        }))
      });
      await fs.writeFile(yamlPath, yamlContent, 'utf-8');

      // Clear cache
      stateManager.clearCache();

      // Load again (should read from file, not cache)
      const loaded2 = await stateManager.loadState('test-project');
      expect(loaded2?.currentStep).toBe(999);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty agent activity array', async () => {
      const state = {
        ...mockState,
        agentActivity: []
      };

      await stateManager.saveState(state);

      const loaded = await stateManager.loadState('test-project');
      expect(loaded?.agentActivity).toEqual([]);
    });

    it('should handle empty variables object', async () => {
      const state = {
        ...mockState,
        variables: {}
      };

      await stateManager.saveState(state);

      const loaded = await stateManager.loadState('test-project');
      expect(loaded?.variables).toEqual({});
    });

    it('should handle complex nested variables', async () => {
      const state = {
        ...mockState,
        variables: {
          nested: {
            level1: {
              level2: {
                value: 'deep'
              }
            }
          },
          array: [1, 2, 3],
          mixed: {
            string: 'test',
            number: 42,
            boolean: true
          }
        }
      };

      await stateManager.saveState(state);
      stateManager.clearCache();

      const loaded = await stateManager.loadState('test-project');
      expect(loaded?.variables.nested.level1.level2.value).toBe('deep');
      expect(loaded?.variables.array).toEqual([1, 2, 3]);
      expect(loaded?.variables.mixed.number).toBe(42);
    });

    it('should handle very long workflow paths', async () => {
      const state = {
        ...mockState,
        currentWorkflow: 'bmad/bmm/workflows/very/deeply/nested/path/to/some/workflow/file/workflow.yaml'
      };

      await stateManager.saveState(state);
      stateManager.clearCache();

      const loaded = await stateManager.loadState('test-project');
      expect(loaded?.currentWorkflow).toBe(state.currentWorkflow);
    });

    it('should handle multiple agent activities', async () => {
      const activities: AgentActivity[] = [];
      for (let i = 0; i < 20; i++) {
        activities.push({
          agentId: `agent-${i}`,
          agentName: `Agent ${i}`,
          action: `Action ${i}`,
          timestamp: new Date(Date.now() + i * 1000),
          status: i % 2 === 0 ? 'completed' : 'failed',
          duration: 1000 * i
        });
      }

      const state = {
        ...mockState,
        agentActivity: activities
      };

      await stateManager.saveState(state);
      stateManager.clearCache();

      const loaded = await stateManager.loadState('test-project');
      expect(loaded?.agentActivity).toHaveLength(20);
      expect(loaded?.agentActivity[10].agentName).toBe('Agent 10');
    });
  });

  describe('Multi-Project Support', () => {
    it('should not overwrite state files for different projects', async () => {
      // Create state for project A
      const stateA = {
        ...mockState,
        project: {
          id: 'project-a',
          name: 'Project A',
          level: 3
        },
        currentStep: 1
      };

      // Create state for project B
      const stateB = {
        ...mockState,
        project: {
          id: 'project-b',
          name: 'Project B',
          level: 2
        },
        currentStep: 5
      };

      // Save both states
      await stateManager.saveState(stateA);
      await stateManager.saveState(stateB);

      // Clear cache to force file reads
      stateManager.clearCache();

      // Load both states
      const loadedA = await stateManager.loadState('project-a');
      const loadedB = await stateManager.loadState('project-b');

      // Verify project A state is intact
      expect(loadedA).not.toBeNull();
      expect(loadedA?.project.id).toBe('project-a');
      expect(loadedA?.project.name).toBe('Project A');
      expect(loadedA?.currentStep).toBe(1);

      // Verify project B state is intact
      expect(loadedB).not.toBeNull();
      expect(loadedB?.project.id).toBe('project-b');
      expect(loadedB?.project.name).toBe('Project B');
      expect(loadedB?.currentStep).toBe(5);
    });

    it('should create separate directories for each project', async () => {
      const stateA = {
        ...mockState,
        project: {
          id: 'project-x',
          name: 'Project X',
          level: 3
        }
      };

      const stateB = {
        ...mockState,
        project: {
          id: 'project-y',
          name: 'Project Y',
          level: 2
        }
      };

      await stateManager.saveState(stateA);
      await stateManager.saveState(stateB);

      // Verify both project directories exist
      const projectXYaml = path.join(BMAD_DIR, 'project-x', 'sprint-status.yaml');
      const projectYYaml = path.join(BMAD_DIR, 'project-y', 'sprint-status.yaml');

      const projectXExists = await fs.access(projectXYaml).then(() => true).catch(() => false);
      const projectYExists = await fs.access(projectYYaml).then(() => true).catch(() => false);

      expect(projectXExists).toBe(true);
      expect(projectYExists).toBe(true);
    });

    it('should maintain separate cache entries for each project', async () => {
      const stateA = {
        ...mockState,
        project: {
          id: 'cache-test-a',
          name: 'Cache Test A',
          level: 3
        },
        currentStep: 10
      };

      const stateB = {
        ...mockState,
        project: {
          id: 'cache-test-b',
          name: 'Cache Test B',
          level: 2
        },
        currentStep: 20
      };

      // Save both states (populates cache)
      await stateManager.saveState(stateA);
      await stateManager.saveState(stateB);

      // Load from cache (should not read files)
      const cachedA = await stateManager.loadState('cache-test-a');
      const cachedB = await stateManager.loadState('cache-test-b');

      // Verify correct cached values
      expect(cachedA?.currentStep).toBe(10);
      expect(cachedB?.currentStep).toBe(20);
    });
  });
});
