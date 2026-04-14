'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Form, Input, Button, Divider, Typography, Card, Space } from 'antd';
import { LockOutlined, MailOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import AntProvider from '@/components/providers/AntProvider';
import Logo from '@/components/logo';
const { Title, Text } = Typography;

const DEMO = [
  { role: 'User',  email: 'user@gamevoucher.id',  pw: 'User@123456',  color: '#0ea5e9' },
  { role: 'Admin', email: 'admin@gamevoucher.id',  pw: 'Admin@123456', color: '#7c3aed' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form]    = Form.useForm();

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try { await login(values.email, values.password); }
    finally { setLoading(false); }
  };

  return (
    <AntProvider>
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d0d14' }}>
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div animate={{ scale:[1,1.15,1], opacity:[0.15,0.25,0.15] }} transition={{ duration:6, repeat:Infinity }}
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background:'radial-gradient(circle,#7c3aed,transparent)' }} />
          <motion.div animate={{ scale:[1.1,1,1.1], opacity:[0.1,0.2,0.1] }} transition={{ duration:8, repeat:Infinity }}
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background:'radial-gradient(circle,#0ea5e9,transparent)' }} />
        </div>

        <motion.div className="w-full max-w-sm relative"
          initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, type:'spring', stiffness:100 }}>

          {/* Logo */}
          <div className="text-center mb-8">
            {/* <motion.div whileHover={{ rotate:[0,10,-10,0] }} transition={{ duration:0.4 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow:'0 8px 24px rgba(124,58,237,0.4)' }}>
            </motion.div> */}
<Logo></Logo>

            <Title level={3} style={{ color:'white', marginBottom:4, fontWeight:900 }}>
              Game<span style={{ background:'linear-gradient(135deg,#ffdeac,#ffaf65)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Voucher</span>
            </Title>
            <Text style={{ color:'#64748b' }}>Masuk ke akun kamu 👾</Text>
          </div>

          {/* Form card */}
          <div className="p-6 rounded-3xl"
            style={{
              background:'linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.03) 100%)',
              border:'1px solid rgba(255,255,255,0.10)',
              backdropFilter:'blur(24px)',
              boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
            }}>
            {/* Gradient top line */}
            <div className="absolute top-0 left-6 right-6 h-px rounded-full"
              style={{ background:'linear-gradient(90deg,transparent,rgba(255, 152, 83, 0.94),rgb(253, 220, 176),transparent)' }} />

            <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark={false}>
              <Form.Item name="email" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Email</span>}
                rules={[{ required:true, message:'Email wajib diisi' }]}>
                <Input prefix={<MailOutlined style={{ color:'#64748b' }} />} placeholder="email@contoh.com" size="large" />
              </Form.Item>
              <Form.Item name="password" label={<span style={{color:'#94a3b8',fontWeight:600,fontSize:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Password</span>}
                rules={[{ required:true, message:'Password wajib diisi' }]}>
                <Input.Password prefix={<LockOutlined style={{ color:'#64748b' }} />} placeholder="••••••••" size="large" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}
                icon={<ThunderboltOutlined />}
                style={{ marginTop:8, fontWeight:800, letterSpacing:'0.02em', height:48, borderRadius:14 }}>
                {loading ? 'Masuk...' : 'Masuk Sekarang'}
              </Button>
            </Form>

            <Divider style={{ borderColor:'rgba(255,255,255,0.07)', margin:'16px 0' }}>
              <Text style={{ color:'#475569', fontSize:12 }}>atau</Text>
            </Divider>

            <Text style={{ color:'#64748b', fontSize:13 }}>
              Belum punya akun?{' '}
              <Link href="/auth/register" style={{ color:'#a78bfa', fontWeight:700 }}>Daftar sekarang</Link>
            </Text>
          </div>

          {/* Demo credentials */}
          {/* <motion.div className="mt-4 p-4 rounded-2xl"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}>
            <Text style={{ color:'#475569', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', textAlign:'center', marginBottom:10 }}>
              Demo Credentials
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map(d => (
                <motion.button key={d.role} whileTap={{ scale:0.95 }}
                  onClick={() => form.setFieldsValue({ email: d.email, password: d.pw })}
                  className="p-2.5 rounded-xl text-left transition-all"
                  style={{ background:`${d.color}10`, border:`1px solid ${d.color}25` }}>
                  <div className="text-xs font-black" style={{ color: d.color }}>{d.role}</div>
                  <div className="text-slate-500 text-xs truncate">{d.email}</div>
                </motion.button>
              ))}
            </div>
          </motion.div> */}
        </motion.div>
      </div>
    </AntProvider>
  );
}
