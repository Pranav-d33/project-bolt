import React, { useState } from 'react';
import { format } from 'date-fns';
import { Transaction } from '../types/transaction';
import { ArrowUpDown, Download, FileDown } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onSort: (field: keyof Transaction) => void;
  onExport: (type: 'csv' | 'pdf') => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  onSort,
  onExport,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof Transaction>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Transaction) => {
    setSortField(field);
    setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
    onSort(field);
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="space-y-4">
          <div className="w-32 h-2 bg-white/10 rounded-full animate-pulse"></div>
          <div className="w-48 h-2 bg-white/10 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-lg bg-white/[0.02] rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
      
      <div className="flex justify-end space-x-3 mb-6">
        <button
          onClick={() => onExport('csv')}
          className="group flex items-center px-4 py-2 text-sm font-medium text-white/90 bg-white/5 rounded-lg 
          hover:bg-white/10 transition-all duration-300 ring-1 ring-white/10 hover:ring-white/20"
        >
          <FileDown className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
          Export CSV
        </button>
        <button
          onClick={() => onExport('pdf')}
          className="group flex items-center px-4 py-2 text-sm font-medium text-white/90 bg-white/5 rounded-lg 
          hover:bg-white/10 transition-all duration-300 ring-1 ring-white/10 hover:ring-white/20"
        >
          <Download className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
          Export PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5">
          <thead>
            <tr className="bg-white/[0.02]">
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer
                hover:text-white transition-colors group"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Asset
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Amount</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Value (INR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Network
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-gradient-to-b from-transparent to-white/[0.02]">
            {transactions.map((transaction) => (
              <tr 
                key={transaction.hash} 
                className="hover:bg-white/[0.03] transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {format(new Date(transaction.timestamp), 'dd MMM yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm
                      ${transaction.direction === 'inbound'
                        ? 'bg-green-400/10 text-green-400 ring-1 ring-green-400/20'
                        : 'bg-red-400/10 text-red-400 ring-1 ring-red-400/20'
                      }`}
                  >
                    {transaction.direction === 'inbound' ? 'Received' : 'Sent'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {transaction.asset.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {parseFloat(transaction.amount).toFixed(8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ₹{parseFloat(transaction.amountInr).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {transaction.network}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}