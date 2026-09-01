# PayFlow

**Open-source payment infrastructure for the Stellar network**

PayFlow makes it easy for businesses to accept Stellar payments without dealing with the complexity of blockchain transactions, payment monitoring, or webhooks. We handle the technical details so you can focus on your business.

---

## 🎯 What is PayFlow?

PayFlow is payment infrastructure - not a wallet. Think of it as Stripe for Stellar:

- **For Merchants**: Accept payments from customers using Stellar
- **For Developers**: Simple API to integrate Stellar payments
- **For Everyone**: Built on the fast, low-cost Stellar network

### What PayFlow Does

✅ **Accept Payments**: Create payment links and invoices  
✅ **Handle Transactions**: We manage Stellar blockchain interactions  
✅ **Monitor Payments**: Automatic payment confirmation tracking  
✅ **Send Notifications**: Webhooks when payments complete  
✅ **Manage Customers**: Dashboard to track all your payments  

### What PayFlow Does NOT Do

❌ Store customer funds (payments go directly to your Stellar wallet)  
❌ Act as a wallet for users  
❌ Hold custody of assets  

---

## 🚀 Quick Start

### For Business Users

1. **Sign up** on the PayFlow dashboard
2. **Connect your Stellar wallet** to receive payments
3. **Create a payment link** for your product or service
4. **Share the link** with your customer
5. **Get paid** directly to your Stellar wallet

### For Developers

```bash
# Install the SDK
npm install @payflow/sdk

# Create a payment
import { PayFlow } from '@payflow/sdk';

const payflow = new PayFlow({ apiKey: 'your-key' });
const payment = await payflow.paymentIntents.create({
  amount: '50',
  asset: 'USDC',
  recipient: 'your-stellar-address',
});
```

---

## 💡 How It Works

```
Customer → Payment Link → PayFlow → Stellar Network → Your Wallet
```

1. **You** create a payment link or invoice
2. **Customer** opens the link and pays with their Stellar wallet
3. **PayFlow** processes the transaction on Stellar
4. **Stellar** confirms the payment on the blockchain
5. **You** receive the funds directly in your wallet
6. **PayFlow** notifies you via webhook

---

## 🌟 Key Features

### For Merchants
- **Payment Links**: Shareable links for one-time payments
- **Invoices**: Professional invoices with due dates
- **Dashboard**: Track all payments in one place
- **QR Codes**: Easy mobile payments
- **Webhooks**: Real-time payment notifications

### For Developers
- **Simple API**: RESTful API with clear documentation
- **TypeScript SDK**: Type-safe client library
- **Idempotency**: Prevent duplicate payments
- **Webhooks**: Event-driven architecture
- **Testnet Support**: Free testing environment

### Technical Highlights
- **Stellar Testnet**: Built on Stellar's test network
- **Soroban Smart Contract**: Secure payment escrow
- **PostgreSQL**: Reliable data storage
- **Fastify**: High-performance API
- **Docker**: Easy deployment

---

## 📊 Architecture

PayFlow consists of three main parts:

1. **Frontend Dashboard**: Where you manage payments (Next.js)
2. **Backend API**: Processes payment requests (Fastify)
3. **Smart Contract**: Secure payment escrow on Stellar (Soroban)

All components work together to provide a seamless payment experience.

---

## 🛠️ Technology Stack

**Frontend**
- Next.js 16 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)

**Backend**
- Node.js 18
- Fastify (web framework)
- PostgreSQL (database)
- Drizzle ORM (database queries)

**Blockchain**
- Stellar SDK (blockchain integration)
- Soroban (smart contracts)
- Rust (contract language)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Docker (optional)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/payflow.git
cd payflow

# Install dependencies
npm install -g pnpm@8.15.0
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your settings

# Start PostgreSQL
docker-compose up -d postgres

# Run database migrations
pnpm db:generate
pnpm db:migrate

# Start the application
pnpm dev
```

The dashboard will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

---

## 🌐 Stellar Testnet

PayFlow uses Stellar's test network for development and testing.

### Getting Testnet Funds

1. Create a testnet account at [Stellar Laboratory](https://laboratory.stellar.org/)
2. Fund your account with Friendbot:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### Supported Assets
- **USDC**: Testnet USDC (stablecoin)
- **XLM**: Native Stellar Lumens

### Network Details
- **Network**: Test SDF Network ; September 2015
- **RPC**: https://soroban-testnet.stellar.org
- **Horizon**: https://horizon-testnet.stellar.org

---

## 🔐 Smart Contract

PayFlow uses a Soroban smart contract for secure payment escrow.

### Contract Features
- Payment escrow between payer and payee
- State management (Created → Funded → Released/Refunded)
- Authorization checks on all operations
- Event emission for monitoring

### Contract Functions
- `initialize`: Set up the contract
- `create_payment`: Create payment escrow
- `fund_payment`: Transfer funds to escrow
- `release_payment`: Release funds to payee
- `refund_payment`: Return funds to payer
- `cancel_payment`: Cancel before funding

### Contract Deployment

**Contract deployed to Stellar Testnet**

- **Contract ID**: `CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C`
- **Transaction Hash**: `a7687edb2005dccaa6fb787ddf37475e3edc23b579c9b5a2e59b9978fc84f7d9`
- **Explorer**: https://stellar.expert/explorer/testnet/tx/a7687edb2005dccaa6fb787ddf37475e3edc23b579c9b5a2e59b9978fc84f7d9
- **Contract Explorer**: https://lab.stellar.org/r/testnet/contract/CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C

### Manual Contract Deployment Commands

If you need to redeploy the contract:

```bash
# 1. Build the contract
cd contracts/payment
cargo build --target wasm32-unknown-unknown --release

# 2. Generate a deployer key
soroban keys generate deployer --network testnet --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"

# 3. Fund the deployer account
curl "https://friendbot.stellar.org?addr=DEPLOYER_PUBLIC_KEY"

# 4. Install the contract
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/payflow_contract.wasm \
  --source deployer \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# 5. Deploy the contract (replace WASM_HASH with output from install)
soroban contract deploy \
  --source-account DEPLOYER_PUBLIC_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --wasm-hash WASM_HASH

# 6. Initialize the contract (replace CONTRACT_ID with output from deploy)
soroban contract invoke \
  --id CONTRACT_ID \
  --source deployer \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  initialize \
  --owner YOUR_PUBLIC_KEY
```

**Important**: Record the contract ID and deployment transaction hash after deployment.

---

## 📚 API Documentation

### Authentication

All API endpoints require authentication via JWT token or API key.

#### Register
```http
POST /api/v1/auth/register
{
  "email": "merchant@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "businessName": "My Business"
}
```

#### Login
```http
POST /api/v1/auth/login
{
  "email": "merchant@example.com",
  "password": "securepassword"
}
```

### Payment Intents

#### Create Payment
```http
POST /api/v1/payment-intents
Authorization: Bearer <token>
Idempotency-Key: abc123
{
  "amount": "50",
  "asset": "USDC",
  "recipient": "G...",
  "metadata": { "order_id": "12345" }
}
```

#### Get Payment
```http
GET /api/v1/payment-intents/:id
Authorization: Bearer <token>
```

### Invoices

#### Create Invoice
```http
POST /api/v1/invoices
Authorization: Bearer <token>
{
  "invoiceNumber": "INV-001",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "description": "Services",
  "amount": "500",
  "asset": "USDC",
  "dueDate": "2026-10-01"
}
```

---

## 🔌 SDK Usage

Install the SDK:
```bash
npm install @payflow/sdk
```

### Example

```typescript
import { PayFlow } from '@payflow/sdk';

const payflow = new PayFlow({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.payflow.io/api/v1',
});

// Create a payment
const payment = await payflow.paymentIntents.create({
  amount: '50',
  asset: 'USDC',
  recipient: 'G...',
  idempotencyKey: 'unique-key-123',
});

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

---

## 🔄 Payment Flow

1. **You** create a payment intent via API or dashboard
2. **PayFlow** generates a payment link
3. **Customer** opens the link and connects their wallet
4. **Customer** makes payment using their Stellar wallet
5. **Transaction** is submitted to Stellar network
6. **PayFlow** monitors transaction status
7. **Payment** is verified against expected details
8. **Status** updates to CONFIRMED
9. **Webhook** is sent to your configured endpoint
10. **Dashboard** shows the completed payment

---

## 🔔 Webhooks

### Events

- `payment.created`: Payment intent created
- `payment.pending`: Payment submitted to network
- `payment.confirmed`: Payment verified and confirmed
- `payment.failed`: Payment verification failed
- `payment.expired`: Payment intent expired
- `invoice.created`: Invoice created
- `invoice.paid`: Invoice paid
- `invoice.expired`: Invoice expired

### Verification

PayFlow signs webhooks with HMAC-SHA256. Verify signatures using your webhook secret:

```typescript
import crypto from 'crypto';

const signature = request.headers['x-payflow-signature'];
const payload = request.body;

const hmac = crypto.createHmac('sha256', webhookSecret);
hmac.update(JSON.stringify(payload));
const expectedSignature = `sha256=${hmac.digest('hex')}`;

if (signature !== expectedSignature) {
  // Invalid signature
}
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Contract tests
cd contracts/payment && cargo test

# API tests
pnpm --filter @payflow/api test

# SDK tests
pnpm --filter @payflow/sdk test
```

---

## 🐳 Docker

Start all services with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Backend API
- Frontend dashboard

---

## 🔒 Security

PayFlow implements multiple security measures:

- **API Key Hashing**: Keys are hashed before storage
- **Input Validation**: All inputs are validated
- **Authentication**: JWT-based auth with secure tokens
- **Rate Limiting**: API rate limiting to prevent abuse
- **Webhook Signatures**: HMAC-SHA256 signature verification
- **Idempotency**: Prevent duplicate payments
- **Transaction Verification**: Backend verification of all transactions
- **No Private Keys**: Private keys never committed to Git

See `SECURITY.md` for detailed security information.

---

## 🗺️ Roadmap

### Phase 1 (Current - MVP) ✅
- ✅ Merchant account system
- ✅ Payment intents
- ✅ Payment links
- ✅ Stellar Testnet integration
- ✅ Webhooks
- ✅ Invoice system
- ✅ QR codes
- ✅ TypeScript SDK
- ✅ Soroban smart contract

### Phase 2 (Coming Soon)
- [ ] Mainnet support
- [ ] Multi-asset support
- [ ] Payment analytics
- [ ] Recurring payments
- [ ] Subscriptions
- [ ] Payment splits
- [ ] Multi-signature support

### Phase 3 (Future)
- [ ] Mobile SDK
- [ ] Plugin system
- [ ] Custom branding
- [ ] White-label solution
- [ ] Enterprise features
- [ ] Compliance tools

---

## 🤝 Contributing

We welcome contributions! See `CONTRIBUTOR.md` for guidelines.

### Quick Start

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 💬 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/payflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/payflow/discussions)

---

## 🙏 Acknowledgments

- Stellar Development Foundation for the Stellar network
- Soroban team for the smart contract platform
- Open-source community for tools and libraries

---

**Built with ❤️ for the Stellar ecosystem**
