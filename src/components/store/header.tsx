import Link from 'next/link';

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <span className="block text-2xl font-black text-emerald-700">صيدليتي</span>
          <span className="text-xs text-slate-500">رعايتك أقرب</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold sm:gap-5 sm:text-sm">
          <Link className="text-slate-700 transition hover:text-emerald-700" href="/products">المنتجات</Link>
          <Link className="text-slate-700 transition hover:text-emerald-700" href="/requests">اطلب منتجًا</Link>
          <Link className="text-slate-700 transition hover:text-emerald-700" href="/contact">تواصل معنا</Link>
          <Link className="rounded-xl bg-emerald-700 px-4 py-2.5 text-white transition hover:bg-emerald-800" href="/cart">السلة</Link>
        </nav>
      </div>
    </header>
  );
}
