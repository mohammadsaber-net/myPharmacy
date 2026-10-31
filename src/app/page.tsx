import Link from 'next/link';
import { desc, eq, and } from 'drizzle-orm';
import { StoreHeader } from '@/components/store/header';
import { ProductCard } from '@/components/store/product-card';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categoryRows, productRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder, categories.name),
    db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, price: products.price, discount: products.discount, quantity: products.quantity, requiresPrescription: products.requiresPrescription, imageUrl: productImages.imageUrl, categoryName: categories.name })
      .from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true)))
      .where(eq(products.isActive, true)).orderBy(desc(products.createdAt)).limit(8),
  ]);

  return <><StoreHeader /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <section className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-emerald-900 via-emerald-800 to-teal-700 px-6 py-12 text-white sm:px-12 sm:py-16">
      <div className="max-w-2xl"><span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">أهلًا بك في صيدليتي</span><h1 className="mt-6 text-4xl leading-tight font-black sm:text-5xl">رعايتك أقرب، واحتياجاتك أسهل</h1><p className="mt-5 max-w-xl leading-8 text-emerald-50">تصفح المنتجات المتاحة، أضف احتياجاتك إلى السلة، وسنراجع طلبك ونتواصل معك لتأكيد التوصيل.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/products" className="rounded-xl bg-white px-6 py-3 font-bold text-emerald-900 hover:bg-emerald-50">تصفح المنتجات</Link><Link href="/cart" className="rounded-xl border border-white/50 px-6 py-3 font-bold text-white hover:bg-white/10">عرض السلة</Link></div><p className="mt-6 text-sm text-emerald-100">الدفع نقدًا عند الاستلام · تأكيد التوصيل هاتفيًا</p></div>
    </section>
    <section className="mt-12"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700">تسوق حسب احتياجك</p><h2 className="mt-1 text-2xl font-black">التصنيفات</h2></div><Link href="/products" className="text-sm font-bold text-emerald-700">كل المنتجات ←</Link></div>
      {categoryRows.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{categoryRows.map((category) => <Link key={category.id} href={`/products?category=${category.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"><span className="text-2xl text-emerald-700">✚</span><h3 className="mt-3 font-bold">{category.name}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{category.description}</p></Link>)}</div> : <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">لا توجد تصنيفات نشطة حاليًا.</p>}
    </section>
    <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-bold text-emerald-700">اختيارات الصيدلية</p><h2 className="mt-1 text-2xl font-black">أحدث المنتجات</h2></div><Link href="/products" className="text-sm font-bold text-emerald-700">عرض الكل ←</Link></div>
      {productRows.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{productRows.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><h3 className="font-bold">لسه مفيش منتجات مضافة</h3><p className="mt-2 text-sm text-slate-500">التصنيفات جاهزة. ستظهر المنتجات هنا بعد إضافتها من لوحة إدارة الصيدلية.</p></div>}
    </section>
    <footer className="mt-16 border-t border-slate-200 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} صيدليتي — جميع الحقوق محفوظة</footer>
  </main></>;
}
