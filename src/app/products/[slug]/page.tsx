import { asc, and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { StoreHeader } from '@/components/store/header';
import { ProductGallery } from '@/components/store/product-gallery';
import { AddToCartButton } from '@/components/store/add-to-cart';
import { StoreFooter } from '@/components/store/footer';
import { db } from '@/db';
import { categories, products, productImages } from '@/db/schema';
import { discountedPrice, formatEGP } from '@/lib/money';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<import('next').Metadata> {
  const { slug } = await params;
  const [product] = await db.select({ name: products.name, description: products.description, slug: products.slug })
    .from(products).where(and(eq(products.slug, slug), eq(products.isActive, true))).limit(1);
  if (!product) return { title: 'المنتج غير موجود' };
  const description = product.description?.slice(0, 155) || `تعرّف على ${product.name} من صيدليتي. راجع تفاصيل المنتج والتوفر قبل إرسال طلبك.`;
  return { title: product.name, description, alternates: { canonical: `/products/${product.slug}` }, openGraph: { title: product.name, description, type: 'website' } };
}
export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const [product] = await db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, price: products.price, discount: products.discount, quantity: products.quantity, requiresPrescription: products.requiresPrescription, categoryName: categories.name })
    .from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(and(eq(products.slug, slug), eq(products.isActive, true))).limit(1);
  if (!product) notFound();
  const images = await db.select({ id: productImages.id, imageUrl: productImages.imageUrl, altText: productImages.altText, isPrimary: productImages.isPrimary }).from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder));
  const primaryImage = images.find((image) => image.isPrimary) || images[0];
  const finalPrice = discountedPrice(product.price, product.discount);
  return <><StoreHeader /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500"><Link href="/">الرئيسية</Link><span>/</span><Link href="/products">المنتجات</Link><span>/</span><span>{product.name}</span></div><div className="grid gap-7 rounded-3xl border border-slate-200 bg-white p-4 sm:p-7 md:grid-cols-2"><ProductGallery images={images} productName={product.name} /><div className="flex flex-col justify-center"><span className="text-sm font-bold text-emerald-700">{product.categoryName || 'منتجات صيدليتي'}</span><h1 className="mt-3 text-3xl font-black">{product.name}</h1><p className="mt-4 leading-8 text-slate-600">{product.description || 'منتج متاح من صيدليتي. لمزيد من التفاصيل، يمكنك التواصل مع الصيدلية.'}</p><div className="mt-6 flex items-center gap-3"><strong className="text-2xl text-emerald-800">{formatEGP(finalPrice)}</strong>{product.discount !== '0' && <span className="text-slate-400 line-through">{formatEGP(product.price)}</span>}</div><p className={`mt-3 text-sm font-semibold ${product.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{product.quantity > 0 ? `متوفر (${product.quantity})` : 'غير متوفر حاليًا'}</p>{product.requiresPrescription && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">هذا المنتج يتطلب مراجعة الصيدلي والتحقق من الوصفة الطبية عند اللزوم. لا يمكن إتمام طلبه مباشرة من الموقع.</p>}<div className="mt-7"><AddToCartButton disabled={product.quantity < 1 || product.requiresPrescription} item={{ productId: product.id, slug: product.slug, name: product.name, price: finalPrice, imageUrl: primaryImage?.imageUrl || null, requiresPrescription: product.requiresPrescription }} /></div><p className="mt-4 text-xs leading-5 text-slate-500">السعر والتوفر يخضعان للتأكيد من الصيدلية عند مراجعة الطلب.</p></div></div></main><StoreFooter /></>;
}
