'use client';
import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Tag, Space, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { newsAPI } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;
const cs = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:16 };

const CAT_COLORS: Record<string,string> = { promo:'red', update:'blue', tips:'green', event:'orange', general:'default' };
const CAT_LABELS: Record<string,string> = { promo:'🏷️ Promo', update:'🔔 Update', tips:'💡 Tips', event:'🎉 Event', general:'📰 Umum' };

interface NewsItem { _id:string; title:string; slug:string; excerpt:string; content:string; coverImage:string; category:string; tags:string[]; isPublished:boolean; isPinned:boolean; viewCount:number; publishedAt:string|null; createdAt:string; author?:{name:string} }

export default function AdminNewsPage() {
  const [news,    setNews]    = useState<NewsItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [preview, setPreview] = useState<NewsItem|null>(null);
  const [edit,    setEdit]    = useState<NewsItem|null>(null);
  const [saving,  setSaving]  = useState(false);
  
  const [form]   = Form.useForm();

  useEffect(() => { fetchNews(page); }, [page]);

  const fetchNews = async (p:number) => {
    setLoading(true);
    try {
      const res = await newsAPI.adminAll({ page:p, limit:15 });
      setNews(res.data.data??[]);
      setTotal(res.data.pagination?.total??0);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEdit(null); form.resetFields();
    form.setFieldsValue({ category:'general', isPublished:false, isPinned:false });
    setModal(true);
  };

  const openEdit = (n:NewsItem) => {
    setEdit(n);
    form.setFieldsValue({ ...n, tags: n.tags?.join(',') });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const payload = { ...vals, tags: vals.tags ? String(vals.tags).split(',').map((t:string)=>t.trim()).filter(Boolean) : [] };
      if (edit) { await newsAPI.update(edit._id, payload); toast.success('News diperbarui!'); }
      else      { await newsAPI.create(payload); toast.success('News dibuat!'); }
      setModal(false); fetchNews(page);
    } catch(e:unknown) {
      if (!(e as {errorFields?:unknown}).errorFields) toast.error((e as {message?:string}).message||'Gagal');
    } finally { setSaving(false); }
  };

  const handleDelete = (id:string, title:string) => {
    Modal.confirm({ title:'Hapus News?', content:`Hapus "${title}"?`, okType:'danger', okText:'Hapus', cancelText:'Batal',
      onOk: async () => { await newsAPI.delete(id); toast.success('Dihapus'); fetchNews(page); } });
  };

  const togglePublish = async (n:NewsItem) => {
    await newsAPI.update(n._id, { isPublished: !n.isPublished });
    toast.success(n.isPublished ? 'Dipublikasikan' : 'Disembunyikan');
    fetchNews(page);
  };

  const cols = [
    { title:'Judul', key:'title', render:(_:unknown,n:NewsItem)=>(
      <div className="flex items-start gap-3">
        {n.coverImage && <img src={n.coverImage} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />}
        <div>
          <div style={{color:'white',fontWeight:700}}>{n.isPinned?'📌 ':''}{n.title}</div>
          <div style={{color:'oklch(0.55 0.01 17.53)',fontSize:12}}>{n.excerpt?.slice(0,60)}{n.excerpt?.length>60?'...':''}</div>
        </div>
      </div>
    )},
    { title:'Kategori', dataIndex:'category', key:'cat', render:(v:string)=><Tag color={CAT_COLORS[v]}>{CAT_LABELS[v]??v}</Tag> },
    { title:'Status', key:'status', render:(_:unknown,n:NewsItem)=>(
      <Space orientation="vertical" size={2}>
        <Tag color={n.isPublished?'success':'default'}>{n.isPublished?'Publik':'Draft'}</Tag>
        {n.isPublished && <span style={{color:'oklch(0.55 0.01 17.53)',fontSize:11}}>👁️ {n.viewCount}</span>}
      </Space>
    )},
    { title:'Tanggal', key:'date', render:(_:unknown,n:NewsItem)=><span style={{color:'oklch(0.65 0.01 17.53)',fontSize:12}}>{formatDate(n.createdAt).slice(0,10)}</span> },
    { title:'Aksi', key:'act', render:(_:unknown,n:NewsItem)=>(
      <Space>
        <Button size="small" icon={<EyeOutlined/>} onClick={()=>setPreview(n)} style={{borderRadius:8}}>Preview</Button>
        <Button size="small" icon={<EditOutlined/>} onClick={()=>openEdit(n)} style={{borderRadius:8}}>Edit</Button>
        <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>handleDelete(n._id,n.title)} style={{borderRadius:8}}/>
      </Space>
    )},
  ];

  const labelStyle = { color:'oklch(0.65 0.01 17.53)', fontSize:11, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.05em' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{color:'white',marginBottom:4,fontWeight:900}}>📰 Manajemen News</Title>
          <Text style={{color:'oklch(0.55 0.01 17.53)'}}>{total} artikel tersedia</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined/>} onClick={openCreate} style={{fontWeight:700,borderRadius:12,height:40}}>Buat Artikel</Button>
      </div>

      <Card style={cs} title={<span style={{color:'white',fontWeight:800}}>📋 Daftar Artikel</span>}>
        <Table dataSource={news} columns={cols} rowKey="_id" loading={loading} size="middle"
          pagination={{current:page,total,pageSize:15,showSizeChanger:false,onChange:setPage}} scroll={{x:700}} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal 
  open={modal} 
  title={<span style={{color:'white',fontWeight:900}}>{edit?'✏️ Edit':'➕ Buat'} Artikel</span>}
  onCancel={() => {
    setModal(false);
    form.resetFields(); // Reset fields saat tutup
  }} 
  onOk={handleSave} 
  okText="Simpan" 
  cancelText="Batal"
  confirmLoading={saving} 
  width={700}
  destroyOnHidden  // 🔥 TAMBAHKAN INI - hancurkan form saat modal ditutup

>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label={<span style={labelStyle}>Judul *</span>} rules={[{required:true}]}>
            <Input size="large" placeholder="Judul artikel menarik" />
          </Form.Item>
          <Form.Item name="excerpt" label={<span style={labelStyle}>Ringkasan / Excerpt</span>}>
            <Input.TextArea rows={2} placeholder="Ringkasan singkat yang muncul di list news..." />
          </Form.Item>
          <Form.Item name="coverImage" label={<span style={labelStyle}>URL Gambar Cover</span>}>
            <Input size="large" placeholder="https://..." />
          </Form.Item>
          {form.getFieldValue('coverImage') && (
            <div className="mb-3">
              <img src={form.getFieldValue('coverImage')} alt="cover" className="w-full max-h-40 object-cover rounded-xl" />
            </div>
          )}
          <Form.Item name="content" label={<span style={labelStyle}>Konten (Markdown/HTML) *</span>} rules={[{required:true}]}>
            <Input.TextArea rows={8} placeholder="Tulis konten artikel di sini... Mendukung HTML sederhana." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="category" label={<span style={labelStyle}>Kategori</span>}>
              <Select size="large">
                {Object.entries(CAT_LABELS).map(([k,v])=><Select.Option key={k} value={k}>{v}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="tags" label={<span style={labelStyle}>Tags (pisah dengan koma)</span>}>
              <Input size="large" placeholder="promo, ml, free fire" />
            </Form.Item>
          </div>
          <div className="flex gap-6">
            <Form.Item name="isPublished" label="Publikasikan" valuePropName="checked">
              <Switch checkedChildren="Publik" unCheckedChildren="Draft" />
            </Form.Item>
            <Form.Item name="isPinned" label="Pin di Atas" valuePropName="checked">
              <Switch checkedChildren="📌 Pin" unCheckedChildren="Normal" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!preview} title={<span style={{color:'white',fontWeight:900}}>👁️ Preview</span>}
        onCancel={()=>setPreview(null)} footer={null} width={700}
        style={{ top: 20 }}>
        {preview && (
          <div>
            {preview.coverImage && <img src={preview.coverImage} alt="" className="w-full h-48 object-cover rounded-xl mb-4" />}
            <Tag color={CAT_COLORS[preview.category]}>{CAT_LABELS[preview.category]??preview.category}</Tag>
            <h2 style={{color:'white',fontWeight:900,fontSize:22,margin:'12px 0 8px'}}>{preview.title}</h2>
            <p style={{color:'oklch(0.65 0.01 17.53)',fontSize:13,marginBottom:16,fontStyle:'italic'}}>{preview.excerpt}</p>
            <div style={{color:'oklch(0.80 0 0)',lineHeight:1.8,fontSize:14}}
              dangerouslySetInnerHTML={{__html: preview.content.replace(/\n/g,'<br/>')}} />
          </div>
        )}
      </Modal>
    </div>
  );
}
