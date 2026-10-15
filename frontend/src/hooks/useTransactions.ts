import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidateFinanceQueries } from '@/lib/query-utils';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '@shared/types/transaction';

export const useTransactions = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (dto: CreateTransactionDTO) => {
      const res = await api.post('/transactions', dto);
      return res.data?.data?.transaction;
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTransactionDTO }) => {
      const res = await api.put(`/transactions/${id}`, dto);
      return res.data?.data?.transaction;
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/transactions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });

  return {
    createTransaction: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTransaction: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteTransaction: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
