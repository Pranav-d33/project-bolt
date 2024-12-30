import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';
import { WalletNotReadyError } from '../errors/WalletErrors';

export async function initializeCoinbaseWallet() {
  const coinbaseWallet = new CoinbaseWalletSDK({
    appName: 'Web3 Wallet Integration',
    appLogoUrl: '',
    darkMode: false
  });
  
  const ethereum = coinbaseWallet.makeWeb3Provider();
  if (!ethereum) {
    throw new WalletNotReadyError('Failed to initialize Coinbase Wallet');
  }
  
  const provider = new ethers.BrowserProvider(ethereum);
  const accounts = await provider.send('eth_requestAccounts', []);
  
  return { provider, address: accounts[0] };
}