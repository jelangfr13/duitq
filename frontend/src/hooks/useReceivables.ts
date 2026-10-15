import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidateFinanceQueries } from '@/lib/query-utils';
import {
  CreateReceivableDTO,
  RepayReceivableDTO,
} from '@shared/types/receivable';
import { UpdatePreferencesDTO } from '@shared/types/user';

export const useReceivables = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (dto: CreateReceivableDTO) => {
      const res = await api.post('/receivables', dto);
      return res.data?.data?.receivable;
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });

  const repayMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: RepayReceivableDTO }) => {
      const res = await api.post(`/receivables/${id}/repay`, dto);
      return res.data?.data?.receivable;
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (dto: UpdatePreferencesDTO) => {
      const res = await api.patch('/users/preferences/receivables', dto);
      return res.data?.data?.preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    createReceivable: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    repayReceivable: repayMutation.mutateAsync,
    isRepaying: repayMutation.isPending,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
  };
};
