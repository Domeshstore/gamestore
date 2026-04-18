// lib/store/useCheckoutStore.ts
import { create } from 'zustand';
import { Game, Voucher, PaymentMethod } from '@/types';

interface CheckoutState {
  game: Game | null;
  voucher: Voucher | null;
  targetId: string;
  targetUsername: string;
  serverId: string;
  paymentMethod: PaymentMethod;
  
  // Promo states
  promoCode: string | null;
  promoId: string | null;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  
  // Actions
  setGame: (game: Game) => void;
  setVoucher: (voucher: Voucher) => void;
  setTargetId: (id: string) => void;
  setTargetUsername: (name: string) => void;
  setServerId: (id: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  
  // Promo actions
  setPromoCode: (code: string | null) => void;
  setPromoId: (id: string | null) => void;
  setDiscountAmount: (amount: number) => void;
  setOriginalPrice: (price: number) => void;
  setFinalPrice: (price: number) => void;
  setPromo: (code: string, promoId: string, discount: number, originalPrice: number, finalPrice: number) => void;
  clearPromo: () => void;
  
  // Clear all
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  // Initial states
  game: null,
  voucher: null,
  targetId: '',
  targetUsername: '',
  serverId: '',
  paymentMethod: 'qris',
  
  // Promo initial states
  promoCode: null,
  promoId: null,
  discountAmount: 0,
  originalPrice: 0,
  finalPrice: 0,
  
  // Actions
  setGame: (game) => set({ game }),
  setVoucher: (voucher) => set({ voucher }),
  setTargetId: (targetId) => set({ targetId }),
  setTargetUsername: (targetUsername) => set({ targetUsername }),
  setServerId: (serverId) => set({ serverId }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  
  // Individual promo actions
  setPromoCode: (promoCode) => set({ promoCode }),
  setPromoId: (promoId) => set({ promoId }),
  setDiscountAmount: (discountAmount) => set({ discountAmount }),
  setOriginalPrice: (originalPrice) => set({ originalPrice }),
  setFinalPrice: (finalPrice) => set({ finalPrice }),
  
  // Combined promo action
  setPromo: (promoCode, promoId, discountAmount, originalPrice, finalPrice) => 
    set({ promoCode, promoId, discountAmount, originalPrice, finalPrice }),
  
  clearPromo: () => 
    set({ promoCode: null, promoId: null, discountAmount: 0, originalPrice: 0, finalPrice: 0 }),
  
  // Clear all (including promo)
  clear: () => set({ 
    game: null, 
    voucher: null, 
    targetId: '', 
    targetUsername: '', 
    serverId: '', 
    paymentMethod: 'qris',
    promoCode: null,
    promoId: null,
    discountAmount: 0,
    originalPrice: 0,
    finalPrice: 0,
  }),
}));