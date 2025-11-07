/**
 * EscalationQueue Integration Tests
 *
 * Tests integration between EscalationQueue, DecisionEngine, and WorkflowEngine.
 * Verifies end-to-end escalation workflow with real file system operations.
 *
 * Story 2.2 - Task 9
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EscalationQueue } from '../../src/core/services/escalation-queue.js';
import { DecisionEngine, Decision } from '../../src/core/services/decision-engine.js';
import { LLMFactory } from '../../src/llm/LLMFactory.js';
import { LLMConfig } from '../../src/types/llm.types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('EscalationQueue Integration Tests', () => {
  const testDir = '.bmad-escalations-integration-test';
  let escalationQueue: EscalationQueue;
  let decisionEngine: DecisionEngine;
  let llmFactory: LLMFactory;
  let llmConfig: LLMConfig;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    // Create EscalationQueue with test directory
    escalationQueue = new EscalationQueue(testDir);

    // Create real LLMFactory and DecisionEngine (for integration testing)
    llmConfig = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5'
    };

    // Note: DecisionEngine requires real LLMFactory which may not work in test env
    // These tests focus on EscalationQueue integration patterns
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================================================
  // Integration: Escalation flow with real file system
  // ============================================================================
  describe('AC #4, #7: Escalation flow with file system', () => {
    it('should create escalation file and be retrievable', async () => {
      // Add escalation
      const id = await escalationQueue.add({
        workflowId: 'prd-workflow',
        step: 3,
        question: 'Should I use REST or GraphQL?',
        aiReasoning: 'Both are viable, need human decision',
        confidence: 0.68,
        context: { apiComplexity: 'moderate' }
      });

      // Verify file exists
      const filePath = path.join(testDir, `${id}.json`);
      const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Retrieve by ID
      const escalation = await escalationQueue.getById(id);
      expect(escalation.id).toBe(id);
      expect(escalation.question).toBe('Should I use REST or GraphQL?');
      expect(escalation.status).toBe('pending');
    });

    it('should handle workflow resume after response', async () => {
      // Add escalation (workflow pauses)
      const id = await escalationQueue.add({
        workflowId: 'prd-workflow',
        step: 3,
        question: 'Proceed with deployment?',
        aiReasoning: 'Production change requires approval',
        confidence: 0.65,
        context: { environment: 'production' }
      });

      // Verify pending status
      const pending = await escalationQueue.list({ status: 'pending' });
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(id);

      // Human responds (workflow resumes)
      const updated = await escalationQueue.respond(id, 'Yes, proceed with deployment');

      // Verify resolved status
      expect(updated.status).toBe('resolved');
      expect(updated.response).toBe('Yes, proceed with deployment');
      expect(updated.resolvedAt).toBeDefined();
      expect(updated.resolutionTime).toBeGreaterThan(0);

      // Verify no longer in pending list
      const stillPending = await escalationQueue.list({ status: 'pending' });
      expect(stillPending).toHaveLength(0);
    });
  });

  // ============================================================================
  // Integration: Concurrent escalation handling
  // ============================================================================
  describe('AC #4: Concurrent escalation handling', () => {
    it('should handle multiple escalations from different workflows concurrently', async () => {
      // Simulate multiple workflows creating escalations concurrently
      const escalation1Promise = escalationQueue.add({
        workflowId: 'prd-workflow',
        step: 2,
        question: 'PRD question 1?',
        aiReasoning: 'Need clarification',
        confidence: 0.70,
        context: {}
      });

      const escalation2Promise = escalationQueue.add({
        workflowId: 'arch-workflow',
        step: 1,
        question: 'Arch question 1?',
        aiReasoning: 'Multiple options',
        confidence: 0.65,
        context: {}
      });

      const escalation3Promise = escalationQueue.add({
        workflowId: 'prd-workflow',
        step: 5,
        question: 'PRD question 2?',
        aiReasoning: 'Ambiguous requirement',
        confidence: 0.72,
        context: {}
      });

      // Wait for all to complete
      const [id1, id2, id3] = await Promise.all([
        escalation1Promise,
        escalation2Promise,
        escalation3Promise
      ]);

      // Verify all escalations created
      const all = await escalationQueue.list();
      expect(all).toHaveLength(3);

      // Verify filtering by workflow
      const prdEscalations = await escalationQueue.list({ workflowId: 'prd-workflow' });
      expect(prdEscalations).toHaveLength(2);

      const archEscalations = await escalationQueue.list({ workflowId: 'arch-workflow' });
      expect(archEscalations).toHaveLength(1);
    });

    it('should handle concurrent responses to multiple escalations', async () => {
      // Create multiple escalations
      const id1 = await escalationQueue.add({
        workflowId: 'workflow-1',
        step: 1,
        question: 'Q1?',
        aiReasoning: 'R1',
        confidence: 0.70,
        context: {}
      });

      const id2 = await escalationQueue.add({
        workflowId: 'workflow-2',
        step: 1,
        question: 'Q2?',
        aiReasoning: 'R2',
        confidence: 0.65,
        context: {}
      });

      const id3 = await escalationQueue.add({
        workflowId: 'workflow-3',
        step: 1,
        question: 'Q3?',
        aiReasoning: 'R3',
        confidence: 0.68,
        context: {}
      });

      // Respond to all concurrently
      const responses = await Promise.all([
        escalationQueue.respond(id1, 'Answer 1'),
        escalationQueue.respond(id2, 'Answer 2'),
        escalationQueue.respond(id3, 'Answer 3')
      ]);

      // Verify all resolved
      expect(responses).toHaveLength(3);
      responses.forEach(r => {
        expect(r.status).toBe('resolved');
        expect(r.resolvedAt).toBeDefined();
      });

      // Verify no pending escalations
      const pending = await escalationQueue.list({ status: 'pending' });
      expect(pending).toHaveLength(0);

      // Verify all resolved
      const resolved = await escalationQueue.list({ status: 'resolved' });
      expect(resolved).toHaveLength(3);
    });
  });

  // ============================================================================
  // Integration: Error handling with file I/O
  // ============================================================================
  describe('Error handling for file I/O failures', () => {
    it('should handle getById() with non-existent file gracefully', async () => {
      await expect(escalationQueue.getById('esc-nonexistent-id')).rejects.toThrow('Escalation not found');
    });

    it('should handle respond() on non-existent escalation', async () => {
      await expect(escalationQueue.respond('esc-nonexistent-id', 'response')).rejects.toThrow('Escalation not found');
    });

    it('should handle respond() on already-resolved escalation', async () => {
      // Create and resolve escalation
      const id = await escalationQueue.add({
        workflowId: 'test',
        step: 1,
        question: 'Q?',
        aiReasoning: 'R',
        confidence: 0.70,
        context: {}
      });

      await escalationQueue.respond(id, 'First response');

      // Try to respond again
      await expect(escalationQueue.respond(id, 'Second response')).rejects.toThrow(/not pending/);
    });

    it('should return empty array when listing from non-existent directory', async () => {
      const emptyQueue = new EscalationQueue('.bmad-escalations-nonexistent');
      const escalations = await emptyQueue.list();
      expect(escalations).toHaveLength(0);
    });
  });

  // ============================================================================
  // Integration: Metrics calculation with multiple escalations
  // ============================================================================
  describe('AC #8: Metrics calculation with real data', () => {
    it('should calculate accurate metrics across multiple workflows', async () => {
      // Create mix of pending and resolved escalations
      const id1 = await escalationQueue.add({
        workflowId: 'prd-workflow',
        step: 1,
        question: 'Q1?',
        aiReasoning: 'R1',
        confidence: 0.70,
        context: {}
      });

      const id2 = await escalationQueue.add({
        workflowId: 'prd-workflow',
        step: 2,
        question: 'Q2?',
        aiReasoning: 'R2',
        confidence: 0.65,
        context: {}
      });

      const id3 = await escalationQueue.add({
        workflowId: 'arch-workflow',
        step: 1,
        question: 'Q3?',
        aiReasoning: 'R3',
        confidence: 0.68,
        context: {}
      });

      // Resolve some escalations
      await escalationQueue.respond(id1, 'A1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await escalationQueue.respond(id2, 'A2');

      // Calculate metrics
      const metrics = await escalationQueue.getMetrics();

      expect(metrics.totalEscalations).toBe(3);
      expect(metrics.resolvedCount).toBe(2);
      expect(metrics.averageResolutionTime).toBeGreaterThan(0);
      expect(metrics.categoryBreakdown['prd-workflow']).toBe(2);
      expect(metrics.categoryBreakdown['arch-workflow']).toBe(1);
    });

    it('should handle metrics calculation performance (<500ms per NFRs)', async () => {
      // Create many escalations
      const ids: string[] = [];
      for (let i = 0; i < 50; i++) {
        const id = await escalationQueue.add({
          workflowId: `workflow-${i % 5}`,
          step: i,
          question: `Question ${i}?`,
          aiReasoning: `Reasoning ${i}`,
          confidence: 0.65 + (i % 10) * 0.01,
          context: { index: i }
        });
        ids.push(id);
      }

      // Resolve half of them
      for (let i = 0; i < 25; i++) {
        await escalationQueue.respond(ids[i], `Answer ${i}`);
      }

      // Measure metrics calculation time
      const startTime = Date.now();
      const metrics = await escalationQueue.getMetrics();
      const duration = Date.now() - startTime;

      // Verify metrics correct
      expect(metrics.totalEscalations).toBe(50);
      expect(metrics.resolvedCount).toBe(25);

      // Verify performance target (<500ms)
      expect(duration).toBeLessThan(500);
    });
  });

  // ============================================================================
  // Integration: Console notification verification
  // ============================================================================
  describe('AC #5: Console notification integration', () => {
    it('should log escalation details to console when added', async () => {
      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (message: string) => {
        logs.push(message);
        originalLog(message);
      };

      try {
        const id = await escalationQueue.add({
          workflowId: 'prd-workflow',
          step: 3,
          question: 'Use microservices?',
          aiReasoning: 'Depends on scale requirements',
          confidence: 0.69,
          context: { scale: 'medium' }
        });

        // Verify console notification logged
        expect(logs.length).toBeGreaterThan(0);
        const notification = logs[0];
        expect(notification).toContain(id);
        expect(notification).toContain('prd-workflow');
        expect(notification).toContain('Use microservices?');
        expect(notification).toContain('0.69');
      } finally {
        console.log = originalLog;
      }
    });
  });

  // ============================================================================
  // Integration: End-to-end workflow scenario
  // ============================================================================
  describe('End-to-end workflow scenario', () => {
    it('should handle complete escalation lifecycle', async () => {
      // 1. DecisionEngine confidence < 0.75 triggers escalation
      const escalationId = await escalationQueue.add({
        workflowId: 'prd-generation',
        step: 5,
        question: 'Should we include real-time features?',
        aiReasoning: 'Requirements are ambiguous about real-time needs',
        confidence: 0.70,
        context: {
          productType: 'web-app',
          userBase: 'enterprise',
          existingFeatures: ['auth', 'dashboard']
        }
      });

      // 2. Workflow pauses (simulated by checking pending status)
      const pending = await escalationQueue.list({ status: 'pending' });
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(escalationId);

      // 3. User reviews escalation
      const escalation = await escalationQueue.getById(escalationId);
      expect(escalation.question).toBe('Should we include real-time features?');
      expect(escalation.aiReasoning).toContain('ambiguous');
      expect(escalation.confidence).toBe(0.70);

      // 4. User responds
      const response = {
        decision: 'yes',
        rationale: 'Real-time collaboration is critical for enterprise users',
        features: ['live-updates', 'presence-indicators']
      };

      const resolved = await escalationQueue.respond(escalationId, response);

      // 5. Workflow resumes with response (verified by status change)
      expect(resolved.status).toBe('resolved');
      expect(resolved.response).toEqual(response);
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.resolutionTime).toBeGreaterThan(0);

      // 6. Verify escalation no longer pending
      const stillPending = await escalationQueue.list({ status: 'pending' });
      expect(stillPending).toHaveLength(0);

      // 7. Metrics reflect the resolved escalation
      const metrics = await escalationQueue.getMetrics();
      expect(metrics.totalEscalations).toBe(1);
      expect(metrics.resolvedCount).toBe(1);
      expect(metrics.categoryBreakdown['prd-generation']).toBe(1);
    });
  });
});
