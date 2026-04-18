'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { gamesAPI } from '@/lib/api/client';
import apiClient from '@/lib/api/client';
import { Game, Voucher } from '@/types';
import { useCheckoutStore } from '@/lib/store/useCheckoutStore';
import { formatCurrency, getErrorMessage } from '@/lib/utils/format';
import Image from 'next/image';
import {
  Loader2, Search, CheckCircle, XCircle, ChevronRight,
  Award, Calendar, Tag, Zap, Wifi, Phone, Battery,
  Clock, Star, TrendingUp, Gift,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Operator data ─────────────────────────────────────────────
const OPERATORS: { slug:string; name:string; emoji:string; color:string; bg:string; prefix:string[]; digiOperator:string }[] = [
  { slug:'telkomsel', name:'Telkomsel', emoji:'🔴', color:'#e4002b', bg:'#e4002b18', prefix:['0811','0812','0813','0821','0822','0823','0851','0852','0853'], digiOperator:'tsel' },
  { slug:'xl-axiata', name:'XL Axiata', emoji:'🔵', color:'#0072bc', bg:'#0072bc18', prefix:['0817','0818','0819','0859','0877','0878'], digiOperator:'xl' },
  { slug:'indosat',   name:'Indosat',   emoji:'🟡', color:'#f7941d', bg:'#f7941d18', prefix:['0814','0815','0816','0855','0856','0857','0858'], digiOperator:'isat' },
  { slug:'tri',       name:'Tri (3)',   emoji:'🟣', color:'#8b5cf6', bg:'#8b5cf618', prefix:['0895','0896','0897','0898','0899'], digiOperator:'tri' },
  { slug:'smartfren', name:'Smartfren', emoji:'🟢', color:'#10b981', bg:'#10b98118', prefix:['0881','0882','0883','0884','0885','0886','0887','0888'], digiOperator:'sf' },
  { slug:'byu',       name:'By.U',      emoji:'⚫', color:'#374151', bg:'#37415118', prefix:['0811','0851'], digiOperator:'byu' },
  { slug:'axis',      name:'AXIS',      emoji:'🟠', color:'#f97316', bg:'#f9731618', prefix:['0831','0832','0833','0838'], digiOperator:'axis' },
];

type PageType = 'pulsa' | 'paket_data' | 'pln';

const PAGE_CONFIG = {
  pulsa:     { title:'Top Up Pulsa',     icon:'📱', desc:'Isi ulang pulsa semua operator', inputLabel:'Nomor HP', color:'#ea5234' },
  paket_data:{ title:'Paket Internet',   icon:'📶', desc:'Paket data semua operator',      inputLabel:'Nomor HP', color:'#ea5234' },
  pln:       { title:'Token Listrik PLN',icon:'⚡', desc:'Beli token listrik prabayar',    inputLabel:'Nomor Meter PLN', color:'#ea5234' },
};

const ss = { 
  background: '#2a2a2a', 
  border: '1px solid rgba(234, 82, 52, 0.25)', 
  borderRadius: 18 
};

// Enhanced Voucher Card without image (since Voucher type doesn't have image property)
function VoucherDetailCard({ v, selected, onSelect, pageType }: { v: Voucher; selected: boolean; onSelect(): void; pageType: PageType }) {
  const hasDisc = v.originalPrice > v.price;
  const pct     = hasDisc ? Math.round(((v.originalPrice - v.price) / v.originalPrice) * 100) : 0;
  
  // Get icon based on voucher type and page type
  const getVoucherIcon = () => {
    // Voucher type based icons
    if (v.type === 'subscription') return <Star className="w-5 h-5" />;
    if (v.type === 'diamond') return <Zap className="w-5 h-5" />;
    if (v.type === 'coin') return <Award className="w-5 h-5" />;
    
    // Page type based icons
    if (pageType === 'pulsa') return <Phone className="w-5 h-5" />;
    if (pageType === 'paket_data') return <Wifi className="w-5 h-5" />;
    if (pageType === 'pln') return <Battery className="w-5 h-5" />;
    
    return <Gift className="w-5 h-5" />;
  };

  const icon = getVoucherIcon();

  return (
    <motion.button onClick={onSelect} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
      className="w-full text-left p-4 rounded-xl transition-all flex items-start gap-4"
      style={{
        background: selected ? 'rgba(234, 82, 52, 0.12)' : '#242424',
        border: `1px solid ${selected ? 'rgba(234, 82, 52, 0.45)' : 'rgba(234, 82, 52, 0.25)'}`,
        boxShadow: selected ? '0 0 16px rgba(234, 82, 52, 0.15)' : 'none',
      }}>
      
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: selected ? 'rgba(234, 82, 52, 0.20)' : '#2a2a2a' }}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div style={{ color: '#f8d9b9', fontWeight: 700, fontSize: 15 }}>{v.name}</div>
            {v.description && (
              <div className="flex items-start gap-1 mt-1">
                <Tag className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#b4b4b4' }} />
                <div style={{ color: '#b4b4b4', fontSize: 11, lineHeight: 1.3 }}>
                  {v.description}
                </div>
              </div>
            )}
          </div>
          
          {/* Price */}
          <div className="text-right shrink-0">
            <div style={{ color: selected ? '#ea5234' : '#ffffff', fontWeight: 900, fontSize: 16 }}>
              {formatCurrency(v.price)}
            </div>
            {hasDisc && (
              <div style={{ color: '#b4b4b4', fontSize: 11, textDecoration: 'line-through' }}>
                {formatCurrency(v.originalPrice)}
              </div>
            )}
            {pct > 0 && (
              <div className="text-xs font-bold mt-0.5" style={{ color: '#10b981' }}>-{pct}%</div>
            )}
          </div>
        </div>

        {/* Additional info */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {v.rewardPoints > 0 && (
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3" style={{ color: '#ea5234' }} />
              <span style={{ color: '#ea5234', fontSize: 10, fontWeight: 600 }}>
                +{v.rewardPoints} pts
              </span>
            </div>
          )}
          {v.providerCode && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" style={{ color: '#b4b4b4' }} />
              <span style={{ color: '#b4b4b4', fontSize: 10 }}>
                {v.providerCode}
              </span>
            </div>
          )}
          {v.stock > 0 && v.stock < 10 && (
            <div className="text-[10px] text-orange-500">Sisa {v.stock}</div>
          )}
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="flex-shrink-0">
          <CheckCircle className="w-5 h-5" style={{ color: '#ea5234' }} />
        </div>
      )}
    </motion.button>
  );
}

function TopupPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { setGame, setVoucher, setTargetId, setTargetUsername } = useCheckoutStore();

  const pageType  = (searchParams.get('type') || 'pulsa') as PageType;
  const initSlug  = searchParams.get('product') || '';
  const config    = PAGE_CONFIG[pageType] || PAGE_CONFIG.pulsa;

  const [products,          setProducts]          = useState<Game[]>([]);
  const [selectedProduct,   setSelectedProduct]   = useState<Game | null>(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Game | null>(null);
  const [selectedVoucher,   setSelectedVoucher]   = useState<Voucher | null>(null);
  const [vouchers,          setVouchers]          = useState<Voucher[]>([]);
  const [loadingVouchers,   setLoadingVouchers]   = useState(false);
  const [phone,             setPhone]             = useState('');
  const [detectedOp,        setDetectedOp]        = useState<typeof OPERATORS[0] | null>(null);
  const [checkResult,       setCheckResult]       = useState<{ name?:string; status?:string; info?:string } | null>(null);
  const [checking,          setChecking]          = useState(false);
  const [checkError,        setCheckError]        = useState('');
  const [loading,           setLoading]           = useState(true);

  // Load products for this page type
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        let category = '';
        if (pageType === 'pln') {
          category = 'pln';
        } else {
          category = 'pulsa';
        }
        
        const response = await apiClient.get('/games', { 
          params: { 
            category: category,
            limit: 50 
          } 
        });
        
        let all = response.data.data ?? [];
        
        if (pageType === 'pln' && all.length === 0) {
          console.log('No PLN products found, trying streaming category...');
          const streamingRes = await apiClient.get('/games', { 
            params: { category: 'streaming', limit: 50 }
          });
          all = streamingRes.data.data ?? [];
        }
        
        if (pageType === 'pln' && all.length === 0) {
          console.log('No streaming products found, trying all products...');
          const allRes = await apiClient.get('/games', { params: { limit: 100 } });
          all = allRes.data.data ?? [];
          all = all.filter((g: Game) => 
            g.name.toLowerCase().includes('pln') || 
            g.name.toLowerCase().includes('token') ||
            g.name.toLowerCase().includes('listrik') ||
            g.gameCode === 'PLN' ||
            g.gameCode === 'PLN_TOKEN'
          );
        }
        
        setProducts(all);
        
        if (initSlug) {
          const found = all.find((g: Game) => g.slug === initSlug);
          if (found) setSelectedProduct(found);
        } else if (pageType === 'pln') {
          const pln = all.find((g: Game) => 
            g.slug === 'pln-token' || 
            g.gameCode === 'PLN' || 
            g.gameCode === 'PLN_TOKEN' ||
            g.name.toLowerCase().includes('pln') ||
            g.name.toLowerCase().includes('token listrik')
          );
          if (pln) {
            setSelectedProduct(pln);
          } else {
            toast.error('Produk PLN tidak ditemukan');
          }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Gagal memuat produk');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [pageType, initSlug]);

  // Fetch full product details (with populated vouchers) when a product is selected
  useEffect(() => {
    if (!selectedProduct) {
      setSelectedProductDetails(null);
      setVouchers([]);
      setSelectedVoucher(null);
      return;
    }

    const fetchProductDetails = async () => {
      setLoadingVouchers(true);
      try {
        const response = await apiClient.get(`/games/${selectedProduct.slug}`);
        const productDetails = response.data.data;
        
        setSelectedProductDetails(productDetails);
        
        if (productDetails.vouchers && Array.isArray(productDetails.vouchers)) {
          setVouchers(productDetails.vouchers);
        } else {
          setVouchers([]);
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
        
        try {
          const voucherRes = await apiClient.get(`/games/${selectedProduct.slug}/vouchers`);
          if (voucherRes.data?.data && Array.isArray(voucherRes.data.data)) {
            setVouchers(voucherRes.data.data);
          } else {
            setVouchers([]);
          }
        } catch (voucherError) {
          console.error('Alternative endpoint also failed:', voucherError);
          setVouchers([]);
        }
      } finally {
        setLoadingVouchers(false);
      }
    };

    fetchProductDetails();
  }, [selectedProduct]);

  // Auto-detect operator from phone number
  useEffect(() => {
    if (pageType === 'pln') { setDetectedOp(null); return; }
    if (phone.length >= 4) {
      const prefix4 = phone.slice(0,4);
      const prefix5 = phone.slice(0,5);
      const op = OPERATORS.find(o => o.prefix.some(p => p === prefix4 || p === prefix5));
      setDetectedOp(op || null);
      if (op && !selectedProduct) {
        const match = products.find(g => g.slug === op.slug);
        if (match) setSelectedProduct(match);
      }
    } else {
      setDetectedOp(null);
    }
  }, [phone, products, pageType, selectedProduct]);

  // Cek nomor / meter
  const handleCheck = useCallback(async () => {
    if (pageType === 'pln') {
      if (phone.length < 11) { toast.error('Nomor meter PLN minimal 11 digit'); return; }
    } else {
      if (phone.length < 10) { toast.error('Nomor HP minimal 10 digit'); return; }
    }
    setChecking(true); setCheckResult(null); setCheckError('');
    try {
      if (pageType === 'pln') {
        const res = await apiClient.get('/digiflazz/cek-pln', { params: { meter: phone } });
        const d   = res.data.data;
        setCheckResult({
          name:   d?.customer_name || d?.name,
          status: d?.status,
          info:   `ID: ${d?.customer_no || phone} | Daya: ${d?.desc?.daya || '-'} VA`,
        });
        setTargetUsername(d?.customer_name || '');
        toast.success(`Meter PLN: ${d?.customer_name || 'Ditemukan'}`);
      } else {
        const op = detectedOp?.digiOperator || 'tsel';
        const res = await apiClient.get('/digiflazz/cek-nomor', { params: { operator: op, phone } });
        const d   = res.data.data;
        setCheckResult({
          name:   d?.customer_name || d?.name || 'Nomor Valid',
          status: d?.status,
          info:   `Operator: ${detectedOp?.name || op}`,
        });
        setTargetUsername(d?.customer_name || '');
        toast.success(`Nomor ${detectedOp?.name || ''}: ${d?.customer_name || 'Valid'}`);
      }
      setTargetId(phone);
    } catch (err) {
      setCheckError(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  }, [phone, pageType, detectedOp]);

  const handleBuy = () => {
    if (!phone)          { toast.error(`Masukkan ${config.inputLabel}`); return; }
    if (!selectedProduct){ toast.error('Pilih produk/operator'); return; }
    if (!selectedVoucher){ toast.error('Pilih nominal/paket'); return; }
    setGame(selectedProduct);
    setVoucher(selectedVoucher);
    setTargetId(phone);
    router.push('/dashboard/checkout');
  };

  // Filter vouchers based on page type
  const displayVouchers = useMemo(() => {
    if (!vouchers.length) return [];
    
    if (pageType === 'pln') {
      return vouchers.filter(v => v && v.name && typeof v.name === 'string');
    }
    
    const validVouchers = vouchers.filter(v => v && v.name && typeof v.name === 'string');
    
    if (pageType === 'paket_data') {
      const paketVouchers = validVouchers.filter(v => {
        const name = v.name.toLowerCase();
        return name.includes('paket') || name.includes('gb') || name.includes('data');
      });
      return paketVouchers.length > 0 ? paketVouchers : validVouchers;
    }
    
    if (pageType === 'pulsa') {
      const pulsaVouchers = validVouchers.filter(v => {
        const name = v.name.toLowerCase();
        return !name.includes('paket') && !name.includes('gb') && !name.includes('data');
      });
      return pulsaVouchers.length > 0 ? pulsaVouchers : validVouchers;
    }
    
    return validVouchers;
  }, [vouchers, pageType]);

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-2xl p-6" style={{
          background: `linear-gradient(135deg, rgba(234, 82, 52, 0.2), #1a1a1a)`,
          border: `1px solid rgba(234, 82, 52, 0.3)`,
        }}>
          <div className="relative z-10">
            <h1 style={{ color: '#f8d9b9', fontWeight: 900, fontSize: 32 }}>{config.icon} {config.title}</h1>
            <p style={{ color: '#b4b4b4', fontSize: 14, marginTop: 4 }}>{config.desc}</p>
          </div>
          <div className="absolute top-0 right-0 text-8xl opacity-10">{config.icon}</div>
        </div>

        {/* Page type tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['pulsa','paket_data','pln'] as PageType[]).map(t => (
            <button key={t} onClick={() => {
              router.push(`/dashboard/topup?type=${t}`);
              setSelectedProduct(null); 
              setSelectedProductDetails(null);
              setSelectedVoucher(null);
              setVouchers([]);
              setPhone(''); 
              setCheckResult(null);
            }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
              style={pageType === t
                ? { background: '#ea5234', color: 'white', boxShadow: '0 4px 12px rgba(234, 82, 52, 0.4)' }
                : { background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.25)', color: '#b4b4b4' }}>
              <span>{PAGE_CONFIG[t].icon}</span>
              {PAGE_CONFIG[t].title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Input + Operator select */}
          <div className="lg:col-span-2 space-y-4">
            {/* Input number */}
            <div className="p-5 rounded-2xl" style={ss}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ background: '#ea5234', color: 'white' }}>1</div>
                <span style={{ color: '#f8d9b9', fontWeight: 800 }}>Masukkan {config.inputLabel}</span>
              </div>
              <input 
                value={phone} 
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={pageType === 'pln' ? '12345678901 (11-12 digit)' : '08xxxxxxxxxx'}
                type="tel" 
                className="w-full px-4 py-3 rounded-xl bg-[#242424] border border-[#ea5234]/25 text-white focus:outline-none focus:border-[#ea5234]/50 mb-3"
                style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.04em' }} 
              />

              {detectedOp && pageType !== 'pln' && (
                <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                  style={{ background: `${detectedOp.color}15`, border: `1px solid ${detectedOp.color}30` }}>
                  <span>{detectedOp.emoji}</span>
                  <span style={{ color: detectedOp.color, fontWeight: 700, fontSize: 13 }}>{detectedOp.name} terdeteksi</span>
                </motion.div>
              )}

              <button onClick={handleCheck} disabled={checking || phone.length < (pageType === 'pln' ? 11 : 10)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: 'rgba(234, 82, 52, 0.2)', border: '1px solid rgba(234, 82, 52, 0.5)', color: '#ea5234' }}>
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {pageType === 'pln' ? 'Cek Nomor Meter' : 'Cek Nomor'}
              </button>

              <AnimatePresence>
                {checkResult && (
                  <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                    className="mt-3 p-3 rounded-xl"
                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
                      <div>
                        {checkResult.name && <div style={{ color: '#f8d9b9', fontWeight: 700 }}>{checkResult.name}</div>}
                        {checkResult.info && <div style={{ color: '#b4b4b4', fontSize: 12 }}>{checkResult.info}</div>}
                      </div>
                    </div>
                  </motion.div>
                )}
                {checkError && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444' }}>
                    <XCircle className="w-4 h-4 shrink-0" /> {checkError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Operator grid - hide for PLN */}
            {pageType !== 'pln' && (
              <div className="p-5 rounded-2xl" style={ss}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black"
                    style={{ background: '#ea5234', color: 'white' }}>2</div>
                  <span style={{ color: '#f8d9b9', fontWeight: 800 }}>Pilih Operator</span>
                </div>
                {loading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#ea5234' }} /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATORS.map(op => {
                      const prod   = products.find(g => g.slug === op.slug);
                      const active = selectedProduct?.slug === op.slug;
                      return (
                        <button key={op.slug} onClick={() => { if(prod) setSelectedProduct(prod); setSelectedVoucher(null); }}
                          disabled={!prod}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all disabled:opacity-30"
                          style={{
                            background: active ? `${op.color}20` : '#242424',
                            border: `1px solid ${active ? op.color+'50' : 'rgba(234, 82, 52, 0.25)'}`,
                          }}>
                          <span className="text-2xl">{op.emoji}</span>
                          <span style={{ color: active ? 'white' : '#b4b4b4', fontWeight: 700, fontSize: 11, textAlign: 'center', lineHeight: 1.2 }}>
                            {op.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Voucher list */}
          <div className="lg:col-span-3">
            <div className="p-5 rounded-2xl" style={ss}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ background: '#ea5234', color: 'white' }}>
                  {pageType === 'pln' ? '2' : '3'}
                </div>
                <span style={{ color: '#f8d9b9', fontWeight: 800 }}>
                  {pageType === 'pln' ? 'Pilih Nominal Token' : selectedProduct ? `Pilih Nominal — ${selectedProduct.name}` : 'Pilih Nominal'}
                </span>
                {displayVouchers.length > 0 && (
                  <span style={{ color: '#b4b4b4', fontSize: 12 }}>{displayVouchers.length} pilihan</span>
                )}
              </div>

              {!selectedProduct && pageType !== 'pln' ? (
                <div className="text-center py-10" style={{ color: '#b4b4b4' }}>
                  Pilih operator terlebih dahulu
                </div>
              ) : loadingVouchers ? (
                <div className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: '#ea5234' }} />
                  <div className="mt-2" style={{ color: '#b4b4b4' }}>Memuat voucher...</div>
                </div>
              ) : displayVouchers.length === 0 ? (
                <div className="text-center py-10" style={{ color: '#b4b4b4' }}>
                  Voucher tidak tersedia untuk produk ini
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                  {displayVouchers.map(v => (
                    <VoucherDetailCard 
                      key={v._id}
                      v={v} 
                      selected={selectedVoucher?._id === v._id}
                      onSelect={() => setSelectedVoucher(v)}
                      pageType={pageType}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Buy button */}
            {selectedVoucher && (
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                className="mt-4 p-4 rounded-2xl flex items-center justify-between gap-4"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.3), #1a1a1a)', 
                  border: '1px solid rgba(234, 82, 52, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}>
                <div className="flex-1">
                  <div style={{ color: '#b4b4b4', fontSize: 12 }}>Dipilih:</div>
                  <div style={{ color: '#f8d9b9', fontWeight: 700 }}>{selectedVoucher.name}</div>
                  <div style={{ color: '#ea5234', fontWeight: 900, fontSize: 20 }}>{formatCurrency(selectedVoucher.price)}</div>
                  {selectedVoucher.description && (
                    <div style={{ color: '#b4b4b4', fontSize: 11, marginTop: 2 }}>{selectedVoucher.description}</div>
                  )}
                </div>
                <button onClick={handleBuy}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm transition-all hover:scale-105 shrink-0"
                  style={{ background: '#ea5234', color: 'white', boxShadow: '0 4px 16px rgba(234, 82, 52, 0.6)' }}>
                  Beli Sekarang <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #242424;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(234, 82, 52, 0.6);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #ea5234;
          }
        `}</style>
      </div>
    </div>
  );
}

export default function TopupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ea5234' }} /></div>}>
      <TopupPageInner />
    </Suspense>
  );
}