'use client';

import { useEffect, useState } from 'react';
import { authAPI, rewardsAPI } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { PointsHistoryItem } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';
import { formatDate, getErrorMessage } from '@/lib/utils/format';
import { User, Wallet, TrendingUp, TrendingDown, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils/format';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [history, setHistory] = useState<PointsHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [tab, setTab] = useState<'profile' | 'points' | 'password'>('profile');

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone || '' });
  }, [user]);

  useEffect(() => {
    rewardsAPI.getHistory({ limit: 20 })
      .then((res) => setHistory(res.data.data.history))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.data);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Password baru tidak cocok');
      return;
    }
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password berhasil diubah!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  const TABS = [
    { key: 'profile', label: '👤 Profil' },
    { key: 'points', label: '🎁 Reward Points' },
    { key: 'password', label: '🔒 Password' },
  ] as const;

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="p-6 mb-6 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: '#ea5234' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">{user?.name}</h1>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Wallet className="w-4 h-4" style={{ color: '#ea5234' }} />
              <span className="font-semibold text-sm" style={{ color: '#ea5234' }}>{user?.rewardPoints ?? 0} Reward Points</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#ea5234]/10 border border-[#ea5234]/20 rounded-xl p-1 mb-6 backdrop-blur-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                tab === t.key ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-[#ea5234]/20'
              )}
              style={tab === t.key ? { background: '#ea5234' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="p-6 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: '#ea5234' }} /> Edit Profil
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Nama Lengkap</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Email</label>
                <input 
                  value={user?.email || ''} 
                  disabled 
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 opacity-50 cursor-not-allowed"
                />
                <p className="text-slate-500 text-xs mt-1">Email tidak dapat diubah</p>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">No. HP</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 hover:gap-3 disabled:opacity-50"
                style={{ background: '#ea5234', color: 'white' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        )}

        {/* Points tab */}
        {tab === 'points' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Reward Points</p>
                <p className="text-white font-black text-4xl mt-1" style={{ color: '#ea5234' }}>{user?.rewardPoints ?? 0}</p>
                <p className="text-slate-500 text-xs mt-1">1 point = Rp 1 diskon</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: '#ea523420', border: '1px solid rgba(234, 82, 52, 0.3)' }}>
                <span className="text-3xl">🎁</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
              <h3 className="text-white font-semibold mb-4">Riwayat Poin</h3>
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#ea5234' }} />
                </div>
              ) : history.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Belum ada riwayat poin</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0"
                      style={{ borderBottom: '1px solid rgba(234, 82, 52, 0.1)' }}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center',
                          item.type === 'earn' ? 'bg-green-500/10' : 'bg-red-500/10'
                        )}>
                          {item.type === 'earn'
                            ? <TrendingUp className="w-4 h-4 text-green-400" />
                            : <TrendingDown className="w-4 h-4 text-red-400" />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{item.description}</p>
                          <p className="text-slate-500 text-xs">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <span className={cn('font-bold', item.type === 'earn' ? 'text-green-400' : 'text-red-400')}>
                        {item.type === 'earn' ? '+' : '-'}{item.amount} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <div className="p-6 rounded-2xl bg-[#ea5234]/10 border border-[#ea5234]/20 backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-5">🔒 Ganti Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Password Saat Ini</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Password Baru</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Min. 6 karakter"
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#ea5234]/5 border border-[#ea5234]/20 text-white placeholder-slate-500 focus:outline-none focus:border-[#ea5234] transition-all"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={savingPw} 
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 hover:gap-3 disabled:opacity-50"
                style={{ background: '#ea5234', color: 'white' }}
              >
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingPw ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}