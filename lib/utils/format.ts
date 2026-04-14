import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0, maximumFractionDigits:0 }).format(amount);
}
export function formatDate(d: string): string {
  return new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(d));
}
export function formatDateShort(d: string): string {
  return new Intl.DateTimeFormat('id-ID', { day:'numeric', month:'short', year:'numeric' }).format(new Date(d));
}

export const STATUS_LABEL: Record<string, string> = {
  waiting_payment: 'Menunggu Pembayaran',
  paid:        'Pembayaran Dikonfirmasi',
  processing:  'Sedang Diproses',
  success:     'Berhasil',
  failed:      'Gagal',
  cancelled:   'Dibatalkan',
  refunded:    'Dikembalikan',
};
export const STATUS_COLOR: Record<string, string> = {
  waiting_payment: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  paid:        'text-blue-400 bg-blue-400/10 border-blue-400/20',
  processing:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  success:     'text-green-400 bg-green-400/10 border-green-400/20',
  failed:      'text-red-400 bg-red-400/10 border-red-400/20',
  cancelled:   'text-slate-400 bg-slate-400/10 border-slate-400/20',
  refunded:    'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

export function getStatusLabel(s: string) { return STATUS_LABEL[s] ?? s; }
export function getStatusColor(s: string) { return STATUS_COLOR[s] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20'; }
export function getPaymentMethodLabel(m: string) {
  const map: Record<string,string> = { qris:'QRIS', bank_transfer:'Transfer Bank', 'e-wallet':'E-Wallet', reward_points:'Reward Points' };
  return map[m] ?? m;
}
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const e = error as { response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? 'Terjadi kesalahan';
  }
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan';
}
export function truncate(str: string, max = 40) { return str.length > max ? str.slice(0,max)+'…' : str; }
