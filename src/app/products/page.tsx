import { Suspense } from 'react';
import Link from 'next/link';
import { and, asc, count, eq, ilike, inArray, or, ne, gt, sql } from 'drizzle-orm';
import { StoreHeader } from '@/components/store/header';
import { ProductCard } from '@/components/store/product-card';
import { StoreFooter } from '@/components/store/footer';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';
import OpenModel from '@/components/store/open-model';

type SearchParams = { q?: string; category?: string; page?: string; alternative?: string; exclude?: string };
type Props = { searchParams: Promise<SearchParams> };
export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;

async function CategoryFilters({ selected, q }: { selected: string; q: string }) {
  const rows = await db.select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name);
  const hrefFor = (slug: string) => {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (slug) query.set('category', slug);
    const suffix = query.toString();
    return suffix ? `/products?${suffix}` : '/products';
  };
  return <div className="mt-4 flex flex-wrap gap-2" aria-label="تصفية حسب التصنيف">
    <Link href={hrefFor('')} className={`rounded-full border px-4 py-2 text-sm font-semibold ${!selected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>كل التصنيفات</Link>
    {rows.map((category) => <Link key={category.id} href={hrefFor(category.slug)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selected === category.slug ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{category.name}</Link>)}
  </div>;
}

function ProductResultsSkeleton() {
  return <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" aria-busy="true" aria-label="جارٍ تحميل المنتجات">{Array.from({ length: 20 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white"><div className="aspect-[4/3] animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 animate-pulse rounded bg-slate-100" /><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" /></div></div>)}</div>;
}

async function ProductResults({ q, categorySlug, requestedPage, alternative, exclude }: { q: string; categorySlug: string; requestedPage: number; alternative: string; exclude: string }) {
  const conditions = [eq(products.isActive, true)];
  if (alternative) { conditions.push(sql`lower(${products.scientificName}) = lower(${alternative})`, gt(products.quantity, 0)); if (exclude) conditions.push(ne(products.id, exclude)); }
  if (q && !alternative) conditions.push(or(
    ilike(products.name, `%${q}%`),
    ilike(products.scientificName, `%${q}%`),
    ilike(products.englishName, `%${q}%`),
    ilike(products.description, `%${q}%`),
  )!);
  if (categorySlug && !alternative) {
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).limit(1);
    if (category) conditions.push(eq(products.categoryId, category.id));
    else conditions.push(eq(products.id, '00000000-0000-0000-0000-000000000000'));
  }

  const where = and(...conditions);
  const [totalRows] = await Promise.all([db.select({ total: count() }).from(products).where(where)]);
  const total = Number(totalRows[0]?.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const rows = await db.select({
    id: products.id,
    name: products.name,
    scientificName: products.scientificName,
    englishName: products.englishName,
    slug: products.slug,
    description: products.description,
    price: products.price,
    discount: products.discount,
    quantity: products.quantity,
    requiresPrescription: products.requiresPrescription,
    categoryName: categories.name,
  }).from(products).leftJoin(categories, eq(products.categoryId, categories.id))
    .where(where).orderBy(asc(products.name)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);

  const imageRows = rows.length
    ? await db.select({ id: productImages.id, productId: productImages.productId, imageUrl: productImages.imageUrl, isPrimary: productImages.isPrimary })
      .from(productImages).where(inArray(productImages.productId, rows.map((product) => product.id))).orderBy(productImages.sortOrder)
    : [];
  const imagesByProduct = new Map<string, typeof imageRows>();
  for (const image of imageRows) imagesByProduct.set(image.productId, [...(imagesByProduct.get(image.productId) || []), image]);
  const productsWithImages = rows.map((product) => {
    const images = imagesByProduct.get(product.id) || [];
    return { ...product, images, imageUrl: images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || null };
  });

  function pageHref(nextPage: number) {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (categorySlug) query.set('category', categorySlug);
    if (alternative) query.set('alternative', alternative);
    if (exclude) query.set('exclude', exclude);
    query.set('page', String(nextPage));
    return `/products?${query.toString()}`;
  }

  if (!rows.length) return <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
    <h2 className="font-bold">
      {alternative ? 'لا توجد بدائل متوفرة حاليًا لهذا الصنف' :
       'لا توجد منتجات مطابقة'}</h2>
       <p className="mt-2 text-sm text-slate-500">
        {q ? 'جرّب كلمة بحث مختلفة.' : 'لم تتم إضافة منتجات لهذا التصنيف بعد.'}
        </p>
        <br/>
        او <OpenModel />
        <br/>
      <Link href="/products" className="mt-4 inline-block font-bold text-emerald-700"
      >عرض كل المنتجات
      </Link>
      </div>;
  return <>
    <div className="mt-7 flex items-center justify-between text-sm text-slate-500"><span>{total} منتج</span><span>يعرض {rows.length} منتجًا في الصفحة</span></div>
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">{productsWithImages.map((product) => <ProductCard key={product.id} product={product} />)}</div>
    <div className="mt-9 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4" dir="rtl">
      <span className="text-sm text-slate-500">صفحة {page} من {totalPages} · عرض {rows.length} من {total} منتج</span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">السابق</Link> : <span aria-disabled="true" className="cursor-not-allowed rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-300">السابق</span>}
        {page < totalPages ? <Link href={pageHref(page + 1)} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">التالي</Link> : <span aria-disabled="true" className="cursor-not-allowed rounded-xl bg-emerald-200 px-5 py-2.5 text-sm font-bold text-white">التالي</span>}
      </div>
    </div>
  </>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const categorySlug = params.category ?? '';
  const requestedPage = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const alternative = params.alternative?.trim() || '';
  const exclude = params.exclude || '';

  return <><StoreHeader /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link href="/" className="text-sm font-semibold text-emerald-700">الرئيسية</Link>
    <div className="mt-3"><h1 className="text-3xl font-black">{alternative ? `بدائل الصنف: ${alternative}` : 'كل المنتجات'}</h1><p className="mt-2 text-sm text-slate-500">{alternative ? 'المنتجات المتاحة التي تحمل نفس الاسم العلمي.' : 'ابحث بالاسم التجاري أو العلمي أو الإنجليزي كما مدون علي العبوة، أو اختر تصنيفًا.'}</p></div>
    <form action="/products" className={`mt-6 flex flex-col gap-3 sm:flex-row ${alternative ? 'hidden' : ''}`}>
      <input name="q" defaultValue={q} placeholder="ابحث باسم المنتج أو الاسم العلمي أو الإنجليزي..." className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600" />
      {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
      <button className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white hover:bg-emerald-800">بحث</button>
    </form>
    <Suspense fallback={<div className="mt-4 h-10 animate-pulse rounded-xl bg-slate-100" />}>{!alternative && <CategoryFilters selected={categorySlug} q={q} />}</Suspense>
    <Suspense fallback={<ProductResultsSkeleton />}><ProductResults q={q} categorySlug={categorySlug} requestedPage={requestedPage} alternative={alternative} exclude={exclude} /></Suspense>
  </main><StoreFooter /></>;
}
