'use client';

import { Transaction } from '@/types';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel, getPaymentMethodLabel,
} from '@/lib/utils/format';
import { RefreshCw, Eye, Loader2, X, MessageCircle, Send, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { useState } from 'react';
import { transactionsAPI } from '@/lib/api/client';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh?: () => void;
}

const STATUS_ICON: Record<string, string> = {
  waiting_payment: '⏳',
  paid:            '💰',
  processing:      '⚙️',
  success:         '✅',
  failed:          '❌',
  cancelled:       '🚫',
  refunded:        '↩️',
};

export default function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleCheckStatus = async (tx: Transaction) => {
    setCheckingId(tx._id);
    try {
      const res = await transactionsAPI.checkStatus(tx._id);
      toast.success(`Status: ${getStatusLabel(res.data.data.status)}`);
      onRefresh?.();
    } catch { toast.error('Gagal cek status'); }
    finally { setCheckingId(null); }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-slate-400">Belum ada transaksi</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map(tx => (
          <div key={tx._id} className={cn('glass-card p-4 hover:border-white/20 transition-all',
            tx.status === 'waiting_payment' && 'border-orange-500/20',
            tx.status === 'success'         && 'border-green-500/10',
          )}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={cn('status-badge', getStatusColor(tx.status))}>
                    {STATUS_ICON[tx.status]} {getStatusLabel(tx.status)}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">{tx.refId.slice(-12)}</span>
                </div>

                <p className="text-white font-semibold text-sm">{tx.voucherName}</p>
                <p className="text-slate-400 text-xs mt-0.5">{tx.gameName}</p>

                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                  <span>ID: {tx.targetId}{tx.serverId ? `/${tx.serverId}` : ''}</span>
                  <span className="flex items-center gap-1">
                    {tx.paymentMethod === 'qris' && <QrCode className="w-3 h-3" />}
                    {getPaymentMethodLabel(tx.paymentMethod)}
                  </span>
                  <span>{formatDate(tx.createdAt)}</span>
                </div>

                {tx.rewardPointsEarned > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">+{tx.rewardPointsEarned} pts earned</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-white font-bold">{formatCurrency(tx.price)}</p>
                <div className="flex items-center gap-1.5 mt-2 justify-end flex-wrap">
                  {tx.status === 'waiting_payment' && (
                    <Link href={`/dashboard/payment/${tx._id}`}
                      className="flex items-center gap-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                      💳 Bayar
                    </Link>
                  )}
                  {['paid','processing'].includes(tx.status) && (
                    <button onClick={() => handleCheckStatus(tx)} disabled={checkingId === tx._id}
                      className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                      {checkingId === tx._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Cek Status
                    </button>
                  )}
                  <button onClick={() => setSelectedTx(tx)}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-400 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                    <Eye className="w-3 h-3" /> Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedTx(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-bold text-lg mb-4">Detail Transaksi</h3>

            <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4', getStatusColor(selectedTx.status))}>
              {STATUS_ICON[selectedTx.status]} {getStatusLabel(selectedTx.status)}
            </div>

            <div className="space-y-2.5 text-sm">
              {[
                ['Ref ID',     selectedTx.refId],
                ['Game',       selectedTx.gameName],
                ['Voucher',    selectedTx.voucherName],
                ['Target ID',  `${selectedTx.targetId}${selectedTx.serverId ? '/'+selectedTx.serverId : ''}`],
                ['Username',   selectedTx.targetUsername || '-'],
                ['Harga',      formatCurrency(selectedTx.price)],
                ['Pembayaran', getPaymentMethodLabel(selectedTx.paymentMethod)],
                ['Tanggal',    formatDate(selectedTx.createdAt)],
                ...(selectedTx.providerSN ? [['Serial No.', selectedTx.providerSN]] : []),
                ...(selectedTx.adminNotes ? [['Catatan', selectedTx.adminNotes]] : []),
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-slate-400">{l}</span>
                  <span className="text-white font-medium text-right max-w-[60%] break-all">{v}</span>
                </div>
              ))}
            </div>

            {selectedTx.review?.rating && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-slate-400 text-xs mb-1">Ulasanmu</p>
                <div className="flex gap-0.5 mb-1">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} className={n <= selectedTx.review!.rating ? 'text-yellow-400' : 'text-slate-600'}>★</span>
                  ))}
                </div>
                {selectedTx.review.comment && <p className="text-white text-sm">{selectedTx.review.comment}</p>}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {selectedTx.status === 'waiting_payment' && (
                <Link href={`/dashboard/payment/${selectedTx._id}`}
                  className="btn-primary flex-1 text-center text-sm py-2">
                  Lanjut Bayar
                </Link>
              )}
              {selectedTx.status === 'success' && !selectedTx.review?.rating && (
                <Link href={`/dashboard/payment/${selectedTx._id}`}
                  className="btn-secondary flex-1 text-center text-sm py-2">
                  ⭐ Beri Review
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
