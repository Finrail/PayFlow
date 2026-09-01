import { FreighterApi } from '@stellar/freighter-api';
import {
  Account,
  Asset,
  Horizon,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
  BASE_FEE,
  StrKey,
} from '@stellar/sdk';

const freighter = new FreighterApi();

// Stellar Testnet configuration
const NETWORK_PASSPHRASE = Networks.TESTNET;
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';

// Contract deployment details
const CONTRACT_ID = 'CBOPC7Z64MXDAQKHFM2TQYVCPG7BJY7VX6FQDWQENTOFJBL3AJEBKO7C';

// USDC on Testnet
const USDC_ISSUER = 'GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE';
const USDC_CODE = 'USDC';

export interface WalletInfo {
  publicKey: string;
  isConnected: boolean;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Check if Freighter wallet is installed
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const isInstalled = await freighter.isConnected();
    return isInstalled;
  } catch (error) {
    console.error('Error checking Freighter installation:', error);
    return false;
  }
}

/**
 * Connect to Freighter wallet
 */
export async function connectWallet(): Promise<WalletInfo> {
  try {
    const publicKey = await freighter.getAddress();
    if (!publicKey) {
      throw new Error('No public key returned from wallet');
    }

    return {
      publicKey,
      isConnected: true,
    };
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    return {
      publicKey: '',
      isConnected: false,
    };
  }
}

/**
 * Disconnect wallet
 */
export function disconnectWallet(): WalletInfo {
  return {
    publicKey: '',
    isConnected: false,
  };
}

/**
 * Get account details from Horizon
 */
export async function getAccountDetails(publicKey: string): Promise<Account | null> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    return account;
  } catch (error) {
    console.error('Error loading account details:', error);
    return null;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(publicKey: string): Promise<{ asset: string; balance: string }[]> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const account = await server.loadAccount(publicKey);
    
    return account.balances.map((balance) => ({
      asset: balance.asset_code || 'XLM',
      balance: balance.balance,
    }));
  } catch (error) {
    console.error('Error loading account balance:', error);
    return [];
  }
}

/**
 * Create and sign a payment transaction
 */
export async function createPayment(
  fromPublicKey: string,
  toPublicKey: string,
  amount: string,
  assetCode: string = 'XLM',
  assetIssuer?: string
): Promise<PaymentResult> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    
    // Load the source account
    const sourceAccount = await server.loadAccount(fromPublicKey);
    
    // Create the asset
    let asset: Asset;
    if (assetCode === 'XLM') {
      asset = Asset.native();
    } else if (assetIssuer) {
      asset = new Asset(assetCode, assetIssuer);
    } else {
      throw new Error('Asset issuer required for non-native assets');
    }

    // Build the transaction
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: toPublicKey,
          asset,
          amount,
        })
      )
      .setTimeout(30)
      .build();

    // Sign the transaction with Freighter
    const signedXDR = await freighter.signTransaction(transaction.toXDR());
    
    // Submit the transaction
    const signedTransaction = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE) as Transaction;
    const result = await server.submitTransaction(signedTransaction);

    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create payment using Soroban contract
 */
export async function createContractPayment(
  fromPublicKey: string,
  toPublicKey: string,
  amount: string
): Promise<PaymentResult> {
  try {
    // For now, we'll use the standard Stellar payment
    // In the future, this will integrate with the Soroban contract
    const result = await createPayment(
      fromPublicKey,
      toPublicKey,
      amount,
      USDC_CODE,
      USDC_ISSUER
    );

    return result;
  } catch (error) {
    console.error('Error creating contract payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fund account using Friendbot (Testnet only)
 */
export async function fundAccountWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    const data = await response.json();
    
    if (data.success) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error funding account:', error);
    return false;
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(transactionHash: string): Promise<any> {
  try {
    const server = new Horizon.Server(HORIZON_URL);
    const transaction = await server.transactions().transaction(transactionHash);
    return transaction;
  } catch (error) {
    console.error('Error loading transaction:', error);
    return null;
  }
}

/**
 * Format asset for display
 */
export function formatAsset(assetCode: string, assetIssuer?: string): string {
  if (assetCode === 'XLM') {
    return 'XLM';
  }
  return assetIssuer ? `${assetCode} (${assetIssuer.slice(0, 4)}...${assetIssuer.slice(-4)})` : assetCode;
}

/**
 * Validate Stellar public key
 */
export function isValidPublicKey(publicKey: string): boolean {
  try {
    return StrKey.isValidEd25519PublicKey(publicKey);
  } catch {
    return false;
  }
}
