import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface LoginBody {
  username: string;
}

/**
 * Authentication routes
 */
export async function authRoutes(server: FastifyInstance): Promise<void> {
  /**
   * Development-only login endpoint
   * Generates a JWT token for testing without real authentication
   */
  server.post<{ Body: LoginBody }>(
    '/api/dev-login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['username'],
          properties: {
            username: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'This endpoint is only available in development mode'
        });
      }

      const { username } = request.body;

      // Generate a JWT token for the user
      const token = server.jwt.sign(
        {
          userId: `dev-${username}`,
          username
        },
        {
          expiresIn: '24h'
        }
      );

      return reply.send({
        token,
        user: {
          id: `dev-${username}`,
          username
        }
      });
    }
  );
}
