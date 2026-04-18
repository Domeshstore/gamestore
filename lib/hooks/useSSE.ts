// lib/hooks/useSSE.ts (simple version)
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import toast from 'react-hot-toast';

interface SSEMessage {
  type: string;
  refId: string;
  status: 'success' | 'failed' | 'processing';
  message?: string;
  sn?: string;
  userId?: string;
  gameCode?: string;
}

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[SSE] Disconnecting...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      console.log('[SSE] Not authenticated, skipping connection');
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '';
    const sseUrl = `${backendUrl}/api/notifications/subscribe`;
    
    console.log('[SSE] Connecting to:', sseUrl);
    
    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      
      es.onopen = () => {
        console.log('[SSE] ✅ Connected');
        setIsConnected(true);
      };

      es.addEventListener('transaction_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Transaction update:', data);
          setLastMessage(data);
          
          if (data.status === 'success') {
            toast.success(`✅ Transaksi ${data.refId} berhasil!`);
          } else if (data.status === 'failed') {
            toast.error(`❌ Transaksi ${data.refId} gagal`);
          }
          
          window.dispatchEvent(new CustomEvent('transaction_update', { detail: data }));
        } catch (error) {
          console.error('[SSE] Error:', error);
        }
      });

      es.onerror = () => {
        console.log('[SSE] Connection error');
        setIsConnected(false);
        es.close();
        eventSourceRef.current = null;
      };

      eventSourceRef.current = es;
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id]);

  return { isConnected, lastMessage };
}