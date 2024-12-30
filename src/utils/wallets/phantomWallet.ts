import { WalletNotReadyError } from '../errors/WalletErrors';

export async function initializePhantomWallet() {
  if (typeof window === 'undefined') {
    throw new WalletNotReadyError('Window is not defined');
  }

  if (!window.solana || !window.solana.isPhantom) {
    window.open('https://phantom.app/', '_blank');
    throw new WalletNotReadyError('Please install Phantom wallet');
  }

  try {
    const resp = await window.solana.connect();
    console.log('Phantom connected:', resp.publicKey.toString());
    return { 
      wallet: window.solana,
      address: resp.publicKey.toString()
    };
  } catch (err: any) {
    if (err.code === 4001) {
      throw new Error('Please accept the connection request in Phantom');
    }
    throw new Error('Failed to connect to Phantom wallet');
  }
}