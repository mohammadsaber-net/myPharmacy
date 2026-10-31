import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth/session';
import ProductsManager from '@/components/admin/products-manager';
export const dynamic='force-dynamic';
export default async function ProductsPage(){if(!await getCurrentAdmin())redirect('/admin/login');return <main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-6 flex items-center justify-between"><div><Link href="/admin/dashboard" className="text-sm text-indigo-700">← لوحة التحكم</Link><h1 className="mt-2 text-3xl font-bold">إدارة المنتجات</h1></div></div><ProductsManager/></main>}
