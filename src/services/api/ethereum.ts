import { Transaction } from '../../types/transaction';
import { fetchEthereumTransactionBatch } from './ethereum/fetcher';

export async function fetchEthereumTransactions(
  address: string
): Promise<Transaction[]> {
  try {
    console.debug('Starting Ethereum transaction fetch for address:', address);
    
    const transactions = await fetchEthereumTransactionBatch(address);
    console.debug(`Fetched ${transactions.length} Ethereum transactions`);
    
    return transactions;
  } catch (error) {
    console.error('Failed to fetch Ethereum transactions:', error);
    throw error;
  }
} 