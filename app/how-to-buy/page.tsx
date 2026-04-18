'use client';
import { motion } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const STEPS = [
  { no:'01', icon:'🔍', title:'Pilih Produk', desc:'Cari produk — game top-up, pulsa, e-money, atau streaming.' },
  { no:'02', icon:'📝', title:'Masukkan Data', desc:'Isi ID akun, nomor HP, atau email sesuai produk yang dipilih.' },
  { no:'03', icon:'💎', title:'Pilih Nominal', desc:'Pilih nominal atau paket. Harga sudah termasuk semua biaya.' },
  { no:'04', icon:'💳', title:'Pilih Pembayaran', desc:'Bayar via QRIS, Transfer Bank, E-Wallet, atau Reward Points.' },
  { no:'05', icon:'📸', title:'Upload Bukti Bayar', desc:'Setelah transfer, upload screenshot bukti pembayaran.' },
  { no:'06', icon:'⚙️', title:'Pesanan Diproses', desc:'Tim kami memproses pesananmu. Estimasi 15 menit – 1×24 jam.' },
  { no:'07', icon:'🎉', title:'Selesai!', desc:'Top up masuk ke akunmu + kamu dapat Reward Points!' },
];

const FAQS_SHORT = [
  { q:'Berapa lama proses top up?', a:'Umumnya 15 menit – 1 hari kerja. Pulsa & e-money biasanya < 5 menit.' },
  { q:'Apakah ada diskon untuk pengguna baru?', a:'Ya! Gunakan kode NEWUSER33 untuk 33% diskon transaksi pertama.' },
  { q:'Bagaimana jika top up tidak masuk?', a:'Hubungi kami via WhatsApp dengan menyertakan Ref ID transaksi.' },
];

// Warna baru sesuai dengan tema #f8d9b9 dan #ea5234
const sectionStyle = { 
  background: '#2a2a2a', 
  border: '1px solid rgba(234, 82, 52, 0.25)' 
};

export default function HowToBuyPage() {
  return (
    <AntProvider>
      <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
            <div className="text-5xl mb-4">🛒</div>
            <h1 className="text-4xl font-black text-white mb-2">Cara Pembelian</h1>
            <p style={{ color: '#b4b4b4' }}>Mudah, cepat, dan aman — hanya 7 langkah</p>
          </motion.div>

          <div className="space-y-3 mb-12">
            {STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.06 }}
                className="flex items-start gap-4 p-4 rounded-2xl" style={sectionStyle}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: 'rgba(248, 217, 185, 0.12)', border: '1px solid rgba(248, 217, 185, 0.2)' }}>
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span style={{ color: '#ea5234', fontFamily: 'monospace', fontWeight: 900, fontSize: 11 }}>{step.no}</span>
                    <h3 style={{ color: '#f8d9b9', fontWeight: 800 }}>{step.title}</h3>
                  </div>
                  <p style={{ color: '#b4b4b4', fontSize: 14 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <h2 className="text-xl font-black text-white mb-4">❓ Pertanyaan Umum</h2>
          <div className="space-y-3 mb-10">
            {FAQS_SHORT.map((f, i) => (
              <div key={i} className="p-4 rounded-2xl" style={sectionStyle}>
                <p style={{ color: '#f8d9b9', fontWeight: 700, marginBottom: 4 }}>{f.q}</p>
                <p style={{ color: '#b4b4b4', fontSize: 14 }}>{f.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(248, 217, 185, 0.08)', border: '1px solid rgba(248, 217, 185, 0.18)' }}>
            <p className="text-white font-bold mb-4">Masih ada pertanyaan?</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/contact" className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90" 
                style={{ background: '#ea5234', color: '#ffffff' }}>
                Hubungi Kami
              </Link>
              <Link href="/faq" className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-white/10" 
                style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.4)', color: '#f8d9b9' }}>
                FAQ Lengkap
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}