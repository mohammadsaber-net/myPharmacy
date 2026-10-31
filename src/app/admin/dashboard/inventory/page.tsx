import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/session';
import InventoryManager from '@/components/admin/inventory-manager';
export const dynamic='force-dynamic';
export default async function InventoryPage(){if(!await getCurrentAdmin())redirect('/admin/login');return <main className="mx-auto max-w-7xl px-4 py-8"><Link href="/admin/dashboard" className="text-sm text-indigo-700">← لوحة التحكم</Link><h1 className="my-3 text-3xl font-bold">إدارة المخزون</h1><p className="mb-6 text-sm text-slate-500">كل تعديل يسجل في سجل حركة المخزون، ولا يسمح برصيد سالب.</p><InventoryManager/></main>}
