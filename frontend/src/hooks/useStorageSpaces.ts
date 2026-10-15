import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { invalidateFinanceQueries } from '@/lib/query-utils';
import {
  CreateStorageSpaceDTO,
  IStorageSpace,
} from '@shared/types/storage-space';

export interface StorageSpacesFilter {
  includeArchived?: boolean;
}

export const useStorageSpaces = (options?: StorageSpacesFilter) => {
  const queryClient = useQueryClient();

  const storageSpacesQuery = useQuery<(IStorageSpace & { usagePercentage?: number })[]>({
    queryKey: ['storage-spaces', options],
    queryFn: async () => {
      const res = await api.get('/storage-spaces', { params: options });
      return res.data?.data?.storageSpaces || [];
    },
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (dto: CreateStorageSpaceDTO) => {
      const res = await api.post('/storage-spaces', dto);
      return res.data?.data?.storageSpace;
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient);
    },
  });

  return {
    ...storageSpacesQuery,
    storageSpaces: storageSpacesQuery.data || [],
    createStorageSpace: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};

export const useStorageSpaceTransactions = (spaceId?: string) => {
  return useQuery({
    queryKey: ['storage-spaces', spaceId, 'transactions'],
    queryFn: async () => {
      if (!spaceId) return null;
      const res = await api.get(`/storage-spaces/${spaceId}/transactions`);
      return res.data?.data;
    },
    enabled: !!spaceId,
  });
};
