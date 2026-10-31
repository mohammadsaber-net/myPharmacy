import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/session';
import MessagesManager from '@/components/admin/messages-manager';
export const dynamic='force-dynamic';
export default async function MessagesPage(){if(!await getCurrentAdmin())redirect('/admin/login');return <main className="mx-auto max-w-7xl px-4 py-8"><Link href="/admin/dashboard" className="text-sm text-indigo-700">← لوحة التحكم</Link><h1 className="my-3 text-3xl font-bold">رسائل العملاء</h1><MessagesManager/></main>}
