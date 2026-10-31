'use client';

import Link from 'next/link';
import { formatEGP } from '@/lib/money';
import { useCart } from './cart-provider';

export function CartView() {
  const { items, updateQuantity, removeItem } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!items.length) return <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="text-5xl">🛒</div><h2 className="mt-4 text-xl font-bold">سلتك فارغة</h2><p className="mt-2 text-slate-500">ابدأ بتصفح المنتجات وأضف احتياجاتك إلى السلة.</p><Link href="/products" className="mt-6 inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">تصفح المنتجات</Link></div>;
  return <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
    <div className="space-y-3">{items.map((item) => <article key={item.productId} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-emerald-50 text-3xl text-emerald-700">✚</div>
      <div className="min-w-40 flex-1"><Link href={`/products/${item.slug}`} className="font-bold hover:text-emerald-700">{item.name}</Link><p className="mt-1 text-sm text-slate-500">{formatEGP(item.price)}</p>{item.requiresPrescription && <p className="mt-1 text-xs text-amber-700">يتطلب مراجعة الصيدلي</p>}</div>
      <div className="flex items-center gap-2"><button aria-label="تقليل الكمية" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-9 w-9 rounded-lg border">−</button><span className="min-w-6 text-center font-bold">{item.quantity}</span><button aria-label="زيادة الكمية" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="h-9 w-9 rounded-lg border">+</button></div>
      <button onClick={() => removeItem(item.productId)} className="text-sm font-semibold text-rose-600">حذف</button>
    </article>)}</div>
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">ملخص الطلب</h2><div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">إجمالي المنتجات</span><strong>{formatEGP(subtotal)}</strong></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">التوصيل</span><span>يحدد بعد التأكيد</span></div><div className="my-5 border-t border-slate-100"/><div className="flex justify-between"><strong>الإجمالي المبدئي</strong><strong className="text-emerald-800">{formatEGP(subtotal)}</strong></div><p className="mt-3 text-xs leading-5 text-slate-500">سيتم تأكيد رسوم التوصيل وتفاصيل الطلب هاتفيًا من الصيدلية.</p><Link href="/checkout" className="mt-5 block rounded-xl bg-emerald-700 px-4 py-3 text-center font-bold text-white hover:bg-emerald-800">متابعة إتمام الطلب</Link></aside>
  </div>;
}
