'use client';
import { useEffect, useState, useRef } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Tag, Space, Typography, Upload, Image, Popconfirm, Tooltip, Badge, Progress } from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, 
  UploadOutlined, FileImageOutlined, BoldOutlined, ItalicOutlined, 
  LinkOutlined, MenuOutlined, LoadingOutlined, CheckCircleOutlined,
  TagsOutlined, ClockCircleOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { newsAPI } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill/dist/quill.snow.css';

const { Title, Text, Paragraph } = Typography;

// TEMA
const THEME = {
  primary: '#ea5234',
  primaryDark: '#c13e22',
  secondary: '#f8d9b9',
  bgDark: '#1a1a1a',
  bgCard: '#2a2a2a',
  border: 'rgba(234, 82, 52, 0.25)',
  textMuted: '#b4b4b4',
};

const CAT_COLORS: Record<string, string> = { 
  promo: '#ea5234', 
  update: '#3b82f6', 
  tips: '#10b981', 
  event: '#ec4899', 
  general: '#f8d9b9' 
};

const CAT_LABELS: Record<string, string> = { 
  promo: '🏷️ Promo', 
  update: '🔔 Update', 
  tips: '💡 Tips', 
  event: '🎉 Event', 
  general: '📰 Umum' 
};

// Quill modules configuration
const quillModules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  },
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'indent', 'align',
  'link', 'image', 'video', 'blockquote', 'code-block'
];

interface NewsItem { 
  _id: string; 
  title: string; 
  slug: string; 
  excerpt: string; 
  content: string; 
  coverImage: string; 
  category: string; 
  tags: string[]; 
  isPublished: boolean; 
  isPinned: boolean; 
  viewCount: number; 
  publishedAt: string | null; 
  createdAt: string; 
  author?: { name: string };
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [preview, setPreview] = useState<NewsItem | null>(null);
  const [edit, setEdit] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  
  const [form] = Form.useForm();
  const contentValue = Form.useWatch('content', form);

  useEffect(() => {
    if (contentValue) {
      const plainText = contentValue.replace(/<[^>]*>/g, '');
      const words = plainText.trim().split(/\s+/).length;
      setWordCount(words);
    }
  }, [contentValue]);

  useEffect(() => { fetchNews(page); }, [page]);

  const fetchNews = async (p: number) => {
    setLoading(true);
    try {
      const res = await newsAPI.adminAll({ page: p, limit: 15 });
      setNews(res.data.data ?? []);
      setTotal(res.data.pagination?.total ?? 0);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEdit(null);
    setCoverPreview('');
    form.resetFields();
    form.setFieldsValue({ 
      category: 'general', 
      isPublished: false, 
      isPinned: false,
      content: ''
    });
    setWordCount(0);
    setModal(true);
  };

  const openEdit = (n: NewsItem) => {
    setEdit(n);
    setCoverPreview(n.coverImage);
    form.setFieldsValue({ 
      ...n, 
      tags: n.tags?.join(', ') 
    });
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const payload = { 
        ...vals, 
        tags: vals.tags ? String(vals.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        content: vals.content || ''
      };
      if (edit) { 
        await newsAPI.update(edit._id, payload); 
        toast.success('Artikel berhasil diperbarui!');
      } else { 
        await newsAPI.create(payload); 
        toast.success('Artikel berhasil dibuat!');
      }
      setModal(false);
      fetchNews(page);
    } catch (e: unknown) {
      if (!(e as { errorFields?: unknown }).errorFields) {
        toast.error((e as { message?: string }).message || 'Gagal menyimpan artikel');
      }
    } finally { 
      setSaving(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Modal.confirm({ 
      title: 'Hapus Artikel?', 
      content: `Apakah Anda yakin ingin menghapus "${title}"? Tindakan ini tidak dapat dibatalkan.`, 
      okType: 'danger', 
      okText: 'Hapus', 
      cancelText: 'Batal',
      okButtonProps: { danger: true },
      onOk: async () => { 
        await newsAPI.delete(id); 
        toast.success('Artikel dihapus'); 
        fetchNews(page); 
      } 
    });
  };

  const togglePublish = async (n: NewsItem) => {
    await newsAPI.update(n._id, { isPublished: !n.isPublished });
    toast.success(n.isPublished ? 'Artikel disembunyikan' : 'Artikel dipublikasikan');
    fetchNews(page);
  };

  const handleImageUpload = async (file: File) => {
    // Simulasi upload gambar - implement with your actual upload API
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const imageUrl = await handleImageUpload(file);
        const quill = (document.querySelector('.ql-editor') as any);
        if (quill) {
          const range = (window as any).quill?.getSelection();
          (window as any).quill?.insertEmbed(range.index, 'image', imageUrl);
        }
      }
    };
  };

  const columns = [
    { 
      title: 'Artikel', 
      key: 'title', 
      width: 320,
      render: (_: unknown, n: NewsItem) => (
        <div className="flex items-start gap-3">
          {n.coverImage ? (
            <img src={n.coverImage} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: THEME.bgCard }}>
              <FileImageOutlined style={{ color: THEME.textMuted }} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              {n.isPinned && <span className="text-amber-400 text-sm">📌</span>}
              <span style={{ color: '#f8d9b9', fontWeight: 700 }} className="line-clamp-1">{n.title}</span>
            </div>
            <div style={{ color: THEME.textMuted, fontSize: 12 }} className="line-clamp-1">
              {n.excerpt?.slice(0, 60)}{n.excerpt?.length > 60 ? '...' : ''}
            </div>
          </div>
        </div>
      )
    },
    { 
      title: 'Kategori', 
      dataIndex: 'category', 
      key: 'cat', 
      width: 120,
      render: (v: string) => (
        <Tag style={{ background: `${CAT_COLORS[v]}20`, border: `1px solid ${CAT_COLORS[v]}40`, color: CAT_COLORS[v], borderRadius: 20 }}>
          {CAT_LABELS[v] ?? v}
        </Tag>
      )
    },
    { 
      title: 'Status', 
      key: 'status', 
      width: 120,
      render: (_: unknown, n: NewsItem) => (
        <div className="space-y-1">
          <Badge status={n.isPublished ? 'success' : 'default'} text={n.isPublished ? 'Published' : 'Draft'} />
          {n.isPublished && (
            <div className="flex items-center gap-1 text-xs" style={{ color: THEME.textMuted }}>
              <EyeOutlined /> {n.viewCount.toLocaleString()} views
            </div>
          )}
        </div>
      )
    },
    { 
      title: 'Tanggal', 
      key: 'date', 
      width: 110,
      render: (_: unknown, n: NewsItem) => (
        <div style={{ color: THEME.textMuted, fontSize: 12 }}>
          <ClockCircleOutlined className="mr-1" />
          {formatDate(n.createdAt).slice(0, 10)}
        </div>
      )
    },
    { 
      title: 'Aksi', 
      key: 'act', 
      width: 180,
      render: (_: unknown, n: NewsItem) => (
        <Space>
          <Tooltip title="Preview">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreview(n)} style={{ borderRadius: 8 }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(n)} style={{ borderRadius: 8 }} />
          </Tooltip>
          <Tooltip title={n.isPublished ? 'Unpublish' : 'Publish'}>
            <Button 
              size="small" 
              icon={n.isPublished ? <EyeInvisibleOutlined /> : <CheckCircleOutlined />} 
              onClick={() => togglePublish(n)} 
              style={{ borderRadius: 8 }}
            />
          </Tooltip>
          <Popconfirm
            title="Hapus artikel?"
            description="Tindakan ini tidak dapat dibatalkan"
            onConfirm={() => handleDelete(n._id, n.title)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      )
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */} //<div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ color: THEME.secondary, marginBottom: 4, fontWeight: 900 }}>
            📰 Manajemen Artikel
          </Title>
          <Text style={{ color: THEME.textMuted }}>Total {total} artikel tersedia</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={openCreate} 
          style={{ 
            fontWeight: 700, 
            borderRadius: 12, 
            height: 40, 
            background: THEME.primary,
            border: 'none'
          }}
        >
          Buat Artikel Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Artikel', value: total, icon: '📰', color: THEME.primary },
          { label: 'Published', value: news.filter(n => n.isPublished).length, icon: '✅', color: '#10b981' },
          { label: 'Draft', value: news.filter(n => !n.isPublished).length, icon: '✏️', color: '#f59e0b' },
          { label: 'Total Views', value: news.reduce((sum, n) => sum + n.viewCount, 0).toLocaleString(), icon: '👁️', color: '#3b82f6' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-xl"
            style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}` }}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div style={{ color: THEME.textMuted, fontSize: 12 }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <Card style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, borderRadius: 16 }}>
        <Table 
          dataSource={news} 
          columns={columns} 
          rowKey="_id" 
          loading={loading} 
          size="middle"
          pagination={{
            current: page,
            total,
            pageSize: 15,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (total) => <span style={{ color: THEME.textMuted }}>Total {total} artikel</span>
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Create/Edit Modal with Rich Text Editor */}
      <Modal
        open={modal}
        title={
          <div className="flex items-center gap-2">
            <span className="text-2xl">{edit ? '✏️' : '➕'}</span>
            <span style={{ color: THEME.secondary, fontWeight: 900 }}>
              {edit ? 'Edit Artikel' : 'Buat Artikel Baru'}
            </span>
          </div>
        }
        onCancel={() => {
          setModal(false);
          form.resetFields();
          setCoverPreview('');
        }}
        onOk={handleSave}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
        width={900}
        destroyOnHidden={true}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {/* Cover Image Upload */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item 
              name="coverImage" 
              label={<span style={{ color: THEME.textMuted, fontSize: 12 }}>📸 Gambar Cover</span>}
            >
              <Input 
                size="large" 
                placeholder="https://... atau upload gambar"
                onChange={(e) => setCoverPreview(e.target.value)}
                suffix={
                  <Upload
                    showUploadList={false}
                    beforeUpload={async (file) => {
                      const url = await handleImageUpload(file);
                      form.setFieldsValue({ coverImage: url });
                      setCoverPreview(url);
                      return false;
                    }}
                  >
                    <Button size="small" icon={<UploadOutlined />}>Upload</Button>
                  </Upload>
                }
              />
            </Form.Item>
            <Form.Item 
              name="title" 
              label={<span style={{ color: THEME.textMuted, fontSize: 12 }}>📝 Judul Artikel *</span>}
              rules={[{ required: true, message: 'Judul wajib diisi' }]}
            >
              <Input size="large" placeholder="Masukkan judul artikel..." />
            </Form.Item>
          </div>

          {coverPreview && (
            <div className="mb-4">
              <Image src={coverPreview} alt="Preview cover" className="rounded-xl object-cover" width="100%" height={160} style={{ objectFit: 'cover', maxHeight: 160 }} />
            </div>
          )}

          <Form.Item 
            name="excerpt" 
            label={<span style={{ color: THEME.textMuted, fontSize: 12 }}>📋 Ringkasan / Excerpt</span>}
          >
            <Input.TextArea rows={2} placeholder="Ringkasan singkat yang muncul di halaman utama..." />
          </Form.Item>

          {/* Rich Text Editor */}
          <Form.Item 
            name="content" 
            label={
              <div className="flex justify-between w-full">
                <span style={{ color: THEME.textMuted, fontSize: 12 }}>✍️ Konten Artikel *</span>
                <span style={{ color: THEME.textMuted, fontSize: 11 }}>{wordCount} kata</span>
              </div>
            }
            rules={[{ required: true, message: 'Konten wajib diisi' }]}
          >
            <ReactQuill
              theme="snow"
              modules={{
                ...quillModules,
                toolbar: {
                  ...quillModules.toolbar,
                  handlers: { image: imageHandler }
                }
              }}
              formats={quillFormats}
              className='text-black'
              placeholder="Tulis konten artikel di sini..."
              style={{ background: '#ffffff', border: `1px solid ${THEME.border}`, borderRadius: 8 }}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4 text-black">
            <Form.Item 
              name="category" 
              label={<span style={{ color: THEME.textMuted, fontSize: 12 }}>🏷️ Kategori</span>}
              initialValue="general"
            >
              <Select size="large">
                {Object.entries(CAT_LABELS).map(([k, v]) => (
                  <Select.Option key={k} value={k}>{v}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="tags" 
              label={<span style={{ color: THEME.textMuted, fontSize: 12 }}>🔖 Tags (pisah dengan koma)</span>}
            >
              <Input size="large" placeholder="promo, ml, free fire, event" prefix={<TagsOutlined />} />
            </Form.Item>
          </div>

          <div className="flex gap-8">
            <Form.Item name="isPublished" label="Publikasikan" valuePropName="checked">
              <Switch checkedChildren="Publik" unCheckedChildren="Draft" />
            </Form.Item>
            <Form.Item name="isPinned" label="Pin di Atas" valuePropName="checked">
              <Switch checkedChildren="📌 Pin" unCheckedChildren="Normal" />
            </Form.Item>
          </div>

          {/* SEO Tips */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(234, 82, 52, 0.08)', border: `1px solid ${THEME.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔍</span>
              <span className="font-semibold" style={{ color: THEME.secondary }}>Tips SEO Artikel</span>
            </div>
            <ul style={{ color: THEME.textMuted, fontSize: 12 }} className="space-y-1 pl-5 list-disc">
              <li>Gunakan judul yang menarik dan mengandung kata kunci</li>
              <li>Ringkasan harus menggambarkan isi artikel (min. 120 karakter)</li>
              <li>Gunakan heading (H2, H3) untuk struktur konten</li>
              <li>Sertakan gambar cover yang relevan</li>
              <li>Tags membantu kategori artikel di pencarian</li>
            </ul>
          </div>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={!!preview}
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined style={{ color: THEME.primary }} />
            <span style={{ color: THEME.secondary, fontWeight: 900 }}>Preview Artikel</span>
          </div>
        }
        onCancel={() => setPreview(null)}
        footer={null}
        width={800}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {preview && (
          <div>
            {preview.coverImage && (
              <img src={preview.coverImage} alt="" className="w-full h-56 object-cover rounded-xl mb-4" />
            )}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Tag style={{ background: `${CAT_COLORS[preview.category]}20`, border: `1px solid ${CAT_COLORS[preview.category]}40`, color: CAT_COLORS[preview.category], borderRadius: 20 }}>
                {CAT_LABELS[preview.category] ?? preview.category}
              </Tag>
              {preview.isPinned && <Tag color="gold">📌 Pinned</Tag>}
              {preview.tags?.map((tag, idx) => (
                <Tag key={idx} style={{ borderRadius: 20 }}>#{tag}</Tag>
              ))}
            </div>
            <h2 style={{ color: THEME.secondary, fontWeight: 900, fontSize: 28, marginBottom: 12 }}>
              {preview.title}
            </h2>
            <div className="flex items-center gap-4 mb-4 pb-3 border-b" style={{ borderColor: THEME.border }}>
              <span style={{ color: THEME.textMuted, fontSize: 12 }}>
                📅 {formatDate(preview.createdAt)}
              </span>
              <span style={{ color: THEME.textMuted, fontSize: 12 }}>
                👁️ {preview.viewCount.toLocaleString()} views
              </span>
            </div>
            {preview.excerpt && (
              <p className="italic mb-4 p-3 rounded-lg" style={{ background: THEME.bgCard, color: THEME.textMuted }}>
                {preview.excerpt}
              </p>
            )}
            <div 
              className="prose prose-invert max-w-none"
              style={{ color: '#d4d4d4', lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: preview.content.replace(/\n/g, '<br/>') }} 
            />
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .ql-toolbar {
          border-radius: 12px 12px 0 0 !important;
          background: #f5f5f5;
        }
        .ql-container {
          border-radius: 0 0 12px 12px !important;
          min-height: 300px;
          font-size: 14px;
        }
        .ql-editor {
          min-height: 300px;
        }
        .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}