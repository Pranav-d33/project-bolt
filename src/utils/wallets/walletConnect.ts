import { createWeb3Modal } from '@web3modal/wagmi';

const PROJECT_ID = 'c9024772a0599c71b7d99864c5c6c5a7'; // Demo project ID for testing

export async function initializeWalletConnect() {
  const modal = createWeb3Modal({
    projectId: PROJECT_ID,
    chains: ['ethereum']
  });
  await modal.open();
  return modal;
}