import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { Transaction } from '../../../types/transaction';
import { getHistoricalTokenPrice } from '../coingecko';

// Known token symbols by mint address
const TOKEN_SYMBOLS: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': 'RAY',
  '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4mFNd': 'GMT',
  'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': 'GST',
  // Add more as needed
};

function getTokenSymbol(mint: string): string {
  return TOKEN_SYMBOLS[mint] || 'Unknown';
}

function findTokenTransfers(
  tx: ParsedTransactionWithMeta,
  userPubKey: PublicKey
): Array<{
  amount: number;
  symbol: string;
  decimals: number;
  direction: 'inbound' | 'outbound';
  mint: string;
}> {
  const transfers: Array<{
    amount: number;
    symbol: string;
    decimals: number;
    direction: 'inbound' | 'outbound';
    mint: string;
  }> = [];

  if (!tx.meta?.postTokenBalances || !tx.meta?.preTokenBalances) {
    return transfers;
  }

  const preBalances = new Map(
    tx.meta.preTokenBalances.map(b => [`${b.accountIndex}-${b.mint}`, b])
  );
  
  tx.meta.postTokenBalances.forEach(postBalance => {
    const key = `${postBalance.accountIndex}-${postBalance.mint}`;
    const preBalance = preBalances.get(key);
    
    if (!preBalance) {
      if (postBalance.owner === userPubKey.toString()) {
        transfers.push({
          amount: Number(postBalance.uiTokenAmount.uiAmount || 0),
          symbol: getTokenSymbol(postBalance.mint),
          decimals: postBalance.uiTokenAmount.decimals,
          direction: 'inbound',
          mint: postBalance.mint
        });
      }
      return;
    }

    if (postBalance.owner === userPubKey.toString()) {
      const preAmount = Number(preBalance.uiTokenAmount.uiAmount || 0);
      const postAmount = Number(postBalance.uiTokenAmount.uiAmount || 0);
      const difference = postAmount - preAmount;

      if (Math.abs(difference) > 0.000001) {
        transfers.push({
          amount: Math.abs(difference),
          symbol: getTokenSymbol(postBalance.mint),
          decimals: postBalance.uiTokenAmount.decimals,
          direction: difference > 0 ? 'inbound' : 'outbound',
          mint: postBalance.mint
        });
      }
    }
  });

  return transfers;
}

function findSolTransfer(
  tx: ParsedTransactionWithMeta,
  pubKey: PublicKey
): { amount: number; direction: 'inbound' | 'outbound' } | null {
  const accountIndex = tx.transaction.message.accountKeys.findIndex(
    key => key.toString() === pubKey.toString()
  );
  
  if (accountIndex === -1) return null;
  
  const preBalance = tx.meta?.preBalances[accountIndex] || 0;
  const postBalance = tx.meta?.postBalances[accountIndex] || 0;
  const difference = (postBalance - preBalance) / 1e9;
  
  if (Math.abs(difference) > 0.000001) {
    return {
      amount: Math.abs(difference),
      direction: difference > 0 ? 'inbound' : 'outbound'
    };
  }
  
  return null;
}

function detectSwapTokens(
  tx: ParsedTransactionWithMeta,
  transfers: Array<{ symbol: string; direction: 'inbound' | 'outbound' }>
): { fromToken: string; toToken: string } {
  const outbound = transfers.find(t => t.direction === 'outbound');
  const inbound = transfers.find(t => t.direction === 'inbound');

  return {
    fromToken: outbound?.symbol || 'Unknown',
    toToken: inbound?.symbol || 'Unknown'
  };
}

function isSwapTransaction(tx: ParsedTransactionWithMeta): boolean {
  // Check program IDs for common DEXes
  const programIds = tx.transaction.message.accountKeys.map(key => key.toString());
  const knownDexes = [
    'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB', // Jupiter
    '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP', // Orca
    'SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8',  // Raydium
  ];

  if (programIds.some(id => knownDexes.includes(id))) {
    return true;
  }

  // Check log messages
  return tx.meta?.logMessages?.some(msg => 
    msg.toLowerCase().includes('swap') || 
    msg.toLowerCase().includes('exchange') ||
    msg.toLowerCase().includes('trade')
  ) ?? false;
}

function getSwapProtocol(tx: ParsedTransactionWithMeta): string {
  const programIds = tx.transaction.message.accountKeys.map(key => key.toString());
  
  if (programIds.includes('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB')) {
    return 'Jupiter';
  }
  if (programIds.includes('9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP')) {
    return 'Orca';
  }
  if (programIds.includes('SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8')) {
    return 'Raydium';
  }
  return 'Unknown DEX';
}

export async function parseTransaction(
  tx: ParsedTransactionWithMeta,
  pubKey: PublicKey
): Promise<Transaction | null> {
  try {
    if (!tx.meta || tx.meta.err) {
      return null;
    }

    const tokenTransfers = findTokenTransfers(tx, pubKey);
    const solTransfer = findSolTransfer(tx, pubKey);
    const timestamp = tx.blockTime || Math.floor(Date.now() / 1000);

    // Check for swap first
    if (isSwapTransaction(tx) && tokenTransfers.length > 0) {
      const { fromToken, toToken, fromAmount, toAmount, fromMint, toMint } = 
        await detectSwapDetails(tx, tokenTransfers, timestamp);

      // Get prices at the time of swap
      const [fromPrice, toPrice] = await Promise.all([
        getHistoricalTokenPrice(fromMint, timestamp),
        getHistoricalTokenPrice(toMint, timestamp)
      ]);

      const fromValueUSD = fromPrice ? fromAmount * fromPrice.usd : 0;
      const toValueUSD = toPrice ? toAmount * toPrice.usd : 0;
      const fromValueINR = fromPrice ? fromAmount * fromPrice.inr : 0;
      const toValueINR = toPrice ? toAmount * toPrice.inr : 0;

      return {
        hash: tx.transaction.signatures[0],
        direction: 'swap',
        asset: {
          symbol: `${fromToken}→${toToken}`,
          decimals: 0,
        },
        amount: `${fromAmount} ${fromToken}`,
        amountReceived: `${toAmount} ${toToken}`,
        valueUsd: Math.abs(fromValueUSD - toValueUSD),
        valueInr: Math.abs(fromValueINR - toValueINR),
        timestamp: new Date(timestamp * 1000).toISOString(),
        status: 'confirmed',
        network: 'solana',
        type: 'swap',
        details: {
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          fromValueUsd: fromValueUSD,
          toValueUsd: toValueUSD,
          fromValueInr: fromValueINR,
          toValueInr: toValueINR,
          fromTokenAddress: fromMint,
          toTokenAddress: toMint,
          protocol: getSwapProtocol(tx)
        },
        raw: tx // For debugging
      };
    }

    // If we have token transfers, create transactions for each
    if (tokenTransfers.length > 0) {
      const transfer = tokenTransfers[0];
      return {
        hash: tx.transaction.signatures[0],
        direction: transfer.direction,
        asset: {
          symbol: transfer.symbol,
          decimals: transfer.decimals,
          contractAddress: transfer.mint
        },
        amount: transfer.amount.toString(),
        amountInr: '0',
        timestamp: new Date((tx.blockTime || 0) * 1000).toISOString(),
        status: 'confirmed',
        network: 'solana',
      };
    }

    // If we have a SOL transfer
    if (solTransfer) {
      return {
        hash: tx.transaction.signatures[0],
        direction: solTransfer.direction,
        asset: {
          symbol: 'SOL',
          decimals: 9,
        },
        amount: solTransfer.amount.toString(),
        amountInr: '0',
        timestamp: new Date((tx.blockTime || 0) * 1000).toISOString(),
        status: 'confirmed',
        network: 'solana',
      };
    }

    return null;
  } catch (error) {
    console.error('Transaction parsing error:', error);
    return null;
  }
}

async function detectSwapDetails(
  tx: ParsedTransactionWithMeta,
  transfers: Array<{ symbol: string; direction: 'inbound' | 'outbound'; amount: number; mint: string }>,
  timestamp: number
): Promise<{
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fromMint: string;
  toMint: string;
}> {
  const outbound = transfers.find(t => t.direction === 'outbound');
  const inbound = transfers.find(t => t.direction === 'inbound');

  return {
    fromToken: outbound?.symbol || 'Unknown',
    toToken: inbound?.symbol || 'Unknown',
    fromAmount: outbound?.amount || 0,
    toAmount: inbound?.amount || 0,
    fromMint: outbound?.mint || '',
    toMint: inbound?.mint || ''
  };
}