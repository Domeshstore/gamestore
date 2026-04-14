// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LogOut, User, Wallet, ChevronDown, Shield, Coins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useState } from 'react';
import { cn } from '@/lib/utils/format';
import Image from 'next/image';
import { Layout, Menu, Avatar, Space, Badge, Dropdown, Button, Typography } from 'antd';
import {
  HomeOutlined, AppstoreOutlined, TransactionOutlined,
  GiftOutlined, UserOutlined, LogoutOutlined,
  ShopFilled,
  ThunderboltOutlined,
} from '@ant-design/icons';

import { motion } from 'framer-motion';
const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

const navItems = [
    { key: '/dashboard',              label: 'Home',      icon: <HomeOutlined /> },
    { key: '/dashboard/games',        label: 'Games',     icon: <AppstoreOutlined /> },
    { key: '/dashboard/transactions', label: 'Transaksi', icon: <TransactionOutlined /> },
  ];

  const activeKey = navItems.find(n =>
    n.key === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.key)
  )?.key;

  const userMenuItems = [
    { key:'profile',      
      label: 'Profil Saya',     
      icon: <UserOutlined /> 
    },
    { key:'transactions', 
      label: 'Transaksi',        
      icon: <TransactionOutlined /> 
    
    },
    ...(isAdmin ? [{ 
      key:'admin', 
      label:'Admin Panel', 
      icon: <ShopFilled /> }] : []
    ),
    { type: 'divider' },
    { key:'logout', 
      label: <span style={{color:'#e95335'}}>Logout</span>, 
      icon: <LogoutOutlined style={{color:'#e95335'}} />, 
      onClick: logout 
    },
  ];

  return (
    <AntHeader style={{
      background: 'rgba(10, 8, 8, 0.93)', // Warm dark brown with opacity
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderBottom: '1px solid rgba(236, 140, 116, 0.2)',
      padding: '0 24px',
      height: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
    }}>
      <div className="flex items-center justify-between w-full">
        {/* Logo - FIXED VERSION */}
      {/* Logo - Extra Large Version */}
<Link href="/dashboard" className="flex items-center gap-3 shrink-0">
  <div className="relative w-14 h-14 md:w-20 md:h-20">
    <Image
      src="https://nmzg68mby1os258h.public.blob.vercel-storage.com/logo_1-jUsDzBzgtlctx4zsJ4BmfwLg3IAqG0.png"
      alt="BANGDIM Store Logo"
      fill
      className="object-contain"
      sizes="(max-width: 768px) 56px, 80px"
      priority
      style={{ objectFit: 'contain' }}
    />
  </div>
  {/* <span className="font-bold text-white text-xl hidden sm:block">
    BANGDIM<span style={{ color: '#fcdfc2' }}> Store</span>
  </span> */}
</Link>

        {/* Navigation — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
          const active = item.key === activeKey;
          return (
            <Link key={item.key} href={item.key}>
              <motion.div whileHover={{ y: -1 }} className="  flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
                style={active
                  ? {  background: '#e95335', color: 'white', border: '1px solid #f9d9b9' }
                  : { color: '#94a3b8', border: '1px solid transparent' }}>
                {item.icon}
                {item.label}
              </motion.div>
            </Link>
          );
        })}
          {isAdmin && (
          <Link href="/admin">
            <motion.div whileHover={{ y:-1 }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
              style={{ color: '#e95335', border: '1px solid transparent' }}>
              <ShopFilled /> Admin
            </motion.div>
          </Link>
        )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Points */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5" style={{ background: 'rgba(30, 31, 28, 0.1)', border: '1px solid #e95335' }}>
                <Coins className="w-3.5 h-3.5" style={{ color: '#e95335' }} />
                <span className="text-xs font-semibold" style={{ color: '#e95335' }}>
                  {user?.rewardPoints ?? 0} Pts
                </span>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
                  style={{ background: 'rgba(252, 223, 194, 0.1)', border: '1px solid #e95335' }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3a3128, #523833)' }}>
                    <span className=" text-xs text-[#e95335] font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[#e95335] text-sm hidden sm:block max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: '#e95335' }} />
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-20 overflow-hidden backdrop-blur-md" style={{ background: '#352c2c', border: '1px solid #e95335' }}>
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                        style={{ color: '#e95335' }}
                        onClick={() => setMenuOpen(false)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(252, 223, 194, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b4b4b4'; }}
                      >
                        <User className="w-4 h-4" />
                        Profil Saya
                      </Link>
                      <Link
                        href="/dashboard/transactions"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                        style={{ color: '#e95335' }}
                        onClick={() => setMenuOpen(false)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(252, 223, 194, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b4b4b4'; }}
                      >
                        <Wallet className="w-4 h-4" />
                        Transaksi
                      </Link>
                      <div className="border-t" style={{ borderColor: '#e95335' }} />
                      <button
                        onClick={() => { setMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors"
                        style={{ color: '#e95335' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <LogoutOutlined  
                        className="w-4 h-4" 
                         style={{color:'#e95335'}} 
                        />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/auth/login" 
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(252, 223, 194, 0.3)', color: '#e95335' }}
              >
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: '#e95335', color: '#181616' }}
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
      </AntHeader>
  );
}