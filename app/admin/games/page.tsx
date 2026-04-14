'use client';

import { useEffect, useState, useCallback } from 'react';
import { gamesAPI, settingsAPI } from '@/lib/api/client';
import { Game, Category } from '@/types';
import { formatDateShort, getErrorMessage } from '@/lib/utils/format';
import { Plus, Edit2, Trash2, Loader2, X, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';

type FormData = {
  name: string;
  slug: string;
  description: string;
  category: string;
  platform: string;
  publisher: string;
  provider: string;
  gameCode: string;
  image: string;
  banner: string;
  requiresServerId: boolean;
  serverIdLabel: string;
  userIdLabel: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  tags: string;
};

const EMPTY: FormData = {
  name:'', slug:'', description:'', category:'mobile', platform:'',
  publisher:'', provider:'digiflazz', gameCode:'',
  image:'', banner:'',
  requiresServerId:false, serverIdLabel:'Zone ID', userIdLabel:'User ID',
  isActive:true, isFeatured:false, sortOrder:0, tags:'',
};

export default function AdminGamesPage() {
  const [games,      setGames]      = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editGame,   setEditGame]   = useState<Game|null>(null);
  const [form,       setForm]       = useState<FormData>(EMPTY);
  const [saving,     setSaving]     = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [gRes, cRes] = await Promise.all([gamesAPI.getAll({ limit:100 }), settingsAPI.getCategories()]);
    setGames(gRes.data.data);
    setCategories(cRes.data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditGame(null); setForm(EMPTY); setShowModal(true); };
  const openEdit   = (g: Game) => {
    setEditGame(g);
    setForm({
      name:g.name, slug:g.slug, description:g.description,
      category:g.category, platform:g.platform.join(', '),
      publisher:g.publisher, provider:g.provider, gameCode:g.gameCode,
      image:g.image||'', banner:g.banner||'',
      requiresServerId:g.requiresServerId, serverIdLabel:g.serverIdLabel,
      userIdLabel:g.userIdLabel, isActive:g.isActive, isFeatured:g.isFeatured,
      sortOrder:g.sortOrder, tags:g.tags.join(', '),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { 
        ...form, 
        platform: form.platform.split(',').map(s=>s.trim()).filter(Boolean), 
        tags: form.tags.split(',').map(s=>s.trim()).filter(Boolean) 
      };
      if (editGame) { await gamesAPI.update(editGame._id, data); toast.success('Game diperbarui'); }
      else          { await gamesAPI.create(data);               toast.success('Game ditambahkan'); }
      setShowModal(false);
      fetch();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (g: Game) => {
    if (!confirm(`Hapus "${g.name}"?`)) return;
    await gamesAPI.delete(g._id);
    toast.success('Game dihapus');
    fetch();
  };

  const f = (field: keyof FormData, val: unknown) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🎮 Kelola Games</h1>
          <p className="text-slate-400 text-sm">{games.length} game</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Game
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Game','Kode','Kategori','Provider','Status','Tgl','Aksi'].map(h => (
                    <th key={h} className="text-left text-slate-400 text-xs font-semibold uppercase px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {games.map(g => (
                  <tr key={g._id} className="hover:bg-white/3">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {g.image
                          ? <img src={g.image} alt={g.name} className="w-9 h-9 rounded-xl object-cover" />
                          : <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-500" /></div>
                        }
                        <div>
                          <p className="text-white text-sm font-medium">{g.name}</p>
                          <p className="text-slate-500 text-xs">{g.publisher}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs font-mono">{g.gameCode}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs capitalize">{g.category}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs capitalize">{g.provider}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold w-fit', g.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                          {g.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {g.isFeatured && <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full w-fit">Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateShort(g.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(g)} className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(g)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{editGame ? 'Edit Game' : 'Tambah Game'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Image preview */}
            {form.image && (
              <div className="mb-4 flex justify-center">
                <img src={form.image} alt="preview" className="h-28 rounded-2xl object-cover border border-white/10" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {/* Text fields */}
              {([
                ['Nama Game *',       'name',          true,  'text'],
                ['Game Code *',       'gameCode',      true,  'text'],
                ['Slug (URL)',        'slug',          false, 'text'],
                ['Publisher',        'publisher',     false, 'text'],
                ['Label User ID',    'userIdLabel',   false, 'text'],
                ['Label Server ID',  'serverIdLabel', false, 'text'],
                ['Platform (koma)',  'platform',      false, 'text'],
                ['Tags (koma)',       'tags',          false, 'text'],
                ['Sort Order',       'sortOrder',     false, 'number'],
              ] as [string, keyof FormData, boolean, string][]).map(([label, field, required, type]) => (
                <div key={field}>
                  <label className="block text-xs text-slate-300 mb-1">{label}</label>
                  <input 
                    type={type} 
                    value={form[field] as string || ""}
                    onChange={e => f(field, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                    required={required} 
                    className="input-field py-2 text-sm" 
                  />
                </div>
              ))}

              {/* Image URLs */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-300 mb-1 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> URL Gambar (thumbnail)</label>
                <input value={form.image} onChange={e => f('image', e.target.value)} placeholder="https://..." className="input-field py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-300 mb-1">URL Banner (header game)</label>
                <input value={form.banner} onChange={e => f('banner', e.target.value)} placeholder="https://..." className="input-field py-2 text-sm" />
              </div>

              {/* Selects */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">Kategori</label>
                <select value={form.category} onChange={e => f('category', e.target.value)} className="input-field py-2 text-sm">
                  {categories.map(c => <option key={c._id} value={c.slug}>{c.icon} {c.name}</option>)}
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Provider</label>
                <select value={form.provider} onChange={e => f('provider', e.target.value)} className="input-field py-2 text-sm">
                  {['digiflazz','apigames','both'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-300 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} className="input-field py-2 text-sm resize-none" />
              </div>

              {/* Checkboxes - FIXED */}
              <div className="col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.requiresServerId} 
                    onChange={e => f('requiresServerId', e.target.checked)} 
                    className="w-4 h-4 accent-blue-500" 
                  />
                  <span className="text-slate-300 text-sm">Perlu Server ID</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isActive} 
                    onChange={e => f('isActive', e.target.checked)} 
                    className="w-4 h-4 accent-blue-500" 
                  />
                  <span className="text-slate-300 text-sm">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.isFeatured} 
                    onChange={e => f('isFeatured', e.target.checked)} 
                    className="w-4 h-4 accent-blue-500" 
                  />
                  <span className="text-slate-300 text-sm">Featured</span>
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