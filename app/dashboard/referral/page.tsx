'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { referralAPI } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import AuthGuard from '@/components/auth/AuthGuard';
import { ShareAltOutlined, UsergroupAddOutlined, TrophyTwoTone } from '@ant-design/icons';
import { Copy, Share2, Users, Gift, Clock, CheckCircle, TrendingUp, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const ss = { 
  background: '#2a2a2a', 
  border: '1px solid rgba(234, 82, 52, 0.25)', 
  borderRadius: 20 
};

interface ReferralStats {
  code: string;
  referralLink: string;
  total: number;
  rewarded: number;
  pending: number;
  totalEarned: number;
  rewardPerReferral: number;
}

interface ReferralRecord {
  _id: string;
  status: 'pending' | 'rewarded' | 'expired';
  referredUserId: { name: string; email: string; createdAt: string };
  referrerReward: number;
  createdAt: string;
  rewardedAt?: string;
}

export default function ReferralPage() {
  const [stats,   setStats]   = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([referralAPI.getMy(), referralAPI.getHistory()])
      .then(([sRes, hRes]) => {
        setStats(sRes.data.data);
        setHistory(hRes.data.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const copy = (text: string, label = 'Disalin!') =>
    navigator.clipboard.writeText(text).then(() => toast.success(label));

  const share = () => {
    if (!stats) return;
    if (navigator.share) {
      navigator.share({ title: 'Domesh Store', text: `Top up game & pulsa murah! Pakai kodeku: ${stats.code} dan dapat bonus Rp 10.000!`, url: stats.referralLink });
    } else {
      copy(stats.referralLink, 'Link referral disalin!');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#ea5234] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen  bg-gradient-to-b from-black to-gray-900" >
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div>
            <h1 style={{ color: '#f8d9b9', fontWeight: 900, fontSize: 28 }}>🎁 Program Referral</h1>
            <p style={{ color: '#b4b4b4', fontSize: 14 }}>Ajak teman dan dapatkan reward points!</p>
          </div>

          {/* ── HOW IT WORKS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 "
          
          >
            {[
              { step: '1', icon: <ShareAltOutlined />, title: 'Bagikan kode', desc: 'Share kode atau link referralmu ke teman' },
              { step: '2', icon: <UsergroupAddOutlined />, title: 'Teman daftar', desc: 'Teman daftar & masukkan kode kamu' },
              { step: '3', icon: <TrophyTwoTone twoToneColor="#ea5234" />, title: 'Dapat reward', desc: 'Keduanya dapat bonus setelah transaksi pertama' },
            ].map(item => (
              <motion.div 
              key={item.step} 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }}
                
              transition={{ delay: Number(item.step) * 0.1 }}
                className="p-4 rounded-2xl text-center " 
                style={{ background: 'rgba(234, 82, 52, 0.08)', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div style={{ color: '#ea5234', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Langkah {item.step}
                </div>
                <div style={{ color: '#f8d9b9', fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                <div style={{ color: '#b4b4b4', fontSize: 13 }}>{item.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* ── REWARDS BOX ── */}
          <div className="p-5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.15), rgba(248, 217, 185, 0.05))', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div style={{ color: '#b4b4b4', fontSize: 12, marginBottom: 4 }}>Kamu dapat (referrer)</div>
                <div style={{ color: '#ea5234', fontWeight: 900, fontSize: 28 }}>+5.000</div>
                <div style={{ color: '#b4b4b4', fontSize: 12 }}>reward points</div>
              </div>
              <div className="text-center">
                <div style={{ color: '#b4b4b4', fontSize: 12, marginBottom: 4 }}>Teman kamu dapat</div>
                <div style={{ color: '#ea5234', fontWeight: 900, fontSize: 28 }}>+10.000</div>
                <div style={{ color: '#b4b4b4', fontSize: 12 }}>reward points</div>
              </div>
            </div>
            <div className="mt-3 pt-3 text-center text-xs" style={{ color: '#b4b4b4', borderTop: '1px solid rgba(234, 82, 52, 0.15)' }}>
              Reward diberikan setelah teman menyelesaikan transaksi pertama ✓
            </div>
          </div>

          {/* ── CODE & LINK ── */}
          {stats && (
            <div className="p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.15), rgba(248, 217, 185, 0.05))', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
              <p style={{ color: '#b4b4b4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Kode Referral Kamu
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 flex items-center justify-center py-4 rounded-2xl"
                  style={{ background: 'rgba(234, 82, 52, 0.08)', border: '2px dashed rgba(234, 82, 52, 0.35)' }}>
                  <span style={{ color: '#ea5234', fontFamily: 'monospace', fontWeight: 900, fontSize: 32, letterSpacing: '0.1em' }}>
                    {stats.code}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => copy(stats.code, 'Kode disalin!')}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(234, 82, 52, 0.12)', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
                    <Copy className="w-5 h-5" style={{ color: '#ea5234' }} />
                  </button>
                  <button onClick={share}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                    <Share2 className="w-5 h-5" style={{ color: '#60a5fa' }} />
                  </button>
                </div>
              </div>

              {/* Referral link */}
              <div className="flex items-center gap-2">
                <input readOnly value={stats.referralLink} 
                  className="flex-1 px-4 py-3 rounded-xl bg-[#242424] border border-[#ea5234]/25 text-white focus:outline-none focus:border-[#ea5234]/50 text-xs"
                  style={{ fontFamily: 'monospace' }} />
                <button onClick={() => copy(stats.referralLink, 'Link disalin!')}
                  className="px-3 py-2.5 rounded-xl font-bold text-sm shrink-0"
                  style={{ background: '#ea5234', color: 'white' }}>
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* ── STATS ── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Users className="w-4 h-4" />, label: 'Total Referral', value: stats.total,    color: '#60a5fa' },
                { icon: <CheckCircle className="w-4 h-4" />, label: 'Berhasil',    value: stats.rewarded,  color: '#4ade80' },
                { icon: <Clock className="w-4 h-4" />, label: 'Menunggu',          value: stats.pending,   color: '#fbbf24' },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Total Earned', value: `${stats.totalEarned.toLocaleString()} pts`, color: '#ea5234' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.15), rgba(248, 217, 185, 0.05))', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
                  <div style={{ color }} className="mb-2">{icon}</div>
                  <div style={{ color: '#f8d9b9', fontWeight: 900, fontSize: 20 }}>{value}</div>
                  <div style={{ color: '#b4b4b4', fontSize: 12 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORY ── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(234, 82, 52, 0.15), rgba(248, 217, 185, 0.05))', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(234, 82, 52, 0.2)' }}>
              <p style={{ color: '#f8d9b9', fontWeight: 800 }}>Riwayat Referral</p>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-10" style={{ color: '#b4b4b4' }}>
                <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Belum ada referral. Share kodemu sekarang!
              </div>
            ) : (
              history.map((r, i) => (
                <div key={r._id} className="flex items-center gap-4 px-4 py-3"
                  style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(234, 82, 52, 0.15)' : 'none' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ea5234, #c13e22)' }}>
                    {r.referredUserId?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: '#f8d9b9', fontWeight: 700 }}>{r.referredUserId?.name ?? 'User'}</div>
                    <div style={{ color: '#b4b4b4', fontSize: 12 }}>
                      Bergabung {new Date(r.referredUserId?.createdAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  <div className="text-right">
                    {r.status === 'rewarded' ? (
                      <div>
                        <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 14 }}>+{r.referrerReward?.toLocaleString()} pts</div>
                        <div className="flex items-center justify-end gap-1 text-xs" style={{ color: '#4ade80' }}>
                          <CheckCircle className="w-3 h-3" /> Rewarded
                        </div>
                      </div>
                    ) : r.status === 'pending' ? (
                      <div>
                        <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 12 }}>Menunggu</div>
                        <div style={{ color: '#b4b4b4', fontSize: 11 }}>Tx pertama</div>
                      </div>
                    ) : (
                      <div style={{ color: '#b4b4b4', fontSize: 12 }}>Expired</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}