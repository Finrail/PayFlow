# PayFlow Soroban Contract Documentation

## Contract Status

- **Build Status**: ✅ Successfully built
- **WASM Location**: `contracts/payment/target/wasm32-unknown-unknown/release/payflow_contract.wasm`
- **WASM Hash**: `a5bf396a1986d7ce069f3766db3364ca95494eb1495ab155d4ab5ca10e5a1283`
- **Deployment Status**: ✅ Successfully deployed to Stellar Testnet
- **Contract ID**: `CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C`
- **Transaction Hash**: `a7687edb2005dccaa6fb787ddf37475e3edc23b579c9b5a2e59b9978fc84f7d9`
- **Explorer**: https://stellar.expert/explorer/testnet/tx/a7687edb2005dccaa6fb787ddf37475e3edc23b579c9b5a2e59b9978fc84f7d9
- **Contract Explorer**: https://lab.stellar.org/r/testnet/contract/CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C

## Contract Architecture

The PayFlow contract implements a payment escrow/settlement mechanism on Soroban.

### Key Features

- **Payment Escrow**: Secure holding of funds between payer and payee
- **State Management**: Clear state machine for payment lifecycle
- **Authorization**: Proper authorization checks for all operations
- **Event Emission**: Meaningful events for off-chain monitoring

### Payment States

1. **Created**: Payment escrow initialized
2. **Funded**: Funds transferred to escrow
3. **Released**: Funds released to payee
4. **Refunded**: Funds returned to payer
5. **Cancelled**: Payment cancelled before funding

### Contract Functions

#### `initialize(owner: Address)`
Initialize the contract with an owner address.

#### `create_payment(payer: Address, payee: Address, amount: i128, asset: Address) -> u64`
Create a new payment escrow. Returns the payment ID.

#### `fund_payment(payment_id: u64)`
Transfer funds to the payment escrow. Requires payer authorization.

#### `release_payment(payment_id: u64)`
Release funds to the payee. Requires payer authorization.

#### `refund_payment(payment_id: u64)`
Refund funds back to the payer. Requires payee authorization.

#### `cancel_payment(payment_id: u64)`
Cancel a payment before funding. Requires payer authorization.

#### `get_payment(payment_id: u64) -> Payment`
Get payment details by ID.

#### `get_escrow() -> PaymentEscrow`
Get the entire escrow state.

## Deployment Instructions

### Prerequisites

1. Install Rust and Cargo
2. Install Soroban CLI: `cargo install soroban-cli`
3. Install wasm32 target: `rustup target add wasm32-unknown-unknown`

### Build Contract

```bash
cd contracts/payment
cargo build --target wasm32-unknown-unknown --release
```

### Manual Deployment Steps

Due to CLI version compatibility issues, manual deployment is recommended:

1. **Generate a deployer key**:
```bash
soroban keys generate deployer --network testnet --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
```

2. **Fund the deployer account** using Friendbot:
```bash
curl "https://friendbot.stellar.org?addr=<DEPLOYER_PUBLIC_KEY>"
```

3. **Install the contract**:
```bash
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/payflow_contract.wasm \
  --source deployer \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

4. **Deploy the contract**:
```bash
soroban contract deploy \
  --source-account <DEPLOYER_PUBLIC_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --wasm-hash <WASM_HASH_FROM_INSTALL>
```

5. **Initialize the contract**:
```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  initialize \
  --owner <OWNER_ADDRESS>
```

6. **Record the following**:
   - Contract ID
   - Deployment transaction hash
   - Owner address

## Testing

Run contract tests:

```bash
cd contracts/payment
cargo test
```

## Integration with PayFlow

Once deployed, the contract address should be added to:
- `.env` file as `CONTRACT_ADDRESS`
- API configuration
- README documentation

## Security Considerations

- All state-changing functions require proper authorization
- Double-release and double-refund are prevented by state checks
- Sensitive data (user metadata) is kept off-chain
- Events are emitted for all state changes

## Known Issues

- Soroban CLI version 21.0.0 has XDR processing issues with deployment
- Consider using Stellar SDK for programmatic deployment instead
- Contract tests pass successfully
