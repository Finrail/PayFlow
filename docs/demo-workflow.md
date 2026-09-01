# PayFlow Demo Workflow

This document provides a step-by-step guide to test the end-to-end payment flow on Stellar Testnet.

## Prerequisites

- PayFlow application running locally
- PostgreSQL database running
- Stellar Testnet account with funds
- Soroban CLI installed (optional, for contract interaction)

## Setup

### 1. Start the Application

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run database migrations
pnpm db:generate
pnpm db:migrate

# Start the API
pnpm --filter @payflow/api dev

# Start the web application (in another terminal)
pnpm --filter frontend dev
```

### 2. Get Stellar Testnet Funds

1. Create a Stellar testnet account at [Stellar Laboratory](https://laboratory.stellar.org/)
2. Copy your public key
3. Fund your account using Friendbot:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### 3. Create a Merchant Account

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@payflow.io",
    "password": "SecurePassword123!",
    "name": "Demo Merchant",
    "businessName": "Demo Business"
  }'
```

Save the response - you'll need the merchant ID and access token.

### 4. Login and Get API Key

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@payflow.io",
    "password": "SecurePassword123!"
  }'
```

Save the JWT token from the response.

## Demo Scenario: Selling a Digital Product

### Step 1: Create a Payment Intent

Create a payment intent for a $50 USDC digital product:

```bash
curl -X POST http://localhost:3001/api/v1/payment-intents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Idempotency-Key: demo-payment-001" \
  -d '{
    "amount": "50",
    "asset": "USDC",
    "recipient": "YOUR_STELLAR_PUBLIC_KEY",
    "metadata": {
      "product_name": "Premium Course",
      "product_id": "course-001",
      "customer_email": "customer@example.com"
    }
  }'
```

**Expected Response:**
```json
{
  "id": "pi_xxxxxxxxxxxxxxxx",
  "merchantId": "merchant_xxx",
  "amount": "50",
  "asset": "USDC",
  "recipient": "G...",
  "status": "CREATED",
  "expiresAt": "2026-09-02T10:00:00Z",
  "createdAt": "2026-09-01T10:00:00Z"
}
```

Save the payment intent ID.

### Step 2: Generate Payment Link

The payment link is automatically generated:
```
http://localhost:3000/pay/pi_xxxxxxxxxxxxxxxx
```

### Step 3: Open Payment Link

Open the payment link in your browser:
```
http://localhost:3000/pay/pi_xxxxxxxxxxxxxxxx
```

You should see:
- Payment amount and asset
- Payment status (CREATED)
- QR code for mobile wallet
- "Connect Stellar Wallet" button

### Step 4: Connect Wallet

1. Click "Connect Stellar Wallet"
2. If you don't have a Stellar wallet extension, you'll be directed to install one
3. Approve the connection in your wallet

### Step 5: Make Payment

1. Click "Pay 50 USDC"
2. Your wallet will open with the payment details
3. Review the transaction:
   - Destination: Your recipient address
   - Amount: 50 USDC
   - Asset: USDC (Testnet)
4. Sign and submit the transaction

### Step 6: Monitor Payment Status

The payment link page will automatically poll for payment status. You should see:
- Status changes to "PENDING"
- Transaction hash appears
- Status changes to "CONFIRMED" after verification

### Step 7: Verify Payment via API

Check the payment status via API:

```bash
curl http://localhost:3001/api/v1/payment-intents/pi_xxxxxxxxxxxxxxxx \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "id": "pi_xxxxxxxxxxxxxxxx",
  "merchantId": "merchant_xxx",
  "amount": "50",
  "asset": "USDC",
  "recipient": "G...",
  "status": "CONFIRMED",
  "transactionHash": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "createdAt": "2026-09-01T10:00:00Z",
  "updatedAt": "2026-09-01T10:05:00Z"
}
```

### Step 8: View Transaction on Stellar Explorer

Open the transaction in Stellar Explorer:
```
https://stellar.expert/explorer/testnet/tx/TRANSACTION_HASH
```

You should see:
- Transaction details
- Payment operation
- Success status

## Demo Scenario: Invoice Payment

### Step 1: Create an Invoice

```bash
curl -X POST http://localhost:3001/api/v1/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "invoiceNumber": "INV-2026-001",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "description": "Web Development Services",
    "amount": "500",
    "asset": "USDC",
    "dueDate": "2026-10-01"
  }'
```

**Expected Response:**
```json
{
  "id": "inv_xxxxxxxxxxxxxxxx",
  "merchantId": "merchant_xxx",
  "invoiceNumber": "INV-2026-001",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "description": "Web Development Services",
  "amount": "500",
  "asset": "USDC",
  "status": "DRAFT",
  "createdAt": "2026-09-01T10:00:00Z"
}
```

### Step 2: Send Invoice

```bash
curl -X POST http://localhost:3001/api/v1/invoices/inv_xxxxxxxxxxxxxxxx/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "id": "inv_xxxxxxxxxxxxxxxx",
  "status": "OPEN",
  "paymentIntentId": "pi_xxxxxxxxxxxxxxxx",
  "updatedAt": "2026-09-01T10:01:00Z"
}
```

### Step 3: Pay Invoice

Open the payment link for the invoice:
```
http://localhost:3000/pay/pi_xxxxxxxxxxxxxxxx
```

Follow the same payment flow as the previous demo.

### Step 4: Check Invoice Status

```bash
curl http://localhost:3001/api/v1/invoices/inv_xxxxxxxxxxxxxxxx \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "id": "inv_xxxxxxxxxxxxxxxx",
  "status": "PAID",
  "paymentIntentId": "pi_xxxxxxxxxxxxxxxx",
  "paidAt": "2026-09-01T10:05:00Z"
}
```

## Demo Scenario: Webhook Integration

### Step 1: Create a Webhook Endpoint

Create a simple webhook receiver (using ngrok for local testing):

```bash
# Install ngrok
# Start ngrok
ngrok http 3000
```

### Step 2: Register Webhook

```bash
curl -X POST http://localhost:3001/api/v1/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "url": "https://your-ngrok-url.ngrok.io/webhook",
    "events": ["payment.confirmed", "payment.failed"],
    "secret": "your-webhook-secret"
  }'
```

### Step 3: Create Webhook Receiver

Create a simple server to receive webhooks:

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-payflow-signature'];
  const payload = req.body;
  const secret = 'your-webhook-secret';

  // Verify signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = `sha256=${hmac.digest('hex')}`;

  if (signature !== expectedSignature) {
    console.log('Invalid signature');
    return res.status(401).send('Invalid signature');
  }

  console.log('Webhook received:', payload);
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('Webhook receiver running on port 3000');
});
```

### Step 4: Trigger Webhook

Create a payment intent and complete the payment flow. You should see the webhook event logged in your webhook receiver.

**Expected Webhook Payload:**
```json
{
  "event": "payment.confirmed",
  "payment_id": "pi_xxxxxxxxxxxxxxxx",
  "transaction_hash": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "amount": "50",
  "asset": "USDC",
  "timestamp": "2026-09-01T10:05:00Z"
}
```

## Demo Scenario: SDK Integration

### Step 1: Install SDK

```bash
npm install @payflow/sdk
```

### Step 2: Use SDK in Your Application

```typescript
import { PayFlow } from '@payflow/sdk';

const payflow = new PayFlow({
  apiKey: 'your-api-key',
  apiUrl: 'http://localhost:3001/api/v1',
});

// Create a payment intent
const payment = await payflow.paymentIntents.create({
  amount: '50',
  asset: 'USDC',
  recipient: 'G...',
  idempotencyKey: 'unique-key-123',
});

console.log('Payment created:', payment.id);

// Create an invoice
const invoice = await payflow.invoices.create({
  invoiceNumber: 'INV-001',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  description: 'Services',
  amount: '500',
  asset: 'USDC',
});

// Send the invoice
await payflow.invoices.send(invoice.id);
```

## Troubleshooting

### Payment Not Confirming

1. Check the payment status via API
2. Verify the transaction hash on Stellar Explorer
3. Check backend logs for verification errors
4. Ensure the recipient address is correct
5. Verify the amount and asset match

### Webhook Not Received

1. Check webhook endpoint is accessible
2. Verify webhook signature
3. Check webhook delivery logs in database
4. Ensure webhook is subscribed to the event
5. Check network connectivity

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env
3. Verify database exists
4. Check database credentials

### Stellar Network Issues

1. Check Stellar Testnet status
2. Verify RPC URL is correct
3. Ensure account has sufficient XLM for fees
4. Check Horizon API status

## Cleanup

After testing, clean up the demo data:

```bash
# Stop services
docker-compose down

# Delete demo merchant account (via API or database)
# Delete test payment intents
# Delete test invoices
# Delete test webhooks
```

## Next Steps

After completing the demo:

1. Explore the merchant dashboard at `http://localhost:3000/dashboard`
2. Review the API documentation in README.md
3. Check out the contract documentation in docs/contracts.md
4. Review the GitHub issues backlog in docs/github-issues.md
5. Consider contributing to the project!

## Support

If you encounter issues during the demo:

- Check the logs in your terminal
- Review the troubleshooting section above
- Check the GitHub Issues for similar problems
- Create a new issue with detailed information

---

**Happy testing! 🚀**
