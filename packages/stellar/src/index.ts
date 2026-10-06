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

const STROOPS_PER_UNIT = 10_000_000n;
const MAX_STROOPS = 9_223_372_036_854_775_807n;

function toStroops(amount: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(amount);
  if (!match) {
    return null;
  }

  const stroops = BigInt(match[1]) * STROOPS_PER_UNIT
    + BigInt((match[2] || '').padEnd(7, '0'));

  return stroops <= MAX_STROOPS ? stroops : null;
}

export function validatePaymentAmount(amount: string): boolean {
  const stroops = toStroops(amount);
  return stroops !== null && stroops > 0n;
}

/**
 * Validate a Stellar address
 */
export function validateStellarAddress(address: string): boolean {
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(address);
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
  const expectedStroops = toStroops(expectedAmount);
  if (expectedStroops === null || expectedStroops === 0n) {
    return false;
  }

  const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
  const transaction = await server.transactions().transaction(transactionHash).call();
  if (!transaction.successful) {
    return false;
  }

  const operations = await server.operations().forTransaction(transactionHash).call();
  return operations.records.some((operation: any) => {
    if (operation.type !== 'payment' || operation.destination !== expectedRecipient) {
      return false;
    }

    if (toStroops(operation.amount) !== expectedStroops) {
      return false;
    }

    if (expectedAsset === 'XLM') {
      return operation.asset_type === 'native';
    }

    const supportedAsset = SUPPORTED_ASSETS.find((asset) => asset.code === expectedAsset);
    return Boolean(supportedAsset?.issuer)
      && operation.asset_code === supportedAsset?.code
      && operation.asset_issuer === supportedAsset?.issuer;
  });
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(transactionHash: string) {
  const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
  return server.transactions().transaction(transactionHash).call();
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
