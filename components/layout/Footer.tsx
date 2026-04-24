// components/layout/Footer.tsx
// components/layout/Footer.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

export default function Footer() {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const socialIcons = [
    { id: 'twitter', label: 'Twitter' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'github', label: 'Github' },
  ];

  return (
    <footer className="border-t mt-20" style={{ borderColor: '#e95335', background: '#0e0d0d' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand - dengan logo gambar */}
          <div className="md:col-span-2">
            <Link href="/dashboard" className="flex items-center gap-3 mb-4">
              {/* Logo Image - SAMA DENGAN HEADER */}
              <div className="relative w-[100px] h-[100px] md:w-18 md:h-18">
                <Image
                  src="https://nmzg68mby1os258h.public.blob.vercel-storage.com/logo_1-jUsDzBzgtlctx4zsJ4BmfwLg3IAqG0.png"
                  alt="BANGDIM Store Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 80px, 88px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              {/* <span className="font-bold text-white text-xl">
                BANGDIM<span style={{ color: '#e95335' }}>Store</span>
              </span> */}
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#b4b4b4' }}>
              Platform top up voucher game terpercaya. Proses cepat, aman, dan dapatkan reward points setiap transaksi.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {/* Twitter/X */}
              {/* <a 
                href="#" 
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200" 
                style={{ 
                  background: hoveredIcon === 'twitter' ? '#3a3128' : '#352c2c', 
                  border: `1px solid ${hoveredIcon === 'twitter' ? '#e95335' : '#ec8c74'}`,
                  color: hoveredIcon === 'twitter' ? '#e95335' : '#fcdfc2'
                }}
                onMouseEnter={() => setHoveredIcon('twitter')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 4l11.733 16h4.267l-11.733 -16l-4.267 0" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </a> */}

              {/* Instagram */}
              <a 
                href="#" 
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200" 
                style={{ 
                  background: hoveredIcon === 'instagram' ? '#3a3128' : '#352c2c', 
                  border: `1px solid ${hoveredIcon === 'instagram' ? '#e95335' : '#ec8c74'}`,
                  color: hoveredIcon === 'instagram' ? '#e95335' : '#fcdfc2'
                }}
                onMouseEnter={() => setHoveredIcon('instagram')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="4" ry="4" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="18" y1="6" x2="18.01" y2="6" />
                </svg>
              </a>

              {/* Github */}
              {/* <a 
                href="#" 
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200" 
                style={{ 
                  background: hoveredIcon === 'github' ? '#3a3128' : '#352c2c', 
                  border: `1px solid ${hoveredIcon === 'github' ? '#e95335' : '#ec8c74'}`,
                  color: hoveredIcon === 'github' ? '#e95335' : '#fcdfc2'
                }}
                onMouseEnter={() => setHoveredIcon('github')}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a> */}
            </div>
          </div>

          {/* Links - Menu */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: '#e95335' }}>Menu</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/dashboard', label: 'Home' },
                { href: '/dashboard/games', label: 'Games' },
                { href: '/dashboard/transactions', label: 'Transaksi' },
                { href: '/news', label: 'News' },
                { href: '/dashboard/referral', label: 'Referral' },
                { href: '/dashboard/profile', label: 'Profil' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-all duration-200 hover:text-[#e95335] hover:pl-1" style={{ color: '#b4b4b4' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links - Informasi */}
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: '#e95335' }}>Informasi</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/about', label: 'Tentang Kami' },
                { href: '/how-to-buy', label: 'Cara Pembelian' },
                { href: '/faq', label: 'FAQ' },
                { href: '/news', label: 'News' },
                { href: '/dashboard/referral', label: 'Referral' },
                { href: '/contact', label: 'Hubungi Kami' },
                { href: '/privacy', label: 'Kebijakan Privasi' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm transition-all duration-200 hover:text-[#e95335] hover:pl-1" style={{ color: '#b4b4b4' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: '#e95335' }}>
          <p className="text-xs" style={{ color: '#b4b4b4' }}>
            © {new Date().getFullYear()} BANGDIM Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: '#b4b4b4' }}>Powered by Digiflazz & Apigames</span>
          </div>
        </div>
      </div>
    </footer>
  );
}