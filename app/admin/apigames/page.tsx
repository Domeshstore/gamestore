'use client';

/**
 * Panel Admin Apigames
 * API: https://api.apigames.id
 *
 * Endpoints yang digunakan:
 *   GET  /merchant         → Info merchant + saldo
 *   GET  /cek-username     → Cek username game
 *   GET  /cek-koneksi      → Cek koneksi engine
 *   POST /transaksi        → Kirim transaksi
 *   GET  /status?ref_id=   → Cek status transaksi
 *
 * Sign: HMAC-SHA256(merchant + payload)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Card, Row, Col, Input, Button, Select, Table, Tag, Statistic,
  Space, Badge, Segmented, Alert, Typography, Modal, Descriptions, Switch,
} from 'antd';
import {
  AppstoreOutlined, UserOutlined, ReloadOutlined, SendOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  InfoCircleOutlined, ThunderboltOutlined, WifiOutlined, SearchOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { adminAPI } from '@/lib/api/client';
import apiClient from '@/lib/api/client';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

type TabKey = 'merchant' | 'cek-username' | 'transaction' | 'status' | 'queue';

// ─── Status tag ────────────────────────────────────────────────
function ApiStatusTag({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  if (s === 'success' || s === 'sukses')
    return <Tag color="success" icon={<CheckCircleOutlined />}>Sukses</Tag>;
  if (s === 'failed'  || s === 'gagal')
    return <Tag color="error"   icon={<CloseCircleOutlined />}>Gagal</Tag>;
  return <Tag color="warning" icon={<ClockCircleOutlined />}>Pending</Tag>;
}

// ─── JSON pretty viewer ────────────────────────────────────────
function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre style={{
      background: 'oklch(0.16 0.01 17.53)',
      border: '1px solid oklch(0.32 0.02 34.90)',
      borderRadius: 12, padding: 14,
      color: '#a78bfa', fontSize: 12, lineHeight: 1.7,
      overflowX: 'auto', margin: 0,
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

const cardStyle = {
  background: 'oklch(0.27 0.01 17.95)',
  border: '1px solid oklch(0.32 0.02 34.90)',
  borderRadius: 18,
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function AdminApigamesPage() {
  const [tab, setTab] = useState<TabKey>('merchant');

  /* Merchant */
  const [merchantData, setMerchantData]   = useState<Record<string, unknown> | null>(null);
  const [merchantLoading, setMerchantLoading] = useState(false);

  /* Cek Username */
  const [ukGameCode,    setUkGameCode]    = useState('');
  const [ukUserId,      setUkUserId]      = useState('');
  const [ukServerId,    setUkServerId]    = useState('');
  const [ukResult,      setUkResult]      = useState<Record<string, unknown> | null>(null);
  const [ukLoading,     setUkLoading]     = useState(false);

  /* Cek Koneksi */
  const [connResult,    setConnResult]    = useState<Record<string, unknown> | null>(null);
  const [connLoading,   setConnLoading]   = useState(false);

  /* Transaksi */
  const [txRefId,       setTxRefId]       = useState(`APG-${Date.now()}`);
  const [txGameCode,    setTxGameCode]    = useState('');
  const [txVoucherCode, setTxVoucherCode] = useState('');
  const [txUserId,      setTxUserId]      = useState('');
  const [txServerId,    setTxServerId]    = useState('');
  const [txResult,      setTxResult]      = useState<Record<string, unknown> | null>(null);
  const [txLoading,     setTxLoading]     = useState(false);

  /* Cek Status */
  const [statusRefId,   setStatusRefId]   = useState('');
  const [statusResult,  setStatusResult]  = useState<Record<string, unknown> | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  /* Queue */
  const [queue,        setQueue]        = useState<Transaction[]>([]);
  const [qLoading,     setQLoading]     = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => { doFetchMerchant(); }, []);
  useEffect(() => { if (tab === 'queue') doFetchQueue(); }, [tab]);

  /* ─── Merchant info ─── */
  const doFetchMerchant = async () => {
    setMerchantLoading(true);
    try {
      const res = await apiClient.get('/apigames/merchant');
      setMerchantData(res.data.data ?? res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setMerchantLoading(false);
    }
  };

  /* ─── Cek koneksi ─── */
  const doCheckConn = async () => {
    setConnLoading(true);
    try {
      const res = await apiClient.get('/apigames/cek-koneksi');
      setConnResult(res.data.data ?? res.data);
      toast.success('Koneksi berhasil dicek');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConnLoading(false);
    }
  };

  /* ─── Cek username ─── */
  const doCheckUsername = async () => {
    if (!ukGameCode || !ukUserId) { toast.error('Game code dan User ID wajib diisi'); return; }
    setUkLoading(true);
    setUkResult(null);
    try {
      const res = await apiClient.get('/apigames/cek-username', {
        params: { game_code: ukGameCode, user_id: ukUserId, server_id: ukServerId || undefined },
      });
      setUkResult(res.data.data ?? res.data);
      const d = res.data.data ?? res.data;
      if (d?.username || d?.name) toast.success(`Username: ${d.username || d.name}`);
      else toast.error('Username tidak ditemukan');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUkLoading(false);
    }
  };

  /* ─── Send transaction ─── */
  const doSendTransaction = async () => {
    if (!txRefId || !txGameCode || !txVoucherCode || !txUserId) {
      toast.error('Ref ID, Game Code, Voucher Code, dan User ID wajib diisi');
      return;
    }
    setTxLoading(true);
    setTxResult(null);
    try {
      const res = await apiClient.post('/apigames/transaksi', {
        refId:       txRefId,
        gameCode:    txGameCode,
        voucherCode: txVoucherCode,
        userId:      txUserId,
        serverId:    txServerId || undefined,
      });
      const data = res.data.data ?? res.data;
      setTxResult(data);
      const s = String(data?.status || '').toLowerCase();
      if (s === 'success') toast.success('✅ Transaksi Sukses!');
      else if (s === 'pending') toast('⏳ Transaksi Pending', { icon: '⏳' });
      else toast.error(`❌ ${data?.status}: ${data?.message || ''}`);
      setTxRefId(`APG-${Date.now()}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTxLoading(false);
    }
  };

  /* ─── Check status ─── */
  const doCheckStatus = async () => {
    if (!statusRefId) { toast.error('Ref ID wajib diisi'); return; }
    setStatusLoading(true);
    setStatusResult(null);
    try {
      const res = await apiClient.get('/apigames/status', { params: { ref_id: statusRefId } });
      setStatusResult(res.data.data ?? res.data);
      toast.success(`Status: ${(res.data.data ?? res.data)?.status || '-'}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStatusLoading(false);
    }
  };

  /* ─── Queue ─── */
  const doFetchQueue = useCallback(async () => {
    setQLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        adminAPI.getAllTransactions({ limit: 50, status: 'paid' }),
        adminAPI.getAllTransactions({ limit: 50, status: 'processing' }),
      ]);
      const all = [...(r1.data.transactions ?? []), ...(r2.data.transactions ?? [])];
      setQueue(all.filter(t => t.provider === 'apigames'));
    } finally {
      setQLoading(false);
    }
  }, []);

  const doProcessQueue = async (tx: Transaction) => {
    setProcessingId(tx._id);
    try {
      await adminAPI.processProvider(tx._id);
      toast.success(`Diproses: ${tx.refId.slice(-10)}`);
      doFetchQueue();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const TABS = [
    { label: '🏪 Merchant',      value: 'merchant' },
    { label: '👤 Cek Username',  value: 'cek-username' },
    { label: '⚡ Transaksi',      value: 'transaction' },
    { label: '🔍 Cek Status',    value: 'status' },
    {
      label: (
        <Badge count={queue.filter(t => t.provider === 'apigames').length} size="small" offset={[6, -2]}>
          <span>📦 Antrian</span>
        </Badge>
      ),
      value: 'queue',
    },
  ];

  /* ════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, oklch(0.50 0.14 280), oklch(0.70 0.10 260))', boxShadow: '0 4px 20px oklch(0.50 0.14 280 / 0.4)' }}>
            <AppstoreOutlined style={{ color: 'white', fontSize: 20 }} />
          </div>
          <div>
            <Title level={3} style={{ color: 'oklch(0.95 0 0)', marginBottom: 0, fontWeight: 900 }}>
              Panel Apigames
            </Title>
            <Text style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12 }}>
              Manajemen transaksi & verifikasi akun game
            </Text>
          </div>
        </div>

        {/* Merchant balance badge */}
{merchantData && typeof merchantData === 'object' && (
  <motion.div whileHover={{ scale: 1.02 }}
    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer"
    style={{ background: 'oklch(0.92 0.06 67.02 / 0.10)', border: '1px solid oklch(0.92 0.06 67.02 / 0.20)' }}
    onClick={doFetchMerchant}>
    <DollarOutlined style={{ color: '#f0c060', fontSize: 18 }} />
    <div>
      <div style={{ color: '#f0c060', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>
        {(() => {
          const data = merchantData as MerchantData;
          if (data?.balance !== undefined && typeof data.balance === 'number') {
            return formatCurrency(data.balance);
          }
          if (data?.merchant_name && typeof data.merchant_name === 'string') {
            return data.merchant_name;
          }
          return 'Apigames';
        })()}
      </div>
      <div style={{ color: 'oklch(0.45 0.03 67.02)', fontSize: 11, fontWeight: 600 }}>
        Merchant · klik refresh
      </div>
    </div>
    <ReloadOutlined style={{ color: '#f0c060', fontSize: 14 }} className={merchantLoading ? 'animate-spin' : ''} />
  </motion.div>
)}
      </div>

      {/* Tabs */}
      <Segmented
        value={tab}
        onChange={v => setTab(v as TabKey)}
        options={TABS as never}
        style={{ background: 'oklch(0.24 0.01 17.53)', border: '1px solid oklch(0.32 0.02 34.90)' }}
      />

      {/* ════ TAB: MERCHANT ════════════════════════════════════ */}
      {tab === 'merchant' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>🏪 Info Merchant</span>}
              extra={
                <Button size="small" icon={<ReloadOutlined />} loading={merchantLoading}
                  onClick={doFetchMerchant} style={{ borderRadius: 8, fontWeight: 700 }}>
                  Refresh
                </Button>
              }>
              {merchantData ? (
                <div className="space-y-3">
                  {Object.entries(merchantData).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-2"
                      style={{ borderBottom: '1px solid oklch(0.32 0.02 34.90 / 0.5)' }}>
                      <span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                      <span style={{ color: 'oklch(0.95 0 0)', fontWeight: 600 }}>
                        {typeof v === 'number' && k.includes('balance')
                          ? <span style={{ color: '#f0c060', fontWeight: 800 }}>{formatCurrency(v)}</span>
                          : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Text style={{ color: 'oklch(0.50 0 0)' }}>Klik Refresh untuk memuat data merchant</Text>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>🔌 Cek Koneksi Engine</span>}
              extra={
                <Button size="small" icon={<WifiOutlined />} loading={connLoading}
                  onClick={doCheckConn} type="primary" style={{ borderRadius: 8, fontWeight: 700 }}>
                  Cek Koneksi
                </Button>
              }>
              {connResult ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${
                      String(connResult?.status).toLowerCase().includes('ok') ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span style={{ color: 'oklch(0.95 0 0)', fontWeight: 700, fontSize: 15 }}>
                      {String(connResult?.status || connResult?.message || 'Connected')}
                    </span>
                  </div>
                  <JsonBlock data={connResult} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <WifiOutlined style={{ color: 'oklch(0.45 0.01 17.53)', fontSize: 36 }} />
                  <div style={{ color: 'oklch(0.50 0 0)', marginTop: 10 }}>Tekan "Cek Koneksi" untuk verifikasi engine</div>
                </div>
              )}
            </Card>

            {/* API Info */}
            <Card style={{ ...cardStyle, marginTop: 16 }}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>📌 Info API</span>}>
              <div className="space-y-2">
                {[
                  ['Base URL',      'https://api.apigames.id'],
                  ['Sign algo',     'HMAC-SHA256(secret, merchant + payload)'],
                  ['Merchant key',  'merchant (dari dashboard)'],
                  ['TX sign',       'HMAC-SHA256(merchant + ref_id + game_code + voucher + user_id)'],
                  ['Status sign',   'HMAC-SHA256(merchant + ref_id)'],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3 p-2.5 rounded-xl"
                    style={{ background: 'oklch(0.22 0.01 17.53)', border: '1px solid oklch(0.30 0.01 17.53)' }}>
                    <span style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 11, fontWeight: 700, minWidth: 100, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{l}</span>
                    <code style={{ color: 'oklch(0.75 0.06 67.02)', fontSize: 11 }}>{v}</code>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ════ TAB: CEK USERNAME ════════════════════════════════ */}
      {tab === 'cek-username' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>👤 Cek Username Game</span>}>
              <div className="space-y-4">
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Game Code *
                  </label>
                  <Input value={ukGameCode} onChange={e => setUkGameCode(e.target.value)}
                    placeholder="Contoh: MLBB, FF, PUBGM" size="large" />
                  <Text style={{ color: 'oklch(0.45 0.01 17.53)', fontSize: 11 }}>Kode game dari Apigames</Text>
                </div>
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    User ID *
                  </label>
                  <Input value={ukUserId} onChange={e => setUkUserId(e.target.value)}
                    placeholder="ID pemain" size="large" />
                </div>
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Server ID (opsional)
                  </label>
                  <Input value={ukServerId} onChange={e => setUkServerId(e.target.value)}
                    placeholder="Untuk ML: Zone ID" size="large" />
                </div>

                <Alert type="info" showIcon={false}
                  message={
                    <div>
                      <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: 4 }}>Contoh Game Code</div>
                      <div className="grid grid-cols-2 gap-1">
                        {[['MLBB','Mobile Legends'],['FF','Free Fire'],['PUBGM','PUBG Mobile'],['GI','Genshin Impact']].map(([c,n]) => (
                          <button key={c} onClick={() => setUkGameCode(c)}
                            style={{ background: 'oklch(0.28 0.01 17.53)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                            className="flex justify-between">
                            <code style={{ color: '#a78bfa', fontSize: 11 }}>{c}</code>
                            <span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11 }}>{n}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  }
                  style={{ borderRadius: 12, background: 'oklch(0.25 0.04 225 / 0.3)', borderColor: 'oklch(0.45 0.08 225 / 0.4)' }}
                />

                <Button type="primary" block size="large" loading={ukLoading}
                  icon={<SearchOutlined />} onClick={doCheckUsername}
                  style={{ height: 48, fontWeight: 800, borderRadius: 12 }}>
                  Cek Username
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>Hasil Pengecekan</span>}>
              {ukResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {(ukResult?.username || ukResult?.name) ? (
                    <div className="mb-4 p-4 rounded-xl text-center"
                      style={{ background: 'oklch(0.30 0.05 130 / 0.15)', border: '1px solid oklch(0.55 0.10 130 / 0.3)' }}>
                      <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 32 }} />
                      <div style={{ color: '#4ade80', fontWeight: 900, fontSize: 18, marginTop: 8 }}>Akun Ditemukan</div>
                      <div style={{ color: 'oklch(0.95 0 0)', fontWeight: 800, fontSize: 22, marginTop: 4 }}>
                        {String(ukResult.username || ukResult.name)}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 rounded-xl text-center"
                      style={{ background: 'oklch(0.35 0.10 30 / 0.15)', border: '1px solid oklch(0.55 0.10 30 / 0.3)' }}>
                      <CloseCircleOutlined style={{ color: '#f87171', fontSize: 32 }} />
                      <div style={{ color: '#f87171', fontWeight: 700, marginTop: 8 }}>Akun tidak ditemukan</div>
                    </div>
                  )}
                  <JsonBlock data={ukResult} />
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <UserOutlined style={{ color: 'oklch(0.35 0.01 17.53)', fontSize: 48 }} />
                  <div style={{ color: 'oklch(0.50 0 0)', marginTop: 12 }}>Hasil cek username muncul di sini</div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* ════ TAB: TRANSAKSI ═══════════════════════════════════ */}
      {tab === 'transaction' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>⚡ Kirim Transaksi Apigames</span>}>
              <div className="space-y-4">
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Ref ID (unik)</label>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input value={txRefId} onChange={e => setTxRefId(e.target.value)} placeholder="APG-xxxxxxxxxx" size="large" />
                    <Button size="large" onClick={() => setTxRefId(`APG-${Date.now()}`)}>Auto</Button>
                  </Space.Compact>
                  <Text style={{ color: 'oklch(0.45 0.01 17.53)', fontSize: 11 }}>sign = HMAC-SHA256(merchant + ref_id + game_code + voucher + user_id)</Text>
                </div>
                {[
                  { label: 'Game Code *',    state: txGameCode,    set: setTxGameCode,    ph: 'Contoh: MLBB' },
                  { label: 'Voucher Code *', state: txVoucherCode, set: setTxVoucherCode, ph: 'Contoh: mlbb257diamond' },
                  { label: 'User ID *',      state: txUserId,      set: setTxUserId,      ph: 'ID pemain' },
                  { label: 'Server ID',      state: txServerId,    set: setTxServerId,    ph: 'Opsional (untuk ML: Zone ID)' },
                ].map(({ label, state, set, ph }) => (
                  <div key={label}>
                    <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{label}</label>
                    <Input value={state} onChange={e => set(e.target.value)} placeholder={ph} size="large" />
                  </div>
                ))}

                {/* Request preview */}
                <div className="p-3 rounded-xl" style={{ background: 'oklch(0.16 0.01 17.53)' }}>
                  <Text style={{ color: 'oklch(0.45 0.01 17.53)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>Request Preview</Text>
                  <pre style={{ color: '#a78bfa', fontSize: 11, margin: 0, lineHeight: 1.7 }}>
{`{
  "merchant": "YOUR_MERCHANT",
  "ref_id": "${txRefId}",
  "game_code": "${txGameCode || 'MLBB'}",
  "voucher_code": "${txVoucherCode || 'mlbb257diamond'}",
  "user_id": "${txUserId || '12345678'}",
  "server_id": "${txServerId || '1234'}",
  "sign": "HMAC-SHA256(...)"
}`}
                  </pre>
                </div>

                <Button type="primary" block size="large" loading={txLoading}
                  icon={<ThunderboltOutlined />} onClick={doSendTransaction}
                  style={{ height: 50, fontWeight: 800, borderRadius: 12, fontSize: 15 }}>
                  {txLoading ? 'Mengirim ke Apigames...' : 'Kirim Transaksi'}
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card style={cardStyle} title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>Hasil Transaksi</span>}>
              {txResult ? (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'oklch(0.22 0.01 17.53)', border: '1px solid oklch(0.32 0.02 34.90)' }}>
                    <span style={{ color: 'oklch(0.95 0 0)', fontWeight: 700 }}>Status</span>
                    <ApiStatusTag status={String(txResult?.status || 'pending')} />
                  </div>
                  {txResult?.sn && (
                    <div className="p-4 rounded-xl text-center"
                      style={{ background: 'oklch(0.30 0.05 130 / 0.15)', border: '1px solid oklch(0.55 0.10 130 / 0.3)' }}>
                      <div style={{ color: 'oklch(0.65 0 0)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Serial Number</div>
                      <div style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 900, fontSize: 18 }}>{txResult.sn as string}</div>
                    </div>
                  )}
                  <JsonBlock data={txResult} />
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <ThunderboltOutlined style={{ color: 'oklch(0.35 0.01 17.53)', fontSize: 48 }} />
                  <div style={{ color: 'oklch(0.50 0 0)', marginTop: 12 }}>Hasil transaksi muncul di sini</div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* ════ TAB: CEK STATUS ══════════════════════════════════ */}
      {tab === 'status' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>🔍 Cek Status Transaksi</span>}>
              <div className="space-y-4">
                <Alert
                  type="info" showIcon={false}
                  message={<span style={{ color: '#60a5fa', fontSize: 13 }}>sign = HMAC-SHA256(merchant + ref_id)</span>}
                  style={{ borderRadius: 12, background: 'oklch(0.25 0.04 225 / 0.2)', borderColor: 'oklch(0.45 0.08 225 / 0.3)' }}
                />
                <div>
                  <label style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Ref ID</label>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input value={statusRefId} onChange={e => setStatusRefId(e.target.value)}
                      placeholder="Masukkan Ref ID transaksi" size="large" />
                    <Button type="primary" size="large" loading={statusLoading}
                      icon={<SearchOutlined />} onClick={doCheckStatus} style={{ fontWeight: 700 }}>
                      Cek
                    </Button>
                  </Space.Compact>
                </div>

                {statusResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'oklch(0.22 0.01 17.53)', border: '1px solid oklch(0.32 0.02 34.90)' }}>
                      <span style={{ color: 'oklch(0.65 0.01 17.53)', fontWeight: 600 }}>Status</span>
                      <ApiStatusTag status={String(statusResult?.status || 'pending')} />
                    </div>
                    <JsonBlock data={statusResult} />
                  </motion.div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card style={cardStyle}
              title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>📋 Status Reference</span>}>
              <div className="space-y-3">
                {[
                  { status: 'success', label: 'Sukses',   color: '#4ade80', desc: 'Transaksi berhasil, SN sudah dikirim ke akun' },
                  { status: 'pending', label: 'Pending',  color: '#fbbf24', desc: 'Sedang diproses, cek ulang beberapa saat' },
                  { status: 'failed',  label: 'Gagal',    color: '#f87171', desc: 'Transaksi gagal, hubungi support' },
                ].map(item => (
                  <div key={item.status} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                    <ApiStatusTag status={item.status} />
                    <span style={{ color: 'oklch(0.80 0 0)', fontSize: 13 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ════ TAB: ANTRIAN ═════════════════════════════════════ */}
      {tab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} style={{ color: 'oklch(0.95 0 0)', marginBottom: 0 }}>Antrian Pesanan Apigames</Title>
              <Text style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 13 }}>{queue.length} pesanan paid/processing</Text>
            </div>
            <Button icon={<ReloadOutlined />} loading={qLoading} onClick={doFetchQueue} style={{ borderRadius: 12, fontWeight: 700 }}>
              Refresh
            </Button>
          </div>

          {qLoading ? (
            <Card style={cardStyle}><div className="text-center py-10" style={{ color: 'oklch(0.65 0 0)' }}>Memuat...</div></Card>
          ) : queue.length === 0 ? (
            <Card style={cardStyle}>
              <div className="text-center py-14">
                <CheckCircleOutlined style={{ color: '#4ade80', fontSize: 48 }} />
                <div style={{ color: 'oklch(0.95 0 0)', fontWeight: 700, marginTop: 12 }}>Semua beres!</div>
                <div style={{ color: 'oklch(0.50 0 0)' }}>Tidak ada pesanan Apigames yang menunggu</div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {queue.map(tx => (
                <motion.div key={tx._id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-2xl"
                  style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)' }}>
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${tx.status === 'paid' ? 'bg-blue-400' : 'bg-yellow-400'} animate-pulse`} />
                    <div className="flex-1 min-w-0">
                      <Space wrap className="mb-1.5">
                        <Tag color={tx.status === 'paid' ? 'processing' : 'warning'} style={{ borderRadius: 99, fontWeight: 700 }}>
                          {getStatusLabel(tx.status)}
                        </Tag>
                        <code style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11 }}>{tx.refId.slice(-14)}</code>
                      </Space>
                      <div style={{ color: 'oklch(0.95 0 0)', fontWeight: 700, fontSize: 15 }}>{tx.voucherName || tx.voucherCode}</div>
                      <div style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 13 }}>{tx.gameName}</div>
                      <div style={{ color: 'oklch(0.50 0 0)', fontSize: 12, marginTop: 4 }}>
                        ID: <code style={{ color: 'oklch(0.75 0 0)' }}>{tx.targetId}{tx.serverId ? `/${tx.serverId}` : ''}</code>
                        {' · '}SKU: <code style={{ color: '#a78bfa' }}>{tx.voucherCode}</code>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div style={{ color: '#f0c060', fontWeight: 900, fontSize: 16 }}>{formatCurrency(tx.price)}</div>
                      <div style={{ color: 'oklch(0.45 0 0)', fontSize: 12 }}>{formatDate(tx.createdAt).slice(0, 12)}</div>
                    </div>
                    {tx.status === 'paid' && (
                      <Button type="primary" size="small" loading={processingId === tx._id}
                        icon={<ThunderboltOutlined />} onClick={() => doProcessQueue(tx)}
                        style={{ borderRadius: 10, fontWeight: 700 }}>
                        Proses Apigames
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
