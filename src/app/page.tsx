import { Suspense } from 'react';
import Link from 'next/link';
import { desc, eq, inArray } from 'drizzle-orm';
import { StoreHeader } from '@/components/store/header';
import { ProductCard } from '@/components/store/product-card';
import { StoreFooter } from '@/components/store/footer';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';
import { AnimatedHeroTitle } from '@/components/store/AnimatedHeroTitel';
import HeroProductSearch from '@/components/store/hero-product-search';

export const dynamic = 'force-dynamic';

function CategorySkeleton() {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
}

function ProductSkeleton() {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-[4/3] animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" /><div className="h-3 w-full animate-pulse rounded bg-slate-100" /><div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" /></div></div>)}</div>;
}

async function HomeCategories() {
  try {
    const categoryRows = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name);
    return categoryRows.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{categoryRows.map((category) => <Link key={category.id} href={`/products?category=${category.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"><span className="text-2xl text-emerald-700">✚</span><h3 className="mt-3 font-bold">{category.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{category.description}</p></Link>)}</div> : <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">لا توجد تصنيفات نشطة حاليًا.</p>;
  } catch {
    return <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">تعذر تحميل التصنيفات حاليًا.</p>;
  }
}

async function HomeProducts() {
  try {
    const productRows = await db.select({
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
      .where(eq(products.isActive, true)).orderBy(desc(products.createdAt)).limit(8);
    const imageRows = productRows.length
      ? await db.select({ id: productImages.id, productId: productImages.productId, imageUrl: productImages.imageUrl, isPrimary: productImages.isPrimary }).from(productImages).where(inArray(productImages.productId, productRows.map((product) => product.id))).orderBy(productImages.sortOrder)
      : [];
    const imagesByProduct = new Map<string, typeof imageRows>();
    for (const image of imageRows) imagesByProduct.set(image.productId, [...(imagesByProduct.get(image.productId) || []), image]);
    const productsWithImages = productRows.map((product) => {
      const images = imagesByProduct.get(product.id) || [];
      return { ...product, images, imageUrl: images.find((image) => image.isPrimary)?.imageUrl || images[0]?.imageUrl || null };
    });
    return productRows.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">{productsWithImages.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="font-bold">لسه مفيش منتجات مضافة</h3><p className="mt-2 text-sm text-slate-500">ستظهر المنتجات هنا بعد إضافتها من لوحة إدارة الصيدلية.</p></div>;
  } catch {
    return <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">تعذر تحميل المنتجات حاليًا. حاول تحديث الصفحة.</p>;
  }
}
export default function HomePage() {
  return <><StoreHeader />
  <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-700 px-6 py-12 text-white sm:px-12 sm:py-16">
      <div className="max-w-2xl">
        <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold"
        >أهلًا بك في صيدلية د/ محمد صابر</span>
        <AnimatedHeroTitle />
        <p className="mt-5 max-w-xl leading-8 text-emerald-50"
        >تصفح المنتجات المتاحة،
         أضف احتياجاتك إلى السلة، وسنراجع طلبك ونتواصل معك لتأكيد التوصيل.
         </p>
          <HeroProductSearch/>
         <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/products" className="rounded-xl bg-white px-6 py-3 font-bold text-emerald-900 hover:bg-emerald-50">تصفح المنتجات
          </Link>
          <Link href="/cart" className="rounded-xl border border-white/50 px-6 py-3 font-bold text-white hover:bg-white/10"
          >عرض السلة</Link>
          </div>
          <p className="mt-6 text-sm text-emerald-100"
          >الدفع نقدًا عند الاستلام · تأكيد التوصيل هاتفيًا
          </p>
          </div>
    </section>
    <section className="mt-12"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700">تسوق حسب احتياجك</p><h2 className="mt-1 text-2xl font-black">التصنيفات</h2></div><Link href="/products" className="text-sm font-bold text-emerald-700">كل المنتجات ←</Link></div><Suspense fallback={<CategorySkeleton />}><HomeCategories /></Suspense></section>
    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-bold text-emerald-700">اختيارات الصيدلية</p><h2 className="mt-1 text-2xl font-black">أحدث المنتجات</h2></div><Link href="/products" className="text-sm font-bold text-emerald-700">عرض الكل ←</Link></div><Suspense fallback={<ProductSkeleton />}><HomeProducts /></Suspense></section>
  </main><StoreFooter />
  </>;
}
