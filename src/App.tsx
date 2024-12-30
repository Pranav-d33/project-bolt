import React, { ErrorBoundary } from 'react';
import { WalletConnector } from './components/WalletConnector';
import { TransactionList } from './components/TransactionList';

class ErrorFallback extends React.Component<{ error: Error }> {
  render() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8 bg-red-500/10 rounded-lg border border-red-500/20">
          <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-gray-400">{this.props.error.message}</p>
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-slate-900 to-black p-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative max-w-7xl mx-auto space-y-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-sky-200 to-indigo-200 mb-2">
              Web3 Portfolio Tracker
            </h1>
            <p className="text-gray-400">Connect your wallets and track your transactions across chains</p>
          </header>
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <WalletConnector />
            </div>
            <div className="lg:col-span-8">
              <TransactionList />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;