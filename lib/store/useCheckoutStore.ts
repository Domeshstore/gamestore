import { create } from 'zustand';
import { Game, Voucher, PaymentMethod } from '@/types';

interface CheckoutState {
  game: Game | null;
  voucher: Voucher | null;
  targetId: string;
  targetUsername: string;
  serverId: string;
  paymentMethod: PaymentMethod;
  setGame: (game: Game) => void;
  setVoucher: (voucher: Voucher) => void;
  setTargetId: (id: string) => void;
  setTargetUsername: (name: string) => void;
  setServerId: (id: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  game: null,
  voucher: null,
  targetId: '',
  targetUsername: '',
  serverId: '',
  paymentMethod: 'qris', // default QRIS
  setGame: (game) => set({ game }),
  setVoucher: (voucher) => set({ voucher }),
  setTargetId: (targetId) => set({ targetId }),
  setTargetUsername: (targetUsername) => set({ targetUsername }),
  setServerId: (serverId) => set({ serverId }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  clear: () => set({ game: null, voucher: null, targetId: '', targetUsername: '', serverId: '', paymentMethod: 'qris' }),
}));
