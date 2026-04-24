'use client';
import { useEffect, useState } from 'react';
import { Card, Table, Button, InputNumber, Switch, Tag, Row, Col, Alert, Typography } from 'antd';
import { SyncOutlined, CheckCircleOutlined, WarningOutlined, DollarOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { priceSyncAPI } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;
interface SyncChange { name:string; code:string; oldPrice:number; newPrice:number; digiPrice:number; margin:number; change:number; changePct:string }
interface SyncResult { synced:number; unchanged:number; skipped:number; errors:number; duration:string; changes:SyncChange[]; dryRun:boolean }
interface SyncStatus { total:number; autoSync:number; synced:number; unsynced:number; lastSyncedAt:string|null }
const cs = { background:'oklch(0.27 0.01 17.95)', border:'1px solid oklch(0.32 0.02 34.90)', borderRadius:16 };

export default function PriceSyncPage() {
  const [status, setStatus] = useState<SyncStatus|null>(null);
  const [result, setResult] = useState<SyncResult|null>(null);
  const [syncing,setSyncing]= useState(false);
  const [margin, setMargin] = useState(15);
  const [dryRun, setDryRun] = useState(false);

  useEffect(() => { priceSyncAPI.syncStatus().then(r=>setStatus(r.data.data)).catch(()=>{}); }, []);

  const handleSync = async () => {
    setSyncing(true); setResult(null);
    try {
      const res = await priceSyncAPI.syncAll({ margin, dryRun });
      setResult(res.data.data);
      toast.success(dryRun ? `Preview: ${res.data.data.synced} voucher akan berubah` : `✅ ${res.data.data.synced} voucher diperbarui`);
      if (!dryRun) priceSyncAPI.syncStatus().then(r=>setStatus(r.data.data)).catch(()=>{});
    } catch(e:unknown) { toast.error((e as {message?:string}).message||'Sync gagal'); }
    finally { setSyncing(false); }
  };

  const cols = [
    { title:'Produk',     key:'name', render:(_:unknown,r:SyncChange)=>(<div><div style={{color:'white',fontWeight:700}}>{r.name}</div><code style={{color:'#a78bfa',fontSize:11}}>{r.code}</code></div>) },
    { title:'Harga Digi', dataIndex:'digiPrice', key:'digi', render:(v:number)=><span style={{color:'#60a5fa'}}>{formatCurrency(v)}</span> },
    { title:'Margin',     dataIndex:'margin',    key:'mg',   render:(v:number)=><Tag color="blue">+{v}%</Tag> },
    { title:'Lama',       dataIndex:'oldPrice',  key:'old',  render:(v:number)=><span style={{color:'#94a3b8'}}>{formatCurrency(v)}</span> },
    { title:'Baru',       dataIndex:'newPrice',  key:'new',  render:(v:number)=><span style={{color:'#f0c060',fontWeight:800}}>{formatCurrency(v)}</span> },
    { title:'Selisih',    key:'delta', render:(_:unknown,r:SyncChange)=>(
      <span style={{color:r.change>0?'#f87171':'#4ade80',fontWeight:700}}>
        {r.change>0?'+':''}{formatCurrency(r.change)} ({r.changePct}%)
      </span>
    )},
  ];

  return (
    <div className="space-y-5">
      <Title level={3} style={{color:'white',marginBottom:4,fontWeight:900}}>⚡ Sinkronisasi Harga Digiflazz</Title>
      <Text style={{color:'oklch(0.55 0.01 17.53)'}}>Harga jual = Harga Digiflazz + margin%, otomatis setiap 1 jam</Text>

      {status && (
        <Row gutter={[12,12]}>
          {[
            {title:'Total Voucher',value:status.total,    color:'#f0c060'},
            {title:'Auto Sync ON', value:status.autoSync, color:'#60a5fa'},
            {title:'Sudah Sync',   value:status.synced,   color:'#4ade80'},
            {title:'Belum Sync',   value:status.unsynced, color:'#f87171'},
          ].map(({title,value,color})=>(
            <Col key={title} xs={12} lg={6}>
              <Card style={cs} >
                <div style={{color,fontWeight:900,fontSize:24}}>{value}</div>
                <div style={{color:'oklch(0.55 0.01 17.53)',fontSize:12}}>{title}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {status?.lastSyncedAt && (
        <Alert type="info" showIcon={false} style={{borderRadius:12,background:'oklch(0.65 0.12 220 / 0.08)',borderColor:'oklch(0.65 0.12 220 / 0.20)'}}
          message={<span style={{color:'#60a5fa',fontSize:13}}>⏱️ Last sync: <strong>{new Date(status.lastSyncedAt).toLocaleString('id-ID')}</strong> · Otomatis setiap 1 jam</span>} />
      )}

      <Card style={cs} title={<span style={{color:'white',fontWeight:800}}>⚙️ Konfigurasi</span>}>
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label style={{color:'oklch(0.65 0.01 17.53)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>MARGIN (%)</label>
            <InputNumber value={margin} onChange={v=>setMargin(v||15)} min={0} max={100} size="large"
              style={{width:130}} formatter={v=>`${v}%`} parser={v=>Number(String(v).replace('%',''))} />
            <div style={{color:'oklch(0.50 0.01 17.53)',fontSize:11,marginTop:4}}>Rp 50.000 + {margin}% = <strong style={{color:'white'}}>{formatCurrency(Math.ceil(50000*(1+margin/100)/100)*100)}</strong></div>
          </div>
          <div>
            <label style={{color:'oklch(0.65 0.01 17.53)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>MODE</label>
            <Switch checked={dryRun} onChange={setDryRun} checkedChildren="🔍 Preview" unCheckedChildren="⚡ Real" />
            {dryRun && <div style={{color:'#fbbf24',fontSize:11,marginTop:4}}>Tidak ada yang disimpan</div>}
          </div>
          <Button type="primary" size="large" loading={syncing} icon={<SyncOutlined/>} onClick={handleSync} style={{fontWeight:800,height:48,borderRadius:12,minWidth:180}}>
            {syncing?'Sinkronisasi...' : dryRun?'Preview Perubahan':'Sync Sekarang'}
          </Button>
        </div>
        <Alert type="warning" showIcon={false} style={{marginTop:16,borderRadius:12}}
          message={<span style={{fontSize:13}}>Formula: <code>ceil(digiPrice × (1 + margin/100) / 100) × 100</code> — dibulatkan ke ratusan terdekat. Voucher <code>priceAutoSync=false</code> dilewati.</span>} />
      </Card>

      {result && (
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
          <Card style={cs} title={<span style={{color:'white',fontWeight:800}}>
            {result.dryRun?'🔍 Preview':'✅ Hasil'}: {result.synced} berubah · {result.unchanged} sama · {result.duration}s
          </span>}>
            {result.changes.length > 0
              ? <Table dataSource={result.changes} columns={cols} rowKey="code" size="small" pagination={{pageSize:20}} scroll={{x:700}} />
              : <div className="text-center py-8" style={{color:'oklch(0.55 0.01 17.53)'}}>Semua harga sudah terkini</div>}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
