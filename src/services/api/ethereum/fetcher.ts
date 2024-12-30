export async function fetchEthereumTransactionBatch(
  address: string,
  startBlock?: number
): Promise<{ transactions: Transaction[]; nextBlock?: number }> {
  const provider = await getProvider();
  
  try {
    // Get current block for pagination
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = startBlock ?? Math.max(0, currentBlock - 1000); // Default to last 1000 blocks
    
    // Fetch both normal and internal transactions in parallel
    const [normalTxs, internalTxs] = await Promise.all([
      provider.getHistory(address, {
        fromBlock,
        toBlock: currentBlock,
        maxItems: BATCH_SIZE
      }),
      // If using Etherscan API for internal transactions
      fetchInternalTransactions(address, fromBlock, currentBlock)
    ]);

    // Combine and sort transactions
    const allTxs = [...normalTxs, ...internalTxs]
      .sort((a, b) => b.blockNumber - a.blockNumber);

    const transactions = await Promise.all(
      allTxs.slice(0, BATCH_SIZE).map(async (tx) => {
        try {
          const receipt = await provider.getTransactionReceipt(tx.hash);
          return parseEthereumTransaction(tx, receipt, address);
        } catch (err) {
          console.error(`Error fetching receipt for ${tx.hash}:`, err);
          return null;
        }
      })
    );

    return {
      transactions: transactions.filter((tx): tx is Transaction => tx !== null),
      nextBlock: allTxs.length > 0 ? allTxs[allTxs.length - 1].blockNumber : undefined
    };
  } catch (error) {
    console.error('Failed to fetch Ethereum transactions:', error);
    throw error;
  }
} 