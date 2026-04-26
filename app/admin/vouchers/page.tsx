'use client';

import { useEffect, useState, useCallback } from 'react';
import { gamesAPI } from '@/lib/api/client';
import { Game, Voucher } from '@/types';
import { formatCurrency, getErrorMessage } from '@/lib/utils/format';
import { Plus, Edit2, Trash2, Loader2, X, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';

// Type definition untuk form
// Update interface FormData
type FormData = {
  gameId: string;
  name: string;
  code: string;
  description: string;  // Tetap string untuk form
  price: number;
  originalPrice: number;
  rewardPoints: number;
  provider: string;
  providerCode: string;
  type: string;
  image: string;
  isActive: boolean;
  isFeatured: boolean;
  stock: number;
  sortOrder: number;
};

// EMPTY tetap string kosong (bukan undefined)
const EMPTY: FormData = {
  gameId: '',
  name: '',
  code: '',
  description: '',  // ✅ string kosong
  price: 0,
  originalPrice: 0,
  rewardPoints: 0,
  provider: 'digiflazz',
  providerCode: '',
  type: 'other',
  image: '',
  isActive: true,
  isFeatured: false,
  stock: -1,
  sortOrder: 0,
};

export default function AdminVouchersPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selGameId, setSelGameId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editV, setEditV] = useState<Voucher | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gamesAPI.getAll({ limit: 100 }).then(r => setGames(r.data.data));
  }, []);

  const loadVouchers = useCallback(async (gameId: string) => {
    if (!gameId) return;
    setLoading(true);
    const game = games.find(g => g._id === gameId);
    if (game) {
      const res = await gamesAPI.getVouchers(game.slug);
      setVouchers(res.data.data);
    }
    setLoading(false);
  }, [games]);

  useEffect(() => {
    loadVouchers(selGameId);
  }, [selGameId, loadVouchers]);

  const openCreate = () => {
    const selectedGame = games.find(g => g._id === selGameId);
    setEditV(null);
    setForm({
      ...EMPTY,
      gameId: selGameId,
      provider: selectedGame?.provider === 'apigames' ? 'apigames' : 'digiflazz'
    });
    setShowModal(true);
  };

 // app/admin/vouchers/page.tsx

// Di openEdit function:
const openEdit = (v: Voucher) => {
  setEditV(v);
  setForm({
    gameId: typeof v.gameId === 'string' ? v.gameId : (v.gameId as Game)._id,
    name: v.name,
    code: v.code,
    description: v.description || '',  // 🔥 FIX: Gunakan fallback empty string
    price: v.price,
    originalPrice: v.originalPrice,
    rewardPoints: v.rewardPoints,
    provider: v.provider,
    providerCode: v.providerCode,
    type: v.type,
    image: (v as unknown as { image?: string }).image || '',
    isActive: v.isActive,
    isFeatured: v.isFeatured,
    stock: v.stock,
    sortOrder: v.sortOrder,
  });
  setShowModal(true);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editV) {
        await gamesAPI.updateVoucher(editV._id, form as Record<string, unknown>);
        toast.success('Voucher diperbarui');
      } else {
        await gamesAPI.createVoucher(form as Record<string, unknown>);
        toast.success('Voucher ditambahkan');
      }
      setShowModal(false);
      loadVouchers(selGameId);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Voucher) => {
    if (!confirm(`Hapus "${v.name}"?`)) return;
    await gamesAPI.deleteVoucher(v._id);
    toast.success('Voucher dihapus');
    setVouchers(vs => vs.filter(x => x._id !== v._id));
  };

  const f = (field: keyof FormData, val: unknown) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const selectedGame = games.find(g => g._id === selGameId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">💎 Kelola Vouchers</h1>
          {selGameId && <p className="text-slate-400 text-sm mt-1">{vouchers.length} voucher untuk {selectedGame?.name}</p>}
        </div>
        {selGameId && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Voucher
          </button>
        )}
      </div>

      {/* Select Game */}
      <div className="glass-card p-4 mb-6">
        <label className="block text-sm text-slate-300 mb-2">Pilih Game</label>
        <select value={selGameId} onChange={e => setSelGameId(e.target.value)} className="input-field">
          <option value="">-- Pilih Game --</option>
          {games.map(g => (
            <option key={g._id} value={g._id}>
              {g.name} ({g.gameCode})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>}

      {!loading && selGameId && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">Voucher</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">Harga</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">Points</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">Provider</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">Status</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {vouchers.map(v => (
                  <tr key={v._id} className="hover:bg-white/3">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(v as unknown as { image?: string }).image
  ? <img src={(v as unknown as { image?: string }).image} alt={v.name} className="w-8 h-8 rounded-lg object-cover" />
  : <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs">
      {v.type === 'diamond' ? '💎' : v.type === 'subscription' ? '👑' : '🪙'}
    </div>
}
                        <div>
                          <p className="text-white text-sm font-medium">{v.name}</p>
                          {v.isFeatured && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">Terlaris</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-bold text-sm">{formatCurrency(v.price)}</p>
                      {v.originalPrice > v.price && <p className="text-slate-500 text-xs line-through">{formatCurrency(v.originalPrice)}</p>}
                    </td>
                    <td className="px-4 py-3 text-yellow-400 font-semibold text-sm">+{v.rewardPoints}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs capitalize">{v.provider}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-semibold', v.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                        {v.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(v)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">Belum ada voucher</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{editV ? 'Edit Voucher' : 'Tambah Voucher'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {form.image && <div className="mb-4 flex justify-center"><img src={form.image} alt="preview" className="h-20 rounded-xl object-cover border border-white/10" /></div>}

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* Game select */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-300 mb-1">Game *</label>
                <select value={form.gameId} onChange={e => f('gameId', e.target.value)} required className="input-field py-2 text-sm">
                  <option value="">-- Pilih Game --</option>
                  {games.map(g => <option key={g._id} value={g._id}>{g.name} ({g.gameCode})</option>)}
                </select>
              </div>

              {/* Nama Voucher */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nama Voucher *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  required
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Voucher Code */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Voucher Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => f('code', e.target.value)}
                  required
                  placeholder="Kode unik untuk voucher"
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Provider Code */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Provider Code (SKU) *</label>
                <input
                  type="text"
                  value={form.providerCode}
                  onChange={e => f('providerCode', e.target.value)}
                  required
                  placeholder="Kode SKU dari provider"
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Harga */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Harga (IDR) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => f('price', parseFloat(e.target.value) || 0)}
                  required
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Harga Asli */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Harga Asli</label>
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={e => f('originalPrice', parseFloat(e.target.value) || 0)}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Reward Points */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Reward Points</label>
                <input
                  type="number"
                  value={form.rewardPoints}
                  onChange={e => f('rewardPoints', parseFloat(e.target.value) || 0)}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => f('sortOrder', parseInt(e.target.value) || 0)}
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Provider Select */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Provider</label>
                <select
                  value={form.provider}
                  onChange={e => f('provider', e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="digiflazz">digiflazz</option>
                  <option value="apigames">apigames</option>
                </select>
              </div>

              {/* Type Select */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Tipe</label>
                <select
                  value={form.type}
                  onChange={e => f('type', e.target.value)}
                  className="input-field py-2 text-sm"
                >
                  <option value="diamond">diamond</option>
                  <option value="coin">coin</option>
                  <option value="subscription">subscription</option>
                  <option value="item">item</option>
                  <option value="other">other</option>
                </select>
              </div>

              {/* Image URL */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> URL Gambar Voucher (opsional)
                </label>
                <input
                  value={form.image}
                  onChange={e => f('image', e.target.value)}
                  placeholder="https://..."
                  className="input-field py-2 text-sm"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-300 mb-1">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={e => f('description', e.target.value)}
                  rows={2}
                  className="input-field py-2 text-sm resize-none"
                />
              </div>

              {/* Checkboxes */}
              <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => f('isActive', e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span className="text-slate-300 text-sm">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={e => f('isFeatured', e.target.checked)}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <span className="text-slate-300 text-sm">Terlaris</span>
                </label>
              </div>

              <div className="col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
