import axios, { AxiosError } from 'axios';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sisipkan token autentikasi ke Authorization header jika tersedia di client (dukungan cross-origin)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('duitq_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * Ekstrak pesan kesalahan ramah pengguna dari error Axios atau Zod
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return `${data.message}: ${data.errors[0].message || data.errors[0].field}`;
      }
      return data.message;
    }
    if (error.response?.status === 401) {
      return 'Sesi autentikasi telah berakhir. Silakan masuk kembali.';
    }
    if (error.response?.status === 403) {
      return 'Anda tidak memiliki hak akses untuk tindakan ini.';
    }
    if (error.response?.status === 404) {
      return 'Data yang diminta tidak ditemukan.';
    }
    if (error.response?.status === 429) {
      return 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Gagal terhubung ke server backend. Silakan periksa koneksi internet Anda atau coba beberapa saat lagi.';
    }
    return error.message || 'Terjadi kesalahan pada jaringan.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Terjadi kesalahan yang tidak terduga.';
};
