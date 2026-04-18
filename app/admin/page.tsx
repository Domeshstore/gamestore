'use client';

import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Skeleton, Typography, Space } from 'antd';
import {
  UserOutlined, ShoppingOutlined, TagsOutlined, DollarOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ThunderboltOutlined, RiseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { adminAPI } from '@/lib/api/client';
import { AdminStats, Transaction } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils/format';

const { Title, Text } = Typography;

// ── Stat card with game-card color ─────────────────────────
function StatCard({ label, value, sub, icon, cardClass, delay = 0 }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; cardClass: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 120 }}
    >
      <div className={`game-card ${cardClass} p-5 h-full`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.25)' }}>
            {icon}
          </div>
          <RiseOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }} />
        </div>
        <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{label}</div>
        <div className="text-white font-black text-3xl leading-tight">{value}</div>
        {sub && <div className="text-white/50 text-xs mt-1">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ── Simple bar chart rendered with CSS ─────────────────────
function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <motion.div key={i}
          className="flex-1 flex flex-col items-center gap-1"
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
          style={{ transformOrigin: 'bottom' }}>
          <span className="text-slate-400 text-[10px] font-bold">{d.value}</span>
          <div className="w-full rounded-t-lg" style={{ height: `${(d.value / max) * 72}px`, background: d.color, minHeight: 4 }} />
          <span className="text-slate-500 text-[9px]">{d.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ── Donut-like progress rings ───────────────────────────────
function StatusRings({ stats }: { stats: AdminStats }) {
  const total = stats.totalTransactions || 1;
  const items = [
    { label: 'Sukses',   value: stats.successTransactions, color: '#34d399', pct: Math.round(stats.successTransactions / total * 100) },
    { label: 'Proses',   value: stats.processing,          color: '#fbbf24', pct: Math.round(stats.processing / total * 100) },
    { label: 'Menunggu', value: stats.waitingPayment,       color: '#f87171', pct: Math.round(stats.waitingPayment / total * 100) },
    { label: 'Gagal',    value: stats.failedTransactions,   color: '#94a3b8', pct: Math.round(stats.failedTransactions / total * 100) },
  ];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.08 }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-300 text-xs font-semibold">{item.label}</span>
            <span className="text-white font-black text-sm">{item.value}</span>
          </div>
          <Progress
            percent={item.pct} showInfo={false} size="small"
            strokeColor={item.color}
            railColor="rgba(255,255,255,0.06)"
          />
        </motion.div>
      ))}
    </div>
  );
}

// ── Recent transactions mini table ─────────────────────────
const txCols = [
  { title: 'Ref', dataIndex: 'refId', key: 'refId',
    render: (v: string) => <code style={{ color: '#a78bfa', fontSize: 11 }}>{v.slice(-10)}</code> },
  { title: 'Game', dataIndex: 'gameName', key: 'game',
    render: (v: string) => <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{v}</span> },
  { title: 'Harga', dataIndex: 'price', key: 'price',
    render: (v: number) => <span style={{ color: '#fbbf24', fontWeight: 700 }}>{formatCurrency(v)}</span> },
  { title: 'Status', dataIndex: 'status', key: 'status',
    render: (v: string) => {
      const colorMap: Record<string, string> = {
        success: 'success', failed: 'error', waiting_payment: 'warning',
        paid: 'processing', processing: 'default',
      };
      return <Tag color={colorMap[v] ?? 'default'} style={{ borderRadius: 99, fontWeight: 700, fontSize: 11 }}>
        {getStatusLabel(v)}
      </Tag>;
    }
  },
];

// ── Weekly chart data (mock — in production pull from backend) ─
const WEEK_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const mockWeekly = WEEK_LABELS.map((label, i) => ({
  label,
  value: Math.floor(Math.random() * 30) + 5,
  color: i === 5 || i === 6 ? '#7c3aed' : '#4f46e5',
}));

// ── Category distribution ─────────────────────────────────
const mockCategories = [
  { label: 'Mobile',    value: 45, color: '#7c3aed' },
  { label: 'Streaming', value: 25, color: '#0ea5e9' },
  { label: 'PC',        value: 15, color: '#34d399' },
  { label: 'Pulsa',     value: 10, color: '#fbbf24' },
  { label: 'Lainnya',   value: 5,  color: '#f87171' },
];

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<AdminStats | null>(null);
  const [recent,  setRecent]  = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      adminAPI.getAllTransactions({ limit: 8 }),
    ]).then(([sRes, tRes]) => {
      setStats(sRes.data.data);
      setRecent(tRes.data.transactions ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        {[...Array(4)].map((_, i) => (
          <Col key={i} xs={24} sm={12} lg={6}>
            <Skeleton.Button active block style={{ height: 120, borderRadius: 20 }} />
          </Col>
        ))}
      </Row>
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  if (!stats) return null;

  const urgent = stats.waitingPayment + stats.paid;

  return (
    <div className="space-y-6">

      {/* ── Page title ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Title level={2} style={{ color: 'white', marginBottom: 4, fontWeight: 900 }}>Dashboard</Title>
        <Text style={{ color: '#64748b' }}>Selamat datang di panel admin GameVoucher 🎮</Text>
      </motion.div>

      {/* ── Urgent alert ── */}
      {urgent > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}>
          <Link href="/admin/transactions">
            <div className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.12),rgba(180,83,9,0.06))', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(251,191,36,0.2)' }}>
                <ExclamationCircleOutlined style={{ color: '#fbbf24', fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <div className="text-yellow-300 font-black text-base">{urgent} pesanan butuh tindakan segera!</div>
                <div className="text-yellow-600 text-sm">{stats.waitingPayment} menunggu konfirmasi · {stats.paid} siap diproses via Digiflazz</div>
              </div>
              <ThunderboltOutlined style={{ color: '#fbbf24', fontSize: 20 }} />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Stat cards (bold colored like reference image) ── */}
      <Row gutter={[16, 16]}>
        {[
          { label:'Total Users',     value: stats.totalUsers.toLocaleString(),    sub: 'pengguna terdaftar', icon: <UserOutlined style={{ color:'white', fontSize:20 }} />,       cardClass:'card-sky',    delay:0    },
          { label:'Total Games',     value: stats.totalGames.toLocaleString(),    sub: 'game aktif',        icon: <ShoppingOutlined style={{ color:'white', fontSize:20 }} />,    cardClass:'card-lime',   delay:0.05 },
          { label:'Total Vouchers',  value: stats.totalVouchers.toLocaleString(), sub: 'voucher tersedia',  icon: <TagsOutlined style={{ color:'white', fontSize:20 }} />,        cardClass:'card-amber',  delay:0.10 },
          { label:'Total Revenue',   value: formatCurrency(stats.totalRevenue),   sub: 'dari transaksi sukses', icon: <DollarOutlined style={{ color:'white', fontSize:20 }} />, cardClass:'card-purple', delay:0.15 },
        ].map(item => (
          <Col key={item.label} xs={24} sm={12} lg={6}>
            <StatCard {...item} />
          </Col>
        ))}
      </Row>

      {/* ── Row 2: Charts + Status ── */}
      <Row gutter={[16, 16]}>
        {/* Weekly transactions bar */}
        <Col xs={24} lg={12}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
            <Card
              title={<span style={{ color:'white', fontWeight:800 }}>📊 Transaksi Minggu Ini</span>}
              extra={<span style={{ color:'#7c3aed', fontWeight:700, fontSize:12 }}>7 hari terakhir</span>}
              style={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20 }}
            >
              <MiniBarChart data={mockWeekly} />
              <Row gutter={12} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <div className="p-3 rounded-xl text-center" style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.15)' }}>
                    <div className="text-purple-400 text-xl font-black">{stats.successTransactions}</div>
                    <div className="text-slate-400 text-xs font-semibold">Sukses</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-3 rounded-xl text-center" style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.15)' }}>
                    <div className="text-red-400 text-xl font-black">{stats.failedTransactions}</div>
                    <div className="text-slate-400 text-xs font-semibold">Gagal</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>

        {/* Category distribution */}
        <Col xs={24} sm={12} lg={6}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
            <Card
              title={<span style={{ color:'white', fontWeight:800 }}>🎮 Kategori</span>}
              style={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, height:'100%' }}
            >
              <div className="space-y-2.5">
                {mockCategories.map((c, i) => (
                  <motion.div key={i}
                    initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:0.35 + i * 0.06 }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-slate-300 text-xs font-semibold">{c.label}</span>
                      </div>
                      <span className="text-white text-xs font-black">{c.value}%</span>
                    </div>
                    <Progress percent={c.value} showInfo={false} size="small"
                      strokeColor={c.color} railColor="rgba(255,255,255,0.05)" />
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </Col>

        {/* Status rings */}
        <Col xs={24} sm={12} lg={6}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
            <Card
              title={<span style={{ color:'white', fontWeight:800 }}>⚡ Status Transaksi</span>}
              style={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, height:'100%' }}
            >
              <StatusRings stats={stats} />
              <div className="mt-4 pt-3 text-center" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-white font-black text-2xl">{stats.totalTransactions}</div>
                <div className="text-slate-400 text-xs font-semibold">Total Transaksi</div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* ── Row 3: Recent + Quick Actions ── */}
      <Row gutter={[16, 16]}>
        {/* Recent transactions */}
        <Col xs={24} lg={16}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
            <Card
              title={<span style={{ color:'white', fontWeight:800 }}>📋 Transaksi Terbaru</span>}
              extra={<Link href="/admin/transactions" style={{ color:'#7c3aed', fontWeight:700, fontSize:12 }}>Lihat semua →</Link>}
              style={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20 }}
            >
              <Table
                dataSource={recent}
                columns={txCols}
                rowKey="_id"
                size="small"
                pagination={false}
                style={{ background:'transparent' }}
              />
            </Card>
          </motion.div>
        </Col>

        {/* Quick actions */}
        <Col xs={24} lg={8}>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}>
            <Card
              title={<span style={{ color:'white', fontWeight:800 }}>⚡ Aksi Cepat</span>}
              style={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20 }}
            >
              <div className="space-y-3">
                {[
                  { href:'/admin/transactions?status=paid',    label:'🔥 Proses Pesanan Berbayar',   cardClass:'card-coral',   desc:`${stats.paid} siap diproses` },
                  { href:'/admin/digiflazz',                   label:'⚡ Panel Digiflazz',           cardClass:'card-purple', desc:'Cek saldo & transaksi' },
                  { href:'/admin/games',                       label:'🎮 Tambah Game Baru',           cardClass:'card-lime',   desc:'Kelola katalog game' },
                  { href:'/admin/settings',                    label:'📱 Setup QRIS & Bank',          cardClass:'card-amber',  desc:'Konfigurasi pembayaran' },
                ].map(({ href, label, cardClass, desc }) => (
                  <motion.div key={href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href={href}>
                      <div className={`game-card ${cardClass} p-3.5`}>
                        <div className="text-white font-black text-sm">{label}</div>
                        <div className="text-white/60 text-xs mt-0.5">{desc}</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

    </div>
  );
}
