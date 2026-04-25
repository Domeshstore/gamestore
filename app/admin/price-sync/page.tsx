
//ADMIN PAGE: Price Sync
// app/admin/price-sync/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Card, Table, Button, InputNumber, Switch, Tag, Row, Col, Alert, Typography, 
  Tabs, Space, Modal, Input, Tooltip, Badge, Progress 
} from 'antd';
import { 
  SyncOutlined, CheckCircleOutlined, WarningOutlined, DollarOutlined, 
  EditOutlined, PlusOutlined, EyeOutlined, ThunderboltOutlined,
  UnorderedListOutlined, AppstoreOutlined, LinkOutlined, DisconnectOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { priceSyncAPI } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

// ============================================================
// TYPE DEFINITIONS
// ============================================================
interface SyncChange { 
  id: string; name: string; gameName: string; providerCode: string;
  digiName: string; oldPrice: number; newPrice: number; 
  digiPrice: number; margin: number; change: number; changePct: string 
}

interface SyncResult { 
  synced: number; unchanged: number; skipped: number; 
  errors: number; duration: string; changes: SyncChange[]; dryRun: boolean 
}

interface SyncStatus { 
  total: number; autoSync: number; synced: number; 
  unsynced: number; lastSyncedAt: string | null 
}

interface MatchedItem {
  _id: string;
  name: string;
  providerCode: string;
  gameName: string;
  currentPrice: number;
  digiflazzPriceStored: number;
  marginPercent: number;
  actualMarginPercent: string | null;
  priceAutoSync: boolean;
  digiName: string;
  digiPrice: number;
  projectedPrice: number | null;
  priceDiff: number | null;
  needsUpdate: boolean;
}

interface UnmatchedItem {
  _id: string;
  name: string;
  providerCode: string;
  gameName: string;
  currentPrice: number;
  digiFound: false;
}

interface DigiOnlyItem {
  sku: string;
  digiName: string;
  digiPrice: number;
  category: string;
  brand: string;
  buyerActive: boolean;
  stock: number;
}

interface ComparisonData {
  matched: MatchedItem[];
  unmatched: UnmatchedItem[];
  digiOnly: DigiOnlyItem[];
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
  borderRadius: 16 
};

export default function PriceSyncPage() {
  // Existing states
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [margin, setMargin] = useState(15);
  const [dryRun, setDryRun] = useState(false);
  
  // NEW states for v2 features
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [selectedTab, setSelectedTab] = useState('sync');
  const [marginModalVisible, setMarginModalVisible] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [editMarginValue, setEditMarginValue] = useState<number>(15);
  const [bulkMarginValue, setBulkMarginValue] = useState<number>(15);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // Fetch data
  useEffect(() => { 
    priceSyncAPI.syncStatus().then(r => setStatus(r.data.data)).catch(() => {}); 
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    setLoadingComparison(true);
    try {
      const res = await priceSyncAPI.getComparison();
      setComparison(res.data.data);
    } catch (err) {
      console.error('Failed to fetch comparison:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true); 
    setResult(null);
    try {
      const res = await priceSyncAPI.syncAll({ margin, dryRun });
      setResult(res.data.data);
      toast.success(dryRun ? `Preview: ${res.data.data.synced} voucher akan berubah` : `✅ ${res.data.data.synced} voucher diperbarui`);
      if (!dryRun) {
        priceSyncAPI.syncStatus().then(r => setStatus(r.data.data)).catch(() => {});
        fetchComparisonData();
      }
    } catch(e: unknown) { 
      toast.error((e as {message?: string}).message || 'Sync gagal'); 
    } finally { 
      setSyncing(false); 
    }
  };

  const handleSyncSelected = async () => {
    if (selectedRowKeys.length === 0) {
      toast.error('Pilih voucher terlebih dahulu');
      return;
    }
    setSyncing(true);
    try {
      const res = await priceSyncAPI.syncSpecific({ voucherIds: selectedRowKeys, margin, dryRun: false });
      toast.success(`✅ ${res.data.data.synced} voucher diperbarui`);
      fetchComparisonData();
      priceSyncAPI.syncStatus().then(r => setStatus(r.data.data)).catch(() => {});
    } catch (err) {
      toast.error('Gagal sync voucher terpilih');
    } finally {
      setSyncing(false);
      setSelectedRowKeys([]);
    }
  };

  const handleUpdateMargin = async () => {
    if (!selectedVoucherId) return;
    try {
      await priceSyncAPI.updateMargin(selectedVoucherId, editMarginValue);
      toast.success('Margin diperbarui');
      setMarginModalVisible(false);
      fetchComparisonData();
    } catch (err) {
      toast.error('Gagal update margin');
    }
  };

  const handleBulkUpdateMargin = async () => {
    if (selectedRowKeys.length === 0) {
      toast.error('Pilih voucher terlebih dahulu');
      return;
    }
    try {
      await priceSyncAPI.bulkUpdateMargins(selectedRowKeys, bulkMarginValue);
      toast.success(`${selectedRowKeys.length} voucher margin diperbarui`);
      fetchComparisonData();
      setSelectedRowKeys([]);
    } catch (err) {
      toast.error('Gagal update margin');
    }
  };

  // Table columns for matched items
  const matchedColumns = [
    { 
      title: 'Produk', 
      key: 'product', 
      width: 250,
      render: (_: unknown, r: MatchedItem) => (
        <div>
          <div style={{ color: 'white', fontWeight: 700 }}>{r.gameName} — {r.name}</div>
          <code style={{ color: '#a78bfa', fontSize: 11 }}>{r.providerCode}</code>
          {r.digiName && <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 10 }}>Digi: {r.digiName}</div>}
        </div>
      )
    },
    { 
      title: 'Harga DB', 
      dataIndex: 'currentPrice', 
      key: 'current', 
      width: 120,
      render: (v: number) => <span style={{ color: '#f0c060', fontWeight: 700 }}>{formatCurrency(v)}</span>
    },
    { 
      title: 'Harga Digi', 
      dataIndex: 'digiPrice', 
      key: 'digi', 
      width: 120,
      render: (v: number) => <span style={{ color: '#60a5fa' }}>{formatCurrency(v)}</span>
    },
    { 
      title: 'Margin Saat Ini', 
      key: 'actualMargin', 
      width: 120,
      render: (_: unknown, r: MatchedItem) => {
        const margin = r.actualMarginPercent;
        const isHealthy = margin && parseFloat(margin) >= 10;
        return (
          <Tag color={isHealthy ? 'success' : 'warning'} style={{ borderRadius: 99 }}>
            {margin ? `${margin}%` : '—'}
          </Tag>
        );
      }
    },
    { 
      title: 'Target Margin', 
      dataIndex: 'marginPercent', 
      key: 'targetMargin', 
      width: 100,
      render: (v: number, r: MatchedItem) => (
        <Space>
          <Tag color="blue">{v}%</Tag>
          <Tooltip title="Edit margin">
            <Button 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => { setSelectedVoucherId(r._id); setEditMarginValue(v); setMarginModalVisible(true); }}
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
        </Space>
      )
    },
    { 
      title: 'Proyeksi', 
      key: 'projected', 
      width: 120,
      render: (_: unknown, r: MatchedItem) => {
        if (!r.projectedPrice) return <span style={{ color: '#94a3b8' }}>—</span>;
        const diff = r.priceDiff || 0;
        return (
          <div>
            <div style={{ color: diff >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
              {formatCurrency(r.projectedPrice)}
            </div>
            {diff !== 0 && (
              <div style={{ fontSize: 11, color: diff >= 0 ? '#4ade80' : '#f87171' }}>
                {diff > 0 ? '+' : ''}{formatCurrency(diff)}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      title: 'Status', 
      key: 'status', 
      width: 100,
      render: (_: unknown, r: MatchedItem) => (
        r.needsUpdate 
          ? <Tag color="warning" icon={<WarningOutlined />}>Perlu Update</Tag>
          : <Tag color="success" icon={<CheckCircleOutlined />}>OK</Tag>
      )
    },
  ];

  // Columns for unmatched items
  const unmatchedColumns = [
    { title: 'Voucher', key: 'name', render: (_: unknown, r: UnmatchedItem) => (
      <div><div style={{ color: 'white', fontWeight: 700 }}>{r.gameName} — {r.name}</div><code style={{ color: '#f87171', fontSize: 11 }}>{r.providerCode}</code></div>
    )},
    { title: 'Harga DB', dataIndex: 'currentPrice', key: 'price', render: (v: number) => formatCurrency(v) },
    { title: 'Status', key: 'status', render: () => <Tag color="error" icon={<DisconnectOutlined />}>Tidak Match di Digiflazz</Tag> },
  ];

  // Columns for DigiOnly items
  const digiOnlyColumns = [
    { title: 'Produk Digiflazz', key: 'digiName', render: (_: unknown, r: DigiOnlyItem) => (
      <div>
        <div style={{ color: 'white', fontWeight: 700 }}>{r.digiName}</div>
        <code style={{ color: '#a78bfa', fontSize: 11 }}>{r.sku}</code>
      </div>
    )},
    { title: 'Kategori', dataIndex: 'category', key: 'cat', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Harga Digi', dataIndex: 'digiPrice', key: 'price', render: (v: number) => formatCurrency(v) },
    { title: 'Status', key: 'status', render: (_: unknown, r: DigiOnlyItem) => (
      r.buyerActive 
        ? <Tag color="success">Aktif</Tag>
        : <Tag color="error">Nonaktif</Tag>
    )},
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };

  const summary = comparison?.summary;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ color: 'white', marginBottom: 4, fontWeight: 900 }}>⚡ Sinkronisasi Harga Digiflazz</Title>
          <Text style={{ color: 'oklch(0.55 0.01 17.53)' }}>Harga jual = Harga Digiflazz + margin%, otomatis setiap 1 jam</Text>
        </div>
        {summary && summary.totalPotentialLoss > 0 && (
          <Badge count={`💰 Rugi potensial ${formatCurrency(summary.totalPotentialLoss)}`} style={{ backgroundColor: '#f87171' }} />
        )}
      </div>

      {/* Status Cards */}
      {status && (
        <Row gutter={[12, 12]}>
          {[
            { title: 'Total Voucher', value: status.total, color: '#f0c060' },
            { title: 'Auto Sync ON', value: status.autoSync, color: '#60a5fa' },
            { title: 'Sudah Sync', value: status.synced, color: '#4ade80' },
            { title: 'Belum Sync', value: status.unsynced, color: '#f87171' },
          ].map(({ title, value, color }) => (
            <Col key={title} xs={12} lg={6}>
              <Card style={cs}>
                <div style={{ color, fontWeight: 900, fontSize: 24 }}>{value}</div>
                <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12 }}>{title}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

// Di bagian summary cards, gunakan fallback values

{summary && (
  <Row gutter={[12, 12]}>
    <Col xs={24} lg={6}>
      <Card style={cs}>
        <div style={{ color: '#f0c060', fontWeight: 900, fontSize: 24 }}>{summary.matchedCount ?? 0}</div>
        <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12 }}>Match dengan Digiflazz</div>
      </Card>
    </Col>
    <Col xs={24} lg={6}>
      <Card style={cs}>
        <div style={{ color: '#f87171', fontWeight: 900, fontSize: 24 }}>{summary.unmatchedCount ?? 0}</div>
        <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12 }}>Tidak Match (SKU tidak ditemukan)</div>
      </Card>
    </Col>
    <Col xs={24} lg={6}>
      <Card style={cs}>
        <div style={{ color: '#60a5fa', fontWeight: 900, fontSize: 24 }}>{summary.digiOnlyCount ?? 0}</div>
        <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12 }}>Produk Digiflazz belum di DB</div>
      </Card>
    </Col>
    <Col xs={24} lg={6}>
      <Card style={{ ...cs, background: (summary.needsUpdateCount ?? 0) > 0 ? 'rgba(251, 191, 36, 0.1)' : cs.background }}>
        <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: 24 }}>{summary.needsUpdateCount ?? 0}</div>
        <div style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 12 }}>Perlu Update Harga</div>
      </Card>
    </Col>
  </Row>
)}

      {status?.lastSyncedAt && (
        <Alert type="info" showIcon={false} style={{ borderRadius: 12, background: 'oklch(0.65 0.12 220 / 0.08)', borderColor: 'oklch(0.65 0.12 220 / 0.20)' }}
          title={<span style={{ color: '#60a5fa', fontSize: 13 }}>⏱️ Last sync: <strong>{new Date(status.lastSyncedAt).toLocaleString('id-ID')}</strong> · Otomatis setiap 1 jam</span>} />
      )}

      <Tabs
        activeKey={selectedTab}
        onChange={setSelectedTab}
        items={[
          { key: 'sync', label: <span><SyncOutlined /> Sync Harga</span>, children: (
            <Card style={cs} title={<span style={{ color: 'white', fontWeight: 800 }}>⚙️ Konfigurasi</span>}>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>MARGIN (%)</label>
                  <InputNumber value={margin} onChange={v => setMargin(v || 15)} min={0} max={100} size="large"
                    style={{ width: 130 }} formatter={v => `${v}%`} parser={v => Number(String(v).replace('%', ''))} />
                  <div style={{ color: 'oklch(0.50 0.01 17.53)', fontSize: 11, marginTop: 4 }}>Rp 50.000 + {margin}% = <strong style={{ color: 'white' }}>{formatCurrency(Math.ceil(50000 * (1 + margin / 100) / 100) * 100)}</strong></div>
                </div>
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>MODE</label>
                  <Switch checked={dryRun} onChange={setDryRun} checkedChildren="🔍 Preview" unCheckedChildren="⚡ Real" />
                  {dryRun && <div style={{ color: '#fbbf24', fontSize: 11, marginTop: 4 }}>Tidak ada yang disimpan</div>}
                </div>
                <Button type="primary" size="large" loading={syncing} icon={<SyncOutlined />} onClick={handleSync} style={{ fontWeight: 800, height: 48, borderRadius: 12, minWidth: 180 }}>
                  {syncing ? 'Sinkronisasi...' : dryRun ? 'Preview Perubahan' : 'Sync Sekarang'}
                </Button>
                {selectedRowKeys.length > 0 && (
                  <>
                    <Button danger onClick={handleSyncSelected} loading={syncing} style={{ fontWeight: 700 }}>
                      Sync Terpilih ({selectedRowKeys.length})
                    </Button>
                    <Button onClick={handleBulkUpdateMargin} style={{ fontWeight: 700 }}>
                      Update Margin Terpilih
                    </Button>
                  </>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <InputNumber 
                  placeholder="Margin baru" 
                  value={bulkMarginValue} 
                  onChange={v => setBulkMarginValue(v || 15)} 
                  min={0} 
                  max={100}
                  style={{ width: 120 }}
                  formatter={v => `${v}%`}
                />
              </div>
              <Alert type="warning" showIcon={false} style={{ marginTop: 16, borderRadius: 12 }}
                title={<span style={{ fontSize: 13 }}>Formula: <code>ceil(digiPrice × (1 + margin/100) / 100) × 100</code> — dibulatkan ke ratusan terdekat. Voucher <code>priceAutoSync=false</code> dilewati.</span>} />
            </Card>
          )},
          { key: 'comparison', label: <span><AppstoreOutlined /> Perbandingan Harga</span>, children: (
            <div className="space-y-4">
              <Alert type="info" title="Berikut perbandingan harga DB vs Digiflazz. Centang voucher lalu klik 'Sync Terpilih' untuk sync hanya voucher tersebut." style={{ borderRadius: 12 }} />
// app/admin/price-sync/page.tsx - Bagian comparison

{/* Tampilkan Match */}
<Card style={cs} title={<span style={{ color: 'white', fontWeight: 800 }}>✅ Match ({comparison?.matched?.length || 0})</span>}>
  <Table 
    rowSelection={rowSelection}
    dataSource={comparison?.matched || []} 
    columns={matchedColumns} 
    rowKey="_id" 
    size="small"
    scroll={{ x: 1000 }}
    loading={loadingComparison}
  />
</Card>

{/* Tampilkan Unmatched - PERBAIKAN */}
{comparison?.unmatched && comparison.unmatched.length > 0 && (
  <Card style={{ ...cs, borderColor: '#f87171' }} title={<span style={{ color: '#f87171', fontWeight: 800 }}>⚠️ Tidak Match di Digiflazz ({comparison.unmatched.length})</span>}>
    <Table 
      dataSource={comparison.unmatched} 
      columns={unmatchedColumns} 
      rowKey="_id" 
      size="small" 
    />
  </Card>
)}

{/* Tampilkan DigiOnly - PERBAIKAN */}
{comparison?.digiOnly && comparison.digiOnly.length > 0 && (
  <Card style={{ ...cs, borderColor: '#60a5fa' }} title={<span style={{ color: '#60a5fa', fontWeight: 800 }}>📦 Produk Digiflazz Belum di DB ({comparison.digiOnly.length})</span>}>
    <Table 
      dataSource={comparison.digiOnly} 
      columns={digiOnlyColumns} 
      rowKey="sku" 
      size="small" 
    />
  </Card>
)}
            </div>
          )},
          { key: 'history', label: <span><UnorderedListOutlined /> Riwayat</span>, children: (
            result && result.changes.length > 0 ? (
              <Card style={cs} title={<span style={{ color: 'white', fontWeight: 800 }}>📋 Hasil Sync Terakhir</span>}>
                <Table 
                  dataSource={result.changes} 
                  columns={[
                    { title: 'Voucher', dataIndex: 'name', key: 'name', render: (v: string, r: SyncChange) => <div><div style={{ color: 'white' }}>{v}</div><code style={{ fontSize: 11 }}>{r.providerCode}</code></div> },
                    { title: 'Game', dataIndex: 'gameName', key: 'game' },
                    { title: 'Harga Lama', dataIndex: 'oldPrice', key: 'old', render: (v: number) => formatCurrency(v) },
                    { title: 'Harga Baru', dataIndex: 'newPrice', key: 'new', render: (v: number) => <span style={{ color: '#4ade80', fontWeight: 700 }}>{formatCurrency(v)}</span> },
                    { title: 'Margin', dataIndex: 'margin', key: 'margin', render: (v: number) => <Tag color="blue">{v}%</Tag> },
                    { title: 'Selisih', key: 'diff', render: (_: unknown, r: SyncChange) => (
                      <span style={{ color: r.change > 0 ? '#f87171' : '#4ade80', fontWeight: 700 }}>
                        {r.change > 0 ? '+' : ''}{formatCurrency(r.change)} ({r.changePct}%)
                      </span>
                    )},
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ) : (
              <Card style={cs}>
                <div className="text-center py-8" style={{ color: 'oklch(0.55 0.01 17.53)' }}>Belum ada riwayat sync</div>
              </Card>
            )
          )}
        ]}
      />

      {/* Modal Edit Margin */}
      <Modal
        title="Edit Margin Voucher"
        open={marginModalVisible}
        onOk={handleUpdateMargin}
        onCancel={() => setMarginModalVisible(false)}
      >
        <div className="space-y-4">
          <div>
            <label>Margin (%)</label>
            <InputNumber 
              value={editMarginValue} 
              onChange={v => setEditMarginValue(v || 15)} 
              min={0} 
              max={100} 
              style={{ width: '100%', marginTop: 8 }}
              formatter={v => `${v}%`}
            />
          </div>
          <Alert title="Harga akan dihitung ulang dengan margin baru saat sync berikutnya" type="info" />
        </div>
      </Modal>
    </div>
  );
}