'use client';
import { FormEvent, useState } from 'react';
import { useStoreUi } from './store-ui-context';

export default function ProductRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useStoreUi();
  const [form, setForm] = useState({ customerName: '', phone: '', productName: '', details: '' });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    if (!/^[0-9+()\- ]{10,20}$/.test(form.phone.trim())) { toast('رقم الهاتف غير صحيح. أدخل رقمًا من 10 إلى 20 خانة.', 'error'); setBusy(false); return; }
    try {
      const response = await fetch('/api/product-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر إرسال الطلب.');
      toast(data.message || 'تم استلام طلبك بنجاح.', 'success');
      setForm({ customerName: '', phone: '', productName: '', details: '' }); onSuccess?.();
    } catch (error) { toast(error instanceof Error ? error.message : 'حدث خطأ غير متوقع.', 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <label className="grid gap-1 text-sm font-semibold">الاسم<input required minLength={2} maxLength={160} value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label>
    <label className="grid gap-1 text-sm font-semibold">رقم الهاتف<input required type="tel" inputMode="tel" minLength={10} maxLength={20} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" placeholder="01xxxxxxxxx" dir="ltr" /></label>
    <label className="grid gap-1 text-sm font-semibold">اسم المنتج المطلوب<input required minLength={2} maxLength={220} value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label>
    <label className="grid gap-1 text-sm font-semibold">تفاصيل إضافية (اختياري)<textarea maxLength={1500} rows={3} value={form.details} onChange={e=>setForm({...form,details:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label>
    <p className="text-xs leading-6 text-slate-500">إرسال الطلب لا يعني تأكيد توافر المنتج أو حجزه. ستتواصل الصيدلية معك بعد المراجعة.</p>
    <button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?'جارٍ الإرسال...':'إرسال طلب المنتج'}</button>
  </form>;
}
