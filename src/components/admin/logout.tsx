'use client';
import { useRouter } from 'next/navigation';
export default function AdminLogout() {
 const router=useRouter();
 return <button onClick={async()=>{await fetch('/api/admin/auth/logout',{method:'POST'});router.replace('/admin/login');router.refresh();}} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">تسجيل الخروج</button>;
}
