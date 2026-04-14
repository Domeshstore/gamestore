'use client';

/**
 * Panduan Cara Top Up Game
 * Halaman ini menjelaskan langkah-langkah top up game
 */

import { useState } from 'react';
import {
  Card, Row, Col, Typography, Steps, Collapse, Alert, Tag, Space,
  Timeline, Avatar, Divider, Tabs, Badge, List, Button, Modal,
} from 'antd';
import {
  ShoppingOutlined, MobileOutlined, WalletOutlined, CheckCircleOutlined,
  QuestionCircleOutlined, ThunderboltOutlined, UserOutlined,
  IdcardOutlined, CopyOutlined, MessageOutlined, YoutubeOutlined,
  FileTextOutlined, SafetyOutlined, ClockCircleOutlined,
  BankOutlined, QrcodeOutlined, GiftOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Game icon mapping
const gameIcons: Record<string, { icon: string; color: string }> = {
  mlbb: { icon: '', color: '#0066FF' },
  ff: { icon: '', color: '#FF6600' },
  pubgm: { icon: '', color: '#FFCC00' },
  gi: { icon: '', color: '#4ADE80' },
  lol: { icon: '', color: '#00BFFF' },
  valo: { icon: '', color: '#FF4655' },
  default: { icon: '', color: '#8B5CF6' },
};

const getGameInfo = (gameName: string) => {
  const lower = gameName.toLowerCase();
  if (lower.includes('ml') || lower.includes('mobile legends')) return gameIcons.mlbb;
  if (lower.includes('free fire') || lower.includes('ff')) return gameIcons.ff;
  if (lower.includes('pubg')) return gameIcons.pubgm;
  if (lower.includes('genshin')) return gameIcons.gi;
  if (lower.includes('league') || lower.includes('lol')) return gameIcons.lol;
  if (lower.includes('valorant')) return gameIcons.valo;
  return gameIcons.default;
};

export default function TopUpGuidePage() {
  const [activeTab, setActiveTab] = useState('umum');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const popularGames = [
    { name: 'Mobile Legends', code: 'MLBB', idFormat: 'User ID_Zone ID', example: '12345678_1234' },
    { name: 'Free Fire', code: 'FF', idFormat: 'User ID', example: '123456789' },
    { name: 'PUBG Mobile', code: 'PUBGM', idFormat: 'User ID', example: '5123456789' },
    { name: 'Genshin Impact', code: 'GI', idFormat: 'UID', example: '123456789' },
    { name: 'Valorant', code: 'VALO', idFormat: 'Riot ID', example: 'username#tag' },
    { name: 'Call of Duty', code: 'COD', idFormat: 'User ID', example: '1234567890123456' },
  ];

  const paymentMethods = [
    { name: 'Bank Transfer', icon: <BankOutlined />, fee: 0, min: 10000, time: '1-5 menit' },
    { name: 'QRIS', icon: <QrcodeOutlined />, fee: 0, min: 5000, time: 'Instan' },
    { name: 'E-Wallet (Dana, OVO, GoPay)', icon: <WalletOutlined />, fee: 0, min: 10000, time: 'Instan' },
  ];

  const faqs = [
    {
      question: 'Berapa lama proses top up?',
      answer: 'Proses top up biasanya memakan waktu 1-5 menit setelah pembayaran dikonfirmasi. Untuk beberapa game, proses bisa memakan waktu hingga 15 menit terutama saat jam sibuk atau maintenance server.'
    },
    {
      question: 'Apakah ada biaya admin?',
      answer: 'Tidak ada biaya admin tambahan! Harga yang ditampilkan sudah termasuk semua biaya. Anda membayar sesuai dengan harga yang tertera.'
    },
    {
      question: 'Bagaimana jika salah memasukkan ID?',
      answer: 'Jika Anda salah memasukkan ID, harap segera hubungi customer service kami. Kami akan berusaha membantu membatalkan atau mengarahkan top up ke ID yang benar, namun tidak dapat dijamin 100% karena proses sudah otomatis ke server game.'
    },
    {
      question: 'Apa yang harus dilakukan jika top up belum masuk?',
      answer: 'Jika top up belum masuk setelah 15 menit, silakan cek status transaksi di halaman riwayat. Jika status masih pending, hubungi CS kami dengan menyertakan bukti pembayaran dan ID game Anda.'
    },
    {
      question: 'Apakah aman top up di sini?',
      answer: 'Kami menggunakan sistem keamanan berlapis dan terintegrasi langsung dengan provider resmi. Semua transaksi dienkripsi dan data Anda aman.'
    },
    {
      question: 'Metode pembayaran apa saja yang tersedia?',
      answer: 'Kami mendukung berbagai metode pembayaran: Transfer Bank (BCA, Mandiri, BRI, BNI), E-Wallet (Dana, OVO, GoPay, LinkAja), dan QRIS.'
    },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin!');
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'oklch(0.20 0.00 17.53)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, oklch(0.92 0.06 67.02), oklch(0.78 0.12 62.00))' }}>
            <GiftOutlined style={{ fontSize: 40, color: '#1a1208' }} />
          </div>
          <Title level={1} style={{ color: 'oklch(0.95 0 0)', fontWeight: 900, marginBottom: 8 }}>
            Panduan Top Up Game
          </Title>
          <Text style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 16 }}>
            Ikuti langkah mudah berikut untuk top up diamond, voucher, dan item game favoritmu
          </Text>
        </motion.div>

        {/* Quick Steps Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 24 }}>
            <Steps
              current={-1}
              items={[
                { title: 'Pilih Game', description: 'Pilih game favoritmu', icon: <ShoppingOutlined /> },
                { title: 'Pilih Item', description: 'Pilih diamond/voucher', icon: <GiftOutlined /> },
                { title: 'Masukkan ID', description: 'Input User ID game', icon: <UserOutlined /> },
                { title: 'Bayar', description: 'Selesaikan pembayaran', icon: <WalletOutlined /> },
                { title: 'Dapatkan Item', description: 'Item langsung masuk', icon: <CheckCircleOutlined /> },
              ]}
              responsive={false}
              titlePlacement="vertical"
              className="custom-steps"
            />
          </Card>
        </motion.div>

        {/* Tabs for different sections */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          size="large"
          items={[
            { key: 'umum', label: <span><QuestionCircleOutlined /> Panduan Umum</span> },
            { key: 'pergame', label: <span><MobileOutlined /> Panduan Per Game</span> },
            { key: 'pembayaran', label: <span><BankOutlined /> Metode Pembayaran</span> },
            { key: 'faq', label: <span><MessageOutlined /> FAQ</span> },
          ]}
        />

        {/* TAB: Panduan Umum */}
        {activeTab === 'umun' && (
          <Row gutter={[24, 24]}>
            {/* Step by step guide */}
            <Col xs={24} lg={16}>
              <Card
                title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>📝 Langkah-Langkah Top Up</span>}
                style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 20 }}
              >
                <Timeline
                  items={[
                    {
                      dot: <ShoppingOutlined style={{ fontSize: 16 }} />,
                      color: '#f0c060',
                      children: (
                        <div className="mb-4">
                          <Title level={5} style={{ color: 'oklch(0.95 0 0)' }}>1. Pilih Game</Title>
                          <Text style={{ color: 'oklch(0.70 0 0)' }}>
                            Pilih game yang ingin kamu top up dari daftar game yang tersedia.
                            Kami menyediakan berbagai game populer seperti Mobile Legends, Free Fire, PUBG Mobile, dan lainnya.
                          </Text>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {popularGames.slice(0, 4).map(g => (
                              <Tag key={g.code} style={{ borderRadius: 99, padding: '4px 12px' }}>
                                {g.name}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      ),
                    },
                    {
                      dot: <GiftOutlined style={{ fontSize: 16 }} />,
                      color: '#f0c060',
                      children: (
                        <div className="mb-4">
                          <Title level={5} style={{ color: 'oklch(0.95 0 0)' }}>2. Pilih Item / Nominal</Title>
                          <Text style={{ color: 'oklch(0.70 0 0)' }}>
                            Pilih item yang ingin dibeli seperti Diamond, UC, V-Bucks, atau voucher game lainnya.
                            Setiap item sudah tertera harga yang jelas tanpa biaya tersembunyi.
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <UserOutlined style={{ fontSize: 16 }} />,
                      color: '#f0c060',
                      children: (
                        <div className="mb-4">
                          <Title level={5} style={{ color: 'oklch(0.95 0 0)' }}>3. Masukkan ID Game</Title>
                          <Text style={{ color: 'oklch(0.70 0 0)' }}>
                            Masukkan User ID atau karakter ID dari akun game kamu.
                            Pastikan ID yang dimasukkan benar untuk menghindari kesalahan pengiriman.
                          </Text>
                          <Alert
                            title="Contoh Format ID"
                            description={
                              <ul className="mt-2 space-y-1">
                                <li><strong>Mobile Legends:</strong> 12345678_1234 (User ID_Zone ID)</li>
                                <li><strong>Free Fire:</strong> 123456789</li>
                                <li><strong>PUBG Mobile:</strong> 5123456789</li>
                              </ul>
                            }
                            type="info"
                            showIcon
                            style={{ marginTop: 12, borderRadius: 12 }}
                          />
                        </div>
                      ),
                    },
                    {
                      dot: <WalletOutlined style={{ fontSize: 16 }} />,
                      color: '#f0c060',
                      children: (
                        <div className="mb-4">
                          <Title level={5} style={{ color: 'oklch(0.95 0 0)' }}>4. Lakukan Pembayaran</Title>
                          <Text style={{ color: 'oklch(0.70 0 0)' }}>
                            Pilih metode pembayaran yang tersedia dan selesaikan transaksi.
                            Setelah pembayaran berhasil, pesanan akan langsung diproses.
                          </Text>
                        </div>
                      ),
                    },
                    {
                      dot: <CheckCircleOutlined style={{ fontSize: 16 }} />,
                      color: '#4ade80',
                      children: (
                        <div>
                          <Title level={5} style={{ color: 'oklch(0.95 0 0)' }}>5. Item Masuk ke Akun</Title>
                          <Text style={{ color: 'oklch(0.70 0 0)' }}>
                            Item akan langsung masuk ke akun game kamu dalam waktu 1-5 menit.
                            Kamu bisa cek status transaksi di halaman riwayat pesanan.
                          </Text>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </Col>

            {/* Tips & Important Info */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card
                  title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>💡 Tips Penting</span>}
                  style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 20 }}
                >
                  <List
                    dataSource={[
                      { icon: <SafetyOutlined style={{ color: '#4ade80' }} />, text: 'Pastikan ID game benar sebelum melakukan pembayaran' },
                      { icon: <ClockCircleOutlined style={{ color: '#fbbf24' }} />, text: 'Top up biasanya diproses dalam 1-5 menit' },
                      { icon: <CopyOutlined style={{ color: '#60a5fa' }} />, text: 'Simpan bukti pembayaran untuk referensi' },
                      { icon: <MessageOutlined style={{ color: '#f0c060' }} />, text: 'Hubungi CS jika ada kendala' },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          {item.icon}
                          <Text style={{ color: 'oklch(0.80 0 0)' }}>{item.text}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>

                <Card
                  title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>⚠️ Perhatian</span>}
                  style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20 }}
                >
                  <Alert
                    type="warning"
                    showIcon
                    message="Jangan Berbagi Informasi Akun"
                    description="Kami tidak pernah meminta password akun game Anda. Jangan berikan informasi login Anda kepada siapa pun."
                    style={{ background: 'transparent', border: 'none', padding: 0 }}
                  />
                  <Divider style={{ margin: '12px 0', borderColor: 'oklch(0.32 0.02 34.90)' }} />
                  <Alert
                    type="error"
                    showIcon
                    message="Cek Kembali ID Game"
                    description="Kesalahan input ID game bukan tanggung jawab kami. Pastikan ID yang dimasukkan sudah benar."
                    style={{ background: 'transparent', border: 'none', padding: 0 }}
                  />
                </Card>

                {/* Contact Support */}
                <Card
                  title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>📞 Butuh Bantuan?</span>}
                  style={{ background: 'linear-gradient(135deg, oklch(0.30 0.05 130 / 0.2), oklch(0.25 0.04 225 / 0.2))', border: '1px solid oklch(0.45 0.08 225 / 0.3)', borderRadius: 20 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      block
                      icon={<MessageOutlined />}
                      style={{ borderRadius: 12, height: 44, fontWeight: 600 }}
                    >
                      Chat Customer Service
                    </Button>
                    <Button
                      block
                      icon={<YoutubeOutlined />}
                      style={{ borderRadius: 12, height: 44, fontWeight: 600 }}
                    >
                      Video Tutorial
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        )}

        {/* TAB: Panduan Per Game */}
        {activeTab === 'pergame' && (
          <Row gutter={[24, 24]}>
            {popularGames.map((game, idx) => (
              <Col xs={24} md={12} lg={8} key={game.code}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    hoverable
                    style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 20 }}
                    onClick={() => setSelectedGame(game.name)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar
                        size={48}
                        style={{ background: getGameInfo(game.name).color, fontSize: 24 }}
                      >
                        {getGameInfo(game.name).icon}
                      </Avatar>
                      <div>
                        <Title level={5} style={{ color: 'oklch(0.95 0 0)', marginBottom: 4 }}>
                          {game.name}
                        </Title>
                        <Text style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12 }}>
                          Kode: {game.code}
                        </Text>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl mb-3" style={{ background: 'oklch(0.22 0.01 17.53)' }}>
                      <Text style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12, display: 'block', marginBottom: 8 }}>
                        Format ID:
                      </Text>
                      <Space>
                        <code style={{ color: '#f0c060', background: 'oklch(0.16 0.01 17.53)', padding: '4px 8px', borderRadius: 8 }}>
                          {game.idFormat}
                        </code>
                        <Button
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(game.example); }}
                        >
                          Contoh
                        </Button>
                      </Space>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge count="Populer" style={{ backgroundColor: '#f0c060', color: '#1a1208' }} />
                      <Button type="link" style={{ color: '#f0c060' }}>
                        Lihat Panduan →
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        )}

        {/* TAB: Metode Pembayaran */}
        {activeTab === 'pembayaran' && (
          <Row gutter={[24, 24]}>
            {paymentMethods.map((method, idx) => (
              <Col xs={24} md={8} key={method.name}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 20, textAlign: 'center' }}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: 'rgba(240,192,96,0.1)' }}>
                      <span style={{ fontSize: 28, color: '#f0c060' }}>{method.icon}</span>
                    </div>
                    <Title level={4} style={{ color: 'oklch(0.95 0 0)', marginBottom: 8 }}>
                      {method.name}
                    </Title>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text style={{ color: 'oklch(0.65 0.01 17.53)' }}>
                        Min. Top Up: Rp {method.min.toLocaleString()}
                      </Text>
                      <Text style={{ color: '#4ade80' }}>
                        Biaya Admin: Rp 0
                      </Text>
                      <Text style={{ color: '#60a5fa' }}>
                        ⚡ {method.time}
                      </Text>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
            ))}

            {/* Payment flow illustration */}
            <Col xs={24}>
              <Card
                title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>🔄 Alur Pembayaran</span>}
                style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 20 }}
              >
                <Row gutter={[16, 16]}>
                  {[
                    { step: 1, title: 'Pilih Metode', desc: 'Pilih metode pembayaran yang tersedia' },
                    { step: 2, title: 'Input Nominal', desc: 'Masukkan nominal yang akan dibayar' },
                    { step: 3, title: 'Konfirmasi', desc: 'Periksa detail pesanan' },
                    { step: 4, title: 'Bayar', desc: 'Lakukan pembayaran sesuai instruksi' },
                    { step: 5, title: 'Selesai', desc: 'Pesanan langsung diproses' },
                  ].map((item) => (
                    <Col xs={24} sm={8} md={4} key={item.step}>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
                          style={{ background: '#f0c060', color: '#1a1208', fontWeight: 900 }}>
                          {item.step}
                        </div>
                        <Text strong style={{ color: 'oklch(0.95 0 0)', display: 'block' }}>
                          {item.title}
                        </Text>
                        <Text style={{ color: 'oklch(0.65 0.01 17.53)', fontSize: 12 }}>
                          {item.desc}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* TAB: FAQ */}
        {activeTab === 'faq' && (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card
                title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>❓ Pertanyaan yang Sering Diajukan</span>}
                style={{ background: 'oklch(0.27 0.01 17.95)', border: '1px solid oklch(0.32 0.02 34.90)', borderRadius: 20 }}
              >
                <Collapse
                  bordered={false}
                  style={{ background: 'transparent' }}
                  items={faqs.map((faq, idx) => ({
                    key: idx,
                    label: <Text strong style={{ color: 'oklch(0.95 0 0)' }}>{faq.question}</Text>,
                    children: <Text style={{ color: 'oklch(0.70 0 0)' }}>{faq.answer}</Text>,
                  }))}
                />
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>📞 Hubungi CS</span>}
                style={{ background: 'linear-gradient(135deg, oklch(0.30 0.05 130 / 0.2), oklch(0.25 0.04 225 / 0.2))', border: '1px solid oklch(0.45 0.08 225 / 0.3)', borderRadius: 20 }}
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div className="text-center">
                    <Avatar size={64} icon={<CustomerServiceOutlined />} style={{ background: '#f0c060', color: '#1a1208', marginBottom: 12 }} />
                    <Title level={5} style={{ color: 'oklch(0.95 0 0)' }}>Customer Service</Title>
                    <Text style={{ color: 'oklch(0.65 0.01 17.53)' }}>Senin-Minggu, 08:00-22:00</Text>
                  </div>
                  <Divider style={{ margin: 0, borderColor: 'oklch(0.32 0.02 34.90)' }} />
                  <Button block icon={<MessageOutlined />} size="large" style={{ borderRadius: 12, fontWeight: 600 }}>
                    Live Chat
                  </Button>
                  <Button block icon={<YoutubeOutlined />} size="large" style={{ borderRadius: 12, fontWeight: 600 }}>
                    Video Tutorial
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Text style={{ color: 'oklch(0.45 0.01 17.53)', fontSize: 12 }}>
            © 2024 GameVoucher. Harga dapat berubah sewaktu-waktu. Semua transaksi bersifat final.
            <br />
            GameVoucher adalah mitra resmi dan terintegrasi langsung dengan provider game.
          </Text>
        </motion.div>
      </div>

      {/* Game Detail Modal */}
      <Modal
        open={!!selectedGame}
        onCancel={() => setSelectedGame(null)}
        footer={null}
        title={<span style={{ color: 'oklch(0.95 0 0)', fontWeight: 800 }}>Panduan Top Up {selectedGame}</span>}
        width={600}
        styles={{
          header: { background: 'oklch(0.27 0.01 17.95)', borderBottom: '1px solid oklch(0.32 0.02 34.90)' },
        }}
      >
        {selectedGame && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: 'oklch(0.22 0.01 17.53)' }}>
              <Text strong style={{ color: 'oklch(0.95 0 0)', display: 'block', marginBottom: 8 }}>
                Cara Mendapatkan ID:
              </Text>
              <Text style={{ color: 'oklch(0.70 0 0)' }}>
                {selectedGame === 'Mobile Legends' && (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Buka game Mobile Legends</li>
                    <li>Klik avatar/profile di pojok kiri atas</li>
                    <li>Lihat bagian "Account ID" dan "Zone ID"</li>
                    <li>Gabungkan dengan format: AccountID_ZoneID (contoh: 12345678_1234)</li>
                  </ol>
                )}
                {selectedGame === 'Free Fire' && (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Buka game Free Fire</li>
                    <li>Klik avatar/profile</li>
                    <li>Lihat ID yang tertera di bawah nama karakter</li>
                    <li>Masukkan ID tersebut (contoh: 123456789)</li>
                  </ol>
                )}
                {selectedGame === 'PUBG Mobile' && (
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Buka game PUBG Mobile</li>
                    <li>Klik avatar/profile</li>
                    <li>Lihat "Player ID" di pojok kanan bawah</li>
                    <li>Masukkan ID tersebut</li>
                  </ol>
                )}
              </Text>
            </div>

            <Alert
              type="info"
              showIcon
              message="Pastikan ID yang dimasukkan benar"
              description="Kesalahan input ID bukan tanggung jawab kami. Cek kembali ID sebelum melakukan pembayaran."
              style={{ borderRadius: 12 }}
            />

            <Button
              type="primary"
              block
              size="large"
              icon={<ShoppingOutlined />}
              style={{ borderRadius: 12, fontWeight: 700, height: 48 }}
              onClick={() => {
                setSelectedGame(null);
                // Navigate to game list or top up page
                window.location.href = '/dashboard/games';
              }}
            >
              Top Up {selectedGame} Sekarang
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Missing import
import { CustomerServiceOutlined } from '@ant-design/icons';