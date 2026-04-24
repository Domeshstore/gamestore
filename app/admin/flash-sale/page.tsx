'use client';
import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, InputNumber, DatePicker, Switch, Tag, Space, Row, Col, Typography, Select } from 'antd';
import { ThunderboltOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { flashSaleAPI, gamesAPI } from '@/lib/api/client';
import apiClient from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const cs = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:16 };

interface FlashVoucher { _id:string; name:string; code:string; price:number; gameId:{ name:string; slug:string }; flashSale:{ isActive:boolean; salePrice:number; startsAt:string|null; endsAt:string|null; stock:number; soldCount:number } }

export default function FlashSalePage() {
  const [sales,    setSales]    = useState<FlashVoucher[]>([]);
  const [vouchers, setVouchers] = useState<{_id:string;name:string;price:number;gameId:{name:string}}[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [selVoucher,setSelVoucher]=useState<string>('');
  const [form]    = Form.useForm();

  useEffect(() => {
    fetchSales();
    // Fetch vouchers for picker
    apiClient.get('/games/vouchers/all', { params: { limit:200 } }).then(r=>setVouchers(r.data.data??[])).catch(()=>{});
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try { setSales((await flashSaleAPI.getAll()).data.data??[]); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setSelVoucher('');
    form.resetFields();
    form.setFieldsValue({ isActive:true, stock:0 });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      if (!selVoucher) { toast.error('Pilih voucher'); return; }
      setSaving(true);
      await flashSaleAPI.setFlashSale(selVoucher, {
        isActive:  vals.isActive,
        salePrice: vals.salePrice,
        startsAt:  vals.startsAt?.toISOString() || null,
        endsAt:    vals.endsAt?.toISOString()   || null,
        stock:     vals.stock || 0,
      });
      toast.success('Flash Sale disimpan!');
      setModal(false);
      fetchSales();
    } catch(e:unknown) {
      if (!(e as {errorFields?:unknown}).errorFields) toast.error((e as {message?:string}).message||'Gagal');
    } finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    await flashSaleAPI.setFlashSale(id, { isActive:false, salePrice:0, startsAt:null, endsAt:null, stock:0 });
    toast.success('Flash Sale dihapus');
    fetchSales();
  };

  const cols = [
    { title:'Produk', key:'prod', render:(_:unknown,r:FlashVoucher)=>(
      <div><div style={{color:'white',fontWeight:700}}>{r.gameId?.name} — {r.name}</div><code style={{color:'#a78bfa',fontSize:11}}>{r.code}</code></div>
    )},
    { title:'Harga Normal', dataIndex:'price', key:'price', render:(v:number)=><span style={{color:'#94a3b8',textDecoration:'line-through'}}>{formatCurrency(v)}</span> },
    { title:'Harga Flash', key:'sale', render:(_:unknown,r:FlashVoucher)=><span style={{color:'#f87171',fontWeight:900,fontSize:16}}>{formatCurrency(r.flashSale.salePrice)}</span> },
    { title:'Diskon', key:'disc', render:(_:unknown,r:FlashVoucher)=>{
      const p=Math.round(((r.price-r.flashSale.salePrice)/r.price)*100);
      return <Tag color="red" style={{fontWeight:900,fontSize:13}}>-{p}%</Tag>;
    }},
    { title:'Berakhir', key:'ends', render:(_:unknown,r:FlashVoucher)=>(
      <div>
        <div style={{color:'white',fontWeight:600}}>{r.flashSale.endsAt ? new Date(r.flashSale.endsAt).toLocaleString('id-ID') : '—'}</div>
        {r.flashSale.stock>0 && <div style={{color:'oklch(0.55 0.01 17.53)',fontSize:11}}>Stock: {r.flashSale.soldCount}/{r.flashSale.stock}</div>}
      </div>
    )},
    { title:'Aksi', key:'act', render:(_:unknown,r:FlashVoucher)=>(
      <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>handleRemove(r._id)} style={{borderRadius:8}}>Hapus</Button>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{color:'white',marginBottom:4,fontWeight:900}}>⚡ Flash Sale</Title>
          <Text style={{color:'oklch(0.55 0.01 17.53)'}}>Promo terbatas waktu untuk voucher pilihan</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined/>} onClick={openCreate} style={{fontWeight:700,borderRadius:12,height:40}}>
          Tambah Flash Sale
        </Button>
      </div>

      <Card style={{...cs,background:'linear-gradient(135deg,oklch(0.28 0.08 30 / 0.3),oklch(0.24 0.02 45 / 0.2))',border:'1px solid oklch(0.65 0.15 30 / 0.3)'}}>
        <div className="flex items-center gap-3">
          <ThunderboltOutlined style={{color:'#f87171',fontSize:28}}/>
          <div>
            <div style={{color:'white',fontWeight:800,fontSize:16}}>{sales.length} Flash Sale Aktif</div>
            <div style={{color:'oklch(0.65 0.15 30)',fontSize:13}}>Harga spesial terbatas waktu — muncul di halaman depan & halaman games</div>
          </div>
        </div>
      </Card>

      <Card style={cs} bodyStyle={{padding:0}}>
        <Table dataSource={sales} columns={cols} rowKey="_id" loading={loading} size="middle" pagination={{pageSize:15}} scroll={{x:800}} />
      </Card>

      <Modal open={modal} title={<span style={{color:'white',fontWeight:900}}>⚡ Tambah Flash Sale</span>}
        onCancel={()=>setModal(false)} onOk={handleSave} okText="Simpan" cancelText="Batal" confirmLoading={saving} width={520}
        styles={{content:{background:'oklch(0.27 0.01 17.95)',border:'1px solid oklch(0.35 0.02 34.90)'},header:{background:'oklch(0.27 0.01 17.95)'}}}>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label={<span style={{color:'oklch(0.65 0.01 17.53)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Pilih Voucher</span>} required>
            <Select showSearch value={selVoucher} onChange={setSelVoucher} size="large"
              placeholder="Cari voucher..." optionFilterProp="label"
              options={vouchers.map(v=>({ value:v._id, label:`${v.gameId?.name??'—'} — ${v.name} (${formatCurrency(v.price)})` }))} />
          </Form.Item>
          <Form.Item name="salePrice" label={<span style={{color:'oklch(0.65 0.01 17.53)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Harga Flash Sale</span>} rules={[{required:true}]}>
            <InputNumber size="large" style={{width:'100%'}} min={0}
              formatter={v=>`Rp ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')}
              parser={v=>Number(String(v).replace(/[Rp,\s]/g,''))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="startsAt" label={<span style={{color:'oklch(0.65 0.01 17.53)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Mulai</span>}>
                <DatePicker size="large" style={{width:'100%'}} showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endsAt" label={<span style={{color:'oklch(0.65 0.01 17.53)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Berakhir *</span>} rules={[{required:true}]}>
                <DatePicker size="large" style={{width:'100%'}} showTime format="DD/MM/YYYY HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="stock" label={<span style={{color:'oklch(0.65 0.01 17.53)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em'}}>Batas Stock (0 = tidak terbatas)</span>}>
            <InputNumber size="large" style={{width:'100%'}} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
