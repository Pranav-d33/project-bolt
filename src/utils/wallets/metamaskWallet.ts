import { ethers } from 'ethers';
import { WalletNotReadyError } from '../errors/WalletErrors';

export async function initializeMetaMask() {
  if (!window.ethereum) {
    throw new WalletNotReadyError('MetaMask is not installed');
  }
  return new ethers.BrowserProvider(window.ethereum);
}