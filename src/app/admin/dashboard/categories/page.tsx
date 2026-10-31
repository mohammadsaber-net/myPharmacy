import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth/session';
import CategoriesManager from '@/components/admin/categories-manager';
export const dynamic='force-dynamic';
export default async function CategoriesPage(){if(!await getCurrentAdmin())redirect('/admin/login');return <main className="mx-auto max-w-6xl px-4 py-8"><Link href="/admin/dashboard" className="text-sm text-indigo-700">← لوحة التحكم</Link><h1 className="my-3 text-3xl font-bold">إدارة التصنيفات</h1><CategoriesManager/></main>}
