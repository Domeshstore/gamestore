'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Form, Input, Button, Divider, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, PhoneOutlined, ThunderboltOutlined, GiftOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { referralAPI } from '@/lib/api/client';
import AntProvider from '@/components/providers/AntProvider';
import Logo from '@/components/logo';

const { Title, Text } = Typography;

function RegisterInner() {
  const { register }    = useAuth();
  const searchParams    = useSearchParams();
  const refCode         = searchParams.get('ref') || '';

  const [loading,       setLoading]       = useState(false);
  const [form]          = Form.useForm();
  const [referralInput, setReferralInput] = useState(refCode.toUpperCase());
  const [referralInfo,  setReferralInfo]  = useState<{ valid: boolean; referrerName: string; newUserBonus: number } | null>(null);
  const [checkingRef,   setCheckingRef]   = useState(false);

  // Auto-validate referral code from URL
  useEffect(() => {
    if (refCode) {
      form.setFieldValue('referralCode', refCode.toUpperCase());
      validateReferralCode(refCode.toUpperCase());
    }
  }, [refCode]);

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 6) { setReferralInfo(null); return; }
    setCheckingRef(true);
    try {
      const res = await referralAPI.validateCode(code);
      setReferralInfo(res.data.data);
    } catch {
      setReferralInfo({ valid: false, referrerName: '', newUserBonus: 0 });
    } finally { setCheckingRef(false); }
  };

  const handleSubmit = async (values: Record<string, string>) => {
    setLoading(true);
    try {
      await register(values.name, values.email, values.password, values.phone, values.referralCode);
    } finally { setLoading(false); }
  };

  return (
    <AntProvider>
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d0d14' }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
            style={{ background: 'radial-gradient(circle, oklch(0.92 0.06 67.02), transparent)' }} />
        </div>

        <motion.div className="w-full max-w-sm relative"
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}>

          <div className="text-center mb-6">

            <Logo></Logo>
            
       
            <Title level={3} style={{ color: 'white', marginBottom: 2, fontWeight: 900 }}>
              Daftar ke <span style={{ color: '#ea5234' }}>BANGDIM Store</span>
            </Title>
            <Text className="text-md font-bold" style={{ color: 'oklch(0.55 0.01 17.53)' }}>Buat akun gratis & mulai top up</Text>
          </div>

          {/* Referral bonus banner */}
          {referralInfo?.valid && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background: 'oklch(0.92 0.06 67.02 / 0.10)', border: '1px solid oklch(0.92 0.06 67.02 / 0.25)' }}>
              <GiftOutlined style={{ color: 'oklch(0.92 0.06 67.02)', fontSize: 20 }} />
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>
                  Diajak oleh {referralInfo.referrerName}!
                </div>
                <div style={{ color: 'oklch(0.92 0.06 67.02)', fontSize: 12 }}>
                  Kamu dapat +{referralInfo.newUserBonus.toLocaleString()} pts setelah transaksi pertama
                </div>
              </div>
            </motion.div>
          )}

          <div className="p-5 rounded-2xl"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}>
            <Form form={form} onFinish={handleSubmit} layout="vertical" requiredMark={false}>
              <Form.Item name="name" label={<span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Lengkap</span>}
                rules={[{ required: true, message: 'Nama wajib diisi' }]}>
                <Input prefix={<UserOutlined style={{ color: 'oklch(0.55 0.01 17.53)' }} />} placeholder="John Doe" size="large" />
              </Form.Item>
              <Form.Item name="email" label={<span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>}
                rules={[{ required: true, type: 'email', message: 'Email tidak valid' }]}>
                <Input prefix={<MailOutlined style={{ color: 'oklch(0.55 0.01 17.53)' }} />} placeholder="email@contoh.com" size="large" />
              </Form.Item>
              <Form.Item name="phone" label={<span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. HP (untuk notifikasi WA)</span>}
                rules={[{ required: true, message: 'No. HP wajib diisi' }]}>
                <Input prefix={<PhoneOutlined style={{ color: 'oklch(0.55 0.01 17.53)' }} />} placeholder="081234567890" size="large" type="tel" />
              </Form.Item>
              <Form.Item name="password" label={<span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</span>}
                rules={[{ required: true, min: 6, message: 'Min 6 karakter' }]}>
                <Input.Password prefix={<LockOutlined style={{ color: 'oklch(0.55 0.01 17.53)' }} />} placeholder="Min. 6 karakter" size="large" />
              </Form.Item>
              <Form.Item name="referralCode"
                label={
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode Referral</span>
                    <span style={{ color: 'oklch(0.50 0.01 17.53)', fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span>
                  </div>
                }>
                <Input
                  prefix={<GiftOutlined style={{ color: checkingRef ? 'oklch(0.65 0.01 17.53)' : referralInfo?.valid ? '#4ade80' : 'oklch(0.55 0.01 17.53)' }} />}
                  placeholder="Masukkan kode referral"
                  size="large"
                  value={referralInput}
                  onChange={e => {
                    const v = e.target.value.toUpperCase();
                    setReferralInput(v);
                    form.setFieldValue('referralCode', v);
                    validateReferralCode(v);
                  }}
                  suffix={
                    checkingRef ? <span style={{ fontSize: 11, color: 'oklch(0.55 0.01 17.53)' }}>Cek...</span>
                    : referralInput && referralInfo?.valid ? <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}>✓ Valid</span>
                    : referralInput && referralInfo && !referralInfo.valid ? <span style={{ color: '#f87171', fontSize: 11 }}>✗</span>
                    : null
                  }
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" block size="large" loading={loading}
                icon={<ThunderboltOutlined />}
                style={{ height: 48, fontWeight: 800, borderRadius: 12, marginTop: 4 }}>
                {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
              </Button>
            </Form>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.07)', margin: '16px 0' }}>
              <Text style={{ color: 'oklch(0.45 0.01 17.53)', fontSize: 12 }}>atau</Text>
            </Divider>
            <Text style={{ color: 'oklch(0.55 0.01 17.53)', fontSize: 13 }}>
              Sudah punya akun?{' '}
              <Link href="/auth/login" style={{ color: 'oklch(0.92 0.06 67.02)', fontWeight: 700 }}>Masuk</Link>
            </Text>
          </div>
        </motion.div>
      </div>
    </AntProvider>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
