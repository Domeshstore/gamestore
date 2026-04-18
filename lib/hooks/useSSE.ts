// lib/hooks/useSSE.ts
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ✅ AMBIL isAuthenticated DARI STORE
  const { user, isAuthenticated } = useAuthStore();

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[SSE] Disconnecting...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const connect = useCallback(() => {
    // ✅ Cek authentication
    if (!isAuthenticated || !user) {
      console.log('[SSE] Not authenticated, skipping connection');
      return;
    }

    // Disconnect existing connection
    disconnect();

    // ✅ GUNAKAN BACKEND URL LANGSUNG
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const sseUrl = `${backendUrl}/api/notifications/subscribe`;
    
    console.log('[SSE] Connecting to:', sseUrl);
    
    try {
      const es = new EventSource(sseUrl);
      
      es.onopen = () => {
        console.log('[SSE] ✅ Connected to notification stream');
        setIsConnected(true);
      };

      es.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Connection established:', data);
        } catch (error) {
          console.error('[SSE] Error parsing connected event:', error);
        }
      });

      es.addEventListener('heartbeat', () => {
        // Keep connection alive - do nothing
      });

      es.addEventListener('transaction_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] 📦 Transaction update:', data);
          
          setLastMessage(data);
          
          // Show toast notification
          if (data.status === 'success') {
            toast.success(`✅ Transaksi ${data.refId} berhasil!`, {
              duration: 5000,
              icon: '🎉',
            });
          } else if (data.status === 'failed') {
            toast.error(`❌ Transaksi ${data.refId} gagal: ${data.message || 'Coba lagi'}`);
          }
          
          // Trigger custom event
          window.dispatchEvent(new CustomEvent('transaction_update', { detail: data }));
        } catch (error) {
          console.error('[SSE] Error parsing transaction_update:', error);
        }
      });

      // Listen for user-specific updates
      if (user?.id) {
        es.addEventListener(`user_${user.id}`, (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[SSE] 👤 Personal update:', data);
            
            window.dispatchEvent(new CustomEvent('my_transaction_update', { detail: data }));
            
            if (data.status === 'success') {
              toast.success(`🎮 Pesanan ${data.refId} selesai! Silakan cek game Anda.`, {
                duration: 6000,
              });
            } else if (data.status === 'failed') {
              toast.error(`❌ Pesanan ${data.refId} gagal: ${data.message || 'Coba lagi'}`);
            }
          } catch (error) {
            console.error('[SSE] Error parsing personal update:', error);
          }
        });
      }

      es.onerror = (error) => {
        console.error('[SSE] ❌ Connection error:', {
          readyState: es.readyState,
          url: sseUrl
        });
        
        setIsConnected(false);
        es.close();
        
        // Hanya reconnect jika bukan 404 (CLOSED)
        if (es.readyState === EventSource.CLOSED) {
          console.log('[SSE] Connection closed, will attempt reconnect');
          
          // Clear existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Attempt reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isAuthenticated && user) {
              console.log('[SSE] 🔄 Attempting to reconnect...');
              connect();
            }
          }, 3000);
        }
      };

      eventSourceRef.current = es;
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setIsConnected(false);
    }
  }, [isAuthenticated, user, disconnect]);

  // ✅ Effect untuk handle connection berdasarkan auth state
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user?.id, connect, disconnect]);

  return { isConnected, lastMessage };
}