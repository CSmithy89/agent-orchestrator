/**
 * Escalation Routes - REST API endpoints for escalation management
 * Provides endpoints for listing, viewing, and responding to escalations with JWT authentication
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { escalationService } from '../services/escalation.service.js';
import {
  EscalationListFiltersSchema,
  EscalationResponseRequestSchema
} from '../types/escalation.types.js';
import { APIResponse, APIError } from '../types/api.types.js';

/**
 * Path parameters schema for escalation ID
 */
const EscalationIdParamsSchema = z.object({
  id: z.string()
});

/**
 * Register escalation routes with Fastify
 */
export async function registerEscalationRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /api/escalations - List all escalations with optional filters
   */
  server.get('/api/escalations', {
    schema: {
      description: 'List all escalations with optional filters (status, projectId)',
      tags: ['escalations'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'resolved', 'cancelled']
          },
          projectId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  projectId: { type: 'string' },
                  workflowId: { type: 'string' },
                  step: { type: 'number' },
                  question: { type: 'string' },
                  aiReasoning: { type: 'string' },
                  confidence: { type: 'number' },
                  context: { type: 'object' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  resolvedAt: { type: 'string' },
                  response: {},
                  resolutionTime: { type: 'number' }
                }
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
        // Validate query parameters
        const query = EscalationListFiltersSchema.parse(request.query);

        // List escalations
        const escalations = await escalationService.listEscalations(query);

        const response: APIResponse<typeof escalations> = {
          success: true,
          data: escalations,
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
   * GET /api/escalations/:id - Get escalation details
   */
  server.get('/api/escalations/:id', {
    schema: {
      description: 'Get escalation details (question, context, reasoning)',
      tags: ['escalations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                projectId: { type: 'string' },
                workflowId: { type: 'string' },
                step: { type: 'number' },
                question: { type: 'string' },
                aiReasoning: { type: 'string' },
                confidence: { type: 'number' },
                context: { type: 'object' },
                status: { type: 'string' },
                createdAt: { type: 'string' },
                resolvedAt: { type: 'string' },
                response: {},
                resolutionTime: { type: 'number' }
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
        const params = EscalationIdParamsSchema.parse(request.params);

        // Get escalation details
        const escalation = await escalationService.getEscalation(params.id);

        const response: APIResponse<typeof escalation> = {
          success: true,
          data: escalation,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          reply.code(404).send({
            error: 'Not Found',
            message: (error as Error).message,
            requestId: request.id
          } as APIError);
        } else {
          reply.code(400).send({
            error: 'Bad Request',
            message: (error as Error).message,
            requestId: request.id
          } as APIError);
        }
      }
    }
  });

  /**
   * POST /api/escalations/:id/respond - Submit response to escalation
   */
  server.post('/api/escalations/:id/respond', {
    schema: {
      description: 'Submit response to escalation, mark as resolved, and resume workflow',
      tags: ['escalations'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['response'],
        properties: {
          response: {
            description: 'Response to the escalation (any type, cannot be empty)'
          }
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
                escalationId: { type: 'string' },
                resolvedAt: { type: 'string' }
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
        const params = EscalationIdParamsSchema.parse(request.params);
        const body = EscalationResponseRequestSchema.parse(request.body);

        // Respond to escalation
        const result = await escalationService.respondToEscalation(params.id, body);

        const response: APIResponse<typeof result> = {
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        if ((error as Error).message.includes('not found')) {
          reply.code(404).send({
            error: 'Not Found',
            message: (error as Error).message,
            requestId: request.id
          } as APIError);
        } else {
          reply.code(400).send({
            error: 'Bad Request',
            message: (error as Error).message,
            requestId: request.id
          } as APIError);
        }
      }
    }
  });
}
