// lib/api/client.ts
/**
 * Frontend API Client — SECURE VERSION
 *
 * ✅ Zero API key in browser
 * ✅ All requests go to /api/proxy/* (Next.js server-side)
 * ✅ API key injected server-side only
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const PROXY_BASE = '/api/proxy';

// PERBAIKAN: Hapus default Content-Type
const apiClient: AxiosInstance = axios.create({
  baseURL: PROXY_BASE,
  timeout: 30000,
  // HAPUS: headers: { 'Content-Type': 'application/json' },
});

// Interceptor untuk anti-cache dan auth
apiClient.interceptors.request.use(
  (config) => {
    // Tambahkan timestamp untuk bypass cache browser (GET requests)
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    // PERBAIKAN: Jangan set Content-Type untuk FormData
    // Biarkan browser yang mengatur boundary
    if (config.data instanceof FormData) {
      // Hapus Content-Type header jika ada
      delete config.headers['Content-Type'];
    }
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (d: { name: string; email: string; password: string; phone?: string }) => 
    apiClient.post('/auth/register', d),
  login: (d: { email: string; password: string }) => 
    apiClient.post('/auth/login', d),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (d: { name?: string; phone?: string }) => 
    apiClient.put('/auth/profile', d),
  changePassword: (d: { currentPassword: string; newPassword: string }) => 
    apiClient.put('/auth/change-password', d),
};

export const gamesAPI = {
  getAll: (p?: Record<string, unknown>) => apiClient.get('/games', { params: p }),
  getBySlug: (slug: string) => apiClient.get(`/games/${slug}`),
  getVouchers: (slug: string) => apiClient.get(`/games/${slug}/vouchers`),
  getFeaturedVouchers: () => apiClient.get('/games/vouchers/featured'),
  create: (d: Record<string, unknown>) => apiClient.post('/games', d),
  update: (id: string, d: Record<string, unknown>) => apiClient.put(`/games/${id}`, d),
  delete: (id: string) => apiClient.delete(`/games/${id}`),
  createVoucher: (d: Record<string, unknown>) => apiClient.post('/games/vouchers/create', d),
  updateVoucher: (id: string, d: Record<string, unknown>) => apiClient.put(`/games/vouchers/${id}`, d),
  deleteVoucher: (id: string) => apiClient.delete(`/games/vouchers/${id}`),
};

export const transactionsAPI = {
  create: (d: Record<string, unknown>) => apiClient.post('/transactions', d),
  getAll: (p?: Record<string, unknown>) => apiClient.get('/transactions', { params: p }),
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  checkStatus: (id: string) => apiClient.get(`/transactions/${id}/status`),
  
  // PERBAIKAN: Upload proof tanpa manual Content-Type
  uploadProof: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('proof', file);
    
    // Debug logging (hapus di production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Upload] File:', file.name, file.type, file.size);
    }
    
    // JANGAN set Content-Type header!
    // Interceptor akan menghapusnya otomatis
    return apiClient.post(`/transactions/${id}/payment-proof`, formData, {
      timeout: 60000,
    });
  },
  
  cancel: (id: string) => apiClient.post(`/transactions/${id}/cancel`),
  submitReview: (id: string, d: { rating: number; comment: string }) => 
    apiClient.post(`/transactions/${id}/review`, d),
};

export const settingsAPI = {
  getApp: () => apiClient.get('/settings/app'),
  updateApp: (d: Record<string, unknown>) => apiClient.put('/settings/app', d),
  getCategories: () => apiClient.get('/settings/categories'),
  getAllCategories: () => apiClient.get('/settings/categories/all'),
  createCategory: (d: Record<string, unknown>) => apiClient.post('/settings/categories', d),
  updateCategory: (id: string, d: Record<string, unknown>) => apiClient.put(`/settings/categories/${id}`, d),
  deleteCategory: (id: string) => apiClient.delete(`/settings/categories/${id}`),
};

export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: (p?: Record<string, unknown>) => apiClient.get('/admin/users', { params: p }),
  toggleUser: (id: string) => apiClient.patch(`/admin/users/${id}/toggle`),
  getAllTransactions: (p?: Record<string, unknown>) => apiClient.get('/admin/transactions', { params: p }),
  markPaid: (id: string) => apiClient.post(`/admin/transactions/${id}/mark-paid`),
  processProvider: (id: string) => apiClient.post(`/admin/transactions/${id}/process`),
  markSuccess: (id: string, notes?: string) => apiClient.post(`/admin/transactions/${id}/mark-success`, { notes }),
  markFailed: (id: string, notes?: string) => apiClient.post(`/admin/transactions/${id}/mark-failed`, { notes }),
};

export const rewardsAPI = {
  getBalance: () => apiClient.get('/rewards/balance'),
  getHistory: (p?: Record<string, unknown>) => apiClient.get('/rewards/history', { params: p }),
  redeem: (points: number, description?: string) => apiClient.post('/rewards/redeem', { points, description }),
};

export const apigamesAPI = {
  checkUsername: (gameCode: string, userId: string, serverId?: string) =>
    apiClient.get('/apigames/cek-username', { 
      params: { game_code: gameCode, user_id: userId, server_id: serverId } 
    }),
};

export const digiflazzAPI = {
  getBalance:  () => apiClient.get('/digiflazz/balance'),
  getPriceList:(cmd?: string) => apiClient.get('/digiflazz/price-list', { params: { cmd } }),
  checkStatus: (refId: string) => apiClient.get('/digiflazz/status', { params: { ref_id: refId } }),
  createTransaction: (d: { refId: string; buyerSkuCode: string; customerId: string; testing?: boolean }) =>
    apiClient.post('/digiflazz/transaction', d),
  
    // Tambahkan method check username
  checkUsername: (gameCode: string, userId: string, serverId?: string) =>
    apiClient.post('/digiflazz/check-username', { gameCode, userId, serverId }),
};

export default apiClient;
