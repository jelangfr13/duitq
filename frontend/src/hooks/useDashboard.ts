import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardSummary } from '@shared/types/dashboard';

export interface DashboardParams {
  startDate?: string;
  endDate?: string;
  period?: 'this_month' | 'last_month' | 'custom' | string;
}

export const useDashboard = (params?: DashboardParams) => {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', params],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary', { params });
      return res.data?.data;
    },
    staleTime: 60 * 1000,
  });
};
