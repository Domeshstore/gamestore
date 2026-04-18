'use client';
import { motion } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ss = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)' };

const CHANNELS = [
  {
    icon:'💬', name:'WhatsApp', handle:'6281234567890',
    desc:'Respon cepat, aktif 08.00–22.00 WIB',
    color:'oklch(0.55 0.15 145)', bg:'oklch(0.30 0.05 145 / 0.15)',
    link:'https://wa.me/6281234567890',
    badge:'Paling Cepat',
  },
  {
    icon:'✈️', name:'Telegram', handle:'@domesh_store',
    desc:'Notifikasi otomatis & chat 24 jam',
    color:'oklch(0.60 0.12 220)', bg:'oklch(0.28 0.05 220 / 0.15)',
    link:'https://t.me/domesh_store',
    badge:'24 Jam',
  },
  {
    icon:'📧', name:'Email', handle:'support@domesh.store',
    desc:'Untuk laporan & pertanyaan kompleks',
    color:'oklch(0.92 0.06 67.02)', bg:'oklch(0.92 0.06 67.02 / 0.10)',
    link:'mailto:support@domesh.store',
    badge:null,
  },
];

export default function ContactPage() {
  return (
    <AntProvider>
      <div className="min-h-screen" style={{ background:'oklch(0.20 0.00 17.53)' }}>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
            <div className="text-5xl mb-4">📞</div>
            <h1 className="text-4xl font-black text-white mb-2">Hubungi Kami</h1>
            <p style={{ color:'oklch(0.65 0.01 17.53)' }}>Tim Domesh Store siap membantu kamu</p>
          </motion.div>

          {/* Channels */}
          <div className="space-y-4 mb-10">
            {CHANNELS.map((c, i) => (
              <motion.a key={i} href={c.link} target="_blank" rel="noopener"
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.08 }}
                className="block p-5 rounded-2xl transition-all hover:-translate-y-1"
                style={{ background: c.bg, border:`1px solid ${c.color}30` }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background:`${c.color}15`, border:`1px solid ${c.color}25` }}>
                    {c.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span style={{ color:'white', fontWeight:800, fontSize:16 }}>{c.name}</span>
                      {c.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background:`${c.color}20`, color: c.color, border:`1px solid ${c.color}35` }}>
                          {c.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ color: c.color, fontWeight:700 }}>{c.handle}</div>
                    <div style={{ color:'oklch(0.65 0.01 17.53)', fontSize:13 }}>{c.desc}</div>
                  </div>
                  <span style={{ color: c.color, fontSize:20 }}>→</span>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Business hours */}
          <div className="p-5 rounded-2xl mb-6" style={ss}>
            <h3 style={{ color:'white', fontWeight:800, marginBottom:12 }}>🕐 Jam Operasional</h3>
            <div className="space-y-2">
              {[
                ['Senin – Jumat', '08.00 – 22.00 WIB'],
                ['Sabtu – Minggu', '09.00 – 21.00 WIB'],
                ['Hari Libur Nasional', '10.00 – 18.00 WIB'],
              ].map(([day, time]) => (
                <div key={day} className="flex justify-between">
                  <span style={{ color:'oklch(0.65 0.01 17.53)', fontSize:14 }}>{day}</span>
                  <span style={{ color:'white', fontWeight:700, fontSize:14 }}>{time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="p-5 rounded-2xl" style={{ background:'oklch(0.92 0.06 67.02 / 0.08)', border:'1px solid oklch(0.92 0.06 67.02 / 0.18)' }}>
            <h3 style={{ color:'oklch(0.92 0.06 67.02)', fontWeight:800, marginBottom:8 }}>💡 Tips saat menghubungi CS</h3>
            <ul style={{ color:'oklch(0.75 0.01 17.53)', fontSize:14, lineHeight:1.8 }}>
              <li>• Sertakan <strong style={{ color:'white' }}>Ref ID transaksi</strong> untuk penanganan lebih cepat</li>
              <li>• Lampirkan <strong style={{ color:'white' }}>screenshot bukti transfer</strong> jika ada masalah pembayaran</li>
              <li>• Cantumkan <strong style={{ color:'white' }}>User ID / Nomor HP</strong> yang di-top up</li>
            </ul>
          </div>
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}
