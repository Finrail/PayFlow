import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@payflow/database';
import { paymentIntents, merchants } from '@payflow/database/schema';
import { eq, and } from 'drizzle-orm';
import { validateStellarAddress, validateAsset } from '@payflow/stellar';
import type { CreatePaymentIntentRequest } from '@payflow/types';

export async function paymentIntentsRoutes(fastify: FastifyInstance) {
  // Create payment intent
  fastify.post<{ Body: CreatePaymentIntentRequest }>('/', {
    onRequest: [fastify.authenticate, fastify.apiKeyAuth],
  }, async (request, reply) => {
    const { amount, asset, recipient, metadata, idempotencyKey } = request.body;
    const { merchantId } = (request as any).user;

    // Validate input
    if (!amount || !asset || !recipient) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'amount, asset, and recipient are required',
      });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return reply.status(400).send({
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
      });
    }

    // Validate Stellar address
    if (!validateStellarAddress(recipient)) {
      return reply.status(400).send({
        error: 'Invalid recipient',
        message: 'Invalid Stellar address',
      });
    }

    // Validate asset
    if (!validateAsset(asset)) {
      return reply.status(400).send({
        error: 'Invalid asset',
        message: 'Asset not supported',
      });
    }

    const db = getDatabase();

    // Check idempotency
    if (idempotencyKey) {
      const existingIntent = await db.select()
        .from(paymentIntents)
        .where(and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.idempotencyKey, idempotencyKey)
        ))
        .limit(1);

      if (existingIntent.length > 0) {
        return reply.send(existingIntent[0]);
      }
    }

    // Create payment intent
    const paymentIntentId = uuidv4();
    const paymentIntent = await db.insert(paymentIntents).values({
      id: paymentIntentId,
      merchantId,
      amount,
      asset,
      recipient,
      status: 'CREATED',
      metadata,
      idempotencyKey,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    }).returning();

    return reply.status(201).send(paymentIntent[0]);
  });

  // Get payment intent by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate, fastify.apiKeyAuth],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    const result = await db.select()
      .from(paymentIntents)
      .where(and(
        eq(paymentIntents.id, id),
        eq(paymentIntents.merchantId, merchantId)
      ))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'Payment intent not found',
        message: 'Payment intent not found or does not belong to this merchant',
      });
    }

    return reply.send(result[0]);
  });

  // List payment intents
  fastify.get('/', {
    onRequest: [fastify.authenticate, fastify.apiKeyAuth],
  }, async (request, reply) => {
    const { merchantId } = (request as any).user;
    const { limit = 50, offset = 0, status } = request.query as { limit?: number; offset?: number; status?: string };

    const db = getDatabase();

    let query = db.select()
      .from(paymentIntents)
      .where(eq(paymentIntents.merchantId, merchantId));

    if (status) {
      query = query.where(and(
        eq(paymentIntents.merchantId, merchantId),
        eq(paymentIntents.status, status)
      )) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return reply.send(results);
  });
}
