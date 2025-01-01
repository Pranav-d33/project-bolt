const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = 'CG-f4obD8oUJN8m8hQc4CMmzeQW';

// Map Solana token addresses to CoinGecko IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'solana',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'bonk',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'msol',
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': 'raydium',
  '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4mFNd': 'stepn',
  'AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB': 'gst',
  'ethereum': 'ethereum',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin',
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'matic-network',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap',
};

export interface TokenPrice {
  usd: number;
  inr: number;
  timestamp: number;
}

const cache = new Map<string, TokenPrice>();

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'x-cg-demo-api-key': COINGECKO_API_KEY,
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 429) {
        console.warn('Rate limit hit, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s on rate limit
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

export async function getHistoricalTokenPrice(
  mintAddress: string,
  timestamp: number
): Promise<TokenPrice | null> {
  try {
    const cacheKey = `${mintAddress}-${timestamp}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const coinId = COINGECKO_ID_MAP[mintAddress];
    if (!coinId) {
      console.warn(`No CoinGecko ID found for token: ${mintAddress}`);
      return null;
    }

    const date = new Date(timestamp * 1000).toISOString().split('T')[0];
    const url = `${COINGECKO_API}/coins/${coinId}/history?date=${date}&localization=false`;

    const data = await fetchWithRetry(url);
    
    if (!data.market_data?.current_price) {
      console.warn(`No price data found for ${coinId} at ${date}`);
      return null;
    }

    const price: TokenPrice = {
      usd: data.market_data.current_price.usd,
      inr: data.market_data.current_price.inr,
      timestamp
    };

    cache.set(cacheKey, price);
    return price;
  } catch (error) {
    console.error('Failed to fetch historical price:', error);
    return null;
  }
}

export async function getCurrentTokenPrice(mintAddress: string): Promise<TokenPrice | null> {
  try {
    const coinId = COINGECKO_ID_MAP[mintAddress];
    if (!coinId) {
      console.warn(`No CoinGecko ID found for token: ${mintAddress}`);
      return null;
    }

    const url = `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd,inr&include_last_updated_at=true`;
    const data = await fetchWithRetry(url);

    if (!data[coinId]) {
      console.warn(`No price data found for ${coinId}`);
      return null;
    }

    const price: TokenPrice = {
      usd: data[coinId].usd,
      inr: data[coinId].inr,
      timestamp: data[coinId].last_updated_at
    };

    // Cache current prices for 5 minutes
    const cacheKey = `${mintAddress}-current`;
    cache.set(cacheKey, price);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);

    return price;
  } catch (error) {
    console.error('Failed to fetch current price:', error);
    return null;
  }
}

// Add a method to pre-fetch prices for common tokens
export async function prefetchCommonTokenPrices(): Promise<void> {
  const commonTokens = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  ];

  try {
    await Promise.all(
      commonTokens.map(mint => getCurrentTokenPrice(mint))
    );
    console.debug('Pre-fetched common token prices');
  } catch (error) {
    console.error('Failed to pre-fetch token prices:', error);
  }
}

// Add a method to clear old cache entries
export function clearOldCacheEntries(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp * 1000 > 24 * 60 * 60 * 1000) { // Clear entries older than 24h
      cache.delete(key);
    }
  }
}

// Run cache cleanup every hour
setInterval(clearOldCacheEntries, 60 * 60 * 1000);