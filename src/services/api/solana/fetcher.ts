import { Connection, PublicKey } from '@solana/web3.js';
import { Transaction } from '../../../types/transaction';
import { getConnection } from './connection';
import { parseTransaction } from './parser';

const BATCH_SIZE = 25;
const MAX_CONCURRENT_REQUESTS = 3;

export async function fetchTransactionBatch(
  pubKey: PublicKey,
  beforeSignature?: string
): Promise<{ transactions: Transaction[]; lastSignature?: string }> {
  let connection: Connection;
  
  try {
    connection = await getConnection();
    console.log('Established Solana connection for', pubKey.toString());
  } catch (error) {
    console.error('Failed to get Solana connection:', error);
    throw new Error('Could not establish Solana connection');
  }
  
  try {
    console.debug('Fetching signatures for', pubKey.toString());
    
    if (!pubKey) {
      throw new Error('Invalid public key');
    }

    const signatures = await connection.getSignaturesForAddress(
      pubKey,
      { 
        before: beforeSignature, 
        limit: BATCH_SIZE,
        commitment: 'confirmed'
      },
      'confirmed'
    );

    console.debug(`Found ${signatures.length} signatures for ${pubKey.toString()}`);

    if (signatures.length === 0) {
      console.debug('No signatures found');
      return { transactions: [] };
    }

    // Process signatures in chunks
    const transactions: Transaction[] = [];
    const chunks = [];
    
    for (let i = 0; i < signatures.length; i += MAX_CONCURRENT_REQUESTS) {
      chunks.push(signatures.slice(i, i + MAX_CONCURRENT_REQUESTS));
    }

    console.debug(`Processing ${chunks.length} chunks of signatures`);

    for (const chunk of chunks) {
      console.debug(`Processing chunk of ${chunk.length} signatures`);
      const chunkPromises = chunk.map(async (sig) => {
        if (!sig?.signature) {
          console.warn('Invalid signature object:', sig);
          return null;
        }

        try {
          console.debug(`Fetching transaction ${sig.signature}`);
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          });

          if (!tx) {
            console.warn(`No transaction data found for ${sig.signature}`);
            return null;
          }

          console.debug(`Parsing transaction ${sig.signature}`);
          const parsed = await parseTransaction(tx, pubKey);
          if (parsed) {
            console.debug(`Successfully parsed transaction ${sig.signature}`);
            return parsed;
          } else {
            console.debug(`Transaction ${sig.signature} was not relevant to user`);
          }
          return null;
        } catch (error) {
          console.error('Error fetching transaction:', sig.signature, error);
          return null;
        }
      });

      try {
        const results = await Promise.all(chunkPromises);
        const validTransactions = results.filter((tx): tx is Transaction => tx !== null);
        console.debug(`Found ${validTransactions.length} valid transactions in chunk`);
        transactions.push(...validTransactions);
      } catch (error) {
        console.error('Error processing chunk:', error);
        // Continue with next chunk instead of failing completely
      }
      
      // Add delay between chunks to avoid rate limits
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
      }
    }

    console.debug(`Completed processing with ${transactions.length} total transactions`);
    return {
      transactions,
      lastSignature: signatures[signatures.length - 1]?.signature
    };
  } catch (error) {
    console.error('Failed to fetch transaction batch:', error);
    throw error;
  }
}