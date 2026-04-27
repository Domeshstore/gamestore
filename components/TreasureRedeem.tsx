'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Card, Tag, Spin, Alert, Progress } from 'antd';
import { GiftOutlined, LockOutlined, TrophyOutlined, FireOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {  treasureAPI } from '@/lib/api/client';

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
  common: { color: '#94a3b8', bg: 'from-gray-400 to-gray-600', multiplier: 1, label: 'Biasa' },
  rare: { color: '#3b82f6', bg: 'from-blue-500 to-blue-700', multiplier: 2, label: 'Langka' },
  epic: { color: '#a855f7', bg: 'from-purple-500 to-purple-700', multiplier: 3, label: 'Epik' },
  legendary: { color: '#fbbf24', bg: 'from-yellow-500 to-orange-600', multiplier: 5, label: 'Legendaris' },
};

export default function TreasureRedeem({ visible, onClose, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TreasureData | null>(null);
  const [deltaCoins, setDeltaCoins] = useState<number | null>(null);

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
      onSuccess(data.treasure.coinsAmount);
      
      toast.success(data.message);
      setCode('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menukar kode');
    } finally {
      setLoading(false);
    }
  };

  // ✅ PERBAIKAN: Gunakan useEffect, bukan useState
  useEffect(() => {
    if (visible) {
      fetchCoins();
    }
  }, [visible]); // Re-run ketika visible berubah

  return (
    <Modal
      open={visible}
      onCancel={() => {
        onClose();
        setResult(null);
        setCode('');
      }}
      footer={null}
      width={500}
      className="treasure-modal"
      styles={{
        body: { padding: 0, background: 'transparent' },
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg, #fbbf24, #ea580c)' }}>
            <GiftOutlined style={{ fontSize: 32, color: 'white' }} />
          </div>
          <h2 className="text-xl font-bold text-white">Buka Harta Karun</h2>
          <p className="text-slate-400 text-sm mt-1">
            Masukkan kode rahasia untuk mendapatkan Delta Coins!
          </p>
        </div>

        {/* Delta Coins Display */}
        {deltaCoins !== null && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm">💰 Delta Coins kamu:</span>
              <span className="text-2xl font-bold text-amber-400">{deltaCoins.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Input Code */}
        <div className="space-y-4">
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
            {loading ? 'Membuka...' : 'Buka Harta Karun!'}
          </Button>
        </div>

        {/* Result Animation */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-6"
            >
              <Card
                className={`bg-gradient-to-r ${rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.bg || 'from-yellow-500 to-orange-600'}`}
                style={{ borderRadius: 16, border: 'none' }}
              >
                <div className="text-center text-white">
                  <div className="text-5xl mb-2">{result.treasure.icon}</div>
                  <h3 className="text-xl font-bold">{result.treasure.name}</h3>
                  <p className="text-sm opacity-90">{result.treasure.description}</p>
                  
                  <div className="mt-4 p-3 bg-white/10 rounded-xl">
                    <div className="text-3xl font-bold">
                      +{result.treasure.coinsAmount.toLocaleString()}
                    </div>
                    <div className="text-sm">Delta Coins</div>
                  </div>

                  <Tag 
                    color="gold" 
                    style={{ marginTop: 12, borderRadius: 99, fontWeight: 700 }}
                  >
                    {rarityConfig[result.treasure.rarity as keyof typeof rarityConfig]?.label || 'Biasa'}
                  </Tag>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="mt-6 p-3 rounded-lg bg-slate-800/30 text-center">
          <p className="text-xs text-slate-400">
            💡 Dapatkan kode dari event, giveaway, atau pembelian tertentu!
          </p>
        </div>
      </div>
    </Modal>
  );
}