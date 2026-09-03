import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, invoices, paymentIntents } from '@payflow/database';
import { eq, and } from 'drizzle-orm';
import type { CreateInvoiceRequest } from '@payflow/types';

export async function invoiceRoutes(fastify: FastifyInstance) {
  // Create invoice
  fastify.post<{ Body: CreateInvoiceRequest }>('/', async (request, reply) => {
    try {
      await (fastify as any).authenticate(request, reply);
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }

    const { invoiceNumber, customerName, customerEmail, description, amount, asset, dueDate, metadata } = request.body;
    const { merchantId } = (request as any).user;

    // Validate input
    if (!invoiceNumber || !amount || !asset) {
      return reply.status(400).send({
        error: 'Missing required fields',
        message: 'invoiceNumber, amount, and asset are required',
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

    const db = getDatabase();

    // Check if invoice number already exists
    const existingInvoice = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.merchantId, merchantId),
        eq(invoices.invoiceNumber, invoiceNumber)
      ))
      .limit(1);

    if (existingInvoice.length > 0) {
      return reply.status(409).send({
        error: 'Invoice number already exists',
        message: 'An invoice with this number already exists',
      });
    }

    // Create invoice
    const invoiceId = uuidv4();
    const invoice = await db.insert(invoices).values({
      id: invoiceId,
      merchantId,
      invoiceNumber,
      customerName,
      customerEmail,
      description,
      amount,
      asset,
      status: 'DRAFT',
      dueDate: dueDate ? new Date(dueDate) : null,
      metadata,
    }).returning();

    return reply.status(201).send(invoice[0]);
  });

  // Get invoice by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      await (fastify as any).authenticate(request, reply);
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    const { id } = request.params as { id: string };
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    const result = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.merchantId, merchantId)
      ))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'Invoice not found',
        message: 'Invoice not found or does not belong to this merchant',
      });
    }

    return reply.send(result[0]);
  });

  // List invoices
  fastify.get('/', async (request, reply) => {
    try {
      await (fastify as any).authenticate(request, reply);
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    const { merchantId } = (request as any).user;
    const { limit = 50, offset = 0, status } = request.query as { limit?: number; offset?: number; status?: string };

    const db = getDatabase();

    let query = db.select()
      .from(invoices)
      .where(eq(invoices.merchantId, merchantId));

    if (status) {
      query = query.where(and(
        eq(invoices.merchantId, merchantId),
        eq(invoices.status, status)
      )) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return reply.send(results);
  });

  // Update invoice
  fastify.patch<{ Body: Partial<CreateInvoiceRequest> }>('/:id', async (request, reply) => {
    try {
      await (fastify as any).authenticate(request, reply);
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    const { id } = request.params as { id: string };
    const { merchantId } = (request as any).user;
    const updates = request.body;

    const db = getDatabase();

    const result = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.merchantId, merchantId)
      ))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'Invoice not found',
        message: 'Invoice not found or does not belong to this merchant',
      });
    }

    const invoice = result[0];

    // Only allow updates to DRAFT invoices
    if (invoice.status !== 'DRAFT') {
      return reply.status(400).send({
        error: 'Cannot update invoice',
        message: 'Only DRAFT invoices can be updated',
      });
    }

    const updatedInvoice = await db.update(invoices)
      .set({
        ...updates,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    return reply.send(updatedInvoice[0]);
  });

  // Send invoice (change status to OPEN)
  fastify.post('/:id/send', async (request, reply) => {
    try {
      await (fastify as any).authenticate(request, reply);
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    const { id } = request.params as { id: string };
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    const result = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.merchantId, merchantId)
      ))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'Invoice not found',
        message: 'Invoice not found or does not belong to this merchant',
      });
    }

    const invoice = result[0];

    if (invoice.status !== 'DRAFT') {
      return reply.status(400).send({
        error: 'Cannot send invoice',
        message: 'Only DRAFT invoices can be sent',
      });
    }

    // Create payment intent for the invoice
    const paymentIntentId = uuidv4();
    await db.insert(paymentIntents).values({
      id: paymentIntentId,
      merchantId,
      amount: invoice.amount,
      asset: invoice.asset,
      recipient: 'G...', // Would be merchant's Stellar address
      status: 'CREATED',
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      expiresAt: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days or due date
    });

    // Update invoice status and link to payment intent
    const updatedInvoice = await db.update(invoices)
      .set({
        status: 'OPEN',
        paymentIntentId,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    return reply.send(updatedInvoice[0]);
  });

  // Cancel invoice
  fastify.post('/:id/cancel', async (request, reply) => {
    try {
      await (fastify as any).authenticate(request, reply);
      await (fastify as any).apiKeyAuth(request, reply);
    } catch (err) {
      return reply.send(err);
    }
    const { id } = request.params as { id: string };
    const { merchantId } = (request as any).user;

    const db = getDatabase();

    const result = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.merchantId, merchantId)
      ))
      .limit(1);

    if (result.length === 0) {
      return reply.status(404).send({
        error: 'Invoice not found',
        message: 'Invoice not found or does not belong to this merchant',
      });
    }

    const invoice = result[0];

    if (invoice.status === 'PAID') {
      return reply.status(400).send({
        error: 'Cannot cancel invoice',
        message: 'Paid invoices cannot be cancelled',
      });
    }

    const updatedInvoice = await db.update(invoices)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    return reply.send(updatedInvoice[0]);
  });
}
