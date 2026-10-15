import { create } from 'zustand';
import { ITransaction, TransactionType } from '@shared/types/transaction';

interface AppState {
  // Privasi saldo (DSH-01)
  hideBalance: boolean;
  toggleHideBalance: () => void;
  setHideBalance: (hide: boolean) => void;

  // Kontrol Quick-Add Bottom Sheet Drawer (TRX-01, TRX-02, FND-03, SPC-02, SPC-03)
  isQuickAddOpen: boolean;
  quickAddType: TransactionType;
  editingTransaction: ITransaction | null;
  openQuickAdd: (type?: TransactionType) => void;
  openEditTransaction: (transaction: ITransaction) => void;
  closeQuickAdd: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  hideBalance: false,
  toggleHideBalance: () => set((state) => ({ hideBalance: !state.hideBalance })),
  setHideBalance: (hide) => set({ hideBalance: hide }),

  isQuickAddOpen: false,
  quickAddType: 'EXPENSE',
  editingTransaction: null,
  openQuickAdd: (type = 'EXPENSE') =>
    set({
      isQuickAddOpen: true,
      quickAddType: type,
      editingTransaction: null,
    }),
  openEditTransaction: (transaction: ITransaction) =>
    set({
      isQuickAddOpen: true,
      quickAddType: transaction.type,
      editingTransaction: transaction,
    }),
  closeQuickAdd: () =>
    set({
      isQuickAddOpen: false,
      editingTransaction: null,
    }),
}));
