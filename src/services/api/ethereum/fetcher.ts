import { Transaction } from '../../../types/transaction';
import { getHistoricalTokenPrice } from '../coingecko';

const ETHERSCAN_API_KEY = 'YOUR_ETHERSCAN_API_KEY'; // You'll need to replace this
const ETHERSCAN_API = 'https://api.etherscan.io/api';

interface EtherscanTransaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  contractAddress?: string;
}

export async function fetchEthereumTransactionBatch(
  address: string,
  startBlock = '0'
): Promise<Transaction[]> {
  try {
    // Fetch normal ETH transactions
    const ethTxs = await fetchEthTransactions(address, startBlock);
    
    // Fetch ERC20 token transfers
    const tokenTxs = await fetchTokenTransactions(address, startBlock);

    // Combine and parse all transactions
    const allTxs = [...ethTxs, ...tokenTxs];
    const parsedTxs = await Promise.all(
      allTxs.map(tx => parseEthereumTransaction(tx, address.toLowerCase()))
    );

    return parsedTxs.filter((tx): tx is Transaction => tx !== null);
  } catch (error) {
    console.error('Error fetching Ethereum transactions:', error);
    throw error;
  }
}

async function fetchEthTransactions(
  address: string,
  startBlock: string
): Promise<EtherscanTransaction[]> {
  const url = `${ETHERSCAN_API}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result;
    }
    
    throw new Error(data.message || 'Failed to fetch ETH transactions');
  } catch (error) {
    console.error('Error fetching ETH transactions:', error);
    throw error;
  }
}

async function fetchTokenTransactions(
  address: string,
  startBlock: string
): Promise<EtherscanTransaction[]> {
  const url = `${ETHERSCAN_API}?module=account&action=tokentx&address=${address}&startblock=${startBlock}&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result;
    }
    
    throw new Error(data.message || 'Failed to fetch token transactions');
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    throw error;
  }
}

async function parseEthereumTransaction(
  tx: EtherscanTransaction,
  userAddress: string
): Promise<Transaction | null> {
  try {
    const timestamp = parseInt(tx.timeStamp) * 1000;
    const direction = tx.from.toLowerCase() === userAddress ? 'outbound' : 'inbound';
    
    // For ETH transactions
    if (!tx.tokenSymbol) {
      const ethValue = parseFloat(tx.value) / 1e18;
      const price = await getHistoricalTokenPrice('ethereum', Math.floor(timestamp / 1000));
      
      return {
        hash: tx.hash,
        timestamp: new Date(timestamp).toISOString(),
        direction,
        asset: {
          symbol: 'ETH',
          decimals: 18
        },
        amount: ethValue.toString(),
        valueUsd: price ? ethValue * price.usd : 0,
        valueInr: price ? ethValue * price.inr : 0,
        status: 'confirmed',
        network: 'ethereum',
        type: 'transfer'
      };
    }
    
    // For token transactions
    const tokenValue = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal || '18'));
    const price = await getHistoricalTokenPrice(tx.contractAddress || '', Math.floor(timestamp / 1000));
    
    return {
      hash: tx.hash,
      timestamp: new Date(timestamp).toISOString(),
      direction,
      asset: {
        symbol: tx.tokenSymbol,
        decimals: parseInt(tx.tokenDecimal || '18'),
        contractAddress: tx.contractAddress
      },
      amount: tokenValue.toString(),
      valueUsd: price ? tokenValue * price.usd : 0,
      valueInr: price ? tokenValue * price.inr : 0,
      status: 'confirmed',
      network: 'ethereum',
      type: 'transfer'
    };
  } catch (error) {
    console.error('Error parsing Ethereum transaction:', error);
    return null;
  }
} 