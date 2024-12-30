import { PublicKey } from '@solana/web3.js';
import { Transaction } from '../../types/transaction';
import { fetchTransactionBatch } from './solana/fetcher';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export async function fetchSolanaTransactions(
  address: string
): Promise<Transaction[]> {
  console.debug('Starting Solana transaction fetch for address:', address);
  
  const transactions: Transaction[] = [];
  let lastSignature: string | undefined;
  let retries = 0;
  let batchCount = 0;
  const MAX_BATCHES = 10; // Limit the number of batches to prevent infinite loops

  try {
    const pubKey = new PublicKey(address);
    console.debug('Valid Solana public key:', pubKey.toString());

    while (batchCount < MAX_BATCHES) {
      try {
        console.debug(`Fetching batch ${batchCount + 1}...`);
        
        const { transactions: batch, lastSignature: newLastSignature } = 
          await fetchTransactionBatch(pubKey, lastSignature);

        if (batch.length > 0) {
          console.debug(`Received ${batch.length} transactions in batch ${batchCount + 1}`);
          transactions.push(...batch);
        } else {
          console.debug('No transactions in batch, stopping');
          break;
        }

        if (!newLastSignature) {
          console.debug('No more signatures available');
          break;
        }

        lastSignature = newLastSignature;
        retries = 0;
        batchCount++;
        
        // Add a delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error in batch ${batchCount + 1}:`, error);
        retries++;
        
        if (retries >= MAX_RETRIES) {
          console.error('Max retries reached, stopping');
          break;
        }

        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, INITIAL_RETRY_DELAY * Math.pow(2, retries - 1))
        );
      }
    }

    console.debug(`Completed fetching ${transactions.length} total transactions`);
    return transactions;
  } catch (error) {
    console.error('Failed to fetch Solana transactions:', error);
    throw error;
  }
}