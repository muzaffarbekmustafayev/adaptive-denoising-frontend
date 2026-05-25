import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT tokenni so'rovga qo'shish
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 xatosi — tokenni tozalab login sahifasiga yo'naltirish
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API key bor bo'lsa headerga qo'shish uchun yordamchi
export type AudioMode = 'basic' | 'gentle' | 'aggressive' | 'voice';

const withApiKey = (apiKey?: string): Record<string, string> =>
  apiKey ? { 'X-API-Key': apiKey } : {};

export const audioApi = {
  denoise: (formData: FormData, apiKey?: string, mode: AudioMode = 'basic') => {
    formData.append('mode', mode);
    const config: AxiosRequestConfig = {
      headers: {
        // Content-Type ni o'chirish — Axios multipart/form-data va boundary avtomatik qo'yadi
        'Content-Type': undefined,
        ...withApiKey(apiKey),
      },
    };
    return api.post('/audio/denoise', formData, config);
  },

  getJobStatus: (id: string, apiKey?: string) =>
    api.get(`/audio/jobs/${id}`, { headers: withApiKey(apiKey) }),

  downloadOutput: (id: string, apiKey?: string) =>
    api.get(`/audio/jobs/${id}/download`, {
      headers: withApiKey(apiKey),
      responseType: 'blob',
    }),

  getSharedOutput: (id: string, apiKey?: string) =>
    api.get(`/audio/share/${id}`, {
      headers: withApiKey(apiKey),
      responseType: 'blob',
    }),

  getMyJobs: () => api.get('/audio/my-jobs'),
  cancelJob: (id: string) => api.post(`/audio/jobs/${id}/cancel`),
  retryJob: (id: string, mode: AudioMode = 'basic') =>
    api.post(`/audio/jobs/${id}/retry`, { mode }),
  deleteJob: (id: string) => api.delete(`/audio/jobs/${id}`),
};

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: { fullName: string }) => api.patch('/users/profile', data),
  updatePassword: (data: UpdatePasswordData) => api.patch('/users/update-password', data),
};

export const apiKeyApi = {
  list: () => api.get('/api-keys'),
  get: (id: string) => api.get(`/api-keys/${id}`),
  create: (name: string, monthlyLimit?: number) =>
    api.post('/api-keys', { name, monthlyLimit }),
  update: (id: string, data: { name?: string; monthlyLimit?: number }) =>
    api.patch(`/api-keys/${id}`, data),
  reveal: (id: string) => api.get(`/api-keys/${id}/reveal`),
  regenerate: (id: string) => api.post(`/api-keys/${id}/regenerate`),
  activate: (id: string) => api.patch(`/api-keys/${id}/activate`),
  deactivate: (id: string) => api.patch(`/api-keys/${id}/deactivate`),
  delete: (id: string) => api.delete(`/api-keys/${id}`),
};

export const adminApi = {
  createUser: (data: {
    fullName: string;
    email: string;
    role: 'ADMIN' | 'USER';
    password?: string;
  }) => api.post('/admin/users', data),

  getUsers: () => api.get('/admin/users'),

  updateUser: (
    id: string,
    data: {
      fullName: string;
      email: string;
      role: 'ADMIN' | 'USER';
      status: 'ACTIVE' | 'BLOCKED';
      password?: string;
    }
  ) => api.patch(`/admin/users/${id}`, data),

  updateUserRole: (id: string, role: 'ADMIN' | 'USER') =>
    api.patch(`/admin/users/${id}/role`, { role }),

  updateUserStatus: (id: string, status: 'ACTIVE' | 'BLOCKED') =>
    api.patch(`/admin/users/${id}/status`, { status }),

  getStats: (period?: string) =>
    api.get('/admin/stats', { params: { period } }),

  getTimelineStats: (days?: number) =>
    api.get('/admin/stats/timeline', { params: { days } }),

  getJobs: (params?: { status?: string; limit?: number }) =>
    api.get('/admin/jobs', { params }),

  cancelJob: (id: string) => api.post(`/admin/jobs/${id}/cancel`),
  getSystemHealth: () => api.get('/admin/system-health'),
  getAuditLogs: (limit?: number) =>
    api.get('/admin/audit-logs', { params: { limit } }),
};

export const deviceApi = {
  list: () => api.get('/devices'),
  get: (id: string) => api.get(`/devices/${id}`),
  create: (data: {
    name: string;
    type: string;
    metadata?: Record<string, unknown>;
  }) => api.post('/devices', data),
  update: (
    id: string,
    data: {
      name?: string;
      type?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    }
  ) => api.patch(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
};

export const usageApi = {
  getMyUsage: () => api.get('/usage/me'),
  getSummary: () => api.get('/usage/summary'),
};

// ─── TypeScript interfeyslari ────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  _id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash?: string;
  key?: string; // Faqat yaratilganda bir marta qaytariladi
  canReveal?: boolean;
  usageCount: number;
  monthlyLimit: number;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityMetrics {
  snrImprovementDb?: number;
  estimatedMetrics?: boolean;
  processingTimeMs?: number;
  engine?: string;
  engineVersion?: string;
  parameters?: Record<string, unknown>;
}

export interface AudioJob {
  _id: string;
  userId: string;
  apiKeyId: string | null;
  originalFileName: string;
  inputPath: string;
  outputPath?: string;
  mimeType: string;
  inputBytes: number;
  outputBytes: number;
  durationSeconds: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
  qualityMetrics?: QualityMetrics;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  _id: string;
  userId: string;
  name: string;
  type: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
