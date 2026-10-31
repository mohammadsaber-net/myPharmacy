'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = { productId: string; slug: string; name: string; price: number; quantity: number; imageUrl: string | null; requiresPrescription: boolean };
type CartContextValue = { items: CartItem[]; addItem: (item: Omit<CartItem, 'quantity'>) => void; updateQuantity: (id: string, quantity: number) => void; removeItem: (id: string) => void; clearCart: () => void };
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'saydalety-cart-v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setItems(JSON.parse(saved) as CartItem[]);
      } catch { localStorage.removeItem(STORAGE_KEY); }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items, ready]);
  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => setItems((current) => {
    const found = current.find((entry) => entry.productId === item.productId);
    return found ? current.map((entry) => entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, quantity: 1 }];
  }), []);
  const updateQuantity = useCallback((id: string, quantity: number) => setItems((current) => quantity < 1 ? current.filter((item) => item.productId !== id) : current.map((item) => item.productId === id ? { ...item, quantity: Math.min(quantity, 99) } : item)), []);
  const removeItem = useCallback((id: string) => setItems((current) => current.filter((item) => item.productId !== id)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({ items, addItem, updateQuantity, removeItem, clearCart }), [items, addItem, updateQuantity, removeItem, clearCart]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
