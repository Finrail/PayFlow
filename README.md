# PayFlow

Open-source payment infrastructure for Stellar.

## Why PayFlow Exists

PayFlow makes it extremely easy for developers and businesses to accept Stellar payments without needing to understand Stellar transaction construction, monitoring, webhooks, payment states, and payment links themselves.

PayFlow is **NOT** a wallet. It is payment infrastructure that handles the complexity of Stellar payments so you can focus on building your product.

## Features

- **Merchant Account System**: Create accounts, manage API keys, and access a dashboard
- **Stellar Testnet Support**: Full integration with Stellar Testnet for development and testing
- **Payment Intents**: Create and manage payment requests with idempotency support
- **Payment Links**: Generate shareable payment links for customers
- **Stellar Transaction Processing**: Automatic transaction creation, signing, and submission
- **Payment Confirmation**: Real-time monitoring and verification of Stellar transactions
- **Webhooks**: Event-driven notifications with signing, delivery, and retry logic
- **Invoice System**: Create and manage professional invoices
- **QR Code Generation**: Generate QR codes for payment links
- **TypeScript SDK**: Easy-to-use SDK for integration
- **Soroban Smart Contract**: Payment escrow/settlement mechanism on-chain

## Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[Next.js Dashboard]
        B[Payment Link Page]
    end
    
    subgraph "Backend API"
        C[Fastify Server]
        D[Auth Service]
        E[Payment Service]
        F[Invoice Service]
        G[Webhook Service]
    end
    
    subgraph "Database"
        H[PostgreSQL]
    end
    
    subgraph "Blockchain"
        I[Stellar Testnet]
        J[Soroban Contract]
    end
    
    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    D --> H
    E --> H
    F --> H
    G --> H
    E --> I
    F --> I
    I --> J
```

## Technology Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **QRCode**: QR code generation

### Backend
- **Node.js 18**: JavaScript runtime
- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe development
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Type-safe database queries

### Blockchain
- **Stellar SDK**: Stellar blockchain integration
- **Soroban SDK**: Smart contract development
- **Rust**: Smart contract language

### Testing
- **Vitest**: Unit testing
- **Supertest**: API testing
- **Playwright**: End-to-end testing

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Local development
- **GitHub Actions**: CI/CD

### Package Management
- **pnpm**: Fast, disk space efficient package manager

## Repository Structure

```
PayFlow/
├── apps/
│   ├── web/                 # Next.js frontend application
│   │   ├── app/
│   │   │   ├── dashboard/   # Merchant dashboard
│   │   │   ├── pay/         # Payment link pages
│   │   │   └── page.tsx     # Landing page
│   │   └── package.json
│   └── api/                 # Fastify backend API
│       ├── src/
│       │   ├── routes/      # API route handlers
│       │   ├── services/    # Business logic
│       │   ├── plugins/     # Fastify plugins
│       │   └── index.ts     # Server entry point
│       └── package.json
├── packages/
│   ├── database/            # Database schema and client
│   ├── stellar/             # Stellar integration utilities
│   ├── types/               # Shared TypeScript types
│   ├── sdk/                 # TypeScript SDK
│   ├── config/              # Shared configuration
│   └── testing/             # Testing utilities
├── contracts/
│   └── payment/             # Soroban smart contract
│       ├── src/
│       │   └── lib.rs       # Contract implementation
│       └── Cargo.toml
├── docs/
│   └── contracts.md         # Contract documentation
├── .github/
│   ├── workflows/           # GitHub Actions CI
│   └── ISSUE_TEMPLATE/      # Issue templates
├── docker-compose.yml       # Docker Compose configuration
├── package.json             # Root package.json
└── pnpm-workspace.yaml      # pnpm workspace configuration
```

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Rust 1.70+ (for contract development)
- Docker (optional, for containerized development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/payflow.git
cd payflow
```

2. Install pnpm (if not already installed):
```bash
npm install -g pnpm@8.15.0
```

3. Install dependencies:
```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payflow

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Stellar
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_USDC_ISSUER=GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE
STELLAR_USDC_CODE=USDC

# Soroban Contract
CONTRACT_ADDRESS=

# Webhook
WEBHOOK_SECRET=your-webhook-secret-for-signing
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_MAX_RETRIES=5

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### Database Setup

#### Option 1: Using Docker Compose

```bash
docker-compose up -d postgres
```

#### Option 2: Local PostgreSQL

1. Start PostgreSQL service
2. Create database:
```bash
createdb payflow
```

3. Run migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

### Running the Application

#### Start all services:

```bash
pnpm dev
```

#### Start individual services:

```bash
# Frontend
pnpm --filter frontend dev

# Backend API
pnpm --filter @payflow/api dev
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm --filter frontend build
pnpm --filter @payflow/api build
pnpm --filter @payflow/sdk build
```

## Stellar Testnet Setup

PayFlow uses Stellar Testnet for development and testing.

### Supported Assets

- **USDC**: Testnet USDC (Issuer: `GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE`)
- **XLM**: Native Stellar Lumens

### Testnet Funding

To get testnet funds:

1. Create a Stellar testnet account using a wallet like [Stellar Laboratory](https://laboratory.stellar.org/)
2. Use Friendbot to fund your account:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### Network Configuration

- **Network Passphrase**: `Test SDF Network ; September 2015`
- **RPC URL**: `https://soroban-testnet.stellar.org`
- **Horizon URL**: `https://horizon-testnet.stellar.org`

## Smart Contract Information

### Contract Architecture

The PayFlow Soroban contract implements a payment escrow/settlement mechanism with the following features:

- **Payment Escrow**: Secure holding of funds between payer and payee
- **State Management**: Clear state machine for payment lifecycle
- **Authorization**: Proper authorization checks for all operations
- **Event Emission**: Meaningful events for off-chain monitoring

### Contract Functions

- `initialize(owner: Address)`: Initialize the contract with an owner
- `create_payment(payer, payee, amount, asset)`: Create a new payment escrow
- `fund_payment(payment_id)`: Transfer funds to the payment escrow
- `release_payment(payment_id)`: Release funds to the payee
- `refund_payment(payment_id)`: Refund funds back to the payer
- `cancel_payment(payment_id)`: Cancel a payment before funding
- `get_payment(payment_id)`: Get payment details
- `get_escrow()`: Get the entire escrow state

### Contract Deployment

The contract has been built and is ready for deployment. Due to CLI compatibility issues, manual deployment is recommended. See `docs/contracts.md` for detailed deployment instructions.

### Contract Testing

Run contract tests:

```bash
cd contracts/payment
cargo test
```

## API Documentation

### Authentication

All API endpoints require authentication via JWT token or API key.

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

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
Content-Type: application/json

{
  "email": "merchant@example.com",
  "password": "securepassword"
}
```

### Payment Intents

#### Create Payment Intent
```http
POST /api/v1/payment-intents
Authorization: Bearer <token>
Idempotency-Key: abc123
Content-Type: application/json

{
  "amount": "50",
  "asset": "USDC",
  "recipient": "G...",
  "metadata": {
    "order_id": "12345"
  }
}
```

#### Get Payment Intent
```http
GET /api/v1/payment-intents/:id
Authorization: Bearer <token>
```

#### List Payment Intents
```http
GET /api/v1/payment-intents?limit=50&offset=0&status=CONFIRMED
Authorization: Bearer <token>
```

### Invoices

#### Create Invoice
```http
POST /api/v1/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceNumber": "INV-001",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "description": "Web Development Services",
  "amount": "500",
  "asset": "USDC",
  "dueDate": "2026-10-01"
}
```

#### Send Invoice
```http
POST /api/v1/invoices/:id/send
Authorization: Bearer <token>
```

## SDK Usage

Install the SDK:

```bash
npm install @payflow/sdk
```

### Example Usage

```typescript
import { PayFlow } from '@payflow/sdk';

const payflow = new PayFlow({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.payflow.io/api/v1',
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

## Payment Flow

1. **Merchant creates payment intent** via API or dashboard
2. **Payment link generated** for customer
3. **Customer opens payment link** and connects wallet
4. **Customer makes payment** using Stellar wallet
5. **Transaction submitted** to Stellar network
6. **PayFlow monitors** transaction status
7. **Payment verified** against expected amount, recipient, and asset
8. **Payment status updated** to CONFIRMED
9. **Webhook delivered** to merchant's configured endpoint
10. **Dashboard updated** with payment information

## Webhook Documentation

### Webhook Events

- `payment.created`: Payment intent created
- `payment.pending`: Payment submitted to network
- `payment.confirmed`: Payment verified and confirmed
- `payment.failed`: Payment verification failed
- `payment.expired`: Payment intent expired
- `invoice.created`: Invoice created
- `invoice.paid`: Invoice paid
- `invoice.expired`: Invoice expired

### Webhook Payload

```json
{
  "event": "payment.confirmed",
  "payment_id": "pi_xxx",
  "transaction_hash": "...",
  "amount": "50",
  "asset": "USDC",
  "timestamp": "2026-09-01T10:30:00Z"
}
```

### Webhook Signature

PayFlow signs webhook payloads using HMAC-SHA256. Verify signatures using your webhook secret:

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

### Webhook Retry Logic

- **Initial timeout**: 5 seconds
- **Retry strategy**: Exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Max retries**: 5 attempts
- **Max backoff**: 60 seconds

## Testing

### Run All Tests

```bash
pnpm test
```

### Run Specific Tests

```bash
# Contract tests
cd contracts/payment && cargo test

# API tests
pnpm --filter @payflow/api test

# SDK tests
pnpm --filter @payflow/sdk test

# E2E tests
pnpm --filter frontend test
```

### Test Coverage

```bash
pnpm --filter @payflow/api test --coverage
```

## Security

PayFlow implements multiple security measures:

- **API Key Hashing**: API keys are hashed before storage
- **Input Validation**: All inputs are validated before processing
- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control
- **Rate Limiting**: API rate limiting to prevent abuse
- **Webhook Signatures**: HMAC-SHA256 signature verification
- **Idempotency**: Prevent duplicate payment creation
- **Environment Variables**: Sensitive data stored in environment variables
- **Transaction Verification**: Backend verification of all transactions
- **No Private Keys**: Private keys never committed to Git
- **No Secrets in Logs**: Sensitive data excluded from logs

For detailed security information, see `SECURITY.md`.

## Roadmap

### Phase 1 (Current - MVP)
- ✅ Merchant account system
- ✅ Payment intents
- ✅ Payment links
- ✅ Stellar Testnet integration
- ✅ Webhooks
- ✅ Invoice system
- ✅ QR codes
- ✅ TypeScript SDK
- ✅ Soroban smart contract

### Phase 2 (Near Future)
- [ ] Mainnet support
- [ ] Multi-asset support
- [ ] Advanced webhook filtering
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
- [ ] Advanced reporting

## Contributing

We welcome contributions! Please see `CONTRIBUTOR.md` for detailed guidelines.

### Quick Start

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation
- Ensure all tests pass
- Follow commit message conventions

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/payflow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/payflow/discussions)

## Acknowledgments

- Stellar Development Foundation for the Stellar network
- Soroban team for the smart contract platform
- Open-source community for tools and libraries

---

**Built with ❤️ for the Stellar ecosystem**
