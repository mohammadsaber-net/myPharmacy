'use client';

import { useState } from 'react';
import { useCart } from './cart-provider';

export function AddToCartButton({ item, disabled = false }: { item: { productId: string; slug: string; name: string; price: number; imageUrl: string | null; requiresPrescription: boolean }; disabled?: boolean }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  return <button type="button" disabled={disabled} onClick={() => { addItem(item); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }} className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">
    {disabled ? 'غير متوفر حاليًا' : added ? 'تمت الإضافة إلى السلة ✓' : 'أضف إلى السلة'}
  </button>;
}
