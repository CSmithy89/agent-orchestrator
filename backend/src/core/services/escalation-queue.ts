/**
 * EscalationQueue - Human intervention queue with pause/resume workflow capability
 *
 * Manages decisions requiring human input during autonomous workflow execution.
 * Provides file-based escalation storage, notification, and metrics tracking.
 *
 * Integration Pattern:
 * - DecisionEngine calls add() when confidence < 0.75
 * - Workflow pauses at escalation point (handled by WorkflowEngine)
 * - Human responds via respond() method
 * - Workflow resumes with response
 *
 * Storage: .bmad-escalations/{id}.json (one file per escalation)
 * Performance: <100ms for add/list/getById/respond, <500ms for getMetrics
 *
 * @example
 * ```typescript
 * const queue = new EscalationQueue();
 *
 * // Add escalation when AI confidence < 0.75
 * const id = await queue.add({
 *   workflowId: 'prd-workflow',
 *   step: 3,
 *   question: 'Should I use REST or GraphQL?',
 *   aiReasoning: 'Insufficient context to determine best approach',
 *   confidence: 0.68,
 *   context: { apiType: 'user-facing', complexity: 'moderate' }
 * });
 *
 * // List pending escalations
 * const pending = await queue.list({ status: 'pending' });
 *
 * // Respond to escalation
 * await queue.respond(id, 'Use REST for simplicity');
 *
 * // Get metrics
 * const metrics = await queue.getMetrics();
 * console.log(`Average resolution time: ${metrics.averageResolutionTime}ms`);
 * ```
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Escalation represents a decision requiring human intervention
 */
export interface Escalation {
  /** UUID for tracking (format: esc-{uuid}) */
  id: string;

  /** Which workflow triggered escalation */
  workflowId: string;

  /** Which step in workflow */
  step: number;

  /** What decision is needed */
  question: string;

  /** Why AI couldn't decide confidently */
  aiReasoning: string;

  /** AI's confidence (< 0.75 triggers escalation) */
  confidence: number;

  /** Relevant context for human */
  context: Record<string, unknown>;

  /** Escalation status */
  status: 'pending' | 'resolved' | 'cancelled';

  /** When escalation was created */
  createdAt: string;

  /** When escalation was resolved (optional) */
  resolvedAt?: string;

  /** Human response when resolved (optional) */
  response?: unknown;

  /** Milliseconds from creation to resolution (optional) */
  resolutionTime?: number;
}

/**
 * EscalationMetrics provides aggregate statistics
 */
export interface EscalationMetrics {
  /** Total number of escalations */
  totalEscalations: number;

  /** Number of resolved escalations */
  resolvedCount: number;

  /** Average time to resolution in milliseconds */
  averageResolutionTime: number;

  /** Escalations grouped by workflow */
  categoryBreakdown: Record<string, number>;
}

/**
 * EscalationQueue class - Manages human intervention requests
 *
 * Provides file-based escalation storage with atomic writes, console notifications,
 * and comprehensive metrics tracking.
 */
export class EscalationQueue {
  /** Directory where escalation files are stored */
  private readonly escalationsDir: string;

  /**
   * Creates a new EscalationQueue instance
   * @param escalationsDir - Directory for escalation files (default: .bmad-escalations)
   */
  constructor(escalationsDir: string = '.bmad-escalations') {
    this.escalationsDir = escalationsDir;
  }

  /**
   * Add escalation to queue and notify console
   *
   * Creates escalation file with atomic write pattern (temp file + rename)
   * to prevent corruption. Logs notification to console for user awareness.
   *
   * Workflow Integration:
   * - Called by DecisionEngine when confidence < 0.75
   * - WorkflowEngine should pause at escalation point
   * - Workflow resumes when respond() is called
   *
   * @param escalation - Escalation details (id, status, createdAt auto-generated)
   * @returns Escalation ID (format: esc-{uuid})
   *
   * @example
   * ```typescript
   * const id = await queue.add({
   *   workflowId: 'prd-workflow',
   *   step: 3,
   *   question: 'Technology choice?',
   *   aiReasoning: 'Multiple viable options, need human decision',
   *   confidence: 0.68,
   *   context: { options: ['REST', 'GraphQL', 'gRPC'] }
   * });
   * // Logs: "🚨 Escalation esc-abc123... | Workflow: prd-workflow | Q: Technology choice? | Confidence: 0.68"
   * ```
   */
  async add(
    escalation: Omit<Escalation, 'id' | 'status' | 'createdAt'>
  ): Promise<string> {
    // Validate inputs
    if (escalation.confidence < 0 || escalation.confidence > 1) {
      throw new Error(`Invalid confidence score: ${escalation.confidence}. Must be between 0 and 1.`);
    }
    if (!escalation.question?.trim()) {
      throw new Error('Question is required and cannot be empty');
    }
    if (!escalation.workflowId?.trim()) {
      throw new Error('WorkflowId is required and cannot be empty');
    }

    // Generate unique ID with esc- prefix
    const id = `esc-${uuidv4()}`;

    // Create complete escalation object
    const fullEscalation: Escalation = {
      id,
      ...escalation,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Ensure escalations directory exists
    await fs.mkdir(this.escalationsDir, { recursive: true });

    // Atomic write: temp file + rename to prevent corruption
    const filePath = path.join(this.escalationsDir, `${id}.json`);
    const tempPath = `${filePath}.tmp`;

    await fs.writeFile(tempPath, JSON.stringify(fullEscalation, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);

    // AC #5: Console notification
    console.log(
      `🚨 Escalation ${id} | Workflow: ${escalation.workflowId} | Q: ${escalation.question} | Confidence: ${escalation.confidence}`
    );

    return id;
  }

  /**
   * List escalations with optional filtering
   *
   * Loads all escalation files and filters by status or workflowId if specified.
   * Returns empty array if no escalations match filters.
   *
   * Performance: Optimized for <100ms with reasonable escalation counts (<1000).
   *
   * @param filters - Optional filters (status, workflowId)
   * @returns Array of escalations matching filters
   *
   * @example
   * ```typescript
   * // All escalations
   * const all = await queue.list();
   *
   * // Pending only
   * const pending = await queue.list({ status: 'pending' });
   *
   * // Specific workflow
   * const prdEscalations = await queue.list({ workflowId: 'prd-workflow' });
   * ```
   */
  async list(filters?: {
    status?: 'pending' | 'resolved' | 'cancelled';
    workflowId?: string;
  }): Promise<Escalation[]> {
    // Ensure directory exists
    await fs.mkdir(this.escalationsDir, { recursive: true });

    // Read all escalation files
    const files = await fs.readdir(this.escalationsDir);
    const escalationFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));

    // Load and parse all escalations in parallel
    const escalations = await Promise.all(
      escalationFiles.map(async (file) => {
        const filePath = path.join(this.escalationsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          return JSON.parse(content) as Escalation;
        } catch (error) {
          console.warn(`Failed to load escalation file ${file}: ${(error as Error).message}`);
          return null;
        }
      })
    ).then(results => results.filter((e): e is Escalation => e !== null));

    // Apply filters
    let filtered = escalations;

    if (filters?.status) {
      filtered = filtered.filter(e => e.status === filters.status);
    }

    if (filters?.workflowId) {
      filtered = filtered.filter(e => e.workflowId === filters.workflowId);
    }

    return filtered;
  }

  /**
   * Get specific escalation by ID
   *
   * Loads escalation from file system. Throws error if escalation not found.
   *
   * Performance: <100ms file read operation.
   *
   * @param escalationId - Escalation UUID (format: esc-{uuid})
   * @returns Escalation object
   * @throws Error if escalation not found
   *
   * @example
   * ```typescript
   * const escalation = await queue.getById('esc-abc123...');
   * console.log(escalation.question); // "Technology choice?"
   * ```
   */
  async getById(escalationId: string): Promise<Escalation> {
    const filePath = path.join(this.escalationsDir, `${escalationId}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as Escalation;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Escalation not found: ${escalationId}`);
      }
      // Preserve original error for other failures (permissions, invalid JSON, etc.)
      throw new Error(`Failed to load escalation ${escalationId}: ${(error as Error).message}`);
    }
  }

  /**
   * Respond to escalation and resume workflow
   *
   * Updates escalation with human response, sets status to resolved,
   * calculates resolution time, and saves updated escalation.
   *
   * Workflow Integration:
   * - WorkflowEngine should resume from escalation step with response
   * - Escalation must have status 'pending' (cannot re-respond)
   *
   * Performance: <100ms file read + write operation.
   *
   * @param escalationId - Escalation UUID
   * @param response - Human response (any type)
   * @returns Updated escalation object
   * @throws Error if escalation not found or not pending
   *
   * @example
   * ```typescript
   * const updated = await queue.respond('esc-abc123...', 'Use REST API');
   * console.log(updated.status); // 'resolved'
   * console.log(updated.resolutionTime); // 45000 (45 seconds)
   * ```
   */
  async respond(escalationId: string, response: unknown): Promise<Escalation> {
    // Load existing escalation
    const escalation = await this.getById(escalationId);

    // Validate status
    if (escalation.status !== 'pending') {
      throw new Error(`Escalation ${escalationId} is not pending (status: ${escalation.status})`);
    }

    // Update escalation
    const resolvedAt = new Date().toISOString();
    const createdAt = new Date(escalation.createdAt);
    const resolvedAtDate = new Date(resolvedAt);
    const resolutionTime = resolvedAtDate.getTime() - createdAt.getTime();

    const updated: Escalation = {
      ...escalation,
      status: 'resolved',
      response,
      resolvedAt,
      resolutionTime
    };

    // Save updated escalation (atomic write)
    const filePath = path.join(this.escalationsDir, `${escalationId}.json`);
    const tempPath = `${filePath}.tmp`;

    await fs.writeFile(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
    await fs.rename(tempPath, filePath);

    return updated;
  }

  /**
   * Get escalation metrics
   *
   * Calculates aggregate statistics across all escalations:
   * - Total escalation count
   * - Resolved escalation count
   * - Average resolution time (only resolved escalations)
   * - Category breakdown (escalations grouped by workflow)
   *
   * Performance: <500ms as per NFRs (loads all escalation files).
   *
   * @returns Escalation metrics object
   *
   * @example
   * ```typescript
   * const metrics = await queue.getMetrics();
   * console.log(`Total: ${metrics.totalEscalations}`);
   * console.log(`Resolved: ${metrics.resolvedCount}`);
   * console.log(`Avg resolution: ${metrics.averageResolutionTime}ms`);
   * console.log(`By workflow:`, metrics.categoryBreakdown);
   * // By workflow: { 'prd-workflow': 5, 'arch-workflow': 2 }
   * ```
   */
  async getMetrics(): Promise<EscalationMetrics> {
    // Load all escalations
    const escalations = await this.list();

    // Calculate metrics
    const totalEscalations = escalations.length;
    const resolvedEscalations = escalations.filter(e => e.status === 'resolved');
    const resolvedCount = resolvedEscalations.length;

    // Average resolution time (only resolved)
    let averageResolutionTime = 0;
    if (resolvedCount > 0) {
      const totalTime = resolvedEscalations.reduce(
        (sum, e) => sum + (e.resolutionTime || 0),
        0
      );
      averageResolutionTime = Math.round(totalTime / resolvedCount);
    }

    // Category breakdown (group by workflow)
    const categoryBreakdown: Record<string, number> = {};
    for (const escalation of escalations) {
      const workflow = escalation.workflowId;
      categoryBreakdown[workflow] = (categoryBreakdown[workflow] || 0) + 1;
    }

    return {
      totalEscalations,
      resolvedCount,
      averageResolutionTime,
      categoryBreakdown
    };
  }
}
