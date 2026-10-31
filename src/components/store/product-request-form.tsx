'use client';
import { FormEvent, useState } from 'react';

export default function ProductRequestForm() {
  const [form, setForm] = useState({ customerName: '', phone: '', productName: '', details: '' });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(''); setSuccess(false);
    try {
      const response = await fetch('/api/product-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر إرسال الطلب.');
      setSuccess(true); setFeedback(data.message); setForm({ customerName: '', phone: '', productName: '', details: '' });
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-white p-5 sm:p-7">
    <label className="grid gap-1 text-sm font-semibold">الاسم<input required minLength={2} maxLength={160} value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} className="rounded-xl border p-3 font-normal" /></label>
    <label className="grid gap-1 text-sm font-semibold">رقم الهاتف<input required type="tel" minLength={10} maxLength={20} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-xl border p-3 font-normal" placeholder="01xxxxxxxxx" /></label>
    <label className="grid gap-1 text-sm font-semibold">اسم المنتج المطلوب<input required minLength={2} maxLength={220} value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})} className="rounded-xl border p-3 font-normal" /></label>
    <label className="grid gap-1 text-sm font-semibold">تفاصيل إضافية (اختياري)<textarea maxLength={1500} rows={4} value={form.details} onChange={e=>setForm({...form,details:e.target.value})} className="rounded-xl border p-3 font-normal" /></label>
    <p className="text-xs leading-6 text-slate-500">إرسال الطلب لا يعني تأكيد توافر المنتج أو حجزه. ستتواصل الصيدلية معك بعد المراجعة.</p>
    <button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?'جارٍ الإرسال...':'إرسال طلب المنتج'}</button>
    {feedback&&<p role="status" className={`text-sm ${success?'text-emerald-700':'text-red-700'}`}>{feedback}</p>}
  </form>;
}
