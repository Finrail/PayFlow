import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { getDatabase, apiKeys, merchants } from '@payflow/database';
import { eq } from 'drizzle-orm';

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

    // Validate API key format
    if (!apiKey || !apiKey.startsWith('pk_') || apiKey.length < 20) {
      return reply.status(401).send({
        error: 'Invalid API key',
        message: 'API key format is invalid',
      });
    }

    // Verify API key against database
    const db = getDatabase();
    
    // Get all active API keys and check if any match
    const allApiKeys = await db
      .select({
        id: apiKeys.id,
        keyHash: apiKeys.keyHash,
        merchantId: apiKeys.merchantId,
        isActive: apiKeys.isActive,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.isActive, true));

    let validApiKey = null;
    for (const keyRecord of allApiKeys) {
      const isValid = await bcrypt.compare(apiKey, keyRecord.keyHash);
      if (isValid) {
        // Check if key is expired
        if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
          return reply.status(401).send({
            error: 'API key expired',
            message: 'API key has expired',
          });
        }
        validApiKey = keyRecord;
        break;
      }
    }

    if (!validApiKey) {
      return reply.status(401).send({
        error: 'Invalid API key',
        message: 'API key is invalid or inactive',
      });
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, validApiKey.id));

    // Get merchant details
    const merchantResult = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, validApiKey.merchantId))
      .limit(1);

    if (merchantResult.length === 0) {
      return reply.status(401).send({
        error: 'Merchant not found',
        message: 'Associated merchant not found',
      });
    }

    // Set user context from API key
    request.user = {
      userId: merchantResult[0].userId,
      merchantId: validApiKey.merchantId,
      authenticatedVia: 'api_key',
    };
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    apiKeyAuth: any;
  }
}

export default authPlugin;
