/**
 * EscalationQueue Unit Tests
 *
 * Tests for human intervention queue with pause/resume workflow capability.
 * Tests all 8 acceptance criteria for Story 2.2.
 *
 * ATDD Approach: Tests written FIRST before implementation.
 * Expected: All tests FAIL initially until implementation complete.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EscalationQueue, Escalation, EscalationMetrics } from '../../src/core/services/escalation-queue.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs/promises for isolated testing
vi.mock('fs/promises');

describe('EscalationQueue', () => {
  let escalationQueue: EscalationQueue;
  const testEscalationsDir = '.bmad-escalations-test';

  beforeEach(() => {
    // Create EscalationQueue instance with test directory
    escalationQueue = new EscalationQueue(testEscalationsDir);

    // Setup fs mocks
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('{}');
    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.rename).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // AC #1: Implement EscalationQueue class
  // ============================================================================
  describe('AC #1: EscalationQueue class with required methods', () => {
    it('should create EscalationQueue instance successfully', () => {
      expect(escalationQueue).toBeInstanceOf(EscalationQueue);
    });

    it('should have add() method', () => {
      expect(typeof escalationQueue.add).toBe('function');
    });

    it('should have list() method', () => {
      expect(typeof escalationQueue.list).toBe('function');
    });

    it('should have getById() method', () => {
      expect(typeof escalationQueue.getById).toBe('function');
    });

    it('should have respond() method', () => {
      expect(typeof escalationQueue.respond).toBe('function');
    });

    it('should have getMetrics() method', () => {
      expect(typeof escalationQueue.getMetrics).toBe('function');
    });
  });

  // ============================================================================
  // AC #2: add() saves to .bmad-escalations/{id}.json
  // ============================================================================
  describe('AC #2: add() saves escalation to file', () => {
    it('should create .bmad-escalations directory if not exists', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: { key: 'value' }
      };

      await escalationQueue.add(escalation);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(testEscalationsDir),
        { recursive: true }
      );
    });

    it('should generate unique escalation ID with esc- prefix', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      const id = await escalationQueue.add(escalation);

      expect(id).toMatch(/^esc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should save escalation to file with correct path format', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      const id = await escalationQueue.add(escalation);

      // Check that writeFile was called with path ending in .json
      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      expect(writeFileCalls.length).toBeGreaterThan(0);
      const filePath = writeFileCalls[0][0] as string;
      expect(filePath).toContain(`${id}.json`);
    });

    it('should use atomic write pattern (temp file + rename)', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      // Verify temp file written first
      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      expect(writeFileCalls[0][0]).toContain('.tmp');

      // Verify rename called to move temp to final
      expect(fs.rename).toHaveBeenCalled();
    });

    it('should return escalation ID string', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      const id = await escalationQueue.add(escalation);

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // AC #3: Escalation includes required metadata
  // ============================================================================
  describe('AC #3: Escalation metadata schema', () => {
    it('should include workflowId in saved escalation', async () => {
      const escalation = {
        workflowId: 'test-workflow-123',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.workflowId).toBe('test-workflow-123');
    });

    it('should include step number in saved escalation', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 42,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.step).toBe(42);
    });

    it('should include question in saved escalation', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'What should I do?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.question).toBe('What should I do?');
    });

    it('should include aiReasoning in saved escalation', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'I am not confident because of X',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.aiReasoning).toBe('I am not confident because of X');
    });

    it('should include confidence score in saved escalation', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.72,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.confidence).toBe(0.72);
    });

    it('should include context object in saved escalation', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: { environment: 'production', changes: 'schema update' }
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.context).toEqual({ environment: 'production', changes: 'schema update' });
    });

    it('should set status to pending when escalation created', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.status).toBe('pending');
    });

    it('should set createdAt timestamp when escalation created', async () => {
      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
      const savedContent = writeFileCalls[0][1] as string;
      const savedData = JSON.parse(savedContent);

      expect(savedData.createdAt).toBeDefined();
      // Verify it's a valid ISO date string
      expect(new Date(savedData.createdAt).toISOString()).toBe(savedData.createdAt);
    });
  });

  // ============================================================================
  // AC #4, #7: Pause/resume workflow (documented in implementation)
  // ============================================================================
  describe('AC #4, #7: Workflow pause/resume integration', () => {
    it('should document pause/resume contract (tested in Story 2.5)', () => {
      // This AC is about integration pattern documentation
      // Actual pause/resume tested in Story 2.5 (PRD Workflow)
      // EscalationQueue provides the add() and respond() hooks
      expect(escalationQueue.add).toBeDefined();
      expect(escalationQueue.respond).toBeDefined();
    });
  });

  // ============================================================================
  // AC #5: Console notification
  // ============================================================================
  describe('AC #5: Console notification on escalation', () => {
    it('should log to console when escalation added', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should include escalation ID in console notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      const id = await escalationQueue.add(escalation);

      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain(id);
      consoleSpy.mockRestore();
    });

    it('should include workflow name in console notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const escalation = {
        workflowId: 'prd-workflow',
        step: 1,
        question: 'Test question?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('prd-workflow');
      consoleSpy.mockRestore();
    });

    it('should include question in console notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Should I proceed with deployment?',
        aiReasoning: 'Test reasoning',
        confidence: 0.65,
        context: {}
      };

      await escalationQueue.add(escalation);

      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('Should I proceed with deployment?');
      consoleSpy.mockRestore();
    });

    it('should include confidence score in console notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const escalation = {
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Test reasoning',
        confidence: 0.68,
        context: {}
      };

      await escalationQueue.add(escalation);

      const logCall = consoleSpy.mock.calls[0][0];
      expect(logCall).toContain('0.68');
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // AC #2: list() and getById() retrieval methods
  // ============================================================================
  describe('AC #2: Escalation retrieval methods', () => {
    it('should return all escalations when list() called with no filters', async () => {
      const mockFiles = ['esc-123.json', 'esc-456.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEscalation1 = {
        id: 'esc-123',
        workflowId: 'workflow-1',
        step: 1,
        question: 'Q1?',
        aiReasoning: 'R1',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const mockEscalation2 = {
        id: 'esc-456',
        workflowId: 'workflow-2',
        step: 2,
        question: 'Q2?',
        aiReasoning: 'R2',
        confidence: 0.70,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockEscalation1))
        .mockResolvedValueOnce(JSON.stringify(mockEscalation2));

      const escalations = await escalationQueue.list();

      expect(escalations).toHaveLength(2);
      expect(escalations[0].id).toBe('esc-123');
      expect(escalations[1].id).toBe('esc-456');
    });

    it('should filter escalations by status=pending', async () => {
      const mockFiles = ['esc-123.json', 'esc-456.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEscalation1 = {
        id: 'esc-123',
        workflowId: 'workflow-1',
        step: 1,
        question: 'Q1?',
        aiReasoning: 'R1',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const mockEscalation2 = {
        id: 'esc-456',
        workflowId: 'workflow-2',
        step: 2,
        question: 'Q2?',
        aiReasoning: 'R2',
        confidence: 0.70,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockEscalation1))
        .mockResolvedValueOnce(JSON.stringify(mockEscalation2));

      const escalations = await escalationQueue.list({ status: 'pending' });

      expect(escalations).toHaveLength(1);
      expect(escalations[0].status).toBe('pending');
    });

    it('should filter escalations by status=resolved', async () => {
      const mockFiles = ['esc-123.json', 'esc-456.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEscalation1 = {
        id: 'esc-123',
        workflowId: 'workflow-1',
        step: 1,
        question: 'Q1?',
        aiReasoning: 'R1',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const mockEscalation2 = {
        id: 'esc-456',
        workflowId: 'workflow-2',
        step: 2,
        question: 'Q2?',
        aiReasoning: 'R2',
        confidence: 0.70,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockEscalation1))
        .mockResolvedValueOnce(JSON.stringify(mockEscalation2));

      const escalations = await escalationQueue.list({ status: 'resolved' });

      expect(escalations).toHaveLength(1);
      expect(escalations[0].status).toBe('resolved');
    });

    it('should filter escalations by workflowId', async () => {
      const mockFiles = ['esc-123.json', 'esc-456.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEscalation1 = {
        id: 'esc-123',
        workflowId: 'prd-workflow',
        step: 1,
        question: 'Q1?',
        aiReasoning: 'R1',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const mockEscalation2 = {
        id: 'esc-456',
        workflowId: 'arch-workflow',
        step: 2,
        question: 'Q2?',
        aiReasoning: 'R2',
        confidence: 0.70,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockEscalation1))
        .mockResolvedValueOnce(JSON.stringify(mockEscalation2));

      const escalations = await escalationQueue.list({ workflowId: 'prd-workflow' });

      expect(escalations).toHaveLength(1);
      expect(escalations[0].workflowId).toBe('prd-workflow');
    });

    it('should retrieve escalation by ID with getById()', async () => {
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Test?',
        aiReasoning: 'Because',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const escalation = await escalationQueue.getById('esc-test-123');

      expect(escalation.id).toBe('esc-test-123');
      expect(escalation.question).toBe('Test?');
    });

    it('should throw error when getById() called with non-existent ID', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(escalationQueue.getById('esc-nonexistent')).rejects.toThrow();
    });
  });

  // ============================================================================
  // AC #6: respond() records human answer
  // ============================================================================
  describe('AC #6: respond() method', () => {
    it('should update escalation with response', async () => {
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Proceed?',
        aiReasoning: 'Uncertain',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const updated = await escalationQueue.respond('esc-test-123', 'Yes, proceed');

      expect(updated.response).toBe('Yes, proceed');
    });

    it('should set status to resolved when respond() called', async () => {
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Proceed?',
        aiReasoning: 'Uncertain',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const updated = await escalationQueue.respond('esc-test-123', 'Yes');

      expect(updated.status).toBe('resolved');
    });

    it('should set resolvedAt timestamp when respond() called', async () => {
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Proceed?',
        aiReasoning: 'Uncertain',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const updated = await escalationQueue.respond('esc-test-123', 'Yes');

      expect(updated.resolvedAt).toBeDefined();
      expect(new Date(updated.resolvedAt!).toISOString()).toBe(updated.resolvedAt);
    });

    it('should calculate resolutionTime in milliseconds', async () => {
      const createdAt = new Date('2025-01-01T10:00:00Z');
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Proceed?',
        aiReasoning: 'Uncertain',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: createdAt.toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const updated = await escalationQueue.respond('esc-test-123', 'Yes');

      expect(updated.resolutionTime).toBeDefined();
      expect(updated.resolutionTime).toBeGreaterThan(0);
      expect(typeof updated.resolutionTime).toBe('number');
    });

    it('should throw error when respond() called with non-existent escalation', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(escalationQueue.respond('esc-nonexistent', 'Yes')).rejects.toThrow();
    });

    it('should throw error when respond() called on non-pending escalation', async () => {
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Proceed?',
        aiReasoning: 'Uncertain',
        confidence: 0.65,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        response: 'Already answered'
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      await expect(escalationQueue.respond('esc-test-123', 'New answer')).rejects.toThrow(/not pending/);
    });

    it('should return updated Escalation object from respond()', async () => {
      const mockEscalation = {
        id: 'esc-test-123',
        workflowId: 'test-workflow',
        step: 1,
        question: 'Proceed?',
        aiReasoning: 'Uncertain',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const updated = await escalationQueue.respond('esc-test-123', 'Yes');

      expect(updated).toBeDefined();
      expect(updated.id).toBe('esc-test-123');
      expect(updated.status).toBe('resolved');
      expect(updated.response).toBe('Yes');
    });
  });

  // ============================================================================
  // AC #8: Track escalation metrics
  // ============================================================================
  describe('AC #8: Escalation metrics tracking', () => {
    it('should calculate totalEscalations count', async () => {
      const mockFiles = ['esc-1.json', 'esc-2.json', 'esc-3.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEscalation = {
        id: 'esc-1',
        workflowId: 'test',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const metrics = await escalationQueue.getMetrics();

      expect(metrics.totalEscalations).toBe(3);
    });

    it('should calculate resolvedCount for escalations with status=resolved', async () => {
      const mockFiles = ['esc-1.json', 'esc-2.json', 'esc-3.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockPending = {
        id: 'esc-1',
        workflowId: 'test',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const mockResolved = {
        id: 'esc-2',
        workflowId: 'test',
        step: 2,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        resolutionTime: 1000
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockPending))
        .mockResolvedValueOnce(JSON.stringify(mockResolved))
        .mockResolvedValueOnce(JSON.stringify(mockResolved));

      const metrics = await escalationQueue.getMetrics();

      expect(metrics.resolvedCount).toBe(2);
    });

    it('should calculate averageResolutionTime from resolved escalations', async () => {
      const mockFiles = ['esc-1.json', 'esc-2.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockResolved1 = {
        id: 'esc-1',
        workflowId: 'test',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        resolutionTime: 1000
      };

      const mockResolved2 = {
        id: 'esc-2',
        workflowId: 'test',
        step: 2,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        resolutionTime: 3000
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockResolved1))
        .mockResolvedValueOnce(JSON.stringify(mockResolved2));

      const metrics = await escalationQueue.getMetrics();

      expect(metrics.averageResolutionTime).toBe(2000); // (1000 + 3000) / 2
    });

    it('should return 0 averageResolutionTime when no resolved escalations', async () => {
      const mockFiles = ['esc-1.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockPending = {
        id: 'esc-1',
        workflowId: 'test',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockPending));

      const metrics = await escalationQueue.getMetrics();

      expect(metrics.averageResolutionTime).toBe(0);
    });

    it('should calculate categoryBreakdown grouped by workflow', async () => {
      const mockFiles = ['esc-1.json', 'esc-2.json', 'esc-3.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEsc1 = {
        id: 'esc-1',
        workflowId: 'prd-workflow',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const mockEsc2 = {
        id: 'esc-2',
        workflowId: 'prd-workflow',
        step: 2,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'resolved',
        createdAt: new Date().toISOString()
      };

      const mockEsc3 = {
        id: 'esc-3',
        workflowId: 'arch-workflow',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockEsc1))
        .mockResolvedValueOnce(JSON.stringify(mockEsc2))
        .mockResolvedValueOnce(JSON.stringify(mockEsc3));

      const metrics = await escalationQueue.getMetrics();

      expect(metrics.categoryBreakdown['prd-workflow']).toBe(2);
      expect(metrics.categoryBreakdown['arch-workflow']).toBe(1);
    });

    it('should return EscalationMetrics object with all fields', async () => {
      const mockFiles = ['esc-1.json'];
      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);

      const mockEscalation = {
        id: 'esc-1',
        workflowId: 'test',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.65,
        context: {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockEscalation));

      const metrics = await escalationQueue.getMetrics();

      expect(metrics).toHaveProperty('totalEscalations');
      expect(metrics).toHaveProperty('resolvedCount');
      expect(metrics).toHaveProperty('averageResolutionTime');
      expect(metrics).toHaveProperty('categoryBreakdown');
    });
  });
});
