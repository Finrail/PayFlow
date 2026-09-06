"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TESTNET_USDC_CODE = exports.TESTNET_USDC_ISSUER = exports.STELLAR_HORIZON_URL = exports.STELLAR_RPC_URL = exports.STELLAR_NETWORK_PASSPHRASE = void 0;
exports.validateStellarAddress = validateStellarAddress;
exports.validateAsset = validateAsset;
exports.getAssetIssuer = getAssetIssuer;
exports.createStellarAsset = createStellarAsset;
exports.validateTransaction = validateTransaction;
exports.getTransactionDetails = getTransactionDetails;
exports.createPaymentTransaction = createPaymentTransaction;
exports.submitTransaction = submitTransaction;
exports.accountExists = accountExists;
exports.fundTestnetAccount = fundTestnetAccount;
const StellarSdk = __importStar(require("stellar-sdk"));
// Stellar Testnet configuration
exports.STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
exports.STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
exports.STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
// Testnet USDC configuration
exports.TESTNET_USDC_ISSUER = 'GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE';
exports.TESTNET_USDC_CODE = 'USDC';
// Supported assets for MVP
const SUPPORTED_ASSETS = [
    { code: 'USDC', issuer: exports.TESTNET_USDC_ISSUER },
    { code: 'XLM', issuer: null }, // Native XLM
];
/**
 * Validate a Stellar address
 */
function validateStellarAddress(address) {
    try {
        StellarSdk.StrKey.isValidEd25519PublicKey(address);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Validate an asset code
 */
function validateAsset(asset) {
    return SUPPORTED_ASSETS.some(a => a.code === asset);
}
/**
 * Get asset issuer for a given asset code
 */
function getAssetIssuer(asset) {
    const supportedAsset = SUPPORTED_ASSETS.find(a => a.code === asset);
    return supportedAsset ? supportedAsset.issuer : null;
}
/**
 * Create a Stellar asset object
 */
function createStellarAsset(code, issuer) {
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
async function validateTransaction(transactionHash, expectedRecipient, expectedAmount, expectedAsset) {
    try {
        const server = new StellarSdk.Horizon.Server(exports.STELLAR_HORIZON_URL);
        const transaction = await server.transactions().transaction(transactionHash).call();
        if (!transaction.successful) {
            return false;
        }
        const operations = await transaction.operations();
        if (!operations || operations.records.length === 0) {
            return false;
        }
        const paymentOp = operations.records.find((op) => op.type === 'payment');
        if (!paymentOp) {
            return false;
        }
        // Verify recipient
        if (paymentOp.destination !== expectedRecipient) {
            return false;
        }
        // Verify amount
        const amount = parseFloat(paymentOp.amount);
        if (amount !== parseFloat(expectedAmount)) {
            return false;
        }
        // Verify asset
        const assetCode = paymentOp.asset_code;
        const assetIssuer = paymentOp.asset_issuer;
        const asset = assetCode === 'XLM' ? 'XLM' : `${assetCode}:${assetIssuer}`;
        if (asset !== expectedAsset) {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Error validating transaction:', error);
        return false;
    }
}
/**
 * Get transaction details
 */
async function getTransactionDetails(transactionHash) {
    try {
        const server = new StellarSdk.Horizon.Server(exports.STELLAR_HORIZON_URL);
        const transaction = await server.transactions().transaction(transactionHash);
        return transaction;
    }
    catch (error) {
        console.error('Error getting transaction details:', error);
        throw error;
    }
}
/**
 * Create a payment transaction
 */
function createPaymentTransaction(fromSecret, toAddress, amount, asset) {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(fromSecret);
    const account = new StellarSdk.Account(sourceKeypair.publicKey(), '-1');
    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: exports.STELLAR_NETWORK_PASSPHRASE,
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
async function submitTransaction(transaction) {
    try {
        const server = new StellarSdk.Horizon.Server(exports.STELLAR_HORIZON_URL);
        const result = await server.submitTransaction(transaction);
        return result.hash;
    }
    catch (error) {
        console.error('Error submitting transaction:', error);
        throw error;
    }
}
/**
 * Check if an account exists on Stellar
 */
async function accountExists(address) {
    try {
        const server = new StellarSdk.Horizon.Server(exports.STELLAR_HORIZON_URL);
        await server.loadAccount(address);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Fund a testnet account using friendbot
 */
async function fundTestnetAccount(address) {
    try {
        const response = await fetch(`https://friendbot.stellar.org?addr=${address}`);
        if (!response.ok) {
            throw new Error('Failed to fund account');
        }
    }
    catch (error) {
        console.error('Error funding testnet account:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map