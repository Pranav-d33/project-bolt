export interface Transaction {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  amount: string;
  token: string;
  type: 'SEND' | 'RECEIVE' | 'SWAP' | 'OTHER';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  chain: 'ethereum' | 'solana';
  fee?: string;
  blockNumber?: number;
  metadata?: Record<string, any>;
}

export const BATCH_SIZE = 25; 