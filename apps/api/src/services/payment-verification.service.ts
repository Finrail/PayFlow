import { getDatabase } from '@payflow/database';
import { paymentIntents, payments } from '@payflow/database/schema';
import { eq, and, lt } from 'drizzle-orm';
import { validateTransaction, getTransactionDetails } from '@payflow/stellar';

export async function verifyAndConfirmPayment(paymentIntentId: string, transactionHash: string) {
  const db = getDatabase();

  // Get payment intent
  const intentResult = await db.select()
    .from(paymentIntents)
    .where(eq(paymentIntents.id, paymentIntentId))
    .limit(1);

  if (intentResult.length === 0) {
    throw new Error('Payment intent not found');
  }

  const intent = intentResult[0];

  // Check if already confirmed
  if (intent.status === 'CONFIRMED') {
    return { status: 'already_confirmed', intent };
  }

  // Verify transaction
  const isValid = await validateTransaction(
    transactionHash,
    intent.recipient,
    intent.amount,
    intent.asset
  );

  if (!isValid) {
    // Update status to failed
    await db.update(paymentIntents)
      .set({ 
        status: 'FAILED',
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, paymentIntentId));

    return { status: 'invalid', intent };
  }

  // Get transaction details
  const txDetails = await getTransactionDetails(transactionHash);

  // Create payment record
  const paymentId = crypto.randomUUID();
  await db.insert(payments).values({
    id: paymentId,
    paymentIntentId,
    amount: intent.amount,
    asset: intent.asset,
    fromAddress: txDetails.source_account,
    toAddress: intent.recipient,
    transactionHash,
  });

  // Update payment intent status
  await db.update(paymentIntents)
    .set({
      status: 'CONFIRMED',
      transactionHash,
      updatedAt: new Date()
    })
    .where(eq(paymentIntents.id, paymentIntentId));

  return { status: 'confirmed', intent };
}

export async function checkPaymentExpiration() {
  const db = getDatabase();

  const expiredIntents = await db.select()
    .from(paymentIntents)
    .where(and(
      eq(paymentIntents.status, 'CREATED'),
      lt(paymentIntents.expiresAt, new Date())
    ));

  for (const intent of expiredIntents) {
    await db.update(paymentIntents)
      .set({
        status: 'EXPIRED',
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, intent.id));
  }

  return { expired: expiredIntents.length };
}
