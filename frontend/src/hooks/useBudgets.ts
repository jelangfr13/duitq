'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  IBudget,
  CreateBudgetDTO,
  UpdateBudgetDTO,
} from '@shared/types/budget';

export interface BudgetsFilter {
  includeArchived?: boolean;
  fundingSourceId?: string;
}

export interface BudgetsResponseData {
  budgets: IBudget[];
  summary: {
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    count: number;
  };
}

export const useBudgets = (options?: BudgetsFilter) => {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery<BudgetsResponseData>({
    queryKey: ['budgets', options],
    queryFn: async () => {
      const res = await api.get('/budgets', { params: options });
      return res.data?.data || {
        budgets: [],
        summary: { totalAllocated: 0, totalSpent: 0, totalRemaining: 0, count: 0 },
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: async (dto: CreateBudgetDTO) => {
      const res = await api.post('/budgets', dto);
      return res.data?.data?.budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateBudgetDTO }) => {
      const res = await api.patch(`/budgets/${id}`, dto);
      return res.data?.data?.budget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/budgets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...budgetsQuery,
    budgets: budgetsQuery.data?.budgets || [],
    summary: budgetsQuery.data?.summary || {
      totalAllocated: 0,
      totalSpent: 0,
      totalRemaining: 0,
      count: 0,
    },
    createBudget: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateBudget: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteBudget: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

export const useBudgetTransactions = (budgetId?: string, page = 1) => {
  return useQuery({
    queryKey: ['budgets', budgetId, 'transactions', page],
    queryFn: async () => {
      if (!budgetId) return null;
      const res = await api.get(`/budgets/${budgetId}/transactions`, {
        params: { page, limit: 50 },
      });
      return res.data?.data;
    },
    enabled: !!budgetId,
  });
};
