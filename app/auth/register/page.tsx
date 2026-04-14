'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Form, Input, Button, Divider, Typography } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, PhoneOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import AntProvider from '@/components/providers/AntProvider';
import Logo from '@/components/logo';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form]    = Form.useForm();

  const handleSubmit = async (values: { name: string; email: string; phone?: string; password: string }) => {
    setLoading(true);
    try { await register(values.name, values.email, values.password, values.phone); }
    finally { setLoading(false); }
  };

  return (
    <AntProvider>
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d0d14' }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle,#7c3aed,transparent)' }} />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle,#0ea5e9,transparent)' }} />
        </div>

        <motion.div className="w-full max-w-sm relative"
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}>

          <div className="text-center mb-8">
            <Logo></Logo>
            
            <Text 
            className='font-bold ]'
            style={{ color: '#bbc3ce' }}>Buat akun baru sekarang</Text>
          </div>

          <div className="p-6 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}>
            <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark={false}>
              <Form.Item name="name" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Nama Lengkap</span>}
                rules={[{ required: true, message: 'Nama wajib diisi' }]}>
                <Input prefix={<UserOutlined style={{ color: '#64748b' }} />} placeholder="John Doe" size="large" />
              </Form.Item>
              <Form.Item name="email" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Email</span>}
                rules={[{ required: true, type: 'email', message: 'Email tidak valid' }]}>
                <Input prefix={<MailOutlined style={{ color: '#64748b' }} />} placeholder="email@contoh.com" size="large" />
              </Form.Item>
              <Form.Item name="phone" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>No. HP <span style={{color:'#475569',fontWeight:400,textTransform:'none'}}>(opsional)</span></span>}>
                <Input prefix={<PhoneOutlined style={{ color: '#64748b' }} />} placeholder="08xxxxxxxxxx" size="large" />
              </Form.Item>
              <Form.Item name="password" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Password</span>}
                rules={[{ required: true, min: 6, message: 'Password min 6 karakter' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#64748b' }} />} placeholder="Min. 6 karakter" size="large" />
              </Form.Item>
              <Form.Item name="confirm" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Konfirmasi Password</span>}
                dependencies={['password']}
                rules={[{ required: true, message: 'Konfirmasi password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject('Password tidak cocok');
                    }
                  })
                ]}>
                <Input.Password prefix={<LockOutlined style={{ color: '#64748b' }} />} placeholder="Ulangi password" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}
                icon={<ThunderboltOutlined />}
                style={{ marginTop: 8, fontWeight: 800, letterSpacing: '0.02em', height: 48, borderRadius: 14 }}>
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </Button>
            </Form>
            <Divider style={{ borderColor: 'rgba(255,255,255,0.07)', margin: '16px 0' }}>
              <Text style={{ color: '#475569', fontSize: 12 }}>atau</Text>
            </Divider>
            <Text style={{ color: '#64748b', fontSize: 13 }}>
              Sudah punya akun?{' '}
              <Link href="/auth/login" style={{ color: '#a78bfa', fontWeight: 700 }}>Masuk</Link>
            </Text>
          </div>
        </motion.div>
      </div>
    </AntProvider>
  );
}
