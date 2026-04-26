
//ADMIN PAGE: Price Sync
'use client';

/**
 * Admin Price Sync Page v2
 *
 * Flow:
 *  1. Ambil semua voucher DB + semua produk Digiflazz
 *  2. Tampilkan perbandingan: harga DB vs harga Digiflazz real-time
 *  3. Admin bisa edit margin per baris
 *  4. Centang/pilih voucher yang mau di-sync
 *  5. Preview perubahan (dry run) sebelum simpan
 *  6. Terapkan sync
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, Table, Button, InputNumber, Switch, Tag, Row, Col,
  Alert, Typography, Select, Input, Tooltip, Space, Badge,
  Statistic, Progress, Modal, Checkbox,
} from 'antd';
import {
  SyncOutlined, SearchOutlined, CheckCircleOutlined,
  WarningOutlined, DollarOutlined, FilterOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  ExclamationCircleOutlined, EditOutlined, SaveOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { priceSyncAPI } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

interface MatchedVoucher {
  _id: string;
  name: string;
  gameName: string;
  gameSlug: string;
  category: string;
  productType: string;
  providerCode: string;
  currentPrice: number;
  digiflazzPriceStored: number;
  marginPercent: number;
  actualMarginPercent: string | null;
  priceAutoSync: boolean;
  priceLastSyncedAt: string | null;
  digiFound: boolean;
  digiName: string | null;
  digiPrice: number | null;
  digiStock: number;
  digiBuyerActive: boolean;
  priceDiff: number | null;
  projectedPrice: number | null;
  needsUpdate: boolean;
}

interface DigiOnly {
  digiName: string;
  sku: string;
  digiPrice: number;
  category: string;
  brand: string;
  buyerActive: boolean;
}

interface ComparisonData {
  matched: MatchedVoucher[];
  unmatched: MatchedVoucher[];
  digiOnly: DigiOnly[];
  summary: {
    dbTotal: number;
    digiTotal: number;
    matchedCount: number;
    unmatchedCount: number;
    digiOnlyCount: number;
    needsUpdateCount: number;
    totalPotentialLoss: number;
  };
}

const cs = {
  background: 'oklch(0.27 0.01 17.95)',
  border: '1px solid oklch(0.32 0.02 34.90)',
  borderRadius: 16,
};

function PriceDiffTag({ diff }: { diff: number | null }) {
  if (diff === null) return <span style={{ color: 'oklch(0.50 0.01 17.53)' }}>—</span>;
  if (diff === 0)    return <Tag color="default" icon={<MinusOutlined />}>Sama</Tag>;
  if (diff > 0)      return <Tag color="error"   icon={<ArrowUpOutlined />}>+{formatCurrency(diff)}</Tag>;
  return <Tag color="success" icon={<ArrowDownOutlined />}>{formatCurrency(diff)}</Tag>;
}

export default function PriceSyncPageV2() {
  const [data,          setData]          = useState<ComparisonData | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [syncing,       setSyncing]       = useState(false);
  const [selectedIds,   setSelectedIds]   = useState<string[]>([]);
  const [marginEdits,   setMarginEdits]   = useState<Record<string, number>>({});
  const [defaultMargin, setDefaultMargin] = useState(15);
  const [dryRun,        setDryRun]        = useState(true);
  const [syncResult,    setSyncResult]    = useState<Record<string, unknown> | null>(null);
  const [filterStatus,  setFilterStatus]  = useState<'all' | 'needs_update' | 'matched' | 'unmatched'>('all');
  const [search,        setSearch]        = useState('');
  const [activeTab,     setActiveTab]     = useState<'matched' | 'unmatched' | 'digi_only'>('matched');

  const loadData = useCallback(async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      const res = await priceSyncAPI.getComparison();
      setData(res.data.data);
      setSelectedIds([]);
      setMarginEdits({});
      toast.success('Data berhasil dimuat');
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Apply margin edit
  const setMargin = (id: string, value: number) => {
    setMarginEdits(prev => ({ ...prev, [id]: value }));
  };

  // Get effective margin for a voucher
  const getEffectiveMargin = (v: MatchedVoucher) =>
    marginEdits[v._id] !== undefined ? marginEdits[v._id] : v.marginPercent;

  // Get projected price with current margin edit
  const getProjectedPrice = (v: MatchedVoucher) => {
    if (!v.digiPrice) return null;
    const m = getEffectiveMargin(v);
    return Math.ceil(v.digiPrice * (1 + m / 100) / 100) * 100;
  };

  // Select/deselect all visible
  const filteredMatched = (data?.matched || []).filter(v => {
    if (filterStatus === 'needs_update') return v.needsUpdate || !!marginEdits[v._id];
    return true;
  }).filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q)
      || v.gameName.toLowerCase().includes(q)
      || v.providerCode.toLowerCase().includes(q)
      || (v.digiName || '').toLowerCase().includes(q);
  });

  const allSelected = filteredMatched.length > 0 && filteredMatched.every(v => selectedIds.includes(v._id));
  const toggleAll   = () => setSelectedIds(allSelected ? [] : filteredMatched.map(v => v._id));

  // Apply sync
  const handleSync = async () => {
    if (selectedIds.length === 0 && dryRun === false) {
      toast.error('Pilih minimal 1 voucher');
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await priceSyncAPI.applySync({
        voucherIds:      selectedIds.length > 0 ? selectedIds : [],
        marginOverrides: marginEdits,
        defaultMargin,
        dryRun,
      });
      setSyncResult(res.data.data);
      const r = res.data.data as { synced: number; dryRun: boolean };
      if (!dryRun) {
        toast.success(`✅ ${r.synced} voucher diperbarui!`);
        loadData();
      } else {
        toast.success(`🔍 Preview: ${r.synced} voucher akan berubah`);
      }
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Sync gagal');
    } finally {
      setSyncing(false);
    }
  };

  // Save margin changes only (without price sync)
  const handleSaveMargins = async () => {
    const updates = Object.entries(marginEdits).map(([_id, marginPercent]) => ({
      _id, marginPercent: Number(marginPercent),
    }));
    if (updates.length === 0) { toast.error('Tidak ada perubahan margin'); return; }
    try {
      await priceSyncAPI.updateMargins(updates);
      toast.success(`${updates.length} margin disimpan`);
      setMarginEdits({});
      loadData();
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || 'Gagal');
    }
  };

  const summary = data?.summary;
  const changesCount = Object.keys(marginEdits).length;

  // ── Table columns for matched vouchers ──────────────────────
  const matchedCols = [
    {
      title: <Checkbox checked={allSelected} onChange={toggleAll} />,
      key: 'sel', width: 40,
      render: (_: unknown, v: MatchedVoucher) => (
        <Checkbox
          checked={selectedIds.includes(v._id)}
          onChange={() => setSelectedIds(prev =>
            prev.includes(v._id) ? prev.filter(id => id !== v._id) : [...prev, v._id]
          )}
        />
      ),
    },
    {
      title: 'Voucher (Website)',
      key: 'voucher', width: 220,
      render: (_: unknown, v: MatchedVoucher) => (
        <div>
          <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{v.name}</div>
          <div style={{ color: 'oklch(0.60 0.01 17.53)', fontSize: 11 }}>{v.gameName}</div>
          <code style={{ color: '#a78bfa', fontSize: 11 }}>{v.providerCode}</code>
        </div>
      ),
    },
    {
      title: 'Nama di Digiflazz',
      key: 'diginame', width: 200,
      render: (_: unknown, v: MatchedVoucher) => (
        <div style={{ color: 'oklch(0.70 0.01 17.53)', fontSize: 12 }}>
          {v.digiName || '—'}
          {v.digiName && v.digiName !== v.name && (
            <Tooltip title="Nama berbeda dengan website, tapi SKU sama — normal">
              <Tag color="warning" style={{ marginLeft: 4, fontSize: 10 }}>≠ nama</Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Harga Digiflazz',
      key: 'digiprice', width: 130,
      render: (_: unknown, v: MatchedVoucher) => (
        <div>
          <div style={{ color: '#60a5fa', fontWeight: 800, fontSize: 14 }}>
            {v.digiPrice !== null ? formatCurrency(v.digiPrice) : '—'}
          </div>
          <div style={{ color: 'oklch(0.50 0.01 17.53)', fontSize: 11 }}>
            {v.digiBuyerActive
              ? <span style={{ color: '#4ade80' }}>● Aktif</span>
              : <span style={{ color: '#f87171' }}>● Nonaktif</span>}
            {' · '}
            {v.digiStock === -1 ? '∞' : v.digiStock}
          </div>
        </div>
      ),
    },
    {
      title: 'Margin %',
      key: 'margin', width: 130,
      render: (_: unknown, v: MatchedVoucher) => {
        const effective = getEffectiveMargin(v);
        const edited    = marginEdits[v._id] !== undefined;
        return (
          <div className="flex items-center gap-1">
            <InputNumber
              value={effective}
              onChange={val => val !== null && setMargin(v._id, val)}
              min={0} max={200} size="small"
              style={{ width: 75, fontWeight: 700, borderColor: edited ? '#fbbf24' : undefined }}
              formatter={val => `${val}%`}
              parser={val => Number(String(val).replace('%', ''))}
            />
            {edited && <Tag color="warning" style={{ fontSize: 10, padding: '0 4px' }}>•</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Harga Saat Ini',
      key: 'current', width: 130,
      render: (_: unknown, v: MatchedVoucher) => (
        <div>
          <div style={{ color: 'oklch(0.90 0 0)', fontWeight: 700 }}>{formatCurrency(v.currentPrice)}</div>
          {v.actualMarginPercent && (
            <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 11 }}>
              margin aktual: {v.actualMarginPercent}%
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Harga Proyeksi',
      key: 'projected', width: 140,
      render: (_: unknown, v: MatchedVoucher) => {
        const proj    = getProjectedPrice(v);
        const diff    = proj !== null ? proj - v.currentPrice : null;
        const changed = proj !== null && proj !== v.currentPrice;
        return (
          <div>
            <div style={{ color: changed ? '#fbbf24' : '#4ade80', fontWeight: 800, fontSize: 14 }}>
              {proj !== null ? formatCurrency(proj) : '—'}
            </div>
            {diff !== null && diff !== 0 && (
              <div style={{ color: diff > 0 ? '#f87171' : '#4ade80', fontSize: 11, fontWeight: 600 }}>
                {diff > 0 ? '+' : ''}{formatCurrency(diff)} ({((diff / v.currentPrice) * 100).toFixed(1)}%)
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status Sync',
      key: 'syncstatus', width: 100,
      render: (_: unknown, v: MatchedVoucher) => {
        const proj    = getProjectedPrice(v);
        const changed = proj !== null && proj !== v.currentPrice;
        const edited  = marginEdits[v._id] !== undefined;
        return (
          <Space direction="vertical" size={2}>
            {v.priceAutoSync
              ? <Tag color="blue" style={{ fontSize: 10 }}>Auto</Tag>
              : <Tag color="default" style={{ fontSize: 10 }}>Manual</Tag>}
            {changed || edited
              ? <Tag color="warning" style={{ fontSize: 10 }}>Perlu Update</Tag>
              : <Tag color="success" style={{ fontSize: 10 }}>✓ Terkini</Tag>}
          </Space>
        );
      },
    },
  ];

  // ── Unmatched columns ────────────────────────────────────────
  const unmatchedCols = [
    { title: 'Voucher di DB', key: 'v', render: (_: unknown, v: MatchedVoucher) => (
      <div>
        <div style={{ color: 'white', fontWeight: 700 }}>{v.name}</div>
        <div style={{ color: 'oklch(0.60 0.01 17.53)', fontSize: 12 }}>{v.gameName}</div>
        <code style={{ color: '#f87171', fontSize: 11 }}>{v.providerCode}</code>
      </div>
    )},
    { title: 'Harga DB', dataIndex: 'currentPrice', key: 'price', render: (v: number) => <span style={{ color: 'oklch(0.90 0 0)' }}>{formatCurrency(v)}</span> },
    { title: 'Masalah', key: 'issue', render: () => (
      <Tag color="error" icon={<WarningOutlined />}>SKU tidak ada di Digiflazz</Tag>
    )},
    { title: 'Saran', key: 'fix', render: (_: unknown, v: MatchedVoucher) => (
      <div style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12 }}>
        Cek SKU <code style={{ color: '#fbbf24' }}>{v.providerCode}</code> di tab Produk Digiflazz
      </div>
    )},
  ];

  // ── DigiOnly columns ─────────────────────────────────────────
  const digiOnlyCols = [
    { title: 'Nama di Digiflazz', dataIndex: 'digiName', key: 'name', render: (v: string) => <span style={{ color: 'white', fontWeight: 600 }}>{v}</span> },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (v: string) => <code style={{ color: '#a78bfa', fontSize: 12 }}>{v}</code> },
    { title: 'Kategori', dataIndex: 'category', key: 'cat', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Harga Digi', dataIndex: 'digiPrice', key: 'price', render: (v: number) => <span style={{ color: '#60a5fa', fontWeight: 700 }}>{formatCurrency(v)}</span> },
    { title: 'Status', dataIndex: 'buyerActive', key: 'status', render: (v: boolean) => <Tag color={v ? 'success' : 'error'}>{v ? 'Aktif' : 'Nonaktif'}</Tag> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ color: 'white', marginBottom: 4, fontWeight: 900 }}>
            ⚡ Sinkronisasi Harga Digiflazz
          </Title>
          <Text style={{ color: 'oklch(0.55 0.01 17.53)' }}>
            Perbandingan harga real-time DB vs Digiflazz · Match via SKU code (bukan nama produk)
          </Text>
        </div>
        <Button type="primary" icon={<SyncOutlined spin={loading} />}
          loading={loading} onClick={loadData}
          style={{ fontWeight: 700, borderRadius: 12, height: 42 }}>
          {loading ? 'Memuat...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Info box */}
      <Alert type="info" showIcon={false} style={{ borderRadius: 14 }}
        message={
          <div style={{ fontSize: 13 }}>
            💡 <strong>Nama produk di website boleh berbeda</strong> dengan nama di Digiflazz.
            Yang penting adalah <code style={{ color: '#fbbf24' }}>SKU Code (providerCode)</code> harus sama persis.
            Jika ada voucher yang tidak match, periksa SKU-nya di tab "Tidak Match".
          </div>
        }
      />

      {/* Summary stats */}
      {summary && (
        <Row gutter={[12, 12]}>
          {[
            { title: 'Voucher di DB',      value: summary.dbTotal,          color: '#f0c060', suffix: 'voucher' },
            { title: 'Produk Digiflazz',   value: summary.digiTotal,        color: '#60a5fa', suffix: 'produk' },
            { title: '✅ Match (SKU sama)', value: summary.matchedCount,     color: '#4ade80', suffix: 'cocok' },
            { title: '⚠️ Tidak Match',     value: summary.unmatchedCount,   color: '#f87171', suffix: 'tidak cocok' },
            { title: '🔄 Perlu Update',    value: summary.needsUpdateCount,  color: '#fbbf24', suffix: 'voucher' },
          ].map(({ title, value, color, suffix }) => (
            <Col key={title} xs={12} sm={8} lg={24 / 5}>
              <Card style={cs} bodyStyle={{ padding: '14px 16px' }}>
                <div style={{ color, fontWeight: 900, fontSize: 26, lineHeight: 1 }}>{value}</div>
                <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12, marginTop: 4 }}>{title}</div>
                <div style={{ color: 'oklch(0.40 0.01 17.53)', fontSize: 11 }}>{suffix}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Potential loss warning */}
      {summary && summary.totalPotentialLoss > 0 && (
        <Alert type="warning" showIcon={false}
          style={{ borderRadius: 14, background: 'oklch(0.65 0.15 30 / 0.10)', borderColor: 'oklch(0.65 0.15 30 / 0.25)' }}
          message={
            <div className="flex items-center gap-3">
              <ExclamationCircleOutlined style={{ color: '#f87171', fontSize: 20 }} />
              <div>
                <div style={{ color: '#f87171', fontWeight: 800 }}>
                  Potensi Kerugian: {formatCurrency(summary.totalPotentialLoss)}
                </div>
                <div style={{ color: 'oklch(0.70 0.05 30)', fontSize: 13 }}>
                  Ada voucher yang harga jualnya lebih rendah dari proyeksi harga Digiflazz + margin.
                  Lakukan sync untuk menyesuaikan.
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'matched' as const,   label: `✅ Cocok (${data?.summary.matchedCount ?? 0})` },
          { key: 'unmatched' as const, label: `⚠️ Tidak Match (${data?.summary.unmatchedCount ?? 0})` },
          { key: 'digi_only' as const, label: `📋 Hanya di Digiflazz (${data?.summary.digiOnlyCount ?? 0})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={activeTab === tab.key
              ? { background: 'oklch(0.92 0.06 67.02)', color: 'oklch(0.16 0.01 17.53)' }
              : { background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.35 0.02 34.90)', color: 'oklch(0.75 0 0)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: MATCHED ────────────────────────────────────────── */}
      {activeTab === 'matched' && (
        <>
          {/* Toolbar */}
          <Card style={cs}>
            <div className="flex flex-wrap items-end gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-52">
                <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.01 17.53)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama, game, atau SKU..." className="input-field"
                  style={{ paddingLeft: 36, height: 40 }} />
              </div>

              {/* Filter status */}
              <Select value={filterStatus} onChange={setFilterStatus} size="large" style={{ width: 180 }}>
                <Select.Option value="all">Semua Voucher</Select.Option>
                <Select.Option value="needs_update">Perlu Update Saja</Select.Option>
              </Select>

              {/* Default margin */}
              <div>
                <div style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>DEFAULT MARGIN</div>
                <InputNumber value={defaultMargin} onChange={v => setDefaultMargin(v || 15)}
                  min={0} max={200} size="large" style={{ width: 100 }}
                  formatter={v => `${v}%`} parser={v => Number(String(v).replace('%', ''))} />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {changesCount > 0 && (
                  <Button icon={<SaveOutlined />} onClick={handleSaveMargins}
                    style={{ fontWeight: 700, borderRadius: 10, height: 40, borderColor: '#fbbf24', color: '#fbbf24' }}>
                    Simpan {changesCount} Margin
                  </Button>
                )}

                <div>
                  <Switch checked={dryRun} onChange={setDryRun} checkedChildren="🔍 Preview" unCheckedChildren="⚡ Real" />
                </div>

                <Button type="primary" loading={syncing}
                  icon={<SyncOutlined />} onClick={handleSync}
                  disabled={selectedIds.length === 0}
                  style={{ fontWeight: 700, borderRadius: 10, height: 40, minWidth: 160 }}>
                  {syncing ? 'Sinkronisasi...'
                    : dryRun ? `🔍 Preview ${selectedIds.length} Item`
                    : `⚡ Sync ${selectedIds.length} Item`}
                </Button>
              </div>
            </div>

            {/* Selection info */}
            {selectedIds.length > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <Tag color="blue">{selectedIds.length} dipilih</Tag>
                <button onClick={() => setSelectedIds([])}
                  style={{ color: 'oklch(0.65 0.15 30)', fontSize: 12, fontWeight: 600 }}>
                  Batalkan Semua
                </button>
                <button onClick={() => setSelectedIds(filteredMatched.filter(v => v.needsUpdate).map(v => v._id))}
                  style={{ color: 'oklch(0.92 0.06 67.02)', fontSize: 12, fontWeight: 600 }}>
                  Pilih Yang Perlu Update
                </button>
              </div>
            )}

            {dryRun && (
              <Alert type="warning" showIcon={false} style={{ marginTop: 12, borderRadius: 10, padding: '6px 12px' }}
                message={<span style={{ fontSize: 12 }}>🔍 Mode Preview aktif — perubahan TIDAK akan disimpan ke database</span>} />
            )}
          </Card>

          {/* Main table */}
          <Card style={cs} bodyStyle={{ padding: 0 }}>
            <Table
              dataSource={filteredMatched}
              columns={matchedCols}
              rowKey="_id"
              loading={loading}
              size="small"
              scroll={{ x: 1100 }}
              pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `${t} voucher` }}
              rowClassName={(v: MatchedVoucher) => {
                const proj = getProjectedPrice(v);
                if (proj !== null && proj < v.currentPrice) return 'ant-table-row-danger';
                if (v.needsUpdate || !!marginEdits[v._id])  return 'ant-table-row-warning';
                return '';
              }}
            />
          </Card>

          {/* Sync result */}
          <AnimatePresence>
            {syncResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card style={{ ...cs, border: '1px solid oklch(0.92 0.06 67.02 / 0.3)' }}
                  title={
                    <span style={{ color: 'white', fontWeight: 800 }}>
                      {(syncResult as { dryRun: boolean }).dryRun ? '🔍 Preview Hasil' : '✅ Hasil Sync'}
                      {' — '}
                      {(syncResult as { synced: number }).synced} diperbarui ·
                      {' '}{(syncResult as { unchanged: number }).unchanged} sama ·
                      {' '}{(syncResult as { errors: number }).errors} error ·
                      {' '}{(syncResult as { duration: string }).duration}s
                    </span>
                  }>
                  {(syncResult as { changes?: unknown[] }).changes && (syncResult as { changes: unknown[] }).changes.length > 0 ? (
                    <Table
                      dataSource={(syncResult as { changes: Record<string,unknown>[] }).changes}
                      rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ x: 700 }}
                      columns={[
                        { title: 'Produk', key: 'p', render: (_: unknown, r: Record<string,unknown>) => (
                          <div>
                            <div style={{ color: 'white', fontWeight: 700 }}>{String(r.name)}</div>
                            <code style={{ color: '#a78bfa', fontSize: 11 }}>{String(r.providerCode)}</code>
                          </div>
                        )},
                        { title: 'Nama Digiflazz', dataIndex: 'digiName', key: 'dn', render: (v: string) => <span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12 }}>{v}</span> },
                        { title: 'Harga Digi', dataIndex: 'digiPrice', key: 'dp', render: (v: number) => <span style={{ color: '#60a5fa' }}>{formatCurrency(v)}</span> },
                        { title: 'Margin', dataIndex: 'margin', key: 'm', render: (v: number) => <Tag color="blue">+{v}%</Tag> },
                        { title: 'Lama', dataIndex: 'oldPrice', key: 'o', render: (v: number) => <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{formatCurrency(v)}</span> },
                        { title: 'Baru', dataIndex: 'newPrice', key: 'n', render: (v: number) => <span style={{ color: '#f0c060', fontWeight: 800 }}>{formatCurrency(v)}</span> },
                        { title: 'Selisih', key: 'c', render: (_: unknown, r: Record<string,unknown>) => (
                          <span style={{ color: Number(r.change) >= 0 ? '#f87171' : '#4ade80', fontWeight: 700 }}>
                            {Number(r.change) >= 0 ? '+' : ''}{formatCurrency(Number(r.change))} ({String(r.changePct)}%)
                          </span>
                        )},
                      ]}
                    />
                  ) : (
                    <div className="text-center py-6" style={{ color: 'oklch(0.55 0.01 17.53)' }}>
                      Semua harga sudah sesuai, tidak ada perubahan
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── TAB: UNMATCHED ──────────────────────────────────────── */}
      {activeTab === 'unmatched' && (
        <Card style={cs} bodyStyle={{ padding: 0 }}
          title={
            <div>
              <span style={{ color: 'white', fontWeight: 800 }}>⚠️ Voucher Tidak Match dengan Digiflazz</span>
              <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                Produk ini ada di database kamu, tapi SKU code-nya tidak ditemukan di Digiflazz.
                Solusi: periksa <code>providerCode</code> dan sesuaikan dengan <code>buyer_sku_code</code> dari Digiflazz.
              </div>
            </div>
          }>
          <Table
            dataSource={data?.unmatched || []}
            columns={unmatchedCols}
            rowKey="_id"
            loading={loading}
            size="small"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 600 }}
          />
        </Card>
      )}

      {/* ── TAB: DIGI ONLY ──────────────────────────────────────── */}
      {activeTab === 'digi_only' && (
        <Card style={cs} bodyStyle={{ padding: 0 }}
          title={
            <div>
              <span style={{ color: 'white', fontWeight: 800 }}>📋 Produk Digiflazz yang Belum Ada di Website</span>
              <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12, fontWeight: 400, marginTop: 4 }}>
                Produk ini tersedia di Digiflazz tapi belum kamu tambahkan ke website.
                Copy SKU code untuk membuat voucher baru di menu Games & Vouchers.
              </div>
            </div>
          }>
          <Table
            dataSource={data?.digiOnly.filter(p => {
              if (!search) return true;
              const q = search.toLowerCase();
              return p.digiName.toLowerCase().includes(q)
                || p.sku.toLowerCase().includes(q)
                || p.brand.toLowerCase().includes(q);
            }) || []}
            columns={digiOnlyCols}
            rowKey="sku"
            loading={loading}
            size="small"
            pagination={{ pageSize: 20, showTotal: t => `${t} produk` }}
            scroll={{ x: 600 }}
            title={() => (
              <div className="px-2 py-1">
                <div className="relative" style={{ maxWidth: 300 }}>
                  <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.01 17.53)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Cari produk Digiflazz..." className="input-field"
                    style={{ paddingLeft: 32, height: 36, fontSize: 13 }} />
                </div>
              </div>
            )}
          />
        </Card>
      )}
    </div>
  );
}