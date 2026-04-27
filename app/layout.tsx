// app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import ThemeProvider from "@/theme/ThemeProvider";
import { Ubuntu } from "next/font/google";
import { cn } from "@/lib/utils";
import { SSEProvider } from '@/components/providers/SSEProvider';
const ubuntu = Ubuntu({subsets:['latin'],variable:'--font-ubuntu',weight:'400'});


export const metadata: Metadata = {
  title: 'BANGDIM Store — Top Up Game Terpercaya',
  icons: {
    icon: '/favicon.ico',
  },
  description: 'Platform top up voucher game terpercaya. Mobile Legends, Free Fire, PUBG, Genshin Impact, dan banyak lagi.',
  keywords: 'top up game, voucher game, mobile legends, free fire, pubg',
  openGraph: {
    title: 'BANGDIM Store — Top Up Game Terpercaya',
    description: 'Platform top up voucher game terpercaya. Mobile Legends, Free Fire, PUBG, Genshin Impact, dan banyak lagi.',      
    url: 'https://domesh.pro',
    siteName: 'BANGDIM Store',
    images: [
      {
        url: 'https://domesh.pro/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BANGDIM Store', 
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn( ubuntu.variable, )}>
      <body className="">
         <AntdRegistry>
  <ThemeProvider>
     <SSEProvider>
    {children}

     </SSEProvider>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#004D40',
          color: '#E0F2F1',
          border: '1px solid #00695C',
          boxShadow: '0 0 20px rgba(0,191,165,0.15)',
        },
      }}
    />
  </ThemeProvider>
</AntdRegistry>
      </body>
    </html>
  );
}
