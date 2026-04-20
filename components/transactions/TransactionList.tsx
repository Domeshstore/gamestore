// components/transactions/TransactionList.tsx
'use client';

import { Transaction } from '@/types';
import {
  formatCurrency, formatDate, getStatusColor, getStatusLabel, getPaymentMethodLabel,
} from '@/lib/utils/format';
import { RefreshCw, Eye, Loader2, X, MessageCircle, Send, QrCode, Download, Copy, Check, Calendar, CreditCard, Gamepad2, Hash, AlertCircle, TrendingUp, Gift, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import { useState, useRef } from 'react';
import { transactionsAPI } from '@/lib/api/client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

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

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  waiting_payment: { icon: Clock, label: 'Menunggu Pembayaran', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  paid: { icon: CreditCard, label: 'Sudah Dibayar', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  processing: { icon: Loader2, label: 'Sedang Diproses', color: '#ea5234', bg: 'rgba(234, 82, 52, 0.1)' },
  success: { icon: CheckCircle, label: 'Berhasil', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  failed: { icon: AlertCircle, label: 'Gagal', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  cancelled: { icon: X, label: 'Dibatalkan', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
  refunded: { icon: RefreshCw, label: 'Dikembalikan', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export default function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleCheckStatus = async (tx: Transaction) => {
    setCheckingId(tx._id);
    try {
      const res = await transactionsAPI.checkStatus(tx._id);
      toast.success(`Status: ${getStatusLabel(res.data.data.status)}`);
      onRefresh?.();
    } catch { 
      toast.error('Gagal cek status'); 
    } finally { 
      setCheckingId(null); 
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#1a1a1a',
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `transaksi_${selectedTx?.refId?.slice(-12) || selectedTx?._id}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success('Bukti transaksi berhasil diunduh');
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Gagal mengunduh bukti transaksi');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyRefId = async (refId: string) => {
    await navigator.clipboard.writeText(refId);
    setCopied(true);
    toast.success('ID Transaksi disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  if (transactions.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 rounded-2xl"
        style={{  border: '1px solid rgba(234, 82, 52, 0.1)' }}
      >
        <div className="text-6xl mb-4">📭</div>
        <p className="text-slate-400 font-medium">Belum ada transaksi</p>
        <p className="text-slate-500 text-sm mt-1">Mulai top up sekarang!</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((tx, index) => {
          const statusConfig = STATUS_CONFIG[tx.status] || STATUS_CONFIG.waiting_payment;
          const StatusIcon = statusConfig.icon;
          
          return (
            <motion.div
              key={tx._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className={cn(
                'group relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-pointer',
                'hover:shadow-lg hover:shadow-orange-500/5'
              )}
              style={{ 
                background: 'linear-gradient(135deg, rgba(197, 63, 36, 0.52), rgba(234, 82, 52, 0.02))',
                border: `1px solid ${tx.status === 'waiting_payment' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(234, 82, 52, 0.15)'}`,
              }}
              onClick={() => setSelectedTx(tx)}
            >
              {/* Status Badge - Top Right */}
              <div className="absolute top-0 right-0">
                <div 
                  className="px-3 py-1 rounded-bl-xl text-xs font-medium flex items-center gap-1.5"
                  style={{ background: statusConfig.bg, color: statusConfig.color }}
                >
                  {tx.status === 'processing' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <StatusIcon size={12} />
                  )}
                  <span>{getStatusLabel(tx.status)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Left Section */}
                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-white font-semibold text-base">
                      {tx.voucherName || tx.gameName}
                    </h3>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-1 line-clamp-1">
                    {tx.gameName}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Hash size={12} />
                      {tx.refId?.slice(-12)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(tx.createdAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      ID: {tx.targetId}{tx.serverId ? `/${tx.serverId}` : ''}
                    </span>
                  </div>

                  {tx.rewardPointsEarned > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Gift size={12} className="text-yellow-400" />
                      <p className="text-yellow-400 text-xs">+{tx.rewardPointsEarned} pts earned</p>
                    </div>
                  )}
                </div>

                {/* Right Section */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <p className="text-xl font-bold text-[#ea5234]">
                    {formatCurrency(tx.price)}
                  </p>
                  
                  <div className="flex items-center gap-1.5">
                    {tx.status === 'waiting_payment' && (
                      <Link 
                        href={`/dashboard/payment/${tx._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{ background: '#ea5234', color: 'white' }}
                      >
                        💳 Bayar
                      </Link>
                    )}
                    
                    {['paid','processing'].includes(tx.status) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckStatus(tx);
                        }} 
                        disabled={checkingId === tx._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
                      >
                        {checkingId === tx._id ? 
                          <Loader2 className="w-3 h-3 animate-spin" /> : 
                          <RefreshCw className="w-3 h-3" />
                        }
                        Cek Status
                      </button>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 opacity-0 group-hover:opacity-100"
                      style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}
                    >
                      <Eye className="w-3 h-3" /> Detail
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar for Processing */}
              {tx.status === 'processing' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#ea5234] to-[#f59e0b] animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal yang Dipercantik */}
      <AnimatePresence>
        {selectedTx && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedTx(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
              style={{ background: '#1a1a1a' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Receipt Content for Download */}
              <div ref={receiptRef} className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  {(() => {
                    const statusConfig = STATUS_CONFIG[selectedTx.status] || STATUS_CONFIG.waiting_payment;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div 
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                        style={{ background: statusConfig.bg }}
                      >
                        {selectedTx.status === 'processing' ? (
                          <Loader2 className="w-8 h-8 animate-spin" style={{ color: statusConfig.color }} />
                        ) : (
                          <StatusIcon className="w-8 h-8" style={{ color: statusConfig.color }} />
                        )}
                      </div>
                    );
                  })()}
                  <h2 className="text-2xl font-bold text-white mb-1">Detail Transaksi</h2>
                  <p className="text-sm" style={{ color: STATUS_CONFIG[selectedTx.status]?.color || '#ea5234' }}>
                    {STATUS_CONFIG[selectedTx.status]?.label || getStatusLabel(selectedTx.status)}
                  </p>
                </div>

                {/* Transaction Info */}
                <div className="space-y-4">
                  {/* Ref ID with Copy */}
                  <div 
                    className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
                    style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.2)' }}
                    onClick={() => handleCopyRefId(selectedTx.refId)}
                  >
                    <div className="flex items-center gap-3">
                      <Hash size={18} className="text-[#ea5234]" />
                      <div>
                        <p className="text-xs text-slate-400">ID Transaksi</p>
                        <p className="text-sm font-mono text-white">{selectedTx.refId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {copied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} className="text-[#ea5234] hover:text-white transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#302e2e', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
                    <Calendar size={18} className="text-[#ea5234]" />
                    <div>
                      <p className="text-xs text-slate-400">Tanggal & Waktu</p>
                      <p className="text-sm text-white">{formatDate(selectedTx.createdAt)}</p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(180, 68, 45, 0.63), rgba(234, 82, 52, 0.05))', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
                    <h3 className="text-sm font-semibold text- mb-3 flex items-center gap-2">
                      <Gamepad2 size={16} />
                      Detail Produk
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Game/Layanan</span>
                        <span className="text-white text-sm font-medium">{selectedTx.gameName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Item/Voucher</span>
                        <span className="text-white text-sm">{selectedTx.voucherName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Target ID</span>
                        <span className="text-white text-sm font-mono">
                          {selectedTx.targetId}{selectedTx.serverId ? `/${selectedTx.serverId}` : ''}
                        </span>
                      </div>
                      {selectedTx.targetUsername && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Username</span>
                          <span className="text-white text-sm">{selectedTx.targetUsername}</span>
                        </div>
                      )}
                      {selectedTx.providerSN && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Serial Number</span>
                          <span className="text-white text-sm font-mono">{selectedTx.providerSN}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="p-4 rounded-xl" style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
                    <h3 className="text-sm font-semibold text-[#ea5234] mb-3 flex items-center gap-2">
                      <CreditCard size={16} />
                      Informasi Pembayaran
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Metode Pembayaran</span>
                        <span className="text-white text-sm flex items-center gap-1">
                          {selectedTx.paymentMethod === 'qris' && <QrCode size={14} />}
                          {getPaymentMethodLabel(selectedTx.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'rgba(234, 82, 52, 0.2)' }}>
                        <span className="text-slate-400 text-sm">Total Harga</span>
                        <span className="text-2xl font-bold text-[#ea5234]">{formatCurrency(selectedTx.price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reward Points */}
                  {selectedTx.rewardPointsEarned > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(234, 82, 52, 0.1)', border: '1px solid rgba(234, 82, 52, 0.3)' }}>
                      <Gift size={18} className="text-[#ea5234]" />
                      <div>
                        <p className="text-xs text-slate-400">Reward Points</p>
                        <p className="text-sm font-semibold text-[#ea5234]">+{selectedTx.rewardPointsEarned} Points</p>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {selectedTx.adminNotes && (
                    <div className="p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <p className="text-xs text-red-400 mb-1">Catatan Admin</p>
                      <p className="text-sm text-white">{selectedTx.adminNotes}</p>
                    </div>
                  )}

                  {/* Review Section */}
                  {selectedTx.review?.rating && (
                    <div className="p-4 rounded-xl" style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.2)' }}>
                      <h3 className="text-sm font-semibold text-[#ea5234] mb-2 flex items-center gap-2">
                        <MessageCircle size={16} />
                        Ulasanmu
                      </h3>
                      <div className="flex gap-0.5 mb-2">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={n <= selectedTx.review!.rating ? 'text-yellow-400' : 'text-slate-600'}>★</span>
                        ))}
                      </div>
                      {selectedTx.review.comment && (
                        <p className="text-white text-sm">{selectedTx.review.comment}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 p-4 border-t flex gap-3" style={{ background: '#1a1a1a', borderColor: 'rgba(234, 82, 52, 0.2)' }}>
                {(selectedTx.status === 'success' || selectedTx.status === 'processing') && (
                  <button
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
                    style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.3)', color: '#ea5234' }}
                  >
                    {downloading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    {downloading ? 'Mengunduh...' : 'Download Bukti'}
                  </button>
                )}
                
                {selectedTx.status === 'waiting_payment' && (
                  <Link
                    href={`/dashboard/payment/${selectedTx._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                    style={{ background: '#ea5234', color: 'white' }}
                  >
                    💳 Lanjut Bayar
                  </Link>
                )}
                
                {selectedTx.status === 'success' && !selectedTx.review?.rating && (
                  <Link
                    href={`/dashboard/payment/${selectedTx._id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                    style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.3)', color: '#ea5234' }}
                  >
                    ⭐ Beri Review
                  </Link>
                )}
                
                <button
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  style={{ background: '#ea5234', color: 'white' }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}