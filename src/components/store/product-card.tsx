"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatEGP, discountedPrice } from '@/lib/money';
import { AddToCartButton } from './add-to-cart';
import { useStoreUi } from './store-ui-context';

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    scientificName?: string;
    englishName?: string;
    slug: string;
    description: string | null;
    price: string;
    discount: string;
    quantity: number;
    requiresPrescription: boolean;
    imageUrl: string | null;
    images?: { id: string; imageUrl: string; isPrimary: boolean }[];
    categoryName: string | null;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const finalPrice = discountedPrice(product.price, product.discount);
  const { openModal, toast } = useStoreUi();
  const router = useRouter();
  const [checkingAlternatives, setCheckingAlternatives] = useState(false);
  async function findAlternatives() {
    const scientificName = product.scientificName?.trim();
    console.log("scientificName", scientificName)
    if (!scientificName) {
      toast('لا يوجد اسم علمي مسجل لهذا المنتج للبحث عن بدائل.', 'info');
      return; 
    }
    setCheckingAlternatives(true);
    try {
      const response = await fetch(`/api/products/alternatives?scientificName=${encodeURIComponent(scientificName)}&excludeId=${encodeURIComponent(product.id)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعذر البحث عن البدائل.');
      if (!result.hasAlternatives) 
        { 
          toast('لا توجد بدائل متوفرة لهذا الصنف حاليًا', 'info'); 
          return; 
        }
      router.push(`/products?alternative=${encodeURIComponent(scientificName)}&exclude=${encodeURIComponent(product.id)}`);
    } catch (error) { toast(error instanceof Error ? error.message : 'تعذر البحث عن البدائل.', 'error'); }
    finally { setCheckingAlternatives(false); }
  }
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gray-100 transition hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100">
          {(product.images?.find((image) => image.isPrimary)?.imageUrl || product.imageUrl) ? (
            <Image src={product.images?.find((image) => image.isPrimary)?.imageUrl || product.imageUrl!} alt={product.name} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" unoptimized className="object-contain p-5" />
          ) : (
            <span className="text-5xl text-emerald-700" aria-hidden="true">✚</span>
          )}
          {product.images && product.images.length > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">{product.images.length} صور</span>}
          {+product.discount > 0 && <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">خصم {product.discount}%</span>}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {product.categoryName && <span className="mb-2 text-xs font-semibold text-emerald-700">{product.categoryName}</span>}
          <h3 className="font-bold leading-6 text-slate-900">{product.name}</h3>
          {/* {product.scientificName && <p className="mt-1 text-xs text-slate-600">الاسم العلمي: {product.scientificName}</p>}
          {product.englishName && <p className="mt-1 text-xs text-slate-500" dir="ltr">{product.englishName}</p>} */}
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">{product.description || 'منتج متاح من صيدليتي.'}</p>
          {product.requiresPrescription && <span className="mt-3 text-xs font-semibold text-amber-700">يتطلب مراجعة الصيدلي والوصفة عند اللزوم</span>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-emerald-800">{formatEGP(finalPrice)}</span>
            {+product.discount > 0 && <span className="text-xs text-slate-400 line-through">{formatEGP(product.price)}</span>}
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
        <span className={`text-xs font-semibold ${product.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {product.quantity > 0 ? 'متوفر' : 'غير متوفر حاليًا'}
        </span>
        <div >
          {product.quantity > 0 ? 
           <AddToCartButton 
          item={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: finalPrice,
            imageUrl: product.images?.find((image) => image.isPrimary)?.imageUrl || product.imageUrl,
            requiresPrescription: product.requiresPrescription,
          }}/>:<button type="button"
          className='rounded-lg bg-amber-500 text-white px-3 py-2.5 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
          onClick={() => {openModal('request'); }}>اطلب المنتج </button>}
        </div>
        <button 
        type="button" 
        disabled={checkingAlternatives}
        onClick={findAlternatives} 
        className="w-full rounded-xl border !block border-emerald-700 px-3 py-2 text-xs font-bold
         text-emerald-800 transition hover:bg-emerald-50 disabled:opacity-60 sm:w-auto
         ">{checkingAlternatives ? 'جارٍ البحث...' : 'بدائل هذا الصنف'}
         </button>
      </div>
    </article>
  );
}
