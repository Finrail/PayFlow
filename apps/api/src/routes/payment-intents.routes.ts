import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, paymentIntents } from '@payflow/database';
import { eq, and } from 'drizzle-orm';
import { validateStellarAddress, validateAsset, validatePaymentAmount } from '@payflow/stellar';
import type { CreatePaymentIntentRequest } from '@payflow/types';

export async function paymentIntentsRoutes(fastify: FastifyInstance) {
  // Create payment intent
  fastify.post<{ Body: CreatePaymentIntentRequest }>('/', async (request, reply) => {
    try {
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    if (reply.sent) return;

    const { amount, asset, recipient, metadata } = request.body;
    const idempotencyHeader = request.headers['idempotency-key'];
    const idempotencyKey = typeof idempotencyHeader === 'string'
      ? idempotencyHeader
      : request.body.idempotencyKey;
    const { merchantId } = (request as any).user;

    // Validate input
    if (!amount || !asset || !recipient) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'amount, asset, and recipient are required',
      });
    }

    // Validate amount
    if (!validatePaymentAmount(amount)) {
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

  fastify.get('/checkout/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDatabase();
    const [intent] = await db.select({
      id: paymentIntents.id,
      amount: paymentIntents.amount,
      asset: paymentIntents.asset,
      recipient: paymentIntents.recipient,
      status: paymentIntents.status,
      expiresAt: paymentIntents.expiresAt,
      transactionHash: paymentIntents.transactionHash,
      createdAt: paymentIntents.createdAt,
      updatedAt: paymentIntents.updatedAt,
    })
      .from(paymentIntents)
      .where(eq(paymentIntents.id, id))
      .limit(1);

    if (!intent) {
      return reply.status(404).send({ error: 'Payment intent not found' });
    }

    return reply.send(intent);
  });

  fastify.post('/checkout/:id/submit', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { transactionHash } = (request.body || {}) as { transactionHash?: string };

    if (!transactionHash || !/^[a-f0-9]{64}$/i.test(transactionHash)) {
      return reply.status(400).send({
        error: 'Invalid transaction hash',
        message: 'transactionHash must be a 64-character hexadecimal hash',
      });
    }

    const db = getDatabase();
    const [intent] = await db.select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, id))
      .limit(1);

    if (!intent) {
      return reply.status(404).send({ error: 'Payment intent not found' });
    }

    if (intent.status === 'CONFIRMED') {
      if (intent.transactionHash !== transactionHash) {
        return reply.status(409).send({ error: 'Payment intent is already confirmed' });
      }
      return reply.send({ status: intent.status, transactionHash });
    }

    if (intent.status === 'PENDING') {
      if (intent.transactionHash !== transactionHash) {
        return reply.status(409).send({ error: 'A different transaction is already pending' });
      }
      return reply.status(202).send({ status: intent.status, transactionHash });
    }

    if (intent.status !== 'CREATED') {
      return reply.status(409).send({ error: `Payment intent is ${intent.status.toLowerCase()}` });
    }

    if (intent.expiresAt && intent.expiresAt <= new Date()) {
      await db.update(paymentIntents)
        .set({ status: 'EXPIRED', updatedAt: new Date() })
        .where(and(
          eq(paymentIntents.id, id),
          eq(paymentIntents.status, 'CREATED')
        ));
      return reply.status(410).send({ error: 'Payment intent has expired' });
    }

    const [updatedIntent] = await db.update(paymentIntents)
      .set({ status: 'PENDING', transactionHash, updatedAt: new Date() })
      .where(and(
        eq(paymentIntents.id, id),
        eq(paymentIntents.status, 'CREATED')
      ))
      .returning({ status: paymentIntents.status, transactionHash: paymentIntents.transactionHash });

    if (!updatedIntent) {
      return reply.status(409).send({ error: 'Payment intent changed; refresh and try again' });
    }

    return reply.status(202).send(updatedIntent);
  });

  // Get payment intent by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    if (reply.sent) return;
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
  fastify.get('/', async (request, reply) => {
    try {
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    if (reply.sent) return;
    const { merchantId } = (request as any).user;
    const { limit = 50, offset = 0, status } = request.query as { limit?: number; offset?: number; status?: string };

    const db = getDatabase();

    const filters = [eq(paymentIntents.merchantId, merchantId)];
    if (status) {
      filters.push(eq(paymentIntents.status, status));
    }

    const results = await db.select()
      .from(paymentIntents)
      .where(and(...filters))
      .limit(limit)
      .offset(offset);

    return reply.send(results);
  });
}
