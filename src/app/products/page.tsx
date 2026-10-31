import Link from 'next/link';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { StoreHeader } from '@/components/store/header';
import { ProductCard } from '@/components/store/product-card';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';

type Props = { searchParams: Promise<{ q?: string; category?: string }> };
export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const categorySlug = params.category ?? '';
  const conditions = [eq(products.isActive, true)];
  if (q) conditions.push(or(ilike(products.name, `%${q}%`), ilike(products.description, `%${q}%`))!);
  if (categorySlug) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (category) conditions.push(eq(products.categoryId, category.id));
    else conditions.push(eq(products.id, '00000000-0000-0000-0000-000000000000'));
  }
  const [rows, categoryRows] = await Promise.all([
    db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, price: products.price, discount: products.discount, quantity: products.quantity, requiresPrescription: products.requiresPrescription, imageUrl: productImages.imageUrl, categoryName: categories.name })
      .from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))).where(and(...conditions)).orderBy(asc(products.name)),
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name),
  ]);
  return <><StoreHeader /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Link href="/" className="text-sm font-semibold text-emerald-700">الرئيسية</Link><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">كل المنتجات</h1><p className="mt-2 text-sm text-slate-500">ابحث عن المنتج أو اختر تصنيفًا.</p></div><span className="text-sm text-slate-500">{rows.length} منتج</span></div>
    <form action="/products" className="mt-6 flex flex-col gap-3 sm:flex-row"><input name="q" defaultValue={q} placeholder="ابحث باسم المنتج..." className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600"/><select name="category" defaultValue={categorySlug} className="rounded-xl border border-slate-300 bg-white px-4 py-3"><option value="">كل التصنيفات</option>{categoryRows.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select><button className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800">بحث</button></form>
    {rows.length ? <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{rows.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="font-bold">لا توجد منتجات مطابقة</h2><p className="mt-2 text-sm text-slate-500">{q ? 'جرّب كلمة بحث مختلفة.' : 'لم تتم إضافة منتجات لهذا التصنيف بعد.'}</p><Link href="/products" className="mt-4 inline-block font-bold text-emerald-700">عرض كل المنتجات</Link></div>}
  </main></>;
}
