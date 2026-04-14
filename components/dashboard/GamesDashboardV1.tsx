// app/dashboard/games/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gamesAPI, apigamesAPI,  digiflazzAPI } from '@/lib/api/client';
import { Game, Voucher } from '@/types';
import VoucherCard from '@/components/vouchers/VoucherCard';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import {
  Loader2, Search, CheckCircle, XCircle, ArrowRight, ChevronLeft, ShoppingCart, Flame
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Button, Card } from 'antd';

export default function GameDetailPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [userId, setUserId] = useState('');
  const [serverId, setServerId] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkedUsername, setCheckedUsername] = useState('');
  const [checkError, setCheckError] = useState('');

  const { 
    setGame: setCheckoutGame, 
    setVoucher, 
    setTargetId, 
    setServerId: setStoreServerId, 
    setTargetUsername 
  } = useCheckoutStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    gamesAPI.getBySlug(slug).then((res) => {
      setGame(res.data.data);
    }).catch(() => {
      toast.error('Game tidak ditemukan');
      router.push('/dashboard/games');
    }).finally(() => setLoading(false));
  }, [slug]);

  // app/dashboard/games/[id]/page.tsx

const handleCheckUsername = async () => {
  if (!game || !userId) return;
  setChecking(true);
  setCheckedUsername('');
  setCheckError('');
  
  try {
    // Format customerId: gabungkan userId + serverId (TANPA SEPARATOR)
    // Contoh: userId=96561003, serverId=2504 → "965610032504"
    let customerId = userId;
    if (serverId && serverId.trim()) {
      customerId = `${userId}${serverId}`;
    }
    
    // Buat refId unik untuk check username
    const refId = `CHECK-${Date.now()}`;
    
    // Panggil API Digiflazz untuk cek username
    const res = await digiflazzAPI.createTransaction({
      refId: refId,
      buyerSkuCode: 'ml_cekusername', // Kode produk cek username
      customerId: customerId,
      testing: true, // Testing mode (tidak potong saldo)
    });
    
    const data = res.data.data;
    
    if (data?.status === 'Sukses') {
      // Username biasanya ada di field 'sn' (serial number)
      const username = data?.sn || data?.customer_no || userId;
      setCheckedUsername(username);
      toast.success(`Akun ditemukan: ${username}`);
    } else if (data?.status === 'Pending') {
      setCheckError('Sedang diproses, coba beberapa saat lagi');
    } else {
      setCheckError(data?.message || 'Username tidak ditemukan');
    }
  } catch (err: any) {
    console.error('Check username error:', err);
    setCheckError(err.response?.data?.message || 'Gagal mengecek akun. Coba lagi.');
  } finally {
    setChecking(false);
  }
};

  const handleBuy = () => {
    if (!game || !selectedVoucher) {
      toast.error('Pilih voucher terlebih dahulu');
      return;
    }
    if (!userId) {
      toast.error(`Masukkan ${game.userIdLabel} terlebih dahulu`);
      return;
    }
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      router.push('/auth/login');
      return;
    }
    setCheckoutGame(game);
    setVoucher(selectedVoucher);
    setTargetId(userId);
    setStoreServerId(serverId);
    setTargetUsername(checkedUsername);
    router.push('/dashboard/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#EAD8B1] animate-spin" />
      </div>
    );
  }

  if (!game) return null;

  // Pisahkan voucher terlaris (featured) dan voucher biasa
  const featuredVouchers = game.vouchers?.filter(v => v.isFeatured === true) || [];
  const regularVouchers = game.vouchers?.filter(v => v.isFeatured !== true) || [];

  const EMOJI_MAP: Record<string, string> = {
    'mobile-legends': '', 'free-fire': '', 'pubg-mobile': '',
    'genshin-impact': '', 'valorant': '',
  };
  const emoji = EMOJI_MAP[game.slug] ?? '🎮';
  const gradients: Record<string, string> = {
    mobile: 'from-[#3A6D8C] to-[#6A9AB0]',
    pc: 'from-[#3A6D8C] to-[#6A9AB0]',
    console: 'from-[#3A6D8C] to-[#6A9AB0]',
    other: 'from-[#3A6D8C] to-[#6A9AB0]',
  };
  const gradient = gradients[game.category] ?? gradients.other;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/dashboard/games" className="inline-flex items-center gap-2 text-[#6A9AB0] hover:text-[#EAD8B1] text-sm mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Kembali ke Games
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Game info */}
        <div className="lg:col-span-1">
          {/* Game image */}
          <div className={`relative h-56 bg-gradient-to-br ${gradient} rounded-2xl overflow-hidden mb-4 flex items-center justify-center`}>
            <img
              src={game.image || `/assets/games/${game.slug}.jpg`}
              alt={game.name}
              className="object-cover w-full h-full opacity-90"
            />
          </div>

          <div className="glass-card p-5">
            <h1 className="text-white font-bold text-xl mb-1">{game.name}</h1>
            <p className="text-[#6A9AB0] text-sm">{game.publisher}</p>
            {game.description && (
              <p className="text-[#6A9AB0] text-sm mt-3 leading-relaxed">{game.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {game.platform.map((p) => (
                <span key={p} className="text-xs bg-[#3A6D8C]/20 border border-[#3A6D8C]/30 text-[#6A9AB0] px-2.5 py-1 rounded-full">{p}</span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#3A6D8C]/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6A9AB0]">Kategori</span>
                <span className="text-white capitalize">{game.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-[#6A9AB0]">Provider</span>
                <span className="text-white capitalize">{game.provider}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Vouchers + checkout */}
        <div className="lg:col-span-2 space-y-6">
          {/* User ID input */}
          <div className=" bg-[] border ring-1 ring-[#f8d9b9] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">📋 Masukkan Data Akun</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6A9AB0] mb-1.5">{game.userIdLabel}</label>
                <input
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setCheckedUsername(''); setCheckError(''); }}
                  placeholder={`Masukkan ${game.userIdLabel}`}
                  className="input-field rounded-xl"
                />
              </div>
              {game.requiresServerId && (
                <div>
                  <label className="block text-sm text-[#6A9AB0] mb-1.5">{game.serverIdLabel}</label>
                  <input
                    value={serverId}
                    onChange={(e) => { setServerId(e.target.value); setCheckedUsername(''); setCheckError(''); }}
                    placeholder={`Masukkan ${game.serverIdLabel}`}
                    className="input-field rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Check button */}
            <Button
              onClick={handleCheckUsername}
              disabled={!userId || checking}
              className="mt-3 flex items-center gap-2 bg-[#3A6D8C]/20 hover:bg-[#3A6D8C]/30 border border-[#3A6D8C]/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cek Username
            </Button>

            {checkedUsername && (
              <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-2.5 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Username: <strong>{checkedUsername}</strong></span>
              </div>
            )}
            {checkError && (
              <div className="mt-3 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm">
                <XCircle className="w-4 h-4" />
                {checkError}
              </div>
            )}
          </div>

          {/* Featured Vouchers Section */}
          {featuredVouchers.length > 0 && (
            <div className=" p-5 border rounded-xl ring-1 ring-[#f8d9b9]">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-[#EAD8B1]" />
                <h3 className="text-white font-semibold"> Voucher Terlaris</h3>
                <span className="text-xs bg-[#EAD8B1]/20 text-[#EAD8B1] px-2 py-0.5 rounded-full">Best Seller</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featuredVouchers.map((v) => (
                  <VoucherCard
                    key={v._id}
                    voucher={v}
                    selected={selectedVoucher?._id === v._id}
                    onSelect={setSelectedVoucher}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Vouchers Section */}
          <div className="border rounded-xl ring-1 ring-[#f8d9b9] p-5">
            <h3 className="text-white font-semibold mb-4">
              {featuredVouchers.length > 0 ? 'Voucher Lainnya' : 'Pilih Voucher'}
            </h3>
            {regularVouchers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regularVouchers.map((v) => (
                  <VoucherCard
                    key={v._id}
                    voucher={v}
                    selected={selectedVoucher?._id === v._id}
                    onSelect={setSelectedVoucher}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[#6A9AB0] text-sm text-center py-8">
                {featuredVouchers.length > 0 ? 'Tidak ada voucher lain' : 'Belum ada voucher tersedia'}
              </p>
            )}
          </div>

          {/* Summary + Buy */}
          {selectedVoucher && (
            <div className="glass-card p-5 border-[#EAD8B1]/30 bg-[#e95335]">
              <h3 className="text-white font-semibold mb-4">
                Ringkasan
                </h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="">Game</span>
                  <span className="text-white">{game.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="">Voucher</span>
                  <span className="text-white">{selectedVoucher.name}</span>
                </div>
                <div className="flex bg-[#212121] text-bold ring-1 ring-[] rounded-lg px-5 justify-between">
                  <span className="text-[#6A9AB0] ">ID</span>
                  <span className="text-white">{userId || '-'}{serverId ? `/${serverId}` : ''}</span>
                </div>
                {checkedUsername && (
                  <div className="flex justify-between">
                    <span className="text-[#6A9AB0]">Username</span>
                    <span className="text-green-400">{checkedUsername}</span>
                  </div>
                )}
                <div className="border-t border-[#3A6D8C]/30 pt-2 flex justify-between font-bold">
                  <span className="">Total</span>
                  <span className="bg-[#212121] p-2 rounded-xl text-green-300 text-base">{formatCurrency(selectedVoucher.price)}</span>
                </div>
              </div>

              <Button
                type="primary"                
                onClick={handleBuy}
                className="w-full text-[#001F3F] hover:bg-[#EAD8B1]/90 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Beli Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
