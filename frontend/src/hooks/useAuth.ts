import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  RequestAdminResetDTO,
  IUser,
  UpdateUserProfileDTO,
} from '@shared/types/user';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query profil pengguna aktif (AUTH-04)
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<IUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data?.data?.user || null;
      } catch (err: any) {
        if (err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Mutasi Login (AUTH-03)
  const loginMutation = useMutation({
    mutationFn: async (dto: LoginDTO) => {
      const res = await api.post('/auth/login', dto);
      return res.data;
    },
    onSuccess: (data) => {
      // Jika akun memerlukan reset kata sandi baru (direset oleh Admin Panel dengan kotak kosong)
      if (data?.requirePasswordReset || data?.data?.requirePasswordReset) {
        const resetToken = data?.data?.resetToken || data?.resetToken;
        if (typeof window !== 'undefined' && resetToken) {
          window.location.href = `/reset-password?token=${resetToken}&adminReset=true`;
          return;
        }
      }

      const token = data?.data?.accessToken;
      if (token && typeof window !== 'undefined') {
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;
        document.cookie = `accessToken=${token}; path=/; max-age=86400; SameSite=Lax; Secure`;
        localStorage.setItem('duitq_token', token);
      }
      queryClient.setQueryData(['auth', 'me'], data?.data?.user);
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'funding-sources', 'storage-spaces', 'receivables'],
      });
      window.location.href = '/dashboard';
    },
  });

  // Mutasi Register (AUTH-01, AUTH-02)
  const registerMutation = useMutation({
    mutationFn: async (dto: RegisterDTO) => {
      const res = await api.post('/auth/register', dto);
      return res.data;
    },
  });

  // Mutasi Logout (AUTH-05)
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/logout');
      return res.data;
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax; Secure';
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax; Secure';
        localStorage.removeItem('duitq_token');
      }
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  // Mutasi Lupa Kata Sandi (PWD-01, PWD-02)
  const forgotPasswordMutation = useMutation({
    mutationFn: async (dto: ForgotPasswordDTO) => {
      const res = await api.post('/auth/forgot-password', dto);
      return res.data;
    },
  });

  // Mutasi Reset Kata Sandi (PWD-03)
  const resetPasswordMutation = useMutation({
    mutationFn: async (dto: ResetPasswordDTO) => {
      const res = await api.post('/auth/reset-password', dto);
      return res.data;
    },
  });

  // Mutasi Permintaan Reset Kata Sandi ke Admin / Developer
  const requestAdminResetMutation = useMutation({
    mutationFn: async (dto: RequestAdminResetDTO) => {
      const res = await api.post('/auth/request-admin-reset', dto);
      return res.data;
    },
  });

  // Mutasi Perbarui Profil & Preferensi (Update v1.2)
  const updateProfileMutation = useMutation({
    mutationFn: async (dto: UpdateUserProfileDTO) => {
      const res = await api.patch('/users/profile', dto);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.user) {
        queryClient.setQueryData(['auth', 'me'], data.data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutasi Hapus Akun Permanen
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/users/account');
      return res.data;
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax; Secure';
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax; Secure';
        localStorage.removeItem('duitq_token');
        localStorage.removeItem('duitq_theme_color');
        localStorage.removeItem('duitq_dark_mode');
      }
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
    refetchUser: refetch,
    loginMutation,
    registerMutation,
    logoutMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
    requestAdminResetMutation,
    updateProfileMutation,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    deleteAccountMutation,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
};
