'use client';
import { FormEvent, useState } from 'react';
import { useStoreUi } from './store-ui-context';

export default function ContactForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useStoreUi();
  const [form,setForm]=useState({customerName:'',phone:'',email:'',subject:'',message:''});
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setBusy(true);
    if (!form.phone.trim() && !form.email.trim()) { toast('أدخل رقم هاتف أو بريدًا إلكترونيًا للتواصل.', 'error'); setBusy(false); return; }
    try {
      const response=await fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||'تعذر إرسال الرسالة.');
      toast(data.message || 'تم إرسال رسالتك بنجاح.', 'success');
      setForm({customerName:'',phone:'',email:'',subject:'',message:''}); onSuccess?.();
    } catch(error) { toast(error instanceof Error?error.message:'حدث خطأ غير متوقع.', 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <label className="grid gap-1 text-sm font-semibold">الاسم<input required minLength={2} maxLength={160} value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-semibold">رقم الهاتف<input type="tel" maxLength={20} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label><label className="grid gap-1 text-sm font-semibold">البريد الإلكتروني<input type="email" maxLength={255} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label></div>
    <label className="grid gap-1 text-sm font-semibold">عنوان الرسالة (اختياري)<input maxLength={180} value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label>
    <label className="grid gap-1 text-sm font-semibold">الرسالة<textarea required minLength={5} maxLength={3000} rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="rounded-xl border border-slate-300 p-3 font-normal" /></label>
    <p className="text-xs text-slate-500">أدخل رقم هاتف أو بريدًا إلكترونيًا واحدًا على الأقل حتى نتمكن من الرد عليك.</p>
    <button disabled={busy} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-60">{busy?'جارٍ الإرسال...':'إرسال الرسالة'}</button>
  </form>;
}
