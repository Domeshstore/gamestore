'use client';

import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select,
  Switch, Space, DatePicker, Typography, Row, Col, Statistic, Tooltip, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  GiftOutlined, TagOutlined, ThunderboltOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { promoAPI, gamesAPI } from '@/lib/api/client';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Promo {
  _id: string;
  name: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'first_transaction';
  value: number;
  maxDiscount: number;
  minOrder: number;
  scope: 'all' | 'category' | 'product';
  categories: string[];
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  startsAt: string;
  expiresAt: string | null;
  isActive: boolean;
  isAutoApply: boolean;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  percentage:       { label: '% Persentase',     color: 'blue' },
  fixed:            { label: 'Rp Nominal Tetap', color: 'green' },
  first_transaction:{ label: '🎁 Pengguna Baru', color: 'gold' },
};

const cardStyle = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:16 };

export default function AdminPromoPage() {
  const [promos,    setPromos]    = useState<Promo[]>([]);
  const [games,     setGames]     = useState<{ _id:string; name:string; category:string }[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editPromo, setEditPromo] = useState<Promo | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [form]      = Form.useForm();

  useEffect(() => {
    fetchPromos();
    gamesAPI.getAll({ limit: 100 }).then(r => setGames(r.data.data ?? []));
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await promoAPI.getAll({ limit: 50 });
      setPromos(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditPromo(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'percentage', scope: 'all', value: 10,
      maxDiscount: 50000, minOrder: 0,
      usageLimit: 0, perUserLimit: 1,
      isActive: true, isAutoApply: false,
      startsAt: dayjs(),
    });
    setModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditPromo(p);
    form.setFieldsValue({
      ...p,
      startsAt: p.startsAt  ? dayjs(p.startsAt) : dayjs(),
      expiresAt:p.expiresAt ? dayjs(p.expiresAt) : null,
    });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const payload = {
        ...vals,
        code:      (vals.code as string).toUpperCase().trim(),
        startsAt:  vals.startsAt  ? vals.startsAt.toISOString()  : new Date().toISOString(),
        expiresAt: vals.expiresAt ? vals.expiresAt.toISOString() : null,
      };
      if (editPromo) {
        await promoAPI.update(editPromo._id, payload);
        toast.success('Promo diperbarui!');
      } else {
        await promoAPI.create(payload);
        toast.success('Promo dibuat!');
      }
      setModal(false);
      fetchPromos();
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return; // validation error
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    Modal.confirm({
      title: 'Hapus Promo?',
      content: `Yakin ingin menghapus promo "${name}"?`,
      okType: 'danger',
      okText: 'Hapus',
      cancelText: 'Batal',
      onOk: async () => {
        await promoAPI.delete(id);
        toast.success('Promo dihapus');
        fetchPromos();
      },
    });
  };

  const toggleActive = async (p: Promo) => {
    await promoAPI.update(p._id, { isActive: !p.isActive });
    toast.success(p.isActive ? 'Promo dinonaktifkan' : 'Promo diaktifkan');
    fetchPromos();
  };

  // Stats
  const active  = promos.filter(p => p.isActive).length;
  const expired = promos.filter(p => p.expiresAt && new Date(p.expiresAt) < new Date()).length;
  const totalUsed = promos.reduce((s, p) => s + p.usedCount, 0);

  const cols = [
    {
      title: 'Promo', key: 'promo',
      render: (_: unknown, p: Promo) => (
        <div>
          <div style={{ color:'white', fontWeight:700 }}>{p.name}</div>
          <code style={{ color:'oklch(0.92 0.06 67.02)', fontSize:13, fontWeight:900, letterSpacing:'0.05em' }}>{p.code}</code>
          {p.isAutoApply && <Tag color="gold" style={{ marginLeft:6, fontSize:10 }}>AUTO</Tag>}
        </div>
      ),
    },
    {
      title: 'Tipe', key: 'type',
      render: (_: unknown, p: Promo) => {
        const t = TYPE_LABELS[p.type];
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    {
      title: 'Nilai', key: 'value',
      render: (_: unknown, p: Promo) => (
        <div>
          <span style={{ color:'oklch(0.92 0.06 67.02)', fontWeight:800, fontSize:16 }}>
            {p.type === 'fixed' ? formatCurrency(p.value) : `${p.value}%`}
          </span>
          {(p.type === 'percentage' || p.type === 'first_transaction') && p.maxDiscount > 0 && (
            <div style={{ color:'oklch(0.55 0.01 17.53)', fontSize:11 }}>
              Maks. {formatCurrency(p.maxDiscount)}
            </div>
          )}
          {p.minOrder > 0 && (
            <div style={{ color:'oklch(0.55 0.01 17.53)', fontSize:11 }}>
              Min. {formatCurrency(p.minOrder)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Penggunaan', key: 'usage',
      render: (_: unknown, p: Promo) => (
        <div>
          <span style={{ color:'white', fontWeight:700 }}>{p.usedCount}</span>
          {p.usageLimit > 0 && <span style={{ color:'oklch(0.55 0.01 17.53)' }}> / {p.usageLimit}</span>}
          <div style={{ color:'oklch(0.55 0.01 17.53)', fontSize:11 }}>Maks {p.perUserLimit}×/user</div>
        </div>
      ),
    },
    {
      title: 'Berlaku', key: 'validity',
      render: (_: unknown, p: Promo) => {
        const now = new Date();
        const exp = p.expiresAt ? new Date(p.expiresAt) : null;
        const isExpired = exp && exp < now;
        return (
          <div>
            <div style={{ color:'oklch(0.75 0 0)', fontSize:12 }}>
              {formatDate(p.startsAt).slice(0,10)}
            </div>
            {exp ? (
              <div style={{ color: isExpired ? 'oklch(0.65 0.15 30)' : 'oklch(0.75 0 0)', fontSize:12 }}>
                s/d {formatDate(p.expiresAt!).slice(0,10)}
                {isExpired && ' (Kadaluarsa)'}
              </div>
            ) : (
              <div style={{ color:'oklch(0.55 0.01 17.53)', fontSize:12 }}>Tidak ada batas</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status', key: 'status',
      render: (_: unknown, p: Promo) => (
        <Switch checked={p.isActive} onChange={() => toggleActive(p)}
          checkedChildren="Aktif" unCheckedChildren="OFF" />
      ),
    },
    {
      title: 'Aksi', key: 'action',
      render: (_: unknown, p: Promo) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(p)} style={{ borderRadius:8, fontWeight:700 }}>Edit</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(p._id, p.name)} style={{ borderRadius:8 }} />
        </Space>
      ),
    },
  ];

  const watchType  = Form.useWatch('type',  form);
  const watchScope = Form.useWatch('scope', form);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ color:'white', marginBottom:4, fontWeight:900 }}>🏷️ Manajemen Promo</Title>
          <Text style={{ color:'oklch(0.55 0.01 17.53)', fontSize:13 }}>Buat & kelola kode promo dan diskon produk</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ fontWeight:700, borderRadius:12, height:40 }}>
          Buat Promo Baru
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]}>
        {[
          { title:'Total Promo', value:promos.length, icon:<TagOutlined />, color:'oklch(0.92 0.06 67.02)' },
          { title:'Aktif',       value:active,         icon:<CheckCircleOutlined />, color:'oklch(0.55 0.15 145)' },
          { title:'Total Pakai', value:totalUsed,      icon:<ThunderboltOutlined />, color:'oklch(0.65 0.12 220)' },
          { title:'Kadaluarsa',  value:expired,        icon:<CalendarOutlined />,    color:'oklch(0.65 0.15 30)' },
        ].map(({ title, value, icon, color }) => (
          <Col key={title} xs={12} lg={6}>
            <Card style={cardStyle}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background:`${color} / 0.15`, border:`1px solid ${color} / 0.25`, color }}>
                  {icon}
                </div>
                <div>
                  <div style={{ color:'oklch(0.55 0.01 17.53)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{title}</div>
                  <div style={{ color:'white', fontWeight:900, fontSize:22 }}>{value}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* First Transaction Promo Alert */}
      {promos.some(p => p.type === 'first_transaction' && p.isActive) && (
        <Alert
          type="success" showIcon={false}
          message={
            <div className="flex items-center gap-3">
              <GiftOutlined style={{ color:'#fbbf24', fontSize:18 }} />
              <div>
                <span style={{ color:'#fbbf24', fontWeight:700 }}>Promo Pengguna Baru Aktif: </span>
                <span style={{ color:'oklch(0.75 0 0)', fontSize:13 }}>
                  {promos.find(p => p.type === 'first_transaction' && p.isActive)?.name} —
                  Kode: <strong style={{ color:'white' }}>{promos.find(p => p.type === 'first_transaction' && p.isActive)?.code}</strong>
                </span>
              </div>
            </div>
          }
          style={{ borderRadius:14, background:'oklch(0.92 0.06 67.02 / 0.08)', borderColor:'oklch(0.92 0.06 67.02 / 0.20)' }}
        />
      )}

      {/* Table */}
      <Card style={cardStyle} bodyStyle={{ padding:0 }}>
        <Table dataSource={promos} columns={cols} rowKey="_id" loading={loading}
          size="middle" scroll={{ x:900 }}
          pagination={{ pageSize:15, showSizeChanger:false }}
        />
      </Card>

      {/* ── MODAL ── */}
      <Modal
        open={modal}
        title={<span style={{ color:'white', fontWeight:900, fontSize:17 }}>{editPromo ? '✏️ Edit Promo' : '➕ Buat Promo Baru'}</span>}
        onCancel={() => setModal(false)}
        onOk={handleSave}
        okText={saving ? 'Menyimpan...' : 'Simpan'}
        cancelText="Batal"
        confirmLoading={saving}
        width={640}
        
        styles={{ body:{ background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.35 0.02 34.90)' }, header:{ background:'oklch(0.27 0.01 17.95)' } }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="name" label="Nama Promo" rules={[{ required:true }]}>
                <Input placeholder="Diskon Hari Kemerdekaan" size="large" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="code" label="Kode Promo" rules={[{ required:true }]}>
                <Input placeholder="MERDEKA17" size="large"
                  onChange={e => form.setFieldValue('code', e.target.value.toUpperCase())} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} placeholder="Deskripsi singkat promo..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
            {/* Inside the <Form> modal, replace the existing "value" Form.Item with this: */}
<Form.Item name="value" label={watchType === 'fixed' ? 'Nominal Diskon (Rp)' : 'Persentase Diskon (%)'} rules={[{ required: true }]}>
  {watchType === 'fixed' ? (
    <InputNumber
      size="large"
      style={{ width: '100%' }}
      min={0}
      formatter={v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={v => {
        const numeric = parseFloat(String(v).replace(/[Rp,\s]/g, ''));
        return isNaN(numeric) ? 0 : numeric;
      }}
    />
  ) : (
    <InputNumber
      size="large"
      style={{ width: '100%' }}
      min={0}
      max={100}
      formatter={v => `${v}%`}
      parser={v => {
        const numeric = parseFloat(String(v).replace(/[%,\s]/g, ''));
        return isNaN(numeric) ? 0 : numeric;
      }}
    />
  )}
</Form.Item>
            </Col>
          </Row>

          {watchType !== 'fixed' && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="maxDiscount" label="Maksimum Diskon (Rp) — 0 = tidak ada batas">
                  <InputNumber size="large" style={{ width:'100%' }} min={0}
                    formatter={v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
                    parser={displayValue => Number(String(displayValue).replace(/[Rp,\s]/g, ''))} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="minOrder" label="Minimum Order (Rp)">
                  <InputNumber size="large" style={{ width:'100%' }} min={0}
                    formatter={v => `Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
                    parser={v => Number(String(v).replace(/[Rp,\s]/g, ''))} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="usageLimit" label="Batas Penggunaan Total (0 = tidak terbatas)">
                <InputNumber size="large" style={{ width:'100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="perUserLimit" label="Maks. Pemakaian per User">
                <InputNumber size="large" style={{ width:'100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          {/* Scope */}
          <Form.Item name="scope" label="Berlaku untuk">
            <Select size="large">
              <Select.Option value="all">Semua Produk</Select.Option>
              <Select.Option value="category">Kategori Tertentu</Select.Option>
              <Select.Option value="product">Produk Tertentu</Select.Option>
            </Select>
          </Form.Item>

          {watchScope === 'category' && (
            <Form.Item name="categories" label="Pilih Kategori">
              <Select mode="multiple" size="large" placeholder="Pilih kategori...">
                {['game','pulsa','e-money','streaming','voucher'].map(c => (
                  <Select.Option key={c} value={c}>{c}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          {watchScope === 'product' && (
            <Form.Item name="productIds" label="Pilih Produk">
              <Select mode="multiple" size="large" placeholder="Cari produk..." showSearch
                optionFilterProp="label"
                options={games.map(g => ({ value: g._id, label: g.name }))} />
            </Form.Item>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="startsAt" label="Tanggal Mulai">
                <DatePicker size="large" style={{ width:'100%' }} showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiresAt" label="Tanggal Berakhir (kosong = tidak ada batas)">
                <DatePicker size="large" style={{ width:'100%' }} showTime format="DD/MM/YYYY HH:mm" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isActive" label="Status" valuePropName="checked">
                <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isAutoApply" label="Auto Apply" valuePropName="checked"
                tooltip="Otomatis diterapkan saat checkout tanpa perlu input kode">
                <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
