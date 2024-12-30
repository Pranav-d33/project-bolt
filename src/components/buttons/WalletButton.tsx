import React from 'react';
import { LucideIcon } from 'lucide-react';

interface WalletButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  variant: 'metamask' | 'phantom' | 'walletconnect' | 'coinbase';
}

const variants = {
  metamask: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 ring-orange-500/20',
  phantom: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 ring-purple-500/20',
  walletconnect: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 ring-blue-500/20',
  coinbase: 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 ring-blue-400/20',
};

export function WalletButton({ onClick, disabled, icon: Icon, label, variant }: WalletButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex items-center justify-center gap-3 w-full px-4 py-3.5
        ${variants[variant]} text-white rounded-xl
        disabled:opacity-50 disabled:cursor-not-allowed 
        transition-all duration-300 shadow-lg hover:shadow-xl
        ring-2 ring-offset-2 ring-offset-gray-900 hover:ring-offset-4
        before:absolute before:inset-0 before:rounded-xl before:bg-white/10 before:opacity-0 
        hover:before:opacity-100 before:transition-opacity
        after:absolute after:inset-0 after:rounded-xl after:ring-2 after:ring-white/10 after:transition-opacity
      `}
    >
      <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
      <span className="font-semibold">{label}</span>
    </button>
  );
}