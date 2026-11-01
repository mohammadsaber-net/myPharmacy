'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatEGP } from '@/lib/money';
import { useCart } from './cart-provider';
import { useStoreUi } from './store-ui-context';

export function CheckoutForm() {
  const { items, clearCart } = useCart();
  const { toast } = useStoreUi();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPrescription = items.some((item) => item.requiresPrescription);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!items.length) { setError('السلة فارغة. أضف منتجات أولًا.'); toast('السلة فارغة. أضف منتجات أولًا.', 'error'); return; }
    if (hasPrescription) { setError('تحتوي السلة على منتج يتطلب مراجعة الصيدلي أو وصفة طبية. يرجى التواصل مع الصيدلية قبل إتمام الطلب.'); toast('تحتوي السلة على منتج يتطلب مراجعة الصيدلي.', 'error'); return; }
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: form.get('customerName'), phone: form.get('phone'), address: form.get('address'), notes: form.get('notes'), items: items.map(({ productId, quantity }) => ({ productId, quantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعذر تسجيل الطلب. حاول مرة أخرى.');
      clearCart(); toast('تم استلام طلبك بنجاح.', 'success'); router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`);
    } catch (cause) { const message = cause instanceof Error ? cause.message : 'حدث خطأ غير متوقع.'; setError(message); toast(message, 'error'); }
    finally { setLoading(false); }
  }
  if (!items.length) return <div className="rounded-2xl bg-white p-8 text-center"><p className="font-bold">السلة فارغة</p><button onClick={() => router.push('/products')} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">العودة للمنتجات</button></div>;
  return <div className="grid gap-6 lg:grid-cols-[1fr_320px]"><form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
    <div><label className="mb-2 block text-sm font-bold" htmlFor="customerName">الاسم بالكامل</label><input id="customerName" name="customerName" required minLength={3} maxLength={160} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" placeholder="اكتب اسمك" /></div>
    <div><label className="mb-2 block text-sm font-bold" htmlFor="phone">رقم الموبايل</label><input id="phone" name="phone" required inputMode="tel" pattern="[0-9+()\\- ]{10,20}" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-left outline-none focus:border-emerald-600" placeholder="01xxxxxxxxx" dir="ltr" /></div>
    <div><label className="mb-2 block text-sm font-bold" htmlFor="address">عنوان التوصيل بالتفصيل</label><textarea id="address" name="address" required minLength={8} maxLength={1000} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" placeholder="المحافظة، المنطقة، الشارع، رقم العقار..." /></div>
    <div><label className="mb-2 block text-sm font-bold" htmlFor="notes">ملاحظات (اختياري)</label><textarea id="notes" name="notes" maxLength={1000} rows={2} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" /></div>
    <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><strong>طريقة الدفع: نقدًا عند الاستلام</strong><br/>سيتم التواصل معك لتأكيد الطلب ورسوم التوصيل قبل التجهيز.</div>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <button disabled={loading || hasPrescription} className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{loading ? 'جارٍ إرسال الطلب...' : 'تأكيد الطلب'}</button>
  </form><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold">ملخص طلبك</h2>{items.map((item) => <div key={item.productId} className="mt-3 flex justify-between gap-3 text-sm"><span>{item.name} × {item.quantity}</span><strong>{formatEGP(item.price * item.quantity)}</strong></div>)}<div className="my-4 border-t"/><div className="flex justify-between font-extrabold"><span>الإجمالي المبدئي</span><span className="text-emerald-800">{formatEGP(subtotal)}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">رسوم التوصيل تحدد بعد مراجعة العنوان.</p></aside></div>;
}
