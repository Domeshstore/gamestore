'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Layout, Menu, Avatar, Badge, Dropdown, Space, Typography } from 'antd';
import {
  DashboardOutlined, ShoppingOutlined, TagsOutlined, TransactionOutlined,
  UserOutlined, SettingOutlined, ThunderboltOutlined, LogoutOutlined,
  BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useAuth } from '@/lib/hooks/useAuth';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/admin',              icon: <DashboardOutlined />,    label: 'Dashboard' },
  { key: '/admin/transactions', icon: <TransactionOutlined />,  label: 'Transaksi' },
  { key: '/admin/digiflazz',   icon: <ThunderboltOutlined />,  label: 'Digiflazz' },
  { key: '/admin/apigames',     icon: <AppstoreOutlined />,     label: 'Apigames' },
  { key: '/admin/games',        icon: <ShoppingOutlined />,     label: 'Games' },
  { key: '/admin/vouchers',     icon: <TagsOutlined />,         label: 'Vouchers' },
  { key: '/admin/users',        icon: <UserOutlined />,         label: 'Users' },
  { key: '/admin/settings',     icon: <SettingOutlined />,      label: 'Pengaturan' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, hydrate } = useAuthStore();
  const { logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { hydrate(); }, []);
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) router.replace('/auth/login');
      else if (user?.role !== 'admin') router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading || !isAuthenticated || user?.role !== 'admin') return null;

  // Active key — exact for /admin, startsWith for others
  const activeKey = NAV_ITEMS.find(n =>
    n.key === '/admin' ? pathname === '/admin' : pathname.startsWith(n.key)
  )?.key ?? '/admin';

  const userMenuItems = [
    { key: 'profile', label: 'Profil', icon: <UserOutlined /> },
    { key: 'divider', type: 'divider' },
    { key: 'logout',  label: <span className="text-red-400">Logout</span>, icon: <LogoutOutlined className="text-red-400" />, onClick: logout },
  ];

  return (
    <AntProvider>
      <Layout style={{ minHeight: '100vh', background: '#0d0d14' }}>
        {/* ── Sider ── */}
        <Sider
          collapsed={collapsed}
          collapsible
          trigger={null}
          width={240}
          collapsedWidth={72}
          style={{
            background: '#0b0b14',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 px-4 py-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            layout
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
              <ThunderboltOutlined style={{ color: 'white', fontSize: 18 }} />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="text-white font-black text-sm leading-tight">Admin Panel</div>
                <div style={{ color: 'rgba(167,139,250,0.7)', fontSize: 11, fontWeight: 600 }}>GameVoucher</div>
              </motion.div>
            )}
          </motion.div>

          {/* Navigation */}
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => router.push(key)}
            items={NAV_ITEMS.map(item => ({
              ...item,
              
            }))}
          />

          {/* User info at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {collapsed ? (
              <div className="flex justify-center">
                <Avatar size={36} style={{ background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', cursor: 'pointer', fontWeight: 900 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <Avatar size={32} style={{ background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', fontWeight: 900, flexShrink: 0 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-xs font-bold truncate">{user?.name}</div>
                  <div className="text-slate-500 text-xs truncate">{user?.email}</div>
                </div>
                <LogoutOutlined
                  className="text-red-400 cursor-pointer hover:text-red-300 transition-colors"
                  onClick={logout}
                />
              </div>
            )}
          </div>
        </Sider>

        <Layout style={{ background: '#0d0d14' }}>
          {/* ── Header ── */}
          <Header style={{
            background: 'rgba(13,13,20,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCollapsed(!collapsed)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                {collapsed ? 
                <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </motion.button>
              <span className="text-white font-bold text-base hidden sm:block">
                {NAV_ITEMS.find(n => n.key === activeKey)?.label ?? 'Admin'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Badge count={5} size="small">
                <motion.button whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                  <BellOutlined />
                </motion.button>
              </Badge>
              <Dropdown menu={{ items: userMenuItems as never }} placement="bottomRight" trigger={['click']}>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Avatar size={28} style={{ background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', fontWeight: 900, fontSize: 12 }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <span className="text-white text-sm font-semibold hidden sm:block">{user?.name}</span>
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* ── Content ── */}
          <Content style={{ padding: '24px', minHeight: 'calc(100vh - 60px)', background: '#0d0d14' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Content>
        </Layout>
      </Layout>
    </AntProvider>
  );
}
