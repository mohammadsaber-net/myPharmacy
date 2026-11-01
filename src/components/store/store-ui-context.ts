'use client';

import { createContext, useContext } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type StoreUiContextValue = {
  openModal: (kind: 'contact' | 'request') => void;
  closeModal: () => void;
  toast: (message: string, kind?: ToastKind) => void;
};
export const StoreUiContext = createContext<StoreUiContextValue | null>(null);
export function useStoreUi() {
  const value = useContext(StoreUiContext);
  if (!value) throw new Error('useStoreUi must be used inside StoreUiProvider');
  return value;
}
