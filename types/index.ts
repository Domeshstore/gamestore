//types/index.ts
export interface User {
  id: string; name: string; email: string; phone?: string;
  avatar?: string; role: 'user'|'admin'; isActive: boolean;
  rewardPoints: number; createdAt: string;
}
export interface PointsHistoryItem {
  type: 'earn'|'redeem'; amount: number; description: string;
  transactionId?: string; createdAt: string;
}
export interface Category {
  _id: string; name: string; slug: string; icon: string;
  color: string; gradient: string; image: string;
  isActive: boolean; sortOrder: number;
}
export interface Game {
  _id: string; name: string; slug: string; description: string;
  image: string; banner: string; category: string;
  platform: string[]; publisher: string;
  provider: 'digiflazz'|'apigames'|'both'; gameCode: string;
  requiresServerId: boolean; serverIdLabel: string; userIdLabel: string;
  isActive: boolean; isFeatured: boolean; sortOrder: number;
  tags: string[]; vouchers?: Voucher[]; createdAt: string;
}
export interface Voucher {
  _id: string; gameId: string|Game; name: string; code: string;
  description: string; price: number; originalPrice: number;
  rewardPoints: number; provider: 'digiflazz'|'apigames';
  providerCode: string; type: string;
  isActive: boolean; isFeatured: boolean; stock: number; sortOrder: number;
}
export type TransactionStatus =
  'waiting_payment'|'paid'|'processing'|'success'|'failed'|'cancelled'|'refunded';
export type PaymentMethod = 'qris'|'bank_transfer'|'e-wallet'|'reward_points';
export interface Transaction {
  _id: string; refId: string; userId: string|User;
  provider: string; gameCode: string; gameName: string;
  voucherCode: string; voucherName: string;
  targetId: string; targetUsername: string; serverId: string;
  price: number; originalPrice: number;
  paymentMethod: PaymentMethod; paymentProof: string; paidAt?: string;
  status: TransactionStatus;
  providerStatus: string; providerSN: string; providerResponse: unknown;
  rewardPointsEarned: number; rewardPointsUsed: number;
  adminNotes: string; processedBy?: string; completedAt?: string;
  review?: { rating: number; comment: string; createdAt: string } | null;
  expiresAt: string; createdAt: string; updatedAt: string;
}
export interface Banner {
  _id?: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}
export interface AppSetting {
  banners: Banner[];
  qrisImage: string; qrisName: string; qrisNote: string;
  bankAccounts: BankAccount[];
  eWallets: EWallet[];
  whatsappNumber: string; telegramUsername: string;
  paymentExpiryMinutes: number;
  processingNote: string; successNote: string;
}
export interface BankAccount {
  _id?: string; bankName: string; accountNumber: string;
  accountName: string; logo: string; qrCode: string;
  isActive: boolean; sortOrder: number;
}
export interface EWallet {
  _id?: string; name: string; number: string;
  accountName: string; logo: string; qrCode: string;
  isActive: boolean; sortOrder: number;
}
export interface AdminStats {
  totalUsers: number; totalGames: number; totalVouchers: number;
  totalTransactions: number; waitingPayment: number; paid: number;
  processing: number; successTransactions: number; failedTransactions: number;
  totalRevenue: number;
}
