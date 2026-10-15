import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidateFinanceQueries } from '@/lib/query-utils';
import {
  CreateFundingSourceDTO,
  UpdateFundingSourceDTO,
  IFundingSource,
} from '@shared/types/funding-source';

export interface FundingSourcesFilter {
  includeArchived?: boolean;
  includeTransactions?: boolean;
  fundingSourceId?: string;
  limit?: number;
}

export const useFundingSources = (options?: FundingSourcesFilter) => {
  const queryClient = useQueryClient();

  const fundingSourcesQuery = useQuery<IFundingSource[]>({
    queryKey: ['funding-sources', options],
    queryFn: async () => {
      const res = await api.get('/funding-sources', { params: options });
      return res.data?.data?.fundingSources || [];
    },
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (dto: CreateFundingSourceDTO) => {
      const res = await api.post('/funding-sources', dto);
      return res.data?.data?.fundingSource;
    },
    onSuccess: () => {
      // Invalidation otomatis sesuai Bab 3 PRD
      invalidateFinanceQueries(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateFundingSourceDTO }) => {
      const res = await api.patch(`/funding-sources/${id}`, dto);
      return res.data?.data?.fundingSource;
    },
    onSuccess: () => {
      // Invalidation otomatis sesuai Bab 3 PRD
      invalidateFinanceQueries(queryClient);
    },
  });

  return {
    ...fundingSourcesQuery,
    fundingSources: fundingSourcesQuery.data || [],
    createFundingSource: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateFundingSource: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
