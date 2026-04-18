'use client';
import { motion } from 'framer-motion';
import AntProvider from '@/components/providers/AntProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ss = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)' };

const SECTIONS = [
  { title:'1. Informasi yang Kami Kumpulkan', content:`Kami mengumpulkan informasi yang kamu berikan saat mendaftar (nama, email, nomor HP) dan data transaksi (ID game, nomor tujuan, metode pembayaran). Kami juga mengumpulkan data teknis seperti IP address dan browser untuk keamanan.` },
  { title:'2. Penggunaan Informasi', content:`Informasi digunakan untuk: memproses transaksi dan top up, mengirim notifikasi transaksi, memberikan layanan customer support, meningkatkan kualitas layanan, serta mencegah penipuan dan penyalahgunaan.` },
  { title:'3. Keamanan Data', content:`Data kamu dilindungi dengan enkripsi SSL/TLS. Kami tidak pernah menyimpan informasi kartu kredit. Password disimpan dalam bentuk hash yang tidak bisa dibaca. Akses data dibatasi hanya untuk staf yang berwenang.` },
  { title:'4. Berbagi Data', content:`Kami tidak menjual atau menyewakan data pribadimu. Data hanya dibagikan kepada provider pembayaran (Digiflazz, Apigames) yang diperlukan untuk memproses transaksi, dan pihak berwajib jika diwajibkan oleh hukum.` },
  { title:'5. Reward Points & Promo', content:`Data penggunaan reward points dan riwayat promo disimpan untuk keperluan akurasi layanan. Data ini tidak dibagikan ke pihak ketiga selain untuk verifikasi internal.` },
  { title:'6. Hak Pengguna', content:`Kamu berhak mengakses, mengubah, atau menghapus data pribadimu kapan saja melalui halaman profil atau dengan menghubungi CS kami. Kamu juga bisa meminta penghapusan akun beserta seluruh datanya.` },
  { title:'7. Cookie', content:`Kami menggunakan cookie untuk menyimpan preferensi dan token autentikasi. Kamu bisa menonaktifkan cookie di pengaturan browser, namun beberapa fitur mungkin tidak berfungsi optimal.` },
  { title:'8. Perubahan Kebijakan', content:`Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di platform. Penggunaan layanan setelah perubahan berarti kamu menyetujui kebijakan terbaru.` },
  { title:'9. Kontak', content:`Jika ada pertanyaan tentang kebijakan privasi ini, hubungi kami di: support@domesh.store atau via WhatsApp/Telegram yang tertera di halaman Hubungi Kami.` },
];

export default function PrivacyPage() {
  return (
    <AntProvider>
      <div className="min-h-screen" style={{ background:'oklch(0.20 0.00 17.53)' }}>
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-4xl font-black text-white mb-2">Kebijakan Privasi</h1>
            <p style={{ color:'oklch(0.65 0.01 17.53)' }}>Terakhir diperbarui: Januari 2025</p>
          </motion.div>

          <div className="p-5 rounded-2xl mb-6" style={{ background:'oklch(0.92 0.06 67.02 / 0.08)', border:'1px solid oklch(0.92 0.06 67.02 / 0.18)' }}>
            <p style={{ color:'oklch(0.75 0.01 17.53)', fontSize:14, lineHeight:1.8 }}>
              Domesh Store berkomitmen melindungi privasi dan keamanan data pengguna. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadimu.
            </p>
          </div>

          <div className="space-y-4">
            {SECTIONS.map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.04 }}
                className="p-5 rounded-2xl" style={ss}>
                <h3 style={{ color:'oklch(0.92 0.06 67.02)', fontWeight:800, marginBottom:8, fontSize:15 }}>{s.title}</h3>
                <p style={{ color:'oklch(0.75 0.01 17.53)', fontSize:14, lineHeight:1.8 }}>{s.content}</p>
              </motion.div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </AntProvider>
  );
}
