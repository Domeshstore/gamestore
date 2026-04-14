'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { authAPI } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/utils/format';
import toast from 'react-hot-toast';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    store.hydrate();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authAPI.login({ email, password });
      const { token, user } = res.data.data;
      store.setAuth(user, token);
      toast.success('Login berhasil!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await authAPI.register({ name, email, password, phone });
      const { token, user } = res.data.data;
      store.setAuth(user, token);
      toast.success('Registrasi berhasil!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const logout = () => {
    store.logout();
    toast.success('Berhasil logout');
    router.push('/auth/login');
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      store.updateUser(res.data.data);
    } catch {
      // Token expired
      store.logout();
    }
  };

  return {
    user: store.user,
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isAdmin: store.user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
  };
}
