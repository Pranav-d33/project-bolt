export const API_CONFIG = {
  ETHERSCAN: {
    API_KEY: import.meta.env.VITE_ETHERSCAN_API_KEY || '',
    BASE_URL: 'https://api.etherscan.io/api',
    RATE_LIMIT: 5, // requests per second
  },
  SOLANA: {
    API_KEY: import.meta.env.VITE_SOLSCAN_API_KEY || '',
    RPC_NODES: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana', // Added backup RPC
    ],
    RATE_LIMIT: 10, // requests per second
  }
};