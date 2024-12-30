import React, { useEffect, useState } from 'react';
import { useTransactionSync } from '../hooks/useTransactionSync';
import { TransactionTable } from './TransactionTable';
import { useWalletStore } from '../store/walletStore';
import { Loader2 } from 'lucide-react';

export function TransactionList() {
  const { activeConnections, addresses } = useWalletStore();
  const { transactions, isLoading, error, progress, syncTransactions } = useTransactionSync();
  const [syncAttempted, setSyncAttempted] = useState(false);

  useEffect(() => {
    if (activeConnections.length > 0 && Object.keys(addresses).length > 0) {
      console.log('Starting transaction sync with addresses:', addresses);
      syncTransactions(addresses);
      setSyncAttempted(true);
    }
  }, [activeConnections, addresses, syncTransactions]);

  if (!activeConnections.length) {
    return (
      <div className="backdrop-blur-lg bg-white/[0.02] rounded-2xl p-8 text-center border border-white/10">
        <p className="text-gray-400">Connect a wallet to view transactions</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-lg bg-red-500/10 rounded-2xl p-8 text-center border border-red-500/20">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="backdrop-blur-lg bg-white/[0.02] rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Syncing transactions... {progress.toFixed(0)}%
              </p>
              <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && syncAttempted && transactions.length === 0 && (
        <div className="backdrop-blur-lg bg-white/[0.02] rounded-2xl p-8 text-center border border-white/10">
          <p className="text-gray-400">No transactions found</p>
        </div>
      )}

      {transactions.length > 0 && (
        <TransactionTable 
          transactions={transactions}
          isLoading={isLoading}
          onSort={(field) => console.log('Sorting by', field)}
          onExport={(type) => console.log('Exporting as', type)}
        />
      )}
    </div>
  );
}