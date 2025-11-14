/**
 * Orchestrator Routes - REST API endpoints for workflow orchestration control
 * Provides start, pause, resume, and status endpoints with JWT authentication
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { orchestratorService } from '../services/orchestrator.service.js';
import {
  ProjectOrchestratorStatusSchema,
  StartWorkflowRequestSchema,
  WorkflowControlResponseSchema
} from '../types/orchestrator.types.js';
import { APIResponse, APIError } from '../types/api.types.js';

/**
 * Path parameters schema for project ID
 */
const ProjectIdParamsSchema = z.object({
  projectId: z.string().uuid()
});

/**
 * Register orchestrator routes with Fastify
 */
export async function registerOrchestratorRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /api/orchestrators/:projectId/status - Get current orchestrator status
   */
  server.get('/api/orchestrators/:projectId/status', {
    schema: {
      description: 'Get current orchestrator status for a project',
      tags: ['orchestrators'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', format: 'uuid' }
        },
        required: ['projectId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                workflowName: { type: 'string' },
                currentStep: { type: 'string' },
                status: { type: 'string' },
                agentActivity: { type: 'array' },
                progress: { type: 'number' },
                startedAt: { type: 'string' },
                pausedAt: { type: 'string' },
                completedAt: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or missing authentication token',
          requestId: request.id
        } as APIError);
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate path parameters
        const params = ProjectIdParamsSchema.parse(request.params);

        // Get orchestrator status
        const status = await orchestratorService.getStatus(params.projectId);

        const response: APIResponse<typeof status> = {
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: (error as Error).message,
          requestId: request.id
        } as APIError);
      }
    }
  });

  /**
   * POST /api/orchestrators/:projectId/start - Start workflow execution
   */
  server.post('/api/orchestrators/:projectId/start', {
    schema: {
      description: 'Start workflow execution for a project',
      tags: ['orchestrators'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', format: 'uuid' }
        },
        required: ['projectId']
      },
      body: {
        type: 'object',
        required: ['workflowPath'],
        properties: {
          workflowPath: { type: 'string', minLength: 1 },
          yoloMode: { type: 'boolean', default: false }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or missing authentication token',
          requestId: request.id
        } as APIError);
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate path parameters and body
        const params = ProjectIdParamsSchema.parse(request.params);
        const body = StartWorkflowRequestSchema.parse(request.body);

        // Start workflow
        const result = await orchestratorService.start(params.projectId, body);

        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: (error as Error).message,
          requestId: request.id
        } as APIError);
      }
    }
  });

  /**
   * POST /api/orchestrators/:projectId/pause - Pause workflow execution
   */
  server.post('/api/orchestrators/:projectId/pause', {
    schema: {
      description: 'Pause workflow execution for a project',
      tags: ['orchestrators'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', format: 'uuid' }
        },
        required: ['projectId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or missing authentication token',
          requestId: request.id
        } as APIError);
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate path parameters
        const params = ProjectIdParamsSchema.parse(request.params);

        // Pause workflow
        const result = await orchestratorService.pause(params.projectId);

        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: (error as Error).message,
          requestId: request.id
        } as APIError);
      }
    }
  });

  /**
   * POST /api/orchestrators/:projectId/resume - Resume paused workflow
   */
  server.post('/api/orchestrators/:projectId/resume', {
    schema: {
      description: 'Resume paused workflow execution for a project',
      tags: ['orchestrators'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          projectId: { type: 'string', format: 'uuid' }
        },
        required: ['projectId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (error) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or missing authentication token',
          requestId: request.id
        } as APIError);
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate path parameters
        const params = ProjectIdParamsSchema.parse(request.params);

        // Resume workflow
        const result = await orchestratorService.resume(params.projectId);

        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        reply.code(400).send({
          error: 'Bad Request',
          message: (error as Error).message,
          requestId: request.id
        } as APIError);
      }
    }
  });
}
