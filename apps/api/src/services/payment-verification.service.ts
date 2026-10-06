import { getDatabase, paymentIntents, payments } from '@payflow/database';
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

  if (intent.status !== 'PENDING' || intent.transactionHash !== transactionHash) {
    throw new Error('Payment intent is not waiting for this transaction');
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
      .where(and(
        eq(paymentIntents.id, paymentIntentId),
        eq(paymentIntents.status, 'PENDING'),
        eq(paymentIntents.transactionHash, transactionHash)
      ));

    return { status: 'invalid', intent };
  }

  // Get transaction details
  const txDetails = await getTransactionDetails(transactionHash);

  return db.transaction(async (tx) => {
    const [currentIntent] = await tx.select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, paymentIntentId))
      .for('update');

    if (!currentIntent) {
      throw new Error('Payment intent not found');
    }

    if (currentIntent.status === 'CONFIRMED') {
      return { status: 'already_confirmed', intent: currentIntent };
    }

    if (currentIntent.status !== 'PENDING' || currentIntent.transactionHash !== transactionHash) {
      throw new Error('Payment intent is no longer waiting for this transaction');
    }

    await tx.insert(payments).values({
      id: crypto.randomUUID(),
      paymentIntentId,
      amount: currentIntent.amount,
      asset: currentIntent.asset,
      fromAddress: txDetails.source_account,
      toAddress: currentIntent.recipient,
      transactionHash,
    });

    const [confirmedIntent] = await tx.update(paymentIntents)
      .set({ status: 'CONFIRMED', updatedAt: new Date() })
      .where(and(
        eq(paymentIntents.id, paymentIntentId),
        eq(paymentIntents.status, 'PENDING'),
        eq(paymentIntents.transactionHash, transactionHash)
      ))
      .returning();

    if (!confirmedIntent) {
      throw new Error('Payment intent changed while confirming transaction');
    }

    return { status: 'confirmed', intent: confirmedIntent };
  });
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
      .where(and(
        eq(paymentIntents.id, intent.id),
        eq(paymentIntents.status, 'CREATED'),
        lt(paymentIntents.expiresAt, new Date())
      ));
  }

  return { expired: expiredIntents.length };
}
