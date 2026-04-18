'use client';
import { motion } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const STATS = [
  { value:'50K+', label:'Transaksi Sukses' },
  { value:'99.9%', label:'Uptime' },
  { value:'10K+', label:'Pelanggan Aktif' },
  { value:'500+', label:'Produk Tersedia' },
];
const VALUES = [
  { icon:'⚡', title:'Cepat', desc:'Proses top up instan, mayoritas selesai dalam hitungan menit.' },
  { icon:'🛡️', title:'Aman', desc:'Transaksi terenkripsi dan terlindungi. Data kamu aman bersama kami.' },
  { icon:'💰', title:'Murah', desc:'Harga kompetitif dengan reward points di setiap pembelian.' },
  { icon:'🎯', title:'Terpercaya', desc:'Beroperasi sejak 2023, melayani puluhan ribu pelanggan.' },
];

export default function AboutPage() {
  return (
    <AntProvider>
      <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-12">
            <div className="text-5xl mb-4"></div>
            <h1 className="text-4xl font-black text-white mb-3">Tentang BANGDIM Store</h1>
            <p style={{ color: '#b4b4b4', maxWidth: 500, margin: '0 auto' }}>
              Platform top up digital terpercaya untuk game, pulsa, e-money, dan layanan streaming di Indonesia.
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {STATS.map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.08 }}
                className="text-center p-5 rounded-2xl"
                style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
                <div style={{ color: '#ea5234', fontWeight: 900, fontSize: 28 }}>{s.value}</div>
                <div style={{ color: '#b4b4b4', fontSize: 13 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Story */}
          <div className="p-6 rounded-2xl mb-10" style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
            <h2 className="text-2xl font-black text-[#f8d9b9] mb-4">Cerita Kami</h2>
            <div style={{ color: '#b4b4b4', lineHeight: 1.8, fontSize: 15 }} className="space-y-3">
              <p>Domesh Store lahir dari kebutuhan sederhana — platform yang mudah, cepat, dan terpercaya untuk top up semua kebutuhan digital.</p>
              <p>Mulai dari game favorit seperti Mobile Legends dan Free Fire, hingga pulsa, e-money, dan layanan streaming — semuanya bisa kamu dapatkan di satu tempat dengan harga terbaik.</p>
              <p>Kami bermitra dengan Digiflazz dan Apigames sebagai provider resmi, memastikan setiap transaksi diproses dengan aman dan andal.</p>
            </div>
          </div>

          {/* Values */}
          <h2 className="text-2xl font-black text-[#f8d9b9] mb-5">Nilai-Nilai Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map((v, i) => (
              <motion.div key={i} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3+i*0.08 }}
                className="flex items-start gap-4 p-5 rounded-2xl"
                style={{ background: '#2a2a2a', border: '1px solid rgba(234, 82, 52, 0.25)' }}>
                <div className="text-3xl">{v.icon}</div>
                <div>
                  <h3 style={{ color: '#f8d9b9', fontWeight: 800, marginBottom: 4 }}>{v.title}</h3>
                  <p style={{ color: '#b4b4b4', fontSize: 14 }}>{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}