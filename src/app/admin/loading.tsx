export default function Loading() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6" aria-busy="true" aria-label="جارٍ التحميل"><div className="w-full max-w-md space-y-5 rounded-3xl border bg-white p-8"><div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-slate-100" /><div className="mx-auto h-7 w-48 animate-pulse rounded bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></div></main>;
}
