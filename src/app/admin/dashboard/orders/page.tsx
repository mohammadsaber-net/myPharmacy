import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth/session';
import OrdersManager from '@/components/admin/orders-manager';
export const dynamic='force-dynamic';
export default async function OrdersPage(){if(!await getCurrentAdmin())redirect('/admin/login');return <main className="mx-auto max-w-7xl px-4 py-8"><Link href="/admin/dashboard" className="text-sm text-indigo-700">← لوحة التحكم</Link><h1 className="my-3 text-3xl font-bold">إدارة الطلبات</h1><OrdersManager/></main>}
