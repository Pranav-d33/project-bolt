import { create } from 'zustand';
import {
  initializePhantomWallet,
  initializeMetaMask,
  initializeWalletConnect,
  initializeCoinbaseWallet
} from '../utils/walletUtils';
import { Connection, PublicKey } from '@solana/web3.js';

interface WalletState {
  activeConnections: string[];
  addresses: { [key: string]: string };
  isConnecting: boolean;
  error: string | null;
  solanaConnection: Connection | null;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: (walletType: string) => void;
  clearError: () => void;
  cleanup: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  activeConnections: [],
  addresses: {},
  isConnecting: false,
  error: null,
  solanaConnection: null,

  connectWallet: async (walletType: string) => {
    set({ isConnecting: true, error: null });
    
    try {
      if (walletType === 'phantom') {
        if (!(window as any).solana) {
          throw new Error('Phantom wallet is not installed');
        }

        // Force disconnect first to ensure clean state
        await (window as any).solana.disconnect();
        
        const resp = await (window as any).solana.connect();
        const address = resp.publicKey.toString();
        
        // Create Solana connection
        const connection = new Connection(
          'https://api.mainnet-beta.solana.com',
          'confirmed'
        );

        // Verify the connection and address
        try {
          const balance = await connection.getBalance(new PublicKey(address));
          console.log('Connected to Phantom wallet:', { address, balance });
        } catch (err) {
          console.error('Failed to verify Solana connection:', err);
          throw new Error('Failed to verify wallet connection');
        }

        set(state => ({
          activeConnections: [...state.activeConnections, walletType],
          addresses: { ...state.addresses, [walletType]: address },
          solanaConnection: connection,
          isConnecting: false
        }));
        
        return;
      }

      let address = '';
      let provider = null;
      
      switch (walletType) {
        case 'metamask': {
          const provider = await initializeMetaMask();
          const accounts = await provider.send('eth_requestAccounts', []);
          address = accounts[0];
          break;
        }
        case 'walletconnect':
          await initializeWalletConnect();
          break;
        case 'coinbase': {
          const { address: coinbaseAddress } = await initializeCoinbaseWallet();
          address = coinbaseAddress;
          break;
        }
        default:
          throw new Error('Unsupported wallet type');
      }

      // Verify the connection
      if (!address) {
        throw new Error('Failed to get wallet address');
      }

      set(state => ({
        activeConnections: [...state.activeConnections, walletType],
        addresses: { ...state.addresses, [walletType]: address },
        providers: { ...state.providers, [walletType]: provider }
      }));
    } catch (error) {
      console.error('Wallet connection error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
        isConnecting: false 
      });
    }
  },

  disconnectWallet: (walletType: string) => {
    const { solanaConnection } = get();
    
    if (walletType === 'phantom') {
      // Cleanup Phantom connection
      (window as any).solana?.disconnect().catch(console.error);
      
      // Cleanup Solana connection
      if (solanaConnection) {
        solanaConnection.removeAllListeners();
      }
    }

    set(state => ({
      activeConnections: state.activeConnections.filter(w => w !== walletType),
      addresses: Object.fromEntries(
        Object.entries(state.addresses).filter(([key]) => key !== walletType)
      ),
      solanaConnection: walletType === 'phantom' ? null : state.solanaConnection,
      error: null
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  cleanup: () => {
    const { solanaConnection } = get();
    if (solanaConnection) {
      solanaConnection.removeAllListeners();
    }
    set({
      activeConnections: [],
      addresses: {},
      solanaConnection: null,
      error: null
    });
  }
}));