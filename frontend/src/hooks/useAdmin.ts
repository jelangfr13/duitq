import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  fundingSourcesCount: number;
  transactionsCount: number;
  isDevAdmin: boolean;
  hasPendingResetRequest?: boolean;
  resetRequestedAt?: string | null;
  resetRequestNote?: string | null;
  mustResetPassword?: boolean;
}

export const useAdmin = (search = '') => {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: search ? { search } : undefined,
      });
      return res.data?.data?.users || [];
    },
    staleTime: 30 * 1000,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword?: string;
    }) => {
      const res = await api.post(`/admin/users/${userId}/reset-password`, {
        newPassword,
      });
      return res.data;
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return {
    users,
    isLoading,
    isFetching,
    error,
    refetch,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResetting: resetPasswordMutation.isPending,
    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
  };
};
