import { Connection, ConnectionConfig } from '@solana/web3.js';

const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 60000
};

const RPC_NODES = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana'
];

let currentConnection: Connection | null = null;
let lastConnectionTime = 0;
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export async function getConnection(): Promise<Connection> {
  const now = Date.now();

  // If we have a recent connection, reuse it
  if (currentConnection && (now - lastConnectionTime) < CONNECTION_TIMEOUT) {
    return currentConnection;
  }

  // Try each RPC node until one works
  for (const url of RPC_NODES) {
    try {
      const connection = new Connection(url, CONNECTION_CONFIG);
      await connection.getSlot(); // Test the connection
      
      currentConnection = connection;
      lastConnectionTime = now;
      return connection;
    } catch (error) {
      console.error(`RPC node ${url} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All RPC nodes are unavailable');
}