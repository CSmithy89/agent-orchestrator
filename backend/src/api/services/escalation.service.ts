/**
 * EscalationService - Escalation management with workflow resumption
 * Wraps EscalationQueue with REST API functionality and WebSocket events
 */

import { EscalationQueue, Escalation } from '../../core/services/escalation-queue.js';
import { eventService } from './event.service.js';
import {
  EscalationDetail,
  EscalationListFilters,
  EscalationResponseRequest,
  EscalationResponseResult
} from '../types/escalation.types.js';

/**
 * EscalationService class - Manages escalation REST API and events
 */
export class EscalationService {
  private escalationQueue: EscalationQueue;

  constructor(escalationsDir: string = '.bmad-escalations') {
    this.escalationQueue = new EscalationQueue(escalationsDir);
  }

  /**
   * List all escalations with optional filters
   * @param filters Optional filters (status, projectId)
   * @returns Array of escalations
   */
  async listEscalations(filters?: EscalationListFilters): Promise<EscalationDetail[]> {
    try {
      // Convert filters to EscalationQueue format
      const queueFilters: { status?: string; workflowId?: string } = {};

      if (filters?.status) {
        queueFilters.status = filters.status;
      }

      // Note: EscalationQueue uses workflowId, not projectId
      // In a full implementation, we'd map projectId to workflow IDs
      // For now, we'll filter in-memory after getting results

      const escalations = await this.escalationQueue.list(queueFilters);

      // Convert to EscalationDetail format and filter by projectId if needed
      const details: EscalationDetail[] = escalations.map(esc => ({
        id: esc.id,
        projectId: this.extractProjectIdFromWorkflow(esc.workflowId),
        workflowId: esc.workflowId,
        step: esc.step,
        question: esc.question,
        aiReasoning: esc.aiReasoning,
        confidence: esc.confidence,
        context: esc.context,
        status: esc.status,
        createdAt: esc.createdAt,
        resolvedAt: esc.resolvedAt,
        response: esc.response,
        resolutionTime: esc.resolutionTime
      }));

      // Filter by projectId if specified
      if (filters?.projectId) {
        return details.filter(esc => esc.projectId === filters.projectId);
      }

      return details;
    } catch (error) {
      throw new Error(`Failed to list escalations: ${(error as Error).message}`);
    }
  }

  /**
   * Get escalation details by ID
   * @param escalationId Escalation identifier
   * @returns Escalation details
   */
  async getEscalation(escalationId: string): Promise<EscalationDetail> {
    try {
      const escalation = await this.escalationQueue.getById(escalationId);

      return {
        id: escalation.id,
        projectId: this.extractProjectIdFromWorkflow(escalation.workflowId),
        workflowId: escalation.workflowId,
        step: escalation.step,
        question: escalation.question,
        aiReasoning: escalation.aiReasoning,
        confidence: escalation.confidence,
        context: escalation.context,
        status: escalation.status,
        createdAt: escalation.createdAt,
        resolvedAt: escalation.resolvedAt,
        response: escalation.response,
        resolutionTime: escalation.resolutionTime
      };
    } catch (error) {
      throw new Error(`Failed to get escalation: ${(error as Error).message}`);
    }
  }

  /**
   * Respond to an escalation
   * Marks escalation as resolved, resumes workflow, and emits event
   * @param escalationId Escalation identifier
   * @param request Response request
   * @returns Response result
   */
  async respondToEscalation(
    escalationId: string,
    request: EscalationResponseRequest
  ): Promise<EscalationResponseResult> {
    try {
      // Validate response is not empty
      if (request.response === null || request.response === undefined) {
        throw new Error('Response cannot be empty');
      }

      if (typeof request.response === 'string' && request.response.trim().length === 0) {
        throw new Error('Response cannot be empty');
      }

      // Respond to escalation (this marks it as resolved)
      const resolved = await this.escalationQueue.respond(escalationId, request.response);

      // Extract project ID for event
      const projectId = this.extractProjectIdFromWorkflow(resolved.workflowId);

      // Emit escalation.responded event
      eventService.emitEvent(projectId, 'escalation.responded', {
        id: resolved.id,
        response: request.response,
        resolvedAt: resolved.resolvedAt!
      });

      // Note: Workflow resumption is handled by the workflow engine
      // which is waiting on EscalationQueue.waitForResponse()

      return {
        message: 'Escalation resolved successfully',
        escalationId: resolved.id,
        resolvedAt: resolved.resolvedAt!
      };
    } catch (error) {
      throw new Error(`Failed to respond to escalation: ${(error as Error).message}`);
    }
  }

  /**
   * Extract project ID from workflow ID
   *
   * **KNOWN LIMITATION:**
   * This method currently returns a placeholder UUID as there is no workflow-to-project
   * mapping infrastructure in place. A full implementation would require:
   *
   * 1. A persistent mapping store (database table or file-based index) that tracks
   *    which workflows belong to which projects
   * 2. Integration with WorkflowEngine to record project context when workflows start
   * 3. API endpoints to manage workflow-project associations
   *
   * **Current Impact:**
   * - All escalations will show the same placeholder projectId in API responses
   * - Filtering escalations by projectId will not work correctly
   * - This does NOT affect escalation resolution or workflow resumption
   *
   * **Workaround:**
   * Clients should use the workflowId as the primary identifier for escalations
   * rather than relying on projectId filtering.
   *
   * @param workflowId Workflow identifier
   * @returns Project identifier (currently a placeholder UUID)
   * @todo Implement workflow-to-project mapping infrastructure (Epic backlog item)
   */
  private extractProjectIdFromWorkflow(workflowId: string): string {
    // TODO: Implement actual workflow-to-project mapping
    // Placeholder UUID returned until mapping infrastructure is built
    return '00000000-0000-0000-0000-000000000000';
  }

  /**
   * Get escalation queue instance (for testing)
   */
  getQueue(): EscalationQueue {
    return this.escalationQueue;
  }
}

// Export singleton instance
export const escalationService = new EscalationService();
