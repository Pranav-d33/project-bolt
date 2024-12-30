import React, { useEffect } from 'react';
import { Wallet, Coins, XCircle } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { WalletButton } from './buttons/WalletButton';

export function WalletConnector() {
  const { connectWallet, isConnecting, activeConnections, error, clearError } = useWalletStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const wallets = [
    {
      type: 'metamask',
      icon: Wallet,
      label: activeConnections.includes('metamask') ? 'MetaMask Connected' : 'Connect MetaMask',
      variant: 'metamask' as const,
    },
    {
      type: 'phantom',
      icon: Coins,
      label: activeConnections.includes('phantom') ? 'Phantom Connected' : 'Connect Phantom',
      variant: 'phantom' as const,
    },
    {
      type: 'walletconnect',
      icon: Wallet,
      label: activeConnections.includes('walletconnect') ? 'WalletConnect Connected' : 'Connect WalletConnect',
      variant: 'walletconnect' as const,
    },
    {
      type: 'coinbase',
      icon: Wallet,
      label: activeConnections.includes('coinbase') ? 'Coinbase Connected' : 'Connect Coinbase',
      variant: 'coinbase' as const,
    },
  ];

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 shadow-xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Connect Wallet</h2>
      <div className="grid grid-cols-1 gap-4">
        {wallets.map((wallet) => (
          <WalletButton
            key={wallet.type}
            onClick={() => connectWallet(wallet.type)}
            disabled={isConnecting || activeConnections.includes(wallet.type)}
            icon={wallet.icon}
            label={wallet.label}
            variant={wallet.variant}
          />
        ))}
      </div>
      
      {isConnecting && (
        <div className="text-center text-gray-400 mt-4">
          Connecting... Please check your wallet
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center gap-2 mt-4 text-red-400 bg-red-400/10 p-3 rounded-lg">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      
      {activeConnections.length >= 3 && (
        <div className="text-center text-amber-400 mt-4">
          Maximum number of concurrent connections reached (3)
        </div>
      )}
    </div>
  );
}