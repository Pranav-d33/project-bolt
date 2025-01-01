import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface NetworkStatusProps {
  network: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export function NetworkStatus({ network, status }: NetworkStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">{network}</span>
      {status === 'loading' && (
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      )}
      {status === 'success' && (
        <CheckCircle2 className="w-4 h-4 text-green-400" />
      )}
      {status === 'error' && (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
    </div>
  );
} 