import * as StellarSdk from 'stellar-sdk';

// Stellar Testnet configuration
export const STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

// Testnet USDC configuration
export const TESTNET_USDC_ISSUER = 'GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE';
export const TESTNET_USDC_CODE = 'USDC';

// Supported assets for MVP
const SUPPORTED_ASSETS = [
  { code: 'USDC', issuer: TESTNET_USDC_ISSUER },
  { code: 'XLM', issuer: null }, // Native XLM
];

/**
 * Validate a Stellar address
 */
export function validateStellarAddress(address: string): boolean {
  try {
    StellarSdk.StrKey.isValidEd25519PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate an asset code
 */
export function validateAsset(asset: string): boolean {
  return SUPPORTED_ASSETS.some(a => a.code === asset);
}

/**
 * Get asset issuer for a given asset code
 */
export function getAssetIssuer(asset: string): string | null {
  const supportedAsset = SUPPORTED_ASSETS.find(a => a.code === asset);
  return supportedAsset ? supportedAsset.issuer : null;
}

/**
 * Create a Stellar asset object
 */
export function createStellarAsset(code: string, issuer?: string): StellarSdk.Asset {
  if (code === 'XLM') {
    return StellarSdk.Asset.native();
  }
  if (!issuer) {
    throw new Error('Issuer required for non-native assets');
  }
  return new StellarSdk.Asset(code, issuer);
}

/**
 * Validate a Stellar transaction
 */
export async function validateTransaction(
  transactionHash: string,
  expectedRecipient: string,
  expectedAmount: string,
  expectedAsset: string
): Promise<boolean> {
  try {
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
    const transaction = await server.transactions().transaction(transactionHash);

    if (!transaction.successful) {
      return false;
    }

    const operations = transaction.operations;
    if (!operations || operations.length === 0) {
      return false;
    }

    const paymentOp = operations.find((op: any) => op.type === 'payment');
    if (!paymentOp) {
      return false;
    }

    // Verify recipient
    if (paymentOp.to !== expectedRecipient) {
      return false;
    }

    // Verify amount
    const amount = parseFloat(paymentOp.amount);
    if (Math.abs(amount - parseFloat(expectedAmount)) > 0.000001) {
      return false;
    }

    // Verify asset
    if (paymentOp.asset_code !== expectedAsset) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating transaction:', error);
    return false;
  }
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(transactionHash: string) {
  try {
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
    const transaction = await server.transactions().transaction(transactionHash);
    return transaction;
  } catch (error) {
    console.error('Error getting transaction details:', error);
    throw error;
  }
}

/**
 * Create a payment transaction
 */
export function createPaymentTransaction(
  fromSecret: string,
  toAddress: string,
  amount: string,
  asset: StellarSdk.Asset
): StellarSdk.Transaction {
  const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecret);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), '-1');

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: toAddress,
      asset,
      amount,
    }))
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair);
  return transaction;
}

/**
 * Submit a transaction to Stellar network
 */
export async function submitTransaction(transaction: StellarSdk.Transaction): Promise<string> {
  try {
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
    const result = await server.submitTransaction(transaction);
    return result.hash;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}

/**
 * Check if an account exists on Stellar
 */
export async function accountExists(address: string): Promise<boolean> {
  try {
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
    await server.loadAccount(address);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fund a testnet account using friendbot
 */
export async function fundTestnetAccount(address: string): Promise<void> {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    if (!response.ok) {
      throw new Error('Failed to fund account');
    }
  } catch (error) {
    console.error('Error funding testnet account:', error);
    throw error;
  }
}
