// Manage RPC nodes and their health
export const RPC_NODES = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
  'https://solana.public-rpc.com',
  'https://api.solana.com'
];

let lastWorkingNodeIndex = 0;

export function getWorkingNodeUrl(): string {
  const url = RPC_NODES[lastWorkingNodeIndex];
  lastWorkingNodeIndex = (lastWorkingNodeIndex + 1) % RPC_NODES.length;
  return url;
}

export function markNodeAsFailed(failedUrl: string): void {
  const index = RPC_NODES.indexOf(failedUrl);
  if (index > -1) {
    // Move failed node to end of list
    RPC_NODES.push(RPC_NODES.splice(index, 1)[0]);
  }
}