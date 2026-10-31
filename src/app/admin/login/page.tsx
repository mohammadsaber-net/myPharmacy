'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تسجيل الدخول');
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page" dir="rtl">
      <div className="admin-login-decoration admin-login-decoration-one" />
      <div className="admin-login-decoration admin-login-decoration-two" />
      <section className="admin-login-card">
        <Link href="/" className="admin-login-brand"><span className="admin-brand-mark">ص</span><span><strong>صيدليتي</strong><small>بوابة الإدارة</small></span></Link>
        <div className="admin-login-heading">
          <span className="admin-login-kicker">مرحبًا بعودتك</span>
          <h1>تسجيل دخول الإدارة</h1>
          <p>سجّل الدخول لإدارة المنتجات والطلبات والمخزون ورسائل العملاء.</p>
        </div>
        <form onSubmit={submit} className="admin-login-form">
          <label htmlFor="admin-email">البريد الإلكتروني</label>
          <input id="admin-email" type="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="username" />
          <label htmlFor="admin-password">كلمة المرور</label>
          <input id="admin-password" type="password" required maxLength={200} value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" autoComplete="current-password" />
          {error && <p role="alert" className="admin-login-error">{error}</p>}
          <button disabled={busy} type="submit">{busy ? 'جارٍ التحقق...' : 'دخول إلى لوحة التحكم'}</button>
        </form>
        <p className="admin-login-footnote">هذه المنطقة مخصصة لمسؤولي الصيدلية فقط.</p>
      </section>
    </main>
  );
}
