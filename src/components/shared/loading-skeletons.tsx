import { StoreHeader } from '@/components/store/header';
import { StoreFooter } from '@/components/store/footer';

export function StorePageLoading() {
  return <><StoreHeader /><main className="mx-auto min-h-[55vh] max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="جارٍ تحميل الصفحة"><div className="h-8 w-1/3 animate-pulse rounded-lg bg-slate-100" /><div className="h-36 animate-pulse rounded-3xl bg-slate-100" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-100"><div className="aspect-[4/3] animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 animate-pulse rounded bg-slate-100" /><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /></div></div>)}</div></main><StoreFooter /></>;
}

export function ProductListingLoading() {
  return <><StoreHeader /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="جارٍ تحميل المنتجات"><div className="h-4 w-24 animate-pulse rounded bg-slate-100" /><div className="mt-4 h-9 w-52 animate-pulse rounded bg-slate-100" /><div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px_110px]"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">{Array.from({ length: 20 }).map((_, index) => <div key={index} className="overflow-hidden rounded-2xl border border-slate-100"><div className="aspect-[4/3] animate-pulse bg-slate-100" /><div className="space-y-3 p-4"><div className="h-4 animate-pulse rounded bg-slate-100" /><div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" /></div></div>)}</div></main><StoreFooter /></>;
}

export function ProductDetailsLoading() {
  return <><StoreHeader /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="جارٍ تحميل المنتج"><div className="mb-6 h-4 w-48 animate-pulse rounded bg-slate-100" /><div className="grid gap-7 rounded-3xl border border-slate-100 bg-white p-4 sm:p-7 md:grid-cols-2"><div className="aspect-square animate-pulse rounded-2xl bg-slate-100" /><div className="space-y-5 py-4"><div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-9 w-3/4 animate-pulse rounded bg-slate-100" /><div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" /><div className="h-24 animate-pulse rounded bg-slate-100" /><div className="h-8 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div></div></main><StoreFooter /></>;
}

export function AdminContentLoading() {
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8" aria-busy="true" aria-label="جارٍ تحميل لوحة الإدارة"><div className="h-8 w-56 animate-pulse rounded bg-slate-100" /><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /></main>;
}

export function AdminProductsLoading() {
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8" aria-busy="true" aria-label="جارٍ تحميل إدارة المنتجات"><div className="h-8 w-56 animate-pulse rounded bg-slate-100" /><div className="grid gap-6 lg:grid-cols-[380px_1fr]"><div className="h-[620px] animate-pulse rounded-2xl bg-slate-100" /><div className="space-y-3 rounded-2xl border p-5">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />)}</div></div></main>;
}

export function InventoryLoading() {
  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8" aria-busy="true" aria-label="جارٍ تحميل المخزون"><div className="h-8 w-56 animate-pulse rounded bg-slate-100" /><div className="h-64 animate-pulse rounded-2xl bg-slate-100" /><div className="space-y-3 rounded-2xl border p-5">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}</div></main>;
}

export function FormPageLoading() {
  return <><StoreHeader /><main className="mx-auto max-w-4xl space-y-6 px-4 py-10" aria-busy="true" aria-label="جارٍ تحميل النموذج"><div className="h-9 w-56 animate-pulse rounded bg-slate-100" /><div className="space-y-4 rounded-2xl border bg-white p-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="space-y-2"><div className="h-4 w-1/4 animate-pulse rounded bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div>)}<div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div></main><StoreFooter /></>;
}

export function LegalPageLoading() {
  return <><StoreHeader /><main className="mx-auto max-w-4xl space-y-6 px-4 py-10" aria-busy="true" aria-label="جارٍ تحميل الصفحة"><div className="h-9 w-64 animate-pulse rounded bg-slate-100" />{Array.from({ length: 6 }).map((_, index) => <section key={index} className="space-y-3"><div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-4 animate-pulse rounded bg-slate-100" /><div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" /><div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" /></section>)}</main><StoreFooter /></>;
}

export function CartPageLoading() {
  return <><StoreHeader /><main className="mx-auto max-w-6xl space-y-6 px-4 py-10" aria-busy="true" aria-label="جارٍ تحميل السلة"><div className="h-9 w-48 animate-pulse rounded bg-slate-100" /><div className="grid gap-6 md:grid-cols-[1fr_320px]"><div className="space-y-3">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="flex gap-4 rounded-2xl border bg-white p-4"><div className="h-24 w-24 animate-pulse rounded-xl bg-slate-100" /><div className="flex-1 space-y-3"><div className="h-5 w-1/2 animate-pulse rounded bg-slate-100" /><div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" /></div></div>)}</div><div className="h-56 animate-pulse rounded-2xl bg-slate-100" /></div></main><StoreFooter /></>;
}
