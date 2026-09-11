import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { getDatabase, apiKeys } from '@payflow/database';
import { eq, and } from 'drizzle-orm';

interface CreateApiKeyBody {
  name: string;
  expiresAt?: string;
}

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // Create API key
  fastify.post<{ Body: CreateApiKeyBody }>('/', {
    onRequest: [(fastify as any).authenticate],
  }, async (request, reply) => {
    const { name, expiresAt } = request.body;
    const { merchantId } = (request as any).user;

    if (!name) {
      return reply.status(400).send({
        error: 'Missing required field',
        message: 'name is required',
      });
    }

    const db = getDatabase();

    // Generate API key
    const keyId = uuidv4();
    const keySecret = crypto.randomBytes(32).toString('hex');
    const apiKey = `pk_${keyId}_${keySecret}`;
    const keyPrefix = `pk_${keyId.substring(0, 8)}`;

    // Hash the API key
    const keyHash = await bcrypt.hash(apiKey, 10);

    // Create API key record
    const apiKeyId = uuidv4();
    await db.insert(apiKeys).values({
      id: apiKeyId,
      merchantId,
      keyHash,
      keyPrefix,
      name,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return reply.status(201).send({
      id: apiKeyId,
      key: apiKey,
      keyPrefix,
      name,
      expiresAt,
      createdAt: new Date().toISOString(),
    });
  });

  // List API keys
  fastify.get('/', {
    onRequest: [(fastify as any).authenticate],
  }, async (request, reply) => {
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.merchantId, merchantId));

    return reply.send(keys);
  });

  // Delete API key
  fastify.delete<{ Params: { id: string } }>('/:id', {
    onRequest: [(fastify as any).authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    // Verify the API key belongs to the merchant
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.merchantId, merchantId)))
      .returning();

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'API key not found',
        message: 'API key not found or does not belong to you',
      });
    }

    return reply.send({
      message: 'API key deleted successfully',
    });
  });

  // Revoke API key (soft delete)
  fastify.patch<{ Params: { id: string } }>('/:id/revoke', {
    onRequest: [(fastify as any).authenticate],
  }, async (request, reply) => {
    const { id } = request.params;
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    const result = await db
      .update(apiKeys)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.merchantId, merchantId)))
      .returning();

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'API key not found',
        message: 'API key not found or does not belong to you',
      });
    }

    return reply.send({
      message: 'API key revoked successfully',
    });
  });
}
