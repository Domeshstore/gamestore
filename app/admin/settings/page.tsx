// app/admin/settings/page.tsx
// app/admin/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { settingsAPI } from '@/lib/api/client';
import { AppSetting, Category } from '@/types';
import { getErrorMessage } from '@/lib/utils/format';
import {
  Plus, Trash2, Loader2, Save, X, Check, QrCode, CreditCard,
  MessageCircle, Send, Tag, Image as ImageIcon, ArrowUp, ArrowDown,
  Wallet, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const GRADIENT_PRESETS = [
  'from-blue-500 to-blue-700','from-purple-500 to-purple-700',
  'from-red-500 to-pink-700','from-green-500 to-teal-700',
  'from-yellow-500 to-orange-600','from-indigo-500 to-violet-700',
  'from-rose-500 to-red-700','from-cyan-500 to-blue-600',
  'from-slate-600 to-slate-800',
];

type TabKey = 'banners'|'qris'|'bank'|'ewallet'|'contact'|'categories';

const emptyBank  = () => ({ bankName:'', accountNumber:'', accountName:'', logo:'', qrCode:'', isActive:true, sortOrder:0 });
const emptyEW    = () => ({ name:'', number:'', accountName:'', logo:'', qrCode:'', isActive:true, sortOrder:0 });
const emptyBanner= () => ({ imageUrl:'', title:'', subtitle:'', linkUrl:'', isActive:true, sortOrder:0 });
const emptyCat   = () => ({ name:'', slug:'', icon:'🎮', color:'#7c3aed', gradient:'from-purple-500 to-purple-700', image:'', isActive:true, sortOrder:0 });

const EWALLET_PRESETS = [
  { name:'GoPay',      logo:'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' },
  { name:'OVO',        logo:'https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo_purple.svg' },
  { name:'Dana',       logo:'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg' },
  { name:'ShopeePay', logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/800px-Shopee.svg.png' },
  { name:'LinkAja',   logo:'' },
];

export default function AdminSettingsPage() {
  const [tab,       setTab]       = useState<TabKey>('banners');
  const [settings,  setSettings]  = useState<AppSetting | null>(null);
  const [categories,setCategories]= useState<Category[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat,   setEditCat]   = useState<Category | null>(null);
  const [catForm,   setCatForm]   = useState(emptyCat());
  const [savingCat, setSavingCat] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<number|null>(null);

  useEffect(() => {
    Promise.all([settingsAPI.getApp(), settingsAPI.getAllCategories()])
      .then(([sRes, cRes]) => { setSettings(sRes.data.data); setCategories(cRes.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch?: Partial<AppSetting>) => {
    if (!settings) return;
    setSaving(true);
    try {
      const merged = { ...settings, ...patch };
      const res = await settingsAPI.updateApp(merged as Record<string,unknown>);
      setSettings(res.data.data);
      toast.success('Pengaturan disimpan!');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const f = (key: keyof AppSetting, val: unknown) =>
    setSettings(s => s ? { ...s, [key]: val } : s);

  // Banner helpers
  const banners = settings?.banners ?? [];
  const addBanner = () => {
    if (banners.length >= 6) { toast.error('Maksimal 6 banner'); return; }
    f('banners', [...banners, emptyBanner()]);
  };
  const removeBanner = (i: number) => f('banners', banners.filter((_, j) => j !== i));
  const updateBanner = (i: number, key: string, val: unknown) => {
    const arr = [...banners];
    arr[i] = { ...arr[i], [key]: val };
    f('banners', arr);
  };
  const moveBanner = (i: number, dir: 1|-1) => {
    const arr = [...banners];
    const ni = i + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    f('banners', arr);
  };

  // Bank helpers
  const banks = settings?.bankAccounts ?? [];
  const addBank  = () => f('bankAccounts', [...banks, emptyBank()]);
  const removeBank = (i: number) => f('bankAccounts', banks.filter((_, j) => j !== i));
  const updateBank = (i: number, key: string, val: unknown) => {
    const arr = [...banks];
    arr[i] = { ...arr[i], [key]: val };
    f('bankAccounts', arr);
  };

  // E-wallet helpers
  const eWallets = settings?.eWallets ?? [];
  const addEW  = (preset?: { name: string; logo: string }) => {
    const base = emptyEW();
    if (preset) { base.name = preset.name; base.logo = preset.logo; }
    f('eWallets', [...eWallets, base]);
  };
  const removeEW = (i: number) => f('eWallets', eWallets.filter((_, j) => j !== i));
  const updateEW = (i: number, key: string, val: unknown) => {
    const arr = [...eWallets];
    arr[i] = { ...arr[i], [key]: val };
    f('eWallets', arr);
  };

  // Category CRUD
  const openCreateCat = () => { setEditCat(null); setCatForm(emptyCat()); setShowCatModal(true); };
  const openEditCat   = (c: Category) => {
    setEditCat(c);
    setCatForm({ name:c.name, slug:c.slug, icon:c.icon, color:c.color, gradient:c.gradient, image:c.image, isActive:c.isActive, sortOrder:c.sortOrder });
    setShowCatModal(true);
  };
  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingCat(true);
    try {
      if (editCat) {
        const res = await settingsAPI.updateCategory(editCat._id, catForm as Record<string,unknown>);
        setCategories(cs => cs.map(c => c._id === editCat._id ? res.data.data : c));
        toast.success('Kategori diperbarui');
      } else {
        const res = await settingsAPI.createCategory(catForm as Record<string,unknown>);
        setCategories(cs => [...cs, res.data.data]);
        toast.success('Kategori ditambahkan');
      }
      setShowCatModal(false);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSavingCat(false); }
  };
  const deleteCat = async (id: string) => {
    if (!confirm('Hapus kategori?')) return;
    await settingsAPI.deleteCategory(id);
    setCategories(cs => cs.filter(c => c._id !== id));
    toast.success('Kategori dihapus');
  };

  if (loading || !settings) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
  );

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key:'banners',    label:'🖼️ Banner Iklan',   icon:<ImageIcon className="w-4 h-4" /> },
    { key:'qris',       label:'📱 QRIS',            icon:<QrCode className="w-4 h-4" /> },
    { key:'bank',       label:'🏦 Rekening Bank',   icon:<CreditCard className="w-4 h-4" /> },
    { key:'ewallet',    label:'💳 E-Wallet',         icon:<Wallet className="w-4 h-4" /> },
    { key:'contact',    label:'💬 Kontak CS',        icon:<MessageCircle className="w-4 h-4" /> },
    { key:'categories', label:'🏷️ Kategori',        icon:<Tag className="w-4 h-4" /> },
  ];

  const inputCls = "input-field text-sm py-2";
  const labelCls = "block text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wide";
  const sectionStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-white">⚙️ Pengaturan</h1>
        <p className="text-slate-400 text-sm mt-1">Banner, QRIS, rekening, e-wallet, kontak, kategori</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap p-1.5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={tab === key
              ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.3))', border: '1px solid rgba(124,58,237,0.4)', color: 'white' }
              : { color: 'rgba(148,163,184,0.7)', border: '1px solid transparent' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ BANNERS ══════════════════════════════════ */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold">Banner / Iklan</p>
              <p className="text-slate-400 text-xs">{banners.length}/6 banner aktif</p>
            </div>
            <button onClick={addBanner} disabled={banners.length >= 6}
              className="btn-primary flex items-center gap-2 text-sm py-2 disabled:opacity-40">
              <Plus className="w-4 h-4" /> Tambah Banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={sectionStyle}>
              <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Belum ada banner. Minimal 3, maksimal 6.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((b, i) => (
                <div key={i} className="p-4 rounded-2xl space-y-3" style={sectionStyle}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">Banner {i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => moveBanner(i, -1)} disabled={i === 0}
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                        <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1}
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors">
                        <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => setPreviewBanner(previewBanner === i ? null : i)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => removeBanner(i)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {previewBanner === i && b.imageUrl && (
                    <div className="rounded-xl overflow-hidden aspect-[3/1]">
                      <img src={b.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>URL Gambar Banner * <span className="text-slate-500 normal-case">(1200×400px ideal)</span></label>
                      <input value={b.imageUrl} onChange={e => updateBanner(i, 'imageUrl', e.target.value)}
                        placeholder="https://..." className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Judul</label>
                      <input value={b.title || ''} onChange={e => updateBanner(i, 'title', e.target.value)}
                        placeholder="Promo Mobile Legends" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Subjudul</label>
                      <input value={b.subtitle || ''} onChange={e => updateBanner(i, 'subtitle', e.target.value)}
                        placeholder="Bonus 20 Diamond!" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>URL Link (opsional)</label>
                      <input value={b.linkUrl || ''} onChange={e => updateBanner(i, 'linkUrl', e.target.value)}
                        placeholder="/dashboard/games/mobile-legends" className={inputCls} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={b.isActive}
                        onChange={e => updateBanner(i, 'isActive', e.target.checked)}
                        className="w-4 h-4 accent-purple-500" />
                      <span className="text-slate-300 text-sm">Aktif</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {banners.length < 3 && banners.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24' }}>
              ⚠️ Minimal 3 banner untuk tampilan terbaik ({3 - banners.length} lagi)
            </div>
          )}

          <button onClick={() => save()} disabled={saving}
            className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Menyimpan...' : 'Simpan Banner'}
          </button>
        </div>
      )}

      {/* ══ QRIS ═══════════════════════════════════ */}
      {tab === 'qris' && (
        <div className="p-6 rounded-2xl space-y-5" style={sectionStyle}>
          <h3 className="text-white font-bold">📱 Pengaturan QRIS</h3>
          {settings.qrisImage && (
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-4 inline-block">
                <img src={settings.qrisImage} alt="QRIS" className="w-52 h-52 object-contain" />
              </div>
            </div>
          )}
          
          {/* FIXED: Akses langsung ke properti settings */}
          <div>
            <label className={labelCls}>URL Gambar QRIS</label>
            <input 
              value={settings.qrisImage || ''}
              onChange={e => f('qrisImage', e.target.value)}
              placeholder="https://i.imgur.com/xxx.png" 
              className={inputCls} 
            />
          </div>
          
          <div>
            <label className={labelCls}>Nama Merchant</label>
            <input 
              value={settings.qrisName || ''}
              onChange={e => f('qrisName', e.target.value)}
              placeholder="GameVoucher Store" 
              className={inputCls} 
            />
          </div>
          
          <div>
            <label className={labelCls}>Instruksi QRIS untuk user</label>
            <textarea 
              value={settings.qrisNote || ''}
              onChange={e => f('qrisNote', e.target.value)}
              rows={2} 
              className={`${inputCls} resize-none`} 
            />
          </div>
          
          <div>
            <label className={labelCls}>Pesan saat status Processing</label>
            <textarea 
              value={settings.processingNote || ''}
              onChange={e => f('processingNote', e.target.value)}
              rows={2} 
              className={`${inputCls} resize-none`} 
            />
          </div>
          
          <div>
            <label className={labelCls}>Pesan saat Top Up Berhasil</label>
            <textarea 
              value={settings.successNote || ''}
              onChange={e => f('successNote', e.target.value)}
              rows={2} 
              className={`${inputCls} resize-none`} 
            />
          </div>
          
          <button onClick={() => save()} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan QRIS
          </button>
        </div>
      )}

      {/* ══ BANK ═══════════════════════════════════ */}
      {tab === 'bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-bold">Rekening Bank</p>
            <button onClick={addBank} className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Bank
            </button>
          </div>
          {banks.map((b, i) => (
            <div key={i} className="p-5 rounded-2xl space-y-3" style={sectionStyle}>
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">{b.bankName || `Bank ${i + 1}`}</p>
                <button onClick={() => removeBank(i)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nama Bank</label>
                  <input 
                    value={b.bankName || ''}
                    onChange={e => updateBank(i, 'bankName', e.target.value)}
                    placeholder="BCA" 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>No. Rekening</label>
                  <input 
                    value={b.accountNumber || ''}
                    onChange={e => updateBank(i, 'accountNumber', e.target.value)}
                    placeholder="1234567890" 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>Atas Nama</label>
                  <input 
                    value={b.accountName || ''}
                    onChange={e => updateBank(i, 'accountName', e.target.value)}
                    placeholder="PT Game Store" 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className={labelCls}>URL Logo Bank</label>
                  <input 
                    value={b.logo || ''}
                    onChange={e => updateBank(i, 'logo', e.target.value)}
                    placeholder="https://..." 
                    className={inputCls} 
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>URL QR Code (opsional)</label>
                  <input 
                    value={b.qrCode || ''}
                    onChange={e => updateBank(i, 'qrCode', e.target.value)}
                    placeholder="https://..." 
                    className={inputCls} 
                  />
                  {b.qrCode && (
                    <div className="mt-2 bg-white rounded-xl p-2 inline-block">
                      <img src={b.qrCode} alt="QR" className="w-24 h-24 object-contain" />
                    </div>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={b.isActive}
                  onChange={e => updateBank(i, 'isActive', e.target.checked)}
                  className="w-4 h-4 accent-purple-500" />
                <span className="text-slate-300 text-sm">Aktif</span>
              </label>
            </div>
          ))}
          <button onClick={() => save()} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Rekening
          </button>
        </div>
      )}

      {/* ══ E-WALLET ══════════════════════════════ */}
      {tab === 'ewallet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-white font-bold">E-Wallet / Dompet Digital</p>
            <div className="flex gap-2 flex-wrap">
              {EWALLET_PRESETS.map(p => (
                <button key={p.name} onClick={() => addEW(p)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#a78bfa' }}>
                  + {p.name}
                </button>
              ))}
              <button onClick={() => addEW()} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Custom
              </button>
            </div>
          </div>

          {eWallets.length === 0 ? (
            <div className="text-center py-10 rounded-2xl" style={sectionStyle}>
              <Wallet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Belum ada e-wallet. Klik preset di atas untuk menambah.</p>
            </div>
          ) : (
            eWallets.map((ew, i) => (
              <div key={i} className="p-5 rounded-2xl space-y-3" style={sectionStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {ew.logo && <img src={ew.logo} alt={ew.name} className="h-7 object-contain" />}
                    <p className="text-white font-semibold">{ew.name || `E-Wallet ${i + 1}`}</p>
                  </div>
                  <button onClick={() => removeEW(i)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nama E-Wallet</label>
                    <input 
                      value={ew.name || ''}
                      onChange={e => updateEW(i, 'name', e.target.value)}
                      placeholder="GoPay" 
                      className={inputCls} 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nomor / ID</label>
                    <input 
                      value={ew.number || ''}
                      onChange={e => updateEW(i, 'number', e.target.value)}
                      placeholder="081234567890" 
                      className={inputCls} 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Akun</label>
                    <input 
                      value={ew.accountName || ''}
                      onChange={e => updateEW(i, 'accountName', e.target.value)}
                      placeholder="Game Store" 
                      className={inputCls} 
                    />
                  </div>
                  <div>
                    <label className={labelCls}>URL Logo</label>
                    <input 
                      value={ew.logo || ''}
                      onChange={e => updateEW(i, 'logo', e.target.value)}
                      placeholder="https://..." 
                      className={inputCls} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>URL QR Code (opsional)</label>
                    <input 
                      value={ew.qrCode || ''} 
                      onChange={e => updateEW(i, 'qrCode', e.target.value)}
                      placeholder="https://..." 
                      className={inputCls} 
                    />
                    {ew.qrCode && (
                      <div className="mt-2 bg-white rounded-xl p-2 inline-block">
                        <img src={ew.qrCode} alt="QR" className="w-24 h-24 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={ew.isActive}
                    onChange={e => updateEW(i, 'isActive', e.target.checked)}
                    className="w-4 h-4 accent-purple-500" />
                  <span className="text-slate-300 text-sm">Aktif</span>
                </label>
              </div>
            ))
          )}
          <button onClick={() => save()} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan E-Wallet
          </button>
        </div>
      )}

      {/* ══ CONTACT ═══════════════════════════════ */}
      {tab === 'contact' && (
        <div className="p-6 rounded-2xl space-y-4" style={sectionStyle}>
          <h3 className="text-white font-bold">💬 Kontak Customer Service</h3>
          <div>
            <label className={labelCls + " flex items-center gap-1"}>
              <MessageCircle className="w-3.5 h-3.5 text-green-400" /> Nomor WhatsApp
            </label>
            <input 
              value={settings.whatsappNumber || ''} 
              onChange={e => f('whatsappNumber', e.target.value)}
              placeholder="628123456789" 
              className={inputCls} 
            />
            <p className="text-slate-500 text-xs mt-1">Format tanpa + (contoh: 628123456789)</p>
          </div>
          <div>
            <label className={labelCls + " flex items-center gap-1"}>
              <Send className="w-3.5 h-3.5 text-blue-400" /> Username Telegram
            </label>
            <input 
              value={settings.telegramUsername || ''} 
              onChange={e => f('telegramUsername', e.target.value)}
              placeholder="gamevoucher_cs" 
              className={inputCls} 
            />
            <p className="text-slate-500 text-xs mt-1">Tanpa @ (contoh: gamevoucher_cs)</p>
          </div>

          {/* Preview */}
          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-slate-400 text-xs mb-3 font-semibold">Preview tombol:</p>
            <div className="flex gap-3">
              {settings.whatsappNumber && (
                <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </div>
              )}
              {settings.telegramUsername && (
                <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.2)', color: '#38bdf8' }}>
                  <Send className="w-4 h-4" /> Telegram
                </div>
              )}
            </div>
          </div>

          <button onClick={() => save()} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Kontak
          </button>
        </div>
      )}

      {/* ══ CATEGORIES ══════════════════════════ */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{categories.length} kategori</p>
            <button onClick={openCreateCat} className="btn-primary text-sm py-2 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Tambah Kategori
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat._id} className={cn('p-4 rounded-2xl bg-gradient-to-br', cat.gradient, 'bg-opacity-10')}
                style={{ border: `1px solid ${cat.color}25` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <p className="text-white font-bold">{cat.name}</p>
                      <p className="text-slate-300 text-xs">{cat.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs">✏️</button>
                    <button onClick={() => deleteCat(cat._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', cat.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                    {cat.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Category Modal ── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-3xl relative"
            style={{ background: 'linear-gradient(135deg, rgba(19,10,46,0.98), rgba(10,22,40,0.98))', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}>
            <button onClick={() => setShowCatModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-white font-black text-lg mb-4">{editCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>

            {/* Preview */}
            <div className={cn('p-4 rounded-xl mb-4 flex items-center gap-3 bg-gradient-to-br', catForm.gradient)}>
              <span className="text-3xl">{catForm.icon}</span>
              <div>
                <p className="text-white font-bold">{catForm.name || 'Nama Kategori'}</p>
                <p className="text-white/70 text-xs">{catForm.slug || 'slug'}</p>
              </div>
            </div>

            <form onSubmit={saveCat} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nama *</label>
                  <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required className={inputCls} placeholder="Streaming" />
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g,'-') }))} required className={inputCls} placeholder="streaming" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Emoji Icon</label>
                  <input value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))} className={`${inputCls} text-center text-2xl`} maxLength={4} />
                </div>
                <div>
                  <label className={labelCls}>Warna</label>
                  <div className="flex gap-2">
                    <input type="color" value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                    <input value={catForm.color} onChange={e => setCatForm(f => ({ ...f, color: e.target.value }))} className={`${inputCls} flex-1`} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Gradient Background</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {GRADIENT_PRESETS.map(g => (
                    <button type="button" key={g} onClick={() => setCatForm(f => ({ ...f, gradient: g }))}
                      className={cn('h-9 rounded-xl bg-gradient-to-br transition-all', g, catForm.gradient === g ? 'ring-2 ring-white scale-95' : 'hover:scale-95')} />
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>URL Gambar (opsional)</label>
                <input value={catForm.image} onChange={e => setCatForm(f => ({ ...f, image: e.target.value }))} className={inputCls} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={catForm.isActive} onChange={e => setCatForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                  <span className="text-slate-300 text-sm">Aktif</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Sort:</span>
                  <input type="number" value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: parseInt(e.target.value)||0 }))} className={`${inputCls} w-16`} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={savingCat} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}