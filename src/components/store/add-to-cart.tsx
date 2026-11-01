'use client';

import { useCart } from './cart-provider';
import { useStoreUi } from './store-ui-context';

export function AddToCartButton({ item, disabled = false }: { item: { productId: string; slug: string; name: string; price: number; imageUrl: string | null; requiresPrescription: boolean }; disabled?: boolean }) {
  const { addItem } = useCart();
  const { toast } = useStoreUi();
  return <button type="button" disabled={disabled} onClick={() => { addItem(item); toast(`تمت إضافة ${item.name} إلى السلة.`, 'success'); }} className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">
    {disabled ? 'غير متوفر حاليًا' : 'أضف إلى السلة'}
  </button>;
}
