// components/providers/SSEProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSSE } from '@/lib/hooks/useSSE';

interface SSEContextValue {
  isConnected: boolean;
  lastMessage: any;
}

const SSEContext = createContext<SSEContextValue | null>(null);

export function SSEProvider({ children }: { children: ReactNode }) {
  const sseValue = useSSE();
  
  return (
    <SSEContext.Provider value={sseValue}>
      {children}
    </SSEContext.Provider>
  );
}

export const useSSEContext = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error('useSSEContext must be used within SSEProvider');
  }
  return context;
};