'use client';
import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = { id: string; name: string; slug: string; sku: string | null; description: string | null; type: string; price: string; discount: string; quantity: number; lowStockThreshold: number; requiresPrescription: boolean; isActive: boolean; categoryId: string | null; categoryName: string | null; imageUrl: string | null };
type Category = { id: string; name: string };
const blank = { name: '', slug: '', sku: '', description: '', categoryId: '', type: 'medical_supply', price: '0', discount: '0', quantity: '0', lowStockThreshold: '5', requiresPrescription: false, isActive: true };

export default function ProductsManager() {
  const router = useRouter();
  const [rows, setRows] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [productsResponse, categoriesResponse] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/categories')]);
    if (productsResponse.status === 401 || categoriesResponse.status === 401) { router.replace('/admin/login'); return; }
    if (!productsResponse.ok || !categoriesResponse.ok) throw new Error('تعذر تحميل بيانات المنتجات والتصنيفات.');
    setRows(await productsResponse.json());
    setCats(await categoriesResponse.json());
  }, [router])

  useEffect(() => {
    void Promise.resolve().then(load).catch(() => setError('تعذر تحميل البيانات'));
  }, [load]);

  function change(key: keyof typeof blank, value: string | boolean) { setForm((old) => ({ ...old, [key]: value })); }
  function resetForm() { setEditing(null); setForm(blank); setImageFile(null); setRemoveImage(false); }
  function edit(product: Product) {
    setEditing(product.id);
    setForm({ name: product.name, slug: product.slug, sku: product.sku || '', description: product.description || '', categoryId: product.categoryId || '', type: product.type, price: product.price, discount: product.discount, quantity: String(product.quantity), lowStockThreshold: String(product.lowStockThreshold), requiresPrescription: product.requiresPrescription, isActive: product.isActive });
    setImageFile(null); setRemoveImage(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...form, sku: form.sku || null, categoryId: form.categoryId || null, price: Number(form.price), discount: Number(form.discount), quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold) };
      const response = await fetch(editing ? `/api/admin/products/${editing}` : '/api/admin/products', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ المنتج.');
      const productId = editing || data.id;
      if (removeImage && editing) {
        const imageResponse = await fetch(`/api/admin/products/${productId}/image`, { method: 'DELETE' });
        if (!imageResponse.ok) throw new Error('تم حفظ بيانات المنتج لكن تعذر حذف الصورة.');
      }
      if (imageFile) {
        const imageData = new FormData(); imageData.append('image', imageFile);
        const imageResponse = await fetch(`/api/admin/products/${productId}/image`, { method: 'POST', body: imageData });
        const imageResult = await imageResponse.json();
        if (!imageResponse.ok) throw new Error(`تم حفظ بيانات المنتج، لكن فشل رفع الصورة: ${imageResult.error || 'حاول مرة أخرى.'}`);
      }
      resetForm(); await load();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع.'); }
    finally { setBusy(false); }
  }

  async function hide(id: string) {
    if (!confirm('هل تريد إخفاء المنتج من المتجر؟')) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!response.ok) { const data = await response.json(); setError(data.error || 'تعذر الإخفاء'); }
    else await load();
  }

  const currentImage = rows.find((product) => product.id === editing)?.imageUrl;
  return <div className="grid gap-8 lg:grid-cols-[360px_1fr]" dir="rtl">
    <form onSubmit={submit} className="h-fit rounded-2xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? 'تعديل المنتج' : 'إضافة منتج'}</h2>{editing && <button type="button" onClick={resetForm} className="text-sm text-gray-500">إلغاء</button>}</div>
      <div className="grid gap-3">
        {([['name', 'اسم المنتج'], ['slug', 'الرابط المختصر بالإنجليزية'], ['sku', 'كود SKU اختياري'], ['price', 'السعر بالجنيه'], ['discount', 'الخصم %'], ['quantity', 'الكمية'], ['lowStockThreshold', 'حد التنبيه للمخزون']] as const).map(([key, label]) => <label key={key} className="grid gap-1 text-sm">{label}<input required={key !== 'sku'} value={String(form[key])} onChange={(event) => change(key, event.target.value)} className="rounded-lg border p-2" /></label>)}
        <label className="grid gap-1 text-sm">التصنيف<select value={form.categoryId} onChange={(event) => change('categoryId', event.target.value)} className="rounded-lg border p-2"><option value="">بدون تصنيف</option>{cats.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm">نوع المنتج<select value={form.type} onChange={(event) => change('type', event.target.value)} className="rounded-lg border p-2"><option value="medical_supply">مستلزم طبي</option><option value="cosmetics">عناية شخصية</option><option value="health_product">منتج صحي</option><option value="medicine">دواء</option></select></label>
        <label className="grid gap-1 text-sm">الوصف<textarea value={form.description} onChange={(event) => change('description', event.target.value)} className="rounded-lg border p-2" rows={3} /></label>
        <div className="grid gap-2 rounded-xl border border-dashed p-3">
          <label className="grid gap-1 text-sm font-semibold">صورة المنتج <span className="font-normal text-gray-500">JPG أو PNG أو WEBP أو AVIF — بحد أقصى 5 ميجابايت</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { setImageFile(event.target.files?.[0] || null); setRemoveImage(false); }} className="block w-full text-sm" /></label>
          {imageFile && <p className="text-xs text-emerald-700">الصورة المختارة: {imageFile.name}</p>}
          {editing && currentImage && !removeImage && <div className="flex items-center gap-3"> <Image src={currentImage} alt="الصورة الحالية للمنتج" width={72} height={72} unoptimized className="h-[72px] w-[72px] rounded-lg border object-contain"/><button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); }} className="text-xs text-red-700">حذف الصورة الحالية</button></div>}
          {removeImage && <p className="text-xs text-amber-700">سيتم حذف الصورة الحالية عند حفظ التعديلات.</p>}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.requiresPrescription} onChange={(event) => change('requiresPrescription', event.target.checked)} /> يتطلب وصفة/مراجعة صيدلي</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => change('isActive', event.target.checked)} /> المنتج نشط</label>
        <button disabled={busy} className="rounded-xl bg-indigo-600 p-3 font-semibold text-white disabled:opacity-60">{busy ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </div>
    </form>
    <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold">المنتجات ({rows.length})</h2></div><div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-gray-50"><tr>{['الصورة', 'المنتج', 'التصنيف', 'السعر', 'المخزون', 'الحالة', 'إجراء'].map((label) => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead><tbody>{rows.map((product) => <tr key={product.id} className="border-t"><td className="p-3">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} width={52} height={52} unoptimized className="h-[52px] w-[52px] rounded-lg object-contain" /> : <span className="text-xl text-emerald-700">✚</span>}</td><td className="min-w-40 p-3 font-semibold">{product.name}<small className="block text-gray-400">{product.slug}</small></td><td className="p-3">{product.categoryName || '—'}</td><td className="p-3">{product.price} ج.م</td><td className="p-3">{product.quantity}</td><td className="p-3">{product.isActive ? 'نشط' : 'مخفي'}</td><td className="whitespace-nowrap p-3"><button type="button" onClick={() => edit(product)} className="ml-2 text-indigo-700">تعديل</button><button type="button" onClick={() => hide(product.id)} className="text-red-700">إخفاء</button></td></tr>)}{!rows.length && <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد منتجات بعد</td></tr>}</tbody></table></div></section>
  </div>;
}
