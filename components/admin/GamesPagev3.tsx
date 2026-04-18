'use client';

import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, Switch,
  Space, Typography, Row, Col, InputNumber, Tooltip, Upload,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { Gamepad2, Smartphone, CreditCard, Tv, Gift, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { gamesAPI, settingsAPI } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

interface Game {
  _id: string; 
  name: string; 
  slug: string; 
  category: string;
  productType: string; 
  publisher: string; 
  provider: string;
  gameCode: string; 
  isActive: boolean; 
  isFeatured: boolean;
  requiresServerId: boolean; 
  userIdLabel: string; 
  serverIdLabel: string;
  sortOrder: number; 
  image: string;
}

const PRODUCT_TYPES = [
  { value:'game',       label:'🎮 Game',        desc:'ML, FF, PUBG, dll' },
  { value:'pulsa',      label:'📱 Pulsa',        desc:'Pulsa semua operator' },
  { value:'paket_data', label:'📶 Paket Data',   desc:'Paket internet' },
  { value:'e_money',    label:'💳 E-Money',      desc:'GoPay, OVO, Dana, dll' },
  { value:'streaming',  label:'🎬 Streaming',    desc:'Netflix, Spotify, dll' },
  { value:'voucher',    label:'🎁 Voucher',      desc:'Gift card, dll' },
  { value:'pln',      label:'🗼 PLN',      desc:'Token PLN' },

  { value:'other',      label:'📦 Lainnya',      desc:'Produk lainnya' },
];

const TYPE_COLORS: Record<string, string> = {
  game:'purple', pulsa:'blue', paket_data:'cyan', pln:'orange',
  e_money:'gold', streaming:'red', voucher:'green', other:'default',
};

const cardStyle = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:16 };

export default function AdminGamesPage() {
  const [games,    setGames]    = useState<Game[]>([]);
  const [cats,     setCats]     = useState<{ slug:string; name:string; icon:string }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [form]     = Form.useForm();
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchGames(page, filterType);
    settingsAPI.getCategories().then(r => setCats(r.data.data ?? []));
  }, [page, filterType]);

  const fetchGames = async (p: number, type: string) => {
    setLoading(true);
    try {
      const res = await gamesAPI.getAll({
        page: p, limit: 15,
        ...(type && { productType: type }),
      });
      setGames(res.data.data ?? []);
      setTotal(res.data.pagination?.total ?? 0);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditGame(null);
    form.resetFields();
    form.setFieldsValue({
      productType:'game', provider:'digiflazz', category:'game',
      isActive:true, isFeatured:false, requiresServerId:false,
      userIdLabel:'Nomor / ID', serverIdLabel:'Server ID',
      sortOrder:0,
    });
    setModal(true);
  };

  const openEdit = (g: Game) => { setEditGame(g); form.setFieldsValue(g); setModal(true); };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      if (editGame) {
        await gamesAPI.update(editGame._id, vals);
        toast.success('Produk diperbarui!');
      } else {
        await gamesAPI.create(vals);
        toast.success('Produk dibuat!');
      }
      setModal(false);
      fetchGames(page, filterType);
    } catch (err) {
      if ((err as { errorFields?: unknown }).errorFields) return;
      toast.error(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title:'Hapus Produk?', content:`Hapus "${name}"?`,
      okType:'danger', okText:'Hapus', cancelText:'Batal',
      onOk: async () => {
        await gamesAPI.delete(id);
        toast.success('Produk dihapus');
        fetchGames(page, filterType);
      },
    });
  };

  const watchType = Form.useWatch('productType', form);

  const cols = [
    {
      title:'Produk', key:'product',
      render: (_: unknown, g: Game) => (
        <div className="flex items-center gap-3">
          {g.image ? (
            <img src={g.image} alt={g.name} className="w-9 h-9 rounded-xl object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
              style={{ background:'oklch(0.92 0.06 67.02 / 0.12)', border:'1px solid oklch(0.92 0.06 67.02 / 0.20)' }}>
              {PRODUCT_TYPES.find(t => t.value === g.productType)?.label[0] ?? '📦'}
            </div>
          )}
          <div>
            <div style={{ color:'white', fontWeight:700 }}>{g.name}</div>
            <code style={{ color:'oklch(0.55 0.01 17.53)', fontSize:11 }}>{g.slug}</code>
          </div>
        </div>
      ),
    },
    {
      title:'Tipe', key:'type',
      render: (_: unknown, g: Game) => (
        <Tag color={TYPE_COLORS[g.productType] ?? 'default'}>
          {PRODUCT_TYPES.find(t => t.value === g.productType)?.label ?? g.productType}
        </Tag>
      ),
    },
    { title:'Kategori', dataIndex:'category', key:'cat',
      render:(v:string) => <Tag>{v}</Tag> },
    { title:'Game Code', dataIndex:'gameCode', key:'code',
      render:(v:string) => <code style={{ color:'#a78bfa', fontSize:12 }}>{v}</code> },
    { title:'Provider', dataIndex:'provider', key:'prov',
      render:(v:string) => <Tag color={v==='digiflazz'?'purple':v==='apigames'?'blue':'green'}>{v}</Tag> },
    {
      title:'Status', key:'status',
      render: (_: unknown, g: Game) => (
        <Space direction="vertical" size={2}>
          <Tag color={g.isActive ? 'success' : 'error'} style={{ fontSize:11 }}>
            {g.isActive ? 'Aktif' : 'Nonaktif'}
          </Tag>
          {g.isFeatured && <Tag color="gold" style={{ fontSize:11 }}>Featured</Tag>}
        </Space>
      ),
    },
    {
      title:'Aksi', key:'action',
      render: (_: unknown, g: Game) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(g)} style={{ borderRadius:8, fontWeight:700 }}>Edit</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(g._id, g.name)} style={{ borderRadius:8 }} />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ color:'white', marginBottom:4, fontWeight:900 }}>🛍️ Manajemen Produk</Title>
          <Text style={{ color:'oklch(0.55 0.01 17.53)', fontSize:13 }}>{total} produk terdaftar</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}
          style={{ fontWeight:700, borderRadius:12, height:40 }}>Tambah Produk</Button>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setFilterType(''); setPage(1); }}
          className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
          style={!filterType
            ? { background:'oklch(0.92 0.06 67.02)', color:'oklch(0.16 0.01 17.53)' }
            : { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.35 0.02 34.90)', color:'oklch(0.75 0 0)' }}>
          Semua
        </button>
        {PRODUCT_TYPES.map(t => (
          <button key={t.value} onClick={() => { setFilterType(t.value); setPage(1); }}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold transition-all"
            style={filterType === t.value
              ? { background:'oklch(0.92 0.06 67.02)', color:'oklch(0.16 0.01 17.53)' }
              : { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.35 0.02 34.90)', color:'oklch(0.75 0 0)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <Card style={cardStyle} bodyStyle={{ padding:0 }}>
        <Table dataSource={games} columns={cols} rowKey="_id" loading={loading}
          size="middle" scroll={{ x:900 }}
          pagination={{ current:page, total, pageSize:15, showSizeChanger:false, onChange:setPage }} />
      </Card>

      {/* ── MODAL ── */}
      <Modal
        open={modal}
        title={<span style={{ color:'white', fontWeight:900, fontSize:17 }}>{editGame ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}</span>}
        onCancel={() => setModal(false)}
        onOk={handleSave}
        okText={saving ? 'Menyimpan...' : 'Simpan'}
        cancelText="Batal"
        confirmLoading={saving}
        width={680}
        
        styles={{ body:{ background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.35 0.02 34.90)' }, header:{ background:'oklch(0.27 0.01 17.95)' } }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {/* Product Type */}
          <Form.Item name="productType" label="Tipe Produk" rules={[{ required:true }]}>
            <Select size="large" onChange={() => {
              // Auto-set sensible defaults based on product type
              const type = form.getFieldValue('productType');
              if (type === 'pulsa' || type === 'e_money') {
                form.setFieldsValue({ userIdLabel:'Nomor HP', requiresServerId:false, 
                  category: type === 'e_money' ? 'e-money' : 'pulsa' });
              } else if (type === 'streaming') {
                form.setFieldsValue({ userIdLabel:'Email Akun', requiresServerId:false, category:'streaming' });
              } else if (type === 'game') {
                form.setFieldsValue({ userIdLabel:'User ID', category:'game' });
              } else if (type === 'pln') {
                form.setFieldsValue({ userIdLabel:'Nomor Meter', requiresServerId:false, category:'pln' });
              } else if (type === 'streaming') {
                form.setFieldsValue({ userIdLabel:'Email Akun', requiresServerId:false, category:'streaming' });
              }
            }}>
              {PRODUCT_TYPES.map(t => (
                <Select.Option key={t.value} value={t.value}>
                  <div>{t.label} <span style={{ color:'oklch(0.55 0.01 17.53)', fontSize:12 }}>— {t.desc}</span></div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="name" label="Nama Produk" rules={[{ required:true }]}>
                <Input size="large" placeholder="Contoh: Mobile Legends, Telkomsel, GoPay" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="gameCode" label="Game / Product Code" rules={[{ required:true }]}>
                <Input size="large" placeholder="MLBB, TSEL, GOPAY" style={{ textTransform:'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="publisher" label="Publisher / Operator">
                <Input size="large" placeholder="Moonton, Telkomsel, Gojek" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Kategori (slug)" rules={[{ required:true }]}>
                <Select size="large" showSearch>
                  {cats.map(c => <Select.Option key={c.slug} value={c.slug}>{c.icon} {c.name}</Select.Option>)}
                  <Select.Option value="game">🎮 game</Select.Option>
                  <Select.Option value="pulsa">📱 pulsa</Select.Option>
                  <Select.Option value="pln">🗼 pln</Select.Option>
                  <Select.Option value="e-money">💳 e-money</Select.Option>
                  <Select.Option value="streaming">🎬 streaming</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="provider" label="Provider" rules={[{ required:true }]}>
                <Select size="large">
                  <Select.Option value="digiflazz">Digiflazz</Select.Option>
                  <Select.Option value="apigames">Apigames</Select.Option>
                  <Select.Option value="both">Keduanya</Select.Option>
                  <Select.Option value="manual">Manual</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="userIdLabel" label="Label Input User">
                <Input size="large" placeholder="User ID / Nomor HP / Email" />
              </Form.Item>
            </Col>
          </Row>

          {/* Server ID only for games */}
          {watchType === 'game' && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="requiresServerId" label="Perlu Server ID?" valuePropName="checked">
                  <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="serverIdLabel" label="Label Server ID">
                  <Input size="large" placeholder="Zone ID, Server" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="image" label="URL Gambar/Logo">
            <Input size="large" placeholder="https://..." />
          </Form.Item>

          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} placeholder="Deskripsi singkat produk..." />
          </Form.Item>

          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="sortOrder" label="Urutan Tampil">
                <InputNumber size="large" style={{ width:'100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="Status" valuePropName="checked">
                <Switch checkedChildren="Aktif" unCheckedChildren="OFF" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isFeatured" label="Tampilkan Featured" valuePropName="checked">
                <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
