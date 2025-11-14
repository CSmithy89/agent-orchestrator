/**
 * Fastify API Server
 * Production-ready REST API server with middleware, authentication, and documentation
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { v4 as uuidv4 } from 'uuid';
import { healthCheckHandler } from './health.js';
import { registerProjectRoutes } from './routes/projects.js';
import { registerOrchestratorRoutes } from './routes/orchestrators.js';
import { registerStateRoutes } from './routes/state.js';
import { registerEscalationRoutes } from './routes/escalations.js';
import { WebSocketHandler } from './routes/websocket.js';

export interface ServerConfig {
  port?: number;
  host?: string;
  jwtSecret?: string;
  corsOrigins?: string[];
}

// Store WebSocket handler globally for access
let wsHandler: WebSocketHandler | null = null;

export function getWebSocketHandler(): WebSocketHandler | null {
  return wsHandler;
}

export async function createServer(config: ServerConfig = {}): Promise<FastifyInstance> {
  const {
    port = Number(process.env.API_PORT) || 3000,
    host = process.env.API_HOST || '0.0.0.0',
    jwtSecret = config.jwtSecret ??
      process.env.JWT_SECRET ??
      (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
        ? 'development-secret-only'
        : (() => { throw new Error('JWT_SECRET is required in production'); })()),
    corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
  } = config;

  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    },
    requestIdLogLabel: 'requestId',
    requestIdHeader: 'x-request-id',
    genReqId: (req) => req.headers['x-request-id'] as string || uuidv4()
  });

  // Security middleware
  await server.register(helmet, {
    contentSecurityPolicy: false
  });

  // CORS
  await server.register(cors, {
    origin: corsOrigins,
    credentials: true
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes'
  });

  // JWT Authentication
  await server.register(jwt, {
    secret: jwtSecret
  });

  // OpenAPI Documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Agent Orchestrator API',
        description: 'REST API for Agent Orchestrator monitoring and control',
        version: '1.0.0'
      },
      servers: [
        {
          url: `http://${host}:${port}`,
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  await server.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  // Root endpoint
  server.get('/', async () => ({
    name: 'Agent Orchestrator API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  }));

  // Health endpoints
  server.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const { statusCode, body } = await healthCheckHandler();
    reply.code(statusCode).send(body);
  });

  server.get('/health/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    const { statusCode, body } = await healthCheckHandler();
    reply.code(statusCode).send({ ...body, ready: statusCode === 200 });
  });

  server.get('/health/live', async () => ({
    alive: true,
    timestamp: new Date().toISOString()
  }));

  server.get('/metrics', async () => ({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  }));

  // Register routes
  await registerProjectRoutes(server);
  await registerOrchestratorRoutes(server);
  await registerStateRoutes(server);
  await registerEscalationRoutes(server);

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, closing server gracefully...`);
      await server.close();
      process.exit(0);
    });
  });

  return server;
}

export async function startServer(config?: ServerConfig): Promise<FastifyInstance> {
  const server = await createServer(config);
  const port = config?.port || Number(process.env.API_PORT) || 3000;
  const host = config?.host || process.env.API_HOST || '0.0.0.0';
  const jwtSecret = config?.jwtSecret ??
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
      ? 'development-secret-only'
      : (() => { throw new Error('JWT_SECRET is required in production'); })());

  await server.listen({ port, host });
  console.log(`Server listening on ${host}:${port}`);
  console.log(`API Documentation available at http://${host}:${port}/docs`);

  // Initialize WebSocket server
  wsHandler = new WebSocketHandler(server.server, {
    jwtSecret,
    pingInterval: 30000
  });

  return server;
}
