// components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LogOut, User, ChevronDown, Shield, GiftIcon, Newspaper, Coins, Menu as MenuIcon, X, Home, WifiSync, History, Gift, Phone, Gamepad2, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../logo';

export default function Header() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { key: '/dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { key: '/dashboard/games', label: 'Games', icon: <Gamepad2 size={18} /> },
    { key: '/dashboard/topup', label: 'Pulsa & Data', icon: <WifiSync size={18} /> },
    { key: '/dashboard/referral',      label: 'Referral',  icon: <GiftIcon size={18} /> },

    { key: '/news',      label: 'News',  icon: <Newspaper size={18} /> },

    { key: '/dashboard/transactions', label: 'Transaksi', icon: <History size={18} /> },
  ];

  // Mobile bottom navigation items
  const bottomNavItems = [
    { key: '/dashboard', label: 'Beranda', icon: <Home size={22} />, activeIcon: <Home size={22} strokeWidth={2.5} /> },
    { key: '/dashboard/games', label: 'Games', icon: <Gamepad2 size={22} />, activeIcon: <Gamepad2 size={22} strokeWidth={2.5} /> },
    { key: '/dashboard/topup', label: 'Topup', icon: <WifiSync size={22} />, activeIcon: <WifiSync size={22} strokeWidth={2.5} /> },
    { key: '/dashboard/referral',      label: 'Referral',  icon: <GiftIcon size={18} /> },

    { key: '/news',      label: 'News',  icon: <Newspaper size={18} /> },

    { key: '/dashboard/transactions', label: 'Riwayat', icon: <History size={22} />, activeIcon: <History size={22} strokeWidth={2.5} /> },
    ...(isAdmin ? [{ key: '/admin', label: 'Admin', icon: <Shield size={22} />, activeIcon: <Shield size={22} strokeWidth={2.5} /> }] : [])
  ];

  const activeKey = navItems.find(n =>
    n.key === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(n.key)
  )?.key;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-black/98 backdrop-blur-md border-b border-orange-500/30 shadow-lg' 
            : 'bg-black/90 backdrop-blur-sm border-b border-orange-500/20'
        }`}
        style={{ height: isMobile ? '60px' : '70px' }}
      >
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="relative ">
              <Logo />
            </div>
            {!isMobile && (
              <span className="font-bold text-white text-xl hidden sm:block">
                {/* BANGDIM<span className="text-[#fcdfc2]"> Store</span> */}
              </span>
            )}
          </Link>

          {/* Navigation Desktop */}
          {!isMobile && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const active = item.key === activeKey;
                return (
                  <Link key={item.key} href={item.key}>
                    <motion.div 
                      whileHover={{ y: -1 }} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#e95335] text-white border border-[#f9d9b9]'
                          : 'text-gray-400 hover:text-white border border-transparent hover:border-orange-500/30'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </motion.div>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link href="/admin">
                  <motion.div 
                    whileHover={{ y: -1 }} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer text-[#e95335] hover:text-white transition-colors"
                  >
                    <Shield size={18} /> Admin
                  </motion.div>
                </Link>
              )}
            </nav>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4 md:gap-3">
            {isAuthenticated ? (
              <>
                {/* Reward Points - Desktop */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-lg px-2 md:px-3 py-1 md:py-1.5 bg-orange-500/10 border border-[#e95335]">
                  <Coins className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#e95335]" />
                  <span className="text-[10px] md:text-xs font-semibold text-[#e95335]">
                    {user?.rewardPoints ?? 0} Pts
                  </span>
                </div>

                {/* Mobile Points Badge */}
                {isMobile && (
                  <div className="relative">
                    <Gift className="w-5 h-5 text-[#e95335]" />
                    {(user?.rewardPoints ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#e95335] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {user?.rewardPoints}
                      </span>
                    )}
                  </div>
                )}

                {/* User Menu - Desktop */}
                {!isMobile && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors bg-orange-500/10 border border-[#e95335] hover:bg-orange-500/20"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br from-[#3a3128] to-[#523833]">
                        <span className="text-xs text-[#e95335] font-bold">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[#e95335] text-sm hidden sm:block max-w-[100px] truncate">
                        {user?.name}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#e95335]" />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-20 overflow-hidden backdrop-blur-md bg-[#352c2c] border border-[#e95335]"
                          >
                            <button
                              onClick={() => {
                                setMenuOpen(false);
                                router.push('/dashboard/profile');
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-[#e95335] hover:bg-white/10"
                            >
                              <User size={16} />
                              Profil Saya
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpen(false);
                                router.push('/dashboard/transactions');
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-[#e95335] hover:bg-white/10"
                            >
                              <History size={16} />
                              Transaksi
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpen(false);
                                router.push('/dashboard/games');
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-[#e95335] hover:bg-white/10"
                            >
                              {/* <Gift size={16} /> */}
                              Top Up                            
                              </button>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setMenuOpen(false);
                                  router.push('/admin');
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-[#e95335] hover:bg-white/10"
                              >
                                <Shield size={16} />
                                Admin Panel
                              </button>
                            )}
                            <div className="border-t border-[#e95335]" />
                            <button
                              onClick={() => {
                                setMenuOpen(false);
                                handleLogout();
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors text-red-500 hover:bg-red-500/10"
                            >
                              <LogOut size={16} />
                              Logout
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500/10 border border-[#e95335]"
                  >
                    <MenuIcon className="w-5 h-5 text-[#e95335]" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth/login" 
                  className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all border border-orange-500/30 text-[#e95335] hover:bg-orange-500/10"
                >
                  Login
                </Link>
                <Link 
                  href="/auth/register" 
                  className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all bg-[#e95335] text-black hover:bg-[#e95335]/90"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/70 z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] z-50 md:hidden bg-gradient-to-b from-[#2a2018] to-[#1a1512] shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="p-5 border-b border-[#e95335]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#e95335] to-[#c73e1e]">
                        <span className="text-white text-lg font-bold">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-base">{user?.name}</p>
                        <p className="text-gray-400 text-xs">{user?.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-[#e95335]">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#e95335]" />
                      <span className="text-white text-sm">Reward Points</span>
                    </div>
                    <span className="text-white font-bold">{user?.rewardPoints ?? 0}</span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-4">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push('/dashboard/profile');
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <User className="w-5 h-5 text-[#e95335]" />
                    <span className="text-gray-300 text-sm font-medium">Profil Saya</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push('/dashboard/transactions');
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <History className="w-5 h-5 text-[#e95335]" />
                    <span className="text-gray-300 text-sm font-medium">Transaksi</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push('/dashboard/games');
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <Gamepad2 className="w-5 h-5 text-[#e95335]" />
                    <span className="text-gray-300 text-sm font-medium">Games</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push('/admin');
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/5"
                    >
                      <Shield className="w-5 h-5 text-[#e95335]" />
                      <span className="text-gray-300 text-sm font-medium">Admin Panel</span>
                    </button>
                  )}
                  <div className="h-px my-2 bg-orange-500/20" />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 text-sm font-medium">Logout</span>
                  </button>
                </div>

                {/* Version Info */}
                <div className="p-5 text-center border-t border-orange-500/20">
                  <p className="text-gray-500 text-xs">Version 2.0.0</p>
                  <p className="text-gray-600 text-xs mt-1">© 2024 BANGDIM Store</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && isAuthenticated && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-lg border-t border-orange-500/20"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around py-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.key || pathname.startsWith(item.key);
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.key)}
                  className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all relative group"
                >
                  <div className={`transition-all duration-200 ${isActive ? 'text-[#e95335]' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {isActive ? item.activeIcon : item.icon}
                  </div>
                  <span className={`text-[10px] font-medium transition-all duration-200 ${
                    isActive ? 'text-[#e95335]' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-2 w-8 h-0.5 rounded-full bg-[#e95335]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Spacer for bottom navigation on mobile */}
      {isMobile && isAuthenticated && <div className="h-[70px] md:hidden" />}
      
      {/* Spacer for fixed header */}
      <div className={`${isMobile ? 'h-[60px]' : 'h-[70px]'}`} />
    </>
  );
}