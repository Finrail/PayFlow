# Contributing to PayFlow

Thank you for your interest in contributing to PayFlow! This document will help you get started.

## What is PayFlow?

PayFlow is open-source payment infrastructure for Stellar. It makes it easy for developers and businesses to accept Stellar payments without needing to understand the complexities of Stellar transaction construction, monitoring, webhooks, payment states, and payment links.

PayFlow is **NOT** a wallet. It is payment infrastructure that handles the complexity of Stellar payments.

## Architecture Overview

PayFlow is built as a monorepo with the following components:

- **Frontend (Next.js)**: Merchant dashboard and payment link pages
- **Backend API (Fastify)**: RESTful API for payment processing
- **Database (PostgreSQL)**: Persistent storage with Drizzle ORM
- **Stellar Integration**: Stellar SDK for blockchain interactions
- **Soroban Contract**: Smart contract for payment escrow/settlement
- **TypeScript SDK**: Client library for easy integration

## Repository Structure

```
PayFlow/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # Fastify backend
├── packages/
│   ├── database/            # Database schema and client
│   ├── stellar/             # Stellar utilities
│   ├── types/               # Shared types
│   └── sdk/                 # TypeScript SDK
├── contracts/
│   └── payment/             # Soroban smart contract
├── docs/                    # Documentation
└── .github/                 # GitHub configuration
```

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 15+
- Rust 1.70+ (for contract development)
- Docker (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/payflow.git
cd payflow
```

2. Install pnpm:
```bash
npm install -g pnpm@8.15.0
```

3. Install dependencies:
```bash
pnpm install
```

4. Set up environment variables:
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values
```

5. Start PostgreSQL:
```bash
# Using Docker Compose
docker-compose up -d postgres

# Or use local PostgreSQL
createdb payflow
```

6. Run database migrations:
```bash
pnpm db:generate
pnpm db:migrate
```

### Running the Project

#### Start all services:
```bash
pnpm dev
```

#### Start individual services:
```bash
# Frontend (http://localhost:3000)
pnpm --filter frontend dev

# Backend API (http://localhost:3001)
pnpm --filter @payflow/api dev
```

### Running Tests

```bash
# All tests
pnpm test

# Contract tests
cd contracts/payment && cargo test

# API tests
pnpm --filter @payflow/api test

# SDK tests
pnpm --filter @payflow/sdk test
```

## Stellar Testnet

PayFlow uses Stellar Testnet for development.

### Getting Testnet Funds

1. Create a testnet account at [Stellar Laboratory](https://laboratory.stellar.org/)
2. Fund your account using Friendbot:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### Supported Assets

- **USDC**: Testnet USDC (Issuer: `GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE`)
- **XLM**: Native Stellar Lumens

## Soroban Contract

### Contract Development

The Soroban contract is written in Rust and located in `contracts/payment/`.

### Building the Contract

```bash
cd contracts/payment
cargo build --target wasm32-unknown-unknown --release
```

### Testing the Contract

```bash
cd contracts/payment
cargo test
```

### Contract Functions

- `initialize(owner)`: Initialize the contract
- `create_payment(payer, payee, amount, asset)`: Create payment escrow
- `fund_payment(payment_id)`: Fund the payment
- `release_payment(payment_id)`: Release funds to payee
- `refund_payment(payment_id)`: Refund to payer
- `cancel_payment(payment_id)`: Cancel payment

See `docs/contracts.md` for detailed contract documentation.

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused
- Use async/await for asynchronous code

### Rust

- Follow Rust best practices
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Write unit tests for contract functions
- Document public functions with comments

### General

- Write tests for new features
- Update documentation for API changes
- Follow the existing project structure
- Keep commits atomic and focused

## Branch Naming

Use the following branch naming conventions:

- `feature/feature-name`: New features
- `fix/bug-description`: Bug fixes
- `docs/documentation-update`: Documentation updates
- `refactor/refactor-description`: Code refactoring
- `test/test-improvement`: Test improvements

Examples:
- `feature/invoice-system`
- `fix/payment-verification-bug`
- `docs/api-documentation`
- `refactor/database-schema`

## Commit Conventions

Follow conventional commits:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
- `feat: add invoice creation API endpoint`
- `fix: resolve payment verification timeout issue`
- `docs: update API documentation`
- `test: add payment intent creation tests`

## Pull Requests

### Before Submitting

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG if applicable
5. Rebase your branch on the latest main

### Pull Request Template

Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md`.

### PR Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address all review comments
4. Keep PRs focused and small

## Issue Selection

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks.

### Issue Labels

- `good first issue`: Suitable for new contributors
- `help wanted`: Community help needed
- `bug`: Bug report
- `enhancement`: Feature request
- `documentation`: Documentation improvements
- `high priority`: Important issues

## Definition of Done

A feature is considered complete when:

- [ ] Code is implemented and follows style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] API changes are documented
- [ ] Security implications are considered
- [ ] Performance impact is assessed
- [ ] CI/CD checks pass
- [ ] Code is reviewed and approved

## How to Add Tests

### API Tests

Add tests in `apps/api/src/__tests__/`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Payment Intents', () => {
  it('should create a payment intent', async () => {
    // Test implementation
  });
});
```

### Contract Tests

Add tests in `contracts/payment/src/lib.rs`:

```rust
#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_function_name() {
        // Test implementation
    }
}
```

### Frontend Tests

Add tests in `apps/web/__tests__/` using Playwright.

## How to Add an API Endpoint

1. Add the route handler in `apps/api/src/routes/`
2. Add authentication/authorization if needed
3. Implement input validation
4. Add error handling
5. Write tests
6. Update API documentation
7. Update TypeScript types if needed

Example:

```typescript
// apps/api/src/routes/example.routes.ts
export async function exampleRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    // Implementation
  });
}
```

## How to Add a Frontend Feature

1. Create the component in `apps/web/app/`
2. Add TypeScript types
3. Implement the UI
4. Add API integration
5. Add error handling
6. Write tests
7. Update documentation

## How to Modify the Soroban Contract

1. Update the contract in `contracts/payment/src/lib.rs`
2. Add or update tests
3. Build the contract:
```bash
cargo build --target wasm32-unknown-unknown --release
```
4. Run tests:
```bash
cargo test
```
5. Update documentation in `docs/contracts.md`
6. Consider deployment implications

## Security Rules

- Never commit private keys or secrets
- Use environment variables for sensitive data
- Validate all user inputs
- Implement proper authentication/authorization
- Follow security best practices
- Report security vulnerabilities privately

See `SECURITY.md` for detailed security guidelines.

## How to Report Vulnerabilities

Security vulnerabilities should be reported privately:

1. Send an email to security@payflow.io
2. Include details of the vulnerability
3. Include steps to reproduce
4. Allow time for the issue to be addressed
5. Follow responsible disclosure

## Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our Discord server (if available)

## Communication

- Be respectful and constructive
- Ask questions if you're unsure
- Help other contributors when possible
- Share knowledge and learn from others

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to PayFlow! 🚀
