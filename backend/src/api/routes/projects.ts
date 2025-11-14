/**
 * Project Routes - REST API endpoints for project management
 * Provides CRUD operations for projects with JWT authentication
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';
import { ProjectSchema, ProjectStatusSchema, ProjectPhaseSchema } from '../schemas/api.schemas.js';
import { APIResponse, APIError } from '../types/api.types.js';

/**
 * Query parameters schema for list projects
 */
const ListProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * Request body schema for create project
 */
const CreateProjectBodySchema = z.object({
  name: z.string().min(1).max(255),
  config: z.record(z.unknown()).optional()
});

/**
 * Request body schema for update project
 */
const UpdateProjectBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: ProjectStatusSchema.optional(),
  phase: ProjectPhaseSchema.optional()
});

/**
 * Path parameters schema for project ID
 */
const ProjectIdParamsSchema = z.object({
  id: z.string().uuid()
});

/**
 * Register project routes with Fastify
 */
export async function registerProjectRoutes(server: FastifyInstance): Promise<void> {
  /**
   * GET /api/projects - List all projects with pagination
   */
  server.get('/api/projects', {
    schema: {
      description: 'List all projects with pagination',
      tags: ['projects'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'number', minimum: 0, default: 0 }
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
                  name: { type: 'string' },
                  status: { type: 'string' },
                  phase: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
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
        const query = ListProjectsQuerySchema.parse(request.query);

        // Get projects
        const projects = await projectService.listProjects({
          limit: query.limit,
          offset: query.offset
        });

        const response: APIResponse<typeof projects> = {
          success: true,
          data: projects,
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
   * POST /api/projects - Create new project
   */
  server.post('/api/projects', {
    schema: {
      description: 'Create a new project',
      tags: ['projects'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          config: { type: 'object' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'string' },
                phase: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
        // Validate request body
        const body = CreateProjectBodySchema.parse(request.body);

        // Create project
        const project = await projectService.createProject(body);

        const response: APIResponse<typeof project> = {
          success: true,
          data: project,
          timestamp: new Date().toISOString()
        };

        reply.code(201).send(response);
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
   * GET /api/projects/:id - Get project details
   */
  server.get('/api/projects/:id', {
    schema: {
      description: 'Get project details by ID',
      tags: ['projects'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
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
                id: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'string' },
                phase: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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

        // Get project
        const project = await projectService.getProject(params.id);

        if (!project) {
          reply.code(404).send({
            error: 'Not Found',
            message: `Project with ID ${params.id} not found`,
            requestId: request.id
          } as APIError);
          return;
        }

        const response: APIResponse<typeof project> = {
          success: true,
          data: project,
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
   * PATCH /api/projects/:id - Update project
   */
  server.patch('/api/projects/:id', {
    schema: {
      description: 'Update project metadata',
      tags: ['projects'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'error'] },
          phase: { type: 'string', enum: ['analysis', 'planning', 'solutioning', 'implementation', 'review'] }
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
                id: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'string' },
                phase: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
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
        const body = UpdateProjectBodySchema.parse(request.body);

        // Update project
        const project = await projectService.updateProject(params.id, body);

        const response: APIResponse<typeof project> = {
          success: true,
          data: project,
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        if ((error as Error).message === 'Project not found') {
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
   * DELETE /api/projects/:id - Delete project
   */
  server.delete('/api/projects/:id', {
    schema: {
      description: 'Delete a project',
      tags: ['projects'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
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

        // Delete project
        await projectService.deleteProject(params.id);

        const response: APIResponse<Record<string, never>> = {
          success: true,
          data: {},
          timestamp: new Date().toISOString()
        };

        reply.code(200).send(response);
      } catch (error) {
        if ((error as Error).message === 'Project not found') {
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
