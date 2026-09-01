import crypto from 'crypto';
import { getDatabase } from '@payflow/database';
import { webhooks, webhookDeliveries } from '@payflow/database/schema';
import { eq, and } from 'drizzle-orm';
import type { WebhookPayload, WebhookEvent } from '@payflow/types';

export function signWebhook(payload: WebhookPayload, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

export async function deliverWebhook(
  merchantId: string,
  event: WebhookEvent,
  payload: WebhookPayload
) {
  const db = getDatabase();

  // Get active webhooks for this merchant
  const webhookList = await db.select()
    .from(webhooks)
    .where(and(
      eq(webhooks.merchantId, merchantId),
      eq(webhooks.isActive, true)
    ));

  for (const webhook of webhookList) {
    // Check if this webhook is subscribed to this event
    if (!webhook.events.includes(event)) {
      continue;
    }

    // Create delivery record
    const deliveryId = crypto.randomUUID();
    await db.insert(webhookDeliveries).values({
      id: deliveryId,
      webhookId: webhook.id,
      event,
      payload,
      attemptNumber: 1,
    });

    // Attempt delivery
    await attemptDelivery(deliveryId, webhook.url, webhook.secret, payload);
  }
}

async function attemptDelivery(
  deliveryId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
  attemptNumber: number = 1
) {
  const db = getDatabase();

  try {
    const signature = signWebhook(payload, secret);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PayFlow-Signature': signature,
        'X-PayFlow-Event': payload.event,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(parseInt(process.env.WEBHOOK_TIMEOUT_MS || '5000')),
    });

    const statusCode = response.status;
    const responseText = await response.text();

    // Update delivery record
    if (statusCode >= 200 && statusCode < 300) {
      await db.update(webhookDeliveries)
        .set({
          statusCode,
          response: responseText,
          deliveredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, deliveryId));
    } else {
      // Schedule retry with exponential backoff
      const maxRetries = parseInt(process.env.WEBHOOK_MAX_RETRIES || '5');
      
      if (attemptNumber < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber), 60000); // Max 1 minute
        const nextRetryAt = new Date(Date.now() + backoffMs);

        await db.update(webhookDeliveries)
          .set({
            statusCode,
            response: responseText,
            attemptNumber: attemptNumber + 1,
            nextRetryAt,
            updatedAt: new Date(),
          })
          .where(eq(webhookDeliveries.id, deliveryId));

        // Schedule retry
        setTimeout(() => {
          attemptDelivery(deliveryId, url, secret, payload, attemptNumber + 1);
        }, backoffMs);
      } else {
        // Max retries reached
        await db.update(webhookDeliveries)
          .set({
            statusCode,
            response: responseText,
            attemptNumber: attemptNumber + 1,
            updatedAt: new Date(),
          })
          .where(eq(webhookDeliveries.id, deliveryId));
      }
    }
  } catch (error) {
    console.error('Webhook delivery failed:', error);

    // Schedule retry
    const maxRetries = parseInt(process.env.WEBHOOK_MAX_RETRIES || '5');
    
    if (attemptNumber < maxRetries) {
      const backoffMs = Math.min(1000 * Math.pow(2, attemptNumber), 60000);
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await db.update(webhookDeliveries)
        .set({
          response: error instanceof Error ? error.message : 'Unknown error',
          attemptNumber: attemptNumber + 1,
          nextRetryAt,
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, deliveryId));

      setTimeout(() => {
        attemptDelivery(deliveryId, url, secret, payload, attemptNumber + 1);
      }, backoffMs);
    }
  }
}

export async function processPendingWebhooks() {
  const db = getDatabase();

  const pendingDeliveries = await db.select()
    .from(webhookDeliveries)
    .where(and(
      lt(webhookDeliveries.nextRetryAt, new Date())
    ))
    .limit(100);

  for (const delivery of pendingDeliveries) {
    if (delivery.deliveredAt) continue;

    const webhook = await db.select()
      .from(webhooks)
      .where(eq(webhooks.id, delivery.webhookId))
      .limit(1);

    if (webhook.length > 0) {
      await attemptDelivery(
        delivery.id,
        webhook[0].url,
        webhook[0].secret,
        delivery.payload as WebhookPayload,
        delivery.attemptNumber
      );
    }
  }

  return { processed: pendingDeliveries.length };
}
