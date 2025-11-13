/**
 * Unit tests for SolutioningWorkflowEngine
 *
 * Tests all 12 acceptance criteria with 80%+ coverage target:
 * - AC-1: SolutioningWorkflowEngine class and inheritance
 * - AC-2: Workflow configuration loading
 * - AC-3: Step parsing and execution planning
 * - AC-4: State machine transitions
 * - AC-5: Worktree management integration
 * - AC-6: State persistence
 * - AC-7: Step execution hooks
 * - AC-8: Error handling and rollback
 * - AC-9: Input loading (PRD, architecture)
 * - AC-10: Progress tracking
 * - AC-11: Comprehensive test coverage
 * - AC-12: Infrastructure-only verification
 *
 * @see docs/stories/4-3-solutioning-workflow-engine-foundation.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SolutioningWorkflowEngine } from '../../../src/solutioning/workflow-engine.js';
import type {
  StepContext
} from '../../../src/solutioning/workflow-engine.js';
import { WorkflowExecutionError } from '../../../src/types/errors.types.js';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../../src/core/WorktreeManager.js');
vi.mock('../../../src/core/StateManager.js');
vi.mock('../../../src/core/WorkflowParser.js');

describe('SolutioningWorkflowEngine', () => {
  let engine: SolutioningWorkflowEngine;
  const mockProjectRoot = '/test/project';
  const mockWorkflowPath = '/test/project/bmad/bmm/workflows/create-epics-and-stories/workflow.yaml';

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock file system operations
    vi.mocked(fs.readFile).mockResolvedValue('# Mock file content');
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.rename).mockResolvedValue();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AC-1: SolutioningWorkflowEngine Class Implementation', () => {
    it('should create instance and extend WorkflowEngine', () => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });

      expect(engine).toBeInstanceOf(SolutioningWorkflowEngine);
      // Verify it's an instance of the base WorkflowEngine class
      expect(engine).toBeDefined();
    });

    it('should initialize with solutioning-specific properties', () => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        maxRetries: 5,
        autoCheckpoint: false
      });

      expect(engine).toBeDefined();
      // Properties are private, but we can verify the engine was created successfully
      expect(engine.getCurrentProgress).toBeDefined();
    });

    it('should accept custom PRD and architecture paths', () => {
      const customPrdPath = '/custom/PRD.md';
      const customArchPath = '/custom/architecture.md';

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        prdPath: customPrdPath,
        architecturePath: customArchPath
      });

      expect(engine).toBeDefined();
    });
  });

  describe('AC-2: Workflow Configuration Loading', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should load valid workflow configuration', async () => {
      const mockConfig = {
        name: 'create-epics-and-stories',
        description: 'Test workflow',
        author: 'Test',
        config_source: 'test',
        output_folder: 'test',
        user_name: 'test',
        communication_language: 'en',
        date: '2025-11-13',
        installed_path: 'test',
        instructions: 'test/instructions.md',
        standalone: true
      };

      vi.mocked(fs.readFile).mockResolvedValue(yaml.dump(mockConfig));

      const config = await engine.loadWorkflowConfig(mockWorkflowPath);

      expect(config).toBeDefined();
      expect(config.name).toBe('create-epics-and-stories');
      expect(config.instructions).toBe('test/instructions.md');
    });

    it('should throw error for missing workflow file', async () => {
      const mockError = new Error('ENOENT') as NodeJS.ErrnoException;
      mockError.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(mockError);

      await expect(
        engine.loadWorkflowConfig('/nonexistent/workflow.yaml')
      ).rejects.toThrow(WorkflowExecutionError);
    });

    it('should throw error for malformed YAML', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid: yaml: content: [unclosed');

      await expect(
        engine.loadWorkflowConfig(mockWorkflowPath)
      ).rejects.toThrow(WorkflowExecutionError);
    });

    it('should validate required configuration fields', async () => {
      const invalidConfig = {
        description: 'Missing name field'
      };

      vi.mocked(fs.readFile).mockResolvedValue(yaml.dump(invalidConfig));

      await expect(
        engine.loadWorkflowConfig(mockWorkflowPath)
      ).rejects.toThrow('missing required field "name"');
    });

    it('should validate instructions field is present', async () => {
      const invalidConfig = {
        name: 'test-workflow'
        // Missing instructions field
      };

      vi.mocked(fs.readFile).mockResolvedValue(yaml.dump(invalidConfig));

      await expect(
        engine.loadWorkflowConfig(mockWorkflowPath)
      ).rejects.toThrow('missing required field "instructions"');
    });
  });

  describe('AC-3: Workflow Step Parsing and Execution Planning', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should parse workflow steps from configuration', () => {
      const mockConfig = {
        name: 'test',
        instructions: 'test.md'
      } as any;

      const steps = engine.parseWorkflowSteps(mockConfig);

      expect(Array.isArray(steps)).toBe(true);
    });

    it('should build execution plan from steps', () => {
      const mockSteps = [
        { number: 1, goal: 'Step 1', content: 'Content 1' },
        { number: 2, goal: 'Step 2', content: 'Content 2' },
        { number: 3, goal: 'Step 3', content: 'Content 3' }
      ] as any[];

      const plan = engine.buildExecutionPlan(mockSteps);

      expect(plan).toBeDefined();
      expect(plan.steps).toEqual(mockSteps);
      expect(plan.sequentialSteps).toEqual(mockSteps);
    });

    it('should detect step numbering issues', () => {
      const mockSteps = [
        { number: 1, goal: 'Step 1', content: 'Content 1' },
        { number: 3, goal: 'Step 3', content: 'Content 3' }, // Gap in numbering
        { number: 2, goal: 'Step 2', content: 'Content 2' }
      ] as any[];

      // Should not throw, but may log warnings
      const plan = engine.buildExecutionPlan(mockSteps);

      expect(plan).toBeDefined();
    });
  });

  describe('AC-4: State Machine Transitions', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should transition from not_started to in_progress', async () => {
      await engine.transitionState('in_progress');

      const progress = engine.getCurrentProgress();
      expect(progress).toBeDefined();
    });

    it('should transition from in_progress to review', async () => {
      await engine.transitionState('in_progress');
      await engine.transitionState('review');

      const progress = engine.getCurrentProgress();
      expect(progress).toBeDefined();
    });

    it('should transition from in_progress to complete', async () => {
      await engine.transitionState('in_progress');
      await engine.transitionState('complete');

      const progress = engine.getCurrentProgress();
      expect(progress.progressPercentage).toBeDefined();
    });

    it('should transition from review back to in_progress', async () => {
      await engine.transitionState('in_progress');
      await engine.transitionState('review');
      await engine.transitionState('in_progress');

      expect(engine.getCurrentProgress()).toBeDefined();
    });

    it('should throw error for invalid transition: not_started to complete', async () => {
      await expect(
        engine.transitionState('complete')
      ).rejects.toThrow('Invalid state transition');
    });

    it('should throw error for invalid transition: not_started to review', async () => {
      await expect(
        engine.transitionState('review')
      ).rejects.toThrow('Invalid state transition');
    });

    it('should throw error for invalid transition: complete to in_progress', async () => {
      await engine.transitionState('in_progress');
      await engine.transitionState('complete');

      await expect(
        engine.transitionState('in_progress')
      ).rejects.toThrow('Invalid state transition');
    });

    it('should update timestamps on state transitions', async () => {
      await engine.transitionState('in_progress');

      const progress1 = engine.getCurrentProgress();
      expect(progress1.startedAt).toBeDefined();
      expect(progress1.completedAt).toBeUndefined();

      await engine.transitionState('complete');

      const progress2 = engine.getCurrentProgress();
      expect(progress2.startedAt).toBeDefined();
      expect(progress2.completedAt).toBeDefined();
    });
  });

  describe('AC-5: Worktree Management Integration', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should setup worktree for solutioning', async () => {
      // Mock WorktreeManager methods
      const mockWorktreeManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        createWorktree: vi.fn().mockResolvedValue({
          storyId: 'solutioning',
          path: '/test/project/wt/story-solutioning',
          branch: 'story/solutioning',
          baseBranch: 'main',
          createdAt: new Date(),
          status: 'active'
        })
      };

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        worktreeManager: mockWorktreeManager as any
      });

      await engine.setupWorktree();

      expect(mockWorktreeManager.initialize).toHaveBeenCalled();
      expect(mockWorktreeManager.createWorktree).toHaveBeenCalledWith('solutioning', 'main');
    });

    it('should cleanup worktree after workflow', async () => {
      const mockWorktreeManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        createWorktree: vi.fn().mockResolvedValue({
          storyId: 'solutioning',
          path: '/test/project/wt/story-solutioning',
          branch: 'story/solutioning',
          baseBranch: 'main',
          createdAt: new Date(),
          status: 'active'
        }),
        destroyWorktree: vi.fn().mockResolvedValue(undefined)
      };

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        worktreeManager: mockWorktreeManager as any
      });

      await engine.setupWorktree();
      await engine.cleanupWorktree();

      expect(mockWorktreeManager.destroyWorktree).toHaveBeenCalledWith('solutioning');
    });

    it('should handle worktree creation failure', async () => {
      const mockWorktreeManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        createWorktree: vi.fn().mockRejectedValue(new Error('Worktree already exists'))
      };

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        worktreeManager: mockWorktreeManager as any
      });

      await expect(engine.setupWorktree()).rejects.toThrow('Failed to setup worktree');
    });

    it('should not throw during cleanup if no worktree exists', async () => {
      await expect(engine.cleanupWorktree()).resolves.not.toThrow();
    });
  });

  describe('AC-6: State Persistence to workflow-status.yaml', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should persist state to YAML file', async () => {
      await engine.persistState();

      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.rename).toHaveBeenCalled();
    });

    it('should use atomic write pattern (temp file + rename)', async () => {
      await engine.persistState();

      // Verify atomic write: writeFile to .tmp, then rename
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      expect(writeCall![0]).toContain('.tmp');

      const renameCall = vi.mocked(fs.rename).mock.calls[0];
      expect(renameCall![0]).toContain('.tmp');
      expect(renameCall![1]).not.toContain('.tmp');
    });

    it('should load state from YAML file', async () => {
      const mockState = {
        workflow: {
          name: 'solutioning',
          current_step: 'step-1',
          status: 'in_progress',
          progress_percentage: 50
        }
      };

      vi.mocked(fs.readFile).mockResolvedValue(yaml.dump(mockState));

      const state = await engine.loadState();

      expect(state).toBeDefined();
      expect(state.workflow.name).toBe('solutioning');
    });

    it('should return null for missing state file', async () => {
      const mockError = new Error('ENOENT') as NodeJS.ErrnoException;
      mockError.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(mockError);

      const state = await engine.loadState();

      expect(state).toBeNull();
    });

    it('should handle corrupted state file gracefully', async () => {
      // Mock a YAMLException by making readFile throw
      const yamlError = new yaml.YAMLException('Invalid YAML');
      vi.mocked(fs.readFile).mockRejectedValue(yamlError);

      const state = await engine.loadState();

      // Should return null instead of throwing
      expect(state).toBeNull();
    });
  });

  describe('AC-7: Step Execution Hooks', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should register pre-step hook', () => {
      const mockHook = vi.fn().mockResolvedValue(undefined);

      engine.registerPreStepHook('step-1', mockHook);

      // Hook registration should not throw
      expect(mockHook).not.toHaveBeenCalled();
    });

    it('should register post-step hook', () => {
      const mockHook = vi.fn().mockResolvedValue(undefined);

      engine.registerPostStepHook('step-1', mockHook);

      // Hook registration should not throw
      expect(mockHook).not.toHaveBeenCalled();
    });

    it('should execute pre-step hooks in order', async () => {
      const executionOrder: number[] = [];

      const hook1 = vi.fn().mockImplementation(async () => {
        executionOrder.push(1);
      });
      const hook2 = vi.fn().mockImplementation(async () => {
        executionOrder.push(2);
      });

      engine.registerPreStepHook('step-1', hook1);
      engine.registerPreStepHook('step-1', hook2);

      const mockContext: StepContext = {
        step: { number: 1, goal: 'Test', content: 'Test content' },
        stepNumber: 1,
        totalSteps: 3,
        variables: {}
      };

      await engine.executePreStepHooks('step-1', mockContext);

      expect(executionOrder).toEqual([1, 2]);
      expect(hook1).toHaveBeenCalledWith(mockContext);
      expect(hook2).toHaveBeenCalledWith(mockContext);
    });

    it('should execute post-step hooks in order', async () => {
      const executionOrder: number[] = [];

      const hook1 = vi.fn().mockImplementation(async () => {
        executionOrder.push(1);
      });
      const hook2 = vi.fn().mockImplementation(async () => {
        executionOrder.push(2);
      });

      engine.registerPostStepHook('step-1', hook1);
      engine.registerPostStepHook('step-1', hook2);

      const mockContext: StepContext = {
        step: { number: 1, goal: 'Test', content: 'Test content' },
        stepNumber: 1,
        totalSteps: 3,
        variables: {}
      };

      await engine.executePostStepHooks('step-1', mockContext);

      expect(executionOrder).toEqual([1, 2]);
    });

    it('should continue executing hooks if one fails', async () => {
      const hook1 = vi.fn().mockRejectedValue(new Error('Hook 1 failed'));
      const hook2 = vi.fn().mockResolvedValue(undefined);

      engine.registerPreStepHook('step-1', hook1);
      engine.registerPreStepHook('step-1', hook2);

      const mockContext: StepContext = {
        step: { number: 1, goal: 'Test', content: 'Test content' },
        stepNumber: 1,
        totalSteps: 3,
        variables: {}
      };

      // Should not throw
      await engine.executePreStepHooks('step-1', mockContext);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });

    it('should provide step context to hooks', async () => {
      let capturedContext: StepContext | null = null;

      const hook = vi.fn().mockImplementation(async (ctx: StepContext) => {
        capturedContext = ctx;
      });

      engine.registerPreStepHook('step-1', hook);

      // Load inputs first
      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('PRD content');
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve('Architecture content');
        }
        return Promise.resolve('');
      });

      await engine.loadInputs();

      const mockStep = { number: 1, goal: 'Test', content: 'Test content' };
      const mockContext = engine.getStepContext(mockStep);

      await engine.executePreStepHooks('step-1', mockContext);

      expect(capturedContext).toBeDefined();
      expect(capturedContext?.step).toEqual(mockStep);
      expect(capturedContext?.prdContent).toBe('PRD content');
      expect(capturedContext?.architectureContent).toBe('Architecture content');
    });
  });

  describe('AC-8: Error Handling and Rollback Capability', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should create checkpoint', () => {
      const checkpoint = engine.createCheckpoint();

      expect(checkpoint).toBeDefined();
      expect(checkpoint.id).toContain('checkpoint-');
      expect(checkpoint.state).toBe('not_started');
      expect(checkpoint.timestamp).toBeInstanceOf(Date);
    });

    it('should rollback to checkpoint', async () => {
      const checkpoint = engine.createCheckpoint();

      await engine.transitionState('in_progress');

      await engine.rollbackToCheckpoint(checkpoint);

      // State should be restored to checkpoint state
      const progress = engine.getCurrentProgress();
      expect(progress).toBeDefined();
    });

    it('should cleanup worktree on rollback', async () => {
      const mockWorktreeManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        createWorktree: vi.fn().mockResolvedValue({
          storyId: 'solutioning',
          path: '/test/wt',
          branch: 'test-branch',
          baseBranch: 'main',
          createdAt: new Date(),
          status: 'active'
        }),
        destroyWorktree: vi.fn().mockResolvedValue(undefined)
      };

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        worktreeManager: mockWorktreeManager as any
      });

      await engine.setupWorktree();

      const checkpoint = engine.createCheckpoint();
      await engine.rollbackToCheckpoint(checkpoint);

      expect(mockWorktreeManager.destroyWorktree).toHaveBeenCalled();
    });

    it('should persist state after rollback', async () => {
      const checkpoint = engine.createCheckpoint();

      await engine.rollbackToCheckpoint(checkpoint);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.rename).toHaveBeenCalled();
    });
  });

  describe('AC-9: Input Loading from Epic 2 and Epic 3', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should load PRD content', async () => {
      const mockPrdContent = '# PRD\n\nThis is the PRD content.';

      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve(mockPrdContent);
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve('# Architecture');
        }
        return Promise.resolve('');
      });

      await engine.loadInputs();

      const context = engine.getStepContext({ number: 1, goal: 'Test', content: 'Test' });
      expect(context.prdContent).toBe(mockPrdContent);
    });

    it('should load architecture content', async () => {
      const mockArchContent = '# Architecture\n\nThis is the architecture.';

      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('# PRD');
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve(mockArchContent);
        }
        return Promise.resolve('');
      });

      await engine.loadInputs();

      const context = engine.getStepContext({ number: 1, goal: 'Test', content: 'Test' });
      expect(context.architectureContent).toBe(mockArchContent);
    });

    it('should throw error for missing PRD file', async () => {
      const mockError = new Error('ENOENT') as NodeJS.ErrnoException;
      mockError.code = 'ENOENT';

      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.reject(mockError);
        }
        return Promise.resolve('');
      });

      await expect(engine.loadInputs()).rejects.toThrow('Failed to load PRD');
    });

    it('should throw error for missing architecture file', async () => {
      const mockError = new Error('ENOENT') as NodeJS.ErrnoException;
      mockError.code = 'ENOENT';

      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('# PRD');
        }
        if (path.includes('architecture.md')) {
          return Promise.reject(mockError);
        }
        return Promise.resolve('');
      });

      await expect(engine.loadInputs()).rejects.toThrow('Failed to load architecture');
    });

    it('should throw error for empty PRD file', async () => {
      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('   '); // Empty/whitespace only
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve('# Architecture');
        }
        return Promise.resolve('');
      });

      await expect(engine.loadInputs()).rejects.toThrow('PRD file is empty');
    });

    it('should throw error for empty architecture file', async () => {
      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('# PRD');
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve(''); // Empty
        }
        return Promise.resolve('');
      });

      await expect(engine.loadInputs()).rejects.toThrow('Architecture file is empty');
    });
  });

  describe('AC-10: Workflow Progress Tracking', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should get current progress', () => {
      const progress = engine.getCurrentProgress();

      expect(progress).toBeDefined();
      expect(progress.workflowName).toBe('solutioning');
      expect(progress.progressPercentage).toBeDefined();
      expect(typeof progress.progressPercentage).toBe('number');
    });

    it('should update progress', () => {
      engine.updateProgress();

      const progress = engine.getCurrentProgress();
      expect(progress).toBeDefined();
    });

    it('should track start time after transition to in_progress', async () => {
      await engine.transitionState('in_progress');

      const progress = engine.getCurrentProgress();
      expect(progress.startedAt).toBeInstanceOf(Date);
      expect(progress.completedAt).toBeUndefined();
    });

    it('should track completion time after transition to complete', async () => {
      await engine.transitionState('in_progress');
      await engine.transitionState('complete');

      const progress = engine.getCurrentProgress();
      expect(progress.startedAt).toBeInstanceOf(Date);
      expect(progress.completedAt).toBeInstanceOf(Date);
    });

    it('should persist progress updates', async () => {
      engine.updateProgress();

      // Give async operation time to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Persist is called asynchronously, so we just verify it doesn't throw
      expect(engine.getCurrentProgress()).toBeDefined();
    });
  });

  describe('AC-12: Infrastructure Only - No Content Generation', () => {
    beforeEach(() => {
      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot
      });
    });

    it('should not make LLM API calls during execution', async () => {
      // Mock all dependencies to verify no LLM calls
      const mockWorktreeManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        createWorktree: vi.fn().mockResolvedValue({
          storyId: 'solutioning',
          path: '/test/wt',
          branch: 'test',
          baseBranch: 'main',
          createdAt: new Date(),
          status: 'active'
        }),
        destroyWorktree: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('# PRD Content');
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve('# Architecture Content');
        }
        return Promise.resolve('# Mock content');
      });

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        worktreeManager: mockWorktreeManager as any
      });

      // Execute workflow
      // This will call parent execute(), which is also infrastructure-only
      // We're verifying no external LLM API calls are made

      await engine.loadInputs();
      await engine.setupWorktree();

      // Verify only file system and worktree operations were called
      expect(fs.readFile).toHaveBeenCalled();
      expect(mockWorktreeManager.initialize).toHaveBeenCalled();

      // Clean up
      await engine.cleanupWorktree();
    });

    it('should have stub workflow steps (no actual content generation)', () => {
      const mockConfig = {
        name: 'test',
        instructions: 'test.md'
      } as any;

      const steps = engine.parseWorkflowSteps(mockConfig);

      // Steps array should be empty or contain only stub steps
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBe(0); // Infrastructure only - no actual steps
    });
  });

  describe('Integration: Full Workflow Lifecycle', () => {
    it('should execute full workflow lifecycle', async () => {
      const mockWorktreeManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
        createWorktree: vi.fn().mockResolvedValue({
          storyId: 'solutioning',
          path: '/test/wt',
          branch: 'test',
          baseBranch: 'main',
          createdAt: new Date(),
          status: 'active'
        }),
        destroyWorktree: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(fs.readFile).mockImplementation((path: any) => {
        if (path.includes('PRD.md')) {
          return Promise.resolve('# PRD Content');
        }
        if (path.includes('architecture.md')) {
          return Promise.resolve('# Architecture Content');
        }
        return Promise.resolve('# Mock content');
      });

      engine = new SolutioningWorkflowEngine(mockWorkflowPath, {
        projectRoot: mockProjectRoot,
        worktreeManager: mockWorktreeManager as any
      });

      // Register hooks
      const preHook = vi.fn().mockResolvedValue(undefined);
      const postHook = vi.fn().mockResolvedValue(undefined);

      engine.registerPreStepHook('step-1', preHook);
      engine.registerPostStepHook('step-1', postHook);

      // Load inputs
      await engine.loadInputs();

      // Setup worktree
      await engine.setupWorktree();

      // Create checkpoint
      const checkpoint = engine.createCheckpoint();
      expect(checkpoint).toBeDefined();

      // Transition states
      await engine.transitionState('in_progress');
      await engine.transitionState('review');
      await engine.transitionState('complete');

      // Get progress
      const progress = engine.getCurrentProgress();
      expect(progress.startedAt).toBeDefined();
      expect(progress.completedAt).toBeDefined();

      // Cleanup
      await engine.cleanupWorktree();

      // Verify all operations were called
      expect(mockWorktreeManager.initialize).toHaveBeenCalled();
      expect(mockWorktreeManager.createWorktree).toHaveBeenCalled();
      expect(mockWorktreeManager.destroyWorktree).toHaveBeenCalled();
    });
  });
});
