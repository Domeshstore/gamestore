'use client';

/**
 * Panel Admin Digiflazz
 *
 * PENTING — Struktur response:
 *
 *   Backend mengembalikan: { success: true, data: <payload> }
 *   Axios menambah layer:   axiosRes.data = { success, data }
 *   Payload aktual:         axiosRes.data.data
 *
 * Digiflazz sendiri membungkus dalam { "data": { ... } }
 * Backend sudah melakukan unwrap, jadi frontend cukup baca .data.data sekali.
 *
 * Balance  → axiosRes.data.data = { deposit: number }
 * PriceList→ axiosRes.data.data = DigiProduct[]
 * Transaction → axiosRes.data.data = { ref_id, status, rc, sn, message, price, buyer_last_saldo }
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Input, Button, Select, Table, Tag, Statistic, Switch,
  Alert, Tooltip, Typography, Space, Badge, Segmented, Modal,
} from 'antd';
import {
  DollarOutlined, SearchOutlined, ReloadOutlined, SendOutlined,
  ThunderboltOutlined, InfoCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, CopyOutlined,
  DownloadOutlined, FilterOutlined, AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '@/lib/api/client';
import { fetchBalance, fetchPriceList, sendTransaction, checkTxStatus } from '@/lib/api/digiflazz';
import type { DigiProduct, DigiTxResult } from '@/lib/api/digiflazz';
import { Transaction } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
const { Search } = Input;
const PAGE_SIZE = 20;

/* ── Status chip ─────────────────────────────────────────── */
function DigiStatusTag({ status }: { status: string }) {
  const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
    Sukses:  { color: 'success',   icon: <CheckCircleOutlined /> },
    Gagal:   { color: 'error',     icon: <CloseCircleOutlined /> },
    Pending: { color: 'warning',   icon: <ClockCircleOutlined /> },
  };
  const c = cfg[status] ?? { color: 'default', icon: <InfoCircleOutlined /> };
  return (
    <Tag color={c.color} icon={c.icon} style={{ borderRadius: 99, fontWeight: 700, padding: '2px 10px' }}>
      {status}
    </Tag>
  );
}

/* ── Result card ─────────────────────────────────────────── */
function TxResultCard({ result }: { result: DigiTxResult }) {
  const isSuccess = result.status === 'Sukses';
  const isFailed  = result.status === 'Gagal';
  const gradBg = isSuccess
    ? 'linear-gradient(135deg,rgba(52,211,153,0.10),rgba(5,150,105,0.05))'
    : isFailed
      ? 'linear-gradient(135deg,rgba(248,113,113,0.10),rgba(185,28,28,0.05))'
      : 'linear-gradient(135deg,rgba(251,191,36,0.10),rgba(180,83,9,0.05))';
  const border = isSuccess ? '1px solid rgba(52,211,153,0.25)'
    : isFailed ? '1px solid rgba(248,113,113,0.25)'
    : '1px solid rgba(251,191,36,0.25)';

  const rows: [string, React.ReactNode][] = [
    ['Ref ID',       <code style={{ color:'#a78bfa', fontFamily:'monospace' }}>{result.ref_id}</code>],
    ['Status',       <DigiStatusTag status={result.status} />],
    ['RC',           <code style={{ color:'#94a3b8' }}>{result.rc}</code>],
    ['Pesan',        <span style={{ color:'#f1f5f9' }}>{result.message}</span>],
    ['SKU Code',     <code style={{ color:'#38bdf8' }}>{result.buyer_sku_code}</code>],
    ['Customer No',  <code style={{ color:'#f1f5f9' }}>{result.customer_no}</code>],
    ...(result.sn
      ? [['Serial Number', <code style={{ color:'#34d399', fontWeight:900, fontSize:15 }}>{result.sn}</code>] as [string, React.ReactNode]]
      : []
    ),
    ...(result.price !== undefined
      ? [['Harga', <span style={{ color:'#fbbf24', fontWeight:800 }}>{formatCurrency(result.price!)}</span>] as [string, React.ReactNode]]
      : []
    ),
    ...(result.buyer_last_saldo !== undefined
      ? [['Saldo Akhir', <span style={{ color:'#34d399', fontWeight:700 }}>{formatCurrency(result.buyer_last_saldo!)}</span>] as [string, React.ReactNode]]
      : []
    ),
  ];

  return (
    <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.3 }}>
      <div style={{ background: gradBg, border, borderRadius: 20, padding: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <span style={{ color:'white', fontWeight:900, fontSize:16 }}>Hasil Transaksi</span>
          <DigiStatusTag status={result.status} />
        </div>
        <div className="space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1.5"
              style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color:'#64748b', fontSize:12, fontWeight:600 }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        {result.sn && (
          <div className="mt-4 p-3 rounded-xl text-center"
            style={{ background:'rgba(52,211,153,0.10)', border:'1px solid rgba(52,211,153,0.20)' }}>
            <div style={{ color:'#94a3b8', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Serial Number
            </div>
            <div style={{ color:'#34d399', fontFamily:'monospace', fontWeight:900, fontSize:20, marginTop:4 }}>
              {result.sn}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function AdminDigiflazzPage() {
const [activeTab, setActiveTab] = useState<'balance'|'pricelist'|'transaction'|'queue'|'webhook'>('balance');

  /* ── Balance state ── */
  const [balance,     setBalance]     = useState<number | null>(null);
  const [balLoading,  setBalLoading]  = useState(false);

  /* ── Price list state ── */
  const [products,    setProducts]    = useState<DigiProduct[]>([]);
  const [plLoading,   setPlLoading]   = useState(false);
  const [plLoaded,    setPlLoaded]    = useState(false);
  const [plCmd,       setPlCmd]       = useState<'prepaid'|'pasca'>('prepaid');
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState<string | undefined>(undefined);
  const [filterBrand, setFilterBrand] = useState<string | undefined>(undefined);
  const [onlyActive,  setOnlyActive]  = useState(true);
  const [page,        setPage]        = useState(1);

  /* ── Transaction form state ── */
  const [txRefId,      setTxRefId]    = useState(`MANUAL-${Date.now()}`);
  const [txSku,        setTxSku]      = useState('');
  const [txCustomer,   setTxCustomer] = useState('');
  const [txTesting,    setTxTesting]  = useState(false);
  const [txLoading,    setTxLoading]  = useState(false);
  const [txResult,     setTxResult]   = useState<DigiTxResult | null>(null);

  /* ── Queue state ── */
  const [queue,        setQueue]      = useState<Transaction[]>([]);
  const [qLoading,     setQLoading]   = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [checkingId,   setCheckingId]   = useState<string | null>(null);

  /* ── Product picker modal ── */
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  /* ── Init: fetch balance ── */
  useEffect(() => { doFetchBalance(); }, []);

  /* ── Fetch queue when tab active ── */
  useEffect(() => { if (activeTab === 'queue') doFetchQueue(); }, [activeTab]);

  /* ─────────────────────────────────────────────────────────
     BALANCE — res.data.data = { deposit: number }
  ───────────────────────────────────────────────────────── */
  const doFetchBalance = async () => {
    setBalLoading(true);
    try {
      const payload = await fetchBalance();
      // payload = { deposit: 500000000 }
      setBalance(payload?.deposit ?? 0);
    } catch (err) {
      toast.error(`Gagal cek saldo: ${getErrorMessage(err)}`);
    } finally {
      setBalLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     PRICE LIST — res.data.data = DigiProduct[]
  ───────────────────────────────────────────────────────── */
  const doFetchPriceList = async () => {
    setPlLoading(true);
    try {
      const list = await fetchPriceList(plCmd);
      // list = [ { product_name, buyer_sku_code, price, ... } ]
      setProducts(list);
      setPlLoaded(true);
      setPage(1);
      toast.success(`${list.length} produk dimuat`);
    } catch (err) {
      toast.error(`Gagal muat produk: ${getErrorMessage(err)}`);
    } finally {
      setPlLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     SUBMIT TRANSACTION
     res.data.data = { ref_id, status, rc, sn, message, price, buyer_last_saldo }
  ───────────────────────────────────────────────────────── */
  const doSubmitTransaction = async () => {
    if (!txSku.trim())      { toast.error('Buyer SKU Code wajib diisi'); return; }
    if (!txCustomer.trim()) { toast.error('Customer No wajib diisi'); return; }
    if (!txRefId.trim())    { toast.error('Ref ID wajib diisi'); return; }

    setTxLoading(true);
    setTxResult(null);
    try {
      const result = await sendTransaction({
        refId:        txRefId.trim(),
        buyerSkuCode: txSku.trim(),
        customerId:   txCustomer.trim(),
        testing:      txTesting,
      });

      // result = { ref_id, status, rc, sn, message, price, buyer_last_saldo }
      setTxResult(result);

      if (result.status === 'Sukses') {
        toast.success(`✅ Transaksi Sukses! SN: ${result.sn || '-'}`);
        doFetchBalance(); // refresh saldo
      } else if (result.status === 'Pending') {
        toast(`⏳ Transaksi Pending (RC: ${result.rc})`, { icon: '⏳' });
      } else {
        toast.error(`❌ ${result.status}: ${result.message} (RC: ${result.rc})`);
      }

      // Auto-generate ref ID baru untuk transaksi berikutnya
      setTxRefId(`MANUAL-${Date.now()}`);
    } catch (err) {
      toast.error(`Error: ${getErrorMessage(err)}`);
    } finally {
      setTxLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     CEK STATUS PENDING
     Digiflazz: re-send request asal dengan ref_id yang sama
     res.data.data = { ref_id, status, rc, sn, ... }
  ───────────────────────────────────────────────────────── */
  const doCheckStatus = async (refId: string, sku: string, customer: string) => {
    try {
      const result = await checkTxStatus({ refId, buyerSkuCode: sku, customerId: customer });
      return result;
    } catch (err) {
      throw err;
    }
  };

  /* ─────────────────────────────────────────────────────────
     QUEUE: Proses via Digiflazz (admin action)
  ───────────────────────────────────────────────────────── */
  const doProcessQueue = async (tx: Transaction) => {
    setProcessingId(tx._id);
    try {
      await adminAPI.processProvider(tx._id);
      toast.success(`⚡ Diproses: ${tx.refId.slice(-10)}`);
      doFetchQueue();
      doFetchBalance();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  /* ─────────────────────────────────────────────────────────
     QUEUE: Sync status transaksi processing
  ───────────────────────────────────────────────────────── */
  const doSyncQueue = async (tx: Transaction) => {
    setCheckingId(tx._id);
    try {
      // customer_no = targetId_serverId (untuk ML) atau targetId saja
      const customerId = tx.serverId ? `${tx.targetId}_${tx.serverId}` : tx.targetId;
      const result = await doCheckStatus(tx.refId, tx.voucherCode, customerId);
      toast.success(`Status: ${result.status} (RC: ${result.rc})`);
      doFetchQueue();
    } catch (err) {
      toast.error(`Gagal sync: ${getErrorMessage(err)}`);
    } finally {
      setCheckingId(null);
    }
  };

  const doFetchQueue = useCallback(async () => {
    setQLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        adminAPI.getAllTransactions({ limit: 50, status: 'paid' }),
        adminAPI.getAllTransactions({ limit: 50, status: 'processing' }),
      ]);
      setQueue([...(r1.data.transactions ?? []), ...(r2.data.transactions ?? [])]);
    } finally {
      setQLoading(false);
    }
  }, []);

  /* ── Filtered / paginated products ── */
  const filtered = products.filter(p => {
    if (onlyActive && !p.buyer_product_status) return false;
    const q = search.toLowerCase();
    if (q && !p.product_name.toLowerCase().includes(q) && !p.buyer_sku_code.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false;
    if (filterCat   && p.category !== filterCat)   return false;
    if (filterBrand && p.brand    !== filterBrand)  return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categories = [...new Set(products.map(p => p.category))].sort();
  const brands     = [...new Set(products.filter(p => !filterCat || p.category === filterCat).map(p => p.brand))].sort();

  /* ── Product table columns ── */
  const productCols = [
    {
      title: 'Produk', dataIndex: 'product_name', key: 'name',
      render: (v: string, r: DigiProduct) => (
        <div>
          <div style={{ color:'#f1f5f9', fontWeight:700, fontSize:13 }}>{v}</div>
          <code style={{ color:'#a78bfa', fontSize:11, background:'rgba(124,58,237,0.1)', padding:'1px 6px', borderRadius:6 }}>
            {r.buyer_sku_code}
          </code>
        </div>
      ),
    },
    {
      title: 'Kategori', dataIndex: 'category', key: 'cat',
      render: (v: string) => <Tag style={{ borderRadius:99, fontWeight:600, fontSize:11 }}>{v}</Tag>,
    },
    { title:'Brand', dataIndex:'brand', key:'brand', render:(v:string) => <span style={{color:'#94a3b8', fontSize:12}}>{v}</span> },
    {
      title: 'Harga', dataIndex: 'price', key: 'price',
      render: (v: number) => <span style={{ color:'#fbbf24', fontWeight:800 }}>{formatCurrency(v)}</span>,
    },
    {
      title: 'Stok', key: 'stock',
      render: (_: unknown, r: DigiProduct) => r.unlimited_stock
        ? <Tag color="success" style={{ borderRadius:99, fontWeight:700 }}>∞ Unlimited</Tag>
        : <span style={{ color:'#94a3b8', fontWeight:600 }}>{r.stock.toLocaleString()}</span>,
    },
    {
      title: 'Status', key: 'status',
      render: (_: unknown, r: DigiProduct) => (
        <div className="flex flex-col gap-1">
          <Tag color={r.buyer_product_status ? 'success' : 'error'} style={{ borderRadius:99, fontWeight:700, fontSize:11 }}>
            {r.buyer_product_status ? '✓ Buyer Aktif' : '✗ Buyer Nonaktif'}
          </Tag>
          {!r.seller_product_status && (
            <Tag color="warning" style={{ borderRadius:99, fontWeight:700, fontSize:11 }}>⚠ Seller OFF</Tag>
          )}
          {r.start_cut_off !== '00:00' && (
            <Tag color="processing" style={{ borderRadius:99, fontWeight:700, fontSize:11 }}>
              ✂ {r.start_cut_off}–{r.end_cut_off}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Aksi', key: 'action',
      render: (_: unknown, r: DigiProduct) => (
        <Button size="small" type="primary" ghost
          onClick={() => { setTxSku(r.buyer_sku_code); setActiveTab('transaction'); toast.success(`SKU "${r.buyer_sku_code}" dipilih`); }}
          icon={<SendOutlined />} style={{ borderRadius:10, fontWeight:700 }}>
          Pakai
        </Button>
      ),
    },
  ];

  const cardStyle = {
    background: '#13131f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
  };

  /* ══════ RENDER ═══════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#7c3aed,#0ea5e9)', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
            <ThunderboltOutlined style={{ color:'white', fontSize:20 }} />
          </div>
          <div>
            <Title level={3} style={{ color:'white', marginBottom:0, fontWeight:900 }}>Panel Digiflazz</Title>
            <Text style={{ color:'#64748b', fontSize:12 }}>Manajemen produk & transaksi real-time</Text>
          </div>
        </div>

        {/* Balance badge */}
        {balance !== null && (
          <motion.div whileHover={{ scale:1.02 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer"
            style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)' }}
            onClick={doFetchBalance}>
            <DollarOutlined style={{ color:'#34d399', fontSize:18 }} />
            <div>
              <div style={{ color:'#34d399', fontWeight:900, fontSize:18, lineHeight:1 }}>{formatCurrency(balance)}</div>
              <div style={{ color:'#065f46', fontSize:11, fontWeight:600 }}>Saldo Digiflazz · klik refresh</div>
            </div>
            <ReloadOutlined style={{ color:'#34d399', fontSize:14 }} className={balLoading ? 'animate-spin' : ''} />
          </motion.div>
        )}
      </div>

      {/* Tabs */}
// Di component:
<Segmented
  value={activeTab}
  onChange={v => setActiveTab(v as typeof activeTab)}
  options={[
    { label: '💰 Saldo', value: 'balance' },
    { label: '📋 Produk', value: 'pricelist' },
    { label: '⚡ Transaksi', value: 'transaction' },
    { 
      label: <Badge count={queue.length} size="small">
        <span>📦 Antrian</span>
      </Badge>,
      value: 'queue' 
    },
    { label: '🔗 Webhook', value: 'webhook' },
  ]}
/>

      {/* ════════ TAB: SALDO ════════════════════════════════ */}
      {activeTab === 'balance' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              <Card style={cardStyle}>
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.2)' }}>
                    <DollarOutlined style={{ color:'#34d399', fontSize:40 }} />
                  </div>
                  <Text style={{ color:'#94a3b8', display:'block', marginBottom:4 }}>Saldo Deposit Digiflazz</Text>
                  {balance !== null
                    ?  <Statistic 
      value={balance} 
      prefix="Rp" 
      formatter={v => Number(v).toLocaleString('id-ID')}
      styles={{ 
        content: { color: '#34d399', fontWeight: 900, fontSize: 36 }
      }}
    />
                    : <Text style={{ color:'#475569' }}>Belum dicek</Text>}
                  <Button type="primary" size="large" icon={<ReloadOutlined />} loading={balLoading}
                    onClick={doFetchBalance} style={{ marginTop:20, fontWeight:700, borderRadius:12 }}>
                    {balLoading ? 'Mengecek...' : 'Cek Saldo'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Col>
          <Col xs={24} lg={14}>
            <Card title={<span style={{ color:'white', fontWeight:800 }}>📌 Info Koneksi API</span>} style={cardStyle}>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  ['Endpoint Base URL',    'https://api.digiflazz.com/v1'],
                  ['Method',              'POST untuk semua request'],
                  ['Sign formula (depo)',  'md5(username + apiKey + "depo")'],
                  ['Sign formula (tx)',    'md5(username + apiKey + ref_id)'],
                  ['Sign formula (list)',  'md5(username + apiKey + "pricelist")'],
                  ['IP Whitelist',         '52.74.250.133'],
                  ['Response wrapper',     '{ "data": { ... } } — selalu unwrap .data'],
                  ['Cek status Pending',   'Re-send request dengan ref_id yang sama'],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color:'#64748b', fontSize:11, fontWeight:700, minWidth:160, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</span>
                    <code style={{ color:'#a78bfa', fontSize:12 }}>{v}</code>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ════════ TAB: PRODUK (PRICE LIST) ══════════════════ */}
      {activeTab === 'pricelist' && (
        <div className="space-y-4">
          {/* Controls */}
          <Card style={cardStyle}>
            <Space wrap>
              <Segmented
                value={plCmd}
                onChange={v => { setPlCmd(v as 'prepaid'|'pasca'); setPlLoaded(false); setProducts([]); }}
                options={['prepaid','pasca'].map(v => ({ label: v.charAt(0).toUpperCase()+v.slice(1), value: v }))}
              />
              <Button type="primary" icon={<DownloadOutlined />} loading={plLoading} onClick={doFetchPriceList}>
                {plLoaded ? 'Reload' : 'Muat Produk'}
              </Button>
            </Space>

            {plLoaded && (
              <div className="flex flex-wrap gap-3 mt-4">
                <Search value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Cari nama/SKU/brand..." style={{ width: 260 }} allowClear />
                <Select value={filterCat} onChange={v => { setFilterCat(v); setFilterBrand(undefined); setPage(1); }}
                  placeholder="Semua Kategori" allowClear style={{ width: 170 }}>
                  {categories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
                <Select value={filterBrand} onChange={v => { setFilterBrand(v); setPage(1); }}
                  placeholder="Semua Brand" allowClear style={{ width: 150 }}>
                  {brands.map(b => <Select.Option key={b} value={b}>{b}</Select.Option>)}
                </Select>
                <div className="flex items-center gap-2">
                  <Switch checked={onlyActive} onChange={setOnlyActive} size="small" />
                  <Text style={{ color:'#94a3b8', fontSize:12, fontWeight:600 }}>Hanya aktif</Text>
                </div>
                <Text style={{ color:'#64748b', fontSize:12, alignSelf:'center' }}>
                  {filtered.length} dari {products.length} produk
                  {totalPages > 1 && ` — hal ${page}/${totalPages}`}
                </Text>
              </div>
            )}
          </Card>

          {/* Table */}
          {plLoaded && (
            <>
              <Card style={cardStyle} >
                <Table
                  dataSource={paginated}
                  columns={productCols}
                  rowKey="buyer_sku_code"
                  loading={plLoading}
                  pagination={false}
                  size="small"
                  scroll={{ x: 900 }}
                  rowClassName={() => 'hover:bg-purple-900/10'}
                />
              </Card>

              {/* Pagination */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Text style={{ color:'#64748b', fontSize:13 }}>
                  {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filtered.length)} dari {filtered.length}
                </Text>
                <div className="flex items-center gap-2">
                  <Button disabled={page===1} onClick={() => setPage(p => p-1)} style={{ borderRadius:10 }}>← Prev</Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const n = Math.max(1, Math.min(totalPages-4, page-2)) + i;
                    return (
                      <Button key={n} type={page===n ? 'primary' : 'default'}
                        onClick={() => setPage(n)} style={{ borderRadius:10, fontWeight:700, minWidth:38 }}>
                        {n}
                      </Button>
                    );
                  })}
                  <Button disabled={page===totalPages} onClick={() => setPage(p => p+1)} style={{ borderRadius:10 }}>Next →</Button>
                  <Space>
                    <Text style={{ color:'#64748b', fontSize:12 }}>Hal.</Text>
                    <Input type="number" min={1} max={totalPages} value={page}
                      onChange={e => { const v=parseInt(e.target.value); if(v>=1&&v<=totalPages) setPage(v); }}
                      style={{ width:60, borderRadius:10, textAlign:'center' }} />
                    <Text style={{ color:'#64748b', fontSize:12 }}>/ {totalPages}</Text>
                  </Space>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════ TAB: TRANSAKSI ════════════════════════════ */}
      {activeTab === 'transaction' && (
        <Row gutter={[16, 16]}>
          {/* Form */}
          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ color:'white', fontWeight:800 }}>⚡ Kirim Transaksi ke Digiflazz</span>}
              style={cardStyle}
            >
              <div className="space-y-4">
                {/* Ref ID */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'#64748b' }}>
                    Ref ID (unik per transaksi)
                  </label>
                  <Space.Compact style={{ width:'100%' }}>
                    <Input value={txRefId} onChange={e => setTxRefId(e.target.value)}
                      placeholder="MANUAL-xxxxxxxxxx" />
                    <Button onClick={() => setTxRefId(`MANUAL-${Date.now()}`)}>Auto</Button>
                  </Space.Compact>
                  <Text style={{ color:'#475569', fontSize:11 }}>sign = md5(username + apiKey + ref_id)</Text>
                </div>

                {/* SKU Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'#64748b' }}>
                    Buyer SKU Code
                  </label>
                  <Space.Compact style={{ width:'100%' }}>
                    <Input value={txSku} onChange={e => setTxSku(e.target.value)}
                      placeholder="Contoh: mlbb257diamond, xld25"
                      prefix={<code style={{ color:'#a78bfa', fontSize:12 }}>sku</code>} />
                    <Button icon={<SearchOutlined />} onClick={() => setPickerOpen(true)}>Cari</Button>
                  </Space.Compact>
                </div>

                {/* Customer No */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'#64748b' }}>
                    Customer No (Nomor Pelanggan)
                  </label>
                  <Input value={txCustomer} onChange={e => setTxCustomer(e.target.value)}
                    placeholder="No. HP atau Game ID (ML: 12345678_1234)"
                    prefix={<code style={{ color:'#38bdf8', fontSize:12 }}>cust</code>} />
                  <Text style={{ color:'#475569', fontSize:11 }}>Mobile Legends: UserID_ZoneID · Pulsa: 0812xxxxxxx</Text>
                </div>

                {/* Testing toggle */}
                <Alert
                  type="warning"
                  showIcon={false}
                  title={
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ color:'#fbbf24', fontWeight:700 }}>Mode Testing</div>
                        <div style={{ color:'#92400e', fontSize:12 }}>Tidak deduct saldo, tidak dieksekusi sungguhan</div>
                      </div>
                      <Switch checked={txTesting} onChange={setTxTesting} />
                    </div>
                  }
                  style={{ borderRadius:12 }}
                />

                {/* Test cases */}
                <Card size="small" title={<span style={{ color:'#38bdf8', fontSize:12, fontWeight:700 }}>💡 Test Cases (SKU: xld10)</span>}
                  style={{ background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:14 }}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['087800001230','✅ Sukses'],
                      ['087800001232','❌ Gagal'],
                      ['087800001233','⏳ Pending→Sukses'],
                      ['087800001234','⏳ Pending→Gagal'],
                    ].map(([no, lbl]) => (
                      <button key={no} onClick={() => { setTxCustomer(no); setTxSku('xld10'); setTxTesting(true); }}
                        className="flex justify-between px-2.5 py-1.5 rounded-xl text-left transition-all hover:bg-white/5"
                        style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
                        <code style={{ color:'#94a3b8', fontSize:11 }}>{no}</code>
                        <span style={{ color:'#64748b', fontSize:11 }}>{lbl}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Submit */}
                <Button type="primary" block size="large" loading={txLoading}
                  icon={<ThunderboltOutlined />} onClick={doSubmitTransaction}
                  style={{ height:52, fontWeight:800, borderRadius:14, fontSize:15 }}>
                  {txLoading ? 'Mengirim ke Digiflazz...' : 'Kirim Transaksi'}
                </Button>

                {/* JSON Preview */}
                <div className="p-3 rounded-xl" style={{ background:'rgba(0,0,0,0.4)' }}>
                  <Text style={{ color:'#475569', fontSize:11, fontWeight:700, display:'block', marginBottom:6 }}>Request Preview</Text>
                  <pre style={{ color:'#a78bfa', fontSize:11, margin:0, lineHeight:1.7, fontFamily:'monospace' }}>
{`{
  "username": "YOUR_USER",
  "buyer_sku_code": "${txSku || 'xld10'}",
  "customer_no": "${txCustomer || '087800001230'}",
  "ref_id": "${txRefId}",
  "sign": "md5(user+key+ref_id)",
  "testing": ${txTesting}
}`}
                  </pre>
                </div>
              </div>
            </Card>
          </Col>

          {/* Result */}
          <Col xs={24} lg={12}>
            <div className="space-y-4">
              {txResult ? (
                <TxResultCard result={txResult} />
              ) : (
                <Card style={cardStyle}>
                  <div className="text-center py-12">
                    <ThunderboltOutlined style={{ color:'rgba(124,58,237,0.3)', fontSize:48 }} />
                    <div style={{ color:'#475569', marginTop:12 }}>Hasil transaksi muncul di sini</div>
                  </div>
                </Card>
              )}

              {/* Response format reference */}
              <Card size="small"
                title={<span style={{ color:'#94a3b8', fontSize:12, fontWeight:700 }}>📄 Format Response Digiflazz</span>}
                style={cardStyle}>
                <pre style={{ color:'#64748b', fontSize:11, margin:0, lineHeight:1.7 }}>
{`{
  "data": {            ← selalu dibungkus .data
    "ref_id": "...",
    "customer_no": "...",
    "buyer_sku_code": "...",
    "message": "Transaksi Sukses",
    "status": "Sukses",  ← Sukses | Pending | Gagal
    "rc": "00",
    "sn": "1234567890",
    "buyer_last_saldo": 990000,
    "price": 25000
  }
}`}
                </pre>
              </Card>
            </div>
          </Col>
        </Row>
      )}

      {/* ════════ TAB: ANTRIAN ══════════════════════════════ */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} style={{ color:'white', marginBottom:0 }}>Antrian Pesanan Aktif</Title>
              <Text style={{ color:'#64748b', fontSize:13 }}>{queue.length} pesanan paid/processing</Text>
            </div>
            <Button icon={<ReloadOutlined />} loading={qLoading} onClick={doFetchQueue} style={{ borderRadius:12, fontWeight:700 }}>
              Refresh
            </Button>
          </div>

          {qLoading ? (
            <Card style={cardStyle}><div className="text-center py-10 text-slate-400">Memuat...</div></Card>
          ) : queue.length === 0 ? (
            <Card style={cardStyle}>
              <div className="text-center py-14">
                <CheckCircleOutlined style={{ color:'#34d399', fontSize:48 }} />
                <div style={{ color:'white', fontWeight:700, marginTop:12 }}>Semua beres!</div>
                <div style={{ color:'#475569' }}>Tidak ada pesanan menunggu</div>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {queue.map(tx => {
                const customerId = tx.serverId ? `${tx.targetId}_${tx.serverId}` : tx.targetId;
                return (
                  <motion.div key={tx._id}
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    className="p-4 rounded-2xl"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start gap-4 flex-wrap">
                      {/* Status dot */}
                      <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${tx.status==='paid' ? 'bg-blue-400' : 'bg-yellow-400'} animate-pulse`} />

                      <div className="flex-1 min-w-0">
                        <Space wrap className="mb-2">
                          <Tag color={tx.status==='paid' ? 'processing' : 'warning'}
                            style={{ borderRadius:99, fontWeight:700 }}>{getStatusLabel(tx.status)}</Tag>
                          <code style={{ color:'#94a3b8', fontSize:11 }}>{tx.refId.slice(-14)}</code>
                        </Space>
                        <div style={{ color:'white', fontWeight:700, fontSize:15 }}>{tx.voucherName || tx.voucherCode}</div>
                        <div style={{ color:'#64748b', fontSize:13 }}>{tx.gameName}</div>
                        <Space split="·" style={{ marginTop:6 }}>
                          <Text style={{ color:'#475569', fontSize:12 }}>ID: <code style={{ color:'#94a3b8' }}>{tx.targetId}{tx.serverId?`/${tx.serverId}`:''}</code></Text>
                          <Text style={{ color:'#475569', fontSize:12 }}>SKU: <code style={{ color:'#a78bfa' }}>{tx.voucherCode}</code></Text>
                          <Text style={{ color:'#475569', fontSize:12 }}>Provider: {tx.provider}</Text>
                        </Space>
                      </div>

                      <div className="text-right">
                        <div style={{ color:'#fbbf24', fontWeight:900, fontSize:16 }}>{formatCurrency(tx.price)}</div>
                        <div style={{ color:'#475569', fontSize:12 }}>{formatDate(tx.createdAt).slice(0,12)}</div>
                      </div>

                      <Space direction="vertical" size={6}>
                        {tx.status === 'paid' && (
                          <Button type="primary" size="small" loading={processingId===tx._id}
                            icon={<ThunderboltOutlined />} onClick={() => doProcessQueue(tx)}
                            style={{ borderRadius:10, fontWeight:700 }}>
                            Proses Digiflazz
                          </Button>
                        )}
                        {tx.status === 'processing' && (
                          <Button size="small" loading={checkingId===tx._id}
                            icon={<ReloadOutlined />} onClick={() => doSyncQueue(tx)}
                            style={{ borderRadius:10, fontWeight:700, borderColor:'rgba(251,191,36,0.4)', color:'#fbbf24' }}>
                            Sync Status
                          </Button>
                        )}
                      </Space>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ════════ TAB: WEBHOOK ══════════════════════════════ */}

      {/* ════════ TAB: WEBHOOK ══════════════════════════════ */}
      {activeTab === 'webhook' && (
        <div className="space-y-4">
          <Card style={cardStyle}
            title={<span style={{ color:'oklch(0.95 0 0)', fontWeight:800 }}>🔗 Webhook Digiflazz</span>}>
            <div className="space-y-5">
              <Alert type="info" showIcon={false}
                message={
                  <div>
                    <div style={{ color:'#60a5fa', fontWeight:700, marginBottom:4 }}>Cara Konfigurasi Webhook</div>
                    <div style={{ color:'oklch(0.75 0 0)', fontSize:13, lineHeight:1.8 }}>
                      1. Login ke dashboard Digiflazz<br/>
                      2. Buka menu <strong>Atur Koneksi → API → Webhook</strong><br/>
                      3. Set URL ke endpoint backend kamu<br/>
                      4. (Opsional) Tambahkan Secret untuk verifikasi signature
                    </div>
                  </div>
                }
                style={{ borderRadius:14, background:'oklch(0.25 0.04 225 / 0.2)', borderColor:'oklch(0.45 0.08 225 / 0.3)' }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label:'Webhook URL', value:`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'https://your-backend.com'}/webhook/digiflazz`, color:'#f0c060' },
                  { label:'Health Check', value:`${process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'https://your-backend.com'}/webhook/digiflazz`, color:'#4ade80' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-4 rounded-xl"
                    style={{ background:'oklch(0.22 0.01 17.53)', border:'1px solid oklch(0.32 0.02 34.90)' }}>
                    <div style={{ color:'oklch(0.65 0.01 17.53)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{label}</div>
                    <code style={{ color, fontSize:12, wordBreak:'break-all', fontFamily:'monospace' }}>{value}</code>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ color:'oklch(0.75 0 0)', fontWeight:700, marginBottom:10 }}>📨 Headers dari Digiflazz</div>
                <div className="space-y-2">
                  {[
                    { header:'X-Digiflazz-Event',  values:['create','update'],                              desc:'Jenis event transaksi' },
                    { header:'X-Hub-Signature',     values:['sha1=<hmac_hex>'],                              desc:'Verifikasi keaslian payload (jika ada secret)' },
                    { header:'User-Agent',          values:['Digiflazz-Hookshot','Digiflazz-Pasca-Hookshot'],desc:'Prepaid vs Postpaid' },
                    { header:'Content-Type',        values:['application/json'],                             desc:'Format payload' },
                  ].map(({ header, values, desc }) => (
                    <div key={header} className="p-3 rounded-xl flex items-start gap-3 flex-wrap"
                      style={{ background:'oklch(0.24 0.01 17.53)', border:'1px solid oklch(0.30 0.01 17.53)' }}>
                      <code style={{ color:'#a78bfa', fontSize:12, minWidth:200, fontWeight:700 }}>{header}</code>
                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {values.map(v => <Tag key={v} style={{ borderRadius:8, fontWeight:700, fontSize:11 }}>{v}</Tag>)}
                      </div>
                      <span style={{ color:'oklch(0.55 0 0)', fontSize:12 }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ color:'oklch(0.75 0 0)', fontWeight:700, marginBottom:10 }}>📄 Contoh Payload Webhook</div>
                <pre style={{ background:'oklch(0.16 0.01 17.53)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:14, padding:16, color:'#a78bfa', fontSize:12, lineHeight:1.7, overflowX:'auto', margin:0 }}>
{`POST /webhook/digiflazz HTTP/1.1
X-Digiflazz-Event: update
X-Hub-Signature: sha1=abc123...
User-Agent: Digiflazz-Hookshot
Content-Type: application/json

{
  "data": {
    "ref_id": "TRX-1234567890",
    "customer_no": "12345678_1234",
    "buyer_sku_code": "mlbb257diamond",
    "message": "Transaksi Sukses",
    "status": "Sukses",
    "rc": "00",
    "sn": "1234567890ABCDEF",
    "buyer_last_saldo": 950000,
    "price": 57000
  }
}`}
                </pre>
              </div>

              <div>
                <div style={{ color:'oklch(0.75 0 0)', fontWeight:700, marginBottom:10 }}>⚙️ Environment Variable</div>
                <pre style={{ background:'oklch(0.16 0.01 17.53)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:14, padding:16, color:'#4ade80', fontSize:12, lineHeight:1.7, margin:0 }}>
{`# .env (backend)
DIGIFLAZZ_WEBHOOK_SECRET=your_webhook_secret_dari_dashboard_digiflazz

# Tidak perlu jika tidak menggunakan signature verification`}
                </pre>
              </div>

              <Alert type="success" showIcon={false}
                message={
                  <div>
                    <div style={{ color:'#4ade80', fontWeight:700, marginBottom:4 }}>✅ Webhook Otomatis Update Transaksi</div>
                    <div style={{ color:'oklch(0.75 0 0)', fontSize:13 }}>
                      Saat Digiflazz mengirim webhook dengan status <code style={{color:'#4ade80'}}>Sukses</code>,
                      backend akan otomatis update status transaksi di database, memberikan reward points ke user,
                      dan broadcast notifikasi real-time ke admin panel via SSE.
                    </div>
                  </div>
                }
                style={{ borderRadius:14, background:'oklch(0.30 0.05 130 / 0.12)', borderColor:'oklch(0.55 0.10 130 / 0.25)' }}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ── Product Picker Modal ── */}
      <Modal
        className='bg-[#13131f] border-[rgba(255,255,255,0.10)]'
        open={pickerOpen}
        onCancel={() => { setPickerOpen(false); setPickerSearch(''); }}
        title={<span style={{ color:'white', fontWeight:800 }}>Pilih Produk</span>}
        footer={null}
        width={640}
      >
        <Search value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
          placeholder="Cari produk..." autoFocus className="mb-3" allowClear />

        {products.length === 0 ? (
          <div className="text-center py-8">
            <Text style={{ color:'#475569' }}>Muat daftar produk di tab "Produk" dulu</Text>
          </div>
        ) : (
          <div style={{ maxHeight:440, overflowY:'auto' }}>
            {products
              .filter(p => {
                const q = pickerSearch.toLowerCase();
                return !q || p.product_name.toLowerCase().includes(q) || p.buyer_sku_code.toLowerCase().includes(q);
              })
              .slice(0, 80)
              .map((p, i) => (
                <div key={i}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 mb-1"
                  onClick={() => { setTxSku(p.buyer_sku_code); setPickerOpen(false); setPickerSearch(''); toast.success(`SKU "${p.buyer_sku_code}" dipilih`); }}>
                  <div>
                    <div style={{ color:'#f1f5f9', fontWeight:700 }}>{p.product_name}</div>
                    <div style={{ color:'#64748b', fontSize:12 }}>{p.category} · {p.brand}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ color:'#fbbf24', fontWeight:800 }}>{formatCurrency(p.price)}</div>
                    <code style={{ color:'#a78bfa', fontSize:11 }}>{p.buyer_sku_code}</code>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </Modal>
    </div>
  );
}
