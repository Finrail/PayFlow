import { getDatabase, paymentIntents } from '@payflow/database';
import { eq, and, lt } from 'drizzle-orm';
import { verifyAndConfirmPayment, checkPaymentExpiration } from './payment-verification.service';
import { deliverWebhook } from './webhook.service';
import type { WebhookPayload } from '@payflow/types';

class PaymentMonitorService {
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('Payment monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting payment monitor service');

    // Run every 10 seconds
    this.interval = setInterval(async () => {
      await this.checkPendingPayments();
      await this.checkPaymentExpiration();
    }, 10000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Payment monitor service stopped');
  }

  private async checkPendingPayments() {
    try {
      const db = getDatabase();

      // Get pending payment intents that have a transaction hash
      const pendingPayments = await db.select()
        .from(paymentIntents)
        .where(eq(paymentIntents.status, 'PENDING'))
        .limit(50);

      for (const payment of pendingPayments) {
        if (!payment.transactionHash) continue;

        try {
          const result = await verifyAndConfirmPayment(payment.id, payment.transactionHash);

          if (result.status === 'confirmed') {
            // Trigger webhook
            const payload: WebhookPayload = {
              event: 'payment.confirmed',
              payment_id: payment.id,
              transaction_hash: payment.transactionHash,
              amount: payment.amount,
              asset: payment.asset,
              timestamp: new Date().toISOString(),
            };

            await deliverWebhook(payment.merchantId, 'payment.confirmed', payload);
          } else if (result.status === 'invalid') {
            // Trigger failed webhook
            const payload: WebhookPayload = {
              event: 'payment.failed',
              payment_id: payment.id,
              transaction_hash: payment.transactionHash,
              amount: payment.amount,
              asset: payment.asset,
              timestamp: new Date().toISOString(),
            };

            await deliverWebhook(payment.merchantId, 'payment.failed', payload);
          }
        } catch (error) {
          console.error(`Error verifying payment ${payment.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in payment monitor:', error);
    }
  }

  async checkPaymentExpiration() {
    try {
      const result = await checkPaymentExpiration();
      if (result.expired > 0) {
        console.log(`Expired ${result.expired} payment intents`);
      }
    } catch (error) {
      console.error('Error checking payment expiration:', error);
    }
  }
}

export const paymentMonitor = new PaymentMonitorService();
