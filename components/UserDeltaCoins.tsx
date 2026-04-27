// components/UserDeltaCoins.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Modal } from 'antd';
import { GiftOutlined, WalletOutlined } from '@ant-design/icons';
import { treasureAPI } from '@/lib/api/client';
import TreasureRedeem from './TreasureRedeem';

export default function UserDeltaCoins() {
  const [deltaCoins, setDeltaCoins] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [treasureModalOpen, setTreasureModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCoins = async () => {
    try {
      const res = await treasureAPI.getMyCoins();
      setDeltaCoins(res.data.data.deltaCoins);
      setTotalEarned(res.data.data.totalEarned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  const handleTreasureSuccess = (coins: number) => {
    fetchCoins(); // Refresh coins
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <WalletOutlined style={{ fontSize: 24, color: 'white' }} />
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium">Delta Coins</div>
              <div className="text-2xl font-bold text-amber-400">
                {loading ? '...' : deltaCoins.toLocaleString()}
              </div>
              <div className="text-slate-500 text-xs">
                Total earned: {totalEarned.toLocaleString()}
              </div>
            </div>
          </div>
          
          <Button
            type="primary"
            icon={<GiftOutlined />}
            onClick={() => setTreasureModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 border-none"
          >
            Buka Harta Karun
          </Button>
        </div>
      </Card>

      <TreasureRedeem
        visible={treasureModalOpen}
        onClose={() => setTreasureModalOpen(false)}
        onSuccess={handleTreasureSuccess}
      />
    </>
  );
}