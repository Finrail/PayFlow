import { FastifyPluginAsync } from 'fastify';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // JWT authentication decorator
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // API key authentication decorator
  fastify.decorate('apiKeyAuth', async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If JWT auth already passed, skip API key auth
      if (request.user) {
        return;
      }
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const apiKey = authHeader.substring(7);

    // For MVP, we'll implement simple API key validation
    // In production, this would verify against the database
    if (!apiKey || apiKey.length < 10) {
      return reply.status(401).send({
        error: 'Invalid API key',
        message: 'API key is invalid',
      });
    }

    // TODO: Implement proper API key validation against database
    // For now, we'll trust the JWT auth if it passed
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Valid authentication required',
      });
    }
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    apiKeyAuth: any;
  }
}

export default authPlugin;
