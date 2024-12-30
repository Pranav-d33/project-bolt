import { Transaction } from '../../types/transaction';

const ETHERSCAN_API_URL = 'https://api.etherscan.io/api';
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY = 200; // 5 calls per second = 200ms between calls

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchEthereumTransactions(
  address: string,
  startBlock: string,
  apiKey: string
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  let currentPage = 1;
  let hasMore = true;
  let retries = 0;
  const MAX_RETRIES = 3;

  while (hasMore && retries < MAX_RETRIES) {
    try {
      const response = await fetch(
        `${ETHERSCAN_API_URL}?module=account&action=txlist&address=${address}&startblock=${startBlock}&page=${currentPage}&offset=${BATCH_SIZE}&sort=desc&apikey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === '1' && data.result.length > 0) {
        const formattedTransactions = data.result.map((tx: any) => ({
          hash: tx.hash,
          direction: tx.from.toLowerCase() === address.toLowerCase() ? 'outbound' : 'inbound',
          asset: {
            symbol: 'ETH',
            decimals: 18,
          },
          amount: tx.value,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          gasFee: tx.gasPrice * tx.gasUsed,
          status: tx.isError === '0' ? 'confirmed' : 'failed',
          network: 'ethereum',
        }));

        transactions.push(...formattedTransactions);
        currentPage++;
      } else {
        hasMore = false;
      }

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      retries++;
      if (retries === MAX_RETRIES) {
        throw new Error(`Failed to fetch Ethereum transactions after ${MAX_RETRIES} attempts`);
      }
      await delay(Math.pow(2, retries) * 1000); // Exponential backoff
    }
  }

  return transactions;
}