import Image from 'next/image';
import Link from 'next/link';
import { formatEGP, discountedPrice } from '@/lib/money';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    discount: string;
    quantity: number;
    requiresPrescription: boolean;
    imageUrl: string | null;
    categoryName: string | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const finalPrice = discountedPrice(product.price, product.discount);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" unoptimized className="object-contain p-5" />
          ) : (
            <span className="text-5xl text-emerald-700" aria-hidden="true">✚</span>
          )}
          {product.discount !== '0' && <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">خصم {product.discount}%</span>}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {product.categoryName && <span className="mb-2 text-xs font-semibold text-emerald-700">{product.categoryName}</span>}
          <h3 className="font-bold leading-6 text-slate-900">{product.name}</h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">{product.description || 'منتج متاح من صيدليتي.'}</p>
          {product.requiresPrescription && <span className="mt-3 text-xs font-semibold text-amber-700">يتطلب مراجعة الصيدلي والوصفة عند اللزوم</span>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-emerald-800">{formatEGP(finalPrice)}</span>
            {product.discount !== '0' && <span className="text-xs text-slate-400 line-through">{formatEGP(product.price)}</span>}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <span className={`text-xs font-semibold ${product.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {product.quantity > 0 ? 'متوفر' : 'غير متوفر حاليًا'}
        </span>
      </div>
    </article>
  );
}
