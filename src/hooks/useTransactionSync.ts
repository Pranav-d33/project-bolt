import { useState, useCallback } from 'react';
import { Transaction } from '../types/transaction';
import { fetchSolanaTransactions } from '../services/api/solana';
import { fetchEthereumTransactions } from '../services/api/ethereum';
import { prefetchCommonTokenPrices } from '../services/api/coingecko';

interface TransactionSyncState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  progress: number;
  networkStatus: {
    solana: 'idle' | 'loading' | 'success' | 'error';
    ethereum: 'idle' | 'loading' | 'success' | 'error';
  };
}

export function useTransactionSync() {
  const [state, setState] = useState<TransactionSyncState>({
    transactions: [],
    isLoading: false,
    error: null,
    progress: 0,
    networkStatus: {
      solana: 'idle',
      ethereum: 'idle'
    }
  });

  const syncTransactions = useCallback(async (walletAddresses: Record<string, string>) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      progress: 0,
      networkStatus: { solana: 'idle', ethereum: 'idle' }
    }));

    const allTransactions: Transaction[] = [];

    try {
      // Pre-fetch common token prices
      await prefetchCommonTokenPrices();

      // Parallel fetching for both networks
      const fetchPromises: Promise<void>[] = [];

      if (walletAddresses.phantom) {
        setState(prev => ({
          ...prev,
          networkStatus: { ...prev.networkStatus, solana: 'loading' }
        }));

        fetchPromises.push(
          fetchSolanaTransactions(walletAddresses.phantom)
            .then(txs => {
              console.log('Fetched Solana transactions:', txs.length);
              allTransactions.push(...txs);
              setState(prev => ({
                ...prev,
                networkStatus: { ...prev.networkStatus, solana: 'success' },
                progress: prev.progress + 50
              }));
            })
            .catch(error => {
              console.error('Error fetching Solana transactions:', error);
              setState(prev => ({
                ...prev,
                networkStatus: { ...prev.networkStatus, solana: 'error' }
              }));
              throw error;
            })
        );
      }

      if (walletAddresses.metamask) {
        setState(prev => ({
          ...prev,
          networkStatus: { ...prev.networkStatus, ethereum: 'loading' }
        }));

        fetchPromises.push(
          fetchEthereumTransactions(walletAddresses.metamask)
            .then(txs => {
              console.log('Fetched Ethereum transactions:', txs.length);
              allTransactions.push(...txs);
              setState(prev => ({
                ...prev,
                networkStatus: { ...prev.networkStatus, ethereum: 'success' },
                progress: prev.progress + 50
              }));
            })
            .catch(error => {
              console.error('Error fetching Ethereum transactions:', error);
              setState(prev => ({
                ...prev,
                networkStatus: { ...prev.networkStatus, ethereum: 'error' }
              }));
              throw error;
            })
        );
      }

      // Wait for all fetches to complete
      await Promise.allSettled(fetchPromises);

      // Sort all transactions by timestamp
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