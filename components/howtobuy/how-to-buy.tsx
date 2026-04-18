'use client';
import { motion } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const STEPS = [
  { no:'01', icon:'🔍', title:'Pilih Produk', desc:'Cari produk yang kamu inginkan — game top-up, pulsa, e-money, streaming, atau voucher digital.' },
  { no:'02', icon:'📝', title:'Masukkan Data', desc:'Isi ID akun, nomor HP, atau email sesuai produk. Untuk game seperti ML, masukkan User ID dan Zone ID.' },
  { no:'03', icon:'💎', title:'Pilih Nominal', desc:'Pilih nominal atau paket yang sesuai kebutuhanmu. Harga sudah termasuk semua biaya.' },
  { no:'04', icon:'💳', title:'Pilih Pembayaran', desc:'Bayar via QRIS, Transfer Bank, E-Wallet (GoPay/OVO/Dana), atau gunakan Reward Points.' },
  { no:'05', icon:'📸', title:'Upload Bukti Bayar', desc:'Setelah transfer, upload screenshot bukti pembayaran di halaman transaksi.' },
  { no:'06', icon:'✅', title:'Pesanan Diproses', desc:'Tim kami memproses pesananmu. Estimasi 15 menit hingga 1×24 jam kerja.' },
  { no:'07', icon:'🎉', title:'Selesai!', desc:'Top up masuk ke akunmu. Kamu juga mendapat Reward Points untuk pembelian berikutnya!' },
];

const FAQS = [
  { q:'Berapa lama proses top up?', a:'Umumnya 15 menit – 1 hari kerja. Untuk pulsa & e-money biasanya lebih cepat (< 5 menit).' },
  { q:'Bagaimana cara mendapatkan diskon?', a:'Gunakan kode promo, atau gunakan Reward Points yang terkumpul dari setiap pembelian.' },
  { q:'Apa itu Reward Points?', a:'Setiap pembelian kamu mendapat 1 poin per Rp 1.000. Poin bisa digunakan sebagai potongan harga.' },
  { q:'Apakah ada diskon untuk pengguna baru?', a:'Ya! Pengguna baru mendapat 33% diskon (maks Rp 50.000) untuk transaksi pertama dengan kode NEWUSER33.' },
  { q:'Bagaimana jika top up tidak masuk?', a:'Hubungi kami via WhatsApp atau Telegram dengan menyertakan Ref ID transaksi. Kami proses dalam 1×24 jam.' },
];

export default function HowToBuyPage() {
  return (
    <AntProvider>
      <div className="min-h-screen" style={{ background: 'oklch(0.20 0.00 17.53)' }}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Hero */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-12">
            <div className="text-5xl mb-4">🛒</div>
            <h1 className="text-4xl font-black text-white mb-3">Cara Pembelian</h1>
            <p style={{ color:'oklch(0.65 0.01 17.53)' }}>Mudah, cepat, dan aman — hanya 7 langkah</p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-4 mb-14">
            {STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.07 }}
                className="flex items-start gap-5 p-5 rounded-2xl"
                style={{ background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background:'oklch(0.92 0.06 67.02 / 0.12)', border:'1px solid oklch(0.92 0.06 67.02 / 0.2)' }}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span style={{ color:'oklch(0.92 0.06 67.02)', fontFamily:'monospace', fontWeight:900, fontSize:12 }}>{step.no}</span>
                    <h3 style={{ color:'white', fontWeight:800, fontSize:16 }}>{step.title}</h3>
                  </div>
                  <p style={{ color:'oklch(0.65 0.01 17.53)', fontSize:14 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <h2 className="text-2xl font-black text-white mb-5">❓ Pertanyaan Umum</h2>
          <div className="space-y-3 mb-10">
            {FAQS.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.5+i*0.05 }}
                className="p-4 rounded-2xl"
                style={{ background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)' }}>
                <p style={{ color:'white', fontWeight:700, marginBottom:4 }}>{f.q}</p>
                <p style={{ color:'oklch(0.65 0.01 17.53)', fontSize:14 }}>{f.a}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center p-8 rounded-2xl" style={{ background:'oklch(0.92 0.06 67.02 / 0.10)', border:'1px solid oklch(0.92 0.06 67.02 / 0.20)' }}>
            <p className="text-white font-bold text-lg mb-4">Masih ada pertanyaan?</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/contact" className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ background:'oklch(0.92 0.06 67.02)', color:'oklch(0.16 0.01 17.53)' }}>
                Hubungi Kami
              </Link>
              <Link href="/faq" className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)', color:'white' }}>
                Lihat FAQ Lengkap
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}

