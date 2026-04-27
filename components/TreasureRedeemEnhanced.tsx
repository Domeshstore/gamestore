'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Card, Tag, Spin, Alert, Progress } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import { 
  GiftOutlined, LockOutlined, TrophyOutlined, FireOutlined, 
  StarOutlined, ThunderboltOutlined, RocketOutlined,  
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { treasureAPI } from '@/lib/api/client';
import TreasureChest from './TreasureChest';
import Confetti from 'react-confetti';

interface TreasureData {
  treasure: {
    name: string;
    description: string;
    coinsAmount: number;
    rarity: string;
    icon: string;
    gradient: string;
  };
  user: {
    deltaCoins: number;
    totalEarned: number;
  };
  message: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (coins: number) => void;
}

const rarityConfig = {
  common: { 
    color: '#94a3b8', 
    bg: 'from-gray-400 to-gray-600', 
    gradient: 'from-slate-500 to-gray-700',
    glow: 'rgba(148,163,184,0.3)',
    label: 'Biasa',
    icon: '📦',
    multiplier: 1 
  },
  rare: { 
    color: '#3b82f6', 
    bg: 'from-blue-500 to-blue-700',
    gradient: 'from-blue-500 to-indigo-700',
    glow: 'rgba(59,130,246,0.3)',
    label: 'Langka',
    icon: '💎',
    multiplier: 2 
  },
  epic: { 
    color: '#a855f7', 
    bg: 'from-purple-500 to-purple-700',
    gradient: 'from-purple-500 to-pink-600',
    glow: 'rgba(168,85,247,0.3)',
    label: 'Epik',
    icon: '👑',
    multiplier: 3 
  },
  legendary: { 
    color: '#fbbf24', 
    bg: 'from-yellow-500 to-orange-600',
    gradient: 'from-yellow-500 to-red-600',
    glow: 'rgba(251,191,36,0.4)',
    label: 'Legendaris',
    icon: '🌟',
    multiplier: 5 
  },
};

export default function TreasureRedeemEnhanced({ visible, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TreasureData | null>(null);
  const [deltaCoins, setDeltaCoins] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showChest, setShowChest] = useState(false);
  const [chestOpening, setChestOpening] = useState(false);
  const [stage, setStage] = useState<'input' | 'chest' | 'result'>('input');

  const fetchCoins = async () => {
    try {
      const res = await treasureAPI.getMyCoins();
      setDeltaCoins(res.data.data.deltaCoins);
    } catch (err) {
      console.error('Failed to fetch coins:', err);
    }
  };

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error('Masukkan kode harta karun!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await treasureAPI.redeem(code.toUpperCase());
      const data = res.data.data;
      
      setResult(data);
      setDeltaCoins(data.user.deltaCoins);
      
      // Start chest animation
      setStage('chest');
      setChestOpening(true);
      
      toast.success(data.message);
      setCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menukar kode');
      setStage('input');
    } finally {
      setLoading(false);
    }
  };

  const handleChestOpen = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleCoinsCollected = (amount: number) => {
    setTimeout(() => {
      setStage('result');
      onSuccess(amount);
    }, 800);
  };

  const handleClose = () => {
    setStage('input');
    setResult(null);
    setChestOpening(false);
    onClose();
  };

  // Fetch coins on mount
  useEffect(() => {
    if (visible) {
      fetchCoins();
      setStage('input');
      setResult(null);
      setChestOpening(false);
    }
  }, [visible]);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          colors={['#fbbf24', '#f59e0b', '#ea580c', '#dc2626', '#8b5cf6']}
        />
      )}
      
      <Modal
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={550}
        className="treasure-modal"
        styles={{
          body: { padding: 0, background: 'transparent' },
          
        }}
      >
        <div className="relative">
          {/* Background Glow berdasarkan rarity */}
          {result && stage !== 'input' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, ${rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.glow || 'rgba(251,191,36,0.2)'}, transparent 70%)`
              }}
            />
          )}

          <div className="relative p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                animate={stage === 'chest' ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
                style={{ 
                  background: result && stage !== 'input'
                    ? `linear-gradient(135deg, ${rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.color || '#fbbf24'}, ${rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.color}cc)`
                    : 'linear-gradient(135deg, #fbbf24, #ea580c)'
                }}
              >
                {stage === 'chest' ? (
                  <GiftOutlined style={{ fontSize: 32, color: 'white' }} />
                ) : stage === 'result' ? (
                  <TrophyOutlined style={{ fontSize: 32, color: 'white' }} />
                ) : (
                  <LockOutlined style={{ fontSize: 32, color: 'white' }} />
                )}
              </motion.div>
              
              <AnimatePresence mode="wait">
                {stage === 'input' && (
                  <motion.div
                    key="input-header"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-xl font-bold text-white">Buka Harta Karun</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Masukkan kode rahasia untuk mendapatkan Delta Coins!
                    </p>
                  </motion.div>
                )}
                
                {stage === 'chest' && (
                  <motion.div
                    key="chest-header"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <h2 className="text-xl font-bold text-amber-400">Membuka Harta Karun...</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Kejutan sedang menanti!
                    </p>
                  </motion.div>
                )}
                
                {stage === 'result' && result && (
                  <motion.div
                    key="result-header"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl">{result.treasure.icon}</span>
                      <h2 className="text-xl font-bold text-white">Selamat!</h2>
                    </div>
                    <p className="text-amber-400 text-sm mt-1 font-semibold">
                      {result.message}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delta Coins Display */}
            {deltaCoins !== null && stage === 'input' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">💰 Delta Coins kamu:</span>
                  <span className="text-2xl font-bold text-amber-400">{deltaCoins.toLocaleString()}</span>
                </div>
              </motion.div>
            )}

            {/* Treasure Chest Animation */}
            {stage === 'chest' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8"
              >
                <TreasureChest
                  coinsAmount={result?.treasure.coinsAmount || 100}
                  isOpening={chestOpening}
                  onOpen={handleChestOpen}
                  onCoinsCollected={handleCoinsCollected}
                />
              </motion.div>
            )}

            {/* Result Display */}
            {stage === 'result' && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.3, delay: 0.2 }}
                className="mt-4"
              >
                <Card
                  className={`bg-gradient-to-r ${rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.gradient || 'from-yellow-500 to-orange-600'}`}
                  style={{ borderRadius: 20, border: 'none', overflow: 'hidden' }}
                >
                  {/* Rarity Badge */}
                  <div className="absolute top-2 right-2">
                    <Tag 
                      color="gold" 
                      style={{ borderRadius: 99, fontWeight: 700, background: 'rgba(0,0,0,0.3)', border: 'none' }}
                    >
                      <StarOutlined className="mr-1" />
                      {rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.label || 'Biasa'}
                    </Tag>
                  </div>

                  <div className="text-center text-white py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                      className="text-6xl mb-3"
                    >
                      {result.treasure.icon}
                    </motion.div>
                    
                    <h3 className="text-xl font-bold">{result.treasure.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{result.treasure.description}</p>
                    
                    {/* Coins Amount with Animation */}
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.5 }}
                      className="mt-5 p-4 bg-white/20 rounded-xl backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="w-6 h-6" />
                        <div className="text-3xl font-bold">
                          +{result.treasure.coinsAmount.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm mt-1">Delta Coins</div>
                    </motion.div>

                    {/* Progress to next reward */}
                    {result.user.totalEarned && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Total terkumpul</span>
                          <span>{result.user.totalEarned.toLocaleString()} Δ</span>
                        </div>
                        <Progress 
                          percent={Math.min((result.user.totalEarned % 1000) / 10, 100)} 
                          showInfo={false}
                          strokeColor="#fbbf24"
                          trailColor="rgba(255,255,255,0.2)"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-4">
                  <Button
                    block
                    onClick={handleClose}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 12,
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    Tutup
                  </Button>
                  <Button
                    type="primary"
                    block
                    icon={<GiftOutlined />}
                    onClick={() => {
                      setStage('input');
                      setResult(null);
                      setChestOpening(false);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #ea580c)',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 600
                    }}
                  >
                    Buka Lagi
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Input Form */}
            {stage === 'input' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Input
                  placeholder="Contoh: DELTA-ABC12-XYZ78"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onPressEnter={handleRedeem}
                  size="large"
                  prefix={<LockOutlined style={{ color: '#fbbf24' }} />}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  className="treasure-input"
                />

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  onClick={handleRedeem}
                  icon={<GiftOutlined />}
                  style={{
                    height: 48,
                    fontWeight: 700,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fbbf24, #ea580c)',
                    border: 'none',
                  }}
                >
                  {loading ? 'Memverifikasi...' : 'Buka Harta Karun!'}
                </Button>

                {/* Tips */}
                <div className="mt-4 p-3 rounded-lg bg-slate-800/30 text-center">
                  <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                    <RocketOutlined className="text-amber-400" />
                    Dapatkan kode dari event, giveaway, atau pembelian tertentu!
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}