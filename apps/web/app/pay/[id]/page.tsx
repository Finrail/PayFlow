'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  connectWallet as connectFreighter,
  disconnectWallet as disconnectFreighter,
  createPayment,
  getAccountBalance,
  isFreighterInstalled,
  WalletInfo,
  PaymentResult,
} from '@/lib/stellar';

interface PaymentIntent {
  id: string;
  merchantId: string;
  amount: string;
  asset: string;
  recipient: string;
  status: 'CREATED' | 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  metadata?: Record<string, any>;
  expiresAt?: string;
  transactionHash?: string;
  createdAt: string;
}

export default function PaymentPage() {
  const params = useParams();
  const paymentIntentId = params.id as string;
  
  const [payment, setPayment] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [wallet, setWallet] = useState<WalletInfo>({ publicKey: '', isConnected: false });
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ asset: string; balance: string }[]>([]);

  useEffect(() => {
    fetchPaymentIntent();
  }, [paymentIntentId]);

  useEffect(() => {
    if (payment) {
      generateQRCode();
    }
  }, [payment]);

  useEffect(() => {
    if (wallet.isConnected) {
      fetchBalance();
    }
  }, [wallet]);

  const fetchPaymentIntent = async () => {
    try {
      // Simulate API call for MVP demo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock payment data based on the payment ID
      const mockPayment: PaymentIntent = {
        id: paymentIntentId,
        merchantId: 'merchant_123',
        amount: '50.00',
        asset: 'USDC',
        recipient: 'GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE',
        status: 'CREATED',
        metadata: { description: 'Demo payment' },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      };
      
      setPayment(mockPayment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!payment) return;
    
    const paymentUrl = `${window.location.origin}/pay/${paymentIntentId}`;
    try {
      const qr = await QRCode.toDataURL(paymentUrl);
      setQrCode(qr);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const fetchBalance = async () => {
    if (!wallet.publicKey) return;
    
    try {
      const balances = await getAccountBalance(wallet.publicKey);
      setBalance(balances);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const handleConnectWallet = async () => {
    const installed = await isFreighterInstalled();
    if (!installed) {
      window.open('https://www.freighter.app/', '_blank');
      return;
    }

    const walletInfo = await connectFreighter();
    setWallet(walletInfo);
    setPaymentError(null);
  };

  const handleDisconnectWallet = () => {
    const walletInfo = disconnectFreighter();
    setWallet(walletInfo);
    setBalance([]);
  };

  const makePayment = async () => {
    if (!payment || !wallet.isConnected) return;

    setPaying(true);
    setPaymentError(null);

    try {
      // Determine asset code and issuer
      const assetCode = payment.asset === 'USDC' ? 'USDC' : 'XLM';
      const assetIssuer = payment.asset === 'USDC' ? 'GBBD47IFQFJLVQAMZEDS2N7TU7VA7K7XXQDGFO2UPHTM4JUW7RZMOBKE' : undefined;

      const result: PaymentResult = await createPayment(
        wallet.publicKey,
        payment.recipient,
        payment.amount,
        assetCode,
        assetIssuer
      );

      if (result.success) {
        // Update payment with transaction hash
        setPayment((prev) => prev ? { ...prev, transactionHash: result.transactionHash, status: 'PENDING' } : null);
        // Poll for payment confirmation
        pollPaymentStatus();
      } else {
        setPaymentError(result.error || 'Payment failed');
        setPaying(false);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
      setPaying(false);
    }
  };

  const pollPaymentStatus = async () => {
    // Simulate payment confirmation for MVP demo
    setTimeout(() => {
      setPayment((prev) => prev ? { ...prev, status: 'CONFIRMED' } : null);
      setPaying(false);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">Payment Not Found</h1>
          <p className="text-gray-600 text-center">{error || 'This payment link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    CREATED: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">PayFlow Payment</h1>
                <p className="text-indigo-100 mt-1">Secure Stellar Testnet Payment</p>
              </div>
              <Link 
                href="/"
                className="text-white hover:text-indigo-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[payment.status]}`}>
                {payment.status}
              </span>
            </div>

            {/* Payment Details */}
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Amount</span>
                <span className="text-2xl font-bold text-gray-900">
                  {payment.amount} {payment.asset}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Payment ID</span>
                <span className="text-sm font-mono text-gray-900">{payment.id}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Recipient</span>
                <span className="text-sm font-mono text-gray-900">{payment.recipient.slice(0, 8)}...{payment.recipient.slice(-8)}</span>
              </div>

              {payment.transactionHash && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Transaction</span>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${payment.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-indigo-600 hover:text-indigo-800"
                  >
                    {payment.transactionHash.slice(0, 8)}...{payment.transactionHash.slice(-8)}
                  </a>
                </div>
              )}

              {payment.expiresAt && payment.status === 'CREATED' && (
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-sm text-gray-900">
                    {new Date(payment.expiresAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* QR Code */}
            {qrCode && payment.status === 'CREATED' && (
              <div className="flex flex-col items-center mb-8">
                <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                  <img src={qrCode} alt="Payment QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-500 mt-2">Scan to pay with mobile wallet</p>
              </div>
            )}

            {/* Wallet Connection Status */}
            {wallet.isConnected && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-indigo-900">Wallet Connected</span>
                  </div>
                  <button
                    onClick={handleDisconnectWallet}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Disconnect
                  </button>
                </div>
                <div className="text-xs text-indigo-700 mb-2">
                  {wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)}
                </div>
                {balance.length > 0 && (
                  <div className="space-y-1">
                    {balance.map((bal, idx) => (
                      <div key={idx} className="text-xs text-indigo-600">
                        {bal.asset}: {bal.balance}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Error */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{paymentError}</p>
              </div>
            )}

            {/* Action Buttons */}
            {payment.status === 'CREATED' && (
              <div className="space-y-3">
                {!wallet.isConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Connect Freighter Wallet
                  </button>
                ) : (
                  <button
                    onClick={makePayment}
                    disabled={paying}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {paying ? 'Processing Payment...' : `Pay ${payment.amount} ${payment.asset}`}
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Print Payment Details
                </button>
              </div>
            )}

            {payment.status === 'CONFIRMED' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Confirmed!</h2>
                <p className="text-gray-600">Your payment has been successfully processed.</p>
              </div>
            )}

            {payment.status === 'FAILED' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
                <p className="text-gray-600">The payment could not be processed. Please try again.</p>
              </div>
            )}

            {payment.status === 'EXPIRED' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Expired</h2>
                <p className="text-gray-600">This payment link has expired. Please contact the merchant for a new payment link.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-sm text-gray-500">
              Powered by <span className="font-semibold text-indigo-600">PayFlow</span> • Stellar Testnet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
