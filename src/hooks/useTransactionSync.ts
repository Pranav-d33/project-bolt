import { useState, useCallback } from 'react';
import { Transaction } from '../types/transaction';
import { fetchSolanaTransactions } from '../services/api/solana';
import { prefetchCommonTokenPrices } from '../services/api/coingecko';

interface TransactionSyncState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export function useTransactionSync() {
  const [state, setState] = useState<TransactionSyncState>({
    transactions: [],
    isLoading: false,
    error: null,
    progress: 0,
  });

  const syncTransactions = useCallback(async (walletAddresses: Record<string, string>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));
    const allTransactions: Transaction[] = [];

    try {
      // Validate inputs
      if (!walletAddresses || typeof walletAddresses !== 'object') {
        throw new Error('Invalid wallet addresses provided');
      }

      // Pre-fetch common token prices
      await prefetchCommonTokenPrices();

      if (walletAddresses.phantom) {
        console.log('Fetching Solana transactions for address:', walletAddresses.phantom);
        try {
          // Validate Solana address
          if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddresses.phantom)) {
            throw new Error('Invalid Solana address format');
          }

          const solTxs = await fetchSolanaTransactions(walletAddresses.phantom);
          console.log('Fetched Solana transactions:', solTxs.length);
          allTransactions.push(...solTxs);
          setState(prev => ({ ...prev, progress: 50 }));
        } catch (error) {
          console.error('Error fetching Solana transactions:', error);
          throw error;
        }
      }

      // Sort transactions by timestamp
      allTransactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log('Total transactions found:', allTransactions.length);
      setState(prev => ({
        ...prev,
        transactions: allTransactions,
        isLoading: false,
        progress: 100,
        error: null
      }));
    } catch (error) {
      console.error('Transaction sync error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to sync transactions',
        isLoading: false,
        progress: 0
      }));
    }
  }, []);

  return {
    ...state,
    syncTransactions,
  };
}