import Link from 'next/link';
import { redirect } from 'next/navigation';
import { count, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories, customerMessages, orders, products, productRequests } from '@/db/schema';
import { getCurrentAdmin } from '@/lib/auth/session';
export const dynamic = 'force-dynamic';
export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin(); if (!admin) redirect('/admin/login');
  const [[productCount],[categoryCount],[orderCount],[pendingCount],[lowStockCount],[newRequestCount],[unreadMessageCount]] = await Promise.all([
    db.select({value:count()}).from(products).where(eq(products.isActive,true)),
    db.select({value:count()}).from(categories).where(eq(categories.isActive,true)),
    db.select({value:count()}).from(orders),
    db.select({value:count()}).from(orders).where(eq(orders.status,'pending')),
    db.select({value:count()}).from(products).where(sql`${products.isActive} = true AND ${products.quantity} <= ${products.lowStockThreshold}`),
    db.select({value:count()}).from(productRequests).where(eq(productRequests.status,'new')),
    db.select({value:count()}).from(customerMessages).where(eq(customerMessages.status,'unread')),
  ]);
  const links = [
    ['/admin/dashboard/products','إدارة المنتجات','إضافة وتعديل وإخفاء المنتجات'],
    ['/admin/dashboard/categories','التصنيفات','إدارة تصنيفات المتجر'],
    ['/admin/dashboard/orders','الطلبات','مراجعة الطلبات وتحديث حالاتها'],
    ['/admin/dashboard/inventory','المخزون','تعديل الأرصدة ومراجعة سجل الحركات'],
    ['/admin/dashboard/requests','طلبات المنتجات','متابعة طلبات المنتجات غير المتوفرة'],
    ['/admin/dashboard/messages','رسائل العملاء','قراءة الرسائل وتسجيل الردود'],
  ];
  return <main className="mx-auto max-w-6xl px-4 py-8" dir="rtl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-gray-500">مرحبًا، {admin.fullName}</p><h1 className="text-3xl font-bold">لوحة تحكم صيدليتي</h1></div></div><section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{[['المنتجات',productCount.value],['التصنيفات',categoryCount.value],['كل الطلبات',orderCount.value],['طلبات جديدة',pendingCount.value],['مخزون منخفض',lowStockCount.value],['طلبات منتجات جديدة',newRequestCount.value],['رسائل غير مقروءة',unreadMessageCount.value]].map(([label,value])=><div key={String(label)} className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</section><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{links.map(([href,title,desc])=><Link href={href} key={href} className="rounded-2xl border bg-white p-6 transition hover:border-indigo-300 hover:shadow-sm"><h2 className="mb-2 text-xl font-bold">{title}</h2><p className="text-sm text-gray-500">{desc}</p><span className="mt-5 inline-block text-sm font-semibold text-indigo-700">فتح الإدارة ←</span></Link>)}</section></main>;
}
