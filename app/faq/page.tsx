'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const FAQS = [
  { cat:'Umum', q:'Apa itu Domesh Store?', a:'Domesh Store adalah platform top up digital terpercaya untuk game, pulsa, e-money, dan layanan streaming di Indonesia. Kami menyediakan ratusan produk dengan harga terbaik dan proses cepat.' },
  { cat:'Umum', q:'Apakah Domesh Store aman?', a:'Ya, sangat aman. Kami menggunakan enkripsi SSL dan bermitra dengan Digiflazz & Apigames sebagai provider resmi. Transaksi diproses otomatis dan terverifikasi.' },
  { cat:'Umum', q:'Bagaimana cara daftar akun?', a:'Klik tombol "Daftar" di pojok kanan atas, isi nama, email, dan password. Langsung bisa digunakan tanpa verifikasi email.' },
  { cat:'Pembayaran', q:'Metode pembayaran apa saja yang tersedia?', a:'QRIS (semua e-wallet), Transfer Bank (BCA, Mandiri, dll), E-Wallet (GoPay, OVO, Dana, ShopeePay), dan Reward Points.' },
  { cat:'Pembayaran', q:'Apakah ada biaya tambahan?', a:'Tidak ada biaya tambahan tersembunyi. Harga yang tertera sudah final.' },
  { cat:'Pembayaran', q:'Apakah ada diskon untuk pengguna baru?', a:'Ya! Pengguna baru mendapat 33% diskon (maks. Rp 50.000) untuk transaksi pertama. Gunakan kode promo NEWUSER33 saat checkout.' },
  { cat:'Top Up', q:'Berapa lama proses top up?', a:'Mayoritas selesai dalam 15 menit. Pulsa dan e-money biasanya < 5 menit. Game top-up bisa hingga 1×24 jam di jam sibuk.' },
  { cat:'Top Up', q:'Bagaimana cara top up Mobile Legends?', a:'Buka halaman ML, masukkan User ID dan Zone ID kamu, pilih nominal diamond, bayar, dan konfirmasi. Diamond langsung masuk ke akun.' },
  { cat:'Top Up', q:'Bagaimana jika top up tidak masuk?', a:'Simpan Ref ID transaksi kamu, lalu hubungi CS kami via WhatsApp atau Telegram. Kami akan membantu dalam 1×24 jam.' },
  { cat:'Reward Points', q:'Apa itu Reward Points?', a:'Setiap pembelian kamu mendapat poin (1 poin per Rp 1.000). Poin bisa digunakan sebagai potongan harga di transaksi berikutnya.' },
  { cat:'Reward Points', q:'Bagaimana cara menggunakan Reward Points?', a:'Saat checkout, pilih opsi "Gunakan Reward Points" dan masukkan jumlah poin yang ingin digunakan sebagai potongan harga.' },
  { cat:'Promo', q:'Bagaimana cara menggunakan kode promo?', a:'Di halaman checkout, ada kolom "Kode Promo". Masukkan kode dan klik "Gunakan". Diskon otomatis teraplikasi.' },
  { cat:'Promo', q:'Apakah kode promo bisa digabung dengan Reward Points?', a:'Saat ini kode promo dan Reward Points tidak bisa digunakan bersamaan. Pilih salah satu yang memberikan keuntungan lebih besar.' },
];

const CATS = ['Semua', ...Array.from(new Set(FAQS.map(f => f.cat)))];
const ss = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)' };

export default function FAQPage() {
  const [cat, setCat] = useState('Semua');
  const [open, setOpen] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter(f => {
    const matchCat = cat === 'Semua' || f.cat === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <AntProvider>
      <div className="min-h-screen" style={{ background:'oklch(0.20 0.00 17.53)' }}>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
            <div className="text-5xl mb-4">❓</div>
            <h1 className="text-4xl font-black text-white mb-2">FAQ</h1>
            <p style={{ color:'oklch(0.65 0.01 17.53)' }}>Pertanyaan yang sering ditanyakan</p>
          </motion.div>

          {/* Search */}
          <div className="relative mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari pertanyaan..." className="input-field pl-10" />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
                style={cat === c
                  ? { background:'oklch(0.92 0.06 67.02)', color:'oklch(0.16 0.01 17.53)' }
                  : { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.35 0.02 34.90)', color:'oklch(0.75 0 0)' }}>
                {c}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="space-y-2">
            {filtered.map((f, i) => (
              <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*0.03 }}
                className="rounded-2xl overflow-hidden" style={ss}>
                <button className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setOpen(open === i ? null : i)}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background:'oklch(0.92 0.06 67.02 / 0.12)', color:'oklch(0.92 0.06 67.02)', border:'1px solid oklch(0.92 0.06 67.02 / 0.2)' }}>
                      {f.cat}
                    </span>
                    <span style={{ color:'white', fontWeight:700, fontSize:14 }}>{f.q}</span>
                  </div>
                  <span style={{ color:'oklch(0.65 0.01 17.53)', fontSize:18, flexShrink:0 }}>{open === i ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}>
                      <div className="px-4 pb-4 pt-0">
                        <div className="h-px mb-3" style={{ background:'oklch(0.32 0.02 34.90)' }} />
                        <p style={{ color:'oklch(0.75 0.01 17.53)', fontSize:14, lineHeight:1.7 }}>{f.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color:'oklch(0.50 0 0)' }}>
                Tidak ada pertanyaan yang cocok.
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}
