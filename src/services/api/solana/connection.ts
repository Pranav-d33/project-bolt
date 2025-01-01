import { Connection, ConnectionConfig } from '@solana/web3.js';

interface RPCNode {
  url: string;
  weight: number;
  failCount: number;
  lastFailTime: number;
  isAvailable: boolean;
}

const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 60000
};

const RPC_NODES: RPCNode[] = [
  { 
    url: 'https://api.mainnet-beta.solana.com',
    weight: 1,
    failCount: 0,
    lastFailTime: 0,
    isAvailable: true
  },
  { 
    url: 'https://solana-api.projectserum.com',
    weight: 1,
    failCount: 0,
    lastFailTime: 0,
    isAvailable: true
  },
  { 
    url: 'https://rpc.ankr.com/solana',
    weight: 1,
    failCount: 0,
    lastFailTime: 0,
    isAvailable: true
  }
];

let currentConnection: Connection | null = null;
let lastConnectionTime = 0;
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const FAIL_THRESHOLD = 3;
const RECOVERY_TIME = 5 * 60 * 1000; // 5 minutes

function markNodeAsFailed(node: RPCNode) {
  node.failCount++;
  node.lastFailTime = Date.now();
  
  if (node.failCount >= FAIL_THRESHOLD) {
    node.isAvailable = false;
    console.warn(`RPC node ${node.url} marked as unavailable due to repeated failures`);
    
    // Schedule recovery
    setTimeout(() => {
      node.isAvailable = true;
      node.failCount = 0;
      console.log(`RPC node ${node.url} restored to available pool`);
    }, RECOVERY_TIME);
  }
}

function getNextRPCNode(): RPCNode | null {
  const availableNodes = RPC_NODES.filter(node => node.isAvailable);
  if (availableNodes.length === 0) {
    console.error('No RPC nodes available');
    return null;
  }

  // Weight-based selection
  const totalWeight = availableNodes.reduce((sum, node) => sum + node.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const node of availableNodes) {
    random -= node.weight;
    if (random <= 0) return node;
  }
  
  return availableNodes[0];
}

export async function getConnection(): Promise<Connection> {
  const now = Date.now();

  // If we have a recent connection, reuse it
  if (currentConnection && (now - lastConnectionTime) < CONNECTION_TIMEOUT) {
    return currentConnection;
  }

  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let retry = 0; retry < maxRetries; retry++) {
    const node = getNextRPCNode();
    if (!node) {
      throw new Error('All RPC nodes are unavailable');
    }

    try {
      console.log(`Attempting connection to ${node.url}`);
      const connection = new Connection(node.url, CONNECTION_CONFIG);
      await connection.getSlot(); // Test the connection
      
      currentConnection = connection;
      lastConnectionTime = now;
      
      // Increase weight of successful node
      node.weight = Math.min(node.weight + 0.1, 2.0);
      node.failCount = 0;
      
      console.log(`Successfully connected to ${node.url}`);
      return connection;
    } catch (error) {
      console.error(`Failed to connect to ${node.url}:`, error);
      lastError = error as Error;
      markNodeAsFailed(node);
      
      // Decrease weight of failed node
      node.weight = Math.max(node.weight - 0.2, 0.1);
      
      // Add delay between retries
      if (retry < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }
  }

  throw new Error(`Failed to connect to any RPC node: ${lastError?.message}`);
}