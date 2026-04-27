'use client';

import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker,
  Tag, Space, Popconfirm, message, Tabs, Statistic, Row, Col, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, GiftOutlined,
  TrophyOutlined, FireOutlined, CopyOutlined
} from '@ant-design/icons';
import { adminAPI, treasureAPI } from '@/lib/api/client';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const { TextArea } = Input;
const { Option } = Select;

export default function AdminTreasurePage() {
  const [treasures, setTreasures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTreasure, setEditingTreasure] = useState<any>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState<any>(null);

  const fetchTreasures = async () => {
    setLoading(true);
    try {
      const res = await treasureAPI.getAdminList();
      setTreasures(res.data.data);
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await treasureAPI.getAdminStats();
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTreasures();
    fetchStats();
  }, []);

  const handleCreate = () => {
    setEditingTreasure(null);
    form.resetFields();
    form.setFieldsValue({
      coinsAmount: 100,
      totalUses: 1,
      rarity: 'common',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingTreasure(record);
    form.setFieldsValue({
      ...record,
      expiresAt: record.expiresAt ? dayjs(record.expiresAt) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await treasureAPI.deleteAdminTreasure(id);
      toast.success('Harta karun dihapus');
      fetchTreasures();
      fetchStats();
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingTreasure) {
        await treasureAPI.updateAdminTreasure(editingTreasure._id, values);
        toast.success('Harta karun diupdate');
      } else {
        await treasureAPI.createAdminTreasure(values);
        toast.success('Harta karun dibuat!');
      }
      setModalVisible(false);
      fetchTreasures();
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kode disalin!');
  };

  const columns = [
    {
      title: 'Kode',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <code style={{ background: '#1e1e2e', padding: '4px 8px', borderRadius: 8, color: '#fbbf24' }}>
            {code}
          </code>
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyCode(code)} />
        </Space>
      ),
    },
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Koin',
      dataIndex: 'coinsAmount',
      key: 'coinsAmount',
      render: (val: number) => <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{val.toLocaleString()}</span>,
    },
    {
      title: 'Kelangkaan',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity: string) => {
        const colors: any = { common: 'default', rare: 'blue', epic: 'purple', legendary: 'gold' };
        return <Tag color={colors[rarity]}>{rarity.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Terpakai',
      key: 'used',
      render: (_: any, record: any) => `${record.usedCount}/${record.totalUses}`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Badge status={active ? 'success' : 'default'} text={active ? 'Aktif' : 'Nonaktif'} />
      ),
    },
    {
      title: 'Expired',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Yakin hapus?" onConfirm={() => handleDelete(record._id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Harta Karun" value={stats.totalTreasures} prefix={<GiftOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Aktif" value={stats.activeTreasures} prefix={<FireOutlined />} valueStyle={{ color: '#3b82f6' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Klaim" value={stats.totalClaimed} prefix={<TrophyOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Delta Coins Terdistribusi" 
                value={stats.totalCoinsDistributed} 
                prefix="💰" 
                valueStyle={{ color: '#fbbf24' }}
                formatter={(v) => `${Number(v).toLocaleString()}`}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Treasure List */}
      <Card
        title="Manajemen Harta Karun"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Buat Harta Karun</Button>}
      >
        <Table
          columns={columns}
          dataSource={treasures}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingTreasure ? 'Edit Harta Karun' : 'Buat Harta Karun Baru'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingTreasure && (
            <Form.Item name="code" label="Kode (kosongkan untuk auto-generate)">
              <Input placeholder="Contoh: DELTA-ABCD-1234" />
            </Form.Item>
          )}
          
          <Form.Item name="name" label="Nama Harta Karun" rules={[{ required: true }]}>
            <Input placeholder="Contoh: Harta Karun Legendary" />
          </Form.Item>
          
          <Form.Item name="description" label="Deskripsi">
            <TextArea rows={2} placeholder="Deskripsi harta karun..." />
          </Form.Item>
          
          <Form.Item name="coinsAmount" label="Jumlah Delta Coins" rules={[{ required: true }]}>
            <InputNumber min={1} max={1000000} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="totalUses" label="Maksimal Penggunaan">
            <InputNumber min={1} max={9999} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="rarity" label="Kelangkaan">
            <Select>
              <Option value="common">Biasa</Option>
              <Option value="rare">Langka</Option>
              <Option value="epic">Epik</Option>
              <Option value="legendary">Legendaris</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="expiresAt" label="Kadaluarsa (opsional)">
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="icon" label="Icon (emoji)">
            <Input placeholder="🎁" maxLength={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}