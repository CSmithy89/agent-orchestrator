/**
 * State Routes - REST API endpoints for workflow and sprint state queries
 * Provides endpoints for workflow status, sprint status, and story information with JWT authentication
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { stateService } from '../services/state.service.js';
import { StoryListFiltersSchema } from '../types/state.types.js';
import { APIResponse, APIError } from '../types/api.types.js';

/**
 * Path parameters schema for project ID
 */
const ProjectIdParamsSchema = z.object({
  id: z.string().uuid()
});

/**
 * Path parameters schema for story ID
 */
const StoryIdParamsSchema = z.object({
  id: z.string().uuid(),
  storyId: z.string()
});

/**
 * Register state routes with Fastify
 */
export async function registerStateRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /api/projects/:id/workflow-status - Get workflow state
   */
  server.get('/api/projects/:id/workflow-status', {
    schema: {
      description: 'Get workflow state (current phase, steps) for a project',
      tags: ['state'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
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
                projectId: { type: 'string' },
                currentPhase: { type: 'string' },
                phases: { type: 'array' },
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

        // Get workflow status
        const status = await stateService.getWorkflowStatus(params.id);

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
   * GET /api/projects/:id/sprint-status - Get sprint state
   */
  server.get('/api/projects/:id/sprint-status', {
    schema: {
      description: 'Get sprint state (epics, stories, status) for a project',
      tags: ['state'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
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
                projectId: { type: 'string' },
                project: { type: 'string' },
                generatedAt: { type: 'string' },
                epics: { type: 'array' },
                stories: { type: 'array' }
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

        // Get sprint status
        const status = await stateService.getSprintStatus(params.id);

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
   * GET /api/projects/:id/stories - List all stories with optional filters
   */
  server.get('/api/projects/:id/stories', {
    schema: {
      description: 'List all stories with status filters',
      tags: ['state'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        },
        required: ['id']
      },
      querystring: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['backlog', 'drafted', 'ready-for-dev', 'in-progress', 'review', 'done']
          },
          epic: { type: 'string' }
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
                  epicId: { type: 'string' },
                  title: { type: 'string' },
                  status: { type: 'string' },
                  assignee: { type: 'string' },
                  points: { type: 'number' },
                  prLink: { type: 'string' }
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
        // Validate path parameters and query
        const params = ProjectIdParamsSchema.parse(request.params);
        const query = StoryListFiltersSchema.parse(request.query);

        // List stories with filters
        const stories = await stateService.listStories(params.id, query);

        const response: APIResponse<typeof stories> = {
          success: true,
          data: stories,
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
   * GET /api/projects/:id/stories/:storyId - Get detailed story information
   */
  server.get('/api/projects/:id/stories/:storyId', {
    schema: {
      description: 'Get detailed story information',
      tags: ['state'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          storyId: { type: 'string' }
        },
        required: ['id', 'storyId']
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
                epicId: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string' },
                description: { type: 'string' },
                acceptanceCriteria: { type: 'array' },
                tasks: { type: 'array' },
                dependencies: { type: 'array' },
                assignee: { type: 'string' },
                points: { type: 'number' }
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
        const params = StoryIdParamsSchema.parse(request.params);

        // Get story detail
        const story = await stateService.getStoryDetail(params.id, params.storyId);

        const response: APIResponse<typeof story> = {
          success: true,
          data: story,
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
