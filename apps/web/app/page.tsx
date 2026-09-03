import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">PayFlow</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              <Link href="https://github.com/Finrail/PayFlow" className="text-gray-700 hover:text-indigo-600 transition-colors">
                GitHub
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Accept Stellar Payments with Ease
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Open-source payment infrastructure for the Stellar network. Simple API, instant payments, and full control over your funds.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="https://github.com/Finrail/PayFlow"
              className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-300"
            >
              View on GitHub
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Payments</h3>
            <p className="text-gray-600">Process payments in seconds on the Stellar network with minimal fees.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Non-Custodial</h3>
            <p className="text-gray-600">Payments go directly to your wallet. We never hold your funds.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Simple API</h3>
            <p className="text-gray-600">Easy-to-use REST API and TypeScript SDK for quick integration.</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Payment</h3>
              <p className="text-gray-600 text-sm">Generate a payment link via API or dashboard</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Share Link</h3>
              <p className="text-gray-600 text-sm">Send the payment link to your customer</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer Pays</h3>
              <p className="text-gray-600 text-sm">Customer pays with their Stellar wallet</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Receive Funds</h3>
              <p className="text-gray-600 text-sm">Funds arrive directly in your wallet</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">Powered by <span className="font-semibold text-indigo-600">PayFlow</span> • Built on Stellar</p>
            <p className="text-sm">Stellar Testnet • Open Source • MIT License</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
