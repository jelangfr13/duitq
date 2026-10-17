import { QueryClient } from '@tanstack/react-query';

/**
 * Memvalidasi ulang seluruh query data keuangan yang saling tersinkronisasi
 * sesuai Bab 3 PRD (Dashboard, Sumber Dana, Ruang Penyimpanan, & Piutang).
 */
export const invalidateFinanceQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['funding-sources'] });
  queryClient.invalidateQueries({ queryKey: ['storage-spaces'] });
  queryClient.invalidateQueries({ queryKey: ['budgets'] });
  queryClient.invalidateQueries({ queryKey: ['receivables'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
};
