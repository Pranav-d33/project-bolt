export interface TokenMetadata {
  symbol: string;
  decimals: number;
  contractAddress?: string;
}

export interface SwapDetails {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  fromValueUsd: number;
  toValueUsd: number;
  fromValueInr: number;
  toValueInr: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  protocol?: string;
}

export interface Transaction {
  hash: string;
  direction: 'inbound' | 'outbound' | 'swap';
  asset: TokenMetadata;
  amount: string;
  amountReceived?: string;
  valueUsd: number;
  valueInr: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  network: string;
  type?: 'transfer' | 'swap';
  details?: SwapDetails;
  raw?: any; // For debugging
}

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  direction?: 'inbound' | 'outbound';
  asset?: string;
  network?: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}