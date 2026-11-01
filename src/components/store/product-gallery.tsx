'use client';

import Image from 'next/image';
import { useState } from 'react';

type GalleryImage = { id: string; imageUrl: string; altText: string | null; isPrimary: boolean };

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, images.findIndex((image) => image.isPrimary)));
  const activeImage = images[activeIndex] || images[0];
  return <div className="min-w-0">
    <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-100 sm:min-h-[420px]">
      {activeImage ? <Image src={activeImage.imageUrl} alt={activeImage.altText || productName} width={900} height={900} priority unoptimized className="max-h-[420px] w-full object-contain p-5 sm:p-8" /> : <span className="text-7xl text-emerald-700">✚</span>}
      {images.length > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-600">{activeIndex + 1} / {images.length}</span>}
    </div>
    {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
      {images.map((image, index) => <button key={image.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={activeIndex === index} className={`relative overflow-hidden rounded-xl border bg-white p-1 transition ${activeIndex === index ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-emerald-300'}`}>
        <Image src={image.imageUrl} alt={image.altText || `${productName} - صورة ${index + 1}`} width={120} height={100} unoptimized className="h-16 w-full object-contain sm:h-20" />
      </button>)}
    </div>}
  </div>;
}
