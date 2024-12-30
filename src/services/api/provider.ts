import { Connection, ConnectionConfig } from '@solana/web3.js';
import { providers } from 'ethers';

// Solana connection config
const SOLANA_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 60000,
  wsEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_WS,
};

// Cache providers
let solanaConnection: Connection;
let ethereumProvider: providers.Provider;

export async function getSolanaConnection(): Promise<Connection> {
  if (!solanaConnection) {
    solanaConnection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP ?? 'https://api.mainnet-beta.solana.com',
      SOLANA_CONFIG
    );
  }
  return solanaConnection;
}

export async function getEthereumProvider(): Promise<providers.Provider> {
  if (!ethereumProvider) {
    ethereumProvider = new providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_ETHEREUM_RPC,
      'mainnet'
    );
  }
  return ethereumProvider;
} 